/**
 * M04-13 在庫分割結合登録編集の画面操作。セレクタはここにだけ書く。
 * - 在庫検索一覧からの「在庫分割登録」「在庫結合登録」
 * - 在庫分割: 新規登録画面・分割先登録画面（編集）・分割承認画面
 * - 在庫結合: 新規登録画面・結合元登録画面（編集）・結合計画承認申請画面（欠品入力）・結合計画承認画面
 * - 在庫分割結合検索一覧
 * 画面の作りは、アプリの在庫の分割・結合・在庫分割結合一覧の画面のテンプレートと、それぞれの画面のスクリプトで確かめた。
 */
import { Download, ElementHandle, expect, Locator, Page, Response, test } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel } from "./common";
import { searchStockList, stockRow, 在庫区分, 試験店舗A } from "./m04_13_setup";

const pathOf = (url: string) => new URL(url).pathname;
export const splitNewPathRe = /\/product\/stock\/(\d+)\/split\/new$/;
export const joinNewPathRe = /\/product\/stock\/(\d+)\/join\/new$/;
export const splitEditPath = (id: string) => pathOf(adminUrl(`/product/stock/split/${id}/edit`));
export const splitApprovalPath = (id: string) => pathOf(adminUrl(`/product/stock/split/${id}/approval`));
export const joinEditPath = (id: string) => pathOf(adminUrl(`/product/stock/join/${id}/edit`));
export const joinShortagePath = (id: string) => pathOf(adminUrl(`/product/stock/join/${id}/shortage-entry`));
export const joinApprovalPath = (id: string) => pathOf(adminUrl(`/product/stock/join/${id}/approval`));
export const stockListPath = pathOf(adminUrl("/product/stock"));
export const splitJoinListPath = pathOf(adminUrl("/product/stock/split-join"));

/** 「-」の表示。画面は「—」（全角に近い横線）を出す。どちらも未設定の印として扱う */
export const DASHES = ["-", "—", "－", "‐", "―"];

/** ブラウザの入力チェックで送信が止まったか、送信して応答を得たか */
export type SubmitResult = { sent: true; status: number } | { sent: false; 止めた項目: string[] };

/** ブラウザの入力チェックが止めた理由（入力欄の状態）を、業務の言葉で言う */
const 入力チェックの理由: [string, string][] = [
  ["valueMissing", "入力が空（必須）"], ["badInput", "数として読めない"], ["typeMismatch", "形式が違う"], ["patternMismatch", "決まった形に合わない"],
  ["tooLong", "長すぎる"], ["tooShort", "短すぎる"], ["rangeUnderflow", "最小値より小さい"], ["rangeOverflow", "最大値より大きい"], ["stepMismatch", "刻みに合わない"],
];

/**
 * 押すと送信されるボタンについて、ブラウザの入力チェックで止まるかを先に調べ、止まるならボタンを押して送信されないことを確かめる。
 * 止めた項目は、呼ぶ側が渡す業務の名前（「分割数」など）か、欄のラベルの文字で書く（注記・エラー文に欄の内部の名前を出さない）。
 */
async function submitWithValidity(page: Page, form: Locator, button: Locator, waitNav: boolean, 項目: Record<string, Locator>): Promise<SubmitResult> {
  const known: [string, ElementHandle][] = [];
  for (const [名前, l] of Object.entries(項目)) {
    if ((await l.count()) === 1) known.push([名前, await l.elementHandle()]);
  }
  const blocked = await form.evaluate((f, a) => Array.from((f as HTMLFormElement).elements)
    .filter((e) => "checkValidity" in e && !(e as HTMLInputElement).checkValidity())
    .map((e) => {
      const el = e as HTMLInputElement;
      const hit = a.known.find(([, h]) => h === el);
      const label = hit ? hit[0] : ((el.labels?.[0]?.textContent ?? "").replace(/\s+/g, " ").trim() || "（画面に項目名の無い欄）");
      const validity = el.validity as unknown as Record<string, boolean>;
      const why = a.reasons.filter(([k]) => validity[k]).map(([, v]) => v);
      return `${label}: ${why.join("・") || "入力チェックに合わない"}`;
    }), { known, reasons: 入力チェックの理由 });
  for (const [, h] of known) await h.dispose();
  if (blocked.length) {
    const sent = page.waitForRequest((r) => r.method() === "POST", { timeout: 3_000 }).then(() => true, () => false);
    await button.click();
    if (await sent) throw new Error(`ブラウザの入力チェックで止まるはずの送信が送られた（${blocked.join(" / ")}）`);
    return { sent: false, 止めた項目: blocked };
  }
  const response = page.waitForResponse((r) => r.request().method() === "POST" && r.request().frame() === page.mainFrame() && r.request().isNavigationRequest());
  if (waitNav) {
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), button.click()]);
  } else {
    await button.click();
  }
  return { sent: true, status: (await response).status() };
}

/** 見出しの文字（「必須」の印を除く）で、表の各行を「見出し→値」にする。入力欄は値、選択欄は選んだ選択肢の文字を読む */
export async function tableRecords(table: Locator): Promise<Record<string, string>[]> {
  if ((await table.count()) === 0) return [];
  return table.first().evaluate((t) => {
    const clean = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
    const headRows = t.querySelectorAll("thead tr");
    const heads = Array.from(headRows[headRows.length - 1]?.querySelectorAll("th") ?? [])
      .map((th) => clean(Array.from(th.childNodes).filter((n) => !(n instanceof HTMLElement && n.classList.contains("badge"))).map((n) => n.textContent).join(" ")));
    return Array.from(t.querySelectorAll("tbody tr")).map((tr) => {
      const tds = Array.from(tr.querySelectorAll("td"));
      const rec: Record<string, string> = {};
      heads.forEach((h, i) => {
        const td = tds[i];
        if (!td) return;
        const control = td.querySelector("input:not([type=hidden]), select") as HTMLInputElement | HTMLSelectElement | null;
        if (control instanceof HTMLSelectElement) rec[h] = clean(control.options[control.selectedIndex]?.textContent);
        else if (control) rec[h] = (control as HTMLInputElement).value;
        else rec[h] = clean(td.textContent);
      });
      return rec;
    });
  });
}

