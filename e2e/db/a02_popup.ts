/**
 * A02-01（ポップアップ用商品情報取得）・A02-03（同・旧商品ID）のシードの照会と、画面で作れない状態の書き足し。物理名はこのファイルの SQL の中にだけ書く。
 *
 * カードのマスタ（カード・カード詳細・カードセット）は新しく作らず、書き換えもしない。開発環境に既にある、商品の付いていないものを選んで、
 * E2E が作った商品をそこへ紐付ける（M04-03 と同じ）。書くのは E2E が作った商品・商品規格・商品画像・販売数量の行だけ（lib/db_write.ts の持ち主の確かめ）。
 */
import { query } from "../lib/db";
import { insertOwnRows, Owner, updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

const 印 = (): string => `%-${RUN_MARK}`;
/** この実行で作った商品規格（商品コードの末尾に実行の印） */
const 自分の規格: () => Owner = () => ({ sql: "select pc.id from dtb_product_class pc where pc.product_code like $1", params: [印()] });
/** この実行で作った商品（商品規格の商品コードの末尾に実行の印） */
const 自分の商品: () => Owner = () => ({
  sql: "select p.id from dtb_product p where exists (select 1 from dtb_product_class pc where pc.product_id = p.id and pc.product_code like $1)",
  params: [印()],
});
/** この実行で作った商品の商品画像 */
const 自分の商品画像: () => Owner = () => ({
  sql: "select pi.id from dtb_product_image pi where exists (select 1 from dtb_product_class pc where pc.product_id = pi.product_id and pc.product_code like $1)",
  params: [印()],
});

// ---- カードのマスタ（参照だけ） ----

const 選んだカード詳細 = new Set<string>();

/** 開発環境に既にある、商品の付いていないカード詳細（この実行でまだ選んでいないもの）。カードのマスタは新しく作らない */
export function 商品の無いカード詳細(): { カード詳細ID: string; カードID: string; カード名: string } {
  const rows = query(
    `select d.id::text as id, d.card_id::text as card_id, c.name_jp from mtb_card_detail d join mtb_card c on c.id = d.card_id
      where coalesce(c.name_jp, '') <> ''
        and not exists (select 1 from dtb_product p where p.card_detail_id = d.id)
      order by d.id desc limit 200`);
  const r = rows.find((x) => !選んだカード詳細.has(String(x.id)));
  if (!r) throw new Error("商品の付いていないカード詳細が開発環境に無い（カードのマスタは新しく作らない）");
  選んだカード詳細.add(String(r.id));
  return { カード詳細ID: String(r.id), カードID: String(r.card_id), カード名: String(r.name_jp) };
}

const 選んだカード = new Set<string>();

/**
 * 開発環境に既にあるカードのうち、旧商品ID・旧英語商品IDが入っていて、同じ値を持つ別のカードが無く、カード詳細が1件で商品が1つも付いていないもの
 * （この実行でまだ選んでいないもの）。旧商品IDは決め打ちの値に書き換えられないので、このカードの値で読み替える
 */
export function 商品の無い旧商品IDのカード(): { カードID: string; カード詳細ID: string; カード名: string; 旧商品ID: string; 旧英語商品ID: string } {
  const rows = query(
    `select c.id::text as id, c.name_jp, c.old_product_id, c.old_en_product_id, min(d.id)::text as detail_id
       from mtb_card c join mtb_card_detail d on d.card_id = c.id
      where coalesce(c.old_product_id, '') <> '' and coalesce(c.old_en_product_id, '') <> '' and coalesce(c.name_jp, '') <> ''
        and c.old_product_id <> c.old_en_product_id
        and not exists (select 1 from mtb_card_detail d2 join dtb_product p on p.card_detail_id = d2.id where d2.card_id = c.id)
        and not exists (select 1 from mtb_card c2 where c2.id <> c.id
                         and (c2.old_product_id in (c.old_product_id, c.old_en_product_id) or c2.old_en_product_id in (c.old_product_id, c.old_en_product_id)))
      group by c.id, c.name_jp, c.old_product_id, c.old_en_product_id
     having count(d.id) = 1
      order by c.id desc limit 200`);
  const r = rows.find((x) => !選んだカード.has(String(x.id)));
  if (!r) throw new Error("旧商品IDを持ち商品の付いていないカードが開発環境に無い（カードのマスタは新しく作らない）");
  選んだカード.add(String(r.id));
  return { カードID: String(r.id), カード詳細ID: String(r.detail_id), カード名: String(r.name_jp), 旧商品ID: String(r.old_product_id), 旧英語商品ID: String(r.old_en_product_id) };
}

/** 旧商品ID・旧英語商品IDのどちらかに、その値を持つカードの数 */
export function 旧商品IDのカードの数(値: string): number {
  return Number(query("select count(*)::text as n from mtb_card where old_product_id = $1 or old_en_product_id = $1", [値])[0]?.n ?? "0");
}

// ---- 商品・商品規格（参照） ----

/** 商品が DB にあるか */
export function 商品があるか(商品ID: string): boolean {
  return query("select count(*)::text as n from dtb_product where id = $1::int", [商品ID])[0]?.n !== "0";
}

/** 商品規格の通常価格・販売価格と、店舗 TC東京（店舗ID 1）・在庫場所 EC-CUBE の在庫数（DB確認の手順で使う） */
export function 規格の価格と在庫(規格ID: string): { 通常価格: number | null; 販売価格: number | null; 在庫数: number | null } {
  const r = query(
    `select pc.price01::text as p1, pc.price02::text as p2,
            (select ps.stock::text from dtb_product_stock ps where ps.product_class_id = pc.id and ps.base_info_id = 1 and ps.stock_location_id = 1 limit 1) as stock
       from dtb_product_class pc where pc.id = $1::int`, [規格ID])[0];
  const n = (v: string | null | undefined) => (v === null || v === undefined || v === "" ? null : Number(v));
  return { 通常価格: n(r?.p1), 販売価格: n(r?.p2), 在庫数: n(r?.stock) };
}

/** 商品規格の状態（1=表示・2=非表示・3=廃止）と表示の有無 */
export function 規格の状態(規格ID: string): { 状態: string; 表示: string } {
  const r = query("select product_status_id::text as s, visible::text as v from dtb_product_class where id = $1::int", [規格ID])[0];
  return { 状態: String(r?.s ?? ""), 表示: String(r?.v ?? "") };
}

// ---- 画面で作れない状態の書き足し（E2E の行だけ） ----

/** 商品規格の通常価格（商品規格登録編集画面に通常価格の入力欄が無い） */
export function 通常価格を書く(what: string, 規格ID: string, 通常価格: number): void {
  updateOwnRows(what, { table: "dtb_product_class", key: "id", ids: [規格ID], set: { price01: 通常価格 }, owner: 自分の規格() });
}

/** 商品規格を削除済み（廃止・非表示）にする（有効な商品規格の最後の1件は画面で削除できない） */
export function 規格を削除済みにする(what: string, 規格ID: string): void {
  updateOwnRows(what, { table: "dtb_product_class", key: "id", ids: [規格ID], set: { product_status_id: 3, visible: false }, owner: 自分の規格() });
}

/**
 * 商品画像の行を足し、振られた商品画像IDを返す（決まったファイル名の画像を画面から置けない。シード表も保存先へ直接置くと定める）。
 * 画像の実体は置かない（API の応答はファイル名だけを返す）。
 */
export function 商品画像を足す(what: string, 商品ID: string, ファイル名: string, 並び順: number): string {
  insertOwnRows(what, {
    table: "dtb_product_image", parentColumn: "product_id", owner: 自分の商品(),
    rows: [{ product_id: 商品ID, base_info_id: 1, file_name: ファイル名, sort_no: 並び順, create_date: new Date().toISOString() }],
  });
  const r = query("select max(id)::text as id from dtb_product_image where product_id = $1::int and file_name = $2", [商品ID, ファイル名])[0];
  if (!r?.id) throw new Error(`${what}: 足した商品画像の行を読めない`);
  return String(r.id);
}

/** 商品規格に商品画像を順位つきで紐付ける（規格画像。順位は画面で決められない） */
export function 規格画像を紐付ける(what: string, 規格ID: string, 商品画像ID: string, 順位: number): void {
  insertOwnRows(what, {
    table: "dtb_product_class_image", parentColumn: "product_class_id", owner: 自分の規格(),
    rows: [{ product_class_id: 規格ID, product_image_id: 商品画像ID, rank: 順位 }],
  });
  // 紐付けた画像が自分の商品の画像であること（足した行の確かめ）
  const ok = query(
    `select count(*)::text as n from dtb_product_class_image pci join dtb_product_image pi on pi.id = pci.product_image_id
      where pci.product_class_id = $1::int and pci.product_image_id = $2::int and pi.id in (${自分の商品画像().sql.replace("$1", "$3")})`,
    [規格ID, 商品画像ID, 印()])[0]?.n;
  if (ok !== "1") throw new Error(`${what}: 規格画像の紐付けを確かめられない`);
}

/** 商品規格の規格画像（ファイル名と順位。順位の順） */
export function 規格画像の一覧(規格ID: string): { ファイル名: string; 順位: number }[] {
  return query(
    `select pi.file_name, pci.rank::text as r from dtb_product_class_image pci join dtb_product_image pi on pi.id = pci.product_image_id
      where pci.product_class_id = $1::int order by pci.rank, pi.id`, [規格ID]).map((r) => ({ ファイル名: String(r.file_name), 順位: Number(r.r) }));
}

/** 商品規格に、店舗 TC東京（店舗ID 1）・EC 販売分の週間販売数量の行を足す（画面に入力の手段が無い） */
export function 週間販売数量を足す(what: string, 規格ID: string, 数量: number): void {
  insertOwnRows(what, {
    table: "dtb_sales_quantity", parentColumn: "product_class_id", owner: 自分の規格(),
    rows: [{ product_class_id: 規格ID, base_info_id: 1, sales_quantity_01: 0, sales_quantity_02: 0, sales_quantity_03: 0, sales_quantity_04: 数量, sales_quantity_05: 0,
      sales_quantity_06: 0, sales_quantity_07: 0, sales_quantity_08: 0, update_date: new Date().toISOString(), sales_location: 1 }],
  });
}
