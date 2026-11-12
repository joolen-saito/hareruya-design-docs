/**
 * M12-03 受注売上分析 集計一覧表示 のシードが、集計用の受注を整えるための DB 書き込み。
 * 依頼者の承認（2026-11-10「印つきデータは何でも」）の範囲で、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通して書く。
 *
 * 守ること:
 *  - 書く先は、画面（フロントの購入）で作った印つきの受注を写した受注と、その明細だけ（印を含まない行が1つでもあれば書かずに止まる）。
 *  - 共有のマスタ（売上分析タグ・配送方法・店舗）は読むだけ。
 *  - 受注日の年は、ほかの人の受注が無い遠い将来の年に読み替える（db/m12_07.ts の空いている年）。
 *  - 物理名はこのファイルの SQL の中にだけ書く。
 */
import { RUN_MARK, rc } from "../lib/run_marker";
import { 受注の整え, 受注を整える, 日本時間 } from "./m05_01_order_write";
import { 作った受注 } from "./m12_08";
import { 受注を作る as 写して作る, 空いている年 } from "./m12_07";
import { writeTestData } from "./write_adapter";

export { 空いている年 };

export type 明細の定め = { コード: string; 名: string; 単価: number; 数量: number; タグ?: 1 | 2 };
export type 受注の定め = {
  /** 注文日（YYYY-MM-DD hh:mm:ss）。null は注文日未設定 */
  注文日: string | null;
  確定日?: string;
  キャンセル日?: string;
  状態?: "入金済み" | "キャンセル";
  店頭受取?: boolean;
  スマレジ由来?: boolean;
  /** この受注の引き渡し後の受注（定めの並びの番号）。引き渡し済みの元EC受注 */
  引き渡し先?: number;
  明細: 明細の定め[];
};

export type データ情報 = { 年: number; 受注: 作った受注[]; タグ名: string[] };
const infos = new Map<string, データ情報>();
export function データを控える(シードID: string, v: データ情報): void { infos.set(シードID, v); }
export function データ情報を読む(シードID: string): データ情報 {
  const v = infos.get(シードID);
  if (!v) throw new Error(`${シードID} のデータ情報が無い（そのシードを作っていない）`);
  return v;
}

function 受注の確かめ(受注ID: string) {
  return {
    対象の確かめ: `select o.id as 受注ID, i.product_code as 商品コード from dtb_order o join dtb_order_item i on i.order_id = o.id where o.id = $1::int and i.product_code like $2`,
    確かめのparams: [受注ID, `%${RUN_MARK}%`], 印: RUN_MARK,
  };
}
function 明細の確かめ(明細ID: string) {
  return {
    対象の確かめ: `select oi.id as 明細ID, oi.product_code as 商品コード from dtb_order_item oi where oi.id = $1::int and oi.product_code like $2`,
    確かめのparams: [明細ID, `%${RUN_MARK}%`], 印: RUN_MARK,
  };
}

/**
 * 基の受注（画面で作った印つきの受注。本店・宅配便）を写して、定めの受注を作る。
 * 注文日（時刻まで・未設定を含む）・注文確定日・キャンセル日・スマレジ側の受注日・明細の商品コード（実行の印つき）と商品名は、写したあとに設定する。
 */
export function 受注群を作る(基の受注ID: string, ケース番号: string, 定め: 受注の定め[], タグID: string[]): 作った受注[] {
  const 日付 = (d: 受注の定め) => (d.注文日 ?? d.確定日 ?? d.キャンセル日 ?? "2101-01-01 00:00:00").slice(0, 10);
  const made = 写して作る(
    基の受注ID, ケース番号,
    定め.map((d) => ({
      日: 日付(d), 状態: d.状態 ?? "入金済み", 店頭受取: d.店頭受取, スマレジ由来: d.スマレジ由来, 引き渡し先: d.引き渡し先,
      明細: d.明細.map((m) => ({ 単価: m.単価, 数量: m.数量, ...(m.タグ ? { タグ: m.タグ } : {}) })),
    })),
    { タグID, カード商品ID: "" },
  );
  for (const [i, d] of 定め.entries()) {
    const id = made[i].受注ID;
    const 整え: 受注の整え = { 受注日: d.注文日 };
    if (d.キャンセル日 !== undefined) 整え.キャンセル日 = d.キャンセル日;
    受注を整える(id, 整え);

    const sets: string[] = []; const params: (string | number)[] = [];
    if (d.確定日 !== undefined) { params.push(日本時間(d.確定日)); sets.push(`confirm_date = $${params.length}::timestamptz`); }
    // スマレジ由来で引き渡し後の受注は、スマレジ側の受注日が集計日になる（元注文と明細が一致しないとき）。注文日と同じにする
    if (d.スマレジ由来 && d.注文日) { params.push(日本時間(d.注文日)); sets.push(`smaregi_order_date = $${params.length}::timestamptz`); }
    if (sets.length > 0) {
      params.push(id);
      writeTestData({
        理由: "受注の注文確定日・スマレジ側の受注日を、シード表の値にする",
        sql: `update dtb_order set ${sets.join(", ")} where id = $${params.length}::int`, params, ...受注の確かめ(id), 最大行数: 1,
      });
    }
    for (const [j, m] of d.明細.entries()) {
      const mid = made[i].明細[j].明細ID;
      writeTestData({
        理由: "受注明細の商品コード（実行の印つき）と受注時商品名を、シード表の値にする",
        sql: `update dtb_order_item set product_code = $1::text, product_name = $2::text where id = $3::int`,
        params: [rc(m.コード), m.名, mid], ...明細の確かめ(mid), 最大行数: 1,
      });
    }
  }
  return made;
}
