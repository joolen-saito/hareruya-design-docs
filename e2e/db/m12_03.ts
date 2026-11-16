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
import { query } from "../lib/db";
import { RUN_MARK, rc } from "../lib/run_marker";
import { 受注の整え, 受注を整える, 日本時間 } from "./m05_01_order_write";
import { 作った受注 } from "./m12_08";
import { 受注を作る as 写して作る, 空いている年 } from "./m12_07";
import { writeTestData } from "./write_adapter";

export { 空いている年 };

export type 明細の定め = { コード: string; 名: string; 単価: number; 数量: number; タグ?: 1 | 2; 商品ID?: string; 規格ID?: string };
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
  /** 受注の店舗（店舗ID）。省くと基の受注の店舗（本店） */
  店舗ID?: string;
  /** 配送方法を、スムーズ店頭受取（配送方法ID 7）にする・なしにする */
  配送?: "スムーズ" | "なし";
};

export type データ情報 = {
  年: number; 受注: 作った受注[]; タグ名: string[];
  /** 正本のカテゴリ名 → 作ったカテゴリ（2026-11-12 追加） */
  カテゴリ?: Record<string, { ID: string; 名: string }>;
  /** 正本の「セットA」「セットB」に読み替えた既存のカードセットの名前（2026-11-12 追加） */
  カードセット名?: string[];
};
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
    if (d.店舗ID) 受注を整える(id, { 店舗ID: d.店舗ID });
    if (d.配送 === "スムーズ") {
      const 名 = 配送方法の名前("7");
      if (!名.includes("スムーズ")) throw new Error(`配送方法ID 7 が「スムーズ店頭受取」でない（${名}）`);
      受注を整える(id, { 配送先: { 配送方法ID: "7", 配送方法名: 名 } });
    } else if (d.配送 === "なし") 配送方法をなしにする(id);
    for (const [j, m] of d.明細.entries()) {
      const mid = made[i].明細[j].明細ID;
      if (m.商品ID) 明細の商品を設定する(mid, m.商品ID, m.規格ID);
      writeTestData({
        理由: "受注明細の商品コード（実行の印つき）と受注時商品名を、シード表の値にする",
        sql: `update dtb_order_item set product_code = $1::text, product_name = $2::text where id = $3::int`,
        params: [rc(m.コード), m.名, mid], ...明細の確かめ(mid), 最大行数: 1,
      });
    }
  }
  return made;
}

// ---------------------------------------------------------------- 2026-11-12 追加: 店舗・配送方法・商品を指定した受注、控える番号

/** 受注の配送先の配送情報ID（先頭） */
export function 受注の配送情報ID(受注ID: string): string {
  const r = query(`select id from dtb_shipping where order_id = $1::int and deleted_at is null order by id limit 1`, [受注ID]);
  return r.length ? String(r[0].id) : "";
}

/** 明細の商品ID・商品規格ID */
export function 明細の商品と規格(明細ID: string): { 商品ID: string; 規格ID: string } {
  const r = query(`select product_id, product_class_id from dtb_order_item where id = $1::int`, [明細ID]);
  return { 商品ID: String(r[0]?.product_id ?? ""), 規格ID: String(r[0]?.product_class_id ?? "") };
}

/** 配送方法（共有のマスタ。読むだけ）の名前 */
export function 配送方法の名前(配送方法ID: string): string {
  const r = query(`select name from dtb_delivery where id = $1::int`, [配送方法ID]);
  return r.length ? String(r[0].name ?? "") : "";
}

/** 印つきの明細の商品・商品規格を設定する（商品は画面で作った印つきの商品か、カード商品の既存の商品。商品のほうは書き換えない） */
export function 明細の商品を設定する(明細ID: string, 商品ID: string, 規格ID?: string): void {
  writeTestData({
    理由: "受注明細の商品（と商品規格）を、シード表の商品にする",
    sql: `update dtb_order_item set product_id = $1::int, product_class_id = coalesce(nullif($2::text, '')::int, product_class_id) where id = $3::int`,
    params: [商品ID, 規格ID ?? "", 明細ID], ...明細の確かめ(明細ID), 最大行数: 1,
  });
}

/** 印つきの受注の配送先の配送方法を「なし」にする */
export function 配送方法をなしにする(受注ID: string): void {
  writeTestData({
    理由: "受注の配送先の配送方法を、シード表の「なし」にする",
    sql: `update dtb_shipping set delivery_id = null where order_id = $1::int`,
    params: [受注ID], ...受注の確かめ(受注ID), 最大行数: 5,
  });
}

/** 既存のカード商品（共有の商品。読むだけ）から、状態がこの値の規格を持ち、カードセット名が一意な商品を1つ選ぶ。除くカードセットは選ばない */
export function 状態の規格を持つカード商品(状態ID: number, 除くカードセットID = ""): { 商品ID: string; 規格ID: string; カードセットID: string; カードセット名: string } {
  const r = query(
    `select p.id as pid, pc.id as cid, cs.id as sid, cs.name_jp as sname
       from dtb_product p join mtb_card_detail cd on cd.id = p.card_detail_id join mtb_cardset cs on cs.id = cd.cardset_id
       join dtb_product_class pc on pc.product_id = p.id
      where pc.card_condition_id = $1::int and cs.id::text <> $2 and coalesce(cs.name_jp, '') <> ''
        and (select count(*) from mtb_cardset x where x.name_jp = cs.name_jp) = 1
      order by p.id limit 1`, [状態ID, 除くカードセットID]);
  if (!r.length) throw new Error(`状態ID ${状態ID} の規格を持つカード商品（カードセット名が一意）が見つからない`);
  return { 商品ID: String(r[0].pid), 規格ID: String(r[0].cid), カードセットID: String(r[0].sid), カードセット名: String(r[0].sname) };
}
