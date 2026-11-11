/**
 * M06-11 戻しリストPDF出力（店頭買取）のシードが使う画面の操作。セレクタはここだけに書く。
 *
 * - カード新規登録: カラー・色順・カード名(英)・詳細情報（カードセット・カード番号・レアリティ・Foil）を指定して登録する
 * - 商品規格登録編集: スマレジ連携「連携しない」・部門・公開・（必要なら）棚番号を入れて登録する
 * - 買取詳細（店頭買取）の実在庫情報: 編集 → 商品追加（商品名で検索し、規格の状態を選んで追加）→ 増減数 → 追加品確定
 * - 略称タグの登録
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { カード詳細IDs } from "./m14_card";
import { ShortTagPage } from "./short_tag";

const OPEN = 30_000;
type Issue = (m: string) => void;

// ---------------------------------------------------------------------------
// カード
// ---------------------------------------------------------------------------

export type カードの指定 = {
  カード名英: string;
  /** カラー（カード登録画面のカラーの表示名） */
  カラー: string;
  /** 色順の表示名。省略すると、選択肢の先頭 */
  色順?: string;
  詳細: { カードセットID: string; カード番号: string; レアリティ名: string; Foil: boolean };
};

/** カード新規登録画面で登録し、カードIDと詳細情報のカード詳細IDを返す */
export async function カードを登録する(page: Page, v: カードの指定, what: string, issue: Issue): Promise<{ カードID: string; カード詳細ID: string }> {
  await page.goto(adminUrl("/card/new"));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `${what}: カード新規登録画面`).toBeVisible({ timeout: OPEN });
  await form.locator("#admin_card_nameEn").fill(v.カード名英);
  await form.locator("#admin_card_cmc").fill("0");
  // カラー
  const labels = page.locator('label[for^="admin_card_colors_"]');
  let found = false;
  for (let i = 0; i < (await labels.count()) && !found; i++) {
    if ((((await labels.nth(i).innerText()) ?? "").trim()) !== v.カラー) continue;
    const id = await labels.nth(i).getAttribute("for");
    await page.locator(`#${id}`).check();
    found = true;
  }
  if (!found) throw new Error(`${what}: カラーに「${v.カラー}」の選択肢が無い`);
  // 色順
  const seq = form.locator("#admin_card_colorSequence");
  if ((await seq.count()) > 0) {
    if (v.色順) await chooseByLabel(seq, v.色順);
    else {
      const first = await seq.locator("option").evaluateAll((ns) => ns.map((n) => (n as HTMLOptionElement).value).find((x) => x));
      if (first) { await seq.selectOption(first); issue(`${what}: 色順は指定が無いので選択肢の先頭を選んだ`); }
    }
  }
  // 詳細情報
  const details = page.locator("#card-details-container .detail-card");
  await page.locator("#add-detail").click();
  await expect(details, `${what}: 「詳細情報を追加」で詳細情報が増える`).toHaveCount(1);
  const det = details.last();
  const sel = (f: string) => det.locator(`select[name$="[${f}]"]`);
  await sel("cardset").selectOption(v.詳細.カードセットID);
  await det.locator('input[name$="[cardNo]"]').fill(v.詳細.カード番号);
  await chooseByLabel(sel("rarity"), v.詳細.レアリティ名);
  for (const f of ["cardLayout", "promotion"]) {
    const first = await sel(f).locator("option").evaluateAll((ns) => ns.map((n) => (n as HTMLOptionElement).value).find((x) => x));
    if (!first) throw new Error(`${what}: 詳細情報の${f}に選べる値が無い`);
    await sel(f).selectOption(first);
  }
  await sel("foilFlg").selectOption({ label: v.詳細.Foil ? "通常" : "なし" });
  await sel("frameFlg").selectOption({ label: "通常" });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    form.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }).click(),
  ]);
  for (const w of await expectSaved(page, `${what}: カードの登録`)) issue(`${what}: 警告「${w}」`);
  const m = /\/card\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`${what}: 登録後にカード編集画面へ移らない（${page.url()}）`);
  const ids = await カード詳細IDs(page);
  if (ids.length !== 1) throw new Error(`${what}: カード詳細IDが ${ids.length} 件（1件のはず）`);
  return { カードID: m[1], カード詳細ID: ids[0] };
}

// ---------------------------------------------------------------------------
// 略称タグ
// ---------------------------------------------------------------------------

/** 略称タグ登録/編集画面で、名称・並び順・アルファベット順（ソート設定）を入れて登録する */
export async function 略称タグを登録する(page: Page, v: { 名称: string; 並び順: string; アルファベット順: boolean }, what: string): Promise<void> {
  const tag = new ShortTagPage(page);
  await tag.openNew();
  await tag.fill(v);
  const r = await tag.pressRegister();
  if (!r.sent) throw new Error(`${what}: ブラウザの入力チェックで止まった（${r.止めた項目.join(" / ")}）`);
  await expectSaved(page, `${what}: 略称タグ「${v.名称}」の登録`);
}

// ---------------------------------------------------------------------------
// 商品規格
// ---------------------------------------------------------------------------

/**
 * 商品規格登録編集画面で、スマレジ連携「連携しない」・部門（空なら先頭）・公開（と、必要なら棚番号）を入れて「商品規格を登録」を押す。
 * カード商品CSVが作った規格は、状態がNM以外で基準価格が300円以上だとスマレジ連携が「連携する」になるので、外部へ送らないよう「連携しない」にして保存する。
 */
