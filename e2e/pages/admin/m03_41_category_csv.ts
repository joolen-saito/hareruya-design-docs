/**
 * M03-41 カテゴリCSV登録の画面操作。セレクタはこのファイルにだけ書く。
 *
 * カテゴリCSV登録画面（アップロードの枠・雛形ファイルダウンロード・インポート履歴）と、
 * シードが使うカテゴリ一覧の操作（親のカテゴリ名を押して子カテゴリを作成する・カテゴリツリーで名前を探して削除する・
 * CSVダウンロードの行を読む・CSV出力項目設定の項目を読む）を持つ。
 * カテゴリ一覧の画面の部品は、M03-45 の CategoryListPage を使う。
 */
import { expect, Locator, Page, Response } from "@playwright/test";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { adminUrl } from "../../lib/session";
import { CategoryInput } from "./category";
import { expectSaved } from "./common";
import { CategoryListPage } from "./m03_45_category_list";
import { CaseCsvFile } from "./m03_41_csv_file";

const UPLOAD_PATH = "/product/category/category_bulk_csv_upload";
export const categoryCsvUploadUrl = () => adminUrl(UPLOAD_PATH);

/** 開発用の設定のときに、どの画面にも常に出る帯。操作の結果ではないので数えない */
const ENV_BANNERS = ["デバッグモードが有効になっています。"];

/** 画面の案内（成功・エラー）を、アップロードの枠との位置で分けたもの */
export type UploadMessages = {
  /** 画面上部（アップロードの枠より前）の成功の帯 */
  上部の成功: string[];
  /** 画面上部（アップロードの枠より前）のエラーの帯 */
  上部のエラー: string[];
  /** アップロードの枠より後ろ（フォーム下）のエラーの表示 */
  フォーム下のエラー: string[];
  /** アップロードの枠の中（入力項目の直下）のエラーの表示 */
  入力項目直下のエラー: string[];
};

export type UploadResult = UploadMessages & {
  /** 送信の要求が出たか（ブラウザの入力チェックが止めたときは false） */
  送信した: boolean;
  /** 取込の要求の応答の状態 */
  応答: number | null;
  /** ブラウザの入力チェックが送信を止めた項目と案内の文 */
  止めた項目: string[];
  /** 操作のあとに表示している画面のURL */
  移った画面: string;
};

/** 報告に載せる1行の要約 */
export function describeUpload(r: UploadResult): string {
  const list = (a: string[]) => (a.length ? a.join(" / ") : "なし");
  return [
    r.送信した ? `送信した（応答 ${r.応答}）` : `ブラウザの入力チェックで送信が止まった（${list(r.止めた項目)}）`,
    `表示中の画面 ${r.移った画面}`,
    `画面上部の成功: ${list(r.上部の成功)}`,
    `画面上部のエラー: ${list(r.上部のエラー)}`,
    `アップロードフォーム下のエラー: ${list(r.フォーム下のエラー)}`,
    `入力項目直下のエラー: ${list(r.入力項目直下のエラー)}`,
  ].join("。");
}

