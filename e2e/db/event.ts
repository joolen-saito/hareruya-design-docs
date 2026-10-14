/** イベントのDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 保存されているイベント。値はすべて文字列（空の値は ""、真偽は "真"／"偽"）。選択項目は画面の表示名 */
export type 保存イベント = {
  イベントID: string; "イベント名(日)": string; "イベント名(英)": string; 店舗: string; フォーマット: string[]; ルール適用度: string; 公開状態: string;
  イベント規模: string; "バナーURL(日)": string; "バナーURL(英)": string; 定員: string; チーム戦: string; 支払方法: string[]; 参加費: string;
  "賞品(日)": string; "賞品(英)": string; 登録者の管理者ID: string; 更新日時: string;
  フリー入力エリア: { "項目名(日)": string; "項目名(英)": string; "内容(日)": string; "内容(英)": string; 初期表示は閉じる: string }[];
};

const SELECT = `
  select e.id as id, e.name_jp, e.name_en, b.shop_name as shop, r.name_jp as rel, d.name as disp, coalesce(s.name, '') as scale,
         coalesce((select string_agg(m.name_jp, '|' order by m.id) from dtb_event_format f join mtb_format m on m.id = f.format_id where f.event_id = e.id), '') as formats,
         coalesce((select string_agg(p.payment_method, '|' order by p.id) from dtb_event_payment ep join dtb_payment p on p.id = ep.payment_id where ep.event_id = e.id), '') as payments,
         e.capacity, e.entry_fee, e.is_team_battle, e.banner_url, e.banner_en_url, e.prize_jp, e.prize_en, e.member_id, e.update_date,
         e.free_text_area1_label_jp as l1j, e.free_text_area1_label_en as l1e, e.free_text_area1_content_jp as c1j, e.free_text_area1_content_en as c1e, e.is_free_text_area1_accordion as a1,
         e.free_text_area2_label_jp as l2j, e.free_text_area2_label_en as l2e, e.free_text_area2_content_jp as c2j, e.free_text_area2_content_en as c2e, e.is_free_text_area2_accordion as a2,
         e.free_text_area3_label_jp as l3j, e.free_text_area3_label_en as l3e, e.free_text_area3_content_jp as c3j, e.free_text_area3_content_en as c3e, e.is_free_text_area3_accordion as a3
    from dtb_event e join dtb_base_info b on b.id = e.base_info_id left join mtb_rel r on r.id = e.rel_id
    left join mtb_disp d on d.id = e.disp_id left join mtb_event_scale s on s.id = e.event_scale_id
   where e.deleted_at is null`;

const s = (v: string | null) => v ?? "";
const bool = (v: string | null) => (v === "true" ? "真" : "偽");
const list = (v: string | null) => (v ? v.split("|") : []);

function toEvent(r: Record<string, string | null>): 保存イベント {
  return {
    イベントID: s(r.id), "イベント名(日)": s(r.name_jp), "イベント名(英)": s(r.name_en), 店舗: s(r.shop), フォーマット: list(r.formats), ルール適用度: s(r.rel),
    公開状態: s(r.disp), イベント規模: s(r.scale), "バナーURL(日)": s(r.banner_url), "バナーURL(英)": s(r.banner_en_url), 定員: s(r.capacity),
    チーム戦: bool(r.is_team_battle), 支払方法: list(r.payments), 参加費: s(r.entry_fee), "賞品(日)": s(r.prize_jp), "賞品(英)": s(r.prize_en),
    登録者の管理者ID: s(r.member_id), 更新日時: s(r.update_date),
    フリー入力エリア: [1, 2, 3].map((n) => ({
      "項目名(日)": s(r[`l${n}j`]), "項目名(英)": s(r[`l${n}e`]), "内容(日)": s(r[`c${n}j`]), "内容(英)": s(r[`c${n}e`]), 初期表示は閉じる: bool(r[`a${n}`]),
    })),
  };
}

/** イベントIDで引く。無ければ（削除済みを含む）null */
export function 保存されているイベント(イベントID: string): 保存イベント | null {
  const rows = query(`${SELECT} and e.id = $1::int`, [イベントID]);
  return rows[0] ? toEvent(rows[0]) : null;
}

/** イベント名(日)が一致するイベント（削除済みは含まない） */
export function イベント名で探す(イベント名日: string): 保存イベント[] {
  return query(`${SELECT} and e.name_jp = $1 order by e.id`, [イベント名日]).map(toEvent);
}

/** その管理者を登録者とするイベントの件数（削除済みは含まない） */
export function 登録者のイベント件数(管理者ID: string): number {
  return Number(query(`select count(*) as n from dtb_event where member_id = $1::int and deleted_at is null`, [管理者ID])[0].n);
}

/** イベントの状態。「ある」＝削除されていない／「削除済み」＝削除の印が付いている／「無い」＝行が無い */
export function イベントの状態(イベントID: string): "ある" | "削除済み" | "無い" {
  const r = query(`select deleted_at from dtb_event where id = $1::int`, [イベントID])[0];
  if (!r) return "無い";
  return r.deleted_at === null ? "ある" : "削除済み";
}

/** いちばん新しいイベントID（削除済みを含む）。イベントが1件も無ければ "" */
export function 最大のイベントID(): string {
  return query(`select max(id) as id from dtb_event`)[0]?.id ?? "";
}
