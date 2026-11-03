/**
 * M09-07 ブロック管理（一覧・登録・編集・削除）。正本: integration_test/casegen/cases/M09-07_test_cases.tsv
 * 実装した: 003 005 006 008 009 011 012 015 016 018 019 020 022 024 028 032 034 036 037 042 043 045 046 047 048。
 * 実装しない: 001 002 004 007 010（シードがDBでの直接設定・一時退避）、013 014（手順にDBでの削除不可への変更がある）、017 035 044（シードがDB）。
 * ブロック名・ファイル名には実行の印を付ける（seeds/m09-07.ts）。255文字・使用可能文字の値は印を付けない。
 */
import { test, expect as pwExpect, Page } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { BASE_URL } from "../../config/env";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { ブロック管理 } from "../../pages/admin/m09_07_block";
import { ブロックIDで, ブロック名で, ファイル名のPC向けブロック } from "../../db/m09_07_block";
import { ブロックのテンプレート } from "../../db/m09_template_files";
import { M0907_ADMIN, シードのブロック群, ブロック名の識別, ファイル名の識別 } from "../../seeds/m09-07";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const ログインして = async (page: Page) => { await loginAdmin(page, M0907_ADMIN); return new ブロック管理(page); };
const 結果の注記 = (r: { 成功: boolean; 入力エラー: string[]; システムエラー: boolean }) => { if (!r.成功) note(`登録できなかった: ${r.システムエラー ? "システムエラー" : r.入力エラー.join(" / ")}`); };
const 一覧のアドレス = /\/admin\/content\/block$/;

caseTest("IT-M09-07-003", async ({ page, step, expected }) => {
  const ba = await ログインして(page);
  await step(1, async () => { await ba.一覧を開く(); });
  await step(2, async () => { await ba.新規作成を押す(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移した画面のアドレス（ブロック管理(登録)）").toMatch(/\/admin\/content\/block\/new$/);
    await pwExpect.soft(page.locator("#block_name"), "ブロック名の入力欄（登録画面）").toBeVisible();
  });
});

caseTest("IT-M09-07-005", async ({ page, notes, step, expected }) => {
  void notes;
  const ba = await ログインして(page);
  let 読み込んだ行 = 0;
  await step(1, async () => { await ba.一覧を開く(); 読み込んだ行 = await ba.全行.count(); });
  await step(2, async () => { await ba.検索する("ZZZ-NOT-FOUND"); });
  await expected(async () => {
    expect.soft(読み込んだ行, "検索の前に読み込まれていた行の数（0件でない）").toBeGreaterThan(0);
    expect.soft(await ba.見えている行.count(), "「ZZZ-NOT-FOUND」で絞り込んだ一覧の表示件数").toBe(0);
  });
});

caseTest("IT-M09-07-006", async ({ page, notes, step, expected }) => {
  const a = notes.get("〔ブロックID-M0907-006A〕"); const b = notes.get("〔ブロックID-M0907-006B〕");
  const [bl, al] = [シードのブロック群("S-M09-07-LIST-006")[1], シードのブロック群("S-M09-07-LIST-006")[0]];
  const ba = await ログインして(page);
  await step(1, async () => { await ba.一覧を開く(); });
  await step(2, async () => { await ba.行(b).scrollIntoViewIfNeeded(); });
  await expected(async () => {
    for (const [id, 名] of [[b, bl.ブロック名], [a, al.ブロック名]] as const) {
      expect.soft(await ba.名前リンク(id).innerText(), `ID ${id} のブロック名（リンクで表示）`).toBe(名);
      expect.soft(await ba.編集リンク(id).isVisible(), `ID ${id} の編集リンクが表示されている`).toBe(true);
      expect.soft(await ba.削除ボタン(id).isVisible(), `ID ${id} の削除ボタンが表示されている`).toBe(true);
    }
  });
});

caseTest("IT-M09-07-008", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブロックID-M0907-008〕");
  const ba = await ログインして(page);
  await step(1, async () => { await ba.一覧を開く(); });
  await step(2, async () => { await Promise.all([page.waitForURL(/\/content\/block\/\d+\/edit/, { timeout: 60_000 }), ba.名前リンク(id).click({ timeout: 30_000 })]); });
  await expected(async () => { expect.soft(new URL(page.url()).pathname, "遷移した画面のアドレス（ブロック管理(編集)）").toMatch(new RegExp(`/admin/content/block/${id}/edit$`)); });
});
caseTest("IT-M09-07-009", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブロックID-M0907-009〕");
  const ba = await ログインして(page);
  await step(1, async () => { await ba.一覧を開く(); });
  await step(2, async () => { await Promise.all([page.waitForURL(/\/content\/block\/\d+\/edit/, { timeout: 60_000 }), ba.編集リンク(id).click({ timeout: 30_000 })]); });
  await expected(async () => { expect.soft(new URL(page.url()).pathname, "遷移した画面のアドレス（ブロック管理(編集)）").toMatch(new RegExp(`/admin/content/block/${id}/edit$`)); });
});

