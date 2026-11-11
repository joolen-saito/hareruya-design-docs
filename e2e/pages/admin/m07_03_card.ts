/**
 * M07-03 のシードが使う、グッズ商品CSV登録で作った商品をカード商品にする操作（シード表の手順）:
 * 商品登録編集で「カード指定 >」→ カード検索で検索結果の1件目を「決定」→ 商品名(日/英)を入れ直す →
 * 商品カテゴリはサプライ・グッズの選択を外して単体カードを選ぶ → 割引率に登録済みのものを選ぶ →「商品を登録」。
 * 画面の作り（admin/Product/product.twig・product_js.twig で確かめた）: カード検索の結果の各行に「決定」（.set-carddetail）がある。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

const OPEN = 30_000;

export async function カード商品にする(page: Page, 商品ID: string, 商品名: string, onIssue: (m: string) => void): Promise<void> {
  await page.goto(adminUrl(`/product/product/${商品ID}/edit`), { timeout: 60_000 });
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  const open = page.locator('button[data-bs-target="#searchCardDetailModal"]');
  await expect(open, "「カード指定 >」ボタン").toBeEnabled({ timeout: OPEN });
  await open.click({ timeout: OPEN });
  const modal = page.locator("#searchCardDetailModal");
  await expect(modal, "カード検索").toBeVisible({ timeout: OPEN });
  await modal.locator("#searchCardDetailModalButton").click({ timeout: OPEN });
  const first = modal.locator("#searchCardDetailModalList .set-carddetail").first();
  await expect(first, "カード検索の結果の1件目の「決定」").toBeVisible({ timeout: 60_000 });
  await first.click({ timeout: OPEN });
  await expect(modal, "カードを決定するとカード検索が閉じる").toBeHidden({ timeout: OPEN });
  onIssue(`商品 ${商品名}: カード検索の結果の1件目のカード「${(await page.locator("#admin_product_cardDetailId_name").innerText().catch(() => "")).trim()}」を指定した`);

  for (const name of ['admin_product[name]', 'admin_product[name_en]']) {
    const f = form.locator(`input[name="${name}"]`);
    if ((await f.inputValue()) !== 商品名) await f.fill(商品名, { timeout: OPEN });
  }

  // 商品カテゴリ: サプライ・グッズ（とその下）の選択を外し、単体カードを選ぶ
  const boxes = form.locator('input[name="admin_product[Category][]"]');
  const cats = await boxes.evaluateAll((els) => els.map((e) => ({ id: (e as HTMLInputElement).id, checked: (e as HTMLInputElement).checked, label: ((e as HTMLInputElement).labels?.[0]?.textContent ?? "").trim() })));
  for (const c of cats.filter((x) => x.checked)) await form.locator(`#${c.id}`).uncheck({ timeout: OPEN });
  const single = cats.filter((x) => x.label === "単体カード");
  if (single.length === 0) throw new Error(`商品カテゴリに「単体カード」が無い（${cats.map((x) => x.label).slice(0, 20).join("、")}…）`);
  await form.locator(`#${single[0].id}`).check({ timeout: OPEN });

  // 割引率: 登録済みのもの（選択肢の先頭）を選ぶ
  const discount = form.locator('select[name="admin_product[Discount]"]');
  if ((await discount.count()) > 0 && !(await discount.inputValue())) {
    const opts = await discount.locator("option").evaluateAll((os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, t: (o.textContent ?? "").trim() })).filter((o) => o.v));
    if (opts.length === 0) throw new Error("割引率の選択肢が無い");
    await discount.selectOption(opts[0].v);
    onIssue(`商品 ${商品名}: 割引率に「${opts[0].t}」を選んだ`);
  }

  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }).catch(() => null),
    form.locator('button[type="submit"]').filter({ hasText: /^\s*商品を登録\s*$/ }).click({ timeout: OPEN }),
  ]);
  for (const w of await expectSaved(page, `商品 ${商品名} のカード指定`)) onIssue(w);
}
