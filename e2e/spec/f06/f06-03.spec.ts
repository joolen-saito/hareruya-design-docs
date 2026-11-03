/**
 * F06-03 ログイン。正本: cases/F06-03_test_cases.tsv
 * 実装しないケース（記録 review/F06-03_progress_2026-11-03.md）: 送信元IPを固定する試験用リバースプロキシが要るもの、共有トークン用Cookieの名前が
 * 設計書にもアプリにも見つからないもの、ほか。ログイン状態の保持（共有の設定）を書き換えるケースは、基盤が1本だけで流し、終わるたびに元の値へ戻してDBで確かめる。
 */
import { Browser, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { BASE_URL } from "../../config/env";
import { hideDebugToolbar } from "../../lib/session";
import { LoginPage } from "../../pages/front/f06_03_login";
import { mailOf, PW, 保持を設定する, 保持を戻す } from "../../seeds/f06-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const URL補足 = "正本の期待結果は本番のURL（https://www.hareruyamtg.com/ja/…）で書かれている。手元の環境では接続先が違うので、同じ接続先の「/ja/…」の配下に留まることを確かめた";

const mypagePath = (p: string) => /^\/ja(\/osaka)?\/mypage\/?$/.test(p);

// ---- ナビゲーションのログイン ----
function ナビ(版: "PC" | "スマホ", 店: "本店" | "TC大阪支店") {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
  supplement(URL補足);
  const l = new LoginPage(page);
  await step(1, async () => { await l.表示を整える(版); await l.店のトップを開く(店); });
  await step(2, async () => { await l.ナビのログインを押す(版); });
  await expected(async () => {
    expect.soft(await l.ログイン画面である(), "ログイン画面が表示される").toBe(true);
    expect.soft(new URL(page.url()).origin, "接続先が変わらない").toBe(new URL(BASE_URL).origin);
    const prefix = 店 === "本店" ? "/ja/mypage/login" : "/ja/osaka/mypage/login";
    expect.soft(l.path(), `${店}の「/ja/…」配下のログイン画面のまま`).toBe(prefix);
  });
  };
}
caseTest("IT-F06-03-001", ナビ("PC", "本店"));
caseTest("IT-F06-03-002", ナビ("スマホ", "本店"));
caseTest("IT-F06-03-003", ナビ("PC", "TC大阪支店"));
caseTest("IT-F06-03-004", ナビ("スマホ", "TC大阪支店"));

// ---- ログイン画面の部品（ログアウト状態） ----
caseTest("IT-F06-03-009", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  await step(1, async () => { await l.ログイン画面を開く(); });
  await step(2, async () => { await expect(l.パンくず現在地, "パンくずリストの現在表示中ページ").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => { expect.soft(await l.現在地がリンクか(), "現在表示中ページが押下可能なリンクになっている").toBe(false); });
});
caseTest("IT-F06-03-010", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  await step(1, async () => { await l.ログイン画面を開く(); });
  await step(2, async () => { await l.押して遷移する(l.パンくずホーム); });
  await expected(async () => { expect.soft(l.path(), "遷移した画面（本店ECTOP）").toMatch(/^\/(ja\/?)?$/); });
});
caseTest("IT-F06-03-011", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  await step(1, async () => { await l.ログイン画面を開く(); });
  await step(2, async () => { await l.押して遷移する(l.パスワード再発行リンク); });
  await expected(async () => {
    expect.soft(l.path(), "遷移した画面（パスワード再発行）").toBe("/ja/forgot");
    expect.soft(await page.locator("form").filter({ has: page.locator('[name$="[login_email]"], [name*="email"]') }).count(), "パスワード再発行の入力フォームがある").toBeGreaterThan(0);
  });
});
caseTest("IT-F06-03-012", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  await step(1, async () => { await l.ログイン画面を開く(); });
  await step(2, async () => { await l.押して遷移する(l.会員情報登録ボタン); });
  await expected(async () => {
    expect.soft(l.path(), "遷移した画面（新規会員登録）").toBe("/ja/entry");
    expect.soft(await page.locator("form#entry_form").count(), "会員登録の入力フォームがある").toBe(1);
  });
});

