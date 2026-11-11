/**
 * M07-09 戻しリストPDF のカード商品シードが使う画面の操作（セレクタはここにだけ書く）。
 *
 * 依頼者の方針（2026-11-10）: 共有のマスタ（カード・略称タグ・棚番号・言語・状態・色順・レアリティ）には書き込まない。
 * 既存の値を画面で読んで使う。読むのは次の画面:
 * - MTGマスターデータ管理（言語・状態・レアリティ・色順の行）: 行の入力欄の名前 rows[ID][項目] から、ID・コード・名称・並び順を読む。
 * - 棚番号登録/編集・略称タグ登録/編集の一覧（どちらも並び順の昇順）。
 * - カード検索（一覧・条件抽出）でカラー・レアリティ・Foil を選んで検索し、カード詳細(編集)画面で、カラー・色順・カード名(英)と、
 *   詳細情報（カード詳細ID・コレクターNo・レアリティ・Foil）を読む。
 * 画面の作り（アプリのテンプレートで確かめた）:
 * - 商品登録編集の「カード指定 >」のカード検索は、カード名(日/英)で検索し、結果の1列目がカード詳細ID、行ごとに「決定」がある。
 * - 商品規格登録編集: 既存の規格の言語・状態は変えられない（無効）。言語・状態の違う規格は「新規作成」で足す。
 *   単体カードの商品で基準価格が閾値をまたぐと、送信のときにスマレジ連携フラグの確認のアラートが出る（OK で閉じる）。
 * - 買取情報編集の実在庫用の商品検索は商品ごとの行で、規格が複数ある商品は行の中の商品コードの選択欄で規格を選ぶ。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { CardSearchPage } from "./m14_card";
import { ShelfNumberPage } from "./m03_21_shelf_number";
import { ShortTagPage } from "./short_tag";

const OPEN = 30_000;
type Issue = (m: string) => void;

// ---------------------------------------------------------------------------
// マスターの読み取り（書き込まない）
// ---------------------------------------------------------------------------

export type マスタの行 = { ID: string; コード: string; 名称: string; 並び順: number | null };

/** MTGマスターデータ管理で種別（言語・状態・レアリティ・色順 など）を選び、既存の行を読む */
export async function マスタを読む(page: Page, 種別: string): Promise<マスタの行[]> {
  await page.goto(adminUrl("/data/mtg_master_data"), { timeout: 60_000 });
  await page.waitForLoadState("load");
  await page.locator('select[name="entity"]').selectOption({ label: 種別 }, { timeout: OPEN });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
    page.locator('form[method="get"] button[type="submit"]').click({ timeout: OPEN }),
  ]);
  await page.waitForLoadState("load");
  await expect(page.locator("form#edit_form table.mtg-master-table"), `MTGマスターデータ管理の${種別}の一覧`).toBeVisible({ timeout: OPEN });
  return page.locator("form#edit_form table.mtg-master-table tbody tr").evaluateAll((trs) => {
    const out: { ID: string; コード: string; 名称: string; 並び順: number | null }[] = [];
    for (const tr of trs) {
      const first = tr.querySelector("input[name], select[name]") as HTMLInputElement | null;
      const m = /^rows\[(.+?)\]\[/.exec(first?.getAttribute("name") ?? "");
      if (!m || m[1] === "new") continue;
      const v = (f: string) => ((tr.querySelector(`[name="rows[${m[1]}][${f}]"]`) as HTMLInputElement | null)?.value ?? "").trim();
      const s = v("sort_no") || v("sortNo");
      out.push({ ID: m[1], コード: v("code"), 名称: v("name_jp") || v("nameJp") || v("name"), 並び順: s === "" ? null : Number(s) });
    }
    return out;
  });
}

export type 棚 = { ID: string; 名称: string; 並び順: number };

/** 棚番号登録/編集の一覧の1ページ目（並び順の昇順）を読む */
export async function 棚番号を読む(page: Page): Promise<棚[]> {
  const p = new ShelfNumberPage(page);
  await p.openNew();
  return (await p.allRows()).map((r) => ({ ID: r.ID, 名称: r.名称, 並び順: Number(r.並び順) })).filter((r) => r.名称 !== "" && Number.isFinite(r.並び順));
}

export type 略称タグ = { ID: string; 名称: string; 並び順: number; アルファベット順: boolean };

