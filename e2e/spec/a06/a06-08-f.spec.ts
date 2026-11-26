/**
 * A06-08 カード名検索（MTGBuyer の API）の続き: 006（同じ組に複数の規格→1件だけ）・023（記号「_」を含む検索語で複数の規格→1件だけ）。
 * 正本: cases/A06-08_test_cases.tsv。送り方・読み替えは a06-08-b.spec.ts と同じ（ケースの文のパス /api/search.json は 404 なので注記に残し、アプリの経路の応答で確かめる）。
 * 書かないケース: 005（関連の欠けた8商品が要り、DB の書き足しの部品が無い。記録に理由）。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { トークンを受け取る, 名前で買取カードを探す, 応答に商品がある, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import { A0608_ADM_A } from "../../seeds/a06-08";
import { 前置き023 } from "../../seeds/a06-08-f";
import { rc } from "../../lib/run_marker";
import "../../seeds/a06-08";
import "../../seeds/a06-08-f";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

async function 探す(ctx: CaseCtx, 名前: string, 印の入れ方: string): Promise<応答> {
  supplement("管理者は決まった印（-E2E）を付けた値。認証は手順1の前に管理者のログイン API で受け取ったトークンを付けた（値は記録しない）。" +
    "ケースの文のパス（/api/search.json）は 404 なので、注記に残してアプリの経路（入口 /api/v1・拡張子なしの …/search）の応答で確かめた。" +
    `店舗A は本店に読み替えた。検索語: ${印の入れ方}`);
  const token = await トークンを受け取る(ctx.page, A0608_ADM_A.loginId, A0608_ADM_A.password);
  let r!: 応答;
  await ctx.step(1, async () => {
    const 文 = await 名前で買取カードを探す(ctx.page, "カード名検索（ケースの文のパス）", 名前, "文のとおり", token);
    note(`ケースの文のパス（入口を /api/v1 に読み替え）は HTTP ${文.ステータス}`);
    r = await 名前で買取カードを探す(ctx.page, "カード名検索（アプリの経路）", 名前, "アプリの経路", token);
  });
  return r;
}

/** 応答の中で、言語コード → 状態コードの下にある規格の要素を全部集める */
function 言語状態の下(r: 応答, 言語: string, 状態: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const 要素を足す = (v: unknown): void => {
    if (Array.isArray(v)) { v.forEach(要素を足す); return; }
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if ("productClassId" in o) out.push(o); else Object.values(o).forEach(要素を足す);
    }
  };
  const 探す = (v: unknown): void => {
    if (Array.isArray(v)) { v.forEach(探す); return; }
    if (!v || typeof v !== "object") return;
    const o = v as Record<string, unknown>;
    const lc = o.languageClasses as Record<string, unknown> | undefined;
    if (lc && typeof lc === "object") {
      const cc = (lc[言語] as { conditionClasses?: Record<string, unknown> } | undefined)?.conditionClasses;
      if (cc && typeof cc === "object" && 状態 in cc) 要素を足す(cc[状態]);
    }
    Object.values(o).forEach(探す);
  };
  探す(r.json);
  return out;
}
const 規格ID = (e: Record<string, unknown>) => String(e.productClassId ?? "");

caseTest("IT-A06-08-006", async (ctx) => {
  const n = (k: string) => ctx.notes.get(k);
  const 語 = rc("A06-08重複商品");
  const r = await 探す(ctx, 語, `実行の印つきの商品名「${語}」`);
  await ctx.step(2, async () => { note(`要求の方式 POST・HTTP ステータス ${r.ステータス}・応答 ${r.本文.slice(0, 600) || "（空）"}`); });
  const A = n("〔商品規格ID-A0608-006A〕"), B = n("〔商品規格ID-A0608-006B〕");
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    const 下 = 言語状態の下(r, "JP", "NM").map(規格ID).filter((x) => x === A || x === B);
    expect.soft(下.length, `同じカード詳細・言語 JP・状態 NM の下に含まれる商品規格（${A}・${B} のうち。実際 ${下.join("・") || "なし"}）が1件だけ`).toBe(1);
  });
});

caseTest("IT-A06-08-023", async (ctx) => {
  const n = (k: string) => ctx.notes.get(k);
  const 語 = `${前置き023()}_`;
  const r = await 探す(ctx, 語, `「A0608-CB023-A」の直後に実行の印を入れた「${語}」（商品名も「${前置き023()}_記号商品」「${前置き023()}Y記号商品」で作った）`);
  await ctx.step(2, async () => { note(`要求の方式 POST・HTTP ステータス ${r.ステータス}・応答 ${r.本文.slice(0, 600) || "（空）"}`); });
  const A1 = n("〔商品規格ID-A0608-023A1〕"), A2 = n("〔商品規格ID-A0608-023A2〕");
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(応答に商品がある(r, n("〔商品ID-A0608-023A〕")), `商品ID ${n("〔商品ID-A0608-023A〕")} が返る`).toBe(true);
    expect.soft(応答に商品がある(r, n("〔商品ID-A0608-023B〕")), `商品ID ${n("〔商品ID-A0608-023B〕")}（名前の「A」の次が「Y」）が返らない`).toBe(false);
    const 下 = 言語状態の下(r, "JP", "NM").map(規格ID).filter((x) => x === A1 || x === A2);
    expect.soft(下.length, `カード詳細 ${n("〔カード詳細ID-A0608-023A〕")}・JP・NM の下の商品規格（${A1}・${A2} のうち。実際 ${下.join("・") || "なし"}）が1件だけ`).toBe(1);
  });
});
