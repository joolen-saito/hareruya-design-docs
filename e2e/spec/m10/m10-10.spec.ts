/**
 * M10-10 CSV出力項目設定。正本: integration_test/casegen/cases/M10-10_test_cases.tsv
 *
 * 実装: 001〜015・019〜023（専用の CSV 種別を DB に印つきで足し、ケースの終わりに消す。標準の配送CSV・受注CSVは画面で書き換え、画面で戻す）。
 * 見送り: 016〜018 は対象外（この回の担当に無い）。
 * 共有の設定（標準の配送CSV・受注CSVの出力項目）を書き換える 015・019・020 は、夜に1本だけで流す。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { 出力項目の状態 } from "../../db/m10_10";
import { CsvSettingPage } from "../../pages/admin/m10_10_csv";
import { OrderCsvPage } from "../../pages/admin/m05_05_custom_csv";
import { M1010_ADMIN, M1010_L_ADMIN, 除外される種別の名称, 種別名 } from "../../seeds/m10-10";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

const 初期の左 = ["非出力列A", "非出力列B"];
const 初期の右 = ["出力列A", "出力列B", "出力列C"];
const 状態の文 = (rows: { 表示名: string; 有効: boolean; 並び順: number }[]) => rows.map((r) => `${r.表示名}:${r.有効 ? "有効" : "無効"}:${r.並び順}`).join(" / ");
const 行 = (rows: { 表示名: string; 有効: boolean; 並び順: number }[], 表示名: string) => rows.find((r) => r.表示名 === 表示名);

/** 専用の種別を選んで開く（手順1「…画面でCSV種別に…を選ぶ」） */
async function 開いて選ぶ(p: CsvSettingPage, n: string): Promise<void> {
  await p.open();
  await p.種別を選ぶ(種別名(`受注CSV-M1010-${n}`));
}

// ---- 初期表示・選択肢 ----
caseTest("IT-M10-10-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1010_ADMIN);
  const p = new CsvSettingPage(page);
  let 選択値 = ""; let 受注CSVの数 = 0;
  await step(1, async () => { await p.open(); });
  await step(2, async () => { 選択値 = await p.選ばれている種別(); 受注CSVの数 = (await p.種別の選択肢()).filter((x) => x === "受注CSV").length; });
  await expected(async () => {
    expect(選択値, "CSV種別の選択値").toBe("受注CSV");
    expect.soft(受注CSVの数, "名称が「受注CSV」の選択肢の数").toBe(1);
  });
});

caseTest("IT-M10-10-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M1010_ADMIN);
  const p = new CsvSettingPage(page);
  let 選択肢: string[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { 選択肢 = await p.種別の選択肢(); });
  await expected(async () => {
    for (const n of 除外される種別の名称) expect.soft(選択肢, `CSV種別の選択肢に「${n}」が表示されない`).not.toContain(n);
    expect.soft(選択肢, "標準の「受注CSV」は選択肢にある").toContain("受注CSV");
  });
});

caseTest("IT-M10-10-003", async ({ page, step, expected }) => {
  await loginAdmin(page, M1010_ADMIN);
  const p = new CsvSettingPage(page);
  let 並び = { 出力しない: [] as string[], 出力する: [] as string[] };
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.種別を選ぶ(種別名("受注CSV-M1010-003")); });
  await step(3, async () => { 並び = await p.表示名の並び(); });
  await expected(async () => {
    expect.soft(並び.出力しない, "出力しない項目（上から）").toEqual(初期の左);
    expect.soft(並び.出力する, "出力する項目（上から）").toEqual(初期の右);
  });
});

