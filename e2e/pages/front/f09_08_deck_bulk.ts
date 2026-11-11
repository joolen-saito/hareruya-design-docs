/**
 * 公開側のデッキ一括購入（F09-08）。セレクタはここだけに置く。
 *
 * 画面の作り（アプリの実ソース Deck/bulk.twig・Block/js/deck_bulk_js.twig・翻訳ファイルで確かめたもの）:
 * - 画面は /ja/deck/bulk/（デッキIDを付けるときは /ja/deck/bulk/<デッキID>）。カードリスト欄は「card_list」の複数行の入力欄。
 * - 購入条件は4つの選択欄（言語・状態・通常/Foil・優先条件）。優先条件の「日本語優先」「英語優先」は言語で「日・英のみ」
 *   「指定しない（他言語を含む）」を選んだとき、「通常カード優先」「Foilカード優先」は通常/Foilで「指定しない」を選んだときに、
 *   画面のスクリプトが足す。
 * - 「カートに追加」を押すと、画面のスクリプトがカードリストの確認の要求（/deck/bulk_check）を送り、応答の処理結果が成功なら
 *   商品規格と数量の組を買い物かごへの追加の要求（/cart/add_bulk）で送って買い物かご画面へ移る。失敗なら誤りの一覧を
 *   画面の誤りの欄（#error_field）に並べる。
 * - 開発者ツールのネットワーク表示の代わりに、カードリストの確認の応答（状態と本文）と、買い物かごへの追加の要求の内容を
 *   記録する（応答は画面へそのまま渡す。中身は変えない）。
 */
import { expect, Locator, Page, Response } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export type 確認の応答 = { 状態: number; 本文: { success?: boolean; cart?: { product_class_id: number | string; quantity: number | string }[]; errors?: string[] } | null; 生: string };

export class DeckBulkPage {
  readonly 確認の応答: 確認の応答[] = [];
  readonly 確認の要求: string[] = [];
  readonly 追加の要求: string[] = [];
  private 記録中 = false;

  constructor(readonly page: Page) {}

  get カードリスト欄(): Locator { return this.page.locator('textarea[name="card_list"]'); }
  get 言語(): Locator { return this.page.locator("#js-deck-buy-all-filter-language"); }
  get 状態(): Locator { return this.page.locator("#deck-buy-all-filter-condition"); }
  get 通常Foil(): Locator { return this.page.locator("#js-deck-buy-all-filter-foil"); }
  get 優先条件(): Locator { return this.page.locator("#js-deck-buy-all-filter-preference"); }
  get カートに追加ボタン(): Locator { return this.page.locator("#submit_filter_form input[type=submit]"); }
  get 誤りの欄(): Locator { return this.page.locator("#error_field ul li"); }

  /** 日本語表示のデッキ一括購入画面を開く（デッキIDを省くと識別子なし）。画面のスクリプトの読み込みまで待つ */
  async 開く(デッキID?: string): Promise<Response | null> {
    const path = デッキID === undefined ? "/ja/deck/bulk" : `/ja/deck/bulk/${デッキID}`;
    const res = await this.page.goto(`${BASE_URL}${path}`, { waitUntil: "load", timeout: 60_000 });
    await expect(this.カードリスト欄, "デッキ一括購入画面のカードリスト欄").toBeVisible();
    return res;
  }

  /** いま開いている画面がデッキ一括購入画面か（アドレスとカードリスト欄で見る） */
  async デッキ一括購入画面である(): Promise<boolean> {
    return /\/deck\/bulk(\/\d+)?\/?$/.test(new URL(this.page.url()).pathname) && (await this.カードリスト欄.count()) === 1;
  }

  async カードリスト(): Promise<string> { return this.カードリスト欄.inputValue(); }
  async カードリストを入れる(文: string): Promise<void> { await this.カードリスト欄.fill(文); }

  /** 選択欄で選ばれている選択肢の表示名 */
  async 選択中(sel: Locator): Promise<string> { return ((await sel.locator("option:checked").first().textContent()) ?? "").trim(); }
  /** 選択欄の選択肢の表示名（上から順） */
  async 選択肢(sel: Locator): Promise<string[]> { return (await sel.locator("option").allTextContents()).map((t) => t.trim()); }
  /** 表示名で選ぶ（画面のスクリプトが優先条件の選択肢を足し引きする） */
  async 選ぶ(sel: Locator, 表示名: string): Promise<void> {
    const have = await this.選択肢(sel);
    if (!have.includes(表示名)) throw new Error(`選択肢「${表示名}」が無い（${have.join("、")}）`);
    await sel.selectOption({ label: 表示名 });
  }

