/**
 * F04-04 決済〜購入完了。正本: cases/F04-04_test_cases.tsv
 * 実装しないケース（記録 review/F04-04_progress_2026-11-10_dev.md）: 手順で DB を書き換えるもの（010〜015・048・049）、在庫無制限を DB で設定するシード（050・060）、
開発環境に無い店舗「TC東京」の店内アカウント（057）、ほか（DB での準備・外部の決済など）。
 * 事前準備の「専用ブラウザで完全ログインし、購入処理中の受注がある」は、シードの専用ブラウザの Cookie をケースのブラウザへ移して作る（seeds/f04-04.ts）。
 */
import { Browser, BrowserContext, Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { BASE_URL } from "../../config/env";
import { 受注を登録元とする在庫履歴, 受注明細の売上分析タグ, 商品コードの総在庫 } from "../../db/f04_04";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { 本店の店名 } from "../../pages/admin/f04_setup";
import { 在庫と総原価, 在庫を検索する, 在庫履歴を検索する, 履歴の行, 履歴の値, 累計注文回数 } from "../../pages/admin/f04_04_stock";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { CheckoutPage } from "../../pages/front/f04_04_checkout";
import { カートに入れる } from "../../pages/front/f04_shopping";
import { カートの中身 } from "../../pages/front/f03_01_product_list";
import { 会員の累計, 商品の総在庫と総原価, 商品を非公開にする, 商品規格ID, 受注の支払方法を変える, 受注の明細, 在庫数を変える, 購入制限数を変える } from "../../db/f04_04_w";
import { PB_ADM, 専用ブラウザにする, 準備の, 購入完了フリーエリアを整える, 購入完了フリーエリアを戻す } from "../../seeds/f04-04";
import { adminUrl } from "../../lib/session";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const チェックの注記 = "「注文する」ボタンは「この内容で注文を確定します。」のチェックを付けるまで押せない作りなので、チェックを付けてから押した";

/** 確定のチェックを付けて「注文する」を押す。移った先のパスを注記に残す */
async function 注文する(c: CheckoutPage): Promise<string> {
  await c.確定のチェックを付ける();
  const p = await c.注文するを押す();
  note(`「注文する」を押したあとの画面: ${p}`);
  return p;
}

// ---- 003: 引き継いだ受注が無い ----
caseTest("IT-F04-04-003", async ({ page, step, expected }) => {
  await 専用ブラウザにする(page.context(), "S-F04-04-NO-ORDER-003");
  const c = new CheckoutPage(page);
  await step(1, async () => { await c.購入完了画面のURLを開く(); });
  await expected(async () => {
    expect.soft(c.パス, "移った先（トップページ）").toMatch(/^\/(ja\/?)?$/);
  });
});

// ---- 銀行振込の購入処理中の受注を注文する ----
/** 事前準備（専用ブラウザ）と手順1「ご注文方法指定画面を開く」・手順2「注文する」、あれば手順3を行う */
async function 銀行振込の注文まで(ctx: CaseCtx, seedId: string, 手順3?: (c: CheckoutPage) => Promise<void>): Promise<CheckoutPage> {
  await 専用ブラウザにする(ctx.page.context(), seedId);
  const c = new CheckoutPage(ctx.page);
  await ctx.step(1, async () => {
    await c.ご注文方法指定画面を開く();
    note(`ご注文方法指定画面で選ばれているお支払い方法: ${await c.選ばれている支払方法() || "（なし）"}`);
  });
  await ctx.step(2, async () => { note(チェックの注記); await 注文する(c); });
  if (手順3) await ctx.step(3, async () => { await 手順3(c); });
  return c;
}

caseTest("IT-F04-04-021", async (ctx) => {
  let rows: ReturnType<typeof 受注を登録元とする在庫履歴> = [];
  const c = await 銀行振込の注文まで(ctx, "S-F04-04-NORMAL-021", async () => {
    rows = 受注を登録元とする在庫履歴(ctx.notes.get("〔受注ID-F0404-021〕"), rc("F0404-NORMAL-021"));
    note(`受注を登録元とする在庫の履歴: ${JSON.stringify(rows)}`);
  });
  await ctx.expected(async () => {
    expect.soft(await c.購入完了画面か(), "購入完了画面へ移った").toBe(true);
    expect.soft(rows.length, "受注ID 〔受注ID-F0404-021〕の購入に伴う在庫履歴の件数（1件以上）").toBeGreaterThanOrEqual(1);
  });
});

caseTest("IT-F04-04-022", async (ctx) => {
  let lines: string[] = [];
  const c = await 銀行振込の注文まで(ctx, "S-F04-04-NORMAL-022", async (c) => { lines = await c.番号の行の文(); note(`購入完了画面の番号の行: ${lines.join(" / ") || "なし"}`); });
  await ctx.expected(async () => {
    expect.soft(await c.購入完了画面か(), "購入完了画面へ移った").toBe(true);
    expect.soft(lines.some((t) => /^ご注文番号\s*\S+/.test(t)), `ご注文番号が表示される（番号の行: ${lines.join(" / ") || "なし"}）`).toBe(true);
    expect.soft(lines.some((t) => /TC注文番号/.test(t)), "TC注文番号へ切り替わらない").toBe(false);
  });
});

// ---- 025: 購入完了画面のフリースペース（全員が見るブロックの文章を書き換えて、終わるたびに戻す。夜の回に1本だけで流す） ----
const フリースペースの文章 = "F04-04購入完了フリースペース";
caseTest("IT-F04-04-025", async (ctx) => {
  let 見えた = false;
  let 戻し = "";
  try {
    await 購入完了フリーエリアを整える(ctx.browser, フリースペースの文章);
    note(`開始時に、ブロック管理の「購入完了 フリーエリア」（日本語）のコードを「${フリースペースの文章}」にした（依頼者決定 2026-11-14。終わったら元のコードへ戻す）`);
    const c = await 銀行振込の注文まで(ctx, "S-F04-04-NORMAL-025", async (c) => {
      見えた = await ctx.page.getByText(フリースペースの文章, { exact: false }).first().isVisible().catch(() => false);
      note(`購入完了画面に「${フリースペースの文章}」が見える: ${見えた}`);
    });
    await ctx.expected(async () => {
      expect.soft(await c.購入完了画面か(), "購入完了画面へ移った").toBe(true);
      expect.soft(見えた, `ブロック管理で設定した「${フリースペースの文章}」が購入完了画面に表示される`).toBe(true);
    });
  } finally {
    戻し = await 購入完了フリーエリアを戻す(ctx.browser);
    if (戻し) note(戻し);
  }
  expect(戻し, "購入完了画面用ブロックを元のコードへ戻せた").toBe("");
});

caseTest("IT-F04-04-027", async (ctx) => {
  await 銀行振込の注文まで(ctx, "S-F04-04-NORMAL-027", async (c) => {
    await expect(c.ヘルプページのリンク, "購入完了画面のヘルプページのリンク").toBeVisible();
    await Promise.all([ctx.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), c.ヘルプページのリンク.click()]);
    await ctx.page.waitForLoadState("load");
  });
  await ctx.expected(async () => {
    expect.soft(new URL(ctx.page.url()).pathname, "移った先（ヘルプ画面）").toMatch(/^\/ja\/help(\/|$)/);
  });
});

