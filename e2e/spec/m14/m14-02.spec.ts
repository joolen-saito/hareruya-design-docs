/** M14-02 カード情報CSV出力項目。正本: cases/M14-02_test_cases.tsv */
import { test, Page } from "@playwright/test";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { csvRecords } from "../../lib/csv";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { CardSearchPage, downloadedText } from "../../pages/admin/m14_card";
import { M1402_ADMIN, 詳細ID } from "../../seeds/m14-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const セット = "M1402-FG-SET";

/** 「CSV出力」を押し、ダウンロードされたCSVの行（列名→値）を返す。確認の表示（ダイアログ）が出たときは文も返す */
async function CSV出力を押す(page: Page, 待ち = 60_000): Promise<{ 行: Record<string, string>[] | null; ダイアログ: string }> {
  let ダイアログ = "";
  const onDialog = (d: import("@playwright/test").Dialog) => { ダイアログ = d.message(); void d.accept(); };
  page.on("dialog", onDialog);
  try {
    const dl = page.waitForEvent("download", { timeout: 待ち }).catch(() => null);
    await page.locator("#form_bulk button.action-submit").filter({ hasText: /^\s*CSV出力\s*$/ }).click({ timeout: 20_000, noWaitAfter: true });
    const d = await dl;
    return { 行: d ? csvRecords(await downloadedText(d)) : null, ダイアログ };
  } finally { page.off("dialog", onDialog); }
}

/** 選択して CSV 出力するケースの型（手順: 1 検索 / 2 選択 / 3 CSV出力 / 4 CSVを開く） */
function 出力して確かめる(token: string, 呼び名: string | null, 確かめ: (行: Record<string, string>[], notes: { get(l: string): string }) => void): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M1402_ADMIN);
    const l = new CardSearchPage(page);
    let 行: Record<string, string>[] = [];
    await step(1, async () => { await l.open(); await l.キーワードで検索する(token); });
    await step(2, async () => {
      if (呼び名) await l.カードを選択する([notes.get(呼び名)]);
      else await l.行.first().locator('input[name="cardIds[]"]').check();
    });
    await step(3, async () => {
      const r = await CSV出力を押す(page);
      expect(r.行, "CSVがダウンロードされた").not.toBeNull();
      行 = r.行 ?? [];
    });
    await step(4, async () => { expect(行.length, "ダウンロードされたCSVのデータ行数").toBeGreaterThan(0); });
    await expected(async () => {
      expect.soft(行.length, "CSVのデータ行数").toBeGreaterThan(0);
      確かめ(行, notes);
    });
  };
}

caseTest("IT-M14-02-015", 出力して確かめる(rc("M1402-FG015"), "〔カードID-M1402-015〕", (行, notes) => {
  expect.soft(行.length, "データ行の数").toBe(2);
  expect.soft(行.map((r) => r["name_en"]), "カード名(英語)").toEqual([rc("M1402-FG015") + "-Card", rc("M1402-FG015") + "-Card"]);
  expect.soft(行.map((r) => r["color"]), "カラー").toEqual(["White", "White"]);
  const a = 行.find((r) => r["card_detail_id"] === notes.get("〔カード詳細ID-M1402-015A〕"));
  const b = 行.find((r) => r["card_detail_id"] === notes.get("〔カード詳細ID-M1402-015B〕"));
  expect.soft(a?.["set"], "カード詳細Aの行のカードセット").toBe(セット);
  expect.soft(b?.["set"], "カード詳細Bの行のカードセット").toBe("");
}));
caseTest("IT-M14-02-017", 出力して確かめる(rc("M1402-FG017"), "〔カードID-M1402-017〕", (行) => {
  const 値 = (k: string) => (行[0]?.[k] ?? "").split(",").sort();
  const t = "M1402-FG017";
  expect.soft(値("format"), "使用可能フォーマット列").toEqual([`${t}-FMTA`, `${t}-FMTB`]);
  expect.soft(値("restriction_format"), "使用制限フォーマット列").toEqual([`${t}-FMTC`, `${t}-FMTD`]);
  expect.soft(値("ban_format"), "使用禁止フォーマット列").toEqual([`${t}-FMTE`, `${t}-FMTF`]);
  expect.soft((行[0]?.["format"] ?? "").split(",").length, "使用可能フォーマット列の語数（コンマ1つで連結）").toBe(2);
}));
caseTest("IT-M14-02-018", 出力して確かめる(rc("M1402-FG018"), "〔カードID-M1402-018〕", (行) => {
  for (const [k, 名] of [["image_jp", "画像URL(日本語)"], ["image_en", "画像URL(英語)"], ["back_card_detail_id", "裏面カード詳細ID"], ["color_sequence", "色順"]] as const) {
    expect.soft(行[0]?.[k], `${名}列`).toBe("");
  }
}));
caseTest("IT-M14-02-019", 出力して確かめる("M1402-FG019", null, (行) => {
  expect.soft(行.find((r) => r["card_detail_id"] === 詳細ID("2402019001"))?.["back_card_detail_id"], "カード詳細ID 2402019001（番号は上限に収まる値へ置き換え）の行の裏面カード詳細ID").toBe(詳細ID("2402019002"));
}));
caseTest("IT-M14-02-020", 出力して確かめる(rc("M1402-FG020"), "〔カードID-M1402-020〕", (行) => {
  expect.soft(行[0]?.["keyword_ability"], "キーワード能力列").toBe("");
}));

