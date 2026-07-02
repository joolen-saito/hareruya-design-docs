/**
 * a15-18 デッキビルダー_デッキインポート更新（JWT認証つき PUT API＝自所有の既存デッキをカードリストテキストで上書き更新するJSON API。ブラウザ向け画面を持たない）API/統合レイヤ用 パス／ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a15_18_api_deck_builder_deck_import_update_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a15-18) 入出力記載のリクエスト仕様（jwt-token ヘッダ付き PUT・card_list テキスト）のみを最小構成で組む未実行雛形。deck-api実環境は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス形・FW既定値・JWTクレーム名・trans文言・バリデーション機構を期待値に流用しない）:
 *  - 送信先は実装の実効パス `PUT /api/deck/import/{id}`（付帯表1/付帯表4#1）。
 *    由来: `#[Route('/api/deck/import/{id}', name: 'api_deck_builder_deck_import_put', methods: ['PUT', 'OPTIONS'], requirements: ['id' => '\d+'])]`（src/Eccube/Controller/App/DeckBuilder/DeckController.php:677）＝実効 `/api/deck/import/{id}`。
 *          正本mdパス `PUT /deck/import/{id}` は `/api` プレフィクスを欠き不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理する。
 *  - 認証は `jwt-token` ヘッダ直接読み（DeckController.php:686）＋`JwtPlayerAuthenticator->authenticate`（ImportDeckAction.php:59）→`JwtTokenService->verifyToken`。署名方式はHS256（正本md 認証・認可節）。
 *    トークン欠落/署名不正→`InvalidTokenException`→401（DeckController.php:697-701）。JWTの顧客IDに該当プレイヤーなし→`PlayerNotFoundException`→401（DeckController.php:697-701／JwtPlayerAuthenticator.php:52）。
 *    所有者外→`DeckAccessDeniedException`→401「Authentication failed」（DeckController.php:702-706／ImportDeckAction.php:71-75）＝正本md仕様401と一致（a15-10の403乖離とは異なる）。
 *    JWTクレームは正本md `aud`、実装は `sub` を顧客IDとして使用（付帯表4#3）＝SEED発行時は正常検証されるよう要実機確認。
 *  - 対象デッキなしは 404「The deck does not exist」（DeckNotFoundException＝DeckController.php:707-711）。format_id未指定は 400（InvalidRequestException('format_id is required')＝DeckController.php:719-723）。整合性検証失敗は 400（validateDeck→BadRequestHttpException→InvalidRequestException＝DeckController.php:725／ImportDeckAction.php:140-149,161-172）。
 *  - card_list 上限は 500行（MAX_LINE_COUNT＝CardUtil.php:26）。超過/不正行→BadRequestHttpException（CardUtil.php:53-54,161,169）はトランザクション外で送出されコントローラの catch 対象外＝Symfony既定の400となるが本文が `{code, message}` 形でない可能性（付帯表4#7）。期待は正本md仕様（400＋`{code, message}`）で固定し違えば落として検出。
 *  - 合否（成功）は HTTP200＋応答 `{code:200, message, deck_id}`、scope_id===限定公開 のとき `display_token` を付加（DeckController.php:735-738）。解読不能行あり時は正本mdでHTTP・本文codeとも206へ切替（処理フロー#7・レスポンス節）＋`errors` 付加。実装はHTTP・本文codeとも200のまま errors 配列のみ付加（DeckController.php:730,740-744）＝付帯表4#2。テストは正本md仕様の206で判定し落として検出する。
 *  - メッセージ文言は固定しない（正本mdは英語リテラル、実装はローカライズ trans＝付帯表4#4）。HTTPステータス・`{code, message, deck_id}` 書式・code:200/206 で判定し、文言一致は要確認。複数検証は実装が空白結合の単一 message で返す（付帯表4#5）ため全件個別列挙の構造・ソート順は固定しない。
 *  - 本APIはブラウザ向け画面を持たない（正本md）。更新副作用は永続化先テーブル（dtb_deck・dtb_deck_card・dtb_maybe_card・dtb_attraction_card・dtb_sticker_card）を直接DB照合（DB副作用観測）して判定する想定で、spec側はAPI応答を一次に置きDB照査で補完する（本リポでDBは実行しない）。当該デッキのRedis下書き削除は観測手段が取れず要実機確認（付帯表4#8）。
 *  - jwt-token原値・署名シークレット（auth_magic）・限定公開トークン原値は env で供給し原値はコミットしない（付帯表3／正本md ログ・監査節）。SEED デッキID・マスタID・card_list行 も env 供給（要実機確認の暫定値）。
 *    正本mdに未定義の想定外項目（付帯表4 / 091）は期待値・送信に含めない。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_18_READY。
 */