function タグのケース(seedId: string, k: string, 期待A: number[], 期待B: number[], 説明A: string, 説明B: string) {
  return async (ctx: CaseCtx): Promise<void> => {
    let tags: Record<string, number[]> = {};
    const c = await 銀行振込の注文まで(ctx, seedId, async () => {
      tags = 受注明細の売上分析タグ(ctx.notes.get(`〔受注ID-F0404-${k}〕`));
      note(`受注明細の売上分析タグ（商品IDごと）: ${JSON.stringify(tags)}`);
    });
    await ctx.expected(async () => {
      expect.soft(await c.購入完了画面か(), "購入完了画面へ移った").toBe(true);
      expect.soft(tags[ctx.notes.get(`〔商品ID-F0404-${k}A〕`)] ?? "（明細が無い）", `商品 〔商品ID-F0404-${k}A〕 の受注明細の売上分析タグ（${説明A}）`).toEqual(期待A);
      expect.soft(tags[ctx.notes.get(`〔商品ID-F0404-${k}B〕`)] ?? "（明細が無い）", `商品 〔商品ID-F0404-${k}B〕 の受注明細の売上分析タグ（${説明B}）`).toEqual(期待B);
    });
  };
}
caseTest("IT-F04-04-034", タグのケース("S-F04-04-TAGS-034", "034", [31], [32, 33], "31", "32・33"));
caseTest("IT-F04-04-053", タグのケース("S-F04-04-TAGMIX-053", "053", [31], [], "31", "登録されない"));

caseTest("IT-F04-04-061", async (ctx) => {
  const c = await 銀行振込の注文まで(ctx, "S-F04-04-CBCHKSTOCK-061");
  await ctx.expected(async () => {
    expect.soft(await c.システムエラー画面か(), "システムエラー画面は表示されない").toBe(false);
    expect.soft(await c.購入完了画面か(), "購入完了画面が表示される").toBe(true);
  });
});

