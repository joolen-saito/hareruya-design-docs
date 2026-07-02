import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 コンテンツ管理 支店トップページ管理（M09-10）Page Object。
 * 納品ケース表 integration_test/e2e/m09_10_admin_content_content_branch_top_page_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/pf-eccube3/m09-10_admin_content_content_branch_top_page.md / 観点表)の挙動由来（オラクル独立性）。
 *
 * 設計源は旧 pf-eccube3（ec-cube カスタマイズ app/Customize/.../Integration/TopPage*、ルート admin_integration_toppage_management）。
 * 刷新先 ec-cube-enterprise では同一機能が src/Eccube/Controller/Admin/Content/BranchTopPageController.php
 *（ルート admin_content_branch_toppage / _select / _register、URL /{admin_route}/content/branch_toppage）として再実装。
 * E2Eは刷新先の実URL/セレクタで観測し、合否は設計書由来で判定する。URL・支店選択方式・成功文言の乖離はケース表 付帯表4。
 * セレクタは Twig＋Symfony Form 由来の位置情報のみ。ec-cube-enterprise の Playwright は本リポジトリでは実行不可（未実行雛形）。
 *
 * DOM id 接頭辞: Symfony Form getBlockPrefix()='branch_toppage_management'（BranchTopPageManagementType.php:126-129）。
 *  各フィールド id は `branch_toppage_management_<field>`。ただし Twig で一部 id を上書き。
 *
 * セレクタ根拠（src/Eccube/Resource/template/admin/Content/branch_toppage.twig / branch_toppage_tile.twig / Form/Type/.../BranchTopPage*Type.php）:
 *  - フォーム                 → #branch_toppage_management_form（branch_toppage.twig:173 action=admin_content_branch_toppage_register）
 *  - 支店選択セレクト          → #branch-selector（branch_toppage.twig:185 attr id上書き / Form branch_list mapped=false）
 *  - 支店共通設定チェック       → #common-setting（branch_toppage.twig:197/199 id上書き。is_common_branch 真で disabled）
 *  - バナー画像 hidden        → #branch_toppage_management_banner_image（branch_toppage.twig:215）
 *  - 画像ファイル入力          → #branch_toppage_management_image_file（branch_toppage.twig:210 mapped=false）
 *  - バナーリンクタグ          → #branch_toppage_management_banner_image_tag（branch_toppage.twig:221）
 *  - タイル位置/属性/タグ      → #branch_toppage_management_Tiles_{i}_section / _tileType / _tag（branch_toppage.twig:114 JS参照）
 *  - サムネイル領域            → #thumb（branch_toppage.twig:207）/ ファイル選択 #file_select（:208）
 *  - タイル集合                → #tiles（branch_toppage.twig:225）
 *  - 登録ボタン                → button[type=submit] trans admin.common.registration「登録」(branch_toppage.twig:242 / messages.ja.yaml:1436)
 *  - 支店選択カード見出し       → 「支店選択」trans ...select_branch（branch_toppage.twig:180 / messages.ja.yaml:3865）
 *  - トップページ設定カード見出し → 「トップページ設定」（branch_toppage.twig:191 固定文言）
 *  - ファイル選択ラベル         → 「ファイルを選択」trans admin.common.file_select（branch_toppage.twig:211 / messages.ja.yaml:1553）
 *  - バナーリンクタグ ラベル     → 「バナーリンクタグ」trans ...banner_image_tag（branch_toppage.twig:219 / messages.ja.yaml:3869）
 *  - タイル行ラベル            → 「タイル位置/タイル属性/タイルタグ」trans ...section/...tile_type/...tag（branch_toppage_tile.twig:3,10,17 / messages.ja.yaml:3870-3872）
 *  - 見出し                   → block title trans admin.content.branch_toppage_management「支店トップページ管理」(branch_toppage.twig:15 / messages.ja.yaml:3864) ※出力先h要素は default_frame 依存で要実機確認
 *  - フォームエラー領域         → .alert.alert-danger（branch_toppage.twig:163 form_errors）。addError 系（バナー/重複/タグ）の出力先は default_frame フラッシュ＝要実機確認のためテキスト存在で判定
 *
 * 仕様由来の表示文言（messages.ja.yaml の i18n リテラルはオラクル化せず、設計書が定める挙動の確認補助として用いる）:
 *  - 保存完了は「管理画面共通の保存完了文言」（設計 表示メッセージ）。刷新の admin.common.save_complete=「保存しました」（付帯表4#3）。
 *  - バナー画像未指定エラー（支店共通設定無効＋既存/新規画像なし）は設計「バナーイメージファイルを指定してください。」。
 *    S3保存結果が空のときのみ設計「バナー画像の登録に失敗しました。」（messages.ja.yaml:3873）。
 *    刷新実装は両者を後者へ統合（付帯表4#4）。実装統合文言はオラクル化せず、設計文言の表示で判定する。
 *  - タイル位置重複「タイル位置に重複があります。すべてのタイルは異なる位置を選択してください。」（設計／:3874）。
 *  - タイルタグ未設定「タイルタグを設定してください」（設計／:3875。括弧半角/全角差は付帯表4#5。部分一致で判定）。
 */
