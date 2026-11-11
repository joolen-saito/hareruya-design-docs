/**
 * M14-05 カード登録CSVアップロード（メニュー「カード管理」→「カード一覧」の「CSV取り込み」）と、そのシードが使う画面の操作。
 * - 画面の作り: 取込ファイルの欄（必須・選べる種類は .csv）と「CSVファイルをアップロード」ボタン（正本の「CSVファイルのアップロード」）。
 *   送信は確認モーダルを出さずに取込の要求を送り、成功・失敗とも、この画面へ戻す（画面上部に完了またはエラーのメッセージ）。
 * - 取込ファイルの見出し行は、画面の「雛形ファイルダウンロード」で得る見出し（列の名前）と同じ並びでないと取り込まれない。
 * - MTGマスターデータ管理・フォーマット・カードセットは、CSVの値を英語名で引くので、英語名で「あれば使い、無ければ登録する」。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";
import { CardSearchPage } from "./m14_card";

const UPLOAD_PATH = "/card/csv_upload";
const IMPORT_PATH = "/card/import";

export const pathOf = (url: string): string => new URL(url).pathname;

/** 「CSVファイルをアップロード」を押した結果 */
export type 送信結果 =
  | { 送った: true; 応答: number; 戻った画面: string; 成功: string[]; エラー: string[] }
  | { 送った: false; 止めた項目: string[]; 戻った画面: string };

export class CardCsvUploadPage {
  readonly form: Locator;
  readonly 取込ファイル: Locator;
  readonly アップロードボタン: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#upload-form");
    this.取込ファイル = this.form.locator('input[type="file"]');
    this.アップロードボタン = page.locator("#upload-button");
  }

  path(): string { return pathOf(adminUrl(UPLOAD_PATH)); }

  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl(UPLOAD_PATH));
    expect(res?.status() ?? 0, "カード登録CSVアップロード画面の応答").toBe(200);
    await this.page.waitForLoadState("load");
    await expect(this.取込ファイル, "カード登録CSVアップロード画面の取込ファイルの欄").toHaveCount(1);
  }

  async 選ぶ(filePath: string): Promise<void> {
    await this.取込ファイル.setInputFiles(filePath);
  }

  async 選んだファイルの数(): Promise<number> {
    return this.取込ファイル.evaluate((e) => (e as HTMLInputElement).files?.length ?? 0);
  }

  /** フォームの中で、ブラウザの入力チェックに通らない項目 */
  private async 通らない項目(): Promise<string[]> {
    return this.form.evaluate((f) => Array.from((f as HTMLFormElement).elements)
      .filter((e) => "checkValidity" in e && !(e as HTMLInputElement).checkValidity())
      .map((e) => `${(e as HTMLInputElement).type === "file" ? "取込ファイル" : "（項目名なし）"}: ${(e as HTMLInputElement).validationMessage}`));
  }

  /** 画面上部のメッセージ（開発用の設定のときに常に出る帯は除く） */
  async メッセージ(): Promise<{ 成功: string[]; エラー: string[] }> {
    const read = async (l: Locator) => (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t && !t.includes("デバッグモードが有効"));
    return { 成功: await read(this.page.locator(".alert-success")), エラー: await read(this.page.locator(".alert-danger")) };
  }

  /**
   * 「CSVファイルをアップロード」を押す。ブラウザの入力チェックで止まるときは、要求が出ないことを確かめて止めた項目を返す。
   * 送ったときは、取込の要求の応答と、戻った画面の読み込みを待つ。
   */
  async アップロードを押す(waitMs = 600_000): Promise<送信結果> {
    await expect(this.アップロードボタン, "「CSVファイルをアップロード」ボタン").toHaveText(/^\s*CSVファイルをアップロード\s*$/);
    const blocked = await this.通らない項目();
    if (blocked.length) {
      const sent = this.page.waitForRequest((r) => r.method() === "POST", { timeout: 3_000 }).then(() => true, () => false);
      await this.アップロードボタン.click();
      if (await sent) throw new Error(`ブラウザの入力チェックで止まるはずの送信が送られた（${blocked.join(" / ")}）`);
      return { 送った: false, 止めた項目: blocked, 戻った画面: pathOf(this.page.url()) };
    }
    const importPath = pathOf(adminUrl(IMPORT_PATH));
    const response = this.page.waitForResponse((r) => r.request().method() === "POST" && pathOf(r.url()) === importPath, { timeout: waitMs });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: waitMs }), this.アップロードボタン.click()]);
    const status = (await response).status();
    await this.page.waitForLoadState("load");
    const m = await this.メッセージ();
    return { 送った: true, 応答: status, 戻った画面: pathOf(this.page.url()), 成功: m.成功, エラー: m.エラー };
  }
}