caseTest("IT-M10-10-004", async ({ page, step, expected }) => {
  await loginAdmin(page, M1010_ADMIN);
  const p = new CsvSettingPage(page);
  await step(1, async () => { await 開いて選ぶ(p, "004"); });
  await step(2, async () => {
    await p.左で選ぶ("非出力列A"); await p.出力するへ移す();
    // 移したこと（画面の並びが変わったこと）を見る。移っていなければ「保存済みの順序で再表示」は確かめにならない
    expect((await p.表示名の並び()).出力する, "「非出力列A」が出力する項目へ移った").toContain("非出力列A");
  });
  await step(3, async () => { await p.種別を選ぶ(種別名("切替確認CSV")); });
  await step(4, async () => { await p.種別を選ぶ(種別名("受注CSV-M1010-004")); });
  await expected(async () => {
    const 並び = await p.表示名の並び();
    expect.soft(並び.出力しない, "出力しない項目（保存済みの順序）").toEqual(初期の左);
    expect.soft(並び.出力する, "出力する項目（保存済みの順序）").toEqual(初期の右);
  });
});

// ---- 項目の移動・順序 ----
caseTest("IT-M10-10-005", async ({ page, step, expected }) => {
  await loginAdmin(page, M1010_ADMIN);
  const p = new CsvSettingPage(page);
  await step(1, async () => { await 開いて選ぶ(p, "005"); });
  await step(2, async () => { await p.左で選ぶ("非出力列A"); await p.出力するへ移す(); });
  await step(3, async () => { await p.右で選ぶ("出力列C"); await p.出力しないへ移す(); });
  await expected(async () => {
    const 並び = await p.表示名の並び();
    expect.soft(並び.出力する, "「非出力列A」が出力する項目へ移った").toContain("非出力列A");
    expect.soft(並び.出力しない, "「出力列C」が出力しない項目へ移った").toContain("出力列C");
    expect.soft(並び.出力しない, "「非出力列A」は出力しない項目に残らない").not.toContain("非出力列A");
    expect.soft(並び.出力する, "「出力列C」は出力する項目に残らない").not.toContain("出力列C");
    const 選択 = await p.選ばれている項目();
    expect.soft(選択.出力する, "移動後、出力する項目で選択されている項目").toEqual([]);
    expect.soft(選択.出力しない, "移動後、出力しない項目で選択されている項目").toEqual([]);
  });
});

caseTest("IT-M10-10-006", async ({ page, step, expected }) => {
  await loginAdmin(page, M1010_ADMIN);
  const p = new CsvSettingPage(page);
  await step(1, async () => { await 開いて選ぶ(p, "006"); });
  await step(2, async () => { await p.右で選ぶ("出力列B"); });
  await step(3, async () => { await p.ひとつ上へ(); });
  await expected(async () => {
    expect((await p.表示名の並び()).出力する, "出力する項目（上から）").toEqual(["出力列B", "出力列A", "出力列C"]);
  });
});

caseTest("IT-M10-10-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M1010_ADMIN);
  const p = new CsvSettingPage(page);
  await step(1, async () => { await 開いて選ぶ(p, "007"); });
  await step(2, async () => { await p.左で選ぶ("非出力列B"); });
  await step(3, async () => { await p.ひとつ上へ(); });
  await expected(async () => {
    expect((await p.表示名の並び()).出力しない, "出力しない項目（上から）").toEqual(初期の左);
  });
});

caseTest("IT-M10-10-008", async ({ page, step, expected }) => {
  await loginAdmin(page, M1010_ADMIN);
  const p = new CsvSettingPage(page);
  await step(1, async () => { await 開いて選ぶ(p, "008"); });
  await step(2, async () => { await p.選択を外す(); });
  await step(3, async () => { await p.ひとつ下へ(); });
  await expected(async () => {
    const 並び = await p.表示名の並び();
    expect.soft(並び.出力しない, "出力しない項目（上から）").toEqual(初期の左);
    expect.soft(並び.出力する, "出力する項目（上から）").toEqual(初期の右);
  });
});