/**
 * デッキインポート更新エンドポイント実効パスを組む（デッキID {id} を埋める）。
 * 由来: DeckController.php:677（Route `/api/deck/import/{id}`・requirements id=\d+）＝実効 `PUT /api/deck/import/{id}`。
 * 正本md `PUT /deck/import/{id}`（接頭辞 `/api` なし）とは不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理する。
 */
export function buildImportUpdatePath(deckId: string | number): string {
  return `/api/deck/import/${deckId}`;
}

/** 認証ヘッダ名。由来: DeckController.php:686（jwt-token ヘッダ直接読み）。 */
export const JWT_HEADER_NAME = "jwt-token";

// ===== JWT（env 供給・原値非コミット。既定値は要実機確認の暫定） =====

/**
 * 有効JWT（SEED-A15-18-JWT-PLAYER／対象デッキ所有プレイヤー）。HS256・有効署名・該当顧客IDを含む。
 * クレーム名は正本md `aud`／実装 `sub`（付帯表4#3）＝SEED発行時に正常検証されるよう要実機確認。
 */
export const JWT_PLAYER = process.env.A15_18_JWT_PLAYER || "";

/** 署名不正トークン（E2E-A15-18-021）。署名シークレットを持たずに合成＝検証で401を期待。 */
export const JWT_BAD_SIGNATURE =
  process.env.A15_18_JWT_BAD_SIGNATURE ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.invalid-signature-not-hs256";

/**
 * 署名は正しいが顧客IDに該当プレイヤーが存在しないトークン（E2E-A15-18-022）。
 * 正しい署名には実機シークレットが要るため env 供給（要実機確認）。未設定時は合成値（署名不正として401となる）でフォールバック。
 */
export const JWT_NO_PLAYER =
  process.env.A15_18_JWT_NO_PLAYER ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTk5OTk5OSJ9.no-matching-player-signature";

/** jwt-token ヘッダ＋Content-Type を組む。token 未指定（undefined）／空なら jwt-token ヘッダを付けない（欠落系020/024）。token 省略時は JWT_PLAYER。 */
export function buildJwtHeaders(token: string | undefined = JWT_PLAYER): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token !== undefined && token !== "") headers[JWT_HEADER_NAME] = token;
  return headers;
}

/** jwt-token を一切付与しないヘッダ（E2E-A15-18-020/024 欠落）。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

// ===== SEED デッキID・マスタID（env 供給・既定は要実機確認の暫定。requirements id=\d+ のため数値文字列） =====

/**
 * SEED デッキID（付帯表3 SEED-A15-18-DECK）。env 供給・既定値は要実機確認のプレースホルダ。HAS_API(A15_18_READY) ガード下でのみ送信される。
 *  - TARGET:        認証プレイヤーが所有する更新対象の既知デッキ（既存採用カード・ボード外カード・更新前のデッキ名/フォーマット/アーキタイプ/本文・公開区分あり）。
 *  - OTHER_PLAYER:  別プレイヤー所有のデッキ（023 他人デッキ更新拒否→401）。
 *  - NONEXISTENT:   存在しないデッキID（030→404）。
 */