/** 送信結果を注記の文にする */
export function 送信結果の文(r: 送信結果): string {
  if (!r.送った) return `ブラウザの入力チェックが送信を止めた（要求は送られていない。画面 ${r.戻った画面}）: ${r.止めた項目.join(" / ")}`;
  const msgs = [...r.成功.map((t) => `成功「${t}」`), ...r.エラー.map((t) => `エラー「${t}」`)];
  return `取込の要求の応答 ${r.応答}、戻った画面 ${r.戻った画面}、画面上部のメッセージ: ${msgs.length ? msgs.join(" / ") : "なし"}`;
}

/** シードの取込: 画面を開いて選んで送り、完了のメッセージが出ることを確かめる（出なければ止める） */
export async function シードのCSVを取り込む(page: Page, filePath: string, what: string): Promise<string[]> {
  const up = new CardCsvUploadPage(page);
  await up.open();
  await up.選ぶ(filePath);
  const r = await up.アップロードを押す();
  if (!r.送った) throw new Error(`${what}: ${送信結果の文(r)}`);
  return expectSaved(page, what);
}

// ---------------------------------------------------------------------------
// カード一覧: カード名(英語)で探す・消す
// ---------------------------------------------------------------------------

/** 一覧の行のカード名（「日本語名 / 英語名」または英語名だけ）が、指定のカード名を持つか */
const 名を持つ = (表示: string, 名: string): boolean => 表示 === 名 || 表示.split(" / ").map((s) => s.trim()).includes(名);

/** カード一覧で語を検索し、カード名がちょうど一致する行のカードID */
export async function カード一覧で探す(page: Page, 名: string, 検索語 = 名): Promise<string[]> {
  const l = new CardSearchPage(page);
  await l.open();
  await l.キーワードで検索する(検索語);
  return (await l.表示行()).filter((r) => 名を持つ(r.カード名, 名)).map((r) => r.カードID);
}

/**
 * シード表の「カード一覧画面の検索欄に…を入れて「検索する」を押し、行が表示されたら削除ボタンで削除する」。
 * 検索の語は部分一致・語ごとの絞り込みなので、カード名がちょうど一致する行だけを消す（ほかのカードを巻き込まない）。消した件数を返す。
 */
export async function カード一覧から消す(page: Page, 名: string, 検索語 = 名): Promise<number> {
  const l = new CardSearchPage(page);
  let n = 0;
  for (let round = 0; round < 10; round++) {
    const ids = await カード一覧で探す(page, 名, 検索語);
    if (ids.length === 0) return n;
    await l.三点リーダーを押す(ids[0]);
    await l.削除を押す(ids[0]);
    await l.確認ポップアップで実行する();
    n++;
  }
  throw new Error(`カード「${名}」を消しきれない`);
}

// ---------------------------------------------------------------------------
// MTGマスターデータ管理（英語名で探す）
// ---------------------------------------------------------------------------

export type マスター種別 = "カードタイプ" | "カラー" | "サブタイプ" | "特殊タイプ" | "レアリティ" | "イラストレーター" | "カードレイアウト" | "プロモーション" | "色順";

