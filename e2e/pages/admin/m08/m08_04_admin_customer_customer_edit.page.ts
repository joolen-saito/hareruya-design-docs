import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 会員管理 — 会員登録/編集（会員編集）Page Object。
 * 画面タイプ: edit/register_edit（GET/POST admin_customer_new ・ admin_customer_edit）。
 *
 * 期待結果（合否）は仕様（正本md functions/pf-eccube3/m08-04_admin_customer_customer_edit.md・観点表・
 * ec-cube-enterprise確認値 messages.ja.yaml）由来とする（オラクル独立性）。本ファイルが実装から取るのは
 * セレクタ（位置情報）のみであり、必須/最大長/制約は期待結果に流用しない。
 *
 * セレクタ根拠（ec-cube-enterprise 現行ソース。行番号は src 基準）:
 *  - フォームDOM id は Symfony Form の getBlockPrefix='admin_customer'（CustomerType.php:239-242）由来。
 *    子フォーム Player（PlayerType getBlockPrefix='admin_player' だが埋め込みパスは Player）は
 *    'admin_customer_Player_<child>' になる。
 *  - <form id="customer_form" action=admin_customer_edit>（edit.twig:330-332）/ form._token（edit.twig:334 → #admin_customer__token）
 *  - 名前: #admin_customer_name_name01（edit.twig:375）/ #admin_customer_name_name02（edit.twig:378）
 *  - カナ: #admin_customer_kana_kana01/02（edit.twig:399,402）
 *  - 会社名: #admin_customer_company_name（edit.twig:420）
 *  - 国: #admin_customer_country（edit.twig:431）
 *  - 郵便番号: #admin_customer_postalCode_postalCode01/02（edit.twig:439,443）/ 自動入力 #zip-search（edit.twig:446）
 *  - 海外用郵便番号: #admin_customer_abroadPostalCode（edit.twig:458）
 *  - 都道府県: #admin_customer_address_pref（edit.twig:464）/ 住所1/2/3: #admin_customer_address_addr01/02/03（edit.twig:470,474,478）
 *  - メール: #admin_customer_email（edit.twig:489）
 *  - 電話: #admin_customer_tel_tel01/02/03（edit.twig:499,504,509）/ FAX: #admin_customer_fax_fax01/02/03（edit.twig:518,523,528）
 *  - パスワード: #admin_customer_plain_password_first / _second（edit.twig:538,548 type=password）
 *  - 性別ラジオ: name=admin_customer[sex]（edit.twig:557）/ 職業: #admin_customer_job（edit.twig:566）/ 生年月日: #admin_customer_birth（edit.twig:575）
 *  - 会員グループ: #admin_customer_Player_CustomerGroup（edit.twig:584）
 *  - DCI登録本名: #admin_customer_Player_firstNameEn / _lastNameEn（edit.twig:595,598）
 *  - スマレジID(読取専用): #admin_customer_Player_smaregiId（edit.twig:616 disabled）
 *  - 本人確認ステータス ラジオ: name=admin_customer[Player][IdentityConfirmStatus]（edit.twig:625）
 *  - メールマガジン配信フラグ ラジオ: name=admin_customer[Player][mailMagazineFlg]（edit.twig:634）
 *  - 会員ステータス: #admin_customer_status（edit.twig:1061 右カラム）
 *  - ショップ用メモ: #admin_customer_note（edit.twig:1013）
 *  - 登録ボタン: #register_btn trans admin.common.registration=「登録」（edit.twig:1065 / messages.ja.yaml）
 *  - 会員一覧戻り: a.c-baseLink href=admin_customer_page（edit.twig:1026-1030）
 *  - 会員ID表示: Customer.id 行（edit.twig:353-365 編集時のみ）
 *  - 購入履歴カード: #orderHistory（edit.twig:849）/ 買取履歴カード: #buyOrderHistory（edit.twig:930）/ 配送先: #delivery（edit.twig:732）
 *  - 導線: ポイント管理 admin_customer_point_select（edit.twig:1037）/ ポイント履歴 admin_customer_point_history（:1042）/
 *    送信履歴 admin_customer_mail_history（:1047）/ 手動メール通知 admin_customer_manual_mail（:1052）/
 *    オンライン本人確認モーダル data-bs-target=#online_identification_detail（:1057 / モーダル :102）
 *  - 確認ダイアログ: #register_btn 押下時、本人確認用情報変更で window.confirm（edit.twig:33-46 文言は :36 リテラル）
 *  - 郵便番号自動入力は AjaxZip3 外部API（edit.twig:24-26）＝外部依存（自動化対象外/手動）。
 *
 * 注: 検証エラー表示位置（.invalid-feedback / .ec-errorMessage 等）は form_theme
 *   bootstrap_4_horizontal_layout 依存のため要実機確認。本POMは「保存成功フラッシュが出ない＋編集画面へ遷移しない」を
 *   主観測とし、エラー要素セレクタは補助とする（オラクルは仕様＝検証失敗で保存されない）。
 */
