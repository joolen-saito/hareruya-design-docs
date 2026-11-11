/**
 * M15-11 直近の大会管理（管理画面）。正本: cases/M15-11_test_cases.tsv
 *
 * - 直近の大会の行は全体で1組の共有の設定。どのケースも1本だけで流す（config/solo_cases.tsv）。
 * - フォーマット名は実行の印つき（seeds/m15-11.ts）。大会名は正本の値のまま。
 * - 「デッキ管理＞直近の大会管理」は、画面のアドレスを直接開く。
 * - 管理画面の開催日は日時の入力欄（値は「yyyy-mm-ddThh:mm」）。正本の「2026-09-01 10:00」と同じ日時かを、区切りを空白にそろえて比べる。
 * - デッキ検索TOPの開催日は「yyyy/mm/dd」、参加人数は「48名」の形で出る（画面の文言）。日付は区切りを読み替え、人数は数として比べる。
 */
import { Page, test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { DeckTopPage } from "../../pages/front/f09_01_deck_top";
import { LatestEventDeckPage, 大会の行, 直近の大会管理のパス } from "../../pages/admin/m15_11_latest_event";
import { M1511_ADMIN, フォーマット名 } from "../../seeds/m15-11";
import "../../seeds/m15-11";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 開く注記 = "「デッキ管理＞直近の大会管理」は、画面のアドレスを直接開いた";

async function ログイン(page: Page): Promise<void> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(90_000);
  await loginAdmin(page, M1511_ADMIN);
}

const 空の行: 大会の行 = { 開催日時: "", フォーマット: "", 大会名日: "", 大会名英: "", 参加人数: "" };

/** 押した結果を注記に残す（ブラウザの入力チェックが止めたとき・応答が異常のとき） */
function 押した結果の注記(r: Awaited<ReturnType<LatestEventDeckPage["設定を押す"]>>): void {
  if (!r.送った) note(`「直近の大会設定」を押したが、ブラウザの入力チェックが送信を止めた（止めた項目: ${r.止めた項目.join(" / ") || "読めない"}）`);
  else if ((r.応答 ?? 0) >= 400) note(`「直近の大会設定」の送信の応答が ${r.応答}`);
}

/** 管理画面の i 行目（0始まり）が期待の5項目と同じかを、項目ごとに確かめる */
function 行を確かめる(got: 大会の行 | undefined, want: 大会の行, 何行目: string): void {
  expect.soft(got?.開催日時, `${何行目}のイベント開催日`).toBe(want.開催日時);
  expect.soft(got?.フォーマット, `${何行目}のフォーマット`).toBe(want.フォーマット);
  expect.soft(got?.大会名日, `${何行目}のイベント名(日)`).toBe(want.大会名日);
  expect.soft(got?.大会名英, `${何行目}のイベント名(英)`).toBe(want.大会名英);
  expect.soft(got?.参加人数, `${何行目}のイベント参加人数`).toBe(want.参加人数);
}

// ---------------------------------------------------------------------------
// デッキ検索TOPに出ること（024・025・026）
// ---------------------------------------------------------------------------

caseTest("IT-M15-11-024", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const adm = new LatestEventDeckPage(page);
  const fmt = フォーマット名("QM1511-001");
  await step(1, async () => {
    await top.開く();
    await expect.soft(top.直近の大会の区画, "登録の前のデッキ検索TOPの、直近の大会の区画").toHaveCount(0);
  });
  await step(2, async () => { await ログイン(page); });
  await step(3, async () => {
    await adm.開く(); note(開く注記);
    await adm.入れる(0, { 開催日時: "2026-09-01 10:00", フォーマット: fmt, 大会名日: "QM1511-001-大会", 大会名英: "QM1511-001-大会", 参加人数: "48" });
  });
  await step(4, async () => { 押した結果の注記(await adm.設定を押す()); });
  await step(5, async () => { await top.開く(); });
  await expected(async () => {
    await expect.soft(top.直近の大会の区画, "直近の大会の区画").toBeVisible();
    await expect.soft(top.直近の大会の見出し, "直近の大会の区画の見出し").toHaveText(/^\s*直近の大会でデッキ検索\s*$/);
    const 行 = await top.直近の大会の行();
    expect.soft(行.length, "直近の大会の区画の行の数").toBe(1);
    const r = 行.find((x) => x.大会名 === "QM1511-001-大会");
    expect.soft(r?.大会名, "大会名「QM1511-001-大会」の行").toBe("QM1511-001-大会");
    expect.soft(r?.開催日, "行の開催日（2026-09-01）").toBe("2026/09/01");
    expect.soft(r?.フォーマット, "行のフォーマット").toBe(fmt);
    expect.soft(r?.参加人数, "行の参加人数（48）").toMatch(/^48\D*$/);
  });
});

