/**
 * A06-07 買取用カード一覧取得（商品ID指定。POST …/buying/products）の 005・006・009（2026-11-21 追加）。
 * 正本: cases/A06-07_test_cases.tsv。判定済みのケース（spec/a06/a06-07.spec.ts）のテストの指紋を変えないよう、ファイルを分けた。
 * 実装の解釈は記録 review/A06-07_progress_2026-11-17_dev.md。要求の送り方は pages/admin/a06_mtgbuyer_api.ts（A06-01 と同じ）。
 * - 商品IDは、ケースの文のとおり URL のクエリで送る（アプリは要求の本文から読む。ECCUBE_HARERUYA-4236）。
 *   比べるため、同じ商品IDを要求の本文で送った結果も注記に残す（判定には使わない）。
 * - 管理者の認証は、手順1の前に管理者のログイン API で受け取った認証トークンを要求に付ける形にした。店舗B は試験支店に読み替えた。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { トークンを受け取る, 商品IDで買取カードを取る, 応答に商品がある, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import { A0607_ADM_A, A0607_ADM_B } from "../../seeds/a06-07";
import "../../seeds/a06-07";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
type 管理者 = { loginId: string; password: string };

async function 取る(ctx: CaseCtx, 誰: 管理者, ids: string, 何: string, 送る手順: number, 見る手順: number): Promise<応答> {
  const token = await トークンを受け取る(ctx.page, 誰.loginId, 誰.password);
  let r!: 応答;
  await ctx.step(送る手順, async () => { r = await 商品IDで買取カードを取る(ctx.page, 何, ids, "クエリ", token); });
  await ctx.step(見る手順, async () => { note(`要求の方式 POST・商品IDはクエリ・HTTP ステータス ${r.ステータス}・応答 ${r.本文.slice(0, 400) || "（空）"}`); });
  const b = await 商品IDで買取カードを取る(ctx.page, `${何}（比べるため本文で送る）`, ids, "本文", token);
  note(`比べるため（判定には使わない）: 同じ商品IDを要求の本文で送ると HTTP ${b.ステータス}・応答 ${b.本文.slice(0, 300) || "（空）"}`);
  return r;
}
const 補いの注記 = () => supplement("管理者は決まった印（-E2E）を付けた値。API 認証は、手順1の前に管理者のログイン API で受け取った認証トークンを要求に付けた（値は記録しない）。店舗A は本店、店舗B は試験支店に読み替えた");

/** 応答の、その商品IDの商品が属する状態の階層（languageClasses→言語→conditionClasses→状態）を探す */
function 状態の階層(r: 応答, 商品ID: string, 言語: string, 状態: string): Record<string, unknown> | null {
  const cards = ((r.json ?? {}) as Record<string, unknown>).cards;
  if (!cards || typeof cards !== "object") return null;
  for (const c of Object.values(cards as Record<string, unknown>)) {
    for (const d of Object.values(((c as Record<string, unknown>)?.details ?? {}) as Record<string, unknown>)) {
      const dd = d as Record<string, unknown>;
      if (String(dd?.productId ?? "") !== 商品ID) continue;
      const o = ((((dd.languageClasses as Record<string, unknown>)?.[言語] as Record<string, unknown>)?.conditionClasses as Record<string, unknown>)?.[状態]) as Record<string, unknown> | undefined;
      if (o) return o;
    }
  }
  return null;
}
function 商品の詳細(r: 応答, 商品ID: string): Record<string, unknown> | null {
  const cards = ((r.json ?? {}) as Record<string, unknown>).cards;
  if (!cards || typeof cards !== "object") return null;
  for (const c of Object.values(cards as Record<string, unknown>)) {
    for (const d of Object.values(((c as Record<string, unknown>)?.details ?? {}) as Record<string, unknown>)) {
      if (String((d as Record<string, unknown>)?.productId ?? "") === 商品ID) return d as Record<string, unknown>;
    }
  }
  return null;
}

caseTest("IT-A06-07-005", async (ctx) => {
  補いの注記();
  supplement("C（カードとの紐付けなし）と D（カード詳細との紐付けなし）は、刷新後は商品がカード詳細にだけ紐付くので、どちらもカード指定をしない商品で作った。E のレアリティ・F の言語・G の状態は E2E の行にだけ DB で空にした");
  const ids = Object.fromEntries(["A", "B", "C", "D", "E", "F", "G"].map((x) => [x, ctx.notes.get(`〔商品ID-A0607-005${x}〕`)]));
  const r = await 取る(ctx, A0607_ADM_A, Object.values(ids).join(","), "買取用カード一覧取得（関連の欠けた商品を含む7件）", 1, 2);
  await ctx.expected(async () => {
    expect.soft(応答に商品がある(r, ids.A), `必要な関連がそろった商品ID ${ids.A} が返る`).toBe(true);
    for (const [x, why] of [["B", "商品画像なし"], ["C", "カードなし"], ["D", "カード詳細なし"], ["E", "レアリティなし"], ["F", "言語なし"], ["G", "カード状態なし"]] as const) {
      expect.soft(応答に商品がある(r, ids[x]), `${why}の商品ID ${ids[x]} が返る`).toBe(false);
    }
  });
});

caseTest("IT-A06-07-006", async (ctx) => {
  補いの注記();
  supplement("カードセット・プロモーション・保管コード・買取価格・部門は、E2E の行にだけ DB で空（null）にした（画面で空にできない）");
  const id = ctx.notes.get("〔商品ID-A0607-006〕");
  const r = await 取る(ctx, A0607_ADM_A, id, "買取用カード一覧取得（任意の項目が未設定）", 1, 2);
  await ctx.expected(async () => {
    const d = 商品の詳細(r, id);
    const nm = 状態の階層(r, id, "JP", "NM");
    expect.soft(d !== null, `商品ID ${id} が結果に含まれる`).toBe(true);
    for (const [k, o] of [["cardsetCode", d], ["cardsetName", d], ["promotionName", d], ["storageCodeName", d], ["buyPrice", nm], ["sectionId", nm]] as const) {
      expect.soft(o && k in o ? (o as Record<string, unknown>)[k] : "（項目なし）", `${k} が値なし`).toBeNull();
    }
  });
});

caseTest("IT-A06-07-009", async (ctx) => {
  補いの注記();
  const id = ctx.notes.get("〔商品ID-A0607-009〕");
  const 在庫 = (r: 応答) => { const o = 状態の階層(r, id, "JP", "NM"); return o && o.stock !== undefined && o.stock !== null ? String(o.stock) : null; };
  const a = await 取る(ctx, A0607_ADM_A, id, "買取用カード一覧取得（店舗A の管理者）", 1, 2);
  const b = await 取る(ctx, A0607_ADM_B, id, "買取用カード一覧取得（店舗B の管理者）", 3, 4);
  note("ブラウザA・B は、それぞれの管理者のログイン API で受け取った認証トークンで代えた（同じブラウザの中で要求を分けた）");
  await ctx.expected(async () => {
    expect.soft(在庫(a), "ブラウザA（所属店舗A＝本店）の状態階層の在庫数").toBe("7");
    expect.soft(在庫(b), "ブラウザB（所属店舗B＝試験支店）の状態階層の在庫数").toBe("9");
  });
});
