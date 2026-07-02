import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注管理「出荷実績入力用CSV出力」Page Object（M05-24）。
 * 納品ケース表 integration_test/e2e/m05_24_admin_order_order_shipping_export_for_import_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.md / 観点表)由来
 * （オラクル独立性）。実装の現挙動・CSV列構成・文字コード・区切り・ファイル名prefixは期待値に流用しない。
 *
 * 本機能は受注メニュー「出荷指示一覧」→「出荷指示編集」画面の一覧フォーム（#form_bulk）直上の
 * 「出荷実績入力用CSVダウンロード」ボタン（#orderExportForInput・確認ダイアログなし）から、
 * チェック済み受注の内部ID（order_ids[受注ID]）を出力ルートへ POST submit し、StreamedResponse で
 * CSVをダウンロードする。order_ids が空/非配列のときは「選択してください」フラッシュ＋Referer/受注一覧へリダイレクト。
 *
 * セレクタは Twig 由来の位置情報のみ。ルート/ID/trans キーを主セレクタとし、CSSクラスは補助に留める:
 *  - 出荷指示一覧:   route admin_shipping_standby = GET/POST /<route>/standby/search（ShippingStandbyController.php:93-108）
 *      サブタイトル trans admin.order.shipping_standby_export=「出荷指示リストエクスポート」（messages.ja.yaml:2475）
 *  - 出荷指示編集:   route admin_shipping_standby_edit = GET/POST /<route>/standby/{id}/edit（ShippingStandbyController.php:152）
 *      一覧フォーム #form_bulk（edit.twig:113）/ 全選択 #check-all（edit.twig:142）
 *      各行チェック input[name="order_ids[{Order.id}]"] checked（edit.twig:157）
 *  - 出力ボタン:     #orderExportForInput（edit.twig:126）
 *      文言 trans admin.order.shipping_export_for_import=「出荷実績入力用CSVダウンロード」（edit.twig:127 / messages.ja.yaml:3819）
 *      JS: target除去→action=admin_order_export_for_input→submit（edit.twig:37-42）
 *  - 出力ルート:     admin_order_export_for_input = GET/POST /<route>/order/export/order（OrderCsvController.php:191）
 *      成功: StreamedResponse でCSV（OrderCsv.php:57）/ ファイル名 order_<YmdHis>.csv（正本md:68）
 *      選択欠損: addError admin.common.select=「選択してください」（OrderCsvController.php:202 / messages.ja.yaml:1530）→ Referer/admin_order へ（:206-209）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class OrderOrderShippingExportForImportPage {
  readonly page: Page;
  readonly standbyListUrl: string; // 出荷指示一覧（起点導線）
  readonly exportPath: string; // 出荷実績入力用CSV出力ルート（直接アクセス／未認証ガード検証用）

  readonly exportButton: Locator; // 出力ボタン #orderExportForInput（edit.twig:126）
  readonly checkAll: Locator; // 全選択チェック #check-all（edit.twig:142）
  readonly orderCheckboxes: Locator; // 各行チェック name=order_ids[...]（edit.twig:157）
  readonly bulkForm: Locator; // 一覧フォーム #form_bulk（edit.twig:113）

  constructor(page: Page) {
    this.page = page;
    this.standbyListUrl = `/${ECCUBE_ADMIN_ROUTE}/standby/search`;
    this.exportPath = `/${ECCUBE_ADMIN_ROUTE}/order/export/order`;

    this.exportButton = page.locator("#orderExportForInput");
    this.checkAll = page.locator("#check-all");
    // 実DOM根拠 name="order_ids[{{ Order.id }}]"（edit.twig:157）。type=checkbox かつ "order_ids[" 接頭辞に限定し誤一致を避ける。
    this.orderCheckboxes = page.locator('input[type="checkbox"][name^="order_ids["]');
    this.bulkForm = page.locator("#form_bulk");
  }

  /** 出荷指示一覧（出力導線の起点）を開く。 */
  async gotoStandbyList() {
    await this.page.goto(this.standbyListUrl);
  }

  /** 出荷指示編集画面を開く（id は STANDBY シードから供給。ハードコードしない）。 */
  async gotoEdit(standbyId: string | number) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/standby/${standbyId}/edit`);
  }

  /** 出力URLへ直接GETアクセスする（ブックマーク／アドレスバー起点・未認証/選択欠損ガード検証用）。 */
  async gotoExportDirect() {
    // 添付（ダウンロード）応答やリダイレクトでナビゲーションが中断される場合のみ許容し、
    // それ以外（ネットワーク失敗・タイムアウト等）は失敗診断を残すため再送出する。
    await this.page.goto(this.exportPath).catch((e: unknown) => {
      const msg = String(e);
      if (/aborted|interrupted|download/i.test(msg)) {
        return null; // 添付応答によるナビゲーション中断は想定内
      }
      throw e;
    });
  }

  /** 全行のチェックを外す（選択欠損＝order_ids空の状態を作る）。 */
  async uncheckAll() {
    if (await this.checkAll.isChecked()) {
      await this.checkAll.uncheck();
    }
    const count = await this.orderCheckboxes.count();
    for (let i = 0; i < count; i++) {
      const cb = this.orderCheckboxes.nth(i);
      if (await cb.isChecked()) {
        await cb.uncheck();
      }
    }
  }

  /**
   * 出力ボタンを押下し、ダウンロード発火を待って Download を返す（チェック付き受注がある前提）。
   * JS が form_bulk を出力ルートへ POST submit する（確認ダイアログは出ない＝仕様: フロント挙動）。
   */
  async clickExportAndWaitDownload(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.exportButton.click(),
    ]);
    return download;
  }

  /** 出力ボタンを押下する（選択欠損時はダウンロードが発火せずフラッシュ＋リダイレクトになる）。 */
  async clickExport() {
    await this.exportButton.click();
  }

  /** 出荷指示編集画面の出力ボタン・チェックボックスが仕様どおり表示されること。 */
  async seeExportButton() {
    await expect(this.exportButton).toBeVisible();
    await expect(this.exportButton).toContainText("出荷実績入力用CSVダウンロード"); // trans admin.order.shipping_export_for_import
  }
}
