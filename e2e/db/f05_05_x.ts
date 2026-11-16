/**
 * F05-05 ネット買取カート の DB 書き込み（IT-F05-05-001 の手順2「DBで商品名・買取価格・商品画像を更新する」）。物理名はこのファイルの SQL の中にだけ書く。
 * - 書き換えるのは、画面で作った E2E の商品（商品コードに実行の印）の商品名と規格の買取価格だけ。
 * - 足すのは、その商品の商品画像1行と、規格への紐付け1行だけ（どちらも画像のファイル名に実行の印を付ける）。足す前に registerRestore で「消す」ことを登録する。
 *   ケースの終わりに基盤が消し、消えたことを DB の参照で確かめる。
 * - 画像の実体（ファイル）は置かない。画面は画像のアドレスを出すだけなので、ケースはアドレスのファイル名で確かめる。
 */
import { query } from "../lib/db";
import { deleteOwnRows, insertOwnRows, updateOwnRows } from "../lib/db_write";
import { registerRestore } from "../lib/shared_restore";
import { RUN_MARK } from "../lib/run_marker";

const 自分の商品 = (商品ID: string) => ({
  sql: `select p.id from dtb_product p where p.id = $1::int and exists (select 1 from dtb_product_class c where c.product_id = p.id and position($2 in c.product_code) > 0)`,
  params: [商品ID, RUN_MARK] as (string | number)[],
});
const 自分の規格 = (規格ID: string) => ({
  sql: `select c.id from dtb_product_class c where c.id = $1::int and position($2 in c.product_code) > 0`,
  params: [規格ID, RUN_MARK] as (string | number)[],
});

function 画像の件数(ファイル名: string): number {
  return Number(query(`select count(*) as n from dtb_product_image where file_name = $1`, [ファイル名])[0].n);
}
function 紐付けの件数(ファイル名: string): number {
  return Number(query(
    `select count(*) as n from dtb_product_class_image ci join dtb_product_image i on i.id = ci.product_image_id where i.file_name = $1`, [ファイル名])[0].n);
}

/** 商品名・規格の買取価格・商品画像（規格の代表画像）を更新する */
export function 商品の名前と買取価格と画像を更新する(what: string, v: { 商品ID: string; 規格ID: string; 商品名: string; 買取価格: number; 画像ファイル名: string }): void {
  if (!v.画像ファイル名.includes(RUN_MARK)) throw new Error(`${what}: 画像のファイル名に実行の印が無い`);
  if (画像の件数(v.画像ファイル名) > 0) throw new Error(`${what}: 画像「${v.画像ファイル名}」が既にある。既存の行は上書きしない`);
  registerRestore(
    `商品画像「${v.画像ファイル名}」と規格への紐付け`,
    { 足した画像: v.画像ファイル名 },
    async () => {
      const ids = query(`select i.id from dtb_product_image i where i.file_name = $1`, [v.画像ファイル名]).map((r) => String(r.id));
      if (ids.length === 0) return;
      const 紐付け = { sql: `select ci.product_image_id from dtb_product_class_image ci join dtb_product_image i on i.id = ci.product_image_id where i.file_name = $1 and position($2 in i.file_name) > 0`, params: [v.画像ファイル名, RUN_MARK] as (string | number)[] };
      if (紐付けの件数(v.画像ファイル名) > 0) deleteOwnRows(`${what} の後始末（紐付け）`, { table: "dtb_product_class_image", key: "product_image_id", ids, owner: 紐付け });
      deleteOwnRows(`${what} の後始末（画像）`, { table: "dtb_product_image", key: "id", ids, owner: { sql: `select i.id from dtb_product_image i where i.file_name = $1 and position($2 in i.file_name) > 0`, params: [v.画像ファイル名, RUN_MARK] } });
    },
    async () => 画像の件数(v.画像ファイル名) === 0 && 紐付けの件数(v.画像ファイル名) === 0,
  );
  updateOwnRows(what, { table: "dtb_product", key: "id", ids: [v.商品ID], set: { name: v.商品名 }, owner: 自分の商品(v.商品ID) });
  updateOwnRows(what, { table: "dtb_product_class", key: "id", ids: [v.規格ID], set: { buy_price: v.買取価格 }, owner: 自分の規格(v.規格ID) });
  const now = new Date().toISOString();
  insertOwnRows(what, {
    table: "dtb_product_image", parentColumn: "product_id", owner: 自分の商品(v.商品ID),
    rows: [{ product_id: v.商品ID, creator_id: null, base_info_id: 1, file_name: v.画像ファイル名, sort_no: 1, create_date: now, s3_bucket_name: null, object_key: null }],
  });
  const 画像ID = query(`select id from dtb_product_image where file_name = $1`, [v.画像ファイル名]).map((r) => String(r.id));
  if (画像ID.length !== 1) throw new Error(`${what}: 足した商品画像が ${画像ID.length} 件（1件のはず）`);
  insertOwnRows(what, {
    table: "dtb_product_class_image", parentColumn: "product_class_id", owner: 自分の規格(v.規格ID),
    rows: [{ product_class_id: v.規格ID, product_image_id: 画像ID[0], rank: 1 }],
  });
}

/** 更新後の値（DB 確認） */
export function 商品の現在の値(商品ID: string, 規格ID: string): { 商品名: string; 買取価格: number; 画像: string | null } {
  const r = query(
    `select p.name as "商品名", c.buy_price as "買取価格",
            (select i.file_name from dtb_product_class_image ci join dtb_product_image i on i.id = ci.product_image_id where ci.product_class_id = c.id order by ci.rank, i.id limit 1) as "画像"
       from dtb_product p join dtb_product_class c on c.product_id = p.id where p.id = $1::int and c.id = $2::int`, [商品ID, 規格ID])[0];
  if (!r) throw new Error(`商品 ${商品ID}・規格 ${規格ID} が無い`);
  return { 商品名: r.商品名 ?? "", 買取価格: Number(r.買取価格), 画像: r.画像 };
}