caseTest("IT-M10-10-009", async ({ page, step, expected }) => {
  await loginAdmin(page, M1010_ADMIN);
  const p = new CsvSettingPage(page);
  await step(1, async () => { await 開いて選ぶ(p, "009"); });
  await step(2, async () => {
    await p.左で選ぶ("非出力列A"); await p.出力するへ移す();
    expect((await p.表示名の並び()).出力する, "「非出力列A」が出力する項目へ移った").toContain("非出力列A");
  });
  await step(3, async () => {
    await p.右で選ぶ("出力列A"); await p.ひとつ下へ();
    // 並びが変わったことを見る。変わっていなければ「再読み込みで保存済みの順序に戻る」は確かめにならない
    expect((await p.表示名の並び()).出力する.indexOf("出力列A"), "「出力列A」が1つ下がった（上から2番目）").toBe(1);
  });
  await step(4, async () => { await page.reload({ waitUntil: "load" }); });
  await expected(async () => {
    const 並び = await p.表示名の並び();
    expect.soft(並び.出力しない, "出力しない項目（保存済みの順序）").toEqual(初期の左);
    expect.soft(並び.出力する, "出力する項目（保存済みの順序）").toEqual(初期の右);
  });
});

// ---- 保存（DB で確かめる） ----
caseTest("IT-M10-10-010", async ({ page, step, expected }) => {
  await loginAdmin(page, M1010_ADMIN);
  const p = new CsvSettingPage(page);
  const 名 = 種別名("受注CSV-M1010-010");
  let 保存後: ReturnType<typeof 出力項目の状態> = [];
  await step(1, async () => { await 開いて選ぶ(p, "010"); });
  await step(2, async () => { await p.左で選ぶ("非出力列B"); });
  await step(3, async () => { await p.右で選ぶ("出力列B"); });
  await step(4, async () => { await p.登録する(); });
  await step(5, async () => { 保存後 = 出力項目の状態(名); });
  await expected(async () => {
    note(`保存後の全出力項目: ${状態の文(保存後)}`);
    for (const [n, 並び] of [["非出力列A", 1], ["非出力列B", 2]] as const) {
      expect.soft(行(保存後, n), `「${n}」は無効で並び順${並び}`).toEqual({ 表示名: n, 有効: false, 並び順: 並び });
    }
    for (const [n, 並び] of [["出力列A", 1], ["出力列B", 2], ["出力列C", 3]] as const) {
      expect.soft(行(保存後, n), `「${n}」は有効で並び順${並び}`).toEqual({ 表示名: n, 有効: true, 並び順: 並び });
    }
  });
});

caseTest("IT-M10-10-011", async ({ page, step, expected }) => {
  await loginAdmin(page, M1010_ADMIN);
  const p = new CsvSettingPage(page);
  const 名 = 種別名("受注CSV-M1010-011");
  let 保存後: ReturnType<typeof 出力項目の状態> = [];
  await step(1, async () => { await 開いて選ぶ(p, "011"); });
  await step(2, async () => { await p.左で選ぶ("非出力列B"); await p.出力するへ移す(); });
  await step(3, async () => { await p.最下段まで下げる("非出力列B"); });
  await step(4, async () => { await p.右で選ぶ("出力列A"); await p.ひとつ下へ(); });
  await step(5, async () => { await p.登録する(); });
  await step(6, async () => { 保存後 = 出力項目の状態(名); });
  await expected(async () => {
    note(`保存後の全出力項目: ${状態の文(保存後)}`);
    expect.soft(行(保存後, "非出力列A"), "「非出力列A」は無効で並び順1").toEqual({ 表示名: "非出力列A", 有効: false, 並び順: 1 });
    for (const [n, 並び] of [["出力列B", 1], ["出力列A", 2], ["出力列C", 3], ["非出力列B", 4]] as const) {
      expect.soft(行(保存後, n), `「${n}」は有効で並び順${並び}`).toEqual({ 表示名: n, 有効: true, 並び順: 並び });
    }
  });
});

