/**
 * M03-10 買取・販売価格一括編集の続き（-x）の画面操作。セレクタはここだけに書く。正本: cases/M03-10_test_cases.tsv
 * - 商品マスター(検索結果): 商品名・コードで検索し、表示件数を変え、ページを移り、行のチェックを付けて「買取・基準価格一括編集」を押す。
 * - 買取・基準価格一括編集画面: 商品・言語ごとの行（2段）を読み、買取価格(NM)・基準価格(NM)を入れ、表示在庫切替えを選び、「登録」を押す。
 *   画面は商品ID の大きい順・言語の順に並ぶ。高額商品コードのある規格は画面に出ない。在庫数・基準価格(SP/MP/HP)は、規格が「廃止」のときだけ欄が空になる。
 * - シードで使う、商品登録編集画面の割引率の選択と保存、商品規格登録編集画面の高額商品コード・公開ステータスの変更。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { ProductSearchPage } from "./product_search";

const ENV_BANNER = "デバッグモードが有効になっています。";
const clean = (t: string | null | undefined) => (t ?? "").replace(/\s+/g, " ").trim();
async function visibleTexts(l: Locator): Promise<string[]> {
  const out: string[] = [];
  for (const e of await l.all()) if (await e.isVisible()) out.push(clean(await e.innerText()));
  return out.filter((t) => t && !t.includes(ENV_BANNER));
}
export type 画面のメッセージ = { 成功: string[]; エラー: string[] };
export async function 画面のメッセージ(page: Page): Promise<画面のメッセージ> {
  return { 成功: await visibleTexts(page.locator(".alert-success")), エラー: await visibleTexts(page.locator(".alert-danger, .invalid-feedback, .form-error-message")) };
}

// ---- 商品マスター(検索結果) ----

export class 商品マスター {
  readonly search: ProductSearchPage;
  constructor(readonly page: Page) { this.search = new ProductSearchPage(page); }

  /** 商品マスター(検索入力)を開き、商品名（またはコード）を入れて検索する */
  async 検索する(v: { 商品名?: string; コード?: string; 初期の絞り込みを外す?: boolean }): Promise<void> {
    await this.search.open();
    await this.search.ensureDetailVisible();
    if (v.商品名 !== undefined) await this.search.field("product_name").fill(v.商品名);
    if (v.コード !== undefined) await this.search.field("product_code").fill(v.コード);
    if (v.初期の絞り込みを外す) await this.初期の絞り込みを外す();
    await this.search.submitAndWaitForResult();
  }
  /**
   * 商品マスター(検索入力)は「公開状態＝公開・状態＝NM・高額商品を除外する」に印が付いた状態で開く（新アプリ。2026-11-12 の流しで、
   * NM が非公開で高額商品コードつきの商品・NM の規格が無い商品が検索結果に出ず、003・004・022 が手順1で止まった）。
   * 選ぶ商品が必ず出るよう、公開状態は公開・非公開の両方に印を付け、状態と高額商品の印は外す（正本の外の補い。手順は「検索結果で選ぶ」だけを定める）。
   */
  async 初期の絞り込みを外す(): Promise<void> {
    await this.page.evaluate(() => {
      const set = (sel: string, on: boolean) => document.querySelectorAll<HTMLInputElement>(sel).forEach((i) => {
        if (i.checked !== on) { i.checked = on; i.dispatchEvent(new Event("change", { bubbles: true })); }
      });
      set('input[name="admin_search_product[status][]"]', true);
      set('input[name="admin_search_product[card_condition][]"]', false);
      set('input[name="admin_search_product[expensive][]"]', false);
    });
  }
  /** 検索結果の表示件数の選択欄で件数を選ぶ（選ぶと1ページ目が開き直される） */
  async 表示件数を選ぶ(件数: number): Promise<void> {
    const sel = this.page.locator("#page_count_pulldown");
    await expect(sel, "表示件数の選択欄").toBeVisible();
    const opts = await sel.locator("option").evaluateAll((ns) => ns.map((n) => ({ v: (n as HTMLOptionElement).value, t: (n.textContent ?? "").trim() })));
    const pick = opts.find((o) => o.t.replace(/[^\d]/g, "") === String(件数));
    if (!pick) throw new Error(`表示件数に ${件数}件 の選択肢が無い（ある選択肢: ${opts.map((o) => o.t).join("、")}）`);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), sel.selectOption(pick.v)]);
  }
  /** ページ送りの番号のリンクでページを開く */
  async ページを開く(番号: number): Promise<void> {
    const link = this.page.locator("ul.pagination a.page-link").filter({ hasText: new RegExp(`^\\s*${番号}\\s*$`) });
    await expect(link, `ページ送りの ${番号} のリンク`).toHaveCount(1);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), link.click()]);
  }
  /** いま開いているページの番号（ページ送りの現在のページ） */
  async 今のページ(): Promise<string> {
    const t = clean(await this.page.locator("ul.pagination li.page-item.active").first().innerText().catch(() => ""));
    return /\d+/.exec(t)?.[0] ?? "";
  }
  /** 検索結果の行の商品ID（上から） */
  async 行の商品ID(): Promise<string[]> {
    return (await this.page.locator('tr[id^="ex-product-"]').evaluateAll((ns) => ns.map((n) => n.id.replace("ex-product-", ""))));
  }
  /** 検索結果の商品名の欄（検索条件の保持の確かめに使う） */
  async 商品名の条件(): Promise<string> {
    return this.search.field("product_name").inputValue();
  }
  /** 行のチェックを付ける */
  async 選ぶ(商品ID: string): Promise<void> {
    const box = this.page.locator(`#check_${商品ID}`);
    await expect(box, `商品ID ${商品ID} の行のチェック`).toHaveCount(1);
    await box.check();
    await expect(box, `商品ID ${商品ID} の行のチェックが付いた`).toBeChecked();
  }
  get 一括編集ボタン(): Locator {
    return this.page.locator("#form_bulk button[type=submit]").filter({ hasText: /^\s*買取・基準価格一括編集\s*$/ });
  }
  /** 「買取・基準価格一括編集」を押し、移った先まで待つ */
  async 一括編集を押す(): Promise<void> {
    await expect(this.一括編集ボタン, "「買取・基準価格一括編集」ボタン").toHaveCount(1);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), this.一括編集ボタン.click()]);
  }
}

