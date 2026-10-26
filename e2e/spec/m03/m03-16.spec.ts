/** M03-16 略称タグCSV入力。正本: cases/M03-16_test_cases.tsv */
import { Page, test } from "@playwright/test";
import { 並び順が一致する略称タグ, 名称が一致する略称タグ, 略称タグIDの最大値, 略称タグIDの略称タグ, 取り込まれた略称タグ } from "../../db/m03_16_short_tag_csv";
import { expect, CaseBody, CaseCtx, caseTest } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { loginAdmin } from "../../lib/session";
import {
  SHORT_TAG_CSV_UPLOAD_TITLE, ShortTagCsvUploadPage, shortTagCsvUploadPath, topMessagesOf, UploadResult,
} from "../../pages/admin/m03_16_short_tag_csv";
import { ShortTagPage } from "../../pages/admin/short_tag";
import { M0316_ADMIN, m0316CsvPath } from "../../seeds/m03-16";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 設計書の表示メッセージ（M03-16-MSG-001〜006）。%s・%d には項目名・ファイル上の行番号を入れる */
const MSG = {
  完了: "登録が完了しました。",
  列数不一致: (行: number) => `CSVのフォーマットが一致しません。 ${行} 行目のデータを確認してください。`,
  必須: (項目: string, 行: number) => `${項目} は必須項目です。 ${行} 行目のデータを確認してください。`,
  並び順重複: (行: number) => `CSV内で並び順が重複しています。 ${行} 行目のデータを確認してください。`,
  名称重複: (行: number) => `名称がすでに登録されています。 ${行} 行目のデータを確認してください。`,
  見出し不一致: "CSVのフォーマットが一致しません。",
};
/** 文言の比較では空白の有無・数を問わない（画面の表示で空白がまとまるため） */
const squash = (t: string) => t.replace(/\s+/g, "");

const titlePattern = new RegExp(`^\\s*${SHORT_TAG_CSV_UPLOAD_TITLE}\\s*$`);

/** アップロードの結果と画面上部のメッセージを注記に残す */
async function noteUpload(page: Page, r: UploadResult, what: string): Promise<void> {
  if (r.sent) note(`${what}: アップロードの要求の応答 ${r.応答}、そのあと表示された画面 ${r.戻った画面}`);
  else note(`${what}: ブラウザの入力チェックが送信を止めた（要求は送られていない）: ${r.止めた項目.join(" / ")}`);
  const m = await topMessagesOf(page);
  note(`${what}: 画面上部のメッセージ 成功「${m.成功.join(" / ") || "なし"}」・エラー「${m.エラー.join(" / ") || "なし"}」`);
}

/**
 * 手順の「アップロードボタンを押す」を実行できたこと（要求が送られたこと）。取込ファイルを選んでいるので止まらない見込みだが、
 * 止まったときは取り込みを試みていないので、DBに行が無いことを見て合格にしないよう、ここで落とす。
 */
function requireSent(r: UploadResult, what: string): void {
  if (!r.sent) throw new Error(`${what}: アップロードの要求が送られない（ブラウザの入力チェック: ${r.止めた項目.join(" / ")}）。手順を実行できない`);
}

/** 取込ファイルを選んでアップロードボタンを押す（略称タグCSVアップロード画面にいること）。そのあと画面上部に出たエラーを返す */
async function chooseAndUpload(page: Page, upload: ShortTagCsvUploadPage, file: string, what: string): Promise<string[]> {
  await upload.ready();
  await expect(upload.見出し, "略称タグCSVアップロード画面の見出し").toHaveText(titlePattern);
  await upload.choose(m0316CsvPath(file));
  const r = await upload.submit();
  await noteUpload(page, r, what);
  requireSent(r, what);
  return (await topMessagesOf(page)).エラー;
}

/**
 * 期待結果が「…のため」「…として扱われ」と、取り込みが止まった理由を定めるケースで、その理由を画面上部のエラー（設計書の表示メッセージ）で確かめる。
 * 実行区分は「ブラウザ+DB確認」で、理由はDBには残らないので、アップロードのあとの画面で見る。
 */
