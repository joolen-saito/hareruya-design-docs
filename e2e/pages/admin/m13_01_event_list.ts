/** M13-01 イベント一覧（検索入力・検索結果）の画面操作。セレクタはここだけに書く */
import { Locator, Page, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { EventInput, openEventEdit, registerEvent } from "./event";
import { registerSchedule } from "./schedule";

export class EventListPage {
  constructor(readonly page: Page) {}

  get 名前略称() { return this.page.locator('[name="admin_search_event[multi]"]'); }
  get 開催日From() { return this.page.locator('[name="admin_search_event[start_date_from]"]'); }
  get 開催日To() { return this.page.locator('[name="admin_search_event[start_date_to]"]'); }
  get フォーマット() { return this.page.locator('[name="admin_search_event[formats]"]'); }
  get ルール適用度() { return this.page.locator('[name="admin_search_event[rel]"]'); }
  get 店舗() { return this.page.locator('#admin_search_event_base_info'); }
  get 件数() { return this.page.locator("#page_count_pulldown"); }
  get 並び項目() { return this.page.locator("#sort_by_pulldown"); }
  get ソート順() { return this.page.locator("#sort_order_pulldown"); }
  get 結果の表() { return this.page.locator("table.table tbody tr[id^='ex-event-']"); }

  async 開く(): Promise<void> {
    await this.page.goto(adminUrl("/event"));
    await this.page.waitForLoadState("load");
    await expect(this.名前略称, "イベント一覧(検索入力)のイベント名、略称の欄").toBeVisible();
  }

  /** 日付の欄に「2026/08/10」の形で入れる（欄が日付型ならハイフン区切りに直す） */
  async 日付を入れる(欄: Locator, 値: string): Promise<void> {
    const type = await 欄.getAttribute("type");
    await 欄.fill(type === "date" ? 値.replace(/\//g, "-") : 値);
  }
  async 日付の値(欄: Locator): Promise<string> { return (await 欄.inputValue()).replace(/-/g, "/"); }

  async 店舗を選ぶ(店舗名: string[]): Promise<void> {
    await this.店舗.selectOption(店舗名.map((label) => ({ label })));
    await this.店舗.evaluate((el) => { const j = (window as unknown as { jQuery?: (e: Element) => { trigger: (n: string) => void } }).jQuery; if (j) j(el).trigger("change"); });
  }
  async 選ばれている店舗(): Promise<string[]> {
    return this.店舗.evaluate((el) => [...(el as HTMLSelectElement).selectedOptions].map((o) => (o.textContent ?? "").trim()).filter(Boolean));
  }
  async 選択値の表示(sel: Locator): Promise<string> {
    return (await sel.locator("option:checked").first().innerText().catch(() => "")).trim();
  }

  async クリアを押す(): Promise<void> {
    await this.page.locator("a.search-clear").click();
  }
  /** 「検索」を押し、結果の表示（結果の表か「該当なし」）を待つ */
  async 検索する(): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load" }),
      this.page.locator("#search_form button[type='submit']").click(),
    ]);
  }
  async 名前略称で検索する(語: string): Promise<void> {
    await this.名前略称.fill(語);
    await this.検索する();
  }

  async 結果のID(): Promise<string[]> {
    return (await this.結果の表.locator("td:first-child").allInnerTexts()).map((t) => t.trim());
  }
  async 結果の表が表示されている(): Promise<boolean> { return (await this.結果の表.count()) > 0; }
  /** 検索結果の見出し「検索結果：N件」。出ていなければ null */
  async 該当件数(): Promise<number | null> {
    const m = /検索結果[：:]\s*([\d,]+)\s*件/.exec((await this.page.locator("body").innerText()).replace(/\s+/g, " "));
    return m ? Number(m[1].replace(/,/g, "")) : null;
  }
  行(id: string): Locator { return this.page.locator(`#ex-event-${id}`); }
  async 行の文(id: string): Promise<string> { return (await this.行(id).innerText()).replace(/\s+/g, " ").trim(); }

  async 件数を選ぶ(件: number): Promise<void> {
    if ((await this.選択値の表示(this.件数)) === `${件}件`) return;
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.件数.selectOption({ label: `${件}件` })]);
  }
  async 並びを選ぶ(項目: "イベントID" | "イベント名", 順: "昇順" | "降順"): Promise<void> {
    const v = 項目 === "イベント名" ? "eventName" : "default";
    if ((await this.並び項目.inputValue()) !== v) {
      await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.並び項目.selectOption(v)]);
    }
    const o = 順 === "昇順" ? "a" : "d";
    if ((await this.ソート順.inputValue()) !== o) {
      await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.ソート順.selectOption(o)]);
    }
  }
  async ページを選ぶ(n: number): Promise<void> {
    await this.page.locator(".pagination").getByRole("link", { name: String(n), exact: true }).click({ timeout: 30_000 });
    await this.page.waitForLoadState("load");
  }
  async 現在のページ(): Promise<number> {
    const m = /\/event\/page\/(\d+)/.exec(new URL(this.page.url()).pathname);
    return m ? Number(m[1]) : 1;
  }

  /** 行の操作ボタンを押してメニューを開く */
  async 編集ボタンを押す(id: string): Promise<void> {
    await this.行(id).locator("button.dropdown-menu-toggle").click({ timeout: 30_000 });
  }
  メニュー項目(id: string, 名前: "編集" | "削除"): Locator {
    return this.行(id).locator(".dropdown-menu").getByText(名前, { exact: true });
  }
  async メニューの項目(id: string): Promise<string[]> {
    const items = this.行(id).locator(".dropdown-menu li");
    const out: string[] = [];
    for (const e of await items.all()) if (await e.isVisible()) out.push((await e.innerText()).trim());
    return out;
  }
  /** メニューの「削除」を選び、確認画面（モーダル）の削除ボタン（正本の「OK」）を押す。削除を選べなかったときは false */
  async 削除して確認する(id: string): Promise<{ 選べた: boolean; 確認が出た: boolean }> {
    const del = this.メニュー項目(id, "削除");
    if ((await del.count()) === 0) return { 選べた: false, 確認が出た: false };
    const disabled = await del.evaluate((el) => (el.closest("button") ?? el).hasAttribute("disabled"));
    await del.click({ force: true, timeout: 15_000 });
    const modal = this.page.locator(`#event_delete_${id}`);
    if (disabled || (await modal.count()) === 0) return { 選べた: !disabled, 確認が出た: false };
    await expect(modal, "削除の確認画面").toBeVisible({ timeout: 15_000 });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), modal.locator("a.btn-ec-delete").click()]);
    return { 選べた: true, 確認が出た: true };
  }
}

