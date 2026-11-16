/**
 * M12-06 入荷通知依頼 CSV出力（IT-M12-06-003〜009・015〜021）。ケースの正本: integration_test/casegen/cases/M12-06_test_cases.tsv
 * シードの作り方（画面で作り、依頼日時などだけDBで設定）: seeds/m12-06.ts。CSVの列は「商品ID・言語ID・商品名・通知待ち・通知済み/削除」。
 */
import { Page, test } from "@playwright/test";
import { 商品名を更新する } from "../../db/m12_06";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { CSVの内容を画面の枠に出す, CSVの枠のセル, CSVの枠の列 } from "../../lib/evidence_other";
import { loginAdmin } from "../../lib/session";
import { ProductRequestPage } from "../../pages/admin/m12_analysis";
import { 商品名 } from "../../seeds/m12-05-requests";
import { M1206_ADMIN, 名前006 } from "../../seeds/m12-06";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 見出し = ["商品ID", "言語ID", "商品名", "通知待ち", "通知済み/削除"];

type 行 = { 商品ID: string; 言語ID: string; 商品名: string; 通知待ち: string; 削除: string };
/** CSVの見出しの次からの行（データ行） */
const データ行 = (csv: string[][]): 行[] => csv.slice(1).map((r) => ({ 商品ID: r[0] ?? "", 言語ID: r[1] ?? "", 商品名: r[2] ?? "", 通知待ち: r[3] ?? "", 削除: r[4] ?? "" }));

/** 手順の注記（検索語は、商品名の「検索語＋実行の印」） */
function 印の注記(): void {
  note("検索語・商品名には、実行の印（実行ごとの識別）が付く。商品名は「正本の商品名＋印」のあとに、正本の名前の残り（01 など）を続けた形で比べた。");
}

async function 開く(page: Parameters<typeof loginAdmin>[0]): Promise<ProductRequestPage> {
  await loginAdmin(page, M1206_ADMIN);
  return new ProductRequestPage(page);
}

/** ダウンロードしたCSV（複数も可）の内容を画面の枠に書き出して残す。続く確かめはこの枠のセルで行い、赤枠がCSVの値に付く */
async function CSVを枠に出す(page: Page, ...表: { 題: string; csv: string[][] }[]): Promise<void> {
  await CSVの内容を画面の枠に出す(page, 表.map((x) => ({ 題: x.題, 行: x.csv })));
}

/** 1商品の行の確かめ（ちょうど1行・商品ID・言語ID・商品名・件数）。値はCSVの枠のセルで確かめる（枠は表 番の CSV） */
async function 行を確かめる(page: Page, rows: 行[], e: { id: string; 名前: string; 通知待ち: string; 削除: string; 見出し: string }, 表 = 0): Promise<void> {
  const i = rows.findIndex((x) => x.商品ID === e.id);
  expect.soft(i >= 0, `${e.見出し}: 商品ID ${e.id} のデータ行がある`).toBe(true);
  if (i < 0) return;
  await expect.soft(CSVの枠のセル(page, 表, i, "言語ID"), `${e.見出し}: CSVの言語ID`).toHaveText("1");
  await expect.soft(CSVの枠のセル(page, 表, i, "商品名"), `${e.見出し}: CSVの商品名`).toHaveText(e.名前);
  await expect.soft(CSVの枠のセル(page, 表, i, "通知待ち"), `${e.見出し}: CSVの通知待ち`).toHaveText(e.通知待ち);
  await expect.soft(CSVの枠のセル(page, 表, i, "通知済み/削除"), `${e.見出し}: CSVの通知済み/削除`).toHaveText(e.削除);
}

caseTest("IT-M12-06-003", async ({ page, step, notes, expected }) => {
  const p = await 開く(page);
  const id = notes.get("〔商品ID-M1206-003〕");
  let csv: string[][] = [];
  let rows: 行[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.日付を空にしてキーワードを入れる(rc("CSV基本商品")); await p.検索する(); });
  await step(3, async () => { csv = await p.CSVを出力する(); });
  await step(4, async () => { rows = データ行(csv); await CSVを枠に出す(page, { 題: "ダウンロードした入荷通知一覧CSV", csv }); });
  印の注記();
  await expected(async () => {
    expect.soft(csv[0], "CSVの見出し行").toEqual(見出し);
    expect.soft(rows.length, "データ行の数").toBe(1);
    await 行を確かめる(page, rows, { id, 名前: 商品名("CSV基本商品"), 通知待ち: "1", 削除: "0", 見出し: "商品ID 〔商品ID-M1206-003〕" });
  });
});

