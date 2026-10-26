/**
 * M03-30・M03-31 のシードで使う、商品・商品規格の画面操作。
 * - グッズ商品CSV登録で商品を1件登録する（雛形は画面からダウンロード。pages/admin/m03_01_goods_register.ts の registerGoodsCsv）。
 * - 商品マスターの検索から商品登録編集画面を開き、規格設定から商品規格一覧・商品規格登録編集画面を開いて商品規格IDを読む。
 * - 商品規格一覧の「新規作成」で商品規格を登録する。商品規格登録編集画面で帯URL・セールフラグ・販売価格を変えて登録する。商品規格を削除する。
 * - 商品登録編集画面の「カード指定」で、カード検索の結果の先頭のカードを指定して「商品を登録」する（シングルカードの商品にする）。
 * - 商品マスターで、ある商品IDの商品が無いことを確かめる。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { readExistingGoodsChildCategoryId } from "./m03_01_goods_csv";
import { registerGoodsCsv } from "./m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode, 商品規格の行 } from "./m03_23_seed_products";
import { assignCardOnProductEdit } from "./product_card_assign";
import { ProductSearchPage } from "./product_search";

export type Issue = (m: string) => void;

/**
 * グッズ商品CSV登録で商品を1件登録する。正本が書く列だけを values で渡す。
 * 正本の「商品カテゴリ(ID)…=登録済みのもの」「そのほかの必須の列に有効な値」は、サプライ・グッズ直下の既存のカテゴリ（並びの先頭）と、
 * 既存の購入グループ（一覧の先頭）にする（registerGoodsCsv の決め方）。商品公開ステータスは画面の説明で「公開」に当たる値。
 */
export async function registerGoodsProduct(page: Page, a: {
  what: string; code: string; nameJp: string; nameEn: string; values: Record<string, string>; onIssue: Issue;
}): Promise<void> {
  const categoryId = await readExistingGoodsChildCategoryId(page);
  a.onIssue(`${a.what}: 商品カテゴリ(ID)は、サプライ・グッズ直下の既存のカテゴリ（並びの先頭。ID ${categoryId}）にした`);
  await registerGoodsCsv(page, {
    what: `${a.what}: グッズ商品CSV登録`,
    fileName: `${a.code}-goods.csv`,
    categoryId,
    lines: [{ code: a.code, nameJp: a.nameJp, nameEn: a.nameEn, values: a.values }],
    onWarning: (w) => a.onIssue(`${a.what}: グッズ商品CSV登録の警告「${w}」`),
  });
}

/**
 * 正本「商品マスターの検索でコードに…を入れて検索するを押し、結果の行に表示された商品IDを控え、その行の商品名を押して商品登録編集画面を開き、
 * 規格設定を押して商品規格一覧を開く」。開いた商品の商品IDと、商品規格一覧の行を返す（商品規格一覧を開いた状態で終わる）。
 */
export async function openClassListByCode(page: Page, code: string): Promise<{ productId: string; rows: 商品規格の行[] }> {
  const productId = await openProductEditByCode(page, code);
  const rows = await classRowsFromProductEdit(page, productId);
  return { productId, rows };
}

/** 商品規格登録編集画面の「商品規格ID」の表示値 */
export async function displayedClassId(page: Page): Promise<string> {
  const row = page.locator("#productClass .row").filter({ has: page.locator("span", { hasText: /^\s*商品規格ID\s*$/ }) });
  await expect(row, "商品規格登録編集画面の商品規格IDの行").toHaveCount(1);
  const id = ((await row.locator(".col").first().textContent()) ?? "").trim();
  if (!/^\d+$/.test(id)) throw new Error(`商品規格登録編集画面の商品規格IDを読めない: 「${id}」`);
  return id;
}

