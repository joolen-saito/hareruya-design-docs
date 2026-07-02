/**
 * a06-01 店頭仕入_管理ログイン（買取アプリ=MTGバイヤー向けの管理ログイン中継 JSON API・POST）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a06_01_api_store_purchase_admin_login_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装し、要実機確認修飾(051 JWT署名/iss)は test.fixme（理由付き）で残す。
 * 手動（019 タイムアウト・052 非ACTIVE会員・053 中継先到達不可）はケース表で全量管理し本specには書かない（規約）。
 * 本機能は画面なしAPIのためUI専用specは無い（正本md「本書で扱わないこと」で別機能委譲＝UI自動化0件）。
 *
 * 期待結果は仕様（正本md＝pf-api挙動／観点表）由来（オラクル独立性）。実装のレスポンス形・FW既定値・Form制約を期待値に流用しない。
 *  - 送信先は実装の実効パス `POST /api/v1/admin/login.json`（付帯表1/付帯表4#1。設計書 pf-api `POST /admin/login.json`＋別名 `/admin/login` とは不一致）。
 *  - 入力はフォームボディ login_id/password（LoginController.php:48-49）。
 *  - 合否（成功）は HTTP200＋ memberName/memberId(integer)/shopName/shopAddr/jwtToken(string) を仕様由来で判定。
 *  - 合否（失敗）は 401＋コード/メッセージ存在で判定。本文キーは実装 {code,errors}／正本md {code,message} で乖離（付帯表4#3）＝キー名を実装へ固定しない。
 *  - JWTペイロード iss 欠落（付帯表4#4）・店舗未紐付け空文字未対応の可能性（付帯表4#5）は仕様どおり期待し、違えば落として検出する。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A06_01_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  LOGIN_PATH,
  SEED_MEMBER_NAME,
  SEED_MEMBER_ID,
  SEED_SHOP_NAME,
  SEED_SHOP_ADDR,
  buildValidForm,
  buildMissingLoginIdForm,
  buildMissingPasswordForm,
  buildWrongPasswordForm,
  buildNonexistentLoginIdForm,
  buildExtraFieldForm,
  buildNoShopForm,
} from "../../../pages/api/a06/a06_01_api_store_purchase_admin_login.api";

const HAS_API = !!process.env.A06_01_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "認証成功＝200（正本md: レスポンス成功）").toBe(200);
}
function expect401(status: number) {
  expect(status, "認証拒否＝401（正本md: レスポンス失敗）").toBe(401);
}

test.describe("API > 店頭仕入_管理ログイン", { tag: ["@api", "@a06"] }, () => {
  // ===== 正常認証（IT-09 / IT-32 / IT-10） =====

  test("E2E-A06-01-001 正常な資格情報で認証成功しJWTトークンを取得する", async () => {
    test.skip(!HAS_API, "A06_01_READY(SEED-A06-01-MEMBER/BASEINFO) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(LOGIN_PATH, { form: buildValidForm() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(typeof body.jwtToken, "jwtTokenはstring").toBe("string");
    expect((body.jwtToken as string).length, "jwtTokenは空でない文字列").toBeGreaterThan(0);
    await ctx.dispose();
  });

  test("E2E-A06-01-002 認証成功時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A06_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(LOGIN_PATH, { form: buildValidForm() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-01-003 認証成功時に会員・店舗情報フィールドが返る", async () => {
    test.skip(!HAS_API, "A06_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(LOGIN_PATH, { form: buildValidForm() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 正本md: 成功本文は memberName/memberId/shopName/shopAddr/jwtToken の5フィールド。
    for (const k of ["memberName", "memberId", "shopName", "shopAddr", "jwtToken"]) {
      expect(Object.prototype.hasOwnProperty.call(body, k), `本文に ${k} が存在`).toBeTruthy();
    }
    await ctx.dispose();
  });

  test("E2E-A06-01-004 レスポンス各フィールドが投入済み既知会員の値と一致する", async () => {
    test.skip(!HAS_API, "A06_01_READY(SEED 既知値) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(LOGIN_PATH, { form: buildValidForm() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 既知SEED（会員氏名・会員ID・店舗名・店舗住所）と一致（LoginController.php:55,73-87 の応答組み立て元）。
    expect(body.memberName, "memberName＝SEED会員氏名").toBe(SEED_MEMBER_NAME);
    expect(body.memberId, "memberId＝SEED会員ID").toBe(SEED_MEMBER_ID);
    expect(body.shopName, "shopName＝SEED店舗名").toBe(SEED_SHOP_NAME);
    expect(body.shopAddr, "shopAddr＝SEED店舗住所(addr01+addr02)").toBe(SEED_SHOP_ADDR);
    await ctx.dispose();
  });

  test("E2E-A06-01-005 正しい資格情報のときのみトークンを取得できる", async () => {
    test.skip(!HAS_API, "A06_01_READY 未設定");
    const ctx = await newCtx();
    // 資格情報照合（LoginController.php:55,69）。正本mdの「中継」vs実装の直接認証は付帯表4#2（観測結果＝トークン取得可否で判定）。
    const ok = await ctx.post(LOGIN_PATH, { form: buildValidForm() });
    expect200(ok.status());
    expect((await ok.json()).jwtToken, "正資格情報のときのみjwtTokenが発行される").toBeTruthy();
    const ng = await ctx.post(LOGIN_PATH, { form: buildWrongPasswordForm() });
    expect401(ng.status());
    await ctx.dispose();
  });

  test("E2E-A06-01-006 中継認証が成立し認証済み会員情報が返る", async () => {
    test.skip(!HAS_API, "A06_01_READY 未設定");
    const ctx = await newCtx();
    // 中継認証成立＝認証済み会員情報がJSONで返る（正本md: 受信検証）。実装は直接DB認証だが観測結果で判定（付帯表4#2）。
    const res = await ctx.post(LOGIN_PATH, { form: buildValidForm() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.memberName, "認証済み会員情報(memberName)が返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A06-01-007 成功レスポンスの型契約（memberId=integer・他=string）を満たす", async () => {
    test.skip(!HAS_API, "A06_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(LOGIN_PATH, { form: buildValidForm() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 正本mdの仕様型: memberId=integer、memberName/shopName/shopAddr/jwtToken=string。
    expect(Number.isInteger(body.memberId), "memberIdはinteger").toBeTruthy();
    for (const k of ["memberName", "shopName", "shopAddr", "jwtToken"]) {
      expect(typeof body[k], `${k}はstring`).toBe("string");
    }
    await ctx.dispose();
  });

  // ===== 必須条件・異常パラメータ・データなし（IT-32） =====

  test("E2E-A06-01-008 login_id未入力で認証拒否となる", async () => {
    test.skip(!HAS_API, "A06_01_READY 未設定");
    const ctx = await newCtx();
    // 正本mdは中継先委譲の認証失敗401・実装は本体で空入力判定401（付帯表4#6）。結果（401・トークンなし）で判定。
    const res = await ctx.post(LOGIN_PATH, { form: buildMissingLoginIdForm() });
    expect401(res.status());
    expect((await res.json()).jwtToken, "トークンが返らない").toBeFalsy();
    await ctx.dispose();
  });

  test("E2E-A06-01-009 password未入力で認証拒否となる", async () => {
    test.skip(!HAS_API, "A06_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(LOGIN_PATH, { form: buildMissingPasswordForm() });
    expect401(res.status());
    expect((await res.json()).jwtToken, "トークンが返らない").toBeFalsy();
    await ctx.dispose();
  });

  test("E2E-A06-01-010 誤ったパスワードで認証拒否となる", async () => {
    test.skip(!HAS_API, "A06_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(LOGIN_PATH, { form: buildWrongPasswordForm() });
    expect401(res.status()); // 誤資格情報→ UnauthenticatedException(401)（LoginController.php:69-70）。
    await ctx.dispose();
  });

  test("E2E-A06-01-011 想定外項目を加えても無視され認証成功する", async () => {
    test.skip(!HAS_API, "A06_01_READY 未設定");
    const ctx = await newCtx();
    // login_id/password のみ取得・他項目は未参照＝無視（LoginController.php:48-49）。
    const res = await ctx.post(LOGIN_PATH, { form: buildExtraFieldForm() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-01-012 存在しないlogin_idで認証拒否となる", async () => {
    test.skip(!HAS_API, "A06_01_READY 未設定");
    const ctx = await newCtx();
    // 会員不存在→ UnauthenticatedException(401)（LoginController.php:57-58）。
    const res = await ctx.post(LOGIN_PATH, { form: buildNonexistentLoginIdForm() });
    expect401(res.status());
    await ctx.dispose();
  });

  // ===== エラー本文・HTTPステータス・通信・正常/異常系・重複順序（IT-10） =====

  test("E2E-A06-01-013 認証失敗時にコードとメッセージを含む本文が返る", async () => {
    test.skip(!HAS_API, "A06_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(LOGIN_PATH, { form: buildWrongPasswordForm() });
    expect401(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 正本md: 失敗本文は {code, message}。実装は {code, errors}（ExceptionListener.php:135-138・付帯表4#3）。
    // キー名を実装へ固定せず、コード(401)＋メッセージ相当（message または errors）の存在で判定する。
    expect(body.code, "コードに401を含む").toBe(401);
    const hasMessage =
      Object.prototype.hasOwnProperty.call(body, "message") ||
      Object.prototype.hasOwnProperty.call(body, "errors");
    expect(hasMessage, "メッセージ相当(message/errors)が存在（キー乖離は付帯表4#3）").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A06-01-014 認証失敗時のHTTPステータスが401である", async () => {
    test.skip(!HAS_API, "A06_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(LOGIN_PATH, { form: buildWrongPasswordForm() });
    expect401(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-01-015 POST通信が成立し認証結果に応じた応答が返る", async () => {
    test.skip(!HAS_API, "A06_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(LOGIN_PATH, { form: buildValidForm() });
    expect200(res.status()); // POST通信成立・認証結果（成功＝200）。
    await ctx.dispose();
  });

  test("E2E-A06-01-016 対象条件に該当する正しい資格情報で200と会員情報が返る", async () => {
    test.skip(!HAS_API, "A06_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(LOGIN_PATH, { form: buildValidForm() });
    expect200(res.status());
    expect((await res.json()).memberName, "会員情報が返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A06-01-017 資格情報が誤りのときトークンを取得できない", async () => {
    test.skip(!HAS_API, "A06_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(LOGIN_PATH, { form: buildWrongPasswordForm() });
    expect401(res.status());
    expect((await res.json()).jwtToken, "トークンを取得できない").toBeFalsy();
    await ctx.dispose();
  });

  test("E2E-A06-01-018 資格情報誤りのクライアントは再送しても認証拒否となる", async () => {
    test.skip(!HAS_API, "A06_01_READY 未設定");
    const ctx = await newCtx();
    // 誤資格情報の再送は毎回401（試行制限は本APIに無く管理ログイン機能へ委譲＝再送しても挙動不変）。
    for (let i = 0; i < 3; i++) {
      const res = await ctx.post(LOGIN_PATH, { form: buildWrongPasswordForm() });
      expect401(res.status());
      expect((await res.json()).jwtToken, "再送してもトークンを取得できない").toBeFalsy();
    }
    await ctx.dispose();
  });

  // ===== 補完ケース（正本md由来・母集合外） =====

  test("E2E-A06-01-050 店舗未紐付け会員でshopName・shopAddrが空文字で返る", async () => {
    test.skip(!HAS_API, "A06_01_READY(SEED-A06-01-MEMBER-NOSHOP) 未設定");
    const ctx = await newCtx();
    // 正本md(データ整合性): 店舗未紐付けは shopName/shopAddr が空文字＋200。
    // 実装は getBaseInfo() null非安全で500の可能性（付帯表4#5）。仕様どおり期待し違えば落として検出する（実装へ寄せない）。
    const res = await ctx.post(LOGIN_PATH, { form: buildNoShopForm() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.shopName, "shopNameは空文字").toBe("");
    expect(body.shopAddr, "shopAddrは空文字").toBe("");
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1/付帯表4） =====

  test.fixme(
    "E2E-A06-01-051 JWTトークンのペイロードが発行者と利用者ID（会員ID）を持つ（要実機確認: HS256署名検証のシークレット／付帯表4#4）",
    async () => {
      // 期待は正本md(認証・認可)由来＝ペイロードが発行者(iss相当)＋利用者ID(=認証会員のmemberId)を持つ。
      // 実装は JwtTokenService::createToken の payload が {sub:(string)memberId} のみで iss 欠落（JwtTokenService.php:79-89・付帯表4#4）。
      // HS256署名検証はシークレット(SEED-A06-01-JWT-SECRET/env JWT_SECRET)設定・実装差分のため要実機確認。
      // 仕様どおり iss を期待すると実装(iss欠落)で不一致検出となる（期待値を実装へ寄せない）。
    }
  );
});
