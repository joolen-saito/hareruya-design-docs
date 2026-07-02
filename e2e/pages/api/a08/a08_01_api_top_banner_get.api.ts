/**
 * a08-01 API_トップバナー取得（GET参照系JSON API・トップバナーIDで単一取得）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a08_01_api_top_banner_get_e2e_cases.md（付帯表3 SEED / 付帯表4 不具合候補）に対応。
 * 本ファイルは正本md(a08-01) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形（コンパイル確認のみ）。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋応答本文の構造/型/既知値」を仕様（設計書・観点表）由来で判定する（オラクル独立性）。
 *  - 成功フィールド名は仕様の camelCase（id・imageUrl・link・dispType・languages[].{id,nameJp,nameEn,code}）を契約とする。
 *    実装は snake_case（image_url 等・付帯表4#4）／失敗本文 message⇔errors（付帯表4#3）で乖離するが期待値を実装へ寄せない。
 *  - パス変数名は設計 `{id}` と実装 `{topBannerId}` で乖離（付帯表4#1）。送信先は実装の実効パスへ統一し合否は設計の意味で判定。
 *  - 不正パラメータ（0以下・非数値・欠落）時の具体ステータスは仕様未定義（仕様で固定の404は該当なし時のみ・付帯表4#5）。
 *    よって「正常取得200とならない」（!=200）で判定し、404固定にしない。
 *  - 既知SEED値・期待値は env で供給し、未設定時の既定値は創作値（要実機確認）。本APIは認可方式未特定（付帯表4#2・実質公開）。
 */

/**
 * 実効パス（テンプレート）。
 * 由来: `#[Route(path: '/topBanner/{topBannerId}', name: 'top_banner_by_top_banner_id', methods: ['GET'])]`
 *       （src/Eccube/Controller/App/ContentController.php:48）＋prefixなし（app/config/eccube/routes.yaml:5-7）＝実効 `GET /topBanner/{topBannerId}`。
 * 設計md の `GET /topBanner/{id}` とパス変数名で乖離（付帯表4#1）。送信先は実装の実効パスへ統一し合否は設計の意味で判定する。
 */
export const TOP_BANNER_PATH_PREFIX = "/topBanner";

/** トップバナー単一取得パスを組み立てる（GET /topBanner/{topBannerId}）。 */
export function buildTopBannerPath(topBannerId: string | number): string {
  return `${TOP_BANNER_PATH_PREFIX}/${topBannerId}`;
}

/**
 * パス変数（topBannerId）を欠いたパス（E2E-A08-01-007）。
 * 必須パス変数欠落時の具体ステータス（ルート不一致/404等）は要実機確認のため != 200 で判定する。
 */
export const MISSING_PATH_VAR_PATH = `${TOP_BANNER_PATH_PREFIX}/`;

/** 想定外クエリ項目（E2E-A08-01-006・要実機確認）。パス変数のみ参照され他クエリの扱いは正本に明記なし。 */
export const UNKNOWN_QUERY_PARAMS: Record<string, string> = { unknownField: "x", foo: "1" };

/** 想定外項目を併送するクエリを組み立てる（E2E-A08-01-006）。 */
export function buildUnknownQuery(): Record<string, string> {
  return { ...UNKNOWN_QUERY_PARAMS };
}

/** 本APIは認可方式が未特定（付帯表4#2・実装に認可属性なし＝実質公開）。正常系は資格情報を付与しない最小ヘッダ。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return {};
}

// ===== トップバナーID（SEED-A08-01-*）。env で供給し、未設定時は要実機確認の創作既定値 =====

/** SEED-A08-01-BANNER-KNOWN 実在するトップバナーID（正の整数）。path segment のため数値文字列。未設定は要実機確認。 */
export const KNOWN_BANNER_ID = process.env.A08_01_KNOWN_BANNER_ID || "1"; // 要実機確認（既知の実在ID）
/** SEED-A08-01-BANNER-NONE 該当の無いトップバナーID（未登録ID）＝find が null→404（E2E-A08-01-010/012/013）。 */
export const NONE_BANNER_ID = process.env.A08_01_NONE_BANNER_ID || "999999999";
/** 関連言語を持つ実在トップバナーID（languages 配列確認・E2E-A08-01-040）。未設定は KNOWN_BANNER_ID を流用。 */
export const LANG_RICH_BANNER_ID = process.env.A08_01_LANG_RICH_BANNER_ID || KNOWN_BANNER_ID;

/** 0以下のトップバナーID（E2E-A08-01-005）＝正常取得200とならない（具体ステータスは要実機確認）。 */
export const INVALID_ID_ZERO = process.env.A08_01_INVALID_ID_ZERO || "0";
/** 負値のトップバナーID（E2E-A08-01-005/016）。 */
export const INVALID_ID_NEGATIVE = process.env.A08_01_INVALID_ID_NEGATIVE || "-1";
/** 非数値（型不正）のトップバナーID（E2E-A08-01-030）。 */
export const NON_NUMERIC_ID = process.env.A08_01_NON_NUMERIC_ID || "abc";

// ===== 既知レコード期待値（E2E-A08-01-002/004/009 値照合）。env 供給。未設定なら値照合はスキップ＝要実機確認 =====

/** 取得結果の id 期待値（SEED既知レコード。通常 KNOWN_BANNER_ID と一致）。 */
export const EXPECTED_BANNER_ID = process.env.A08_01_EXPECTED_BANNER_ID || KNOWN_BANNER_ID;
/** 取得結果の imageUrl 期待値（SEED既知レコード）。再計算/丸めが行われない確認用（E2E-A08-01-002）。 */
export const EXPECTED_IMAGE_URL = process.env.A08_01_EXPECTED_IMAGE_URL;
/** 取得結果の link 期待値（SEED既知レコード）。 */
export const EXPECTED_LINK = process.env.A08_01_EXPECTED_LINK;
/** 取得結果の dispType 期待値（SEED既知レコード）。 */
export const EXPECTED_DISP_TYPE = process.env.A08_01_EXPECTED_DISP_TYPE;

/**
 * 404失敗応答の message（正本md レスポンス(失敗)「Not Found」）。
 * 実装は `{code, errors:['Not Found']}` 形（付帯表4#3）で乖離するが、仕様契約として message="Not Found" を期待値とする。
 */
export const NOT_FOUND_MESSAGE = "Not Found";

/**
 * 成功レスポンスのルート型（正本md レスポンス(成功)・camelCase 契約）。
 * 実装の snake_case（付帯表4#4）はオラクルに寄せない（spec の camelCase キーを契約とする）。
 */
export type TopBannerLanguage = {
  id: number;
  nameJp: string;
  nameEn: string;
  code: string;
};
export type TopBannerSuccessBody = {
  id: number;
  imageUrl: string;
  link: string;
  dispType: number;
  languages: TopBannerLanguage[];
};

/** 404失敗レスポンスのルート型（正本md レスポンス(失敗) `{code, message}`）。実装は `{code, errors}`（付帯表4#3）。 */
export type TopBannerErrorBody = {
  code: number;
  message: string;
};