/** カードの見出し（太字の題）でカードを引く */
export function card(page: Page, title: string): Locator {
  return page.locator(".card").filter({ has: page.locator(".card-header span.fw-bold", { hasText: new RegExp(`^\\s*${title}\\s*$`) }) });
}

/** 「基本情報」のカードの「項目名→値」 */
export async function basicInfo(page: Page): Promise<Record<string, string>> {
  const c = card(page, "基本情報").first();
  await expect(c, "基本情報のカード").toBeVisible();
  return c.locator("span.text-muted").evaluateAll((spans) => Object.fromEntries(spans.map((s) => [
    (s.textContent ?? "").replace(/\s+/g, " ").trim(),
    ((s.nextElementSibling as HTMLElement | null)?.textContent ?? "").replace(/\s+/g, " ").trim(),
  ])));
}

/** 画面上部のメッセージ（開発用の帯を除く） */
export async function alerts(page: Page): Promise<string[]> {
  return (await page.locator(".alert").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim())
    .filter((t) => t && !t.includes("デバッグモードが有効"));
}

/** ステータス変更履歴のカードの行（更新日・ステータス・更新者） */
export async function statusHistoryRows(page: Page): Promise<Record<string, string>[]> {
  return tableRecords(card(page, "ステータス変更履歴").first().locator("table"));
}

/**
 * 結合の画面の見分け。アドレスと画面の題名の両方が合うときだけ、その画面とみなす。
 * 結合元登録画面と結合計画承認申請画面は同じひな形で、題名だけが違う（アプリのソースの結合の画面の処理と、日本語の文言の定義）。
 */
const 結合の画面の見分け: { 名前: string; パス: RegExp; 題名: string }[] = [
  { 名前: "在庫結合新規登録画面", パス: /\/product\/stock\/\d+\/join\/new$/, 題名: "在庫結合 新規登録" },
  { 名前: "結合元登録画面", パス: /\/product\/stock\/join\/(\d+)\/edit(\/\d+)?$/, 題名: "在庫結合 編集" },
  { 名前: "結合計画承認申請画面", パス: /\/product\/stock\/join\/(\d+)\/shortage-entry(\/\d+)?$/, 題名: "在庫結合 欠品入力" },
  { 名前: "結合計画承認画面", パス: /\/product\/stock\/join\/(\d+)\/approval$/, 題名: "在庫結合 承認" },
];

/** いま開いている結合の画面の業務の名前と、その画面の在庫分割結合ID。どれにも当たらなければ名前は null（題名は注記用） */
export async function 今の結合の画面(page: Page): Promise<{ 名前: string | null; 番号: string | null; 題名: string }> {
  await page.waitForLoadState("load");
  const 題名 = ((await page.locator("h2.c-pageTitle__title").first().textContent({ timeout: 10_000 }).catch(() => null)) ?? "").replace(/\s+/g, " ").trim();
  const path = pathOf(page.url());
  for (const s of 結合の画面の見分け) {
    const m = s.パス.exec(path);
    if (m && 題名 === s.題名) return { 名前: s.名前, 番号: m[1] ?? null, 題名 };
  }
  return { 名前: null, 番号: null, 題名 };
}

/** 承認通知先の「所属」と「承認通知先メンバー」（select2）を選ぶ */
async function chooseApprovalTargets(page: Page, deptSelect: Locator, members: Locator, dept: string | null, member: string | null): Promise<void> {
  if (dept !== null) await chooseByLabel(deptSelect, dept);
  if (member === null) return;
  const id = await members.getAttribute("id");
  await page.locator(`#${id} + span.select2 .select2-selection`).click();
  const option = page.locator(".select2-container--open .select2-results__option").filter({ hasText: new RegExp(`^\\s*${member}\\s*$`) });
  await expect(option, `承認通知先メンバーの候補「${member}」`).toHaveCount(1);
  await option.click();
  await page.keyboard.press("Escape");
  const chosen = await members.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.textContent?.trim() ?? ""));
  expect(chosen, "承認通知先に選んだメンバー").toEqual([member]);
}

/** M04-13 の商品は、すべてグッズ商品CSV登録で最上位の「サプライ・グッズ」のカテゴリに作る（seeds/m04-13.ts の作り方の型） */
const 商品のカテゴリ = "サプライ・グッズ";

/** 商品検索のモーダル（在庫選択・商品検索）。商品コードで検索し、コードの規格を選んで「決定」を押す */
class ProductPickModal {
  constructor(readonly page: Page, readonly modal: Locator, readonly searchButtonId: string, readonly listId: string) {}

  /**
   * カテゴリの選択欄を決める。「指定なし」の選択肢（値が空）があればそれを選ぶ（商品コードだけで検索する）。
   * 無ければ（いまの画面は、選択欄に「指定なし」が無く、先頭のカテゴリが選ばれていて、そのカテゴリで絞り込まれる）、
   * 商品のカテゴリ（最上位の「サプライ・グッズ」）を選び、手順の注記に残す（設計書はカテゴリを必須にしておらず、初期値も無い）。
   */
  private async chooseCategory(): Promise<void> {
    const select = this.modal.locator("#admin_search_product_category_id");
    await expect(select, "商品検索のモーダルのカテゴリの選択欄").toHaveCount(1);
    const v = await select.evaluate((s, name) => {
      const el = s as HTMLSelectElement;
      const options = Array.from(el.options);
      return {
        current: el.value,
        initial: el.selectedIndex >= 0 ? (el.options[el.selectedIndex].textContent ?? "").trim() : "",
        blank: options.some((o) => o.value === ""),
        values: options.filter((o) => o.textContent === name).map((o) => o.value),
      };
    }, 商品のカテゴリ);
    if (v.blank) {
      await select.selectOption("");
      return;
    }
    if (v.values.length !== 1) throw new Error(`商品検索のモーダルのカテゴリに、最上位の「${商品のカテゴリ}」の選択肢が1つではない（${v.values.length}個）`);
    // 同じ画面で2回目の検索のときは、前に選んだカテゴリが残っている
    if (v.current === v.values[0]) return;
    await select.selectOption(v.values[0]);
    const description = `在庫選択（商品検索）のモーダルのカテゴリの選択欄には「指定なし」の選択肢が無く、初期は先頭のカテゴリ「${v.initial}」が選ばれていて、`
      + `そのままでは商品コードで検索しても対象の商品が出ない（設計書はカテゴリを必須にしておらず、初期値も無い）。商品を探すため、商品のカテゴリ「${商品のカテゴリ}」を選んでから検索した`
      + "（シードの操作と手順の操作の両方）。これは正本の手順に無い操作の補いで、認めるかは依頼者の判断待ち（記録の裁定案7）。"
      + "期待結果がこの検索の結果（一覧への追加・画面の表示）を見るケースは、判断が出るまで合否を確定しない";
    const notes = test.info().annotations;
    if (!notes.some((a) => a.type === "手順の注記" && a.description === description)) notes.push({ type: "手順の注記", description });
  }

