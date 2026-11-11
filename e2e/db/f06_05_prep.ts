/**
 * F06-05 マイページのシードの、画面で作れない部分を DB で整える書き込み（依頼者の承認 2026-11-10「印つきデータは何でも」）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き込みは db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） を通す（1文・印の確かめ・行数の上限・ログ）。
 * 書く先は、E2E が画面で作った「実行の印つき」の会員（メールアドレスに実行の印が入っている）だけ。
 */
import { writeTestData } from "./write_adapter";

/** 実行の印つきの会員の保有ポイントを書き換える（ポイント付与の画面は履歴と同時に残高を増減するため、履歴と合わない残高は画面で作れない） */
export function 保有ポイントを設定する(会員ID: string, ポイント: number, 印: string): void {
  if (!/^\d+$/.test(会員ID)) throw new Error(`会員IDが数字でない（${会員ID}）`);
  if (!Number.isInteger(ポイント) || ポイント < 0) throw new Error(`ポイントは0以上の整数（${ポイント}）`);
  const n = writeTestData({
    理由: `会員ID ${会員ID} の保有ポイントを ${ポイント} に設定する`,
    sql: "update dtb_player set point = $2::int where customer_id = $1::int and deleted_at is null",
    params: [会員ID, ポイント],
    対象の確かめ: "select p.id, c.email from dtb_player p join dtb_customer c on c.id = p.customer_id where c.id = $1::int and p.deleted_at is null",
    確かめのparams: [会員ID], 印, 最大行数: 1,
  });
  if (n !== 1) throw new Error(`保有ポイントを書き換えた行が ${n} 行（1行のはず）`);
}
