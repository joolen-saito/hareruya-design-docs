/** M05-26 出荷実績インポート登録の画面（メニュー「受注管理」→「出荷実績登録CSVアップロード」） */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export class ShippingResultImportPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/order/shipping_result_csv/import"));
    await this.page.waitForLoadState("load");
    expect(res?.status() ?? 0, "出荷実績インポート登録画面の応答").toBeLessThan(400);
  }

  /** 「ファイルを選択」ボタンを押し、開いたファイル選択ダイアログ（のうち、取り込みの入力）を返す。開かなければ null */
  async ファイルを選択を押す(): Promise<{ 開いた: boolean; 複数選択: boolean | null; 受け付ける形式: string | null }> {
    const button = this.page.locator("#file-select");
    await expect(button, "「ファイルを選択」ボタン").toBeVisible();
    const chooser = this.page.waitForEvent("filechooser", { timeout: 10_000 }).then((c) => c, () => null);
    await button.click();
    const c = await chooser;
    if (!c) return { 開いた: false, 複数選択: null, 受け付ける形式: null };
    return { 開いた: true, 複数選択: c.isMultiple(), 受け付ける形式: await this.page.locator("#admin_csv_import_import_file").getAttribute("accept") };
  }
}