export class AdminCustomerCustomerEditPage {
  readonly page: Page;

  // フォーム・トークン
  readonly form: Locator; // #customer_form
  readonly registerButton: Locator; // #register_btn

  // コア入力欄
  readonly name01: Locator;
  readonly name02: Locator;
  readonly kana01: Locator;
  readonly kana02: Locator;
  readonly companyName: Locator;
  readonly country: Locator;
  readonly postalCode01: Locator;
  readonly postalCode02: Locator;
  readonly zipSearchButton: Locator; // #zip-search
  readonly abroadPostalCode: Locator;
  readonly pref: Locator;
  readonly addr01: Locator;
  readonly addr02: Locator;
  readonly addr03: Locator;
  readonly email: Locator;
  readonly passwordFirst: Locator;
  readonly passwordSecond: Locator;
  readonly birth: Locator;
  readonly status: Locator; // 会員ステータス
  readonly note: Locator;

  // 選手情報（Player 子フォーム）
  readonly customerGroup: Locator;
  readonly firstNameEn: Locator;
  readonly lastNameEn: Locator;
  readonly smaregiId: Locator;
  readonly idExpirationDate: Locator;
  readonly identityConfirmStatusRadios: Locator;
  readonly mailMagazineFlgRadios: Locator;

  // 仕様で「入力項目」と定義されるが刷新先フォーム未実装の項目（不具合候補#3）。
  // セレクタは getBlockPrefix='admin_customer' ＋ Player子フォームの form キー（mapped=偽）を仕様から
  // 推定した期待DOM id（要実機確認）。E2Eは「仕様どおり存在すること」を観測し、未実装なら落として検出する。
  readonly dciNo: Locator; // DCIナンバー（仕様 入力項目: dciNo / 設計書 :158,243）
  readonly dciConfirmFlgRadios: Locator; // DCI確認フラグ（仕様: dciConfirmFlg / 設計書 :161）
  readonly identificationFlgRadios: Locator; // 本人確認フラグ 必須（仕様: identificationFlg / 設計書 :163,245）

  // 表示・導線
  readonly customerIdRow: Locator; // 会員ID 表示（編集時のみ） tooltip.customer.customer_id
  readonly orderHistoryCard: Locator; // #orderHistory
  readonly buyOrderHistoryCard: Locator; // #buyOrderHistory
  readonly deliveryCard: Locator; // #delivery
  readonly backToListLink: Locator; // a.c-baseLink
  readonly deliveryNewLink: Locator; // 配送先追加導線 admin_customer_delivery_new（編集時のみ）
  readonly pointSelectLink: Locator; // admin_customer_point_select
  readonly mailHistoryLink: Locator; // admin_customer_mail_history
  readonly manualMailLink: Locator; // admin_customer_manual_mail
  readonly onlineIdentificationButton: Locator; // data-bs-target=#online_identification_detail
  readonly onlineIdentificationModal: Locator; // #online_identification_detail

  // 検証エラー（位置は要実機確認）
  readonly errors: Locator;

