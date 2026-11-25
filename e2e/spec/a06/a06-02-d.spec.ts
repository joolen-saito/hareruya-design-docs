/**
 * A06-02 未完了店頭買取一覧取得（MTGBuyer の API）の追加ケース 001・012・013。正本: cases/A06-02_test_cases.tsv
 * 要求の送り方は spec/a06/a06-02-b.spec.ts と同じ（パスは /api/v1 に読み替え。課題 4239）。有効なトークンは管理者のログイン API で受け取る。
 * 書いていないケース: 003・004（本人確認・適格請求書発行事業者口座・査定担当者・フリーコメントの記載値が要る。画面の申込は適格請求書発行事業者なしで固定のため作れない）。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { 送る, トークンを受け取る, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import { A0605_ADM } from "../../seeds/a06-05";
import "../../seeds/a06-02";
import "../../seeds/a06-02-d";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

type 要素 = Record<string, unknown> & { otcBuyOrderId?: unknown; customerInfo?: Record<string, unknown> };

async function 取る(ctx: CaseCtx, 文: string): Promise<応答> {
  let r!: 応答;
  await ctx.step(1, async () => {
    supplement("ケースの文のパスは API サーバーの入口 /api/v1 に読み替えた（課題 4239）。管理者・店舗・店頭買取は、新規登録せず試験支店・決まった印つきの試験管理者に読み替えた（シードの注記）。" +
      `${文}有効なトークンは管理者のログイン API で受け取った（値は記録しない）`);
    const token = await トークンを受け取る(ctx.page, A0605_ADM.loginId, A0605_ADM.password);
    r = await 送る(ctx.page, "未完了店頭買取一覧取得", { 方式: "GET", パス: "/api/admin/otcBuyOrders.json", トークン: token });
  });
  return r;
}
const 配列 = (r: 応答): 要素[] => (Array.isArray(r.json) ? (r.json as 要素[]) : []);
const 探す = (r: 応答, id: string): 要素 | undefined => 配列(r).find((x) => String(x.otcBuyOrderId) === id);

caseTest("IT-A06-02-001", async (ctx) => {
  const r = await 取る(ctx, "クエリパラメータは付けなかった。");
  await ctx.step(2, async () => { note(`応答 HTTP ${r.ステータス}・配列 ${配列(r).length} 件`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(Array.isArray(r.json), `応答が JSON 配列（本文 ${r.本文.slice(0, 120)}）`).toBe(true);
  });
});

caseTest("IT-A06-02-012", async (ctx) => {
  const id = ctx.notes.get("〔店頭買取ID-A0602-共有C〕");
  const r = await 取る(ctx, "");
  const c = 探す(r, id);
  await ctx.step(2, async () => {
    note(`応答 HTTP ${r.ステータス}・店頭買取ID ${id} ${c ? "あり" : "なし"}・freeComment ${JSON.stringify(c?.freeComment)}・memberName ${JSON.stringify(c?.memberName)}・identificationId ${JSON.stringify(c?.identificationId)}・qualifiedInvoiceIssuerCode ${JSON.stringify(c?.qualifiedInvoiceIssuerCode)}`);
  });
  await ctx.expected(async () => {
    expect.soft(c, `店頭買取ID ${id}（査定中断）が応答配列に含まれる`).toBeDefined();
    expect.soft(c?.freeComment, "freeComment").toBeNull();
    expect.soft(c?.memberName, "memberName").toBeNull();
    expect.soft(c?.identificationId, "identificationId").toBe(0);
    expect.soft(c?.qualifiedInvoiceIssuerCode, "qualifiedInvoiceIssuerCode").toBeNull();
  });
});

caseTest("IT-A06-02-013", async (ctx) => {
  const a = ctx.notes.get("〔店頭買取ID-A0602-共有A〕");
  const b = ctx.notes.get("〔店頭買取ID-A0602-共有B〕");
  const r = await 取る(ctx, "");
  const ea = 探す(r, a);
  const eb = 探す(r, b);
  await ctx.step(2, async () => {
    note(`応答 HTTP ${r.ステータス}・共有A ${a} の address ${JSON.stringify(ea?.customerInfo?.address)}・共有B ${b} の address ${JSON.stringify(eb?.customerInfo?.address)}`);
  });
  await ctx.expected(async () => {
    expect.soft(ea?.customerInfo?.address, "国が日本の店頭買取（共有A）の address").toBe("東京都 千代田区 晴海1-1");
    expect.soft(eb?.customerInfo?.address, "日本以外の店頭買取（共有B）の address").toBe("United States 123 Main St New York, NY");
  });
});
