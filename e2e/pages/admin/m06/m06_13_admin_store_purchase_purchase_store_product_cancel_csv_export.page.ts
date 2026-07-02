import { Page } from "@playwright/test";

/**
 * 管理画面 店頭買取管理「買取商品一覧（キャンセル）CSV出力」Page Object（M06-13）。
 * 納品ケース表 integration_test/e2e/m06_13_admin_store_purchase_purchase_store_product_cancel_csv_export_e2e_cases.md に対応。
 *
 * 【重要】screenExists=false（刷新先未実装・Ph2）:
 *  本機能は基本設計仕様書で Ph2 対応・Ph1 未実装と明記された新規機能であり、刷新先 ec-cube-enterprise に
 *  「キャンセル数CSV」の route／Twig／Form が存在しない。OTC（店頭買取）のCSV出力種別は
 *    - old_goods_account（古物台帳入力用CSV）
 *    - otc_buy_order_product_list（買取商品一覧CSV＝列は「在庫増減数」でキャンセル数ではない）
 *    - otc_buy_order_restock_list_csv（戻しリストCSV）
 *  の3種のみ（OtcBuyOrderCsvExportService.php:33-78 / CSV_TYPES）。
 *
 *  したがって**位置情報（セレクタ）も route も実装から導出できない**。創作禁止・オラクル独立性の観点から、
 *  この Page Object は架空の Locator や具体URL（例: 既存OTCの /otcbuyorder・/otcbuyorder/export）を一切持たない。
 *  それらは本機能のキャンセルCSV route ではなく、誤って既存exportへ寄せたテストを誘発するため意図的に置かない。
 *  全操作は未実装として明示的に throw し、誤って通過（false pass）しないようにする。
 *
 *  Ph2 実装後に、確定した URL と Twig file:line 根拠付きセレクタでこの Page Object を実装する。
 *  期待結果は仕様（基本設計仕様書／観点表）由来とし、実装の現挙動・Form制約・Cookie名はオラクル化しない。
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class StorePurchasePurchaseStoreProductCancelCsvExportPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private notImplemented(): never {
    throw new Error(
      "M06-13 買取商品（キャンセル）CSVは刷新先ec-cube-enterprise未実装（Ph2）。" +
        "route/Twig/Formが存在せずセレクタ・URLを導出できないため、Ph2実装後に確定して実装する。"
    );
  }

  /** 起点画面を開く（Ph2実装後に確定URLで実装。現時点は未実装のため throw）。 */
  async goto(): Promise<never> {
    return this.notImplemented();
  }

  /** 対象選択→キャンセルCSV出力→ダウンロード発火（Ph2実装後に実装。現時点は未実装のため throw）。 */
  async exportCancelCsv(): Promise<never> {
    return this.notImplemented();
  }

  /** キャンセルCSV出力リンク／対象選択UIの表示検証（Ph2実装後に実装。現時点は未実装のため throw）。 */
  async seeCancelCsvEntry(): Promise<never> {
    return this.notImplemented();
  }
}
