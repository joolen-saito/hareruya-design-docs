/** F06-18 会員情報変更のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query, Row } from "../lib/db";

/** ログイン会員の保存内容（都道府県・国・性別・職業は名称）。会員がいなければ undefined */
export function 会員の値(会員ID: string): Row | undefined {
  return query(
    `select c.name01 as 姓, c.name02 as 名, c.kana01 as セイ, c.kana02 as メイ, to_char(c.birth, 'YYYY-MM-DD') as 生年月日,
            sx.name as 性別, c.email as メールアドレス, ctry.name as 国, c.postal_code as 郵便番号, c.abroad_postal_code as 海外郵便番号,
            pref.name as 都道府県, c.addr01 as 住所1, c.addr02 as 住所2, c.addr03 as 住所3,
            c.tel01 as 電話1, c.tel02 as 電話2, c.tel03 as 電話3, c.company_name as 会社名, jb.name as 職業,
            c.password as パスワード
       from dtb_customer c
       left join mtb_pref pref on pref.id = c.pref_id
       left join mtb_country ctry on ctry.id = c.country_id
       left join mtb_sex sx on sx.id = c.sex_id
       left join mtb_job jb on jb.id = c.job_id
      where c.id = $1::int`, [会員ID])[0];
}

/** ログイン会員の選手情報（本人確認ステータスは名称、更新日時は文字列）。無ければ undefined */
export function 選手の値(会員ID: string): Row | undefined {
  return query(
    `select p.id as 選手情報ID, p.email as 連絡先アドレス, p.last_name_en as 英字姓, p.first_name_en as 英字名,
            p.last_name_jp as 和文姓, p.first_name_jp as 和文名, ics.name_jp as 本人確認ステータス,
            to_char(p.update_date, 'YYYY-MM-DD"T"HH24:MI:SS.US TZH') as 更新日時
       from dtb_player p
       left join mtb_identity_confirm_status ics on ics.id = p.identity_confirm_status_id
      where p.customer_id = $1::int and p.deleted_at is null order by p.id limit 1`, [会員ID])[0];
}

/** 選手情報ID（画面に表示されないので、DBの参照で控える） */
export function 選手情報ID(会員ID: string): string | null {
  return 選手の値(会員ID)?.選手情報ID ?? null;
}

/** 会員の配送先（削除されていないもの）。既定 true は既定の配送先 */
export function 配送先(会員ID: string, 既定: boolean): Row[] {
  return query(
    `select a.id as 配送先ID, a.name01 as 姓, a.name02 as 名, a.kana01 as セイ, a.kana02 as メイ, a.postal_code as 郵便番号,
            a.abroad_postal_code as 海外郵便番号, pref.name as 都道府県, ctry.name as 国, a.addr01 as 住所1, a.addr02 as 住所2, a.addr03 as 住所3,
            a.company_name as 会社名, a.tel01 as 電話1, a.tel02 as 電話2, a.tel03 as 電話3
       from dtb_customer_address a
       left join mtb_pref pref on pref.id = a.pref_id
       left join mtb_country ctry on ctry.id = a.country_id
      where a.customer_id = $1::int and a.del_flg = 0 and a.default_flg = $2::boolean order by a.id`, [会員ID, 既定 ? "true" : "false"]);
}

/** 会員・選手情報・配送先の行の全項目を文字列にしたもの（変わっていないことの確認用） */
export function 会員の行全体(会員ID: string): string {
  return query(`select row_to_json(c)::text as v from dtb_customer c where c.id = $1::int`, [会員ID])[0]?.v ?? "";
}
export function 選手の行全体(選手情報ID: string): string {
  return query(`select row_to_json(p)::text as v from dtb_player p where p.id = $1::int`, [選手情報ID])[0]?.v ?? "";
}
export function 配送先の行全体(配送先ID: string): string {
  return query(`select row_to_json(a)::text as v from dtb_customer_address a where a.id = $1::int`, [配送先ID])[0]?.v ?? "";
}
