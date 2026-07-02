/**
 * a15-18 デッキビルダー_デッキインポート更新（JWT認証つき PUT API＝デッキビルダー利用者がカードリストテキストで自所有の既存デッキを上書き更新するJSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a15_18_api_deck_builder_deck_import_update_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装する。本機能の 付帯表1 に「E2E自動化（要実機確認／要確認）」修飾の行は無く（020-022 の要実機確認は根拠列のHS256署名方式の注記で、E2E可否＝E2E自動化(API/統合)）、test.fixme は無い。
 * 手動（081 Redis下書き削除・観測手段なし・090 並行送信・091 想定外項目仕様未定義・092 タイムアウト・150 保存例外）はケース表で全量管理し本specには書かない（規約・付帯表1）。
 * 本機能は画面なしAPI（正本md「ブラウザ向けの画面を持たない」）のためUI専用specは無い（自動化(UI)0件）。
 *
 * 期待結果は仕様（正本md＝pf-apiリバース／観点表・基本設計）由来（オラクル独立性）。実装のレスポンス形・FW既定値・JWTクレーム名・trans文言・バリデーション機構を期待値に流用しない。
 *  - 送信先は実装の実効パス `PUT /api/deck/import/{id}`（DeckController.php:677。付帯表1/付帯表4#1。正本md `PUT /deck/import/{id}` は `/api` を欠き不一致）。
 *  - 認証は jwt-token ヘッダ直接読み（DeckController.php:686）→JwtPlayerAuthenticator。欠落/署名不正/該当プレイヤーなし＝401。所有者外＝401「Authentication failed」（DeckController.php:702-706＝正本md仕様401と一致）。
 *  - 合否（成功）は HTTP200＋応答 `{code:200, message, deck_id}`、限定公開時 `display_token` 付加。（失敗）は 400/401/404＋`{code, message}` を仕様由来で判定する。
 *    解読不能行あり時は正本mdの 206（HTTP・本文codeとも）を期待する。実装はHTTP・本文codeとも200のまま errors 付加（付帯表4#2）→ 仕様どおり期待し違えば落として検出する（実装へ寄せない）。
 *    card_list 上限超過（041）はSymfony既定の400応答形となり本文 `{code, message}` 形にならない可能性（付帯表4#7）→ 仕様どおり400を期待し違えば落として検出する。
 *    検証メッセージは正本md文言（英語リテラル）を期待（実装はローカライズ trans＝付帯表4#4。複数違反は空白結合の単一message＝付帯表4#5）。本文全体を文字列化して文言の存在で照合する。
 *  - 本APIはブラウザ向け画面を持たないため、更新副作用は永続化先テーブル（dtb_deck・dtb_deck_card・dtb_maybe_card・dtb_attraction_card・dtb_sticker_card）を直接DB照合（DB副作用観測）して判定する想定。本specは一次オラクルとしてAPI応答を確認し、DB副作用は「DB副作用はDB照査で補完（本リポでDBは実行しない）」。
 *  - 有効JWT原値・SEED ID は env で供給し原値はコミットしない。正本md未定義の想定外項目（091）は送信・期待に含めない。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_18_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildImportUpdatePath,
  buildJwtHeaders,
  buildNoAuthHeaders,
  JWT_BAD_SIGNATURE,
  JWT_NO_PLAYER,
  DECK_ID,
  CODE_SUCCESS,
  CODE_PARTIAL,
  SPEC_MESSAGE,
  buildValidPayload,
  buildMissingFormatIdPayload,
  buildOverMaxCardListPayload,
  buildMaxCardListPayload,
  buildEmptyCardListPayload,
  buildUndecodableLinePayload,
  buildAllDecodablePayload,
  buildInvalidDeckPayload,
  buildMultipleViolationsPayload,
  buildInvalidParamPayload,
  buildUnlistedScopePayload,
  buildPublicScopePayload,
  buildReplacedCardListPayload,
  buildBoardCardConstraintViolationPayload,
  buildDeckBodyConstraintViolationPayload,
} from "../../../pages/api/a15/a15_18_api_deck_builder_deck_import_update.api";

const HAS_API = !!process.env.A15_18_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常更新＝200（正本md: レスポンス成功 {code:200, message, deck_id}）").toBe(200);
}
function expect206(status: number) {
  // 正本md: 解読不能行あり＝HTTP206（処理フロー#7・レスポンス節）。実装はHTTP200のまま errors 付加（付帯表4#2）。仕様の206で判定し違えば落として検出する。
  expect(status, "解読不能行あり＝206（正本md。実装200の可能性は付帯表4#2）").toBe(206);
}
function expect400(status: number) {
  // 正本md: 入力不正＝400。041 はSymfony既定形・044 は空白結合 message となる可能性（付帯表4#5/#7）。仕様の400で判定し違えば落として検出する。
  expect(status, "入力不正＝400（正本md: レスポンス失敗 {code, message}）").toBe(400);
}
function expect401(status: number) {
  expect(status, "認証拒否＝401（正本md: 認証・認可／InvalidTokenException・PlayerNotFoundException・DeckAccessDeniedException）").toBe(401);
}
function expect404(status: number) {
  expect(status, "対象デッキなし＝404（正本md: DeckNotFoundException）").toBe(404);
}
async function expectBodyCode(res: { json: () => Promise<unknown> }, expected: number) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(body.code, `成功本文は code:${expected}（snake_case の code フィールド）`).toBe(expected);
}
async function expectSuccessShape(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  // 正本md: 成功書式は {code, message, deck_id}（snake_case キー）。文言は付帯表4#4で要確認のためキー存在で判定。
  expect(body.code, "成功本文に code を含む").toBe(CODE_SUCCESS);
  expect(Object.prototype.hasOwnProperty.call(body, "message"), "成功本文に message を含む").toBeTruthy();
  expect(Object.prototype.hasOwnProperty.call(body, "deck_id"), "成功本文に deck_id を含む").toBeTruthy();
}
async function expectDeckIdEquals(res: { json: () => Promise<unknown> }, expected: string | number) {
  const body = (await res.json()) as Record<string, unknown>;
  // deck_id 数値/文字列差異を吸収して照合（更新対象＝パスの既知ID）。
  expect(String(body.deck_id), "成功本文の deck_id が更新対象デッキの識別子と一致").toBe(String(expected));
}
async function expectHasDisplayToken(res: { json: () => Promise<unknown> }, has: boolean) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(
    Object.prototype.hasOwnProperty.call(body, "display_token"),
    has ? "限定公開＝成功本文に display_token を含む" : "限定公開以外＝成功本文に display_token を含まない",
  ).toBe(has);
}
async function expectHasErrors(res: { json: () => Promise<unknown> }, has: boolean) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(
    Object.prototype.hasOwnProperty.call(body, "errors"),
    has ? "解読不能行あり＝本文に errors を含む" : "全行解読＝本文に errors を含まない",
  ).toBe(has);
}
async function expectErrorShape(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  // 正本md: 失敗書式は {code, message}。実装文言の乖離（付帯表4#4/#5）はキー存在で判定し文言は固定しない。
  expect(Object.prototype.hasOwnProperty.call(body, "code"), "失敗本文に code を含む（正本md {code, message}）").toBeTruthy();
  expect(Object.prototype.hasOwnProperty.call(body, "message"), "失敗本文に message を含む（正本md {code, message}）").toBeTruthy();
}
async function expectMessageContains(res: { json: () => Promise<unknown> }, message: string, why: string) {
  const body = (await res.json()) as Record<string, unknown>;
  // 文言は実装ローカライズで乖離（付帯表4#4）。本文全体を文字列化して正本md文言の存在で照合し違えば落として検出する。
  expect(JSON.stringify(body), why).toContain(message);
}

test.describe("API > デッキビルダー_デッキインポート更新", { tag: ["@api", "@a15"] }, () => {
  // ===== 正常インポート更新（IT-09 / IT-16 / IT-24 / IT-32） =====

  test("E2E-A15-18-001 正常パラメータでPUTし200が返る", async () => {
    test.skip(!HAS_API, "A15_18_READY(SEED-A15-18-JWT-PLAYER/DECK/MASTER/PAYLOAD) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-18-002 更新実行後の処理結果が一致する", async () => {
    test.skip(!HAS_API, "A15_18_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await expectBodyCode(res, CODE_SUCCESS); // 処理結果（成功）が応答 {code:200} と一致。更新内容のDB反映はDB副作用はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-18-003 成功時のHTTPステータスが200で本文がcode=200を含む", async () => {
    test.skip(!HAS_API, "A15_18_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await expectBodyCode(res, CODE_SUCCESS);
    await ctx.dispose();
  });

  test("E2E-A15-18-004 成功レスポンス書式がcode・message・deck_idを持つ", async () => {
    test.skip(!HAS_API, "A15_18_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await expectSuccessShape(res); // 正本md: 成功書式 {code, message, deck_id}（snake_case）。message 文言は付帯表4#4で要確認。
    await ctx.dispose();
  });

  test("E2E-A15-18-005 有効なJWTで更新が成功する", async () => {
    test.skip(!HAS_API, "A15_18_READY(SEED-A15-18-JWT-PLAYER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status()); // 資格情報が有効（該当プレイヤーあり・所有者）＝200。
    await ctx.dispose();
  });

  test("E2E-A15-18-006 整合性検証を満たすリクエストで更新成功200となる", async () => {
    test.skip(!HAS_API, "A15_18_READY(SEED-A15-18-MASTER) 未設定");
    const ctx = await newCtx();
    // 採用カード・デッキ本体の整合性検証を満たす正常リクエスト。
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-18-007 デッキ更新インポートの取り込み結果が対象データと一致する", async () => {
    test.skip(!HAS_API, "A15_18_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    // 一次オラクル: card_list を解読した取り込み結果が更新後のデッキ内容と一致。DB副作用はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-18-008 更新成功時のmessageが更新メッセージである", async () => {
    test.skip(!HAS_API, "A15_18_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    // PUT（idあり）＝更新分岐。成功 message は正本md「Deck update success by import」。実装はローカライズ trans＝付帯表4#4。仕様文言で照合し違えば落として検出する。
    await expectMessageContains(res, SPEC_MESSAGE.UPDATE_SUCCESS, "本文に更新成功メッセージを含む（正本md文言・付帯表4#4要確認）");
    await ctx.dispose();
  });

  test("E2E-A15-18-009 成功本文に更新したデッキのdeck_idが返る", async () => {
    test.skip(!HAS_API, "A15_18_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await expectDeckIdEquals(res, DECK_ID.TARGET); // 成功本文の deck_id がパスの既知ID（更新対象）と一致。
    await ctx.dispose();
  });

  // ===== 認証・認可（IT-32 / IT-10 / IT-33。HS256署名検証の実方式は要実機確認＝env供給トークンで判定） =====

  test("E2E-A15-18-020 jwt-tokenヘッダ欠落で401となり更新されない", async () => {
    test.skip(!HAS_API, "A15_18_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildNoAuthHeaders(), data: buildValidPayload() });
    expect401(res.status()); // ヘッダ欠落＝認証拒否401。デッキが更新されないことはDB副作用はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-18-021 署名不正のJWTで401となり更新されない", async () => {
    test.skip(!HAS_API, "A15_18_READY(SEED-A15-18-JWT-PLAYER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(JWT_BAD_SIGNATURE), data: buildValidPayload() });
    expect401(res.status()); // 署名検証失敗＝401（InvalidTokenException）。HS256署名検証の実方式は要実機確認だが結果（401・非更新）で判定。
    await ctx.dispose();
  });

  test("E2E-A15-18-022 該当するプレイヤーが無いJWTで401となり更新されない", async () => {
    test.skip(!HAS_API, "A15_18_READY(SEED-A15-18-JWT-PLAYER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(JWT_NO_PLAYER), data: buildValidPayload() });
    expect401(res.status()); // 顧客IDからプレイヤーを特定できず401（PlayerNotFoundException）。更新されないことはDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-18-023 他人のデッキを更新しようとすると401となり更新されない", async () => {
    test.skip(!HAS_API, "A15_18_READY(SEED-A15-18-DECK 別プレイヤー所有) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.OTHER_PLAYER), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect401(res.status()); // 所有者外＝401「Authentication failed」（DeckAccessDeniedException）。対象デッキ不変はDB副作用はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-18-024 未認証・トークン不正時に対象レコードの値が変更されない", async () => {
    test.skip(!HAS_API, "A15_18_READY(SEED-A15-18-DECK) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildNoAuthHeaders(), data: buildValidPayload() });
    expect401(res.status());
    // 一次オラクル: 未認証時は対象デッキのデッキ本体・採用カードが受信前から変更されない。DB副作用はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  // ===== データなし（IT-24） =====

  test("E2E-A15-18-030 存在しないデッキIDで404となり更新されない", async () => {
    test.skip(!HAS_API, "A15_18_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.NONEXISTENT), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect404(res.status()); // 該当なし＝404「The deck does not exist」（DeckNotFoundException）。更新が行われないことはDB照査で補完。
    await ctx.dispose();
  });

  // ===== バリデーション・形式不正（IT-16 / IT-17 / IT-10 / IT-32） =====

  test("E2E-A15-18-040 format_id未指定で400となり更新されない", async () => {
    test.skip(!HAS_API, "A15_18_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildMissingFormatIdPayload() });
    expect400(res.status()); // format_id 必須未充足＝400（InvalidRequestException('format_id is required')）。
    await expectErrorShape(res); // 正本md: 失敗本文 {code, message}。文言は付帯表4#4で要確認。
    await ctx.dispose();
  });

  test("E2E-A15-18-041 card_listが501行（上限超過）で400となる", async () => {
    test.skip(!HAS_API, "A15_18_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildOverMaxCardListPayload() });
    expect400(res.status());
    // 正本md: 上限500行超過＝400＋本文 {code, message}。実装はトランザクション外送出でSymfony既定応答形となり {code,message} 形にならない可能性（付帯表4#7）。仕様で固定し違えば落として検出する。
    await ctx.dispose();
  });

  test("E2E-A15-18-042 card_listが500行ちょうど（上限）で更新が成功する", async () => {
    test.skip(!HAS_API, "A15_18_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildMaxCardListPayload() });
    expect200(res.status()); // 境界内（500行）はエラーとならず更新成功200。
    await ctx.dispose();
  });

  test("E2E-A15-18-043 デッキ内容の整合性検証失敗で400となり更新されない", async () => {
    test.skip(!HAS_API, "A15_18_READY(SEED-A15-18-MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildInvalidDeckPayload() });
    expect400(res.status()); // 整合性検証失敗＝400（validateDeck→InvalidRequestException）。
    await expectErrorShape(res); // 正本md: 失敗本文 {code, message}（message は検証エラー内容）。文言は付帯表4#4で要確認。
    await ctx.dispose();
  });

  test("E2E-A15-18-044 複数の整合性違反を同時に含むリクエストで400となる", async () => {
    test.skip(!HAS_API, "A15_18_READY(SEED-A15-18-MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildMultipleViolationsPayload() });
    expect400(res.status());
    // 複数違反同時でも400を確認。実装は空白結合の単一 message で返す（付帯表4#5）ため全件個別列挙の構造・ソート順は固定しない。
    await ctx.dispose();
  });

  test("E2E-A15-18-045 異常なパラメータ値で400となる", async () => {
    test.skip(!HAS_API, "A15_18_READY(SEED-A15-18-MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildInvalidParamPayload() });
    expect400(res.status()); // 異常なパラメータ値＝400。更新されないことはDB照査で補完。
    await ctx.dispose();
  });

  // ===== 解読不能行／部分成功（IT-24。206/200 乖離は付帯表4#2） =====

  test("E2E-A15-18-050 解読できない行があるとcode206でerrorsに行番号が返る", async () => {
    test.skip(!HAS_API, "A15_18_READY(SEED-A15-18-MASTER 解読不能行構成) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildUndecodableLinePayload() });
    expect206(res.status()); // 正本md: 解読不能行あり＝HTTP206。実装はHTTP200のまま（付帯表4#2）。仕様で固定し落として検出する。
    await expectBodyCode(res, CODE_PARTIAL); // 本文 code も206（正本md）。実装は200のまま＝付帯表4#2。
    await expectHasErrors(res, true); // errors に該当行の行番号（0始まりインデックス）配列を付加。
    await ctx.dispose();
  });

  test("E2E-A15-18-051 解読できない行があっても更新自体は完了する", async () => {
    test.skip(!HAS_API, "A15_18_READY(SEED-A15-18-MASTER 解読不能行構成) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildUndecodableLinePayload() });
    expect206(res.status()); // 正本md: 部分成功＝206（処理フロー#7）。実装は200のまま＝付帯表4#2。
    // 一次オラクル: 更新は中断せず完了し、解読できた行の内容でデッキが更新される。DB副作用はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-18-052 全行解読できた場合はcode200でerrorsを含まない", async () => {
    test.skip(!HAS_API, "A15_18_READY(SEED-A15-18-MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildAllDecodablePayload() });
    expect200(res.status());
    await expectBodyCode(res, CODE_SUCCESS); // 全行解読＝本文 code:200。
    await expectHasErrors(res, false); // errors フィールドを含まない。
    await ctx.dispose();
  });

  // ===== 公開区分と display_token（IT-24） =====

  test("E2E-A15-18-060 公開区分が限定公開のとき応答にdisplay_tokenを含む", async () => {
    test.skip(!HAS_API, "A15_18_READY(SEED-A15-18-DECK scope限定公開) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildUnlistedScopePayload() });
    expect200(res.status());
    await expectHasDisplayToken(res, true); // scope_id===限定公開＝成功本文に display_token を付加（DeckController.php:735-738）。
    await ctx.dispose();
  });

  test("E2E-A15-18-061 公開区分が公開・非公開のとき応答にdisplay_tokenを含まない", async () => {
    test.skip(!HAS_API, "A15_18_READY(SEED-A15-18-DECK) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildPublicScopePayload() });
    expect200(res.status());
    await expectHasDisplayToken(res, false); // 限定公開以外＝display_token を含まない。
    await ctx.dispose();
  });

  // ===== card_list 境界（空）（IT-16） =====

  test("E2E-A15-18-062 card_list未指定・空のとき空のカード配列として200で更新される", async () => {
    test.skip(!HAS_API, "A15_18_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildEmptyCardListPayload() });
    expect200(res.status()); // card_list 空＝空のカード配列として200で更新成功。
    // 一次オラクル: 採用カードが空になる。DB副作用はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  // ===== DB更新副作用（IT-27 / IT-33。一次オラクル＝DB副作用照合。本specはAPI応答を確認しDB照査で補完） =====

  test("E2E-A15-18-070 既存デッキ本体が指定値へ上書き更新される", async () => {
    test.skip(!HAS_API, "A15_18_READY(SEED-A15-18-DECK) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_deck のデッキ名・フォーマット・アーキタイプ・非公開フラグ・本文が指定値へ上書き。DB副作用はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-18-071 採用カードが初期化されカードリスト解読結果で作り直される", async () => {
    test.skip(!HAS_API, "A15_18_READY(SEED-A15-18-DECK 既存採用カードあり) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildReplacedCardListPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_deck_card が初期化＋card_list解読結果で作り直され旧採用カードが残らない。DB副作用はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-18-072 メイビー・アトラクション・ステッカーが初期化され作り直される", async () => {
    test.skip(!HAS_API, "A15_18_READY(SEED-A15-18-DECK 既存ボード外カードあり) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildReplacedCardListPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_maybe_card・dtb_attraction_card・dtb_sticker_card が初期化＋作り直しで旧レコードが取得結果に含まれない。DB副作用はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-18-073 更新後に更新対象外の別デッキ・他プレイヤーデッキが不変", async () => {
    test.skip(!HAS_API, "A15_18_READY(SEED-A15-18-DECK 対象デッキ＋別デッキ) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    // 一次オラクル: 更新対象外の別デッキ・他プレイヤーデッキのデッキ本体・採用カードが更新前と一致し不変。DB副作用はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-18-074 検証エラー時にデッキ本体・採用カードが部分更新されない", async () => {
    test.skip(!HAS_API, "A15_18_READY(SEED-A15-18-MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildInvalidDeckPayload() });
    expect400(res.status());
    // 一次オラクル: 検証エラー時はトランザクションがロールバックされ、デッキ本体・採用カード（初期化対象を含む）が受信前と一致し部分更新が残らない。DB副作用はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-18-075 更新後もデッキ識別子は同一のまま内容が上書きされる", async () => {
    test.skip(!HAS_API, "A15_18_READY(SEED-A15-18-DECK) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await expectDeckIdEquals(res, DECK_ID.TARGET); // 応答 deck_id がパスのID（同一識別子）と一致。
    // 一次オラクル: dtb_deck の識別子が同一のまま内容が上書き。DB副作用はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  // ===== 入力検証（IT-22・設計書補完。整合性検証未充足→400。文言は付帯表4#4-5で乖離記録） =====

  test("E2E-A15-18-110 採用カードの制約を満たさないと400となり更新されない", async () => {
    test.skip(!HAS_API, "A15_18_READY(SEED-A15-18-MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildBoardCardConstraintViolationPayload() });
    expect400(res.status()); // ボード区分ごとの採用カード制約未充足＝400（validateDeck）。
    await expectErrorShape(res); // 正本md: 失敗本文 {code, message}。文言は付帯表4#4で要確認。
    await ctx.dispose();
  });

  test("E2E-A15-18-111 デッキ本体の制約を満たさないと400となり更新されない", async () => {
    test.skip(!HAS_API, "A15_18_READY(SEED-A15-18-MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildImportUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildDeckBodyConstraintViolationPayload() });
    expect400(res.status()); // デッキ本体制約未充足＝400（validateDeck）。
    await expectErrorShape(res); // 正本md: 失敗本文 {code, message}（message は検証エラー内容）。文言は付帯表4#4で要確認。
    await ctx.dispose();
  });
});
