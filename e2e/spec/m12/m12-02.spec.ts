/**
 * M12-02 日別・月別集計 CSV出力（IT-M12-02-001〜003・005・006・008〜010・013）。正本: integration_test/casegen/cases/M12-02_test_cases.tsv
 *
 * 読み替え（シード m12-02.ts）: TC東京-001 などの店舗は、実行の印を付けた店名の店舗を店舗登録画面で新しく作って使う（依頼者決定 2026-11-11）。
 * 「大阪店」は他の機能の店舗と集計行が混ざらないよう「大阪店-M1202-<番号>」（これも印つき）にした。画面の店舗の表示名・CSVの店舗名は印つきの店名なので、期待の店名も印つきの値（rc）で比べる。
 * 集計データは印つきの店舗の行だけ DB で足した（画面に集計行を入れる操作が無いため）。
 * ケースの前提「通販集計の基準店舗を設定する」（S-M12-02-ROOT）は共有の設定なので書き換えない。実装したケースは集計対象(通販)をチェックOFFにして印つきの店舗だけを集計する。
 *
 * 実装しないケース（理由）:
 * - 007・021・022: 通販を集計対象にして、通販の行（通販集計の基準店舗の集計行）を作る・確かめる。通販集計の基準店舗は共有の設定で書き換えられず、
 *   基準店舗の集計行を足すのは印つきの行に限れない。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { SummaryPage } from "../../pages/admin/m12_01_summary";
import { M1202_ADMIN, 大阪店名, 東京店名 } from "../../seeds/m12-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
type CSV = NonNullable<Awaited<ReturnType<SummaryPage["CSVを取得する"]>>>;
const 印の注記 = "店名は実行の印つき（シードが画面で新しく作った店舗）。集計対象(通販)はチェックOFFにして、印つきの店舗だけを集計した";

/** 日付（2026/04/15・2026-04-15 など）の年月日を YYYY-MM-DD にそろえる。読めなければ元の文字 */
const 日付 = (s: string): string => {
  const m = /(\d{4})\D+(\d{1,2})(?:\D+(\d{1,2}))?/.exec(s);
  return m ? `${m[1]}-${m[2].padStart(2, "0")}${m[3] ? `-${m[3].padStart(2, "0")}` : ""}` : s;
};
const 数値の列 = ["総売上", "原価", "粗利益高", "販売点数", "取引数", "取引単価(平均)", "買取件数", "買取金額", "廃棄", "欠品"];
const 総合計の行か = (r: Record<string, string>, 見出し: string[]): boolean => r[見出し[0]] === "総合計";
const データ行 = (csv: CSV): Record<string, string>[] => csv.行.filter((r) => !総合計の行か(r, csv.見出し));
const 店の行 = (csv: CSV, 店名: string): Record<string, string> | undefined => csv.行.find((r) => r["店舗名"] === 店名);

/** 日別/月別の検索枠で、期間・集計対象（通販OFF・店舗だけON）を指定して検索する */
async function 検索する(p: SummaryPage, 期間: [string, string], 店舗: string[]): Promise<void> {
  await p.期間を入れる(期間[0], 期間[1]);
  await p.集計対象を選ぶ(false, 店舗);
  await p.検索する();
}

async function 取得する(p: SummaryPage): Promise<CSV> {
  const csv = await p.CSVを取得する();
  expect(csv, "CSVがダウンロードされる").not.toBeNull();
  return csv!;
}

function ダウンロードの確かめ(csv: CSV | null, 種類: "日別" | "月別"): void {
  expect.soft(csv !== null, `${種類}の集計結果CSVがダウンロードされる`).toBe(true);
  expect.soft(csv?.fileName ?? "", "ファイル名").toMatch(/^report_summary_.*\.csv$/);
  expect.soft(csv?.見出し[0], `${種類}CSVの先頭列ヘッダ`).toBe(種類 === "日別" ? "集計日" : "集計月");
}

caseTest("IT-M12-02-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1202_ADMIN);
  const p = new SummaryPage(page);
  let csv: CSV | null = null;
  await step(1, async () => { await p.open("daily"); });
  await step(2, async () => { await p.期間を入れる("2026-04-15", "2026-04-15"); });
  await step(3, async () => { note(印の注記); await p.集計対象を選ぶ(false, [rc(東京店名("001"))]); await p.検索する(); });
  await step(4, async () => { csv = await p.CSVを取得する(); });
  await expected(async () => {
    ダウンロードの確かめ(csv, "日別");
    expect.soft(csv ? 店の行(csv, rc(東京店名("001"))) !== undefined : false, "印つきの店舗の行が出力される").toBe(true);
  });
});