function expectReason(errors: string[], want: string, what: string): void {
  expect.soft(errors.map(squash), `${what}: 画面上部のエラー（表示: ${errors.join(" / ") || "なし"}）に「${want}」`).toContain(squash(want));
}

/** 事前準備②（試験管理者でログイン）のあと、手順1〜3: 略称タグCSVアップロード画面を開き、取込ファイルを選び、アップロードボタンを押す */
async function openChooseUpload(ctx: CaseCtx, file: string): Promise<{ upload: ShortTagCsvUploadPage; r: UploadResult }> {
  const { page, step } = ctx;
  await loginAdmin(page, M0316_ADMIN);
  const upload = new ShortTagCsvUploadPage(page);
  let r!: UploadResult;
  await step(1, async () => {
    await upload.open();
    await expect(upload.見出し, "開いた画面の見出し").toHaveText(titlePattern);
  });
  await step(2, async () => { await upload.choose(m0316CsvPath(file)); });
  await step(3, async () => {
    r = await upload.submit();
    await noteUpload(page, r, `${file} のアップロード`);
    requireSent(r, `${file} のアップロード`);
  });
  return { upload, r };
}

/** アップロードのあと略称タグCSVアップロード画面へ戻ったかを見るための値（送られた要求のあとに表示された画面と、その見出し） */
async function landing(upload: ShortTagCsvUploadPage, r: UploadResult): Promise<{ 要求を送った: boolean; 表示された画面: string; 見出し: string }> {
  return {
    要求を送った: r.sent,
    表示された画面: r.sent ? r.戻った画面 : "（要求を送っていない）",
    見出し: ((await upload.見出し.textContent()) ?? "").trim(),
  };
}
const backOnUploadScreen = () => ({ 要求を送った: true, 表示された画面: shortTagCsvUploadPath(), 見出し: SHORT_TAG_CSV_UPLOAD_TITLE });

/** DBの行を、確かめる形にする（取込の前の最大のIDより大きいものを、取込で追加された行とみなす） */
const shape = (rows: 取り込まれた略称タグ[], before: number) => rows.map((r) => ({
  名称: r.名称, 並び順: r.並び順, アルファベット順: r.アルファベット順, 取込で追加: Number(r.略称タグID) > before,
}));
const added = (名称: string, 並び順: string) => ({ 名称, 並び順, アルファベット順: false, 取込で追加: true });
/** 名称と、取込で追加されたかだけを見る形（期待結果が「1件追加」だけを定めるケース） */
const nameOnly = (rows: 取り込まれた略称タグ[], before: number) => rows.map((r) => ({ 名称: r.名称, 取込で追加: Number(r.略称タグID) > before }));
const noteRows = (what: string, rows: 取り込まれた略称タグ[]) =>
  note(`${what}: ${rows.length ? rows.map((r) => `略称タグID ${r.略称タグID}・名称「${r.名称}」・並び順 ${r.並び順}・アルファベット順ソートフラグ ${r.アルファベット順 ? "オン" : "オフ"}`).join(" / ") : "なし"}`);

/** 略称タグ登録/編集画面の一覧（全件）で、名称の行の並び順を読む（取り込みが終わったかを、画面だけで確かめる） */
async function 一覧の並び順(page: Page, names: string[]): Promise<Record<string, string[]>> {
  const list = await page.context().newPage();
  try {
    const tag = new ShortTagPage(list);
    await tag.showFirstPageWith("12000");
    const out: Record<string, string[]> = {};
    for (const n of names) {
      const rows = tag.rowsByName(n);
      out[n] = [];
      for (let i = 0; i < await rows.count(); i++) out[n].push((await tag.readRow(rows.nth(i))).並び順);
    }
    return out;
  } finally {
    await list.close();
  }
}

// ---- 新規登録・更新が通るもの（ブラウザ+DB確認） ----

