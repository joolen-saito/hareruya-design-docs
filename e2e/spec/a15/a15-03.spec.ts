/**
 * A15-03 ユーザー情報参照（デッキビルダーの API の GET /api/user）。正本: cases/A15-03_test_cases.tsv
 * 実装したケースと解釈は記録 review/A15-03_progress_2026-11-24_dev.md。
 *
 * 「ブラウザの開発者ツールで要求を送り、Network で応答を見る」の代わりに、試験ブラウザ（ケースのブラウザのコンテキスト）から API へ
 * 要求を送り、応答の HTTP ステータス・本文を読む（A15-01・A15-05 と同じ）。送り先は API サーバー（config/env.ts の API_BASE_URL）。
 * 認証トークンは、シードでその会員のメールアドレスとパスワードでログインの API を呼んで受け取った値（記録しない）。
 * 009（決め打ちの顧客ID・プレイヤーの総件数1件）は、流せない一覧に残したので書かない。
 */
import { Page, test } from "@playwright/test";
import { API_BASE_URL } from "../../config/env";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { A1503のトークン } from "../../seeds/a15-03";
import "../../seeds/a15-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 開発者ツールの代わり = "開発者ツールの代わりに、試験ブラウザからユーザー情報参照の API（GET /api/user）へ要求を送り、応答の HTTP ステータス・本文を読んだ";
const トークンの補い = "有効な認証トークンは、シードでその会員のメールアドレスとパスワードでログインの API を呼んで受け取った値を使った（値は記録しない）";
const 呼び出し元の補い = "「デッキビルダーアプリからの呼出し」は、デッキビルダーアプリと同じく API サーバーへ jwt-token のヘッダを付けて送る形にした（呼び出し元を示す値は正本に定めが無いので付けない）";

type 応答 = { ステータス: number; 本文: string; json: Record<string, unknown> | null };

/** ユーザー情報参照（GET /api/user・デッキユーザーIDの指定なし）へ送る。token が undefined ならヘッダを付けない */
async function 参照する(page: Page, token?: string): Promise<応答> {
  const res = await page.request.get(`${API_BASE_URL}/api/user`, { headers: token !== undefined ? { "jwt-token": token } : {}, failOnStatusCode: false, timeout: 60_000 });
  const t = await res.text();
  let json: Record<string, unknown> | null = null;
  try { json = JSON.parse(t) as Record<string, unknown>; } catch { /* JSON でない */ }
  note(`要求: GET /api/user ${token !== undefined ? "（jwt-token 付き）" : "（jwt-token なし）"}・デッキユーザーIDの指定なし・応答: HTTP ${res.status()}・本文 ${t.slice(0, 300)}`);
  return { ステータス: res.status(), 本文: t, json };
}

const トークン = (呼び名: string): string => {
  const t = A1503のトークン.get(呼び名);
  if (!t) throw new Error(`呼び名 ${呼び名} の認証トークンが無い（シードで受け取れていない）`);
  return t;
};
/** トークンの末尾1文字を、元が A なら B、それ以外なら A へ置き換える */
const 末尾を変える = (t: string): string => t.slice(0, -1) + (t.endsWith("A") ? "B" : "A");

/** 応答本文の user_name・profile・deck_user_id */
function 値(r: 応答) {
  return { user_name: r.json?.user_name, profile: r.json?.profile, deck_user_id: r.json?.deck_user_id };
}

/** 手順1〜3（開発者ツールを開く・トークン付きで送る・応答を見る）。応答を返す */
async function トークンで見る(ctx: CaseCtx, 呼び名: string, 補い: string[] = []): Promise<応答> {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); for (const m of [トークンの補い, ...補い]) supplement(m); });
  await ctx.step(2, async () => { r = await 参照する(ctx.page, トークン(呼び名)); });
  await ctx.step(3, async () => { note(`応答 HTTP ${r.ステータス}・user_name ${JSON.stringify(r.json?.user_name)}・profile ${JSON.stringify(r.json?.profile)}・deck_user_id ${JSON.stringify(r.json?.deck_user_id)}`); });
  return r;
}

const 拒否のメッセージ = ["Access Token is incorrect", "Authentication failed"];

caseTest("IT-A15-03-001", async (ctx) => {
  const r = await トークンで見る(ctx, "001", [呼び出し元の補い]);
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json !== null && typeof r.json === "object" && !Array.isArray(r.json), "応答本文のルートがオブジェクト").toBe(true);
    expect.soft(r.json?.code, "処理結果コード code").toBe(200);
    const v = 値(r);
    expect.soft(typeof v.user_name, "user_name が文字列").toBe("string");
    expect.soft(typeof v.profile, "profile が文字列").toBe("string");
    expect.soft(typeof v.deck_user_id, "deck_user_id が文字列").toBe("string");
  });
});

caseTest("IT-A15-03-002", async (ctx) => {
  const r = await トークンで見る(ctx, "002");
  await ctx.expected(async () => {
    expect.soft(r.json?.user_name, "user_name").toBe("A1503-002-NICK");
    expect.soft(r.json?.profile, "profile").toBe("A1503-002-PROF");
    expect.soft(r.json?.deck_user_id, "deck_user_id").toBe("A1503002");
  });
});

