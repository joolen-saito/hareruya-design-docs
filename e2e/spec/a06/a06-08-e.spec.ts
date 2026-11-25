/**
 * A06-08 カード名検索（MTGBuyer の API）の 010（店舗ごとの EC 在庫）。正本: cases/A06-08_test_cases.tsv。記録 review/A06-08_progress_2026-11-17_dev.md。
 * 判定済みのケースのテストの指紋を変えないよう、ファイルを分けた。送り方は spec/a06/a06-08.spec.ts と同じ（ケースの文のパスは 404 なのでアプリの経路の応答で確かめ、文のパスの結果は注記に残す）。
 * ブラウザA・B は、それぞれの管理者のログイン API で受け取った認証トークンで代えた（同じブラウザの中で要求を分けた）。店舗B は試験支店に読み替えた。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { トークンを受け取る, 名前で買取カードを探す, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import { A0608_ADM_A } from "../../seeds/a06-08";
import { A0608_ADM_B } from "../../seeds/a06-08-e";
import "../../seeds/a06-08";
import "../../seeds/a06-08-e";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

type 木 = Record<string, unknown>;
const 子 = (o: unknown, k: string): 木 | null => (o && typeof o === "object" && (o as 木)[k] && typeof (o as 木)[k] === "object") ? (o as 木)[k] as 木 : null;
function 在庫(r: 応答, 商品ID: string): string | null {
  for (const c of Object.values(子(r.json, "cards") ?? {})) {
    for (const d of Object.values(子(c, "details") ?? {})) {
      if (String((d as 木)?.productId ?? "") !== 商品ID) continue;
      const s = 子(子(子(子(d, "languageClasses"), "JP"), "conditionClasses"), "NM")?.stock;
      return s === undefined || s === null ? null : String(s);
    }
  }
  return null;
}

caseTest("IT-A06-08-010", async (ctx) => {
  supplement("管理者は決まった印（-E2E）を付けた値。認証は手順1・3の前に各管理者のログイン API で受け取ったトークンを付けた（値は記録しない）。ケースの文のパス（/api/search.json）は 404 なので、アプリの経路の応答で確かめた。店舗A は本店、店舗B は試験支店に読み替えた");
  supplement("本店の EC 以外の在庫70と試験支店の EC 在庫9は、E2E の商品規格の在庫の行にだけ DB で書いた（入庫の部品が本店・EC にしか入れられない）");
  const id = ctx.notes.get("〔商品ID-A0608-010〕");
  const 語 = rc("A06-08在庫商品");
  const 取る = async (誰: { loginId: string; password: string }, 送る手順: number, 見る手順: number, 名: string): Promise<応答> => {
    const token = await トークンを受け取る(ctx.page, 誰.loginId, 誰.password);
    let r!: 応答;
    await ctx.step(送る手順, async () => {
      const 文 = await 名前で買取カードを探す(ctx.page, `カード名検索（${名}・ケースの文のパス）`, 語, "文のとおり", token);
      note(`ケースの文のパス（入口を /api/v1 に読み替え）は HTTP ${文.ステータス}`);
      r = await 名前で買取カードを探す(ctx.page, `カード名検索（${名}・アプリの経路）`, 語, "アプリの経路", token);
    });
    await ctx.step(見る手順, async () => { note(`要求の方式 POST・HTTP ステータス ${r.ステータス}・応答 ${r.本文.slice(0, 300) || "（空）"}`); });
    return r;
  };
  const a = await 取る(A0608_ADM_A, 1, 2, "ブラウザA");
  const b = await 取る(A0608_ADM_B, 3, 4, "ブラウザB");
  await ctx.expected(async () => {
    expect.soft(在庫(a, id), "ブラウザA（所属店舗A＝本店）の状態NM配下の stock").toBe("7");
    expect.soft(在庫(b, id), "ブラウザB（所属店舗B＝試験支店）の状態NM配下の stock").toBe("9");
  });
});
