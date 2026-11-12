/**
 * M06-02 古物台帳入力用CSV出力。正本: cases/M06-02_test_cases.tsv
 *
 * 実装した12件: 001・005・007・012・013・014・015・016・017・018・019・020。シードは seeds/m06-02.ts に作った。
 * 実装しないケースと理由:
 * - 003: 職業「会社員」が前提。アプリの職業マスタに「会社員」が無く（CSVの職業は職業マスタの名称）、共有のマスタは書き換えない
 *
 * 店舗ID 1（共有の店舗）は買取店舗Aで、査定ID・申込者姓は画面が振った値／実行の印つきの値に読み替えた（シードの注記）。
 */
import { Download, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { csvRecords, decodeCsvBytes } from "../../lib/csv";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { OtcListPage } from "../../pages/admin/m06_otc_list";
import { M0602_ADMIN } from "../../seeds/m06-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

type CSV = { 見出し: string[]; 行: Record<string, string>[] };

async function csvを読む(file: Download): Promise<CSV> {
  const chunks: Buffer[] = [];
  for await (const c of await file.createReadStream()) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  const text = decodeCsvBytes(Buffer.concat(chunks));
  const 見出し = (text.split(/\r?\n/)[0] ?? "").split(",").map((t) => t.replace(/^"|"$/g, ""));
  return { 見出し, 行: csvRecords(text) };
}

const 見出し12 = ["査定ID", "年月日", "代金", "数量", "氏名", "身分証", "住所", "年齢", "電話番号", "職業", "事業者であるか", "事業者番号"];
const 一覧のアドレス = /\/otcbuyorder(\/page\/\d+)?$/;
const 店舗の注記 = "店舗ID 1（共有の店舗）は、買取店舗A（試験用の店舗）で代えた";

/** 買取一覧(検索入力)を開き、査定ID（または申込者名）・買取店舗・日時の空欄を指定して検索する */
async function 検索する(list: OtcListPage, 条件: { 査定ID?: string; 申込者名?: string }): Promise<void> {
  await list.open();
  if (条件.査定ID) await list.査定IDを入れる(条件.査定ID);
  if (条件.申込者名) await list.申込者名を入れる(条件.申込者名);
  await list.買取店舗を選ぶ("買取店舗A");
  await list.日時を空にする();
  await list.検索する();
}

/** 査定IDのチェックを付けて古物台帳入力用CSVを押し、CSVを読む */
async function 出力する(list: OtcListPage, チェック: string[]): Promise<CSV> {
  for (const id of チェック) await list.対象にする(id);
  const r = await list.ダウンロードを押す("古物台帳入力用CSV");
  expect(r.file, "古物台帳入力用CSVがダウンロードされる").not.toBeNull();
  return csvを読む(r.file!);
}

// 001: 指定した査定IDのCSV
caseTest("IT-M06-02-001", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0602_ADMIN);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0602-001〕");
  let csv: CSV = { 見出し: [], 行: [] };
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.査定IDを入れる(id); await list.買取店舗を選ぶ("買取店舗A"); await list.日時を空にする(); });
  await step(3, async () => { await list.検索する(); });
  await step(4, async () => { await list.対象にする(id); });
  await step(5, async () => {
    const r = await list.ダウンロードを押す("古物台帳入力用CSV");
    expect(r.file, "古物台帳入力用CSVがダウンロードされる").not.toBeNull();
    csv = await csvを読む(r.file!);
  });
  await expected(async () => {
    expect.soft(csv.行.map((r) => r["査定ID"]), "CSVの査定ID（指定した1件だけ）").toEqual([id]);
  });
  note(`${店舗の注記}。査定IDは画面が振った値に読み替えた`);
});

// 005: 数量は買取明細と個別入力商品の合計
caseTest("IT-M06-02-005", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0602_ADMIN);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0602-005〕");
  let csv: CSV = { 見出し: [], 行: [] };
  await step(1, async () => { await 検索する(list, { 査定ID: id }); });
  await step(2, async () => { await list.対象にする(id); });
  await step(3, async () => {
    const r = await list.ダウンロードを押す("古物台帳入力用CSV");
    expect(r.file, "古物台帳入力用CSVがダウンロードされる").not.toBeNull();
    csv = await csvを読む(r.file!);
  });
  await step(4, async () => { expect(csv.行.length, "CSVのデータ行").toBeGreaterThan(0); });
  await expected(async () => {
    expect.soft(csv.行.find((r) => r["査定ID"] === id)?.["数量"], "数量（買取明細2・3＋個別入力商品4・1）").toBe("10");
  });
  note(`${店舗の注記}。ケースの事前準備の検索は、手順1（画面を開く）の中で行った`);
});

