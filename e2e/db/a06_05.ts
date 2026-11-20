/**
 * A06-05 店頭買取受注ステータス更新（MTGBuyer の API）のシード・確かめのための DB の参照と書き込み。物理名はこのファイルの SQL の中にだけ書く。
 *
 * 読むのは lib/db.ts の query（参照だけ）。書くのは、画面で指定できない値（査定担当者・買取成立のステータス・金額）だけで、
 * E2E が画面（フロントの店頭買取査定申込）で作った、申込者の姓に実行の印を付けた受注の行にだけ、db/write_adapter.ts の writeTestData
 * （lib/db_write.ts の窓口を通す）で書く（依頼者決定 2026-11-10「E2E が作った行だけ DB に書いてよい」）。行は消さない。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";

export type 受注の今 = { ステータスID: string; 査定担当者ID: string | null; 更新日時: string; 金額: string | null };
export type 履歴の行 = { 番号: string; 管理者ID: string | null; ステータスID: string; 登録日時: string };

/** 店頭買取の受注のステータス・査定担当者・更新日時・金額（無ければ null） */
export function 受注の今(受注ID: string): 受注の今 | null {
  const r = query(`select otc_buy_order_status_id::text as s, member_id::text as m, to_char(update_date, 'YYYY-MM-DD HH24:MI:SS.US') as u, total_price::text as p
                   from dtb_otc_buy_order where id = $1::int`, [受注ID])[0];
  return r ? { ステータスID: String(r.s ?? ""), 査定担当者ID: r.m ?? null, 更新日時: String(r.u ?? ""), 金額: r.p ?? null } : null;
}

/** 店頭買取の受注のステータス変更履歴（登録の古い順） */
export function 履歴(受注ID: string): 履歴の行[] {
  return query(`select id::text as i, member_id::text as m, otc_buy_order_status_id::text as s, to_char(create_date, 'YYYY-MM-DD HH24:MI:SS.US') as c
                from dtb_otc_buy_order_status_history where otc_buy_order_id = $1::int order by create_date, id`, [受注ID])
    .map((r) => ({ 番号: String(r.i), 管理者ID: r.m ?? null, ステータスID: String(r.s ?? ""), 登録日時: String(r.c ?? "") }));
}

/** 店頭買取ステータスのIDの行があるか（共有のマスタは書き換えない。数えるだけ） */
export function 店頭買取ステータスがある(ID: string): boolean {
  return Number(query("select count(*) as n from mtb_otc_buy_order_status where id = $1::int", [ID])[0]?.n ?? 0) > 0;
}

/**
 * 印つきの姓の店頭買取の受注に、画面で指定できない値（査定担当者・ステータス・金額）を書く。undefined の値は書かない。
 * ステータスは「買取成立」（ステータス変更画面で選ぶと、続けて未登録在庫ありか入庫待ちへ進むため、シード表が DB で設定すると定めている）だけに使う
 */
export function 受注に書く(受注ID: string, 印つきの姓: string, v: { 査定担当者ID?: string; ステータスID?: string; 金額?: number }): void {
  const 値: [string, string][] = [];
  if (v.査定担当者ID !== undefined) 値.push(["member_id", v.査定担当者ID]);
  if (v.ステータスID !== undefined) 値.push(["otc_buy_order_status_id", v.ステータスID]);
  if (v.金額 !== undefined) 値.push(["total_price", String(v.金額)]);
  if (!値.length) return;
  if (![受注ID, ...値.map(([, x]) => x)].every((x) => /^\d+$/.test(x))) throw new Error(`番号・金額が数字でない（受注 ${受注ID}・${値.map(([k, x]) => `${k}=${x}`).join("・")}）`);
  const set = 値.map(([k], i) => `${k} = $${i + 2}::int`).join(", ");
  const n = writeTestData({
    理由: `E2E の店頭買取の受注 ${受注ID} に、画面で指定できない値（${値.map(([k, x]) => `${k}=${x}`).join("・")}）を書く`,
    sql: `update dtb_otc_buy_order set ${set} where id = $1::int`,
    params: [受注ID, ...値.map(([, x]) => x)],
    対象の確かめ: "select o.id, o.last_name from dtb_otc_buy_order o where o.id = $1::int", 確かめのparams: [受注ID],
    印: 印つきの姓, 最大行数: 1,
  });
  if (n !== 1) throw new Error(`受注 ${受注ID} への書き込みが ${n} 行（1行のはず）`);
}
