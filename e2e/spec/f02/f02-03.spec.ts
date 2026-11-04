/**
 * F02-03 支店のグローバルナビ（PC版）。正本: cases/F02-03_test_cases.tsv
 * 画面だけで準備できるケースのうち、カテゴリ（手元の本来のカテゴリの子を足すシード）と画面幅390pxのケースは実装していない（記録を参照）。
 */
import { test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { expect, caseTest } from "../../lib/case";
import { LoginPage } from "../../pages/front/f06_03_login";
import { BranchNavPage } from "../../pages/front/f02_03_nav";
import { FIXTURES, 会員055パスワード, 会員055メール, 会員パスワード, 会員メール, 支店A, 支店B, 支店B056 } from "../../seeds/f02-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 画像の注記 = () => note("ご当地晴れる屋くんの画像は、正本がファイル名（branch-a.png・branch-b.png）だけを定めるため、色の違う小さな画像を試験用に作って使った（正本の外の補い）");

/** 試験会員でログインする（事前準備の「ログイン済みの状態」） */
async function ログインしておく(page: import("@playwright/test").Page, メール: string, パスワード: string): Promise<void> {
  const login = new LoginPage(page);
  await login.ログイン画面を開く("本店");
  await login.ログインする(メール, パスワード);
}

caseTest("IT-F02-03-001", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  const r: Record<string, string> = {};
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { r.A上 = await n.テキスト(n.ヘッダの支店名()); r.A下 = await n.テキスト(n.フッタの支店名()); });
  await step(3, async () => { await n.支店トップを開く(支店B.支店URL); });
  await step(4, async () => { r.B上 = await n.テキスト(n.ヘッダの支店名()); r.B下 = await n.テキスト(n.フッタの支店名()); });
  await expected(async () => {
    expect.soft(r.A上, "支店Aの画面上部の支店名").toBe("試験支店A");
    expect.soft(r.A下, "支店Aの画面下部の支店名").toBe("試験支店A");
    expect.soft(r.B上, "支店Bの画面上部の支店名").toBe("試験支店B");
    expect.soft(r.B下, "支店Bの画面下部の支店名").toBe("試験支店B");
  });
});

caseTest("IT-F02-03-002", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  const bytes: Record<string, Buffer | null> = {};
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); bytes.A = await n.ご当地晴れる屋くんのバイト列(); });
  await step(2, async () => { await n.支店トップを開く(支店B.支店URL); bytes.B = await n.ご当地晴れる屋くんのバイト列(); });
  await expected(async () => {
    const a = fs.readFileSync(path.join(FIXTURES, "branch-a.png")), b = fs.readFileSync(path.join(FIXTURES, "branch-b.png"));
    expect.soft(bytes.A !== null && bytes.A.equals(a), "支店Aに表示された画像が、支店A用の画像（branch-a.png）と同じか").toBe(true);
    expect.soft(bytes.B !== null && bytes.B.equals(b), "支店Bに表示された画像が、支店B用の画像（branch-b.png）と同じか").toBe(true);
  });
  画像の注記();
});

caseTest("IT-F02-03-007", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.詳細検索ボタン().click({ timeout: 30_000 }); await page.waitForTimeout(1000); });
  await expected(async () => {
    await expect.soft(n.詳細検索モーダル(), "詳細検索モーダル").toHaveClass(/is-visible/);
  });
});

caseTest("IT-F02-03-008", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await expect(n.ヘッダの支店名(), "画面上部").toBeVisible(); });
  await expected(async () => {
    await expect.soft(n.ポイントの数字(), "ポイントの表示（表示されない）").toHaveCount(0);
    await expect.soft(n.ポイントの導線(), "ポイントの導線（表示されない）").toHaveCount(0);
  });
});

caseTest("IT-F02-03-009", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await ログインしておく(page, 会員メール(), 会員パスワード);
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  const v: string[] = [];
  await step(2, async () => { for (const t of await n.ポイントの数字().allInnerTexts()) v.push(t.replace(/\s+/g, " ").trim()); });
  await expected(async () => {
    expect.soft(v.length, "ポイント欄の数").toBeGreaterThan(0);
    expect.soft(v.every((t) => t === "1,200"), "ポイント欄の数字（すべて1,200）").toBe(true);
  });
});

caseTest("IT-F02-03-010", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await ログインしておく(page, 会員メール(), 会員パスワード);
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.押して遷移する(n.ポイントの導線()); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った先の画面（マイページ）").toMatch(/\/mypage\/?$/);
  });
});

caseTest("IT-F02-03-011", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.押して遷移する(n.ログインの導線()); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った先の画面（ログイン画面）").toMatch(/\/mypage\/login$/);
  });
});

caseTest("IT-F02-03-012", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await ログインしておく(page, 会員メール(), 会員パスワード);
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.押して遷移する(n.マイページの導線()); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った先の画面（マイページ）").toMatch(/\/mypage\/?$/);
  });
});

