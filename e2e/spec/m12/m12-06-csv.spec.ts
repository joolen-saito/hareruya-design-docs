/**
 * M12-06 入荷通知依頼 CSV出力（IT-M12-06-003〜009・015〜021）。ケースの正本: integration_test/casegen/cases/M12-06_test_cases.tsv
 * シードの作り方（画面で作り、依頼日時などだけDBで設定）: seeds/m12-06.ts。CSVの列は「商品ID・言語ID・商品名・通知待ち・通知済み/削除」。
 */
import { test } from "@playwright/test";
import { 商品名を更新する } from "../../db/m12_06";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
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

/** 1商品の行の確かめ（ちょうど1行・商品ID・言語ID・商品名・件数） */
function 行を確かめる(rows: 行[], e: { id: string; 名前: string; 通知待ち: string; 削除: string; 見出し: string }): void {
  const r = rows.find((x) => x.商品ID === e.id);
  expect.soft(r !== undefined, `${e.見出し}: 商品ID ${e.id} のデータ行がある`).toBe(true);
  if (!r) return;
  expect.soft(r.言語ID, `${e.見出し}: 言語ID`).toBe("1");
  expect.soft(r.商品名, `${e.見出し}: 商品名`).toBe(e.名前);
  expect.soft(r.通知待ち, `${e.見出し}: 通知待ち`).toBe(e.通知待ち);
  expect.soft(r.削除, `${e.見出し}: 通知済み/削除`).toBe(e.削除);
}

