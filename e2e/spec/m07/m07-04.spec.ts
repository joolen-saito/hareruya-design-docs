/**
 * M07-04 手動メール通知(入力画面)。正本: cases/M07-04_test_cases.tsv
 *
 * 001・002・006・007・008・012 は共有のものを書き換えない。003・005・009・011・013・014・018〜022・024 は、メールテンプレート（E2E が作る行をDBへ足す）と
 * 店舗のメール設定（共有の設定。書き換える前の全項目を控え、基盤がケースの終わりに画面から戻して確かめる）を使う（seeds/m07-04.ts）。
 * 実装しない: 004・023（手動送信の候補が「ちょうど7件」になるよう、共有の既存テンプレートを候補外にする必要がある）、010・015・016・017・025（テスト受信箱を読む。開発環境には無い）、
 * 026（別機能の画面で新規テンプレートを登録し、メール配信履歴のポップアップを見る。共有の画面の新規登録が前提）。
 * 手順の注記: 02査定テンプレの「選択時のメール本文」は、本文の雛形に差し込まれる本文上部に「刷新本文Ｂ2」を入れて表す（雛形はファイルで決まる）。
 * 手順の注記: 画面の買取番号は7桁表示なので、控えた買取番号を7桁に直して比べる。「買取編集画面へ戻る」は画面では「買取編集画面に戻る」。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { 通知送信履歴を読む, 買取受注レコード } from "../../db/m07_04_mail";
import { loginAdmin } from "../../lib/session";
import { ManualMailPage } from "../../pages/admin/m07_04_mail";
import { M0704_ADMIN } from "../../seeds/m07-04";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-M07-04-001", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0704_ADMIN);
  const m = new ManualMailPage(page);
  const 番号 = notes.get("〔買取番号-M0704-001〕");
  let 表示 = "";
  await step(1, async () => { await m.開く(番号); });
  await step(2, async () => { 表示 = await m.買取番号を読む(); });
  await expected(async () => {
    expect.soft(表示, "買取番号").toBe(m.期待の買取番号(番号));
  });
});

caseTest("IT-M07-04-002", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0704_ADMIN);
  const m = new ManualMailPage(page);
  let t = { 値: "", 表示: "" };
  let f = { 件名: "", 本文: "" };
  await step(1, async () => { await m.開く(notes.get("〔買取番号-M0704-002〕")); });
  await step(2, async () => { t = await m.テンプレートの選択状態(); f = await m.件名と本文を読む(); });
  await expected(async () => {
    expect.soft(t.値, "テンプレ選択の値（未選択は空）").toBe("");
    expect.soft(f.件名, "件名").toBe("");
    expect.soft(f.本文, "メール本文").toBe("");
  });
});

caseTest("IT-M07-04-006", async ({ page, step, expected }) => {
  await loginAdmin(page, M0704_ADMIN);
  const m = new ManualMailPage(page);
  let status = 0;
  await step(1, async () => { await m.URLを開く("/purchase/mail"); });
  await step(2, async () => { status = m.直近のステータス; });
  await expected(async () => {
    expect.soft(status, "買取番号を指定しない要求のHTTPステータス").toBe(404);
  });
});

caseTest("IT-M07-04-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M0704_ADMIN);
  const m = new ManualMailPage(page);
  let status = 0;
  await step(1, async () => { await m.開く("9999999"); });
  await step(2, async () => { status = m.直近のステータス; });
  await expected(async () => {
    expect.soft(status, "存在しない買取番号9999999を指定した要求のHTTPステータス").toBe(404);
  });
});

caseTest("IT-M07-04-008", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0704_ADMIN);
  const m = new ManualMailPage(page);
  const 番号 = notes.get("〔買取番号-M0704-008〕");
  await step(1, async () => { await m.開く(番号); });
  await step(2, async () => { await m.買取編集画面へ戻る(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移先のパス").toMatch(new RegExp(`/purchase/${Number(番号)}/edit$`));
  });
});

caseTest("IT-M07-04-012", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0704_ADMIN);
  const m = new ManualMailPage(page);
  const 番号 = notes.get("〔買取番号-M0704-012〕");
  await step(1, async () => { await m.開く(番号); });
  await step(2, async () => { await m.件名と本文を入れる("テンプレ未選択件名", "テンプレ未選択本文"); });
  await step(3, async () => { await m.テンプレのrequiredを外す(); });
  await step(4, async () => { await m.確認を押す(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "開き直された画面のパス").toMatch(new RegExp(`/purchase/${Number(番号)}/mail$`));
    expect.soft(await m.項目のエラー(), "項目ごとのエラー表示").toEqual([]);
    const f = await m.件名と本文を読む();
    expect.soft(f.件名, "件名（残らない）").toBe("");
    expect.soft(f.本文, "メール本文（残らない）").toBe("");
  });
});

// ---- テンプレートを使うケース（TEMPLATES・SHOP を使う） ----
const 編集のパス = (番号: string) => new RegExp(`/purchase/${Number(番号)}/edit$`);
const 入力のパス = (番号: string) => new RegExp(`/purchase/${Number(番号)}/mail$`);

/** 「確認」を押して、手動メール通知(確認画面)が表示されたことを確かめる（確認画面での操作を行う手順の前提） */
async function 確認画面へ進む(m: ManualMailPage): Promise<void> {
  await m.確認を押す();
  expect(await m.確認画面を表示中か(), "手動メール通知(確認画面)が表示された").toBe(true);
}

