/** F04-02 の続き（-f）の DB 確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 受注の支払方法のIDと手数料（支払方法が未設定なら ID は空） */
export function 受注の支払方法IDと手数料(受注ID: string): { 支払方法ID: string; 手数料: string } {
  const r = query(`select coalesce(payment_id::text,'') as p, charge as c from dtb_order where id = $1`, [受注ID])[0];
  return { 支払方法ID: r?.p ?? "（受注が無い）", 手数料: r?.c ?? "" };
}

/** 支払方法IDが登録されているか */
export function 支払方法IDがあるか(支払方法ID: string): boolean {
  return Number(query(`select count(*) as n from dtb_payment where id = $1`, [支払方法ID])[0]?.n ?? "0") > 0;
}
