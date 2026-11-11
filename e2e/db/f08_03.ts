/** F08-03 店頭買取査定申込登録確認のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。会員・プレイヤー・申込履歴は db/f08_05.ts を使う */
import { query } from "../lib/db";

export type 登録された申込み = {
  id: string; 査定番号: string; 姓: string; 名: string; 住所3: string | null; 会員ID: string | null; 店舗ID: string; 状態: string;
  成年: boolean; 登録番号: string | null; フリーコメント: string | null;
  /** 申込日・更新日（日本時間の YYYYMMDD） */
  申込日: string; 更新日: string;
  /** 同じ店舗の同じ日の、この申込みより前に登録された申込みの件数（査定番号の連番は、この件数+1） */
  先の件数: number;
};

/** 実行日（日本時間の YYYYMMDD） */
export function 実行日(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date()).replace(/-/g, "");
}

/**
 * 店舗の、返却希望サプライの欄に「印」を含む査定申込み（登録の古い順）。
 * 印は、このケース・この実行の申込みを見分けるために、申込みの入力の返却希望サプライ（その他）に入れた文字列。
 */
export function 印つきの申込み(店舗ID: string, 印: string): 登録された申込み[] {
  return query(
    `select o.id, o.assessment_id, o.last_name, o.first_name, o.addr03, o.customer_id, o.base_info_id, s.name as status, o.adult_flg,
            a.qualified_invoice_issuer_code as code, o.free_comment,
            to_char(o.apply_date at time zone 'Asia/Tokyo', 'YYYYMMDD') as apply_day,
            to_char(o.update_date at time zone 'Asia/Tokyo', 'YYYYMMDD') as changed_day,
            (select count(*) from dtb_otc_buy_order p
              where p.base_info_id = o.base_info_id and p.id < o.id
                and p.apply_date >= (date_trunc('day', o.apply_date at time zone 'Asia/Tokyo') at time zone 'Asia/Tokyo')) as before_n
       from dtb_otc_buy_order o
       left join mtb_otc_buy_order_status s on s.id = o.otc_buy_order_status_id
       left join dtb_qualified_invoice_issuer_account a on a.id = o.qualified_invoice_issuer_account_id
      where o.base_info_id = $1 and position($2 in coalesce(o.return_supply, '')) > 0 order by o.id`, [店舗ID, 印]).map((r) => ({
    id: r.id!, 査定番号: r.assessment_id ?? "", 姓: r.last_name ?? "", 名: r.first_name ?? "", 住所3: r.addr03, 会員ID: r.customer_id,
    店舗ID: r.base_info_id ?? "", 状態: r.status ?? "", 成年: r.adult_flg === "true", 登録番号: r.code, フリーコメント: r.free_comment,
    申込日: r.apply_day ?? "", 更新日: r.changed_day ?? "", 先の件数: Number(r.before_n),
  }));
}

/** メールアドレスの会員（削除されていないもの）の会員ステータス */
export function 会員の状態(メール: string): { id: string; 状態: string }[] {
  return query(
    `select c.id, s.name from dtb_customer c left join mtb_customer_status s on s.id = c.customer_status_id
      where c.email = $1 and c.del_flg = 0 order by c.id`, [メール]).map((r) => ({ id: r.id!, 状態: r.name ?? "" }));
}