caseTest("IT-M10-10-012", async ({ page, step, expected }) => {
  await loginAdmin(page, M1010_ADMIN);
  const p = new CsvSettingPage(page);
  const 名 = 種別名("受注CSV-M1010-012");
  let 保存後: ReturnType<typeof 出力項目の状態> = [];
  await step(1, async () => { await 開いて選ぶ(p, "012"); });
  await step(2, async () => { await p.入力要素を削除する("左"); });
  await step(3, async () => { await p.登録する(); });
  await step(4, async () => { 保存後 = 出力項目の状態(名); });
  await expected(async () => {
    note(`保存後の全出力項目: ${状態の文(保存後)}`);
    expect.soft(行(保存後, "非出力列A"), "「非出力列A」は無効で並び順10のまま").toEqual({ 表示名: "非出力列A", 有効: false, 並び順: 10 });
    expect.soft(行(保存後, "非出力列B"), "「非出力列B」は無効で並び順20のまま").toEqual({ 表示名: "非出力列B", 有効: false, 並び順: 20 });
    for (const [n, 並び] of [["出力列A", 1], ["出力列B", 2], ["出力列C", 3]] as const) {
      expect.soft(行(保存後, n), `「${n}」は有効で並び順${並び}`).toEqual({ 表示名: n, 有効: true, 並び順: 並び });
    }
  });
});

caseTest("IT-M10-10-013", async ({ page, step, expected }) => {
  await loginAdmin(page, M1010_ADMIN);
  const p = new CsvSettingPage(page);
  const 名 = 種別名("受注CSV-M1010-013");
  let 保存後: ReturnType<typeof 出力項目の状態> = [];
  await step(1, async () => { await 開いて選ぶ(p, "013"); });
  await step(2, async () => { await p.入力要素を削除する("右"); });
  await step(3, async () => { await p.登録する(); });
  await step(4, async () => { 保存後 = 出力項目の状態(名); });
  await expected(async () => {
    note(`保存後の全出力項目: ${状態の文(保存後)}`);
    for (const [n, 並び] of [["非出力列A", 1], ["非出力列B", 2]] as const) {
      expect.soft(行(保存後, n), `「${n}」は無効で並び順${並び}`).toEqual({ 表示名: n, 有効: false, 並び順: 並び });
    }
    for (const [n, 並び] of [["出力列A", 10], ["出力列B", 20], ["出力列C", 30]] as const) {
      expect.soft(行(保存後, n), `「${n}」は有効で並び順${並び}のまま`).toEqual({ 表示名: n, 有効: true, 並び順: 並び });
    }
  });
});

caseTest("IT-M10-10-014", async ({ page, step, expected }) => {
  await loginAdmin(page, M1010_ADMIN);
  const p = new CsvSettingPage(page);
  const 名 = 種別名("受注CSV-M1010-014");
  const 保存前 = 出力項目の状態(名); // 事前準備の状態（画面を操作する前の値）
  let 保存後: ReturnType<typeof 出力項目の状態> = [];
  await step(1, async () => { await 開いて選ぶ(p, "014"); });
  await step(2, async () => { await p.識別子を書き換える("非出力列A", "999999"); });
  await step(3, async () => {
    const r = await p.登録する();
    note(`未登録の識別子（999999）を送った応答の状態: ${r.応答}`);
  });
  await step(4, async () => { 保存後 = 出力項目の状態(名); });
  await expected(async () => {
    note(`保存前の全出力項目: ${状態の文(保存前)}`);
    note(`保存後の全出力項目: ${状態の文(保存後)}`);
    expect.soft(保存前.length, "保存前の出力項目の数（事前準備の5件）").toBe(5);
    expect.soft(保存後, "全出力項目の有効・無効と並び順が保存前から更新されない").toEqual(保存前);
  });
});

caseTest("IT-M10-10-015", async ({ page, step, expected }) => {
  note("標準の受注CSVの出力項目は入れ替えない（共有の設定）。事前準備の5件ではなく、いまの出力項目のまま保存して遷移先を確かめる。保存前の左右の並びを控え、ケースの終わりに画面で同じ並びへ登録し直す");
  await loginAdmin(page, M1010_ADMIN);
  const p = new CsvSettingPage(page);
  await step(1, async () => { await p.open(); await p.種別を選ぶ("受注CSV"); });
  await step(2, async () => { await p.登録する(); });
  await expected(async () => {
    // CSV出力項目設定画面のアドレスは、種別を省くと受注CSV（種別の既定）の画面になる。どちらでも同じ画面なので、受注CSVが選ばれていることは画面の選択で確かめる
    expect.soft(p.現在のパス, "保存後の画面のアドレス（CSV出力項目設定画面）").toMatch(/\/setting\/shop\/csv(\/3)?\/?$/);
    expect.soft(await p.選ばれている種別(), "保存後に選択されているCSV種別").toBe("受注CSV");
  });
});

