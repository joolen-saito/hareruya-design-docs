/**
 * M04-31 棚卸計画の画面操作（メニュー「在庫管理」→「棚卸計画一覧」）。セレクタはここにだけ書く。
 * - 棚卸計画一覧: 店舗（単一選択）・在庫区分（チェック）で検索し、行（棚卸名・店舗と在庫区分・備考など）を読む。
 *   検索の初期値は計画作成日が1か月前〜今日（画面の作り）。正本の手順は日付に触れないので、日付は初期値のまま検索する。
 * - 棚卸計画新規作成: 棚卸名・店舗・在庫区分・備考を入れて「登録」。画面の新規作成への導線は、一覧の右上の「新規登録」ボタン
 *   （設計書 0202 棚卸計画一覧 L0042 は「新規作成」）。
 * - 棚卸計画編集: 棚卸名・備考の入力欄、上部のメッセージ、棚卸商品CSV登録（商品登録）・棚卸商品数量CSV登録（数量登録）のモーダル、
 *   「棚卸結果の在庫反映」ボタン。
 * - 棚卸在庫確認: 一覧の商品名のリンクから開き、差異確認のボタンを押す（画面の文言は「差異確認完了＆更新」。設計書 L0398 は「差異確認＆完了」）。
 * - 棚卸在庫反映: 「実行」ボタン。
 * - 店舗管理: 閉店の店舗の登録（S-M04-31-BASES の店舗C）。開店の店舗は M04-24 の部品（店名・会社名で探して、あれば内容を確かめて使う）。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel } from "./common";
import { M0424StoreInput } from "./m04_24_store";

type Issue = (message: string) => void;
const norm = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const exactText = (s: string) => new RegExp(`^\\s*${escapeRe(s)}\\s*$`);

/** 画面上部のメッセージ（成功・エラー）。開発用の設定の帯は除く */
export async function topMessages(page: Page): Promise<{ 成功: string[]; エラー: string[] }> {
  const read = async (l: Locator) => (await l.allInnerTexts()).map(norm).filter((t) => t && t !== "デバッグモードが有効になっています。");
  return { 成功: await read(page.locator(".alert-success")), エラー: await read(page.locator(".alert-danger")) };
}

/** 画面の見出し（棚卸計画一覧・棚卸計画新規作成・棚卸計画編集など）。ページタイトルとカードの見出しの両方を返す */
export async function headings(page: Page): Promise<string[]> {
  return (await page.locator("h2.c-pageTitle__title, .card-header h5.card-title").allInnerTexts()).map(norm).filter(Boolean);
}

// ---- 棚卸計画一覧 ----

export type PlanRow = { id: string; 棚卸名: string; 店舗と在庫区分: string; 備考: string; 全文: string };

export class InventoryPlanListPage {
  readonly form: Locator;
  constructor(private readonly page: Page) {
    this.form = page.locator("form#form_admin_stock_inventory_plan_list");
  }

