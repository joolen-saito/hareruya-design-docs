import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店舗設定 — 支払方法管理（一覧 / 登録・編集）Page Object。
 * 画面タイプ: other（list ＋ register_edit/crud ＋ 表示順入替 ＋ visible切替 ＋ delete モーダル ＋ 画像Ajax）。
 *
 * 期待結果（合否）は仕様（正本md functions/pf-eccube3/m10-04_admin_base_setting_setting_shop_payment.md・
 * テスト観点表 integration-test-viewpoints.md・基本設計）由来とする（オラクル独立性）。
 * 本ファイルが実装から取るのはセレクタ（位置情報）のみであり、必須/最大長/制約は期待結果に流用しない。
 *
 * 重要: 設計書(pf-eccube3リバース)と刷新先(ec-cube-enterprise)に複数の乖離があり、ケース表 付帯表4 に列挙する。
 *   例: 設計の「上へ/下へ(PUT)」は enterprise では一覧のドラッグ＆action-up/down→Ajax(sort_no/move) /
 *       設計の「論理削除」は enterprise では物理削除 / charge_flg 相当列が無く手数料は常時必須 /
 *       enterprise は payment_method_en・mail_template_jp/en を必須項目として追加 /
 *       登録成功後は設計=一覧へ、enterprise=編集画面へ遷移。テストは仕様どおりに書く。
 *
 * セレクタ根拠（ec-cube-enterprise 現行ソース。行番号は src/Eccube 基準・nl -ba）:
 *  - ルート: 一覧 admin_setting_shop_payment `GET /setting/shop/payment`（PaymentController.php:48）/
 *    新規 admin_setting_shop_payment_new `/setting/shop/payment/new`（:74）/
 *    編集 admin_setting_shop_payment_edit `/setting/shop/payment/{id}/edit`（:75）/
 *    削除 `DELETE .../{id}/delete`（:297）/ visible切替 `PUT .../{id}/visible`（:334）/
 *    並べ替え `POST .../sort_no/move`（:355）/ 画像 `POST .../image/process`（:180）。
 *  - フォームDOM id は Symfony Form の getBlockPrefix='payment_register'（PaymentRegisterType.php:153-155）由来:
 *    method→#payment_register_method / payment_method_en→#payment_register_payment_method_en /
 *    charge→#payment_register_charge / mail_template_jp→#payment_register_mail_template_jp /
 *    mail_template_en→#payment_register_mail_template_en / rule_min→#payment_register_rule_min /
 *    rule_max→#payment_register_rule_max / payment_image_file→#payment_register_payment_image_file /
 *    payment_image(hidden)→#payment_register_payment_image / visible→#payment_register_visible /
 *    fixed(hidden)→#payment_register_fixed / _token→#payment_register__token。
 *  一覧（payment.twig）:
 *  - 新規作成リンク: a.btn-ec-regular href=admin_setting_shop_payment_new trans admin.common.create__new=「新規作成」
 *    （payment.twig:135 / messages.ja.yaml:1454。設計表記は「支払方法を新規入力」＝文言乖離・付帯表4）
 *  - 見出し行: li.list-group-item（先頭）内 strong（支払方法 admin.common.payment_method :144 /
 *    手数料 admin.common.charge :145 / 利用条件 admin.setting.shop.payment.terms_of_use :146）
 *  - 明細行: li.sortable-item[data-id]（payment.twig:150）/ 支払方法名リンク a href=admin_setting_shop_payment_edit（:154）
 *  - 上へアイコン: a.action-up（payment.twig:172 title admin.common.up=「上へ」/ loop.first で disabled）
 *  - 下へアイコン: a.action-down（payment.twig:175 title admin.common.down=「下へ」/ loop.last で disabled）
 *  - 表示切替: a.action-visible href=admin_setting_shop_payment_visible data-method=put（payment.twig:178-182）
 *  - 削除アイコン: a[data-bs-target="#DeleteModal"] data-url/ data-message（payment.twig:185-187）
 *  - 削除モーダル: #DeleteModal（payment.twig:197）/ 見出し h5.modal-title trans admin.common.delete_modal__title
 *    =「削除します」（:202-203 / messages.ja.yaml:1592）/ 本文 p.modal-message（:210・jsで差込）/
 *    キャンセル button.btn-ec-sub trans admin.common.cancel（:213-214）/ 実行 a.btn-ec-delete data-method=delete（:216-219）
 *  編集（payment_edit.twig）:
 *  - form#form1 method=post enctype=multipart（payment_edit.twig:124）/ _token→#payment_register__token（:125）
 *  - カードヘッダ: div.card-header span trans admin.common.payment_method=「支払方法」（payment_edit.twig:131。
 *    設計の見出し「支払方法登録・編集」とは不一致＝乖離・付帯表4）
 *  - 支払方法名: #payment_register_method（:137。ラベル admin.setting.shop.payment.payment_name=「支払方法」＋必須バッジ :135）
 *  - 支払方法名(英): #payment_register_payment_method_en（:145・必須バッジ :143＝enterprise追加項目）
 *  - 手数料: #payment_register_charge（:152・必須バッジ :150＝enterprise常時必須）
 *  - メールテンプレート(日/英): #payment_register_mail_template_jp（:160）/ _en（:168＝enterprise追加必須）
 *  - 利用条件 下限/上限: #payment_register_rule_min（:181）/ #payment_register_rule_max（:186）を「〜」で挟む（:184）
 *  - ロゴ画像: hidden #payment_register_payment_image（:201）/ file #payment_register_payment_image_file（:204・FilePond）
 *  - 表示状態 select: #payment_register_visible（:249）
 *  - 登録ボタン: button.btn-ec-conversion[type=submit] trans admin.common.registration=「登録」（:253 / messages.ja.yaml:1436）
 *  - 一覧へ戻るリンク: a.c-baseLink href=admin_setting_shop_payment trans admin.setting.shop.payment_list
 *    （payment_edit.twig:241-242 / messages.ja.yaml:2778=「支払方法設定」）
 *  - 必須バッジ: span.badge.bg-primary trans admin.common.required=「必須」（messages.ja.yaml:1528）
 *
 * 注: 検証エラーの表示位置は form_theme bootstrap_4_horizontal_layout 依存のため専用セレクタは創作しない。
 *   エラー観測は仕様文言（「入力されていません。」= validators.ja.yaml:17 等）の本文存在＋
 *   「保存成功フラッシュ(保存しました)が出ない／編集画面に留まる」を主観測とする（オラクル＝検証失敗で保存されない）。
 */
