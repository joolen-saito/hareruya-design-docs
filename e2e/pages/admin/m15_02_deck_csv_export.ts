/**
 * M15-02 デッキCSV出力（管理画面）の画面部品。セレクタはここだけに置く。
 * デッキ一覧（検索・選択・「CSV出力」ボタン）は M15-01 の部品（pages/admin/m15_deck.ts の デッキ一覧）、デッキ新規登録画面は M15-05 の部品
 * （pages/admin/m15_05_deck_edit.ts の デッキ編集画面）、一括編集の区画は M15-04 の部品（pages/admin/m15_04_bulk_edit.ts）を使う。
 * ここは CSV出力の要求・応答・ダウンロードの見張りと、開発者ツールでの書き換え、シード用の小さな組み合わせだけを置く。
 *
 * 画面の作り（アプリの Twig・翻訳ファイルで確かめたもの）:
 * - 「CSV出力」ボタンは検索結果の一括操作のフォームの送信ボタン。押すと選択欄の値（デッキID）が送られる。
 *   選択が無いことを画面の仕掛けで止める作りは無い（送信の前に選択の数を見ない）。
 * - 送信のときに、画面の仕掛けが CSV出力用のなりすまし対策トークン（隠し項目）を、フォームのトークンの欄へ写す。
 * - 失敗のときは画面上部に「CSV出力対象のデッキが選択されていません。」（選択なし・該当なし）、トークンの誤りは有効期限切れの文を出して一覧へ戻る。
 */
import { Download, expect, Locator, Page, Request, Response } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { csvRecords, parseCsv } from "../../lib/csv";
import { デッキ一覧 } from "./m15_deck";
import { デッキ内容, デッキ編集画面 } from "./m15_05_deck_edit";
import { デッキ一括編集 } from "./m15_04_bulk_edit";
import { expectSaved } from "./common";

type Issue = (m: string) => void;

/** デッキ一覧の画面のパス（検索のあとのページ番号つきも含む） */
export const デッキ一覧のパスの形 = (): RegExp => new RegExp(`^${new URL(adminUrl("/deck")).pathname}(/search/\\d+)?$`);

/** 一覧でデッキIDを検索する（「日付クリア」を押してから、デッキIDの欄に入れて「検索する」） */
export async function デッキIDを入れて検索する(page: Page, ids: string[]): Promise<デッキ一覧> {
  const l = new デッキ一覧(page);
  await l.開く();
  await l.日付クリア.click();
  await l.f("deck_id").fill(ids.join(","));
  await l.検索する();
  return l;
}

/** 検索結果の行の選択欄にチェックを付ける */
export async function 選ぶ(l: デッキ一覧, ids: string[]): Promise<void> {
  for (const id of ids) {
    const box = l.選択(id);
    await expect(box, `検索結果にデッキID ${id} の行の選択欄`).toHaveCount(1);
    await box.check();
    await expect(box, `デッキID ${id} が選ばれる`).toBeChecked();
  }
}

/** 選択済みの選択欄の数 */
export async function 選択済みの数(page: Page): Promise<number> {
  return page.locator("input.searched_deck_id:checked").count();
}

/** 開発者ツールでの書き換え: 選択欄（元のデッキIDの行）の値を別の値にする */
export async function 選択の値を書き換える(l: デッキ一覧, 元のID: string, 値: string): Promise<void> {
  const box = l.選択(元のID);
  await expect(box, `デッキID ${元のID} の行の選択欄`).toHaveCount(1);
  await box.evaluate((e, v) => { (e as HTMLInputElement).value = v; }, 値);
  await expect(l.page.locator(`input.searched_deck_id[value="${値}"]`), `選択欄の値が ${値} になる`).toBeChecked();
}

/** 開発者ツールでの書き換え: CSV出力用のなりすまし対策トークン（送信のときにフォームへ写される隠し項目）を別の値にする */
export async function CSV出力のトークンを書き換える(page: Page, 値: string): Promise<void> {
  await page.locator("#csv_export_token_value").evaluate((e, v) => { (e as HTMLInputElement).value = v; }, 値);
  await expect(page.locator("#csv_export_token_value"), "CSV出力用のトークンの値").toHaveValue(値);
}

/** 正本の手順にある Console の文（未選択のまま CSV出力の要求を送る） */
export const 未選択で送る文 = "const f=document.getElementById('bulk_form');document.getElementById('bulk_form_token').value=document.getElementById('csv_export_token_value').value;f.action=document.getElementById('csv_export').formAction;f.submit();";

