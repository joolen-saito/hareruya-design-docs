/**
 * M04-10 在庫移動振替CSV出力（003・004・009・010）。正本: cases/M04-10_test_cases.tsv
 * 一覧で検索 → 行にチェック → 在庫移動振替CSV出力 → DB とダウンロードした CSV を確かめる（spec/m04/m04-10.spec.ts と同じ流れ）。
 * 正本の外の補い:
 * - 在庫移動振替ID 410002・410101010・410102・410103010 は固定の番号を共有の環境へ書けないので、画面の在庫振替登録で作った番号に読み替えた（実行の印つきの商品コードから DB で引く）。
 * - 店舗は試験支店・本店で読み替えたので、店名は正本の値でなく DB の店名と比べる。
 * - 在庫振替の完了の状態は、画面の表示名が「入庫済み」。期待結果の「入庫完了」とそのまま比べる（違えば正本の問題として判定する）。
 * - 004・010 の検索は出庫元店舗に試験支店を選ぶ（入庫先店舗は空なので、必須の欄を全店舗で補う）。
 */
import fs from "node:fs";
import { Page, test } from "@playwright/test";
import * as dbm from "../../db/m04_09_move";
import { 最新の履歴 } from "../../db/m04_10_b";
import { expect, caseTest } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { loginAdmin } from "../../lib/session";
import { MoveTransferList, 店A } from "../../pages/admin/m04_09_move";
import "../../seeds/m04-10-b";
import { コード } from "../../seeds/m04-10-b";
import { M0409_OP } from "../../seeds/m04-09";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

type CsvOut = { head: string[]; rows: string[][] } | null;
type Step = (n: number, fn: () => Promise<void>) => Promise<void>;

/** 商品コードから、画面で作った在庫振替の番号を引く */
function 番号(code: string): string {
  const ids = dbm.商品の在庫移動振替(code);
  if (ids.length !== 1) throw new Error(`商品コード ${code} の在庫移動・振替が ${ids.length} 件（1件のはず）`);
  return ids[0];
}

/** 手順1〜4: 一覧を開く → 検索（ID または出庫元店舗）→ 行にチェック → 在庫移動振替CSV出力 */
async function exportRows(page: Page, ids: string[], step: Step, 検索: { id: string } | { 出庫元店舗: string }): Promise<CsvOut> {
  page.setDefaultTimeout(180_000);
  await loginAdmin(page, M0409_OP);
  const list = new MoveTransferList(page);
  let out: CsvOut = null;
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    if ("id" in 検索) await list.field("stock_move_transfer_id").fill(検索.id);
    else await page.locator("#admin_search_stock_move_transfer_move_from_base_info").selectOption({ label: 検索.出庫元店舗 });
    await list.pressSearch();
    note(`検索の結果に出た ID（先頭から最大20件）: ${(await list.listedIds()).slice(0, 20).join(", ") || "なし"}`);
  });
  await step(3, async () => { for (const id of ids) await list.check(id).check(); });
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

function dbFacts(id: string): void {
  note(`DB の在庫移動・振替 ${id}: ${JSON.stringify(dbm.在庫移動振替(id))}`);
  note(`DB のステータス変更履歴: ${JSON.stringify(dbm.ステータス変更履歴(id))}`);
}

