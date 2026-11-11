/**
 * M07-03 の RG（買取情報編集の変更がほかの画面へ反映される）ケースが使う、ほかの画面の読み取り。セレクタはここにだけ書く。
 * 画面の作り（アプリのテンプレートで確かめた）:
 * - 在庫検索一覧の行: 2つめの価格の列（col-price）の下段が原価単価、在庫の列（col-stock）の上段が在庫・下段が総原価（Stock/stock_list_index.twig）。
 * - 買取商品履歴（/purchase/history）: 買取番号・ステータス（チェック）で検索し、結果の表は 買取番号・申込者・商品コード・…・入庫数 の順（Purchase/history.twig）。
 * - 会員登録編集の買取履歴欄: 行の買取番号は7桁0埋めのリンク（買取情報編集へ）、最後の列が買取ステータスのバッジ（Customer/edit.twig）。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

const OPEN = 30_000;
const norm = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const num = (s: string) => s.replace(/[^\d.-]/g, "");

/** 在庫検索一覧の行の 在庫・原価単価・総原価（桁区切りを外した数字の文字） */
export async function 在庫の行の値(row: Locator): Promise<{ 在庫: string; 原価単価: string; 総原価: string }> {
  await expect(row, "在庫検索一覧の対象の行は1件").toHaveCount(1, { timeout: OPEN });
  const price = row.locator("td.col-price").nth(1).locator("div");
  const stock = row.locator("td.col-stock div");
  return { 在庫: num(await stock.nth(0).innerText()), 原価単価: num(await price.nth(1).innerText()), 総原価: num(await stock.nth(1).innerText()) };
}

/** 買取商品履歴（検索入力・検索結果） */
export class PurchaseHistoryPage {
  constructor(readonly page: Page) {}
  readonly form = () => this.page.locator("form#search_form");

  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/purchase/history"), { timeout: 60_000 });
    expect(res?.status() ?? 0, "買取商品履歴画面の応答").toBeLessThan(400);
    await expect(this.form(), "買取商品履歴の検索欄").toBeVisible({ timeout: OPEN });
    await this.page.waitForLoadState("load");
  }

  async 買取番号を入れる(番号: string): Promise<void> { await this.page.locator("#admin_purchase_history_buy_order_id").fill(番号, { timeout: OPEN }); }

  /** ステータスのチェックを、表示名で付ける（ほかは外す） */
  async ステータスを選ぶ(名前: string[]): Promise<void> {
    const boxes = this.page.locator('input[name="admin_purchase_history[buy_order_status][]"]');
    const labels = await boxes.evaluateAll((els) => els.map((e) => ((e as HTMLInputElement).labels?.[0]?.textContent ?? "").trim()));
    for (const n of 名前) if (!labels.includes(n)) throw new Error(`買取商品履歴のステータスに「${n}」が無い（${labels.join("、")}）`);
    for (let i = 0; i < labels.length; i++) await boxes.nth(i).setChecked(名前.includes(labels[i]), { timeout: OPEN });
  }

  async 検索する(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), this.form().getByRole("button", { name: /検索する/ }).click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
  }

  /** 該当件数（「検索結果：N件が該当しました」）。表示が無ければ null */
  async 該当件数(): Promise<number | null> {
    const t = norm(await this.page.locator("span.fw-bold").filter({ hasText: "検索結果" }).first().innerText({ timeout: 10_000 }).catch(() => ""));
    const m = /検索結果：\s*([\d,]+)\s*件/.exec(t);
    return m ? Number(m[1].replace(/,/g, "")) : null;
  }

  /** 結果の行（見出し → 値） */
  async 行(): Promise<Record<string, string>[]> {
    const table = this.page.locator("#result_list_main table").first();
    if ((await table.count()) === 0) return [];
    const heads = (await table.locator("thead th").allInnerTexts()).map(norm);
    const rows = await table.locator("tbody tr").evaluateAll((trs) => trs.map((tr) => Array.from(tr.querySelectorAll(":scope > td")).map((td) => ((td as HTMLElement).innerText ?? "").replace(/\s+/g, " ").trim())));
    return rows.filter((r) => r.length === heads.length).map((r) => Object.fromEntries(heads.map((h, i) => [h, r[i]])));
  }
}

/** 会員登録編集の買取履歴欄の、買取番号の行の買取ステータス（行が無ければ null） */
export async function 会員の買取履歴の状況(page: Page, 番号: string): Promise<string | null> {
  const link = page.locator(`a[href$="/purchase/${Number(番号)}/edit"]`).first();
  if ((await link.count()) === 0) return null;
  return norm(await link.locator("xpath=ancestor::tr[1]").locator("td").last().innerText());
}

/** 会員登録編集の買取履歴欄で、買取番号のリンクを押して買取情報編集を開く */
export async function 会員の買取履歴から開く(page: Page, 番号: string): Promise<void> {
  const link = page.locator(`a[href$="/purchase/${Number(番号)}/edit"]`).first();
  await expect(link, `買取履歴欄の買取番号 ${番号} のリンク`).toBeVisible({ timeout: OPEN });
  const target = await link.getAttribute("target");
  if (target === "_blank") {
    const [p] = await Promise.all([page.context().waitForEvent("page"), link.click({ timeout: OPEN })]);
    await p.waitForLoadState("load");
    await page.goto(p.url());
    await p.close();
  } else {
    await Promise.all([page.waitForLoadState("load"), link.click({ timeout: OPEN })]);
  }
  await page.waitForLoadState("load");
}
