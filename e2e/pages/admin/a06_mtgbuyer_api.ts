/**
 * A06（MTGBuyer の API）のケースが使う、API への要求の送り方。HTTP のパスはここにだけ書く。
 *
 * - 「ブラウザの開発者ツールから要求を送る」手順の代わりに、ブラウザのページから API サーバー（config/env.ts の API_BASE_URL）へ要求を送り、
 *   送った要求と応答（HTTP ステータス・応答本体）をページに表として出す。各手順のあとの画面に、この表が写る。
 * - API の入口は `/api/v1/…`。ケースの手順の `/api/…` は `/api/v1/…` に当たる（2026-11-14 の見直し review/A06_A07_api_recheck_2026-11-14.md。
 *   `/api/admin/login.json` は 404）。入口の読み替えだけをし、その先のパス（拡張子・単数/複数など）はケースの文のまま送る。
 * - 認証トークンは、管理者のログインID・パスワードで管理者のログイン API を呼んで受け取る。トークンの値は記録しない（長さだけ）。
 * - 署名の違うトークンは、環境の署名の鍵と違う試験用の鍵で、この端末で作る（環境の鍵は使わない・読まない）。
 */
import { createHmac } from "node:crypto";
import { Page, test } from "@playwright/test";
import { API_BASE_URL } from "../../config/env";

export type 応答 = { ステータス: number; 本文: string; json: unknown; 送ったパス: string };
export type 要求 = {
  方式: "GET" | "POST" | "PUT";
  /** ケースの文のパス（`/api/…`）。クエリは query で渡す */
  パス: string;
  /** URL のクエリパラメータ（順に付ける） */
  query?: [string, string][];
  /** 本文（フォームの値）。ログインのように、本文で送る手順のときだけ */
  form?: Record<string, string>;
  /** 本文（JSON） */
  json?: unknown;
  /** 認証トークン（要求ヘッダ jwt-token に付ける）。undefined なら付けない */
  トークン?: string;
};

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** ケースの文のパス `/api/…` を、API の入口 `/api/v1/…` に読み替える（2026-11-14 の見直し） */
export function 入口のパス(パス: string): string {
  return パス.replace(/^\/api\//, "/api/v1/");
}

/** 応答本体の中の認証トークンを伏せる（長さだけ残す） */
export function 伏せる(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(伏せる);
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, /token/i.test(k) && typeof x === "string" ? `（${x.length}文字の値・記録しない）` : 伏せる(x)]));
  }
  return v;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** 送った要求と応答を、ページに表として出す（エビデンスの画面に写す） */
export async function 要求と応答を画面に出す(page: Page, 何: string, r: 要求, res: 応答): Promise<void> {
  const 本文 = res.json !== null && res.json !== undefined ? JSON.stringify(伏せる(res.json), null, 2) : res.本文;
  const 送った本文 = r.form ? Object.entries(r.form).map(([k, v]) => `${k}=${/password/i.test(k) ? "（記録しない）" : v}`).join("&") : r.json !== undefined ? JSON.stringify(r.json) : "（なし）";
  const html = `<!doctype html><meta charset="utf-8"><title>${esc(何)}</title>
<style>body{font-family:sans-serif;margin:16px}th{text-align:left;background:#eef;padding:4px 8px;vertical-align:top;white-space:nowrap}td{padding:4px 8px;vertical-align:top}pre{margin:0;white-space:pre-wrap;word-break:break-all;max-width:1100px}</style>
<h2>${esc(何)}（開発者ツールの Network の代わりの記録）</h2>
<table border="1" cellspacing="0">
<tr><th>方式</th><td>${r.方式}</td></tr>
<tr><th>送り先</th><td>${esc(API_BASE_URL + res.送ったパス)}</td></tr>
<tr><th>ケースの文のパス</th><td>${esc(r.パス)}</td></tr>
<tr><th>要求ヘッダ jwt-token</th><td>${r.トークン === undefined ? "付けない" : `付けた（${r.トークン.length}文字の値・記録しない）`}</td></tr>
<tr><th>本文</th><td><pre>${esc(送った本文)}</pre></td></tr>
<tr><th>HTTP ステータス</th><td><b>${res.ステータス}</b></td></tr>
<tr><th>応答本体</th><td><pre>${esc(本文 === "" ? "（空）" : 本文)}</pre></td></tr>
</table>`;
  await page.setContent(html);
}