caseTest("IT-M12-06-003", async ({ page, step, notes, expected }) => {
  const p = await 開く(page);
  const id = notes.get("〔商品ID-M1206-003〕");
  let csv: string[][] = [];
  let rows: 行[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.日付を空にしてキーワードを入れる(rc("CSV基本商品")); await p.検索する(); });
  await step(3, async () => { csv = await p.CSVを出力する(); });
  await step(4, async () => { rows = データ行(csv); });
  印の注記();
  await expected(async () => {
    expect.soft(csv[0], "CSVの見出し行").toEqual(見出し);
    expect.soft(rows.length, "データ行の数").toBe(1);
    行を確かめる(rows, { id, 名前: 商品名("CSV基本商品"), 通知待ち: "1", 削除: "0", 見出し: "商品ID 〔商品ID-M1206-003〕" });
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
  await step(4, async () => { rows = データ行(csv).filter((r) => r.商品ID === id); });
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
  await step(6, async () => { a = データ行(csvA); b = データ行(csvB); });
  印の注記();
  note("「通知済み」の依頼は、通知バッチが送るもので画面からは作れない。取り消した依頼と同じ形（削除日時あり）で作った。");
  await expected(async () => {
    expect.soft(a.length, "「CSV通知済集計」のCSVのデータ行の数").toBe(1);
    expect.soft(b.length, "「CSV取消集計」のCSVのデータ行の数").toBe(1);
    expect.soft(a[0]?.商品ID, "1つ目のCSVの商品ID 〔商品ID-M1206-005A〕").toBe(idA);
    expect.soft(b[0]?.商品ID, "2つ目のCSVの商品ID 〔商品ID-M1206-005B〕").toBe(idB);
    expect.soft(a[0]?.削除, "商品ID 〔商品ID-M1206-005A〕の通知済み/削除（異なる2規格の依頼が規格ごとに数えられない）").toBe("1");
    expect.soft(b[0]?.削除, "商品ID 〔商品ID-M1206-005B〕の通知済み/削除（異なる2規格の依頼が規格ごとに数えられない）").toBe("1");
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
  await step(4, async () => { rows = データ行(csv); });
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
  await step(5, async () => { csvIds = データ行(csv).map((r) => r.商品ID); });
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
  await step(5, async () => { rows = データ行(csv); });
  印の注記();
  note("会員は、シード表の人数でなく1人が11商品へ依頼した形にした（会員の数が結果に効かないため）。");
  await expected(async () => {
    expect.soft(rows.length, "表示件数として指定した10を上限としたデータ行の数（対象は11件）").toBe(10);
  });
});

caseTest("IT-M12-06-009", async ({ page, step, notes, expected }) => {
  const p = await 開く(page);
  const id = notes.get("〔商品ID-M1206-009〕");
  let csv: string[][] = [];
  let リンク数 = 0;
  let 全行 = 0;
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.日付を空にしてキーワードを入れる(rc("CSVゼロ件切替対象")); await p.検索する(); });
  await step(3, async () => { リンク数 = await p.CSVリンク.count(); });
  await step(4, async () => { 商品名を更新する(id, rc("出力対象外Z")); });
  await step(5, async () => { csv = await p.CSVを出力する(); });
  await step(6, async () => { 全行 = csv.length; });
  印の注記();
  await expected(async () => {
    expect.soft(リンク数, "検索結果に入荷通知一覧CSV出力リンクが表示されている（件数）").toBeGreaterThan(0);
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
  await step(4, async () => { rows = データ行(csv); });
  印の注記();
  await expected(async () => {
    expect.soft(rows.length, "出力されるデータ行は2行だけ").toBe(2);
    行を確かめる(rows, { id: notes.get("〔商品ID-M1206-015A〕"), 名前: 商品名("CSV混在-M1206-015", " 未削除"), 通知待ち: "1", 削除: "0", 見出し: "商品ID 〔商品ID-M1206-015A〕（未削除）" });
    行を確かめる(rows, { id: notes.get("〔商品ID-M1206-015B〕"), 名前: 商品名("CSV混在-M1206-015", " 削除済"), 通知待ち: "0", 削除: "1", 見出し: "商品ID 〔商品ID-M1206-015B〕（削除済）" });
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
  await step(5, async () => { rows = データ行(holder.csv); });
  印の注記();
  await expected(async () => {
    expect.soft(rows.length, "データ行は1行だけ").toBe(1);
    行を確かめる(rows, { id: notes.get("〔商品ID-M1206-016〕"), 名前: 商品名("組合せCSV商品単位待ち"), 通知待ち: "1", 削除: "0", 見出し: "商品ID 〔商品ID-M1206-016〕（商品単位の通知待ち）" });
  });
});

/** 10行（11商品のうち1商品の行は出ない）の確かめ。名前の接頭辞 base、商品の番号は 01〜11 */
function 十行を確かめる(rows: 行[], v: { base: string; ラベル: string; 通知待ち: string; 削除: string }, notes: { get(k: string): string }): void {
  expect.soft(rows.length, "データ行の数").toBe(10);
  expect.soft(rows.every((r) => r.通知待ち === v.通知待ち), `10行のすべてで通知待ちが「${v.通知待ち}」`).toBe(true);
  expect.soft(rows.every((r) => r.削除 === v.削除), `10行のすべてで通知済み/削除が「${v.削除}」`).toBe(true);
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
    await step(5, async () => { rows = データ行(csv); });
    印の注記();
    note(注記);
    await expected(async () => {
      expect.soft(rows.length, "データ行が10行出力される").toBe(10);
      十行を確かめる(rows, v, notes);
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
  await step(5, async () => { rows = データ行(csv); });
  印の注記();
  await expected(async () => {
    expect.soft(rows.length, "データ行は1行だけ").toBe(1);
    行を確かめる(rows, { id: notes.get("〔商品ID-M1206-018〕"), 名前: 商品名("組合せCSV単一規格複数待ち"), 通知待ち: "2", 削除: "0", 見出し: "商品ID 〔商品ID-M1206-018〕（会員2人の通知待ち）" });
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
  await step(5, async () => { rows = データ行(csv); });
  印の注記();
  await expected(async () => {
    expect.soft(rows.length, "データ行は1行だけ").toBe(1);
    行を確かめる(rows, { id: notes.get("〔商品ID-M1206-021〕"), 名前: 商品名("組合せCSV複数規格削除"), 通知待ち: "0", 削除: "1", 見出し: "商品ID 〔商品ID-M1206-021〕（複数規格の削除済み）" });
  });
});
