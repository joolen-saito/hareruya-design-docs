/**
 * F06-03 ログインの続き（-b）。商品詳細のログインモーダルからの認証の失敗（005・006）と、ログイン状態の保持でブラウザを開き直したとき（043〜045）。
 * 正本: cases/F06-03_test_cases.tsv
 * 043〜045 はログイン状態の保持（共有の設定）を有効にして始め、終わるたびに元の値へ戻してDBで確かめる（基盤が1本だけで流す）。
 */
import { Browser, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { LoginPage } from "../../pages/front/f06_03_login";
import { FrontFavorite } from "../../pages/front/f03_08_favorite";
import { FrontRestock } from "../../pages/front/f03_07_restock_notify";
import { モーダルでログインを押す, 保持したまま開き直した状態にする, 保持のCookieか } from "../../pages/front/f06_03_modal_login";
import { mailOf, PW, 保持を設定する, 保持を戻す } from "../../seeds/f06-03";
import { 商品の } from "../../seeds/f06-03-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

// ---- 商品詳細のログインモーダルで、パスワードを誤る ----
caseTest("IT-F06-03-005", async ({ page, step, expected }) => {
  const r = new FrontRestock(page);
  const n = 商品の("F0603-NOTIFY");
  const l = new LoginPage(page);
  await step(1, async () => { await r.openDetail(n.productId); });
  await step(2, async () => {
    const res = await r.press(r.classButton(n.classId));
    note(`「入荷時に通知」を押した結果: ログインモーダル=${res.ログインモーダルが開いた ? "開いた" : "開かない"}・通知=${res.通知が出た ? res.通知の文 : "出ない"}`);
  });
  await step(3, async () => { await モーダルでログインを押す(page, "入荷時に通知", mailOf("f0603-base-005"), "Wrong!603"); });
  await expected(async () => {
    expect.soft(l.path(), "遷移した画面（本店のログイン画面）").toBe("/ja/mypage/login");
    expect.soft(await l.ログイン画面である(), "ログイン画面が表示される").toBe(true);
    expect.soft(await l.認証エラー(), "ログイン画面に認証エラーが表示される").not.toBe("");
  });
});

caseTest("IT-F06-03-006", async ({ page, step, expected }) => {
  const fav = new FrontFavorite(page);
  const f = 商品の("F0603-FAVORITE");
  const l = new LoginPage(page);
  await step(1, async () => { await fav.openDetail(f.productId); });
  await step(2, async () => {
    const res = await fav.押す();
    note(`「お気に入りに追加する」を押した結果: ログインモーダル=${res.ログインモーダルが開いた ? "開いた" : "開かない"}・通知=${res.通知が出た ? res.通知の文 : "出ない"}`);
  });
  await step(3, async () => { await モーダルでログインを押す(page, "お気に入り", mailOf("f0603-base-006"), "Wrong!603"); });
  await expected(async () => {
    expect.soft(l.path(), "遷移した画面（本店のログイン画面）").toBe("/ja/mypage/login");
    expect.soft(await l.ログイン画面である(), "ログイン画面が表示される").toBe(true);
    expect.soft(await l.認証エラー(), "ログイン画面に認証エラーが表示される").not.toBe("");
  });
});

// ---- ログイン状態の保持（共有の設定）。ブラウザを閉じて開き直した状態 ----
async function 保持の確認(browser: Browser): Promise<void> {
  expect(await 保持を戻す(browser), "共有の設定（ログイン状態の保持）を元の値へ戻せた").toBe("");
}
/** 事前準備②④: 保持を有効にし、専用のブラウザで保持を有効にしてログイン→ブラウザを閉じて開き直した状態にする */
async function 保持の状態を作る(ctx: CaseCtx, k: string): Promise<void> {
  await 保持を設定する(ctx.browser, true);
  const r = await 保持したまま開き直した状態にする(ctx.browser, ctx.page.context(), mailOf(`f0603-base-${k}`), PW);
  note(`事前準備④: 別のブラウザで保持を有効にしてログインし、そのブラウザを閉じた。閉じても残る Cookie（${r.移した.join("、")}）だけをこのブラウザへ移し、閉じると消える Cookie（${r.消えた.join("、") || "なし"}）は移していない（ブラウザを終了して同じプロファイルで開き直した状態の代わり）`);
}

caseTest("IT-F06-03-043", async (ctx) => {
  const { page, browser, step, expected } = ctx;
  try {
    await 保持の状態を作る(ctx, "043");
    const l = new LoginPage(page);
    await step(1, async () => { await l.ログイン画面を開く(); });
    await expected(async () => {
      expect.soft(await l.ログイン画面である(), "ログイン画面が表示される").toBe(true);
      await expect.soft(l.メール欄, "メールアドレス欄の初期表示").toHaveValue(mailOf("f0603-base-043"));
    });
  } finally { await 保持の確認(browser); }
});

caseTest("IT-F06-03-044", async (ctx) => {
  const { page, browser, step, expected } = ctx;
  try {
    await 保持の状態を作る(ctx, "044");
    const l = new LoginPage(page);
    await step(1, async () => { await l.ログイン画面を開く(); });
    await expected(async () => {
      expect(await l.ログイン画面である(), "ログイン画面が表示される（選択欄の有無を見る前提）").toBe(true);
      expect.soft(await l.保持の選択欄が見えているか(), "ログイン状態の保持の選択欄が表示されない").toBe(false);
    });
  } finally { await 保持の確認(browser); }
});

caseTest("IT-F06-03-045", async (ctx) => {
  const { page, browser, step, expected } = ctx;
  try {
    await 保持の状態を作る(ctx, "045");
    const l = new LoginPage(page);
    let 前 = 0; let remember: { name: string; value: string; expires: number } | undefined;
    let 見える = true; let 前の値 = "";
    await step(1, async () => {
      await l.ログイン画面を開く(); 見える = await l.保持の選択欄が見えているか();
      前の値 = (await page.context().cookies()).find(保持のCookieか)?.value ?? "";
    });
    await step(2, async () => {
      await l.パスワード欄.fill(PW);
      前 = Date.now() / 1000;
      await l.ログインを押す();
    });
    await step(3, async () => {
      const cookies = await page.context().cookies();
      remember = cookies.find(保持のCookieか);
      note(`ログイン後のログイン状態を保持する Cookie: ${remember ? `${remember.name}（有効期限 ${new Date(remember.expires * 1000).toISOString()}）` : "無い"}`);
    });
    await expected(async () => {
      expect.soft(見える, "保持の選択欄が非表示").toBe(false);
      expect.soft(l.path(), "ログインが成立してログイン画面から移った").not.toBe("/ja/mypage/login");
      expect.soft(remember?.name ?? "（保持のCookieが無い）", "ログイン状態を保持するCookie").toMatch(/remember_?me/i);
      expect.soft(!!remember && remember.value !== 前の値, "このログインで保持のCookieが発行し直された（保持が有効として処理された。開き直す前の値と違う）").toBe(true);
      const days = remember ? (remember.expires - 前) / 86400 : 0;
      expect.soft(Math.round(days), "有効期限（ログイン成立時刻からの日数。1年後）").toBeGreaterThanOrEqual(364);
      expect.soft(Math.round(days), "有効期限（ログイン成立時刻からの日数。1年後）").toBeLessThanOrEqual(366);
    });
  } finally { await 保持の確認(browser); }
});
