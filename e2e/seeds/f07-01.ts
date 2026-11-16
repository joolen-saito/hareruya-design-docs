/**
 * F07-01 イベント大会TOP のシード（画面操作）。正本: cases/F07-01_seed_data.tsv
 * 店舗は店舗登録画面、イベントはイベント登録画面・日程追加で作る。イベント名は実行ごとの印を付ける（rc）。
 * 専用ブラウザのクッキー（イベント店舗）は、ケースの事前準備としてテスト側が設定する（シードの作り方はブラウザの外）。
 *
 * 店舗は使い回す（依頼者の指示 2026-11-12「毎回作らずに1個でいけるやつは使い回す」。以前はケースごと・実行ごとに約30店を作っていた）:
 * - シード表はケースごとに店舗（東京試験店・大阪試験店・F0701-<番号>-店）を作るとするが、決まった名前の2店だけを使う。
 *   試験店A「F0701試験店A-E2E」: 東京試験店・F0701-<番号>-店の役（どのケースも、店舗の違いでなく、選んだ店舗・その店舗のイベントを確かめる）。
 *   試験店B「F0701試験店B-E2E」: 大阪試験店の役（003・006 の「別の店舗」）と、119 の他店。
 *   無ければ1度だけ作り、以後は使い回す。各ケースの〔店舗ID-…〕にはそのどちらかの店舗IDを控える。
 * - イベントはケースの結果を見るので、これまでどおり実行ごとに印つきで作る。ケースは自分の印つきのイベント名で確かめる。
 *   117〜119 のカレンダーの「2日後にイベントが無い」は、試験店Aに2日後の公開の日程を持つイベントが無いことを前提にする
 *   （同じ回の 117・118 の2日後のものは非公開、119 の他店のものは試験店B。前の回の2日後は、今日から見て翌日以前）。
 * - イベントを登録する管理者も、試験店A・Bを編集できる決まった管理者1人（f07a0701e2e）を使い回す。
 */
import { SETUP_ADMIN } from "../config/env";
import { 店舗が登録されている } from "../db/f07_01";
import { rc } from "../lib/run_marker";
import { 店名を読む } from "../lib/store_pick";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { withAdminSession } from "../lib/session";
import { イベントと日程を登録する, 実行日から, 試験店舗の管理者を用意する, 決まった試験店舗の支店URL, 決まった試験店舗を用意する, 日程 } from "../pages/admin/f07_01_setup";

/** 店舗は作らない（依頼者 2026-11-15「店舗は作るのもう禁止」）。試験店A=E2E の店舗 5007・試験店B=E2E の店舗 5006（どちらも公開・開店の支店）。店名・支店URLは店舗のいまの値 */
const 試験店A = { id: "5007", get 店名(): string { return 店名を読む("5007"); }, 通番: "0701a" } as const;
const 試験店B = { id: "5006", get 店名(): string { return 店名を読む("5006"); }, 通番: "0701b" } as const;
/** シード表の「東京試験店-<番号>」は試験店A、「大阪試験店-<番号>」は試験店B */
export const 店名 = (_n: string, 種別 = "東京試験店"): string => (種別 === "大阪試験店" ? 試験店B.店名 : 試験店A.店名);
/** シード表の「F0701-<番号>-店」は試験店A */
export const 店名F = (_n: string): string => 試験店A.店名;
/** シード表の「F0701-119-他店」は試験店B */
const 他店 = (): string => 試験店B.店名;
/** 店名の店舗の支店URL（店舗の詳細ページのアドレス） */
export const 店の支店URL = (名: string): string => 決まった試験店舗の支店URL(名 === 試験店B.店名 ? 試験店B.通番 : 試験店A.通番, 名);

/** 店名の決まった試験店舗を用意し、店舗IDを返す（無ければ1度だけ作る） */
async function 試験店を用意する(page: import("@playwright/test").Page, 名: string, issue: (m: string) => void): Promise<string> {
  const s = 名 === 試験店B.店名 ? 試験店B : 試験店A;
  return 決まった試験店舗を用意する(page, s.店名, s.通番, issue);
}

/** 店舗を1つ以上用意し、店舗IDを控える（labels は店舗ごとの呼び名） */
function defineShopsSeed(seedId: string, shops: { 店名: string; label: string }[]): void {
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      for (const s of shops) notes.set(s.label, await 試験店を用意する(page, s.店名, (m) => reportSeedIssue(seed.シードID, m)));
    });
  });
}