caseTest("IT-M03-16-001", async (ctx) => {
  const before = 略称タグIDの最大値();
  await openChooseUpload(ctx, "new_rows-001.csv");
  let a: 取り込まれた略称タグ[] = [];
  let b: 取り込まれた略称タグ[] = [];
  await ctx.step(4, async () => { a = 名称が一致する略称タグ("CSV新規略称M0316-A-001"); b = 名称が一致する略称タグ("CSV新規略称M0316-B-001"); });
  await ctx.expected(async () => {
    expect.soft(shape(a, before), "名称「CSV新規略称M0316-A-001」の略称タグ").toEqual([added("CSV新規略称M0316-A-001", "30")]);
    expect.soft(shape(b, before), "名称「CSV新規略称M0316-B-001」の略称タグ").toEqual([added("CSV新規略称M0316-B-001", "31")]);
  });
});

/** 控えた略称タグIDの略称タグを、取込のあとDBで読み、名称・並び順・アルファベット順ソートフラグを確かめる（002・006・041） */
caseTest("IT-M03-16-002", async (ctx) => {
  const id = ctx.notes.get("〔略称タグID-M0316-002〕");
  await openChooseUpload(ctx, "m0316-update-002.csv");
  let row: 取り込まれた略称タグ | null = null;
  await ctx.step(4, async () => { row = 略称タグIDの略称タグ(id); });
  await ctx.expected(async () => {
    expect(row, `略称タグID ${id} の略称タグ`).toEqual({ 略称タグID: id, 名称: "CSV更新略称-002", 並び順: "20", アルファベット順: true });
  });
});

caseTest("IT-M03-16-003", importAndExpectAddedOnce("no_id_header-003.csv", ["ID列なし略称-003"]));

caseTest("IT-M03-16-004", async (ctx) => {
  const before = 略称タグIDの最大値();
  const names = ["空ID略称-004", "IDゼロ略称-004", "未登録ID略称-004"];
  await openChooseUpload(ctx, "id_variants-004.csv");
  const got: Record<string, 取り込まれた略称タグ[]> = {};
  await ctx.step(4, async () => { for (const n of names) got[n] = 名称が一致する略称タグ(n); });
  await ctx.expected(async () => {
    expect.soft(shape(got["空ID略称-004"], before), "IDが空の行の名称「空ID略称-004」の略称タグ").toEqual([added("空ID略称-004", "41")]);
    expect.soft(shape(got["IDゼロ略称-004"], before), "IDが0の行の名称「IDゼロ略称-004」の略称タグ").toEqual([added("IDゼロ略称-004", "42")]);
    expect.soft(shape(got["未登録ID略称-004"], before), "IDが999999004の行の名称「未登録ID略称-004」の略称タグ").toEqual([added("未登録ID略称-004", "43")]);
    noteRows("取込のあとの3名称の略称タグ", names.flatMap((n) => got[n]));
  });
});

caseTest("IT-M03-16-005", importAndExpectAddedOnce("id_middle-005.csv", ["ID中間略称-005"]));

caseTest("IT-M03-16-006", async (ctx) => {
  const id = ctx.notes.get("〔略称タグID-M0316-006〕");
  await openChooseUpload(ctx, "same_id_name-006.csv");
  let row: 取り込まれた略称タグ | null = null;
  await ctx.step(4, async () => { row = 略称タグIDの略称タグ(id); });
  await ctx.expected(async () => {
    // 重複として扱われていれば、取り込みが止まって並び順は10のまま
    expect(row, `略称タグID ${id} の略称タグ`).toEqual({ 略称タグID: id, 名称: "既存略称M0316-A-006", 並び順: "12", アルファベット順: true });
  });
});

caseTest("IT-M03-16-007", importAndExpectAddedOnce("comma_text.txt", ["カンマ区切り略称-007"]));
caseTest("IT-M03-16-008", importAndExpectAddedOnce("tab_file.tsv", ["タブ区切り略称-008"]));

