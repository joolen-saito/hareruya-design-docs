/**
 * M15-10 アーキタイプ登録CSV（管理画面）の画面部品。セレクタはここだけに置く。
 * 検索画面の部品は M15-08（m15_08_archetype_search.ts）を使う。アーキタイプ編集画面の部品は M15-09 が持つので、
 * ここにはシードで使う最小の登録・削除の操作だけを置く（M15-08 の新規登録は公開状態を「公開」に決め打ちし、代表カードを先頭の行で選ぶため、
 * シード表の「非公開を選ぶ」「初期表示のまま」「ID列が〔…〕の行の選択」に合わない）。
 *
 * 画面の表示名（アプリの翻訳ファイルと画面の作りで確かめたもの）:
 * - アーキタイプ登録CSVアップロード画面: 題名「アーキタイプ登録CSVアップロード」、ボタン「ファイルを選択」（隠したファイル欄を開く）、
 *   送信ボタン「CSVファイルをアップロード」（正本の「CSVファイルのアップロード」。ファイルを選ぶまで押せない）。
 *   成功のときは同じ画面へ戻して「CSVファイルをアップロードしました」、失敗のときは同じ画面に赤い帯でエラーを出す。
 * - アーキタイプ編集画面: 「代表カード選択」で開く代表カード検索の、カード名の欄・「完全一致」・「検索」、行のボタン「選択」。削除は「削除」→確認ダイアログ。
 * - カード詳細(編集)画面: 詳細情報ごとの画像に、言語（日本語名の選択肢）と表示面（表面・裏面）。
 */
import fs from "node:fs";
import path from "node:path";
import { expect, Locator, Page } from "@playwright/test";
import { STATE_DIR } from "../../config/env";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { ArchetypeSearchPage, pathOf, 検索入力のパス } from "./m15_08_archetype_search";

type Issue = (m: string) => void;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const exact = (s: string) => new RegExp(`^\\s*${esc(s)}\\s*$`);

// ---------------------------------------------------------------------------
// アーキタイプ登録CSVアップロード画面
// ---------------------------------------------------------------------------

export type アップロードの結果 = { 送った: boolean; 応答: number | null; url: string; 本文: string };

export class ArchetypeCsvPage {
  constructor(readonly page: Page) {}

  get ファイルを選択ボタン(): Locator { return this.page.locator("#file-select"); }
  get ファイル欄(): Locator { return this.page.locator("#upload-form input[type=file]"); }
  get 選んだファイル名(): Locator { return this.page.locator("#admin_csv_import_import_file_name"); }
  get アップロードボタン(): Locator { return this.page.locator("#upload-button"); }
  get トークン欄(): Locator { return this.page.locator('#upload-form input[name$="[_token]"]'); }
  get 完了メッセージ(): Locator { return this.page.locator(".alert-success"); }
  get エラーの帯(): Locator { return this.page.locator(".c-primaryCol .alert-danger"); }

