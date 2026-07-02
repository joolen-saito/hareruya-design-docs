import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注管理 問い合わせ番号入力（送り状No.）（M05-13）Page Object。
 * 納品ケース表 integration_test/e2e/m05_13_admin_order_order_tracking_number_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/ec-cube-enterprise/m05-13_admin_order_order_tracking_number.md / 観点表)由来（オラクル独立性）。
 * 本機能は ec-cube-enterprise を正典（標準機能）とし、刷新先に受注一覧(admin_order)・受注編集(admin_order_edit)・
 * 非同期保存(admin_shipping_update_tracking_number)が実在することを確認してセレクタを導出した。
 * セレクタは Twig＋Symfony Form の getBlockPrefix 由来の位置情報のみ。合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * DOM id / セレクタ根拠:
 *  ◆受注編集フォーム（order/{id}/edit。OrderType getBlockPrefix=`order`(OrderType.php:380)＋
 *    mapped=false サブフォーム `Shipping`(OrderType.php:458)＋ShippingType field `tracking_number`(ShippingType.php:202)）
 *   - 送り状No.入力欄 → #order_Shipping_tracking_number（edit.twig:1764 form_widget(form.Shipping.tracking_number)）
 *   - 送り状No.ラベル「送り状No.」trans admin.order.tracking_number（edit.twig:1762 / messages.ja.yaml:2331）
 *   - ツールチップ title trans tooltip.order.shipping_info.tracking_number（edit.twig:1762 / messages.ja.yaml:3416）
 *   - 項目エラー → form_errors(form.Shipping.tracking_number)（edit.twig:1765。出力クラスは要実機確認のため本文テキストで確認）
 *   - 受注編集リンク（一覧→編集の到達口）→ a.action-edit（index.twig:1256,1265 url admin_order_edit）
 *  ◆受注一覧の出荷行 非同期入力UI（index.twig）
 *   - 入力欄 → input.update_tracking_number / #tracking_number_<出荷id>（index.twig:211,245。data-shipping_id・data-url 前提）
 *   - 更新ボタン → button.update_tracking_number（index.twig:243,274。data-target で対象入力欄を指す）
 *   - 更新アイコン色 → i.text-secondary(未変更) / i.text-success(変更検知)（index.twig:249-251,264-266）
 *   ※ index.twig の出荷行マークアップ（line 1293 「TODO: 編集系UIは各機能実装時に調整する」）には
 *     上記 input.update_tracking_number / button.update_tracking_number が未配置であり、JS フック
 *     (updateTrackingNumber 等 index.twig:204-286)のみ存在する。仕様(フロント挙動・受注一覧)は入力欄＋更新ボタンを
 *     要求するため、本POMはセレクタを仕様どおり定義し、当該ケースは spec で fixme（不具合候補#1）として残す。
 *  ◆非同期保存エンドポイント（admin_shipping_update_tracking_number）
 *   - PUT /{admin_route}/shipping/{id}/tracking_number（OrderController.php:565-566。XHR＋トークン正当時のみ保存）
 */
export class OrderOrderTrackingNumberPage {
  readonly page: Page;
  readonly listUrl: string; // 受注一覧 GET /{admin_route}/order

  // 受注編集フォーム（送り状No.）
  readonly editTrackingNumber: Locator; // #order_Shipping_tracking_number
  readonly editTrackingLabel: Locator; // ラベル「送り状No.」（ツールチップ title 付き）
  readonly firstOrderEditLink: Locator; // 一覧の受注編集リンク（先頭）

  // 受注一覧の出荷行 非同期入力UI（仕様要求。Enterprise一覧では未配置＝不具合候補#1）
  readonly listTrackingInputs: Locator; // input.update_tracking_number
  readonly listUpdateButtons: Locator; // button.update_tracking_number

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/order`;

    this.editTrackingNumber = page.locator("#order_Shipping_tracking_number");
    this.editTrackingLabel = page.locator(
      'label[title="お問い合せ番号（出荷伝票番号）がある場合、こちらから入力できます。受注一覧からまとめて入力することも可能です。"]'
    );
    this.firstOrderEditLink = page.locator("a.action-edit").first();

    this.listTrackingInputs = page.locator("input.update_tracking_number");
    this.listUpdateButtons = page.locator("button.update_tracking_number");
  }

  /** 受注一覧を開く（GET /{admin_route}/order 初期表示）。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 受注編集URLへ直接アクセス（未認証ガード確認等）。 */
  async gotoEditById(id: number) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/order/${id}/edit`);
  }

  /** 一覧の先頭受注の編集画面へ遷移する。受注が無ければ false を返す（呼び出し側で skip）。 */
  async openFirstOrderEdit(): Promise<boolean> {
    await this.gotoList();
    if ((await this.firstOrderEditLink.count()) === 0) {
      return false;
    }
    await this.firstOrderEditLink.click();
    await expect(this.editTrackingNumber).toBeVisible();
    return true;
  }

  /** 受注編集の送り状No.欄へ入力して受注編集フォームを送信する。 */
  async fillAndSaveEditTracking(value: string) {
    await this.editTrackingNumber.fill(value);
    // 受注編集フォームの保存。編集画面には submit が複数あるため、登録ボタン（name=mode value=register。
    // edit.twig:1167,1265）に限定し、可視（:visible）のものに絞って DOM順・非表示タブ依存を避ける。
    await this.page
      .locator('button[type="submit"][name="mode"][value="register"]:visible')
      .first()
      .click();
  }

  /** 受注編集の送り状No.欄が仕様どおり表示されること（ラベル・入力欄）。 */
  async seeEditTrackingField() {
    await expect(this.page.getByText("送り状No.").first()).toBeVisible();
    await expect(this.editTrackingNumber).toBeVisible();
  }

  /** 指定の文言が画面に表示されること（フォーム項目エラー等の共通確認）。 */
  async seeMessage(text: string) {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }
}
