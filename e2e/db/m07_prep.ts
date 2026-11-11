/**
 * M07（ネット買取管理）のシードの、画面で作れない部分を DB で整える書き込み（依頼者の承認 2026-11-10「印つきデータは何でも」）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き込みはすべて db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） を通す（1文ずつ・印の確かめ・行数の上限・ログ）。
 *
 * 書く先は、E2E が画面で作った「実行の印つき」の買取（会員のメールアドレスに実行の印が入っている）と、
 * その買取に紐づく行（明細・個別入力商品・実在庫・履歴）だけ。印の確かめは、買取の行（メールアドレス）か、
 * 印つきの商品コードの商品規格で行う。共有のマスタ・設定・ほかの人のデータには書かない。
 *
 * 行の形は、外部アプリ（MTGBuyer）の連携が作る形に合わせた（アプリの BuildBuyMainCard・エンティティの定義を読んだ）:
 * - まとめて買取の明細: 買取代表カードの行で、買取区分=まとめて（2）。商品・言語・状態は商品規格から写す（画面と承諾の処理は、この3つで商品規格を引く）。
 *   Foil区分はカード詳細から引く作りで、グッズ商品はカード詳細が無いので空。
 * - 個別入力商品: 商品名・査定金額・数量・売却・商品規格（空＝実在庫未登録、入れる＝実在庫登録済み）。
 * - 実在庫情報: 商品規格・数量・小計。実在庫の履歴: 実在庫・変更前／変更後の数量・作成日時。
 * - ステータス変更履歴: 買取状況・変更日時・変更者（メンバー）。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";

function 数字(s: string): string {
  if (!/^\d+$/.test(s)) throw new Error(`番号が数字でない（${s}）`);
  return String(Number(s));
}

/** 買取状況の番号（アプリの定数。名前の表記の揺れに頼らない） */
export const 買取状況の番号 = {
  注文: 1, 商品到着: 2, MTGBuyer査定完了: 3, 査定内容承諾: 4, 本人確認済み: 5, 振込依頼済み: 6, 振込完了: 7, 振込失敗: 8,
  キャンセル済み: 9, 査定中: 10, 査定中断: 11, 査定再開: 12, 査定内容連絡済み: 13, 入庫済み: 14, 未登録在庫あり: 15, 入庫待ち: 16,
} as const;
export type 買取状況名 = keyof typeof 買取状況の番号;

const 買取の確かめ = "select b.id, b.email from dtb_buy_order b where b.id = $1::int";

/** 売却の値（する／しない／未定）を SQL の真偽（空＝未定）にする */
const 売却の値 = (v: "する" | "しない" | "未定"): string => (v === "する" ? "true" : v === "しない" ? "false" : "");

/** 印つきの商品コードの商品規格があるか（無ければ止める） */
function 規格を確かめる(商品コード: string): void {
  const n = Number(query("select count(*) as n from dtb_product_class where product_code = $1", [商品コード])[0].n);
  if (n !== 1) throw new Error(`商品コード ${商品コード} の商品規格が ${n} 件（1件のはず）`);
}

function 一件(n: number, 何: string): void {
  if (n !== 1) throw new Error(`${何}: 書き込んだ行が ${n} 行（1行のはず）`);
}

export type まとめての明細 = { 商品コード: string; 査定価格: number; 数量: number; 売却: "する" | "しない" | "未定"; /** 真なら状態なし（買取商品一覧CSVの「状態なし」の行になる） */ 状態なし?: boolean };