export class BaseSettingSettingShopPaymentPage {
  readonly page: Page;
  readonly listUrl: string;
  readonly newUrl: string;

  // 一覧
  readonly addNewLink: Locator; // a.btn-ec-regular（新規作成 / href=...payment/new）
  readonly listHeaderRow: Locator; // li.list-group-item（先頭=見出し行）
  readonly listItems: Locator; // li.sortable-item
  readonly deleteModal: Locator; // #DeleteModal
  readonly deleteModalTitle: Locator; // #DeleteModal .modal-title
  readonly deleteModalCancel: Locator; // #DeleteModal button.btn-ec-sub

  // 編集
  readonly form: Locator; // #form1
  readonly cardHeader: Locator; // div.card-header span（支払方法）
  readonly method: Locator; // #payment_register_method
  readonly paymentMethodEn: Locator; // #payment_register_payment_method_en
  readonly charge: Locator; // #payment_register_charge
  readonly mailTemplateJp: Locator; // #payment_register_mail_template_jp
  readonly mailTemplateEn: Locator; // #payment_register_mail_template_en
  readonly ruleMin: Locator; // #payment_register_rule_min
  readonly ruleMax: Locator; // #payment_register_rule_max
  readonly paymentImageFile: Locator; // #payment_register_payment_image_file
  readonly paymentImageHidden: Locator; // #payment_register_payment_image
  readonly visible: Locator; // #payment_register_visible
  readonly registerButton: Locator; // button.btn-ec-conversion[type=submit]
  readonly backToListLink: Locator; // a.c-baseLink（支払方法設定）
  readonly requiredBadge: Locator; // span.badge.bg-primary（必須）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/setting/shop/payment`;
    this.newUrl = `/${ECCUBE_ADMIN_ROUTE}/setting/shop/payment/new`;

