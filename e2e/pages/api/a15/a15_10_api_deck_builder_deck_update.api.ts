/**
 * a15-10 デッキビルダー_デッキ更新（JWT認証つき PUT API＝自所有デッキの更新。ブラウザ向け画面を持たないJSON API）API/統合レイヤ用 パス／ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a15_10_api_deck_builder_deck_update_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a15-10) 入出力記載のリクエスト仕様（jwt-token ヘッダ付き PUT）のみを最小構成で組む未実行雛形。deck-api実環境は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス形・FW既定値・JWTクレーム名・trans文言を期待値に流用しない）:
 *  - 送信先は実装の実効パス `PUT /api/deck/{id}`（付帯表1/付帯表4#1）。
 *    由来: `#[Route('/api/deck/{id}', name: 'api_deck_builder_deck_update', methods: ['PUT', 'OPTIONS'], requirements: ['id' => '\d+'])]`（src/Eccube/Controller/App/DeckBuilder/DeckController.php:124）＝実効 `/api/deck/{id}`。
 *          正本mdパス `PUT /deck/{id}` は `/api` プレフィクスを欠き不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理する。
 *  - 認証は `jwt-token` ヘッダ直接読み（DeckController.php:131）＋`JwtPlayerAuthenticator->authenticate`（UpdateDeckAction.php:68／JwtPlayerAuthenticator.php:35）。署名方式はHS256（正本md 認証・認可節）。
 *    トークン欠落/署名不正→`InvalidTokenException`→401（DeckController.php:140-144）。JWTの顧客IDに該当プレイヤーなし→`PlayerNotFoundException`→401（DeckController.php:140-144）。
 *    所有者外→`DeckAccessDeniedException`→**403**（DeckController.php:145-149）＝正本md仕様の401と乖離（付帯表4#3）。テストは仕様401で判定する。
 *    JWTクレームは正本md `aud`、実装は `sub` を顧客IDとして使用（付帯表4#2）＝SEED発行時は正常検証されるよう要実機確認。
 *  - 対象デッキなしは 404（DeckNotFoundException＝DeckController.php:150-154）。整合性検証失敗は 400（InvalidRequestException＝DeckController.php:155-156／validateDeck＝UpdateDeckAction.php:175-185）。
 *  - 合否（成功）は HTTP200＋応答 `{code:200, message}`、scope_id===限定公開(3) のとき `display_token` を付加（DeckController.php:164-174）。（失敗）は 400/401/404＋`{code, message}` を仕様（正本md）由来で判定する。
 *  - メッセージ文言は固定しない（正本mdは英語リテラル、実装はローカライズ trans＝付帯表4#4）。HTTPステータス・`{code, message}` 書式・code:200 で判定し、文言一致は要確認。
 *  - 即時保存（instant_save_flag真）はトランザクション内でDB更新（デッキ本体・採用カード全置換）＋当該デッキのRedis一時保存削除。下書き（偽/未指定）はDB更新せずRedisへJSON一時保存（既定1800秒）。
 *  - 本APIはブラウザ向け画面を持たない（正本md）。更新副作用は永続化先テーブル（dtb_deck・dtb_deck_card・dtb_maybe_card・dtb_attraction_card・dtb_sticker_card）を直接DB照合（DB副作用観測）して判定する想定で、spec側はAPI応答を一次に置きDB照査で補完する（本リポでDBは実行しない）。Redis一時保存の中身・削除は観測手段が取れず要実機確認。
 *  - jwt-token原値・署名シークレット（auth_magic）・限定公開トークン原値は env で供給し原値はコミットしない（付帯表3／正本md ログ・監査節）。SEED デッキID・マスタID も env 供給（要実機確認の暫定値）。
 *    正本mdに未定義の想定外項目（付帯表4#7）は期待値・送信に含めない。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_10_READY。
 */

/**
 * デッキ更新エンドポイント実効パスを組む（デッキID {id} を埋める）。
 * 由来: DeckController.php:124（Route `/api/deck/{id}`・requirements id=\d+）＝実効 `PUT /api/deck/{id}`。
 * 正本md `PUT /deck/{id}`（接頭辞 `/api` なし）とは不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理する。
 */
export function buildUpdatePath(deckId: string | number): string {
  return `/api/deck/${deckId}`;
}

