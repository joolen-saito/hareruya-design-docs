/** F06-03 ログイン（会員ログイン画面・ヘッダーのログイン・ログアウト）の操作。セレクタはここだけに書く。正本: cases/F06-03_test_cases.tsv */
import { expect, Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export type 店 = "本店" | "TC大阪支店";
const base = (店: 店) => `${BASE_URL}/ja${店 === "TC大阪支店" ? "/osaka" : ""}`;
const T = 30_000;

export class LoginPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(30_000); }
  path(): string { return new URL(this.page.url()).pathname; }

  async ログイン画面を開く(店: 店 = "本店"): Promise<void> {
    await this.page.goto(`${base(店)}/mypage/login`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  async URLを開く(path: string): Promise<void> {
    await this.page.goto(`${BASE_URL}${path}`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  async ログイン画面である(): Promise<boolean> { return (await this.page.locator("form#login_mypage").count()) > 0; }
  get メール欄(): Locator { return this.page.locator("#login_email"); }
  get パスワード欄(): Locator { return this.page.locator("#login_pass"); }
  get ログインボタン(): Locator { return this.page.locator("form#login_mypage button[type=submit]"); }

  async 入力する(メール: string, パスワード: string): Promise<void> {
    await this.メール欄.fill(メール, { timeout: T });
    await this.パスワード欄.fill(パスワード, { timeout: T });
  }
  async ログインを押す(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), this.ログインボタン.click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }
  async ログインする(メール: string, パスワード: string): Promise<void> {
    await this.入力する(メール, パスワード);
    await this.ログインを押す();
  }
  /** 認証エラーの文（無ければ空） */
  async 認証エラー(): Promise<string> {
    const l = this.page.locator("#login_mypage [role=alert], .p-hareruya-login__form-error, .c-hareruya-form-input__field-error--server");
    await l.first().waitFor({ state: "attached", timeout: 10_000 }).catch(() => undefined);
    const texts = (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    return [...new Set(texts)].join(" / ");
  }


  // ---- ヘッダーのログイン（PC）・下のナビゲーション（スマホ） ----
  async 表示を整える(版: "PC" | "スマホ"): Promise<void> {
    await this.page.setViewportSize(版 === "PC" ? { width: 1366, height: 900 } : { width: 390, height: 844 });
  }
  async 店のトップを開く(店: 店): Promise<void> {
    await this.page.goto(`${base(店)}/`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  async ナビのログインを押す(版: "PC" | "スマホ"): Promise<void> {
    const l = 版 === "PC"
      ? this.page.locator("a.p-hareruya-header__nav-right-link", { hasText: "ログイン" }).first()
      : this.page.locator("a.p-hareruya-bottom-nav__link", { hasText: /ログイン/ }).first();
    await expect(l, `${版}版ナビゲーションの「ログイン」`).toBeVisible({ timeout: T });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), l.click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }

  // ---- ログイン画面の部品 ----
  get パンくず現在地(): Locator { return this.page.locator(".p-hareruya-breadcrumb__current").first(); }
  async 現在地がリンクか(): Promise<boolean> {
    const cur = this.パンくず現在地;
    return (await cur.locator("a").count()) > 0 || (await cur.evaluate((e) => !!e.closest("a")));
  }
  get パンくずホーム(): Locator { return this.page.locator("a.p-hareruya-breadcrumb__link").first(); }
  async 押して遷移する(l: Locator): Promise<void> {
    // 画面上部に固定されたヘッダーがパンくずなどを覆わない位置（画面の中ほど）へ動かしてから押す
    await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 });
    try {
      await l.click({ timeout: 10_000 });
    } catch (e) {
      // 固定ヘッダーが要素の上に重なって普通に押せないとき（画面の作りの問題）。押下の操作そのものは DOM へ送って続け、注記と条件付きの印を残す
      test.info().annotations.push({ type: "正本の外の補い", description: `この要素は固定ヘッダーが上に重なり、普通のクリックでは押せなかった。クリックの操作を要素へ直接送って続けた（${String(e).split("\n")[0].slice(0, 80)}）` });
      await l.dispatchEvent("click");
    }
    await nav;
    await this.page.waitForLoadState("load");
  }

  get パスワード再発行リンク(): Locator { return this.page.getByRole("link", { name: "パスワードをお忘れの方はこちら" }); }
  get 会員情報登録ボタン(): Locator { return this.page.locator("a.c-hareruya-btn", { hasText: "会員情報登録" }).first(); }
  /** ログイン状態の保持の選択欄（見えている入力欄のチェック・ラベル） */
  async 保持の選択欄が見えているか(): Promise<boolean> {
    const box = this.page.locator('form#login_mypage input[name="login_memory"]:not([type=hidden])');
    if ((await box.count()) > 0 && (await box.first().isVisible())) return true;
    return (await this.page.locator("form#login_mypage").getByText(/ログイン状態を保持|ログイン状態の保持/).count()) > 0;
  }
  /** 隠し項目として送られる保持の値（無ければ null） */
  async 保持の隠し項目(): Promise<string | null> {
    const l = this.page.locator('form#login_mypage input[name="login_memory"][type=hidden]');
    return (await l.count()) > 0 ? l.first().inputValue() : null;
  }

  /** ヘッダーにログアウトが無いとき、マイページ（会員メニューにログアウトがある）を開いてから押す。マイページを開いたら true */
  async マイページのログアウトを押す(): Promise<boolean> {
    await this.page.goto(`${BASE_URL}/ja/mypage`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return this.ログアウトを押す();
  }

  // ---- ログアウト ----
  /** ログアウトのリンクを押す。見えているものを押し、見えるものが無ければ（メニューの中など）メニューを開かずに押せないので false */
  async ログアウトを押す(): Promise<boolean> {
    const l = this.page.locator('a[href$="/logout"]:visible').first();
    if ((await l.count()) === 0) return false;
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), l.click({ timeout: T })]);
    await this.page.waitForLoadState("load");
    return true;
  }

  // ---- パスワード設定（ポリシー違反用）画面 ----
  get パスワード設定フォーム(): Locator { return this.page.locator("form#password-change-form"); }
  async パスワード設定画面である(): Promise<boolean> {
    return /\/mypage\/password_change\/?$/.test(this.path()) && (await this.パスワード設定フォーム.count()) > 0;
  }
  /** パスワードとパスワード(確認)に同じ値を入れて「変更する」を押す */
  async パスワードを設定する(新: string): Promise<void> {
    const inputs = this.パスワード設定フォーム.locator("input[type=password]");
    await inputs.nth(0).fill(新, { timeout: T });
    await inputs.nth(1).fill(新, { timeout: T });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), this.パスワード設定フォーム.locator("button[type=submit]").click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }

  // ---- 保持のCookie ----
  async 保持のCookie(): Promise<{ name: string; expires: number } | undefined> {
    return (await this.page.context().cookies()).find((c) => /REMEMBERME/i.test(c.name));
  }
  /** メール欄の値（欄が無ければ null） */
  async メール欄の値(): Promise<string | null> {
    return (await this.メール欄.count()) > 0 ? this.メール欄.inputValue({ timeout: T }) : null;
  }
}
