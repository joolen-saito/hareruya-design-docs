/**
 * M07-01 買取検索一覧の、2026-11-10 に足したケースが使う読み取りと操作。
 * 共通の部品（m07_buy.ts の BuyListPage）に足す形で、ここにだけセレクタを書く。
 *
 * 画面の作り（アプリの admin/Purchase/index.twig・PurchaseListType・purchase.js で確かめた）:
 * - 状況ごとの日付の検索欄は「<状況>_date_from」「<状況>_date_to」（書式 yyyy-MM-dd）。買取依頼日は request、査定開始日は assessing、
 *   振込依頼日は transfer_request、キャンセル日は cancellation。
 * - 買取状況の選択肢は、買取状況マスタの表示順に並ぶ。
 * - 買取依頼者氏名のリンク（.post_name）は、買取状況の選択を外し、注文者名にリンクの文を入れて検索欄を送る。
 * - 戻しリストのエラーなどは、画面上部の通知（.alert-danger）に出る。
 */
import { expect, Page } from "@playwright/test";
import { BuyListPage } from "./m07_buy";

const OPEN = 30_000;
const norm = (s: string) => s.replace(/ /g, " ").replace(/\s+/g, " ").trim();

export type 日付の状況 = "request" | "arrival" | "assessing" | "transfer_request" | "cancellation" | "appraisal" | "communicated" | "acceptance" | "transfer_complete" | "stocking_complete";

export class M0701ListPage extends BuyListPage {
  constructor(page: Page) { super(page); }

  日付欄(状況: 日付の状況, 端: "from" | "to") { return this.page.locator(`#admin_purchase_list_${状況}_date_${端}`); }

  /** 日付の欄に入れる（値は yyyy-MM-dd） */
  async 日付を入れる(状況: 日付の状況, 端: "from" | "to", 値: string): Promise<void> {
    const f = this.日付欄(状況, 端);
    await expect(f, `日付の検索欄（${状況}・${端}）`).toHaveCount(1, { timeout: OPEN });
    await f.fill(値, { timeout: OPEN });
  }

  async 日付の値(状況: 日付の状況, 端: "from" | "to"): Promise<string> {
    return this.日付欄(状況, 端).inputValue({ timeout: OPEN });
  }

  /** 利用回数の検索欄に入れる */
  async 利用回数を入れる(端: "from" | "to", 値: string): Promise<void> {
    const f = this.page.locator(`#admin_purchase_list_orderCount${端 === "from" ? "From" : "To"}`);
    await expect(f, `利用回数(${端 === "from" ? "From" : "To"})の検索欄`).toHaveCount(1, { timeout: OPEN });
    await f.fill(値, { timeout: OPEN });
  }

  /** 本人確認のチェックを、表示名で複数選ぶ */
  async 本人確認をまとめて選ぶ(名前: string[]): Promise<void> {
    for (const n of 名前) await this.本人確認を選ぶ(n);
  }

  /** 行の「申込時買取金額合計」の表示（例「¥800」） */
  async 申込時買取金額合計(番号: string): Promise<string> {
    return norm(await this.page.locator(`#result_list_main__purchase_total_price--${Number(番号)}`).innerText({ timeout: OPEN }));
  }

  /** 行の買取詳細の欄の文（商品名と数量が並ぶ） */
  async 買取詳細の文(番号: string): Promise<string> {
    return norm(await this.page.locator(`#result_list_main__purchase_purchase_detail--${Number(番号)}`).innerText({ timeout: OPEN }));
  }

  /** 行の買取詳細の欄の、商品名の並び（上から。「申込時買取金額合計」の行は含まない） */
  async 買取詳細の商品名(番号: string): Promise<string[]> {
    return this.page.locator(`#result_list_main__purchase_purchase_detail--${Number(番号)} .row .col-md-8`).evaluateAll((es) =>
      es.map((e) => (e.textContent ?? "").replace(/\s+/g, " ").trim()).filter((t) => t && !t.startsWith("申込時買取金額合計")));
  }

  /** 結果の行すべてにチェックを付ける（全選択のチェック） */
  async すべて対象にする(): Promise<void> {
    await this.全選択のチェック().check({ timeout: OPEN });
  }

