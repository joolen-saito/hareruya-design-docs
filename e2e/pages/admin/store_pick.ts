/**
 * 店舗は作らず、決まった表（lib/store_create_ban.ts の E2Eの店舗・元からある店舗）から店舗IDで選ぶ（依頼者 2026-11-15「店舗は作るのもう禁止」）。
 * 店名ではなく店舗IDで選び、店舗一覧でその店舗IDの行の店名が表のとおりであることを確かめて、店舗ID を返す。
 * 正本の店名と違う店舗を使うことは onIssue で「読み替え」として残す（エビデンスのシード作成時の問題）。
 * 店舗の設定は書き換えない（読むだけ）。
 */
import { Page } from "@playwright/test";
import { E2Eの店舗, 元からある店舗, 使い回す店舗 } from "../../lib/store_create_ban";
import { adminUrl } from "../../lib/session";

/** 表の店舗（店舗IDで引く）。表に無ければ止める */
export function 表の店舗(店舗ID: string): 使い回す店舗 {
  const s = [...E2Eの店舗, ...元からある店舗].find((x) => x.id === 店舗ID);
  if (!s) throw new Error(`店舗ID ${店舗ID} は E2E が使ってよい店舗の表に無い（店舗は作らない。依頼者 2026-11-15）`);
  return s;
}

/**
 * 表の店舗（店舗ID）が店舗一覧にあり、店名が表のとおりであることを確かめ、店舗IDと店名を返す。
 * 正本の店名（呼び名）を渡すと、読み替えを onIssue に残す。
 */
export async function 店舗IDで選ぶ(page: Page, 店舗ID: string, 正本の店名: string, onIssue: (m: string) => void, 役割 = ""): Promise<{ id: string; 店名: string }> {
  const s = 表の店舗(店舗ID);
  const res = await page.goto(adminUrl("/mall/tenant/page/1?page_count=10000"), { timeout: 120_000 });
  if (!res || !res.ok()) throw new Error(`店舗一覧を開けない（応答 ${res?.status() ?? "なし"}）`);
  const rows = await page.locator("table.table tbody tr").evaluateAll((trs) => trs.map((tr) => ({
    id: (tr.querySelectorAll("td")[1]?.textContent ?? "").trim(), 店名: (tr.querySelector("a[href*='/mall/tenant/detail/']")?.textContent ?? "").trim(),
  })));
  const row = rows.find((r) => r.id === 店舗ID);
  if (!row) throw new Error(`店舗一覧に店舗ID ${店舗ID}（${s.店名}）が無い。店舗は作らない（依頼者 2026-11-15）`);
  if (row.店名 !== s.店名) throw new Error(`店舗ID ${店舗ID} の店名が表と違う（画面「${row.店名}」・表「${s.店名}」）。表が古い。店舗は作らない（依頼者 2026-11-15）`);
  if (rows.filter((r) => r.店名 === s.店名).length > 1) throw new Error(`店名「${s.店名}」の店舗が複数あり、画面の選択肢で店名では決められない`);
  onIssue(`読み替え: 正本の店舗「${正本の店名}」${役割 ? `（${役割}）` : ""}は店舗「${s.店名}」（店舗ID ${s.id}）で表した（店舗は作らない。依頼者 2026-11-15）`);
  return { id: s.id, 店名: s.店名 };
}
