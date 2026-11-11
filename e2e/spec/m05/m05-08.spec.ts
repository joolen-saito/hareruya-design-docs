/**
 * M05-08 スタック用紙印刷。正本: cases/M05-08_test_cases.tsv
 *
 * 2026-11-10（依頼者の方針）: シード表が「DBで登録」とする受注・担当者・設定は、画面で作った受注の行をDBで写して作る（seeds/m05-08.ts）。
 * 画面で作れない部分（担当者・未採番の注文番号・注文確定日）は、実行の印つきの受注に限り writeTestData で書く。共有の設定は書き換えない。
 *
 * 手順の注記（共通）:
 *  - 受注一覧の「スタック用紙印刷」ボタンは、検索結果の一覧にだけ出る。手順1「受注一覧画面を開く」には、このシードの受注（注文者名に実行の印を付けた）を
 *    注文者名で検索して、結果の一覧を出すところまでを含めた。受注の選択は、受注ID（一覧の行が持つ値）の行のチェックで行う。
 *  - 正本の「担当者ID 5080」は、画面で指定できないので、M05-08試験管理者（ログインID m0508_admin のメンバー）のメンバーIDで読み替えた。
 *  - 開発者ツールでの要求の書き換え・遮断は、窓の中の受付への通信を途中で書き換える・遮断することで行った（受付の要求の項目を、同じ値に変える）。
 *  - 窓の「閉じる」は、押したあとに開いた窓が閉じていること（60秒まで待つ）で確かめた。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { 受注の印刷状態, メンバーID, 印刷後の受注 } from "../../db/m05_08";
import { OrderListStackPrint } from "../../pages/admin/m05_08_stack_print";
import { OrderListStackFlow } from "../../pages/admin/m05_08_stack_flow";
import { M0508_ADMIN, 検索する注文者名, 受注の取得 } from "../../seeds/m05-08";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

const 受付の文 = "印刷予約を受け付けました。";
const 共有 = "〔メンバーID-M0508-共有〕";

async function 入る(page: import("@playwright/test").Page): Promise<OrderListStackFlow> {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0508_ADMIN); // 事前準備: 本店を操作対象にして M05-08試験管理者でログインしている
  return new OrderListStackFlow(page);
}

const 窓の様子 = (f: OrderListStackFlow) =>
  `ダイアログの文: ${f.dialogs.join(" / ") || "なし"}／開いた窓の数: ${f.開いた窓}／受付の応答: ${f.受付.map((r) => r.ステータス).join("・") || "なし"}`;

/** 印刷前の状態（注文受領・ブラウザ印刷フラグOFF・注文確定日NULL・担当者が更新前担当者）のまま変わっていないことの確かめ */
function 変わらない(名前: string, s: 印刷後の受注, 担当者ID: string, 状態 = "注文受領", 確定日: string | null = null, フラグ = "false"): void {
  expect.soft(s.ブラウザ印刷フラグ, `${名前}のブラウザ印刷フラグ`).toBe(フラグ);
  expect.soft(s.対応状況, `${名前}のステータス`).toBe(状態);
  expect.soft(s.注文確定日, `${名前}の注文確定日`).toBe(確定日);
  expect.soft(s.担当者ID, `${名前}の担当者ID`).toBe(担当者ID);
}

/** ピック中になるまで印刷されたことの確かめ */
function 印刷された(名前: string, s: 印刷後の受注): void {
  expect.soft(s.ブラウザ印刷フラグ, `${名前}のブラウザ印刷フラグがON`).toBe("true");
  expect.soft(s.対応状況, `${名前}のステータスがピック中`).toBe("ピック中");
  expect.soft(s.注文確定日, `${名前}の注文確定日がNULL以外`).not.toBeNull();
}

function 窓の閉じ方(f: OrderListStackFlow): void {
  expect.soft(f.dialogs.length, "エラーのダイアログが表示される（件数）").toBeGreaterThan(0);
  expect.soft(f.開いた窓, "スタック用紙印刷の窓が開く").toBeGreaterThan(0);
  expect.soft(f.窓が閉じているか(), "エラー表示後にスタック用紙印刷の窓が閉じる").toBe(true);
}

