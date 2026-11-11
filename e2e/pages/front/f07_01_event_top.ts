/** F07-01 イベント大会TOP（フロント。アドレスは /ja/events）の操作と読み取り */
import { Locator, Page, expect } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export type 開いた結果 = { status: number; headers: Record<string, string> };

export class EventTopPage {
  constructor(readonly page: Page) {}

  /** イベント大会TOPを開く（店舗指定のクエリは、書いたときだけ付ける）。応答の状態とヘッダを返す */
  async open(店舗ID?: string, 追加クエリ = ""): Promise<開いた結果> {
    const q = [店舗ID ? `shop=${店舗ID}` : "", 追加クエリ].filter(Boolean).join("&");
    const res = await this.page.goto(`${BASE_URL}/ja/events/${q ? `?${q}` : ""}`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return { status: res?.status() ?? 0, headers: res ? await res.allHeaders() : {} };
  }

  /**
   * 複数日程イベントの日別画面を開く。設計書にアドレスの定めが無く、アプリにも該当の画面が見つからない。
   * 過去の検討で使った形 /ja/events/<イベント識別子>/<日付指定> を開く（日付指定は Ymd または all）。応答の状態と開いた先のアドレスを返す。
   */
  async 日別画面を開く(イベントID: string, 日付指定: string): Promise<{ status: number; url: string }> {
    const res = await this.page.goto(`${BASE_URL}/ja/events/${イベントID}/${日付指定}`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return { status: res?.status() ?? 0, url: this.page.url() };
  }

  /** 詳細検索ボタン（見えているもの）を押し、モーダルが開くまで待つ */
  async 詳細検索を押す(): Promise<void> {
    await this.page.locator('[data-modal-open="event-search"]:visible').first().click({ timeout: 20_000 });
    await expect(this.詳細検索モーダル, "詳細検索モーダル").toHaveClass(/is-visible/, { timeout: 20_000 });
  }
  get 詳細検索モーダル(): Locator { return this.page.locator('[data-modal="event-search"]'); }

  /** 定番イベントの行にある、特別イベントのアイコンと無料イベントのアイコン */
  特別イベントのアイコン(行: Locator): Locator { return 行.locator(".p-hareruya-event-card__tag[data-event-scale-id]"); }
  無料イベントのアイコン(行: Locator): Locator { return 行.locator("[data-free-tag]"); }

  /** イベント一覧の描画（アプリの画面スクリプトが一覧を取得して組み立てる）を待つ */
  async 一覧の表示を待つ(): Promise<void> {
    await expect(this.page.locator("[data-event-list-root] > *").first(), "イベント一覧の描画").toBeAttached({ timeout: 45_000 });
  }

  get 店舗選択(): Locator { return this.page.locator("select[data-store-select]"); }
  async 選ばれた店舗ID(): Promise<string> { return this.店舗選択.inputValue(); }
  async 選ばれた店舗名(): Promise<string> { return ((await this.店舗選択.locator("option:checked").textContent()) ?? "").trim(); }
  async 店舗を選ぶ(店名: string): Promise<void> { await this.店舗選択.selectOption({ label: 店名 }, { timeout: 20_000 }); }
  get 店舗ページリンク(): Locator { return this.page.locator("a.p-hareruya-event-top__store-btn"); }

  タブ(名: "list" | "daily" | "monthly"): Locator { return this.page.locator(`[data-tab-target="${名}"]`); }
  async タブを開く(名: "list" | "daily" | "monthly"): Promise<void> {
    await this.タブ(名).click({ timeout: 20_000 });
    await expect(this.page.locator(`[data-tab-id="${名}"]`), `「${名}」の内容`).toHaveClass(/is-active/, { timeout: 20_000 });
  }

  /** 一覧タブ（定番イベント）に出ているイベント名 */
  async 定番イベントの名前(): Promise<string[]> {
    return (await this.page.locator('[data-event-list-root] [data-event-scale="regular"] [data-event-item] [data-event-name]').allInnerTexts()).map((t) => t.trim());
  }
  定番イベントの行(イベント名: string): Locator {
    return this.page.locator('[data-event-list-root] [data-event-scale="regular"] [data-event-item]').filter({ has: this.page.locator("[data-event-name]", { hasText: new RegExp(`^${イベント名}$`) }) });
  }

  /** 月別カレンダーの日（YYYY-MM-DD）のボタン */
  カレンダーの日(日付: string): Locator { return this.page.locator(`[data-monthly-calendar-grid] [data-date="${日付}"]`); }
  /** カレンダーの表示月に日付が無いとき、翌月へ移る（月末をまたぐ実行日のため） */
  async カレンダーを含む月へ移る(日付: string): Promise<void> {
    if ((await this.カレンダーの日(日付).count()) === 0) await this.page.locator("[data-monthly-calendar-nav='next']").click({ timeout: 20_000 });
  }
  /** その日に「イベントあり」と表示されているか（イベントの無い日は閉じた表示で押せない） */
  async イベントあり(日付: string): Promise<boolean> {
    const d = this.カレンダーの日(日付);
    await expect(d, `カレンダーの${日付}`).toBeAttached({ timeout: 20_000 });
    return !(await d.evaluate((e) => e.classList.contains("is-closed") || (e as HTMLButtonElement).disabled));
  }
}

/** イベント店舗クッキー（名前 shop）を、ブラウザの Cookie として設定する */
export async function 店舗クッキーを設定する(page: Page, 店舗ID: string): Promise<void> {
  await page.context().addCookies([{ name: "shop", value: 店舗ID, url: BASE_URL }]);
}
/** イベント店舗クッキーの値（無ければ null） */
export async function 店舗クッキーの値(page: Page): Promise<string | null> {
  return (await page.context().cookies(BASE_URL)).find((c) => c.name === "shop")?.value ?? null;
}