/** 認証ヘッダ名。由来: DeckController.php:131（jwt-token ヘッダ直接読み）。 */
export const JWT_HEADER_NAME = "jwt-token";

// ===== JWT（env 供給・原値非コミット。既定値は要実機確認の暫定） =====

/**
 * 有効JWT（SEED-A15-10-JWT-PLAYER／対象デッキ所有プレイヤー）。HS256・有効署名・該当顧客IDを含む。
 * クレーム名は正本md `aud`／実装 `sub`（付帯表4#2）＝SEED発行時に正常検証されるよう要実機確認。
 */
export const JWT_PLAYER = process.env.A15_10_JWT_PLAYER || "";

/** 署名不正トークン（E2E-A15-10-023）。署名シークレットを持たずに合成＝token_handler 検証で401を期待。 */
export const JWT_BAD_SIGNATURE =
  process.env.A15_10_JWT_BAD_SIGNATURE ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.invalid-signature-not-hs256";

/**
 * 署名は正しいが顧客IDに該当プレイヤーが存在しないトークン（E2E-A15-10-022）。
 * 正しい署名には実機シークレットが要るため env 供給（要実機確認）。未設定時は合成値（署名不正として401となる）でフォールバック。
 */
export const JWT_NO_PLAYER =
  process.env.A15_10_JWT_NO_PLAYER ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTk5OTk5OSJ9.no-matching-player-signature";

/** jwt-token ヘッダ＋Content-Type を組む。token 未指定（undefined）／空なら jwt-token ヘッダを付けない（欠落系021）。token 省略時は JWT_PLAYER。 */
export function buildJwtHeaders(token: string | undefined = JWT_PLAYER): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token !== undefined && token !== "") headers[JWT_HEADER_NAME] = token;
  return headers;
}

/** jwt-token を一切付与しないヘッダ（E2E-A15-10-021 欠落）。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

// ===== SEED デッキID・マスタID（env 供給・既定は要実機確認の暫定。requirements id=\d+ のため数値文字列） =====

/**
 * SEED デッキID（付帯表3 SEED-A15-10-DECK）。env 供給・既定値は要実機確認のプレースホルダ。HAS_API(A15_10_READY) ガード下でのみ送信される。
 *  - TARGET:        認証プレイヤーが所有する更新対象の既知デッキ（既存採用カード・更新前のデッキ名/フォーマット/アーキタイプ/代表カード画像あり）。
 *  - OTHER:         区分整合用の更新対象外の別デッキ（050 で不変を確認）。
 *  - OTHER_PLAYER:  別プレイヤー所有のデッキ（024 他人デッキ更新拒否）。
 *  - NONEXISTENT:   存在しないデッキID（030）。
 */
export const DECK_ID = {
  TARGET: process.env.A15_10_DECK_ID || "1001", // 要実機確認: SEED-A15-10-DECK（対象デッキ）
  OTHER: process.env.A15_10_DECK_OTHER_ID || "1002", // 要実機確認: SEED-A15-10-DECK（別デッキ／区分整合050）
  OTHER_PLAYER: process.env.A15_10_DECK_OTHER_PLAYER_ID || "1003", // 要実機確認: SEED-A15-10-DECK（別プレイヤー所有／024）
  NONEXISTENT: process.env.A15_10_DECK_NONEXISTENT_ID || "99999999", // 存在しないデッキID（030）
} as const;

/**
 * 公開範囲 scope_id（正本md 入出力節・DeckController.php:52-54 定数）。
 *  - PUBLIC(1)/PRIVATE(2): display_token を付加しない（124）。
 *  - UNLISTED(3)=限定公開: 成功応答に display_token を付加（123）。
 */
export const SCOPE = {
  PUBLIC: 1,
  PRIVATE: 2,
  UNLISTED: 3,
} as const;

/**
 * 採用カードのボード区分 board_id（正本md 入出力 cards[]＝card_id/board_id/count。採用カード・メイビー・アトラクション・ステッカー）。
 * 区分値は正典に明示が無く要実機確認の暫定値（env 供給）。
 */
export const BOARD = {
  MAIN: Number(process.env.A15_10_BOARD_MAIN || 1), // 採用カード（メインボード）
  MAYBE: Number(process.env.A15_10_BOARD_MAYBE || 2), // メイビー
  ATTRACTION: Number(process.env.A15_10_BOARD_ATTRACTION || 3), // アトラクション
  STICKER: Number(process.env.A15_10_BOARD_STICKER || 4), // ステッカー
} as const;