  constructor(page: Page) {
    this.page = page;

    this.form = page.locator("#customer_form");
    this.registerButton = page.locator("#register_btn");

    this.name01 = page.locator("#admin_customer_name_name01");
    this.name02 = page.locator("#admin_customer_name_name02");
    this.kana01 = page.locator("#admin_customer_kana_kana01");
    this.kana02 = page.locator("#admin_customer_kana_kana02");
    this.companyName = page.locator("#admin_customer_company_name");
    this.country = page.locator("#admin_customer_country");
    this.postalCode01 = page.locator("#admin_customer_postalCode_postalCode01");
    this.postalCode02 = page.locator("#admin_customer_postalCode_postalCode02");
    this.zipSearchButton = page.locator("#zip-search");
    this.abroadPostalCode = page.locator("#admin_customer_abroadPostalCode");
    this.pref = page.locator("#admin_customer_address_pref");
    this.addr01 = page.locator("#admin_customer_address_addr01");
    this.addr02 = page.locator("#admin_customer_address_addr02");
    this.addr03 = page.locator("#admin_customer_address_addr03");
    this.email = page.locator("#admin_customer_email");
    this.passwordFirst = page.locator("#admin_customer_plain_password_first");
    this.passwordSecond = page.locator("#admin_customer_plain_password_second");
    this.birth = page.locator("#admin_customer_birth");
    this.status = page.locator("#admin_customer_status");
    this.note = page.locator("#admin_customer_note");

    this.customerGroup = page.locator("#admin_customer_Player_CustomerGroup");
    this.firstNameEn = page.locator("#admin_customer_Player_firstNameEn");
    this.lastNameEn = page.locator("#admin_customer_Player_lastNameEn");
    this.smaregiId = page.locator("#admin_customer_Player_smaregiId");
    this.idExpirationDate = page.locator(
      'input[name="admin_customer[Player][id_expiration_date]"]'
    ); // 身分証有効期限（edit.twig:310 single_text）
    this.identityConfirmStatusRadios = page.locator(
      'input[name="admin_customer[Player][IdentityConfirmStatus]"]'
    );
    this.mailMagazineFlgRadios = page.locator(
      'input[name="admin_customer[Player][mailMagazineFlg]"]'
    );

    // 仕様要求の期待DOM id（要実機確認・現行刷新先は未実装＝不具合候補#3を検出する）。
    this.dciNo = page.locator("#admin_customer_Player_dciNo");
    this.dciConfirmFlgRadios = page.locator(
      'input[name="admin_customer[Player][dciConfirmFlg]"]'
    );
    this.identificationFlgRadios = page.locator(
      'input[name="admin_customer[Player][identificationFlg]"]'
    );

    this.customerIdRow = page.locator('[title="' + "会員ID" + '"]'); // tooltip.customer.customer_id（要実機確認: 文言）
    this.orderHistoryCard = page.locator("#orderHistory");
    this.buyOrderHistoryCard = page.locator("#buyOrderHistory");
    this.deliveryCard = page.locator("#delivery");
    this.backToListLink = page.locator("a.c-baseLink");
    this.deliveryNewLink = page.locator('a[href*="/customer/"][href*="/delivery/new"]');
    this.pointSelectLink = page.locator('a[href*="/customer/"][href*="/point/select"]');
    this.mailHistoryLink = page.locator('a[href*="/customer/"][href*="/mail/history"]');
    this.manualMailLink = page.locator('a[href*="/customer/"][href*="/manual_mail"]');
    this.onlineIdentificationButton = page.locator(
      '[data-bs-target="#online_identification_detail"]'
    );
    this.onlineIdentificationModal = page.locator("#online_identification_detail");

    this.errors = page.locator(".invalid-feedback, .ec-errorMessage"); // 位置/クラスは要実機確認
  }

