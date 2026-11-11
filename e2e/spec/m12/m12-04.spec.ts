/**
 * M12-04 受注売上分析 CSV出力。正本: integration_test/casegen/cases/M12-04_test_cases.tsv
 *
 * 実装していないケース（理由）:
 * - 002・006・019・020・021・022: カテゴリ単位の集計。商品ごとに別のカテゴリへ所属させた商品（と複数カテゴリ所属・カテゴリ未所属の商品）が要る。
 *   受注の商品は画面で作った基の受注の1商品を写しているため、商品ごとに別のカテゴリへ分けられない（商品を複数作る手段が、在庫の承認まで要る長い画面操作になり、
 *   開発環境のグッズ商品CSV登録のカテゴリIDの不具合（ECCUBE_HARERUYA-3966）にも当たる）。
 *
 * 正本・シードとの食い違い（読み替え）:
 * - 日付の年: 正本の日付の年（2026）は、ほかの人の受注が混ざるため、ほかの人の受注が無い遠い将来の年の同じ月日に読み替えた（シードが決める）。時刻・月日は正本のとおり。
 * - 商品コード: 実行の印を付けた値（正本の値 + 「-印」）で作り、比べる。
 * - 店舗: 「TC東京」は本店の店舗の選択肢。「大阪店-M1204-…」は実行の印を付けた店名の店舗。
 * - 平均単価: CSVは小数を切り捨てた整数で出る。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { データ情報を読む } from "../../db/m12_04";
import { SalesAnalysisPage, 入力欄の日時, 検索条件, 結果の行 } from "../../pages/admin/m12_03_sales_analysis";
import { CSVを取得する } from "../../pages/admin/m12_04_csv";
import { M1204_ADMIN } from "../../seeds/m12-04";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 年の注記 = (y: number) => `日付の年は、ほかの人の受注が無い年に読み替えた: ${y}（正本は2026）。商品コード・店名は実行の印を付けた値で確かめる`;
const TC東京 = "TC東京";

type Ctx = Parameters<Parameters<typeof caseTest>[1]>[0];
type CSV = { rows: string[][]; fileName: string; ファイル数: number };

const 商品の見出し = ["商品コード", "商品名", "平均単価", "数量", "合計", "件数"];

/** 集計日(From)(To)を入れる。年は、正本の年（2026）との差を、読み替えた年に足す */
async function 期間を入れる(p: SalesAnalysisPage, from: string, to: string, y: number): Promise<void> {
  const 年 = (s: string) => y + (Number(s.slice(0, 4)) - 2026);
  await p.集計日From.fill(入力欄の日時(from, 年(from)), { timeout: 20_000 });
  await p.集計日To.fill(入力欄の日時(to, 年(to)), { timeout: 20_000 });
}

/** 商品単位のCSVのデータ行（見出し行の次から）を、商品コードの印を外さずに文字列の配列にする */
const データ行 = (csv: CSV | null): string[][] => (csv ? csv.rows.slice(1) : []);

// ---------------------------------------------------------------- 共通の形（手順1〜5）

type 行の期待 = { c: string; 名: string; 平均: number; 数量: number; 合計: number; 件数: number };
type 定め = {
  seed: string;
  通販: boolean;
  /** 手順2で店舗全選択/全解除を一度ONにしてからOFFにする */
  全選択して全解除: boolean;
  /** 検索で選ぶ店舗。「TC東京」と、シードが作った店舗なら "大阪" */
  店舗: ("TC東京" | "大阪")[];
  キーワード: string;
  期間: [string, string];
  並び替え項目: string;
  並び順: "昇順" | "降順";
  期待: 行の期待[];
  説明: string;
  /** 手順5の前に、画面の集計一覧に出ている件数（表示件数の確認） */
  画面の件数?: number;
};

const 期待の行 = (r: 行の期待): string[] => [rc(r.c), r.名, String(r.平均), String(r.数量), String(r.合計), String(r.件数)];