caseTest("IT-A15-03-003", async (ctx) => {
  const r = await トークンで見る(ctx, "003A", ["プレイヤーAの認証トークンで送った（プレイヤーBのトークンはシードでも受け取っていない）"]);
  await ctx.expected(async () => {
    expect.soft(r.json?.user_name, "user_name（プレイヤーAの値）").toBe("A1503-003-NICK-A");
    expect.soft(r.json?.profile, "profile（プレイヤーAの値）").toBe("A1503-003-PROF-A");
    expect.soft(r.json?.deck_user_id, "deck_user_id（プレイヤーAの値）").toBe("A1503003");
    for (const b of ["A1503-003-NICK-B", "A1503-003-PROF-B", "B1503003"]) expect.soft(r.本文.includes(b), `プレイヤーBの値「${b}」が応答に含まれない`).toBe(false);
  });
});

caseTest("IT-A15-03-004", async (ctx) => {
  const r = await トークンで見る(ctx, "004");
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    const v = 値(r);
    expect.soft(r.json !== null && "user_name" in r.json, "応答に user_name の項目がある").toBe(true);
    expect.soft(v.user_name, "user_name").toBeNull();
    expect.soft(r.json !== null && "profile" in r.json, "応答に profile の項目がある").toBe(true);
    expect.soft(v.profile, "profile").toBeNull();
    expect.soft(r.json !== null && "deck_user_id" in r.json, "応答に deck_user_id の項目がある").toBe(true);
    expect.soft(v.deck_user_id, "deck_user_id").toBeNull();
  });
});

caseTest("IT-A15-03-005", async (ctx) => {
  const r = await トークンで見る(ctx, "005");
  await ctx.expected(async () => {
    expect.soft(r.json?.user_name, "user_name").toBe("A1503-005-NICK");
    expect.soft(r.json !== null && "profile" in r.json, "応答に profile の項目がある").toBe(true);
    expect.soft(r.json?.profile, "profile").toBeNull();
    expect.soft(r.json?.deck_user_id, "deck_user_id").toBe("A1503005");
  });
});

caseTest("IT-A15-03-006", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { r = await 参照する(ctx.page); });
  await ctx.step(3, async () => { note(`応答 HTTP ${r.ステータス}・処理結果コード ${JSON.stringify(r.json?.code)}・メッセージ ${JSON.stringify(r.json?.message)}`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(401);
    expect.soft(r.json !== null && "code" in r.json, "応答本文に処理結果コードがある").toBe(true);
    expect.soft(拒否のメッセージ, "メッセージ（「Access Token is incorrect」か「Authentication failed」）").toContain(r.json?.message);
  });
});

caseTest("IT-A15-03-007", async (ctx) => {
  let r!: 応答; let bad = "";
  await ctx.step(1, async () => { supplement(トークンの補い); bad = 末尾を変える(トークン("007")); note("有効な認証トークンの末尾1文字を、元が A なら B、それ以外なら A へ置き換えた（値は記録しない）"); });
  await ctx.step(2, async () => { note(開発者ツールの代わり); r = await 参照する(ctx.page, bad); });
  await ctx.step(3, async () => { note(`応答 HTTP ${r.ステータス}・処理結果コード ${JSON.stringify(r.json?.code)}・メッセージ ${JSON.stringify(r.json?.message)}`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(401);
    expect.soft(r.json !== null && "code" in r.json, "応答本文に処理結果コードがある").toBe(true);
    expect.soft(拒否のメッセージ, "メッセージ（「Access Token is incorrect」か「Authentication failed」）").toContain(r.json?.message);
  });
});

caseTest("IT-A15-03-008", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); supplement("署名が正しい認証トークンは、選手のある会員としてログインの API で受け取ったあと、その選手を削除済みにした会員のもの（シードの作り）"); });
  await ctx.step(2, async () => { r = await 参照する(ctx.page, トークン("008")); });
  await ctx.step(3, async () => { note(`応答 HTTP ${r.ステータス}・処理結果コード ${JSON.stringify(r.json?.code)}・メッセージ ${JSON.stringify(r.json?.message)}`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(401);
    expect.soft(r.json !== null && "code" in r.json, "応答本文に処理結果コードがある").toBe(true);
    expect.soft(拒否のメッセージ, "メッセージ（「Access Token is incorrect」か「Authentication failed」）").toContain(r.json?.message);
  });
});

caseTest("IT-A15-03-011", async (ctx) => {
  const r = await トークンで見る(ctx, "011");
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json !== null && "user_name" in r.json, "応答に user_name の項目がある").toBe(true);
    expect.soft(r.json?.user_name, "user_name").toBeNull();
    expect.soft(r.json?.profile, "profile").toBe("A1503-011-PROF");
    expect.soft(r.json?.deck_user_id, "deck_user_id").toBe("A1503011");
  });
});

caseTest("IT-A15-03-012", async (ctx) => {
  const r = await トークンで見る(ctx, "012");
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.user_name, "user_name").toBe("A1503-012-NICK");
    expect.soft(r.json?.profile, "profile").toBe("A1503-012-PROF");
    expect.soft(r.json !== null && "deck_user_id" in r.json, "応答に deck_user_id の項目がある").toBe(true);
    expect.soft(r.json?.deck_user_id, "deck_user_id").toBeNull();
  });
});
