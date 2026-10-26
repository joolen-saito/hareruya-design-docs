/**
 * M03-02 商品登録編集のケースで使う画面操作。
 * - 商品マスター(検索入力)で、公開状態のすべての選択肢にチェックを入れて商品ID・商品コードで検索する（シード NOTFOUND-003・READ-DISCONTINUED）
 * - 商品登録編集（商品詳細/編集）画面で、割引率と商品公開ステータスを選んで「商品を登録」する（READ-DISCONTINUED）
 * - 見つからない（HTTP404）画面の表示を読む（003・031）
 */
import { expect, Locator, Page, Response } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { GoodsCsvTemplate } from "./m03_01_goods_csv";
import { openProductEdit } from "./product_edit";
import { ProductSearchPage } from "./product_search";

/** 商品マスター(検索結果)の行（商品ID・商品名・商品コード） */
export type ListedProduct = { 商品ID: string; 商品名: string; 商品コード: string };

/**
 * 商品マスター(検索入力)で、公開状態のすべての選択肢にチェックを入れ、検索欄 field（商品ID か 商品コード）に value を入れて
 * 「検索する >」を押し、結果の行を読む。正本の作り方は公開状態だけを指定するので、ほかの既定の絞り込みは変えない。
 */
export async function searchWithAllStatuses(page: Page, field: "product_id" | "product_code", value: string): Promise<ListedProduct[]> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.ensureDetailVisible();
  const options = await search.choiceOptions("status");
  // 検索欄の公開状態の選択肢は「公開」「非公開」の2つ（アプリは「廃止」を選択肢に出さない。SearchProductType）
  expect(options.map((o) => o.label), "公開状態の選択肢").toEqual(["公開", "非公開"]);
  for (const option of options) await search.setChecked("status", option.value, true);
  expect((await search.checkedChoices("status")).length, "公開状態のすべての選択肢にチェックが入っている").toBe(options.length);
  await search.field(field).fill(value);
  await search.submitAndWaitForResult();
  return listedProducts(page);
}

/**
 * 商品マスター(検索入力)で、公開状態・状態・高額商品の絞り込みをすべて外して商品コードで検索する。
 * シードの「あれば使う」の確かめ用（正本の作り方の外。廃止済みの商品は公開状態の選択肢に無いので、絞り込みを外して探す）
 */
export async function searchByCodeWithoutFilters(page: Page, code: string): Promise<ListedProduct[]> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.ensureDetailVisible();
  for (const field of ["status", "card_condition", "expensive"]) {
    for (const option of await search.choiceOptions(field)) if (option.checked) await search.setChecked(field, option.value, false);
    await expect.poll(() => search.checkedValues(field), `${field} の絞り込みを外す`).toEqual([]);
  }
  await search.field("product_code").fill(code);
  await search.submitAndWaitForResult();
  return listedProducts(page);
}

/** 商品マスター(検索結果)の行を読む（結果画面の読み込み後に呼ぶ） */
export async function listedProducts(page: Page): Promise<ListedProduct[]> {
  const out: ListedProduct[] = [];
  for (const row of await page.locator('tr[id^="ex-product-"]').all()) {
    out.push({
      商品ID: (await row.locator("td:nth-child(2)").innerText()).trim(),
      商品名: (await row.locator("td:nth-child(3) a").innerText()).trim(),
      商品コード: (await row.locator("td:nth-child(4)").innerText()).trim(),
    });
  }
  return out;
}

/** グッズ商品CSVの雛形の項目説明（「1:公開 2:非公開」の形）から、表示名 label に当たる値を読む */
export function statusValue(template: GoodsCsvTemplate, columnName: string, label: string): string {
  const description = template.columns.find((column) => column.label === columnName)?.description;
  if (!description) throw new Error(`${columnName} の説明が雛形の項目説明に無い`);
  const entries = [...description.matchAll(/(\d+)\s*[:：]\s*([^\d:：、,，\s]+)/g)].map((m) => ({ value: m[1], label: m[2].trim() }));
  const hit = entries.filter((e) => e.label === label);
  if (hit.length !== 1) throw new Error(`${columnName} の「${label}」の値を雛形の項目説明から一意に読めない: ${description}`);
  return hit[0].value;
}

