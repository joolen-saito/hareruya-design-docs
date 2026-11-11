/**
 * M15-05（デッキ編集）のシードの、画面で作れない部分を DB で整える書き込み（依頼者の承認 2026-11-10「印つきデータは何でも」）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き込みはすべて db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） を通す（1文ずつ・印の確かめ・行数の上限・ログ）。
 *
 * 書く先は、E2E が画面で作った「実行の印つき」のデッキ（デッキ名に実行の印が入っている）と、そのデッキに紐づく行だけ。
 * 印の確かめは、デッキの行（デッキ名）で行う。共有のマスタ・設定・ほかの人のデータには書かない。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";

function 数字(s: string): string {
  if (!/^\d+$/.test(s)) throw new Error(`デッキIDが数字でない（${s}）`);
  return String(Number(s));
}

const デッキの確かめ = "select d.id, d.deck_name from dtb_deck d where d.id = $1::int";

function 一件(n: number, 何: string): void {
  if (n !== 1) throw new Error(`${何}: 書き込んだ行が ${n} 行（1行のはず）`);
}

/** 印つきのデッキの現行フォーマットを真にする（デッキ名は実行の印つき） */
export function 現行フォーマットを真にする(デッキID: string, デッキ名: string): void {
  一件(writeTestData({
    理由: `デッキ ${デッキID} の現行フォーマットを真にする`,
    sql: "update dtb_deck set latest_flg = true where id = $1::int",
    params: [数字(デッキID)],
    対象の確かめ: デッキの確かめ, 確かめのparams: [数字(デッキID)], 印: デッキ名, 最大行数: 1,
  }), "現行フォーマット");
}

/** 印つきのデッキの代表カードを未設定（画像なし）にする */
export function 代表カードを未設定にする(デッキID: string, デッキ名: string): void {
  一件(writeTestData({
    理由: `デッキ ${デッキID} の代表カードを未設定にする`,
    sql: "update dtb_deck set card_image_id = null where id = $1::int",
    params: [数字(デッキID)],
    対象の確かめ: デッキの確かめ, 確かめのparams: [数字(デッキID)], 印: デッキ名, 最大行数: 1,
  }), "代表カード");
}

/**
 * 印つきのデッキに紐づく記事を1件作り、紐づける。記事の表は記事の連携（外部の投稿）が作る行で、投稿ID・種別ID・URL が要る。
 * 投稿IDはデッキIDから決めた大きな番号（実在の投稿とぶつからない）、URL にデッキ名（実行の印つき）を入れて、このE2Eが作った行と分かるようにする。
 * 記事名は表に無い（外部の投稿側の値）ので、設定しない。
 */
export function 記事を紐づける(デッキID: string, デッキ名: string): void {
  const url = `e2e-${デッキ名}`.slice(0, 64);
  一件(writeTestData({
    理由: `デッキ ${デッキID} に紐づける記事を作る`,
    sql: `insert into dtb_article (wp_post_id, wp_type_id, url, update_date, create_date)
          select 900000000 + d.id, coalesce((select min(a.wp_type_id) from dtb_article a), 1), $2, now(), now() from dtb_deck d where d.id = $1::int`,
    params: [数字(デッキID), url],
    対象の確かめ: デッキの確かめ, 確かめのparams: [数字(デッキID)], 印: デッキ名, 最大行数: 1,
  }), "記事");
  一件(writeTestData({
    理由: `デッキ ${デッキID} に記事を紐づける`,
    sql: `insert into dtb_article_deck (article_id, deck_id)
          select a.id, d.id from dtb_deck d join dtb_article a on a.url = $2 and a.wp_post_id = 900000000 + d.id where d.id = $1::int`,
    params: [数字(デッキID), url],
    対象の確かめ: デッキの確かめ, 確かめのparams: [数字(デッキID)], 印: デッキ名, 最大行数: 1,
  }), "記事とデッキの紐づけ");
}

/** 印つきのデッキに「検討中のカード」を1行足す（カードは DeckTestAlpha、枚数1。共有のカードは読むだけ） */
export function 検討中のカードを足す(デッキID: string, デッキ名: string, カード名英: string): void {
  一件(writeTestData({
    理由: `デッキ ${デッキID} に検討中のカード（${カード名英}・1枚）を足す`,
    sql: `insert into dtb_maybe_card (deck_id, card_id, count)
          select d.id, c.id, 1 from dtb_deck d join mtb_card c on c.name_en = $2 where d.id = $1::int order by c.id limit 1`,
    params: [数字(デッキID), カード名英],
    対象の確かめ: デッキの確かめ, 確かめのparams: [数字(デッキID)], 印: デッキ名, 最大行数: 1,
  }), "検討中のカード");
}

// ---- 参照（書き込みの前後の確かめ） ----

/** デッキの現行フォーマット（真偽）と代表カードの有無 */
export function デッキの状態(デッキID: string): { 現行フォーマット: boolean; 代表カードあり: boolean } {
  const r = query("select d.latest_flg as l, d.card_image_id as c from dtb_deck d where d.id = $1::int", [数字(デッキID)]);
  if (r.length !== 1) throw new Error(`デッキ ${デッキID} が ${r.length} 件`);
  return { 現行フォーマット: r[0].l === "true", 代表カードあり: r[0].c !== null };
}
