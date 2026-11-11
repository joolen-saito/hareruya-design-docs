/**
 * M04-34 戻しリストPDF の画面操作。セレクタはここだけに書く。正本: cases/M04-34_test_cases.tsv
 * - 在庫移動・振替検索一覧（作成日の検索・表示件数・行の選択）は M04-33 の部品（ReturnListPage）を使う。
 * - 「戻しリストPDF出力」を押すと、画面のスクリプトが別のウィンドウ（ポップアップ）を開き、戻しリストの内容を書き込む作り。
 *   ポップアップは、商品仕訳（ピッキング区分）ごと・30行ごとのまとまり（見出し「戻しリスト（商品単位_…）n/m」または「戻しリスト（サプライ）n/m」、
 *   作成日、表（No.・棚番号・言語/状態・略称・色/R・数・商品名・価格・備考）と「全N点」）を並べる。表の空き行（No. が空）は読まない。
 */
import { expect, Page } from "@playwright/test";
import { ReturnListPage } from "./m04_33_return_list";

const T = 60_000;

/** 戻しリストの1行 */
export type 戻しリストの行 = { No: string; 棚番号: string; 言語状態: string; 略称: string; 色R: string; 数: string; 商品名: string; 価格: string; 備考: string };
/** 戻しリストの1まとまり（ポップアップの1ページ） */
export type 戻しリストのページ = { 見出し: string; 商品仕訳: string; ページ: number; 総ページ: number; 作成日: string; 行: 戻しリストの行[]; 合計: string };
export type 戻しリスト = { ページ: 戻しリストのページ[]; 画面: Page };

/** ポップアップの戻しリストを読む */
export async function 戻しリストを読む(win: Page): Promise<戻しリストのページ[]> {
  await expect(win.locator(".ContentsAll"), "戻しリストのポップアップの中身").toBeAttached({ timeout: T });
  const raw = await win.locator(".ContentsAll .multipage").evaluateAll((ps) => ps.map((p) => {
    const t = (e: Element | null) => (e?.textContent ?? "").replace(/\s+/g, " ").trim();
    const divs = Array.from(p.children).filter((c) => c.tagName === "DIV");
    const rows = Array.from(p.querySelectorAll("table tr.data"));
    const cell = (r: Element, k: string) => t(r.querySelector(`td.${k}`));
    return {
      見出し: t(divs[0] ?? null),
      作成日: t(divs[1] ?? null),
      行: rows.filter((r) => cell(r, "no_") !== "").map((r) => ({
        No: cell(r, "no_"), 棚番号: cell(r, "shelf_number_"), 言語状態: cell(r, "language_condition_"), 略称: cell(r, "expansion_sname_"),
        色R: cell(r, "color_rarity_"), 数: cell(r, "qty_"), 商品名: cell(r, "name_"), 価格: cell(r, "price_"), 備考: cell(r, "remarks_"),
      })),
      合計: t(rows.filter((r) => r.querySelector("td[colspan]")).pop() ?? null),
    };
  }));
  return raw.map((p) => {
    const m = /戻しリスト（(?:商品単位_)?(.+?)）\s*(\d+)\s*\/\s*(\d+)/.exec(p.見出し);
    return {
      ...p, 商品仕訳: m?.[1] ?? "", ページ: Number(m?.[2] ?? 0), 総ページ: Number(m?.[3] ?? 0),
      作成日: p.作成日.replace(/^作成日\s*[：:]\s*/, ""),
    };
  });
}

/**
 * 「戻しリストPDF出力」を押し、開いたポップアップの戻しリストを読む。
 * ポップアップが開かなければ null（押したときに出たメッセージ（alert）は dialogs に入る）。
 */
export async function 戻しリストPDFを出力する(l: ReturnListPage, dialogs: string[] = []): Promise<戻しリスト | null> {
  const page = l.page;
  const onDialog = (d: import("@playwright/test").Dialog) => { dialogs.push(d.message()); d.accept().catch(() => undefined); };
  page.on("dialog", onDialog);
  try {
    await page.waitForLoadState("load");
    const wait = page.context().waitForEvent("page", { timeout: T }).catch(() => null);
    await page.locator("#stockMoveTransferReturnListPdfExport").click({ timeout: T });
    const win = await wait;
    if (!win) return null;
    win.setDefaultTimeout(T);
    // 開いた直後は「読み込み中…」。画面のスクリプトが戻しリストを書き込むまで待つ（取得に失敗すると閉じられる）
    await expect.poll(async () => (win.isClosed() ? "閉じた" : (await win.locator(".ContentsAll").count()) > 0 ? "書き込んだ" : "待ち"), {
      message: "戻しリストのポップアップに内容が書き込まれる", timeout: 120_000, intervals: [500, 1000, 2000],
    }).not.toBe("待ち");
    if (win.isClosed()) throw new Error(`戻しリストのポップアップが閉じられた（メッセージ: ${dialogs.join(" / ") || "なし"}）`);
    return { ページ: await 戻しリストを読む(win), 画面: win };
  } finally {
    page.off("dialog", onDialog);
  }
}

/** 戻しリストの全ページの行（商品仕訳を添える） */
export function 全行(list: 戻しリスト | null): (戻しリストの行 & { 商品仕訳: string })[] {
  return (list?.ページ ?? []).flatMap((p) => p.行.map((r) => ({ ...r, 商品仕訳: p.商品仕訳 })));
}