async function openMaster(page: Page, 種別: マスター種別): Promise<void> {
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

/** 色順は名称の列だけ、ほかの種別は英語名の列で引く */
const 鍵の列 = (種別: マスター種別): string => (種別 === "色順" ? "name" : "name_en");

/** 既存の行（入力行を除く）の行番号・鍵の値・並び順 */
async function masterRows(page: Page, 鍵: string): Promise<{ 行: string; 値: string; 並び順: number }[]> {
  return page.locator("form#edit_form table.mtg-master-table tbody tr").evaluateAll((trs, key) => {
    const out: { 行: string; 値: string; 並び順: number }[] = [];
    for (const tr of trs) {
      const first = tr.querySelector("input[name], select[name]") as HTMLInputElement | null;
      const m = /^rows\[(.+?)\]\[/.exec(first?.getAttribute("name") ?? "");
      if (!m || m[1] === "new") continue;
      const v = (f: string) => ((tr.querySelector(`[name="rows[${m[1]}][${f}]"]`) as HTMLInputElement | null)?.value ?? "");
      out.push({ 行: m[1], 値: v(key).trim(), 並び順: Number(v("sort_no")) });
    }
    return out;
  }, 鍵);
}

/** 英語名（色順は名称）の行があるか */
export async function マスターにあるか(page: Page, 種別: マスター種別, 値: string): Promise<boolean> {
  await openMaster(page, 種別);
  return (await masterRows(page, 鍵の列(種別))).some((r) => r.値 === 値);
}

/**
 * 英語名（色順は名称）の行が無ければ、最下行の入力行に入れて「登録」を押す。登録したら true。
 * 残りの列: 日本語名は指定の値（無ければ英語名と同じ）、コードは英数字の短い値、並び順は既存の最大＋1。
 * 入力行は必須の文字列が空だと黙って登録されないので、登録のあとに行ができたことを確かめる。
 */
export async function マスターを用意する(page: Page, 種別: マスター種別, 値: string, what: string, 日本語名?: string): Promise<boolean> {
  if (await マスターにあるか(page, 種別, 値)) return false;
  const rows = await masterRows(page, 鍵の列(種別));
  const f = (n: string) => page.locator(`[name="rows[new][${n}]"]`);
  if (種別 === "色順") await f("name").fill(値);
  else {
    await f("name_en").fill(値);
    if (await f("name_jp").count()) await f("name_jp").fill(日本語名 ?? 値);
  }
  if (await f("code").count()) await f("code").fill(値.replace(/[^A-Za-z0-9]/g, "").slice(0, 8) || "M1405");
  if (await f("sort_no").count()) await f("sort_no").fill(String(Math.max(0, ...rows.map((r) => r.並び順).filter(Number.isFinite)) + 1));
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.locator('button[type="submit"][form="edit_form"]').click(),
  ]);
  await page.waitForLoadState("load");
  await expectSaved(page, `${what}: ${種別}「${値}」の登録`);
  if (!(await マスターにあるか(page, 種別, 値))) throw new Error(`${what}: ${種別}「${値}」を登録したが、一覧に行ができていない`);
  return true;
}

/** シード表の「…の行があればその行の値をすべて消して「登録」を押す」。消したら true */
export async function マスターの行を消す(page: Page, 種別: マスター種別, 値: string, what: string): Promise<boolean> {
  await openMaster(page, 種別);
  const hit = (await masterRows(page, 鍵の列(種別))).filter((r) => r.値 === 値);
  if (hit.length === 0) return false;
  for (const h of hit) {
    const inputs = page.locator(`form#edit_form input[name^="rows[${h.行}]["]`);
    const n = await inputs.count();
    for (let i = 0; i < n; i++) {
      const input = inputs.nth(i);
      if ((await input.getAttribute("type")) === "hidden") continue;
      if (await input.getAttribute("readonly")) throw new Error(`${what}: ${種別}「${値}」は固定の行で消せない`);
      await input.fill("");
    }
  }
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.locator('button[type="submit"][form="edit_form"]').click(),
  ]);
  await page.waitForLoadState("load");
  await expectSaved(page, `${what}: ${種別}「${値}」の行の削除`);
  if (await マスターにあるか(page, 種別, 値)) throw new Error(`${what}: ${種別}「${値}」の行を消したが、一覧に残っている`);
  return true;
}

// ---------------------------------------------------------------------------
// フォーマット（英語名で探す）
// ---------------------------------------------------------------------------

/** フォーマット一覧（リンクの文は「日本語名 / 英語名」）で、英語名が一致するフォーマットのID */
export async function フォーマットを英語名で探す(page: Page, 名英: string): Promise<string | null> {
  const res = await page.goto(adminUrl("/format"));
  if (!res || !res.ok()) throw new Error(`フォーマット一覧を開けない（応答 ${res?.status() ?? "なし"}）`);
  return page.locator('a[href*="/format/"][href$="/edit"]').evaluateAll((links, name) => {
    for (const a of links) {
      const parts = (a.textContent ?? "").replace(/\s+/g, " ").trim().split(" / ");
      if ((parts[1] ?? "").trim() !== name) continue;
      const m = /\/format\/(\d+)\/edit/.exec((a as HTMLAnchorElement).getAttribute("href") ?? "");
      if (m) return m[1];
    }
    return null;
  }, 名英);
}

