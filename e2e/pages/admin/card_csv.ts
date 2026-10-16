/** カード一覧のCSV出力と、カードCSVアップロード（正本の「カード登録CSVアップロード」）。 */
import { Download, expect, Locator, Page } from "@playwright/test";
import { csvLine, csvRecords, decodeCsvBytes, parseCsv } from "../../lib/csv";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

export type CardCsvRecord = Record<string, string>;

async function downloadedText(download: Download): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of await download.createReadStream()) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return decodeCsvBytes(Buffer.concat(chunks));
}

/** カード一覧（新しいカードの順）。検索・行の選択・CSV出力を行う */
export class CardListPage {
  readonly form: Locator;
  readonly rows: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("#admin_search_form");
    this.rows = page.locator('#form_bulk tbody tr').filter({ has: page.locator('input[name="cardIds[]"]') });
  }

  async open(): Promise<void> {
    await this.page.goto(adminUrl("/card"));
    await expect(this.form, "カード一覧の検索欄").toBeVisible();
  }

  /** プロモ種別の候補（日本語名）から、除く名前以外の最初の候補を選ぶ。選んだ名前を返す */
  async choosePromotionOtherThan(excluded: string): Promise<string> {
    // プロモ種別の欄は、折りたたまれた「詳細検索」の中にある
    const detail = this.page.locator("#searchDetail");
    if (!(await detail.isVisible())) await this.page.locator('[data-bs-toggle="collapse"][href="#searchDetail"]').click();
    await expect(detail, "カード一覧の詳細検索").toBeVisible();
    const select = this.form.locator('select[name$="[promotion][]"]');
    await expect(select, "カード一覧のプロモ種別欄").toHaveCount(1);
    await this.form.locator('select[name$="[promotion][]"] + span.select2 .select2-selection').click();
    const options = this.page.locator(".select2-container--open .select2-results__option[aria-selected]");
    await expect(options.first(), "プロモ種別の候補").toBeVisible();
    const labels = (await options.allInnerTexts()).map((t) => t.trim());
    const index = labels.findIndex((l) => l !== "" && l !== excluded);
    if (index < 0) throw new Error(`プロモ種別に「${excluded}」以外の候補が無い: ${labels.join("、")}`);
    await options.nth(index).click();
    await this.page.keyboard.press("Escape");
    return labels[index];
  }

  async search(): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      this.form.locator('button[type="submit"]').click(),
    ]);
    const outcome = this.page.getByText(/^(検索結果：\d+件が該当しました|検索条件に合致するデータが見つかりませんでした)$/);
    await expect(outcome.first(), "カード一覧の検索結果").toBeVisible();
  }

  /** 結果欄の並び順を選ぶ（例: "id:ASC"）。選ぶと検索し直される */
  async sortBy(value: string): Promise<void> {
    const select = this.page.locator("#sort_key_pulldown");
    await expect(select, "カード一覧の並び順").toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), select.selectOption(value)]);
    await expect(this.page.getByText(/^検索結果：\d+件が該当しました$/).first(), "並べ替えた検索結果").toBeVisible();
    await expect(this.page.locator("#sort_key_pulldown"), "選んだ並び順").toHaveValue(value);
  }

  /** 一覧の先頭から n 件を選んで「CSV出力」し、出力された行（列名→値）を返す */
  async exportFirst(n: number): Promise<CardCsvRecord[]> {
    const count = await this.rows.count();
    if (count === 0) throw new Error("カード一覧に出力できるカードが無い");
    for (let i = 0; i < Math.min(n, count); i++) await this.rows.nth(i).locator('input[name="cardIds[]"]').check();
    const button = this.page.locator("#form_bulk button.action-submit").filter({ hasText: /^\s*CSV出力\s*$/ });
    await expect(button, "カード一覧の「CSV出力」").toHaveCount(1);
    const [download] = await Promise.all([this.page.waitForEvent("download"), button.click()]);
    return csvRecords(await downloadedText(download));
  }
}