/** 印つきの買取に、まとめて買取の明細を1件足す（商品は印つきの商品コードの商品規格から） */
export function まとめて買取の明細を足す(買取番号: string, 印: string, m: まとめての明細): void {
  規格を確かめる(m.商品コード);
  const n = writeTestData({
    理由: `まとめて買取の明細 ${m.商品コード}（査定価格${m.査定価格}・数量${m.数量}・売却${m.売却}${m.状態なし ? "・状態なし" : ""}）を買取 ${買取番号} に足す`,
    sql: `insert into dtb_buy_main_card (buy_order_id, product_id, language_id, card_condition_id, foil_flg, price, count, sale_flg, purchase_category)
          select b.id, pc.product_id, pc.language_id, (case when $6::int = 1 then null else pc.card_condition_id end), null, $3::int, $4::int, nullif($5, '')::boolean, 2
            from dtb_buy_order b join dtb_product_class pc on pc.product_code = $2
           where b.id = $1::int`,
    params: [数字(買取番号), m.商品コード, m.査定価格, m.数量, 売却の値(m.売却), m.状態なし ? 1 : 0],
    対象の確かめ: 買取の確かめ, 確かめのparams: [数字(買取番号)], 印, 最大行数: 1,
  });
  一件(n, "まとめて買取の明細");
}

export type 個別入力 = { 名前: string; 査定金額: number; 数量: number; 売却: "する" | "しない" | "未定"; 登録済みの商品コード?: string };

/** 印つきの買取に、個別入力商品を1件足す（登録済みの商品コードを与えると実在庫登録済み＝商品規格つき） */
export function 個別入力商品を足す(買取番号: string, 印: string, v: 個別入力): string {
  if (v.登録済みの商品コード) 規格を確かめる(v.登録済みの商品コード);
  const n = writeTestData({
    理由: `個別入力商品 ${v.名前}（査定金額${v.査定金額}・数量${v.数量}・売却${v.売却}・${v.登録済みの商品コード ? `実在庫登録済み ${v.登録済みの商品コード}` : "実在庫未登録"}）を買取 ${買取番号} に足す`,
    sql: `insert into dtb_buy_order_indivisual_input_product (buy_order_id, name, price, quantity, sale_flg, product_class_id)
          select b.id, $2, $3::int, $4::int, nullif($5, '')::boolean,
                 (select pc.id from dtb_product_class pc where pc.product_code = nullif($6, ''))
            from dtb_buy_order b where b.id = $1::int`,
    params: [数字(買取番号), v.名前, v.査定金額, v.数量, 売却の値(v.売却), v.登録済みの商品コード ?? ""],
    対象の確かめ: 買取の確かめ, 確かめのparams: [数字(買取番号)], 印, 最大行数: 1,
  });
  一件(n, "個別入力商品");
  const r = query("select max(id) as id from dtb_buy_order_indivisual_input_product where buy_order_id = $1::int and name = $2", [数字(買取番号), v.名前])[0];
  return String(r.id);
}

/** 印つきの買取に、実在庫情報を1件足す（商品は印つきの商品コードの商品規格）。実在庫のIDを返す */
export function 実在庫情報を足す(買取番号: string, 印: string, v: { 商品コード: string; 数量: number; 小計: number }): string {
  規格を確かめる(v.商品コード);
  const n = writeTestData({
    理由: `実在庫情報 ${v.商品コード}（数量${v.数量}・小計${v.小計}）を買取 ${買取番号} に足す`,
    sql: `insert into dtb_buy_order_stock (buy_order_id, product_class_id, quantity, subtotal)
          select b.id, pc.id, $3::int, $4::int from dtb_buy_order b join dtb_product_class pc on pc.product_code = $2 where b.id = $1::int`,
    params: [数字(買取番号), v.商品コード, v.数量, v.小計],
    対象の確かめ: 買取の確かめ, 確かめのparams: [数字(買取番号)], 印, 最大行数: 1,
  });
  一件(n, "実在庫情報");
  const r = query(
    `select max(s.id) as id from dtb_buy_order_stock s join dtb_product_class pc on pc.id = s.product_class_id
      where s.buy_order_id = $1::int and pc.product_code = $2`, [数字(買取番号), v.商品コード],
  )[0];
  return String(r.id);
}

