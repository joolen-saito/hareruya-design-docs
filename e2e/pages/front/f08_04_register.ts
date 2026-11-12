/**
 * F08-04 店頭買取査定申込 会員登録フォームの画面操作のうち、F08-02・F08-05 の部品に無いもの。セレクタはここにだけ書く。
 * 申込の入力・会員登録の入力・確認画面の読み取りは pages/front/f08_02_input.ts の OtcInputPage と pages/front/f08_05_confirm.ts の OtcApplyPage を使う。
 *
 * 画面の作り（アプリのテンプレートで確かめた。期待値はここから取らない）:
 * - 会員登録フォーム（POST だけ）: メールアドレス・メールアドレス（確認）・パスワード・パスワード（確認）、利用規約の「詳細」ボタン（モーダルを開く）、
 *   利用規約同意のチェック欄（初期はチェックなし）、「次のページへ進む」「キャンセル」「会員登録をスキップする」。
 * - メールアドレスが既存の会員と重複、パスワードがメールアドレスと同じのときは、確認画面へ進まず会員登録フォームが再表示され、
 *   メールアドレス欄・パスワード欄の下に赤字の文が出る。
 * - 入力時間のタイマー（10分）が尽きると、フォームを空にして申込前ログイン画面（日本語）へ移る。
 * - 確認画面のメールアドレス・パスワードの枠は、値の文と隠し項目で出る。
 */
import { Locator, Page } from "@playwright/test";

const T = 30_000;
const NAV = 60_000;

export type 確認の対象 = "メールアドレス" | "パスワード";

export class RegisterFormPage {
  constructor(readonly page: Page) {}

  readonly フォーム = (): Locator => this.page.locator("form#otc_buy_register_customer_form");
  get パス(): string { return new URL(this.page.url()).pathname; }

  private readonly メール欄 = (): Locator => this.page.locator("#otc_buy_order_email_first");
  private readonly メール確認欄 = (): Locator => this.page.locator("#otc_buy_order_email_second");
  private readonly パスワード欄 = (): Locator => this.page.locator("#otc_buy_order_password_first");
  private readonly パスワード確認欄 = (): Locator => this.page.locator("#otc_buy_order_password_second");
  private readonly 同意欄 = (): Locator => this.page.locator("#otc_buy_order_entry_privacy_flg");

  /** 「個人情報の取り扱いについて」のボタン（見えているもの）の数 */
  async 個人情報の取り扱いのボタンの数(): Promise<number> {
    return this.page.getByRole("button", { name: /個人情報の取り扱いについて/ }).count();
  }

  /** 会員登録フォームの利用規約の「詳細」ボタンを押す */
  async 利用規約のボタンを押す(): Promise<void> {
    await this.フォーム().locator('.p-hareruya-entry__terms button[data-js-modal-trigger="otc-terms-modal"]').click({ timeout: T });
    await this.page.waitForTimeout(800);
  }
  readonly 利用規約のモーダル = (): Locator => this.page.locator("#otc-terms-modal");

  async 同意の状態(): Promise<boolean> { return this.同意欄().isChecked({ timeout: T }); }

  /** メールアドレス・メールアドレス（確認）・パスワード・パスワード（確認）を、与えた文字のまま（前後の空白も）入れる */
  async 会員登録の値を入れる(v: { メール: string; メール確認: string; パスワード: string; パスワード確認: string }): Promise<void> {
    await this.メール欄().fill(v.メール, { timeout: T });
    await this.メール確認欄().fill(v.メール確認, { timeout: T });
    await this.パスワード欄().fill(v.パスワード, { timeout: T });
    await this.パスワード確認欄().fill(v.パスワード確認, { timeout: T });
  }

  async 同意にチェックを入れる(): Promise<void> { await this.同意欄().check({ timeout: T }); }

  /** 「次のページへ進む」を押す（移らなくても止めない）。押したあとのパスを返す */
  async 次のページへ進むを押す(): Promise<string> {
    const nav = this.page.waitForEvent("framenavigated", { timeout: 15_000 }).catch(() => undefined);
    await this.フォーム().locator("button#submitButton").click({ timeout: T });
    await nav;
    await this.page.waitForLoadState("load");
    await this.page.waitForTimeout(500);
    return this.パス;
  }

