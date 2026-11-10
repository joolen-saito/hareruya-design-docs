/**
 * psql への接続先の渡し方（2026-11-10 依頼者了承）。
 * 接続URL（パスワードを含む）を psql の引数に入れると、照会が失敗したときのエラーの文（"Command failed: psql <URL> …"）や
 * プロセスの一覧に出て、エビデンスやログに残った。接続先は引数でなく環境変数（PGHOST・PGPORT・PGUSER・PGPASSWORD・PGDATABASE）で渡す。
 * 念のため、エラーの文に接続URL・パスワードが残っていれば伏せる。
 */
import { DB_URL } from "../config/env";

/** 接続URLを psql の環境変数に分けたもの（URL が無ければ空） */
export function pgEnvFromUrl(url: string = DB_URL): Record<string, string> {
  if (!url) return {};
  const u = new URL(url);
  const env: Record<string, string> = {};
  if (u.hostname) env.PGHOST = decodeURIComponent(u.hostname);
  if (u.port) env.PGPORT = u.port;
  if (u.username) env.PGUSER = decodeURIComponent(u.username);
  if (u.password) env.PGPASSWORD = decodeURIComponent(u.password);
  const db = u.pathname.replace(/^\//, "");
  if (db) env.PGDATABASE = decodeURIComponent(db);
  for (const [k, v] of u.searchParams) if (k === "sslmode") env.PGSSLMODE = v;
  return env;
}

/** エラーの文から接続URL・パスワードを伏せる */
export function maskSecrets(text: string, url: string = DB_URL): string {
  let t = text;
  if (url) {
    t = t.split(url).join("（接続先）");
    try {
      const pw = decodeURIComponent(new URL(url).password);
      if (pw) t = t.split(pw).join("****").split(encodeURIComponent(pw)).join("****");
    } catch { /* URL として読めなければ URL の置き換えだけ */ }
  }
  return t.replace(/postgres(?:ql)?:\/\/[^\s'"]+/g, "（接続先）");
}

/** psql の呼び出しで投げられたエラーを、秘密を伏せたエラーに置き換える */
export function rethrowMasked(e: unknown): never {
  const err = e as { message?: string; stderr?: string | Buffer };
  const stderr = err?.stderr ? String(err.stderr) : "";
  const msg = maskSecrets(`${err?.message ?? String(e)}${stderr && !String(err?.message ?? "").includes(stderr) ? `\n${stderr}` : ""}`);
  throw new Error(msg);
}