export class CategoryCsvUploadPage {
  readonly form: Locator;
  readonly ファイル: Locator;
  readonly アップロードボタン: Locator;
  readonly 雛形ボタン: Locator;
  readonly 見出し: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#upload-form");
    this.ファイル = this.form.locator('input[type="file"]');
    this.アップロードボタン = page.locator("#upload-button");
    this.雛形ボタン = page.locator("#download-template-button");
    this.見出し = page.locator(".c-pageTitle__subTitle");
  }

  async ready(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.ファイル, "カテゴリCSV登録画面のファイルを選択の欄").toHaveCount(1);
  }

  /** カテゴリCSV登録画面を開く */
  async open(): Promise<void> {
    await this.page.goto(categoryCsvUploadUrl());
    await this.ready();
  }

  /** 表示中の画面がカテゴリCSV登録画面か（画面URLと、アップロードの枠が見えていること） */
  async isOnScreen(): Promise<boolean> {
    const path = new URL(this.page.url()).pathname;
    if (!path.endsWith(UPLOAD_PATH)) return false;
    return this.form.isVisible();
  }

  /** ファイルを選択で、ファイルを選ぶ */
  async choose(file: CaseCsvFile): Promise<void> {
    await this.ファイル.setInputFiles({ name: file.name, mimeType: "text/csv", buffer: file.bytes });
  }

  /**
   * 「CSVファイルのアップロード」ボタンを押す。ファイルを選んでいないときは、ブラウザの入力チェック（必須の欄）が
   * 送信を止めることがある。そのときは、送信の要求が出ないことを確かめて、止めた項目を返す。
   */
  async pressUpload(): Promise<UploadResult> {
    await this.page.waitForLoadState("load");
    const blocked = await this.form.evaluate((f) => Array.from((f as HTMLFormElement).elements)
      .filter((e) => "checkValidity" in e && !(e as HTMLInputElement).checkValidity())
      .map((e) => `${(e as HTMLInputElement).type === "file" ? "ファイルを選択" : "（項目名なし）"}: ${(e as HTMLInputElement).validationMessage}`));
    if (blocked.length) {
      const sent = this.page.waitForRequest((r) => r.method() === "POST", { timeout: 3_000 }).then(() => true, () => false);
      await this.アップロードボタン.click();
      if (await sent) throw new Error(`ブラウザの入力チェックで止まるはずの送信が送られた（${blocked.join(" / ")}）`);
      return { 送信した: false, 応答: null, 止めた項目: blocked, 移った画面: this.page.url(), ...(await this.messages()) };
    }
    const response: Promise<Response> = this.page.waitForResponse((r) => r.request().method() === "POST"
      && new URL(r.url()).pathname.endsWith("/product/category/import"));
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.アップロードボタン.click()]);
    const status = (await response).status();
    return { 送信した: true, 応答: status, 止めた項目: [], 移った画面: this.page.url(), ...(await this.messages()) };
  }

  /** ファイルを選んで「CSVファイルのアップロード」を押す */
  async upload(file: CaseCsvFile): Promise<UploadResult> {
    await this.choose(file);
    return this.pressUpload();
  }

  /** 画面の案内を、アップロードの枠との位置（前・中・後ろ）で分けて読む */
  async messages(): Promise<UploadMessages> {
    await this.page.waitForLoadState("load");
    const found = await this.page.evaluate(() => {
      const form = document.querySelector("form#upload-form");
      const visible = (e: Element) => {
        const s = window.getComputedStyle(e);
        return s.display !== "none" && s.visibility !== "hidden" && (e as HTMLElement).getClientRects().length > 0;
      };
      const text = (e: Element) => (e.textContent ?? "").replace(/\s+/g, " ").trim();
      const pick = (selector: string) => {
        const all = Array.from(document.querySelectorAll(selector)).filter(visible);
        // 入れ子の表示（帯の中の箇条など）は、外側の表示だけを数える
        return all.filter((e) => !all.some((o) => o !== e && o.contains(e)));
      };
      const where = (e: Element): "前" | "中" | "後" => {
        if (!form) return "前";
        if (form.contains(e)) return "中";
        return form.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING ? "後" : "前";
      };
      const errors = pick(".alert-danger, .invalid-feedback, .form-error-message")
        .map((e) => ({ at: where(e), t: text(e) }));
      const success = pick(".alert-success").map((e) => ({ at: where(e), t: text(e) }));
      return { errors, success };
    });
    const keep = (t: string) => t !== "" && !ENV_BANNERS.includes(t);
    return {
      上部の成功: found.success.filter((m) => m.at === "前" && keep(m.t)).map((m) => m.t),
      上部のエラー: found.errors.filter((m) => m.at === "前" && keep(m.t)).map((m) => m.t),
      フォーム下のエラー: found.errors.filter((m) => m.at === "後" && keep(m.t)).map((m) => m.t),
      入力項目直下のエラー: found.errors.filter((m) => m.at === "中" && keep(m.t)).map((m) => m.t),
    };
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

  /**
   * 雛形ファイルの文字コード。雛形はCSV出力の設定（文字コード）に従って書き出される（設計書 入出力「雛形ファイル」。
   * UTF-8 のときは先頭に BOM が付く）。見出しの「カテゴリ名(日)」が UTF-8 で読めるか、シフトJISで読めるかで決める。
   */
  async templateEncoding(): Promise<"UTF-8" | "シフトJIS"> {
    const { bytes } = await this.downloadTemplate();
    try {
      if (new TextDecoder("utf-8", { fatal: true }).decode(bytes).includes("カテゴリ名(日)")) return "UTF-8";
    } catch { /* UTF-8 として読めない */ }
    if (new TextDecoder("shift_jis").decode(bytes).includes("カテゴリ名(日)")) return "シフトJIS";
    throw new Error("カテゴリCSV登録画面の雛形ファイルの文字コードが、UTF-8 でもシフトJISでも読めない");
  }

  /** 雛形ファイルの見出し行（列名の並び）を読む */
  async templateColumns(): Promise<string[]> {
    const { bytes } = await this.downloadTemplate();
    const [headers] = parseCsv(decodeCsvBytes(bytes));
    if (!headers || !headers.includes("カテゴリ名(日)") || !headers.includes("親カテゴリID")) {
      throw new Error(`カテゴリCSV登録画面の雛形ファイルの見出しを読めない: ${headers?.join(",")}`);
    }
    return headers;
  }
}

