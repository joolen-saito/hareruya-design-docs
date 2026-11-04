/**
 * F06-21 退会。正本: cases/F06-21_test_cases.tsv
 * 実装するのは、退会そのものを行わないケース（画面の遷移・表示・パンくず・パスワードの誤りと未入力）。
 * 実装しないケース: 退会を完了するもの（026〜034・038〜041）、なりすまし対策の照合値を開発者ツールで書き換えるもの（020〜023）、
 * スマレジ・メール・環境設定の書き換えを要するもの。記録 review/F06-21_progress_2026-11-04.md
 */
import { caseTest, expect } from "../../lib/case";
import { 退会試験の会員 } from "../../db/f06_21";
import { available } from "../../lib/db";
import { WithdrawPage } from "../../pages/front/f06_21_withdraw";
import { mailOf, PW } from "../../seeds/f06-21";

const 会員 = () => ({ メール: mailOf("f0621-ja"), PW });

// ---- ログアウト状態 ----
caseTest("IT-F06-21-004", async ({ page, step, expected }) => {
  const w = new WithdrawPage(page);
  await step(1, async () => { await w.退会前を開く(); });
  await expected(async () => {
    expect.soft(w.path, "遷移した画面（会員ログイン画面）").toBe("/ja/mypage/login");
    expect.soft(await w.ログイン画面である(), "会員ログイン画面が表示される").toBe(true);
  });
});
caseTest("IT-F06-21-005", async ({ page, step, expected }) => {
  const w = new WithdrawPage(page);
  await step(1, async () => { await w.退会前を開く(); });
  await expected(async () => {
    expect.soft(w.path, "遷移した画面（会員ログイン画面）").toBe("/ja/mypage/login");
    expect.soft(await w.ログイン画面である(), "会員ログイン画面が表示される（退会確認画面は表示されない）").toBe(true);
  });
});
caseTest("IT-F06-21-006", async ({ page, step, expected }) => {
  const w = new WithdrawPage(page);
  await step(1, async () => { await w.退会完了を開く(); });
  await expected(async () => {
    expect.soft(w.path, "退会完了画面のアドレスのまま").toBe("/ja/mypage/withdraw_complete");
    expect.soft(await w.退会完了画面である(), "退会完了画面が表示される").toBe(true);
  });
});
caseTest("IT-F06-21-014", async ({ page, step, expected }) => {
  const w = new WithdrawPage(page);
  await step(1, async () => { await w.退会完了を開く(); });
  await step(2, async () => { await w.押して遷移する(w.パンくずホーム); });
  await expected(async () => { expect.soft(w.path, "遷移した画面（ECTOP）").toMatch(/^\/(ja\/?)?$/); });
});
caseTest("IT-F06-21-015", async ({ page, step, expected }) => {
  const w = new WithdrawPage(page);
  await step(1, async () => { await w.退会完了を開く(); });
  await step(2, async () => { await w.押して遷移する(w.ホームへ戻る); });
  await expected(async () => { expect.soft(w.path, "遷移した画面（ECTOP）").toMatch(/^\/(ja\/?)?$/); });
});
caseTest("IT-F06-21-018", async ({ page, step, expected }) => {
  const w = new WithdrawPage(page);
  await step(1, async () => { await w.退会完了を開く(); });
  let 遷移した = true;
  await step(2, async () => { 遷移した = await w.現在地を押そうとする(); });
  await expected(async () => {
    expect.soft(遷移した, "現在表示中ページを押して遷移した").toBe(false);
    expect.soft(w.path, "退会完了画面のまま").toBe("/ja/mypage/withdraw_complete");
  });
});
caseTest("IT-F06-21-019", async ({ page, step, expected }) => {
  const w = new WithdrawPage(page);
  await step(1, async () => { await w.退会完了を開く(); });
  await step(2, async () => {
    await expect(w.パンくずのマイページ, "パンくずリストの「マイページ」").toHaveCount(1, { timeout: 30_000 });
    await w.パンくずのマイページ.click({ timeout: 10_000 }).catch(() => undefined);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(w.path, "退会完了画面のまま").toBe("/ja/mypage/withdraw_complete");
    expect.soft(await w.退会完了画面である(), "退会完了画面が表示されたまま").toBe(true);
  });
});

// ---- 会員（退会前・退会確認の画面） ----
async function ログイン(w: WithdrawPage): Promise<void> { await w.ログインする(mailOf("f0621-ja"), PW); }

