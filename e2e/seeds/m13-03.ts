/**
 * M13-03 日程登録/編集 のシードの作り方（画面操作）。正本: cases/M13-03_seed_data.tsv
 *
 * - 管理者・店舗（S-M13-03-ADM）: 店舗A・店舗Bは M13-02 と同じ店名なので、店舗一覧にあればそれを使う。
 *   試験管理者 m1303_admin は店舗Aだけに編集権限を持つ。権限は正本の「イベント管理を操作できる権限」の代わりに、M13-02 と同じ「店舗オーナー」にした。
 * - 基本イベント（BASE-NNN など）: 試験管理者でイベント登録画面から登録する。イベント名には実行の印を付ける（rc）。
 * - 日程つきイベント（EDIT-NNN など）: 続けて祝日管理に開始日の祝日が無いことを確かめ（手元の祝日には 2026/10/01 は無い）、日程を登録し、日程IDを控える。
 * - 祝日（HOLIDAY-005）: 手元の祝日一覧に 2026/09/10 の行は無い。試験用の祝日を足す。前の実行が足した同じ名称の行は消して足し直す。
 *   名称の違う行（手元の本来の祝日）があれば消さずに止める。
 *
 * 作らないシード: 権限外店舗のイベント（NOAUTH）は別の管理者が要る分だけ、QK/RI 系は別機能のシードの連携が要る分は作っていない（記録を参照）。
 */
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { Page } from "@playwright/test";
import { EventInput, registerEvent } from "../pages/admin/event";
import { ensureMember } from "../pages/admin/member";
import { registerSchedule, ScheduleInput } from "../pages/admin/schedule";
import { ensureTenant } from "../pages/admin/tenant";
import { 試験用の祝日を足す, 祝日が無いことを確かめる } from "../pages/admin/m13_holiday_setup";

export const M1303_ADMIN: Account = { loginId: "m1303_admin", password: "Passw0rd!M1303" };

defineSeed("S-M13-03-ADM", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    notes.set("〔店舗ID-M1303-共有A〕", await ensureTenant(page, { 店名: "店舗A", 店名カナ: "テンポエー", 店名英語: "Shop A", 支店URL: "m1302a", 店名略称3文字: "テA", ショップ名略称: "店舗A" }, issue));
    notes.set("〔店舗ID-M1303-共有B〕", await ensureTenant(page, { 店名: "店舗B", 店名カナ: "テンポビー", 店名英語: "Shop B", 支店URL: "m1302b", 店名略称3文字: "テB", ショップ名略称: "店舗B" }, issue));
    notes.set("〔管理者ID-M1303-共有〕", await ensureMember(page, {
      名前: "M13-03 試験管理者", 所属店舗: "店舗A", ログインID: M1303_ADMIN.loginId, メールアドレス: "m1303_admin@example.test",
      パスワード: M1303_ADMIN.password, 権限: "店舗オーナー", デフォルト検索表示店舗: "店舗A", 編集可能店舗: ["店舗A"],
    }));
  });
});

const クレカ = { 支払方法: ["クレジットカード決済"] };

/** シード表のイベント: 店舗A・初心者歓迎・チーム戦オフ・定員10・参加費0・公開・クレジットカード決済（変えたい項目だけ over で与える） */
export function 基本イベント(名前: string, over: EventInput = {}): EventInput {
  return {
    イベント名日: rc(名前), イベント名英: `English ${rc(名前)}`, 店舗: "店舗A", フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎",
    公開状態: "公開", チーム戦: false, 定員: "10", 参加費: "0", ...クレカ, ...over,
  };
}

/** 試験管理者でイベントを登録し、イベントIDを返す */
async function イベントを登録する(page: Page, 名前: string, over: EventInput = {}): Promise<string> {
  return registerEvent(page, 基本イベント(名前, over));
}

/** 基本イベント1件のシード */
function defineBase(seedId: string, label: string, 名前: string, over: EventInput = {}): void {
  defineSeed(seedId, { needs: ["S-M13-03-ADM"] }, async ({ browser, notes }) => {
    await withAdminSession(browser, M1303_ADMIN, async (page) => { notes.set(label, await イベントを登録する(page, 名前, over)); });
  });
}

