/**
 * A15-02 ログアウト（デッキビルダーの API の POST /api/user/logout）。正本: cases/A15-02_test_cases.tsv
 * 実装したケースと解釈は記録 review/A15-02_progress_2026-11-14_dev.md。
 *
 * 「ブラウザの開発者ツールで要求を送る」の代わりに、試験ブラウザ（ケースのブラウザのコンテキスト）から API へ要求を送り、
 * 応答の HTTP ステータス・本文・Set-Cookie と、ブラウザの Cookie を読む（コンテキストの要求なので Cookie はブラウザと同じ入れ物に入る）。
 * アプリの秘密の値（署名鍵）は使わない。署名不正のトークンは、署名の部分を置き換えて作る。
 */
import { Page, test } from "@playwright/test";
import { API_BASE_URL } from "../../config/env";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { A1501のメール } from "../../seeds/a15-01";
import "../../seeds/a15-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 開発者ツールの代わり = "開発者ツールの代わりに、試験ブラウザから API へ要求を送り、応答の HTTP ステータス・本文・Set-Cookie と、ブラウザの Cookie を読んだ";
const 印の補い = "ログインの要求のメールアドレスは、シード表の値の @ の前に実行の印を付けた値（シードで登録した会員）にした";

type 応答 = { ステータス: number; 本文: string; json: Record<string, unknown> | null; SetCookie: string[] };
const 読む = (t: string): Record<string, unknown> | null => { try { return JSON.parse(t) as Record<string, unknown>; } catch { return null; } };
const 文字列 = (v: unknown): string => (typeof v === "string" ? v : "");

async function 送る(page: Page, 何: string, path: string, opt: { data?: unknown; token?: string }): Promise<応答> {
  const headers: Record<string, string> = opt.token !== undefined ? { "jwt-token": opt.token } : {};
  const res = await page.request.post(`${API_BASE_URL}${path}`, { data: opt.data, headers, failOnStatusCode: false, timeout: 60_000 });
  const t = await res.text();
  const SetCookie = res.headersArray().filter((h) => h.name.toLowerCase() === "set-cookie").map((h) => h.value);
  const json = 読む(t);
  const 伏せた = json && Object.fromEntries(Object.entries(json).map(([k, v]) => [k, /token|session/.test(k) && typeof v === "string" ? `（${v.length}文字・記録しない）` : v]));
  note(`${何}: POST ${path}${opt.token !== undefined ? "（jwt-token 付き）" : "（jwt-token なし）"}・応答 HTTP ${res.status()}・本文 ${JSON.stringify(伏せた) ?? t.slice(0, 200)}・Set-Cookie ${SetCookie.map((c) => c.split(";")[0].split("=")[0]).join("・") || "なし"}`);
  return { ステータス: res.status(), 本文: t, json, SetCookie };
}

/** シードの会員でログインし、アクセストークンを控える（手順2） */
async function ログインして控える(ctx: CaseCtx, n: string): Promise<string> {
  supplement(印の補い);
  const r = await 送る(ctx.page, "ログイン", "/api/user/login", { data: { id: A1501のメール(`logout.a1502-${n}@example.test`), password: `LogoutA1502-${n}!` } });
  const token = 文字列(r.json?.access_token);
  if (!token) throw new Error(`ログインの API がアクセストークンを返さない（HTTP ${r.ステータス}）`);
  return token;
}

/** ブラウザに保持された Cookie のうち、値がアクセストークンのもの（無ければ undefined） */
async function トークンのCookie(ctx: CaseCtx, token: string) {
  const cs = await ctx.page.context().cookies(API_BASE_URL);
  note(`ブラウザの Cookie: ${cs.map((c) => `${c.name}（値は記録しない${c.value === token ? "・アクセストークンと同じ値" : ""}）`).join("・") || "なし"}`);
  return cs.find((c) => c.value === token);
}

/**
 * 応答の Set-Cookie に、アクセストークンの Cookie の値を空にする（または期限切れにする）設定があるか。
 * アクセストークンの Cookie は、名前に access_token を含むもの（現行の deck-api は「eccube.access_token」）。
 * ロードバランサ（AWSALB）・セッション（eccube）・メンテナンス・表示の切替（device_view）の Cookie は数えない（2026-11-17。
 * 前はどの Cookie でも数えていて、アクセストークンと関係のない Cookie の空の設定で落ちていた）
 */
const 空にする設定 = (r: 応答): boolean => {
  const 空 = r.SetCookie.filter((c) => /^[^=]*access_token[^=]*=/i.test(c) && (/^[^=]+=(;|$)/.test(c) || /expires=Thu, 01 Jan 1970|max-age=0/i.test(c)));
  note(`Set-Cookie で値を空にする（期限切れにする）もの: ${r.SetCookie.filter((c) => /^[^=]+=(;|$)/.test(c) || /expires=Thu, 01 Jan 1970|max-age=0/i.test(c)).map((c) => c.split("=")[0]).join("・") || "なし"}（数えるのは名前に access_token を含むものだけ）`);
  return 空.length > 0;
};

