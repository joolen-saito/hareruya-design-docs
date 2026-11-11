/**
 * M08-06 ポイント履歴確認。仕分け直し（recheck2）で流せる見込みになったもの。正本: cases/M08-06_test_cases.tsv
 * 画面: ポイント履歴確認画面（/customer/point/{会員ID}/history。pages/admin/m08_05_07.ts）。
 * 正本の履歴ID（806001001 など）は、シードが足した履歴の DB の番号へ読み替える（seeds/m08-06.ts の 履歴IDの読み替え）。
 * シード: seeds/m08-06.ts。記録: review/M08-06_progress_2026-11-11_dev.md
 */
import { Page, test } from "@playwright/test";
import { CaseBody, expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { PointPage } from "../../pages/admin/m08_05_07";
import { M0806_ADMIN, 履歴IDの読み替え } from "../../seeds/m08-06";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const path = (page: Page) => new URL(page.url()).pathname;
type 行 = Awaited<ReturnType<PointPage["履歴"]>>[number];

async function 開く(page: Page, 会員ID: string): Promise<PointPage> {
  await loginAdmin(page, M0806_ADMIN);
  const p = new PointPage(page);
  expect((await p.開く(会員ID, "history"))?.status(), "ポイント履歴確認画面の応答").toBe(200);
  return p;
}
function 読み替えの注記(正本: string[]): void {
  note(`正本の履歴IDは、シードが足した履歴の番号へ読み替えた（${正本.map((x) => `${x}→${履歴IDの読み替え(x)}`).join("、")}）`);
}

caseTest("IT-M08-06-001", async ({ page, notes, step, expected }) => {
  const 正本 = ["806001001", "806002001", "806003001", "806004001"];
  let ids: string[] = [];
  let p: PointPage;
  await step(1, async () => { p = await 開く(page, notes.get("〔会員ID-M0806-001〕")); 読み替えの注記(正本); });
  await step(2, async () => { ids = (await p.履歴()).map((r) => r.ID); note(`一覧の履歴ID: ${ids.join("、")}`); });
  await expected(async () => {
    for (const x of 正本) expect.soft(ids, `履歴ID ${x}（${履歴IDの読み替え(x)}）が表示される`).toContain(履歴IDの読み替え(x));
  });
});

/** 正本の履歴IDの行を読む（無ければ undefined） */
function 行を読む(rows: 行[], 正本の履歴ID: string): 行 | undefined { return rows.find((r) => r.ID === 履歴IDの読み替え(正本の履歴ID)); }

caseTest("IT-M08-06-003", async ({ page, notes, step, expected }) => {
  let r: 行 | undefined; let p: PointPage;
  await step(1, async () => { p = await 開く(page, notes.get("〔会員ID-M0806-003〕")); 読み替えの注記(["806003003"]); });
  await step(2, async () => { r = 行を読む(await p.履歴(), "806003003"); note(`行: ${JSON.stringify(r)}`); });
  await expected(async () => {
    expect.soft(r?.ID, "ID").toBe(履歴IDの読み替え("806003003"));
    expect.soft(r?.会員名, "会員名（姓「ポイント」と名「太郎」）").toBe("ポイント 太郎");
    expect.soft(r?.増減量, "増減量").toBe("200");
    expect.soft(r?.備考, "備考").toBe("履歴C");
  });
});

caseTest("IT-M08-06-004", async ({ page, notes, step, expected }) => {
  let 残高: number | null = null; let p: PointPage;
  await step(1, async () => { p = await 開く(page, notes.get("〔会員ID-M0806-004〕")); });
  await step(2, async () => { 残高 = await p.ポイント残高(); note(`ポイント残高の表示: ${残高}`); });
  await expected(async () => { expect(残高, "選手情報のポイント残高（履歴の合計240ではない）").toBe(1000); });
});

caseTest("IT-M08-06-005", async ({ page, notes, step, expected }) => {
  let r: 行 | undefined; let p: PointPage;
  await step(1, async () => { p = await 開く(page, notes.get("〔会員ID-M0806-005〕")); 読み替えの注記(["806004005"]); });
  await step(2, async () => { r = 行を読む(await p.履歴(), "806004005"); note(`行: ${JSON.stringify(r)}`); });
  await expected(async () => {
    expect.soft(r?.発行日, "発行日（履歴のポイント発行日 2026年1月2日）").toBe("2026/01/02");
    expect.soft(r?.設定日, "設定日（履歴が作られた日時 2026年1月5日）").toBe("2026/01/05");
  });
});

caseTest("IT-M08-06-006", async ({ page, notes, step, expected }) => {
  let r: 行 | undefined; let p: PointPage;
  await step(1, async () => { p = await 開く(page, notes.get("〔会員ID-M0806-006〕")); 読み替えの注記(["806001006"]); });
  await step(2, async () => { r = 行を読む(await p.履歴(), "806001006"); note(`行: ${JSON.stringify(r)}`); });
  await expected(async () => { expect(r?.注文番号, "紐づく受注の注文番号").toBe(notes.get("〔注文番号-M0806-006〕")); });
});

caseTest("IT-M08-06-007", async ({ page, notes, step, expected }) => {
  const 注文番号 = notes.get("〔注文番号-M0806-007〕"), 受注ID = notes.get("〔受注ID-M0806-007〕");
  let p: PointPage; let links = 0;
  await step(1, async () => { p = await 開く(page, notes.get("〔会員ID-M0806-007〕")); 読み替えの注記(["806001007"]); });
  await step(2, async () => {
    const link = p.注文番号のリンク(履歴IDの読み替え("806001007"));
    links = await link.count();
    note(`履歴の行の注文番号の欄のリンクの数: ${links}`);
    expect(links, `注文番号 ${注文番号} のリンクが1つある`).toBe(1);
    await p.押して移る(link);
    note(`移った先: ${path(page)}`);
  });
  await expected(async () => { expect(path(page), `注文番号 ${注文番号}（受注ID ${受注ID}）の受注編集画面`).toMatch(new RegExp(`/order/${受注ID}/edit/?$`)); });
});

caseTest("IT-M08-06-008", async ({ page, notes, step, expected }) => {
  let r: 行 | undefined; let p: PointPage;
  await step(1, async () => { p = await 開く(page, notes.get("〔会員ID-M0806-008〕")); 読み替えの注記(["806002008"]); });
  await step(2, async () => { r = 行を読む(await p.履歴(), "806002008"); note(`行: ${JSON.stringify(r)}`); });
  await expected(async () => {
    expect.soft(r, "履歴ID 806002008 の行がある").toBeTruthy();
    expect.soft(r?.注文番号, "受注に紐づかない履歴の注文番号の欄").toBe("");
  });
});

caseTest("IT-M08-06-010", async ({ page, notes, step, expected }) => {
  let status = 0; let p: PointPage;
  await step(1, async () => { p = await 開く(page, notes.get("〔会員ID-M0806-010〕")); });
  await step(2, async () => { status = (await p.会員IDを置き換えて開く("999999"))?.status() ?? 0; note(`会員ID 999999 のアドレス ${path(page)} の応答: ${status}`); });
  await expected(async () => {
    expect.soft(status, "ページが見つからない扱い（404）").toBe(404);
    expect.soft(await page.locator("#pointHistory").count(), "ポイント履歴確認画面が表示されない").toBe(0);
  });
});

caseTest("IT-M08-06-011", async ({ page, notes, step, expected }) => {
  const 会員ID = notes.get("〔会員ID-M0806-011〕"); let p: PointPage;
  await step(1, async () => { p = await 開く(page, 会員ID); });
  await step(2, async () => { await p.押して移る(p.会員編集画面に戻る); note(`移った先: ${path(page)}`); });
  await expected(async () => { expect(path(page), `会員ID ${会員ID} の会員編集画面`).toMatch(new RegExp(`/customer/${会員ID}/edit/?$`)); });
});

function 百二十件(n: "012" | "013", 確かめ: "行数" | "ページ送り"): CaseBody {
  return async ({ page, notes, step, expected }) => {
    let p: PointPage; let 行数 = 0, 送り = 0;
    await step(1, async () => { p = await 開く(page, notes.get(`〔会員ID-M0806-${n}〕`)); 読み替えの注記([`806${n}001`, `806${n}120`]); });
    await step(2, async () => {
      if (確かめ === "ページ送り") await page.mouse.wheel(0, 100_000);
      行数 = await p.履歴の行.count(); 送り = await p.ページ送りの数();
      note(`履歴の行数: ${行数} / ページ送りの操作部: ${送り}`);
    });
    await expected(async () => {
      if (確かめ === "行数") expect(行数, "ポイント履歴が120行すべて表示される").toBe(120);
      else expect(送り, "ページ送りの操作部が表示されない").toBe(0);
    });
  };
}
caseTest("IT-M08-06-012", 百二十件("012", "行数"));
caseTest("IT-M08-06-013", 百二十件("013", "ページ送り"));
