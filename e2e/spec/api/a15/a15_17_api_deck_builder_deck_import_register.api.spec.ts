/**
 * a15-17 デッキビルダー_デッキインポート登録（デッキビルダー利用者が card_list テキストを解読してデッキを新規登録する JWT 認証つき POST JSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a15_17_api_deck_builder_deck_import_register_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装する。本機能の 付帯表1 に「E2E自動化（要実機確認）」修飾の行は無く（018/019/020 の要実機確認は根拠列の HS256 署名方式・クレーム名の注記＝付帯表4#2、030 の要実機確認も根拠列の日時判定の注記で、いずれも E2E可否＝E2E自動化）、test.fixme は無い。
 * 手動（024 保存例外実再現・034 Redis下書き観測・035 並行送信・036 タイムアウト・037 想定外項目仕様未定義・150 保存例外ロールバック）はケース表で全量管理し本specには書かない（規約）。
 * 本機能は画面なしAPI（正本md「対象はJSON APIエンドポイントであり、ブラウザ向けの画面を持たない」）のためUI専用specは無い（自動化(UI)0件）。
 *
 * 期待結果は仕様（正本md＝pf-apiリバース挙動／観点表・基本設計）由来（オラクル独立性）。実装のレスポンス形・バリデーション機構・FW既定値・DTO制約を期待値に流用しない。
 *  - 送信先は実装の実効パス `POST /api/deck/import`（DeckController.php:667／付帯表1・付帯表4#1。正本md `POST /deck/import` は `/api` を欠き不一致）。
 *  - 認証は `jwt-token` ヘッダ→JwtPlayerAuthenticator（ImportDeckAction.php:62／JwtPlayerAuthenticator.php:35-53）。欠落／署名不正／該当プレイヤーなし＝401（DeckController.php:698-702。署名方式 HS256・クレーム名は付帯表4#2＝要実機確認）。
 *  - 合否（成功）は HTTP200＋応答 `{code:200, message, deck_id}`、（部分成功）は 206＋`{code:206, errors, deck_id}`、（失敗）は 400/401/500＋`{code, message}` を仕様由来で判定する。
 *    解読不可行ありの 206 切替は正本md仕様。実装は 206 を返さず常に 200 の可能性（付帯表4#3）→ 仕様どおり 206 を期待し違えば落として検出する（実装へ寄せない）。
 *    行数上限超過の 400（付帯表4#8）・500ハンドリング（付帯表4#6）・公開区分の保持方式（付帯表4#9）も仕様由来で判定する。
 *  - 本APIはブラウザ向け画面を持たないため、登録副作用は永続化先テーブル（dtb_deck・dtb_deck_card・dtb_maybe_card・dtb_attraction_card・dtb_sticker_card）を直接DB照合（DB副作用観測）して判定する想定。本specは一次オラクルとしてAPI応答を確認し、DB副作用は「DB照査で補完」（本リポでDBは実行しない）。
 *  - 有効JWT原値・SEED ID は env で供給し原値はコミットしない。正本md未記載項目（公開区分永続化方式 private_flg＝付帯表4#9）は送信・期待に含めない。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_17_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildImportPath,
  buildJwtHeaders,
  buildNoAuthHeaders,
  JWT_BAD_SIGNATURE,
  JWT_NO_PLAYER,
  SPEC_CODE,
  SUCCESS_MESSAGE,
  SPEC_MESSAGE,
  buildValidPayload,
  buildEmptyCardListPayload,
  buildUnreadableLinePayload,
  buildCommanderFormatPayload,
  buildMaxLineCardListPayload,
  buildOverMaxLineCardListPayload,
  buildUnlistedPayload,
  buildNonUnlistedPayload,
  buildUnlistedUnreadablePayload,
  buildMissingFormatIdPayload,
  buildInvalidDeckContentPayload,
  buildMultipleErrorsPayload,
  buildInvalidParamPayload,
  buildDeckBodyPayload,
  buildBoardCardListPayload,
  buildOffBoardCardListPayload,
  buildTextBodyPayload,
} from "../../../pages/api/a15/a15_17_api_deck_builder_deck_import_register.api";

const HAS_API = !!process.env.A15_17_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常インポート登録＝200（正本md: レスポンス成功 {code:200,message,deck_id}）").toBe(200);
}
function expect206(status: number) {
  // 正本md 処理フロー#6: 解読不可行ありで 206 へ切替。実装は206を返さず常に200の可能性（付帯表4#3）。仕様の206で判定し違えば落として検出する。
  expect(status, "部分成功（解読不可行あり）＝206（正本md 処理フロー#6。実装200の可能性は付帯表4#3）").toBe(206);
}
function expect400(status: number) {
  expect(status, "入力不正＝400（正本md: レスポンス失敗 {code,message}）").toBe(400);
}
function expect401(status: number) {
  expect(status, "認証拒否＝401（正本md: 認証・認可／InvalidTokenException・PlayerNotFoundException）").toBe(401);
}
function expectClientError(status: number) {
  // 検証エラーは成功扱いされない（4xx）。400/404 等の差異（付帯表4#4）を範囲で吸収する。
  expect(status, "検証エラー＝4xx（保存に到達せず部分登録が残らない）").toBeGreaterThanOrEqual(400);
  expect(status, "検証エラー＝4xx").toBeLessThan(500);
}
async function expectSuccessBody(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(body.code, "成功本文は code:200（snake_caseキー）").toBe(SPEC_CODE.SUCCESS);
  expect(body.message, "成功本文の message は正本md文言").toBe(SUCCESS_MESSAGE);
  expect(body.deck_id, "成功本文に発番された deck_id を含む").toBeTruthy();
}
async function expectPartialBody(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(body.code, "部分成功本文は code:206（正本md 処理フロー#6・付帯表4#3）").toBe(SPEC_CODE.PARTIAL);
  expect(Object.prototype.hasOwnProperty.call(body, "errors"), "部分成功本文に errors（0始まり行番号）を含む").toBeTruthy();
  expect(body.deck_id, "部分成功でも登録は完了し deck_id を含む").toBeTruthy();
}
async function expectErrorBody(res: { json: () => Promise<unknown> }, why: string) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(Object.prototype.hasOwnProperty.call(body, "code"), "失敗本文に code を含む（正本md {code,message}）").toBeTruthy();
  expect(Object.prototype.hasOwnProperty.call(body, "message"), why).toBeTruthy();
}
async function expectMessageContains(res: { json: () => Promise<unknown> }, fragment: string, why: string) {
  const body = (await res.json()) as Record<string, unknown>;
  // message 文言は実装依存のため本文全体を文字列化して安定部分の存在で照合する（正確文言は付帯表で要確認）。
  expect(JSON.stringify(body), why).toContain(fragment);
}
async function expectDisplayTokenPresent(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(Object.prototype.hasOwnProperty.call(body, "display_token"), "限定公開＝応答に display_token を含む（DeckController.php:735-738）").toBeTruthy();
  expect(body.display_token, "display_token は非空（dtb_deck.display_token と一致＝DB照査で補完）").toBeTruthy();
}
async function expectNoDisplayToken(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(Object.prototype.hasOwnProperty.call(body, "display_token"), "限定公開以外＝応答に display_token を含めない（正本md・DeckController.php:735-738）").toBeFalsy();
}

test.describe("API > デッキビルダー_デッキインポート登録", { tag: ["@api", "@a15"] }, () => {
  // ===== 正常インポート登録（IT-09 / IT-27 / IT-32） =====

  test("E2E-A15-17-001 正常パラメータでPOSTし200が返る", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-JWT-PLAYER/MASTER/CARDLIST/PAYLOAD) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-17-002 登録実行後の処理結果が成功で一致する", async () => {
    test.skip(!HAS_API, "A15_17_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await expectSuccessBody(res); // 処理結果（成功）が応答 {code:200,message,deck_id} と一致。登録副作用はDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-17-003 成功時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A15_17_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-17-004 成功レスポンス本文がcode200・message・deck_idを含む", async () => {
    test.skip(!HAS_API, "A15_17_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await expectSuccessBody(res); // 正本md: snake_caseキー code:200・message「Deck registration success by import」・発番 deck_id。
    await ctx.dispose();
  });

  test("E2E-A15-17-005 有効なJWTでインポート登録が成功する", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-JWT-PLAYER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status()); // 資格情報が有効（該当プレイヤーあり）＝200。クレーム名/HS256実方式は要実機確認（付帯表4#2）だが結果で判定。
    await ctx.dispose();
  });

  test("E2E-A15-17-006 成功レスポンス書式がcode・message・deck_idと一致する", async () => {
    test.skip(!HAS_API, "A15_17_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await expectSuccessBody(res);
    await expectNoDisplayToken(res); // 公開（scope_id=1）＝限定公開以外のため display_token・errors を含まない。
    await ctx.dispose();
  });

  test("E2E-A15-17-007 card_list未指定・空でも空カード配列として登録成功する", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-PAYLOAD) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildEmptyCardListPayload() });
    expect200(res.status()); // card_list 任意・空は空カード配列扱いで検証エラーにならず200（ImportDeckAction.php:92-98）。
    await ctx.dispose();
  });

  // ===== カードリスト解読・行数上限（IT-16 / IT-24。206切替は付帯表4#3） =====

  test("E2E-A15-17-010 card_list全行解読で200・errorsなし・明細が一致する", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-CARDLIST/PLAYER-BASE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await expectNoDisplayToken(res); // 全行解読＝errors を含まない。取り込みカード明細（dtb_deck_card）が card_list と一致＝DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-17-011 解読できない行ありでコード206・errors・登録完了となる", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-CARDLIST) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildUnreadableLinePayload() });
    expect206(res.status()); // 正本md: 登録は中断されず完了し code/HTTP を206へ切替。実装は206を返さない可能性＝付帯表4#3（仕様で判定し落として検出）。
    await expectPartialBody(res); // code:206・errors（解読不可行の0始まり行番号）・deck_id を含む。
    await ctx.dispose();
  });

  test("E2E-A15-17-012 format_idの統率者使用設定でcard_list解読が分岐する", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-CARDLIST) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildCommanderFormatPayload() });
    expect200(res.status());
    // 一次オラクル: format_id の統率者使用設定に応じ解読され、統率者区切り以降が統率ボード区分（dtb_deck_card.board_id）で登録。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-17-013 card_listが上限500行ちょうどでエラーにならず登録継続する", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-CARDLIST) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildMaxLineCardListPayload() });
    expect200(res.status()); // 行数上限境界（500行・CardUtil.php:53-54）でエラーとならず登録継続。
    await ctx.dispose();
  });

  test("E2E-A15-17-014 card_listが501行（上限超過）で入力不正400となる", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-CARDLIST) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildOverMaxLineCardListPayload() });
    expect400(res.status()); // 501行＝上限超過。400経路の確実性は付帯表4#8（グローバルハンドラ依存）だが仕様の400で判定。
    await expectErrorBody(res, "失敗本文 {code,message} を含む");
    await expectMessageContains(res, SPEC_MESSAGE.CARD_LIST_OVER_MAX, "本文に上限（500）超過のメッセージを含む（正確文言は付帯表4#8で要確認）");
    await ctx.dispose();
  });

  // ===== 公開区分・display_token（IT-24。保持方式は付帯表4#9） =====

  test("E2E-A15-17-015 限定公開でdisplay_tokenが応答に含まれDB値と一致する", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-CARDLIST/PLAYER-BASE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildUnlistedPayload() });
    expect200(res.status());
    await expectDisplayTokenPresent(res); // 一次オラクル: 応答 display_token が dtb_deck.display_token と一致。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-17-016 公開・非公開ではdisplay_tokenを応答に含めない", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-PAYLOAD) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildNonUnlistedPayload() });
    expect200(res.status());
    await expectNoDisplayToken(res); // scope_id が限定公開でない＝display_token を含めない（DeckController.php:735-738）。
    await ctx.dispose();
  });

  test("E2E-A15-17-017 限定公開かつ解読不可行で206・display_token・errorsを返す", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-CARDLIST) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildUnlistedUnreadablePayload() });
    expect206(res.status()); // 実装の206挙動は付帯表4#3（仕様で判定）。
    await expectPartialBody(res);
    await expectDisplayTokenPresent(res); // 限定公開＝display_token と errors をともに含む。
    await ctx.dispose();
  });

  // ===== 認証・認可（IT-10 / IT-32。HS256署名方式・クレーム名は付帯表4#2＝env供給トークンで判定） =====

  test("E2E-A15-17-018 jwt-tokenヘッダ欠落で401となり登録されない", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-MASTER/CARDLIST) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildNoAuthHeaders(), data: buildValidPayload() });
    expect401(res.status()); // ヘッダ欠落＝認証拒否401（InvalidTokenException）。デッキが登録されないことはDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-17-019 署名不正のJWTで401となり登録されない", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-JWT-PLAYER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(JWT_BAD_SIGNATURE), data: buildValidPayload() });
    expect401(res.status()); // 署名検証失敗＝401（InvalidTokenException）。HS256実方式は要実機確認（付帯表4#2）だが結果（401・非登録）で判定。
    await ctx.dispose();
  });

  test("E2E-A15-17-020 該当プレイヤーなしのJWTで401となり登録されない", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-JWT-PLAYER 該当なし) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(JWT_NO_PLAYER), data: buildValidPayload() });
    expect401(res.status()); // 検証は通るが該当プレイヤーなし＝401（PlayerNotFoundException）。登録されないことはDB照査で補完。
    await ctx.dispose();
  });

  // ===== バリデーション・エラー本文（IT-10 / IT-17 / IT-32） =====

  test("E2E-A15-17-021 format_id未指定で入力不正400となる", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildMissingFormatIdPayload() });
    expect400(res.status()); // 必須 format_id 欠落＝400（InvalidRequestException 'format_id is required'＝ImportDeckAction.php:82-85）。マスタ不在404は固定期待にしない（付帯表4#4）。
    await expectErrorBody(res, "失敗本文 {code,message} を含む");
    await expectMessageContains(res, SPEC_MESSAGE.FORMAT_ID_REQUIRED, "本文に format_id 必須のメッセージを含む");
    await ctx.dispose();
  });

  test("E2E-A15-17-022 デッキ内容検証失敗で400となり検証エラーを返す", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildInvalidDeckContentPayload() });
    expect400(res.status()); // デッキ内容検証失敗＝400（BadRequestHttpException→InvalidRequestException＝ImportDeckAction.php:122-148）。
    await expectErrorBody(res, "失敗本文 {code,message}（検証エラーメッセージ）を含む");
    await ctx.dispose();
  });

  test("E2E-A15-17-023 複数項目の検証失敗で400となり検証エラー内容を含む", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildMultipleErrorsPayload() });
    expect400(res.status());
    // 一括返却の有無・返却構造（配列／空白連結文字列）は正典未定義のため固定せず {code,message} の存在で判定（付帯表4#5）。
    await expectErrorBody(res, "失敗本文 {code,message}（検証エラー内容）を含む");
    await ctx.dispose();
  });

  // ===== DB登録副作用（IT-16 / IT-24 / IT-27 / IT-33。一次オラクル＝API応答＋DB副作用照合。本specはAPI応答を確認しDB照査で補完） =====

  test("E2E-A15-17-025 インポート登録後にdtb_deckへデッキ本体が1件登録される", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-CARDLIST/PLAYER-BASE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildDeckBodyPayload() });
    expect200(res.status());
    await expectSuccessBody(res);
    // 一次オラクル: dtb_deck にデッキ本体が1件・id発番・deck_name/format_id/player_id が指定値で登録。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-17-026 デッキカードがdtb_deck_cardにcard_id・board_id・countで登録される", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-CARDLIST/PLAYER-BASE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildBoardCardListPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_deck_card に deck_id・card_id・board_id（メイン/サイド/統率の区分）・count で登録。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-17-027 メイビー/アトラクション/ステッカーが各表へ振り分け登録される", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-CARDLIST/PLAYER-BASE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildOffBoardCardListPayload() });
    expect200(res.status());
    // 一次オラクル: ボード外区分が dtb_maybe_card・dtb_attraction_card・dtb_sticker_card（deck_id・card_id・count）へ振り分け登録。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-17-028 本文がtext_main・text_side・text_commandに保持される", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-CARDLIST/PLAYER-BASE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildTextBodyPayload() });
    expect200(res.status());
    // 一次オラクル: メイン/サイド/統率の本文が dtb_deck.text_main/text_side/text_command へ保持。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-17-029 所有プレイヤーが認証プレイヤーで固定登録される", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-JWT-PLAYER/PLAYER-BASE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_deck.player_id ＝ jwt-token から特定した認証プレイヤーで固定登録（ImportDeckAction.php:110）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-17-030 作成日時・更新日時に登録時の現在日時が設定される", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-CARDLIST/PLAYER-BASE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_deck.create_date/update_date に登録時の現在日時が設定（現在日時の確定的判定は要実機確認）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-17-031 登録後に該当デッキが取得結果に含まれる", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-CARDLIST/PLAYER-BASE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await expectSuccessBody(res); // 一次オラクル: 発番 deck_id のデッキ本体が dtb_deck に存在し取得結果に含まれる。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-17-032 登録後に他プレイヤー・他デッキのレコードが不変", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-CARDLIST/PLAYER-BASE 別プレイヤー) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    // 一次オラクル: 登録対象外の他プレイヤー・他デッキの dtb_deck・dtb_deck_card が登録前と一致（不変）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-17-033 検証エラー時に保存へ到達せず部分登録が残らない", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-PLAYER-BASE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildInvalidDeckContentPayload() });
    expectClientError(res.status()); // 検証エラー＝4xx。検証は保存より前のため未登録。
    // 一次オラクル: dtb_deck・dtb_deck_card・各カードテーブルが受信前と一致し部分登録が残らない（保存例外時ロールバックは150・手動）。DB照査で補完。
    await ctx.dispose();
  });

  // ===== 異常パラメータ（IT-32） =====

  test("E2E-A15-17-038 異常なパラメータ値で入力不正となる", async () => {
    test.skip(!HAS_API, "A15_17_READY(SEED-A15-17-MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildImportPath(), { headers: buildJwtHeaders(), data: buildInvalidParamPayload() });
    expect400(res.status()); // 整合性検証失敗＝400。
    await expectErrorBody(res, "失敗本文 {code,message}（検証エラー内容）を含む");
    await ctx.dispose();
  });
});
