/**
 * M15-06 デッキ登録CSV（管理画面）の画面部品。セレクタはここだけに置く。
 * デッキ一覧（検索）は M15-01 の部品（pages/admin/m15_deck.ts の デッキ一覧）、デッキの画面登録・アーキタイプの用意は
 * M15-05 の部品（pages/admin/m15_05_deck_edit.ts）をそのまま使う。ここには CSV 登録の画面と、この機能のシードだけが使う部品を置く。
 *
 * 画面の表示名（アプリの Twig・翻訳ファイルで確かめたもの）:
 * - デッキ一覧の取り込みボタンは「CSV登録」（正本の「CSV,TSV取り込み」）。押すとデッキ登録CSVアップロード画面へ移る
 * - ファイルを選ぶボタンは「ファイルを選択」、送るボタンは「CSVファイルをアップロード」（正本の「CSVファイルのアップロード」）
 * - 取り込みが済むと、同じ画面へ移り直して「CSVファイルをアップロードしました」を出す。誤りがあれば同じ画面に赤い帯で誤りを出す
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";
import { デッキ一覧 } from "./m15_deck";
import { buildCardCsv, CardListPage, downloadCardCsvTemplate, uploadCardCsv } from "./card_csv";
import { findFormatId } from "./m12_09_used_card";
import { フォーマットコード } from "./f09_01_setup";

type Issue = (m: string) => void;

export const pathOf = (url: string): string => new URL(url).pathname;
export const CSV登録画面のパス = (): string => pathOf(adminUrl("/deck/csv_import"));
export const デッキ一覧のパス = (): string => pathOf(adminUrl("/deck"));

// ---------------------------------------------------------------------------
// デッキ登録CSVアップロード画面
// ---------------------------------------------------------------------------

export type 送信の結果 = { 送った: boolean; 移った画面: string; 成功: string[]; エラー: string[] };

export class デッキCSV登録画面 {
  constructor(readonly page: Page) {}

  get ファイルを選択ボタン(): Locator { return this.page.locator("#file-select"); }
  get ファイル欄(): Locator { return this.page.locator("#admin_csv_import_import_file"); }
  get 選んだファイル名(): Locator { return this.page.locator("#admin_csv_import_import_file_name"); }
  get アップロードボタン(): Locator { return this.page.locator("#upload-button"); }
  get 題名(): Locator { return this.page.locator(".c-pageTitle__title, .c-pageTitle h2").first(); }

  async 開く(): Promise<void> {
    await this.page.goto(adminUrl("/deck/csv_import"));
    await this.読み込みを待つ();
  }

  async 読み込みを待つ(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.ファイルを選択ボタン, "デッキ登録CSVアップロード画面の「ファイルを選択」").toBeVisible();
  }

  /** 「ファイルを選択」を押し、開いたファイルの選択でファイルを選ぶ（選んだファイル名の表示が変わるまで待つ） */
  async ファイルを選ぶ(名前: string, 中身: Buffer): Promise<void> {
    const [chooser] = await Promise.all([this.page.waitForEvent("filechooser"), this.ファイルを選択ボタン.click()]);
    await chooser.setFiles({ name: 名前, mimeType: "text/csv", buffer: 中身 });
    await expect(this.選んだファイル名, "選んだファイル名の表示").toHaveText(名前);
  }

  /** 「CSVファイルをアップロード」を押し、移った画面の帯（成功・誤り）を読む */
  async アップロードを押す(): Promise<送信の結果> {
    if (!(await this.アップロードボタン.isEnabled())) return { 送った: false, 移った画面: this.page.url(), 成功: [], エラー: [] };
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 600_000 }), this.アップロードボタン.click()]);
    await this.読み込みを待つ();
    return { 送った: true, 移った画面: this.page.url(), 成功: await this.帯(".alert-success"), エラー: await this.帯(".alert-danger") };
  }

  async 帯(sel: string): Promise<string[]> {
    const out: string[] = [];
    for (const e of await this.page.locator(sel).all()) if (await e.isVisible()) out.push((await e.innerText()).replace(/\s+/g, " ").trim());
    return out.filter((t) => t !== "デバッグモードが有効になっています。");
  }

  /** 画面に表示されている入力部品（ボタン・入力欄・チェック欄など）の表示名（上から順。見えているものだけ） */
  async 入力部品の表示名(): Promise<string[]> {
    return this.page.locator(".c-contentsArea button:visible, .c-contentsArea input:visible, .c-contentsArea select:visible, .c-contentsArea textarea:visible, .c-contentsArea label:visible").evaluateAll((es) => es.map((e) => {
      const el = e as HTMLInputElement;
      if (el.tagName === "INPUT" && (el.type === "checkbox" || el.type === "radio")) return `${el.type}:${el.labels?.[0]?.textContent?.trim() ?? el.name}`;
      if (el.tagName === "INPUT") return `${el.type}:${el.value || el.name}`;
      return (el.textContent ?? "").replace(/\s+/g, " ").trim();
    }).filter(Boolean));
  }

  /** 画面のチェック欄（見えているもの）の数と、表示名に「厳密にチェックする」を含むチェック欄・ラベルの数 */
  async 厳密チェックの欄の数(): Promise<{ チェック欄: number; 厳密: number }> {
    const チェック欄 = await this.page.locator(".c-contentsArea input[type=checkbox]:visible").count();
    const 厳密 = await this.page.locator(".c-contentsArea label:visible, .c-contentsArea input[type=checkbox]:visible").filter({ hasText: /厳密にチェックする/ }).count()
      + await this.page.locator(".c-contentsArea").getByLabel(/厳密にチェックする/).count();
    return { チェック欄, 厳密 };
  }
}

