/**
 * M03-13 タグ登録/編集の続き（-x）の DB の照会と、E2E が作った商品規格だけへの書き足し（lib/db_write.ts）。物理名はこのファイルの SQL の中にだけ書く。
 * 書き足すのは、画面で作れない状態（有効な規格が1件だけの商品の規格を削除済みにする）だけ。持ち主の確かめは「商品コードがこの実行の印で終わる商品規格」。
 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

const 規格の持ち主 = () => ({ sql: `select id from dtb_product_class where product_code like $1`, params: [`%-${RUN_MARK}`] });

/** 商品コード（規格コード）の商品規格の番号 */
export function 規格の番号(商品コード: string): string[] {
  return query(`select id from dtb_product_class where product_code = $1 order by id`, [商品コード]).map((r) => String(r.id));
}

/**
 * 商品規格を削除済みにする（アプリの商品規格の削除と同じく、公開ステータスを廃止にして表示の印を外す。行は消さない）。
 * 正本の作り方: 商品の有効な規格が1件だけのとき画面は規格の削除を受け付けないので、DBへ直接設定する。
 */
export function 規格を削除済みにする(what: string, 商品コード: string): void {
  const ids = 規格の番号(商品コード);
  if (ids.length !== 1) throw new Error(`${what}: 商品コード ${商品コード} の商品規格が ${ids.length} 件（1件のはず）`);
  updateOwnRows(`${what}: 規格の削除済み`, { table: "dtb_product_class", key: "id", ids, set: { product_status_id: 3, visible: false }, owner: 規格の持ち主() });
}

/** 商品規格が削除済み（表示の印が外れている）か */
export function 規格が削除済みか(商品コード: string): boolean {
  const r = query(`select (not pc.visible)::text as d from dtb_product_class pc where pc.product_code = $1`, [商品コード]);
  if (r.length !== 1) throw new Error(`商品コード ${商品コード} の商品規格が ${r.length} 件（1件のはず）`);
  return r[0].d === "true";
}

/** 商品に付いているタグの番号（番号の順） */
export function 商品のタグ(商品ID: string): string[] {
  return query(`select tag_id from dtb_product_tag where product_id = $1::int order by tag_id`, [商品ID]).map((r) => String(r.tag_id));
}

/** タグの番号のタグがあるか */
export function タグがあるか(タグID: string): boolean {
  return Number(query(`select count(*) as n from dtb_tag where id = $1::int`, [タグID])[0]?.n ?? 0) > 0;
}

/** 名称(日)または名称(英)が一致するタグの番号 */
export function 名称が一致するタグ(名称日: string, 名称英: string): string[] {
  return query(`select id from dtb_tag where name = $1 or name_en = $2 order by id`, [名称日, 名称英]).map((r) => String(r.id));
}
