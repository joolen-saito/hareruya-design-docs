/**
 * 公開側のマイページ＞お気に入り商品一覧（F06-09）。セレクタはここだけに書く。
 * ログイン・商品詳細のお気に入りボタンは F03-08 の部品（pages/front/f03_08_favorite.ts）を使う。
 */
import { Locator, Page, expect, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { FrontFavorite } from "./f03_08_favorite";

/** 本店の公開側のアドレスの先頭 */
const FRONT = `${BASE_URL}/ja`;

const 空白を詰める = (s: string) => s.replace(/\s+/g, " ").trim();
const 正規表現の文字 = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export class FavoriteListPage {
  readonly fav: FrontFavorite;
  constructor(readonly page: Page) {
    this.fav = new FrontFavorite(page);
  }

  get path(): string { return new URL(this.page.url()).pathname; }
  get url(): string { return this.page.url(); }

  async ログインする(メール: string, パスワード: string): Promise<void> { await this.fav.login(メール, パスワード); }

  /** お気に入り商品一覧を開く（読み込みを待つ） */
  async 開く(): Promise<void> {
    await this.page.goto(`${FRONT}/mypage/favorite`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }

  async 再読込みする(): Promise<void> {
    await this.page.reload({ waitUntil: "load", timeout: 60_000 });
  }

  // ---- 画面の部品 ----

  get 見出し(): Locator { return this.page.locator(".p-hareruya-favorite-list__title h1"); }
  get 商品なしの案内(): Locator { return this.page.locator(".p-hareruya-favorite-list__title .p-hareruya-message-box--info"); }
  get 商品件数(): Locator { return this.page.locator(".p-hareruya-favorite-list .js-favorite-list-count"); }
  get セール対象のみ(): Locator { return this.page.locator("#sale_flg"); }
  get セール対象のみのラベル(): Locator { return this.page.locator('#search_form label[data-filter="sale"]'); }
  get マイページボタン(): Locator { return this.page.locator(".p-hareruya-favorite-list__button a"); }
  get パンくずホーム(): Locator { return this.page.locator(".p-hareruya-favorite-list .p-hareruya-breadcrumb a.p-hareruya-breadcrumb__link").first(); }
  get パンくず現在地(): Locator { return this.page.locator(".p-hareruya-favorite-list .p-hareruya-breadcrumb__current").first(); }
  get カード(): Locator { return this.page.locator(".p-hareruya-favorite-list__grid .p-hareruya-product-card"); }
  /** 並び順のタブ（PC の表示） */
  get 並び順のタブ(): Locator { return this.page.locator(".p-hareruya-toolbar__sort-tabs .p-hareruya-toolbar__sort-link"); }
  /** 表示中の並び順（押せない表示） */
  get 表示中の並び順(): Locator { return this.page.locator(".p-hareruya-toolbar__sort-tabs .p-hareruya-toolbar__sort-link.is-active"); }

  /** お気に入り商品一覧の画面か（見出しが出ている） */
  async 一覧画面か(): Promise<boolean> {
    return /\/mypage\/favorite\/?$/.test(this.path) && (await this.見出し.count()) > 0;
  }

  /** 画面全体の見えている文 */
  async 画面の文(): Promise<string> { return 空白を詰める(await this.page.locator("body").innerText()); }

  /** 商品件数の表示（例「3点」） */
  async 商品件数の表示(): Promise<string> { return 空白を詰める((await this.商品件数.innerText().catch(() => "")) ?? ""); }

  // ---- 商品カード ----

  /** 一覧に出ている商品名（【Foil】の印を含む、空白を詰めた文。カード1枚ずつ） */
  async 商品名の並び(): Promise<string[]> {
    return (await this.カード.locator(".p-hareruya-product-card__name-text").allInnerTexts()).map(空白を詰める);
  }

  /** 商品名（印を除いた名前）がちょうど一致するカード。商品名の前の【Foil】は許す */
  カードの商品(name: string): Locator {
    return this.カード.filter({ has: this.page.locator(".p-hareruya-product-card__name-text", { hasText: new RegExp(`^\\s*(【Foil】)?\\s*${正規表現の文字(name)}\\s*$`) }) });
  }

  /** カードの商品名の文（空白をすべて除く） */
  async 商品名の文(card: Locator): Promise<string> {
    return ((await card.locator(".p-hareruya-product-card__name-text").innerText()) ?? "").replace(/\s+/g, "");
  }

  /** カードの言語（商品詳細へのリンクの lang。JP・EN） */
  async 言語(card: Locator): Promise<string> {
    const href = (await card.locator("a.p-hareruya-product-card__name").getAttribute("href")) ?? "";
    return /[?&]lang=([A-Za-z]+)/.exec(href)?.[1]?.toUpperCase() ?? "";
  }

  画像のリンク(card: Locator): Locator { return card.locator("a.p-hareruya-product-card__img-wrap"); }
  商品名のリンク(card: Locator): Locator { return card.locator("a.p-hareruya-product-card__name"); }
  セールのラベル(card: Locator): Locator { return card.locator(".p-hareruya-product-card__sale-label"); }
  同名商品検索(card: Locator): Locator { return card.locator('a[href*="card_id="]'); }
  削除ボタン(card: Locator): Locator { return card.locator('[data-js-target="favorite-remove-btn"]'); }
  カートに入れるボタン(card: Locator): Locator { return card.locator("button.add-cart"); }
  明細(card: Locator): Locator { return card.locator(".p-hareruya-product-card__condition-item"); }

  /** 明細の表示（状態・価格・在庫の文、商品数の操作が見えて押せるか） */
  async 明細の表示(card: Locator): Promise<明細[]> {
    const out: 明細[] = [];
    for (const r of await this.明細(card).all()) {
      const cond = r.locator(".p-hareruya-product-card__condition");
      const price = 空白を詰める((await r.locator(".p-hareruya-product-card__price").innerText().catch(() => "")) ?? "");
      const qty = r.locator(".p-hareruya-product-card__quantity-controls");
      out.push({
        row: r,
        状態: (await cond.count()) ? 空白を詰める(await cond.first().innerText()) : null,
        価格の文: price,
        価格: /\d/.test(price) ? Number(price.replace(/[^\d]/g, "")) : null,
        在庫の文: 空白を詰める((await r.locator(".p-hareruya-product-card__stock").innerText().catch(() => "")) ?? ""),
        商品数が見える: (await qty.count()) > 0 && (await qty.first().isVisible()),
        商品数を変えられる: (await qty.count()) > 0 && (await qty.locator(".btn-plus").first().isEnabled().catch(() => false)),
      });
    }
    return out;
  }

  /** 明細の商品数（見た目の入力欄の値） */
  async 商品数(row: Locator): Promise<number> {
    return Number(await row.locator(".qty-label").inputValue());
  }

  /** 商品数の＋・－を押して、商品数を n にする。届かなければ落とす */
  async 商品数を合わせる(row: Locator, n: number): Promise<void> {
    for (let i = 0; i < 30; i++) {
      const now = await this.商品数(row);
      if (now === n) return;
      const btn = row.locator(now < n ? ".btn-plus" : ".btn-minus");
      if (!(await btn.isEnabled())) break;
      await btn.click();
      await expect.poll(() => this.商品数(row), "商品数が変わる").not.toBe(now);
    }
    throw new Error(`商品数を ${n} にできない（いま ${await this.商品数(row)}）`);
  }

  /**
   * 商品数で選べる値。－を押せなくなるまで（または値が変わらなくなるまで）下げ、＋を押せなくなるまで上げて、途中で表示された値を集める。
   * 商品数の欄は選択肢の一覧ではなく＋・－で増減する作りなので、この形で「選べる値」を読む。
   */
  async 選べる商品数(row: Locator): Promise<number[]> {
    const seen = new Set<number>();
    for (const dir of [".btn-minus", ".btn-plus"]) {
      for (let i = 0; i < 30; i++) {
        const now = await this.商品数(row);
        seen.add(now);
        const btn = row.locator(dir);
        if (!(await btn.isEnabled())) break;
        await btn.click();
        await this.page.waitForTimeout(100);
        if ((await this.商品数(row)) === now) break;
      }
    }
    return [...seen].sort((a, b) => a - b);
  }

  /** カートに入れるを押し、画面に出た結果（通知・モーダル）を待つ */
  async カートに入れる(card: Locator): Promise<{ 通知: string; モーダル: string }> {
    await this.page.waitForLoadState("load");
    const btn = this.カートに入れるボタン(card);
    await expect(btn, "カートに入れるボタン").toBeVisible();
    const res = this.page.waitForResponse((r) => /\/mypage\/favorite\/cart_add_bulk\/\d+/.test(r.url()) && r.request().method() === "POST", { timeout: 60_000 }).catch(() => null);
    await btn.click();
    await res;
    const popup = this.page.locator("#hareruya-app-cart-popup, #hareruya-favorite-cart-popup");
    const modal = this.page.locator("#favorite-cart-alert-modal.is-active");
    await expect.poll(async () => (await popup.evaluateAll((ns) => ns.some((n) => n.classList.contains("is-visible")))) || (await modal.count()) > 0,
      { message: "カートに入れたあとの通知かモーダルが出る", timeout: 15_000 }).toBe(true).catch(() => undefined);
    const 通知 = 空白を詰める((await popup.evaluateAll((ns) => ns.filter((n) => n.classList.contains("is-visible")).map((n) => (n as HTMLElement).innerText).join(" "))) ?? "");
    const モーダル = (await modal.count()) ? 空白を詰める(await modal.innerText()) : "";
    return { 通知, モーダル };
  }

  /** 画面に見えている「Yes」のボタン・リンク */
  get Yesのボタン(): Locator {
    return this.page.locator("button:visible, a:visible").filter({ hasText: /^\s*Yes\s*$/ });
  }

  // ---- 操作 ----

  /** セール対象のみのチェックを切り替える（切り替えると画面が検索し直す）。読み込みを待つ */
  async セール対象のみを切り替える(on: boolean): Promise<void> {
    if ((await this.セール対象のみ.isChecked()) === on) throw new Error(`セール対象のみはすでに${on ? "チェックあり" : "チェックなし"}`);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), this.セール対象のみのラベル.click()]);
    await this.page.waitForLoadState("load");
  }

  /** 表示順のタブで、表示名に文字を含む並び順を選ぶ（タブが見えなければ、スマホ表示の選択欄で選ぶ）。選んだ表示名を返す */
  async 並び順を選ぶ(含む文字: string): Promise<string> {
    const tab = this.並び順のタブ.filter({ hasText: 含む文字 });
    if ((await tab.count()) === 1 && (await tab.isVisible())) {
      const label = 空白を詰める(await tab.innerText());
      await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), tab.click()]);
      return label;
    }
    const select = this.page.locator("#favorite-sort-select");
    const options = await select.locator("option").evaluateAll((os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, t: (o.textContent ?? "").replace(/\s+/g, " ").trim() })));
    const hit = options.filter((o) => o.t.includes(含む文字));
    if (hit.length !== 1) throw new Error(`表示順に「${含む文字}」を含む選択肢を1つに決められない（${options.map((o) => o.t).join("、")}）`);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), select.selectOption(hit[0].v)]);
    return hit[0].t;
  }

  /** 表示中の並び順の表示名 */
  async 表示中の並び順の名前(): Promise<string> {
    if ((await this.表示中の並び順.count()) === 0) return "";
    return 空白を詰める(await this.表示中の並び順.first().innerText());
  }

  /** リンク・ボタンを押して画面の移動を待つ（固定ヘッダーが重なって押せないときは、クリックの操作を要素へ直接送る） */
  async 押して遷移する(l: Locator): Promise<void> {
    await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const nav = this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 });
    try {
      await l.click({ timeout: 10_000 });
    } catch (e) {
      test.info().annotations.push({ type: "手順の注記", description: `押す要素に固定ヘッダーが重なり、普通のクリックでは押せなかった。クリックの操作を要素へ直接送って続けた（${String(e).split("\n")[0].slice(0, 80)}）` });
      await l.dispatchEvent("click");
    }
    await nav;
  }

  /** 押して、画面が移らないか待つ（移ったら移った先を読む）。移ったかを返す */
  async 押して移るかを見る(l: Locator, waitMs = 3000): Promise<boolean> {
    const before = this.page.url();
    let moved = false;
    const onNav = (f: import("@playwright/test").Frame) => { if (f === this.page.mainFrame()) moved = true; };
    this.page.on("framenavigated", onNav);
    try {
      await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await l.click({ timeout: 10_000 }).catch(() => l.dispatchEvent("click"));
      await this.page.waitForTimeout(waitMs);
      await this.page.waitForLoadState("load");
    } finally {
      this.page.off("framenavigated", onNav);
    }
    return moved || this.page.url() !== before;
  }

  /** 画面の再読込みを見分ける印を置く（再読込みすると消える） */
  async 再読込みの印を置く(): Promise<void> {
    await this.page.evaluate(() => { (window as unknown as { __f0609Mark?: number }).__f0609Mark = 1; });
  }
  async 再読込みの印が残っているか(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as { __f0609Mark?: number }).__f0609Mark === 1).catch(() => false);
  }

  /** お気に入りから削除を押し、そのカードが画面から消えるのを待つ */
  async 削除する(card: Locator): Promise<void> {
    await this.page.waitForLoadState("load");
    const btn = this.削除ボタン(card);
    await expect(btn, "お気に入りから削除のボタン").toBeVisible();
    const res = this.page.waitForResponse((r) => /\/mypage\/favorite\/\d+\/delete\//.test(r.url()), { timeout: 60_000 }).catch(() => null);
    await btn.click();
    await res;
    await expect(card, "削除したカードが画面から消える").toHaveCount(0, { timeout: 15_000 }).catch(() => undefined);
  }
}

export type 明細 = {
  row: Locator;
  /** 状態の表示（カード商品だけに出る）。無ければ null */
  状態: string | null;
  価格の文: string;
  /** 価格の数字（桁区切り・通貨の記号を除く）。数字が無ければ null */
  価格: number | null;
  在庫の文: string;
  商品数が見える: boolean;
  商品数を変えられる: boolean;
};
