/**
 * M03-28 商品タグ更新CSV登録。正本: cases/M03-28_test_cases.tsv
 *
 * 実装したのは、画面だけで準備できる17件（003・007・008・009・010・019・025〜028・030・031・047〜049）。
 * ほかのケースは、取込履歴をDBで登録・0件にする、5009〜5010件の商品をDBで登録する、固定のタグをDBで登録するシードを使うので
 * 実装しない（seeds/m03-28.ts の冒頭）。
 *
 * 正本の「商品タグ更新CSV登録画面」は、画面の見出しが「商品タグ更新CSVアップロード」の画面（メニュー「商品管理」→「CSV管理」）。
 * 正本の「CSVファイルのアップロードボタン」は、画面の「CSVファイルをアップロード」ボタン（文言の違い）。
 */
import fs from "node:fs";
import path from "node:path";
import { expect, Page, test } from "@playwright/test";
import { STATE_DIR } from "../../config/env";
import { 商品の商品タグ, ファイル名の取込履歴 } from "../../db/m03_28_product_tag";
import { caseTest, CaseCtx } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { loginAdmin } from "../../lib/session";
import { downloadedBytes, pathOf, topMessages } from "../../pages/admin/m03_21_shelf_number";
import { ProductTagCsvUploadPage, productTagCsvUploadPath, productTagCsvUploadUrl, SubmitResult } from "../../pages/admin/m03_28_product_tag_csv_upload";
import { M0328_ADMIN, m0328CsvPath } from "../../seeds/m03-28";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const list = (xs: string[]) => xs.join(" / ") || "なし";

/** 試験管理者でログインする（事前準備①） */
async function signIn(page: Page): Promise<ProductTagCsvUploadPage> {
  await loginAdmin(page, M0328_ADMIN);
  return new ProductTagCsvUploadPage(page);
}

/** アップロードの送信の結果を注記に残す（ブラウザの入力チェックで止まったとき・応答の状態） */
function noteSubmit(r: SubmitResult): void {
  if (r.sent) note(`「CSVファイルをアップロード」を押したあとの取込の要求の応答: ${r.status}`);
  else note(`「CSVファイルをアップロード」を押すと、ブラウザの入力チェックが送信を止めた（要求は送られていない）: ${r.止めた項目.join(" / ")}`);
}

/** 画面上部に出たメッセージを注記に残して返す */
async function noteMessages(page: Page, when: string): Promise<{ 成功: string[]; エラー: string[] }> {
  const m = await topMessages(page);
  const all = [...m.成功.map((t) => `成功「${t}」`), ...m.エラー.map((t) => `エラー「${t}」`)];
  note(`${when}の画面上部のメッセージ: ${all.length ? all.join(" / ") : "なし"}`);
  return m;
}

/** ファイルを選んで「CSVファイルをアップロード」を押す（確認モーダルは画面に無い。出たら止める） */
async function upload(page: Page, up: ProductTagCsvUploadPage, file: string): Promise<SubmitResult> {
  await up.choose(m0328CsvPath(file));
  expect(await up.chosenCount(), "取込ファイルの欄で選ばれているファイルの数").toBe(1);
  const r = await up.submit();
  noteSubmit(r);
  await noteMessages(page, `${file} のアップロードのあと`);
  return r;
}

/** 送信のあとにいる画面（アドレスのパスと、画面の見出し）。「…画面へ遷移／戻ること」を見るのに使う */
async function screenAfter(page: Page, up: ProductTagCsvUploadPage): Promise<{ パス: string; 見出し: string }> {
  return { パス: pathOf(page.url()), 見出し: ((await up.見出し.textContent()) ?? "").trim() };
}
const UPLOAD_TITLE = "商品タグ更新CSVアップロード";

/** 確認モーダルを確定する手順: 画面に確認モーダルが出ないので、出ていないことを注記に残す（出ていれば止める） */
async function confirmModalStep(up: ProductTagCsvUploadPage): Promise<void> {
  if (await up.confirmModalVisible()) throw new Error("確認モーダルが開いている（この画面は確認モーダルを出さない作りのはず）。部品を直す");
  note("「CSVファイルをアップロード」を押しても確認モーダルは出ず、そのまま取込の要求が送られ、画面へ戻った（確定の操作はしていない）。"
    + "画面のスクリプト（base_csv_upload.twig）は読み込み中の表示を出すだけ。設計書 L0037〜L0038 も確認モーダルを書いていない");
}