  /** アーキタイプ登録CSVアップロード画面を開く */
  async 開く(): Promise<void> {
    await this.page.goto(adminUrl("/archetype/csv_import"));
    await this.読み込みを待つ();
  }
  async 読み込みを待つ(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.ファイルを選択ボタン, "アーキタイプ登録CSVアップロード画面の「ファイルを選択」").toBeVisible();
  }

  /** 「ファイルを選択」を押し、ファイル選択のウィンドウが開いたか（ブラウザが開こうとしたファイル選択を、Playwright が受け取ったか）を返す */
  async ファイル選択を開く(): Promise<boolean> {
    const chooser = this.page.waitForEvent("filechooser", { timeout: 10_000 }).then(() => true, () => false);
    await this.ファイルを選択ボタン.click();
    return chooser;
  }

  /** 「ファイルを選択」を押し、開いたファイル選択でファイルを選ぶ（利用者と同じく、ボタンから選ぶ） */
  async ファイルを選ぶ(file: string): Promise<void> {
    const [chooser] = await Promise.all([this.page.waitForEvent("filechooser"), this.ファイルを選択ボタン.click()]);
    await chooser.setFiles(file);
    await expect(this.選んだファイル名, "選んだファイルの名前の表示").toHaveText(exact(path.basename(file)));
  }

  /** 開発者ツールでなりすまし対策トークンの入力要素を消す */
  async トークンを消す(): Promise<void> {
    await expect(this.トークン欄, "なりすまし対策トークンの入力要素").toHaveCount(1);
    await this.トークン欄.evaluate((e) => e.remove());
    await expect(this.トークン欄, "なりすまし対策トークンの入力要素（消したあと）").toHaveCount(0);
  }
  /** 開発者ツールでなりすまし対策トークンの値を書き換える */
  async トークンを書き換える(v: string): Promise<void> {
    await expect(this.トークン欄, "なりすまし対策トークンの入力要素").toHaveCount(1);
    await this.トークン欄.evaluate((e, x) => { (e as HTMLInputElement).value = x; }, v);
  }

  /** 「CSVファイルをアップロード」を押す。送った要求への応答（転送の前の応答）と、移った画面を返す */
  async アップロードを押す(): Promise<アップロードの結果> {
    await expect(this.アップロードボタン, "「CSVファイルをアップロード」が押せる").toBeEnabled();
    let status: number | null = null;
    const res = this.page.waitForResponse((r) => r.request().method() === "POST" && r.request().isNavigationRequest(), { timeout: 60_000 })
      .then((r) => { status = r.status(); }, () => undefined);
    const nav = this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).then(() => true, () => false);
    await this.アップロードボタン.click();
    const 送った = await nav;
    await res;
    await this.page.waitForLoadState("load");
    const 本文 = (await this.page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").trim();
    return { 送った, 応答: status, url: this.page.url(), 本文 };
  }

  async 完了メッセージの文(): Promise<string[]> {
    return (await this.完了メッセージ.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }
  async エラーの文(): Promise<string[]> {
    return (await this.エラーの帯.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }
}

export const CSVアップロードのパス = (): string => pathOf(adminUrl("/archetype/csv_import"));
export const 完了の文 = "CSVファイルをアップロードしました";

/** 画面の題名（ページの見出し） */
export async function 題名(page: Page): Promise<string> {
  const h = page.locator("h2.c-pageTitle__title").first();
  return (await h.count()) ? (await h.innerText()).trim() : "";
}

// ---------------------------------------------------------------------------
// 取込ファイル（試験端末に保存する）
// ---------------------------------------------------------------------------

export const アーキタイプCSVの見出し = ["アーキタイプ名（日本語）", "アーキタイプ名（英語）", "代表カード名", "色", "フォーマット"];
export type CSVの形 = { BOM?: boolean; 改行?: "\n" | "\r\n" };

/** 見出し行とデータ行を組む。カンマ・引用符・改行を含む値だけ二重引用符で囲む */
export function アーキタイプCSVを組む(rows: string[][], 形: CSVの形 = {}): Buffer {
  const cell = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const nl = 形.改行 ?? "\n";
  const body = Buffer.from([アーキタイプCSVの見出し, ...rows].map((r) => r.map(cell).join(",")).join(nl) + nl, "utf8");
  return 形.BOM ? Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), body]) : body;
}

const DIR = path.join(STATE_DIR, "m15-10");
/** 取込ファイルを試験端末（.state/m15-10）に保存し、その場所を返す */
export function 取込ファイルを保存する(name: string, rows: string[][], 形: CSVの形 = {}): string {
  fs.mkdirSync(DIR, { recursive: true });
  const file = path.join(DIR, name);
  fs.writeFileSync(file, アーキタイプCSVを組む(rows, 形));
  return file;
}
/** シードが保存した取込ファイルの場所（無ければ止める） */
export function 取込ファイル(name: string): string {
  const file = path.join(DIR, name);
  if (!fs.existsSync(file)) throw new Error(`取込ファイル ${name} が無い（シードが作っていない）`);
  return file;
}