// ---- 買取・基準価格一括編集画面 ----

export type 状態 = "NM" | "SP" | "MP" | "HP";
export const 状態の並び: 状態[] = ["NM", "SP", "MP", "HP"];
/** 欄の表示（入力欄があればその値と読み取り専用か。入力欄が無ければ欄の文字） */
export type 欄 = { 入力欄: boolean; 値: string; 読み取り専用: boolean; 文字: string };
export type 一括の行 = {
  商品ID: string; 商品名: string; 言語: string;
  買取価格NM: 欄; 価格比率: 欄;
  /** 在庫数の欄（NM・SP・MP・HP の順）。文字が空なら表示されていない */
  在庫数: 欄[];
  /** 基準価格の欄（NM・SP・MP・HP の順） */
  基準価格: 欄[];
};

export class 一括編集画面 {
  constructor(readonly page: Page) {}
  get form(): Locator { return this.page.locator("form#product-class-form"); }
  async 開いているか(): Promise<boolean> {
    return /\/product\/(edit_bulk_update_buy_price|bulk_update_buy_price)$/.test(new URL(this.page.url()).pathname) && (await this.form.count()) === 1;
  }
  get 見出し(): Locator { return this.page.locator(".c-primaryCol__header p.text-muted"); }
  /** 表の商品・言語ごとの2段の行 */
  private async 段(): Promise<Locator[]> {
    const trs = await this.form.locator("table tbody > tr").all();
    if (trs.length % 2 !== 0) throw new Error(`一括編集画面の表の行が2段ずつでない（${trs.length} 行）`);
    return trs;
  }
  private static async 欄を読む(cell: Locator): Promise<欄> {
    const input = cell.locator("input:not([type=hidden])").first();
    if (await input.count()) {
      return {
        入力欄: await input.isVisible(), 値: await input.inputValue(),
        読み取り専用: (await input.getAttribute("readonly")) !== null || (await input.isDisabled()), 文字: "",
      };
    }
    return { 入力欄: false, 値: "", 読み取り専用: false, 文字: clean(await cell.innerText()) };
  }
  /** 表の行を上から読む */
  async 行(): Promise<一括の行[]> {
    const trs = await this.段();
    const out: 一括の行[] = [];
    for (let i = 0; i < trs.length; i += 2) {
      const a = trs[i], b = trs[i + 1];
      const ac = a.locator(":scope > td"), bc = b.locator(":scope > td");
      const 商品ID = await ac.nth(0).locator('input[type=hidden][id$="_product_id"]').inputValue().catch(async () => clean(await ac.nth(0).innerText()));
      const 在庫数: 欄[] = [];
      for (let k = 0; k < 4; k++) 在庫数.push(await 一括編集画面.欄を読む(ac.nth(4 + k)));
      const 基準価格: 欄[] = [];
      for (let k = 0; k < 4; k++) 基準価格.push(await 一括編集画面.欄を読む(bc.nth(k)));
      out.push({
        商品ID, 商品名: clean(await ac.nth(1).innerText()), 言語: clean(await ac.nth(2).innerText()),
        買取価格NM: await 一括編集画面.欄を読む(ac.nth(3)), 価格比率: await 一括編集画面.欄を読む(ac.nth(8)), 在庫数, 基準価格,
      });
    }
    return out;
  }
  /** 商品ID・言語の行の段（2段の上と下） */
  private async 行の段(商品ID: string, 言語: string): Promise<[Locator, Locator]> {
    const trs = await this.段();
    const hits: [Locator, Locator][] = [];
    for (let i = 0; i < trs.length; i += 2) {
      const ac = trs[i].locator(":scope > td");
      const id = await ac.nth(0).locator('input[type=hidden][id$="_product_id"]').inputValue().catch(() => "");
      if (id === 商品ID && clean(await ac.nth(2).innerText()) === 言語) hits.push([trs[i], trs[i + 1]]);
    }
    if (hits.length !== 1) throw new Error(`一括編集画面に、商品ID ${商品ID}・言語「${言語}」の行が ${hits.length} 件（1件のはず）`);
    return hits[0];
  }
  /** 商品ID・言語の行の、買取価格(NM)・基準価格(NM)に値を入れる */
  async 入れる(商品ID: string, 言語: string, v: { 買取価格NM: number; 基準価格NM: number }): Promise<void> {
    const [a, b] = await this.行の段(商品ID, 言語);
    const buy = a.locator("input.js-buy-price");
    const base = b.locator("input.js-base-price-nm");
    await expect(buy, `商品ID ${商品ID}・${言語} の買取価格(NM)の入力欄`).toHaveCount(1);
    await expect(base, `商品ID ${商品ID}・${言語} の基準価格(NM)の入力欄`).toHaveCount(1);
    await buy.fill(String(v.買取価格NM));
    await base.fill(String(v.基準価格NM));
    // 基準価格(NM)の入力で、画面のスクリプトが SP・MP・HP の基準価格を割引率から計算し直す
    await base.dispatchEvent("change");
    await expect(buy, `商品ID ${商品ID}・${言語} の買取価格(NM)`).toHaveValue(String(v.買取価格NM));
    await expect(base, `商品ID ${商品ID}・${言語} の基準価格(NM)`).toHaveValue(String(v.基準価格NM));
  }
  /** 表示在庫切替えの選択欄 */
  get 表示在庫切替え(): Locator { return this.page.locator("select.js-stock-switch"); }
  async 表示在庫を選ぶ(名前: "TC東京(通販＋TC東京スマレジ)" | "支店" | "バックヤード"): Promise<void> {
    await chooseByLabel(this.表示在庫切替え, 名前);
    await expect(this.表示在庫切替え.locator("option:checked"), "表示在庫切替えで選んだ値").toHaveText(new RegExp(`^\\s*${名前.replace(/[()（）]/g, ".")}\\s*$`));
  }
  get 登録ボタン(): Locator { return this.form.locator("button[type=submit]").filter({ hasText: /^\s*登録\s*$/ }); }
  /** 「登録」を押し、移った先まで待つ。移った先のパスを返す */
  async 登録を押す(): Promise<string> {
    await expect(this.登録ボタン, "「登録」ボタン").toHaveCount(1);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), this.登録ボタン.click()]);
    return new URL(this.page.url()).pathname;
  }
  /** 画面左下の商品一覧へ戻るリンク（正本「商品検索に戻るリンク」） */
  get 戻るリンク(): Locator { return this.page.locator(".c-conversionArea a.c-baseLink").filter({ hasText: "商品一覧" }); }
  async 戻るを押す(): Promise<void> {
    await expect(this.戻るリンク, "商品一覧へ戻るリンク").toHaveCount(1);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.戻るリンク.click()]);
  }
}

