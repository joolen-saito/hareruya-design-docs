import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫移動・振替登録/編集 Page Object（m04-09_admin_stock_stock_move_transfer_register_edit）。
 * 対象は 移動 初期登録（move_new.twig）／振替 初期登録（transfer_new.twig）／移動 編集（move_outbound_approval_request.twig）と
 * 振替補助API（dest-product-class-info）。承認・却下・差し戻し・CSV/PDF・在庫検索一覧は別M04機能で本POM対象外。
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-09_...md / 基本設計仕様書 / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix 由来の位置情報のみ。Form制約(NotBlank/min/max)は期待値に流用しない。
 *
 * URL（StockMoveController.php / StockTransferController.php）:
 *  - GET 移動初期登録  : /%route%/product/stock/move/new            (StockMoveController.php:155, GET/POST, productStockIds受領)
 *  - POST 移動登録処理 : /%route%/product/stock/move/store          (:198)
 *  - GET 移動編集      : /%route%/product/stock/move/outbound_approval_request/{id} (:270)
 *  - POST 移動編集確定 : .../{id}/update                            (:316)
 *  - GET 振替初期登録  : /%route%/product/stock/transfer/new        (StockTransferController.php:112, GET/POST)
 *  - POST 振替登録処理 : /%route%/product/stock/transfer/store      (:172)
 *  - GET 振替補助API   : /%route%/product/stock/transfer/dest-product-class-info (:450)
 *
 * DOM id 根拠（移動 getBlockPrefix=admin_stock_move_new / StockMoveNewType.php:124-127）:
 *  - move_to_base_info(入庫先店舗・必須) → #admin_stock_move_new_move_to_base_info（move_new.twig:102 / 必須バッジ:99）
 *  - move_to_stock_location_id(入庫先在庫区分・必須) → #admin_stock_move_new_move_to_stock_location_id（move_new.twig:114 / 必須バッジ:111）
 *  - move_from_*(出庫元・hidden) → #admin_stock_move_new_move_from_base_info_id（move_new.twig:78）/ _move_from_stock_location_id（:89）
 *  - memo → #admin_stock_move_new_memo（move_new.twig:195）
 *  - 移動点数(先頭明細) → #admin_stock_move_new_stock_move_quantities_0_quantity（move_new.twig:164）
 *  - 登録ボタン #stock_move_register_btn（type=button・確認モーダルを開く move_new.twig:220 / trans admin.common.registration messages.ja.yaml:1436）
 *  - 確認モーダル #stockMoveConfirmModal（move_new.twig:235）/ モーダル確定 button[type=submit]（move_new.twig:248）
 *  - 出庫元店舗ラベル trans admin.stock.move.move_from_base_info_name=「出庫元店舗」（move_new.twig:74 / messages.ja.yaml:4267）
 *
 * DOM id 根拠（振替 getBlockPrefix=admin_stock_transfer_new / StockTransferNewType.php:119-122）:
 *  - approval_notification_target_members(承認通知先・必須) → #admin_stock_transfer_new_approval_notification_target_members（transfer_new.twig:283 / :19）
 *  - approval_department → #admin_stock_transfer_new_approval_department（transfer_new.twig:280）
 *  - dest_product_code(先頭明細・readonly) → #admin_stock_transfer_new_transfer_details_0_dest_product_code（transfer_new.twig:342）
 *  - 検索ボタン .btn-transfer-product-search（transfer_new.twig:344 / trans admin.stock.transfer.search=「検索」messages.ja.yaml:4501）
 *  - 商品検索モーダル #stockTransferProductModal（transfer_new.twig:451 / 見出し admin.stock.transfer.product_search_modal_title=「商品検索」:4512）
 *  - move_transfer_quantity(先頭明細) → #admin_stock_transfer_new_transfer_details_0_move_transfer_quantity（transfer_new.twig:363）
 *  - memo → #admin_stock_transfer_new_memo（transfer_new.twig:397）
 *  - 登録ボタン button[type=submit] trans admin.common.registration（transfer_new.twig:418）
 *
 * 仕様由来の表示文言（messages.ja.yaml）。実装に合わせて変えない（オラクル独立性）:
 *  - save_complete=「保存しました」(:1398) / save_error=「保存に失敗しました」(:1399)
 *  - same_store_same_location_error=「出庫元と入庫先が同じです。」(:4290)
 *  - movement_quantity_exceeds_stock=「移動点数が現在の在庫数を超えています。」(:4291)
 *  - dest_product_code_required=「振替先の商品コードを入力してください。」(:4506)
 *  - approval_notification_target_required=「承認通知先のメンバーを1人以上選択してください。」(:4295)
 */
