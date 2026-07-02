/**
 * 在庫初期化バッチ（B02-06）UIレイヤ E2E。
 * 納品ケース表 integration_test/e2e/b02_06_batch_product_product_stock_initialize_e2e_cases.md に対応。
 *
 * ── ケース表対応（付帯表1 E2E可否＝実装の正） ───────────────────
 *  本specには「E2E自動化(UI)」5ケース（003,004,021,022,023）を test.fixme で残す。API/統合(7)は spec/batch/b02 側、手動/対象外はケース表で全量管理（規約）。
 *
 * ── 全件 test.fixme の理由（要実機確認） ───────────────────────
 *  付帯表1で5ケースとも「E2E自動化(UI)（要実機確認）」。在庫承認画面 route（admin_stock_approval_new, StockApprovalController.php:54）・
 *  在庫変動履歴の変動区分/在庫変動理由/変動数セル（stock_change_history.twig:22-25,40-46）は特定済みだが、
 *  **到達に必要な productStockId・履歴の行特定（個別td idなし）が要実機確認**（付帯表1）。バッチ起動口もコマンド未特定（付帯表4-1）。
 *  よって `要実機確認` 修飾どおり test.fixme（実機確認後に実装）。
 *
 * ── オラクル独立性 ─────────────────────────────────────────────
 *  期待は仕様（業務ルール「変動区分＝受注（在庫減算）／メモ＝注文番号と価格を含む文言」正本md:90-92／副作用「在庫履歴の追加」正本md:116／IT-30,IT-16）由来。
 *
 * ── 未実行雛形 ─────────────────────────────────────────────────
 *  ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。AdminLoginPage 直利用＋test.skip(!HAS_CREDS) を想定。
 *
 * 資格情報: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（環境変数。コミットしない。SEED-B02-06-ADMIN）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockInitializeChangeHistoryPage } from "../../../pages/admin/b02/b02_06_batch_product_product_stock_initialize.page";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

/** SEED-B02-06-ADMIN でログインする（在庫承認画面の参照権限あり）。 */
async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  await expect(page.locator("#login_id")).toBeHidden();
}

// productStockId は SEED 依存＝要実機確認（実機確認後に SEED-B02-06-ORDERS-IN-RANGE の対象規格IDを設定）。
const PRODUCT_STOCK_ID = process.env.E2E_B0206_PRODUCT_STOCK_ID || "";

test.describe("在庫初期化バッチ > 在庫変動履歴のUI観測", { tag: ["@admin", "@stock", "@b02"] }, () => {
  test.fixme("E2E-B02-06-003 変動区分が受注（在庫減算）で在庫変動履歴に表示される（行特定・productStockId要実機確認）", async ({ page }) => {
    // SEED-B02-06-ORDERS-IN-RANGE。期待は業務ルール「変動区分＝受注（在庫減算）」正本md:91／IT-30。変動区分セル stock_change_history.twig:22-25。
    await login(page);
    const history = new StockInitializeChangeHistoryPage(page);
    await history.goto(PRODUCT_STOCK_ID);
    // 行特定（productStockId・該当履歴行）が要実機確認のため、変動区分=受注（在庫減算）の照合は実機確認後に実装する。
  });

  test.fixme("E2E-B02-06-004 在庫変動理由（メモ）に注文番号と価格を含む文言が表示される（行特定・productStockId要実機確認）", async ({ page }) => {
    // SEED-B02-06-ORDERS-IN-RANGE。期待は業務ルール「メモ＝注文番号と価格を含む文言」正本md:92／IT-30。在庫変動理由セル stock_change_history.twig:40-46。
    await login(page);
    const history = new StockInitializeChangeHistoryPage(page);
    await history.goto(PRODUCT_STOCK_ID);
    // 在庫変動理由（メモ）の文言照合は要実機確認の行特定確定後に実装する。
  });

  test.fixme("E2E-B02-06-021 作成された在庫減算履歴が在庫変動履歴に表示される（行特定・productStockId要実機確認）", async ({ page }) => {
    // SEED-B02-06-ORDERS-IN-RANGE。期待は入出力「副作用＝在庫履歴の追加」正本md:116／IT-30。変動区分・在庫変動理由・変動数セル stock_change_history.twig:22-25,40-46。
    await login(page);
    const history = new StockInitializeChangeHistoryPage(page);
    await history.goto(PRODUCT_STOCK_ID);
    // 追加された在庫減算履歴行の出現照合は要実機確認の行特定確定後に実装する。
  });

  test.fixme("E2E-B02-06-022 重複防止により再実行で在庫変動履歴が二重表示されない（行特定・productStockId要実機確認）", async ({ page }) => {
    // SEED-B02-06-DUP。期待は重複防止（正本md:93）の結果が在庫変動履歴に二重反映されない／IT-30。履歴行 stock_change_history.twig:33-46。
    await login(page);
    const history = new StockInitializeChangeHistoryPage(page);
    await history.goto(PRODUCT_STOCK_ID);
    // 再実行後の二重表示なし（件数不変）の照合は要実機確認の行特定確定後に実装する。
  });

  test.fixme("E2E-B02-06-023 スキップされた商品規格は在庫変動履歴が増えない（行特定・productStockId要実機確認）", async ({ page }) => {
    // SEED-B02-06-NO-BASE-STOCK。期待はスキップ（正本md:78,89）の結果が在庫変動履歴に反映されない（履歴が増えない）／IT-16。履歴行 stock_change_history.twig:33-46。
    await login(page);
    const history = new StockInitializeChangeHistoryPage(page);
    await history.goto(PRODUCT_STOCK_ID);
    // スキップ規格で履歴が増えないことの照合は要実機確認の行特定確定後に実装する。
  });
});