caseTest("IT-M15-11-025", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const adm = new LatestEventDeckPage(page);
  await step(1, async () => {
    await top.開く();
    expect.soft((await top.直近の大会の行()).map((r) => r.大会名), "消去の前のデッキ検索TOPの、直近の大会の行の大会名").toContain("QM1511-002-大会");
  });
  await step(2, async () => { await ログイン(page); });
  await step(3, async () => { await adm.開く(); note(開く注記); await adm.消去を押す(0); });
  await step(4, async () => { 押した結果の注記(await adm.設定を押す()); });
  await step(5, async () => { await top.開く(); });
  await expected(async () => {
    await expect.soft(top.直近の大会の区画, "直近の大会の区画").toHaveCount(0);
    await expect.soft(top.直近の大会のリンク("QM1511-002-大会"), "大会「QM1511-002-大会」の行").toHaveCount(0);
  });
});

caseTest("IT-M15-11-026", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const adm = new LatestEventDeckPage(page);
  const fmt = フォーマット名("DPM1511-026");
  await step(1, async () => {
    await top.開く();
    expect.soft((await top.直近の大会の行()).map((r) => r.大会名), "書き換えの前のデッキ検索TOPの、直近の大会の行の大会名").toContain("DPM1511-026-旧大会");
  });
  await step(2, async () => { await ログイン(page); });
  await step(3, async () => {
    await adm.開く(); note(開く注記);
    await adm.入れる(0, { 開催日時: "2026-10-15 13:30", 大会名日: "DPM1511-026-新大会", 大会名英: "DPM1511-026-New", 参加人数: "72" });
  });
  await step(4, async () => { 押した結果の注記(await adm.設定を押す()); });
  await step(5, async () => { await top.開く(); });
  await expected(async () => {
    await expect.soft(top.直近の大会の区画, "直近の大会の区画").toBeVisible();
    const 行 = await top.直近の大会の行();
    expect.soft(行.length, "直近の大会の区画の行の数").toBe(1);
    const r = 行.find((x) => x.大会名 === "DPM1511-026-新大会");
    expect.soft(r?.大会名, "大会名「DPM1511-026-新大会」の行").toBe("DPM1511-026-新大会");
    expect.soft(r?.開催日, "行の開催日（2026-10-15）").toBe("2026/10/15");
    expect.soft(r?.フォーマット, "行のフォーマット").toBe(fmt);
    expect.soft(r?.参加人数, "行の参加人数（72）").toMatch(/^72\D*$/);
    expect.soft(行.map((x) => x.大会名), "直近の大会の行の大会名（旧大会は出ない）").not.toContain("DPM1511-026-旧大会");
  });
});

// ---------------------------------------------------------------------------
// 管理画面で開き直して読む（027・028・030・031・034・035）
// ---------------------------------------------------------------------------

caseTest("IT-M15-11-027", async ({ page, step, expected }) => {
  const adm = new LatestEventDeckPage(page);
  const fmt = フォーマット名("DPM1511-027");
  let 行: 大会の行[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await adm.開く(); note(開く注記); });
  await step(3, async () => { await adm.入れる(0, { 大会名日: "DPM1511-027-大会A改" }); });
  await step(4, async () => { 押した結果の注記(await adm.設定を押す()); });
  await step(5, async () => { await adm.開く(); 行 = (await adm.すべて読む()).slice(0, 3); });
  await expected(async () => {
    expect.soft(行.length, "読めた行の数（1〜3大会目）").toBe(3);
    行を確かめる(行[0], { 開催日時: "2026-09-01 10:00", フォーマット: fmt, 大会名日: "DPM1511-027-大会A改", 大会名英: "DPM1511-027-EventA", 参加人数: "36" }, "1大会目");
    行を確かめる(行[1], { 開催日時: "2026-09-08 11:00", フォーマット: fmt, 大会名日: "DPM1511-027-大会B", 大会名英: "DPM1511-027-EventB", 参加人数: "24" }, "2大会目");
    行を確かめる(行[2], 空の行, "3大会目");
  });
});

