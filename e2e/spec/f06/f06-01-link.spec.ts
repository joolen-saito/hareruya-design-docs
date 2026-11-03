/**
 * F06-01 会員登録 ⇔ 管理画面の会員検索一覧・会員登録/編集画面の連携。正本: cases/F06-01_test_cases.tsv
 * ブラウザA＝フロントの会員登録、ブラウザB＝管理画面（別のブラウザセッション）。
 * 仮会員機能（共有の設定）を有効にするシードを使うので、基盤が1本だけで流す。書き換えたら元の値へ戻す。
 */
import { Browser, Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { BASE_URL } from "../../config/env";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { EntryPage, 入力値 } from "../../pages/front/f06_01_entry";
import { deliveryRows, openEditFromResult, readEdit, resultCustomerId, resultRow, searchCustomer } from "../../pages/admin/f06_customer";
import { L_ADMIN, mailOf, PC_ADMIN, 仮会員機能を戻す } from "../../seeds/f06-01";

const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 削除の補い = "シード表は「DB用テストフィクスチャで対象メールアドレスの会員と関連データを削除し各0件を確認」と定めるが、DBへは書き込まない決まりのため、"
  + "メールアドレスの前半に実行の印を付けた新しいメールアドレスを使い、開始時に0件であることをDBの参照で確かめた（シードの作り方の中）";

async function ブラウザB(browser: Browser): Promise<{ page: Page; close: () => Promise<void> }> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(context);
  return { page: await context.newPage(), close: () => context.close() };
}

const L = (n: string, 前半: string): 入力値 => ({
  姓: "晴", 名: "太郎", セイ: "ハレ", メイ: "タロウ", 生年月日: ["1990", "1", "2"], 性別: "男性", メール: mailOf(前半),
  パスワード: `Passw0rdF0601n${n}!0123`, 国: "Japan", 郵便番号: "1000001", 都道府県: "東京都", 住所1: "千代田区千代田", 住所2: "1-1",
  電話番号: "0312345678", 会社名: `晴屋連携L${n === "053" ? "001" : n === "054" ? "002" : n === "055" ? "003" : "004"}F0601n${n}`, 職業: "会社員", MTG姓: "HARE", MTG名: "TARO",
});

type 結果 = { b: { page: Page; close: () => Promise<void> }; id: string | null };

/** 手順1〜5（ブラウザAで登録 → ブラウザBで管理者ログイン → 会員検索）。ブラウザBは呼び出し側が閉じる */
async function 手順1から5({ page, browser, step }: CaseCtx, v: 入力値, admin: { loginId: string; password: string }, 受け取る: (r: 結果) => void): Promise<void> {
  supplement(削除の補い);
  const b = await ブラウザB(browser);
  const r: 結果 = { b, id: null };
  受け取る(r);
  const e = new EntryPage(page);
  await step(1, async () => { await e.open(); });
  await step(2, async () => { await e.fill(v); await e.同意する(); });
  await step(3, async () => { await e.登録する(); expect(e.完了画面か, "仮会員登録完了画面が表示された").toBe(true); });
  await step(4, async () => { await loginAdmin(b.page, admin); });
  await step(5, async () => { await searchCustomer(b.page, v.メール); r.id = await resultCustomerId(b.page, v.メール); });
}
async function 戻す(browser: Browser): Promise<void> {
  expect(await 仮会員機能を戻す(browser), "共有の設定（仮会員機能）を元の値へ戻せた").toBe("");
}
async function 終える(browser: Browser, r?: 結果): Promise<void> {
  await r?.b.close();
  await 戻す(browser);
}

caseTest("IT-F06-01-053", async (ctx) => {
  const v = L("053", "it-f0601-l-001");
  let r: 結果 | undefined;
  try {
    await 手順1から5(ctx, v, L_ADMIN, (x) => { r = x; });
    await ctx.expected(async () => {
      expect.soft(await resultRow(r!.b.page, v.メール).count(), `メールアドレス「${v.メール}」の会員の行の数`).toBe(1);
      expect.soft(r!.id ?? "", "その行の会員ID").toMatch(/^\d+$/);
    });
  } finally { await 終える(ctx.browser, r); }
});

