/**
 * a15-02 デッキビルダー_ログアウト（デッキビルダーアプリ向け会員ログアウト JSON API・POST）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a15_02_api_deck_builder_deck_logout_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装し、要実機確認修飾(052 aud/subクレーム名)は test.fixme（理由付き）で残す。
 * 手動（015 タイムアウト誘発）はケース表で全量管理し本specには書かない（規約）。
 * 本機能は画面なしAPIのためUI専用specは無い（正本md「本書で扱わないこと」で別機能委譲＝UI自動化0件）。
 *
 * 期待結果は仕様（正本md＝pf-api挙動／観点表）由来（オラクル独立性）。実装のレスポンス形・FW既定値・トークンライブラリ既定値を期待値に流用しない。
 *  - 送信先は実装の実効パス `POST /api/user/logout`（付帯表1/付帯表4#1。LoginController.php:79。設計書 pf-api `POST /user/logout` とは不一致）。
 *  - 認証は HTTP ヘッダ `jwt-token`（LoginController.php:86）。リクエストボディは未参照＝想定外項目は無視（同:80-86）。
 *  - 合否（成功）は HTTP200＋本文 {code:200(integer), message:'Logout success'(string)}（LoginController.php:108-111／messages.en.yaml:3646）を仕様由来で判定。
 *  - 合否（失敗）は 401＋本文 {code, message}（AbstractDeckBuilderController.php:45-50）。token_incorrect（messages.en.yaml:3645）・auth_failed（messages.en.yaml:3643）。
 *    本文キー・メッセージ実値はロケール依存（付帯表4#4）。code(401)＋message存在で判定し、メッセージ文言は en ロケールの仕様リテラルとして検証（運用ロケール確定は要実機確認）。
 *  - 副作用: 正本md=トークンCookie空設定（050）／サーバ側で失効しない（051）。Cookie操作未実装は付帯表4#2＝仕様どおり期待し違えば落として検出する（実装へ寄せない）。
 *  - クレーム名 aud⇔sub（付帯表4#3）は結果（照合可否）で判定しクレーム名を実装へ固定しない。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_02_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  LOGOUT_PATH,
  MSG_LOGOUT_SUCCESS,
  MSG_TOKEN_INCORRECT,
  MSG_AUTH_FAILED,
  buildValidHeaders,
  buildNoTokenHeaders,
  buildInvalidTokenHeaders,
  buildNoPlayerHeaders,
  buildExtraBody,
} from "../../../pages/api/a15/a15_02_api_deck_builder_deck_logout.api";

const HAS_API = !!process.env.A15_02_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "認証成功＝200（正本md: レスポンス成功）").toBe(200);
}
function expect401(status: number) {
  expect(status, "認証拒否＝401（正本md: レスポンス失敗）").toBe(401);
}

test.describe("API > デッキビルダー_ログアウト", { tag: ["@api", "@a15"] }, () => {
  // ===== 正常ログアウト（IT-32 / IT-09 / IT-10） =====

  test("E2E-A15-02-001 有効なトークンを持つ会員でログアウトが成立する", async () => {
    test.skip(!HAS_API, "A15_02_READY(SEED-A15-02-PLAYER/JWT-SECRET) 未設定");
    const ctx = await newCtx();
    // 正本md: 有効トークンのみログアウト成立・HTTP200（LoginController.php:79,108-111）。
    const res = await ctx.post(LOGOUT_PATH, { headers: buildValidHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-02-002 成功時に本文のcode=200・message=Logout successが返る", async () => {
    test.skip(!HAS_API, "A15_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(LOGOUT_PATH, { headers: buildValidHeaders() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 正本md: 成功本文 code=200・message='Logout success'（LoginController.php:108-111／messages.en.yaml:3646。ロケール差異 付帯表4#4）。
    expect(body.code, "本文code＝200").toBe(200);
    expect(body.message, "本文message＝Logout success（en仕様リテラル）").toBe(MSG_LOGOUT_SUCCESS);
    await ctx.dispose();
  });

  test("E2E-A15-02-003 ログアウト成功時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A15_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(LOGOUT_PATH, { headers: buildValidHeaders() });
    expect200(res.status()); // 正本md: 成功＝HTTP200。
    await ctx.dispose();
  });

  test("E2E-A15-02-004 リクエストボディを持たずヘッダのみで正常実行される", async () => {
    test.skip(!HAS_API, "A15_02_READY 未設定");
    const ctx = await newCtx();
    // 正本md: リクエストはボディパラメータを持たず認証ヘッダ jwt-token のみ（LoginController.php:86）。ボディ未付与で200。
    const res = await ctx.post(LOGOUT_PATH, { headers: buildValidHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-02-005 jwt-tokenヘッダ欠落で認証拒否となる", async () => {
    test.skip(!HAS_API, "A15_02_READY 未設定");
    const ctx = await newCtx();
    // 正本md: ヘッダ欠落→401（LoginController.php:86-92）。
    const res = await ctx.post(LOGOUT_PATH, { headers: buildNoTokenHeaders() });
    expect401(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-02-006 想定外項目を加えても無視され認証成功する", async () => {
    test.skip(!HAS_API, "A15_02_READY 未設定");
    const ctx = await newCtx();
    // 正本md: リクエストボディを持たない＝想定外項目は無視（LoginController.php:80-86）。有効トークンで200。
    const res = await ctx.post(LOGOUT_PATH, { headers: buildValidHeaders(), data: buildExtraBody() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-02-024 audの会員IDで既知プレイヤーが照合されログアウト成功する", async () => {
    test.skip(!HAS_API, "A15_02_READY(SEED-A15-02-PLAYER) 未設定");
    const ctx = await newCtx();
    // 正本md: トークンのaud（会員ID）でプレイヤーを引き既知会員で成立（LogoutAction.php:50。aud⇔subは付帯表4#3＝結果で判定）。
    const res = await ctx.post(LOGOUT_PATH, { headers: buildValidHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-02-026 POST通信が成立し認証結果に応じた応答が返る", async () => {
    test.skip(!HAS_API, "A15_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(LOGOUT_PATH, { headers: buildValidHeaders() });
    expect200(res.status()); // POST通信成立・認証結果（成功＝200）。
    await ctx.dispose();
  });

  test("E2E-A15-02-027 有効トークンで200と成功メッセージが返る", async () => {
    test.skip(!HAS_API, "A15_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(LOGOUT_PATH, { headers: buildValidHeaders() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.message, "成功メッセージ（Logout success・en仕様リテラル）").toBe(MSG_LOGOUT_SUCCESS);
    await ctx.dispose();
  });

  test("E2E-A15-02-032 成功レスポンスの型契約（code=integer・message=string）を満たす", async () => {
    test.skip(!HAS_API, "A15_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(LOGOUT_PATH, { headers: buildValidHeaders() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 正本md仕様型: code=integer、message=string（LoginController.php:108-111）。実装キャスト差異は付帯表4。
    expect(Number.isInteger(body.code), "codeはinteger").toBeTruthy();
    expect(typeof body.message, "messageはstring").toBe("string");
    await ctx.dispose();
  });

  test("E2E-A15-02-036 jwt-tokenの検証が成立し認証成功で200が返る", async () => {
    test.skip(!HAS_API, "A15_02_READY 未設定");
    const ctx = await newCtx();
    // 正本md: 署名検証＋プレイヤー照合の成立で認証成功200（LogoutAction.php:39-55）。
    const res = await ctx.post(LOGOUT_PATH, { headers: buildValidHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  // ===== 認証拒否（IT-32 / IT-10） =====

  test("E2E-A15-02-008 署名不正トークンで401・Access Token is incorrectが返る", async () => {
    test.skip(!HAS_API, "A15_02_READY 未設定");
    const ctx = await newCtx();
    // 正本md: 署名不正→401 token_incorrect（LoginController.php:96-100／LogoutAction.php:41-48／messages.en.yaml:3645。ロケール差異 付帯表4#4）。
    const res = await ctx.post(LOGOUT_PATH, { headers: buildInvalidTokenHeaders() });
    expect401(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.code, "本文codeに401を含む").toBe(401);
    expect(body.message, "message＝Access Token is incorrect（en仕様リテラル）").toBe(MSG_TOKEN_INCORRECT);
    await ctx.dispose();
  });

  test("E2E-A15-02-025 認証失敗時のHTTPステータスが401である", async () => {
    test.skip(!HAS_API, "A15_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(LOGOUT_PATH, { headers: buildInvalidTokenHeaders() });
    expect401(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-02-030 不正トークンで401となり成功応答が返らない", async () => {
    test.skip(!HAS_API, "A15_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(LOGOUT_PATH, { headers: buildInvalidTokenHeaders() });
    expect401(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.code, "成功応答(code=200)が返らない").not.toBe(200);
    await ctx.dispose();
  });

  test("E2E-A15-02-031 必須のjwt-tokenヘッダ欠落時に認証拒否となる", async () => {
    test.skip(!HAS_API, "A15_02_READY 未設定");
    const ctx = await newCtx();
    // 正本md: 必須ヘッダ欠落→401（LoginController.php:86-92）。
    const res = await ctx.post(LOGOUT_PATH, { headers: buildNoTokenHeaders() });
    expect401(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-02-033 aud対応プレイヤーなしで401・Authentication failedが返る", async () => {
    test.skip(!HAS_API, "A15_02_READY(SEED-A15-02-NOPLAYER) 未設定");
    const ctx = await newCtx();
    // 正本md: aud(sub)対応プレイヤー不在→401 auth_failed（LogoutAction.php:51-53／LoginController.php:101-106／messages.en.yaml:3643。aud⇔subは付帯表4#3）。
    const res = await ctx.post(LOGOUT_PATH, { headers: buildNoPlayerHeaders() });
    expect401(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.code, "本文codeに401を含む").toBe(401);
    expect(body.message, "message＝Authentication failed（en仕様リテラル）").toBe(MSG_AUTH_FAILED);
    await ctx.dispose();
  });

  test("E2E-A15-02-037 不正トークンのクライアントは再送しても毎回認証拒否となる", async () => {
    test.skip(!HAS_API, "A15_02_READY 未設定");
    const ctx = await newCtx();
    // 正本md: 不正トークンは再送しても毎回401（冪等な認証拒否。サーバ側状態に依存しない）。
    for (let i = 0; i < 3; i++) {
      const res = await ctx.post(LOGOUT_PATH, { headers: buildInvalidTokenHeaders() });
      expect401(res.status());
    }
    await ctx.dispose();
  });

  // ===== 補完ケース（正本md由来・母集合外） =====

  test("E2E-A15-02-050 ログアウト成功時にトークンCookieが空値に設定される", async () => {
    test.skip(!HAS_API, "A15_02_READY 未設定");
    const ctx = await newCtx();
    // 正本md(副作用・処理フロー#3): 成功時にトークンCookieを空値に設定するSet-Cookieが応答に含まれる。
    // 実装はCookie操作なし（付帯表4#2）。仕様どおり期待し違えば落として検出する（実装へ寄せない）。
    const res = await ctx.post(LOGOUT_PATH, { headers: buildValidHeaders() });
    expect200(res.status());
    const setCookie = res.headers()["set-cookie"];
    expect(setCookie, "応答に Set-Cookie（トークンCookie）が含まれる（実装未実装は付帯表4#2で検出）").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A15-02-051 サーバ側でトークン失効せず同一トークンの再ログアウトが成功する", async () => {
    test.skip(!HAS_API, "A15_02_READY 未設定");
    const ctx = await newCtx();
    // 正本md(データ整合性): サーバ側で失効しない＝同一トークンで再ログアウトしても200（冪等な成功応答）。
    const first = await ctx.post(LOGOUT_PATH, { headers: buildValidHeaders() });
    expect200(first.status());
    const second = await ctx.post(LOGOUT_PATH, { headers: buildValidHeaders() });
    expect200(second.status());
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1/付帯表4） =====

  test.fixme(
    "E2E-A15-02-052 会員IDクレームを欠くトークンで認証拒否となる（要実機確認: aud/subクレーム名／付帯表4#3,#5）",
    async () => {
      // 期待は正本md(認証・認可)由来＝会員ID（aud）クレームを持たないトークンは認証拒否401。
      // 実装は sub 欠落/非数値→ InvalidTokenException→401 token_incorrect（LogoutAction.php:43-48）。
      // クレーム名（正本md=aud／実装=sub・付帯表4#3）と会員IDクレーム欠落の分岐（付帯表4#5）は判定の所在が実装差分のため要実機確認。
      // 仕様どおり「クレーム欠落→401」を期待し、判定の所在・クレーム名は実装へ固定しない。
    }
  );
});
