import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理 欠品履歴検索/一覧 Page Object。
 * 納品ケース表 integration_test/e2e/m04_19_admin_stock_stock_shortage_history_search_list_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/pf-eccube3/m04-19_admin_stock_stock_shortage_history_search_list.md /
 * 観点表 / 基本設計)由来（オラクル独立性）。実装の現挙動・文言を期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * !!! screenExists=要確認（pf-eccube3 専用画面の 1:1 移行先が在庫変動履歴の欠品検索モードか要確認） !!!
 *  刷新先 ec-cube-enterprise には pf-eccube3 と 1:1 対応する「欠品履歴検索/一覧」専用の
 *  Controller / Route / Twig（stockout/history 系）は無いが、**在庫変動履歴画面 admin_stock_history に
 *  「欠品検索（欠品履歴一覧を表示）」モードが実装**されており、これが移行先候補である（要確認）。
 *   - ルート admin_stock_history GET|POST /product/stock/history（StockHistoryController.php:64）
 *   - Form StockHistoryType getBlockPrefix=admin_stock_history（StockHistoryType.php:580）。
 *     登録日帯 create_date_from(:339)/create_date_to(:357)・欠品検索トグル disposal_search(:108)
 *   - Twig src/Eccube/Resource/template/admin/Stock/history.twig（has_search_disposal で欠品列切替）
 *   - ロケール admin.stock.history.disposal_search: 欠品検索（messages.ja.yaml:4558）
 *  ただし移行先の欠品検索は dtb_stock_history を欠品種別で絞る方式で、pf-eccube3 の専用テーブル
 *  dtb_stockout_history（Entity/Repository・宙吊りロケール out_of_stocke_history 残存）とはデータ源・
 *  画面構成が異なる。同一機能の移行関係かは人手確認（要確認）。確定するまでは欠品検索モードの実DOM
 *  （行リンク・状態列）は **要実機確認** とし、セレクタを創作しない。
 *  本Page Objectは移行マッピング確定時の雛形であり、URL・セレクタは確定後に Twig file:line 根拠で埋める。
 *
 * 設計源（pf-eccube3 HareruyaEc プラグイン）の位置参考（合否オラクルではない。刷新先実装で写像し直す）:
 *  - Twig: app/Plugin/HareruyaEc/Resource/template/admin/Product/stockout_historylist.twig
 *  - Form: app/Plugin/HareruyaEc/Form/Type/Admin/Product/StockoutHistoryType.php（date_from/date_to）
 *  - 検索フォーム #search_form（twig:31 action=admin_product_stockout_history_search page_no=1）
 *  - 日付入力 form_widget(searchForm.date_from/date_to)（twig:42 class input_cal 日時ピッカー）
 *  - 「検索する」ボタン（twig:52-54 ハードコード文言）
 *  - 件数見出し「検索結果 N 件 が該当しました」（twig:66）/ 0件見出し「検索条件に該当するデータがありませんでした。」（twig:132）
 *  - 一覧 #result_list（twig:61）/ 行 #result_list_main__item--{id}（twig:102）
 *  - 状態列 {% if row.memo %}メモ{% else %}状態名{% endif %}（twig:110）
 *  - 商品名リンク admin_product_product_class_detail_edit target=_blank（twig:105）
 *  - 受注番号リンク admin_order_edit target=_blank（twig:113）
 *  - 表示件数プルダウン #result_list__pagemax_menu（twig:72 / page_count パラメータ :78）
 *  - ページネーション pager.twig（twig:128 routes=admin_product_stockout_history_search）
 *  正典URL（ナビゲーション錨。値はオラクルでない）: pf-eccube3 入口 /product/stockout/history・検索 …/search/1。
 *  移行先候補 admin_stock_history は /product/stock/history（欠品検索モード）。
 *  移行マッピング確定までは確定パスを環境変数 STOCKOUT_HISTORY_PATH で注入する（未設定時は空＝要実機確認。URL創作禁止）。
 */
export class StockStockShortageHistorySearchListPage {
  readonly page: Page;
  /** 一覧の入口。移行マッピング未確定のため確定ルート未定義（要実機確認）。環境変数 STOCKOUT_HISTORY_PATH で注入する。 */
  readonly url: string;

  // 移行マッピング未確定（移行先候補=admin_stock_history 欠品検索モード）のため確定セレクタなし（創作禁止＝要実機確認）。
  // 確定後に移行先候補 Twig（history.twig）file:line 根拠で各 Locator を定義し、null を置き換える。
  readonly searchForm: Locator | null; // 移行先候補 form#admin_stock_history（getBlockPrefix StockHistoryType.php:580）＝要実機確認
  readonly dateFrom: Locator | null; // 移行先候補 #admin_stock_history_create_date_from（StockHistoryType.php:339）＝要実機確認
  readonly dateTo: Locator | null; // 移行先候補 #admin_stock_history_create_date_to（StockHistoryType.php:357）＝要実機確認
  readonly searchButton: Locator | null; // 移行先候補 検索ボタン（history.twig 要実機確認）＝要実機確認

  constructor(page: Page) {
    this.page = page;
    // 確定ルート未定義（移行マッピング未確定）。URLは創作せず、確定したパスを環境変数から注入する。
    // 未設定時は空文字（要実機確認）とし、固定のプレースホルダURLは置かない（URL創作禁止）。
    const path = process.env.STOCKOUT_HISTORY_PATH;
    this.url = path ? `/${ECCUBE_ADMIN_ROUTE}/${path}` : "";
    // 移行マッピング未確定のため確定セレクタなし。確定後に Twig 根拠を付与して有効化する。
    this.searchForm = null;
    this.dateFrom = null;
    this.dateTo = null;
    this.searchButton = null;
  }

  /** 移行マッピング確定後に有効化。確定ルート（STOCKOUT_HISTORY_PATH）が無い間は遷移しない（要実機確認）。 */
  async goto() {
    if (!this.url) {
      throw new Error(
        "STOCKOUT_HISTORY_PATH 未設定（移行マッピング未確定＝移行先候補 admin_stock_history 欠品検索モードか要確認）。確定したルートを注入すること。"
      );
    }
    await this.page.goto(this.url);
  }

  /**
   * 移行実装後に有効化。未認証で一覧/検索URLへアクセスすると管理ログイン画面へ誘導されること（仕様: 未認証ガード）。
   * 期待は仕様（正本「権限・認可」）由来。セレクタ #login_id は管理ログイン共通（login.page.ts:11 / login.twig:26 由来。ログイン画面は刷新先に存在）。
   */
  async seeRedirectedToLogin() {
    await expect(this.page).toHaveURL(new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login`));
    await expect(this.page.locator("#login_id")).toBeVisible();
  }
}
