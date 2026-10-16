/**
 * 管理画面に項目が無いアプリの設定値を読む（読み取りだけ）。
 * シード表が「試験環境構築時に、アプリケーション設定の値が既定のままであることを確認する」と定めた設定に使う。
 * 手元の環境（local）でだけ、アプリのコンテナで設定値の一覧を表示するコマンドを流して読む。ほかの環境では読む手段が無いので落とす。
 */
import { execFileSync } from "node:child_process";
import { APP_CONTAINER, ENV_NAME, SHARED_ENV } from "../config/env";

/** カテゴリ階層上限（カテゴリを何階層まで作れるか） */
export function カテゴリ階層上限(): number {
  return Number(appParameter("eccube_category_nest_level"));
}

/** 設定値の名前は、このファイルの中にだけ書く（物理名をシード・ケースのコードに出さない） */
function appParameter(name: string): unknown {
  if (ENV_NAME !== "local" || SHARED_ENV) {
    throw new Error(`E2E_ENV=${ENV_NAME} ではアプリの設定値（${name}）を読めない。環境の担当者に値を確かめてもらう`);
  }
  if (!/^[a-z0-9_.]+$/.test(name)) throw new Error(`設定値の名前が不正: ${name}`);
  const out = execFileSync("docker", ["exec", APP_CONTAINER, "php", "bin/console", "debug:container", `--parameter=${name}`, "--format=json"],
    { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
  const json = JSON.parse(out) as Record<string, unknown>;
  if (!(name in json)) throw new Error(`アプリの設定値 ${name} が無い`);
  return json[name];
}
