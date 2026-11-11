/**
 * M06-09 買取集計データCSV出力 の追加シード。正本: cases/M06-09_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10）に従い、画面で作れるものは画面で、買取集計データだけ DB で作る。
 * - 店舗（DATA-NNN・NO-SECTION-NNN）: 店舗登録画面で、正本の店名（M06-09試験店舗001 など。固定名。あれば使う）で登録する。店舗IDは画面が振った番号。
 *   管理者（ADM）の閲覧権限のため、ADM がこれらの店舗をまとめて用意する。
 * - 買取集計データ: 画面には登録する操作が無いので、試験店舗（店名が固定）に限り、DB で期間内の行を消して入れ直す（db/m06_09_prep.ts。writeTestData 経由）。
 *   内部ID（60900121 など）は指定せず、DB が振る番号。シードの注記に「DBで〜を設定した」を残す。
 * - 部門（MASTER）: 共有のマスタは登録しない。既存の部門「カード」「サプライ」を使う（部門ID・コードは正本の 60909011/D01・60909012/D02 ではなく、既存の値）。
 *   ケースの期待の「D01」「D02」は、その部門の実際のコードとして読む。名前の部門が1件に決まらなければ止める。
 * - 管理者（ADM）: 管理者内部ID 60909001 は指定できない。権限は「システム管理者」で代える（M06-09 の既存の試験管理者と同じ）。
 *   ADM-014・015 は、デフォルト検索表示店舗をその店舗にした別の管理者。管理者内部IDは画面が振った番号を DB の参照で控える。
 * - ブラウザ（BROWSER）: ダウンロードの許可はテストの基盤が行う。時刻の同期は確かめない（注記に残す）。
 * - 作らないシード（ケースを実装しない）: PRICE-007・SUMMARY-CONFIG（共有の追加システム設定を書き換え、集計処理を実行する）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 管理者IDを探す, 集計データを入れ替える, 集計行, 部門を名前で探す } from "../db/m06_09_prep";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { ensureStore } from "../pages/admin/m04_24_store";
import { storeInput } from "./m06-common";

export const M0609_ADMIN: Account = { loginId: "m0609_admin", password: "Passw0rd!M0609" };
export const M0609_ADMIN_014: Account = { loginId: "m0609_admin_014", password: "Passw0rd-M0609014" };
export const M0609_ADMIN_015: Account = { loginId: "m0609_admin_015", password: "Passw0rd-M0609015" };

/** 試験店舗（キー → 店名）。店名は正本のとおりの固定名 */
export const 店名 = {
  "001": "M06-09試験店舗001", "003A": "M06-09試験店舗003A", "003B": "M06-09試験店舗003B", "004": "M06-09試験店舗004", "005": "M06-09試験店舗005",
  "006": "M06-09試験店舗006", "008": "M06-09試験店舗008", "009": "M06-09試験店舗009", "011": "M06-09試験店舗011",
  "014": "M0609-014-TENPO", "015": "M0609-015-TENPO",
} as const;
type 店キー = keyof typeof 店名;
const キー一覧 = Object.keys(店名) as 店キー[];
const 英語 = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "India", "Juliet", "Kilo"];
const カナ = ["ア", "イ", "ウ", "エ", "オ", "カ", "キ", "ク", "ケ", "コ", "サ"];

const 店舗の入力 = (k: 店キー) => {
  const i = キー一覧.indexOf(k);
  return storeInput(店名[k], `エムゼロロクゼロキュウシュウケイシケンテンポ${カナ[i]}`, `Kaitori Summary Test Store ${英語[i]}`, `m0609sum${k.toLowerCase()}`, `K9${"ABCDEFGHIJK"[i]}`);
};

async function 店舗を用意する(browser: Browser, k: 店キー, issue: (m: string) => void): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return ensureStore(page, 店舗の入力(k), issue);
  });
}

/** 既存の部門「カード」「サプライ」（共有のマスタ。1件に決まらなければ止める） */
export function 既存の部門(名前: "カード" | "サプライ") {
  const r = 部門を名前で探す(名前);
  if (r.length !== 1) throw new Error(`部門「${名前}」が ${r.length} 件ある（共有のマスタなので作らない。1件のはず）`);
  return r[0];
}

