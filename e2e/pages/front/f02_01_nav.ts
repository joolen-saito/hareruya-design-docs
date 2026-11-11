/**
 * F02-01 本店のグローバルナビ（PC版）。本店ECTOP（/ja/・/en/）のヘッダ（グローバルナビ・メニュー・日英切替・検索・ポイント・お気に入り・カート）と
 * フッタ（サイトマップ・会社情報・お得な情報・バナー）の操作と読み取り。セレクタはここだけに書く。
 * 画面の作りはアプリのテンプレート（Block/header・mega_menu・header_user・cart・search_product・footer_*）で確かめた。期待値はここに書かない。
 */
import { Locator, Page, Request, expect } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const T = 30_000;
export type 言語 = "ja" | "en";

export class MainNavPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); page.setDefaultNavigationTimeout(60_000); }

  path(): string { return new URL(this.page.url()).pathname; }
  /** ECTOP（本店のトップ）のアドレスか */
  ECTOPか(言語: 言語 = "ja"): boolean { return this.path().replace(/\/$/, "") === `/${言語}`; }

  async ECTOPを開く(言語: 言語 = "ja"): Promise<void> {
    await this.page.goto(`${BASE_URL}/${言語}/`);
    await this.page.waitForLoadState("load");
  }
  async 開く(path: string): Promise<void> {
    await this.page.goto(`${BASE_URL}${path}`);
    await this.page.waitForLoadState("load");
  }

  // ---- グローバルナビ・ロゴ・メニュー ----
  readonly ロゴ = () => this.page.locator("header a.p-hareruya-header__logo-link").first();
  readonly フッタのロゴ = () => this.page.locator("footer a.p-hareruya-footer__logo").first();
  readonly グローバルナビ = () => this.page.locator("nav.p-hareruya-header__nav");
  /** グローバルナビの見えているリンク（文字で選ぶ） */
  ナビのリンク(名前: string): Locator {
    return this.グローバルナビ().locator("a.p-hareruya-header__nav-link:visible").filter({ hasText: new RegExp(`^\\s*${esc(名前)}\\s*$`) });
  }
  /** グローバルナビのリンクのうち、アドレスの末尾が path のもの（表示言語によらず数える） */
  ナビのリンク先(path: string): Locator { return this.グローバルナビ().locator(`a.p-hareruya-header__nav-link[href$="${path}"]`); }
  readonly 日英切替 = () => this.page.locator("li.p-hareruya-header__nav-item--lang a.p-hareruya-header__nav-link").first();
  readonly メニュー表示アイコン = () => this.page.locator("button.p-hareruya-header__menu-btn").first();
  readonly メニュー = () => this.page.locator("[data-menu-dropdown]").first();
  readonly メニューの項目 = () => this.メニュー().locator("a.p-hareruya-header__menu-link");
  メニューのリンク(名前: string): Locator {
    return this.メニュー().locator("a.p-hareruya-header__menu-link").filter({ has: this.page.locator(".p-hareruya-header__menu-text", { hasText: new RegExp(`^\\s*${esc(名前)}\\s*$`) }) });
  }
  メニューのリンク先(path: string): Locator { return this.メニュー().locator(`a.p-hareruya-header__menu-link[href$="${path}"]`); }

  // ---- 検索 ----
  readonly カードセット選択メニュー = () => this.page.locator("#frmSearch [data-search-category-toggle]").first();
  readonly カードセットの表示 = () => this.page.locator("#frmSearch [data-search-category-text]").first();
  readonly カードセットの選択肢 = () => this.page.locator("#frmSearch [data-search-category-dropdown] [data-search-category-item]");
  カードセットの選択肢の名前(名前: string): Locator { return this.カードセットの選択肢().filter({ hasText: new RegExp(`^\\s*${esc(名前)}\\s*$`) }); }
  /** 送信されるカードセットの値（選ばれたカードセットID） */
  readonly 選ばれたカードセット = () => this.page.locator("#frmSearch [data-search-category-input]").first();
  readonly 商品検索テキストボックス = () => this.page.locator("#frmSearch input[name=product]").first();
  readonly 詳細検索ボタン = () => this.page.locator('.p-hareruya-header__search-detail button[data-modal-open="search"]').first();
  readonly 詳細検索モーダル = () => this.page.locator("#product-detailed-search-modal");
  /** 商品検索の「検索」ボタン（虫眼鏡） */
  readonly 検索ボタン = () => this.page.locator('#frmSearch button[name="search-submit"]').first();

  // ---- カテゴリバー（ECTOP のヘッダの下。カテゴリ・最新セット・各フォーマット・その他のボタン。マウスオーバーで木が開く） ----
  /** カテゴリバーのボタンの数（名前の完全一致） */
  カテゴリバーのボタン(名前: string): Locator {
    return this.page.locator("button.p-hareruya-header__category-btn").filter({ has: this.page.locator(".p-hareruya-header__category-btn-text", { hasText: new RegExp(`^\\s*${esc(名前)}\\s*$`) }) });
  }
  /** カテゴリバーのボタンの下に開く木の枠 */
  カテゴリの木(名前: string): Locator {
    return this.カテゴリバーのボタン(名前).first().locator("xpath=ancestor::li[1]").locator("[data-category-dropdown]");
  }
  /** 木の第 列 列（1始まり）に並ぶ項目の名前（上から順） */
  async カテゴリの列の項目名(名前: string, 列: number): Promise<string[]> {
    const t = await this.カテゴリの木(名前).locator(`[data-column="${列}"] .p-hareruya-header__category-dropdown-item-text`).allInnerTexts();
    return t.map((x) => x.replace(/\s+/g, " ").trim());
  }
  /** 木の 列 列にある、名前に一致する項目 */
  カテゴリの項目(木の名前: string, 列: number, 項目名: string): Locator {
    return this.カテゴリの木(木の名前).locator(`[data-column="${列}"] a.p-hareruya-header__category-dropdown-item`)
      .filter({ has: this.page.locator(".p-hareruya-header__category-dropdown-item-text", { hasText: new RegExp(`^\\s*${esc(項目名)}\\s*$`) }) });
  }

  // ---- ポイント・ログイン・マイページ・お気に入り ----
  /** ヘッダのポイント欄の数字（上段の小さな表示と、検索欄の右の大きな表示） */
  readonly ポイントの数字 = () => this.page.locator("header .p-hareruya-header__point-value, header .p-hareruya-header__point-value-large");
  readonly ポイントの導線 = () => this.page.locator("header a.p-hareruya-header__nav-right-link:has(.p-hareruya-header__point-display)").first();
  readonly ログインの導線 = () => this.page.locator("header a.p-hareruya-header__nav-right-link", { hasText: "ログイン" }).first();
  readonly マイページの導線 = () => this.page.locator("header a.p-hareruya-header__nav-right-link", { hasText: "マイページ" }).first();
  readonly お気に入り欄 = () => this.page.locator("header .p-hareruya-header__nav-right-item--favorite").first();
  readonly お気に入りの導線 = () => this.お気に入り欄().locator("a.p-hareruya-header__nav-right-link").first();
  readonly お気に入りアイコン = () => this.お気に入り欄().locator("i.icon-hareruya-favorite").first();
  readonly お気に入りの件数 = () => this.お気に入り欄().locator(".p-hareruya-header__nav-right-badge");
  readonly ログインを促すモーダル = () => this.page.locator("#favorite-login-modal").first();

  // ---- カート ----
  readonly カート欄 = () => this.page.locator("header .p-hareruya-header__nav-right-item--cart").first();
  readonly カート = () => this.カート欄().locator("[data-cart-toggle]").first();
  readonly カートの商品数 = () => this.カート欄().locator("[data-cart-toggle] .p-hareruya-header__nav-right-badge");
  readonly カートの一覧 = () => this.カート欄().locator("[data-cart-dropdown]").first();
  readonly カートの合計点数 = () => this.カート欄().locator(".p-hareruya-header__cart-dropdown-count").first();
  readonly 送料無料までの金額 = () => this.カート欄().locator(".p-hareruya-header__cart-dropdown-shipping");
  readonly カートの商品 = () => this.カート欄().locator(".p-hareruya-header__cart-item");
  readonly カートページへ = () => this.カート欄().locator(".p-hareruya-header__cart-dropdown-footer a").first();
  カートの商品の行(商品名: string): Locator {
    return this.カートの商品().filter({ has: this.page.locator(".p-hareruya-header__cart-item-name-text", { hasText: 商品名 }) });
  }
  async カートの商品名(): Promise<string[]> {
    return (await this.カート欄().locator(".p-hareruya-header__cart-item-name-text").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }
  行の削除(行: Locator): Locator { return 行.locator("[data-cart-item-delete]").first(); }
  行のマイナス(行: Locator): Locator { return 行.locator("[data-cart-item-decrement]"); }
  行のプラス(行: Locator): Locator { return 行.locator("[data-cart-item-increment]"); }
  行の商品数(行: Locator): Locator { return 行.locator(".p-hareruya-header__cart-item-quantity-input"); }

  /** カートの数量操作（削除・増減）を押し、応答とカート欄の読み直しを待つ */
  async カートの操作を押す(ボタン: Locator): Promise<number> {
    const [res] = await Promise.all([
      this.page.waitForResponse((r) => /\/cart\/(up|down|remove|set)\/\d+/.test(new URL(r.url()).pathname), { timeout: T }),
      ボタン.click({ timeout: T }),
    ]);
    await this.page.waitForResponse((r) => new URL(r.url()).pathname.endsWith("/block/cart"), { timeout: 15_000 }).catch(() => undefined);
    await this.page.waitForTimeout(500);
    return res.status();
  }

  // ---- フッタ ----
  フッタの欄(見出し: string): Locator {
    return this.page.locator("footer .p-hareruya-footer__nav-section").filter({ has: this.page.locator(".p-hareruya-footer__nav-title", { hasText: new RegExp(`^\\s*${esc(見出し)}\\s*$`) }) }).first();
  }
  フッタの欄のリンク(見出し: string, 名前: string): Locator {
    return this.フッタの欄(見出し).locator("a.p-hareruya-footer__nav-link").filter({ hasText: new RegExp(`^\\s*${esc(名前)}\\s*$`) });
  }
  /** 画面最下部の静的コンテンツ欄（バナー）。画像の代替テキストで選ぶ */
  フッタのバナー(代替テキスト: string): Locator {
    return this.page.locator("footer .p-hareruya-footer__banners a.p-hareruya-footer__banner-link").filter({ has: this.page.locator(`img[alt="${代替テキスト}"]`) });
  }
  async フッタの欄まで移動する(見出し: string): Promise<void> {
    const sec = this.フッタの欄(見出し);
    await sec.scrollIntoViewIfNeeded({ timeout: T });
    // 幅の狭い画面ではアコーディオンで閉じている。PC幅では開いているが、閉じていれば開く
    const body = sec.locator(".p-hareruya-footer__nav-body");
    if (!(await body.isVisible())) await sec.locator(".p-hareruya-footer__nav-toggle").click();
  }

  // ---- 操作 ----
  /** マウスを要素の中心へ動かす */
  async マウスオーバーする(l: Locator): Promise<void> {
    await l.scrollIntoViewIfNeeded({ timeout: T });
    const box = await l.boundingBox({ timeout: T });
    if (!box) throw new Error("マウスを動かす先の要素が表示されていない");
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
    await this.page.waitForTimeout(800);
  }
  /** マウスを画面の中ほど（ヘッダから離れた所）へ外す */
  async マウスを外す(): Promise<void> {
    const vp = this.page.viewportSize() ?? { width: 1280, height: 720 };
    await this.page.mouse.move(vp.width / 2, vp.height - 40, { steps: 5 });
    await this.page.waitForTimeout(800);
  }
  /** 同じタブで遷移するリンクを押す */
  async 押して遷移する(l: Locator): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), l.click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }
  /**
   * 新しいタブで開くリンクを押し、開いたタブが移ったアドレス（リダイレクトを含め、順に）を返す。外部のサイトは読み込みきれなくてもよい。
   * 開いたタブは閉じる。
   */
  async 押して新しいタブのアドレスを読む(l: Locator): Promise<{ アドレス: string[]; 最後: string }> {
    const [p] = await Promise.all([this.page.context().waitForEvent("page", { timeout: T }), l.click({ timeout: T })]);
    const urls: string[] = [];
    const add = (u: string) => { if (/^https?:/.test(u) && urls[urls.length - 1] !== u) urls.push(u); };
    p.on("request", (r: Request) => { if (r.isNavigationRequest() && r.frame() === p.mainFrame()) add(r.url()); });
    p.on("framenavigated", (f) => { if (f === p.mainFrame()) add(f.url()); });
    await p.waitForURL(/^https?:/, { timeout: T }).catch(() => undefined);
    add(p.url());
    await p.waitForLoadState("domcontentloaded", { timeout: 20_000 }).catch(() => undefined);
    add(p.url());
    const 最後 = p.url();
    await p.close().catch(() => undefined);
    return { アドレス: urls, 最後 };
  }
  async テキスト(l: Locator): Promise<string> { return (await l.innerText({ timeout: T })).replace(/\s+/g, " ").trim(); }
  async 見えている(l: Locator): Promise<boolean> { return l.isVisible(); }
  async 表示されている(l: Locator, 何: string): Promise<void> { await expect(l, 何).toBeVisible({ timeout: T }); }
}

