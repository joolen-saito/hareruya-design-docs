/**
 * A06-06・A06-07（買取用カード一覧取得の API）のシードで、画面では作れない「関連の欠けた・値の無い」状態を作るための DB の書き込み。
 * 物理名はこのファイルの SQL の中にだけ書く。
 *
 * 書くのは、この実行で E2E が作った行だけ（依頼者決定 2026-11-10「E2E が作った行だけ DB に書いてよい」）。lib/db_write.ts の窓口
 * （updateOwnRows）を通し、持ち主（カード名・商品コードの末尾の実行の印）を確かめてから、件数が合うときだけ確定する。
 * 共有のマスタ（カードセット・プロモーション・レアリティ・言語・状態）は書き換えない。値を外す（null にする）のと、既にある状態の行を選ぶだけ。
 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

const 規格の持ち主 = { sql: "select pc.id from dtb_product_class pc where pc.product_code like $1", params: [`%-${RUN_MARK}`] };
const 詳細の持ち主 = { sql: "select cd.id from mtb_card_detail cd join mtb_card c on c.id = cd.card_id where c.name_jp like $1", params: [`%-${RUN_MARK}`] };
const 商品の持ち主 = { sql: "select p.id from dtb_product p where exists (select 1 from dtb_product_class pc where pc.product_id = p.id and pc.product_code like $1)", params: [`%-${RUN_MARK}`] };
const 在庫の持ち主 = { sql: "select ps.id from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id where pc.product_code like $1", params: [`%-${RUN_MARK}`] };

/** カード詳細のレアリティ・カードセット・プロモーションを外す（null にする） */
export function カード詳細の関連を外す(what: string, カード詳細ID: string, 外す: ("レアリティ" | "カードセット" | "プロモーション")[]): void {
  const 列 = { レアリティ: "rarity_id", カードセット: "cardset_id", プロモーション: "promotion_id" } as const;
  const set = Object.fromEntries(外す.map((k) => [列[k], null]));
  updateOwnRows(what, { table: "mtb_card_detail", key: "id", ids: [カード詳細ID], set, owner: 詳細の持ち主 });
  const r = query("select coalesce(rarity_id::text,'') r, coalesce(cardset_id::text,'') c, coalesce(promotion_id::text,'') p from mtb_card_detail where id = $1::int", [カード詳細ID])[0];
  for (const k of 外す) if ((k === "レアリティ" ? r?.r : k === "カードセット" ? r?.c : r?.p) !== "") throw new Error(`${what}: カード詳細 ${カード詳細ID} の${k}を外したが、読み戻すと残っている`);
}

/** 商品規格の言語・状態・部門・買取価格を外す（null にする） */
export function 規格の関連を外す(what: string, 規格ID: string, 外す: ("言語" | "状態" | "部門" | "買取価格")[]): void {
  const 列 = { 言語: "language_id", 状態: "card_condition_id", 部門: "section_id", 買取価格: "buy_price" } as const;
  const set = Object.fromEntries(外す.map((k) => [列[k], null]));
  updateOwnRows(what, { table: "dtb_product_class", key: "id", ids: [規格ID], set, owner: 規格の持ち主 });
  const r = query("select coalesce(language_id::text,'') l, coalesce(card_condition_id::text,'') c, coalesce(section_id::text,'') s, coalesce(buy_price::text,'') b from dtb_product_class where id = $1::int", [規格ID])[0];
  for (const k of 外す) if ((k === "言語" ? r?.l : k === "状態" ? r?.c : k === "部門" ? r?.s : r?.b) !== "") throw new Error(`${what}: 商品規格 ${規格ID} の${k}を外したが、読み戻すと残っている`);
}

/** 商品の保管コード（略称タグ）を外す（null にする） */
export function 商品の保管コードを外す(what: string, 商品ID: string): void {
  updateOwnRows(what, { table: "dtb_product", key: "id", ids: [商品ID], set: { storage_code_id: null }, owner: 商品の持ち主 });
}

/** 商品規格の状態を、状態マスタのコードの状態にする（マスタは書き換えず、既にある状態を選ぶだけ） */
export function 規格の状態を変える(what: string, 規格ID: string, 状態コード: string): void {
  const id = query("select id::text as id from mtb_card_condition where code = $1", [状態コード])[0]?.id;
  if (!id) throw new Error(`${what}: 状態のマスタにコード ${状態コード} が無い`);
  updateOwnRows(what, { table: "dtb_product_class", key: "id", ids: [規格ID], set: { card_condition_id: id }, owner: 規格の持ち主 });
}

/** 在庫場所の番号（アプリの決まり: 1=EC-CUBE、2=スマレジ） */
export const 在庫場所 = { EC: 1, EC以外: 2 } as const;

/** E2E の商品規格の、店舗・在庫場所の在庫数を書く（行は商品の登録のときにアプリが全店舗・全在庫場所の分を作っている） */
export function 在庫数を書く(what: string, 規格ID: string, 店舗ID: string, 場所: number, 数: number): void {
  const row = query("select id::text as id from dtb_product_stock where product_class_id = $1::int and base_info_id = $2::int and stock_location_id = $3::int order by id limit 1", [規格ID, 店舗ID, String(場所)])[0];
  if (!row) throw new Error(`${what}: 商品規格 ${規格ID} の店舗 ${店舗ID}・在庫場所 ${場所} の在庫の行が無い`);
  updateOwnRows(what, { table: "dtb_product_stock", key: "id", ids: [String(row.id)], set: { stock: 数 }, owner: 在庫の持ち主 });
  const n = query("select coalesce(stock,0)::text as n from dtb_product_stock where id = $1::int", [String(row.id)])[0]?.n;
  if (n !== String(数)) throw new Error(`${what}: 在庫数を ${数} にしたが、読み戻すと ${n}`);
}