  /** 行の買取番号の欄にある「キャンセルあり」の注記の文（無ければ空） */
  async キャンセルの注記(番号: string): Promise<string> {
    const e = this.page.locator(`#result_list_main__purchase_number--${Number(番号)} div.small`);
    return (await e.count()) ? norm(await e.first().innerText({ timeout: OPEN })) : "";
  }

  /** 買取状況の選択肢の表示名（並び順のまま。空の選択肢は除く） */
  async 買取状況の選択肢(): Promise<string[]> {
    return (await this.page.locator("#admin_purchase_list_buy_order_status option").allInnerTexts()).map(norm).filter(Boolean);
  }

  /** 選択中の買取状況の表示名 */
  async 選択中の買取状況(): Promise<string[]> {
    return this.page.locator("#admin_purchase_list_buy_order_status").evaluate((e) => Array.from((e as HTMLSelectElement).selectedOptions).map((o) => (o.textContent ?? "").trim()));
  }

  /** 買取状況の選択欄の部品を開く（見た目の選択欄を押す） */
  async 買取状況の選択肢を開く(): Promise<void> {
    const shown = this.page.locator("#admin_purchase_list_buy_order_status").locator("xpath=following-sibling::*[1]");
    if ((await shown.count()) && (await shown.isVisible())) await shown.click({ timeout: OPEN });
    else await this.page.locator("#admin_purchase_list_buy_order_status").click({ timeout: OPEN });
  }

  /** 商品名の AND/OR 検索のラジオのうち、選ばれている数 */
  async ANDOR検索の選択数(): Promise<number> {
    return this.page.locator('input[name="admin_purchase_list[product_name_select]"]:checked').count();
  }

  /** 本人確認のチェックのうち、選ばれている数 */
  async 本人確認の選択数(): Promise<number> {
    return this.page.locator('input[name*="identityConfirmStatus"]:checked').count();
  }

  /** 本人確認の選択肢の表示名 */
  async 本人確認の選択肢(): Promise<string[]> {
    return this.page.locator('input[name*="identityConfirmStatus"]').evaluateAll((os) => os.map((o) => ((o as HTMLInputElement).labels?.[0]?.textContent ?? "").trim()));
  }

  /** 左のメニュー「ネット買取管理」→「買取検索一覧」を押して開き直す（折りたたまれていれば親の見出しを順に開く） */
  async メニューから開き直す(): Promise<void> {
    const link = this.page.locator('.c-mainNavArea a[href$="/purchase/list"]').first();
    await expect(link, "メニューの「買取検索一覧」").toHaveCount(1, { timeout: OPEN });
    for (let i = 0; i < 3 && !(await link.isVisible()); i++) {
      const ids = await link.evaluate((a) => {
        const out: string[] = [];
        for (let e: Element | null = a.parentElement; e; e = e.parentElement) if (e.classList.contains("collapse") && e.id) out.push(e.id);
        return out.reverse();
      });
      for (const id of ids) {
        if (await this.page.locator(`#${id}`).isVisible()) continue;
        await this.page.locator(`.c-mainNavArea a[href="#${id}"]`).first().click({ timeout: OPEN });
        await this.page.waitForTimeout(500);
      }
    }
    await Promise.all([this.page.waitForLoadState("load"), link.click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
    await expect(this.検索フォーム(), "買取検索一覧画面の検索欄").toBeVisible({ timeout: OPEN });
  }

  /** 行の買取依頼者氏名のリンクを押し、再検索の画面が開くまで待つ。リンクの文を返す */
  async 依頼者氏名を押す(番号: string): Promise<string> {
    const link = this.page.locator(`#result_list_main__purchase_customer_name--${Number(番号)} a.post_name`);
    await expect(link, "行の買取依頼者氏名のリンク").toBeVisible({ timeout: OPEN });
    const text = norm(await link.innerText());
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), link.click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
    return text;
  }

  /** 画面上部のエラーの通知（デバッグモードの帯を除く） */
  async エラーの通知(): Promise<string[]> {
    return (await this.page.locator(".alert-danger").allInnerTexts()).map(norm).filter((t) => t && !t.includes("デバッグモード"));
  }
}
