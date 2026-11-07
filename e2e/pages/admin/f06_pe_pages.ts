/**
 * F06-16・F06-17 の連携ケース（デッキ登録のあと管理画面で確かめる）の画面操作。セレクタはここだけに書く。
 * - イベント申込一覧（検索入力）: 検索種別「デッキ登録を検索」、デッキ表示（別に開く印刷用の画面）
 * - デッキ一覧（検索入力）・デッキ編集画面の読み取り
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export class 申込一覧 {
  constructor(readonly page: Page) {}
  get 検索イベント名(): Locator { return this.page.locator('#search_form [name$="[event_name]"]'); }
  get 開催日From(): Locator { return this.page.locator('#search_form [name$="[start_date_from]"]'); }
  get 開催日To(): Locator { return this.page.locator('#search_form [name$="[start_date_to]"]'); }
  get デッキ登録検索(): Locator { return this.page.locator('#search_form input[name$="[searchMode]"][value="deck_registration"]'); }
  get 検索ボタン(): Locator { return this.page.locator('#search_form button[type="submit"]').first(); }
  get デッキ表示ボタン(): Locator { return this.page.locator("#decklist"); }
  get 結果の行(): Locator { return this.page.locator("table.table tbody tr"); }
  get 件数の表示(): Locator { return this.page.getByText(/検索結果：\d+件が該当しました|検索条件に合致するデータが見つかりませんでした/).first(); }

  async 開く(): Promise<void> {
    await this.page.goto(adminUrl("/event/entry"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    await expect(this.検索イベント名, "イベント申込一覧(検索入力)の検索欄").toBeVisible({ timeout: 30_000 });
  }
  async 検索種別をデッキ登録にする(): Promise<void> {
    await this.デッキ登録検索.check({ force: true, timeout: 30_000 });
  }
  /** 開催日は空のまま、店舗は既定表示のまま、イベント名を入れて検索する */
  async イベント名で検索する(名: string): Promise<void> {
    await this.検索イベント名.fill(名);
    await this.開催日From.fill("");
    await this.開催日To.fill("");
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), this.検索ボタン.click({ timeout: 30_000 })]);
    await expect(this.件数の表示, "検索結果の表示").toBeVisible({ timeout: 60_000 });
  }
  async 件数(): Promise<number> {
    const t = (await this.件数の表示.innerText().catch(() => "")) ?? "";
    const m = /(\d+)件/.exec(t);
    return m ? Number(m[1]) : 0;
  }
  async 結果の行の文(): Promise<string[]> {
    return (await this.結果の行.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }
  /** 「デッキ表示」を押して、別に開いたデッキ表示の画面を返す */
  async デッキ表示を開く(): Promise<Page> {
    const [popup] = await Promise.all([this.page.context().waitForEvent("page", { timeout: 30_000 }), this.デッキ表示ボタン.click({ timeout: 30_000 })]);
    await popup.waitForLoadState("load");
    return popup;
  }
}

/** デッキ表示画面（印刷用）から読み取る */
export async function デッキ表示の内容(p: Page): Promise<{ ページ数: number; 名前: string; イベント: string; 日付: string; メイン見出し: string; 全文: string; カード行: string[]; 区画見出し: string[] }> {
  const t = async (l: Locator) => ((await l.first().innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
  return {
    ページ数: await p.locator(".wrapper").count(),
    名前: await t(p.locator(".decklist-header__name-value")),
    イベント: await t(p.locator(".decklist-meta__item").nth(0).locator(".decklist-meta__value")),
    日付: await t(p.locator(".decklist-meta__item").nth(1).locator(".decklist-meta__value")),
    メイン見出し: await t(p.locator(".decklist-mainboard__title")),
    全文: ((await p.locator("body").innerText()) ?? "").replace(/\s+/g, " ").trim(),
    カード行: (await p.locator(".decklist-type__row").allInnerTexts()).map((x) => x.replace(/\s+/g, " ").trim()),
    区画見出し: (await p.locator(".decklist-type__title").allInnerTexts()).map((x) => x.replace(/\s+/g, " ").trim()),
  };
}

export class デッキ検索 {
  constructor(readonly page: Page) {}
  get 日付クリア(): Locator { return this.page.locator("#date_clear"); }
  get 開催日From(): Locator { return this.page.locator('[name="admin_search_deck[event_date_from]"]'); }
  get 開催日To(): Locator { return this.page.locator('[name="admin_search_deck[event_date_to]"]'); }
  get イベント名(): Locator { return this.page.locator('[name="admin_search_deck[event_name]"]'); }
  get 検索ボタン(): Locator { return this.page.locator('#admin_search_deck button[type="submit"]'); }
  get 結果の件数表示(): Locator { return this.page.getByText(/検索結果：\d+件が該当しました|検索条件に合致するデータが見つかりませんでした/).first(); }
  /** デッキ情報（行の詳細の枠。押すとデッキ編集画面へ移る）。1行に1つ */
  get デッキ情報のリンク(): Locator { return this.page.locator(".deck-result-table tbody tr a.text-body[href*='/deck/'][href$='/edit']"); }
  async 開く(): Promise<void> {
    await this.page.goto(adminUrl("/deck"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    await expect(this.検索ボタン, "デッキ検索・一覧画面").toBeVisible({ timeout: 30_000 });
  }
  async 検索する(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), this.検索ボタン.click({ timeout: 30_000 })]);
    await expect(this.結果の件数表示, "検索結果の表示").toBeVisible({ timeout: 60_000 });
  }
  async 件数(): Promise<number> {
    const m = /(\d+)件/.exec((await this.結果の件数表示.innerText().catch(() => "")) ?? "");
    return m ? Number(m[1]) : 0;
  }
}

/** デッキ編集画面の読み取り */
export class デッキ編集 {
  constructor(readonly page: Page) {}
  f(n: string): Locator { return this.page.locator(`[name="admin_deck[${n}]"]`); }
  get 更新ボタン(): Locator { return this.page.locator('button[type="submit"][form="admin_deck"]').first(); }
}
