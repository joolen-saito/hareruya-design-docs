/**
 * F04-04 決済〜購入完了の公開側の操作。ご注文方法指定画面の配送方法・支払方法の選択、確定のチェックと「注文する」、購入完了画面の読み取り。
 * セレクタはここだけに書く。ご注文方法指定画面の作りは F04-02 の部品（f04_shopping.ts・f04_order_flow.ts）と同じ
 * （配送方法・支払方法を選ぶと画面が再読み込みされる。確定のチェックのあと「注文する」を押すと購入完了画面へ移る）。
 * 正本: cases/F04-04_test_cases.tsv
 */
import { expect, Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { ShoppingPage } from "./f04_shopping";

const PAYMENT = 'input[name="_shopping_order[Payment]"]';
const DELIVERY = 'input[name="_shopping_order[Shippings][0][Delivery]"]';
const T = 30_000;

type 選択肢 = { value: string; label: string; checked: boolean };
async function 選択肢を読む(page: Page, sel: string): Promise<選択肢[]> {
  return page.locator(sel).evaluateAll((ns) => ns.map((n) => ({
    value: (n as HTMLInputElement).value,
    label: ((n as HTMLInputElement).closest("label")?.textContent ?? "").replace(/\s+/g, " ").trim(),
    checked: (n as HTMLInputElement).checked,
  })));
}

/** 選択肢の名前（表示の先頭が名前。手数料などが後ろに付くことがある）で、ラジオを選んで再読み込みを待つ */
async function 名前で選ぶ(page: Page, sel: string, 名前: string, 何: string): Promise<void> {
  const choices = await 選択肢を読む(page, sel);
  const pick = choices.find((c) => c.label === 名前) ?? choices.find((c) => c.label.startsWith(名前));
  if (!pick) throw new Error(`${何}に「${名前}」が無い（ある選択肢: ${choices.map((c) => c.label).join("、")}）`);
  const radio = page.locator(`${sel}[value="${pick.value}"]`);
  for (let i = 0; i < 3 && !(await radio.isChecked()); i++) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }).catch(() => undefined),
      radio.check({ force: true, timeout: T }),
    ]);
    await page.waitForLoadState("load");
  }
  await expect(page.locator(`${sel}[value="${pick.value}"]`), `${何}「${名前}」が選ばれた`).toBeChecked({ timeout: T });
}

export class CheckoutPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  get パス(): string { return new URL(this.page.url()).pathname; }

  /** ご注文方法指定画面を開く（アドレスを直接開く。購入処理中の受注を同じセッションで開き直す） */
  async ご注文方法指定画面を開く(): Promise<void> {
    await new ShoppingPage(this.page).直接開く();
  }
  /** 買い物かご画面から購入手続きへ進み、ご注文方法指定画面を開く */
  async 買い物かごから開く(): Promise<void> {
    await new ShoppingPage(this.page).買い物かごから開く();
  }
  async 配送方法を選ぶ(名前: string): Promise<void> { await 名前で選ぶ(this.page, DELIVERY, 名前, "配送方法"); }
  async 支払方法を選ぶ(名前: string): Promise<void> { await 名前で選ぶ(this.page, PAYMENT, 名前, "お支払い方法"); }
  async 選ばれている支払方法(): Promise<string> {
    return (await 選択肢を読む(this.page, PAYMENT)).find((c) => c.checked)?.label ?? "";
  }

  get 確定のチェック(): Locator { return this.page.locator('input[name="_shopping_order[accept_order]"]'); }
  get 注文するボタン(): Locator { return this.page.locator("button[data-js-payment-submit]"); }

  /** 確定のチェックを付ける */
  async 確定のチェックを付ける(): Promise<void> {
    await expect(this.確定のチェック, "「この内容で注文を確定します。」のチェック").toHaveCount(1, { timeout: T });
    await this.確定のチェック.check({ force: true, timeout: T });
  }
  /** 「注文する」を押し、移った先まで待つ。移った先のパスを返す */
  async 注文するを押す(): Promise<string> {
    await expect(this.注文するボタン, "「注文する」ボタンが押せる").toBeEnabled({ timeout: T });
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }),
      this.注文するボタン.click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
    return this.パス;
  }

  // ---- 購入完了画面 ----
  async 購入完了画面か(): Promise<boolean> { return /\/shopping\/complete\/?$/.test(this.パス); }
  /** 購入完了画面のメッセージの番号の行（「ご注文番号 …」または「TC注文番号 …」） */
  get 番号の行(): Locator { return this.page.locator(".p-hareruya-complete__message-content p.c-hareruya-heading--lev3"); }
  async 番号の行の文(): Promise<string[]> {
    return (await this.番号の行.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }
  /** 購入完了画面のご注文番号（「ご注文番号」の行が無ければ空） */
  async ご注文番号(): Promise<string> {
    for (const t of await this.番号の行の文()) {
      const m = /^ご注文番号\s*(\S+)/.exec(t);
      if (m) return m[1];
    }
    return "";
  }
  get ヘルプページのリンク(): Locator {
    return this.page.locator(".p-hareruya-complete__text-wrap a", { hasText: "ヘルプページ" }).first();
  }
  /** システムエラー画面か（画面の見出し・本文に「システムエラー」が出る） */
  async システムエラー画面か(): Promise<boolean> {
    const t = ((await this.page.locator("body").innerText().catch(() => "")) ?? "").slice(0, 3000);
    return /システムエラー/.test(t);
  }
  async 購入完了画面のURLを開く(): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/shopping/complete`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
}
