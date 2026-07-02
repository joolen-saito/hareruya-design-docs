/**
 * 管理画面 ホーム 売上状況グラフ E2E。納品ケース表
 * integration_test/e2e/m02_03_admin_home_home_sales_chart_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装する。手動/対象外はケース表で全量管理し、specには残さない。
 * 期待結果は仕様(m02-03_admin_home_home_sales_chart.md / 設計書フロント挙動・処理フロー・API/バッチ結果)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 既存リポ規約（spec/admin/login.spec.ts）に倣い @playwright/test + AdminLoginPage を直利用する。
 * ホーム（売上状況グラフ）は認証必須のため、ログイン系テストは資格情報（ECCUBE_ADMIN_USER/PASS）が無いと
 * 走らないよう test.skip(!HAS_CREDS) でガードする（未認証ガード系は資格情報不要で常時実行可）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { HomeHomeSalesChartPage } from "../../../pages/admin/m02/m02_03_admin_home_home_sales_chart.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const LOGIN_RE = /\/login(\?|$)/;

/** 管理者でログインしホーム画面へ到達する。 */
async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 > トップ売上状況グラフ",
  { tag: ["@admin", "@home", "@chart"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M02-03-020 未認証でホームURL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible(); // ホーム（グラフ）に到達できない
    });

    test("E2E-M02-03-021 未認証でsale_chart直アクセス→ログイン誘導（JSONを返さない）", async ({
      page,
    }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/sale_chart`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 認証必須（SEED-M02-03-ADMIN） =====

    test("E2E-M02-03-001 ホーム表示で売上状況カード・3タブ・canvas・読み込み中表示が描画される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M02-03-ADMIN）");
      await login(page);
      const home = new HomeHomeSalesChartPage(page);
      await home.goto();
      await home.seeChartArea();
    });

    test("E2E-M02-03-002 週間・月間・年間タブのラベルが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const home = new HomeHomeSalesChartPage(page);
      await home.goto();
      await home.seeTabLabels();
    });

    test("E2E-M02-03-003 非同期取得完了で読み込み中表示が消え週間canvasが表示される", async ({
      page,
    }) => {
      // 受注データ(SEED-M02-03-ORDERS)が無くてもグラフ枠は描画され #loading は非表示になる仕様。
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const home = new HomeHomeSalesChartPage(page);
      // #loading は失敗時も .always() で隠れる（index.twig:97-98）ため、まず
      // sale_chart の成功応答(HTTP200=設計書「成功時出力」)を確認して偽陽性を排除する。
      const resp = await home.gotoAwaitingSaleChart();
      expect(resp.status()).toBe(200);
      await home.waitForLoadingHidden(); // 完了で #loading 非表示（処理フロー「描画」#4）
      await expect(home.chart0).toBeVisible(); // 初期は週間タブが活性
    });

    test("E2E-M02-03-004 タブ切替は同一ページ内表示切替で追加のサーバ問い合わせを伴わない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      let saleChartRequests = 0;
      page.on("request", (req) => {
        if (req.url().includes("/sale_chart")) saleChartRequests++;
      });
      await login(page);
      const home = new HomeHomeSalesChartPage(page);
      const resp = await home.gotoAwaitingSaleChart();
      expect(resp.status()).toBe(200); // 初回取得が成功した前提を担保
      await home.waitForLoadingHidden(); // 初回取得（1回）完了まで
      const before = saleChartRequests;
      await home.clickMonthlyTab();
      await expect(home.monthlyPane).toBeVisible();
      await home.clickYearTab();
      await expect(home.yearPane).toBeVisible();
      expect(saleChartRequests).toBe(before); // タブ切替で追加リクエストなし
    });

    test("E2E-M02-03-005 売上状況グラフはモーダル・確認ダイアログを表示しない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const home = new HomeHomeSalesChartPage(page);
      await home.goto();
      await home.waitForLoadingHidden();
      // 売上状況カード内にモーダル起動要素（data-bs-toggle="modal"）が無いこと＝モーダル不使用。
      await expect(
        home.chartStatistics.locator('[data-bs-toggle="modal"]')
      ).toHaveCount(0);
    });

    test("E2E-M02-03-006 売上状況グラフ領域はフォーム・テキスト入力を持たない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const home = new HomeHomeSalesChartPage(page);
      await home.goto();
      await expect(home.chartStatistics.locator("input, textarea, form")).toHaveCount(0);
    });

    test("E2E-M02-03-007 初期表示で週間タブが選択状態となり週間ペインが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const home = new HomeHomeSalesChartPage(page);
      await home.goto();
      // 設計書「初期状態は週間タブが選択済み」: 週間ペイン表示・月間/年間ペイン非表示。
      await home.seeInitialWeeklySelected();
    });

    test("E2E-M02-03-010 XHRでない通常GETでsale_chart→HTTP400 status=NG", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      // XHRヘッダ・CSRFトークンを付与しない通常GET（認証済みセッション）。
      const resp = await page.request.get(`/${ECCUBE_ADMIN_ROUTE}/sale_chart`);
      expect(resp.status()).toBe(400);
      const body = await resp.json();
      expect(body.status).toBe("NG"); // {"status":"NG"}
    });

    test("E2E-M02-03-011 XHR＋CSRFトークン付きGETでsale_chartが3要素配列を返す", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const home = new HomeHomeSalesChartPage(page);
      await home.goto();
      const token = await home.readCsrfToken(); // 画面metaのCSRFトークン
      expect(token).not.toBe("");
      const resp = await page.request.get(`/${ECCUBE_ADMIN_ROUTE}/sale_chart`, {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "ECCUBE-CSRF-TOKEN": token,
        },
      });
      expect(resp.status()).toBe(200);
      const body = await resp.json();
      expect(Array.isArray(body)).toBeTruthy();
      expect(body.length).toBe(3); // 週間・月間・年間のバケット集合（要素内部のフィールド名は仕様未定義のため固定しない）
    });

    test("E2E-M02-03-013 XHRヘッダ付きでもCSRFトークンが無いとsale_chart→HTTP400 status=NG", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M02-03-ADMIN）");
      await login(page);
      // XHRヘッダは付与するがCSRFトークンは付与しない＝判定 (isXmlHttpRequest && isTokenValid) の
      // CSRF不成立側の片側失敗分岐。設計書「いずれかを満たさない場合はHTTP400 status=NG」。
      const resp = await page.request.get(`/${ECCUBE_ADMIN_ROUTE}/sale_chart`, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      expect(resp.status()).toBe(400);
      const body = await resp.json();
      expect(body.status).toBe("NG"); // {"status":"NG"}
    });

    test("E2E-M02-03-012 sale_chart取得失敗時もフロントは専用メッセージを出さず同一画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      // 設計書「取得失敗時もフロントは利用者向けメッセージを出さずグラフ未描画」を検証する。
      // 確認ダイアログ/アラートを出さないことを dialog イベント未発火で観測（特定トースト要素名を創作しない）。
      let dialogShown = false;
      page.on("dialog", (d) => {
        dialogShown = true;
        void d.dismiss();
      });
      await login(page);
      const home = new HomeHomeSalesChartPage(page);
      await home.stubSaleChartFailure(); // sale_chart を HTTP400 status=NG に固定
      await home.goto();
      await home.waitForLoadingHidden(); // 失敗時も .always() で #loading 非表示
      await expect(home.chartStatistics).toBeVisible(); // 同一画面（ホーム）に留まる
      expect(dialogShown).toBe(false); // 確認ダイアログ/アラートを表示しない
      // 棒の有無（canvas内部の未描画）はcanvas観測困難のため対象外。
    });
  }
);
