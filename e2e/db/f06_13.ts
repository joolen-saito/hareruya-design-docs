/** F06-13 オンライン本人確認のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

const s = (v: string | null): string => v ?? "";

export type 身分証 = { ID: string; 名前: string; 選択可: boolean };

/** 申請できる身分証明書の一覧（IDの順） */
export function 身分証明書マスタ(): 身分証[] {
  return query("select id, name, visible from mtb_identification order by id").map((r) => ({ ID: s(r.id), 名前: s(r.name), 選択可: r.visible === "true" }));
}

export type 選手の本人確認 = { 選手ID: string; 身分証種別: string; 本人確認ステータス: string };

/** 会員（メールアドレス）の選手の、身分証種別と本人確認ステータス。選手が無ければ null */
export function 選手の本人確認(メール: string): 選手の本人確認 | null {
  const r = query(
    `select p.id, i.name as iname, st.name_jp as sname
       from dtb_player p join dtb_customer c on c.id = p.customer_id join mtb_identity_confirm_status st on st.id = p.identity_confirm_status_id
       left join mtb_identification i on i.id = p.identification_id
      where c.email = $1 and p.deleted_at is null`, [メール],
  )[0];
  return r ? { 選手ID: s(r.id), 身分証種別: r.iname === null ? "未設定" : s(r.iname), 本人確認ステータス: s(r.sname) } : null;
}

export type 身分証画像 = { 選手ID: string; 身分証種別: string; 画像種別ID: string; 画像種別: string; 保存先: string; 作成日時ミリ秒: number | null };

/** 会員（メールアドレス）の選手に紐づく身分証画像の記録（画像種別の順） */
export function 身分証画像の記録(メール: string): 身分証画像[] {
  return query(
    `select g.player_id, i.name as iname, g.identification_image_type_id as tid, t.name as tname, g.url,
            extract(epoch from g.create_date) * 1000 as created_ms
       from dtb_identification_image g join dtb_player p on p.id = g.player_id join dtb_customer c on c.id = p.customer_id
       join mtb_identification i on i.id = g.identification_id join mtb_identification_image_type t on t.id = g.identification_image_type_id
      where c.email = $1 order by g.identification_image_type_id, g.id`, [メール],
  ).map((r) => ({
    選手ID: s(r.player_id), 身分証種別: s(r.iname), 画像種別ID: s(r.tid), 画像種別: s(r.tname), 保存先: s(r.url),
    作成日時ミリ秒: r.created_ms === null ? null : Math.round(Number(r.created_ms)),
  }));
}