/** 正本の「カードセット・レアリティ・レイアウト・画像URL(英語)は既存のデータにある任意の値」と「カード詳細IDは未使用の番号」 */
export type ExistingCardValues = { set: string; rarity: string; layout: string; imageEn: string; nextUnusedDetailId: number };

/**
 * 「未使用の番号」: カード一覧は既定で新しいカードから並ぶ。カード詳細IDは自動で振られ、新しいカードほど大きい。
 * 先頭のカードをCSV出力し、出力した行の最大より大きい番号を使う。他のカードが使っている番号なら、カードCSVの取込が
 * エラーで止まる（黙って他のカードを書き換えない）。
 * 「既存のデータにある任意の値」: 新しいカードにはレイアウト・画像が未登録のものがあるので、古い順に並べ替え、
 * 先頭のカードのうち4つの値がそろった行の値を使う。
 */
export async function readExistingCardValues(page: Page): Promise<ExistingCardValues> {
  const list = new CardListPage(page);
  await list.open();
  await list.search();
  const newest = await list.exportFirst(5);
  const ids = newest.map((r) => Number(r.card_detail_id)).filter((n) => Number.isInteger(n) && n > 0);
  if (ids.length === 0) throw new Error("カード一覧のCSV出力からカード詳細IDを読めない");
  await list.sortBy("id:ASC");
  const oldest = await list.exportFirst(5);
  const base = oldest.find((r) => r.set && r.rarity && r.layout && r.image_en);
  if (!base) throw new Error("カード一覧（古い順）の先頭5件に、カードセット・レアリティ・レイアウト・画像URL(英語)がそろったカード詳細が無い");
  return { set: base.set, rarity: base.rarity, layout: base.layout, imageEn: base.image_en, nextUnusedDetailId: Math.max(...ids) + 1 };
}

/** 正本の「プロモ種別は Non Promotion 以外の既存の種別」。プロモ種別で絞ったカードをCSV出力し、その英語名を読む */
export async function readExistingPromotionNameEn(page: Page): Promise<string> {
  const list = new CardListPage(page);
  await list.open();
  await list.choosePromotionOtherThan("ノンプロモ");
  await list.search();
  const rows = await list.exportFirst(1);
  const promo = rows.map((r) => r.promotion_type).find((p) => p && p !== "Non Promotion");
  if (!promo) throw new Error("プロモ種別で絞ったカードのCSV出力に、Non Promotion 以外のプロモ種別が無い");
  return promo;
}

/** カードCSVアップロード画面の雛形をダウンロードし、見出し（列名）を返す */
export async function downloadCardCsvTemplate(page: Page): Promise<string[]> {
  await page.goto(adminUrl("/card/csv_upload"));
  const [download] = await Promise.all([page.waitForEvent("download"), page.locator("#download-template-button").click()]);
  const [headers] = parseCsv(await downloadedText(download));
  if (!headers || !headers.includes("name_en") || !headers.includes("card_detail_id"))
    throw new Error(`カードCSVの雛形の見出しを読めない: ${headers?.join(",")}`);
  return headers;
}

/** 指定した列だけ値を入れ、ほかの列は空にする */
export function buildCardCsv(headers: string[], rows: CardCsvRecord[]): Buffer {
  const known = new Set(headers);
  for (const row of rows) for (const key of Object.keys(row)) if (!known.has(key)) throw new Error(`カードCSVの雛形に列「${key}」が無い`);
  const lines = [csvLine(headers), ...rows.map((row) => csvLine(headers.map((h) => row[h] ?? "")))];
  return Buffer.from(`${lines.join("\n")}\n`, "utf8");
}

export async function uploadCardCsv(page: Page, csv: Buffer, fileName: string, what: string, onWarning: (w: string) => void): Promise<void> {
  await page.goto(adminUrl("/card/csv_upload"));
  await page.locator("#upload-form input[type=file]").setInputFiles({ name: fileName, mimeType: "text/csv", buffer: csv });
  await page.locator("#upload-button").click();
  for (const warning of await expectSaved(page, what)) onWarning(warning);
}
