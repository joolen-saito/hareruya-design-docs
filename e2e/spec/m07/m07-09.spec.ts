/**
 * M07-09 戻しリストPDF出力。正本: cases/M07-09_test_cases.tsv
 *
 * サプライ品だけで準備できるケースを実装した（記録 review/M07-09_progress_2026-11-02.md）。
 * カード商品（略称・言語・状態・Foil・色・レアリティ・商品仕訳の並び）を使うケースと、DBでの準備が要るシードを使うケースは実装していない。
 * 決め打ちの商品コード・商品名は実行ごとの印つきの値で作ってあり、ケースの文の同じ値も印つきの値として確かめる（lib/run_marker.ts）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { BuyListPage, PDFの行, 戻しリストを読む } from "../../pages/admin/m07_buy";
import { M0709_ADMIN, 品名 } from "../../seeds/m07-09";
import { 在庫数量 } from "../../db/m07";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 氏名 = (n: string) => `戻しPDF試験M0709-${n}`;

type PDF = { popup: Page | null; ダイアログ: string[]; 行: PDFの行[]; 作成日時: string; 印刷ボタン: boolean };

/** 「ダウンロード▼」から「戻しリストPDF」を押し、ポップアップの中身を読む */
async function PDFを出す(l: BuyListPage): Promise<PDF> {
  const r = await l.ダウンロードを押す("戻しリストPDF");
  if (!r.popup) return { popup: null, ダイアログ: r.ダイアログ, 行: [], 作成日時: "", 印刷ボタン: false };
  const d = await 戻しリストを読む(r.popup);
  return { popup: r.popup, ダイアログ: r.ダイアログ, 行: d.行, 作成日時: d.作成日時, 印刷ボタン: d.印刷ボタン };
}

const 名前を含む行 = (p: PDF, 名: string): PDFの行[] => p.行.filter((r) => r.商品名.includes(名));

/** 手順1〜5（開く・氏名で検索・対象にチェック・PDF・見る）を行い、PDFを返す */
async function 手順1から5(ctx: import("../../lib/case").CaseCtx, n: string, 番号の呼び名: string[]): Promise<PDF> {
  const { page, notes, step } = ctx;
  await loginAdmin(page, M0709_ADMIN);
  const l = new BuyListPage(page);
  let pdf: PDF = { popup: null, ダイアログ: [], 行: [], 作成日時: "", 印刷ボタン: false };
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.注文者名を入れる(氏名(n)); await l.検索する(); });
  await step(3, async () => { for (const k of 番号の呼び名) await l.対象にする(notes.get(k)); });
  await step(4, async () => { pdf = await PDFを出す(l); });
  await step(5, async () => { await expect(pdf.popup ? pdf.popup.locator(".ContentsAll") : page.locator("body"), "戻しリストPDFのページ").toBeVisible({ timeout: 30_000 }); });
  return pdf;
}

caseTest("IT-M07-09-001", async (ctx) => {
  const p = await 手順1から5(ctx, "001", ["〔買取番号-M0709-001〕"]);
  await ctx.expected(async () => {
    expect.soft(p.popup !== null, "戻しリストPDFがポップアップで表示される").toBe(true);
    expect.soft(p.印刷ボタン, "ポップアップに「印刷する」ボタンがある").toBe(true);
  });
});

caseTest("IT-M07-09-002", async (ctx) => {
  const p = await 手順1から5(ctx, "002", ["〔買取番号-M0709-002A〕"]);
  await ctx.expected(async () => {
    expect.soft(名前を含む行(p, 品名("002", "A")).length, "商品名に「M0709-002-A」を含む行の数").toBeGreaterThan(0);
    expect.soft(名前を含む行(p, 品名("002", "B")).length, "商品名に「M0709-002-B」を含む行の数").toBe(0);
  });
});

caseTest("IT-M07-09-003", async (ctx) => {
  const p = await 手順1から5(ctx, "003", ["〔買取番号-M0709-003〕"]);
  await ctx.expected(async () => {
    expect.soft(名前を含む行(p, 品名("003", "A")).length, "入庫済みの買取の実在庫として商品名に「M0709-003-A」を含む行の数").toBeGreaterThan(0);
  });
});

