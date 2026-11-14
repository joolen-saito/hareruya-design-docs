/**
 * A15-04 他ユーザー情報参照（デッキビルダーの API の GET /user）。正本: cases/A15-04_test_cases.tsv
 * 実装したケースと解釈は記録 review/A15-04_progress_2026-11-14_dev.md。
 *
 * 「ブラウザの開発者ツールで要求を送る」の代わりに、ブラウザでユーザー情報参照のアドレスを開いて要求を送り（認証トークンのヘッダが要るときは
 * ブラウザに付けて送る）、画面に出た応答本体（JSON）と HTTP ステータスを読む。エビデンスには応答本体が写る。
 * 認証トークンは、トークン所有者の会員のメールアドレスとパスワードでログインの API（A15-01）を呼んで受け取る（アプリの秘密の値は使わない）。
 */
import { Page, request, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { 選手を読む } from "../../db/a15_04";
import { A1504_PASSWORD, A1504のメール } from "../../seeds/a15-04";
import "../../seeds/a15-04";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 開発者ツールの代わり = "開発者ツールの代わりに、ブラウザでユーザー情報参照（GET /api/user）のアドレスを開いて要求を送り、画面に出た応答本体（JSON）と HTTP ステータスを読んだ";

type 応答 = { ステータス: number; 本文: string; json: Record<string, unknown> | null };

/** ユーザー情報参照（GET /user）へ要求を送る。デッキユーザーIDを渡さないときはクエリを付けない。トークンを渡したら認証トークンのヘッダに付ける */
async function ユーザー情報参照(page: Page, a: { デッキユーザーID?: string; トークン?: string }): Promise<応答> {
  await page.setExtraHTTPHeaders(a.トークン !== undefined ? { "jwt-token": a.トークン } : {});
  const url = `${BASE_URL}/api/user${a.デッキユーザーID !== undefined ? `?deck_user_id=${encodeURIComponent(a.デッキユーザーID)}` : ""}`;
  const res = await page.goto(url, { timeout: 60_000 });
  if (!res) throw new Error("ユーザー情報参照の応答が無い");
  const 本文 = await res.text();
  let json: Record<string, unknown> | null = null;
  try { json = JSON.parse(本文) as Record<string, unknown>; } catch { /* JSON でない応答はそのまま本文で見る */ }
  note(`要求: GET ${new URL(url).pathname}${new URL(url).search}${a.トークン !== undefined ? "（認証トークンのヘッダ付き）" : "（認証トークンのヘッダなし）"}・応答: HTTP ${res.status()}・本文: ${本文.slice(0, 500)}`);
  return { ステータス: res.status(), 本文, json };
}

/** 会員のメールアドレスとパスワードでログインの API を呼び、認証トークンを受け取る */
async function トークンを受け取る(シード表のメール: string): Promise<string> {
  const api = await request.newContext({ baseURL: BASE_URL, ignoreHTTPSErrors: true });
  try {
    const login = await api.post("/api/user/login", { data: { id: A1504のメール(シード表のメール), password: A1504_PASSWORD } });
    if (login.status() !== 200) throw new Error(`ログインの API が失敗した（応答 ${login.status()}）: ${(await login.text()).slice(0, 300)}`);
    const token = ((await login.json()) as { access_token?: string }).access_token;
    if (!token) throw new Error("ログインの API の応答に認証トークンが無い");
    return token;
  } finally { await api.dispose(); }
}

const 番号 = (ctx: CaseCtx, 呼び名: string) => ctx.notes.get(呼び名);

/** 応答の3項目（ニックネーム・プロフィール・デッキユーザーID）を確かめる */
function 三項目(r: 応答, nick: string | null, prof: string | null, duid: string, 何の: string): void {
  expect.soft(r.json?.user_name, `${何の}ニックネーム`).toBe(nick);
  expect.soft(r.json?.profile, `${何の}プロフィール`).toBe(prof);
  expect.soft(r.json?.deck_user_id, `${何の}デッキユーザーID`).toBe(duid);
}

/** 認証トークンのヘッダを付けず、控えたデッキユーザーIDで参照する（手順1〜3） */
function トークンなしで参照(呼び名: string, check: (r: 応答, ctx: CaseCtx) => void | Promise<void>, opt: { 値?: string } = {}) {
  return async (ctx: CaseCtx): Promise<void> => {
    let r!: 応答;
    await ctx.step(1, async () => { note(開発者ツールの代わり); });
    await ctx.step(2, async () => { r = await ユーザー情報参照(ctx.page, { デッキユーザーID: opt.値 ?? 番号(ctx, 呼び名) }); });
    await ctx.step(3, async () => { note(`応答 HTTP ${r.ステータス}・ニックネーム ${JSON.stringify(r.json?.user_name)}・プロフィール ${JSON.stringify(r.json?.profile)}・デッキユーザーID ${JSON.stringify(r.json?.deck_user_id)}`); });
    await ctx.expected(async () => {
      expect.soft(r.json, "応答本体が JSON として読める（以下の確かめの前提）").not.toBeNull();
      await check(r, ctx);
    });
  };
}

caseTest("IT-A15-04-001", トークンなしで参照("〔デッキユーザーID-A1504-001B〕", (r, ctx) => {
  三項目(r, "ニックネームB1504-001-B", "プロフィールB1504-001-B", 番号(ctx, "〔デッキユーザーID-A1504-001B〕"), "プレイヤーBの");
  for (const v of ["ニックネームA1504-001-A", "プロフィールA1504-001-A", 番号(ctx, "〔デッキユーザーID-A1504-001A〕"),
    "ニックネームC1504-001-C", "プロフィールC1504-001-C", 番号(ctx, "〔デッキユーザーID-A1504-001C〕")]) {
    expect.soft(r.本文.includes(v), `応答にプレイヤーA・Cの値「${v}」が含まれない`).toBe(false);
  }
}));

caseTest("IT-A15-04-003", トークンなしで参照("〔デッキユーザーID-A1504-003〕", (r) => {
  expect.soft(r.json?.user_name, "ニックネーム（変換・丸めなし）").toBe("<ニック&'1504-003-N'> 全角ＡＢＣ");
  expect.soft(r.json?.profile, "プロフィール（前後の半角空白2つずつを含むまま）").toBe("  前後に半角空白あり 1504-003-P  ");
}));

caseTest("IT-A15-04-004", トークンなしで参照("〔デッキユーザーID-A1504-004〕", (r) => {
  expect.soft(r.json !== null && typeof r.json === "object" && !Array.isArray(r.json), "応答本体が1つの JSON オブジェクト").toBe(true);
  const keys = Object.keys(r.json ?? {});
  expect.soft(keys.length, `応答のキーの数（${keys.join("・")}）`).toBe(4);
  expect.soft([...keys].sort(), "応答のキー（処理結果コード・ニックネーム・プロフィール・デッキユーザーID）").toEqual(["code", "deck_user_id", "profile", "user_name"]);
  for (const k of keys) expect.soft(/^[a-z]+(_[a-z]+)*$/.test(k), `キー「${k}」が小文字と下線だけのスネークケース`).toBe(true);
  for (const k of ["user_name", "profile", "deck_user_id"]) expect.soft(typeof r.json?.[k], `「${k}」の値の型`).toBe("string");
}));

caseTest("IT-A15-04-005", トークンなしで参照("〔デッキユーザーID-A1504-005〕", (r, ctx) => {
  const keys = Object.keys(r.json ?? {});
  expect.soft([...keys].sort(), "応答のキーが処理結果コード・ニックネーム・プロフィール・デッキユーザーIDの4つだけ").toEqual(["code", "deck_user_id", "profile", "user_name"]);
  const メール = A1504のメール("a1504-005-a@example.test");
  supplement(`メールアドレスはシード表の a1504-005-a@example.test に実行の印を付けた ${メール} で登録したので、その値が応答に含まれないことを確かめた`);
  expect.soft(r.本文.includes(メール), `応答にメールアドレス「${メール}」が含まれない`).toBe(false);
  expect.soft(r.本文.includes("a1504-005-a"), "応答にメールアドレスの前半「a1504-005-a」が含まれない").toBe(false);
  const pid = 番号(ctx, "〔プレイヤーID-A1504-005〕");
  expect.soft(Object.values(r.json ?? {}).some((v) => String(v) === pid), `応答の値にプレイヤーID「${pid}」が含まれない`).toBe(false);
  expect.soft(r.本文.includes("1504005D"), "応答にDCIナンバー「1504005D」が含まれない").toBe(false);
}));

caseTest("IT-A15-04-006", トークンなしで参照("〔デッキユーザーID-A1504-006〕", (r) => {
  expect.soft(r.json !== null && "user_name" in r.json, "ニックネームの項目がある（欠落していない）").toBe(true);
  expect.soft(r.json !== null && "profile" in r.json, "プロフィールの項目がある（欠落していない）").toBe(true);
  expect.soft(r.json?.user_name, "ニックネームの値が null（空文字列でない）").toBeNull();
  expect.soft(r.json?.profile, "プロフィールの値が null（空文字列でない）").toBeNull();
}));

caseTest("IT-A15-04-007", async (ctx) => {
  let r!: 応答; let token = "";
  await ctx.step(1, async () => {
    note(開発者ツールの代わり);
    token = await トークンを受け取る("a1504-007-b@example.test");
    supplement("トークン所有者（顧客ID 〔顧客ID-A1504-007〕）の有効な認証トークンは、その会員のメールアドレスとパスワードでログインの API（POST /api/user/login）を呼んで受け取った（値は記録しない）");
  });
  await ctx.step(2, async () => { r = await ユーザー情報参照(ctx.page, { デッキユーザーID: 番号(ctx, "〔デッキユーザーID-A1504-007A〕"), トークン: token }); });
  await ctx.step(3, async () => { note(`応答 HTTP ${r.ステータス}・ニックネーム ${JSON.stringify(r.json?.user_name)}・デッキユーザーID ${JSON.stringify(r.json?.deck_user_id)}`); });
  await ctx.expected(async () => {
    三項目(r, "ニックネーム1504-007-A", "プロフィール1504-007-A", 番号(ctx, "〔デッキユーザーID-A1504-007A〕"), "対象プレイヤーの");
    expect.soft(r.本文.includes("ニックネーム1504-007-B"), "応答にトークン所有者のニックネーム「ニックネーム1504-007-B」が含まれない").toBe(false);
  });
});

/** 008・009: 認証トークンが無い／検証できなくても 401 にならず、指定のデッキユーザーIDのプレイヤーが返る */
function トークンを問わず参照(n: "008" | "009", トークン?: string) {
  return async (ctx: CaseCtx): Promise<void> => {
    let r!: 応答;
    await ctx.step(1, async () => { note(開発者ツールの代わり); });
    await ctx.step(2, async () => { r = await ユーザー情報参照(ctx.page, { デッキユーザーID: 番号(ctx, `〔デッキユーザーID-A1504-${n}〕`), トークン }); });
    await ctx.step(3, async () => { note(`応答 HTTP ${r.ステータス}`); });
    await ctx.expected(async () => {
      expect.soft(r.ステータス, "HTTP ステータス（401 ではなく 200）").toBe(200);
      三項目(r, `ニックネーム1504-${n}-A`, `プロフィール1504-${n}-A`, 番号(ctx, `〔デッキユーザーID-A1504-${n}〕`), "");
    });
  };
}

caseTest("IT-A15-04-008", トークンを問わず参照("008"));

caseTest("IT-A15-04-009", トークンを問わず参照("009", "bad-signature-1504-009"));

caseTest("IT-A15-04-010", トークンなしで参照("", (r, ctx) => {
  for (const v of ["ニックネーム1504-010-A", "プロフィール1504-010-A", 番号(ctx, "〔デッキユーザーID-A1504-010〕")]) {
    expect.soft(r.本文.includes(v), `応答に登録済みのプレイヤーの値「${v}」が含まれない`).toBe(false);
  }
}, { 値: "1504010Z" }));

caseTest("IT-A15-04-011", トークンなしで参照("", (r) => {
  expect.soft(r.json?.message, "失敗応答のメッセージ").toBe("Invalid request parameters");
}, { 値: "1504011Z" }));

caseTest("IT-A15-04-012", トークンなしで参照("", (r) => {
  expect.soft(r.ステータス, "HTTP ステータス（404 ではなく 400）").toBe(400);
}, { 値: "1504012Z" }));

caseTest("IT-A15-04-013", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => {
    r = await ユーザー情報参照(ctx.page, { デッキユーザーID: 番号(ctx, "〔デッキユーザーID-A1504-013〕") });
    expect.soft(r.ステータス, "HTTP ステータス 200").toBe(200);
  });
  let p: ReturnType<typeof 選手を読む> = null;
  await ctx.step(3, async () => { p = 選手を読む(番号(ctx, "〔プレイヤーID-A1504-013〕")); note(`DB のプレイヤー: ${JSON.stringify(p)}`); });
  await ctx.expected(async () => {
    expect.soft(p?.ニックネーム, "DB のニックネーム（変わらない）").toBe("ニックネーム1504-013-A");
    expect.soft(p?.プロフィール, "DB のプロフィール（変わらない）").toBe("プロフィール1504-013-A");
    expect.soft(p?.更新日時, "DB の更新日時（日本時間。変わらない）").toBe("2026-01-01 00:00:00");
  });
});

