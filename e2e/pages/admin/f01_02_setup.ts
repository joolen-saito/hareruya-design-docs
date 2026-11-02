/** F01-02 支店ECTOP のシードが使う、管理画面の操作（支店の編集管理者・商品のセールの設定・支店の在庫）。 */
import { Page, expect } from "@playwright/test";
import { Account } from "../../lib/session";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { ensureMember } from "./member";

export type 管理者 = { 名前: string; account: Account };
const PASS = "Passw0rd!F0102";

/** 在庫を申請する管理者と承認する管理者（どちらも店舗Aと支店を編集できるシステム管理者）を作る */
export async function 支店の管理者を用意する(page: Page, 番号: string, 印: string, 支店名: string, 本店名: string): Promise<{ 登録者: 管理者; 承認者: 管理者 }> {
  const make = async (役: string, 表示: string): Promise<管理者> => {
    const id = `f0102${役}${番号}${印}`.toLowerCase();
    const 名前 = `F0102${表示}${番号}-${印}`;
    await ensureMember(page, { 名前, 所属店舗: 支店名, ログインID: id, メールアドレス: `${id}@example.test`, パスワード: PASS, 権限: "システム管理者", デフォルト検索表示店舗: 支店名, 編集可能店舗: [支店名, 本店名] });
    return { 名前, account: { loginId: id, password: PASS } };
  };
  return { 登録者: await make("r", "登録者"), 承認者: await make("a", "承認者") };
}

/** 商品登録編集で、指定のタグにチェックを入れ（nullなら触らない）、割引率を先頭にして「商品を登録」する */
export async function タグを付けて商品を登録する(page: Page, 商品ID: string, タグID: string | null, 公開状態: "公開" | "廃止" | null, what: string, onIssue: (m: string) => void): Promise<void> {
  await page.goto(adminUrl(`/product/product/${商品ID}/edit`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `${what}: 商品登録編集`).toBeVisible();
  if (タグID) {
    // タグの選択は、「タグを保存」の折りたたみを開き、タグのボタンを押す（押すと見えない選択欄にチェックが入る）
    const btn = form.locator(`#allTags button[data-tag-id="${タグID}"]`);
    if (!(await btn.isVisible())) await form.locator('a[href="#allTags"], [data-bs-toggle="collapse"][href="#allTags"]').first().click({ timeout: 20_000 });
    await btn.click({ timeout: 20_000 });
    await expect(form.locator(`input[name="admin_product[Tag][]"][value="${タグID}"]`), `${what}: タグ ${タグID} が選ばれた`).toBeChecked();
  }
  if (公開状態) await chooseByLabel(form.locator('select[name="admin_product[Status]"]'), 公開状態);
  const discount = form.locator('select[name="admin_product[Discount]"]');
  if (!(await discount.inputValue())) {
    const first = await discount.locator("option").evaluateAll((ns) => ns.map((n) => (n as HTMLOptionElement).value).find((v) => v !== ""));
    if (first) await discount.selectOption(first);
  }
  await expect(form.locator('input[type="radio"][name="admin_product[RegionRestriction]"]:checked'), `${what}: 販売制限が選ばれている`).toHaveCount(1);
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), form.locator("button[type=submit]").filter({ hasText: /^\s*商品を登録\s*$/ }).click({ timeout: 20_000 })]);
  for (const w of await expectSaved(page, `${what}: 商品を登録`)) onIssue(w);
}

/** 商品規格登録編集で、セールフラグと販売価格を入れ、部門は先頭を選んで「商品規格を登録」する */
export async function 規格のセールを設定する(page: Page, 商品ID: string, 規格ID: string, v: { フラグ: boolean; 販売価格: string }, what: string, onIssue: (m: string) => void): Promise<void> {
  await page.goto(adminUrl(`/product/product/class/${商品ID}/edit/${規格ID}`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集`).toBeVisible();
  await form.locator("#admin_product_class_sale_flg").setChecked(v.フラグ, { timeout: 20_000 });
  await form.locator("#admin_product_class_price02").fill(v.販売価格, { timeout: 20_000 });
  const section = form.locator("#admin_product_class_Section");
  if (!(await section.inputValue())) {
    const first = await section.locator("option").evaluateAll((ns) => ns.map((n) => (n as HTMLOptionElement).value).find((x) => x !== ""));
    if (first) await section.selectOption(first);
  }
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), form.getByRole("button", { name: "商品規格を登録", exact: true }).click({ timeout: 20_000 })]);
  for (const w of await expectSaved(page, `${what}: 商品規格を登録`)) onIssue(w);
}