export const DECK_ID = {
  TARGET: process.env.A15_18_DECK_ID || "1001", // 要実機確認: SEED-A15-18-DECK（対象デッキ）
  OTHER_PLAYER: process.env.A15_18_DECK_OTHER_PLAYER_ID || "1003", // 要実機確認: SEED-A15-18-DECK（別プレイヤー所有／023）
  NONEXISTENT: process.env.A15_18_DECK_NONEXISTENT_ID || "99999999", // 存在しないデッキID（030）
} as const;

/**
 * 公開範囲 scope_id（正本md 入出力節・display_token 付加条件＝DeckController.php:735-738）。
 *  - PUBLIC/PRIVATE: display_token を付加しない（061）。
 *  - UNLISTED=限定公開: 成功応答に display_token を付加（060）。
 * 区分値は正典の定数（DISPLAY_UNLISTED 等）に依存し要実機確認の暫定値（env 供給）。
 */
export const SCOPE = {
  PUBLIC: Number(process.env.A15_18_SCOPE_PUBLIC || 1),
  PRIVATE: Number(process.env.A15_18_SCOPE_PRIVATE || 2),
  UNLISTED: Number(process.env.A15_18_SCOPE_UNLISTED || 3),
} as const;

/** 既知のフォーマットID（SEED-A15-18-MASTER）。整合性検証・レギュレーション判定に使用。要実機確認: 環境の投入値へ差し替え。 */
export const FORMAT_ID = Number(process.env.A15_18_FORMAT_ID || 5001);
/** 既知のアーキタイプID（SEED-A15-18-MASTER）。要実機確認。 */
export const ARCHETYPE_ID = Number(process.env.A15_18_ARCHETYPE_ID || 6001);
/** 既知の代表カードID（SEED-A15-18-MASTER／image_card_id）。要実機確認。 */
export const IMAGE_CARD_ID = Number(process.env.A15_18_IMAGE_CARD_ID || 7001);

/** card_list 上限行数。由来: CardUtil.php:26（MAX_LINE_COUNT＝500）。 */
export const MAX_LINE_COUNT = 500;

/**
 * 解読可能な card_list の1行（カード名がマスタで解決できる行＝SEED-A15-18-MASTER）。
 * card_list 表記（枚数＋カード名）は正典のフォーマットに依存し要実機確認の暫定値。env 供給で環境の解決可能行へ差し替える。
 */
export const DECODABLE_CARD_LINE = process.env.A15_18_CARD_LINE || "4 Island";

/**
 * 解読不能となる card_list の1行（カード名がマスタで未一致＝形式は妥当だが decodeCardList の errors に記録される行）。
 * 050/051 で使用。env 供給で環境の未一致名へ差し替える（要実機確認）。
 */
export const UNDECODABLE_CARD_LINE = process.env.A15_18_UNDECODABLE_LINE || "4 ZZZ_NoSuchCardNameXYZ";

/** 整合性検証に違反する card_list の1行（採用カード制約違反＝枚数超過等）。正典に数値閾値の定義が無く要確認（付帯表4・SEED-A15-18-MASTER で確定）。 */
export const INVALID_CARD_LINE = process.env.A15_18_INVALID_CARD_LINE || "99 Island";

// ===== card_list 生成ヘルパ（テキスト＝改行区切り） =====

/** 指定行を n 回繰り返した card_list テキストを組む。 */
export function repeatCardLines(line: string, count: number): string {
  return Array.from({ length: count }, () => line).join("\n");
}

// ===== ペイロード（正本md 入出力節 記載フィールドのみで最小構成） =====

/** デッキインポート更新ボディのオプション（正本md 入出力: format_id・card_list・deck_name・scope_id・archetype_id・image_card_id・campaign_tag_ids）。 */
export interface ImportPayloadOptions {
  formatId?: number | string | null;
  cardList?: string | null;
  deckName?: string | null;
  scopeId?: number | string | null;
  archetypeId?: number | string | null;
  imageCardId?: number | string | null;
  campaignTagIds?: Array<number | string>;
}