/** デッキ一覧の「CSV登録」ボタン（デッキ登録CSVアップロード画面へのリンク） */
export function CSV登録ボタン(page: Page): Locator {
  return page.locator(`.c-contentsArea a[href$="/deck/csv_import"]`);
}

/** デッキ一覧で「CSV登録」を押してデッキ登録CSVアップロード画面を開く。ボタンの表示名を返す */
export async function 一覧からCSV登録を開く(page: Page): Promise<string> {
  const b = CSV登録ボタン(page);
  await expect(b, "デッキ一覧のCSV登録ボタン").toHaveCount(1);
  const 名 = (await b.innerText()).trim();
  await Promise.all([page.waitForURL((u) => pathOf(u.toString()) === CSV登録画面のパス(), { waitUntil: "load" }), b.click()]);
  await new デッキCSV登録画面(page).読み込みを待つ();
  return 名;
}

// ---------------------------------------------------------------------------
// デッキ登録CSV（刷新後20項目）を組む
// ---------------------------------------------------------------------------

/** 見出し（表示順。アプリのCSVの形式の表と同じ） */
export const デッキCSVの見出し = [
  "プレイヤー名", "フォーマット", "アーキタイプ", "イベント詳細ID", "デッキ名", "順位", "成績", "タグ", "イベント名(英)", "イベント名(日)",
  "イベント開催日", "参照元", "イベント参加人数", "表示フラグ", "デッキリスト非公開フラグ", "メインリスト", "サイドリスト", "統率者", "デッキID", "代表カード名",
] as const;
export type デッキCSVの項目 = (typeof デッキCSVの見出し)[number];
export type デッキCSVの行 = Partial<Record<デッキCSVの項目, string>>;

/** UTF-8・カンマ区切り。カンマ・引用符・改行を含む値は二重引用符で囲む（メインリストの複数行は1つのセルの中の改行） */
export function デッキCSVを組む(行: デッキCSVの行[]): Buffer {
  const q = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = [デッキCSVの見出し.map(q).join(","), ...行.map((r) => デッキCSVの見出し.map((h) => q(r[h] ?? "")).join(","))];
  return Buffer.from(`${lines.join("\r\n")}\r\n`, "utf8");
}

