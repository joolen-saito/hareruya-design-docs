/**
 * M12-08 フォーマット売上分析 CSVダウンロード のうち、集計結果のCSVを確かめるケース（004 以外の 005〜027）。正本: integration_test/casegen/cases/M12-08_test_cases.tsv
 *
 * 画面の作りと、正本の手順・シードの食い違い（読み替え）:
 * - 検索: CSVダウンロードの操作は、検索を実行して集計結果が出たあとに現れる。005〜017 の手順には検索ボタンを押す手順が無いので、
 *   「CSVダウンロードボタンを押す」の手順の中で、先に検索ボタンを押してから CSV の操作を押した（注記に残す）。
 * - 集計月: シード表の集計月（2026-04 など）は、ほかの人の受注が混ざるため、ほかの人の受注が無い遠い将来の年の同じ月に読み替えた
 *   （シードが決める。年はケースごとに違う。月と、月の日数は正本のとおり。2024-02 はうるう年の2月）。
 * - 売上分析タグ: 共有のマスタなので足さず、既存のタグ2件に読み替えた。シード表の「スタンダード」「M1208-CBnnn-TAG」はタグ1、「モダン」はタグ2の名称（列の見出し）。
 *   ほかの列は、ほかの人のタグでも、その月に売上が無いので0であることまで確かめる。
 * - 004（見出しの順序）は、売上分析タグが8件だけであることが前提で、共有のマスタなので作らない（実装していない）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { FormatSalesPage } from "../../pages/admin/m12_analysis";
import { M1208_ADMIN } from "../../seeds/m12-08";
import { ケース情報, ケース情報を読む, 明細を追加する, 集計月の記録 } from "../../db/m12_08";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 検索の注記 = "CSVダウンロードの操作は検索を実行したあとに現れる（正本の手順に検索ボタンを押す手順が無い）ので、この手順の中で先に検索ボタンを押した";
const 月の注記 = (c: ケース情報, 正本の月: string) =>
  `集計月は、ほかの人の受注が無い月に読み替えた: ${c.集計月}（正本は ${正本の月}）。売上分析タグ1「${c.タグ名[0]}」・タグ2「${c.タグ名[1]}」は既存のタグ（正本のスタンダード・モダン等に読み替え）`;

type Csv = Awaited<ReturnType<FormatSalesPage["CSVを取得する"]>>;
type 日の期待 = Record<string, number>;

const 行 = (rows: string[][]) => rows.slice(1);
const 見出しの列 = (rows: string[][], name: string): number => {
  const i = rows[0]?.indexOf(name) ?? -1;
  if (i < 0) throw new Error(`CSVの見出しに「${name}」が無い（見出し: ${(rows[0] ?? []).join("、")}）`);
  return i;
};
const 値 = (rows: string[][], 日: number, 列名: string): number => {
  const r = 行(rows).find((x) => x[0] === String(日));
  return r ? Number(r[見出しの列(rows, 列名)]) : NaN;
};
/** 日ごとの全列を、期待（指定の無い列は0。「合計」は指定が無ければその日の列の和）と比べ、食い違いの一覧を返す */
const 全体の差 = (rows: string[][], 日数: number, 期待: Record<number, 日の期待>): string[] => {
  const 差: string[] = [];
  const head = rows[0] ?? [];
  for (let d = 1; d <= 日数; d++) {
    const r = 行(rows).find((x) => x[0] === String(d));
    if (!r) { 差.push(`${d}日の行が無い`); continue; }
    const e = 期待[d] ?? {};
    const 和 = Object.entries(e).filter(([k]) => k !== "合計").reduce((a, [, v]) => a + v, 0);
    for (let i = 1; i < head.length; i++) {
      const want = head[i] === "合計" ? (e["合計"] ?? 和) : (e[head[i]] ?? 0);
      if (Number(r[i]) !== want) 差.push(`${d}日の「${head[i]}」: 実際 ${r[i]}・期待 ${want}`);
    }
  }
  return 差;
};
const 日の並び = (rows: string[][]): string => 行(rows).map((r) => r[0]).join(",");
const 昇順の日 = (日数: number): string => Array.from({ length: 日数 }, (_, i) => String(i + 1)).join(",");
const CSVの行 = (csv: Csv): string[][] => csv?.rows ?? [[]];