/** 商品登録編集画面の入力欄 */
export class ProductEditForm {
  readonly form: Locator;
  readonly 商品名: Locator;
  readonly 商品公開ステータス: Locator;
  readonly 割引率: Locator;
  readonly 商品を登録: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#form1");
    this.商品名 = this.form.locator('[name="admin_product[name]"]');
    this.商品公開ステータス = this.form.locator('[name="admin_product[Status]"]');
    this.割引率 = this.form.locator('select[name="admin_product[Discount]"]');
    this.商品を登録 = this.form.locator('button[type="submit"]').filter({ hasText: /^\s*商品を登録\s*$/ });
  }

  async open(商品ID: string): Promise<void> {
    await openProductEdit(this.page, 商品ID);
  }

  /** 割引率の選択肢（未選択の行を除く）の表示名 */
  async 割引率の選択肢(): Promise<string[]> {
    return (await this.割引率.locator("option").evaluateAll((nodes) => nodes
      .filter((n) => (n as HTMLOptionElement).value !== "")
      .map((n) => (n.textContent ?? "").trim())));
  }

  /** 販売制限（地域別販売制限）で選ばれている選択肢の表示名（無ければ空） */
  async 販売制限の選択(): Promise<string> {
    const checked = this.form.locator('input[type="radio"][name="admin_product[RegionRestriction]"]:checked');
    if (await checked.count() === 0) return "";
    return checked.evaluate((n) => ((n as HTMLInputElement).labels?.item(0)?.textContent ?? "").trim());
  }

  async 販売制限を選ぶ(label: string): Promise<void> {
    const radio = this.form.locator('input[type="radio"][name="admin_product[RegionRestriction]"]');
    const labels = await radio.evaluateAll((ns) => ns.map((n) => ((n as HTMLInputElement).labels?.item(0)?.textContent ?? "").trim()));
    const i = labels.indexOf(label);
    if (i < 0) throw new Error(`販売制限に「${label}」が無い（${labels.join("、")}）`);
    await radio.nth(i).check();
  }

  /** 商品公開ステータスで label を選ぶ（選択欄・ラジオのどちらの作りでも） */
  async 商品公開ステータスを選ぶ(label: string): Promise<void> {
    await expect(this.商品公開ステータス.first(), "商品公開ステータスの欄").toBeVisible();
    const tag = await this.商品公開ステータス.first().evaluate((e) => e.tagName.toLowerCase());
    if (tag === "select") {
      await chooseByLabel(this.商品公開ステータス.first(), label);
      return;
    }
    await this.form.getByLabel(label, { exact: true }).check();
  }

  /** 「商品を登録」を押し、成功の表示を確かめる。警告の文を返す */
  async 登録(what: string): Promise<string[]> {
    await expect(this.商品を登録, `${what}: 「商品を登録」ボタン`).toBeVisible();
    await Promise.all([this.page.waitForEvent("load"), this.商品を登録.click()]);
    return expectSaved(this.page, what);
  }
}

/** 見つからない（HTTP404）画面の見出しと文 */
export type ErrorScreen = { status: number; 見出し: string; 文: string; タイトル: string };

/** アドレスを開き、応答の状態と、管理画面のエラー画面の見出し・文を読む */
export async function openAndReadErrorScreen(page: Page, path: string): Promise<ErrorScreen> {
  const res: Response | null = await page.goto(adminUrl(path));
  await page.waitForLoadState("load");
  const errorPage = page.locator("body#error-page");
  const 見出し = await errorPage.count() ? ((await errorPage.locator("h3").first().innerText()) ?? "").trim() : "";
  const 文 = await errorPage.count() ? ((await errorPage.locator("h3 + p").first().innerText()) ?? "").trim() : "";
  return { status: res?.status() ?? 0, 見出し, 文, タイトル: (await page.title()).trim() };
}
