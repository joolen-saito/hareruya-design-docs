/**
 * M07-08 戻しリストCSV出力。正本: cases/M07-08_test_cases.tsv
 *
 * サプライ品だけで準備できるケースを実装した（記録 review/M07-08_progress_2026-11-02.md）。
 * 言語・状態・色・レアリティの並び順をDBへ直接設定するシード（MASTER）を使うケースは実装していない。
 * 高額商品閾値（共有の設定）を書き換えるケースは、ケースが終わるたびに元の値へ戻し、DBで戻った値を確かめる。
 */
import { Browser, Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { CSVの全行, CSVの内容を画面の枠に出す, CSVの枠のセル } from "../../lib/evidence_other";
import { topErrorAlerts } from "../../pages/admin/common";
import { BuyListPage, CSVを読む } from "../../pages/admin/m07_buy";
import { M0708_ADMIN, カードスリーブ名, スリーブ016名, 閾値を戻す } from "../../seeds/m07-08";
import { 棚戻し済みか } from "../../db/m07";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 共有の設定（高額商品閾値）を戻す。戻せなかったときは落とす */
async function 戻す(browser: Browser): Promise<void> {
  const ng = await 閾値を戻す(browser);
  expect(ng, "共有の設定（高額商品閾値）を元の値へ戻せた").toBe("");
}

const 氏名 = (s: string) => s;

/** 読んだCSV（ファイル名・見出し・全データ行）を画面の枠に出し（ダウンロードの選択肢は先に閉じる）、商品名の行の枠の行の番号（無ければ -1）を返す */
async function CSVを枠に出す(l: BuyListPage, file: import("@playwright/test").Download, csv: Awaited<ReturnType<typeof CSVを読む>>, 商品名: string): Promise<number> {
  await l.ダウンロードの選択肢を閉じる();
  await CSVの内容を画面の枠に出す(l.page, [{ 題: `ファイル名：${file.suggestedFilename()}`, 行: CSVの全行(csv) }]);
  return csv.行.findIndex((r) => r["商品名"] === 商品名);
}

caseTest("IT-M07-08-004", async ({ page, browser, notes, step, expected }) => {
  try {
    await loginAdmin(page, M0708_ADMIN);
    const l = new BuyListPage(page);
    let rows: Record<string, string>[] = [];
    let 行番号 = -1;
    await step(1, async () => { await l.open(); });
    await step(2, async () => { await l.注文者名を入れる(氏名("戻しCSV基本試験-004")); await l.検索する(); });
    await step(3, async () => { await l.対象にする(notes.get("〔買取番号-M0708-004〕")); });
    let csv: Awaited<ReturnType<typeof CSVを読む>> | null = null;
    await step(4, async () => {
      const r = await l.ダウンロードを押す("戻しリストCSV");
      expect(r.file, "戻しリストCSVのダウンロード").not.toBeNull();
      csv = await CSVを読む(r.file!);
      行番号 = await CSVを枠に出す(l, r.file!, csv, カードスリーブ名());
    });
    await step(5, async () => { rows = csv!.行.filter((r) => r["商品名"] === カードスリーブ名()); });
    await expected(async () => {
      expect.soft(rows.length, "「カードスリーブ」の行の数").toBe(1);
      await expect.soft(CSVの枠のセル(page, 0, 行番号, "ピッキング区分"), "ピッキング区分").toHaveText("サプライ");
      await expect.soft(CSVの枠のセル(page, 0, 行番号, "言語/状態"), "言語/状態").toHaveText("サプライ品");
      await expect.soft(CSVの枠のセル(page, 0, 行番号, "略称"), "略称が空欄").toHaveText("");
    });
  } finally { await 戻す(browser); }
});

caseTest("IT-M07-08-006", async ({ page, browser, notes, step, expected }) => {
  try {
    await loginAdmin(page, M0708_ADMIN);
    const l = new BuyListPage(page);
    const A = () => notes.get("〔買取番号-M0708-006A〕"), B = () => notes.get("〔買取番号-M0708-006B〕");
    let got: { file: boolean } = { file: false };
    await step(1, async () => { await l.open(); });
    await step(2, async () => { await l.注文者名を入れる(氏名("戻しCSV基本試験-006")); await l.検索する(); });
    await step(3, async () => { await l.対象にする(A()); await l.対象にする(B()); });
    await step(4, async () => { const r = await l.ダウンロードを押す("戻しリストCSV"); got = { file: r.file !== null }; });
    let a: boolean | null = null, b: boolean | null = null;
    await step(5, async () => { a = 棚戻し済みか(A()); b = 棚戻し済みか(B()); });
    await expected(async () => {
      expect.soft(got.file, "CSVがダウンロードされた").toBe(true);
      expect.soft(a, "DBの、買取番号Aの棚戻し済みフラグ（棚戻し済み）").toBe(true);
      expect.soft(b, "DBの、買取番号Bの棚戻し済みフラグ（棚戻し済み）").toBe(true);
    });
  } finally { await 戻す(browser); }
});

caseTest("IT-M07-08-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M0708_ADMIN);
  const l = new BuyListPage(page);
  let r: Awaited<ReturnType<BuyListPage["ダウンロードを押す"]>> | null = null;
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.注文者名を入れる(氏名("戻しCSV基本試験-007")); await l.検索する(); });
  await step(3, async () => { r = await l.ダウンロードを押す("戻しリストCSV"); });
  await expected(async () => {
    expect.soft(r?.file ?? null, "CSVのダウンロード").toBeNull();
    // 送信の応答（リダイレクト）の画面にエラーの帯が出てから文を読む（移る前の画面の文を読まない）
    await expect.soft(topErrorAlerts(page).first(), "管理画面上部のエラー表示").toBeVisible();
    const top = (await topErrorAlerts(page).allInnerTexts()).join(" / ");
    expect.soft(top, "エラーの文（買取注文が未選択）").toContain("選択");
    expect.soft(new URL(page.url()).pathname, "買取一覧(検索結果)画面").toMatch(/^\/admin\/purchase\/(list|page\/\d+)?$/);
    note(`操作の結果: 警告のダイアログ ${r?.ダイアログ.length ?? 0} 件（${(r?.ダイアログ ?? []).join(" / ")}）`);
  });
});