// ---------------------------------------------------------------------------
// フォーマット一覧（リンクの文は「日本語名 / 英語名」）
// ---------------------------------------------------------------------------

export type フォーマットの行 = { ID: string; 名日: string; 名英: string };

/** フォーマット一覧で、英語名が一致するフォーマット（ID・日本語名） */
export async function フォーマットを英語名で読む(page: Page, 名英: string): Promise<フォーマットの行[]> {
  const res = await page.goto(adminUrl("/format"));
  if (!res || !res.ok()) throw new Error(`フォーマット一覧を開けない（応答 ${res?.status() ?? "なし"}）`);
  await page.waitForLoadState("load");
  const all = await page.locator('a[href*="/format/"][href$="/edit"]').evaluateAll((links) => links.map((a) => {
    const t = (a.textContent ?? "").replace(/\s+/g, " ").trim();
    const k = t.lastIndexOf(" / ");
    const m = /\/format\/(\d+)\/edit/.exec((a as HTMLAnchorElement).getAttribute("href") ?? "");
    return { ID: m?.[1] ?? "", 名日: k >= 0 ? t.slice(0, k).trim() : t, 名英: k >= 0 ? t.slice(k + 3).trim() : "" };
  }));
  return all.filter((r) => r.ID && r.名英 === 名英);
}

// ---------------------------------------------------------------------------
// MTGマスターデータ管理（種別の選択肢の表示名で開く）
// ---------------------------------------------------------------------------

export type マスターの行 = { 行: string; 日本語名: string; 英語名: string; 並び順: number };

async function マスターを開く(page: Page, 種別: string): Promise<void> {
  await page.goto(adminUrl("/data/mtg_master_data"));
  await page.waitForLoadState("load");
  await page.locator('select[name="entity"]').selectOption({ label: 種別 });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.locator('form[method="get"] button[type="submit"]').click(),
  ]);
  await page.waitForLoadState("load");
  await expect(page.locator("form#edit_form table.mtg-master-table"), `${種別}の一覧`).toBeVisible();
}

/** マスターの既存の行（入力行を除く）。行は画面の行の番号（マスターのID） */
export async function マスターの行を読む(page: Page, 種別: string): Promise<マスターの行[]> {
  await マスターを開く(page, 種別);
  return page.locator("form#edit_form table.mtg-master-table tbody tr").evaluateAll((trs) => {
    const out: { 行: string; 日本語名: string; 英語名: string; 並び順: number }[] = [];
    for (const tr of trs) {
      const first = tr.querySelector("input[name], select[name]") as HTMLInputElement | null;
      const m = /^rows\[(.+?)\]\[/.exec(first?.getAttribute("name") ?? "");
      if (!m || m[1] === "new") continue;
      const v = (f: string) => ((tr.querySelector(`[name="rows[${m[1]}][${f}]"]`) as HTMLInputElement | null)?.value ?? "");
      out.push({ 行: m[1], 日本語名: v("name_jp").trim(), 英語名: v("name_en").trim(), 並び順: Number(v("sort_no")) });
    }
    return out;
  });
}

/** 日本語名の行が無ければ、最下行の空行に日本語名・英語名・コード・表示順（既存の最大＋1）を入れて「登録」を押す。登録したら true */
export async function マスターの行を足す(page: Page, 種別: string, v: { 日本語名: string; 英語名: string; コード?: string }, what: string): Promise<boolean> {
  const rows = await マスターの行を読む(page, 種別);
  if (rows.some((r) => r.日本語名 === v.日本語名)) return false;
  const f = (n: string) => page.locator(`[name="rows[new][${n}]"]`);
  await f("name_jp").fill(v.日本語名);
  await f("name_en").fill(v.英語名);
  if (v.コード !== undefined && (await f("code").count())) await f("code").fill(v.コード);
  if (await f("sort_no").count()) await f("sort_no").fill(String(Math.max(0, ...rows.map((r) => r.並び順).filter(Number.isFinite)) + 1));
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator('button[type="submit"][form="edit_form"]').click()]);
  await page.waitForLoadState("load");
  await expectSaved(page, `${what}: ${種別}「${v.日本語名}」の登録`);
  if (!(await マスターの行を読む(page, 種別)).some((r) => r.日本語名 === v.日本語名)) throw new Error(`${what}: ${種別}「${v.日本語名}」を登録したが、一覧に行ができていない`);
  return true;
}

