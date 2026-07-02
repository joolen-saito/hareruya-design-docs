import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注管理 店頭注文番号札管理（M05-27）Page Object。
 * 構造参考: ec-cube-enterprise/e2e-tests の既存 Page Object。本ファイルは設計書(正本 md)+Twig 由来の未実行雛形。
 * 期待結果は仕様(functions/pf-eccube3/m05-27_admin_order_order_waiting_tag.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * 実装(Twig/Form)から取得したのはセレクタ(位置情報)のみで、合否は仕様で判定する。
 *
 * セレクタ根拠:
 *  - 一覧/新規フォーム URL: admin_order_waiting_tag (WaitingTagController.php:47 GET/POST `/order/waiting_tag`)
 *  - 登録 POST URL: admin_order_waiting_tag_store (WaitingTagController.php:83 `/order/waiting_tag/new`)
 *  - DOM id は Symfony Form の getBlockPrefix=`waiting_tag`（WaitingTagType クラス名既定。waiting_tag.twig:24 `#waiting_tag_BaseInfo` で確認）由来。
 *    BaseInfo(店名)   → #waiting_tag_BaseInfo（waiting_tag.twig:57 form_widget(form.BaseInfo)）
 *    waiting_tag(英字) → #waiting_tag_waiting_tag（waiting_tag.twig:75 form_widget(form.waiting_tag)）
 *  - 新規フォーム form 要素: #add_new_waiting_tag（waiting_tag.twig:47）
 *  - 登録ボタン trans admin.common.registration=「登録」（waiting_tag.twig:86-88 / messages.ja.yaml:1436）。
 *    ログイン店舗選択時のみ描画（waiting_tag.twig:84 `form.BaseInfo.vars.value == BaseInfo.id`）。
 *  - 確認リンク trans admin.common.confirm=「確認」（waiting_tag.twig:93-95、target=_blank href `/{store}/waiting_number`）
 *  - 削除トリガ trans admin.common.delete=「削除」（waiting_tag.twig:120-125、data-bs-target=#DeleteModal）
 *  - 削除確認モーダル #DeleteModal（waiting_tag.twig:137）、確定アンカー data-method="delete"（waiting_tag.twig:156）
 *  - 一覧見出し trans admin.order.waiting_tag.list=「注文番号札」（waiting_tag.twig:106 / messages.ja.yaml:5485）
 *  - ページタイトル trans admin.order.waiting_tag.title=「店頭注文番号札管理」（waiting_tag.twig:15 / messages.ja.yaml:5484）
 *  - フラッシュ/フィールドエラーの専用セレクタは default_frame 側出力先のため `要実機確認`。spec ではテキスト存在で確認する。
 */
export class OrderOrderWaitingTagPage {
  readonly page: Page;
  readonly url: string; // 一覧・新規入力フォーム

  readonly newForm: Locator; // #add_new_waiting_tag（waiting_tag.twig:47）
  readonly baseInfoSelect: Locator; // #waiting_tag_BaseInfo（store プルダウン）
  readonly waitingTagInput: Locator; // #waiting_tag_waiting_tag（英字10文字）
  readonly registerButton: Locator; // 「登録」（waiting_tag.twig:86-88）
  readonly confirmLink: Locator; // 「確認」別タブ（waiting_tag.twig:93-95）
  readonly subTitle: Locator; // サブタイトル「受注管理」（default_frame.twig:196 .c-pageTitle__subTitle ← sub_title block twig:16）
  readonly listHeader: Locator; // 一覧見出し「注文番号札」（waiting_tag.twig:106）
  readonly listTable: Locator; // 一覧テーブル（waiting_tag.twig:103）
  readonly newCardTitle: Locator; // 新規枠見出し「新規登録」（waiting_tag.twig:66-68）
  readonly deleteModal: Locator; // #DeleteModal（waiting_tag.twig:137）
  readonly deleteModalConfirm: Locator; // モーダル確定 data-method=delete（waiting_tag.twig:156）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/order/waiting_tag`;

    this.newForm = page.locator("#add_new_waiting_tag");
    this.baseInfoSelect = page.locator("#waiting_tag_BaseInfo");
    this.waitingTagInput = page.locator("#waiting_tag_waiting_tag");
    this.registerButton = page.getByRole("button", { name: "登録" });
    this.confirmLink = page.locator('a[target="_blank"][href*="/waiting_number"]');
    this.subTitle = page.locator(".c-pageTitle__subTitle");
    this.listHeader = page.getByRole("columnheader", { name: "注文番号札" });
    this.listTable = page.locator("table.table");
    this.newCardTitle = page.locator(".card-title", { hasText: "新規登録" });
    this.deleteModal = page.locator("#DeleteModal");
    this.deleteModalConfirm = page.locator('#DeleteModal a[data-method="delete"]');
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 店頭注文番号札を入力して登録ボタンを押す。 */
  async fillAndRegister(tag: string) {
    await this.waitingTagInput.fill(tag);
    await this.registerButton.click();
  }

  /** 一覧に指定の札文字列を含む行があるか（間接永続化の観測）。 */
  rowByTag(tag: string): Locator {
    return this.listTable.locator("tr.sortable-item", { hasText: tag });
  }

  /** 指定の札の行の「削除」を押し、モーダル確定で DELETE を送信する。 */
  async deleteTag(tag: string) {
    const row = this.rowByTag(tag);
    await row.getByText("削除", { exact: true }).click();
    await expect(this.deleteModal).toBeVisible();
    await this.deleteModalConfirm.click();
  }

  /** 新規フォームの UI 部品が仕様どおり表示されること。 */
  async seeNewForm() {
    await expect(this.newCardTitle).toBeVisible();
    await expect(this.baseInfoSelect).toBeVisible();
    await expect(this.waitingTagInput).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }
}
