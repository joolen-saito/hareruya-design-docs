/**
 * F06-16 大会デッキ登録編集のシードが、画面で作った「実行の印つき」のデータに足す DB 書き込み。
 * 依頼者の承認（2026-11-10「印つきデータは何でも」）の範囲で、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通して書く。
 *
 * 守ること:
 *  - 書き換えるのは、この実行の印を含むメールアドレスの会員の、選手・デッキだけ（対象の確かめが印を含まない行を返せば writeTestData が止める）。
 *  - マスタ（カード・フォーマットなど）・ほかの人のデータは書き換えない。
 *  - 物理名はこのファイルの SQL の中にだけ書く。
 *
 * 理由:
 *  - 大会デッキのカード情報: 内容テキストのカード名が現行カード情報に無いと、画面から提出してもカード情報は作られない（画面で指定できない）。
 *  - マイデッキの作成日・更新日: 管理画面のデッキ登録では指定できない（登録した日時になる）。
 *  - 会員に紐づく選手情報を無くす: 会員を登録すると選手情報が同時に作られ、画面から外せない。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";

const 印 = RUN_MARK.toUpperCase();

/** デッキの持ち主（選手→会員）のメールアドレスに、この実行の印が入っていることの確かめ */
function デッキの確かめ(デッキID: string): { 対象の確かめ: string; 確かめのparams: (string | number)[]; 印: string } {
  return {
    対象の確かめ: `select d.id as デッキID, upper(c.email) as メール
        from dtb_deck d join dtb_player p on p.id = d.player_id join dtb_customer c on c.id = p.customer_id
       where d.id = $1::int and upper(c.email) like $2`,
    確かめのparams: [デッキID, `%${印}%`],
    印,
  };
}

export type 旧カード = { ボード: "メイン" | "サイド"; 枚数: number; カード名英: string };

/**
 * 大会デッキに、カード情報（デッキを構成するカード）を足す。カードは、名前（英）で現行カード情報から探す（足したカードの名前は実行の印つき）。
 * カード情報の番号は画面・DBが振る（シード表の固定の番号は使わない）。
 */
export function 旧カード情報を足す(デッキID: string, 行一覧: 旧カード[]): void {
  for (const r of 行一覧) {
    const n = Number(query(`select count(*) as n from mtb_card where name_en = $1`, [r.カード名英])[0].n);
    if (n < 1) throw new Error(`カード情報に使うカード「${r.カード名英}」が現行カード情報に無い`);
  }
  const params: (string | number)[] = [デッキID];
  const rows = 行一覧.map((r, i) => {
    params.push(r.カード名英, r.枚数, r.ボード === "メイン" ? 1 : 2);
    const k = 2 + i * 3;
    return `(${i + 1}, $${k}::text, $${k + 1}::int, $${k + 2}::int)`;
  });
  const 足した = writeTestData({
    理由: `大会デッキ ${デッキID} にカード情報を ${行一覧.length} 件足す`,
    sql: `insert into dtb_deck_card (count, deck_id, card_id, board_id)
          select v.k, d.id, (select c.id from mtb_card c where c.name_en = v.n order by c.id limit 1), v.b
            from dtb_deck d cross join (values ${rows.join(", ")}) as v(o, n, k, b)
           where d.id = $1::int order by v.o`,
    params, ...デッキの確かめ(デッキID), 最大行数: 行一覧.length,
  });
  if (足した !== 行一覧.length) throw new Error(`大会デッキ ${デッキID} のカード情報を ${行一覧.length} 件足すはずが ${足した} 件だった`);
}

/** 日時（2026-08-03 10:00）を、日本時間の値にする */
function 日本時間(s: string): string {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s)) throw new Error(`日時の形が違う: ${s}`);
  return `${s}:00+09:00`;
}

/** マイデッキの作成日（と、渡したときは更新日）を書き換える */
export function マイデッキの日時を設定する(デッキID: string, v: { 作成: string; 更新?: string }): void {
  const 足した = v.更新
    ? writeTestData({
      理由: `マイデッキ ${デッキID} の作成日・更新日を設定する`,
      sql: `update dtb_deck set create_date = $2::timestamptz, update_date = $3::timestamptz where id = $1::int`,
      params: [デッキID, 日本時間(v.作成), 日本時間(v.更新)], ...デッキの確かめ(デッキID), 最大行数: 1,
    })
    : writeTestData({
      理由: `マイデッキ ${デッキID} の作成日を設定する`,
      sql: `update dtb_deck set create_date = $2::timestamptz where id = $1::int`,
      params: [デッキID, 日本時間(v.作成)], ...デッキの確かめ(デッキID), 最大行数: 1,
    });
  if (足した !== 1) throw new Error(`マイデッキ ${デッキID} の日時を書き換えた行が ${足した} 件だった`);
}

/** 会員に紐づく選手情報を無くす（選手情報の行は残し、会員との紐づけだけを外す）。実行の印つきの会員だけ */
export function 選手情報を会員から外す(会員ID: string): void {
  const 外した = writeTestData({
    理由: `会員 ${会員ID} に紐づく選手情報を無くす`,
    sql: `update dtb_player set customer_id = null where customer_id = $1::int`,
    params: [会員ID],
    対象の確かめ: `select p.id as 選手ID, upper(c.email) as メール
        from dtb_player p join dtb_customer c on c.id = p.customer_id
       where c.id = $1::int and upper(c.email) like $2`,
    確かめのparams: [会員ID, `%${印}%`],
    印, 最大行数: 1,
  });
  if (外した !== 1) throw new Error(`会員 ${会員ID} の選手情報の紐づけを外した行が ${外した} 件だった`);
}
