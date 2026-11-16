/**
 * 公開側（フロント本店）の入荷時通知まわりの画面操作（F03-07）。
 * 会員のログイン・商品詳細・商品一覧・マイページの入荷待ち商品・入荷通知のモーダル（ログイン／完了）・画面右下の通知。
 * セレクタはここだけに書く。
 */
import { Locator, Page, expect } from "@playwright/test";
import { BASE_URL } from "../../config/env";

/** 本店の公開側のアドレスの先頭 */
export const FRONT = `${BASE_URL}/ja`;

/**
 * 商品一覧（/products/search）の、検索サービス（ユニサーチ）の結果の描画が済むのを待つ。
 * 一覧の商品カードは画面を開いたあとに JavaScript で検索サービスへ問い合わせて描くので、開いた直後に数えると 0 件になる
 * （2026-11-13 開発環境の IT-F03-07-012: 「商品数: 1点」なのにカードを読み込み中のうちに数え、シードが30分待ち続けて時間切れ）。
 * 読み込み中の印・仮の表示のカードが無くなり、結果の領域に中身（カード・0件の案内など）が入るまで待つ（pages/front/f03_01_product_list.ts の 結果を待つ と同じ）。
 */
export async function 一覧の描画を待つ(page: Page, timeout = 90_000): Promise<void> {
  await page.waitForLoadState("load");
  await expect.poll(() => page.evaluate(() => {
    const s = document.querySelector("#product-list-unisearch-shelf");
    if (!s) return true;
    if (s.querySelector(".product-list-unisearch-loading")) return false;
    if (s.querySelector(".p-hareruya-product-card--unisearch-temp")) return false;
    return s.children.length > 0;
  }), { message: "商品一覧の検索サービスの結果（商品カード）が描き終わる", timeout }).toBe(true);
  await page.waitForTimeout(500);
}

export type 押した結果 = {
  /** 画面右下の通知（入荷通知の完了・取消の知らせ）が出たか */
  通知が出た: boolean;
  通知の文: string;
  /** ログインモーダルが開いたか */
  ログインモーダルが開いた: boolean;
  /** 通知・ログインモーダルのほかに、確認のモーダルが開いたか（入荷通知依頼確認・キャンセル確認のモーダルの有無） */
  確認のモーダルが開いた: boolean;
};

export class FrontRestock {
  constructor(readonly page: Page) {}

  // ---- ログイン ----

