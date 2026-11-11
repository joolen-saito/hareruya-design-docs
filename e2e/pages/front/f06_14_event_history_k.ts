// 取り込み注記: 同じ部品を main 側も別に実装していたため、栗野側の版を別ファイルにした（栗野側のケース・シードがこちらを使う）。
/** F06-14 マイイベント・デッキ登録（フロントのマイページ）の操作。セレクタ・アドレスはここだけに書く。正本: cases/F06-14_test_cases.tsv */
import { Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const T = 30_000;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export class EventHistoryPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  get path(): string { return new URL(this.page.url()).pathname; }

  async ログインする(メール: string, パスワード: string): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/mypage/login`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    const form = this.page.locator("form#login_mypage");
    await form.locator("#login_email").fill(メール, { timeout: T });
    await form.locator("#login_pass").fill(パスワード, { timeout: T });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), form.locator("button[type=submit]").click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }
  async 開く(): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/mypage/event_history`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  async ログイン画面である(): Promise<boolean> { return (await this.page.locator("form#login_mypage").count()) > 0; }
  async 履歴画面である(): Promise<boolean> { return /\/mypage\/event_history/.test(this.path) && (await this.page.locator("h1").count()) > 0; }

  get イベントを探す(): Locator { return this.page.locator('a[href$="/events"]').filter({ hasText: /イベントを探す/ }).first(); }
  get マイページへ戻る(): Locator { return this.page.getByRole("link", { name: "マイページへ戻る" }).first(); }
  get パンくず現在地(): Locator { return this.page.locator(".p-hareruya-breadcrumb__current").first(); }
  async 現在地がリンクか(): Promise<boolean> {
    const cur = this.パンくず現在地;
    return (await cur.locator("a").count()) > 0 || (await cur.evaluate((e) => !!e.closest("a")));
  }
  get パンくずホーム(): Locator { return this.page.locator("a.p-hareruya-breadcrumb__link").first(); }

  // ---- イベント一覧（1件が article のカード。事前準備の大会名は、実行の印つきの名前） ----
  get カード(): Locator { return this.page.locator("article.p-hareruya-deckentry-list__card"); }
  get イベント名のリンク(): Locator { return this.page.locator(".p-hareruya-deckentry-list__card-title-link"); }
  async イベント名一覧(): Promise<string[]> {
    return (await this.イベント名のリンク.allInnerTexts()).map((s) => s.replace(/\s+/g, " ").trim());
  }
  /** イベント名（完全一致）のカード */
  行(名: string): Locator {
    return this.カード.filter({ has: this.イベント名のリンク.filter({ hasText: new RegExp(`^\\s*${esc(名)}\\s*$`) }) });
  }
  /** カードの中の、見出し（dt。完全一致）の値（dd） */
  欄(名: string, 見出し: string): Locator {
    return this.行(名).locator(".p-hareruya-deckentry-list__card-row")
      .filter({ has: this.page.locator("dt").filter({ hasText: new RegExp(`^\\s*${esc(見出し)}\\s*$`) }) }).locator("dd");
  }
  /** 処理状態の文字（決済中は、ヘルプのつぶやきを除いた文字だけ） */
  async 処理状態(名: string, 見出し = "処理状態"): Promise<string> {
    const dd = this.欄(名, 見出し);
    const 本体 = dd.locator(".p-hareruya-deckentry-list__status-with-help > span").first();
    const t = (await 本体.count()) > 0 ? await 本体.innerText() : await dd.innerText();
    return t.replace(/\s+/g, " ").trim();
  }
  /** カードの「デッキ登録」の行の値 */
  async デッキ登録の状況(名: string, 見出し = "デッキ登録"): Promise<string | null> {
    const dd = this.欄(名, 見出し);
    return (await dd.count()) === 0 ? null : (await dd.innerText()).replace(/\s+/g, " ").trim();
  }
  /** カードの「デッキ登録」「デッキ編集」のボタン（無ければ 0 個） */
  デッキのボタン(名: string): Locator { return this.行(名).locator(".p-hareruya-deckentry-list__card-btn"); }
  ヘルプ(名: string): Locator { return this.行(名).locator(".p-hareruya-deckentry-list__help-button"); }
  ヘルプのつぶやき(名: string): Locator { return this.行(名).locator(".p-hareruya-deckentry-list__help-popover"); }
  get 件数(): Locator { return this.page.locator(".p-hareruya-toolbar__count span").first(); }
  get 一覧の見出し行(): Locator { return this.page.locator(".p-hareruya-deckentry-list__header"); }
  get 案内(): Locator { return this.page.locator(".p-hareruya-message-box--info"); }
  フォーマットの表示(名: string): Locator { return this.行(名).locator(".p-hareruya-deckentry-list__format-badge"); }
  /** ヘッダーの日英切替（押すと、同じ画面の英語・日本語に替わる） */
  get 日英切替(): Locator { return this.page.locator("li.p-hareruya-header__nav-item--lang a.p-hareruya-header__nav-link").first(); }

  /** ヘルプを押す。別のタブで開けばそのタブのアドレスの道筋、同じタブで移れば移った先の道筋を返す */
  async ヘルプを押して道筋を得る(名: string): Promise<string> {
    const l = this.ヘルプ(名);
    await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const popup = this.page.context().waitForEvent("page", { timeout: 15_000 }).catch(() => null);
    await l.click({ timeout: 10_000 }).catch(async () => { await l.dispatchEvent("click"); });
    const p = await popup;
    if (p) { await p.waitForLoadState("load"); return new URL(p.url()).pathname; }
    await this.page.waitForLoadState("load");
    return this.path;
  }

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
