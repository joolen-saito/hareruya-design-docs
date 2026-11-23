/**
 * M04-19 欠品履歴検索一覧の続き（2026-11-23 依頼者「DB の直接の設定は E2E の行だけなら流してよい」）。物理名はこのファイルの SQL の中にだけ書く。
 * - 書き足すのは、画面で作った E2E の欠品の履歴（実行の印つきの商品コードの在庫の履歴）だけ（lib/db_write.ts の窓口を通す）。
 * - 書くのはシード表の投入方法が「画面で指定できないためDBへ直接設定する」とする登録日時・登録者・最終更新日時だけ。照会は参照だけ（lib/db.ts）。
 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

/** 実行の印つきの商品コードの在庫の、在庫変動履歴 */
const 自分の在庫変動履歴 = {
  sql: `select sh.id from dtb_stock_history sh
          join dtb_product_stock ps on ps.id = sh.product_stock_id
          join dtb_product_class pc on pc.id = ps.product_class_id
         where pc.product_code like '%-' || $1`,
  params: [RUN_MARK],
};

/** 名前（完全一致）のメンバーのID（1件であること） */
function メンバーID(名前: string): string {
  const r = query(`select m.id from dtb_member m where m.name = $1`, [名前]);
  if (r.length !== 1) throw new Error(`名前「${名前}」のメンバーが ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}

/** 画面で作った E2E の欠品の履歴の、登録日時・登録者・最終更新日時を書く（シード表「画面で指定できないためDBへ直接設定する」） */
export function 欠品履歴の日時と登録者を整える(what: string, 履歴ID: string, v: { 登録日時: string; 登録者: string; 最終更新日時: string }): void {
  updateOwnRows(what, {
    table: "dtb_stock_history", key: "id", ids: [履歴ID],
    set: { registered_at: v.登録日時, registered_member_id: Number(メンバーID(v.登録者)), update_date: v.最終更新日時 },
    owner: 自分の在庫変動履歴,
  });
}

/** 欠品の履歴の、欠品理由・登録日時・登録者・最終更新日時・最終更新者（記録とシードの確かめ用） */
export function 欠品履歴(履歴ID: string): Record<string, unknown> | undefined {
  return query(
    `select sh.shortage_reason as 欠品理由, to_char(sh.registered_at at time zone 'Asia/Tokyo', 'YYYY/MM/DD HH24:MI') as 登録日時, rm.name as 登録者,
            to_char(sh.update_date at time zone 'Asia/Tokyo', 'YYYY/MM/DD HH24:MI') as 最終更新日時, um.name as 最終更新者
       from dtb_stock_history sh
       left join dtb_member rm on rm.id = sh.registered_member_id
       left join dtb_member um on um.id = sh.update_member_id
      where sh.id = $1::int`, [履歴ID])[0];
}

/** 本店（店舗ID 1）の今の店名（ほかの方が店名を変えることがあるので、照らすたびに読む） */
export function 本店の店名(): string {
  return String(query(`select shop_name from dtb_base_info where id = 1`)[0]?.shop_name ?? "");
}