/** 既知のフォーマットID（SEED-A15-10-MASTER）。整合性検証・レギュレーション判定に使用。要実機確認: 環境の投入値へ差し替え。 */
export const FORMAT_ID = Number(process.env.A15_10_FORMAT_ID || 5001);
/** 既知のアーキタイプID（SEED-A15-10-MASTER）。要実機確認。 */
export const ARCHETYPE_ID = Number(process.env.A15_10_ARCHETYPE_ID || 6001);
/** 既知のカードID（SEED-A15-10-MASTER／cards[].card_id・代表カード画像 image_card_id）。要実機確認。 */
export const CARD_ID = Number(process.env.A15_10_CARD_ID || 7001);
/** レギュレーション違反となるカードID（125／禁止・制限カード等）。要実機確認: 環境のレギュレーション違反カードへ差し替え。 */
export const REGULATION_VIOLATION_CARD_ID = Number(process.env.A15_10_REGULATION_VIOLATION_CARD_ID || 7999);
/** 整合性検証で許容枚数を超える count（040/046/048/110。正典に数値閾値の定義が無く要確認＝暫定の過大値）。 */
export const OVER_LIMIT_COUNT = Number(process.env.A15_10_OVER_LIMIT_COUNT || 99);

// ===== ペイロード（正本md 入出力節 記載フィールドのみで最小構成） =====

/** 採用カード1件（正本md 入出力: cards[]＝card_id/board_id/count）。 */
export interface DeckCardOptions {
  cardId?: number | string;
  boardId?: number | string;
  count?: number | string;
}

/** デッキ更新ボディのオプション（正本md 入出力: instant_save_flag・deck_name・format_id・archetype_id・scope_id・image_card_id・campaign_tag_ids・cards[]）。 */
export interface UpdatePayloadOptions {
  instantSaveFlag?: boolean | null;
  deckName?: string | null;
  formatId?: number | string | null;
  archetypeId?: number | string | null;
  scopeId?: number | string | null;
  imageCardId?: number | string | null;
  campaignTagIds?: Array<number | string>;
  cards?: Array<DeckCardOptions> | null;
}

/** 採用カード1件を組む（正本md 記載フィールドのみ）。未指定キーは既定（メインボード・整合性を満たす値）で補う。 */
export function buildCard(opts: DeckCardOptions = {}): Record<string, unknown> {
  const card: Record<string, unknown> = {};
  card.card_id = "cardId" in opts ? opts.cardId : CARD_ID;
  card.board_id = "boardId" in opts ? opts.boardId : BOARD.MAIN;
  card.count = "count" in opts ? opts.count : 4;
  return card;
}

/**
 * 正常更新ボディ（instant_save_flag=真・scope_id=公開(1)・整合性を満たす採用カード1件）。overrides で各種異常・境界・公開範囲へ振る。
 * 正本md入出力節記載のフィールドのみで最小構成（未記載項目は含めない）。
 */
export function buildValidPayload(opts: UpdatePayloadOptions = {}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  body.instant_save_flag = "instantSaveFlag" in opts ? opts.instantSaveFlag : true;
  body.deck_name = "deckName" in opts ? opts.deckName : "テストデッキ";
  body.format_id = "formatId" in opts ? opts.formatId : FORMAT_ID;
  body.archetype_id = "archetypeId" in opts ? opts.archetypeId : ARCHETYPE_ID;
  if ("scopeId" in opts) body.scope_id = opts.scopeId;
  else body.scope_id = SCOPE.PUBLIC;
  body.image_card_id = "imageCardId" in opts ? opts.imageCardId : CARD_ID;
  body.campaign_tag_ids = "campaignTagIds" in opts ? opts.campaignTagIds : [];
  if ("cards" in opts) body.cards = opts.cards;
  else body.cards = [buildCard()];
  return body;
}

/** scope_id を含まないボディ（047：必須未充足。正本mdはscope_id必須＝付帯表4#6。実装は既定0で続行・成功）。 */
export function buildMissingScopeIdPayload(): Record<string, unknown> {
  const body = buildValidPayload();
  delete (body as Record<string, unknown>).scope_id;
  return body;
}