export async function 規格を整える(page: Page, 商品ID: string, 規格ID: string, v: { 棚番号?: string }, what: string, issue: Issue): Promise<void> {
  await page.goto(adminUrl(`/product/product/class/${商品ID}/edit/${規格ID}`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集画面`).toBeVisible({ timeout: OPEN });
  const smaregi = form.locator('[name="admin_product_class[smaregi_alignment_flg]"]');
  if ((await smaregi.count()) > 0) {
    if ((await smaregi.first().evaluate((n) => n.tagName)) === "SELECT") await chooseByLabel(smaregi.first(), "連携しない");
    else await form.getByLabel("連携しない", { exact: true }).check({ timeout: OPEN });
  }
  if (v.棚番号) await chooseByLabel(form.locator('select[name="admin_product_class[ShelfNumber]"]'), v.棚番号);
  const section = form.locator("#admin_product_class_Section");
  if ((await section.count()) === 1 && !(await section.inputValue())) {
    const first = await section.locator("option").evaluateAll((ns) => ns.map((n) => (n as HTMLOptionElement).value).find((x) => x));
    if (!first) throw new Error(`${what}: 部門の選択肢が無い`);
    await section.selectOption(first);
  }
  await chooseByLabel(form.locator("#admin_product_class_Status"), "公開");
  const on = (d: import("@playwright/test").Dialog) => { issue(`${what}: 画面の確認「${d.message()}」をOKで閉じた`); void d.accept(); };
  page.on("dialog", on);
  try {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }),
      page.getByRole("button", { name: "商品規格を登録", exact: true }).click({ timeout: OPEN }),
    ]);
  } finally { page.off("dialog", on); }
  for (const w of await expectSaved(page, `${what}: 商品規格の登録`)) issue(`${what}: 警告「${w}」`);
}

// ---------------------------------------------------------------------------
// 買取詳細（店頭買取）の実在庫情報
// ---------------------------------------------------------------------------

export type 実在庫の追加 = { 商品名: string; 状態: string; 増減数: string };

/**
 * 買取詳細（店頭買取）を開いた状態で、実在庫情報の「編集」を押し、各商品を「商品追加」（商品名で検索 → 規格の状態を選んで追加）で足し、
 * 増減数を入れて「追加品確定」を押す。
 */
export async function 実在庫に商品を追加する(page: Page, 追加: 実在庫の追加[], what: string): Promise<void> {
  const edit = page.locator("#edit_stock_switch");
  await expect(edit, "実在庫情報の編集ボタン").toBeVisible({ timeout: OPEN });
  await edit.click({ timeout: OPEN });
  await expect(page.locator("#detail_stock_edit"), "実在庫の編集欄").toBeVisible({ timeout: OPEN });
  for (const [i, a] of 追加.entries()) {
    await page.locator("#stockAddButton").click({ timeout: OPEN });
    const modal = page.locator("#registModal");
    await expect(modal, "実在庫用の商品検索モーダル").toBeVisible({ timeout: OPEN });
    await modal.locator("#admin_search_product_id").fill(a.商品名, { timeout: OPEN });
    await modal.locator("#searchProductModalButton").click({ timeout: OPEN });
    const rows = modal.locator("#searchProductModalList tr").filter({ has: page.locator("button.add-order-item") }).filter({ hasText: a.商品名 });
    await expect(rows.first(), `商品検索の結果（${a.商品名}）`).toBeVisible({ timeout: 30_000 });
    const row = rows.first();
    // 規格が複数ある商品は、行の中の選択欄で状態の規格を選ぶ（選択肢の表示は「商品コード/言語/状態/基準価格」）
    for (const s of await row.locator("select").all()) {
      const opts = await s.locator("option").evaluateAll((os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, t: (o.textContent ?? "").trim() })));
      const hit = opts.find((o) => o.t.split("/").map((x) => x.trim()).includes(a.状態));
      if (hit) { await s.selectOption(hit.v, { timeout: OPEN }); break; }
    }
    await row.locator("button.add-order-item").click({ timeout: OPEN });
    await expect(modal, "商品検索モーダルが閉じる").toBeHidden({ timeout: 30_000 });
    const added = page.locator("#detail_stock_edit tr.js-added-stock-row");
    await expect(added, `追加した商品の行（${i + 1}件目）`).toHaveCount(i + 1, { timeout: OPEN });
    await added.nth(i).locator('input[name^="stock_diff"]').fill(a.増減数, { timeout: OPEN });
  }
  await Promise.all([page.waitForLoadState("load"), page.getByRole("button", { name: "追加品確定" }).click({ timeout: OPEN })]);
  await page.waitForLoadState("load");
  await expectSaved(page, what);
}

// ---------------------------------------------------------------------------
// 買取一覧(検索入力)
// ---------------------------------------------------------------------------

/** 買取一覧(検索入力)の査定申込日時の開始・終了を入れる（日時の入力欄） */
export async function 査定申込日時を入れる(page: Page, 開始: string, 終了: string): Promise<void> {
  await page.locator("#otc_buy_order_application_date_from").fill(開始, { timeout: OPEN });
  await page.locator("#otc_buy_order_application_date_to").fill(終了, { timeout: OPEN });
}