async function 条件を入れる(p: FormatSalesPage, c: ケース情報): Promise<void> {
  await p.通販.setChecked(true, { timeout: 20_000 });
  await p.店舗.setChecked(true, { timeout: 20_000 });
  await p.月を入れる(c.集計月);
}

/** 005〜017 の「CSVダウンロードボタンを押す」: 検索してからCSVを取得する */
async function 検索してCSVを取る(p: FormatSalesPage, c: ケース情報, 正本の月: string): Promise<Csv> {
  note(検索の注記);
  note(月の注記(c, 正本の月));
  await p.検索する();
  return p.CSVを取得する();
}
/** 018〜027 の「検索ボタンを押し、日別の売上表が表示されたことを確認する」 */
async function 検索する(p: FormatSalesPage, c: ケース情報, 正本の月: string): Promise<void> {
  note(月の注記(c, 正本の月));
  await p.検索する();
  expect(await p.日別の売上表().then((t) => t.行.length), "日別の売上表の行数").toBe(c.日数);
}

// ---- 基本のデータ（005・010・014・015）: スタンダード2500・モダン400・タグなしカード600・タグなし非カード200 ----
const 基本の日 = (c: ケース情報): 日の期待 => ({ [c.タグ名[0]]: 2500, [c.タグ名[1]]: 400, "その他(カード)": 600, "その他": 200, "合計": 3700 });

caseTest("IT-M12-08-005", async ({ page, step, expected }) => {
  await loginAdmin(page, M1208_ADMIN);
  const c = ケース情報を読む("005");
  const p = new FormatSalesPage(page);
  let csv: Csv = null;
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.通販.setChecked(true, { timeout: 20_000 }); await p.店舗.setChecked(true, { timeout: 20_000 }); });
  await step(3, async () => { await p.月を入れる(c.集計月); });
  await step(4, async () => { csv = await 検索してCSVを取る(p, c, "2026-04"); });
  await step(5, async () => { /* 取得したCSVの1日の行を確認する（期待結果で確かめる） */ expect(csv !== null, "CSVがダウンロードされた").toBe(true); });
  await expected(async () => {
    const rows = CSVの行(csv);
    expect.soft(csv?.fileName ?? "", "ダウンロードしたCSVのファイル名").toMatch(/^format_sales_report_.*\.csv$/);
    const 日 = 基本の日(c);
    expect.soft(行(rows).find((r) => r[0] === "1")?.join("、") ?? "", "1日の行（日、タグ1、タグ2、その他(カード)、その他、日別合計の値）")
      .toBe(["1", ...(rows[0] ?? []).slice(1).map((h) => String(日[h] ?? 0))].join("、"));
    expect.soft(値(rows, 1, c.タグ名[0]), `1日の「${c.タグ名[0]}」`).toBe(2500);
    expect.soft(値(rows, 1, c.タグ名[1]), `1日の「${c.タグ名[1]}」`).toBe(400);
    expect.soft(値(rows, 1, "その他(カード)"), "1日の「その他(カード)」").toBe(600);
    expect.soft(値(rows, 1, "その他"), "1日の「その他」").toBe(200);
    expect.soft(値(rows, 1, "合計"), "1日の日別合計").toBe(3700);
    expect.soft(全体の差(rows, c.日数, { 1: 日 }), "ほかの日・ほかの列（ほかの人のタグを含む）が0であること").toEqual([]);
  });
});