  async search(code: string): Promise<void> {
    await expect(this.modal, "商品検索のモーダル").toBeVisible();
    await this.chooseCategory();
    await this.modal.locator("#admin_search_product_id").fill(code);
    const res = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/search\/product/.test(r.url()));
    await this.modal.locator(`#${this.searchButtonId}`).click();
    await res;
    await expect(this.modal.locator(`#${this.listId}`), "商品検索の結果").not.toBeEmpty();
  }

  /**
   * 商品コードで検索する。結果が0件でもよい（未登録の商品コードの確かめ）。
   * 検索の要求の応答が正常で、結果の表が画面に入ったこと（検索の失敗の表示が無いこと）までを確かめる。失敗は握りつぶさない。
   */
  async searchAllowingNone(code: string): Promise<void> {
    await expect(this.modal, "商品検索のモーダル").toBeVisible();
    await this.chooseCategory();
    await this.modal.locator("#admin_search_product_id").fill(code);
    const res = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/search\/product/.test(r.url()));
    // 画面は検索ボタンを押したときに結果の欄を空にしてから要求を送る（前の結果の表が残って見えることはない）
    await this.modal.locator(`#${this.searchButtonId}`).click();
    const r = await res;
    expect(r.status(), "商品検索の要求の応答").toBe(200);
    await expect(this.modal.locator(`#${this.listId} table`).first(), "商品検索の結果の表").toBeAttached();
    await expect(this.modal.locator(`#${this.listId} p.text-danger`), "商品検索の失敗の表示が無い").toHaveCount(0);
  }

  /** 結果の中で、商品コードの規格を持つ行 */
  row(code: string): Locator {
    return this.modal.locator(`#${this.listId} tr`).filter({ has: this.page.locator(`select[name*="product_class"] option[data-product-code="${code}"]`) });
  }

  /** 結果の行の、規格の選択欄で商品コードの規格を選ぶ */
  async select(code: string): Promise<void> {
    const row = this.row(code);
    await expect(row, `商品検索の結果に、商品コード ${code} の行が1件`).toHaveCount(1);
    const select = row.locator('select[name*="product_class"]');
    const value = await select.locator(`option[data-product-code="${code}"]`).getAttribute("value");
    if (!value) throw new Error(`商品コード ${code} の規格の選択肢に値が無い`);
    await select.selectOption(value);
  }

  /**
   * 選んだ行の「決定」を押す。画面は追加の要求を送り、そのあと編集画面を読み込み直す。
   * いまの画面と同じアドレスへ移るので、アドレスの一致ではなく、次の画面の読み込みを待つ。
   */
  async decide(code: string, landPath: string): Promise<void> {
    const row = this.row(code);
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load" }),
      row.locator("button.add-order-item").click(),
    ]);
    expect(new URL(this.page.url()).pathname, "決定のあとの画面").toBe(landPath);
  }

  /** 商品コードの結果の行の数（未登録の商品コードの確かめ） */
  async resultCount(code: string): Promise<number> {
    return this.row(code).count();
  }
}

// ---------------------------------------------------------------- 在庫検索一覧

/** 在庫検索一覧の行を選び、「在庫分割登録」または「在庫結合登録」を押す。出た警告（alert）の文を返す */
export async function pressStockListAction(page: Page, code: string, zone: 在庫区分, action: "在庫分割登録" | "在庫結合登録"): Promise<string[]> {
  const row = stockRow(page, code, 試験店舗A, zone);
  await expect(row, `在庫検索一覧の ${code}（${zone}）の行が1件`).toHaveCount(1);
  await row.locator('input[name="productStockIds[]"]').check();
  const button = page.locator(action === "在庫分割登録" ? "#stockSplitBtn" : "#stockJoinBtn");
  await expect(button, `「${action}」ボタン`).toBeEnabled();
  const dialogs: string[] = [];
  const onDialog = (d: import("@playwright/test").Dialog) => { dialogs.push(d.message()); void d.dismiss(); };
  page.on("dialog", onDialog);
  try {
    const re = action === "在庫分割登録" ? splitNewPathRe : joinNewPathRe;
    await Promise.all([page.waitForURL((u) => re.test(u.pathname), { waitUntil: "load", timeout: 15_000 }), button.click()]);
  } catch (e) {
    if (dialogs.length) throw new Error(`「${action}」を押すと警告が出て遷移しない: ${dialogs.join(" / ")}`);
    throw e;
  } finally {
    page.off("dialog", onDialog);
  }
  return dialogs;
}

/** 在庫検索一覧で店舗を試験店舗A（M04-13）・在庫区分・商品コードで検索し、行を選んで「在庫分割登録」を押す */
export async function openSplitNew(page: Page, code: string, zone: 在庫区分 = "EC-CUBE"): Promise<SplitNewPage> {
  await searchStockList(page, { store: 試験店舗A, zone, code });
  await pressStockListAction(page, code, zone, "在庫分割登録");
  return new SplitNewPage(page);
}

/** 在庫検索一覧で店舗を試験店舗A（M04-13）・EC-CUBE・商品コードで検索し、行を選んで「在庫結合登録」を押す */
export async function openJoinNew(page: Page, code: string, zone: 在庫区分 = "EC-CUBE"): Promise<JoinNewPage> {
  await searchStockList(page, { store: 試験店舗A, zone, code });
  await pressStockListAction(page, code, zone, "在庫結合登録");
  return new JoinNewPage(page);
}

