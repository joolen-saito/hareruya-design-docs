/**
 * F02-04 支店のスマホ版ナビゲーションの操作と読み取り（支店ECTOP /ja/<支店URL>/ のヘッダ・下部固定のナビ・フッタ・カテゴリモーダル）。
 * セレクタはここだけに書く。本店のスマホ版と共通の部分（カードセット選択・詳細検索・押す・行き先）は SpNavPage を引き継ぐ。
 * 画面の作り: Block/branch_header.twig・branch_footer.twig・bottom_nav.twig・category_modal.twig・cart.twig
 */
import { Locator, Page, expect } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { SpNavPage } from "./f02_02_sp_nav";

const T = 30_000;
export type 欄 = "サイトマップ" | "お得な情報";

export class BranchSpPage extends SpNavPage {
  constructor(page: Page) { super(page); }

  // ---- 画面を開く ----
  async 支店トップを開く(支店URL: string): Promise<void> { await this.開く(`/ja/${支店URL}/`); }
  async 支店の画面を開く(支店URL: string, 画面: "ログイン" | "マイページ" | "カート"): Promise<void> {
    await this.開く(`/ja/${支店URL}/${{ ログイン: "mypage/login", マイページ: "mypage", カート: "cart" }[画面]}`);
  }
  async 本店のログイン画面を開く(): Promise<void> { await this.開く("/ja/mypage/login"); }

  /** いまの画面のパス（末尾の / は除く） */
  パス(): string { return this.path().replace(/\/+$/, ""); }

  // ---- 画面上部（支店のヘッダ） ----
  readonly 上部の店名 = () => this.page.locator("header .p-hareruya-header__branch-name").first();
  readonly 上部のご当地晴れる屋くん = () => this.page.locator("header img.p-hareruya-header__branch-mascot").first();
  /** 画面上部のポイント欄（支店のヘッダでログイン中だけ出る） */
  readonly 上部のポイント欄 = () => this.page.locator("header .p-hareruya-header__point--branch");
  readonly 上部のポイントの数字 = () => this.page.locator("header .p-hareruya-header__point--branch .p-hareruya-header__point-value");
  readonly 上部のポイントの導線 = () => this.page.locator("header .p-hareruya-header__point--branch a.p-hareruya-header__point-link").first();
  /** 見えているポイントの表示（ヘッダのどのポイント表示でも） */
  readonly 見えているポイント表示 = () => this.page.locator("header .p-hareruya-header__point--branch:visible, header .p-hareruya-header__point-value:visible, header .p-hareruya-header__point-value-large:visible, header .p-hareruya-header__point-display:visible");
  /** 画面上部の帯のカート（商品数の札）。このアプリでは画面幅が狭いと非表示の作り */
  readonly 上部のカートの商品数 = () => this.page.locator("header .p-hareruya-header__nav-right-item--cart .p-hareruya-header__nav-right-badge").first();

  // ---- フッタ（支店） ----
  readonly 下部の店名 = () => this.page.locator("footer .p-hareruya-footer__branch-name").first();
  readonly 郵便番号 = () => this.page.locator("footer .p-hareruya-footer__address-postal").first();
  readonly 住所 = () => this.page.locator("footer .p-hareruya-footer__address-text").first();
  readonly 電話番号 = () => this.page.locator("footer .p-hareruya-footer__tel").first();
  readonly 営業時間 = () => this.page.locator("footer .p-hareruya-footer__hours").first();
  readonly 著作権表示 = () => this.page.locator("footer .p-hareruya-footer__copy").first();

  async 文(l: Locator): Promise<string> {
    await l.scrollIntoViewIfNeeded({ timeout: T }).catch(() => undefined);
    return (await l.innerText({ timeout: T })).replace(/\s+/g, " ").trim();
  }

  /** 画面上部のご当地晴れる屋くんの画像（表示されている画像）の中身のバイト列 */
  async ご当地晴れる屋くんのバイト列(): Promise<Buffer | null> {
    const img = this.上部のご当地晴れる屋くん();
    if ((await img.count()) === 0) return null;
    const src = await img.getAttribute("src", { timeout: T });
    if (!src) return null;
    const res = await this.page.request.get(new URL(src, this.page.url()).toString());
    return res.ok() ? await res.body() : null;
  }