// 007: 身分証
caseTest("IT-M06-02-007", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0602_ADMIN);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0602-007〕");
  let csv: CSV = { 見出し: [], 行: [] };
  await step(1, async () => { await 検索する(list, { 査定ID: id }); });
  await step(2, async () => { await list.対象にする(id); });
  await step(3, async () => {
    const r = await list.ダウンロードを押す("古物台帳入力用CSV");
    expect(r.file, "古物台帳入力用CSVがダウンロードされる").not.toBeNull();
    csv = await csvを読む(r.file!);
  });
  await step(4, async () => { expect(csv.行.length, "CSVのデータ行").toBeGreaterThan(0); });
  await expected(async () => {
    expect.soft(csv.行.find((r) => r["査定ID"] === id)?.["身分証"], "身分証").toBe("自動車運転免許証");
  });
  note(`${店舗の注記}。ケースの事前準備の検索は、手順1（画面を開く）の中で行った`);
});

// 012: 選択した2件だけ
caseTest("IT-M06-02-012", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0602_ADMIN);
  const list = new OtcListPage(page);
  const [a, b, c] = [1, 2, 3].map((i) => notes.get(`〔査定ID-M0602-012-${i}〕`));
  let csv: CSV = { 見出し: [], 行: [] };
  await step(1, async () => { await 検索する(list, { 申込者名: rc("M0602CASE012") }); });
  await step(2, async () => { await list.対象にする(a); await list.対象にする(b); });
  await step(3, async () => {
    const r = await list.ダウンロードを押す("古物台帳入力用CSV");
    expect(r.file, "古物台帳入力用CSVがダウンロードされる").not.toBeNull();
    csv = await csvを読む(r.file!);
  });
  await step(4, async () => { expect(csv.見出し, "CSVの見出し行").toEqual(見出し12); });
  await expected(async () => {
    const got = csv.行.map((r) => r["査定ID"]);
    expect.soft(got.length, "CSVのデータ行の数").toBe(2);
    expect.soft([...got].sort(), "CSVのデータ行（選択した2件）").toEqual([a, b].sort());
    expect.soft(got, "チェックを付けていない査定ID（含まれない）").not.toContain(c);
  });
  note(`${店舗の注記}。第2注文の国（アメリカ合衆国）は設定せず、申込のままにした。申込者姓・査定IDは画面が振った値／実行の印つきの値`);
});

// 013: 身分証の種別名がそのまま出る
caseTest("IT-M06-02-013", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0602_ADMIN);
  const list = new OtcListPage(page);
  const ids = [1, 2, 3, 4, 5, 6, 7].map((i) => notes.get(`〔査定ID-M0602-013-${i}〕`));
  let csv: CSV = { 見出し: [], 行: [] };
  await step(1, async () => { await 検索する(list, { 申込者名: rc("M0602CASE013") }); });
  await step(2, async () => { for (const id of ids) await list.対象にする(id); });
  await step(3, async () => {
    const r = await list.ダウンロードを押す("古物台帳入力用CSV");
    expect(r.file, "古物台帳入力用CSVがダウンロードされる").not.toBeNull();
    csv = await csvを読む(r.file!);
  });
  await step(4, async () => { expect(csv.行.length, "CSVのデータ行").toBe(7); });
  await expected(async () => {
    const 期待 = ["パスポート", "健康保険被保険者証", "外国人登録証明書", "住民基本台帳カード", "学生証、会社員証", "身体障害者手帳", "マイナンバーカード"];
    ids.forEach((id, i) => expect.soft(csv.行.find((r) => r["査定ID"] === id)?.["身分証"], `査定ID（${i + 1}件目）の身分証`).toBe(期待[i]));
  });
  note(`${店舗の注記}。査定ID（AS-M0602-101-013〜107-013）は画面が振った値に読み替えた（申込の古い順に1〜7件目）`);
});