/** 略称タグ登録/編集の一覧の1ページ目（並び順の昇順）を読む。ソートの列は「アルファベット」か「コレクター番号」 */
export async function 略称タグを読む(page: Page): Promise<略称タグ[]> {
  const p = new ShortTagPage(page);
  await p.openNew();
  return (await p.allRows()).map((r) => ({ ID: r.ID, 名称: r.名称, 並び順: Number(r.並び順), アルファベット順: r.ソート.includes("アルファベット") }))
    .filter((r) => r.名称 !== "" && Number.isFinite(r.並び順));
}

// ---------------------------------------------------------------------------
// 既存のカード詳細を探す
// ---------------------------------------------------------------------------

export type カード詳細 = { カードID: string; 詳細ID: string; カード名日: string; カード名英: string; コレクター番号: string; 色: string; レアリティID: string; Foil: string };

/** 検索欄の展開式のチェック（ラベルが一致するもの）を入れる */
async function 検索欄のチェック(page: Page, idPrefix: string, label: string): Promise<void> {
  const labels = page.locator(`#admin_search_form label[for^="${idPrefix}"]`);
  const n = await labels.count();
  for (let i = 0; i < n; i++) {
    const l = labels.nth(i);
    if (((await l.innerText()) ?? "").trim() !== label) continue;
    await page.locator(`#${await l.getAttribute("for")}`).check({ timeout: OPEN });
    return;
  }
  throw new Error(`カード検索の検索条件（${idPrefix}）に「${label}」が無い`);
}

/** カード詳細(編集)画面を開いて、カードのカラー・色順・カード名と、詳細情報を読む */
export async function カードを読む(page: Page, カードID: string): Promise<{ カラー: string[]; 色順: string; カード名日: string; カード名英: string; 詳細: { 詳細ID: string; コレクター番号: string; レアリティID: string; Foil: string }[] }> {
  await page.goto(adminUrl(`/card/${カードID}/edit`), { timeout: 60_000 });
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `カードID ${カードID} のカード詳細(編集)画面`).toBeVisible({ timeout: OPEN });
  const カラー = await form.locator('input[name="admin_card[colors][]"]:checked').evaluateAll((ns) => ns.map((n) => ((n as HTMLInputElement).labels?.[0]?.textContent ?? "").trim()));
  const 色順 = ((await form.locator('select[name="admin_card[colorSequence]"] option:checked').textContent().catch(() => "")) ?? "").trim();
  const カード名日 = (await form.locator("#admin_card_nameJp").inputValue()).trim();
  const カード名英 = (await form.locator("#admin_card_nameEn").inputValue()).trim();
  const 詳細 = await page.locator("#card-details-container .detail-card").evaluateAll((cards) => cards.map((c) => {
    const head = (c.querySelector(".detail-header strong")?.textContent ?? "").trim();
    const v = (suffix: string) => ((c.querySelector(`[name$="${suffix}"]`) as HTMLInputElement | null)?.value ?? "").trim();
    return { 詳細ID: (/(\d+)/.exec(head)?.[1]) ?? "", コレクター番号: v("[cardNo]"), レアリティID: v("[rarity]"), Foil: v("[foilFlg]") };
  }));
  return { カラー, 色順, カード名日, カード名英, 詳細: 詳細.filter((d) => d.詳細ID !== "") };
}

/**
 * カード検索で、カラー・レアリティ（表示名）・Foil（なし／通常）を選んで検索し、上から順にカード詳細(編集)画面を開いて、
 * カラーが「色」だけ・色順が「色」で、詳細情報のレアリティID・Foil が一致するカード詳細を集める（最大 max 件。開くカードは最大 open 件）。
 */
