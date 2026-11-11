/** F06-11 買取履歴一覧（フロントのマイページ）の操作。セレクタ・アドレスはここだけに書く。正本: cases/F06-11_test_cases.tsv */
import { Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const T = 30_000;
export type 言語 = "ja" | "en";

export class PurchaseHistoryPage {
  constructor(readonly page: Page, readonly 言語: 言語 = "ja") { page.setDefaultTimeout(T); }
  get path(): string { return new URL(this.page.url()).pathname; }
  private url(p: string): string { return `${BASE_URL}/${this.言語}${p}`; }

  async ログインする(メール: string, パスワード: string): Promise<void> {
    await this.page.goto(this.url("/mypage/login"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    const form = this.page.locator("form#login_mypage");
    await form.locator("#login_email").fill(メール, { timeout: T });
    await form.locator("#login_pass").fill(パスワード, { timeout: T });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), form.locator("button[type=submit]").click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }
  async 履歴一覧を開く(): Promise<void> {
    await this.page.goto(this.url("/mypage/purchase_history"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  async マイページを開く(): Promise<void> {
    await this.page.goto(this.url("/mypage/"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  async ログイン画面である(): Promise<boolean> { return (await this.page.locator("form#login_mypage").count()) > 0; }
  async 履歴一覧画面である(): Promise<boolean> { return (await this.page.locator(".p-hareruya-history-list").count()) > 0 && /purchase_history/.test(this.path); }

  /** マイページの買取履歴へのリンク */
  get 買取履歴へのリンク(): Locator { return this.page.locator('a[href$="/mypage/purchase_history"]'); }
  get 履歴の行(): Locator { return this.page.locator(".p-hareruya-history-list__box"); }
  get 履歴なしの案内(): Locator { return this.page.locator(".p-hareruya-history-list__title .p-hareruya-message-box--info"); }
  /** 件数・表示範囲の文（ツールバー。無ければ空） */
  async 件数の表示(): Promise<string> {
    const c = this.page.locator(".p-hareruya-toolbar__count");
    return (await c.count()) === 0 ? "" : ((await c.first().innerText()) ?? "").replace(/\s+/g, " ").trim();
  }
  get マイページへ戻る(): Locator { return this.page.locator(".p-hareruya-history-list__btn a").first(); }

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
}

// ---------------------------------------------------------------- 一覧の行・ページ送り・詳細（2026-11-10 追加）
//
// 画面の作り（アプリのテンプレート Mypage/purchase_history.twig・purchase_history_pager.twig と翻訳ファイルで確かめた）:
// - 1件の買取は .p-hareruya-history-list__box。見出し（dt）「依頼日」「店舗」「買取番号」「依頼内容」「買取金額合計」「処理状態」と値（dd）の組。
//   買取番号はリンク（詳細へ）、行の下に「詳細を見る」ボタン。
// - 依頼内容は区分ごとに1行（区分の表示「えらんで買取」「まとめて買取」・言語・状態・商品名）と、残りがあれば「ほか○件」の行。
// - 処理状態は「受付完了」「査定中」「査定完了」「振込待ち」「買取完了」「キャンセル」のラベル。買取金額合計は「¥1,000」の形。
// - ページ送りは件数の横（画面上部）と一覧の下（画面下部）の2か所。ページが1つのときは出ない。
//   番号のリンク、現在のページは番号だけ（リンクでない）、「前」「次」「最初」「最後」のリンク。

const 正規 = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const 文字を逃がす = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export type 依頼内容の行 = { 区分: string; 商品名: string; ほか: string };
export type 一覧の行 = { 依頼日: string; 店舗: string; 買取番号: string; 依頼内容: 依頼内容の行[]; 依頼内容の文: string; 買取金額合計: string; 処理状態: string };
export type ページ送りの位置 = "上部" | "下部";
export type ページ送り = { ある: boolean; 現在: string; 番号リンク: string[]; 最初: boolean; 最後: boolean };

export class PurchaseHistoryListPage extends PurchaseHistoryPage {
  /** ページ番号・表示件数を指定して一覧を開く（指定しないものはアドレスに付けない） */
  async 指定して開く(q: { page?: number; pageSize?: number }): Promise<void> {
    const sp = new URLSearchParams();
    if (q.page !== undefined) sp.set("page", String(q.page));
    if (q.pageSize !== undefined) sp.set("pageSize", String(q.pageSize));
    const qs = sp.toString();
    await this.page.goto(`${BASE_URL}/${this.言語}/mypage/purchase_history${qs ? `?${qs}` : ""}`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }

  /** 買取番号のリンク（表示の文と完全に一致するもの） */
  番号リンク(番号: string): Locator {
    return this.page.locator(".p-hareruya-history-list__box a.c-hareruya-link").filter({ hasText: new RegExp(`^\\s*${文字を逃がす(番号)}\\s*$`) });
  }
  /** 買取番号の行 */
  行(番号: string): Locator { return this.履歴の行.filter({ has: this.番号リンク(番号) }); }
  /** 行の「詳細を見る」ボタン */
  詳細を見る(番号: string): Locator { return this.行(番号).locator(".p-hareruya-history-list__more-btn a"); }

  /** 一覧に出ている買取番号（上から順） */
  async 番号の並び(): Promise<string[]> {
    return (await this.page.locator(".p-hareruya-history-list__box a.c-hareruya-link").allInnerTexts()).map(正規);
  }

  /** 買取番号のリンクの宛先（ネット買取・店頭買取の別と、詳細のアドレスの番号） */
  async リンクの宛先(番号: string): Promise<{ 種類: "net" | "otc"; 番号: string }> {
    const href = (await this.番号リンク(番号).first().getAttribute("href", { timeout: T })) ?? "";
    const m = /\/purchase_history\/(net|otc)\/(\d+)/.exec(href);
    if (!m) throw new Error(`買取履歴一覧の買取番号「${番号}」のリンクの宛先を読めない（${href}）`);
    return { 種類: m[1] as "net" | "otc", 番号: m[2] };
  }

  /** 買取番号の行を読む（行が1件でなければ落とす） */
  async 行を読む(番号: string): Promise<一覧の行> {
    const box = this.行(番号);
    const n = await box.count();
    if (n !== 1) throw new Error(`買取履歴一覧に買取番号「${番号}」の行が ${n} 件（1件のはず。一覧: ${(await this.番号の並び()).join("、")}）`);
    await box.scrollIntoViewIfNeeded();
    return box.evaluate((el) => {
      const norm = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
      const v: Record<string, Element | null> = {};
      for (const row of Array.from(el.querySelectorAll(".p-hareruya-history-list__order-info-row"))) {
        v[norm(row.querySelector("dt")?.textContent)] = row.querySelector("dd");
      }
      const summary = v["依頼内容"];
      const lines: { 区分: string; 商品名: string; ほか: string }[] = [];
      if (summary) {
        for (const main of Array.from(summary.querySelectorAll(".p-hareruya-history-list__order-info-name-main"))) {
          const 区分 = norm(main.querySelector(".p-hareruya-history-list__order-info-purchase-type")?.textContent);
          const clone = main.cloneNode(true) as Element;
          clone.querySelectorAll("span").forEach((s) => s.remove());
          const next = main.nextElementSibling;
          const ほか = next && next.classList.contains("p-hareruya-history-list__order-info-name-other") ? norm(next.textContent) : "";
          lines.push({ 区分, 商品名: norm(clone.textContent), ほか });
        }
      }
      return {
        依頼日: norm(v["依頼日"]?.textContent), 店舗: norm(v["店舗"]?.textContent), 買取番号: norm(v["買取番号"]?.textContent),
        依頼内容: lines, 依頼内容の文: norm((summary as HTMLElement | null)?.innerText ?? summary?.textContent),
        買取金額合計: norm(v["買取金額合計"]?.textContent), 処理状態: norm(v["処理状態"]?.textContent),
      };
    });
  }

  private ページ送りの枠(位置: ページ送りの位置): Locator {
    return this.page.locator(位置 === "上部" ? ".p-hareruya-toolbar__pagination .p-hareruya-pagination" : ".p-hareruya-history-list__pagination-wrap--bottom .p-hareruya-pagination");
  }
  /** ページ送りの「最初」「最後」のリンク */
  ページ送りのリンク(位置: ページ送りの位置, 文: "最初" | "最後"): Locator {
    return this.ページ送りの枠(位置).locator("a.p-hareruya-pagination__link").filter({ hasText: new RegExp(`^\\s*${文}\\s*$`) });
  }
  /** ページ送りを読む（無ければ「ある: false」） */
  async ページ送りを読む(位置: ページ送りの位置): Promise<ページ送り> {
    const nav = this.ページ送りの枠(位置);
    if ((await nav.count()) === 0) return { ある: false, 現在: "", 番号リンク: [], 最初: false, 最後: false };
    await nav.first().scrollIntoViewIfNeeded();
    return {
      ある: true,
      現在: 正規(await nav.locator(".p-hareruya-pagination__item--current").first().textContent()),
      番号リンク: (await nav.locator("a.p-hareruya-pagination__link .p-hareruya-pagination__number").allInnerTexts()).map(正規),
      最初: (await this.ページ送りのリンク(位置, "最初").count()) > 0,
      最後: (await this.ページ送りのリンク(位置, "最後").count()) > 0,
    };
  }
  /** ページ送りの番号のリンクを押す */
  async ページ番号を押す(位置: ページ送りの位置, 番号: number): Promise<void> {
    const link = this.ページ送りの枠(位置).locator("a.p-hareruya-pagination__link")
      .filter({ has: this.page.locator(".p-hareruya-pagination__number", { hasText: new RegExp(`^\\s*${番号}\\s*$`) }) }).first();
    await link.waitFor({ state: "visible", timeout: T });
    await this.押して遷移する(link);
  }

  /** ページ送りの「最初」「最後」のリンクを押す */
  async ページ送りのリンクを押す(位置: ページ送りの位置, 文: "最初" | "最後"): Promise<void> {
    const link = this.ページ送りのリンク(位置, 文).first();
    await link.waitFor({ state: "visible", timeout: T });
    await this.押して遷移する(link);
  }
  /** ツールバーの表示件数の選択で件数を選ぶ（選ぶと画面のスクリプトが1ページ目を開き直す） */
  async 表示件数を選ぶ(件数: number): Promise<void> {
    const sel = this.page.locator("#js-purchase-history-page-size");
    await sel.waitFor({ state: "visible", timeout: T });
    await Promise.all([
      this.page.waitForURL((u) => u.searchParams.get("pageSize") === String(件数), { timeout: 60_000 }),
      sel.selectOption(String(件数), { timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
  }

  /** 買取履歴詳細の「買取番号」の値（見出し dt の次の dd） */
  async 詳細の買取番号(): Promise<string> {
    const dt = this.page.locator("dt").filter({ hasText: /^\s*買取番号\s*$/ }).first();
    await dt.waitFor({ state: "visible", timeout: T });
    return 正規(await dt.locator("xpath=following-sibling::dd[1]").innerText({ timeout: T }));
  }
  async 詳細画面である(): Promise<boolean> { return (await this.page.getByRole("heading", { name: /買取履歴詳細/ }).count()) > 0; }
}
