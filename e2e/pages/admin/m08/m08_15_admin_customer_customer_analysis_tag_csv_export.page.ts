import { Page, expect } from "@playwright/test";

/**
 * 会員管理「会員顧客分析タグ情報CSV出力」Page Object。
 * 納品ケース表 integration_test/e2e/m08_15_admin_customer_customer_analysis_tag_csv_export_e2e_cases.md に対応。
 *
 * 【重要・screenExists=false】本機能は新規実装（基本設計：Ph2対応・Ph1未実装）であり、刷新先
 *  ec-cube-enterprise に当該画面・ルート・テンプレート・Form は存在しない（`customer_analysis_tag`/
 *  `顧客分析タグ`/`CustomerAnalysisTag` で全文検索ヒット0。`分析タグ` のヒットは商品側 `TagSalesAnalysis`＝別機能）。
 *  そのため **実体セレクタは導出不能** で、本Page Objectは確定セレクタを持たない（創作セレクタ禁止＝オラクル独立性）。
 *  出力URL・DOM id・ボタン文言・ファイル名規約は Ph2実装後に ec-cube-enterprise の Controller Route /
 *  Template / Form から確定する（すべて 要実機確認）。
 *
 * 期待結果は仕様（基本設計仕様書 会員管理機能）由来:
 *  - 目的: 顧客に紐づく顧客分析タグCSVを出力できる。
 *  - CSV出力項目: 1=会員ID / 2=顧客分析タグID（2項目）。CSV内容の検査は手動。
 *  - 開始条件: ログイン済みの利用者のみ実行可（未認証ガード）。
 *  - 例外処理: 対象なし＝空CSV/エラー（扱いは実装の確定仕様＝要確認）。
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 * spec 側は全ケースを test.fixme（理由：刷新先未実装）で抜け漏れを可視化する。
 */
export class CustomerCustomerAnalysisTagCsvExportPage {
  readonly page: Page;
  // 出力URLは刷新先実装で未確定。設計・実装根拠が無いため確定値（捏造パス）を持たない＝要実機確認。
  //   実装(Ph2)後に ec-cube-enterprise の Controller Route から確定値を付して定義する。
  readonly exportUrl: string | null; // 要実機確認(刷新先未実装：ルート未確定。捏造しない)

  // セレクタは導出不能（刷新先未実装）。実装後に Twig file:line 根拠を付して定義する。創作しない。
  // 例（実装後に確定する想定）:
  //   readonly exportEntry: Locator;   // 由来: 要実機確認（CSV出力の操作起点ボタン/リンク）
  //   readonly featureTitle: Locator;  // 由来: 要実機確認（機能名見出し）

  constructor(page: Page) {
    this.page = page;
    // ルート未確定。捏造パスはURL根拠管理上の創作に当たるため置かない（実装後に確定値へ差し替える）。
    this.exportUrl = null; // 要実機確認(刷新先未実装)
  }

  /**
   * 刷新先未実装のため操作は提供しない。実装（Ph2）後に goto/exportAndWaitDownload/seeEntry 等を、
   * 確定したルート・セレクタ（Twig file:line 根拠付き）で実装する。
   * 期待結果は仕様（CSV出力項目＝会員ID/顧客分析タグID・未認証ガード）由来とする（オラクル独立性）。
   */
  notImplementedReason(): string {
    return "刷新先 ec-cube-enterprise に当該画面・ルートが存在しない（基本設計：Ph2対応・Ph1未実装）";
  }

  /** 実装後に未認証ガード等で利用する想定の補助（現状は未使用・参照のみ）。 */
  async assertNotImplemented(): Promise<void> {
    // 現時点では実機確認できないため判定を持たない。spec は test.fixme で管理する。
    expect(this.notImplementedReason()).toContain("Ph1未実装");
  }
}
