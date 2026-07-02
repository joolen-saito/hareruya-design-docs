import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 データ管理 > 買取価格対応表（編集） Page Object（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m16_07_admin_data_data_buy_price_list_edit_e2e_cases.md に対応。
 * 期待結果は仕様（正本 functions/pf-eccube3/m16-07_admin_data_data_buy_price_list_edit.md／観点表／基本設計）由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`buy_price_list_edit`（BuyPriceListEditType 既定／name override なし）由来の位置情報のみ。
 *   - price → #buy_price_list_edit_price（buy_price_list_edit.twig:66-68 label for=form.price.vars.id）
 *   - CSRFトークン → #buy_price_list_edit__token（同フォーム既定）
 * pf-eccube3 リバース設計と刷新先 ec-cube-enterprise の乖離（URLパス /data/.../edit・/update、フォームprefix名、
 * タイトル/サブタイトルの割当、価格の GreaterThanOrEqual(0) 制約、戻るが<a>リンク）はケース表「付帯表4」に記録し、
 * テストは仕様どおりに書く（実装が違えば落ちて検出する）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 */
export class DataDataBuyPriceListEditPage {
  readonly page: Page;
  readonly listUrl: string; // 一覧（戻り先・更新成功リダイレクト先）

  readonly priceInput: Locator; // 買取価格(円)入力欄
  readonly updateButton: Locator; // 「更新」(type=submit)
  readonly backLink: Locator; // 「戻る」(enterpriseは<a>リンク。設計はtype=button)
  readonly requiredBadge: Locator; // 必須バッジ
  readonly idTable: Locator; // 識別情報の表（NM価格/カード状態/Foil）
  readonly priceError: Locator; // form_errors(form.price) 出力（要実機確認：厳密セレクタ）
  readonly amountCellLink: Locator; // 一覧の金額セルリンク（編集への入口）
  readonly pageTitle: Locator; // 画面タイトル（仕様=「買取価格対応表」）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/data/buy_price_list`;

    // buy_price_list_edit.twig:66-68（label for=form.price.vars.id → id=buy_price_list_edit_price）
    this.priceInput = page.locator("#buy_price_list_edit_price");
    // buy_price_list_edit.twig:78（admin.common.update=「更新」 messages.ja.yaml:1435）
    this.updateButton = page.getByRole("button", { name: "更新" });
    // buy_price_list_edit.twig:79（admin.common.back=「戻る」 messages.ja.yaml:1464）
    this.backLink = page.getByRole("link", { name: "戻る" });
    // buy_price_list_edit.twig:66（admin.common.required=「必須」 messages.ja.yaml:1528）
    this.requiredBadge = page.locator(".badge", { hasText: "必須" });
    // buy_price_list_edit.twig:48（識別表 thead: NM価格/カード状態/Foil）
    this.idTable = page.locator(".buy-price-edit-table");
    // form_errors(form.price)（buy_price_list_edit.twig:69）。EC-CUBE標準は .invalid-feedback。厳密は要実機確認。
    this.priceError = page.locator(".invalid-feedback, .form-error-message, .text-danger");
    // 一覧 buy_price_list.twig:73（金額セル <a href=path('admin_data_buy_price_list_edit',{id})>）
    this.amountCellLink = page.locator(
      `a[href*="/data/buy_price_list/"][href*="/edit"]`
    );
    // 仕様（フロント挙動・表示要素）: 画面タイトルは「買取価格対応表」。
    // CSS創作を避けテキスト一致で取得（実装は結合「買取価格対応表編集」だが部分一致で仕様意味を満たす・付帯表4#3）。
    this.pageTitle = page.getByText("買取価格対応表", { exact: false }).first();
  }

  /** 一覧（買取価格対応表）を開く。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 編集画面を id 指定で直接開く（404確認・直接アクセス用）。 */
  async gotoEdit(id: string | number) {
    return this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/data/buy_price_list/${id}/edit`);
  }

  /** 一覧の先頭の金額セルリンクから編集画面へ遷移する（利用者視点の入口）。 */
  async openEditFromList() {
    await this.gotoList();
    await this.amountCellLink.first().click();
  }

  /** 買取価格を入力して「更新」を押す。 */
  async update(price: string) {
    await this.priceInput.fill(price);
    await this.updateButton.click();
  }

  /** 編集画面のUI部品（識別表・買取価格欄・更新/戻る）が仕様どおり表示されること。 */
  async seeEditForm() {
    await expect(this.idTable).toBeVisible();
    await expect(this.priceInput).toBeVisible();
    await expect(this.updateButton).toBeVisible();
    await expect(this.backLink).toBeVisible();
  }
}
