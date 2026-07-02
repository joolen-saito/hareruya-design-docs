/**
 * a07-02 オンライン仕入_買取注文一覧（買取アプリ=MTGバイヤー向けに査定対象のネット買取受注一覧をGET取得する参照系JSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a07_02_api_online_purchase_buy_order_list_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装する。「E2E自動化(API/統合)（要実機確認）」修飾の行（032 applyDate書式・033 freeComment null・034 memberName null・035 integer型＝付帯表4#2-5）は test.fixme で仕様オラクルと要実機確認理由を本文コメントに残す。
 * 手動（040 整形例外→500実再現・041 タイムアウト実再現・042 DB障害実再現・050 ログ個人情報抑止）はケース表で全量管理し本specには書かない（規約）。
 * 本機能は画面を伴わない参照系GET API（正本md「結果は外部買取アプリで消費されEC-CUBE管理画面に現れない」）のためUI専用specは無い（自動化(UI)0件）。
 *
 * 期待結果は仕様（正本md＝pf-api挙動／観点表）由来（オラクル独立性）。実装のレスポンス整形（日時書式・null/空文字の差異・整数/文字列キャスト）を期待値に流用しない。
 *  - 送信先は実装の実効パス `GET /api/v1/admin/buyOrders.json`（付帯表1/付帯表4#1。正本md `GET /admin/buyOrders.json` は `/api/v1` を欠き不一致）。
 *  - 認証は firewall app（access_token・JwtTokenHandler／JwtTokenHeaderExtractor＝security.yaml:33-39）。ヘッダ名 `jwt-token`。欠落/該当会員なし/署名不正/形式不正＝401。
 *  - 合否（成功）は HTTP200＋査定対象のネット買取受注配列（ラッパ無し）、（失敗）は 401 を仕様の意味で判定する。
 *    抽出は商品到着(2)・査定中(10)・保留(11)・査定再開(12)のみ・受注ID昇順。応答はラッパ無しの受注オブジェクト配列で customerInfo（申込者情報）をネスト。
 *    型契約（integer/ISO8601/null）は正本mdを期待し、実装乖離（付帯表4#2-5）は test.fixme で記録し違えば落として検出する（実装へ寄せない）。
 *  - 有効JWT原値・SEED 既知値は env で供給し原値はコミットしない。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A07_02_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildListPath,
  buildListPathWithUnknownQuery,
  buildJwtHeaders,
  buildNoAuthHeaders,
  JWT_BAD_SIGNATURE,
  JWT_NO_MEMBER,
  JWT_MALFORMED,
  TARGET_STATUS_IDS,
  EXPECTED,
  expectedAddress,
} from "../../../pages/api/a07/a07_02_api_online_purchase_buy_order_list.api";

const HAS_API = !!process.env.A07_02_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常取得＝200（正本md: レスポンス成功 査定対象配列）").toBe(200);
}
function expect401(status: number) {
  expect(status, "認証拒否＝401（正本md: 認証・認可／認証不可）").toBe(401);
}

/** 応答本文を配列として取得する（正本md: 応答本体はラッパ無しの受注オブジェクト配列）。 */
async function getArrayBody(res: { json: () => Promise<unknown> }): Promise<Array<Record<string, unknown>>> {
  const body = await res.json();
  expect(Array.isArray(body), "応答本体は受注オブジェクトの配列（ラッパ無し）").toBeTruthy();
  return body as Array<Record<string, unknown>>;
}

/** netBuyOrderId（実装が文字列キャストでも数値比較できるよう coerce）で要素を引く。 */
function findByOrderId(arr: Array<Record<string, unknown>>, id: number): Record<string, unknown> | undefined {
  return arr.find((o) => Number(o.netBuyOrderId) === id);
}

