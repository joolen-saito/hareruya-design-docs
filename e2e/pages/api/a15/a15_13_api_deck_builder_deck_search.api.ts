/**
 * a15-13 デッキビルダー_デッキ検索（検索条件に一致するデッキ一覧と総件数をページング付きで返す参照系JSON API・GET）API/統合レイヤ用 パス／クエリ／ヘルパ。
 * ケース表 integration_test/e2e/a15_13_api_deck_builder_deck_search_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認 / 付帯表5 網羅）に対応。
 * 本ファイルは正本md(a15-13) 入出力記載のリクエスト仕様（GET・クエリ絞り込み・mode=private 時のみ jwt-token 必須）のみを最小構成で組む未実行雛形。実環境（デッキビルダーアプリ）は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス形・FW既定値・追加フィールド・型を期待値に流用しない）:
 *  - 送信先は実装の実効パス `GET /api/decks`。
 *    由来: `#[Route('/api/decks', name: 'api_deck_builder_decks', methods: ['GET','OPTIONS'])]`（src/Eccube/Controller/App/DeckBuilder/DeckController.php:262）。
 *    正本md 利用者視点の入口 `GET /decks` は `/api` プレフィクスを欠き不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理する。
 *  - mode 検証は `in_array($mode,['public','private'],true)` 不一致で400（DeckController.php:272-277／trans key 未定義は付帯表4#9）。
 *  - mode=private は optionalAuthenticate→JwtPlayerAuthenticator::authenticate（DeckController.php:280-288／JwtPlayerAuthenticator.php:35-54）でプレイヤー特定不可なら401（message=`api.deck_builder.auth.token_incorrect`＝EN「Access Token is incorrect」）。
 *  - 認証ヘッダ名は本表で確定できないため `jwt-token` を暫定採用（要実機確認）。JWT クレームは正本 `aud`／実装 `sub` の乖離（付帯表4#7）。
 *  - per_page=min((int)..,100)・page=max((int)..,1)（DeckController.php:290-291）。デッキ種別いずれも対象外なら空＋total_count=0＋200（DeckController.php:326-345）。
 *  - 合否（成功）は HTTP200＋応答 `{code:200, message, total_count, decks}`、（失敗）は mode=private 認証失敗の401（{code,message}）。本APIは仕様上404を返さない（該当なしは200＋空配列）。
 *  - 絞り込みクエリの正確なキー名は本表で全量確定できないため正本md/付帯表1 文言（format/archetype/tag/campaign_tag_ids 等）で暫定採用（要実機確認）。DeckController.php:349-462。
 *  - SEED（フォーマット/アーキタイプ/タグ/キャンペーンタグID・JWT原値・cache_key）は env 供給。原値はコミットしない（付帯表3）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_13_READY。
 */

/** API実効パス。由来: DeckController.php:262（Route `/api/decks`）。正本md `/decks` とは `/api` 接頭辞で不一致（付帯表4#1）。 */
export const DECKS_PATH = "/api/decks";

/** クエリ値の型。配列は `key[]` 反復で直列化（campaign_tag_ids/tag 等。配列表記は要実機確認）。 */
export type QueryValue = string | number | boolean | Array<string | number>;
export type SearchQuery = Record<string, QueryValue>;

/**
 * 検索エンドポイント実効パスにクエリ文字列を付けて組む（`GET /api/decks?...`）。
 * 配列値は `key[]=v` の反復で直列化する（実装の配列受領形は要実機確認＝付帯表5 絞り込み代表のみカバー）。
 */
export function buildSearchPath(query: SearchQuery = {}): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const item of value) sp.append(`${key}[]`, String(item));
    } else {
      sp.append(key, String(value));
    }
  }
  const qs = sp.toString();
  return qs ? `${DECKS_PATH}?${qs}` : DECKS_PATH;
}

// ===== 認証ヘッダ（mode=private のみ必須。env 供給・原値非コミット。既定は要実機確認の暫定） =====

/** 認証ヘッダ名（暫定）。本表で確定できないため要実機確認。実装の JWT extractor に合わせて差し替える。 */
export const JWT_HEADER_NAME = "jwt-token";

