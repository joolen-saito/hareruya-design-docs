/**
 * a16-01 トップバナー取得（GET参照系JSON API）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a16_01_api_top_banner_get_e2e_cases.md（付帯表1 実効パス / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a16-01) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形（コンパイル確認のみ）。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋応答本文の構造/型/既知値」を仕様由来で判定する（オラクル独立性）。
 *  - 応答プロパティは仕様の camelCase（imageUrl/dispType/nameJp/nameEn）を期待し、実装の snake_case（付帯表4#2）へ寄せない。
 *  - 404本文は仕様の {code, message}（"Not Found"）を期待し、実装の {code, errors}（付帯表4#3）へ寄せない。
 *  - 不正パラメータ（欠落・0以下・非数値）時の具体ステータスは正典未定義のため「正常取得200とならない」のみ判定（付帯表4#5）。
 *  - 既知SEED値・期待値は env で供給し、未設定時の既定値は創作値（要実機確認）。
 *  - 認可方式は pf-api 方針で未確定＝当メソッドに認可属性なし（付帯表4#4）。資格情報の負例(008)・正常呼び出し(005)は要実機確認。
 */

/**
 * 実効パス（パス変数つき）。
 * 由来: `#[Route(path: '/topBanner/{topBannerId}', name: 'top_banner_by_top_banner_id', methods: ['GET'])]`
 *       （src/Eccube/Controller/App/ContentController.php:48）。`app_controllers` はプレフィクスなしで読み込まれる
 *       （app/config/eccube/routes.yaml:5-7）ため実効パスは `GET /topBanner/{topBannerId}`。
 * 設計書のパス変数 `id` と実装の `topBannerId` は不一致（付帯表4#1）。送信先は実装の実効パスへ統一し、合否は設計の意味で判定。
 */
export function buildTopBannerPath(id: string | number): string {
  return `/topBanner/${id}`;
}

/**
 * パス変数（topBannerId）欠落パス（E2E-A16-01-007）。
 * 必須パス変数を欠いたリクエストは正しいトップバナー（正常取得200）とならない（ルート不一致/404等の具体ステータスは要実機確認＝付帯表4#5）。
 */
export const TOP_BANNER_MISSING_ID_PATH = "/topBanner/";

/** 想定外クエリ項目（E2E-A16-01-014）。topBannerId のみ参照され他クエリは未参照（想定／200固定は正本に明記なし＝要実機確認）。 */
export const UNKNOWN_QUERY_PARAMS: Record<string, string> = { unknownField: "x", foo: "1" };

/** 本APIは当メソッドに認可属性が無い（ContentController.php:49）。認可方式は pf-api 方針で未確定（付帯表4#4）。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return {};
}

// ===== トップバナーID（SEED-A16-01-*）。env で供給し、未設定時は要実機確認の創作既定値 =====

/** SEED-A16-01-BANNER-KNOWN 実在するトップバナーID（正常取得のベース）。 */
export const KNOWN_BANNER_ID = process.env.A16_01_KNOWN_BANNER_ID || "要実機確認-既知バナーID";
/** SEED-A16-01-BANNER-NONE リポジトリ取得結果が空となる未登録ID（E2E-A16-01-010/015/016/019）＝該当なし404。 */
export const NONE_BANNER_ID = process.env.A16_01_NONE_BANNER_ID || "999999999";
/** 0以下のトップバナーID（E2E-A16-01-011）＝正しいトップバナーが取得されない（具体ステータスは要実機確認＝付帯表4#5）。 */
export const ZERO_OR_NEGATIVE_ID = process.env.A16_01_ZERO_OR_NEGATIVE_ID || "0";
/** 非数値（型不正）のトップバナーID（E2E-A16-01-012）＝`^\d+$` 不一致で正しいトップバナーが取得されない（付帯表4#5）。 */
export const NON_NUMERIC_ID = process.env.A16_01_NON_NUMERIC_ID || "abc";
/** 不正値のトップバナーID（E2E-A16-01-019）＝正常取得200とならない（具体ステータスは要実機確認＝付帯表4#5）。 */
export const INVALID_ID = process.env.A16_01_INVALID_ID || "abc!@#";

// ===== 既知レコード期待値（E2E-A16-01-002 値照合）。env 供給。未設定なら値照合はスキップ＝要実機確認 =====
// 仕様の camelCase プロパティで照合する（実装 snake_case は付帯表4#2、期待値へ寄せない）。

/** トップバナーの imageUrl の期待値（SEED既知レコード）。 */
export const EXPECTED_IMAGE_URL = process.env.A16_01_EXPECTED_IMAGE_URL;
/** トップバナーの link の期待値（SEED既知レコード）。 */
export const EXPECTED_LINK = process.env.A16_01_EXPECTED_LINK;
/** トップバナーの dispType の期待値（SEED既知レコード）。 */
export const EXPECTED_DISP_TYPE = process.env.A16_01_EXPECTED_DISP_TYPE;

/** 404失敗応答の message（正本md 入出力 レスポンス(失敗)「Not Found」）。実装は {code, errors} だがオラクルに寄せない（付帯表4#3）。 */
export const NOT_FOUND_MESSAGE = "Not Found";

/**
 * 成功レスポンスのルート型（正本md 入出力 レスポンス(成功)）。
 * プロパティは仕様の camelCase（実装 snake_case は付帯表4#2。型は spec 側で検査）。
 */
export type TopBannerGetSuccessBody = {
  id: number;
  imageUrl: string;
  link: string;
  dispType: number;
  languages: unknown[];
};

/** languages 配列要素の型（正本md 入出力 レスポンス(成功) languages 定義）。 */
export type TopBannerLanguage = {
  id: number;
  nameJp: string;
  nameEn: string;
  code: string;
};

/** 404失敗レスポンスのルート型（正本md 入出力 レスポンス(失敗)）。実装本文形 {code, errors} は付帯表4#3。 */
export type TopBannerErrorBody = {
  code: number;
  message: string;
};
