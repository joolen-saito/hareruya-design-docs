/** F08-01 店頭買取査定申込前ログイン。正本: cases/F08-01_test_cases.tsv（画面だけで準備できる 002・012 を実装） */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { 会員の査定申込みの内容 } from "../../db/f08_01";
import { OtcInputPage } from "../../pages/front/f08_02_input";
import { OtcApplyPage } from "../../pages/front/f08_05_confirm";
import { MemberApplyPage } from "../../pages/front/f08_05_apply";
import { StoreEntryPage } from "../../pages/front/f08_store_url";
import { F0801の会員, PD_STORE } from "../../seeds/f08-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
/** 共通の試験店舗の支店URL（手順の店舗識別名 it_f0801_NNN の読み替え） */
const 支店URL = PD_STORE.支店URL;
const 店舗の読み替え = `手順の店舗識別名は、F08-05 と共通の試験店舗の支店URL「${支店URL}」として開いた（シード作成時の問題の読み替え）`;
/** 申込前ログイン画面の入力項目名（メールアドレス・パスワードの欄の見出し） */
const 項目名 = (page: import("@playwright/test").Page) => page.locator("form#login_otc_buy label").evaluateAll((els) => els.map((e) => (e.textContent ?? "").trim()));

// 存在しない店舗識別名
caseTest("IT-F08-01-002", async ({ page, step, expected }) => {
  const entry = new StoreEntryPage(page);
  let r = { status: 0, url: "" };
  await step(1, async () => { r = await entry.開く("it_f0801_no_store", "申込前ログイン"); });
  await expected(async () => {
    expect.soft(r.status, "HTTPの応答").toBe(404);
    await expect.soft(entry.ログイン欄(), "店頭買取査定申込前ログイン画面のログイン欄（表示されない）").toHaveCount(0);
  });
});

// 規則に合わない店舗識別名（ハイフン入り・300文字）
caseTest("IT-F08-01-012", async ({ page, step, expected }) => {
  const entry = new StoreEntryPage(page);
  let a = { status: 0, url: "" };
  let b = { status: 0, url: "" };
  await step(1, async () => { a = await entry.開く("it-f0801", "申込前ログイン"); });
  const ログイン欄 = [0, 0];
  await step(2, async () => {
    ログイン欄[0] = await entry.ログイン欄().count();
    b = await entry.開く("a".repeat(300), "申込前ログイン");
    ログイン欄[1] = await entry.ログイン欄().count();
  });
  await expected(async () => {
    expect.soft(a.status, "ハイフン入りの店舗識別名の要求のHTTP応答").toBe(404);
    expect.soft(b.status, "300文字の店舗識別名の要求のHTTP応答").toBe(404);
    expect.soft(ログイン欄[0], "ハイフン入りの店舗識別名で表示されたログイン欄の数（表示されない）").toBe(0);
    expect.soft(ログイン欄[1], "300文字の店舗識別名で表示されたログイン欄の数（表示されない）").toBe(0);
  });
});

// ================= 申込前ログイン画面の表示・言語 =================

