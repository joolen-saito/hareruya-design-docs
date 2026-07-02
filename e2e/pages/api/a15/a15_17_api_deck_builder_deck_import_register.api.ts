/**
 * a15-17 デッキビルダー_デッキインポート登録（デッキビルダー利用者が card_list テキストを解読してデッキを新規登録する JWT 認証つき POST JSON API）API/統合レイヤ用 パス／ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a15_17_api_deck_builder_deck_import_register_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a15-17) 入出力記載のリクエスト仕様（jwt-token ヘッダ付き POST）のみを最小構成で組む未実行雛形。実環境（deck-api）は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス形・バリデーション機構・FW既定値・DTO制約を期待値に流用しない）:
 *  - 送信先は実装の実効パス `POST /api/deck/import`（付帯表1/付帯表4#1）。
 *    由来: `#[Route('/api/deck/import', name: 'api_deck_builder_deck_import_post', methods: ['POST','OPTIONS'])]`（DeckController.php:667）。
 *          正本md `POST /deck/import` は `/api` プレフィクスを欠き不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理する。
 *  - 認証は `jwt-token` ヘッダ→`JwtPlayerAuthenticator::authenticate`（ImportDeckAction.php:62／JwtPlayerAuthenticator.php:35-53）。
 *    トークン欠落・署名検証失敗→`InvalidTokenException`、該当プレイヤーなし→`PlayerNotFoundException`（ImportDeckAction.php:63-65）、いずれも401（DeckController.php:698-702）。
 *    HS256 署名方式・クレーム名（正本md `aud`／実装 `sub`＝付帯表4#2）は要実機確認。テストは「有効JWTで成功・欠落/署名不正/該当なしで401」の意味で判定する。
 *  - format_id 不備→`InvalidRequestException('format_id is required')`→400（ImportDeckAction.php:82-85／DeckController.php:718-724）。
 *  - デッキ内容検証失敗→`BadRequestHttpException`→`InvalidRequestException`→400（ImportDeckAction.php:122-148,163-173／DeckController.php:726）。
 *  - card_list 行数上限500超過→`BadRequestHttpException`（CardUtil::decodeCardList MAX_LINE_COUNT=500・CardUtil.php:53-54。グローバルハンドラ依存＝付帯表4#8）。
 *  - `display_token` は `scope_id===3`(DISPLAY_UNLISTED・DeckController.php:54,735-738) の場合のみ応答に含む。`errors` は解読不可行があるときのみ含む（DeckController.php:740-742）。
 *  - 解読不可行ありの 206 切替は正本md仕様。実装は 206 を返さず常に 200 の可能性（付帯表4#3）→ 仕様どおり期待し違えば落として検出する（実装へ寄せない）。
 *  - 合否（成功）は HTTP200＋応答 `{code:200, message, deck_id}`、（部分成功）は 206＋`{code:206, errors, deck_id}`、（失敗）は 400/401/500＋`{code, message}` を仕様（正本md）由来で判定する。
 *  - 本APIはブラウザ向け画面を持たない（正本md）。登録副作用は永続化先テーブル（dtb_deck・dtb_deck_card・dtb_maybe_card・dtb_attraction_card・dtb_sticker_card）を直接DB照合（DB副作用観測）して判定する想定で、spec側はAPI応答を一次に置きDB照査で補完する（本リポでDBは実行しない）。
 *  - jwt-token原値・署名シークレット・閲覧用トークン原値は env で供給し原値はコミットしない（付帯表3）。SEED format_id・archetype_id・カード名等も env 供給（要実機確認の暫定値）。
 *    正本md未記載の DTO 追加項目（公開区分の永続化方式 private_flg/display_token＝付帯表4#9）は期待値・送信に含めない。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_17_READY。
 */

/** API実効パス。由来: DeckController.php:667（Route）＝実効 `POST /api/deck/import`。正本md `POST /deck/import`（接頭辞 `/api` なし）とは不一致（付帯表4#1）。 */
export const IMPORT_PATH = "/api/deck/import";

