// 取り込み注記: 同じ部品を main 側も別に実装していたため、栗野側の版を別ファイルにした（栗野側のケース・シードがこちらを使う）。
/**
 * M14-10 フォーマット詳細(登録・編集・削除)のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 * 削除済みの記録・禁止制限の指定の読み取りは M14-09 の照会（db/m14_09_format.ts）を使う。
 */
import { query } from "../lib/db";

/** フォーマットに保存された値（業務の言葉の名前で返す。チェックは "true" / "false"） */
export type フォーマットの保存値 = {
  フォーマットID: string; フォーマット名日: string; フォーマット名英: string; フォーマットコード: string | null; 並び順: string;
  メイン上限: string | null; メイン下限: string | null; サイド上限: string | null; サイド下限: string | null;
  認定: string | null;
  デッキ検索: string; 商品検索: string; ランキング: string; メタ分布簡易化: string; ARENA: string; 基本土地: string;
  デッキビルダー: string; イベント: string; メタゲーム分析日数: string; ルール日: string | null; ルール英: string | null;
  統率使用: string | null; ハイランダー: string | null; 削除済み: string;
};

const 列 = `f.id as "フォーマットID", f.name_jp as "フォーマット名日", f.name_en as "フォーマット名英", f.code as "フォーマットコード",
  f."rank" as "並び順", f.main_max_card_count as "メイン上限", f.main_min_card_count as "メイン下限",
  f.side_max_card_count as "サイド上限", f.side_min_card_count as "サイド下限", c.name_jp as "認定",
  f.search_flg as "デッキ検索", f.product_search_flg as "商品検索", f.ranking_flg as "ランキング", f.other_meta_flg as "メタ分布簡易化",
  f.arena_legal_flg as "ARENA", f.include_basic_flg as "基本土地", f.deckbuilder_flg as "デッキビルダー", f.is_shown_in_event as "イベント",
  f.meta_range as "メタゲーム分析日数", f.rule_jp as "ルール日", f.rule_en as "ルール英", f.use_command_flg as "統率使用",
  f.highlander_flg as "ハイランダー", (f.deleted_at is not null) as "削除済み"`;

/** フォーマットIDのフォーマットに保存された値（削除済みも含む）。無ければ null */
export function フォーマットの保存値(id: string): フォーマットの保存値 | null {
  const r = query(`select ${列} from mtb_format f left join mtb_certification c on c.id = f.certification_id where f.id = $1`, [id])[0];
  return (r as unknown as フォーマットの保存値) ?? null;
}

/** フォーマット名(日)がちょうど一致するフォーマット（削除済みを除く） */
export function 名のフォーマット(名日: string): フォーマットの保存値[] {
  return query(`select ${列} from mtb_format f left join mtb_certification c on c.id = f.certification_id
    where f.name_jp = $1 and f.deleted_at is null order by f.id`, [名日]) as unknown as フォーマットの保存値[];
}

/** フォーマットIDの数がちょうど一致するフォーマットの件数（削除済みも含む） */
export function 番号のフォーマットの件数(id: string): number {
  return Number(query(`select count(*) as n from mtb_format where id = $1`, [id])[0].n);
}

/** 統率の上限・下限の保存（統率ボードの設定。削除されていないもの）。メインボードの枚数に含むかも返す */
export type 統率の保存 = { 上限: string | null; 下限: string | null; メインに含む: boolean };
export function 統率の保存(id: string): 統率の保存[] {
  return query(`select fb.max_card_count, fb.min_card_count, (cb.board_id = 1) as in_main
    from dtb_format_board fb left join dtb_format_board cb on cb.id = fb.count_board_id
    where fb.format_id = $1 and fb.board_id = 3 and fb.deleted_at is null order by fb.id`, [id])
    .map((r) => ({ 上限: r.max_card_count, 下限: r.min_card_count, メインに含む: r.in_main === "true" }));
}