/** シード用: 日程つきイベント。受付あり・デッキ登録ありは外す */
export const 月次イベント = (名日: string, 名英: string, over: EventInput = {}): EventInput => ({
  イベント名日: 名日, イベント名英: 名英, 店舗: "東京店", フォーマット: ["スタンダード"], ルール適用度: "一般", 公開状態: "公開", 定員: "1", 参加費: "0", ...over,
});

export async function 日程を足す(page: Page, イベントID: string, 開始時間: string): Promise<void> {
  await registerSchedule(page, イベントID, { 開始時間, 受付あり: false, デッキ登録あり: false });
}

/** 検索語を含む今回のイベントのうち、残す番号以外を削除する（日程があれば日程を消してから） */
export async function 余りを削除する(page: Page, 検索語: string, 残す: string[]): Promise<void> {
  const list = new EventListPage(page);
  await list.開く();
  await list.開催日From.fill("");
  await list.名前略称で検索する(検索語);
  if (!(await list.結果の表が表示されている())) return;
  await list.件数を選ぶ(100);
  const ids = (await list.結果のID()).filter((x) => !残す.includes(x));
  for (const id of ids) {
    const form = await openEventEdit(page, id);
    await form.削除ボタン.click();
    const modal = page.locator(`#event_delete_${id}`);
    await expect(modal).toBeVisible();
    await modal.locator("a.btn-ec-delete").click();
    await page.waitForLoadState("domcontentloaded");
  }
}

export { registerEvent };