caseTest("IT-M07-09-004", async (ctx) => {
  const p = await 手順1から5(ctx, "004", ["〔買取番号-M0709-004〕"]);
  await ctx.expected(async () => {
    expect.soft(名前を含む行(p, 品名("004", "A")).length, "商品名に「M0709-004-A」を含む行の数").toBeGreaterThan(0);
    expect.soft(名前を含む行(p, 品名("004", "D")).length, "商品名に「M0709-004-D」を含む行の数").toBe(0);
  });
});

caseTest("IT-M07-09-012", async (ctx) => {
  const p = await 手順1から5(ctx, "012", ["〔買取番号-M0709-012〕"]);
  await ctx.expected(async () => {
    const rows = 名前を含む行(p, 品名("012", "A"));
    expect.soft(rows.length, "サプライ品「M0709-012-A」の行の数").toBeGreaterThan(0);
    expect.soft(rows[0]?.言語状態 ?? "（行が無い）", "サプライ品の言語 / 状態の表示").toBe("サプライ品");
  });
});

caseTest("IT-M07-09-038", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0709_ADMIN);
  const l = new BuyListPage(page);
  let pdf: PDF = { popup: null, ダイアログ: [], 行: [], 作成日時: "", 印刷ボタン: false };
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.注文者名を入れる(氏名("038")); await l.検索する(); });
  await step(3, async () => { await l.対象にする(notes.get("〔買取番号-M0709-038A〕")); await l.対象にする(notes.get("〔買取番号-M0709-038B〕")); });
  await step(4, async () => { pdf = await PDFを出す(l); });
  await step(5, async () => { await expect(pdf.popup!.locator(".ContentsAll"), "戻しリストPDFのページ").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    expect.soft(名前を含む行(pdf, 品名("038", "A")).length, "商品名に「M0709-038-A」を含む行の数").toBeGreaterThan(0);
    expect.soft(名前を含む行(pdf, 品名("038", "B")).length, "商品名に「M0709-038-B」を含む行の数").toBeGreaterThan(0);
  });
});

caseTest("IT-M07-09-039", async (ctx) => {
  const p = await 手順1から5(ctx, "039", ["〔買取番号-M0709-039〕"]);
  await ctx.expected(async () => {
    const 期待 = `${品名("039", "A")}[AAA]【JP/NM】赤M`;
    expect.soft(p.行.map((r) => r.商品名), "商品名列の表示（略称・言語・状態・色・レアリティの表記を含む）").toContain(期待);
  });
});

caseTest("IT-M07-09-005", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0709_ADMIN);
  const l = new BuyListPage(page);
  let r: Awaited<ReturnType<BuyListPage["ダウンロードを押す"]>> | null = null;
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.注文者名を入れる(氏名("005")); await l.検索する(); });
  await step(3, async () => { await l.対象にする(notes.get("〔買取番号-M0709-005A〕")); await l.対象にする(notes.get("〔買取番号-M0709-005B〕")); });
  await step(4, async () => { r = await l.ダウンロードを押す("戻しリストPDF"); });
  await step(5, async () => { await page.waitForLoadState("load"); });
  await expected(async () => {
    const 文 = (await page.locator(".alert-danger").allInnerTexts()).join(" / ");
    await expect.soft(page.locator(".alert-danger").first(), "買取一覧(検索結果)画面のエラー表示").toBeVisible();
    expect.soft(文, "エラーの文（入庫待ち・入庫済み以外が対象に選ばれた）").toMatch(/入庫待ち.*入庫済み.*以外|入庫待ち、入庫済み/);
    expect.soft((r as { popup: Page | null } | null)?.popup ?? null, "戻しリストPDFのポップアップ").toBeNull();
  });
});

caseTest("IT-M07-09-006", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0709_ADMIN);
  const l = new BuyListPage(page);
  let pdf: PDF = { popup: null, ダイアログ: [], 行: [], 作成日時: "", 印刷ボタン: false };
  const A = () => notes.get("〔買取番号-M0709-006A〕");
  const B = () => notes.get("〔買取番号-M0709-006B〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.注文者名を入れる(氏名("006")); await l.検索する(); });
  await step(3, async () => { await l.対象にする(A()); });
  await step(4, async () => { pdf = await PDFを出す(l); });
  await step(5, async () => { await pdf.popup?.close(); });
  await step(6, async () => { await l.open(); });
  await step(7, async () => { await l.注文者名を入れる(氏名("006")); await l.戻し未完了のみ表示(true); await l.検索する(); });
  await expected(async () => {
    const nums = (await l.行()).map((r) => r.番号);
    expect.soft(nums, "一覧に表示される買取番号（戻し未完了のもの）").toEqual([String(Number(B()))]);
    expect.soft(nums.includes(String(Number(A()))), "棚戻し済みにした買取番号が一覧に表示される").toBe(false);
  });
});