caseTest("IT-M12-02-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M1202_ADMIN);
  const p = new SummaryPage(page);
  let csv: CSV | null = null;
  await step(1, async () => { await p.open("monthly"); });
  await step(2, async () => { await p.期間を入れる("2026-04", "2026-04"); });
  await step(3, async () => { note(印の注記); await p.集計対象を選ぶ(false, [rc(大阪店名("002"))]); await p.検索する(); });
  await step(4, async () => { csv = await p.CSVを取得する(); });
  await expected(async () => {
    ダウンロードの確かめ(csv, "月別");
    expect.soft(csv ? 店の行(csv, rc(大阪店名("002"))) !== undefined : false, "印つきの店舗の行が出力される").toBe(true);
  });
});

caseTest("IT-M12-02-003", async ({ page, step, expected }) => {
  await loginAdmin(page, M1202_ADMIN);
  const p = new SummaryPage(page);
  let 日別: CSV | null = null, 月別: CSV | null = null;
  await step(1, async () => {
    note(印の注記);
    await p.open("daily");
    await 検索する(p, ["2026-04-15", "2026-04-15"], [rc(東京店名("003"))]);
    日別 = await p.CSVを取得する();
  });
  await step(2, async () => { expect(日別, "日別のCSVがダウンロードされる").not.toBeNull(); });
  await step(3, async () => {
    await p.open("monthly");
    await 検索する(p, ["2026-04", "2026-04"], [rc(大阪店名("003"))]);
    月別 = await p.CSVを取得する();
  });
  await step(4, async () => { expect(月別, "月別のCSVがダウンロードされる").not.toBeNull(); });
  await expected(async () => {
    expect.soft((日別 as CSV | null)?.見出し[0], "日別CSVの先頭列ヘッダ").toBe("集計日");
    expect.soft((月別 as CSV | null)?.見出し[0], "月別CSVの先頭列ヘッダ").toBe("集計月");
  });
});

caseTest("IT-M12-02-005", async ({ page, step, expected }) => {
  await loginAdmin(page, M1202_ADMIN);
  const p = new SummaryPage(page);
  let csv: CSV | null = null;
  await step(1, async () => { note(印の注記); await p.open("daily"); await 検索する(p, ["2026-04-15", "2026-04-15"], [rc(東京店名("005"))]); });
  await step(2, async () => { csv = await p.CSVを取得する(); });
  let 行: Record<string, string> | undefined;
  await step(3, async () => { 行 = csv ? 店の行(csv, rc(東京店名("005"))) : undefined; });
  await expected(async () => {
    expect.soft(行 !== undefined, "店舗のデータ行がCSVにある").toBe(true);
    expect.soft(["原価", "販売点数", "取引数", "買取件数", "買取金額"].map((k) => 行?.[k]), "原価、販売点数、取引数、買取件数、買取金額").toEqual(["400", "3", "2", "1", "250"]);
  });
});

caseTest("IT-M12-02-006", async ({ page, step, expected }) => {
  await loginAdmin(page, M1202_ADMIN);
  const p = new SummaryPage(page);
  let csv: CSV | null = null;
  await step(1, async () => { note(印の注記); await p.open("monthly"); await 検索する(p, ["2026-04", "2026-04"], [rc(大阪店名("006"))]); });
  await step(2, async () => { csv = await p.CSVを取得する(); });
  let 行: Record<string, string> | undefined;
  await step(3, async () => { 行 = csv ? 店の行(csv, rc(大阪店名("006"))) : undefined; });
  await expected(async () => {
    expect.soft(行 !== undefined, "店舗のデータ行がCSVにある").toBe(true);
    expect.soft(["原価", "販売点数", "取引数", "買取件数", "買取金額"].map((k) => 行?.[k]), "原価、販売点数、取引数、買取件数、買取金額").toEqual(["1000", "10", "4", "2", "500"]);
  });
});

