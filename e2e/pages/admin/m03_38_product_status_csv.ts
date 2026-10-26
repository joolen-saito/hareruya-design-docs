/**
 * M03-38 商品公開CSV登録の画面操作。セレクタはこのファイルにだけ書く。
 *
 * - 商品のCSV取込の画面（商品公開CSV登録・棚番号更新CSV登録は同じ作りの画面）: ファイルを選ぶ・アップロード・確認モーダルの有無・
 *   画面上部の案内・雛形ファイルダウンロード。M03-40 の部品もこのクラスを使う。
 * - シードが使う商品の操作: 商品マスターで商品名を入れて検索し、行の商品IDを読む・商品登録編集画面で公開状態と支店の商品公開ステータスを選んで保存する。
 * - 公開側の商品詳細画面（本店 /ja/・支店 /ja/<支店URL>/）。
 */
import { Browser, expect, Locator, Page, Response } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { adminUrl, hideDebugToolbar } from "../../lib/session";
import { expectSaved } from "./common";
import { GoodsCsvTemplate } from "./m03_01_goods_csv";
import { ProductSearchPage } from "./product_search";

/** 開発用の設定のときに、どの画面にも常に出る帯。操作の結果ではないので数えない */
const ENV_BANNERS = ["デバッグモードが有効になっています。"];

export type CsvScreenDef = {
  /** 画面の名前（報告用） */
  名前: string;
  /** 画面のパス（管理画面の接頭辞より後ろ） */
  画面: string;
  /** 取込の要求のパス */
  取込: string;
};

export const 商品公開CSV登録: CsvScreenDef = { 名前: "商品公開CSV登録画面", 画面: "/product/status/csv_upload", 取込: "/product/status/import" };

export type CsvFile = { name: string; bytes: Buffer; mimeType?: string };

export type CsvUploadResult = {
  /** 送信の要求が出たか（ブラウザの入力チェックが止めたときは false） */
  送信した: boolean;
  /** 取込の要求の応答の状態 */
  応答: number | null;
  /** 取込の要求の応答の移動先（302 のとき） */
  移動先: string | null;
  /** ブラウザの入力チェックが送信を止めた項目と案内の文 */
  止めた項目: string[];
  /** 「CSVファイルのアップロード」を押したあとに確認モーダルが出たか */
  確認モーダル: boolean;
  /** 操作のあとに表示している画面のURL */
  移った画面: string;
  上部の成功: string[];
  上部のエラー: string[];
};

export function describeCsvUpload(r: CsvUploadResult): string {
  const list = (a: string[]) => (a.length ? a.join(" / ") : "なし");
  return [
    r.送信した ? `送信した（応答 ${r.応答}${r.移動先 ? `、移動先 ${r.移動先}` : ""}）` : `ブラウザの入力チェックで送信が止まった（${list(r.止めた項目)}）`,
    `確認モーダル: ${r.確認モーダル ? "出た" : "出なかった"}`,
    `表示中の画面 ${r.移った画面}`,
    `画面上部の成功: ${list(r.上部の成功)}`,
    `画面上部のエラー: ${list(r.上部のエラー)}`,
  ].join("。");
}

/** 商品のCSV取込の画面（アップロードの枠・雛形ファイル項目説明・CSVインポート履歴） */
export class ProductCsvUploadScreen {
  readonly form: Locator;
  readonly ファイル: Locator;
  readonly アップロードボタン: Locator;
  readonly 雛形ボタン: Locator;
  readonly 項目説明: Locator;

