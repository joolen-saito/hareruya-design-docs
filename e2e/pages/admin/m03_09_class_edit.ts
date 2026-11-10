/**
 * M03-09 商品規格登録/編集の画面操作と読み取り（商品規格登録/編集画面・商品規格一覧）。セレクタはここだけに書く。
 * 登録・削除などの基本の操作は pages/admin/m03_30_products.ts の部品を使い、ここでは M03-09 のケースが見る欄を足す。
 * 正本: cases/M03-09_test_cases.tsv
 */
import { expect, Locator, Page, Response } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel } from "./common";

const T = 30_000;

export class ClassEditPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }

  get form(): Locator { return this.page.locator("form#form"); }
  get 言語(): Locator { return this.form.locator("#admin_product_class_Language"); }
  get 状態(): Locator { return this.form.locator("#admin_product_class_CardCondition"); }
  get 状態名(): Locator { return this.form.locator("#admin_product_class_card_condition_name"); }
  get 公開ステータス(): Locator { return this.form.locator("#admin_product_class_Status"); }
  get セールフラグ(): Locator { return this.form.locator("#admin_product_class_sale_flg"); }
  get 販売価格(): Locator { return this.form.locator("#admin_product_class_price02"); }
  get 基準価格(): Locator { return this.form.locator("#admin_product_class_standard_price"); }
  get 買取価格(): Locator { return this.form.locator("#admin_product_class_buy_price"); }
  get 商品コード(): Locator { return this.form.locator("#admin_product_class_code"); }
  get スマレジ商品コード(): Locator { return this.form.locator("#admin_product_class_smaregi_product_code"); }
  get 販売制限数(): Locator { return this.form.locator("#admin_product_class_sale_limit"); }
  get 状態別称(): Locator { return this.form.locator("#admin_product_class_memo"); }
  get 部門(): Locator { return this.form.locator("#admin_product_class_Section"); }
  get 代表画像(): Locator { return this.form.locator("#admin_product_class_ProductClassImages"); }
  get なりすまし対策(): Locator { return this.page.locator('form#form input[name="admin_product_class[_token]"]'); }
  get 削除ボタン(): Locator { return this.page.getByRole("link", { name: "商品規格を削除" }); }
  get 削除の確定(): Locator { return this.page.locator('#deleteConfirmModal a[data-method="delete"]'); }
  get 一覧へ戻る(): Locator { return this.page.locator(`a.c-baseLink[href*="/product/product/class/"]`).first(); }
  get 登録ボタン(): Locator { return this.page.getByRole("button", { name: "商品規格を登録", exact: true }); }
  get 期間別の販売数(): Locator { return this.page.locator("#salesQuantity"); }
  get 画面のエラー(): Locator { return this.page.locator(".alert-danger, .invalid-feedback, .form-error-message, span.text-danger").filter({ hasText: /\S/ }); }

  /** 商品規格登録/編集画面の、見出しが「名前」の行（読み取り表示の値を読む） */
  行(名前: string): Locator {
    return this.page.locator("#productClass .row").filter({ has: this.page.locator("span", { hasText: new RegExp(`^\\s*${名前}\\s*$`) }) }).first();
  }
  async 行の値(名前: string): Promise<string> {
    const row = this.行(名前);
    if ((await row.count()) === 0) return "";
    return ((await row.locator(".col").first().innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
  }
  /** 登録日・更新日（「：2026/11/10」の形） */
  日付の行(名前: "登録日" | "更新日"): Locator {
    return this.page.locator("#update .row").filter({ has: this.page.locator("span", { hasText: new RegExp(`^\\s*${名前}\\s*$`) }) }).first();
  }

  async 新規で開く(商品ID: string): Promise<Response | null> {
    const r = await this.page.goto(adminUrl(`/product/product/class/${商品ID}/new`));
    await this.page.waitForLoadState("load");
    return r;
  }
  async 編集で開く(商品ID: string, 商品規格ID: string): Promise<Response | null> {
    const r = await this.page.goto(adminUrl(`/product/product/class/${商品ID}/edit/${商品規格ID}`));
    await this.page.waitForLoadState("load");
    return r;
  }
  /** 選択欄の選択肢の文字（空の選択肢は除く） */
  async 選択肢(l: Locator): Promise<string[]> {
    return (await l.locator("option").evaluateAll((os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, t: (o.textContent ?? "").trim() }))))
      .filter((o) => o.v !== "").map((o) => o.t);
  }
  async 選んでいる文字(l: Locator): Promise<string> {
    return ((await l.locator("option:checked").first().textContent().catch(() => "")) ?? "").trim();
  }
  async 状態を選ぶ(名前: string): Promise<void> { await chooseByLabel(this.状態, 名前); await this.状態.dispatchEvent("change"); }
  async 公開ステータスを選ぶ(名前: string): Promise<void> { await chooseByLabel(this.公開ステータス, 名前); }
  async 部門を選ぶ(部門ID: string): Promise<void> { await this.部門.selectOption({ value: 部門ID }); }
  async スマレジ連携を選ぶ(連携する: boolean): Promise<void> {
    await this.page.locator(`form#form input[name="admin_product_class[smaregi_alignment_flg]"][value="${連携する ? "1" : "0"}"]`).check();
  }
  async スマレジ連携の値(): Promise<string> {
    return (await this.page.locator('form#form input[name="admin_product_class[smaregi_alignment_flg]"]:checked').getAttribute("value").catch(() => "")) ?? "";
  }
  /** 金額の欄の値（3桁区切りを外した数字） */
  async 金額(l: Locator): Promise<string> { return (await l.inputValue()).replace(/,/g, ""); }

  /** 「商品規格を登録」を押して画面が移るのを待つ。移った先の応答の状態と、途中の転送（302）があったかを返す */
  async 登録を押す(): Promise<{ 状態: number; 転送があった: boolean; URL: string }> {
    let 転送 = false;
    const onResp = (r: Response) => { if (r.request().method() === "POST" && r.status() >= 300 && r.status() < 400) 転送 = true; };
    this.page.on("response", onResp);
    try {
      const [res] = await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), this.登録ボタン.click()]);
      return { 状態: res?.status() ?? 0, 転送があった: 転送, URL: this.page.url() };
    } finally { this.page.off("response", onResp); }
  }
  /** 「商品規格を削除」を押して確認で削除する（画面のスクリプトの読み込みを待ってから押す） */
  async 削除する(): Promise<void> {
    await this.page.waitForLoadState("load");
    await this.削除ボタン.click();
    await expect(this.削除の確定, "削除の確認").toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), this.削除の確定.click()]);
  }
  /** 「商品規格を削除」の確定のリンク先（削除の要求のアドレス） */
  async 削除のリンク先(): Promise<string> {
    const href = await this.削除の確定.getAttribute("href");
    if (!href) throw new Error("商品規格を削除のリンク先が読めない");
    return new URL(href, this.page.url()).toString();
  }
  /**
   * 削除のリンク先を書き換えてから、画面の「商品規格を削除」→確認の「削除」で送る（開発者ツールでリンク先を書き換えて押すのと同じ）。
   * 画面のスクリプトが、なりすまし対策の値つきの削除の要求にして送る。移った先の応答の状態を返す。
   */
  async リンク先を書き換えて削除する(url: string): Promise<number> {
    await this.page.waitForLoadState("load");
    await this.削除の確定.evaluate((a, u) => a.setAttribute("href", u), url);
    await this.削除ボタン.click();
    await expect(this.削除の確定, "削除の確認").toBeVisible();
    const [res] = await Promise.all([
      this.page.waitForResponse((r) => r.url() === url && r.request().method() === "POST", { timeout: 60_000 }),
      this.削除の確定.click(),
    ]);
    await this.page.waitForLoadState("load").catch(() => undefined);
    return res.status();
  }
  /** 代表画像の選択肢（文字）と、選ばれているもの（並び順） */
  async 代表画像の選択肢(): Promise<{ 選択肢: string[]; 選ばれている: string[] }> {
    const opts = await this.代表画像.locator("option").evaluateAll((os) => os.map((o) => ({ t: (o.textContent ?? "").trim(), s: (o as HTMLOptionElement).selected, u: o.getAttribute("data-url") ?? "" })));
    const sel = this.page.locator("#admin_product_class_ProductClassImages + .select2 .select2-selection__choice");
    const chips = (await sel.allInnerTexts()).map((t) => t.replace(/^×\s*/, "").replace(/\s+/g, " ").trim()).filter(Boolean);
    return { 選択肢: opts.map((o) => o.u || o.t), 選ばれている: chips.length ? chips : opts.filter((o) => o.s).map((o) => o.u || o.t) };
  }
}

export class ClassListPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  async 開く(商品ID: string): Promise<void> {
    await this.page.goto(adminUrl(`/product/product/class/${商品ID}`));
    await this.page.waitForLoadState("load");
  }
  /** 通常の一覧（廃止規格の欄の外）に商品規格IDの行があるか */
  async 通常の一覧にあるか(商品規格ID: string): Promise<boolean> {
    return (await this.page.locator(`#ex-product_class-${商品規格ID}`).evaluateAll((els) => els.filter((e) => !e.closest("#abolishedProductClass")).length)) > 0;
  }
  /** 廃止規格の欄に商品規格IDの行があるか */
  async 廃止規格の欄にあるか(商品規格ID: string): Promise<boolean> {
    return (await this.page.locator(`#abolishedProductClass #ex-product_class-${商品規格ID}`).count()) > 0;
  }
  get 廃止規格の欄を開く(): Locator { return this.page.locator('a[href="#abolishedProductClass"]').first(); }
}