  /** 棚卸計画一覧画面を開く（メニュー「棚卸計画一覧」のリンク先） */
  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/product/stock/inventory_plan/search"));
    expect(res?.status(), "棚卸計画一覧の応答").toBe(200);
    await expect(this.form, "棚卸計画一覧の検索欄").toBeVisible();
    await this.page.waitForLoadState("load");
  }

  /** 一覧の右上の、新規作成画面へのボタン（画面の文言は「新規登録」） */
  newButton(): Locator {
    return this.page.locator('.c-primaryCol a[href$="/product/stock/inventory_plan/new"]');
  }

  /** 新規作成画面へのボタンを押し、棚卸計画新規作成画面へ移る。ボタンの文言を返す */
  async pressNew(): Promise<string> {
    const button = this.newButton();
    await expect(button, "新規作成画面へのボタンは1つ").toHaveCount(1);
    const label = norm(await button.innerText());
    await Promise.all([this.page.waitForURL(/\/product\/stock\/inventory_plan\/new$/, { waitUntil: "load", timeout: 60_000 }), button.click()]);
    await expect(this.page.locator("form#inventory_plan_form"), "棚卸計画新規作成の入力欄").toBeVisible();
    return label;
  }

  /** 店舗選択に店名の店舗（選択肢の表示名が一致するもの1つ）を選び、在庫区分のチェックを付けて「検索」を押す */
  async search(v: { 店舗: string; 在庫区分: string[] }): Promise<void> {
    const select = this.form.locator("#admin_stock_inventory_plan_list_base_info");
    const hits = select.locator("option").filter({ hasText: exactText(v.店舗) });
    await expect(hits, `店舗選択の選択肢「${v.店舗}」は1つ`).toHaveCount(1);
    await chooseByLabel(select, v.店舗);
    const boxes = this.form.locator('input[name="admin_stock_inventory_plan_list[stock_location_id][]"]');
    for (const zone of ["EC-CUBE", "スマレジ"]) {
      const box = boxes.and(this.page.getByLabel(zone, { exact: true }));
      await expect(box, `在庫区分「${zone}」のチェック欄は1つ`).toHaveCount(1);
      await box.setChecked(v.在庫区分.includes(zone));
    }
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load" }),
      this.form.getByRole("button", { name: "検索" }).click(),
    ]);
    await expect(this.form, "検索のあとの棚卸計画一覧").toBeVisible();
  }

  /** 一覧の行 */
  async rows(): Promise<PlanRow[]> {
    return this.page.locator('tr[id^="inventory_plan_list_main__item--"]').evaluateAll((trs) => trs.map((tr) => {
      const n = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
      const firstRow = tr.querySelector(".row");
      const cols = firstRow ? firstRow.querySelectorAll(":scope > div") : [];
      const storeText = n(cols[1]?.textContent).replace(/^店舗\s*[:：]\s*/, "");
      const memoDiv = Array.from(tr.querySelectorAll(".row")).pop();
      return {
        id: tr.id.replace("inventory_plan_list_main__item--", ""),
        棚卸名: n(tr.querySelector("a")?.textContent),
        店舗と在庫区分: storeText,
        備考: n(memoDiv?.textContent).replace(/^備考\s*[:：]\s*/, ""),
        全文: n(tr.textContent),
      };
    }));
  }

  /** 「棚卸計画データがありません。」の見出し */
  noDataHeading(): Locator {
    return this.page.locator(".card-header .card-title").filter({ hasText: exactText("棚卸計画データがありません。") });
  }

  /** 該当件数の表示（「検索結果 N 件が該当しました」） */
  resultCount(): Locator {
    return this.form.locator("span.fw-bold").filter({ hasText: /検索結果/ });
  }

  /** ページング */
  pager(): Locator {
    return this.page.locator("ul.pagination");
  }
}

// ---- 棚卸計画新規作成 ----

export class InventoryPlanNewPage {
  readonly form: Locator;
  constructor(private readonly page: Page) {
    this.form = page.locator("form#inventory_plan_form");
  }

  name(): Locator { return this.form.locator("#admin_stock_inventory_plan_name"); }
  store(): Locator { return this.form.locator("#admin_stock_inventory_plan_BaseInfo"); }
  memo(): Locator { return this.form.locator("#admin_stock_inventory_plan_memo"); }
  zone(label: string): Locator {
    return this.form.locator('input[name="admin_stock_inventory_plan[stockLocationId]"]').and(this.page.getByLabel(label, { exact: true }));
  }

  /** 店舗の選択肢の表示名（「選択してください」を除く） */
  async storeOptions(): Promise<string[]> {
    return (await this.store().locator("option").evaluateAll((os) => os.filter((o) => (o as HTMLOptionElement).value)
      .map((o) => (o.textContent ?? "").replace(/\s+/g, " ").trim())));
  }

  /** いま選ばれている店舗の表示名（未選択は空） */
  async selectedStore(): Promise<string> {
    return this.store().evaluate((n) => {
      const s = n as HTMLSelectElement;
      const o = s.selectedOptions[0];
      return o && o.value ? (o.textContent ?? "").replace(/\s+/g, " ").trim() : "";
    });
  }

  /** いま選ばれている在庫区分の表示名 */
  async selectedZone(): Promise<string[]> {
    const out: string[] = [];
    for (const label of ["EC-CUBE", "スマレジ"]) if (await this.zone(label).isChecked()) out.push(label);
    return out;
  }

