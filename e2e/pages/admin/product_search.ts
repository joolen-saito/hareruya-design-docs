/** M03-01 商品マスター（検索入力）の画面操作。 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

const PREFIX = "admin_search_product";

/** 設計 0204「商品マスター(検索入力)」の識別ID 1、3〜30 の入力欄。 */
export const SEARCH_TEXT_FIELDS = [
  "product_name", "card_name", "product_id", "product_code",
  "sell_price_from", "sell_price_to", "stock_from", "stock_to",
  "order_quantity_from", "order_quantity_to", "update_date_from", "update_date_to",
] as const;
export const SEARCH_SELECT_FIELDS = [
  "category_id", "cardset", "tag_id", "storage_code_id",
  "tag_sales_analysis", "section", "shelf_number",
] as const;
export const SEARCH_CHOICE_FIELDS = [
  "status", "rarity", "language", "card_condition", "foil",
  "frame", "promotion", "order_date", "expensive",
] as const;

/** 入力欄の項目名（設計 0204「商品マスター(検索入力)」の画面項目定義の名称）。確かめの名前・結果に使う */
const SEARCH_FIELD_LABEL: Record<string, string> = {
  product_name: "商品名(日/英)", card_name: "カード名", product_id: "ID", product_code: "コード",
  sell_price_from: "販売価格(From)", sell_price_to: "販売価格(To)", stock_from: "在庫(From)", stock_to: "在庫(To)",
  order_quantity_from: "期間別販売数 販売数(From)", order_quantity_to: "期間別販売数 販売数(To)",
  update_date_from: "規格更新日(From)", update_date_to: "規格更新日(To)",
  category_id: "カテゴリ", cardset: "エキスパンション", tag_id: "タグ", storage_code_id: "略称タグ",
  tag_sales_analysis: "売上分析タグ", section: "部門", shelf_number: "棚番号",
  status: "公開状態", rarity: "レアリティ", language: "言語", card_condition: "状態", foil: "Foil",
  frame: "フレーム", promotion: "プロモ", order_date: "期間別販売数 販売期間", expensive: "高額商品（のみ表示・除外する）",
};
export const searchFieldLabel = (name: string): string => SEARCH_FIELD_LABEL[name] ?? name;

export type SearchSnapshot = Record<string, string | string[]>;
export type ChoiceObservation = {
  value: string;
  label: string;
  checked: boolean;
  visible: boolean;
  enabled: boolean;
};

