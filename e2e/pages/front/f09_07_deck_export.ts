/**
 * F09-07 デッキリスト書き出し（デッキリスト詳細の書き出しの入口と、書き出しの経路）の操作。セレクタ・HTTP のパスはここだけに置く。
 *
 * 画面の作り（アプリの Deck/show.twig・assets/js/deck_arena.js・翻訳ファイルで確かめたもの）:
 * - 入口は3つのリンク「Magic Online用テキスト」「アリーナ用インポートテキスト」「日本語テキスト」。デッキリスト公開のときだけ出る。
 *   アリーナ用・日本語の2つは、フォーマットが「MTG ARENAで導入済」のときだけ出る。同じ並びが PC 用と スマホ用に2組ある。
 * - 「Magic Online用テキスト」は書き出し（ファイルとして受け取る経路）へのリンク（押すと画面が移ってファイルを受け取る）。
 * - アリーナ用・日本語の2つは、画面のスクリプトがテキストの書き出し（テキストとして受け取る経路）へ言語の指定を付けて要求を送り、
 *   返った本文をクリップボードに入れる（画面は移らない）。
 * - デッキリスト詳細の読み込みは M15-05 の部品（m15_05_deck_show）を使う。
 */
import fs from "node:fs";
import { Download, expect, Locator, Page, Request, Response } from "@playwright/test";
import { デッキリスト詳細を開く } from "./m15_05_deck_show";

export const 入口の名前 = {
  MO: "Magic Online用テキスト",
  アリーナ: "アリーナ用インポートテキスト",
  日本語: "日本語テキスト",
} as const;
export type 入口 = keyof typeof 入口の名前;

const 正規 = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ファイルの経路 = /\/deck\/download\/[^/]*$/;
const テキストの経路 = /\/deck\/arena\/[^/]*$/;

/** 押して送られた要求（控えるアドレス） */
export type 送られた要求 = {
  アドレス: string;
  /** アドレスのデッキの識別子の部分 */
  識別子: string;
  /** アドレスの言語の指定（lang の値。無ければ空） */
  言語の指定: string;
  /** アドレスの先頭の表示言語（/ja/・/en/ の部分。無ければ空） */
  経路の表示言語: string;
  /** 要求ヘッダの言語（Accept-Language。無ければ空） */
  要求ヘッダの言語: string;
  /** 応答の HTTP ステータス（読めなければ 0） */
  状態: number;
  /** 押してファイルのダウンロードが起きたか */
  ダウンロード: Download | null;
};

export function アドレスを読む(url: string): Pick<送られた要求, "識別子" | "言語の指定" | "経路の表示言語"> {
  const u = new URL(url);
  const id = /\/deck\/(?:download|arena)\/([^/]*)$/.exec(u.pathname)?.[1] ?? "";
  const loc = /^\/(ja|en)(?:\/|$)/.exec(u.pathname)?.[1] ?? "";
  return { 識別子: id, 言語の指定: u.searchParams.get("lang") ?? "", 経路の表示言語: loc };
}

/** 控えたアドレスのデッキの識別子の部分を書き換える（空にするなら ""）。言語の指定などアドレスの残りはそのまま */
export function 識別子を差し替える(url: string, 識別子: string): string {
  const u = new URL(url);
  const m = /^(.*\/deck\/(?:download|arena)\/)[^/]*$/.exec(u.pathname);
  if (!m) throw new Error(`書き出しの経路のアドレスでない（${url}）`);
  u.pathname = m[1] + 識別子;
  return u.toString();
}

export class DeckExportPage {
  constructor(readonly page: Page) {}

  /** 書き出しの入口のリンク（PC 用・スマホ用の両方。名前の完全一致） */
  入口(種類: 入口): Locator {
    return this.page.locator("a.deckSearch-deckList__export__button").filter({ hasText: new RegExp(`^\\s*${正規(入口の名前[種類])}\\s*$`) });
  }
  /** 表示されている書き出しの入口 */
  表示された入口(種類: 入口): Locator { return this.入口(種類).filter({ visible: true }); }
  /** デッキの情報欄（デッキリストの公開・非公開に関わらず出る。読み込みが済んだ目印） */
  get 情報欄(): Locator { return this.page.locator(".deckSearch-deckList__information").first(); }

  /** デッキリスト詳細を開き、情報欄が出るまで待つ。応答の HTTP ステータスを返す */
  async 詳細を開く(デッキID: string): Promise<number> {
    const status = await デッキリスト詳細を開く(this.page, デッキID);
    if (status !== 200) throw new Error(`デッキリスト詳細（デッキID ${デッキID}）を開けない（応答 ${status}）`);
    await expect(this.情報欄, `デッキリスト詳細（デッキID ${デッキID}）の情報欄`).toBeVisible({ timeout: 30_000 });
    return status;
  }

