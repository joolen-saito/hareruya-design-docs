/**
 * A14-01（カードIDからカード情報を取得）の 004・005・008・012・020 のための DB の参照と、画面で作れない行の足し込み（-r。2026-11-25）。
 * 書くのは、この実行で作ったカード・カード詳細（カード名が実行の印で終わる）にぶら下がる行と、実行の印を入れて足す親の行だけ（lib/db_write.ts）。
 * 物理名はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";
import { Owner, insertMarkedRows, insertOwnRows, updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

const 自分のカード = (): Owner => ({ sql: "select id from mtb_card where name_jp like '%-' || $1 or name_en like '%-' || $1", params: [RUN_MARK] });
const 自分のカード詳細 = (): Owner => ({
  sql: "select d.id from mtb_card_detail d join mtb_card c on c.id = d.card_id where c.name_jp like '%-' || $1 or c.name_en like '%-' || $1", params: [RUN_MARK],
});
const 自分のデッキ = (): Owner => ({ sql: "select id from dtb_deck where deck_name like '%-' || $1", params: [RUN_MARK] });

type 行 = Record<string, string | null>;

// ---- 書き足し ----

/** カード詳細の裏面カード詳細ID（画面にも入力欄があるが、作った後に別の E2E のカード詳細へ向け直すのに使う） */
export function 裏面を書く(what: string, カード詳細ID: string, 裏面ID: string): void {
  updateOwnRows(what, { table: "mtb_card_detail", key: "id", ids: [カード詳細ID], set: { back_card_detail_id: 裏面ID }, owner: 自分のカード詳細() });
}

export type 画像の定め = { url: string; 裏面: boolean; 言語ID: string; 作成日時: string };
/** E2E のカード詳細にカード画像の行を足す（画面にはカード画像の行を足す手段が無い） */
export function カード画像を足す(what: string, カード詳細ID: string, 画像: 画像の定め[]): void {
  insertOwnRows(what, {
    table: "mtb_card_image", parentColumn: "card_detail_id", owner: 自分のカード詳細(),
    rows: 画像.map((g) => ({ card_detail_id: カード詳細ID, language_id: g.言語ID, back_flg: g.裏面, url: g.url, create_date: g.作成日時 })),
  });
}

/** 言語コードの言語ID（無ければ止める） */
export function 言語ID(コード: string): string {
  const r = query(`select id::text as id from mtb_language where code = $1 order by id`, [コード]);
  if (r.length !== 1) throw new Error(`言語コード「${コード}」の言語が ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}

export function カード画像の行(カード詳細ID: string): { id: string; back_flg: string; url: string; create_date: string; language_id: string }[] {
  return query(`select id::text as id, back_flg::text as back_flg, url, to_char(create_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI') as create_date, language_id::text as language_id
    from mtb_card_image where card_detail_id = $1::int order by id`, [カード詳細ID]) as never;
}

export function カードが無い(カードID: string): boolean {
  return query(`select 1 from mtb_card where id = $1::int`, [カードID]).length === 0;
}

export type 関連の控え = { タグ名: string; 能力名: string; 記事URL: string; デッキ名: string; タグID: string; 能力ID: string; 記事ID: string; デッキID: string };
/** E2E のカードに、カードタグ・キーワード能力・記事・デッキ（デッキ収録カード）を関連付ける。親の行は実行の印を入れて足す */
export function 応答に含めない関連を足す(what: string, カードID: string, 番号: string): 関連の控え {
  const タグ名 = `除外確認タグ-${番号}-${RUN_MARK}`;
  const 能力名 = `除外確認能力-${番号}-${RUN_MARK}`;
  // 記事の URL の列は64文字まで。正本の「…/a14-01-<番号>/article」に実行の印を足すと超えるので、末尾の「article」を印に置き換える（応答に含めないことを確かめる行なので、URL の値は期待結果に関わらない）
  const 記事URL = `https://replace-dev.hareruyamtg.com:8443/a14-01-${番号}/${RUN_MARK}`;
  if (記事URL.length > 64) throw new Error(`${what}: 記事の URL「${記事URL}」が64文字を超える（列の長さ）`);
  const デッキ名 = `除外確認デッキ-${番号}-${RUN_MARK}`;
  const 今 = new Date().toISOString();
  const [タグID] = insertMarkedRows(`${what}: カードタグ`, { table: "dtb_cardtag", key: "id", markColumn: "name_en", rows: [{ name_jp: タグ名, name_en: `Excluded Tag-${番号}-${RUN_MARK}` }] });
  insertOwnRows(`${what}: カードとカードタグの紐づけ`, { table: "dtb_card_cardtag", parentColumn: "card_id", owner: 自分のカード(), rows: [{ card_id: カードID, cardtag_id: タグID }] });
  const [能力ID] = insertMarkedRows(`${what}: キーワード能力`, { table: "mtb_keyword_ability", key: "id", markColumn: "name_en", rows: [{ name_jp: 能力名, name_en: `Excluded Ability-${番号}-${RUN_MARK}` }] });
  insertOwnRows(`${what}: カードとキーワード能力の紐づけ`, { table: "dtb_card_keyword_ability", parentColumn: "card_id", owner: 自分のカード(), rows: [{ card_id: カードID, keyword_ability_id: 能力ID }] });
  // 記事の外部投稿ID は本物の記事（1401〜1421 ほか）とぶつからない大きな値にする
  const 投稿ID = String(1_000_000_000 + (Date.now() % 900_000_000));
  const [記事ID] = insertMarkedRows(`${what}: 記事`, { table: "dtb_article", key: "id", markColumn: "url", rows: [{ wp_post_id: 投稿ID, wp_type_id: 1, url: 記事URL, update_date: 今, create_date: 今 }] });
  insertOwnRows(`${what}: カードと記事の紐づけ`, { table: "dtb_article_card", parentColumn: "card_id", owner: 自分のカード(), rows: [{ card_id: カードID, article_id: 記事ID }] });
  const [デッキID] = insertMarkedRows(`${what}: デッキ`, { table: "dtb_deck", key: "id", markColumn: "deck_name", rows: [{ disp_id: 1, deck_type_id: 1, deck_name: デッキ名, update_date: 今, create_date: 今 }] });
  insertOwnRows(`${what}: デッキ収録カード`, { table: "dtb_deck_card", parentColumn: "deck_id", owner: 自分のデッキ(), rows: [{ deck_id: デッキID, card_id: カードID, board_id: 1, count: 1 }] });
  return { タグ名, 能力名, 記事URL, デッキ名, タグID, 能力ID, 記事ID, デッキID };
}

export function 関連の件数(カードID: string): Record<string, number> {
  const n = (sql: string) => Number(query(sql, [カードID])[0]?.n ?? 0);
  return {
    カードタグ: n("select count(*)::int as n from dtb_card_cardtag where card_id = $1::int"),
    キーワード能力: n("select count(*)::int as n from dtb_card_keyword_ability where card_id = $1::int"),
    記事: n("select count(*)::int as n from dtb_article_card where card_id = $1::int"),
    デッキ収録カード: n("select count(*)::int as n from dtb_deck_card where card_id = $1::int"),
  };
}
export type { 行 };
