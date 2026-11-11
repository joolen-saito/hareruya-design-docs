/**
 * M05-05 受注詳細カスタムCSV出力（続き）。正本: cases/M05-05_test_cases.tsv
 * 2026-11-10（依頼者の承認「印つきデータは何でも」）: 使用シードの投入方法に「DBへ直接設定する」を含むため実装していなかったケースを、
 * DB への書き込みを使うシード（seeds/m05-05-db.ts。画面で作った印つきの受注を写し、印つきの行だけを整える）で作って実装する。
 * 注文番号は11文字までの列なので、シード表の決め打ちの番号は実行ごとの接頭辞つきの値に読み替える（手順の入力も同じ値）。
 * 実装しないケース: 003（出力項目自体の表示順は共有のマスタで、前提を作れない）・024（項目表に無い種別・項目名の行を作るには共有のマスタに足す）・
 * 026（配送CSVに複数参照の項目が無く、区切り文字は共有の設定）。記録は e2e/review/M05-05_progress_2026-11-11.md。
 */
import { test } from "@playwright/test";
import { getCase } from "../../lib/catalog";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { 受注と定義の記録 } from "../../db/m05_05_write";
import { OrderSearchPage } from "../../pages/admin/m05_01_order_search_k";
import { OrderCsvPage, ダウンロード結果 } from "../../pages/admin/m05_05_custom_csv";
import { 注文番号の読み替え } from "../../seeds/m05-01";
import { M0505_ADMIN, 定義名 } from "../../seeds/m05-05";
import { M0505_ADMIN_三販路, M0505値 } from "../../seeds/m05-05-db";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 見出しの名前の列の、データ行の値（見出しが無ければ位置 -1） */
function 列(r: ダウンロード結果 | undefined, 見出し: string): { 位置: number; 値: string[] } {
  const i = (r?.行[0] ?? []).indexOf(見出し);
  return { 位置: i, 値: i >= 0 ? (r?.行 ?? []).slice(1).map((x) => x[i] ?? "") : [] };
}

/** 1つ以上の値が1回ずつ出る（出力の有無と行数） */
const 行数 = (値: string[], 番号: string): number => 値.filter((v) => v === 番号).length;

caseTest("IT-M05-05-001", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0505_ADMIN);
  const csv = new OrderCsvPage(page);
  let r: ダウンロード結果 | undefined;
  const 期待の見出し = [...(/見出し行が(.*?)の75列/.exec(getCase("IT-M05-05-001").期待結果)?.[1] ?? "").matchAll(/「([^」]+)」/g)].map((m) => m[1]);
  await step(1, async () => { await csv.openSearch(); });
  await step(2, async () => { await csv.注文番号で検索する(notes.get("〔注文番号-M0505-001〕")); });
  await step(3, async () => { r = await csv.受注詳細カスタムCSVをダウンロードする(定義名("M0505項目表確認-001")); });
  await step(4, async () => { expect(r?.行.length, "CSVを受け取れた（行数）").toBeGreaterThan(0); });
  await expected(async () => {
    expect.soft(期待の見出し.length, "正本の見出しの列数").toBe(75);
    expect.soft(r?.行[0] ?? [], "見出し行が正本の75列の順").toEqual(期待の見出し);
  });
});

caseTest("IT-M05-05-008", async ({ page, step, expected }) => {
  await loginAdmin(page, M0505_ADMIN_三販路);
  const csv = new OrderCsvPage(page);
  const s = new OrderSearchPage(page);
  const 本店 = 注文番号の読み替え("M0505-008-HQ");
  const 支店 = 注文番号の読み替え("M0505-008-BR");
  const スマレジ = 注文番号の読み替え("M0505-008-SM");
  let r: ダウンロード結果 | undefined;
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await s.choosePattern(rc("M0505三販路-008")); });
  await step(3, async () => { r = await csv.受注詳細カスタムCSVをダウンロードする(定義名("M0505販路確認定義-008")); });
  await step(4, async () => { expect(r?.行.length, "CSVを受け取れた（行数）").toBeGreaterThan(0); });
  await expected(async () => {
    const no = 列(r, "注文番号");
    expect.soft(no.位置, "見出し行に「注文番号」の列がある（位置）").toBeGreaterThanOrEqual(0);
    expect.soft(行数(no.値, 本店), `本店受注 ${本店} の行数`).toBe(1);
    expect.soft(行数(no.値, 支店), `支店受注 ${支店} の行数`).toBe(1);
    expect.soft(行数(no.値, スマレジ), `スマレジ取引 ${スマレジ} の行数`).toBe(1);
  });
});