/**
 * 採用カードの整合性検証に失敗するボディ（040/046/110：ボード区分ごとの制約違反）。
 * 採用カードの count を許容枚数超過（OVER_LIMIT_COUNT）にする。正典に数値閾値の定義が無く要確認（付帯表4#5・SEED-A15-10-MASTER で確定）。
 */
export function buildInvalidCardsPayload(): Record<string, unknown> {
  return buildValidPayload({ cards: [buildCard({ count: OVER_LIMIT_COUNT })] });
}

/**
 * デッキ本体の整合性検証に失敗するボディ（111：フォーマット・公開範囲・採用カードを設定したうえでデッキ本体の制約違反）。
 * デッキ名を空にしてデッキ本体制約を未充足にする（具体閾値は正典に数値定義が無く要確認＝SEED-A15-10-MASTER で確定）。
 */
export function buildInvalidDeckBodyPayload(): Record<string, unknown> {
  return buildValidPayload({ deckName: "" });
}

/** 採用カード・デッキ本体の必須制約を満たさないボディ（045：必須未充足→400・{code,message}）。 */
export function buildMissingRequiredPayload(): Record<string, unknown> {
  return buildValidPayload({ deckName: "", cards: [] });
}

/** 複数の整合性違反を同時に含むボディ（048：採用カードとデッキ本体に複数違反。複数件の返却構造・ソート順は固定しない＝付帯表4#5）。 */
export function buildMultipleViolationsPayload(): Record<string, unknown> {
  return buildValidPayload({
    deckName: "",
    cards: [buildCard({ count: OVER_LIMIT_COUNT }), buildCard({ boardId: BOARD.MAYBE, count: OVER_LIMIT_COUNT })],
  });
}

/** 汎用の異常ボディ（042/051：整合性検証に失敗する／デッキ本体・採用カードとも不正）。 */
export function buildInvalidPayload(): Record<string, unknown> {
  return buildValidPayload({ deckName: "", cards: [buildCard({ count: OVER_LIMIT_COUNT })] });
}

/** 既存と異なる採用カードで作り直すボディ（121：旧採用カードが残らないこと観測用。メイビー・アトラクション・ステッカーを含む）。 */
export function buildReplacedCardsPayload(): Record<string, unknown> {
  return buildValidPayload({
    cards: [
      buildCard({ count: 2 }),
      buildCard({ boardId: BOARD.MAYBE, count: 1 }),
      buildCard({ boardId: BOARD.ATTRACTION, count: 1 }),
      buildCard({ boardId: BOARD.STICKER, count: 1 }),
    ],
  });
}

/** レギュレーション違反となる採用カード構成のボディ（125：更新は妨げず200・違反フラグ保存）。 */
export function buildRegulationViolationPayload(): Record<string, unknown> {
  return buildValidPayload({ cards: [buildCard({ cardId: REGULATION_VIOLATION_CARD_ID, count: 4 })] });
}

/** 下書き保存ボディ（126：instant_save_flag=偽＝DB更新せずRedis一時保存）。 */
export function buildDraftPayload(): Record<string, unknown> {
  return buildValidPayload({ instantSaveFlag: false });
}

// ===== 正本md由来のメッセージ文言（オラクル）。実装はローカライズ trans 文言で乖離（付帯表4#4）。テストは文言を固定せず code/{code,message} 書式で判定する =====

/**
 * 正本md（レスポンス節）のメッセージ。実装は trans（ローカライズ）で食い違う（付帯表4#4）。
 * 本specは message 文言一致を assert せず（要確認）、HTTPステータス・`{code, message}` 書式・code:200 で判定する。参照用に保持。
 *  - UPDATE_SUCCESS:  成功（DeckController.php:166 `api.deck_builder.deck.update_success`）。
 *  - TOKEN_INCORRECT: 認証失敗（DeckController.php:143 `api.deck_builder.auth.token_incorrect`）。
 *  - AUTH_FAILED:     認証失敗（所有者外も正本md仕様では本文言だが実装は403＝付帯表4#3）。
 *  - DECK_NOT_FOUND:  対象デッキなし（DeckController.php:153 `api.deck_builder.deck.not_found`）。
 */
export const SPEC_MESSAGE = {
  UPDATE_SUCCESS: "Deck update success",
  TOKEN_INCORRECT: "Access Token is incorrect",
  AUTH_FAILED: "Authentication failed",
  DECK_NOT_FOUND: "The deck does not exist",
} as const;
