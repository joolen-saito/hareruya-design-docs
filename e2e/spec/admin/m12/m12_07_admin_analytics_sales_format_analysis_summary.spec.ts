/**
 * 管理画面 フォーマット売上分析 集計一覧表示 E2E。
 * 納品ケース表 integration_test/e2e/m12_07_admin_analytics_sales_format_analysis_summary_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装する。手動/間接・対象外はケース表で全量管理し、specに大量fixmeを残さない。
 * 期待結果は仕様(functions/pf-eccube3/m12-07_..._summary.md / integration-test-viewpoints.md)由来（オラクル独立性）。
 * 実装(Twig/Controller/Form)から取得したのはセレクタ(位置情報)のみ。集計数値・算出整合・CSV内容は手動/別機能。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証: 既存 spec/admin/login.spec.ts 規約に倣い @playwright/test + AdminLoginPage 直利用。
 * 資格情報は config(default.config.ts) の ECCUBE_ADMIN_USER/PASS（環境変数）。未設定時は test.skip でガード。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AnalyticsSalesFormatAnalysisSummaryPage } from "../../../pages/admin/m12/m12_07_admin_analytics_sales_format_analysis_summary.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const LOGIN_RE = /\/login(\?|$)/;
// 設計書「画面遷移」: 検索・バリデーション失敗時は同一画面（フォーマット売上分析）に留まる。
// 別画面（ログイン等）へ遷移しないことを位置情報で確認するための同一画面パターン。
const SAME_SCREEN_RE = /\/analysis\/format-sales(\/search)?(\?|$)/;

/** 管理者でログインしフォーマット売上分析の初期表示画面まで到達する。 */
async function loginAndOpen(page: Page): Promise<AnalyticsSalesFormatAnalysisSummaryPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const target = new AnalyticsSalesFormatAnalysisSummaryPage(page);
  await target.goto();
  return target;
}

// 検索に使う有効な集計月（年月 yyyy-MM）。集計数値の正否は手動/DB依存のため、本specは画面構造のみ判定する。
const VALID_MONTH = "2024-01";
const INVALID_MONTH = "2024-13"; // 形式不正（13月）。Regex /^\d{4}-(0[1-9]|1[0-2])$/ に不一致

test.describe(
  "管理画面 > フォーマット売上分析 集計一覧表示",
  { tag: ["@admin", "@analysis"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M12-07-060 未ログインで集計画面URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/analysis/format-sales`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M12-07-061 未ログインで検索URL(POST)直接アクセス→管理ログイン画面へ誘導（集計表示しない）", async ({
      page,
    }) => {
      // 検索は POST ルート（FormatSalesController.php:64）。GET でなく POST で未認証ガードを検証する。
      const resp = await page.request.post(
        `/${ECCUBE_ADMIN_ROUTE}/analysis/format-sales/search`,
        { form: {} },
      );
      expect(resp.url()).toMatch(LOGIN_RE); // ログイン画面へ誘導されること
      expect(await resp.text()).not.toContain('id="result_list"'); // 集計を表示しないこと
    });

    // ===== ログイン必須（SEED-M12-07-ADMIN / 集計表示用 SEED-M12-07-ORDERS） =====

    test("E2E-M12-07-001 初期表示: 集計月入力欄・検索ボタンを表示し集計結果は表示しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M12-07-ADMIN）");
      const target = await loginAndOpen(page);
      await target.seeSearchFormOnly();
    });

    test("E2E-M12-07-002 初期表示: 集計月入力欄(フォームキー month)が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpen(page);
      await expect(target.month).toBeVisible();
      // フォームキーは設計書由来の `month`（functions/...summary.md:132）。
      // block prefix `admin_format_sales` は Symfony 実装由来のためオラクル化せず、
      // name が [month] で終わること（＝フォームキー month）のみを仕様期待として確認する。
      await expect(target.month).toHaveAttribute("name", /\[month\]$/);
    });

    test("E2E-M12-07-003 初期表示: サブタイトル「フォーマット売上分析」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpen(page);
      await expect(target.subTitle).toContainText("フォーマット売上分析");
    });

    test("E2E-M12-07-010 検索成功: 有効な集計月で折れ線グラフが同一画面に表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpen(page);
      await target.search(VALID_MONTH);
      await expect(page).toHaveURL(SAME_SCREEN_RE); // 同一画面に留まる（別画面へ遷移しない）
      await expect(target.resultList).toBeVisible();
      await expect(target.chart).toBeVisible(); // 折れ線グラフ canvas（描画内容の検査は手動）
    });

    test("E2E-M12-07-011 検索成功: 日別売上表(日・各フォーマット・合計列)が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpen(page);
      await target.search(VALID_MONTH);
      await expect(target.dailyTable).toBeVisible();
      await expect(target.dailyTable.locator("thead")).toContainText("日");
      await expect(target.dailyTable.locator("thead")).toContainText("合計");
    });

    test("E2E-M12-07-012 検索成功: フォーマットごとの合計表・平均表が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpen(page);
      await target.search(VALID_MONTH);
      await expect(target.sumHeading).toBeVisible();
      await expect(target.averageHeading).toBeVisible();
    });

    test("E2E-M12-07-013 検索成功: CSVダウンロードリンクが表示される（DL本体はM12-08）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpen(page);
      await target.search(VALID_MONTH);
      await expect(target.csvDownloadLink).toBeVisible();
    });

    test("E2E-M12-07-020 必須バリデーション: 集計月未入力で検索→集計結果が表示されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpen(page);
      await target.month.fill(""); // 未入力（初期値が入る実装でも空に上書き＝不具合候補#6）
      await target.searchButton.click();
      await expect(page).toHaveURL(SAME_SCREEN_RE); // 同一画面に留まる
      await target.seeNoResult(); // 仕様: 未入力は送信不可＝集計を表示しない
    });

    test("E2E-M12-07-021 形式バリデーション: 不正な年月(2024-13)で検索→集計結果が表示されない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpen(page);
      await target.search(INVALID_MONTH);
      await expect(page).toHaveURL(SAME_SCREEN_RE); // 同一画面に留まる
      await target.seeNoResult(); // 仕様: 年月形式(yyyy-MM)でなければ集計を表示しない
    });
  }
);