caseTest("IT-M03-16-009", async (ctx) => {
  const before = 略称タグIDの最大値();
  await openChooseUpload(ctx, "shift_jis-009.csv");
  let byName: 取り込まれた略称タグ[] = [];
  let 並び順47の追加行: 取り込まれた略称タグ[] = [];
  await ctx.step(4, async () => {
    byName = 名称が一致する略称タグ("文字コード略称-009");
    並び順47の追加行 = 並び順が一致する略称タグ("47").filter((r) => Number(r.略称タグID) > before);
  });
  await ctx.expected(async () => {
    expect.soft(nameOnly(byName, before), "名称「文字コード略称-009」の略称タグ").toEqual([{ 名称: "文字コード略称-009", 取込で追加: true }]);
    // 文字化けした名称で別の行が追加されていないこと（取込で追加された並び順47の行が、正しい名称の1件だけ）
    expect.soft(並び順47の追加行.map((r) => r.名称), "取込で追加された並び順47の略称タグの名称").toEqual(["文字コード略称-009"]);
    noteRows("取込で追加された並び順47の略称タグ", 並び順47の追加行);
  });
});

caseTest("IT-M03-16-010", async (ctx) => {
  const { page, step } = ctx;
  const before = 略称タグIDの最大値();
  await loginAdmin(page, M0316_ADMIN);
  const upload = new ShortTagCsvUploadPage(page);
  await step(1, async () => {
    await upload.open();
    await expect(upload.見出し, "開いた画面の見出し").toHaveText(titlePattern);
  });
  await step(2, async () => { await chooseAndUpload(page, upload, "newline_crlf-010.csv", "newline_crlf-010.csv のアップロード"); });
  await step(3, async () => { await chooseAndUpload(page, upload, "newline_cr-010.csv", "newline_cr-010.csv のアップロード"); });
  let crlf: 取り込まれた略称タグ[] = [];
  let cr: 取り込まれた略称タグ[] = [];
  await step(4, async () => { crlf = 名称が一致する略称タグ("CRLF改行略称-010"); cr = 名称が一致する略称タグ("CR改行略称-010"); });
  await ctx.expected(async () => {
    expect.soft(nameOnly(crlf, before), "名称「CRLF改行略称-010」の略称タグ").toEqual([{ 名称: "CRLF改行略称-010", 取込で追加: true }]);
    expect.soft(nameOnly(cr, before), "名称「CR改行略称-010」の略称タグ").toEqual([{ 名称: "CR改行略称-010", 取込で追加: true }]);
    noteRows("取込のあとの2名称の略称タグ", [...crlf, ...cr]);
  });
});

caseTest("IT-M03-16-011", async (ctx) => {
  const before = 略称タグIDの最大値();
  await openChooseUpload(ctx, "bom_zero_width-011.csv");
  let 並び順53の行: 取り込まれた略称タグ[] = [];
  await ctx.step(4, async () => { 並び順53の行 = 並び順が一致する略称タグ("53"); });
  await ctx.expected(async () => {
    const addedRows = 並び順53の行.filter((r) => Number(r.略称タグID) > before);
    noteRows("取込で追加された並び順53の略称タグ", addedRows);
    const codes = (t: string) => [...t].filter((ch) => /[​﻿]/.test(ch)).map((ch) => `U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`);
    expect.soft(addedRows.map((r) => ({ 名称: r.名称, 名称に残った見えない文字: codes(r.名称) })), "取込で追加された並び順53の略称タグ")
      .toEqual([{ 名称: "ゼロ幅略称-011", 名称に残った見えない文字: [] }]);
  });
});

caseTest("IT-M03-16-014", importAndExpectAddedOnce("trailing_delimiter-014.csv", ["行末区切り略称-014"]));

caseTest("IT-M03-16-039", async (ctx) => {
  const before = 略称タグIDの最大値();
  const name = "囲み区切り略称M0316-039-A,M0316-039-B";
  await openChooseUpload(ctx, "m0316-039-quoted.csv");
  let rows: 取り込まれた略称タグ[] = [];
  let 並び順90の追加行: 取り込まれた略称タグ[] = [];
  await ctx.step(4, async () => {
    rows = 名称が一致する略称タグ(name);
    並び順90の追加行 = 並び順が一致する略称タグ("90").filter((r) => Number(r.略称タグID) > before);
  });
  await ctx.expected(async () => {
    // 期待結果はアルファベット順ソートフラグを定めないので、名称・並び順・取込で追加されたかを見る（フラグは注記）
    const view = rows.map((r) => ({ 名称: r.名称, 並び順: r.並び順, 取込で追加: Number(r.略称タグID) > before }));
    expect.soft(view, `名称「${name}」の略称タグ`).toEqual([{ 名称: name, 並び順: "90", 取込で追加: true }]);
    noteRows(`名称「${name}」の略称タグ`, rows);
    // カンマで分割されていれば、別の名称・別の並び順の行になる。取込で追加された並び順90の行が、この名称の1件だけであること
    expect.soft(並び順90の追加行.map((r) => r.名称), "取込で追加された並び順90の略称タグの名称").toEqual([name]);
  });
});