  constructor(readonly page: Page, readonly def: CsvScreenDef) {
    this.form = page.locator("form#upload-form");
    this.ファイル = this.form.locator('input[type="file"]');
    this.アップロードボタン = page.locator("#upload-button");
    this.雛形ボタン = page.locator("#download-template-button");
    this.項目説明 = page.locator("table.table-striped.table-bordered:not(#csv_import_history_table) tbody tr");
  }

  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl(this.def.画面));
    if (!res || !res.ok()) throw new Error(`${this.def.名前}を開けない（応答 ${res?.status() ?? "なし"}）`);
    await this.ready();
  }

  async ready(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.ファイル, `${this.def.名前}の「CSVファイル選択」`).toHaveCount(1);
    await expect(this.アップロードボタン, `${this.def.名前}の「CSVファイルのアップロード」`).toBeVisible();
  }

  /** 表示中の画面がこの画面か（画面のアドレスと、アップロードの枠が見えていること） */
  async isOnScreen(): Promise<boolean> {
    if (!new URL(this.page.url()).pathname.endsWith(this.def.画面)) return false;
    return this.form.isVisible();
  }

  async choose(file: CsvFile): Promise<void> {
    await this.ファイル.setInputFiles({ name: file.name, mimeType: file.mimeType ?? "text/csv", buffer: file.bytes });
  }

  /**
   * 「CSVファイルのアップロード」を押す。確認モーダルが出たら「OK」（確定）を押す。出なければそのまま取込の結果の画面を待つ
   * （出たかどうかは結果に残す）。ファイルを選んでいないときは、ブラウザの入力チェックが送信を止めることがある。そのときは、
   * 送信の要求が出ないことを確かめて、止めた項目を返す。
   */
  async pressUpload(): Promise<CsvUploadResult> {
    await this.page.waitForLoadState("load");
    const blocked = await this.form.evaluate((f) => Array.from((f as HTMLFormElement).elements)
      .filter((e) => "checkValidity" in e && !(e as HTMLInputElement).checkValidity())
      .map((e) => `${(e as HTMLInputElement).type === "file" ? "CSVファイル選択" : "（項目名なし）"}: ${(e as HTMLInputElement).validationMessage}`));
    const modal = this.page.locator(".modal.show");
    if (blocked.length) {
      const sent = this.page.waitForRequest((r) => r.method() === "POST", { timeout: 3_000 }).then(() => true, () => false);
      await this.アップロードボタン.click();
      const wasSent = await sent;
      if (wasSent) throw new Error(`ブラウザの入力チェックで止まるはずの送信が送られた（${blocked.join(" / ")}）`);
      return {
        送信した: false, 応答: null, 移動先: null, 止めた項目: blocked, 確認モーダル: await modal.isVisible(), 移った画面: this.page.url(),
        ...(await this.messages()),
      };
    }
    const response: Promise<Response> = this.page.waitForResponse((r) => r.request().method() === "POST"
      && new URL(r.url()).pathname.endsWith(this.def.取込), { timeout: 600_000 });
    // 取込の要求のあと、応答の移動先の画面が読み込まれるまで待つ（押す前の画面を結果として読まない）
    const navigated = this.page.waitForNavigation({ waitUntil: "load", timeout: 600_000 });
    await this.アップロードボタン.click();
    // 確認モーダル（設計書は押下後に表示すると定める）が出たら確定する。出なければ、送信がそのまま進む
    const outcome = await Promise.race([
      modal.waitFor({ state: "visible", timeout: 5_000 }).then(() => "modal" as const, () => "none" as const),
      response.then(() => "sent" as const),
    ]);
    let confirmed = false;
    if (outcome === "modal") {
      const ok = modal.getByRole("button", { name: /^(OK|はい|アップロード|登録|確定)$/ });
      await expect(ok, "確認モーダルの確定ボタン").toHaveCount(1);
      await ok.click();
      confirmed = true;
    }
    const res = await response;
    await navigated;
    await this.page.waitForLoadState("load");
    return {
      送信した: true, 応答: res.status(), 移動先: res.headers()["location"] ?? null, 止めた項目: [], 確認モーダル: confirmed,
      移った画面: this.page.url(), ...(await this.messages()),
    };
  }

  async upload(file: CsvFile): Promise<CsvUploadResult> {
    await this.choose(file);
    return this.pressUpload();
  }

  /** 画面上部（アップロードの枠より前）の成功とエラーの帯 */
  async messages(): Promise<{ 上部の成功: string[]; 上部のエラー: string[] }> {
    await this.page.waitForLoadState("load");
    const found = await this.page.evaluate(() => {
      const form = document.querySelector("form#upload-form");
      const visible = (e: Element) => {
        const s = window.getComputedStyle(e);
        return s.display !== "none" && s.visibility !== "hidden" && (e as HTMLElement).getClientRects().length > 0;
      };
      const text = (e: Element) => (e.textContent ?? "").replace(/\s+/g, " ").trim();
      const before = (e: Element) => !form || (!form.contains(e) && !!(form.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_PRECEDING));
      const pick = (selector: string) => {
        const all = Array.from(document.querySelectorAll(selector)).filter(visible);
        return all.filter((e) => !all.some((o) => o !== e && o.contains(e))).filter(before).map(text);
      };
      return { success: pick(".alert-success"), errors: pick(".alert-danger") };
    });
    const keep = (t: string) => t !== "" && !ENV_BANNERS.includes(t);
    return { 上部の成功: found.success.filter(keep), 上部のエラー: found.errors.filter(keep) };
  }

  /** 雛形ファイルダウンロードボタンを押し、ダウンロードしたファイルの名前とバイト列を返す */
  async downloadTemplate(): Promise<{ fileName: string; bytes: Buffer }> {
    await this.page.waitForLoadState("load");
    const [download] = await Promise.all([this.page.waitForEvent("download"), this.雛形ボタン.click()]);
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return { fileName: download.suggestedFilename(), bytes: Buffer.concat(chunks) };
  }

  /** 画面の雛形ファイル項目説明（項目名と説明文） */
  async itemDescriptions(): Promise<{ 項目名: string; 説明: string }[]> {
    return this.項目説明.evaluateAll((rows) => rows.map((row) => {
      const cells = row.querySelectorAll("td");
      const name = [...(cells[0]?.childNodes ?? [])].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent ?? "").join("").trim();
      return { 項目名: name, 説明: (cells[1]?.textContent ?? "").trim() };
    }));
  }
}