/** 有効JWT（SEED-A15-13-PLAYER-OWNED／認証プレイヤー1）。HS256・有効署名・該当プレイヤーの顧客IDを含む。要実機確認: テスト環境固定の有効トークンへ差し替える。 */
export const PLAYER_JWT = process.env.A15_13_JWT_PLAYER || "";

/** 署名不正トークン（SEED-A15-13-AUTH-INVALID／署名改ざん・008/013/014/017）。署名シークレットを持たずに合成。実装は token 検証で401を期待。 */
export const JWT_BAD_SIGNATURE =
  process.env.A15_13_JWT_BAD_SIGNATURE ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.invalid-signature-not-hs256";

/** 署名は正しいが該当プレイヤーが存在しない顧客IDのトークン（SEED-A15-13-AUTH-INVALID／008）。正しい署名には実機シークレットが要るため env 供給（要実機確認）。未設定時は合成値（署名不正として401）でフォールバック。 */
export const JWT_NO_PLAYER =
  process.env.A15_13_JWT_NO_PLAYER ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTk5OTk5OSJ9.no-matching-player-signature";

/** jwt-token ヘッダを組む。token 未指定（undefined/空）なら付けない（欠落系007）。token 省略時は PLAYER_JWT。 */
export function buildJwtHeaders(token: string | undefined = PLAYER_JWT): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token !== undefined && token !== "") headers[JWT_HEADER_NAME] = token;
  return headers;
}

/** jwt-token を一切付与しないヘッダ（E2E-A15-13-007 欠落）。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return { Accept: "application/json" };
}

// ===== SEED 絞り込み値・ページング・cache_key（env 供給・既定は要実機確認の暫定） =====

/** 既知フォーマットID（SEED-A15-13-PUBLIC-DECKS／mtb_format）。020 絞り込み代表。要実機確認。 */
export const KNOWN_FORMAT_ID = Number(process.env.A15_13_FORMAT_ID || 1);
/** 既知アーキタイプID（SEED-A15-13-PUBLIC-DECKS／mtb_archetype）。020 絞り込み代表。要実機確認。 */
export const KNOWN_ARCHETYPE_ID = Number(process.env.A15_13_ARCHETYPE_ID || 1);
/** 既知デッキタグID（SEED-A15-13-PUBLIC-DECKS／mtb_deck_tag）。020 絞り込み代表。要実機確認。 */
export const KNOWN_TAG_ID = Number(process.env.A15_13_TAG_ID || 1);
/** 既知キャンペーンタグID（SEED-A15-13-PUBLIC-DECKS／mtb_campaign_tag）。020 絞り込み代表。要実機確認。 */
export const KNOWN_CAMPAIGN_TAG_ID = Number(process.env.A15_13_CAMPAIGN_TAG_ID || 1);

/** 一致デッキが存在しないフォーマットID（SEED-A15-13-NONE／012）。要実機確認: 環境に存在しない整数へ差し替え。 */
export const NONEXISTENT_FORMAT_ID = Number(process.env.A15_13_NONEXISTENT_FORMAT_ID || 99999999);

/** ページング既定値（021）。要実機確認: SEED の投入件数に合わせて調整。 */
export const DEFAULT_PAGE = Number(process.env.A15_13_PAGE || 1);
export const DEFAULT_PER_PAGE = Number(process.env.A15_13_PER_PAGE || 10);

/** per_page の最大丸め値（仕様・DeckController.php:290）。 */
export const PER_PAGE_MAX = 100;
/** per_page=最大超過（022／101件以上のSEED前提）。 */
export const PER_PAGE_OVER_MAX = 101;

/** cache_key（029）。任意のキー値。要実機確認: 環境の許容形式へ差し替え。 */
export const CACHE_KEY = process.env.A15_13_CACHE_KEY || "e2e-a15-13-cache-key";

/** 想定外クエリ項目（010）。絞り込みに使われない未知キー。 */
export const UNKNOWN_PARAM_KEY = "e2e_unknown_param";

// ===== クエリ・ビルダ（正本md/付帯表1 文言由来のキーのみで最小構成。配列・キー名は要実機確認） =====