  /** 再表示された会員登録フォームの入力欄の値 */
  async 入力欄の値(): Promise<{ メール: string; メール確認: string; パスワード: string; パスワード確認: string }> {
    return {
      メール: await this.メール欄().inputValue({ timeout: T }), メール確認: await this.メール確認欄().inputValue({ timeout: T }),
      パスワード: await this.パスワード欄().inputValue({ timeout: T }), パスワード確認: await this.パスワード確認欄().inputValue({ timeout: T }),
    };
  }

  /** 項目の入力欄の下に出ている赤字の文（無ければ空） */
  async 欄の下の文(項目: 確認の対象): Promise<string[]> {
    const 枠 = this.page.locator(`form#otc_buy_register_customer_form .p-hareruya-entry__${項目 === "メールアドレス" ? "email" : "password"}`).first();
    return (await 枠.locator(".c-hareruya-text--error").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }

  /** 入力時間が尽きる（または再読み込み）のあとの、申込前ログイン画面か */
  async 申込前ログイン画面か(): Promise<boolean> { return /\/otcbuy\/\w+\/entry$/.test(this.パス); }

  /** ブラウザで画面を再読み込みする */
  async 再読み込みする(): Promise<void> {
    await this.page.reload({ timeout: NAV });
    await this.page.waitForLoadState("load");
  }

  /** 日本語表示の申込前ログイン画面の、アカウントを持たない人の入口のリンクの文 */
  async ログイン画面のゲストのリンク(): Promise<string> {
    return (await this.page.locator("form#login_otc_buy a.c-hareruya-text--link").innerText({ timeout: T })).trim();
  }

  // ---- 確認画面 ----

  private 確認の枠(項目: "email" | "email-confirm" | "password"): Locator {
    return this.page.locator(`.p-hareruya-entry--confirm .p-hareruya-entry__${項目}`).first();
  }

  /** 確認画面のメールアドレス（email）／メールアドレス(確認用)（email-confirm）の表示文字を、前後の空白を含めて読む（開発者ツールで読む代わり） */
  async 確認の表示文字(項目: "email" | "email-confirm"): Promise<string | null> {
    const p = this.確認の枠(項目).locator(".p-hareruya-form-block__fields p.c-hareruya-text").first();
    if ((await p.count()) === 0) return null;
    return p.evaluate((el) => el.textContent ?? "");
  }

  /** 確認画面のメールアドレスの隠し項目（第1・第2）の値 */
  async 確認の隠し項目の値(): Promise<string[]> {
    return this.page.locator(".p-hareruya-entry--confirm .p-hareruya-entry__email input[type=hidden]").evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
  }

  /** 確認画面の、メールアドレス・パスワードの枠にある形式エラーの文（無ければ空） */
  async 確認のエラーの文(項目: 確認の対象): Promise<string[]> {
    const 枠 = this.確認の枠(項目 === "メールアドレス" ? "email" : "password");
    const 全て = await 枠.locator('.c-hareruya-text--error, .is-error, [class*="error"], [role="alert"], ul.error li').allInnerTexts();
    return 全て.map((t) => t.trim()).filter(Boolean);
  }

  /** 確認画面にある、見えている赤字・エラー表示の文（画面全体） */
  async 確認画面のエラーの文(): Promise<string[]> {
    const 全て = await this.page.locator('.p-hareruya-entry--confirm :is(.c-hareruya-text--error, .is-error, [class*="error"], [role="alert"])').allInnerTexts();
    return 全て.map((t) => t.trim()).filter(Boolean);
  }

  /** 確認画面の入力画面のエラー（上のどれかが見えるか） */
  async 確認画面か(): Promise<boolean> { return /\/otcbuy\/\w+\/confirm$/.test(this.パス); }

  // ---- 直接の POST（試験用のフォームを作って送る） ----

  /**
   * 店舗の会員登録フォームの URL へ、入力項目のない試験用のフォームで POST する（開発者ツールで POST する代わり）。
   * いまのページ（about:blank でもよい）の中にフォームを作って送る。最初の POST への応答の状態と、送ったあとのパスを返す。
   */
  async 直接POSTする(url: string): Promise<{ status: number; パス: string }> {
    const resP = this.page.waitForResponse((r) => r.request().method() === "POST" && r.url().startsWith(url), { timeout: NAV });
    await this.page.evaluate((u) => {
      const f = document.createElement("form");
      f.method = "post"; f.action = u;
      document.body.appendChild(f);
      f.submit();
    }, url);
    const res = await resP;
    await this.page.waitForLoadState("load");
    return { status: res.status(), パス: this.パス };
  }
}