caseTest("IT-M12-06-004", async ({ page, step, notes, expected }) => {
  const p = await 開く(page);
  const id = notes.get("〔商品ID-M1206-004〕");
  let csv: string[][] = [];
  let rows: 行[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.日付を空にしてキーワードを入れる(rc("CSV通知待ち集計")); await p.検索する(); });
  await step(3, async () => { csv = await p.CSVを出力する(); });
  await step(4, async () => { rows = データ行(csv).filter((r) => r.商品ID === id); await CSVを枠に出す(page, { 題: "ダウンロードした入荷通知一覧CSV", csv }); });
  印の注記();
  await expected(async () => {
    expect.soft(rows.length, "商品ID 〔商品ID-M1206-004〕のデータ行の数").toBe(1);
    expect.soft(rows[0]?.通知待ち, "同じ会員が異なる2規格へ登録した通知待ち依頼が規格ごとに数えられず、通知待ちが1").toBe("1");
  });
});

caseTest("IT-M12-06-005", async ({ page, step, notes, expected }) => {
  const p = await 開く(page);
  const idA = notes.get("〔商品ID-M1206-005A〕");
  const idB = notes.get("〔商品ID-M1206-005B〕");
  let csvA: string[][] = [];
  let csvB: string[][] = [];
  let a: 行[] = [];
  let b: 行[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.日付を空にしてキーワードを入れる(rc("CSV通知済集計")); await p.検索する(); });
  await step(3, async () => { csvA = await p.CSVを出力する(); });
  await step(4, async () => { await p.キーワード.fill(rc("CSV取消集計"), { timeout: 20_000 }); await p.検索する(); });
  await step(5, async () => { csvB = await p.CSVを出力する(); });
  await step(6, async () => { a = データ行(csvA); b = データ行(csvB); await CSVを枠に出す(page, { 題: "1つ目にダウンロードしたCSV（CSV通知済集計）", csv: csvA }, { 題: "2つ目にダウンロードしたCSV（CSV取消集計）", csv: csvB }); });
  印の注記();
  note("「通知済み」の依頼は、通知バッチが送るもので画面からは作れない。取り消した依頼と同じ形（削除日時あり）で作った。");
  await expected(async () => {
    expect.soft(a.length, "「CSV通知済集計」のCSVのデータ行の数").toBe(1);
    expect.soft(b.length, "「CSV取消集計」のCSVのデータ行の数").toBe(1);
    await expect.soft(CSVの枠のセル(page, 0, 0, "商品ID"), "1つ目のCSVの商品ID 〔商品ID-M1206-005A〕").toHaveText(idA);
    await expect.soft(CSVの枠のセル(page, 1, 0, "商品ID"), "2つ目のCSVの商品ID 〔商品ID-M1206-005B〕").toHaveText(idB);
    await expect.soft(CSVの枠のセル(page, 0, 0, "通知済み/削除"), "1つ目のCSVの通知済み/削除が1（商品ID 〔商品ID-M1206-005A〕。異なる2規格の依頼が規格ごとに数えられない）").toHaveText("1");
    await expect.soft(CSVの枠のセル(page, 1, 0, "通知済み/削除"), "2つ目のCSVの通知済み/削除が1（商品ID 〔商品ID-M1206-005B〕。異なる2規格の依頼が規格ごとに数えられない）").toHaveText("1");
  });
});

