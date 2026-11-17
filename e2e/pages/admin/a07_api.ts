/**
 * A07（MTGバイヤーの API）を呼ぶ部品。正本の手順「開発者ツールの Console から要求を送り、Network で確かめる」の代わりに、
 * テストのブラウザ（同じブラウザのコンテキスト）から API サーバーへ要求を送り、応答の HTTP ステータスと本文を読む。
 *
 * - 送り先は API サーバー（config/env の API_BASE_URL。2026-11-17 依頼者に教わった。管理画面のホストではない）。
 * - 正本の経路「/api/admin/…」は、アプリの経路の設定で「/api/v1/admin/…」に置かれている（開発環境の API サーバーで /api/admin/… は 404）。
 *   毎回まず正本の経路へ送って応答を記録し、404 なら「/api/v1」の経路へ送り直して、その応答で確かめる（どちらも注記に残す）。
 * - 認証トークンは、管理者ログインの API（POST /api/v1/admin/login.json。フォームでログインIDとパスワード）で受け取る。
 *   正本の「署名シークレットを設定して試験用のトークンを生成する」は、共有の開発環境では秘密の値を書き換えられないので、この形に読み替える。値は記録しない。
 * - 認証トークンは、アプリが読む要求ヘッダ（jwt-token）に付ける。設計書は「リクエストヘッダで受け取る」とだけ定める。
 * - 応答の一覧には、ほかの方の試験データ（氏名・電話番号など）も入る。注記と画面には、ケースが見る要素（控えた番号の要素）と件数だけを出す。
 */
import { APIResponse, Page, request, test } from "@playwright/test";
import { API_BASE_URL, BASE_URL } from "../../config/env";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

export type 応答 = { ステータス: number; 本文: string; json: unknown; 送った経路: string; 正本の経路の応答: number | null; 種類: string };

/** 管理者ログインの API で認証トークンを受け取る（ログインIDとパスワードは呼ぶ側のシードの値。記録しない） */
export async function 管理者のトークン(ログインID: string, パスワード: string): Promise<string> {
  const api = await request.newContext({ baseURL: API_BASE_URL, ignoreHTTPSErrors: true });
  try {
    let last = "";
    for (let i = 0; i < 3; i++) {
      const res = await api.post("/api/v1/admin/login.json", { form: { login_id: ログインID, password: パスワード }, failOnStatusCode: false, timeout: 60_000 });
      const t = await res.text();
      if (res.status() === 200) {
        const token = (JSON.parse(t) as { jwtToken?: string }).jwtToken;
        if (!token) throw new Error("管理者ログインの API の応答に認証トークンが無い");
        return token;
      }
      last = `応答 ${res.status()}: ${t.slice(0, 200)}`;
      if (res.status() < 500) break;
      await new Promise((r) => setTimeout(r, 10_000));
    }
    throw new Error(`管理者ログインの API で認証トークンを受け取れない（${last}）`);
  } finally { await api.dispose(); }
}

/** 正本の手順「ECCUBEトップページを開く」。開発環境のトップは遅い時間帯があるので、待ち時間を長めにして2回まで開き直す */
export async function トップページを開く(page: Page): Promise<void> {
  let st = 0;
  for (let i = 0; i < 2 && !(st > 0 && st < 500); i++) {
    const res = await page.goto(`${BASE_URL}/ja/`, { timeout: 180_000, waitUntil: "domcontentloaded" }).catch(() => null);
    st = res?.status() ?? 0;
  }
  if (!(st > 0 && st < 500)) throw new Error(`ECCUBEトップページを開けない（応答 ${st || "なし"}）`);
}

/** 認証トークンの末尾1文字を、元が A なら B、それ以外なら A へ置き換える（正本の手順） */
export const 末尾を置き換える = (token: string): string => token.slice(0, -1) + (token.endsWith("A") ? "B" : "A");