// 047: 手順は4つ（3. 購入完了画面を確認、4. DBで総在庫を確認）
caseTest("IT-F04-04-047", async (ctx) => {
  const { page, step, expected } = ctx;
  await 専用ブラウザにする(page.context(), "S-F04-04-EXACT-047");
  const c = new CheckoutPage(page);
  let 完了 = false; let 総在庫 = -1;
  await step(1, async () => { await c.ご注文方法指定画面を開く(); });
  await step(2, async () => { note(チェックの注記); await 注文する(c); });
  await step(3, async () => { 完了 = await c.購入完了画面か(); });
  await step(4, async () => { 総在庫 = 商品コードの総在庫(rc("F0404-EXACT-047")); });
  await expected(async () => {
    expect.soft(完了, "購入完了画面が表示された").toBe(true);
    expect.soft(総在庫, "商品コード F0404-EXACT-047 の総在庫").toBe(0);
  });
});

// ---- PB 系: ブラウザA（会員）とブラウザB（管理画面） ----
async function ブラウザBを開く(browser: Browser): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(ctx);
  const page = await ctx.newPage();
  page.setDefaultTimeout(60_000);
  return { ctx, page };
}
async function Bで管理画面にログインする(b: Page): Promise<void> { await loginAdmin(b, PB_ADM.account); }
async function Bで在庫検索を開く(b: Page): Promise<void> {
  await b.goto(adminUrl("/product/stock"), { timeout: 60_000 });
  await b.waitForLoadState("load");
}
async function Aでログインして開く(a: Page, seedId: string): Promise<CheckoutPage> {
  await frontLogin(a, 準備の(seedId).会員);
  const c = new CheckoutPage(a);
  await c.買い物かごから開く();
  return c;
}
const 値の文 = (v: { 在庫: number | null; 総原価: number | null }) => `在庫 ${v.在庫 ?? "（行が無い）"}・総原価 ${v.総原価 ?? "（行が無い）"}`;
function 行が(rows: 履歴の値[], 番号: string): 履歴の値[] { return rows.filter((r) => r.登録元ID === 番号); }
type 照合 = { 件数: number; 登録元: string; 値: Omit<履歴の値, "登録元" | "登録元ID" | "登録者"> | string; 登録者: string };
/** 登録元IDが注文番号の行を探し、確かめる値を返す */
function 照合する(rows: 履歴の値[], 番号: string): 照合 {
  const hit = 行が(rows, 番号); const r = hit[0];
  return {
    件数: hit.length, 登録元: r?.登録元 ?? "（行が無い）", 登録者: r?.登録者 ?? "（行が無い）",
    値: r ? { 変更前在庫: r.変更前在庫, 変更後在庫: r.変更後在庫, 在庫増減数: r.在庫増減数, 変更前総原価: r.変更前総原価, 変更後総原価: r.変更後総原価 } : "（行が無い）",
  };
}

/** 手順: ゆうパック → 郵便振替 → 確定のチェックを付けて注文する */
async function ゆうパックで郵便振替(step: CaseCtx["step"], n: number, c: CheckoutPage): Promise<number> {
  await step(n, async () => { await c.配送方法を選ぶ("ゆうパック"); });
  await step(n + 1, async () => { await c.支払方法を選ぶ("郵便振替"); });
  await step(n + 2, async () => { await 注文する(c); });
  return n + 3;
}

caseTest("IT-F04-04-040", async ({ page, browser, step, expected }) => {
  const seedId = "S-F04-04-PB-STOCK-040"; const code = rc("F0404PB-001");
  const shop = await 本店の店名(browser);
  const B = await ブラウザBを開く(browser);
  try {
    let 前 = { 在庫: null as number | null, 総原価: null as number | null }, 後 = { ...前 };
    let c!: CheckoutPage; let 完了 = false;
    await step(1, async () => { await Bで管理画面にログインする(B.page); await Bで在庫検索を開く(B.page); });
    let list!: Awaited<ReturnType<typeof 在庫を検索する>>;
    await step(2, async () => { list = await 在庫を検索する(B.page, code, shop); });
    await step(3, async () => { 前 = await 在庫と総原価(list, code, shop); note(`手順3: ${値の文(前)}`); });
    await step(4, async () => { c = await Aでログインして開く(page, seedId); });
    await ゆうパックで郵便振替(step, 5, c);
    await step(8, async () => { 完了 = await c.購入完了画面か(); });
    await step(9, async () => { list = await 在庫を検索する(B.page, code, shop); });
    await step(10, async () => { 後 = await 在庫と総原価(list, code, shop); note(`手順10: ${値の文(後)}`); });
    await expected(async () => {
      expect.soft(完了, "手順8: 購入完了画面が表示された").toBe(true);
      expect.soft({ 在庫: 前.在庫, 総原価: 前.総原価 }, "手順3の本店の行の在庫・総原価").toEqual({ 在庫: 10, 総原価: 5000 });
      expect.soft({ 在庫: 後.在庫, 総原価: 後.総原価 }, "手順10の本店の行の在庫・総原価").toEqual({ 在庫: 7, 総原価: 3500 });
    });
  } finally { await B.ctx.close(); }
});