/** 在庫検索一覧の検索欄の、いまの状態（店舗・在庫区分・商品コード）と、商品コードの行の選択状態 */
export async function stockListState(page: Page, code: string, zone: 在庫区分): Promise<{ 店舗: string[]; 在庫区分: string[]; 商品コード: string; 選択: boolean | null }> {
  const form = page.locator("form#searchStockListForm");
  await expect(form, "在庫検索一覧の検索欄").toBeVisible();
  const 店舗 = await form.locator("#admin_search_stock_list_base_info").evaluate((n) =>
    Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.textContent?.trim() ?? ""));
  const zones = await form.locator('input[name="admin_search_stock_list[stock_zone][]"]').evaluateAll((inputs) => inputs
    .filter((i) => (i as HTMLInputElement).checked)
    .map((i) => (i as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? ""));
  const 商品コード = await form.locator("#admin_search_stock_list_product_code").inputValue();
  const row = stockRow(page, code, 試験店舗A, zone);
  const 選択 = (await row.count()) === 1 ? await row.locator('input[name="productStockIds[]"]').isChecked() : null;
  return { 店舗, 在庫区分: zones, 商品コード, 選択 };
}

// ---------------------------------------------------------------- 在庫分割

export class SplitNewPage {
  readonly 分割数: Locator;
  readonly メモ: Locator;
  readonly 登録ボタン: Locator;
  readonly 在庫一覧リンク: Locator;

  constructor(readonly page: Page) {
    this.分割数 = page.locator("#split-source-stock-input");
    this.メモ = page.locator('textarea[name="admin_stock_split_new[split_join_memo]"]');
    this.登録ボタン = page.locator('button[type="submit"][form="form-split-register"]');
    this.在庫一覧リンク = page.locator(".c-conversionArea a.c-baseLink");
  }

  /** 分割元商品の表の1行（見出し→値） */
  async source(): Promise<Record<string, string>> {
    const rows = await tableRecords(card(this.page, "分割元商品").first().locator("table"));
    if (rows.length !== 1) throw new Error(`分割元商品の行が1行ではない（${rows.length}行）`);
    return rows[0];
  }

  async pressRegister(): Promise<SubmitResult> {
    return submitWithValidity(this.page, this.page.locator("form#form-split-register"), this.登録ボタン, true, { 分割数: this.分割数, メモ: this.メモ });
  }

  /** 分割数（とメモ）を入れて登録し、分割先登録画面へ移ったことを確かめて、在庫分割結合IDを返す */
  async register(quantity: string, memo: string | null, what: string): Promise<string> {
    await this.分割数.fill(quantity);
    if (memo !== null) await this.メモ.fill(memo);
    const r = await this.pressRegister();
    if (!r.sent) throw new Error(`${what}: ブラウザの入力チェックで送信が止まった（${r.止めた項目.join(" / ")}）`);
    const m = /\/product\/stock\/split\/(\d+)\/edit$/.exec(pathOf(this.page.url()));
    if (!m) throw new Error(`${what}: 登録後に分割先登録画面へ移らない（${this.page.url()}／${(await alerts(this.page)).join(" / ")}）`);
    return m[1];
  }

  async pressBackToStockList(): Promise<void> {
    await expect(this.在庫一覧リンク, "在庫一覧リンク").toBeVisible();
    await Promise.all([this.page.waitForURL((u) => u.pathname === stockListPath, { waitUntil: "load" }), this.在庫一覧リンク.click()]);
  }
}

export class SplitEditPage {
  readonly modal: ProductPickModal;
  readonly 分割先登録ボタン: Locator;
  readonly CSV登録ボタン: Locator;
  readonly 承認申請ボタン: Locator;
  readonly 承認申請モーダル: Locator;
  readonly メモ: Locator;
  readonly 所属: Locator;
  readonly 承認通知先メンバー: Locator;
  readonly 一覧リンク: Locator;
  readonly csvModal: Locator;

  constructor(readonly page: Page, readonly id: string) {
    this.modal = new ProductPickModal(page, page.locator("#splitSearchProductModal"), "splitSearchProductModalButton", "splitSearchProductModalList");
    this.分割先登録ボタン = page.locator('button[data-bs-target="#splitSearchProductModal"]');
    this.CSV登録ボタン = page.locator('button[data-bs-target="#splitEditDestinationCsvModal"]');
    this.承認申請ボタン = page.locator('.c-conversionArea button[data-bs-target="#splitEditConfirmApprovalModal"]');
    this.承認申請モーダル = page.locator("#splitEditConfirmApprovalModal");
    this.メモ = page.locator("#admin_stock_split_join_split_join_memo");
    this.所属 = page.locator("select.js-split-approval-dept");
    this.承認通知先メンバー = page.locator("select.js-split-approval-members");
    this.一覧リンク = page.locator(".c-conversionArea a.c-baseLink");
    this.csvModal = page.locator("#splitEditDestinationCsvModal");
  }

  async open(): Promise<void> {
    await this.page.goto(adminUrl(`/product/stock/split/${this.id}/edit`));
    await this.ready();
  }

  async ready(): Promise<void> {
    await expect(this.page, "分割先登録画面").toHaveURL((u) => u.pathname === splitEditPath(this.id));
    await this.page.waitForLoadState("load");
    await expect(card(this.page, "基本情報").first(), "分割先登録画面の基本情報").toBeVisible();
  }

  /** 「分割先を登録」（分割先商品追加ボタン）を押して、在庫選択のモーダルを開く */
  async pressAddDestination(): Promise<void> {
    await expect(this.分割先登録ボタン, "分割先商品追加ボタン").toBeVisible();
    await this.分割先登録ボタン.click();
    await expect(this.modal.modal, "在庫選択のモーダル").toBeVisible();
  }

  async searchAndSelect(code: string): Promise<void> {
    await this.modal.search(code);
    await this.modal.select(code);
  }

  async decide(code: string): Promise<void> {
    await this.modal.decide(code, splitEditPath(this.id));
    await this.ready();
  }

  /** 分割先商品を1件追加する（モーダルを開く→商品コードで検索して選ぶ→決定） */
  async addDestination(code: string): Promise<void> {
    await this.pressAddDestination();
    await this.searchAndSelect(code);
    await this.decide(code);
  }