// ---- 配送CSVの出力（標準の配送CSVを画面で書き換え、画面で戻す） ----
const 読み替えの注記 = "標準の配送CSVに「連携出力列…」の名前の項目は足せないので、出力項目は標準の「注文番号」を A、「配送ID」を B、「会員ID」を C として読み替えた（シードが画面で3件だけ出力にした）。CSVダウンロードは「受注詳細CSVダウンロード」（配送CSVの出力）";

caseTest("IT-M10-10-019", async ({ page, notes, step, expected }) => {
  note(読み替えの注記);
  await loginAdmin(page, M1010_L_ADMIN);
  const p = new CsvSettingPage(page);
  const csv = new OrderCsvPage(page);
  const 注文番号 = notes.get("〔注文番号-M1010-019〕");
  let 行列: string[][] = [];
  let 見出し: string[] = [];
  await step(1, async () => { await p.open(); await p.種別を選ぶ("配送CSV"); });
  await step(2, async () => { await p.右で選ぶ("配送ID"); await p.出力しないへ移す(); });
  await step(3, async () => {
    await p.登録する();
    await p.保存したと表示される();
    expect(await page.locator(".alert-success").first().innerText(), "保存の成功メッセージ").toContain("保存しました");
  });
  await step(4, async () => { await csv.openSearch(); expect(await csv.注文番号で検索する(注文番号), "注文番号で検索した受注の件数").toBeGreaterThanOrEqual(1); });
  await step(5, async () => { 行列 = (await csv.受注詳細CSVをダウンロードする()).行; });
  await step(6, async () => { 見出し = 行列[0] ?? []; });
  await expected(async () => {
    note(`CSV の見出し行: ${見出し.join("、")}`);
    expect.soft(見出し, "見出し行（A=注文番号、C=会員ID の順。B=配送ID は出力されない）").toEqual(["注文番号", "会員ID"]);
    expect.soft(見出し, "無効にした B（配送ID）は出力されない").not.toContain("配送ID");
  });
});

caseTest("IT-M10-10-020", async ({ page, notes, step, expected }) => {
  note(読み替えの注記);
  await loginAdmin(page, M1010_L_ADMIN);
  const p = new CsvSettingPage(page);
  const csv = new OrderCsvPage(page);
  const 注文番号 = notes.get("〔注文番号-M1010-020〕");
  let 行列: string[][] = [];
  let 見出し: string[] = [];
  await step(1, async () => { await p.open(); await p.種別を選ぶ("配送CSV"); });
  await step(2, async () => { await p.右で選ぶ("会員ID"); await p.ひとつ上へ(); await p.ひとつ上へ(); });
  await step(3, async () => {
    await p.登録する();
    await p.保存したと表示される();
    expect(await page.locator(".alert-success").first().innerText(), "保存の成功メッセージ").toContain("保存しました");
  });
  await step(4, async () => { await csv.openSearch(); expect(await csv.注文番号で検索する(注文番号), "注文番号で検索した受注の件数").toBeGreaterThanOrEqual(1); });
  await step(5, async () => { 行列 = (await csv.受注詳細CSVをダウンロードする()).行; });
  await step(6, async () => { 見出し = 行列[0] ?? []; });
  await expected(async () => {
    note(`CSV の見出し行: ${見出し.join("、")}`);
    expect(見出し, "見出し行（C=会員ID、A=注文番号、B=配送ID の順）").toEqual(["会員ID", "注文番号", "配送ID"]);
  });
});