function 履歴を見る1件(seedId: string, コード: string, 番号の呼び名: string, 期待: Omit<履歴の値, "登録元" | "登録元ID" | "登録者">, 一件だけ: boolean) {
  return async ({ page, browser, notes, step, expected }: CaseCtx): Promise<void> => {
    const code = rc(コード); const shop = await 本店の店名(browser);
    const B = await ブラウザBを開く(browser);
    try {
      let c!: CheckoutPage; let rows: 履歴の値[] = [];
      let h!: Awaited<ReturnType<typeof 在庫履歴を検索する>>;
      await step(1, async () => { c = await Aでログインして開く(page, seedId); });
      await ゆうパックで郵便振替(step, 2, c);
      await step(5, async () => {
        const no = await c.ご注文番号();
        expect(no, "購入完了画面のご注文番号").not.toBe("");
        notes.set(番号の呼び名, no);
      });
      await step(6, async () => { await Bで管理画面にログインする(B.page); await B.page.goto(adminUrl("/product/stock/history")); await B.page.waitForLoadState("load"); });
      await step(7, async () => { h = await 在庫履歴を検索する(B.page, code, shop); });
      await step(8, async () => { rows = await 履歴の行(h); note(`在庫履歴の行: ${JSON.stringify(rows)}`); });
      await expected(async () => {
        const x = 照合する(rows, notes.get(番号の呼び名));
        if (一件だけ) expect.soft(x.件数, "登録元IDが注文番号の行の数（1件だけ）").toBe(1);
        else expect.soft(x.件数, "登録元IDが注文番号の行がある").toBeGreaterThan(0);
        expect.soft(x.登録元, "登録元").toBe("受注");
        expect.soft(x.値, "変更前在庫・変更後在庫・在庫増減数・変更前総原価・変更後総原価").toEqual(期待);
        expect.soft(x.登録者, "登録者").toBe("システム");
      });
    } finally { await B.ctx.close(); }
  };
}
caseTest("IT-F04-04-041", 履歴を見る1件("S-F04-04-PB-HIST-041", "F0404PB-002", "〔注文番号-F0404-002〕", { 変更前在庫: 10, 変更後在庫: 7, 在庫増減数: -3, 変更前総原価: 5000, 変更後総原価: 3500 }, false));
caseTest("IT-F04-04-044", 履歴を見る1件("S-F04-04-DPHIST-044", "F0404DP-044", "〔注文番号-F0404-044〕", { 変更前在庫: 10, 変更後在庫: 9, 在庫増減数: -1, 変更前総原価: 5000, 変更後総原価: 4500 }, true));

caseTest("IT-F04-04-042", async ({ page, browser, notes, step, expected }) => {
  const seedId = "S-F04-04-PB-CUM-042";
  const 会員ID = 準備の(seedId).会員ID;
  if (notes.has("〔会員ID-F0404-003〕") && notes.get("〔会員ID-F0404-003〕") !== 会員ID) note(`〔会員ID-F0404-003〕 はほかのケース（003）の会員を控えている。このケースはシード S-F04-04-PB-CUM-042 の会員（会員ID ${会員ID}）を使った`);
  const B = await ブラウザBを開く(browser);
  try {
    let 前 = -1, 後 = -1; let c!: CheckoutPage; let 完了 = false;
    await step(1, async () => { await Bで管理画面にログインする(B.page); await B.page.goto(adminUrl(`/customer/${会員ID}/edit`)); await B.page.waitForLoadState("load"); });
    await step(2, async () => { 前 = await 累計注文回数(B.page, 会員ID); });
    await step(3, async () => { c = await Aでログインして開く(page, seedId); });
    await ゆうパックで郵便振替(step, 4, c);
    await step(7, async () => { 完了 = await c.購入完了画面か(); });
    await step(8, async () => { await B.page.goto(adminUrl(`/customer/${会員ID}/edit`)); await B.page.waitForLoadState("load"); });
    await step(9, async () => { 後 = await 累計注文回数(B.page, 会員ID); });
    await expected(async () => {
      expect.soft(完了, "手順7: 購入完了画面が表示された").toBe(true);
      expect.soft(前, "手順2の累計注文回数").toBe(0);
      expect.soft(後, "手順9の累計注文回数").toBe(1);
    });
  } finally { await B.ctx.close(); }
});

