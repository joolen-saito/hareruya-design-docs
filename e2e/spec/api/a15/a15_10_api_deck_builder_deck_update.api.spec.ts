/**
 * a15-10 デッキビルダー_デッキ更新（JWT認証つき PUT API＝デッキビルダーの自所有デッキ更新。ブラウザ向け画面を持たないJSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a15_10_api_deck_builder_deck_update_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を NORMAL test で実装する。disposition に `要実機確認`/`要確認` 修飾が付く 024（所有者外の実ステータス）・047（scope_id必須強制ステータス）は test.fixme。
 * 手動（009 想定外項目仕様未定義・060 並行送信・061 タイムアウト・127 Redis一時保存・128 即時保存時Redis削除・129 更新日時・150 保存例外→500）はケース表で全量管理し本specには書かない（規約）。
 * 本機能は画面なしAPI（正本md「ブラウザ向けの画面を持たない」）のためUI専用specは無い（自動化(UI)0件）。
 *
 * 期待結果は仕様（正本md＝pf-api挙動／観点表・基本設計）由来（オラクル独立性）。実装のレスポンス形・FW既定値・JWTクレーム名・trans文言を期待値に流用しない。
 *  - 送信先は実装の実効パス `PUT /api/deck/{id}`（DeckController.php:124＝付帯表1/付帯表4#1。正本md `PUT /deck/{id}` は `/api` を欠き不一致）。
 *  - 認証は `jwt-token` ヘッダ直接読み（DeckController.php:131）＋JwtPlayerAuthenticator（UpdateDeckAction.php:68／JwtPlayerAuthenticator.php:35）。HS256。欠落/署名不正/該当プレイヤーなし＝401。
 *    所有者外は正本md仕様401（実装は403＝付帯表4#3）。クレーム名は正本md `aud`／実装 `sub`（付帯表4#2）＝SEED発行は要実機確認。
 *  - 合否（成功）は HTTP200＋応答 `{code:200, message}`、scope_id===限定公開(3) のとき `display_token` を付加。（失敗）は 400（整合性検証）/401（認証）/404（対象なし）を仕様由来で判定する。
 *    message 文言は固定しない（正本md英語リテラル／実装ローカライズ trans＝付帯表4#4）。code/{code,message} 書式・HTTPステータスで判定する。
 *  - DB副作用ケース（050/051/120/121/122/125/126）は一次オラクルとしてAPI応答（status/body）を確認し、「DB副作用はDB照査で補完（本リポでDBは実行しない）」。Redis一時保存の中身・削除は手動/要実機（本specに無し）。
 *  - 有効JWT原値・署名シークレット・SEED ID は env で供給し原値はコミットしない。正本md未定義の想定外項目（付帯表4#7）は送信・期待に含めない。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_10_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildUpdatePath,
  buildJwtHeaders,
  buildNoAuthHeaders,
  JWT_NO_PLAYER,
  JWT_BAD_SIGNATURE,
  DECK_ID,
  SCOPE,
  buildValidPayload,
  buildMissingScopeIdPayload,
  buildInvalidCardsPayload,
  buildInvalidDeckBodyPayload,
  buildMissingRequiredPayload,
  buildMultipleViolationsPayload,
  buildInvalidPayload,
  buildReplacedCardsPayload,
  buildRegulationViolationPayload,
  buildDraftPayload,
} from "../../../pages/api/a15/a15_10_api_deck_builder_deck_update.api";

const HAS_API = !!process.env.A15_10_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常更新＝200（正本md: レスポンス成功 code:200）").toBe(200);
}
function expect400(status: number) {
  expect(status, "入力不正（整合性検証失敗）＝400（正本md: InvalidRequestException／DeckController.php:155-156）").toBe(400);
}
function expect401(status: number) {
  // 正本md: 認証拒否＝401（欠落/署名不正/該当プレイヤーなし／所有者外も仕様401）。所有者外は実装403の乖離（付帯表4#3）。
  expect(status, "認証拒否＝401（正本md: 認証・認可節）").toBe(401);
}
function expect404(status: number) {
  expect(status, "対象デッキなし＝404（正本md: DeckNotFoundException／DeckController.php:150-154）").toBe(404);
}
function expectClientError(status: number) {
  // 異常リクエストは成功扱いされない（4xx）。確定保存が行われずデッキが更新されないことはDB照査で補完。
  expect(status, "異常＝4xx（更新が行われない）").toBeGreaterThanOrEqual(400);
  expect(status, "異常＝4xx").toBeLessThan(500);
}
async function expectCode200Body(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(body.code, "成功本文は code:200（正本md レスポンス成功）").toBe(200);
}
async function expectCodeMessageFormat(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  // 正本md: 成功/失敗いずれも書式は {code, message}（限定公開時は display_token 付加）。message 文言は固定しない（付帯表4#4）。
  expect(Object.prototype.hasOwnProperty.call(body, "code"), "本文に code を含む（正本md {code, message}）").toBeTruthy();
  expect(Object.prototype.hasOwnProperty.call(body, "message"), "本文に message を含む（正本md {code, message}）").toBeTruthy();
}
async function expectDisplayTokenPresent(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(Object.prototype.hasOwnProperty.call(body, "display_token"), "限定公開(3)時は応答に display_token を含む（正本md レスポンス成功）").toBeTruthy();
}
async function expectDisplayTokenAbsent(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(Object.prototype.hasOwnProperty.call(body, "display_token"), "公開(1)/非公開(2)時は応答に display_token を含まない（正本md レスポンス成功）").toBeFalsy();
}

test.describe("API > デッキビルダー_デッキ更新", { tag: ["@api", "@a15"] }, () => {
  // ===== 正常更新（IT-09 / IT-10 / IT-32） =====

  test("E2E-A15-10-001 正常パラメータでPUTし200が返る", async () => {
    test.skip(!HAS_API, "A15_10_READY(SEED-A15-10-JWT-PLAYER/DECK/MASTER/PAYLOAD) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-10-002 更新実行後の処理結果が一致する", async () => {
    test.skip(!HAS_API, "A15_10_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await expectCode200Body(res); // 処理結果（成功）が応答 code:200 と一致。更新内容のDB反映はDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-10-003 成功時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A15_10_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-10-004 成功レスポンス本文がcode=200を含む", async () => {
    test.skip(!HAS_API, "A15_10_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await expectCode200Body(res); // message 文言は付帯表4#4の乖離記録に従い要確認＝固定しない。
    await ctx.dispose();
  });

  test("E2E-A15-10-005 正常通信で200が返る", async () => {
    test.skip(!HAS_API, "A15_10_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status()); // PUT通信成立・成功＝200。
    await ctx.dispose();
  });

  test("E2E-A15-10-006 対象条件に該当する正常値で200が返る", async () => {
    test.skip(!HAS_API, "A15_10_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-10-007 成功レスポンス書式がcodeとmessageを持つ", async () => {
    test.skip(!HAS_API, "A15_10_READY 未設定");
    const ctx = await newCtx();
    // scope_id=公開(1)：成功書式 {code, message}（限定公開時のみ display_token を付加。本ケースは非付加を期待）。
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload({ scopeId: SCOPE.PUBLIC }) });
    expect200(res.status());
    await expectCodeMessageFormat(res); // message 文言は付帯表4#4の乖離記録に従い要確認＝書式のみ判定。
    await expectDisplayTokenAbsent(res);
    await ctx.dispose();
  });

  test("E2E-A15-10-008 整合性検証を満たすリクエストで更新成功200となる", async () => {
    test.skip(!HAS_API, "A15_10_READY(SEED-A15-10-MASTER) 未設定");
    const ctx = await newCtx();
    // 採用カード・デッキ本体の整合性検証を満たす正常リクエスト。
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  // ===== 認証・認可（IT-32 / IT-10。HS256署名検証の実方式・aud/subクレームは要実機確認＝env供給トークンで判定） =====

  test("E2E-A15-10-020 有効なJWTで更新が成功する", async () => {
    test.skip(!HAS_API, "A15_10_READY(SEED-A15-10-JWT-PLAYER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status()); // 資格情報が有効＝200。
    await ctx.dispose();
  });

  test("E2E-A15-10-021 jwt-tokenヘッダ欠落で401となり更新されない", async () => {
    test.skip(!HAS_API, "A15_10_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildNoAuthHeaders(), data: buildValidPayload() });
    expect401(res.status()); // ヘッダ欠落＝認証拒否401（InvalidTokenException）。デッキが更新されないことはDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-10-022 該当するプレイヤーが無いJWTで401となり更新されない", async () => {
    test.skip(!HAS_API, "A15_10_READY(SEED-A15-10-JWT-PLAYER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(JWT_NO_PLAYER), data: buildValidPayload() });
    expect401(res.status()); // 顧客IDからプレイヤーを特定できず401（PlayerNotFoundException）。更新されないことはDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-10-023 署名不正のJWTで401となり更新されない", async () => {
    test.skip(!HAS_API, "A15_10_READY(SEED-A15-10-JWT-PLAYER 署名不正派生) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(JWT_BAD_SIGNATURE), data: buildValidPayload() });
    expect401(res.status()); // 署名検証失敗＝401。HS256署名検証の実方式は要実機確認だが結果（401・非更新）で判定。
    await ctx.dispose();
  });

  // 024: E2E自動化(API/統合)（要実機確認・所有者外の実ステータス）→ test.fixme。正本md仕様401で判定するが実装は403（付帯表4#3）。
  test.fixme("E2E-A15-10-024 他人のデッキを更新しようとすると401となり更新されない", async () => {
    test.skip(!HAS_API, "A15_10_READY(SEED-A15-10-DECK 別プレイヤー所有) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.OTHER_PLAYER), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect401(res.status()); // 所有者外＝認証拒否401（正本md仕様）。実装はDeckAccessDeniedException→403のため要実機確認（付帯表4#3）。非更新はDB照査で補完。
    await ctx.dispose();
  });

  // ===== データなし（IT-32） =====

  test("E2E-A15-10-030 存在しないデッキIDで404となり更新されない", async () => {
    test.skip(!HAS_API, "A15_10_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.NONEXISTENT), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect404(res.status()); // 該当デッキなし＝404（DeckNotFoundException）。更新が行われないことはDB照査で補完。
    await ctx.dispose();
  });

  // ===== バリデーション・エラー本文（IT-10 / IT-32） =====

  test("E2E-A15-10-040 採用カード・デッキ本体の整合性検証失敗で400となる", async () => {
    test.skip(!HAS_API, "A15_10_READY(SEED-A15-10-MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildInvalidCardsPayload() });
    expect400(res.status());
    await expectCodeMessageFormat(res); // 本文は {code, message}（message は検証エラー内容。文言は付帯表4#4で要確認）。
    await ctx.dispose();
  });

  test("E2E-A15-10-041 入力不正時のHTTPステータスが400である", async () => {
    test.skip(!HAS_API, "A15_10_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildInvalidCardsPayload() });
    expect400(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-10-042 異常リクエストで4xxとなり更新されない", async () => {
    test.skip(!HAS_API, "A15_10_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildInvalidPayload() });
    expectClientError(res.status()); // 確定保存が行われずデッキが更新されないことはDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-10-045 整合性未充足で400となりmessageを返す", async () => {
    test.skip(!HAS_API, "A15_10_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildMissingRequiredPayload() });
    expect400(res.status());
    await expectCodeMessageFormat(res); // 本文 {code, message}（message は検証エラー内容。文言は付帯表4#4で要確認）。
    await ctx.dispose();
  });

  test("E2E-A15-10-046 異常なパラメータ値で400となる", async () => {
    test.skip(!HAS_API, "A15_10_READY(SEED-A15-10-MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildInvalidCardsPayload() });
    expect400(res.status()); // 採用カードに整合性違反の値＝400。
    await ctx.dispose();
  });

  test("E2E-A15-10-048 複数の整合性違反を同時に含むリクエストで400となる", async () => {
    test.skip(!HAS_API, "A15_10_READY(SEED-A15-10-MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildMultipleViolationsPayload() });
    expect400(res.status());
    // 複数違反同時送信でも400＋{code, message} を確認。複数件を個別に全件列挙する返却構造・ソート順は正典に定義が無く固定しない（付帯表4#5）。
    await expectCodeMessageFormat(res);
    await ctx.dispose();
  });

  // 047: E2E自動化(API/統合)（要確認・必須強制ステータス）→ test.fixme。正本mdはscope_id必須だが実装は既定0で成功（付帯表4#6）。
  test.fixme("E2E-A15-10-047 scope_id未指定時に必須未充足として更新が成功しない", async () => {
    test.skip(!HAS_API, "A15_10_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildMissingScopeIdPayload() });
    // 正本md: scope_id 必須＝未指定時は更新を成功させない（入力不正応答）。実装は既定0で続行・成功するため要確認（付帯表4#6）。必須強制時の具体ステータスは正典に明記なし。
    expect(res.status(), "scope_id 必須未充足＝更新を成功させない（正本md 入出力節。必須強制ステータスは要確認）").not.toBe(200);
    await ctx.dispose();
  });

  // ===== 入力検証（IT-22・設計書補完。検証失敗時の400・本文 {code, message}。文言は付帯表4#4で要確認） =====

  test("E2E-A15-10-110 採用カードの制約を満たさないと400となる", async () => {
    test.skip(!HAS_API, "A15_10_READY(SEED-A15-10-MASTER) 未設定");
    const ctx = await newCtx();
    // ボード区分ごとに組み立てた採用カード（メイビー・アトラクション・ステッカーを含む）の制約が未充足。
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildInvalidCardsPayload() });
    expect400(res.status());
    await expectCodeMessageFormat(res);
    await ctx.dispose();
  });

  test("E2E-A15-10-111 デッキ本体の制約を満たさないと400となる", async () => {
    test.skip(!HAS_API, "A15_10_READY(SEED-A15-10-MASTER) 未設定");
    const ctx = await newCtx();
    // フォーマット・公開範囲・採用カードを設定したうえでデッキ本体の制約が未充足。
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildInvalidDeckBodyPayload() });
    expect400(res.status());
    await expectCodeMessageFormat(res);
    await ctx.dispose();
  });

  // ===== 区分整合・部分更新なし（IT-33。一次オラクル＝API応答＋DB副作用照合。本specはAPI応答を確認しDB照査で補完） =====

  test("E2E-A15-10-050 更新後に更新対象外の別デッキ・他プレイヤーデッキが不変", async () => {
    test.skip(!HAS_API, "A15_10_READY(SEED-A15-10-DECK 対象＋別デッキ) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    // 一次オラクル: 更新対象外の別デッキ・他プレイヤーデッキのデッキ本体・採用カードが更新前と一致（不変）。DB副作用はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-10-051 検証エラー時にデッキ本体・採用カードが部分更新されない", async () => {
    test.skip(!HAS_API, "A15_10_READY(SEED-A15-10-MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildInvalidPayload() });
    expectClientError(res.status());
    // 一次オラクル: 検証エラー時はトランザクションがロールバックされデッキ本体・採用カード（初期化分含む）が受信前と一致（部分更新なし）。DB副作用はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  // ===== DB更新副作用（IT-26・設計書補完。一次オラクル＝DB副作用照合。本specはAPI応答を確認しDB照査で補完） =====

  test("E2E-A15-10-120 即時保存でデッキ本体が指定値へ更新される", async () => {
    test.skip(!HAS_API, "A15_10_READY(SEED-A15-10-DECK/MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), {
      headers: buildJwtHeaders(),
      data: buildValidPayload({ deckName: "更新後デッキ名" }),
    });
    expect200(res.status());
    // 一次オラクル: dtb_deck のデッキ名・フォーマット・アーキタイプ・代表カード画像が指定値へ更新。DB副作用はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-10-121 即時保存で採用カードが初期化され送信内容で作り直される", async () => {
    test.skip(!HAS_API, "A15_10_READY(SEED-A15-10-DECK 既存採用カードあり) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildReplacedCardsPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_deck_card・dtb_maybe_card・dtb_attraction_card・dtb_sticker_card が初期化され送信内容で作り直し（旧採用カードが残らない）。DB副作用はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-10-122 即時保存でプレイヤー・プレイヤー名に認証プレイヤーが設定される", async () => {
    test.skip(!HAS_API, "A15_10_READY(SEED-A15-10-JWT-PLAYER/DECK) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_deck のプレイヤー・プレイヤー名に jwt-token から特定した認証プレイヤーが設定。DB副作用はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-10-123 公開範囲が限定公開(3)のとき応答にdisplay_tokenを含む", async () => {
    test.skip(!HAS_API, "A15_10_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload({ scopeId: SCOPE.UNLISTED }) });
    expect200(res.status());
    await expectDisplayTokenPresent(res); // scope_id===3 で閲覧用トークン display_token を付加。
    await ctx.dispose();
  });

  test("E2E-A15-10-124 公開範囲が公開(1)・非公開(2)のとき応答にdisplay_tokenを含まない", async () => {
    test.skip(!HAS_API, "A15_10_READY 未設定");
    const ctx = await newCtx();
    const resPublic = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload({ scopeId: SCOPE.PUBLIC }) });
    expect200(resPublic.status());
    await expectDisplayTokenAbsent(resPublic);
    const resPrivate = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload({ scopeId: SCOPE.PRIVATE }) });
    expect200(resPrivate.status());
    await expectDisplayTokenAbsent(resPrivate); // 限定公開以外は display_token を含まない。
    await ctx.dispose();
  });

  test("E2E-A15-10-125 レギュレーション違反でも更新は成功しフラグが保存される", async () => {
    test.skip(!HAS_API, "A15_10_READY(SEED-A15-10-MASTER レギュレーション違反構成) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildRegulationViolationPayload() });
    expect200(res.status()); // レギュレーション違反は更新を妨げず200で成功。
    // 一次オラクル: dtb_deck のレギュレーション違反フラグが立った状態で保存。DB副作用はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-10-126 下書き保存(即時保存フラグ無)ではDBが更新されない", async () => {
    test.skip(!HAS_API, "A15_10_READY(SEED-A15-10-DECK) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(DECK_ID.TARGET), { headers: buildJwtHeaders(), data: buildDraftPayload() });
    expect200(res.status()); // 下書き（instant_save_flag偽）も整合性検証通過で200。
    // 一次オラクル: dtb_deck のデッキ本体・採用カードが更新されず受信前と一致（下書きはRedis一時保存のみ）。DB副作用はDB照査で補完（本リポでDBは実行しない）。Redis一時保存の中身は手動/要実機。
    await ctx.dispose();
  });
});
