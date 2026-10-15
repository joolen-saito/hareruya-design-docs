/** M03-01 の表示件数マスタ設定と、不正な件数を選ぶ画面操作。 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

type MasterRow = { element: Locator; id: string; name: string };
export type PageCountOption = {
  label: string;
  pathname: string;
  query: string;
  enabled: boolean;
  displayed: boolean;
  selected: boolean;
};

export class PageCountConfigPage {
  constructor(readonly page: Page) {}

  private async open(): Promise<void> {
    await this.page.goto(adminUrl("/setting/system/masterdata"));
    const master = this.page.locator("#admin_system_masterdata_masterdata");
    await expect(master.locator("option", { hasText: "mtb_page_max" }), "表示件数マスタが管理画面にある").toHaveCount(1);
    await master.selectOption({ label: "mtb_page_max" });
    await this.page.locator("form#form1 button[type=submit]").click();
    await expect(this.page.locator("form#form2")).toBeVisible();
  }

  private async rows(): Promise<MasterRow[]> {
    const result: MasterRow[] = [];
    for (const element of await this.page.locator("form#form2 tbody tr").all()) {
      result.push({
        element,
        id: await element.locator('input[name$="[id]"]').inputValue(),
        name: await element.locator('input[name$="[name]"]').inputValue(),
      });
    }
    return result;
  }

  private async save(what: string, issue: (message: string) => void): Promise<void> {
    await this.page.locator("form#form2 button[type=submit]").click();
    for (const warning of await expectSaved(this.page, what)) issue(warning);
  }

  private async ensureConfiguredOptions(values: readonly string[], exact: boolean, issue: (message: string) => void): Promise<void> {
    if (exact) {
      await this.open();
      const names = (await this.rows()).map((row) => row.name).filter(Boolean);
      const extra = names.filter((name) => name !== "777" && !values.includes(name));
      if (extra.length > 0) throw new Error(`表示件数マスタに正本の選択肢以外がある: ${extra.join("、")}`);
    }
    for (const value of values) {
      await this.open();
      const rows = await this.rows();
      const byName = rows.filter((row) => row.name === value);
      if (byName.length > 1) throw new Error(`表示件数 ${value} のマスタ行が重複している`);
      if (byName.length === 1) continue;
      if (rows.some((row) => row.id === value)) throw new Error(`表示件数 ${value} のIDが別の値に使用されている`);
      const blank = rows.filter((row) => row.id === "" && row.name === "");
      if (blank.length !== 1) throw new Error(`表示件数 ${value} を追加するための空欄が ${blank.length} 件`);
      await blank[0].element.locator('input[name$="[id]"]').fill(value);
      await blank[0].element.locator('input[name$="[name]"]').fill(value);
      await this.save(`表示件数 ${value} の登録`, issue);
    }

    await this.open();
    const obsolete = (await this.rows()).filter((row) => row.name === "777");
    if (obsolete.length > 0) {
      for (const row of obsolete) {
        await row.element.locator('input[name$="[id]"]').fill("");
        await row.element.locator('input[name$="[name]"]').fill("");
      }
      await this.save("表示件数 777 の削除", issue);
    }

    await this.open();
    const names = (await this.rows()).map((row) => row.name).filter(Boolean);
    for (const value of values) {
      expect(names.filter((name) => name === value), `表示件数 ${value} が選択できる`).toHaveLength(1);
    }
    expect(names, "表示件数 777 は未登録").not.toContain("777");
    if (exact) expect([...names].sort(), "表示件数マスタに正本指定以外の値がない").toEqual([...values].sort());
  }

  /** 043 の3値を有効にし、777の登録だけを削除する。他の既存値には触れない。 */
  async ensureOptions(issue: (message: string) => void): Promise<void> {
    await this.ensureConfiguredOptions(["10", "50", "12000"], false, issue);
  }

  /** 056 の9値を有効にする。777以外の余剰値は正本に削除指示がないため失敗させる。 */
  async ensureExactOptions(values: readonly string[], issue: (message: string) => void): Promise<void> {
    await this.ensureConfiguredOptions(values, true, issue);
  }

  /** 設定ファイル由来の既定値は画面で変更できないため、新規セッションの選択状態で10を確認する。 */
  async expectDefaultTen(): Promise<void> {
    await this.page.goto(adminUrl("/setting/system/login_history"));
    const select = this.page.locator("#page_count_pulldown");
    await expect(select, "新規セッションのログイン履歴一覧に件数選択欄がある").toHaveCount(1);
    const options = await select.locator("option").evaluateAll((nodes) => nodes.map((node) => ({
      label: node.textContent?.trim() ?? "",
      value: (node as HTMLOptionElement).value,
      selected: (node as HTMLOptionElement).selected,
    })));
    const pageCounts = options.map((option) => new URL(option.value, this.page.url()).searchParams.get("page_count"));
    for (const value of ["10", "50", "12000"]) expect(pageCounts, `${value}件が選択可能`).toContain(value);
    expect(pageCounts, "777件は選択不可").not.toContain("777");
    const selected = options.filter((option) => option.selected);
    expect(selected, "新規セッションの既定件数は10件").toHaveLength(1);
    expect(new URL(selected[0].value, this.page.url()).searchParams.get("page_count")).toBe("10");
    expect(selected[0].label).toBe("10件");
  }
}