caseTest("IT-M12-08-006", async ({ page, step, expected }) => {
  await loginAdmin(page, M1208_ADMIN);
  const c = ケース情報を読む("006");
  const p = new FormatSalesPage(page);
  let csv: Csv = null;
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.通販.setChecked(true, { timeout: 20_000 }); await p.店舗.setChecked(true, { timeout: 20_000 }); });
  await step(3, async () => { await p.月を入れる(c.集計月); });
  await step(4, async () => { csv = await 検索してCSVを取る(p, c, "2026-04"); });
  await step(5, async () => { expect(csv !== null, "CSVがダウンロードされた").toBe(true); });
  await expected(async () => {
    const rows = CSVの行(csv);
    expect.soft(行(rows).length, "日別行の数").toBe(30);
    expect.soft(日の並び(rows), "日別行の日（昇順）").toBe(昇順の日(30));
    expect.soft(値(rows, 1, c.タグ名[0]), "1日のタグ1（スタンダード）").toBe(1000);
    expect.soft(値(rows, 30, c.タグ名[0]), "30日のタグ1（スタンダード）").toBe(2000);
    expect.soft(全体の差(rows, c.日数, { 1: { [c.タグ名[0]]: 1000 }, 30: { [c.タグ名[0]]: 2000 } }), "前月末（4000）と翌月初（8000）が含まれず、ほかの日・列が0であること").toEqual([]);
  });
});

caseTest("IT-M12-08-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M1208_ADMIN);
  const c = ケース情報を読む("007");
  const p = new FormatSalesPage(page);
  let csv: Csv = null;
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.通販.setChecked(true, { timeout: 20_000 }); await p.店舗.setChecked(true, { timeout: 20_000 }); });
  await step(3, async () => { await p.月を入れる(c.集計月); });
  await step(4, async () => { csv = await 検索してCSVを取る(p, c, "2026-04"); });
  await step(5, async () => { expect(csv !== null, "CSVがダウンロードされた").toBe(true); });
  await expected(async () => {
    const rows = CSVの行(csv);
    expect.soft(値(rows, 15, c.タグ名[0]), "15日のタグ1（スタンダード）").toBe(1000);
    expect.soft(値(rows, 15, "合計"), "15日の日別合計").toBe(1000);
    expect.soft(全体の差(rows, c.日数, { 15: { [c.タグ名[0]]: 1000 } }), "キャンセル受注の9000が含まれず、ほかの日・列が0であること").toEqual([]);
  });
});

caseTest("IT-M12-08-008", async ({ page, step, expected }) => {
  await loginAdmin(page, M1208_ADMIN);
  const c = ケース情報を読む("008");
  const p = new FormatSalesPage(page);
  let csv: Csv = null;
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.通販.setChecked(true, { timeout: 20_000 }); await p.店舗.setChecked(true, { timeout: 20_000 }); });
  await step(3, async () => { await p.月を入れる(c.集計月); });
  await step(4, async () => { csv = await 検索してCSVを取る(p, c, "2026-04"); });
  await step(5, async () => { expect(csv !== null, "CSVがダウンロードされた").toBe(true); });
  await expected(async () => {
    const rows = CSVの行(csv);
    expect.soft(値(rows, 1, "その他(カード)"), "1日の「その他(カード)」（タグなしのカード商品の売上）").toBe(600);
    expect.soft(値(rows, 1, "その他"), "1日の「その他」（カード商品以外の売上）").toBe(200);
    expect.soft(全体の差(rows, c.日数, { 1: { "その他(カード)": 600, "その他": 200 } }), "ほかの日・列が0であること").toEqual([]);
  });
});

caseTest("IT-M12-08-009", async ({ page, step, expected }) => {
  await loginAdmin(page, M1208_ADMIN);
  const c = ケース情報を読む("009");
  const p = new FormatSalesPage(page);
  let csv: Csv = null;
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.通販.setChecked(true, { timeout: 20_000 }); await p.店舗.setChecked(true, { timeout: 20_000 }); });
  await step(3, async () => { await p.月を入れる(c.集計月); });
  await step(4, async () => { csv = await 検索してCSVを取る(p, c, "2026-04"); });
  await step(5, async () => { expect(csv !== null, "CSVがダウンロードされた").toBe(true); });
  await expected(async () => {
    const rows = CSVの行(csv);
    expect.soft(行(rows).length, "日別行の数").toBe(30);
    expect.soft(日の並び(rows), "日別行の日（1日から30日）").toBe(昇順の日(30));
    expect.soft(全体の差(rows, c.日数, {}), "各日のタグ・その他(カード)・その他と日別合計がすべて0であること").toEqual([]);
  });
});