export class ContentContentBranchTopPagePage {
  readonly page: Page;
  readonly url: string;

  readonly form: Locator; // #branch_toppage_management_form
  readonly branchSelector: Locator; // #branch-selector
  readonly commonSetting: Locator; // #common-setting
  readonly bannerImageHidden: Locator; // #branch_toppage_management_banner_image
  readonly imageFile: Locator; // #branch_toppage_management_image_file
  readonly bannerImageTag: Locator; // #branch_toppage_management_banner_image_tag
  readonly fileSelect: Locator; // #file_select
  readonly thumb: Locator; // #thumb
  readonly tiles: Locator; // #tiles
  readonly registerButton: Locator; // button[type=submit]「登録」
  readonly selectBranchCardHeader: Locator; // card-header「支店選択」
  readonly topPageCardHeader: Locator; // card-header「トップページ設定」
  readonly errorAlert: Locator; // .alert.alert-danger（form_errors）

  constructor(page: Page) {
    this.page = page;
    // 刷新先の実URL（設計の /integration/toppage_management/{id} とは乖離。付帯表4#1）。
    this.url = `/${ECCUBE_ADMIN_ROUTE}/content/branch_toppage`;

    this.form = page.locator("#branch_toppage_management_form");
    this.branchSelector = page.locator("#branch-selector");
    this.commonSetting = page.locator("#common-setting");
    this.bannerImageHidden = page.locator("#branch_toppage_management_banner_image");
    this.imageFile = page.locator("#branch_toppage_management_image_file");
    this.bannerImageTag = page.locator("#branch_toppage_management_banner_image_tag");
    this.fileSelect = page.locator("#file_select");
    this.thumb = page.locator("#thumb");
    this.tiles = page.locator("#tiles");
    this.registerButton = page.getByRole("button", { name: "登録" });
    this.selectBranchCardHeader = page.locator(".card-header", { hasText: "支店選択" });
    this.topPageCardHeader = page.locator(".card-header", { hasText: "トップページ設定" });
    this.errorAlert = page.locator(".alert.alert-danger");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** サイドメニュー（コンテンツ管理 > 支店トップページ管理）から遷移する。親メニュー展開は要実機確認。 */
  async gotoViaMenu() {
    // 親「コンテンツ管理」を開いてから子リンクを押下する（メニュー展開セレクタは default_frame 依存＝要実機確認）。
    await this.page.getByRole("link", { name: "コンテンツ管理" }).first().click();
    await this.page.getByRole("link", { name: "支店トップページ管理" }).first().click();
  }

  /** i番目のタイル行のタイル位置セレクト。 */
  tileSection(i: number): Locator {
    return this.page.locator(`#branch_toppage_management_Tiles_${i}_section`);
  }

  /** i番目のタイル行のタイル属性セレクト。 */
  tileType(i: number): Locator {
    return this.page.locator(`#branch_toppage_management_Tiles_${i}_tileType`);
  }

  /** i番目のタイル行のタイルタグセレクト。 */
  tileTag(i: number): Locator {
    return this.page.locator(`#branch_toppage_management_Tiles_${i}_tag`);
  }

  async submitRegister() {
    await this.registerButton.click();
  }

  /** 支店トップページ管理画面の主要部品が仕様どおり表示されること（見出し＋登録ボタン）。 */
  async seeManagementScreen() {
    // 見出しの出力先h要素は要実機確認のため、body テキスト存在で設計の見出し文言を確認する。
    await expect(this.page.locator("body")).toContainText("支店トップページ管理");
    await expect(this.registerButton).toBeVisible();
  }

  /** 支店選択カード・トップページ設定カードが表示されること。 */
  async seeCards() {
    await expect(this.selectBranchCardHeader).toBeVisible();
    await expect(this.topPageCardHeader).toBeVisible();
  }

  /** バナー画像欄（ファイル選択）とバナーリンクタグ欄が表示されること。 */
  async seeBannerArea() {
    await expect(this.page.locator("body")).toContainText("ファイルを選択");
    await expect(this.page.locator("body")).toContainText("バナーリンクタグ");
    await expect(this.bannerImageTag).toBeAttached();
  }

  /** タイル設定行のラベル（タイル位置/タイル属性/タイルタグ）が表示されること。 */
  async seeTileLabels() {
    const body = this.page.locator("body");
    await expect(body).toContainText("タイル位置");
    await expect(body).toContainText("タイル属性");
    await expect(body).toContainText("タイルタグ");
  }
}
