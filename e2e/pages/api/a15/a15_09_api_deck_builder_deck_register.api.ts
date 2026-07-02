/**
 * a15-09 デッキビルダー_デッキ登録（JWT認証つき POST API＝デッキビルダー利用者のデッキ新規登録。ブラウザ向け画面を持たない JSON API）API/統合レイヤ用 パス／ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a15_09_api_deck_builder_deck_register_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a15-09) 入出力節記載のリクエスト仕様（jwt-token ヘッダ付き POST・JSON ボディ）のみを最小構成で組む未実行雛形。deck-api（現行）実環境は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス形・FW既定値・DTO/エンティティ制約・ロケール文言を期待値に流用しない）:
 *  - 送信先は実装の実効パス `POST /api/deck`（付帯表1/付帯表4#1）。
 *    由来: `#[Route('/api/deck', name: 'api_deck_builder_deck_post', methods: ['POST','OPTIONS'])]`（DeckController.php:75）＝実効パス。
 *          正本md `POST /deck` は `/api` プレフィクスを欠き不一致（付帯表4#1）。テストは実効パスへ送信し本差異を記録する。
 *  - 認証は `jwt-token` ヘッダ→`JwtPlayerAuthenticator`（DeckController.php:81／JwtPlayerAuthenticator.php:34-51）。
 *    トークン欠落・検証失敗→`InvalidTokenException`、該当プレイヤーなし→`PlayerNotFoundException`、いずれも401（DeckController.php:88-92）。
 *    JWTクレーム名（正本md `aud` ／実装 `sub`）・HS256署名検証の実方式は要実機確認（付帯表4#2）。テストは「有効JWTで成功・欠落/署名不正/該当なしで401」の意味で判定する。
 *  - 合否（成功）は HTTP200＋本文 `{code:200, message, deck_id}`（限定公開scope_id=3のみ display_token を含む＝DeckController.php:101-120,107-115）を仕様由来で判定（spec側）。
 *    成功メッセージは正本md「Deck register success」を期待（実装文言 ja/en は乖離＝付帯表4#3）。テストは正本md文言で照合し違えば落として検出する。
 *  - 合否（失敗）は 検証失敗＝400＋`{code, message}`（DeckController.php:93-94）／認証拒否＝401／保存例外＝500（本specでは手動・要実機）。
 *    複数エラーの返却構造（配列/連結文字列）は正典未定義につき固定しない（付帯表4#5）。
 *  - 本APIはブラウザ向け画面を持たない（正本md）。登録副作用は永続化先テーブル（dtb_deck・dtb_deck_card・dtb_maybe_card・dtb_attraction_card・dtb_sticker_card）を
 *    直接DB照合（DB副作用観測）して判定する想定で、spec側はAPI応答を一次に置きDB照査で補完する（本リポでDBは実行しない）。
 *  - jwt-token原値・署名シークレット・限定公開トークン原値は env で供給し原値はコミットしない（付帯表3）。SEED マスタID・カードIDも env 供給（要実機確認の暫定値）。
 *    正本md入出力節 記載フィールドのみで組み、実装DTOの追加項目（公開範囲の private_flg／display_token 写像＝付帯表4#7）は期待値・送信に含めない。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_09_READY。
 */

/**
 * デッキ登録API実効パス。
 * 由来: DeckController.php:75（Route `#[Route('/api/deck', name: 'api_deck_builder_deck_post', methods: ['POST','OPTIONS'])]`）。
 * 正本md `POST /deck`（`/api` プレフィクスなし）とは不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理する。
 */
export const DECK_REGISTER_PATH = "/api/deck";

/** 認証ヘッダ名。由来: DeckController.php:81／JwtPlayerAuthenticator.php（`jwt-token` ヘッダ）。 */
export const JWT_HEADER_NAME = "jwt-token";

// ===== JWT（env 供給・原値非コミット。既定値は要実機確認の暫定） =====

/**
 * 有効JWT（SEED-A15-09-JWT-PLAYER／有効なプレイヤーに紐づく）。HS256・有効署名・該当プレイヤーの利用者IDを含む。
 * 要実機確認: a15 デッキビルダー用ログインAPI またはenv供給のテスト環境固定トークンへ差し替える（署名検証方式・クレーム名は付帯表4#2）。
 */
export const PLAYER_JWT = process.env.A15_09_JWT_PLAYER || "";

/** 署名不正トークン（E2E-A15-09-035）。署名シークレットを持たずに合成。実装は検証失敗で401を返すことを期待。 */
export const JWT_BAD_SIGNATURE =
  process.env.A15_09_JWT_BAD_SIGNATURE ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.invalid-signature-not-hs256";

