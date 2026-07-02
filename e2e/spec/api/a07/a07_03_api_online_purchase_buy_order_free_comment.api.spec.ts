/**
 * a07-03 オンライン仕入_買取注文フリーコメント更新（買取アプリ=MTGバイヤー向けにネット買取受注のフリーコメント＝メモをPUT更新するJWT認証付きJSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a07_03_api_online_purchase_buy_order_free_comment_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を real test、「E2E自動化(API/統合)（要実機確認）」を test.fixme で実装する。
 *  - real test: 001-012,014,020,023,030-033（19件）。
 *  - test.fixme: 013（DBカラム長＝要実機確認・付帯表4#7）／021,022（署名検証/会員解決の401経路＝要実機確認・付帯表4#2/#3）。
 * UI観測(040/041)は spec/admin/a07 で実装。手動(050 更新担当者/051 タイムアウト/052 後勝ち/053 保存例外500)はケース表で全量管理し本specには書かない（規約）。
 *
 * 期待結果は仕様（正本md＝pf-apiリバース／観点表／基本設計）由来（オラクル独立性）。実装のレスポンス形・例外クラス既定挙動・HTTPライブラリ既定値・Form制約を期待値に流用しない。
 *  - 送信先は実装の実効パス `PUT /api/v1/admin/buyOrder/{id}/freeComment.json`（付帯表1/付帯表4#1。正本md は `/api/v1` を欠き不一致）。
 *  - 認証は firewall app（access_token・JwtTokenHandler／JwtTokenHeaderExtractor＝security.yaml:32-39）。ヘッダ名 `jwt-token`。欠落/署名不正/該当会員なし＝401。
 *  - 合否（成功）は HTTP200＋応答 `{code:200}`（BuyOrderController.php:120）、コメント未指定は 400＋`{code,errors}`（errors=「コメントを入力してください」）、対象なしは 404 を仕様由来で判定する。
 *    401/404 の応答本文有無、400 の code 同梱有無は要実機確認（付帯表4#3/#4/#5）→ 1判定コア＝HTTPステータス＋（400は errors 文言）で判定する。
 *    判定順序（400 と 404 の前後）は実装が正本mdと逆（付帯表4#8）→ 各分岐を単一変数で独立検証する。
 *  - 有効JWT原値・署名シークレット(auth_magic)・SEED ID は env で供給し原値はコミットしない。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A07_03_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buyOrderFreeCommentPath,
  buildAuthHeaders,
  buildNoAuthHeaders,
  JWT_BAD_SIGNATURE,
  JWT_NO_MEMBER,
  ORDER_ID,
  SPEC_MESSAGE,
  buildValidCommentPayload,
  buildEmptyCommentPayload,
  buildLongCommentPayload,
  buildExtraFieldCommentPayload,
  buildMissingCommentPayload,
} from "../../../pages/api/a07/a07_03_api_online_purchase_buy_order_free_comment.api";

const HAS_API = !!process.env.A07_03_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常更新＝200（正本md: レスポンス成功 {code:200}）").toBe(200);
}
function expect400(status: number) {
  expect(status, "入力不正(free_comment未指定)＝400（正本md: 処理フロー#3／MissingRequiredParameterException）").toBe(400);
}
function expect401(status: number) {
  expect(status, "認証拒否＝401（正本md: 認証・認可。401応答本文有無は要実機確認＝付帯表4#3）").toBe(401);
}
function expect404(status: number) {
  expect(status, "対象受注なし＝404（正本md: NotFoundException。404本文有無は要実機確認＝付帯表4#4）").toBe(404);
}
function expectClientError(status: number) {
  // 異常リクエストは成功扱いされない（4xx）。仕様分岐どおり 401/404/400 のいずれか（付帯表4#8 順序差を範囲で吸収）。
  expect(status, "異常＝4xx（更新が行われない）").toBeGreaterThanOrEqual(400);
  expect(status, "異常＝4xx").toBeLessThan(500);
}
async function expectCode200Body(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(body.code, "成功本文は code:200（integer・200）").toBe(200);
}
async function expectErrorsContain(res: { json: () => Promise<unknown> }, message: string, why: string) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(Object.prototype.hasOwnProperty.call(body, "errors"), "失敗本文に errors を含む（正本md {code,errors}）").toBeTruthy();
  // errors 要素形（文字列/オブジェクト）は実装依存のため本文全体を文字列化して正本md文言の存在で照合する。
  expect(JSON.stringify(body), why).toContain(message);
}

test.describe("API > オンライン仕入_買取注文フリーコメント更新", { tag: ["@api", "@a07"] }, () => {
  // ===== 正常更新（IT-09 / IT-10 / IT-32） =====

  test("E2E-A07-03-001 有効JWTで認証通過しコメント更新が200で成功する", async () => {
    test.skip(!HAS_API, "A07_03_READY(SEED-A07-03-AUTH-MEMBER/NET-ORDER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buyOrderFreeCommentPath(ORDER_ID.TARGET), { headers: buildAuthHeaders(), data: buildValidCommentPayload() });
    expect200(res.status()); // 資格情報が有効＝認証通過し200。
    await ctx.dispose();
  });

  test("E2E-A07-03-002 正常パラメータで200(code:200)が返る", async () => {
    test.skip(!HAS_API, "A07_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buyOrderFreeCommentPath(ORDER_ID.TARGET), { headers: buildAuthHeaders(), data: buildValidCommentPayload() });
    expect200(res.status());
    await expectCode200Body(res); // 処理結果（成功）が応答 {code:200} と一致。
    await ctx.dispose();
  });

  test("E2E-A07-03-003 更新成功の実行結果がレスポンス本文code:200と一致する", async () => {
    test.skip(!HAS_API, "A07_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buyOrderFreeCommentPath(ORDER_ID.TARGET), { headers: buildAuthHeaders(), data: buildValidCommentPayload() });
    expect200(res.status());
    await expectCode200Body(res);
    await ctx.dispose();
  });

  test("E2E-A07-03-004 正常更新時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A07_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buyOrderFreeCommentPath(ORDER_ID.TARGET), { headers: buildAuthHeaders(), data: buildValidCommentPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-03-005 対象条件に該当する正常値で200(code:200)が返る", async () => {
    test.skip(!HAS_API, "A07_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buyOrderFreeCommentPath(ORDER_ID.TARGET), { headers: buildAuthHeaders(), data: buildValidCommentPayload() });
    expect200(res.status());
    await expectCode200Body(res);
    await ctx.dispose();
  });

  test("E2E-A07-03-006 正常通信で200が返る", async () => {
    test.skip(!HAS_API, "A07_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buyOrderFreeCommentPath(ORDER_ID.TARGET), { headers: buildAuthHeaders(), data: buildValidCommentPayload() });
    expect200(res.status()); // PUT通信成立・成功＝200。
    await ctx.dispose();
  });

  test("E2E-A07-03-007 正常時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A07_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buyOrderFreeCommentPath(ORDER_ID.TARGET), { headers: buildAuthHeaders(), data: buildValidCommentPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-03-008 成功レスポンス本文が{code:200}と一致する", async () => {
    test.skip(!HAS_API, "A07_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buyOrderFreeCommentPath(ORDER_ID.TARGET), { headers: buildAuthHeaders(), data: buildValidCommentPayload() });
    expect200(res.status());
    await expectCode200Body(res); // 正本md: 成功書式は {code:200}（code フィールドは integer・200）。
    await ctx.dispose();
  });

  test("E2E-A07-03-009 free_comment指定ありで200が返る", async () => {
    test.skip(!HAS_API, "A07_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buyOrderFreeCommentPath(ORDER_ID.TARGET), { headers: buildAuthHeaders(), data: buildValidCommentPayload("必須項目指定の値") });
    expect200(res.status()); // 必須項目 free_comment を指定＝200。
    await ctx.dispose();
  });

  test("E2E-A07-03-010 空コメント受注へ新規コメント登録で200が返る", async () => {
    test.skip(!HAS_API, "A07_03_READY(SEED-A07-03-NET-ORDER-EMPTY) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buyOrderFreeCommentPath(ORDER_ID.EMPTY), { headers: buildAuthHeaders(), data: buildValidCommentPayload("新規コメント") });
    expect200(res.status()); // 新規登録（setMemo）＝200。登録値のUI反映は E2E-A07-03-040 で確認。
    await ctx.dispose();
  });

  test("E2E-A07-03-011 既存コメントの上書き更新で200が返る", async () => {
    test.skip(!HAS_API, "A07_03_READY(SEED-A07-03-NET-ORDER-FILLED) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buyOrderFreeCommentPath(ORDER_ID.FILLED), { headers: buildAuthHeaders(), data: buildValidCommentPayload("別の値") });
    expect200(res.status()); // 上書き更新（setMemo 上書き）＝200。上書き値のUI反映は E2E-A07-03-040 で確認。
    await ctx.dispose();
  });

  test("E2E-A07-03-012 空文字コメントは入力不正とならず200が返る", async () => {
    test.skip(!HAS_API, "A07_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buyOrderFreeCommentPath(ORDER_ID.TARGET), { headers: buildAuthHeaders(), data: buildEmptyCommentPayload() });
    expect200(res.status()); // 空文字(非null)はpf-api側で入力不正と判定せず200（正本md:149）。
    await ctx.dispose();
  });

  test("E2E-A07-03-014 想定外項目を加えてもfree_commentのみ反映され200が返る", async () => {
    test.skip(!HAS_API, "A07_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buyOrderFreeCommentPath(ORDER_ID.TARGET), { headers: buildAuthHeaders(), data: buildExtraFieldCommentPayload() });
    expect200(res.status()); // 想定外項目はエラーで停止せず200（free_comment のみ参照・BuyOrderController.php:96）。
    await ctx.dispose();
  });

  // ===== 認証・認可（IT-32 / IT-10） =====

  test("E2E-A07-03-020 jwt-tokenヘッダ欠落で401となり更新されない", async () => {
    test.skip(!HAS_API, "A07_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buyOrderFreeCommentPath(ORDER_ID.TARGET), { headers: buildNoAuthHeaders(), data: buildValidCommentPayload() });
    expect401(res.status()); // ヘッダ欠落＝認証拒否401（firewall）。応答本文を持たないことは要実機確認（付帯表4#3）。
    await ctx.dispose();
  });

  // 要実機確認（付帯表1 E2E可否「（要実機確認: 署名検証/会員解決の401経路）」）→ test.fixme（付帯表4#2/#3）。
  test.fixme("E2E-A07-03-021 署名不正JWTで401となり更新されない", async () => {
    test.skip(!HAS_API, "A07_03_READY(SEED-A07-03-JWT-BAD-SIGNATURE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buyOrderFreeCommentPath(ORDER_ID.TARGET), { headers: buildAuthHeaders(JWT_BAD_SIGNATURE), data: buildValidCommentPayload() });
    expect401(res.status()); // 署名検証失敗＝401。HS256署名検証/401経路の実方式は要実機確認（付帯表4#2/#3）。
    await ctx.dispose();
  });

  test.fixme("E2E-A07-03-022 該当する管理者会員が無いJWTで401となる", async () => {
    test.skip(!HAS_API, "A07_03_READY(SEED-A07-03-JWT-NO-MEMBER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buyOrderFreeCommentPath(ORDER_ID.TARGET), { headers: buildAuthHeaders(JWT_NO_MEMBER), data: buildValidCommentPayload() });
    expect401(res.status()); // 利用者IDから管理者会員を特定できず401。会員解決の401経路は要実機確認（付帯表4#3）。
    await ctx.dispose();
  });

  // ===== 異常系・データなし・バリデーション（IT-10 / IT-32） =====

  test("E2E-A07-03-023 異常リクエストで4xx(401/404/400)が返る", async () => {
    test.skip(!HAS_API, "A07_03_READY 未設定");
    const ctx = await newCtx();
    // 代表＝free_comment 未指定（入力不正）。仕様分岐どおり 4xx（401/404/400のいずれか・付帯表4#8）で成功扱いされない。
    const res = await ctx.put(buyOrderFreeCommentPath(ORDER_ID.TARGET), { headers: buildAuthHeaders(), data: buildMissingCommentPayload() });
    expectClientError(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-03-030 非該当ID(異常パラメータ)で404となり更新されない", async () => {
    test.skip(!HAS_API, "A07_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buyOrderFreeCommentPath(ORDER_ID.NONEXISTENT), { headers: buildAuthHeaders(), data: buildValidCommentPayload() });
    expect404(res.status()); // 該当ネット買取受注なし＝404（NotFoundException）。
    await ctx.dispose();
  });

  test("E2E-A07-03-031 該当受注なしIDで404が返る", async () => {
    test.skip(!HAS_API, "A07_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buyOrderFreeCommentPath(ORDER_ID.NONEXISTENT), { headers: buildAuthHeaders(), data: buildValidCommentPayload() });
    expect404(res.status()); // 対象データが存在しない＝404。本文有無は要実機確認（付帯表4#4）。
    await ctx.dispose();
  });

  test("E2E-A07-03-032 free_comment未指定で400が返る", async () => {
    test.skip(!HAS_API, "A07_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buyOrderFreeCommentPath(ORDER_ID.TARGET), { headers: buildAuthHeaders(), data: buildMissingCommentPayload() });
    expect400(res.status()); // コメント未指定(null)＝入力不正400（処理フロー#3）。
    await ctx.dispose();
  });

  test("E2E-A07-03-033 free_comment未指定でerrorsに必須メッセージが返る", async () => {
    test.skip(!HAS_API, "A07_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buyOrderFreeCommentPath(ORDER_ID.TARGET), { headers: buildAuthHeaders(), data: buildMissingCommentPayload() });
    expect400(res.status());
    await expectErrorsContain(res, SPEC_MESSAGE.COMMENT_REQUIRED, "errors に「コメントを入力してください」を含む（正本md:107,124,201・code同梱有無は付帯表4#5）");
    await ctx.dispose();
  });

  // ===== 上限判定なし（IT-10補完。DBカラム長は要実機確認＝付帯表4#7） =====

  // 要実機確認（付帯表1 E2E可否「（013は要実機確認: DBカラム長）」）→ test.fixme。
  test.fixme("E2E-A07-03-013 最大長相当の長大コメントもAPIは上限判定せず200となる", async () => {
    test.skip(!HAS_API, "A07_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buyOrderFreeCommentPath(ORDER_ID.TARGET), { headers: buildAuthHeaders(), data: buildLongCommentPayload() });
    expect200(res.status()); // 文字数上限はpf-api側で判定せず200（正本md:149）。DBカラム長(memo)超過時の保存可否は要実機確認（付帯表4#7）。
    await ctx.dispose();
  });
});
