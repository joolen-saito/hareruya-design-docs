/**
 * A06-06 買取用カード一覧取得（カード詳細ID指定。GET …/buying/{カード詳細ID}.json）の 005・009・012・018（2026-11-21 追加）。
 * 正本: cases/A06-06_test_cases.tsv。判定済みのケース（spec/a06/a06-06.spec.ts）のテストの指紋を変えないよう、ファイルを分けた。
 * 実装の解釈は記録 review/A06-06_progress_2026-11-17_dev.md。要求の送り方は pages/admin/a06_mtgbuyer_api.ts（A06-01 と同じ）。
 * 管理者の認証は、手順1の前に管理者のログイン API で受け取った認証トークンを要求に付ける形にした。店舗B は試験支店に読み替えた。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { カード詳細IDで買取カードを取る, トークンを受け取る, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import { A0606_ADM_A, A0606_ADM_B } from "../../seeds/a06-06";
import "../../seeds/a06-06";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
type 管理者 = { loginId: string; password: string };

async function 取る(ctx: CaseCtx, 誰: 管理者, カード詳細ID: string, 何: string, 送る手順: number, 見る手順: number): Promise<応答> {
  const token = await トークンを受け取る(ctx.page, 誰.loginId, 誰.password);
  let r!: 応答;
  await ctx.step(送る手順, async () => { r = await カード詳細IDで買取カードを取る(ctx.page, 何, カード詳細ID, token); });
  await ctx.step(見る手順, async () => { note(`要求の方式 GET・HTTP ステータス ${r.ステータス}・応答 ${r.本文.slice(0, 400) || "（空）"}`); });
  return r;
}
const 補いの注記 = () => supplement("管理者は決まった印（-E2E）を付けた値。認証は、手順1の前に管理者のログイン API で受け取った認証トークンを要求に付けた（値は記録しない）。店舗A は本店、店舗B は試験支店に読み替えた");

/** 応答の cards→カードID→details→カード詳細ID の中身 */
function 詳細(r: 応答, カード詳細ID: string): Record<string, unknown> | null {
  const cards = ((r.json ?? {}) as Record<string, unknown>).cards;
  if (!cards || typeof cards !== "object") return null;
  for (const c of Object.values(cards as Record<string, unknown>)) {
    const d = (c as Record<string, unknown>)?.details as Record<string, unknown> | undefined;
    if (d && d[カード詳細ID] && typeof d[カード詳細ID] === "object") return d[カード詳細ID] as Record<string, unknown>;
  }
  return null;
}
function 詳細のキー(r: 応答): string[] {
  const cards = ((r.json ?? {}) as Record<string, unknown>).cards;
  if (!cards || typeof cards !== "object") return [];
  return Object.values(cards as Record<string, unknown>).flatMap((c) => Object.keys(((c as Record<string, unknown>)?.details ?? {}) as object));
}
const 子 = (o: unknown, k: string): Record<string, unknown> | null => (o && typeof o === "object" && (o as Record<string, unknown>)[k] && typeof (o as Record<string, unknown>)[k] === "object") ? (o as Record<string, unknown>)[k] as Record<string, unknown> : null;
const 値 = (o: Record<string, unknown> | null, k: string): string | null => (o && k in o && o[k] !== null && o[k] !== undefined) ? String(o[k]) : null;

caseTest("IT-A06-06-005", async (ctx) => {
  補いの注記();
  supplement("D（付随情報なし）は、刷新後は買取価格・部門を商品規格が持ち、別の付随情報の行が無いので、カード詳細 D に商品を紐付けない形で作った");
  const ids = Object.fromEntries(["A", "B", "C", "D", "E", "F"].map((x) => [x, ctx.notes.get(`〔カード詳細ID-A0606-005${x}〕`)]));
  const r = await 取る(ctx, A0606_ADM_A, ids.A, "買取用カード一覧取得（関連の欠けたカード詳細を含むカード）", 1, 2);
  await ctx.expected(async () => {
    const keys = 詳細のキー(r);
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(keys.includes(ids.A), `有効なカード詳細ID ${ids.A} が details にある（実際のキー: ${keys.join("、") || "なし"}）`).toBe(true);
    for (const [x, why] of [["B", "商品画像なし"], ["C", "レアリティなし"], ["D", "付随情報なし"], ["E", "付随情報の言語なし"], ["F", "付随情報の状態なし"]] as const) {
      expect.soft(keys.includes(ids[x]), `${why}のカード詳細ID ${ids[x]} が details にある`).toBe(false);
    }
  });
});