export async function カード詳細を探す(page: Page, v: { 色: string; レアリティ名: string; レアリティID: string; Foil: "なし" | "通常"; max?: number; open?: number }): Promise<カード詳細[]> {
  const s = new CardSearchPage(page);
  await s.open();
  await s.検索条件を展開する();
  await 検索欄のチェック(page, "admin_search_card_color_", v.色);
  await 検索欄のチェック(page, "admin_search_card_rarity_", v.レアリティ名);
  await 検索欄のチェック(page, "admin_search_card_foil_", v.Foil);
  await s.検索する();
  const ids = await s.表示中のカードID();
  const foil = v.Foil === "なし" ? "0" : "1";
  const out: カード詳細[] = [];
  for (const id of ids.slice(0, v.open ?? 30)) {
    const c = await カードを読む(page, id);
    if (c.カラー.length !== 1 || c.カラー[0] !== v.色 || c.色順 !== v.色) continue;
    if (!c.カード名日 && !c.カード名英) continue;
    for (const d of c.詳細) {
      if (d.レアリティID !== v.レアリティID || d.Foil !== foil) continue;
      out.push({ カードID: id, 詳細ID: d.詳細ID, カード名日: c.カード名日, カード名英: c.カード名英, コレクター番号: d.コレクター番号, 色: v.色, レアリティID: d.レアリティID, Foil: d.Foil });
    }
    if (out.length >= (v.max ?? 6)) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// 商品の設定
// ---------------------------------------------------------------------------

/**
 * 商品登録編集で、（カードにするときは）「カード指定 >」でカード詳細を選び、商品名(日/英)を入れ直し、商品カテゴリを単体カードにする。
 * 略称タグを選び、割引率が未選択なら登録済みの先頭を選んで「商品を登録」する。
 */
export async function 商品をカードにする(page: Page, 商品ID: string, v: { カード?: カード詳細; 商品名: string; 略称タグ: string | null }, onIssue: Issue): Promise<void> {
  await page.goto(adminUrl(`/product/product/${商品ID}/edit`), { timeout: 60_000 });
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `商品ID ${商品ID} の商品登録編集画面`).toBeVisible({ timeout: OPEN });
  if (v.カード) {
    const c = v.カード;
    const open = page.locator('button[data-bs-target="#searchCardDetailModal"]');
    await expect(open, "「カード指定 >」ボタン").toBeEnabled({ timeout: OPEN });
    await open.click({ timeout: OPEN });
    const modal = page.locator("#searchCardDetailModal");
    await expect(modal, "カード検索").toBeVisible({ timeout: OPEN });
    await modal.locator("#admin_search_card_detail_card_name").fill(c.カード名日 || c.カード名英, { timeout: OPEN });
    await modal.locator("#searchCardDetailModalButton").click({ timeout: OPEN });
    const decide = modal.locator(`#searchCardDetailModalList .set-carddetail[data-card-detail="${c.詳細ID}"]`);
    const anyResult = modal.locator("#searchCardDetailModalList table, #searchCardDetailModalList .box-title");
    await expect(anyResult.first(), "カード検索の結果").toBeVisible({ timeout: 60_000 });
    for (let pageNo = 2; pageNo <= 10 && (await decide.count()) === 0; pageNo++) {
      const link = modal.locator("#card_detail_pagination a.page-link").filter({ hasText: new RegExp(`^\\s*${pageNo}\\s*$`) });
      if ((await link.count()) === 0) break;
      await link.first().click({ timeout: OPEN });
      // ページ送りは画面のスクリプトが結果の欄を読み込み直す
      await page.waitForTimeout(1_000);
      await expect(anyResult.first(), `カード検索の結果の ${pageNo} ページ目`).toBeVisible({ timeout: 60_000 });
    }
    await expect(decide, `カード検索の結果に、カード詳細ID ${c.詳細ID}（${c.カード名日 || c.カード名英}）の「決定」`).toHaveCount(1, { timeout: OPEN });
    await decide.click({ timeout: OPEN });
    await expect(modal, "カードを決定するとカード検索が閉じる").toBeHidden({ timeout: OPEN });
  }
  for (const name of ["admin_product[name]", "admin_product[name_en]"]) {
    const f = form.locator(`input[name="${name}"]`);
    if ((await f.inputValue()) !== v.商品名) await f.fill(v.商品名, { timeout: OPEN });
  }
  if (v.略称タグ !== null) await chooseByLabel(form.locator('select[name="admin_product[StorageCode]"]'), v.略称タグ);
  if (v.カード) {
    // 商品カテゴリ: サプライ・グッズ（とその下）の選択を外し、単体カードを選ぶ
    const boxes = form.locator('input[name="admin_product[Category][]"]');
    const cats = await boxes.evaluateAll((els) => els.map((e) => ({ id: (e as HTMLInputElement).id, checked: (e as HTMLInputElement).checked, label: ((e as HTMLInputElement).labels?.[0]?.textContent ?? "").trim() })));
    for (const c of cats.filter((x) => x.checked)) await form.locator(`#${c.id}`).uncheck({ timeout: OPEN });
    // 開発環境の最上位カテゴリは「シングルカード」（シード表の「単体カード」）
    const single = cats.filter((x) => x.label === "単体カード").length ? cats.filter((x) => x.label === "単体カード") : cats.filter((x) => x.label.replace(/\s+/g, "") === "シングルカード");
    if (single.length === 0) throw new Error(`商品カテゴリに「単体カード」が無い（${cats.map((x) => x.label).slice(0, 20).join("、")}…）`);
    await form.locator(`#${single[0].id}`).check({ timeout: OPEN });
  }
  const discount = form.locator('select[name="admin_product[Discount]"]');
  if ((await discount.count()) > 0 && !(await discount.inputValue())) {
    const opts = await discount.locator("option").evaluateAll((os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, t: (o.textContent ?? "").trim() })).filter((o) => o.v));
    if (opts.length === 0) throw new Error("割引率の選択肢が無い");
    await discount.selectOption(opts[0].v);
    onIssue(`商品 ${v.商品名}: 割引率に「${opts[0].t}」を選んだ（シード表: 販売割引率に登録済みの割引率）`);
  }
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }).catch(() => null),
    form.locator('button[type="submit"]').filter({ hasText: /^\s*商品を登録\s*$/ }).click({ timeout: OPEN }),
  ]);
  for (const w of await expectSaved(page, `商品 ${v.商品名} のカード指定・略称タグ`)) onIssue(w);
}

