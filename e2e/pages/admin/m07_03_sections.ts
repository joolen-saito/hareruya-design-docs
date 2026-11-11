/**
 * M07-03 買取情報編集の「まとめて買取」「個別入力商品情報」「実在庫登録」の読み取りと操作。セレクタはここにだけ書く。
 *
 * 画面の作り（テンプレート admin/Purchase/detail.twig と purchasedetail.js で確かめた）:
 * - まとめて買取: 合計（査定金額合計・査定承諾金額合計）は常に見え、明細は開閉リンクで開く。開くと明細を取りに行って表に並べる。
 *   査定価格・数量は編集不可、売却は査定編集中だけ編集できる。
 * - 個別入力商品情報: 常に表が見える。商品名・査定金額・数量は文字、売却は選択欄。
 *   売却「する」で実在庫が未登録の行にだけ実在庫登録のボタン（画面の文字は「実在庫情報登録」）が出る。登録済みの行は「実在庫登録済み」の文字。
 * - 実在庫登録のボタン → 商品検索モーダル（#registModal） → 結果の行の「決定」で、登録の送信（POST）が走り、買取情報編集に戻る。
 */
import { expect, Locator, Page } from "@playwright/test";

const OPEN = 30_000;
const norm = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const 数のみ = (s: string) => s.replace(/[^\d-]/g, "");

export type まとめての行 = { 商品コード: string; 商品名: string; 査定価格: string; 数量: string; 売却: string };
export type 個別の行 = { 商品名: string; 査定金額: string; 数量: string; 売却: string; 実在庫: "登録済み" | "登録ボタン" | "なし" };

export class M0703SectionsPage {
  constructor(readonly page: Page) {}

  // ---- まとめて買取 ----

  readonly まとめての開閉リンク = () => this.page.locator('a[href="#bulkPurchaseCollapse"]');
  readonly まとめての欄 = () => this.page.locator("#bulkPurchaseCollapse");
  readonly まとめての行群 = () => this.page.locator("#bulk_buy_main_cards_field_list tr");

  async まとめてが開いているか(): Promise<boolean> {
    return this.まとめての欄().evaluate((el) => el.classList.contains("show") && (el as HTMLElement).offsetHeight > 0);
  }

  /** 開閉リンクを押す */
  async まとめての開閉を押す(): Promise<void> {
    await this.まとめての開閉リンク().click({ timeout: OPEN });
    await this.page.waitForTimeout(800);
  }

  /** まとめて買取を開き、明細が並ぶのを待つ（明細が無い買取では待たない） */
  async まとめてを開く(件数: number): Promise<void> {
    if (!(await this.まとめてが開いているか())) await this.まとめての開閉を押す();
    if (件数 > 0) await expect(this.まとめての行群(), "まとめて買取の明細").toHaveCount(件数, { timeout: 30_000 });
  }

  async まとめての合計(): Promise<{ 査定金額合計: string; 査定承諾金額合計: string }> {
    return {
      査定金額合計: 数のみ(await this.page.locator("#edit_bulk_purchase_info_box__total_price").innerText({ timeout: OPEN })),
      査定承諾金額合計: 数のみ(await this.page.locator("#edit_bulk_purchase_info_box__acceptance_total_price").innerText({ timeout: OPEN })),
    };
  }

  async まとめての行(): Promise<まとめての行[]> {
    return this.まとめての行群().evaluateAll((trs) => trs.map((tr) => {
      const t = (k: string) => (tr.querySelector(`[id^="bulk_purchase_list_main__${k}--"]`)?.textContent ?? "").replace(/\s+/g, " ").trim();
      const v = (k: string) => ((tr.querySelector(`[name$="[${k}]"]`) as HTMLInputElement | null)?.value ?? "");
      const sel = tr.querySelector('select[name$="[saleFlg]"]') as HTMLSelectElement | null;
      return { 商品コード: t("product_code"), 商品名: t("product_name"), 査定価格: v("price"), 数量: v("count"), 売却: sel ? (sel.selectedOptions[0]?.textContent ?? "").trim() : "" };
    }));
  }

  まとめての行の場所(商品名: string): Locator {
    return this.まとめての行群().filter({ has: this.page.locator('td[id^="bulk_purchase_list_main__product_name--"]', { hasText: 商品名 }) }).first();
  }
  まとめての入力欄(商品名: string, 欄: "査定価格" | "数量" | "売却"): Locator {
    const name = { 査定価格: "price", 数量: "count", 売却: "saleFlg" }[欄];
    return this.まとめての行の場所(商品名).locator(`[name$="[${name}]"]`);
  }
  /** まとめて買取の明細に、削除・複製のリンクがあるか */
  async まとめてに削除か複製のリンクがあるか(): Promise<boolean> {
    const n = await this.まとめての行群().locator("a").count();
    const t = norm(await this.まとめての行群().allInnerTexts().then((x) => x.join(" ")));
    return n > 0 || /削除|複製/.test(t);
  }

  // ---- 個別入力商品情報 ----

