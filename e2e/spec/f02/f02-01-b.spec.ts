/**
 * F02-01 PC版ナビゲーション（本店）の続き（-b）。商品を作るケース（ヘッダのお気に入り・カートの表示と数量操作）。正本: cases/F02-01_test_cases.tsv
 * 実装しないケース: 072・073（カードのマスタを新しく登録してカード商品を作るシード。判断待ち。記録 review/F02-01_progress_2026-11-10_dev.md）。
 * 事前準備③「専用ブラウザをその会員でログイン済みにする」は、ケースのブラウザで手順1の前にログインする。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { available } from "../../lib/db";
import { 会員のカートの数量 } from "../../db/f02_01_cart";
import { LoginPage } from "../../pages/front/f06_03_login";
import { MainNavCartPage } from "../../pages/front/f02_01_pc_nav";
import { 会員の, 商品名の } from "../../seeds/f02-01-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function ログイン済みにする(ctx: CaseCtx, k: string): Promise<MainNavCartPage> {
  const m = 会員の(k);
  const l = new LoginPage(ctx.page);
  await l.ログイン画面を開く();
  await l.ログインする(m.メール, m.パスワード);
  expect(await l.ログイン画面である(), `事前準備: 会員 ${k} でログインできた`).toBe(false);
  return new MainNavCartPage(ctx.page);
}
const 数字 = (t: string): string => (t.match(/\d[\d,]*/)?.[0] ?? "").replace(/,/g, "");
/** DBの数量を、更新が反映されるまで少し待って読む（期待の値になるか、10秒たつまで） */
async function DBの数量(メール: string, 商品名: string, 期待: number[]): Promise<number[]> {
  let v = 会員のカートの数量(メール, 商品名);
  for (let i = 0; i < 20 && JSON.stringify(v) !== JSON.stringify(期待); i++) { await new Promise((r) => setTimeout(r, 500)); v = 会員のカートの数量(メール, 商品名); }
  return v;
}

// ---- お気に入りの件数・お気に入り商品一覧へ ----
function お気に入りの件数(k: string, 件数: string) {
  return async (ctx: CaseCtx): Promise<void> => {
    const { page, step, expected, capture } = ctx;
    const n = await ログイン済みにする(ctx, k);
    await step(1, async () => { await n.本店トップを開く(); });
    await step(2, async () => { await page.waitForLoadState("load"); await expect(n.お気に入りのアイコン(), "ヘッダのお気に入り欄").toBeAttached(); });
    await expected(async () => {
      await n.マウスを離す(); await capture("ヘッダ");
      await expect.soft(n.お気に入りのアイコン(), "お気に入りアイコンが表示される").toBeVisible();
      await expect.soft(n.お気に入りの件数(), `お気に入り登録済み商品数（${件数}）`).toHaveText(件数);
    });
  };
}
caseTest("IT-F02-01-021", お気に入りの件数("021", "2"));
caseTest("IT-F02-01-068", お気に入りの件数("068", "1"));

caseTest("IT-F02-01-022", async (ctx) => {
  const { page, step, expected } = ctx;
  const n = await ログイン済みにする(ctx, "022");
  await step(1, async () => { await n.本店トップを開く(); });
  await step(2, async () => { await n.押して遷移する(n.お気に入りのリンク()); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移した画面（お気に入り商品一覧）").toMatch(/^\/ja\/mypage\/favorite\/?$/);
  });
});

