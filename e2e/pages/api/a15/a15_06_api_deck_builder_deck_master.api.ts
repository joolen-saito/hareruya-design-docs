/**
 * a15-06 デッキビルダー_マスタ取得（パスで指定したマスタ名に対応するマスタ全件を {code, results} ラッパで返す参照系GET JSON API）用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a15_06_api_deck_builder_deck_master_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは設計書(a15-06・正本md)入出力記載のリクエスト仕様（パス変数 name のみ）を最小構成で組む未実行雛形（実DBは呼ばない）。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/設計書由来であり、実装のレスポンス形・FW既定値を流用しない）:
 *  - 送信先は実装の実効パス `GET /api/master/{name}`。
 *    由来: `#[Route('/api/master/{name}', name:'api_deck_builder_master', methods:['GET','OPTIONS'])]`（MasterController.php:77）。
 *    設計書 pf-api `GET /master/{name}` とは `/api` プレフィクスで不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理。
 *  - 本APIは認証を行わない（クラスに認証属性・トークン検証なし／AbstractDeckBuilderController は CORS のみ）。
 *    jwt-token ヘッダの有無・正否によらず公開マスタを返す（005）。検証用ヘッダは env 供給し原値はコミットしない。
 *  - 成功本文は設計上 `{code:200, results:[...]}`（results 各要素キーは camelCase）。実装は snake_case 化＝付帯表4#3、Format の deckbuilderFlg 非公開＝付帯表4#4。
 *    spec は設計の camelCase / deckbuilderFlg 公開を期待し、実装が違えば落として検出する（期待値を実装へ寄せない）。
 *  - 失敗（公開外・不存在マスタ名）は 404＋本文 {code:404, message}（message実値の locale 差異は付帯表4#2）。
 *  - SEED マスタ名・既知件数は env で供給し原値はコミットしない。既定値は要実機確認の暫定（テスト環境固定値へ差し替える）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_06_READY。
 */

/**
 * マスタ取得API実効パスの組み立て。
 * 由来: MasterController.php:77（Route `/api/master/{name}`）。設計書 `/master/{name}` とは不一致（付帯表4#1）。
 */
export const MASTER_BASE_PATH = "/api/master";
export function masterPath(name: string): string {
  return `${MASTER_BASE_PATH}/${name}`;
}

// ===== SEED マスタ名・既知期待値（env 供給・原値非コミット。既定値は要実機確認の暫定） =====

/** SEED-A15-06-MASTER-PUBLIC: 公開対象の実在マスタ名（例 color）。件数・キー命名を照合できる既知マスタ。 */
export const PUBLIC_MASTER = process.env.A15_06_PUBLIC_MASTER || "color"; // 要実機確認
/** 公開対象マスタの既知全件数（results 要素数の照合用。集計条件＝全件）。未設定なら件数照合を行わない。 */
export const PUBLIC_MASTER_COUNT = parseCount(process.env.A15_06_PUBLIC_MASTER_COUNT); // 要実機確認

/** SEED-A15-06-MASTER-PUBLIC（受信検証）: アンダースコア区切りの実在マスタ名（例 campaign_tag → CampaignTag）。011で使用。 */
export const UNDERSCORE_MASTER = process.env.A15_06_UNDERSCORE_MASTER || "campaign_tag"; // 要実機確認

/** SEED-A15-06-MASTER-FORMAT: フォーマットマスタ名。deckbuilder_flg 真のみ取得を判定（040）。 */
export const FORMAT_MASTER = process.env.A15_06_FORMAT_MASTER || "format"; // 要実機確認

/** SEED-A15-06-MASTER-SUBTABLE: サブテーブルを持つマスタ名（カテゴリ・タグ）。子要素配列の有無を判定（041）。 */
export const SUBTABLE_CATEGORY_MASTER = process.env.A15_06_SUBTABLE_CATEGORY_MASTER || "category"; // 要実機確認
export const SUBTABLE_TAG_MASTER = process.env.A15_06_SUBTABLE_TAG_MASTER || "tag"; // 要実機確認

/** SEED-A15-06-MASTER-EMPTY: 公開対象だが行が0件のマスタ名。200かつ results 空配列を判定（008）。 */
export const EMPTY_MASTER = process.env.A15_06_EMPTY_MASTER || "empty_master"; // 要実機確認

/** SEED-A15-06-MASTER-NONE: 対応マスタクラスが存在しないマスタ名。404を判定（009,012,013）。 */
export const NONE_MASTER = process.env.A15_06_NONE_MASTER || "no_such_master"; // 要実機確認
/** 公開しないマスタ名（IGNORE_MASTERS＝Authority/Card/CardDetail のいずれか）。404を判定（016）。 */
export const NONPUBLIC_MASTER = process.env.A15_06_NONPUBLIC_MASTER || "authority"; // 要実機確認

/** 想定外クエリ項目（name はパス変数のみ参照＝MasterController.php:84。クエリは非参照）。010で使用。 */
export const UNEXPECTED_QUERY = { unexpected: "x", foo: "1" } as Record<string, string>;

/**
 * jwt-token 検証用ヘッダ。本APIは認証を行わない（jwt-token を参照しない）。005で有無・正否によらず取得可を確認。
 * 値は env 供給し原値はコミットしない。未設定なら不正トークンの暫定値を用いる（いずれも200が期待される）。
 */
export function buildJwtHeaders(token?: string): Record<string, string> {
  const value = token ?? process.env.A15_06_INVALID_JWT ?? "invalid.jwt.token"; // 要実機確認
  return { "jwt-token": value };
}

function parseCount(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}
