/**
 * F07-01 イベント大会TOP のシード（画面操作）。正本: cases/F07-01_seed_data.tsv
 * 店舗は店舗登録画面、イベントはイベント登録画面・日程追加で作る。店名・イベント名は実行ごとの印を付ける（rc）。
 * 専用ブラウザのクッキー（イベント店舗）は、ケースの事前準備としてテスト側が設定する（シードの作り方はブラウザの外）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 店舗が登録されている } from "../db/f07_01";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { イベントと日程を登録する, 実行日から, 試験店舗の管理者を用意する, 試験店舗を登録する, 日程 } from "../pages/admin/f07_01_setup";

export const 店名 = (n: string, 種別 = "東京試験店"): string => rc(`${種別}-${n}`);
export const 店名F = (n: string): string => rc(`F0701-${n}-店`);

/** 店舗を1つ以上登録し、店舗IDを控える（labels は店舗ごとの呼び名） */
function defineShopsSeed(seedId: string, shops: { 通番: string; 店名: string; label: string }[]): void {
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      for (const s of shops) notes.set(s.label, await 試験店舗を登録する(page, s.店名, s.通番, (m) => reportSeedIssue(seed.シードID, m)));
    });
  });
}

defineShopsSeed("S-F07-01-SHOPS-002", [{ 通番: "002", 店名: 店名("002"), label: "〔店舗ID-F0701-002〕" }]);
defineShopsSeed("S-F07-01-SHOPS-003", [
  { 通番: "003a", 店名: 店名("003"), label: "〔店舗ID-F0701-003A〕" },
  { 通番: "003b", 店名: 店名("003", "大阪試験店"), label: "〔店舗ID-F0701-003B〕" },
]);
defineShopsSeed("S-F07-01-SHOPS-006", [
  { 通番: "006a", 店名: 店名("006"), label: "〔店舗ID-F0701-006A〕" },
  { 通番: "006b", 店名: 店名("006", "大阪試験店"), label: "〔店舗ID-F0701-006B〕" },
]);
defineShopsSeed("S-F07-01-SHOPS-007", [{ 通番: "007", 店名: 店名("007"), label: "〔店舗ID-F0701-007〕" }]);
defineShopsSeed("S-F07-01-COOKIE-105", [{ 通番: "105", 店名: 店名F("105"), label: "〔店舗ID-F0701-105〕" }]);
defineShopsSeed("S-F07-01-CBCOOKIESAME-106", [{ 通番: "106", 店名: 店名F("106"), label: "〔店舗ID-F0701-106〕" }]);

// 店舗ID 999999 は未登録のはず。シード表の投入方法は「あれば試験データを削除する」だが、何も作らず、未登録であることだけ確かめる（参照のみ）
defineSeed("S-F07-01-SHOPS-005", async () => {
  if (店舗が登録されている(999999)) throw new Error("店舗ID 999999 の店舗が登録されている（シード表は、あれば削除すると定めるが、E2E は削除しない。判断待ち）");
});

type イベント定義 = { イベント名: string; 店舗: string; 公開状態: "公開" | "非公開"; 参加費?: string; 日程: { 開始: string; 公開状態?: "公開" | "非公開" }[] };

/** 店舗を登録し、その店舗を編集できる管理者でイベントと日程を登録する */
function defineEventsSeed(seedId: string, 通番: string, 店舗: { 店名: string; label?: string }[], events: イベント定義[]): void {
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    const account = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      for (const [i, s] of 店舗.entries()) {
        const id = await 試験店舗を登録する(page, s.店名, `${通番}${String.fromCharCode(97 + i)}`, issue);
        if (s.label) notes.set(s.label, id);
      }
      return 試験店舗の管理者を用意する(page, 通番, 店舗.map((s) => s.店名));
    });
    await withAdminSession(browser, account, async (page) => {
      for (const e of events) {
        await イベントと日程を登録する(page, { イベント名日: e.イベント名, 店舗: e.店舗, 公開状態: e.公開状態, ...(e.参加費 ? { 参加費: e.参加費 } : {}) }, e.日程.map((d) => 日程(d.開始, d.公開状態)));
      }
    });
  });
}

const 翌日 = (): string => 実行日から(1, "15:00");
const 二日後 = (): string => 実行日から(2, "15:00");
defineEventsSeed("S-F07-01-CBLIST-117", "117", [{ 店名: 店名F("117"), label: "〔店舗ID-F0701-117〕" }], [
  { イベント名: rc("F0701-117-PUB"), 店舗: 店名F("117"), 公開状態: "公開", 日程: [{ 開始: 翌日() }] },
  { イベント名: rc("F0701-117-PRIV"), 店舗: 店名F("117"), 公開状態: "非公開", 日程: [{ 開始: 二日後() }] },
]);
defineEventsSeed("S-F07-01-CBLIST-118", "118", [{ 店名: 店名F("118"), label: "〔店舗ID-F0701-118〕" }], [
  { イベント名: rc("F0701-118-PUB"), 店舗: 店名F("118"), 公開状態: "公開", 日程: [{ 開始: 翌日() }] },
  { イベント名: rc("F0701-118-PRIV"), 店舗: 店名F("118"), 公開状態: "公開", 日程: [{ 開始: 二日後(), 公開状態: "非公開" }] },
]);
defineEventsSeed("S-F07-01-CBLIST-119", "119", [{ 店名: 店名F("119"), label: "〔店舗ID-F0701-119〕" }, { 店名: rc("F0701-119-他店") }], [
  { イベント名: rc("F0701-119-PUB"), 店舗: 店名F("119"), 公開状態: "公開", 日程: [{ 開始: 翌日() }] },
  { イベント名: rc("F0701-119-OTHER"), 店舗: rc("F0701-119-他店"), 公開状態: "公開", 日程: [{ 開始: 二日後() }] },
]);
