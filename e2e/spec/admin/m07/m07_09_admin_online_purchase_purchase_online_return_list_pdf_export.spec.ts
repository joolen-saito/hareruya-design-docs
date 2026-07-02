/**
 * 管理画面 ネット買取管理「戻しリストPDF出力」E2E（M07-09）。
 * 納品ケース表 integration_test/e2e/m07_09_admin_online_purchase_purchase_online_return_list_pdf_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化（実装済み）」と「自動化予定だが未実装/要SEED・要実機（test.fixme・理由付き）」のみ残す。
 * 手動（帳票内容の厳密検査=050・印刷ダイアログ=012）・対象外（ログ抑止・DB更新は設計書「参照のみ」根拠。
 * 要確認: 実装は restocked_flg を更新＝ケース表 付帯表4#6）はケース表で全量管理する
 * （規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/.../m07-09_...md の 例外処理・プロセスフロー・表示制御 ＋ Excel原典 戻しリストPDF)由来
 * （オラクル独立性）。実装の現挙動・Form制約・Cookie名は期待値に流用しない。選択必須エラー文言は locale
 * (messages.ja.yaml:5247)由来で照合可。各エラーは設計md 例外処理由来の「PDF非生成(ok:false)」を主判定とする。
 *
 * 刷新先 ec-cube-enterprise に当該機能が存在することを確認済み:
 *   起点 route admin_purchase_list = GET /<route>/purchase/list（PurchaseController.php:121）/ 戻しリストPDFボタン index.twig:176。
 *   出力 route admin_purchase_pdf_export_return_list = POST /<route>/purchase/pdf_export_return_list（:668-701、JsonResponse{ok,html}）。
 *   出力ボタン押下→ purchase.js:27-84 が #bulk_csv_export を AJAX POST、ok:true で別ウィンドウへ restock_list.twig を描画。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(040,041)は資格情報不要。出力本体(011)・未選択alert(010)・直接POST検証(030-033)は
 * SEED（付帯表3）が要るため fixme。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OnlinePurchasePurchaseOnlineReturnListPdfExportPage } from "../../../pages/admin/m07/m07_09_admin_online_purchase_purchase_online_return_list_pdf_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/purchase/(list|search|page)`);
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
// 存在しないことが確実なID（int上限）。CSRF拒否/未認証ガードのダミー入力。
const NON_EXISTENT_ID = 2147483647;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 ネット買取管理 > 戻しリストPDF出力",
  { tag: ["@admin", "@online_purchase", "@pdf"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M07-09-040 未ログインで買取一覧URL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new OnlinePurchasePurchaseOnlineReturnListPdfExportPage(page);
      await p.gotoList();
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M07-09-041 未ログインでPDF出力POST→PDF非生成（ok:trueを返さない）", async ({ page }) => {
      const p = new OnlinePurchasePurchaseOnlineReturnListPdfExportPage(page);
      // 仕様 権限・認可（開始条件＝ログイン済み）由来。未認証POSTでは PDF用データ(ok:true,html)が返らず、
      // 管理ログインへ誘導される（ケース表 E2E-M07-09-041 期待結果）。
      const res = await p.postPdfExport([NON_EXISTENT_ID], "x");
      expect(
        await OnlinePurchasePurchaseOnlineReturnListPdfExportPage.isPdfOk(res)
      ).toBe(false);
      // 「ログインへ誘導」を主判定: request はリダイレクトを追従するため最終URLが管理ログインであること。
      expect(res.url()).toMatch(LOGIN_RE);
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M07-09-001 買取一覧（戻しリストPDF出力の起点）が表示される", async ({ page }) => {
        await login(page);
        const p = new OnlinePurchasePurchaseOnlineReturnListPdfExportPage(page);
        await p.gotoList();
        await expect(page).toHaveURL(LIST_RE);
        await p.seeListScreen();
      });

      test("E2E-M07-09-002 検索実行で買取一覧に留まり結果セクションが評価される", async ({ page }) => {
        await login(page);
        const p = new OnlinePurchasePurchaseOnlineReturnListPdfExportPage(page);
        await p.runSearch();
        // 検索後も買取一覧（list/search/page）に留まること（仕様 画面遷移=一覧滞留）。
        await expect(page).toHaveURL(LIST_RE);
        // 結果セクションが評価されること（結果ありなら行チェックボックス、0件なら0件メッセージ）。
        // 結果有無はSEED依存のため、いずれか一方の表示で「検索結果が描画された」を判定する。
        await expect(p.rowCheckboxes.first().or(p.noResultMessage)).toBeVisible();
      });

      test("E2E-M07-09-003 検索結果があるとダウンロードメニューに「戻しリストPDF」ボタンが表示される", async ({ page }) => {
        await login(page);
        const p = new OnlinePurchasePurchaseOnlineReturnListPdfExportPage(page);
        await p.runSearch();
        // 結果0件ではメニュー自体が出ない（pagination 条件 index.twig:161）のが正のため skip し偽陽性を避ける
        // （SEED-M07-09-PURCHASE-ELIGIBLE 投入後に検証）。
        test.skip(
          !(await p.hasResults()),
          "ネット買取データ未投入（SEED-M07-09-PURCHASE-ELIGIBLE）のため検索結果0件＝メニュー非表示が正。seed投入後に検証する"
        );
        await p.openDownloadMenu();
        await expect(p.pdfExportButton).toBeVisible();
      });

      test("E2E-M07-09-020 無効CSRFトークンでPDF出力POST→拒否されPDF非生成", async ({ page }) => {
        await login(page);
        const p = new OnlinePurchasePurchaseOnlineReturnListPdfExportPage(page);
        // 仕様 エラー処理（CSRF保護 PurchaseController.php:672 isTokenValid）由来: 不正トークンのPOSTは拒否され
        // PDF用データ(ok:true,html)が返らない。トークン値は故意に壊した文字列（実装の有効値・Cookie名に依存しない）。
        const res = await p.postPdfExport([NON_EXISTENT_ID], "invalid-csrf-token");
        expect(
          await OnlinePurchasePurchaseOnlineReturnListPdfExportPage.isPdfOk(res)
        ).toBe(false);
      });

      test("E2E-M07-09-042 PDF出力URLにGET→405（POST専用ルート）", async ({ page }) => {
        await login(page);
        const p = new OnlinePurchasePurchaseOnlineReturnListPdfExportPage(page);
        // 仕様 HTTPステータス・URL由来: 当該ルートは methods POST のみ（PurchaseController.php:668）。
        const res = await page.request.get(p.pdfExportPath, { failOnStatusCode: false });
        expect(res.status()).toBe(405);
      });
    });

    // ===== 自動化予定だが未実装/要SEED・要実機（理由付きで fixme。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M07-09-010 未選択で戻しリストPDF押下→確認アラートで送信されない（要: SEED-M07-09-PURCHASE-ELIGIBLE・dialog捕捉）",
      async () => {
        // 期待は仕様(表示制御=未選択ガード purchase.js:30)由来。検索結果ありで未選択のままボタン押下→
        // window.alert「PDF出力する買取注文情報をひとつ以上選択してください。」を page.on('dialog')で捕捉し、
        // PDF出力POSTが発火しないことを検証する。SEED投入後に実装。
      }
    );

    test.fixme(
      "E2E-M07-09-011 対象選択→戻しリストPDF実行で別ウィンドウに戻しリスト＋「印刷する」ボタン表示（要: SEED-M07-09-PURCHASE-ELIGIBLE・popup要実機）",
      async () => {
        // 期待は仕様(プロセスフロー#5・表示制御=印刷するボタン)由来。exportPdfViaUi()でpopupを捕捉し、
        // #printButton（restock_list.twig:11「印刷する」messages.ja.yaml:1467）の表示を検証。
        // popupは document.write 描画のため内容セレクタは要実機確認（付帯表4#4）。
      }
    );

    test.fixme(
      "E2E-M07-09-030 選択なしで直接POST→ok:falseでPDF非生成・選択必須エラー（要: SEED-ELIGIBLEの有効トークン）",
      async () => {
        // 期待は仕様(例外処理=入力不備)由来。検索結果画面の有効トークンを readCsrfToken()で取得し、
        // buyOrderIds空でPOST→ isPdfOk=false（ok:false）＋ redirect先で no_selection(messages.ja.yaml:5247)を確認。
      }
    );

    test.fixme(
      "E2E-M07-09-031 有効ID＋存在しないIDの混在で直接POST→ok:falseで存在エラー（要: SEED-ELIGIBLEの有効トークン・有効ID）",
      async () => {
        // 期待は仕様(例外処理=存在しないID)由来。有効トークン＋「有効ID1件＋存在しないID1件」でPOST→ isPdfOk=false。
        // 判定順: findBy空（全ID未存在）では先に「対象のデータが見つかりません。」(033)になるため、存在エラー分岐の
        // 到達には有効IDの混在が必要（付帯表1）。文言「買取番号: %07d は存在しません。」は遷移後フラッシュで要実機確認（付帯表4#5）。
      }
    );

    test.fixme(
      "E2E-M07-09-032 出力対象ステータス以外を選択→ok:falseで状態エラー（要: SEED-M07-09-PURCHASE-INELIGIBLE-STATUS＋有効トークン）",
      async () => {
        // 期待は仕様(例外処理=状態不整合)由来。入庫待ち/入庫済み以外のステータスの買取番号でPOST→ isPdfOk=false。
      }
    );

    test.fixme(
      "E2E-M07-09-033 選択IDがいずれも存在しない場合→ok:falseで対象なしエラー（要: SEEDの有効トークン）",
      async () => {
        // 期待は仕様(例外処理=対象なし)由来。選択IDがDB上いずれも未存在（findBy空）でPOST→ isPdfOk=false。
        // 文言「対象のデータが見つかりません。」は遷移後フラッシュで要実機確認。
      }
    );

    // E2E-M07-09-012（別ウィンドウ「印刷する」押下=ブラウザ印刷ダイアログ。window.printは自動観測困難）と
    // E2E-M07-09-050（帳票フォーマット=仕訳/閾値/並び順/略称除去/サプライ表示の内容厳密検査）は手動のため
    // specに残さず、ケース表（付帯表1/5）で管理する（規約「手動/対象外はspecに残さない」）。
  }
);