// ---- 表示件数の保持 ----

caseTest("IT-M03-28-003", async ({ page, step, expected }) => {
  const up = await signIn(page);
  // 事前準備②（S-M03-28-SESSION-003）: このケースのセッションの保持値を、件数欄で10件・ページ1にする
  await up.open();
  await up.chooseCount("10");
  let after = "";
  await step(1, async () => { await up.open(); });
  await step(2, async () => { await up.chooseCount("50"); });
  await step(3, async () => {
    const res = await page.goto(productTagCsvUploadUrl());
    expect(res?.status() ?? 0, "開き直した画面の応答").toBe(200);
    await up.ready();
    expect(new URL(page.url()).search, "開き直したアドレスに問い合わせの文字列が無い").toBe("");
    after = await up.selectedCount();
  });
  await expected(async () => {
    expect.soft(after, "開き直した画面の件数欄で選ばれている件数").toBe("50");
  });
});

// ---- 雛形 ----

caseTest("IT-M03-28-007", async ({ page, step, expected }) => {
  const up = await signIn(page);
  const dir = path.join(STATE_DIR, "m03-28", "downloads-007");
  fs.mkdirSync(dir, { recursive: true });
  let suggested = "";
  let bytes = Buffer.alloc(0);
  await step(1, async () => { await up.open(); });
  await step(2, async () => {
    const download = await up.downloadTemplate();
    suggested = download.suggestedFilename();
    fs.rmSync(path.join(dir, path.basename(suggested)), { force: true });
    await download.saveAs(path.join(dir, path.basename(suggested)));
  });
  await step(3, async () => {
    bytes = fs.readFileSync(path.join(dir, path.basename(suggested)));
    note(`ダウンロードしたファイルの名前は「${suggested}」。先頭の3バイトは「${bytes.subarray(0, 3).toString("hex")}」、全体は ${bytes.length} バイト`);
  });
  await expected(async () => {
    expect.soft(suggested, "ダウンロードしたファイルの名前").toBe("product_tag_template.csv");
    const text = decodeCsvBytes(bytes);
    const lines = text.replace(/(\r\n|\n|\r)$/, "").split(/\r\n|\n|\r/);
    expect.soft(lines.length, `ファイルの行数（中身: ${JSON.stringify(text)}）`).toBe(1);
    expect.soft(parseCsv(text), "ファイルの中身（「商品ID」「商品タグ(ID)」の順の見出し行だけ）").toEqual([["商品ID", "商品タグ(ID)"]]);
    // 画面上の説明文（フォーマットの表の説明の欄）を含まないこと
    const descriptions = (await page.locator("table.table-striped.table-bordered:not(#csv_import_history_table) tbody tr td:nth-child(2)").allInnerTexts())
      .map((t) => t.trim()).filter(Boolean);
    expect.soft(descriptions.length, "画面のフォーマットの表の説明の欄（比べる相手）").toBeGreaterThan(0);
    for (const d of descriptions) expect.soft(text.includes(d), `ファイルに画面の説明文「${d}」が含まれない`).toBe(false);
  });
});

// ---- 取込の結果（DB） ----

/** DBの商品の商品タグ（登録の順）を読み、注記に残す */
function readTags(商品ID: string, when: string): ReturnType<typeof 商品の商品タグ> {
  const got = 商品の商品タグ(商品ID);
  note(`${when}: 商品ID ${商品ID} の商品タグ（登録の順）: ${got.map((t) => `${t.タグID}（登録者 ${t.登録者ID}）`).join("、") || "なし"}`);
  return got;
}

const A = "〔タグID-M0328-共有A〕";
const B = "〔タグID-M0328-共有B〕";
const C = "〔タグID-M0328-共有C〕";