// ---- カートの商品数とカート内の合計 ----
function カートの点数(k: string, 点数: string) {
  return async (ctx: CaseCtx): Promise<void> => {
    const { page, step, expected, capture } = ctx;
    const n = await ログイン済みにする(ctx, k);
    let ヘッダ = ""; let 合計 = "";
    await step(1, async () => { await n.本店トップを開く(); });
    await step(2, async () => { await page.waitForLoadState("load"); await n.カートの商品数を待つ(); ヘッダ = await n.見えているカートの商品数().first().innerText().catch(() => ""); });
    await step(3, async () => { await n.カートへマウスオーバーする(); 合計 = await n.カート内の合計().innerText().catch(() => ""); await capture("カートのドロップダウン"); });
    await expected(async () => {
      expect.soft(数字(ヘッダ), `ヘッダのカートの商品数（${点数}）`).toBe(点数);
      expect.soft(数字(合計), `カート内の合計（${点数}点）`).toBe(点数);
    });
  };
}
caseTest("IT-F02-01-026", カートの点数("026", "3"));
caseTest("IT-F02-01-071", カートの点数("071", "1"));

// ---- 数量の操作（DBで確かめる） ----
function 数量の操作(k: string, 正本の名前: string, 操作: "削除" | "マイナス" | "プラス", 期待: number[]) {
  return async (ctx: CaseCtx): Promise<void> => {
    const { step, expected } = ctx;
    const n = await ログイン済みにする(ctx, k);
    const 名前 = 商品名の(正本の名前);
    let v: number[] = [];
    await step(1, async () => { await n.本店トップを開く(); await n.カートの商品数を待つ(); });
    await step(2, async () => { await n.カートへマウスオーバーする(); await expect(n.カートの行(名前), `カートのドロップダウンの「${名前}」の行`).toBeVisible({ timeout: 15_000 }); });
    await step(3, async () => {
      const 行 = n.カートの行(名前);
      const ボタン = 操作 === "削除" ? n.行の削除(行) : 操作 === "マイナス" ? n.行のマイナス(行) : n.行のプラス(行);
      const r = await n.行のボタンを押す(ボタン);
      note(`${操作}を押した: 数量の更新の応答 ${r.更新の応答 || "なし"}・ヘッダのカートの取り直し ${r.取り直し ? "あり" : "なし"}`);
    });
    await step(4, async () => { if (!available) note("DBの接続先が無い"); v = await DBの数量(会員の(k).メール, 名前, 期待); });
    await expected(async () => {
      expect.soft(v, 期待.length === 0 ? `会員のカートに「${名前}」の明細が無い（削除された）` : `会員のカートの「${名前}」の商品数（${期待.join("・")}）`).toEqual(期待);
    });
  };
}
caseTest("IT-F02-01-032", 数量の操作("032", "数量操作商品-032", "削除", []));
caseTest("IT-F02-01-033", 数量の操作("033", "数量操作商品-033", "マイナス", [1]));
caseTest("IT-F02-01-036", 数量の操作("036", "数量操作商品-036", "プラス", [3]));

// ---- 押せない数量のボタン ----
function 押せない(k: string, 正本の名前: string, 操作: "マイナス" | "プラス", 商品数: string) {
  return async (ctx: CaseCtx): Promise<void> => {
    const { step, expected } = ctx;
    const n = await ログイン済みにする(ctx, k);
    const 名前 = 商品名の(正本の名前);
    await step(1, async () => { await n.本店トップを開く(); await n.カートの商品数を待つ(); });
    await step(2, async () => { await n.カートへマウスオーバーする(); });
    await step(3, async () => { await expect(n.カートの行(名前), `カートのドロップダウンの「${名前}」の行`).toBeVisible({ timeout: 15_000 }); });
    await expected(async () => {
      const 行 = n.カートの行(名前);
      await expect(行, `「${名前}」の行が表示されている`).toBeVisible();
      await expect.soft(n.行の商品数(行), `「${名前}」の商品数（${商品数}）`).toHaveValue(商品数);
      await expect.soft(操作 === "マイナス" ? n.行のマイナス(行) : n.行のプラス(行), `「${名前}」の${操作}を押せない`).toBeDisabled();
    });
  };
}
caseTest("IT-F02-01-034", 押せない("034", "最小数量商品-034", "マイナス", "1"));
caseTest("IT-F02-01-037", 押せない("037", "在庫上限商品-037", "プラス", "5"));