caseTest("IT-M03-16-041", async (ctx) => {
  const a = ctx.notes.get("〔略称タグID-M0316-041A〕");
  const b = ctx.notes.get("〔略称タグID-M0316-041B〕");
  await openChooseUpload(ctx, "m0316-041-update.csv");
  let rowA: 取り込まれた略称タグ | null = null;
  let rowB: 取り込まれた略称タグ | null = null;
  await ctx.step(4, async () => { rowA = 略称タグIDの略称タグ(a); rowB = 略称タグIDの略称タグ(b); });
  await ctx.expected(async () => {
    expect.soft(rowA, `略称タグID ${a} の略称タグ`).toEqual({ 略称タグID: a, 名称: "更新後略称M0316-A-041", 並び順: "20", アルファベット順: true });
    expect.soft(rowB, `略称タグID ${b} の略称タグ`).toEqual({ 略称タグID: b, 名称: "更新後略称M0316-B-041", 並び順: "21", アルファベット順: false });
  });
});

caseTest("IT-M03-16-042", async (ctx) => {
  const { page, step } = ctx;
  const name = "再取込略称-M0316-042";
  const { upload } = await openChooseUpload(ctx, "m0316-042-dup.csv");
  let first: 取り込まれた略称タグ[] = [];
  let second: 取り込まれた略称タグ[] = [];
  await step(4, async () => { first = 名称が一致する略称タグ(name); noteRows("1回目のアップロードの後", first); });
  await step(5, async () => { await chooseAndUpload(page, upload, "m0316-042-dup.csv", "2回目のアップロード"); });
  await step(6, async () => { second = 名称が一致する略称タグ(name); noteRows("2回目のアップロードの後", second); });
  await ctx.expected(async () => {
    const view = (rows: 取り込まれた略称タグ[]) => rows.map((r) => ({ 名称: r.名称, 並び順: r.並び順 }));
    expect.soft(view(first), `1回目のアップロードの後の名称「${name}」の略称タグ`).toEqual([{ 名称: name, 並び順: "97" }]);
    expect.soft(view(second), `2回目のアップロードの後の名称「${name}」の略称タグ`).toEqual([{ 名称: name, 並び順: "97" }]);
  });
});

/** 手順1〜3で取り込み、手順4でDBの名称の略称タグを読み、各名称が1件だけ取込で追加されたことを確かめる（期待結果が「1件追加」だけを定めるケース） */
function importAndExpectAddedOnce(file: string, names: string[]): CaseBody {
  return async (ctx) => {
    const before = 略称タグIDの最大値();
    await openChooseUpload(ctx, file);
    const got: Record<string, 取り込まれた略称タグ[]> = {};
    await ctx.step(4, async () => { for (const n of names) got[n] = 名称が一致する略称タグ(n); });
    await ctx.expected(async () => {
      for (const n of names) expect.soft(nameOnly(got[n], before), `名称「${n}」の略称タグ`).toEqual([{ 名称: n, 取込で追加: true }]);
      noteRows("取込のあとの略称タグ", names.flatMap((n) => got[n]));
    });
  };
}

// ---- 取り込みが止まるもの（ブラウザ+DB確認） ----

/**
 * 手順1〜3で取り込み、手順4でDBの名称の略称タグを読み、どれも無い（追加されていない）ことを確かめる。
 * あわせて、期待結果が定める止まった理由（「…ため」「…として扱われ」）を、アップロードのあとの画面上部のエラーで確かめる。
 */
