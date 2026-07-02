import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注情報編集 Page Object。
 * 納品ケース表 integration_test/e2e/m05_11_admin_order_order_edit_e2e_cases.md に対応。
 *
 * 期待結果は仕様(設計書 functions/pf-eccube3/m05-11_admin_order_order_edit.md / 観点表 / messages.ja.yaml)由来
 * （オラクル独立性）。本Page Objectが保持するのは Twig＋Symfony Form 由来のセレクタ（位置情報）のみで、
 * 必須/最大長などの制約は期待値に流用しない（制約の正は設計書・観点表）。
 * 設計源は pf-eccube3。刷新先 ec-cube-enterprise には同一画面が存在する（route=admin_order_edit）。
 *
 * 画面・ルート（ec-cube-enterprise EditController.php:146-147）:
 *   GET  /%admin%/order/{id}/edit  既存受注の編集画面（存在しない id は HTTP 404 / EditController.php:216）
 *   POST /%admin%/order/{id}/edit  mode(register/status_change/clear_date) に応じて保存・再描画
 *   GET  /%admin%/order/{id}/print/delivery  納品書印刷（配送0件は404 / EditController.php:1288-1294）
 *
 * DOM id 根拠: Symfony Form getBlockPrefix=`order`（OrderType.php:378-381）。配下フィールドは `order_<name>`。
 *  - 受注ステータス OrderStatus → #order_OrderStatus（OrderType.php:429 / edit.twig:843 form_widget・JS :641 `$('#order_OrderStatus')`）
 *  - 姓/名 name → #order_name_name01 / #order_name_name02（OrderType.php:69 NameType / edit.twig form_widget）
 *  - セイ/メイ kana → #order_kana_kana01 / #order_kana_kana02（OrderType.php:77 KanaType）
 *  - メール email → #order_email（OrderType.php:130 / 要実機確認）
 *  - 値引/送料/手数料 → #order_discount / #order_delivery_fee_total / #order_charge（OrderType.php:209,217,225）
 *  - お問い合わせ message → #order_message（OrderType.php:203 rows=8）
 *  - ショップ用メモ note → #order_note（OrderType.php:233）
 *  - スマレジメモ → #order_smaregi_memo（OrderType.php:280）
 *  - 変更後お支払方法 Payment → #order_Payment（OrderType.php:239 EntityType）
 *  - 国外郵便番号 → #order_abroad_postal_code（OrderType.php:274 / 要実機確認）
 *  - 戻りリンク return_link(hidden) → #order_return_link（OrderType.php:262 HiddenType）
 *  - 隠し mode → input[name="mode"]（edit.twig:790）。登録ボタン button[name="mode"][value="register"]（edit.twig:1167,1265,1913 trans admin.order.register_order=「受注情報を登録」 messages.ja.yaml:5540 / admin.common.registration）
 *  - 納品書印刷ボタン → #print-delivery-slip（edit.twig:806 trans「納品書印刷」）
 *  - 手動メール導線 → 仕様(設計書 フロント挙動)の「手動メール」ボタン。実装は admin_order_manual_mail へのリンク（edit.twig:803-804）。期待文言は仕様の「手動メール」で固定し実装文言「手動メール通知」(messages.ja.yaml:2261)は流用しない＝付帯表4#2参照
 *  - フォーム → #form1（edit.twig:789）
 *  - フラッシュ → .alert-success / .alert-danger（@admin/alert.twig）
 *  - 受注概要カード #orderOverview（edit.twig:812）/ 商品明細カード #orderItem（edit.twig:1001）/ 注文者カード #ordererInfoCard（edit.twig:1281）
 */
export class OrderOrderEditPage {
  readonly page: Page;

  readonly form: Locator; // #form1
  readonly orderStatus: Locator; // 受注ステータス（既存受注のみ表示・mapped偽）
  readonly name01: Locator; // 姓（必須）
  readonly name02: Locator; // 名（必須）
  readonly kana01: Locator; // セイ（必須）
  readonly kana02: Locator; // メイ（必須）
  readonly email: Locator; // メールアドレス（必須）
  readonly discount: Locator; // 値引き（必須）
  readonly deliveryFeeTotal: Locator; // 送料（必須）
  readonly charge: Locator; // 手数料（必須）
  readonly message: Locator; // お問い合わせ（任意）
  readonly note: Locator; // ショップ用メモ（任意）
  readonly smaregiMemo: Locator; // スマレジメモ（任意）
  readonly payment: Locator; // 変更後お支払方法（必須）
  readonly abroadPostalCode: Locator; // 国外郵便番号（国外住所時必須）
  readonly returnLink: Locator; // 戻りリンク（hidden・mapped偽）
  readonly modeInput: Locator; // 隠し mode
  readonly registerButton: Locator; // 登録（mode=register）
  readonly printDeliveryButton: Locator; // 納品書印刷
  readonly manualMailLink: Locator; // 手動メール導線（仕様文言「手動メール」で特定。実装はリンク＝付帯表4#2）