/** 印つきの買取の実在庫情報に、実在庫の履歴を1件足す */
export function 実在庫履歴を足す(買取番号: string, 印: string, 実在庫ID: string, v: { 変更前: number | null; 変更後: number; 日時: string }): void {
  const n = writeTestData({
    理由: `買取 ${買取番号} の実在庫 ${実在庫ID} に実在庫履歴（${v.変更前 ?? "空"}→${v.変更後}・${v.日時}）を足す`,
    sql: `insert into dtb_buy_order_stock_history (buy_order_stock_id, member_id, before_quantity, after_quantity, create_date)
          select s.id, null, nullif($2, '')::int, $3::int, $4::timestamptz from dtb_buy_order_stock s where s.id = $1::int`,
    params: [数字(実在庫ID), v.変更前 === null ? "" : v.変更前, v.変更後, v.日時],
    対象の確かめ: "select s.id, b.email from dtb_buy_order_stock s join dtb_buy_order b on b.id = s.buy_order_id where s.id = $1::int and b.id = $2::int",
    確かめのparams: [数字(実在庫ID), 数字(買取番号)], 印, 最大行数: 1,
  });
  一件(n, "実在庫の履歴");
}

/** 印つきの買取のステータス変更履歴をすべて消す（無ければ何もしない）。消した件数を返す */
export function ステータス変更履歴を消す(買取番号: string, 印: string): number {
  const 確かめ = "select h.id, b.email from dtb_buy_order_status_histry h join dtb_buy_order b on b.id = h.buy_order_id where b.id = $1::int";
  const rows = query(確かめ, [数字(買取番号)]);
  if (rows.length === 0) return 0;
  return writeTestData({
    理由: `買取 ${買取番号} のステータス変更履歴（${rows.length}件）を消す`,
    sql: "delete from dtb_buy_order_status_histry where buy_order_id = $1::int",
    params: [数字(買取番号)],
    対象の確かめ: 確かめ, 確かめのparams: [数字(買取番号)], 印, 最大行数: Math.max(1, rows.length),
  });
}

/** 印つきの買取に、ステータス変更履歴を1件足す（日時は「2026-08-01 10:00:00+09」の形。変更者はメンバーのログインID、空なら無し） */
export function ステータス変更履歴を足す(買取番号: string, 印: string, v: { 状況: 買取状況名; 日時: string; 変更者のログインID?: string }): void {
  const n = writeTestData({
    理由: `買取 ${買取番号} にステータス変更履歴（${v.状況}・${v.日時}）を足す`,
    sql: `insert into dtb_buy_order_status_histry (buy_order_id, buy_order_status_id, create_date, member_id)
          select b.id, $2::int, $3::timestamptz, (select m.id from dtb_member m where m.login_id = nullif($4, ''))
            from dtb_buy_order b where b.id = $1::int`,
    params: [数字(買取番号), 買取状況の番号[v.状況], v.日時, v.変更者のログインID ?? ""],
    対象の確かめ: 買取の確かめ, 確かめのparams: [数字(買取番号)], 印, 最大行数: 1,
  });
  一件(n, "ステータス変更履歴");
}

/** 印つきの買取の買取依頼日を設定する（日時は「2026-08-10 12:00:00+09」の形） */
export function 買取依頼日を設定する(買取番号: string, 印: string, 日時: string): void {
  一件(writeTestData({
    理由: `買取 ${買取番号} の買取依頼日を ${日時} にする`,
    sql: "update dtb_buy_order set order_date = $2::timestamptz where id = $1::int",
    params: [数字(買取番号), 日時],
    対象の確かめ: 買取の確かめ, 確かめのparams: [数字(買取番号)], 印, 最大行数: 1,
  }), "買取依頼日");
}

/** 印つきの買取の買取状況を設定する（画面の保存を通さない） */
export function 買取状況を直接設定する(買取番号: string, 印: string, 状況: 買取状況名): void {
  一件(writeTestData({
    理由: `買取 ${買取番号} の買取状況を ${状況} にする`,
    sql: "update dtb_buy_order set buy_order_status_id = $2::int where id = $1::int",
    params: [数字(買取番号), 買取状況の番号[状況]],
    対象の確かめ: 買取の確かめ, 確かめのparams: [数字(買取番号)], 印, 最大行数: 1,
  }), "買取状況");
}