caseTest("IT-M03-28-008", async ({ page, notes, step, expected }) => {
  const up = await signIn(page);
  const id = notes.get("〔商品ID-M0328-008〕");
  let r!: SubmitResult;
  let got: ReturnType<typeof 商品の商品タグ> = [];
  await step(1, async () => { await up.open(); });
  await step(2, async () => { r = await upload(page, up, "replace-008.csv"); });
  await step(3, async () => { got = readTags(id, "取込のあと"); });
  await expected(async () => {
    expect.soft(r.sent, "replace-008.csv の取込の要求が送られた").toBe(true);
    expect.soft(got.map((t) => t.タグID), `商品ID ${id} の商品タグ（登録の順。Aが消え、B・CだけがCSVの列挙順）`).toEqual([notes.get(B), notes.get(C)]);
    expect.soft(got.length, "商品タグの件数").toBeGreaterThan(0);
    for (const t of got) expect.soft(t.登録者ID, `タグID ${t.タグID} の登録者（更新者）が操作した管理者`).toBe(notes.get("〔利用者ID-M0328-共有〕"));
  });
});

caseTest("IT-M03-28-009", async ({ page, notes, step, expected }) => {
  const up = await signIn(page);
  const id = notes.get("〔商品ID-M0328-009〕");
  let r!: SubmitResult;
  let got: ReturnType<typeof 商品の商品タグ> = [];
  await step(1, async () => { await up.open(); });
  await step(2, async () => { r = await upload(page, up, "clear-009.csv"); });
  await step(3, async () => { got = readTags(id, "取込のあと"); });
  await expected(async () => {
    // 「取込が確定し」: 要求が送られ、画面上部にエラーが無く完了の表示が出て、そのファイル名の取込履歴が1件登録された（確定したときだけ登録される。設計書 L0083）
    expect.soft(r.sent, "clear-009.csv の取込の要求が送られた").toBe(true);
    const m = await topMessages(page);
    expect.soft(m.エラー, "画面上部のエラー").toEqual([]);
    expect.soft(m.成功, "画面上部の完了の表示").toContain("登録が完了しました。");
    expect.soft(ファイル名の取込履歴("clear-009.csv").length, "clear-009.csv の取込履歴").toBe(1);
    expect.soft(got.map((t) => t.タグID), `商品ID ${id} の商品タグ（0件）`).toEqual([]);
  });
});

caseTest("IT-M03-28-010", async ({ page, notes, step, expected }) => {
  const up = await signIn(page);
  const id = notes.get("〔商品ID-M0328-010〕");
  let r!: SubmitResult;
  let got: ReturnType<typeof 商品の商品タグ> = [];
  await step(1, async () => { await up.open(); });
  await step(2, async () => { r = await upload(page, up, "discontinued-010.csv"); });
  await step(3, async () => { got = readTags(id, "取込のあと"); });
  await expected(async () => {
    expect.soft(r.sent, "discontinued-010.csv の取込の要求が送られた").toBe(true);
    expect.soft(got.map((t) => t.タグID), `商品ID ${id} の商品タグ（Aが消え、Bが登録）`).toEqual([notes.get(B)]);
  });
});

caseTest("IT-M03-28-047", async ({ page, notes, step, expected }) => {
  const up = await signIn(page);
  const id = notes.get("〔商品ID-M0328-047〕");
  let r!: SubmitResult;
  let got: ReturnType<typeof 商品の商品タグ> = [];
  await step(1, async () => { await up.open(); });
  await step(2, async () => { r = await upload(page, up, "tag-none-M0328-047.csv"); });
  await step(3, async () => { got = readTags(id, "取込のあと"); });
  await expected(async () => {
    expect.soft(r.sent, "tag-none-M0328-047.csv の取込の要求が送られた").toBe(true);
    expect.soft(got.map((t) => t.タグID), `商品ID ${id} の商品タグ（B・Cの2件だけがCSVの列挙順）`).toEqual([notes.get(B), notes.get(C)]);
  });
});

