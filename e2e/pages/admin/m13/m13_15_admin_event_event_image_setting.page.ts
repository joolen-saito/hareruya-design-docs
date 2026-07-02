import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 イベント管理「イベントバナー画像設定（アップロード・一覧・削除）」Page Object（M13-15）。
 * 納品ケース表 integration_test/e2e/m13_15_admin_event_event_image_setting_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m13-15_admin_event_event_image_setting.md / 観点表)由来（オラクル独立性）。
 * 設計源は pf-eccube3（旧Hareruyaプラグイン）のリバースだが、基本設計/観点表を上位オラクルとし、
 * 刷新先 ec-cube-enterprise に当該画面の存在を確認済み:
 *   一覧 admin_event_banner        = GET /<route>/event/banner（BannerController.php:57）
 *   絞り込み admin_event_banner_narrow = GET /<route>/event/banner/{htmlClass}（BannerController.php:58）
 *   アップロード admin_event_banner_image_upload = POST /<route>/event/banner/image/upload（BannerController.php:91）
 *   削除 admin_event_banner_delete  = DELETE /<route>/event/banner/delete（BannerController.php:121）
 * 実装の現挙動・Form制約（baseInfos の NotBlank 等）・表示文言は期待値に流用しない（セレクタ＝位置情報のみ取得）。
 *
 * セレクタ根拠（src/Eccube/Resource/template/admin/Event/banner.twig ＋ Form/Type/Admin/Event/EventBannerUploadType.php）:
 *  - アップロード枠:     #upload_wrap（banner.twig:254）
 *  - 画像ファイル選択:    #event_banner_upload_file（banner.twig:259 / EventBannerUploadType.php:38 FileType `file`、フォーム名 event_banner_upload は BannerController.php:269 createNamed 由来）
 *  - 店舗セレクト:        #event_banner_upload_baseInfos（banner.twig:258 / EventBannerUploadType.php:42 EntityType `baseInfos`）
 *  - アップロードボタン:   trans admin.event.banner.upload_submit=「アップロード」（banner.twig:263 / messages.ja.yaml:5626）
 *  - アップロードエラー:   p.text-danger.errormsg（banner.twig:265、uploadError 表示）
 *  - 一覧表:             table.table-striped（banner.twig:297）、見出し trans list_image/list_updated/list_url/list_delete（banner.twig:300-303 / :5631-5634）
 *  - 店舗絞り込みトグル:   .dropdown-toggle（banner.twig:273）、全て trans admin.event.banner.filter_all（banner.twig:282 / :5630）
 *  - 画像URLコピー:      a.js-event-banner-copy-url trans copy_url=「画像URLコピー」（banner.twig:320 / :5635）
 *  - 削除リンク:          a[data-method="delete"] trans 削除、data-message=delete_confirm（banner.twig:327,330 / :5636）
 *  - タイトル:           trans admin.event.banner_page=「イベントバナー管理」（banner.twig:15 / :5607）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class EventEventImageSettingPage {
  readonly page: Page;
  readonly url: string; // 全店舗のイベントバナー管理画面

  readonly uploadWrap: Locator; // #upload_wrap（アップロード枠）
  readonly fileInput: Locator; // 画像ファイル選択欄
  readonly shopSelect: Locator; // 店舗セレクト
  readonly uploadButton: Locator; // 「アップロード」ボタン
  readonly uploadError: Locator; // アップロードエラー（p.text-danger.errormsg）
  readonly listTable: Locator; // 保管済み画像一覧表
  readonly filterToggle: Locator; // 店舗絞り込みドロップダウンのトグル
  readonly shopFilterItems: Locator; // 絞り込みドロップダウン内の項目（全て＋各店舗）
  readonly copyUrlLinks: Locator; // 画像URLコピーのリンク
  readonly deleteLinks: Locator; // 削除リンク
  readonly modals: Locator; // 表示中のモーダル（本機能専用モーダルは無い想定）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/event/banner`;

    this.uploadWrap = page.locator("#upload_wrap");
    this.fileInput = page.locator("#event_banner_upload_file");
    this.shopSelect = page.locator("#event_banner_upload_baseInfos");
    // 「アップロード」ボタンは upload 枠内の type=submit。バナー設定の「バナー設定」ボタン(type=button)とは文言で区別。
    this.uploadButton = this.uploadWrap.getByRole("button", { name: "アップロード" });
    this.uploadError = this.uploadWrap.locator("p.text-danger.errormsg");
    this.listTable = this.uploadWrap.locator("table.table-striped");
    this.filterToggle = this.uploadWrap.locator(".dropdown-toggle");
    this.shopFilterItems = this.uploadWrap.locator(".dropdown-menu .dropdown-item");
    this.copyUrlLinks = this.uploadWrap.locator("a.js-event-banner-copy-url");
    this.deleteLinks = this.uploadWrap.locator('a[data-method="delete"]');
    this.modals = this.uploadWrap.locator(".modal.show");
  }

  /** 店舗絞り込みURL（既知の htmlClass 配下の一覧）。 */
  narrowUrl(htmlClass: string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/event/banner/${htmlClass}`;
  }

  /** 全店舗のイベントバナー管理画面を開く。 */
  async goto() {
    await this.page.goto(this.url);
  }

  /** 店舗絞り込みのイベントバナー管理画面を開く。 */
  async gotoNarrow(htmlClass: string) {
    await this.page.goto(this.narrowUrl(htmlClass));
  }

  /** アップロードボタンを押下する（送信）。 */
  async submitUpload() {
    await this.uploadButton.click();
  }

  /**
   * 画像ファイルを選択してアップロードする。
   * file 省略時はファイル未選択のままアップロードを試みる（必須バリデーション検証用）。
   */
  async upload(file?: { name: string; mimeType: string; buffer: Buffer }) {
    if (file !== undefined) {
      await this.fileInput.setInputFiles(file);
    }
    await this.submitUpload();
  }

  /** 画像設定枠（アップロードフォーム）の主要UI部品が表示されること（仕様: フロント挙動「表示要素」）。 */
  async seeUploadForm() {
    await expect(this.uploadWrap).toBeVisible();
    await expect(this.fileInput).toBeVisible();
    await expect(this.shopSelect).toBeVisible();
    await expect(this.uploadButton).toBeVisible();
  }

  /** 保管済み画像一覧表の見出しが表示されること（画像・更新日付・画像URL・削除）。 */
  async seeListHeaders() {
    await expect(this.listTable).toBeVisible();
    const headers = this.listTable.locator("thead th");
    await expect(headers.filter({ hasText: "画像" }).first()).toBeVisible();
    await expect(headers.filter({ hasText: "更新日付" })).toBeVisible();
    await expect(headers.filter({ hasText: "画像URL" })).toBeVisible();
    await expect(headers.filter({ hasText: "削除" })).toBeVisible();
  }

  /** アップロードに失敗してエラー領域が表示され、同画面に留まっていること（合否は仕様由来＝再描画滞留）。 */
  async seeUploadError() {
    await expect(this.uploadError).toBeVisible();
    await expect(this.page).toHaveURL(new RegExp(`/${ECCUBE_ADMIN_ROUTE}/event/banner`));
  }

  /** 店舗絞り込みドロップダウンを開く。 */
  async openFilter() {
    await this.filterToggle.click();
  }

  /** 店舗絞り込みドロップダウンから「全て」以外の店舗を1件選択する（店舗絞り込みGETへ遷移）。 */
  async selectShopFilter() {
    await this.openFilter();
    await this.shopFilterItems.filter({ hasNotText: "全て" }).first().click();
  }

  /** 本機能専用のモーダル（表示中）が存在しないこと（設計: フロント挙動「モーダル・ポップアップ＝無い」）。 */
  async seeNoVisibleModal() {
    await expect(this.uploadWrap).toBeVisible();
    await expect(this.modals).toHaveCount(0);
  }
}
