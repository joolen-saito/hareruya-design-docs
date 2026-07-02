/**
 * 管理画面 トップ売上状況（ダッシュボードの売上状況ブロック）E2E。
 * 納品ケース表 integration_test/e2e/m02_02_admin_home_home_sales_status_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装する。手動/間接（040,041,042）・対象外はケース表で全量管理し、
 * specには大量のfixmeを残さない（規約「手動/対象外はspecに残さない」）。
 * 期待結果は仕様(m02-02_admin_home_home_sales_status.md / messages.ja.yaml)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の
 * spec/admin/login.spec.ts・two_factor_auth.spec.ts も @playwright/test を直接使う。本specもこれに倣い
 * @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針:
 *  - ログインが要るケースは ECCUBE_ADMIN_USER/PASS（config/default.config.ts）が無いと走らないよう test.skip でガード。
 *  - シード前提: SEED-M02-ADMIN は「2FA OFF」の管理者（ログイン直後にホームへ到達できること）。
 *  - 集計数値（金額・件数・除外反映・0件）の厳密検証はDB依存のため手動（ケース表 040/041/042）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AdminHomeHomeSalesStatusPage } from "../../../pages/admin/m02/m02_02_admin_home_home_sales_status.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const LOGIN_RE = /\/login(\?|$)/;

/** 管理者ログインしてホーム（売上状況ブロック）へ到達する（SEED-M02-ADMIN は2FA OFF前提）。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).not.toHaveURL(LOGIN_RE); // ログイン成功でログイン画面から離脱
}

test.describe(
  "管理画面 > トップ売上状況",
  { tag: ["@admin", "@home", "@sales-status"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M02-02-030 未ログインでホーム→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/`);
      await expect(page).toHaveURL(LOGIN_RE); // 管理ログインURLへ誘導
      await expect(page.locator("#login_id")).toBeVisible(); // 管理ログイン画面
    });

    test("E2E-M02-02-031 未ログインでグラフ用データURL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/sale_chart`);
      await expect(page).toHaveURL(LOGIN_RE); // グラフ用データを得られず管理ログインURLへ誘導
      await expect(page.locator("#login_id")).toBeVisible(); // グラフ用データを得られず管理ログインへ
    });

    // ===== ログイン必須（SEED-M02-ADMIN） =====

    test("E2E-M02-02-001 ホームに売上状況カード見出し「売上状況」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M02-ADMIN）");
      await loginToHome(page);
      const home = new AdminHomeHomeSalesStatusPage(page);
      await home.goto();
      await expect(home.cardTitle).toContainText("売上状況");
    });

    test("E2E-M02-02-002 売上サマリに今月・今日・昨日のラベルが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M02-ADMIN）");
      await loginToHome(page);
      const home = new AdminHomeHomeSalesStatusPage(page);
      await home.goto();
      await expect(home.thisMonthLabel).toBeVisible();
      await expect(home.todayLabel).toBeVisible();
      await expect(home.yesterdayLabel).toBeVisible();
    });

    test("E2E-M02-02-003 週間・月間・年間タブが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M02-ADMIN）");
      await loginToHome(page);
      const home = new AdminHomeHomeSalesStatusPage(page);
      await home.goto();
      await expect(home.weeklyTab).toBeVisible();
      await expect(home.monthlyTab).toBeVisible();
      await expect(home.yearTab).toBeVisible();
    });

    test("E2E-M02-02-004 グラフ描画用canvasが3つ配置される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M02-ADMIN）");
      await loginToHome(page);
      const home = new AdminHomeHomeSalesStatusPage(page);
      await home.goto();
      await expect(home.chart0).toBeAttached();
      await expect(home.chart1).toBeAttached();
      await expect(home.chart2).toBeAttached();
    });

    test("E2E-M02-02-005 ページ表示後にグラフ用データが非同期取得されJSON配列(3区間)が返る", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M02-ADMIN）");
      await loginToHome(page);
      const home = new AdminHomeHomeSalesStatusPage(page);
      const resp = await home.gotoAndWaitSaleChart();
      // 仕様(API/バッチ結果・成功時): XHR＋CSRF妥当時のみ JSON を返す。週間・月間・年間の3区間に対応する配列。
      expect(resp.ok()).toBeTruthy();
      const body = await resp.json();
      expect(Array.isArray(body)).toBeTruthy();
      expect(body.length).toBe(3);
    });

    test("E2E-M02-02-006 読み込み中表示が取得完了後に非表示になる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M02-ADMIN）");
      await loginToHome(page);
      const home = new AdminHomeHomeSalesStatusPage(page);
      await home.gotoAndWaitSaleChart();
      // 仕様(画面への描画): 非同期取得完了で読み込みインジケータが非表示になる。
      await expect(home.loading).toBeHidden();
    });

    test("E2E-M02-02-007 月間タブ押下で月間ペインが選択状態になり追加問い合わせがない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M02-ADMIN）");
      await loginToHome(page);
      const home = new AdminHomeHomeSalesStatusPage(page);
      // 初期表示のグラフ用データ取得XHRを完了させてから、タブ切替で追加取得が起きないことを監視する。
      await home.gotoAndWaitSaleChart();
      let extraSaleChartRequests = 0;
      const onRequest = (r: { url: () => string }) => {
        if (r.url().includes("/sale_chart")) extraSaleChartRequests++;
      };
      page.on("request", onRequest);
      await home.clickMonthlyTab();
      // 仕様(フロント挙動): 同一ページ内でタブ表示が切り替わる（追加のサーバ問い合わせは行わない）。
      await expect(home.monthlyPane).toHaveClass(/active/);
      page.off("request", onRequest);
      expect(extraSaleChartRequests).toBe(0); // タブ切替で /sale_chart の追加要求が発生しないこと
    });

    test("E2E-M02-02-008 売上状況カード見出しは静的文言でリンクではない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M02-ADMIN）");
      await loginToHome(page);
      const home = new AdminHomeHomeSalesStatusPage(page);
      await home.goto();
      await expect(home.cardTitle).toBeVisible();
      // 仕様(利用者視点の入口): 見出しはリンクではなく静的文言。aタグに内包されない。
      await expect(page.locator("#chart-statistics a .card-title")).toHaveCount(0);
    });

    test("E2E-M02-02-009 売上状況カードはフォーム入力・モーダルを持たない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M02-ADMIN）");
      await loginToHome(page);
      const home = new AdminHomeHomeSalesStatusPage(page);
      await home.goto();
      // 仕様(フロント挙動): 本ブロックはフォーム・入力欄・モーダルを持たない。
      await expect(home.salesCard.locator("input, textarea, select")).toHaveCount(0);
      await expect(home.salesCard.locator(".modal")).toHaveCount(0);
    });

    test("E2E-M02-02-010 サマリが金額／件数（「件」付き）の形式で表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M02-ADMIN）");
      await loginToHome(page);
      const home = new AdminHomeHomeSalesStatusPage(page);
      await home.goto();
      // 仕様(業務ルール・計算): 金額は通貨表示、件数は整数で「… / … 件」形式。具体値はDB依存のため形式のみ判定。
      await expect(home.summaryValues.first()).toContainText("件");
    });

    test("E2E-M02-02-020 非XHRでグラフ用データURLへ直接要求するとJSON配列を返さない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M02-ADMIN）");
      await loginToHome(page);
      const home = new AdminHomeHomeSalesStatusPage(page);
      const resp = await home.requestSaleChartWithoutXhr();
      // 仕様(エラー処理/バリデーション): XMLHttpRequest かつ CSRF妥当でない要求にはグラフ用データを返さない。
      expect(resp.ok()).toBeFalsy(); // 成功(2xx)応答でないこと＝グラフ用データ取得不可
    });

    test("E2E-M02-02-021 XHRヘッダありでもCSRF欠落だとグラフ用データを返さない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M02-ADMIN）");
      await loginToHome(page);
      const home = new AdminHomeHomeSalesStatusPage(page);
      const resp = await home.requestSaleChartXhrWithoutCsrf();
      // 仕様(エラー処理/バリデーション): XHR側を満たしても CSRF妥当でなければグラフ用データを返さない（CSRF条件の負例）。
      expect(resp.ok()).toBeFalsy(); // 成功(2xx)応答でないこと＝グラフ用データ取得不可
    });
  }
);
