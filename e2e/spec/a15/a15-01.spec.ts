/**
 * A15-01 ログイン（デッキビルダーの API の POST /api/user/login・GET /api/user）。正本: cases/A15-01_test_cases.tsv
 * 実装したケースと解釈は記録 review/A15-01_progress_2026-11-14_dev.md。
 *
 * 「ブラウザの開発者ツールで要求を送る」の代わりに、試験ブラウザ（ケースのブラウザのコンテキスト）から API へ要求を送り、
 * 応答の HTTP ステータス・本文と、ブラウザの Cookie を読む（コンテキストの要求なので Cookie はブラウザと同じ入れ物に入る）。
 * アプリの秘密の値（署名鍵）は使わない。トークンは「.」で3つに分けて、第1部・第2部を base64url として読むだけにする。
 */
import { Page, test } from "@playwright/test";
import { API_BASE_URL } from "../../config/env";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { A1501のメール } from "../../seeds/a15-01";
import "../../seeds/a15-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 開発者ツールの代わり = "開発者ツールの代わりに、試験ブラウザから API へ要求を送り、応答の HTTP ステータス・本文（とブラウザの Cookie）を読んだ";
const 印の補い = "要求のメールアドレスは、シード表の値の @ の前に実行の印を付けた値（シードで登録した会員）にした";

type 応答 = { ステータス: number; 本文: string; json: Record<string, unknown> | null; ヘッダ: Record<string, string> };

const 読む = (本文: string): Record<string, unknown> | null => { try { return JSON.parse(本文) as Record<string, unknown>; } catch { return null; } };

/** 値を伏せて記録する（トークン・セッションIDは記録しない） */
const 伏せる = (j: Record<string, unknown> | null): string =>
  JSON.stringify(j && Object.fromEntries(Object.entries(j).map(([k, v]) => [k, /token|session/.test(k) && typeof v === "string" ? `（${v.length}文字・記録しない）` : v])));

/** ログインの API（POST /api/user/login）へ JSON の本文を送る */
async function ログイン(page: Page, 本文: Record<string, unknown>, 何回目 = ""): Promise<応答> {
  const res = await page.request.post(`${API_BASE_URL}/api/user/login`, { data: 本文, failOnStatusCode: false, timeout: 60_000 });
  const t = await res.text();
  const json = 読む(t);
  const 送った = Object.fromEntries(Object.entries(本文).map(([k, v]) => [k, k === "password" ? "（パスワード）" : v]));
  note(`${何回目}要求: POST /api/user/login 本文 ${JSON.stringify(送った)}・応答: HTTP ${res.status()}・本文 ${伏せる(json) ?? t.slice(0, 300)}`);
  return { ステータス: res.status(), 本文: t, json, ヘッダ: res.headers() };
}

/** ユーザー情報参照（GET /api/user、デッキユーザーID指定なし）へ、認証トークンのヘッダ（jwt-token）を付けて送る */
async function ユーザー情報参照(page: Page, トークン: string, 何回目 = ""): Promise<応答> {
  const res = await page.request.get(`${API_BASE_URL}/api/user`, { headers: { "jwt-token": トークン }, failOnStatusCode: false, timeout: 60_000 });
  const t = await res.text();
  note(`${何回目}要求: GET /api/user（jwt-token 付き・デッキユーザーID指定なし）・応答: HTTP ${res.status()}・本文 ${t.slice(0, 300)}`);
  return { ステータス: res.status(), 本文: t, json: 読む(t), ヘッダ: res.headers() };
}

const base64url = (s: string): string => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
/** トークンの第1部（ヘッダ）・第2部（内容）を読む（署名は検証しない） */
function トークンを読む(token: string): { ヘッダ: Record<string, unknown> | null; 内容: Record<string, unknown> | null } {
  const [h, p] = token.split(".");
  return { ヘッダ: h ? 読む(base64url(h)) : null, 内容: p ? 読む(base64url(p)) : null };
}

