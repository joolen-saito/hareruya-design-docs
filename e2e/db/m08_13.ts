/** M08-13 ブラックリスト登録/編集/削除のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";

export type 保存されたブラックリスト = { ブラックリストID: string; 項目: string; キーワード: string | null };

const SELECT = `select b.id as "ブラックリストID", g.name as "項目", b.keyword as "キーワード"
  from dtb_blacklist b join mtb_blacklist_tag g on g.id = b.blacklist_tag_id`;

const toRow = (r: Record<string, string | null>): 保存されたブラックリスト => ({ ブラックリストID: r.ブラックリストID ?? "", 項目: r.項目 ?? "", キーワード: r.キーワード });

/** ブラックリストIDのブラックリスト。無ければ null */
export function ブラックリスト(ID: string): 保存されたブラックリスト | null {
  const rows = query(`${SELECT} where b.id = $1::int`, [ID]);
  return rows.length ? toRow(rows[0]) : null;
}

/** キーワードが一致するブラックリスト（項目を問わない。ブラックリストIDの順） */
export function キーワードのブラックリスト(キーワード: string): 保存されたブラックリスト[] {
  return query(`${SELECT} where b.keyword = $1 order by b.id`, [キーワード]).map(toRow);
}

/** キーワードに文字列（実行の印など）を含むブラックリスト（ブラックリストIDの順）。このケースが作った行だけを数えるのに使う */
export function キーワードに含むブラックリスト(含む文字列: string): 保存されたブラックリスト[] {
  return query(`${SELECT} where strpos(b.keyword, $1) > 0 order by b.id`, [含む文字列]).map(toRow);
}

/**
 * このケースの行: ブラックリストIDが「最初のID」以降で、キーワードに「含む」の文字列をすべて含む行と、キーワードが空の行（ブラックリストIDの順）。
 * 正本の「ブラックリストがN件のまま」を、ほかの方の行を数えずに確かめる（空の行は、空欄の新規登録行が誤って足された場合に数えるため）。
 */
export function ケースの行(最初のID: string, 含む: string[]): 保存されたブラックリスト[] {
  const cond = 含む.map((_, i) => `strpos(b.keyword, $${i + 2}) > 0`).join(" and ");
  return query(`${SELECT} where b.id >= $1::int and (coalesce(b.keyword, '') = '' or (${cond})) order by b.id`, [最初のID, ...含む]).map(toRow);
}

/**
 * E2E が画面で作ったブラックリストの行のキーワードを、DBで書き換える（画面では作れない値にするシードの手順）。
 * 書き換えるのは、ブラックリストIDの行のうち、キーワードがいま「今のキーワード」（実行の印つき）の行だけ。
 */
export function 自分の行のキーワードを書き換える(what: string, ID: string, 今のキーワード: string, 新しいキーワード: string): void {
  updateOwnRows(what, {
    table: "dtb_blacklist", key: "id", ids: [ID], set: { keyword: 新しいキーワード },
    owner: { sql: `select id from dtb_blacklist where keyword = $1`, params: [今のキーワード] },
  });
}
