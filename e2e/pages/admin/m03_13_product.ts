/**
 * M03-13 のシードとケースが使う、商品まわりの画面操作（商品マスターの検索・商品登録編集のタグ欄・規格一覧）。
 * 共通の部品（m03_01_goods_list_seed.ts の検索）は公開状態の条件を変えないので、非公開の商品を探すための局所の部品をここに置く。
 */
import { expect, Locator, Page } from "@playwright/test";
import { openClassListFromProductEdit } from "./m03_01_product_class";
import { GoodsCsvTemplate } from "./m03_01_goods_csv";
import { openProductEdit } from "./product_edit";
import { ProductSearchPage } from "./product_search";
import { expectSaved } from "./common";

export type FoundProduct = { 商品ID: string; 商品名: string; 商品コード: string };

/** 商品マスター（検索入力）で、公開状態の条件を選び直す（初期は「公開」だけが選ばれている） */
async function chooseStatuses(search: ProductSearchPage, labels: string[]): Promise<void> {
  await search.ensureDetailVisible();
  const options = await search.choiceOptions("status");
  for (const l of labels) {
    if (!options.some((o) => o.label === l)) throw new Error(`商品マスターの公開状態に「${l}」の選択肢が無い（ある選択肢: ${options.map((o) => o.label).join("、")}）`);
  }
  for (const o of options) await search.setChecked("status", o.value, labels.includes(o.label));
  expect((await search.checkedChoices("status")).map((c) => c.label).sort(), "公開状態の条件").toEqual([...labels].sort());
}

/** 検索結果の行を読む（商品ID・商品名・商品コード） */
async function readResultRows(page: Page): Promise<FoundProduct[]> {
  return page.locator('tr[id^="ex-product-"]').evaluateAll((trs) => trs.map((tr) => {
    const td = (n: number) => (tr.querySelector(`td:nth-child(${n})`)?.textContent ?? "").trim();
    return { 商品ID: td(2), 商品名: td(3), 商品コード: td(4) };
  }));
}

/** 商品名で検索し、名前がちょうど同じ行だけを返す（公開状態の条件は labels で選ぶ） */
export async function findProductsByName(page: Page, 商品名: string, labels: string[]): Promise<FoundProduct[]> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.field("product_name").fill(商品名);
  await chooseStatuses(search, labels);
  await search.submitAndWaitForResult();
  return (await readResultRows(page)).filter((r) => r.商品名 === 商品名);
}

/** 商品コードで検索し、コードがちょうど同じ行だけを返す（公開状態の条件は labels で選ぶ） */
export async function findProductsByCode(page: Page, 商品コード: string, labels: string[]): Promise<FoundProduct[]> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.ensureDetailVisible();
  await search.field("product_code").fill(商品コード);
  await chooseStatuses(search, labels);
  await search.submitAndWaitForResult();
  return (await readResultRows(page)).filter((r) => r.商品コード === 商品コード);
}

/** いま表示している検索結果で、商品IDの行の商品名のリンクを押し、商品登録編集画面へ移る */
export async function openProductFromResult(page: Page, 商品ID: string): Promise<void> {
  const link = page.locator(`tr#ex-product-${商品ID} td:nth-child(3) a`);
  await expect(link, `検索結果の商品ID ${商品ID} の商品名のリンク`).toHaveCount(1);
  await Promise.all([page.waitForURL((u) => u.pathname.endsWith(`/product/product/${商品ID}/edit`)), link.click()]);
  await page.waitForLoadState("load");
  await expect(page.locator("form#form1"), `商品ID ${商品ID} の商品登録編集画面`).toBeVisible();
}

/** グッズ商品CSVの雛形の列の説明（「1:公開 2:非公開 3:廃止」の形）から、表示名に対応する値を読む */
export function 公開状態の値(template: GoodsCsvTemplate, 列: string, 表示名: string): string {
  const description = template.columns.find((c) => c.label === 列)?.description;
  if (!description) throw new Error(`グッズ商品CSVの「${列}」の説明が画面に無い`);
  const entries = [...description.matchAll(/(\d+)\s*:\s*([^\d:]+)/g)].map((m) => ({ value: m[1], label: m[2].trim() }));
  const hit = entries.filter((e) => e.label === 表示名);
  if (hit.length !== 1) throw new Error(`グッズ商品CSVの「${列}」で「${表示名}」の値を一意に読めない: ${description}`);
  return hit[0].value;
}

/** 商品登録編集画面の、商品に付いているタグ（タグ欄の上に並ぶもの） */
export async function assignedTagNames(page: Page): Promise<string[]> {
  return page.locator("#tag > .card-body > .d-inline-block button").evaluateAll((bs) => bs.map((b) => (b.textContent ?? "").trim()));
}

/** タグ欄の、登録済みのタグの一覧を開く操作（設計書 0204 商品登録編集 識別ID 29 の「タグを選択」にあたる） */
export function tagChooser(page: Page): Locator {
  return page.locator('#tag [data-bs-toggle="collapse"][href="#allTags"]').filter({ hasText: /\S/ });
}