// ---- カートとカートページへの遷移 ----
caseTest("IT-F02-01-038", async (ctx) => {
  const { page, step, expected } = ctx;
  const n = await ログイン済みにする(ctx, "038");
  let 一つ目 = ""; let 二つ目 = "";
  await step(1, async () => { await n.本店トップを開く(); await n.カートの商品数を待つ(); });
  await step(2, async () => { await n.押して遷移する(n.カートのリンク()); 一つ目 = new URL(page.url()).pathname; });
  await step(3, async () => { await n.本店トップを開く(); await n.カートの商品数を待つ(); });
  await step(4, async () => {
    await n.カートへマウスオーバーする();
    await expect(n.カートページへ(), "カートのドロップダウンの「カートページへ」").toBeVisible({ timeout: 15_000 });
    await n.押して遷移する(n.カートページへ()); 二つ目 = new URL(page.url()).pathname;
  });
  await expected(async () => {
    expect.soft(一つ目, "カートを押して移った画面（カート画面）").toMatch(/^\/ja\/cart\/?$/);
    expect.soft(二つ目, "カートページへを押して移った画面（カート画面）").toMatch(/^\/ja\/cart\/?$/);
  });
});

// ---- ヘッダのカートの読み込みを遮断する ----
caseTest("IT-F02-01-058", async (ctx) => {
  const { page, step, expected, capture } = ctx;
  const n = await ログイン済みにする(ctx, "058");
  let 遮断した = 0;
  await step(1, async () => {
    await page.route((u) => new URL(u.toString()).pathname.endsWith("/block/cart"), async (route) => { 遮断した++; await route.abort(); });
    note("開発者ツールの代わりに、ブラウザの通信の差し止め（パスが /block/cart で終わる要求を止める）で遮断した");
  });
  await step(2, async () => { await n.本店トップを開く(); });
  await step(3, async () => { await page.waitForLoadState("networkidle").catch(() => undefined); await page.waitForTimeout(1500); note(`遮断した /block/cart への要求: ${遮断した}件`); });
  await expected(async () => {
    await n.マウスを離す(); await capture("ヘッダ");
    await expect.soft(n.見えているカートの商品数(), "ヘッダのカートの商品数（表示されない）").toHaveCount(0);
  });
});

// ---- 在庫なし・在庫ありの数量操作欄 ----
caseTest("IT-F02-01-074", async (ctx) => {
  const { step, expected } = ctx;
  const n = await ログイン済みにする(ctx, "074");
  const なし = 商品名の("在庫なし商品-074"), あり = 商品名の("在庫あり商品-074");
  await step(1, async () => { await n.本店トップを開く(); await n.カートの商品数を待つ(); });
  await step(2, async () => { await n.カートへマウスオーバーする(); });
  await step(3, async () => {
    await expect(n.カートの行(なし), `カートのドロップダウンの「${なし}」の行`).toBeVisible({ timeout: 15_000 });
    await expect(n.カートの行(あり), `カートのドロップダウンの「${あり}」の行`).toBeVisible({ timeout: 15_000 });
  });
  await expected(async () => {
    const 行なし = n.カートの行(なし), 行あり = n.カートの行(あり);
    await expect(行なし, `「${なし}」の行が表示されている（数量操作欄の有無を見る前提）`).toBeVisible();
    await expect.soft(n.行のマイナス(行なし), `「${なし}」のマイナス（表示されない）`).toBeHidden();
    await expect.soft(n.行の商品数(行なし), `「${なし}」の商品数（表示されない）`).toBeHidden();
    await expect.soft(n.行のプラス(行なし), `「${なし}」のプラス（表示されない）`).toBeHidden();
    await expect.soft(n.行のマイナス(行あり), `「${あり}」のマイナスが表示される`).toBeVisible();
    await expect.soft(n.行の商品数(行あり), `「${あり}」の商品数（2）`).toHaveValue("2");
    await expect.soft(n.行のプラス(行あり), `「${あり}」のプラスが表示される`).toBeVisible();
  });
});
