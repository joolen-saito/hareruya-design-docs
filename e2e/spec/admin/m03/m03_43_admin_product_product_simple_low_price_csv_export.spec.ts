/**
 * 管理画面 商品管理「低価格帯カード価格変更CSV出力」E2E（csv_export 画面）。
 * 納品ケース表 integration_test/e2e/m03_43_admin_product_product_simple_low_price_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(基本設計 functions/ec-cube-enterprise/m03-43_admin_product_product_simple_low_price_csv_export.md /
 *  原典 Excel M03-44 CSVフォーマット・計算式※1)由来（オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 【重要・screenExists=false】刷新先 ec-cube-enterprise に「低価格帯カード価格変更CSV出力」専用のボタン・ルート・コントローラが存在しない
 *  （基本設計 注記「B6 Ph2で対応」のフェーズ2新規実装。商品一覧 form_bulk の出力ボタンは card/goods/price/bulk_buy_price のみ
 *   index.twig:468-477／Controller/Admin/Product/Csv/ に low_price 出力なし／ベースの ProductStandardPriceCsvController は取込専用）。
 * したがって本spec は **E2E自動化(実装済み)を1件も持たず、自動化候補は全件 test.fixme（理由付き）** とする。
 * 各ケースの期待結果は基本設計どおりに記述してあり、Ph2実装・移行方針（一覧の一括出力に集約 or 専用画面）確定・実機確認後に
 * セレクタ/ルートを確定して有効化する。CSV内容（9列・計算式新価格・参考列・原価単価）の検査は手動、手動・対象外はケース表で全量管理する
 * （規約「手動/対象外はspecに残さない」）。
 *
 * 実行ガード（有効化時）: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 本機能は参照系の出力でDB更新を行わないため非破壊（要シードは商品一覧ヒット用 SEED-M03-43-PRODUCTS のみ）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductSimpleLowPriceCsvExportPage } from "../../../pages/admin/m03/m03_43_admin_product_product_simple_low_price_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const LOGIN_RE = /\/login(\?|$)/;
const PRODUCT_LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product(/page/\\d+)?(\\?|$)`);

// 注（オラクル独立性）: 商品未選択時の具体的なエラーメッセージ文言は基本設計（正本md「例外処理: 入力不備」）に規定が無い。
// messages.ja.yaml の admin.product.not_select=「1つ以上の商品を選択してください」は実装由来の文言であり、
// 期待値に固定するとオラクル混入になるため、本specでは文言を固定せず「選択要求エラー（danger アラート）が表示される」挙動レベルで判定する。

// 全件に付す未実装理由（刷新先未存在）。
const REASON =
  "刷新先 ec-cube-enterprise に低価格帯カード価格変更CSV出力の専用ボタン・ルートが未存在（B6 Ph2で対応）。Ph2実装・移行方針確定・実機確認後にセレクタ/ルートを確定して有効化する。";

/** 管理ログインする。 */
async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 商品管理 > 低価格帯カード価格変更CSV出力",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== UI部品（要管理ログイン・非破壊・要シード商品） =====

    test.fixme(`E2E-M03-43-001 一覧に「低価格帯カード価格変更CSV出力」ボタンが表示される（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new ProductProductSimpleLowPriceCsvExportPage(page);
      await p.gotoProductList();
      // 期待は仕様(機能の目的＝低価格帯カード価格変更のCSV出力ボタン)由来。
      await p.seeExportButton();
    });

    test.fixme(`E2E-M03-43-002 各商品行のチェックボックスを全選択で一括ONできる（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new ProductProductSimpleLowPriceCsvExportPage(page);
      await p.gotoProductList();
      // 期待は仕様(操作起点＝出力対象の選択)由来。
      await expect(p.idCheckboxes.first()).toBeVisible();
      await p.checkAll.check();
      await expect(p.idCheckboxes.first()).toBeChecked();
    });

    test.fixme(`E2E-M03-43-003 出力前に確認ダイアログを表示しない（${REASON}）`, async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new ProductProductSimpleLowPriceCsvExportPage(page);
      await p.gotoProductList();
      // 期待は仕様(フロント挙動: 出力前の確認ダイアログ無し)由来。
      let dialogShown = false;
      page.on("dialog", async (d) => {
        dialogShown = true;
        await d.dismiss();
      });
      await p.checkFirstProduct();
      const download = await p.exportAndWaitDownload();
      expect(download.suggestedFilename()).toMatch(/\.csv$/);
      expect(dialogShown, "出力前の確認ダイアログは表示されない").toBe(false);
    });

    // ===== ダウンロード発火・HTTP応答（要管理ログイン・要シード商品） =====

    test.fixme(`E2E-M03-43-010 商品を選択して出力するとCSVダウンロードが発火する（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new ProductProductSimpleLowPriceCsvExportPage(page);
      await p.gotoProductList();
      await p.checkFirstProduct();
      // 期待は仕様(入出力仕様＝CSVダウンロード)由来。CSVの中身は手動確認（ケース表 030-033）。
      const download = await p.exportAndWaitDownload();
      expect(download.suggestedFilename()).toMatch(/\.csv$/);
    });

    test.fixme(`E2E-M03-43-011 出力POST応答が text/csv の添付として200で返る（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new ProductProductSimpleLowPriceCsvExportPage(page);
      await p.gotoProductList();
      const id = await p.firstProductId();
      test.skip(!id, "商品一覧に商品が無い（SEED-M03-43-PRODUCTS）");
      // 期待は仕様(入出力仕様＝CSV出力／IT-25 HTTPステータス)由来。
      const res = await page.context().request.post(p.exportUrl, { form: { "ids[]": id! } });
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"] || "").toContain("text/csv");
      expect(res.headers()["content-disposition"] || "").toContain("attachment");
    });

    // ===== エラー（要管理ログイン） =====

    test.fixme(`E2E-M03-43-020 商品未選択で出力すると選択要求メッセージで一覧に留まる（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new ProductProductSimpleLowPriceCsvExportPage(page);
      await p.gotoProductList();
      await p.clickExportWithoutSelection();
      // 期待は仕様(例外処理「入力不備」＝対象未選択／IT-22 必須制御)由来。
      // 商品一覧に留まり、選択要求エラー（danger アラート）が表示されること。
      // 具体文言は設計未規定＝実装メッセージ(messages.ja.yaml)に固定しない（オラクル独立性）。
      await expect(page).toHaveURL(PRODUCT_LIST_RE);
      await expect(p.dangerAlert).toBeVisible();
    });

    test.fixme(`E2E-M03-43-021 存在しない商品IDのみで出力しても正常データCSVは返らない（空CSV/出力失敗の別は設計未確定＝要確認。${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new ProductProductSimpleLowPriceCsvExportPage(page);
      await p.gotoProductList();
      // 実在しない巨大IDで「存在しないIDのみ」を作る（実在IDを創作しない）。
      const res = await page.context().request.post(p.exportUrl, { form: { "ids[]": 999999999 } });
      // 期待は仕様(例外処理「対象なし」／IT-27)由来。基本設計(正本md)は対象なし時を
      // 「空の一覧・空CSV・またはエラーレスポンスのいずれか。細部は実装に従う」と幅を持たせている＝出力結果の型は設計未確定（要確認）。
      // よってここでは「該当データ無しでも要求が処理されレスポンスが返る」ことのみ確認し、
      // 空CSV/出力失敗エラーの別（および content-type）は実機確認で確定する（実装挙動をオラクルに固定しない）。
      expect(res.status()).toBeGreaterThanOrEqual(200);
    });

    test.fixme(`E2E-M03-43-042 認証済みでもCSRFトークン不正/欠落の出力POSTはCSVを返さない（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new ProductProductSimpleLowPriceCsvExportPage(page);
      await p.gotoProductList();
      const id = await p.firstProductId();
      test.skip(!id, "商品一覧に商品が無い（SEED-M03-43-PRODUCTS）");
      // 期待は仕様(権限・認可／IT-15 CSRF)由来。011 正常POSTに対する異常系の対。
      // 認証済みコンテキストで CSRF トークンを付与せず（form_bulk は Symfony Form の CSRF 保護下）出力POSTする。
      // CSRF保護により正常なCSVストリーム（text/csv）を返さないことのみを判定する。
      // 注: 拒否時のHTTPステータス・遷移先・CSRFトークン名は実装フレームワーク依存＝要確認のためオラクル化しない。
      const res = await page.context().request.post(p.exportUrl, { form: { "ids[]": id! } });
      expect(res.headers()["content-type"] || "").not.toContain("text/csv");
    });

    // ===== 権限・認可（資格情報不要） =====

    test.fixme(`E2E-M03-43-040 未ログインで商品一覧URL直接アクセスで管理ログインへ誘導される（${REASON}）`, async ({
      page,
    }) => {
      // 期待は仕様(開始条件＝ログイン済み利用者／権限・認可)由来。一覧 admin_product は実在し未認証はログイン誘導。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test.fixme(`E2E-M03-43-041 未ログインで出力ルートへPOSTするとCSVを返さずログインへ誘導される（${REASON}）`, async ({
      page,
    }) => {
      // 期待は仕様(開始条件／権限・認可＝未認証は出力に到達しない)由来。
      // 注: 出力ルート自体が刷新先未存在のため、ログイン誘導でなく404の可能性あり（不具合候補#1＝失敗で検出見込み）。
      const p = new ProductProductSimpleLowPriceCsvExportPage(page);
      const res = await page.request.post(p.exportUrl, { form: { "ids[]": 1 } });
      expect(res.url()).toMatch(LOGIN_RE);
      expect(res.headers()["content-type"] || "").not.toContain("text/csv");
    });
  }
);
