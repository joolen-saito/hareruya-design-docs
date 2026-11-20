/**
 * B06-01 買取自動入庫バッチのシードの作り方。値はシード表（integration_test/casegen/cases/B06-01_seed_data.tsv）の状態・属性のとおり。
 *
 * 2回に分けて流す形（依頼者決定 2026-11-20「B06-01・B08-04 は、毎日の自動の実行を待つ形で書く」）:
 * - このバッチ（アプリのコンソールのコマンド）は、E2E から起動する入口が無い。開発環境では、バッチの環境が毎日 15:00（日本時間）に自動で流す
 *   （DB の在庫履歴の登録元「買取自動入庫バッチ」の行が、11/12〜11/19 の毎日 06:00 UTC にできている）。
 * - 準備の回: 入庫待ちの店頭買取と入庫先の在庫を作り、作ったものを .runs/b06_01_prep.json に控えて、手順1で止める（未判定・バッチ未実行）。
 * - 確かめの回: 控えたものを使い回す（作り直さない）。控えた時刻より後に、バッチが必要な回数（026・031 は2回、ほかは1回）流れたことを
 *   手順1で確かめてから、手順3以降を画面で確かめる。流れていなければ、手順1で止める（未判定・バッチ未実行）。
 * - 手順1「試験者が実行する」と手順2「バッチの実行一覧で成功を待つ」は、自動の実行を待つことに読み替える（正本の外の補い）。
 *   バッチの実行一覧の画面は無いので、実行の時刻はバッチが書いた在庫履歴の行の登録日時で見る（ほかの方の買取の分も含む）。
 *
 * シードでの解釈（正本の外の補い）:
 * - 店舗「TC東京2F」は、試験店舗の使い回し（依頼者決定 2026-11-13）で作らず、試験支店に読み替える。「本店」は本店（店舗ID 1）。
 * - 管理者は決まった印（rcFixed）を付けて1度だけ作る。権限グループはシステム管理者（在庫管理・買取管理を操作できる）。
 * - 店頭買取は、試験支店のフロントの店頭買取査定申込（会員登録なし）で作る。申込者の姓に実行の印を付ける。シード表の会員は作らない
 *   （バッチは申込者を見ない）。店頭買取ID・査定ID・商品ID などの決め打ちの番号は使わず、画面が振った番号を使う。
 * - 実在庫の明細（MTGBuyer の査定で付く行。管理画面に登録の手段が無い）と、ステータス（入庫待ち・入庫済み）・金額は、E2E の受注にだけ DB で書く。
 *   入庫待ちは画面で選ぶと入庫の処理が動くため、DB で書く。
 * - 商品は、グッズ商品CSV登録で作る（商品コード・商品名に実行の印）。入庫先の EC-CUBE 在庫の在庫数・総原価は、E2E の商品の行にだけ DB で書く。
 *   シード表の「在庫履歴は0件」を守るため（画面の入庫は在庫履歴を1行作る）。
 * - 「入庫待ちの店頭買取情報とネット買取情報はこの1件以外0件」と「他の入庫待ちの買取情報は入庫済み等へ変えておく」は、しない
 *   （ほかの方の買取を書き換えることになる）。バッチは、ほかの方の入庫待ちの買取も入庫する。ケースは E2E の商品・買取だけを見るので、結果は変わらない。
 * - シード表のステータス「12: 入庫待ち」は、マスタの番号では 13 が「入庫待ち」（12 は「未登録在庫あり」）。名称の「入庫待ち」に合わせる。
 */
import fs from "node:fs";
import path from "node:path";
import { SETUP_ADMIN } from "../config/env";
import { 在庫履歴の数, 実在庫の明細, 実在庫の明細を足す, 自動入庫バッチの実行, 受注のステータスID, 受注のステータスと金額を書く, 商品コードの規格ID, 姓の受注, 店舗のEC在庫, 入庫先の在庫を書く } from "../db/b06_01";
import { rc, rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedBuilder } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { ensureMemberFixed } from "../pages/admin/member";
import { 試験支店 } from "../pages/admin/reuse_store";
import { 店舗読み替えの注記, 試験支店ID, 試験店舗の名前を読む } from "../pages/admin/test_store";
import { カード商品を作る } from "./a06-buying";
import { 申込を行う, 申込者の } from "./m06-common";

