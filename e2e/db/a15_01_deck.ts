/**
 * A15-01 ログインの「以降の認可」（デッキ情報参照）のケースで使う、E2E が作ったデッキの参照と書き足し
 * （依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」）。物理名はこのファイルの SQL の中にだけ書く。
 * 書き足しは lib/db_write.ts を通し、持ち主（デッキの選手が、実行の印つきの試験会員のもの）を確かめてから書く。
 */
import { query } from "../lib/db";
import { Owner, updateOwnRows } from "../lib/db_write";

/** デッキの行が、メールアドレス（@example.test の試験会員）の会員の選手のものか */
const デッキの持ち主 = (デッキID: string, メール: string): Owner => ({
  sql: `select d.id from dtb_deck d join dtb_player p on p.id = d.player_id join dtb_customer c on c.id = p.customer_id
         where d.id = $1::int and c.email = $2 and c.email like '%@example.test'`,
  params: [デッキID, メール],
});

export type A1501デッキ = { デッキ名: string; 選手ID: string; 公開範囲: string; 種別: string };

/** デッキの名前・持ち主の選手・公開範囲の名前・デッキ種別の名前（読むだけ。無ければ null） */
export function A1501デッキを読む(デッキID: string): A1501デッキ | null {
  const r = query(
    `select d.deck_name as name, coalesce(d.player_id::text, '') as pid, coalesce(s.name, '') as disp, coalesce(t.name, '') as type
       from dtb_deck d left join mtb_disp s on s.id = d.disp_id left join mtb_deck_type t on t.id = d.deck_type_id
      where d.id = $1::int and d.deleted_at is null`,
    [デッキID]);
  if (r.length === 0) return null;
  return { デッキ名: String(r[0].name), 選手ID: String(r[0].pid), 公開範囲: String(r[0].disp), 種別: String(r[0].type) };
}

/** E2E の試験会員のデッキに、画面で指定できない限定公開の閲覧用トークンを書く */
export function A1501閲覧用トークンを書く(what: string, デッキID: string, 持ち主のメール: string, 値: string): void {
  updateOwnRows(what, { table: "dtb_deck", key: "id", ids: [デッキID], set: { display_token: 値 }, owner: デッキの持ち主(デッキID, 持ち主のメール) });
}