/** 公開検索（mode=public）。省略時の既定でも可だが明示する。 */
export function publicSearchQuery(): SearchQuery {
  return { mode: "public" };
}

/** 自分のデッキ検索（mode=private・有効JWT前提）。 */
export function privateSearchQuery(): SearchQuery {
  return { mode: "private" };
}

/** 不正 mode（public/private 以外・009）。 */
export function invalidModeQuery(): SearchQuery {
  return { mode: "invalid" };
}

/** mode=public＋想定外クエリ項目（010）。 */
export function unknownParamQuery(): SearchQuery {
  return { mode: "public", [UNKNOWN_PARAM_KEY]: "1" };
}

/** フォーマット・アーキタイプ・タグ・キャンペーンタグの絞り込み（020）。配列指定時のみ絞り込み（DeckController.php:349-388）。 */
export function filterQuery(): SearchQuery {
  return {
    mode: "public",
    format: KNOWN_FORMAT_ID,
    archetype: KNOWN_ARCHETYPE_ID,
    tag: [KNOWN_TAG_ID],
    campaign_tag_ids: [KNOWN_CAMPAIGN_TAG_ID],
  };
}

/** ページング指定（021）。 */
export function pagingQuery(page: number = DEFAULT_PAGE, perPage: number = DEFAULT_PER_PAGE): SearchQuery {
  return { mode: "public", page, per_page: perPage };
}

/** per_page が最大超過（022／100丸め確認）。 */
export function perPageOverMaxQuery(): SearchQuery {
  return { mode: "public", per_page: PER_PAGE_OVER_MAX };
}

/** デッキ種別フラグが両方対象外（024／空＋total_count=0）。 */
export function deckTypeNoneQuery(): SearchQuery {
  return { mode: "public", event_deck_flag: 0, user_deck_flag: 0 };
}

/** 一致デッキが存在しない条件（012／SEED-A15-13-NONE）。 */
export function noMatchQuery(): SearchQuery {
  return { mode: "public", format: NONEXISTENT_FORMAT_ID };
}

/** cache_key 指定の公開検索（029）。 */
export function cacheKeyQuery(): SearchQuery {
  return { mode: "public", cache_key: CACHE_KEY };
}

// ===== 仕様（正本md）由来のオラクル定数。実装の乖離は付帯表4で記録（テストは正本md値で照合し違えば落として検出） =====

/** 成功時 message（入出力 レスポンス(成功)）。実装は未定義transキー文字列を返す可能性＝付帯表4#2。 */
export const SUCCESS_MESSAGE = "Deck search success";

/** mode=private 認証失敗 message（008・付帯表4#9）。EN「Access Token is incorrect」（trans `api.deck_builder.auth.token_incorrect`）。 */
export const AUTH_ERROR_MESSAGE = "Access Token is incorrect";

/** 成功本文トップレベルのフィールド構成（006・入出力 レスポンス(成功)）。実装の追加 cache_key は付帯表4#3。 */
export const TOP_LEVEL_FIELDS = ["code", "message", "total_count", "decks"] as const;

/** decks 各要素の型契約（006）。実装の deck_private_flag int 化＝付帯表4#4、日時 ISO8601 乖離＝付帯表4#5。 */
export const DECK_INTEGER_FIELDS = ["id", "format_id", "archetype_id", "card_id", "ranking", "participants", "scope_id"] as const;
export const DECK_STRING_FIELDS = ["deck_name", "format_name_jp", "format_name_en", "create_date", "update_date"] as const;
export const DECK_BOOLEAN_FIELDS = ["deck_private_flag"] as const;
export const DECK_ARRAY_FIELDS = ["deck_tags", "campaign_tags"] as const;

/** private 限定公開デッキに含まれるトークンフィールド（025）。実装は UNLISTED 限定＝付帯表4#6。 */
export const DISPLAY_TOKEN_FIELD = "display_token";

/** deck_tags 各要素のフィールド（028）。 */
export const DECK_TAG_FIELDS = ["id", "name_jp", "name_en"] as const;
/** campaign_tags 各要素のフィールド（028。is_during: 開催前0/中1/後2）。 */
export const CAMPAIGN_TAG_FIELDS = ["id", "name_jp", "name_en", "is_during"] as const;