/** S-B06-01-L-ADM（パスワードは開発環境のメンバー登録の決まり＝12文字以上を満たす） */
export const B0601_ADM: Account & { 名前: string } = { loginId: rcFixed("b0601l_admin").toLowerCase(), password: "Passw0rd!B0601L", 名前: rcFixed("B06-01連携試験管理者") };

const 控えのファイル = path.resolve(__dirname, "..", ".runs", "b06_01_prep.json");

/** 準備の回で作ったもの（確かめの回で使い回す） */
export type 準備 = { 作った日時: string; 受注ID: string; 査定ID: string; 姓: string; 商品コード: string; 規格ID: string; ステータスID: string };

function 控えを読む(): Record<string, 準備> {
  try { return JSON.parse(fs.readFileSync(控えのファイル, "utf-8")) as Record<string, 準備>; } catch { return {}; }
}
function 控えを書く(seedId: string, p: 準備): void {
  const all = 控えを読む();
  all[seedId] = p;
  fs.mkdirSync(path.dirname(控えのファイル), { recursive: true });
  fs.writeFileSync(控えのファイル, JSON.stringify(all, null, 2));
}

/** このワーカーで組み立てたシードの状態（spec の手順1が読む） */
export type 準備の状態 = { 今回作った: boolean; 準備: 準備; 実行: string[]; 必要な回数: number };
const 状態 = new Map<string, 準備の状態>();

/** spec の手順1: 控えた時刻より後にバッチが必要な回数流れたか。流れていなければ止める（未判定・バッチ未実行） */
export function バッチの実行を確かめる(seedIds: string[]): { 実行: string[]; 準備: Record<string, 準備> } {
  const 準備: Record<string, 準備> = {};
  const 足りない: string[] = [];
  const 今回: string[] = [];
  let 実行: string[] = [];
  for (const id of seedIds) {
    const s = 状態.get(id);
    if (!s) throw new Error(`${id} のシードの状態が無い（シードを組み立てていない）`);
    準備[id] = s.準備;
    if (s.今回作った) 今回.push(id);
    else if (s.実行.length < s.必要な回数) 足りない.push(`${id}（${s.準備.作った日時} の準備のあと ${s.実行.length} 回・${s.必要な回数} 回要る）`);
    if (!実行.length || s.実行.length < 実行.length) 実行 = s.実行;
  }
  if (今回.length) throw new Error(`準備の回: ${今回.join("・")} を作って控えた。買取自動入庫バッチ（開発環境で毎日 15:00 に自動で流れる）のあとに流し直す（未判定・バッチ未実行）`);
  if (足りない.length) throw new Error(`買取自動入庫バッチがまだ流れていない: ${足りない.join("、")}（未判定・バッチ未実行）`);
  return { 実行, 準備 };
}

/** 準備の回で作った商品コード・査定ID（spec が正本の決め打ちの値の代わりに使う） */
export function 準備したもの(seedId: string): 準備 {
  const s = 状態.get(seedId);
  if (!s) throw new Error(`${seedId} のシードの状態が無い`);
  return s.準備;
}

defineSeed("S-B06-01-L-ADM", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const 名 = await 試験店舗の名前を読む(page);
    issue(店舗読み替えの注記("TC東京2F", 名.試験支店, 試験支店ID));
    await ensureMemberFixed(page, {
      名前: B0601_ADM.名前, 所属店舗: 名.試験支店, ログインID: B0601_ADM.loginId, メールアドレス: `${B0601_ADM.loginId}@example.test`, パスワード: B0601_ADM.password,
      権限: "システム管理者", デフォルト検索表示店舗: 名.試験支店, 編集可能店舗: [名.試験支店, 名.本店],
    }, issue);
  });
  issue("管理者は決まった印（-E2E。ログインIDは小文字）を付けて1度だけ作る。権限はシステム管理者（在庫管理・買取管理を操作できる）。編集可能店舗は試験支店（TC東京2F の読み替え）と本店");
});