/** 認証トークンの署名部分（2つ目のピリオドより後ろ）の先頭1文字を、元が A なら B、それ以外なら A へ置き換える（正本の手順） */
export function 署名の先頭を置き換える(token: string): string {
  const i = token.indexOf(".", token.indexOf(".") + 1);
  if (i < 0 || i + 1 >= token.length) throw new Error("認証トークンにピリオドが2つ無い（署名部分が読めない）");
  return token.slice(0, i + 1) + (token[i + 1] === "A" ? "B" : "A") + token.slice(i + 2);
}

type 送る中身 = { トークン?: string; 本文?: unknown; フォーム?: Record<string, string> };

async function 一回送る(page: Page, method: string, 経路: string, opt: 送る中身): Promise<APIResponse> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opt.トークン !== undefined) headers["jwt-token"] = opt.トークン;
  return page.request.fetch(`${API_BASE_URL}${経路}`, {
    method, headers, failOnStatusCode: false, timeout: 120_000,
    ...(opt.本文 !== undefined ? { data: opt.本文 } : {}),
    ...(opt.フォーム !== undefined ? { form: opt.フォーム } : {}),
  });
}

/**
 * MTGバイヤーの API へ要求を送る。正本の経路（/api/admin/…）へ送り、404 なら /api/v1/admin/… へ送り直す。
 * 注記には、送った経路・認証トークンの有無・HTTP ステータス・本文の長さを出す（本文の中身はケースの側で、見る要素だけを出す）。
 */
export async function 送る(page: Page, method: "GET" | "POST" | "PUT", 正本の経路: string, opt: 送る中身 = {}): Promise<応答> {
  if (!正本の経路.startsWith("/api/admin/")) throw new Error(`正本の経路が /api/admin/ で始まらない: ${正本の経路}`);
  const トークン = opt.トークン === undefined ? "認証トークンのヘッダなし" : "認証トークンのヘッダ付き";
  let res = await 一回送る(page, method, 正本の経路, opt);
  let 送った経路 = 正本の経路;
  let 正本の経路の応答: number | null = null;
  if (res.status() === 404) {
    正本の経路の応答 = 404;
    送った経路 = 正本の経路.replace(/^\/api\/admin\//, "/api/v1/admin/");
    note(`正本の経路 ${method} ${正本の経路}（${トークン}）は HTTP 404。アプリの経路の設定で置かれている ${送った経路} へ同じ要求を送り直した`);
    res = await 一回送る(page, method, 送った経路, opt);
  }
  const 本文 = await res.text();
  let json: unknown = null;
  try { json = JSON.parse(本文); } catch { /* JSON でない応答は本文で見る */ }
  note(`要求: ${method} ${送った経路}（${トークン}${opt.本文 !== undefined ? "・本文あり" : opt.フォーム !== undefined ? `・フォームの本文 ${Object.keys(opt.フォーム).join("・")}` : "・本文なし"}）・応答: HTTP ${res.status()}・本文 ${本文.length} 文字${Array.isArray(json) ? `（JSON 配列 ${json.length} 件）` : ""}`);
  return { ステータス: res.status(), 本文, json, 送った経路, 正本の経路の応答, 種類: res.headers()["content-type"] ?? "" };
}

/** 確かめた応答を、テストのブラウザの画面に表で出す（エビデンスの画面に写すため）。ケースが見る要素だけを渡す */
export async function 応答を画面に出す(page: Page, 見出し: string, r: 応答, 見る要素: unknown): Promise<void> {
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
  const 件数 = Array.isArray(r.json) ? `JSON 配列 ${r.json.length} 件` : typeof r.json;
  await page.setContent(`<!doctype html><meta charset="utf-8"><body style="font-family:sans-serif;padding:16px">
<h3>${esc(見出し)}（E2E が受け取った応答を表示）</h3>
<p>送った経路: ${esc(r.送った経路)}${r.正本の経路の応答 ? `（正本の経路は HTTP ${r.正本の経路の応答}）` : ""}<br>HTTP ステータス: <b>${r.ステータス}</b><br>本文: ${esc(件数)}</p>
<pre style="white-space:pre-wrap;background:#f4f4f4;padding:8px">${esc(JSON.stringify(見る要素, null, 2) ?? String(見る要素))}</pre></body>`);
}