const 基本 = (n: string, over: EventInput = {}) => defineBase(`S-M13-03-BASE-${n}`, `〔イベントID-M1303-${n}〕`, `M1303-${n}基本イベント`, over);
for (const n of ["001", "002", "003", "004", "006", "007", "008", "010", "017", "019", "022", "028", "029", "032", "059", "060"]) 基本(n);
基本("057", { 定員: "20", 参加費: "1500" });
基本("058", { 公開状態: "非公開" });
defineBase("S-M13-03-LIMIT-048", "〔イベントID-M1303-048〕", "M1303-048基本イベント");
defineBase("S-M13-03-LIMIT-050", "〔イベントID-M1303-050〕", "M1303-050基本イベント");
defineBase("S-M13-03-PRIZE-052", "〔イベントID-M1303-052〕", "M1303-052賞品イベント", { 賞品日: "M1303-052賞品日", 賞品英: "M1303-052-PRIZE-EN" });
defineBase("S-M13-03-LABEL-053", "〔イベントID-M1303-053〕", "M1303-053追加表示イベント");

/** 支払方法が未設定のイベント（クレジットカード決済なし） */
for (const n of ["063", "064", "065"]) {
  const 名前 = `M1303-CB${n}-EVENT`;
  if (n === "063") defineBase("S-M13-03-CBDATE-063", "〔イベントID-M1303-CB063〕", 名前, { 支払方法: [] });
  else {
    defineSeed(`S-M13-03-CBDATE-${n}`, { needs: ["S-M13-03-ADM"] }, async ({ browser, notes }) => {
      await withAdminSession(browser, M1303_ADMIN, async (page) => {
        const id = await イベントを登録する(page, 名前, { 支払方法: [] });
        notes.set(`〔イベントID-M1303-CB${n}〕`, id);
        notes.set(`〔日程ID-M1303-CB${n}〕`, await registerSchedule(page, id, 既定の日程({ 参加費: "0" })));
      });
    });
  }
}

/** シード表の日程: 開始 2026/10/01 18:00・受付/デッキ登録/オンライン受付はすべてオフ・定員16・参加費500・公開 */
function 既定の日程(over: Partial<ScheduleInput> = {}): ScheduleInput {
  return { 開始時間: "2026-10-01 18:00", 受付あり: false, デッキ登録あり: false, 定員: "16", 参加費: "500", 公開状態: "公開", ...over };
}

/** 日程つきのイベント1件のシード（日程IDを控える） */
function defineWithSchedule(seedId: string, no: string, 名前: string): void {
  defineSeed(seedId, { needs: ["S-M13-03-ADM"] }, async ({ browser, notes }) => {
    await withAdminSession(browser, M1303_ADMIN, async (page) => {
      const id = await イベントを登録する(page, 名前);
      notes.set(`〔イベントID-M1303-${no}〕`, id);
      notes.set(`〔日程ID-M1303-${no}〕`, await registerSchedule(page, id, 既定の日程()));
    });
  });
}
for (const n of ["011", "012", "037", "038", "041", "042", "046"]) defineWithSchedule(`S-M13-03-EDIT-${n}`, n, `M1303-${n}編集イベント`);
defineWithSchedule("S-M13-03-LABEL-047", "047", "M1303-047表示イベント");

/** チーム戦オフ(A)・オン(B)の2件 */
defineSeed("S-M13-03-TEAM-009", { needs: ["S-M13-03-ADM"] }, async ({ browser, notes }) => {
  await withAdminSession(browser, M1303_ADMIN, async (page) => {
    notes.set("〔イベントID-M1303-009A〕", await イベントを登録する(page, "M1303-009基本イベント"));
    notes.set("〔イベントID-M1303-009B〕", await イベントを登録する(page, "M1303-009チーム戦イベント", { チーム戦: true }));
  });
});

// 祝日（日付 2026/09/10）。前の実行が足した試験用の祝日は消して足し直す
defineSeed("S-M13-03-HOLIDAY-005", { needs: ["S-M13-03-ADM"] }, async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    notes.set("〔休日ID-M1303-005〕", await 試験用の祝日を足す(page, "2026/09/10", "M13-03試験祝日-005", (m) => reportSeedIssue(seed.シードID, m)));
  });
});

// 日付 2026/09/11 の祝日が無いこと（シード表: あれば削除）。手元に無いことを確かめるだけにする
defineSeed("S-M13-03-HOLIDAY-059", { needs: ["S-M13-03-ADM"] }, async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => 祝日が無いことを確かめる(page, "2026/09/11"));
});
