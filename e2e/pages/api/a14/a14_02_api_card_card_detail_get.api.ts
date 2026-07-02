/**
 * a14-02 カード詳細取得（GET参照系JSON API・カード詳細IDからカード詳細マスタ情報）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a14_02_api_card_card_detail_get_e2e_cases.md（付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a14-02) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形（コンパイル確認のみ）。
 *
 * 重要（付帯表4#1）: 設計書の利用者視点の入口 `GET /cardDetails/{id}` は ec-cube-enterprise の App 名前空間に未実装で、
 *   実効パスの file:line 根拠が確定できない。全API/統合ケースに `要実機確認` 修飾子が付くため spec 側は全件 test.fixme。
 *   送信先は設計書由来 `GET /cardDetails/{id}` とし、実効パス・認可方式・404本文形は実機確認で確定する。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋応答本文の構造/型/既知値」を仕様由来で判定する（オラクル独立性）。
 *  - foilFlg/promotionFlg は仕様の boolean を期待（実装エンティティ getter は int＝付帯表4#4）。
 *  - 除外指定プロパティ（cardLayoutId/promotionId/card/productSubs）非混入を期待（付帯表4#5）。
 *  - 設計未記載プロパティ（frameFlg 等）はオラクル化しない（付帯表4#7）。日時 ISO8601・camelCase は仕様（付帯表4#6）。
 *  - 既知SEED値・期待値は env で供給し、未設定時の既定値は創作値（要実機確認）。
 */

/**
 * 実効パス（ベース）＝設計書の利用者視点の入口由来。
 * 由来: 正本md a14-02 利用者視点の入口 `GET /cardDetails/{id}`（ec-cube-enterprise に未実装＝付帯表4#1・要実機確認）。
 * 取得は `MtbCardDetailRepository`（src/Eccube/Repository/Master/MtbCardDetailRepository.php）の主キー取得相当を想定。
 */
export const CARD_DETAIL_GET_PATH_BASE = "/cardDetails";

/** カード詳細ID（パス変数）を付与した送信先パスを組み立てる。 */
export function buildCardDetailPath(id: string | number): string {
  return `${CARD_DETAIL_GET_PATH_BASE}/${id}`;
}

/** 想定外クエリ項目（E2E-A14-02-014）。パス変数 id のみ参照を想定し他クエリは未参照。 */
export const UNKNOWN_QUERY_PARAMS: Record<string, string> = { unknownField: "x", foo: "1" };

/** 認可方式は pf-api 方針で未確定（付帯表4#2）。負例008も含め全件 fixme（要実機確認）。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return {};
}

// ===== SEED値（SEED-A14-02-*）。env で供給し、未設定時は要実機確認の創作既定値 =====

/** SEED-A14-02-DETAIL-KNOWN 既知の実在カード詳細ID（整数）。path に渡すため数値文字列。 */
export const KNOWN_DETAIL_ID = process.env.A14_02_KNOWN_DETAIL_ID || "1"; // 要実機確認: 実在カード詳細ID
/** SEED-A14-02-DETAIL-KNOWN（関連マスタが紐づく）実在カード詳細ID（E2E-A14-02-040）。 */
export const RELATED_DETAIL_ID = process.env.A14_02_RELATED_DETAIL_ID || KNOWN_DETAIL_ID; // 要実機確認

/** SEED-A14-02-DETAIL-NONE カード詳細マスタに存在しないカード詳細ID（未登録ID）（E2E-A14-02-010/015/016/019）。 */
export const NONE_DETAIL_ID = process.env.A14_02_NONE_DETAIL_ID || "999999999";

/** 異常パラメータ（id≦0）。id=0（E2E-A14-02-011）。 */
export const ZERO_DETAIL_ID = process.env.A14_02_ZERO_DETAIL_ID || "0";
/** 異常パラメータ（負値）（E2E-A14-02-011/019）。 */
export const NEGATIVE_DETAIL_ID = process.env.A14_02_NEGATIVE_DETAIL_ID || "-1";
/** 形式不正（非数値）（E2E-A14-02-012）。 */
export const NON_NUMERIC_DETAIL_ID = process.env.A14_02_NON_NUMERIC_DETAIL_ID || "abc";

// ===== 既知レコード期待値（E2E-A14-02-002/004/013 値照合）。env 供給。未設定なら値照合はスキップ＝要実機確認 =====

/** flavorJp の期待値（SEED既知レコード）。 */
export const EXPECTED_FLAVOR_JP = process.env.A14_02_EXPECTED_FLAVOR_JP;
/** cardNo の期待値（SEED既知レコード）。 */
export const EXPECTED_CARD_NO = process.env.A14_02_EXPECTED_CARD_NO;

/** 404失敗応答の message（正本md 入出力 レスポンス(失敗)「Not Found」／App例外整形規約と一致見込み・付帯表4#3で要確認）。 */
export const NOT_FOUND_MESSAGE = "Not Found";

/** 仕様の integer 型フィールド群（正本md 入出力 レスポンス(成功)。E2E-A14-02-006。backCardDetailId は未設定時 null）。 */
export const INTEGER_FIELDS = [
  "id",
  "cardId",
  "cardsetId",
  "rarityId",
  "illustratorId",
] as const;

/** 仕様の string 型フィールド群（正本md 入出力 レスポンス(成功)。E2E-A14-02-006）。 */
export const STRING_FIELDS = [
  "flavorJp",
  "flavorEn",
  "textJp",
  "textEn",
  "power",
  "toughness",
  "cardNo",
  "updateDate",
  "createDate",
] as const;

/** 仕様の boolean 型フィールド群（正本md 入出力 レスポンス(成功)。実装 getter は int＝付帯表4#4。E2E-A14-02-006）。 */
export const BOOLEAN_FIELDS = ["foilFlg", "promotionFlg"] as const;

/** 仕様の関連オブジェクト（object・未設定時 null）フィールド群（E2E-A14-02-040）。 */
export const RELATED_OBJECT_FIELDS = ["cardLayout", "rarity", "cardset", "illustrator", "promotion"] as const;

/** 仕様の関連配列フィールド（array・未設定時 空配列）（E2E-A14-02-040）。 */
export const RELATED_ARRAY_FIELDS = ["cardImages"] as const;

/**
 * 除外指定プロパティ（正本md 入出力 レスポンス(成功)「除外指定」。E2E-A14-02-041）。
 * 実装の除外設定の所在が刷新先で確認できない（付帯表4#5）。テストは非混入を期待し、混入すれば落ちて検出する。
 */
export const EXCLUDED_FIELDS = ["cardLayoutId", "promotionId", "card", "productSubs"] as const;

/** 成功レスポンスのルート型（正本md 入出力 レスポンス(成功)）。命名は仕様 camelCase。 */
export type CardDetailGetSuccessBody = {
  id: number;
  cardId: number;
  backCardDetailId: number | null;
  [key: string]: unknown;
};

/** 404失敗レスポンスのルート型（正本md 入出力 レスポンス(失敗)）。本文形は付帯表4#3で要確認。 */
export type CardDetailGetErrorBody = {
  code: number;
  message: string;
};
