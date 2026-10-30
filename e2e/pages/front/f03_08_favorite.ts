/**
 * 公開側（フロント）のお気に入り商品まわりの画面操作（F03-08）。
 * 会員のログイン・商品詳細のお気に入りボタン・ログインモーダル・登録/解除の結果の表示（画面右下の通知／モーダル）・
 * マイページ＞お気に入り登録商品一覧。セレクタはここだけに書く。
 * 公開側の部品は機能ごとにファイルを分けている（F03-07 など別の担当と二重に作らない）。
 */
import { Locator, Page, expect } from "@playwright/test";
import { BASE_URL } from "../../config/env";

/** 本店の公開側のアドレスの先頭 */
export const FRONT = `${BASE_URL}/ja`;
/** 支店（TC大阪支店）の公開側のアドレスの先頭 */
export const FRONT_BRANCH = `${BASE_URL}/ja/osaka`;

export type 押した結果 = {
  /** 画面右下の通知（登録・解除の完了／失敗の知らせ）が出たか */
  通知が出た: boolean;
  通知の文: string;
  /** 通知に「お気に入り登録商品一覧」へのリンクが出ているか */
  通知にリンクがある: boolean;
  /** ログインモーダルが開いたか */
  ログインモーダルが開いた: boolean;
  /** ログインモーダルのほかに開いたモーダルの文（確認のモーダル・完了のモーダルの有無を見る） */
  開いたモーダルの文: string[];
  /** 確認のモーダル（「完了」を含まない文のモーダル）が開いたか */
  確認のモーダルが開いた: boolean;
  /** 完了のモーダル（「完了」を含む文のモーダル）が開いたか */
  完了のモーダルが開いた: boolean;
  /** 画面が出した警告ダイアログ（alert）の文 */
  警告の文: string[];
};

const dialogLog = new WeakMap<Page, string[]>();
/** 警告ダイアログ（alert）の文を控え、閉じる。ページごとに一度だけ登録する */
function watchDialogs(page: Page): string[] {
  let log = dialogLog.get(page);
  if (!log) {
    log = [];
    dialogLog.set(page, log);
    page.on("dialog", (d) => { log!.push(d.message()); d.accept().catch(() => {}); });
  }
  return log;
}

export class FrontFavorite {
  readonly dialogs: string[];
  constructor(readonly page: Page, readonly base: string = FRONT) {
    this.dialogs = watchDialogs(page);
    // 画面が応じないとき、いつまでも待たずに落とす（操作30秒・画面の移動60秒）
    page.setDefaultTimeout(30_000);
    page.setDefaultNavigationTimeout(60_000);
  }

  // ---- ログイン ----

