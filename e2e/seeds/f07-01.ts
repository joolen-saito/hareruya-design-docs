/**
 * F07-01 イベント大会TOP のシード（画面操作）。正本: cases/F07-01_seed_data.tsv
 * 店舗は店舗登録画面、イベントはイベント登録画面・日程追加で作る。店名・イベント名は実行ごとの印を付ける（rc）。
 * 専用ブラウザのクッキー（イベント店舗）は、ケースの事前準備としてテスト側が設定する（シードの作り方はブラウザの外）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 店舗が登録されている } from "../db/f07_01";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
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

type イベント定義 = { イベント名: string; label?: string; 店舗: string; 公開状態: "公開" | "非公開"; 参加費?: string; 日程: { 開始: string; 公開状態?: "公開" | "非公開" }[] };

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
        const r = await イベントと日程を登録する(page, { イベント名日: e.イベント名, 店舗: e.店舗, 公開状態: e.公開状態, ...(e.参加費 ? { 参加費: e.参加費 } : {}) }, e.日程.map((d) => 日程(d.開始, d.公開状態)));
        if (e.label) notes.set(e.label, r.イベントID);
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

// ---- 既定店舗・共有マスタ（書き換えない。読むだけ。依頼者の方針 2026-11-10） ----
// シード表の DEFAULT は「店舗ID 1 の店名・公開・店舗詳細ページと既定店舗の環境設定の書き換え」（共有の設定）。書き換えず、店舗ID 1 が登録されていることだけ確かめる。
defineSeed("S-F07-01-DEFAULT", async ({ seed }) => {
  if (!店舗が登録されている(1)) throw new Error("店舗ID 1 の店舗が登録されていない（既定店舗の前提と違う）");
  reportSeedIssue(seed.シードID, "既定店舗（店舗ID 1）の店名・公開・店舗詳細ページと既定店舗の環境設定は、共有の設定なので書き換えず、いまの設定のまま確かめた（店舗ID 1 が登録されていることだけ確認）");
});
// シード表の MASTERS は共有マスタ（フォーマット・ルール適用度・イベント規模）の登録・追加。足さず、既存のフォーマット「スタンダード」で読み替える。
defineSeed("S-F07-01-MASTERS", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "共有のマスタ（フォーマット・ルール適用度・イベント規模）には試験の値を足さず、既存のフォーマット「スタンダード」で「スタンダード試験」を読み替えた。イベント規模の「通常規模」は選択肢に無いので、イベント規模を選ばない（定番イベントに並ぶ）ことで読み替えた");
});
// 専用ブラウザ（クッキーなし）は、ケースの中で新しいブラウザの文脈を作る（Playwright の page は毎回クッキーなしで始まる）
defineSeed("S-F07-01-BROWSER-001", async () => {});

defineShopsSeed("S-F07-01-SHOPS-004", [{ 通番: "004", 店名: 店名("004"), label: "〔店舗ID-F0701-004〕" }]);

const 十月十五日 = "2030-10-15 10:00";
defineEventsSeed("S-F07-01-FILTER-040", "040", [{ 店名: 店名F("040"), label: "〔店舗ID-F0701-040〕" }], [
  { イベント名: rc("FILTER-STANDARD-040"), 店舗: 店名F("040"), 公開状態: "公開", 日程: [{ 開始: 十月十五日 }] },
]);
defineEventsSeed("S-F07-01-ICON-099", "099", [{ 店名: 店名F("099"), label: "〔店舗ID-F0701-099〕" }], [
  { イベント名: rc("F0701-099-REG"), 店舗: 店名F("099"), 公開状態: "公開", 参加費: "1000", 日程: [{ 開始: 翌日() }] },
]);

/** 107〜115: 複数日程イベントの日別画面。店舗1つ・イベント1つ（公開）・日程（すべて公開）を作り、店舗ID・イベントIDを控える */
const 日別の店 = (n: string) => [{ 店名: 店名F(n), label: `〔店舗ID-F0701-${n}〕` }];
const 日別のイベント = (n: string, 日程一覧: string[]): イベント定義[] => [
  { イベント名: rc(`F0701-${n}-EVT`), label: `〔イベントID-F0701-${n}〕`, 店舗: 店名F(n), 公開状態: "公開", 日程: 日程一覧.map((開始) => ({ 開始 })) },
];
defineEventsSeed("S-F07-01-CBDAY-107", "107", 日別の店("107"), 日別のイベント("107", ["2025-10-14 10:00", "2025-10-16 10:00"]));
defineEventsSeed("S-F07-01-CBDAY-108", "108", 日別の店("108"), 日別のイベント("108", ["2025-10-14 10:00", "2025-10-15 10:00"]));
defineEventsSeed("S-F07-01-CBDAY-109", "109", 日別の店("109"), 日別のイベント("109", ["2025-10-15 13:00", "2025-10-15 10:00"]));
defineEventsSeed("S-F07-01-CBDAY-110", "110", 日別の店("110"), 日別のイベント("110", ["2030-10-14 10:00", "2030-10-16 10:00"]));
defineEventsSeed("S-F07-01-CBDAY-111", "111", 日別の店("111"), 日別のイベント("111", ["2030-10-15 10:00", "2030-10-16 10:00"]));
defineEventsSeed("S-F07-01-CBDAY-112", "112", 日別の店("112"), 日別のイベント("112", ["2030-10-15 13:00", "2030-10-15 10:00"]));
defineEventsSeed("S-F07-01-CBDAY-113", "113", 日別の店("113"), 日別のイベント("113", ["2025-10-14 10:00", "2025-10-15 10:00"]));
defineEventsSeed("S-F07-01-CBDAY-114", "114", 日別の店("114"), 日別のイベント("114", ["2025-10-15 10:00", "2030-10-15 10:00"]));
defineEventsSeed("S-F07-01-CBDAY-115", "115", 日別の店("115"), 日別のイベント("115", ["2030-10-16 10:00", "2025-10-15 10:00", "2030-10-15 13:00"]));
