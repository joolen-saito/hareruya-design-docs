import { Page } from "@playwright/test";

/**
 * 管理画面 会員管理「会員顧客分析タグ登録アップロード」Page Object（雛形 / セレクタ未導出）。
 * 納品ケース表 integration_test/e2e/m08_16_admin_customer_customer_analysis_tag_csv_import_e2e_cases.md に対応。
 *
 * 重要（screenExists=false）:
 *  本機能はカスタマイズ区分「新規実装」かつ基本設計で「会員顧客分析タグCSVはPh2で対応するためPh1では実装しない」と
 *  明記されており、刷新先 ec-cube-enterprise に**該当画面・ルート・Twig・Form・メッセージは存在しない**
 *  （src/Eccube に analysis_tag / 顧客分析タグ / customer_analysis の取込実装は確認できない。
 *   正本mdが挙げる CustomerCsvController/CustomerCsvUpdateAction は別機能＝カスタムCSV出力設定であり無関係）。
 *  したがって**ルート・セレクタを根拠付きで導出できない**。規約「セレクタは Twig/Form 由来 file:line 根拠のみ・
 *  創作禁止・無ければ要実機確認」に従い、本Page Objectは**創作ルート・創作セレクタを一切置かない**。
 *
 *  各メソッドは未導出を明示するため `要実機確認` エラーで fail-fast する。これは、誤って有効化された場合に
 *  汎用CSSセレクタ（input[type=file] / button[type=submit] / .alert-* 等）で偽陽性を出すことを防ぐためである。
 *  Ph2実装後に、アップロード画面の Twig/Form/Controller から id/name とルートを file:line 根拠で再導出し、
 *  本クラスの各メソッドを実セレクタに置換して有効化する。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m08-16_admin_customer_customer_analysis_tag_csv_import.md / 基本設計)由来
 * （オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 */
const NOT_DERIVED =
  "要実機確認: m08-16 は刷新先未実装(Ph2)のためルート/セレクタを根拠付きで導出できない。" +
  "Ph2実装後に Twig/Form/Controller から file:line 根拠で導出し、本Page Objectを有効化すること。";

export class CustomerCustomerAnalysisTagCsvImportPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** 画面表示。ルート未確定（刷新先未実装）のため fail-fast（要実機確認）。 */
  async goto(): Promise<never> {
    throw new Error(NOT_DERIVED);
  }

  /** CSVファイルを選択しアップロードを実行する。ファイル選択欄/実行ボタンのセレクタ未導出（要実機確認）。 */
  async uploadCsv(_filePath: string): Promise<never> {
    throw new Error(NOT_DERIVED);
  }

  /** 取込完了（成功）メッセージ確認。期待文言・領域セレクタ未確定（要実機確認）。 */
  async seeImportSuccess(_message: string): Promise<never> {
    throw new Error(NOT_DERIVED);
  }

  /** バリデーション/取込エラー確認。期待文言・領域セレクタ未確定（要実機確認）。 */
  async seeImportError(_message: string): Promise<never> {
    throw new Error(NOT_DERIVED);
  }
}
