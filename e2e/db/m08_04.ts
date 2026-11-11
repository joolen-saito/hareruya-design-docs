/** M08-04 会員登録/編集のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。 */
import { query, Row } from "../lib/db";

/** 会員の保存内容（会員・本人確認情報・都道府県などの名称をまとめて）。会員がいなければ undefined */
export function 会員の保存内容(会員ID: string): Row | undefined {
  return query(
    `select c.id as 会員ID, c.name01 as お名前姓, c.name02 as お名前名, c.kana01 as フリガナ姓, c.kana02 as フリガナ名,
            c.company_name as 会社名, c.postal_code as 郵便番号, c.abroad_postal_code as 海外用郵便番号,
            pref.name as 都道府県, ctry.name as 国, c.addr01 as 住所1, c.addr02 as 住所2, c.addr03 as 住所3,
            c.email as メールアドレス, c.tel01 as 電話1, c.tel02 as 電話2, c.tel03 as 電話3,
            c.fax01 as "FAX1", c.fax02 as "FAX2", c.fax03 as "FAX3",
            sx.name as 性別, jb.name as 職業, to_char(c.birth, 'YYYY-MM-DD') as 生年月日,
            st.name as 会員ステータス, c.close_reason as 退会区分, c.del_flg as 削除フラグ, c.password as パスワード,
            cg.name as 顧客グループ, p.first_name_en as "MTG名", p.last_name_en as "MTG姓", p.smaregi_id as "スマレジID",
            p.mail_magazine_flg as メルマガ配信, ics.name_jp as 本人確認ステータス,
            to_char(p.id_expiration_date, 'YYYY-MM-DD') as 身分証有効期限, p.id as 本人確認情報ID
       from dtb_customer c
       left join dtb_player p on p.customer_id = c.id
       left join mtb_identity_confirm_status ics on ics.id = p.identity_confirm_status_id
       left join dtb_customer_group cg on cg.id = p.customer_group_id
       left join mtb_pref pref on pref.id = c.pref_id
       left join mtb_country ctry on ctry.id = c.country_id
       left join mtb_sex sx on sx.id = c.sex_id
       left join mtb_job jb on jb.id = c.job_id
       left join mtb_customer_status st on st.id = c.customer_status_id
      where c.id = $1::int`, [会員ID])[0];
}

export function 本人確認情報ID(会員ID: string): string | null {
  return query(`select id as v from dtb_player where customer_id = $1::int`, [会員ID])[0]?.v ?? null;
}

/** 会員住所のうち、削除されていないものの件数 */
export function 会員住所の件数(会員ID: string): number {
  return Number(query(`select count(*) as n from dtb_customer_address where customer_id = $1::int and del_flg = 0`, [会員ID])[0].n);
}

/** 会員住所ID（削除されていないものの先頭。画面に表示されないので、DBの参照で控える） */
export function 会員住所ID(会員ID: string): string | null {
  return query(`select min(id) as v from dtb_customer_address where customer_id = $1::int and del_flg = 0`, [会員ID])[0]?.v ?? null;
}

/** 会員の更新日時以外ではなく、会員の全項目を文字列にしたもの（変わっていないことの確認用） */
export function 会員レコード全体(会員ID: string): string {
  return query(`select row_to_json(c)::text as v from dtb_customer c where c.id = $1::int`, [会員ID])[0]?.v ?? "";
}

/** 会員のお届け先（会員住所＝既定の配送先を除く。削除されていないもの）の氏名の一覧 */
export function お届け先の氏名(会員ID: string): string[] {
  return query(
    `select a.name01 || ' ' || a.name02 as 氏名 from dtb_customer_address a where a.customer_id = $1::int and a.del_flg = 0 and a.default_flg = false order by a.id`,
    [会員ID]).map((r) => String(r.氏名));
}
