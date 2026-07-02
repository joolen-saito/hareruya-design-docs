/**
 * a17-01 記事単一検索（GET参照系JSON API）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a17_01_api_other_article_search_single_e2e_cases.md（付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a17-01) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形（コンパイル確認のみ）。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋応答本文の構造/型/既知値」を仕様由来で判定する（オラクル独立性）。
 *  - 設計の応答プロパティは camelCase（付帯表4#4）。実装が snake_case を返せば落ちて検出するため期待は camelCase を保持。
 *  - 404本文形は実装が {code, errors}（付帯表4#3）だが、specは「コード・メッセージを含むJSON」を期待しオラクルを実装へ寄せない。
 *  - 必須欠落・型不正・特殊文字時の具体ステータス（実装は400＝付帯表4#6）は固定せず「正常取得200とならない」で判定。
 *  - 論理削除除外（付帯表4#5）・認可方式（付帯表4#2）は要実機確認。既知SEED値・期待値は env で供給し未設定時は創作既定値（要実機確認）。
 *  - 本APIは認証属性を持たない（付帯表4#2）。
 */

/**
 * 実効パス。
 * 由来: `#[Route('/article.json', name: 'article_by_params', methods: ['GET'])]`
 *       （src/Eccube/Controller/App/ArticleController.php:45）＋App配下prefixなし（routes.yaml:5-7）。
 * 設計書パス `GET /article` と実装 `GET /article.json` は `.json` サフィックスで不一致（付帯表4#1）。送信先は実効パスへ統一。
 */
export const ARTICLE_PATH = "/article.json";

/** クエリ `wpPostId` を取得（ArticleController.php:49）。GET送信時のクエリ（wpPostId=値）を組み立てる。 */
export function buildWpPostIdQuery(wpPostId: string | number): Record<string, string> {
  return { wpPostId: String(wpPostId) };
}

/** 想定外クエリ項目（E2E-A17-01-014）。wpPostIdのみ参照され他クエリは未参照（ArticleController.php:49）。 */
export const UNKNOWN_QUERY_PARAMS: Record<string, string> = { unknownField: "x", foo: "1" };

/** wpPostId＋想定外項目を併送するクエリ（E2E-A17-01-014）。 */
export function buildWpPostIdQueryWithExtra(wpPostId: string | number): Record<string, string> {
  return { wpPostId: String(wpPostId), ...UNKNOWN_QUERY_PARAMS };
}

/** wpPostId未指定（空）クエリ（E2E-A17-01-007）。欠落時の具体ステータスは要実機確認（実装は400＝付帯表4#6）。 */
export const EMPTY_QUERY: Record<string, string> = {};

/** 本APIは認証属性を持たない（付帯表4#2）。異常資格情報ヘッダ（E2E-A17-01-008・要実機確認）。 */
export function buildInvalidAuthHeaders(): Record<string, string> {
  return { Authorization: "Bearer invalid-token-要実機確認" };
}

// ===== SEED-A17-01-*。env で供給し、未設定時は要実機確認の創作既定値 =====

/** SEED-A17-01-ARTICLE-KNOWN 実在記事の WP投稿ID（E2E-A17-01-001 ほか）。 */
export const KNOWN_WP_POST_ID = process.env.A17_01_KNOWN_WP_POST_ID || "要実機確認-既知wpPostId";
/** SEED-A17-01-ARTICLE-KNOWN 関連（cards/archetypes/decks/eventDetails）を持つ記事（E2E-A17-01-040）。 */
export const RELATED_WP_POST_ID =
  process.env.A17_01_RELATED_WP_POST_ID || "要実機確認-関連ありwpPostId";
/** SEED-A17-01-ARTICLE-KNOWN 関連を持たない記事（空配列確認・E2E-A17-01-041）。 */
export const NO_RELATION_WP_POST_ID =
  process.env.A17_01_NO_RELATION_WP_POST_ID || "要実機確認-関連なしwpPostId";
/** SEED-A17-01-ARTICLE-NONE どの記事にも一致しない未登録 wpPostId（E2E-A17-01-010/015/016/019）。 */
export const NONE_WP_POST_ID = process.env.A17_01_NONE_WP_POST_ID || "999999999";
/** SEED-A17-01-ARTICLE-DELETED 論理削除済み記事の wpPostId（E2E-A17-01-022・要実機確認）。 */
export const DELETED_WP_POST_ID =
  process.env.A17_01_DELETED_WP_POST_ID || "要実機確認-論理削除済みwpPostId";

// ===== 不正 wpPostId（仕様の404は該当なしのみ。これらは「正常取得200とならない」を判定。具体ステータスは要実機確認） =====

/** 0以下の wpPostId（E2E-A17-01-011）。 */
export const ZERO_WP_POST_ID = "0";
/** 負値の wpPostId（E2E-A17-01-011/019）。 */
export const NEGATIVE_WP_POST_ID = "-1";
/** 小数（非整数）の wpPostId（E2E-A17-01-011）。 */
export const DECIMAL_WP_POST_ID = "1.5";
/** 非数値（型不正）の wpPostId（E2E-A17-01-012）。 */
export const NON_NUMERIC_WP_POST_ID = "abc";
/** 特殊文字・記号・全角数字を含む wpPostId（E2E-A17-01-021）。 */
export const SPECIAL_CHAR_WP_POST_ID = "1' OR";

// ===== 既知レコード期待値（E2E-A17-01-002 値照合）。env 供給。未設定なら値照合はスキップ＝要実機確認 =====

/** articleId の期待値（SEED既知レコード）。 */
export const EXPECTED_ARTICLE_ID = process.env.A17_01_EXPECTED_ARTICLE_ID;
/** url の期待値（SEED既知レコード・取得時点の値が丸め/補正されない確認）。 */
export const EXPECTED_URL = process.env.A17_01_EXPECTED_URL;

/**
 * 成功レスポンスのフィールド契約（正本md a17-01 入出力 レスポンス(成功)）。プロパティは camelCase（付帯表4#4）。
 * 実装は snake_case を返すため（付帯表4#4）、camelCase 不在なら落ちて検出する（期待を実装名へ寄せない）。
 */
export const SUCCESS_FIELDS = [
  "articleId",
  "wpPostId",
  "wpTypeId",
  "url",
  "updateDate",
  "createDate",
  "cards",
  "archetypes",
  "decks",
  "eventDetails",
] as const;

/** 関連配列フィールド（E2E-A17-01-040/041）。 */
export const RELATION_ARRAY_FIELDS = ["cards", "archetypes", "decks", "eventDetails"] as const;

/** deletedAt は公開対象外（E2E-A17-01-043）。応答に含まれてはならない。 */
export const NON_PUBLIC_FIELD = "deletedAt";

/** 成功レスポンス型（正本md camelCase。実装の snake_case は付帯表4#4でオラクルに固定しない）。 */
export type ArticleSuccessBody = {
  articleId: number;
  wpPostId: number;
  wpTypeId: number;
  url: string;
  updateDate: string;
  createDate: string;
  cards: unknown[];
  archetypes: unknown[];
  decks: unknown[];
  eventDetails: unknown[];
};

/** 失敗レスポンス型（正本md レスポンス(失敗)。実装本文形 {code, errors} は付帯表4#3）。 */
export type ArticleErrorBody = {
  code: number;
  message?: string;
};