function 商品のCSVの確かめ(v: 定め) {
  return async ({ page, step, expected }: Ctx) => {
    await loginAdmin(page, M1204_ADMIN);
    const info = データ情報を読む(v.seed);
    const p = new SalesAnalysisPage(page);
    let csv: CSV | null = null; let 画面: 結果の行[] = [];
    await step(1, async () => { await p.open(); });
    await step(2, async () => {
      await p.通販を選ぶ(v.通販);
      if (v.全選択して全解除) await p.全選択して全解除する();
      await p.店舗だけを選ぶ(v.店舗.map((s) => (s === "大阪" ? info.店名! : TC東京)));
    });
    await step(3, async () => {
      note(年の注記(info.年));
      const c: 検索条件 = { キーワード: v.キーワード, 集計単位: "商品", 並び替え項目: v.並び替え項目, 並び順: v.並び順 };
      await p.条件を入れる(c, info.年);
      await 期間を入れる(p, v.期間[0], v.期間[1], info.年);
      await p.検索する();
      画面 = (await p.結果を読む()).行;
    });
    await step(4, async () => { csv = await CSVを取得する(page); });
    let 行: string[][] = [];
    await step(5, async () => { 行 = データ行(csv); });
    await expected(async () => {
      expect.soft(csv, "CSVが1ファイルダウンロードされる").not.toBeNull();
      expect.soft(csv?.rows[0], "見出し行が商品コード、商品名、平均単価、数量、合計、件数の順").toEqual(商品の見出し);
      expect.soft(行, v.説明).toEqual(v.期待.map(期待の行));
    });
    void 画面;
  };
}

// ---------------------------------------------------------------- 001・002 ダウンロードされること

caseTest("IT-M12-04-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1204_ADMIN);
  const info = データ情報を読む("S-M12-04-PRODUCT-001");
  const p = new SalesAnalysisPage(page);
  let csv: CSV | null = null;
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.通販を選ぶ(false); await p.店舗だけを選ぶ([TC東京]); });
  await step(3, async () => {
    note(年の注記(info.年));
    await p.条件を入れる({ キーワード: "商品集計確認", 集計単位: "商品" }, info.年);
    await 期間を入れる(p, "2026/04/01 00:00:00", "2026/05/01 00:00:00", info.年);
    await p.検索する();
  });
  await step(4, async () => { csv = await CSVを取得する(page); });
  await expected(async () => {
    expect.soft(csv, "商品単位の集計結果CSVが1ファイルダウンロードされる").not.toBeNull();
    expect.soft(csv?.ファイル数, "ダウンロードされたファイルは1つ").toBe(1);
    expect.soft(csv?.fileName ?? "", "ファイル名の拡張子はcsv").toMatch(/\.csv$/);
    expect.soft(csv?.rows[0], "商品単位のCSV（見出し行が商品コード、商品名、平均単価、数量、合計、件数）").toEqual(商品の見出し);
    expect.soft(データ行(csv).length, "集計結果の行がある").toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------- 005・015・016 1行の確認

function 一行の確かめ(v: { seed: string; キーワード: string; 期間: [string, string]; 店舗: ("TC東京" | "大阪")[]; 行: 行の期待; 平均の画面値?: string }) {
  return async ({ page, step, expected }: Ctx) => {
    await loginAdmin(page, M1204_ADMIN);
    const info = データ情報を読む(v.seed);
    const p = new SalesAnalysisPage(page);
    let csv: CSV | null = null; let 画面: 結果の行[] = [];
    await step(1, async () => { await p.open(); });
    await step(2, async () => { await p.通販を選ぶ(false); await p.店舗だけを選ぶ(v.店舗.map((s) => (s === "大阪" ? info.店名! : TC東京))); });
    await step(3, async () => {
      note(年の注記(info.年));
      await p.条件を入れる({ キーワード: v.キーワード, 集計単位: "商品" }, info.年);
      await 期間を入れる(p, v.期間[0], v.期間[1], info.年);
      await p.検索する();
      画面 = (await p.結果を読む()).行;
    });
    await step(4, async () => { csv = await CSVを取得する(page); });
    let 行: string[] | undefined;
    await step(5, async () => { 行 = データ行(csv).find((r) => r[0] === rc(v.行.c)); });
    await expected(async () => {
      expect.soft(csv, "CSVが1ファイルダウンロードされる").not.toBeNull();
      expect.soft(行, `CSVに商品コード${v.行.c}の行がある`).toBeDefined();
      expect.soft(行, "商品コード、商品名、平均単価、数量、合計、件数").toEqual(期待の行(v.行));
      const a = 画面.find((r) => r.商品コード === rc(v.行.c));
      expect.soft(a, `ダウンロード直前の集計一覧に商品コード${v.行.c}の行がある`).toBeDefined();
      if (a) {
        expect.soft([a.商品名, a.平均単価, a.数量, a.合計, a.件数], "ダウンロード直前の集計一覧の行と一致する")
          .toEqual([v.行.名, String(v.行.平均), String(v.行.数量), String(v.行.合計), String(v.行.件数)]);
      }
    });
  };
}

caseTest("IT-M12-04-005", 一行の確かめ({
  seed: "S-M12-04-PRODUCT-005", キーワード: "商品集計確認", 期間: ["2026/04/01 00:00:00", "2026/05/01 00:00:00"], 店舗: ["TC東京"],
  行: { c: "P-001-005", 名: "商品集計確認・受注時商品A-M1204-005", 平均: 1000, 数量: 4, 合計: 4000, 件数: 2 },
}));
caseTest("IT-M12-04-015", 一行の確かめ({
  seed: "S-M12-04-MULTISTORE-015", キーワード: "合算確認-M1204-015", 期間: ["2026/12/01 00:00:00", "2027/01/01 00:00:00"], 店舗: ["TC東京", "大阪"],
  行: { c: "P-001-015", 名: "合算確認-M1204-015", 平均: 100, 数量: 30, 合計: 3000, 件数: 2 },
}));
caseTest("IT-M12-04-016", 一行の確かめ({
  seed: "S-M12-04-FRACTION-016", キーワード: "端数確認-M1204-016", 期間: ["2026/12/01 00:00:00", "2027/01/01 00:00:00"], 店舗: ["TC東京"],
  行: { c: "P-001-016", 名: "端数確認-M1204-016", 平均: 100, 数量: 2, 合計: 201, 件数: 1 },
}));

// ---------------------------------------------------------------- 007 表示件数より多い行がCSVには全部出る

caseTest("IT-M12-04-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M1204_ADMIN);
  const info = データ情報を読む("S-M12-04-LIMIT-007");
  const p = new SalesAnalysisPage(page);
  let csv: CSV | null = null; let 画面: 結果の行[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.通販を選ぶ(false); await p.店舗だけを選ぶ([TC東京]); });
  await step(3, async () => {
    note(年の注記(info.年));
    await p.条件を入れる({ キーワード: "表示件数確認", 集計単位: "商品", 並び替え項目: "集計単位", 並び順: "昇順", 件数: "10" }, info.年);
    await 期間を入れる(p, "2026/10/01 00:00:00", "2026/11/01 00:00:00", info.年);
    await p.検索する();
    画面 = (await p.結果を読む()).行;
  });
  await step(4, async () => { csv = await CSVを取得する(page); });
  let 行: string[][] = [];
  await step(5, async () => { 行 = データ行(csv); });
  await expected(async () => {
    const 期待 = Array.from({ length: 11 }, (_, i) => {
      const n = String(i + 1).padStart(2, "0");
      return [rc(`LIMIT-${n}-007`), `表示件数確認・商品${n}`, String((i + 1) * 100), "1", String((i + 1) * 100), "1"];
    });
    expect.soft(画面.length, "一覧に表示されたのは10行（件数10）").toBe(10);
    expect.soft(csv, "CSVが1ファイルダウンロードされる").not.toBeNull();
    expect.soft(行, "商品コードLIMIT-01-007～LIMIT-11-007の11行すべてが重複および欠落なく出力される").toEqual(期待);
  });
});