/** 商品マスター(検索結果)の画面か（パスが商品マスターの一覧で、検索結果の件数の表示がある） */
export async function 商品マスターの結果の画面か(page: Page): Promise<boolean> {
  const p = new URL(page.url()).pathname;
  return /\/product(\/page\/\d+)?\/?$/.test(p) && (await page.locator("form#search_form").count()) === 1;
}

// ---- シードで使う画面操作 ----

/**
 * 商品登録編集画面（開いた状態）で割引率を選び（名前を渡さなければ選択肢の先頭）、買取減額率は未選択のまま「商品を登録」を押す。
 * 選んだ割引率の名前を返す。
 */
export async function 割引率を選んで登録する(page: Page, 割引率: string | null, what: string, onIssue: (m: string) => void): Promise<string> {
  const form = page.locator("form#form1");
  await expect(form, `${what}: 商品登録編集画面`).toBeVisible();
  const discount = form.locator('select[name="admin_product[Discount]"]');
  await expect(discount, `${what}: 割引率の欄`).toHaveCount(1);
  const opts = await discount.locator("option").evaluateAll((ns) => ns.map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).filter((o) => o.value !== ""));
  // 選択肢の表示は「4 【NM】1【SP】0.9【MP】0.8【HP】0.7」のように名前のあとに率が続く（開発環境 2026-11-12）。名前（先頭の語）で探す
  const pick = 割引率 === null ? opts[0] : (opts.find((o) => o.label === 割引率) ?? opts.find((o) => o.label.split(/[\s【]/)[0] === 割引率));
  if (!pick) throw new Error(`${what}: 割引率に「${割引率 ?? "選択肢"}」が無い（ある選択肢: ${opts.map((o) => o.label).join("、")}）`);
  await discount.selectOption(pick.value);
  const buyDiscount = form.locator('select[name="admin_product[BuyDiscount]"]');
  if (await buyDiscount.count()) {
    const v = await buyDiscount.inputValue();
    if (v) throw new Error(`${what}: 買取減額率が選ばれている（正本は未選択）`);
  }
  const save = form.locator('button[type="submit"]').filter({ hasText: /^\s*商品を登録\s*$/ });
  await expect(save, `${what}: 「商品を登録」ボタン`).toHaveCount(1);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), save.click()]);
  for (const w of await expectSaved(page, `${what}: 商品を登録`)) onIssue(`${what}: 警告「${w}」`);
  return pick.label;
}