export class StockStockMoveTransferRegisterEditPage {
  readonly page: Page;
  readonly moveNewUrl: string; // 移動 初期登録
  readonly transferNewUrl: string; // 振替 初期登録
  readonly destProductClassInfoPath: string; // 振替補助API

  // 移動 初期登録
  readonly moveToBaseInfo: Locator; // 入庫先店舗（必須）
  readonly moveToStockLocation: Locator; // 入庫先在庫区分（必須）
  readonly moveFromBaseInfoId: Locator; // 出庫元店舗（hidden・先頭在庫由来）
  readonly moveFromStockLocationId: Locator; // 出庫元在庫区分（hidden・先頭在庫由来）
  readonly moveQuantity0: Locator; // 先頭明細の移動点数
  readonly moveMemo: Locator; // メモ
  readonly moveRegisterButton: Locator; // 「登録」（確認モーダルを開く）
  readonly moveConfirmModal: Locator; // 確認モーダル
  readonly moveConfirmSubmit: Locator; // モーダル内の確定 submit

  // 振替 初期登録
  readonly transferNotifyMembers: Locator; // 承認通知先メンバー（必須）
  readonly transferApprovalDept: Locator; // 承認通知先部署
  readonly transferDestCode0: Locator; // 先頭明細の振替先商品コード（readonly）
  readonly transferSearchButton: Locator; // 振替先「検索」
  readonly transferProductModal: Locator; // 商品検索モーダル
  readonly transferQuantity0: Locator; // 先頭明細の振替点数
  readonly transferMemo: Locator; // メモ
  readonly transferRegisterButton: Locator; // 「登録」（submit）

  readonly error: Locator; // フィールド/フォームエラー（.invalid-feedback は form_errors 出力先で要実機確認）

  constructor(page: Page) {
    this.page = page;
    this.moveNewUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move/new`;
    this.transferNewUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/transfer/new`;
    this.destProductClassInfoPath = `/${ECCUBE_ADMIN_ROUTE}/product/stock/transfer/dest-product-class-info`;

    this.moveToBaseInfo = page.locator("#admin_stock_move_new_move_to_base_info");
    this.moveToStockLocation = page.locator("#admin_stock_move_new_move_to_stock_location_id");
    this.moveFromBaseInfoId = page.locator("#admin_stock_move_new_move_from_base_info_id");
    this.moveFromStockLocationId = page.locator(
      "#admin_stock_move_new_move_from_stock_location_id"
    );
    this.moveQuantity0 = page.locator("#admin_stock_move_new_stock_move_quantities_0_quantity");
    this.moveMemo = page.locator("#admin_stock_move_new_memo");
    this.moveRegisterButton = page.locator("#stock_move_register_btn");
    this.moveConfirmModal = page.locator("#stockMoveConfirmModal");
    this.moveConfirmSubmit = page.locator("#stockMoveConfirmModal button[type=submit]");

    this.transferNotifyMembers = page.locator(
      "#admin_stock_transfer_new_approval_notification_target_members"
    );
    this.transferApprovalDept = page.locator("#admin_stock_transfer_new_approval_department");
    this.transferDestCode0 = page.locator(
      "#admin_stock_transfer_new_transfer_details_0_dest_product_code"
    );
    this.transferSearchButton = page.locator(".btn-transfer-product-search").first();
    this.transferProductModal = page.locator("#stockTransferProductModal");
    this.transferQuantity0 = page.locator(
      "#admin_stock_transfer_new_transfer_details_0_move_transfer_quantity"
    );
    this.transferMemo = page.locator("#admin_stock_transfer_new_memo");
    // 振替の登録ボタンは form 直下の type=submit（フッター transfer_new.twig:418）。
    this.transferRegisterButton = page.locator("#stock_transfer_new_form button[type=submit]").first();

    // form_errors の出力要素は要実機確認。Bootstrap想定で .invalid-feedback、未確定時は本文テキストで判定する。
    this.error = page.locator(".invalid-feedback, .text-danger, .alert-danger");
  }

