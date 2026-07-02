import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理 在庫切れリストCSV出力 Page Object。
 * 納品ケース表 integration_test/e2e/m04_06_admin_stock_stock_shortage_csv_export_e2e_cases.md に対応。
 * 期待結果は仕様(Excel基本設計書 / functions/ec-cube-enterprise/m04-06_admin_stock_stock_shortage_csv_export.md)由来（オラクル独立性）。
 *
 * !!! screenExists=false（Ph1未実装） !!!
 *  Excel基本設計書に「在庫切れ、在庫警戒リストCSV出力はPh2で対応するため、Ph1では実装しない」と明記。
 *  刷新先 ec-cube-enterprise を横断検索しても、在庫切れリストCSV出力専用の
 *  Controller / Route / CSV出力Service / 出力対象店舗選択Form / Twigテンプレートは存在しない
 *  （`shortage`／`在庫切れリスト` で src/Eccube/Controller/Admin・src/Eccube/Resource/template/admin を検索、専用ルートも未検出。
 *   名称が近い StockSplitJoinController / StockJoinShortageCsvExportService は別機能）。
 *  したがって Twig 由来の確定セレクタが導出できないため、**セレクタを創作しない**（要実機確認）。
 *  本Page ObjectはPh2実装着手時の雛形であり、URL・セレクタは画面確定後に Twig file:line 根拠で埋める。
 *
 * Ph2実装時に確定すべきセレクタ（Excel識別ID）:
 *  - 識別ID 1 出力対象店舗（単一選択・必須・初期値=デフォルト検索表示店舗）→ FormType getBlockPrefix から #...（要実機確認）
 *  - 識別ID 2 在庫切れリストCSV出力ボタン → button trans（要実機確認）
 *  - 識別ID 3 在庫警戒リストCSV出力ボタン（別機能M04-07）→ button trans（要実機確認）
 */
export class StockStockShortageCsvExportPage {
  readonly page: Page;
  /** Ph1未実装。専用ルート未定義のため要実機確認（環境変数で上書き可）。Ph2実装時に確定ルートへ差し替える。 */
  readonly url: string;

  // セレクタは刷新先に画面・Twigが無いため未確定（創作禁止＝要実機確認）。
  // Ph2実装後に Twig file:line 根拠で各 Locator を定義する。
  readonly storeSelect: Locator | null; // 識別ID 1 出力対象店舗（要実機確認）
  readonly shortageExportButton: Locator | null; // 識別ID 2 在庫切れリストCSV出力（要実機確認）

  constructor(page: Page) {
    this.page = page;
    // 専用ルート未定義（Ph1未実装）。URLは創作せず、Ph2確定ルートを環境変数 STOCK_SHORTAGE_CSV_PATH から注入する。
    // 未設定時は空文字（要実機確認）とし、固定のプレースホルダURLは置かない（URL創作禁止）。
    const path = process.env.STOCK_SHORTAGE_CSV_PATH;
    this.url = path ? `/${ECCUBE_ADMIN_ROUTE}/${path}` : "";
    // 刷新先未実装のため確定セレクタなし。Ph2でTwig根拠を付与して有効化する。
    this.storeSelect = null;
    this.shortageExportButton = null;
  }

  /** Ph2実装後に有効化。確定ルート（STOCK_SHORTAGE_CSV_PATH）が無い間は遷移しない（要実機確認）。 */
  async goto() {
    if (!this.url) {
      throw new Error(
        "STOCK_SHORTAGE_CSV_PATH 未設定（Ph1未実装＝専用ルート未定義）。Ph2確定ルートを注入すること。"
      );
    }
    await this.page.goto(this.url);
  }

  /**
   * Ph2実装後に有効化。未認証で出力画面URLへアクセスすると管理ログイン画面へ誘導されること（仕様: 未認証ガード）。
   * 期待は仕様由来。セレクタ #login_id は管理ログイン共通（login.page.ts:11 / :19、login.twig:26 由来）。
   */
  async seeRedirectedToLogin() {
    await expect(this.page).toHaveURL(new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login`));
    await expect(this.page.locator("#login_id")).toBeVisible();
  }
}