/** 選択せずにCSV出力を押したときの結果を読む */
async function 未選択で出力(page: Page): Promise<{ ダウンロード: boolean; ダイアログ: string; 上部メッセージ: number }> {
  const r = await CSV出力を押す(page, 4_000);
  await page.waitForTimeout(500);
  return { ダウンロード: r.行 !== null, ダイアログ: r.ダイアログ, 上部メッセージ: await page.locator(".alert:visible").count() };
}

caseTest("IT-M14-02-022", async ({ page, step, expected }) => {
  await loginAdmin(page, M1402_ADMIN);
  const l = new CardSearchPage(page);
  let r = { ダウンロード: true, ダイアログ: "", 上部メッセージ: 0 };
  await step(1, async () => { await l.open(); await l.キーワードで検索する(rc("M1402-FG022")); });
  await step(2, async () => { r = await 未選択で出力(page); });
  await expected(async () => {
    expect.soft(r.ダウンロード, "CSVがダウンロードされた").toBe(false);
    expect.soft(r.上部メッセージ, "管理画面上部に表示されたメッセージの数").toBeGreaterThan(0);
    expect.soft(await l.行.count(), "カード検索一覧に表示されているカードの行数").toBeGreaterThan(0);
    note(`画面の確認ダイアログの文: ${r.ダイアログ || "（なし）"}`);
  });
});

caseTest("IT-M14-02-023", async ({ page, step, expected }) => {
  await loginAdmin(page, M1402_ADMIN);
  const l = new CardSearchPage(page);
  let r = { ダウンロード: true, ダイアログ: "", 上部メッセージ: 0 };
  await step(1, async () => {
    await l.open(); await l.キーワードで検索する("M1402-FG023");
    await l.表示件数を選ぶ(10);
    note("表示件数の選択欄は検索結果が出た画面にあるので、先に検索してから10件を選んだ");
  });
  await step(2, async () => { await l.キーワードで検索する("M1402-FG023"); await l.ページ送りを押す("2"); });
  await step(3, async () => { r = await 未選択で出力(page); });
  await expected(async () => {
    expect.soft((await l.ページ送りの表示()).現在, "表示中のページ番号").toBe("2");
    expect.soft(await l.行.count(), "表示されているカードの行数").toBe(1);
    expect.soft(r.ダウンロード, "CSVがダウンロードされた").toBe(false);
  });
});

caseTest("IT-M14-02-024", async ({ page, step, expected }) => {
  const context = page.context();
  await loginAdmin(page, M1402_ADMIN);
  const l = new CardSearchPage(page);
  const tab2 = await context.newPage();
  const l2 = new CardSearchPage(tab2);
  let r: { 行: Record<string, string>[] | null; ダイアログ: string } = { 行: null, ダイアログ: "" };
  await step(1, async () => { await l.open(); await l.キーワードで検索する("M1402-FG024"); await l.行.nth(0).locator('input[name="cardIds[]"]').check(); await l.行.nth(1).locator('input[name="cardIds[]"]').check(); });
  await step(2, async () => {
    await l2.open(); await l2.キーワードで検索する("M1402-FG024-Card-B");
    const [b] = await l2.表示中のカードID();
    await l2.三点リーダーを押す(b); await l2.削除を押す(b); await l2.確認ポップアップで実行する();
  });
  await step(3, async () => { r = await CSV出力を押す(page); });
  await step(4, async () => { expect(r.行, "CSVがダウンロードされた").not.toBeNull(); });
  await expected(async () => {
    const rows = r.行 ?? [];
    expect.soft(rows.map((x) => x["card_detail_id"]), "CSVのカード詳細ID").toEqual([詳細ID("2402024001")]);
    expect.soft(rows.map((x) => x["name_en"]), "CSVのカード名(英語)").toEqual(["M1402-FG024-Card-A"]);
    expect.soft(await page.locator(".alert-danger:visible").count(), "表示されたエラーのメッセージの数").toBe(0);
  });
  await tab2.close();
});

caseTest("IT-M14-02-025", async ({ page, step, expected }) => {
  const context = page.context();
  await loginAdmin(page, M1402_ADMIN);
  const l = new CardSearchPage(page);
  const tab2 = await context.newPage();
  const l2 = new CardSearchPage(tab2);
  let r: { 行: Record<string, string>[] | null; ダイアログ: string } = { 行: null, ダイアログ: "" };
  await step(1, async () => { await l.open(); await l.キーワードで検索する("M1402-FG025"); await l.行.nth(0).locator('input[name="cardIds[]"]').check(); await l.行.nth(1).locator('input[name="cardIds[]"]').check(); });
  await step(2, async () => {
    await l2.open(); await l2.キーワードで検索する("M1402-FG025");
    for (const id of await l2.表示中のカードID()) {
      await l2.open(); await l2.キーワードで検索する("M1402-FG025");
      await l2.三点リーダーを押す(id); await l2.削除を押す(id); await l2.確認ポップアップで実行する();
    }
  });
  await step(3, async () => { r = await CSV出力を押す(page, 8_000); await page.waitForTimeout(500); });
  await expected(async () => {
    expect.soft(r.行, "ダウンロードされたCSV").toBeNull();
    expect.soft(await page.locator(".alert:visible").count(), "管理画面上部に表示されたメッセージの数").toBeGreaterThan(0);
    expect.soft(await l.form.count(), "カード検索一覧画面の検索欄").toBe(1);
  });
  await tab2.close();
});
