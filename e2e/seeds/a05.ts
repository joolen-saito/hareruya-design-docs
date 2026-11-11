/**
 * A05-01・A05-02・A05-03（注文印刷・店頭注文番号取得の API）のシード。正本: cases/A05-0{1,2,3}_seed_data.tsv
 *
 * 実ソース（新アプリ）で確かめた API の作り（記録 review/A05-0{1,2,3}_progress_2026-11-11_dev.md にも書く）:
 * - 印刷情報の取得と印刷済みへの更新は、1本の経路（POST /api/order/print/direct/{店舗ID}）で、ConnectionType（GetRequest・SetResponse）で切り替える。
 *   本店は店舗ID 1 に決め打ち。プリンタの実機や外部のサービスへは送らない（印刷データを返す・受け取った結果で受注を更新するだけ）。
 * - 店頭注文番号取得は GET /waiting_api/get_waiting_number/{店舗ID}。
 * - どちらも認証は無く、送信元IPの制限はアプリ全体のフロントの許可リスト（環境の設定）だけ。
 *
 * 型（A05-02 の受注）: 会員はフロントの会員登録（seeds/f06-member.ts の 本会員を作る。メールの前半に実行の印）→ 商品はグッズ商品CSV登録で作り、
 * 本店・EC-CUBE に入庫して別のメンバーが承認（pages/admin/f04_setup.ts の 商品を作って入庫する）→ 会員がフロントで注文
 * （pages/front/m05_front_order.ts の 会員が商品を注文する）→ 画面で指定できない状態だけ、E2E の受注の行に DB で書く（db/a05.ts の 受注を印刷待ちにする:
 * 対応状況「注文受領」・ブラウザ印刷フラグ・注文確定日を未設定・支店の受注は店舗ID 2・008 の金額）。受注IDは画面（注文）が振った番号を控える。
 *
 * シードでの解釈（正本の外の補い）:
 * - S-A05-0{1,2,3}-ENV（テスト端末の送信元IPの許可）: アプリ全体のフロントの許可リストで、全員が使う環境の設定。書き換えず、この端末から開けることを使う。
 * - A05-02 の支店の受注（001B）は、開発環境の店舗ID 2（支店）の受注として、注文した受注の店舗を DB で書き換えた（支店のフロントで注文する手段が無い）。
 * - A05-02 の 008 の受注ID 520006008・商品ID 205020008・在庫ID 305020008 は指定できないので、画面が振った番号で読み替えた（spec が手順の
 *   printjobid にも同じ番号を使う）。金額1000・税100・ポイント50 は DB で書き、在庫数7は入庫8・注文1で作る。
 * - A05-03 の試験店舗（「A05-03連鎖試験店-003」「A05-03空データ試験店-005」）は、決まった名前で1度だけ登録して使い回す（依頼者決定 2026-11-11）。
 *   003 は前の実行で登録した番号札を、開始前に DB で消して0件にする（その店舗はこの E2E だけが使う）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 受注IDの } from "../db/m05_09";
import { 受注を印刷待ちにする, 印刷待ちの定め, 店舗がある, 店舗の受注の数, 店舗の店頭注文番号の数, 店舗の店名, 店舗の番号札, 対応状況の番号, 試験店舗の番号札を消す } from "../db/a05";
import { Notes } from "../lib/notes";
import { rc, rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { 商品を作って入庫する } from "../pages/admin/f04_setup";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { ensureStore, M0424StoreInput } from "../pages/admin/m04_24_store";
import { 会員が商品を注文する } from "../pages/front/m05_front_order";
import { markedMail, 本会員を作る } from "./f06-member";

// ---- 環境のシード ----
for (const id of ["S-A05-01-ENV", "S-A05-02-ENV", "S-A05-03-ENV"]) {
  defineSeed(id, async ({ seed }) => {
    if (id === "S-A05-02-ENV") {
      for (const [店舗ID, 何] of [["1", "本店"], ["2", "支店"]] as const) {
        if (!店舗がある(店舗ID)) throw new Error(`${id}: 店舗ID ${店舗ID}（${何}）が開発環境に無い`);
      }
      if (!対応状況の番号("ピック中")) throw new Error(`${id}: 対応状況「ピック中」が開発環境のマスタに無い`);
      reportSeedIssue(seed.シードID, `店舗ID 1（${店舗の店名("1")}）を本店、店舗ID 2（${店舗の店名("2")}）を支店として使う（開発環境に既にあるもの）。対応状況「ピック中」はマスタにあることを確かめた`);
    }
    reportSeedIssue(seed.シードID, "テスト端末の送信元IPの許可は、アプリ全体のフロントの許可リスト（全員が使う環境の設定）。書き換えず、この端末から開けることをそのまま使った（正本の外の補い）");
  });
}

// ---- A05-01 ----
defineSeed("S-A05-01-INVALID-007", async () => {
  if (店舗がある("519999007")) throw new Error("S-A05-01-INVALID-007: 店舗ID 519999007 が開発環境にある（未登録の前提を満たせない）");
  if (店舗の受注の数("519999007") > 0) throw new Error("S-A05-01-INVALID-007: 店舗ID 519999007 の受注がある");
});

// ---- A05-02 の受注 ----
type 受注の定め = { 呼び名: string; 支店?: boolean; ブラウザ印刷?: boolean; 金額?: 印刷待ちの定め["金額"] };
type 作った受注 = { 受注ID: string; メール: string; 商品コード: string };
const 作った = new Map<string, 作った受注[]>();
export function 作った受注の(seedId: string): 作った受注[] {
  const v = 作った.get(seedId);
  if (!v) throw new Error(`${seedId} はまだ作っていない`);
  return v;
}

const PW = "Passw0rd!A0502C";
const 定めの表: Record<string, 受注の定め[]> = {
  "S-A05-02-PRINT-001": [{ 呼び名: "〔受注ID-A0502-001A〕" }, { 呼び名: "〔受注ID-A0502-001B〕", 支店: true }],
  "S-A05-02-BROWSER-002": [{ 呼び名: "〔受注ID-A0502-002〕", ブラウザ印刷: true }],
  "S-A05-02-CONFIRM-003": [{ 呼び名: "〔受注ID-A0502-003〕" }],
  "S-A05-02-BODY-004": [{ 呼び名: "〔受注ID-A0502-004A〕" }, { 呼び名: "〔受注ID-A0502-004B〕" }],
  "S-A05-02-MISSING-005": [{ 呼び名: "〔受注ID-A0502-005A〕" }, { 呼び名: "〔受注ID-A0502-005B〕" }],
  "S-A05-02-MALFORMED-006": [{ 呼び名: "〔受注ID-A0502-006〕" }],
  "S-A05-02-EMPTY-007": [{ 呼び名: "〔受注ID-A0502-007〕" }],
  "S-A05-02-NONRECALC-008": [{ 呼び名: "", 金額: { 支払合計: 1000, 税: 100, 付与ポイント: 50 } }],
  "S-A05-02-RESPONSE-009": [{ 呼び名: "〔受注ID-A0502-009A〕" }, { 呼び名: "〔受注ID-A0502-009B〕", ブラウザ印刷: true }],
  "S-A05-02-NOFILE-010": [{ 呼び名: "〔受注ID-A0502-010〕" }],
  "S-A05-02-DIRECT-015": [{ 呼び名: "〔受注ID-A0502-015〕" }],
  "S-A05-02-FLAG-016": [{ 呼び名: "〔受注ID-A0502-016〕", ブラウザ印刷: true }],
  "S-A05-02-CBFLAGMISS-017": [{ 呼び名: "〔受注ID-A0502-017〕", ブラウザ印刷: true }],
  "S-A05-02-CBTWICE-018": [{ 呼び名: "〔受注ID-A0502-018〕" }],
};

async function 受注を作る(browser: Browser, seedId: string, notes: Notes, 定め: 受注の定め[]): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 番号 = /-(\d{3})$/.exec(seedId)?.[1] ?? "";
  const 前半 = `a0502-${番号}`;
  await 本会員を作る(browser, { 姓: "注文印刷", 名: 番号, セイ: "チュウモンインサツ", メイ: "カイイン", 前半, パスワード: PW });
  const メール = markedMail(前半);
  // 商品は1種類。受注の数だけ注文し、008 は在庫数7が残るよう入庫8・注文1
  const 商品コード = rc(`A0502-P-${番号}`);
  const 入庫数 = seedId === "S-A05-02-NONRECALC-008" ? 8 : 定め.length + 2;
  const made = await 商品を作って入庫する(browser, seedId, [{ 商品コード, 商品名: rc(`注文印刷試験商品-${番号}`), 価格: "1000", 入庫数 }], issue);
  const out: 作った受注[] = [];
  for (const [i, d] of 定め.entries()) {
    const 注文番号 = await 会員が商品を注文する(browser, { メール, パスワード: PW }, [{ 商品ID: made[0].productId, 数量: 1 }], `${seedId}: ${i + 1}件目の受注`);
    const 受注ID = 受注IDの(注文番号, メール);
    受注を印刷待ちにする(`${seedId}: ${受注ID} を印刷待ちにする`, 受注ID, メール, { 店舗ID: d.支店 ? "2" : undefined, ブラウザ印刷: !!d.ブラウザ印刷, 金額: d.金額 });
    if (d.呼び名) notes.set(d.呼び名, 受注ID);
    out.push({ 受注ID, メール, 商品コード });
    issue(`受注ID ${受注ID}（注文番号 ${注文番号}）: 対応状況「注文受領」・ブラウザ印刷フラグ${d.ブラウザ印刷 ? "あり" : "なし"}・注文確定日を未設定${d.支店 ? "・店舗を店舗ID 2（支店）" : ""}${d.金額 ? `・金額${d.金額.支払合計}・税${d.金額.税}・付与ポイント${d.金額.付与ポイント}` : ""}を DB で書いた（画面で指定できない値）`);
  }
  作った.set(seedId, out);
}

for (const [seedId, 定め] of Object.entries(定めの表)) {
  defineSeed(seedId, { needs: ["S-A05-02-ENV"] }, async ({ browser, notes }) => 受注を作る(browser, seedId, notes, 定め));
}

// ---- A05-03 の試験店舗と管理者 ----
const 試験会社 = "A05-03試験会社";
/** シード表の投入方法の値（店舗種別は支店。メールアドレス・表示順・公開・開店・売上集計の検索項目は店舗登録の部品の既定のまま） */
const 試験店舗 = (店名: string, 店名カナ: string, 英語: string, url: string, 略称: string, ショップ名略称: string): M0424StoreInput => ({
  店名, 店名カナ, 店名英語: 英語, 支店URL: url, 店名略称3文字: 略称, ショップ名略称,
  会社名: 試験会社, 会社名カナ: "シケンガイシャ", 郵便番号: "100-0001", 都道府県: "東京都", 住所1: "千代田区", 住所2: "千代田1-1", 電話番号: "03-1234-5678",
});
export const 連鎖試験店 = 試験店舗("A05-03連鎖試験店-003", "エーレンサシケンテン", "A Rensa Shop", "a0503rensa003", "A3C", "A0503連鎖003");
export const 空データ試験店 = 試験店舗("A05-03空データ試験店-005", "エーカラシケンテン", "A Kara Shop", "a0503kara005", "A5E", "A0503空005");
const 店舗の番号 = new Map<string, string>();
export const 試験店舗の店舗ID = (店名: string): string => {
  const id = 店舗の番号.get(店名);
  if (!id) throw new Error(`試験店舗「${店名}」をまだ用意していない`);
  return id;
};