caseTest("IT-M07-04-003", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0704_ADMIN);
  const m = new ManualMailPage(page);
  let f = { 件名: "", 本文: "" };
  await step(1, async () => { await m.開く(notes.get("〔買取番号-M0704-003〕")); });
  await step(2, async () => { await m.テンプレを選ぶ("02査定テンプレ"); });
  await step(3, async () => { f = await m.件名と本文を読む(); });
  await expected(async () => {
    expect.soft(f.件名, "件名に初期セットされる値").toBe("刷新件名Ａ1");
    expect.soft(f.本文.includes("刷新本文Ｂ2"), "メール本文に「刷新本文Ｂ2」が初期セットされる").toBe(true);
  });
});

caseTest("IT-M07-04-005", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0704_ADMIN);
  const m = new ManualMailPage(page);
  let status = 0;
  await step(1, async () => { await m.開く(notes.get("〔買取番号-M0704-005〕")); });
  await step(2, async () => { status = await m.選択肢を足して選ぶ("70499"); });
  await step(3, async () => { note(`テンプレート変更要求のHTTPステータス: ${status}`); });
  await expected(async () => { expect.soft(status, "買取向けではないテンプレートID 70499を指定した要求のHTTPステータス").toBe(404); });
});

caseTest("IT-M07-04-009", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0704_ADMIN);
  const m = new ManualMailPage(page);
  const 番号 = notes.get("〔買取番号-M0704-009〕");
  let c = { 買取番号: "", テンプレート: "", 件名: "", 本文: "" };
  await step(1, async () => { await m.開く(番号); });
  await step(2, async () => { await m.テンプレを選ぶ("02査定テンプレ"); });
  await step(3, async () => { await m.件名と本文を入れる("確認件名Ａ1", "確認本文Ｂ2"); });
  await step(4, async () => { await m.確認を押す(); c = await m.確認画面の内容(); });
  await expected(async () => {
    expect.soft(c.買取番号, "買取番号（7桁表示）").toBe(m.期待の買取番号(番号));
    expect.soft(c.テンプレート, "テンプレート名").toBe("02査定テンプレ");
    expect.soft(c.件名, "件名").toBe("確認件名Ａ1");
    expect.soft(c.本文, "メール本文").toBe("確認本文Ｂ2");
  });
});

caseTest("IT-M07-04-011", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0704_ADMIN);
  const m = new ManualMailPage(page);
  const 番号 = notes.get("〔買取番号-M0704-011〕");
  await step(1, async () => { await m.開く(番号); });
  await step(2, async () => { await m.テンプレを選ぶ("02査定テンプレ"); });
  await step(3, async () => { await 確認画面へ進む(m); });
  await step(4, async () => { await m.買取編集画面へ戻る(); });
  await expected(async () => { expect.soft(m.パス, "遷移先のパス").toMatch(編集のパス(番号)); });
});

caseTest("IT-M07-04-013", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0704_ADMIN);
  const m = new ManualMailPage(page);
  const 番号 = notes.get("〔買取番号-M0704-013〕");
  await step(1, async () => { await m.開く(番号); });
  await step(2, async () => { await m.テンプレを選ぶ("02査定テンプレ"); });
  await step(3, async () => { await m.件名と本文を入れる("", "件名必須確認本文"); });
  await step(4, async () => { await m.件名のrequiredを外す(); });
  await step(5, async () => { await m.確認を押す(); });
  await expected(async () => {
    expect.soft(m.パス, "手動メール通知(入力画面)が開き直される").toMatch(入力のパス(番号));
    expect.soft(await m.確認画面を表示中か(), "確認画面ではない").toBe(false);
    expect.soft(await m.項目のエラー(), "項目ごとのエラー表示").toEqual([]);
    const f = await m.件名と本文を読む();
    expect.soft(f.件名, "件名（残らない）").toBe("");
    expect.soft(f.本文, "入力したメール本文（残らない）").toBe("");
  });
});

caseTest("IT-M07-04-014", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0704_ADMIN);
  const m = new ManualMailPage(page);
  const 番号 = notes.get("〔買取番号-M0704-014〕");
  await step(1, async () => { await m.開く(番号); });
  await step(2, async () => { await m.テンプレを選ぶ("02査定テンプレ"); });
  await step(3, async () => { await m.件名と本文を入れる("本文必須確認件名", ""); });
  await step(4, async () => { await m.本文のrequiredを外す(); });
  await step(5, async () => { await m.確認を押す(); });
  await expected(async () => {
    expect.soft(m.パス, "手動メール通知(入力画面)が開き直される").toMatch(入力のパス(番号));
    expect.soft(await m.確認画面を表示中か(), "確認画面ではない").toBe(false);
    expect.soft(await m.項目のエラー(), "項目ごとのエラー表示").toEqual([]);
    const f = await m.件名と本文を読む();
    expect.soft(f.件名, "入力した件名（残らない）").toBe("");
    expect.soft(f.本文, "メール本文（残らない）").toBe("");
  });
});

