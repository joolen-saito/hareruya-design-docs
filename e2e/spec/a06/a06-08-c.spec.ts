/**
 * A06-08 カード名検索（MTGBuyer の API）の続き: 021（1カード・詳細2件・複数の言語と状態が取りこぼしなく入れ子で返る）。正本: cases/A06-08_test_cases.tsv
 * 判定済みのケースの指紋を変えないよう、別のファイルにした。要求の送り方・読み替えは a06-08-b.spec.ts と同じ
 * （ケースの文のパス /api/search.json は 404 なので注記に残し、アプリの経路の応答で確かめる。名前はケースの文のとおり URL のクエリで送る）。
 * 書かないケース: 007（カードセット・プロモーション・保管コードの指定）・008（買取価格・部門が未設定）・010（店舗Bの EC 在庫）。理由は記録に書く。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { トークンを受け取る, 名前で買取カードを探す, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import { A0608_ADM_A } from "../../seeds/a06-08";
import { 前置き021 } from "../../seeds/a06-08-c";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

const 数の文字 = (v: unknown) => String(v ?? "").replace(/\.0+$/, "");
const 辞書 = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const 下る = (v: unknown, ...キー: string[]): unknown => キー.reduce<unknown>((x, k) => 辞書(x)?.[k], v);
const キー一覧 = (v: unknown): string[] | null => { const d = 辞書(v); return d ? Object.keys(d).sort() : null; };

caseTest("IT-A06-08-021", async (ctx: CaseCtx) => {
  const n = (k: string) => ctx.notes.get(k);
  const 語 = 前置き021();
  supplement("管理者は決まった印（-E2E）を付けた値。認証は手順1の前に管理者のログイン API で受け取ったトークンを付けた（値は記録しない）。" +
    "ケースの文のパス（/api/search.json）は 404 なので、注記に残してアプリの経路（入口 /api/v1・拡張子なしの …/search）の応答で確かめた。店舗A は本店に読み替えた。" +
    `検索語: 「A0608-021-」の直後に実行の印を入れた「${語}」（商品名も「${語}AJP」「${語}AEN」「${語}BJP」で作った）`);
  const token = await トークンを受け取る(ctx.page, A0608_ADM_A.loginId, A0608_ADM_A.password);
  let r!: 応答;
  await ctx.step(1, async () => {
    const 文 = await 名前で買取カードを探す(ctx.page, "カード名検索（ケースの文のパス）", 語, "文のとおり", token);
    note(`ケースの文のパス（入口を /api/v1 に読み替え）は HTTP ${文.ステータス}`);
    r = await 名前で買取カードを探す(ctx.page, "カード名検索（アプリの経路）", 語, "アプリの経路", token);
  });
  await ctx.step(2, async () => { note(`要求の方式 POST・HTTP ステータス ${r.ステータス}・応答 ${r.本文.slice(0, 600) || "（空）"}`); });
  const A = n("〔カード詳細ID-A0608-021A〕"), B = n("〔カード詳細ID-A0608-021B〕");
  const 規格 = (詳細: string, 言語: string, 状態: string): unknown => 下る(r.json, "cards", "1", "details", 詳細, "languageClasses", 言語, "conditionClasses", 状態);
  const 規格を確かめる = (詳細: string, 言語: string, 状態: string, 印: string, 買取: string, 基準: string, 在庫: string): void => {
    const e = 規格(詳細, 言語, 状態);
    const 何 = `詳細 ${詳細}・${言語}・${状態}`;
    expect.soft(String(下る(e, "productClassId") ?? ""), `${何} の productClassId`).toBe(n(`〔商品規格ID-A0608-021${印}〕`));
    expect.soft(String(下る(e, "productCode") ?? ""), `${何} の productCode（実行の印つき）`).toContain(`A0608-021-${印}`);
    expect.soft(数の文字(下る(e, "buyPrice")), `${何} の buyPrice`).toBe(買取);
    expect.soft(数の文字(下る(e, "price")), `${何} の price`).toBe(基準);
    expect.soft(数の文字(下る(e, "stock")), `${何} の stock`).toBe(在庫);
  };
  await ctx.expected(async () => {
    expect.soft(キー一覧(下る(r.json, "cards")), "cards のキー（1件だけ）").toEqual(["1"]);
    expect.soft(キー一覧(下る(r.json, "cards", "1", "details")), "cards.1.details のキー（詳細A・Bの2つだけ）").toEqual([A, B].sort());
    expect.soft(キー一覧(下る(r.json, "cards", "1", "details", A, "languageClasses")), "詳細A の languageClasses のキー").toEqual(["EN", "JP"]);
    expect.soft(キー一覧(下る(r.json, "cards", "1", "details", A, "languageClasses", "JP", "conditionClasses")), "詳細A・JP の conditionClasses のキー").toEqual(["NM", "SP"]);
    expect.soft(キー一覧(下る(r.json, "cards", "1", "details", A, "languageClasses", "EN", "conditionClasses")), "詳細A・EN の conditionClasses のキー").toEqual(["NM", "SP"]);
    規格を確かめる(A, "JP", "NM", "A-JP-NM", "100", "1000", "1");
    規格を確かめる(A, "JP", "SP", "A-JP-SP", "200", "2000", "2");
    規格を確かめる(A, "EN", "NM", "A-EN-NM", "300", "3000", "3");
    規格を確かめる(A, "EN", "SP", "A-EN-SP", "400", "4000", "4");
    expect.soft(キー一覧(下る(r.json, "cards", "1", "details", B, "languageClasses")), "詳細B の languageClasses のキー（JP だけ）").toEqual(["JP"]);
    expect.soft(キー一覧(下る(r.json, "cards", "1", "details", B, "languageClasses", "JP", "conditionClasses")), "詳細B・JP の conditionClasses のキー（NM だけ）").toEqual(["NM"]);
    規格を確かめる(B, "JP", "NM", "B-JP-NM", "500", "5000", "5");
  });
});