/** 日本語名の列が一致する行があれば、その行の値をすべて消して「登録」を押す。消したら true */
export async function マスターの行を空にする(page: Page, 種別: string, 日本語名: string, what: string): Promise<boolean> {
  const hit = (await マスターの行を読む(page, 種別)).filter((r) => r.日本語名 === 日本語名);
  if (hit.length === 0) return false;
  for (const h of hit) {
    const inputs = page.locator(`form#edit_form input[name^="rows[${h.行}]["]`);
    for (const input of await inputs.all()) {
      if ((await input.getAttribute("type")) === "hidden") continue;
      if (await input.getAttribute("readonly")) throw new Error(`${what}: ${種別}「${日本語名}」は固定の行で消せない`);
      await input.fill("");
    }
  }
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator('button[type="submit"][form="edit_form"]').click()]);
  await page.waitForLoadState("load");
  await expectSaved(page, `${what}: ${種別}「${日本語名}」の行の削除`);
  if ((await マスターの行を読む(page, 種別)).some((r) => r.日本語名 === 日本語名)) throw new Error(`${what}: ${種別}「${日本語名}」の行を消したが、一覧に残っている`);
  return true;
}

// ---------------------------------------------------------------------------
// カードセット（リリース日つきで登録する）
// ---------------------------------------------------------------------------

/** カードセット管理(一覧)画面の「新規登録」から、カードセット詳細(登録)画面で名（日本語）・名（英語）・略称・リリース日を入れて「登録」を押す */
export async function カードセットを登録する(page: Page, v: { 名: string; 略称: string; リリース日: string }, what: string): Promise<string[]> {
  await page.goto(adminUrl("/cardset"));
  await page.waitForLoadState("load");
  const add = page.locator("a.btn").filter({ hasText: exact("新規登録") }).first();
  await expect(add, `${what}: カードセット管理(一覧)画面の「新規登録」`).toBeVisible();
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), add.click()]);
  await page.locator("#admin_cardset_nameJp").fill(v.名);
  await page.locator("#admin_cardset_nameEn").fill(v.名);
  await page.locator("#admin_cardset_code").fill(v.略称);
  const [y, m, d] = v.リリース日.split("-");
  const date = page.locator('input[name="admin_cardset[releaseDate]"]');
  if (await date.count()) await date.fill(v.リリース日);
  else {
    await page.locator('[name="admin_cardset[releaseDate][year]"]').selectOption(String(Number(y)));
    await page.locator('[name="admin_cardset[releaseDate][month]"]').selectOption(String(Number(m)));
    await page.locator('[name="admin_cardset[releaseDate][day]"]').selectOption(String(Number(d)));
  }
  await page.getByRole("button", { name: "登録", exact: true }).click();
  return expectSaved(page, `${what}: カードセット「${v.名}」の登録`);
}

// ---------------------------------------------------------------------------
// カード詳細(編集)画面: 詳細情報の画像の言語・表示面
// ---------------------------------------------------------------------------

