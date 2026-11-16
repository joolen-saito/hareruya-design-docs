/**
 * M06-01 買取一覧(検索入力・検索結果)。正本: cases/M06-01_test_cases.tsv（2026-11-12 に足した 020・022・024）
 *
 * シードは seeds/m06-01-db.ts（申込者の姓に実行の印を付けた店頭買取査定申込。画面で指定できない日時・金額・棚戻し済みは、
 * E2E が作った実行の印つきの買取にだけ DB で書く）。ほかの方の買取は消さない。
 * 日時の欄は日付と時刻の入力欄なので、正本の日付（2026/08/10 など）は、その日の 00:00 として入れる（手順の注記に残す）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { OtcListPage, 一覧の行 } from "../../pages/admin/m06_otc_list";
import { M0601_ADMIN_ALL } from "../../seeds/m06-01";
import "../../seeds/m06-01-db";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 日時の注記 = "査定申込日時・買取日時の欄は日付と時刻の入力欄なので、正本の日付はその日の 00:00 として入れた";

/** 検索結果を、探す査定IDがそろうまでページを送って読む（ほかの方の買取も同じ条件に当たるため） */
async function 結果を読む(list: OtcListPage, 探す: string[]): Promise<一覧の行[]> {
  const rows = await list.行を順に読む(20, 探す);
  note(`検索結果の該当件数 ${await list.該当件数()} 件のうち、${rows.length} 行を読んだ（探す査定ID ${探す.join("・")} がそろうまで、最大20ページ）`);
  return rows;
}

caseTest("IT-M06-01-020", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const a = notes.get("〔査定ID-M0601-020A〕"), b = notes.get("〔査定ID-M0601-020B〕");
  let rows: 一覧の行[] = [];
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    await list.日時を空にする();
    await list.日時の範囲を入れる("査定申込日時", "2026/08/10", "2026/08/20");
    note(`${日時の注記}（入れた値: From「${await list.欄の値("査定申込日時From")}」・To「${await list.欄の値("査定申込日時To")}」。買取日時は空）`);
    await list.検索する();
    rows = await 結果を読む(list, [a]);
  });
  await expected(async () => {
    const ids = rows.map((r) => r.査定ID);
    expect.soft(ids, `査定申込日時が範囲内（2026-08-15）の査定ID ${a} が表示される`).toContain(a);
    expect.soft(ids, `査定申込日時が範囲外（2026-08-09）の査定ID ${b} は表示されない`).not.toContain(b);
    expect.soft(ids, `一覧に表示された査定ID（${a} だけ）`).toEqual([a]);
  });
});

caseTest("IT-M06-01-022", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const a = notes.get("〔査定ID-M0601-022A〕"), b = notes.get("〔査定ID-M0601-022B〕");
  let rows: 一覧の行[] = [];
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.日時を空にする(); });
  await step(3, async () => {
    await list.日時の範囲を入れる("買取日時", "2026/08/15", "2026/08/16");
    note(`${日時の注記}（入れた値: From「${await list.欄の値("買取日時From")}」・To「${await list.欄の値("買取日時To")}」。査定申込日時は空）`);
    await list.検索する();
    rows = await 結果を読む(list, [a, b]);
  });
  await expected(async () => {
    const ids = rows.map((r) => r.査定ID);
    expect.soft(ids, `買取成立日が 2026-08-15 の査定ID ${a} が表示される`).toContain(a);
    expect.soft(ids, `買取キャンセル日が 2026-08-16 の査定ID ${b} が表示される`).toContain(b);
    // 条件が送られて絞り込まれたこと（条件を無視した検索で、作った買取が新しい順に出て合格にならないように）
    expect.soft([(await list.欄の値("買取日時From")).slice(0, 16), (await list.欄の値("買取日時To")).slice(0, 16)], "検索のあとも買取日時の条件が入っている（条件つきで検索された）").toEqual(["2026-08-15T00:00", "2026-08-16T00:00"]);
  });
});

caseTest("IT-M06-01-024", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-024〕");
  let rows: 一覧の行[] = [];
  let 入れた値 = { From: "", To: "" };
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    await list.買取金額の範囲を入れる("2000", "1000");
    await list.日時を空にする();
    入れた値 = { From: await list.欄の値("買取金額From"), To: await list.欄の値("買取金額To") };
    note(`買取金額の欄に入れた値: From「${入れた値.From}」・To「${入れた値.To}」。ほかの方の買取も同じ金額帯に当たるので、査定IDの行がそろうまでページを送って読んだ`);
    await list.検索する();
    rows = await 結果を読む(list, [id]);
  });
  await expected(async () => {
    const r = rows.find((x) => x.査定ID === id);
    expect.soft(r?.査定ID, `買取金額 1500 円の査定ID ${id} が一覧に表示される（From・To を入れ替えて検索された）`).toBe(id);
    expect.soft(r?.買取金額.replace(/[^\d]/g, ""), `査定ID ${id} の行の買取金額`).toBe("1500");
    // 条件が効いて絞り込まれたこと（条件を無視した検索で、作った買取が新しい順に出て合格にならないように）
    const 外 = rows.filter((x) => { const v = Number(x.買取金額.replace(/[^\d]/g, "")); return !(v >= 1000 && v <= 2000); }).map((x) => `${x.査定ID}（${x.買取金額}）`);
    expect.soft(外, "読んだ行のうち、買取金額が 1000〜2000 円の外の行（無いこと）").toEqual([]);
  });
});