// ---------------------------------------------------------------- 正常

caseTest("IT-M05-08-001", async ({ page, step, expected }) => {
  const f = await 入る(page);
  await f.準備();
  const o = 受注の取得("S-M05-08-TARGET-001");
  await step(1, async () => { await f.開いて検索する(検索する注文者名("001")); });
  await step(2, async () => { await f.選ぶ(o.受注ID); });
  await step(3, async () => { await f.押して終わりを待つ(); });
  await expected(async () => {
    expect.soft(f.開いた窓, "スタック用紙印刷の窓が開く").toBeGreaterThan(0);
    expect.soft(f.窓の要求, "窓の画面を取りに行った要求の数").toBeGreaterThan(0);
  });
  note(窓の様子(f));
});

caseTest("IT-M05-08-002", async ({ page, notes, step, expected }) => {
  const f = await 入る(page);
  await f.準備();
  const o = 受注の取得("S-M05-08-TARGET-002");
  let s: 印刷後の受注 | null = null;
  await step(1, async () => { await f.開いて検索する(検索する注文者名("002")); });
  await step(2, async () => { await f.選ぶ(o.受注ID); });
  await step(3, async () => { await f.押して終わりを待つ(); });
  await step(4, async () => { s = 受注の印刷状態(notes.get("〔受注ID-M0508-002〕")); });
  await expected(async () => {
    const r = s as 印刷後の受注;
    印刷された("受注", r);
    expect.soft(r.担当者ID, "担当者がM05-08試験管理者（正本のID 5080の読み替え）").toBe(メンバーID(M0508_ADMIN.loginId));
  });
  note(窓の様子(f));
});

caseTest("IT-M05-08-003", async ({ page, notes, step, expected }) => {
  const f = await 入る(page);
  await f.準備();
  const a = 受注の取得("S-M05-08-SELECTION-003", "A");
  let s: 印刷後の受注 | null = null;
  await step(1, async () => { await f.開いて検索する(検索する注文者名("003")); });
  await step(2, async () => { await f.選ぶ(a.受注ID); });
  await step(3, async () => { await f.押して終わりを待つ(); });
  await step(4, async () => { s = 受注の印刷状態(notes.get("〔受注ID-M0508-003B〕")); });
  await expected(async () => {
    expect.soft((s as 印刷後の受注 | null)?.件数, "選択していない受注を読めた").toBe(1);
    変わらない("選択していない受注", s as 印刷後の受注, notes.get(共有));
  });
  note(窓の様子(f));
});

caseTest("IT-M05-08-004", async ({ page, step, expected }) => {
  const f = await 入る(page);
  const o = 受注の取得("S-M05-08-TARGET-004");
  await step(1, async () => { await f.準備(); }); // ネットワーク記録＝受付への通信の記録を始める
  await step(2, async () => { await f.開いて検索する(検索する注文者名("004")); });
  await step(3, async () => { await f.選ぶ(o.受注ID); });
  await step(4, async () => { await f.押して終わりを待つ(); });
  let 本文 = "";
  await step(5, async () => { 本文 = f.受付[0]?.本文 ?? ""; });
  await expected(async () => {
    expect.soft(f.受付.length, "受付の応答を記録できた件数").toBeGreaterThan(0);
    let keys: string[] = [];
    try { keys = Object.keys(JSON.parse(本文) as Record<string, unknown>); } catch { /* 本文が JSON でない */ }
    expect.soft(keys, "応答本文の項目は「メッセージ」だけ（印刷内容を含まない）").toEqual(["message"]);
    expect.soft(f.受付[0]?.ステータス, "成功の応答").toBe(200);
  });
  note(`応答本文: ${本文}`);
});

// ---------------------------------------------------------------- 未採番の受注を含む

