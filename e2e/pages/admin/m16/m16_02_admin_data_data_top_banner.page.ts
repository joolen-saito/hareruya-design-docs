import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 データ管理 — トップバナー管理 画面 Page Object。
 * 納品ケース表 integration_test/e2e/m16_02_admin_data_data_top_banner_e2e_cases.md に対応。
 *
 * 期待結果は仕様（設計書 functions/pf-eccube3/m16-02_admin_data_data_top_banner.md / 観点表
 * integration_test/integration-test-viewpoints.md）由来（オラクル独立性）。本Page Objectが保持するのは
 * Twig＋Symfony Form 由来のセレクタ（位置情報）のみで、合否は仕様で判定する。
 * messages.ja.yaml・validators.ja.yaml は実装由来のため「どこに何があるか」の出所メモ(位置情報)としてのみ参照し、
 * 表示文言そのものを期待値（オラクル）に固定しない。
 * 設計書(pf-eccube3)と実装(ec-cube-enterprise)のルート/フォーム名/検証場所の乖離はケース表 付帯表4 参照。
 *
 * ルートオラクル方針: 設計書(pf-eccube3)の入口は /{admin}/banner/top だが、刷新先 ec-cube-enterprise の
 * 実装ルートは /{admin}/data/top_banner（TopBannerController.php:52-53）。ナビゲーション（goto）は実装ルートを
 * 位置情報として用い、合否（操作の意味＝画面表示・保存・削除）は設計書で判定する（付帯表4#1・要確認）。
 *
 * DOM id 根拠（名前付きビルダー）:
 *  - バナー設定フォーム名 `top_banner`（TopBannerController.php:95）。スロットid は mtb_top_banner.id で動的（TopBannerType.php:70-128）:
 *      image_url_{id} → #top_banner_image_url_{id}（属性前方一致で先頭スロット参照）
 *      link_{id}      → #top_banner_link_{id}
 *      disp_type_{id} → #top_banner_disp_type_{id}（select）
 *      image_alt_{id} → #top_banner_image_alt_{id}
 *      sort_no_{id}   → #top_banner_sort_no_{id}
 *      language_{id}  → #top_banner_language_{id}_*（checkbox複数）
 *  - アップロードフォーム名 `top_banner_upload`（TopBannerController.php:98 / TopBannerUploadType.php:44-58）:
 *      base_info → #top_banner_upload_base_info（select）
 *      file      → #top_banner_upload_file
 *  - バナー設定ボタン「バナー設定」trans admin.data.top_banner.setting（top_banner.twig:160 / messages.ja.yaml:5793）
 *  - アップロードボタン「アップロード」trans admin.common.upload（top_banner.twig:261 / messages.ja.yaml:1458）
 *  - ▼画像設定アンカー a[href="#upload_wrap"]（top_banner.twig:164）
 *  - 一覧 URLコピー button.js-copy-url（top_banner.twig:339）/ 削除 a[data-method="delete"][data-message]（top_banner.twig:349-352）
 *  - フォームエラー .invalid-feedback（bootstrap_4_horizontal_layout.html.twig:55）/ JSアップロードエラー #top-banner-upload-error（top_banner.twig:259）
 */
export class DataDataTopBannerPage {
  readonly page: Page;
  readonly url: string; // バナー設定画面（実装ルート）

  // バナー設定フォーム（先頭スロットを属性前方一致で参照）
  readonly bannerForm: Locator;
  readonly settingButton: Locator; // 「バナー設定」
  readonly imageSettingAnchor: Locator; // 「▼画像設定」
  readonly firstImageUrl: Locator;
  readonly firstLink: Locator;
  readonly firstImageAlt: Locator;
  readonly firstSortNo: Locator;
  readonly firstDispType: Locator;
  readonly firstLanguage: Locator; // 言語チェックボックス（expanded multiple の個別input）
  readonly previewImages: Locator; // 各スロットのプレビュー画像（src=当該行 image_url 値）
  readonly formError: Locator; // .invalid-feedback（インラインフォームエラー）

