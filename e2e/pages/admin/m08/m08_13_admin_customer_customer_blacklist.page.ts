import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 会員管理 — ブラックリスト登録/編集/削除 Page Object。
 * 画面タイプ: other（一覧＋登録/編集/削除フォームを同一画面で扱う。GET admin_customer_blacklist ・ POST admin_customer_blacklist_update）。
 *
 * 期待結果（合否）は仕様（正本md functions/pf-eccube3/m08-13_admin_customer_customer_blacklist.md・観点表・
 * 設計書が「画面文言は実装を確認値とする」と委譲した範囲で ec-cube-enterprise messages.ja.yaml）由来とする（オラクル独立性）。
 * 本ファイルが実装から取るのはセレクタ（位置情報）のみであり、必須/最大長/制約を期待結果へ流用しない。
 *
 * セレクタ根拠（ec-cube-enterprise 現行ソース。行番号は src 基準）:
 *  - DOM id は Symfony Form の getBlockPrefix='admin_customer_blacklist_update'（BlacklistUpdateType.php:117-120）由来。
 *    new_blacklist_tag → #admin_customer_blacklist_update_new_blacklist_tag（select。BlacklistTagType→MasterType。blacklist.twig:45）
 *    new_keyword       → #admin_customer_blacklist_update_new_keyword（blacklist.twig:49）
 *    _token            → #admin_customer_blacklist_update__token（blacklist.twig:30）
 *    一覧行 collection  → #admin_customer_blacklist_update_Blacklists_0_keyword 等（子 BlacklistType。blacklist.twig:64-83）
 *  - <form id="blacklist-form" action=admin_customer_blacklist_update>（blacklist.twig:26-27）
 *  - 登録ボタン button[type=submit] trans admin.common.registration=「登録」（blacklist.twig:99 / messages.ja.yaml:1436）
 *  - 行削除ボタン .delete-row-btn trans common.delete=「削除」（blacklist.twig:75 / messages.ja.yaml:19）/ hidden .delete-checkbox（blacklist.twig:79）
 *  - 説明文 admin.customer.blacklist.discription（blacklist.twig:41 / messages.ja.yaml:3853）
 *  - 見出し（サブタイトル/カード）admin.customer.blacklist_management=「ブラックリスト管理」（blacklist.twig:6,35 / messages.ja.yaml:3852）
 *  - 一覧見出し 項目=admin.customer.blacklist.blacklist_tag（blacklist.twig:59 / :3854）/ キーワード=...keyword（blacklist.twig:60 / :3855）
 *  - 電話番号項目は MtbBlacklistTag::TEL_ID=2（MtbBlacklistTag.php:32）。select option value=2。
 */
export class CustomerCustomerBlacklistPage {
  readonly page: Page;
  readonly listUrl: string;
  readonly updateUrl: string;

  readonly form: Locator; // #blacklist-form
  readonly newTag: Locator; // 新規 項目select
  readonly newKeyword: Locator; // 新規 キーワード入力
  readonly submitButton: Locator; // 登録 button[type=submit]
  readonly tagHeader: Locator; // 一覧見出し「項目」
  readonly keywordHeader: Locator; // 一覧見出し「キーワード」
  readonly rows: Locator; // .blacklist-row（既存行）
  readonly deleteRowButtons: Locator; // .delete-row-btn（行削除）
  readonly tokenField: Locator; // hidden _token（なりすまし対策トークン。blacklist.twig:30）

  // 電話番号項目の option value（MtbBlacklistTag::TEL_ID=2 / MtbBlacklistTag.php:32）。
  static readonly TEL_TAG_VALUE = "2";

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/customer/blacklist`;
    this.updateUrl = `/${ECCUBE_ADMIN_ROUTE}/customer/blacklist/update`;

    this.form = page.locator("#blacklist-form");
    this.newTag = page.locator("#admin_customer_blacklist_update_new_blacklist_tag");
    this.newKeyword = page.locator("#admin_customer_blacklist_update_new_keyword");
    this.submitButton = page.locator('#blacklist-form button[type="submit"]');
    // 一覧見出しは構造（columnheader role）で特定。見出し文言の合否判定（toContainText 等）は
    // spec 側が仕様由来の定数で行い、本POMには表示文言オラクルを持たない（オラクル独立性）。
    this.tagHeader = page.locator("#blacklist-form thead th").nth(0);
    this.keywordHeader = page.locator("#blacklist-form thead th").nth(1);
    this.rows = page.locator(".blacklist-row");
    this.deleteRowButtons = page.locator(".delete-row-btn");
    // なりすまし対策トークン（hidden）。位置情報のみ。存在確認に用い、値はオラクル化しない。
    this.tokenField = page.locator("#blacklist-form #admin_customer_blacklist_update__token");
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  async gotoUpdate() {
    await this.page.goto(this.updateUrl);
  }

  /** 既存行 i のキーワード入力欄。 */
  rowKeyword(index = 0): Locator {
    return this.page.locator(`#admin_customer_blacklist_update_Blacklists_${index}_keyword`);
  }

  /** 新規行を登録する。tagValue を渡すと項目を選択（未指定なら項目未選択のまま）。 */
  async registerNew(keyword: string, tagValue?: string) {
    if (tagValue !== undefined) {
      await this.newTag.selectOption(tagValue);
    }
    await this.newKeyword.fill(keyword);
    await this.submitButton.click();
  }

  /** 一覧画面の主要UI部品が仕様どおり表示されること（合否は仕様由来）。 */
  async seeListForm() {
    await expect(this.newTag).toBeVisible();
    await expect(this.newKeyword).toBeVisible();
    await expect(this.submitButton).toBeVisible();
    await expect(this.tagHeader).toBeVisible();
    await expect(this.keywordHeader).toBeVisible();
  }

  /** 指定のエラー文言がフォーム内に表示されること（合否文言は spec が仕様由来定数で渡す＝オラクル独立）。 */
  async seeError(message: string) {
    await expect(this.form).toContainText(message);
  }

  /** 指定の表示文言（入力ガイド・見出し等）が画面に表示されること（文言は spec が仕様由来定数で渡す）。 */
  async seeText(text: string) {
    await expect(this.page.locator("body")).toContainText(text);
  }

  /** 既存行 i のキーワードを value に書き換える（既存編集）。 */
  async editRowKeyword(value: string, index = 0) {
    await this.rowKeyword(index).fill(value);
    await this.submitButton.click();
  }
}
