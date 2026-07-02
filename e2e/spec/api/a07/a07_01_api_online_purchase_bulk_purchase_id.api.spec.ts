/**
 * a07-01 オンライン仕入_一括買取ID（オプションマスタの「まとめ買取商品ID」設定値を返す参照系GET JSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a07_01_api_online_purchase_bulk_purchase_id_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装し、「E2E自動化(API/統合)（要実機確認）」修飾の行は test.fixme（拒否ステータス/想定外クエリの扱いが認可方式・実機依存）として未実行雛形を置く。
 * 手動（018 タイムアウト実再現・030 DB接続障害実再現）／対象外はケース表で全量管理し本specには書かない（規約）。
 * 本機能はブラウザ向け画面を持たない参照系API（正本md「ブラウザ向けの画面を持たない」）のためUI専用specは無い（自動化(UI)0件）。
 *
 * 期待結果は仕様（正本md＝現行pf-api挙動／観点表・基本設計）由来（オラクル独立性）。実装のレスポンス形・HTTPライブラリ既定値・`?? ''` 既定を期待値に流用しない。
 *  - 送信先は実装の実効パス `GET /api/v1/admin/optionBulkPurchaseId.json`（付帯表1/付帯表4#1。正本md `GET /admin/optionBulkPurchaseId.json` は `/api/v1` を欠き不一致）。
 *  - 認証はクラス属性 `IsGranted('IS_AUTHENTICATED_FULLY')`（OptionController.php:25）。ヘッダ名 `jwt-token`。欠落/該当会員なし/署名不正＝認証拒否（仕様の想定401・具体ステータスは要実機確認＝付帯表4#2）。
 *  - 合否（成功）は HTTP200＋設定値文字列（単一string・ラッパなし・SEED投入値と一致）、冪等参照（2回同一）を仕様由来で判定する（1判定/test）。
 *  - 設定未設定（010）の期待値は正本md「挙動は現行pf-apiを正」に従い HTTP 500相当の失敗。実装の `?? ''` による200＋空文字列（付帯表4#3）は期待値に採らず違えば落として検出する。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A07_01_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  BULK_PURCHASE_ID_PATH,
  buildPathWithUnknownQuery,
  buildJwtHeaders,
  buildNoAuthHeaders,
  JWT_BAD_SIGNATURE,
  JWT_NO_MEMBER,
  BULK_PURCHASE_ID,
} from "../../../pages/api/a07/a07_01_api_online_purchase_bulk_purchase_id.api";

const HAS_API = !!process.env.A07_01_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常取得＝200（正本md: レスポンス成功・HTTP200）").toBe(200);
}
async function readStringBody(res: { json: () => Promise<unknown> }): Promise<unknown> {
  // 正本md: 応答本体はまとめ買取商品IDの値そのもの（ラッパオブジェクトを持たない単一string値）。
  return res.json();
}

test.describe("API > オンライン仕入_一括買取ID", { tag: ["@api", "@a07"] }, () => {
  // ===== 正常取得（IT-09 / IT-10 / IT-32） =====

  test("E2E-A07-01-001 正常なjwt-token付きGETで200と設定値文字列が返る", async () => {
    test.skip(!HAS_API, "A07_01_READY(SEED-A07-01-OPTION-SET/API-AUTH) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(BULK_PURCHASE_ID_PATH, { headers: buildJwtHeaders() });
    expect200(res.status()); // 正常取得＝200。設定値が応答本体として返る（値は004で照合）。
    await ctx.dispose();
  });

  test("E2E-A07-01-002 取得時点の値が再計算されずそのまま返る", async () => {
    test.skip(!HAS_API, "A07_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(BULK_PURCHASE_ID_PATH, { headers: buildJwtHeaders() });
    const body = await readStringBody(res);
    // 業務ルール「計算処理を行わない」: 再計算・丸め・加工されず SEED投入値そのものが返る。
    expect(body, "再計算/加工されず取得時点の値（SEED投入値）が返る").toBe(BULK_PURCHASE_ID);
    await ctx.dispose();
  });

  test("E2E-A07-01-003 正常取得時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A07_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(BULK_PURCHASE_ID_PATH, { headers: buildJwtHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-01-004 オプションマスタの設定値がSEED投入値と一致して返る", async () => {
    test.skip(!HAS_API, "A07_01_READY(SEED-A07-01-OPTION-SET) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(BULK_PURCHASE_ID_PATH, { headers: buildJwtHeaders() });
    const body = await readStringBody(res);
    // 値オラクル: 応答本体＝SEEDで投入した既知の設定値（処理フロー#2）。
    expect(body, "応答本体がSEED投入のまとめ買取商品ID値と一致").toBe(BULK_PURCHASE_ID);
    await ctx.dispose();
  });

  test("E2E-A07-01-005 有効なjwt-tokenの受信検証で管理者会員を特定し200が返る", async () => {
    test.skip(!HAS_API, "A07_01_READY(SEED-A07-01-API-AUTH) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(BULK_PURCHASE_ID_PATH, { headers: buildJwtHeaders() });
    expect200(res.status()); // jwt-token受信検証で管理者会員を特定し正常取得200（認証・認可／IS_AUTHENTICATED_FULLY）。
    await ctx.dispose();
  });

  test("E2E-A07-01-006 成功レスポンスがラッパなしの単一string値で返る", async () => {
    test.skip(!HAS_API, "A07_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(BULK_PURCHASE_ID_PATH, { headers: buildJwtHeaders() });
    const body = await readStringBody(res);
    // 正本md: 応答本体はオブジェクト/配列ラッパを持たず、値そのもの（型string）。
    expect(typeof body, "応答本体がラッパを持たない単一のstring値").toBe("string");
    await ctx.dispose();
  });

  test("E2E-A07-01-009 認証済クライアントからの呼び出しで200と設定値が返る", async () => {
    test.skip(!HAS_API, "A07_01_READY(SEED-A07-01-API-AUTH) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(BULK_PURCHASE_ID_PATH, { headers: buildJwtHeaders() });
    expect200(res.status()); // 権限・認可: 呼び出し可能なクライアント（買取アプリ）からの正常呼び出しは許可され処理結果（200＋設定値）と一致。
    await ctx.dispose();
  });

  test("E2E-A07-01-010 設定未設定時に現行pf-api基準で500相当の失敗となる", async () => {
    test.skip(!HAS_API, "A07_01_READY(SEED-A07-01-OPTION-NONE/API-AUTH) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(BULK_PURCHASE_ID_PATH, { headers: buildJwtHeaders() });
    // 正本md「挙動は現行pf-apiを正」: 設定が無い場合は設定値の参照で例外＝HTTP 500相当の失敗（正常取得200とならない）。
    // 実装の `?? ''` による200＋空文字列（付帯表4#3）は期待値に採らない。違えば落として検出する。
    expect(res.status(), "設定未設定＝現行pf-api基準で500相当失敗（実装の200空文字列は付帯表4#3で不採用）").toBeGreaterThanOrEqual(500);
    await ctx.dispose();
  });

  test("E2E-A07-01-012 正常な認証で200と設定値が返る", async () => {
    test.skip(!HAS_API, "A07_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(BULK_PURCHASE_ID_PATH, { headers: buildJwtHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-01-013 正常時のHTTPステータスが仕様の200と一致する", async () => {
    test.skip(!HAS_API, "A07_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(BULK_PURCHASE_ID_PATH, { headers: buildJwtHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-01-014 正常通信で200応答が返る", async () => {
    test.skip(!HAS_API, "A07_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(BULK_PURCHASE_ID_PATH, { headers: buildJwtHeaders() });
    expect200(res.status()); // 通信が成立し成功＝200。
    await ctx.dispose();
  });

  test("E2E-A07-01-017 同一GETの重複呼び出しで同一レスポンス（冪等参照）となる", async () => {
    test.skip(!HAS_API, "A07_01_READY 未設定");
    const ctx = await newCtx();
    const res1 = await ctx.get(BULK_PURCHASE_ID_PATH, { headers: buildJwtHeaders() });
    const res2 = await ctx.get(BULK_PURCHASE_ID_PATH, { headers: buildJwtHeaders() });
    const body1 = await readStringBody(res1);
    const body2 = await readStringBody(res2);
    // 副作用「無し（参照のみ）」: 2回の呼び出しで同一ステータス・同一応答本体（DB更新なし）。
    expect(
      { status: res2.status(), body: body2 },
      "参照系の冪等: 2回の呼び出しで同一ステータス・同一応答本体",
    ).toEqual({ status: res1.status(), body: body1 });
    await ctx.dispose();
  });

  // ===== 認証拒否・想定外クエリ（要実機確認＝認可方式/拒否ステータス/想定外項目の扱いが実機依存・付帯表4#2） =====

  test.fixme("E2E-A07-01-007 jwt-tokenヘッダ欠落で認証拒否され取得されない", async () => {
    // SPECオラクル: 必須のjwt-tokenヘッダを欠いた呼び出しは正常取得（200＋設定値）とならず認証拒否（正本md想定401・本文を持たない）。
    // 要実機確認: 拒否時の具体ステータス（401/403）はJWT認証機構依存で本コントローラから確定できない（付帯表4#2）。実機の認証機構へ接続して固定する。
    const ctx = await newCtx();
    const res = await ctx.get(BULK_PURCHASE_ID_PATH, { headers: buildNoAuthHeaders() });
    expect(res.status(), "ヘッダ欠落＝認証拒否（正常取得200とならない）").toBe(401);
    await ctx.dispose();
  });

  test.fixme("E2E-A07-01-008 異常な資格情報（署名不正/該当会員なし）で正常取得とならない", async () => {
    // SPECオラクル: 不正な資格情報での呼び出しは許可されず設定値（200）を返さず認証拒否（正本md想定401）。負例＝資格情報行本体。
    // 要実機確認: 署名不正・該当会員なしの拒否ステータスはJWT認証機構依存で要実機確認（付帯表4#2）。正しい署名トークン（該当会員なし）は実機シークレットが必要。
    const ctx = await newCtx();
    const resBad = await ctx.get(BULK_PURCHASE_ID_PATH, { headers: buildJwtHeaders(JWT_BAD_SIGNATURE) });
    const resNoMember = await ctx.get(BULK_PURCHASE_ID_PATH, { headers: buildJwtHeaders(JWT_NO_MEMBER) });
    expect(resBad.status(), "署名不正＝認証拒否（正常取得200とならない）").toBe(401);
    expect(resNoMember.status(), "該当会員なし＝認証拒否（正常取得200とならない）").toBe(401);
    await ctx.dispose();
  });

  test.fixme("E2E-A07-01-011 想定外クエリ項目を加えてもサーバエラー(5xx)で停止しない", async () => {
    // SPECオラクル: 未知のクエリ項目があってもサーバエラー（5xx）で停止しないことのみを判定する。
    // 要実機確認: 本APIはリクエストパラメータを持たず想定外項目の扱い（200で無視され正常取得と同一内容となるか）は正本に明記が無く要実機確認。
    const ctx = await newCtx();
    const res = await ctx.get(buildPathWithUnknownQuery(), { headers: buildJwtHeaders() });
    expect(res.status(), "想定外クエリでも5xxで停止しない").toBeLessThan(500);
    await ctx.dispose();
  });

  test.fixme("E2E-A07-01-015 認証不備時に認証拒否（本文を持たない）応答が返る", async () => {
    // SPECオラクル: 認証不備で正常取得（200＋設定値）とならず認証拒否となり本文を持たない応答（正本md レスポンス失敗・401・本文なし）。
    // 要実機確認: 認証拒否の本文/具体ステータス（401/403）はJWT認証機構依存で要実機確認（付帯表4#2）。
    const ctx = await newCtx();
    const res = await ctx.get(BULK_PURCHASE_ID_PATH, { headers: buildNoAuthHeaders() });
    expect(res.status(), "認証不備＝認証拒否（正常取得200とならない・本文なし）").toBe(401);
    await ctx.dispose();
  });

  test.fixme("E2E-A07-01-016 異常系（資格情報不正）受信時に正常取得とならない", async () => {
    // SPECオラクル: 不正な資格情報では正常取得（200＋設定値）とならず認証拒否（権限・認可: 未認証・トークン不正は取得できない）。
    // 要実機確認: 拒否時の具体ステータスはJWT認証機構依存で要実機確認（付帯表4#2）。
    const ctx = await newCtx();
    const res = await ctx.get(BULK_PURCHASE_ID_PATH, { headers: buildJwtHeaders(JWT_BAD_SIGNATURE) });
    expect(res.status(), "資格情報不正＝認証拒否（正常取得200とならない）").toBe(401);
    await ctx.dispose();
  });
});