  // アップロードフォーム / 一覧
  readonly uploadWrap: Locator;
  readonly uploadBaseInfo: Locator;
  readonly uploadFile: Locator;
  readonly uploadButton: Locator; // 「アップロード」
  readonly uploadJsError: Locator; // #top-banner-upload-error（JSによる必須エラー）
  readonly uploadTable: Locator; // .top-banner-upload-table
  readonly copyUrlButtons: Locator; // .js-copy-url「画像URLコピー」
  readonly deleteLinks: Locator; // a[data-method="delete"]
  readonly filterDetails: Locator; // 店舗絞り込み details/summary

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/data/top_banner`;

    this.bannerForm = page.locator('form[name="top_banner"]');
    this.settingButton = page.getByRole("button", { name: "バナー設定" });
    this.imageSettingAnchor = page.locator('a[href="#upload_wrap"]');
    this.firstImageUrl = page.locator('input[id^="top_banner_image_url_"]').first();
    this.firstLink = page.locator('input[id^="top_banner_link_"]').first();
    this.firstImageAlt = page.locator('input[id^="top_banner_image_alt_"]').first();
    this.firstSortNo = page.locator('input[id^="top_banner_sort_no_"]').first();
    this.firstDispType = page.locator('select[id^="top_banner_disp_type_"]').first();
    // 言語は ChoiceType(multiple+expanded) のため #top_banner_language_{id}_0 等の個別チェックボックスに展開される。
    this.firstLanguage = page.locator('input[id^="top_banner_language_"]').first();
    // プレビュー画像はバナー設定表内の img（src=TopBanner.imageUrl / top_banner.twig:177）。
    this.previewImages = page.locator(".top-banner-table img");
    this.formError = page.locator(".invalid-feedback");

    this.uploadWrap = page.locator("#upload_wrap");
    this.uploadBaseInfo = page.locator("#top_banner_upload_base_info");
    this.uploadFile = page.locator("#top_banner_upload_file");
    this.uploadButton = page.getByRole("button", { name: "アップロード" });
    this.uploadJsError = page.locator("#top-banner-upload-error");
    this.uploadTable = page.locator(".top-banner-upload-table");
    this.copyUrlButtons = page.locator(".js-copy-url");
    this.deleteLinks = page.locator('a[data-method="delete"]');
    this.filterDetails = page.locator(".top-banner-filter details");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** バナー設定画面の主要UI部品が仕様どおり表示されること。 */
  async seeBannerSettingForm() {
    await expect(this.settingButton).toBeVisible();
    await expect(this.imageSettingAnchor).toBeVisible();
    await expect(this.page.locator("body")).toContainText(
      "画像とリンク先を入力・変更してください"
    );
    await expect(this.page.locator("body")).toContainText("空欄にすると表示から削除されます");
  }

  /** 各スロットの入力欄（画像URL/リンク/言語/表示タイプ/alt/並び順）が表示されること。 */
  async seeSlotInputs() {
    await expect(this.firstImageUrl).toBeVisible();
    await expect(this.firstLink).toBeVisible();
    await expect(this.firstDispType).toBeVisible();
    await expect(this.firstImageAlt).toBeVisible();
    await expect(this.firstSortNo).toBeVisible();
    // 言語チェックボックスは custom 装飾で非表示化され得るため存在(attached)で確認する。
    await expect(this.firstLanguage).toBeAttached();
  }

  /** アップロード欄と画像一覧表が表示されること。 */
  async seeUploadBlock() {
    await expect(this.uploadBaseInfo).toBeVisible();
    await expect(this.uploadFile).toBeVisible();
    await expect(this.uploadButton).toBeVisible();
    await expect(this.uploadTable).toBeVisible();
  }

  /** バナー設定フォームを送信（成功/失敗どちらにも使う）。 */
  async submitBannerSetting() {
    await this.settingButton.first().click();
  }

  /** アップロードフォームを送信。 */
  async submitUpload() {
    await this.uploadButton.click();
  }
}
