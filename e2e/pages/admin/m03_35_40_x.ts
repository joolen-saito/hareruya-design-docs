/**
 * M03-35 部門更新CSV登録・M03-40 棚番号更新CSV登録の続き（-x）のシードで使う、商品・商品規格の画面操作（新しく足した部品。既存の部品は変えていない）。
 * - グッズ商品CSV登録で商品を1件作る（部門ID・スマレジ連携フラグ0 を入れる）。同じ商品コードの規格が2件要るときは、商品規格一覧の「新規作成」で
 *   状態 EX の規格を足す（pages/admin/f06_09_setup.ts の 規格を足す）。
 * - 商品規格登録編集画面で、部門・棚番号を選んで「商品規格を登録」する（スマレジ連携フラグが「連携しない」であることを確かめる）。
 * セレクタはここだけに書く。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { 規格を足す } from "./f06_09_setup";
import { openClassListByCode, registerGoodsProduct } from "./m03_30_products";

type Issue = (m: string) => void;

/**
 * 商品規格登録編集画面を開き、部門（部門IDの選択肢）・棚番号（名前の選択肢）を選んで「商品規格を登録」を押す。
 * 指定しなかった欄は変えない。登録後の画面で選んだ値が残っていることを確かめる。
 */
export async function 規格の部門と棚番号を選んで登録する(page: Page, a: { 商品ID: string; 商品規格ID: string; 部門ID?: string; 棚番号?: string }, what: string, issue: Issue): Promise<void> {
  await page.goto(adminUrl(`/product/product/class/${a.商品ID}/edit/${a.商品規格ID}`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集画面`).toBeVisible();
  const smaregi = form.locator('input[name="admin_product_class[smaregi_alignment_flg]"]:checked');
  await expect(smaregi, `${what}: スマレジ連携フラグが選ばれている`).toHaveCount(1);
  if ((await smaregi.getAttribute("value")) !== "0") throw new Error(`${what}: スマレジ連携フラグが「連携する」になっている（保存すると外部へ送られるので止める）`);
  const section = form.locator("#admin_product_class_Section");
  if (a.部門ID) {
    if ((await section.locator(`option[value="${a.部門ID}"]`).count()) !== 1) throw new Error(`${what}: 部門の選択肢に部門ID ${a.部門ID} が無い`);
    await section.selectOption(a.部門ID);
  } else if (!(await section.inputValue())) {
    // 部門の欄は登録に要る。指定が無く空のときは選択肢の先頭を選ぶ（pages/admin/m03_30_products.ts の addClass と同じ）
    const first = await section.locator("option").evaluateAll((ns) => ns
      .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).find((o) => o.value !== ""));
    if (!first) throw new Error(`${what}: 部門に選べる値が無い`);
    await section.selectOption(first.value);
    issue(`${what}: 部門は選択肢の先頭の「${first.label}」を選んだ（ケースは部門を見ない）`);
  }
  if (a.棚番号 !== undefined) await chooseByLabel(form.locator("#admin_product_class_ShelfNumber"), a.棚番号);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.getByRole("button", { name: "商品規格を登録", exact: true }).click()]);
  for (const w of await expectSaved(page, `${what}: 商品規格の登録`)) issue(`${what}: 警告「${w}」`);
  if (a.部門ID) await expect(form.locator("#admin_product_class_Section"), `${what}: 登録後の部門`).toHaveValue(a.部門ID);
  if (a.棚番号 !== undefined) {
    await expect(form.locator("#admin_product_class_ShelfNumber option:checked"), `${what}: 登録後の棚番号`).toHaveText(new RegExp(`^\\s*${a.棚番号.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`));
  }
}

export type 作った商品 = { 商品ID: string; 商品規格ID: string[] };

/**
 * グッズ商品CSV登録で商品を1件作り（部門ID・スマレジ連携フラグ0）、商品規格一覧の行を読む。規格の数が2なら、同じ商品コードで状態 EX の規格を足し、
 * その規格の部門を同じ部門にする。棚番号を指定したら、各規格の棚番号をそれにする。商品IDと商品規格ID（商品規格IDの順）を返す。
 */
export async function 商品を作る(page: Page, a: { 商品コード: string; 商品名: string; 部門ID: string; 規格の数?: 1 | 2; 棚番号?: string }, what: string, issue: Issue): Promise<作った商品> {
  await registerGoodsProduct(page, {
    what, code: a.商品コード, nameJp: a.商品名, nameEn: `${a.商品名} EN`,
    values: { "部門ID": a.部門ID, "スマレジ連携フラグ": "0" }, onIssue: issue,
  });
  const { productId, rows } = await openClassListByCode(page, a.商品コード);
  if (rows.length !== 1) throw new Error(`${what}: グッズ商品CSV登録でできた商品規格が ${rows.length} 件（1件のはず）`);
  const ids = [rows[0].商品規格ID];
  if (a.規格の数 === 2) {
    // 開発環境の状態の選択肢に EX が無い（ニアミント・スライトリープレイド・モデレトリープレイド・ヘビープレイド・その他。2026-11-12）。
    // 2件目は1件目（NM）と状態が違えばよいので、スライトリープレイドで作る（規格を足す は表示名そのものでも選べる）
    const 二件目の状態 = "スライトリープレイド" as unknown as "EX";
    issue(`${what}: 2件目の規格の状態 EX は開発環境に無いので、スライトリープレイドで作った（正本の外の補い）`);
    const id = await 規格を足す(page, productId, { 言語: "日本語", 状態: 二件目の状態, 商品コード: a.商品コード, 価格: "100", 買取価格: "10" }, `${what}: 同じ商品コードの2件目の規格`, issue);
    // 規格を足す は部門に選択肢の先頭を選ぶので、1件目と同じ部門にし直す
    if (a.部門ID) await 規格の部門と棚番号を選んで登録する(page, { 商品ID: productId, 商品規格ID: id, 部門ID: a.部門ID }, `${what}: 2件目の規格の部門`, issue);
    ids.push(id);
  }
  if (a.棚番号 !== undefined) {
    for (const id of ids) await 規格の部門と棚番号を選んで登録する(page, { 商品ID: productId, 商品規格ID: id, 棚番号: a.棚番号 }, `${what}: 規格 ${id} の棚番号`, issue);
  }
  return { 商品ID: productId, 商品規格ID: [...ids].sort((x, y) => Number(x) - Number(y)) };
}

// ---- CSV取込の画面の取込履歴（件数・ページング。templates の csv_import_history と pager の作り） ----

/** 取込履歴の件数のプルダウンで「n件」を選ぶ（選ぶと画面が1ページ目を開き直す） */
export async function 取込履歴の件数を選ぶ(page: Page, n: number): Promise<void> {
  const pulldown = page.locator("#page_count_pulldown");
  await expect(pulldown, "取込履歴の件数のプルダウン").toBeVisible();
  const value = await pulldown.locator("option").evaluateAll((os, want) => os
    .map((o) => ({ v: (o as HTMLOptionElement).value, t: (o.textContent ?? "").replace(/\s+/g, "") }))
    .find((o) => o.t === `${want}件`)?.v ?? "", n);
  if (!value) throw new Error(`取込履歴の件数のプルダウンに「${n}件」が無い`);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), pulldown.selectOption(value)]);
}

/** 取込履歴のページングで、ページ番号 n を押す */
export async function 取込履歴のページを選ぶ(page: Page, n: number): Promise<void> {
  const link = page.locator(".pagination .page-item a.page-link").filter({ hasText: new RegExp(`^\\s*${n}\\s*$`) });
  await expect(link, `取込履歴のページングの「${n}」`).toHaveCount(1);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), link.click()]);
}

/** 取込履歴のページングで、いま選ばれているページ番号（ページングが無ければ空） */
export async function 取込履歴の今のページ(page: Page): Promise<string> {
  const active = page.locator(".pagination .page-item.active .page-link");
  if ((await active.count()) === 0) return "";
  return ((await active.first().textContent()) ?? "").trim();
}