caseTest("IT-M05-08-005", async ({ page, step, expected }) => {
  const f = await 入る(page);
  const a = 受注の取得("S-M05-08-UNNUMBERED-005", "A");
  const b = 受注の取得("S-M05-08-UNNUMBERED-005", "B");
  await step(1, async () => { await f.準備(); });
  await step(2, async () => { await f.開いて検索する(検索する注文者名("005")); });
  await step(3, async () => { await f.選ぶ(a.受注ID); await f.選ぶ(b.受注ID); });
  await step(4, async () => { await f.押して終わりを待つ(); });
  let 状態 = 0;
  await step(5, async () => { 状態 = f.受付[0]?.ステータス ?? 0; });
  await expected(async () => { expect.soft(状態, "受付の応答のHTTPステータス").toBe(400); });
  note(窓の様子(f));
});

caseTest("IT-M05-08-006", async ({ page, notes, step, expected }) => {
  const f = await 入る(page);
  await f.準備();
  const a = 受注の取得("S-M05-08-UNNUMBERED-006", "A");
  const b = 受注の取得("S-M05-08-UNNUMBERED-006", "B");
  let sa: 印刷後の受注 | null = null;
  let sb: 印刷後の受注 | null = null;
  await step(1, async () => { await f.開いて検索する(検索する注文者名("006")); });
  await step(2, async () => { await f.選ぶ(a.受注ID); await f.選ぶ(b.受注ID); });
  await step(3, async () => { await f.押して終わりを待つ(); });
  await step(4, async () => { sa = 受注の印刷状態(notes.get("〔受注ID-M0508-006A〕")); sb = 受注の印刷状態(notes.get("〔受注ID-M0508-006B〕")); });
  await expected(async () => {
    expect.soft([(sa as 印刷後の受注 | null)?.件数, (sb as 印刷後の受注 | null)?.件数], "2件の受注を読めた").toEqual([1, 1]);
    変わらない("採番済みの受注", sa as 印刷後の受注, notes.get(共有));
    変わらない("未採番の受注", sb as 印刷後の受注, notes.get(共有));
  });
  note(窓の様子(f));
});

caseTest("IT-M05-08-007", async ({ page, step, expected }) => {
  const f = await 入る(page);
  await f.準備();
  const a = 受注の取得("S-M05-08-UNNUMBERED-007", "A");
  const b = 受注の取得("S-M05-08-UNNUMBERED-007", "B");
  await step(1, async () => { await f.開いて検索する(検索する注文者名("007")); });
  await step(2, async () => { await f.選ぶ(a.受注ID); await f.選ぶ(b.受注ID); });
  await step(3, async () => { await f.押して終わりを待つ(); });
  await expected(async () => {
    expect.soft(f.窓が閉じているか(), "エラー表示後にスタック用紙印刷の窓が閉じる").toBe(true);
    窓の閉じ方(f);
  });
  note(窓の様子(f));
});

// ---------------------------------------------------------------- 要求の書き換え

caseTest("IT-M05-08-008", async ({ page, notes, step, expected }) => {
  const f = await 入る(page);
  await f.準備();
  const o = 受注の取得("S-M05-08-TARGET-008");
  let s: 印刷後の受注 | null = null;
  await step(1, async () => { await f.開いて検索する(検索する注文者名("008")); });
  await step(2, async () => { await f.選ぶ(o.受注ID); });
  await step(3, async () => {
    f.担当者IDを足す("999999");
    note("受付の要求にもともと担当者IDの項目は無い。押す前に、担当者IDの項目（値 999999）を足して送るようにした");
  });
  await step(4, async () => { await f.押して終わりを待つ(); });
  await step(5, async () => { s = 受注の印刷状態(notes.get("〔受注ID-M0508-008〕")); });
  await expected(async () => {
    const r = s as 印刷後の受注;
    expect.soft(r.担当者ID, "受注の担当者が更新前担当者のまま変わらない").toBe(notes.get(共有));
    note(`印刷後の担当者: ${r.担当者名 ?? "なし"}（担当者ID ${r.担当者ID ?? "なし"}）／${窓の様子(f)}`);
  });
});