  // ---- 画面下部の固定ナビ ----
  readonly 下部のナビのカート = () => this.下部のナビ().locator("a.p-hareruya-bottom-nav__link").filter({ has: this.page.locator(".p-hareruya-bottom-nav__text", { hasText: /^\s*カート\s*$/ }) }).first();
  readonly 下部のナビのカートの商品数 = () => this.下部のナビのカート().locator(".p-hareruya-bottom-nav__badge");
  /** 画面下部の固定ナビの項目（見えているもの） */
  下部のナビの項目(名前: string): Locator {
    return this.下部のナビ().locator(".p-hareruya-bottom-nav__item").filter({ has: this.page.locator(".p-hareruya-bottom-nav__text", { hasText: new RegExp(`^\\s*${名前}\\s*$`) }) }).locator("a, button").first();
  }
  readonly 下部のナビの全項目名 = async (): Promise<string[]> => (await this.下部のナビ().locator(".p-hareruya-bottom-nav__text").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  readonly 通販サイトの導線 = () => this.下部のナビの項目("通販サイト");
  readonly カテゴリの導線 = () => this.下部のナビの項目("カテゴリ");

  /** 押して、移った先まで待つ。移らなければ（一定時間のあいだ）いまのアドレスのまま返す */
  async 押して移る(l: Locator, 何: string, 待つ = 20_000): Promise<void> {
    const before = this.page.url();
    const nav = this.page.waitForURL((u) => u.toString() !== before, { timeout: 待つ }).catch(() => undefined);
    await this.押す(l, 何);
    await nav;
    await this.page.waitForLoadState("load").catch(() => undefined);
  }

  // ---- 商品検索 ----
  async カードセットを選ぶ(名前: string): Promise<void> {
    await this.押す(this.カードセット選択メニュー(), "カードセット選択メニュー");
    await this.押す(this.カードセットの選択肢の(名前), `カードセット「${名前}」`);
  }

  /** 画面上部の商品検索テキストボックス（Block/search_product.twig の商品名の欄） */
  readonly 商品検索テキストボックス = () => this.page.locator("#frmSearch input[data-search-keyword-input]:visible").first();
  /** 商品検索テキストボックスの横の検索ボタン */
  readonly 検索ボタン = () => this.page.locator("#frmSearch button[type=submit][name=search-submit]:visible").first();
  /** 検索ボタンを押して、移った先（商品一覧）の読み込みまで待つ */
  async 検索する(): Promise<void> { await this.押して移る(this.検索ボタン(), "検索ボタン"); }

  // ---- カテゴリモーダル ----
  readonly カテゴリモーダル = () => this.page.locator("[data-modal='category']");
  readonly カテゴリモーダルの閉じる = () => this.page.locator("[data-modal-close='category']").first();
  async カテゴリモーダルを開く(): Promise<void> { await this.押す(this.カテゴリの導線(), "画面下部の固定ナビのカテゴリ"); }
  /** モーダルのカテゴリ（絞り込みの呼び出しで一覧が組み立てられる）に名前が出るのを待つ */
  async カテゴリモーダルに出るまで待つ(名前: string, ms = T): Promise<boolean> {
    return expect.poll(async () => (await this.カテゴリモーダル().innerText().catch(() => "")).includes(名前), { timeout: ms }).toBe(true).then(() => true, () => false);
  }
  async カテゴリモーダルが開いているか(): Promise<boolean> { return (await this.カテゴリモーダル().getAttribute("class"))?.includes("is-visible") ?? false; }

  // ---- フッタの開閉欄（支店） ----
  開閉ボタン支店(欄: 欄): Locator {
    const id = { サイトマップ: "footer-branch-nav-sitemap", お得な情報: "footer-branch-nav-info" }[欄];
    return this.page.locator(`footer button.p-hareruya-footer__nav-toggle[aria-controls="${id}"]`).first();
  }
  支店フッタの項目(欄: 欄, 名前: string): Locator {
    const id = { サイトマップ: "footer-branch-nav-sitemap", お得な情報: "footer-branch-nav-info" }[欄];
    return this.page.locator(`#${id} a.p-hareruya-footer__nav-link`).filter({ hasText: new RegExp(`^\\s*${名前}\\s*$`) }).first();
  }
  /** 開閉欄の項目が、欄の見えている範囲の中にあるか（閉じた欄は高さ0ではみ出しを隠す作りのため、位置で比べる。動き0.3秒を待つ） */
  async 支店の欄の中で見えているか(欄: 欄, 名前: string): Promise<boolean> {
    await this.page.waitForTimeout(600);
    const item = this.支店フッタの項目(欄, 名前);
    if ((await item.count()) === 0) return false;
    return item.evaluate((el) => {
      const body = el.closest(".p-hareruya-footer__nav-body") as HTMLElement | null;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return false;
      if (!body) return true;
      const b = body.getBoundingClientRect();
      return r.bottom > b.top + 0.5 && r.top < b.bottom - 0.5 && b.height >= 1;
    });
  }

  /** 新しいタブで開くリンクを押す。開いたタブ（読み込みを待った）と、そのときの開いているタブの数を返す。タブは閉じずに返す */
  async 押して新しいタブを開く(l: Locator, 何: string): Promise<{ タブ: Page; タブの数: number; 開いた先: string }> {
    await expect(l, 何).toBeVisible({ timeout: T });
    const popupP = this.page.context().waitForEvent("page", { timeout: T });
    await this.押す(l, 何);
    const popup = await popupP;
    await popup.waitForLoadState("domcontentloaded", { timeout: 45_000 }).catch(() => undefined);
    await popup.waitForURL((u) => u.toString() !== "about:blank", { timeout: 15_000 }).catch(() => undefined);
    return { タブ: popup, タブの数: this.page.context().pages().length, 開いた先: popup.url() };
  }

  // ---- カート個数の再取得の遮断 ----
  /** 画面を組み立てたあとにカート個数を取り直す通信を遮断する。遮断した回数を返す関数を返す */
  async カート個数の再取得を遮断する(): Promise<() => number> {
    let n = 0;
    await this.page.route(/\/block\/cart(_sp)?(\?.*)?$/, async (route) => { n++; await route.abort(); });
    return () => n;
  }

  readonly 基点 = BASE_URL;
}

/** 数字の表示（「2,500」のような桁区切り・単位を除く） */
export function 数字(text: string): string { return text.replace(/[^\d]/g, ""); }
