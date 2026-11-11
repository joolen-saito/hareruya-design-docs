/**
 * 商品登録編集（既存の商品の編集）で、選ぶ欄（カードセット・商品公開ステータス・支店の商品公開ステータス）を選んで「商品を登録」する。
 * 画面の作り: Admin/Product/product.twig・ProductType（カードセットの欄は、カードを指定した商品では選べない作り）。
 * 必須の印がある行で未選択の選ぶ欄（割引率など）は、選択肢の先頭を選ぶ（選んだものは issue に渡す。product_card_assign.ts と同じ）。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

export type 商品の選ぶ欄 = {
  /** カードセットの欄の値（カードセットID） */
  カードセットID?: string;
  /** 商品公開ステータス（表示名で選ぶ） */
  公開?: "公開" | "非公開";
  /** 支店の商品公開ステータス（表示名で選ぶ） */
  支店の公開?: "公開" | "非公開";
  /** 付けるタグ・外すタグ（タグID）。タグの欄は画面では隠したチェックボックスで、タグのボタンを押すと切り替わる作り。チェックを直接切り替える */
  タグを付ける?: string[];
  タグを外す?: string[];
};

export async function 商品編集で選んで登録する(page: Page, productId: string, v: 商品の選ぶ欄, what: string, issue: (m: string) => void): Promise<void> {
  await page.goto(adminUrl(`/product/product/${productId}/edit`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `${what}: 商品登録編集画面`).toBeVisible();
  if (v.カードセットID) {
    const sel = form.locator("select#admin_product_Cardset");
    await expect(sel, `${what}: カードセットの欄`).toBeEnabled();
    await sel.selectOption(v.カードセットID);
  }
  if (v.公開) {
    // 商品公開ステータスは、画面下部の「商品を登録」の横の選ぶ欄
    await form.locator('select[name="admin_product[Status]"]').selectOption({ label: v.公開 });
  }
  if (v.支店の公開) {
    // 支店の商品公開ステータスは、表示・非表示のラジオ（値 1＝表示・0＝非表示）
    await form.locator(`input[type="radio"][name="admin_product[isBranchPublished]"][value="${v.支店の公開 === "公開" ? "1" : "0"}"]`).check();
  }
  for (const [ids, on] of [[v.タグを付ける ?? [], true], [v.タグを外す ?? [], false]] as const) {
    for (const id of ids) {
      const box = form.locator(`input[type="checkbox"][name="admin_product[Tag][]"][value="${id}"]`);
      await expect(box, `${what}: タグID ${id} のチェック`).toHaveCount(1);
      await box.evaluate((el, c) => { (el as HTMLInputElement).checked = c; }, on);
    }
  }
  // 必須で未選択の選ぶ欄に、先頭の選択肢を選ぶ
  const requiredRows = form.locator(".row").filter({ has: page.locator(":scope > .col-3 .badge", { hasText: "必須" }) });
  for (const r of await requiredRows.all()) {
    const label = ((await r.locator(":scope > .col-3 span").first().textContent()) ?? "").trim();
    for (const select of await r.locator(":scope > .col select").all()) {
      if (!(await select.isEnabled()) || (await select.inputValue())) continue;
      const options = await select.locator("option").evaluateAll((nodes) => nodes
        .map((n) => ({ value: (n as HTMLOptionElement).value, label: n.textContent?.trim() ?? "" })).filter((o) => o.value !== ""));
      if (options.length === 0) throw new Error(`${what}: 必須の「${label}」に選べる値が無い`);
      await select.selectOption(options[0].value);
      issue(`${what}: 必須で未選択の「${label}」に「${options[0].label}」を選んだ（正本: 登録済みのもの）`);
    }
  }
  await Promise.all([
    page.waitForLoadState("domcontentloaded"),
    form.locator('button[type="submit"]').filter({ hasText: /^\s*商品を登録\s*$/ }).click(),
  ]);
  for (const w of await expectSaved(page, `${what}: 商品を登録`)) issue(w);
  if (v.カードセットID) {
    await expect(page.locator("select#admin_product_Cardset"), `${what}: 登録後のカードセット`).toHaveValue(v.カードセットID);
  }
  for (const [ids, on] of [[v.タグを付ける ?? [], true], [v.タグを外す ?? [], false]] as const) {
    for (const id of ids) {
      const checked = await page.locator(`form#form1 input[type="checkbox"][name="admin_product[Tag][]"][value="${id}"]`).isChecked();
      if (checked !== on) throw new Error(`${what}: 登録後のタグID ${id} が${on ? "付いていない" : "外れていない"}`);
    }
  }
}
