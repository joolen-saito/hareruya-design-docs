/**
 * A15-01 ログイン（デッキビルダーの API）の DB の参照と、E2E が作った会員への書き足し
 * （依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」）。物理名はこのファイルの SQL の中にだけ書く。
 * 書き足しは lib/db_write.ts を通し、持ち主（実行の印つきの試験会員のメールアドレス）を確かめてから書く。
 */
import { query } from "../lib/db";
import { Owner, updateOwnRows } from "../lib/db_write";

/** 会員の行が、メールアドレス（@example.test の試験会員）の会員のものか */
const 会員の持ち主 = (会員ID: string, メール: string): Owner => ({
  sql: `select c.id from dtb_customer c where c.id = $1::int and c.email = $2 and c.email like '%@example.test'`,
  params: [会員ID, メール],
});

export type A1501会員 = { 会員ID: string; 選手ID: string; デッキユーザーID: string };

/** メールアドレスの会員（削除されていないもの）と、その削除されていない選手（無ければ空）。会員が無ければ null */
export function 会員を読む(メール: string): A1501会員 | null {
  const r = query(
    `select c.id::text as cid, coalesce(p.id::text, '') as pid, coalesce(p.deck_user_id, '') as duid
       from dtb_customer c left join dtb_player p on p.customer_id = c.id and p.deleted_at is null
      where c.email = $1 and c.del_flg = 0 order by c.id, p.id`,
    [メール]);
  if (r.length === 0) return null;
  if (r.length > 1) throw new Error(`会員 ${メール} の行（会員・選手）が ${r.length} 件（1件のはず）`);
  return { 会員ID: String(r[0].cid), 選手ID: String(r[0].pid), デッキユーザーID: String(r[0].duid) };
}

/** メールアドレスの会員が何件あるか（削除済みも数える） */
export function メールの会員の数(メール: string): number {
  return Number(query(`select count(*)::text as n from dtb_customer where email = $1`, [メール])[0]?.n ?? "0");
}

/** 会員の状態（会員の区分の番号・削除の印） */
export function 会員の状態(会員ID: string): { 区分: string; 削除: string } | null {
  const r = query(`select customer_status_id::text as s, del_flg::text as d from dtb_customer where id = $1::int`, [会員ID]);
  return r.length ? { 区分: String(r[0].s), 削除: String(r[0].d) } : null;
}

/** E2E の試験会員を仮会員（本会員ではない）にする。画面では本会員として登録されるため（シード表の「本会員ではない」の作り） */
export function 仮会員にする(what: string, 会員ID: string, メール: string): void {
  updateOwnRows(what, { table: "dtb_customer", key: "id", ids: [会員ID], set: { customer_status_id: 1 }, owner: 会員の持ち主(会員ID, メール) });
}

/** E2E の試験会員を削除済みにする（シード表の「削除済み」の作り） */
export function 削除済みにする(what: string, 会員ID: string, メール: string): void {
  updateOwnRows(what, { table: "dtb_customer", key: "id", ids: [会員ID], set: { del_flg: 1 }, owner: 会員の持ち主(会員ID, メール) });
}

/** 会員IDの、削除されていない選手の件数（A15-02 の「対応するプレイヤーは未登録」を確かめる） */
export function 会員IDの選手の数(会員ID: string): number {
  return Number(query(`select count(*)::text as n from dtb_player where customer_id = $1::int and deleted_at is null`, [会員ID])[0]?.n ?? "0");
}

/** E2E の試験会員の選手を削除済みにする（A15-05 の「対応するプレイヤー=0件」の作り。行は消さない） */
export function 選手を削除済みにする(what: string, 選手ID: string, メール: string): void {
  updateOwnRows(what, {
    table: "dtb_player", key: "id", ids: [選手ID], set: { deleted_at: new Date().toISOString() },
    owner: { sql: `select p.id from dtb_player p join dtb_customer c on c.id = p.customer_id where p.id = $1::int and c.email = $2 and c.email like '%@example.test'`, params: [選手ID, メール] },
  });
}
