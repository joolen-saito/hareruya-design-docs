/**
 * M04-30 バーコード貼替リストCSV出力の続き（2026-11-23 依頼者「DB の直接の設定は E2E の行だけなら流してよい」）。正本: cases/M04-30_test_cases.tsv
 * 判定済みの 001・002（spec/m04/m04-30.spec.ts）の指紋を変えないため、別のファイルにした。シードは seeds/m04-30-b.ts。
 * どのケースも「画面を開く → 出力対象店舗で店舗A（試験支店で読み替え）を選ぶ → 価格調整発生期間の From・To を入れる →
 * バーコード貼替リストCSV出力 → ダウンロードした CSV を開く」。CSV の行は、スマレジ商品IDの列（正本の値に実行の印）で見分ける。
 * 価格変更履歴の日付が重なるケース（003 と 020 の NG・005 と 006 の BEFORE・008 と 009 の BEFORE）は、番号の小さいほうから流す。
 */
import fs from "node:fs";
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { unrc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { BarcodeReplacementListPage } from "../../pages/admin/m04_30_barcode";
import { M0430_ADMIN, 店名A } from "../../seeds/m04-30";
import "../../seeds/m04-30-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

type 行 = Record<string, string>;

/** 手順1〜5: 開く → 店舗A を選ぶ → From・To → CSV出力 → CSV を開く。データ行（見出しの名前で引ける形）を返す。ダウンロードが無ければ null */
async function exportCsv(page: Page, notes: CaseCtx["notes"], step: CaseCtx["step"], from: string, to: string): Promise<行[] | null> {
  page.setDefaultTimeout(180_000);
  await loginAdmin(page, M0430_ADMIN);
  const screen = new BarcodeReplacementListPage(page);
  let bytes: Buffer | null = null;
  let rows: 行[] | null = null;
  await step(1, async () => { await screen.open(); });
  await step(2, async () => {
    await screen.chooseStore(店名A(), notes.get("〔店舗ID-M0430-共有A〕"));
    supplement(`正本の「店舗A」は、試験支店（店舗ID ${notes.get("〔店舗ID-M0430-共有A〕")}・「${店名A()}」）で読み替えた（店舗は作らない 2026-11-13）`);
  });
  await step(3, async () => {
    await screen.価格調整発生期間From.fill(from);
    await screen.価格調整発生期間To.fill(to);
    note(`価格調整発生期間 From「${await screen.価格調整発生期間From.inputValue()}」To「${await screen.価格調整発生期間To.inputValue()}」`);
  });
  await step(4, async () => {
    const wait = page.waitForEvent("download", { timeout: 120_000 }).then(async (d) => fs.readFileSync((await d.path())!)).catch(() => null);
    await screen.form.locator('button[type="submit"]').click();
    bytes = await wait;
    note(bytes ? "CSV がダウンロードされた" : "CSV がダウンロードされなかった");
  });
  await step(5, async () => {
    if (!bytes) return;
    const all = parseCsv(decodeCsvBytes(bytes)).filter((r) => r.some((c) => c));
    const head = all[0] ?? [];
    rows = all.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
    note(`CSV: ${all.map((r) => r.join(",")).join(" / ")}`);
  });
  return rows;
}

/** データ行のスマレジ商品ID（実行の印を外した正本の値） */
const ids = (rows: 行[] | null): string[] => (rows ?? []).map((r) => unrc(r["スマレジ商品ID"] ?? ""));
const sorted = (a: string[]): string[] => [...a].sort();

caseTest("IT-M04-30-003", async ({ page, notes, step, expected }) => {
  const rows = await exportCsv(page, notes, step, "2026-08-11", "2026-08-11");
  await expected(async () => {
    expect(rows, "CSV がダウンロードされる").not.toBeNull();
    expect.soft(ids(rows), "データ行が、店舗Aのスマレジ在庫数が0の STK-0-003 の1行だけ").toEqual(["STK-0-003"]);
  });
});

caseTest("IT-M04-30-004", async ({ page, notes, step, expected }) => {
  const rows = await exportCsv(page, notes, step, "2026-08-12", "2026-08-12");
  await expected(async () => {
    expect(rows, "CSV がダウンロードされる").not.toBeNull();
    note(`データ行の商品名: ${(rows ?? []).map((r) => r["商品名"]).join("、")}`);
    expect.soft(ids(rows), "データ行が、スマレジ商品IDが登録済みかつ連携有効の ATTR-OK-004 の1行だけ").toEqual(["ATTR-OK-004"]);
    expect.soft((rows ?? []).length, "データ行の数（スマレジ商品IDが空の ATTR-NOID-004 も出ない）").toBe(1);
  });
});

caseTest("IT-M04-30-005", async ({ page, notes, step, expected }) => {
  const rows = await exportCsv(page, notes, step, "2026-08-13", "2026-08-13");
  await expected(async () => {
    expect(rows, "CSV がダウンロードされる").not.toBeNull();
    expect.soft(sorted(ids(rows)), "データ行が STAT-PUBLIC-005 と非公開の STAT-NONPUBLIC-005 の2行だけ（廃止の2件を含まない）").toEqual(sorted(["STAT-PUBLIC-005", "STAT-NONPUBLIC-005"]));
  });
});

caseTest("IT-M04-30-006", async ({ page, notes, step, expected }) => {
  const rows = await exportCsv(page, notes, step, "2026-08-14", "2026-08-14");
  await expected(async () => {
    expect(rows, "CSV がダウンロードされる").not.toBeNull();
    expect.soft(sorted(ids(rows)), "データ行が 00:00:00 の TIME-FROM-006 と 23:59:59 の TIME-TO-006 の2行だけ").toEqual(sorted(["TIME-FROM-006", "TIME-TO-006"]));
  });
});

caseTest("IT-M04-30-009", async ({ page, notes, step, expected }) => {
  const rows = await exportCsv(page, notes, step, "2026-08-17", "2026-08-19");
  await expected(async () => {
    expect(rows, "CSV がダウンロードされる").not.toBeNull();
    expect.soft(ids(rows), "データ行が期間の中間日の M0430-009-MID の1行だけ（前日・翌日の2件を含まない）").toEqual(["M0430-009-MID"]);
  });
});

caseTest("IT-M04-30-015", async ({ page, notes, step, expected }) => {
  const rows = await exportCsv(page, notes, step, "2026-09-06", "2026-09-06");
  await expected(async () => {
    expect(rows, "CSV がダウンロードされる").not.toBeNull();
    expect.soft(ids(rows), "データ行が M0430-CB015-OK の1行だけ（スマレジ在庫数がマイナスの NG を含まない）").toEqual(["M0430-CB015-OK"]);
  });
});

caseTest("IT-M04-30-016", async ({ page, notes, step, expected }) => {
  const rows = await exportCsv(page, notes, step, "2026-09-07", "2026-09-07");
  await expected(async () => {
    expect(rows, "CSV がダウンロードされる").not.toBeNull();
    expect.soft(ids(rows), "データ行が M0430-CB016-OK の1行だけ（スマレジ商品IDが未登録の NG を含まない）").toEqual(["M0430-CB016-OK"]);
  });
});

caseTest("IT-M04-30-017", async ({ page, notes, step, expected }) => {
  const rows = await exportCsv(page, notes, step, "2026-09-08", "2026-09-08");
  await expected(async () => {
    expect(rows, "CSV がダウンロードされる").not.toBeNull();
    expect.soft(ids(rows), "データ行が M0430-CB017-OK の1行だけ（スマレジ連携フラグが無効の NG を含まない）").toEqual(["M0430-CB017-OK"]);
  });
});

caseTest("IT-M04-30-018", async ({ page, notes, step, expected }) => {
  const rows = await exportCsv(page, notes, step, "2026-09-09", "2026-09-09");
  await expected(async () => {
    expect(rows, "CSV がダウンロードされる").not.toBeNull();
    expect.soft(ids(rows), "データ行が M0430-CB018-OK の1行だけ（商品が廃止の NG を含まない）").toEqual(["M0430-CB018-OK"]);
  });
});

caseTest("IT-M04-30-019", async ({ page, notes, step, expected }) => {
  const rows = await exportCsv(page, notes, step, "2026-09-10", "2026-09-10");
  await expected(async () => {
    expect(rows, "CSV がダウンロードされる").not.toBeNull();
    expect.soft(ids(rows), "データ行が M0430-CB019-OK の1行だけ（商品規格が廃止の NG を含まない）").toEqual(["M0430-CB019-OK"]);
  });
});

caseTest("IT-M04-30-020", async ({ page, notes, step, expected }) => {
  const rows = await exportCsv(page, notes, step, "2026-09-11", "2026-09-11");
  await expected(async () => {
    expect(rows, "CSV がダウンロードされる").not.toBeNull();
    expect.soft(ids(rows), "データ行が M0430-CB020-OK の1行だけ（価格変更が期間外の NG を含まない）").toEqual(["M0430-CB020-OK"]);
  });
});

caseTest("IT-M04-30-024", async ({ page, notes, step, expected }) => {
  const rows = await exportCsv(page, notes, step, "2026-09-15", "2026-09-15");
  await expected(async () => {
    expect(rows, "CSV がダウンロードされる").not.toBeNull();
    expect.soft(ids(rows), "データ行が M0430-CB024-A の1行だけ").toEqual(["M0430-CB024-A"]);
    expect.soft(rows?.[0]?.["言語・状態"], "言語・状態の列（サプライ・グッズの商品）").toBe("サプライ品");
  });
});

caseTest("IT-M04-30-025", async ({ page, notes, step, expected }) => {
  const rows = await exportCsv(page, notes, step, "2026-09-16", "2026-09-16");
  await expected(async () => {
    expect(rows, "CSV がダウンロードされる").not.toBeNull();
    expect.soft(ids(rows), "データ行が M0430-CB025-A の1行だけ").toEqual(["M0430-CB025-A"]);
    expect.soft(rows?.[0]?.["スマレジバーコード"], "スマレジバーコードの列").toBe("227254300001200");
  });
});

caseTest("IT-M04-30-026", async ({ page, notes, step, expected }) => {
  const rows = await exportCsv(page, notes, step, "2026-09-17", "2026-09-17");
  await expected(async () => {
    expect(rows, "CSV がダウンロードされる").not.toBeNull();
    expect.soft(ids(rows), "データ行が M0430-CB026-A の1行だけ").toEqual(["M0430-CB026-A"]);
    expect.soft(rows?.[0]?.["スマレジバーコード"], "スマレジバーコードの列が空").toBe("");
  });
});
