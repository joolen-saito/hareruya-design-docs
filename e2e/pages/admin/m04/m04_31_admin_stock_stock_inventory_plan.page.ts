import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理 棚卸計画（新規登録 / 編集 / 一覧）Page Object。
 * 納品ケース表 integration_test/e2e/m04_31_admin_stock_stock_inventory_plan_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/pf-eccube3/m04-31_admin_stock_stock_inventory_plan.md ＝ HareruyaEcプラグインのリバース詳細設計
 * ／観点表 integration-test-viewpoints.md)由来（オラクル独立性）。実装の現挙動を期待値に写さない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * ============================================================================
 * 【重要】screenExists=false ＝ 刷新先未存在（HareruyaEcプラグイン未移行）
 * ----------------------------------------------------------------------------
 * 刷新先 ec-cube-enterprise には棚卸計画の管理画面が存在しない:
 *  - Entity/Repository のみ移行: src/Eccube/Entity/DtbInventoryPlan.php /
 *    DtbInventoryPlanDetail.php / DtbInventoryPlanDetailEditHistory.php と各 Repository。
 *  - 不在: InventoryPlanController / InventoryPlanType / inventory_plan*.twig /
 *    route admin_product_inventory_plan_* / locale admin.inventory_plan.*
 *    （grep -ri inventory_plan src/Eccube/{Controller,Form,Resource} でヒット0）。
 * したがって刷新先 Twig からセレクタ（位置情報）を file:line で確定できない。
 * 本 Page Object のフィールドセレクタは「創作」ではなく、現行 pf-eccube3 HareruyaEc の
 * フォーム名 admin_product_inventory_plan・フォームキー name/memo（正本md 調査補助）からの
 * 【候補＝要実機確認】である。実装移植後に刷新先 Twig の file:line で確定すること。
 * URL は正本md「利用者視点の入口」のルート定義に基づく（移植時に同経路を想定）。
 * ============================================================================
 */
export class StockInventoryPlanPage {
  readonly page: Page;
  readonly listUrl: string; // 棚卸計画一覧
  readonly newUrl: string; // 新規登録画面

  // --- 入力フォーム（刷新先未存在・要実機確認＝候補。実装移植後に確定） ---
  // 以下は正本md（入力項目: フォームキー name/memo、利用者視点の入口: フォーム名 admin_product_inventory_plan）
  // 由来の【候補＝要実機確認】。DOM id/class の file:line 根拠は刷新先未存在のため未取得。
  readonly nameInput: Locator; // 棚卸名（候補 #admin_product_inventory_plan_name：仕様のフォーム名+キー由来）
  readonly memoTextarea: Locator; // 備考 textarea（候補 #admin_product_inventory_plan_memo：仕様のフォーム名+キー由来）
  readonly submitButton: Locator; // 登録/更新ボタン（候補 form[name="admin_product_inventory_plan"] submit：仕様のフォーム名由来）
  // 注: 名称重複エラー／フラッシュの DOM 表現（class）は仕様に記述がなく file:line 根拠も無い。
  // 下記の class セレクタは管理画面共通レイアウトの一般的慣習に基づく仮置きであり、仕様由来ではない＝実装移植後に実機で確定すること（セレクタ創作防止のため候補と明示）。
  readonly nameError: Locator; // 棚卸名フォーム直下の名称重複エラー（仕様根拠なし・要実機確認の仮置き）

  // --- 一覧・フラッシュ（刷新先未存在・要実機確認＝候補） ---
  readonly newButton: Locator; // 一覧右上の新規登録ボタン
  readonly planNameLinks: Locator; // 一覧の棚卸名リンク（→編集画面）
  readonly emptyMessage: Locator; // 0件見出し（文言は仕様 表示メッセージ由来。要素のDOMは要実機確認）
  readonly flash: Locator; // フラッシュ領域（仕様根拠なし・要実機確認の仮置き。class は実機で確定）

  // 仕様(正本md 表示メッセージ節)由来の文言。実装ロケール値をオラクル化しない。
  static readonly MSG_SAVE_COMPLETE = "棚卸計画を登録しました。";
  static readonly MSG_SAVE_FAILED = "棚卸計画を登録できませんでした。";
  static readonly MSG_NAME_DUPLICATED = "この棚卸名は既に使用されています。";
  static readonly MSG_ALREADY_REFLECTED = "在庫反映済みのため、更新できません。";
  static readonly MSG_EMPTY = "棚卸計画データがありません。";

  constructor(page: Page) {
    this.page = page;
    // 正本md「利用者視点の入口」: 一覧 POST/GET .../product/inventory_plan/search/{page_no}、新規 GET .../product/inventory_plan/new
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/product/inventory_plan/search/1`;
    this.newUrl = `/${ECCUBE_ADMIN_ROUTE}/product/inventory_plan/new`;

    // 以下は刷新先未存在につき【要実機確認の候補】。移植後に Twig file:line で確定する。
    this.nameInput = page.locator("#admin_product_inventory_plan_name");
    this.memoTextarea = page.locator("#admin_product_inventory_plan_memo");
    this.submitButton = page.locator(
      'form[name="admin_product_inventory_plan"] button[type="submit"]'
    );
    // 仕様根拠なし・要実機確認の仮置き（セレクタ創作防止のため移植後に実機で確定）。
    this.nameError = page.locator("[data-inventory-plan-name-error]");

    this.newButton = page.getByRole("link", { name: /新規登録|新規作成/ });
    this.planNameLinks = page.locator('a[href*="/product/inventory_plan/"]');
    this.emptyMessage = page.getByText(StockInventoryPlanPage.MSG_EMPTY);
    // 仕様根拠なし・要実機確認の仮置き（移植後に実機で確定）。
    this.flash = page.locator("[data-flash]");
  }

  /** 編集画面URL（GET .../product/inventory_plan/{id}）。 */
  editUrl(id: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/inventory_plan/${id}`;
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }
  async gotoNew() {
    await this.page.goto(this.newUrl);
  }
  async gotoEdit(id: number | string) {
    await this.page.goto(this.editUrl(id));
  }

  /** 棚卸名・備考を入力して登録/更新を送信する（新規・編集 共通）。 */
  async submitForm(name: string, memo = "") {
    await this.nameInput.fill(name);
    await this.memoTextarea.fill(memo);
    await this.submitButton.click();
  }

  /** 新規登録画面のUI部品が仕様どおり表示されること（実装移植後に有効）。 */
  async seeNewForm() {
    await expect(this.nameInput).toBeVisible();
    await expect(this.memoTextarea).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }
}
