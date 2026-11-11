/**
 * F06-06 購入履歴一覧の続き（-d）。実施不可の見直しで流せる見込みになったもののうち、画面で作れる 002・011・015・016・024・025・030。
 * 正本: cases/F06-06_test_cases.tsv。シードでの解釈は seeds/f06-06-d.ts と記録 review/F06-06_progress_2026-11-10_dev.md。
 */
import { Locator, Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { 本店の店名 } from "../../pages/admin/f04_setup";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { HistoryListPage } from "../../pages/front/f06_06_history";
import { 注文の } from "../../seeds/f06-06-d";
import { 受注の注文番号, 受注の注文日の表示 } from "../../db/f06_06_d";
import "../../seeds/f06-06-orders"; // 取り込みで抜けた登録を戻す: main 側が作り方を登録している seeds を読み込む（二重定義ではない）

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 注文日の補い = "注文日は画面で指定できないので、注文した日（実施日）の注文で確かめた";

/** 購入履歴一覧の1件の枠（商品名で探す。店頭受取の注文は対応状況によって注文番号が出ない作りのため） */
const 枠 = (page: Page, 商品名: string): Locator => page.locator(".p-hareruya-history-list__box").filter({ hasText: 商品名 }).first();
async function 枠の項目(box: Locator): Promise<Record<string, string>> {
  return box.locator(".p-hareruya-history-list__order-info-row").evaluateAll((rows) => Object.fromEntries(rows.map((r) => [
    (r.querySelector("dt")?.textContent ?? "").replace(/\s+/g, " ").trim(), (r.querySelector("dd")?.textContent ?? "").replace(/\s+/g, " ").trim(),
  ])));
}
async function 開く(ctx: CaseCtx, seedId: string): Promise<HistoryListPage> {
  const o = 注文の(seedId);
  await frontLogin(ctx.page, { メール: o.会員メール, パスワード: o.パスワード });
  return new HistoryListPage(ctx.page);
}

caseTest("IT-F06-06-002", async (ctx) => {
  const { page, step, expected } = ctx;
  const A = 注文の("S-F06-06-FILTER-002"), B = 注文の("S-F06-06-FILTER-002#B");
  supplement("同会員の購入処理中の注文（正本の注文番号 FILTER-A-002-002）は、カートに入れてご注文方法指定画面を開いて画面で作った。番号は画面が振ったもの");
  const h = await 開く(ctx, "S-F06-06-FILTER-002");
  let 番号: string[] = [];
  const 処理中の番号 = 受注の注文番号(A.処理中の受注ID ?? "");
  await step(1, async () => { note(`ログインした会員: ${A.会員メール}`); });
  await step(2, async () => { await h.開く(); 番号 = await h.注文番号を上から(); note(`表示された注文番号: ${番号.join("、") || "なし"}・購入処理中の注文の番号: ${処理中の番号 || "（未採番）"}`); });
  await expected(async () => {
    expect.soft(番号, "表示された注文は対象会員の非処理中の注文だけ").toEqual([A.注文番号]);
    if (処理中の番号) expect.soft(番号.includes(処理中の番号), "同会員の購入処理中の注文が表示されない").toBe(false);
    expect.soft(番号.includes(B.注文番号), "他会員の注文が表示されない").toBe(false);
  });
});

caseTest("IT-F06-06-011", async (ctx) => {
  const { page, step, expected } = ctx;
  supplement(`${注文日の補い}。受取店舗「晴れる屋本店」は開発環境の本店の店名に読み替えた`);
  const o = 注文の("S-F06-06-DISPLAY-011");
  const 店名 = await 本店の店名(ctx.browser);
  const h = await 開く(ctx, "S-F06-06-DISPLAY-011");
  let 項目: Record<string, string> = {};
  await step(1, async () => { note(`ログインした会員: ${o.会員メール}`); });
  await step(2, async () => { await h.開く(); });
  await step(3, async () => {
    const box = 枠(page, o.商品コード);
    await expect(box, "注文の枠").toBeVisible();
    await box.scrollIntoViewIfNeeded();
    項目 = await 枠の項目(box);
    note(`枠の項目: ${JSON.stringify(項目)}`);
  });
  await expected(async () => {
    expect.soft(項目["注文日"] ?? "（注文日の項目が無い）", "注文日").toBe(受注の注文日の表示(o.注文ID));
    expect.soft(項目["店舗"] ?? "（店舗の項目が無い）", "受取店舗名").toBe(店名);
    expect.soft(項目["注文番号"] ?? "（注文番号の項目が無い）", "注文番号").toBe(o.注文番号);
    expect.soft((項目["処理状態"] ?? "") !== "", "処理状態が表示される").toBe(true);
  });
});

function 詳細へ(seedId: string, 押すもの: "注文番号" | "処理状態") {
  return async (ctx: CaseCtx): Promise<void> => {
    const { page, step, expected } = ctx;
    supplement(注文日の補い);
    const o = 注文の(seedId);
    const h = await 開く(ctx, seedId);
    await step(1, async () => { note(`ログインした会員: ${o.会員メール}`); });
    await step(2, async () => { await h.開く(); });
    await step(3, async () => {
      const box = 枠(page, o.商品コード);
      await expect(box, "注文の枠").toBeVisible();
      const link = 押すもの === "注文番号"
        ? box.locator("a.c-hareruya-link", { hasText: o.注文番号 }).first()
        : box.locator("a:has(.c-hareruya-label--status)").first();
      await expect(link, `${押すもの}のリンク`).toBeVisible({ timeout: 10_000 });
      await h.押して遷移する(link);
    });
    await expected(async () => {
      expect.soft(new URL(page.url()).pathname, "遷移した画面（その注文の購入履歴詳細）").toBe(`/ja/mypage/shopping_history_detail/${o.注文ID}`);
    });
  };
}
caseTest("IT-F06-06-015", 詳細へ("S-F06-06-DISPLAY-015", "注文番号"));
caseTest("IT-F06-06-016", 詳細へ("S-F06-06-DISPLAY-016", "処理状態"));
caseTest("IT-F06-06-030", 詳細へ("S-F06-06-DISPLAY-030", "注文番号"));

caseTest("IT-F06-06-024", async (ctx) => {
  const { page, step, expected } = ctx;
  supplement(注文日の補い);
  const o = 注文の("S-F06-06-SMOOTHNO-024");
  const h = await 開く(ctx, "S-F06-06-SMOOTHNO-024");
  let 項目: Record<string, string> = {};
  await step(1, async () => { note(`ログインした会員: ${o.会員メール}`); });
  await step(2, async () => { await h.開く(); });
  await step(3, async () => {
    const box = 枠(page, o.商品コード);
    await expect(box, "注文の枠").toBeVisible();
    項目 = await 枠の項目(box);
    note(`枠の項目: ${JSON.stringify(項目)}`);
  });
  await expected(async () => {
    expect.soft(項目["注文番号"] ?? "（注文番号の項目が無い）", "注文番号の列").toBe(o.注文番号);
  });
});

caseTest("IT-F06-06-025", async (ctx) => {
  const { page, step, expected } = ctx;
  supplement(注文日の補い);
  const h = await 開く(ctx, "S-F06-06-MEMBERNAME-025");
  let 表示 = "";
  await step(1, async () => { note(`ログインした会員: ${注文の("S-F06-06-MEMBERNAME-025").会員メール}`); });
  await step(2, async () => { await h.開く(); });
  await step(3, async () => { 表示 = (await page.locator(".p-hareruya-history-list--shopping p.c-hareruya-heading--lev3, main p.c-hareruya-heading--lev3").first().innerText()).replace(/\s+/g, " ").trim(); });
  await expected(async () => {
    expect.soft(表示, "会員名の表示").toContain("購入履歴025 太郎");
  });
});
