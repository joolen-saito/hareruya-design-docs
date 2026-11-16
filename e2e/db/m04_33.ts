/**
 * M04-33 戻しリストCSV の DB の照会と、E2E の行への書き足し（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」）。
 * 物理名はこのファイルの SQL の中にだけ書く。
 * - 在庫移動の作成日時: 画面では指定できない（登録した時刻になる）ので、画面で作った E2E の在庫移動の作成日時だけを書き換える。
 *   持ち主の確かめは「その在庫移動の明細の出庫元の在庫が、実行の印の付いた商品コードの商品規格のもの」。
 * - 棚番号の名前: 入力チェック（英大文字1字-数字3桁）を通らない名前は画面で入れられないので、画面で作った E2E の棚番号の名前だけを書き換える
 *   （M04-01 と同じ。db/m04_01_x.ts の 棚番号の名前を書き換える を使う）。
 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

/** 実行の印の付いた商品コードの商品規格を持つ明細がある在庫移動（持ち主の確かめ） */
const 印の在庫移動 = {
  sql: `select smt.id from dtb_stock_move_transfer smt
          join dtb_stock_move_transfer_detail d on d.stock_move_transfer_id = smt.id
          join dtb_product_stock ps on ps.id = d.move_from_product_stock_id
          join dtb_product_class pc on pc.id = ps.product_class_id
         where pc.product_code like '%' || $1`,
  params: [`-${RUN_MARK}`],
};

/** 画面で作った E2E の在庫移動の作成日時を書き換える（日時は "2033-04-01 10:00:00" の形。日本時間） */
export function 在庫移動の作成日時を書き換える(what: string, 在庫移動ID: string[], 日時: string): void {
  updateOwnRows(what, {
    table: "dtb_stock_move_transfer", key: "id", ids: 在庫移動ID, set: { create_date: `${日時}+09` }, owner: 印の在庫移動,
  });
}

/** 在庫移動の作成日時（日本時間の "YYYY-MM-DD HH:MI:SS"） */
export function 在庫移動の作成日時(在庫移動ID: string): string {
  const r = query(`select to_char(create_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI:SS') as d from dtb_stock_move_transfer where id = $1::int`, [在庫移動ID])[0];
  return r?.d ?? "";
}

/** 在庫移動の明細（明細ID・入庫先の在庫ID・商品コード）。明細は画面に出ない */
export function 在庫移動の明細(在庫移動ID: string): { 明細ID: string; 入庫先在庫ID: string; 商品コード: string }[] {
  return query(
    `select d.id as detail_id, d.move_to_product_stock_id as to_stock, pc.product_code as code
       from dtb_stock_move_transfer_detail d
       join dtb_product_stock ps on ps.id = d.move_from_product_stock_id
       join dtb_product_class pc on pc.id = ps.product_class_id
      where d.stock_move_transfer_id = $1::int
      order by d.id`,
    [在庫移動ID],
  ).map((r) => ({ 明細ID: r.detail_id ?? "", 入庫先在庫ID: r.to_stock ?? "", 商品コード: r.code ?? "" }));
}

/** 商品コードの商品規格ID（1件のはず） */
export function 商品規格ID(商品コード: string): string[] {
  return query(`select id from dtb_product_class where product_code = $1 order by id`, [商品コード]).map((r) => r.id ?? "");
}

/**
 * 店舗ID 1・13 の高額商品閾値の、流す前の開発環境の値（どちらも 980・4800・空。記録 M04-33_progress の30行目）。
 * ≪共有の設定≫なので、M04-33・M04-34 は流す前にこの値であることを確かめ、終わるたびにこの値へ戻す（2026-11-15 前の回の戻し損ねを次の回が「元」として控えた）
 */
export const 流す前の高額商品閾値: readonly [string, string, string] = ["980", "4800", ""];