/**
 * デッキインポート登録エンドポイント実効パスを組む（パスパラメータなし）。
 * 由来: DeckController.php:667 ＝実効 `POST /api/deck/import`。差異は付帯表4#1で一元管理。
 */
export function buildImportPath(): string {
  return IMPORT_PATH;
}

/** 認証ヘッダ名。由来: 付帯表1（`jwt-token` ヘッダ→JwtPlayerAuthenticator）。 */
export const JWT_HEADER_NAME = "jwt-token";

// ===== JWT（env 供給・原値非コミット。既定値は要実機確認の暫定） =====

/**
 * 有効JWT（SEED-A15-17-JWT-PLAYER／該当プレイヤーあり）。HS256・有効署名・該当プレイヤーの利用者IDを含む。
 * 要実機確認: テスト環境固定の有効トークンへ差し替える（署名方式 HS256・クレーム名は付帯表4#2）。
 */
export const PLAYER_JWT = process.env.A15_17_JWT_PLAYER || "";

/** 署名不正トークン（E2E-A15-17-019）。署名シークレットを持たずに合成。実装は署名検証失敗で401を返すことを期待。 */
export const JWT_BAD_SIGNATURE =
  process.env.A15_17_JWT_BAD_SIGNATURE ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.invalid-signature-not-hs256";

/**
 * 署名は正しいが該当プレイヤーが存在しない利用者IDのトークン（E2E-A15-17-020／PlayerNotFoundException）。
 * 正しい署名には実機シークレットが要るため env 供給（要実機確認）。未設定時は合成値（署名不正として401となる）でフォールバック。
 */
export const JWT_NO_PLAYER =
  process.env.A15_17_JWT_NO_PLAYER ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTk5OTk5OSJ9.no-matching-player-signature";

/** jwt-token ヘッダ＋Content-Type を組む。token 未指定（undefined）または空なら jwt-token ヘッダを付けない。token 省略時は PLAYER_JWT。 */
export function buildJwtHeaders(token: string | undefined = PLAYER_JWT): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token !== undefined && token !== "") headers[JWT_HEADER_NAME] = token;
  return headers;
}

/** jwt-token を一切付与しないヘッダ（E2E-A15-17-018 欠落）。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

// ===== SEED マスタID・カード名（env 供給・既定は要実機確認の暫定） =====

/**
 * SEED マスタ・カード（付帯表3 SEED-A15-17-MASTER）。env 供給・既定値は要実機確認のプレースホルダ。HAS_API(A15_17_READY) ガード下でのみ送信される。
 *  - FORMAT_ID:           統率者使用設定OFFの既定フォーマット（処理フロー#3）。
 *  - FORMAT_COMMANDER_ID: 統率者使用設定ONのフォーマット（E2E-A15-17-012 の解読分岐）。
 *  - ARCHETYPE_ID:        アーキタイプ（dtb_deck.archetype_id・E2E-A15-17-025）。
 *  - IMAGE_CARD_ID:       代表カード画像ID（任意項目）。
 *  - CAMPAIGN_TAG_ID:     キャンペーンタグID（任意項目）。
 */
export const MASTER = {
  FORMAT_ID: Number(process.env.A15_17_FORMAT_ID || 1), // 要実機確認: SEED-A15-17-MASTER（統率者使用OFF）
  FORMAT_COMMANDER_ID: Number(process.env.A15_17_FORMAT_COMMANDER_ID || 2), // 要実機確認: 統率者使用ON のformat_id
  ARCHETYPE_ID: Number(process.env.A15_17_ARCHETYPE_ID || 1), // 要実機確認: SEED-A15-17-MASTER（アーキタイプ）
  IMAGE_CARD_ID: Number(process.env.A15_17_IMAGE_CARD_ID || 1), // 要実機確認: 代表カード画像ID
  CAMPAIGN_TAG_ID: Number(process.env.A15_17_CAMPAIGN_TAG_ID || 1), // 要実機確認: キャンペーンタグID
} as const;

