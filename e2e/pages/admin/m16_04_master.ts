/** M16-04 MTGマスターデータ編集（メニュー「データ管理」→「MTGマスターデータ」）と、システム設定のマスターデータ管理 */
import { Locator, Page, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export class MtgMasterEditPage {
  constructor(readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto(adminUrl("/data/mtg_master_data"));
    await this.page.waitForLoadState("load");
    await expect(this.選択欄, "MTGマスターデータ選択").toBeVisible();
  }
  get 選択欄(): Locator { return this.page.locator('select[name="entity"]'); }
  get 選択ボタン(): Locator { return this.page.locator('form[method="get"] button[type="submit"]'); }
  /** 一覧と登録ボタンの領域 */
  get 一覧の領域(): Locator { return this.page.locator("form#edit_form"); }
  get 登録ボタン(): Locator { return this.page.locator('button[type="submit"][form="edit_form"]'); }
  async 選択肢の表示名(): Promise<string[]> { return (await this.選択欄.locator("option").allInnerTexts()).map((t) => t.trim()); }
  async 選ばれている表示名(): Promise<string> { return ((await this.選択欄.locator("option:checked").textContent()) ?? "").trim(); }
  /** 開発者ツールで行うのと同じに、選択欄へ選択肢に無い値を足して選ぶ */
  async 送信値を書き換える(値: string): Promise<void> {
    await this.選択欄.evaluate((e, v) => { const s = e as HTMLSelectElement; s.add(new Option(v, v)); s.value = v; }, 値);
  }
  async 選択を押す(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 45_000 }), this.選択ボタン.click({ timeout: 20_000 })]);
    await this.page.waitForLoadState("load");
  }
  get カード名リスト作成リンク(): Locator { return this.page.getByRole("link", { name: "カード一覧の「カード名リスト作成」" }); }
}

/** システム設定のマスターデータ管理の選択欄の選択肢の表示名 */
export async function マスターデータ管理の選択肢(page: Page): Promise<string[]> {
  await page.goto(adminUrl("/setting/system/masterdata"));
  await page.waitForLoadState("load");
  const sel = page.locator("form select").first();
  await expect(sel, "マスターデータ管理の選択欄").toBeVisible();
  return (await sel.locator("option").allInnerTexts()).map((t) => t.trim());
}
