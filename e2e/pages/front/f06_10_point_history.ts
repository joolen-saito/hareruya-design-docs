/** F06-10 ポイント履歴（フロントのマイページ）の操作。セレクタ・アドレスはここだけに書く。正本: cases/F06-10_test_cases.tsv */
import { Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const T = 30_000;
const clean = (t: string | null | undefined): string => (t ?? "").replace(/\s+/g, " ").trim();
/** 前へ・次へを除く、ページ番号のリンク・現在のページの要素 */
const 番号の項目 = ".p-hareruya-pagination__item:not(.p-hareruya-pagination__item--prev):not(.p-hareruya-pagination__item--next):not(.p-hareruya-pagination__item--ellipsis)";

export type 行の項目 = { 有: boolean; 文: string; リンクあり: boolean };

export class PointHistoryPage {
  constructor(readonly page: Page, readonly 言語: "ja" | "en" = "ja") { page.setDefaultTimeout(T); }
  get path(): string { return new URL(this.page.url()).pathname; }
  get query(): URLSearchParams { return new URL(this.page.url()).searchParams; }

  async 開く(): Promise<void> {
    await this.page.goto(`${BASE_URL}/${this.言語}/mypage/point_history`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  async ポイント履歴画面である(): Promise<boolean> { return (await this.page.locator(".p-hareruya-history-list--point").count()) > 0; }
  /** 履歴の行（1件1枠） */
  get 履歴の行(): Locator { return this.page.locator(".p-hareruya-history-list__list--point .p-hareruya-history-list__box"); }
  /** 内容（備考）の文を含む履歴の行 */
  内容の行(内容: string): Locator { return this.履歴の行.filter({ hasText: 内容 }); }
  /** 日付の文（画面の表記）を含む履歴の行 */
  日付の行(日付: string): Locator { return this.履歴の行.filter({ has: this.page.locator("dd", { hasText: 日付 }) }); }
  /** 行の項目（見出しの文字で引く）。無ければ 有=false */
  async 項目(行: Locator, 見出し: string): Promise<行の項目> {
    const r = 行.locator(".p-hareruya-history-list__order-info-row").filter({ has: this.page.locator("dt", { hasText: 見出し }) });
    if ((await r.count()) === 0) return { 有: false, 文: "", リンクあり: false };
    const dd = r.first().locator("dd");
    return { 有: true, 文: clean(await dd.innerText()), リンクあり: (await dd.locator("a").count()) > 0 };
  }
  /** 履歴の内容（備考）を上から */
  async 内容を上から(): Promise<string[]> {
    return (await this.履歴の行.locator(".p-hareruya-history-list__order-info-row.is-vertical-sp dd").allInnerTexts()).map(clean);
  }
  /** 注文番号のリンク（行の中） */
  注文番号のリンク(行: Locator): Locator { return 行.locator(".p-hareruya-history-list__order-info-row dd a"); }

  /** 一覧上部のポイント情報の文（現在のポイント・次に消失するポイント） */
  async 一覧上部の文(): Promise<string> {
    const c = this.page.locator(".p-hareruya-history-list__point-info");
    return (await c.count()) === 0 ? "" : clean(await c.innerText());
  }
  /** 一覧上部のポイント情報の行の数（現在のポイント1行に、次に消失するポイントがあれば2行） */
  async 次に消失するポイントの行数(): Promise<number> {
    return this.page.locator(".p-hareruya-history-list__point-info p").count();
  }
  /** 画面の上部（ヘッダー・パンくず・見出し・ポイント情報）の文。会員の名前が出ていないかの確認に使う */
  async 画面上部の文(): Promise<string> {
    const p = this.page;
    const 文 = async (l: Locator) => ((await l.count()) === 0 ? "" : clean(await l.first().innerText()));
    return [await 文(p.locator("header")), await 文(p.locator(".p-hareruya-breadcrumb")), await 文(p.locator("h1")), await this.一覧上部の文()].filter(Boolean).join(" / ");
  }

  // ---- 表示件数・表示範囲 ----
  get 表示件数の選択欄(): Locator { return this.page.locator("#change-page-count"); }
  async 表示件数(): Promise<string> { return (await this.表示件数の選択欄.count()) === 0 ? "" : this.表示件数の選択欄.inputValue(); }
  async 表示件数を選ぶ(件数: number): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.表示件数の選択欄.selectOption({ value: String(件数) }, { timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
  }
  /** 表示範囲の文から読んだ数（「[21 ~ 25 件] 25 件あります」→ 開始21・終了25・全件25） */
  async 表示範囲(): Promise<{ 文: string; 開始: number; 終了: number; 全件: number } | null> {
    const c = this.page.locator(".p-hareruya-toolbar__count");
    if ((await c.count()) === 0) return null;
    const 文 = clean(await c.first().innerText());
    const m = 文.match(/(\d+)\D+?(\d+)\D+?(\d+)/);
    return m ? { 文, 開始: Number(m[1]), 終了: Number(m[2]), 全件: Number(m[3]) } : { 文, 開始: NaN, 終了: NaN, 全件: NaN };
  }

  // ---- ページ送り ----
  get 上のページング(): Locator { return this.page.locator(".p-hareruya-toolbar__pagination"); }
  get 下のページング(): Locator { return this.page.locator(".p-hareruya-history-list__pagination-wrap--bottom"); }
  async 現在のページ(): Promise<string> {
    const c = this.page.locator(".p-hareruya-pagination__item--current .p-hareruya-pagination__number").first();
    return (await c.count()) === 0 ? "" : clean(await c.innerText());
  }
  /** 上のページングの、ページ番号のリンク（現在のページは含まない）の番号 */
  async ページ番号のリンク(): Promise<number[]> {
    const ns = await this.上のページング.locator(`${番号の項目} a.p-hareruya-pagination__link`).allInnerTexts();
    return ns.map((t) => Number(clean(t))).filter((n) => Number.isFinite(n));
  }
  /** 上のページングの、リンクにあたる要素（前へ・次へ・最初・最後・ページ番号）の表示名 */
  async ページ送りの文字(): Promise<string[]> {
    return (await this.上のページング.locator("a.p-hareruya-pagination__link").allInnerTexts()).map(clean);
  }
  get 前へのリンク(): Locator { return this.page.locator(".p-hareruya-pagination__item--prev a"); }
  get 次へのリンク(): Locator { return this.page.locator(".p-hareruya-pagination__item--next a"); }
  /** 「最初」「最後」と書かれたリンク（ページ送りの中） */
  get 最初のリンク(): Locator { return this.page.locator(".p-hareruya-pagination__nav a").filter({ hasText: /^\s*最初\s*$/ }); }
  get 最後のリンク(): Locator { return this.page.locator(".p-hareruya-pagination__nav a").filter({ hasText: /^\s*最後\s*$/ }); }
  /** 上のページングにある、ページ番号 n のリンク */
  ページ番号のリンクの要素(n: number): Locator { return this.上のページング.locator(`${番号の項目} a.p-hareruya-pagination__link[data-page="${n}"]`).first(); }

  /** ページ番号 n のリンクを押す。リンクが無ければ押さずに false を返す（呼び出し側が注記を残し、期待結果で確かめる） */
  async ページ番号を押す(n: number): Promise<boolean> {
    const l = this.ページ番号のリンクの要素(n);
    if ((await l.count()) === 0) return false;
    await this.押して遷移する(l);
    return true;
  }
  /** 「最初」「最後」のリンクを押す。リンクが無ければ押さずに false */
  async 最初を押す(): Promise<boolean> {
    if ((await this.最初のリンク.count()) === 0) return false;
    await this.押して遷移する(this.最初のリンク.first());
    return true;
  }
  async 最後を押す(): Promise<boolean> {
    if ((await this.最後のリンク.count()) === 0) return false;
    await this.押して遷移する(this.最後のリンク.first());
    return true;
  }
  /** 現在表示中のページ番号の位置（リンクではない）を押す。押したあと、画面が動いたかは URL で確かめる */
  async 現在のページの位置を押す(): Promise<void> {
    const c = this.page.locator(".p-hareruya-pagination__item--current").first();
    await c.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await c.click({ timeout: 10_000 }).catch(() => undefined);
    await this.page.waitForTimeout(800);
    await this.page.waitForLoadState("load");
  }

  // ---- パンくず・画面下部 ----
  get パンくず現在地(): Locator { return this.page.locator(".p-hareruya-breadcrumb__current").first(); }
  async 現在地がリンクか(): Promise<boolean> {
    const cur = this.パンくず現在地;
    return (await cur.locator("a").count()) > 0 || (await cur.evaluate((e) => !!e.closest("a")));
  }
  get パンくずホーム(): Locator { return this.page.locator("a.p-hareruya-breadcrumb__link").first(); }
  async パンくずの現在地を押す(): Promise<void> {
    await this.パンくず現在地.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await this.パンくず現在地.click({ timeout: 10_000 }).catch(() => undefined);
    await this.page.waitForTimeout(800);
    await this.page.waitForLoadState("load");
  }
  get 画面下部のマイページ(): Locator { return this.page.locator(".p-hareruya-history-list__btn a").first(); }
  async マイページ画面である(): Promise<boolean> { return (await this.page.locator(".p-hareruya-mypage__container").count()) > 0; }

  async 押して遷移する(l: Locator): Promise<void> {
    await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 });
    try {
      await l.click({ timeout: 10_000 });
    } catch (e) {
      test.info().annotations.push({ type: "正本の外の補い", description: `この要素は固定ヘッダーが上に重なり、普通のクリックでは押せなかった。クリックの操作を要素へ直接送って続けた（${String(e).split("\n")[0].slice(0, 80)}）` });
      await l.dispatchEvent("click");
    }
    await nav;
    await this.page.waitForLoadState("load");
  }
  /** 注文番号のリンクは別のタブで開く。開いたタブの画面を返す */
  async 別タブで押す(l: Locator): Promise<Page> {
    await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const [tab] = await Promise.all([this.page.context().waitForEvent("page", { timeout: 30_000 }), l.click({ timeout: 10_000 })]);
    await tab.waitForLoadState("load");
    return tab;
  }
}