caseTest("IT-M04-10-003", async ({ page, step, expected }) => {
  const id = 番号(コード.共有());
  const csv = await exportRows(page, [id], step, { id });
  await step(5, async () => { dbFacts(id); });
  await expected(async () => {
    const r = rowOf(csv, id);
    expect(r, `CSV に ID ${id} の行がある`).not.toBeNull();
    const m = dbm.在庫移動振替(id)!;
    supplement("店名は、正本の「CSV共通店舗」の代わりに、読み替えた試験支店の店名（DB の値）と比べた。在庫移動振替ID 410002 は画面が振った番号に読み替えた");
    expect.soft(r!["在庫移動振替ID"], "第1項目（在庫移動振替ID）").toBe(id);
    expect.soft(r!["移動タイプ"], "第3項目（移動タイプ）").toBe("在庫振替");
    expect.soft(r!["出庫元店舗"], "第4項目（出庫元店舗＝DB の店名）").toBe(m.出庫元店舗);
    expect.soft(r!["出庫元在庫区分"], "第5項目（出庫元在庫区分）").toBe("ECCUBE");
    expect.soft(r!["入庫先店舗"], "第6項目（入庫先店舗＝DB の店名）").toBe(m.出庫元店舗);
    expect.soft(r!["入庫先在庫区分"], "第7項目（入庫先在庫区分）").toBe("ECCUBE");
    expect.soft(r!["ステータス"], "第10項目（ステータス）").toBe("入庫完了");
    expect.soft(r!["入庫先店舗"], "入庫先店舗が出庫元と同一").toBe(r!["出庫元店舗"]);
    expect.soft(r!["入庫先在庫区分"], "入庫先在庫区分が出庫元と同一").toBe(r!["出庫元在庫区分"]);
  });
});

caseTest("IT-M04-10-004", async ({ page, notes, step, expected }) => {
  const shared = 番号(コード.共有());
  const id = notes.get("〔在庫移動振替ID-M0410-004〕");
  const 指示 = notes.get("〔移動指示ID-M0410-004〕");
  const csv = await exportRows(page, [id, shared], step, { 出庫元店舗: 店A });
  await step(5, async () => { dbFacts(id); dbFacts(shared); });
  await expected(async () => {
    const r4 = rowOf(csv, id);
    const r2 = rowOf(csv, shared);
    expect(r4, `CSV に ID ${id} の行がある`).not.toBeNull();
    expect(r2, `CSV に ID ${shared}（410002 の読み替え）の行がある`).not.toBeNull();
    expect.soft(r4!["移動指示ID"], `移動指示が登録済みの ID ${id} の移動指示ID`).toBe(指示);
    expect.soft(r2!["移動指示ID"], `移動指示が未登録の ID ${shared} の移動指示ID（空）`).toBe("");
  });
});

caseTest("IT-M04-10-009", async ({ page, step, expected }) => {
  const id = 番号(コード.共有());
  const csv = await exportRows(page, [id], step, { id });
  await step(5, async () => { dbFacts(id); note(`DB の最新のステータス変更履歴: ${JSON.stringify(最新の履歴(id))}`); });
  await expected(async () => {
    const r = rowOf(csv, id);
    expect(r, `CSV に ID ${id} の行がある`).not.toBeNull();
    note(`CSV の入庫日（そのまま）: ${r!["入庫日"]}`);
    const got = (r!["入庫日"] ?? "").replace(/\//g, "-");
    expect.soft(got.slice(0, 16), "入庫日が、入庫完了になった日時 2026-08-02 12:00 と一致（日付の区切りの / は - とみなす）").toBe("2026-08-02 12:00");
  });
});

caseTest("IT-M04-10-010", async ({ page, step, expected }) => {
  const a = 番号(コード.比較("010A")), b = 番号(コード.比較("010B")), c = 番号(コード.比較("010C"));
  const csv = await exportRows(page, [a, b], step, { 出庫元店舗: 店A });
  await step(5, async () => { dbFacts(a); dbFacts(b); dbFacts(c); });
  await expected(async () => {
    supplement("在庫移動振替ID 410101010・410102・410103010 は画面が振った番号に読み替えた。検索対象外店舗は本店");
    expect(csv, "CSV がダウンロードされた").not.toBeNull();
    const ids = csv!.rows.map((r) => r[0]);
    expect.soft(ids.sort(), "CSV のデータレコードは検索結果の2件だけ").toEqual([a, b].sort());
    expect.soft(ids, `検索条件に一致しない ID ${c} が含まれない`).not.toContain(c);
  });
});