const 番号 = (ctx: CaseCtx, 呼び名: string) => ctx.notes.get(呼び名);
const 文字列 = (v: unknown): string => (typeof v === "string" ? v : "");

/** 成功の応答（HTTP 200・code 200・メッセージ・トークン・セッションID） */
function 成功の応答(r: 応答, メッセージ?: string): void {
  expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
  expect.soft(r.json?.code, "結果コード").toBe(200);
  if (メッセージ) expect.soft(r.json?.message, "結果メッセージ").toBe(メッセージ);
  else expect.soft(文字列(r.json?.message).length > 0, "結果メッセージがある").toBe(true);
  expect.soft(文字列(r.json?.access_token).length > 0, "アクセストークンが返る").toBe(true);
  expect.soft(文字列(r.json?.session_id).length > 0, "セッションIDが返る").toBe(true);
}

/** 失敗の応答（HTTP 401・結果コード・「ID or password does not match」） */
function 照合できない応答(r: 応答, 何の: string): void {
  expect.soft(r.ステータス, `${何の}HTTP ステータス`).toBe(401);
  expect.soft(r.json !== null && "code" in r.json, `${何の}応答 JSON に結果コードがある`).toBe(true);
  expect.soft(r.json?.message, `${何の}結果メッセージ`).toBe("ID or password does not match");
}

/** 001・002・003・007 の共通: シードの会員でログインする（手順1〜3） */
function ログインして確かめる(n: string, check: (r: 応答, ctx: CaseCtx) => void | Promise<void>, 追加: Record<string, unknown> = {}) {
  return async (ctx: CaseCtx): Promise<void> => {
    let r!: 応答;
    await ctx.step(1, async () => { note(開発者ツールの代わり); supplement(印の補い); });
    await ctx.step(2, async () => { r = await ログイン(ctx.page, { id: A1501のメール(`login.a1501-${n}@example.test`), password: `LoginA1501-${n}!`, ...追加 }); });
    await ctx.step(3, async () => { note(`応答 HTTP ${r.ステータス}・結果コード ${JSON.stringify(r.json?.code)}・結果メッセージ ${JSON.stringify(r.json?.message)}`); });
    await ctx.expected(async () => {
      expect.soft(r.json, "応答本体が JSON として読める（以下の確かめの前提）").not.toBeNull();
      await check(r, ctx);
    });
  };
}

caseTest("IT-A15-01-001", ログインして確かめる("001", (r) => { 成功の応答(r, "Authentication success"); }));

caseTest("IT-A15-01-002", ログインして確かめる("002", (r, ctx) => {
  const t = トークンを読む(文字列(r.json?.access_token));
  note(`アクセストークンのヘッダ ${JSON.stringify(t.ヘッダ)}・内容の項目 ${Object.keys(t.内容 ?? {}).join("・")}・内容 ${JSON.stringify(t.内容)}`);
  supplement("アクセストークンは「.」で3つに分け、第1部（ヘッダ）・第2部（内容）を base64url として読んだ（署名は検証していない。アプリの秘密の値は使わない）");
  const 会員ID = 番号(ctx, "〔会員ID-A1501-002〕");
  expect.soft(t.内容 !== null && "iss" in t.内容 && 文字列(t.内容.iss).length > 0, "内容に発行者（iss）がある").toBe(true);
  expect.soft(String(t.内容?.sub ?? t.内容?.uid ?? t.内容?.user_id ?? t.内容?.customer_id ?? ""), `内容の利用者IDが会員ID ${会員ID}`).toBe(会員ID);
  expect.soft(t.内容 !== null && typeof t.内容.iat === "number", "内容に発行時刻（iat）がある").toBe(true);
  expect.soft(t.ヘッダ?.alg, "署名方式").toBe("HS256");
}));

