/**
 * フロント 会員/店舗「店頭モニターに受注管理から登録した番号札を表示」（F06-25）E2E。
 * 本リポジトリでは未実行の雛形。ec-cube-enterprise/pf-eccube3 の実画面は実行不可で構造参考のみ。
 * 対応ケース表: integration_test/e2e/f06_25_front_member_store_order_call_number_e2e_cases.md
 *
 * 期待結果（オラクル）は functions/pf-eccube3/f06-25_front_member_store_order_call_number.md 由来であり、
 * 実装/POM由来の表示文言をオラクル化しない。本機能は表示専用・会員ログイン不要（店頭設置モニター）。
 * 非破壊の画面表示・API応答（形）は live、番号札データに依存する内容確認（最大件数/0件/補完/取得時点）は
 * 要シードのため test.fixme（理由付き）で保留する。手動（音声再生・ポーリング時間・取得失敗注入）はケース表で管理する。
 */
import { test, expect } from "@playwright/test";
import { FrontStoreOrderCallNumberPage } from "../../../pages/front/f06/f06_25_front_member_store_order_call_number.page";

test.describe("フロント > 店舗 > 店頭モニター番号札表示", { tag: ["@front", "@store"] }, () => {
  test("E2E-F06-25-008 店内モニター画面（第1）が表示され番号表示枠を持つ", async ({ page }) => {
    const monitor = new FrontStoreOrderCallNumberPage(page);
    await monitor.gotoMonitor1();
    await monitor.seeMonitorScreen();
  });

  test("E2E-F06-25-009 店内モニター画面（第2）が第1と同一の表示画面で表示される", async ({ page }) => {
    const monitor = new FrontStoreOrderCallNumberPage(page);
    await monitor.gotoMonitor2();
    await monitor.seeMonitorScreen();
  });

  test("E2E-F06-25-007 モニター画面は表示専用で会員ログインなしにアクセスできる", async ({ page }) => {
    const monitor = new FrontStoreOrderCallNumberPage(page);
    await monitor.gotoMonitor1();
    // 会員ログインを要求せず表示専用画面が表示されること（権限：未ログインでアクセス可）。
    await expect(page).toHaveURL(/waiting_number_1(?:\?|$)/);
    await expect(monitor.body).toBeVisible();
  });

  test("E2E-F06-25-063 未ログインでも注文番号取得APIへアクセスできる（表示専用API）", async ({ page, request }) => {
    const monitor = new FrontStoreOrderCallNumberPage(page);
    const res = await monitor.getWaitingApi(request);
    // 権限：未ログインでもAPIへアクセスできる（表示専用API）。
    expect(res.status()).toBe(200);
  });

  test("E2E-F06-25-010 注文番号取得APIがHTTP200でJSON配列を返す", async ({ page, request }) => {
    const monitor = new FrontStoreOrderCallNumberPage(page);
    const res = await monitor.getWaitingApi(request);
    // 期待は設計書「成功時はJSON配列をHTTP200で返す」由来。内容（件数・値）は番号札データに依存するため形のみ検証。
    expect(res.status()).toBe(200);
    const bodyJson = await res.json();
    expect(Array.isArray(bodyJson)).toBeTruthy();
  });

  test("E2E-F06-25-021 注文番号取得APIへ直接アクセスするとJSON応答を返す（URL直接アクセス）", async ({ page, request }) => {
    const monitor = new FrontStoreOrderCallNumberPage(page);
    const res = await monitor.getWaitingApi(request);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"] || "").toContain("json");
  });

  // --- 要シード（番号札データ）。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F06-25-014 表示最大件数25を超える場合は連続番号がまとめて整形される（要: SEED-F06-25-OVERFLOW 26件以上）", async () => {});
  test.fixme("E2E-F06-25-016 ピック完了の数字が0件のときアルファベット番号札のみを返す（要: SEED-F06-25-ALPHA-ONLY）", async () => {});
  test.fixme("E2E-F06-25-019 取得時点のピック完了数字＋登録済みアルファベットを並べて返す（要: SEED-F06-25-MIXED）", async () => {});
  test.fixme("E2E-F06-25-020 補完区間が全て出荷完了のときのみ間の番号を補完する（要: SEED-F06-25-COMPLETE-GAP）", async () => {});
  test.fixme("E2E-F06-25-013 アルファベット番号札を全件（ID昇順）で返す（要: SEED-F06-25-ALPHA-ONLY）", async () => {});
});