// ---------------------------------------------------------------------------
// デッキ一覧（プレイヤー名・デッキIDで探す。シード用）
// ---------------------------------------------------------------------------

/** デッキ一覧を開き、欄（プレイヤー名・デッキID）に入れて「日付クリア」「検索する」を押す。表示されたデッキIDを返す */
export async function デッキ一覧で探す(page: Page, 欄: "player_name" | "deck_id", 値: string): Promise<string[]> {
  const l = new デッキ一覧(page);
  await l.開く();
  await l.f(欄).fill(値);
  await l.日付クリア.click();
  await l.検索する();
  return l.表示されたID();
}

// ---------------------------------------------------------------------------
// フォーマット（シード用。メイン・サイドの上限・下限と統率を入れる）
// ---------------------------------------------------------------------------

export type フォーマットの値 = {
  名日: string; 名英: string; 並び順: string; メタ日数?: string;
  メイン下限?: string; メイン上限?: string; サイド下限?: string; サイド上限?: string;
  統率を使う: boolean; ランキング表示?: boolean; メタ分布簡易化?: boolean;
};

/**
 * フォーマットを、あれば（フォーマット名(日)で探す）編集画面で記載の値へ戻して保存し、無ければ新規登録する。フォーマットIDを返す。
 * 記載の無い上限・下限は空。メタゲーム分析日数は必須の欄なので、記載が無ければ 30。
 */
