/** M03-01 の検索参照マスタを管理画面だけで用意する。 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

type Issue = (message: string) => void;

const singleRow = async (rows: Locator, what: string) => {
  const count = await rows.count();
  if (count !== 1) throw new Error(`${what} が ${count} 件ある（1件のはず）`);
  return rows.first();
};

/** 正本の「グッズ」は管理画面の最上位「サプライ・グッズ」を指す。予約側・同名の下位カテゴリは除く。 */
export function goodsRootCategoryLink(page: Page): Locator {
  return page.locator("#ex-secondaryCol .c-directoryTree > ul > li > span > a")
    .filter({ hasText: /^ID:\d+\s+サプライ・グッズ\s+\(\d+\)$/ });
}

/** グッズ直下のカテゴリをあれば照合、無ければ「子カテゴリ作成」で登録する。 */
export async function ensureGoodsChildCategory(page: Page, nameJp: string, nameEn: string, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/product/category"));
  const goods = await singleRow(
    goodsRootCategoryLink(page),
    "グッズ親カテゴリ",
  );
  await goods.click();
  await expect(page.locator('nav[aria-label="breadcrumb"] li[aria-current="page"] a').last(),
    "サプライ・グッズのカテゴリ画面に移動した").toHaveText("サプライ・グッズ");
  await expect(page.locator("#admin_category_name"), "子カテゴリ作成欄が表示された").toBeVisible();
  const rows = page.locator('li[id^="ex-category-"]').filter({ has: page.getByRole("link", { name: nameJp, exact: true }) });
  if (await rows.count() === 0) {
    await page.locator("#admin_category_name").fill(nameJp);
    await page.locator("#admin_category_category_name_en").fill(nameEn);
    await page.locator('button[form="admin_category_form"]').click();
    for (const warning of await expectSaved(page, `カテゴリ「${nameJp}」の登録`)) issue(warning);
  }
  const row = await singleRow(rows, `グッズ直下のカテゴリ「${nameJp}」`);
  await expect(row.getByRole("link", { name: nameEn, exact: true })).toBeVisible();
  const id = await row.getAttribute("data-id");
  if (!id || !/^\d+$/.test(id)) throw new Error(`カテゴリ「${nameJp}」の採番IDを画面から読めない`);
  return id;
}

/** 商品検索画面のエキスパンション候補から、同名カードセットのIDを読む。 */
async function findCardsetId(page: Page, nameJp: string): Promise<string | null> {
  await page.goto(adminUrl("/product"));
  const matches = await page.locator("#admin_search_product_cardset option").evaluateAll((options, name) => options
    .map((option) => option as HTMLOptionElement)
    .filter((option) => option.textContent?.trim() === name)
    .map((option) => option.value), nameJp);
  if (matches.length > 1) throw new Error(`カードセット「${nameJp}」が複数あり、再利用対象を決められない`);
  return matches[0] ?? null;
}

/** カードセットをあれば内容照合、無ければ画面登録する。 */
export async function ensureCardset(page: Page, nameJp: string, nameEn: string, code: string, issue: Issue): Promise<string> {
  let id = await findCardsetId(page, nameJp);
  if (id === null) {
    await page.goto(adminUrl("/cardset/new"));
    await page.locator("#admin_cardset_nameJp").fill(nameJp);
    await page.locator("#admin_cardset_nameEn").fill(nameEn);
    await page.locator("#admin_cardset_code").fill(code);
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date());
    const part = (type: string) => parts.find((value) => value.type === type)?.value ?? "";
    const year = part("year");
    const month = part("month");
    const day = part("day");
    const today = `${year}-${month}-${day}`;
    const singleDate = page.locator('input[name="admin_cardset[releaseDate]"]');
    if (await singleDate.count()) {
      await singleDate.fill(today);
    } else {
      await page.locator('[name="admin_cardset[releaseDate][year]"]').selectOption(year);
      await page.locator('[name="admin_cardset[releaseDate][month]"]').selectOption(String(Number(month)));
      await page.locator('[name="admin_cardset[releaseDate][day]"]').selectOption(String(Number(day)));
    }
    await page.getByRole("button", { name: "登録", exact: true }).click();
    for (const warning of await expectSaved(page, `カードセット「${nameJp}」の登録`)) issue(warning);
    const match = /\/cardset\/(\d+)\/edit/.exec(page.url());
    if (!match) throw new Error(`カードセット「${nameJp}」の登録後URLから採番IDを読めない`);
    id = match[1];
  } else {
    await page.goto(adminUrl(`/cardset/${id}/edit`));
    await expect(page.locator("#admin_cardset_nameJp")).toHaveValue(nameJp);
    await expect(page.locator("#admin_cardset_nameEn")).toHaveValue(nameEn);
    await expect(page.locator("#admin_cardset_code")).toHaveValue(code);
    const singleDate = page.locator('input[name="admin_cardset[releaseDate]"]');
    if (await singleDate.count()) {
      expect(await singleDate.inputValue(), `カードセット「${nameJp}」のリリース日`).not.toBe("");
    } else {
      for (const part of ["year", "month", "day"])
        expect(await page.locator(`[name="admin_cardset[releaseDate][${part}]"]`).inputValue(), `カードセット「${nameJp}」のリリース日${part}`).not.toBe("");
    }
  }
  return id;
}

/** 部門をあれば内容照合、無ければ他部門と重ならない数値コードで画面登録する。 */
export async function ensureProductSection(page: Page, name: string, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/product/section"));
  const sectionRows = () => page.locator("table tbody tr")
    .filter({ has: page.getByRole("link", { name, exact: true }) });
  if (await sectionRows().count() === 0) {
    const codes = await page.locator("table tbody tr td:nth-child(3)").allInnerTexts();
    const used = new Set(codes.map((code) => code.trim()));
    let code = 90301001;
    while (used.has(String(code))) code++;
    await page.locator('#form_section input[name$="[name]"]').fill(name);
    await page.locator('#form_section input[name$="[code]"]').fill(String(code));
    await page.locator('#form_section select[name$="[tax_free_division]"]').selectOption("0");
    await page.locator('button[form="form_section"]').click();
    for (const warning of await expectSaved(page, `部門「${name}」の登録`)) issue(warning);
  }
  const row = await singleRow(sectionRows(), `部門「${name}」`);
  await expect(row.locator("td:nth-child(4)")).toContainText("対象外");
  const id = (await row.locator("td:first-child a").innerText()).trim();
  if (!/^\d+$/.test(id)) throw new Error(`部門「${name}」の採番IDを画面から読めない`);
  return id;
}

/** 正本の「M03カテゴリ」「M03セット」に一致する候補は指定の2件だけ。 */
export async function expectReadMasterScope(page: Page): Promise<void> {
  await page.goto(adminUrl("/product"));
  for (const [field, prefix, wanted] of [
    ["category_id", "M03カテゴリ", ["M03カテゴリA", "M03カテゴリB"]],
    ["cardset", "M03セット", ["M03セットA", "M03セットB"]],
  ] as const) {
    const matches = await page.locator(`#admin_search_product_${field} option`).evaluateAll((options, name) => options
      .map((option) => option.textContent?.trim() ?? "")
      .filter((label) => label.includes(name))
      .sort(), prefix);
    expect(matches, `${prefix} の検索候補は正本指定の2件だけ`).toEqual([...wanted].sort());
  }
}
