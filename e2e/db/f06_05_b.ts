/**
 * F06-05 マイページの続き（-b）の DB 確認と、E2E が作った会員のプレイヤーの行への書き足し。物理名はこのファイルの SQL の中にだけ書く。
 * - 照会は参照だけ（lib/db.ts）。
 * - 書き足すのは、フロントの会員登録で作った E2E の会員（メールアドレスの前半に実行の印）のプレイヤーの保有ポイントだけ
 *   （依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」。lib/db_write.ts の窓口を通す）。
 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

/** 持ち主の確かめ: メールアドレスの前半の末尾に実行の印がある会員のプレイヤー */
const 自分のプレイヤー = {
  sql: `select p.id from dtb_player p join dtb_customer c on c.id = p.customer_id where c.email like '%-' || $1 || '@example.test'`,
  params: [RUN_MARK],
};

export type プレイヤー = { プレイヤーID: string; スマレジID: string | null; 保有ポイント: number };

/** 会員のプレイヤー（プレイヤーID・スマレジ側の会員番号・保有ポイント）。無ければ null */
export function 会員のプレイヤー(会員ID: string): プレイヤー | null {
  const r = query(`select p.id, p.smaregi_id, p.point::text as point from dtb_player p where p.customer_id = $1::int order by p.id`, [会員ID]);
  if (r.length !== 1) return null;
  return { プレイヤーID: String(r[0].id), スマレジID: r[0].smaregi_id ?? null, 保有ポイント: Number(r[0].point ?? 0) };
}

export type ポイント履歴 = { ID: string; 増減量: number; 発行日: string };

/** 会員のポイント履歴（IDの順） */
export function 会員のポイント履歴(会員ID: string): ポイント履歴[] {
  return query(
    `select ph.id, ph.point_change::text as v, to_char(ph.issue_date, 'YYYY-MM-DD') as d from dtb_point_history ph where ph.customer_id = $1::int order by ph.id`, [会員ID],
  ).map((r) => ({ ID: String(r.id), 増減量: Number(r.v ?? 0), 発行日: r.d ?? "" }));
}

/** E2E の会員のプレイヤーの保有ポイントを書く（画面で指定できない値） */
export function 保有ポイントを書く(what: string, プレイヤーID: string, 値: number): void {
  updateOwnRows(what, { table: "dtb_player", key: "id", ids: [プレイヤーID], set: { point: 値 }, owner: 自分のプレイヤー });
}