// 014: 事業者であるか
caseTest("IT-M06-02-014", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0602_ADMIN);
  const list = new OtcListPage(page);
  const [biz, non] = [1, 2].map((i) => notes.get(`〔査定ID-M0602-014-${i}〕`));
  let csv: CSV = { 見出し: [], 行: [] };
  await step(1, async () => { await 検索する(list, { 申込者名: rc("M0602CASE014") }); });
  await step(2, async () => { await list.対象にする(biz); await list.対象にする(non); });
  await step(3, async () => {
    const r = await list.ダウンロードを押す("古物台帳入力用CSV");
    expect(r.file, "古物台帳入力用CSVがダウンロードされる").not.toBeNull();
    csv = await csvを読む(r.file!);
  });
  await step(4, async () => { expect(csv.行.length, "CSVのデータ行").toBe(2); });
  await expected(async () => {
    expect.soft(csv.行.find((r) => r["査定ID"] === biz)?.["事業者であるか"], "事業者として登録済みの注文の「事業者であるか」").toBe("1");
    expect.soft(csv.行.find((r) => r["査定ID"] === non)?.["事業者であるか"], "事業者でない注文の「事業者であるか」（空欄）").toBe("");
  });
  note(`${店舗の注記}。事業者の注文は区分だけを事業者にした（事業者番号の登録情報は足しておらず、このケースは事業者番号を確かめない）`);
});

// 015: 数量（買取明細の数量1（1件のみ））
caseTest("IT-M06-02-015", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0602_ADMIN);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0602-015〕");
  let csv: CSV = { 見出し: [], 行: [] };
  await step(1, async () => { await 検索する(list, { 査定ID: id }); });
  await step(2, async () => { await list.対象にする(id); });
  await step(3, async () => {
    const r = await list.ダウンロードを押す("古物台帳入力用CSV");
    expect(r.file, "古物台帳入力用CSVがダウンロードされる").not.toBeNull();
    csv = await csvを読む(r.file!);
  });
  await step(4, async () => { expect(csv.行.length, "CSVのデータ行").toBeGreaterThan(0); });
  await expected(async () => {
    expect.soft(csv.行.find((r) => r["査定ID"] === id)?.["数量"], "数量（買取明細の数量1（1件のみ）の合計）").toBe("1");
  });
  note(`${店舗の注記}。ケースの事前準備の検索は、手順1（画面を開く）の中で行った`);
});

// 016: 数量（買取明細の数量2・3だけ）
caseTest("IT-M06-02-016", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0602_ADMIN);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0602-016〕");
  let csv: CSV = { 見出し: [], 行: [] };
  await step(1, async () => { await 検索する(list, { 査定ID: id }); });
  await step(2, async () => { await list.対象にする(id); });
  await step(3, async () => {
    const r = await list.ダウンロードを押す("古物台帳入力用CSV");
    expect(r.file, "古物台帳入力用CSVがダウンロードされる").not.toBeNull();
    csv = await csvを読む(r.file!);
  });
  await step(4, async () => { expect(csv.行.length, "CSVのデータ行").toBeGreaterThan(0); });
  await expected(async () => {
    expect.soft(csv.行.find((r) => r["査定ID"] === id)?.["数量"], "数量（買取明細の数量2・3だけの合計）").toBe("5");
  });
  note(`${店舗の注記}。ケースの事前準備の検索は、手順1（画面を開く）の中で行った`);
});

// 017: 数量（個別入力商品の数量2・4だけ）
caseTest("IT-M06-02-017", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0602_ADMIN);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0602-017〕");
  let csv: CSV = { 見出し: [], 行: [] };
  await step(1, async () => { await 検索する(list, { 査定ID: id }); });
  await step(2, async () => { await list.対象にする(id); });
  await step(3, async () => {
    const r = await list.ダウンロードを押す("古物台帳入力用CSV");
    expect(r.file, "古物台帳入力用CSVがダウンロードされる").not.toBeNull();
    csv = await csvを読む(r.file!);
  });
  await step(4, async () => { expect(csv.行.length, "CSVのデータ行").toBeGreaterThan(0); });
  await expected(async () => {
    expect.soft(csv.行.find((r) => r["査定ID"] === id)?.["数量"], "数量（個別入力商品の数量2・4だけの合計）").toBe("6");
  });
  note(`${店舗の注記}。ケースの事前準備の検索は、手順1（画面を開く）の中で行った`);
});

/** 一覧の査定ID（上から順） */
async function 一覧の査定ID(list: OtcListPage): Promise<string[]> {
  return (await list.行()).map((r) => r.査定ID);
}

