// 取り込み注記: 同じ部品を main 側も別に実装していたため、栗野側の版を別ファイルにした（栗野側のケース・シードがこちらを使う）。
/** F06-22 お問い合わせのDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query, Row } from "../lib/db";

/**
 * メールアドレスが一致するお問い合わせ（新しい順）。
 * お問い合わせ詳細は番号で保存されるので、画面の選択肢（1 店舗でのお買い物について・2 イベントについて・3 イベントのキャンセル申込）の名前に直して返す。
 */
export function お問い合わせ(メール: string): Row[] {
  return query(
    `select c.id::text as 番号, c.name01 as 姓, c.name02 as 名, c.phone_number as 電話番号, c.email as メールアドレス,
            s.subject as 件名, c.attached_info as 付帯情報,
            case c.sub_subject_id when 1 then '店舗でのお買い物について' when 2 then 'イベントについて' when 3 then 'イベントのキャンセル申込' else '' end as お問い合わせ詳細,
            b.id::text as 店舗ID, b.short_name_jp as 店舗, c.customer_id::text as 会員ID, c.body as 内容
       from dtb_contact c
       left join mtb_contact_subject s on s.id = c.subject_id
       left join dtb_base_info b on b.id = c.base_info_id
      where c.email = $1
      order by c.id desc`, [メール]);
}