  destTable(): Locator {
    return this.page.locator(".js-split-destination-stock-container table");
  }

  async destinations(): Promise<Record<string, string>[]> {
    return tableRecords(this.destTable());
  }

  destRow(code: string): Locator {
    return this.page.locator("tr.js-split-dest-row").filter({ has: this.page.locator("td:nth-child(2)", { hasText: new RegExp(`^\\s*${code}\\s*$`) }) });
  }

  /**
   * 分割先在庫数に入れてフォーカスを外す。値が変わったときは、画面が数量の保存の要求を送るので、その応答を待つ。
   * 画面が警告（alert）を出したら、その文を返す。
   */
  async setDestinationQuantity(code: string, value: string): Promise<{ status: number | null; body: unknown; dialogs: string[] }> {
    const input = this.destRow(code).locator("input.js-split-dest-qty");
    await expect(input, `${code} の分割先在庫数`).toHaveCount(1);
    const dialogs: string[] = [];
    const onDialog = (d: import("@playwright/test").Dialog) => { dialogs.push(d.message()); void d.accept(); };
    this.page.on("dialog", onDialog);
    try {
      const before = await input.inputValue();
      const res = before === value ? null : this.page.waitForResponse((r) => r.request().method() === "POST" && /\/destination\/\d+\/update-quantity$/.test(r.url()), { timeout: 15_000 });
      await input.fill(value);
      await input.press("Tab");
      if (!res) return { status: null, body: null, dialogs };
      const r = await res;
      const body = await r.json().catch(() => null);
      await this.page.waitForTimeout(300);
      return { status: r.status(), body, dialogs };
    } finally {
      this.page.off("dialog", onDialog);
    }
  }

  /** 分割先の行の「削除」を押して、確認のモーダルを出す */
  async pressDelete(code: string): Promise<void> {
    await this.destRow(code).locator("button.js-stock-delete-detail").click();
    await expect(this.page.locator("#splitEditDeleteConfirmModal"), "分割先削除の確認モーダル").toBeVisible();
  }

  /** 確認モーダルの「削除」を押す（画面は削除の要求を送り、分割先登録画面へ戻る） */
  async confirmDelete(): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load" }),
      this.page.locator("#splitEditDeleteConfirmModal .js-stock-delete-confirm").click(),
    ]);
  }

  async chooseApprovalTargets(dept: string | null, member: string | null): Promise<void> {
    await chooseApprovalTargets(this.page, this.所属, this.承認通知先メンバー, dept, member);
  }

  /** フッターの「承認申請」を押して確認のモーダルを出す。ボタンが無い（分割先が0件）ときは false */
  async pressApplyApproval(): Promise<boolean> {
    if ((await this.承認申請ボタン.count()) === 0) return false;
    await this.承認申請ボタン.click();
    await expect(this.承認申請モーダル, "承認申請の確認モーダル").toBeVisible();
    return true;
  }

  /** 確認のモーダルの「承認申請」を押す（申請の送信と、移った画面の読み込みを待つ） */
  async confirmApplyApproval(): Promise<Response | null> {
    const res = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/split\/apply-approval$/.test(r.url()));
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.承認申請モーダル.locator(".js-stock-apply-approval-submit").click()]);
    return res;
  }

  async openCsvModal(): Promise<void> {
    await expect(this.CSV登録ボタン, "分割先商品CSV登録ボタン").toBeVisible();
    await this.CSV登録ボタン.click();
    await expect(this.csvModal, "分割先商品CSV登録のモーダル").toBeVisible();
  }

  async chooseCsv(name: string, content: Buffer): Promise<void> {
    await this.csvModal.locator("#split-edit-destination-csv-file").setInputFiles({ name, mimeType: "text/csv", buffer: content });
  }

  /**
   * 「分割先商品を登録」（商品登録ボタン）を押す。応答の内容を返す。
   * 取込に成功すると、画面は分割先登録画面を読み込み直して、分割先商品一覧に表示する（設計書 0202 分割 3-2）。
   * 成功の応答なのに画面が読み込み直されないときは、ここで落とす（ケースの側で開き直して一覧を読むことはしない）。
   * 取込が拒まれたときは画面は移らず、モーダルにエラーを出す（一覧は押す前のまま）。
   */
  async pressCsvRegister(): Promise<{ ok: boolean; errors: string[] }> {
    const res = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/edit-destination-csv-upload$/.test(r.url()), { timeout: 120_000 });
    const nav = this.page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }).then(() => true, () => false);
    await this.csvModal.locator("#btn-split-edit-destination-csv-submit").click();
    const body = (await (await res).json().catch(() => ({}))) as { ok?: boolean; errors?: string[] };
    if (body.ok) {
      if (!(await nav)) throw new Error("分割先商品CSVの取込は成功の応答だったが、画面が読み込み直されず、分割先商品一覧が更新されない");
      await this.ready();
    }
    return { ok: body.ok === true, errors: body.errors ?? [] };
  }

  /** 分割先商品CSV登録のモーダルを、右上の閉じるボタンで閉じる（開いていなければ何もしない） */
  async closeCsvModalIfOpen(): Promise<void> {
    if (!(await this.csvModal.isVisible())) return;
    await this.csvModal.locator(".modal-header .btn-close").click();
    await expect(this.csvModal, "分割先商品CSV登録のモーダルが閉じる").toBeHidden();
  }

  /** モーダルに出たエラーの文（改行で区切った行） */
  async csvErrors(): Promise<string[]> {
    const el = this.csvModal.locator("#split-edit-destination-csv-error");
    if (!(await el.isVisible())) return [];
    return ((await el.textContent()) ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
  }

  /** モーダルの「雛形ファイルダウンロード」（雛形ファイルフォーマットボタン）を押す */
  async downloadTemplate(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.csvModal.getByRole("link", { name: "雛形ファイルダウンロード" }).click(),
    ]);
    return download;
  }

  async pressListLink(): Promise<void> {
    await Promise.all([this.page.waitForURL((u) => u.pathname === splitJoinListPath, { waitUntil: "load" }), this.一覧リンク.click()]);
  }
}

