/**
 * A15-05 ユーザー情報変更（デッキビルダーの API の PUT /api/user）。正本: cases/A15-05_test_cases.tsv
 * 実装したケースと解釈は記録 review/A15-05_progress_2026-11-14_dev.md。
 *
 * 「ブラウザの開発者ツールで要求を送る」の代わりに、試験ブラウザ（ケースのブラウザのコンテキスト）から API へ要求を送り、
 * 応答の HTTP ステータス・本文を読む。DB の確かめは、E2E が作った選手の行を読むだけ。
 * 認証トークンは、シードでその会員のメールアドレスとパスワードでログインの API を呼んで受け取った値（記録しない）。
 */
import { Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { 会員IDの選手の数 } from "../../db/a15_01";
import { 選手を読む } from "../../db/a15_04";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { A1505のトークン } from "../../seeds/a15-05";
import "../../seeds/a15-05";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 開発者ツールの代わり = "開発者ツールの代わりに、試験ブラウザからユーザー情報変更の API（PUT /api/user）へ要求を送り、応答の HTTP ステータス・本文を読んだ";
const トークンの補い = "有効な認証トークンは、シードでその会員のメールアドレスとパスワードでログインの API を呼んで受け取った値を使った（値は記録しない）";

type 応答 = { ステータス: number; 本文: string; json: Record<string, unknown> | null };

async function 変更する(page: Page, 本文: Record<string, unknown>, token?: string, 何回目 = ""): Promise<応答> {
  const res = await page.request.put(`${BASE_URL}/api/user`, { data: 本文, headers: token !== undefined ? { "jwt-token": token } : {}, failOnStatusCode: false, timeout: 60_000 });
  const t = await res.text();
  let json: Record<string, unknown> | null = null;
  try { json = JSON.parse(t) as Record<string, unknown>; } catch { /* JSON でない */ }
  note(`${何回目}要求: PUT /api/user ${token !== undefined ? "（jwt-token 付き）" : "（jwt-token なし）"} 本文 ${JSON.stringify(本文)}・応答: HTTP ${res.status()}・本文 ${t.slice(0, 300)}`);
  return { ステータス: res.status(), 本文: t, json };
}

const トークン = (呼び名: string): string => {
  const t = A1505のトークン.get(呼び名);
  if (!t) throw new Error(`呼び名 ${呼び名} の認証トークンが無い（シードで受け取れていない）`);
  return t;
};
/** トークンの末尾1文字を、元が A なら B、それ以外なら A へ置き換える */
const 末尾を変える = (t: string): string => t.slice(0, -1) + (t.endsWith("A") ? "B" : "A");
const 選手 = (ctx: CaseCtx, 呼び名: string) => 選手を読む(ctx.notes.get(`〔プレイヤーID-A1505-${呼び名}〕`));

caseTest("IT-A15-05-001", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); supplement(トークンの補い); });
  await ctx.step(2, async () => { r = await 変更する(ctx.page, { user_name: "更新後ユーザー", profile: "スタンダードで遊んでいます。" }, トークン("001")); });
  await ctx.step(3, async () => { note(`応答 HTTP ${r.ステータス}`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json !== null && typeof r.json === "object" && !Array.isArray(r.json), "応答本体が JSON オブジェクト").toBe(true);
    expect.soft(r.json?.code, "code（整数200）").toBe(200);
    expect.soft(Number.isInteger(r.json?.code), "code が整数").toBe(true);
    expect.soft(r.json?.message, "message").toBe("Update user information");
  });
});

caseTest("IT-A15-05-002", async (ctx) => {
  let p: ReturnType<typeof 選手を読む> = null;
  await ctx.step(1, async () => { note(開発者ツールの代わり); supplement(トークンの補い); });
  await ctx.step(2, async () => { await 変更する(ctx.page, { user_name: "更新後ユーザー", profile: "スタンダードで遊んでいます。" }, トークン("002")); });
  await ctx.step(3, async () => { p = 選手(ctx, "002"); note(`DB の選手: ${JSON.stringify(p)}`); });
  await ctx.expected(async () => {
    expect.soft(p?.ニックネーム, "ニックネーム").toBe("更新後ユーザー");
    expect.soft(p?.プロフィール, "プロフィール").toBe("スタンダードで遊んでいます。");
  });
});

caseTest("IT-A15-05-003", async (ctx) => {
  let 前: ReturnType<typeof 選手を読む> = null; let 後: ReturnType<typeof 選手を読む> = null;
  await ctx.step(1, async () => { 前 = 選手(ctx, "003B"); note(`DB の他プレイヤー（変更前）: ${JSON.stringify(前)}`); });
  await ctx.step(2, async () => { supplement(トークンの補い); await 変更する(ctx.page, { user_name: "本人更新ユーザー", profile: "本人更新プロフィール" }, トークン("003A")); });
  await ctx.step(3, async () => { 後 = 選手(ctx, "003B"); note(`DB の他プレイヤー（変更後）: ${JSON.stringify(後)}`); });
  await ctx.expected(async () => {
    expect.soft(後?.ニックネーム, "他プレイヤーのニックネーム（更新されない）").toBe("他ユーザー");
    expect.soft(後?.プロフィール, "他プレイヤーのプロフィール（更新されない）").toBe("他プロフィール");
  });
});

