/** 配送方法設定（メニュー「設定」→「店舗設定」→「配送方法設定」）。M10-06 の画面操作。 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

const LIST = "/setting/shop/delivery";
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const nm = (n: string) => `[name="delivery[${n}]"]`;

export type 配送方法の入力 = { 配送業者名: string; 名称: string; 英語名称: string; 支払方法: string[]; 送料: string | null; 出荷指示から除外?: boolean };

export class DeliveryPage {
  constructor(readonly page: Page) {}

  async openList(): Promise<void> {
    await this.page.goto(adminUrl(LIST), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    await expect(this.page.locator("li.sortable-item").first(), "配送方法一覧").toBeVisible({ timeout: 30_000 });
  }
  行(配送業者名: string): Locator {
    return this.page.locator("li.sortable-item").filter({ has: this.page.locator("a[href$='/edit']", { hasText: new RegExp(`^\\s*${esc(配送業者名)}\\s*/`) }) });
  }
  async 行のID(配送業者名: string): Promise<string> {
    return ((await this.行(配送業者名).locator("div.col-auto.d-flex").nth(1).innerText()) ?? "").trim();
  }
  /** 一覧で配送業者名のリンクを押して編集画面を開く */
  async 編集を開く(配送業者名: string): Promise<void> {
    await this.openList();
    await Promise.all([this.page.waitForLoadState("load"), this.行(配送業者名).locator("a[href$='/edit']").first().click({ timeout: 30_000 })]);
    await expect(this.page.locator(nm("name")), "配送方法の編集画面の配送業者名欄").toBeVisible({ timeout: 30_000 });
  }
  async 新規登録を開く(): Promise<void> {
    await this.page.goto(adminUrl(`${LIST}/new`), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    await expect(this.page.locator(nm("name")), "配送方法の編集画面の配送業者名欄").toBeVisible({ timeout: 30_000 });
  }
  支払方法の箱(名称: string): Locator {
    return this.page.locator('input[type=checkbox][name="delivery[payments][]"]').and(this.page.getByRole("checkbox", { name: 名称, exact: true }));
  }
  async 支払方法を選ぶ(名称: string, 選ぶ: boolean): Promise<void> {
    const 箱 = this.支払方法の箱(名称);
    await expect(箱, `支払方法「${名称}」のチェックボックス`).toHaveCount(1, { timeout: 30_000 });
    await 箱.setChecked(選ぶ, { timeout: 30_000 });
  }
  async 選ばれた支払方法(): Promise<string[]> {
    return this.page.locator('input[type=checkbox][name="delivery[payments][]"]').evaluateAll((ns) => (ns as HTMLInputElement[]).filter((n) => n.checked).map((n) => n.labels?.item(0)?.textContent?.trim() ?? n.value));
  }
  async 全部の支払方法(): Promise<string[]> {
    return this.page.locator('input[type=checkbox][name="delivery[payments][]"]').evaluateAll((ns) => (ns as HTMLInputElement[]).map((n) => n.labels?.item(0)?.textContent?.trim() ?? n.value));
  }
  get 除外の箱() { return this.page.locator(nm("is_shipping_standby_list_exclusion")); }
  /** 送料を47都道府県すべてに同じ額で足す（画面の「新規登録」の行を47回使う） */
  async 全都道府県の送料を足す(送料: string): Promise<void> {
    const sel = this.page.locator("#add-delivery-fee-pref");
    const ids = await sel.locator("option").evaluateAll((os) => (os as HTMLOptionElement[]).map((o) => o.value).filter((v) => v));
    for (const id of ids) {
      await sel.selectOption(id, { timeout: 30_000 });
      await this.page.locator("#add-delivery-fee-value").fill(送料, { timeout: 30_000 });
      await this.page.locator("#add-delivery-fee-button").click({ timeout: 30_000 });
    }
    await expect(this.page.locator("#delivery-fee-group .delivery-fee-item"), "追加した都道府県別送料の行").toHaveCount(ids.length, { timeout: 30_000 });
  }
  async 登録を押す(): Promise<void> {
    await Promise.all([this.page.waitForLoadState("load"), this.page.locator("#delivery-registration-button").click({ timeout: 30_000 })]);
    await this.page.waitForLoadState("load");
  }
  async 作る(v: 配送方法の入力): Promise<string> {
    await this.新規登録を開く();
    await this.page.locator(nm("name")).fill(v.配送業者名, { timeout: 30_000 });
    await this.page.locator(nm("service_name")).fill(v.名称, { timeout: 30_000 });
    await this.page.locator(nm("service_name_en")).fill(v.英語名称, { timeout: 30_000 });
    if (v.出荷指示から除外) await this.除外の箱.setChecked(true, { timeout: 30_000 });
    for (const p of v.支払方法) await this.支払方法を選ぶ(p, true);
    if (v.送料 !== null) await this.全都道府県の送料を足す(v.送料);
    await this.登録を押す();
    await expectSaved(this.page, `配送方法「${v.配送業者名}」の登録`);
    await this.openList();
    return this.行のID(v.配送業者名);
  }
  /** 一覧の行の削除→確認モーダル */
  async 削除を押す(配送業者名: string): Promise<string> {
    await this.page.waitForLoadState("load");
    await this.行(配送業者名).locator('a[data-bs-target="#DeleteModal"]').click({ timeout: 30_000 });
    const modal = this.page.locator("#DeleteModal");
    await expect(modal, "削除確認モーダル").toBeVisible({ timeout: 30_000 });
    await expect.poll(async () => (await modal.locator('a.btn-ec-delete[data-method="delete"]').getAttribute("href")) ?? "#", "削除の送り先").toMatch(/delivery\/\d+\/delete/);
    return ((await modal.locator("p.modal-message").innerText()) ?? "").trim();
  }
  async モーダルで削除する(): Promise<void> {
    await Promise.all([this.page.waitForLoadState("load"), this.page.locator('#DeleteModal a.btn-ec-delete[data-method="delete"]').click({ timeout: 30_000 })]);
    await this.page.waitForLoadState("load");
  }
  async モーダルでキャンセルする(): Promise<void> {
    await this.page.locator('#DeleteModal .modal-footer button[data-bs-dismiss="modal"]').click({ timeout: 30_000 });
    await expect(this.page.locator("#DeleteModal"), "削除確認モーダルが閉じる").toBeHidden({ timeout: 30_000 });
  }
}