/** API へ要求を1件送り、応答を読む。送った要求と応答はページに出し、注記にも残す */
export async function 送る(page: Page, 何: string, r: 要求): Promise<応答> {
  const qs = r.query && r.query.length ? `?${r.query.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&")}` : "";
  const 送ったパス = `${入口のパス(r.パス)}${qs}`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (r.トークン !== undefined) headers["jwt-token"] = r.トークン;
  const res = await page.request.fetch(`${API_BASE_URL}${送ったパス}`, {
    method: r.方式, headers, form: r.form, data: r.json, failOnStatusCode: false, timeout: 60_000, ignoreHTTPSErrors: true,
  });
  const 本文 = await res.text();
  let json: unknown = null;
  try { json = 本文 === "" ? null : JSON.parse(本文); } catch { /* JSON でない応答は本文のまま見る */ }
  const out: 応答 = { ステータス: res.status(), 本文, json, 送ったパス };
  note(`${何}: ${r.方式} ${送ったパス}（${r.トークン === undefined ? "jwt-token なし" : "jwt-token 付き"}）・応答 HTTP ${out.ステータス}・本文 ${json !== null ? JSON.stringify(伏せる(json)).slice(0, 400) : 本文.slice(0, 200) || "（空）"}`);
  await 要求と応答を画面に出す(page, 何, r, out);
  return out;
}

/** 管理者のログイン API（本文はフォームの値 login_id・password）を呼ぶ */
export function ログインを送る(page: Page, 何: string, ログインID: string, パスワード: string): Promise<応答> {
  return 送る(page, 何, { 方式: "POST", パス: "/api/admin/login.json", form: { login_id: ログインID, password: パスワード } });
}

/** 管理者のログインID・パスワードでログイン API を呼び、認証トークンを受け取る（事前準備の「有効な jwt-token を取得している」） */
export async function トークンを受け取る(page: Page, ログインID: string, パスワード: string): Promise<string> {
  const r = await ログインを送る(page, "事前準備: 管理者のログイン API で認証トークンを受け取る", ログインID, パスワード);
  const t = (r.json as { jwtToken?: unknown } | null)?.jwtToken;
  if (r.ステータス !== 200 || typeof t !== "string" || !t) throw new Error(`管理者のログイン API が認証トークンを返さない（HTTP ${r.ステータス}）: ${r.本文.slice(0, 300)}`);
  return t;
}

const b64url = (b: Buffer | string): string => Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** トークンのペイロード（2つ目の区切り）を復号して読む。署名は確かめない */
export function ペイロードを読む(トークン: string): Record<string, unknown> | null {
  const p = トークン.split(".")[1];
  if (!p) return null;
  try { return JSON.parse(Buffer.from(p.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")) as Record<string, unknown>; } catch { return null; }
}

/** 試験用の、環境の鍵と違う鍵（HS256）で、管理者IDを利用者IDに持つトークンを作る（発行者は買取アプリの管理者） */
export function 違う鍵のトークン(管理者ID: string): string {
  const head = b64url(JSON.stringify({ typ: "JWT", alg: "HS256" }));
  const body = b64url(JSON.stringify({ iss: "mtgbuyer_admin", sub: String(管理者ID), iat: Math.floor(Date.now() / 1000) }));
  const 鍵 = Buffer.from("e2e-a06-different-signing-key-not-the-env-one-32b", "utf8");
  const sig = b64url(createHmac("sha256", 鍵).update(`${head}.${body}`).digest());
  return `${head}.${body}.${sig}`;
}

/** 店頭買取受注コメント更新（A06-04）。コメントは URL のクエリパラメータで送る（undefined なら付けない）。拡張子は既定 .json */
export function コメント更新を送る(page: Page, 何: string, 受注ID: string, v: { コメント?: string; トークン?: string; 拡張子?: string }): Promise<応答> {
  return 送る(page, 何, {
    方式: "PUT", パス: `/api/admin/otcBuyOrder/${受注ID}/freeComment${v.拡張子 ?? ".json"}`,
    query: v.コメント === undefined ? [] : [["free_comment", v.コメント]], トークン: v.トークン,
  });
}

/** 本人確認証明書更新（A06-13）。証明書IDは URL のクエリで送る */
export function 証明書更新を送る(page: Page, 何: string, 店頭買取ID: string, 証明書ID: string, トークン?: string): Promise<応答> {
  return 送る(page, 何, { 方式: "PUT", パス: `/api/admin/otcBuyOrder/${店頭買取ID}/identification.json`, query: [["identification", 証明書ID]], トークン });
}
