/**
 * A06-08 カード名検索（MTGBuyer の API）。正本: cases/A06-08_test_cases.tsv。記録 review/A06-08_progress_2026-11-17_dev.md。
 * - 要求の送り方は pages/admin/a06_mtgbuyer_api.ts（A06-01 と同じ）。認証は、手順1の前に管理者のログイン API で受け取ったトークンを付ける。
 * - ケースの文のパス `/api/search.json` は 404（2026-11-17 に確かめた）。手順1でケースの文のパスにも送って注記に残し、アプリの経路
 *   （拡張子なしの …/search）の応答で確かめる。名前はケースの文のとおり URL のクエリで送る。商品名には実行の印が付く。
 * - 書いたのは 001・012。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { トークンを受け取る, 名前で買取カードを探す, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import { A0608_ADM_A } from "../../seeds/a06-08";
import "../../seeds/a06-08";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

async function 探す(ctx: CaseCtx, 名前: string): Promise<応答> {
  supplement("管理者は決まった印（-E2E）を付けた値。認証は手順1の前に管理者のログイン API で受け取ったトークンを付けた（値は記録しない）。ケースの文のパス（/api/search.json）は 404 なので、アプリの経路（/api/v1/search）の応答で確かめた。店舗A は本店に読み替えた");
  const token = await トークンを受け取る(ctx.page, A0608_ADM_A.loginId, A0608_ADM_A.password);
  let r!: 応答;
  await ctx.step(1, async () => {
    const 文 = await 名前で買取カードを探す(ctx.page, "カード名検索（ケースの文のパス）", 名前, "文のとおり", token);
    note(`ケースの文のパス（入口を /api/v1 に読み替え）は HTTP ${文.ステータス}`);
    r = await 名前で買取カードを探す(ctx.page, "カード名検索（アプリの経路）", 名前, "アプリの経路", token);
  });
  await ctx.step(2, async () => { note(`要求の方式 POST・HTTP ステータス ${r.ステータス}・応答 ${r.本文.slice(0, 300) || "（空）"}`); });
  return r;
}

caseTest("IT-A06-08-001", async (ctx) => {
  const r = await 探す(ctx, rc("A06-08基本商品"));
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "POST 要求の HTTP ステータス").toBe(200);
    expect.soft(r.json !== null && typeof r.json === "object", "応答が JSON 形式").toBe(true);
  });
});

caseTest("IT-A06-08-012", async (ctx) => {
  const r = await 探す(ctx, "A06-08不存在");
  await ctx.expected(async () => { expect(r.ステータス, "HTTP ステータス").toBe(404); });
});