/** 印つきの買取の査定金額合計（買取金額の合計）を設定する */
export function 査定金額合計を設定する(買取番号: string, 印: string, 金額: number): void {
  一件(writeTestData({
    理由: `買取 ${買取番号} の査定金額合計を ${金額} にする`,
    sql: "update dtb_buy_order set total_price = $2::int where id = $1::int",
    params: [数字(買取番号), 金額],
    対象の確かめ: 買取の確かめ, 確かめのparams: [数字(買取番号)], 印, 最大行数: 1,
  }), "査定金額合計");
}

/** 印つきの買取の、選んで買取の明細（印つきの商品コードの商品）の査定価格を設定する */
export function 選んで買取の査定価格を設定する(買取番号: string, 印: string, 商品コード: string, 査定価格: number): void {
  const 確かめ = `select c.id, b.email from dtb_buy_main_card c join dtb_buy_order b on b.id = c.buy_order_id
                   where b.id = $1::int and c.purchase_category = 1 and c.product_id = (select pc.product_id from dtb_product_class pc where pc.product_code = $2)`;
  一件(writeTestData({
    理由: `買取 ${買取番号} の選んで買取 ${商品コード} の査定価格を ${査定価格} にする`,
    sql: `update dtb_buy_main_card set price = $3::int
           where buy_order_id = $1::int and purchase_category = 1 and product_id = (select pc.product_id from dtb_product_class pc where pc.product_code = $2)`,
    params: [数字(買取番号), 商品コード, 査定価格],
    対象の確かめ: 確かめ, 確かめのparams: [数字(買取番号), 商品コード], 印, 最大行数: 1,
  }), "選んで買取の査定価格");
}

/**
 * 印つきの会員の本人確認情報（プレイヤー情報）を会員から外す（会員に本人確認情報が無い状態にする）。
 * 行を消すとほかの表（大会の参加など）の参照が切れるおそれがあるので、会員とのつながりだけを外す。外した件数を返す
 */
export function 会員の本人確認情報を外す(会員ID: string, 印: string): number {
  const 確かめ = "select p.id, c.email from dtb_player p join dtb_customer c on c.id = p.customer_id where c.id = $1::int";
  const rows = query(確かめ, [数字(会員ID)]);
  if (rows.length === 0) return 0;
  return writeTestData({
    理由: `会員 ${会員ID} の本人確認情報（${rows.length}件）を会員から外す`,
    sql: "update dtb_player set customer_id = null where customer_id = $1::int",
    params: [数字(会員ID)],
    対象の確かめ: 確かめ, 確かめのparams: [数字(会員ID)], 印, 最大行数: Math.max(1, rows.length),
  });
}

// ---- M07-01（買取検索一覧）のために足した書き込み ----

const 状態コード = ["NM", "SP", "MP", "HP", "OT"];
function 状態(c: string): string {
  if (!状態コード.includes(c)) throw new Error(`状態のコードが不明（${c}）`);
  return c;
}

/** 印つきの買取の、ある状況の履歴をすべて消して、与えた日時の履歴にする（ほかの状況の履歴は残す）。日時は「2026-08-01 00:00:00+09」の形 */
export function 状況の履歴を入れ替える(買取番号: string, 印: string, 状況: 買取状況名, 日時: string[]): void {
  const 確かめ = "select h.id, b.email from dtb_buy_order_status_histry h join dtb_buy_order b on b.id = h.buy_order_id where b.id = $1::int and h.buy_order_status_id = $2::int";
  const rows = query(確かめ, [数字(買取番号), String(買取状況の番号[状況])]);
  if (rows.length > 0) {
    writeTestData({
      理由: `買取 ${買取番号} の「${状況}」の履歴（${rows.length}件）を消す`,
      sql: "delete from dtb_buy_order_status_histry where buy_order_id = $1::int and buy_order_status_id = $2::int",
      params: [数字(買取番号), 買取状況の番号[状況]],
      対象の確かめ: 確かめ, 確かめのparams: [数字(買取番号), 買取状況の番号[状況]], 印, 最大行数: rows.length,
    });
  }
  for (const d of 日時) {
    一件(writeTestData({
      理由: `買取 ${買取番号} に「${状況}」の履歴（${d}）を足す`,
      sql: `insert into dtb_buy_order_status_histry (buy_order_id, buy_order_status_id, create_date, member_id)
            select b.id, $2::int, $3::timestamptz, null from dtb_buy_order b where b.id = $1::int`,
      params: [数字(買取番号), 買取状況の番号[状況], d],
      対象の確かめ: 買取の確かめ, 確かめのparams: [数字(買取番号)], 印, 最大行数: 1,
    }), "ステータス変更履歴");
  }
}

