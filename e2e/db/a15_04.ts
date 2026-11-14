/**
 * A15-04 他ユーザー情報参照（デッキビルダーの API）の DB の参照と、E2E が作った行への書き足し
 * （依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」）。物理名はこのファイルの SQL の中にだけ書く。
 * 書き足しは lib/db_write.ts を通し、持ち主（実行の印つきの試験会員のメールアドレスの選手）を確かめてから書く。
 */
import { query } from "../lib/db";
import { Owner, updateOwnRows } from "../lib/db_write";

const 真 = (v: unknown): boolean => v === true || v === "t" || v === "true";

/** 選手の行が、実行の印つきの試験会員（@example.test）のものか */
const 選手の持ち主 = (選手ID: string, メール: string): Owner => ({
  sql: `select p.id from dtb_player p join dtb_customer c on c.id = p.customer_id
         where p.id = $1::int and c.email = $2 and c.email like '%@example.test'`,
  params: [選手ID, メール],
});

export type 選手 = {
  選手ID: string; 会員ID: string; デッキユーザーID: string;
  ニックネーム: string | null; プロフィール: string | null;
  /** 日本時間の「YYYY-MM-DD HH24:MI:SS」 */
  更新日時: string;
};

/** 会員のメールアドレスの、削除されていない選手（無ければ null。2件以上なら投げる） */
export function 会員の選手(メール: string): 選手 | null {
  const r = query(
    `select p.id::text as id, c.id::text as cid, coalesce(p.deck_user_id, '') as duid,
            p.nickname is null as nick_null, coalesce(p.nickname, '') as nick,
            p.profile is null as prof_null, coalesce(p.profile, '') as prof,
            to_char(p.update_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI:SS') as upd
       from dtb_player p join dtb_customer c on c.id = p.customer_id
      where c.email = $1 and p.deleted_at is null order by p.id`,
    [メール]);
  if (r.length === 0) return null;
  if (r.length > 1) throw new Error(`会員 ${メール} の選手が ${r.length} 件（1件のはず）`);
  const x = r[0];
  return {
    選手ID: String(x.id), 会員ID: String(x.cid), デッキユーザーID: String(x.duid),
    ニックネーム: 真(x.nick_null) ? null : String(x.nick),
    プロフィール: 真(x.prof_null) ? null : String(x.prof),
    更新日時: String(x.upd),
  };
}

/** 選手番号の選手（削除されていないもの。無ければ null） */
export function 選手を読む(選手ID: string): Omit<選手, "会員ID"> | null {
  const r = query(
    `select p.id::text as id, coalesce(p.deck_user_id, '') as duid,
            p.nickname is null as nick_null, coalesce(p.nickname, '') as nick,
            p.profile is null as prof_null, coalesce(p.profile, '') as prof,
            to_char(p.update_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI:SS') as upd
       from dtb_player p where p.id = $1::int and p.deleted_at is null`,
    [選手ID]);
  if (r.length === 0) return null;
  const x = r[0];
  return {
    選手ID: String(x.id), デッキユーザーID: String(x.duid),
    ニックネーム: 真(x.nick_null) ? null : String(x.nick),
    プロフィール: 真(x.prof_null) ? null : String(x.prof),
    更新日時: String(x.upd),
  };
}

/** デッキユーザーIDが一致する選手の件数（削除済みも数える） */
export function デッキユーザーIDの選手の数(デッキユーザーID: string): number {
  return Number(query(`select count(*)::text as n from dtb_player where deck_user_id = $1`, [デッキユーザーID])[0]?.n ?? "0");
}

export type 選手に書く値 = {
  ニックネーム?: string | null; プロフィール?: string | null;
  /** ポイント残高 */
  ポイント?: number;
  /** DCIナンバー */
  DCI?: string;
  /** 日本時間の「YYYY-MM-DD HH24:MI:SS」 */
  更新日時?: string;
};

/** E2E の試験会員の選手に、画面で指定できない値（ニックネーム・プロフィール・ポイント残高・DCIナンバー・更新日時）を書く */
export function 選手に書く(what: string, 選手ID: string, メール: string, v: 選手に書く値): void {
  const set: Record<string, string | number | null> = {};
  if (v.ニックネーム !== undefined) set.nickname = v.ニックネーム;
  if (v.プロフィール !== undefined) set.profile = v.プロフィール;
  if (v.ポイント !== undefined) set.point = v.ポイント;
  if (v.DCI !== undefined) set.dci_no = v.DCI;
  if (v.更新日時 !== undefined) set.update_date = `${v.更新日時}+09`;
  if (Object.keys(set).length === 0) return;
  updateOwnRows(what, { table: "dtb_player", key: "id", ids: [選手ID], set, owner: 選手の持ち主(選手ID, メール) });
}
