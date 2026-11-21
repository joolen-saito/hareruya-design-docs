/**
 * M06-08 買取集計データ(検索入力)（追加分）。正本: cases/M06-08_test_cases.tsv（009・010・012）
 *
 * シードは seeds/m06-08-e.ts（seeds/m06-08.ts と同じ作り方。東京店・大阪店は試験店舗 A・B に代える。部門は既存の「カード」「サプライ」で、期待の D01・D02 は実際のコードとして読む）。
 * 実装しないケースと理由（報告）: 006・014（共有の追加システム設定の端数調整部門を書き換え、買取集計バッチ B06-02 を実行する必要がある）。
 */
import { test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { M0608SummaryPage } from "../../pages/admin/m06_08_summary";
import { M0608_ADMIN, 既存の部門, 店舗の注記, 部門の注記 } from "../../seeds/m06-08";
import "../../seeds/m06-08-e";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

type 行 = { 部門コード: string; 部門: string; 買取金額: number; 販売金額: number };
type 日別 = 行 & { 集計日: string };
const 行にする = (d: { 部門コード: string; 部門名: string }, 買取金額: number, 販売金額: number): 行 => ({ 部門コード: d.部門コード, 部門: d.部門名, 買取金額, 販売金額 });
const コード順 = <T extends { 部門コード: string }>(rows: T[]): T[] => [...rows].sort((a, b) => a.部門コード.localeCompare(b.部門コード));
const 日別の順 = (rows: 日別[]): 日別[] => [...rows].sort((a, b) => a.集計日.localeCompare(b.集計日) || a.部門コード.localeCompare(b.部門コード));

const 全店の注記 = "手順2の「部門と買取店舗を未選択」は、デフォルト検索表示店舗が全店の管理者なので、検索欄の初期のまま（未選択）で検索した。ほかの店舗の買取集計データが期間内に無いことは、シードで DB を参照して確かめた";

async function 手順(ctx: CaseCtx, no: string, 期間: [string, string]): Promise<M0608SummaryPage> {
  await loginAdmin(ctx.page, M0608_ADMIN(no));
  const s = new M0608SummaryPage(ctx.page);
  await ctx.step(1, async () => { await s.open(); });
  await ctx.step(2, async () => {
    await s.集計日を入れる(期間[0], 期間[1]);
    expect(await s.選択中の部門(), "部門の選択（未選択のまま）").toEqual([]);
    expect(await s.選択中の店舗(), "買取店舗の選択（未選択のまま）").toEqual([]);
    await s.検索する();
  });
  return s;
}

caseTest("IT-M06-08-009", async (ctx) => {
  const s = await 手順(ctx, "009", ["2026-09-01", "2026-09-01"]);
  const カード = 既存の部門("カード"), サプライ = 既存の部門("サプライ");
  await ctx.expected(async () => {
    const 全体 = コード順(await s.期間全体の行());
    // 全部門・全店舗が対象: カードは東京店（1000+2000）と大阪店（600）、サプライは東京店（400）が合算される
    expect.soft(全体, "期間全体の集計（カード=東京店3000+大阪店600の買取3600・販売7700、サプライ=東京店だけの買取400・販売500）")
      .toEqual(コード順([行にする(カード, 3600, 7700), 行にする(サプライ, 400, 500)]));
    note(`${全店の注記}。${店舗の注記}。${部門の注記}`);
  });
});

caseTest("IT-M06-08-010", async (ctx) => {
  const s = await 手順(ctx, "010", ["2026-09-01", "2026-09-01"]);
  const カード = 既存の部門("カード"), サプライ = 既存の部門("サプライ");
  await ctx.step(3, async () => { await s.期間全体の行(); });
  await ctx.expected(async () => {
    expect.soft(コード順(await s.期間全体の行()), "期間全体の集計（部門ごと。カード=買取3600・販売7700、サプライ=買取400・販売500）")
      .toEqual(コード順([行にする(カード, 3600, 7700), 行にする(サプライ, 400, 500)]));
    note(`${全店の注記}。${店舗の注記}。${部門の注記}`);
  });
});

caseTest("IT-M06-08-012", async (ctx) => {
  const s = await 手順(ctx, "012", ["2026-09-01", "2026-09-02"]);
  const カード = 既存の部門("カード"), サプライ = 既存の部門("サプライ");
  await ctx.step(3, async () => { await s.日別の行(); });
  const 日 = (d: string, r: 行): 日別 => ({ 集計日: d, ...r });
  await ctx.expected(async () => {
    expect.soft(日別の順(await s.日別の行()), "日別の集計（2026/09/01 はカード=買取3600・販売7700 とサプライ=買取400・販売500、2026/09/02 はカード=買取800・販売900）")
      .toEqual(日別の順([日("2026/09/01", 行にする(カード, 3600, 7700)), 日("2026/09/01", 行にする(サプライ, 400, 500)), 日("2026/09/02", 行にする(カード, 800, 900))]));
    note(`${全店の注記}。${店舗の注記}。${部門の注記}`);
  });
});