const 部門の注記 = "部門は共有のマスタなので登録せず、既存の部門「カード」「サプライ」を使った（正本の部門ID 60909011/60909012・コード D01/D02 ではなく、既存の値。ケースの期待の D01・D02 は既存の部門コードとして確かめる）";

defineSeed("S-M06-09-MASTER", async ({ seed }) => {
  既存の部門("カード");
  既存の部門("サプライ");
  reportSeedIssue(seed.シードID, `${部門の注記}。店頭買取ステータス「買取成立」はこのケースで使わない`);
});
defineSeed("S-M06-09-BROWSER", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "ダウンロードの許可・既存ファイルの除去はテストの基盤が行う（ダウンロードは試験ごとに別の場所へ保存される）。試験端末とサーバーの時刻同期は確かめていない");
});

defineSeed("S-M06-09-ADM", async ({ browser, seed }) => {
  const ids: string[] = [];
  for (const k of キー一覧) ids.push(await 店舗を用意する(browser, k, (m) => reportSeedIssue(seed.シードID, m)));
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: "M06-09試験管理者", ログインID: M0609_ADMIN.loginId, メールアドレス: "m0609_admin@example.test", パスワード: M0609_ADMIN.password,
    権限: "システム管理者", 所属店舗ID: ids[0], デフォルト検索表示店舗ID: ids[0], 編集可能店舗ID: ids,
  }));
  reportSeedIssue(seed.シードID, "管理者内部ID 60909001 は指定できない。権限は「システム管理者」。閲覧・編集できる店舗は、このデータが使う試験店舗11件（店舗は画面で登録）");
});

/** 買取集計データの入れ替えと店舗IDの控え。ケースごとの店舗（店名が正本のとおり）に、期間内の行を入れる */
function defineData(seedId: string, 控え: { label: string; 店: 店キー }[], 期間: [string, string], 行: (c: { カード: string; サプライ: string }) => { 店: 店キー; 行: 集計行 }[]): void {
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    const idOf = {} as Record<string, string>;
    for (const k of new Set([...控え.map((c) => c.店), ...行({ カード: "0", サプライ: "0" }).map((r) => r.店)])) idOf[k] = await 店舗を用意する(browser, k, issue);
    for (const c of 控え) notes.set(c.label, idOf[c.店]);
    const カード = 既存の部門("カード").部門ID, サプライ = 既存の部門("サプライ").部門ID;
    const rows = 行({ カード, サプライ });
    for (const k of Object.keys(idOf) as 店キー[]) 集計データを入れ替える(idOf[k], 店名[k], 期間[0], 期間[1], rows.filter((r) => r.店 === k).map((r) => r.行));
    issue(`店舗「${控え.map((c) => 店名[c.店]).join("」「")}」は正本の店名で登録した。買取集計データ（${期間[0]}〜${期間[1]}）は、画面に登録する操作が無いので、DBで試験店舗の期間内の行を消して入れ直した（内部IDは DB が振る番号）。${部門の注記}`);
  });
}
const L = (n: string) => `〔店舗ID-M0609-${n}〕`;
const 集 = (日時: string, 部門ID: string | null, 買取金額: number, 販売金額: number): 集計行 => ({ 日時, 部門ID, 買取金額, 販売金額 });

defineData("S-M06-09-DATA-001", [{ label: L("001"), 店: "001" }], ["2026-09-01", "2026-09-01"], (s) => [
  { 店: "001", 行: 集("2026-09-01", s.カード, 1000, 3000) }, { 店: "001", 行: 集("2026-09-01", s.カード, 2000, 4000) }]);
defineData("S-M06-09-DATA-003", [{ label: L("003A"), 店: "003A" }, { label: L("003B"), 店: "003B" }], ["2026-08-31", "2026-09-02"], (s) => [
  { 店: "003A", 行: 集("2026-08-31 23:59:59", s.カード, 111, 222) }, { 店: "003A", 行: 集("2026-09-01", s.カード, 1000, 3000) },
  { 店: "003A", 行: 集("2026-09-01", s.カード, 2000, 4000) }, { 店: "003A", 行: 集("2026-09-02", s.カード, 800, 900) },
  { 店: "003A", 行: 集("2026-09-01", s.サプライ, 400, 500) }, { 店: "003B", 行: 集("2026-09-01", s.カード, 600, 700) }]);
