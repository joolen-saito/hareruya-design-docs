/**
 * M11-02 メンバー管理の DB 確認（参照）と、E2E が作ったメンバーの行への書き足し（lib/db_write.ts を通す）。
 * 物理名はこのファイルの SQL の中にだけ書く。
 */
import { query, count } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

export type メンバーの行 = {
  ID: string; 名前: string; ログインID: string; メール: string; パスワード: string; 所属: string; 権限: string; 所属店舗: string;
  デフォルト検索表示店舗: string; 稼働: string; 二段階認証: boolean; 自動ログアウト: boolean; スマレジ用アカウント: boolean; 表示順: number;
};

const 列 = `m.id, m.name, m.login_id, m.email, m.password, coalesce(d.name, '') as dep, coalesce(a.name, '') as auth,
  coalesce(m.base_info_id::text, '') as shop, coalesce(m.default_search_base_info_id::text, '') as def_shop,
  coalesce(w.name, '') as work, m.two_factor_auth_enabled as tfa, m.is_auto_logout as auto, m.smaregi_member_flg as smaregi, m.sort_no as sort`;
const 結合 = `from dtb_member m left join mtb_department d on d.id = m.department_id left join mtb_authority a on a.id = m.authority_id
  left join mtb_work w on w.id = m.work_id`;
const 行へ = (r: Record<string, string | null>): メンバーの行 => ({
  ID: r.id ?? "", 名前: r.name ?? "", ログインID: r.login_id ?? "", メール: r.email ?? "", パスワード: r.password ?? "", 所属: r.dep ?? "",
  権限: r.auth ?? "", 所属店舗: r.shop ?? "", デフォルト検索表示店舗: r.def_shop ?? "", 稼働: r.work ?? "",
  二段階認証: r.tfa === "true", 自動ログアウト: r.auto === "true", スマレジ用アカウント: r.smaregi === "true", 表示順: Number(r.sort),
});

/** ログインIDのメンバー（いなければ空の配列） */
export function ログインIDのメンバー(ログインID: string): メンバーの行[] {
  return query(`select ${列} ${結合} where m.login_id = $1 order by m.id`, [ログインID]).map(行へ);
}
/** メンバーIDのメンバー（いなければ null） */
export function メンバーIDのメンバー(ID: string): メンバーの行 | null {
  const r = query(`select ${列} ${結合} where m.id = $1`, [ID]);
  return r.length ? 行へ(r[0]) : null;
}
/** メンバーの編集可能店舗（店舗IDの昇順） */
export function 編集可能店舗(ID: string): string[] {
  return query(`select base_info_id as s from dtb_member_base_info where member_id = $1 order by base_info_id`, [ID]).map((r) => String(r.s));
}
/** メンバーの件数（全員） */
export function メンバーの件数(): number { return count(`select id from dtb_member`); }
/** メンバーIDの行があるか */
export function メンバーIDがあるか(ID: string): boolean { return count(`select id from dtb_member where id = $1`, [ID]) > 0; }

/** 店名がちょうど一致する店舗のうち、いちばん小さい店舗ID（開発環境には同じ店名の店舗が複数ある） */
export function 店名の店舗ID(店名: string): string | null {
  const r = query(`select id from dtb_base_info where shop_name = $1 order by id limit 1`, [店名]);
  return r.length ? String(r[0].id) : null;
}

/** 権限・稼働・店舗のマスタの登録内容（変わっていないかを比べるための文字列） */
export function マスタの登録内容(): { 権限: string; 稼働: string; 店舗: string } {
  const j = (sql: string) => query(sql).map((r) => JSON.stringify(r)).join("\n");
  return {
    権限: j(`select id, name, sort_no from mtb_authority order by id`),
    稼働: j(`select id, name, sort_no from mtb_work order by id`),
    店舗: j(`select id, shop_name, update_date from dtb_base_info order by id`),
  };
}

/** E2E が作ったメンバー（ログインIDかメールアドレスに、この実行の印を含む） */
const メンバーの持ち主 = { sql: `select id from dtb_member where lower(login_id) like '%' || lower($1) || '%' or lower(email) like '%' || lower($1) || '%'`, params: [RUN_MARK] };

/** E2E が作ったメンバーの表示順を指定の値にする（画面で指定できない） */
export function 表示順にする(what: string, ID: string, 表示順: number): void {
  updateOwnRows(what, { table: "dtb_member", key: "id", ids: [ID], set: { sort_no: 表示順 }, owner: メンバーの持ち主 });
}
