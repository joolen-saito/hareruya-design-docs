import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 コンテンツ管理 — 新着情報管理（一覧 / 新規登録・編集）Page Object。
 * 画面タイプ: other（list ＋ register_edit/crud ＋ delete モーダル）。
 *
 * 期待結果（合否）は仕様（正本md functions/ec-cube-enterprise/m09-01_admin_content_content_news.md・観点表・
 * ec-cube-enterprise確認値 messages.ja.yaml）由来とする（オラクル独立性）。本ファイルが実装から取るのは
 * セレクタ（位置情報）のみであり、必須/最大長/制約は期待結果に流用しない。
 *
 * セレクタ根拠（ec-cube-enterprise 現行ソース。行番号は src 基準）:
 *  - フォームDOM id は Symfony Form の getBlockPrefix='admin_news'（NewsType.php:108-110）由来。
 *    publish_date→#admin_news_publish_date / title→#admin_news_title / url→#admin_news_url /
 *    link_method→#admin_news_link_method / description→#admin_news_description / visible→#admin_news_visible /
 *    _token→#admin_news__token。
 *  一覧（news.twig）:
 *  - 新規作成ボタン: a#addNew trans admin.common.create__new=「新規作成」（news.twig:32-33 / messages.ja.yaml:1454）
 *  - 見出し行: li.list-group-item 内 strong（公開日時 news.twig:40 / 公開状態 :42 / タイトル :44）
 *  - 明細行: li.sortable-item[data-id]（news.twig:48）/ タイトルリンク a href=admin_content_news_edit（:53-54）
 *  - 編集アイコン: a.btn-ec-actionIcon href=admin_content_news_edit（news.twig:59-60 title=admin.common.edit）
 *  - 削除アイコン: a.btn-ec-actionIcon[data-bs-target="#delete_{id}"]（news.twig:68-69）
 *  - 削除モーダル: div.modal#delete_{id}（news.twig:73）/ 見出し h5.modal-title trans admin.common.delete_modal__title=「削除します」（:79 / messages.ja.yaml:1592）
 *  - モーダル本文: p trans admin.common.delete_modal__message（対象タイトル%name%差込）（news.twig:86 / messages.ja.yaml:1593）
 *  - キャンセル: button.btn-ec-sub trans admin.common.cancel（news.twig:89-90）
 *  - 削除実行: a.btn-ec-delete href=admin_content_news_delete data-method=delete（news.twig:91-94 / csrf_token_for_anchor）
 *  編集（news_edit.twig）:
 *  - form#form1 method=post（news_edit.twig:22）/ form._token→#admin_news__token（:23）
 *  - カード見出し: span.card-title trans admin.content.news.news_registration=「新着情報登録」（news_edit.twig:31 / messages.ja.yaml:2754）
 *  - 公開日時: #admin_news_publish_date（form_widget :48 / DateTimeType single_text NewsType.php:43-47）
 *  - タイトル: #admin_news_title（:61）/ URL: #admin_news_url（:73）/ 別ウィンドウで開く: #admin_news_link_method（:81 checkbox）
 *  - 本文: #admin_news_description（:93 textarea rows=8）/ 公開状態: #admin_news_visible（:133 select）
 *  - URLツールチップ: div[title=tooltip.content.news.url]（news_edit.twig:68 / messages.ja.yaml:3433）
 *  - 本文ツールチップ: div[title=tooltip.content.news.body]（news_edit.twig:88 / messages.ja.yaml:3434）
 *  - 新着情報管理リンク: a.c-baseLink href=admin_content_news（news_edit.twig:125-127）
 *  - 登録ボタン: button.btn-ec-conversion[type=submit] trans admin.common.registration=「登録」（news_edit.twig:137 / messages.ja.yaml:1436）
 *
 * 注: 検証エラーの表示位置は form_theme bootstrap_4_horizontal_layout 依存のため専用セレクタは創作しない。
 *   エラー観測は仕様文言（「入力されていません。」「不正な日付です。」等 = validators.ja.yaml）の本文存在＋
 *   「保存成功フラッシュが出ない／編集画面に留まる」を主観測とする（オラクルは仕様＝検証失敗で保存されない）。
 */
export class ContentContentNewsPage {
  readonly page: Page;
  readonly listUrl: string;
  readonly newUrl: string;

  // 一覧
  readonly addNewButton: Locator; // a#addNew「新規作成」
  readonly listHeaderRow: Locator; // li.list-group-item（見出し行）
  readonly listItems: Locator; // li.sortable-item

