/** M08-10 オンライン本人確認のDB確認・書き足し。物理名はこのファイルの SQL の中にだけ書く。 */
import { query } from "../lib/db";
import { RUN_MARK } from "../lib/run_marker";
import { writeTestData } from "./write_adapter";

/** 本人確認ステータスの選択肢の名前（番号の順） */
export function 本人確認ステータスの名前(): string[] {
  return query(`select name_jp as v from mtb_identity_confirm_status order by id`).map((r) => String(r.v));
}

/** 会員に紐付く選手情報の番号（無ければ null） */
export function 選手情報の番号(会員ID: string): string | null {
  return query(`select id::text as v from dtb_player where customer_id = $1::int`, [会員ID])[0]?.v ?? null;
}

/** 印つきの会員に紐付く選手情報を消す（ケース028「選手情報が無い状態」。E2E が作った会員の行だけ） */
export function 選手情報を消す(会員ID: string): void {
  const id = 選手情報の番号(会員ID);
  if (!id) throw new Error(`会員ID ${会員ID} に紐付く選手情報が無い`);
  writeTestData({
    理由: "会員に選手情報が無い状態を作る（ケース M08-10-028 の手順3。実行の印つきの会員の選手情報だけ）",
    sql: `delete from dtb_player where id = $1::int`,
    params: [id],
    対象の確かめ: `select c.email as メール from dtb_player p join dtb_customer c on c.id = p.customer_id where p.id = $1::int and c.id = $2::int and c.email like $3`,
    確かめのparams: [id, 会員ID, `%${RUN_MARK}%`],
    印: RUN_MARK,
    最大行数: 1,
  });
}