/** 規格の入力欄の共通の設定（棚番号・部門の先頭・スマレジ連携しない・公開）と、必要ならセール */
async function 規格の共通欄(page: Page, 棚番号: string, セール価格?: string): Promise<void> {
  const form = page.locator("form#form");
  const smaregi = form.locator('[name="admin_product_class[smaregi_alignment_flg]"]');
  if ((await smaregi.count()) > 0) {
    if ((await smaregi.first().evaluate((n) => n.tagName)) === "SELECT") await chooseByLabel(smaregi.first(), "連携しない");
    else await form.getByLabel("連携しない", { exact: true }).check({ timeout: OPEN });
  }
  await chooseByLabel(form.locator('select[name="admin_product_class[ShelfNumber]"]'), 棚番号);
  const section = form.locator("#admin_product_class_Section");
  if (!(await section.inputValue())) {
    const first = await section.locator("option").evaluateAll((nodes) => nodes.map((n) => (n as HTMLOptionElement).value).find((x) => x));
    if (!first) throw new Error("商品規格の部門の選択肢が無い");
    await section.selectOption(first);
  }
  await chooseByLabel(form.locator("#admin_product_class_Status"), "公開");
  if (セール価格 !== undefined) {
    await form.locator('input[name="admin_product_class[sale_flg]"]').check({ timeout: OPEN });
    await form.locator("#admin_product_class_price02").fill(セール価格, { timeout: OPEN });
  }
}

async function 規格を登録する(page: Page, what: string, onIssue: Issue): Promise<void> {
  const on = (d: import("@playwright/test").Dialog) => { onIssue(`${what}: 画面の確認「${d.message()}」をOKで閉じた`); void d.accept(); };
  page.on("dialog", on);
  try {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }),
      page.getByRole("button", { name: "商品規格を登録" }).click({ timeout: OPEN }),
    ]);
  } finally { page.off("dialog", on); }
  for (const w of await expectSaved(page, what)) onIssue(w);
}

/** 商品規格一覧で商品コードの規格を開き、棚番号・部門・スマレジ連携・公開（とセール）を入れて登録する */
export async function 規格を整える(page: Page, 商品ID: string, 商品コード: string, v: { 棚番号: string; セール価格?: string }, onIssue: Issue): Promise<void> {
  await page.goto(adminUrl(`/product/product/class/${商品ID}`), { timeout: 60_000 });
  await page.waitForLoadState("load");
  const row = page.locator("#ex-product_class tbody tr").filter({ has: page.getByRole("cell", { name: 商品コード, exact: true }) });
  await expect(row, `商品規格一覧に商品コード ${商品コード} の規格が1件`).toHaveCount(1, { timeout: OPEN });
  await row.getByRole("link", { name: "編集" }).click({ timeout: OPEN });
  await page.waitForURL(/\/product\/product\/class\/\d+\/edit\/\d+/, { timeout: 60_000 });
  await page.waitForLoadState("load");
  await 規格の共通欄(page, v.棚番号, v.セール価格);
  await 規格を登録する(page, `商品規格 ${商品コード} の棚番号・公開の登録`, onIssue);
}

