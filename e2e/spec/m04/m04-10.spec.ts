/**
 * M04-10 在庫移動振替CSV出力。正本: cases/M04-10_test_cases.tsv
 *
 * どのケースも「在庫移動・振替検索一覧で ID で検索 → 行にチェック → 在庫移動振替CSV出力 → DB とダウンロードした CSV を確かめる」。
 * CSV の列は、見出しの名前で引く（在庫移動振替ID・移動指示ID・移動タイプ・出庫元店舗・出庫元在庫区分・入庫先店舗・入庫先在庫区分・
 * 移動点数・基準価格合計・ステータス・出庫日・入庫日・登録者・登録日）。
 * 店舗は試験支店・本店で読み替えている（seeds/m04-10.ts）ので、店名は正本の値でなく DB の店名と比べ、そのことを注記に残す。
 */
import fs from "node:fs";
import { Page, test } from "@playwright/test";
import * as dbm from "../../db/m04_09_move";
import * as dbx from "../../db/m04_09_x";
import { expect, caseTest } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { loginAdmin } from "../../lib/session";
import { MoveTransferList } from "../../pages/admin/m04_09_move";
import "../../seeds/m04-10";
import { M0409_OP } from "../../seeds/m04-09";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

type CsvOut = { head: string[]; rows: string[][] } | null;

/** 手順1〜4: 一覧を開く → ID で検索 → 行にチェック → 在庫移動振替CSV出力（ダウンロードを受け取る） */
async function exportOne(page: Page, id: string, step: (n: number, fn: () => Promise<void>) => Promise<void>): Promise<CsvOut> {
  page.setDefaultTimeout(180_000);
  await loginAdmin(page, M0409_OP);
  const list = new MoveTransferList(page);
  let out: CsvOut = null;
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    await list.field("stock_move_transfer_id").fill(id);
    await list.pressSearch();
    note(`検索の結果に出た ID: ${(await list.listedIds()).join(", ") || "なし"}`);
  });
  await step(3, async () => { await list.check(id).check(); });
  await step(4, async () => {
    const wait = page.waitForEvent("download", { timeout: 60_000 }).then(async (d) => fs.readFileSync((await d.path())!)).catch(() => null);
    await page.locator("#stockMoveTransferCsvExport").click();
    const bytes = await wait;
    if (bytes) {
      const all = parseCsv(decodeCsvBytes(bytes)).filter((r) => r.some((c) => c));
      out = { head: all[0] ?? [], rows: all.slice(1) };
      note(`CSV: ${all.map((r) => r.join(",")).join(" / ")}`);
    } else note("CSV がダウンロードされなかった");
  });
  return out;
}

function rowOf(csv: CsvOut, id: string): Record<string, string> | null {
  if (!csv) return null;
  const r = csv.rows.find((x) => x[0] === id);
  if (!r) return null;
  return Object.fromEntries(csv.head.map((h, i) => [h, r[i] ?? ""]));
}

/** 手順5の前半: DB の在庫移動・振替と明細（注記用） */
function dbFacts(id: string): void {
  const m = dbm.在庫移動振替(id);
  note(`DB の在庫移動・振替 ${id}: ${JSON.stringify(m)}`);
  note(`DB の明細: ${JSON.stringify(dbx.明細の商品(id))}`);
}

caseTest("IT-M04-10-002", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔在庫移動振替ID-M0410-002〕");
  const csv = await exportOne(page, id, step);
  await step(5, async () => { dbFacts(id); });
  await expected(async () => {
    const r = rowOf(csv, id);
    expect(r, `CSV に ID ${id} の行がある`).not.toBeNull();
    const m = dbm.在庫移動振替(id)!;
    supplement("出庫元店舗・入庫先店舗は、正本の「CSV共通店舗-002」「CSV移動先店舗-002」の代わりに、読み替えた試験支店・本店の店名（DB の値）と比べた");
    expect.soft(r!["在庫移動振替ID"], "第1項目（在庫移動振替ID）").toBe(id);
    expect.soft(r!["移動タイプ"], "第3項目（移動タイプ）").toBe("在庫移動");
    expect.soft(r!["出庫元店舗"], "第4項目（出庫元店舗＝DB の店名）").toBe(m.出庫元店舗);
    expect.soft(r!["出庫元在庫区分"], "第5項目（出庫元在庫区分）").toBe("ECCUBE");
    expect.soft(r!["入庫先店舗"], "第6項目（入庫先店舗＝DB の店名）").toBe(m.入庫先店舗);
    expect.soft(r!["入庫先在庫区分"], "第7項目（入庫先在庫区分）").toBe("スマレジ");
    expect.soft(r!["ステータス"], "第10項目（ステータス）").toBe("移動中");
    expect.soft(r!["出庫元在庫区分"], "第5項目が DB の在庫区分名と一致").toBe(m.出庫元在庫区分);
    expect.soft(r!["入庫先在庫区分"], "第7項目が DB の在庫区分名と一致").toBe(m.入庫先在庫区分);
    expect.soft(r!["ステータス"], "第10項目が DB のステータス名と一致").toBe(m.ステータス);
  });
});

