/**
 * F04-02 ご注文方法指定画面のポイント欄・支払方法の操作（-f）。セレクタはここだけに書く。
 * 作りは Shopping/index.twig のポイント欄（ためる・使うの選択と使用ポイントの入力欄）と、hareruya-checkout.js（ためるを選ぶと入力欄を無効にする）。
 */
import { Locator, Page } from "@playwright/test";

export class ShoppingPointArea {
  constructor(readonly page: Page) {}
  get 欄(): Locator { return this.page.locator("[data-js-point-interaction]").first(); }
  get ポイント残高の表示(): Locator { return this.欄.locator("p.c-hareruya-text").first(); }
  get ためる(): Locator { return this.欄.locator("[data-js-point-save]").first(); }
  get 使う(): Locator { return this.欄.locator("[data-js-point-use]").first(); }
  get 使用ポイント(): Locator { return this.欄.locator("[data-js-point-input]").first(); }

  /** ためる・使うを選ぶ（ラベルを押す。入力は画面のスクリプトが切り替える） */
  async 選ぶ(どちら: "ためる" | "使う"): Promise<void> {
    const r = どちら === "ためる" ? this.ためる : this.使う;
    const id = await r.getAttribute("id");
    const label = id ? this.page.locator(`label[for="${id}"]`) : null;
    if (label && (await label.count()) > 0 && (await label.first().isVisible())) await label.first().click();
    else await r.check({ force: true });
    await this.page.waitForTimeout(300);
  }
  async 使用ポイントが有効か(): Promise<boolean> { return this.使用ポイント.isEnabled(); }

  /** 選択中の支払方法の値を別の値に変えて、変更の知らせ（change）を送る。開発者ツールで値を書き換える操作の代わり */
  async 選択中の支払方法の値を変える(新しい値: string): Promise<{ 元の値: string }> {
    const sel = 'input[name="_shopping_order[Payment]"]:checked';
    const 元の値 = await this.page.locator(sel).first().getAttribute("value") ?? "";
    const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }).catch(() => undefined);
    await this.page.locator(sel).first().evaluate((el, v) => {
      const i = el as HTMLInputElement;
      i.value = v;
      i.dispatchEvent(new Event("change", { bubbles: true }));
    }, 新しい値);
    await nav;
    await this.page.waitForLoadState("load");
    return { 元の値 };
  }
}