function importAndExpectNotAdded(file: string, names: string[], reason: string): CaseBody {
  return async (ctx) => {
    await openChooseUpload(ctx, file);
    const errors = (await topMessagesOf(ctx.page)).エラー;
    const got: Record<string, 取り込まれた略称タグ[]> = {};
    await ctx.step(4, async () => { for (const n of names) got[n] = 名称が一致する略称タグ(n); });
    await ctx.expected(async () => {
      for (const n of names) expect.soft(got[n], `名称「${n}」の略称タグ`).toEqual([]);
      expectReason(errors, reason, "取り込みが止まった理由");
    });
  };
}

caseTest("IT-M03-16-015", importAndExpectNotAdded("trailing_required_empty-015.csv", ["末尾空略称-015"], MSG.列数不一致(2)));
caseTest("IT-M03-16-017", importAndExpectNotAdded("column_count_mismatch-017.csv", ["列数正常略称-017", "列数不足略称-017"], MSG.列数不一致(3)));

caseTest("IT-M03-16-019", async (ctx) => {
  // シードが並び順62の行を削除してあるので、取込の前は0件
  const before = 並び順が一致する略称タグ("62");
  noteRows("取込の前の並び順62の略称タグ", before);
  await openChooseUpload(ctx, "name_empty-019.csv");
  const errors = (await topMessagesOf(ctx.page)).エラー;
  let after: 取り込まれた略称タグ[] = [];
  await ctx.step(4, async () => { after = 並び順が一致する略称タグ("62"); });
  await ctx.expected(async () => {
    expect.soft(after, "並び順62の略称タグ").toEqual([]);
    expectReason(errors, MSG.必須("名称", 2), "取り込みが止まった理由（名称が空）");
  });
});

caseTest("IT-M03-16-020", importAndExpectNotAdded("order_empty-020.csv", ["並び順空略称-020"], MSG.必須("並び順", 2)));
caseTest("IT-M03-16-022", importAndExpectNotAdded("duplicate_order-022.csv", ["並び順重複略称M0316-A-022", "並び順重複略称M0316-B-022"], MSG.並び順重複(3)));

caseTest("IT-M03-16-024", async (ctx) => {
  const a = ctx.notes.get("〔略称タグID-M0316-024A〕");
  const b = ctx.notes.get("〔略称タグID-M0316-024B〕");
  const view = (r: 取り込まれた略称タグ | null) => (r ? { 名称: r.名称, 並び順: r.並び順 } : null);
  const beforeA = view(略称タグIDの略称タグ(a));
  const beforeB = view(略称タグIDの略称タグ(b));
  await openChooseUpload(ctx, "duplicate_master_name-024.csv");
  const errors = (await topMessagesOf(ctx.page)).エラー;
  let afterA: { 名称: string; 並び順: string } | null = null;
  let afterB: { 名称: string; 並び順: string } | null = null;
  await ctx.step(4, async () => { afterA = view(略称タグIDの略称タグ(a)); afterB = view(略称タグIDの略称タグ(b)); });
  await ctx.expected(async () => {
    // 取込の前の値は、シードが登録した値
    expect.soft(beforeA, `取込の前の略称タグID ${a}`).toEqual({ 名称: "既存略称M0316-A-024", 並び順: "10" });
    expect.soft(beforeB, `取込の前の略称タグID ${b}`).toEqual({ 名称: "重複既存略称-024", 並び順: "11" });
    expect.soft(afterA, `取込の後の略称タグID ${a}（取込の前と同じ）`).toEqual(beforeA);
    expect.soft(afterB, `取込の後の略称タグID ${b}（取込の前と同じ）`).toEqual(beforeB);
    expectReason(errors, MSG.名称重複(2), "取り込みが止まった理由（ほかのIDの名称を指定した）");
  });
});