caseTest("IT-M09-07-011", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブロックID-M0907-011〕");
  const ba = await ログインして(page);
  let 行: ReturnType<typeof ブロックIDで> = null;
  await step(1, async () => { await ba.一覧を開く(); });
  await step(2, async () => { await ba.削除確認を開く(id); });
  await step(3, async () => { await ba.モーダルで削除する(id); });
  await step(4, async () => { 行 = ブロックIDで(id); });
  await expected(async () => { expect.soft(行, `ID ${id} のブロックがDBに無い`).toBeNull(); });
});
caseTest("IT-M09-07-012", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブロックID-M0907-012〕");
  const ba = await ログインして(page);
  await step(1, async () => { await ba.一覧を開く(); });
  await step(2, async () => { await ba.削除確認を開く(id); });
  await step(3, async () => { await ba.モーダルで削除する(id); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移後の画面のアドレス（ブロック管理(一覧)）").toMatch(一覧のアドレス);
    await pwExpect.soft(ba.検索ボックス, "一覧の検索ボックス").toBeVisible();
  });
});

caseTest("IT-M09-07-015", async ({ page, browser, notes, step, expected }) => {
  const id = notes.get("〔ブロックID-M0907-015〕");
  const baA = await ログインして(page);
  const ctxB = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctxB);
    const pageB = await ctxB.newPage();
    await loginAdmin(pageB, M0907_ADMIN);
    const baB = new ブロック管理(pageB);
    await step(1, async () => { await baA.一覧を開く(); await baA.削除確認を開く(id); });
    await step(2, async () => { await baB.一覧を開く(); await baB.削除確認を開く(id); await baB.モーダルで削除する(id); });
    await step(3, async () => {
      await Promise.all([
        page.waitForResponse((r) => r.request().method() === "POST" && /\/content\/block\/\d+\/delete/.test(r.url()), { timeout: 60_000 }),
        baA.モーダル(id).getByRole("link", { name: "削除" }).click({ timeout: 30_000 }),
      ]);
      await pwExpect(page.locator(".alert").filter({ hasNotText: "デバッグモード" }).first()).toBeVisible({ timeout: 60_000 });
    });
    await expected(async () => {
      expect.soft(new URL(page.url()).pathname, "ブラウザAに表示された画面のアドレス（ブロック管理(一覧)）").toMatch(一覧のアドレス);
      await pwExpect.soft(baA.検索ボックス, "ブラウザAの一覧の検索ボックス").toBeVisible();
    });
  } finally { await ctxB.close(); }
});

caseTest("IT-M09-07-016", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブロックID-M0907-016〕");
  const ba = await ログインして(page);
  let コード = "";
  await step(1, async () => { await ba.編集を開く(id, "ja"); });
  await step(2, async () => { コード = await ba.コードを読む(); });
  await expected(async () => { expect.soft(コード.trim(), "コード欄に初期表示された内容").toBe("編集前JA"); });
});

caseTest("IT-M09-07-018", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブロックID-M0907-018〕");
  const ba = await ログインして(page);
  let 日 = ""; let 英 = ""; let 英の画面言語: string | null = null;
  await step(1, async () => { await ba.編集を開く(id); });
  await step(2, async () => { await ba.言語を選ぶ("日本語"); });
  await step(3, async () => { 日 = (await ba.ファイル名の右横.innerText()).trim(); });
  await step(4, async () => { await ba.言語を選ぶ("英語"); 英の画面言語 = new URL(page.url()).searchParams.get("locale"); });
  await step(5, async () => { 英 = (await ba.ファイル名の右横.innerText()).trim(); });
  await expected(async () => {
    expect.soft(日, "日本語選択時のファイル名欄の右横").toBe(".ja.twig");
    expect.soft(英の画面言語, "英語選択時の画面の言語").toBe("en");
    expect.soft(英, "英語選択時のファイル名欄の右横").toBe(".en.twig");
  });
});

