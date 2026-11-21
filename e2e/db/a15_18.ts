/**
 * A15-18 デッキ更新インポート（デッキビルダーの API の PUT /api/deck/import/{id}）の DB の参照。
 * 参照だけ（lib/db.ts は読み取り専用）。物理名はこのファイルの SQL の中にだけ書き、呼び出す側には業務の言葉の関数名で見せる。
 * A15-17 と同じ参照は、そのまま読み替えて使う（A15-17 のファイルは変えない）。
 */
import { query } from "../lib/db";
import { デッキを読む, デッキの採用カード, デッキのキャンペーンタグ, デッキ画像のカード名, 採用カード } from "./a15_17";

export {
  アーキタイプの番号, カード画像の数, カードの数, カードの番号, キャンペーンタグの番号, デッキのキャンペーンタグ, デッキの採用カード, デッキ画像のカード名,
  デッキを読む, フォーマットを探す, プレイヤーのデッキ, 公開区分の番号, 参照マスタの不足, 名前のカードの数, 採用カード,
} from "./a15_17";

/** デッキの区分ごとの明細（カード名と枚数。カード名の順）。メイン・サイド・統率はデッキカードの領域 */
export type 区分別の明細 = { デッキカード: 採用カード[]; メイビー: 採用カード[]; アトラクション: 採用カード[]; ステッカー: 採用カード[] };

function 明細(sql: string, デッキID: string): 採用カード[] {
  return query(sql, [デッキID]).map((r) => ({ カード名: String(r.name), 領域: "", 枚数: Number(r.cnt) }));
}

/** デッキのメイビー・アトラクション・ステッカーの明細と、デッキカードの明細 */
export function 区分別に読む(デッキID: string): 区分別の明細 {
  return {
    デッキカード: デッキの採用カード(デッキID),
    メイビー: 明細(`select coalesce(c.name_jp, '') as name, m.count::text as cnt from dtb_maybe_card m left join mtb_card c on c.id = m.card_id where m.deck_id = $1::int order by c.name_jp`, デッキID),
    アトラクション: 明細(`select coalesce(c.name_jp, '') as name, m.count::text as cnt from dtb_attraction_card m left join mtb_card c on c.id = m.card_id where m.deck_id = $1::int order by c.name_jp`, デッキID),
    ステッカー: 明細(`select coalesce(c.name_jp, '') as name, m.count::text as cnt from dtb_sticker_card m left join mtb_card c on c.id = m.card_id where m.deck_id = $1::int order by c.name_jp`, デッキID),
  };
}

/** 区分別の明細を、比べやすい文字列の並びにする */
export function 区分別の文字列(x: 区分別の明細): string[] {
  const f = (名: string, xs: 採用カード[]) => xs.map((c) => `${名}｜${c.領域 ? c.領域 + "｜" : ""}${c.カード名}｜${c.枚数}枚`);
  return [...f("デッキカード", x.デッキカード), ...f("メイビー", x.メイビー), ...f("アトラクション", x.アトラクション), ...f("ステッカー", x.ステッカー)].sort();
}

/** 4区分の明細の合計件数 */
export function 明細の件数(x: 区分別の明細): number {
  return x.デッキカード.length + x.メイビー.length + x.アトラクション.length + x.ステッカー.length;
}

export type デッキの内容 = {
  存在: boolean; 名前: string; 公開区分: string; フォーマット: string; アーキタイプ: string; 画像カード名: string; タグ: string[]; 明細: string[];
};

/** デッキの内容（更新の前後を比べる）。削除されたデッキ・無いデッキは 存在=false */
export function デッキの内容を読む(デッキID: string): デッキの内容 {
  const d = デッキを読む(デッキID);
  if (!d) return { 存在: false, 名前: "", 公開区分: "", フォーマット: "", アーキタイプ: "", 画像カード名: "", タグ: [], 明細: [] };
  return {
    存在: true, 名前: d.名前, 公開区分: d.公開区分, フォーマット: d.フォーマット, アーキタイプ: d.アーキタイプ,
    画像カード名: デッキ画像のカード名(デッキID), タグ: デッキのキャンペーンタグ(デッキID), 明細: 区分別の文字列(区分別に読む(デッキID)),
  };
}

/** デッキの持ち主のプレイヤー（無ければ空） */
export function デッキの持ち主(デッキID: string): string {
  return デッキを読む(デッキID)?.プレイヤー ?? "";
}

/** カードの最新のカード画像の番号（無ければ空）。控える呼び名の用 */
export function カードの最新の画像の番号(カードID: string): string {
  const r = query(
    `select i.id::text as id from mtb_card_image i join mtb_card_detail d on d.id = i.card_detail_id where d.card_id = $1::int order by i.id desc limit 1`, [カードID]);
  return r.length ? String(r[0].id) : "";
}

/** デッキの識別子が、削除されていないデッキとして存在するか */
export function デッキがある(デッキID: string): boolean {
  return デッキを読む(デッキID) !== null;
}