  readonly 個別の行群 = () => this.page.locator('#table_indivisual_input_product_other_info tbody tr[id^="indivisual_input_product__item--"]');

  async 個別の合計(): Promise<{ 査定金額合計: string; 査定承諾金額合計: string }> {
    return {
      査定金額合計: 数のみ(await this.page.locator("#edit_indivisual_input_product_info_box__total_price").innerText({ timeout: OPEN })),
      査定承諾金額合計: 数のみ(await this.page.locator("#edit_indivisual_input_product_info_box__acceptance_total_price").innerText({ timeout: OPEN })),
    };
  }

  async 個別の行(): Promise<個別の行[]> {
    return this.個別の行群().evaluateAll((trs) => trs.map((tr) => {
      const t = (k: string) => (tr.querySelector(`[id^="indivisual_input_product__${k}--"]`)?.textContent ?? "").replace(/\s+/g, " ").trim();
      const sel = tr.querySelector('select[name$="[saleFlg]"]') as HTMLSelectElement | null;
      const cell = tr.querySelector('[id^="indivisual_input_product__stock_regist--"]');
      const 実在庫 = cell?.querySelector("button.item-regist-button") ? "登録ボタン" : /実在庫登録済み/.test(cell?.textContent ?? "") ? "登録済み" : "なし";
      return {
        商品名: t("product_name"), 査定金額: t("price").replace(/[^\d-]/g, ""), 数量: t("quantity"),
        売却: sel ? (sel.selectedOptions[0]?.textContent ?? "").trim() : "", 実在庫: 実在庫 as "登録済み" | "登録ボタン" | "なし",
      };
    }));
  }

  個別の行の場所(商品名: string): Locator {
    return this.個別の行群().filter({ has: this.page.locator('td[id^="indivisual_input_product__product_name--"]', { hasText: 商品名 }) }).first();
  }
  個別の売却欄(商品名: string): Locator { return this.個別の行の場所(商品名).locator('select[name$="[saleFlg]"]'); }
  /** 個別入力商品の行の、商品名・査定金額・数量の欄に入力部品（input・select）があるか */
  async 個別の文字欄に入力部品があるか(商品名: string): Promise<boolean> {
    const row = this.個別の行の場所(商品名);
    const n = await row.locator('td[id^="indivisual_input_product__product_name--"], td[id^="indivisual_input_product__price--"], td[id^="indivisual_input_product__quantity--"]')
      .locator("input, select, textarea").count();
    return n > 0;
  }

  // ---- 実在庫登録 ----

  readonly 実在庫登録のボタン = (商品名: string) => this.個別の行の場所(商品名).locator("button.item-regist-button");
  readonly 登録のモーダル = () => this.page.locator("#registModal");

  /** 個別入力商品の「実在庫登録」ボタンを押し、商品検索モーダルが開くのを待つ */
  async 実在庫登録を押す(商品名: string): Promise<void> {
    const b = this.実在庫登録のボタン(商品名);
    await expect(b, `${商品名} の実在庫登録ボタン`).toBeVisible({ timeout: OPEN });
    await b.click({ timeout: OPEN });
    await expect(this.登録のモーダル(), "実在庫登録の商品検索モーダル").toBeVisible({ timeout: OPEN });
  }

  /** モーダルで商品コードを検索する */
  async 登録の商品を検索する(語: string): Promise<void> {
    const m = this.登録のモーダル();
    await m.locator("#stock_admin_search_product_id").fill(語, { timeout: OPEN });
    await m.locator("#stockSearchProductModalButton").click({ timeout: OPEN });
    await expect(m.locator("#searchProductModalList tbody tr").filter({ hasText: 語 }).first(), `商品検索の結果（${語}）`).toBeVisible({ timeout: 30_000 });
  }

  /** モーダルの結果で、商品コードの行の「決定」を押す（登録の送信が走る） */
  async 登録の商品を決定する(商品コード: string): Promise<void> {
    const row = this.登録のモーダル().locator("#searchProductModalList tbody tr").filter({ hasText: 商品コード }).first();
    await row.locator(".add-order-item").click({ timeout: OPEN });
  }

  /** 実在庫登録の送信（POST）の応答を待つ約束を先に作る */
  登録の送信を待つ(): Promise<import("@playwright/test").Response | null> {
    return this.page.waitForResponse((r) => r.request().method() === "POST" && /\/purchase\/\d+\/register-individual-stock\/\d+/.test(new URL(r.url()).pathname), { timeout: 30_000 }).catch(() => null);
  }

  /** 商品を検索して決定する（登録の送信が済み、画面が戻るまで待つ。送信されなかったときは待たない） */
  async 登録の商品を選ぶ(商品コード: string): Promise<{ 送信された: boolean; 応答: number | null }> {
    await this.登録の商品を検索する(商品コード);
    const sent = this.登録の送信を待つ();
    await this.登録の商品を決定する(商品コード);
    const res = await sent;
    await this.page.waitForLoadState("load", { timeout: 60_000 });
    return { 送信された: res !== null, 応答: res ? res.status() : null };
  }
}
