/** F01-02 支店ECTOP のシードが使う、管理画面の操作（支店の編集管理者・商品のセールの設定・支店の在庫）。 */
import { Page, expect } from "@playwright/test";
import { Account } from "../../lib/session";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { ensureMember } from "./member";
import { TagPage } from "./m03_13_tag";

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
export async function タグを付けて商品を登録する(page: Page, 商品ID: string, タグID: string | null, 公開状態: "公開" | "非公開" | "廃止" | null, what: string, onIssue: (m: string) => void): Promise<void> {
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

// ---- タグ・支店トップページ管理（タイル） ----

/** 同じ実行の中で作ったタグ（名称→タグID）。同じ名称のタグを二重に作らない */
const 作ったタグ = new Map<string, string>();

/** タグ管理でタグを作り、タグIDを返す（この実行で作った名称なら作らずに返す）。並び順は重ならなくてよいので固定の値 */
export async function タグを用意する(page: Page, 名称: string, what: string): Promise<string> {
  const known = 作ったタグ.get(名称);
  if (known) return known;
  const tag = new TagPage(page);
  // 共有の開発環境では、同じ管理者で並べて実行するため、まれに画面の入力が受け付けられず「登録できませんでした。」と戻る
  // （入力の誤りの表示は無い）。画面を開き直して入れ直せば通るので、3回まで試す。3回とも戻ったら、そのまま止める。
  let id = "";
  for (let attempt = 1; ; attempt++) {
    await tag.openNew();
    try {
      id = await tag.register({ 名称日: 名称, 名称英: 名称, 並び順: "9999" }, `${what}: タグ管理で「${名称}」を登録`);
      break;
    } catch (e) {
      if (attempt >= 3 || !String((e as Error).message).includes("登録できませんでした")) throw e;
      await page.waitForTimeout(3000);
    }
  }
  作ったタグ.set(名称, id);
  return id;
}

/** 1x1 の PNG（支店トップページ管理のバナー画像に使う、中身を問わない画像ファイル） */
const 小さな画像 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

/**
 * コンテンツ管理＞支店トップページ管理で、支店を選び、「支店共通設定を適用」を外し、バナー画像に任意の画像を選び、
 * 1行目（上段右）をタイル属性「その他」・タイルタグ＝指定のタグ、残り3行（中段左・中段右・下段左）をタイル属性「ピックアップ商品」にして登録する。
 */
export async function 支店トップページにタイルを設定する(page: Page, 支店名: string, タグ名: string, what: string, onIssue: (m: string) => void): Promise<void> {
  await page.goto(adminUrl("/content/branch_toppage"));
  await page.waitForLoadState("load");
  const selector = page.locator('select[name="branch_toppage_management[branch_list]"]');
  await expect(selector, `${what}: 支店トップページ管理の支店の選択`).toBeVisible();
  const value = await selector.locator("option").evaluateAll((os, name) => (os as HTMLOptionElement[]).find((o) => (o.textContent ?? "").includes(name as string))?.value ?? "", 支店名);
  if (!value) throw new Error(`${what}: 支店トップページ管理の支店の選択に「${支店名}」が無い`);
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), selector.selectOption(value)]);
  await expect(page.locator('select[name="branch_toppage_management[branch_list]"]'), `${what}: 選んだ支店`).toHaveValue(value);
  const common = page.locator("#common-setting");
  if (await common.isChecked()) await common.uncheck({ timeout: 20_000 });
  await page.locator("#branch_toppage_management_image_file").setInputFiles({ name: "branch-banner.png", mimeType: "image/png", buffer: 小さな画像 }, { timeout: 20_000 });
  const rows = page.locator("#tiles .tile-config");
  await expect(rows, `${what}: タイルの行（4区画）`).toHaveCount(4);
  const 区画 = [1, 2, 3, 4];
  for (let i = 0; i < 区画.length; i++) {
    const section = rows.nth(i).locator('select[id$="_section"]');
    const type = rows.nth(i).locator('select[id$="_tileType"]');
    const tag = rows.nth(i).locator('select[id$="_tag"]');
    await section.selectOption(String(区画[i]), { timeout: 20_000 });
    if (i === 0) {
      await chooseByLabel(type, "その他");
      await expect(tag, `${what}: タイルタグの欄が使える`).toBeEnabled();
      await chooseByLabel(tag, タグ名);
    } else {
      await chooseByLabel(type, "ピックアップ商品");
    }
  }
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), page.locator("#ex-conversion-action button[type=submit]").click({ timeout: 20_000 })]);
  for (const w of await expectSaved(page, `${what}: 支店トップページ管理の登録`)) onIssue(w);
}

