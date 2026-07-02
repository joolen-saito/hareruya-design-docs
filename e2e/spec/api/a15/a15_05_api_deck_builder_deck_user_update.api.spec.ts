/**
 * a15-05 デッキビルダー_ユーザー更新（デッキビルダーの自プレイヤー＝ニックネーム・プロフィールをJWT認証つきで更新するJSON API・PUT）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a15_05_api_deck_builder_deck_user_update_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装する。本機能の 付帯表1 に「E2E自動化（要実機確認）」修飾の行は無く、test.fixme は無い。
 * 手動（009 想定外項目の許容/無視/エラー仕様未定義・060 同時実行=並行送信実再現・061 タイムアウト実再現・150 保存例外→ロールバック実再現）はケース表で全量管理し本specには書かない（規約）。
 * 本機能は画面なしAPI（正本md「ブラウザ向けの画面を持たない」）のためUI専用specは無い（自動化(UI)0件）。
 *
 * 期待結果は仕様（正本md＝pf-api挙動／観点表・基本設計）由来（オラクル独立性）。実装のレスポンス形・FW既定値・JWTクレーム名・trans文言を期待値に流用しない。
 *  - 実効パス（file:line根拠）: `PUT /api/user`（UserController.php:78 `#[Route('/api/user', ... methods:['PUT','OPTIONS'])]`）。正本md `PUT /user` は `/api` を欠き不一致（付帯表4#1）。
 *  - 認証は `jwt-token` ヘッダ直接読み（UserController.php:85）＋`JwtTokenService->verifyToken`（UpdateUserAction.php:90）。欠落→401（UserController.php:86-91）／署名不正→401（UpdateUserAction.php:91-93）。
 *    プレイヤー特定キーは正本md=`aud`／実装=`sub`（UpdateUserAction.php:95・付帯表4#2＝要実機確認）。
 *  - 合否（成功）は HTTP200＋本文 `{code:200, message}`（snake_case 2フィールド）、（失敗）は 400／401＋`{code, message}` を仕様由来で判定する。
 *    該当プレイヤーなしは正本md仕様の 401 を期待する。実装は 400 を返す（UserController.php:122-126・付帯表4#3）→ 仕様どおり期待し違えば落として検出する（実装へ寄せない）。
 *    message 文言は実装が日本語ローカライズで正本md（英語リテラル）と乖離（成功＝付帯表4#6／失敗＝付帯表4#7）。文言は固定せず code・ステータス・書式で判定する。
 *  - DB副作用（dtb_player のニックネーム・プロフィール・対象外項目）は本APIに参照系I/Fが無くGET不可のため、spec側は一次オラクルとしてAPI応答（200/4xx）を確認し、DB副作用照合は「DB照査で補完」する（本リポでDBは実行しない）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_05_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  UPDATE_PATH,
  JWT_NO_PLAYER,
  JWT_BAD_SIGNATURE,
  buildJwtHeaders,
  buildNoAuthHeaders,
  buildValidPayload,
  buildMissingUserNamePayload,
  buildProfileOmittedPayload,
} from "../../../pages/api/a15/a15_05_api_deck_builder_deck_user_update.api";

const HAS_API = !!process.env.A15_05_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常更新＝200（正本md: レスポンス成功 {code:200}）").toBe(200);
}
function expect400(status: number) {
  expect(status, "入力不正＝400（正本md: バリデーション節・レスポンス失敗）").toBe(400);
}
function expect401(status: number) {
  // 正本md: 認証拒否／該当プレイヤーなし＝401。実装は該当プレイヤーなしを400で返す可能性（付帯表4#3）。仕様の401で判定し違えば落として検出する。
  expect(status, "認証拒否／該当プレイヤーなし＝401（正本md: 認証・認可節。実装400の可能性は付帯表4#3）").toBe(401);
}
function expectClientError(status: number) {
  // 異常リクエストは成功扱いされない（4xx）。検証ステータスの差異を範囲で吸収する。
  expect(status, "異常＝4xx（更新が行われない）").toBeGreaterThanOrEqual(400);
  expect(status, "異常＝4xx").toBeLessThan(500);
}
async function expectCode200Body(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(body.code, "成功本文は code:200（正本md: レスポンス成功）").toBe(200);
}
async function expectCodeMessageBody(res: { json: () => Promise<unknown> }, why: string) {
  const body = (await res.json()) as Record<string, unknown>;
  // 正本md: 本文書式は {code, message}（snake_case の2フィールド）。message 文言は付帯表4#6/#7で乖離記録のため固定せず存在で判定する。
  expect(Object.prototype.hasOwnProperty.call(body, "code"), `${why}: 本文に code を含む`).toBeTruthy();
  expect(Object.prototype.hasOwnProperty.call(body, "message"), `${why}: 本文に message を含む（文言は付帯表4で要確認）`).toBeTruthy();
}

test.describe("API > デッキビルダー_ユーザー更新", { tag: ["@api", "@a15"] }, () => {
  // ===== 正常更新（IT-09 / IT-10 / IT-32） =====

  test("E2E-A15-05-001 正常パラメータでPUTし200が返る", async () => {
    test.skip(!HAS_API, "A15_05_READY(SEED-A15-05-JWT-PLAYER/PLAYER/PAYLOAD) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(UPDATE_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-05-002 更新実行後の処理結果が一致する", async () => {
    test.skip(!HAS_API, "A15_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(UPDATE_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await expectCode200Body(res); // 処理結果（成功）が応答 {code:200} と一致。更新内容のDB反映はDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-05-003 成功時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A15_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(UPDATE_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-05-004 成功レスポンス本文がcode=200を含む", async () => {
    test.skip(!HAS_API, "A15_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(UPDATE_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await expectCode200Body(res); // 正本md: 成功本文は code:200。message 文言は付帯表4#6で要確認（固定しない）。
    await ctx.dispose();
  });

  test("E2E-A15-05-005 正常通信で200が返る", async () => {
    test.skip(!HAS_API, "A15_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(UPDATE_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status()); // PUT通信成立・成功＝200。
    await ctx.dispose();
  });

  test("E2E-A15-05-006 対象条件に該当する正常値で200が返る", async () => {
    test.skip(!HAS_API, "A15_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(UPDATE_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-05-007 成功レスポンス書式がcodeとmessageの2フィールドである", async () => {
    test.skip(!HAS_API, "A15_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(UPDATE_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await expectCodeMessageBody(res, "成功書式 {code, message}"); // 正本md: snake_case の2フィールド。message文言は付帯表4#6で要確認。
    await expectCode200Body(res);
    await ctx.dispose();
  });

  test("E2E-A15-05-008 入力検証を満たすリクエストで更新成功200となる", async () => {
    test.skip(!HAS_API, "A15_05_READY 未設定");
    const ctx = await newCtx();
    // user_name 必須の入力検証（UserController.php:97-102）を満たす正常リクエスト。
    const res = await ctx.put(UPDATE_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  // ===== 認証・認可（IT-32 / IT-10。HS256署名検証の実方式・aud/subクレームは要実機確認＝env供給トークンで判定） =====

  test("E2E-A15-05-020 有効なJWTで更新が成功する", async () => {
    test.skip(!HAS_API, "A15_05_READY(SEED-A15-05-JWT-PLAYER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(UPDATE_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status()); // 資格情報が有効＝200。
    await ctx.dispose();
  });

  test("E2E-A15-05-021 jwt-tokenヘッダ欠落で401となり更新されない", async () => {
    test.skip(!HAS_API, "A15_05_READY(SEED-A15-05-PLAYER/PAYLOAD) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(UPDATE_PATH, { headers: buildNoAuthHeaders(), data: buildValidPayload() });
    expect401(res.status()); // ヘッダ欠落＝認証拒否401（UserController.php:86-91）。プレイヤーが更新されないことはDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-05-022 該当するプレイヤーが無いJWTで401となり更新されない", async () => {
    test.skip(!HAS_API, "A15_05_READY(SEED-A15-05-JWT-PLAYER 該当なし) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(UPDATE_PATH, { headers: buildJwtHeaders(JWT_NO_PLAYER), data: buildValidPayload() });
    // 顧客IDからプレイヤーを特定できず401（正本md 認証・認可節）。実装は400で返す＝付帯表4#3。仕様の401で判定。非更新はDB照査で補完。
    expect401(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-05-023 署名不正のJWTで401となり更新されない", async () => {
    test.skip(!HAS_API, "A15_05_READY(SEED-A15-05-JWT-PLAYER 署名不正) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(UPDATE_PATH, { headers: buildJwtHeaders(JWT_BAD_SIGNATURE), data: buildValidPayload() });
    expect401(res.status()); // 署名検証失敗＝401（UpdateUserAction.php:91-93）。HS256署名検証の実方式は要実機確認だが結果（401・非更新）で判定。
    await ctx.dispose();
  });

  // ===== データなし（IT-32 / IT-10） =====

  test("E2E-A15-05-030 顧客IDに該当するプレイヤーが存在せず401となり更新されない", async () => {
    test.skip(!HAS_API, "A15_05_READY(SEED-A15-05-JWT-PLAYER 該当なし) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(UPDATE_PATH, { headers: buildJwtHeaders(JWT_NO_PLAYER), data: buildValidPayload() });
    // aud(顧客ID)に該当プレイヤーなし＝401（正本md:69,80）。実装は400で返す＝付帯表4#3。仕様の401で判定。更新が行われないことはDB照査で補完。
    expect401(res.status());
    await ctx.dispose();
  });

  // ===== バリデーション・エラー本文（IT-10 / IT-32） =====

  test("E2E-A15-05-040 user_name未指定(null)で400となる", async () => {
    test.skip(!HAS_API, "A15_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(UPDATE_PATH, { headers: buildJwtHeaders(), data: buildMissingUserNamePayload() });
    expect400(res.status()); // user_name 必須・未指定→400（UserController.php:97-102）。
    await ctx.dispose();
  });

  test("E2E-A15-05-041 入力不正時のHTTPステータスが400である", async () => {
    test.skip(!HAS_API, "A15_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(UPDATE_PATH, { headers: buildJwtHeaders(), data: buildMissingUserNamePayload() });
    expect400(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-05-042 異常リクエストで4xxとなり更新されない", async () => {
    test.skip(!HAS_API, "A15_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(UPDATE_PATH, { headers: buildJwtHeaders(), data: buildMissingUserNamePayload() });
    expectClientError(res.status()); // 保存が行われずプレイヤーが更新されないことはDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-05-045 user_name必須・未指定で400となりmessageを返す", async () => {
    test.skip(!HAS_API, "A15_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(UPDATE_PATH, { headers: buildJwtHeaders(), data: buildMissingUserNamePayload() });
    expect400(res.status());
    // 正本md: 400 本文は {code, message}（message は入力不正を示す文言）。文言は付帯表4#7で乖離記録のため存在で判定する。
    await expectCodeMessageBody(res, "入力不正書式 {code, message}");
    await ctx.dispose();
  });

  test("E2E-A15-05-046 異常なパラメータ値で400となる", async () => {
    test.skip(!HAS_API, "A15_05_READY 未設定");
    const ctx = await newCtx();
    // 異常パラメータ値（user_name 未指定）の実行結果＝400（UserController.php:97-102）。
    const res = await ctx.put(UPDATE_PATH, { headers: buildJwtHeaders(), data: buildMissingUserNamePayload() });
    expect400(res.status());
    await ctx.dispose();
  });

  // ===== 区分整合・部分更新なし（IT-33。一次オラクル＝API応答＋DB副作用照合。本specはAPI応答を確認しDB照査で補完） =====

  test("E2E-A15-05-050 更新後に更新対象外項目(デッキユーザーID・ポイント等)が不変", async () => {
    test.skip(!HAS_API, "A15_05_READY(SEED-A15-05-PLAYER 対象外項目既知) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(UPDATE_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_player のデッキユーザーID・本名・メールアドレス・ポイント等の更新対象外項目が更新前と一致（不変）。DB副作用照合＝DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-05-051 検証エラー時にニックネーム・プロフィールが部分更新されない", async () => {
    test.skip(!HAS_API, "A15_05_READY(SEED-A15-05-PLAYER 更新前既知) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(UPDATE_PATH, { headers: buildJwtHeaders(), data: buildMissingUserNamePayload() });
    expectClientError(res.status());
    // 一次オラクル: 検証エラー時は保存が行われず、dtb_player のニックネーム・プロフィールが受信前と一致（部分更新されない）。DB副作用照合＝DB照査で補完。
    await ctx.dispose();
  });

  // ===== DB更新副作用（IT-26・設計書補完。一次オラクル＝DB副作用照合。本specはAPI応答を確認しDB照査で補完） =====

  test("E2E-A15-05-120 更新後にニックネームがuser_nameの指定値へ更新される", async () => {
    test.skip(!HAS_API, "A15_05_READY(SEED-A15-05-PLAYER/PAYLOAD) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(UPDATE_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_player.nickname が user_name の指定値（SEED_USER_NAME）へ更新（UpdateUserAction.php:75）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-05-121 更新後にプロフィールがprofileの指定値へ更新される", async () => {
    test.skip(!HAS_API, "A15_05_READY(SEED-A15-05-PLAYER/PAYLOAD) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(UPDATE_PATH, { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_player.profile が profile の指定値（SEED_PROFILE）へ更新（UpdateUserAction.php:77）。DB照査で補完。
    // 実装は profile 非string を400で拒否する可能性（付帯表4#5）だが、ここは正常string値のため成功200を期待。
    await ctx.dispose();
  });

  test("E2E-A15-05-122 profile未指定でプロフィールがnullで保存される", async () => {
    test.skip(!HAS_API, "A15_05_READY(SEED-A15-05-PLAYER 更新前profileあり/PAYLOAD) 未設定");
    const ctx = await newCtx();
    // user_name 指定・profile 未指定。正本md: profile 未指定時は null として保存（上書き）。
    const res = await ctx.put(UPDATE_PATH, { headers: buildJwtHeaders(), data: buildProfileOmittedPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_player.profile が null で保存（上書き）（UserController.php:95,104・UpdateUserInput.php:23）。DB照査で補完。
    await ctx.dispose();
  });
});
