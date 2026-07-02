import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 商品管理 商品規格一覧 Page Object（参照専用の一覧画面）。
 * 納品ケース表 integration_test/e2e/m03_08_admin_product_product_product_class_list_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-08_admin_product_product_product_class_list.md ＋ 観点表 ＋
 * messages.ja.yaml)由来（オラクル独立性）。実装(Twig)から取るのはセレクタ＝位置情報のみ。
 *
 * URL: GET/POST /{admin_route}/product/product/class/{id}
 *   （ProductClassController.php:72 admin_product_product_class。id は商品ID \d+）
 *
 * セレクタ根拠（src/Eccube/Resource/template/admin/Product/ProductClass/index.twig）:
 *  - ウィンドウタイトル trans admin.product.product_class_list=「商品規格一覧」(index.twig:15 / messages.ja.yaml:1726)
 *  - サブタイトル trans admin.product.product_management=「商品管理」(index.twig:16 / messages.ja.yaml:1723)
 *  - 商品名見出しカード #ex-product_class-header（index.twig:23）/ 商品名 span.card-title(index.twig:29 {{ Product.name }})
 *  - 「新規登録」リンク trans admin.common.registration__new=「新規登録」→ url admin_product_product_class_new(index.twig:32-33 / messages.ja.yaml:1437)
 *  - 検索結果件数 trans admin.common.search_result=「検索結果：%count%件が該当しました」(index.twig:44 / messages.ja.yaml:1538)
 *  - アクティブ一覧 card-body #ex-product_class（index.twig:50）/ 列見出し(index.twig:53-62)
 *  - 行「編集」リンク trans admin.common.edit=「編集」→ url admin_product_product_class_edit(index.twig:105-106 / messages.ja.yaml:1439)
 *  - 在庫数「無制限」trans admin.product.stock_unlimited__short(index.twig:87,160 / messages.ja.yaml:1935)
 *  - 廃止規格一覧見出し trans admin.product.abolished_product_class=「廃止規格一覧」(index.twig:120 / messages.ja.yaml:1931)
 *  - 廃止ブロック折りたたみ #abolishedProductClass（index.twig:131、Bootstrap collapse）/ トグル a[href="#abolishedProductClass"](index.twig:124)
 *  - フッタ戻り .c-conversionArea：return_product_list 真→url admin_product{resume:1}=商品一覧(index.twig:188-189)、偽→url admin_product_product_edit=商品登録(index.twig:194)
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductProductClassListPage {
  readonly page: Page;

  // 列見出し（アクティブ一覧）の仕様文言（messages.ja.yaml 由来。値判定ではなく表示確認に用いる）
  static readonly ACTIVE_HEADERS = [
    "公開状態", // admin.product.display_status (:1849)
    "言語", // admin.product.language (:1983)
    "状態", // admin.product.card_condition (:1987)
    "スマレジ連携フラグ", // admin.product.smaregi_alignment_flg (:1992)
    "商品コード", // admin.product.product_code (:1889)
    "在庫数", // admin.product.stock (:1881)
    "販売制限数", // admin.product.sale_limit (:1893)
    "基準価格(円)", // admin.product.standard_price (:1996)
    "販売価格(円)", // admin.product.sale_price (:1878)
    "買取価格(円)", // admin.product.buy_price (:1997)
  ];

  // 列見出し（廃止一覧）の仕様文言。廃止表は公開状態・スマレジ連携フラグ・編集列を省略する（index.twig:135-142）。
  static readonly ABOLISHED_HEADERS = [
    "言語", // admin.product.language
    "状態", // admin.product.card_condition
    "商品コード", // admin.product.product_code
    "在庫数", // admin.product.stock
    "販売制限数", // admin.product.sale_limit
    "基準価格(円)", // admin.product.standard_price
    "販売価格(円)", // admin.product.sale_price
    "買取価格(円)", // admin.product.buy_price
  ];
  // 廃止一覧が省略する列見出し（アクティブ一覧にのみ存在する）。
  static readonly ABOLISHED_OMITTED_HEADERS = ["公開状態", "スマレジ連携フラグ"];

  readonly productNameHeader: Locator; // 商品名見出し（index.twig:23,29）
  readonly newButton: Locator; // 「新規登録」リンク（index.twig:32）
  readonly searchResultLabel: Locator; // 「検索結果：…」件数ヘッダ（index.twig:44）
  readonly activeTable: Locator; // アクティブ一覧 card-body（index.twig:50 #ex-product_class）
  readonly activeRows: Locator; // アクティブ一覧の行（index.twig:67-）
  readonly abolishedRows: Locator; // 廃止一覧の行（index.twig:154-）
  readonly unlimitedStockCells: Locator; // 在庫数セルの「無制限」表示（index.twig:87,160）
  readonly editButtons: Locator; // 行「編集」リンク（index.twig:105）
  readonly abolishedHeading: Locator; // 「廃止規格一覧」見出し（index.twig:120）
  readonly abolishedToggle: Locator; // 折りたたみトグル（index.twig:124）
  readonly abolishedBlock: Locator; // 廃止ブロック collapse（index.twig:131）
  readonly footerBackLink: Locator; // フッタ戻りリンク（index.twig:185-）

  // アクティブ一覧の列順（index.twig:53-62）。td.nth(index) でセルを取得する。
  static readonly COL = {
    displayStatus: 0, // 公開状態（index.twig:70 Status.name）
    language: 1, // 言語（index.twig:73）
    cardCondition: 2, // 状態（index.twig:76）
    smaregi: 3, // スマレジ連携フラグ（index.twig:79 ON/OFF）
    productCode: 4, // 商品コード（index.twig:82 空可）
    stock: 5, // 在庫数（index.twig:85-90）
    saleLimit: 6, // 販売制限数（index.twig:93 偽評価→空）
    standardPrice: 7, // 基準価格（index.twig:96 number_format）
    salePrice: 8, // 販売価格（index.twig:99）
    buyPrice: 9, // 買取価格（index.twig:102）
  } as const;

  constructor(page: Page) {
    this.page = page;
    this.productNameHeader = page.locator("#ex-product_class-header .card-title");
    this.newButton = page.getByRole("link", { name: "新規登録" });
    this.searchResultLabel = page.locator("text=検索結果");
    this.activeTable = page.locator("#ex-product_class");
    this.activeRows = page.locator('#ex-product_class tbody tr[id^="ex-product_class-"]');
    this.abolishedRows = page.locator('#abolishedProductClass tbody tr[id^="ex-product_class-"]');
    this.unlimitedStockCells = page
      .locator("#ex-product_class tbody td")
      .getByText("無制限", { exact: true });
    this.editButtons = page.locator("#ex-product_class").getByRole("link", { name: "編集" });
    this.abolishedHeading = page.locator("text=廃止規格一覧");
    this.abolishedToggle = page.locator('a[href="#abolishedProductClass"]');
    this.abolishedBlock = page.locator("#abolishedProductClass");
    this.footerBackLink = page.locator(".c-conversionArea a.c-baseLink");
  }

  /** 商品規格一覧URL。returnProductList=true で ?return_product_list=1 を付与する。 */
  listUrl(productId: string | number, returnProductList = false): string {
    const base = `/${ECCUBE_ADMIN_ROUTE}/product/product/class/${productId}`;
    return returnProductList ? `${base}?return_product_list=1` : base;
  }

  async gotoList(productId: string | number, returnProductList = false) {
    await this.page.goto(this.listUrl(productId, returnProductList));
  }

  /** 一覧URLへ素のPOSTを送る（仕様: 本体は一覧組み立てのみで送信ボディを解釈しない）。 */
  async postList(productId: string | number) {
    return this.page.request.post(this.listUrl(productId));
  }

  /** アクティブ一覧テーブルの列見出しが仕様どおり表示されること。 */
  async seeActiveHeaders() {
    const thead = this.activeTable.locator("thead");
    for (const label of ProductProductProductClassListPage.ACTIVE_HEADERS) {
      await expect(thead).toContainText(label);
    }
  }

  /** アクティブ一覧の行 row の指定列セル（COL）を返す。 */
  activeCell(row: Locator, colIndex: number): Locator {
    return row.locator("td").nth(colIndex);
  }

  /**
   * 廃止一覧テーブルの列見出しが仕様どおりで、公開状態・スマレジ連携フラグ・編集列を省略すること。
   * 仕様(フロント挙動: 廃止表の列構成, functions md:51 / index.twig:135-142)。
   */
  async seeAbolishedHeaders() {
    const thead = this.abolishedBlock.locator("thead");
    for (const label of ProductProductProductClassListPage.ABOLISHED_HEADERS) {
      await expect(thead).toContainText(label);
    }
    for (const omitted of ProductProductProductClassListPage.ABOLISHED_OMITTED_HEADERS) {
      await expect(thead).not.toContainText(omitted);
    }
    // 編集列(リンク)を持たないこと。
    await expect(
      this.abolishedBlock.getByRole("link", { name: "編集" })
    ).toHaveCount(0);
  }

  /** ロケータ配下の規格行（tr id="ex-product_class-{productClassId}"）の productClassId 一覧を返す。 */
  async rowIds(rows: Locator): Promise<string[]> {
    const n = await rows.count();
    const ids: string[] = [];
    for (let i = 0; i < n; i++) {
      const id = await rows.nth(i).getAttribute("id");
      if (id) ids.push(id.replace("ex-product_class-", ""));
    }
    return ids;
  }

  /**
   * 件数ヘッダ「検索結果：%count%件が該当しました」の %count% を整数で返す。
   * 仕様(集計条件: 件数=アクティブ集合長)の照合に用いる。表示文言自体はオラクル化しない。
   */
  async searchResultCount(): Promise<number> {
    const text = (await this.searchResultLabel.innerText()).replace(/[,\s]/g, "");
    const m = text.match(/(\d+)/);
    return m ? Number(m[1]) : NaN;
  }
}
