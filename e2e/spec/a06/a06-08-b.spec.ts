/**
 * A06-08 カード名検索（MTGBuyer の API）の 11/20 に足したケース（002・004・009・011・022・024）。正本: cases/A06-08_test_cases.tsv。
 * 記録 review/A06-08_progress_2026-11-17_dev.md。001・012 は spec/a06/a06-08.spec.ts（判定済みのケースの指紋を変えないよう、別のファイルにした）。
 * - 要求の送り方・読み替えは a06-08.spec.ts と同じ（ケースの文のパス /api/search.json は 404 なので注記に残し、アプリの経路の応答で確かめる）。
 * - 名前はケースの文のとおり URL のクエリで送る。前方一致・記号の検索語は、シードと同じ「検索語の直後に実行の印」を入れた値にする（seeds/a06-08.ts）。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { トークンを受け取る, 名前で買取カードを探す, 応答に商品がある, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import { A0608_ADM_A, A0608の前置き } from "../../seeds/a06-08";
import "../../seeds/a06-08";

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
  await ctx.step(2, async () => { note(`要求の方式 POST・HTTP ステータス ${r.ステータス}・応答 ${r.本文.slice(0, 400) || "（空）"}`); });
  return r;
}

/** 応答の cards のキー（cards がオブジェクトでなければ null） */
function cardsのキー(r: 応答): string[] | null {
  const cards = (r.json as { cards?: unknown } | null)?.cards;
  return cards && typeof cards === "object" && !Array.isArray(cards) ? Object.keys(cards as object) : null;
}

/** 応答の中で、言語コード → 状態コードの下にある要素（languageClasses.<言語>.conditionClasses.<状態>）を全部集める */
function 言語状態の下(r: 応答, 言語: string, 状態: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const 要素を足す = (v: unknown): void => {
    if (Array.isArray(v)) { v.forEach(要素を足す); return; }
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if ("productClassId" in o) out.push(o);
      else Object.values(o).forEach(要素を足す);
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
const 数の文字 = (v: unknown) => String(v ?? "").replace(/\.0+$/, "");

caseTest("IT-A06-08-002", async (ctx) => {
  const n = (k: string) => ctx.notes.get(k);
  const 語 = A0608の前置き.前方002();
  const r = await 探す(ctx, 語, `「A06-08前方」の直後に実行の印を入れた「${語}」（商品名も「${語}アルファ」「${語}ベータ」「中間${語}」で作った）`);
  await ctx.expected(async () => {
    expect.soft(cardsのキー(r), "cards のキー").toEqual(["1", "2"]);
    expect.soft(応答に商品がある(r, n("〔商品ID-A0608-002A〕")), `「${語}アルファ」の商品ID ${n("〔商品ID-A0608-002A〕")} が返る`).toBe(true);
    expect.soft(応答に商品がある(r, n("〔商品ID-A0608-002B〕")), `「${語}ベータ」の商品ID ${n("〔商品ID-A0608-002B〕")} が返る`).toBe(true);
    expect.soft(応答に商品がある(r, n("〔商品ID-A0608-002C〕")), `「中間${語}」の商品ID ${n("〔商品ID-A0608-002C〕")} が返る`).toBe(false);
  });
});

caseTest("IT-A06-08-004", async (ctx) => {
  const [a, b, c, d] = ["A", "B", "C", "D"].map((x) => ctx.notes.get(`〔商品ID-A0608-004${x}〕`));
  const 語 = A0608の前置き.状態除外004();
  const r = await 探す(ctx, 語, `「A06-08状態除外」の直後に実行の印を入れた「${語}」（商品名も「${語}-1」〜「${語}-4」で作った）`);
  supplement("シード表の「商品削除済み」「商品規格削除済み」は、刷新後の画面では公開状態「廃止」で表すので、廃止にした商品・商品規格で確かめた");
  await ctx.expected(async () => {
    expect.soft(応答に商品がある(r, a), `削除されておらず高額商品コードの無い商品ID ${a} が返る`).toBe(true);
    expect.soft(応答に商品がある(r, b), `商品が削除済み（公開状態 廃止）の商品ID ${b} が返る`).toBe(false);
    expect.soft(応答に商品がある(r, c), `商品規格が削除済み（公開状態 廃止）の商品ID ${c} が返る`).toBe(false);
    expect.soft(応答に商品がある(r, d), `高額商品コードありの商品ID ${d} が返る`).toBe(false);
  });
});

caseTest("IT-A06-08-009", async (ctx) => {
  const id = ctx.notes.get("〔商品規格ID-A0608-009〕");
  const r = await 探す(ctx, rc("A06-08価格商品"), "商品名の末尾に実行の印を付けた値");
  await ctx.expected(async () => {
    const e = 言語状態の下(r, "JP", "NM").find((x) => 規格ID(x) === id) ?? null;
    expect.soft(e !== null, `状態コード NM の下に商品規格ID ${id} がある`).toBe(true);
    expect.soft(数の文字(e?.price), "price（基準価格 2345。販売価格 3456 ではない）").toBe("2345");
  });
});

caseTest("IT-A06-08-011", async (ctx) => {
  const id = ctx.notes.get("〔商品規格ID-A0608-011〕");
  const r = await 探す(ctx, rc("A06-08無加工商品"), "商品名の末尾に実行の印を付けた値");
  await ctx.expected(async () => {
    const e = 言語状態の下(r, "JP", "NM").find((x) => 規格ID(x) === id) ?? null;
    expect.soft(e !== null, `状態コード NM の下に商品規格ID ${id} がある`).toBe(true);
    expect.soft(数の文字(e?.buyPrice), "buyPrice（DB の買取価格 1203 のまま）").toBe("1203");
    expect.soft(数の文字(e?.price), "price（DB の基準価格 2304 のまま）").toBe("2304");
    expect.soft(String(e?.stock ?? ""), "stock（所属店舗A の EC 在庫 17 のまま）").toBe("17");
  });
});

caseTest("IT-A06-08-022", async (ctx) => {
  const n = (k: string) => ctx.notes.get(k);
  const 前 = A0608の前置き.記号022();
  const 語 = `${前}%`;
  const r = await 探す(ctx, 語, `「A0608-CB022」の直後に実行の印を入れた「${語}」（URL 上は % を %25 にして送る。商品名も「${前}%記号商品」「${前}X記号商品」で作った）`);
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    const 下 = 言語状態の下(r, "JP", "NM").map(規格ID).filter((x) => x === n("〔商品規格ID-A0608-022A〕"));
    expect.soft(下.length, `言語 JP・状態 NM の下に商品規格ID ${n("〔商品規格ID-A0608-022A〕")} が1件`).toBe(1);
    expect.soft(応答に商品がある(r, n("〔商品ID-A0608-022B〕")), `「${前}X記号商品」の商品ID ${n("〔商品ID-A0608-022B〕")} が返る`).toBe(false);
  });
});

caseTest("IT-A06-08-024", async (ctx) => {
  const n = (k: string) => ctx.notes.get(k);
  const 語 = A0608の前置き.記号なし024();
  const r = await 探す(ctx, 語, `「A0608-CB024」の直後に実行の印を入れた「${語}」（商品名も「${語}-記号なし商品」で作った）`);
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    const 下 = 言語状態の下(r, "JP", "NM").map(規格ID).filter((x) => x === n("〔商品規格ID-A0608-024A〕"));
    expect.soft(下.length, `言語 JP・状態 NM の下に商品規格ID ${n("〔商品規格ID-A0608-024A〕")} が1件`).toBe(1);
  });
});