caseTest("IT-F08-01-001", async ({ page, step, expected }) => {
  const entry = new StoreEntryPage(page);
  let r = { status: 0, url: "" };
  await step(1, async () => { r = await entry.開く(支店URL, "申込前ログイン"); });
  await expected(async () => {
    expect.soft(r.status, "HTTPの応答").toBe(200);
    await expect.soft(entry.ログイン欄(), "店頭買取査定申込前ログイン画面のログイン欄").toBeVisible();
    expect.soft(new URL(page.url()).pathname, "表示された画面のパス").toMatch(new RegExp(`/otcbuy/${支店URL}/entry$`));
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-01-003", async ({ page, step, expected }) => {
  const i = new OtcInputPage(page);
  await step(1, async () => { await i.申込前ログイン画面を開く(支店URL); });
  let 言語 = "";
  await step(2, async () => { 言語 = await i.申込前ログイン画面の言語(); });
  await expected(async () => { expect(言語, "Languageの選択状態").toBe("JP"); });
  note(店舗の読み替え);
});

caseTest("IT-F08-01-004", async ({ page, step, expected }) => {
  const i = new OtcInputPage(page);
  await step(1, async () => { await i.申込前ログイン画面を開く(支店URL); });
  await step(2, async () => { await i.申込前ログイン画面で言語を選ぶ("EN"); });
  await expected(async () => {
    expect.soft(await 項目名(page), "入力フォームの項目名（英語表記）").toEqual(["Email address", "Password"]);
    expect.soft(await i.申込前ログイン画面の言語(), "Languageの選択状態").toBe("EN");
  });
  note(`${店舗の読み替え}。入力フォームの項目名は、メールアドレス欄とパスワード欄の見出し`);
});

caseTest("IT-F08-01-005", async ({ page, step, expected }) => {
  const i = new OtcInputPage(page);
  await step(1, async () => { await i.申込前ログイン画面を開く(支店URL); });
  await step(2, async () => { await i.申込前ログイン画面で言語を選ぶ("EN"); });
  await step(3, async () => { await i.申込前ログイン画面で言語を選ぶ("JP"); });
  await expected(async () => {
    expect.soft(await 項目名(page), "入力フォームの項目名（日本語表記）").toEqual(["メールアドレス", "パスワード"]);
    expect.soft(await i.申込前ログイン画面の言語(), "Languageの選択状態").toBe("JP");
  });
  note(`${店舗の読み替え}。入力フォームの項目名は、メールアドレス欄とパスワード欄の見出し`);
});

// ================= ログイン・ゲスト導線 =================

caseTest("IT-F08-01-006", async ({ page, step, expected }) => {
  const m = F0801の会員("006");
  const i = new OtcInputPage(page);
  const form = page.locator("form#login_otc_buy");
  await step(1, async () => { await i.申込前ログイン画面を開く(支店URL); });
  await step(2, async () => {
    await form.locator('input[name="login_email"]').fill(m.メール);
    await form.locator('input[name="login_pass"]').fill(m.パスワード);
  });
  await step(3, async () => {
    await Promise.all([page.waitForURL(/\/otcbuy\/\w+(\?|$)/, { timeout: 60_000 }), form.locator('button[type="submit"]').dispatchEvent("click")]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った画面のパス（申込情報入力画面）").toMatch(new RegExp(`/otcbuy/${支店URL}$`));
    await expect.soft(i.欄("lastName"), "申込情報入力画面のお名前（姓）の欄").toBeVisible();
    expect.soft(await i.値("lastName"), "会員情報が入ったお名前（姓）").toBe(m.姓);
  });
  note(`${店舗の読み替え}。会員のメールアドレスは正本の前半に実行の印を付けた値（${m.メール}）。会員ログイン試行回数の記録は消していない`);
});

caseTest("IT-F08-01-007", async ({ page, step, expected }) => {
  const i = new OtcInputPage(page);
  const a = new OtcApplyPage(page);
  await step(1, async () => { await i.申込前ログイン画面を開く(支店URL); });
  await step(2, async () => { await a.アカウントなしで進む(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った画面のパス（当該店舗の申込情報入力画面）").toMatch(new RegExp(`/otcbuy/${支店URL}$`));
    await expect.soft(i.欄("lastName"), "申込情報入力画面のお名前（姓）の欄").toBeVisible();
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-01-009", async ({ page, step, expected }) => {
  const i = new OtcInputPage(page);
  let パス = "";
  await step(1, async () => { パス = await i.入力画面を開く(支店URL); });
  await expected(async () => {
    expect.soft(パス, "移った画面のパス（申込前ログイン画面）").toMatch(new RegExp(`/otcbuy/${支店URL}/entry$`));
    await expect.soft(i.ログイン欄(), "申込前ログイン画面のログイン欄").toBeVisible();
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-01-010", async ({ page, step, expected }) => {
  const i = new OtcInputPage(page);
  const a = new OtcApplyPage(page);
  // 事前準備: ゲスト導線で入力して次のページへ進み、入力内容を保持させる
  await i.申込前ログイン画面を開く(支店URL);
  await a.アカウントなしで進む();
  await a.入力する(
    { 言語: "JP", 国: "日本", 郵便番号: ["100", "0001"], 都道府県: "東京都", 住所1: "千代田区", 住所2: "千代田1-1", 生年月日: ["1990", "1", "1"], 電話: ["03", "8010", "0001"],
      職業: "会社員", サプライ: [], 電話連絡: "不必要", 大会参加: "いいえ", 適格請求書発行事業者: "いいえ", 利用規約同意: true },
    { 姓: "破棄確認", 名: "太郎", セイ: "ハキカクニン", メイ: "タロウ", 住所3: "F0801-010破棄確認ビル" });
  await i.次のページへ進むを押す();
  if (!(await i.会員登録フォームか())) throw new Error("事前準備: 入力して次のページへ進んでも会員登録フォームが表示されない（入力が保持されない）");
  await step(1, async () => { await i.申込前ログイン画面を開く(支店URL); });
  await step(2, async () => { await a.アカウントなしで進む(); });
  let v: Awaited<ReturnType<OtcInputPage["入力欄の値"]>> | null = null;
  await step(3, async () => { v = await i.入力欄の値(); });
  await expected(async () => {
    expect.soft([v!.姓, v!.名].join(" ").trim(), "お名前（保持していた「破棄確認 太郎」は表示されない）").not.toBe("破棄確認 太郎");
    expect.soft(v!.住所3, "住所3（保持していた「F0801-010破棄確認ビル」は表示されない）").not.toBe("F0801-010破棄確認ビル");
    expect.soft([v!.電話1, v!.電話2, v!.電話3].join("-"), "電話番号（保持していた「03-8010-0001」は表示されない）").not.toBe("03-8010-0001");
  });
  note(`${店舗の読み替え}。保持させる入力は、手順の前にケースのブラウザで、ゲスト導線で入力して次のページへ進み、会員登録フォームが出るところまで行った`);
});

caseTest("IT-F08-01-011", async ({ page, notes, step, expected }) => {
  const m = F0801の会員("011");
  const 会員ID = notes.get("〔会員ID-F0801-011〕");
  const apply = new MemberApplyPage(page);
  let 前: ReturnType<typeof 会員の査定申込みの内容> = [];
  let 後: ReturnType<typeof 会員の査定申込みの内容> = [];
  await step(1, async () => { 前 = 会員の査定申込みの内容(会員ID); });
  await step(2, async () => { await apply.申込前ログイン画面を開く(支店URL); });
  await step(3, async () => { await apply.ログインする(m.メール, m.パスワード); });
  await step(4, async () => { 後 = 会員の査定申込みの内容(会員ID); });
  await expected(async () => {
    expect.soft(前.length, "操作前の査定申込みの件数（準備した1件）").toBeGreaterThanOrEqual(1);
    expect.soft(後.length, "操作後の査定申込みの件数（変わらない）").toBe(前.length);
    expect.soft(後.map((r) => r.内容), "操作後の査定申込みの内容（変わらない）").toEqual(前.map((r) => r.内容));
  });
  note(`${店舗の読み替え}。査定申込は準備で会員の画面操作により1件作ったもの。内容は申込の全項目をまとめて操作の前後で比べた`);
});