/** 商品規格登録編集で、高額商品コードを入れ、部門は先頭を選んで「商品規格を登録」する */
export async function 規格の高額商品コードを設定する(page: Page, 商品ID: string, 規格ID: string, コード: string, what: string, onIssue: (m: string) => void): Promise<void> {
  await page.goto(adminUrl(`/product/product/class/${商品ID}/edit/${規格ID}`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集`).toBeVisible();
  await form.locator("#admin_product_class_high_price_code").fill(コード, { timeout: 20_000 });
  const section = form.locator("#admin_product_class_Section");
  if (!(await section.inputValue())) {
    const first = await section.locator("option").evaluateAll((ns) => ns.map((n) => (n as HTMLOptionElement).value).find((x) => x !== ""));
    if (first) await section.selectOption(first);
  }
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), form.getByRole("button", { name: "商品規格を登録", exact: true }).click({ timeout: 20_000 })]);
  for (const w of await expectSaved(page, `${what}: 商品規格を登録`)) onIssue(w);
}

// ---- 商品規格の追加 ----
export type 追加する規格 = {
  言語: "日本語" | "英語"; 状態: "NM" | "SP" | "MP" | "HP"; 商品コード: string;
  基準価格: string; 販売価格: string; 買取価格: string; セール?: boolean;
};

/** 商品規格登録編集（新規）で規格を追加する。状態は選択肢の data-code で選ぶ。登録後の商品規格IDを返す */
export async function 規格を追加する(page: Page, 商品ID: string, v: 追加する規格, what: string, onIssue: (m: string) => void): Promise<string> {
  await page.goto(adminUrl(`/product/product/class/${商品ID}/new`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集画面（新規）`).toBeVisible();
  await chooseByLabel(form.locator("#admin_product_class_Language"), v.言語);
  const cond = form.locator("#admin_product_class_CardCondition");
  const value = await cond.locator(`option[data-code="${v.状態}"]`).getAttribute("value");
  if (!value) throw new Error(`${what}: 状態「${v.状態}」の選択肢が無い`);
  await cond.selectOption(value);
  await form.locator("#admin_product_class_code").fill(v.商品コード);
  await form.locator("#admin_product_class_standard_price").fill(v.基準価格);
  await form.locator("#admin_product_class_buy_price").fill(v.買取価格);
  if (v.セール) await form.locator("#admin_product_class_sale_flg").check({ timeout: 20_000 });
  await form.locator("#admin_product_class_price02").fill(v.販売価格);
  if (!(await form.locator("#admin_product_class_sale_type").inputValue())) throw new Error(`${what}: 販売種別が未選択（正本に指定が無く補えない）`);
  const section = form.locator("#admin_product_class_Section");
  if (!(await section.inputValue())) {
    const first = await section.locator("option").evaluateAll((ns) => ns.map((n) => (n as HTMLOptionElement).value).find((x) => x !== ""));
    if (first) await section.selectOption(first);
  }
  await chooseByLabel(form.locator("#admin_product_class_Status"), "公開");
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), form.getByRole("button", { name: "商品規格を登録", exact: true }).click({ timeout: 20_000 })]);
  for (const w of await expectSaved(page, `${what}: 商品規格を登録`)) onIssue(w);
  const m = new URL(page.url()).pathname.match(/\/class\/\d+\/edit\/(\d+)$/);
  if (!m) throw new Error(`${what}: 登録後に商品規格の編集画面へ移らない（${page.url()}）`);
  return m[1];
}

/** 商品規格登録編集（編集）を開き、「商品規格を削除」を確認つきで行う */
export async function 規格を削除する(page: Page, 商品ID: string, 規格ID: string, what: string, onIssue: (m: string) => void): Promise<void> {
  await page.goto(adminUrl(`/product/product/class/${商品ID}/edit/${規格ID}`));
  await page.waitForLoadState("load");
  await page.getByRole("link", { name: "商品規格を削除" }).click({ timeout: 20_000 });
  const modal = page.locator("#deleteConfirmModal");
  await expect(modal, `${what}: 削除の確認`).toBeVisible();
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), modal.locator('a[data-method="delete"]').click({ timeout: 20_000 })]);
  for (const w of await expectSaved(page, `${what}: 商品規格の削除`)) onIssue(w);
}

// ---- 2026-11-10 追加（残りのケースの部品） ----

