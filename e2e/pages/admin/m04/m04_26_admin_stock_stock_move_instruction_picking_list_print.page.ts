import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理「ピッキングリスト印刷（在庫移動指示詳細起点）」Page Object。
 * 納品ケース表 integration_test/e2e/m04_26_admin_stock_stock_move_instruction_picking_list_print_e2e_cases.md に対応。
 *
 * 【重要 / screenExists=false】2026-06-19 時点の ec-cube-enterprise に、在庫移動指示からのピッキングリスト
 * 印刷は未実装である。よって本機能のセレクタは導出不能で、創作しない（オラクル独立性・誤認識防止）。
 *  - StockMoveInstructionController.php: pick/picking/pdf/print を含むルートは存在しない（grep0件）。
 *      在庫移動指示詳細ルートは admin_stock_move_instruction_detail
 *      = GET/POST /<route>/product/stock/move-instruction/{id}（Controller.php:161）。
 *  - stock_move_instruction_detail.twig: 「ピッキングリスト作成」ボタン・印刷要素なし（grep0件）。
 *      詳細画面のボタンは 登録/削除/キャンセル/一覧へ戻る のみ（detail.twig:83-172）。
 *  - 既存の「ピック」実装 admin_stock_move_outbound_approval_request_pick_list_pdf_export
 *      （StockMoveController.php:422 / @admin/Stock/MoveTransfer/pick_list.twig）は、正本mdが明記するとおり
 *      別画面（ピック・出庫承認申請）であり、本機能のセレクタとして流用しない。
 *
 * 期待結果は仕様（基本設計仕様書(在庫管理機能) / Excel機能No. M04-39 識別ID1〜14・並び順・閾値振り分け /
 *   正本md functions/ec-cube-enterprise/m04-26_admin_stock_stock_move_instruction_picking_list_print.md）由来。
 * 実装の現挙動は期待値に流用しない。
 *
 * セレクタは全て要実機確認（未実装・ルート/テンプレート/DOM id 未確定）のためプレースホルダとし、
 * 実装着手後に確定する。本ファイルは未実行の雛形で、ec-cube-enterprise の Playwright は本リポジトリでは実行不可。
 */
export class StockStockMoveInstructionPickingListPrintPage {
  readonly page: Page;
  // 在庫移動指示詳細（ピッキングリスト作成の起点・実在ルート）。id は実データに依存するため呼び出し側で付与する。
  readonly detailPathTemplate: string; // /<route>/product/stock/move-instruction/{id}

  // 以下は仕様（基本設計）上 存在すべき要素。刷新先未実装のためセレクタは要実機確認のプレースホルダ。
  // 創作の DOM id / CSS クラス（例 #picking-list, .picking-list__created-at 等）は置かない。
  // 入口ボタン・印刷ボタンは「仕様文言（画面ラベル）」由来の role+name のみとし、印刷用画面本体・作成日時等の
  // 内部要素は DOM 根拠（id=blockprefix 由来 / file:line）が確定するまでロケータを定義しない（実装後に追加）。
  readonly createPickingListButton: Locator; // 「ピッキングリスト作成」(利用者入口の作成ボタン・detail.twig 未実装＝要実機確認)
  readonly printButton: Locator; // 「印刷する」(識別ID1・要実機確認)

  constructor(page: Page) {
    this.page = page;
    this.detailPathTemplate = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move-instruction`;

    // 未実装のため確定セレクタが無い。創作 DOM を避け、仕様文言（画面ラベル）に基づく role+name の暫定ロケータのみ置く。
    // 実装後に Twig の id / trans キーへ差し替える（要実機確認）。印刷用画面本体・作成日時等の内部要素は
    // DOM 根拠が無いため定義しない（創作セレクタ禁止）。
    this.createPickingListButton = page.getByRole("button", {
      name: "ピッキングリスト作成",
    });
    this.printButton = page.getByRole("button", { name: "印刷する" });
  }

  /** 在庫移動指示詳細画面を開く（ピッキングリスト作成の起点）。 */
  async gotoDetail(instructionId: number | string) {
    await this.page.goto(`${this.detailPathTemplate}/${instructionId}`);
  }

  /** 「ピッキングリスト作成」ボタンを押下する（実装後に有効・現状は未実装）。 */
  async clickCreatePickingList() {
    await this.createPickingListButton.click();
  }

  /**
   * 入口ボタンが仕様どおり表示されること（基本設計 識別ID入口）。
   * 刷新先未実装の現状では失敗してよい（仕様乖離＝不具合候補#1 を検出する想定）。
   */
  async seeCreatePickingListButton() {
    await expect(this.createPickingListButton).toBeVisible();
  }
}
