/**
 * F06-08 入荷待ち商品一覧のシードで使う管理画面の操作（F06-08 専用。既存の部品は変えていない）。
 * - カード登録の詳細情報のカードセットは、既に登録されている先頭のものを使う（共有のマスタに試験の値を足さない）。
 * - 商品規格登録編集画面を開き直し、状態別称（個別メモ）・高額商品コードを入れて公開で登録する。
 * - 商品規格一覧の「新規作成」で、状態を記号（NM・SP）で選んで商品規格を足す。
 * セレクタはここだけに書く。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { addClass, openClassList } from "./m03_30_products";

type Issue = (m: string) => void;

/** カード新規登録画面の詳細情報のカードセットの、先頭の選択肢の値（保存はしない） */
export async function 既存のカードセットのID(page: Page): Promise<string> {
  await page.goto(adminUrl("/card/new"));
  await page.waitForLoadState("load");
  await expect(page.locator("form#form1"), "カード詳細(登録・編集・削除)画面").toBeVisible();
  await page.locator("#add-detail").click();
  const sel = page.locator('#card-details-container .detail-card select[name$="[cardset]"]').first();
  await expect(sel, "詳細情報のカードセットの欄").toHaveCount(1);
  const first = await sel.locator("option").evaluateAll((nodes) => nodes
    .map((n) => (n as HTMLOptionElement).value).find((v) => v !== ""));
  if (!first) throw new Error("カードセットに選べる既存の値が無い（共有のマスタには足さない）");
  return first;
}

/** 商品規格登録編集画面（新規）の状態の欄で、記号の選択肢の表示名 */
async function 状態の表示名(page: Page, 記号: string): Promise<string> {
  const option = page.locator(`form#form #admin_product_class_CardCondition option[data-code="${記号}"]`);
  if ((await option.count()) !== 1) throw new Error(`商品規格の状態の欄に、記号 ${記号} の選択肢を1つに決められない`);
  return ((await option.textContent()) ?? "").trim();
}

export type 足す規格 = { 言語: "日本語" | "英語"; 状態: "NM" | "SP"; 商品コード: string; 価格: string };

/** 商品規格一覧の「新規作成」で規格を足し（基準価格＝販売価格、買取価格10、部門は先頭、公開）、商品規格IDを返す */
export async function 規格を足す(page: Page, productId: string, v: 足す規格, what: string, issue: Issue): Promise<string> {
  await page.goto(adminUrl(`/product/product/class/${productId}/new`));
  await page.waitForLoadState("load");
  await expect(page.locator("form#form"), `${what}: 商品規格登録編集画面（新規）`).toBeVisible();
  const label = await 状態の表示名(page, v.状態);
  await openClassList(page, productId);
  return addClass(page, productId, {
    言語: v.言語, 状態: label, 商品コード: v.商品コード, 基準価格: v.価格, 販売価格: v.価格, 買取価格: "10",
  }, what, issue);
}

/**
 * 商品規格登録編集画面を開き直し、状態別称（個別メモ）・高額商品コードのうち渡したものを入れ、部門が未選択なら先頭を選び、
 * 公開ステータスを公開にして「商品規格を登録」する。スマレジ連携フラグが「連携する」なら外部へ送られるので止める。
 */
export async function 規格の値を入れて公開する(
  page: Page, a: { productId: string; classId: string; 個別メモ?: string; 高額商品コード?: string }, what: string, issue: Issue,
): Promise<void> {
  await page.goto(adminUrl(`/product/product/class/${a.productId}/edit/${a.classId}`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集画面`).toBeVisible();
  const smaregi = form.locator('input[name="admin_product_class[smaregi_alignment_flg]"]:checked');
  if ((await smaregi.count()) === 1 && (await smaregi.getAttribute("value")) !== "0") {
    throw new Error(`${what}: スマレジ連携フラグが「連携する」になっている。保存すると外部のスマレジへ送られるので止める`);
  }
  const section = form.locator("#admin_product_class_Section");
  if (!(await section.inputValue())) {
    const first = await section.locator("option").evaluateAll((nodes) => nodes
      .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).find((o) => o.value !== ""));
    if (!first) throw new Error(`${what}: 部門に選べる値が無い`);
    await section.selectOption(first.value);
    issue(`${what}: 部門は選択肢の先頭の「${first.label}」を選んだ（シード表: 任意の部門）`);
  }
  if (a.個別メモ !== undefined) await form.locator("#admin_product_class_memo").fill(a.個別メモ);
  if (a.高額商品コード !== undefined) await form.locator("#admin_product_class_high_price_code").fill(a.高額商品コード);
  await chooseByLabel(form.locator("#admin_product_class_Status"), "公開");
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.getByRole("button", { name: "商品規格を登録", exact: true }).click()]);
  for (const w of await expectSaved(page, `${what}: 商品規格の登録`)) issue(`${what}: 警告「${w}」`);
  await expect(form.locator("#admin_product_class_Status option:checked"), `${what}: 登録後の公開ステータス`).toHaveText(/^\s*公開\s*$/);
  if (a.個別メモ !== undefined) await expect(form.locator("#admin_product_class_memo"), `${what}: 登録後の状態別称（個別メモ）`).toHaveValue(a.個別メモ);
  if (a.高額商品コード !== undefined) await expect(form.locator("#admin_product_class_high_price_code"), `${what}: 登録後の高額商品コード`).toHaveValue(a.高額商品コード);
}
