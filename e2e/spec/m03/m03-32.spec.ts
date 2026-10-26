/**
 * M03-32 高額商品価格変更CSV登録。正本: cases/M03-32_test_cases.tsv
 *
 * 実装したのは、画面だけで準備できる10件（001・005・006・012・014・015・016・019・020・026）。
 * ほかのケースは、シードがDBへの直接設定（販売価格900・取込履歴・価格履歴・更新日時・スマレジ商品IDなど）を含むか、
 * 外部サービス（スマレジ・ユニサーチ）や、DBで登録するマスタ（割引率A）を使うので実装しない（記録 review/M03-32_progress_2026-10-21.md）。
 *
 * 正本の「高額商品価格変更CSVアップロード画面」は、メニュー「商品管理」→「CSV管理」の画面（見出し「高額商品価格変更CSVアップロード」）。
 * 正本の「CSVファイルのアップロードボタン」は、画面の「CSVファイルをアップロード」ボタン。
 */
import fs from "node:fs";
import path from "node:path";
import { Page, test } from "@playwright/test";
import { STATE_DIR } from "../../config/env";
import { 商品規格の状態 } from "../../db/m03_32_high_price";
import { expect, CaseCtx, caseTest } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { loginAdmin } from "../../lib/session";
import { HighPriceCsvUploadPage, pathOf, SubmitResult, uploadPath } from "../../pages/admin/m03_32_high_price_csv";
import { M0332_ADMIN, m0332FilePath } from "../../seeds/m03-32";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const list = (xs: string[]) => xs.join(" / ") || "なし";

/** 試験管理者でログインする（事前準備①） */
async function signIn(page: Page): Promise<HighPriceCsvUploadPage> {
  await loginAdmin(page, M0332_ADMIN);
  return new HighPriceCsvUploadPage(page, "高額商品価格変更");
}

/** アップロードの送信の結果と、画面上部のメッセージを注記に残す */
async function noteSubmit(upload: HighPriceCsvUploadPage, r: SubmitResult): Promise<void> {
  if (r.sent) note(`「CSVファイルをアップロード」を押したあとの取込の要求の応答: ${r.status}`);
  else note(`「CSVファイルをアップロード」を押すと、ブラウザの入力チェックが送信を止めた（要求は送られていない）: ${r.止めた項目.join(" / ")}`);
  const m = await upload.messages();
  note(`押したあとの画面上部のメッセージ: 成功「${list(m.成功)}」・警告「${list(m.警告)}」・エラー「${list(m.エラー)}」`);
}

/**
 * 取込の要求が送られ、その結果として高額商品価格変更CSVアップロード画面にいること（「…画面へ遷移／戻ること」）。
 * ブラウザの入力チェックで送信が止まったときは、元の画面にいても合格にしない（要求が送られたことを確かめる）。
 */
async function expectOnUploadScreen(page: Page, upload: HighPriceCsvUploadPage, r: SubmitResult): Promise<void> {
  expect.soft(r.sent, "「CSVファイルをアップロード」で取込の要求が送られた").toBe(true);
  expect.soft(pathOf(page.url()), "送信のあとの画面").toBe(uploadPath("高額商品価格変更"));
  await expect.soft(upload.見出し, "送信のあとの画面の見出し").toHaveText(/^\s*高額商品価格変更CSVアップロード\s*$/);
}

/** ファイルを選んで「CSVファイルをアップロード」を押す（手順「…を選択してCSVファイルのアップロードボタンを押す」） */
async function chooseAndSubmit(upload: HighPriceCsvUploadPage, file: string): Promise<SubmitResult> {
  await upload.choose(m0332FilePath(file));
  expect(await upload.chosenNames(), "取込ファイルの欄で選ばれているファイル").toEqual([file]);
  const r = await upload.submit();
  await noteSubmit(upload, r);
  return r;
}

// ---- 雛形 ----

