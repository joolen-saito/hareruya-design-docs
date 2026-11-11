/** 支払方法のDB確認（参照）と、シードが印つきの支払方法を整えるための書き込み。物理名はSQLの中にだけ書く */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";

export type 保存された支払方法 = { 手数料: string | null; 下限: string | null; 上限: string | null; 表示順: string | null };

export function 支払方法を読む(名称: string): 保存された支払方法 {
  const r = query(`select charge as "手数料", rule_min as "下限", rule_max as "上限", sort_no as "表示順"
    from dtb_payment where payment_method = $1 order by id desc limit 1`, [名称]);
  if (r.length !== 1) throw new Error(`支払方法「${名称}」が見つからない`);
  return r[0] as 保存された支払方法;
}

/** 支払方法の表示順の最大（登録の前に控える） */
export function 最大の表示順(): number {
  const r = query(`select max(sort_no) as "最大" from dtb_payment`);
  return Number(r[0].最大);
}

// ---- 書き込み（E2E が画面で作った「実行の印つき」の支払方法に限る。db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通す） ----
const 対象 = (名称: string) => ({
  対象の確かめ: `select payment_method as "名称" from dtb_payment where payment_method = $1`,
  確かめのparams: [名称] as (string | number)[],
  印: RUN_MARK,
});

/** 印つきの支払方法の表示順を、ほかのどの支払方法より小さい値にして、一覧の末尾に置く（画面の登録は最大+1を振るだけで、末尾には置けない） */
export function 表示順を最後にする(名称: string): number {
  return writeTestData({
    理由: "一覧の末尾の行を作る（印つきの支払方法の表示順を、ほかより小さい値にする）",
    sql: `update dtb_payment set sort_no = (select min(sort_no) - 1 from dtb_payment) where payment_method = $1`,
    params: [名称], ...対象(名称), 最大行数: 1,
  });
}

/** 印つきの支払方法の表示順を、ほかのどの支払方法より大きい値にして、一覧の先頭に置く */
export function 表示順を先頭にする(名称: string): number {
  return writeTestData({
    理由: "一覧の先頭の行を確実にする（印つきの支払方法の表示順を、ほかより大きい値にする）",
    sql: `update dtb_payment set sort_no = (select max(sort_no) + 1 from dtb_payment) where payment_method = $1`,
    params: [名称], ...対象(名称), 最大行数: 1,
  });
}

/** 印つきの支払方法を設定した受注を1件足す（管理画面に受注を新規登録する画面が無く、フロントの注文は共有の商品の在庫を減らすため） */
export function 受注を足す(名称: string): number {
  return writeTestData({
    理由: "印つきの支払方法を設定した受注を1件作る（支払方法の削除を止める関連データ）",
    sql: `insert into dtb_order (base_info_id, name01, name02, create_date, update_date, payment_id)
      select (select min(id) from dtb_base_info), $2, 'E2E', now(), now(), p.id from dtb_payment p where p.payment_method = $1`,
    params: [名称, `M1004関連データ-${RUN_MARK}`], ...対象(名称), 最大行数: 1,
  });
}