caseTest("IT-A15-05-004", async (ctx) => {
  let p: ReturnType<typeof 選手を読む> = null;
  await ctx.step(1, async () => { note(開発者ツールの代わり); supplement(トークンの補い); });
  await ctx.step(2, async () => { await 変更する(ctx.page, { user_name: "プロフィール未指定ユーザー" }, トークン("004")); });
  await ctx.step(3, async () => { p = 選手(ctx, "004"); note(`DB の選手: ${JSON.stringify(p)}`); });
  await ctx.expected(async () => {
    expect.soft(p?.ニックネーム, "ニックネーム").toBe("プロフィール未指定ユーザー");
    expect.soft(p?.プロフィール, "プロフィール（null として保存）").toBeNull();
  });
});

caseTest("IT-A15-05-005", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { r = await 変更する(ctx.page, { user_name: "認証なしユーザー", profile: "認証なしプロフィール" }); });
  await ctx.step(3, async () => { note(`応答 HTTP ${r.ステータス}`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(401);
    expect.soft(r.json?.message, "メッセージ").toBe("Access Token is incorrect");
  });
});

caseTest("IT-A15-05-006", async (ctx) => {
  let r!: 応答; let bad = "";
  await ctx.step(1, async () => { supplement(トークンの補い); bad = 末尾を変える(トークン("006")); note("有効な認証トークンの末尾1文字を、元が A なら B、それ以外なら A へ置き換えた（値は記録しない）"); });
  await ctx.step(2, async () => { r = await 変更する(ctx.page, { user_name: "署名不正ユーザー", profile: "署名不正プロフィール" }, bad); });
  await ctx.step(3, async () => { note(`応答 HTTP ${r.ステータス}`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(401);
    expect.soft(r.json?.message, "メッセージ").toBe("Access Token is incorrect");
  });
});

caseTest("IT-A15-05-007", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); supplement("認証トークンは、選手のある会員としてログインの API で受け取ったあと、その選手を削除済みにした会員のもの（シードの作り）"); });
  await ctx.step(2, async () => { r = await 変更する(ctx.page, { user_name: "プレイヤー不存在ユーザー", profile: "プレイヤー不存在プロフィール" }, トークン("007")); });
  await ctx.step(3, async () => { note(`応答 HTTP ${r.ステータス}`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(401);
    expect.soft(r.json?.message, "メッセージ").toBe("Authentication failed");
  });
});

caseTest("IT-A15-05-008", async (ctx) => {
  let 前a: ReturnType<typeof 選手を読む> = null; let 前b: ReturnType<typeof 選手を読む> = null;
  let 後a: ReturnType<typeof 選手を読む> = null; let 後b: ReturnType<typeof 選手を読む> = null;
  await ctx.step(1, async () => { 前a = 選手(ctx, "008A"); 前b = 選手(ctx, "008B"); note(`DB の選手（前）: A ${JSON.stringify(前a)}・B ${JSON.stringify(前b)}`); });
  await ctx.step(2, async () => { await 変更する(ctx.page, { user_name: "認証なし更新" }, undefined, "1回目 "); });
  await ctx.step(3, async () => { supplement(トークンの補い); await 変更する(ctx.page, { user_name: "署名不正更新" }, 末尾を変える(トークン("008A")), "2回目 "); });
  await ctx.step(4, async () => { await 変更する(ctx.page, { user_name: "プレイヤー不存在更新" }, トークン("008C"), "3回目 "); });
  await ctx.step(5, async () => { 後a = 選手(ctx, "008A"); 後b = 選手(ctx, "008B"); note(`DB の選手（後）: A ${JSON.stringify(後a)}・B ${JSON.stringify(後b)}`); });
  await ctx.expected(async () => {
    expect.soft(後a?.ニックネーム, "プレイヤーAのニックネーム（認証拒否前から変わらない）").toBe(前a?.ニックネーム);
    expect.soft(後a?.プロフィール, "プレイヤーAのプロフィール（変わらない）").toBe(前a?.プロフィール);
    expect.soft(後b?.ニックネーム, "プレイヤーBのニックネーム（変わらない）").toBe(前b?.ニックネーム);
    expect.soft(後b?.プロフィール, "プレイヤーBのプロフィール（変わらない）").toBe(前b?.プロフィール);
  });
});

caseTest("IT-A15-05-016", async (ctx) => {
  let r1!: 応答; let p: ReturnType<typeof 選手を読む> = null; let 件数 = -1;
  await ctx.step(1, async () => { note(開発者ツールの代わり); supplement(トークンの補い); });
  await ctx.step(2, async () => {
    r1 = await 変更する(ctx.page, { user_name: "一回目ユーザー", profile: "一回目プロフィール" }, トークン("016"), "1回目 ");
    expect.soft(r1.ステータス, "1回目の HTTP ステータス 200（手順2の確かめ）").toBe(200);
  });
  await ctx.step(3, async () => { await 変更する(ctx.page, { user_name: "二回目ユーザー", profile: "二回目プロフィール" }, トークン("016"), "2回目 "); });
  await ctx.step(4, async () => {
    p = 選手(ctx, "016");
    件数 = 会員IDの選手の数(ctx.notes.get("〔会員ID-A1505-016〕"));
    note(`DB の選手: ${JSON.stringify(p)}・会員の選手の件数 ${件数}`);
  });
  await ctx.expected(async () => {
    expect.soft(p?.ニックネーム, "ニックネーム（二回目で上書き）").toBe("二回目ユーザー");
    expect.soft(p?.プロフィール, "プロフィール（二回目で上書き）").toBe("二回目プロフィール");
    expect.soft(件数, "プレイヤーが1件のまま").toBe(1);
  });
});
