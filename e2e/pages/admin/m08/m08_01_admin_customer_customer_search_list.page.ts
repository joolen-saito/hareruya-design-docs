import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 会員管理 会員検索/一覧（M08-01）Page Object。
 * 納品ケース表 integration_test/e2e/m08_01_admin_customer_customer_search_list_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/pf-eccube3/m08-01_admin_customer_customer_search_list.md / 観点表)の挙動由来（オラクル独立性）。
 * pf-eccube3(HareruyaEcプラグイン)由来の設計だが、刷新先 ec-cube-enterprise に同一画面
 * (admin_customer / Customer/index.twig / SearchCustomerType)が実在するためセレクタを導出した。
 * セレクタは Twig＋Symfony Form 由来の位置情報のみ。合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * DOM id 接頭辞: Symfony Form getBlockPrefix()='admin_search_customer'（SearchCustomerType.php:576-579）。
 *  各フィールド id は `admin_search_customer_<field>`。
 *
 * セレクタ根拠（src/Eccube/Resource/template/admin/Customer/index.twig / Form/Type/Admin/SearchCustomerType.php / Controller/Admin/Customer/CustomerController.php）:
 *  - 検索フォーム          → #search_form（index.twig:41 form method=post action=""＝/customer へPOST）
 *  - フリーワード入力       → #admin_search_customer_multi（index.twig:49 / Form:60-67）
 *  - フリーワード案内label  → label trans admin.customer.multi_search_label「会員ID・メールアドレス・お名前」(index.twig:48 / messages.ja.yaml:2554)
 *  - 詳細検索トグル         → [href="#searchDetail"] trans admin.common.search_detail（index.twig:52 / messages.ja.yaml:1537）
 *  - 検索条件クリア          → .search-clear trans admin.customer.clear_search「検索条件をクリア」(index.twig:342-343 / messages.ja.yaml:2596)
 *  - 検索ボタン             → #search_form button[type=submit] trans admin.common.search「検索」(index.twig:370)
 *  - 件数見出し             → #search_form span.fw-bold trans admin.common.search_result（index.twig:371-372。pagination 真のときのみ）
 *  - 一覧テーブル            → #search_form table.table（index.twig:435。totalItemCount>0 のときのみ）
 *  - 一覧行                 → tr[id^="ex-customer-"]（index.twig:450）
 *  - 0件/検証失敗カード      → .card .text-muted.h5（0件 index.twig:561 admin.common.search_no_result / 検証失敗 index.twig:552 admin.common.search_invalid_condition）
 *      ※両カードは見出しセレクタを共有するが if/elseif の相互排他分岐（has_errors→検証失敗 / pagination有→0件 index.twig:549-565）。
 *        構造差で識別可能: 0件カードは .text-muted を3行（見出し+条件変更案内+詳細検索案内 index.twig:561-564）、検証失敗は2行（index.twig:552-553）。
 *        文言(i18n)はオラクルにせず、この行数構造で0件/検証失敗を独立観測する。
 *  - 表示件数プルダウン      → #page_count_pulldown（index.twig:400。option value=path admin_customer_page page_count:403）
 *  - CSVダウンロード導線      → a[href*="/customer/export"]（index.twig:415 url admin_customer_export。結果あり時のみ）
 *  - 会員編集導線            → a.action-edit（index.twig:467-468 url admin_customer_edit /customer/{id}/edit）
 *  - メール履歴導線           → td a[href*="mail_history"]（index.twig:459 url admin_customer_mail_history）
 *  - 会員削除導線            → a[data-method="delete"][href*="/delete"]（index.twig:529 url admin_customer_delete /customer/{id}/delete・DELETE。確認はBootstrapモーダル 付帯表4#9）
 *  - メール通知導線           → a[href*="manual_mail"]（index.twig:483 操作メニュー内 url admin_customer_manual_mail＝手動メール通知 M08-08）
 *  - 仮会員メール再送導線      → a[href*="/resend"]（index.twig:504 url admin_customer_resend /customer/{id}/resend。仮会員ステータスID1のときのみ・モーダル内 設計書「業務ルール 一覧の操作導線」）
 *  - メール一括送信導線        → a.target-action[href*="/customer/mail"]（index.twig:427 url admin_customer_mail＝メール一括送信 M08-08）
 *  - ソート部品(hidden)       → #admin_search_customer_sortkey / _sorttype（SearchCustomerType.php:518-525 HiddenType。一覧見出し a.js-listSort で更新 index.twig:439-440）
 *  - 保存パターンリンク        → a[href*="/customer/pattern/"]（index.twig:380 url admin_customer_search_pattern）
 *  - 検索パターン名入力        → #admin_search_customer_pattern_name（index.twig:65 / Form:480-484 placeholder「検索パターン名」）
 *  - 検索パターンID(hidden)   → #admin_search_customer_pattern_id（index.twig:64 / Form:477-479）
 *  - 検索条件保存ボタン        → #search_form .submit[data-action*="save/pattern"] trans admin.customer.save_pattern「検索条件保存」(index.twig:68-69 / messages.ja.yaml:2594)
 *  - 検索条件削除ボタン        → #search_form .submit[data-method="delete"] trans admin.customer.delete_pattern「検索条件削除」(index.twig:72-77。pattern_id 設定時のみ表示 / messages.ja.yaml:2595)
 *  - 詳細条件 買取総額(開始)   → #admin_search_customer_sell_total_start（index.twig:232 / Form:392-403 Regex \d+ attr min=1）
 *  - 詳細条件 登録日(開始/終了) → #admin_search_customer_create_date_start / _create_date_end（index.twig:155,160）
 *  - 詳細条件 MTG本名         → #admin_search_customer_dci_name（index.twig:325 / Form:497-507 Length max eccube_dci_name_len）
 */
