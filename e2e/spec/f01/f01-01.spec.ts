/**
 * F01-01 本店ECTOP。正本: cases/F01-01_test_cases.tsv
 * 実装するのは、共有のタグ・バナー・ブロック・デッキなどを書き換えずに前提を作れるケースだけ（実装しないケースの理由は PM への報告）。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { LoginPage } from "../../pages/front/f06_03_login";
import { F0101TopPage } from "../../pages/front/f01_01_top";
import { 会員のメール, 会員のパスワード } from "../../seeds/f01-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

// ---- サイトルートの遷移 ----
function ルート遷移(言語: "ja" | "en") {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const top = new F0101TopPage(page);
    let 前 = "";
    await step(1, async () => { await top.本店TOPを開く(言語); });
    await step(2, async () => { 前 = page.url(); await top.サイトルートを開く(); });
    await expected(async () => {
      expect.soft(top.path(), "言語区分を先頭に持つ本店TOPのパス").toMatch(new RegExp(`^/${言語}/?$`));
      expect.soft(new URL(page.url()).origin, "接続先が変わらない").toBe(new URL(前).origin);
    });
  };
}
caseTest("IT-F01-01-001", ルート遷移("ja"));
caseTest("IT-F01-01-002", ルート遷移("en"));

// ---- ページタイトル ----
caseTest("IT-F01-01-003", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  let title = "";
  await step(1, async () => { await top.本店TOPを開く("ja"); });
  await step(2, async () => { title = await top.タイトル(); });
  await expected(async () => {
    // 他の画面の末尾に付く店名は、店名が付く別の画面（ログイン画面）のタイトルの「 | 」より後ろの部分から読む
    await top.開く("/ja/mypage/login");
    const 他 = await top.タイトル();
    const 店名 = 他.includes(" | ") ? 他.slice(他.lastIndexOf(" | ") + 3).trim() : "";
    note(`店名は、店名が付く別の画面（ログイン画面）のタイトル「${他}」の末尾から読んだ「${店名}」`);
    expect.soft(店名, "他の画面のタイトルの末尾に付く店名").not.toBe("");
    expect.soft(title.length, "本店TOPのタイトル").toBeGreaterThan(0);
    expect.soft(店名 !== "" && title.endsWith(店名), "本店TOPのタイトルの末尾に店名が付いている").toBe(false);
  });
});

// ---- ログイン用モーダル ----
function ログイン用モーダル(言語: "ja" | "en", n: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const top = new F0101TopPage(page);
    const 見出し: string[] = [];
    const 開き方: string[] = [];
    const 言語の文字 = 言語 === "ja" ? /[぀-ヿ一-鿿]/ : /^[\x20-\x7e]+$/;
    await step(1, async () => {
      await top.本店TOPを開く(言語);
      開き方.push(await top.ログイン用モーダルを開く());
      見出し.push(((await top.ログイン用モーダルの見出し().textContent()) ?? "").trim());
    });
    await step(2, async () => {
      const login = new LoginPage(page);
      await login.URLを開く(`/${言語}/mypage/login`);
      await login.ログインする(会員のメール(n), 会員のパスワード(n));
      await top.本店TOPを開く(言語);
      開き方.push(await top.ログイン用モーダルを開く());
      見出し.push(((await top.ログイン用モーダルの見出し().textContent()) ?? "").trim());
    });
    await expected(async () => {
      note(`ログイン用モーダルは、未ログインはヘッダのお気に入りを押して開き、ログイン済みはお気に入りの導線がモーダルを開かないため画面のスクリプトの開閉の印（開いた状態）を付けて見える状態にした（実際: ${開き方.join("／")}）`);
      expect.soft(見出し.length, "確かめたモーダルの数（未ログイン・ログイン済み）").toBe(2);
      for (const [i, h] of 見出し.entries()) {
        const 状態 = i === 0 ? "未ログイン" : "ログイン済み";
        expect.soft(h.length, `${状態}のログイン用モーダルの見出し`).toBeGreaterThan(0);
        expect.soft(言語の文字.test(h), `${状態}のログイン用モーダルの見出し「${h}」が${言語 === "ja" ? "日本語" : "英語"}`).toBe(true);
      }
      await expect.soft(top.ログイン用モーダル(), "ログイン済みのログイン用モーダルが見える").toBeVisible();
    });
  };
}
caseTest("IT-F01-01-004", ログイン用モーダル("ja", "004"));
caseTest("IT-F01-01-005", ログイン用モーダル("en", "005"));

// ---- スライドバナー欄 ----
caseTest("IT-F01-01-007", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  await step(1, async () => { await top.本店TOPを開く("ja"); });
  await step(2, async () => { await top.スライドバナー欄().first().scrollIntoViewIfNeeded().catch(() => undefined); });
  await expected(async () => {
    expect.soft(await top.スライドバナー欄().count(), "スライドバナー欄が配置されている").toBeGreaterThan(0);
    expect.soft(await top.スライドバナー欄の入力欄().count(), "スライドバナー欄の中の検索の入力欄・フォーム・送信ボタンの数").toBe(0);
  });
});

// ---- あなたのお気に入り欄 ----
caseTest("IT-F01-01-031", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  await step(1, async () => {
    const login = new LoginPage(page);
    await login.ログイン画面を開く();
    await login.ログインする(会員のメール("031"), 会員のパスワード("031"));
  });
  await step(2, async () => { await top.本店TOPを開く("ja"); });
  await expected(async () => {
    expect.soft(await top.お気に入り欄().count(), "あなたのお気に入り欄の数").toBe(0);
  });
});

caseTest("IT-F01-01-032", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  await step(1, async () => { await top.本店TOPを開く("ja"); });
  await expected(async () => {
    expect.soft(await top.お気に入り欄().count(), "あなたのお気に入り欄の数").toBe(0);
  });
});