caseTest("IT-M03-16-026", async (ctx) => {
  const { page, step } = ctx;
  const names = ["見出し順序不一致略称-026", "見出し内容不一致略称-026"];
  await loginAdmin(page, M0316_ADMIN);
  const upload = new ShortTagCsvUploadPage(page);
  await step(1, async () => {
    await upload.open();
    await expect(upload.見出し, "開いた画面の見出し").toHaveText(titlePattern);
  });
  let orderErrors: string[] = [];
  let nameErrors: string[] = [];
  await step(2, async () => { orderErrors = await chooseAndUpload(page, upload, "wrong_order_header-026.csv", "wrong_order_header-026.csv のアップロード"); });
  await step(3, async () => { nameErrors = await chooseAndUpload(page, upload, "wrong_name_header-026.csv", "wrong_name_header-026.csv のアップロード"); });
  const got: Record<string, 取り込まれた略称タグ[]> = {};
  await step(4, async () => { for (const n of names) got[n] = 名称が一致する略称タグ(n); });
  await ctx.expected(async () => {
    for (const n of names) expect.soft(got[n], `名称「${n}」の略称タグ`).toEqual([]);
    // 「見出しの順序または内容がフォーマットと一致しないため」: それぞれのアップロードのあと、見出しの不一致のエラー（M03-16-MSG-006）が出ていること
    expectReason(orderErrors, MSG.見出し不一致, "wrong_order_header-026.csv の取り込みが止まった理由");
    expectReason(nameErrors, MSG.見出し不一致, "wrong_name_header-026.csv の取り込みが止まった理由");
  });
});

caseTest("IT-M03-16-030", async (ctx) => {
  const id = ctx.notes.get("〔略称タグID-M0316-030〕");
  await openChooseUpload(ctx, "atomic_error-030.csv");
  const errors = (await topMessagesOf(ctx.page)).エラー;
  let row: 取り込まれた略称タグ | null = null;
  let newRows: 取り込まれた略称タグ[] = [];
  await ctx.step(4, async () => { row = 略称タグIDの略称タグ(id); newRows = 名称が一致する略称タグ("原子性新規略称-030"); });
  await ctx.expected(async () => {
    const r = row as 取り込まれた略称タグ | null;
    expect.soft(r ? { 名称: r.名称, 並び順: r.並び順 } : null, `略称タグID ${id} の略称タグ（更新されていない）`).toEqual({ 名称: "既存略称M0316-A-030", 並び順: "10" });
    expect.soft(newRows, "名称「原子性新規略称-030」の略称タグ（追加されていない）").toEqual([]);
    // 「後続行に名称の空欄があるため」: ファイル上の4行目の名称の必須違反で止まったこと
    expectReason(errors, MSG.必須("名称", 4), "取り込みが止まった理由（4行目の名称が空）");
  });
});

// ---- 取込後の画面（ブラウザのみ） ----

/** 手順1〜3で取り込み、略称タグCSVアップロード画面へ戻ったことを確かめる。error があれば、画面上部のエラーにその表示メッセージが出ていることも確かめる */
function uploadAndBack(file: string, error?: string): CaseBody {
  return async (ctx) => {
    const { upload, r } = await openChooseUpload(ctx, file);
    await ctx.expected(async () => {
      expect.soft(await landing(upload, r), "アップロードのあとに表示された画面").toEqual(backOnUploadScreen());
      if (error !== undefined) {
        const errors = (await topMessagesOf(ctx.page)).エラー;
        expect.soft(errors.map(squash), `画面上部のエラー（表示: ${errors.join(" / ") || "なし"}）に「${error}」`).toContain(squash(error));
      }
    });
  };
}

/** 手順1〜3で取り込み、略称タグCSVアップロード画面へ戻り、画面上部にエラーが表示されたことを確かめる（エラーの文は期待結果が定めない） */
function uploadAndBackWithSomeError(file: string): CaseBody {
  return async (ctx) => {
    const { upload, r } = await openChooseUpload(ctx, file);
    await ctx.expected(async () => {
      expect.soft(await landing(upload, r), "アップロードのあとに表示された画面").toEqual(backOnUploadScreen());
      const errors = (await topMessagesOf(ctx.page)).エラー;
      expect.soft(errors.length, `画面上部のエラーの表示（表示: ${errors.join(" / ") || "なし"}）`).toBeGreaterThan(0);
    });
  };
}