/** タグ欄の一覧を開く操作を押し、一覧が開くまで待つ。押した操作の表示の文を返す */
export async function pressTagChooser(page: Page): Promise<string> {
  const chooser = tagChooser(page);
  await expect(chooser, "タグ欄の、登録済みのタグの一覧を開く操作").toHaveCount(1);
  await expect(chooser, "タグ欄の、登録済みのタグの一覧を開く操作").toBeVisible();
  const label = ((await chooser.textContent()) ?? "").replace(/\s+/g, " ").trim();
  await chooser.click();
  const list = page.locator("#allTags");
  await expect(list, "タグ欄の登録済みのタグの一覧").toBeVisible();
  await expect(list, "タグ欄の登録済みのタグの一覧（開き終わり）").not.toHaveClass(/collapsing/);
  return label;
}

/** タグ欄の一覧に、選べる候補として表示されているタグの名称 */
export async function tagCandidates(page: Page): Promise<string[]> {
  const buttons = page.locator("#allTags button[data-tag-id]").filter({ visible: true });
  return (await buttons.allInnerTexts()).map((t) => t.trim());
}

/** タグ欄の一覧の、名称がちょうど同じ候補のボタン */
export function tagCandidateButton(page: Page, 名称: string): Locator {
  const exact = new RegExp(`^\\s*${名称.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);
  return page.locator("#allTags button[data-tag-id]").filter({ hasText: exact });
}

/** 商品登録編集画面から規格一覧へ移り、規格コードの行の「販売制限数」の列を読む */
export async function 販売制限数を規格一覧で読む(page: Page, 商品ID: string, 規格コード: string): Promise<string> {
  await openProductEdit(page, 商品ID);
  await openClassListFromProductEdit(page, 商品ID);
  const head = await page.locator("#ex-product_class thead th").allInnerTexts();
  const col = head.map((t) => t.trim()).indexOf("販売制限数");
  if (col < 0) throw new Error(`規格一覧に「販売制限数」の列が無い（列: ${head.join("、")}）`);
  const rows = page.locator("#ex-product_class tbody tr").filter({ has: page.getByRole("cell", { name: 規格コード, exact: true }) });
  await expect(rows, `規格一覧に規格コード ${規格コード} の行が1件`).toHaveCount(1);
  return ((await rows.locator(`td:nth-child(${col + 1})`).textContent()) ?? "").trim();
}

/** 商品登録編集画面の割引率の欄で選ばれている値（未選択なら空） */
export async function selectedDiscount(page: Page): Promise<string> {
  const discount = page.locator('form#form1 select[name="admin_product[Discount]"]');
  await expect(discount, "割引率の欄").toHaveCount(1);
  return discount.inputValue();
}

/**
 * 商品登録編集画面で、割引率に選択肢のいずれか（先頭）を選び、タグは選ばずに「商品を登録」を押す。
 * 販売制限（地域の選択。画面では必須）が選ばれていなければ、先頭の選択肢を選ぶ。グッズ商品CSVで作った商品は、地域別販売制限の列が空だと未選択のまま残る。
 * シード表は販売制限の地域を定めていない（「販売制限=5」は規格の販売制限数）。
 * 選んだ割引率・販売制限と画面の警告は onIssue に渡す（報告に出す）。
 */
export async function saveChoosingDiscount(page: Page, 商品ID: string, onIssue: (m: string) => void): Promise<void> {
  await openProductEdit(page, 商品ID);
  const form = page.locator("form#form1");
  const discount = form.locator('select[name="admin_product[Discount]"]');
  await expect(discount, "割引率の欄").toHaveCount(1);
  const options = await discount.locator("option").evaluateAll((nodes) => nodes
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).filter((o) => o.value !== ""));
  if (options.length === 0) throw new Error("割引率に選べる値が無い");
  await discount.selectOption(options[0].value);
  onIssue(`割引率に「${options[0].label}」を選んだ（正本: 登録済みの割引率1件）`);
  const regions = form.locator('input[type="radio"][name="admin_product[RegionRestriction]"]');
  if ((await regions.count()) === 0) throw new Error("販売制限に選べる値が無い");
  if ((await form.locator('input[type="radio"][name="admin_product[RegionRestriction]"]:checked').count()) === 0) {
    await regions.first().check();
    const regionLabel = await regions.first().evaluate((e) => (e as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? "");
    onIssue(`販売制限が未選択だったので「${regionLabel}」を選んだ（シード表は販売制限の地域を定めていない）`);
  }
  const tags = await assignedTagNames(page);
  if (tags.length) throw new Error(`商品ID ${商品ID} にタグが付いている（${tags.join("、")}）。シード表はタグの紐付け0件`);
  await form.locator('button[type="submit"]').filter({ hasText: /^\s*商品を登録\s*$/ }).click();
  await page.waitForLoadState("load");
  for (const warning of await expectSaved(page, `商品ID ${商品ID} の「商品を登録」`)) onIssue(warning);
}
