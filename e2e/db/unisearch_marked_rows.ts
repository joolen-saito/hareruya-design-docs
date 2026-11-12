/**
 * 検索サービスの索引に載せる試験で、画面に入力欄の無い値を、この実行で作った印つきの行にだけ書く（lib/db_write.ts の窓口を通す）。
 * 依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」・PM 指示 2026-11-11（印つきの行なら可）。物理名はこのファイルの SQL の中にだけ書く。
 */
import { RUN_MARK } from "../lib/run_marker";
import { writeTestData } from "./write_adapter";

/** この実行で作ったカードセット（名称に実行の印）のフリーエリア（日）＝表示用HTMLを書く。書いた行数を返す */
export function 印つきのカードセットの表示用HTMLを書く(カードセットID: string, html: string, 理由: string): number {
  return writeTestData({
    理由,
    sql: "update mtb_cardset set free_area_jp = $1 where id = $2",
    params: [html, カードセットID],
    対象の確かめ: "select id, name_jp from mtb_cardset where id = $1",
    確かめのparams: [カードセットID],
    印: RUN_MARK,
    最大行数: 1,
  });
}

/** この実行で作った商品（商品名に実行の印）の商品名（日）を書き換える。書いた行数を返す */
export function 印つきの商品の商品名を書き換える(商品ID: string, 新しい商品名: string, 理由: string): number {
  return writeTestData({
    理由,
    sql: "update dtb_product set name = $1 where id = $2",
    params: [新しい商品名, 商品ID],
    対象の確かめ: "select id, name, (select min(product_code) from dtb_product_class where product_id = $1) as code from dtb_product where id = $1",
    確かめのparams: [商品ID],
    印: RUN_MARK,
    最大行数: 1,
  });
}
