/**
 * 管理画面 店舗設定（基本情報）店舗一覧（モール／テナント店舗一覧） E2E。
 * 納品ケース表 integration_test/e2e/m10_14_admin_base_setting_setting_shop_mall_shop_list_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装する（手動/対象外・間接はケース表で全量管理＝specに大量fixmeを残さない）。
 * 期待結果は仕様(functions/ec-cube-enterprise/m10-14_admin_base_setting_setting_shop_mall_shop_list.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行方針（安全第一・共有ステージング）:
 *  - 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 検索一致・行操作・モーダル系は既知テナント（SEED-M10-14-TENANT）が要る。TENANT_SHOP_ID/NAME 未設定時は skip。
 *  - 論理削除（016/017）は dtb_base_info.tenant_status を「削除」へ更新する破壊的操作。使い捨て専用テナント
 *    （SEED-M10-14-DELETABLE / TENANT_DELETE_ID）でのみ実行する。論理削除は物理削除ではなく行は一覧に残る。
 *  - CSRFトークン不正・Ajax一部失敗/success:false・検索条件セッション内部値・モールルート除外のDB確認は手動/対象外（ケース表で管理）。
 *
 * シード/資格情報（環境変数。コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）
 *  - TENANT_SHOP_ID   : 既知テナントの店舗ID（検索ID一致・行操作・店舗詳細遷移に使用）
 *  - TENANT_SHOP_NAME : 既知テナントの店舗名（店舗名LIKE一致の検索に使用）
 *  - TENANT_DELETE_ID : 論理削除してよい使い捨てテナントの店舗ID（破壊的）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { BaseSettingSettingShopMallShopListPage } from "../../../pages/admin/m10/m10_14_admin_base_setting_setting_shop_mall_shop_list.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const TENANT_SHOP_ID = process.env.TENANT_SHOP_ID || "";
const TENANT_SHOP_NAME = process.env.TENANT_SHOP_NAME || "";
const HAS_TENANT = !!(HAS_CREDS && TENANT_SHOP_ID && TENANT_SHOP_NAME);

const TENANT_DELETE_ID = process.env.TENANT_DELETE_ID || "";
const HAS_DELETABLE = !!(HAS_CREDS && TENANT_DELETE_ID);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const TITLE = "店舗一覧"; // :3628 enterprise.admin.shop.mall.shop_list
// 設計書上の小見出し用語は「基本情報」。実装ロケールは「基本情報設定」だが
// 実装ラベルを完全一致オラクル化せず、設計書用語の部分一致で観測する（付帯表4#1・オラクル独立性）。
const SUB_TITLE = "基本情報"; // 設計書用語（部分一致）。impl: admin.setting.basic_info「基本情報設定」:2773
const NO_RESULT = "検索条件に合致するデータが見つかりませんでした"; // :1542 admin.common.search_no_result
const DELETE_CONFIRM_TITLE = "店舗を削除します"; // :3663 logical_delete_delete__confirm_title
const DELETE_CONFIRM_MSG = "店舗を削除してよろしいですか？"; // :3664 logical_delete_delete__confirm_message
const DELETE_COMPLETE = "削除しました"; // :1400 admin.common.delete_complete

const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/mall/tenant(\\?|/|$)`);
const DETAIL_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/mall/tenant/detail/\\d+`
);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 > 店舗設定 > 基本情報 > 店舗一覧",
  { tag: ["@admin", "@setting"] },
  () => {
    // ===== 認証不要・非破壊 =====

    test("E2E-M10-14-018 未ログインで店舗一覧URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/mall/tenant`);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 一覧初期表示・UI部品（SEED-M10-14-BASE・非破壊） =====

    test("E2E-M10-14-001 一覧表示でページタイトル「店舗一覧」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new BaseSettingSettingShopMallShopListPage(page);
      await list.goto();
      await expect(list.pageTitle).toContainText(TITLE);
    });

    test("E2E-M10-14-002 検索欄と検索ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new BaseSettingSettingShopMallShopListPage(page);
      await list.goto();
      await expect(list.searchInput).toBeVisible();
      await expect(list.searchButton).toBeVisible();
    });

    test("E2E-M10-14-003 サブタイトル「基本情報設定」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new BaseSettingSettingShopMallShopListPage(page);
      await list.goto();
      await expect(list.subTitle).toContainText(SUB_TITLE);
    });

    test("E2E-M10-14-010 一覧テーブルの列見出し（ID/店名/会社名/公開/開店）が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_TENANT, "SEED-M10-14-TENANT 未設定（TENANT_SHOP_ID/NAME）");
      await login(page);
      const list = new BaseSettingSettingShopMallShopListPage(page);
      await list.goto();
      // 仕様(フロント挙動): 一覧列は 店舗ID・店舗名・会社名・公開フラグ・開店フラグ。
      const thead = page.locator("table.table thead");
      await expect(thead).toContainText("ID");
      await expect(thead).toContainText("店名");
      await expect(thead).toContainText("会社名");
      await expect(thead).toContainText("公開");
      await expect(thead).toContainText("開店");
    });

    // ===== 検索（SEED-M10-14-TENANT・非破壊） =====

    test("E2E-M10-14-004 店舗名で検索すると該当店舗が一覧に含まれる", async ({ page }) => {
      test.skip(!HAS_TENANT, "SEED-M10-14-TENANT 未設定");
      await login(page);
      const list = new BaseSettingSettingShopMallShopListPage(page);
      await list.goto();
      await list.search(TENANT_SHOP_NAME);
      // 仕様(判定順序#3 店舗名LIKE): 該当店舗の行が結果に出ること。
      await expect(list.rowById(TENANT_SHOP_ID)).toBeVisible();
    });

    test("E2E-M10-14-005 検索後に「検索結果：N件が該当しました」が表示される", async ({ page }) => {
      test.skip(!HAS_TENANT, "SEED-M10-14-TENANT 未設定");
      await login(page);
      const list = new BaseSettingSettingShopMallShopListPage(page);
      await list.goto();
      await list.search(TENANT_SHOP_NAME);
      // 仕様(フロント挙動): 検索後にのみ件数表示。文言は admin.common.search_result 由来。
      await expect(list.searchResultCount).toContainText("検索結果");
      await expect(list.searchResultCount).toContainText("件が該当しました");
    });

    test("E2E-M10-14-006 店舗ID（桁のみ）で検索すると該当店舗が一覧に含まれる", async ({ page }) => {
      test.skip(!HAS_TENANT, "SEED-M10-14-TENANT 未設定");
      await login(page);
      const list = new BaseSettingSettingShopMallShopListPage(page);
      await list.goto();
      // 仕様(判定順序#2): 桁のみ入力はID等価条件として束ねられる（OR 店舗名LIKE）。
      await list.search(String(TENANT_SHOP_ID));
      await expect(list.rowById(TENANT_SHOP_ID)).toBeVisible();
    });

    test("E2E-M10-14-007 英字を含む語で検索しても処理が継続し検索値が保持される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new BaseSettingSettingShopMallShopListPage(page);
      await list.goto();
      // 仕様(エッジケース 設計書:180): 英字を含む入力は桁パターン非該当でID側null、店舗名LIKEのみ。
      // 検索テキストは必須でなく、エラーにならず処理継続（検索値が再表示で保持される）。
      // 英字を含むことを保証するため固定の英字語を入力（一致は不問・継続の確認が目的）。
      const ALPHA_SEARCH = "AbcStore"; // 入力データ（英字を含む任意語・一致不要）
      await list.search(ALPHA_SEARCH);
      // エラーにならず処理継続: 検索フォームが再描画され入力値が保持される。
      await expect(list.searchInput).toHaveValue(ALPHA_SEARCH);
      await expect(list.searchButton).toBeVisible();
    });

    test("E2E-M10-14-008 該当ゼロの語で検索すると「検索条件に合致するデータが見つかりませんでした」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new BaseSettingSettingShopMallShopListPage(page);
      await list.goto();
      // 仕様(エッジケース 検索結果ゼロ): 共通メッセージと案内を表示し、一括削除UIは構築されない。
      await list.search("e2e-no-such-tenant-zzz-0000");
      await expect(page.locator("body")).toContainText(NO_RESULT);
    });

    // ===== 画面遷移・ページング =====

    test("E2E-M10-14-009 店舗名リンク押下で店舗詳細編集へ遷移する", async ({ page }) => {
      test.skip(!HAS_TENANT, "SEED-M10-14-TENANT 未設定");
      await login(page);
      const list = new BaseSettingSettingShopMallShopListPage(page);
      await list.goto();
      await list.search(TENANT_SHOP_NAME);
      // 仕様(画面遷移): 店舗名リンク→店舗詳細編集。
      await list.rowById(TENANT_SHOP_ID).locator("a").first().click();
      await expect(page).toHaveURL(DETAIL_RE);
    });

    test("E2E-M10-14-014 表示件数プルダウン変更で件数付きURLの同一一覧へ遷移する", async ({ page }) => {
      test.skip(!HAS_TENANT, "SEED-M10-14-TENANT 未設定");
      await login(page);
      const list = new BaseSettingSettingShopMallShopListPage(page);
      await list.goto();
      // 仕様(JS挙動/画面遷移): プルダウン変更で page_count を付けた一覧へGET遷移、ページは1。
      await expect(list.pageCountPulldown).toBeVisible();
      const options = list.pageCountPulldown.locator("option");
      const targetValue = await options.last().getAttribute("value");
      await list.pageCountPulldown.selectOption(targetValue || "");
      await expect(page).toHaveURL(LIST_RE);
      await expect(page).toHaveURL(/page_count=/);
    });

    test("E2E-M10-14-015 ページ送りGET（/page/{n}）で一覧が再表示される", async ({ page }) => {
      test.skip(!HAS_TENANT, "SEED-M10-14-TENANT 未設定");
      await login(page);
      const list = new BaseSettingSettingShopMallShopListPage(page);
      await list.goto();
      // 仕様(処理フロー GETページパラメタ): page_no でセッション検索条件を復元して再クエリ・再表示。
      await list.gotoPage(1);
      await expect(page).toHaveURL(LIST_RE);
      await expect(list.searchInput).toBeVisible();
    });

    // ===== 一括削除UI・確認モーダル（SEED-M10-14-TENANT・モーダル開閉は非破壊） =====

    test("E2E-M10-14-011 行チェックで一括操作ツールバーが表示される", async ({ page }) => {
      test.skip(!HAS_TENANT, "SEED-M10-14-TENANT 未設定");
      await login(page);
      const list = new BaseSettingSettingShopMallShopListPage(page);
      await list.goto();
      await list.search(TENANT_SHOP_NAME);
      // 仕様(フロント挙動): チェック状態に応じ一括ツールバー表示。
      await expect(list.bulkToolbar).toHaveClass(/d-none/);
      await list.checkRow(TENANT_SHOP_ID);
      await expect(list.bulkToolbar).not.toHaveClass(/d-none/);
    });

    test("E2E-M10-14-012 一括削除モーダルに確認タイトル「店舗を削除します」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_TENANT, "SEED-M10-14-TENANT 未設定");
      await login(page);
      const list = new BaseSettingSettingShopMallShopListPage(page);
      await list.goto();
      await list.search(TENANT_SHOP_NAME);
      await list.openDeleteModal(TENANT_SHOP_ID);
      await expect(list.deleteModalTitle).toContainText(DELETE_CONFIRM_TITLE);
    });

    test("E2E-M10-14-013 一括削除モーダルに確認メッセージが表示される", async ({ page }) => {
      test.skip(!HAS_TENANT, "SEED-M10-14-TENANT 未設定");
      await login(page);
      const list = new BaseSettingSettingShopMallShopListPage(page);
      await list.goto();
      await list.search(TENANT_SHOP_NAME);
      await list.openDeleteModal(TENANT_SHOP_ID);
      await expect(list.deleteModal).toContainText(DELETE_CONFIRM_MSG);
    });

    // ===== 論理削除（破壊的・SEED-M10-14-DELETABLE） =====

    test("E2E-M10-14-016 論理削除DELETEで success:true と完了メッセージのJSONが返る", async ({
      page,
    }) => {
      test.skip(!HAS_DELETABLE, "SEED-M10-14-DELETABLE 未設定（TENANT_DELETE_ID）");
      await login(page);
      const list = new BaseSettingSettingShopMallShopListPage(page);
      const res = await list.deleteViaApi(TENANT_DELETE_ID);
      // 仕様(処理フロー 論理削除): success:true と翻訳済み完了文言をJSONで返す。
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.message).toContain(DELETE_COMPLETE);
    });

    test("E2E-M10-14-017 論理削除後も対象行が一覧に残る（tenant_statusで除外しない）", async ({
      page,
    }) => {
      test.skip(!HAS_DELETABLE, "SEED-M10-14-DELETABLE 未設定");
      await login(page);
      const list = new BaseSettingSettingShopMallShopListPage(page);
      await list.deleteViaApi(TENANT_DELETE_ID);
      // 仕様(データ整合性/エッジケース): 論理削除はステータス更新のみ。標準一覧クエリは除外しないため行は残る。
      await list.goto();
      await expect(list.rowById(TENANT_DELETE_ID)).toBeVisible();
    });

    // ===== 検索バリデーション・セッション復元/リセット =====

    test("E2E-M10-14-019 検索テキスト空のまま検索POSTしてもエラーにならず一覧が再表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new BaseSettingSettingShopMallShopListPage(page);
      await list.goto();
      // 仕様(バリデーション/入力項目): 検索テキストは任意。空入力POSTでもエラーにならず処理継続し再表示。
      await list.search("");
      await expect(list.pageTitle).toContainText(TITLE);
      await expect(list.searchInput).toBeVisible();
      await expect(list.searchButton).toBeVisible();
    });

    test("E2E-M10-14-020 検索後に一覧基底URLへ再訪すると検索条件がリセットされる", async ({ page }) => {
      test.skip(!HAS_TENANT, "SEED-M10-14-TENANT 未設定");
      await login(page);
      const list = new BaseSettingSettingShopMallShopListPage(page);
      await list.goto();
      await list.search(TENANT_SHOP_NAME);
      await expect(list.searchInput).toHaveValue(TENANT_SHOP_NAME);
      // 仕様(処理フロー 初期GET): 基底URL再訪はフォーム既定で上書きリセットし前回検索状態を消す。
      await list.goto();
      await expect(list.searchInput).toHaveValue("");
    });

    test("E2E-M10-14-021 resume付きGETで直前の検索条件が復元される", async ({ page }) => {
      test.skip(!HAS_TENANT, "SEED-M10-14-TENANT 未設定");
      await login(page);
      const list = new BaseSettingSettingShopMallShopListPage(page);
      await list.goto();
      await list.search(TENANT_SHOP_NAME);
      // 仕様(処理フロー resume復元/セッション): resume付きGETはセッション検索条件を復元しフォームへ再セット。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/mall/tenant?resume=1`);
      await expect(list.searchInput).toHaveValue(TENANT_SHOP_NAME);
    });

    test("E2E-M10-14-022 一覧行に会社名・公開状態・開店状態が表示される", async ({ page }) => {
      test.skip(!HAS_TENANT, "SEED-M10-14-TENANT 未設定");
      await login(page);
      const list = new BaseSettingSettingShopMallShopListPage(page);
      await list.goto();
      await list.search(TENANT_SHOP_NAME);
      // 仕様(フロント挙動 表示要素): 行は会社名・公開／非公開・開店／閉店の翻訳表示を持つ。
      const row = list.rowById(TENANT_SHOP_ID);
      await expect(row).toBeVisible();
      await expect(row).toContainText(/公開|非公開/);
      await expect(row).toContainText(/開店|閉店/);
    });

    // ===== 手動/対象外（ケース表で全量管理。自動再現が高コスト/観測不能なため未実装） =====

    test.fixme(
      "E2E-M10-14-040 検索POSTのCSRFトークン不正→検索エラー状態で再表示（要: トークン改ざんの安定再現）",
      async () => {
        // 期待は仕様(利用者視点の入口 POST/CSRF・エラー処理 has_errors)由来。改ざん手順を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M10-14-041 Ajax DELETE一部失敗→モーダル内エラーリストへ追記（要: 失敗応答/ネットワーク失敗の注入）",
      async () => {
        // 期待は仕様(エラー処理 Ajax DELETE異常応答)由来。失敗注入の手段を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M10-14-042 Ajax DELETE が success:false→当該行のみエラー追記・他行は成功扱い（要: success:false 応答の生成）",
      async () => {
        // 期待は仕様(エラー処理 JSON success false)由来。応答制御の手段を実機確認後に実装。
      }
    );
  }
);
