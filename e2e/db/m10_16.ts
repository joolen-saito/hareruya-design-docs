/**
 * M10-16 追加システム設定 の DB 確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 * 実行区分が「ブラウザ+DB確認」のケースだけが使う。項目は正本の項目名で引く（画面の部品の対応表を使う）。
 */
import { query } from "../lib/db";
import { 追加システム設定の項目 } from "../pages/admin/m10_16_add_system";

export type 設定の行 = { 値: string; 更新者ID: string; 更新日時: string };

function キー(項目: string): string {
  const k = 追加システム設定の項目[項目];
  if (k === undefined) throw new Error(`追加システム設定に「${項目}」という正本の項目は無い`);
  if (k === null) throw new Error(`「${項目}」は画面に入力欄が無く、設定の行の名前が分からない`);
  return k;
}

/** 正本の項目名ごとの設定の行（値・更新した管理者の管理者ID・更新日時）。行が無い項目は null */
export function 設定の行を読む(項目: string[]): Record<string, 設定の行 | null> {
  const keys = 項目.map(キー);
  const rows = query(
    `select option_key, option_value, coalesce(member_id::text, '') as member_id, to_char(update_date, 'YYYY-MM-DD HH24:MI:SS.US') as update_date
       from mtb_option where option_key = any(string_to_array($1, ','))`,
    [keys.join(",")],
  );
  const out: Record<string, 設定の行 | null> = {};
  項目.forEach((name, i) => {
    const hit = rows.filter((r) => r.option_key === keys[i]);
    if (hit.length > 1) throw new Error(`「${name}」の設定の行が ${hit.length} 行ある`);
    out[name] = hit.length ? { 値: hit[0].option_value ?? "", 更新者ID: hit[0].member_id ?? "", 更新日時: hit[0].update_date ?? "" } : null;
  });
  return out;
}

/** 設定の行の総数（行が新しく足されていないことを確かめるため） */
export function 設定の行の数(): number {
  return Number(query(`select count(*) as n from mtb_option`)[0].n);
}

/** 全部の設定の行（行の名前 → 値・更新者・更新日時）。全設定行の監査情報が変わっていないかを比べるため */
export function 全部の設定の行(): Record<string, 設定の行> {
  const out: Record<string, 設定の行> = {};
  for (const r of query(`select option_key, option_value, coalesce(member_id::text, '') as member_id, to_char(update_date, 'YYYY-MM-DD HH24:MI:SS.US') as update_date from mtb_option`)) {
    out[String(r.option_key)] = { 値: r.option_value ?? "", 更新者ID: r.member_id ?? "", 更新日時: r.update_date ?? "" };
  }
  return out;
}

/** 本店（店舗ID 1）の店舗基本設定の基本情報 */
export function 本店の基本情報(): { 店名: string; 郵便番号: string; 都道府県: string; 市区町村名: string; 番地: string; 電話番号: string } {
  const r = query(
    `select b.shop_name, b.postal_code, coalesce(p.name, '') as pref, b.addr01, b.addr02, b.phone_number
       from dtb_base_info b left join mtb_pref p on p.id = b.pref_id where b.id = 1`,
  )[0];
  if (!r) throw new Error("本店（店舗ID 1）の店舗基本設定が無い");
  return { 店名: r.shop_name ?? "", 郵便番号: r.postal_code ?? "", 都道府県: r.pref ?? "", 市区町村名: r.addr01 ?? "", 番地: r.addr02 ?? "", 電話番号: r.phone_number ?? "" };
}
