/**
 * 管理画面 ネット買取管理 買取商品（キャンセル）CSV出力 E2E。
 * 納品ケース表 integration_test/e2e/m07_07_admin_online_purchase_purchase_online_product_cancel_csv_export_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装し、要実機/未実装は test.fixme（理由付き）で残す。
 * 「手動」「対象外」はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様（functions/ec-cube-enterprise/m07-07_...md / 基本設計 / 観点表 / messages.ja.yaml）由来（オラクル独立性）。
 * 実装の現挙動・Form制約・Cookie名を期待値に流用しない。
 *
 * 本リポジトリでは Playwright を実行しない（ec-cube-enterprise の Playwright は実行不可。構造参考の未実行雛形）。
 *
 * 実行ガード:
 *  - 未認証で観測できるケース（030）は資格情報不要で常時実行可。
 *  - ログインを要するケースは env-gate（ECCUBE_ADMIN_USER/PASS）で test.skip。
 *  - 検索結果（買取注文）が1件以上存在することを前提とする（SEED-M07-07-PURCHASE）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OnlinePurchasePurchaseOnlineProductCancelCsvExportPage } from "../../../pages/admin/m07/m07_07_admin_online_purchase_purchase_online_product_cancel_csv_export.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// 仕様（messages.ja.yaml）由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const ERR_NO_SELECTION = "1つ以上の買取注文情報を選択してください。"; // :5247
// 注: ファイル名の具体的接頭辞（例 purchase_product_cancel_list_）は実装値（Service.php:91）であり
//     正典設計書に命名規約が無いためオラクル化しない。E2Eは「ダウンロードが発火し .csv が取得できる」
//     ことのみ検証し、ファイル名/命名規約の正否は基本設計（M07-05/06）を正典に手動検証する。
const CSV_EXT_RE = /\.csv$/i; // IT-24/IT-27 由来: 出力ファイルがCSVであること（観測可能）

const LOGIN_RE = /\/login(\?|$)/;
// 買取一覧（検索結果）に留まること（IT-03 画面遷移＝エラー時の一覧滞留・仕様由来）。
// 具体的な page_no ルートは実装詳細のため固定せず、買取一覧配下に滞留することを検証する。
const PURCHASE_LIST_RE = /\/purchase\/(list|page)(\/|\?|$)/;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
}

test.describe(
  "管理画面_ネット買取管理 > 買取商品（キャンセル）CSV出力",
  { tag: ["@admin", "@purchase", "@csv"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M07-07-030 未ログインで買取一覧/エクスポートURLへアクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/purchase/list`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
      // POST専用エクスポートURLも未認証ガード対象であること（GETでもfirewallがログインへ誘導）。
      await page.goto(
        `/${ECCUBE_ADMIN_ROUTE}/purchase/csv_export_product_list?type=notSale`
      );
      await expect(page).toHaveURL(LOGIN_RE);
    });

    test("E2E-M07-07-031 未ログインでエクスポートURL（POST専用）へPOST→管理ログインへ誘導され処理が実行されない", async ({
      page,
    }) => {
      // POST専用ルートへ未認証でPOSTした場合も、firewallがメソッド判定前にログインへ誘導すること
      // （権限・認可＝未認証ガードはGETだけでなく実処理POSTにも及ぶ。仕様: IT-15 未認証）。
      const res = await page.request.post(
        `/${ECCUBE_ADMIN_ROUTE}/purchase/csv_export_product_list?type=notSale`,
        { form: { "buyOrderIds[]": "1" } }
      );
      // CSVは返らず（ダウンロード不実行）、最終的に管理ログイン画面へ誘導されること。
      expect(res.url()).toMatch(LOGIN_RE);
    });

    // ===== ログイン必須（SEED-M07-07-PURCHASE：買取注文1件以上） =====

    test("E2E-M07-07-004 買取一覧画面が表示され検索フォームが出る", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new OnlinePurchasePurchaseOnlineProductCancelCsvExportPage(page);
      await target.gotoList();
      await expect(target.searchForm).toBeVisible();
    });

    test("E2E-M07-07-002 ダウンロードメニューに「買取商品（キャンセル）CSV」ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new OnlinePurchasePurchaseOnlineProductCancelCsvExportPage(page);
      await target.searchAll();
      await target.seeCancelCsvButton(); // 文言は messages.ja.yaml:5258 由来
    });

    test("E2E-M07-07-003 検索結果一覧に行チェックボックスと全選択チェックボックスが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new OnlinePurchasePurchaseOnlineProductCancelCsvExportPage(page);
      await target.searchAll();
      await target.seeSelectionCheckboxes();
    });

    test("E2E-M07-07-001 1件選択しキャンセルCSV出力→ダウンロードが発火し.csvが取得できる（ファイル名規約は手動）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new OnlinePurchasePurchaseOnlineProductCancelCsvExportPage(page);
      await target.searchAll();
      await target.selectFirstRow();
      await target.openDownloadMenu();
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        target.clickCancelCsv(),
      ]);
      // 期待は仕様由来: ダウンロードが発火し .csv が取得できること（IT-24/IT-27）。
      // ファイル名の具体的接頭辞・命名規約は実装値のためオラクル化せず手動検証（付帯表4 #3）。
      expect(download.suggestedFilename()).toMatch(CSV_EXT_RE);
    });

    test("E2E-M07-07-011 全選択でキャンセルCSV出力→ダウンロードが発火（必須選択の充足側）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new OnlinePurchasePurchaseOnlineProductCancelCsvExportPage(page);
      await target.searchAll();
      await target.selectAll();
      await target.openDownloadMenu();
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        target.clickCancelCsv(),
      ]);
      expect(download.suggestedFilename()).toMatch(CSV_EXT_RE);
    });

    test("E2E-M07-07-010 未選択でキャンセルCSV押下→未選択エラーで一覧に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new OnlinePurchasePurchaseOnlineProductCancelCsvExportPage(page);
      await target.searchAll();
      await target.openDownloadMenu();
      await target.clickCancelCsv(); // 何も選択せず送信
      // 期待は仕様由来（messages.ja.yaml:5247 未選択メッセージ／IT-03 エラー時の一覧滞留）。
      await expect(target.error).toContainText(ERR_NO_SELECTION);
      // ダウンロードは発火せず買取一覧（検索結果）に留まること（具体的 page_no ルートは固定しない）。
      await expect(page).toHaveURL(PURCHASE_LIST_RE);
    });

    test("E2E-M07-07-020 エクスポートURL（POST専用）へGET直接アクセス→405", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      // POST専用ルート（Controller.php:594 methods:['POST']）へGET→405。仕様: URL直接アクセス（IT-13）。
      const res = await page.request.get(
        `/${ECCUBE_ADMIN_ROUTE}/purchase/csv_export_product_list?type=notSale`
      );
      expect(res.status()).toBe(405);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M07-07-012 実在ID＋存在しない買取注文IDを混在して送信→存在しないID含むエラー（要: DOMへ不正value注入の実機確認）",
      async () => {
        // 期待は仕様（messages.ja.yaml:5248、Service.php:62-64）由来。
        // 実在ID＋実在しないbuyOrderIds[]値を混在してフォームへ注入し送信する手順を実機確認後に実装。
        // 失敗分岐は「1件でも非実在IDが含まれる」場合に成立する（メッセージ「含まれています」）。
      }
    );

    test.fixme(
      "E2E-M07-07-013 不正なCSV種別（type=sale/notSale以外）をPOST→エラー表示で一覧へ滞留しダウンロード不実行（要: POST直叩き手順の実機確認）",
      async () => {
        // 判定順序の失敗分岐（Controller.php:610-622 default枝）。UIのformactionはtype=notSale固定のため
        // UIからは到達不可だが、POST直叩きでテスト可能（不具合候補#1）。
        // 期待は仕様（例外処理＝入力不備で処理を確定せず一覧へ戻す）由来とし、ダウンロードが発火しない／
        // 買取一覧へ滞留することを判定する。実装のエラー文言（ハードコード）はオラクル化しない。
      }
    );
  }
);
