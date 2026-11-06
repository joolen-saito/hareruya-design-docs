/** M14-10 フォーマット詳細のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type フォーマットの値 = {
  フォーマットID: string; 名日: string; 名英: string; コード: string | null; 並び順: string | null; メイン上限: string | null; メイン下限: string | null;
  サイド上限: string | null; サイド下限: string | null; メタ日数: string | null; ルール日: string | null; ルール英: string | null; 認定: string | null;
  検索: boolean; 商品検索: boolean; ランキング: boolean; メタ簡易: boolean; アリーナ: boolean; 基本土地算入: boolean; デッキビルダー: boolean; イベント表示: boolean; 統率使用: boolean; 一枚まで: boolean;
  削除済み: boolean;
};

const 列 = `f.id, f.name_jp, f.name_en, f.code, f.rank, f.main_max_card_count as mx, f.main_min_card_count as mn, f.side_max_card_count as smx, f.side_min_card_count as smn,
  f.meta_range, f.rule_jp, f.rule_en, c.name_jp as cert, f.search_flg, f.product_search_flg, f.ranking_flg, f.other_meta_flg, f.arena_legal_flg, f.include_basic_flg, f.deckbuilder_flg,
  f.is_shown_in_event, f.use_command_flg, f.highlander_flg, f.deleted_at`;
const 変換 = (r: Record<string, string | null>): フォーマットの値 => ({
  フォーマットID: String(r.id), 名日: String(r.name_jp), 名英: String(r.name_en), コード: r.code, 並び順: r.rank, メイン上限: r.mx, メイン下限: r.mn, サイド上限: r.smx, サイド下限: r.smn,
  メタ日数: r.meta_range, ルール日: r.rule_jp, ルール英: r.rule_en, 認定: r.cert, 検索: r.search_flg === "true", 商品検索: r.product_search_flg === "true", ランキング: r.ranking_flg === "true",
  メタ簡易: r.other_meta_flg === "true", アリーナ: r.arena_legal_flg === "true", 基本土地算入: r.include_basic_flg === "true", デッキビルダー: r.deckbuilder_flg === "true",
  イベント表示: r.is_shown_in_event === "true", 統率使用: r.use_command_flg === "true", 一枚まで: r.highlander_flg === "true", 削除済み: r.deleted_at !== null,
});

/** IDで引く（削除済みも返す。削除済みかは 削除済み で見る） */
export function フォーマットの値(id: string | number): フォーマットの値 | null {
  const r = query(`select ${列} from mtb_format f left join mtb_certification c on c.id = f.certification_id where f.id = $1`, [id])[0];
  return r ? 変換(r) : null;
}

/** フォーマット名(日)で引く（削除済みを除く） */
export function 名日のフォーマット(名日: string): フォーマットの値[] {
  return query(`select ${列} from mtb_format f left join mtb_certification c on c.id = f.certification_id where f.name_jp = $1 and f.deleted_at is null order by f.id`, [名日]).map(変換);
}

/** 統率領域の上限・下限（削除されていない行）。無ければ null */
export function 統率の枚数(フォーマットID: string | number): { 上限: string | null; 下限: string | null } | null {
  const r = query(`select max_card_count as mx, min_card_count as mn from dtb_format_board where format_id = $1 and board_id = 3 and deleted_at is null order by id desc limit 1`, [フォーマットID])[0];
  return r ? { 上限: r.mx, 下限: r.mn } : null;
}

/** カードのフォーマットごとの指定（フォーマット名(日):指定の英語名）。カード名(日)で引く */
export function カード名日のリーガリティ(カード名日: string): string[] {
  return query(`select f.name_jp as f, r.name_en as r from dtb_card_format cf join mtb_card c on c.id = cf.card_id join mtb_format f on f.id = cf.format_id join mtb_restriction r on r.id = cf.restriction_id
    where c.name_jp = $1 order by f.name_jp`, [カード名日]).map((x) => `${x.f}:${x.r}`);
}

/** フォーマットIDに紐づくカードごとの指定の数 */
export function フォーマットの指定数(フォーマットID: string | number): number {
  return Number(query(`select count(*) as n from dtb_card_format where format_id = $1`, [フォーマットID])[0].n);
}

export function 認定の件数(名: string): number {
  return Number(query(`select count(*) as n from mtb_certification where name_jp = $1`, [名])[0].n);
}