/** 048・049: ファイルを選び、「CSVファイルをアップロード」を押して確認モーダルを確定し、DBで商品タグと取込履歴を確かめる */
function callbackCase(file: string, label: string, tags: string[]) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const up = await signIn(page);
    const id = notes.get(label);
    let r!: SubmitResult;
    let got: ReturnType<typeof 商品の商品タグ> = [];
    let histories: ReturnType<typeof ファイル名の取込履歴> = [];
    await step(1, async () => { await up.open(); });
    await step(2, async () => {
      await up.choose(m0328CsvPath(file));
      expect(await up.chosenCount(), "取込ファイルの欄で選ばれているファイルの数").toBe(1);
    });
    await step(3, async () => {
      r = await up.submit();
      noteSubmit(r);
      await noteMessages(page, `${file} のアップロードのあと`);
      await confirmModalStep(up);
    });
    await step(4, async () => {
      got = readTags(id, "取込のあと");
      histories = ファイル名の取込履歴(file);
      note(`${file} の商品タグ更新の取込履歴: ${histories.map((h) => `履歴ID ${h.履歴ID}（利用者ID ${h.利用者ID}）`).join("、") || "なし"}`);
    });
    await expected(async () => {
      expect.soft(r.sent, `${file} の取込の要求が送られた`).toBe(true);
      expect.soft(got.map((t) => t.タグID), `商品ID ${id} の商品タグ（登録の順）`).toEqual(tags.map((l) => notes.get(l)));
      expect.soft(got.map((t) => t.タグID), "共有Aのタグが残っていない").not.toContain(notes.get(A));
      expect.soft(histories.length, `商品タグ更新の取込履歴に、ファイル名 ${file} の行が1件`).toBe(1);
    });
  };
}

caseTest("IT-M03-28-048", callbackCase("cb1row-M0328-048.csv", "〔商品ID-M0328-CB048〕", [B, C]));
caseTest("IT-M03-28-049", callbackCase("cbmulti-M0328-049.csv", "〔商品ID-M0328-CB049〕", [C]));

// ---- 取込の結果（画面） ----

caseTest("IT-M03-28-019", async ({ page, step, expected }) => {
  const up = await signIn(page);
  let r!: SubmitResult;
  let errors: string[] = [];
  await step(1, async () => { await up.open(); });
  await step(2, async () => { r = await upload(page, up, "rollback-019.csv"); });
  await step(3, async () => { errors = (await topMessages(page)).エラー; });
  await expected(async () => {
    // 取込のエラーの行番号はファイルの行番号（見出しが1行目）。データの2行目（商品ID 999999019）はファイルの3行目、
    // データの3行目（タグID 999998019）はファイルの4行目。商品が無いときの文は「n 行目の 商品ID ではデータを取得できません。」、
    // タグが無いときの文は「商品タグ(ID) : 999998019 がマスターから取得できません。 n 行目…」（アプリの文言の定義）
    expect.soft(r.sent, "rollback-019.csv の取込の要求が送られた").toBe(true);
    expect.soft(errors.some((t) => t.includes("3 行目の 商品ID ではデータを取得できません。")),
      `データの2行目（ファイルの3行目）の商品不存在のエラー（表示: ${list(errors)}）`).toBe(true);
    expect.soft(errors.filter((t) => t.includes("999998019") || /(^|\D)4 行目/.test(t)),
      `データの3行目（ファイルの4行目）のタグ不存在のエラーが出ていない（表示: ${list(errors)}）`).toEqual([]);
  });
});

/** 025: ファイルを選ばずに押す */
caseTest("IT-M03-28-025", async ({ page, step, expected }) => {
  const up = await signIn(page);
  let r!: SubmitResult;
  let after = { パス: "", 見出し: "" };
  await step(1, async () => { await up.open(); });
  await step(2, async () => {
    expect(await up.chosenCount(), "取込ファイルの欄で選ばれているファイルの数").toBe(0);
    r = await up.submit();
    noteSubmit(r);
    await noteMessages(page, "アップロードを押したあと");
    after = await screenAfter(page, up);
  });
  await expected(async () => {
    // 送信の結果として画面へ遷移すること。ブラウザの入力チェックで止まったときは、元の画面にいても合格にしない
    expect.soft(r.sent, "「CSVファイルをアップロード」で取込の要求が送られた").toBe(true);
    if (r.sent) expect.soft(r.status, "取込の要求の応答（この画面へ戻す転送）").toBe(302);
    expect.soft(after.パス, "送信のあとの画面").toBe(productTagCsvUploadPath());
    expect.soft(after.見出し, "送信のあとの画面の見出し").toBe(UPLOAD_TITLE);
  });
});

