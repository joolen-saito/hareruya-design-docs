/**
 * A16-02 言語コードに紐づいたトップバナーの情報一覧を取得（GET /api/topBanners/{言語コード}.json）。正本: cases/A16-02_test_cases.tsv
 * 判定済みの 001・006 の指紋を変えないよう、別のファイルにした。書いたケース: 007・008（言語コードXXが未登録）。
 * 009・010（言語コードZZを登録済みでバナー0件）は、共有マスタの言語を足してよいかの確認待ち（review/af_questions_kochi3.md）。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { 一覧のパス, 取得する, 応答 } from "../../pages/api/a16_02_top_banners";
import "../../seeds/a16-02";
import "../../seeds/a16-02-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 代わり = "開発者ツールのネットワークパネル・ブラウザで開く代わりに、試験ブラウザから認証情報を付けずに GET を送り、応答の HTTP ステータスと本文（JSON）を読む";

caseTest("IT-A16-02-007", async (ctx) => {
  let r: 応答 | null = null;
  await ctx.step(1, async () => { supplement(代わり); });
  await ctx.step(2, async () => {
    r = await 取得する(ctx.page, 一覧のパス("XX"));
    note(`GET ${一覧のパス("XX")}・応答 HTTP ${r.ステータス}・本文の先頭 ${r.本文.slice(0, 200)}`);
  });
  await ctx.step(3, async () => { note(`HTTP ステータス ${r?.ステータス}`); });
  await ctx.expected(async () => {
    expect.soft(r?.ステータス, "言語コードXXが未設定のときの HTTP ステータス").toBe(404);
  });
});

caseTest("IT-A16-02-008", async (ctx) => {
  let r: 応答 | null = null;
  await ctx.step(1, async () => {
    supplement(代わり);
    r = await 取得する(ctx.page, 一覧のパス("XX"));
    note(`GET ${一覧のパス("XX")}・応答 HTTP ${r.ステータス}`);
  });
  await ctx.step(2, async () => { note(`応答本文 ${r?.本文.slice(0, 300) || "（空）"}`); });
  await ctx.expected(async () => {
    const j = (r?.json ?? null) as Record<string, unknown> | null;
    expect.soft(j && typeof j === "object" ? Object.keys(j).sort() : null, "応答本文の項目（codeとmessageの2項目だけ）").toEqual(["code", "message"]);
    expect.soft(j?.code, "応答本文の code").toBe(404);
    expect.soft(j?.message, "応答本文の message").toBe("Language code is not found");
  });
});