/**
 * 署名は正しいが該当プレイヤーが存在しない利用者IDのトークン（E2E-A15-09-035・PlayerNotFoundException）。
 * 正しい署名には実機シークレットが要るため env 供給（要実機確認）。未設定時は合成値（署名不正として401となる）でフォールバック。
 */
export const JWT_NO_PLAYER =
  process.env.A15_09_JWT_NO_PLAYER ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTk5OTk5OSJ9.no-matching-player-signature";

/** jwt-token ヘッダ＋Content-Type を組む。token 未指定（undefined）または空文字なら jwt-token を付けない（欠落系034）。token 省略時は PLAYER_JWT。 */
export function buildJwtHeaders(token: string | undefined = PLAYER_JWT): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token !== undefined && token !== "") headers[JWT_HEADER_NAME] = token;
  return headers;
}

/** jwt-token を一切付与しないヘッダ（E2E-A15-09-034 欠落）。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

// ===== SEED マスタ・カードID（env 供給・既定は要実機確認の暫定。SEED-A15-09-MASTER） =====

/** フォーマットID（mtb_format／正本md 入出力 format_id）。要実機確認: 環境の投入値へ差し替え。 */
export const FORMAT_ID = Number(process.env.A15_09_FORMAT_ID || 1); // 要実機確認
/** アーキタイプID（mtb_archetype／archetype_id）。 */
export const ARCHETYPE_ID = Number(process.env.A15_09_ARCHETYPE_ID || 1); // 要実機確認
/** 代表カード画像ID（mtb_card_image／image_card_id）。 */
export const IMAGE_CARD_ID = Number(process.env.A15_09_IMAGE_CARD_ID || 1); // 要実機確認
/** キャンペーンタグID群（mtb_deck_tag／campaign_tag_ids）。 */
export const CAMPAIGN_TAG_IDS: number[] = (process.env.A15_09_CAMPAIGN_TAG_IDS || "1")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isFinite(n)); // 要実機確認

/** ボード区分（mtb_board／正本md: メイン1・サイド2・統率領域3・メイビー4・アトラクション5・ステッカー6）。 */
export const BOARD = {
  MAIN: 1,
  SIDE: 2,
  COMMANDER: 3,
  MAYBE: 4,
  ATTRACTION: 5,
  STICKER: 6,
} as const;

/** 公開範囲（正本md 入出力 scope_id: 公開1・非公開2・限定公開3。実装は private_flg／display_token へ写像＝付帯表4#7）。 */
export const SCOPE = {
  PUBLIC: 1,
  PRIVATE: 2,
  UNLISTED: 3,
} as const;

/**
 * 採用カードID（カードマスタ／SEED-A15-09-MASTER）。要実機確認: 環境の投入値へ差し替え。
 *  - MAIN/SIDE/COMMANDER: 各ボードへ振り分ける通常カード。
 *  - MAYBE/ATTRACTION/STICKER: board_id=4/5/6 のカード（122 振り分け登録）。
 *  - BANNED:        当該フォーマットで禁止/制限されたカード（128）。
 *  - FORMAT_INVALID: 当該フォーマットに適合しないカード（130）。
 *  - NON_LEGENDARY: 統率領域の伝説条件を満たさないカード（131）。
 */
export const CARD = {
  MAIN: Number(process.env.A15_09_CARD_MAIN || 1001), // 要実機確認
  SIDE: Number(process.env.A15_09_CARD_SIDE || 1002), // 要実機確認
  COMMANDER: Number(process.env.A15_09_CARD_COMMANDER || 1003), // 要実機確認（伝説条件を満たす統率者）
  MAYBE: Number(process.env.A15_09_CARD_MAYBE || 1004), // 要実機確認
  ATTRACTION: Number(process.env.A15_09_CARD_ATTRACTION || 1005), // 要実機確認
  STICKER: Number(process.env.A15_09_CARD_STICKER || 1006), // 要実機確認
  BANNED: Number(process.env.A15_09_CARD_BANNED || 1007), // 要実機確認（禁止/制限カード・128）
  FORMAT_INVALID: Number(process.env.A15_09_CARD_FORMAT_INVALID || 1008), // 要実機確認（フォーマット不適合・130）
  NON_LEGENDARY: Number(process.env.A15_09_CARD_NON_LEGENDARY || 1009), // 要実機確認（伝説条件違反・131）
} as const;