/** 005・006・014〜016: 手順1〜5 を流し、CSV の ID の行を返す */
async function prep(page: Page, notes: { get: (k: string) => string }, step: (n: number, fn: () => Promise<void>) => Promise<void>, n: string): Promise<{ id: string; r: Record<string, string> | null }> {
  const id = notes.get(`〔在庫移動振替ID-M0410-${n}〕`);
  const csv = await exportOne(page, id, step);
  await step(5, async () => { dbFacts(id); });
  return { id, r: rowOf(csv, id) };
}


caseTest("IT-M04-10-005", async ({ page, notes, step, expected }) => {
  const x = await prep(page, notes, step, "005");
  await expected(async () => {
    expect(x.r, `CSV に ID ${x.id} の行がある`).not.toBeNull();
    expect.soft(x.r!["移動点数"], "移動点数が明細の値（の合計）と一致").toBe("2");
  });
});
caseTest("IT-M04-10-006", async ({ page, notes, step, expected }) => {
  const x = await prep(page, notes, step, "006");
  await expected(async () => {
    expect(x.r, `CSV に ID ${x.id} の行がある`).not.toBeNull();
    expect.soft(x.r!["基準価格合計"], "基準価格合計が明細の値（の合計）と一致").toBe("3000");
  });
});

caseTest("IT-M04-10-007", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔在庫移動振替ID-M0410-007〕");
  const csv = await exportOne(page, id, step);
  await step(5, async () => { dbFacts(id); note(`DB の出庫日時: ${JSON.stringify(dbx.移動の日時と送り状(id))}`); note(`DB のステータス変更履歴: ${JSON.stringify(dbm.ステータス変更履歴(id))}`); });
  await expected(async () => {
    const r = rowOf(csv, id);
    expect(r, `CSV に ID ${id} の行がある`).not.toBeNull();
    const got = (r!["出庫日"] ?? "").replace(/\//g, "-");
    note(`CSV の出庫日（そのまま）: ${r!["出庫日"]}`);
    expect.soft(got.slice(0, 16), "出庫日が、移動中になった日時 2026-08-01 10:00 と一致（日付の区切りの / は - とみなす）").toBe("2026-08-01 10:00");
  });
});

caseTest("IT-M04-10-014", async ({ page, notes, step, expected }) => {
  const x = await prep(page, notes, step, "014");
  await expected(async () => {
    expect(x.r, `CSV に ID ${x.id} の行がある`).not.toBeNull();
    expect.soft(x.r!["移動点数"], "移動点数が明細の値（の合計）と一致").toBe("1");
  });
});
caseTest("IT-M04-10-015", async ({ page, notes, step, expected }) => {
  const x = await prep(page, notes, step, "015");
  await expected(async () => {
    expect(x.r, `CSV に ID ${x.id} の行がある`).not.toBeNull();
    expect.soft(x.r!["移動点数"], "移動点数が明細の値（の合計）と一致").toBe("3");
  });
});
caseTest("IT-M04-10-016", async ({ page, notes, step, expected }) => {
  const x = await prep(page, notes, step, "016");
  await expected(async () => {
    expect(x.r, `CSV に ID ${x.id} の行がある`).not.toBeNull();
    expect.soft(x.r!["基準価格合計"], "基準価格合計が明細の値（の合計）と一致").toBe("1000");
  });
});