/** 開発者ツールでチェック済み項目の買取番号を書き換える（チェック欄の値を変える） */
async function 値を変える(page: Page, 番号: string, 新: string): Promise<void> {
  const n = await page.locator(`#result_list_main__item--${Number(番号)} input[type=checkbox]`).evaluate((el, v) => { (el as HTMLInputElement).value = v; return (el as HTMLInputElement).checked; }, 新);
  expect(n, "書き換えた項目がチェック済み").toBe(true);
}

caseTest("IT-M07-08-008", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0708_ADMIN);
  const l = new BuyListPage(page);
  let r: Awaited<ReturnType<BuyListPage["ダウンロードを押す"]>> | null = null;
  const N = () => notes.get("〔買取番号-M0708-008〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.注文者名を入れる(氏名("戻しCSV基本試験-008")); await l.検索する(); });
  await step(3, async () => { await l.対象にする(N()); });
  await step(4, async () => { await 値を変える(page, N(), "7999999"); });
  await step(5, async () => { r = await l.ダウンロードを押す("戻しリストCSV"); });
  await expected(async () => {
    expect.soft(r?.file ?? null, "CSVのダウンロード").toBeNull();
    // 送信の応答（リダイレクト）の画面にエラーの帯が出てから文を読む（移る前の画面の文を読まない）
    await expect.soft(topErrorAlerts(page).first(), "管理画面上部のエラー表示").toBeVisible();
    const top = (await topErrorAlerts(page).allInnerTexts()).join(" / ");
    expect.soft(top, "エラーの文（選択した全件が存在しない）").toMatch(/存在しない|存在しません|見つかりません/);
    expect.soft(new URL(page.url()).pathname, "買取一覧(検索結果)画面").toMatch(/^\/admin\/purchase\/(list|page\/\d+)?$/);
  });
});

