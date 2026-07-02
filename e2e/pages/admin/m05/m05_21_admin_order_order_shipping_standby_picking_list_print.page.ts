import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注管理 ピッキングリスト印刷 Page Object。
 * 納品ケース表 integration_test/e2e/m05_21_admin_order_order_shipping_standby_picking_list_print_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/pf-eccube3/m05-21_admin_order_order_shipping_standby_picking_list_print.md /
 * 観点表 / 基本設計)由来（オラクル独立性）。実装の現挙動・文言を期待値に流用しない。
 * セレクタは ec-cube-enterprise の Twig 由来の位置情報のみ。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 画面タイプ=print（編集画面の一括フォーム #form_bulk を別ウィンドウ newwin へ POST し、
 * picking_list.twig が共通フレームを使わない単体HTMLを返す。最終的な印刷はブラウザ印刷ダイアログに委ねる）。
 * ブラウザで観測できるのは「印刷ボタン表示」「別ウィンドウ生成と単体ページの存在(#printButton/列見出し/タイトル/CSS)」
 * 「親URL不変」「印刷URLのHTTP応答(200/text-html・404・ログイン誘導)」まで。
 * 印刷物の内容(集計値・価格帯振り分け・商品名解体・色/レラ抽出・Foil・数量太字)と印刷ダイアログは手動(ケース表 付帯表2/5)。
 *
 * セレクタ根拠（ec-cube-enterprise 現行ソース）:
 *  - 編集ルート admin_shipping_standby_edit GET,POST /{admin_route}/standby/{id}/edit（ShippingStandbyController.php:152）
 *  - 印刷ルート admin_shipping_standby_print_picking_list GET,POST /{admin_route}/standby/{id}/print/picking（同:283）
 *  - ピッキング印刷ボタン #printPickingList（edit.twig:117 / 文言 trans admin.order.shipping_standby_list_print
 *    「ピッキングリスト印刷」 messages.ja.yaml:2485）
 *  - 一括フォーム #form_bulk name=order_list action=""（edit.twig:113。printPickingList 押下で action=印刷URL・
 *    target=newwin に差し替え、hidden id=ja を append して submit。JS edit.twig:12-18）
 *  - 全選択チェック #check-all checked（edit.twig:142）
 *  - 受注チェック #check-{Order.id} name="order_ids[{Order.id}]" checked（edit.twig:157）
 *  - 印刷ページ 印刷ボタン #printButton（picking_list.twig:22 / 文言 trans admin.common.print「印刷する」 messages.ja.yaml:1467）
 *  - 印刷ページ 帯/本文 .printBox（picking_list.twig:21）/ .ContentsAll（:26）
 *  - 印刷ページ タイトル <title>ピッキングリスト</title>（picking_list.twig:6 静的文言）
 *  - 印刷ページ CSS link href assets/css/pickinglist.css（picking_list.twig:7 asset()）
 *  - 印刷ページ 列見出し th.desc（picking_list.twig:47-55 / trans admin.picking_item_list.* ＋ admin.common.note）
 */
export class OrderOrderShippingStandbyPickingListPrintPage {
  readonly page: Page;

  // 印刷物の列見出し（仕様 trans 由来。期待値は設計書「画面上の一覧列」由来）。
  static readonly COLUMN_HEADERS = [
    "No",
    "棚番号",
    "言語/状態",
    "略称",
    "色/R",
    "数",
    "商品名",
    "価格",
    "備考",
  ];
  // 設計書本文由来の文言のみオラクル化する（設計書 §概要/利用者視点の入口/表示要素 が
  // 「ピッキングリスト印刷」ボタン名を明記）。印刷ページの <title>「ピッキングリスト」と
  // 印刷ボタン文言「印刷する」(admin.common.print) は実装リソース(messages.ja.yaml/Twig静的文言)由来であり
  // 設計書本文に記載がないため期待値固定しない（オラクル独立性。存在/構造で判定する）。
  static readonly PRINT_BUTTON_LABEL = "ピッキングリスト印刷"; // 設計書 §概要・§表示要素（編集）由来

  // 編集画面（一括フォーム）
  readonly printPickingButton: Locator; // #printPickingList（edit.twig:117）
  readonly bulkForm: Locator; // #form_bulk（edit.twig:113）
  readonly checkAll: Locator; // #check-all（edit.twig:142）
  readonly orderCheckboxes: Locator; // input[name^="order_ids"]（edit.twig:157）

  // 印刷単体ページ（picking_list.twig）
  readonly printButton: Locator; // #printButton（picking_list.twig:22）
  readonly printBox: Locator; // .printBox（picking_list.twig:21）
  readonly contentsAll: Locator; // .ContentsAll（picking_list.twig:26）

  constructor(page: Page) {
    this.page = page;

    this.printPickingButton = page.locator("#printPickingList");
    this.bulkForm = page.locator("#form_bulk");
    this.checkAll = page.locator("#check-all");
    this.orderCheckboxes = page.locator('input[name^="order_ids"]');

    this.printButton = page.locator("#printButton");
    this.printBox = page.locator(".printBox");
    this.contentsAll = page.locator(".ContentsAll");
  }

  /** 編集画面URL。 */
  editPath(id: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/standby/${id}/edit`;
  }

  /** ピッキング印刷URL（GET/POST 双方許可）。 */
  printPath(id: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/standby/${id}/print/picking`;
  }

  async gotoEdit(id: number | string) {
    await this.page.goto(this.editPath(id));
  }

  /** 印刷URLへ直接遷移（ブラウザ表示）。 */
  async gotoPrint(id: number | string) {
    await this.page.goto(this.printPath(id));
  }

  /** 編集画面に「ピッキングリスト印刷」ボタンが表示されること（文言は仕様 trans 由来）。 */
  async seePrintPickingButton() {
    await expect(this.printPickingButton).toBeVisible();
    await expect(this.printPickingButton).toContainText(
      OrderOrderShippingStandbyPickingListPrintPage.PRINT_BUTTON_LABEL
    );
  }

  /** 一括フォーム・全選択チェック・受注チェック（初期チェックオン）が表示されること。 */
  async seeBulkFormChecked() {
    await expect(this.bulkForm).toBeVisible();
    await expect(this.checkAll).toBeVisible();
    const n = await this.orderCheckboxes.count();
    expect(n, "受注行のチェックボックスが1件以上あること").toBeGreaterThan(0);
    // 初期チェックオン（テンプレ checked 属性）の確認は先頭行を代表とする。
    await expect(this.orderCheckboxes.first()).toBeChecked();
  }

  /** 全ての受注チェックを外す（order_ids 空集合の検証用）。 */
  async uncheckAllOrders() {
    if (await this.checkAll.isChecked()) {
      await this.checkAll.uncheck();
    }
    const n = await this.orderCheckboxes.count();
    for (let i = 0; i < n; i++) {
      const box = this.orderCheckboxes.nth(i);
      if (await box.isChecked()) await box.uncheck();
    }
  }

  /**
   * 「ピッキングリスト印刷」ボタンを押下し、開いた別ウィンドウ（newwin）を返す。
   * 仕様: #form_bulk の action を印刷URL・target を newwin に差し替えて submit する（処理フロー）。
   */
  async clickPrintAndGetChild(): Promise<Page> {
    const [child] = await Promise.all([
      this.page.context().waitForEvent("page"),
      this.printPickingButton.click(),
    ]);
    await child.waitForLoadState("domcontentloaded");
    return child;
  }

  /**
   * 単体ページに印刷ボタン（#printButton）が表示されること。
   * オラクルはセレクタ存在（設計書「印刷ボタンをブラウザ印刷に委ねる」）。
   * ボタン文言（admin.common.print）は実装リソース由来のため期待値固定しない。
   */
  async seePrintPage(target: Page = this.page) {
    const printBtn = target.locator("#printButton");
    await expect(printBtn).toBeVisible();
  }

  /** 単体ページが共通管理フレームを使わない単体HTML（印刷帯＋本文のみ）であること。 */
  async seeStandalonePage(target: Page = this.page) {
    await expect(target.locator(".printBox")).toHaveCount(1);
    await expect(target.locator("#printButton")).toBeVisible();
    await expect(target.locator(".ContentsAll")).toHaveCount(1);
  }

  /** 単体ページに列見出し（No〜備考）が表示されること（明細がある帯に対して）。 */
  async seeColumnHeaders(target: Page = this.page) {
    const body = target.locator("body");
    for (const h of OrderOrderShippingStandbyPickingListPrintPage.COLUMN_HEADERS) {
      await expect(body).toContainText(h);
    }
  }

  /** 単体ページが pickinglist.css を読み込んでいること。 */
  async seePickingListCss(target: Page = this.page): Promise<void> {
    const link = target.locator(
      'link[rel="stylesheet"][href*="assets/css/pickinglist.css"]'
    );
    await expect(link).toHaveCount(1);
  }

  /**
   * 印刷URLへ直接 GET（HTTP ステータス・Content-Type の観測用）。
   * page.request はブラウザコンテキストの Cookie を共有するため、ログイン済みなら認証済み GET になる。
   */
  async getPrint(id: number | string, maxRedirects = 0) {
    return this.page.request.get(this.printPath(id), {
      maxRedirects,
      failOnStatusCode: false,
    });
  }
}
