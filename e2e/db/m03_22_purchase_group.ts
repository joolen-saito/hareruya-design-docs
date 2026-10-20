/** 購入グループのDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type 保存された購入グループ = {
  購入グループID: string;
  名称日: string;
  名称英: string;
  メモ: string | null;
  予約商品フラグ: string;
  作成日時: string;
  更新日時: string;
  /** 削除されていなければ null */
  削除日時: string | null;
  /** 最後に保存した管理者の管理者ID */
  更新者の管理者ID: string | null;
};

const SELECT = `select id as "購入グループID", name as "名称日", name_en as "名称英", memo as "メモ",
  reservation_flg as "予約商品フラグ", create_date as "作成日時", update_date as "更新日時",
  deleted_at as "削除日時", member_id as "更新者の管理者ID"
  from mtb_sell_group`;

function toGroup(r: Record<string, string | null>): 保存された購入グループ {
  return {
    購入グループID: r.購入グループID ?? "", 名称日: r.名称日 ?? "", 名称英: r.名称英 ?? "", メモ: r.メモ,
    予約商品フラグ: r.予約商品フラグ ?? "", 作成日時: r.作成日時 ?? "", 更新日時: r.更新日時 ?? "",
    削除日時: r.削除日時, 更新者の管理者ID: r.更新者の管理者ID,
  };
}

/** 購入グループIDの購入グループの行（削除日時が入った行も含む）。行が無ければ null */
export function 購入グループ(購入グループID: string): 保存された購入グループ | null {
  const rows = query(`${SELECT} where id = $1`, [購入グループID]);
  return rows.length ? toGroup(rows[0]) : null;
}
