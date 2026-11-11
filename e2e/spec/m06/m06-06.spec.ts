/**
 * M06-06 買取商品履歴CSV出力。正本: cases/M06-06_test_cases.tsv
 *
 * 実装した8件: 001・005・007（ブラウザ+DB確認）・008・009・016・017・018。シードは seeds/m06-06.ts に作った。
 * 実装しないケースと理由:
 * - 010: 「買取日時 2026-08-01〜08-03 の買取データはこの3件だけ」を、日付の範囲だけの検索で確かめるケース。共有の開発環境には同じ期間の他の買取（ほかの機能の履歴など）があり、
 *        それらを消さずに「この3件だけ」の前提を作れない
 * - 012・013・014: 商品・商品の規格・作業者（メンバー）が削除済みで、履歴は残る状態が前提。履歴に紐づく商品・規格・メンバーは削除できない（外部キー制約）ため作れない
 *
 * 査定ID・会員ID・商品の識別の値は、画面が振る値と実行の印つきの値に読み替えた（シードの注記）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { 買取明細の件数, 在庫数量, 実在庫履歴の件数 } from "../../db/m06_06";
import { HistoryPage } from "../../pages/admin/m06_05_history";
import { M0606_ADMIN } from "../../seeds/m06-06";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

type CSV = Record<string, string>[] | null;

const 数 = (s: string | undefined): number => Number((s ?? "").replace(/[^\d.-]/g, ""));
/** 日時の文を、数字だけにする（画面とCSVで書き方が違っても比べられるように） */
const 数字だけ = (s: string | undefined): string => (s ?? "").replace(/\D/g, "");

const 日時の注記 = "CSVの買取日時・更新日時は日時の文字列の書き方（年月日・時刻）がアプリの作りで決まるため、数字だけを取り出して「2026年08月01日 10:00」などの年月日・時分の並びで比べた";

/** 査定IDで検索してCSV（検索結果全件取得）を取る */
async function 査定IDで検索する(h: HistoryPage, 査定ID: string): Promise<void> {
  await h.査定IDを入れる(査定ID);
  await h.検索する();
}

// 001: 出力項目の構成と並び
caseTest("IT-M06-06-001", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0606_ADMIN);
  const h = new HistoryPage(page);
  const id = notes.get("〔査定ID-M0606-001〕");
  const 会員 = notes.get("〔会員ID-M0606-001〕");
  const code = rc("M0606-001-P");
  let records: CSV = null;
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await 査定IDで検索する(h, id); });
  await step(3, async () => { records = await h.CSVを取る("検索結果全件取得"); });
  let row: Record<string, string> | undefined;
  await step(4, async () => { expect(records, "ダウンロードされたCSV").not.toBeNull(); row = (records ?? []).find((x) => x["商品コード"] === code); });
  await expected(async () => {
    const v = Object.values(row ?? {});
    expect.soft(v.length, "商品コードの行の項目数").toBe(14);
    expect.soft(v[1], "左から2番目（会員ID）").toBe(会員);
    expect.soft(v[3], "左から4番目（商品コード）").toBe(code);
    expect.soft(v[4], "左から5番目（商品名）").toBe(rc("M0606-001-商品"));
    expect.soft(数(v[5]), "左から6番目（基準価格）").toBe(3000);
    expect.soft(数(v[6]), "左から7番目（買取価格）").toBe(1200);
    expect.soft(数(v[10]), "左から11番目（入庫数）").toBe(12);
    expect.soft(数字だけ(v[12]).slice(0, 12), "左から13番目（買取日時 2026-08-01 10:00:00）").toBe("202608011000");
    expect.soft(数字だけ(v[13]).slice(0, 12), "左から14番目（更新日時 2026-08-02 11:30:00）").toBe("202608021130");
  });
  note(`${日時の注記}。会員ID・査定ID・商品コード・商品名は画面が振った値／実行の印つきの値に読み替えた（会員ID ${会員}）`);
});