export class SplitApprovalPage {
  readonly 却下理由: Locator;
  readonly メモ: Locator;
  readonly 承認ボタン: Locator;
  readonly 却下ボタン: Locator;

  constructor(readonly page: Page, readonly id: string) {
    this.却下理由 = page.locator('textarea[name="rejected_memo"]');
    this.メモ = page.locator("#split-approval-memo");
    this.承認ボタン = page.locator('form#form-split-approval button[data-approval-mode="approve"]');
    this.却下ボタン = page.locator('form#form-split-approval button[data-approval-mode="reject"]');
  }

  async open(): Promise<Response | null> {
    const res = await this.page.goto(adminUrl(`/product/stock/split/${this.id}/approval`));
    await this.page.waitForLoadState("load");
    return res;
  }

  async pressApprove(): Promise<void> {
    await expect(this.承認ボタン, "承認ボタン").toBeVisible();
    await this.承認ボタン.click();
    await expect(this.page.locator("#splitApproveConfirmModal"), "承認の確認画面").toBeVisible();
  }

  async pressReject(): Promise<void> {
    await expect(this.却下ボタン, "却下ボタン").toBeVisible();
    await this.却下ボタン.click();
    await expect(this.page.locator("#splitRejectConfirmModal"), "却下の確認画面").toBeVisible();
  }

  /** 確認画面の「承認する」「却下する」（OK）を押す */
  async confirm(mode: "approve" | "reject"): Promise<void> {
    const button = this.page.locator(mode === "approve" ? "#split_approve_confirm_submit_btn" : "#split_reject_confirm_submit_btn");
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), button.click()]);
  }
}

// ---------------------------------------------------------------- 在庫結合

export class JoinNewPage {
  readonly 結合数: Locator;
  readonly メモ: Locator;
  readonly 登録ボタン: Locator;
  readonly 在庫一覧リンク: Locator;

  constructor(readonly page: Page) {
    this.結合数 = page.locator('#form-join-register input[name="destination_stock"]');
    this.メモ = page.locator('#form-join-register textarea[name="split_join_memo"]');
    this.登録ボタン = page.locator('button[type="submit"][form="form-join-register"]');
    this.在庫一覧リンク = page.locator(".c-conversionArea a.c-baseLink");
  }

  /** 結合先商品の表の1行 */
  async target(): Promise<Record<string, string>> {
    const rows = await tableRecords(card(this.page, "結合先商品").first().locator("table"));
    if (rows.length !== 1) throw new Error(`結合先商品の行が1行ではない（${rows.length}行）`);
    return rows[0];
  }

  async pressRegister(): Promise<SubmitResult> {
    return submitWithValidity(this.page, this.page.locator("form#form-join-register"), this.登録ボタン, true, { 結合数: this.結合数, メモ: this.メモ });
  }

  /** 結合数（とメモ）を入れて登録し、結合元登録画面へ移ったことを確かめて、在庫分割結合IDを返す */
  async register(quantity: string, memo: string | null, what: string): Promise<string> {
    await this.結合数.fill(quantity);
    if (memo !== null) await this.メモ.fill(memo);
    const r = await this.pressRegister();
    if (!r.sent) throw new Error(`${what}: ブラウザの入力チェックで送信が止まった（${r.止めた項目.join(" / ")}）`);
    const m = /\/product\/stock\/join\/(\d+)\/edit$/.exec(pathOf(this.page.url()));
    if (!m) throw new Error(`${what}: 登録後に結合元登録画面へ移らない（${this.page.url()}／${(await alerts(this.page)).join(" / ")}）`);
    return m[1];
  }

  async pressBackToStockList(): Promise<void> {
    await expect(this.在庫一覧リンク, "在庫一覧リンク").toBeVisible();
    await Promise.all([this.page.waitForURL((u) => u.pathname === stockListPath, { waitUntil: "load" }), this.在庫一覧リンク.click()]);
  }
}

/** 結合元登録画面（編集）と結合計画承認申請画面（欠品入力）。同じテンプレートで、状態により出る欄が変わる */
export class JoinEditPage {
  readonly modal: ProductPickModal;
  readonly 結合元商品登録ボタン: Locator;
  readonly フッターの結合元商品登録ボタン: Locator;
  readonly 承認申請ボタン: Locator;
  readonly 承認申請モーダル: Locator;
  readonly メモ: Locator;
  readonly 所属: Locator;
  readonly 承認通知先メンバー: Locator;
  readonly 一覧リンク: Locator;
  readonly CSV出力: Locator;

  constructor(readonly page: Page, readonly id: string) {
    this.modal = new ProductPickModal(page, page.locator("#joinEditSearchProductModal"), "joinEditSearchProductModalButton", "joinEditSearchProductModalList");
    this.結合元商品登録ボタン = page.locator('button[data-bs-target="#joinEditSearchProductModal"]');
    this.フッターの結合元商品登録ボタン = page.locator('form#formJoinMoveToShortageEntry button[type="submit"]');
    this.承認申請ボタン = page.locator(".c-conversionArea button.js-join-apply-approval-open");
    this.承認申請モーダル = page.locator("#joinEditConfirmApprovalModal");
    // 結合登録メモ（新規登録・結合元登録の状態）。画面の部品は、フォームの既定の識別名のあとに、画面が決めた識別名をもう一度書くので、
    // ブラウザは先の既定の識別名だけを使い、画面が決めた識別名では見つからない（058 で入力が見つからずに止まった。E2E側の誤り。2026-10-20 に直した）。
    // フォームの項目の名前で決める
    this.メモ = page.locator('textarea[name="admin_stock_split_join[split_join_memo]"]');
    this.所属 = page.locator("select.js-join-approval-dept");
    this.承認通知先メンバー = page.locator("select.js-join-approval-members");
    this.一覧リンク = page.locator(".c-conversionArea a.c-baseLink");
    this.CSV出力 = page.locator('a[href*="/shortage-csv-export"]').filter({ hasText: "CSV出力" });
  }

  async open(): Promise<void> {
    await this.page.goto(adminUrl(`/product/stock/join/${this.id}/edit`));
    await this.ready(joinEditPath(this.id));
  }

  async openShortageEntry(): Promise<void> {
    await this.page.goto(adminUrl(`/product/stock/join/${this.id}/shortage-entry`));
    await this.ready(joinShortagePath(this.id));
  }