// ---- シードが使うカテゴリ一覧の操作 ----

/** カテゴリツリーの1項目（「ID:n 名称 (直下の件数)」）。閉じた枝の中の項目も含む */
export type TreeEntry = { id: string; name: string };

/** カテゴリ一覧（最上位）を開き、カテゴリツリーの項目をすべて読む */
export async function readCategoryTree(page: Page): Promise<TreeEntry[]> {
  const list = new CategoryListPage(page);
  await list.openTop();
  const texts = await page.locator("#ex-secondaryCol .c-directoryTree a").evaluateAll((links) => links
    .map((a) => (a.textContent ?? "").replace(/\s+/g, " ").trim()));
  return texts.map((t) => {
    const m = /^ID:(\d+)\s+(.*?)\s+\(\d+\)$/.exec(t);
    if (!m) throw new Error(`カテゴリツリーの表示を読めない: ${t}`);
    return { id: m[1], name: m[2] };
  });
}

/**
 * カテゴリツリーで条件に合うカテゴリが無いことを確かめる。あれば、そのカテゴリが並ぶ一覧（親の一覧、最上位なら最上位の一覧）で
 * 行の削除ボタンを押して削除確認モーダルの「削除」を押し、もう一度ツリーで確かめる。消したカテゴリIDを返す。
 * 子カテゴリか商品があって削除ボタンが押せないときは、片付け方の判断が要るので止める。
 */
export async function purgeCategoriesInTree(page: Page, match: (e: TreeEntry) => boolean, what: string,
  onWarning: (w: string) => void): Promise<string[]> {
  const list = new CategoryListPage(page);
  const removed: string[] = [];
  for (let round = 0; ; round += 1) {
    const hits = (await readCategoryTree(page)).filter(match);
    if (hits.length === 0) return removed;
    if (round >= 3) throw new Error(`${what}: 削除したのに、カテゴリツリーに残る（${hits.map((h) => `ID:${h.id} ${h.name}`).join("、")}）`);
    for (const h of hits) {
      await list.openTop();
      if ((await list.treeLink(h.id).count()) === 0) continue; // 先に消した親の配下だった
      const parent = await list.treeParentOf(h.id);
      if (parent) await list.openChildrenOf(parent); else await list.openTop();
      const row = (await list.rowValues()).find((v) => v.id === h.id);
      if (!row) throw new Error(`${what}: カテゴリID ${h.id} の行が、親の一覧に無い`);
      if (row.deleteDisabled) {
        throw new Error(`${what}: 前の実行で残ったカテゴリID ${h.id}「${h.name}」は、子カテゴリか商品があって削除ボタンが押せない。片付け方の判断が要る`);
      }
      await list.openDeleteModal(h.id);
      await list.confirmDeleteOf(h.id);
      await expect(list.rowById(h.id), `${what}: カテゴリID ${h.id} を削除したのに一覧に残っている`).toHaveCount(0);
      removed.push(h.id);
      onWarning(`${what}: 前の実行で残っていたカテゴリID ${h.id}「${h.name}」を画面から削除した`);
    }
  }
}

