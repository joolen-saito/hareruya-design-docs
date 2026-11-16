/** F03-08 お気に入り商品のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 会員のお気に入り総数（言語違いも1件ずつ数える） */
export function お気に入り総数(会員ID: string): number {
  return Number(query(
    `select count(*) as n from dtb_favorite_product f join dtb_player p on p.id = f.player_id
      where p.customer_id = $1`, [会員ID])[0].n);
}

/** 会員と商品と言語（JP・EN）を対応付けたお気に入りの件数 */
export function お気に入り件数(会員ID: string, 商品ID: string, 言語: "JP" | "EN"): number {
  return Number(query(
    `select count(*) as n from dtb_favorite_product f join dtb_player p on p.id = f.player_id
      join mtb_language l on l.id = f.language_id
      where p.customer_id = $1 and f.product_id = $2 and l.code = $3`, [会員ID, 商品ID, 言語])[0].n);
}

/** 会員と商品の、言語ごとのお気に入りの件数（例: { JP: 1, EN: 0 }） */
export function 言語別のお気に入り件数(会員ID: string, 商品ID: string): { JP: number; EN: number; そのほか: number } {
  const rows = query(
    `select l.code as code, count(*) as n from dtb_favorite_product f join dtb_player p on p.id = f.player_id
      join mtb_language l on l.id = f.language_id
      where p.customer_id = $1 and f.product_id = $2 group by l.code`, [会員ID, 商品ID]);
  const n = (code: string) => Number(rows.find((r) => r.code === code)?.n ?? 0);
  return { JP: n("JP"), EN: n("EN"), そのほか: rows.filter((r) => r.code !== "JP" && r.code !== "EN").reduce((a, r) => a + Number(r.n), 0) };
}

/** 会員・商品・言語の組で特定したお気に入りのID（無ければ null。画面に出ない番号なので参照で読む） */
export function お気に入りID(会員ID: string, 商品ID: string, 言語: "JP" | "EN"): string | null {
  return query(
    `select f.id as id from dtb_favorite_product f join dtb_player p on p.id = f.player_id
      join mtb_language l on l.id = f.language_id
      where p.customer_id = $1 and f.product_id = $2 and l.code = $3 order by f.id desc limit 1`, [会員ID, 商品ID, 言語])[0]?.id ?? null;
}

/** 在庫編集承認一覧の行の、いまの最大のID（これより大きいIDの行が、これから登録する申請） */
export function 在庫承認の最大ID(): number {
  return Number(query("select coalesce(max(id), 0)::text as m from dtb_stock_approval_list")[0]?.m ?? "0");
}

/**
 * 指定の商品コードの在庫編集の未承認の行のID（baselineId より大きいものだけ）。在庫編集承認一覧には商品コードが出ず、
 * 同じ登録者の別のシードの行（並行して動く別の流し）と区別できないので、自分が登録した商品コードの行をDBで引く。
 */
export function 商品コードの未承認の在庫編集の行ID(商品コード: string[], baselineId: number): string[] {
  const ids = new Set<string>();
  for (const code of 商品コード) {
    for (const r of query(
      `select distinct a.id::text as id
         from dtb_stock_approval_list a
         join dtb_stock_edit_approval_detail d on d.stock_edit_approval_id = a.history_source_id
         join dtb_product_stock ps on ps.id = d.product_stock_id
         join dtb_product_class pc on pc.id = ps.product_class_id
        where a.history_source_type_id = 1 and a.approval_status = 1 and a.id > $1::int and pc.product_code = $2`,
      [baselineId, code])) ids.add(String(r.id));
  }
  return [...ids];
}