/** コレクターNoの詳細情報の画像（1枚目）の、言語・表示面を変える。変えたら「登録」は呼び出し側で押す */
export async function 詳細の画像を変える(page: Page, コレクターNo: string, v: { 言語?: string; 表示面?: "表面" | "裏面" }, what: string): Promise<void> {
  const details = page.locator("#card-details-container .detail-card");
  const hit: Locator[] = [];
  for (const d of await details.all()) {
    const no = d.locator('input[name$="[cardNo]"]');
    if ((await no.count()) && (await no.inputValue()).trim() === コレクターNo) hit.push(d);
  }
  if (hit.length !== 1) throw new Error(`${what}: コレクターNo ${コレクターNo} の詳細情報が ${hit.length} 件`);
  const img = hit[0].locator(".image-item");
  if ((await img.count()) !== 1) throw new Error(`${what}: コレクターNo ${コレクターNo} の詳細情報の画像が ${await img.count()} 件`);
  if (v.言語 !== undefined) await chooseByLabel(img.locator('select[name$="[language]"]'), v.言語);
  if (v.表示面 !== undefined) {
    const radio = img.locator('input[type="radio"][name$="[backFlg]"]');
    const ids = await radio.evaluateAll((rs) => rs.map((r) => r.id));
    let done = false;
    for (const id of ids) {
      const label = (await page.locator(`label[for="${id}"]`).innerText().catch(() => "")).trim();
      if (label === v.表示面) { await page.locator(`#${id}`).check(); done = true; }
    }
    if (!done) throw new Error(`${what}: コレクターNo ${コレクターNo} の画像の表示面に「${v.表示面}」が無い`);
  }
}

