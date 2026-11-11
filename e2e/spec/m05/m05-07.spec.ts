/**
 * M05-07 送り状CSV出力。正本: cases/M05-07_test_cases.tsv
 * 実装したケースと解釈は記録 review/M05-07_progress_2026-11-11_dev.md。
 * 受注情報検索 一覧(検索結果)で行を選び「送り状CSV」を押して、ダウンロードした CSV の注文番号の行を読む（列の番号は識別ID）。
 * 受注はケースごとにシードで作る（seeds/m05-07.ts）。注文番号で絞るので、ほかの方の受注は出ない。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { 受注の値, 注文番号の受注の数 } from "../../db/m05_07_24";
import { 本店の店名 } from "../../pages/admin/m05_admin_member";
import { LabelsOrderListPage, ダウンロードの結果 } from "../../pages/admin/m05_07_24_csv";
import { M0507_ADMIN, 作ったものの } from "../../seeds/m05-07";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 番号の = (ctx: CaseCtx, 呼び名: string) => ctx.notes.get(呼び名);
const 数字 = (s: string) => s.replace(/[^\d]/g, "");
const 数 = (s: string) => Number(String(s).replace(/[,\s円￥¥]/g, ""));

/** CSV のデータ行（見出し行を除く）。1列目が注文番号 */
function データ行(r: ダウンロードの結果): string[][] {
  if (!r.バイト列) return [];
  const rows = parseCsv(decodeCsvBytes(r.バイト列));
  return rows.slice(1);
}
const 注文番号の行 = (rows: string[][], 注文番号: string) => rows.filter((x) => x[0] === 注文番号);
/** 識別ID（1始まり）の値 */
const 列 = (row: string[] | undefined, id: number) => (row ? row[id - 1] ?? "（列が無い）" : "（行が無い）");

/** 手順1〜4: 一覧を開いて店舗を確かめ、注文番号（または注文者会社名）で検索し、行を選んで送り状CSVを押す */
async function 検索して出力する(ctx: CaseCtx, 検索: { 注文番号?: string; 会社名?: string }, 選ぶ: string[], 件数?: number): Promise<ダウンロードの結果> {
  const { page, step, browser } = ctx;
  await loginAdmin(page, M0507_ADMIN);
  const list = new LabelsOrderListPage(page);
  const shop = await 本店の店名(browser);
  await step(1, async () => {
    await list.open();
    const now = await list.選ばれている店舗();
    note(`選ばれている店舗: ${now.join("・") || "なし"}`);
    expect(now, "店舗の選択（本店）").toContain(shop);
  });
  await step(2, async () => {
    if (検索.注文番号 !== undefined) await list.orderNumber.fill(検索.注文番号);
    if (検索.会社名 !== undefined) {
      if (!(await list.注文者会社名の欄.isVisible().catch(() => false))) await list.showDetail();
      await list.注文者会社名の欄.fill(検索.会社名);
    }
    await list.clickSearch();
  });
  await step(3, async () => {
    const 出た = await list.結果の注文番号();
    note(`検索結果の注文番号: ${出た.join("・") || "なし"}`);
    if (件数 !== undefined) expect.soft(出た.length, `検索結果の件数（${件数}件）`).toBe(件数);
    for (const n of 選ぶ) await list.行を選ぶ(n);
  });
  let r!: ダウンロードの結果;
  await step(4, async () => {
    r = await list.送り状CSVを押す();
    note(`ダウンロード: ${r.ファイル名 ?? "なし"}・移った先: ${r.移った先 || "（移らない）"}${r.画面のエラー.length ? `・エラー「${r.画面のエラー.join(" / ")}」` : ""}`);
    expect(r.バイト列, "送り状CSVがダウンロードされた").not.toBeNull();
  });
  return r;
}

/** 1件の受注の送り状CSVを出し、注文番号の行を読んで確かめる（手順1〜5） */
function 一件(seed: string, 呼び名: string, check: (row: string[] | undefined, ctx: CaseCtx) => void | Promise<void>) {
  return async (ctx: CaseCtx): Promise<void> => {
    const 注文番号 = 番号の(ctx, 呼び名);
    void 作ったものの(seed);
    const r = await 検索して出力する(ctx, { 注文番号 }, [注文番号]);
    let rows: string[][] = [];
    await ctx.step(5, async () => {
      rows = 注文番号の行(データ行(r), 注文番号);
      note(`注文番号 ${注文番号} の行: ${rows.length} 行${rows[0] ? `（${rows[0].length} 項目）` : ""}`);
    });
    await ctx.expected(async () => {
      expect.soft(rows.length, `注文番号 ${注文番号} のデータ行の数`).toBe(1);
      await check(rows[0], ctx);
    });
  };
}

