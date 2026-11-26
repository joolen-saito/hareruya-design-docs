/**
 * A06-07 買取用カード一覧取得（商品ID指定。POST …/buying/products）の 003・007。
 * 正本: cases/A06-07_test_cases.tsv。判定済みのケース（spec/a06/a06-07.spec.ts ほか）のテストの指紋を変えないよう、ファイルを分けた。
 * 実装の解釈は記録 review/A06-07_progress_2026-11-17_dev.md。要求の送り方は pages/admin/a06_mtgbuyer_api.ts。
 * - 商品IDは、ケースの文のとおり URL のクエリで送る。管理者の認証は、手順1の前にログイン API で受け取った認証トークンを要求に付ける。
 * - カードセット・プロモーション・略称タグ（保管コード名）は決まった印（-E2E）つきのマスタ、カード名・商品名・商品コードは実行の印つき。期待結果の同じ値も同じ印つきで読む。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { rc, rcFixed } from "../../lib/run_marker";
import { トークンを受け取る, 商品IDで買取カードを取る, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import { A0607_ADM_A } from "../../seeds/a06-07";
import "../../seeds/a06-07";
import "../../seeds/a06-07-c";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

async function 取る(ctx: CaseCtx, ids: string, 何: string): Promise<応答> {
  supplement("管理者は決まった印（-E2E）を付けた値。API 認証は、手順1の前に管理者のログイン API で受け取った認証トークンを要求に付けた（値は記録しない）。店舗A は本店に読み替えた");
  const token = await トークンを受け取る(ctx.page, A0607_ADM_A.loginId, A0607_ADM_A.password);
  let r!: 応答;
  await ctx.step(1, async () => { r = await 商品IDで買取カードを取る(ctx.page, 何, ids, "クエリ", token); });
  await ctx.step(2, async () => { note(`要求の方式 POST・商品IDはクエリ・HTTP ステータス ${r.ステータス}・応答 ${r.本文.slice(0, 600) || "（空）"}`); });
  return r;
}

type 木 = Record<string, unknown>;
const 子 = (o: unknown, k: string): 木 | null => (o && typeof o === "object" && (o as 木)[k] && typeof (o as 木)[k] === "object") ? (o as 木)[k] as 木 : null;
/** 部分木のなかで、最初に見つかったキーの値（文字列。無ければ null） */
function 探す(v: unknown, キー: string): string | null {
  if (!v || typeof v !== "object") return null;
  const o = v as 木;
  if (キー in o && o[キー] !== null && o[キー] !== undefined && typeof o[キー] !== "object") return String(o[キー]);
  for (const x of Object.values(o)) { const r = 探す(x, キー); if (r !== null) return r; }
  return null;
}

/** 応答の中で、productClassId が ids のどれかである要素の数 */
function 数える(v: unknown, ids: string[]): number {
  if (!v || typeof v !== "object") return 0;
  const o = v as 木;
  return (ids.includes(String(o.productClassId ?? "")) ? 1 : 0) + Object.values(o).reduce<number>((s, x) => s + 数える(x, ids), 0);
}

