/**
 * M03-22 のシード・ケースで使う、商品登録編集（商品詳細/編集）画面の購入グループ欄と、商品の保存の操作。
 * 商品の作成は M03-01 のグッズ商品CSV登録（pages/admin/m03_01_goods_register.ts）を使い、ここでは次だけを持つ。
 * - グッズ商品CSVの商品カテゴリに入れる「サプライ・グッズ」のカテゴリIDを、カテゴリ管理画面から読む
 * - 商品登録編集画面の購入グループ欄（単一選択）の選択肢と、選ばれている購入グループを読む
 * - 商品マスター(検索結果)の商品名のリンクから商品登録編集画面を開き、割引率と販売制限を選んで「商品を登録」する
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";
import { goodsRootCategoryLink } from "./product_masters";

/** カテゴリ管理画面の最上位の「サプライ・グッズ」のカテゴリID（画面の表示「ID:… サプライ・グッズ (…)」から読む） */
export async function goodsRootCategoryId(page: Page): Promise<string> {
  await page.goto(adminUrl("/product/category"));
  await page.waitForLoadState("load");
  const link = goodsRootCategoryLink(page);
  await expect(link, "カテゴリ管理画面の最上位の「サプライ・グッズ」").toHaveCount(1);
  const m = ((await link.innerText()) ?? "").trim().match(/^ID:(\d+)\s/);
  if (!m) throw new Error("「サプライ・グッズ」のカテゴリIDを画面から読めない");
  return m[1];
}

/**
 * グッズ商品CSVの商品カテゴリ(ID)に入れる「サプライ・グッズ」のカテゴリID。シードがデータを作る前に呼ぶ。
 * カテゴリ管理画面の「サプライ・グッズ」のIDと、グッズ商品CSV登録画面の列の説明（「2: サプライ・グッズ。…」）が示すIDを比べ、
 * 違えば何も作らずに止める。グッズ商品CSVは説明が示すID（アプリの固定のID）の配下しか受け付けないので、違うまま進むと
 * 購入グループだけ登録してCSVの取込で止まり、名称が固定の購入グループが残る（空から作ったDBのカテゴリの初期データは
 * アプリの固定のIDと合わない。HANDOFF 4章の16）。説明からIDを読めないときは、報告に出して画面のIDで進める。
 */
export async function goodsCsvCategoryId(page: Page, onIssue: (m: string) => void): Promise<string> {
  const onScreen = await goodsRootCategoryId(page);
  await page.goto(adminUrl("/product/product_goods_csv_upload"));
  await page.waitForLoadState("load");
  const rows = await page.locator("table.table-striped.table-bordered:not(#csv_import_history_table) tbody tr").evaluateAll((trs) => trs.map((tr) => {
    const cells = tr.querySelectorAll("td");
    return {
      label: cells.length ? [...cells[0].childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent ?? "").join("").trim() : "",
      description: cells.length > 1 ? (cells[1].textContent ?? "").trim() : "",
    };
  }));
  const description = rows.find((r) => r.label === "商品カテゴリ(ID)")?.description ?? "";
  const m = description.match(/(\d+)\s*[:：]\s*サプライ・グッズ/);
  if (!m) {
    onIssue(`グッズ商品CSV登録画面の商品カテゴリ(ID)の説明から「サプライ・グッズ」のIDを読めない（説明「${description}」）。カテゴリ管理画面のID ${onScreen} で進めた`);
    return onScreen;
  }
  if (m[1] !== onScreen) {
    throw new Error(`グッズ商品CSV登録画面の商品カテゴリ(ID)の説明は「サプライ・グッズ」を ID ${m[1]} とする（説明「${description}」）が、`
      + `カテゴリ管理画面の「サプライ・グッズ」は ID ${onScreen}。グッズ商品CSVはサプライ・グッズ（ID ${onScreen}）を受け付けないので、`
      + "データを作る前に止めた（手元のDBのカテゴリの初期データがアプリの固定のIDと合わない。HANDOFF 4章の16）");
  }
  return onScreen;
}

/** 商品登録編集画面の購入グループ欄（単一選択） */
export const purchaseGroupSelect = (page: Page): Locator => page.locator('form#form1 select[name="admin_product[SellGroup]"]');