// 018: 保持したページ番号（2ページ目）で戻る
caseTest("IT-M06-02-018", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0602_ADMIN);
  const list = new OtcListPage(page);
  const ids = Array.from({ length: 11 }, (_, i) => notes.get(`〔査定ID-M0602-018-${i + 1}〕`));
  let r: Awaited<ReturnType<OtcListPage["ダウンロードを押す"]>> | undefined;
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    await list.申込者名を入れる(rc("M0602CB018"));
    await list.買取店舗を選ぶ("買取店舗A");
    await list.日時を空にする();
    await list.検索する();
  });
  await step(3, async () => { await list.表示件数を変える(10); });
  await step(4, async () => { await list.ページを押す(2); });
  await step(5, async () => { r = await list.ダウンロードを押す("古物台帳入力用CSV"); });
  await expected(async () => {
    await expect.soft(list.上部のエラー().first(), "選択が無い旨のエラーが表示される").toBeVisible();
    await expect.soft(list.上部のエラー().first(), "エラーの文").toContainText("選択してください");
    expect.soft(r!.file, "CSVがダウンロードされない").toBeNull();
    expect.soft(new URL(page.url()).pathname, "買取一覧(検索結果)画面が2ページ目で表示される").toMatch(/\/otcbuyorder\/page\/2$/);
    expect.soft(await 一覧の査定ID(list), "2ページ目の一覧（最も古い1件だけ）").toEqual([ids[0]]);
  });
  note(`${店舗の注記}。査定IDは画面が振った値に読み替えた（最も古い第1注文が2ページ目の1件）`);
});

// 019: ページ番号なしでは1ページ目で戻る
caseTest("IT-M06-02-019", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0602_ADMIN);
  const list = new OtcListPage(page);
  const ids = Array.from({ length: 11 }, (_, i) => notes.get(`〔査定ID-M0602-019-${i + 1}〕`));
  let r: Awaited<ReturnType<OtcListPage["ダウンロードを押す"]>> | undefined;
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    await list.申込者名を入れる(rc("M0602CB019"));
    await list.買取店舗を選ぶ("買取店舗A");
    await list.日時を空にする();
    await list.検索する();
  });
  await step(3, async () => { await list.表示件数を変える(10); });
  await step(4, async () => { r = await list.ダウンロードを押す("古物台帳入力用CSV"); });
  await expected(async () => {
    await expect.soft(list.上部のエラー().first(), "選択が無い旨のエラーが表示される").toBeVisible();
    await expect.soft(list.上部のエラー().first(), "エラーの文").toContainText("選択してください");
    expect.soft(r!.file, "CSVがダウンロードされない").toBeNull();
    expect.soft(new URL(page.url()).pathname, "買取一覧(検索結果)画面が1ページ目で表示される").toMatch(/\/otcbuyorder(\/page\/1)?$/);
    const shown = await 一覧の査定ID(list);
    expect.soft(shown, "1ページ目の一覧（第11注文〜第2注文の10件）").toEqual([...ids].slice(1).reverse());
    expect.soft(shown, "2ページ目の査定ID（第1注文は表示されない）").not.toContain(ids[0]);
  });
  note(`${店舗の注記}。査定IDは画面が振った値に読み替えた。新規ログインのセッションで始め、ページ移動はしない`);
});

// 020: 存在しないIDではデータ行が0行
caseTest("IT-M06-02-020", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0602_ADMIN);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0602-020〕");
  let csv: CSV = { 見出し: [], 行: [] };
  let r: Awaited<ReturnType<OtcListPage["ダウンロードを押す"]>> | undefined;
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    await list.申込者名を入れる(rc("M0602CB020"));
    await list.買取店舗を選ぶ("買取店舗A");
    await list.日時を空にする();
    await list.検索する();
  });
  await step(3, async () => { await list.対象にする(id); });
  await step(4, async () => { await list.対象の値を差し替える(id, "999999"); });
  await step(5, async () => { r = await list.ダウンロードを押す("古物台帳入力用CSV"); });
  await step(6, async () => { if (r!.file) csv = await csvを読む(r!.file); });
  await expected(async () => {
    expect.soft(r!.file, "CSVがダウンロードされる（エラーにならない）").not.toBeNull();
    await expect.soft(list.上部のエラー(), "エラーが表示されない").toHaveCount(0);
    expect.soft(csv.見出し, "見出し行").toEqual(見出し12);
    expect.soft(csv.行.length, "データ行の数").toBe(0);
  });
  note(`${店舗の注記}。チェックボックスの値の変更は、開発者ツールと同じく画面のスクリプトで値を差し替えた（手順の指定どおり）`);
});
