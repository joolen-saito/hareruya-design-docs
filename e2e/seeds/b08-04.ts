/**
 * B08-04 必須項目が空欄の会員発生通知バッチのシードの作り方。値はシード表（integration_test/casegen/cases/B08-04_seed_data.tsv）のとおり。
 *
 * 2回に分けて流す形（依頼者決定 2026-11-20「B06-01・B08-04 は、毎日の自動の実行を待つ形で書く」）:
 * - このバッチ（アプリのコンソールのコマンド）は、E2E から起動する入口が無い。開発環境では、バッチの環境が毎日1回自動で流し、
 *   メールの受け口に件名「必須項目が空欄である会員の存在を通知するメール」が1通ずつ届く（11/16〜11/19 に毎日 19:05 ごろ）。
 * - 準備の回: 会員を作り、作ったものを .runs/b08_04_prep.json に控えて、手順1で止める（未判定・バッチ未実行）。
 * - 確かめの回: 控えた会員を使い回す（作り直さない）。控えた時刻より後に届いた通知のメールの、最初の1通で確かめる。
 *   届いていなければ、手順1で止める（未判定・バッチ未実行）。
 *
 * シードでの解釈（正本の外の補い）:
 * - S-B08-04-DB（試験DBの作り直し・ほかの会員を0件にする）は、しない。開発環境は全員が使う DB で、ほかの方の会員（必須項目が空欄の会員を含む）が
 *   いる。通知のメールには、ほかの方の空欄の会員も載る。ケースは E2E の会員の行だけを見る（006「0通」は成り立たないので書いていない）。
 * - S-B08-04-MAIL（通知先のメールアドレスの書き換え・受信履歴の消去）は、しない。通知先は全員が使う1件だけの設定なので、いまの値を読むだけにする。
 *   メールの受け口は、開発環境が送るメールを全部受けるので、いまの通知先あてのメールを読む。受信履歴は消さず、準備の時刻より後のメールだけを見る。
 * - 会員は、フロントの会員登録＋管理画面で本会員にする部品で作る（メールアドレスに実行の印）。シード表の項目の値（名前・電話番号・住所）と、
 *   画面で作れない空欄（NULL）・退会者フラグは、E2E の会員の行にだけ DB で書く。国はマスタの「日本」（開発環境では英語の名称「Japan」）。
 */
import fs from "node:fs";
import path from "node:path";
import { 会員がいる, 会員の項目を書く, 国の番号, 通知先のメールアドレス, 都道府県の番号 } from "../db/b08_04";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedBuilder } from "../lib/seeds";
import { 会員を登録して本会員にする } from "../pages/admin/member_activate";
import { 届いた通知 } from "../pages/admin/b08_04_mail";

const 控えのファイル = path.resolve(__dirname, "..", ".runs", "b08_04_prep.json");
type 作った会員 = { 呼び名: string; 会員ID: string; メール: string };
export type 準備 = { 作った日時: string; 会員: 作った会員[] };

function 控えを読む(): Record<string, 準備> {
  try { return JSON.parse(fs.readFileSync(控えのファイル, "utf-8")) as Record<string, 準備>; } catch { return {}; }
}
function 控えを書く(seedId: string, p: 準備): void {
  const all = 控えを読む();
  all[seedId] = p;
  fs.mkdirSync(path.dirname(控えのファイル), { recursive: true });
  fs.writeFileSync(控えのファイル, JSON.stringify(all, null, 2));
}

type 状態 = { 今回作った: boolean; 準備: 準備 };
const 状態 = new Map<string, 状態>();

/** spec の手順1: 準備のあとに通知のメールが届いたか。届いていなければ止める（未判定・バッチ未実行）。届いた最初の1通と、同じ回に届いた通数を返す */
export async function 通知を確かめる(seedId: string): Promise<{ 宛先: string; 最初: { 番号: number; 届いた時刻: string }; 同じ回の通数: number; 準備: 準備 }> {
  const s = 状態.get(seedId);
  if (!s) throw new Error(`${seedId} のシードの状態が無い（シードを組み立てていない）`);
  if (s.今回作った) throw new Error(`準備の回: ${seedId} の会員を作って控えた。必須項目が空欄の会員発生通知バッチ（開発環境で毎日1回自動で流れる）のあとに流し直す（未判定・バッチ未実行）`);
  const 宛先 = 通知先のメールアドレス();
  if (!宛先) throw new Error("通知先のメールアドレス（追加システム設定）が未設定。バッチはメールを送らない");
  const 届いた = await 届いた通知(new Date(s.準備.作った日時), 宛先);
  if (!届いた.length) throw new Error(`必須項目が空欄の会員発生通知バッチがまだ流れていない（${s.準備.作った日時} の準備のあとに通知のメールが届いていない。未判定・バッチ未実行）`);
  const t0 = Date.parse(届いた[0].届いた時刻);
  const 同じ回 = 届いた.filter((m) => Date.parse(m.届いた時刻) - t0 < 30 * 60_000).length;
  return { 宛先, 最初: { 番号: 届いた[0].番号, 届いた時刻: 届いた[0].届いた時刻 }, 同じ回の通数: 同じ回, 準備: s.準備 };
}

defineSeed("S-B08-04-DB", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "試験DBの作り直し・ほかの会員を0件にすることは、しない（開発環境は全員が使う DB）。ほかの方の会員（必須項目が空欄の会員を含む）がいるまま流し、ケースは E2E の会員の行だけを見る。国はマスタの「日本」（開発環境では英語の名称「Japan」）・都道府県は「東京都」");
});

