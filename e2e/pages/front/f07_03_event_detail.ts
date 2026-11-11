/**
 * F07-03 大会詳細（フロント。アドレスは /ja/events/<イベント詳細ID>/detail）の画面部品。セレクタはここだけに書く。
 *
 * 画面の作り（アプリの Twig: Event/detail.twig・_event_detail_actions.twig で確かめたもの）:
 * - パンくずは「ホーム > イベントTOP > 店舗名 > 先頭のフォーマット > 開催日時」。店舗名・フォーマット・開催日時は大会詳細検索（/events/list）への
 *   リンクで、それぞれ店舗（venues）・フォーマット（formats）・開催日の範囲（from・to）を条件に付け、過去も含める（allowPast）。
 * - バナー画像は、イベントにバナーURLがあるときだけ、見出しの上の領域に出る。
 * - フリー入力エリアはアコーディオン。見出しのボタンの開閉の状態（aria-expanded）と、内容の欄の hidden で開閉を表す。
 * - 事前予約欄は、日程の「オンライン受付あり」のときだけ出るアコーディオン（見出しのボタンの ID は event-pre-registration-trigger）。
 * - 最下段のボタン領域: 申込（/events/<ID>/entry へのリンク）か キャンセル申込（お問い合わせ /contact へのリンク）のどちらか、
 *   デッキ登録（/deckentry/<ID>/edit へのリンク）、Googleカレンダー、X・LINE・リンクシェアのボタン、戻る。
 * - リンクシェアは、ブラウザに共有の機能（navigator.share）があればそれを使い、無ければクリップボードへ書いて「リンクをコピーしました」を出す。
 */
import { Locator, Page, Response } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const exact = (s: string) => new RegExp(`^\\s*${esc(s)}\\s*$`);
const 整える = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

export const 大会詳細のパス = (日程ID: string, 言語: "ja" | "en" = "ja") => `/${言語}/events/${日程ID}/detail`;

export class EventDetailPage {
  constructor(readonly page: Page) {}