caseTest("IT-M07-09-007", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0709_ADMIN);
  const l = new BuyListPage(page);
  let pdf: PDF = { popup: null, ダイアログ: [], 行: [], 作成日時: "", 印刷ボタン: false };
  let 数量: number | null = null;
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.注文者名を入れる(氏名("007")); await l.検索する(); });
  await step(3, async () => { await l.対象にする(notes.get("〔買取番号-M0709-007〕")); });
  await step(4, async () => { pdf = await PDFを出す(l); });
  await step(5, async () => { await pdf.popup?.close(); });
  await step(6, async () => { 数量 = 在庫数量(品名("007", "A")); });
  await expected(async () => {
    expect.soft(数量, "DBの、商品コードM0709-007-Aの実在庫数量").toBe(10);
  });
});

caseTest("IT-M07-09-014", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0709_ADMIN);
  const l = new BuyListPage(page);
  let pdf: PDF = { popup: null, ダイアログ: [], 行: [], 作成日時: "", 印刷ボタン: false };
  let t4 = new Date(), t6 = new Date();
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.注文者名を入れる(氏名("014")); await l.検索する(); });
  await step(3, async () => { await l.対象にする(notes.get("〔買取番号-M0709-014〕")); });
  await step(4, async () => { t4 = new Date(); });
  await step(5, async () => { pdf = await PDFを出す(l); });
  await step(6, async () => { t6 = new Date(); });
  await step(7, async () => { await expect(pdf.popup!.locator(".ContentsAll"), "戻しリストPDFのページ").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    const m = /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(pdf.作成日時);
    expect.soft(m !== null, `作成日時の表示（${pdf.作成日時 || "なし"}）が日時として読める`).toBe(true);
    if (m) {
      const c = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? "0"));
      const floor = (d: Date) => new Date(Math.floor(d.getTime() / (m[6] ? 1000 : 60_000)) * (m[6] ? 1000 : 60_000));
      expect.soft(c.getTime() >= floor(t4).getTime(), "作成日時が手順4で記録した日時以降").toBe(true);
      expect.soft(c.getTime() <= t6.getTime(), "作成日時が手順6で記録した日時以前").toBe(true);
      if (!m[6]) note("作成日時が分までの表示のため、手順4の日時は分に切り捨てて比べた");
    }
  });
});

caseTest("IT-M07-09-035", async ({ page, step, expected }) => {
  await loginAdmin(page, M0709_ADMIN);
  const l = new BuyListPage(page);
  let pdf: PDF = { popup: null, ダイアログ: [], 行: [], 作成日時: "", 印刷ボタン: false };
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.注文者名を入れる(氏名("035")); await l.検索する(); });
  await step(3, async () => { pdf = await PDFを出す(l); });
  await step(4, async () => { await page.waitForTimeout(500); });
  await expected(async () => {
    expect.soft(pdf.ダイアログ.length, "警告のダイアログが表示された回数").toBe(1);
    expect.soft(pdf.popup, "戻しリストPDFのポップアップ").toBeNull();
  });
});

caseTest("IT-M07-09-036", async ({ page, step, expected }) => {
  await loginAdmin(page, M0709_ADMIN);
  const l = new BuyListPage(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.注文者名を入れる(氏名("036")); await l.検索する(); });
  await step(3, async () => { await expect(l.検索フォーム(), "検索結果の画面").toBeVisible(); });
  await expected(async () => {
    await expect.soft(l.ダウンロードのボタン(), "「ダウンロード▼」").toHaveCount(0);
    await expect.soft(page.locator("#pdf_export_return_list"), "戻しリストPDFの操作").toHaveCount(0);
    expect.soft((await l.行()).length, "検索結果の行数").toBe(0);
  });
});
