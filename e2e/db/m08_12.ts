/** M08-12 顧客グループ管理のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。 */
import { query } from "../lib/db";

/** 顧客グループIDの顧客グループの件数（0または1。削除済みのレコードとして残る作りなら、残った行も数える） */
export function 顧客グループの件数(顧客グループID: string): number {
  return Number(query(`select count(*) as n from dtb_customer_group where id = $1::int`, [顧客グループID])[0].n);
}

/** 名称が一致する顧客グループの件数 */
export function 名称の顧客グループの件数(名称: string): number {
  return Number(query(`select count(*) as n from dtb_customer_group where name = $1`, [名称])[0].n);
}

/** 会員のプレイヤーID（画面に表示されないので、DBの参照で控える） */
export function 会員のプレイヤーID(会員ID: string): string | null {
  return query(`select id as v from dtb_player where customer_id = $1::int`, [会員ID])[0]?.v ?? null;
}

/** 試験で使う支払方法3件（既存の支払方法から読み替える）。名前も表示順も他と重ならないものを、表示順の降順の上から3件 */
export function 読み替える支払方法3件(): { id: string; 名前: string; 表示順: string }[] {
  return query(
    `select p.id, p.payment_method as 名前, p.sort_no as 表示順 from dtb_payment p
      where (select count(*) from dtb_payment q where q.payment_method = p.payment_method) = 1
        and (select count(*) from dtb_payment q where q.sort_no = p.sort_no) = 1
      order by p.sort_no desc limit 3`,
  ).map((r) => ({ id: String(r.id), 名前: String(r.名前), 表示順: String(r.表示順) }));
}

export function 支払方法の名前(支払方法ID: string): string {
  return String(query(`select payment_method as v from dtb_payment where id = $1::int`, [支払方法ID])[0]?.v ?? "");
}

/** 本店（店舗ID 1）が本店として登録されているか（フロントの既定のアドレスは本店として判定される） */
export function 本店が登録済みか(): boolean {
  return query(`select is_main_shop as v from dtb_base_info where id = 1`)[0]?.v === "true";
}

export type 顧客グループの保存内容 = {
  名称: string; 還元率: string; 店内注文専用: boolean; 支店店内注文専用: boolean;
  /** 更新日時が現在から何秒前か */
  更新からの秒: number; 更新者: string; 支払方法ID: string[]; 件数: number;
};

function 保存内容(where: string, v: string): 顧客グループの保存内容 | null {
  const rows = query(
    `select g.name as 名称, g.point_percentage::text as 還元率, g.shop_front_flg::text as 店内, g.branch_shop_front_flg::text as 支店,
            extract(epoch from (now() - g.update_date))::text as 秒, coalesce(m.name, '') as 更新者,
            coalesce((select string_agg(gp.payment_id::text, ',' order by gp.payment_id) from dtb_customer_group_payment gp where gp.customer_group_id = g.id), '') as 支払
       from dtb_customer_group g left join dtb_member m on m.id = g.member_id
      where ${where} order by g.id`,
    [v],
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    名称: String(r.名称), 還元率: String(r.還元率), 店内注文専用: r.店内 === "true", 支店店内注文専用: r.支店 === "true",
    更新からの秒: Number(r.秒), 更新者: String(r.更新者), 支払方法ID: String(r.支払) ? String(r.支払).split(",") : [], 件数: rows.length,
  };
}
export function 顧客グループIDの保存内容(id: string): 顧客グループの保存内容 | null { return 保存内容("g.id = $1::int", id); }
export function 顧客グループ名の保存内容(名称: string): 顧客グループの保存内容 | null { return 保存内容("g.name = $1", 名称); }