caseTest("IT-M09-07-019", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブロックID-M0907-019〕");
  const ba = await ログインして(page);
  const 見え = async () => ({
    ブロック名: await page.locator("#block_name").isVisible(), ファイル名: await page.locator("#block_file_name").isVisible(), コード: await page.locator("#editor").isVisible(),
  });
  let 閉じた後 = { ブロック名: true, ファイル名: true, コード: true }; let 開いた後 = { ブロック名: false, ファイル名: false, コード: false };
  await step(1, async () => { await ba.編集を開く(id); await pwExpect(ba.設定欄).toBeVisible({ timeout: 30_000 }); });
  await step(2, async () => { await ba.設定の開閉ボタン.click({ timeout: 30_000 }); await page.waitForTimeout(800); });
  await step(3, async () => { 閉じた後 = await 見え(); });
  await step(4, async () => { await ba.設定の開閉ボタン.click({ timeout: 30_000 }); await page.waitForTimeout(800); 開いた後 = await 見え(); });
  await expected(async () => {
    for (const [k, v] of Object.entries(閉じた後)) expect.soft(v, `開閉ボタンを押したあとの「${k}」の表示（非表示になる）`).toBe(false);
    for (const [k, v] of Object.entries(開いた後)) expect.soft(v, `開閉ボタンをもう1回押したあとの「${k}」の表示（再表示される）`).toBe(true);
  });
});

caseTest("IT-M09-07-020", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブロックID-M0907-020〕");
  const ba = await ログインして(page);
  await step(1, async () => { await ba.編集を開く(id); });
  await step(2, async () => { await Promise.all([page.waitForURL(一覧のアドレス, { timeout: 60_000 }), ba.一覧へのリンク.click({ timeout: 30_000 })]); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移後の画面のアドレス（ブロック管理(一覧)）").toMatch(一覧のアドレス);
    await pwExpect.soft(ba.検索ボックス, "一覧の検索ボックス").toBeVisible();
  });
});

// ---------- 登録 ----------
caseTest("IT-M09-07-022", async ({ page, step, expected }) => {
  const 名 = "あ".repeat(255); const 場所 = "a".repeat(255);
  const ba = await ログインして(page);
  let 行: ReturnType<typeof ファイル名のPC向けブロック> = [];
  await step(1, async () => { await ba.新規画面を開く(); });
  await step(2, async () => { await ba.入力する({ ブロック名: 名, ファイル名: 場所, コード: "<div>境界値</div>" }); });
  await step(3, async () => { 結果の注記(await ba.登録して結果を読む()); });
  await step(4, async () => { 行 = ファイル名のPC向けブロック(場所); });
  await expected(async () => {
    expect.soft(行.length, "ファイル名が「a」255文字のPC向けブロックの件数").toBe(1);
    expect.soft(行[0]?.ブロック名, "ブロック名（「あ」255文字）").toBe(名);
  });
});
caseTest("IT-M09-07-024", async ({ page, step, expected }) => {
  const 場所 = "user_data/test_123/ABC";
  const ba = await ログインして(page);
  let 行: ReturnType<typeof ファイル名のPC向けブロック> = [];
  await step(1, async () => { await ba.新規画面を開く(); });
  await step(2, async () => { await ba.入力する({ ブロック名: "使用可能文字ブロック", ファイル名: 場所, コード: "<div>正常コード</div>" }); });
  await step(3, async () => { 結果の注記(await ba.登録して結果を読む()); });
  await step(4, async () => { 行 = ファイル名のPC向けブロック(場所); });
  await expected(async () => {
    expect.soft(行.length, "ファイル名が「user_data/test_123/ABC」のブロックの件数").toBe(1);
    expect.soft(行[0]?.ブロック名, "ブロック名").toBe("使用可能文字ブロック");
  });
});
caseTest("IT-M09-07-028", async ({ page, step, expected }) => {
  const 名 = ブロック名の識別("遷移確認ブロック"); const 場所 = ファイル名の識別("user_data/transition_block");
  const ba = await ログインして(page);
  let 画面名 = "";
  await step(1, async () => { await ba.新規画面を開く(); });
  await step(2, async () => { await ba.入力する({ ブロック名: 名, ファイル名: 場所, コード: "<div>遷移確認</div>" }); });
  await step(3, async () => { 結果の注記(await ba.登録して結果を読む()); 画面名 = await page.locator("#block_name").inputValue().catch(() => ""); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移後の画面のアドレス（登録したブロックのブロック管理(編集)）").toMatch(/\/admin\/content\/block\/\d+\/edit$/);
    expect.soft(画面名, "ブロック名欄").toBe(名);
  });
});
caseTest("IT-M09-07-032", async ({ page, notes, step, expected }) => {
  const 場所 = シードのブロック群("S-M09-07-DUPLICATE-032")[0].ファイル名;
  const ba = await ログインして(page);
  let 件数 = -1; let 結果: Awaited<ReturnType<ブロック管理["登録して結果を読む"]>> | null = null;
  await step(1, async () => { await ba.新規画面を開く(); });
  await step(2, async () => { await ba.入力する({ ブロック名: ブロック名の識別("重複新規ブロック"), ファイル名: 場所, コード: "<div>重複新規</div>" }); });
  await step(3, async () => { 結果 = await ba.登録して結果を読む(); });
  await step(4, async () => { 件数 = ファイル名のPC向けブロック(場所).length; });
  await expected(async () => {
    expect.soft(件数, "同じファイル名のPC向けブロックの件数（1件のまま）").toBe(1);
    expect.soft(結果?.成功, "重複したファイル名での登録が成功しない").toBe(false);
  });
  void notes.get("〔ブロックID-M0907-032〕");
});

