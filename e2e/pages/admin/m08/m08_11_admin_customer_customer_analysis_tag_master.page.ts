import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 会員管理 顧客分析タグマスター（M08-11）Page Object。
 * 納品ケース表 integration_test/e2e/m08_11_admin_customer_customer_analysis_tag_master_e2e_cases.md に対応。
 *
 * 【最重要・刷新先未存在】本機能は基本設計の注記「顧客分析タグマスターはPh2で対応するため、Ph1では実装しない」
 * のとおりフェーズ2対象であり、刷新先 ec-cube-enterprise（Ph1）に該当する Controller / Route / Twig / Entity が
 * 存在しない（実機確認: Controller/Admin/Customer 配下は Blacklist/Customer/CustomerDeliveryEdit/CustomerEdit/
 * CustomerGroup/CustomerMail/CustomerPoint のみ。TagSalesAnalysis* は商品の販売分析タグ＝別機能、dtb_customer_group
 * は顧客グループ＝M08-12 の別機能）。
 *
 * したがって本 Page Object のセレクタは **Twig 由来の根拠を持てず、創作しない**（オラクル独立性・創作セレクタ禁止）。
 * 下記 Locator は「Ph2 実装時に基本設計の識別IDへ割り当てる暫定の置き場」であり、すべて `要実機確認（Ph2実装時）`。
 * Ph2 で Twig/Form が確定したら #id / getByRole を根拠(file:line)付きで確定する。
 * 期待結果は基本設計（会員管理 基本設計 Excel：登録・編集・削除・一覧の意図仕様）由来（オラクル独立性）。
 *
 * 基本設計の識別ID（Ph2でセレクタ化する対象）:
 *  - 識別ID1 名称（必須）/ 識別ID2 並び順（必須）/ 識別ID3 登録ボタン
 *  - 識別ID6 雛形ファイルのダウンロードボタン
 *  - 識別ID8 分析タグID / 9 名称 / 10 並び順（一覧列）
 *  - 識別ID11 編集ボタン（押下で名称・並び順をフォームへ・登録ボタンが変更に） / 識別ID12 削除ボタン（確認ダイアログ・会員紐づき時は非表示）
 */
export class CustomerCustomerAnalysisTagMasterPage {
  readonly page: Page;
  /** 画面URL。Ph2 で Route が確定するまで未確定のセンチネル値（創作禁止・要実機確認）。 */
  readonly url: string;

  // ↓ すべて要実機確認（Ph2実装時）。Twig が無いため id は付けず、設計書ラベル由来の暫定 role/text とする。
  readonly nameInput: Locator; // 識別ID1 名称（要実機確認）
  readonly sortInput: Locator; // 識別ID2 並び順（要実機確認）
  readonly registerButton: Locator; // 識別ID3 登録ボタン（更新時は表示が「変更/更新」へ）（要実機確認）
  readonly templateDownloadButton: Locator; // 識別ID6 雛形ダウンロード（要実機確認）
  readonly tagList: Locator; // 一覧テーブル（識別ID8/9/10）（要実機確認）
  readonly editButtons: Locator; // 識別ID11 編集ボタン（要実機確認）
  readonly deleteButtons: Locator; // 識別ID12 削除ボタン（要実機確認）
  readonly error: Locator; // バリデーションエラー表示（要実機確認）

  constructor(page: Page) {
    this.page = page;
    // 【URL創作禁止・要実機確認】刷新先(Ph1)に Route が無いため本機能のパスは未確定。
    // `/customer/analysis_tag` 等の推測パスは創作になるため置かず、実在しないセンチネルパスを置く。
    // Ph2 で Controller/Route の path が確定したら file:line 根拠付きで置換する。
    this.url = `/${ECCUBE_ADMIN_ROUTE}/__ph2_unresolved__/customer_analysis_tag`;

    // 【創作セレクタ禁止・要実機確認（Ph2実装時）】刷新先(Ph1)に Twig/Form が存在しないため、
    // 根拠(file:line / DOM id=blockprefix由来)を持つセレクタを導出できない。
    // role名/属性を推測で置くと創作になるため、実在しないセンチネル属性で「未解決」を明示する。
    // Ph2 で Twig が確定したら #id / getByRole を file:line 根拠付きで確定する（創作禁止）。
    const TBD = "[data-e2e-unresolved='ph2-twig-required']"; // 要実機確認: Ph2でTwig根拠の実セレクタへ置換
    this.nameInput = page.locator(TBD); // 識別ID1 名称（要実機確認・Twig根拠なし）
    this.sortInput = page.locator(TBD); // 識別ID2 並び順（要実機確認・Twig根拠なし）
    this.registerButton = page.locator(TBD); // 識別ID3 登録/更新ボタン（要実機確認・Twig根拠なし）
    this.templateDownloadButton = page.locator(TBD); // 識別ID6 雛形DL（要実機確認・Twig根拠なし）
    this.tagList = page.locator(TBD); // 一覧(識別ID8/9/10)（要実機確認・Twig根拠なし）
    this.editButtons = page.locator(TBD); // 識別ID11 編集ボタン（要実機確認・Twig根拠なし）
    this.deleteButtons = page.locator(TBD); // 識別ID12 削除ボタン（要実機確認・Twig根拠なし）
    this.error = page.locator(TBD); // バリデーションエラー領域（要実機確認・Twig根拠なし）
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /**
   * 画面表示の確認（Ph2実装後に有効化）。現状は刷新先に画面が無いため呼び出しても観測できない。
   * 期待は基本設計（一覧＋登録フォーム）由来。
   */
  async seeMasterScreen() {
    await expect(this.tagList).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }
}