  /** 入力する。undefined の項目は触らない（初期値のまま） */
  async fill(v: { 棚卸名?: string; 店舗?: string; 在庫区分?: string; 備考?: string }): Promise<void> {
    if (v.棚卸名 !== undefined) await this.name().fill(v.棚卸名);
    if (v.店舗 !== undefined) {
      const hits = this.store().locator("option").filter({ hasText: exactText(v.店舗) });
      await expect(hits, `店舗の選択肢「${v.店舗}」は1つ`).toHaveCount(1);
      await chooseByLabel(this.store(), v.店舗);
    }
    if (v.在庫区分 !== undefined) {
      await expect(this.zone(v.在庫区分), `在庫区分「${v.在庫区分}」のラジオボタンは1つ`).toHaveCount(1);
      await this.zone(v.在庫区分).check();
    }
    if (v.備考 !== undefined) await this.memo().fill(v.備考);
  }

  /**
   * 「登録」を押す。ブラウザの入力チェック（必須の欄が空など）で送信が止まったときは、移動せずに "ブラウザが止めた" を返す。
   * 送信されたときは、移った先の画面の読み込みを待って "送信" を返す。
   */
  async submit(): Promise<"送信" | "ブラウザが止めた"> {
    const invalid = await this.form.evaluate((f) => !(f as HTMLFormElement).checkValidity());
    const button = this.page.locator(".c-conversionArea").getByRole("button", { name: "登録", exact: true });
    await expect(button, "「登録」ボタン").toBeVisible();
    if (invalid) {
      await button.click();
      await this.page.waitForTimeout(1500);
      return "ブラウザが止めた";
    }
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), button.click()]);
    return "送信";
  }

  /** ブラウザの入力チェックで止まった欄と、そのときの説明（validationMessage） */
  async invalidFields(): Promise<string[]> {
    return this.form.locator("input, select, textarea").evaluateAll((els) => els
      .filter((e) => !(e as HTMLInputElement).validity.valid)
      .map((e) => `${(e as HTMLInputElement).name}: ${(e as HTMLInputElement).validationMessage}`));
  }
}

// ---- 棚卸計画編集 ----

export class InventoryPlanEditPage {
  readonly form: Locator;
  constructor(private readonly page: Page) {
    this.form = page.locator("form#inventory_plan_form");
  }

  /** いまの画面が棚卸計画編集画面なら、アドレスの末尾の棚卸計画IDを返す。違えば null */
  planIdInUrl(): string | null {
    const m = /\/product\/stock\/inventory_plan\/(\d+)(?:\/\d+)?(?:\?.*)?$/.exec(this.page.url());
    return m ? m[1] : null;
  }

  async name(): Promise<string> { return this.form.locator("#admin_stock_inventory_plan_name").inputValue(); }
  async memo(): Promise<string> { return this.form.locator("#admin_stock_inventory_plan_memo").inputValue(); }

  /** 「店舗」「在庫区分」などラベルと値だけの行の値 */
  async labeled(label: string): Promise<string> {
    const row = this.form.locator(".row.mb-3").filter({ has: this.page.locator("label.col-form-label", { hasText: exactText(label) }) }).last();
    return norm(await row.locator("div.col-form-label").innerText());
  }

  /** 棚卸計画編集画面を棚卸計画IDで開く（シード用） */
  async openById(id: string): Promise<void> {
    const res = await this.page.goto(adminUrl(`/product/stock/inventory_plan/${id}`));
    expect(res?.status(), `棚卸計画編集（棚卸計画ID ${id}）の応答`).toBe(200);
    await expect(this.form, "棚卸計画編集の入力欄").toBeVisible();
    await this.page.waitForLoadState("load");
  }