/** 購入グループ欄の選択肢の表示名（値の無い行を除く） */
export async function purchaseGroupOptions(page: Page): Promise<string[]> {
  const select = purchaseGroupSelect(page);
  await expect(select, "購入グループ欄").toHaveCount(1);
  return select.locator("option").evaluateAll((nodes) => nodes
    .filter((n) => (n as HTMLOptionElement).value !== "")
    .map((n) => (n.textContent ?? "").trim()));
}

/**
 * 購入グループ欄の選択肢の、購入グループID（選択肢の値）と表示名（値の無い行を除く）。
 * 購入グループ欄は削除された購入グループも並べるので、同じ表示名の選択肢が複数あり得る。どの購入グループの選択肢かを見分けるときに使う。
 */
export async function purchaseGroupChoices(page: Page): Promise<{ 購入グループID: string; 名称: string }[]> {
  const select = purchaseGroupSelect(page);
  await expect(select, "購入グループ欄").toHaveCount(1);
  return select.locator("option").evaluateAll((nodes) => nodes
    .map((n) => n as HTMLOptionElement)
    .filter((n) => n.value !== "")
    .map((n) => ({ 購入グループID: n.value, 名称: (n.textContent ?? "").trim() })));
}

/** 購入グループ欄で選ばれている購入グループ（購入グループIDと表示名。未選択なら空） */
export async function selectedPurchaseGroup(page: Page): Promise<{ 購入グループID: string; 名称: string }> {
  const select = purchaseGroupSelect(page);
  await expect(select, "購入グループ欄").toHaveCount(1);
  return select.evaluate((s) => {
    const o = (s as HTMLSelectElement).selectedOptions.item(0);
    return { 購入グループID: o?.value ?? "", 名称: (o?.textContent ?? "").trim() };
  });
}

/**
 * 商品マスター(検索結果)に出ている商品IDの行の商品名のリンクから商品登録編集画面を開き、
 * 購入グループ欄が正本の購入グループ（名称）であることを確かめ、割引率（販売割引率に登録済みのものの先頭）と販売制限（先頭）を選んで
 * 「商品を登録」を押す。選んだ値は onIssue に渡す（報告に出す）。
 */
export async function saveFromSearchResult(page: Page, 商品ID: string, 購入グループ名: string, onIssue: (m: string) => void): Promise<void> {
  const link = page.locator(`tr#ex-product-${商品ID} td:nth-child(3) a`);
  await expect(link, `商品マスター(検索結果)の商品ID ${商品ID} の商品名のリンク`).toHaveCount(1);
  await Promise.all([page.waitForURL((u) => u.pathname.endsWith(`/product/product/${商品ID}/edit`)), link.click()]);
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `商品ID ${商品ID} の商品登録編集画面`).toBeVisible();

  const group = await selectedPurchaseGroup(page);
  if (group.名称 !== 購入グループ名) throw new Error(`商品ID ${商品ID} の購入グループ欄が「${group.名称}」（正本は「${購入グループ名}」）`);

  const discount = form.locator('select[name="admin_product[Discount]"]');
  await expect(discount, "割引率の欄").toHaveCount(1);
  const discounts = await discount.locator("option").evaluateAll((nodes) => nodes
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).filter((o) => o.value !== ""));
  if (discounts.length === 0) throw new Error("割引率に選べる値（販売割引率に登録済みのもの）が無い");
  await discount.selectOption(discounts[0].value);
  onIssue(`商品ID ${商品ID}: 割引率に「${discounts[0].label}」を選んだ（正本: 販売割引率に登録済みのものから選ぶ）`);

  const regions = form.locator('input[type="radio"][name="admin_product[RegionRestriction]"]');
  if ((await regions.count()) === 0) throw new Error("販売制限に選べる値が無い");
  await regions.first().check();
  const regionLabel = await regions.first().evaluate((e) => (e as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? "");
  onIssue(`商品ID ${商品ID}: 販売制限に「${regionLabel}」を選んだ（正本: 有効な値）`);

  const save = form.locator('button[type="submit"]').filter({ hasText: /^\s*商品を登録\s*$/ });
  await expect(save, "「商品を登録」ボタン").toHaveCount(1);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), save.click()]);
  for (const warning of await expectSaved(page, `商品ID ${商品ID} の「商品を登録」`)) onIssue(warning);
}
