/** 分析・集計管理「特集タグ編集CSVダウンロード(検索項目)」画面（M12-09・M12-10）の操作。セレクタはここだけに書く。 */
import { Download, expect, Locator, Page } from "@playwright/test";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

/** 画面の項目の呼び名（シード表・ケースの言葉） */
export class UsedCardPage {
  readonly 集計日From: Locator;
  readonly 集計日To: Locator;
  readonly フォーマット: Locator;
  readonly 基本土地: Locator;
  readonly CSVボタン: Locator;
  readonly クリアリンク: Locator;

  constructor(readonly page: Page) {
    this.集計日From = page.locator("#admin_analysis_used_card_start_date");
    this.集計日To = page.locator("#admin_analysis_used_card_end_date");
    this.フォーマット = page.locator("#admin_analysis_used_card_formats");
    this.基本土地 = page.locator("#admin_analysis_used_card_include_basic");
    this.CSVボタン = page.locator("#search_form").getByRole("button", { name: "特集タグ編集CSVダウンロード", exact: true });
    this.クリアリンク = page.locator("#search_form a.search-clear");
  }

  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/analysis/used-card"));
    expect(res?.status() ?? 0, "特集タグ編集CSVダウンロード(検索項目)画面の応答").toBeLessThan(400);
    await expect(this.集計日From, "集計日(From)の欄").toBeVisible({ timeout: 30_000 });
  }

  /** 画面の日付欄は yyyy-mm-dd で入れる。「2026/04/01」の形で受け取る */
  async 入力する(欄: Locator, 日付: string): Promise<void> {
    await 欄.fill(日付.replace(/\//g, "-"), { timeout: 20_000 });
  }

  /** フォーマットの選択肢（表示名） */
  async フォーマットの選択肢(): Promise<string[]> {
    return (await this.フォーマット.locator("option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }

  /** フォーマットを（複数）選ぶ。画面の選択肢の表示名で選ぶ */
  async フォーマットを選ぶ(names: string[]): Promise<void> {
    const have = await this.フォーマットの選択肢();
    for (const n of names) if (!have.includes(n)) throw new Error(`フォーマットの選択肢に「${n}」が無い（ある選択肢の数: ${have.length}）`);
    await this.フォーマット.selectOption(names.map((label) => ({ label })), { timeout: 20_000 });
  }

  /** 選ばれているフォーマットの表示名 */
  async 選ばれたフォーマット(): Promise<string[]> {
    return (await this.フォーマット.locator("option:checked").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }

  /** ボタンを押してダウンロードされたCSVを、行と列にして返す（ダウンロードされなければ null と、画面に出たもの） */
  async CSVを取得する(): Promise<{ rows: string[][]; fileName: string } | null> {
    const download = this.page.waitForEvent("download", { timeout: 60_000 }).catch(() => null);
    await this.CSVボタン.click({ timeout: 20_000 });
    const d: Download | null = await download;
    if (!d) return null;
    const chunks: Buffer[] = [];
    for await (const chunk of await d.createReadStream()) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return { rows: parseCsv(decodeCsvBytes(Buffer.concat(chunks))), fileName: d.suggestedFilename() };
  }
}

/** 今日の日付（日本時間）を yyyy/mm/dd で */
export function 今日(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86400_000);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const p = (t: string) => parts.find((x) => x.type === t)!.value;
  return `${p("year")}/${p("month")}/${p("day")}`;
}

// ---- フォーマット（シード用） ----

/** フォーマット一覧から、フォーマット名(日)の行のフォーマットIDを読む。無ければ null */
export async function findFormatId(page: Page, nameJp: string): Promise<string | null> {
  const res = await page.goto(adminUrl("/format"));
  if (!res || !res.ok()) throw new Error(`フォーマット一覧を開けない（応答 ${res?.status() ?? "なし"}）`);
  const ids: string[] = [];
  for (const l of await page.locator('a[href*="/format/"][href$="/edit"]').all()) {
    const text = ((await l.innerText()) ?? "").replace(/\s+/g, " ").trim();
    if (text.split(" / ")[0] !== nameJp) continue;
    const m = /\/format\/(\d+)\/edit/.exec((await l.getAttribute("href")) ?? "");
    if (m && !ids.includes(m[1])) ids.push(m[1]);
  }
  if (ids.length > 1) throw new Error(`フォーマット「${nameJp}」が複数ある（ID ${ids.join("、")}）`);
  return ids[0] ?? null;
}

/** フォーマット登録。入れるのはフォーマット名(日)・(英)・並び順・メタゲーム分析日数。登録後の編集画面のアドレスの番号を返す */
export async function registerFormat(page: Page, v: { 名日: string; 名英: string; 並び順: string; メタ日数: string }, issue: (m: string) => void): Promise<string> {
  await page.goto(adminUrl("/format/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_format[${n}]"]`);
  await f("nameJp").fill(v.名日);
  await f("nameEn").fill(v.名英);
  await f("rank").fill(v.並び順);
  await f("MetaRange").fill(v.メタ日数);
  await page.locator('button[type="submit"]').filter({ hasText: /^\s*(登録|新規登録)\s*$/ }).first().click();
  for (const w of await expectSaved(page, `フォーマット「${v.名日}」の登録`)) issue(w);
  const m = /\/format\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`フォーマット「${v.名日}」を登録したが、編集画面へ移らない（${page.url()}）`);
  return m[1];
}

/** あれば使い、無ければ登録する。フォーマットIDを返す */
export async function ensureFormat(page: Page, v: { 名日: string; 名英: string; 並び順: string; メタ日数: string }, issue: (m: string) => void): Promise<string> {
  const found = await findFormatId(page, v.名日);
  if (found) {
    await page.goto(adminUrl(`/format/${found}/edit`));
    await expect(page.locator('[name="admin_format[nameEn]"]'), `フォーマット「${v.名日}」のフォーマット名(英)`).toHaveValue(v.名英);
    return found;
  }
  return registerFormat(page, v, issue);
}