caseTest("IT-M05-05-009", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0505_ADMIN);
  const csv = new OrderCsvPage(page);
  let r: ダウンロード結果 | undefined;
  await step(1, async () => { await csv.openSearch(); await csv.注文番号で検索する(notes.get("〔注文番号-M0505-009〕")); });
  await step(2, async () => { r = await csv.受注詳細カスタムCSVをダウンロードする(定義名("M0505非会員定義-009")); });
  await step(3, async () => { expect(r?.行.length, "CSVを受け取れた（行数）").toBeGreaterThan(0); });
  await expected(async () => {
    const v = 列(r, "お名前(姓)");
    expect.soft(v.位置, "見出し行に「お名前(姓)」の列がある（位置）").toBeGreaterThanOrEqual(0);
    expect.soft(v.値, "非会員受注のお名前(姓)列に「非会員」").toEqual(["非会員"]);
  });
});

caseTest("IT-M05-05-010", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0505_ADMIN);
  const csv = new OrderCsvPage(page);
  let r: ダウンロード結果 | undefined;
  await step(1, async () => { await csv.openSearch(); await csv.注文番号で検索する(notes.get("〔注文番号-M0505-010〕")); });
  await step(2, async () => { r = await csv.受注詳細カスタムCSVをダウンロードする(定義名("M0505住所3定義-010")); });
  await step(3, async () => { expect(r?.行.length, "CSVを受け取れた（行数）").toBeGreaterThan(0); });
  await expected(async () => {
    const v = 列(r, "住所3");
    expect.soft(v.位置, "見出し行に「住所3」の列がある（位置）").toBeGreaterThanOrEqual(0);
    expect.soft(v.値, "住所3列に「Building 5, Floor 2」").toEqual(["Building 5, Floor 2"]);
  });
});

caseTest("IT-M05-05-011", async ({ page, step, expected }) => {
  await loginAdmin(page, M0505_ADMIN);
  const csv = new OrderCsvPage(page);
  let r: ダウンロード結果 | undefined;
  await step(1, async () => { await csv.openSearch(); await csv.注文番号で検索する(注文番号の読み替え("M0505-011")); });
  await step(2, async () => { r = await csv.受注詳細カスタムCSVをダウンロードする(定義名("M0505刷新追加項目定義-011")); });
  await step(3, async () => {
    expect(r?.行.length, "CSVを受け取れた（行数）").toBeGreaterThan(0);
    note("項目名は、アプリの項目表の名前（取引ID→スマレジ取引ID、メモ→スマレジメモ）で読んだ。取引IDは実行の印つきの値（TRX-…）");
  });
  await expected(async () => {
    const want: [string, string][] = [
      ["店舗ID", "ST-05-011"], ["スマレジ取引ID", M0505値.get("取引ID-011") ?? ""], ["小計値引き/割引区分", "クーポン"],
      ["クーポン値引き", "500"], ["スマレジメモ", "店頭取引メモ"], ["免税額", "800"],
    ];
    for (const [名, 値] of want) {
      const v = 列(r, 名);
      expect.soft(v.位置, `見出し行に「${名}」の列がある（位置）`).toBeGreaterThanOrEqual(0);
      expect.soft(v.値, `「${名}」列の値`).toEqual([値]);
    }
  });
});

caseTest("IT-M05-05-013", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0505_ADMIN);
  const csv = new OrderCsvPage(page);
  const 購入処理中 = 注文番号の読み替え("M0505-013-P");
  let url = "";
  let r: ダウンロード結果 | undefined;
  await step(1, async () => { await csv.openSearch(); });
  await step(2, async () => {
    url = await csv.定義のダウンロードURL(定義名("M0505基本定義-013"));
    r = await csv.URLを開いてダウンロードする(url);
  });
  await step(3, async () => { expect(r?.行.length, "CSVを受け取れた（行数）").toBeGreaterThan(0); });
  await expected(async () => {
    const no = 列(r, "注文番号").値;
    expect.soft(行数(no, notes.get("〔注文番号-M0505-013A〕")), "購入処理中ではない受注Aの行数").toBe(1);
    expect.soft(行数(no, notes.get("〔注文番号-M0505-013B〕")), "購入処理中ではない受注Bの行数").toBe(1);
    expect.soft(行数(no, 購入処理中), "購入処理中の受注の行数").toBe(0);
  });
});