/** 注文したあと、ブラウザBの在庫検索一覧で商品コードごとの在庫と総原価を読む（043・045） */
function 在庫を見る(seedId: string, コード: { code: string; 在庫: number; 総原価: number }[]) {
  return async ({ page, browser, step, expected }: CaseCtx): Promise<void> => {
    const shop = await 本店の店名(browser);
    const B = await ブラウザBを開く(browser);
    try {
      let c!: CheckoutPage; let 完了 = false;
      const 読んだ: { 在庫: number | null; 総原価: number | null }[] = [];
      let list!: Awaited<ReturnType<typeof 在庫を検索する>>;
      await step(1, async () => { c = await Aでログインして開く(page, seedId); });
      await ゆうパックで郵便振替(step, 2, c);
      await step(5, async () => { 完了 = await c.購入完了画面か(); });
      await step(6, async () => { await Bで管理画面にログインする(B.page); await Bで在庫検索を開く(B.page); });
      let n = 7;
      for (const x of コード) {
        await step(n++, async () => { list = await 在庫を検索する(B.page, rc(x.code), shop); });
        await step(n++, async () => { const v = await 在庫と総原価(list, rc(x.code), shop); 読んだ.push(v); note(`${x.code}: ${値の文(v)}`); });
      }
      await expected(async () => {
        expect.soft(完了, "手順5: 購入完了画面が表示された").toBe(true);
        コード.forEach((x, i) => expect.soft({ 在庫: 読んだ[i]?.在庫 ?? null, 総原価: 読んだ[i]?.総原価 ?? null }, `コード ${x.code} の本店の行の在庫・総原価`).toEqual({ 在庫: x.在庫, 総原価: x.総原価 }));
      });
    } finally { await B.ctx.close(); }
  };
}
caseTest("IT-F04-04-043", 在庫を見る("S-F04-04-DPSTOCK-043", [{ code: "F0404DP-043", 在庫: 9, 総原価: 4500 }]));
caseTest("IT-F04-04-045", 在庫を見る("S-F04-04-DPSTOCK-045", [{ code: "F0404DP-045A", 在庫: 9, 総原価: 4500 }, { code: "F0404DP-045B", 在庫: 8, 総原価: 3200 }]));

caseTest("IT-F04-04-046", async ({ page, browser, notes, step, expected }) => {
  const seedId = "S-F04-04-DPHIST-046"; const shop = await 本店の店名(browser);
  const B = await ブラウザBを開く(browser);
  try {
    let c!: CheckoutPage; const rows: Record<string, 履歴の値[]> = {};
    let h!: Awaited<ReturnType<typeof 在庫履歴を検索する>>;
    await step(1, async () => { c = await Aでログインして開く(page, seedId); });
    await ゆうパックで郵便振替(step, 2, c);
    await step(5, async () => { const no = await c.ご注文番号(); expect(no, "購入完了画面のご注文番号").not.toBe(""); notes.set("〔注文番号-F0404-046〕", no); });
    await step(6, async () => { await Bで管理画面にログインする(B.page); await B.page.goto(adminUrl("/product/stock/history")); await B.page.waitForLoadState("load"); });
    await step(7, async () => { h = await 在庫履歴を検索する(B.page, rc("F0404DP-046A"), shop); });
    await step(8, async () => { rows.A = await 履歴の行(h); note(`F0404DP-046A の在庫履歴の行: ${JSON.stringify(rows.A)}`); });
    await step(9, async () => { h = await 在庫履歴を検索する(B.page, rc("F0404DP-046B"), shop); });
    await step(10, async () => { rows.B = await 履歴の行(h); note(`F0404DP-046B の在庫履歴の行: ${JSON.stringify(rows.B)}`); });
    await expected(async () => {
      const no = notes.get("〔注文番号-F0404-046〕");
      const a = 照合する(rows.A ?? [], no), b = 照合する(rows.B ?? [], no);
      expect.soft([a.件数, b.件数], "登録元IDが注文番号の行の数（F0404DP-046A・F0404DP-046B とも1件）").toEqual([1, 1]);
      expect.soft([a.登録元, b.登録元], "登録元（両方とも受注）").toEqual(["受注", "受注"]);
      expect.soft(a.値, "F0404DP-046A の変更前在庫・変更後在庫・在庫増減数・変更前総原価・変更後総原価").toEqual({ 変更前在庫: 10, 変更後在庫: 9, 在庫増減数: -1, 変更前総原価: 5000, 変更後総原価: 4500 });
      expect.soft(b.値, "F0404DP-046B の変更前在庫・変更後在庫・在庫増減数・変更前総原価・変更後総原価").toEqual({ 変更前在庫: 10, 変更後在庫: 8, 在庫増減数: -2, 変更前総原価: 4000, 変更後総原価: 3200 });
    });
  } finally { await B.ctx.close(); }
});

/** 2回目の注文: 商品詳細画面で数量3をカートに入れ、買い物かごからご注文方法指定画面を開く */
async function もう一度カートに入れて開く(a: Page, seedId: string): Promise<CheckoutPage> {
  const p = 準備の(seedId).商品[0];
  await カートに入れる(a, "", p.productId, 3, `${p.商品コード} をもう一度カートに入れる`);
  const c = new CheckoutPage(a);
  await c.買い物かごから開く();
  return c;
}