// 005: 入庫数は実在庫履歴の変更後数量（一覧と同じ）
caseTest("IT-M06-06-005", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0606_ADMIN);
  const h = new HistoryPage(page);
  const id = notes.get("〔査定ID-M0606-005〕");
  const code = rc("M0606-005-P");
  let records: CSV = null;
  let 一覧の入庫数 = "";
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await 査定IDで検索する(h, id); });
  await step(3, async () => { records = await h.CSVを取る("検索結果全件取得"); });
  let csv入庫数 = "";
  await step(4, async () => {
    expect(records, "ダウンロードされたCSV").not.toBeNull();
    csv入庫数 = (records ?? []).find((x) => x["商品コード"] === code)?.["入庫数"] ?? "";
    一覧の入庫数 = (await h.行を読む()).find((r) => r.商品コード === code)?.入庫数 ?? "";
  });
  await expected(async () => {
    expect.soft(数(csv入庫数), "CSVの入庫数").toBe(数(一覧の入庫数));
    expect.soft(数(csv入庫数), "CSVの入庫数（実在庫履歴の変更後数量）").toBe(9);
  });
});

// 007: CSV出力で実在庫履歴・買取明細・在庫が変わらない（ブラウザ+DB確認）
caseTest("IT-M06-06-007", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0606_ADMIN);
  const h = new HistoryPage(page);
  const id = notes.get("〔査定ID-M0606-007〕");
  const code = rc("M0606-007-P");
  const 前 = { 履歴: 実在庫履歴の件数(id), 明細: 買取明細の件数(id), 在庫: 在庫数量(code) };
  let records: CSV = null;
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await 査定IDで検索する(h, id); });
  await step(3, async () => { records = await h.CSVを取る("検索結果全件取得"); });
  let 後 = { 履歴: -1, 明細: -1, 在庫: -1 };
  await step(4, async () => {
    expect(records, "ダウンロードされたCSV").not.toBeNull();
    後 = { 履歴: 実在庫履歴の件数(id), 明細: 買取明細の件数(id), 在庫: 在庫数量(code) };
  });
  await expected(async () => {
    expect.soft(前, "CSV出力の前の件数（実在庫履歴1件・買取明細1件・商品の在庫数量12）").toEqual({ 履歴: 1, 明細: 1, 在庫: 12 });
    expect.soft(後, "CSV出力の後の件数（変わらない）").toEqual(前);
  });
  note("商品の在庫数量12は、シードでDBに設定した実行の印つきの商品の在庫数量。件数は、画面が振った査定IDの買取で数えた");
});

// 008: 10件表示でも全件出力
caseTest("IT-M06-06-008", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0606_ADMIN);
  const h = new HistoryPage(page);
  const id = notes.get("〔査定ID-M0606-008〕");
  let 一覧: string[] = [];
  let records: CSV = null;
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await 査定IDで検索する(h, id); });
  await step(3, async () => {
    await h.表示件数を選ぶ("10件");
    一覧 = (await h.行を読む()).map((r) => r.商品コード);
    expect(一覧.length, "1ページ目の表示件数（10件だけ）").toBe(10);
  });
  await step(4, async () => { records = await h.CSVを取る("検索結果全件取得"); });
  await step(5, async () => { expect(records, "ダウンロードされたCSV").not.toBeNull(); });
  await expected(async () => {
    const 期待 = Array.from({ length: 12 }, (_, i) => rc(`M0606-008-P${String(i + 1).padStart(2, "0")}`));
    const got = (records ?? []).map((r) => r["商品コード"]);
    expect.soft(got.length, "CSVのデータ行の数").toBe(12);
    expect.soft([...got].sort(), "CSVの商品コード（P01〜P12の12件）").toEqual([...期待].sort());
  });
});