caseTest("IT-A06-06-009", async (ctx) => {
  補いの注記();
  const id = ctx.notes.get("〔カード詳細ID-A0606-009〕"), 規格 = ctx.notes.get("〔商品規格ID-A0606-009〕");
  const 在庫 = (r: 応答) => 値(子(子(子(子(詳細(r, id), "languageClasses"), "JP"), "conditionClasses"), "NM"), "stock");
  const a = await 取る(ctx, A0606_ADM_A, id, "買取用カード一覧取得（店舗A の管理者）", 1, 2);
  const b = await 取る(ctx, A0606_ADM_B, id, "買取用カード一覧取得（店舗B の管理者）", 3, 4);
  note(`商品規格ID ${規格}。ブラウザA・B は、それぞれの管理者のログイン API で受け取った認証トークンで代えた（同じブラウザの中で要求を分けた）`);
  await ctx.expected(async () => {
    expect.soft(在庫(a), "ブラウザA（所属店舗A＝本店）の stock").toBe("7");
    expect.soft(在庫(b), "ブラウザB（所属店舗B＝試験支店）の stock").toBe("9");
  });
});

caseTest("IT-A06-06-012", async (ctx) => {
  補いの注記();
  supplement("カードセット・プロモーション・略称タグ・買取価格・部門は、E2E の行にだけ DB で空（null）にした（画面で空にできない）");
  const id = ctx.notes.get("〔カード詳細ID-A0606-012〕");
  const r = await 取る(ctx, A0606_ADM_A, id, "買取用カード一覧取得（任意の項目が未設定）", 1, 2);
  await ctx.expected(async () => {
    const d = 詳細(r, id);
    const nm = 子(子(子(子(d, "languageClasses"), "JP"), "conditionClasses"), "NM");
    expect.soft(d !== null, `カード詳細ID ${id} が応答にある`).toBe(true);
    for (const [k, o] of [["cardsetCode", d], ["cardsetName", d], ["promotionName", d], ["storageCodeName", d], ["buyPrice", nm], ["sectionId", nm]] as const) {
      const has = !!o && k in o;
      expect.soft(has, `${k} の項目が省略されずにある`).toBe(true);
      expect.soft(has ? (o as Record<string, unknown>)[k] : "（項目なし）", `${k} の値が JSON の null（空文字でない）`).toBeNull();
    }
  });
});

caseTest("IT-A06-06-018", async (ctx) => {
  補いの注記();
  supplement("EN の商品規格の状態SPは、取込の部品が状態NMの商品規格だけを作るので、E2E の商品規格にだけ DB で状態のマスタの SP を選んだ。商品コードには実行の印を付けた");
  const id = ctx.notes.get("〔カード詳細ID-A0606-018〕");
  const r = await 取る(ctx, A0606_ADM_A, id, "買取用カード一覧取得（言語JP・ENの2組）", 1, 2);
  await ctx.expected(async () => {
    const lc = 子(詳細(r, id), "languageClasses");
    expect.soft(Object.keys(lc ?? {}).sort(), "languageClasses のキー").toEqual(["EN", "JP"]);
    for (const [言語, 状態, 規格, 買取, 基準, 在庫] of [["JP", "NM", "018-JP", "1111", "3333", "5"], ["EN", "SP", "018-EN", "2222", "4444", "8"]] as const) {
      const cc = 子(子(lc, 言語), "conditionClasses");
      expect.soft(Object.keys(cc ?? {}), `${言語} の conditionClasses のキー`).toEqual([状態]);
      const o = 子(cc, 状態);
      expect.soft(値(o, "productClassId"), `${言語}→${状態} の productClassId`).toBe(ctx.notes.get(`〔商品規格ID-A0606-${規格}〕`));
      expect.soft(値(o, "productCode"), `${言語}→${状態} の productCode`).toBe(rc(`A0606-${規格}`));
      expect.soft(値(o, "buyPrice"), `${言語}→${状態} の buyPrice`).toBe(買取);
      expect.soft(値(o, "price"), `${言語}→${状態} の price`).toBe(基準);
      expect.soft(値(o, "stock"), `${言語}→${状態} の stock`).toBe(在庫);
    }
  });
});
