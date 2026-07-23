import { APIResponse, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 コンテンツ管理 — 新着情報管理（m09-01）pilot Page Object。
 *
 * 目的: PILOT_m09_01_news_executable_grade.md の代表サブセット（表示/必須/最大長/文字長意味論/
 *       任意/URL形式）を稼働環境に対し実走するための到達・フォーム操作・直接POST契約(§6.1)を提供する。
 *
 * セレクタ根拠（ee 実ソース。live DOM でも実確認済み）:
 *  - フォームDOM id は Symfony Form getBlockPrefix='admin_news'（NewsType.php:108-111）由来:
 *    publish_date→#admin_news_publish_date / title→#admin_news_title / url→#admin_news_url /
 *    visible→#admin_news_visible / _token→#admin_news__token。
 *  - 一覧見出し: li.list-group-item 内 strong（news.twig:40,42,44）。
 *  - 明細行: li.sortable-item[data-id]（news.twig:48）。
 *  - 登録ボタン: button.btn-ec-conversion[type=submit]（news_edit.twig:137）。
 *
 * 本 Page が実装から取るのはセレクタ（位置情報）のみ。期待値は fixtures/oracle（L1オラクル）から取る。
 */
export class NewsPilotPage {
  readonly page: Page;
  readonly listUrl: string;
  readonly newUrl: string;

  readonly addNewButton: Locator;
  readonly listHeaderRow: Locator;
  readonly listItems: Locator;

  readonly form: Locator;
  readonly cardTitle: Locator;
  readonly publishDate: Locator;
  readonly title: Locator;
  readonly url: Locator;
  readonly linkMethod: Locator;
  readonly description: Locator;
  readonly visible: Locator;
  readonly tokenInput: Locator;
  readonly registerButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/content/news`;
    this.newUrl = `/${ECCUBE_ADMIN_ROUTE}/content/news/new`;

    this.addNewButton = page.locator("#addNew");
    this.listHeaderRow = page.locator("li.list-group-item").first();
    this.listItems = page.locator("li.sortable-item");

    this.form = page.locator("#form1");
    this.cardTitle = page.locator(".card-title");
    this.publishDate = page.locator("#admin_news_publish_date");
    this.title = page.locator("#admin_news_title");
    this.url = page.locator("#admin_news_url");
    this.linkMethod = page.locator("#admin_news_link_method");
    this.description = page.locator("#admin_news_description");
    this.visible = page.locator("#admin_news_visible");
    this.tokenInput = page.locator("#admin_news__token");
    this.registerButton = page.locator("button.btn-ec-conversion[type=submit]");
  }

  async gotoList(): Promise<APIResponse | null> {
    const res = await this.page.goto(this.listUrl);
    return res;
  }
  async gotoNew() {
    await this.page.goto(this.newUrl);
  }

  /** 現在の新規フォームの hidden/prefill 値を読む（直接POST契約 §6.1 用）。 */
  async readNewFormState(): Promise<{ token: string; publishDate: string; visibleValue: string }> {
    const token = (await this.tokenInput.inputValue()) ?? "";
    const publishDate = (await this.publishDate.inputValue()) ?? "";
    // visible は select。既定選択の value を取得（公開=既定）。
    const visibleValue = await this.visible.inputValue();
    return { token, publishDate, visibleValue };
  }

  async submitRegister() {
    await this.registerButton.click();
  }

  /** #admin_news_title の HTML5 制約検証結果を読む（valueMissing 等）。 */
  async titleValidity(): Promise<{ valueMissing: boolean; valid: boolean }> {
    return await this.title.evaluate((el) => {
      const i = el as HTMLInputElement;
      return { valueMissing: i.validity.valueMissing, valid: i.validity.valid };
    });
  }

  /**
   * §6.1 直接POST: 同一 BrowserContext（ログイン済 cookie 共有）で新規フォームを GET してトークン・
   * publish_date・visible を取得し、urlencoded で POST する。
   * fields で個別フィールドを上書き（検証対象のみ空/不正、他は有効値）。
   */
  async directPostNew(fields: {
    title?: string;
    url?: string;
    publishDate?: string;
    visible?: string;
    description?: string;
    linkMethod?: string;
  }): Promise<APIResponse> {
    await this.gotoNew();
    const state = await this.readNewFormState();

    const form: Record<string, string> = {
      "admin_news[_token]": state.token,
      "admin_news[publish_date]":
        fields.publishDate !== undefined ? fields.publishDate : state.publishDate,
      "admin_news[title]": fields.title !== undefined ? fields.title : "E2E-directpost-valid",
      "admin_news[visible]": fields.visible !== undefined ? fields.visible : state.visibleValue,
    };
    if (fields.url !== undefined) form["admin_news[url]"] = fields.url;
    if (fields.description !== undefined) form["admin_news[description]"] = fields.description;
    if (fields.linkMethod !== undefined) form["admin_news[link_method]"] = fields.linkMethod;

    // page.request は当該 BrowserContext の cookie を共有する（ログイン済セッション再利用）。
    return await this.page.request.post(this.newUrl, {
      form,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      maxRedirects: 0,
    });
  }

  /** 登録成功時のリダイレクト先URLから id を取り出す（/content/news/{id}/edit）。 */
  static extractIdFromEditUrl(url: string): number | null {
    const m = url.match(/\/content\/news\/(\d+)\/edit/);
    return m ? Number(m[1]) : null;
  }
}