caseTest("IT-M03-16-012", uploadAndBack("empty-012.csv"));
caseTest("IT-M03-16-016", uploadAndBack("trailing_required_empty-016.csv", MSG.列数不一致(2)));
caseTest("IT-M03-16-018", uploadAndBack("column_count_mismatch-018.csv", MSG.列数不一致(3)));
caseTest("IT-M03-16-021", uploadAndBack("name_empty-021.csv", MSG.必須("名称", 2)));
caseTest("IT-M03-16-023", uploadAndBack("duplicate_order-023.csv", MSG.並び順重複(3)));
caseTest("IT-M03-16-025", uploadAndBack("duplicate_master_name-025.csv", MSG.名称重複(2)));
caseTest("IT-M03-16-027", uploadAndBackWithSomeError("wrong_order_header-027.csv"));
caseTest("IT-M03-16-029", uploadAndBackWithSomeError("header_only-029.csv"));

caseTest("IT-M03-16-031", async (ctx) => {
  const names = ["CSV新規略称M0316-A-031", "CSV新規略称M0316-B-031"];
  const { upload, r } = await openChooseUpload(ctx, "new_rows-031.csv");
  await ctx.expected(async () => {
    expect.soft(await landing(upload, r), "アップロードのあとに表示された画面").toEqual(backOnUploadScreen());
    // 「全行の取り込みが完了した後に」: 戻ったあと、略称タグ登録/編集画面の一覧（別のタブ）に2行とも取り込まれていること
    expect.soft(await 一覧の並び順(ctx.page, names), "略称タグ登録/編集画面の一覧の、名称の行の並び順")
      .toEqual({ "CSV新規略称M0316-A-031": ["30"], "CSV新規略称M0316-B-031": ["31"] });
  });
});

caseTest("IT-M03-16-040", async (ctx) => {
  const names = ["CSV完了表示略称M0316-040-A", "CSV完了表示略称M0316-040-B"];
  const { upload, r } = await openChooseUpload(ctx, "m0316-040-ok.csv");
  await ctx.expected(async () => {
    expect.soft(await landing(upload, r), "アップロードのあとに表示された画面").toEqual(backOnUploadScreen());
    const success = (await topMessagesOf(ctx.page)).成功;
    expect.soft(success, `画面上部の成功の表示（表示: ${success.join(" / ") || "なし"}）`).toContain(MSG.完了);
    // 「全行の取り込みが終わった後」: 略称タグ登録/編集画面の一覧（別のタブ）に2行とも取り込まれていること
    expect.soft(await 一覧の並び順(ctx.page, names), "略称タグ登録/編集画面の一覧の、名称の行の並び順")
      .toEqual({ "CSV完了表示略称M0316-040-A": ["95"], "CSV完了表示略称M0316-040-B": ["96"] });
  });
});

caseTest("IT-M03-16-032", async ({ page, step, expected }) => {
  await loginAdmin(page, M0316_ADMIN);
  const upload = new ShortTagCsvUploadPage(page);
  let file: { fileName: string; bytes: Buffer } | null = null;
  let formatItems: string[] = [];
  await step(1, async () => {
    await upload.open();
    await expect(upload.見出し, "開いた画面の見出し").toHaveText(titlePattern);
    formatItems = await upload.formatItems();
  });
  await step(2, async () => {
    file = await upload.downloadTemplate();
    note(`ダウンロードしたファイル: 名前「${file.fileName}」・${file.bytes.length}バイト`);
  });
  await expected(async () => {
    const f = file as { fileName: string; bytes: Buffer } | null;
    expect(f, "雛形ファイルダウンロードボタンで、ファイルがダウンロードされた").not.toBeNull();
    const rows = f ? parseCsv(decodeCsvBytes(f.bytes)) : [];
    note(`ダウンロードしたファイルの行: ${rows.map((r) => r.join(",")).join(" / ") || "なし"}`);
    // 登録CSVの雛形: 1行目が、画面の略称タグ登録CSVファイルフォーマットの表と、設計書の略称タグCSVフォーマット（ID・名称・並び順）の項目名
    expect.soft(formatItems, "画面の略称タグ登録CSVファイルフォーマットの表の項目名").toEqual(["ID", "名称", "並び順"]);
    expect.soft(rows[0] ?? [], "ダウンロードしたファイルの1行目（見出し）").toEqual(["ID", "名称", "並び順"]);
  });
});
