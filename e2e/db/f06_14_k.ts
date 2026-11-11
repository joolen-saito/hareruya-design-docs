// 取り込み注記: 同じ部品を main 側も別に実装していたため、栗野側の版を別ファイルにした（栗野側のケース・シードがこちらを使う）。
/**
 * F06-14 マイイベント・デッキ登録のシードの、画面で作れない部分を DB で整える書き込み（依頼者の承認 2026-11-10「印つきデータは何でも」）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き込みはすべて db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） を通す（1文ずつ・印の確かめ・行数の上限・ログ）。
 *
 * 書く先は、E2E が画面で作った「実行の印つき」の申込・日程だけ。印は、会員のメールアドレス・イベント名に入っている実行の印。
 * 画面で出来ること（日程の日時・申込状況）は、まず画面で直し、画面が受け付けないときだけここで書く。
 */
import { writeTestData } from "./write_adapter";

function 数字(s: string): string {
  if (!/^\d+$/.test(s)) throw new Error(`番号が数字でない（${s}）`);
  return String(Number(s));
}
function 一件(n: number, 何: string): void {
  if (n !== 1) throw new Error(`${何}: 書き込んだ行が ${n} 行（1行のはず）`);
}

/** 申込の支払い会員を、別の会員にする。申込も会員も、メールアドレスに実行の印がある（メールは小文字で保存される）ものに限る */
export function 申込の支払い会員を設定する(申込ID: string, 会員ID: string, 印: string): void {
  const mark = 印.toLowerCase();
  一件(writeTestData({
    理由: `申込 ${申込ID} の支払い会員を会員 ${会員ID} にする（画面では支払い会員を指定できない）`,
    sql: "update dtb_event_entry set paying_customer_id = $2::int where id = $1::int",
    params: [数字(申込ID), 数字(会員ID)],
    対象の確かめ: `select e.id, lower(now_c.email) as now_mail, lower(new_c.email) as new_mail
        from dtb_event_entry e join dtb_customer now_c on now_c.id = e.paying_customer_id, dtb_customer new_c
       where e.id = $1::int and new_c.id = $2::int and lower(now_c.email) like '%' || $3 || '%' and lower(new_c.email) like '%' || $3 || '%'`,
    確かめのparams: [数字(申込ID), 数字(会員ID), mark], 印: mark, 最大行数: 1,
  }), "申込の支払い会員");
}

/** 日程の開始時間・デッキ登録締切を、いまの値から日数ずらす（画面が過去の日時を受け付けないときの代わり）。印はイベント名の実行の印 */
export function 日程の日時をずらす(日程ID: string, 印: string, v: { 開始を日の始まりにする?: boolean; 開始を日ずらす?: number; 締切を日ずらす?: number }): void {
  const 式: string[] = [];
  if (v.開始を日の始まりにする || v.開始を日ずらす !== undefined) {
    const 元 = v.開始を日の始まりにする ? "(date_trunc('day', start_date at time zone 'Asia/Tokyo') at time zone 'Asia/Tokyo')" : "start_date";
    式.push(`start_date = ${元} + (${Math.trunc(v.開始を日ずらす ?? 0)} * interval '1 day')`);
  }
  if (v.締切を日ずらす !== undefined) 式.push(`deck_regist_deadline = deck_regist_deadline + (${Math.trunc(v.締切を日ずらす)} * interval '1 day')`);
  if (!式.length) return;
  一件(writeTestData({
    理由: `日程 ${日程ID} の日時を直す（画面が受け付けない日時）`,
    sql: `update dtb_event_detail set ${式.join(", ")} where id = $1::int`,
    params: [数字(日程ID)],
    対象の確かめ: "select d.id, e.name_jp from dtb_event_detail d join dtb_event e on e.id = d.event_id where d.id = $1::int",
    確かめのparams: [数字(日程ID)], 印, 最大行数: 1,
  }), "日程の日時");
}

/** 申込の申込状況を、決済中（識別子1）・キャンセル済み（識別子6）にする（画面の選択肢に無いときの代わり）。印は支払い会員のメールの実行の印 */
export function 申込状況を設定する(申込ID: string, 状況: "決済中" | "キャンセル済み", 印: string): void {
  const mark = 印.toLowerCase();
  一件(writeTestData({
    理由: `申込 ${申込ID} の申込状況を「${状況}」にする（画面の選択肢に無い）`,
    sql: "update dtb_event_entry set entry_status_id = (select id from mtb_entry_status where name = $2) where id = $1::int",
    params: [数字(申込ID), 状況],
    対象の確かめ: "select e.id, lower(c.email) as mail from dtb_event_entry e join dtb_customer c on c.id = e.paying_customer_id where e.id = $1::int and lower(c.email) like '%' || $2 || '%'",
    確かめのparams: [数字(申込ID), mark], 印: mark, 最大行数: 1,
  }), "申込状況");
}