  async ready(path: string): Promise<void> {
    await expect(this.page, "結合の画面").toHaveURL((u) => u.pathname === path);
    await this.page.waitForLoadState("load");
    await expect(card(this.page, "基本情報").first(), "結合の画面の基本情報").toBeVisible();
  }

  async pressAddSource(): Promise<void> {
    await expect(this.結合元商品登録ボタン, "結合元商品登録ボタン（モーダルを開く）").toBeVisible();
    await this.結合元商品登録ボタン.click();
    await expect(this.modal.modal, "商品検索のモーダル").toBeVisible();
  }

  async searchAndSelect(code: string): Promise<void> {
    await this.modal.search(code);
    await this.modal.select(code);
  }

  async decide(code: string): Promise<void> {
    await this.modal.decide(code, joinEditPath(this.id));
    await this.ready(joinEditPath(this.id));
  }

  /** 結合元商品を1件追加する（モーダルを開く→商品コードで検索して選ぶ→決定） */
  async addSource(code: string): Promise<void> {
    await this.pressAddSource();
    await this.searchAndSelect(code);
    await this.decide(code);
  }

  sourceTable(): Locator {
    return this.page.locator(".js-join-source-stock-container table");
  }

  async sources(): Promise<Record<string, string>[]> {
    return tableRecords(this.sourceTable());
  }

  sourceRow(code: string): Locator {
    return this.page.locator("tr.js-join-source-row").filter({ has: this.page.locator("td:nth-child(2)", { hasText: new RegExp(`^\\s*${code}\\s*$`) }) });
  }

  /**
   * 結合元在庫数に入れてフォーカスを外す。画面は結合元在庫数の保存の要求を送る（0件になった行があれば読み込み直す）。
   * 値が変わらないときは要求を送らない。
   */
  async setSourceQuantity(code: string, value: string): Promise<{ status: number | null; body: unknown }> {
    const input = this.sourceRow(code).locator("input.js-join-source-stock");
    await expect(input, `${code} の結合元在庫数`).toHaveCount(1);
    const before = await input.inputValue();
    const res = before === value ? null : this.page.waitForResponse((r) => r.request().method() === "POST" && /\/join\/update-source-stock$/.test(r.url()), { timeout: 15_000 });
    await input.fill(value);
    await input.press("Tab");
    if (!res) return { status: null, body: null };
    const r = await res;
    const body = (await r.json().catch(() => null)) as { details_were_removed?: boolean } | null;
    if (body?.details_were_removed) await this.page.waitForLoadState("load");
    await this.page.waitForTimeout(300);
    return { status: r.status(), body };
  }

  /** 結合元の在庫区分の選択欄を変える（画面は在庫区分の保存の要求を送る） */
  async changeSourceLocation(code: string, label: 在庫区分): Promise<{ status: number; body: unknown }> {
    const select = this.sourceRow(code).locator("select.js-join-edit-source-stock-location");
    await expect(select, `${code} の在庫区分の選択欄`).toHaveCount(1);
    const res = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/join\/update-source-stock-location$/.test(r.url()), { timeout: 15_000 });
    await select.selectOption({ label });
    const r = await res;
    const body = await r.json().catch(() => null);
    await this.page.waitForTimeout(300);
    return { status: r.status(), body };
  }

  async pressDelete(code: string): Promise<void> {
    await this.sourceRow(code).locator("button.js-stock-delete-detail").click();
    await expect(this.page.locator("#joinEditDeleteConfirmModal"), "結合元削除の確認モーダル").toBeVisible();
  }

  async confirmDelete(): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load" }),
      this.page.locator("#joinEditDeleteConfirmModal .js-stock-delete-confirm").click(),
    ]);
  }

  /** フッターの「結合元商品登録」を押す（結合計画承認申請画面へ移る） */
  async pressFooterSourceRegister(): Promise<void> {
    await expect(this.フッターの結合元商品登録ボタン, "フッターの結合元商品登録ボタン").toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.フッターの結合元商品登録ボタン.click()]);
  }

  shortageInput(code: string): Locator {
    return this.sourceRow(code).locator("input.js-join-shortage-qty-input");
  }

  shortageButton(code: string): Locator {
    return this.sourceRow(code).locator("button.js-join-shortage-toggle");
  }

  /** 欠品点数を入れる（ボタンの押せる・押せないは入力に応じて画面が変える） */
  async fillShortage(code: string, value: string): Promise<void> {
    await this.shortageInput(code).fill(value);
  }

  /**
   * 欠品登録ボタン（または取り消しボタン）を押す。画面は欠品点数の保存の要求を送る。
   * 画面のスクリプトは、保存の応答を待たずに、成否に関係なく入力欄を読み取り専用にしてボタンの文字を変える。
   * 保存が成功したか（仮登録されたか）は、応答の本文（成否の印）で見る。応答の状態は失敗のときも200なので、状態だけでは決めない
   */
  async pressShortageButton(code: string): Promise<{ status: number; body: { ok?: boolean; message?: string } | null }> {
    const res = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/join\/update-shortage$/.test(r.url()), { timeout: 15_000 });
    await this.shortageButton(code).click();
    const r = await res;
    const body = (await r.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
    await this.page.waitForTimeout(300);
    return { status: r.status(), body };
  }

  async chooseApprovalTargets(dept: string | null, member: string | null): Promise<void> {
    await chooseApprovalTargets(this.page, this.所属, this.承認通知先メンバー, dept, member);
  }

  async pressApplyApproval(): Promise<boolean> {
    if ((await this.承認申請ボタン.count()) === 0) return false;
    await this.承認申請ボタン.click();
    await expect(this.承認申請モーダル, "承認申請の確認モーダル").toBeVisible();
    return true;
  }

  /** 確認のモーダルの「承認申請」（承認申請するボタン）を押す */
  async confirmApplyApproval(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.承認申請モーダル.locator(".js-stock-apply-approval-submit").click()]);
  }

  async summary(): Promise<{ 点数: string; 基準価格合計: string; 総原価合計: string }> {
    return {
      点数: ((await this.page.locator("#join-summary-source-count").textContent()) ?? "").trim(),
      基準価格合計: ((await this.page.locator("#join-summary-total-standard-price").textContent()) ?? "").trim(),
      総原価合計: ((await this.page.locator("#join-summary-total-cost-price").textContent()) ?? "").trim(),
    };
  }

  /** 結合元の一覧のページ送りのリンク（ページ番号） */
  pageLink(n: number): Locator {
    return this.page.locator(".card-footer .pagination a.page-link").filter({ hasText: new RegExp(`^\\s*${n}\\s*$`) });
  }

  async pressListLink(): Promise<void> {
    await Promise.all([this.page.waitForURL((u) => u.pathname === splitJoinListPath, { waitUntil: "load" }), this.一覧リンク.click()]);
  }
}

