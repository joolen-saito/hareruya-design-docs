/**
 * M12-05 入荷通知依頼 一覧表示(検索項目) のシードが、画面で作った「実行の印つき」の入荷通知依頼を整えるための DB 書き込みと参照。
 * 依頼者の承認（2026-11-10「印つきデータは何でも」）の範囲で、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通して書く。
 *
 * 守ること:
 *  - 書き換える・足すのは、この実行の印つきのメールアドレスの会員の入荷通知依頼だけ（対象の確かめの SELECT が返す行は、どれも印を含む）。
 *  - 商品・言語・会員・プレイヤーのマスタや他人のデータは読むだけ。
 *  - 物理名（テーブル・カラム）はこのファイルの SQL の中にだけ書く。
 *
 * 理由: 依頼日時と削除日時は、ボタンを押した日時になり画面で指定できない。商品単位（規格を指さない）の依頼は、
 * グッズ商品の詳細に「まとめて入荷通知」が無く画面で作れない。1人が持てる依頼の数の上限を超える数の依頼も画面では作れない。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";

const 印 = RUN_MARK.toUpperCase();

/** 会員（印つきのメールアドレス）の依頼であることを確かめる SELECT の組 */
function 会員の確かめ(プレイヤーID: string) {
  return {
    対象の確かめ: `select pl.id as プレイヤーID, upper(c.email) as メール from dtb_player pl join dtb_customer c on c.id = pl.customer_id where pl.id = $1::int`,
    確かめのparams: [プレイヤーID],
    印,
  };
}

/** 会員IDに対応するプレイヤーID（参照だけ） */
export function プレイヤーIDを引く(会員ID: string): string {
  const id = query(`select id from dtb_player where customer_id = $1::int and deleted_at is null order by id limit 1`, [会員ID])[0]?.id;
  if (!id) throw new Error(`会員ID ${会員ID} のプレイヤーが見つからない`);
  return id;
}

/** 会員の、商品規格への依頼（画面で作ったもの）の依頼日時・削除日時を設定する。日時は「2026-07-15 12:00:00」の形（日本時間）。削除日時が無ければ空にする */
export function 規格の依頼日時を設定(プレイヤーID: string, 商品規格ID: string, 依頼日時: string, 削除日時: string | null): number {
  return writeTestData({
    理由: "入荷通知依頼の依頼日時・削除日時を設定する（ボタンを押した日時になり画面で指定できない）",
    sql: `update dtb_product_request set create_date = $1::timestamptz, deleted_at = nullif($2::text, '')::timestamptz where product_class_id = $3::int and player_id = $4::int`,
    params: [`${依頼日時}+09`, 削除日時 ? `${削除日時}+09` : "", 商品規格ID, プレイヤーID],
    ...会員の確かめ(プレイヤーID),
    最大行数: 3,
  });
}

/** 印つきの会員の依頼を1件足す。商品規格を指す依頼は規格ID、商品単位の依頼は商品IDと言語IDを渡す */
export function 依頼を足す(v: { プレイヤーID: string; 商品規格ID?: string; 商品ID?: string; 言語ID?: string; 依頼日時: string; 削除日時: string | null }): number {
  return writeTestData({
    理由: "入荷通知依頼を足す（商品単位の依頼・依頼数の上限を超える依頼は画面で作れない）",
    sql: `insert into dtb_product_request (product_class_id, product_id, language_id, player_id, create_date, deleted_at)
          values (nullif($1::text, '')::int, nullif($2::text, '')::int, nullif($3::text, '')::int, $4::int, $5::timestamptz, nullif($6::text, '')::timestamptz)`,
    params: [v.商品規格ID ?? "", v.商品ID ?? "", v.言語ID ?? "", v.プレイヤーID, `${v.依頼日時}+09`, v.削除日時 ? `${v.削除日時}+09` : ""],
    ...会員の確かめ(v.プレイヤーID),
    最大行数: 1,
  });
}

/** 会員の依頼のID（商品規格単位、または商品単位）。削除済みも含め、最新の1件 */
export function 依頼IDを引く(プレイヤーID: string, 対象: { 商品規格ID: string } | { 商品ID: string }): string {
  const id = "商品規格ID" in 対象
    ? query(`select id from dtb_product_request where player_id = $1::int and product_class_id = $2::int order by id desc limit 1`, [プレイヤーID, 対象.商品規格ID])[0]?.id
    : query(`select id from dtb_product_request where player_id = $1::int and product_id = $2::int and product_class_id is null order by id desc limit 1`, [プレイヤーID, 対象.商品ID])[0]?.id;
  if (!id) throw new Error(`プレイヤーID ${プレイヤーID} の入荷通知依頼（${JSON.stringify(対象)}）が見つからない`);
  return id;
}

export type 依頼の控え = { 依頼ID: string; 商品規格ID: string; 商品ID: string; 言語ID: string; プレイヤーID: string; 依頼日時: string; 削除日時: string };

/** 商品に結びつく入荷通知依頼（規格単位・商品単位とも）の件数と各属性（参照だけ） */
export function 商品の依頼を控える(商品ID: string): 依頼の控え[] {
  return query(
    `select r.id, r.product_class_id, r.product_id, r.language_id, r.player_id, r.create_date::text as create_date, r.deleted_at::text as deleted_at
       from dtb_product_request r left join dtb_product_class pc on pc.id = r.product_class_id
      where coalesce(pc.product_id, r.product_id) = $1::int order by r.id`, [商品ID],
  ).map((r) => ({
    依頼ID: r.id ?? "", 商品規格ID: r.product_class_id ?? "", 商品ID: r.product_id ?? "", 言語ID: r.language_id ?? "",
    プレイヤーID: r.player_id ?? "", 依頼日時: r.create_date ?? "", 削除日時: r.deleted_at ?? "",
  }));
}
