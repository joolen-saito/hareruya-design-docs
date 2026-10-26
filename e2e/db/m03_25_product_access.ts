/**
 * M03-25 重複商品コード確認のシード「商品関連データ参照権限」の確かめ（参照だけ）。物理名はこのファイルの中にだけ書く。
 * 権限を変える（許可・一時停止の切り替え）ことはしない。いまの状態を読むだけ。
 */
import { execFileSync } from "node:child_process";
import { APP_CONTAINER, ENV_NAME, SHARED_ENV } from "../config/env";
import { query } from "../lib/db";

/** アプリがデータベースへ接続する利用者の名前（手元の環境だけ。アプリのコンテナの接続先の設定から、利用者名の部分だけを読む） */
export function アプリの接続利用者(): string {
  if (ENV_NAME !== "local" || SHARED_ENV) throw new Error(`E2E_ENV=${ENV_NAME} ではアプリの接続利用者を読めない`);
  const url = execFileSync("docker", ["exec", APP_CONTAINER, "printenv", "DATABASE_URL"], { encoding: "utf-8" }).trim();
  const user = decodeURIComponent(new URL(url).username);
  if (!user) throw new Error("アプリの接続先の設定から利用者名を読めない");
  return user;
}

/** 重複商品コード確認が読む表（商品・商品規格）に対する、利用者の参照権限 */
export function 商品関連の参照権限(利用者: string): { 商品: boolean; 商品規格: boolean } {
  const r = query(`select has_table_privilege($1, 'public.dtb_product', 'SELECT') as "商品",
    has_table_privilege($1, 'public.dtb_product_class', 'SELECT') as "商品規格"`, [利用者])[0];
  return { 商品: r.商品 === "true", 商品規格: r.商品規格 === "true" };
}

/** 商品サブ情報に当たる表がこのアプリのデータベースにあるか（現行の表の名前で探す） */
export function 商品サブ情報の表がある(): boolean {
  return query(`select count(*) as n from pg_tables where schemaname = 'public' and tablename = 'dtb_product_sub_info'`)[0].n !== "0";
}