/** 店舗の高額商品閾値1〜3（空は ""） */
export function 店舗の高額商品閾値(店舗ID: string): [string, string, string] {
  const r = query(`select expensive_threshold1 as a, expensive_threshold2 as b, expensive_threshold3 as c from dtb_base_info where id = $1::int`, [店舗ID])[0];
  if (!r) throw new Error(`店舗ID ${店舗ID} が無い`);
  const v = (x: string | null) => (x === null || x === undefined ? "" : String(Number(x)));
  return [v(r.a), v(r.b), v(r.c)];
}

/** 店名の店舗ID（開店・閉店を問わず） */
export function 店名の店舗ID(店名: string): string[] {
  return query(`select id from dtb_base_info where shop_name = $1 order by id`, [店名]).map((r) => r.id ?? "");
}

/** 棚番号の名前が使われているか */
export function 棚番号の名前がある(名前: string): boolean {
  return query(`select id from dtb_shelf_number where name = $1`, [名前]).length > 0;
}

/** 言語コード（JP・EN・FR など）の言語ID（グッズ商品CSVの「言語(ID)」に入れる） */
export function 言語コードのID(コード: string): string {
  const r = query(`select id from mtb_language where code = $1`, [コード]);
  if (r.length !== 1) throw new Error(`言語コード ${コード} の言語が ${r.length} 件（1件のはず）`);
  return r[0].id ?? "";
}

/** 状態コード（NM・HP など）の状態ID */
export function 状態コードのID(コード: string): string {
  const r = query(`select id from mtb_card_condition where code = $1`, [コード]);
  if (r.length !== 1) throw new Error(`状態コード ${コード} の状態が ${r.length} 件（1件のはず）`);
  return r[0].id ?? "";
}

/**
 * 画面で作った E2E の商品規格の状態を書き換える（グッズ商品CSV登録は状態ニアミントの規格を1件作り、商品規格の編集画面では状態を選べない）。
 * 持ち主の確かめは「実行の印の付いた商品コードの商品規格」。
 */
export function 商品規格の状態を書き換える(what: string, 商品規格ID: string, 状態コード: string): void {
  updateOwnRows(what, {
    table: "dtb_product_class", key: "id", ids: [商品規格ID], set: { card_condition_id: 状態コードのID(状態コード) },
    owner: { sql: `select id from dtb_product_class where product_code like '%' || $1`, params: [`-${RUN_MARK}`] },
  });
}

/** 商品規格の状態コード */
export function 商品規格の状態(商品規格ID: string): string {
  const r = query(`select c.code from dtb_product_class pc left join mtb_card_condition c on c.id = pc.card_condition_id where pc.id = $1::int`, [商品規格ID])[0];
  return r?.code ?? "";
}

/** 実行の印の付いた商品の在庫移動を束ねた在庫移動指示（持ち主の確かめ） */
const 印の在庫移動指示 = {
  sql: `select smt.move_instruction_id from dtb_stock_move_transfer smt
          join dtb_stock_move_transfer_detail d on d.stock_move_transfer_id = smt.id
          join dtb_product_stock ps on ps.id = d.move_from_product_stock_id
          join dtb_product_class pc on pc.id = ps.product_class_id
         where pc.product_code like '%' || $1 and smt.move_instruction_id is not null`,
  params: [`-${RUN_MARK}`],
};

/** 画面で作った E2E の在庫移動指示の備考を書き換える（シード表の「備考は画面で指定できないので DB へ直接設定する」。M04-34 の 007。2026-11-16） */
export function 在庫移動指示の備考を書き換える(what: string, 在庫移動指示ID: string, 備考: string): void {
  updateOwnRows(what, { table: "dtb_stock_move_instruction", key: "id", ids: [在庫移動指示ID], set: { memo: 備考 }, owner: 印の在庫移動指示 });
}

/** 在庫移動指示の備考（無ければ空） */
export function 在庫移動指示の備考(在庫移動指示ID: string): string {
  return String(query(`select coalesce(memo, '') as m from dtb_stock_move_instruction where id = $1::int`, [在庫移動指示ID])[0]?.m ?? "");
}
