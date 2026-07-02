/**
 * 管理画面 店頭買取管理「戻しリストPDF出力」E2E（M06-11）。
 * 納品ケース表 integration_test/e2e/m06_11_admin_store_purchase_purchase_store_return_list_pdf_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化（実装済み）」と「自動化予定だが未実装/要SEED（test.fixme・理由付き）」のみ残す。
 * 手動（PDF帳票の閾値区分・並び順・棚番・商品名整形・基準価格・実印刷＝帳票内容厳密検査）・
 * CSRF（IT-15 viewpoints:422 トークン改ざん時の副作用なし）は自動化対象だがSEED-ELIGIBLE待ちのため fixme(025)。
 * 対象外（ログ出力抑止・一覧検索は別機能m06_01へ委譲・状態変化なし＝参照系）はケース表で全量管理する
 * （規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/.../m06-11_...md の 例外処理・プロセスフロー・入出力仕様 ＋ Excel原典 戻しリストPDFレイアウト)由来
 * （オラクル独立性）。実装の現挙動・Form制約・JS文言は期待値に流用しない。各エラーは設計md 例外処理由来の
 * 「エラー表示＋PDF非生成」を正とし、locale未登録のハードコード文言（対象なし/対象外ステータス/複数店舗/権限）は
 * 文言一致では判定しない（付帯表4）。選択必須エラー文言は locale(messages.ja.yaml:5247)由来で照合可。
 *
 * 刷新先 ec-cube-enterprise に当該機能が存在することを確認済み:
 *   起点 route admin_otcbuyorder = /<route>/otcbuyorder（OtcBuyOrderController.php:90-104）/ 戻しリストPDFボタン index.twig:187。
 *   PDF用データ route admin_otcbuyorder_restock_list_pdf = POST /<route>/otcbuyorder/restock-list/pdf（OtcBuyOrderController.php:625-666）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(030)は資格情報不要。CSRF欠落(026)は isTokenValid が選択チェックより先(Controller.php:635)に走るためSEED不要で実装。
 * 印刷ポップアップ本体(010,011)・restocked更新の正常/異常(012,013)・状態/複数店舗(022,023)・権限(024)・CSRF改ざん(025)はSEED（付帯表3）が要るため fixme。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StorePurchasePurchaseStoreReturnListPdfExportPage } from "../../../pages/admin/m06/m06_11_admin_store_purchase_purchase_store_return_list_pdf_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder`);
const LOGIN_RE = /\/login(\?|$)/;
// 選択必須エラー（messages.ja.yaml:5247 admin.purchase.online.csv_export.no_selection）。仕様参照のlocale値であり実装定数の写しではない。
const ERR_NO_SELECTION = "1つ以上の買取注文情報を選択してください。";
// 存在しないことが確実なID（int上限）。対象なしエラー分岐を踏むためのダミー入力。
const NON_EXISTENT_ID = 2147483647;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 店頭買取管理 > 戻しリストPDF出力",
  { tag: ["@admin", "@store_purchase", "@pdf"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M06-11-030 未ログインで買取一覧URL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new StorePurchasePurchaseStoreReturnListPdfExportPage(page);
      await p.gotoList();
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M06-11-001 買取一覧（戻しリストPDF出力の起点）が表示される", async ({ page }) => {
        await login(page);
        const p = new StorePurchasePurchaseStoreReturnListPdfExportPage(page);
        await p.gotoList();
        await expect(page).toHaveURL(LIST_RE);
        await p.seeListScreen();
      });

      test("E2E-M06-11-002 検索結果があるとCSVメニューに「戻しリストPDF」ボタンが表示される", async ({ page }) => {
        await login(page);
        const p = new StorePurchasePurchaseStoreReturnListPdfExportPage(page);
        await p.runSearch();
        // 結果0件ではメニュー自体が出ない（pagination 条件 index.twig:155）のが正のため skip し偽陽性を避ける（SEED-M06-11-OTC 投入後に検証）。
        test.skip(
          !(await p.hasResults()),
          "店頭買取データ未投入（SEED-M06-11-OTC）のため検索結果0件＝メニュー非表示が正。seed投入後に検証する"
        );
        await p.openCsvMenu();
        await expect(p.pdfButton).toBeVisible();
      });

      test("E2E-M06-11-003 未選択で戻しリストPDF押下→クライアントガードで出力抑止（ポップアップ非生成）", async ({ page }) => {
        await login(page);
        const p = new StorePurchasePurchaseStoreReturnListPdfExportPage(page);
        await p.runSearch();
        test.skip(
          !(await p.hasResults()),
          "店頭買取データ未投入（SEED-M06-11-OTC）のためメニュー非表示。seed投入後に検証する"
        );
        const before = page.context().pages().length;
        // 未選択クリック。クライアントガード(alert)が出てPOST/ポップアップが起きないこと（主判定＝出力抑止）。
        const msg = await p.clickPdfExpectingNoSelectionGuard();
        // 主判定: 印刷ポップアップ(別ウィンドウ)が開かない＝PDF用データを生成しない。
        await page.waitForTimeout(300);
        expect(page.context().pages().length).toBe(before);
        // 副判定: 何らかの警告(alert)が提示された（文言は実装由来のため一致判定しない・付帯表4）。
        expect(msg.length).toBeGreaterThan(0);
        // 一覧URLに留まる（遷移しない）。
        await expect(page).toHaveURL(LIST_RE);
      });

      test("E2E-M06-11-020 選択なしでPDF用データ送信→PDF非生成(ok:false)＋一覧で選択必須エラー", async ({ page }) => {
        await login(page);
        const p = new StorePurchasePurchaseStoreReturnListPdfExportPage(page);
        await p.gotoList(); // #result_form の CSRF トークンを取得
        const token = await p.readCsrfToken();
        const res = await p.postPdf([], token); // otcBuyOrderIds 空＝選択なし
        expect(res.status()).toBe(200);
        const json = await StorePurchasePurchaseStoreReturnListPdfExportPage.readJson(res);
        // 主判定（仕様 例外処理由来）: 印刷用HTMLは生成されない（ok:false・html無し）。
        expect(json.ok).toBe(false);
        expect(json.html).toBeUndefined();
        expect(json.redirectUrl, "一覧への戻り先URLが返ること").toBeTruthy();
        // 副判定: 一覧へ戻ると選択必須エラー（locale値）がフラッシュ表示される。
        await p.gotoList();
        await expect(page.locator("body")).toContainText(ERR_NO_SELECTION);
      });

      test("E2E-M06-11-021 存在しないIDで送信→対象なしでPDF非生成(ok:false)", async ({ page }) => {
        await login(page);
        const p = new StorePurchasePurchaseStoreReturnListPdfExportPage(page);
        await p.gotoList();
        const token = await p.readCsrfToken();
        const res = await p.postPdf([NON_EXISTENT_ID], token);
        expect(res.status()).toBe(200);
        const json = await StorePurchasePurchaseStoreReturnListPdfExportPage.readJson(res);
        // 仕様 例外処理「対象なし＝エラー」由来: 印刷用HTMLは生成されず一覧へ戻る（文言はハードコードのため一致判定しない／付帯表4）。
        expect(json.ok).toBe(false);
        expect(json.html).toBeUndefined();
        expect(json.redirectUrl).toBeTruthy();
      });

      test("E2E-M06-11-026 CSRFトークン欠落でPDF用データ送信→処理されずPDF非生成（副作用なし）", async ({ page }) => {
        await login(page);
        const p = new StorePurchasePurchaseStoreReturnListPdfExportPage(page);
        await p.gotoList();
        // _token を付けずにPOST。期待は観点表 IT-15（viewpoints:422「欠落または改ざん」）由来＝処理されずPDF非生成。
        const res = await p.postPdfWithoutToken([NON_EXISTENT_ID]);
        const json = await StorePurchasePurchaseStoreReturnListPdfExportPage.readJson(res);
        // 主判定: ok:true（印刷用HTML生成＝副作用）にならない。応答形態(4xx/redirect/文言)は実装依存のため判定しない。
        expect(json.ok).not.toBe(true);
        expect(json.html).toBeUndefined();
      });
    });

    // ===== 自動化予定だが未実装/要SEED（理由付きで fixme。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M06-11-010 対象選択→戻しリストPDF実行で印刷用データ(ok:true/html)が返り印刷ポップアップが開く（要: SEED-M06-11-OTC-ELIGIBLE 棚入れ待ち/完了・単一店舗）",
      async () => {
        // 期待は仕様(プロセスフロー#4-5・入出力仕様=PDF出力)由来。ok:true/html＋別ウィンドウ生成を openPdfPopupViaUi で検証。
        // popup の document.write 後の読取はポップアップブロック/CSP依存のため実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M06-11-011 印刷ポップアップにタイトル「戻しリストPDF」と「印刷する」ボタン(#printButton)が表示される（要: SEED-M06-11-OTC-ELIGIBLE）",
      async () => {
        // 期待は仕様(レイアウト=印刷するボタン(1)・restock_list.twig:6,11-13)由来。帳票の明細内容(閾値区分・並び順・棚番)は手動。
      }
    );

    test.fixme(
      "E2E-M06-11-012 戻しリストPDF出力成功で対象が棚戻し済みになり「棚戻し未完了のみ」検索から外れる（要: SEED-M06-11-OTC-ELIGIBLE restocked未完了）",
      async () => {
        // 期待は設計md 状態・データ更新(md:35,71)由来。出力成功(ok:true)後、対象は restocked_flg=true へ更新され
        // 「棚戻し未完了のみ」(restock_incomplete_only / restockedFlg=false)の検索結果から外れることをUIで観測。
        // 実装根拠: buildPdfViewData→markOtcBuyOrdersAsRestocked（Service.php:53,63）。要 SEED-ELIGIBLE（実行ごとに restocked_flg=false）。
      }
    );

    test.fixme(
      "E2E-M06-11-013 出力失敗（エラー/CSRF不正）時は棚戻し済みに更新されず「棚戻し未完了のみ」に残る（要: SEED-M06-11-OTC-ELIGIBLE）",
      async () => {
        // 期待は設計md 例外処理(不整合を残さない)由来。失敗分岐(Controller.php:642-658)は buildPdfViewData 未到達のため
        // restocked_flg は更新されず、対象は「棚戻し未完了のみ」の検索結果に残ることをUIで観測。012 と正常×異常の対。
      }
    );

    test.fixme(
      "E2E-M06-11-022 対象外ステータスの買取を選択→エラーでPDF非生成（要: SEED-M06-11-OTC-INELIGIBLE-STATUS）",
      async () => {
        // 期待は仕様 例外処理(状態不整合＝処理対象外/エラー)由来。ok:false＋一覧リダイレクトを検証（OtcBuyOrderRestockListService.php:118-127）。
      }
    );

    test.fixme(
      "E2E-M06-11-023 複数店舗の買取を同時選択→エラーでPDF非生成（要: SEED-M06-11-OTC-MULTISHOP）",
      async () => {
        // 期待は仕様 例外処理(入力不備＝エラー)由来。複数店舗同時処理不可で ok:false＋一覧リダイレクトを検証（同Service:130-133）。
      }
    );

    test.fixme(
      "E2E-M06-11-024 権限のない店舗の買取を選択→エラーでPDF非生成（要: SEED-M06-11-OTC-NOPERM＋権限限定アカウント）",
      async () => {
        // 期待は仕様 例外処理(権限・認可)由来。権限のない店舗データは ok:false＋一覧リダイレクト（OtcBuyOrderRestockListService.php:110-116）。
      }
    );

    test.fixme(
      "E2E-M06-11-025 CSRFトークン改ざんでPDF用データ送信→処理されずPDF非生成（副作用なし）（要: SEED-M06-11-OTC-ELIGIBLE 本来出力可の対象）",
      async () => {
        // 期待は観点表 IT-15 CSRF（integration-test-viewpoints.md:422）由来:
        //   トークン改ざん/欠落時は処理が実行されず副作用（PDF生成）が起きないこと。
        // 本来出力可能な対象(SEED-ELIGIBLE)を選び、無効トークンで postPdf し、ok:true/html にならない（PDF非生成）ことを主判定にする。
        //   不正トークン時の応答形態(4xx/redirect/文言)は実装依存のため判定しない（オラクル独立性）。
      }
    );

    // E2E-M06-11-040〜044（PDF帳票の閾値区分・並び順＋二次ソート・棚番・行番号・商品名整形・基準価格・備考・実印刷＝
    // 帳票内容厳密検査）は手動のためspecに残さずケース表（付帯表1/5）で管理する（規約「手動/対象外はspecに残さない」）。
  }
);
