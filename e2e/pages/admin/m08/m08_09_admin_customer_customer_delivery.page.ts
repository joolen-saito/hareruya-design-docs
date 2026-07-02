import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 会員管理 — 配送先一覧表示/編集 Page Object。
 * 納品ケース表 integration_test/e2e/m08_09_admin_customer_customer_delivery_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m08-09_admin_customer_customer_delivery.md / 観点表)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`customer_address`
 * （src/Eccube/Form/Type/Front/CustomerAddressType.php:199-202）由来の位置情報のみ。
 * 合否は仕様で判定し、Form制約(NotBlank/Length)を期待値に流用しない。
 *
 * 画面構成の前提（不具合候補#1/#2＝設計と刷新先実装の乖離）:
 *  - 設計の独立「配送先一覧」画面は刷新先に存在せず、会員編集画面（admin_customer_edit=/customer/{id}/edit）内の
 *    折りたたみセクション #delivery（edit.twig:732）に一覧・編集リンク・削除モーダルが描画される。
 *  - 編集 URL は /customer/{id}/delivery/{did}/edit（admin_customer_delivery_edit, CustomerDeliveryEditController.php:46）、
 *    新規追加 URL は /customer/{id}/delivery/new（admin_customer_delivery_new, 同:45）、
 *    削除 URL は /customer/{id}/delivery/{did}/delete（admin_customer_delivery_delete, 同:127）。
 *
 * DOM id 根拠（delivery_edit.twig＋getBlockPrefix=customer_address）:
 *  - address_name → #customer_address_address_name（delivery_edit.twig:57）
 *  - name.name01 → #customer_address_name_name01（:87）/ name.name02 → #customer_address_name_name02（:91）
 *  - postalCode01/02 → #customer_address_postalCode_postalCode01/02（:147,:151）
 *  - address.pref → #customer_address_address_pref（:180）/ addr01 → #customer_address_address_addr01（:186）
 *  - 登録ボタン trans admin.common.registration=「登録」（:248）
 *  - エラー .invalid-feedback（admin/Form/bootstrap_4_horizontal_layout.html.twig:55, field単位）
 *  - フラッシュ success（addSuccess admin.common.save_complete=「保存しました」CustomerDeliveryEditController.php:107）
 *  - 削除完了 admin.common.delete_complete=「削除しました」（同:147）
 */
export class CustomerCustomerDeliveryPage {
  readonly page: Page;

  // ----- 入力欄（配送先編集画面 delivery_edit.twig） -----
  readonly addressName: Locator; // #customer_address_address_name（:57）
  readonly name01: Locator; // 姓 #customer_address_name_name01（:87）
  readonly name02: Locator; // 名 #customer_address_name_name02（:91）
  readonly kana01: Locator; // セイ #customer_address_kana_kana01（:106）
  readonly kana02: Locator; // メイ #customer_address_kana_kana02（:110）
  readonly tel01: Locator; // #customer_address_tel_tel01（:123）
  readonly tel02: Locator; // #customer_address_tel_tel02（:128）
  readonly tel03: Locator; // #customer_address_tel_tel03（:133）
  readonly postalCode01: Locator; // #customer_address_postalCode_postalCode01（:147）
  readonly postalCode02: Locator; // #customer_address_postalCode_postalCode02（:151）
  readonly addressPref: Locator; // #customer_address_address_pref（:180）
  readonly addressAddr01: Locator; // #customer_address_address_addr01（:186）
  readonly addressAddr02: Locator; // #customer_address_address_addr02（:190）
  readonly registerButton: Locator; // 「登録」trans admin.common.registration（:248）
  readonly fieldError: Locator; // .invalid-feedback（bootstrap_4_horizontal_layout.html.twig:55）
  readonly successAlert: Locator; // .alert-success（admin/alert.twig:22。成功フラッシュ領域。文言は固定しない＝オラクル独立）

  // ----- 一覧（会員編集画面 edit.twig #delivery） -----
  readonly deliverySection: Locator; // #delivery（edit.twig:732）
  readonly addAddressButton: Locator; // 「お届け先住所を追加」trans admin.customer.customer_address__add（edit.twig:803）
  readonly deleteModalTitle: Locator; // 「削除します」trans admin.common.delete_modal__title（edit.twig:775）

  // フラッシュメッセージ（成功/削除完了は仕様文言で確認。領域セレクタは default_frame 側で要実機確認のため body テキストで観測）

  constructor(page: Page) {
    this.page = page;

    this.addressName = page.locator("#customer_address_address_name");
    this.name01 = page.locator("#customer_address_name_name01");
    this.name02 = page.locator("#customer_address_name_name02");
    this.kana01 = page.locator("#customer_address_kana_kana01");
    this.kana02 = page.locator("#customer_address_kana_kana02");
    this.tel01 = page.locator("#customer_address_tel_tel01");
    this.tel02 = page.locator("#customer_address_tel_tel02");
    this.tel03 = page.locator("#customer_address_tel_tel03");
    this.postalCode01 = page.locator("#customer_address_postalCode_postalCode01");
    this.postalCode02 = page.locator("#customer_address_postalCode_postalCode02");
    this.addressPref = page.locator("#customer_address_address_pref");
    this.addressAddr01 = page.locator("#customer_address_address_addr01");
    this.addressAddr02 = page.locator("#customer_address_address_addr02");
    this.registerButton = page.getByRole("button", { name: "登録" });
    this.fieldError = page.locator(".invalid-feedback");
    this.successAlert = page.locator(".alert-success");

    this.deliverySection = page.locator("#delivery");
    this.addAddressButton = page.getByRole("link", { name: "お届け先住所を追加" });
    this.deleteModalTitle = page.locator(".modal-title", { hasText: "削除します" });
  }