caseTest("IT-M05-05-014", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0505_ADMIN);
  const csv = new OrderCsvPage(page);
  const s = new OrderSearchPage(page);
  let r: ダウンロード結果 | undefined;
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await s.choosePattern(rc("M0505不正対応状況条件-014")); });
  await step(3, async () => { r = await csv.受注詳細カスタムCSVをダウンロードする(定義名("M0505基本定義-014")); });
  await step(4, async () => { expect(r?.行.length, "CSVを受け取れた（行数）").toBeGreaterThan(0); });
  await expected(async () => {
    const no = 列(r, "注文番号").値;
    expect.soft(行数(no, notes.get("〔注文番号-M0505-014〕")), "注文番号条件で抽出された受注の行数（対応状況ID 999999 に影響されない）").toBe(1);
  });
});

caseTest("IT-M05-05-015", async ({ page, step, expected }) => {
  await loginAdmin(page, M0505_ADMIN);
  const csv = new OrderCsvPage(page);
  const s = new OrderSearchPage(page);
  let r: ダウンロード結果 | undefined;
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await s.choosePattern(rc("M0505ページ確認-015")); });
  await step(3, async () => { await s.selectPageCount("10件"); });
  await step(4, async () => { await s.goToPage(2); });
  await step(5, async () => { r = await csv.受注詳細カスタムCSVをダウンロードする(定義名("M0505基本定義-015")); });
  await step(6, async () => { expect(r?.行.length, "CSVを受け取れた（行数）").toBeGreaterThan(0); });
  await expected(async () => {
    const 期待 = Array.from({ length: 11 }, (_, i) => 注文番号の読み替え(`M0505-015-${String(i + 1).padStart(2, "0")}`));
    const no = 列(r, "注文番号").値;
    expect.soft(no.length, "データ行の行数（11受注が重複・欠落なく）").toBe(11);
    expect.soft([...no].sort(), "出力された注文番号の組").toEqual([...期待].sort());
  });
});

caseTest("IT-M05-05-017", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0505_ADMIN);
  const csv = new OrderCsvPage(page);
  const s = new OrderSearchPage(page);
  let r: ダウンロード結果 | undefined;
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await s.choosePattern(rc("M0505連続重複-017")); });
  await step(3, async () => { r = await csv.受注詳細カスタムCSVをダウンロードする(定義名("M0505基本定義-017")); });
  await step(4, async () => { expect(r?.行.length, "CSVを受け取れた（行数）").toBeGreaterThan(0); });
  await expected(async () => {
    expect.soft(行数(列(r, "注文番号").値, notes.get("〔注文番号-M0505-017〕")), "明細2件の受注の行数").toBe(1);
  });
});

caseTest("IT-M05-05-018", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0505_ADMIN);
  const csv = new OrderCsvPage(page);
  let r: ダウンロード結果 | undefined;
  await step(1, async () => { await csv.openSearch(); await csv.注文番号で検索する(notes.get("〔注文番号-M0505-018〕")); });
  await step(2, async () => { r = await csv.受注詳細カスタムCSVをダウンロードする(定義名("M0505配送先定義-018")); });
  await step(3, async () => { expect(r?.行.length, "CSVを受け取れた（行数）").toBeGreaterThan(0); });
  await expected(async () => {
    const no = 列(r, "注文番号").値;
    const sei = 列(r, "配送先_お名前(姓)").値;
    expect.soft(no, "受注の注文番号が2行").toEqual([notes.get("〔注文番号-M0505-018〕"), notes.get("〔注文番号-M0505-018〕")]);
    expect.soft([...sei].sort(), "配送先のお名前(姓)が「第一配送先」「第二配送先」の2行").toEqual(["第一配送先", "第二配送先"]);
  });
});

caseTest("IT-M05-05-019", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0505_ADMIN);
  const csv = new OrderCsvPage(page);
  let r: ダウンロード結果 | undefined;
  await step(1, async () => { await csv.openSearch(); await csv.注文番号で検索する(notes.get("〔注文番号-M0505-019〕")); });
  await step(2, async () => { r = await csv.受注詳細カスタムCSVをダウンロードする(定義名("M0505配送先定義-019")); });
  await step(3, async () => { expect(r?.行.length, "CSVを受け取れた（行数）").toBeGreaterThan(0); });
  await expected(async () => {
    expect.soft(r?.行 ?? [], "配送先を持たない受注のデータ行が出力されず、見出し行だけ").toEqual([["注文番号", "配送先_お名前(姓)"]]);
  });
});

