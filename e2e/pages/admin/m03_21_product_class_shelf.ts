/**
 * M03-21 のシードで使う、商品規格の棚番号の付け外し（商品マスター → 商品登録編集 → 規格設定 → 商品規格登録）。
 * - 棚番号を商品規格に付ける: 商品マスターの初期条件の検索結果から商品を選び、商品規格一覧で
 *   スマレジ連携フラグが「連携しない」の商品規格を開いて、棚番号を選んで「商品規格を登録」する。
 * - 棚番号を外す: 商品マスターを棚番号で検索し、該当する商品規格の棚番号を「指定なし」にして「商品規格を登録」する。
 */
import { expect, Locator, Page } from "@playwright/test";
import { chooseByLabel, expectSaved } from "./common";
import { openClassListFromProductEdit } from "./m03_01_product_class";
import { openProductEdit } from "./product_edit";
import { ProductSearchPage } from "./product_search";
import { topMessages } from "./m03_21_shelf_number";

/** 商品規格登録画面の棚番号の欄 */
const shelfSelect = (page: Page) => page.locator('form#form select[name="admin_product_class[ShelfNumber]"]');
/** 商品規格登録画面のスマレジ連携フラグ（選ばれている値。連携する=1、連携しない=0） */
const smaregiChecked = (page: Page) => page.locator('form#form input[name="admin_product_class[smaregi_alignment_flg]"]:checked');

/** 商品規格一覧の、廃止でない商品規格の行 */
const activeClassRows = (page: Page) => page.locator("#ex-product_class tbody tr");

/** 商品規格登録画面の「商品規格ID」の表示値 */
async function displayedProductClassId(page: Page): Promise<string> {
  const row = page.locator("#productClass .row").filter({ has: page.locator("span", { hasText: /^\s*商品規格ID\s*$/ }) });
  await expect(row, "商品規格登録画面の商品規格IDの行").toHaveCount(1);
  return ((await row.locator(".col").first().textContent()) ?? "").trim();
}

/** 棚番号の欄で選ばれている選択肢の表示名（未選択なら「指定なし」） */
async function selectedShelfLabel(page: Page): Promise<string> {
  const select = shelfSelect(page);
  await expect(select, "商品規格登録画面の棚番号の欄").toHaveCount(1);
  return ((await select.locator("option:checked").textContent()) ?? "").trim();
}

/** 検索結果の行の商品ID（上から順） */
async function listedProductIds(page: Page): Promise<string[]> {
  const ids = (await page.locator('tr[id^="ex-product-"]').evaluateAll((trs) => trs.map((tr) => tr.id.replace("ex-product-", ""))));
  for (const id of ids) if (!/^\d+$/.test(id)) throw new Error(`商品マスターの検索結果の行から商品IDを読めない: ${id}`);
  return [...new Set(ids)];
}

/** 商品規格一覧で、条件に合う行の編集ボタンの送り先（上から順） */
async function editLinksOf(page: Page, pick: (row: Locator) => Promise<boolean>): Promise<string[]> {
  const out: string[] = [];
  for (const row of await activeClassRows(page).all()) {
    if (!(await pick(row))) continue;
    const href = await row.getByRole("link", { name: "編集", exact: true }).getAttribute("href");
    if (href) out.push(href);
  }
  return out;
}

/** 商品規格一覧の行の編集ボタンを押し、商品規格登録画面へ移る */
async function openClassEdit(page: Page, href: string): Promise<void> {
  const link = page.locator(`#ex-product_class a[href="${href}"]`);
  await expect(link, "商品規格一覧の編集ボタン").toHaveCount(1);
  await Promise.all([page.waitForURL(/\/product\/product\/class\/\d+\/edit\/\d+$/), link.click()]);
  await page.waitForLoadState("load");
  await expect(shelfSelect(page), "商品規格登録画面の棚番号の欄").toBeVisible();
}

/** 商品規格登録画面の「商品規格一覧」で一覧へ戻る */
async function backToClassList(page: Page, productId: string): Promise<void> {
  await Promise.all([
    page.waitForURL((u) => u.pathname.endsWith(`/product/product/class/${productId}`)),
    page.getByRole("link", { name: "商品規格一覧", exact: true }).click(),
  ]);
  await page.waitForLoadState("load");
}

/** 棚番号の欄を選び直して「商品規格を登録」し、保存できたかを返す（保存できなかったときは画面のエラーの文） */
async function saveShelf(page: Page, label: string, what: string): Promise<{ ok: true; warnings: string[] } | { ok: false; why: string }> {
  await chooseByLabel(shelfSelect(page), label);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.getByRole("button", { name: "商品規格を登録", exact: true }).click()]);
  const { エラー } = await topMessages(page);
  if (エラー.length) return { ok: false, why: エラー.join(" / ") };
  return { ok: true, warnings: await expectSaved(page, what) };
}

/**
 * 商品マスターの初期条件の検索結果から商品を順に見て、商品規格一覧でスマレジ連携フラグが「連携しない」（一覧の表示はOFF）で、
 * 棚番号が「指定なし」の商品規格を開き、棚番号に shelfName を選んで「商品規格を登録」する。
 * 状態がNM以外のシングルカードの商品規格は、保存するとスマレジ連携フラグが自動でONになり、外部のスマレジへ送られることがあるので、
 * 一覧の状態がNMの行だけを選ぶ。保存できなかった商品規格は飛ばして次を見る（理由は onIssue に渡す）。
 */