/**
 * 公開区分 scope_id（正本md 入出力節：公開/非公開/限定公開）。実装は private_flg／display_token へ写像（DISPLAY_PUBLIC=1/PRIVATE=2/UNLISTED=3＝DeckController.php:52-54／付帯表4#9）。
 * テストは応答の display_token 含有有無（限定公開時のみ）で判定する。
 */
export const SCOPE = {
  PUBLIC: 1, // 公開
  PRIVATE: 2, // 非公開
  UNLISTED: 3, // 限定公開（display_token を応答に含む）
} as const;

/** card_list 行数上限（CardUtil.php:26,53-54 MAX_LINE_COUNT=500）。境界内/境界外の生成に使用。 */
export const CARD_LIST_MAX_LINES = 500;
export const CARD_LIST_OVER_MAX_LINES = 501;

// ===== card_list（synthetic。正本md 用語・入出力節由来。現行 deck-api 実環境は使わない） =====

/** SEED-A15-17-MASTER で解決（名前一致）できるカード名。要実機確認: 環境のカードマスタに存在する名へ差し替え。 */
export const READABLE_CARD_NAME = process.env.A15_17_CARD_NAME || "Lightning Bolt";

/** カードマスタに存在しないカード名（解読不可行＝errors 行番号照合用・E2E-A15-17-011/017）。 */
export const UNREADABLE_CARD_NAME = "___UNREADABLE_CARD_NAME_NOT_IN_MASTER___";

/**
 * card_list のボード区切りマーカー（synthetic placeholder）。
 * 要実機確認: 正本md 用語節・CardUtil の実解読仕様に合わせた区切り表現へ差し替える（統率/メイビー/アトラクション/ステッカー）。
 */
export const BOARD_SEPARATOR = {
  COMMANDER: process.env.A15_17_SEP_COMMANDER || "// Commander",
  MAYBE: process.env.A15_17_SEP_MAYBE || "// Maybe",
  ATTRACTION: process.env.A15_17_SEP_ATTRACTION || "// Attraction",
  STICKER: process.env.A15_17_SEP_STICKER || "// Sticker",
  SIDE: process.env.A15_17_SEP_SIDE || "// Sideboard",
} as const;

/** 解読可能な1行（枚数＋カード名）。 */
function readableLine(count = 4): string {
  return `${count} ${READABLE_CARD_NAME}`;
}

/** 解読可能行を count 行ぶん連結した card_list を組む（行数上限境界＝013/014 用）。 */
export function buildCardListLines(count: number): string {
  return Array.from({ length: count }, () => readableLine(1)).join("\n");
}

/** 全行解読可能な card_list（既定）。 */
export function buildReadableCardList(): string {
  return [readableLine(4), readableLine(4), readableLine(2)].join("\n");
}

/** 解読できない行（カード名未一致）を含む card_list（011/017）。0始まりインデックスの2行目（index 1）が解読不可。 */
export function buildUnreadableCardList(): string {
  return [readableLine(4), `1 ${UNREADABLE_CARD_NAME}`, readableLine(2)].join("\n");
}

/** 統率者区切りを含む card_list（012：区切り以降が統率ボード区分として解読される想定）。 */
export function buildCommanderCardList(): string {
  return [readableLine(1), BOARD_SEPARATOR.COMMANDER, readableLine(1)].join("\n");
}

/** メイン/サイド/統率の各ボードのカードを含む card_list（026）。 */
export function buildBoardCardList(): string {
  return [
    readableLine(4), // メイン
    BOARD_SEPARATOR.SIDE,
    readableLine(2), // サイド
    BOARD_SEPARATOR.COMMANDER,
    readableLine(1), // 統率
  ].join("\n");
}

/** ボード外区分（メイビー/アトラクション/ステッカー）を含む card_list（027）。 */
export function buildOffBoardCardList(): string {
  return [
    readableLine(4),
    BOARD_SEPARATOR.MAYBE,
    readableLine(1),
    BOARD_SEPARATOR.ATTRACTION,
    readableLine(1),
    BOARD_SEPARATOR.STICKER,
    readableLine(1),
  ].join("\n");
}