export async function フォーマットを揃える(page: Page, v: フォーマットの値, issue: Issue): Promise<string> {
  const found = await findFormatId(page, v.名日);
  await page.goto(adminUrl(found ? `/format/${found}/edit` : "/format/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_format[${n}]"]`);
  await f("nameJp").fill(v.名日);
  await f("nameEn").fill(v.名英);
  await f("rank").fill(v.並び順);
  const code = f("code");
  if (await code.count()) {
    const now = await code.inputValue();
    if (!/^[A-Za-z0-9_\- ]{1,10}$/.test(now)) await code.fill(フォーマットコード(v.名英));
  }
  await f("MetaRange").fill(v.メタ日数 ?? "30");
  if (v.ランキング表示 !== undefined) await f("rankingFlg").setChecked(v.ランキング表示);
  if (v.メタ分布簡易化 !== undefined) await f("OtherMetaFlg").setChecked(v.メタ分布簡易化);
  await f("mainMinCardCount").fill(v.メイン下限 ?? "");
  await f("mainMaxCardCount").fill(v.メイン上限 ?? "");
  await f("sideMinCardCount").fill(v.サイド下限 ?? "");
  await f("sideMaxCardCount").fill(v.サイド上限 ?? "");
  await f("useCommandFlg").setChecked(v.統率を使う);
  for (const n of ["commandMaxCardCount", "commandMinCardCount"]) if (await f(n).isEnabled()) await f(n).fill("");
  await page.locator('button[type="submit"]').filter({ hasText: /^\s*(登録|新規登録|更新)\s*$/ }).first().click();
  for (const w of await expectSaved(page, `フォーマット「${v.名英}」の${found ? "保存" : "登録"}`)) issue(`フォーマット「${v.名英}」の警告「${w}」`);
  if (found) issue(`フォーマット「${v.名英}」は既にあったので、記載の値へ戻して使った（ID ${found}）`);
  const m = /\/format\/(\d+)\/edit/.exec(page.url());
  return m ? m[1] : (found ?? "");
}

// ---------------------------------------------------------------------------
// カード（シード用。カード登録CSVアップロードで作る）
// ---------------------------------------------------------------------------

export type カードの値 = {
  名英: string; 名日?: string;
  /** 使用制限フォーマット（フォーマット名(英)） */
  制限?: string[];
  /** 画像URL(英語)。省略は既存のカードの画像URL（カードごとに違うもの） */
  画像?: string;
  /** カードセット・レアリティ・レイアウト。省略は既存のカードの値 */
  セット?: { set: string; rarity: string; layout: string };
};

/** カード一覧をキーワードで検索し、表示された行をCSV出力して返す */
export async function カードをCSVで読む(page: Page, 語: string): Promise<Record<string, string>[]> {
  const list = new CardListPage(page);
  await list.open();
  await page.locator("#admin_search_card_multi").fill(語);
  await list.search();
  if ((await list.rows.count()) === 0) return [];
  return list.exportFirst(20);
}

/** 画像のある既存のカードから、互いに違う画像URL・カードセット・レアリティ・レイアウトを n 件読む（古いカードから） */
async function 既存の画像を読む(page: Page, n: number): Promise<{ set: string; rarity: string; layout: string; image: string }[]> {
  const list = new CardListPage(page);
  await list.open();
  await list.search();
  await list.sortBy("id:ASC");
  const rows = await list.exportFirst(40);
  const out: { set: string; rarity: string; layout: string; image: string }[] = [];
  for (const r of rows) {
    if (!(r.set && r.rarity && r.layout && r.image_en)) continue;
    if (out.some((o) => o.image === r.image_en)) continue;
    out.push({ set: r.set, rarity: r.rarity, layout: r.layout, image: r.image_en });
    if (out.length === n) return out;
  }
  throw new Error(`画像のある既存のカードから、違う画像を${n}件読めない（${out.length}件）`);
}

/**
 * カードを、カード登録CSVアップロードで登録（同じカード名(英)があれば、そのカード詳細を記載の値へ戻す）する。
 * Foil・プロモ種別は空。カード名(英)→ 使ったカードセット・レアリティ・レイアウト・画像URL を返す。
 */
export async function カードを揃える(page: Page, defs: カードの値[], what: string, issue: Issue): Promise<Map<string, { set: string; rarity: string; layout: string; image: string }>> {
  const imgs = await 既存の画像を読む(page, defs.length);
  const headers = await downloadCardCsvTemplate(page);
  const rows: Record<string, string>[] = [];
  const out = new Map<string, { set: string; rarity: string; layout: string; image: string }>();
  for (const [i, d] of defs.entries()) {
    const have = (await カードをCSVで読む(page, d.名英)).filter((r) => r.name_en === d.名英);
    const detailIds = [...new Set(have.map((r) => r.card_detail_id).filter(Boolean))];
    if (detailIds.length > 1) issue(`${what}: カード「${d.名英}」には詳細が${detailIds.length}件ある。先頭（ID ${detailIds[0]}）を記載の値に戻した`);
    const now = have.find((r) => r.card_detail_id === detailIds[0]);
    const set = d.セット ?? (now?.set && now.rarity && now.layout ? { set: now.set, rarity: now.rarity, layout: now.layout } : { set: imgs[i].set, rarity: imgs[i].rarity, layout: imgs[i].layout });
    const image = d.画像 ?? (now?.image_en || imgs[i].image);
    rows.push({
      name_en: d.名英, name_jp: d.名日 ?? d.名英, cmc: "0",
      restriction_format: (d.制限 ?? []).join(","),
      set: set.set, rarity: set.rarity, layout: set.layout, image_en: image, card_detail_id: detailIds[0] ?? "",
    });
    out.set(d.名英, { ...set, image });
  }
  const known = new Set(headers);
  for (const r of rows) for (const k of Object.keys(r)) if (!known.has(k)) { issue(`${what}: カードCSVの雛形に列「${k}」が無いので入れなかった`); delete r[k]; }
  await uploadCardCsv(page, buildCardCsv(headers, rows), `${what.replace(/[^A-Za-z0-9_-]/g, "_")}.csv`, `${what} のカードCSVアップロード`, (w) => issue(`${what}: カードCSVの警告「${w}」`));
  return out;
}
