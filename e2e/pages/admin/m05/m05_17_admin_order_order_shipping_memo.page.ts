import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注管理 配達用メモ登録（出荷用メモ欄）（M05-17）Page Object。
 * 納品ケース表 integration_test/e2e/m05_17_admin_order_order_shipping_memo_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/ec-cube-enterprise/m05-17_admin_order_order_shipping_memo.md / 観点表)由来（オラクル独立性）。
 * 本機能は標準機能のため ec-cube-enterprise を正典とし、刷新先に受注編集(admin_order_edit/admin_order_new)・
 * 出荷編集(admin_shipping_edit)が実在することを確認してセレクタを導出した。
 * セレクタは Twig＋Symfony Form の getBlockPrefix 由来の位置情報のみ。合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * DOM id / セレクタ根拠:
 *  ◆受注編集フォーム（/order/{id}/edit, /order/new。OrderType getBlockPrefix=`order`(OrderType.php:380)
 *    ＋サブフォーム `Shipping`(OrderType.php:458)＋ShippingType field `note`(ShippingType.php:212)）
 *   - 出荷用メモ欄 → #order_Shipping_note（edit.twig:1771 form_widget(form.Shipping.note)）
 *   - ラベル「出荷用メモ欄」trans admin.order.shop_memo_for_shipped（edit.twig:1769 / messages.ja.yaml:2353）
 *   - ツールチップ title trans tooltip.order.shipping_info.shop_memo（edit.twig:1769 / messages.ja.yaml:3418）
 *   - 出荷情報 card-title trans admin.order.shipping_info（edit.twig:1576 / messages.ja.yaml:2347）
 *   - 複数お届け先分岐 {% if Order.isMultiple %}（edit.twig:1583 / else:1599 / endif:1777）
 *     複数時の導線「お届け先を編集」trans admin.order.edit_multiple_shipping（edit.twig:1587 / messages.ja.yaml:2388）
 *   - 登録ボタン「受注情報を登録」name=mode value=register（edit.twig:1265,1883 / admin.order.register_order messages.ja.yaml:5540）
 *   - 項目エラー → form_errors(form.Shipping.note)（edit.twig:1772。出力クラスは要実機確認のため本文/非保存で確認）
 *  ◆出荷編集フォーム（/shipping/{id}/edit。createBuilder()＋コレクション `shippings`(ShippingController.php:88, ShippingType)）
 *   - 出荷用メモ欄 → #form_shippings_0_note（shipping.twig:689 form_widget(shippingForm.note, {rows:8})。
 *     id 接頭辞 form_shippings_{N}_ はテンプレJS shipping.twig:30 formIdPrefix で確認＝要実機確認）
 *   - ラベル「出荷用メモ欄」trans admin.order.shop_memo_for_shipped（shipping.twig:686）
 *   - 登録ボタン → #btn_save name=mode value=register「登録」trans admin.common.registration（shipping.twig:724 / messages.ja.yaml:1436）
 *  ◆成功フラッシュ「保存しました」trans admin.order.save.complete(messages.ja.yaml:2414, EditController.php:914) /
 *    admin.common.save_complete(messages.ja.yaml:1398, ShippingController.php:196)
 */
export class OrderOrderShippingMemoPage {
  readonly page: Page;

  // 受注編集フォーム（出荷1件時）
  readonly orderShippingNote: Locator; // #order_Shipping_note
  readonly orderRegisterButton: Locator; // 「受注情報を登録」name=mode value=register（可視のものに限定）
  readonly editMultipleLink: Locator; // 「お届け先を編集」リンク（複数お届け先時）

  // 出荷編集フォーム（出荷ごと）
  readonly shippingSaveButton: Locator; // #btn_save

  // 共通
  readonly saveComplete: Locator; // 「保存しました」フラッシュ
  readonly validationError: Locator; // 項目検証エラー（出力クラスは要実機確認 不具合候補#2）

  constructor(page: Page) {
    this.page = page;

    this.orderShippingNote = page.locator("#order_Shipping_note");
    // 編集画面には submit が複数あるため登録ボタン（name=mode value=register）の可視要素に限定する。
    this.orderRegisterButton = page
      .locator('button[type="submit"][name="mode"][value="register"]:visible')
      .first();
    this.editMultipleLink = page.getByRole("link", { name: "お届け先を編集" });

    this.shippingSaveButton = page.locator("#btn_save");

    this.saveComplete = page.getByText("保存しました");
    // form_errors の出力クラスは Twig レンダリング依存で未確定。専用セレクタを創作せず、Bootstrap 標準の
    // 検証エラークラスを可視要素に限定して許容的に拾う（合否は仕様＝超過は保存しない・項目エラー表示で判定）。
    this.validationError = page.locator(".invalid-feedback:visible, .text-danger:visible");
  }

  /** 受注編集URLへ直接アクセス（既存受注）。 */
  async gotoOrderEdit(id: number | string) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/order/${id}/edit`);
  }

  /** 受注新規登録画面へアクセス。 */
  async gotoOrderNew() {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/order/new`);
  }

  /** 出荷編集URLへ直接アクセス（{id}=受注の識別子）。 */
  async gotoShippingEdit(orderId: number | string) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/shipping/${orderId}/edit`);
  }

  /** N番目の出荷ブロックの出荷用メモ欄（既定は先頭）。 */
  shippingNote(index = 0): Locator {
    return this.page.locator(`#form_shippings_${index}_note`);
  }

  /** 受注編集の出荷用メモ欄へ入力し「受注情報を登録」を押下する。 */
  async fillAndSaveOrderNote(value: string) {
    await this.orderShippingNote.fill(value);
    await this.orderRegisterButton.click();
  }

  /** 出荷編集の先頭出荷の出荷用メモ欄へ入力し「登録」を押下する。 */
  async fillAndSaveShippingNote(value: string, index = 0) {
    await this.shippingNote(index).fill(value);
    await this.shippingSaveButton.click();
  }

  /** 受注編集の出荷用メモ欄が仕様どおり表示されること（ラベル・入力欄）。 */
  async seeOrderNoteField() {
    await expect(this.page.getByText("出荷用メモ欄").first()).toBeVisible();
    await expect(this.orderShippingNote).toBeVisible();
  }

  /** 指定文言が画面に表示されること（フラッシュ・項目エラー等の共通確認）。 */
  async seeText(text: string) {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }
}