const b64url = (o: unknown): string => Buffer.from(JSON.stringify(o)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** 001・002: ログインしてから、控えたトークンでログアウトする */
function ログアウトする(n: string, check: (r: 応答) => void) {
  return async (ctx: CaseCtx): Promise<void> => {
    let token = ""; let r!: 応答;
    await ctx.step(1, async () => { note(開発者ツールの代わり); });
    await ctx.step(2, async () => { token = await ログインして控える(ctx, n); });
    await ctx.step(3, async () => { r = await 送る(ctx.page, "ログアウト", "/api/user/logout", { token }); });
    await ctx.step(4, async () => { note(`応答 HTTP ${r.ステータス}・結果コード ${JSON.stringify(r.json?.code)}・結果メッセージ ${JSON.stringify(r.json?.message)}`); });
    await ctx.expected(async () => {
      expect.soft(r.本文.length >= 0, "応答を受け取った").toBe(true);
      check(r);
    });
  };
}

caseTest("IT-A15-02-001", ログアウトする("001", (r) => { expect.soft(r.ステータス, "HTTP ステータス").toBe(200); }));

caseTest("IT-A15-02-002", ログアウトする("002", (r) => {
  expect.soft(r.json?.code, "結果コード").toBe(200);
  expect.soft(r.json?.message, "結果メッセージ").toBe("Logout success");
}));

caseTest("IT-A15-02-003", async (ctx) => {
  let token = ""; let 前 = false; let 後: Awaited<ReturnType<typeof トークンのCookie>>;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { token = await ログインして控える(ctx, "003"); });
  await ctx.step(3, async () => {
    前 = (await トークンのCookie(ctx, token)) !== undefined;
    expect.soft(前, "ログイン後、ブラウザに保持されたアクセストークンの Cookie に値が設定されている（手順3の確かめ）").toBe(true);
  });
  await ctx.step(4, async () => { await 送る(ctx.page, "ログアウト", "/api/user/logout", { token }); });
  await ctx.step(5, async () => { 後 = await トークンのCookie(ctx, token); });
  await ctx.expected(async () => {
    expect.soft(後 === undefined, "ログアウト後、ブラウザに保持されたアクセストークンの Cookie にトークン値が残っていない").toBe(true);
  });
});

/** 004・005: トークンが無い／署名不正のトークンで拒否され、Cookie が空にされない */
function 拒否される(n: "004" | "005") {
  return async (ctx: CaseCtx): Promise<void> => {
    let token = ""; let r!: 応答; let 残る: Awaited<ReturnType<typeof トークンのCookie>>;
    await ctx.step(1, async () => { note(開発者ツールの代わり); });
    await ctx.step(2, async () => { token = await ログインして控える(ctx, n); });
    let 送る値: string | undefined;
    if (n === "005") {
      await ctx.step(3, async () => {
        const p = token.split(".");
        if (p.length !== 3) throw new Error(`アクセストークンが「.」で3つに分かれない（${p.length} つ）`);
        送る値 = `${p[0]}.${p[1]}.invalid-signature-a1502-005`;
        note("アクセストークンの第3部（署名）を「invalid-signature-a1502-005」に置き換えた（値は記録しない）");
      });
    }
    await ctx.step(n === "004" ? 3 : 4, async () => { r = await 送る(ctx.page, "ログアウト", "/api/user/logout", { token: 送る値 }); });
    await ctx.step(n === "004" ? 4 : 5, async () => { 残る = await トークンのCookie(ctx, token); });
    await ctx.expected(async () => {
      expect.soft(r.ステータス, "HTTP ステータス").toBe(401);
      expect.soft(r.json !== null && "code" in r.json, "応答に結果コードが含まれる").toBe(true);
      expect.soft(r.json?.message, "結果メッセージ").toBe("Access Token is incorrect");
      expect.soft(残る !== undefined, "ブラウザに保持されたアクセストークンの Cookie が空にされず値が残る").toBe(true);
    });
  };
}

caseTest("IT-A15-02-004", 拒否される("004"));
caseTest("IT-A15-02-005", 拒否される("005"));

caseTest("IT-A15-02-009", async (ctx) => {
  let r!: 応答;
  const token = `${b64url({ typ: "JWT", alg: "HS256" })}.${b64url({ iss: "deck_builder", sub: "1502000009", iat: Math.floor(Date.now() / 1000) })}.invalid-signature-a1502-009`;
  await ctx.step(1, async () => {
    note(開発者ツールの代わり);
    supplement("事前準備のアクセストークン「A15-02-TOKEN-009」は、ヘッダ（HS256）・内容（発行者 deck_builder・利用者ID 1502000009・発行時刻）を base64url で並べ、署名の部分を「invalid-signature-a1502-009」にして作った（署名鍵は使わない）");
  });
  await ctx.step(2, async () => { r = await 送る(ctx.page, "ログアウト", "/api/user/logout", { token }); });
  await ctx.step(3, async () => { note(`応答 HTTP ${r.ステータス}・結果メッセージ ${JSON.stringify(r.json?.message)}・Set-Cookie ${r.SetCookie.length} 件`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(401);
    expect.soft(r.json !== null && "code" in r.json, "応答に結果コードが含まれる").toBe(true);
    expect.soft(r.json?.message, "結果メッセージ（「Authentication failed」ではない）").toBe("Access Token is incorrect");
    expect.soft(空にする設定(r), "応答でアクセストークンの Cookie を空にする設定が行われない").toBe(false);
  });
});