/** 印つきの買取の箱数を設定する（null＝未設定） */
export function 箱数を設定する(買取番号: string, 印: string, 箱数: number | null): void {
  一件(writeTestData({
    理由: `買取 ${買取番号} の箱数を ${箱数 ?? "未設定"} にする`,
    sql: "update dtb_buy_order set package_count = nullif($2, '')::int where id = $1::int",
    params: [数字(買取番号), 箱数 === null ? "" : 箱数],
    対象の確かめ: 買取の確かめ, 確かめのparams: [数字(買取番号)], 印, 最大行数: 1,
  }), "箱数");
}

/** 印つきの商品コードの商品規格の状態（NM・HP など）を設定する。印は商品コード（実行の印つき） */
export function 商品規格の状態を設定する(商品コード: string, 状態の名: string): void {
  一件(writeTestData({
    理由: `商品規格 ${商品コード} の状態を ${状態の名} にする`,
    sql: "update dtb_product_class set card_condition_id = (select cc.id from mtb_card_condition cc where cc.code = $2) where product_code = $1",
    params: [商品コード, 状態(状態の名)],
    対象の確かめ: "select pc.id, pc.product_code from dtb_product_class pc where pc.product_code = $1", 確かめのparams: [商品コード], 印: 商品コード, 最大行数: 1,
  }), "商品規格の状態");
}

/** 印つきの買取の、選んで買取の明細（印つきの商品コードの商品）の査定価格と状態を設定する */
export function 選んで買取の価格と状態を設定する(買取番号: string, 印: string, 商品コード: string, 査定価格: number, 状態の名: string): void {
  const 確かめ = `select c.id, b.email from dtb_buy_main_card c join dtb_buy_order b on b.id = c.buy_order_id
                   where b.id = $1::int and c.purchase_category = 1 and c.product_id = (select pc.product_id from dtb_product_class pc where pc.product_code = $2)`;
  一件(writeTestData({
    理由: `買取 ${買取番号} の選んで買取 ${商品コード} の査定価格を ${査定価格}・状態を ${状態の名} にする`,
    sql: `update dtb_buy_main_card set price = $3::int, card_condition_id = (select cc.id from mtb_card_condition cc where cc.code = $4)
           where buy_order_id = $1::int and purchase_category = 1 and product_id = (select pc.product_id from dtb_product_class pc where pc.product_code = $2)`,
    params: [数字(買取番号), 商品コード, 査定価格, 状態(状態の名)],
    対象の確かめ: 確かめ, 確かめのparams: [数字(買取番号), 商品コード], 印, 最大行数: 1,
  }), "選んで買取の査定価格と状態");
}

