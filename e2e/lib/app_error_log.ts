/**
 * アプリケーションのエラーログ（読み取りだけ）。試験の開始時点のログの末尾位置を控え、そのあとに新しく書かれたエラー（ERROR 以上）の行を読む。
 * 手元の環境（local）でだけ、アプリのコンテナの中のログファイルを読む。ほかの環境では読む手段が無いので落とす。
 */
import { execFileSync } from "node:child_process";
import { APP_CONTAINER, ENV_NAME, SHARED_ENV } from "../config/env";

export type ログの位置 = { ファイル: string; バイト: number };

const sh = (script: string): string => execFileSync("docker", ["exec", APP_CONTAINER, "sh", "-c", script], { encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 });
const 最新のログ = "ls -t /var/ec-cube/var/log/*/site-*.log | head -1";

function 読める(): void {
  if (ENV_NAME !== "local" || SHARED_ENV) throw new Error(`E2E_ENV=${ENV_NAME} ではアプリのエラーログを読めない`);
}

/** いまのアプリケーションログ（最新の日付のファイル）の末尾位置 */
export function エラーログの末尾位置(): ログの位置 {
  読める();
  const [ファイル, バイト] = sh(`f=$(${最新のログ}); echo "$f $(stat -c %s "$f")"`).trim().split(" ");
  return { ファイル, バイト: Number(バイト) };
}

/** 控えた位置より後に書かれた、エラー（ERROR・CRITICAL・ALERT・EMERGENCY）の行。日付が変わって別のファイルになっていれば、そのファイルの先頭から */
export function 位置以降のエラーログ(位置: ログの位置): string[] {
  読める();
  const 今 = sh(最新のログ).trim();
  const 開始 = 今 === 位置.ファイル ? 位置.バイト + 1 : 1;
  const out = sh(`tail -c +${開始} "${今}" | grep -E '\\.(ERROR|CRITICAL|ALERT|EMERGENCY) ' | cut -c1-400 || true`);
  return out.split("\n").filter(Boolean);
}