// ---- 複数選択・再保存 ----
caseTest("IT-M10-10-021", async ({ page, step, expected }) => {
  note("複数選択のクリックの修飾キーは、Windows・Linux では Ctrl、Mac のブラウザでは Command（Mac では Ctrl のクリックが選択にならないため）");
  await loginAdmin(page, M1010_ADMIN);
  const p = new CsvSettingPage(page);
  await step(1, async () => { await 開いて選ぶ(p, "021"); });
  await step(2, async () => { await p.複数選ぶ("左", ["非出力列A", "非出力列B"]); });
  await step(3, async () => { await p.出力するへ移す(); });
  await expected(async () => {
    const 並び = await p.表示名の並び();
    expect.soft(並び.出力する, "「非出力列A」「非出力列B」が出力する項目へ移った").toEqual(expect.arrayContaining(["非出力列A", "非出力列B"]));
    expect.soft(並び.出力しない, "出力しない項目に1件も残らない").toEqual([]);
    const 選択 = await p.選ばれている項目();
    expect.soft(選択.出力する, "移動後、出力する項目で選択されている項目").toEqual([]);
    expect.soft(選択.出力しない, "移動後、出力しない項目で選択されている項目").toEqual([]);
  });
});

caseTest("IT-M10-10-022", async ({ page, step, expected }) => {
  note("複数選択のクリックの修飾キーは、Windows・Linux では Ctrl、Mac のブラウザでは Command（Mac では Ctrl のクリックが選択にならないため）");
  await loginAdmin(page, M1010_ADMIN);
  const p = new CsvSettingPage(page);
  await step(1, async () => { await 開いて選ぶ(p, "022"); });
  await step(2, async () => { await p.複数選ぶ("右", ["出力列A", "出力列C"]); });
  await step(3, async () => { await p.出力しないへ移す(); });
  await expected(async () => {
    const 並び = await p.表示名の並び();
    expect.soft(並び.出力しない, "「出力列A」「出力列C」が出力しない項目へ移った").toEqual(expect.arrayContaining(["出力列A", "出力列C"]));
    expect.soft(並び.出力する, "出力する項目には「出力列B」だけが残る").toEqual(["出力列B"]);
    const 選択 = await p.選ばれている項目();
    expect.soft(選択.出力する, "移動後、出力する項目で選択されている項目").toEqual([]);
    expect.soft(選択.出力しない, "移動後、出力しない項目で選択されている項目").toEqual([]);
  });
});

caseTest("IT-M10-10-023", async ({ page, step, expected }) => {
  note("専用の種別の番号は、シード表の 91023 が番号の列（16ビット）に入らないため、空いている番号にした（画面では番号を使わない）");
  await loginAdmin(page, M1010_ADMIN);
  const p = new CsvSettingPage(page);
  const 名 = 種別名("受注CSV-M1010-023");
  let 一回目: ReturnType<typeof 出力項目の状態> = [];
  let 二回目: ReturnType<typeof 出力項目の状態> = [];
  await step(1, async () => { await p.open(); await p.種別を選ぶ(名); });
  await step(2, async () => { await p.登録する(); });
  await step(3, async () => { 一回目 = 出力項目の状態(名); });
  await step(4, async () => { await p.登録する(); });
  await step(5, async () => { 二回目 = 出力項目の状態(名); });
  await expected(async () => {
    note(`1回目の保存直後: ${状態の文(一回目)}`);
    note(`2回目の保存後: ${状態の文(二回目)}`);
    for (const [時点, rows] of [["1回目の保存直後", 一回目], ["2回目の保存後", 二回目]] as const) {
      for (const [n, 並び] of [["非出力列A", 1], ["非出力列B", 2], ["非出力列C", 3]] as const) {
        expect.soft(行(rows, n), `${時点}: 「${n}」は無効で並び順${並び}`).toEqual({ 表示名: n, 有効: false, 並び順: 並び });
      }
      for (const [n, 並び] of [["出力列A", 1], ["出力列B", 2]] as const) {
        expect.soft(行(rows, n), `${時点}: 「${n}」は有効で並び順${並び}`).toEqual({ 表示名: n, 有効: true, 並び順: 並び });
      }
    }
    expect.soft(二回目, "2回目の保存後は1回目の保存直後と同じ値（重複や加算が起きない）").toEqual(一回目);
  });
});
