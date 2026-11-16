/** M06-07 買取商品履歴CSV出力。正本: cases/M06-07_test_cases.tsv */
import { Page, test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { scene, ダウンロードしたCSVの内容を撮る } from "../../lib/evidence_other";
import { loginAdmin } from "../../lib/session";
import { HistoryPage } from "../../pages/admin/m06_05_history";
import { 生のCSV, 選択した履歴のCSVを取る, 選択した履歴のCSVを押して応答も見る, 商品コードの行にチェックを付ける } from "../../pages/admin/m06_07_history_csv";
import { M0607_ADMIN, コード, 二十番の商品コード, 会員IDの, 店016の店名, 査定IDの } from "../../seeds/m06-07";

// 買取・商品・実在庫履歴は、シード（seeds/m06-07.ts）が画面で申込んだ実行の印つきの買取に、DBで足したもの。
// 正本の査定ID（70607013 など）は、画面が振った査定番号に読み替える。商品コードは正本の値の末尾に実行の印を付けた値。
const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 査定IDの注記 = (正本: string, 実際: string) => `手順の査定ID ${正本} は、シードが画面で申込んだ買取の査定番号 ${実際} に読み替えて入力した`;

/** 手順1・2: 買取商品履歴(検索入力)を開き、査定IDで検索する */
async function 査定IDで検索する(page: Page, 査定ID: string): Promise<HistoryPage> {
  const h = new HistoryPage(page);
  await h.open();
  await h.査定IDを入れる(査定ID);
  await h.検索する();
  return h;
}

/** CSVのデータ行のうち、左から4番目（商品コード）が一致する行 */
const 商品コードの行 = (csv: 生のCSV | null, c: string): string[][] => (csv?.行 ?? []).filter((r) => r[3] === c);

caseTest("IT-M06-07-013", async ({ page, step, expected }) => {
  await loginAdmin(page, M0607_ADMIN);
  const id = 査定IDの("S-M06-07-FGSEL-013");
  const [A, B, C] = ["A", "B", "C"].map((k) => コード(`M0607-FG013-${k}`));
  let h: HistoryPage | undefined;
  let csv: 生のCSV | null = null;
  await step(1, async () => { h = new HistoryPage(page); await h.open(); });
  await step(2, async () => { await h!.査定IDを入れる(id); await h!.検索する(); });
  await step(3, async () => {
    await 商品コードの行にチェックを付ける(page, A);
    await 商品コードの行にチェックを付ける(page, C);
  });
  await step(4, async () => { csv = await 選択した履歴のCSVを取る(page); });
  await step(5, async () => {
    expect(csv, "ダウンロードしたCSV").not.toBeNull();
    // 期待結果（CSVの中身）が画像で読めるよう、読み取ったCSVの内容を画面の上の枠にして撮る（アプリの画面ではないと枠に明記される）
    if (csv) await ダウンロードしたCSVの内容を撮る(page, [csv.見出し, ...csv.行], scene.stepLabel(5, "ダウンロードしたCSVの内容"));
  });
  note(査定IDの注記("70607013", id));
  await expected(async () => {
    expect.soft(csv?.見出し[3] ?? "", "CSVの左から4番目の列の見出し").toBe("商品コード");
    expect.soft(csv?.行.length ?? 0, "CSVのデータ行の数").toBe(2);
    expect.soft(商品コードの行(csv, A).length, `商品コード「${A}」の行の数`).toBe(1);
    expect.soft(商品コードの行(csv, C).length, `商品コード「${C}」の行の数`).toBe(1);
    expect.soft(商品コードの行(csv, B).length, `商品コード「${B}」の行の数（無い）`).toBe(0);
  });
});

caseTest("IT-M06-07-014", async ({ page, step, expected }) => {
  await loginAdmin(page, M0607_ADMIN);
  const id = 査定IDの("S-M06-07-FGMEM-014");
  const 会員ID = 会員IDの("S-M06-07-FGMEM-014");
  const P = コード("M0607-FG014-P");
  let csv: 生のCSV | null = null;
  let row: string[] = [];
  await step(1, async () => { await new HistoryPage(page).open(); });
  await step(2, async () => { await 査定IDで検索する(page, id); });
  await step(3, async () => { await 商品コードの行にチェックを付ける(page, P); });
  await step(4, async () => { csv = await 選択した履歴のCSVを取る(page); });
  await step(5, async () => {
    const rows = 商品コードの行(csv, P);
    expect(rows.length, `CSVの商品コード「${P}」の行の数`).toBe(1);
    row = rows[0];
  });
  note(査定IDの注記("70607014", id));
  note(`正本の会員ID 71607014 は、シードが画面で登録した会員の会員ID ${会員ID} に読み替えた`);
  await expected(async () => {
    expect.soft(csv?.見出し.slice(1, 3) ?? [], "CSVの左から2番目・3番目の列の見出し").toEqual(["会員ID", "申込者"]);
    expect.soft(row[1] ?? "", "左から2番目（会員ID）").toBe(会員ID);
    expect.soft(row[2] ?? "", "左から3番目（申込者。会員の姓と名を半角空白1つでつないだ値）").toBe("M0607-014姓 M0607-014名");
    expect.soft(row.join(","), "行に受注の姓「M0607-014受注姓」が含まれない").not.toContain("M0607-014受注姓");
    expect.soft(row.join(","), "行に受注の名「M0607-014受注名」が含まれない").not.toContain("M0607-014受注名");
  });
});

caseTest("IT-M06-07-015", async ({ page, step, expected }) => {
  await loginAdmin(page, M0607_ADMIN);
  const id = 査定IDの("S-M06-07-FGNMB-015");
  const P = コード("M0607-FG015-P");
  let csv: 生のCSV | null = null;
  let row: string[] = [];
  await step(1, async () => { await new HistoryPage(page).open(); });
  await step(2, async () => { await 査定IDで検索する(page, id); });
  await step(3, async () => { await 商品コードの行にチェックを付ける(page, P); });
  await step(4, async () => { csv = await 選択した履歴のCSVを取る(page); });
  await step(5, async () => {
    const rows = 商品コードの行(csv, P);
    expect(rows.length, `CSVの商品コード「${P}」の行の数`).toBe(1);
    row = rows[0];
  });
  note(査定IDの注記("70607015", id));
  await expected(async () => {
    expect.soft(csv?.見出し.slice(1, 3) ?? [], "CSVの左から2番目・3番目の列の見出し").toEqual(["会員ID", "申込者"]);
    expect.soft(row[1] ?? "(列なし)", "左から2番目（会員ID）が空文字").toBe("");
    expect.soft(row[2] ?? "(列なし)", "左から3番目（申込者）が空文字").toBe("");
    expect.soft(row.join(","), "行に受注の姓「M0607-015受注姓」が含まれない").not.toContain("M0607-015受注姓");
    expect.soft(row.join(","), "行に受注の名「M0607-015受注名」が含まれない").not.toContain("M0607-015受注名");
  });
});

caseTest("IT-M06-07-016", async ({ page, step, expected }) => {
  await loginAdmin(page, M0607_ADMIN);
  const id = 査定IDの("S-M06-07-FGSTO-016");
  const P = コード("M0607-FG016-P");
  let csv: 生のCSV | null = null;
  let row: string[] = [];
  await step(1, async () => { await new HistoryPage(page).open(); });
  await step(2, async () => { await 査定IDで検索する(page, id); });
  await step(3, async () => { await 商品コードの行にチェックを付ける(page, P); });
  await step(4, async () => { csv = await 選択した履歴のCSVを取る(page); });
  await step(5, async () => {
    const rows = 商品コードの行(csv, P);
    expect(rows.length, `CSVの商品コード「${P}」の行の数`).toBe(1);
    row = rows[0];
  });
  note(査定IDの注記("70607016", id));
  await expected(async () => {
    expect.soft(csv?.見出し.slice(7, 9) ?? [], "CSVの左から8番目・9番目の列の見出し").toEqual(["買取店舗", "作業者"]);
    expect.soft(row[7] ?? "", "左から8番目（買取店舗）").toBe(店016の店名());
    expect.soft(row[8] ?? "", "左から9番目（作業者）").toBe("M0607-016-作業者");
  });
});

caseTest("IT-M06-07-017", async ({ page, step, expected }) => {
  await loginAdmin(page, M0607_ADMIN);
  const id = 査定IDの("S-M06-07-FGNST-017");
  const P = コード("M0607-FG017-P");
  let csv: 生のCSV | null = null;
  let rows: string[][] = [];
  await step(1, async () => { await new HistoryPage(page).open(); });
  await step(2, async () => { await 査定IDで検索する(page, id); });
  await step(3, async () => { await 商品コードの行にチェックを付ける(page, P); });
  await step(4, async () => { csv = await 選択した履歴のCSVを取る(page); });
  await step(5, async () => { expect(csv, "ダウンロードしたCSV").not.toBeNull(); rows = 商品コードの行(csv, P); });
  note(査定IDの注記("70607017", id));
  await expected(async () => {
    expect.soft(csv?.見出し[7] ?? "", "CSVの左から8番目の列の見出し").toBe("買取店舗");
    expect.soft(rows.length, `CSVの商品コード「${P}」の行の数`).toBe(1);
    expect.soft(rows[0]?.[7] ?? "(行なし)", "左から8番目（買取店舗）が空文字").toBe("");
  });
});

caseTest("IT-M06-07-018", async ({ page, step, expected }) => {
  await loginAdmin(page, M0607_ADMIN);
  const id = 査定IDの("S-M06-07-FGCAN-018");
  const P = コード("M0607-FG018-P");
  let csv: 生のCSV | null = null;
  let row: string[] = [];
  await step(1, async () => { await new HistoryPage(page).open(); });
  await step(2, async () => { await 査定IDで検索する(page, id); });
  await step(3, async () => { await 商品コードの行にチェックを付ける(page, P); });
  await step(4, async () => { csv = await 選択した履歴のCSVを取る(page); });
  await step(5, async () => {
    const rows = 商品コードの行(csv, P);
    expect(rows.length, `CSVの商品コード「${P}」の行の数`).toBe(1);
    row = rows[0];
  });
  note(査定IDの注記("70607018", id));
  note("キャンセル日「2026-08-04」を表す値は、2026-08-04・2026/08/04・2026年08月04日 のどの書き方でも含まれないことで確かめた（CSVの日時は「2026年08月02日 11時30分」の形）");
  await expected(async () => {
    expect.soft(csv?.見出し[12] ?? "", "CSVの左から13番目の列の見出し").toBe("買取日時");
    expect.soft(row[12] ?? "(列なし)", "左から13番目（買取日時）が空文字").toBe("");
    for (const v of ["2026-08-04", "2026/08/04", "2026年08月04日"]) {
      expect.soft(row[12] ?? "", `左から13番目（買取日時）にキャンセル日「${v}」が含まれない`).not.toContain(v);
    }
  });
});

caseTest("IT-M06-07-019", async ({ page, step, expected }) => {
  await loginAdmin(page, M0607_ADMIN);
  const id = 査定IDの("S-M06-07-FGERR-019");
  const P = コード("M0607-FG019-P");
  let h: HistoryPage | undefined;
  let csv: 生のCSV | null = null;
  await step(1, async () => { h = new HistoryPage(page); await h.open(); });
  await step(2, async () => { await h!.査定IDを入れる(id); await h!.検索する(); });
  await step(3, async () => {
    const rows = (await h!.行を読む()).filter((r) => r.商品コード === P);
    expect(rows.length, `検索結果の商品コード「${P}」の行の数（チェックを付けずに進む）`).toBe(1);
    await expect(page.locator('#result_list_main input[type="checkbox"]:checked'), "チェックの付いた行").toHaveCount(0);
  });
  await step(4, async () => { csv = await 選択した履歴のCSVを取る(page, 15_000); });
  note(査定IDの注記("70607019", id));
  await expected(async () => {
    await expect.soft(page.locator(".alert-danger").filter({ hasText: "1つ以上の商品を選択してください" }), "管理画面上部の「1つ以上の商品を選択してください」").toBeVisible();
    expect.soft(csv, "ダウンロードされたCSV（されない）").toBeNull();
    expect.soft(new URL(page.url()).pathname, "表示された画面（買取商品履歴の一覧）のアドレス").toMatch(/\/otcbuyorder\/history\/page\/\d+$/);
    await expect.soft(h!.結果の欄(), "買取商品履歴の一覧").toBeVisible();
  });
});

caseTest("IT-M06-07-020", async ({ page, step, expected }) => {
  await loginAdmin(page, M0607_ADMIN);
  const id = 査定IDの("S-M06-07-FGPAG-020");
  const [P01, P02] = 二十番の商品コード.slice(0, 2).map(コード);
  let h: HistoryPage | undefined;
  let csv: 生のCSV | null = null;
  await step(1, async () => { h = new HistoryPage(page); await h.open(); });
  await step(2, async () => { await h!.査定IDを入れる(id); await h!.検索する(); });
  await step(3, async () => {
    await h!.表示件数を選ぶ("10件");
    expect(await h!.表示件数の選択中(), "件数の選択").toBe("10件");
    expect((await h!.行を読む()).length, "一覧の1ページ目の行の数").toBe(10);
  });
  await step(4, async () => { await h!.ページへ移る(2); });
  await step(5, async () => {
    await expect(page.locator('#result_list_main input[type="checkbox"]:checked'), "チェックの付いた行").toHaveCount(0);
    const r = await 選択した履歴のCSVを押して応答も見る(page, 15_000);
    csv = r.csv;
    if (csv) note("選択した商品履歴取得でCSVがダウンロードされた");
    note(`CSV出力の要求の応答 ${r.要求の応答 ?? "なし"}`);
    // 押したあとも同じ2ページ目へ戻る作りなので、要求が送られていなければ「2ページ目が表示される」は確かめにならない
    expect(r.要求の応答, "「選択した商品履歴取得」でCSV出力の要求が送られた（応答がある）").not.toBeNull();
  });
  note(査定IDの注記("70607020", id));
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示された画面（買取商品履歴(検索結果)の2ページ目）のアドレス").toMatch(/\/otcbuyorder\/history\/page\/2$/);
    expect.soft((await h!.行を読む()).map((r) => r.商品コード), "一覧の行の商品コード（表示順）").toEqual([P02, P01]);
  });
});