caseTest("IT-M12-06-006", async ({ page, step, notes, expected }) => {
  const p = await 開く(page);
  const idA = notes.get("〔商品ID-M1206-006A〕");
  const idB = notes.get("〔商品ID-M1206-006B〕");
  let csv: string[][] = [];
  let rows: 行[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.日付を空にしてキーワードを入れる(rc(名前006.対象)); await p.検索する(); });
  await step(3, async () => { csv = await p.CSVを出力する(); });
  await step(4, async () => { rows = データ行(csv); await CSVを枠に出す(page, { 題: "ダウンロードした入荷通知一覧CSV", csv }); });
  印の注記();
  note("検索語「CSV対象商品」は M12-05 のシードも使う語なので、取り違えないよう商品名・検索語を「CSV対象商品-M1206」＋印の形にした。");
  await expected(async () => {
    const ids = rows.map((r) => r.商品ID);
    expect.soft(ids, "保持した検索条件を満たす商品ID 〔商品ID-M1206-006A〕の行が出力される").toContain(idA);
    expect.soft(ids, "商品ID 〔商品ID-M1206-006B〕の行が含まれない").not.toContain(idB);
    expect.soft(rows.length, "出力されるデータ行は1行だけ").toBe(1);
  });
});

caseTest("IT-M12-06-007", async ({ page, step, notes, expected }) => {
  const p = await 開く(page);
  let 一覧: string[] = [];
  let csvIds: string[] = [];
  let csv: string[][] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.日付を空にしてキーワードを入れる(rc("CSV順序比較")); await p.検索する(); });
  await step(3, async () => { 一覧 = (await p.結果の行()).map((r) => r.商品ID); });
  await step(4, async () => { csv = await p.CSVを出力する(); });
  await step(5, async () => { csvIds = データ行(csv).map((r) => r.商品ID); await CSVを枠に出す(page, { 題: "ダウンロードした入荷通知一覧CSV", csv }); });
  印の注記();
  await expected(async () => {
    expect.soft(一覧.length, "検索結果一覧の行数（商品3件）").toBe(3);
    for (const x of ["A", "B", "C"]) expect.soft(一覧, `検索結果一覧に商品ID 〔商品ID-M1206-007${x}〕がある`).toContain(notes.get(`〔商品ID-M1206-007${x}〕`));
    expect.soft(csvIds, "CSVのデータ行が、検索結果一覧と同じ商品IDの並び順").toEqual(一覧);
  });
});

caseTest("IT-M12-06-008", async ({ page, step, expected }) => {
  const p = await 開く(page);
  let csv: string[][] = [];
  let rows: 行[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.日付を空にしてキーワードを入れる(rc("CSV表示件数商品")); });
  await step(3, async () => { await p.表示件数を選ぶ("10"); await p.検索する(); });
  await step(4, async () => { csv = await p.CSVを出力する(); });
  await step(5, async () => { rows = データ行(csv); await CSVを枠に出す(page, { 題: "ダウンロードした入荷通知一覧CSV", csv }); });
  印の注記();
  note("会員は、シード表の人数でなく1人が11商品へ依頼した形にした（会員の数が結果に効かないため）。");
  await expected(async () => {
    expect.soft(rows.length, "表示件数として指定した10を上限としたデータ行の数（対象は11件）").toBe(10);
    // 10行が「CSV表示件数商品01〜11」の行であること（ほかの商品の行で10行になっていない）
    const names = new Set(Array.from({ length: 11 }, (_, i) => 商品名("CSV表示件数商品", String(i + 1).padStart(2, "0"))));
    expect.soft(rows.filter((r) => !names.has(r.商品名)).map((r) => r.商品名), "「CSV表示件数商品01〜11」以外の行が無い").toEqual([]);
    expect.soft(new Set(rows.map((r) => r.商品ID)).size, "10行は重複のない10商品").toBe(10);
  });
});

caseTest("IT-M12-06-009", async ({ page, step, notes, expected }) => {
  const p = await 開く(page);
  const id = notes.get("〔商品ID-M1206-009〕");
  let csv: string[][] = [];
  let リンク数 = 0;
  let 全行 = 0;
  let 一覧: string[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.日付を空にしてキーワードを入れる(rc("CSVゼロ件切替対象")); await p.検索する(); });
  await step(3, async () => { リンク数 = await p.CSVリンク.count(); 一覧 = (await p.結果の行()).map((r) => r.商品ID); });
  await step(4, async () => { 商品名を更新する(id, rc("出力対象外Z")); });
  await step(5, async () => { csv = await p.CSVを出力する(); });
  await step(6, async () => { 全行 = csv.length; await CSVを枠に出す(page, { 題: "ダウンロードした入荷通知一覧CSV", csv }); });
  印の注記();
  await expected(async () => {
    expect.soft(リンク数, "検索結果に入荷通知一覧CSV出力リンクが表示されている（件数）").toBeGreaterThan(0);
    // 商品名を変える前は、検索結果に対象の商品が出ていたこと（はじめから0件なら、見出し行だけでも確かめにならない）
    expect.soft(一覧, "手順3の検索結果に商品ID 〔商品ID-M1206-009〕の行がある").toContain(id);
    expect.soft(全行, "CSVの全行の数（見出し行だけ）").toBe(1);
    expect.soft(csv[0], "CSVの見出し行").toEqual(見出し);
  });
});