  /** 会員ログイン画面で、メールアドレスとパスワードでログインする。ログインできなければ落とす */
  async login(mail: string, password: string): Promise<void> {
    await this.page.goto(`${FRONT}/mypage/login`);
    await this.page.waitForLoadState("load");
    const form = this.page.locator("form#login_mypage");
    await form.locator('input[name="login_email"]').fill(mail);
    await form.locator('input[name="login_pass"]').fill(password);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), form.locator('button[type="submit"]').click({ noWaitAfter: true })]);
    await this.page.waitForLoadState("load");
    expect(new URL(this.page.url()).pathname, `会員ログイン（${mail}）後の画面がログイン画面のまま`).not.toMatch(/\/mypage\/login/);
  }

  async logout(): Promise<void> {
    await this.page.goto(`${FRONT}/logout`);
    await this.page.waitForLoadState("load");
  }

  // ---- 商品詳細 ----

  async openDetail(productId: string): Promise<void> {
    const res = await this.page.goto(`${FRONT}/products/detail/${productId}`);
    expect(res?.status() ?? 0, `商品ID ${productId} の商品詳細画面の応答`).toBeLessThan(400);
    await this.page.waitForLoadState("load");
  }

  /** 商品詳細・商品一覧・入荷待ち商品に出る、規格単位の通知ボタン（規格IDで引く） */
  classButton(classId: string): Locator {
    return this.page.locator(`button[data-productclass="${classId}"]`);
  }

  /** 商品詳細の「まとめて入荷通知」（商品・言語単位） */
  get bulkButton(): Locator {
    return this.page.locator("#bulk_restock_notice");
  }

  /** ボタンの表示が「依頼済み（通知待ち）」か。選択済みの印で見る */
  async 依頼済み表示か(button: Locator): Promise<boolean> {
    const cls = (await button.getAttribute("class")) ?? "";
    return /\bis-selected\b/.test(cls);
  }

  /** ボタンの見える文言（表示中の方） */
  async 見えている文言(button: Locator): Promise<string> {
    return ((await button.evaluate((el) => {
      const spans = Array.from(el.querySelectorAll("span"));
      const visible = spans.filter((s) => {
        const st = window.getComputedStyle(s);
        return st.display !== "none" && st.visibility !== "hidden";
      });
      return visible.map((s) => s.textContent ?? "").join(" ");
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
    return this.page.locator("#notify-login-modal");
  }

  /** いま開いている確認用のモーダル（ログインモーダルを除く）の数 */
  private async 確認のモーダルの数(): Promise<number> {
    return this.page.locator(".p-hareruya-modal.is-active:not(#notify-login-modal), .modal.show, [role='dialog'][aria-hidden='false']:not(#notify-login-modal)").count();
  }

  /**
   * 通知ボタンを押し、結果（完了の通知・ログインモーダル・確認のモーダル）が出るのを待って読む。
   * 画面のスクリプトの読み込みを待ってから押す。
   */
  async press(button: Locator, waitMs = 8000): Promise<押した結果> {
    await this.page.waitForLoadState("load");
    await expect(button, "押す通知ボタン").toBeVisible();
    let confirmSeen = false;
    await button.scrollIntoViewIfNeeded();
    await button.click();
    const deadline = Date.now() + waitMs;
    for (;;) {
      if ((await this.確認のモーダルの数()) > 0) confirmSeen = true;
      const popup = await this.通知.evaluate((el) => el.classList.contains("is-visible")).catch(() => false);
      const login = await this.ログインモーダル.evaluate((el) => el.classList.contains("is-active")).catch(() => false);
      if (popup || login) {
        if ((await this.確認のモーダルの数()) > 0) confirmSeen = true;
        return {
          通知が出た: popup, 通知の文: popup ? await this.通知の文() : "", ログインモーダルが開いた: login, 確認のモーダルが開いた: confirmSeen,
        };
      }
      if (Date.now() > deadline) {
        return { 通知が出た: false, 通知の文: "", ログインモーダルが開いた: false, 確認のモーダルが開いた: confirmSeen };
      }
      await this.page.waitForTimeout(150);
    }
  }

  /**
   * 画面右下の通知が自動で消える時計（出てから5秒で消す。アプリの default_frame.twig の通知の表示）を止める。通知の中身・表示は変えない。
   * 期待結果の画像に、出た通知を写すため（2026-11-13 の IT-F03-07-007 は、撮る前に通知が消えていた）。通知が出たあとに呼ぶ。
   */
  async 通知が自動で消えるのを止める(): Promise<void> {
    await this.page.evaluate(() => {
      const w = window as unknown as { _hareruyaAppCartPopupTimer?: number };
      if (w._hareruyaAppCartPopupTimer) window.clearTimeout(w._hareruyaAppCartPopupTimer);
    });
  }

  async 通知の文(): Promise<string> {
    return (((await this.通知.locator(".p-hareruya-cart-popup__message").textContent()) ?? "")).replace(/\s+/g, " ").trim();
  }

  async 通知が出ているか(): Promise<boolean> {
    return this.通知.evaluate((el) => el.classList.contains("is-visible")).catch(() => false);
  }

  async ログインモーダルが開いているか(): Promise<boolean> {
    return this.ログインモーダル.evaluate((el) => el.classList.contains("is-active")).catch(() => false);
  }

  /** ログインモーダルに入れて「ログイン」を押す。移った先の画面まで待つ */
  async ログインモーダルでログイン(mail: string, password: string): Promise<void> {
    const form = this.page.locator("#notify-login-form");
    await expect(form, "ログインモーダルのログインの入力欄").toBeVisible();
    await form.locator('input[name="login_email"]').fill(mail);
    await form.locator('input[name="login_pass"]').fill(password);
    await form.locator('button[type="submit"]').click();
  }

  // ---- 商品一覧 ----

  /** 商品名で絞った商品一覧を開き、検索サービスの結果の商品カードが描き終わるまで待つ */
  async openList(productName: string): Promise<void> {
    const res = await this.page.goto(`${FRONT}/products/search?product=${encodeURIComponent(productName)}`);
    expect(res?.status() ?? 0, `商品一覧画面の応答（商品名「${productName}」で絞り込み）`).toBeLessThan(400);
    await 一覧の描画を待つ(this.page);
  }

  listCard(productName: string): Locator {
    return this.page.locator(".p-hareruya-product-card").filter({ hasText: productName });
  }

  /** 商品一覧のカードの、商品言語単位／先頭規格の通知ボタン */
  listNotify(productName: string): Locator {
    return this.listCard(productName).locator(".js-product-list-notify");
  }

  /**
   * 商品一覧のカードの、商品言語単位の通知ボタン（商品詳細の「まとめて入荷通知」#bulk_restock_notice と同じ単位。商品規格を持たない通知ボタン）。
   * 一覧の .js-product-list-notify は data-productclass（商品規格ID）を持つ商品規格単位のボタン（Block/product.twig）なので数えない
   */
  listBulkNotify(productName: string): Locator {
    return this.listCard(productName).locator("#bulk_restock_notice, .js-notifylist-bulk-restock, .js-product-list-notify:not([data-productclass])");
  }

  // ---- マイページ ----

  async openNotifyList(): Promise<void> {
    const res = await this.page.goto(`${FRONT}/mypage/notifylist`);
    expect(res?.status() ?? 0, "マイページ＞入荷待ち商品の応答").toBeLessThan(400);
    await this.page.waitForLoadState("load");
  }

  /** 入荷待ち商品一覧に出ている商品名（カード1枚ずつ） */
  async 入荷待ち商品名一覧(): Promise<string[]> {
    return (await this.page.locator(".p-hareruya-product-card--notifylist .p-hareruya-product-card__name-text").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }

  async openMypage(): Promise<void> {
    await this.page.goto(`${FRONT}/mypage`);
    await this.page.waitForLoadState("load");
  }
}