// ---- シードが使う商品の操作 ----

/** グッズ商品CSVの雛形の項目説明（「1:公開 2:非公開」の形）から、表示名に当たる値を読む */
export function goodsStatusValue(template: GoodsCsvTemplate, columnName: string, label: "公開" | "非公開"): string {
  const description = template.columns.find((column) => column.label === columnName)?.description;
  if (!description) throw new Error(`グッズ商品CSVの ${columnName} の説明が画面に無い`);
  const entries = [...description.matchAll(/(\d+)\s*:\s*([^\d:]+)/g)].map((m) => ({ value: m[1], label: m[2].trim() }));
  const hits = entries.filter((e) => e.label === label);
  if (hits.length !== 1) throw new Error(`グッズ商品CSVの ${columnName} の「${label}」の値を画面から一意に読めない: ${description}`);
  return hits[0].value;
}

/**
 * 商品マスター(検索入力)で商品名(日/英)に名前を入れて検索し、該当の1行の商品IDを返す（行の商品名・商品コードも確かめる）。
 * 公開状態の検索条件は初期値が「公開」だけなので、非公開の商品も出るように「公開」「非公開」の両方にチェックを入れる。
 */
export async function findProductIdByName(page: Page, name: string, code: string): Promise<string> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.ensureDetailVisible();
  await search.field("product_name").fill(name);
  const statuses = await search.choiceOptions("status");
  for (const label of ["公開", "非公開"]) {
    const o = statuses.find((s) => s.label === label);
    if (!o) throw new Error(`商品マスターの検索欄「公開状態」に「${label}」が無い（${statuses.map((s) => s.label).join("、")}）`);
    await search.setChecked("status", o.value, true);
  }
  await search.submitAndWaitForResult();
  const rows = page.locator('tr[id^="ex-product-"]');
  await expect(rows, `商品名「${name}」の検索結果は1件`).toHaveCount(1);
  const row = rows.first();
  await expect(row.locator("td:nth-child(3) a"), `${name} の商品名`).toHaveText(name);
  await expect(row.locator("td:nth-child(4)"), `${name} の商品コード`).toHaveText(code);
  const id = (await row.locator("td:nth-child(2)").innerText()).trim();
  if (!/^\d+$/.test(id)) throw new Error(`${name} の採番商品IDを画面から読めない: ${id}`);
  await expect(row, `${name} の採番IDと結果行`).toHaveAttribute("id", `ex-product-${id}`);
  return id;
}

/** 商品マスターで商品名(日/英)・公開状態「公開」「非公開」で検索した該当件数（前の実行の残りを見るため） */
export async function countProductsByName(page: Page, name: string): Promise<number> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.ensureDetailVisible();
  await search.field("product_name").fill(name);
  for (const o of await search.choiceOptions("status")) await search.setChecked("status", o.value, true);
  await search.submitAndWaitForResult();
  const total = page.getByText(/^検索結果：\d+件が該当しました$/);
  if (await total.count() === 0) return 0;
  return Number(/(\d+)件/.exec((await total.first().innerText()))![1]);
}

export type PublishState = { 商品公開ステータス: "公開" | "非公開"; 支店の商品公開ステータス: "公開" | "非公開" };

/**
 * いま開いている商品マスター(検索結果)の、商品IDの行の商品名を押して商品登録編集画面を開き、
 * 公開状態（商品公開ステータス）と支店の商品公開ステータスを選び、割引率に選択肢の先頭を選んで「商品を登録」を押す。
 * 保存のあと、画面を開き直して選んだ値が残っていることを確かめる。選んだ値は onIssue に渡す（報告に出す）。
 */