caseTest("IT-M12-06-015", async ({ page, step, notes, expected }) => {
  const p = await 開く(page);
  let csv: string[][] = [];
  let rows: 行[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.日付を空にしてキーワードを入れる(rc("CSV混在-M1206-015")); await p.検索する(); });
  await step(3, async () => { csv = await p.CSVを出力する(); });
  await step(4, async () => { rows = データ行(csv); await CSVを枠に出す(page, { 題: "ダウンロードした入荷通知一覧CSV", csv }); });
  印の注記();
  await expected(async () => {
    expect.soft(rows.length, "出力されるデータ行は2行だけ").toBe(2);
    await 行を確かめる(page, rows, { id: notes.get("〔商品ID-M1206-015A〕"), 名前: 商品名("CSV混在-M1206-015", " 未削除"), 通知待ち: "1", 削除: "0", 見出し: "商品ID 〔商品ID-M1206-015A〕（未削除）" });
    await 行を確かめる(page, rows, { id: notes.get("〔商品ID-M1206-015B〕"), 名前: 商品名("CSV混在-M1206-015", " 削除済"), 通知待ち: "0", 削除: "1", 見出し: "商品ID 〔商品ID-M1206-015B〕（削除済）" });
  });
});

caseTest("IT-M12-06-016", async ({ page, step, notes, expected }) => {
  const p = await 開く(page);
  const holder: { csv: string[][] } = { csv: [] };
  let rows: 行[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.日付を空にしてキーワードを入れる(rc("組合せCSV商品単位待ち")); });
  await step(3, async () => { await p.検索する(); });
  await step(4, async () => { holder.csv = await p.CSVを出力する(); });
  await step(5, async () => { rows = データ行(holder.csv); await CSVを枠に出す(page, { 題: "ダウンロードした入荷通知一覧CSV", csv: holder.csv }); });
  印の注記();
  await expected(async () => {
    expect.soft(rows.length, "データ行は1行だけ").toBe(1);
    await 行を確かめる(page, rows, { id: notes.get("〔商品ID-M1206-016〕"), 名前: 商品名("組合せCSV商品単位待ち"), 通知待ち: "1", 削除: "0", 見出し: "商品ID 〔商品ID-M1206-016〕（商品単位の通知待ち）" });
  });
});

/** 10行（11商品のうち1商品の行は出ない）の確かめ。名前の接頭辞 base、商品の番号は 01〜11 */
async function 十行を確かめる(page: Page, rows: 行[], v: { base: string; ラベル: string; 通知待ち: string; 削除: string }, notes: { get(k: string): string }): Promise<void> {
  expect.soft(rows.length, "データ行の数").toBe(10);
  await expect.soft(CSVの枠の列(page, 0, "通知待ち"), `CSVの10行のすべてで通知待ちが「${v.通知待ち}」`).toHaveText(Array(10).fill(v.通知待ち));
  await expect.soft(CSVの枠の列(page, 0, "通知済み/削除"), `CSVの10行のすべてで通知済み/削除が「${v.削除}」`).toHaveText(Array(10).fill(v.削除));
  const all = Array.from({ length: 11 }, (_, i) => String(i + 1).padStart(2, "0"));
  const names = new Set(all.map((n) => 商品名(v.base, n)));
  const ids = new Set(all.map((n) => notes.get(`〔商品ID-M1206-${v.ラベル}-${n}〕`)));
  expect.soft(rows.every((r) => names.has(r.商品名) && ids.has(r.商品ID)), "10行はすべて11商品（01〜11）のどれかの行").toBe(true);
  expect.soft(new Set(rows.map((r) => r.商品ID)).size, "11商品のうち出力されるのは重複のない10商品で、1商品の行は出力されない").toBe(10);
  expect.soft(rows.every((r) => r.言語ID === "1"), "10行のすべてで言語IDが「1」").toBe(true);
}

