/**
 * 販売期間集計バッチ（B02-01）UIレイヤ E2E。
 * 納品ケース表 integration_test/e2e/b02_01_batch_product_product_sales_period_summary_e2e_cases.md に対応。
 *
 * ── ケース表対応（付帯表1 E2E可否＝実装の正） ───────────────────
 *  本specには「E2E自動化(UI)」2ケース（017,018）を test.fixme で残す。API/統合(14)は spec/batch/b02 側、手動/対象外はケース表で全量管理（規約）。
 *
 * ── 全件 test.fixme の理由（要実機確認） ───────────────────────
 *  付帯表1で両ケースとも「E2E自動化(UI)（要実機確認）」。販売数列ヘッダ・販売数検索フィールドは Twig/Form file:line で特定済みだが、
 *  **行レベルの販売数セル値セレクタが要実機確認**（付帯表1）であり、反映先テーブルも dtb_sales_quantity か正本md記載列か要確認（付帯表4-1）。
 *  バッチ起動口もコンソール実機依存。よって `要実機確認` 修飾どおり test.fixme（実機確認後に実装）。
 *
 * ── オラクル独立性 ─────────────────────────────────────────────
 *  期待は仕様（概要「商品一覧画面に表示する販売数を反映」正本md:5／IT-30）由来で判定し、実装値をオラクル化しない。
 *
 * ── 未実行雛形 ─────────────────────────────────────────────────
 *  ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *  AdminLoginPage を直利用し、資格情報が無ければ走らないよう test.skip(!HAS_CREDS) でガードする想定。
 *
 * 資格情報: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（環境変数。コミットしない。SEED-B02-01-ADMIN）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { SalesPeriodSummaryProductListPage } from "../../../pages/admin/b02/b02_01_batch_product_product_sales_period_summary.page";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

/** SEED-B02-01-ADMIN でログインする（商品一覧の参照権限あり）。 */
async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  await expect(page.locator("#login_id")).toBeHidden();
}

test.describe("販売期間集計バッチ > 販売数のUI反映観測", { tag: ["@admin", "@product", "@b02"] }, () => {
  test.fixme(
    "E2E-B02-01-017 集計結果が商品一覧の販売数列に反映される（販売数セル値セレクタ要実機確認・付帯表1/4-1）",
    async ({ page }) => {
      // 前提: SEED-B02-01-SALES。期待は概要「商品一覧の販売数列に反映」正本md:5／業務ルール正本md:86／IT-30。
      // 販売数列ヘッダ(twig:543)は特定済みだが、行レベルの販売数セル値セレクタが要実機確認のため fixme。
      await login(page);
      const list = new SalesPeriodSummaryProductListPage(page);
      await list.goto();
      await expect(list.salesHeader.first()).toBeVisible();
      // 行レベルの販売数セル値の照合（集計結果反映）は要実機確認のセレクタ確定後に実装する。
    }
  );

  test.fixme(
    "E2E-B02-01-018 商品一覧の販売数検索で集計値により絞り込める（検索結果セレクタ要実機確認・付帯表1）",
    async ({ page }) => {
      // 前提: SEED-B02-01-SALES。期待は概要「商品一覧画面に表示する販売数」正本md:5／IT-30(viewpoints:431)。
      // 販売数検索 From/To(#admin_search_product_order_quantity_from/to, SearchProductType.php:299,307)は特定済みだが、
      // 絞り込み後の結果セルセレクタが要実機確認のため fixme。
      await login(page);
      const list = new SalesPeriodSummaryProductListPage(page);
      await list.goto();
      await expect(list.orderQuantityFrom).toBeVisible();
      await expect(list.orderQuantityTo).toBeVisible();
      // 販売数レンジ検索→結果の販売数照合は要実機確認のセレクタ確定後に実装する。
    }
  );
});