caseTest("IT-M05-08-009", async ({ page, notes, step, expected }) => {
  const f = await 入る(page);
  await f.準備();
  let s: 印刷後の受注 | null = null;
  await step(1, async () => { await f.開いて検索する(検索する注文者名("009")); });
  await step(2, async () => { await f.押して終わりを待つ(); });
  await step(3, async () => { s = 受注の印刷状態(notes.get("〔受注ID-M0508-009〕")); });
  await expected(async () => {
    expect.soft((s as 印刷後の受注 | null)?.件数, "受注を読めた").toBe(1);
    変わらない("受注", s as 印刷後の受注, notes.get(共有));
  });
  note(`受注を選ばずに押した。${窓の様子(f)}`);
});

caseTest("IT-M05-08-011", async ({ page, notes, step, expected }) => {
  const f = await 入る(page);
  await f.準備();
  const o = 受注の取得("S-M05-08-TARGET-011");
  let s: 印刷後の受注 | null = null;
  await step(1, async () => { await f.開いて検索する(検索する注文者名("011")); });
  await step(2, async () => { await f.選ぶ(o.受注ID); });
  await step(3, async () => { f.トークンを外す(); });
  await step(4, async () => { await f.押して終わりを待つ(); });
  await step(5, async () => { s = 受注の印刷状態(notes.get("〔受注ID-M0508-011〕")); });
  await expected(async () => {
    expect.soft((s as 印刷後の受注 | null)?.件数, "受注を読めた").toBe(1);
    変わらない("受注", s as 印刷後の受注, notes.get(共有));
  });
  note(`なりすまし対策トークンを外して送った。${窓の様子(f)}`);
});

caseTest("IT-M05-08-012", async ({ page, step, expected }) => {
  const f = await 入る(page);
  await f.準備();
  const o = 受注の取得("S-M05-08-TARGET-012");
  await step(1, async () => { await f.開いて検索する(検索する注文者名("012")); });
  await step(2, async () => { await f.選ぶ(o.受注ID); });
  await step(3, async () => { f.トークンを外す(); });
  await step(4, async () => { await f.押して終わりを待つ(); });
  await expected(async () => {
    expect.soft(f.窓が閉じているか(), "エラー表示後にスタック用紙印刷の窓が閉じる").toBe(true);
    窓の閉じ方(f);
  });
  note(窓の様子(f));
});

caseTest("IT-M05-08-013", async ({ page, notes, step, expected }) => {
  const f = await 入る(page);
  await f.準備();
  const o = 受注の取得("S-M05-08-TARGET-013");
  let s: 印刷後の受注 | null = null;
  await step(1, async () => { await f.開いて検索する(検索する注文者名("013")); });
  await step(2, async () => { await f.選ぶ(o.受注ID); });
  await step(3, async () => { f.トークンを変える("invalid-token"); });
  await step(4, async () => { await f.押して終わりを待つ(); });
  await step(5, async () => { s = 受注の印刷状態(notes.get("〔受注ID-M0508-013〕")); });
  await expected(async () => {
    expect.soft((s as 印刷後の受注 | null)?.件数, "受注を読めた").toBe(1);
    変わらない("受注", s as 印刷後の受注, notes.get(共有));
  });
  note(`なりすまし対策トークンを invalid-token にして送った。${窓の様子(f)}`);
});

caseTest("IT-M05-08-014", async ({ page, step, expected }) => {
  const f = await 入る(page);
  await f.準備();
  const o = 受注の取得("S-M05-08-TARGET-014");
  await step(1, async () => { await f.開いて検索する(検索する注文者名("014")); });
  await step(2, async () => { await f.選ぶ(o.受注ID); });
  await step(3, async () => { f.トークンを変える("invalid-token"); });
  await step(4, async () => { await f.押して終わりを待つ(); });
  await expected(async () => {
    expect.soft(f.窓が閉じているか(), "エラー表示後にスタック用紙印刷の窓が閉じる").toBe(true);
    窓の閉じ方(f);
  });
  note(窓の様子(f));
});

