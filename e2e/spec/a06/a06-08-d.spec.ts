/**
 * A06-08 カード名検索（MTGBuyer の API）の 008。正本: cases/A06-08_test_cases.tsv。記録 review/A06-08_progress_2026-11-17_dev.md。
 * 判定済みのケースのテストの指紋を変えないよう、ファイルを分けた。送り方は spec/a06/a06-08.spec.ts と同じ
 * （ケースの文のパス /api/search.json は 404 なので、アプリの経路の応答で確かめ、文のパスの結果は注記に残す）。商品名には実行の印が付く。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { トークンを受け取る, 名前で買取カードを探す, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import { A0608_ADM_A } from "../../seeds/a06-08";
import "../../seeds/a06-08";
import "../../seeds/a06-08-d";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

type 木 = Record<string, unknown>;
const 子 = (o: unknown, k: string): 木 | null => (o && typeof o === "object" && (o as 木)[k] && typeof (o as 木)[k] === "object") ? (o as 木)[k] as 木 : null;
/** 応答の中で、その商品IDの商品を持つカード詳細の要素 */
function 商品の詳細(r: 応答, 商品ID: string): 木 | null {
  const cards = 子(r.json, "cards");
  for (const c of Object.values(cards ?? {})) {
    for (const d of Object.values(子(c, "details") ?? {})) {
      if (String((d as 木)?.productId ?? "") === 商品ID) return d as 木;
    }
  }
  return null;
}

caseTest("IT-A06-08-008", async (ctx) => {
  supplement("管理者は決まった印（-E2E）を付けた値。認証は手順1の前に管理者のログイン API で受け取ったトークンを付けた（値は記録しない）。ケースの文のパス（/api/search.json）は 404 なので、アプリの経路の応答で確かめた。店舗A は本店に読み替えた");
  supplement("カードセット・プロモーション・保管コード・買取価格・部門は、E2E の行にだけ DB で空（null）にした（画面で空にできない）");
  const id = ctx.notes.get("〔商品ID-A0608-008〕");
  const token = await トークンを受け取る(ctx.page, A0608_ADM_A.loginId, A0608_ADM_A.password);
  let r!: 応答;
  await ctx.step(1, async () => {
    const 文 = await 名前で買取カードを探す(ctx.page, "カード名検索（ケースの文のパス）", rc("A06-08任意値なし"), "文のとおり", token);
    note(`ケースの文のパス（入口を /api/v1 に読み替え）は HTTP ${文.ステータス}`);
    r = await 名前で買取カードを探す(ctx.page, "カード名検索（アプリの経路）", rc("A06-08任意値なし"), "アプリの経路", token);
  });
  await ctx.step(2, async () => { note(`要求の方式 POST・HTTP ステータス ${r.ステータス}・応答 ${r.本文.slice(0, 400) || "（空）"}`); });
  await ctx.expected(async () => {
    const d = 商品の詳細(r, id);
    const nm = 子(子(子(子(d, "languageClasses"), "JP"), "conditionClasses"), "NM");
    expect.soft(d !== null, `商品ID ${id} が応答から除外されない`).toBe(true);
    for (const [k, o] of [["cardsetCode", d], ["cardsetName", d], ["promotionName", d], ["storageCodeName", d], ["buyPrice", nm], ["sectionId", nm]] as const) {
      expect.soft(o && k in o ? (o as 木)[k] : "（項目なし）", `${k} が null`).toBeNull();
    }
  });
});