caseTest("IT-M05-05-023", async ({ page, step, expected }) => {
  await loginAdmin(page, M0505_ADMIN);
  const csv = new OrderCsvPage(page);
  let r: ダウンロード結果 | undefined;
  await step(1, async () => { await csv.openSearch(); await csv.注文番号で検索する(注文番号の読み替え("05050063-023")); });
  await step(2, async () => { r = await csv.受注詳細カスタムCSVをダウンロードする(定義名("M0505受注配送値定義-023")); });
  await step(3, async () => {
    expect(r?.行.length, "CSVを受け取れた（行数）").toBeGreaterThan(0);
    note("受注から取得できる列=「ショップ用メモ欄」、配送先から取得できる列=「配送先_お名前(姓)」、どちらからも取得できない列=「会社名」（空）に読み替えた");
  });
  await expected(async () => {
    expect.soft(r?.行[0] ?? [], "見出し行").toEqual(["ショップ用メモ欄", "配送先_お名前(姓)", "会社名"]);
    expect.soft(r?.行.slice(1) ?? [], "データ行（受注値・配送値・空欄）").toEqual([["受注値", "配送値", ""]]);
  });
});

caseTest("IT-M05-05-025", async ({ page, step, expected }) => {
  await loginAdmin(page, M0505_ADMIN);
  const csv = new OrderCsvPage(page);
  let r: ダウンロード結果 | undefined;
  await step(1, async () => { await csv.openSearch(); await csv.注文番号で検索する(注文番号の読み替え("05050064-025")); });
  await step(2, async () => { r = await csv.受注詳細カスタムCSVをダウンロードする(定義名("M0505単一参照定義-025")); });
  await step(3, async () => {
    expect(r?.行.length, "CSVを受け取れた（行数）").toBeGreaterThan(0);
    note("他データを1件参照する列は「会員ID」。参照先の指定項目値「参照先値A」は、参照先の会員の番号に読み替えた");
  });
  await expected(async () => {
    const v = 列(r, "会員ID");
    expect.soft(v.位置, "見出し行に参照値の列「会員ID」がある（位置）").toBeGreaterThanOrEqual(0);
    expect.soft(v.値, "参照先の指定項目値が出力される").toEqual([M0505値.get("会員ID-025") ?? ""]);
  });
});

caseTest("IT-M05-05-028", async ({ page, step, expected }) => {
  await loginAdmin(page, M0505_ADMIN);
  const csv = new OrderCsvPage(page);
  let r: ダウンロード結果 | undefined;
  await step(1, async () => { await csv.openSearch(); await csv.注文番号で検索する(注文番号の読み替え("05050066-028")); });
  await step(2, async () => { r = await csv.受注詳細カスタムCSVをダウンロードする(定義名("M0505スカラ値定義-028")); });
  await step(3, async () => {
    expect(r?.行.length, "CSVを受け取れた（行数）").toBeGreaterThan(0);
    note("スカラ値の列は「ショップ用メモ欄」に読み替えた");
  });
  await expected(async () => {
    const v = 列(r, "ショップ用メモ欄");
    expect.soft(v.位置, "見出し行に「ショップ用メモ欄」の列がある（位置）").toBeGreaterThanOrEqual(0);
    expect.soft(v.値, "取得元と同じ値で出力される").toEqual(["原文値123"]);
  });
});

caseTest("IT-M05-05-032", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0505_ADMIN);
  const csv = new OrderCsvPage(page);
  const 受注ID = notes.get("〔注文ID-M0505-032〕");
  const 定義ID = notes.get("〔定義ID-M0505-032〕");
  let 前 = "";
  let 後 = "";
  let r: ダウンロード結果 | undefined;
  await step(1, async () => { 前 = 受注と定義の記録(受注ID, 定義ID); expect(前.length, "記録した値").toBeGreaterThan(0); });
  await step(2, async () => { await csv.openSearch(); await csv.注文番号で検索する(notes.get("〔注文番号-M0505-032〕")); });
  await step(3, async () => { r = await csv.受注詳細カスタムCSVをダウンロードする(定義名("M0505基本定義-032")); });
  await step(4, async () => {
    expect(r?.行.length, "CSVを受け取れた（行数）").toBeGreaterThan(0);
    後 = 受注と定義の記録(受注ID, 定義ID);
  });
  await expected(async () => {
    expect.soft(後, "受注・受注明細・配送先・カスタムCSV定義の値・件数・更新日時がCSV出力前から変更されない").toBe(前);
  });
});