/** CSV出力の要求・応答・ダウンロードの見張り */
export class CSV出力の見張り {
  readonly 要求: Request[] = [];
  readonly 応答: Response[] = [];
  readonly ダウンロード: Download[] = [];
  private readonly onReq = (r: Request) => { if (r.method() === "POST" && /\/deck\/csv_export(\?|$)/.test(r.url())) this.要求.push(r); };
  private readonly onRes = (r: Response) => { if (r.request().method() === "POST" && /\/deck\/csv_export(\?|$)/.test(r.url())) this.応答.push(r); };
  private readonly onDl = (d: Download) => { this.ダウンロード.push(d); };

  constructor(readonly page: Page) {
    page.on("request", this.onReq);
    page.on("response", this.onRes);
    page.on("download", this.onDl);
  }

  止める(): void {
    this.page.off("request", this.onReq);
    this.page.off("response", this.onRes);
    this.page.off("download", this.onDl);
  }

  /**
   * 操作（ボタンを押す・Console の文を実行する）のあと、結果が出そろうまで待つ。
   * 要求が出なければ数秒待って終わる。出たら応答を待ち、移った画面の読み込みか、ダウンロードの始まりを待つ。
   */
  async 終わりを待つ(): Promise<void> {
    const t0 = Date.now();
    while (this.要求.length === 0 && Date.now() - t0 < 5_000) await this.page.waitForTimeout(200);
    if (this.要求.length === 0) return;
    const res = await Promise.race([
      this.要求[0].response().catch(() => null),
      new Promise<null>((r) => setTimeout(() => r(null), 30_000)),
    ]);
    const t1 = Date.now();
    while (this.ダウンロード.length === 0 && Date.now() - t1 < 30_000) {
      const st = res?.status() ?? 0;
      if (st >= 300 && st < 400) break;
      await this.page.waitForTimeout(200);
    }
    await this.page.waitForLoadState("load");
    if (this.ダウンロード.length === 0) await this.page.waitForTimeout(1_000);
  }

  /** 最初の応答の頭書き（無ければ空） */
  頭書き(名: string): string {
    return this.応答[0]?.headers()[名.toLowerCase()] ?? "";
  }

  /** 最初のダウンロードの中身（バイト列） */
  async 中身(): Promise<Buffer> {
    const d = this.ダウンロード[0];
    if (!d) throw new Error("ダウンロードが無い");
    const chunks: Buffer[] = [];
    for await (const c of await d.createReadStream()) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
    return Buffer.concat(chunks);
  }
}

/** 「CSV出力」ボタンを押して、結果が出そろうまで待つ */
export async function CSV出力を押す(l: デッキ一覧): Promise<CSV出力の見張り> {
  const w = new CSV出力の見張り(l.page);
  await expect(l.CSV出力, "「CSV出力」ボタン").toHaveText(/^\s*CSV出力\s*$/);
  await l.CSV出力.click();
  await w.終わりを待つ();
  return w;
}

/** UTF-8 の BOM が先頭にあるか */
export const BOMがある = (b: Buffer): boolean => b.length >= 3 && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf;

/** BOM に続く本文を UTF-8 として読む（読めなければ null） */
export function UTF8で読む(b: Buffer): string | null {
  const body = BOMがある(b) ? b.subarray(3) : b;
  try { return new TextDecoder("utf-8", { fatal: true }).decode(body); } catch { return null; }
}

/** CSV の中身を、見出しと「列名→値」の行にする（UTF-8 で読めなければ空） */
export function CSVを読む(b: Buffer): { 全行: string[][]; 行: Record<string, string>[] } {
  const t = UTF8で読む(b);
  if (t === null) return { 全行: [], 行: [] };
  return { 全行: parseCsv(t), 行: csvRecords(t) };
}

/** 画面上部のメッセージ（開発用の設定のときに常に出る帯は除く） */
export async function 上部のメッセージ(page: Page): Promise<{ 成功: string[]; エラー: string[]; 警告: string[] }> {
  const read = async (l: Locator) => {
    const out: string[] = [];
    for (const e of await l.all()) if (await e.isVisible()) out.push((await e.innerText()).replace(/\s+/g, " ").trim());
    return out.filter((t) => t && !t.includes("デバッグモードが有効"));
  };
  return { 成功: await read(page.locator(".alert-success")), エラー: await read(page.locator(".alert-danger")), 警告: await read(page.locator(".alert-warning")) };
}

/** 一括編集のフォーマットの選択欄で、フォーマットIDの選択肢を選ぶ（入力欄が表示されている前提。選択肢の表示はフォーマット名(日)） */
export async function 一括編集でフォーマットを選ぶ(b: デッキ一括編集, フォーマットID: string): Promise<string> {
  const sel = b.欄("format");
  await sel.selectOption(フォーマットID);
  await expect(sel, "一括編集のフォーマットの選択").toHaveValue(フォーマットID);
  return ((await sel.locator("option:checked").innerText()) ?? "").trim();
}

