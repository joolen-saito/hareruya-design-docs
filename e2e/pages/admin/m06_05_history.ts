/**
 * 買取商品履歴(検索入力・検索結果)（メニュー「店頭買取管理」→「買取商品履歴」）。
 *
 * 画面の作り（アプリのテンプレート・コントローラーで確かめた）:
 * - メニューから開く（ページ指定なし）と、保持していた検索条件を捨てて空の検索入力を出す。検索すると結果が出る。
 * - /otcbuyorder/history/page/<n> は、セッションが保持した検索条件で n ページ目を出す（表示件数は ?page_count= で指定）。
 * - CSVダウンロードのボタンは、検索結果が1件以上あるときだけ出る。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

const OPEN = 30_000;

export class HistoryPage {
  constructor(readonly page: Page) {}

  readonly 結果の欄 = () => this.page.locator("#result_list_main");
  readonly 結果の表の行 = () => this.page.locator("#result_list_main table tbody tr");
  readonly ページング = () => this.page.locator("#result_list ul.pagination");
  readonly 表示件数の選択 = () => this.page.locator("#page_count_pulldown");
  readonly 上部のエラー = () => this.page.locator(".alert-danger");
  readonly 買取店舗の選択 = () => this.page.locator("#search_box__shop select");

  /** 買取商品履歴(検索入力)画面を開く（メニューから開いたとき） */
  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/otcbuyorder/history"), { timeout: 60_000 });
    expect(res?.status() ?? 0, "買取商品履歴(検索入力)画面の応答").toBeLessThan(400);
    await this.page.waitForLoadState("load");
    await expect(this.page.locator("form#search_form"), "買取商品履歴(検索入力)画面の検索欄").toBeVisible({ timeout: OPEN });
  }

  /** 買取店舗の選択肢（表示名。「選択してください」などの未選択の選択肢は除く） */
  async 買取店舗の選択肢(): Promise<string[]> {
    return (await this.買取店舗の選択().locator("option").evaluateAll((os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, t: (o.textContent ?? "").trim() }))
      .filter((o) => o.v !== "").map((o) => o.t)));
  }

  /** 買取店舗の選択中の表示名。未選択なら "" */
  async 買取店舗の選択中(): Promise<string> {
    return this.買取店舗の選択().evaluate((n) => {
      const s = n as HTMLSelectElement;
      const o = s.selectedOptions[0];
      return !o || o.value === "" ? "" : (o.textContent ?? "").trim();
    });
  }

  async 商品コードを入れる(コード: string): Promise<void> {
    await this.page.locator("#search_box__product_code input").fill(コード, { timeout: OPEN });
  }

  async 検索する(): Promise<void> {
    await Promise.all([
      this.page.waitForLoadState("load"),
      this.page.locator("#search_form").getByRole("button", { name: /検索する/ }).click({ timeout: OPEN }),
    ]);
    await this.page.waitForLoadState("load");
    await expect(this.結果の欄(), "検索結果の欄").toBeVisible({ timeout: 60_000 });
  }

  /** 結果ページをアドレス欄から開く（保持済みの検索条件で n ページ目）。表示件数を指定するときは page_count */
  async ページを開く(ページ: number, 表示件数?: number): Promise<number> {
    const q = 表示件数 === undefined ? "" : `?page_count=${表示件数}`;
    const res = await this.page.goto(adminUrl(`/otcbuyorder/history/page/${ページ}${q}`), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }

  /** 結果の欄の文 */
  async 結果の欄の文(): Promise<string> {
    return (await this.結果の欄().innerText({ timeout: OPEN })).replace(/\s+/g, " ").trim();
  }

  readonly CSVダウンロードのボタン = () => this.page.getByRole("button", { name: "CSVダウンロード" });

  /** CSVダウンロードの項目を選ぶ（ボタンが無ければ、短い待ちで落ちる） */
  async CSVダウンロードで選ぶ(項目: "選択した商品履歴取得" | "検索結果全件取得"): Promise<void> {
    await this.CSVダウンロードのボタン().click({ timeout: 10_000 });
    await this.page.locator("#result_list__custom_csv_menu .dropdown-menu button.export-link", { hasText: 項目 }).click({ timeout: 10_000 });
    await this.page.waitForLoadState("load");
  }
}
