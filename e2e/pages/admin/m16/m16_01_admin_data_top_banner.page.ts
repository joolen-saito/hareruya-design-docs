import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 データ管理 — トップバナー管理（バナー設定）画面 Page Object。
 * 納品ケース表 integration_test/e2e/m16_01_admin_data_top_banner_e2e_cases.md に対応。
 *
 * 期待結果は仕様(設計書 functions/pf-eccube3/m16-01_admin_data_top_banner.md / 観点表 / messages.ja.yaml)由来
 * （オラクル独立性）。本Page Objectが保持するのは Twig＋Symfony Form 由来のセレクタ（位置情報）のみで、
 * 合否は仕様で判定する。
 *
 * 設計書(pf-eccube3 プラグイン)と実装(ec-cube-enterprise コア)の乖離（ケース表 付帯表4 参照）:
 *  - ルート: 設計 /{admin}/banner/top → 実装 /{admin}/data/top_banner（admin_data_top_banner）
 *  - フォーム名: 設計 hareruyaec_banner → 実装 top_banner / top_banner_upload
 *  - 絞り込み: 設計 {html_class}/mtb_shop → 実装 {base_info_digit}/dtb_base_info(shop_digit)
 *  ナビゲーション(goto)は実装ルートを位置情報として用いるが、合否の上位オラクルは設計書である。
 *
 * DOM id 根拠: Symfony Form createNamedBuilder('top_banner', ...)／('top_banner_upload', ...)
 *  （TopBannerController.php:94-101）。バナー枠フィールドは行 id を接尾（枠 id はシード依存のため prefix で特定）。
 *  - image_url_{id} → #top_banner_image_url_{id}（top_banner.twig:182）
 *  - link_{id}      → #top_banner_link_{id}（top_banner.twig:189）
 *  - disp_type_{id} → #top_banner_disp_type_{id}（top_banner.twig:206）
 *  - image_alt_{id} → #top_banner_image_alt_{id}（top_banner.twig:214）
 *  - language_{id}  → #top_banner_language_{id}_n（top_banner.twig:197 expanded checkbox）
 *  - sort_no_{id}   → #top_banner_sort_no_{id}（top_banner.twig:221）
 *  - upload file    → #top_banner_upload_file（top_banner.twig:257）
 *  - upload 店舗    → #top_banner_upload_base_info（top_banner.twig:248）
 *  - バナー設定ボタン trans admin.data.top_banner.setting「バナー設定」（top_banner.twig:160,234 / messages.ja.yaml:5793）
 *  - アップロードボタン trans admin.common.upload「アップロード」（top_banner.twig:261 / messages.ja.yaml:1458）
 *  - フィールドエラー .invalid-feedback（form_theme bootstrap_4_horizontal_layout top_banner.twig:18-19）
 *  - バナー全体エラー .errormsg.text-danger（top_banner.twig:167-169 bannerError）
 *  - アップロードJSエラー #top-banner-upload-error（top_banner.twig:259,104）
 *  - 絞り込みラベル .top-banner-filter__label / 項目 .top-banner-filter__menu .dropdown-item（top_banner.twig:273,301）
 *  - 削除リンク a[data-method="delete"]（data-message=admin.data.top_banner.delete_confirm top_banner.twig:349-354）
 */
export class DataTopBannerPage {
  readonly page: Page;
  readonly url: string; // 一覧（絞り込みなし）

  // バナー設定フォーム（枠 id はシード依存のため prefix セレクタで位置特定）
  readonly imageUrlInputs: Locator; // input[id^="top_banner_image_url_"]（twig:182）
  readonly linkInputs: Locator; // input[id^="top_banner_link_"]（twig:189）
  readonly dispTypeSelects: Locator; // [id^="top_banner_disp_type_"]（twig:206）
  readonly imageAltInputs: Locator; // input[id^="top_banner_image_alt_"]（twig:214）
  readonly languageChecks: Locator; // input[id^="top_banner_language_"]（twig:197）
  readonly sortNoInputs: Locator; // input[id^="top_banner_sort_no_"]（twig:221）
  readonly settingButton: Locator; // 「バナー設定」（twig:160,234）
  readonly previewImages: Locator; // 各枠プレビュー img（twig:177）

  // アップロードフォーム
  readonly uploadBaseInfo: Locator; // #top_banner_upload_base_info（twig:248）
  readonly uploadFile: Locator; // #top_banner_upload_file（twig:257）
  readonly uploadButton: Locator; // 「アップロード」（twig:261）
  readonly uploadJsError: Locator; // #top-banner-upload-error（twig:259）