  // ===== URL ビルダ / 遷移 =====
  moveNewUrlWith(productStockIds: Array<number | string>): string {
    const q = productStockIds.map((id) => `productStockIds%5B%5D=${id}`).join("&");
    return `${this.moveNewUrl}?${q}`;
  }
  transferNewUrlWith(productStockIds: Array<number | string>): string {
    const q = productStockIds.map((id) => `productStockIds%5B%5D=${id}`).join("&");
    return `${this.transferNewUrl}?${q}`;
  }
  moveEditUrl(id: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/stock/move/outbound_approval_request/${id}`;
  }
  destApiUrl(productClassId: number | string): string {
    return `${this.destProductClassInfoPath}?product_class_id=${productClassId}`;
  }

  async gotoMoveNew(productStockIds: Array<number | string>) {
    await this.page.goto(this.moveNewUrlWith(productStockIds));
  }
  async gotoTransferNew(productStockIds: Array<number | string>) {
    await this.page.goto(this.transferNewUrlWith(productStockIds));
  }
  async gotoMoveEdit(id: number | string) {
    await this.page.goto(this.moveEditUrl(id));
  }

  // ===== 操作 =====

  /** 移動 初期登録のUI部品が仕様どおり表示されること。 */
  async seeMoveNewForm() {
    await expect(this.moveToBaseInfo).toBeVisible();
    await expect(this.moveToStockLocation).toBeVisible();
    await expect(this.moveQuantity0).toBeVisible();
    await expect(this.moveMemo).toBeVisible();
    await expect(this.moveRegisterButton).toBeVisible();
  }

  /** 振替 初期登録のUI部品が仕様どおり表示されること。 */
  async seeTransferNewForm() {
    await expect(this.transferNotifyMembers).toBeVisible();
    await expect(this.transferDestCode0).toBeVisible();
    await expect(this.transferSearchButton).toBeVisible();
    await expect(this.transferQuantity0).toBeVisible();
    await expect(this.transferMemo).toBeVisible();
    await expect(this.transferRegisterButton).toBeVisible();
  }

  /**
   * 入庫先店舗・在庫区分を選択する。登録ボタンのJSは form.reportValidity() 通過後にのみ
   * 確認モーダルを開く（move_new.twig:41-46）。move_to_base_info / move_to_stock_location_id は
   * 必須（move_new.twig:99,111）のため、表示・送信系では必ず選択しておく必要がある。
   * 選択肢の値は環境/シード依存のため、特定値ではなくインデックスで先頭の実選択肢を選ぶ（オラクル非依存）。
   */
  async selectMoveDestByIndex(index = 1) {
    await this.moveToBaseInfo.selectOption({ index });
    await this.moveToStockLocation.selectOption({ index });
  }

  /**
   * 入庫先に出庫元（先頭在庫由来の hidden 値）と同一の店舗・区分を選択する。
   * 同一店舗・同一区分の相関エラー（追加バリデーション）を再現するための、シード非依存の手段。
   */
  async selectMoveDestSameAsSource() {
    const baseId = await this.moveFromBaseInfoId.inputValue();
    const locId = await this.moveFromStockLocationId.inputValue();
    await this.moveToBaseInfo.selectOption(baseId);
    await this.moveToStockLocation.selectOption(locId);
  }

  /** 承認通知先メンバーを先頭の実選択肢で選ぶ（特定値ではなくインデックス＝オラクル非依存）。 */
  async selectFirstNotifyMember(index = 1) {
    await this.transferNotifyMembers.selectOption({ index });
  }

  /** 移動 登録ボタン押下で確認モーダルを開く（type=button・JSでモーダル表示。要実機確認）。 */
  async openMoveConfirm() {
    await this.moveRegisterButton.click();
  }

  /** 移動 登録を確定送信する（確認モーダル→submit）。 */
  async submitMove() {
    await this.moveRegisterButton.click();
    await this.moveConfirmSubmit.click();
  }

  /** 振替 登録を送信する。 */
  async submitTransfer() {
    await this.transferRegisterButton.click();
  }

  /** 振替先「検索」ボタンで商品検索モーダルを開く。 */
  async openTransferProductSearch() {
    await this.transferSearchButton.click();
  }
}
