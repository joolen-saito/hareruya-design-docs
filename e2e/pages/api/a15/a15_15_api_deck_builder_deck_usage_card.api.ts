/**
 * a15-15 デッキビルダー_使用カード（指定フォーマットで採用率の高いカードの平均採用枚数を集計し上位から返す参照系JSON API・GET）API/統合レイヤ用 パス／クエリ／ヘルパ。
 * ケース表 integration_test/e2e/a15_15_api_deck_builder_deck_usage_card_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは設計書（正本md a15-15）由来のリクエスト仕様（GET・パス変数 formatId・任意クエリ）のみを最小構成で組む未実行雛形。実環境（deck-api／ec-cube-enterprise）は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md・観点表由来であり、実装のレスポンス形・FW既定値・SQL固定値を期待値に流用しない）:
 *  - 送信先は実装の実効パス `GET /api/deck/usage_analysis/{formatId}`（付帯表1）。
 *    由来: `#[Route('/api/deck/usage_analysis/{formatId}', name: 'api_deck_builder_usage_analysis', methods: ['GET','OPTIONS'], requirements: ['formatId'=>'\d+'])]`（DeckController.php:522）。
 *    設計書のエンドポイント `GET /deck/usage_card/{formatId}`（利用者視点の入口）は `/api` プレフィクス・パス名（usage_card⇔usage_analysis）で不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理する。
 *  - 認証は本ルートに認証分岐が無く誰でも呼べる（DeckController.php:522-554・正本md「認証を行わない」）。資格情報の欠落/不正でも認証起因の拒否（401）を返さず 200 参照可（付帯表4#9・要実機確認）。
 *  - 該当フォーマットなしは 404・本文 `{code, message}`（DeckController.php:530-535／AbstractDeckBuilderController.php:44-50）。message は設計「format not found」を期待（実装は「見つかりません／Not Found」＝付帯表4#2）。
 *  - 土地限定/除外の切替は設計の `type`（値 `land`）で送る。実装は `is_land`==='1'||'true'（DeckController.php:537）で不一致（付帯表4#3）→ 実装が `type` を解さなければ落ちて検出する（実装パラメータ名へ寄せない）。
 *  - 件数上限は設計の `count`（未指定の既定20件）。実装は `LIMIT 100` 固定で count 不参照（DtbDeckRepository.php:1109＝付帯表4#4）。archetype_id（付帯表4#5）・board_id（付帯表4#6）絞り込みは実装に無い→いずれも設計のパラメータ・意味で期待値を立て、実装が未反映なら落ちて検出する。
 *  - 成功レスポンスは `{code, cards}`。`cards[]` は設計の id/name_jp/name_en/image_jp/image_en/count を期待値とする（実装は card_id/name_jp/totalCount のみ＝付帯表4#7、count型は付帯表4#8）。画像URLは該当なしで null（serialize_null 有効）。
 *  - SEED フォーマットID・絞り込み値は env 供給（要実機確認の暫定値）。秘密情報は持たない（参照系のため資格情報シードは不要）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_15_READY。
 */

/** API実効パス接頭辞。由来: DeckController.php:522（Route `/api/deck/usage_analysis/{formatId}`）。 */
export const USAGE_ANALYSIS_PATH_PREFIX = "/api/deck/usage_analysis";

/** 認証ヘッダ名（参照確認用）。本APIは認証を行わない（DeckController.php:522-554）が、資格情報欠落/不正の負例観点（001）で不正値を載せるために使用。 */
export const JWT_HEADER_NAME = "jwt-token";

/** 土地限定/除外の設計パラメータ値（付帯表4#3。実装 is_land とは別名で送る）。 */
export const LAND_TYPE = "land";
/** 土地以外（land以外の任意値）。 */
export const NON_LAND_TYPE = "other";

/** count の既定上限（正本md: count未指定の場合は20件＝付帯表4#4で実装は固定100）。 */
export const DEFAULT_COUNT = 20;

/** 成功HTTPステータス（入出力 レスポンス(成功)）。 */
export const SUCCESS_STATUS = 200;
/** 該当フォーマットなしHTTPステータス（入出力 レスポンス(失敗)）。 */
export const NOT_FOUND_STATUS = 404;

/** 該当フォーマットなしの本文メッセージ（正本md「format not found」。実装は「見つかりません／Not Found」＝付帯表4#2）。 */
export const SPEC_NOT_FOUND_MESSAGE = "format not found";

/**
 * 成功レスポンス cards[] の仕様フィールド（入出力 レスポンス(成功)）。
 * 実装は card_id/name_jp/totalCount のみ（フィールド名 id⇔card_id・count⇔totalCount／name_en・image_* 欠落＝付帯表4#7）。テストは仕様名で照合し違えば落として検出する。
 */
export const SPEC_CARD_FIELDS = ["id", "name_jp", "name_en", "image_jp", "image_en", "count"] as const;

// ===== SEED フォーマットID・絞り込み値（env 供給・既定は要実機確認の暫定。HAS_API(A15_15_READY) ガード下でのみ送信される） =====