caseTest("IT-M05-08-015", async ({ page, step, expected }) => {
  const f = await 入る(page);
  await f.準備();
  const o = 受注の取得("S-M05-08-TARGET-015");
  await step(1, async () => { await f.開いて検索する(検索する注文者名("015")); });
  await step(2, async () => { await f.選ぶ(o.受注ID); });
  await step(3, async () => { f.通信を遮断する(); });
  await step(4, async () => { await f.押して終わりを待つ(); });
  await expected(async () => {
    expect.soft(f.遮断した回数, "受付への通信を遮断できた回数").toBeGreaterThan(0);
    窓の閉じ方(f);
  });
  note(窓の様子(f));
});

caseTest("IT-M05-08-018", async ({ page, notes, step, expected }) => {
  const f = await 入る(page);
  await f.準備();
  const o = 受注の取得("S-M05-08-TARGET-018");
  let s: 印刷後の受注 | null = null;
  await step(1, async () => { await f.開いて検索する(検索する注文者名("018")); });
  await step(2, async () => { await f.選ぶ(o.受注ID); });
  await step(3, async () => {
    f.選択の値を置き換える("99999999");
    note("受付の要求の選択の値（一覧のチェックの値は配送の番号）を 99999999 に置き換えて送った");
  });
  await step(4, async () => { await f.押して終わりを待つ(); });
  await step(5, async () => { s = 受注の印刷状態(notes.get("〔受注ID-M0508-018〕")); });
  await expected(async () => {
    expect.soft((s as 印刷後の受注 | null)?.件数, "受注を読めた").toBe(1);
    変わらない("受注", s as 印刷後の受注, notes.get(共有));
  });
  note(窓の様子(f));
});

// ---------------------------------------------------------------- 対応状況が注文受領でない受注

caseTest("IT-M05-08-019", async ({ page, notes, step, expected }) => {
  const f = await 入る(page);
  await f.準備();
  const o = 受注の取得("S-M05-08-NON-NEW-019");
  let s: 印刷後の受注 | null = null;
  await step(1, async () => { await f.開いて検索する(検索する注文者名("019")); });
  await step(2, async () => { await f.選ぶ(o.受注ID); });
  await step(3, async () => { await f.押して終わりを待つ(); });
  await step(4, async () => { s = 受注の印刷状態(notes.get("〔受注ID-M0508-019〕")); });
  await expected(async () => {
    const r = s as 印刷後の受注;
    expect.soft(r.ブラウザ印刷フラグ, "ブラウザ印刷フラグがON").toBe("true");
    expect.soft(r.対応状況, "ステータスは入金待ちのまま").toBe("入金待ち");
    expect.soft(r.注文確定日, "注文確定日は 2026-09-01 10:00:00 のまま").toBe("2026-09-01 10:00:00");
  });
  note(窓の様子(f));
});

// ---------------------------------------------------------------- 応答の形

caseTest("IT-M05-08-020", async ({ page, step, expected }) => {
  const f = await 入る(page);
  const o = 受注の取得("S-M05-08-TARGET-020");
  await step(1, async () => { await f.準備(); });
  await step(2, async () => { await f.開いて検索する(検索する注文者名("020")); });
  await step(3, async () => { await f.選ぶ(o.受注ID); });
  let 正常 = { ステータス: 0, 形式: "" };
  await step(4, async () => {
    await f.押して終わりを待つ();
    正常 = { ステータス: f.受付[0]?.ステータス ?? 0, 形式: f.受付[0]?.形式 ?? "" };
  });
  await step(5, async () => { await f.開いて検索する(検索する注文者名("020")); await f.選ぶ(o.受注ID); });
  await step(6, async () => {
    f.選択の値を置き換える("99999999");
    note("受付の要求の選択の値（一覧のチェックの値は配送の番号）を 99999999 に置き換えて送った");
  });
  await step(7, async () => { await f.押して終わりを待つ(); });
  await expected(async () => {
    const r = f.受付[1];
    expect.soft(f.受付.length, "受付の応答を記録できた件数（正常・未登録の2回）").toBe(2);
    expect.soft(r?.ステータス, "未登録の受注IDだけを送った応答のHTTPステータスが、正常予約時と同じ").toBe(正常.ステータス);
    expect.soft(r?.形式, "未登録の受注IDだけを送った応答のレスポンス形式が、正常予約時と同じ").toBe(正常.形式);
    let m: Record<string, unknown> | null = null;
    try { m = JSON.parse(r?.本文 ?? "") as Record<string, unknown>; } catch { /* JSON でない */ }
    expect.soft(m, "本文が「印刷予約を受け付けました。」のメッセージだけ").toEqual({ message: 受付の文 });
  });
  note(`正常予約時の応答: ステータス ${正常.ステータス}・形式 ${正常.形式}／${窓の様子(f)}`);
});