/** 商品規格登録編集画面の「商品ID」の表示値 */
export async function displayedProductIdOnClassEdit(page: Page): Promise<string> {
  const row = page.locator("#productClass .row").filter({ has: page.locator("span", { hasText: /^\s*商品ID\s*$/ }) });
  await expect(row, "商品規格登録編集画面の商品IDの行").toHaveCount(1);
  const id = ((await row.locator(".col").first().textContent()) ?? "").trim();
  if (!/^\d+$/.test(id)) throw new Error(`商品規格登録編集画面の商品IDを読めない: 「${id}」`);
  return id;
}

/** 商品規格一覧（開いた状態）で、商品規格IDの行の「編集」を押して商品規格登録編集画面を開く */
export async function openClassEdit(page: Page, productId: string, classId: string): Promise<void> {
  const edit = page.locator(`#ex-product_class-${classId}`).getByRole("link", { name: "編集", exact: true });
  await expect(edit, `商品規格ID ${classId} の行の「編集」`).toHaveCount(1);
  await Promise.all([page.waitForURL(new RegExp(`/product/product/class/${productId}/edit/${classId}$`)), edit.click()]);
  await page.waitForLoadState("load");
  await expect(page.locator("form#form"), "商品規格登録編集画面").toBeVisible();
  expect(await displayedClassId(page), "開いた商品規格登録編集画面の商品規格ID").toBe(classId);
}

/** 商品規格一覧を開き直す（商品規格登録編集画面などから） */
export async function openClassList(page: Page, productId: string): Promise<void> {
  await page.goto(adminUrl(`/product/product/class/${productId}`));
  await page.waitForLoadState("load");
  await expect(page.locator("#ex-product_class-header"), `商品ID ${productId} の商品規格一覧`).toBeVisible();
}

/** 部門の欄が未選択なら、選択肢の先頭を選ぶ（正本「部門に任意の部門」「部門が未選択なら任意の部門を選び」） */
async function chooseAnySectionIfEmpty(page: Page, what: string, onIssue: Issue): Promise<void> {
  const section = page.locator("form#form #admin_product_class_Section");
  if (await section.inputValue()) return;
  const first = await section.locator("option").evaluateAll((nodes) => nodes
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).find((o) => o.value !== ""));
  if (!first) throw new Error(`${what}: 部門に選べる値が無い`);
  await section.selectOption(first.value);
  onIssue(`${what}: 部門は選択肢の先頭の「${first.label}」を選んだ（正本: 任意の部門）`);
}

/** スマレジ連携フラグが「連携しない」であること（保存すると外部のスマレジへ送られる設定にしない） */
async function expectSmaregiOff(page: Page, what: string): Promise<void> {
  const checked = page.locator('form#form input[name="admin_product_class[smaregi_alignment_flg]"]:checked');
  await expect(checked, `${what}: スマレジ連携フラグが選ばれている`).toHaveCount(1);
  expect(await checked.getAttribute("value"), `${what}: スマレジ連携フラグが「連携しない」`).toBe("0");
}

/** 「商品規格を登録」を押し、保存の成功を確かめる（警告は onIssue へ） */
async function pressRegisterClass(page: Page, what: string, onIssue: Issue): Promise<void> {
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    page.getByRole("button", { name: "商品規格を登録", exact: true }).click(),
  ]);
  for (const w of await expectSaved(page, `${what}: 商品規格の登録`)) onIssue(`${what}: 警告「${w}」`);
}

export type 新規の商品規格 = {
  言語: string; 状態: string; 商品コード: string; 基準価格: string; 販売価格: string; 買取価格: string;
  高額商品コード?: string;
};

/**
 * 商品規格一覧（開いた状態）の「新規作成」で商品規格登録編集画面を開き、値を入れ、部門に任意の部門（選択肢の先頭）、公開ステータスに公開を選んで
 * 「商品規格を登録」を押す。登録後の商品規格登録編集画面に表示された商品規格IDを返す（その画面で終わる）。
 */