/** 試験店舗を、決まった名前で1度だけ登録し（あれば内容を確かめて使い回し）、店舗IDを返す */
async function 試験店舗を用意する(browser: Browser, v: M0424StoreInput, issue: (m: string) => void): Promise<string> {
  const known = 店舗の番号.get(v.店名);
  if (known) return known;
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); return ensureStore(page, v, issue); });
  店舗の番号.set(v.店名, id);
  return id;
}

defineSeed("S-A05-03-CHAIN-003", { needs: ["S-A05-03-ENV"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const id = await 試験店舗を用意する(browser, 連鎖試験店, issue);
  notes.set("〔店舗ID-A0503-003〕", id);
  const n = 試験店舗の番号札を消す(`${seed.シードID}: 前の実行の番号札を消す`, id, 連鎖試験店.店名, 連鎖試験店.会社名);
  if (n > 0) issue(`前の実行でこの試験店舗に登録した番号札 ${n} 件を DB で消し、0件に戻した（この店舗は E2E だけが使う）`);
  if (店舗の店頭注文番号の数(id) > 0) throw new Error(`${seed.シードID}: 試験店舗（店舗ID ${id}）に店頭注文番号がある（0件のはず）`);
  if (店舗の番号札(id).length > 0) throw new Error(`${seed.シードID}: 試験店舗（店舗ID ${id}）の番号札が0件にならない`);
  issue(`試験店舗「${連鎖試験店.店名}」（店舗ID ${id}）は決まった名前で1度だけ登録して使い回す（依頼者決定 2026-11-11）`);
});

defineSeed("S-A05-03-EMPTY-005", { needs: ["S-A05-03-ENV"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const id = await 試験店舗を用意する(browser, 空データ試験店, issue);
  notes.set("〔店舗ID-A0503-005〕", id);
  const 受注 = 店舗の受注の数(id), 番号 = 店舗の店頭注文番号の数(id), 札 = 店舗の番号札(id).length;
  if (受注 + 番号 + 札 > 0) throw new Error(`${seed.シードID}: 試験店舗（店舗ID ${id}）に受注 ${受注} 件・店頭注文番号 ${番号} 件・番号札 ${札} 件がある（どれも0件のはず）`);
  issue(`試験店舗「${空データ試験店.店名}」（店舗ID ${id}）は決まった名前で1度だけ登録して使い回す（依頼者決定 2026-11-11）`);
});

/** 開発環境に手動テスト用の同じログインIDのメンバーがありうるので、ログインID・名前に実行の印を付けて作る */
export const A0503_ADMIN: Account = { loginId: rcFixed("a0503_admin").toLowerCase(), password: "Passw0rd!A0503" };
defineSeed("S-A05-03-ADM", { needs: ["S-A05-03-CHAIN-003"] }, async ({ browser, seed }) => {
  const 店舗ID = 試験店舗の店舗ID(連鎖試験店.店名);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await ensureMemberByStoreIds(page, {
      名前: rcFixed("A05-03試験管理者"), ログインID: A0503_ADMIN.loginId, メールアドレス: `${A0503_ADMIN.loginId}@example.test`, パスワード: A0503_ADMIN.password,
      権限: "システム管理者", 所属店舗ID: 店舗ID, デフォルト検索表示店舗ID: 店舗ID, 編集可能店舗ID: [店舗ID],
    });
  });
  reportSeedIssue(seed.シードID, "店頭注文番号札管理を操作できる権限として「システム管理者」で作り、所属店舗・既定の検索店舗・編集可能店舗を試験店舗「A05-03連鎖試験店-003」にした。ログインID・名前に実行の印を付けた（開発環境に同じログインIDのメンバーがありうるため）");
});
