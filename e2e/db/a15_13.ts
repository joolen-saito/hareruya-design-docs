/**
 * A15-13 デッキ情報検索（デッキビルダーの API）の DB の参照。参照だけ（lib/db.ts は読み取り専用）。
 * 物理名はこのファイルの SQL の中にだけ書き、呼び出す側には業務の言葉の関数名で見せる。
 */
import { query } from "../lib/db";

/** フォーマットIDのフォーマットの登録件数（削除済みも数える） */
export function フォーマットの登録件数(フォーマットID: string): number {
  return Number(query(`select count(*)::text as n from mtb_format where id = $1::int`, [フォーマットID])[0]?.n ?? "0");
}

import { Owner, updateOwnRows } from "../lib/db_write";

const 選手の持ち主 = (選手ID: string, メール: string): Owner => ({
  sql: `select p.id from dtb_player p join dtb_customer c on c.id = p.customer_id where p.id = $1::int and c.email = $2 and c.email like '%@example.test'`,
  params: [選手ID, メール],
});

/** E2E の試験会員の選手のデッキ利用者ID（8文字まで）を書く（画面で指定できない項目） */
export function デッキ利用者IDを設定する(what: string, 選手ID: string, メール: string, 利用者ID: string): void {
  updateOwnRows(what, { table: "dtb_player", key: "id", ids: [選手ID], set: { deck_user_id: 利用者ID }, owner: 選手の持ち主(選手ID, メール) });
}

/** E2E の試験会員が所有するデッキのレギュレーション違反の印を書く（画面で指定できない項目） */
export function レギュレーション違反にする(what: string, デッキID: string, メール: string): void {
  updateOwnRows(what, {
    table: "dtb_deck", key: "id", ids: [デッキID], set: { regulation_violation_flg: true },
    owner: { sql: `select d.id from dtb_deck d join dtb_player p on p.id = d.player_id join dtb_customer c on c.id = p.customer_id where d.id = $1::int and c.email = $2 and c.email like '%@example.test'`, params: [デッキID, メール] },
  });
}

/** 選手のデッキ利用者ID・ニックネーム */
export function 選手の識別(選手ID: string): { デッキ利用者ID: string; ニックネーム: string } {
  const r = query(`select coalesce(deck_user_id, '') as d, coalesce(nickname, '') as n from dtb_player where id = $1::int`, [選手ID])[0];
  return { デッキ利用者ID: String(r?.d ?? ""), ニックネーム: String(r?.n ?? "") };
}

/** デッキ番号の一覧の、デッキ名・件数などの控え（検索の前後で変わらないことの確かめ用）。デッキごとに「列の値を連結した文字」 */
export function デッキの控え(デッキIDs: string[]): string[] {
  return query(
    `select d.id::text || '|' || coalesce(d.deck_name,'') || '|' || coalesce(d.format_id::text,'') || '|' || coalesce(d.archetype_id::text,'') || '|' || coalesce(d.disp_id::text,'') || '|'
       || d.private_flg::text || '|' || d.regulation_violation_flg::text || '|' || d.create_date::text || '|' || d.update_date::text || '|' || coalesce(d.ranking::text,'') || '|' || coalesce(d.participants::text,'')
       || '|' || coalesce(d.display_token,'') || '|' || coalesce(d.deleted_at::text,'') || '|' || (select count(*) from dtb_deck_card c where c.deck_id = d.id)::text as v
       from dtb_deck d where d.id = any(string_to_array($1, ',')::int[]) order by d.id`, [デッキIDs.join(",")]).map((r) => String(r.v));
}