caseTest("IT-A15-04-014", トークンなしで参照("〔デッキユーザーID-A1504-014〕", (r) => {
  expect.soft(r.json?.code, "処理結果コードの値（整数の200）").toBe(200);
  expect.soft(Number.isInteger(r.json?.code), "処理結果コードの値が整数（文字列でない）").toBe(true);
}));

caseTest("IT-A15-04-015", async (ctx) => {
  let r!: 応答; let token = "";
  await ctx.step(1, async () => {
    note(開発者ツールの代わり);
    token = await トークンを受け取る("a1504-015-a@example.test");
    supplement("顧客ID 〔顧客ID-A1504-015〕の有効な認証トークンは、その会員のメールアドレスとパスワードでログインの API（POST /api/user/login）を呼んで受け取った（値は記録しない）");
  });
  await ctx.step(2, async () => { r = await ユーザー情報参照(ctx.page, { トークン: token }); });
  await ctx.step(3, async () => { note(`応答 HTTP ${r.ステータス}・ニックネーム ${JSON.stringify(r.json?.user_name)}・デッキユーザーID ${JSON.stringify(r.json?.deck_user_id)}`); });
  await ctx.expected(async () => {
    expect.soft(r.json?.user_name, "トークン所有者自身のニックネーム").toBe("ニックネーム1504-015-A");
    expect.soft(r.json?.profile, "トークン所有者自身のプロフィール").toBe("プロフィール1504-015-A");
    expect.soft(r.json?.deck_user_id, "トークン所有者自身のデッキユーザーID").toBe(番号(ctx, "〔デッキユーザーID-A1504-015〕"));
  });
});

caseTest("IT-A15-04-016", トークンなしで参照("〔デッキユーザーID-A1504-016〕", (r) => {
  expect.soft(r.json !== null && "user_name" in r.json, "ニックネームの項目がある（欠落していない）").toBe(true);
  expect.soft(r.json?.user_name, "ニックネームの値が null（空文字列でない）").toBeNull();
  expect.soft(r.json?.profile, "プロフィール").toBe("プロフィールA1504-016");
}));

caseTest("IT-A15-04-017", トークンなしで参照("〔デッキユーザーID-A1504-017〕", (r) => {
  expect.soft(r.json !== null && "profile" in r.json, "プロフィールの項目がある（欠落していない）").toBe(true);
  expect.soft(r.json?.profile, "プロフィールの値が null（空文字列でない）").toBeNull();
  expect.soft(r.json?.user_name, "ニックネーム").toBe("ニックネームA1504-017");
}));