caseTest("IT-M07-04-018", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0704_ADMIN);
  const m = new ManualMailPage(page);
  const 番号 = notes.get("〔買取番号-M0704-018〕");
  const 前 = 通知送信履歴を読む(番号).length;
  let 履歴: ReturnType<typeof 通知送信履歴を読む> = [];
  await step(1, async () => { await m.開く(番号); });
  await step(2, async () => { await m.テンプレを選ぶ("02査定テンプレ"); });
  await step(3, async () => { await m.件名と本文を入れる("履歴件名Ａ1", "履歴本文Ｂ2"); });
  await step(4, async () => { await 確認画面へ進む(m); });
  await step(5, async () => { await m.送信を押す(); });
  await step(6, async () => { 履歴 = 通知送信履歴を読む(番号); });
  await expected(async () => {
    expect.soft(履歴.length - 前, "通知送信履歴の追加件数").toBe(1);
    const h = 履歴[履歴.length - 1];
    expect.soft(h?.件名, "件名").toBe("履歴件名Ａ1");
    expect.soft((h?.本文 ?? "").trim(), "本文").toBe("履歴本文Ｂ2");
    expect.soft(h?.送信日時あり, "値の入った送信日時").toBe(true);
    expect.soft(h?.テンプレートID, "テンプレートID").toBe("70401");
    expect.soft(h?.買取番号, "買取番号").toBe(String(Number(番号)));
    expect.soft(h?.会員ID, "会員ID").toBe(notes.get("〔会員ID-M0704-018〕"));
  });
});

caseTest("IT-M07-04-019", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0704_ADMIN);
  const m = new ManualMailPage(page);
  const 番号 = notes.get("〔買取番号-M0704-019〕");
  let 前 = ""; let 後 = "";
  await step(1, async () => { 前 = 買取受注レコード(番号); });
  await step(2, async () => { await m.開く(番号); });
  await step(3, async () => { await m.テンプレを選ぶ("02査定テンプレ"); });
  await step(4, async () => { await 確認画面へ進む(m); });
  await step(5, async () => { await m.送信を押す(); });
  await step(6, async () => { 後 = 買取受注レコード(番号); });
  await expected(async () => { expect.soft(後, "買取受注レコードの全項目が送信前から変更されない").toBe(前); });
});

caseTest("IT-M07-04-020", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0704_ADMIN);
  const m = new ManualMailPage(page);
  const 番号 = notes.get("〔買取番号-M0704-020〕");
  await step(1, async () => { await m.開く(番号); });
  await step(2, async () => { await m.テンプレを選ぶ("02査定テンプレ"); });
  await step(3, async () => { await 確認画面へ進む(m); });
  await step(4, async () => { await m.送信を押す(); });
  await expected(async () => { expect.soft(m.パス, "メール送信完了後の遷移先のパス").toMatch(編集のパス(番号)); });
});

caseTest("IT-M07-04-021", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0704_ADMIN);
  const m = new ManualMailPage(page);
  let status = 0;
  await step(1, async () => { await m.開く(notes.get("〔買取番号-M0704-021〕")); });
  await step(2, async () => { status = await m.選択肢を足して選ぶ("70498"); });
  await step(3, async () => { note(`テンプレート変更要求のHTTPステータス: ${status}`); });
  await expected(async () => { expect.soft(status, "自動送信専用のテンプレートID 70498を指定した要求のHTTPステータス").toBe(404); });
});

caseTest("IT-M07-04-022", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0704_ADMIN);
  const m = new ManualMailPage(page);
  const 番号 = notes.get("〔買取番号-M0704-022〕");
  await step(1, async () => { await m.開く(番号); });
  await step(2, async () => { await m.テンプレを選ぶ("02査定テンプレ"); });
  await step(3, async () => { await 確認画面へ進む(m); });
  await step(4, async () => { await m.入力画面へ戻る(); });
  await expected(async () => {
    expect.soft(m.パス, "遷移先のパス").toMatch(入力のパス(番号));
    expect.soft(!(await m.確認画面を表示中か()), "手動メール通知(入力画面)である（確認画面ではない）").toBe(true);
  });
});

caseTest("IT-M07-04-024", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0704_ADMIN);
  const m = new ManualMailPage(page);
  let status = 0;
  await step(1, async () => { await m.開く(notes.get("〔買取番号-M0704-024〕")); });
  await step(2, async () => { status = await m.選択肢を足して選ぶ("70497"); });
  await step(3, async () => { note(`テンプレート変更要求のHTTPステータス: ${status}`); });
  await expected(async () => { expect.soft(status, "自動送信専用かつ雛形なしのテンプレートID 70497を指定した要求のHTTPステータス").toBe(404); });
});
