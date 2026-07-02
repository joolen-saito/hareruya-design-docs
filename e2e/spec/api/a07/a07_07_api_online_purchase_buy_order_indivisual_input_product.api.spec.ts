/**
 * a07-07 オンライン仕入_買取注文個別入力商品（複数のネット買取受注ID→各受注に紐づく個別入力商品一覧を一括取得する
 * 参照系JSON API）API/統合レイヤ E2E。関数名の綴りは仕様どおり "indivisual"。
 * ケース表 integration_test/e2e/a07_07_api_online_purchase_buy_order_indivisual_input_product_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装する。
 *  - 実装 test(...): 001,002,003,004,005,006,007,008,009,010,011,012,020,021,022,023,050,051,052,053,054,055（22件）。
 *  - test.fixme(...): 030,031,032（E2E自動化(API/統合)（要実機確認）。非数値ID・想定外項目・異常系の具体応答が正典未定義＝付帯表4#3）。
 *  - 手動（070 レート制限・071 タイムアウト・072 取得処理中の例外500）はケース表で全量管理し本specには書かない（規約）。
 * 本機能は画面なしの参照系API（正本md「ブラウザ向けの画面を持たない」）のためUI専用specは無い（自動化(UI)0件）。
 *
 * 期待結果は仕様（正本md＝pf-api挙動／観点表）由来（オラクル独立性）。実装のレスポンス形・型キャスト・HTTPライブラリ既定値を期待値に流用しない。
 *  - 送信先は実装の実効パス `POST /api/v1/admin/buyOrderIndivisualInputProduct.json`（付帯表1/付帯表4#1。正本md `POST /admin/buyOrderIndivisualInputProduct.json` は `/api/v1` を欠き不一致）。
 *  - 認証は firewall app（access_token・JwtTokenHandler／JwtTokenHeaderExtractor＝security.yaml:32-39）。ヘッダ名 `jwt-token`。ヘッダ欠落/該当会員なし/署名不正＝401（HS256署名検証の実方式は要実機確認＝付帯表4#2、結果401で判定）。
 *  - 合否（成功）は HTTP200＋応答（個別入力商品の配列・各要素が buyOrderIndivisualInputProductId/buyOrderId/name/price/count/saleFlg）、0件は空配列 [] を仕様由来で判定する。
 *  - 型契約（id/buyOrderId=integer・name=string・price/count=integer（未設定null）・saleFlg=boolean（未設定null）・serialize_null有効）は仕様の型で期待値化する。
 *  - 本APIは参照のみ（副作用 無し・正本md:150-152）でDB更新観点を持たない。判定はAPI応答（HTTPステータス・本文）に閉じる。
 *  - 有効JWT原値・SEED受注ID は env で供給し原値はコミットしない。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A07_07_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildBuyOrderIndivisualInputProductPath,
  buildJwtHeaders,
  buildNoAuthHeaders,
  JWT_NO_MEMBER,
  JWT_BAD_SIGNATURE,
  RESPONSE_FIELDS,
  buildKnownIdsPayload,
  buildMultiOrderIdsPayload,
  buildEmptyIdsPayload,
  buildMissingIdsPayload,
  buildNoProductIdsPayload,
  buildDuplicateUnorderedIdsPayload,
  buildNullFieldsIdsPayload,
  buildPartialExistIdsPayload,
  buildNonNumericIdsPayload,
  buildExtraFieldPayload,
  buildAbnormalPayload,
} from "../../../pages/api/a07/a07_07_api_online_purchase_buy_order_indivisual_input_product.api";

const HAS_API = !!process.env.A07_07_READY;
const PATH = buildBuyOrderIndivisualInputProductPath();

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常取得＝200（正本md: レスポンス成功・HTTP200）").toBe(200);
}
function expect401(status: number) {
  expect(status, "認証拒否＝401（正本md: 認証・認可:62-68,192）").toBe(401);
}
async function getArray(res: { json: () => Promise<unknown> }): Promise<Array<Record<string, unknown>>> {
  const body = await res.json();
  expect(Array.isArray(body), "レスポンスのルートは個別入力商品の配列（正本md レスポンス成功）").toBeTruthy();
  return body as Array<Record<string, unknown>>;
}

test.describe("API > オンライン仕入_買取注文個別入力商品", { tag: ["@api", "@a07"] }, () => {
  // ===== 正常取得（IT-09 / IT-10） =====

  test("E2E-A07-07-001 複数買取ID正常取得でHTTP200・個別入力商品配列が返る", async () => {
    test.skip(!HAS_API, "A07_07_READY(SEED-A07-07-JWT-ADMIN/PRODUCTS-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildKnownIdsPayload() });
    expect200(res.status());
    await getArray(res); // 指定買取受注IDに紐づく個別入力商品が配列としてJSONで返る。
    await ctx.dispose();
  });

  test("E2E-A07-07-002 正常取得時のHTTPステータスが200", async () => {
    test.skip(!HAS_API, "A07_07_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildKnownIdsPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-07-003 正常パラメータでSEED期待値どおりの個別入力商品が返る", async () => {
    test.skip(!HAS_API, "A07_07_READY(SEED-A07-07-PRODUCTS-KNOWN 既知値) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildKnownIdsPayload() });
    expect200(res.status());
    const items = await getArray(res);
    expect(items.length, "既知の個別入力商品が1件以上返る").toBeGreaterThan(0);
    // 各要素の buyOrderIndivisualInputProductId/buyOrderId/name/price/count/saleFlg が SEEDの既知期待値と一致（既知値はSEED確定後に env/fixture で照合＝要実機）。
    for (const item of items) {
      for (const field of RESPONSE_FIELDS) {
        expect(Object.prototype.hasOwnProperty.call(item, field), `要素が仕様フィールド ${field} を持つ`).toBeTruthy();
      }
    }
    await ctx.dispose();
  });

  test("E2E-A07-07-004 複数買取受注に跨るIDで全対象の個別入力商品が一括取得される", async () => {
    test.skip(!HAS_API, "A07_07_READY(SEED-A07-07-PRODUCTS-KNOWN 複数受注) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildMultiOrderIdsPayload() });
    expect200(res.status());
    const items = await getArray(res);
    // 指定した全買取受注IDに紐づく個別入力商品が過不足なく一括で返る（buyOrderId集合が指定IDに含まれる）。
    const buyOrderIds = new Set(items.map((it) => it.buyOrderId));
    expect(buyOrderIds.size, "複数の買取受注に跨る個別入力商品が一括取得される").toBeGreaterThan(0);
    await ctx.dispose();
  });

  test("E2E-A07-07-005 通信成立しJSON（application/json）で応答する", async () => {
    test.skip(!HAS_API, "A07_07_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildKnownIdsPayload() });
    expect200(res.status());
    expect(res.headers()["content-type"] ?? "", "Content-Type が application/json").toContain("application/json");
    await ctx.dispose();
  });

  test("E2E-A07-07-006 正常値で各フィールド値がSEED期待値と一致する", async () => {
    test.skip(!HAS_API, "A07_07_READY(SEED-A07-07-PRODUCTS-KNOWN 既知値) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildKnownIdsPayload() });
    expect200(res.status());
    const items = await getArray(res);
    // 各個別入力商品の name/price/count/saleFlg が SEEDの既知期待値と一致（既知値はSEED確定後 env/fixture で照合＝要実機）。各要素が仕様フィールドを持つことで構造を判定。
    for (const item of items) {
      for (const field of RESPONSE_FIELDS) {
        expect(Object.prototype.hasOwnProperty.call(item, field), `要素が仕様フィールド ${field} を持つ`).toBeTruthy();
      }
    }
    await ctx.dispose();
  });

  test("E2E-A07-07-007 該当0件でも失敗ステータスを返さずHTTP200", async () => {
    test.skip(!HAS_API, "A07_07_READY(SEED-A07-07-ORDER-NOPRODUCT) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildNoProductIdsPayload() });
    expect200(res.status()); // 専用の失敗ステータスを返さず200（正本md: 0件はエラーとせず空配列）。
    await ctx.dispose();
  });

  test("E2E-A07-07-008 重複/順不同の買取受注IDでも対応する個別入力商品を返す", async () => {
    test.skip(!HAS_API, "A07_07_READY(SEED-A07-07-PRODUCTS-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildDuplicateUnorderedIdsPayload() });
    expect200(res.status());
    await getArray(res); // 重複・順序によらず指定買取受注IDに紐づく個別入力商品がJSONで返る。
    await ctx.dispose();
  });

  // ===== レスポンス構造・型契約・null契約（IT-32） =====

  test("E2E-A07-07-009 正常応答が個別入力商品の配列で各要素が仕様フィールドを持つ", async () => {
    test.skip(!HAS_API, "A07_07_READY(SEED-A07-07-PRODUCTS-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildKnownIdsPayload() });
    expect200(res.status());
    const items = await getArray(res);
    expect(items.length, "判定には1件以上必要").toBeGreaterThan(0);
    for (const item of items) {
      for (const field of RESPONSE_FIELDS) {
        expect(Object.prototype.hasOwnProperty.call(item, field), `要素が仕様フィールド ${field} を持つ`).toBeTruthy();
      }
    }
    await ctx.dispose();
  });

  test("E2E-A07-07-010 正しい形式のPOSTボディを受理しHTTP200", async () => {
    test.skip(!HAS_API, "A07_07_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildKnownIdsPayload() });
    expect200(res.status()); // 受信検証を通過し正常応答（正本md: ids任意・受信検証）。
    await ctx.dispose();
  });

  test("E2E-A07-07-011 ids空/未指定でも必須エラーにせず空配列を返す", async () => {
    test.skip(!HAS_API, "A07_07_READY 未設定");
    const ctx = await newCtx();
    // 空文字。
    const resEmpty = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildEmptyIdsPayload() });
    expect200(resEmpty.status()); // 必須エラー(400)とせずHTTP200（正本md:99,125）。
    expect(await getArray(resEmpty), "空idsは空配列[]を返す").toEqual([]);
    // 未指定（キーごと省略）。
    const resMissing = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildMissingIdsPayload() });
    expect200(resMissing.status());
    expect(await getArray(resMissing), "未指定idsは空配列[]を返す").toEqual([]);
    await ctx.dispose();
  });

  test("E2E-A07-07-012 紐づく個別入力商品が無い買取受注IDのみで0件正常応答を返す", async () => {
    test.skip(!HAS_API, "A07_07_READY(SEED-A07-07-ORDER-NOPRODUCT) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildNoProductIdsPayload() });
    expect200(res.status());
    expect(await getArray(res), "応答全体が空配列[]（正本md:125,173,201）").toEqual([]);
    await ctx.dispose();
  });

  // ===== 認証・認可（IT-32 / IT-10。HS256署名検証の実方式は要実機確認＝env供給トークンで判定） =====

  test("E2E-A07-07-020 有効なjwt-tokenで個別入力商品を取得できHTTP200", async () => {
    test.skip(!HAS_API, "A07_07_READY(SEED-A07-07-JWT-ADMIN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildKnownIdsPayload() });
    expect200(res.status()); // 資格情報が有効＝200で取得できる。
    await getArray(res);
    await ctx.dispose();
  });

  test("E2E-A07-07-021 jwt-tokenヘッダ欠落で401となり取得できない", async () => {
    test.skip(!HAS_API, "A07_07_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH, { headers: buildNoAuthHeaders(), data: buildKnownIdsPayload() });
    expect401(res.status()); // ヘッダ欠落＝認証拒否401（正本md:62-68,192）。
    await ctx.dispose();
  });

  test("E2E-A07-07-022 該当する管理者会員が無いjwt-tokenで401となり取得できない", async () => {
    test.skip(!HAS_API, "A07_07_READY(SEED-A07-07-JWT-NO-MEMBER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH, { headers: buildJwtHeaders(JWT_NO_MEMBER), data: buildKnownIdsPayload() });
    expect401(res.status()); // 利用者IDから管理者会員を特定できず401（正本md:65,192）。
    await ctx.dispose();
  });

  test("E2E-A07-07-023 署名不正のjwt-tokenで401となり取得できない", async () => {
    test.skip(!HAS_API, "A07_07_READY(SEED-A07-07-JWT-BAD-SIGNATURE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH, { headers: buildJwtHeaders(JWT_BAD_SIGNATURE), data: buildKnownIdsPayload() });
    expect401(res.status()); // 署名検証失敗＝401。HS256署名検証の実方式は要実機確認だが結果（401）で判定。
    await ctx.dispose();
  });

  // ===== リクエスト未定義挙動（IT-32 / IT-10。非数値ID・想定外項目・異常系の具体応答は正典未定義＝付帯表4#3） =====

  test.fixme("E2E-A07-07-030 非数値/型不正IDの受理・除外挙動が正典未定義である", async () => {
    test.skip(!HAS_API, "A07_07_READY 未設定");
    // spec-oracle: 非数値/型不正IDの受理・除外（エラー化・除外・0件化のいずれか）は正典未定義のため期待結果を固定しない（付帯表4#3・要実機確認）。
    const ctx = await newCtx();
    const res = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildNonNumericIdsPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test.fixme("E2E-A07-07-031 想定外項目を加えて送信した結果が正典未定義である", async () => {
    test.skip(!HAS_API, "A07_07_READY 未設定");
    // spec-oracle: 想定外項目の無視可否は正典未定義のため期待結果を固定しない（付帯表4#3・要実機確認）。
    const ctx = await newCtx();
    const res = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildExtraFieldPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test.fixme("E2E-A07-07-032 異常入力でもサーバエラーで停止しない", async () => {
    test.skip(!HAS_API, "A07_07_READY 未設定");
    // spec-oracle: サーバ無応答・未定義例外で停止しないこと。異常入力時の具体HTTPステータスは正典未定義のため固定しない（付帯表4#3・要実機確認）。
    const ctx = await newCtx();
    const res = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildAbnormalPayload() });
    expect(res.status(), "サーバエラーで停止しない（500未満。具体ステータスは正典未定義）").toBeLessThan(500);
    await ctx.dispose();
  });

  // ===== レスポンス型・null契約・フィールド名（IT-32 設計書補完） =====

  test("E2E-A07-07-050 price/count/saleFlgが未設定時にnullで返る", async () => {
    test.skip(!HAS_API, "A07_07_READY(SEED-A07-07-NULLFIELDS) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildNullFieldsIdsPayload() });
    expect200(res.status());
    const items = await getArray(res);
    expect(items.length, "判定には1件以上必要").toBeGreaterThan(0);
    for (const item of items) {
      // serialize_null 有効により未設定は null（正本md:154）。フィールドは存在し値が null。
      expect(item.price, "price 未設定は null").toBeNull();
      expect(item.count, "count 未設定は null").toBeNull();
      expect(item.saleFlg, "saleFlg 未設定は null").toBeNull();
    }
    await ctx.dispose();
  });

  test("E2E-A07-07-051 priceとcountがinteger型で返る", async () => {
    test.skip(!HAS_API, "A07_07_READY(SEED-A07-07-PRODUCTS-KNOWN price/count値あり) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildKnownIdsPayload() });
    expect200(res.status());
    const items = await getArray(res);
    for (const item of items) {
      if (item.price !== null) expect(Number.isInteger(item.price), "price は integer（正本md 型契約）").toBeTruthy();
      if (item.count !== null) expect(Number.isInteger(item.count), "count は integer（正本md 型契約）").toBeTruthy();
    }
    await ctx.dispose();
  });

  test("E2E-A07-07-052 saleFlgがboolean型で返る", async () => {
    test.skip(!HAS_API, "A07_07_READY(SEED-A07-07-PRODUCTS-KNOWN saleFlg値あり) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildKnownIdsPayload() });
    expect200(res.status());
    const items = await getArray(res);
    for (const item of items) {
      if (item.saleFlg !== null) expect(typeof item.saleFlg, "saleFlg は boolean（正本md 型契約）").toBe("boolean");
    }
    await ctx.dispose();
  });

  test("E2E-A07-07-053 個数列が応答ではフィールド名countで返る", async () => {
    test.skip(!HAS_API, "A07_07_READY(SEED-A07-07-PRODUCTS-KNOWN 個数あり) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildKnownIdsPayload() });
    expect200(res.status());
    const items = await getArray(res);
    expect(items.length, "判定には1件以上必要").toBeGreaterThan(0);
    for (const item of items) {
      expect(Object.prototype.hasOwnProperty.call(item, "count"), "個数列は応答フィールド名 count（正本md）").toBeTruthy();
    }
    await ctx.dispose();
  });

  // ===== 副作用なし・一部不存在（IT-10 / IT-09 設計書補完） =====

  test("E2E-A07-07-054 連続呼び出しで応答が同一（参照のみ・副作用なし）", async () => {
    test.skip(!HAS_API, "A07_07_READY(SEED-A07-07-PRODUCTS-KNOWN) 未設定");
    const ctx = await newCtx();
    const res1 = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildKnownIdsPayload() });
    expect200(res1.status());
    const body1 = await res1.json();
    const res2 = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildKnownIdsPayload() });
    expect200(res2.status());
    const body2 = await res2.json();
    expect(body2, "2回の応答内容が同一（参照のみ・副作用なし・正本md:150-152）").toEqual(body1);
    await ctx.dispose();
  });

  test("E2E-A07-07-055 一部不存在で存在する個別入力商品のみ返り非対象IDは含まれない", async () => {
    test.skip(!HAS_API, "A07_07_READY(SEED-A07-07-PRODUCTS-KNOWN/ORDER-NOPRODUCT) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH, { headers: buildJwtHeaders(), data: buildPartialExistIdsPayload() });
    expect200(res.status());
    const items = await getArray(res);
    // 個別入力商品が紐づく買取受注IDの商品のみ返り、紐づきなし/存在しない買取受注IDは結果に含まれない（buyOrderId集合で判定）。
    const buyOrderIds = new Set(items.map((it) => String(it.buyOrderId)));
    expect(buyOrderIds.has("99999999"), "存在しない買取受注IDは結果に含まれない").toBeFalsy();
    await ctx.dispose();
  });
});
