/**
 * A15-01 ログインの「以降の認可」（デッキ情報参照 GET /api/deck/{id}）のケース 014・015・017（013・016・018・020 は a15-01-b.spec.ts）。正本: cases/A15-01_test_cases.tsv
 * 判定済みのケースの指紋を守るため、spec/a15/a15-01.spec.ts と分けた。実装したケースと解釈は記録 review/A15-01_progress_2026-11-24_dev.md。
 *
 * 「ブラウザの開発者ツールで要求を送り、Network で応答を見る」の代わりに、試験ブラウザ（ケースのブラウザのコンテキスト）から API へ
 * 要求を送り、応答の HTTP ステータス・本文を読む（a15-01.spec.ts と同じ）。送り先は API サーバー（config/env.ts の API_BASE_URL）。
 * 事前準備の「Cookie と Network 記録を削除して未認証状態にする」は、ケースごとに新しいブラウザのコンテキストで始まることで満たす。
 * アクセストークンの値は記録しない。
 */
import { Page, test } from "@playwright/test";
import { API_BASE_URL } from "../../config/env";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { A1501のメール } from "../../seeds/a15-01";
import "../../seeds/a15-01-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 開発者ツールの代わり = "開発者ツールの代わりに、試験ブラウザから API へ要求を送り、応答の HTTP ステータス・本文を読んだ";
const 印の補い = "要求のメールアドレスは、シード表の値の @ の前に実行の印を付けた値（シードで登録した会員）にした";
const 未認証の補い = "事前準備の「Cookie と Network 記録を削除して未認証状態にする」は、ケースごとに新しいブラウザのコンテキスト（Cookie なし）で始めることで満たした";

type 応答 = { ステータス: number; 本文: string; json: Record<string, unknown> | null };
const 読む = (t: string): Record<string, unknown> | null => { try { return JSON.parse(t) as Record<string, unknown>; } catch { return null; } };
const 文字列 = (v: unknown): string => (typeof v === "string" ? v : "");

/** ログインの API（POST /api/user/login）。応答のトークンは記録しない */
async function ログイン(page: Page, メール: string, パスワード: string): Promise<応答> {
  const res = await page.request.post(`${API_BASE_URL}/api/user/login`, { data: { id: メール, password: パスワード }, failOnStatusCode: false, timeout: 60_000 });
  const t = await res.text();
  const json = 読む(t);
  const 伏せた = json && Object.fromEntries(Object.entries(json).map(([k, v]) => [k, /token|session/.test(k) && typeof v === "string" ? `（${v.length}文字・記録しない）` : v]));
  note(`要求: POST /api/user/login 本文 {"id":"${メール}","password":"（パスワード）"}・応答: HTTP ${res.status()}・本文 ${伏せた ? JSON.stringify(伏せた) : t.slice(0, 300)}`);
  return { ステータス: res.status(), 本文: t, json };
}

/** デッキ情報参照（GET /api/deck/{id}）。token が undefined なら jwt-token を付けない。閲覧用トークンはクエリで送る */
async function デッキを参照する(page: Page, デッキID: string, token?: string, 閲覧用?: string): Promise<応答> {
  const q = 閲覧用 !== undefined ? `?display_token=${encodeURIComponent(閲覧用)}` : "";
  const res = await page.request.get(`${API_BASE_URL}/api/deck/${デッキID}${q}`, { headers: token !== undefined ? { "jwt-token": token } : {}, failOnStatusCode: false, timeout: 60_000 });
  const t = await res.text();
  note(`要求: GET /api/deck/${デッキID}${閲覧用 !== undefined ? `?display_token=${閲覧用}` : "（閲覧用トークンなし）"}${token !== undefined ? "（jwt-token 付き）" : "（jwt-token なし）"}・応答: HTTP ${res.status()}・本文 ${t.slice(0, 300)}`);
  return { ステータス: res.status(), 本文: t, json: 読む(t) };
}

const デッキID = (ctx: CaseCtx, n: string) => ctx.notes.get(`〔デッキID-A1501-${n}〕`);

caseTest("IT-A15-01-014", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); supplement(未認証の補い); });
  await ctx.step(2, async () => { r = await デッキを参照する(ctx.page, デッキID(ctx, "014")); });
  await ctx.step(3, async () => { note(`応答 HTTP ${r.ステータス}・メッセージ ${JSON.stringify(r.json?.message)}`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(404);
    expect.soft(r.json?.message, "メッセージ").toBe("Deck is not found");
    expect.soft(r.ステータス, "HTTP ステータスが 401 でない").not.toBe(401);
  });
});

caseTest("IT-A15-01-015", async (ctx) => {
  let l!: 応答; let bad = ""; let r: 応答 | null = null;
  await ctx.step(1, async () => { note(開発者ツールの代わり); supplement(印の補い); supplement(未認証の補い); });
  await ctx.step(2, async () => { l = await ログイン(ctx.page, A1501のメール("owner.a1501-015@example.test"), "LoginA1501-015!"); });
  await ctx.step(3, async () => {
    const parts = 文字列(l.json?.access_token).split(".");
    if (parts.length !== 3) { note(`手順2の応答のアクセストークンが「.」で3つに分かれない（${parts.length} つ。HTTP ${l.ステータス}）ので、署名不正の値を作れない`); return; }
    bad = `${parts[0]}.${parts[1]}.invalid-signature-a1501-015`;
    note("アクセストークンの第3部（署名）を「invalid-signature-a1501-015」に置き換えた（第1部・第2部はそのまま。値は記録しない）");
  });
  await ctx.step(4, async () => {
    if (!bad) { note("手順3で署名不正の値を作れなかったので、手順4の要求は送れない"); return; }
    r = await デッキを参照する(ctx.page, デッキID(ctx, "015"), bad);
  });
  await ctx.step(5, async () => { note(`応答 HTTP ${r?.ステータス ?? "送れない"}・メッセージ ${JSON.stringify(r?.json?.message)}`); });
  await ctx.expected(async () => {
    expect.soft(r !== null, "デッキ情報参照の要求を送れた").toBe(true);
    expect.soft(r?.ステータス, "HTTP ステータス").toBe(404);
    expect.soft(r?.json?.message, "メッセージ").toBe("Deck is not found");
    expect.soft(r?.ステータス, "HTTP ステータスが 401 でない").not.toBe(401);
  });
});

caseTest("IT-A15-01-017", async (ctx) => {
  let l!: 応答; let r: 応答 | null = null;
  await ctx.step(1, async () => { note(開発者ツールの代わり); supplement(印の補い); supplement(未認証の補い); });
  await ctx.step(2, async () => { l = await ログイン(ctx.page, A1501のメール("owner.a1501-017@example.test"), "LoginA1501-017!"); });
  await ctx.step(3, async () => {
    const t = 文字列(l.json?.access_token);
    if (!t) { note(`手順2の応答にアクセストークンが無い（HTTP ${l.ステータス}・本文 ${l.本文.slice(0, 200)}）ので、手順3の要求は送れない`); return; }
    r = await デッキを参照する(ctx.page, デッキID(ctx, "017"), t);
  });
  await ctx.step(4, async () => { note(`応答 HTTP ${r?.ステータス ?? "送れない"}・デッキ名 ${JSON.stringify(r?.json?.deck_name)}`); });
  await ctx.expected(async () => {
    expect.soft(r !== null, "デッキ情報参照の要求を送れた（手順2でアクセストークンが返った）").toBe(true);
    expect.soft(r?.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r?.json?.deck_name, "デッキ名").toBe("A1501-017-PRIVATE");
  });
});