/** フォーマット登録画面で、フォーマット名(英)と残りの必須項目（名(日)は英語名と同じ・並び順・メタ集計範囲）を入れて登録する（未登録のときだけ） */
export async function フォーマットを用意する(page: Page, 名英: string, 並び順: string, what: string): Promise<string[]> {
  if (await フォーマットを英語名で探す(page, 名英)) return [];
  await page.goto(adminUrl("/format/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_format[${n}]"]`);
  await f("nameJp").fill(名英);
  await f("nameEn").fill(名英);
  await f("rank").fill(並び順);
  const meta = f("MetaRange");
  if ((await meta.count()) && (await meta.inputValue()) === "") await meta.fill("30");
  await page.locator('button[type="submit"]').filter({ hasText: /^\s*(登録|新規登録)\s*$/ }).first().click();
  const warnings = await expectSaved(page, `${what}: フォーマット「${名英}」の登録`);
  if (!(await フォーマットを英語名で探す(page, 名英))) throw new Error(`${what}: フォーマット「${名英}」を登録したが、一覧に無い`);
  return warnings;
}

// ---------------------------------------------------------------------------
// カードセット（英語名で探す）
// ---------------------------------------------------------------------------

/**
 * カードセット一覧（ページ送りあり）を、表示件数を最も多くして1ページずつ見て、英語名が一致する行のカードセットID。
 * 最初の1件で止めるときは、その行のあるページを開いたまま返す（削除の操作に使う）。
 */
export async function カードセットを英語名で探す(page: Page, 名英: string, 最初の1件で止める = false): Promise<string[]> {
  await page.goto(adminUrl("/cardset"));
  await page.waitForLoadState("load");
  const pulldown = page.locator("#page_count_pulldown");
  if (await pulldown.count()) {
    const values = await pulldown.locator("option").evaluateAll((os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, n: Number(/page_count=(\d+)/.exec((o as HTMLOptionElement).value)?.[1] ?? 0) })));
    const max = values.sort((a, b) => b.n - a.n)[0];
    if (max?.v) await page.goto(new URL(max.v, page.url()).toString());
  }
  const found: string[] = [];
  let 前のページ = "";
  for (let pageNo = 1; pageNo <= 500; pageNo++) {
    if (pageNo > 1) await page.goto(adminUrl(`/cardset/page/${pageNo}`));
    await page.waitForLoadState("load");
    const rows = await page.locator("table tbody tr").filter({ has: page.locator('input[name="cardsetIds[]"]') }).evaluateAll((trs) => trs.map((tr) => ({
      id: (tr.querySelector('input[name="cardsetIds[]"]') as HTMLInputElement | null)?.value ?? "",
      names: ((tr.querySelector("td:nth-child(5)") as HTMLElement | null)?.innerText ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
    })));
    // 行が無い・前のページと同じ行（最後のページを越えた）なら終わり
    const 指紋 = rows.map((r) => r.id).join(",");
    if (rows.length === 0 || 指紋 === 前のページ) break;
    前のページ = 指紋;
    for (const r of rows) {
      if (r.names[1] === 名英 || (r.names.length === 1 && r.names[0] === 名英)) {
        found.push(r.id);
        if (最初の1件で止める) return found;
      }
    }
  }
  return found;
}

/** カードセット詳細画面で、カードセット名（英語）と残りの必須項目（名（日本語）は英語名と同じ・略称・リリース日）を入れて登録する（未登録のときだけ） */
export async function カードセットを用意する(page: Page, 名英: string, 略称: string, what: string): Promise<string[]> {
  if ((await カードセットを英語名で探す(page, 名英)).length) return [];
  await page.goto(adminUrl("/cardset/new"));
  await page.waitForLoadState("load");
  await page.locator("#admin_cardset_nameJp").fill(名英);
  await page.locator("#admin_cardset_nameEn").fill(名英);
  await page.locator("#admin_cardset_code").fill(略称);
  const date = page.locator('input[name="admin_cardset[releaseDate]"]');
  if (await date.count()) await date.fill("2026-01-01");
  else {
    await page.locator('[name="admin_cardset[releaseDate][year]"]').selectOption("2026");
    await page.locator('[name="admin_cardset[releaseDate][month]"]').selectOption("1");
    await page.locator('[name="admin_cardset[releaseDate][day]"]').selectOption("1");
  }
  await page.getByRole("button", { name: "登録", exact: true }).click();
  return expectSaved(page, `${what}: カードセット「${名英}」の登録`);
}

/** シード表の「カードセット一覧画面で…の行があれば削除ボタンで削除する」。消した件数 */
export async function カードセットを消す(page: Page, 名英: string, what: string): Promise<number> {
  let n = 0;
  for (let round = 0; round < 10; round++) {
    const [id] = await カードセットを英語名で探す(page, 名英, true);
    if (!id) return n;
    const row = page.locator("table tbody tr").filter({ has: page.locator(`input[name="cardsetIds[]"][value="${id}"]`) });
    await row.locator("button.dropdown-menu-toggle").click();
    await row.locator('button[data-bs-target="#DeleteModal"]').click();
    await expect(page.locator("#DeleteModal"), "削除の確認ポップアップ").toBeVisible();
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator('#DeleteModal a[data-method="delete"]').click()]);
    await page.waitForLoadState("load");
    await expectSaved(page, `${what}: カードセット「${名英}」の削除`);
    n++;
  }
  throw new Error(`${what}: カードセット「${名英}」を消しきれない`);
}

// ---------------------------------------------------------------------------
// 取込ファイルを組む（見出しは画面の「雛形ファイルダウンロード」で得る列の名前）
// ---------------------------------------------------------------------------

/** 正本の項目名 → 取込ファイルの列の名前（画面のCSVの形式の表・雛形の見出しと同じ） */
export const カードCSVの列 = {
  "カード名(日本語)": "name_jp", "カード名(英語)": "name_en", "アリーナカード名(日本語)": "arena_format_name_jp", "アリーナカード名(英語)": "arena_format_name_en",
  "ルールテキスト(日本語)": "text_jp", "ルールテキスト(英語)": "text_en", マナコスト: "mana_cost", 点数で見たマナコスト: "cmc", パワー: "power", タフネス: "toughness",
  忠誠度: "loyalty", カードタイプ: "cardtype", カラー: "color", 固有色: "color_identity", サブタイプ: "subtype", 特殊タイプ: "specialtype",
  キーワード能力: "keyword_ability", 使用可能フォーマット: "format", 使用制限フォーマット: "restriction_format", 使用禁止フォーマット: "ban_format",
  カードセット: "set", レアリティ: "rarity", イラストレーター: "illustrator", レイアウト: "layout", "フレーバーテキスト(日本語)": "flavor_jp",
  "フレーバーテキスト(英語)": "flavor_en", カードNo: "card_no", プロモ種別: "promotion_type", Foil: "foil", フレーム: "frame",
  "画像URL(日本語)": "image_jp", "画像URL(英語)": "image_en", カード詳細ID: "card_detail_id", 裏面カード詳細ID: "back_card_detail_id", 色順: "color_sequence",
} as const;

export type カードCSVの項目 = keyof typeof カードCSVの列;
/** 1データ行。書かない項目は空。末尾の列を除く: 列数の足りない行を作るとき、行の末尾から除く列の数 */
export type カードCSVの行 = Partial<Record<カードCSVの項目, string>> & { 末尾の列を除く?: number };
export type カードCSVの形 = { 区切り?: "," | "\t"; 改行?: "\n" | "\r\n"; BOM?: boolean };

let 見出しの控え: string[] | null = null;

/** 画面の「雛形ファイルダウンロード」で見出し行を得る（1回の起動で1度だけ） */
export async function カードCSVの見出し(page: Page): Promise<string[]> {
  if (見出しの控え) return 見出しの控え;
  await page.goto(adminUrl(UPLOAD_PATH));
  await page.waitForLoadState("load");
  const [download] = await Promise.all([page.waitForEvent("download"), page.locator("#download-template-button").click()]);
  const chunks: Buffer[] = [];
  for await (const chunk of await download.createReadStream()) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString("utf8").replace(/^﻿/, "");
  const first = text.split(/\r?\n/)[0] ?? "";
  const headers = first.split(",").map((h) => h.replace(/^"|"$/g, "").trim());
  for (const key of Object.values(カードCSVの列)) {
    if (!headers.includes(key)) throw new Error(`カード登録CSVの雛形の見出しに列「${key}」が無い: ${first}`);
  }
  見出しの控え = headers;
  return headers;
}

/** 見出し行と各データ行を組む。区切りがカンマのときだけ、カンマ・引用符・改行を含む値を引用符で囲む */
export function カードCSVを組む(見出し: string[], 行: カードCSVの行[], 形: カードCSVの形 = {}): Buffer {
  const sep = 形.区切り ?? ",";
  const nl = 形.改行 ?? "\n";
  const quote = (v: string) => (sep === "," && /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const 列から項目 = new Map(Object.entries(カードCSVの列).map(([k, v]) => [v as string, k as カードCSVの項目]));
  const lines = [見出し.map(quote).join(sep)];
  for (const r of 行) {
    let cells = 見出し.map((h) => { const k = 列から項目.get(h); return k ? (r[k] ?? "") : ""; });
    if (r.末尾の列を除く) cells = cells.slice(0, cells.length - r.末尾の列を除く);
    lines.push(cells.map(quote).join(sep));
  }
  const body = Buffer.from(lines.join(nl) + nl, "utf8");
  return 形.BOM ? Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), body]) : body;
}