/**
 * カテゴリ一覧で親のカテゴリ名を押して開き（親の親の一覧、親が最上位なら最上位の一覧から）、
 * カテゴリ名（日）・カテゴリ名（英）・検索パラメーターを入れ、フロント非表示フラグと支店非表示フラグにチェックを付けずに
 * 「子カテゴリ作成」を押す。開いた一覧の行のうち、登録で増えた行のカテゴリIDを返す（同じ名称の行が前からあっても取り違えない）。
 */
export async function createChildFromList(page: Page, parent: { id: string; parentOfParent: string | null },
  v: Pick<CategoryInput, "nameEn" | "searchParameters"> & { nameJp: string }, onWarning: (w: string) => void): Promise<string> {
  const list = new CategoryListPage(page);
  if (parent.parentOfParent) await list.openChildrenOf(parent.parentOfParent); else await list.openTop();
  await list.clickName(parent.id);
  const before = (await list.rowValues()).filter((r) => r.nameJp === v.nameJp).map((r) => r.id);
  await list.fill({ ...v, frontHide: false, branchHide: false });
  await list.submitAndWait();
  for (const w of await expectSaved(page, `カテゴリ「${v.nameJp}」の子カテゴリ作成`)) onWarning(w);
  expect(new URL(page.url()).pathname, "子カテゴリ作成のあとは親カテゴリの一覧へ戻る").toBe(new URL(adminUrl(`/product/category/${parent.id}`)).pathname);
  const added = (await list.rowValues()).filter((r) => r.nameJp === v.nameJp && !before.includes(r.id));
  if (added.length !== 1) throw new Error(`カテゴリ「${v.nameJp}」の子カテゴリ作成で増えた行が ${added.length} 件`);
  if (before.length > 0) onWarning(`親カテゴリ ${parent.id} の下に同名の「${v.nameJp}」が前から ${before.length} 件あり、登録で増えた行を使った`);
  return added[0].id;
}

/** カテゴリ一覧の「CSVダウンロード」で出力したカテゴリCSVの、カテゴリIDの行（列名→値） */
export async function exportedCategoryRow(page: Page, id: string): Promise<Record<string, string>> {
  const list = new CategoryListPage(page);
  await list.openTop();
  const hits = (await list.downloadCsv()).filter((r) => r["カテゴリID"] === id);
  if (hits.length !== 1) throw new Error(`カテゴリ一覧のCSVダウンロードに、カテゴリID ${id} の行が ${hits.length} 件ある（1件のはず）`);
  return hits[0];
}

/**
 * カテゴリ一覧の「CSV出力項目設定」ボタンからCSV出力項目設定画面（対象はカテゴリCSV）を開き、
 * 「出力する項目」の並びと「出力しない項目」を読む（設定は変えない）。
 */
export async function readCategoryCsvOutputItems(page: Page): Promise<{ 出力する項目: string[]; 出力しない項目: string[] }> {
  const list = new CategoryListPage(page);
  await list.openTop();
  const button = list.buttonByText("CSV出力項目設定");
  await expect(button, "カテゴリ一覧の「CSV出力項目設定」ボタン").toHaveCount(1);
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), button.click()]);
  await page.waitForLoadState("load");
  await expect(page.locator("#csv-type option:checked"), "CSV出力項目設定画面の対象のCSV").toHaveText("カテゴリCSV");
  const labels = (id: string) => page.locator(`#${id} option`).evaluateAll((nodes) => nodes.map((n) => (n.textContent ?? "").trim()));
  return { 出力する項目: await labels("csv-output"), 出力しない項目: await labels("csv-not-output") };
}