  /** 棚卸商品CSV登録（「商品登録」）・棚卸商品数量CSV登録（「数量登録」）のモーダルを開いてファイルを選び、送信する */
  async uploadCsv(kind: "商品登録" | "数量登録", file: { name: string; body: string }, what: string, onIssue: Issue): Promise<void> {
    const modalId = kind === "商品登録" ? "#inventoryPlanProductCsvModal" : "#inventoryPlanQuantityCsvModal";
    const opener = this.page.locator(`button[data-bs-target="${modalId}"]`);
    await expect(opener, `「${kind}」ボタン`).toBeEnabled();
    await opener.click();
    const modal = this.page.locator(modalId);
    await expect(modal, `${kind}のモーダル`).toBeVisible();
    await modal.locator('input[type="file"]').setInputFiles({ name: file.name, mimeType: "text/csv", buffer: Buffer.from(file.body, "utf-8") });
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }),
      modal.locator('form button[type="submit"]').click(),
    ]);
    const m = await topMessages(this.page);
    if (m.エラー.length) throw new Error(`${what}: エラー: ${m.エラー.join(" / ")}`);
    if (!m.成功.length) throw new Error(`${what}: 成功のメッセージが出ない`);
    onIssue(`${what}: 「${m.成功.join(" / ")}」`);
  }

  /** 棚卸対象商品の一覧の行（商品名・商品コード・在庫数量・棚卸数量・在庫差異・差異確認） */
  async detailRows(): Promise<Record<string, string>[]> {
    const table = this.page.locator(".card-body table.table").first();
    const heads = (await table.locator("thead th").allInnerTexts()).map(norm);
    return table.locator("tbody tr").evaluateAll((trs, hs) => trs.map((tr) => {
      const tds = Array.from(tr.querySelectorAll("td")).map((td) => (td.textContent ?? "").replace(/\s+/g, " ").trim());
      return Object.fromEntries(hs.map((h, i) => [h, tds[i] ?? ""]));
    }), heads);
  }

  /** 一覧の商品名のリンクから棚卸在庫確認を開く */
  async openDetail(商品コード: string): Promise<void> {
    const row = this.page.locator(".card-body table.table tbody tr").filter({ has: this.page.locator("td", { hasText: exactText(商品コード) }) });
    await expect(row, `棚卸対象商品の一覧に商品コード ${商品コード} の行が1件`).toHaveCount(1);
    await Promise.all([this.page.waitForURL(/\/inventory_plan\/detail\/\d+$/, { waitUntil: "load", timeout: 60_000 }), row.locator("td a").first().click()]);
    await expect(this.page.locator("form#inventory_plan_form"), "棚卸在庫確認の入力欄").toBeVisible();
  }

  /** 「棚卸結果の在庫反映」ボタン */
  reflectButton(): Locator {
    return this.page.locator("form#inventory_plan_form").getByRole("button", { name: "棚卸結果の在庫反映" });
  }

  /** 「棚卸結果の在庫反映」を押して棚卸在庫反映画面へ移る */
  async pressReflect(): Promise<void> {
    await expect(this.reflectButton(), "「棚卸結果の在庫反映」が押せる").toBeEnabled();
    await Promise.all([this.page.waitForURL(/\/inventory_plan\/stock_reflect_confirm\/\d+$/, { waitUntil: "load", timeout: 60_000 }), this.reflectButton().click()]);
    await expect(this.page.locator("h2.c-pageTitle__title, .card-title").filter({ hasText: "棚卸在庫反映" }).first(), "棚卸在庫反映画面").toBeVisible();
  }
}

// ---- 棚卸在庫確認 ----

/** 棚卸在庫確認の差異確認のボタン（画面の文言は「差異確認完了＆更新」）を押す。在庫差異があるときだけ表示される */
export async function pressDiffConfirm(page: Page, what: string): Promise<string> {
  const button = page.locator("#stock_difference_confirm_button");
  await expect(button, `${what}: 差異確認のボタン`).toBeVisible();
  const label = norm(await button.innerText());
  await page.waitForLoadState("load");
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), button.click()]);
  const m = await topMessages(page);
  if (m.エラー.length) throw new Error(`${what}: エラー: ${m.エラー.join(" / ")}`);
  if (!m.成功.length) throw new Error(`${what}: 成功のメッセージが出ない`);
  return label;
}

// ---- 棚卸在庫反映 ----

/** 棚卸在庫反映画面の「実行」を押す。移った先（棚卸計画編集）の上部のメッセージを返す */
export async function pressReflectExecute(page: Page): Promise<{ 成功: string[]; エラー: string[] }> {
  const button = page.getByRole("button", { name: "実行", exact: true });
  await expect(button, "棚卸在庫反映の「実行」").toBeVisible();
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 300_000 }), button.click()]);
  return topMessages(page);
}