caseTest("IT-F04-04-054", async ({ page, browser, step, expected }) => {
  const seedId = "S-F04-04-DPSTOCK-054"; const code = rc("F0404DP-054"); const shop = await 本店の店名(browser);
  const B = await ブラウザBを開く(browser);
  try {
    let c!: CheckoutPage; let 完了1 = false, 完了2 = false;
    let v1 = { 在庫: null as number | null, 総原価: null as number | null }, v2 = { ...v1 };
    let list!: Awaited<ReturnType<typeof 在庫を検索する>>;
    await step(1, async () => { c = await Aでログインして開く(page, seedId); });
    await ゆうパックで郵便振替(step, 2, c);
    await step(5, async () => { 完了1 = await c.購入完了画面か(); });
    await step(6, async () => { await Bで管理画面にログインする(B.page); await Bで在庫検索を開く(B.page); });
    await step(7, async () => { list = await 在庫を検索する(B.page, code, shop); });
    await step(8, async () => { v1 = await 在庫と総原価(list, code, shop); note(`手順8: ${値の文(v1)}`); });
    await step(9, async () => { c = await もう一度カートに入れて開く(page, seedId); });
    await ゆうパックで郵便振替(step, 10, c);
    await step(13, async () => { 完了2 = await c.購入完了画面か(); });
    await step(14, async () => { list = await 在庫を検索する(B.page, code, shop); });
    await step(15, async () => { v2 = await 在庫と総原価(list, code, shop); note(`手順15: ${値の文(v2)}`); });
    await expected(async () => {
      expect.soft([完了1, 完了2], "手順5・手順13: 購入完了画面が表示された").toEqual([true, true]);
      expect.soft({ 在庫: v1.在庫, 総原価: v1.総原価 }, "手順8の本店の行の在庫・総原価").toEqual({ 在庫: 7, 総原価: 3500 });
      expect.soft({ 在庫: v2.在庫, 総原価: v2.総原価 }, "手順15の本店の行の在庫・総原価").toEqual({ 在庫: 4, 総原価: 2000 });
    });
  } finally { await B.ctx.close(); }
});

caseTest("IT-F04-04-055", async ({ page, browser, notes, step, expected }) => {
  const seedId = "S-F04-04-DPHIST-055"; const code = rc("F0404DP-055"); const shop = await 本店の店名(browser);
  const B = await ブラウザBを開く(browser);
  try {
    let c!: CheckoutPage; let rows: 履歴の値[] = [];
    let h!: Awaited<ReturnType<typeof 在庫履歴を検索する>>;
    const 控える = async (呼び名: string) => { const no = await c.ご注文番号(); expect(no, "購入完了画面のご注文番号").not.toBe(""); notes.set(呼び名, no); };
    await step(1, async () => { c = await Aでログインして開く(page, seedId); });
    await ゆうパックで郵便振替(step, 2, c);
    await step(5, async () => { await 控える("〔注文番号-F0404-055A〕"); });
    await step(6, async () => { c = await もう一度カートに入れて開く(page, seedId); });
    await ゆうパックで郵便振替(step, 7, c);
    await step(10, async () => { await 控える("〔注文番号-F0404-055B〕"); });
    await step(11, async () => { await Bで管理画面にログインする(B.page); await B.page.goto(adminUrl("/product/stock/history")); await B.page.waitForLoadState("load"); });
    await step(12, async () => { h = await 在庫履歴を検索する(B.page, code, shop); });
    await step(13, async () => { rows = await 履歴の行(h); note(`在庫履歴の行: ${JSON.stringify(rows)}`); });
    await expected(async () => {
      expect.soft(rows.filter((r) => r.登録元 === "受注").length, "登録元が「受注」の行の数（2件）").toBe(2);
      const a = 照合する(rows, notes.get("〔注文番号-F0404-055A〕")), b = 照合する(rows, notes.get("〔注文番号-F0404-055B〕"));
      expect.soft(a.値, "1回目の注文（〔注文番号-F0404-055A〕）の行の変更前在庫・変更後在庫・在庫増減数・変更前総原価・変更後総原価").toEqual({ 変更前在庫: 10, 変更後在庫: 7, 在庫増減数: -3, 変更前総原価: 5000, 変更後総原価: 3500 });
      expect.soft(b.値, "2回目の注文（〔注文番号-F0404-055B〕）の行の変更前在庫・変更後在庫・在庫増減数・変更前総原価・変更後総原価").toEqual({ 変更前在庫: 7, 変更後在庫: 4, 在庫増減数: -3, 変更前総原価: 3500, 変更後総原価: 2000 });
    });
  } finally { await B.ctx.close(); }
});