/**
 * 正常インポート更新ボディ（全行解読できる card_list・scope_id=公開・整合性を満たすデッキ本体）。overrides で各種異常・境界・公開範囲へ振る。
 * 正本md入出力節記載のフィールドのみで最小構成（未記載項目は含めない＝想定外項目は送らない）。
 */
export function buildValidPayload(opts: ImportPayloadOptions = {}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  body.format_id = "formatId" in opts ? opts.formatId : FORMAT_ID;
  body.card_list = "cardList" in opts ? opts.cardList : DECODABLE_CARD_LINE;
  body.deck_name = "deckName" in opts ? opts.deckName : "テストデッキ";
  if ("scopeId" in opts) body.scope_id = opts.scopeId;
  else body.scope_id = SCOPE.PUBLIC;
  body.archetype_id = "archetypeId" in opts ? opts.archetypeId : ARCHETYPE_ID;
  body.image_card_id = "imageCardId" in opts ? opts.imageCardId : IMAGE_CARD_ID;
  body.campaign_tag_ids = "campaignTagIds" in opts ? opts.campaignTagIds : [];
  return body;
}

/** format_id を含まないボディ（040：format_id必須未充足→400・{code,message}）。 */
export function buildMissingFormatIdPayload(): Record<string, unknown> {
  const body = buildValidPayload();
  delete (body as Record<string, unknown>).format_id;
  return body;
}

/** card_list が上限+1（501行＝MAX_LINE_COUNT+1）のボディ（041：行超過→400。本文形は付帯表4#7）。 */
export function buildOverMaxCardListPayload(): Record<string, unknown> {
  return buildValidPayload({ cardList: repeatCardLines(DECODABLE_CARD_LINE, MAX_LINE_COUNT + 1) });
}

/** card_list が上限ちょうど（500行＝MAX_LINE_COUNT）のボディ（042：境界内→200成功）。 */
export function buildMaxCardListPayload(): Record<string, unknown> {
  return buildValidPayload({ cardList: repeatCardLines(DECODABLE_CARD_LINE, MAX_LINE_COUNT) });
}

/** card_list 未指定/空のボディ（062：空のカード配列として200で更新成功・採用カード空）。 */
export function buildEmptyCardListPayload(): Record<string, unknown> {
  return buildValidPayload({ cardList: "" });
}

/**
 * 一部の行がカード名未一致（解読不能）で形式自体は妥当な card_list のボディ（050/051）。
 * 解読できる行＋解読できない行を混在させる（解読不能行→errors に行番号＝0始まりインデックス）。
 */
export function buildUndecodableLinePayload(): Record<string, unknown> {
  return buildValidPayload({ cardList: [DECODABLE_CARD_LINE, UNDECODABLE_CARD_LINE, DECODABLE_CARD_LINE].join("\n") });
}

/** 全行解読できる card_list のボディ（052：code200・errors なし）。 */
export function buildAllDecodablePayload(): Record<string, unknown> {
  return buildValidPayload({ cardList: [DECODABLE_CARD_LINE, DECODABLE_CARD_LINE].join("\n") });
}

/**
 * 採用カード/デッキ本体の整合性検証に失敗するボディ（043/045/074：制約違反→400）。
 * 採用カード枚数を許容超過にして validateDeck を未充足にする。正典に数値閾値の定義が無く要確認（付帯表4・SEED-A15-18-MASTER で確定）。
 */
export function buildInvalidDeckPayload(): Record<string, unknown> {
  return buildValidPayload({ cardList: INVALID_CARD_LINE });
}

/**
 * 採用カード（ボード区分）の整合性検証に失敗するボディ（110：ボード区分ごとの採用カード制約未充足→400）。
 * IT-22 設計書補完。具体閾値は正典に数値定義が無く要確認（SEED-A15-18-MASTER で確定）。
 */