export async function savePublishState(page: Page, 商品ID: string, v: PublishState, onIssue: (m: string) => void): Promise<void> {
  const link = page.locator(`tr#ex-product-${商品ID} td:nth-child(3) a`);
  await expect(link, `商品マスター(検索結果)の商品ID ${商品ID} の商品名のリンク`).toHaveCount(1);
  await Promise.all([page.waitForURL((u) => u.pathname.endsWith(`/product/product/${商品ID}/edit`)), link.click()]);
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `商品ID ${商品ID} の商品登録編集画面`).toBeVisible();
  const status = form.locator('select[name="admin_product[Status]"]');
  await expect(status, "公開状態（商品公開ステータス）の欄").toHaveCount(1);
  await status.selectOption({ label: v.商品公開ステータス });
  const branch = form.locator('input[type="radio"][name="admin_product[isBranchPublished]"]');
  await expect(branch, "支店の商品公開ステータスの欄").toHaveCount(2);
  const choice = form.getByLabel(v.支店の商品公開ステータス, { exact: true }).and(branch);
  await expect(choice, `支店の商品公開ステータスの「${v.支店の商品公開ステータス}」`).toHaveCount(1);
  await choice.check();
  const discount = form.locator('select[name="admin_product[Discount]"]');
  await expect(discount, "割引率の欄").toHaveCount(1);
  const discounts = await discount.locator("option").evaluateAll((nodes) => nodes
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).filter((o) => o.value !== ""));
  if (discounts.length === 0) throw new Error("割引率に選べる値が無い");
  await discount.selectOption(discounts[0].value);
  onIssue(`商品ID ${商品ID}: 割引率に「${discounts[0].label}」を選んだ（正本: 販売割引率に登録済みのもの）`);
  await expect(form.locator('input[type="radio"][name="admin_product[RegionRestriction]"]:checked'), "地域別販売制限が選ばれている").toHaveCount(1);
  const save = form.locator('button[type="submit"]').filter({ hasText: /^\s*商品を登録\s*$/ });
  await expect(save, "「商品を登録」ボタン").toHaveCount(1);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), save.click()]);
  for (const w of await expectSaved(page, `商品ID ${商品ID} の「商品を登録」`)) onIssue(w);
  await expect(await readPublishState(page, 商品ID), `商品ID ${商品ID} の保存後の公開状態`).toEqual(v);
}

/** 商品登録編集画面を開き、公開状態（商品公開ステータス）と支店の商品公開ステータスの選択を読む */
export async function readPublishState(page: Page, 商品ID: string): Promise<{ 商品公開ステータス: string; 支店の商品公開ステータス: string }> {
  await page.goto(adminUrl(`/product/product/${商品ID}/edit`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `商品ID ${商品ID} の商品登録編集画面`).toBeVisible();
  const status = ((await form.locator('select[name="admin_product[Status]"] option:checked').textContent()) ?? "").trim();
  const branch = await form.locator('input[type="radio"][name="admin_product[isBranchPublished]"]:checked').evaluateAll((nodes) =>
    nodes.map((n) => (n as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? ""));
  return { 商品公開ステータス: status, 支店の商品公開ステータス: branch.join("、") };
}

// ---- 公開側の商品詳細画面 ----

export type FrontDetail = {
  /** 開いたアドレス */
  url: string;
  /** 応答の状態 */
  応答: number;
  /** 商品名が画面に見えているか */
  商品名が見える: boolean;
  /** 画面の見出し（報告用） */
  見出し: string;
};

/**
 * 公開側の商品詳細画面を、管理画面にログインしていない新しいブラウザセッション（お客様と同じ見え方）で開く。
 * 管理画面にログインしたセッションでは、アプリは公開状態にかかわらず商品詳細を表示する（管理者の確認用）ため、分けて開く。
 * shopPath は本店なら "/ja"、支店なら "/ja/<支店URL>"。
 */
export async function openFrontProductDetail(browser: Browser, shopPath: string, 商品ID: string, 商品名: string): Promise<FrontDetail> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    const url = `${BASE_URL}${shopPath}/products/detail/${商品ID}`;
    const res = await page.goto(url);
    if (!res) throw new Error(`公開側の商品詳細画面（${url}）の応答が無い`);
    await page.waitForLoadState("load");
    const shown = await page.getByText(商品名, { exact: false }).first().isVisible().catch(() => false);
    const heading = ((await page.locator("h1, h2").first().textContent().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
    return { url, 応答: res.status(), 商品名が見える: shown, 見出し: heading };
  } finally {
    await context.close();
  }
}

/** 公開側のトップ画面が開けるか（応答の状態）を、ログインしていない新しいブラウザセッションで見る */
export async function frontTopStatus(browser: Browser, shopPath: string): Promise<number> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    const res = await page.goto(`${BASE_URL}${shopPath}/`);
    return res?.status() ?? 0;
  } finally {
    await context.close();
  }
}