caseTest("IT-M12-08-010", async ({ page, step, expected }) => {
  await loginAdmin(page, M1208_ADMIN);
  const c = ケース情報を読む("010");
  const p = new FormatSalesPage(page);
  let csv: Csv = null;
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.通販.setChecked(true, { timeout: 20_000 }); await p.店舗.setChecked(true, { timeout: 20_000 }); });
  await step(3, async () => { await p.月を入れる(c.集計月); });
  await step(4, async () => { csv = await 検索してCSVを取る(p, c, "2026-04"); });
  await step(5, async () => { expect(csv !== null, "CSVがダウンロードされた").toBe(true); });
  await expected(async () => {
    const rows = CSVの行(csv);
    expect.soft(rows.length, "CSVの行数（ヘッダ行1行と日別行30行）").toBe(31);
    expect.soft(rows[0]?.[0], "1行目が見出し行（先頭は「日」）").toBe("日");
    expect.soft(日の並び(rows), "2行目以降が1日から30日までの日別行だけ（合計行・平均行が無い）").toBe(昇順の日(30));
    expect.soft(rows.filter((r) => /合計|平均/.test(r[0] ?? "")).length, "フォーマット別の合計行・平均行の数").toBe(0);
  });
});

caseTest("IT-M12-08-011", async ({ page, step, expected }) => {
  await loginAdmin(page, M1208_ADMIN);
  const c = ケース情報を読む("011");
  const p = new FormatSalesPage(page);
  let csv: Csv = null;
  let 画面の10日 = NaN;
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.通販.setChecked(true, { timeout: 20_000 }); await p.店舗.setChecked(true, { timeout: 20_000 }); });
  await step(3, async () => { await p.月を入れる(c.集計月); });
  await step(4, async () => {
    note(検索の注記.replace("CSVダウンロードの操作は", "日別の売上表は"));
    note(月の注記(c, "2026-04"));
    await p.検索する();
    const t = await p.日別の売上表();
    const i = t.見出し.indexOf(c.タグ名[0]);
    画面の10日 = Number(t.行.find((r) => r[0] === "10")?.[i]);
    expect(画面の10日, "画面の日別の売上表の10日のタグ1（スタンダード）").toBe(1000);
  });
  await step(5, async () => {
    note("DBで受注明細を追加した（受注の元の明細を写し、単価2000・数量1・売上分析タグはタグ1にした）");
    明細を追加する(c.受注[0].受注ID, { 単価: 2000, 数量: 1, タグID: c.タグID[0] });
  });
  await step(6, async () => { csv = await p.CSVを取得する(); });
  await step(7, async () => { expect(csv !== null, "CSVがダウンロードされた").toBe(true); });
  await expected(async () => {
    const rows = CSVの行(csv);
    expect.soft(画面の10日, "検索直後の画面の10日のタグ1").toBe(1000);
    expect.soft(値(rows, 10, c.タグ名[0]), "CSVの10日のタグ1（ダウンロード時に再集計）").toBe(3000);
    expect.soft(値(rows, 10, "合計"), "CSVの10日の日別合計").toBe(3000);
    expect.soft(全体の差(rows, c.日数, { 10: { [c.タグ名[0]]: 3000 } }), "ほかの日・列が0であること").toEqual([]);
  });
});

caseTest("IT-M12-08-014", async ({ page, step, expected }) => {
  await loginAdmin(page, M1208_ADMIN);
  const c = ケース情報を読む("014");
  const p = new FormatSalesPage(page);
  let csv: Csv = null;
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.通販.setChecked(true, { timeout: 20_000 }); await p.店舗.setChecked(true, { timeout: 20_000 }); });
  await step(3, async () => { await p.月を入れる(c.集計月); });
  await step(4, async () => { csv = await 検索してCSVを取る(p, c, "2026-04"); });
  await step(5, async () => { expect(csv !== null, "CSVがダウンロードされた").toBe(true); });
  await expected(async () => {
    const rows = CSVの行(csv);
    const i = rows[0]?.indexOf(c.タグ名[0]) ?? -1;
    expect.soft(i >= 0 ? 行(rows).find((r) => r[0] === "1")?.[i] : undefined, "1日のタグ1（スタンダード）の値（桁区切りの無い数値の文字）").toBe("2500");
  });
});