export function buildBoardCardConstraintViolationPayload(): Record<string, unknown> {
  return buildValidPayload({ cardList: INVALID_CARD_LINE });
}

/**
 * デッキ本体の整合性検証に失敗するボディ（111：フォーマット・公開区分・採用カードを設定したうえでデッキ本体制約未充足→400）。
 * IT-22 設計書補完。デッキ名を空にしてデッキ本体制約を未充足にする（具体閾値は正典に数値定義が無く要確認＝SEED-A15-18-MASTER で確定）。
 */
export function buildDeckBodyConstraintViolationPayload(): Record<string, unknown> {
  return buildValidPayload({ deckName: "", cardList: DECODABLE_CARD_LINE });
}

/** 複数の整合性違反を同時に含むボディ（044：採用カードとデッキ本体に複数違反。複数件の返却構造・ソート順は固定しない＝付帯表4#5）。 */
export function buildMultipleViolationsPayload(): Record<string, unknown> {
  return buildValidPayload({ deckName: "", cardList: INVALID_CARD_LINE });
}

/** 汎用の異常パラメータ値ボディ（045：整合性検証に失敗する異常値→400）。 */
export function buildInvalidParamPayload(): Record<string, unknown> {
  return buildValidPayload({ deckName: "", cardList: INVALID_CARD_LINE });
}

/** scope_id=限定公開（UNLISTED）の正常ボディ（060：成功応答に display_token を付加）。 */
export function buildUnlistedScopePayload(): Record<string, unknown> {
  return buildValidPayload({ scopeId: SCOPE.UNLISTED });
}

/** scope_id=公開（PUBLIC）の正常ボディ（061：display_token を付加しない）。 */
export function buildPublicScopePayload(): Record<string, unknown> {
  return buildValidPayload({ scopeId: SCOPE.PUBLIC });
}

/** 既存と異なる card_list で作り直すボディ（071：旧採用カードが残らないこと観測用）。 */
export function buildReplacedCardListPayload(): Record<string, unknown> {
  return buildValidPayload({ cardList: [DECODABLE_CARD_LINE, DECODABLE_CARD_LINE].join("\n"), deckName: "更新後デッキ" });
}

// ===== 正本md由来のメッセージ文言（オラクル）。実装はローカライズ trans 文言で乖離（付帯表4#4）。テストは文言を固定せず code/{code,message,deck_id} 書式で判定する =====

/**
 * 正本md（レスポンス節）のメッセージ。実装は trans（ローカライズ）で食い違う（付帯表4#4）。
 * 本specは message 文言一致を主たる合否にせず（要確認）、HTTPステータス・`{code, message, deck_id}` 書式・code:200/206 で判定する。参照用に保持。
 *  - UPDATE_SUCCESS:  成功（DeckController.php:731 `api.deck_builder.deck.import_update_success`／正本md「Deck update success by import」）。
 *  - TOKEN_INCORRECT: 認証失敗（DeckController.php:699 `api.deck_builder.auth.token_incorrect`）。
 *  - AUTH_FAILED:     所有者外/認証失敗（DeckController.php:704 `api.deck_builder.auth.failed`）。
 *  - DECK_NOT_FOUND:  対象デッキなし（DeckController.php:709 `api.deck_builder.deck.not_found`）。
 */
export const SPEC_MESSAGE = {
  UPDATE_SUCCESS: "Deck update success by import",
  TOKEN_INCORRECT: "Access Token is incorrect",
  AUTH_FAILED: "Authentication failed",
  DECK_NOT_FOUND: "The deck does not exist",
} as const;

/** 成功時の本文 code（正本md レスポンス節）。 */
export const CODE_SUCCESS = 200;
/** 解読不能行あり時の本文 code（正本md 処理フロー#7・レスポンス節＝206。実装は200のまま＝付帯表4#2）。 */
export const CODE_PARTIAL = 206;