caseTest("IT-M05-07-001", 一件("S-M05-07-ORD-001", "〔注文番号-M0507-001〕", (row, ctx) => {
  expect.soft(row?.length, "データ行の項目の数（識別ID 1〜56）").toBe(56);
  expect.soft(列(row, 1), "第1項目（注文番号）").toBe(番号の(ctx, "〔注文番号-M0507-001〕"));
  expect.soft(列(row, 41), "第41項目（送り状No.）").toBe("M0507-001-TRK");
  expect.soft(列(row, 49), "第49項目（配送先会社名）").toBe("M0507-001-SCO");
}));

caseTest("IT-M05-07-002", 一件("S-M05-07-ORD-002", "〔注文番号-M0507-002〕", (row) => {
  expect.soft(列(row, 10), "識別ID 10（注文者会社）").toBe("M0507-002-CO");
  expect.soft(列(row, 23), "識別ID 23（注文コメント）").toBe("M0507-002-MSG");
  expect.soft(列(row, 41), "識別ID 41（送り状No.）").toBe("M0507-002-TRK");
  expect.soft(列(row, 49), "識別ID 49（配送先会社名）").toBe("M0507-002-SCO");
}));

caseTest("IT-M05-07-003", async (ctx) => {
  const [a, b, c] = ["A", "B", "C"].map((x) => 番号の(ctx, `〔注文番号-M0507-003${x}〕`));
  void 作ったものの("S-M05-07-ORD-003");
  const r = await 検索して出力する(ctx, { 会社名: rc("M0507-003-CO") }, [a, c], 3);
  let 出た: string[] = [];
  await ctx.step(5, async () => { 出た = データ行(r).map((x) => x[0]); note(`データ行の第1項目: ${出た.join("・") || "なし"}`); });
  await ctx.expected(async () => {
    expect.soft(出た, `${a} の行がある`).toContain(a);
    expect.soft(出た, `${c} の行がある`).toContain(c);
    expect.soft(出た, `${b} の行が無い`).not.toContain(b);
  });
});

caseTest("IT-M05-07-004", async (ctx) => {
  const 注文番号 = 番号の(ctx, "〔注文番号-M0507-004〕");
  const v = 作ったものの("S-M05-07-ORD-004");
  const r = await 検索して出力する(ctx, { 注文番号 }, [注文番号]);
  let row: string[] | undefined;
  await ctx.step(5, async () => { const rows = 注文番号の行(データ行(r), 注文番号); row = rows[0]; note(`注文番号 ${注文番号} の行: ${rows.length} 行`); });
  let db!: ReturnType<typeof 受注の値>;
  await ctx.step(6, async () => { db = 受注の値(v.受注ID[0]); note(`DB: 注文金額合計 ${db.注文金額合計}・商品金額合計 ${db.商品金額合計}・送料 ${db.送料}・手数料 ${db.手数料}`); });
  await ctx.expected(async () => {
    expect.soft(数(列(row, 2)), "識別ID 2（注文金額合計）＝DB").toBe(数(db.注文金額合計));
    expect.soft(数(列(row, 31)), "識別ID 31（商品金額合計）＝DB").toBe(数(db.商品金額合計));
    expect.soft(数(列(row, 32)), "識別ID 32（送料）＝DB").toBe(数(db.送料));
    expect.soft(数(列(row, 34)), "識別ID 34（手数料）＝DB").toBe(数(db.手数料));
    expect.soft([db.注文金額合計, db.商品金額合計, db.送料, db.手数料].map(数), "DB の値（4100・3000・800・200）").toEqual([4100, 3000, 800, 200]);
  });
});