  // ----- URL ヘルパ（不具合候補#1/#2: 設計とURL・画面構成が相違） -----
  customerEditUrl(customerId: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/customer/${customerId}/edit`;
  }
  deliveryEditUrl(customerId: string | number, did: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/customer/${customerId}/delivery/${did}/edit`;
  }
  deliveryNewUrl(customerId: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/customer/${customerId}/delivery/new`;
  }

  async gotoCustomerEdit(customerId: string | number) {
    await this.page.goto(this.customerEditUrl(customerId));
  }
  async gotoDeliveryEdit(customerId: string | number, did: string | number) {
    await this.page.goto(this.deliveryEditUrl(customerId, did));
  }
  async gotoDeliveryNew(customerId: string | number) {
    await this.page.goto(this.deliveryNewUrl(customerId));
  }

  /** 編集/新規フォームに有効値を入力する。fields で個別に上書き（空文字で未入力を表現）できる。 */
  async fillDeliveryForm(fields: {
    addressName?: string;
    name01?: string;
    name02?: string;
    kana01?: string;
    kana02?: string;
    tel01?: string;
    tel02?: string;
    tel03?: string;
    postalCode01?: string;
    postalCode02?: string;
    pref?: string;
    addr01?: string;
    addr02?: string;
  }) {
    if (fields.addressName !== undefined) await this.addressName.fill(fields.addressName);
    if (fields.name01 !== undefined) await this.name01.fill(fields.name01);
    if (fields.name02 !== undefined) await this.name02.fill(fields.name02);
    if (fields.kana01 !== undefined) await this.kana01.fill(fields.kana01);
    if (fields.kana02 !== undefined) await this.kana02.fill(fields.kana02);
    if (fields.tel01 !== undefined) await this.tel01.fill(fields.tel01);
    if (fields.tel02 !== undefined) await this.tel02.fill(fields.tel02);
    if (fields.tel03 !== undefined) await this.tel03.fill(fields.tel03);
    if (fields.postalCode01 !== undefined) await this.postalCode01.fill(fields.postalCode01);
    if (fields.postalCode02 !== undefined) await this.postalCode02.fill(fields.postalCode02);
    // 都道府県（住所フォームの必須項目。設計「配送先の住所等」に含む）。ラベル選択は入力データであり期待値ではない。
    if (fields.pref !== undefined) await this.addressPref.selectOption({ label: fields.pref });
    if (fields.addr01 !== undefined) await this.addressAddr01.fill(fields.addr01);
    if (fields.addr02 !== undefined) await this.addressAddr02.fill(fields.addr02);
  }

  async submitRegister() {
    await this.registerButton.click();
  }

  /** 配送先編集画面の主要UI部品が仕様どおり表示されること。 */
  async seeDeliveryForm() {
    await expect(this.addressName).toBeVisible();
    await expect(this.name01).toBeVisible();
    await expect(this.postalCode01).toBeVisible();
    await expect(this.addressAddr01).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }

  /** 会員編集画面の配送先一覧で、指定 did の編集リンク（行の代表要素）を返す。 */
  deliveryEditLink(customerId: string | number, did: string | number): Locator {
    return this.page.locator(`a[href$="/customer/${customerId}/delivery/${did}/edit"]`);
  }

  /**
   * 一覧に当該配送先の行が表示され、内容（名称/氏名/住所等のテキスト）が空でないこと。
   * 期待は設計「当該会員の追加配送先を一覧表示する」由来（具体値はシード依存のため非固定）。
   */
  async seeDeliveryRow(customerId: string | number, did: string | number) {
    const link = this.deliveryEditLink(customerId, did);
    await expect(link).toBeVisible();
    // 編集リンクを含む行（td 群）に配送先の表示内容が存在すること。
    const row = this.page.locator("#delivery tr", { has: link });
    await expect(row).toBeVisible();
    await expect(row).not.toHaveText("");
  }

  /** 会員編集画面の配送先一覧で、指定 did の削除モーダルを開く。 */
  async openDeleteModal(did: string | number) {
    await this.page.locator(`[data-bs-target="#discontinuance-${did}"]`).click();
  }

  /** 削除モーダル内の「削除」アンカー（data-method=delete）を押下する。 */
  async confirmDelete(did: string | number) {
    await this.page
      .locator(`#discontinuance-${did} a.btn-ec-delete`)
      .click();
  }

  /** 削除確認モーダルの「キャンセル」（data-bs-dismiss=modal、edit.twig:783）を押下しモーダルを閉じる。 */
  async cancelDelete(did: string | number) {
    await this.page
      .locator(`#discontinuance-${did} [data-bs-dismiss="modal"]`)
      .first()
      .click();
  }
}