caseTest("IT-M03-28-026", async ({ page, step, expected }) => {
  const up = await signIn(page);
  let r!: SubmitResult;
  let errors: string[] = [];
  await step(1, async () => { await up.open(); });
  await step(2, async () => {
    expect(await up.chosenCount(), "取込ファイルの欄で選ばれているファイルの数").toBe(0);
    r = await up.submit();
    noteSubmit(r);
  });
  await step(3, async () => { errors = (await noteMessages(page, "アップロードを押したあと")).エラー; });
  await expected(async () => {
    // 形式不一致のエラー＝設計書 M03-28-MSG-002「CSVのフォーマットが一致しません」（取込ファイルが無いとき。L0107）
    expect.soft(r.sent, "「CSVファイルをアップロード」で取込の要求が送られた").toBe(true);
    expect.soft(errors.some((t) => t.includes("CSVのフォーマットが一致しません")), `画面上部の形式不一致のエラー（表示: ${list(errors)}）`).toBe(true);
  });
});

caseTest("IT-M03-28-027", async ({ page, step, expected }) => {
  const up = await signIn(page);
  let r!: SubmitResult;
  let after = { パス: "", 見出し: "" };
  await step(1, async () => { await up.open(); });
  await step(2, async () => {
    r = await upload(page, up, "wrong-columns-027.csv");
    after = await screenAfter(page, up);
  });
  await expected(async () => {
    expect.soft(r.sent, "取込の要求が送られた").toBe(true);
    if (r.sent) expect.soft(r.status, "取込の要求の応答（この画面へ戻す転送）").toBe(302);
    expect.soft(after.パス, "送信のあとの画面").toBe(productTagCsvUploadPath());
    expect.soft(after.見出し, "送信のあとの画面の見出し").toBe(UPLOAD_TITLE);
  });
});

caseTest("IT-M03-28-028", async ({ page, step, expected }) => {
  const up = await signIn(page);
  let r!: SubmitResult;
  let errors: string[] = [];
  await step(1, async () => { await up.open(); });
  await step(2, async () => { r = await upload(page, up, "wrong-columns-028.csv"); });
  await step(3, async () => { errors = (await topMessages(page)).エラー; });
  await expected(async () => {
    expect.soft(r.sent, "取込の要求が送られた").toBe(true);
    // 列数不一致のエラー＝アプリの取込がデータ行の列数の誤りに出す文「CSVのフォーマットが一致しません。 n 行目のデータを確認してください。」
    // （データの1行目＝ファイルの2行目）
    expect.soft(errors.some((t) => t.includes("CSVのフォーマットが一致しません。 2 行目のデータを確認してください。")),
      `画面上部の列数不一致のエラー（表示: ${list(errors)}）`).toBe(true);
  });
});

caseTest("IT-M03-28-030", async ({ page, step, expected }) => {
  const up = await signIn(page);
  let r!: SubmitResult;
  let after = { パス: "", 見出し: "" };
  await step(1, async () => { await up.open(); });
  await step(2, async () => {
    r = await upload(page, up, "history-success-030.csv");
    after = await screenAfter(page, up);
  });
  await expected(async () => {
    expect.soft(r.sent, "取込の要求が送られた").toBe(true);
    if (r.sent) expect.soft(r.status, "取込の要求の応答（この画面へ戻す転送）").toBe(302);
    expect.soft(after.パス, "送信のあとの画面").toBe(productTagCsvUploadPath());
    expect.soft(after.見出し, "送信のあとの画面の見出し").toBe(UPLOAD_TITLE);
  });
});

caseTest("IT-M03-28-031", async ({ page, step, expected }) => {
  const up = await signIn(page);
  let r!: SubmitResult;
  let m = { 成功: [] as string[], エラー: [] as string[] };
  await step(1, async () => { await up.open(); });
  await step(2, async () => { r = await upload(page, up, "history-success-031.csv"); });
  await step(3, async () => { m = await topMessages(page); });
  await expected(async () => {
    expect.soft(r.sent, "取込の要求が送られた").toBe(true);
    // 取込完了を示すメッセージ＝設計書 M03-28-MSG-004「登録が完了しました。」（L0109）
    expect.soft(m.成功, `画面上部の取込完了のメッセージ（エラー: ${list(m.エラー)}）`).toContain("登録が完了しました。");
  });
});
