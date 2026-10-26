/** M03-40 棚番号更新CSV登録。正本: cases/M03-40_test_cases.tsv */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { parseCsv } from "../../lib/csv";
import { loginAdmin } from "../../lib/session";
import { 棚番号更新CSVの取込履歴件数 } from "../../db/m03_40_shelf_csv_history";
import { CsvUploadResult, describeCsvUpload } from "../../pages/admin/m03_38_product_status_csv";
import { ShelfNumberCsvScreen, 棚番号更新CSV登録 } from "../../pages/admin/m03_40_shelf_number_csv";
import { M0340_ADMIN, SHELF_CSV_HEADERS, shelfCsvFile } from "../../seeds/m03-40";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const BOM = Buffer.from([0xef, 0xbb, 0xbf]);

/** 正本の「新しいブラウザセッションで管理者としてログインしている」（テストごとの新しいセッションでログインする） */
async function signIn(page: Parameters<typeof loginAdmin>[0]): Promise<ShelfNumberCsvScreen> {
  await loginAdmin(page, M0340_ADMIN);
  return new ShelfNumberCsvScreen(page);
}

// ---- 003 雛形ファイルダウンロード ----

caseTest("IT-M03-40-003", async ({ page, step, expected }) => {
  const csv = await signIn(page);
  let file: { fileName: string; bytes: Buffer } | null = null;
  let text = "";
  note("事前準備③（ダウンロード先に product_shelf_number.csv が無い）: Playwright はテストごとに新しい一時的なダウンロード先を使うので、同名のファイルは無い");
  await step(1, async () => { await csv.open(); });
  await step(2, async () => { file = await csv.downloadTemplate(); });
  await step(3, async () => {
    if (!file) throw new Error("雛形ファイルをダウンロードしていない");
    const f: { fileName: string; bytes: Buffer } = file;
    await test.info().attach(`ダウンロードしたファイル ${f.fileName}`, { body: f.bytes, contentType: "text/csv" });
    text = new TextDecoder("utf-8").decode(f.bytes.subarray(f.bytes.subarray(0, 3).equals(BOM) ? 3 : 0));
    note(`ダウンロードしたファイル名: ${f.fileName}。内容（BOMを除く）: ${JSON.stringify(text)}`);
  });
  await expected(async () => {
    const f = file as unknown as { fileName: string; bytes: Buffer };
    expect.soft(f.fileName, "ダウンロードしたファイルの名称").toBe("product_shelf_number.csv");
    expect.soft(f.bytes.subarray(0, 3).equals(BOM), "先頭にBOM（EF BB BF）がある").toBe(true);
    const lines = text.split(/\r\n|\n|\r/).filter((l, i, a) => !(i === a.length - 1 && l === ""));
    expect.soft(lines.length, "行は見出し行の1行だけ（データ行を含まない）").toBe(1);
    expect.soft(lines[0], "見出し行は設定された区切り文字（カンマ）で区切られた「商品コード」「棚番号名称」").toBe(SHELF_CSV_HEADERS.join(","));
    expect.soft(parseCsv(text)[0], "見出し行の項目").toEqual(SHELF_CSV_HEADERS);
  });
});

// ---- 016 行数上限のファイルの取込後の遷移 ----

caseTest("IT-M03-40-016", async ({ page, step, expected }) => {
  const csv = await signIn(page);
  let r: CsvUploadResult | null = null;
  await step(1, async () => { await csv.open(); });
  await step(2, async () => {
    const f = shelfCsvFile("m0340-110000-016.csv");
    note(`m0340-110000-016.csv の内容: ${f.内容の要約}`);
    r = await csv.upload(f);
    note(`アップロードの結果: ${describeCsvUpload(r)}`);
  });
  await expected(async () => {
    const got = r as unknown as CsvUploadResult;
    expect.soft(got.送信した, "アップロードが送信された").toBe(true);
    expect.soft(got.応答, "取込の要求の応答が302（画面へ戻す）").toBe(302);
    expect.soft(got.移動先 ? new URL(got.移動先, page.url()).pathname.endsWith(棚番号更新CSV登録.画面) : false,
      `取込の要求の応答の移動先が棚番号更新CSV登録画面（${got.移動先}）`).toBe(true);
    expect.soft(new URL(page.url()).pathname.endsWith(棚番号更新CSV登録.画面), `表示中の画面が棚番号更新CSV登録画面（${page.url()}）`).toBe(true);
    await expect.soft(csv.form, "棚番号更新CSV登録画面のアップロードの枠が表示されている").toBeVisible();
  });
});

// ---- 021 ファイル未選択で取込履歴が増えない ----

caseTest("IT-M03-40-021", async ({ page, step, expected }) => {
  const csv = await signIn(page);
  let before = -1;
  let after = -1;
  let r: CsvUploadResult | null = null;
  await step(1, async () => {
    await csv.open();
    await expect(csv.ファイル, "CSVファイル選択の状態が空").toHaveJSProperty("value", "");
  });
  await step(2, async () => {
    before = 棚番号更新CSVの取込履歴件数();
    note(`DBの棚番号更新CSVの取込履歴件数（押す前）: ${before}`);
  });
  await step(3, async () => {
    r = await csv.pressUpload();
    note(`ファイルを選択せずに押した結果: ${describeCsvUpload(r)}`);
  });
  await step(4, async () => {
    after = 棚番号更新CSVの取込履歴件数();
    note(`DBの棚番号更新CSVの取込履歴件数（押したあと）: ${after}`);
  });
  await expected(async () => {
    const got = r as unknown as CsvUploadResult;
    // 送信されないまま「増えない」を合格にしない（ブラウザの入力チェックが送信を止めたら、取込の判定まで届いていない）
    expect.soft(got.送信した, `アップロードの要求が送信された（${describeCsvUpload(got)}）`).toBe(true);
    expect.soft(after, `取込履歴が追加されない（押す前 ${before} 件）`).toBe(before);
  });
});