// 009: 検索結果の履歴だけ（別の買取は出ない）
caseTest("IT-M06-06-009", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0606_ADMIN);
  const h = new HistoryPage(page);
  const id = notes.get("〔査定ID-M0606-009〕");
  let records: CSV = null;
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await 査定IDで検索する(h, id); });
  await step(3, async () => { records = await h.CSVを取る("検索結果全件取得"); });
  await step(4, async () => { expect(records, "ダウンロードされたCSV").not.toBeNull(); });
  await expected(async () => {
    const got = (records ?? []).map((r) => r["商品コード"]);
    expect.soft(got.length, "CSVのデータ行の数").toBe(1);
    expect.soft(got, "CSVの商品コード（M0606-009-P の行だけ）").toEqual([rc("M0606-009-P")]);
    expect.soft(got, "別の買取の商品コード M0606-009-PB（無い）").not.toContain(rc("M0606-009-PB"));
  });
});

// 016: 左から10番目は買取数（買取明細の数量）
caseTest("IT-M06-06-016", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0606_ADMIN);
  const h = new HistoryPage(page);
  const id = notes.get("〔査定ID-M0606-016〕");
  const code = rc("M0606-016-P");
  let records: CSV = null;
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await 査定IDで検索する(h, id); });
  await step(3, async () => { records = await h.CSVを取る("検索結果全件取得"); });
  let v: string[] = [];
  await step(4, async () => {
    expect(records, "ダウンロードされたCSV").not.toBeNull();
    v = Object.values((records ?? []).find((x) => x["商品コード"] === code) ?? {});
  });
  await expected(async () => {
    expect.soft(v[9], "左から10番目（買取数）").toBe("2");
  });
});

// 017: 左から12番目は増減数（変更後 − 変更前）
caseTest("IT-M06-06-017", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0606_ADMIN);
  const h = new HistoryPage(page);
  const id = notes.get("〔査定ID-M0606-017〕");
  const code = rc("M0606-017-P");
  let records: CSV = null;
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await 査定IDで検索する(h, id); });
  await step(3, async () => { records = await h.CSVを取る("検索結果全件取得"); });
  let v: string[] = [];
  await step(4, async () => {
    expect(records, "ダウンロードされたCSV").not.toBeNull();
    v = Object.values((records ?? []).find((x) => x["商品コード"] === code) ?? {});
  });
  await expected(async () => {
    expect.soft(v[11], "左から12番目（増減数）").toBe("5");
  });
});

// 018: 買取価格は単価（小計・商品設定の買取価格でない）
caseTest("IT-M06-06-018", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0606_ADMIN);
  const h = new HistoryPage(page);
  const id = notes.get("〔査定ID-M0606-018〕");
  const [c1, c2] = [rc("M0606-018-P1"), rc("M0606-018-P2")];
  let records: CSV = null;
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await 査定IDで検索する(h, id); });
  await step(3, async () => { records = await h.CSVを取る("検索結果全件取得"); });
  const csv: Record<string, number> = {};
  const 一覧: Record<string, number> = {};
  await step(4, async () => {
    expect(records, "ダウンロードされたCSV").not.toBeNull();
    for (const c of [c1, c2]) csv[c] = 数((records ?? []).find((x) => x["商品コード"] === c)?.["買取価格"]);
    for (const r of await h.行を読む()) if ([c1, c2].includes(r.商品コード)) 一覧[r.商品コード] = 数(r.買取価格);
  });
  await expected(async () => {
    expect.soft(csv[c1], "M0606-018-P1 の買取価格（CSV）").toBe(1200);
    expect.soft(csv[c2], "M0606-018-P2 の買取価格（CSV）").toBe(800);
    expect.soft(csv[c1], "M0606-018-P1 の買取価格（検索結果一覧と同じ）").toBe(一覧[c1]);
    expect.soft(csv[c2], "M0606-018-P2 の買取価格（検索結果一覧と同じ）").toBe(一覧[c2]);
    expect.soft([2400, 1500]).not.toContain(csv[c1]);
    expect.soft([3200, 1000]).not.toContain(csv[c2]);
  });
});