/** 商品規格登録編集で、公開ステータス（表示対象＝公開／表示対象外＝非公開）を選び、部門は先頭を選んで「商品規格を登録」する */
export async function 規格の公開状態を設定する(page: Page, 商品ID: string, 規格ID: string, 状態: "公開" | "非公開", what: string, onIssue: (m: string) => void): Promise<void> {
  await page.goto(adminUrl(`/product/product/class/${商品ID}/edit/${規格ID}`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集`).toBeVisible();
  await chooseByLabel(form.locator("#admin_product_class_Status"), 状態);
  const section = form.locator("#admin_product_class_Section");
  if (!(await section.inputValue())) {
    const first = await section.locator("option").evaluateAll((ns) => ns.map((n) => (n as HTMLOptionElement).value).find((x) => x !== ""));
    if (first) await section.selectOption(first);
  }
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), form.getByRole("button", { name: "商品規格を登録", exact: true }).click({ timeout: 20_000 })]);
  for (const w of await expectSaved(page, `${what}: 商品規格を登録`)) onIssue(w);
}

/**
 * 商品登録編集の「カード指定 >」で、カード検索をカード名を空にして流し、結果に出た既存のカード詳細のうち、
 * Foil の印（[Foil]）の有無が求めるものの先頭を「決定」して、商品名を指定の名前に入力し直し、割引率は先頭を選んで「商品を登録」する。
 * カードのマスタは書き換えない（既存のカードを商品に紐づけるだけ）。選んだカードの表示（ID と名前）を返す。
 */
export async function 既存のカードを指定する(page: Page, 商品ID: string, v: { Foil: boolean; 商品名: string }, what: string, onIssue: (m: string) => void): Promise<string> {
  await page.goto(adminUrl(`/product/product/${商品ID}/edit`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  const open = page.locator('button[data-bs-target="#searchCardDetailModal"]');
  await expect(open, `${what}: 「カード指定 >」を押せる`).toBeEnabled({ timeout: 30_000 });
  await open.click();
  const modal = page.locator("#searchCardDetailModal");
  await expect(modal, `${what}: カード検索`).toBeVisible();
  await modal.locator("#admin_search_card_detail_card_name").fill("");
  await modal.locator("#searchCardDetailModalButton").click();
  const rows = modal.locator("#searchCardDetailModalList tbody tr");
  let chosen = "";
  for (let p = 1; p <= 15 && !chosen; p++) {
    await expect(rows.first(), `${what}: カード検索の結果（${p}ページ目）`).toBeVisible({ timeout: 60_000 });
    const texts = await rows.evaluateAll((ns) => ns.map((n) => ({ id: (n.querySelector("td")?.textContent ?? "").trim(), card: (n.querySelectorAll("td")[2]?.textContent ?? "").replace(/\s+/g, " ").trim() })));
    const hit = texts.findIndex((t) => t.card.startsWith("[Foil]") === v.Foil);
    if (hit >= 0) {
      chosen = `カード詳細ID ${texts[hit].id}「${texts[hit].card}」`;
      await rows.nth(hit).getByRole("button", { name: "決定", exact: true }).click();
      break;
    }
    const next = modal.locator("#card_detail_pagination a").filter({ hasText: new RegExp(`^\\s*${p + 1}\\s*$`) }).first();
    if ((await next.count()) === 0) break;
    const firstId = texts[0]?.id ?? "";
    await next.click();
    await expect.poll(async () => (await rows.first().locator("td").first().textContent())?.trim() ?? "", { timeout: 60_000 }).not.toBe(firstId);
  }
  if (!chosen) throw new Error(`${what}: カード検索の結果に、Foil の印が${v.Foil ? "ある" : "無い"}カード詳細が見つからない（15ページまで）`);
  await expect(modal, `${what}: カードを決定するとカード検索が閉じる`).toBeHidden({ timeout: 30_000 });
  for (const name of ['input[name="admin_product[name]"]', 'input[name="admin_product[name_en]"]']) {
    const field = form.locator(name);
    if ((await field.inputValue()) !== v.商品名) await field.fill(v.商品名);
  }
  const discount = form.locator('select[name="admin_product[Discount]"]');
  if (!(await discount.inputValue())) {
    const first = await discount.locator("option").evaluateAll((ns) => ns.map((n) => (n as HTMLOptionElement).value).find((x) => x !== ""));
    if (first) await discount.selectOption(first);
  }
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), form.locator("button[type=submit]").filter({ hasText: /^\s*商品を登録\s*$/ }).click({ timeout: 20_000 })]);
  for (const w of await expectSaved(page, `${what}: カードを指定して商品を登録`)) onIssue(w);
  onIssue(`${what}: 既存の${chosen}を商品に指定した（カードのマスタは書き換えていない。商品名はシード表の名前に入力し直した）`);
  return chosen;
}

export type タイル行 = { 属性: "ピックアップ商品" | "その他"; タグ?: string };
/**
 * コンテンツ管理＞支店トップページ管理で、支店を選び、「支店共通設定を適用」を外し、バナー画像（渡さなければ任意の小さな画像）・バナーリンクタグ（渡したとき）を選び、
 * タイル4行（上段右・中段左・中段右・下段左）を指定どおりにして登録する。
 */
export async function 支店トップページを設定する(page: Page, 支店名: string, v: { 画像?: { name: string; mimeType: string; buffer: Buffer }; バナーリンクタグ?: string; タイル: タイル行[] }, what: string, onIssue: (m: string) => void): Promise<void> {
  if (v.タイル.length !== 4) throw new Error(`${what}: タイルの行は4つ指定する`);
  await page.goto(adminUrl("/content/branch_toppage"));
  await page.waitForLoadState("load");
  const selector = page.locator('select[name="branch_toppage_management[branch_list]"]');
  await expect(selector, `${what}: 支店トップページ管理の支店の選択`).toBeVisible();
  const value = await selector.locator("option").evaluateAll((os, name) => (os as HTMLOptionElement[]).find((o) => (o.textContent ?? "").trim() === name)?.value ?? "", 支店名);
  if (!value) throw new Error(`${what}: 支店トップページ管理の支店の選択に「${支店名}」が無い`);
  if ((await selector.inputValue()) !== value) await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), selector.selectOption(value)]);
  await expect(page.locator('select[name="branch_toppage_management[branch_list]"]'), `${what}: 選んだ支店`).toHaveValue(value);
  const common = page.locator("#common-setting");
  if (await common.isChecked()) await common.uncheck({ timeout: 20_000 });
  await page.locator("#branch_toppage_management_image_file").setInputFiles(v.画像 ?? { name: "branch-banner.png", mimeType: "image/png", buffer: 小さな画像 }, { timeout: 20_000 });
  if (v.バナーリンクタグ) await chooseByLabel(page.locator("#branch_toppage_management_banner_image_tag"), v.バナーリンクタグ);
  const rows = page.locator("#tiles .tile-config");
  await expect(rows, `${what}: タイルの行（4区画）`).toHaveCount(4);
  for (let i = 0; i < 4; i++) {
    await rows.nth(i).locator('select[id$="_section"]').selectOption(String(i + 1), { timeout: 20_000 });
    await chooseByLabel(rows.nth(i).locator('select[id$="_tileType"]'), v.タイル[i].属性);
    const tag = v.タイル[i].タグ;
    if (tag) await chooseByLabel(rows.nth(i).locator('select[id$="_tag"]'), tag);
  }
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), page.locator("#ex-conversion-action button[type=submit]").click({ timeout: 20_000 })]);
  for (const w of await expectSaved(page, `${what}: 支店トップページ管理の登録`)) onIssue(w);
}

/**
 * コンテンツ管理＞ページ管理で「支店トップページ」のページを開いてPCのレイアウトを読み、そのレイアウト管理(編集)画面で、
 * 未使用ブロック以外の置き場に置かれているブロックの名前を返す（読むだけ。登録しない）。
 */
export async function 支店トップページのレイアウトのブロック(page: Page, what: string): Promise<{ レイアウト: string; ブロック: string[] }> {
  await page.goto(adminUrl("/content/page"));
  await page.waitForLoadState("load");
  const link = page.getByRole("link", { name: "支店トップページ", exact: true });
  await expect(link, `${what}: ページ管理の「支店トップページ」`).toHaveCount(1, { timeout: 30_000 });
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), link.click()]);
  const pc = page.locator('select[name="main_edit[PcLayout]"]');
  await expect(pc, `${what}: ページ管理(編集)のPCのレイアウト`).toHaveCount(1, { timeout: 30_000 });
  const layoutId = await pc.inputValue();
  const layoutName = ((await pc.locator("option:checked").textContent()) ?? "").trim();
  if (!layoutId) throw new Error(`${what}: 支店トップページにPCのレイアウトが割り当てられていない`);
  await page.goto(adminUrl(`/content/layout/${layoutId}/edit`), { waitUntil: "load", timeout: 60_000 });
  await expect(page.locator("#position_0"), `${what}: レイアウト管理(編集)の未使用ブロック`).toBeAttached({ timeout: 30_000 });
  const names = await page.locator('[id^="position_"]:not(#position_0) > [id^="detail_box__layout_item--"] .view_readme').allInnerTexts();
  return { レイアウト: `${layoutName}（ID ${layoutId}）`, ブロック: names.map((t) => t.trim()) };
}