caseTest("IT-F06-01-054", async (ctx) => {
  const v = L("054", "it-f0601-l-002");
  let r: 結果 | undefined;
  let mail = "";
  try {
    await 手順1から5(ctx, v, L_ADMIN, (x) => { r = x; });
    await ctx.step(6, async () => {
      const row = resultRow(r!.b.page, v.メール);
      await expect(row, "検索結果の該当行").toHaveCount(1, { timeout: 30_000 });
      mail = ((await row.locator("td", { hasText: v.メール }).first().innerText()) ?? "").trim();
    });
    await ctx.expected(async () => {
      expect.soft(mail, "該当行のメールアドレス").toBe(v.メール);
    });
  } finally { await 終える(ctx.browser, r); }
});

caseTest("IT-F06-01-055", async (ctx) => {
  const v = L("055", "it-f0601-l-003");
  let r: 結果 | undefined;
  let got: Record<string, string> = {};
  try {
    await 手順1から5(ctx, v, L_ADMIN, (x) => { r = x; });
    await ctx.step(6, async () => { await openEditFromResult(r!.b.page, v.メール); got = await readEdit(r!.b.page); });
    await ctx.expected(async () => {
      expect.soft(got["お名前姓"], "お名前姓").toBe("晴");
      expect.soft(got["お名前名"], "お名前名").toBe("太郎");
      expect.soft(got["会社名"], "会社名").toBe("晴屋連携L003F0601n055");
      expect.soft(got["国"], "国").toBe("Japan");
      expect.soft(got["都道府県"], "都道府県").toBe("東京都");
      expect.soft(got["住所1"], "住所1").toBe("千代田区千代田");
      expect.soft(got["住所2"], "住所2").toBe("1-1");
      expect.soft(got["メールアドレス"], "メールアドレス").toBe(v.メール);
      expect.soft(got["性別"], "性別").toBe("男性");
      expect.soft(got["職業"], "職業").toBe("会社員");
      expect.soft(`${got["生年月日年"]}/${got["生年月日月"]}/${got["生年月日日"]}`, "生年月日(年・月・日)").toBe("1990/1/2");
    });
  } finally { await 終える(ctx.browser, r); }
});

caseTest("IT-F06-01-056", async (ctx) => {
  const v = L("056", "it-f0601-l-004");
  let r: 結果 | undefined;
  let got: Record<string, string> = {};
  try {
    await 手順1から5(ctx, v, L_ADMIN, (x) => { r = x; });
    await ctx.step(6, async () => { await openEditFromResult(r!.b.page, v.メール); got = await readEdit(r!.b.page); });
    await ctx.expected(async () => {
      expect.soft(got["会員ステータス"], "会員ステータスで選択されている値").toBe("仮会員");
    });
  } finally { await 終える(ctx.browser, r); }
});

caseTest("IT-F06-01-067", async (ctx) => {
  const v: 入力値 = {
    姓: "登録", 名: "太郎", セイ: "トウロク", メイ: "タロウ", 生年月日: ["1990", "1", "2"], 性別: "男性", メール: mailOf("pc-f0601-001"),
    パスワード: "Passw0rd-PC0601a", 国: "Japan", 郵便番号: "1000001", 都道府県: "東京都", 住所1: "千代田区千代田", 住所2: "1番", 電話番号: "0312345678",
  };
  let r: 結果 | undefined;
  let rows: string[] = [];
  try {
    await 手順1から5(ctx, v, PC_ADMIN, (x) => { r = x; });
    await ctx.step(6, async () => { await openEditFromResult(r!.b.page, v.メール); rows = await deliveryRows(r!.b.page); });
    await ctx.expected(async () => {
      expect.soft(rows.filter((t) => t.includes("千代田区千代田")).length, "お届け先住所欄の、住所「千代田区千代田」を含む行の数").toBeGreaterThanOrEqual(1);
    });
  } finally { await 終える(ctx.browser, r); }
});