caseTest("IT-A15-01-003", ログインして確かめる("003", async (r, ctx) => {
  const token = 文字列(r.json?.access_token);
  const cookies = await ctx.page.context().cookies(API_BASE_URL);
  note(`ブラウザの Cookie: ${cookies.map((c) => `${c.name}（期限 ${c.expires > 0 ? new Date(c.expires * 1000).toISOString() : "なし（セッション）"}・値は記録しない）`).join("・") || "なし"}`);
  const tokenCookie = cookies.find((c) => token !== "" && c.value === token);
  expect.soft(tokenCookie !== undefined, "応答のアクセストークンが Cookie に設定されている").toBe(true);
  expect.soft((tokenCookie?.expires ?? -1) > 0, "そのCookie に有効期限が付いている").toBe(true);
  expect.soft(文字列(r.json?.session_id).length > 0, "開始したセッションのIDが応答に含まれる").toBe(true);
}));

caseTest("IT-A15-01-005", async (ctx) => {
  let a!: 応答; let b!: 応答;
  await ctx.step(1, async () => { supplement(印の補い); a = await ログイン(ctx.page, { id: A1501のメール("nonregular.a1501-005@example.test"), password: "LoginA1501-005!" }, "1回目 "); });
  await ctx.step(2, async () => { b = await ログイン(ctx.page, { id: A1501のメール("deleted.a1501-005@example.test"), password: "LoginA1501-005!" }, "2回目 "); });
  await ctx.step(3, async () => { note(`1回目 HTTP ${a.ステータス}・2回目 HTTP ${b.ステータス}`); });
  await ctx.expected(async () => {
    expect.soft(a.json !== null && b.json !== null, "2回の応答本体が JSON として読める").toBe(true);
    照合できない応答(a, "本会員ではない会員の"); 照合できない応答(b, "削除済み会員の");
  });
});

caseTest("IT-A15-01-006", async (ctx) => {
  let a!: 応答; let b!: 応答;
  await ctx.step(1, async () => { supplement(印の補い); a = await ログイン(ctx.page, { id: A1501のメール("absent.a1501-006@example.test"), password: "LoginA1501-006!" }, "1回目 "); });
  await ctx.step(2, async () => { b = await ログイン(ctx.page, { id: A1501のメール("login.a1501-006@example.test"), password: "WrongA1501-006!" }, "2回目 "); });
  await ctx.step(3, async () => { note(`1回目 HTTP ${a.ステータス}・2回目 HTTP ${b.ステータス}`); });
  await ctx.expected(async () => {
    expect.soft(a.json !== null && b.json !== null, "2回の応答本体が JSON として読める").toBe(true);
    照合できない応答(a, "会員が存在しない場合の"); 照合できない応答(b, "パスワードが一致しない場合の");
  });
});

caseTest("IT-A15-01-007", ログインして確かめる("007", (r) => { 成功の応答(r); }, { _token: "invalid-token", extra: 1 }));

caseTest("IT-A15-01-009", async (ctx) => {
  let la!: 応答; let lb!: 応答; let ua: 応答 | null = null; let ub: 応答 | null = null;
  await ctx.step(1, async () => { supplement(印の補い); la = await ログイン(ctx.page, { id: A1501のメール("player.a1501-009@example.test"), password: "LoginA1501-009!" }, "手順1 "); });
  await ctx.step(2, async () => { lb = await ログイン(ctx.page, { id: A1501のメール("login.a1501-009@example.test"), password: "LoginA1501-009!" }, "手順2 "); });
  await ctx.step(3, async () => {
    const t = 文字列(la.json?.access_token);
    if (!t) { note("手順1の応答にアクセストークンが無いので、手順3の要求は送れない"); return; }
    ua = await ユーザー情報参照(ctx.page, t, "手順3 ");
  });
  await ctx.step(4, async () => {
    const t = 文字列(lb.json?.access_token);
    if (!t) { note(`手順2の応答にアクセストークンが無い（HTTP ${lb.ステータス}・本文 ${lb.本文.slice(0, 200)}）ので、手順4の要求は送れない`); return; }
    ub = await ユーザー情報参照(ctx.page, t, "手順4 ");
  });
  await ctx.step(5, async () => { note(`手順3 HTTP ${ua?.ステータス ?? "送れない"}・手順4 HTTP ${ub?.ステータス ?? "送れない"}`); });
  await ctx.expected(async () => {
    expect.soft(ua?.ステータス, "プレイヤーを持つ会員のアクセストークンでの HTTP ステータス").toBe(200);
    expect.soft(ub !== null, "プレイヤーを持たない会員のアクセストークンで要求を送れた（手順2でアクセストークンが返った）").toBe(true);
    expect.soft(ub?.ステータス, "プレイヤーを持たない会員のアクセストークンでの HTTP ステータス").toBe(401);
  });
});