type 十行の本体の引数 = Parameters<Parameters<typeof caseTest>[1]>[0];
function 十行の本体(kw: string, v: { base: string; ラベル: string; 通知待ち: string; 削除: string }, 注記: string) {
  return async ({ page, step, notes, expected }: 十行の本体の引数) => {
    const p = await 開く(page);
    let csv: string[][] = [];
    let rows: 行[] = [];
    await step(1, async () => { await p.open(); });
    await step(2, async () => { await p.日付を空にしてキーワードを入れる(rc(kw)); });
    await step(3, async () => { await p.表示件数を選ぶ("10"); await p.検索する(); });
    await step(4, async () => { csv = await p.CSVを出力する(); });
    await step(5, async () => { rows = データ行(csv); await CSVを枠に出す(page, { 題: "ダウンロードした入荷通知一覧CSV", csv }); });
    印の注記();
    note(注記);
    await expected(async () => {
      expect.soft(rows.length, "データ行が10行出力される").toBe(10);
      await 十行を確かめる(page, rows, v, notes);
    });
  };
}

caseTest("IT-M12-06-017", 十行の本体("組合せCSV商品単位削除", { base: "組合せCSV商品単位削除", ラベル: "017", 通知待ち: "0", 削除: "2" }, "商品単位（規格を指さない）の依頼は画面で作れないので、会員2人の削除済みの依頼を DB で足した。"));

caseTest("IT-M12-06-018", async ({ page, step, notes, expected }) => {
  const p = await 開く(page);
  let csv: string[][] = [];
  let rows: 行[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.日付を空にしてキーワードを入れる(rc("組合せCSV単一規格複数待ち")); });
  await step(3, async () => { await p.検索する(); });
  await step(4, async () => { csv = await p.CSVを出力する(); });
  await step(5, async () => { rows = データ行(csv); await CSVを枠に出す(page, { 題: "ダウンロードした入荷通知一覧CSV", csv }); });
  印の注記();
  await expected(async () => {
    expect.soft(rows.length, "データ行は1行だけ").toBe(1);
    await 行を確かめる(page, rows, { id: notes.get("〔商品ID-M1206-018〕"), 名前: 商品名("組合せCSV単一規格複数待ち"), 通知待ち: "2", 削除: "0", 見出し: "商品ID 〔商品ID-M1206-018〕（会員2人の通知待ち）" });
  });
});

caseTest("IT-M12-06-019", 十行の本体("組合せCSV単一規格削除", { base: "組合せCSV単一規格削除", ラベル: "019", 通知待ち: "0", 削除: "1" }, "会員1人が11商品へ依頼した削除済みの依頼のうち、1件目は画面（通知ボタンを2回押す）、残りは DB で足した。"));
caseTest("IT-M12-06-020", 十行の本体("組合せCSV複数規格待ち", { base: "組合せCSV複数規格待ち", ラベル: "020", 通知待ち: "2", 削除: "0" }, "11商品の通知待ちは、1商品目だけ画面（通知ボタン）、残りは DB で足した。入荷通知最大数の設定は書き換えていない。"));

caseTest("IT-M12-06-021", async ({ page, step, notes, expected }) => {
  const p = await 開く(page);
  let csv: string[][] = [];
  let rows: 行[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.日付を空にしてキーワードを入れる(rc("組合せCSV複数規格削除")); });
  await step(3, async () => { await p.検索する(); });
  await step(4, async () => { csv = await p.CSVを出力する(); });
  await step(5, async () => { rows = データ行(csv); await CSVを枠に出す(page, { 題: "ダウンロードした入荷通知一覧CSV", csv }); });
  印の注記();
  await expected(async () => {
    expect.soft(rows.length, "データ行は1行だけ").toBe(1);
    await 行を確かめる(page, rows, { id: notes.get("〔商品ID-M1206-021〕"), 名前: 商品名("組合せCSV複数規格削除"), 通知待ち: "0", 削除: "1", 見出し: "商品ID 〔商品ID-M1206-021〕（複数規格の削除済み）" });
  });
});
