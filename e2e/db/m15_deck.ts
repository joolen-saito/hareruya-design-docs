/** M15 デッキ管理のDB確認（参照だけ）。画面に出ない保存結果を、業務の言葉の関数名で返す。 */
import { query } from "../lib/db";

/** デッキの最終更新者の名前 */
export function 最終更新者の名前(デッキID: string): string | null {
  const r = query("select m.name as n from dtb_deck d join dtb_member m on m.id = d.member_id where d.id = $1", [デッキID]);
  return r[0]?.n ?? null;
}

/** デッキの文字項目（イベント名・成績・プレイヤー名・引用元URL） */
export function デッキの文字項目(デッキID: string): { イベント名日: string; イベント名英: string; 成績: string; プレイヤー名: string; 引用元URL: string } {
  const r = query("select coalesce(event_name_jp,'') as a, coalesce(event_name_en,'') as b, coalesce(result,'') as c, coalesce(player_name,'') as d, coalesce(source_url,'') as e from dtb_deck where id = $1", [デッキID]);
  if (r.length !== 1) throw new Error(`デッキID ${デッキID} が1件に決まらない（${r.length}件）`);
  return { イベント名日: r[0].a!, イベント名英: r[0].b!, 成績: r[0].c!, プレイヤー名: r[0].d!, 引用元URL: r[0].e! };
}

/** メインボード（ボード番号1）のカードリスト（カード名(英)と枚数。明細の順） */
export function メインボードのカード(デッキID: string): { カード名英: string; 枚数: number }[] {
  return query("select c.name_en as n, dc.count as k from dtb_deck_card dc join mtb_card c on c.id = dc.card_id where dc.deck_id = $1 and dc.board_id = 1 order by dc.id", [デッキID])
    .map((r) => ({ カード名英: r.n!, 枚数: Number(r.k) }));
}