caseTest("IT-M15-11-028", async ({ page, step, expected }) => {
  const adm = new LatestEventDeckPage(page);
  const fmt = フォーマット名("DPM1511-028");
  const 入れる値: 大会の行 = { 開催日時: "2026-09-15 14:00", フォーマット: fmt, 大会名日: "DPM1511-028-大会", 大会名英: "DPM1511-028-Event", 参加人数: "40" };
  let 行: 大会の行[] = [];
  let 行の数 = 0;
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await adm.開く(); note(開く注記); await adm.入れる(0, 入れる値); });
  await step(3, async () => {
    押した結果の注記(await adm.設定を押す());
    await expect.soft(adm.成功メッセージ, "1回目の保存のあとの、画面上部の「保存しました」").toContainText("保存しました");
  });
  await step(4, async () => {
    // 1回目の保存のあと、画面は保存した値で開き直されている。入力内容は変えずにもう一度押す
    押した結果の注記(await adm.設定を押す());
  });
  await step(5, async () => { await adm.開く(); 行 = await adm.すべて読む(); 行の数 = await adm.行数(); });
  await expected(async () => {
    行を確かめる(行[0], 入れる値, "1大会目");
    for (let i = 1; i < 5; i++) 行を確かめる(行[i], 空の行, `${i + 1}大会目`);
    expect.soft(行の数, "大会の入力欄のまとまりの数").toBe(5);
  });
});

/** 030: 2行目の開催日だけを入れて押す */
caseTest("IT-M15-11-030", async ({ page, step, expected }) => {
  const adm = new LatestEventDeckPage(page);
  const fmt = フォーマット名("M1511-FG030");
  let 行: 大会の行[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await adm.開く(); note(開く注記); await adm.入れる(0, { 大会名日: "M1511-FG030-新" }); });
  await step(3, async () => { await adm.入れる(1, { 開催日時: "2026-12-24 18:00" }); });
  await step(4, async () => {
    const r = await adm.設定を押す();
    押した結果の注記(r);
    if (r.送った) note(`送信された（応答 ${r.応答}）。画面上部のメッセージ: ${(await adm.上部のメッセージ()).join(" / ") || "なし"}`);
  });
  await step(5, async () => { await adm.開く(); 行 = (await adm.すべて読む()).slice(0, 2); });
  await expected(async () => {
    expect.soft(行.length, "読めた行の数（1・2行目）").toBe(2);
    行を確かめる(行[0], { 開催日時: "2026-09-01 10:00", フォーマット: fmt, 大会名日: "M1511-FG030-旧", 大会名英: "M1511-FG030-OldE", 参加人数: "30" }, "1行目");
    行を確かめる(行[1], 空の行, "2行目");
  });
});

caseTest("IT-M15-11-031", async ({ page, step, expected }) => {
  const adm = new LatestEventDeckPage(page);
  const fmt = フォーマット名("M1511-FG031");
  let 行: 大会の行[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await adm.開く(); note(開く注記); });
  await step(3, async () => {
    await adm.トークンを書き換える("M1511-FG031-INVALID");
    note("開発者ツールでの書き換えに当たる操作として、画面のスクリプトから隠し項目の値を書き換えた");
  });
  await step(4, async () => { await adm.入れる(0, { 大会名日: "M1511-FG031-新" }); });
  await step(5, async () => { 押した結果の注記(await adm.設定を押す()); });
  await step(6, async () => { await adm.開く(); 行 = (await adm.すべて読む()).slice(0, 1); });
  await expected(async () => {
    expect.soft(行.length, "読めた行の数（1行目）").toBe(1);
    行を確かめる(行[0], { 開催日時: "2026-09-01 10:00", フォーマット: fmt, 大会名日: "M1511-FG031-旧", 大会名英: "M1511-FG031-OldE", 参加人数: "31" }, "1行目");
  });
});

caseTest("IT-M15-11-034", async ({ page, step, expected }) => {
  const adm = new LatestEventDeckPage(page);
  const fmt = フォーマット名("M1511-FG034");
  const 入れる値: 大会の行[] = [
    { 開催日時: "2026-10-01 10:00", フォーマット: fmt, 大会名日: "M1511-FG034-A", 大会名英: "M1511-FG034-AE", 参加人数: "11" },
    { 開催日時: "2026-10-08 11:00", フォーマット: fmt, 大会名日: "M1511-FG034-B", 大会名英: "M1511-FG034-BE", 参加人数: "22" },
    { 開催日時: "2026-10-15 12:00", フォーマット: fmt, 大会名日: "M1511-FG034-C", 大会名英: "M1511-FG034-CE", 参加人数: "33" },
    { 開催日時: "2026-10-22 13:00", フォーマット: fmt, 大会名日: "M1511-FG034-D", 大会名英: "M1511-FG034-DE", 参加人数: "44" },
    { 開催日時: "2026-10-29 14:00", フォーマット: fmt, 大会名日: "M1511-FG034-E", 大会名英: "M1511-FG034-EE", 参加人数: "55" },
  ];
  let 行: 大会の行[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => {
    await adm.開く(); note(開く注記);
    for (let i = 0; i < 入れる値.length; i++) await adm.入れる(i, 入れる値[i]);
  });
  await step(3, async () => { 押した結果の注記(await adm.設定を押す()); });
  await step(4, async () => { await adm.開く(); 行 = await adm.すべて読む(); });
  await expected(async () => {
    expect.soft(行.length, "直近の大会管理の行の数").toBe(5);
    for (let i = 0; i < 5; i++) 行を確かめる(行[i], 入れる値[i], `${i + 1}行目`);
  });
});