export async function assignShelfToProductClass(
  page: Page, shelfName: string, what: string, onIssue: (m: string) => void, maxProducts = 20,
): Promise<{ 商品ID: string; 商品規格ID: string }> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.submitAndWaitForResult();
  const productIds = (await listedProductIds(page)).slice(0, maxProducts);
  if (productIds.length === 0) throw new Error(`${what}: 商品マスターの初期条件の検索結果に商品が無い`);
  for (const productId of productIds) {
    await openProductEdit(page, productId);
    await openClassListFromProductEdit(page, productId);
    const links = await editLinksOf(page, async (row) => {
      const condition = ((await row.locator("td:nth-child(3)").textContent()) ?? "").trim();
      const smaregi = ((await row.locator("td:nth-child(4)").textContent()) ?? "").trim();
      return smaregi === "OFF" && condition === "NM";
    });
    for (const href of links) {
      await openClassEdit(page, href);
      const flag = (await smaregiChecked(page).count()) === 1 ? await smaregiChecked(page).getAttribute("value") : null;
      const current = await selectedShelfLabel(page);
      if (flag !== "0" || current !== "指定なし") {
        await backToClassList(page, productId);
        continue;
      }
      const productClassId = await displayedProductClassId(page);
      const r = await saveShelf(page, shelfName, `${what}: 商品規格ID ${productClassId} に棚番号「${shelfName}」を付ける`);
      if (!r.ok) {
        onIssue(`商品ID ${productId}・商品規格ID ${productClassId} は「商品規格を登録」で保存できなかったので、別の商品規格を選んだ: ${r.why}`);
        await page.goto(new URL(href, page.url()).toString());
        await page.waitForLoadState("load");
        await backToClassList(page, productId);
        continue;
      }
      for (const w of r.warnings) onIssue(w);
      expect(await displayedProductClassId(page), "保存後の商品規格ID").toBe(productClassId);
      expect(pathOfUrl(page.url()), "保存後の商品規格登録画面").toMatch(new RegExp(`/product/product/class/${productId}/edit/${productClassId}$`));
      expect(await selectedShelfLabel(page), "保存後の棚番号の欄").toBe(shelfName);
      return { 商品ID: productId, 商品規格ID: productClassId };
    }
  }
  throw new Error(`${what}: 初期条件の検索結果の先頭 ${productIds.length} 商品に、スマレジ連携フラグが「連携しない」で棚番号が未設定の、保存できる商品規格が無い`);
}

const pathOfUrl = (url: string) => new URL(url).pathname;

/** 商品マスターの検索入力で、既定で付いている絞り込み（公開・NM・高額商品除外）を外す */
async function clearDefaultFilters(search: ProductSearchPage): Promise<void> {
  await search.ensureDetailVisible();
  const filters: [string, string][] = [["status", "公開ステータス"], ["card_condition", "状態"], ["expensive", "高額商品"]];
  for (const [field, 項目] of filters) {
    for (const option of await search.choiceOptions(field)) {
      if (option.checked) await search.setChecked(field, option.value, false);
    }
    await expect.poll(() => search.checkedValues(field), `検索の「${項目}」の絞り込みを外す`).toEqual([]);
  }
}

/** 商品マスターを、既定の絞り込みを外して棚番号 shelfName で検索し、検索結果の商品IDを返す */
export async function productsUsingShelf(page: Page, shelfName: string, what: string): Promise<string[]> {
  const search = new ProductSearchPage(page);
  await search.open();
  await clearDefaultFilters(search);
  await search.chooseSelect2("shelf_number", shelfName);
  expect((await search.selectedValues("shelf_number")).length, `${what}: 検索の棚番号に「${shelfName}」を選んだ`).toBe(1);
  await search.submitAndWaitForResult();
  return listedProductIds(page);
}

/**
 * 商品マスターを棚番号 shelfName で検索し、該当する商品の商品規格のうち棚番号が shelfName のものを「指定なし」にして「商品規格を登録」する。
 * 外した商品規格IDを返す。1件も外せなければ落とす（棚番号を削除できない理由が分からないまま進めない）。
 */
export async function unassignShelf(page: Page, shelfName: string, what: string, onIssue: (m: string) => void): Promise<string[]> {
  const productIds = await productsUsingShelf(page, shelfName, what);
  const released: string[] = [];
  for (const productId of productIds) {
    await openProductEdit(page, productId);
    await openClassListFromProductEdit(page, productId);
    const links = await editLinksOf(page, async () => true);
    for (const href of links) {
      await openClassEdit(page, href);
      if ((await selectedShelfLabel(page)) !== shelfName) {
        await backToClassList(page, productId);
        continue;
      }
      const productClassId = await displayedProductClassId(page);
      const r = await saveShelf(page, "指定なし", `${what}: 商品規格ID ${productClassId} の棚番号を「指定なし」にする`);
      if (!r.ok) throw new Error(`${what}: 商品ID ${productId}・商品規格ID ${productClassId} の棚番号を「指定なし」にして保存できない: ${r.why}`);
      for (const w of r.warnings) onIssue(w);
      expect(await selectedShelfLabel(page), "保存後の棚番号の欄").toBe("指定なし");
      released.push(productClassId);
      await backToClassList(page, productId);
    }
  }
  if (released.length === 0) {
    throw new Error(`${what}: 棚番号「${shelfName}」は使用中で削除できないが、商品マスターを棚番号で検索しても、その棚番号の商品規格が見つからない（検索結果の商品 ${productIds.length} 件）`);
  }
  return released;
}
