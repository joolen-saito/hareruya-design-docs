/**
 * F06-18 会員情報変更の DB 確認・書き足し。物理名はこのファイルの SQL の中にだけ書く。
 * 書き足しは lib/db_write.ts を通す（E2E が作った行だけ。依頼者決定 2026-11-10）。持ち主の確かめは、実行の印つきのメールアドレス。
 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";

/** 選手情報の内容（連絡先アドレス・英字姓名・和文姓名・更新日時・本人確認ステータス・スマレジ会員番号） */
export function 選手情報(会員ID: string): {
  ID: string; 連絡先: string; 英字姓: string; 英字名: string; 和文姓: string; 和文名: string; 更新日時: string; 本人確認ステータス: string; スマレジ会員番号: string;
} | undefined {
  const r = query(
    `select p.id, p.email, p.last_name_en, p.first_name_en, p.last_name_jp, p.first_name_jp,
            to_char(p.update_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI:SS') as upd, ics.name_jp as ics, p.smaregi_id
       from dtb_player p left join mtb_identity_confirm_status ics on ics.id = p.identity_confirm_status_id
      where p.customer_id = $1::int and p.deleted_at is null order by p.id limit 1`, [会員ID])[0];
  if (!r) return undefined;
  const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  return {
    ID: s(r.id), 連絡先: s(r.email), 英字姓: s(r.last_name_en), 英字名: s(r.first_name_en), 和文姓: s(r.last_name_jp), 和文名: s(r.first_name_jp),
    更新日時: s(r.upd), 本人確認ステータス: s(r.ics), スマレジ会員番号: s(r.smaregi_id),
  };
}

/** 既定配送先の番号（画面の配送先一覧で既定のものと同じ。無ければ空） */
export function 既定配送先ID(会員ID: string): string {
  return String(query(`select id from dtb_customer_address where customer_id = $1::int and default_flg = true order by id limit 1`, [会員ID])[0]?.id ?? "");
}

/** 会員・選手情報・既定配送先の行全体を文字列にしたもの（更新されないことの確かめ用） */
export function 行の写し(会員ID: string): { 会員: string; 選手情報: string; 既定配送先: string } {
  const one = (sql: string) => String(query(sql, [会員ID])[0]?.v ?? "");
  return {
    会員: one(`select row_to_json(c)::text as v from dtb_customer c where c.id = $1::int`),
    選手情報: one(`select row_to_json(p)::text as v from dtb_player p where p.customer_id = $1::int and p.deleted_at is null order by p.id limit 1`),
    既定配送先: one(`select row_to_json(a)::text as v from dtb_customer_address a where a.customer_id = $1::int and a.default_flg = true order by a.id limit 1`),
  };
}

/** 職業の名前（マスタの並び順） */
export function 職業の名前(): string[] {
  return query(`select name from mtb_job order by sort_no, id`).map((r) => String(r.name));
}

const 選手情報の持ち主 = (メール: string) => ({
  sql: `select p.id from dtb_player p join dtb_customer c on c.id = p.customer_id where c.email = $1`, params: [メール],
});

/** 選手情報（実行の印つきのメールアドレスの会員のもの）の列を書き換える。シードの「画面で指定できないため DB へ直接設定する」 */
function 選手情報を書き換える(what: string, 会員ID: string, メール: string, set: Record<string, string | null>): void {
  const p = 選手情報(会員ID);
  if (!p) throw new Error(`${what}: 会員ID ${会員ID} の選手情報が無い`);
  updateOwnRows(what, { table: "dtb_player", key: "id", ids: [p.ID], set, owner: 選手情報の持ち主(メール) });
}

/** スマレジ会員番号を空にする（本会員登録のときに自動で設定される） */
export function スマレジ会員番号を空にする(what: string, 会員ID: string, メール: string): void {
  選手情報を書き換える(what, 会員ID, メール, { smaregi_id: null });
}

/** 選手情報の更新日時を決める（例: 2026-09-01 00:00:00+09:00） */
export function 選手情報の更新日時を決める(what: string, 会員ID: string, メール: string, 日時: string): void {
  選手情報を書き換える(what, 会員ID, メール, { update_date: 日時 });
}
