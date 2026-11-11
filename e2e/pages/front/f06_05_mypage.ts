/**
 * F06-05 マイページの操作と読み取り（名前・会員番号・バーコードとタイマー・保有ポイント・メニュー・パンくず・TOPページへ戻る）、
 * 共通ヘッダーの保有ポイント。セレクタはここだけに書く。正本: cases/F06-05_test_cases.tsv
 */
import { expect, Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const T = 30_000;

/** マイページのメニューの名前と、押した先の画面のアドレス（言語の接頭を除いたパス） */
export const メニューの行き先: Record<string, RegExp> = {
  購入履歴: /^\/mypage\/shopping_history\/?$/,
  入荷待ち商品一覧: /^\/mypage\/notifylist\/?$/,
  お気に入り登録商品一覧: /^\/mypage\/favorite\/?$/,
  購入手続きへ: /^\/cart\/?$/,
  ポイント履歴: /^\/mypage\/point_history\/?$/,
  買取一覧: /^\/mypage\/purchase_history\/?$/,
  オンライン本人確認: /^\/mypage\/identification\/?$/,
  "マイイベント・デッキ登録": /^\/mypage\/event_history\/?$/,
  マイデッキ: /^\/decks(\/user\/[^/]+)?\/?$/,
  会員情報変更: /^\/mypage\/change\/?$/,
  "配送先の新規登録・変更": /^\/mypage\/delivery\/?$/,
  退会: /^\/mypage\/withdraw\/?$/,
  お問い合わせ: /^\/contact\/?$/,
  お問い合わせ履歴: /^\/contact\/history\/?$/,
  ログアウト: /^\/logout\/?$/,
};
/** 言語の接頭（/ja・/en）を外したパス */
export const 言語を除いたパス = (p: string): string => p.replace(/^\/(ja|en)(?=\/|$)/, "") || "/";

export class MypagePage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  get path(): string { return new URL(this.page.url()).pathname; }

  async 開く(): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/mypage/`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  get 本体(): Locator { return this.page.locator(".p-hareruya-mypage"); }
  async マイページか(): Promise<boolean> { return /^\/ja\/mypage\/?$/.test(this.path) && (await this.本体.count()) > 0; }

  get 名前(): Locator { return this.page.locator(".p-hareruya-mypage__barcode-name"); }
  get 会員番号(): Locator { return this.page.locator(".p-hareruya-mypage__barcode-id"); }
  get バーコード(): Locator { return this.page.locator("#js-ec_point_barcode"); }
  get タイマー(): Locator { return this.page.locator("#js-ec_point_timer"); }
  get 再表示する(): Locator { return this.バーコード.locator("a.ec-transPoint-barcode__inner__reset"); }
  get 保有ポイント(): Locator { return this.page.locator(".p-hareruya-mypage__barcode-point-number.ec-transPoint-barcode__currentPoint, .ec-transPoint-barcode__currentPoint").first(); }
  /** バーコードが描かれているか（バーコードの部品が子の要素を作る。再表示のリンクだけのときは描かれていない） */
  async バーコードが描かれているか(): Promise<boolean> {
    return this.バーコード.evaluate((e) => e.children.length > 0 && !e.querySelector("a.ec-transPoint-barcode__inner__reset"));
  }
  async タイマーの文(): Promise<string> { return ((await this.タイマー.innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim(); }

  /** 表示名（改行・空白を除いたもの）が名前と同じメニューのリンク */
  メニュー(名前: string): Locator {
    const 詰めた = 名前.replace(/\s+/g, "");
    const re = new RegExp(`^\\s*${[...詰めた].map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s*")}\\s*$`);
    return this.page.locator("a.p-hareruya-mypage__menu-link").filter({ has: this.page.locator(".p-hareruya-mypage__menu-text", { hasText: re }) });
  }
  /**
   * 名前のメニューを探す。表示名が名前どおりのものが無ければ、行き先のアドレスが名前の画面のもの（メニューの行き先）を使い、
   * 画面の表示名を返す（名前どおりでないことは呼ぶ側が注記する）。
   */
  async メニューを探す(名前: string): Promise<{ link: Locator; 表示名: string; 名前どおり: boolean }> {
    const exact = this.メニュー(名前);
    if ((await exact.count()) === 1) return { link: exact, 表示名: 名前, 名前どおり: true };
    const 行き先 = メニューの行き先[名前];
    if (!行き先) throw new Error(`メニュー「${名前}」の行き先を定めていない`);
    const links = this.page.locator("a.p-hareruya-mypage__menu-link");
    const hrefs = await links.evaluateAll((ns) => ns.map((n) => new URL((n as HTMLAnchorElement).href, location.href).pathname));
    const i = hrefs.findIndex((h) => 行き先.test(言語を除いたパス(h)));
    if (i < 0) throw new Error(`マイページに「${名前}」のメニューが無い（表示名でも行き先でも見つからない）`);
    const link = links.nth(i);
    const 表示名 = ((await link.locator(".p-hareruya-mypage__menu-text").innerText()) ?? "").replace(/\s+/g, "");
    return { link, 表示名, 名前どおり: false };
  }
  /** メニューの表示名の一覧（改行・空白を除く） */
  async メニューの名前(): Promise<string[]> {
    return (await this.page.locator("a.p-hareruya-mypage__menu-link .p-hareruya-mypage__menu-text").allInnerTexts()).map((t) => t.replace(/\s+/g, ""));
  }
  get TOPページへ戻る(): Locator { return this.page.locator(".p-hareruya-mypage__button a").first(); }

  // ---- パンくず ----
  get パンくず現在地(): Locator { return this.page.locator(".p-hareruya-breadcrumb__current").first(); }
  get パンくずホーム(): Locator { return this.page.locator("a.p-hareruya-breadcrumb__link").first(); }

  /** 要素を押し、画面が移るなら移った先まで待つ（移らなければ待ちの上限で戻る） */
  async 押す(l: Locator, 移る = true): Promise<void> {
    await expect(l, "押す要素").toHaveCount(1, { timeout: T });
    await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const before = this.page.url();
    const nav = 移る ? this.page.waitForURL((u) => u.toString() !== before, { timeout: 60_000 }) : Promise.resolve();
    try {
      await l.click({ timeout: 10_000 });
    } catch (e) {
      test.info().annotations.push({ type: "正本の外の補い", description: `この要素は固定ヘッダーが上に重なり、普通のクリックでは押せなかった。クリックの操作を要素へ直接送って続けた（${String(e).split("\n")[0].slice(0, 80)}）` });
      await l.dispatchEvent("click");
    }
    await nav;
    await this.page.waitForLoadState("load");
  }
  async 戻る(): Promise<void> {
    await this.page.goBack({ waitUntil: "load", timeout: 60_000 });
  }

  // ---- 共通ヘッダー ----
  get ヘッダー(): Locator { return this.page.locator("header").first(); }
  get ヘッダーの保有ポイント(): Locator { return this.page.locator(".p-hareruya-header__point-value").first(); }
  async トップを開く(): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  async URLを開く(path: string): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}${path}`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
}