/** マスタに存在しないフォーマットID（マスタ解決を伴う検証失敗＝032）。要実機確認: 環境のマスタ範囲外IDへ差し替え。 */
export const NONEXISTENT_FORMAT_ID = Number(process.env.A15_09_FORMAT_NONEXISTENT_ID || 99999999);
/** マスタに存在しないカードID（マスタ解決を伴う検証失敗＝032）。 */
export const NONEXISTENT_CARD_ID = Number(process.env.A15_09_CARD_NONEXISTENT_ID || 99999999);

// ===== 採用カード（正本md 入出力: cards[].card_id / board_id / count） =====

/** 採用カード1件のオプション（正本md 記載フィールドのみ）。未指定キーは送らない（board_id/count 欠落の必須検証＝100/101 用に省略可能にする）。 */
export interface CardOptions {
  cardId?: number;
  boardId?: number;
  count?: number;
}

/** 採用カード1件を組む（正本md 記載フィールドのみ）。"in opts" 判定で未指定キーは送出しない（必須子項目欠落の検証用）。 */
export function buildCard(opts: CardOptions = {}): Record<string, unknown> {
  const card: Record<string, unknown> = {};
  card.card_id = "cardId" in opts ? opts.cardId : CARD.MAIN;
  if ("boardId" in opts) card.board_id = opts.boardId;
  else card.board_id = BOARD.MAIN;
  if ("count" in opts) card.count = opts.count;
  else card.count = 4;
  return card;
}

// ===== デッキ登録ボディ（正本md 入出力節 記載フィールドのみで最小構成） =====

/** 登録ボディのオプション（正本md: deck_name・format_id・archetype_id・scope_id・image_card_id・campaign_tag_ids・cards[]）。 */
export interface DeckPayloadOptions {
  deckName?: string;
  formatId?: number;
  archetypeId?: number;
  scopeId?: number;
  imageCardId?: number;
  campaignTagIds?: number[];
  cards?: Record<string, unknown>[];
}

/** 正常デッキ登録ボディ。overrides で各種異常・境界・公開範囲・違反へ振る。既定はメイン/サイド/統率領域の正常採用カード。 */
export function buildValidPayload(opts: DeckPayloadOptions = {}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  body.deck_name = "deckName" in opts ? opts.deckName : "E2E A15-09 デッキ";
  body.format_id = "formatId" in opts ? opts.formatId : FORMAT_ID;
  body.archetype_id = "archetypeId" in opts ? opts.archetypeId : ARCHETYPE_ID;
  body.scope_id = "scopeId" in opts ? opts.scopeId : SCOPE.PUBLIC;
  body.image_card_id = "imageCardId" in opts ? opts.imageCardId : IMAGE_CARD_ID;
  body.campaign_tag_ids = "campaignTagIds" in opts ? opts.campaignTagIds : CAMPAIGN_TAG_IDS;
  body.cards =
    "cards" in opts
      ? opts.cards
      : [
          buildCard({ cardId: CARD.MAIN, boardId: BOARD.MAIN, count: 4 }),
          buildCard({ cardId: CARD.SIDE, boardId: BOARD.SIDE, count: 2 }),
          buildCard({ cardId: CARD.COMMANDER, boardId: BOARD.COMMANDER, count: 1 }),
        ];
  return body;
}

/** 公開範囲のみ差し替えた正常ボディ（014 公開／123 限定公開／127 公開・非公開）。 */
export function buildScopePayload(scopeId: number): Record<string, unknown> {
  return buildValidPayload({ scopeId });
}

/** 全任意項目（deck_name・format_id・archetype_id・scope_id・image_card_id・campaign_tag_ids・cards）を未指定にしたボディ（015/103）。 */
export function buildAllOptionalOmittedPayload(): Record<string, unknown> {
  return {};
}

/** メイン/サイド/統率領域の採用カードを含むボディ（121：dtb_deck_card への card_id・board_id・count 登録観測用）。 */
export function buildMainSideCommanderPayload(): Record<string, unknown> {
  return buildValidPayload({
    cards: [
      buildCard({ cardId: CARD.MAIN, boardId: BOARD.MAIN, count: 4 }),
      buildCard({ cardId: CARD.SIDE, boardId: BOARD.SIDE, count: 2 }),
      buildCard({ cardId: CARD.COMMANDER, boardId: BOARD.COMMANDER, count: 1 }),
    ],
  });
}

/** board_id=4/5/6 のカードを含むボディ（122：メイビー/アトラクション/ステッカーの各テーブル振り分け登録観測用）。 */
export function buildBoardSplitPayload(): Record<string, unknown> {
  return buildValidPayload({
    cards: [
      buildCard({ cardId: CARD.MAYBE, boardId: BOARD.MAYBE, count: 1 }),
      buildCard({ cardId: CARD.ATTRACTION, boardId: BOARD.ATTRACTION, count: 1 }),
      buildCard({ cardId: CARD.STICKER, boardId: BOARD.STICKER, count: 1 }),
    ],
  });
}