defineShopsSeed("S-F07-01-SHOPS-002", [{ 店名: 店名("002"), label: "〔店舗ID-F0701-002〕" }]);
defineShopsSeed("S-F07-01-SHOPS-003", [
  { 店名: 店名("003"), label: "〔店舗ID-F0701-003A〕" },
  { 店名: 店名("003", "大阪試験店"), label: "〔店舗ID-F0701-003B〕" },
]);
defineShopsSeed("S-F07-01-SHOPS-006", [
  { 店名: 店名("006"), label: "〔店舗ID-F0701-006A〕" },
  { 店名: 店名("006", "大阪試験店"), label: "〔店舗ID-F0701-006B〕" },
]);
defineShopsSeed("S-F07-01-SHOPS-007", [{ 店名: 店名("007"), label: "〔店舗ID-F0701-007〕" }]);
defineShopsSeed("S-F07-01-COOKIE-105", [{ 店名: 店名F("105"), label: "〔店舗ID-F0701-105〕" }]);
defineShopsSeed("S-F07-01-CBCOOKIESAME-106", [{ 店名: 店名F("106"), label: "〔店舗ID-F0701-106〕" }]);

// 店舗ID 999999 は未登録のはず。シード表の投入方法は「あれば試験データを削除する」だが、何も作らず、未登録であることだけ確かめる（参照のみ）
defineSeed("S-F07-01-SHOPS-005", async () => {
  if (店舗が登録されている(999999)) throw new Error("店舗ID 999999 の店舗が登録されている（シード表は、あれば削除すると定めるが、E2E は削除しない。判断待ち）");
});

type イベント定義 = { イベント名: string; label?: string; 店舗: string; 公開状態: "公開" | "非公開"; 参加費?: string; 日程: { 開始: string; 公開状態?: "公開" | "非公開" }[] };

/** 店舗を用意し、試験店A・Bを編集できる決まった管理者でイベントと日程を登録する */
function defineEventsSeed(seedId: string, _通番: string, 店舗: { 店名: string; label?: string }[], events: イベント定義[]): void {
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    const account = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      for (const s of 店舗) {
        const id = await 試験店を用意する(page, s.店名, issue);
        if (s.label) notes.set(s.label, id);
      }
      // 両方の店舗がそろってから管理者を用意する（編集可能店舗に両方を入れる。管理者は1人を使い回す）
      await 試験店を用意する(page, 試験店A.店名, issue);
      await 試験店を用意する(page, 試験店B.店名, issue);
      return 試験店舗の管理者を用意する(page, "0701", [試験店A.店名, 試験店B.店名]);
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
defineEventsSeed("S-F07-01-CBLIST-119", "119", [{ 店名: 店名F("119"), label: "〔店舗ID-F0701-119〕" }, { 店名: 他店() }], [
  { イベント名: rc("F0701-119-PUB"), 店舗: 店名F("119"), 公開状態: "公開", 日程: [{ 開始: 翌日() }] },
  { イベント名: rc("F0701-119-OTHER"), 店舗: 他店(), 公開状態: "公開", 日程: [{ 開始: 二日後() }] },
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

defineShopsSeed("S-F07-01-SHOPS-004", [{ 店名: 店名("004"), label: "〔店舗ID-F0701-004〕" }]);

const 十月十五日 = "2030-10-15 10:00";
defineEventsSeed("S-F07-01-FILTER-040", "040", [{ 店名: 店名F("040"), label: "〔店舗ID-F0701-040〕" }], [
  { イベント名: rc("FILTER-STANDARD-040"), 店舗: 店名F("040"), 公開状態: "公開", 日程: [{ 開始: 十月十五日 }] },
]);
defineEventsSeed("S-F07-01-ICON-099", "099", [{ 店名: 店名F("099"), label: "〔店舗ID-F0701-099〕" }], [
  { イベント名: rc("F0701-099-REG"), 店舗: 店名F("099"), 公開状態: "公開", 参加費: "1000", 日程: [{ 開始: 翌日() }] },
]);

/** 107〜116: 複数日程イベントの日別画面。店舗1つ・イベント1つ（公開）・日程（すべて公開）を作り、店舗ID・イベントIDを控える */
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
// 116: 公開のイベントだけを作り、開催日程は1件も登録しない
defineEventsSeed("S-F07-01-CBDAY-116", "116", 日別の店("116"), 日別のイベント("116", []));