caseTest("IT-M12-02-008", async ({ page, step, expected }) => {
  await loginAdmin(page, M1202_ADMIN);
  const p = new SummaryPage(page);
  let csv: CSV | null = null;
  await step(1, async () => { await p.open("daily"); await p.期間を入れる("2026-04-17", "2026-04-17"); });
  await step(2, async () => { note(印の注記); await p.集計対象を選ぶ(false, [rc(東京店名("008"))]); await p.検索する(); });
  await step(3, async () => { csv = await p.CSVを取得する(); });
  let 行: Record<string, string>[] = [];
  await step(4, async () => { 行 = csv ? データ行(csv) : []; });
  await expected(async () => {
    note("日付の表示の区切り（2026/04/17 か 2026-04-17）は問わず、年月日を比べた");
    expect.soft(csv !== null, "CSVがダウンロードされる").toBe(true);
    expect.soft(行.length, "データ行の数（総合計を除く）").toBe(1);
    expect.soft(行[0]?.["店舗名"], "データ行の店舗名").toBe(rc(東京店名("008")));
    expect.soft(日付(行[0]?.[csv?.見出し[0] ?? ""] ?? ""), "データ行の集計日").toBe("2026-04-17");
    expect.soft(行.some((r) => r["店舗名"] === rc(大阪店名("008"))), "大阪店のデータが出力される").toBe(false);
    expect.soft(行.some((r) => 日付(r[csv?.見出し[0] ?? ""] ?? "") === "2026-04-18"), "2026/04/18のデータが出力される").toBe(false);
  });
});

caseTest("IT-M12-02-009", async ({ page, step, expected }) => {
  await loginAdmin(page, M1202_ADMIN);
  const p = new SummaryPage(page);
  let csv: CSV | null = null;
  await step(1, async () => { await p.open("daily"); await p.期間を入れる("2026-04-18", "2026-04-20"); });
  await step(2, async () => { note(印の注記); await p.集計対象を選ぶ(false, [rc(大阪店名("009")), rc(東京店名("009"))]); await p.検索する(); });
  await step(3, async () => { csv = await p.CSVを取得する(); });
  let 並び: string[] = [];
  await step(4, async () => { 並び = csv ? データ行(csv).map((r) => `${日付(r[csv!.見出し[0]])}・${r["店舗名"]}`) : []; });
  await expected(async () => {
    note("日付の表示の区切りは問わず、年月日を比べた");
    expect.soft(csv !== null, "CSVがダウンロードされる").toBe(true);
    expect.soft(並び, "データ行の並び（集計日の昇順、同じ日は店舗の表示順）").toEqual([
      `2026-04-18・${rc(大阪店名("009"))}`, `2026-04-18・${rc(東京店名("009"))}`, `2026-04-20・${rc(大阪店名("009"))}`, `2026-04-20・${rc(東京店名("009"))}`,
    ]);
  });
});

caseTest("IT-M12-02-010", async ({ page, step, expected }) => {
  await loginAdmin(page, M1202_ADMIN);
  const p = new SummaryPage(page);
  let csv: CSV | null = null;
  await step(1, async () => { await p.open("daily"); await p.期間を入れる("2026-04-21", "2026-04-21"); });
  await step(2, async () => { note(印の注記); await p.集計対象を選ぶ(false, [rc(大阪店名("010")), rc(東京店名("010"))]); await p.検索する(); });
  await step(3, async () => { csv = await p.CSVを取得する(); });
  let 最終: Record<string, string> | undefined;
  await step(4, async () => { 最終 = csv?.行[csv.行.length - 1]; });
  await expected(async () => {
    expect.soft(csv !== null, "CSVがダウンロードされる").toBe(true);
    expect.soft(最終?.[csv?.見出し[0] ?? ""], "最終行の先頭列").toBe("総合計");
    expect.soft(数値の列.map((k) => 最終?.[k]), "最終行の識別ID 3〜12の値（総売上〜欠品）").toEqual(["300", "70", "230", "5", "3", "200", "3", "70", "10", "12"]);
  });
});

caseTest("IT-M12-02-013", async ({ page, step, expected }) => {
  await loginAdmin(page, M1202_ADMIN);
  const p = new SummaryPage(page);
  let ダウンロードされた = false;
  page.on("download", () => { ダウンロードされた = true; });
  await step(1, async () => { note(印の注記); await p.open("daily"); await 検索する(p, ["2026-04-15", "2026-04-15"], [rc(東京店名("013"))]); });
  await step(2, async () => { await page.goto(adminUrl("/analysis/summary/daily")); await page.waitForLoadState("load"); });
  await step(3, async () => {
    try { await page.goto(adminUrl("/analysis/summary/export")); } catch (e) {
      // ダウンロードが始まると goto は「Download is starting」で失敗する
      if (!/Download is starting/i.test((e as Error).message)) throw e;
      ダウンロードされた = true;
    }
    await page.waitForLoadState("load").catch(() => undefined);
  });
  await expected(async () => {
    expect.soft(ダウンロードされた, "CSVファイルがダウンロードされる").toBe(false);
    expect.soft(new URL(page.url()).pathname, "日別/月別集計 集計一覧表示画面へ遷移する").toMatch(/\/analysis\/summary\/daily$/);
  });
});