// ---- 認証 ----
caseTest("IT-F06-03-008", async ({ page, step, expected }) => {
  supplement(URL補足);
  const l = new LoginPage(page);
  await step(1, async () => { await l.ログイン画面を開く("TC大阪支店"); await l.ログインする(mailOf("f0603-base-008"), PW); });
  await step(2, async () => { await l.ログイン画面を開く("TC大阪支店"); });
  await expected(async () => {
    expect.soft(l.path(), "TC大阪支店のマイページ画面（/ja/osaka/ 配下）").toMatch(/^\/ja\/osaka\/mypage\/?$/);
    expect.soft(await l.ログイン画面である(), "ログイン画面ではない").toBe(false);
  });
});
caseTest("IT-F06-03-013", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  await step(1, async () => { await l.ログイン画面を開く(); });
  await step(2, async () => { await l.ログインする(mailOf("f0603-base-013"), PW); });
  await step(3, async () => { await l.ログイン画面を開く(); });
  await expected(async () => {
    expect.soft(mypagePath(l.path()), `マイページ画面へ遷移する（実際 ${l.path()}）`).toBe(true);
    expect.soft(await l.ログイン画面である(), "ログイン画面ではない（認証状態が確立している）").toBe(false);
  });
});
caseTest("IT-F06-03-014", async ({ page, browser, step, expected }) => {
  const a = new LoginPage(page);
  const ctxB = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctxB);
    const b = new LoginPage(await ctxB.newPage());
    await step(1, async () => { await a.ログイン画面を開く(); await a.ログインする(mailOf("f0603-none"), PW); });
    await step(2, async () => { await b.ログイン画面を開く(); await b.ログインする(mailOf("f0603-base-014"), "Wrong!603"); });
    await expected(async () => {
      expect.soft(await a.ログイン画面である(), "ブラウザAはログイン画面に留まる").toBe(true);
      expect.soft(await b.ログイン画面である(), "ブラウザBはログイン画面に留まる").toBe(true);
      const ea = await a.認証エラー(), eb = await b.認証エラー();
      expect.soft(ea, "ブラウザAに認証エラーが表示される").not.toBe("");
      expect.soft(eb, "ブラウザAとブラウザBの認証エラーが同じ").toBe(ea);
    });
  } finally { await ctxB.close(); }
});
caseTest("IT-F06-03-016", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  await step(1, async () => { await l.ログイン画面を開く(); });
  await step(2, async () => { await l.入力する(mailOf("f0603-base-016"), PW); });
  await step(3, async () => {
    await page.evaluate(() => { document.querySelector('form#login_mypage [name="_csrf_token"]')?.remove(); });
    expect(await page.locator('form#login_mypage [name="_csrf_token"]').count(), "なりすまし対策トークンの入力要素の数").toBe(0);
  });
  await step(4, async () => { await l.ログインを押す(); });
  await expected(async () => {
    expect.soft(await l.ログイン画面である(), "ログイン画面に留まる").toBe(true);
    expect.soft(mypagePath(l.path()), "マイページ画面へ進んでいない").toBe(false);
    expect.soft(await l.認証エラー(), "認証エラーが表示される").not.toBe("");
  });
});
caseTest("IT-F06-03-017", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  await step(1, async () => { await l.ログイン画面を開く(); });
  await step(2, async () => { await l.入力する(mailOf("f0603-base-017"), PW); });
  await step(3, async () => {
    await page.evaluate(() => { (document.querySelector('form#login_mypage [name="_csrf_token"]') as HTMLInputElement).value = "invalid-token"; });
    expect(await page.locator('form#login_mypage [name="_csrf_token"]').inputValue(), "なりすまし対策トークンの値").toBe("invalid-token");
  });
  await step(4, async () => { await l.ログインを押す(); });
  await expected(async () => {
    expect.soft(await l.ログイン画面である(), "ログイン画面に留まる").toBe(true);
    expect.soft(mypagePath(l.path()), "マイページ画面へ進んでいない").toBe(false);
    expect.soft(await l.認証エラー(), "認証エラーが表示される").not.toBe("");
  });
});
caseTest("IT-F06-03-019", async ({ page, step, expected }) => {
  supplement(URL補足);
  const l = new LoginPage(page);
  await step(1, async () => { await l.ログイン画面を開く(); await l.ログインする(mailOf("f0603-base-019"), PW); });
  await step(2, async () => { await l.ログイン画面を開く("TC大阪支店"); });
  await expected(async () => {
    expect.soft(l.path(), "TC大阪支店のマイページ画面へ遷移する").toMatch(/^\/ja\/osaka\/mypage\/?$/);
    expect.soft(await l.ログイン画面である(), "ログイン画面ではない（支店で同じ会員のログイン状態が再確立された）").toBe(false);
  });
});

// ---- パスワードの長さ ----
function 長さ(mail: string, pw: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
  const l = new LoginPage(page);
  await step(1, async () => { await l.ログイン画面を開く(); });
  await step(2, async () => { await l.ログインする(mailOf(mail), pw); });
  await step(3, async () => { await l.ログイン画面を開く(); });
  await expected(async () => {
    expect.soft(mypagePath(l.path()), `マイページ画面へ遷移する（実際 ${l.path()}）`).toBe(true);
    expect.soft(await l.ログイン画面である(), "ログイン画面ではない（認証状態が確立している）").toBe(false);
  });
  };
}
caseTest("IT-F06-03-032", 長さ("f0603-policy12-032", "Aa1!abcdefgh"));
caseTest("IT-F06-03-033", 長さ("f0603-policy50-033", "Aa1!" + "x".repeat(46)));