// ---------------------------------------------------------------- 008・009 並べ替え

function 並べ替えの確かめ(seed: string, n: string, 並び順: "昇順" | "降順", 期待: Record<string, string[]>) {
  return async ({ page, step, expected }: Ctx) => {
    await loginAdmin(page, M1204_ADMIN);
    const info = データ情報を読む(seed);
    const p = new SalesAnalysisPage(page);
    const 結果: Record<string, string[]> = {};
    await step(1, async () => { await p.open(); });
    await step(2, async () => { await p.通販を選ぶ(false); await p.店舗だけを選ぶ([TC東京]); });
    await step(3, async () => {
      note(年の注記(info.年));
      await p.条件を入れる({ キーワード: "並べ替え確認", 集計単位: "商品", 並び順 }, info.年);
      await 期間を入れる(p, "2026/09/01 00:00:00", "2026/10/01 00:00:00", info.年);
    });
    await step(4, async () => {
      for (const 項目 of ["集計単位", "注文数", "金額", "販売数"]) {
        await p.条件を入れる({ 並び替え項目: 項目 }, info.年);
        await p.検索する();
        const csv = await CSVを取得する(page);
        結果[項目] = データ行(csv).map((r) => r[0]);
      }
    });
    await expected(async () => {
      for (const 項目 of ["集計単位", "注文数", "金額", "販売数"]) {
        expect.soft(結果[項目], `並び替え(項目)が${項目}（${並び順}）のときのCSVの商品コード順`).toEqual(期待[項目].map((c) => rc(c)));
      }
    });
    void n;
  };
}