caseTest("IT-M12-08-015", async ({ page, step, expected }) => {
  await loginAdmin(page, M1208_ADMIN);
  const c = ケース情報を読む("015");
  const p = new FormatSalesPage(page);
  let 前: string[] = [];
  let 後: string[] = [];
  let csv: Csv = null;
  await step(1, async () => {
    note("「全レコード」は、集計月の受注・受注明細・売上分析タグの紐付けと、紐づく売上分析タグの全カラムの値とした（集計月はほかの人の受注が無い月なので、月の全件）");
    前 = 集計月の記録(c.集計月);
  });
  await step(2, async () => { await p.open(); });
  await step(3, async () => { await p.通販.setChecked(true, { timeout: 20_000 }); await p.店舗.setChecked(true, { timeout: 20_000 }); });
  await step(4, async () => { await p.月を入れる(c.集計月); });
  await step(5, async () => { csv = await 検索してCSVを取る(p, c, "2026-04"); });
  await step(6, async () => { 後 = 集計月の記録(c.集計月); });
  await expected(async () => {
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(前.length, "記録したレコードの数（受注1・明細5・紐付け3・タグ2 の計11件のはず）").toBe(11);
    expect.soft(後, "CSVダウンロード後のレコードと値が、前と同じ").toEqual(前);
  });
});

caseTest("IT-M12-08-018", async ({ page, step, expected }) => {
  await loginAdmin(page, M1208_ADMIN);
  const c = ケース情報を読む("018");
  const p = new FormatSalesPage(page);
  let csv: Csv = null;
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.通販.setChecked(true, { timeout: 20_000 }); await p.店舗.setChecked(true, { timeout: 20_000 }); });
  await step(3, async () => { await p.月を入れる(c.集計月); });
  await step(4, async () => { await 検索する(p, c, "2026-05"); });
  await step(5, async () => { csv = await p.CSVを取得する(); });
  await step(6, async () => { expect(csv !== null, "CSVがダウンロードされた").toBe(true); });
  await expected(async () => {
    const rows = CSVの行(csv);
    expect.soft(行(rows).length, "日別行の数").toBe(31);
    expect.soft(日の並び(rows), "日別行の日（昇順）").toBe(昇順の日(31));
    expect.soft(値(rows, 1, c.タグ名[0]), "1日のタグ1（スタンダード）").toBe(1000);
    expect.soft(値(rows, 31, c.タグ名[0]), "31日のタグ1（スタンダード）").toBe(2000);
    expect.soft(全体の差(rows, c.日数, { 1: { [c.タグ名[0]]: 1000 }, 31: { [c.タグ名[0]]: 2000 } }), "前月末（4000）と翌月初（8000）が含まれず、ほかの日・列が0であること").toEqual([]);
  });
});

caseTest("IT-M12-08-019", async ({ page, step, expected }) => {
  await loginAdmin(page, M1208_ADMIN);
  const c = ケース情報を読む("019");
  const p = new FormatSalesPage(page);
  let csv: Csv = null;
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.通販.setChecked(true, { timeout: 20_000 }); await p.店舗.setChecked(true, { timeout: 20_000 }); });
  await step(3, async () => { await p.月を入れる(c.集計月); });
  await step(4, async () => { await 検索する(p, c, "2026-04"); });
  await step(5, async () => { csv = await p.CSVを取得する(); });
  await step(6, async () => { expect(csv !== null, "CSVがダウンロードされた").toBe(true); });
  await expected(async () => {
    const rows = CSVの行(csv);
    expect.soft(値(rows, 10, c.タグ名[0]), "10日のタグ1（スタンダード）").toBe(1200);
    expect.soft(値(rows, 10, "合計"), "10日の日別合計").toBe(1200);
    expect.soft(全体の差(rows, c.日数, { 10: { [c.タグ名[0]]: 1200 } }), "引き渡し済みの元EC受注の1000が加算も代用もされず、ほかの日・列が0であること").toEqual([]);
  });
});