  /** 大会詳細画面を開く（設計書のアドレス /ja/events/<ID>/detail）。応答を返す */
  async 開く(日程ID: string, 言語: "ja" | "en" = "ja"): Promise<Response | null> {
    const res = await this.page.goto(`${BASE_URL}${大会詳細のパス(日程ID, 言語)}`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res;
  }

  get 本体(): Locator { return this.page.locator(".p-hareruya-event-detail"); }
  get イベント名(): Locator { return this.page.locator(".p-hareruya-event-detail h1").first(); }
  /** 表示している画面の言語（html の lang） */
  async 表示言語(): Promise<string> { return (await this.page.locator("html").getAttribute("lang")) ?? ""; }
  /** 見えている本文（空白を詰めたもの） */
  async 本文(): Promise<string> { return 整える(await this.page.locator("body").innerText()); }

  // ---- パンくず ----
  get パンくずの項目(): Locator { return this.page.locator(".p-hareruya-event-detail .p-hareruya-breadcrumb__item"); }
  async パンくずの文字(): Promise<string[]> { return (await this.パンくずの項目.allInnerTexts()).map(整える); }
  /** 表示名が一致するパンくずのリンク */
  パンくずのリンク(表示名: string): Locator {
    return this.page.locator(".p-hareruya-event-detail a.p-hareruya-breadcrumb__link").filter({ has: this.page.locator('[itemprop="name"]', { hasText: exact(表示名) }) });
  }
  /** 開催日時のパンくず（最後の項目＝現在地） */
  get 開催日時のパンくず(): Locator { return this.page.locator(".p-hareruya-event-detail .p-hareruya-breadcrumb__item--current a.p-hareruya-breadcrumb__link"); }

  /** リンクを押して、移った先の画面の読み込みまで待つ。移った先の応答を返す */
  async 押して移る(l: Locator): Promise<Response | null> {
    const [res] = await Promise.all([
      this.page.waitForResponse((r) => r.request().isNavigationRequest() && r.request().frame() === this.page.mainFrame(), { timeout: 60_000 }).catch(() => null),
      l.click({ timeout: 20_000 }),
    ]);
    await this.page.waitForLoadState("load");
    return res;
  }

  // ---- バナー ----
  get バナーの領域(): Locator { return this.page.locator(".p-hareruya-event-detail__mv"); }
  get バナー画像(): Locator { return this.page.locator(".p-hareruya-event-detail__mv img"); }

  // ---- フリー入力エリア ----
  フリー入力エリアの見出し(n: 1 | 2 | 3): Locator { return this.page.locator(`#event-free-area-trigger-${n}`); }
  フリー入力エリアの内容(n: 1 | 2 | 3): Locator { return this.page.locator(`#event-free-area-panel-${n}`); }

  // ---- 事前予約欄 ----
  get 事前予約欄(): Locator { return this.page.locator("section.p-hareruya-event-detail__accordion").filter({ has: this.page.locator("#event-pre-registration-trigger") }); }
  get 事前予約欄の見出し(): Locator { return this.page.locator("#event-pre-registration-trigger .p-hareruya-event-detail__accordion-title"); }
  /** 事前予約欄の、見出しが一致する行 */
  事前予約欄の行(見出し: string): Locator {
    return this.事前予約欄.locator(".p-hareruya-event-detail__info-row").filter({ has: this.page.locator(".p-hareruya-event-detail__info-label", { hasText: exact(見出し) }) });
  }
  async 事前予約欄の値(見出し: string): Promise<string> {
    const row = this.事前予約欄の行(見出し);
    if ((await row.count()) === 0) return "";
    return 整える(await row.locator(".p-hareruya-event-detail__info-value").first().innerText());
  }

  // ---- 最下段のボタン領域 ----
  get ボタン領域(): Locator { return this.page.locator(".p-hareruya-event-detail__actions"); }
  /** 申込のボタン（大会申込ページへのリンク） */
  申込ボタン(日程ID: string): Locator { return this.ボタン領域.locator(`a[href*="/events/${日程ID}/entry"]`); }
  /** キャンセル申込のボタン（お問い合わせページへのリンク） */
  get キャンセル申込ボタン(): Locator { return this.ボタン領域.locator('a[href*="/contact"]'); }
  /** デッキ登録のボタン（大会デッキ登録編集ページへのリンク） */
  デッキ登録ボタン(日程ID: string): Locator { return this.ボタン領域.locator(`a[href*="/deckentry/${日程ID}/edit"]`); }
  get Googleカレンダーボタン(): Locator { return this.ボタン領域.locator("a.p-hareruya-event-detail__calendar-btn"); }
  get Xボタン(): Locator { return this.ボタン領域.locator("a.p-hareruya-event-detail__share-btn--x"); }
  get LINEボタン(): Locator { return this.ボタン領域.locator("a.p-hareruya-event-detail__share-btn--line"); }
  get リンクシェアボタン(): Locator { return this.ボタン領域.locator("button.p-hareruya-event-detail__share-btn--other"); }
  async ボタンの文言(l: Locator): Promise<string> { return 整える(await l.first().innerText()); }

  /** ブラウザに共有の機能（navigator.share）があるか（あればリンクシェアはクリップボードを使わない） */
  async 共有の機能がある(): Promise<boolean> { return this.page.evaluate(() => typeof (navigator as Navigator & { share?: unknown }).share === "function"); }
  /** クリップボードの文字を読む（クリップボードの読み取りを許可したブラウザで） */
  async クリップボードを読む(): Promise<string> { return this.page.evaluate(() => navigator.clipboard.readText()); }
}

// ---- 絞り込み結果画面（大会詳細検索の結果。/ja/events/list） ----

/** アドレスのクエリで、名前（name・name[]・name[n]）の値を並べる */
export function クエリの値(url: string, 名前: string): string[] {
  const out: string[] = [];
  for (const [k, v] of new URL(url).searchParams.entries()) if (k === 名前 || k === `${名前}[]` || new RegExp(`^${esc(名前)}\\[\\d+\\]$`).test(k)) out.push(v);
  return out;
}

/** 絞り込み結果画面の、検索条件の札（表示名） */
export async function 検索条件の札(page: Page): Promise<string[]> {
  return (await page.locator("a.c-hareruya-tag--keyword-event .c-hareruya-tag__text").allInnerTexts()).map(整える);
}