  newUrl(): string {
    return `/${ECCUBE_ADMIN_ROUTE}/customer/new`;
  }
  editUrl(id: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/customer/${id}/edit`;
  }

  /** 新規登録フォームを開く。レスポンスを返す（HTTPステータス検査用）。 */
  async gotoNew() {
    return await this.page.goto(this.newUrl());
  }

  /** 会員編集フォームを開く。レスポンスを返す（HTTPステータス検査用）。 */
  async gotoEdit(id: number | string) {
    return await this.page.goto(this.editUrl(id));
  }

  async clickRegister() {
    await this.registerButton.click();
  }

  /** 会員登録/編集フォームの主要UI部品（名前欄・登録ボタン・一覧戻り）が表示されること。 */
  async seeRegistrationForm() {
    await expect(this.name01).toBeVisible();
    await expect(this.email).toBeVisible();
    await expect(this.registerButton).toBeVisible();
    await expect(this.backToListLink).toBeVisible();
  }

  /** 編集画面の参照ブロック（購入履歴・買取履歴）が表示されること。 */
  async seeHistoryCards() {
    await expect(this.orderHistoryCard).toBeVisible();
    await expect(this.buyOrderHistoryCard).toBeVisible();
  }

  /** 編集画面の各機能導線（ポイント管理・送信履歴・手動メール・オンライン本人確認）が表示されること。 */
  async seeFunctionLinks() {
    await expect(this.pointSelectLink).toBeVisible();
    await expect(this.mailHistoryLink).toBeVisible();
    await expect(this.manualMailLink).toBeVisible();
    await expect(this.onlineIdentificationButton).toBeVisible();
  }

  /** 編集画面の配送先一覧カードと配送先追加導線（admin_customer_delivery_new）が表示されること（設計書 画面遷移:配送先一覧）。 */
  async seeDeliveryLink() {
    await expect(this.deliveryCard).toBeVisible();
    await expect(this.deliveryNewLink.first()).toBeVisible();
  }

  /**
   * 設計書「入力項目」が定義する拡張入力欄（国・会員グループ・本人確認ステータス・メールマガジン配信フラグ・
   * DCI登録本名・スマレジID(読取専用)・身分証有効期限・会員ステータス・ショップ用メモ）が表示されること。
   * 期待は設計書（入力項目表 :144-167）由来。表示の有無のみを観測し、値・制約はオラクル化しない。
   */
  async seeExtendedInputFields() {
    await expect(this.country).toBeVisible(); // 国 :144
    await expect(this.customerGroup).toBeVisible(); // 会員グループ :157
    await expect(this.identityConfirmStatusRadios.first()).toBeVisible(); // 本人確認ステータス :162
    await expect(this.mailMagazineFlgRadios.first()).toBeVisible(); // メールマガジン配信フラグ :165
    await expect(this.firstNameEn).toBeVisible(); // DCI登録本名(名) :159
    await expect(this.lastNameEn).toBeVisible(); // DCI登録本名(姓) :159
    await expect(this.smaregiId).toBeVisible(); // スマレジID(読取専用) :160
    await expect(this.idExpirationDate).toBeVisible(); // 身分証有効期限 :164
    await expect(this.status).toBeVisible(); // 会員ステータス :166
    await expect(this.note).toBeVisible(); // ショップ用メモ欄 :167
  }

  /**
   * 仕様（設計書 入力項目）が定義する DCIナンバー・DCI確認フラグ・本人確認フラグの各欄が存在すること。
   * 期待は設計書由来（オラクル独立）。現行刷新先は未実装のため本検証は失敗し、不具合候補#3 を検出する。
   */
  async expectSpecPlayerFieldsPresent() {
    await expect(this.dciNo).toBeVisible(); // 設計書 :158,243（入力項目: DCIナンバー）
    await expect(this.dciConfirmFlgRadios.first()).toBeVisible(); // 設計書 :161（入力項目: DCI確認フラグ）
    await expect(this.identificationFlgRadios.first()).toBeVisible(); // 設計書 :163,245（必須: 本人確認フラグ）
  }

  /**
   * 異常系で「対象項目以外の検証エラーで失敗する」偽陽性を避けるため、設計書で必須とされるコア項目に
   * 妥当値を投入する最小ベースライン。値は仕様の役割（必須コア＝名前・メール）由来。
   * 注: 本人確認ステータス/本人確認フラグ/会員グループも仕様上は必須選択（設計書 :245）だが、
   *     選択肢の妥当値はデータ依存のため要実機確認。フォームがそれら未選択で送信を弾く場合は本ベースラインの拡張が必要。
   */
  async fillMinimalRequired(opts?: { name?: boolean; email?: boolean }) {
    const o = { name: true, email: true, ...(opts ?? {}) };
    if (o.name) {
      await this.name01.fill("E2E姓");
      await this.name02.fill("E2E名");
    }
    if (o.email) {
      await this.email.fill(`e2e_base_${Date.now()}@example.com`);
    }
  }
}