caseTest("IT-F06-21-001", async ({ page, step, expected }) => {
  const w = new WithdrawPage(page);
  await ログイン(w);
  await step(1, async () => { await w.マイページを開く(); });
  await step(2, async () => { await w.押して遷移する(w.マイページのリンク); });
  await expected(async () => {
    expect.soft(w.path, "遷移した画面（退会前）").toBe("/ja/mypage/withdraw");
    expect.soft(await w.退会前画面である(), "退会前画面が表示される").toBe(true);
  });
});
caseTest("IT-F06-21-002", async ({ page, step, expected }) => {
  const w = new WithdrawPage(page);
  await ログイン(w);
  let 前 = 0, 確認 = 0, 完了 = 0;
  await step(1, async () => { await w.退会前を開く(); 前 = await w.パンくず.count(); });
  await step(2, async () => { await w.押して遷移する(w.退会手続きへ); 確認 = await w.パンくず.count(); });
  await step(3, async () => { await w.退会完了を開く(); 完了 = await w.パンくず.count(); });
  await expected(async () => {
    expect.soft(前, "退会前画面のパンくずリストの数").toBe(1);
    expect.soft(確認, "退会確認画面のパンくずリストの数").toBe(1);
    expect.soft(完了, "退会完了画面のパンくずリストの数").toBe(1);
  });
});
caseTest("IT-F06-21-003", async ({ page, step, expected }) => {
  const w = new WithdrawPage(page);
  await ログイン(w);
  let 前 = "", 確認 = "";
  await step(1, async () => { await w.退会前を開く(); 前 = await w.画面上部の文(); });
  await step(2, async () => { await w.押して遷移する(w.退会手続きへ); 確認 = await w.画面上部の文(); });
  await expected(async () => {
    expect.soft(前, "退会前画面の画面上部にユーザ名「退会試験 太郎」が表示されない").not.toMatch(/退会試験/);
    expect.soft(確認, "退会確認画面の画面上部にユーザ名「退会試験 太郎」が表示されない").not.toMatch(/退会試験/);
  });
});
caseTest("IT-F06-21-007", async ({ page, step, expected }) => {
  const w = new WithdrawPage(page);
  await ログイン(w);
  await step(1, async () => { await w.退会前を開く(); });
  await step(2, async () => { await w.押して遷移する(w.戻る); });
  await expected(async () => { expect.soft(w.path, "遷移した画面（マイページ）").toMatch(/^\/ja\/mypage\/?$/); });
});
caseTest("IT-F06-21-008", async ({ page, step, expected }) => {
  const w = new WithdrawPage(page);
  await ログイン(w);
  let 状態: ReturnType<typeof 退会試験の会員> = [];
  await step(1, async () => { await w.退会前を開く(); });
  await step(2, async () => { await w.押して遷移する(w.戻る); });
  await step(3, async () => { 状態 = available ? 退会試験の会員(mailOf("f0621-ja")) : []; });
  await expected(async () => {
    expect.soft(状態.length, "試験会員の数（メールアドレスが変わっていなければ1件）").toBe(1);
    expect.soft(状態[0]?.削除済み, "削除フラグ（0のまま）").toBe("0");
  });
});
caseTest("IT-F06-21-009", async ({ page, step, expected }) => {
  const w = new WithdrawPage(page);
  await ログイン(w);
  await step(1, async () => { await w.退会前を開く(); });
  await step(2, async () => { await w.押して遷移する(w.退会手続きへ); });
  await expected(async () => { expect.soft(await w.退会確認画面である(), "退会確認画面が表示される").toBe(true); });
});
caseTest("IT-F06-21-010", async ({ page, step, expected }) => {
  const w = new WithdrawPage(page);
  await ログイン(w);
  await step(1, async () => { await w.退会前を開く(); });
  await step(2, async () => { await w.押して遷移する(w.退会手続きへ); });
  await step(3, async () => { await w.押して遷移する(w.戻る); });
  await expected(async () => { expect.soft(w.path, "遷移した画面（マイページ）").toMatch(/^\/ja\/mypage\/?$/); });
});
caseTest("IT-F06-21-011", async ({ page, step, expected }) => {
  const w = new WithdrawPage(page);
  await ログイン(w);
  let 状態: ReturnType<typeof 退会試験の会員> = [];
  await step(1, async () => { await w.退会前を開く(); });
  await step(2, async () => { await w.押して遷移する(w.退会手続きへ); });
  await step(3, async () => { await w.押して遷移する(w.戻る); });
  await step(4, async () => { 状態 = available ? 退会試験の会員(mailOf("f0621-ja")) : []; });
  await expected(async () => {
    expect.soft(状態.length, "試験会員の数（メールアドレスが変わっていなければ1件）").toBe(1);
    expect.soft(状態[0]?.削除済み, "削除フラグ（0のまま）").toBe("0");
  });
});
caseTest("IT-F06-21-012", async ({ page, step, expected }) => {
  const w = new WithdrawPage(page);
  await ログイン(w);
  await step(1, async () => { await w.退会前を開く(); });
  await step(2, async () => { await w.押して遷移する(w.パンくずホーム); });
  await expected(async () => { expect.soft(w.path, "遷移した画面（本店ECTOP）").toMatch(/^\/(ja\/?)?$/); });
});
caseTest("IT-F06-21-013", async ({ page, step, expected }) => {
  const w = new WithdrawPage(page);
  await ログイン(w);
  await step(1, async () => { await w.退会前を開く(); });
  await step(2, async () => { await w.押して遷移する(w.退会手続きへ); });
  await step(3, async () => { await w.押して遷移する(w.パンくずホーム); });
  await expected(async () => { expect.soft(w.path, "遷移した画面（本店ECTOP）").toMatch(/^\/(ja\/?)?$/); });
});
caseTest("IT-F06-21-016", async ({ page, step, expected }) => {
  const w = new WithdrawPage(page);
  await ログイン(w);
  let 遷移した = true;
  await step(1, async () => { await w.退会前を開く(); });
  await step(2, async () => { 遷移した = await w.現在地を押そうとする(); });
  await expected(async () => {
    expect.soft(遷移した, "現在表示中ページを押して遷移した").toBe(false);
    expect.soft(await w.退会前画面である(), "退会前画面のまま").toBe(true);
  });
});
caseTest("IT-F06-21-017", async ({ page, step, expected }) => {
  const w = new WithdrawPage(page);
  await ログイン(w);
  let 遷移した = true;
  await step(1, async () => { await w.退会前を開く(); });
  await step(2, async () => { await w.押して遷移する(w.退会手続きへ); });
  await step(3, async () => { 遷移した = await w.現在地を押そうとする(); });
  await expected(async () => {
    expect.soft(遷移した, "現在表示中ページを押して遷移した").toBe(false);
    expect.soft(await w.退会確認画面である(), "退会確認画面のまま").toBe(true);
  });
});
caseTest("IT-F06-21-024", async ({ page, step, expected }) => {
  const w = new WithdrawPage(page);
  await ログイン(w);
  await step(1, async () => { await w.退会前を開く(); });
  await step(2, async () => { await w.押して遷移する(w.退会手続きへ); });
  await step(3, async () => { await w.パスワード欄.fill("WrongPass!F0621", { timeout: 30_000 }); });
  await step(4, async () => { await w.押して遷移する(w.退会する); });
  await expected(async () => { expect.soft(await w.退会確認画面である(), "退会確認画面に留まる").toBe(true); });
});
caseTest("IT-F06-21-025", async ({ page, step, expected }) => {
  const w = new WithdrawPage(page);
  await ログイン(w);
  let 状態: ReturnType<typeof 退会試験の会員> = [];
  await step(1, async () => { await w.退会前を開く(); });
  await step(2, async () => { await w.押して遷移する(w.退会手続きへ); });
  await step(3, async () => { await w.パスワード欄.fill("WrongPass!F0621", { timeout: 30_000 }); });
  await step(4, async () => { await w.押して遷移する(w.退会する); });
  await step(5, async () => { 状態 = available ? 退会試験の会員(mailOf("f0621-ja")) : []; });
  await expected(async () => {
    expect.soft(状態.length, "試験会員の数（メールアドレスが変わっていなければ1件）").toBe(1);
    expect.soft(状態[0]?.メール, "試験会員のメールアドレス").toBe(mailOf("f0621-ja"));
    expect.soft(状態[0]?.削除済み, "削除フラグ（0のまま）").toBe("0");
  });
});
caseTest("IT-F06-21-036", async ({ page, step, expected }) => {
  const w = new WithdrawPage(page);
  await w.ログインする(mailOf("f0621-036-ja"), PW);
  await step(1, async () => { await w.退会前を開く(); });
  await step(2, async () => { await w.押して遷移する(w.退会手続きへ); });
  await step(3, async () => { await w.押して遷移する(w.退会する); });
  await expected(async () => {
    expect.soft(await w.パスワードの下のエラー(), "パスワード欄の直下のエラー").toContain("パスワードに誤りがあります。");
    expect.soft(await w.退会確認画面である(), "退会確認画面に留まる").toBe(true);
  });
});
caseTest("IT-F06-21-037", async ({ page, step, expected }) => {
  const w = new WithdrawPage(page);
  await w.ログインする(mailOf("f0621-037-ja"), PW);
  let 状態: ReturnType<typeof 退会試験の会員> = [];
  await step(1, async () => { await w.退会前を開く(); });
  await step(2, async () => { await w.押して遷移する(w.退会手続きへ); });
  await step(3, async () => { await w.押して遷移する(w.退会する); });
  await step(4, async () => { 状態 = available ? 退会試験の会員(mailOf("f0621-037-ja")) : []; });
  await expected(async () => {
    expect.soft(状態.length, "試験会員の数（メールアドレスが変わっていなければ1件）").toBe(1);
    expect.soft(状態[0]?.メール, "試験会員のメールアドレス").toBe(mailOf("f0621-037-ja"));
    expect.soft(状態[0]?.削除済み, "削除フラグ（0のまま）").toBe("0");
  });
});