caseTest("IT-A15-01-012", async (ctx) => {
  let a!: 応答; let b!: 応答; let c!: 応答;
  const メール = A1501のメール("login.a1501-012@example.test");
  await ctx.step(1, async () => { note(開発者ツールの代わり); supplement(印の補い); });
  await ctx.step(2, async () => { a = await ログイン(ctx.page, { id: メール, password: "LoginA1501-012!" }, "1回目 "); });
  await ctx.step(3, async () => { b = await ログイン(ctx.page, { password: "LoginA1501-012!" }, "2回目 "); });
  await ctx.step(4, async () => { c = await ログイン(ctx.page, { id: メール, password: "WrongA1501-012!" }, "3回目 "); });
  await ctx.step(5, async () => { note(`項目名: 1回目 ${Object.keys(a.json ?? {}).join("・")}／2回目 ${Object.keys(b.json ?? {}).join("・")}／3回目 ${Object.keys(c.json ?? {}).join("・")}`); });
  await ctx.expected(async () => {
    expect.soft([...Object.keys(a.json ?? {})].sort(), "1回目の項目（code・message・access_token・session_id）").toEqual(["access_token", "code", "message", "session_id"]);
    expect.soft(a.json?.code, "1回目の code（数値200）").toBe(200);
    expect.soft(typeof a.json?.access_token, "1回目の access_token の型").toBe("string");
    expect.soft(typeof a.json?.session_id, "1回目の session_id の型").toBe("string");
    expect.soft([...Object.keys(b.json ?? {})].sort(), "2回目の項目（code・message の2項目だけ）").toEqual(["code", "message"]);
    expect.soft(b.json?.code, "2回目の code").toBe(400);
    expect.soft([...Object.keys(c.json ?? {})].sort(), "3回目の項目（code・message の2項目だけ）").toEqual(["code", "message"]);
    expect.soft(c.json?.code, "3回目の code").toBe(401);
  });
});

caseTest("IT-A15-01-021", async (ctx) => {
  let l!: 応答; let bad = ""; let u: 応答 | null = null;
  await ctx.step(1, async () => { note(開発者ツールの代わり); supplement(印の補い); });
  await ctx.step(2, async () => { l = await ログイン(ctx.page, { id: A1501のメール("cba1501-021a@example.test"), password: "Passw0rd-CBA1501021" }); });
  await ctx.step(3, async () => {
    const parts = 文字列(l.json?.access_token).split(".");
    if (parts.length !== 3) { note(`手順2の応答のアクセストークンが「.」で3つに分かれない（${parts.length} つ）`); return; }
    bad = `${parts[0]}.${parts[1]}.invalid-signature-a1501-cb021`;
    note("アクセストークンの第3部（署名）を「invalid-signature-a1501-cb021」に置き換えた（第1部・第2部はそのまま。値は記録しない）");
  });
  await ctx.step(4, async () => { if (bad) u = await ユーザー情報参照(ctx.page, bad); });
  await ctx.step(5, async () => { note(`応答 HTTP ${u?.ステータス ?? "送れない"}`); });
  await ctx.expected(async () => {
    expect.soft(u !== null, "署名不正のトークンで要求を送れた（手順2でアクセストークンが返った）").toBe(true);
    expect.soft(u?.ステータス, "署名を検証できないトークンでの HTTP ステータス").toBe(401);
  });
});
