/**
 * M15-01（デッキ検索・一覧）のシードの、画面で作れない部分を DB で整える書き込み（依頼者の承認 2026-11-10「印つきデータは何でも」）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き込みはすべて db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） を通す。
 * 書く先は、E2E が画面で作った「実行の印つき」のデッキ（デッキ名に実行の印が入っている）の行だけ。共有のマスタ・設定・ほかの人のデータには書かない。
 */
import { writeTestData } from "./write_adapter";

/** 印つきのデッキのアーキタイプを未設定にする（デッキ登録画面ではアーキタイプが必須のため、画面では作れない） */
export function アーキタイプを未設定にする(デッキID: string, デッキ名: string): void {
  if (!/^\d+$/.test(デッキID)) throw new Error(`デッキIDが数字でない（${デッキID}）`);
  const n = writeTestData({
    理由: `デッキ ${デッキID} のアーキタイプを未設定にする`,
    sql: "update dtb_deck set archetype_id = null where id = $1::int",
    params: [Number(デッキID)],
    対象の確かめ: "select d.id, d.deck_name from dtb_deck d where d.id = $1::int",
    確かめのparams: [Number(デッキID)],
    印: デッキ名,
    最大行数: 1,
  });
  if (n !== 1) throw new Error(`アーキタイプの未設定: 書き込んだ行が ${n} 行（1行のはず）`);
}