// ---------------------------------------------------------------- 複数の受注

caseTest("IT-M05-08-021", async ({ page, notes, step, expected }) => {
  const f = await 入る(page);
  await f.準備();
  const a = 受注の取得("S-M05-08-MIXED-021", "A");
  const b = 受注の取得("S-M05-08-MIXED-021", "B");
  let sa: 印刷後の受注 | null = null;
  let sb: 印刷後の受注 | null = null;
  await step(1, async () => { await f.開いて検索する(検索する注文者名("021")); });
  await step(2, async () => { await f.選ぶ(a.受注ID); await f.選ぶ(b.受注ID); });
  await step(3, async () => { await f.押して終わりを待つ(); });
  await step(4, async () => { sa = 受注の印刷状態(notes.get("〔受注ID-M0508-021A〕")); sb = 受注の印刷状態(notes.get("〔受注ID-M0508-021B〕")); });
  await expected(async () => {
    印刷された("注文受領だった受注", sa as 印刷後の受注);
    const r = sb as 印刷後の受注;
    expect.soft(r.ブラウザ印刷フラグ, "入金待ちだった受注のブラウザ印刷フラグがON").toBe("true");
    expect.soft(r.対応状況, "入金待ちだった受注のステータスは入金待ちのまま").toBe("入金待ち");
    expect.soft(r.注文確定日, "入金待ちだった受注の注文確定日は 2026-09-01 10:00:00 のまま").toBe("2026-09-01 10:00:00");
  });
  note(窓の様子(f));
});

caseTest("IT-M05-08-022", async ({ page, notes, step, expected }) => {
  const f = await 入る(page);
  await f.準備();
  const a = 受注の取得("S-M05-08-MULTI-022", "A");
  const b = 受注の取得("S-M05-08-MULTI-022", "B");
  let sa: 印刷後の受注 | null = null;
  let sb: 印刷後の受注 | null = null;
  await step(1, async () => { await f.開いて検索する(検索する注文者名("022")); });
  await step(2, async () => { await f.選ぶ(a.受注ID); await f.選ぶ(b.受注ID); });
  await step(3, async () => { await f.押して終わりを待つ(); });
  await step(4, async () => { sa = 受注の印刷状態(notes.get("〔受注ID-M0508-022A〕")); sb = 受注の印刷状態(notes.get("〔受注ID-M0508-022B〕")); });
  await expected(async () => {
    expect.soft([(sa as 印刷後の受注 | null)?.件数, (sb as 印刷後の受注 | null)?.件数], "2件の受注を読めた").toEqual([1, 1]);
    印刷された("1件目の受注", sa as 印刷後の受注);
    印刷された("2件目の受注", sb as 印刷後の受注);
  });
  note(窓の様子(f));
});

// ---------------------------------------------------------------- 管理者だけ（前回までに実装済み）

caseTest("IT-M05-08-010", async ({ page, step, expected }) => {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0508_ADMIN); // 事前準備: 本店を操作対象にして M05-08試験管理者でログインしている（通信の遮断・応答遅延は設けていない）
  const list = new OrderListStackPrint(page);
  await step(1, async () => { await list.openList(); });
  await step(2, async () => { await list.スタック用紙印刷を押す(); });
  await expected(async () => {
    expect.soft(list.dialogs.length, "エラーのダイアログが表示される（件数）").toBeGreaterThan(0);
    expect.soft(list.いま開いているほかのウィンドウ(), "スタック用紙印刷のウィンドウが開いたままになっていない").toBe(0);
  });
  note(`ダイアログの文: ${list.dialogs.join(" / ") || "なし"}／押したあとに開いたウィンドウの数: ${list.開いたウィンドウ}`);
});
