/**
 * M07 の実在庫シードが使う、サプライ品の用意（棚番号の登録 → グッズ商品CSV登録 → 商品規格に棚番号と公開を設定）。
 * 正本のシード表の手順（棚番号登録画面・グッズ商品CSV登録・商品マスター・商品規格登録編集）のとおりに画面で行う。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { registerGoodsCsv } from "./m03_01_goods_register";
import { goodsCsvCategoryId } from "./m03_22_product";
import { ShelfNumberPage, topMessages } from "./m03_21_shelf_number";
import { openClassListByName } from "./m04_02_rc_stock";

type Issue = (m: string) => void;

/** 棚番号が未登録なら、名称と並び順（名称の数字の部分。無ければ 1）を入れて登録する */
export async function 棚番号を登録する(page: Page, 名称: string, onIssue: Issue): Promise<void> {
  const shelf = new ShelfNumberPage(page);
  await shelf.openNew();
  await shelf.名称.fill(名称);
  const digits = /(\d+)/.exec(名称)?.[1] ?? "1";
  await shelf.並び順.fill(String(Number(digits.slice(-6))));
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), shelf.登録ボタン.click()]);
  const m = await topMessages(page);
  if (m.エラー.length) {
    if (m.エラー.some((t) => /登録済|既に|重複|使用/.test(t))) { onIssue(`棚番号「${名称}」は登録済みだったので、登録しなかった（${m.エラー.join(" / ")}）`); return; }
    throw new Error(`棚番号「${名称}」を登録できない: ${m.エラー.join(" / ")}`);
  }
  if (!m.成功.length) throw new Error(`棚番号「${名称}」の登録の結果が表示されない`);
}

export type サプライ = { コード: string; 名前: string; 基準価格: string; 買取価格: string; 棚?: string };

/** グッズ商品CSV登録でサプライ品を作る（雛形から行を組む。正本の共通の値） */
export async function サプライ品を登録する(page: Page, 品: サプライ[], onIssue: Issue): Promise<void> {
  const categoryId = await goodsCsvCategoryId(page, onIssue);
  const lines = 品.map((p) => ({
    code: p.コード, nameJp: p.名前, nameEn: p.名前,
    values: { "基準価格": p.基準価格, "販売価格": p.基準価格, "買取価格": p.買取価格 },
  }));
  await registerGoodsCsv(page, { what: `サプライ品 ${品.map((p) => p.コード).join("・")} のグッズ商品CSV登録`, fileName: `m07-supply-${Date.now()}.csv`, categoryId, lines, common: { "原価単価": "10" }, onWarning: onIssue });
}

/** 商品の商品規格一覧（言語日本語・状態NMの規格）で棚番号を入れ、部門は先頭、公開ステータスは公開にして登録する */
export async function 規格に棚番号を付けて公開する(page: Page, 商品名: string, 商品コード: string, 棚番号: string, onIssue: Issue): Promise<void> {
  await openClassListByName(page, 商品名);
  const row = page.locator("#ex-product_class tbody tr").filter({ has: page.getByRole("cell", { name: 商品コード, exact: true }) });
  await expect(row, `商品規格一覧に商品コード ${商品コード} の規格が1件`).toHaveCount(1);
  await row.getByRole("link", { name: "編集" }).click();
  await page.waitForURL(/\/product\/product\/class\/\d+\/edit\/\d+/);
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  const smaregi = form.locator('[name="admin_product_class[smaregi_alignment_flg]"]');
  if ((await smaregi.count()) > 0) {
    if ((await smaregi.first().evaluate((n) => n.tagName)) === "SELECT") await chooseByLabel(smaregi.first(), "連携しない");
    else await form.getByLabel("連携しない", { exact: true }).check();
  }
  await chooseByLabel(form.locator('select[name="admin_product_class[ShelfNumber]"]'), 棚番号);
  const section = form.locator("#admin_product_class_Section");
  const first = await section.locator("option").evaluateAll((nodes) => nodes
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: n.textContent?.trim() ?? "" })).find((o) => o.value));
  if (!first) throw new Error(`商品規格 ${商品コード}: 部門の選択肢が無い`);
  await section.selectOption(first.value);
  await chooseByLabel(form.locator("#admin_product_class_Status"), "公開");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }),
    page.getByRole("button", { name: "商品規格を登録" }).click(),
  ]);
  for (const w of await expectSaved(page, `商品規格 ${商品コード} への棚番号と公開の登録`)) onIssue(w);
}

void adminUrl;