/**
 * 商品規格登録編集画面（開いた状態）で、高額商品コード・公開ステータスを変え、部門が未選択なら選択肢の先頭を選び、
 * スマレジ連携フラグが「連携しない」であることを確かめて「商品規格を登録」を押す（取込でできた NM の規格の直し）。
 */
export async function 規格の高額コードと公開を直す(page: Page, v: { 高額商品コード: string | null; 公開ステータス: "公開" | "非公開" | "廃止" }, what: string, onIssue: (m: string) => void): Promise<void> {
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集画面`).toBeVisible();
  if (v.高額商品コード !== null) await form.locator("#admin_product_class_high_price_code").fill(v.高額商品コード);
  const section = form.locator("#admin_product_class_Section");
  if (!(await section.inputValue())) {
    const first = await section.locator("option").evaluateAll((ns) => ns.map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).find((o) => o.value !== ""));
    if (!first) throw new Error(`${what}: 部門に選べる値が無い`);
    await section.selectOption(first.value);
    onIssue(`${what}: 部門は選択肢の先頭の「${first.label}」を選んだ（正本: 選択肢の先頭）`);
  }
  await chooseByLabel(form.locator("#admin_product_class_Status"), v.公開ステータス);
  const smaregi = form.locator('input[name="admin_product_class[smaregi_alignment_flg]"]:checked');
  await expect(smaregi, `${what}: スマレジ連携フラグが選ばれている`).toHaveCount(1);
  expect(await smaregi.getAttribute("value"), `${what}: スマレジ連携フラグが「連携しない」`).toBe("0");
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.getByRole("button", { name: "商品規格を登録", exact: true }).click()]);
  for (const w of await expectSaved(page, `${what}: 商品規格の登録`)) onIssue(`${what}: 警告「${w}」`);
  if (v.高額商品コード !== null) await expect(form.locator("#admin_product_class_high_price_code"), `${what}: 登録後の高額商品コード`).toHaveValue(v.高額商品コード);
  await expect(form.locator("#admin_product_class_Status option:checked"), `${what}: 登録後の公開ステータス`).toHaveText(new RegExp(`^\\s*${v.公開ステータス}\\s*$`));
}

/** 商品登録編集画面を商品IDで開く */
export async function 商品登録編集画面を開く(page: Page, 商品ID: string): Promise<void> {
  const res = await page.goto(adminUrl(`/product/product/${商品ID}/edit`), { timeout: 60_000 });
  expect(res?.status(), `商品ID ${商品ID} の商品登録編集画面の応答`).toBe(200);
  await page.waitForLoadState("load");
  await expect(page.locator("form#form1"), `商品ID ${商品ID} の商品登録編集画面`).toBeVisible();
}
