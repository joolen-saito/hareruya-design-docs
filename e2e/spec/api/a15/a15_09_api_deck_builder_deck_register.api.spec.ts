/**
 * a15-09 デッキビルダー_デッキ登録（JWT認証つき POST API＝デッキビルダー利用者のデッキ新規登録。ブラウザ向け画面を持たない JSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a15_09_api_deck_builder_deck_register_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装する。本機能の 付帯表1 に「E2E自動化（要実機確認）」修飾の行は無く test.fixme は無い。
 * 手動（012 想定外項目仕様未定義・020 並行送信/レート制限・038 タイムアウト・126 作成/更新日時・150 保存例外→500ロールバック）は
 * すべて「手動（要実機確認）」区分でケース表で全量管理し、本specには書かない（規約）。
 * 本機能は画面なしAPI（正本md「ブラウザ向けの画面を持たない」）のためUI専用specは無い（自動化(UI)0件）。
 *
 * 期待結果は仕様（正本md＝pf-apiリバース挙動／観点表・基本設計）由来（オラクル独立性）。実装のレスポンス形・バリデーション機構・FW既定値・DTO/エンティティ制約・ロケール文言を期待値に流用しない。
 *  - 送信先は実装の実効パス `POST /api/deck`（DeckController.php:75。正本md `POST /deck` は `/api` プレフィクスを欠き不一致＝付帯表4#1）。
 *  - 認証は `jwt-token` ヘッダ→`JwtPlayerAuthenticator`（DeckController.php:81／JwtPlayerAuthenticator.php:34-51）。欠落/署名不正/該当プレイヤーなしは 401（DeckController.php:88-92）。
 *    JWTクレーム名（正本md `aud`／実装 `sub`）・HS256署名検証の実方式は要実機確認（付帯表4#2）。テストは「有効JWTで成功・不正/該当なしで401」の意味で判定する。
 *  - 合否（成功）は HTTP200＋本文 `{code:200, message, deck_id}`（限定公開scope_id=3のみ display_token を含む＝DeckController.php:101-120,107-115）を仕様由来で判定。
 *    成功メッセージ「Deck register success」は実装文言と乖離（付帯表4#3）。テストは正本md文言で照合し違えば落として検出する。
 *  - 合否（失敗）は 検証失敗＝400＋`{code,message}`（DeckController.php:93-94）／認証拒否＝401。複数エラー返却構造は正典未定義につき固定しない（付帯表4#5）。
 *  - 登録副作用（dtb_deck・dtb_deck_card・dtb_maybe_card・dtb_attraction_card・dtb_sticker_card）は永続化先テーブルを直接DB照合（DB副作用観測）して判定する想定。
 *    本specは一次オラクルとしてAPI応答（200／4xx・限定公開時 display_token）を確認し、DB副作用は「DB照査で補完」（本リポでDBは実行しない）。別機能の管理画面表示は合否条件にしない。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_09_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  DECK_REGISTER_PATH,
  SCOPE,
  PLAYER_JWT,
  JWT_BAD_SIGNATURE,
  JWT_NO_PLAYER,
  SPEC_SUCCESS_MESSAGE,
  buildJwtHeaders,
  buildNoAuthHeaders,
  buildValidPayload,
  buildScopePayload,
  buildAllOptionalOmittedPayload,
  buildMainSideCommanderPayload,
  buildBoardSplitPayload,
  buildMissingBoardIdPayload,
  buildMissingCountPayload,
  buildDeckBodyViolationPayload,
  buildMultipleErrorsPayload,
  buildMasterResolutionErrorPayload,
  buildRegulationCountRangePayload,
  buildRegulationBannedPayload,
  buildRegulationOverFourPayload,
  buildRegulationFormatInvalidPayload,
  buildRegulationCommanderLegendaryPayload,
} from "../../../pages/api/a15/a15_09_api_deck_builder_deck_register.api";

const HAS_API = !!process.env.A15_09_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常登録＝200（正本md: レスポンス成功 {code,message,deck_id}）").toBe(200);
}
function expect400(status: number) {
  expect(status, "入力不正＝400（正本md: レスポンス失敗・InvalidRequestException＝DeckController.php:93-94）").toBe(400);
}
function expect401(status: number) {
  expect(status, "認証拒否＝401（正本md: 認証・認可。DeckController.php:88-92）").toBe(401);
}
function expectClientError(status: number) {
  // 異常リクエストは成功扱いされない（4xx）。検証ステータスの細部差異を範囲で吸収する。
  expect(status, "異常＝4xx（登録が行われない）").toBeGreaterThanOrEqual(400);
  expect(status, "異常＝4xx").toBeLessThan(500);
}
async function expectSuccessBody(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  // 正本md: 成功本文は code:200・message・発番された deck_id。
  expect(body.code, "成功本文は code:200").toBe(200);
  expect(
    Object.prototype.hasOwnProperty.call(body, "deck_id"),
    "成功本文に発番された deck_id を含む"
  ).toBeTruthy();
  return body;
}
async function expectErrorBody(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  // 正本md: 失敗本文は {code, message}（検証エラー内容）。返却構造（配列/連結文字列）は正典未定義につき固定しない（付帯表4#5）。
  expect(
    Object.prototype.hasOwnProperty.call(body, "code"),
    "失敗本文に code を含む（正本md {code,message}）"
  ).toBeTruthy();
  expect(
    Object.prototype.hasOwnProperty.call(body, "message"),
    "失敗本文に message（検証エラー内容）を含む"
  ).toBeTruthy();
  return body;
}

test.describe("API > デッキビルダー_デッキ登録", { tag: ["@api", "@a15"] }, () => {
  // ===== 正常登録（IT-09／IT-32） =====

  test("E2E-A15-09-001 正常パラメータでPOSTし200が返る", async () => {
    test.skip(!HAS_API, "A15_09_READY(SEED-A15-09-JWT-PLAYER/MASTER/PAYLOAD) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-09-002 登録実行後の処理結果が成功で一致する", async () => {
    test.skip(!HAS_API, "A15_09_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await expectSuccessBody(res); // 処理結果（成功）が応答 {code:200,...,deck_id} と一致。登録副作用のDB反映はDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-09-003 成功時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A15_09_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-09-004 成功レスポンス本文がcode200・message・deck_idを含む", async () => {
    test.skip(!HAS_API, "A15_09_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    const body = await expectSuccessBody(res);
    // 正本md: 成功メッセージは「Deck register success」。実装文言 ja/en は乖離（付帯表4#3）＝正本md文言で照合し違えば落として検出。
    expect(body.message, "message＝正本md「Deck register success」（実装文言乖離は付帯表4#3）").toBe(SPEC_SUCCESS_MESSAGE);
    await ctx.dispose();
  });

  test("E2E-A15-09-010 有効なJWTで登録が成功する", async () => {
    test.skip(!HAS_API, "A15_09_READY(SEED-A15-09-JWT-PLAYER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status()); // 資格情報が有効＝200（JwtPlayerAuthenticator.php:34-51）。
    await ctx.dispose();
  });

  test("E2E-A15-09-011 異常なパラメータ値で入力不正となる", async () => {
    test.skip(!HAS_API, "A15_09_READY 未設定");
    const ctx = await newCtx();
    // 整合性検証に失敗する異常な値（マスタ非存在フォーマット）→ InvalidRequestException→400（DeckController.php:93-94）。
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildDeckBodyViolationPayload() });
    expect400(res.status());
    await expectErrorBody(res);
    await ctx.dispose();
  });

  test("E2E-A15-09-013 cards必須子項目(board_id・count)を満たすと登録成功200となる", async () => {
    test.skip(!HAS_API, "A15_09_READY 未設定");
    const ctx = await newCtx();
    // cards 各要素が board_id・count を満たす正常リクエスト（正本md 入出力 cards必須子項目）。
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-09-014 公開(1)の成功レスポンス書式がcode・message・deck_idと一致しdisplay_tokenを含まない", async () => {
    test.skip(!HAS_API, "A15_09_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildScopePayload(SCOPE.PUBLIC) });
    expect200(res.status());
    await expectSuccessBody(res);
    // 正本md: 限定公開(3)以外は display_token を含まない（DeckController.php:107-115）。
    const body = (await res.json()) as Record<string, unknown>;
    expect(
      Object.prototype.hasOwnProperty.call(body, "display_token"),
      "公開(1)では display_token を含まない"
    ).toBeFalsy();
    await ctx.dispose();
  });

  test("E2E-A15-09-015 任意項目・cards未指定でも登録が成功する", async () => {
    test.skip(!HAS_API, "A15_09_READY 未設定");
    const ctx = await newCtx();
    // deck_name・format_id・archetype_id・scope_id・image_card_id・campaign_tag_ids・cards 未指定でも検証エラーにならず200（正本md 入出力: 任意項目）。
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildAllOptionalOmittedPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-09-016 入力検証を満たすリクエストで登録成功200となる", async () => {
    test.skip(!HAS_API, "A15_09_READY 未設定");
    const ctx = await newCtx();
    // 採用カード・デッキ本体の入力検証をすべて満たす正常リクエスト。
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  // ===== エラー・認証（IT-10） =====

  test("E2E-A15-09-030 検証失敗時に400となりエラーメッセージを返す", async () => {
    test.skip(!HAS_API, "A15_09_READY 未設定");
    const ctx = await newCtx();
    // 採用カードまたはデッキ本体の検証に失敗→400＋{code,message}（DeckController.php:93-94／validateDeck PostDeckAction.php:117-130）。
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildDeckBodyViolationPayload() });
    expect400(res.status());
    await expectErrorBody(res);
    await ctx.dispose();
  });

  test("E2E-A15-09-031 複数項目の検証失敗で400となり検証エラー内容を含む", async () => {
    test.skip(!HAS_API, "A15_09_READY 未設定");
    const ctx = await newCtx();
    // 複数項目（board_id欠落の採用カード＋マスタ非存在フォーマット）が検証失敗→400。全件まとめ返却の構造は正典未定義（付帯表4#5）＝固定しない。
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildMultipleErrorsPayload() });
    expect400(res.status());
    await expectErrorBody(res);
    await ctx.dispose();
  });

  test("E2E-A15-09-032 マスタ解決を伴う検証失敗で400となり検証エラー内容を含む", async () => {
    test.skip(!HAS_API, "A15_09_READY(SEED-A15-09-MASTER) 未設定");
    const ctx = await newCtx();
    // フォーマット・カード等のマスタ解決を伴う検証失敗（マスタ非存在カード）→400。返却構造は正典未定義（付帯表4#5）。
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildMasterResolutionErrorPayload() });
    expect400(res.status());
    await expectErrorBody(res);
    await ctx.dispose();
  });

  test("E2E-A15-09-033 認証済みプレイヤーで200が返る", async () => {
    test.skip(!HAS_API, "A15_09_READY(SEED-A15-09-JWT-PLAYER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status()); // 認証済みプレイヤーが自身のデッキを登録でき200（JwtPlayerAuthenticator.php:51・DeckController.php:101-120）。
    await ctx.dispose();
  });

  test("E2E-A15-09-034 jwt-tokenヘッダ欠落で401となり登録されない", async () => {
    test.skip(!HAS_API, "A15_09_READY 未設定");
    const ctx = await newCtx();
    // ヘッダ欠落→InvalidTokenException→401（DeckController.php:88-92）。デッキが登録されないことはDB照査で補完。
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildNoAuthHeaders(), data: buildValidPayload() });
    expect401(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-09-035 署名不正・該当プレイヤーなしのJWTで401となる", async () => {
    test.skip(!HAS_API, "A15_09_READY(SEED-A15-09-JWT-PLAYER 署名不正/該当なし派生) 未設定");
    const ctx = await newCtx();
    // 署名不正→InvalidTokenException／該当プレイヤーなし→PlayerNotFoundException、いずれも401（DeckController.php:88-92・PostDeckAction.php:50-52）。
    const bad = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(JWT_BAD_SIGNATURE), data: buildValidPayload() });
    expect401(bad.status()); // 署名検証失敗＝401。HS256署名検証の実方式は要実機確認（付帯表4#2）だが結果（401・非登録）で判定。
    const noPlayer = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(JWT_NO_PLAYER), data: buildValidPayload() });
    expect401(noPlayer.status()); // 該当プレイヤーなし＝401。
    await ctx.dispose();
  });

  test("E2E-A15-09-036 異常リクエストで4xxとなり登録されない", async () => {
    test.skip(!HAS_API, "A15_09_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildDeckBodyViolationPayload() });
    expectClientError(res.status()); // 異常＝4xx。デッキ本体・採用カードが登録されないことはDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-09-037 追加登録として新規レコードが追加される", async () => {
    test.skip(!HAS_API, "A15_09_READY(SEED-A15-09-PLAYER-BASE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await expectSuccessBody(res);
    // 一次オラクル: 既存レコードを上書きせず dtb_deck に新規1件追加（件数差分）。DB副作用照合＝DB照査で補完。
    await ctx.dispose();
  });

  // ===== 区分整合・部分登録なし（IT-33。一次オラクル＝API応答＋DB副作用照合） =====

  test("E2E-A15-09-040 登録後に他プレイヤー・他デッキのレコードが不変", async () => {
    test.skip(!HAS_API, "A15_09_READY(SEED-A15-09-PLAYER-BASE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await expectSuccessBody(res);
    // 一次オラクル: 登録対象外の他プレイヤー・他デッキの dtb_deck・dtb_deck_card が登録前と一致（不変）。DB副作用照合＝DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-09-041 検証エラー時に保存へ到達せず未登録となる", async () => {
    test.skip(!HAS_API, "A15_09_READY(SEED-A15-09-PLAYER-BASE) 未設定");
    const ctx = await newCtx();
    // 正典の処理順（採用カード検証→デッキ本体検証→保存）でデッキ本体検証失敗→保存に到達せず4xx（PostDeckAction.php:60,80,117-130）。
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildDeckBodyViolationPayload() });
    expectClientError(res.status());
    // 一次オラクル: dtb_deck・dtb_deck_card・各カードテーブルが受信前と一致し登録が残らない（保存例外時ロールバックは150＝手動）。DB照査で補完。
    await ctx.dispose();
  });

  // ===== 入力検証（IT-22・設計書補完。検証失敗→400＝DeckController.php:93-94） =====

  test("E2E-A15-09-100 cards指定時にboard_id欠落で採用カード検証エラーとなる", async () => {
    test.skip(!HAS_API, "A15_09_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildMissingBoardIdPayload() });
    expect400(res.status());
    await expectErrorBody(res); // 採用カード必須の board_id 欠落→検証エラー400＋検証メッセージ。
    await ctx.dispose();
  });

  test("E2E-A15-09-101 cards指定時にcount欠落で採用カード検証エラーとなる", async () => {
    test.skip(!HAS_API, "A15_09_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildMissingCountPayload() });
    expect400(res.status());
    await expectErrorBody(res); // 採用カード必須の count 欠落→検証エラー400＋検証メッセージ。
    await ctx.dispose();
  });

  test("E2E-A15-09-102 デッキ本体の制約未充足で400となりエラーメッセージを返す", async () => {
    test.skip(!HAS_API, "A15_09_READY 未設定");
    const ctx = await newCtx();
    // フォーマット・公開範囲・採用カードを設定したデッキ本体の制約未充足→400（PostDeckAction.php:80,117-130）。
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildDeckBodyViolationPayload() });
    expect400(res.status());
    await expectErrorBody(res);
    await ctx.dispose();
  });

  test("E2E-A15-09-103 必須項目あり・任意項目未入力で検証エラーにならない", async () => {
    test.skip(!HAS_API, "A15_09_READY 未設定");
    const ctx = await newCtx();
    // 任意項目（deck_name・format_id等）に必須制約がなく未指定でも検証通過→200（正本md 入出力: 任意項目）。
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildAllOptionalOmittedPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  // ===== DB登録副作用（IT-26・設計書補完。一次オラクル＝DB副作用照合。本specはAPI応答を確認しDB照査で補完） =====

  test("E2E-A15-09-120 登録後にdtb_deckへデッキ本体が1件登録される", async () => {
    test.skip(!HAS_API, "A15_09_READY(SEED-A15-09-PLAYER-BASE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await expectSuccessBody(res);
    // 一次オラクル: dtb_deck に1件登録・deck_id発番・デッキ名/フォーマット/プレイヤーが指定値。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-09-121 採用カードがdtb_deck_cardにcard_id・board_id・countで登録される", async () => {
    test.skip(!HAS_API, "A15_09_READY(SEED-A15-09-PLAYER-BASE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildMainSideCommanderPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_deck_card に deck_id・card_id・board_id・count で登録（メイン/サイド/統率領域）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-09-122 メイビー/アトラクション/ステッカーが各テーブルへ振り分け登録される", async () => {
    test.skip(!HAS_API, "A15_09_READY(SEED-A15-09-PLAYER-BASE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildBoardSplitPayload() });
    expect200(res.status());
    // 一次オラクル: board_id=4→dtb_maybe_card・5→dtb_attraction_card・6→dtb_sticker_card へ振り分け登録。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-09-123 限定公開(3)で限定公開トークンが生成保存され応答にも含まれる", async () => {
    test.skip(!HAS_API, "A15_09_READY(SEED-A15-09-PLAYER-BASE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildScopePayload(SCOPE.UNLISTED) });
    expect200(res.status());
    const body = await expectSuccessBody(res);
    // scope_id===3 のみ応答に display_token を含む（DeckController.php:107-115）。dtb_deck.display_token への保存はDB照査で補完。
    expect(Object.prototype.hasOwnProperty.call(body, "display_token"), "限定公開(3)は応答に display_token を含む").toBeTruthy();
    expect(typeof body.display_token, "display_token は文字列").toBe("string");
    expect((body.display_token as string).length, "display_token は空でない").toBeGreaterThan(0);
    await ctx.dispose();
  });

  test("E2E-A15-09-124 枚数範囲外でレギュレーション違反フラグが保存され登録は成功する", async () => {
    test.skip(!HAS_API, "A15_09_READY(SEED-A15-09-PLAYER-BASE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildRegulationCountRangePayload() });
    expect200(res.status()); // 枚数範囲（統率領域/メイン/サイド）違反でも登録は妨げられず200（業務ルール: 違反は登録を妨げない）。
    // 一次オラクル: dtb_deck.regulation_violation_flg に違反として保存。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-09-125 所有者player_idが認証プレイヤーで固定登録される", async () => {
    test.skip(!HAS_API, "A15_09_READY(SEED-A15-09-JWT-PLAYER/PLAYER-BASE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_deck.player_id＝jwt-token から特定した認証プレイヤーで固定（データ整合性: 所有者固定）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-09-127 公開・非公開ではdisplay_tokenを応答に含めない", async () => {
    test.skip(!HAS_API, "A15_09_READY 未設定");
    const ctx = await newCtx();
    // 公開範囲が限定公開(3)でない（公開1・非公開2）場合は応答に display_token を含めない（DeckController.php:107-115）。
    for (const scope of [SCOPE.PUBLIC, SCOPE.PRIVATE]) {
      const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildScopePayload(scope) });
      expect200(res.status());
      const body = (await res.json()) as Record<string, unknown>;
      expect(
        Object.prototype.hasOwnProperty.call(body, "display_token"),
        `scope_id=${scope} では display_token を含まない`
      ).toBeFalsy();
    }
    await ctx.dispose();
  });

  test("E2E-A15-09-128 禁止制限カードでレギュレーション違反フラグが保存され登録は成功する", async () => {
    test.skip(!HAS_API, "A15_09_READY(SEED-A15-09-PLAYER-BASE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildRegulationBannedPayload() });
    expect200(res.status()); // 禁止/制限カードを含んでも登録は妨げられず200。
    // 一次オラクル: dtb_deck.regulation_violation_flg に違反として保存。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-09-129 4枚制限超過でレギュレーション違反フラグが保存され登録は成功する", async () => {
    test.skip(!HAS_API, "A15_09_READY(SEED-A15-09-PLAYER-BASE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildRegulationOverFourPayload() });
    expect200(res.status()); // 同一カードの4枚制限超過でも登録は妨げられず200。
    // 一次オラクル: dtb_deck.regulation_violation_flg に違反として保存。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-09-130 フォーマット不適合でレギュレーション違反フラグが保存され登録は成功する", async () => {
    test.skip(!HAS_API, "A15_09_READY(SEED-A15-09-PLAYER-BASE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildRegulationFormatInvalidPayload() });
    expect200(res.status()); // フォーマット不適合カードを含んでも登録は妨げられず200。
    // 一次オラクル: dtb_deck.regulation_violation_flg に違反として保存。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-09-131 統率領域の伝説条件違反でレギュレーション違反フラグが保存され登録は成功する", async () => {
    test.skip(!HAS_API, "A15_09_READY(SEED-A15-09-PLAYER-BASE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(DECK_REGISTER_PATH, { headers: buildJwtHeaders(), data: buildRegulationCommanderLegendaryPayload() });
    expect200(res.status()); // 統率領域の伝説条件違反でも登録は妨げられず200。
    // 一次オラクル: dtb_deck.regulation_violation_flg に違反として保存。DB照査で補完。
    await ctx.dispose();
  });
});
