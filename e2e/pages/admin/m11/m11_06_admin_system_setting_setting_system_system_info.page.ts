import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 設定 > システム設定 > システム情報 Page Object（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m11_06_admin_system_setting_setting_system_system_info_e2e_cases.md に対応。
 * 期待結果は仕様（正本 functions/ec-cube-enterprise/m11-06_admin_system_setting_setting_system_system_info.md /
 *   観点表 / 基本設計）由来（オラクル独立性）。実装からはセレクタ（位置情報）のみを取得する。
 *
 * 本機能はフォーム/POST/DB更新を持たない参照専用画面（SystemController.php:36-54 GET のみ）。
 * セレクタは Twig 由来の位置情報のみ。文言は messages.ja.yaml の trans キー由来であることを確認済み。
 *
 * 画面/ルート（ec-cube-enterprise コア SystemController.php）:
 *   - GET /%admin%/setting/system/system          （システム情報表示）
 *   - GET /%admin%/setting/system/system/phpinfo   （iframe src・phpinfo 有効時のみ・生HTML応答）
 *
 * DOM/セレクタ根拠（system.twig / 共通フレーム default_frame.twig）:
 *   - ページタイトル block title → h2.c-pageTitle__title（default_frame.twig:196 / 中身 system.twig:16 admin.setting.system.system_info）
 *   - サブタイトル block sub_title → span.c-pageTitle__subTitle（default_frame.twig:196 / 中身 system.twig:17 admin.setting.system）
 *   - カード見出し「システム情報」 trans admin.setting.system.system_info（system.twig:28 / messages.ja.yaml:2796）
 *   - ツールチップ title trans tooltip.setting.system.system_info（system.twig:27 / messages.ja.yaml:3496）
 *   - 問い合わせアイコン .fa-question-circle（system.twig:29）
 *   - 折りたたみトグル a[href="#systemInfo"][data-bs-toggle="collapse"]（system.twig:33）
 *   - 折りたたみ本文 #systemInfo（system.twig:40 class="collapse show"）
 *   - 各行ラベル/値 #server_info_box__value--{loop.index}（system.twig:49）
 *   - PHP情報カードヘッダ #php_info_box__header（system.twig:66・phpinfo_enabled 真時のみ）
 *   - PHP情報カード見出し「PHP情報」 trans admin.setting.system.system.php_info（system.twig:68 / messages.ja.yaml:3151）
 *   - PHP情報 iframe #php_info_box__frame iframe[name=php_info]（system.twig:74-75 src=admin_setting_system_system_phpinfo）
 *   - 行ラベル文言（messages.ja.yaml）: EC-CUBE:3145 / サーバーOS:3146 / DBサーバー:3147 / WEBサーバー:3148 / PHP:3149 / User Agent:3150
 */
export class SystemSettingSettingSystemSystemInfoPage {
  readonly page: Page;
  readonly url: string; // GET システム情報
  readonly phpinfoUrl: string; // GET phpinfo（iframe src）

  readonly pageTitle: Locator; // block title 出力先 h2.c-pageTitle__title（default_frame.twig:196）
  readonly pageSubTitle: Locator; // block sub_title 出力先 span.c-pageTitle__subTitle（default_frame.twig:196）
  readonly cardTitle: Locator; // システム情報カード見出し（system.twig:28）
  readonly tooltipIcon: Locator; // 問い合わせ（ツールチップ）アイコン（system.twig:29）
  readonly tooltipWrap: Locator; // ツールチップ data-bs-toggle 領域（system.twig:27）
  readonly collapseToggle: Locator; // 折りたたみトグル（system.twig:33）
  readonly collapseBody: Locator; // 折りたたみ本文 #systemInfo（system.twig:40）
  readonly infoBodyInner: Locator; // カード本文 #server_info_box__body_inner（system.twig:41）
  readonly valueCells: Locator; // 各行の値コンテナ（system.twig:49 連番 id）
  readonly phpInfoHeader: Locator; // PHP情報カードヘッダ #php_info_box__header（system.twig:66）
  readonly phpInfoFrame: Locator; // PHP情報 iframe（system.twig:75）

  // 仕様（処理フロー#2／業務ルール・計算）由来の行ラベル文言（messages.ja.yaml の trans 値）。
  readonly rowLabels = [
    "EC-CUBE",
    "サーバーOS",
    "DBサーバー",
    "WEBサーバー",
    "PHP",
    "User Agent",
  ];

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/setting/system/system`;
    this.phpinfoUrl = `/${ECCUBE_ADMIN_ROUTE}/setting/system/system/phpinfo`;

    this.pageTitle = page.locator(".c-pageTitle__title");
    this.pageSubTitle = page.locator(".c-pageTitle__subTitle");
    this.cardTitle = page.locator("#server_info_box__header .card-title");
    this.tooltipWrap = page.locator('#server_info_box__header [data-bs-toggle="tooltip"]');
    this.tooltipIcon = page.locator("#server_info_box__header .fa-question-circle");
    this.collapseToggle = page.locator('a[href="#systemInfo"][data-bs-toggle="collapse"]');
    this.collapseBody = page.locator("#systemInfo");
    this.infoBodyInner = page.locator("#server_info_box__body_inner");
    this.valueCells = page.locator('[id^="server_info_box__value--"]');
    this.phpInfoHeader = page.locator("#php_info_box__header");
    this.phpInfoFrame = page.locator('#php_info_box__frame iframe[name="php_info"]');
  }

  async goto() {
    await this.page.goto(this.url);
  }

  async gotoPhpinfo() {
    await this.page.goto(this.phpinfoUrl);
  }

  /** システム情報カードが仕様どおり表示されること（見出し＋本文）。 */
  async seeSystemInfoCard() {
    await expect(this.cardTitle).toContainText("システム情報");
    await expect(this.infoBodyInner).toBeVisible();
  }

  /** 6つの行ラベルが本文に表示されること（処理フロー#2の表示順の各ラベル）。 */
  async seeRowLabels() {
    for (const label of this.rowLabels) {
      await expect(this.infoBodyInner).toContainText(label);
    }
  }

  /**
   * 各行の値コンテナに連番に基づく識別子 server_info_box__value--N が付与されること。
   * 設計の固定ラベルは6件のため、連番 --1〜--6 が実在することを観測する
   * （prefix 件数だけでは連番性を検証できないため、各連番idの存在を確認する）。
   */
  async seeSequentialValueIds() {
    for (let i = 1; i <= this.rowLabels.length; i++) {
      await expect(this.page.locator(`#server_info_box__value--${i}`)).toHaveCount(1);
    }
  }

  /** 折りたたみトグルを押下する（Bootstrap collapse）。 */
  async toggleCollapse() {
    await this.collapseToggle.click();
  }
}
