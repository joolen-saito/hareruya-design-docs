import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注編集 ショップ用メモ登録 Page Object（M05-16）。
 * 納品ケース表 integration_test/e2e/m05_16_admin_order_order_shop_memo_e2e_cases.md に対応。
 *
 * 期待結果は仕様(正本 functions/ec-cube-enterprise/m05-16_admin_order_order_shop_memo.md / 観点表 /
 * messages.ja.yaml)由来（オラクル独立性）。本Page Objectが保持するのは Twig＋Symfony Form 由来のセレクタ
 * （位置情報）のみで、必須/最大長などの制約は期待値に流用しない（制約の正は設計書・観点表）。
 * 本機能は標準機能で ec-cube-enterprise を正典とし、刷新先に受注編集画面（admin_order_edit）が実在し、
 * その右カラムにショップ用メモ欄カードが存在する。
 *
 * 画面・ルート（ec-cube-enterprise EditController.php:146-147）:
 *   GET  /%admin%/order/{id}/edit  既存受注の編集画面（ショップ用メモ欄に現行 dtb_order.note を初期表示）
 *   POST /%admin%/order/{id}/edit  mode=register で受注情報を保存（メモを同梱して dtb_order.note を更新）
 *   GET  /%admin%/order/new        新規受注の登録画面（ショップ用メモ欄は空）
 *
 * DOM id / セレクタ根拠: Symfony Form getBlockPrefix=`order`（OrderType.php:378-380）。フィールド note
 *  （OrderType.php:233 TextareaType / required=false / Assert\Length(max=eccube_ltext_len)）→ id=`order_note`。
 *  - ショップ用メモ欄テキストエリア note → #order_note（edit.twig:1794 form_widget(form.note,{rows:8})）
 *  - カード見出し「ショップ用メモ欄」trans admin.common.shop_memo（edit.twig:1787 / messages.ja.yaml:1639）
 *  - ツールチップ title trans tooltip.order.shop_memo（edit.twig:1787 / messages.ja.yaml:3420
 *      「店舗用メモを保存しておけます。フロント画面には表示されません。」）
 *  - 折りたたみリンク a[data-bs-toggle="collapse"][href="#freeArea"]（edit.twig:1789）
 *  - 本文領域 #freeArea（edit.twig:1792 class="collapse show"＝初期は展開）
 *  - 登録ボタン button[name="mode"][value="register"]（edit.twig:1167,1265 trans admin.order.register_order）
 *  - フラッシュ .alert-success / .alert-danger（@admin/alert.twig）
 *  - 受注一覧の編集導線 a.action-edit（受注一覧 list.twig。先頭受注を開く用途）
 *
 * 注: 検証失敗時のエラー表示位置・文言（インライン or 上部 alert）は OrderType が Length(max) のみで
 *     メッセージ未指定＝Symfony既定文言のため、項目直下セレクタは断定せず spec ではエラー要素の出現と
 *     編集画面滞留で判定する（付帯表4#2 要確認）。
 */
export class OrderOrderShopMemoPage {
  readonly page: Page;
  readonly listUrl: string; // 受注一覧 GET /{admin_route}/order
  readonly newUrl: string; // 新規受注登録 GET /{admin_route}/order/new

  readonly note: Locator; // #order_note ショップ用メモ欄テキストエリア
  readonly shopMemoCardTitle: Locator; // 見出し「ショップ用メモ欄」（admin.common.shop_memo）
  readonly freeArea: Locator; // #freeArea 本文領域（初期 collapse show＝展開）
  readonly collapseToggle: Locator; // 折りたたみリンク（#freeArea を開閉）
  readonly registerButton: Locator; // 登録（mode=register）
  readonly successFlash: Locator; // .alert-success
  readonly errorFlash: Locator; // .alert-danger
  readonly firstOrderEditLink: Locator; // 受注一覧 先頭受注の編集リンク

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/order`;
    this.newUrl = `/${ECCUBE_ADMIN_ROUTE}/order/new`;

    this.note = page.locator("#order_note");
    this.shopMemoCardTitle = page.locator("span.card-title", { hasText: "ショップ用メモ欄" });
    this.freeArea = page.locator("#freeArea");
    this.collapseToggle = page.locator('a[data-bs-toggle="collapse"][href="#freeArea"]');
    this.registerButton = page.locator('button[name="mode"][value="register"]').first();
    this.successFlash = page.locator(".alert-success");
    this.errorFlash = page.locator(".alert-danger");
    this.firstOrderEditLink = page.locator("a.action-edit").first();
  }

  editUrl(id: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/order/${id}/edit`;
  }

  /** 既存受注の編集画面を直接開く。 */
  async gotoEdit(id: string | number) {
    return this.page.goto(this.editUrl(id));
  }

  /** 新規受注の登録画面を開く。 */
  async gotoNew() {
    return this.page.goto(this.newUrl);
  }

  /** 受注一覧から先頭受注の編集画面を開く。受注が無ければ false。 */
  async openFirstOrderEdit(): Promise<boolean> {
    await this.page.goto(this.listUrl);
    if ((await this.firstOrderEditLink.count()) === 0) {
      return false;
    }
    await this.firstOrderEditLink.click();
    await expect(this.note).toBeVisible();
    return true;
  }

  /** ショップ用メモ欄の主要UI部品が仕様どおり表示されること（フロント挙動・表示要素）。 */
  async seeShopMemoCard() {
    await expect(this.shopMemoCardTitle).toBeVisible();
    await expect(this.note).toBeVisible();
  }

  /** メモ欄に入力する。 */
  async fillNote(text: string) {
    await this.note.fill(text);
  }

  /** mode=register で受注情報を保存する（メモを同梱）。 */
  async submitRegister() {
    await this.registerButton.click();
  }

  /** メモを入力して登録（保存）する。 */
  async fillNoteAndRegister(text: string) {
    await this.fillNote(text);
    await this.submitRegister();
  }

  /** メモ欄の現在値を取得する（初期表示・再表示の確認用）。 */
  async noteValue(): Promise<string> {
    return this.note.inputValue();
  }
}