caseTest("IT-M05-07-005", async (ctx) => {
  const 注文番号 = 番号の(ctx, "〔注文番号-M0507-005〕");
  const v = 作ったものの("S-M05-07-ORD-005");
  const before = 受注の値(v.受注ID[0]);
  note(`出力前の DB: 対応状況 ${before.対応状況}・出荷指示日 ${before.出荷指示日 || "空"}・出荷日 ${before.出荷日 || "空"}・注文金額合計 ${before.注文金額合計}・更新日時 ${before.更新日時}`);
  await 検索して出力する(ctx, { 注文番号 }, [注文番号]);
  let after!: ReturnType<typeof 受注の値>; let 件数 = 0;
  await ctx.step(5, async () => { after = 受注の値(v.受注ID[0]); 件数 = 注文番号の受注の数(注文番号); note(`出力後の DB: 対応状況 ${after.対応状況}・出荷指示日 ${after.出荷指示日 || "空"}・出荷日 ${after.出荷日 || "空"}・注文金額合計 ${after.注文金額合計}・更新日時 ${after.更新日時}・件数 ${件数}`); });
  await ctx.expected(async () => {
    expect.soft(after.対応状況, "対応状況は注文受領のまま").toBe("注文受領");
    expect.soft(after.出荷指示日, "出荷指示日は空のまま").toBe("");
    expect.soft(after.出荷日, "出荷日は空のまま").toBe("");
    expect.soft(数(after.注文金額合計), "注文金額合計は1500円のまま").toBe(1500);
    expect.soft(after.更新日時, "更新日時は 2026/03/01 10:00:00 のまま").toBe("2026/03/01 10:00:00");
    expect.soft(件数, "受注の件数は1件のまま").toBe(1);
  });
});

caseTest("IT-M05-07-006", 一件("S-M05-07-ORD-006", "〔注文番号-M0507-006〕", (row) => {
  expect.soft(列(row, 3), "識別ID 3（注文者氏名）に姓").toContain("M0507-006-SEI");
  expect.soft(列(row, 3), "識別ID 3（注文者氏名）に名").toContain("M0507-006-MEI");
  expect.soft(列(row, 4), "識別ID 4（注文者カナ）にセイ").toContain("ヨミセイロク");
  expect.soft(列(row, 4), "識別ID 4（注文者カナ）にメイ").toContain("ヨミメイロク");
  expect.soft(数字(列(row, 5)), "識別ID 5（注文者郵便番号）").toBe("5070006");
  expect.soft(列(row, 6), "識別ID 6（注文者都道府県）").toBe("愛知県");
  expect.soft(列(row, 7), "識別ID 7（注文者住所）").toBe("M0507-006-ADR1");
  expect.soft(列(row, 8), "識別ID 8（注文者住所2）").toBe("M0507-006-ADR2");
  expect.soft(列(row, 9), "識別ID 9（注文者住所3）").toBe("M0507-006-ADR3");
  expect.soft(数字(列(row, 12)), "識別ID 12（注文者電話番号）").toBe("0507000006");
}));

/** 日時の値を「年・月・日・時・分・秒」の数字にそろえる（書式・区切り文字は問わない） */
const 日時の数字 = (s: string) => (s.match(/\d+/g) ?? []).map(Number).join(",");

caseTest("IT-M05-07-007", 一件("S-M05-07-ORD-007", "〔注文番号-M0507-007〕", (row) => {
  expect.soft(日時の数字(列(row, 26)), "識別ID 26（注文確定日）2026/3/1 10:00:00").toBe("2026,3,1,10,0,0");
  expect.soft(日時の数字(列(row, 27)), "識別ID 27（出荷指示日）2026/3/2 11:00:00").toBe("2026,3,2,11,0,0");
  expect.soft(日時の数字(列(row, 28)), "識別ID 28（出荷日）2026/3/3 12:00:00").toBe("2026,3,3,12,0,0");
}));

caseTest("IT-M05-07-008", 一件("S-M05-07-ORD-008", "〔注文番号-M0507-008〕", (row) => {
  expect.soft(列(row, 42), "識別ID 42（配送先氏名）に姓").toContain("M0507-008-SEI");
  expect.soft(列(row, 42), "識別ID 42（配送先氏名）に名").toContain("M0507-008-MEI");
  expect.soft(列(row, 43), "識別ID 43（配送先カナ）にセイ").toContain("ハイソウセイキュウ");
  expect.soft(列(row, 43), "識別ID 43（配送先カナ）にメイ").toContain("ハイソウメイキュウ");
  expect.soft(数字(列(row, 44)), "識別ID 44（配送先郵便番号）").toBe("5400009");
  expect.soft(列(row, 45), "識別ID 45（配送先都道府県）").toBe("大阪府");
  expect.soft(列(row, 46), "識別ID 46（配送先住所）").toBe("M0507-008-ADR1");
  expect.soft(列(row, 47), "識別ID 47（配送先住所2）").toBe("M0507-008-ADR2");
  expect.soft(列(row, 48), "識別ID 48（配送先住所3）").toBe("M0507-008-ADR3");
  expect.soft(数字(列(row, 51)), "識別ID 51（配送先電話番号）").toBe("0507000009");
}));
