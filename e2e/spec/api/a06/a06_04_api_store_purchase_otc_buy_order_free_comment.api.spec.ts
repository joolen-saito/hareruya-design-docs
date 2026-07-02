/**
 * a06-04 店頭仕入_買取注文フリーコメント更新（PUT・JWT認証付き更新系API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a06_04_api_store_purchase_otc_buy_order_free_comment_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を REAL test として実装し、要実機確認修飾（013 DBカラム長 / 021 署名不正・022 会員なしの401経路）は test.fixme（理由付き）で残す。
 * 手動（050 更新担当者記録・051 タイムアウト・052 後勝ち）はケース表で全量管理し本specには書かない（規約・OMIT）。
 * UI観測ケース（040/041 E2E自動化(UI)）は admin spec（spec/admin/a06）側に分離。
 *
 * 期待結果は仕様（正本md＝pf-apiリバース／観点表／基本設計）由来（オラクル独立性）:
 *  - 送信先は実装の実効パス `PUT /api/v1/admin/otcBuyOrder/{id}/freeComment.json`（付帯表4#1。正本mdの /api/v1 無し・.json 無し別名とは不一致）。
 *  - 合否は HTTPステータス＋応答本文（{code}／{code,errors}）＋更新系はDB副作用（フリーコメント・更新担当者）で判定。更新確定はDB照査で補完。
 *  - 401/404 の本文有無・400 の code 同梱有無はオラクルにしない（実装差異＝付帯表4#3/#4/#5）。HTTPステータスを仕様で判定し本文差異はコメントで記録。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A06_04_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  otcBuyOrderFreeCommentPath,
  OTC_ORDER_ID,
  OTC_ORDER_EMPTY_ID,
  OTC_ORDER_FILLED_ID,
  NONEXISTENT_ORDER_ID,
  JWT_TOKEN,
  MSG_COMMENT_REQUIRED,
  buildAuthHeaders,
  buildValidCommentPayload,
  buildEmptyCommentPayload,
  buildOverwriteCommentPayload,
  buildPayloadWithExtra,
  buildMissingCommentPayload,
} from "../../../pages/api/a06/a06_04_api_store_purchase_otc_buy_order_free_comment.api";

const HAS_API = !!process.env.A06_04_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常更新＝200（正本md:115-117 成功応答 code:200）").toBe(200);
}

test.describe("API > 店頭買取受注フリーコメント更新(PUT)", { tag: ["@api", "@a06"] }, () => {
  // ===== 正常更新（成功応答 code:200。更新確定はDB副作用一次・DB照査で補完） =====

  test("E2E-A06-04-001 有効JWTで認証通過しコメント更新が成功する", async () => {
    test.skip(!HAS_API, "A06_04_READY(SEED-A06-04-AUTH-MEMBER/OTC-ORDER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(otcBuyOrderFreeCommentPath(OTC_ORDER_ID), { headers: buildAuthHeaders(JWT_TOKEN), data: buildValidCommentPayload() });
    expect200(res.status()); // 認証通過＋成功（正本md:67-72 認証認可／処理フロー#1）。
    await ctx.dispose();
  });

  test("E2E-A06-04-002 正常パラメータでコメント更新が成功する", async () => {
    test.skip(!HAS_API, "A06_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(otcBuyOrderFreeCommentPath(OTC_ORDER_ID), { headers: buildAuthHeaders(JWT_TOKEN), data: buildValidCommentPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-04-003 更新成功の実行結果がレスポンス本文 code:200 と一致する", async () => {
    test.skip(!HAS_API, "A06_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(otcBuyOrderFreeCommentPath(OTC_ORDER_ID), { headers: buildAuthHeaders(JWT_TOKEN), data: buildValidCommentPayload() });
    expect200(res.status());
    const body = await res.json();
    expect(body.code, "成功本文 {code:200}（正本md:115-117）").toBe(200);
    await ctx.dispose();
  });

  test("E2E-A06-04-004 正常更新時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A06_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(otcBuyOrderFreeCommentPath(OTC_ORDER_ID), { headers: buildAuthHeaders(JWT_TOKEN), data: buildValidCommentPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-04-005 対象条件に該当する正常値で成功応答する", async () => {
    test.skip(!HAS_API, "A06_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(otcBuyOrderFreeCommentPath(OTC_ORDER_ID), { headers: buildAuthHeaders(JWT_TOKEN), data: buildValidCommentPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-04-006 正常通信で成功応答が返る", async () => {
    test.skip(!HAS_API, "A06_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(otcBuyOrderFreeCommentPath(OTC_ORDER_ID), { headers: buildAuthHeaders(JWT_TOKEN), data: buildValidCommentPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-04-007 正常時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A06_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(otcBuyOrderFreeCommentPath(OTC_ORDER_ID), { headers: buildAuthHeaders(JWT_TOKEN), data: buildValidCommentPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-04-008 成功レスポンス本文が {code:200}（integer・200）である", async () => {
    test.skip(!HAS_API, "A06_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(otcBuyOrderFreeCommentPath(OTC_ORDER_ID), { headers: buildAuthHeaders(JWT_TOKEN), data: buildValidCommentPayload() });
    expect200(res.status());
    const body = await res.json();
    expect(typeof body.code, "code は integer（正本md:115-117）").toBe("number");
    expect(body.code).toBe(200);
    await ctx.dispose();
  });

  test("E2E-A06-04-009 free_comment指定ありで成功応答する", async () => {
    test.skip(!HAS_API, "A06_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(otcBuyOrderFreeCommentPath(OTC_ORDER_ID), { headers: buildAuthHeaders(JWT_TOKEN), data: buildValidCommentPayload("必須項目あり") });
    expect200(res.status()); // 必須項目 free_comment 指定（正本md:108,149）。
    await ctx.dispose();
  });

  test("E2E-A06-04-010 空コメント受注へ新規コメント登録で成功する", async () => {
    test.skip(!HAS_API, "A06_04_READY(SEED-A06-04-OTC-ORDER-EMPTY) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(otcBuyOrderFreeCommentPath(OTC_ORDER_EMPTY_ID), { headers: buildAuthHeaders(JWT_TOKEN), data: buildValidCommentPayload("新規コメント") });
    expect200(res.status());
    // 一次オラクル: setFreeComment で新規登録（UpdateFreeCommentAction.php:35）。登録値の確定はDB照査で補完（UI反映は E2E-A06-04-040）。
    await ctx.dispose();
  });

  test("E2E-A06-04-011 既存コメントの上書き更新で成功する", async () => {
    test.skip(!HAS_API, "A06_04_READY(SEED-A06-04-OTC-ORDER-FILLED) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(otcBuyOrderFreeCommentPath(OTC_ORDER_FILLED_ID), { headers: buildAuthHeaders(JWT_TOKEN), data: buildOverwriteCommentPayload() });
    expect200(res.status());
    // 一次オラクル: setFreeComment 上書き（正本md:95／UpdateFreeCommentAction.php:35）。上書き値の確定はDB照査で補完（UI反映は E2E-A06-04-040）。
    await ctx.dispose();
  });

  test("E2E-A06-04-012 空文字コメントは入力不正とならず成功する", async () => {
    test.skip(!HAS_API, "A06_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(otcBuyOrderFreeCommentPath(OTC_ORDER_ID), { headers: buildAuthHeaders(JWT_TOKEN), data: buildEmptyCommentPayload() });
    expect200(res.status()); // 空文字(非null)は入力不正と判定せず200（正本md:149）。
    await ctx.dispose();
  });

  test("E2E-A06-04-014 想定外項目を加えてもfree_commentのみ反映され成功する", async () => {
    test.skip(!HAS_API, "A06_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(otcBuyOrderFreeCommentPath(OTC_ORDER_ID), { headers: buildAuthHeaders(JWT_TOKEN), data: buildPayloadWithExtra() });
    expect200(res.status()); // 想定外項目は未参照・停止せず200（正本md:159）。free_commentのみ反映の確定はDB照査で補完。
    await ctx.dispose();
  });

  // ===== 認証拒否・該当なし・入力不正（異常系） =====

  test("E2E-A06-04-020 jwt-tokenヘッダ欠落で認証拒否(401)となる", async () => {
    test.skip(!HAS_API, "A06_04_READY(SEED-A06-04-OTC-ORDER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(otcBuyOrderFreeCommentPath(OTC_ORDER_ID), { headers: buildAuthHeaders(undefined), data: buildValidCommentPayload() });
    expect(res.status(), "受信検証失敗＝401（正本md:71,123）").toBe(401); // firewall 拒否（security.yaml:32-39）。
    // 正本mdは本文を持たない（空）を定める。実装は errors 本文を返す可能性＝本文有無は付帯表4#3で要実機確認（本文断言はしない）。
    await ctx.dispose();
  });

  test("E2E-A06-04-023 異常リクエストで異常応答(4xx)が返る", async () => {
    test.skip(!HAS_API, "A06_04_READY 未設定");
    const ctx = await newCtx();
    // 異常分岐の一例として free_comment 未指定(400)を送る（401/404/400 のいずれか仕様分岐どおり・正本md:187-191）。
    const res = await ctx.put(otcBuyOrderFreeCommentPath(OTC_ORDER_ID), { headers: buildAuthHeaders(JWT_TOKEN), data: buildMissingCommentPayload() });
    expect(res.status(), "異常＝4xx（401/404/400・正本md:187-191）").toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
    await ctx.dispose();
  });

  test("E2E-A06-04-030 非該当ID（異常パラメータ）で該当なし(404)となる", async () => {
    test.skip(!HAS_API, "A06_04_READY(SEED-A06-04-AUTH-MEMBER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(otcBuyOrderFreeCommentPath(NONEXISTENT_ORDER_ID), { headers: buildAuthHeaders(JWT_TOKEN), data: buildValidCommentPayload() });
    expect(res.status(), "該当なし＝404（NotFoundException OtcBuyOrderController.php:161／正本md:83,124,150）").toBe(404);
    // 正本mdは本文なし、実装は errors 本文を返す＝本文有無は付帯表4#4で要実機確認。
    await ctx.dispose();
  });

  test("E2E-A06-04-031 該当受注なしIDで該当なし(404)応答となる", async () => {
    test.skip(!HAS_API, "A06_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(otcBuyOrderFreeCommentPath(NONEXISTENT_ORDER_ID), { headers: buildAuthHeaders(JWT_TOKEN), data: buildValidCommentPayload() });
    expect(res.status(), "対象データなし＝404（正本md:124,150）").toBe(404);
    await ctx.dispose();
  });

  test("E2E-A06-04-032 free_comment未指定で入力不正(400)となる", async () => {
    test.skip(!HAS_API, "A06_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(otcBuyOrderFreeCommentPath(OTC_ORDER_ID), { headers: buildAuthHeaders(JWT_TOKEN), data: buildMissingCommentPayload() });
    expect(res.status(), "未指定(null)＝400（MissingRequiredParameterException OtcBuyOrderController.php:166／正本md:84,125）").toBe(400);
    await ctx.dispose();
  });

  test("E2E-A06-04-033 free_comment未指定でerrorsにメッセージが返る", async () => {
    test.skip(!HAS_API, "A06_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(otcBuyOrderFreeCommentPath(OTC_ORDER_ID), { headers: buildAuthHeaders(JWT_TOKEN), data: buildMissingCommentPayload() });
    expect(res.status()).toBe(400);
    const body = await res.json();
    // 正本md:191 由来。{code, errors} の errors に「コメントを入力してください」が含まれる。code 同梱有無は付帯表4#5で要実機確認。
    expect(JSON.stringify(body.errors ?? body), `errors に「${MSG_COMMENT_REQUIRED}」を含む`).toContain(MSG_COMMENT_REQUIRED);
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1/付帯表4） =====

  test.fixme(
    "E2E-A06-04-013 最大長相当の長大コメントもAPIは上限判定せず成功する（要実機確認: DBカラム長／付帯表4#7）",
    async () => {
      // 期待は正本md:149（文字数上限はpf-api側で判定しない＝200）由来。API層は上限判定しないが、DBカラム長を超える長大コメントの
      // 保存可否はDB制約に依存し、実効カラム長が要実機確認のため fixme（仕様どおり200を期待し、DB制約で落ちれば検出）。
    }
  );

  test.fixme(
    "E2E-A06-04-021 署名不正JWTで認証拒否(401)となる（要実機確認: 署名検証の401経路／付帯表4#2,#3）",
    async () => {
      // 期待は正本md:71,123（署名不正は401・本文なし）由来。JwtTokenHandler の署名検証(HS256)失敗時の firewall 応答ステータス／本文有無が
      // 要実機確認（署名方式・401応答書式が付帯表4#2/#3）のため fixme。SEED-A06-04-AUTH-MEMBER を署名不正トークンに差し替えて再現。
    }
  );

  test.fixme(
    "E2E-A06-04-022 該当する管理者会員なしのJWTで認証拒否(401)となる（要実機確認: 会員解決の401経路／付帯表4#2,#3）",
    async () => {
      // 期待は正本md:71,123（該当管理者会員なしは401・本文なし）由来。member_provider での会員解決失敗時の firewall 応答経路／本文有無が
      // 要実機確認のため fixme。SEED-A06-04-AUTH-MEMBER を会員なし利用者IDのトークンに差し替えて再現。
    }
  );
});
