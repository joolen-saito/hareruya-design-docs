/** F06-20 配送先のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { execFileSync } from "node:child_process";
import { APP_CONTAINER, ENV_NAME, SHARED_ENV } from "../config/env";
import { query } from "../lib/db";

export type 配送先の記録 = { 配送先ID: string; 会員ID: string; 配送先名称: string | null; 削除済み: boolean; 既定: boolean; 姓: string | null; 名: string | null };

/** 配送先IDの記録（物理削除されていれば null） */
export function 配送先の記録(配送先ID: string): 配送先の記録 | null {
  const r = query(`select id, customer_id, address_name, del_flg, default_flg, name01, name02 from dtb_customer_address where id = $1`, [配送先ID])[0];
  if (!r) return null;
  return { 配送先ID: r.id!, 会員ID: r.customer_id!, 配送先名称: r.address_name, 削除済み: r.del_flg !== "0", 既定: r.default_flg === "true", 姓: r.name01, 名: r.name02 };
}

/** 会員の、削除済みではない配送先の件数（会員情報住所の既定の行を含む／含まない） */
export function 配送先の件数(会員ID: string): { 全体: number; 既定を除く: number } {
  const r = query(
    `select count(*) as n, count(*) filter (where not default_flg) as m from dtb_customer_address where customer_id = $1 and del_flg = 0`, [会員ID])[0];
  return { 全体: Number(r?.n ?? 0), 既定を除く: Number(r?.m ?? 0) };
}

/** 配送先IDの記録の件数（全会員で未登録か） */
export function 配送先IDの件数(配送先ID: string): number {
  return Number(query(`select count(*) as n from dtb_customer_address where id = $1`, [配送先ID])[0]?.n ?? 0);
}

/** ブラックリストのうち、氏名・電話番号・住所のどれかが完全一致する行の件数（氏名と住所と電話は空白を除いた連結） */
export function 一致するブラックリスト(氏名: string, 電話: string, 住所: string): number {
  return Number(query(
    `select count(*) as n from dtb_blacklist where keyword in ($1, $2, $3)`, [氏名, 電話, 住所])[0]?.n ?? 0);
}

/** 国・都道府県の参照値（都道府県ID 48「日本国外」があるか） */
export function 日本国外の都道府県がある(): boolean {
  return Number(query(`select count(*) as n from mtb_pref where id = 48`)[0]?.n ?? 0) === 1;
}

/** 配送先登録上限（アプリの設定値。手元の環境でだけ読める） */
export function 配送先登録上限(): number {
  if (ENV_NAME !== "local" || SHARED_ENV) throw new Error(`E2E_ENV=${ENV_NAME} ではアプリの設定値を読めない`);
  const out = execFileSync("docker", ["exec", APP_CONTAINER, "php", "bin/console", "debug:container", "--parameter=eccube_deliv_addr_max", "--format=json"],
    { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
  return Number((JSON.parse(out) as Record<string, unknown>).eccube_deliv_addr_max);
}