// ---- 2026-11-20 追加: 通常の注文の確かめ（001・019・020）と、手順で DB を書き換えるケース（010〜017・048・049・050・060） ----
caseTest("IT-F04-04-001", async (ctx) => {
  const c = await 銀行振込の注文まで(ctx, "S-F04-04-NORMAL-001");
  await ctx.expected(async () => {
    expect.soft(await c.購入完了画面か(), "完了処理後に購入完了画面が表示される").toBe(true);
  });
});

caseTest("IT-F04-04-019", async (ctx) => {
  const seedId = "S-F04-04-NORMAL-019"; let 後 = { 回数: -1, 金額: -1 };
  const メール = 準備の(seedId).会員.メール;
  const 前 = 会員の累計(メール);
  note(`開始時の会員の累計購入回数・累計購入金額: ${JSON.stringify(前)}`);
  const c = await 銀行振込の注文まで(ctx, seedId, async () => { 後 = 会員の累計(メール); note(`注文後の累計購入回数・累計購入金額: ${JSON.stringify(後)}`); });
  await ctx.expected(async () => {
    expect.soft(await c.購入完了画面か(), "購入完了画面へ移った").toBe(true);
    expect.soft(後, "累計購入回数 2→3・累計購入金額 3000→4500").toEqual({ 回数: 3, 金額: 4500 });
  });
});

caseTest("IT-F04-04-020", async (ctx) => {
  const seedId = "S-F04-04-NORMAL-020"; const code = rc("F0404-NORMAL-020");
  let 商品 = { 総在庫: -1, 総原価: -1 }; let 明細 = { 件数: -1, 注文数: -1, 総原価: -1 };
  const c = await 銀行振込の注文まで(ctx, seedId, async () => {
    商品 = 商品の総在庫と総原価(code); 明細 = 受注の明細(ctx.notes.get("〔受注ID-F0404-020〕"), code);
    note(`商品情報: ${JSON.stringify(商品)}・受注情報の明細: ${JSON.stringify(明細)}`);
  });
  await ctx.expected(async () => {
    expect.soft(await c.購入完了画面か(), "購入完了画面へ移った").toBe(true);
    expect.soft(商品, "商品情報の総在庫 10→7・総原価 5000→3500").toEqual({ 総在庫: 7, 総原価: 3500 });
    expect.soft({ 注文数: 明細.注文数, 総原価: 明細.総原価 }, "受注情報の注文数 3・総原価 1500").toEqual({ 注文数: 3, 総原価: 1500 });
  });
});

type 変更 = { 内容: string; 実行: (notes: CaseCtx["notes"]) => void };
/** 手順1「ご注文方法指定画面を開く」・手順2「DBで…を変更する」・手順3「注文する」・（あれば）手順4「カート画面を開く」 */
function DBを変えて注文する(seedId: string, 変更: 変更, a: { システムエラー?: boolean; カート?: { コード: string; 数量: number }[] }) {
  return async (ctx: CaseCtx): Promise<void> => {
    await 専用ブラウザにする(ctx.page.context(), seedId);
    const c = new CheckoutPage(ctx.page);
    let 行: { 規格ID: string; 数量: number }[] = [];
    await ctx.step(1, async () => { await c.ご注文方法指定画面を開く(); });
    await ctx.step(2, async () => { 変更.実行(ctx.notes); note(`DBを書き換えた（E2E が作った行だけ・依頼者決定 2026-11-10）: ${変更.内容}`); });
    await ctx.step(3, async () => { note(チェックの注記); await 注文する(c); });
    if (a.カート) await ctx.step(4, async () => { 行 = await カートの中身(ctx.page); note(`カート画面の行: ${JSON.stringify(行)}`); });
    await ctx.expected(async () => {
      if (a.システムエラー) test.info().annotations.push({ type: "正本の外の補い", description: "システムエラー画面は、アプリのエラー画面（購入エラー・/shopping/error）またはシステムエラーの文が出る画面として判定した" });
      if (a.システムエラー) expect.soft(await c.システムエラー画面か() && !(await c.購入完了画面か()), "システムエラー画面へ遷移する").toBe(true);
      for (const k of a.カート ?? []) {
        const 規格 = 商品規格ID(rc(k.コード));
        expect.soft(行.filter((r) => r.規格ID === 規格).map((r) => r.数量), `カートに商品コード ${k.コード} の商品が数量 ${k.数量} のまま残る`).toEqual([k.数量]);
      }
    });
  };
}
const 支払方法を代金引換に = (k: string): 変更 => ({ 内容: "受注の保持する支払方法を銀行振込から代金引換へ", 実行: (n) => 受注の支払方法を変える(`F04-04-${k}`, n.get(`〔受注ID-F0404-${k}〕`), "代金引換") });
const 非公開に = (コード: string): 変更 => ({ 内容: `商品コード ${コード} の商品公開ステータスを公開から非公開へ`, 実行: () => 商品を非公開にする(`F04-04 ${コード}`, rc(コード)) });
const 制限を2に = (コード: string): 変更 => ({ 内容: `商品コード ${コード} の購入制限数を3から2へ`, 実行: () => 購入制限数を変える(`F04-04 ${コード}`, rc(コード), 2) });
const 在庫を2に = (コード: string): 変更 => ({ 内容: `商品コード ${コード} の在庫数を3から2へ`, 実行: () => 在庫数を変える(`F04-04 ${コード}`, rc(コード), 2) });