  // 画像一覧テーブル・絞り込み・削除
  readonly fileListTable: Locator; // .top-banner-upload-table（twig:313）
  readonly filterLabel: Locator; // .top-banner-filter__label（twig:273）
  readonly filterMenuItems: Locator; // .top-banner-filter__menu .dropdown-item（twig:301）
  readonly filterAllItem: Locator; // 絞り込み「全て」項目（base 一覧へ戻るリンク twig:293-294）
  readonly filterSummary: Locator; // details > summary（twig:272）
  readonly uploadAnchor: Locator; // 「▼画像設定」ページ内アンカー a[href="#upload_wrap"]（twig:164）
  readonly uploadWrap: Locator; // #upload_wrap アップロード/一覧エリア（twig:240）
  readonly deleteLinks: Locator; // a[data-method="delete"]（twig:349）

  // エラー表示（合否は仕様、文言はフレームワーク/trans由来＝位置情報）
  readonly fieldError: Locator; // .invalid-feedback（Symfony Bootstrap4 form_errors）
  readonly bannerError: Locator; // .errormsg.text-danger（bannerError twig:168）
  readonly flashSuccess: Locator; // .alert-success（成功フラッシュ）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/data/top_banner`;

    this.imageUrlInputs = page.locator('input[id^="top_banner_image_url_"]');
    this.linkInputs = page.locator('input[id^="top_banner_link_"]');
    this.dispTypeSelects = page.locator('[id^="top_banner_disp_type_"]');
    this.imageAltInputs = page.locator('input[id^="top_banner_image_alt_"]');
    this.languageChecks = page.locator('input[id^="top_banner_language_"]');
    this.sortNoInputs = page.locator('input[id^="top_banner_sort_no_"]');
    // 文言は messages.ja.yaml の trans キー由来（位置情報）。合否は仕様で判定する。
    this.settingButton = page.getByRole("button", { name: "バナー設定" });
    this.previewImages = page.locator("table.top-banner-table img");

    this.uploadBaseInfo = page.locator("#top_banner_upload_base_info");
    this.uploadFile = page.locator("#top_banner_upload_file");
    this.uploadButton = page.getByRole("button", { name: "アップロード" });
    this.uploadJsError = page.locator("#top-banner-upload-error");

    this.fileListTable = page.locator(".top-banner-upload-table");
    this.filterLabel = page.locator(".top-banner-filter__label");
    this.filterMenuItems = page.locator(".top-banner-filter__menu .dropdown-item");
    // 「全て」項目は絞り込みなし base 一覧へのリンク（位置情報: dropdown-item で先頭=全て twig:293）。
    this.filterAllItem = page.locator(".top-banner-filter__menu .dropdown-item").first();
    this.filterSummary = page.locator(".top-banner-filter summary");
    this.uploadAnchor = page.locator('a[href="#upload_wrap"]');
    this.uploadWrap = page.locator("#upload_wrap");
    this.deleteLinks = page.locator('a[data-method="delete"]');

    this.fieldError = page.locator(".invalid-feedback");
    this.bannerError = page.locator(".errormsg.text-danger");
    this.flashSuccess = page.locator(".alert-success");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** バナー設定フォームを送信する。 */
  async submitSetting() {
    await this.settingButton.first().click();
  }

  /** アップロードフォームを送信する。 */
  async submitUpload() {
    await this.uploadButton.click();
  }

  /** トップバナー管理画面の主要UI部品が仕様どおり表示されること（表示検証）。 */
  async seeMainParts() {
    await expect(this.settingButton.first()).toBeVisible();
    await expect(this.uploadFile).toBeVisible();
    await expect(this.uploadButton).toBeVisible();
    await expect(this.fileListTable).toBeVisible();
  }

  /** 先頭バナー枠の各入力欄が表示されること（仕様の入力項目）。 */
  async seeFirstBannerRow() {
    await expect(this.imageUrlInputs.first()).toBeVisible();
    await expect(this.linkInputs.first()).toBeVisible();
    await expect(this.dispTypeSelects.first()).toBeVisible();
    await expect(this.imageAltInputs.first()).toBeVisible();
    await expect(this.languageChecks.first()).toHaveCount(1);
    await expect(this.sortNoInputs.first()).toBeVisible();
  }
}
