/**
 * A15-03 ユーザー情報参照（デッキビルダーの API）の、E2E が作った選手への書き足し
 * （依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」）。物理名はこのファイルの SQL の中にだけ書く。
 * 書き足しは lib/db_write.ts を通し、持ち主（実行の印つきの試験会員のメールアドレスの選手）を確かめてから書く。
 */
import { Owner, updateOwnRows } from "../lib/db_write";

/** 選手の行が、実行の印つきの試験会員（@example.test）のものか */
const 選手の持ち主 = (選手ID: string, メール: string): Owner => ({
  sql: `select p.id from dtb_player p join dtb_customer c on c.id = p.customer_id
         where p.id = $1::int and c.email = $2 and c.email like '%@example.test'`,
  params: [選手ID, メール],
});

export type A1503の値 = {
  /** null は未設定 */
  ニックネーム: string | null;
  プロフィール: string | null;
  /** 8文字まで。null は未設定 */
  デッキユーザーID: string | null;
};

/** E2E の試験会員の選手に、画面で指定できない値（ニックネーム・プロフィール・デッキユーザーID）を書く */
export function A1503選手に書く(what: string, 選手ID: string, メール: string, v: A1503の値): void {
  if (v.デッキユーザーID !== null && v.デッキユーザーID.length > 8) throw new Error(`${what}: デッキユーザーID「${v.デッキユーザーID}」が8文字を超える`);
  updateOwnRows(what, {
    table: "dtb_player", key: "id", ids: [選手ID],
    set: { nickname: v.ニックネーム, profile: v.プロフィール, deck_user_id: v.デッキユーザーID },
    owner: 選手の持ち主(選手ID, メール),
  });
}
