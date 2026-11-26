/**
 * A06-02 未完了店頭買取一覧取得（MTGBuyer の API。GET …/admin/otcBuyOrders.json）の追加ケース 021。正本: cases/A06-02_test_cases.tsv
 * 要求の送り方は spec/a06/a06-02.spec.ts と同じ（パスは /api/v1 に読み替え。課題 4239）。有効なトークンは管理者のログイン API で受け取る。
 * 店舗 Y は本店で読み替える（シードの注記）。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { 送る, トークンを受け取る, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import { A0605_ADM } from "../../seeds/a06-05";
import "../../seeds/a06-02";
import "../../seeds/a06-02-c";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

function 流す(番号: string, 期待: (含む: boolean, r: 応答) => void) {
  return async (ctx: CaseCtx): Promise<void> => {
    const id = ctx.notes.get(`〔店頭買取ID-A0602-${番号}〕`);
    let r!: 応答;
    await ctx.step(1, async () => {
      supplement("ケースの文のパスは API サーバーの入口 /api/v1 に読み替えた（課題 4239）。管理者・店舗は、新規登録せず試験支店（管理者の所属）・本店（店頭買取の店舗）・決まった印つきの試験管理者に読み替えた（シードの注記）。有効なトークンは管理者のログイン API で受け取った（値は記録しない）");
      const token = await トークンを受け取る(ctx.page, A0605_ADM.loginId, A0605_ADM.password);
      r = await 送る(ctx.page, "未完了店頭買取一覧取得", { 方式: "GET", パス: "/api/admin/otcBuyOrders.json", トークン: token });
    });
    await ctx.step(2, async () => {
      const arr = Array.isArray(r.json) ? (r.json as { otcBuyOrderId?: unknown }[]) : [];
      note(`応答 HTTP ${r.ステータス}・配列 ${arr.length} 件・店頭買取ID ${id} ${arr.some((x) => String(x.otcBuyOrderId) === id) ? "あり" : "なし"}`);
    });
    await ctx.expected(async () => {
      expect.soft(Array.isArray(r.json), `応答が JSON 配列（HTTP ${r.ステータス}・本文 ${r.本文.slice(0, 120)}）`).toBe(true);
      const arr = Array.isArray(r.json) ? (r.json as { otcBuyOrderId?: unknown }[]) : [];
      期待(arr.some((x) => String(x.otcBuyOrderId) === id), r);
    });
  };
}
caseTest("IT-A06-02-021", 流す("021", (含む) => { expect.soft(含む, "別の店舗の店頭買取ID が応答配列に含まれない").toBe(false); }));