    // 一覧
    this.addNewLink = page.locator(`a[href$="/setting/shop/payment/new"]`);
    this.listHeaderRow = page.locator("li.list-group-item").first();
    this.listItems = page.locator("li.sortable-item");
    this.deleteModal = page.locator("#DeleteModal");
    this.deleteModalTitle = page.locator("#DeleteModal .modal-title");
    this.deleteModalCancel = page.locator("#DeleteModal button.btn-ec-sub");

    // 編集
    this.form = page.locator("#form1");
    this.cardHeader = page.locator("div.card-header span");
    this.method = page.locator("#payment_register_method");
    this.paymentMethodEn = page.locator("#payment_register_payment_method_en");
    this.charge = page.locator("#payment_register_charge");
    this.mailTemplateJp = page.locator("#payment_register_mail_template_jp");
    this.mailTemplateEn = page.locator("#payment_register_mail_template_en");
    this.ruleMin = page.locator("#payment_register_rule_min");
    this.ruleMax = page.locator("#payment_register_rule_max");
    this.paymentImageFile = page.locator("#payment_register_payment_image_file");
    this.paymentImageHidden = page.locator("#payment_register_payment_image");
    this.visible = page.locator("#payment_register_visible");
    this.registerButton = page.locator("button.btn-ec-conversion[type=submit]");
    this.backToListLink = page.locator(`a.c-baseLink[href$="/setting/shop/payment"]`);
    this.requiredBadge = page.locator("span.badge.bg-primary", { hasText: "必須" });
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }
  async gotoNew() {
    await this.page.goto(this.newUrl);
  }
  /** 既存編集画面（id指定）へ遷移する。 */
  async gotoEdit(id: string) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/payment/${id}/edit`);
  }

  /** 一覧の見出しに仕様の3列「支払方法」「手数料」「利用条件」が表示されること。 */
  async seeListHeader() {
    await expect(this.listHeaderRow).toContainText("支払方法");
    await expect(this.listHeaderRow).toContainText("手数料");
    await expect(this.listHeaderRow).toContainText("利用条件");
  }

  /** 編集画面の主要入力部品（支払方法名・手数料・利用条件・登録ボタン）が表示されること。 */
  async seeEditForm() {
    await expect(this.method).toBeVisible();
    await expect(this.charge).toBeVisible();
    await expect(this.ruleMin).toBeVisible();
    await expect(this.ruleMax).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }

  /** 一覧の先頭明細行の支払方法名リンク（編集導線）。 */
  firstRowEditLink(): Locator {
    return this.listItems.first().locator('a[href*="/edit"]');
  }

  /** 一覧の先頭明細行の「上へ」アイコン（先頭は disabled になる仕様）。 */
  firstRowUpIcon(): Locator {
    return this.listItems.first().locator("a.action-up");
  }

  /** 一覧の最終明細行の「下へ」アイコン（最終は disabled になる仕様 / payment.twig:175 loop.last）。 */
  lastRowDownIcon(): Locator {
    return this.listItems.last().locator("a.action-down");
  }

  /** 一覧の指定行（先頭）の削除アイコンを押し、確認モーダルを開く。 */
  async openDeleteModalForFirstRow() {
    await this.listItems.first().locator('a[data-bs-target="#DeleteModal"]').click();
  }

  /** 編集フォームへ値を入力する（指定したフィールドのみ）。 */
  async fillEdit(values: {
    method?: string;
    paymentMethodEn?: string;
    charge?: string;
    ruleMin?: string;
    ruleMax?: string;
  }) {
    if (values.method !== undefined) await this.method.fill(values.method);
    if (values.paymentMethodEn !== undefined) await this.paymentMethodEn.fill(values.paymentMethodEn);
    if (values.charge !== undefined) await this.charge.fill(values.charge);
    if (values.ruleMin !== undefined) await this.ruleMin.fill(values.ruleMin);
    if (values.ruleMax !== undefined) await this.ruleMax.fill(values.ruleMax);
  }

  async submitRegister() {
    await this.registerButton.click();
  }
}