export class CustomerCustomerSearchListPage {
  readonly page: Page;
  readonly url: string; // 会員マスターの入口 GET /{admin_route}/customer

  readonly searchForm: Locator;
  readonly multi: Locator;
  readonly multiLabel: Locator;
  readonly searchDetailToggle: Locator;
  readonly clearLink: Locator;
  readonly searchButton: Locator;

  readonly countHeading: Locator;
  readonly resultTable: Locator;
  readonly resultRows: Locator;
  readonly messageCard: Locator; // 0件/検証失敗カードの見出し（.card .text-muted.h5・両分岐で共有）
  readonly messageCardBody: Locator; // 同カード本体（.text-muted 行数で0件=3/検証失敗=2を構造識別）
  readonly pageCountPulldown: Locator;
  readonly csvExportLink: Locator;
  readonly editLinks: Locator;
  readonly mailHistoryLinks: Locator;
  readonly deleteLinks: Locator; // 会員削除導線（admin_customer_delete）
  readonly manualMailLinks: Locator; // メール通知導線（admin_customer_manual_mail M08-08）
  readonly resendLinks: Locator; // 仮会員メール再送導線（admin_customer_resend・仮会員のみ表示）
  readonly bulkMailLink: Locator; // メール一括送信導線（admin_customer_mail M08-08）
  readonly sortKeyHidden: Locator; // ソートキー hidden（sortkey）
  readonly sortLinks: Locator; // 一覧見出しのソートリンク（js-listSort）
  readonly patternLinks: Locator;

  readonly patternNameInput: Locator;
  readonly patternIdHidden: Locator;
  readonly savePatternButton: Locator;
  readonly deletePatternButton: Locator;

  // 詳細条件（アコーディオン展開後に操作）
  readonly sellTotalStart: Locator;
  readonly createDateStart: Locator;
  readonly createDateEnd: Locator;
  readonly dciName: Locator;

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/customer`;

    this.searchForm = page.locator("#search_form");
    this.multi = page.locator("#admin_search_customer_multi");
    this.multiLabel = page.locator("label", {
      hasText: "会員ID・メールアドレス・お名前",
    });
    this.searchDetailToggle = page.locator('[href="#searchDetail"]');
    this.clearLink = page.locator("#search_form .search-clear");
    this.searchButton = page.locator('#search_form button[type="submit"]');

    this.countHeading = page.locator("#search_form span.fw-bold");
    this.resultTable = page.locator("#search_form table.table");
    this.resultRows = page.locator('tr[id^="ex-customer-"]');
    this.messageCard = page.locator(".card .text-muted.h5");
    this.messageCardBody = page
      .locator(".card .card-body")
      .filter({ has: page.locator(".text-muted.h5") });
    this.pageCountPulldown = page.locator("#page_count_pulldown");
    this.csvExportLink = page.locator('a[href*="/customer/export"]');
    this.editLinks = page.locator("a.action-edit");
    this.mailHistoryLinks = page.locator('td a[href*="mail_history"]');
    // 会員削除導線: href が /delete で終わる aタグ（パターン削除は .submit[data-action] のため href では一致しない）。
    this.deleteLinks = page.locator('a[data-method="delete"][href*="/delete"]');
    this.manualMailLinks = page.locator('a[href*="manual_mail"]');
    this.resendLinks = page.locator('a[href*="/resend"]');
    this.bulkMailLink = page.locator('a.target-action[href*="/customer/mail"]');
    this.sortKeyHidden = page.locator("#admin_search_customer_sortkey");
    this.sortLinks = page.locator("a.js-listSort");
    this.patternLinks = page.locator('a[href*="/customer/pattern/"]');

    this.patternNameInput = page.locator("#admin_search_customer_pattern_name");
    this.patternIdHidden = page.locator("#admin_search_customer_pattern_id");
    this.savePatternButton = page.locator(
      '#search_form .submit[data-action*="save/pattern"]'
    );
    this.deletePatternButton = page.locator(
      '#search_form .submit[data-method="delete"]'
    );

    this.sellTotalStart = page.locator("#admin_search_customer_sell_total_start");
    this.createDateStart = page.locator("#admin_search_customer_create_date_start");
    this.createDateEnd = page.locator("#admin_search_customer_create_date_end");
    this.dciName = page.locator("#admin_search_customer_dci_name");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** フリーワードで検索実行（POST /customer。空文字なら全件相当）。 */
  async searchByMulti(value: string) {
    await this.multi.fill(value);
    await this.searchButton.click();
  }

  /** 条件未指定で検索実行。 */
  async searchAll() {
    await this.searchButton.click();
  }

  /** 詳細条件アコーディオンを展開する（Bootstrap collapse #searchDetail）。 */
  async openDetail() {
    await this.searchDetailToggle.first().click();
    await this.page.locator("#searchDetail").waitFor({ state: "visible" });
  }

  /** 検索フォームの主要部品が仕様どおり表示されること（オラクル＝仕様「フロント挙動」節）。 */
  async seeSearchForm() {
    await expect(this.multi).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }
}