caseTest("IT-M15-11-035", async ({ page, step, expected }) => {
  const adm = new LatestEventDeckPage(page);
  const fmt = フォーマット名("M1511-FG035");
  const 前: 大会の行 = { 開催日時: "2026-11-05 10:00", フォーマット: fmt, 大会名日: "M1511-FG035-前", 大会名英: "M1511-FG035-前E", 参加人数: "15" };
  const 後: 大会の行 = { 開催日時: "2026-11-19 15:00", フォーマット: fmt, 大会名日: "M1511-FG035-後", 大会名英: "M1511-FG035-後E", 参加人数: "35" };
  let 行: 大会の行[] = [];
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await adm.開く(); note(開く注記); await adm.入れる(0, 前); });
  await step(3, async () => { await adm.入れる(2, 後); });
  await step(4, async () => { 押した結果の注記(await adm.設定を押す()); });
  await step(5, async () => { await adm.開く(); 行 = await adm.すべて読む(); });
  await expected(async () => {
    expect.soft(行.length, "直近の大会管理の行の数").toBe(5);
    行を確かめる(行[0], 前, "1行目");
    行を確かめる(行[1], 空の行, "2行目");
    行を確かめる(行[2], 後, "3行目");
    行を確かめる(行[3], 空の行, "4行目");
    行を確かめる(行[4], 空の行, "5行目");
  });
});

// ---------------------------------------------------------------------------
// 送信直後の画面（032・033）
// ---------------------------------------------------------------------------

caseTest("IT-M15-11-032", async ({ page, step, expected }) => {
  const adm = new LatestEventDeckPage(page);
  let 応答: number | null = null;
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => { await adm.開く(); note(開く注記); });
  await step(3, async () => {
    await adm.トークンを書き換える("M1511-FG032-INVALID");
    note("開発者ツールでの書き換えに当たる操作として、画面のスクリプトから隠し項目の値を書き換えた");
  });
  await step(4, async () => { await adm.入れる(0, { 大会名日: "M1511-FG032-新" }); });
  await step(5, async () => { const r = await adm.設定を押す(); 押した結果の注記(r); 応答 = r.応答; });
  await step(6, async () => { await expect(page.locator("body"), "送信直後の画面").toBeVisible(); });
  await expected(async () => {
    expect.soft(応答, "送信の応答の状態（アクセス拒否 403 でない）").not.toBe(403);
    expect.soft(応答, "送信の応答（送信されたこと）").not.toBeNull();
    expect.soft(new URL(page.url()).pathname, "送信直後の画面のアドレス（直近の大会管理）").toBe(直近の大会管理のパス());
    await expect.soft(adm.フォーム, "直近の大会管理の編集画面の入力欄").toBeVisible();
    await expect.soft(page.getByText("保存しました", { exact: true }), "画面上部の「保存しました」").toHaveCount(0);
    await expect.soft(page.getByText("保存に失敗しました", { exact: true }), "画面上部の「保存に失敗しました」").toHaveCount(0);
  });
});

caseTest("IT-M15-11-033", async ({ page, step, expected }) => {
  const adm = new LatestEventDeckPage(page);
  let 送った = false;
  await step(1, async () => { await ログイン(page); });
  await step(2, async () => {
    await adm.開く(); note(開く注記);
    await adm.入れる(0, { 開催日時: "2026-09-20 12:00", フォーマット: フォーマット名("M1511-FG033"), 大会名日: "M1511-FG033-大会", 大会名英: "M1511-FG033-大会E", 参加人数: "20" });
  });
  await step(3, async () => { const r = await adm.設定を押す(); 押した結果の注記(r); 送った = r.送った; });
  await expected(async () => {
    expect.soft(送った, "「直近の大会設定」で送信されたこと").toBe(true);
    await expect.soft(adm.成功メッセージ, "画面上部の「保存しました」").toContainText("保存しました");
    expect.soft(new URL(page.url()).pathname, "遷移した画面のアドレス（直近の大会管理）").toBe(直近の大会管理のパス());
    await expect.soft(adm.フォーム, "直近の大会管理の編集画面の入力欄").toBeVisible();
  });
});