/** 020〜027 の共通の形: 検索して日別の売上表を確かめ、CSVの指定の列の値を確かめる */
async function 手順(p: FormatSalesPage, c: ケース情報, 正本の月: string, step: (n: number, f: () => Promise<void>) => Promise<void>, set: (csv: Csv) => void): Promise<void> {
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.通販.setChecked(true, { timeout: 20_000 }); await p.店舗.setChecked(true, { timeout: 20_000 }); });
  await step(3, async () => { await p.月を入れる(c.集計月); });
  await step(4, async () => { await 検索する(p, c, 正本の月); });
  await step(5, async () => { set(await p.CSVを取得する()); });
}

caseTest("IT-M12-08-020", async ({ page, step, expected }) => {
  await loginAdmin(page, M1208_ADMIN);
  const c = ケース情報を読む("020");
  const p = new FormatSalesPage(page);
  let csv: Csv = null;
  await 手順(p, c, "2024-01", step, (v) => { csv = v; });
  await step(6, async () => { expect(csv !== null, "CSVがダウンロードされた").toBe(true); });
  await expected(async () => {
    const rows = CSVの行(csv);
    expect.soft(行(rows).length, "日別行の数（31日の月）").toBe(31);
    expect.soft(値(rows, 10, c.タグ名[0]), "10日のタグ1の列（M1208-CB020-TAG に当たる）").toBe(1000);
    expect.soft(全体の差(rows, c.日数, { 10: { [c.タグ名[0]]: 1000 } }), "タグ1の列が10日以外の全行で0、ほかの列も0であること").toEqual([]);
  });
});

caseTest("IT-M12-08-021", async ({ page, step, expected }) => {
  await loginAdmin(page, M1208_ADMIN);
  const c = ケース情報を読む("021");
  const p = new FormatSalesPage(page);
  let csv: Csv = null;
  await 手順(p, c, "2024-02", step, (v) => { csv = v; });
  await step(6, async () => { expect(csv !== null, "CSVがダウンロードされた").toBe(true); });
  await expected(async () => {
    const rows = CSVの行(csv);
    expect.soft(行(rows).length, "日別行の数（うるう年の2月。29日）").toBe(29);
    expect.soft(値(rows, 10, "その他(カード)"), "10日の「その他(カード)」（スマレジ由来の800。元EC受注の700は加算も代用もされない）").toBe(800);
    expect.soft(全体の差(rows, c.日数, { 10: { "その他(カード)": 800 } }), "「その他(カード)」が10日以外の全行で0、ほかの列も0であること").toEqual([]);
  });
});

caseTest("IT-M12-08-022", async ({ page, step, expected }) => {
  await loginAdmin(page, M1208_ADMIN);
  const c = ケース情報を読む("022");
  const p = new FormatSalesPage(page);
  let csv: Csv = null;
  await 手順(p, c, "2024-03", step, (v) => { csv = v; });
  await step(6, async () => { expect(csv !== null, "CSVがダウンロードされた").toBe(true); });
  await expected(async () => {
    const rows = CSVの行(csv);
    expect.soft(行(rows).length, "日別行の数（31日の月）").toBe(31);
    expect.soft(値(rows, 10, "その他"), "10日の「その他」（スマレジ由来の600。元EC受注の500は加算も代用もされない）").toBe(600);
    expect.soft(全体の差(rows, c.日数, { 10: { "その他": 600 } }), "「その他」が10日以外の全行で0、ほかの列も0であること").toEqual([]);
  });
});

