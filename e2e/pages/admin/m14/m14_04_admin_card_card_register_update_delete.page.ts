import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 カード管理 > 新規登録・編集・削除（詳細フォーム）Page Object（独立クラス形）。
 * 納品ケース表 integration_test/e2e/m14_04_admin_card_card_register_update_delete_e2e_cases.md に対応。
 *
 * 期待結果は仕様（正本 functions/pf-eccube3/m14-04_admin_card_card_register_update_delete.md / 観点表 / 基本設計）由来（オラクル独立性）。
 * 設計源は pf-eccube3 の HareruyaEc プラグイン（リバース設計）。刷新先 ec-cube-enterprise との乖離は付帯表4（不具合候補）で管理し、
 * テストは仕様どおりに書く（実装が違えば落ちて検出する）。本リポジトリでは Playwright を実行しない（構造参考のもとの未実行雛形）。
 *
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_card`（CardType.php:217-220）由来の位置情報のみ。
 *
 * ルート（CardController.php）:
 *  - 新規 GET|POST  admin_card_new    = /%eccube_admin_route%/card/new（:192）
 *  - 編集 GET|POST  admin_card_edit   = /%eccube_admin_route%/card/{id}/edit（:204）
 *  - 削除 DELETE     admin_card_delete = /%eccube_admin_route%/card/{id}/delete（:269）
 *  - 一覧            admin_card_list   = /%eccube_admin_route%/card（:64）
 *  ※ 設計書(pf-eccube3)は 新規POST=/card・編集GET/更新POST=/card/{id}・削除=/card/{id} を想定。刷新先はルート体系が異なる（付帯表4#1）。
 *    本POMはフォーム送信ボタン/リンクを操作するため action 差分に依存しない。
 *
 * DOM id 根拠（getBlockPrefix=admin_card / edit.twig・detail_row.twig）:
 *  - nameJp（カード名(日)・任意）       → #admin_card_nameJp（edit.twig:121 / CardType:50-56 Length）
 *  - nameEn（カード名(英)・必須）       → #admin_card_nameEn（edit.twig:122 / CardType:57-64 NotBlank+Length）
 *  - arenaFormatNameJp/En               → #admin_card_arenaFormatNameJp / _arenaFormatNameEn（edit.twig:123-124）
 *  - textJp/textEn（textarea）          → #admin_card_textJp / _textEn（edit.twig:125-126）
 *  - manaCost（任意）                   → #admin_card_manaCost（edit.twig:128 / CardType:93-99）
 *  - cmc（点数で見たマナコスト・必須）  → #admin_card_cmc（edit.twig:129 / CardType:100-116 NotBlank+Regex+Type numeric, html5 number）
 *  - power/toughness/loyalty            → #admin_card_power / _toughness / _loyalty（edit.twig:132-134）
 *  - colors/colorIdentities（任意・複数チェック）→ #admin_card_colors / _colorIdentities（edit.twig:140-141 expanded）
 *  - cardtypes/subtypes/specialtypes（select2・任意）→ #admin_card_cardtypes ほか（edit.twig:137,144-145）
 *  - colorSequence（色順・select 任意）→ #admin_card_colorSequence（edit.twig:148）
 *  - isSticker（checkbox 任意）         → #admin_card_isSticker（edit.twig:149）
 *  - _token（CSRF）                     → #admin_card__token（edit.twig:110）
 *  - 登録/更新ボタン type=submit trans admin.common.registration=「登録」（edit.twig:226-228 / messages.ja.yaml:1436）
 *  - 戻る（カード一覧）リンク trans admin.product.card_list=「カード一覧」（edit.twig:212-214 / messages.ja.yaml:3944）→ admin_card_list?resume=1
 *  - 削除トリガ a.btn-ec-delete[data-bs-target="#DeleteModal"]（edit.twig:217 / 編集時=card.id not null のみ表示）
 *  - 削除モーダル #DeleteModal（delete_modal.twig:2）／確定 a.btn-ec-delete[data-method="delete"]（delete_modal.twig:21-24）／取消 [data-bs-dismiss]（:18）
 *  - 基本情報カード見出し h3.card-title「カード新規登録:基本情報」/「カード編集:基本情報」（edit.twig:118 / admin.product.card_new=:3947 / card_edit=:3946）
 *  - 詳細削除ボタン .delete-item ラベル「この詳細情報を削除」（detail_row.twig:58）。※リーガリティ行も .delete-item（ラベル「×」edit.twig:160,166）のためラベルで限定する
 *  - 削除不可文言 .text-danger trans admin.card_detail.form.undeletable（detail_row.twig:60 / messages.ja.yaml:3994）
 *  - フィールドエラー .invalid-feedback（bootstrap_4_horizontal_layout.html.twig:55 非rootform）
 *  - 成功フラッシュ .alert-success（alert.twig:22 / addSuccess admin.common.save_complete=「保存しました」CardController:250 / delete_complete=「削除しました」:300）
 *  - 失敗フラッシュ .alert-danger（alert.twig:32,42 / 削除ブロック admin.card.delete.error_foreign_key CardController:285 / 詳細削除不可 admin.common.delete_error :235）
 *
 * 刷新先 ec-cube-enterprise のフォームに無い項目（設計書=pf-eccube3 のみ）: 旧商品ID(old_product_id/old_en_product_id) は
 *   刷新先 CardType に存在しない（付帯表4#6）。現行画面項目の確認には用いない（オラクル独立性）。
 */
export class CardCardRegisterUpdateDeletePage {
  readonly page: Page;
  readonly newUrl: string; // 新規登録 URL
  readonly listUrl: string; // カード一覧 URL（戻り先）

  readonly nameJp: Locator; // カード名(日)（任意）
  readonly nameEn: Locator; // カード名(英)（必須）
  readonly cmc: Locator; // 点数で見たマナコスト（必須・数値）
  readonly registerButton: Locator; // 登録/更新ボタン（type=submit）
  readonly backLink: Locator; // 戻る「カード一覧」リンク
  readonly basicInfoTitle: Locator; // 基本情報カード見出し h3.card-title
  readonly deleteTrigger: Locator; // 削除モーダル起動リンク（編集時のみ）
  readonly deleteModal: Locator; // 削除モーダル本体
  readonly deleteConfirm: Locator; // モーダル内 削除確定リンク
  readonly deleteCancel: Locator; // モーダル内 キャンセル
  readonly fieldError: Locator; // .invalid-feedback フィールドエラー
  readonly successFlash: Locator; // .alert-success 成功フラッシュ
  readonly errorFlash: Locator; // .alert-danger 失敗フラッシュ
  readonly detailDeleteButtons: Locator; // 各詳細「この詳細情報を削除」ボタン
  readonly undeletableNote: Locator; // 商品紐付き詳細の削除不可文言

  constructor(page: Page) {
    this.page = page;
    this.newUrl = `/${ECCUBE_ADMIN_ROUTE}/card/new`;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/card`;

    this.nameJp = page.locator("#admin_card_nameJp");
    this.nameEn = page.locator("#admin_card_nameEn");
    this.cmc = page.locator("#admin_card_cmc");
    // 送信ボタンは form#form1 内 type=submit（リーガリティ追加/詳細追加は type=button のため除外）。
    this.registerButton = page.locator('form#form1 button[type="submit"]');
    this.backLink = page.getByRole("link", { name: "カード一覧" });
    this.basicInfoTitle = page.locator("h3.card-title").first();
    this.deleteTrigger = page.locator('a.btn-ec-delete[data-bs-target="#DeleteModal"]');
    this.deleteModal = page.locator("#DeleteModal");
    this.deleteConfirm = page.locator('#DeleteModal a[data-method="delete"]');
    this.deleteCancel = page.locator('#DeleteModal [data-bs-dismiss="modal"]').first();
    this.fieldError = page.locator(".invalid-feedback");
    this.successFlash = page.locator(".alert-success");
    this.errorFlash = page.locator(".alert-danger");
    // 詳細削除ボタンは、リーガリティ行の汎用 .delete-item（ラベル「×」edit.twig:160,166）と
    // DOM上は同一class（.delete-item）のため、仕様の期待ラベル「この詳細情報を削除」（ケース表012の期待結果由来）で限定する。
    this.detailDeleteButtons = page.getByRole("button", { name: "この詳細情報を削除" });
    this.undeletableNote = page.locator("span.text-danger");
  }

  /** 新規登録フォームを開く。 */
  async gotoNew() {
    await this.page.goto(this.newUrl);
  }

  /** 既存カードの編集フォームを開く。 */
  async gotoEdit(id: number | string) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/card/${id}/edit`);
  }

  /** 編集フォームへ任意のパス（存在しないID等）でアクセスし HTTP 応答を返す。 */
  async gotoEditRaw(id: number | string) {
    return this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/card/${id}/edit`);
  }

  /** カード名(英)・点数で見たマナコストを入力する（必要最小の必須項目）。 */
  async fillRequired(nameEn: string, cmc: string) {
    await this.nameEn.fill(nameEn);
    await this.cmc.fill(cmc);
  }

  /** 登録/更新ボタンを押下する。 */
  async submit() {
    await this.registerButton.click();
  }

  /** 新規フォームの主要UI部品が仕様どおり表示されること（削除リンクは無いこと）。 */
  async seeNewForm() {
    await expect(this.nameEn).toBeVisible();
    await expect(this.cmc).toBeVisible();
    await expect(this.registerButton).toBeVisible();
    await expect(this.deleteTrigger).toHaveCount(0); // 新規は削除リンク無し
  }

  /** 削除モーダルを開く（編集画面）。 */
  async openDeleteModal() {
    await this.deleteTrigger.click();
    await expect(this.deleteModal).toBeVisible();
  }
}