export class ProductPageCountPage {
  constructor(readonly page: Page) {}

  /** 商品検索結果で件数セレクトを開き、表示名・URL値・選択可否を観測する。 */
  async openAndReadOptions(): Promise<PageCountOption[]> {
    const select = this.page.locator("#page_count_pulldown");
    await expect(select, "商品マスター(検索結果)に件数セレクトがある").toBeVisible();
    await expect(select, "件数セレクトを操作できる").toBeEnabled();
    await select.click();
    return select.locator("option").evaluateAll((nodes) => nodes.map((node) => {
      const option = node as HTMLOptionElement;
      const url = new URL(option.value, window.location.href);
      return {
        label: option.textContent?.trim() ?? "",
        pathname: url.pathname,
        query: url.searchParams.toString(),
        enabled: !option.disabled,
        displayed: !option.hidden && window.getComputedStyle(option).display !== "none",
        selected: option.selected,
      };
    }));
  }

  /** 商品検索入力画面に欄がなければ、step 2 自体を手順不可として明示不合格にする。 */
  async selectInjectedCount777(): Promise<void> {
    const select = this.page.locator("#page_count_pulldown");
    await expect(select, "IT-M03-01-043 手順2不可: 商品マスター(検索入力)画面に件数セレクトボックスがない").toHaveCount(1);
    await select.evaluate((node) => {
      const field = node as HTMLSelectElement;
      if (!field.options.length) throw new Error("件数セレクトボックスに基準となるURL選択肢がない");
      const url = new URL(field.options[0].value, window.location.href);
      if (!url.searchParams.has("page_count")) throw new Error("件数選択肢のURLに page_count がない");
      url.searchParams.set("page_count", "777");
      const option = new Option("777件", `${url.pathname}${url.search}${url.hash}`);
      field.add(option);
      field.value = option.value;
      field.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await expect(this.page).toHaveURL(/[?&]page_count=777(?:&|$)/);
  }

  async selectedCountAfterInvalidSelection(): Promise<{ label: string; pageCount: string | null }> {
    const select = this.page.locator("#page_count_pulldown");
    await expect(select, "不正な777件を選んだ後、表示件数欄がある").toHaveCount(1);
    const selected = select.locator("option:checked");
    await expect(selected, "選択中の表示件数は1件だけ").toHaveCount(1);
    const label = (await selected.innerText()).trim();
    const value = await selected.getAttribute("value");
    return { label, pageCount: new URL(value ?? "", this.page.url()).searchParams.get("page_count") };
  }
}