// ===== 検証エラー系ボディ（正本md バリデーション節） =====

/** cards 要素の board_id 未指定ボディ（100：採用カード必須子項目欠落）。 */
export function buildMissingBoardIdPayload(): Record<string, unknown> {
  return buildValidPayload({ cards: [buildCard({ cardId: CARD.MAIN, count: 4 })] });
}

/** cards 要素の count 未指定ボディ（101：採用カード必須子項目欠落）。 */
export function buildMissingCountPayload(): Record<string, unknown> {
  return buildValidPayload({ cards: [buildCard({ cardId: CARD.MAIN, boardId: BOARD.MAIN })] });
}

/**
 * デッキ本体の制約に違反するボディ（102／011／030／036／041：デッキ本体検証エラー）。
 * format_id をマスタ非存在値にしてデッキ本体（フォーマット）整合性検証を失敗させる（正典の検証順では保存より前に弾かれる）。
 */
export function buildDeckBodyViolationPayload(): Record<string, unknown> {
  return buildValidPayload({ formatId: NONEXISTENT_FORMAT_ID });
}

/** 複数項目が検証に失敗するボディ（031：board_id 欠落の採用カード＋マスタ非存在フォーマット）。全件まとめ返却の構造は正典未定義（付帯表4#5）。 */
export function buildMultipleErrorsPayload(): Record<string, unknown> {
  return buildValidPayload({
    formatId: NONEXISTENT_FORMAT_ID,
    cards: [buildCard({ cardId: CARD.MAIN, count: 4 })], // board_id 欠落
  });
}

/** マスタ解決を伴う項目が検証に失敗するボディ（032：フォーマット・カードのマスタ解決失敗）。 */
export function buildMasterResolutionErrorPayload(): Record<string, unknown> {
  return buildValidPayload({
    cards: [buildCard({ cardId: NONEXISTENT_CARD_ID, boardId: BOARD.MAIN, count: 4 })],
  });
}

// ===== レギュレーション違反系ボディ（正本md バリデーション節の5判定種別。各→200＋regulation_violation_flg保存・登録は妨げない） =====

/** 枚数範囲（統率領域・メインボード・サイドボード）を外れる採用カード構成（124）。メインボードのcountを範囲外（過大）にする。 */
export function buildRegulationCountRangePayload(): Record<string, unknown> {
  return buildValidPayload({
    cards: [buildCard({ cardId: CARD.MAIN, boardId: BOARD.MAIN, count: 999 })],
  });
}

/** 禁止/制限カードを含む採用カード構成（128）。 */
export function buildRegulationBannedPayload(): Record<string, unknown> {
  return buildValidPayload({
    cards: [buildCard({ cardId: CARD.BANNED, boardId: BOARD.MAIN, count: 1 })],
  });
}

/** 同一カードを4枚制限を超えて採用する構成（129）。 */
export function buildRegulationOverFourPayload(): Record<string, unknown> {
  return buildValidPayload({
    cards: [buildCard({ cardId: CARD.MAIN, boardId: BOARD.MAIN, count: 5 })],
  });
}

/** 当該フォーマットに適合しないカードを含む採用カード構成（130）。 */
export function buildRegulationFormatInvalidPayload(): Record<string, unknown> {
  return buildValidPayload({
    cards: [buildCard({ cardId: CARD.FORMAT_INVALID, boardId: BOARD.MAIN, count: 1 })],
  });
}

/** 統率領域の伝説条件を満たさない採用カード構成（131）。 */
export function buildRegulationCommanderLegendaryPayload(): Record<string, unknown> {
  return buildValidPayload({
    cards: [buildCard({ cardId: CARD.NON_LEGENDARY, boardId: BOARD.COMMANDER, count: 1 })],
  });
}

// ===== 正本md由来の成功メッセージ文言（オラクル）。実装文言の乖離は付帯表4#3で記録（テストは正本md文言で照合し違えば落として検出） =====

/**
 * 正本md レスポンス(成功)・サンプルの成功メッセージ。
 * 実装は `api.deck_builder.deck.register_success`＝ja「デッキ登録に成功しました」／en「Deck registration succeeded」で文言が乖離（付帯表4#3）。
 * テストは正本md文言で照合する。
 */
export const SPEC_SUCCESS_MESSAGE = "Deck register success";
