/**
 * a08-02 API_トップバナー一覧（GET参照系JSON API・言語コードで一覧取得）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a08_02_api_top_banner_list_e2e_cases.md（付帯表3 SEED / 付帯表4 不具合候補）に対応。
 * 本ファイルは正本md(a08-02) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形（コンパイル確認のみ）。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋応答本文の構造/型/既知値」を仕様（設計書・観点表）由来で判定する（オラクル独立性）。
 *  - 成功フィールド名は仕様の camelCase（配列各要素 id・imageUrl・link・dispType・languages[].{id,nameJp,nameEn,code}）を契約とする。
 *    実装は snake_case（image_url 等・付帯表4#2）で乖離するが期待値を実装へ寄せない。
 *  - 404本文は仕様 `{code, message}`（message="Language code is not found"）。実装は `{code, errors}`／'Not Found'（付帯表4#1）で乖離。
 *  - 0件（言語あり・バナー空）は仕様で404と定義（付帯表4#4）。言語なし・バナー空の両分岐とも404（処理フロー#3 OR・付帯表4#3）。
 *  - 認可方式は未確定（付帯表4#5・/topBanners は JWTファイアウォール対象外で実質公開）。既知SEED値は env で供給し未設定時は創作値（要実機確認）。
 */

/**
 * 実効パス（テンプレート）。
 * 由来: `#[Route(path: '/topBanners/{languageCode}', name: 'top_banners_by_language_code', methods: ['GET'])]`
 *       （src/Eccube/Controller/App/ContentController.php:87）＋prefixなし（app/config/eccube/routes.yaml:6-8）＝実効 `GET /topBanners/{languageCode}`。
 * 設計md の `GET /topBanners/{languageCode}` と実効パスは一致。
 */
export const TOP_BANNERS_PATH_PREFIX = "/topBanners";

/** トップバナー一覧取得パスを組み立てる（GET /topBanners/{languageCode}）。 */
export function buildTopBannersPath(languageCode: string): string {
  return `${TOP_BANNERS_PATH_PREFIX}/${languageCode}`;
}

/**
 * `.json` サフィックス別名ルート（付帯表4#6）。
 * 由来: `#[Route(path: '/topBanners/{languageCode}.json', name: 'top_banners_by_language_code_json', methods: ['GET'])]`
 *       （ContentController.php:86）。実効パスは本体と同一処理（応答同一性は要確認）。一覧本体パスとの差分確認用に保持。
 */
export function buildTopBannersJsonPath(languageCode: string): string {
  return `${TOP_BANNERS_PATH_PREFIX}/${languageCode}.json`;
}

/**
 * パス変数（languageCode）を欠いたパス（E2E-A08-02-007）。
 * 必須パス変数欠落時の具体ステータス（ルート不一致/404等）は要実機確認のため != 200 で判定する。
 */
export const MISSING_PATH_VAR_PATH = `${TOP_BANNERS_PATH_PREFIX}/`;

/** 想定外クエリ項目（E2E-A08-02-011・要実機確認）。パス変数のみ参照され他クエリの扱いは正本に明記なし。 */
export const UNKNOWN_QUERY_PARAMS: Record<string, string> = { unknownField: "x", foo: "1" };

/** 想定外項目を併送するクエリを組み立てる（E2E-A08-02-011）。 */
export function buildUnknownQuery(): Record<string, string> {
  return { ...UNKNOWN_QUERY_PARAMS };
}

/** 本APIは認可方式が未確定（付帯表4#5・JWTファイアウォール対象外＝実質公開）。正常系は資格情報を付与しない最小ヘッダ。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return {};
}

// ===== 言語コード（SEED-A08-02-*）。env で供給し、未設定時は要実機確認の創作既定値 =====

/** SEED-A08-02-LANG-BANNER 設定済みバナーが紐づく実在言語コード（例 ja）。未設定は要実機確認。 */
export const KNOWN_LANGUAGE_CODE = process.env.A08_02_KNOWN_LANGUAGE_CODE || "ja"; // 要実機確認（設定済みバナーあり）
/** SEED-A08-02-LANG-NONE 言語マスタに存在しない言語コード（例 zz）＝findOneBy 空→404（言語なし分岐）。 */
export const NONE_LANGUAGE_CODE = process.env.A08_02_NONE_LANGUAGE_CODE || "zz";
/** SEED-A08-02-LANG-NOBANNER 言語マスタに存在するが設定済みバナー0件の言語コード＝getTopBanners 空→404（バナー空分岐）。未設定は要実機確認。 */
export const NOBANNER_LANGUAGE_CODE = process.env.A08_02_NOBANNER_LANGUAGE_CODE || "xx"; // 要実機確認（言語あり・バナー0件）

// ===== 既知レコード期待値（E2E-A08-02-002 値照合）。env 供給。未設定なら値照合はスキップ＝要実機確認 =====

/** 一覧先頭要素の imageUrl 期待値（SEED既知レコード）。再計算/丸めが行われない確認用（E2E-A08-02-002）。 */
export const EXPECTED_IMAGE_URL = process.env.A08_02_EXPECTED_IMAGE_URL;
/** 一覧先頭要素の link 期待値（SEED既知レコード）。 */
export const EXPECTED_LINK = process.env.A08_02_EXPECTED_LINK;
/** 一覧先頭要素の dispType 期待値（SEED既知レコード）。 */
export const EXPECTED_DISP_TYPE = process.env.A08_02_EXPECTED_DISP_TYPE;

/**
 * 404失敗応答の message（正本md レスポンス(失敗)「Language code is not found」）。
 * 実装は `{code, errors:['Not Found']}` 形（付帯表4#1）で乖離するが、仕様契約として本値を期待値とする。
 */
export const NOT_FOUND_MESSAGE = "Language code is not found";

/**
 * 一覧成功レスポンスの要素型（正本md レスポンス(成功)・camelCase 契約）。
 * 実装の snake_case（付帯表4#2）はオラクルに寄せない（spec の camelCase キーを契約とする）。
 */
export type TopBannerLanguage = {
  id: number;
  nameJp: string;
  nameEn: string;
  code: string;
};
export type TopBannerListItem = {
  id: number;
  imageUrl: string;
  link: string;
  dispType: number;
  languages: TopBannerLanguage[];
};
/** 一覧成功レスポンスのルート型＝要素配列（正本md レスポンス(成功)）。 */
export type TopBannerListBody = TopBannerListItem[];

/** 404失敗レスポンスのルート型（正本md レスポンス(失敗) `{code, message}`）。実装は `{code, errors}`（付帯表4#1）。 */
export type TopBannerListErrorBody = {
  code: number;
  message: string;
};