caseTest("IT-F02-03-013", async ({ page, browser, step, expected }) => {
  const n = new BranchNavPage(page);
  await ログインしておく(page, 会員メール(), 会員パスワード);
  let ログイン済み = 0, 未ログイン = 0;
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); ログイン済み = (await n.ログアウトの導線().first().isVisible()) ? 1 : 0; });
  await step(2, async () => {
    const ctx = await browser.newContext({ baseURL: page.url(), ignoreHTTPSErrors: true });
    try {
      const p2 = await ctx.newPage();
      const n2 = new BranchNavPage(p2);
      await n2.支店トップを開く(支店A.支店URL);
      未ログイン = await n2.ログアウトの導線().count();
    } finally { await ctx.close(); }
  });
  await expected(async () => {
    expect.soft(ログイン済み, "会員ログイン済みの画面のログアウトの導線の数").toBeGreaterThan(0);
    expect.soft(未ログイン, "会員未ログインの画面のログアウトの導線の数").toBe(0);
  });
});

caseTest("IT-F02-03-014", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await step(1, async () => { await n.支店のログイン画面を開く(支店A.支店URL); });
  await step(2, async () => { await n.押して遷移する(n.ヘッダのロゴ()); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname.replace(/\/$/, ""), "移った先の画面（支店ECTOP）").toBe(`/ja/${支店A.支店URL}`);
  });
});

caseTest("IT-F02-03-015", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await step(1, async () => { await n.支店のログイン画面を開く(支店A.支店URL); });
  await step(2, async () => { await n.押して遷移する(n.フッタのロゴ()); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname.replace(/\/$/, ""), "移った先の画面（支店ECTOP）").toBe(`/ja/${支店A.支店URL}`);
  });
});

caseTest("IT-F02-03-039", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  const r: Record<string, string> = {};
  const 読む = async (k: string) => {
    r[`${k}郵便`] = await n.テキスト(n.店舗情報の郵便番号()); r[`${k}住所`] = await n.テキスト(n.店舗情報の住所());
    r[`${k}電話`] = await n.テキスト(n.店舗情報の電話()); r[`${k}営業`] = await n.テキスト(n.店舗情報の営業時間());
  };
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); await 読む("A"); });
  await step(2, async () => { await n.支店トップを開く(支店B.支店URL); await 読む("B"); });
  await expected(async () => {
    for (const [k, s] of [["A", 支店A], ["B", 支店B]] as const) {
      expect.soft(r[`${k}郵便`], `支店${k}の郵便番号`).toContain(s.郵便番号);
      expect.soft(r[`${k}住所`], `支店${k}の住所`).toContain(`${s.都道府県}${s.住所1}${s.住所2}`);
      expect.soft(r[`${k}電話`], `支店${k}の電話番号`).toContain(s.電話番号);
      expect.soft(r[`${k}営業`], `支店${k}の営業時間`).toContain(s.営業時間);
    }
  });
});

caseTest("IT-F02-03-040", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  let tab: import("@playwright/test").Page | null = null;
  await step(2, async () => { tab = await n.押して新しいタブを開く(n.地図のリンク()); });
  await expected(async () => {
    expect.soft(tab?.url() ?? "", "新しいタブで開いたアドレス").toBe(支店A.地図URL);
  });
});

/** 支店ECTOPのフッタのリンクを押して、移った先の画面のアドレスを確かめる */
function フッタのリンク先(名前: string, 先: RegExp): import("../../lib/case").CaseBody {
  return async ({ page, step, expected }) => {
    const n = new BranchNavPage(page);
    await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
    await step(2, async () => { await n.押して遷移する(n.フッタのリンク(名前)); });
    await expected(async () => {
      expect.soft(new URL(page.url()).pathname, `移った先の画面（${名前}）のアドレス`).toMatch(先);
    });
  };
}
caseTest("IT-F02-03-041", フッタのリンク先("当サイトについて", /\/rules$/));
caseTest("IT-F02-03-042", フッタのリンク先("プライバシーポリシー", /privacy/));
caseTest("IT-F02-03-043", フッタのリンク先("特定商取引法に基づく表記", /transaction_notation$/));
caseTest("IT-F02-03-044", フッタのリンク先("お問い合わせ", /\/contact$/));

caseTest("IT-F02-03-052", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await expect(n.カートのリンク(), "カートの導線").toBeVisible(); });
  await step(3, async () => { await n.マウスオーバーする(n.カートのリンク()); await page.waitForTimeout(800); });
  await expected(async () => {
    await expect.soft(n.カートの商品数(), "カートの商品数（表示されない）").toHaveCount(0);
    await expect.soft(n.カートの商品概要(), "マウスオーバーで表示される商品概要（表示されない）").toHaveCount(0);
  });
});

caseTest("IT-F02-03-055", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await ログインしておく(page, 会員055メール(), 会員055パスワード);
  const v: string[] = [];
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { for (const t of await n.ポイントの数字().allInnerTexts()) v.push(t.replace(/\s+/g, " ").trim()); });
  await expected(async () => {
    expect.soft(v.length, "ポイント欄の数（非表示にならない）").toBeGreaterThan(0);
    expect.soft(v.every((t) => t === "0"), "ポイント欄の数字（すべて0）").toBe(true);
  });
});

caseTest("IT-F02-03-056", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await step(1, async () => { await n.支店トップを開く(支店B056.支店URL); });
  let tab: import("@playwright/test").Page | null = null;
  await step(2, async () => { tab = await n.押して新しいタブを開く(n.地図のリンク()); });
  await expected(async () => {
    expect.soft(tab?.url() ?? "", "新しいタブで開いたアドレス").toBe(支店B056.地図URL);
  });
});