/** 印つきの買取の、選んで買取の明細（印つきの商品コードの商品）の申込単価を、与えた状態別の金額に置き換える */
export function 申込単価を置き換える(買取番号: string, 印: string, 商品コード: string, 単価: { 状態: string; 金額: number }[]): void {
  const 範囲 = `b.id = $1::int and c.purchase_category = 1 and c.product_id = (select pc.product_id from dtb_product_class pc where pc.product_code = $2)`;
  const 確かめ = `select ap.id, b.email from dtb_application_price ap join dtb_buy_main_card c on c.id = ap.buy_main_card_id join dtb_buy_order b on b.id = c.buy_order_id where ${範囲}`;
  const rows = query(確かめ, [数字(買取番号), 商品コード]);
  if (rows.length > 0) {
    writeTestData({
      理由: `買取 ${買取番号} の ${商品コード} の申込単価（${rows.length}件）を消す`,
      sql: `delete from dtb_application_price where id in (select ap.id from dtb_application_price ap join dtb_buy_main_card c on c.id = ap.buy_main_card_id join dtb_buy_order b on b.id = c.buy_order_id where ${範囲})`,
      params: [数字(買取番号), 商品コード],
      対象の確かめ: 確かめ, 確かめのparams: [数字(買取番号), 商品コード], 印, 最大行数: rows.length,
    });
  }
  for (const t of 単価) {
    一件(writeTestData({
      理由: `買取 ${買取番号} の ${商品コード} に申込単価（${t.状態} ${t.金額}円）を足す`,
      sql: `insert into dtb_application_price (buy_main_card_id, card_condition_id, application_price)
            select c.id, (select cc.id from mtb_card_condition cc where cc.code = $3), $4::int
              from dtb_buy_main_card c join dtb_buy_order b on b.id = c.buy_order_id where ${範囲}`,
      params: [数字(買取番号), 商品コード, 状態(t.状態), t.金額],
      対象の確かめ: `select c.id, b.email from dtb_buy_main_card c join dtb_buy_order b on b.id = c.buy_order_id where ${範囲}`, 確かめのparams: [数字(買取番号), 商品コード], 印, 最大行数: 1,
    }), "申込単価");
  }
}

/** まとめて買取の商品（設定「まとめて買取の商品ID」の商品。共有のマスタの商品。読むだけ）の商品ID。設定が無い・商品が無ければ止める */
export function まとめて買取商品の商品ID(): { id: string; 名前: string } {
  const r = query("select p.id, p.name from dtb_product p where p.id = (select o.option_value::int from mtb_option o where o.option_key = 'bulk_purchase_id' and o.option_value ~ '^[0-9]+$')");
  if (r.length !== 1) throw new Error("まとめて買取の商品（設定の商品ID）の商品がこの環境に無い");
  return { id: String(r[0].id), 名前: String(r[0].name) };
}

/**
 * 印つきの買取に、まとめて買取の商品（設定の商品。共有の商品は読むだけで書き換えない）の選んで買取の明細を1件足す。
 * 買取検索一覧の買取詳細は、この商品の明細を先頭に出す
 */
export function まとめて買取商品の明細を足す(買取番号: string, 印: string, v: { 査定価格: number; 数量: number; 状態の名: string }): void {
  まとめて買取商品の商品ID();
  一件(writeTestData({
    理由: `まとめて買取の商品の明細（査定価格${v.査定価格}・数量${v.数量}・状態${v.状態の名}）を買取 ${買取番号} に足す`,
    sql: `insert into dtb_buy_main_card (buy_order_id, product_id, language_id, card_condition_id, foil_flg, price, count, sale_flg, purchase_category)
          select b.id, p.id, (select pc.language_id from dtb_product_class pc where pc.product_id = p.id order by pc.id limit 1),
                 (select cc.id from mtb_card_condition cc where cc.code = $4), null, $2::int, $3::int, true, 1
            from dtb_buy_order b join dtb_product p on p.id = (select o.option_value::int from mtb_option o where o.option_key = 'bulk_purchase_id')
           where b.id = $1::int`,
    params: [数字(買取番号), v.査定価格, v.数量, 状態(v.状態の名)],
    対象の確かめ: 買取の確かめ, 確かめのparams: [数字(買取番号)], 印, 最大行数: 1,
  }), "まとめて買取の商品の明細");
}

// ---- 参照（書き込みの前後の確かめ・控え） ----

/** 買取の、選んで買取の明細のうち、印つきの商品コードの商品の明細ID */
export function 選んで買取の明細ID(買取番号: string, 商品コード: string): string {
  const r = query(
    `select c.id from dtb_buy_main_card c where c.buy_order_id = $1::int and c.purchase_category = 1
        and c.product_id = (select pc.product_id from dtb_product_class pc where pc.product_code = $2) order by c.id`,
    [数字(買取番号), 商品コード],
  );
  if (r.length !== 1) throw new Error(`買取 ${買取番号} の選んで買取に ${商品コード} の明細が ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}