caseTest("IT-M12-04-008", 並べ替えの確かめ("S-M12-04-SORT-008", "008", "昇順", {
  集計単位: ["SORT-A-008", "SORT-B-008", "SORT-C-008"],
  注文数: ["SORT-A-008", "SORT-B-008", "SORT-C-008"],
  金額: ["SORT-C-008", "SORT-A-008", "SORT-B-008"],
  販売数: ["SORT-B-008", "SORT-C-008", "SORT-A-008"],
}));
caseTest("IT-M12-04-009", 並べ替えの確かめ("S-M12-04-SORT-009", "009", "降順", {
  集計単位: ["SORT-C-009", "SORT-B-009", "SORT-A-009"],
  注文数: ["SORT-C-009", "SORT-B-009", "SORT-A-009"],
  金額: ["SORT-B-009", "SORT-A-009", "SORT-C-009"],
  販売数: ["SORT-A-009", "SORT-C-009", "SORT-B-009"],
}));

// ---------------------------------------------------------------- 017・018・023〜026 通販・店舗・二重計上の判定

const 判定 = (n: string, 商品: number, 平均: number, 数量: number, 件数 = 1): 行の期待 =>
  ({ c: `M1204-CB${n}-0${商品}`, 名: `M1204-CB${n}-判定0${商品}`, 平均, 数量, 合計: 平均 * 数量, 件数 });
const 判定の定め = (n: string, seed: string, v: { 通販: boolean; 店舗: ("TC東京" | "大阪")[]; 並び替え項目: string; 並び順: "昇順" | "降順"; 期待: 行の期待[]; 説明: string }): 定め => ({
  seed, 全選択して全解除: true, キーワード: `M1204-CB${n}-判定`, 期間: ["2026/12/01 00:00:00", "2027/01/01 00:00:00"], ...v,
});

caseTest("IT-M12-04-017", 商品のCSVの確かめ(判定の定め("017", "S-M12-04-CBMULTIHAND-017", {
  通販: true, 店舗: ["TC東京", "大阪"], 並び替え項目: "集計単位", 並び順: "昇順",
  期待: [判定("017", 1, 100, 2), 判定("017", 2, 100, 3), 判定("017", 3, 100, 1)],
  説明: "データ行が商品コード01・02・03の順に3行だけ出力される（引渡し済みで統合先のある受注の数量4は含まれない）",
})));
caseTest("IT-M12-04-018", 商品のCSVの確かめ(判定の定め("018", "S-M12-04-CBONESTORE-018", {
  通販: true, 店舗: ["TC東京"], 並び替え項目: "集計単位", 並び順: "昇順",
  期待: [判定("018", 1, 100, 1), 判定("018", 2, 100, 2)],
  説明: "データ行が商品コード01・02の順に2行だけ出力される（大阪店の受注は含まれない）",
})));
caseTest("IT-M12-04-023", 商品のCSVの確かめ(判定の定め("023", "S-M12-04-CBNOTSUHAN-023", {
  通販: false, 店舗: ["TC東京"], 並び替え項目: "注文数", 並び順: "降順",
  期待: [判定("023", 2, 100, 3, 2), 判定("023", 3, 100, 1)],
  説明: "データ行が商品コード02（件数2）・03の順に2行だけ出力される（通販の宅配便の受注と大阪店の受注は含まれない）",
})));
caseTest("IT-M12-04-024", 商品のCSVの確かめ(判定の定め("024", "S-M12-04-CBONEAMT-024", {
  通販: true, 店舗: ["TC東京"], 並び替え項目: "金額", 並び順: "昇順",
  期待: [判定("024", 3, 150, 1), 判定("024", 1, 100, 2), 判定("024", 2, 300, 1)],
  説明: "データ行が金額の昇順（商品コード03・01・02）の3行だけ出力される（大阪店の受注は含まれない）",
})));
caseTest("IT-M12-04-025", 商品のCSVの確かめ(判定の定め("025", "S-M12-04-CBONEQTY-025", {
  通販: true, 店舗: ["TC東京"], 並び替え項目: "販売数", 並び順: "昇順",
  期待: [判定("025", 2, 100, 1), 判定("025", 3, 100, 2), 判定("025", 1, 100, 3)],
  説明: "データ行が販売数の昇順（商品コード02・03・01）の3行だけ出力される（大阪店の受注は含まれない）",
})));
caseTest("IT-M12-04-026", 商品のCSVの確かめ(判定の定め("026", "S-M12-04-CBNOTSUHANHAND-026", {
  通販: false, 店舗: ["TC東京"], 並び替え項目: "集計単位", 並び順: "昇順",
  期待: [判定("026", 1, 100, 2), 判定("026", 2, 100, 1)],
  説明: "データ行が商品コード01・02の順に2行だけ出力される（通販の宅配便の受注・大阪店の受注・引渡し済みで統合先のある受注は含まれない）",
})));
