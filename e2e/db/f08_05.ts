/** F08-05 店頭買取査定申込確認のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type 査定申込み = {
  id: string; 査定番号: string; 姓: string; 名: string; セイ: string; メイ: string; 郵便番号: string; 都道府県: string;
  フリーコメント: string | null; 会員ID: string | null; 申込日時: number;
};

/** 店舗の、姓が一致する査定申込み（登録の古い順） */
export function 査定申込み(店舗ID: string, 姓: string): 査定申込み[] {
  return query(
    `select o.id, o.assessment_id, o.last_name, o.first_name, o.last_name_kana, o.first_name_kana, o.zipcode, p.name as pref,
            o.free_comment, o.customer_id, extract(epoch from o.apply_date)::text as applied
       from dtb_otc_buy_order o left join mtb_pref p on p.id = o.pref_id
      where o.base_info_id = $1 and o.last_name = $2 order by o.id`, [店舗ID, 姓]).map((r) => ({
    id: r.id!, 査定番号: r.assessment_id ?? "", 姓: r.last_name ?? "", 名: r.first_name ?? "", セイ: r.last_name_kana ?? "", メイ: r.first_name_kana ?? "",
    郵便番号: r.zipcode ?? "", 都道府県: r.pref ?? "", フリーコメント: r.free_comment, 会員ID: r.customer_id, 申込日時: Number(r.applied),
  }));
}

/** 店舗の、会員IDが一致する査定申込み（登録の古い順） */
export function 会員の査定申込み(店舗ID: string, 会員ID: string): { id: string; 会員ID: string | null }[] {
  return query(`select id, customer_id from dtb_otc_buy_order where base_info_id = $1 and customer_id = $2 order by id`, [店舗ID, 会員ID])
    .map((r) => ({ id: r.id!, 会員ID: r.customer_id }));
}

export type 状態の履歴 = { 状態ID: string; 状態: string; 管理者ID: string | null; 作成日時: number };

/** 査定申込みのステータス変更履歴（古い順） */
export function ステータス変更履歴(申込ID: string): 状態の履歴[] {
  return query(
    `select h.otc_buy_order_status_id as sid, s.name, h.member_id, extract(epoch from h.create_date)::text as created
       from dtb_otc_buy_order_status_history h left join mtb_otc_buy_order_status s on s.id = h.otc_buy_order_status_id
      where h.otc_buy_order_id = $1 order by h.id`, [申込ID]).map((r) => ({
    状態ID: r.sid ?? "", 状態: r.name ?? "", 管理者ID: r.member_id, 作成日時: Number(r.created),
  }));
}

/** 査定申込みの状態の一覧（「完了」に当たる状態を名前で探すため） */
export function 査定申込みの状態(): { id: string; 名前: string }[] {
  return query(`select id, name from mtb_otc_buy_order_status order by id`).map((r) => ({ id: r.id!, 名前: r.name ?? "" }));
}

export type 会員 = {
  id: string; 国: string; 姓: string; 名: string; セイ: string; メイ: string; 都道府県: string; 住所1: string; 住所2: string;
  職業: string; 郵便番号: string; 海外郵便番号: string; 電話: [string, string, string]; 生年月日: string; 登録日時: number;
};

/** メールアドレスの会員（削除されていないもの） */
export function 会員(メール: string): 会員[] {
  return query(
    `select c.id, k.name as country, c.name01, c.name02, c.kana01, c.kana02, p.name as pref, c.addr01, c.addr02, j.name as job,
            c.postal_code, c.abroad_postal_code, c.tel01, c.tel02, c.tel03, to_char(c.birth, 'YYYY-MM-DD') as birth,
            extract(epoch from c.create_date)::text as created
       from dtb_customer c left join mtb_country k on k.id = c.country_id left join mtb_pref p on p.id = c.pref_id
       left join mtb_job j on j.id = c.job_id
      where c.email = $1 and c.del_flg = 0 order by c.id`, [メール]).map((r) => ({
    id: r.id!, 国: r.country ?? "", 姓: r.name01 ?? "", 名: r.name02 ?? "", セイ: r.kana01 ?? "", メイ: r.kana02 ?? "", 都道府県: r.pref ?? "",
    住所1: r.addr01 ?? "", 住所2: r.addr02 ?? "", 職業: r.job ?? "", 郵便番号: r.postal_code ?? "", 海外郵便番号: r.abroad_postal_code ?? "",
    電話: [r.tel01 ?? "", r.tel02 ?? "", r.tel03 ?? ""], 生年月日: r.birth ?? "", 登録日時: Number(r.created),
  }));
}

/** 姓が一致する会員の数（削除されていないもの） */
export function 姓の会員数(姓: string): number {
  return Number(query(`select count(*) as n from dtb_customer where name01 = $1 and del_flg = 0`, [姓])[0].n);
}

export type 住所帳 = { 名称: string; 既定: boolean; 姓: string; 名: string; 都道府県: string; 住所1: string; 住所2: string; 郵便番号: string; 海外郵便番号: string };

/** 会員の住所帳（削除されていないもの） */
export function 会員の住所帳(会員ID: string): 住所帳[] {
  return query(
    `select a.address_name, a.default_flg, a.name01, a.name02, p.name as pref, a.addr01, a.addr02, a.postal_code, a.abroad_postal_code
       from dtb_customer_address a left join mtb_pref p on p.id = a.pref_id
      where a.customer_id = $1 and a.del_flg = 0 order by a.id`, [会員ID]).map((r) => ({
    名称: r.address_name ?? "", 既定: r.default_flg === "true", 姓: r.name01 ?? "", 名: r.name02 ?? "", 都道府県: r.pref ?? "",
    住所1: r.addr01 ?? "", 住所2: r.addr02 ?? "", 郵便番号: r.postal_code ?? "", 海外郵便番号: r.abroad_postal_code ?? "",
  }));
}

/** 氏名(姓)が一致する住所帳の数（削除されていないもの） */
export function 姓の住所帳の数(姓: string): number {
  return Number(query(`select count(*) as n from dtb_customer_address where name01 = $1 and del_flg = 0`, [姓])[0].n);
}

export type プレイヤー = { 会員ID: string | null; メール: string; 姓: string; 名: string };

/** メールアドレスが一致するプレイヤー（削除されていないもの） */
export function プレイヤー(メール: string): プレイヤー[] {
  return query(
    `select customer_id, email, last_name_jp, first_name_jp from dtb_player where email = $1 and deleted_at is null order by id`, [メール]).map((r) => ({
    会員ID: r.customer_id, メール: r.email ?? "", 姓: r.last_name_jp ?? "", 名: r.first_name_jp ?? "",
  }));
}

/** 会員のメール配信履歴の、使用したメールテンプレートの名称（送信の古い順） */
export function 配信履歴のテンプレート(会員ID: string): (string | null)[] {
  return query(
    `select t.name from dtb_mail_history h left join dtb_mail_template t on t.id = h.template_id
      where h.customer_id = $1 order by h.id`, [会員ID]).map((r) => r.name);
}