defineSeed("S-B08-04-MAIL", async ({ seed }) => {
  const 宛先 = 通知先のメールアドレス();
  if (!宛先) throw new Error(`${seed.シードID}: 通知先のメールアドレス（追加システム設定）が未設定。全員が使う設定なので、書き換えない`);
  reportSeedIssue(seed.シードID, `通知先のメールアドレス（全員が使う1件だけの設定）は書き換えず、いまの値（${宛先}）あてに届くメールを、開発環境のメールの受け口で読む。受信履歴は消さず、準備の時刻より後のメールだけを見る`);
});

/** 状態・属性の「〔会員ID-…〕＝メールアドレス X で登録する会員」から、呼び名と正本のメールアドレスの組を読む */
function 呼び名とメール(seed: { シードID: string; "状態・属性": string }): [string, string][] {
  const out = Array.from(seed["状態・属性"].matchAll(/(〔会員ID-B0804-[^〕]+〕)＝メールアドレス\s*(\S+?@example\.test)\s*で登録する会員/g), (m) => [m[1], m[2]] as [string, string]);
  if (!out.length) throw new Error(`${seed.シードID}: シード表から会員の呼び名とメールアドレスを読めない`);
  return out;
}

/** 投入方法から、メールアドレスの会員の入力値を読む */
function 入力値(seed: { シードID: string; 投入方法: string }, メール: string): { 姓: string; 名: string; 住所1: string; 住所2: string; 電話: [string, string, string] } {
  const esc = メール.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`「姓」に([^・]+)・「名」に([^・]+)・メールアドレスとメールアドレス（確認）に${esc}・.*?住所の1つ目の欄に([^・]+)・住所の2つ目の欄に([^・]+)・電話番号の3つの欄に(\\d+)・(\\d+)・(\\d+)`);
  const m = re.exec(seed.投入方法);
  if (!m) throw new Error(`${seed.シードID}: 投入方法から ${メール} の会員の入力値を読めない`);
  return { 姓: m[1], 名: m[2], 住所1: m[3], 住所2: m[4], 電話: [m[5], m[6], m[7]] };
}

/** 状態・属性の「〔呼び名〕=…」の文から、空欄（NULL）にする項目と退会者フラグを読む */
function 空欄の項目(seed: { "状態・属性": string }, 呼び名: string): { 住所3を空: boolean; 郵便番号を空: boolean; 退会: boolean } {
  const i = seed["状態・属性"].indexOf(`${呼び名}=`);
  const 文 = i < 0 ? "" : seed["状態・属性"].slice(i).split(/[／；。]/)[0];
  return { 住所3を空: 文.includes("住所3"), 郵便番号を空: 文.includes("郵便番号"), 退会: 文.includes("退会者フラグ有効") };
}

const 会員のシード: SeedBuilder = async ({ browser, seed, notes }) => {
  const id = seed.シードID;
  const issue = (m: string) => reportSeedIssue(id, m);
  const 組 = 呼び名とメール(seed);

  const 前 = 控えを読む()[id];
  if (前 && 前.会員.length === 組.length && 前.会員.every((x) => 会員がいる(x.会員ID, x.メール))) {
    for (const x of 前.会員) notes.set(x.呼び名, x.会員ID);
    状態.set(id, { 今回作った: false, 準備: 前 });
    issue(`準備の回（${前.作った日時}）で作った会員 ${前.会員.map((x) => `${x.呼び名}=${x.会員ID}（${x.メール}）`).join("・")} を使い回した`);
    return;
  }

  const 作った日時 = new Date().toISOString();
  const 国 = 国の番号(["日本", "Japan"]);
  const 都 = 都道府県の番号("東京都");
  const 会員: 作った会員[] = [];
  for (const [呼び名, 正本のメール] of 組) {
    const v = 入力値(seed, 正本のメール);
    const メール = `${rc(正本のメール.split("@")[0]).toLowerCase()}@example.test`;
    const 会員ID = await 会員を登録して本会員にする(browser, { 姓: v.姓, 名: v.名, セイ: "シケン", メイ: "カイイン", メール, パスワード: "Passw0rd-B0804" }, issue);
    const 空 = 空欄の項目(seed, 呼び名);
    会員の項目を書く(`${id}: ${呼び名} の項目`, 会員ID, メール, {
      country_id: 国, pref_id: 都, name01: v.姓, name02: v.名, tel01: v.電話[0], tel02: v.電話[1], tel03: v.電話[2],
      addr01: v.住所1, addr02: v.住所2, addr03: 空.住所3を空 ? null : `${v.住所2.replace(/A12$/, "A13")}`,
      postal_code: 空.郵便番号を空 ? null : "1600022", ...(空.退会 ? { del_flg: true } : {}),
    });
    notes.set(呼び名, 会員ID);
    会員.push({ 呼び名, 会員ID, メール });
    issue(`${呼び名}=会員ID ${会員ID}（${メール}＝正本の ${正本のメール}）。シード表の名前・電話番号・住所と、空欄（${[空.住所3を空 ? "住所3" : "", 空.郵便番号を空 ? "郵便番号" : ""].filter(Boolean).join("・") || "なし"}）${空.退会 ? "・退会者フラグ" : ""}を DB で書いた（画面では空欄にできない）`);
  }
  const p: 準備 = { 作った日時, 会員 };
  控えを書く(id, p);
  状態.set(id, { 今回作った: true, 準備: p });
};

for (const s of ["POSTAL-003", "FULL-004", "WITHDRAW-005", "DEST-007", "SUBJECT-008", "LINE-009", "LAYOUT-010", "NOUPDATE-014"]) defineSeed(`S-B08-04-${s}`, 会員のシード);
