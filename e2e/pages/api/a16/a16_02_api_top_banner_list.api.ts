/**
 * a16-02 トップバナー一覧（言語コード指定・GET参照系JSON API）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a16_02_api_top_banner_list_e2e_cases.md（付帯表1 実効パス / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a16-02) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形（コンパイル確認のみ）。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋応答本文の構造/型/既知値」を仕様由来で判定する（オラクル独立性）。
 *  - 応答プロパティは仕様の camelCase（imageUrl/dispType/nameJp/nameEn）を期待し、実装の snake_case（付帯表4#1）へ寄せない。
 *  - トップレベルはラップオブジェクトを持たないトップバナーオブジェクトの配列（正本md レスポンス(成功)）。
 *  - 404本文は仕様の {code, message} を期待し、実装の {code, errors:['Not Found']}（付帯表4#3）へ寄せない。具体メッセージ文言は要実機確認。
 *  - 404条件は処理フロー#3=OR（言語不存在 or バナー0件）を上位採用（入出力(失敗)=AND との不整合は付帯表4#4）。
 *  - 既知SEED値・期待値は env で供給し、未設定時の既定値は創作値（要実機確認）。
 *  - 認可方式は pf-api 方針で未確定＝当該パスは `^/api/v1/` 不一致でJWT対象外の可能性（付帯表4#2）。資格情報の負例(008)・正常呼び出し(005)は要実機確認。
 */

/**
 * 実効パス（パス変数つき）。
 * 由来: `#[Route(path: '/topBanners/{languageCode}', name: 'top_banners_by_language_code', methods: ['GET'])]`
 *       （src/Eccube/Controller/App/ContentController.php:87）。`app_controllers` はプレフィクスなし（routes.yaml:5-7）ため実効パスは
 *       `GET /topBanners/{languageCode}`。実装には `.json` サフィックス付き余剰ルート（同:86）もあるが設計記載は無く（付帯表4#5）、
 *       テストは設計記載の `/topBanners/{languageCode}` へ送信する。
 */
export function buildTopBannersPath(languageCode: string): string {
  return `/topBanners/${languageCode}`;
}

/**
 * パス変数（languageCode）欠落パス（E2E-A16-02-007）。
 * 必須パス変数を欠いたリクエストは正しい一覧（正常取得200）とならない（ルート不一致/404等の具体ステータスは要実機確認）。
 */
export const TOP_BANNERS_MISSING_CODE_PATH = "/topBanners/";

/** 想定外クエリ項目（E2E-A16-02-014）。languageCode のみ参照され他クエリは未参照（想定／200固定は正本に明記なし＝要実機確認）。 */
export const UNKNOWN_QUERY_PARAMS: Record<string, string> = { unknownField: "x", foo: "1" };

/** 本APIは当メソッドに認可属性が無い（ContentController.php:86-88）。認可方式は pf-api 方針で未確定（付帯表4#2）。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return {};
}

// ===== 言語コード（SEED-A16-02-*）。env で供給し、未設定時は要実機確認の創作既定値 =====

/** SEED-A16-02-LANG-BANNER 設定済みトップバナーが紐づく実在の言語コード（例 ja）。 */
export const LANG_BANNER_CODE = process.env.A16_02_LANG_BANNER_CODE || "ja";
/** SEED-A16-02-LANG-EMPTY 言語マスタに存在するが設定済みバナーが0件の言語コード（E2E-A16-02-010/015）＝404。 */
export const LANG_EMPTY_CODE = process.env.A16_02_LANG_EMPTY_CODE || "要実機確認-バナー0件言語コード";
/** SEED-A16-02-LANG-NONE 言語マスタに存在しない言語コード（E2E-A16-02-011/016/019）＝404。 */
export const LANG_NONE_CODE = process.env.A16_02_LANG_NONE_CODE || "zz";

// ===== languages 子フィールド期待値（任意・E2E-A16-02-013 受信検証補完）。env 供給 =====

/** 返却される各バナーの languages に含まれるべき指定言語コード（E2E-A16-02-013）。未設定なら LANG_BANNER_CODE を使用。 */
export const EXPECTED_CONTAINED_CODE = process.env.A16_02_EXPECTED_CONTAINED_CODE || LANG_BANNER_CODE;

/** 404失敗応答の message（正本md 入出力 レスポンス(失敗)）。実装は {code, errors:['Not Found']}（付帯表4#3）だがオラクルに寄せない。文言は要実機確認。 */
export const NOT_FOUND_MESSAGE = process.env.A16_02_NOT_FOUND_MESSAGE || "Language code is not found";

/**
 * 成功レスポンス各要素の型（正本md 入出力 レスポンス(成功)）。
 * プロパティは仕様の camelCase（実装 snake_case は付帯表4#1。型は spec 側で検査）。
 */
export type TopBannerItem = {
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

/** 成功レスポンスのルート型＝トップバナーオブジェクトの配列（ラップなし）。 */
export type TopBannerListSuccessBody = TopBannerItem[];

/** 404失敗レスポンスのルート型（正本md 入出力 レスポンス(失敗)）。実装本文形 {code, errors} は付帯表4#3。 */
export type TopBannerListErrorBody = {
  code: number;
  message: string;
};