  /**
   * 会員ログイン画面で、メールアドレスとパスワードでログインする。ログインできなければ落とす。
   * ログイン画面を開いたときにすでにログイン済み（本店と支店でログインの状態が共通）なら、ログイン画面は出ないので入力せず false を返す。
   * 入力してログインしたら true。
   */
  async login(mail: string, password: string): Promise<boolean> {
    await this.page.goto(`${this.base}/mypage/login`);
    await this.page.waitForLoadState("load");
    if (!/\/mypage\/login/.test(new URL(this.page.url()).pathname)) return false;
    const form = this.page.locator("form#login_mypage");
    await form.locator('input[name="login_email"]').fill(mail);
    await form.locator('input[name="login_pass"]').fill(password);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), form.locator('button[type="submit"]').click()]);
    await this.page.waitForLoadState("load");
    expect(new URL(this.page.url()).pathname, `会員ログイン（${mail}）後の画面がログイン画面のまま`).not.toMatch(/\/mypage\/login/);
    return true;
  }

  async logout(): Promise<void> {
    await this.page.goto(`${this.base}/logout`);
    await this.page.waitForLoadState("load");
  }

  // ---- 商品詳細 ----

  /** 商品詳細を開く。lang は言語コード（JP・EN）。読み込みを待つ */
  async openDetail(productId: string, lang: "JP" | "EN" = "JP"): Promise<void> {
    const res = await this.page.goto(`${this.base}/products/detail/${productId}?lang=${lang}`);
    expect(res?.status() ?? 0, `商品ID ${productId} の商品詳細画面の応答`).toBeLessThan(400);
    await this.page.waitForLoadState("load");
  }

  /** 商品詳細のお気に入りボタン */
  get お気に入りボタン(): Locator {
    return this.page.locator("#add_favorite");
  }

  /** お気に入りボタンが「登録済み」の表示か（選択済みの印で見る） */
  async 登録済みの表示か(button: Locator = this.お気に入りボタン): Promise<boolean> {
    return /\bis-selected\b/.test((await button.getAttribute("class")) ?? "");
  }

  /** お気に入りボタンの見えている文言 */
  async ボタンの文言(button: Locator = this.お気に入りボタン): Promise<string> {
    return ((await button.evaluate((el) => {
      const spans = Array.from(el.querySelectorAll("span")).filter((s) => {
        const st = window.getComputedStyle(s);
        return st.display !== "none" && st.visibility !== "hidden";
      });
      return spans.map((s) => s.textContent ?? "").join(" ");
    })) ?? "").replace(/\s+/g, " ").trim();
  }

  // ---- 通知・モーダル ----

  get 通知(): Locator {
    return this.page.locator("#hareruya-app-cart-popup");
  }
  get 通知の閉じるボタン(): Locator {
    return this.通知.locator(".p-hareruya-cart-popup__close");
  }
  get ログインモーダル(): Locator {
    // 同じ ID のモーダルが画面に2つある（ヘッダーと商品詳細の両方に組み込まれている）。画面のスクリプトが操作する先頭のものを見る
    return this.page.locator("#favorite-login-modal").first();
  }
  get ログインモーダルの閉じるボタン(): Locator {
    return this.ログインモーダル.locator("[data-js-modal-close]").first();
  }

  async 通知が出ているか(): Promise<boolean> {
    return this.通知.evaluate((el) => el.classList.contains("is-visible")).catch(() => false);
  }
  async 通知の文(): Promise<string> {
    return ((await this.通知.locator(".p-hareruya-cart-popup__message").textContent().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
  }
  async ログインモーダルが開いているか(): Promise<boolean> {
    return this.ログインモーダル.evaluate((el) => el.classList.contains("is-active")).catch(() => false);
  }

  /** いま開いているモーダル（ログインモーダルを除く）の文。モーダルの作りは「.p-hareruya-modal.is-active」または「.modal.show」 */
  async 開いているモーダルの文(): Promise<string[]> {
    return this.page.evaluate(() => Array.from(document.querySelectorAll(".p-hareruya-modal.is-active, .modal.show"))
      .filter((e) => e.id !== "favorite-login-modal" && e.id !== "notify-login-modal")
      .map((e) => ((e as HTMLElement).innerText ?? "").replace(/\s+/g, " ").trim()));
  }

  /** いま開いているモーダルの閉じる系ボタン（「閉じる」の印か、OK の文言のボタン） */
  get 開いているモーダルの閉じるボタン(): Locator {
    return this.page.locator(".p-hareruya-modal.is-active:not(#favorite-login-modal):not(#notify-login-modal) [data-js-modal-close], .modal.show [data-bs-dismiss='modal']").first();
  }

  /**
   * 押したあとの結果（通知・ログインモーダル・確認や完了のモーダル・警告）が出るのを待って読む。
   * 何も出なければ待ち時間で打ち切って「何も出ない」を返す。
   */
  private async 結果を読む(waitMs: number): Promise<押した結果> {
    const modalsSeen = new Set<string>();
    const dialogsBefore = this.dialogs.length;
    const deadline = Date.now() + waitMs;
    let popup = false;
    let login = false;
    for (;;) {
      for (const t of await this.開いているモーダルの文()) modalsSeen.add(t);
      popup = await this.通知が出ているか();
      login = await this.ログインモーダルが開いているか();
      if (popup || login || modalsSeen.size > 0 || this.dialogs.length > dialogsBefore) break;
      if (Date.now() > deadline) break;
      await this.page.waitForTimeout(150);
    }
    // 確認のモーダルが出てから完了の表示が出る場合に備え、少し待って読み直す
    await this.page.waitForTimeout(400);
    for (const t of await this.開いているモーダルの文()) modalsSeen.add(t);
    popup = popup || (await this.通知が出ているか());
    login = login || (await this.ログインモーダルが開いているか());
    const modals = [...modalsSeen];
    return {
      通知が出た: popup,
      通知の文: popup ? await this.通知の文() : "",
      通知にリンクがある: popup ? (await this.通知.locator(".p-hareruya-cart-popup__link:not([hidden])").count()) > 0 : false,
      ログインモーダルが開いた: login,
      開いたモーダルの文: modals,
      確認のモーダルが開いた: modals.some((t) => !/完了/.test(t)),
      完了のモーダルが開いた: modals.some((t) => /完了/.test(t)),
      警告の文: this.dialogs.slice(dialogsBefore),
    };
  }

  /**
   * お気に入りボタンを押し、結果が出るのを待って読む。画面のスクリプトの読み込みを待ってから押す。
   * 押した要求の応答は控えて返さない（画面に出たものだけを見る）。
   */
  async 押す(button: Locator = this.お気に入りボタン, waitMs = 8000): Promise<押した結果> {
    await this.page.waitForLoadState("load");
    await expect(button, "押すお気に入りボタン").toBeVisible();
    await button.scrollIntoViewIfNeeded();
    await button.click();
    return this.結果を読む(waitMs);
  }

  /** 通知の閉じるボタンで通知を閉じる（通知が出ていなければ何もしない） */
  async 通知を閉じる(): Promise<void> {
    if (await this.通知が出ているか()) {
      await this.通知の閉じるボタン.click();
      await expect(this.通知, "通知が閉じる").not.toHaveClass(/is-visible/);
    }
  }

  // ---- マイページ＞お気に入り登録商品一覧 ----

  async openFavoriteList(): Promise<void> {
    const res = await this.page.goto(`${this.base}/mypage/favorite`);
    expect(res?.status() ?? 0, "マイページ＞お気に入り登録商品一覧の応答").toBeLessThan(400);
    await this.page.waitForLoadState("load");
  }

  get 一覧のカード(): Locator {
    return this.page.locator(".p-hareruya-favorite-list__grid .p-hareruya-product-card");
  }

  /** 一覧に出ている商品名（カード1枚ずつ） */
  async 一覧の商品名(): Promise<string[]> {
    await this.page.waitForLoadState("load");
    return (await this.一覧のカード.locator(".p-hareruya-product-card__name-text").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }

  /** 一覧のカードのうち、商品名に name を含むもの */
  一覧のカードの商品(name: string): Locator {
    return this.一覧のカード.filter({ has: this.page.locator(".p-hareruya-product-card__name-text", { hasText: name }) });
  }

  /** 一覧のカードの言語（商品詳細へのリンクの lang から読む。JP・EN） */
  async 一覧の言語(card: Locator): Promise<string> {
    const href = (await card.locator('a[href*="lang="]').first().getAttribute("href").catch(() => "")) ?? "";
    return /[?&]lang=([A-Z]+)/.exec(href)?.[1] ?? "";
  }

  /** 一覧のカードの「お気に入りから削除」ボタン */
  解除ボタン(card: Locator): Locator {
    return card.locator('[data-js-target="favorite-remove-btn"]');
  }

  /** 一覧の解除の通知（一覧だけの通知） */
  get 一覧の通知(): Locator {
    return this.page.locator("#hareruya-favorite-cart-popup");
  }
}