test.describe("API > オンライン仕入_買取注文一覧", { tag: ["@api", "@a07"] }, () => {
  // ===== 正常取得（IT-09 / IT-10） =====

  test("E2E-A07-02-001 正常なjwt-tokenで査定対象一覧が200で取得できる", async () => {
    test.skip(!HAS_API, "A07_02_READY(SEED-A07-02-JWT-VALID/MEMBER/ORDERS-ASSESS) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildJwtHeaders() });
    expect200(res.status());
    await getArrayBody(res); // 査定対象のネット買取受注を要素とする配列が返る。
    await ctx.dispose();
  });

  test("E2E-A07-02-002 正常取得時に受注基本情報と申込者情報を含む配列が返る", async () => {
    test.skip(!HAS_API, "A07_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildJwtHeaders() });
    expect200(res.status());
    const arr = await getArrayBody(res);
    expect(arr.length, "査定対象が1件以上返る（SEED-A07-02-ORDERS-ASSESS）").toBeGreaterThan(0);
    // 各要素が受注の基本情報＋customerInfo（申込者情報）をネストした構造（正本md レスポンス成功）。
    for (const o of arr) {
      expect(o, "受注基本情報 netBuyOrderId を持つ").toHaveProperty("netBuyOrderId");
      expect(o, "申込者情報 customerInfo をネストする").toHaveProperty("customerInfo");
      expect(typeof o.customerInfo, "customerInfo はオブジェクト").toBe("object");
    }
    await ctx.dispose();
  });

  test("E2E-A07-02-003 認証成功時のHTTPステータスが200となる", async () => {
    test.skip(!HAS_API, "A07_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildJwtHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-02-004 買取アプリからの一覧取得要求に200で配列を返す", async () => {
    test.skip(!HAS_API, "A07_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildJwtHeaders() });
    expect200(res.status());
    await getArrayBody(res);
    await ctx.dispose();
  });

  test("E2E-A07-02-005 正常通信でHTTPステータス200が返る", async () => {
    test.skip(!HAS_API, "A07_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildJwtHeaders() });
    expect200(res.status()); // GET通信成立・認証成功＝200。
    await ctx.dispose();
  });

  test("E2E-A07-02-006 査定対象が存在する条件で200と該当配列が返る", async () => {
    test.skip(!HAS_API, "A07_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildJwtHeaders() });
    expect200(res.status());
    const arr = await getArrayBody(res);
    // 返る受注はすべて査定対象ステータス（2/10/11/12）に属する。
    for (const o of arr) {
      expect(TARGET_STATUS_IDS, "査定対象ステータスの受注のみ").toContain(Number(o.netOrderStatusId));
    }
    await ctx.dispose();
  });

  // ===== 認証・認可（IT-32 / IT-10。HS256署名検証の実方式は要実機確認＝結果401で判定） =====

  test("E2E-A07-02-010 署名不正トークンは認証拒否で401となる", async () => {
    test.skip(!HAS_API, "A07_02_READY(SEED-A07-02-JWT-INVALID) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildJwtHeaders(JWT_BAD_SIGNATURE) });
    expect401(res.status()); // 署名検証失敗＝認証拒否401。
    await ctx.dispose();
  });

  test("E2E-A07-02-011 該当する管理者会員がないトークンは401となる", async () => {
    test.skip(!HAS_API, "A07_02_READY(SEED-A07-02-JWT-INVALID) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildJwtHeaders(JWT_NO_MEMBER) });
    expect401(res.status()); // 利用者IDから管理者会員を特定できず401。
    await ctx.dispose();
  });

  test("E2E-A07-02-012 jwt-tokenヘッダ欠落は401で一覧が返らない", async () => {
    test.skip(!HAS_API, "A07_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildNoAuthHeaders() });
    expect401(res.status()); // ヘッダ欠落＝認証拒否401。受注一覧が返らないこと（4xxで本文は一覧でない）。
    await ctx.dispose();
  });

  test("E2E-A07-02-013 JWT形式として不正な文字列は成功扱いせず401となる", async () => {
    test.skip(!HAS_API, "A07_02_READY(SEED-A07-02-JWT-INVALID) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildJwtHeaders(JWT_MALFORMED) });
    expect401(res.status()); // JWT形式不正は成功扱いされず401。
    await ctx.dispose();
  });

  test("E2E-A07-02-014 認証不可の異常時にHTTPステータス401が返る", async () => {
    test.skip(!HAS_API, "A07_02_READY(SEED-A07-02-JWT-INVALID) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildJwtHeaders(JWT_BAD_SIGNATURE) });
    expect401(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-02-015 異常系リクエストでHTTPステータス401が返る", async () => {
    test.skip(!HAS_API, "A07_02_READY(SEED-A07-02-JWT-INVALID) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildJwtHeaders(JWT_MALFORMED) });
    expect401(res.status());
    await ctx.dispose();
  });

  // ===== 一律取得・抽出整合（IT-09 / IT-32 / IT-33） =====

  test("E2E-A07-02-016 認証済み会員は絞り込みなしで査定対象を一律取得する", async () => {
    test.skip(!HAS_API, "A07_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildJwtHeaders() });
    expect200(res.status());
    const arr = await getArrayBody(res);
    // 認証会員に紐づく絞り込みは行わず、査定対象の受注が一律に返る（findToAssessBuyOrders に会員/店舗条件なし）。
    expect(arr.length, "会員横断で査定対象が一律に返る（1件以上）").toBeGreaterThan(0);
    for (const o of arr) {
      expect(TARGET_STATUS_IDS, "返るのは査定対象ステータスの受注").toContain(Number(o.netOrderStatusId));
    }
    await ctx.dispose();
  });

  test("E2E-A07-02-020 査定対象ステータスの受注のみ抽出される", async () => {
    test.skip(!HAS_API, "A07_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildJwtHeaders() });
    expect200(res.status());
    const arr = await getArrayBody(res);
    // 商品到着(2)・査定中(10)・保留(11)・査定再開(12)のステータスのみが含まれる。
    for (const o of arr) {
      expect(TARGET_STATUS_IDS, `netOrderStatusId=${o.netOrderStatusId} は査定対象集合 [2,10,11,12] に含まれる`).toContain(
        Number(o.netOrderStatusId),
      );
    }
    await ctx.dispose();
  });

  test("E2E-A07-02-021 対象外ステータスの受注は一覧に含まれない", async () => {
    test.skip(!HAS_API, "A07_02_READY(SEED-A07-02-ORDERS-EXCLUDED) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildJwtHeaders() });
    expect200(res.status());
    const arr = await getArrayBody(res);
    // 受付・成立・キャンセル等の対象外ステータス（2/10/11/12以外）が一切含まれない。
    const offending = arr.filter((o) => !TARGET_STATUS_IDS.includes(Number(o.netOrderStatusId) as (typeof TARGET_STATUS_IDS)[number]));
    expect(offending.length, "対象外ステータスの受注は0件").toBe(0);
    await ctx.dispose();
  });

  test("E2E-A07-02-022 該当受注が無い場合は200で空配列が返る", async () => {
    test.skip(!HAS_API, "A07_02_READY(SEED-A07-02-EMPTY) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildJwtHeaders() });
    expect200(res.status());
    const arr = await getArrayBody(res);
    expect(arr.length, "該当受注なしは空配列（正本md 処理フロー#4）").toBe(0);
    await ctx.dispose();
  });

  test("E2E-A07-02-023 配列要素が受注ID昇順で並ぶ", async () => {
    test.skip(!HAS_API, "A07_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildJwtHeaders() });
    expect200(res.status());
    const arr = await getArrayBody(res);
    // netBuyOrderId の昇順（orderBy('buyOrder.id','ASC')）。実装が文字列でも数値で順序比較する（意味で判定）。
    const ids = arr.map((o) => Number(o.netBuyOrderId));
    const sorted = [...ids].sort((a, b) => a - b);
    expect(ids, "配列は受注ID（netBuyOrderId）昇順で並ぶ").toEqual(sorted);
    await ctx.dispose();
  });

  // ===== レスポンス契約（IT-32） =====

  test("E2E-A07-02-030 応答本体がラッパなしの受注オブジェクト配列である", async () => {
    test.skip(!HAS_API, "A07_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildJwtHeaders() });
    expect200(res.status());
    const body = await res.json();
    // ラッパオブジェクトや件数フィールドを持たない受注オブジェクトの配列（JsonResponse($response)＝:87）。
    expect(Array.isArray(body), "応答本体は配列そのもの（ラッパ/件数フィールドを持たない）").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A07-02-031 想定外クエリパラメータがあっても200で無視される", async () => {
    test.skip(!HAS_API, "A07_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildListPathWithUnknownQuery(), { headers: buildJwtHeaders() });
    expect200(res.status()); // 想定外パラメータはエラーにならず無視され、査定対象配列が200で返る。
    await getArrayBody(res);
    await ctx.dispose();
  });

  test("E2E-A07-02-036 customerInfoの文字列フィールドが型と既知値で返る", async () => {
    test.skip(!HAS_API, "A07_02_READY(SEED-A07-02-ORDERS-ASSESS 既知値) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildJwtHeaders() });
    expect200(res.status());
    const arr = await getArrayBody(res);
    const target = findByOrderId(arr, EXPECTED.NET_BUY_ORDER_ID);
    expect(target, `既知受注 netBuyOrderId=${EXPECTED.NET_BUY_ORDER_ID} が一覧に存在する`).toBeTruthy();
    const ci = (target as Record<string, unknown>).customerInfo as Record<string, unknown>;
    // firstName/lastName/telNo/zipcode は string 型でシード既知値どおり（正本md フィールド契約）。
    expect(typeof ci.firstName, "firstName は string").toBe("string");
    expect(ci.firstName, "firstName 既知値").toBe(EXPECTED.FIRST_NAME);
    expect(typeof ci.lastName, "lastName は string").toBe("string");
    expect(ci.lastName, "lastName 既知値").toBe(EXPECTED.LAST_NAME);
    expect(typeof ci.telNo, "telNo は string").toBe("string");
    expect(ci.telNo, "telNo 既知値").toBe(EXPECTED.TEL_NO);
    expect(typeof ci.zipcode, "zipcode は string").toBe("string");
    expect(ci.zipcode, "zipcode 既知値").toBe(EXPECTED.ZIPCODE);
    await ctx.dispose();
  });

  test("E2E-A07-02-037 住所が都道府県名・住所1・住所2の連結となる", async () => {
    test.skip(!HAS_API, "A07_02_READY(SEED-A07-02-ORDERS-ASSESS 国内住所) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildJwtHeaders() });
    expect200(res.status());
    const arr = await getArrayBody(res);
    const target = findByOrderId(arr, EXPECTED.NET_BUY_ORDER_ID);
    expect(target, `既知受注 netBuyOrderId=${EXPECTED.NET_BUY_ORDER_ID} が一覧に存在する`).toBeTruthy();
    const ci = (target as Record<string, unknown>).customerInfo as Record<string, unknown>;
    // address は 都道府県名・住所1・住所2 を半角空白区切りで連結した文字列（正本md 集計条件 結合）。
    expect(ci.address, "address は都道府県名・住所1・住所2の半角空白連結").toBe(expectedAddress());
    await ctx.dispose();
  });

  // ===== 参照冪等（IT-10） =====

  test("E2E-A07-02-043 同一トークンの反復取得で副作用なく同一結果が返る", async () => {
    test.skip(!HAS_API, "A07_02_READY 未設定");
    const ctx = await newCtx();
    const res1 = await ctx.get(buildListPath(), { headers: buildJwtHeaders() });
    const res2 = await ctx.get(buildListPath(), { headers: buildJwtHeaders() });
    const res3 = await ctx.get(buildListPath(), { headers: buildJwtHeaders() });
    expect200(res1.status());
    expect200(res2.status());
    expect200(res3.status());
    const a1 = await res1.json();
    const a2 = await res2.json();
    const a3 = await res3.json();
    // 参照のみで副作用なし。複数回・順不同に取得しても同一の受注配列が返る（正本md 副作用 無し）。
    expect(a2, "2回目は1回目と同一結果").toEqual(a1);
    expect(a3, "3回目は1回目と同一結果").toEqual(a1);
    await ctx.dispose();
  });

  // ===== 要実機確認（付帯表1「E2E自動化(API/統合)（要実機確認）」＝付帯表4#2-5の仕様乖離・実機照合まで未確定。仕様オラクルで test.fixme） =====

  test.fixme("E2E-A07-02-032 applyDateがISO8601形式で返る", async () => {
    // 仕様オラクル（正本md レスポンス成功）: applyDate は ISO8601 形式の日時文字列で返る。
    // 要実機確認（付帯表4#2）: 実装は format('Y/m/d H:i:s')（BuyOrderController.php:73）でスラッシュ区切りの非ISO8601を返す可能性。
    //   テストはISO8601を期待し、実機応答で書式を確認のうえ違えば落として検出する（実装へ寄せない）。
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildJwtHeaders() });
    expect200(res.status());
    const arr = await getArrayBody(res);
    const target = findByOrderId(arr, EXPECTED.NET_BUY_ORDER_ID);
    const applyDate = (target as Record<string, unknown>).applyDate;
    expect(typeof applyDate, "applyDate は文字列").toBe("string");
    // ISO8601（例 2026-06-21T12:34:56 ／ +09:00 等）を期待。
    expect(applyDate as string, "applyDate は ISO8601 形式").toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    await ctx.dispose();
  });

  test.fixme("E2E-A07-02-033 フリーコメント未設定の受注でfreeCommentがnullとなる", async () => {
    // 仕様オラクル（正本md レスポンス成功）: freeComment は未設定の受注で null。
    // 要実機確認（付帯表4#3）: 実装は `$buyOrder['memo'] ?? ''`（BuyOrderController.php:74）で未設定時に空文字('')を返す可能性。
    //   テストは null を期待し、実機応答で確認のうえ違えば落として検出する。
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildJwtHeaders() });
    expect200(res.status());
    const arr = await getArrayBody(res);
    // フリーコメント未設定の受注（SEED-A07-02-ORDERS-ASSESS に含む）の freeComment が null。
    const unset = arr.find((o) => o.freeComment === null || o.freeComment === "");
    expect(unset, "フリーコメント未設定の受注が存在する").toBeTruthy();
    expect((unset as Record<string, unknown>).freeComment, "freeComment は null（未設定）").toBeNull();
    await ctx.dispose();
  });

  test.fixme("E2E-A07-02-034 会員が紐づかない受注でmemberNameがnullとなる", async () => {
    // 仕様オラクル（正本md レスポンス成功）: memberName は申込者を登録した会員が紐づかない受注で null。
    // 要実機確認（付帯表4#4）: 実装は `... ?? ''`（BuyOrderController.php:75）で紐づき無し時に空文字('')を返す可能性。
    //   テストは null を期待し、実機応答で確認のうえ違えば落として検出する。
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildJwtHeaders() });
    expect200(res.status());
    const arr = await getArrayBody(res);
    // 会員未割当の受注（SEED-A07-02-ORDERS-ASSESS に含む）の memberName が null。
    const unset = arr.find((o) => o.memberName === null || o.memberName === "");
    expect(unset, "会員未割当の受注が存在する").toBeTruthy();
    expect((unset as Record<string, unknown>).memberName, "memberName は null（会員紐づき無し）").toBeNull();
    await ctx.dispose();
  });

  test.fixme("E2E-A07-02-035 netBuyOrderIdとnetOrderStatusIdがinteger型で既知値どおり返る", async () => {
    // 仕様オラクル（正本md レスポンス成功）: netBuyOrderId・netOrderStatusId は integer 型でシード既知値どおり。
    // 要実機確認（付帯表4#5）: 実装は両フィールドを (string) キャスト（BuyOrderController.php:72,76）で文字列を返す可能性。
    //   テストは integer 型を期待し、実機応答で確認のうえ違えば落として検出する。
    const ctx = await newCtx();
    const res = await ctx.get(buildListPath(), { headers: buildJwtHeaders() });
    expect200(res.status());
    const arr = await getArrayBody(res);
    const target = arr.find((o) => Number(o.netBuyOrderId) === EXPECTED.NET_BUY_ORDER_ID);
    expect(target, `既知受注 netBuyOrderId=${EXPECTED.NET_BUY_ORDER_ID} が一覧に存在する`).toBeTruthy();
    const o = target as Record<string, unknown>;
    expect(typeof o.netBuyOrderId, "netBuyOrderId は integer 型").toBe("number");
    expect(o.netBuyOrderId, "netBuyOrderId 既知値").toBe(EXPECTED.NET_BUY_ORDER_ID);
    expect(typeof o.netOrderStatusId, "netOrderStatusId は integer 型").toBe("number");
    expect(o.netOrderStatusId, "netOrderStatusId 既知値").toBe(EXPECTED.NET_ORDER_STATUS_ID);
    await ctx.dispose();
  });
});