  /** 開発者ツールの代わりに、選択欄のいま選ばれている選択肢の値を 値 に書き換え、その選択肢を選ぶ。書き換えた選択肢の表示名を返す */
  async 選択肢の値を書き換えて選ぶ(sel: Locator, 値: string): Promise<string> {
    return sel.evaluate((n, v) => {
      const s = n as HTMLSelectElement;
      const o = s.options[s.selectedIndex];
      o.value = v;
      s.value = v;
      s.dispatchEvent(new Event("change", { bubbles: true }));
      return (o.textContent ?? "").trim();
    }, 値);
  }
  async 送られる値(sel: Locator): Promise<string> { return sel.inputValue(); }

  /** 開発者ツールのネットワーク表示を開いた状態の代わり。カードリストの確認の要求と応答、買い物かごへの追加の要求の記録を始める */
  async ネットワークの記録を始める(): Promise<void> {
    if (this.記録中) return;
    this.記録中 = true;
    this.page.on("request", (r) => {
      const u = r.url();
      if (u.includes("/deck/bulk_check")) this.確認の要求.push(r.postData() ?? "");
      if (u.includes("/cart/add_bulk")) this.追加の要求.push(r.postData() ?? "");
    });
    await this.page.route(/\/deck\/bulk_check/, async (route) => {
      const res = await route.fetch();
      const 生 = await res.text();
      let 本文: 確認の応答["本文"] = null;
      try { 本文 = JSON.parse(生); } catch { 本文 = null; }
      this.確認の応答.push({ 状態: res.status(), 本文, 生 });
      await route.fulfill({ response: res, body: 生 });
    });
  }

  /**
   * 「カートに追加」を押し、カードリストの確認の応答が返るまで待つ。処理結果が成功なら、買い物かご画面へ移るか誤りが並ぶまで待ち、
   * 失敗なら誤りの一覧が並ぶまで待つ。押したあとの確認の要求の数を返す。
   */
  async カートに追加を押す(): Promise<number> {
    const before = this.確認の応答.length;
    await this.カートに追加ボタン.click();
    await expect.poll(() => this.確認の応答.length, { message: "カードリストの確認の応答", timeout: 120_000 }).toBeGreaterThan(before);
    const r = this.確認の応答[this.確認の応答.length - 1];
    if (r.本文?.success) {
      await Promise.race([
        this.page.waitForURL((u) => /\/cart\/?$/.test(u.pathname), { timeout: 120_000 }),
        this.誤りの欄.first().waitFor({ state: "attached", timeout: 120_000 }),
      ]).catch(() => undefined);
    } else {
      await this.誤りの欄.first().waitFor({ state: "attached", timeout: 30_000 }).catch(() => undefined);
    }
    await this.page.waitForLoadState("load");
    return this.確認の要求.length;
  }

  /** 何も変えずにもう一度「カートに追加」を押す。要求が送られるなら、その応答が返るまで（送られないなら10秒）待つ */
  async もう一度カートに追加を押す(): Promise<void> {
    const before = this.確認の応答.length;
    const sent = this.page.waitForRequest((r) => r.url().includes("/deck/bulk_check"), { timeout: 10_000 }).then(() => true).catch(() => false);
    await this.カートに追加ボタン.click();
    if (await sent) await expect.poll(() => this.確認の応答.length, { message: "カードリストの確認の応答", timeout: 120_000 }).toBeGreaterThan(before);
    await this.page.waitForTimeout(1_000);
  }

  /** 画面の誤りの欄に並んだ文（上から順） */
  async 誤りの一覧(): Promise<string[]> {
    return (await this.誤りの欄.allTextContents()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }

  /** 画面に見えている文（誤りの欄の外も含む。知らせの表示を探すとき） */
  async 見えている文(): Promise<string> {
    return ((await this.page.locator("#main").first().innerText().catch(() => "")) ?? "").replace(/\s+/g, " ");
  }

  /** いまの画面が買い物かご画面か */
  買い物かご画面である(): boolean { return /\/cart\/?$/.test(new URL(this.page.url()).pathname); }
}

/** 応答の商品規格と数量の組を「規格ID:数量」の文字列にそろえる */
export function 組の一覧(r: 確認の応答 | undefined): string[] {
  return (r?.本文?.cart ?? []).map((c) => `${c.product_class_id}:${c.quantity}`);
}

/** 買い物かごへの追加の要求の内容（フォームの送り方）から、商品規格と数量の組を「規格ID:数量」の文字列で読む */
export function 追加の要求の組(本文: string): string[] {
  const p = new URLSearchParams(本文);
  const rows = new Map<string, { id?: string; q?: string }>();
  for (const [k, v] of p.entries()) {
    const m = /^cart_list\[(\d+)\]\[(product_class_id|quantity)\]$/.exec(k);
    if (!m) continue;
    const r = rows.get(m[1]) ?? {};
    if (m[2] === "product_class_id") r.id = v; else r.q = v;
    rows.set(m[1], r);
  }
  return [...rows.entries()].sort((a, b) => Number(a[0]) - Number(b[0])).map(([, r]) => `${r.id}:${r.q}`);
}
