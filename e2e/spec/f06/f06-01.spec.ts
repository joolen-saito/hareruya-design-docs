/**
 * F06-01 会員登録。正本: cases/F06-01_test_cases.tsv
 *
 * 実装しないケース（記録 review/F06-01_progress_2026-11-03.md）: 043（デッキ登録用ユーザーIDをDBへ直接設定するシード）、
 * 044・050（届いたメールの受信そのものを確かめる）、045・051・069（スマレジの試験環境）。
 * 「DB用テストフィクスチャで削除して各0件を確認する」シードを使うケースは、印を付けた新しいメールアドレスで開始時0件を成り立たせ、
 * DBの参照で確かめた（正本の外の補い。各ケースの注記と、判定の区分「条件付き」）。
 * 仮会員機能（共有の設定）を有効にするシードを使うケースは、基盤が1本だけで流す。書き換えたら元の値へ戻し、DBで確かめる。
 */
import { Browser, Page, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { BASE_URL } from "../../config/env";
import { rc } from "../../lib/run_marker";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { 会員, 会員の住所, 会員の選手 } from "../../db/f06_01";
import { EntryPage, 入力値 } from "../../pages/front/f06_01_entry";
import { deliveryRows, openEditFromResult, readEdit, resultCustomerId, resultRow, searchCustomer } from "../../pages/admin/f06_customer";
import { L_ADMIN, mailOf, PC_ADMIN, 仮会員機能を戻す } from "../../seeds/f06-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
/** 正本の外の補い（記録で条件付きに分ける） */
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 削除の補い = "シード表は「DB用テストフィクスチャで対象メールアドレスの会員と関連データを削除し各0件を確認」と定めるが、DBへは書き込まない決まりのため、"
  + "メールアドレスの前半に実行の印を付けた新しいメールアドレスを使い、開始時に0件であることをDBの参照で確かめた";

async function 戻す(browser: Browser): Promise<void> {
  const ng = await 仮会員機能を戻す(browser);
  expect(ng, "共有の設定（仮会員機能）を元の値へ戻せた").toBe("");
}

// ---- 入力値（シード表の値。メールアドレスの前半には実行の印を付ける） ----
const PW = "Passw0rd!01";
const jp = (前半: string, o: Partial<入力値> = {}): 入力値 => ({
  姓: "晴", 名: "太郎", セイ: "ハレ", メイ: "タロウ", 生年月日: ["1990", "1", "2"], 性別: "男性", メール: mailOf(前半), パスワード: PW,
  国: "Japan", 郵便番号: "100-0001", 都道府県: "東京都", 住所1: "千代田区千代田", 住所2: "1-1", 電話番号: "0312345678",
  会社名: "晴屋テスト", 職業: "会社員", MTG姓: "HARE", MTG名: "TARO", ...o,
});
const us = (前半: string, o: Partial<入力値> = {}): 入力値 => ({
  姓: "Hare", 名: "Taro", セイ: "ハレ", メイ: "タロウ", 生年月日: ["1990", "1", "2"], 性別: "女性", メール: mailOf(前半), パスワード: PW,
  国: "United States", 郵便番号: "94105", 住所1: "San Francisco", 住所2: "Market Street 1", 住所3: "California", 電話番号: "14155550100",
  会社名: "Hareruya Test", 職業: "会社員", MTG姓: "HARE", MTG名: "TARO", ...o,
});

/** 会員登録画面を開いて入力し、「同意する」を押して確認画面まで進む */
async function 確認画面まで(e: EntryPage, v: 入力値): Promise<void> {
  await e.open();
  await e.fill(v);
  const r = await e.同意する();
  if (!r.sent) note(`「同意する」を押しても送信されなかった（ブラウザの入力チェック）: ${(await e.エラー文()).join(" / ")}`);
}

const SEP = /\s+/;
const lines = async (l: import("@playwright/test").Locator) => (await l.innerText()).split("\n").map((t) => t.trim()).filter(Boolean);

// ================= 画面の表示（環境のシードだけ） =================

caseTest("IT-F06-01-001", async ({ page, step, expected }) => {
  const e = new EntryPage(page);
  await step(1, async () => { await e.open(); });
  await expected(async () => {
    expect.soft((await e.f("country").locator("option:checked").innerText()).trim(), "国の初期値").toBe("Japan");
    expect.soft(await e.日本の郵便番号欄(), "日本の郵便番号形式（2つに分かれた入力欄）が表示されている").toBe(true);
    expect.soft(await e.海外の郵便番号欄(), "汎用の郵便番号入力欄は表示されない").toBe(false);
    expect.soft(await e.都道府県欄(), "住所(都道府県)が表示されている").toBe(true);
    expect.soft(await e.住所3欄(), "住所3が表示されない").toBe(false);
  });
});

caseTest("IT-F06-01-002", async ({ page, step, expected }) => {
  const e = new EntryPage(page);
  await step(1, async () => { await e.open(); });
  await step(2, async () => { await e.selectCountry("United States"); });
  await expected(async () => {
    expect.soft(await e.海外の郵便番号欄(), "汎用の郵便番号入力欄が表示されている").toBe(true);
    expect.soft(await e.日本の郵便番号欄(), "日本の郵便番号形式は表示されない").toBe(false);
    expect.soft(await e.都道府県欄(), "住所(都道府県)が表示されない").toBe(false);
    expect.soft(await e.住所3欄(), "住所3が表示されている").toBe(true);
  });
});

caseTest("IT-F06-01-003", async ({ page, step, expected }) => {
  const e = new EntryPage(page);
  await step(1, async () => { await e.open(); });
  await step(2, async () => { await e.selectCountry("United States"); });
  await step(3, async () => { await e.selectCountry("Japan"); });
  await expected(async () => {
    expect.soft(await e.日本の郵便番号欄(), "日本の郵便番号形式（2つに分かれた入力欄）が表示されている").toBe(true);
    expect.soft(await e.海外の郵便番号欄(), "汎用の郵便番号入力欄は表示されない").toBe(false);
    expect.soft(await e.都道府県欄(), "住所(都道府県)が表示されている").toBe(true);
    expect.soft(await e.住所3欄(), "住所3が表示されない").toBe(false);
  });
});

caseTest("IT-F06-01-004", async ({ page, step, expected }) => {
  const e = new EntryPage(page);
  await step(1, async () => { await e.open(); });
  await step(2, async () => {
    expect((await e.f("country").locator("option:checked").innerText()).trim(), "国が Japan").toBe("Japan");
  });
  await step(3, async () => {
    // 利用者が打つのと同じに、1文字ずつキーを押して入れる（住所の補完は入力のキー操作を見ている）
    await e.f("postalCode][postalCode01").click({ timeout: 30_000 });
    await e.f("postalCode][postalCode01").pressSequentially("100", { delay: 80, timeout: 30_000 });
    await e.f("postalCode][postalCode02").click({ timeout: 30_000 });
    await e.f("postalCode][postalCode02").pressSequentially("0001", { delay: 80, timeout: 30_000 });
    await e.f("postalCode][postalCode02").blur();
    // 郵便番号から住所を引くのは外部の郵便番号検索のスクリプト。結果が入るのを少し待つ
    await page.waitForTimeout(5_000);
  });
  await expected(async () => {
    expect.soft((await e.f("address][pref").locator("option:checked").innerText()).trim(), "住所(都道府県)が自動補完された").toBe("東京都");
    expect.soft(await e.f("address][addr01").inputValue(), "住所1が自動補完された（空でない）").not.toBe("");
  });
});

caseTest("IT-F06-01-005", async ({ page, step, expected }) => {
  const e = new EntryPage(page);
  await step(1, async () => { await e.open(); });
  await step(2, async () => { await e.selectCountry("United States"); });
  await step(3, async () => { await e.f("address][addr01").fill("", { timeout: 30_000 }); });
  await step(4, async () => {
    await e.f("abroadPostalCode").click({ timeout: 30_000 });
    await e.f("abroadPostalCode").pressSequentially("100-0001", { delay: 80, timeout: 30_000 });
    await e.f("abroadPostalCode").blur();
    await page.waitForTimeout(5_000);
  });
  await expected(async () => {
    expect.soft(await e.f("address][addr01").inputValue(), "住所1が自動補完されず空のまま").toBe("");
  });
});

caseTest("IT-F06-01-006", async ({ page, step, expected }) => {
  const e = new EntryPage(page);
  let opts: string[] = [];
  await step(1, async () => { await e.open(); });
  await step(2, async () => { opts = await e.国の選択肢(); });
  await expected(async () => {
    expect.soft(opts[0], "先頭の選択肢").toBe("選択してください");
    const rest = opts.slice(1);
    const sorted = [...rest].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
    expect.soft(rest.length, "国の数").toBeGreaterThan(1);
    expect.soft(rest.join("|"), "国名の昇順で並んでいる").toBe(sorted.join("|"));
  });
});

caseTest("IT-F06-01-007", async ({ page, step, expected }) => {
  const e = new EntryPage(page);
  let opts: string[] = [];
  await step(1, async () => { await e.open(); });
  await step(2, async () => { opts = await e.職業の選択肢(); });
  await expected(async () => {
    expect.soft(opts, "職業の選択肢に「会社員」がある").toContain("会社員");
    expect.soft(opts, "職業の選択肢に「学生」がある").toContain("学生");
  });
});

caseTest("IT-F06-01-008", async ({ page, step, expected }) => {
  const e = new EntryPage(page);
  await step(1, async () => { await e.open(); });
  await step(2, async () => {
    await expect(e.パンくず現在地.first(), "パンくずリストの現在表示中ページ").toBeVisible({ timeout: 30_000 });
  });
  await expected(async () => {
    expect.soft(await e.現在地がリンクか(), "現在表示中ページが押下可能なリンクになっている").toBe(false);
  });
});

caseTest("IT-F06-01-009", async ({ page, step, expected }) => {
  const e = new EntryPage(page);
  await step(1, async () => { await e.open(); });
  await step(2, async () => { await e.押して遷移する(e.パンくずホーム); });
  await expected(async () => {
    expect.soft(e.path, "遷移した画面（本店ECTOP）").toMatch(/^\/(ja\/?)?$/);
    expect.soft(e.path, "会員登録画面のままではない").not.toMatch(/entry/);
  });
});

caseTest("IT-F06-01-010", async ({ page, step, expected }) => {
  const e = new EntryPage(page);
  let target: Page = page;
  await step(1, async () => { await e.open(); });
  await step(2, async () => {
    const link = page.locator('a[href*="/help/agreement"]').first();
    const popup = page.context().waitForEvent("page", { timeout: 8_000 }).catch(() => null);
    await link.click({ timeout: 30_000 });
    const opened = await popup;
    if (opened) { note("利用規約のリンクは別のタブで開いた（リンクが別タブで開く作り）"); target = opened; await opened.waitForLoadState("load"); }
    else await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(new URL(target.url()).pathname, "遷移した画面（ご利用規約）").toMatch(/\/help\/agreement/);
    expect.soft(await target.title(), "ご利用規約画面のタイトル").toContain("ご利用規約");
    expect.soft(await target.locator("h1").allInnerTexts(), "ご利用規約画面の見出しに「利用規約」がある").toContain("利用規約");
  });
});

caseTest("IT-F06-01-011", async ({ page, step, expected }) => {
  const e = new EntryPage(page);
  await step(1, async () => { await e.open(); });
  await step(2, async () => { await e.押して遷移する(page.getByRole("link", { name: "戻る", exact: true })); });
  await expected(async () => {
    expect.soft(e.path, "遷移した画面（ECTOP）").toMatch(/^\/(ja\/?)?$/);
  });
});

caseTest("IT-F06-01-057", async ({ page, step, expected }) => {
  const e = new EntryPage(page);
  await step(1, async () => { await e.open(); });
  await step(2, async () => {
    expect((await e.f("country").locator("option:checked").innerText()).trim(), "国が Japan").toBe("Japan");
  });
  await step(3, async () => { await expect(e.f("postalCode][postalCode01"), "郵便番号欄").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    expect.soft(await page.getByText("郵便番号から自動入力").count() + await page.getByRole("button", { name: /郵便番号から自動入力/ }).count(), "「郵便番号から自動入力」ボタンの数").toBe(0);
  });
});

caseTest("IT-F06-01-058", async ({ page, step, expected }) => {
  const e = new EntryPage(page);
  let opts: string[] = [];
  await step(1, async () => { await e.open(); });
  await step(2, async () => { opts = await e.性別の選択肢(); });
  await expected(async () => {
    expect.soft(opts, "性別の選択肢に「男性」がある").toContain("男性");
    expect.soft(opts, "性別の選択肢に「女性」がある").toContain("女性");
  });
});
