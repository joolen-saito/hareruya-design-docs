/** F06-22 お問い合わせのDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type 件名の行 = { 件名ID: string; 件名: string; 件名英語: string; 受付アドレス: string; 店舗選択あり: boolean; 並び順: string; 付帯情報名: string; 付帯情報名英語: string };

/** お問い合わせ件名のマスタの全行（ID順） */
export function 件名の全行(): 件名の行[] {
  return query(`select id, subject, subject_en, email, shop_flg, sort_no, attached_info_name, attached_info_name_en from mtb_contact_subject order by id`).map((r) => ({
    件名ID: r.id!, 件名: r.subject ?? "", 件名英語: r.subject_en ?? "", 受付アドレス: r.email ?? "", 店舗選択あり: r.shop_flg === "true",
    並び順: r.sort_no ?? "", 付帯情報名: r.attached_info_name ?? "", 付帯情報名英語: r.attached_info_name_en ?? "",
  }));
}

export type お問い合わせの記録 = {
  お問い合わせID: string; 件名ID: string | null; 氏名姓: string; 氏名名: string; 電話番号: string | null; メール: string; 内容: string; 付帯情報: string | null;
  会員ID: string | null; 店舗ID: string | null; お問い合わせ詳細ID: string | null;
};

/** メールアドレスが一致するお問い合わせ（新しい順） */
export function お問い合わせ(メール: string): お問い合わせの記録[] {
  return query(
    `select id, subject_id, name01, name02, phone_number, email, body, attached_info, customer_id, base_info_id, sub_subject_id from dtb_contact where email = $1 order by id desc`, [メール],
  ).map((r) => ({
    お問い合わせID: r.id!, 件名ID: r.subject_id, 氏名姓: r.name01!, 氏名名: r.name02!, 電話番号: r.phone_number, メール: r.email!, 内容: r.body!, 付帯情報: r.attached_info,
    会員ID: r.customer_id, 店舗ID: r.base_info_id, お問い合わせ詳細ID: r.sub_subject_id,
  }));
}

/** 表示名で店舗を引く（店舗IDの確認用） */
export function 店舗ID(店名: string): string[] {
  return query(`select id from dtb_base_info where shop_name = $1 order by id`, [店名]).map((r) => r.id!);
}

/** イベント詳細IDのレコードの件数 */
export function イベント詳細の件数(id: number): number {
  return Number(query(`select count(*) as n from dtb_event_detail where id = $1`, [id])[0]?.n ?? 0);
}
