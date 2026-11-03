/** F06-01 会員登録のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** メールアドレスの会員の状態（会員が無ければ null） */
export type 会員 = { id: string; 状態: string; 性別: string | null; 会社名: string | null; 郵便番号: string | null; 海外郵便番号: string | null; 住所1: string | null; 住所2: string | null; 住所3: string | null; 姓: string; 名: string; セイ: string | null; メイ: string | null; 職業: string | null };

export function 会員(メール: string): 会員[] {
  return query(
    `select c.id, s.name as status, x.name as sex, c.company_name, c.postal_code, c.abroad_postal_code, c.addr01, c.addr02, c.addr03,
            c.name01, c.name02, c.kana01, c.kana02, j.name as job
       from dtb_customer c left join mtb_customer_status s on s.id = c.customer_status_id
       left join mtb_sex x on x.id = c.sex_id left join mtb_job j on j.id = c.job_id
      where c.email = $1 and c.del_flg = 0 order by c.id`, [メール]).map((r) => ({
    id: r.id!, 状態: r.status ?? "", 性別: r.sex, 会社名: r.company_name, 郵便番号: r.postal_code, 海外郵便番号: r.abroad_postal_code,
    住所1: r.addr01, 住所2: r.addr02, 住所3: r.addr03, 姓: r.name01 ?? "", 名: r.name02 ?? "", セイ: r.kana01, メイ: r.kana02, 職業: r.job,
  }));
}

export type 住所 = { id: string; 既定: boolean; 住所名: string | null; 郵便番号: string | null; 海外郵便番号: string | null; 住所1: string | null; 住所2: string | null; 住所3: string | null };
/** 会員IDの、お届け先の住所（削除されていないもの） */
export function 会員の住所(会員ID: string): 住所[] {
  return query(
    `select id, default_flg, address_name, postal_code, abroad_postal_code, addr01, addr02, addr03 from dtb_customer_address
      where customer_id = $1 and del_flg = 0 order by id`, [会員ID]).map((r) => ({
    id: r.id!, 既定: r.default_flg === "true", 住所名: r.address_name, 郵便番号: r.postal_code, 海外郵便番号: r.abroad_postal_code,
    住所1: r.addr01, 住所2: r.addr02, 住所3: r.addr03,
  }));
}

export type 選手 = { id: string; 姓: string | null; 名: string | null; MTG姓: string | null; MTG名: string | null; メール: string | null; デッキ登録用ユーザーID: string | null };
export function 会員の選手(会員ID: string): 選手[] {
  return query(
    `select id, last_name_jp, first_name_jp, last_name_en, first_name_en, email, deck_user_id from dtb_player
      where customer_id = $1 and deleted_at is null order by id`, [会員ID]).map((r) => ({
    id: r.id!, 姓: r.last_name_jp, 名: r.first_name_jp, MTG姓: r.last_name_en, MTG名: r.first_name_en, メール: r.email, デッキ登録用ユーザーID: r.deck_user_id,
  }));
}

/** メールアドレスで数えた、会員・会員住所・選手の件数（会員が無い開始時の確認） */
export function 関連データの件数(メール: string): { 会員: number; 住所: number; 選手: number } {
  const r = query(
    `select (select count(*) from dtb_customer where email = $1) as c,
            (select count(*) from dtb_customer_address a join dtb_customer c on c.id = a.customer_id where c.email = $1) as a,
            (select count(*) from dtb_player p where p.email = $1) as p`, [メール])[0];
  return { 会員: Number(r.c), 住所: Number(r.a), 選手: Number(r.p) };
}

/** 本店（店舗ID 1）の仮会員機能の設定 */
export function 仮会員機能が有効か(): boolean {
  return query(`select option_customer_activate as v from dtb_base_info where id = 1`)[0]?.v === "true";
}