// ---- ログイン状態の保持（共有の設定） ----
async function 保持の確認(browser: Browser): Promise<void> {
  expect(await 保持を戻す(browser), "共有の設定（ログイン状態の保持）を元の値へ戻せた").toBe("");
}
caseTest("IT-F06-03-040", async ({ page, browser, step, expected }) => {
  try {
    await 保持を設定する(browser, true);
    const l = new LoginPage(page);
    await step(1, async () => { await l.ログイン画面を開く(); });
    await expected(async () => {
      expect.soft(await l.保持の選択欄が見えているか(), "ログイン状態の保持の選択欄が表示される").toBe(true);
      note(`画面にあるのは隠し項目だけ: 保持の値=${await l.保持の隠し項目()}（見える選択欄は無い）`);
    });
  } finally { await 保持の確認(browser); }
});
caseTest("IT-F06-03-041", async ({ page, browser, step, expected }) => {
  try {
    await 保持を設定する(browser, false);
    const l = new LoginPage(page);
    await step(1, async () => { await l.ログイン画面を開く(); });
    await expected(async () => {
      expect.soft(await l.保持の選択欄が見えているか(), "ログイン状態の保持の選択欄が表示されない").toBe(false);
    });
  } finally { await 保持の確認(browser); }
});
caseTest("IT-F06-03-042", async ({ page, browser, step, expected }) => {
  try {
    await 保持を設定する(browser, true);
    const l = new LoginPage(page);
    let 前 = 0; let remember: { name: string; expires: number } | undefined;
    await step(1, async () => { await l.ログイン画面を開く(); });
    await step(2, async () => { await l.入力する(mailOf("f0603-base-042"), PW); });
    await step(3, async () => {
      note("ログイン状態の保持の選択欄が画面に見えないため、押せる選択欄が無い。隠し項目の値（保持あり）がそのまま送られる");
      前 = Date.now() / 1000;
      await l.ログインを押す();
    });
    await step(4, async () => {
      const cookies = await page.context().cookies();
      remember = cookies.find((c) => /REMEMBERME/i.test(c.name));
    });
    await expected(async () => {
      expect.soft(remember?.name ?? "（保持のCookieが無い）", "ログイン状態を保持するCookie").toMatch(/REMEMBERME/i);
      const days = remember ? (remember.expires - 前) / 86400 : 0;
      expect.soft(Math.round(days), "有効期限（ログイン成立時刻からの日数。1年後）").toBeGreaterThanOrEqual(364);
      expect.soft(Math.round(days), "有効期限（ログイン成立時刻からの日数。1年後）").toBeLessThanOrEqual(366);
    });
  } finally { await 保持の確認(browser); }
});

// ---- 遷移先・ログアウト ----
caseTest("IT-F06-03-046", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  await step(1, async () => { await l.URLを開く("/ja/mypage"); });
  await step(2, async () => { await l.ログインする(mailOf("f0603-base-046"), PW); });
  await expected(async () => {
    expect.soft(mypagePath(l.path()), `遷移先として指定されたマイページ画面（実際 ${l.path()}）`).toBe(true);
  });
});
caseTest("IT-F06-03-047", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  await step(1, async () => { await l.ログイン画面を開く(); });
  await step(2, async () => { await l.ログインする(mailOf("f0603-base-047"), PW); });
  await expected(async () => {
    expect.soft(l.path(), "サイトのルート（/）へ遷移する").toBe("/");
  });
});
caseTest("IT-F06-03-048", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  await step(1, async () => { await l.ログイン画面を開く(); await l.ログインする(mailOf("f0603-base-048"), PW); });
  await step(2, async () => {
    let ok = await l.ログアウトを押す();
    if (!ok) {
      note("ログイン直後の画面に「ログアウト」のリンクが見えない。会員メニューのあるマイページ画面を開いて押した");
      supplement("ログイン直後の画面（サイトのトップ）に見える「ログアウト」が無く、マイページ画面を開いてから「ログアウト」を押した");
      ok = await l.マイページのログアウトを押す();
    }
    expect(ok, "見えている「ログアウト」のリンクがある").toBe(true);
  });
  await step(3, async () => { await l.ログイン画面を開く(); });
  await expected(async () => {
    expect.soft(await l.ログイン画面である(), "ログイン画面が表示される（認証状態が終了している）").toBe(true);
  });
});
caseTest("IT-F06-03-049", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  await step(1, async () => { await l.ログイン画面を開く(); await l.ログインする(mailOf("f0603-base-049"), PW); });
  await step(2, async () => { await l.URLを開く("/ja/forgot"); });
  await step(3, async () => {
    const ok = await l.ログアウトを押す();
    expect(ok, "見えている「ログアウト」のリンクがある").toBe(true);
  });
  await expected(async () => {
    expect.soft(l.path(), "直前に表示していたパスワード再発行画面へ戻る").toBe("/ja/forgot");
  });
});