/**
 * フォーマットID（付帯表3 SEED）。env 供給・既定値は要実機確認のプレースホルダ。
 *  - KNOWN:     集計対象のある実在フォーマット（SEED-A15-15-DECKS-KNOWN）。公開×大会×範囲内デッキ・既知カード構成。
 *  - NONE:      一致するフォーマットが無いformatId（SEED-A15-15-FORMAT-NONE。404確認）。
 *  - EMPTY:     フォーマットは存在するが集計対象0件（SEED-A15-15-DECKS-EMPTY。200・空cards確認）。
 *  - BASICLAND: 基本地形混在フラグ偽のフォーマット（SEED-A15-15-BASICLAND。土地限定での基本土地除外確認）。
 *  - MISSING:   パス変数 formatId を欠いた空値（016。ルート不一致/404の具体ステータスは要実機確認）。
 */
export const FORMAT_ID = {
  KNOWN: process.env.A15_15_FORMAT_KNOWN || "1", // 要実機確認: SEED-A15-15-DECKS-KNOWN
  NONE: process.env.A15_15_FORMAT_NONE || "99999999", // 該当なしformatId（未登録ID）
  EMPTY: process.env.A15_15_FORMAT_EMPTY || "2", // 要実機確認: SEED-A15-15-DECKS-EMPTY
  BASICLAND: process.env.A15_15_FORMAT_BASICLAND || "3", // 要実機確認: SEED-A15-15-BASICLAND
  MISSING: "", // formatId 欠落/空（016）
} as const;

/** 既知アーキタイプ識別子（033。SEED-A15-15-DECKS-KNOWN）。要実機確認: 環境の投入値へ差し替え。 */
export const ARCHETYPE_ID = process.env.A15_15_ARCHETYPE_ID || "10";
/** どのデッキも該当しないアーキタイプ識別子（040。絞り込み0件確認）。要実機確認: 環境に該当デッキの無い値へ。 */
export const ARCHETYPE_ID_NO_MATCH = process.env.A15_15_ARCHETYPE_ID_NOMATCH || "88888";
/** 既知ボード識別子（034。SEED-A15-15-DECKS-KNOWN）。要実機確認: 環境の投入値へ差し替え。 */
export const BOARD_ID = process.env.A15_15_BOARD_ID || "1";
/** 件数制限確認用の小さい count（035。対象カード件数より小さい値を想定）。 */
export const LIMIT_COUNT = Number(process.env.A15_15_LIMIT_COUNT || 5);

/** 想定外クエリ項目（006。正本に扱いの明記が無く要実機確認）。 */
export const UNKNOWN_QUERY = { unexpected_param: "unexpected_value" } as const;

/** 不正な資格情報値（001。本APIは認証を行わないため200参照可を確認する負例ヘッダ用）。 */
export const INVALID_JWT = process.env.A15_15_INVALID_JWT || "invalid-credential-not-a-jwt";

// ===== クエリ／パス組立（設計の任意クエリ＝type/count/archetype_id/board_id を設計パラメータ名で送る） =====

/** 使用カード集計の任意クエリ（設計パラメータ名。archetype_id/board_id は実装未反映＝付帯表4#5/#6）。 */
export interface UsageQuery {
  /** 土地限定/除外切替（land で土地のみ・land以外/未指定で土地以外）。付帯表4#3。 */
  type?: string;
  /** 上位件数上限（未指定で既定20件）。付帯表4#4。 */
  count?: string | number;
  /** アーキタイプ絞り込み。付帯表4#5。 */
  archetypeId?: string | number;
  /** ボード絞り込み。付帯表4#6。 */
  boardId?: string | number;
  /** 想定外クエリ項目（006）。キー＝値で素通し付与する。 */
  extra?: Record<string, string>;
}

/**
 * 使用カード集計エンドポイント実効パス（パス変数 formatId ＋任意クエリ）を組む。
 * 由来: DeckController.php:522 ＝実効 `GET /api/deck/usage_analysis/{formatId}`。設計書 `GET /deck/usage_card/{formatId}` とは不一致（付帯表4#1）。
 * クエリ名は設計（type/count/archetype_id/board_id）で付与する（実装が未反映なら集計値が変わらず落ちて検出する）。
 */
export function buildUsagePath(formatId: string | number, query: UsageQuery = {}): string {
  const base = `${USAGE_ANALYSIS_PATH_PREFIX}/${formatId}`;
  const params = new URLSearchParams();
  if ("type" in query && query.type !== undefined) params.set("type", String(query.type));
  if ("count" in query && query.count !== undefined) params.set("count", String(query.count));
  if ("archetypeId" in query && query.archetypeId !== undefined) params.set("archetype_id", String(query.archetypeId));
  if ("boardId" in query && query.boardId !== undefined) params.set("board_id", String(query.boardId));
  if (query.extra) {
    for (const [k, v] of Object.entries(query.extra)) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

// ===== ヘッダ（本APIは認証を行わない。資格情報の欠落/不正でも200参照可を確認するため2種を用意） =====

/** 資格情報を一切付与しないヘッダ（001 欠落・007/010/018 等の通常GET）。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return {};
}

/** 不正な資格情報を載せたヘッダ（001 不正値。認証を行わないため拒否されず200となることを確認）。 */
export function buildInvalidAuthHeaders(token: string = INVALID_JWT): Record<string, string> {
  return { [JWT_HEADER_NAME]: token };
}