// ---------- 更新 ----------
caseTest("IT-M09-07-034", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブロックID-M0907-034〕");
  const ba = await ログインして(page);
  let 行: ReturnType<typeof ブロックIDで> = null;
  await step(1, async () => { await ba.編集を開く(id); });
  await step(2, async () => { await ba.入力する({ ブロック名: "自己ファイル名更新" }); });
  await step(3, async () => { 結果の注記(await ba.登録して結果を読む()); });
  await step(4, async () => { 行 = ブロックIDで(id); });
  await expected(async () => { expect.soft(行?.ブロック名, `ID ${id} のブロック名`).toBe("自己ファイル名更新"); });
});

caseTest("IT-M09-07-036", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブロックID-M0907-036〕");
  const ba = await ログインして(page);
  let 初期英 = ""; let 日 = ""; let 英 = "";
  await step(1, async () => { await ba.編集を開く(id, "en"); 初期英 = (await ba.コードを読む()).trim(); });
  await step(2, async () => { await ba.言語を選ぶ("日本語"); });
  await step(3, async () => { await ba.コードを入れる("更新後JA"); 結果の注記(await ba.登録して結果を読む()); });
  await step(4, async () => { await ba.編集を開く(id, "ja"); 日 = (await ba.コードを読む()).trim(); });
  await step(5, async () => { await ba.言語を選ぶ("英語"); 英 = (await ba.コードを読む()).trim(); });
  await expected(async () => {
    expect.soft(初期英, "英語の編集画面を開いたときのコード欄").toBe("編集前EN");
    expect.soft(日, "日本語のコード欄").toBe("更新後JA");
    expect.soft(英, "英語のコード欄（更新前のまま）").toBe("編集前EN");
  });
});
caseTest("IT-M09-07-045", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブロックID-M0907-045〕");
  const ba = await ログインして(page);
  let 初期日 = ""; let 英 = ""; let 日 = "";
  await step(1, async () => { await ba.編集を開く(id, "ja"); 初期日 = (await ba.コードを読む()).trim(); });
  await step(2, async () => { await ba.言語を選ぶ("英語"); });
  await step(3, async () => { await ba.コードを入れる("更新後EN-M0907-045"); 結果の注記(await ba.登録して結果を読む()); });
  await step(4, async () => { await ba.編集を開く(id, "en"); 英 = (await ba.コードを読む()).trim(); });
  await step(5, async () => { await ba.言語を選ぶ("日本語"); 日 = (await ba.コードを読む()).trim(); });
  await expected(async () => {
    expect.soft(初期日, "日本語の編集画面を開いたときのコード欄").toBe("編集前JA-M0907-045");
    expect.soft(英, "英語のコード欄").toBe("更新後EN-M0907-045");
    expect.soft(日, "日本語のコード欄（更新前のまま）").toBe("編集前JA-M0907-045");
  });
});

caseTest("IT-M09-07-037", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブロックID-M0907-037〕");
  const ba = await ログインして(page);
  await step(1, async () => { await ba.編集を開く(id); });
  await step(2, async () => { await ba.入力する({ ブロック名: "遷移確認更新ブロック" }); });
  await step(3, async () => { 結果の注記(await ba.登録して結果を読む()); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移後の画面のアドレス（保存したブロックのブロック管理(編集)）").toMatch(new RegExp(`/admin/content/block/${id}/edit$`));
  });
});

