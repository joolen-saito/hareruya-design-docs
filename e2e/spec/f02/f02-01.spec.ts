/**
 * F02-01 PC版ナビゲーション（本店）。正本: cases/F02-01_test_cases.tsv
 * 実装したのは、商品・データを消すシード・DBでの準備・共有の設定を使わない 016・018・020・067・069・070（記録 review/F02-01_progress_2026-11-10_dev.md）。
 * 事前準備③「専用ブラウザをその会員でログイン済みにする」は、ケースのブラウザで手順1の前にログインする。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { LoginPage } from "../../pages/front/f06_03_login";
import { MainNavPage } from "../../pages/front/f02_01_pc_nav";
import { 会員の } from "../../seeds/f02-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
async function ログイン済みにする(ctx: CaseCtx, k: string): Promise<void> {
  const m = 会員の(k);
  const l = new LoginPage(ctx.page);
  await l.ログイン画面を開く();
  await l.ログインする(m.メール, m.パスワード);
  expect(await l.ログイン画面である(), `事前準備: 会員 ${k} でログインできた`).toBe(false);
}
const ポイントの数字 = async (n: MainNavPage): Promise<string[]> => (await n.ポイントの数字().allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);

function ポイント欄(k: string, 期待: string) {
  return async (ctx: CaseCtx): Promise<void> => {
    const { page, step, expected, capture } = ctx;
    await ログイン済みにする(ctx, k);
    const n = new MainNavPage(page);
    let v: string[] = [];
    await step(1, async () => { await n.本店トップを開く(); });
    await step(2, async () => { await page.waitForLoadState("load"); v = await ポイントの数字(n); });
    await expected(async () => {
      await n.マウスを離す(); await capture("ヘッダ");
      expect.soft(v.length, "ポイント欄の数（非表示にならない）").toBeGreaterThan(0);
      expect.soft(v, `ポイント欄の数字（すべて${期待}）`).toEqual(v.map(() => 期待));
    });
  };
}
caseTest("IT-F02-01-016", ポイント欄("016", "125"));
caseTest("IT-F02-01-069", ポイント欄("069", "0"));

function マイページへ(k: string, 導線: "ポイント" | "マイページ") {
  return async (ctx: CaseCtx): Promise<void> => {
    const { page, step, expected, capture } = ctx;
    await ログイン済みにする(ctx, k);
    const n = new MainNavPage(page);
    await step(1, async () => { await n.本店トップを開く(); });
    await step(2, async () => { await n.押して遷移する(導線 === "ポイント" ? n.ポイントの導線() : n.マイページの導線()); });
    await expected(async () => {
      expect.soft(new URL(page.url()).pathname, "遷移した画面（マイページ）").toMatch(/^\/ja\/mypage\/?$/);
    });
  };
}
caseTest("IT-F02-01-018", マイページへ("018", "ポイント"));
caseTest("IT-F02-01-020", マイページへ("020", "マイページ"));

caseTest("IT-F02-01-067", async (ctx) => {
  const { page, step, expected, capture } = ctx;
  await ログイン済みにする(ctx, "067");
  const n = new MainNavPage(page);
  await step(1, async () => { await n.本店トップを開く(); });
  await step(2, async () => { await page.waitForLoadState("load"); await expect(n.お気に入りのアイコン(), "ヘッダのお気に入り欄").toBeAttached(); });
  await expected(async () => {
    await n.マウスを離す(); await capture("ヘッダ");
    await expect.soft(n.お気に入りのアイコン(), "お気に入りアイコンが表示される").toBeVisible();
    await expect.soft(n.お気に入りの件数(), "お気に入り登録済み商品数（表示されない）").toHaveCount(0);
  });
});

caseTest("IT-F02-01-070", async (ctx) => {
  const { page, step, expected, capture } = ctx;
  await ログイン済みにする(ctx, "070");
  const n = new MainNavPage(page);
  await step(1, async () => { await n.本店トップを開く(); });
  await step(2, async () => {
    await page.waitForLoadState("networkidle").catch(() => note("読み込みの完了（通信が落ち着く）を待ちきれなかった。load の完了のあとで確かめた"));
    await expect(n.カートのリンク(), "ヘッダのカート").toBeVisible();
  });
  await expected(async () => {
    await n.マウスを離す(); await capture("ヘッダ");
    await expect.soft(n.見えているカートの商品数(), "ヘッダのカートの商品数（表示されない）").toHaveCount(0);
  });
});
