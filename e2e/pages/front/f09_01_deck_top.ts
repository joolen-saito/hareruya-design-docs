/**
 * 公開側のデッキ検索TOP（F09-01）と、そこから開く画面（デッキ詳細検索のモーダル・アーキタイプの選択画面）。
 * 遷移の先（デッキ検索結果・メタゲーム一覧）は、遷移を確かめるのに要る読み取りだけを置く（それぞれの機能の部品ではない）。
 */
import { expect, Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { フォーマットコード } from "../admin/f09_01_setup";

const 正規 = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const 文 = async (l: Locator): Promise<string[]> => (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());

export class DeckTopPage {
  constructor(readonly page: Page) {}

  /** デッキ検索TOP（日本語表示）を開く。応答の状態を返す */
  async 開く(): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}/ja/deck/`, { waitUntil: "load", timeout: 60_000 });
    const status = res?.status() ?? 0;
    if (status >= 400) throw new Error(`デッキ検索TOPを開けない（応答 ${status}）`);
    // その他フォーマットの案内の「その他」は常に出る。出ていれば、画面の組み立てが済んでいる
    await expect(this.その他の入口, "デッキ検索TOPの、その他フォーマットの案内の「その他」").toBeVisible({ timeout: 30_000 });
    return status;
  }

  // ---- メタゲームの区画 ----

  /** ランキング表示のフォーマットのメタゲームの区画（すべて、上から順） */
  get メタゲームの区画(): Locator { return this.page.locator(".deckSearch-top__flexwrapper--rankingView > .deckSearch-top__metagame__wrapper"); }

  /** フォーマット名のメタゲームの区画（見出しが「<フォーマット名>メタゲーム」） */
  区画(フォーマット名: string): Locator {
    return this.メタゲームの区画.filter({ has: this.page.locator(".deckSearch-top__metagame-title", { hasText: new RegExp(`^\\s*${正規(フォーマット名)}メタゲーム`) }) });
  }

  /** 区画の見出しのフォーマット名（上から順） */
  async 区画のフォーマット名(): Promise<string[]> {
    return (await 文(this.メタゲームの区画.locator(".deckSearch-top__metagame-title"))).map((t) => t.replace(/メタゲーム.*$/, ""));
  }

  /** 区画に示されたアーキタイプ（上から順の、名前とデッキ数の文） */
  async アーキタイプ(フォーマット名: string): Promise<{ 名前: string; デッキ数: string }[]> {
    const items = this.区画(フォーマット名).locator("a.deckSearch-top__archetype__link");
    const out: { 名前: string; デッキ数: string }[] = [];
    for (const it of await items.all()) {
      out.push({
        名前: ((await it.locator(".deckSearch-top__archetype-name").textContent()) ?? "").trim(),
        デッキ数: ((await it.locator(".deckSearch-top__archetype-count").textContent()) ?? "").trim(),
      });
    }
    return out;
  }

  アーキタイプのリンク(フォーマット名: string, アーキタイプ名: string): Locator {
    return this.区画(フォーマット名).locator("a.deckSearch-top__archetype__link", { has: this.page.locator(".deckSearch-top__archetype-name", { hasText: new RegExp(`^\\s*${正規(アーキタイプ名)}\\s*$`) }) });
  }

  もっと見る(フォーマット名: string): Locator { return this.区画(フォーマット名).locator("a.deckSearch-top__archetype__link--more"); }
  見出しのリンク(フォーマット名: string): Locator { return this.区画(フォーマット名).locator(".deckSearch-top__metagame-title a.deckSearch-top__metagame-title__link"); }

  /** 区画の中の、すべてのリンク先と文（表示にもリンクにも名前が出ないことの確かめ） */
  async 区画の文とリンク(フォーマット名: string): Promise<{ 文: string; リンク: string[] }> {
    const box = this.区画(フォーマット名);
    return {
      文: ((await box.textContent()) ?? "").replace(/\s+/g, " "),
      リンク: await box.locator("a").evaluateAll((as) => as.map((a) => decodeURIComponent((a as HTMLAnchorElement).href))),
    };
  }

  // ---- その他フォーマットの案内 ----

  /** その他フォーマットの案内の入口（「その他」を除く、上から順のフォーマット名） */
  async その他フォーマットの入口(): Promise<string[]> {
    const links = this.page.locator(".deckSearch-top__flexwrapper--second a.deckSearch-top__metagame-title:not(.deckSearch-top__metagame-title-other), .deckSearch-top__flexwrapper--last a.deckSearch-top__metagame-title:not(.deckSearch-top__metagame-title-other)");
    return (await 文(links)).map((t) => t.replace(/メタゲーム$/, ""));
  }
  その他フォーマットのリンク(フォーマット名: string): Locator {
    return this.page.locator(".deckSearch-top__flexwrapper--second a.deckSearch-top__metagame-title, .deckSearch-top__flexwrapper--last a.deckSearch-top__metagame-title")
      .filter({ hasText: new RegExp(`^\\s*${正規(フォーマット名)}メタゲーム\\s*$`) });
  }
  get その他の入口(): Locator { return this.page.locator("a.deckSearch-top__metagame-title-other"); }

  // ---- 直近の大会 ----

  get 直近の大会の区画(): Locator { return this.page.locator(".deckSearch-top__tournamentWrapper"); }
  get 直近の大会の見出し(): Locator { return this.page.locator("h2.deckSearch-top__tournamentTitle"); }

  /** 直近の大会の行（上から順。開催日・フォーマット名・大会名・参加人数の文） */
  async 直近の大会の行(): Promise<{ 開催日: string; フォーマット: string; 大会名: string; 参加人数: string }[]> {
    return this.page.locator(".deckSearch-top__tournamentList__item").evaluateAll((lis) => lis.map((li) => {
      const t = (c: string) => (li.querySelector(`.deckSearch-top__tournamentList__item__container.${c}`)?.textContent ?? "").replace(/\s+/g, " ").trim();
      return { 開催日: t("date"), フォーマット: t("format"), 大会名: t("title"), 参加人数: t("number") };
    }));
  }
  直近の大会のリンク(大会名: string): Locator {
    return this.page.locator("a.deckSearch-top__tournamentList__item__wrapper", { has: this.page.locator(".title", { hasText: new RegExp(`^\\s*${正規(大会名)}\\s*$`) }) });
  }
}

/** 画面上部の「詳細検索」から開く、デッキ詳細検索のモーダル */
export class DeckSearchModal {
  readonly モーダル: Locator;
  readonly フォーム: Locator;
  constructor(readonly page: Page) {
    this.モーダル = page.locator('[data-modal="deck-search"]');
    this.フォーム = page.locator("form#search_block");
  }

  /** 画面上部（PC版のナビゲーション）の「詳細検索」を押して、モーダルを開く */
  async 開く(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await this.page.locator('[data-modal-open="deck-search"]:visible').first().click();
    await expect(this.モーダル, "デッキ詳細検索のモーダルが開く").toHaveClass(/is-visible/, { timeout: 15_000 });
    await this.page.waitForTimeout(400); // 開く動き（0.3秒）が終わるのを待つ
  }

  /** モーダルの閉じるボタンを押す */
  async 閉じる(): Promise<void> {
    await this.page.locator('[data-modal-close="deck-search"]').first().click();
    await expect(this.モーダル, "デッキ詳細検索のモーダルが閉じる").not.toHaveClass(/is-visible/, { timeout: 15_000 });
    await this.page.waitForTimeout(400);
  }

  フォーマットの選択肢のラベル(名: string): Locator {
    return this.フォーム.locator(".deckSearch-top__table__td--formats label.deckSearch-top__checkbox").filter({ hasText: new RegExp(`^\\s*${正規(名)}\\s*$`) });
  }
  /** フォーマットの選択肢の表示名（上から順） */
  async フォーマットの選択肢(): Promise<string[]> {
    return 文(this.フォーム.locator(".deckSearch-top__table__td--formats label.deckSearch-top__checkbox span"));
  }
  async フォーマットを選ぶ(名: string): Promise<void> {
    const l = this.フォーマットの選択肢のラベル(名);
    await expect(l, `フォーマットの選択肢「${名}」`).toHaveCount(1);
    await l.scrollIntoViewIfNeeded();
    await l.click();
    await expect(l.locator("input"), `フォーマット「${名}」が選ばれる`).toBeChecked();
  }

  タグのラベル(名: string): Locator {
    return this.フォーム.locator(`.deckSearch-top__table__td--Tags label.deckSearch-top__checkbox[data-name-jp="${名}"]`);
  }
  async タグを選ぶ(名: string): Promise<void> {
    const l = this.タグのラベル(名);
    await expect(l, `タグの選択肢「${名}」`).toHaveCount(1);
    await l.scrollIntoViewIfNeeded();
    await l.click();
    await expect(l.locator("input"), `タグ「${名}」が選ばれる`).toBeChecked();
  }

  欄(name: string): Locator { return this.フォーム.locator(`input[name="${name}"]`); }
  async 入れる(name: "dateFrom" | "dateTo" | "capacityFrom" | "capacityTo" | "card" | "player" | "eventName", 値: string): Promise<void> {
    const f = this.欄(name);
    await f.scrollIntoViewIfNeeded();
    await f.fill(値);
    await f.press("Tab").catch(() => undefined); // 日付の欄は、入れたあとに日付の選択が開くので閉じる
    await expect(f, `入力欄（${name}）の値`).toHaveValue(値);
  }

  /** 成績・公開/非公開の選択（表示名で選ぶ） */
  async 選ぶ(表示名: string): Promise<void> {
    const l = this.フォーム.locator(".deckSearch-top__table__td--detail label.deckSearch-top__checkbox").filter({ hasText: new RegExp(`^\\s*${正規(表示名)}\\s*$`) });
    await expect(l, `選択肢「${表示名}」`).toHaveCount(1);
    await l.scrollIntoViewIfNeeded();
    await l.click();
  }

  get 検索ボタン(): Locator { return this.フォーム.locator('input[type="submit"].deckSearch-top__button-search'); }
  get クリアボタン(): Locator { return this.フォーム.locator('input[type="button"].clearForm'); }

  /** 「検索」を押し、デッキ検索結果へ移るのを待つ */
  async 検索する(): Promise<void> {
    await expect(this.検索ボタン, "「検索」ボタン").toHaveCount(1);
    await expect(this.検索ボタン, "「検索」ボタンの表示").toHaveValue("検索");
    await this.検索ボタン.scrollIntoViewIfNeeded();
    await Promise.all([this.page.waitForURL(/\/deck\/result\//, { waitUntil: "load", timeout: 60_000 }), this.検索ボタン.click()]);
  }

  async クリアする(): Promise<void> {
    await expect(this.クリアボタン, "「クリア」ボタンの表示").toHaveValue("クリア");
    await this.クリアボタン.scrollIntoViewIfNeeded();
    await this.クリアボタン.click();
  }

  /** 検索条件の入力欄の状態（クリアのあとの確かめ） */
  async 入力欄の状態(): Promise<{ 選ばれたフォーマット: number; アーキタイプ: string; 選ばれたアーキタイプの表示: string; 開催日開始: string; 開催日終了: string; 参加人数下限: string; 参加人数上限: string; 選ばれたタグ: number; カード名: string; プレイヤー名: string; 大会名: string }> {
    const v = (n: string) => this.欄(n).inputValue();
    return {
      選ばれたフォーマット: await this.フォーム.locator('input[name^="formats["]:checked').count(),
      アーキタイプ: await this.フォーム.locator("#archetypeIds").inputValue(),
      選ばれたアーキタイプの表示: ((await this.フォーム.locator(".js-archetype-text").textContent()) ?? "").trim(),
      開催日開始: await v("dateFrom"), 開催日終了: await v("dateTo"),
      参加人数下限: await v("capacityFrom"), 参加人数上限: await v("capacityTo"),
      選ばれたタグ: await this.フォーム.locator('input[name="tagId[]"]:checked').count(),
      カード名: await v("card"), プレイヤー名: await v("player"), 大会名: await v("eventName"),
    };
  }

  // ---- カード名の入力補助 ----
  get カード名の入力補助(): Locator { return this.フォーム.locator("ul.cardNameList"); }
  async カード名を打つ(値: string): Promise<void> {
    const f = this.欄("card");
    await f.scrollIntoViewIfNeeded();
    await f.click();
    await f.pressSequentially(値, { delay: 30 });
  }

  // ---- アーキタイプの選択画面（カラーボックス） ----

  get 選択画面(): Locator { return this.page.locator("#cboxLoadedContent #deckSearchTopArchetypeDetailContainer"); }

  /** 「アーキタイプ」（選択画面の入口）を押して、選択画面を開く */
  async 選択画面を開く(): Promise<void> {
    const b = this.フォーム.locator("a.js-archetype-button");
    await b.scrollIntoViewIfNeeded();
    await b.click();
    await expect(this.選択画面, "アーキタイプの選択画面が開く").toBeVisible({ timeout: 15_000 });
  }

  /** 選択画面のフォーマットのタブ（表示名で押す） */
  async タブを押す(フォーマット名: string): Promise<void> {
    const tab = this.選択画面.locator("label.tab-item").filter({ hasText: new RegExp(`^\\s*${正規(フォーマット名)}\\s*$`) });
    await expect(tab, `選択画面のフォーマットのタブ「${フォーマット名}」`).toHaveCount(1);
    await tab.click();
  }

  /** 選択画面で、フォーマットのタブが選ばれているか。タブはフォーマットコード（f09_01_setup の フォーマットコード()）で区別される */
  async タブが選ばれている(フォーマット名: string): Promise<boolean> {
    const tab = this.選択画面.locator(`input.tab-checkbox[id="${フォーマットコード(フォーマット名)}"]`);
    return (await tab.count()) === 1 && (await tab.isChecked());
  }

  候補のラベル(アーキタイプ名: string): Locator {
    return this.選択画面.locator("label.deckSearch-top__archetypedetail__areacheckbox").filter({ hasText: new RegExp(`^\\s*${正規(アーキタイプ名)}\\s*$`) });
  }

  /** 候補のアーキタイプを選ぶ。見えていなければ、そのアーキタイプのフォーマットのタブを押してから選ぶ。タブを押したかを返す */
  async 候補を選ぶ(アーキタイプ名: string, フォーマット名: string): Promise<boolean> {
    const l = this.候補のラベル(アーキタイプ名);
    await expect(l, `選択画面の候補「${アーキタイプ名}」`).toHaveCount(1);
    let tab = false;
    if (!(await l.isVisible())) { await this.タブを押す(フォーマット名); tab = true; }
    await l.scrollIntoViewIfNeeded();
    await l.click();
    await expect(l.locator("input"), `候補「${アーキタイプ名}」が選ばれる`).toBeChecked();
    return tab;
  }

  /** 選択画面の「選択」を押す */
  async 選択を押す(): Promise<void> {
    const b = this.選択画面.locator("#choose-archetype");
    await expect(b, "選択画面の「選択」ボタンの表示").toHaveValue("選択");
    await b.click();
    await expect(this.選択画面, "「選択」で選択画面が閉じる").toBeHidden({ timeout: 15_000 });
  }

  /** 選択画面の「フォーマット」の選択肢を押す */
  async 選択画面のフォーマットを選ぶ(フォーマット名: string): Promise<void> {
    const l = this.選択画面.locator(".deckSearch-top-archetypeDetail__fmCheck:not(.deckSearch-top-archetypeDetail__fmCheck--color) label.deckSearch-top__checkbox").filter({ hasText: new RegExp(`^\\s*${正規(フォーマット名)}\\s*$`) });
    await expect(l, `選択画面のフォーマットの選択肢「${フォーマット名}」`).toHaveCount(1);
    await l.click();
    await expect(l.locator("input"), `選択画面のフォーマット「${フォーマット名}」が選ばれる`).toBeChecked();
  }

  /** 選択画面の「色」の選択肢を押す */
  async 色を選ぶ(色: string): Promise<void> {
    const l = this.選択画面.locator(".deckSearch-top-archetypeDetail__fmCheck--color label.deckSearch-top__checkbox").filter({ hasText: new RegExp(`^\\s*${正規(色)}\\s*$`) });
    await expect(l, `選択画面の色の選択肢「${色}」`).toHaveCount(1);
    await l.click();
    await expect(l.locator("input"), `色「${色}」が選ばれる`).toBeChecked();
  }

  /** 選択画面でいま見えている候補のアーキタイプ名 */
  async 見えている候補(): Promise<string[]> {
    return 文(this.選択画面.locator(".deckSearch-top__archetypedetail__area__container-imgbg:visible .deckSearch-top__archetypedetail__area__archetype-name"));
  }

  /** 選択画面のアーキタイプ名の入力欄（「アーキタイプ名を入力してください。」）に打つ */
  async アーキタイプ名を打つ(値: string): Promise<void> {
    const f = this.選択画面.locator('input#deckSearch-top[placeholder="アーキタイプ名を入力してください。"]');
    await expect(f, "選択画面のアーキタイプ名の入力欄").toHaveCount(1);
    await f.click();
    await f.pressSequentially(値, { delay: 30 });
  }

  /** アーキタイプ名の入力補助（入力欄の候補の一覧）に出ている名前 */
  async アーキタイプ名の入力補助(): Promise<string[]> {
    return this.page.locator("datalist#suggestName option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
  }

  /** 検索条件の、選んだアーキタイプの値（識別子をカンマで連ねたもの）を持つ隠し項目 */
  get 選んだアーキタイプ(): Locator { return this.フォーム.locator("#archetypeIds"); }

  /** 検索条件の、アーキタイプの「リセット」 */
  get リセット(): Locator { return this.フォーム.locator(".js-archetypeContentDesc-button__text--delete"); }
}

/** デッキ検索結果（遷移を確かめる読み取りだけ） */
export class DeckResultView {
  constructor(readonly page: Page) {}
  async 読み込みを待つ(): Promise<void> {
    await expect(this.page.locator(".deckSearch-searchResult__item").first(), "デッキ検索結果の一覧の表示").toBeAttached({ timeout: 30_000 });
  }
  /** 一覧に並ぶデッキのプレイヤー名（いま表示しているページ） */
  async プレイヤー名(): Promise<string[]> {
    await this.読み込みを待つ();
    return 文(this.page.locator(".deckSearch-searchResult__item__playerName__td"));
  }
  /**
   * 検索結果の全ページ（100件ずつ）に並ぶプレイヤー名と、結果の総件数。いまの検索条件のまま、表示件数とページだけを変えて読む。
   * 共有のデータ（ほかのデッキ）を消さずに、実行の印つきのデッキの有無だけを確かめるために使う。
   */
  async 全ページのプレイヤー名(): Promise<{ 名前: string[]; 件数: number; ページ数: number }> {
    await this.読み込みを待つ();
    const 件数 = Number((((await this.page.locator(".eventSearchResult__count__text span").first().textContent()) ?? "").replace(/[^\d]/g, "")) || "0");
    const ページ数 = Math.max(1, Math.ceil(件数 / 100));
    const base = new URL(this.page.url());
    const 名前: string[] = [];
    for (let p = 1; p <= ページ数; p++) {
      const u = new URL(base);
      u.searchParams.set("page", String(p));
      u.searchParams.set("pageSize", "100");
      await this.page.goto(u.toString(), { waitUntil: "load", timeout: 60_000 });
      名前.push(...(await this.プレイヤー名()));
    }
    return { 名前, 件数, ページ数 };
  }
  get 該当なしの案内(): Locator { return this.page.locator(".deckSearch-searchResult__item--empty"); }
  get 一覧の項目(): Locator { return this.page.locator(".deckSearch-searchResult__item:not(.deckSearch-searchResult__item--empty)"); }
}

/** メタゲーム一覧（遷移を確かめる読み取りだけ） */
export class MetagameView {
  constructor(readonly page: Page) {}
  async 見出し(): Promise<string> {
    return ((await this.page.locator("h1.c-hareruya-heading--lev1").first().textContent()) ?? "").replace(/\s+/g, " ").trim();
  }
  async アーキタイプ名(): Promise<string[]> {
    await expect(this.page.locator("h1.c-hareruya-heading--lev1").first(), "メタゲーム一覧の見出し").toBeVisible({ timeout: 30_000 });
    return 文(this.page.locator(".deckSearch-metaList__list__item__name"));
  }
}