caseTest("IT-M03-32-001", async ({ page, step, expected }) => {
  const TEMPLATE = "simple_high_price.csv";
  // 事前準備②: このケースのダウンロード先から同名のファイルを消し、無い状態にする（ダウンロードしたファイルは、ここへ画面が示した名前で置く）
  const dir = path.join(STATE_DIR, "m03-32", "downloads-001");
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
    const lines = text.replace(/(\r\n|\n|\r)$/, "").split(/\r\n|\n|\r/);
    expect.soft(lines.length, `ファイルの行数（中身: ${JSON.stringify(text)}）`).toBe(1);
    expect.soft(parseCsv(text), "ファイルの中身（「商品コード」「基準価格」の見出し行だけ）").toEqual([["商品コード", "基準価格"]]);
  });
});

// ---- セール中の商品 ----

caseTest("IT-M03-32-005", async ({ page, notes, step, expected, db }) => {
  const classId = notes.get("〔商品規格ID-M0332-005〕");
  const before = 商品規格の状態(classId);
  note(`取込前の商品規格（DBの参照）: 基準価格 ${before?.基準価格}・販売価格 ${before?.販売価格}・セール ${before?.セール}`);
  const upload = await signIn(page);
  let r!: SubmitResult;
  let after: ReturnType<typeof 商品規格の状態> = null;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { r = await chooseAndSubmit(upload, "sale-005.csv"); });
  await step(3, async () => {
    expect(db.available, "DB確認の接続先").toBe(true);
    after = 商品規格の状態(classId);
    note(`取込後の商品規格（DBの参照）: 商品コード ${after?.商品コード}・基準価格 ${after?.基準価格}・販売価格 ${after?.販売価格}・セール ${after?.セール}`);
  });
  await expected(async () => {
    expect.soft(r.sent, "取込の要求が送られた").toBe(true);
    expect(after, `商品規格ID ${classId} の商品規格`).not.toBeNull();
    expect.soft(after!.商品コード, "商品規格の商品コード").toBe("HIGH-S-0001-005");
    expect.soft(after!.セール, "セールフラグが有効").toBe(true);
    expect.soft(after!.基準価格, "基準価格が1500へ更新される").toBe("1500");
    expect.soft(after!.販売価格, "販売価格が800のまま").toBe("800");
  });
});

caseTest("IT-M03-32-006", async ({ page, step, expected }) => {
  const upload = await signIn(page);
  let r!: SubmitResult;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { r = await chooseAndSubmit(upload, "sale-006.csv"); });
  await expected(async () => {
    await expectOnUploadScreen(page, upload, r);
    // セール中商品の販売価格を変更しなかった旨の警告＝設計書 M03-32-MSG-004「%d行目: セール中商品のため、基準価格のみ更新しました。（販売価格は変更されません）」
    const m = await upload.messages();
    expect.soft(m.警告.some((t) => /\d+行目: セール中商品のため、基準価格のみ更新しました。（販売価格は変更されません）/.test(t)),
      `画面上部の警告「n行目: セール中商品のため、基準価格のみ更新しました。（販売価格は変更されません）」（警告: ${list(m.警告)}）`).toBe(true);
  });
});

// ---- 送信の受付 ----

caseTest("IT-M03-32-012", async ({ page, step, expected }) => {
  // 事前準備②: 新しいブラウザセッション（ケースごとに新しいブラウザの文脈）で開き、CSVファイル選択が空であることを手順1で確かめる
  const upload = await signIn(page);
  let r!: SubmitResult;
  await step(1, async () => {
    await upload.open();
    expect(await upload.chosenNames(), "CSVファイル選択が空").toEqual([]);
  });
  await step(2, async () => {
    r = await upload.submit();
    await noteSubmit(upload, r);
  });
  await expected(async () => {
    await expectOnUploadScreen(page, upload, r);
    const m = await upload.messages();
    expect.soft(m.エラー.length, `画面上部のエラー（エラー: ${list(m.エラー)}）`).toBeGreaterThan(0);
  });
});

