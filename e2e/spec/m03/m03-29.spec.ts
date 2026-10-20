/**
 * M03-29 売上分析タグ更新CSV登録。正本: cases/M03-29_test_cases.tsv
 *
 * 実装したのは、画面だけで準備できる5件（008・031・033・035・043）。ほかのケースは、取込履歴・売上分析タグのマスタ・
 * 商品をDBで用意するシードを使うか、商品を作るシードを使う（いまの手元のDBでは商品を作れない）ので実装しない（seeds/m03-29.ts の冒頭）。
 *
 * 正本の「売上分析タグ更新CSV登録画面」は、画面の見出しが「売上分析タグ更新CSVアップロード」の画面（メニュー「商品管理」→「CSV管理」）。
 */
import fs from "node:fs";
import path from "node:path";
import { expect, Page, test } from "@playwright/test";
import { STATE_DIR } from "../../config/env";
import { caseTest } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { loginAdmin } from "../../lib/session";
import { pathOf, topMessages } from "../../pages/admin/m03_21_shelf_number";
import { SalesTagCsvUploadPage, salesTagCsvUploadPath, SubmitResult } from "../../pages/admin/m03_29_sales_tag_csv_upload";
import { M0329_ADMIN, m0329CsvPath } from "../../seeds/m03-29";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 試験管理者でログインする（事前準備①） */
async function signIn(page: Page): Promise<SalesTagCsvUploadPage> {
  await loginAdmin(page, M0329_ADMIN);
  return new SalesTagCsvUploadPage(page);
}

/** アップロードの送信の結果を注記に残す（ブラウザの入力チェックで止まったとき・応答の状態） */
function noteSubmit(r: SubmitResult): void {
  if (r.sent) note(`「CSVファイルをアップロード」を押したあとの取込の要求の応答: ${r.status}`);
  else note(`「CSVファイルをアップロード」を押すと、ブラウザの入力チェックが送信を止めた（要求は送られていない）: ${r.止めた項目.join(" / ")}`);
}

/** 画面上部に出たメッセージを注記に残し、エラーの文を返す */
async function noteMessages(page: Page, when: string): Promise<string[]> {
  const m = await topMessages(page);
  const all = [...m.成功.map((t) => `成功「${t}」`), ...m.エラー.map((t) => `エラー「${t}」`)];
  note(`${when}の画面上部のメッセージ: ${all.length ? all.join(" / ") : "なし"}`);
  return m.エラー;
}

/**
 * 取込の要求が送られ、その結果として売上分析タグ更新CSVアップロード画面にいること（「…画面へ遷移／戻ること」）。
 * ブラウザの入力チェックで送信が止まったときは、元の画面にいても合格にしない（要求が送られたことを確かめる）。
 */
async function expectBackOnUploadScreen(page: Page, upload: SalesTagCsvUploadPage, r: SubmitResult): Promise<void> {
  expect.soft(r.sent, "「CSVファイルをアップロード」で取込の要求が送られた").toBe(true);
  expect.soft(pathOf(page.url()), "送信のあとの画面").toBe(salesTagCsvUploadPath());
  await expect.soft(upload.見出し, "送信のあとの画面の見出し").toHaveText(/^\s*売上分析タグ更新CSVアップロード\s*$/);
}

const list = (errors: string[]) => errors.join(" / ") || "なし";

// ---- 雛形 ----

caseTest("IT-M03-29-008", async ({ page, step, expected }) => {
  const TEMPLATE = "product_tag_sales_analysis_template.csv";
  // 事前準備②: このケースのダウンロード先から同名のファイルを消し、無い状態にする（ダウンロードしたファイルは、ここへ画面が示した名前で置く）
  const dir = path.join(STATE_DIR, "m03-29", "downloads-008");
  fs.mkdirSync(dir, { recursive: true });
  fs.rmSync(path.join(dir, TEMPLATE), { force: true });
  expect(fs.existsSync(path.join(dir, TEMPLATE)), `開始時のダウンロード先に ${TEMPLATE} が無い`).toBe(false);
  const upload = await signIn(page);
  let suggested = "";
  let names: string[] = [];
  let bytes = Buffer.alloc(0);
  await step(1, async () => { await upload.open(); });
  await step(2, async () => {
    const download = await upload.downloadTemplate();
    suggested = download.suggestedFilename();
    await download.saveAs(path.join(dir, path.basename(suggested)));
  });
  await step(3, async () => {
    names = fs.readdirSync(dir);
    bytes = fs.readFileSync(path.join(dir, path.basename(suggested)));
    note(`ダウンロードしたファイルの名前は「${suggested}」。先頭の3バイトは「${bytes.subarray(0, 3).toString("hex")}」、全体は ${bytes.length} バイト`);
  });
  await expected(async () => {
    expect.soft(suggested, "ダウンロードしたファイルの名前").toBe(TEMPLATE);
    expect.soft(names, "ダウンロード先のファイル").toContain(TEMPLATE);
    const text = decodeCsvBytes(bytes);
    // 末尾の改行1つを除いて、改行で分けた行の数（空の行も1行と数える）
    const lines = text.replace(/(\r\n|\n|\r)$/, "").split(/\r\n|\n|\r/);
    expect.soft(lines.length, `ファイルの行数（中身: ${JSON.stringify(text)}）`).toBe(1);
    expect.soft(parseCsv(text), "ファイルの中身（「商品ID」「売上分析タグ(ID)」の順の見出し行だけ）").toEqual([["商品ID", "売上分析タグ(ID)"]]);
  });
});

