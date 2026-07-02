/**
 * 商品管理「セール用価格変更CSV出力」E2E。
 * 納品ケース表 integration_test/e2e/m03_05_admin_product_product_sale_price_csv_export_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装する。手動（CSV内容・列値・行複製単位・タグ連結・セールフラグ0|1・
 * 一部ID無視時の行集合・getProductClasses全走査差・規格0件のヘッダのみ内容）／対象外（DB抽出の内部値、
 * ログ出力「価格変更CSV出力ファイル名」とログ抑止、セッション非更新、IT-23検索条件/IT-26更新内容＝本機能は
 * 参照系で登録更新なし）はケース表で全量管理し、specに大量のfixmeを残さない（規約準拠）。
 * 自動化予定だが要シード/要実機の分のみ test.fixme で残す。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-05_admin_product_product_sale_price_csv_export.md /
 * ProductCsvController.php / ProductPriceCsv.php / messages.ja.yaml)由来（オラクル独立性）。
 * 実装からはセレクタ・ルート（位置情報）のみを取り、合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductSalePriceCsvExportPage } from "../../../pages/admin/m03/m03_05_admin_product_product_sale_price_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const HOME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/?(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;
// 商品一覧（admin_product = /<route>/product, admin_product_page = /<route>/product/page/{n}）。
const PRODUCT_LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product(/page/\\d+)?(\\?|$)`);
// 仕様: ファイル名 product_price_{YmdHis}.csv（ProductPriceCsv.php:66 / AbstractCsvService.php:382）。
const FILENAME_RE = /^product_price_\d{14}\.csv$/;

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const ERR_NOT_SELECT = "1つ以上の商品を選択してください"; // :1769 admin.product.not_select（未選択時 'admin' namespace）
const ERR_NOT_REGISTERED = "存在しないカードIDが含まれています。"; // :2244 admin.csv.error.export.not_registered

/** 管理ログインしてホームへ到達する。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).toHaveURL(HOME_RE);
}

test.describe(
  "商品管理 > セール用価格変更CSV出力",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== 未認証（資格情報不要・非破壊） =====

    test("E2E-M03-05-020 未ログインで商品一覧URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      // 権限・認可: 未認証は管理画面共通制約でログインへ（設計「未ログインは当パスへ到達できない」）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M03-05-021 未ログインで出力ルートへPOST→CSVを返さずログインへ誘導", async ({ page }) => {
      // 出力ルートは POST 専用。未認証では共通制約で遮断され CSV を返さない（設計「到達できない」）。
      const res = await page.request.post(
        `/${ECCUBE_ADMIN_ROUTE}/product/product_price_csv_export`,
        { form: { "ids[]": 1 } }
      );
      // 認証フォームへ誘導される（最終URLが /login）。CSVストリームは返らない。
      expect(res.url()).toMatch(LOGIN_RE);
      expect(res.headers()["content-type"] || "").not.toContain("text/csv");
    });

    // ===== UI部品（認証要・非破壊・要シード商品） =====

    test("E2E-M03-05-001 検索結果ありで一覧に「セール用価格変更CSV出力」ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductSalePriceCsvExportPage(page);
      await p.gotoProductList();
      test.skip((await p.productCount()) === 0, "商品一覧に商品が無い（SEED-M03-05-PRODUCTS）");
      await p.seeExportButton(); // trans admin.product.sale_price_csv_export（messages.ja.yaml:2047）
    });

    test("E2E-M03-05-005 各商品行に ids[] チェックボックスがあり全選択チェックで一括ONできる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductSalePriceCsvExportPage(page);
      await p.gotoProductList();
      test.skip((await p.productCount()) === 0, "商品一覧に商品が無い（SEED-M03-05-PRODUCTS）");
      // フロント挙動: #trigger_check_all が check_ 始まりを一括ON（index.twig:131-138）。
      await expect(p.idCheckboxes.first()).toBeVisible();
      await p.checkAll.check();
      await expect(p.idCheckboxes.first()).toBeChecked();
    });

    test("E2E-M03-05-004 出力前に確認ダイアログ（モーダル/alert）を表示しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductSalePriceCsvExportPage(page);
      await p.gotoProductList();
      test.skip((await p.productCount()) === 0, "商品一覧に商品が無い（SEED-M03-05-PRODUCTS）");
      // 設計「モーダル・ポップアップ」: 出力前の確認ダイアログは無い。本CSVボタンは type=submit で
      // 一括公開変更のような未チェック時 alert の JS は掛からない。
      let dialogShown = false;
      page.on("dialog", async (d) => {
        dialogShown = true;
        await d.dismiss();
      });
      await p.checkFirstProduct();
      const download = await p.exportAndWaitDownload();
      expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      expect(dialogShown, "出力前の確認ダイアログは表示されない").toBe(false);
    });

    // ===== ダウンロード発火・ファイル名・HTTP応答（認証要・要シード商品） =====

    test("E2E-M03-05-002 商品を選択して出力→ダウンロード発火・ファイル名 product_price_{YmdHis}.csv", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductSalePriceCsvExportPage(page);
      await p.gotoProductList();
      test.skip((await p.productCount()) === 0, "商品一覧に商品が無い（SEED-M03-05-PRODUCTS）");
      await p.checkFirstProduct();
      const download = await p.exportAndWaitDownload();
      // 仕様: filename="product_price_{YmdHis}.csv"。CSVの中身は手動確認（ケース表 付帯表）。
      expect(download.suggestedFilename()).toMatch(FILENAME_RE);
    });

    test("E2E-M03-05-003 選択商品IDのPOST応答が text/csv で attachment 配信される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductSalePriceCsvExportPage(page);
      await p.gotoProductList();
      const id = await p.firstProductId();
      test.skip(!id, "商品一覧に商品が無い（SEED-M03-05-PRODUCTS）");
      // 認証済みコンテキストで POST し応答ヘッダを観測（ブラウザのダウンロード保存を介さない）。
      const res = await page.context().request.post(p.exportUrl, { form: { "ids[]": id! } });
      expect(res.status()).toBe(200);
      // 仕様(設計md 入出力#12/#156): Content-Type text/csv ストリーム・Content-Disposition: attachment・
      // ファイル名 product_price_*。attachment と product_price_ の双方を確認する。
      const contentDisposition = res.headers()["content-disposition"] || "";
      expect(res.headers()["content-type"] || "").toContain("text/csv");
      expect(contentDisposition).toContain("attachment");
      expect(contentDisposition).toContain("product_price_");
    });

    // ===== エラー遷移（認証要） =====

    test("E2E-M03-05-010 商品未選択で出力→商品一覧へ戻り「1つ以上の商品を選択してください」を表示", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductSalePriceCsvExportPage(page);
      await p.gotoProductList();
      test.skip((await p.productCount()) === 0, "商品一覧に商品が無い（SEED-M03-05-PRODUCTS）");
      // 未チェックのまま出力。有効な商品IDが0件 → responseNoProductIdError（Controller.php:150-155）。
      await p.clickExportWithoutSelection();
      // 仕様: admin_product_page へリダイレクト（ページ番号はセッション検索ページ）。
      await expect(page).toHaveURL(PRODUCT_LIST_RE);
      // 'admin' namespace のフラッシュは管理フレームの .alert-danger に描画される（alert.twig:42）。
      await expect(p.dangerAlert).toContainText(ERR_NOT_SELECT);
    });

    test("E2E-M03-05-011 存在しない商品IDのみPOST→「存在しないカードIDが含まれています。」(仕様)で一覧/Refererへ戻る", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductSalePriceCsvExportPage(page);
      await p.gotoProductList();
      // 取得0件 → RuntimeException(admin.csv.error.export.not_registered)（ProductPriceCsv.php:49）。
      // 巨大な未使用IDで「存在しないIDのみ」を作る（実在IDを創作しない）。
      await page.evaluate(
        ({ url, id }) => {
          const f = document.querySelector<HTMLFormElement>("#form_bulk");
          if (!f) return;
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = "ids[]";
          input.value = String(id);
          f.appendChild(input);
          f.setAttribute("action", url);
          f.submit();
        },
        { url: p.exportUrl, id: 999999999 }
      );
      // 仕様: フラッシュ後、Referer もしくは admin_product_page へリダイレクト（Controller.php:194-201）。
      await expect(page).toHaveURL(PRODUCT_LIST_RE);
      // 期待は仕様どおり（設計md「例外メッセージをフラッシュに積む」）。実装は 'front' namespace で積むため
      // 管理フレーム(.alert-danger は eccube.admin.* のみ描画)に出ない可能性がある＝不具合候補#1。乖離なら本行が失敗し検出する。
      await expect(p.dangerAlert).toContainText(ERR_NOT_REGISTERED);
    });

    test("E2E-M03-05-013 無効なidsのみ送信→整数フィルタで全破棄→未選択扱いで一覧へ「1つ以上の商品を選択してください」", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductSalePriceCsvExportPage(page);
      await p.gotoProductList();
      test.skip((await p.productCount()) === 0, "商品一覧に商品が無い（SEED-M03-05-PRODUCTS）");
      // 設計 処理フロー#2-3 / バリデーション: ids は整数化し 0 より大きいものだけ残す。
      // 文字列/0/負数のみ → 有効0件 → responseNoProductIdError（Controller.php:140-155）。
      // 実在IDを創作せず、明確に無効な値だけを #form_bulk に注入して送る。
      await p.addRawIds(["abc", 0, -1]);
      await p.submitExportForm();
      // 仕様: admin_product_page へリダイレクト＋'admin' namespace の not_select フラッシュ。
      await expect(page).toHaveURL(PRODUCT_LIST_RE);
      await expect(p.dangerAlert).toContainText(ERR_NOT_SELECT);
    });

    test("E2E-M03-05-014 実在ID＋存在しないIDの混在→取得できた商品のみ出力しエラーにせずDL発火", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductSalePriceCsvExportPage(page);
      await p.gotoProductList();
      const id = await p.firstProductId();
      test.skip(!id, "商品一覧に商品が無い（SEED-M03-05-PRODUCTS）");
      // 設計 業務ルール(行109): 一部IDがDBに無くても取得できた商品だけ出力し、存在しないIDは静かに無視。
      // 実在ID(チェック)＋存在しない巨大IDを混在させてもエラー遷移せずDLが発火することのみを観測する。
      await p.checkFirstProduct();
      await p.addRawIds([999999999]);
      const download = await p.exportAndWaitDownload();
      // 仕様: ファイル名 product_price_{YmdHis}.csv。出力された行集合（実在商品のみ）はCSV本文＝手動確認。
      expect(download.suggestedFilename()).toMatch(FILENAME_RE);
    });

    // ===== 自動化予定だが要シード/要実機（未実装。手動/対象外はケース表で管理） =====

    test.fixme(
      "E2E-M03-05-012 規格0件の商品のみ選択→ヘッダ行のみのCSVが返りエラーにしない（要: 規格0件商品シード SEED-M03-05-NOCLASS）",
      async () => {
        // 期待は仕様(設計md「規格0件はスキップ・結果0行でもエラーにしない」/ ProductPriceCsv.php:88)由来。
        // 規格0件商品のみ選択でダウンロードが発火し（ファイル名 product_price_{YmdHis}.csv）、エラー遷移しないこと。
        // ヘッダ行のみ・データ0行のCSV内容自体は手動確認（ケース表 付帯表）。
      }
    );

    test.fixme(
      "E2E-M03-05-006 検索結果0件で「セール用価格変更CSV出力」ボタンとids[]が非表示（要: 0件になる検索条件/実機確認）",
      async () => {
        // 設計 利用者視点の入口(行37): pagination があり件数が正のときだけ一括フォームとボタン行が描画される（index.twig:464）。
        // 検索結果0件のとき出力ボタン・ids[]チェックボックスが描画されないこと（001の異常系対）。
        // 0件を確実に作る検索フォームのセレクタが未検証＝要実機確認のため fixme。
      }
    );

    test.fixme(
      "E2E-M03-05-015 未選択出力時、セッション検索ページ番号を反映した一覧ページへリダイレクト（要: ページング可能なシード）",
      async () => {
        // 設計 処理フロー#3 / セッション(行60,205,251): 未選択時 eccube.admin.product.search.page_no があれば
        // その値で admin_product_page へリダイレクトする（無ければ既定1）。page_no を 2 以上にするには
        // ページング可能な件数のシードが要る＝要シードのため fixme。
      }
    );
  }
);
