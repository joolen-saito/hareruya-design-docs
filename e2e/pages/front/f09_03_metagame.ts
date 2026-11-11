/**
 * 公開側のメタゲーム一覧（F09-03）。フォーマットの識別子をアドレスに入れて開く。
 * 遷移の先（デッキ検索結果・デッキ検索TOP・デッキ詳細検索のモーダル）は、F09-01・F09-02 の部品
 * （pages/front/f09_01_deck_top.ts・f09_02_deck_result.ts）を使う。ここはメタゲーム一覧の画面と、採用枚数ランキングの見出しの読み取りだけを置く。
 */
import { expect, Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const 文 = (t: string | null | undefined) => (t ?? "").replace(/\s+/g, " ").trim();
const 正規 = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 一覧の1行の表示 */
export type メタゲームの行 = {
  /** アーキタイプ名（日本語名） */
  名前: string;
  /** 「デッキ数：」の後ろの文（「デッキ数：」が無ければ行の文のまま） */
  デッキ数: string;
  /** 「使用率：」の後ろの文（「%」を含む） */
  使用率: string;
  /** 画像の表示（背景画像の参照先） */
  画像: string;
  /** 行のリンク先 */
  リンク: string;
};

export class MetagamePage {
  constructor(readonly page: Page) {}

  /** メタゲーム一覧（日本語表示）のアドレス。識別子はそのまま入れる（数字以外も入れる） */
  static アドレス(識別子: string): string { return `${BASE_URL}/ja/deck/${識別子}/metagame/`; }

  /** フォーマットの識別子を入れたアドレスで開く。応答の状態を返す（404 などでも落とさない） */
  async 開く(識別子: string): Promise<number> {
    const res = await this.page.goto(MetagamePage.アドレス(識別子), { waitUntil: "load", timeout: 90_000 });
    return res?.status() ?? 0;
  }

  /** メタゲーム一覧の見出し（「<フォーマット名>メタゲーム<開始日>～」） */
  get 見出し(): Locator { return this.page.locator("h1.c-hareruya-heading--lev1").first(); }
  /** 見出しの中の、集計期間の開始日の表示 */
  get 見出しの開始日(): Locator { return this.見出し.locator("span").first(); }

  /** 画面の組み立てが済むのを待つ（見出しと、一覧か該当なしの案内のどちらか） */
  async 読み込みを待つ(): Promise<void> {
    await expect(this.見出し, "メタゲーム一覧の見出し").toBeVisible({ timeout: 30_000 });
    await expect(this.page.locator(".event-main-middle-wrapper .contents > ul").first(), "メタゲーム一覧の一覧の領域（行か、該当なしの案内）").toBeAttached({ timeout: 30_000 });
  }

  /** 見出しの、開始日を除いた部分（「<フォーマット名>メタゲーム」） */
  async 見出しの名前(): Promise<string> {
    return this.見出し.evaluate((h) => Array.from(h.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent ?? "").join("").replace(/\s+/g, " ").trim());
  }

  /** 見出しの開始日の文（末尾の「～」を外す） */
  async 開始日(): Promise<string> { return 文(await this.見出しの開始日.textContent()).replace(/～$/, ""); }

  get 一覧の項目(): Locator { return this.page.locator("ul.deckSearch-metaList__list > li.deckSearch-metaList__list__item"); }

  /** 該当なしの案内（一覧の領域に出る文） */
  get 該当なしの案内(): Locator {
    return this.page.locator(".event-main-middle-wrapper .contents > ul:not(.deckSearch-metaList__list) > li", { hasText: /^\s*ご指定の条件に一致するデッキが見つかりませんでした。\s*$/ });
  }

  /** 一覧の行（上から順） */
  async 行(): Promise<メタゲームの行[]> {
    return this.一覧の項目.evaluateAll((lis) => lis.map((li) => {
      const t = (c: string) => (li.querySelector(c)?.textContent ?? "").replace(/\s+/g, " ").trim();
      const bg = li.querySelector(".deckSearch-metaList__list__itemBg") as HTMLElement | null;
      const img = bg ? (bg.style.backgroundImage || getComputedStyle(bg).backgroundImage) : "";
      const 数 = t(".deckSearch-metaList__list__item__count");
      const 率 = t(".deckSearch-metaList__list__item__percent");
      return {
        名前: t(".deckSearch-metaList__list__item__name"),
        デッキ数: 数.startsWith("デッキ数：") ? 数.slice("デッキ数：".length).trim() : 数,
        使用率: 率.startsWith("使用率：") ? 率.slice("使用率：".length).trim() : 率,
        画像: img.replace(/^url\(["']?/, "").replace(/["']?\)$/, ""),
        リンク: (li.querySelector("a") as HTMLAnchorElement | null)?.href ?? "",
      };
    }));
  }

  /** アーキタイプ名が一致する行のリンク */
  行のリンク(アーキタイプ名: string): Locator {
    return this.一覧の項目.filter({ has: this.page.locator(".deckSearch-metaList__list__item__name", { hasText: new RegExp(`^\\s*${正規(アーキタイプ名)}\\s*$`) }) }).locator("a").first();
  }

  /** 一覧の行を押し、デッキ検索結果へ移るのを待つ */
  async 行を押す(アーキタイプ名: string): Promise<void> {
    const link = this.行のリンク(アーキタイプ名);
    await expect(link, `一覧の「${アーキタイプ名}」の行`).toBeVisible();
    await link.scrollIntoViewIfNeeded();
    await Promise.all([this.page.waitForURL(/\/deck\/result\//, { waitUntil: "load", timeout: 90_000 }), link.click()]);
  }

  /** 画面上部の「採用枚数ランキング」 */
  get 採用枚数ランキング(): Locator {
    return this.page.locator(".p-hareruya-deck-metagame__header-container a").filter({ hasText: /^\s*採用枚数ランキング\s*$/ });
  }
  async 採用枚数ランキングを押す(): Promise<void> {
    await expect(this.採用枚数ランキング, "画面上部の「採用枚数ランキング」").toHaveCount(1);
    await Promise.all([this.page.waitForURL(/\/deck\/\d+\/usage_ranking\//, { waitUntil: "load", timeout: 90_000 }), this.採用枚数ランキング.click()]);
  }

  /** 画面下部の「戻る」 */
  get 戻る(): Locator { return this.page.locator(".button__container-return a.eventSearch__button-return").filter({ hasText: /^\s*戻る\s*$/ }); }
  async 戻るを押す(): Promise<void> {
    await expect(this.戻る, "画面下部の「戻る」").toHaveCount(1);
    await this.戻る.scrollIntoViewIfNeeded();
    await Promise.all([this.page.waitForURL((u) => /\/deck\/$/.test(u.pathname), { waitUntil: "load", timeout: 90_000 }), this.戻る.click()]);
  }
}

/** 採用枚数ランキングの見出し（読み取りだけ）。画面幅で改行が入るので、空白を詰めて返す */
export async function 採用枚数ランキングの見出し(page: Page): Promise<string> {
  const h = page.locator("h1.c-hareruya-heading--lev1").first();
  await expect(h, "採用枚数ランキングの見出し").toBeVisible({ timeout: 30_000 });
  return ((await h.textContent()) ?? "").replace(/\s+/g, "");
}

/** ページの見出し（h1）の文（空白を詰める。上から順） */
export async function 見出しの文(page: Page): Promise<string[]> {
  return (await page.locator("h1").allTextContents()).map((t) => t.replace(/\s+/g, ""));
}

/** デッキ詳細検索のモーダルの、成績・公開/非公開で選ばれている選択肢の表示名 */
export async function 選ばれている選択肢(フォーム: Locator, 欄: "grades" | "public_status"): Promise<string> {
  const checked = フォーム.locator(`input[type="radio"][name="${欄}"]:checked`);
  const n = await checked.count();
  if (n !== 1) return `（選ばれている選択肢が ${n} 件）`;
  return 文(await checked.locator("xpath=..").textContent());
}
