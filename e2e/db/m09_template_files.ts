/**
 * テンプレート保管領域（アプリのコンテナの中のテンプレートのファイル）の参照。読むだけ。
 * 手元の環境（local）でだけ使える（アプリのコンテナで読む）。
 */
import { execFileSync } from "node:child_process";
import { APP_CONTAINER, ENV_NAME, SHARED_ENV } from "../config/env";

const テンプレートの場所 = "/var/ec-cube/app/template";

function 読む(path: string): string | null {
  if (ENV_NAME !== "local" || SHARED_ENV) throw new Error(`E2E_ENV=${ENV_NAME} ではテンプレート保管領域を読めない`);
  if (!/^[0-9A-Za-z_\-./]+$/.test(path) || path.includes("..")) throw new Error(`ファイルの場所が不正: ${path}`);
  try {
    return execFileSync("docker", ["exec", APP_CONTAINER, "sh", "-c", `[ -f '${テンプレートの場所}/${path}' ] && cat '${テンプレートの場所}/${path}'`], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null; // 無い
  }
}

/** ページのテンプレート（ファイル名は画面のファイル名欄の値。画面は「app/template/user_data/」の下に置くと示す）。言語は ja / en。無ければ null */
export function ページのテンプレート(ファイル名: string, 言語: "ja" | "en"): string | null {
  return 読む(`user_data/${ファイル名}.${言語}.twig`);
}
/** ブロックのテンプレート */
export function ブロックのテンプレート(ファイル名: string, 言語: "ja" | "en"): string | null {
  return 読む(`default/Block/${ファイル名}.${言語}.twig`);
}
