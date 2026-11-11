/**
 * F06-05 マイページ（フロント）の操作。セレクタ・アドレスはここだけに書く。正本: cases/F06-05_test_cases.tsv
 * メニューのリンクは、表示名が日英で変わるので、リンク先のアドレスで引く。
 */
import { Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export type 言語 = "ja" | "en";
const T = 30_000;

/** マイページのメニュー（リンク先のアドレスの末尾で引く） */
export const メニュー = {
  購入履歴: '[href$="/mypage/shopping_history"]',
  入荷待ち商品一覧: '[href$="/mypage/notifylist"]',
  お気に入り登録商品一覧: '[href$="/mypage/favorite"]',
  購入手続きへ: '[href$="/cart"]',
  ポイント履歴: '[href$="/mypage/point_history"]',
  買取一覧: '[href$="/mypage/purchase_history"]',
  オンライン本人確認: '[href$="/mypage/identification"]',
  マイイベントデッキ登録: '[href$="/mypage/event_history"]',
  マイデッキ: '[href*="/decks"]',
  会員情報変更: '[href$="/mypage/change"]',
  配送先の新規登録変更: '[href$="/mypage/delivery"]',
  退会: '[href$="/mypage/withdraw"]',
  お問い合わせ: '[href$="/contact"]',
  お問い合わせ履歴: '[href$="/contact_history"]',
  ログアウト: '[href$="/logout"]',
} as const;
export type メニュー名 = keyof typeof メニュー;

export class MypagePage {
  constructor(readonly page: Page, readonly 言語: 言語 = "ja") { page.setDefaultTimeout(T); }
  get path(): string { return new URL(this.page.url()).pathname; }
  private url(p: string): string { return `${BASE_URL}/${this.言語}${p}`; }

  // ---- 開く・ログイン ----
  async ログインする(メール: string, パスワード: string): Promise<void> {
    await this.page.goto(this.url("/mypage/login"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    const form = this.page.locator("form#login_mypage");
    await form.locator("#login_email").fill(メール, { timeout: T });
    await form.locator("#login_pass").fill(パスワード, { timeout: T });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), form.locator("button[type=submit]").click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }
  async 開く(): Promise<void> {
    await this.page.goto(this.url("/mypage/"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  /** アドレス（言語の前の部分から）を開き、応答の状態を返す */
  async URLを開く(path: string): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}${path}`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  async トップを開く(): Promise<void> {
    await this.page.goto(this.url("/"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  async 戻る(): Promise<void> {
    await this.page.goBack({ timeout: 60_000, waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("load");
  }

  // ---- 画面の判別・文 ----
  async マイページである(): Promise<boolean> { return (await this.page.locator(".p-hareruya-mypage__container").count()) > 0; }
  async ログイン画面である(): Promise<boolean> { return (await this.page.locator("form#login_mypage").count()) > 0; }
  private async 文(l: Locator): Promise<string> {
    return (await l.count()) === 0 ? "" : ((await l.first().innerText()) ?? "").replace(/\s+/g, " ").trim();
  }
  /** 画面上部（ヘッダー・パンくず・見出し）の文 */
  async 画面上部の文(): Promise<string> {
    const p = this.page;
    return [await this.文(p.locator("header")), await this.文(p.locator(".p-hareruya-breadcrumb")), await this.文(p.locator("h1"))].filter(Boolean).join(" / ");
  }
  /** 氏名の表示（バーコードの上） */
  async 名前の表示(): Promise<string> { return this.文(this.page.locator(".p-hareruya-mypage__barcode-name")); }
  /** 会員番号の表示（「会員番号 123456」の形） */
  async 会員番号の表示(): Promise<string> { return this.文(this.page.locator(".p-hareruya-mypage__barcode-id")); }

  // ---- メニュー ----
  メニューのリンク(名: メニュー名): Locator { return this.page.locator(`.p-hareruya-mypage__menu a.p-hareruya-mypage__menu-link${メニュー[名]}`); }
  async メニューが見えているか(名: メニュー名): Promise<boolean> {
    const l = this.メニューのリンク(名);
    return (await l.count()) > 0 && (await l.first().isVisible());
  }
  /** メニューに表示されている文言（空白を除く） */
  async メニューの文言(): Promise<string[]> {
    return (await this.page.locator(".p-hareruya-mypage__menu-text").allInnerTexts()).map((t) => t.replace(/\s+/g, ""));
  }
  async メニューを押す(名: メニュー名): Promise<void> { await this.押して遷移する(this.メニューのリンク(名).first()); }
  get TOPページへ戻るボタン(): Locator { return this.page.locator(".p-hareruya-mypage__button a").first(); }
  async TOPページへ戻るを押す(): Promise<void> { await this.押して遷移する(this.TOPページへ戻るボタン); }

  // ---- パンくず ----
  get パンくず現在地(): Locator { return this.page.locator(".p-hareruya-breadcrumb__current").first(); }
  async 現在地がリンクか(): Promise<boolean> {
    const cur = this.パンくず現在地;
    return (await cur.locator("a").count()) > 0 || (await cur.evaluate((e) => !!e.closest("a")));
  }
  get パンくずホーム(): Locator { return this.page.locator("a.p-hareruya-breadcrumb__link").first(); }
  async 現在地を押す(): Promise<void> {
    await this.パンくず現在地.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await this.パンくず現在地.click({ timeout: 10_000 }).catch(() => undefined);
    await this.page.waitForTimeout(800);
    await this.page.waitForLoadState("load");
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

  // ---- ポイント ----
  async 現在のポイント(): Promise<string> { return (await this.文(this.page.locator(".ec-transPoint-barcode__currentPoint"))).replace(/,/g, ""); }
  get 期限の近いポイントの枠(): Locator { return this.page.locator(".p-hareruya-mypage__barcode-point--expiring"); }
  async 期限の近いポイント(): Promise<{ ポイント: string; 期限の表示: string; 期限の日付: string } | null> {
    const box = this.期限の近いポイントの枠;
    if ((await box.count()) === 0) return null;
    return {
      ポイント: (await this.文(box.locator(".p-hareruya-mypage__barcode-point-number"))).replace(/,/g, ""),
      期限の表示: await this.文(box.locator("time")),
      期限の日付: (await box.locator("time").first().getAttribute("datetime")) ?? "",
    };
  }
  /** 共通ヘッダーの保有ポイントの表示（PC・スマホ用に複数ある） */
  async ヘッダーのポイント(): Promise<string[]> {
    return (await this.page.locator(".p-hareruya-header__point-value").allInnerTexts()).map((t) => t.replace(/[\s,]/g, ""));
  }
  async ページ全体の文(): Promise<string> { return this.文(this.page.locator("body")); }

  // ---- バーコード ----
  get バーコード枠(): Locator { return this.page.locator("#js-ec_point_barcode"); }
  async バーコードが出ているか(): Promise<boolean> {
    return (await this.バーコード枠.locator(":scope > :not(a)").count()) > 0 && (await this.再表示リンク.count()) === 0;
  }
  get タイマー(): Locator { return this.page.locator("#js-ec_point_timer"); }
  /** タイマーの表示を秒数にする（「04:58」など。読めなければ null） */
  async タイマーの秒数(): Promise<number | null> {
    const t = await this.文(this.タイマー);
    const m = /(\d+)\D+(\d+)/.exec(t);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  }
  async タイマーの表示(): Promise<string> { return this.文(this.タイマー); }
  get 再表示リンク(): Locator { return this.page.locator("a.ec-transPoint-barcode__inner__reset"); }
  /** タイマーが0になり、バーコードが期限切れの案内に置き換わるまで待つ（実際に5分間待つ） */
  async 期限切れまで待つ(): Promise<void> {
    await this.再表示リンク.first().waitFor({ state: "visible", timeout: 340_000 });
  }
  async 期限切れの案内(): Promise<string> { return this.文(this.page.locator(".p-hareruya-mypage__barcode-current-expired-msg")); }
  async 再表示リンクの文言(): Promise<string> { return this.文(this.再表示リンク); }
  async 再表示するを押す(): Promise<void> {
    await this.押して遷移する(this.再表示リンク.first());
  }
}
