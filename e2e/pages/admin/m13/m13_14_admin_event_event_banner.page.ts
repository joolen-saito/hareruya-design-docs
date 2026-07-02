import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 イベント管理「バナー設定（イベントバナー管理）」Page Object（M13-14）。
 * 納品ケース表 integration_test/e2e/m13_14_admin_event_event_banner_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m13-14_admin_event_event_banner.md / 観点表)由来（オラクル独立性）。
 * 実装の現挙動・Form制約(min/max/NotBlank)・内部ルート名・Cookie名は期待値に流用しない。
 * セレクタ（位置情報）のみ刷新先 ec-cube-enterprise の Twig/Controller/FormType 由来で確定する。
 *
 * 画面構成（src/Eccube/Resource/template/admin/Event/banner.twig）:
 *  - 設定フォーム: form[name=event_banner]（form_start settingForm, banner.twig:159 ／ createNamedBuilder('event_banner') BannerController.php:254）
 *    各スロット入力欄 DOM id（block prefix=event_banner）: #event_banner_image_url_{n}(banner.twig:188 / EventBannerSettingType.php:84) /
 *    #event_banner_link_{n}(:195/:101) / #event_banner_disp_type_{n}(:202/:113) / #event_banner_image_alt_{n}(:227/:120) /
 *    #event_banner_sort_no_{n}(:234/:151) / base_info/language は複数選択
 *  - 「バナー設定」送信ボタン: button.js-event-banner-setting-submit（banner.twig:165,247 ／ trans admin.event.banner.setting_submit="バナー設定" messages.ja.yaml:5609。type=button → JSで並び順検証後 form.submit()）
 *  - アップロードフォーム: form[name=event_banner_upload]（banner.twig:256 ／ createNamed('event_banner_upload') BannerController.php:269）
 *    #event_banner_upload_file(banner.twig:259 / EventBannerUploadType.php:38) / #event_banner_upload_baseInfos(banner.twig:258 / :42) /
 *    アップロードボタン trans admin.event.banner.upload_submit="アップロード"(banner.twig:263 / :5626) / エラー .errormsg(banner.twig:265)
 *  - 画像一覧: table.table-striped、見出し trans list_image/list_updated/list_url/list_delete(banner.twig:300-303 / :5631-5634)
 *  - 店舗絞り込み: .dropdown-toggle（banner.twig:273 ／ trans admin.event.banner.filter_all="全て" :5630）
 *  - 削除リンク: a[data-method=delete] data-message=delete_confirm(banner.twig:327,330 / :5636) ＋ csrf_token_for_anchor()
 *
 * ルート（src/Eccube/Controller/Admin/Event/BannerController.php）:
 *  - 一覧/設定画面 admin_event_banner = GET /<route>/event/banner（:57）／ admin_event_banner_narrow = GET /<route>/event/banner/{htmlClass}（:58）
 *  - 設定保存 admin_event_banner_settings = POST /<route>/event/banner/settings（:71）→ flash admin.common.save_complete（:80）→ 303 redirect（:343-349）
 *  - 画像アップロード = POST /<route>/event/banner/image/upload（:91）→ flash admin.common.upload_complete（:109）
 *  - 画像削除 admin_event_banner_delete = DELETE /<route>/event/banner/delete（:121）→ flash admin.common.delete_complete（:157）
 *
 * 仕様乖離メモ（テストは仕様どおりに書き、期待値を実装へ書き換えない。付帯表4 参照）:
 *  - 設計書の路由表記は /banner/event だが刷新先実装は /event/banner（位置情報として実パスを使用）。
 *  - 設計書は単純なバナーCRUD想定だが、刷新先は S3 画像アップロード/削除が中核（成功系はS3外部依存=手動）。
 *  - 並び順 必須/重複はクライアントJSが先行ブロック（alert）、範囲外のみサーバ検証へ到達する。
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class EventEventBannerPage {
  readonly page: Page;
  readonly indexUrl: string; // バナー設定（イベントバナー管理）画面
  readonly settingsPath: string; // 設定保存 POST ルート
  readonly uploadPath: string; // 画像アップロード POST ルート

  readonly settingForm: Locator; // 設定フォーム form[name=event_banner]
  readonly settingSubmit: Locator; // 「バナー設定」ボタン（type=button・JS送信）
  readonly uploadForm: Locator; // アップロードフォーム form[name=event_banner_upload]
  readonly uploadFile: Locator; // #event_banner_upload_file
  readonly uploadShop: Locator; // #event_banner_upload_baseInfos
  readonly uploadSubmit: Locator; // 「アップロード」ボタン
  readonly uploadError: Locator; // .errormsg（アップロードエラー文言）
  readonly fileListTable: Locator; // 画像一覧 table.table-striped
  readonly filterToggle: Locator; // 店舗絞り込みドロップダウン
  readonly deleteLinks: Locator; // 画像削除リンク a[data-method=delete]

  constructor(page: Page) {
    this.page = page;
    this.indexUrl = `/${ECCUBE_ADMIN_ROUTE}/event/banner`;
    this.settingsPath = `/${ECCUBE_ADMIN_ROUTE}/event/banner/settings`;
    this.uploadPath = `/${ECCUBE_ADMIN_ROUTE}/event/banner/image/upload`;

    this.settingForm = page.locator('form[name="event_banner"]');
    this.settingSubmit = page.locator(".js-event-banner-setting-submit").first();
    this.uploadForm = page.locator('form[name="event_banner_upload"]');
    this.uploadFile = page.locator("#event_banner_upload_file");
    this.uploadShop = page.locator("#event_banner_upload_baseInfos");
    this.uploadSubmit = page.getByRole("button", { name: "アップロード" });
    this.uploadError = page.locator(".errormsg");
    this.fileListTable = page.locator("table.table-striped");
    this.filterToggle = page.locator(".dropdown-toggle").first();
    this.deleteLinks = page.locator('a[data-method="delete"]');
  }

  /** 店舗絞り込みURL（/event/banner/{htmlClass}）を組み立てる。 */
  narrowUrl(htmlClass: string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/event/banner/${htmlClass}`;
  }

  /** バナー設定（イベントバナー管理）画面を開く。 */
  async goto() {
    await this.page.goto(this.indexUrl);
  }

  /** 店舗で絞り込んだ設定画面を開く。 */
  async gotoNarrow(htmlClass: string) {
    await this.page.goto(this.narrowUrl(htmlClass));
  }

  /** スロットの入力欄 Locator。 */
  imageUrl(slot: number): Locator {
    return this.page.locator(`#event_banner_image_url_${slot}`);
  }
  link(slot: number): Locator {
    return this.page.locator(`#event_banner_link_${slot}`);
  }
  sortNo(slot: number): Locator {
    return this.page.locator(`#event_banner_sort_no_${slot}`);
  }
  dispType(slot: number): Locator {
    // 表示タイプ（ChoiceType/select）。block prefix=event_banner（EventBannerSettingType.php:113）。
    return this.page.locator(`#event_banner_disp_type_${slot}`);
  }
  imageAlt(slot: number): Locator {
    // 画像alt（TextType）。EventBannerSettingType.php:120。
    return this.page.locator(`#event_banner_image_alt_${slot}`);
  }
  language(slot: number): Locator {
    // 言語（ChoiceType・複数選択）。EventBannerSettingType.php:125。
    return this.page.locator(`#event_banner_language_${slot}`);
  }
  baseInfo(slot: number): Locator {
    // 表示店舗（EntityType・複数）。EventBannerSettingType.php:138。
    return this.page.locator(`#event_banner_base_info_${slot}`);
  }

  /** 「バナー設定」ボタンを押下して送信する（実装は type=button → JS検証後 form.submit()）。 */
  async submitSettings() {
    await this.settingSubmit.click();
  }

  /** 設定画面のUI部品（タイトル・設定/アップロードフォーム・一覧）が仕様どおり表示されること。 */
  async seeIndexScreen() {
    // タイトルは block title（trans admin.event.banner_page）由来。仕様の表示名で確認する。
    await expect(this.page.locator("body")).toContainText("イベントバナー管理");
    await expect(this.uploadForm).toBeVisible();
    await expect(this.fileListTable).toBeVisible();
  }

  /**
   * 設定フォームの入力欄が表示されること（スロット1を代表に確認）。
   * 仕様(入力項目: 画像URL・リンク先URL・表示タイプ・言語・表示店舗・画像alt・並び順)の各欄が
   * 描画されることを確認する。言語・表示店舗は複数選択ウィジェットのため可視ではなく DOM 存在で確認する。
   */
  async seeSettingForm() {
    await expect(this.settingForm).toBeVisible();
    await expect(this.imageUrl(1)).toBeVisible();
    await expect(this.link(1)).toBeVisible();
    await expect(this.dispType(1)).toBeVisible();
    await expect(this.imageAlt(1)).toBeVisible();
    await expect(this.sortNo(1)).toBeVisible();
    await expect(this.language(1)).toBeAttached();
    await expect(this.baseInfo(1)).toBeAttached();
    await expect(this.settingSubmit).toBeVisible();
  }

  /** アップロード欄の部品が表示されること。 */
  async seeUploadForm() {
    await expect(this.uploadFile).toBeVisible();
    await expect(this.uploadShop).toBeVisible();
    await expect(this.uploadSubmit).toBeVisible();
  }

  /** 画像一覧テーブルの見出しが表示されること（仕様の表示名で確認）。 */
  async seeFileListHeaders() {
    const head = this.fileListTable.locator("thead");
    await expect(head).toContainText("画像");
    await expect(head).toContainText("更新日付");
    await expect(head).toContainText("画像URL");
    await expect(head).toContainText("削除");
  }
}
