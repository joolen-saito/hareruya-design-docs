/**
 * a15-01 デッキビルダー_ログイン（デッキビルダーアプリ向け会員ログイン JSON API・POST）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a15_01_api_deck_builder_deck_login_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装し、要実機確認修飾(052 Cookie名/有効期限・053 JWT署名/iss/aud/iat・056 del_flgフィルタ根拠)は test.fixme（理由付き）で残す。
 * 手動（019 例外/タイムアウト誘発）はケース表で全量管理し本specには書かない（規約）。対象外はそもそもTSV外/別管理。
 * 本機能は画面なしAPIのためUI専用specは無い（正本md「本書で扱わないこと」で別機能委譲＝UI自動化0件）。
 *
 * 期待結果は仕様（正本md＝pf-api挙動／観点表）由来（オラクル独立性）。実装のレスポンス形・FW既定値・Form制約を期待値に流用しない。
 *  - 送信先は実装の実効パス `POST /api/user/login`（実効パス根拠: LoginController.php:43 の Route ＋ app/config/eccube/routes.yaml:5-7 で prefix無し）。
 *    設計書 pf-api `POST /user/login` とは不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理。
 *  - 入力は JSONボディ id/password（parseJsonBody・AbstractDeckBuilderController.php:30-42／取得 LoginController.php:52-53）。`{ data: {...} }`＝application/json。
 *  - 合否（成功）は HTTP200＋ code(integer)/message/access_token/session_id(string) を仕様由来で判定（LoginController.php:71-76）。
 *  - 合否（入力不正）は HTTP400（正本md: 必須＋メール形式＋パスワード許容文字。実装は非空判定のみ＝付帯表4#2。仕様どおり400を期待し違えば落として検出）。
 *  - 合否（認証拒否）は 401＋{code, message} 存在で判定。文言リテラルは実装へ固定しない（付帯表4#3）。
 *  - JWT iss/aud/iat 欠落(付帯表4#6)・成功時Cookie未設定(付帯表4#5)・del_flgフィルタ根拠(付帯表4#7)・プレイヤー前提追加(付帯表4#4)は仕様どおり期待し、違えば落として検出する。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_01_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  LOGIN_PATH,
  buildValidBody,
  buildMissingIdBody,
  buildMissingPasswordBody,
  buildWrongPasswordBody,
  buildNonexistentIdBody,
  buildExtraFieldBody,
  buildMalformedEmailBody,
  buildInvalidPasswordCharBody,
  buildNonregularBody,
  buildNoPlayerBody,
} from "../../../pages/api/a15/a15_01_api_deck_builder_deck_login.api";

const HAS_API = !!process.env.A15_01_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "認証成功＝200（正本md: レスポンス成功）").toBe(200);
}
function expect400(status: number) {
  expect(status, "入力不正＝400（正本md: バリデーション）").toBe(400);
}
function expect401(status: number) {
  expect(status, "認証拒否＝401（正本md: レスポンス失敗）").toBe(401);
}

test.describe("API > デッキビルダー_ログイン", { tag: ["@api", "@a15"] }, () => {
  // ===== 正常認証（IT-09 / IT-32 / IT-10） =====

  test("E2E-A15-01-001 正常な資格情報で認証成功しアクセストークンを取得する", async () => {
    test.skip(!HAS_API, "A15_01_READY(SEED-A15-01-CUSTOMER) 未設定");
    const ctx = await newCtx();
    // 期待: 認証成功＝access_token が空でない文字列（正本md: リクエスト・IT-09）。
    const res = await ctx.post(LOGIN_PATH, { data: buildValidBody() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(typeof body.access_token, "access_tokenはstring").toBe("string");
    expect((body.access_token as string).length, "access_tokenは空でない文字列").toBeGreaterThan(0);
    await ctx.dispose();
  });

  test("E2E-A15-01-002 認証成功時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A15_01_READY 未設定");
    const ctx = await newCtx();
    // 期待: 認証成功のHTTPステータス＝200（正本md: レスポンス成功HTTP200／IT-09）。
    const res = await ctx.post(LOGIN_PATH, { data: buildValidBody() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-01-003 認証成功時にcode・message・access_token・session_idが返る", async () => {
    test.skip(!HAS_API, "A15_01_READY 未設定");
    const ctx = await newCtx();
    // 期待: 成功本文に4フィールドが揃う（正本md: レスポンス成功／LoginController.php:71-76／IT-09）。
    const res = await ctx.post(LOGIN_PATH, { data: buildValidBody() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    for (const k of ["code", "message", "access_token", "session_id"]) {
      expect(Object.prototype.hasOwnProperty.call(body, k), `本文に ${k} が存在`).toBeTruthy();
    }
    await ctx.dispose();
  });

  test("E2E-A15-01-004 成功本文のcodeが200・messageが存在する", async () => {
    test.skip(!HAS_API, "A15_01_READY 未設定");
    const ctx = await newCtx();
    // 期待: code=200・認証成功を表すmessageが返る（正本md: レスポンス成功／IT-09）。
    // 文言リテラルは英語(設計)⇔日本語(実装)で乖離（付帯表4#3）＝messageの存在(非空string)で判定し実装へ固定しない。
    const res = await ctx.post(LOGIN_PATH, { data: buildValidBody() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.code, "codeは200").toBe(200);
    expect(typeof body.message, "messageはstring").toBe("string");
    expect((body.message as string).length, "messageは空でない（認証成功メッセージ）").toBeGreaterThan(0);
    await ctx.dispose();
  });

  test("E2E-A15-01-005 正しい資格情報のときのみアクセストークンを取得できる", async () => {
    test.skip(!HAS_API, "A15_01_READY 未設定");
    const ctx = await newCtx();
    // 期待: 資格情報照合（LoginAction.php:43-49）。正のときのみaccess_token発行・誤りは401（正本md: 認証認可／IT-32）。
    const ok = await ctx.post(LOGIN_PATH, { data: buildValidBody() });
    expect200(ok.status());
    expect(((await ok.json()) as Record<string, unknown>).access_token, "正資格情報のときのみaccess_token発行").toBeTruthy();
    const ng = await ctx.post(LOGIN_PATH, { data: buildWrongPasswordBody() });
    expect401(ng.status());
    await ctx.dispose();
  });

  test("E2E-A15-01-006 認証が成立しアクセストークンとセッションIDが返る", async () => {
    test.skip(!HAS_API, "A15_01_READY 未設定");
    const ctx = await newCtx();
    // 期待: 認証成立＝access_token と session_id がJSONで返る（正本md: 受信検証／IT-32）。
    const res = await ctx.post(LOGIN_PATH, { data: buildValidBody() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.access_token, "access_tokenが返る").toBeTruthy();
    expect(body.session_id, "session_idが返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A15-01-007 成功レスポンスの型契約（code=integer・他=string）を満たす", async () => {
    test.skip(!HAS_API, "A15_01_READY 未設定");
    const ctx = await newCtx();
    // 期待: 正本mdの仕様型 code=integer、message/access_token/session_id=string（実装キャスト差異は付帯表4で管理／IT-32）。
    const res = await ctx.post(LOGIN_PATH, { data: buildValidBody() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(Number.isInteger(body.code), "codeはinteger").toBeTruthy();
    for (const k of ["message", "access_token", "session_id"]) {
      expect(typeof body[k], `${k}はstring`).toBe("string");
    }
    await ctx.dispose();
  });

  // ===== 必須条件・形式・異常パラメータ・データなし（IT-32） =====

  test("E2E-A15-01-008 id（メールアドレス）未入力で入力不正となる", async () => {
    test.skip(!HAS_API, "A15_01_READY 未設定");
    const ctx = await newCtx();
    // 期待: id未入力→入力不正HTTP400・access_token返らず（正本md: バリデーション必須／LoginController.php:54-55／IT-32）。
    const res = await ctx.post(LOGIN_PATH, { data: buildMissingIdBody() });
    expect400(res.status());
    expect(((await res.json()) as Record<string, unknown>).access_token, "access_tokenが返らない").toBeFalsy();
    await ctx.dispose();
  });

  test("E2E-A15-01-009 password未入力で入力不正となる", async () => {
    test.skip(!HAS_API, "A15_01_READY 未設定");
    const ctx = await newCtx();
    // 期待: password未入力→入力不正HTTP400・access_token返らず（正本md: バリデーション必須／LoginController.php:54-55／IT-32）。
    const res = await ctx.post(LOGIN_PATH, { data: buildMissingPasswordBody() });
    expect400(res.status());
    expect(((await res.json()) as Record<string, unknown>).access_token, "access_tokenが返らない").toBeFalsy();
    await ctx.dispose();
  });

  test("E2E-A15-01-010 誤ったパスワードで認証拒否となる", async () => {
    test.skip(!HAS_API, "A15_01_READY 未設定");
    const ctx = await newCtx();
    // 期待: 誤資格情報→ InvalidCredentialsException(401)（LoginAction.php:43-49／LoginController.php:60-61／IT-32）。
    const res = await ctx.post(LOGIN_PATH, { data: buildWrongPasswordBody() });
    expect401(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-01-011 想定外項目を加えても無視され認証成功する", async () => {
    test.skip(!HAS_API, "A15_01_READY 未設定");
    const ctx = await newCtx();
    // 期待: id/password のみ取得・他項目は未参照＝無視（LoginController.php:52-53）。正資格情報なら200（正本md: 入出力／IT-32）。
    const res = await ctx.post(LOGIN_PATH, { data: buildExtraFieldBody() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-01-012 存在しないid（メールアドレス）で認証拒否となる", async () => {
    test.skip(!HAS_API, "A15_01_READY 未設定");
    const ctx = await newCtx();
    // 期待: 会員不存在→ InvalidCredentialsException(401)（LoginAction.php:43-49／LoginController.php:60-61／IT-32）。
    const res = await ctx.post(LOGIN_PATH, { data: buildNonexistentIdBody() });
    expect401(res.status());
    await ctx.dispose();
  });

  // ===== エラー本文・HTTPステータス・通信・正常/異常系・重複順序（IT-10） =====

  test("E2E-A15-01-013 認証失敗時にcodeとmessageを含む本文が返る", async () => {
    test.skip(!HAS_API, "A15_01_READY 未設定");
    const ctx = await newCtx();
    // 期待: 失敗本文は {code, message}（AbstractDeckBuilderController.php:44-50・正本md一致）。code=401＋message存在で判定。
    // 文言は英語(設計)⇔日本語(実装)乖離（付帯表4#3）＝文言リテラルを実装へ固定しない（IT-10）。
    const res = await ctx.post(LOGIN_PATH, { data: buildWrongPasswordBody() });
    expect401(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.code, "codeに401を含む").toBe(401);
    expect(Object.prototype.hasOwnProperty.call(body, "message"), "messageが存在").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A15-01-014 認証失敗時のHTTPステータスが401である", async () => {
    test.skip(!HAS_API, "A15_01_READY 未設定");
    const ctx = await newCtx();
    // 期待: 認証失敗のHTTPステータス＝401（正本md: レスポンス失敗401／IT-10）。
    const res = await ctx.post(LOGIN_PATH, { data: buildWrongPasswordBody() });
    expect401(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-01-015 POST通信が成立し認証結果に応じた応答が返る", async () => {
    test.skip(!HAS_API, "A15_01_READY 未設定");
    const ctx = await newCtx();
    // 期待: POST通信成立・認証結果（成功＝200）（正本md: 通信／IT-10）。
    const res = await ctx.post(LOGIN_PATH, { data: buildValidBody() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-01-016 対象条件に該当する正しい資格情報で200と成功本文が返る", async () => {
    test.skip(!HAS_API, "A15_01_READY 未設定");
    const ctx = await newCtx();
    // 期待: 正資格情報でHTTP200＋成功本文（access_token）（正本md: 正常系／IT-10）。
    const res = await ctx.post(LOGIN_PATH, { data: buildValidBody() });
    expect200(res.status());
    expect(((await res.json()) as Record<string, unknown>).access_token, "成功本文(access_token)が返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A15-01-017 資格情報が誤りのときトークンを取得できない", async () => {
    test.skip(!HAS_API, "A15_01_READY 未設定");
    const ctx = await newCtx();
    // 期待: 誤資格情報→401・access_token取得不可（正本md: 異常系／IT-10）。
    const res = await ctx.post(LOGIN_PATH, { data: buildWrongPasswordBody() });
    expect401(res.status());
    expect(((await res.json()) as Record<string, unknown>).access_token, "access_tokenを取得できない").toBeFalsy();
    await ctx.dispose();
  });

  test("E2E-A15-01-018 非本会員（有効状態でない）会員は認証拒否となる", async () => {
    test.skip(!HAS_API, "A15_01_READY(SEED-A15-01-CUSTOMER-NONREGULAR) 未設定");
    const ctx = await newCtx();
    // 期待: 有効会員(Status=REGULAR)のみ照合対象＝非本会員は該当無しで401（正本md: データ整合性／CustomerRepository.php:536-542／IT-10）。
    const res = await ctx.post(LOGIN_PATH, { data: buildNonregularBody() });
    expect401(res.status());
    await ctx.dispose();
  });

  // ===== 補完ケース（正本md由来・母集合外） =====

  test("E2E-A15-01-050 メールアドレス形式不正で入力不正となる", async () => {
    test.skip(!HAS_API, "A15_01_READY 未設定");
    const ctx = await newCtx();
    // 期待: id形式不正→入力不正HTTP400（正本md: バリデーション メール形式）。
    // 実装は非空判定のみで形式検証が無い（付帯表4#2）＝非空なら照合へ進み400にならない可能性。仕様どおり400を期待し違えば落として検出（実装へ寄せない）。
    const res = await ctx.post(LOGIN_PATH, { data: buildMalformedEmailBody() });
    expect400(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-01-051 パスワードに許容外の文字を含むと入力不正となる", async () => {
    test.skip(!HAS_API, "A15_01_READY 未設定");
    const ctx = await newCtx();
    // 期待: password が半角表示可能文字(!〜~)以外を含む→入力不正HTTP400（正本md: バリデーション パスワード許容文字）。
    // 実装は文字種検証が無い（付帯表4#2）＝仕様どおり400を期待し違えば落として検出（実装へ寄せない）。
    const res = await ctx.post(LOGIN_PATH, { data: buildInvalidPasswordCharBody() });
    expect400(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-01-054 本会員・正パスワードであればプレイヤー未紐付けでも認証成功する", async () => {
    test.skip(!HAS_API, "A15_01_READY(SEED-A15-01-CUSTOMER-NOPLAYER) 未設定");
    const ctx = await newCtx();
    // 期待: 正本mdはメール＋パスワード照合で判定＝本会員・正パスワードなら200＋access_token（IT-09）。
    // 実装は照合後さらにプレイヤー紐付けを要求し未紐付けは AuthFailedException(401)（LoginAction.php:51-53・付帯表4#4）。
    // 仕様どおり200を期待し、プレイヤー未紐付けで401になれば落として検出（実装へ寄せない）。
    const res = await ctx.post(LOGIN_PATH, { data: buildNoPlayerBody() });
    expect200(res.status());
    expect(((await res.json()) as Record<string, unknown>).access_token, "access_tokenが返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A15-01-055 会員不存在とパスワード不一致で同一の認証拒否メッセージが返る", async () => {
    test.skip(!HAS_API, "A15_01_READY 未設定");
    const ctx = await newCtx();
    // 期待: 会員不存在(A)・パスワード不一致(B)とも同一の認証拒否(401)メッセージで返り区別しない（正本md: エラー処理／LoginAction.php:43-49／IT-10）。
    const resA = await ctx.post(LOGIN_PATH, { data: buildNonexistentIdBody() });
    expect401(resA.status());
    const resB = await ctx.post(LOGIN_PATH, { data: buildWrongPasswordBody() });
    expect401(resB.status());
    const bodyA = (await resA.json()) as Record<string, unknown>;
    const bodyB = (await resB.json()) as Record<string, unknown>;
    // 文言リテラルは実装へ固定せず、両応答の message が一致する（区別しない）ことを判定する（付帯表4#3）。
    expect(bodyA.message, "会員不存在とパスワード不一致のmessageが同一").toEqual(bodyB.message);
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1/付帯表4） =====

  test.fixme(
    "E2E-A15-01-052 認証成功時にアクセストークンが有効期限付きCookieに設定される（要実機確認: Cookie名/有効期限設定／付帯表4#5）",
    async () => {
      // 期待は正本md(副作用)由来＝access_token が有効期限付きCookie（名＝cookie_name＋token_name）として設定される。
      // 実装の成功応答に Set-Cookie が無く本文に access_token/session_id を返すのみ（LoginController.php:71-76・付帯表4#5）。
      // Cookie名/有効期限は設定キー(eccube.yaml:236-238)依存で要実機確認のため fixme。仕様どおりSet-Cookieを期待すると実装で不一致検出となる（実装へ寄せない）。
    }
  );

  test.fixme(
    "E2E-A15-01-053 アクセストークンのペイロードが発行者・利用者ID（会員ID）・発行時刻を持つ（要実機確認: HS256署名検証のシークレット／付帯表4#6）",
    async () => {
      // 期待は正本md(認証・認可)由来＝ペイロードが発行者(iss相当)＋利用者ID(=認証会員のID・aud相当)＋発行時刻(iat相当)を持つ。
      // 実装は JwtTokenService::createToken の payload が {sub:(string)customerId} のみで iss/aud/iat 欠落（JwtTokenService.php・付帯表4#6）。
      // HS256署名検証はシークレット(SEED-A15-01-JWT-SECRET/env JWT_SECRET)設定・実装差分のため要実機確認。仕様どおり期待すると実装で不一致検出となる（実装へ寄せない）。
    }
  );

  test.fixme(
    "E2E-A15-01-056 削除済みの本会員は認証拒否となる（要実機確認: del_flgフィルタの実根拠／付帯表4#7）",
    async () => {
      // 期待は正本md(データ整合性)由来＝未削除の会員のみ照合対象＝削除済み本会員は該当無しで認証拒否(401)。
      // 実装の照合 getRegularCustomerByEmail は email＋Status=REGULAR のみで del_flg 明示フィルタ無し（CustomerRepository.php:536-542・付帯表4#7）。
      // 削除済み本会員の扱い（別フィルタ/エンティティ既定の有無）は要実機確認のため fixme。仕様どおり401を期待し実装が削除済みを照合すれば落として検出（実装へ寄せない）。
    }
  );
});
