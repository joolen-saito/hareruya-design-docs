/**
 * F06-10 ポイント履歴のシードが、画面で作った「実行の印つき」の会員にポイント履歴を足すための DB 書き込みと参照。
 * 依頼者の承認（2026-11-10「印つきデータは何でも」）の範囲で、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通して書く。
 *
 * 守ること:
 *  - 足すのは、この実行の印を含むメールアドレスの会員のポイント履歴だけ（対象の確かめが印を含まない行を返せば writeTestData が止める）。
 *  - 注文を関連付けるときは、その会員が所有する注文だけ（先に参照で確かめる）。
 *  - ポイント残高（プレイヤーの保有ポイント）・マスタは書き換えない。
 *  - 物理名はこのファイルの SQL の中にだけ書く。
 *
 * 理由: 発行日・内容（備考の自由な文字）・スマレジ取引の関連は、管理画面のポイント履歴追加では指定できない（内容は選択肢のみ・スマレジ取引は連携でしか入らない）。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";

const 印 = RUN_MARK.toUpperCase();

function 確かめ(会員ID: string): { 対象の確かめ: string; 確かめのparams: (string | number)[]; 印: string } {
  return {
    対象の確かめ: `select c.id as 会員ID, upper(c.email) as メール from dtb_customer c where c.id = $1::int and upper(c.email) like $2`,
    確かめのparams: [会員ID, `%${印}%`],
    印,
  };
}

/** 日付（2026-08-01）を、日本時間の正午の時刻つきの値にする（日付がどの時刻帯でもずれない） */
function 日本時間の正午(s: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error(`日付の形が違う: ${s}`);
  return `${s} 12:00:00+09:00`;
}

export type 履歴 = { ポイント: number; 発行日: string; 備考: string; 受注ID?: string; スマレジ取引ID?: number };

/** 会員にポイント履歴を、渡した順に足す（IDは渡した順に増える） */
export function ポイント履歴を足す(会員ID: string, 履歴一覧: 履歴[]): void {
  if (履歴一覧.length === 0) return;
  for (const h of 履歴一覧) {
    if (h.受注ID && query(`select id from dtb_order where id = $1::int and customer_id = $2::int`, [h.受注ID, 会員ID]).length === 0) {
      throw new Error(`受注ID ${h.受注ID} は会員ID ${会員ID} の注文でない`);
    }
  }
  const params: (string | number)[] = [会員ID];
  const rows = 履歴一覧.map((h, i) => {
    const p = (v: string | number) => { params.push(v); return `$${params.length}`; };
    return `(${i + 1}, ${p(h.受注ID ?? "")}::text, ${p(h.ポイント)}::text, ${p(h.備考)}::text, ${p(日本時間の正午(h.発行日))}::text, ${p(h.スマレジ取引ID ?? "")}::text)`;
  });
  writeTestData({
    理由: `会員のポイント履歴を ${履歴一覧.length} 件足す`,
    sql: `insert into dtb_point_history (customer_id, order_id, point_change, note, issue_date, create_date, transaction_id)
          select c.id, nullif(v.oid, '')::int, v.pt::int, v.note, v.d::timestamptz, now(), nullif(v.tx, '')::int
            from dtb_customer c cross join (values ${rows.join(", ")}) as v(n, oid, pt, note, d, tx)
           where c.id = $1::int order by v.n`,
    params, ...確かめ(会員ID), 最大行数: 履歴一覧.length,
  });
}

/** 内容が「接頭 + 3桁の連番 + 接尾」で、ポイント・発行日が同じ履歴を、連番の順に件数ぶん足す */
export function ポイント履歴を連番で足す(会員ID: string, v: { 件数: number; ポイント: number; 発行日: string; 接頭: string; 接尾: string }): void {
  writeTestData({
    理由: `会員のポイント履歴を連番で ${v.件数} 件足す`,
    sql: `insert into dtb_point_history (customer_id, order_id, point_change, note, issue_date, create_date, transaction_id)
          select c.id, null, $3::int, $5::text || lpad(g::text, 3, '0') || $6::text, $4::timestamptz, now(), null
            from dtb_customer c cross join generate_series(1, $2::int) as g
           where c.id = $1::int order by g`,
    params: [会員ID, v.件数, v.ポイント, 日本時間の正午(v.発行日), v.接頭, v.接尾], ...確かめ(会員ID), 最大行数: v.件数,
  });
}

/** 会員のポイント履歴IDを、足した順（ID昇順）に（参照だけ） */
export function 履歴IDを順に(会員ID: string): string[] {
  return query(`select id from dtb_point_history where customer_id = $1::int order by id`, [会員ID]).map((r) => String(r.id));
}
