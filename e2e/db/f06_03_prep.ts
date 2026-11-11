/**
 * F06-03 ログインのシードの、画面で作れない部分を DB で整える書き込み（依頼者の承認 2026-11-10「印つきデータは何でも」）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き込みは db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） を通す（1文・印の確かめ・行数の上限・ログ）。
 * 書く先は、E2E が画面で作った「実行の印つき」の会員（メールアドレスに実行の印が入っている）だけ。
 *
 * 保存パスワードの作り方: アプリは「パスワード:認証用の鍵」を会員ごとの塩で署名した値（SHA256）を保存して照合する。
 * 認証用の鍵はアプリの環境変数の値で、手元の環境（local）ではアプリのコンテナから読む。ほかの環境では E2E_AUTH_MAGIC で与える（ファイルには書かない）。
 */
import { execFileSync } from "node:child_process";
import { createHmac } from "node:crypto";
import { APP_CONTAINER, ENV_NAME, SHARED_ENV } from "../config/env";
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";

function 認証用の鍵(): string {
  const given = process.env.E2E_AUTH_MAGIC;
  if (given) return given;
  if (ENV_NAME === "local" && !SHARED_ENV) {
    const v = execFileSync("docker", ["exec", APP_CONTAINER, "printenv", "ECCUBE_AUTH_MAGIC"], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (v) return v;
  }
  throw new Error(`E2E_ENV=${ENV_NAME} では保存パスワードを作るための認証用の鍵を読めない。環境の担当者に E2E_AUTH_MAGIC で与えてもらう`);
}

function 確かめ(メール: string) {
  return {
    対象の確かめ: "select id, email from dtb_customer where email = $1 and email like $2",
    確かめのparams: [メール, `%${RUN_MARK}%`],
    印: RUN_MARK,
  };
}

/** 画面の入力規則（12文字以上・50文字以下・半角・メールアドレスと同じは不可）に合わないパスワードを、保存パスワードとして直接設定する */
export function パスワードを設定する(メール: string, パスワード: string): void {
  const rows = query("select salt from dtb_customer where email = $1 and email like $2", [メール, `%${RUN_MARK}%`]);
  if (rows.length !== 1 || !rows[0].salt) throw new Error(`会員 ${メール} の塩を読めない（${rows.length}行）`);
  const 保存値 = createHmac("sha256", rows[0].salt).update(`${パスワード}:${認証用の鍵()}`).digest("hex");
  const n = writeTestData({
    理由: `会員 ${メール} の保存パスワードを、画面で指定できない値（入力規則に合わないもの）の保存値に設定する`,
    sql: "update dtb_customer set password = $2 where email = $1",
    params: [メール, 保存値], ...確かめ(メール), 最大行数: 1,
  });
  if (n !== 1) throw new Error(`パスワードの設定: 書き換えた行が ${n} 行（1行のはず）`);
}
