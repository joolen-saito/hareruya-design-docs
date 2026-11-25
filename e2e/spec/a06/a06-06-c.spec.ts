/**
 * A06-06 買取用カード一覧取得（カード詳細ID指定。GET …/buying/{カード詳細ID}.json）の 002・007。
 * 正本: cases/A06-06_test_cases.tsv。判定済みのケースのテストの指紋を変えないよう、ファイルを分けた。
 * 実装の解釈は記録 review/A06-06_progress_2026-11-17_dev.md。要求の送り方は pages/admin/a06_mtgbuyer_api.ts。
 * 管理者の認証は、手順1の前に管理者のログイン API で受け取った認証トークンを要求に付ける形にした。
 * カードセット・プロモーション・略称タグ（略称タグ名）は決まった印（-E2E）つきのマスタ、カード名・商品名・商品コードは実行の印つき。期待結果の同じ値も同じ印つきで読む。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { rc, rcFixed } from "../../lib/run_marker";
import { カード詳細IDで買取カードを取る, トークンを受け取る, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import { A0606_ADM_A } from "../../seeds/a06-06";
import "../../seeds/a06-06";
import "../../seeds/a06-06-c";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

async function 取る(ctx: CaseCtx, カード詳細ID: string, 何: string): Promise<応答> {
  supplement("管理者は決まった印（-E2E）を付けた値。認証は、手順1の前に管理者のログイン API で受け取った認証トークンを要求に付けた（値は記録しない）。店舗A は本店に読み替えた");
  const token = await トークンを受け取る(ctx.page, A0606_ADM_A.loginId, A0606_ADM_A.password);
  let r!: 応答;
  await ctx.step(1, async () => { r = await カード詳細IDで買取カードを取る(ctx.page, 何, カード詳細ID, token); });
  await ctx.step(2, async () => { note(`要求の方式 GET・HTTP ステータス ${r.ステータス}・応答 ${r.本文.slice(0, 600) || "（空）"}`); });
  return r;
}

type 木 = Record<string, unknown>;
const 子 = (o: unknown, k: string): 木 | null => (o && typeof o === "object" && (o as 木)[k] && typeof (o as 木)[k] === "object") ? (o as 木)[k] as 木 : null;
/** 部分木のなかで、最初に見つかったキーの値（そのままの型。無ければ undefined） */
function 探す(v: unknown, キー: string): unknown {
  if (!v || typeof v !== "object") return undefined;
  const o = v as 木;
  if (キー in o && o[キー] !== null && o[キー] !== undefined && typeof o[キー] !== "object") return o[キー];
  for (const x of Object.values(o)) { const r = 探す(x, キー); if (r !== undefined) return r; }
  return undefined;
}
/** 応答の中で、productClassId が ids のどれかである要素の数 */
function 数える(v: unknown, ids: string[]): number {
  if (!v || typeof v !== "object") return 0;
  const o = v as 木;
  return (ids.includes(String(o.productClassId ?? "")) ? 1 : 0) + Object.values(o).reduce<number>((s, x) => s + 数える(x, ids), 0);
}

caseTest("IT-A06-06-002", async (ctx) => {
  supplement("カードセット・プロモーション・略称タグは決まった印（-E2E）つきのマスタ。カード名・商品名・商品コードは実行の印つき。カードセット名（日本語）は、カードセット名（英語）と別の値で登録した");
  const n = (k: string) => ctx.notes.get(k);
  const [商品, カード, 詳細, 規格, 部門] = ["商品", "カード", "カード詳細", "商品規格", "部門"].map((x) => n(`〔${x}ID-A0606-002〕`));
  const r = await 取る(ctx, 詳細, "買取用カード一覧取得（全応答項目）");
  await ctx.expected(async () => {
    const cards = 子((r.json ?? {}) as 木, "cards");
    const c = 子(cards, カード);
    const d = 子(子(c, "details"), 詳細);
    const nm = 子(子(子(子(d, "languageClasses"), "JP"), "conditionClasses"), "NM");
    expect.soft(cards !== null, "cards がオブジェクト").toBe(true);
    expect.soft(nm !== null, "cards→カードID→details→カード詳細ID→languageClasses→JP→conditionClasses→NM の階層がある").toBe(true);
    const 見る: [string, unknown, string, string][] = [
      ["cardNameJp", c, "カードの日本語名", rc("A06-06カード")],
      ["cardNameEn", c, "カードの英語名", rc("A06-06 Card")],
      ["imageFileName", c, "画像ファイル名", "a0606-002.jpg"],
      ["cardsetCode", d, "カードセットコード", rcFixed("A06")],
      ["cardsetName", d, "カードセット名", rcFixed("A06セット")],
      ["foilFlg", d, "フォイルフラグ", "0"],
      ["cardNo", d, "カード番号", "001"],
      ["promotionName", d, "プロモーション名", rcFixed("A06プロモ")],
      ["productId", d, "商品ID", 商品],
      ["productNameJp", d, "商品日本語名", rc("A06-06商品")],
      ["productNameEn", d, "商品英語名", rc("A06-06 Product")],
      ["rarityCode", d, "レアリティコード", "R"],
      ["storageCodeName", d, "略称タグ名", rcFixed("A06棚")],
      ["productClassId", nm, "商品規格ID", 規格],
      ["productCode", nm, "商品コード", rc("A0606-BASE-002")],
      ["buyPrice", nm, "買取価格", "1234"],
      ["price", nm, "基準価格", "2345"],
      ["stock", nm, "EC在庫数", "7"],
      ["sectionId", nm, "部門ID", 部門],
    ];
    for (const [キー, 木, 何, 期待] of 見る) {
      const v = 探す(木, キー);
      expect.soft(v === undefined ? "（項目なし）" : String(v), `${何}（${キー}）`).toBe(期待);
      expect.soft(typeof v, `${キー} が文字列で返る`).toBe("string");
    }
  });
});

caseTest("IT-A06-06-007", async (ctx) => {
  supplement("管理者は決まった印（-E2E）を付けた値。2件目の商品規格は商品規格一覧の「新規作成」で足した（言語JP・状態NM）");
  const n = (k: string) => ctx.notes.get(k);
  const [カード, 詳細, a, b] = [n("〔カードID-A0606-007〕"), n("〔カード詳細ID-A0606-007〕"), n("〔商品規格ID-A0606-007A〕"), n("〔商品規格ID-A0606-007B〕")];
  const r = await 取る(ctx, 詳細, "買取用カード一覧取得（同じ組に商品規格2件）");
  await ctx.expected(async () => {
    const nm = 子(子(子(子(子(子(子((r.json ?? {}) as 木, "cards"), カード), "details"), 詳細), "languageClasses"), "JP"), "conditionClasses");
    const 状態NM = 子(nm, "NM");
    expect.soft(状態NM !== null, "JP→conditionClasses→NM の階層がある").toBe(true);
    expect.soft(数える(r.json, [a, b]), `応答に商品規格ID ${a}・${b} を持つ要素は合わせて1件だけ`).toBe(1);
    const id = String(探す(状態NM, "productClassId") ?? "");
    expect.soft([a, b].includes(id), `productClassId が ${a} または ${b}（実際: ${id}）`).toBe(true);
  });
});
