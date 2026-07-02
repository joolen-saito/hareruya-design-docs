/**
 * a14-03 カード単一検索（GET参照系JSON API・検索クエリに一致するカード1件）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a14_03_api_card_card_search_single_e2e_cases.md（付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a14-03) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形（コンパイル確認のみ）。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋応答本文の構造/型/既知値」を仕様由来で判定する（オラクル独立性）。
 *  - 応答フィールドは仕様の入出力定義 `id`/`nameJp`/`nameEn`/`image_url` を期待（命名規約 camelCase と image_url の差異＝付帯表4#2）。
 *  - 障害時500応答（付帯表4#3）・特殊文字 `+` のエンコード（付帯表4#4）はオラクルへ寄せない（前者は対象外/手動、後者は fixme）。
 *  - 既知SEED値・期待値は env で供給し、未設定時の既定値は創作値（要実機確認）。
 *  - 本APIは認可属性を持たず App firewall `^/api/v1/` に不該当＝事実上匿名（付帯表4#1）。負例001は手動・要実機確認のため本specには無い。
 */

/**
 * 実効パス。
 * 由来: `#[Route(path: '/card', name: 'card_by_params', methods: ['GET'])]`（src/Eccube/Controller/App/CardController.php:41）。
 *       App配下はプレフィクスなし（app/config/eccube/routes.yaml:5-7）＝実効パス `GET /card`。設計書 `GET /card` と一致。
 */
export const CARD_SEARCH_PATH = "/card";

/**
 * 拡張子あり別ルート（同一処理）。`#[Route('/card.json', methods:['GET'])]`（CardController.php:42）。
 * 設計に明記なしの補足（付帯表4#5。乖離ではない）。
 */
export const CARD_SEARCH_JSON_PATH = "/card.json";

/** name クエリを組み立てる（`name=(string)$request->query->get('name','')`＝CardController.php:45）。 */
export function buildNameQuery(name: string): Record<string, string> {
  return { name };
}

/** name ＋ lang クエリ（E2E-A14-03-041。`lang=...get('lang','en')`＝CardController.php:46。'ja'で日本語優先）。 */
export function buildNameLangQuery(name: string, lang: string): Record<string, string> {
  return { name, lang };
}

/** name ＋ 想定外項目を併送するクエリ（E2E-A14-03-006）。name/lang のみ参照され他は未参照（CardController.php:45-46）。 */
export function buildNameQueryWithExtra(name: string): Record<string, string> {
  return { name, unknownField: "x", foo: "1" };
}

/** name 未指定（空）クエリ（E2E-A14-03-031）。name 空相当は該当なし→404（CardController.php:45,49-50）。 */
export const EMPTY_QUERY: Record<string, string> = {};

/** 本APIは認可属性を持たない（付帯表4#1）。負例001は手動・要実機確認のため本specには無い。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return {};
}

// ===== 検索語（SEED-A14-03-*）。env で供給し、未設定時は要実機確認の創作既定値 =====

/** SEED-A14-03-CARD-KNOWN 既知の実在カード名（日名または英名）。 */
export const KNOWN_CARD_NAME = process.env.A14_03_KNOWN_CARD_NAME || "要実機確認-既知カード名";
/** SEED-A14-03-CARD-KNOWN（複数候補を持つ）優先言語切替確認用のカード名（E2E-A14-03-041）。 */
export const MULTI_LANG_CARD_NAME = process.env.A14_03_MULTI_LANG_CARD_NAME || KNOWN_CARD_NAME;
/** SEED-A14-03-CARD-KNOWN（複数一致し得る）カード名（E2E-A14-03-042）。 */
export const MULTI_MATCH_CARD_NAME = process.env.A14_03_MULTI_MATCH_CARD_NAME || KNOWN_CARD_NAME;
/** SEED-A14-03-CARD-SPLIT 分割カード名（日名/英名・英名/日名・`+`連結）（E2E-A14-03-040）。 */
export const SPLIT_CARD_NAME = process.env.A14_03_SPLIT_CARD_NAME || "要実機確認-分割カード名";

/** SEED-A14-03-CARD-NONE どのカードにも一致しないカード名（E2E-A14-03-005/008/025/030/033）＝該当なし→404。 */
export const NONE_CARD_NAME = process.env.A14_03_NONE_CARD_NAME || "zzz-該当なし-xyzzy-0000";

/** lang 値（'ja'＝日本語優先・省略時は英語優先 'en'）（E2E-A14-03-041）。 */
export const LANG_JA = "ja";

// ===== 既知レコード期待値（E2E-A14-03-002/024/036 値照合）。env 供給。未設定なら値照合はスキップ＝要実機確認 =====

/** nameJp の期待値（SEED既知レコード）。 */
export const EXPECTED_NAME_JP = process.env.A14_03_EXPECTED_NAME_JP;
/** nameEn の期待値（SEED既知レコード）。 */
export const EXPECTED_NAME_EN = process.env.A14_03_EXPECTED_NAME_EN;
/** image_url の期待値（SEED既知レコード。画像情報からの導出値）。 */
export const EXPECTED_IMAGE_URL = process.env.A14_03_EXPECTED_IMAGE_URL;

/** 404失敗応答の message（正本md 入出力 レスポンス(失敗)「Not Found」／実装 NotFoundException('Not Found')＝CardController.php:50,55）。 */
export const NOT_FOUND_MESSAGE = "Not Found";

/**
 * 成功レスポンスのルート型（正本md 入出力 レスポンス(成功)）。
 * `image_url` は snake_case のまま定義（入出力表が image_url を定義＝付帯表4#2。命名規約 camelCase との整合は要確認）。
 */
export type CardSearchSuccessBody = {
  id: number;
  nameJp: string;
  nameEn: string;
  image_url: string;
};

/** 404失敗レスポンスのルート型（正本md 入出力 レスポンス(失敗)）。 */
export type CardSearchErrorBody = {
  code: number;
  message: string;
};