// ===== ペイロード（正本md 入出力節 記載フィールドのみで最小構成） =====

/** 想定外項目（037 手動・本specでは未使用）／異常値（038）に使う非整数値。 */
export const NON_INTEGER_VALUE = "abc";

/**
 * インポート登録ボディのオプション（正本md 入出力節: format_id・card_list・deck_name・scope_id・archetype_id・image_card_id・campaign_tag_ids）。
 * 未記載の DTO 追加項目（private_flg 等＝付帯表4#9）は含めない。
 */
export interface ImportPayloadOptions {
  formatId?: number | string | null;
  cardList?: string | null;
  deckName?: string | null;
  scopeId?: number | string | null;
  archetypeId?: number | string | null;
  imageCardId?: number | string | null;
  campaignTagIds?: number[] | null;
  /** 本文（028：text_main/side/command）。 */
  textMain?: string | null;
  textSide?: string | null;
  textCommand?: string | null;
}

/**
 * 正常インポート登録ボディ（format_id 指定・全行解読可 card_list・deck_name・scope_id=公開）。overrides で各種異常・境界・公開区分へ振る。
 * 未指定キーは既定値、`in opts` で渡されたキーは上書き（null/未指定の検証＝021/022/007 用に省略可能にする）。
 */
export function buildValidPayload(opts: ImportPayloadOptions = {}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  body.format_id = "formatId" in opts ? opts.formatId : MASTER.FORMAT_ID;
  body.card_list = "cardList" in opts ? opts.cardList : buildReadableCardList();
  body.deck_name = "deckName" in opts ? opts.deckName : "E2Eインポートデッキ";
  body.scope_id = "scopeId" in opts ? opts.scopeId : SCOPE.PUBLIC;
  body.archetype_id = "archetypeId" in opts ? opts.archetypeId : MASTER.ARCHETYPE_ID;
  if ("imageCardId" in opts) body.image_card_id = opts.imageCardId;
  if ("campaignTagIds" in opts) body.campaign_tag_ids = opts.campaignTagIds;
  if ("textMain" in opts) body.text_main = opts.textMain;
  if ("textSide" in opts) body.text_side = opts.textSide;
  if ("textCommand" in opts) body.text_command = opts.textCommand;
  return body;
}

/** card_list を空（空配列扱い）にしたボディ（007：未指定・空でも検証エラーにならず登録成功）。 */
export function buildEmptyCardListPayload(): Record<string, unknown> {
  return buildValidPayload({ cardList: "" });
}

/** 解読できない行を含む card_list のボディ（011：206＋errors）。 */
export function buildUnreadableLinePayload(): Record<string, unknown> {
  return buildValidPayload({ cardList: buildUnreadableCardList() });
}

/** 統率者使用設定 ON の format_id ＋統率者区切りを含む card_list のボディ（012：解読分岐）。 */
export function buildCommanderFormatPayload(): Record<string, unknown> {
  return buildValidPayload({ formatId: MASTER.FORMAT_COMMANDER_ID, cardList: buildCommanderCardList() });
}

/** 500行ちょうどの card_list のボディ（013：境界内・エラーなし）。 */
export function buildMaxLineCardListPayload(): Record<string, unknown> {
  return buildValidPayload({ cardList: buildCardListLines(CARD_LIST_MAX_LINES) });
}

/** 501行（上限超過）の card_list のボディ（014：400）。 */
export function buildOverMaxLineCardListPayload(): Record<string, unknown> {
  return buildValidPayload({ cardList: buildCardListLines(CARD_LIST_OVER_MAX_LINES) });
}

/** scope_id=限定公開のボディ（015：display_token 応答含有）。 */
export function buildUnlistedPayload(): Record<string, unknown> {
  return buildValidPayload({ scopeId: SCOPE.UNLISTED });
}

/** scope_id=非公開のボディ（016：display_token 非含有。公開でも非含有だが代表として非公開）。 */
export function buildNonUnlistedPayload(): Record<string, unknown> {
  return buildValidPayload({ scopeId: SCOPE.PRIVATE });
}