defineData("S-M06-09-DATA-004", [{ label: L("004"), 店: "004" }], ["2026-09-02", "2026-09-02"], (s) => [{ 店: "004", 行: 集("2026-09-02", s.カード, 800, 900) }]);
defineData("S-M06-09-DATA-005", [{ label: L("005"), 店: "005" }], ["2026-09-01", "2026-09-01"], (s) => [{ 店: "005", 行: 集("2026-09-01", s.カード, 3000, 7000) }]);
defineData("S-M06-09-DATA-006", [{ label: L("006"), 店: "006" }], ["2026-09-01", "2026-09-01"], (s) => [
  { 店: "006", 行: 集("2026-09-01", s.カード, 1000, 3000) }, { 店: "006", 行: 集("2026-09-01", s.カード, 2000, 4000) }]);
defineData("S-M06-09-NO-SECTION-008", [{ label: L("008"), 店: "008" }], ["2026-09-04", "2026-09-04"], () => [{ 店: "008", 行: 集("2026-09-04", null, 1200, 3400) }]);
defineData("S-M06-09-DATA-009", [{ label: L("009"), 店: "009" }], ["2026-09-01", "2026-09-01"], (s) => [{ 店: "009", 行: 集("2026-09-01", s.カード, 1000, 3000) }]);
defineData("S-M06-09-DATA-011", [{ label: L("011"), 店: "011" }], ["2026-09-01", "2026-09-01"], (s) => [{ 店: "011", 行: 集("2026-09-01", s.カード, 1000, 3000) }]);
defineData("S-M06-09-DATA-014", [{ label: L("014"), 店: "014" }], ["2026-09-06", "2026-09-07"], (s) => [
  { 店: "014", 行: 集("2026-09-06", s.カード, 1000, 3000) }, { 店: "014", 行: 集("2026-09-06", s.サプライ, 400, 500) },
  { 店: "014", 行: 集("2026-09-07", s.カード, 800, 900) }, { 店: "014", 行: 集("2026-09-07", s.サプライ, 200, 300) }]);
defineData("S-M06-09-NO-SECTION-015", [{ label: L("015"), 店: "015" }], ["2026-09-08", "2026-09-08"], (s) => [
  { 店: "015", 行: 集("2026-09-08", s.カード, 1000, 3000) }, { 店: "015", 行: 集("2026-09-08", null, 1200, 3400) }]);

/** 店舗の閲覧権限を持つ、デフォルト検索表示店舗つきの管理者（014・015） */
function defineAdmin(seedId: string, n: "014" | "015", account: Account, needs: string): void {
  defineSeed(seedId, { needs: [needs] }, async ({ browser, notes, seed }) => {
    const id = notes.get(L(n));
    await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
      名前: `M06-09試験管理者${n}`, ログインID: account.loginId, メールアドレス: `${account.loginId}@example.test`, パスワード: account.password,
      権限: "システム管理者", 所属店舗ID: id, デフォルト検索表示店舗ID: id, 編集可能店舗ID: [id],
    }));
    const mid = 管理者IDを探す(account.loginId);
    if (!mid) throw new Error(`管理者 ${account.loginId} が見つからない`);
    notes.set(`〔管理者内部ID-M0609-${n}〕`, mid);
    reportSeedIssue(seed.シードID, `管理者内部ID は画面が振った番号（${mid}）。権限は「システム管理者」で代えた（正本の「買取集計データ画面を利用できる権限グループ」の指定は画面で確かめていない）`);
  });
}
defineAdmin("S-M06-09-ADM-014", "014", M0609_ADMIN_014, "S-M06-09-DATA-014");
defineAdmin("S-M06-09-ADM-015", "015", M0609_ADMIN_015, "S-M06-09-NO-SECTION-015");
