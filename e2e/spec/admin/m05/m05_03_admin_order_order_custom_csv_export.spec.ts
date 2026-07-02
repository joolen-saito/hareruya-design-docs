/**
 * 受注管理「カスタム受注CSVダウンロード」E2E。
 * 納品ケース表 integration_test/e2e/m05_03_admin_order_order_custom_csv_export_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装する。手動（CSV内容・列順rank・検索条件一致・明細単位行数・
 * BOM/エンコード/日時書式・セッション不変更）／対象外（ログ抑止・DB内部値・DB更新なし・出力項目設定の
 * 保存/削除/バリデーション＝別機能 m10-13 へ委譲）はケース表で全量管理し、specに大量のfixmeを残さない。
 * 要シード/要実機の自動化予定のみ test.fixme で残す。
 *
 * 期待結果は仕様(functions/pf-eccube3/m05-03_admin_order_order_custom_csv_export.md /
 * CustomExportCsvController.php / messages.ja.yaml)由来（オラクル独立性）。実装からはセレクタ・ルート
 * （位置情報）のみを取り、合否は仕様で判定する。ec-cube-enterprise の Playwright は本リポジトリでは
 * 実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OrderOrderCustomCsvExportPage } from "../../../pages/admin/m05/m05_03_admin_order_order_custom_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// シード投入済み環境では UI/リンク欠落を skip でなく fail にする（E2E_SEED_READY=1）。
// 未設定時のみ前提未充足を skip して観測対象不在を許容する。
const SEED_READY = !!process.env.E2E_SEED_READY;

const HOME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/?(\\?|$)`);
// 権限ガードのオラクル: 管理ルート配下のログイン画面を固定（別ログインで誤通過しない）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const ORDER_LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/order`);
const SETTING_CUSTOM_CSV_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/custom_csv`);
// 仕様: ファイル名 order_{YmdHis}.csv（CustomExportCsvController.php:102）。
const FILENAME_RE = /^order_\d{14}\.csv$/;

/** 管理ログインしてホームへ到達する。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).toHaveURL(HOME_RE);
}

test.describe(
  "受注管理 > カスタム受注CSVダウンロード",
  { tag: ["@admin", "@order", "@csv"] },
  () => {
    // ===== 未認証（資格情報不要・非破壊） =====

    test("E2E-M05-03-030 未ログインでダウンロードURL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      // 権限・認可: 未認証は管理画面共通制約でログインへ。拡張IDは任意（到達前にガード）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/custom_csv/export/1`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M05-03-031 未ログインで受注一覧URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 404（認証要・資格情報のみで実行可） =====

    test("E2E-M05-03-020 存在しない拡張IDのダウンロードURL直接GET→404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new OrderOrderCustomCsvExportPage(page);
      // 仕様: 拡張IDがDBに無い→404（CustomExportCsvController.php:75-77）。
      // 大きな未使用IDを用い、不存在を 404 で確認する（IDを創作して有効扱いしない）。
      const res = await page.context().request.get(p.downloadUrl(999999999));
      expect(res.status()).toBe(404);
    });

    // ===== UI部品（認証要・要受注シード・非破壊） =====

    test("E2E-M05-03-001 受注一覧にカスタム受注CSVダウンロードドロップダウンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new OrderOrderCustomCsvExportPage(page);
      await p.gotoOrderList();
      // フロント挙動: pagination.totalItemCount>0 のときのみCSV操作UIが描画される。
      test.skip(
        !SEED_READY && (await p.customCsvDropdownButton.count()) === 0,
        "SEED-M05-03-ORDER未投入時のみskip（E2E_SEED_READY=1でUI欠落をfailにする）"
      );
      await p.seeCustomCsvDropdown();
    });

    test("E2E-M05-03-002 ドロップダウン展開で受注CSV拡張ごとのダウンロードリンクが列挙される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new OrderOrderCustomCsvExportPage(page);
      await p.gotoOrderList();
      test.skip(
        !SEED_READY && (await p.customCsvDropdownButton.count()) === 0,
        "SEED-M05-03-ORDER未投入時のみskip（E2E_SEED_READY=1でUI欠落をfailにする）"
      );
      await p.openDropdown();
      const hrefs = await p.extensionLinkHrefs();
      test.skip(!SEED_READY && hrefs.length === 0, "SEED-M05-03-ORDER-CSV-EXT未投入時のみskip（E2E_SEED_READY=1で欠落をfailにする）");
      // 仕様: OrderCsvExtensionsごとに admin_custom_export へのGETリンクが列挙される。
      // SEED_READY時は0件列挙を欠落とみなしfailさせる（空配列での空通過を防ぐ）。
      expect(hrefs.length, "受注CSV拡張のダウンロードリンクが1件以上列挙される").toBeGreaterThan(0);
      for (const h of hrefs) expect(h).toContain("custom_csv/export");
    });

    test("E2E-M05-03-003 ドロップダウン末尾に「出力項目設定」リンクが拡張0件でも表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new OrderOrderCustomCsvExportPage(page);
      await p.gotoOrderList();
      test.skip(
        !SEED_READY && (await p.customCsvDropdownButton.count()) === 0,
        "SEED-M05-03-ORDER未投入時のみskip（E2E_SEED_READY=1でUI欠落をfailにする）"
      );
      await p.openDropdown();
      // 仕様: 拡張0件でも「出力項目設定」リンクは常に最後に出る。
      await p.seeSettingLink();
    });

    test("E2E-M05-03-040 「出力項目設定」リンクでカスタムCSV設定画面(GET)へ遷移", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new OrderOrderCustomCsvExportPage(page);
      await p.gotoOrderList();
      test.skip(
        !SEED_READY && (await p.customCsvDropdownButton.count()) === 0,
        "SEED-M05-03-ORDER未投入時のみskip（E2E_SEED_READY=1でUI欠落をfailにする）"
      );
      await p.openDropdown();
      // オラクル独立性: 選択キーは実装trans文言でなく設計由来ルート(href)で識別する。
      const settingHref = await p.settingLink.getAttribute("href");
      // 仕様: 受注種別 csvTypeId=CSV_TYPE_ORDER=3（設計書「利用者視点の入口」/外部画面）。
      // 配送/商品など別種別への誤リンクを検出するため種別IDまで検証する。
      expect(settingHref, "設定リンクは受注種別(csvTypeId=3)のカスタムCSV設定URLを持つ").toMatch(
        /setting\/shop\/custom_csv\/3(\/|\?|$)/
      );
      await Promise.all([page.waitForURL(SETTING_CUSTOM_CSV_RE), p.settingLink.click()]);
      await expect(page).toHaveURL(SETTING_CUSTOM_CSV_RE);
    });

    // ===== ダウンロード発火・HTTP応答（認証要・要拡張シード） =====

    test("E2E-M05-03-010 拡張名リンク押下でCSVダウンロードが発火しファイル名が order_{YmdHis}.csv", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new OrderOrderCustomCsvExportPage(page);
      await p.gotoOrderList();
      test.skip(
        !SEED_READY && (await p.customCsvDropdownButton.count()) === 0,
        "SEED-M05-03-ORDER未投入時のみskip（E2E_SEED_READY=1でUI欠落をfailにする）"
      );
      await p.openDropdown();
      const hrefs = await p.extensionLinkHrefs();
      test.skip(!SEED_READY && hrefs.length === 0, "SEED-M05-03-ORDER-CSV-EXT未投入時のみskip（E2E_SEED_READY=1で欠落をfailにする）");
      const download = await p.clickExtensionAndWaitDownload(0);
      // 仕様: filename="order_{YmdHis}.csv"。CSVの中身は手動確認（ケース表 付帯表）。
      expect(download.suggestedFilename()).toMatch(FILENAME_RE);
    });

    test("E2E-M05-03-011 有効拡張のダウンロードURL直接GETが200・application/octet-stream・attachmentで配信", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new OrderOrderCustomCsvExportPage(page);
      await p.gotoOrderList();
      test.skip(
        !SEED_READY && (await p.customCsvDropdownButton.count()) === 0,
        "SEED-M05-03-ORDER未投入時のみskip（E2E_SEED_READY=1でUI欠落をfailにする）"
      );
      await p.openDropdown();
      const hrefs = await p.extensionLinkHrefs();
      test.skip(!SEED_READY && hrefs.length === 0, "SEED-M05-03-ORDER-CSV-EXT未投入時のみskip（E2E_SEED_READY=1で欠落をfailにする）");
      // 認証済みコンテキストのリクエストでヘッダを観測（ブラウザのダウンロード保存を介さない）。
      const res = await page.context().request.get(hrefs[0]);
      expect(res.status()).toBe(200);
      // 仕様: Content-Type application/octet-stream（CustomExportCsvController.php:103）,
      //       Content-Disposition attachment; filename=order_（同:104）。
      expect(res.headers()["content-type"] || "").toContain("application/octet-stream");
      const cd = res.headers()["content-disposition"] || "";
      expect(cd).toContain("attachment");
      expect(cd).toContain("order_");
    });

    test("E2E-M05-03-042 拡張ダウンロードリンクにCSRFトークンが無くトークン無しGETで配信される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new OrderOrderCustomCsvExportPage(page);
      await p.gotoOrderList();
      test.skip(
        !SEED_READY && (await p.customCsvDropdownButton.count()) === 0,
        "SEED-M05-03-ORDER未投入時のみskip（E2E_SEED_READY=1でUI欠落をfailにする）"
      );
      await p.openDropdown();
      const hrefs = await p.extensionLinkHrefs();
      test.skip(!SEED_READY && hrefs.length === 0, "SEED-M05-03-ORDER-CSV-EXT未投入時のみskip（E2E_SEED_READY=1で欠落をfailにする）");
      // 仕様: リンクは単純なGETでCSRFトークンを送らない（設計書「利用者視点の入口」）。
      // href にCSRFトークン（_token 等）が含まれないこと（非存在を検証＝トークン値を期待化しない）。
      for (const h of hrefs) {
        expect(h, "ダウンロードリンクにCSRFトークンが付かない").not.toMatch(/[?&]_token=/);
      }
      // トークン無しのGETで配信される（200）。
      const res = await page.context().request.get(hrefs[0]);
      expect(res.status()).toBe(200);
    });

    test("E2E-M05-03-012 ダウンロード前に確認ダイアログを表示しない（ドロップダウン起動のみ）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new OrderOrderCustomCsvExportPage(page);
      await p.gotoOrderList();
      test.skip(
        !SEED_READY && (await p.customCsvDropdownButton.count()) === 0,
        "SEED-M05-03-ORDER未投入時のみskip（E2E_SEED_READY=1でUI欠落をfailにする）"
      );
      // フロント挙動: ダウンロード前の確認モーダル/ダイアログは無い（設計「モーダル・ポップアップ無し」）。
      let dialogShown = false;
      page.on("dialog", async (d) => {
        dialogShown = true;
        await d.dismiss();
      });
      await p.openDropdown();
      const hrefs = await p.extensionLinkHrefs();
      test.skip(!SEED_READY && hrefs.length === 0, "SEED-M05-03-ORDER-CSV-EXT未投入時のみskip（E2E_SEED_READY=1で欠落をfailにする）");
      const download = await p.clickExtensionAndWaitDownload(0);
      expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      expect(dialogShown, "ダウンロード前の確認ダイアログは表示されない").toBe(false);
    });

    test("E2E-M05-03-021 拡張名リンク押下は画面遷移を起こさず同一タブでCSV応答となる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new OrderOrderCustomCsvExportPage(page);
      await p.gotoOrderList();
      test.skip(
        !SEED_READY && (await p.customCsvDropdownButton.count()) === 0,
        "SEED-M05-03-ORDER未投入時のみskip（E2E_SEED_READY=1でUI欠落をfailにする）"
      );
      await p.openDropdown();
      const hrefs = await p.extensionLinkHrefs();
      test.skip(!SEED_READY && hrefs.length === 0, "SEED-M05-03-ORDER-CSV-EXT未投入時のみskip（E2E_SEED_READY=1で欠落をfailにする）");
      const download = await p.clickExtensionAndWaitDownload(0);
      // 仕様: 同一タブでGETによりCSV応答・画面遷移は起きない（受注一覧URLに留まる）。
      await expect(page).toHaveURL(ORDER_LIST_RE);
      expect(download.suggestedFilename()).toMatch(FILENAME_RE);
    });

    // ===== 対象データ（0件時はUI非描画） =====

    // 要確認: 0件検索トリガを GET ?multi=... で与えるのは根拠が弱い（OrderController index は
    // GET 初期表示でセッション検索条件を空に初期化し全件表示しうるため、0件は検索フォームの POST 送信
    // またはセッション投入が要る）。0件化手順を実機確定後に自動化する（付帯表4 要確認）。
    test.fixme(
      "E2E-M05-03-004 検索結果0件のときはCSV操作UI（ドロップダウン）が描画されない（要確認: 0件検索トリガ手順）",
      async ({ page }) => {
        test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
        await loginToHome(page);
        const p = new OrderOrderCustomCsvExportPage(page);
        // 仕様: pagination.totalItemCount=0 のとき一括フォーム・CSV系UIは描画されない（設計書「表示要素」）。
        await expect(p.customCsvDropdownButton).toHaveCount(0);
      }
    );

    // ===== 自動化予定だが要シード/要実機（未実装。手動/対象外はケース表で管理） =====

    test.fixme(
      "E2E-M05-03-050 論理削除済み拡張IDの直接GETでも404にならずCSV配信（要: 論理削除済み受注拡張シード SEED-M05-03-DELETED-EXT）",
      async () => {
        // 期待は設計書「エッジケース」(一覧に出ていない論理削除済み拡張をURL直叩き→find が返せば出力／
        // 設計書本文 行261)・「処理フロー#3」(論理削除や種別の再検証は行わない／行65)由来＝仕様オラクル。
        // deleted_at付きの受注拡張IDを用意し、直接GETで200・CSV配信になることを検証する（付帯表4#6 要確認）。
      }
    );

    test.fixme(
      "E2E-M05-03-051 列0件拡張IDの出力はヘッダ生成でロジック例外でストリーム破損（要: 列0件受注拡張シード SEED-M05-03-NOCOL-EXT・要実機）",
      async () => {
        // 期待は設計書「エラー処理」(拡張に列が1件も紐付いていない→ヘッダ出力でロジック例外／設計書本文 行202)・
        // 「処理フロー#5」(行定義が空配列ならロジック例外を送出しストリームは正常終了しない／行69)由来＝仕様オラクル。
        // HTTPは200で開始するが本文が完結しない（StreamedResponse途中破損）ため確定観測手順を実機確認後に実装（付帯表4#3）。
      }
    );
  }
);
