/**
 * M04-09 の続き（163〜169 の在庫履歴・在庫検索一覧との連携、105 のステータス変更履歴）で使う画面の部品。セレクタはここにだけ書く。
 * 在庫履歴検索一覧の開く・条件のクリア・検索・行の読み取りは pages/admin/m04_17_stock_history.ts を使い、ここでは足りないもの
 * （店舗・登録元の選択、在庫移動完了画面のステータス変更履歴の読み取り）だけを書く。
 *
 * 画面の作り（アプリのテンプレート・フォームで確かめた）:
 * - 在庫履歴検索一覧の店舗の欄は複数選択（選択肢は開店中の店舗。値は店舗ID）、登録元の欄も複数選択（表示名は「在庫移動」「在庫振替」など）。
 * - 在庫移動完了画面のステータス変更履歴は、更新日（YYYY/MM/DD HH:MM:SS）・ステータス・更新者の3列の表。
 */
import { expect, Locator, Page } from "@playwright/test";
import { HistoryRow, StockHistoryPage } from "./m04_17_stock_history";

const clean = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

/** 複数選択の欄を、値（店舗IDなど）でそろえる */
async function 値で選ぶ(select: Locator, values: string[], what: string): Promise<void> {
  await expect(select, what).toHaveCount(1);
  const missing = await select.evaluate((el, vs) => {
    const s = el as HTMLSelectElement;
    const opts = Array.from(s.options);
    const miss = vs.filter((v) => !opts.some((o) => o.value === v));
    for (const o of opts) o.selected = vs.includes(o.value);
    s.dispatchEvent(new Event("change", { bubbles: true }));
    return miss;
  }, values);
  if (missing.length) throw new Error(`${what}の選択肢に値「${missing.join("・")}」が無い`);
}

/** 複数選択の欄を、選択肢の表示名でそろえる */
async function 表示名で選ぶ(select: Locator, labels: string[], what: string): Promise<void> {
  await expect(select, what).toHaveCount(1);
  const missing = await select.evaluate((el, ls) => {
    const s = el as HTMLSelectElement;
    const opts = Array.from(s.options);
    const miss = ls.filter((l) => !opts.some((o) => (o.textContent ?? "").trim() === l));
    for (const o of opts) o.selected = ls.includes((o.textContent ?? "").trim());
    s.dispatchEvent(new Event("change", { bubbles: true }));
    return miss;
  }, labels);
  if (missing.length) throw new Error(`${what}の選択肢に「${missing.join("・")}」が無い`);
}

export type 履歴の検索 = { キーワード: string; 店舗ID: string; 登録元: "在庫移動" | "在庫振替" };

/**
 * 在庫履歴検索一覧(検索入力)をメニューから開くのと同じアドレスで開き、「検索条件をクリア」を押し、
 * 商品名(日/英）・カード名・商品コードの欄・店舗・登録元を入れて検索する。結果の行（見出しの文言で引ける形）と、一覧の場所のメッセージを返す。
 */
export async function 在庫履歴を検索する(page: Page, v: 履歴の検索): Promise<{ rows: HistoryRow[]; messages: string[]; status: number }> {
  const h = new StockHistoryPage(page);
  await h.open();
  await h.clearConditions();
  await h.fillKeyword(v.キーワード);
  await 値で選ぶ(h.form.locator("#admin_stock_history_base_info"), [v.店舗ID], "在庫履歴検索一覧の店舗");
  await 表示名で選ぶ(h.form.locator("#admin_stock_history_create_source"), [v.登録元], "在庫履歴検索一覧の登録元");
  const status = await h.submit();
  return { rows: await h.rows(), messages: await h.messages(), status };
}

/** 一覧の行の値（見出しの文言で引く。無ければ、その旨の文） */
export function 列の値(row: HistoryRow, 見出し: string): string {
  const key = Object.keys(row).find((k) => k === 見出し) ?? Object.keys(row).find((k) => k.startsWith(見出し));
  return key ? clean(row[key]) : `（「${見出し}」の列が無い）`;
}

/** 金額・数の表示（「¥1,000」「-3」）を数にする。読めなければ NaN */
export function 数(text: string): number {
  const t = text.replace(/[¥￥,\s円]/g, "");
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
}

export type 状態の履歴 = { 更新日: string; ステータス: string; 更新者: string };

/** 在庫移動完了画面の「ステータス変更履歴」の表（上から） */
export async function ステータス変更履歴の表(page: Page): Promise<状態の履歴[]> {
  const table = page.locator("#statusChangeHistoryComplete table");
  await expect(table, "在庫移動完了画面のステータス変更履歴の表").toHaveCount(1);
  const rows = await table.locator("tbody tr").evaluateAll((trs) => trs.map((tr) =>
    Array.from(tr.querySelectorAll(":scope > td")).map((td) => ((td as HTMLElement).innerText ?? "").replace(/\s+/g, " ").trim())));
  return rows.filter((r) => r.length === 3).map(([更新日, ステータス, 更新者]) => ({ 更新日, ステータス, 更新者 }));
}