caseTest("IT-M12-08-023", async ({ page, step, expected }) => {
  await loginAdmin(page, M1208_ADMIN);
  const c = ケース情報を読む("023");
  const p = new FormatSalesPage(page);
  let csv: Csv = null;
  await 手順(p, c, "2024-04", step, (v) => { csv = v; });
  await step(6, async () => { expect(csv !== null, "CSVがダウンロードされた").toBe(true); });
  await expected(async () => {
    const rows = CSVの行(csv);
    expect.soft(行(rows).length, "日別行の数（30日の月）").toBe(30);
    expect.soft(値(rows, 10, "その他(カード)"), "10日の「その他(カード)」").toBe(700);
    expect.soft(全体の差(rows, c.日数, { 10: { "その他(カード)": 700 } }), "「その他(カード)」が10日以外の全行で0、ほかの列も0であること").toEqual([]);
  });
});

caseTest("IT-M12-08-024", async ({ page, step, expected }) => {
  await loginAdmin(page, M1208_ADMIN);
  const c = ケース情報を読む("024");
  const p = new FormatSalesPage(page);
  let csv: Csv = null;
  await 手順(p, c, "2024-05", step, (v) => { csv = v; });
  await step(6, async () => { expect(csv !== null, "CSVがダウンロードされた").toBe(true); });
  await expected(async () => {
    const rows = CSVの行(csv);
    expect.soft(行(rows).length, "日別行の数（31日の月）").toBe(31);
    expect.soft(値(rows, 10, c.タグ名[0]), "10日のタグ1の列（M1208-CB024-TAG に当たる。スマレジ由来の1200。元EC受注の1000は加算も代用もされない）").toBe(1200);
    expect.soft(全体の差(rows, c.日数, { 10: { [c.タグ名[0]]: 1200 } }), "タグ1の列が10日以外の全行で0、ほかの列も0であること").toEqual([]);
  });
});

caseTest("IT-M12-08-025", async ({ page, step, expected }) => {
  await loginAdmin(page, M1208_ADMIN);
  const c = ケース情報を読む("025");
  const p = new FormatSalesPage(page);
  let csv: Csv = null;
  await 手順(p, c, "2024-06", step, (v) => { csv = v; });
  await step(6, async () => { expect(csv !== null, "CSVがダウンロードされた").toBe(true); });
  await expected(async () => {
    const rows = CSVの行(csv);
    expect.soft(行(rows).length, "日別行の数（30日の月）").toBe(30);
    expect.soft(値(rows, 10, "その他"), "10日の「その他」").toBe(500);
    expect.soft(全体の差(rows, c.日数, { 10: { "その他": 500 } }), "「その他」が10日以外の全行で0、ほかの列も0であること").toEqual([]);
  });
});

caseTest("IT-M12-08-026", async ({ page, step, expected }) => {
  await loginAdmin(page, M1208_ADMIN);
  const c = ケース情報を読む("026");
  const p = new FormatSalesPage(page);
  let csv: Csv = null;
  await 手順(p, c, "2024-07", step, (v) => { csv = v; });
  await step(6, async () => { expect(csv !== null, "CSVがダウンロードされた").toBe(true); });
  await expected(async () => {
    const rows = CSVの行(csv);
    expect.soft(行(rows).length, "日別行の数（31日の月）").toBe(31);
    expect.soft(全体の差(rows, c.日数, {}), "キャンセルの受注の1000が集計されず、タグ1の列を含む全行・全列が0であること").toEqual([]);
  });
});

caseTest("IT-M12-08-027", async ({ page, step, expected }) => {
  await loginAdmin(page, M1208_ADMIN);
  const c = ケース情報を読む("027");
  const p = new FormatSalesPage(page);
  let csv: Csv = null;
  await 手順(p, c, "2024-08", step, (v) => { csv = v; });
  await step(6, async () => { expect(csv !== null, "CSVがダウンロードされた").toBe(true); });
  await expected(async () => {
    const rows = CSVの行(csv);
    expect.soft(行(rows).length, "日別行の数（31日の月）").toBe(31);
    expect.soft(日の並び(rows), "日別行の日（昇順）").toBe(昇順の日(31));
    expect.soft(全体の差(rows, c.日数, {}), "集計月の外（前の年の同じ月）の受注の1000が集計されず、タグ1の列を含む全行・全列が0であること").toEqual([]);
  });
});
