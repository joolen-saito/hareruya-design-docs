/** M05-11 受注情報編集の続き（-q）の操作。セレクタはここだけに書く。正本: cases/M05-11_test_cases.tsv */
import { Locator, Page, expect } from "@playwright/test";
import { 明細行 } from "./m05_11_order_edit";

export class OrderEditQ {
  constructor(readonly page: Page) {}

  // ---- お支払情報 ----
  get 変更後お支払方法(): Locator { return this.page.locator("#order_Payment"); }
  async お支払方法の選択肢(): Promise<string[]> { return (await this.変更後お支払方法.locator("option").allTextContents()).map((t) => t.trim()); }
  async お支払方法を選ぶ(名前: string): Promise<void> {
    const have = await this.お支払方法の選択肢();
    if (!have.includes(名前)) throw new Error(`変更後お支払方法に「${名前}」が無い（${have.join("、")}）`);
    await this.変更後お支払方法.selectOption({ label: 名前 });
  }
  async 選択中のお支払方法(): Promise<string> { return ((await this.変更後お支払方法.locator("option:checked").first().textContent()) ?? "").trim(); }

  // ---- 履歴画面の入力欄（変更後のステータス・スマレジメモ・ショップ用メモ欄・ポイント連携エラー） ----
  /** 欄の名前 → その入力欄 */
  履歴の欄(名前: "変更後のステータス" | "スマレジメモ" | "ショップ用メモ欄" | "ポイント連携エラー"): Locator {
    const sel = { 変更後のステータス: "#order_OrderStatus", スマレジメモ: "#order_smaregi_memo", ショップ用メモ欄: "#order_note", ポイント連携エラー: "#pointErrorMessage textarea" }[名前];
    return this.page.locator(sel).first();
  }
  async 欄が開いている(): Promise<void> {
    if (!(await this.page.locator("#pointErrorMessage").evaluate((e) => e.classList.contains("show")).catch(() => false))) {
      await this.page.locator('a[data-bs-toggle="collapse"][href="#pointErrorMessage"]').first().click({ timeout: 20_000 });
      await this.page.waitForTimeout(600);
    }
  }
  /** 欄を操作できるか（活性か。入力・選択を試して通るか） */
  async 操作できるか(欄: Locator, 名前: string): Promise<{ 活性: boolean; 入力できた: boolean }> {
    await expect(欄, `${名前}の欄`).toBeAttached();
    const 活性 = await 欄.isEditable();
    const tag = await 欄.evaluate((e) => e.tagName.toLowerCase());
    const 入力できた = tag === "select"
      ? await 欄.selectOption({ index: 0 }, { timeout: 2_000 }).then(() => true, () => false)
      : await 欄.fill("入力を試みた文", { timeout: 2_000 }).then(() => true, () => false);
    return { 活性, 入力できた };
  }

  // ---- スマレジ受注の金額欄 ----
  金額欄の見出し(見出し: string): Locator { return this.page.locator("span.align-middle").filter({ hasText: 見出し }); }

  // ---- 商品の追加（在庫0の警告） ----
  async 商品の追加を開く(): Promise<void> {
    await this.page.locator('a[data-bs-target="#addProduct"]').first().click({ timeout: 20_000 });
    await expect(this.page.locator("#addProduct"), "商品の追加モーダル").toBeVisible();
  }
  async 商品を検索する(検索語: string): Promise<void> {
    const modal = this.page.locator("#addProduct");
    await modal.locator('input[type="text"]').first().fill(検索語, { timeout: 20_000 });
    await modal.locator("#searchProductModalButton").click({ timeout: 20_000 });
  }
  async 規格を選んで決定する(商品コード: string): Promise<void> {
    const row = this.page.locator("#searchProductModalList tr").filter({ has: this.page.locator(`option[data-product-code="${商品コード}"]`) });
    await expect(row, `検索結果に商品コード「${商品コード}」の規格を持つ商品が1件`).toHaveCount(1, { timeout: 60_000 });
    const value = await row.locator(`option[data-product-code="${商品コード}"]`).first().getAttribute("value");
    await row.locator("select").first().selectOption(value!, { timeout: 20_000 });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 180_000 }), row.locator("button.add-order-item").click({ timeout: 20_000 })]);
    await this.page.waitForLoadState("load");
  }
  /** 画面に出ている在庫についての警告の文（無ければ空） */
  async 在庫の警告(): Promise<string[]> {
    const w = this.page.locator(".alert-warning, .alert-danger, .c-alert, .alert").filter({ hasText: "在庫" });
    await w.first().waitFor({ state: "visible", timeout: 30_000 }).catch(() => undefined);
    return (await w.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }

  // ---- 明細・お届け先 ----
  async 数量を入れる(商品コード: string, 数量: string): Promise<void> {
    const row = 明細行(this.page, 商品コード);
    await expect(row, `明細に商品コード「${商品コード}」の行が1行`).toHaveCount(1);
    await row.locator('input[name$="[quantity]"]').fill(数量, { timeout: 20_000 });
  }
  async お届け先を入れる(v: { 郵便1: string; 郵便2: string; 住所1: string; 住所2: string; 住所3: string }): Promise<void> {
    if (!(await this.page.locator("#order_Shipping_postalCode_postalCode01").isVisible())) {
      await this.page.locator('a[href="#shippingInfo"]').first().click({ timeout: 20_000 });
      await expect(this.page.locator("#order_Shipping_postalCode_postalCode01"), "お届け先情報の郵便番号1").toBeVisible();
    }
    for (const [id, 値] of [["postalCode_postalCode01", v.郵便1], ["postalCode_postalCode02", v.郵便2], ["address_addr01", v.住所1], ["address_addr02", v.住所2], ["address_addr03", v.住所3]] as const) {
      await this.page.locator(`#order_Shipping_${id}`).fill(値, { timeout: 20_000 });
    }
  }
}