caseTest("IT-M09-07-042", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブロックID-M0907-042〕");
  const ba = await ログインして(page);
  await step(1, async () => { await ba.編集を開く(id); });
  await step(2, async () => { await ba.設定欄.scrollIntoViewIfNeeded(); });
  await expected(async () => {
    expect.soft(await ba.ファイル名欄.isVisible(), "ファイル名欄のテキストボックスが表示されている（表示されない＝false）").toBe(false);
  });
});
caseTest("IT-M09-07-043", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブロックID-M0907-043〕");
  const 元 = シードのブロック群("S-M09-07-OUTSIDE-043")[0].ファイル名;
  const ba = await ログインして(page);
  let 行: ReturnType<typeof ブロックIDで> = null;
  await step(1, async () => { await ba.編集を開く(id); });
  await step(2, async () => { await ba.入力する({ ブロック名: "範囲外更新後-043" }); });
  await step(3, async () => { 結果の注記(await ba.登録して結果を読む()); });
  await step(4, async () => { 行 = ブロックIDで(id); });
  await expected(async () => { expect.soft(行?.ファイル名, `ID ${id} のブロックのファイル名`).toBe(元); });
});

// ---------- 新規登録（日本語・英語のテンプレートが作られる） ----------
async function 新規登録ケース(page: Page, step: (n: number, f: () => Promise<void>) => Promise<void>, 言語: "日本語" | "英語", 名: string, 場所: string, コード: string) {
  const ba = await ログインして(page);
  const r = { ja: null as string | null, en: null as string | null, 行: [] as ReturnType<typeof ブロック名で> };
  await step(1, async () => { await ba.一覧を開く(); await ba.新規作成を押す(); await ba.エディタを待つ(); });
  await step(2, async () => { await ba.言語を選ぶ(言語); });
  await step(3, async () => { await ba.入力する({ ブロック名: 名, ファイル名: 場所, コード }); });
  await step(4, async () => { 結果の注記(await ba.登録して結果を読む()); });
  await step(5, async () => { r.ja = ブロックのテンプレート(場所, "ja"); r.en = ブロックのテンプレート(場所, "en"); });
  await step(6, async () => { r.行 = ブロック名で(名); });
  return r;
}
caseTest("IT-M09-07-046", async ({ page, step, expected }) => {
  const 名 = ブロック名の識別("新規登録日本語-M0907-CB046"); const 場所 = ファイル名の識別("user_data/m0907_cb046_file");
  const r = await 新規登録ケース(page, step, "日本語", 名, 場所, "<div>M0907-CB046</div>");
  await expected(async () => {
    expect.soft(r.ja !== null, `日本語用のファイル「${場所}.ja.twig」が作られている`).toBe(true);
    expect.soft(r.en !== null, `英語用のファイル「${場所}.en.twig」が作られている`).toBe(true);
    expect.soft(r.行.length, "ブロック名で探したブロックの件数").toBe(1);
    expect.soft(r.行[0]?.ファイル名, "登録されたブロックのファイル名").toBe(場所);
  });
});
caseTest("IT-M09-07-047", async ({ page, step, expected }) => {
  const 名 = ブロック名の識別("新規登録英語-M0907-CB047"); const 場所 = ファイル名の識別("user_data/m0907_cb047_file");
  const r = await 新規登録ケース(page, step, "英語", 名, 場所, "<div>M0907-CB047</div>");
  await expected(async () => {
    expect.soft(r.ja !== null, `日本語用のファイル「${場所}.ja.twig」が作られている`).toBe(true);
    expect.soft(r.en !== null, `英語用のファイル「${場所}.en.twig」が作られている`).toBe(true);
    expect.soft(r.行.length, "ブロック名で探したブロックの件数").toBe(1);
    expect.soft(r.行[0]?.ファイル名, "登録されたブロックのファイル名").toBe(場所);
  });
});

caseTest("IT-M09-07-048", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブロックID-M0907-048〕");
  const ba = await ログインして(page);
  let 行: ReturnType<typeof ブロックIDで> = null;
  await step(1, async () => { await ba.一覧を開く(); });
  await step(2, async () => { await ba.削除確認を開く(id); });
  await step(3, async () => { note(`確認の文: ${(await ba.モーダル(id).locator(".modal-body").innerText()).replace(/\s+/g, " ").trim()}`); await ba.モーダルでキャンセルする(id); });
  await step(4, async () => { 行 = ブロックIDで(id); });
  await expected(async () => { expect.soft(行?.ブロックID, `ID ${id} のブロックがDBに残っている`).toBe(id); });
});
