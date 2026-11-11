/**
 * M12-06 入荷通知依頼 CSV出力 のケースが使う DB 書き込み。
 * 依頼日時・削除日時・商品単位の依頼を足す部分は db/m12_05.ts と同じものを使う（seeds/m12-05-requests.ts の作り方）。
 * ここに足したのは、ケース IT-M12-06-009 の手順4「DBで商品の商品名を更新する」だけ。
 *
 * 守ること:
 *  - 書き換えるのは、実行の印つきの商品名の商品（画面で作った商品）の商品名だけ。対象の確かめの行は、どれも印を含む。
 *  - 書く経路は db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口）だけ。物理名はこのファイルの SQL の中にだけ書く。
 */
import { RUN_MARK } from "../lib/run_marker";
import { writeTestData } from "./write_adapter";

/** 商品の商品名を更新する（実行の印つきの商品名の商品だけ） */
export function 商品名を更新する(商品ID: string, 新しい商品名: string): number {
  return writeTestData({
    理由: "入荷通知依頼 CSV出力のケースの手順4: 検索後に商品名を更新して、CSV抽出時の対象を0件にする",
    sql: `update dtb_product set name = $1::text where id = $2::int`,
    params: [新しい商品名, 商品ID],
    対象の確かめ: `select id, upper(name) as 商品名 from dtb_product where id = $1::int`,
    確かめのparams: [商品ID],
    印: RUN_MARK.toUpperCase(),
    最大行数: 1,
  });
}
