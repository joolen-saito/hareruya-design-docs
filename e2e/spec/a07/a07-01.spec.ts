/**
 * A07-01 まとめて買取商品IDの取得（MTGバイヤーの API の GET /api/admin/optionBulkPurchaseId.json）。正本: cases/A07-01_test_cases.tsv
 * 実装したケースと解釈は記録 review/A07-01_progress_2026-11-17_dev.md。
 *
 * 「開発者ツールの Console から送り、Network で確かめる」の代わりに、テストのブラウザから API サーバーへ要求を送り、応答を読む（pages/admin/a07_api.ts）。
 * 認証トークンは、試験管理者のログインIDとパスワードで管理者ログインの API を呼んで受け取る（アプリの秘密の値は使わない。値は記録しない）。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { 管理者のトークン, 応答, 応答を画面に出す, 送る, トップページを開く, 末尾を置き換える } from "../../pages/admin/a07_api";
import { A0701管理者, A0701署名確認, A0701控えたトークン } from "../../seeds/a07-01";
import "../../seeds/a07-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 経路 = "/api/admin/optionBulkPurchaseId.json";
const 開発者ツールの代わり = "開発者ツールの代わりに、テストのブラウザから API サーバーへ要求を送り、応答の HTTP ステータスと本文を読んだ（エビデンスの画面には応答を表で出した）";

async function トークン(a: typeof A0701管理者, 誰: string): Promise<string> {
  supplement(`${誰}の有効な認証トークンは、${誰}のログインIDとパスワードで管理者ログインの API を呼んで受け取った（正本の「HS256 の認証トークンを生成する」の読み替え。値は記録しない）`);
  return 管理者のトークン(a.account.loginId, a.account.password);
}

async function 見る(ctx: CaseCtx, r: 応答): Promise<void> {
  note(`応答 HTTP ${r.ステータス}・本文 ${r.本文.slice(0, 200)}`);
  await 応答を画面に出す(ctx.page, "まとめて買取商品IDの取得", r, { 本文: r.本文.slice(0, 500), JSONの型: r.json === null ? "JSON でない" : Array.isArray(r.json) ? "配列" : typeof r.json });
}

caseTest("IT-A07-01-001", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
  await ctx.step(2, async () => { r = await 送る(ctx.page, "GET", 経路, { トークン: await トークン(A0701管理者, "試験管理者") }); });
  await ctx.step(3, async () => { note(`要求メソッド GET`); await 見る(ctx, r); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    let json = true; try { JSON.parse(r.本文); } catch { json = false; }
    expect.soft(json, "応答が JSON 形式").toBe(true);
  });
});

caseTest("IT-A07-01-002", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => {
    const v = ctx.db.query("select option_value as v from mtb_option where option_key = $1", ["bulk_purchase_id"]);
    note(`DB: 追加システム設定のまとめて買取商品ID ${v.map((x) => x.v).join("・")}（${v.length} 行）`);
    expect(v.length, "追加システム設定のまとめて買取商品IDの行が1行").toBe(1);
    expect(v[0]?.v, "追加システム設定のまとめて買取商品ID").toBe("70101");
  });
  await ctx.step(2, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
  await ctx.step(3, async () => { r = await 送る(ctx.page, "GET", 経路, { トークン: await トークン(A0701管理者, "試験管理者") }); });
  await ctx.step(4, async () => { await 見る(ctx, r); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(typeof r.json, `応答 JSON のルートの型（キーを持たない整数のはず。本文 ${r.本文.slice(0, 50)}）`).toBe("number");
    expect.soft(Number.isInteger(r.json), "応答 JSON のルートが整数").toBe(true);
    expect.soft(r.json, "応答の値が追加システム設定のまとめて買取商品IDと同じ 70101").toBe(70101);
  });
});

caseTest("IT-A07-01-003", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
  await ctx.step(2, async () => { r = await 送る(ctx.page, "GET", 経路); });
  await ctx.step(3, async () => { await 見る(ctx, r); });
  await ctx.expected(async () => { expect.soft(r.ステータス, "HTTP ステータス").toBe(401); });
});

caseTest("IT-A07-01-004", async (ctx) => {
  let r!: 応答; let token = "";
  await ctx.step(1, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
  await ctx.step(2, async () => {
    const t = await トークン(A0701署名確認, "署名確認管理者");
    token = 末尾を置き換える(t);
    note(`認証トークンの末尾1文字を、元が${t.endsWith("A") ? " A なので B" : " A でないので A"}へ置き換えた（値は記録しない）`);
  });
  await ctx.step(3, async () => { r = await 送る(ctx.page, "GET", 経路, { トークン: token }); });
  await ctx.step(4, async () => { await 見る(ctx, r); });
  await ctx.expected(async () => { expect.soft(r.ステータス, "HTTP ステータス").toBe(401); });
});

caseTest("IT-A07-01-005", async (ctx) => {
  let r!: 応答;
  const token = A0701控えたトークン.get("005");
  if (!token) throw new Error("S-A07-01-NOMEMBER-005 の認証トークンを控えていない");
  supplement("削除した管理者（〔管理者会員ID-A0701-005〕）の認証トークンは、削除の前に管理者ログインの API で受け取ったもの（シード）");
  await ctx.step(1, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
  await ctx.step(2, async () => { r = await 送る(ctx.page, "GET", 経路, { トークン: token }); });
  await ctx.step(3, async () => { await 見る(ctx, r); });
  await ctx.expected(async () => { expect.soft(r.ステータス, "HTTP ステータス").toBe(401); });
});