  /** 書き出しの入口を押し、押して送られた書き出しの要求を控える */
  async 押して要求を控える(種類: 入口): Promise<送られた要求> {
    const link = this.表示された入口(種類).first();
    await expect(link, `「${入口の名前[種類]}」の入口が表示されている`).toBeVisible();
    const 経路 = 種類 === "MO" ? ファイルの経路 : テキストの経路;
    const match = (r: Request) => 経路.test(new URL(r.url()).pathname);
    const reqP = this.page.waitForRequest(match, { timeout: 30_000 });
    const resP = this.page.waitForResponse((r) => match(r.request()), { timeout: 30_000 }).catch(() => null);
    const dlP = 種類 === "MO" ? this.page.waitForEvent("download", { timeout: 30_000 }).catch(() => null) : Promise.resolve(null);
    await link.click();
    const req = await reqP;
    const [res, dl] = await Promise.all([resP, dlP]);
    return {
      アドレス: req.url(), ...アドレスを読む(req.url()),
      要求ヘッダの言語: (await req.allHeaders())["accept-language"] ?? "",
      状態: (res as Response | null)?.status() ?? 0,
      ダウンロード: dl,
    };
  }
}

/** アドレス欄で開いた結果 */
export type 開いた結果 = {
  アドレス: string;
  状態: number;
  /** 応答ヘッダ（名前は小文字） */
  ヘッダ: Record<string, string>;
  /** 添付として受け取ったファイル（無ければ null） */
  ファイル: { 名前: string; 中身: string } | null;
  /** 添付でないときの応答の本文 */
  本文: string;
  /** ファイルのダウンロードのときに、ブラウザが応答の記録を残さなかったため、同じセッションでヘッダだけを読み直したか */
  ヘッダを読み直した: boolean;
};

/**
 * アドレス欄にアドレスを入れて開く。添付の応答ならファイルを受け取り、保存先に保存してから読む。
 * 応答の HTTP ステータス・ヘッダは、その移動の応答から読む。
 */
export async function アドレス欄で開く(page: Page, url: string, 保存先: string): Promise<開いた結果> {
  const target = new URL(url).toString();
  let 移動の応答: Response | null = null;
  const onRes = (r: Response) => { if (r.request().isNavigationRequest() && r.url() === target) 移動の応答 = r; };
  page.on("response", onRes);
  const dlP = page.waitForEvent("download", { timeout: 30_000 }).catch(() => null);
  let navError = "";
  const res = await page.goto(target, { waitUntil: "load", timeout: 60_000 }).catch((e) => { navError = String(e); return null; });
  let dl: Download | null = null;
  if (!res || /attachment/i.test((await res.allHeaders())["content-disposition"] ?? "")) dl = await dlP;
  await page.waitForTimeout(300);
  page.off("response", onRes);
  if (!res && !dl) throw new Error(`アドレス ${target} を開けない（${navError}）`);

  let r: Response | null = res ?? 移動の応答;
  let ヘッダ: Record<string, string> = {};
  let 状態 = 0;
  let ヘッダを読み直した = false;
  if (r) { ヘッダ = await (r as Response).allHeaders(); 状態 = (r as Response).status(); }
  else {
    // ダウンロードになった移動の応答をブラウザが記録しないとき: 同じセッション（クッキー）で同じアドレスを読み直してヘッダを見る
    const again = await page.context().request.get(target, { maxRedirects: 0 });
    ヘッダ = again.headers(); 状態 = again.status(); ヘッダを読み直した = true;
  }
  let ファイル: 開いた結果["ファイル"] = null;
  if (dl) {
    const d = dl as Download;
    fs.mkdirSync(保存先, { recursive: true });
    const p = `${保存先}/${Date.now()}-${d.suggestedFilename().replace(/[^\w.\-]/g, "_")}`;
    await d.saveAs(p);
    ファイル = { 名前: d.suggestedFilename(), 中身: fs.readFileSync(p, "utf8") };
  }
  const 本文 = res && !dl ? await res.text().catch(() => "") : "";
  return { アドレス: target, 状態, ヘッダ, ファイル, 本文, ヘッダを読み直した };
}

/** 添付の指定（Content-Disposition）からファイル名を読む。添付でなければ空 */
export function 添付のファイル名(ヘッダ: Record<string, string>): string {
  const cd = ヘッダ["content-disposition"] ?? "";
  if (!/^\s*attachment/i.test(cd)) return "";
  return /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd)?.[1] ?? "";
}
export const 添付か = (ヘッダ: Record<string, string>) => /^\s*attachment/i.test(ヘッダ["content-disposition"] ?? "");
/** 内容の種別（Content-Type）の、文字コードの指定を除いた部分 */
export const 内容の種別 = (ヘッダ: Record<string, string>) => (ヘッダ["content-type"] ?? "").split(";")[0].trim();

/** テキストを行に分ける（復帰と改行・改行のどちらでも区切る） */
export const 行に分ける = (t: string): string[] => (t === "" ? [] : t.split(/\r\n|\n/));

/** 本文を JSON として読む（JSON でなければ null） */
export function JSONとして読む(本文: string): { success?: unknown; list?: unknown; errors?: unknown } | null {
  try { const v = JSON.parse(本文); return v && typeof v === "object" ? v : null; } catch { return null; }
}

/** 共通のエラー画面（フロントのエラー画面の本体） */
export const 共通のエラー画面 = (page: Page): Locator => page.locator(".p-hareruya-error");