caseTest("IT-M07-08-009", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0708_ADMIN);
  const l = new BuyListPage(page);
  let r: Awaited<ReturnType<BuyListPage["ダウンロードを押す"]>> | null = null;
  const A = () => notes.get("〔買取番号-M0708-009A〕"), B = () => notes.get("〔買取番号-M0708-009B〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.注文者名を入れる(氏名("戻しCSV基本試験-009")); await l.検索する(); });
  await step(3, async () => { await l.対象にする(A()); await l.対象にする(B()); });
  await step(4, async () => { await 値を変える(page, B(), "7999999"); });
  await step(5, async () => { r = await l.ダウンロードを押す("戻しリストCSV"); });
  await expected(async () => {
    expect.soft(r?.file ?? null, "CSVのダウンロード").toBeNull();
    // 送信の応答（リダイレクト）の画面にエラーの帯が出てから文を読む（移る前の画面の文を読まない）
    await expect.soft(topErrorAlerts(page).first(), "管理画面上部のエラー表示").toBeVisible();
    const top = (await topErrorAlerts(page).allInnerTexts()).join(" / ");
    expect.soft(top, "エラーの文（選択中に存在しない買取が含まれる）").toMatch(/存在しない|存在しません|見つかりません/);
    expect.soft(new URL(page.url()).pathname, "買取一覧(検索結果)画面").toMatch(/^\/admin\/purchase\/(list|page\/\d+)?$/);
  });
});

caseTest("IT-M07-08-016", async ({ page, browser, notes, step, expected }) => {
  try {
    await loginAdmin(page, M0708_ADMIN);
    const l = new BuyListPage(page);
    let csv: Awaited<ReturnType<typeof CSVを読む>> | null = null;
    let rows: Record<string, string>[] = [];
    let 行番号 = -1;
    await step(1, async () => { await l.open(); });
    await step(2, async () => { await l.注文者名を入れる(氏名("戻しリスト組合せ試験-M0708-CB016")); await l.検索する(); });
    await step(3, async () => { await l.対象にする(notes.get("〔買取番号-M0708-CB016〕")); });
    await step(4, async () => {
      const r = await l.ダウンロードを押す("戻しリストCSV");
      expect(r.file, "戻しリストCSVのダウンロード").not.toBeNull();
      csv = await CSVを読む(r.file!);
      行番号 = await CSVを枠に出す(l, r.file!, csv, スリーブ016名());
    });
    await step(5, async () => { rows = csv!.行.filter((r) => r["商品名"] === スリーブ016名()); });
    await expected(async () => {
      expect.soft(rows.length, "「戻しスリーブM0708-CB016」の行の数").toBe(1);
      await expect.soft(CSVの枠のセル(page, 0, 行番号, "ピッキング区分"), "ピッキング区分").toHaveText("サプライ");
      await expect.soft(CSVの枠のセル(page, 0, 行番号, "言語/状態"), "言語/状態").toHaveText("サプライ品");
      await expect.soft(CSVの枠のセル(page, 0, 行番号, "略称"), "略称が空欄").toHaveText("");
      await expect.soft(CSVの枠のセル(page, 0, 行番号, "数"), "数").toHaveText("3");
      await expect.soft(CSVの枠のセル(page, 0, 行番号, "基準価格"), "基準価格").toHaveText("50");
    });
  } finally { await 戻す(browser); }
});

caseTest("IT-M07-08-019", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0708_ADMIN);
  const l = new BuyListPage(page);
  let r: Awaited<ReturnType<BuyListPage["ダウンロードを押す"]>> | null = null;
  const A = () => notes.get("〔買取番号-M0708-CB019A〕"), B = () => notes.get("〔買取番号-M0708-CB019B〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.注文者名を入れる(氏名("戻しリスト組合せ試験-M0708-CB019")); await l.検索する(); });
  await step(3, async () => { await l.対象にする(A()); await l.対象にする(B()); });
  await step(4, async () => { r = await l.ダウンロードを押す("戻しリストCSV"); });
  await step(5, async () => { await page.waitForLoadState("load"); });
  await expected(async () => {
    // 送信の応答（リダイレクト）の画面にエラーの帯が出てから文を読む（移る前の画面の文を読まない）
    await expect.soft(topErrorAlerts(page).first(), "管理画面上部のエラー表示").toBeVisible();
    const top = (await topErrorAlerts(page).allInnerTexts()).join(" / ");
    expect.soft(top, "エラーに買取番号（7桁）").toContain(`買取番号: ${String(Number(B())).padStart(7, "0")}`);
    expect.soft(top, "エラーの文").toContain("出力対象に入庫待ち、入庫済み以外のステータスが設定されています。");
    expect.soft(new URL(page.url()).pathname, "買取一覧(検索結果)画面").toMatch(/^\/admin\/purchase\/(list|page\/\d+)?$/);
    expect.soft(r?.file ?? null, "CSVファイルのダウンロード（追加されない）").toBeNull();
  });
});

void (null as unknown as CaseCtx);