function esc(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

/** 商品検索の候補リスト（サジェスト）の取得先への要求を、記録を始めてから集める */
export class 通信記録 {
  readonly 要求: string[] = [];
  /** 候補を選んだときなどに商品を取りに行く検索の要求（参考に控える。候補リストの取得先ではない） */
  readonly 検索の要求: string[] = [];
  private readonly on = (r: Request) => {
    const p = new URL(r.url()).pathname;
    if (p.endsWith("/products/search/unisuggest_api")) this.要求.push(r.url());
    else if (p.endsWith("/products/search/unisearch_api")) this.検索の要求.push(r.url());
  };
  constructor(readonly page: Page) {}
  開始する(): void { this.page.on("request", this.on); }
  止める(): void { this.page.off("request", this.on); }
  /** キーワード kw の要求のうち最後のもの（送信内容の名前と値の組） */
  入力し終えたあとの要求(kw: string): [string, string][] | null {
    const hits = this.要求.map((u) => new URL(u)).filter((u) => u.searchParams.get("kw") === kw);
    const last = hits[hits.length - 1];
    return last ? [...last.searchParams.entries()] : null;
  }
}

export type 送信内容の指定 = {
  /** カードセットの指定（名前に cardset を含む項目の値。無ければ null） */
  カードセット: string | null;
  支店表示フラグ: string | null;
  買取価格: string | null;
  カード状態: string | null;
  高額商品コード: string | null;
  予約商品: string | null;
};
/** 候補リストの取得先への要求の送信内容から、業務の指定ごとの値を読む（項目の名前は送信内容の名前。物理名はここだけ） */
export function 送信内容の指定を読む(params: [string, string][]): 送信内容の指定 {
  const v = (re: RegExp) => { const hit = params.filter(([k]) => re.test(k)); return hit.length ? hit.map(([, x]) => x).join(",") : null; };
  return {
    カードセット: v(/cardset/i), 支店表示フラグ: v(/branch/i), 買取価格: v(/buy_price/i), カード状態: v(/card_condition/i),
    高額商品コード: v(/high_price/i), 予約商品: v(/reserv/i),
  };
}

/** 商品検索テキストボックスに文字を1字ずつ入れる（入力のたびに候補リストを取りに行く作りなので、打鍵で入れる） */
export async function 文字を打つ(l: Locator, text: string): Promise<void> {
  await l.click({ timeout: T });
  await l.pressSequentially(text, { delay: 80 });
  await l.page().waitForTimeout(1500);
}
