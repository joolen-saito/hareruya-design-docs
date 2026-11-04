/**
 * M13-04 繰返日程追加 のシード（画面操作）。正本: cases/M13-04_seed_data.tsv
 * - 管理者（S-M13-04-ADM）: 店舗A・店舗Bは M13-02/03 と同じ店名なので、あればそれを使う。m1304_admin は店舗Aだけに編集権限を持つ。
 *   権限は正本の「イベント管理を操作できる権限」の代わりに、M13-02 と同じ「店舗オーナー」にした。
 * - イベント: イベント登録画面から登録する。イベント名には実行の印を付ける（rc）。定員64・参加費3000・公開・クレジットカード決済が既定。
 * - 休日マスタ（EVENT-005）: 祝日管理に 2026/09/10 の試験用の祝日を足す。2026/09/09・2026/09/11 に祝日が無いことは確かめるだけ。
 */
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { EventInput, registerEvent } from "../pages/admin/event";
import { ensureMember } from "../pages/admin/member";
import { ensureTenant } from "../pages/admin/tenant";
import { 試験用の祝日を足す, 祝日が無いことを確かめる } from "../pages/admin/m13_holiday_setup";

export const M1304_ADMIN: Account = { loginId: "m1304_admin", password: "Passw0rd!M1304" };

defineSeed("S-M13-04-ADM", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    void notes;
    await ensureTenant(page, { 店名: "店舗A", 店名カナ: "テンポエー", 店名英語: "Shop A", 支店URL: "m1302a", 店名略称3文字: "テA", ショップ名略称: "店舗A" }, issue);
    await ensureTenant(page, { 店名: "店舗B", 店名カナ: "テンポビー", 店名英語: "Shop B", 支店URL: "m1302b", 店名略称3文字: "テB", ショップ名略称: "店舗B" }, issue);
    await ensureMember(page, {
      名前: "M13-04試験管理者", 所属店舗: "店舗A", ログインID: M1304_ADMIN.loginId, メールアドレス: "m1304_admin@example.test",
      パスワード: M1304_ADMIN.password, 権限: "店舗オーナー", デフォルト検索表示店舗: "店舗A", 編集可能店舗: ["店舗A"],
    });
  });
});

const クレカ = ["クレジットカード決済"];
function イベント(名前: string, over: EventInput = {}): EventInput {
  return {
    イベント名日: rc(名前), イベント名英: `${rc(名前)} EN`, 店舗: "店舗A", フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎",
    公開状態: "公開", 定員: "64", 参加費: "3000", 支払方法: クレジットカード(), ...over,
  };
}
function クレジットカード() { return クレカ; }

/** イベント1件のシード。labels は [控える呼び名, イベント名, 上書き] */
function defineEvents(seedId: string, items: [string, string, EventInput?][], after?: (page: import("@playwright/test").Page, notes: import("../lib/notes").Notes, seedId: string) => Promise<void>): void {
  defineSeed(seedId, { needs: ["S-M13-04-ADM"] }, async ({ browser, notes, seed }) => {
    await withAdminSession(browser, M1304_ADMIN, async (page) => {
      for (const [label, 名前, over] of items) notes.set(label, await registerEvent(page, イベント(名前, over)));
    });
    if (after) await withAdminSession(browser, SETUP_ADMIN, (page) => after(page, notes, seed.シードID));
  });
}

const 基本 = (n: string) => defineEvents(`S-M13-04-EVENT-${n}`, [[`〔イベントID-M1304-${n}〕`, `M1304-${n}基本イベント`]]);
for (const n of ["001", "002", "004", "006", "007", "008", "022", "023", "024", "029", "031"]) 基本(n);
defineEvents("S-M13-04-EVENT-003", [["〔イベントID-M1304-003〕", "M1304-003賞品イベント", { 賞品日: "M1304-003賞品", 賞品英: "M1304-003 Prize" }]]);
defineEvents("S-M13-04-EVENT-005", [["〔イベントID-M1304-005〕", "M1304-005基本イベント"]],
  async (page, _n, id) => { await 試験用の祝日を足す(page, "2026/09/10", "M1304-005休日", (m) => reportSeedIssue(id, m)); });
defineEvents("S-M13-04-EVENT-034", [["〔イベントID-M1304-034〕", "M1304-034表示イベント"]]);
defineEvents("S-M13-04-EVENT-035", [["〔イベントID-M1304-035〕", "M1304-035表示イベント"]]);
defineEvents("S-M13-04-EVENT-038", [["〔イベントID-M1304-038〕", "M1304-038基本イベント"]]);
defineEvents("S-M13-04-EVENT-019", [["〔イベントID-M1304-019〕", "M1304-019有料支払方法なしイベント", { 支払方法: [] }]]);
defineEvents("S-M13-04-EVENT-020", [["〔イベントID-M1304-020〕", "M1304-020有料支払方法なしイベント", { 支払方法: [] }]]);
defineEvents("S-M13-04-EVENT-021", [
  ["〔イベントID-M1304-021A〕", "M1304-021無料支払方法なしイベント", { 支払方法: [], 参加費: "0" }],
  ["〔イベントID-M1304-021B〕", "M1304-021有料支払方法なしイベント", { 支払方法: [] }],
]);
defineEvents("S-M13-04-DPWEEKDAY-041", [["〔イベントID-M1304-041〕", "M1304-041基本イベント"]],
  async (page) => { await 祝日が無いことを確かめる(page, "2026/09/09"); });
defineEvents("S-M13-04-DPORDER-042", [["〔イベントID-M1304-042〕", "M1304-042有料支払方法なしイベント", { 支払方法: [] }]]);
defineEvents("S-M13-04-DPPRIVATE-044", [["〔イベントID-M1304-044〕", "M1304-044非公開イベント", { 公開状態: "非公開" }]]);
defineEvents("S-M13-04-CBFREENODAY-046", [["〔イベントID-M1304-CB046〕", "M1304-CB046-無料該当日なしイベント", { 支払方法: [], 参加費: "0" }]]);
defineEvents("S-M13-04-CBFREEWEEKDAY-047", [["〔イベントID-M1304-CB047〕", "M1304-CB047-無料平日イベント", { 支払方法: [], 参加費: "0" }]],
  async (page) => { await 祝日が無いことを確かめる(page, "2026/09/09"); });
defineEvents("S-M13-04-CBFREEHOLIDAY-048", [["〔イベントID-M1304-CB048〕", "M1304-CB048-無料土日イベント", { 支払方法: [], 参加費: "0" }]]);
defineEvents("S-M13-04-CBCARDHOLIDAY-049", [["〔イベントID-M1304-CB049〕", "M1304-CB049-カード決済土日イベント"]]);