// ---- 送信の結果の画面 ----

caseTest("IT-M03-29-031", async ({ page, step, expected }) => {
  const upload = await signIn(page);
  let r!: SubmitResult;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => {
    expect(await upload.chosenCount(), "取込ファイルの欄で選ばれているファイルの数").toBe(0);
    r = await upload.submit();
    noteSubmit(r);
    await noteMessages(page, "アップロードを押したあと");
  });
  await expected(async () => {
    await expectBackOnUploadScreen(page, upload, r);
    // 形式エラー＝設計書の M03-29-MSG-002「CSVのフォーマットが一致しません」（ファイルが選択されていないとき）
    const errors = (await topMessages(page)).エラー;
    expect.soft(errors.some((t) => t.includes("CSVのフォーマットが一致しません")), `画面上部の形式エラー「CSVのフォーマットが一致しません」（表示: ${list(errors)}）`).toBe(true);
  });
});

caseTest("IT-M03-29-033", async ({ page, step, expected }) => {
  const upload = await signIn(page);
  let r!: SubmitResult;
  await step(1, async () => {
    await upload.open();
    await upload.choose(m0329CsvPath("replace-M0329-033.csv"));
    expect(await upload.chosenCount(), "取込ファイルの欄で選ばれているファイルの数").toBe(1);
  });
  await step(2, async () => {
    await upload.changeToken("invalid-token");
    expect(await upload.tokenValue(), "フォームの中のなりすまし対策トークン").toBe("invalid-token");
  });
  await step(3, async () => {
    r = await upload.submit();
    noteSubmit(r);
    await noteMessages(page, "アップロードを押したあと");
  });
  await expected(async () => {
    // 「CSV取込画面」は、設計書の M03-29-MSG-001 の後続処理「CSV取込画面に遷移する」の画面（売上分析タグ更新CSVアップロード画面）
    await expectBackOnUploadScreen(page, upload, r);
    // フォーム入力エラー＝M03-29-MSG-001（CSV取込フォームの入力が無効なとき）。なりすまし対策トークンが無効なときの文は
    // 「CSRFトークンが無効です、再送信してください。」
    const errors = (await topMessages(page)).エラー;
    expect.soft(errors.some((t) => t.includes("CSRFトークンが無効です、再送信してください。")),
      `画面上部のフォーム入力エラー「CSRFトークンが無効です、再送信してください。」（表示: ${list(errors)}）`).toBe(true);
  });
});

caseTest("IT-M03-29-035", async ({ page, step, expected }) => {
  const upload = await signIn(page);
  let r!: SubmitResult;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => {
    await upload.choose(m0329CsvPath("bad-header-M0329-035.csv"));
    expect(await upload.chosenCount(), "取込ファイルの欄で選ばれているファイルの数").toBe(1);
    r = await upload.submit();
    noteSubmit(r);
    await noteMessages(page, "アップロードを押したあと");
  });
  await expected(async () => {
    await expectBackOnUploadScreen(page, upload, r);
    // ヘッダ不正エラー＝見出し行がフォーマットと一致しないことを示すエラー。アプリの取込が見出し行の誤りに出す文は
    // 「CSVのフォーマットが一致しません。」（行番号の付かない形。行番号の付く形はデータ行の誤り）
    const errors = (await topMessages(page)).エラー;
    expect.soft(errors.includes("CSVのフォーマットが一致しません。"), `画面上部のヘッダ不正エラー「CSVのフォーマットが一致しません。」（表示: ${list(errors)}）`).toBe(true);
  });
});

caseTest("IT-M03-29-043", async ({ page, step, expected }) => {
  const upload = await signIn(page);
  let r!: SubmitResult;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => {
    await upload.choose(m0329CsvPath("header-only-M0329-043.csv"));
    expect(await upload.chosenCount(), "取込ファイルの欄で選ばれているファイルの数").toBe(1);
    r = await upload.submit();
    noteSubmit(r);
    await noteMessages(page, "アップロードを押したあと");
  });
  await expected(async () => {
    await expectBackOnUploadScreen(page, upload, r);
    // データ行がないことを示すエラー。アプリの取込がデータ行の無いファイルに出す文は「CSVデータが存在しません。」
    const errors = (await topMessages(page)).エラー;
    expect.soft(errors.some((t) => t.includes("CSVデータが存在しません。")), `画面上部のデータ行なしのエラー「CSVデータが存在しません。」（表示: ${list(errors)}）`).toBe(true);
  });
});
