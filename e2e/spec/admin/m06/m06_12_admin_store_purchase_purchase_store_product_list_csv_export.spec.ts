/**
 * 管理画面 店頭買取管理「買取商品一覧CSV出力」E2E（M06-12）。
 * 納品ケース表 integration_test/e2e/m06_12_admin_store_purchase_purchase_store_product_list_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化（実装済み）」と「自動化予定だが未実装/要SEED・要実機（test.fixme・理由付き）」のみ残す。
 * 手動（CSV各列の値）・手動/間接（DB副作用なし=参照系）・対象外（CSRF/ログ/DB検索厳密一致）はケース表で全量管理する
 * （規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/.../m06-12_...md の 例外処理・プロセスフロー・入出力仕様 ＋ Excel原典 買取商品一覧CSV 9列)由来
 * （オラクル独立性）。実装の現挙動・Form制約・Cookie名は期待値に流用しない。選択必須エラー文言は
 * locale(messages.ja.yaml:5247)由来で照合可。
 *
 * 刷新先 ec-cube-enterprise に当該機能が存在することを確認済み:
 *   起点 route admin_otcbuyorder = /<route>/otcbuyorder（OtcBuyOrderController.php:90-104）/ 買取商品一覧CSVリンク index.twig:185。
 *   出力 route admin_otcbuyorder_export = POST /<route>/otcbuyorder/export（OtcBuyOrderController.php:162-168、export_type=otc_buy_order_product_list）。
 * 戻しリストCSV(M06-10)と異なり追加validationは無く、入口ガードは「選択0件＝選択必須エラー」のみ。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(030)は資格情報不要。ダウンロード本体(010-012)はSEED（付帯表3）が要るため fixme。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StorePurchasePurchaseStoreProductListCsvExportPage } from "../../../pages/admin/m06/m06_12_admin_store_purchase_purchase_store_product_list_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 一覧URL（/export 等の下位ルートを巻き込まないよう末尾/ページング/クエリで限定）。
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder(/page/\\d+)?(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;
// 選択必須エラー（messages.ja.yaml:5247 admin.purchase.online.csv_export.no_selection）。仕様参照のlocale値であり実装定数の写しではない。
const ERR_NO_SELECTION = "1つ以上の買取注文情報を選択してください。";

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 店頭買取管理 > 買取商品一覧CSV出力",
  { tag: ["@admin", "@store_purchase", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M06-12-030 未ログインで買取一覧URL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new StorePurchasePurchaseStoreProductListCsvExportPage(page);
      await p.gotoList();
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M06-12-031 未ログインで出力POSTを送るとCSV非出力で管理ログインへ誘導", async ({ page }) => {
      const p = new StorePurchasePurchaseStoreProductListCsvExportPage(page);
      // 権限/認可（仕様由来）: 出力POSTの入口も未ログインはガードされCSVは出力されず管理ログインへ誘導される。
      // 未認証ゆえトークン未取得（空）で送信。期待値は実装のステータス/Cookie名に依存させない。
      const res = await p.postExport([1], "");
      // 主判定: CSV添付（octet-stream/attachment）は出力されない。
      expect(
        StorePurchasePurchaseStoreProductListCsvExportPage.isCsvAttachment(res)
      ).toBe(false);
      // 副判定: リダイレクト追従後の最終URLが管理ログイン。
      expect(res.url()).toMatch(LOGIN_RE);
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M06-12-001 買取一覧（買取商品一覧CSV出力の起点）が表示される", async ({ page }) => {
        await login(page);
        const p = new StorePurchasePurchaseStoreProductListCsvExportPage(page);
        await p.gotoList();
        await expect(page).toHaveURL(LIST_RE);
        await p.seeListScreen();
      });

      test("E2E-M06-12-002 検索実行で買取一覧に留まり結果セクションが評価される", async ({ page }) => {
        await login(page);
        const p = new StorePurchasePurchaseStoreProductListCsvExportPage(page);
        await p.runSearch();
        // 検索後も一覧URLに留まること（結果有無はSEED依存。結果ありなら #result_list 表示／0件なら見出し表示）。
        await expect(page).toHaveURL(LIST_RE);
      });

      test("E2E-M06-12-003 検索結果があるとCSVメニューに「買取商品一覧CSV」が表示される", async ({ page }) => {
        await login(page);
        const p = new StorePurchasePurchaseStoreProductListCsvExportPage(page);
        await p.runSearch();
        // 結果0件ではメニュー自体が出ない（pagination 条件）のが正のため skip し偽陽性を避ける（SEED-M06-12-OTC 投入後に検証）。
        test.skip(
          !(await p.hasResults()),
          "店頭買取データ未投入（SEED-M06-12-OTC）のため検索結果0件＝メニュー非表示が正。seed投入後に検証する"
        );
        await p.openCsvMenu();
        await expect(p.productListCsvLink).toBeVisible();
      });

      test("E2E-M06-12-020 選択なしで買取商品一覧CSV送信→選択必須エラーでCSV非出力", async ({ page }) => {
        await login(page);
        const p = new StorePurchasePurchaseStoreProductListCsvExportPage(page);
        await p.gotoList(); // #result_form の CSRF トークンを取得（常時レンダリング）
        const token = await p.readCsrfToken();
        const res = await p.postExport([], token); // otcBuyOrderIds 空＝選択なし
        expect(res.status()).toBe(200);
        // 主判定（仕様 例外処理由来）: CSV添付(octet-stream/attachment)は出力されない。
        expect(
          StorePurchasePurchaseStoreProductListCsvExportPage.isCsvAttachment(res)
        ).toBe(false);
        // 副判定: 一覧へ戻り選択必須エラー（locale値）が表示される。
        expect(await res.text()).toContain(ERR_NO_SELECTION);
      });

      test("E2E-M06-12-022 無効なexport_typeで送信→CSV非出力（入力不備ガード）", async ({ page }) => {
        await login(page);
        const p = new StorePurchasePurchaseStoreProductListCsvExportPage(page);
        await p.gotoList();
        const token = await p.readCsrfToken();
        // 仕様 例外処理(入力不備＝エラー処理し出力対象を確定しない)由来。export_type を不正値へ改ざんして送信。
        const res = await p.postExport([1], token, "invalid_export_type");
        // 主判定: CSV添付は出力されない（実装は InvalidArgumentException を投げるため非2xx想定だが、合否はCSV非出力で判定）。
        expect(
          StorePurchasePurchaseStoreProductListCsvExportPage.isCsvAttachment(res)
        ).toBe(false);
      });

      test("E2E-M06-12-023 認証済みで不正CSRFトークン送信→CSV非出力（トークン検証失敗分岐）", async ({ page }) => {
        await login(page);
        const p = new StorePurchasePurchaseStoreProductListCsvExportPage(page);
        await p.gotoList();
        // 仕様 判定条件(共通:トークン検証)由来。export() 冒頭の isTokenValid() は export_type/選択件数の検証より前に実行される。
        // 正規トークンを取得せず不正値へ改ざんして送信（認証済みコンテキストでのCSRF失敗を再現）。
        const res = await p.postExport([1], "invalid_csrf_token");
        // 主判定: トークン検証失敗で出力対象を確定せずCSV添付(octet-stream/attachment)は出力されない。
        // 合否はCSV非出力で判定し、HTTPステータス/Cookie名は実装依存のためオラクル化しない。
        expect(
          StorePurchasePurchaseStoreProductListCsvExportPage.isCsvAttachment(res)
        ).toBe(false);
      });
    });

    // ===== 自動化予定だが未実装/要SEED・要実機（理由付きで fixme。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M06-12-010 対象選択→買取商品一覧CSV実行でダウンロード発火（要: SEED-M06-12-OTC 店頭買取データ）",
      async () => {
        // 期待は仕様(プロセスフロー#4-5・入出力仕様=CSVダウンロード)由来。selectFirstRow→exportProductListCsvViaUi でダウンロードイベントを待つ。
      }
    );

    test.fixme(
      "E2E-M06-12-011 ダウンロードファイル名が otc_buy_order_product_list_<日時>.csv（要: SEED-M06-12-OTC）",
      async () => {
        // 期待はファイル名形式 /^otc_buy_order_product_list_\d{14}\.csv$/（仕様=CSV出力。日時は動的のため正規表現で判定）。
      }
    );

    test.fixme(
      "E2E-M06-12-012 エクスポート応答が octet-stream/attachment の200を返す（要: SEED-M06-12-OTC の対象ID）",
      async () => {
        // 期待は仕様(入出力仕様=CSVダウンロード)由来。既知の対象IDで postExport→isCsvAttachment=true・status 200 を検証。
      }
    );

    test.fixme(
      "E2E-M06-12-021 存在しないIDのみ選択→対象なしの扱い（空CSV/エラー）を確認（要: 実機で扱い確定）",
      async () => {
        // 期待は仕様 例外処理(対象なし＝空CSVまたはエラー、扱いは実装に従う)由来。product_list は追加validationが無く
        // 空データでもヘッダのみCSVが出力され得るため、空CSV出力かエラー非出力かを実機で確定後に判定する（付帯表4）。
      }
    );

    // 手動はspecに残さずケース表（付帯表1/2/5）で管理する（規約「手動/対象外はspecに残さない」）:
    //   040/041（CSV各列の値・空出力条件）・042（キャンセル済み除外）・043（ヘッダ列順/形式）・
    //   044（件数/出力順）・045（出力前後でDB不変＝参照系）はCSV内容/DB照合を要し手動・手動/間接。
    // 対象外: ログ出力抑止(IT-20)・更新内容(IT-26=本機能は参照系で更新なし)・DB検索条件厳密一致(IT-23 委譲)。
    // CSRF(IT-15)は 023 で自動化（不正トークン→CSV非出力）。
  }
);
