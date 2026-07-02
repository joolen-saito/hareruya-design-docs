/**
 * a17-02 関連記事（GET参照系JSON API）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a17_02_api_other_article_related_e2e_cases.md（付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a17-02) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形（コンパイル確認のみ）。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋応答配列の構造/型/共有度順」を仕様由来で判定する（オラクル独立性）。
 *  - hasSame* は仕様 integer（1/0）。実装は string（付帯表4#1）で返すため、integer 期待で落ちて検出する（実装の string 化へ寄せない）。
 *  - 404本文形（付帯表4#2）・論理削除除外（付帯表4#4）は要確認。不正id/limit時の具体ステータス（付帯表4#3/#6）は固定せず「正常取得200とならない」で判定。
 *  - 認可方式（付帯表4#5）は要実機確認。既知SEED値・期待値は env で供給し未設定時は創作既定値（要実機確認）。
 */

/** パス変数 id を含む実効パスを組む。由来: `#[Route('/article/related/{id}', methods: ['GET'])]`（ArticleController.php:81／routes.yaml:5-7）。設計書と一致。 */
export function buildRelatedPath(id: string | number): string {
  return `/article/related/${id}`;
}

/** id 欠落パス（E2E-A17-02-007）。ルート不一致/404等の具体ステータスは要実機確認。 */
export const MISSING_ID_PATH = "/article/related/";

/** limit クエリ（任意・E2E-A17-02-041）。未指定時はデフォルト20（ArticleController.php:90／eccube.yaml:129）。 */
export function buildLimitQuery(limit: string | number): Record<string, string> {
  return { limit: String(limit) };
}

/** 想定外クエリ項目（E2E-A17-02-006）。id/limitのみ参照（ArticleController.php:81-96）。 */
export const UNKNOWN_QUERY_PARAMS: Record<string, string> = { unknownField: "x", foo: "1" };

// ===== SEED-A17-02-*。env で供給し、未設定時は要実機確認の創作既定値 =====

/** SEED-A17-02-RELATED-KNOWN 関連記事が存在する基準記事の WP投稿ID（E2E-A17-02-001 ほか）。 */
export const KNOWN_BASE_ID = process.env.A17_02_KNOWN_BASE_ID || "要実機確認-関連あり基準wpPostId";
/** SEED-A17-02-RELATED-NONE 関連記事を1件も持たない基準記事の WP投稿ID（E2E-A17-02-009/020/022）。 */
export const NONE_BASE_ID = process.env.A17_02_NONE_BASE_ID || "要実機確認-関連なし基準wpPostId";
/** SEED-A17-02-RELATED-ORDER 共有種別数の異なる関連記事を持つ基準記事（共有度降順判定・E2E-A17-02-040）。 */
export const ORDER_BASE_ID = process.env.A17_02_ORDER_BASE_ID || "要実機確認-共有度順基準wpPostId";
/** SEED-A17-02-RELATED-MANY 上限超過件数の関連記事を持つ基準記事（limit上限/デフォルト20・E2E-A17-02-041/045）。 */
export const MANY_BASE_ID = process.env.A17_02_MANY_BASE_ID || "要実機確認-多数関連基準wpPostId";
/** SEED-A17-02-RELATED-DELETED 関連候補の一部が論理削除された基準記事（E2E-A17-02-044）。 */
export const DELETED_BASE_ID = process.env.A17_02_DELETED_BASE_ID || "要実機確認-論理削除候補含む基準wpPostId";
/** 論理削除済みで関連配列に含まれてはならない記事の wpPostId（E2E-A17-02-044）。 */
export const DELETED_RELATED_WP_POST_ID =
  process.env.A17_02_DELETED_RELATED_WP_POST_ID || "要実機確認-論理削除済みwpPostId";

/** limit 上限値 N（E2E-A17-02-041）。 */
export const LIMIT_N = process.env.A17_02_LIMIT_N || "3";

// ===== 不正 id / limit（仕様の404は関連なしのみ。「正常取得200とならない」を判定。具体ステータスは要実機確認） =====

/** 0以下の id（E2E-A17-02-005）。 */
export const ZERO_ID = "0";
/** 負値の id（E2E-A17-02-005/025）。 */
export const NEGATIVE_ID = "-1";
/** 非数値（型不正）の id（E2E-A17-02-046）。 */
export const NON_NUMERIC_ID = "abc";
/** 異常 limit 値（0以下／非数値・E2E-A17-02-042）。 */
export const INVALID_LIMITS = ["0", "-1", "abc"] as const;

/** デフォルト取得上限（正本md「未指定時は20件」／eccube.yaml:129）。仕様由来オラクル。 */
export const DEFAULT_LIMIT = 20;

/** 応答配列要素のフィールド（正本md 入出力 レスポンス(成功)）。hasSame* は integer（1/0・付帯表4#1）。 */
export const ELEMENT_FIELDS = [
  "wpPostId",
  "hasSameDeck",
  "hasSameArchetype",
  "hasSameCard",
  "hasSameEventDetail",
] as const;

/** 共有度降順の比較キー順（ORDER BY has_same_deck DESC...event_detail DESC＝DtbArticleRepository.php:110-115）。 */
export const SHARE_ORDER_KEYS = ["hasSameDeck", "hasSameArchetype", "hasSameCard", "hasSameEventDetail"] as const;

/** 成功レスポンス要素型（正本md。hasSame* は integer。実装 string は付帯表4#1）。 */
export type RelatedArticleItem = {
  wpPostId: number;
  hasSameDeck: number;
  hasSameArchetype: number;
  hasSameCard: number;
  hasSameEventDetail: number;
};

/** 失敗レスポンス型（正本md レスポンス(失敗)。実装本文形は付帯表4#2）。 */
export type RelatedErrorBody = {
  code: number;
  message?: string;
};