/** 商品規格一覧の「新規作成」で、言語・状態（コード）の違う規格を足す */
export async function 規格を足す(page: Page, 商品ID: string, v: { 言語名: string; 状態コード: string; 商品コード: string; 基準価格: string; 販売価格: string; 買取価格: string; 棚番号: string }, onIssue: Issue): Promise<void> {
  await page.goto(adminUrl(`/product/product/class/${商品ID}/new`), { timeout: 60_000 });
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, "商品規格登録編集（新規）").toBeVisible({ timeout: OPEN });
  await chooseByLabel(form.locator("#admin_product_class_Language"), v.言語名);
  const cond = form.locator(`#admin_product_class_CardCondition option[data-code="${v.状態コード}"]`);
  await expect(cond, `状態の選択肢（コード ${v.状態コード}）`).toHaveCount(1, { timeout: OPEN });
  await form.locator("#admin_product_class_CardCondition").selectOption((await cond.getAttribute("value")) ?? "");
  await form.locator("#admin_product_class_code").fill(v.商品コード, { timeout: OPEN });
  await form.locator("#admin_product_class_standard_price").fill(v.基準価格, { timeout: OPEN });
  await form.locator("#admin_product_class_price02").fill(v.販売価格, { timeout: OPEN });
  await form.locator("#admin_product_class_buy_price").fill(v.買取価格, { timeout: OPEN });
  const saleType = form.locator("#admin_product_class_sale_type");
  if ((await saleType.count()) > 0 && !(await saleType.inputValue())) {
    const first = await saleType.locator("option").evaluateAll((nodes) => nodes.map((n) => (n as HTMLOptionElement).value).find((x) => x));
    if (first) await saleType.selectOption(first);
  }
  await 規格の共通欄(page, v.棚番号);
  await 規格を登録する(page, `商品規格 ${v.商品コード}（${v.言語名}/${v.状態コード}）の新規作成`, onIssue);
}

// ---------------------------------------------------------------------------
// 買取情報編集の実在庫（規格を選んで足す）
// ---------------------------------------------------------------------------

/**
 * 買取情報編集（開いている画面）で、実在庫情報の「編集」→「商品追加」→ 商品コードで検索 → 商品の行で商品コードの規格を選んで「決定」→
 * 増減数を入れて「追加品確定」を押す。
 */
export async function 実在庫に規格を追加する(page: Page, 商品コード: string, 増減数: string, what: string): Promise<void> {
  const edit = page.locator("#edit");
  await expect(edit, "実在庫情報の編集ボタン").toHaveText("編集", { timeout: OPEN });
  await edit.click({ timeout: OPEN });
  await expect(page.locator("#detail_stock_edit"), "実在庫の編集欄").toBeVisible({ timeout: OPEN });
  await page.locator("#stockAddButton").click({ timeout: OPEN });
  const modal = page.locator("#registModal");
  await expect(modal, "実在庫用の商品検索モーダル").toBeVisible({ timeout: OPEN });
  await modal.locator("#stock_admin_search_product_id").fill(商品コード, { timeout: OPEN });
  await modal.locator("#stockSearchProductModalButton").click({ timeout: OPEN });
  const rows = modal.locator("#searchProductModalList tr").filter({ has: page.locator("button.add-order-item") });
  await expect(rows.first(), `商品検索の結果（${商品コード}）`).toBeVisible({ timeout: 30_000 });
  const n = await rows.count();
  let picked = false;
  for (let i = 0; i < n && !picked; i++) {
    const r = rows.nth(i);
    // 行の中の選択欄のうち、商品コードの選択肢を持つもの（規格の選択）でその規格を選ぶ
    for (const sel of await r.locator("select").all()) {
      // 選択肢の表示は「商品コード/言語/状態/\基準価格」。商品コードは data-product-code にもある
      const opts = await sel.locator("option").evaluateAll((os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, c: (o as HTMLOptionElement).dataset.productCode ?? "", t: (o.textContent ?? "").trim() })));
      const hit = opts.find((o) => o.c === 商品コード) ?? opts.find((o) => o.t.split("/")[0] === 商品コード);
      if (!hit) continue;
      await sel.selectOption(hit.v, { timeout: OPEN });
      picked = true;
      break;
    }
    // 規格が1つで選択欄に商品コードが出ない作りなら、結果が1行のときだけその行を使う
    if (!picked && n === 1) picked = true;
    if (picked) await r.locator("button.add-order-item").click({ timeout: OPEN });
  }
  if (!picked) throw new Error(`実在庫用の商品検索の結果に、商品コード ${商品コード} の規格が無い`);
  await expect(modal, "商品検索モーダルが閉じる").toBeHidden({ timeout: 30_000 });
  const row = page.locator("#stockEdit tr.js-added-stock-row").last();
  await expect(row, "追加した商品の行").toBeVisible({ timeout: OPEN });
  await row.locator('input[name$="[diff_stock]"]').fill(増減数, { timeout: OPEN });
  await Promise.all([page.waitForLoadState("load"), page.getByRole("button", { name: "追加品確定" }).click({ timeout: OPEN })]);
  await page.waitForLoadState("load");
  await expectSaved(page, what);
}
