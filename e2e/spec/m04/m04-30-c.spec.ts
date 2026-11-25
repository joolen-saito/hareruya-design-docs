/**
 * M04-30 バーコード貼替リストCSV出力の続き（その2: カードの並び順 008・010〜014 と、言語・状態の列 021〜023。シードは seeds/m04-30-c.ts）。
 * 以下は spec/m04/m04-30-b.spec.ts と同じ書き出し。
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
import "../../seeds/m04-30-c";

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


const 順 = (rows: 行[] | null): string[] => ids(rows);

/** 出力順のケースの処理（手順1〜5は exportCsv、手順6は出力順の確認） */
function 並び(from: string, 期待: string[], 理由: string) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const rows = await exportCsv(page, notes, step, from, from);
    await step(6, async () => { note(`スマレジ商品IDの出力順: ${順(rows).join("、")}`); });
    await expected(async () => {
      expect(rows, "CSV がダウンロードされる").not.toBeNull();
      expect.soft(順(rows), `データ行がスマレジ商品ID「${期待.join("、")}」の順に出力される（${理由}）`).toEqual(期待);
    });
  };
}

caseTest("IT-M04-30-008", 並び("2026-08-16", ["SID-S02-008", "SID-S01-008", "SID-S03-008", "SID-S04-008", "SID-S05-008"], "色の並び順→カードタイプの並び順→マナコスト→基準価格の高い順"));
caseTest("IT-M04-30-010", 並び("2026-09-01", ["M0430-CB010-B", "M0430-CB010-A"], "色の並び順"));
caseTest("IT-M04-30-011", 並び("2026-09-02", ["M0430-CB011-B", "M0430-CB011-A"], "カードタイプの並び順"));
caseTest("IT-M04-30-012", 並び("2026-09-03", ["M0430-CB012-B", "M0430-CB012-A"], "マナコスト"));
caseTest("IT-M04-30-013", 並び("2026-09-04", ["M0430-CB013-B", "M0430-CB013-A"], "基準価格の高い順"));
caseTest("IT-M04-30-014", 並び("2026-09-05", ["M0430-CB014-A", "M0430-CB014-B"], "すべて同じなら商品規格IDの小さい順"));

/** 言語・状態の列のケースの処理 */
function 列(日付: string, code: string, 期待: string, 説明: string) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const rows = await exportCsv(page, notes, step, 日付, 日付);
    await expected(async () => {
      expect(rows, "CSV がダウンロードされる").not.toBeNull();
      expect.soft(ids(rows), `データ行が ${code} の1行だけ`).toEqual([code]);
      expect.soft(rows?.[0]?.["言語・状態"], `言語・状態の列（${説明}）`).toBe(期待);
    });
  };
}

caseTest("IT-M04-30-021", 列("2026-09-12", "M0430-CB021-A", "英語・NM", "言語が英語・状態がNM"));
caseTest("IT-M04-30-022", 列("2026-09-13", "M0430-CB022-A", "NM", "言語が未設定・状態がNM"));
caseTest("IT-M04-30-023", 列("2026-09-14", "M0430-CB023-A", "英語", "言語が英語・状態が未設定"));
