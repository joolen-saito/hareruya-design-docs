/**
 * F09-07 デッキリスト書き出し の DB での準備・確認。物理名はこのファイルの SQL の中だけに書く。
 *
 * - 書き込み（準備）は db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを使う。対象は「画面で登録した、実行の印つきのデッキの採用カード」だけ
 *   （カード名に実行の印が入っているカード。対象の確かめで、印を含まない行があれば書かない）。
 * - 確認は参照（SELECT）だけ。
 */
import { writeTestData } from "./write_adapter";
import { query } from "../lib/db";
import { RUN_MARK } from "../lib/run_marker";

/** 「メインボード・サイドボード・統率者以外の配置」を表すボード（採用候補のボード）の番号 */
const 他の配置のボード = 4;

/**
 * 画面（デッキ編集のメイン・サイド・統率の入力欄）で登録した印つきのデッキの採用カードを、メイン・サイド・統率者以外の配置にする。
 * 画面からはこの配置の採用カードを指定できないため。
 */
export function 採用カードを他の配置にする(デッキID: string, カード名英: string): number {
  if (!カード名英.includes(RUN_MARK)) throw new Error(`カード名「${カード名英}」に実行の印が無い（共有のカードには書かない）`);
  return writeTestData({
    理由: `デッキ（ID ${デッキID}）の採用カード「${カード名英}」を、メイン・サイド・統率者以外の配置にする（画面で指定できない配置）`,
    sql: "update dtb_deck_card set board_id = $3::int where deck_id = $1::int and card_id = (select id from mtb_card where name_en = $2)",
    params: [デッキID, カード名英, 他の配置のボード],
    対象の確かめ: "select dc.id, c.name_en from dtb_deck_card dc join mtb_card c on c.id = dc.card_id where dc.deck_id = $1::int and c.name_en = $2",
    確かめのparams: [デッキID, カード名英],
    印: カード名英,
    最大行数: 1,
  });
}

export type デッキの状態 = {
  /** 今回の実行の印が付いたアーキタイプのデッキの件数（書き出しの要求をしても増えない・減らないことの確かめ用） */
  印つきのデッキ件数: number;
  /** このデッキの更新日時（日本時間・秒の小数まで） */
  更新日時: string;
  /** 採用カードの件数 */
  採用カードの件数: number;
  /** 採用カードの枚数（ボード・カードの順） */
  採用カードの枚数: number[];
};

/** デッキの状態（参照だけ）。デッキ件数は共有のデータ全体ではなく、今回の実行の印が付いたアーキタイプのデッキで数える */
export function デッキの状態を読む(デッキID: string): デッキの状態 {
  const d = query(
    `select (select count(*) from dtb_deck x join dtb_archetype a on a.id = x.archetype_id where x.deleted_at is null and a.name_en like $2) as n,
            (select to_char(update_date at time zone 'Asia/Tokyo', 'YYYY/MM/DD HH24:MI:SS.US') from dtb_deck where id = $1::int) as t`,
    [デッキID, `%-${RUN_MARK}-%`],
  )[0];
  const cards = query(
    'select "count" as c from dtb_deck_card where deck_id = $1::int order by board_id, id',
    [デッキID],
  );
  return { 印つきのデッキ件数: Number(d.n), 更新日時: d.t ?? "", 採用カードの件数: cards.length, 採用カードの枚数: cards.map((r) => Number(r.c)) };
}