caseTest("IT-F04-04-010", DBを変えて注文する("S-F04-04-PAYMENT-MISMATCH-010", 支払方法を代金引換に("010"), { システムエラー: true }));
caseTest("IT-F04-04-011", DBを変えて注文する("S-F04-04-PAYMENT-MISMATCH-011", 支払方法を代金引換に("011"), { カート: [{ コード: "F0404-PAY-011", 数量: 1 }] }));
caseTest("IT-F04-04-012", DBを変えて注文する("S-F04-04-PRIVATE-012", 非公開に("F0404-PRIVATE-012"), { システムエラー: true }));
caseTest("IT-F04-04-013", DBを変えて注文する("S-F04-04-PRIVATE-013", 非公開に("F0404-PRIVATE-013"), { カート: [{ コード: "F0404-PRIVATE-013", 数量: 1 }] }));
caseTest("IT-F04-04-014", DBを変えて注文する("S-F04-04-LIMIT-014", 制限を2に("F0404-LIMIT-014"), { システムエラー: true }));
caseTest("IT-F04-04-015", DBを変えて注文する("S-F04-04-LIMIT-015", 制限を2に("F0404-LIMIT-015"), { カート: [{ コード: "F0404-LIMIT-015", 数量: 3 }] }));
caseTest("IT-F04-04-016", DBを変えて注文する("S-F04-04-STOCK-ERROR-016", 在庫を2に("F0404-STOCK-016"), { システムエラー: true }));
caseTest("IT-F04-04-017", DBを変えて注文する("S-F04-04-STOCK-ERROR-017", 在庫を2に("F0404-STOCK-017"), { カート: [{ コード: "F0404-STOCK-017", 数量: 3 }] }));
caseTest("IT-F04-04-048", DBを変えて注文する("S-F04-04-MIXED-048", 非公開に("F0404-MIX-B-048"), {
  システムエラー: true, カート: [{ コード: "F0404-MIX-A-048", 数量: 1 }, { コード: "F0404-MIX-B-048", 数量: 1 }] }));

caseTest("IT-F04-04-049", async ({ page, browser, step, expected }) => {
  const seedId = "S-F04-04-MIXED-049"; const code = rc("F0404-MIX-A-049"); const shop = await 本店の店名(browser);
  await 専用ブラウザにする(page.context(), seedId);
  const c = new CheckoutPage(page); const B = await ブラウザBを開く(browser);
  try {
    let list!: Awaited<ReturnType<typeof 在庫を検索する>>; let v = { 行の数: -1, 在庫: null as number | null, 総原価: null as number | null };
    await step(1, async () => { await c.ご注文方法指定画面を開く(); });
    await step(2, async () => { 商品を非公開にする("F04-04 F0404-MIX-B-049", rc("F0404-MIX-B-049")); note("DBを書き換えた（E2E が作った行だけ）: 商品コード F0404-MIX-B-049 の商品公開ステータスを公開から非公開へ"); });
    await step(3, async () => { note(チェックの注記); await 注文する(c); });
    await step(4, async () => { await Bで管理画面にログインする(B.page); await Bで在庫検索を開く(B.page); });
    await step(5, async () => { list = await 在庫を検索する(B.page, code, shop); });
    await step(6, async () => { v = await 在庫と総原価(list, code, shop); note(`手順6: ${値の文(v)}`); });
    await expected(async () => {
      expect.soft({ 在庫: v.在庫, 総原価: v.総原価 }, "オンラインショップの行の在庫・総原価").toEqual({ 在庫: 10, 総原価: 5000 });
    });
  } finally { await B.ctx.close(); }
});

caseTest("IT-F04-04-050", async (ctx) => {
  const c = await 銀行振込の注文まで(ctx, "S-F04-04-UNLIM-050");
  await ctx.expected(async () => {
    expect.soft(await c.システムエラー画面か(), "在庫エラー（システムエラー画面）にならない").toBe(false);
    expect.soft(await c.購入完了画面か(), "購入完了画面が表示される").toBe(true);
  });
});
caseTest("IT-F04-04-060", async (ctx) => {
  const c = await 銀行振込の注文まで(ctx, "S-F04-04-CBCHKUNLIM-060");
  await ctx.expected(async () => {
    expect.soft(await c.システムエラー画面か(), "システムエラー画面は表示されない").toBe(false);
    expect.soft(await c.購入完了画面か(), "購入完了画面が表示される").toBe(true);
  });
});
