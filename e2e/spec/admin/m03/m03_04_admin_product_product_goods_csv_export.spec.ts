/**
 * 商品管理「グッズ商品CSV出力」E2E。
 * 納品ケース表 integration_test/e2e/m03_04_admin_product_product_goods_csv_export_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装する。手動（CSV内容一致・全規格走査・列対応・findBy戻り順）／
 * 対象外（DB検索内部値、ログ抑止、セッション内部、CSRF=本submitは未保護で該当なし）はケース表で全量管理し、
 * specに大量のfixmeを残さない（規約準拠）。要シード/要実機の自動化予定のみ test.fixme で残す。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-04_admin_product_product_goods_csv_export.md /
 * ProductCsvController.php / ProductGoodsCsv.php / AbstractCsvService.php / messages.ja.yaml)由来
 * （オラクル独立性）。実装からはセレクタ・ルート（位置情報）のみを取り、合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 * グッズ商品（カード詳細なし・規格1件以上）の既知IDは GOODS_PRODUCT_ID で供給（未設定時はダウンロード系を skip）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductGoodsCsvExportPage } from "../../../pages/admin/m03/m03_04_admin_product_product_goods_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// SEED-M03-04-GOODS: カード詳細なし・規格1件以上の出力可能な商品ID。
const GOODS_PRODUCT_ID = process.env.GOODS_PRODUCT_ID || "";
const HAS_GOODS = HAS_CREDS && !!GOODS_PRODUCT_ID;

const HOME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/?(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;
const PRODUCT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product(/page/\\d+)?(\\?|$)`);
// 仕様: ファイル名 product_goods_{YmdHis}.csv（ProductGoodsCsv.php:72 + AbstractCsvService.php:380）。
const FILENAME_RE = /^product_goods_\d{14}\.csv$/;
// 仕様: 商品未選択時のフラッシュ admin.product.not_select（messages.ja.yaml:1769、namespace=admin で表示）。
const NOT_SELECT = "1つ以上の商品を選択してください";

/** 管理ログインしてホームへ到達する。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).toHaveURL(HOME_RE);
}

test.describe(
  "商品管理 > グッズ商品CSV出力",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== 未認証（資格情報不要・非破壊） =====

    test("E2E-M03-04-040 未ログインで商品一覧へアクセス→管理ログイン画面へ誘導", async ({ page }) => {
      // 権限・認可: 未ログインは管理画面共通制約でログインへ（当パスへ到達できない）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M03-04-041 未ログインで出力ルートへPOST→管理ログイン画面へ誘導(CSV非配信)", async ({ page }) => {
      // 出力ルートは POST 専用（methods:['POST'] ProductCsvController.php:109）。GET 直アクセスは
      // ルーティング段で 405 になり得るため、未認証 POST で共通ガード（ログイン誘導）を観測する。
      const res = await page.request.post(`/${ECCUBE_ADMIN_ROUTE}/product/product_goods_csv_export`, {
        headers: { "content-type": "application/x-www-form-urlencoded" },
        data: "",
        maxRedirects: 0,
      });
      // 仕様: 未ログインは管理ログインへ誘導され、CSV は配信されない。
      expect(res.status()).toBe(302);
      expect(res.headers()["location"] || "").toMatch(/\/login/);
      expect(res.headers()["content-type"] || "").not.toContain("text/csv");
    });

    // ===== UI部品（認証要・非破壊。検索結果>0が前提） =====

    test("E2E-M03-04-001 商品一覧に「グッズ商品CSV出力」ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductGoodsCsvExportPage(page);
      await p.gotoProductList();
      // 一覧ブロックが描画される（件数が正）こと前提。0件環境では skip 相当。
      test.skip((await p.rowCheckboxes.count()) === 0, "商品一覧に表示対象が無い（検索結果0件）");
      await p.seeGoodsButton(); // messages.ja.yaml:2046 admin.product.goods_csv_export
    });

    test("E2E-M03-04-002 各商品行に name=\"ids[]\" チェックボックスと全選択チェックが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductGoodsCsvExportPage(page);
      await p.gotoProductList();
      test.skip((await p.rowCheckboxes.count()) === 0, "商品一覧に表示対象が無い（検索結果0件）");
      await expect(p.rowCheckboxes.first()).toBeAttached(); // index.twig:585
      await expect(p.triggerCheckAll).toBeVisible(); // index.twig:552
    });

    test("E2E-M03-04-003 出力ボタン押下前に確認ダイアログ（モーダル/alert）が表示されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductGoodsCsvExportPage(page);
      await p.gotoProductList();
      test.skip((await p.rowCheckboxes.count()) === 0, "商品一覧に表示対象が無い（検索結果0件）");
      // フロント挙動: 出力ボタンは type=submit のため未チェック時の固定文言 alert は掛からない（設計「JS挙動」）。
      let dialogShown = false;
      page.on("dialog", async (d) => {
        dialogShown = true;
        await d.dismiss();
      });
      await p.clickExport(); // 未選択のまま押下（サーバ側でリダイレクトされる）
      await expect(page).toHaveURL(PRODUCT_RE);
      expect(dialogShown, "出力前の確認ダイアログは表示されない").toBe(false);
    });

    test("E2E-M03-04-004 検索結果0件のとき「グッズ商品CSV出力」ボタンが表示されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductGoodsCsvExportPage(page);
      await p.gotoProductList();
      // 仕様(利用者視点の入口): 件数が正のときだけ一括フォームとボタン行が出る（index.twig:464）。
      // 一致しないキーワードで0件にして負側条件（ボタン非描画）を確認する。
      await p.searchNoResult("__no_such_product_zzzz_9f1c__");
      await expect(p.noResult).toBeVisible(); // 検索0件メッセージ（index.twig:824）
      await expect(p.goodsCsvButton).toHaveCount(0);
    });

    // ===== 正常系: ダウンロード（認証要・要グッズ商品シード） =====

    test("E2E-M03-04-010 グッズ商品を選択して出力→CSVダウンロードが発火しファイル名がproduct_goods_{YmdHis}.csv", async ({ page }) => {
      test.skip(!HAS_GOODS, "GOODS_PRODUCT_ID 未設定（SEED-M03-04-GOODS）");
      await loginToHome(page);
      const p = new ProductProductGoodsCsvExportPage(page);
      await p.gotoProductList();
      await p.selectProduct(GOODS_PRODUCT_ID);
      const download = await p.exportAndWaitDownload();
      // 仕様: filename="product_goods_{YmdHis}.csv"。CSVの中身（列・規格展開）は手動確認（ケース表 付帯表）。
      expect(download.suggestedFilename()).toMatch(FILENAME_RE);
    });

    test("E2E-M03-04-011 有効商品の出力応答がtext/csvでattachment配信される", async ({ page }) => {
      test.skip(!HAS_GOODS, "GOODS_PRODUCT_ID 未設定（SEED-M03-04-GOODS）");
      await loginToHome(page);
      const p = new ProductProductGoodsCsvExportPage(page);
      // 認証済みコンテキストから直接 POST してヘッダを観測（ブラウザのダウンロード保存を介さない）。
      const res = await p.postExport([GOODS_PRODUCT_ID]);
      expect(res.status()).toBe(200);
      // 仕様: Content-Type text/csv（AbstractCsvService.php:395）, Content-Disposition attachment product_goods_（同:396）。
      expect(res.headers()["content-type"] || "").toContain("text/csv");
      expect(res.headers()["content-disposition"] || "").toContain("product_goods_");
    });

    test("E2E-M03-04-014 有効グッズID＋存在しないIDを混在POST→取得できた商品でCSVが配信される", async ({ page }) => {
      test.skip(!HAS_GOODS, "GOODS_PRODUCT_ID 未設定（SEED-M03-04-GOODS）");
      await loginToHome(page);
      const p = new ProductProductGoodsCsvExportPage(page);
      // 仕様: 配列が空でなく取得結果も空の時だけ not_registered。存在するIDが1件でもあれば
      //（findBy で取得でき）CSV が配信される（ProductCsvController.php:114-/ ProductGoodsCsv.php:53-54）。
      // どの商品が含まれるか（取得できた商品だけ）の本文照合は手動（ケース表 012）。
      const res = await p.postExport([GOODS_PRODUCT_ID, 999999999]);
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"] || "").toContain("text/csv");
      expect(res.headers()["content-disposition"] || "").toContain("product_goods_");
    });

    // ===== 異常系: 未選択（認証要・検索結果>0が前提） =====

    test("E2E-M03-04-020 商品未選択で出力→商品一覧へリダイレクトされる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductGoodsCsvExportPage(page);
      await p.gotoProductList();
      test.skip((await p.rowCheckboxes.count()) === 0, "商品一覧に表示対象が無い（検索結果0件）");
      await p.clickExport(); // 未選択（有効ID 0件）→ responseNoProductIdError
      await expect(page).toHaveURL(PRODUCT_RE); // admin_product_page（ページ番号はセッション）
    });

    test("E2E-M03-04-021 商品未選択で出力→「1つ以上の商品を選択してください」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductGoodsCsvExportPage(page);
      await p.gotoProductList();
      test.skip((await p.rowCheckboxes.count()) === 0, "商品一覧に表示対象が無い（検索結果0件）");
      await p.clickExport();
      // 仕様: addError(admin.product.not_select,'admin')→ eccube.admin.error → alert-danger に表示（messages.ja.yaml:1769）。
      await expect(p.errorAlert).toContainText(NOT_SELECT);
    });

    // ===== 異常系: 無効ID / 不存在ID（認証要・request POST で観測） =====

    test("E2E-M03-04-031 存在しないIDのみを出力POST→CSVを配信せずリダイレクト(302)", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductGoodsCsvExportPage(page);
      // 仕様: 取得結果が空→ admin.csv.error.export.not_registered の RuntimeException→ Referer/一覧へリダイレクト。
      const res = await p.postExport([999999999]);
      expect(res.status()).toBe(302); // CSVストリームではなくリダイレクト応答
      expect(res.headers()["content-type"] || "").not.toContain("text/csv");
      // 仕様: Referer 無送信なので admin_product_page（商品一覧）へリダイレクトする
      // （ProductCsvController.php:138-145）。リダイレクト先を Location ヘッダで確認する。
      expect(res.headers()["location"] || "").toMatch(/\/product(\/page\/\d+)?(\?|$)/);
    });

    test("E2E-M03-04-032 無効なID(0以下・非数字)のみを出力POST→CSVを配信せずリダイレクト(302)", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductGoodsCsvExportPage(page);
      // 仕様: intval後 0以下/非整数は破棄→有効ID 0件→ responseNoProductIdError でリダイレクト。
      const res = await p.postExport([0, -1, "abc"]);
      expect(res.status()).toBe(302);
      expect(res.headers()["content-type"] || "").not.toContain("text/csv");
      // 仕様: responseNoProductIdError は admin_product_page へリダイレクト（page_no はセッション、既定1）
      // （ProductCsvController.php:118-119,149-154）。リダイレクト先を Location ヘッダで確認する。
      expect(res.headers()["location"] || "").toMatch(/\/product(\/page\/\d+)?(\?|$)/);
    });

    test("E2E-M03-04-034 非配列の ids を出力POST→空配列扱いでCSVを配信せずリダイレクト(302)", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductGoodsCsvExportPage(page);
      // 仕様(処理フロー#2): ids が配列でない場合は空配列とみなす→有効ID 0件→ responseNoProductIdError
      //（ProductCsvController.php:114-119）。スカラ ids=abc（配列記法でない）を送って負側分岐を観測する。
      const res = await p.postExportRaw("ids=abc");
      expect(res.status()).toBe(302);
      expect(res.headers()["content-type"] || "").not.toContain("text/csv");
      expect(res.headers()["location"] || "").toMatch(/\/product(\/page\/\d+)?(\?|$)/);
    });

    test("E2E-M03-04-035 例外時にRefererがあればRefererへリダイレクトされCSVは配信されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductGoodsCsvExportPage(page);
      // 仕様(実行時例外処理): Referer ヘッダが空でなければその URL へリダイレクトする
      //（ProductCsvController.php:138-145）。存在しないIDのみ→not_registered 例外経路で Referer 遷移を観測。
      const referer = `${new URL(page.url()).origin}/${ECCUBE_ADMIN_ROUTE}/product/page/2`;
      const res = await p.postExportRaw("ids%5B%5D=999999999", { referer });
      expect(res.status()).toBe(302); // CSVストリームではなくリダイレクト
      expect(res.headers()["content-type"] || "").not.toContain("text/csv");
      // Referer 非空のときは admin_product_page（既定）ではなく Referer の URL へ戻す。
      expect(res.headers()["location"] || "").toContain("/product/page/2");
    });

    // ===== 自動化予定だが要シード/要実機（未実装。手動/対象外はケース表で管理） =====

    test.fixme(
      "E2E-M03-04-033 カード詳細なしだが規格0件の商品のみ選択して出力→CSVを配信せずリダイレクト（要: 規格0件商品シード SEED-M03-04-NOCLASS）",
      async () => {
        // 期待は仕様(処理フロー#7-8 規格0件はスキップ→変換結果空→no_goods_data RuntimeException→リダイレクト
        // ProductGoodsCsv.php:57-58 / エッジケース「規格0件のみ」)由来。030(カード詳細あり)とは別分岐。
        // 注: 例外経路のフラッシュは namespace 既定=front で admin/alert.twig 非表示（不具合候補#1）。
        // よって文言ではなく「CSVを配信せずリダイレクトする」を観測する。規格0件商品IDを供給後に実装。
      }
    );

    test.fixme(
      "E2E-M03-04-030 カード詳細ありの商品のみ選択して出力→CSVを配信せずリダイレクト（要: カード詳細あり商品シード SEED-M03-04-CARD）",
      async () => {
        // 期待は仕様(ProductGoodsCsv.php:57-58 変換結果空→no_goods_data RuntimeException→リダイレクト)由来。
        // 注: 例外経路のフラッシュは namespace 既定=front で積まれ admin/alert.twig（eccube.admin.*）では非表示（不具合候補#1）。
        // よってフラッシュ文言ではなく「CSVを配信せずリダイレクトする」を観測する。カード詳細付き商品IDを供給後に実装。
      }
    );

    test.fixme(
      "E2E-M03-04-015 グッズ商品＋カード詳細あり商品を混在選択して出力→グッズ商品でCSVが配信される（要: SEED-M03-04-GOODS＋SEED-M03-04-CARD）",
      async () => {
        // 期待は仕様(処理フロー#7 カード詳細あり商品はスキップ→残ったグッズ商品で出力 ProductGoodsCsv.php:53-58)由来。
        // 自動化部分は「CSVが配信される(200/text/csv)」の観測。カード詳細商品が除外される本文照合は手動（ケース表 012/083）。
        // グッズ商品IDとカード詳細あり商品IDの双方を供給後に postExport([GOODS, CARD]) で実装する。
      }
    );

    test.fixme(
      "E2E-M03-04-013 一括フォーム全選択チェック(#trigger_check_all)で行チェックが連動する（要: JS連動の実機確認）",
      async () => {
        // 期待は仕様(フロント挙動「表頭で check_ 始まりのチェックを一括オンオフ」index.twig:131-)由来。
        // jQuery 連動セレクタ範囲の実機挙動を確認後に実装する。
      }
    );
  }
);