/** scope_id=限定公開かつ解読不可行を含むボディ（017：206＋display_token＋errors）。 */
export function buildUnlistedUnreadablePayload(): Record<string, unknown> {
  return buildValidPayload({ scopeId: SCOPE.UNLISTED, cardList: buildUnreadableCardList() });
}

/** format_id 未指定（必須欠落）のボディ（021：400 format_id required）。 */
export function buildMissingFormatIdPayload(): Record<string, unknown> {
  return buildValidPayload({ formatId: null });
}

/**
 * デッキ内容検証に失敗するボディ（022：400 検証エラー）。
 * deck_name を空・scope_id を不正値にしてデッキ内容検証（保存サービスの検証）を失敗させる想定。
 */
export function buildInvalidDeckContentPayload(): Record<string, unknown> {
  return buildValidPayload({ deckName: "", scopeId: NON_INTEGER_VALUE });
}

/** 複数項目が検証に失敗するボディ（023：400・一括返却構造は要確認＝付帯表4#5）。 */
export function buildMultipleErrorsPayload(): Record<string, unknown> {
  return buildValidPayload({ deckName: "", scopeId: NON_INTEGER_VALUE, archetypeId: NON_INTEGER_VALUE });
}

/** 異常なパラメータ値を含むボディ（038：400・整合性検証失敗）。format_id を非整数文字列にする。 */
export function buildInvalidParamPayload(): Record<string, unknown> {
  return buildValidPayload({ formatId: NON_INTEGER_VALUE });
}

/** deck_name・format_id・archetype_id を指定する正常ボディ（025：dtb_deck 本体登録）。 */
export function buildDeckBodyPayload(): Record<string, unknown> {
  return buildValidPayload({ deckName: "本体登録デッキ", archetypeId: MASTER.ARCHETYPE_ID });
}

/** メイン/サイド/統率の各ボードのカードを含むボディ（026：dtb_deck_card の board_id 区分）。 */
export function buildBoardCardListPayload(): Record<string, unknown> {
  return buildValidPayload({ cardList: buildBoardCardList() });
}

/** ボード外区分（メイビー/アトラクション/ステッカー）を含むボディ（027）。 */
export function buildOffBoardCardListPayload(): Record<string, unknown> {
  return buildValidPayload({ cardList: buildOffBoardCardList() });
}

/** メイン/サイド/統率の本文を含むボディ（028：dtb_deck.text_main/text_side/text_command）。 */
export function buildTextBodyPayload(): Record<string, unknown> {
  return buildValidPayload({
    cardList: buildBoardCardList(),
    textMain: "メイン本文",
    textSide: "サイド本文",
    textCommand: "統率本文",
  });
}

// ===== 正本md由来のレスポンスオラクル。実装文言の乖離は付帯表4で記録（テストは正本md由来で照合し違えば落として検出） =====

/** 成功時 code（正本md レスポンス成功）。 */
export const SPEC_CODE = {
  SUCCESS: 200,
  /** 解読不可行ありの部分成功（正本md 処理フロー#6。実装は206を返さない可能性＝付帯表4#3）。 */
  PARTIAL: 206,
} as const;

/** 成功時 message（E2E-A15-17-004：`Deck registration success by import`）。 */
export const SUCCESS_MESSAGE = "Deck registration success by import";

/**
 * 失敗系メッセージ（正本md レスポンス失敗 `{code, message}`。安定部分で照合し、正確文言は要確認）。
 *  - FORMAT_ID_REQUIRED: format_id 必須（実装文言 'format_id is required'＝ImportDeckAction.php:82-85。正本mdは必須の旨のみ）。
 *  - CARD_LIST_OVER_MAX: 行数上限超過（実装文言 'The maximum card list length is 500 lines'＝CardUtil.php:53-54。正本mdは上限超過の旨。400経路の確実性は付帯表4#8）。
 */
export const SPEC_MESSAGE = {
  FORMAT_ID_REQUIRED: "format_id",
  CARD_LIST_OVER_MAX: "500",
} as const;