caseTest("IT-M03-32-014", async ({ page, step, expected }) => {
  const upload = await signIn(page);
  let r!: SubmitResult;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => {
    await upload.choose(m0332FilePath("normal-014.csv"));
    expect(await upload.chosenNames(), "取込ファイルの欄で選ばれているファイル").toEqual(["normal-014.csv"]);
  });
  await step(3, async () => {
    await upload.changeToken("invalid-token");
    expect(await upload.tokenValues(), "フォームの中のなりすまし対策トークン").toEqual(["invalid-token"]);
  });
  await step(4, async () => {
    r = await upload.submit();
    await noteSubmit(upload, r);
  });
  await expected(async () => {
    await expectOnUploadScreen(page, upload, r);
    // なりすまし対策トークンが無効なときのエラー＝設計書 M03-32-MSG-001「CSRFトークンが無効です、再送信してください。」
    // （取込が始まって別のエラーが出ても合格にしないよう、この文を確かめる）
    const m = await upload.messages();
    expect.soft(m.エラー.some((t) => t.includes("CSRFトークンが無効です、再送信してください。")),
      `画面上部のエラー「CSRFトークンが無効です、再送信してください。」（エラー: ${list(m.エラー)}）`).toBe(true);
    expect.soft(m.成功, "完了のメッセージは出ない").toEqual([]);
  });
});

caseTest("IT-M03-32-015", async ({ page, step, expected }) => {
  const upload = await signIn(page);
  let r!: SubmitResult;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => {
    await upload.choose(m0332FilePath("normal-015.csv"));
    expect(await upload.chosenNames(), "取込ファイルの欄で選ばれているファイル").toEqual(["normal-015.csv"]);
  });
  await step(3, async () => {
    // 送信フォームの項目は「フォームの名前[項目名]」の形。unsupported をフォームの項目として足す（解釈。注記）
    const name = `${await upload.formName()}[unsupported]`;
    await upload.addField(name, "1");
    note(`送信フォームへ項目 ${name}=1 を足した（正本の「unsupported=1」を、このフォームの項目として足すと解釈した）`);
  });
  await step(4, async () => {
    r = await upload.submit();
    await noteSubmit(upload, r);
  });
  await expected(async () => {
    await expectOnUploadScreen(page, upload, r);
    // 送信内容に未対応の項目が含まれるときのエラー＝設計書 M03-32-MSG-001「フィールドグループに追加のフィールドを含んではなりません。」
    const m = await upload.messages();
    expect.soft(m.エラー.some((t) => t.includes("フィールドグループに追加のフィールドを含んではなりません。")),
      `画面上部のエラー「フィールドグループに追加のフィールドを含んではなりません。」（エラー: ${list(m.エラー)}）`).toBe(true);
    expect.soft(m.成功, "完了のメッセージは出ない").toEqual([]);
  });
});

/** 取込ファイルを選んでアップロードし、エラーが表示されたアップロード画面へ戻ることを確かめる（016・019・020・026） */
function errorBackCase(file: string, check?: { what: string; test: (t: string) => boolean }) {
  return async ({ page, step, expected }: CaseCtx) => {
    const upload = await signIn(page);
    let r!: SubmitResult;
    await step(1, async () => { await upload.open(); });
    await step(2, async () => { r = await chooseAndSubmit(upload, file); });
    await expected(async () => {
      await expectOnUploadScreen(page, upload, r);
      const m = await upload.messages();
      expect.soft(m.エラー.length, `画面上部のエラー（エラー: ${list(m.エラー)}）`).toBeGreaterThan(0);
      expect.soft(m.成功, "完了のメッセージは出ない").toEqual([]);
      if (check) expect.soft(m.エラー.some(check.test), `画面上部の${check.what}（エラー: ${list(m.エラー)}）`).toBe(true);
    });
  };
}

caseTest("IT-M03-32-016", errorBackCase("invalid.png"));
// データ行が無いときのエラー＝設計書 M03-32-MSG-005「CSVデータが存在しません。」（取込の受付条件の順序4）
caseTest("IT-M03-32-019", errorBackCase("no_data-019.csv", { what: "データ行なしのエラー「CSVデータが存在しません。」", test: (t) => t.includes("CSVデータが存在しません") }));
caseTest("IT-M03-32-020", errorBackCase("bad_header-020.csv"));
// 上限超過のエラー＝設計書 M03-32-MSG-003「%maxRecord% 行を超えるCSVファイルは登録できません。」（取込の受付条件の順序3）
caseTest("IT-M03-32-026", errorBackCase("limit-over-026.csv", { what: "上限超過のエラー「… 行を超えるCSVファイルは登録できません。」", test: (t) => /\d+ 行を超えるCSVファイルは登録できません。/.test(t) }));