export class JoinApprovalPage {
  readonly 却下理由: Locator;
  readonly メモ: Locator;
  readonly 承認ボタン: Locator;
  readonly 却下ボタン: Locator;

  constructor(readonly page: Page, readonly id: string) {
    this.却下理由 = page.locator('textarea[name="rejected_memo"]');
    this.メモ = page.locator("#join-approval-split-join-memo");
    this.承認ボタン = page.locator('form#form-join-approval button[data-approval-mode="approve"]');
    this.却下ボタン = page.locator('form#form-join-approval button[data-approval-mode="reject"]');
  }

  async open(): Promise<Response | null> {
    const res = await this.page.goto(adminUrl(`/product/stock/join/${this.id}/approval`));
    await this.page.waitForLoadState("load");
    return res;
  }

  async pressApprove(): Promise<void> {
    await expect(this.承認ボタン, "承認ボタン").toBeVisible();
    await this.承認ボタン.click();
    await expect(this.page.locator("#joinApproveConfirmModal"), "承認の確認モーダル").toBeVisible();
  }

  async pressReject(): Promise<void> {
    await expect(this.却下ボタン, "却下ボタン").toBeVisible();
    await this.却下ボタン.click();
    await expect(this.page.locator("#joinRejectConfirmModal"), "却下の確認モーダル").toBeVisible();
  }

  /** 確認モーダルの「承認する」「却下する」を押す */
  async confirm(mode: "approve" | "reject"): Promise<void> {
    const button = this.page.locator(mode === "approve" ? "#join_approve_confirm_submit_btn" : "#join_reject_confirm_submit_btn");
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), button.click()]);
  }

  async sources(): Promise<Record<string, string>[]> {
    return tableRecords(card(this.page, "結合元商品一覧").first().locator("table"));
  }
}

// ---------------------------------------------------------------- 在庫分割結合検索一覧

export type SplitJoinListRow = {
  ID: string; 種別: string; 店舗: string; 在庫区分: string; 商品名: string; 元点数: string; 矢印: string; 先点数: string;
  ステータス: string; 登録者: string; 登録日: string;
};

export class SplitJoinListPage {
  readonly form: Locator;
  readonly 商品コード: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator('form[name="admin_search_stock_split_join"]');
    this.商品コード = page.locator("#admin_search_stock_split_join_product_code");
  }

  async open(): Promise<void> {
    await this.page.goto(adminUrl("/product/stock/split-join"));
    await expect(this.form, "在庫分割結合検索一覧の検索欄").toBeVisible();
    await this.page.waitForLoadState("load");
  }

  /** 商品名・商品コード検索対象のチェック欄（「分割元・結合先」「分割先・結合元」） */
  target(label: "分割元・結合先" | "分割先・結合元"): Locator {
    return this.form.locator(".form-check").filter({ has: this.page.locator("label", { hasText: new RegExp(`^\\s*${label}\\s*$`) }) }).locator("input[type=checkbox]");
  }

  async checkedTargets(): Promise<string[]> {
    return this.form.locator('input[name="admin_search_stock_split_join[search_target][]"]').evaluateAll((inputs) => inputs
      .filter((i) => (i as HTMLInputElement).checked).map((i) => (i as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? ""));
  }

  /** 商品コードを入れて検索する。targets を渡せば、検索対象をその並びのとおりにする（渡さなければ初期値のまま） */
  async search(code: string, targets?: ("分割元・結合先" | "分割先・結合元")[]): Promise<void> {
    if (targets) {
      for (const t of ["分割元・結合先", "分割先・結合元"] as const) await this.target(t).setChecked(targets.includes(t));
    }
    await this.商品コード.fill(code);
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load" }),
      this.form.locator('button[type="submit"]').filter({ hasText: "検索" }).click(),
    ]);
  }

  resultRows(): Locator {
    return this.page.locator("table tbody tr").filter({ has: this.page.locator("td:first-child a") });
  }

  async rows(): Promise<SplitJoinListRow[]> {
    return this.resultRows().evaluateAll((trs) => trs.map((tr) => {
      const td = (i: number) => (tr.querySelectorAll("td")[i]?.textContent ?? "").replace(/\s+/g, " ").trim();
      return {
        ID: td(0), 種別: td(1), 店舗: td(2), 在庫区分: td(3), 商品名: td(4), 元点数: td(5), 矢印: td(6), 先点数: td(7),
        ステータス: td(8), 登録者: td(9), 登録日: td(10),
      };
    }));
  }

  /** 結果の行のIDのリンクを押す（状態に応じて、分割先登録・分割承認・結合元登録・結合計画承認申請・結合計画承認の画面へ移る） */
  async openById(id: string): Promise<void> {
    const link = this.resultRows().locator("td:first-child a").filter({ hasText: new RegExp(`^\\s*${id}\\s*$`) });
    await expect(link, `検索結果の ID ${id} のリンクが1件`).toHaveCount(1);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), link.click()]);
  }

  /** 商品コードで検索して、ちょうど1件の行のIDを読む（シードの「その行のIDを控える」） */
  async readSingleId(code: string, what: string): Promise<string> {
    await this.open();
    await this.search(code);
    const rows = await this.rows();
    if (rows.length !== 1) throw new Error(`${what}: 在庫分割結合検索一覧で商品コード ${code} の行が1件ではない（${rows.length}件）`);
    if (!/^\d+$/.test(rows[0].ID)) throw new Error(`${what}: 在庫分割結合IDを読めない（${rows[0].ID}）`);
    return rows[0].ID;
  }
}