export class ProductSearchPage {
  readonly form: Locator;
  readonly detail: Locator;
  readonly detailToggle: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#search_form");
    this.detail = page.locator("#searchDetail");
    this.detailToggle = page.locator('.admin-product-search-detail-toggle[data-bs-target="#searchDetail"]');
  }

  async open(): Promise<void> {
    await this.page.goto(adminUrl("/product"));
    await expect(this.form).toBeVisible();
  }

  field(name: string): Locator {
    return this.form.locator(`#${PREFIX}_${name}`);
  }

  choiceInputs(name: string): Locator {
    return this.form.locator(`input[name^="${PREFIX}[${name}]"]`);
  }

  choice(name: string, value: string): Locator {
    return this.form.locator(`input[name^="${PREFIX}[${name}]"][value="${value}"]`);
  }

  /** 値・可視ラベル・操作可能性を一緒に観測する。値のないプレースホルダーは除く。 */
  async choiceOptions(name: string): Promise<ChoiceObservation[]> {
    const observations: ChoiceObservation[] = [];
    for (const input of await this.choiceInputs(name).all()) {
      const value = await input.inputValue();
      if (!value) continue;
      observations.push({
        value,
        label: await input.evaluate((node) => (node as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? ""),
        checked: await input.isChecked(),
        visible: await input.isVisible(),
        enabled: await input.isEnabled(),
      });
    }
    return observations;
  }

  async checkedChoices(name: string): Promise<Pick<ChoiceObservation, "value" | "label">[]> {
    return (await this.choiceOptions(name))
      .filter((option) => option.checked)
      .map(({ value, label }) => ({ value, label }));
  }

  async checkedValues(name: string): Promise<string[]> {
    return this.choiceInputs(name).evaluateAll((nodes) => nodes
      .map((node) => node as HTMLInputElement)
      .filter((node) => node.checked && node.value !== "")
      .map((node) => node.value)
      .sort());
  }

  async setChecked(name: string, value: string, checked: boolean): Promise<void> {
    const input = this.choice(name, value);
    if (checked) await input.check();
    else await input.uncheck();
  }

  async selectedValues(name: string): Promise<string[]> {
    return this.field(name).evaluate((node) => Array.from((node as HTMLSelectElement).selectedOptions)
      .map((option) => option.value)
      .filter(Boolean)
      .sort());
  }

  /** Select2 の可視候補を画面で検索する。カテゴリ名の階層インデントは両端だけ除く。 */
  private async openSelect2(name: string, term: string): Promise<Locator> {
    await this.page.locator(`#${PREFIX}_${name} + span.select2 .select2-selection`).click();
    const search = this.page.locator(".select2-container--open .select2-search__field");
    await search.fill(term);
    const options = this.page.locator(".select2-container--open .select2-results__option[aria-selected]");
    await expect(options.first()).toBeVisible();
    return options;
  }

  async select2Candidates(name: string, term: string): Promise<string[]> {
    const options = await this.openSelect2(name, term);
    const labels = (await options.allInnerTexts()).map((label) => label.trim());
    await this.page.keyboard.press("Escape");
    return labels;
  }

  async chooseSelect2(name: string, label: string): Promise<void> {
    const options = await this.openSelect2(name, label);
    await expect(options.filter({ hasText: label })).toHaveCount(1);
    const labels = (await options.allInnerTexts()).map((value) => value.trim());
    const index = labels.indexOf(label);
    if (index < 0) throw new Error(`${name} の候補「${label}」が見つからない: ${labels.join("、")}`);
    await options.nth(index).click();
    await this.page.keyboard.press("Escape");
  }

  /**
   * 「検索する >」を押し、結果画面が読み込まれるまで待つ。結果画面には、該当件数か該当なしのどちらかが必ず出る。
   * 押した直後の行数は押す前の画面のものなので、件数で判断する処理（清掃など）はこれを使う。
   */
  async submitAndWaitForResult(): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      this.form.locator(".admin-product-search-submit").click(),
    ]);
    const outcome = this.page.getByText(/^(検索結果：\d+件が該当しました|検索条件に合致するデータが見つかりませんでした)$/);
    await expect(outcome.first(), "検索結果の画面（該当件数か、該当なしの表示）").toBeVisible();
  }

  async detailState(): Promise<{ visible: boolean; expanded: string | null }> {
    return { visible: await this.detail.isVisible(), expanded: await this.detailToggle.getAttribute("aria-expanded") };
  }

  async ensureDetailVisible(): Promise<void> {
    if (!(await this.detail.isVisible())) await this.detailToggle.click();
    await expect(this.detail).toBeVisible();
  }

  async toggleDetail(): Promise<void> {
    const visible = await this.detail.isVisible();
    await this.detailToggle.click();
    if (visible) await expect(this.detail).toBeHidden();
    else await expect(this.detail).toBeVisible();
  }

  async clear(): Promise<void> {
    await this.page.locator("#search_box_main__clear .search-clear").click();
  }

  /** 新規セッションの検索入力画面で、以前の検索指定が画面に復元されていないことを確認。 */
  async expectNoRetainedSearchConditions(): Promise<void> {
    const state = await this.snapshot();
    for (const name of SEARCH_TEXT_FIELDS) expect(state[name], `${searchFieldLabel(name)} に以前の入力がない`).toBe("");
    for (const name of SEARCH_SELECT_FIELDS) expect(state[name], `${searchFieldLabel(name)} に以前の選択がない`).toEqual([]);
    for (const name of SEARCH_CHOICE_FIELDS) {
      // 既定チェックの有無そのものは各ケースの期待値で確認する。
      const defaultValues = name === "status" || name === "card_condition" ? ["1"] : name === "expensive" ? ["2"] : [];
      const selected = state[name] as string[];
      expect(selected.every((value) => defaultValues.includes(value)), `${searchFieldLabel(name)} に以前の選択がない`).toBe(true);
    }
    await expect(this.page.locator("#form_bulk"), "以前の検索結果一覧が表示されない").toHaveCount(0);
  }

  /** 初期画面でページ番号・表示件数が結果画面から引き継がれていないことを確認。 */
  async expectNoRetainedPageState(): Promise<void> {
    await expect(this.page, "初期画面の URL にページ番号・表示件数指定がない").toHaveURL(adminUrl("/product"));
    await expect(this.page.locator("#page_count_pulldown"), "以前の表示件数欄が表示されない").toHaveCount(0);
  }

  /** 識別ID 3〜31 の入力・選択・クリア操作が開閉領域内にあることを確認。 */
  async missingDetailControls(): Promise<string[]> {
    const missing: string[] = [];
    for (const name of SEARCH_TEXT_FIELDS.filter((field) => field !== "product_name")) {
      if (await this.detail.locator(`#${PREFIX}_${name}`).count() !== 1) missing.push(searchFieldLabel(name));
    }
    for (const name of SEARCH_SELECT_FIELDS) {
      if (await this.detail.locator(`#${PREFIX}_${name}`).count() !== 1) missing.push(searchFieldLabel(name));
    }
    for (const name of SEARCH_CHOICE_FIELDS) {
      if (await this.detail.locator(`input[name^="${PREFIX}[${name}]"]`).count() === 0) missing.push(searchFieldLabel(name));
    }
    // 高額商品は No.27「のみ表示」と No.28「除外する」の2つのチェック欄。
    for (const value of ["1", "2"]) {
      if (await this.detail.locator(`input[name^="${PREFIX}[expensive]"][value="${value}"]`).count() !== 1)
        missing.push(value === "1" ? "高額商品のみ表示" : "高額商品を除外する");
    }
    if (await this.detail.locator("#search_box_main__clear .search-clear").count() !== 1) missing.push("検索条件をクリア");
    return missing;
  }

  /** No.1、3〜30を網羅。No.2は開閉ボタンなので入力値はない。 */
  async snapshot(): Promise<SearchSnapshot> {
    const state: SearchSnapshot = {};
    for (const name of SEARCH_TEXT_FIELDS) state[name] = await this.field(name).inputValue();
    for (const name of SEARCH_SELECT_FIELDS) state[name] = await this.selectedValues(name);
    for (const name of SEARCH_CHOICE_FIELDS) state[name] = await this.checkedValues(name);
    return state;
  }
}
