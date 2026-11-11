/**
 * M08-09 配送先一覧表示/編集の DB の照会と、E2E の会員の配送先だけへの書き足し（lib/db_write.ts）。物理名はこのファイルの SQL の中にだけ書く。
 * 書き足すのは画面で作れない状態だけ（既定の配送先の削除・既定の配送先の名称・都道府県の未登録・配送先名称の未登録）。
 * 持ち主の確かめは「メールアドレスがこの実行の印で終わる会員の配送先」。
 */
import { query } from "../lib/db";
import { deleteOwnRows, Owner, updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

const 配送先の持ち主 = (): Owner => ({
  sql: `select a.id from dtb_customer_address a join dtb_customer c on c.id = a.customer_id where c.email like $1`,
  params: [`%-${RUN_MARK}@example.test`],
});

export type 配送先の行 = {
  配送先ID: string; 会員ID: string; 配送先名称: string | null; 国: string | null; 姓: string | null; 名: string | null; セイ: string | null; メイ: string | null;
  会社名: string | null; 郵便番号: string | null; 海外用郵便番号: string | null; 都道府県: string | null; 住所1: string | null; 住所2: string | null; 住所3: string | null;
  電話1: string | null; 電話2: string | null; 電話3: string | null; 既定: string | null; 削除の印: string | null;
};

const SELECT = `select a.id::text as "配送先ID", a.customer_id::text as "会員ID", a.address_name as "配送先名称", c.name as "国",
  a.name01 as "姓", a.name02 as "名", a.kana01 as "セイ", a.kana02 as "メイ", a.company_name as "会社名", a.postal_code as "郵便番号",
  a.abroad_postal_code as "海外用郵便番号", p.name as "都道府県", a.addr01 as "住所1", a.addr02 as "住所2", a.addr03 as "住所3",
  a.tel01 as "電話1", a.tel02 as "電話2", a.tel03 as "電話3", a.default_flg::text as "既定", a.del_flg::text as "削除の印"
  from dtb_customer_address a left join mtb_country c on c.id = a.country_id left join mtb_pref p on p.id = a.pref_id`;

/** 配送先IDの配送先（無ければ null） */
export function 配送先(配送先ID: string): 配送先の行 | null {
  const r = query(`${SELECT} where a.id = $1::int`, [配送先ID])[0];
  return (r as unknown as 配送先の行) ?? null;
}

/** 会員の既定の配送先ID */
export function 既定の配送先ID(会員ID: string): string[] {
  return query(`select id from dtb_customer_address where customer_id = $1::int and default_flg = true order by id`, [会員ID]).map((r) => String(r.id));
}

/** 会員の配送先の数 */
export function 配送先の数(会員ID: string): number {
  return Number(query(`select count(*) as n from dtb_customer_address where customer_id = $1::int`, [会員ID])[0]?.n ?? 0);
}

export function 会員があるか(会員ID: string): boolean {
  return Number(query(`select count(*) as n from dtb_customer where id = $1::int`, [会員ID])[0]?.n ?? 0) > 0;
}
export function 配送先があるか(配送先ID: string): boolean {
  return Number(query(`select count(*) as n from dtb_customer_address where id = $1::int`, [配送先ID])[0]?.n ?? 0) > 0;
}

/** 国・都道府県のマスタに名前の行があるか（参照だけ） */
export function 国がある(名前: string): boolean {
  return Number(query(`select count(*) as n from mtb_country where name = $1`, [名前])[0]?.n ?? 0) > 0;
}
export function 都道府県がある(名前: string): boolean {
  return Number(query(`select count(*) as n from mtb_pref where name = $1`, [名前])[0]?.n ?? 0) > 0;
}

/** 会員登録で自動で作られた既定の配送先を消す（画面に削除の操作が無い。正本の作り方は DB で直接削除） */
export function 既定の配送先を消す(what: string, 会員ID: string): void {
  const ids = 既定の配送先ID(会員ID);
  if (ids.length !== 1) throw new Error(`${what}: 会員ID ${会員ID} の既定の配送先が ${ids.length} 件（1件のはず）`);
  deleteOwnRows(what, { table: "dtb_customer_address", key: "id", ids, owner: 配送先の持ち主() });
}

/** 配送先の値を DB で設定する（画面で指定できない値だけ） */
export function 配送先を設定する(what: string, 配送先ID: string, set: { address_name?: string | null; pref_id?: null }): void {
  updateOwnRows(what, { table: "dtb_customer_address", key: "id", ids: [配送先ID], set, owner: 配送先の持ち主() });
}