caseTest("IT-A06-07-003", async (ctx) => {
  supplement("カードセット・プロモーション・略称タグは決まった印（-E2E）つきのマスタ。カード名・商品名・商品コードは実行の印つき。カードセット名（日本語）は、カードセット名（英語）と別の値で登録した");
  const n = (k: string) => ctx.notes.get(k);
  const [商品, カード, 詳細, 規格, 部門] = ["商品", "カード", "カード詳細", "商品規格", "部門"].map((x) => n(`〔${x}ID-A0607-003〕`));
  const r = await 取る(ctx, 商品, "買取用カード一覧取得（全応答項目）");
  await ctx.expected(async () => {
    const c = 子(子((r.json ?? {}) as 木, "cards"), カード);
    const d = 子(子(c, "details"), 詳細);
    const nm = 子(子(子(子(d, "languageClasses"), "JP"), "conditionClasses"), "NM");
    expect.soft(c !== null, `最上位のカード一覧にカードID ${カード} がある`).toBe(true);
    expect.soft(d !== null, `カードID配下にカード詳細ID ${詳細} がある`).toBe(true);
    expect.soft(子(d, "languageClasses") !== null && 子(子(d, "languageClasses"), "JP") !== null, "カード詳細ID配下に言語コード JP がある").toBe(true);
    expect.soft(nm !== null, "言語 JP 配下に状態コード NM がある").toBe(true);
    expect.soft(探す(c, "cardNameJp"), "カードの日本語名").toBe(rc("A06-07カード"));
    expect.soft(探す(c, "cardNameEn"), "カードの英語名").toBe(rc("A06-07 Card"));
    expect.soft(探す(c, "imageFileName"), "画像ファイル名").toBe("a0607-003.jpg");
    expect.soft(探す(d, "cardsetCode"), "カードセットコード").toBe(rcFixed("A607-003"));
    expect.soft(探す(d, "cardsetName"), "カードセット日本語名").toBe(rcFixed("A06-07セット"));
    expect.soft(["0", "false"].includes(探す(d, "foilFlg") ?? "（項目なし）"), `フォイルではない（実際: ${探す(d, "foilFlg")}）`).toBe(true);
    expect.soft(探す(d, "cardNo"), "カード番号").toBe("007");
    expect.soft(探す(d, "promotionName"), "プロモーション日本語名").toBe(rcFixed("A06-07プロモ"));
    expect.soft(探す(d, "productId"), "商品ID").toBe(商品);
    expect.soft(探す(d, "productNameJp"), "商品日本語名").toBe(rc("A06-07商品"));
    expect.soft(探す(d, "productNameEn"), "商品英語名").toBe(rc("A06-07 Product"));
    expect.soft(探す(d, "rarityCode"), "レアリティコード").toBe("R");
    expect.soft(探す(d, "storageCodeName"), "保管コード名").toBe(rcFixed("A06-07棚"));
    expect.soft(探す(nm, "productClassId"), "商品規格ID").toBe(規格);
    expect.soft(探す(nm, "productCode"), "商品コード").toBe(rc("A0607-BASE-003"));
    expect.soft(探す(nm, "buyPrice"), "買取価格").toBe("1234");
    expect.soft(探す(nm, "price"), "基準価格").toBe("2345");
    expect.soft(探す(nm, "stock"), "所属店舗AのEC在庫数").toBe("7");
    expect.soft(探す(nm, "sectionId"), "部門ID").toBe(部門);
  });
});

caseTest("IT-A06-07-007", async (ctx) => {
  supplement("管理者は決まった印（-E2E）を付けた値。2件目の商品規格は商品規格一覧の「新規作成」で足した（言語JP・状態NM）");
  const n = (k: string) => ctx.notes.get(k);
  const [商品, カード, 詳細, a, b] = [n("〔商品ID-A0607-007〕"), n("〔カードID-A0607-007〕"), n("〔カード詳細ID-A0607-007〕"), n("〔商品規格ID-A0607-007A〕"), n("〔商品規格ID-A0607-007B〕")];
  const r = await 取る(ctx, 商品, "買取用カード一覧取得（同じ組に商品規格2件）");
  await ctx.expected(async () => {
    note(`言語 JP 配下の状態コード: ${Object.keys(子(子(子(子(子(子((r.json ?? {}) as 木, "cards"), カード), "details"), 詳細), "languageClasses"), "JP")?.conditionClasses as 木 ?? {}).join("・") || "（なし）"}`);
    const cc = 子(子(子(子(子(子(子((r.json ?? {}) as 木, "cards"), カード), "details"), 詳細), "languageClasses"), "JP"), "conditionClasses");
    const nm = 子(cc, "NM");
    expect.soft(nm !== null, "カードID→カード詳細ID→言語 JP→状態 NM の階層がある").toBe(true);
    expect.soft(数える(r.json, [a, b]), `応答に商品規格ID ${a}・${b} を持つ要素は合わせて1件だけ`).toBe(1);
    const id = 探す(nm, "productClassId");
    expect.soft([a, b].includes(id ?? ""), `商品規格ID が ${a} または ${b}（実際: ${id}）`).toBe(true);
  });
});