export async function addClass(page: Page, productId: string, v: 新規の商品規格, what: string, onIssue: Issue): Promise<string> {
  const create = page.locator('#ex-product_class-header a[href$="/new"]');
  await expect(create, `${what}: 商品規格一覧の「新規作成」`).toHaveCount(1);
  await Promise.all([page.waitForURL(new RegExp(`/product/product/class/${productId}/new$`)), create.click()]);
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集画面（新規）`).toBeVisible();
  await chooseByLabel(form.locator("#admin_product_class_Language"), v.言語);
  await chooseByLabel(form.locator("#admin_product_class_CardCondition"), v.状態);
  await form.locator("#admin_product_class_code").fill(v.商品コード);
  await form.locator("#admin_product_class_standard_price").fill(v.基準価格);
  await form.locator("#admin_product_class_price02").fill(v.販売価格);
  await form.locator("#admin_product_class_buy_price").fill(v.買取価格);
  if (v.高額商品コード !== undefined) await form.locator("#admin_product_class_high_price_code").fill(v.高額商品コード);
  const saleType = await form.locator("#admin_product_class_sale_type").inputValue();
  if (!saleType) throw new Error(`${what}: 販売種別が未選択（正本に指定が無く補えない）`);
  await chooseAnySectionIfEmpty(page, what, onIssue);
  await chooseByLabel(form.locator("#admin_product_class_Status"), "公開");
  await expectSmaregiOff(page, what);
  await pressRegisterClass(page, what, onIssue);
  await expect(page, `${what}: 登録後は商品規格登録編集画面`).toHaveURL(new RegExp(`/product/product/class/${productId}/edit/\\d+$`));
  const id = await displayedClassId(page);
  // 入れた値が保存されたこと（登録後の画面の値）
  await expect(form.locator("#admin_product_class_code"), `${what}: 登録後の商品コード`).toHaveValue(v.商品コード);
  await expect(form.locator("#admin_product_class_Language option:checked"), `${what}: 登録後の言語`).toHaveText(new RegExp(`^\\s*${v.言語}\\s*$`));
  await expect(form.locator("#admin_product_class_CardCondition option:checked"), `${what}: 登録後の状態`).toHaveText(new RegExp(`^\\s*${v.状態}\\s*$`));
  if (v.高額商品コード !== undefined) await expect(form.locator("#admin_product_class_high_price_code"), `${what}: 登録後の高額商品コード`).toHaveValue(v.高額商品コード);
  return id;
}

/** 商品規格登録編集画面（開いた状態）で「商品規格を削除」を押し、確認で削除する */
export async function deleteClassOnEdit(page: Page, what: string, onIssue: Issue): Promise<void> {
  // 画面のスクリプトの読み込み前に削除を確定すると、削除の要求にならず、ただのリンクの移動になる（M03-01 の009で起きた）
  await page.waitForLoadState("load");
  await page.getByRole("link", { name: "商品規格を削除" }).click();
  const modal = page.locator("#deleteConfirmModal");
  await expect(modal, `${what}: 削除の確認`).toBeVisible();
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), modal.locator('a[data-method="delete"]').click()]);
  for (const w of await expectSaved(page, `${what}: 商品規格の削除`)) onIssue(`${what}: 警告「${w}」`);
}

/**
 * 商品規格登録編集画面（開いた状態）で、帯URL・セールフラグ・販売価格を正本の値に変え、部門が未選択なら任意の部門を選び、
 * 「商品規格を登録」を押す。登録後の画面の値で、変えた値が保存されたことを確かめる。
 */
export async function saveClassEdits(page: Page, e: { 帯URL?: string; セール販売価格?: string }, what: string, onIssue: Issue): Promise<void> {
  const form = page.locator("form#form");
  if (e.帯URL !== undefined) await form.locator("#admin_product_class_belt_url").fill(e.帯URL);
  if (e.セール販売価格 !== undefined) {
    await form.locator("#admin_product_class_sale_flg").check();
    await form.locator("#admin_product_class_price02").fill(e.セール販売価格);
  }
  await chooseAnySectionIfEmpty(page, what, onIssue);
  await expectSmaregiOff(page, what);
  await pressRegisterClass(page, what, onIssue);
  if (e.帯URL !== undefined) await expect(form.locator("#admin_product_class_belt_url"), `${what}: 登録後の帯URL`).toHaveValue(e.帯URL);
  if (e.セール販売価格 !== undefined) {
    await expect(form.locator("#admin_product_class_sale_flg"), `${what}: 登録後のセールフラグ`).toBeChecked();
    // 登録後の画面は金額を3桁区切り（「1,500」）で出す
    const shown = (await form.locator("#admin_product_class_price02").inputValue()).replace(/,/g, "");
    expect(shown, `${what}: 登録後の販売価格`).toBe(e.セール販売価格);
  }
}

/** 商品規格登録編集画面（開いた状態）の公開ステータスの表示 */
export async function classStatusLabel(page: Page): Promise<string> {
  return ((await page.locator("form#form #admin_product_class_Status option:checked").textContent()) ?? "").trim();
}

/**
 * 正本「商品登録編集画面を開き、カード指定ボタンを押してカード検索ポップアップで登録済みのカードを1つ選び、商品を登録ボタンを押す」。
 * カード検索をカード名を入れずに押し、結果の先頭のカードを選ぶ（pages/admin/product_card_assign.ts の assignCardOnProductEdit で指定する）。
 * 選んだカードは onIssue に出す。
 */
export async function assignFirstCard(page: Page, a: { productId: string; productNameJp: string; productNameEn: string }, what: string, onIssue: Issue): Promise<void> {
  await page.goto(adminUrl(`/product/product/${a.productId}/edit`));
  await page.waitForLoadState("load");
  await page.locator('button[data-bs-target="#searchCardDetailModal"]').click();
  const modal = page.locator("#searchCardDetailModal");
  await expect(modal, `${what}: カード検索`).toBeVisible();
  await modal.locator("#searchCardDetailModalButton").click();
  const first = modal.locator("#searchCardDetailModalList tbody tr").first();
  await expect(first, `${what}: カード検索の結果がある`).toBeVisible({ timeout: 60_000 });
  const cardDetailId = ((await first.locator("td").nth(0).textContent()) ?? "").trim();
  const shown = ((await first.locator("td").nth(2).textContent()) ?? "").replace(/\s+/g, " ").trim();
  const m = /《(.+?) \/ /.exec(shown);
  if (!/^\d+$/.test(cardDetailId) || !m) throw new Error(`${what}: カード検索の結果の先頭の行を読めない（ID「${cardDetailId}」・カード「${shown}」）`);
  onIssue(`${what}: カードは、カード検索をカード名を入れずに押した結果の先頭（カード詳細ID ${cardDetailId}「${m[1]}」）を選んだ（正本: 登録済みのカードを1つ）`);
  await assignCardOnProductEdit(page, {
    productId: a.productId, cardNameJp: m[1], cardDetailId, productNameJp: a.productNameJp, productNameEn: a.productNameEn,
  }, (msg) => onIssue(`${what}: ${msg}`));
}

/**
 * 商品マスター(検索入力)で、検索条件をクリアし（既定の公開状態・状態の絞り込みも外す）、IDに商品IDを入れて検索し、該当が無いことを確かめる。
 */
export async function expectNoProductWithId(page: Page, productId: string, what: string): Promise<void> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.ensureDetailVisible();
  await search.clear();
  for (const field of ["status", "card_condition", "expensive"]) {
    for (const option of await search.choiceOptions(field)) {
      if (option.checked) await search.setChecked(field, option.value, false);
    }
    await expect.poll(() => search.checkedValues(field), `${what}: 商品マスターの既定の絞り込みを外す`).toEqual([]);
  }
  await search.field("product_id").fill(productId);
  await search.submitAndWaitForResult();
  await expect(page.getByText("検索条件に合致するデータが見つかりませんでした"), `${what}: 商品ID ${productId} の商品が無い`).toBeVisible();
}