/** 詳細情報の画像の言語の選択肢（日本語名） */
export async function 画像の言語の選択肢(page: Page): Promise<string[]> {
  const sel = page.locator('#card-details-container .image-item select[name$="[language]"]').first();
  if ((await sel.count()) === 0) return [];
  return (await sel.locator("option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
}

// ---------------------------------------------------------------------------
// アーキタイプ編集画面（シード用の最小の操作）
// ---------------------------------------------------------------------------

const 欄 = (page: Page, n: string): Locator => page.locator(`[name="admin_archetype[${n}]"], [name="admin_archetype[${n}][]"]`).first();

/** 「代表カード選択」を押し、代表カード検索でカード名を入れ「完全一致」にチェックを付けて「検索」を押す。結果の行（ID・カード名）を返す */
export async function 代表カードを検索する(page: Page, カード名: string, what: string): Promise<{ ID: string; 名: string }[]> {
  const open = page.locator('button[data-bs-target="#searchCardImageModal"]');
  await expect(open, `${what}: 「代表カード選択」`).toHaveText(exact("代表カード選択"));
  await open.click();
  const m = page.locator("#searchCardImageModal");
  await expect(m, `${what}: 代表カード検索の画面`).toBeVisible();
  await m.locator("#card_image_search_word").fill(カード名);
  await m.locator("#card_image_exact_match").check();
  const res = page.waitForResponse((r) => r.url().includes("/archetype/search_card_image"));
  await m.locator("#btn_search_card_image").click();
  await res;
  const results = m.locator("#card_image_search_results");
  await expect(results.locator("table, p").first(), `${what}: 代表カード検索の結果`).toBeVisible({ timeout: 30_000 });
  if ((await m.locator(".card-image-page").count()) > 0) throw new Error(`${what}: 代表カード検索の結果が複数ページある（1ページ目の行だけでは決められない）`);
  return results.locator("tbody tr").evaluateAll((trs) => trs.map((tr) => ({
    ID: (tr.querySelector("td")?.textContent ?? "").trim(),
    名: (tr.querySelectorAll("td")[1]?.textContent ?? "").trim(),
  })));
}

/** 代表カード検索の結果で、ID列が指定の番号の行の「選択」を押す */
export async function 代表カードの行を選ぶ(page: Page, 画像ID: string, what: string): Promise<void> {
  const m = page.locator("#searchCardImageModal");
  const btn = m.locator(`#card_image_search_results button.select-card-image[data-id="${画像ID}"]`);
  await expect(btn, `${what}: 代表カード検索の ID ${画像ID} の行の「選択」`).toHaveCount(1);
  await expect(btn).toHaveText(exact("選択"));
  await btn.click();
  await expect(m).toBeHidden();
  await expect(page.locator("#admin_archetype_cardImageId"), `${what}: 選んだ代表カード画像`).toHaveValue(画像ID);
}

/** アーキタイプ管理(検索入力)画面の「新規登録」を押し、アーキタイプ編集画面を開く */
export async function 新規登録画面を開く(page: Page, what: string): Promise<void> {
  const s = new ArchetypeSearchPage(page);
  await s.開く();
  await s.新規登録を押す();
  await expect(欄(page, "nameJp"), `${what}: アーキタイプ編集(登録)画面`).toBeVisible();
}

/** アーキタイプ編集画面の公開状態の選択肢 */
export async function 公開状態の選択肢(page: Page): Promise<string[]> {
  return (await 欄(page, "Disp").locator("option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
}

export type 登録内容 = {
  名日: string; 名英: string;
  /** フォーマットの番号（選択肢の値）。選択肢の表示はフォーマット名(日) */
  フォーマットID: string;
  /** 指定が無ければ初期表示のまま */
  公開状態?: "公開" | "非公開";
  カラー?: string[];
  /** 代表カード検索のカード名と、選ぶ行のID */
  代表カード?: { カード名: string; 画像ID: string };
};

/** シード: アーキタイプ管理(検索入力)画面の「新規登録」→ アーキタイプ編集画面で入れて「新規登録」を押す */
export async function アーキタイプを登録する(page: Page, v: 登録内容, what: string, issue: Issue): Promise<void> {
  await 新規登録画面を開く(page, what);
  await 欄(page, "nameJp").fill(v.名日);
  await 欄(page, "nameEn").fill(v.名英);
  await 欄(page, "Format").selectOption({ value: v.フォーマットID });
  if (v.公開状態 !== undefined) await chooseByLabel(欄(page, "Disp"), v.公開状態);
  for (const c of v.カラー ?? []) {
    const item = page.locator(".archetype-colors .form-check").filter({ has: page.locator("label").filter({ hasText: exact(c) }) });
    await expect(item, `${what}: アーキタイプ編集画面のカラー「${c}」`).toHaveCount(1);
    await item.locator('input[type="checkbox"]').check();
  }
  if (v.代表カード) {
    await 代表カードを検索する(page, v.代表カード.カード名, what);
    await 代表カードの行を選ぶ(page, v.代表カード.画像ID, what);
  }
  const button = page.locator('button[type="submit"][form="admin_archetype"]');
  await expect(button, `${what}: アーキタイプ編集(登録)画面の「新規登録」`).toHaveText(exact("新規登録"));
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), button.click()]);
  for (const w of await expectSaved(page, `${what}: アーキタイプ「${v.名日}」の登録`)) issue(`アーキタイプ「${v.名日}」の登録時の警告「${w}」`);
}

/**
 * シード: 検索入力画面でアーキタイプ名を入れて「検索する」を押し、該当する行があれば、その行のアーキタイプ名を押して
 * アーキタイプ編集画面を開き、「削除」→確認ダイアログの「OK」（該当する行が無くなるまで繰り返す）。消した件数を返す。
 */
export async function 名前で探して消す(page: Page, 語: string, what: string): Promise<number> {
  const s = new ArchetypeSearchPage(page);
  let n = 0;
  for (let i = 0; i < 100; i++) {
    await s.開く();
    await s.名前で検索する(語);
    const rows = await s.結果の行();
    if (rows.length === 0) {
      if ((await s.該当件数()) === 0 || (await s.該当なしの表示.count()) > 0) return n;
      throw new Error(`${what}: 「${語}」の検索結果が読めない（${page.url()}）`);
    }
    await s.名前を押す(rows[0].ID);
    await 編集画面で削除する(page, `${what}: アーキタイプID ${rows[0].ID}（${rows[0].名日}）`);
    n++;
  }
  throw new Error(`${what}: 「${語}」の該当を100件消しても0件にならない`);
}

/** アーキタイプ編集画面の「削除」を押し、確認ダイアログで「OK」を押す。削除の完了を確かめる */
export async function 編集画面で削除する(page: Page, what: string): Promise<void> {
  const b = page.locator("#btn_delete");
  await expect(b, `${what}: アーキタイプ編集画面の「削除」`).toHaveText(exact("削除"));
  page.once("dialog", (d) => { void d.accept(); });
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), b.click()]);
  await expectSaved(page, `${what}: 削除`);
  const p = pathOf(page.url());
  if (!(p === 検索入力のパス() || p.startsWith(`${検索入力のパス()}/search/`))) throw new Error(`${what}: 削除のあとアーキタイプ管理画面へ戻らない（${page.url()}）`);
}