defineSeed("S-B06-01-L-ENV", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "買取自動入庫バッチは、E2E から起動する入口が無い（アプリのコンソールのコマンド）。開発環境のバッチの環境が毎日 15:00（日本時間）に自動で流すのを待つ（依頼者決定 2026-11-20）。店舗マスタ・実行設定は書き換えない");
});

/** 状態・属性の文から値を読む */
function 値(seed: { シードID: string; "状態・属性": string }, re: RegExp, 名: string): string {
  const m = re.exec(seed["状態・属性"]);
  if (!m) throw new Error(`${seed.シードID}: シード表の状態・属性から「${名}」を読めない`);
  return m[1].trim();
}

/** 入庫待ち（入庫済み）の店頭買取1件と、入庫先の在庫のシード。必要な回数: 確かめの前に要るバッチの実行の回数 */
const 店頭買取のシード = (必要な回数: number): SeedBuilder => async ({ browser, seed }) => {
  const id = seed.シードID;
  const issue = (m: string) => reportSeedIssue(id, m);
  const 正本の商品コード = 値(seed, /商品コード=([^・／]+)/, "商品コード");
  const 商品名 = 値(seed, /商品名=([^・／]+)/, "商品名");
  const 数量 = Number(値(seed, /実在庫数=(\d+)/, "実在庫数"));
  const 単価 = Number(値(seed, /買取単価=(\d+)/, "買取単価"));
  const 在庫数 = Number(値(seed, /EC-CUBE在庫（[^）]*）は在庫数=(\d+)/, "入庫先の在庫数"));
  const 総原価 = Number(値(seed, /EC-CUBE在庫（[^）]*）は在庫数=\d+・総原価=(\d+)/, "入庫先の総原価"));
  const ステータス名 = 値(seed, /ステータス=([^／]+)/, "ステータス");
  const ステータスID = ステータス名.includes("入庫待ち") ? "13" : ステータス名.includes("入庫済み") ? "11" : "";
  if (!ステータスID) throw new Error(`${id}: ステータス「${ステータス名}」は入庫待ちでも入庫済みでもない`);
  const 申込者 = /氏名=([^）]+)）/.exec(seed["状態・属性"])?.[1].trim().split(/\s+/) ?? ["データ試験", "B0601"];

  // 確かめの回: 控えたものがまだあれば使い回す
  const 前 = 控えを読む()[id];
  if (前 && 受注のステータスID(前.受注ID) !== null && 商品コードの規格ID(前.商品コード) === 前.規格ID) {
    const 実行 = 自動入庫バッチの実行(new Date(前.作った日時));
    状態.set(id, { 今回作った: false, 準備: 前, 実行, 必要な回数 });
    issue(`準備の回（${前.作った日時}）で作った査定ID ${前.査定ID}・商品コード ${前.商品コード}（正本の ${正本の商品コード}）を使い回した。その後の買取自動入庫バッチの実行: ${実行.join("・") || "まだ無い"}`);
    return;
  }

  // 準備の回: 商品（入庫先の在庫）→ 店頭買取の申込 → 実在庫の明細・ステータス・金額
  const 作った日時 = new Date().toISOString();
  const 商品 = await カード商品を作る(browser, id, { 商品コード: 正本の商品コード, 商品名日: 商品名, 商品名英: `${正本の商品コード} EN`, 基準価格: "1000", 販売価格: "1000", 買取価格: String(単価), 在庫: 0 });
  const 在庫 = 店舗のEC在庫(商品.規格ID, 試験支店ID);
  if (在庫.length !== 1) throw new Error(`${id}: 商品コード ${商品.商品コード} の試験支店の EC-CUBE 在庫の行が ${在庫.length} 件（1件のはず）`);
  入庫先の在庫を書く(`${id}: 入庫先の在庫`, 在庫[0].在庫番号, 商品.商品コード, { 在庫数, 総原価 });
  const 今の在庫 = 店舗のEC在庫(商品.規格ID, 試験支店ID)[0];
  if (今の在庫.在庫数 !== 在庫数 || 今の在庫.総原価 !== 総原価) throw new Error(`${id}: 入庫先の在庫が ${今の在庫.在庫数}・${今の在庫.総原価}（${在庫数}・${総原価} のはず）`);
  const 履歴 = 在庫履歴の数(商品.規格ID, 試験支店ID);
  if (履歴 !== 0) throw new Error(`${id}: 入庫先の在庫履歴が ${履歴} 件（0件のはず）`);
  const 姓 = rc(申込者[0] ?? "データ試験");
  const [受付番号] = await 申込を行う(browser, 試験支店.支店URL, [申込者の(姓, 申込者[1] ?? "B0601", "シケン", "ニュウコ")]);
  // 完了画面の番号は受付の通し番号（0001 など）で、査定IDではない。申込者の姓（実行の印つき）で受注を引く
  const 受注 = 姓の受注(姓);
  if (受注.length !== 1) throw new Error(`${id}: 申込者の姓 ${姓} の店頭買取の受注が ${受注.length} 件（1件のはず。完了画面の番号 ${受付番号}）`);
  const { 受注ID, 査定ID } = 受注[0];
  実在庫の明細を足す(`${id}: 実在庫の明細`, 受注ID, 姓, { 規格ID: 商品.規格ID, 数量, 小計: 数量 * 単価 });
  const 明細 = 実在庫の明細(受注ID);
  if (明細.length !== 1 || 明細[0].数量 !== 数量) throw new Error(`${id}: 受注 ${受注ID} の実在庫の明細が ${JSON.stringify(明細)}`);
  受注のステータスと金額を書く(受注ID, 姓, ステータスID, 数量 * 単価);
  if (受注のステータスID(受注ID) !== ステータスID) throw new Error(`${id}: 受注 ${受注ID} のステータスが ${受注のステータスID(受注ID)}（${ステータスID} のはず）`);
  const p: 準備 = { 作った日時, 受注ID, 査定ID, 姓, 商品コード: 商品.商品コード, 規格ID: 商品.規格ID, ステータスID };
  控えを書く(id, p);
  状態.set(id, { 今回作った: true, 準備: p, 実行: [], 必要な回数 });
  issue(`準備の回: 試験支店（TC東京2F の読み替え）のフロントで店頭買取を申し込み（査定ID ${査定ID}・申込者の姓 ${姓}）、`
    + `実在庫の明細（商品コード ${商品.商品コード}＝正本の ${正本の商品コード}・数量 ${数量}・小計 ${数量 * 単価}）とステータス「${ステータス名}」（番号 ${ステータスID}）・金額を DB で書いた。`
    + `入庫先の試験支店の EC-CUBE 在庫は在庫数 ${在庫数}・総原価 ${総原価} を DB で書いた（在庫履歴0件のため）。ほかの方の入庫待ちの買取は書き換えない`);
};

for (const n of ["015", "016", "017"]) defineSeed(`S-B06-01-L-STORE-${n}`, 店頭買取のシード(1));
for (const s of ["DP-STORE-022", "DP-STORE-A-023", "DP-STORE-B-023", "DP-STOREQ-025", "DP-STORER-025", "DP-STORE-027", "DP-STORE-A-028", "DP-STORE-B-028", "DP-STOREQ-030", "DP-STORER-030"]) {
  defineSeed(`S-B06-01-${s}`, 店頭買取のシード(1));
}
// 026・031 は、バッチを2回流して2回目に二重に入庫しないことを確かめる（2回の自動の実行を待つ）
for (const s of ["DP-STORE-026", "DP-STORE-031"]) defineSeed(`S-B06-01-${s}`, 店頭買取のシード(2));
