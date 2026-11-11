/**
 * 買取商品履歴(検索入力・検索結果)（メニュー「店頭買取管理」→「買取商品履歴」）。
 *
 * 画面の作り（アプリのテンプレート・コントローラーで確かめた）:
 * - メニューから開く（ページ指定なし）と、保持していた検索条件を捨てて空の検索入力を出す。検索すると結果が出る。
 * - /otcbuyorder/history/page/<n> は、セッションが保持した検索条件で n ページ目を出す（表示件数は ?page_count= で指定）。
 * - CSVダウンロードのボタンは、検索結果が1件以上あるときだけ出る。
 */
import { Download, expect, Page } from "@playwright/test";
import { csvRecords, decodeCsvBytes } from "../../lib/csv";
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

  // ---------------------------------------------------------------- 検索条件の入力

  private box(id: string) {
    return this.page.locator(`#search_box__${id}`);
  }

  async 査定IDを入れる(査定ID: string): Promise<void> {
    await this.box("assessment_id").locator("input").fill(査定ID, { timeout: OPEN });
  }

  async 会員IDを入れる(会員ID: string): Promise<void> {
    await this.box("customer_id").locator("input").fill(会員ID, { timeout: OPEN });
  }

  async 商品名を入れる(商品名: string): Promise<void> {
    await this.box("product_name").locator("input").fill(商品名, { timeout: OPEN });
  }

  async 基準価格を入れる(from: string, to: string): Promise<void> {
    await this.box("standard_price_form").locator('input[name$="[standard_price_from]"]').fill(from, { timeout: OPEN });
    await this.box("standard_price_form").locator('input[name$="[standard_price_to]"]').fill(to, { timeout: OPEN });
  }

  async 買取価格を入れる(from: string, to: string): Promise<void> {
    await this.box("buy_price_form").locator('input[name$="[buy_price_from]"]').fill(from, { timeout: OPEN });
    await this.box("buy_price_form").locator('input[name$="[buy_price_to]"]').fill(to, { timeout: OPEN });
  }

  /** 買取日時(From・To)を入れる。値は「YYYY-MM-DD HH:mm」。入力欄が日時入力（datetime-local）のときは、その形に直して入れる */
  async 買取日時を入れる(from: string, to: string): Promise<void> {
    for (const [name, v] of [["complete_date_from", from], ["complete_date_to", to]] as const) {
      const input = this.box("complete_date_form").locator(`input[name$="[${name}]"]`);
      const type = await input.getAttribute("type", { timeout: OPEN });
      await input.fill(type === "datetime-local" ? v.replace(" ", "T") : v, { timeout: OPEN });
    }
  }

  private 選択肢(boxId: "otc_buy_order_status" | "language" | "condition", 名: string) {
    return this.box(boxId).getByLabel(名, { exact: true });
  }

  async ステータスにチェックを付ける(名前: string[]): Promise<void> {
    for (const n of 名前) await this.選択肢("otc_buy_order_status", n).check({ timeout: OPEN });
  }

  async 言語にチェックを付ける(名前: string[]): Promise<void> {
    for (const n of 名前) await this.選択肢("language", n).check({ timeout: OPEN });
  }

  async 状態にチェックを付ける(名前: string[]): Promise<void> {
    for (const n of 名前) await this.選択肢("condition", n).check({ timeout: OPEN });
  }

  /** ステータスの選択肢の表示名 */
  async ステータスの選択肢(): Promise<string[]> {
    return (await this.box("otc_buy_order_status").locator("label").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }

  // ---------------------------------------------------------------- 検索結果

  /** 検索結果の「該当件数」の数（見出しの文の最初の数） */
  async 該当件数(): Promise<number> {
    const text = (await this.page.locator("#search_form .fw-bold").first().innerText({ timeout: OPEN })).replace(/\s+/g, " ");
    const m = /(\d[\d,]*)/.exec(text);
    if (!m) throw new Error(`該当件数が読めない（${text}）`);
    return Number(m[1].replace(/,/g, ""));
  }

  /** 結果の行（表示順）。値は画面の文のまま（空白は1つに詰める） */
  async 行を読む(): Promise<履歴の行[]> {
    return this.page.locator('#result_list_main table tbody tr[id^="result_list_main__item--"]').evaluateAll((trs) => trs.map((tr) => {
      const id = tr.id.replace("result_list_main__item--", "");
      const cell = (name: string) => (tr.querySelector(`#result_list_main__${name}--${id}`)?.textContent ?? "").replace(/\s+/g, " ").trim();
      return {
        履歴ID: id, 査定番号: cell("assessment_id"), 申込者: cell("applicant"), 商品コード: cell("product_code"), 商品名: cell("product_name"),
        基準価格: cell("standard_price"), 買取価格: cell("buy_price"), 買取店舗: cell("shop"), 作業者: cell("member"), 買取数: cell("buy_quantity"),
        入庫数: cell("stock_quantity"), 増減数: cell("diff_quantity"), 買取日時: cell("complete_date"), 更新日時: cell("update_date"),
      };
    }));
  }

  /** 表示件数の選択で選ばれている表示名（例「10件」） */
  async 表示件数の選択中(): Promise<string> {
    return this.表示件数の選択().evaluate((s) => ((s as HTMLSelectElement).selectedOptions[0]?.textContent ?? "").trim());
  }

  /** 表示件数を選ぶ（選ぶと、その件数で1ページ目が開く） */
  async 表示件数を選ぶ(件数: string): Promise<void> {
    await Promise.all([
      this.page.waitForLoadState("load"),
      this.表示件数の選択().selectOption({ label: 件数 }, { timeout: OPEN }),
    ]);
    await this.page.waitForLoadState("load");
  }

  /** ページングの番号のリンクを押す */
  async ページへ移る(ページ: number): Promise<void> {
    await Promise.all([
      this.page.waitForLoadState("load"),
      this.ページング().getByRole("link", { name: String(ページ), exact: true }).click({ timeout: OPEN }),
    ]);
    await this.page.waitForLoadState("load");
  }

  /** 査定番号の行のCSVダウンロード対象にチェックを付ける */
  async 行にチェックを付ける(履歴ID: string): Promise<void> {
    await this.page.locator(`#result_list_main__item--${履歴ID} input[type="checkbox"]`).check({ timeout: OPEN });
  }

  /**
   * CSVダウンロードの項目を選び、ダウンロードされたCSVを見出しつきの行にして返す。
   * ダウンロードされなかったとき（エラーで画面へ戻るとき）は null（待つのは 待ち ミリ秒まで）。
   */
  async CSVを取る(項目: "選択した商品履歴取得" | "検索結果全件取得", 待ち = 30_000): Promise<Record<string, string>[] | null> {
    await this.CSVダウンロードのボタン().click({ timeout: OPEN });
    const item = this.page.locator("#result_list__custom_csv_menu .dropdown-menu button.export-link", { hasText: 項目 });
    await expect(item, `ダウンロードの項目「${項目}」`).toBeVisible({ timeout: OPEN });
    const download = this.page.waitForEvent("download", { timeout: 待ち }).catch(() => null);
    await item.click({ timeout: OPEN });
    const file = await download;
    if (!file) {
      await this.page.waitForLoadState("load").catch(() => undefined);
      return null;
    }
    return 読む(file);
  }
}

export type 履歴の行 = {
  履歴ID: string; 査定番号: string; 申込者: string; 商品コード: string; 商品名: string; 基準価格: string; 買取価格: string; 買取店舗: string;
  作業者: string; 買取数: string; 入庫数: string; 増減数: string; 買取日時: string; 更新日時: string;
};

async function 読む(file: Download): Promise<Record<string, string>[]> {
  const chunks: Buffer[] = [];
  for await (const c of await file.createReadStream()) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  return csvRecords(decodeCsvBytes(Buffer.concat(chunks)));
}