/**
 * シード: 検索入力画面でアーキタイプ名を入れて「検索する」を押し、名(日)・名(英)・フォーマット(日)が一致する行のID列の番号を返す（1件でなければ止める）
 */
export async function 検索結果のIDを読む(page: Page, v: { 名日: string; 名英: string; フォーマット日: string }, what: string): Promise<string> {
  const s = new ArchetypeSearchPage(page);
  await s.開く();
  await s.名前で検索する(v.名日);
  const hit = (await s.結果の行()).filter((r) => r.名日 === v.名日 && r.名英 === v.名英 && r.フォーマット === v.フォーマット日);
  if (hit.length !== 1) throw new Error(`${what}: アーキタイプ名「${v.名日}」で検索した結果の該当行（${v.名英}・${v.フォーマット日}）が ${hit.length} 件`);
  return hit[0].ID;
}

/** アーキタイプ編集画面の表示（公開状態・チェックされたカラー・チェックされていないカラー・フォーマット） */
export async function 編集画面の表示(page: Page): Promise<{ 公開状態: string; チェックあり: string[]; チェックなし: string[]; フォーマット: string }> {
  const items = page.locator(".archetype-colors .form-check");
  const cs = await items.evaluateAll((its) => its.map((it) => ({
    名: (it.querySelector("label")?.textContent ?? "").trim(),
    on: (it.querySelector('input[type="checkbox"]') as HTMLInputElement | null)?.checked ?? false,
  })));
  const selected = async (l: Locator) => ((await l.locator("option:checked").allInnerTexts())[0] ?? "").trim();
  return {
    公開状態: await selected(欄(page, "Disp")),
    チェックあり: cs.filter((c) => c.on).map((c) => c.名),
    チェックなし: cs.filter((c) => !c.on).map((c) => c.名),
    フォーマット: await selected(欄(page, "Format")),
  };
}

// ---------------------------------------------------------------------------
// デッキ一覧(検索入力)画面の検索条件「アーキタイプ」
// ---------------------------------------------------------------------------

/** デッキ一覧(検索入力)画面を開く */
export async function デッキ一覧を開く(page: Page): Promise<void> {
  await page.goto(adminUrl("/deck"));
  await page.waitForLoadState("load");
  await expect(page.locator('select[name="admin_search_deck[archetypes][]"]'), "デッキ一覧の検索条件「アーキタイプ」").toHaveCount(1);
}

/**
 * 検索条件「アーキタイプ」の選択欄を押して開き、語を入れて候補を絞る。開いた候補の表示名を返す。
 * あわせて、選択欄の元の選択肢のうち語を含むものの表示名も返す（候補の表示が絞り込みの作りで変わっても、選択肢そのものを示すため）。
 */
export async function アーキタイプの選択肢を探す(page: Page, 語: string): Promise<{ 候補: string[]; 選択肢: string[] }> {
  const sel = page.locator('select[name="admin_search_deck[archetypes][]"]');
  const box = sel.locator("xpath=following-sibling::span[contains(@class,'select2-container')][1]");
  await box.locator(".select2-selection").click();
  const search = box.locator(".select2-search__field");
  await search.fill(語);
  const opts = page.locator(".select2-container--open .select2-results__option");
  await expect(opts.first(), "検索条件「アーキタイプ」の候補").toBeVisible();
  const 候補 = (await opts.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  const 選択肢 = (await sel.locator("option").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t.includes(語));
  return { 候補, 選択肢 };
}