// ---- 店舗（閉店の店舗の登録） ----

const storeField = (page: Page, name: string) => page.locator(`[name="mall_tenant_shop_master[${name}]"]`);

/** 店舗一覧で、店名・会社名が一致する行（ID・開店/閉店） */
export async function storesNamed(page: Page, 店名: string, 会社名: string): Promise<{ id: string; 開店: string }[]> {
  const res = await page.goto(adminUrl("/mall/tenant/page/1?page_count=10000"));
  if (!res || !res.ok()) throw new Error(`店舗一覧を開けない（応答 ${res?.status() ?? "なし"}）`);
  const rows = await page.locator('table.table tbody tr[id^="ex-tenant-"]').evaluateAll((trs) => trs.map((tr) => {
    const td = (i: number) => (tr.querySelectorAll("td")[i]?.textContent ?? "").replace(/\s+/g, " ").trim();
    return { id: td(1), 店名: td(2), 会社名: td(3), 開店: td(5) };
  }));
  return rows.filter((r) => r.店名 === 店名 && r.会社名 === 会社名).map((r) => ({ id: r.id, 開店: r.開店 }));
}

/**
 * 閉店の店舗を、店舗登録画面で「閉店」を選んで登録する（あれば、閉店であることを確かめて使う）。店舗IDを返す。
 * 登録の送信がエラー画面になっても、店舗一覧に出ていれば先へ進み、onIssue で知らせる（店舗の登録はシステムエラーを出しても保存される）。
 */
export async function ensureClosedStore(page: Page, v: M0424StoreInput, onIssue: Issue): Promise<string> {
  let hits = await storesNamed(page, v.店名, v.会社名);
  if (hits.length === 0) {
    await page.goto(adminUrl("/mall/tenant/create"));
    await page.waitForLoadState("load");
    await storeField(page, "company_name").fill(v.会社名);
    await storeField(page, "company_kana").fill(v.会社名カナ);
    await storeField(page, "shop_name").fill(v.店名);
    await storeField(page, "shop_kana").fill(v.店名カナ);
    await storeField(page, "shop_name_eng").fill(v.店名英語);
    await storeField(page, "html_class_name").fill(v.支店URL);
    await page.getByLabel("支店", { exact: true }).check();
    await page.getByLabel("公開", { exact: true }).check();
    await page.getByLabel("閉店", { exact: true }).check();
    await page.getByLabel("表示する", { exact: true }).check();
    await storeField(page, "postal_code").fill(v.郵便番号);
    await chooseByLabel(page.locator('[name="mall_tenant_shop_master[address][pref]"]'), v.都道府県);
    await page.locator('[name="mall_tenant_shop_master[address][addr01]"]').fill(v.住所1);
    await page.locator('[name="mall_tenant_shop_master[address][addr02]"]').fill(v.住所2);
    await storeField(page, "phone_number").fill(v.電話番号);
    for (const m of ["email01", "email02", "email03", "email04"]) await storeField(page, m).fill(`${v.支店URL}@example.test`);
    await storeField(page, "shop_digit").fill(v.店名略称3文字);
    await storeField(page, "short_name_jp").fill(v.ショップ名略称);
    await storeField(page, "rank").fill("0");
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), page.getByRole("button", { name: "登録", exact: true }).click()]);
    const m = await topMessages(page);
    if (!m.成功.length) onIssue(`店舗登録画面で「${v.店名}」（閉店）を登録したとき、画面は成功を表示しなかった（${[...m.エラー, page.url()].join(" / ")}）`);
    hits = await storesNamed(page, v.店名, v.会社名);
  }
  if (hits.length !== 1) throw new Error(`店名「${v.店名}」・会社名「${v.会社名}」の店舗が ${hits.length} 件（1件のはず）`);
  if (hits[0].開店 !== "閉店") throw new Error(`店舗「${v.店名}」（店舗ID ${hits[0].id}）が閉店でない（${hits[0].開店}）`);
  return hits[0].id;
}