// ---- シード用 ----

/** フォーマット詳細の画面で、フォーマットIDのフォーマット名(日)・(英)を読む（無ければ null） */
export async function フォーマットの名前(page: Page, id: string): Promise<{ 名日: string; 名英: string } | null> {
  const res = await page.goto(adminUrl(`/format/${id}/edit`));
  await page.waitForLoadState("load");
  if (!res || !res.ok()) return null;
  const f = (n: string) => page.locator(`[name="admin_format[${n}]"]`);
  if ((await f("nameJp").count()) === 0) return null;
  return { 名日: (await f("nameJp").inputValue()).trim(), 名英: (await f("nameEn").inputValue()).trim() };
}

/** カード詳細の画面で、カードIDのカード名(英)を読む（無ければ null） */
export async function カードの英語名(page: Page, id: string): Promise<string | null> {
  const res = await page.goto(adminUrl(`/card/${id}/edit`));
  await page.waitForLoadState("load");
  if (!res || !res.ok()) return null;
  const f = page.locator("form#form1 #admin_card_nameEn");
  if ((await f.count()) === 0) return null;
  return (await f.inputValue()).trim();
}

/** デッキ編集の画面を開いたときの応答（デッキが無ければ 404） */
export async function デッキ編集の応答(page: Page, id: string): Promise<number> {
  const res = await page.goto(adminUrl(`/deck/${id}/edit`));
  await page.waitForLoadState("load");
  return res?.status() ?? 0;
}

/**
 * 代表カード検索の画面で語を完全一致で検索し、ページを送りながら画像IDの行を探して「決定」を押す。見つけた行のカード名の表示を返す。
 * 押さない（選ぶ = false）ときは、行の表示だけを返す（シードの確かめ用）。
 */
export async function 代表カードを画像IDで選ぶ(e: デッキ編集画面, 語: string, 画像ID: string, 選ぶ_ = true): Promise<string> {
  const page = e.page;
  const m = e.代表カード検索画面;
  await e.代表カード選択ボタン.click();
  await expect(m, "代表カード検索の画面").toBeVisible();
  await m.locator("#card_image_search_word").fill(語);
  await m.locator("#card_image_exact_match").check();
  const 検索 = async (押す: () => Promise<void>) => {
    const res = page.waitForResponse((r) => r.url().includes("/deck/search_card_image"));
    await 押す();
    const body = await (await res).json() as { page: number; totalPages: number };
    await expect(m.locator("#card_image_search_results table, #card_image_search_results p").first(), "代表カード検索の結果").toBeVisible();
    return body;
  };
  let body = await 検索(() => m.locator("#btn_search_card_image").click());
  for (let i = 0; i < 200; i++) {
    const b = m.locator(`button.select-card-image[data-id="${画像ID}"]`);
    if (await b.count()) {
      const 名 = ((await b.locator("xpath=ancestor::tr[1]/td[2]").innerText()) ?? "").trim();
      if (選ぶ_) {
        await b.click();
        await expect(m, "「決定」を押すと代表カード検索の画面が閉じる").toBeHidden();
      }
      return 名;
    }
    if (body.page >= body.totalPages) break;
    body = await 検索(() => m.locator("a.card-image-page").filter({ hasText: /^\s*次へ\s*$/ }).click());
  }
  throw new Error(`代表カード検索で「${語}」（完全一致）の結果に画像ID ${画像ID} の行が無い`);
}

/** シード用: デッキ新規登録画面で入力し、代表カードを画像IDで選んで「新規登録」を押す。振られたデッキIDを返す */
export async function 代表カードつきでデッキを登録する(page: Page, v: デッキ内容, 代表カード: { 語: string; 画像ID: string }, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/deck/new"));
  const e = new デッキ編集画面(page);
  await e.読み込みを待つ();
  const { デッキ名, デッキ種別, フォーマット, アーキタイプ, 公開状態, ...後 } = v;
  // アーキタイプを選ぶと、画面がアーキタイプの代表カードを読みに行く。先に選んでから代表カードを選ぶ（部品が応答を待つ）
  await e.入力する({ デッキ名, デッキ種別, フォーマット, アーキタイプ, 公開状態 }, issue);
  await 代表カードを画像IDで選ぶ(e, 代表カード.語, 代表カード.画像ID);
  await e.入力する(後, issue);
  await e.送信する(e.新規登録ボタン);
  for (const w of await expectSaved(page, `デッキ「${v.デッキ名 ?? ""}」の登録`)) issue(`デッキ「${v.デッキ名 ?? ""}」の登録時の警告「${w}」`);
  return e.デッキID();
}