  // 編集
  readonly form: Locator; // #form1
  readonly cardTitle: Locator; // .card-title「新着情報登録」
  readonly publishDate: Locator; // #admin_news_publish_date
  readonly title: Locator; // #admin_news_title
  readonly url: Locator; // #admin_news_url
  readonly linkMethod: Locator; // #admin_news_link_method
  readonly description: Locator; // #admin_news_description
  readonly visible: Locator; // #admin_news_visible
  readonly registerButton: Locator; // button.btn-ec-conversion「登録」
  readonly backToListLink: Locator; // a.c-baseLink「新着情報管理」
  readonly urlTooltip: Locator; // URL見出しツールチップ
  readonly bodyTooltip: Locator; // 本文見出しツールチップ

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/content/news`;
    this.newUrl = `/${ECCUBE_ADMIN_ROUTE}/content/news/new`;

    // 一覧
    this.addNewButton = page.locator("#addNew");
    this.listHeaderRow = page.locator("li.list-group-item").first();
    this.listItems = page.locator("li.sortable-item");

    // 編集
    this.form = page.locator("#form1");
    this.cardTitle = page.locator(".card-title");
    this.publishDate = page.locator("#admin_news_publish_date");
    this.title = page.locator("#admin_news_title");
    this.url = page.locator("#admin_news_url");
    this.linkMethod = page.locator("#admin_news_link_method");
    this.description = page.locator("#admin_news_description");
    this.visible = page.locator("#admin_news_visible");
    this.registerButton = page.locator("button.btn-ec-conversion[type=submit]");
    this.backToListLink = page.locator("a.c-baseLink", { hasText: "新着情報管理" });
    this.urlTooltip = page.locator('[title="この新着情報の詳細な内容を記したウェブページある場合、URLを入力します。外部サイトのURLなどを利用することもできます。"]');
    this.bodyTooltip = page.locator('[title="HTMLタグが利用可能です。"]');
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }
  async gotoNew() {
    await this.page.goto(this.newUrl);
  }
  /** 既存編集画面（id指定）へ遷移する。 */
  async gotoEdit(id: string) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/content/news/${id}/edit`);
  }

  /** 一覧の見出し3列が仕様どおり表示されること。 */
  async seeListHeader() {
    await expect(this.listHeaderRow).toContainText("公開日時");
    await expect(this.listHeaderRow).toContainText("公開状態");
    await expect(this.listHeaderRow).toContainText("タイトル");
  }

  /** 新規編集画面の主要入力部品が仕様どおり表示されること。 */
  async seeEditForm() {
    await expect(this.cardTitle).toContainText("新着情報登録");
    await expect(this.publishDate).toBeVisible();
    await expect(this.title).toBeVisible();
    await expect(this.url).toBeVisible();
    await expect(this.linkMethod).toBeVisible();
    await expect(this.description).toBeVisible();
    await expect(this.visible).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }

  /** 編集フォームへ値を入力する（指定したフィールドのみ）。 */
  async fillEdit(values: {
    publishDate?: string;
    title?: string;
    url?: string;
    linkMethod?: boolean;
    description?: string;
    visible?: "公開" | "非公開";
  }) {
    if (values.publishDate !== undefined) await this.publishDate.fill(values.publishDate);
    if (values.title !== undefined) await this.title.fill(values.title);
    if (values.url !== undefined) await this.url.fill(values.url);
    if (values.linkMethod !== undefined) {
      if (values.linkMethod) await this.linkMethod.check();
      else await this.linkMethod.uncheck();
    }
    if (values.description !== undefined) await this.description.fill(values.description);
    if (values.visible !== undefined) await this.visible.selectOption({ label: values.visible });
  }

  async submitRegister() {
    await this.registerButton.click();
  }

  /** 一覧の指定IDの編集アイコンを押し、当該編集画面へ遷移する（news.twig:59-60 a.btn-ec-actionIcon href=admin_content_news_edit）。 */
  async clickEditIcon(id: string) {
    await this.page
      .locator(`li.sortable-item[data-id="${id}"] a.btn-ec-actionIcon[href*="/edit"]`)
      .click();
  }

  /** 一覧の指定IDの削除アイコンを押し、確認モーダルを開く。 */
  async openDeleteModal(id: string) {
    await this.page.locator(`a[data-bs-target="#delete_${id}"]`).click();
  }
  deleteModal(id: string): Locator {
    return this.page.locator(`#delete_${id}`);
  }
}