  readonly overviewCard: Locator; // 受注概要カード
  readonly orderItemCard: Locator; // 商品明細カード
  readonly ordererInfoCard: Locator; // 注文者カード
  readonly successFlash: Locator; // .alert-success
  readonly errorFlash: Locator; // .alert-danger

  constructor(page: Page) {
    this.page = page;

    this.form = page.locator("#form1");
    this.orderStatus = page.locator("#order_OrderStatus");
    this.name01 = page.locator("#order_name_name01");
    this.name02 = page.locator("#order_name_name02");
    this.kana01 = page.locator("#order_kana_kana01");
    this.kana02 = page.locator("#order_kana_kana02");
    this.email = page.locator("#order_email");
    this.discount = page.locator("#order_discount");
    this.deliveryFeeTotal = page.locator("#order_delivery_fee_total");
    this.charge = page.locator("#order_charge");
    this.message = page.locator("#order_message");
    this.note = page.locator("#order_note");
    this.smaregiMemo = page.locator("#order_smaregi_memo");
    this.payment = page.locator("#order_Payment");
    this.abroadPostalCode = page.locator("#order_abroad_postal_code");
    this.returnLink = page.locator("#order_return_link");
    this.modeInput = page.locator('#form1 input[name="mode"]');
    this.registerButton = page.locator('#form1 button[name="mode"][value="register"]').first();
    this.printDeliveryButton = page.locator("#print-delivery-slip");
    // 仕様(設計書 フロント挙動「手動メール」ボタン)由来の文言で導線を特定する。
    // 実装文言「手動メール通知」(messages.ja.yaml:2261)を期待値に固定しない（オラクル独立性）。
    // getByName は既定で部分一致のため、仕様文言「手動メール」は実装の「手動メール通知」にも合致する。
    this.manualMailLink = page.getByRole("link", { name: "手動メール" });

    this.overviewCard = page.locator("#orderOverview");
    this.orderItemCard = page.locator("#orderItem");
    this.ordererInfoCard = page.locator("#ordererInfoCard");
    this.successFlash = page.locator(".alert-success");
    this.errorFlash = page.locator(".alert-danger");
  }

  editUrl(id: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/order/${id}/edit`;
  }

  printDeliveryUrl(id: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/order/${id}/print/delivery`;
  }

  /** 編集画面を開く。404確認等のため Response を返す。 */
  async goto(id: string | number) {
    return this.page.goto(this.editUrl(id));
  }

  /** 編集画面の主要UI部品が仕様どおり表示されること（フロント挙動・表示要素）。 */
  async seeEditForm() {
    await expect(this.overviewCard).toBeVisible();
    await expect(this.orderItemCard).toBeVisible();
    await expect(this.ordererInfoCard).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }

  /** 受注ステータス変更欄が表示されること（既存受注のみ・エッジケース：新規では非表示）。 */
  async seeOrderStatusField() {
    await expect(this.orderStatus).toBeVisible();
  }

  /** mode=register で登録（保存）を送信する。 */
  async submitRegister() {
    await this.registerButton.click();
  }

  /**
   * 受注ステータスを value（OrderStatus id）で選択する。
   * 仕様上、選択肢は遷移可能な集合に限定されるため、遷移“可能”系（030）はそのまま選択できる。
   * 遷移“不可”系（031）は実装が選択肢から除外するため通常 selectOption では選べない。
   * その場合は option 追加等の DOM 改変、または POST パラメータ改変で不可遷移IDを送信する（spec 031 参照）。
   */
  async selectOrderStatus(value: string) {
    await this.orderStatus.selectOption(value);
  }

  async fillName(name01: string, name02: string) {
    await this.name01.fill(name01);
    await this.name02.fill(name02);
  }

  async fillNote(text: string) {
    await this.note.fill(text);
  }

  /** 納品書印刷ボタンを押下する（新ウィンドウ）。 */
  async clickPrintDelivery() {
    await this.printDeliveryButton.click();
  }
}
