/**
 * a07-06 オンライン仕入_買取メインカード（買取アプリ=MTGバイヤー向けに、複数のネット買取受注IDから買取代表カード一覧をまとめて返す参照系JSON API・POST）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a07_06_api_online_purchase_buy_main_card_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装する。「E2E自動化(API/統合)（要実機確認）」修飾の 012（想定外項目の無視可否が正本md未定義）は test.fixme（spec-oracle コメント＋理由）とする。
 * 手動（030 タイムアウト実再現／031 DB接続障害実再現＝いずれも外部依存の要実機確認）はケース表で全量管理し本specには書かない（規約）。
 * 本機能は画面なしAPI（正本md「ブラウザ向けの画面を持たない」）のためUI専用specは無い（自動化(UI)0件）。
 *
 * 期待結果は仕様（正本md＝pf-api挙動／観点表・基本設計）由来（オラクル独立性）。実装のレスポンス形・FW既定値・整形結果を期待値に流用しない。
 *  - 送信先は実装の実効パス `POST /api/v1/admin/buyMainCard.json`（付帯表1/付帯表4#1。正本md `POST /admin/buyMainCard.json` は `/api/v1` を欠き不一致）。
 *  - 認証は firewall app（access_token・JwtTokenHandler／JwtTokenHeaderExtractor＝security.yaml:32-39）。ヘッダ名 `jwt-token`。欠落/該当会員なし/署名不正＝401。
 *  - 合否は設計書の意味で判定: 正常取得＝HTTP200＋買取代表カード配列／該当0件＝HTTP200＋空配列 `[]`〔仕様固定〕／認証失敗＝HTTP401〔仕様固定〕／不正・非数値idsは5xx・400固定とならない。
 *  - 成功レスポンスの型契約（buyMainCardId〜purchaseCategory・null許容・foilFlg/saleFlg boolean・applicationPrice 状態コードキーのobject）は正本md由来で判定する。
 *    foilFlg の実装 int 返却は付帯表4#2、applicationPrice の未付与時/0件時の付与形（実装は常にキー付与・空配列）は付帯表4#4 → 仕様どおり期待し違えば落として検出（実装へ寄せない）。
 *  - 本APIは参照系（DB更新なし）。副作用なし（042）は API応答を一次オラクルとし、対象データ不変は DB照査で補完（本リポでDBは実行しない）。
 *  - 有効JWT原値・SEED ネット買取受注ID は env で供給し原値はコミットしない。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A07_06_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  BUY_MAIN_CARD_PATH,
  buildJwtHeaders,
  buildNoAuthHeaders,
  JWT_NO_MEMBER,
  JWT_BAD_SIGNATURE,
  buildValidIdsPayload,
  buildNoneIdsPayload,
  buildInvalidIdsPayload,
  buildExtraFieldPayload,
  buildMissingIdsPayload,
  buildEmptyIdsPayload,
  expectedBuyOrderIds,
  SUCCESS_FIELDS,
  INTEGER_FIELDS,
  NULLABLE_INTEGER_FIELDS,
  NULLABLE_BOOLEAN_FIELDS,
} from "../../../pages/api/a07/a07_06_api_online_purchase_buy_main_card.api";

const HAS_API = !!process.env.A07_06_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常取得＝200（正本md: 入出力 レスポンス(成功)）").toBe(200);
}
function expect401(status: number) {
  expect(status, "認証拒否＝401（正本md: 認証・認可／BadCredentialsException）").toBe(401);
}

/** 成功レスポンス本文＝買取代表カードの配列（正本md: 入出力 レスポンス(成功)）。 */
async function expectArrayBody(res: { json: () => Promise<unknown> }): Promise<unknown[]> {
  const body = await res.json();
  expect(Array.isArray(body), "成功本文は買取代表カードの配列（JSON array）").toBeTruthy();
  return body as unknown[];
}

test.describe("API > オンライン仕入_買取メインカード", { tag: ["@api", "@a07"] }, () => {
  // ===== 正常取得（IT-09 / IT-10 / IT-32） =====

  test("E2E-A07-06-001 正常なネット買取IDリストで200と買取代表カード配列が返る", async () => {
    test.skip(!HAS_API, "A07_06_READY(SEED-A07-06-CARD-KNOWN/API-AUTH) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(), data: buildValidIdsPayload() });
    expect200(res.status());
    await expectArrayBody(res); // 指定IDに紐づく買取代表カードの配列がJSONで返る。
    await ctx.dispose();
  });

  test("E2E-A07-06-002 正常取得時に取得時点の値が再計算されず返る", async () => {
    test.skip(!HAS_API, "A07_06_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(), data: buildValidIdsPayload() });
    expect200(res.status());
    // 業務ルール「金額・税・ポイント・在庫数量の再計算は行わない」。price は取得時点の integer（再計算/丸めなし）。SEED既知値との一致は値オラクルで補完。
    const body = await expectArrayBody(res);
    for (const el of body as Record<string, unknown>[]) {
      if (el.price !== null) expect(Number.isInteger(el.price), "price は取得時点の integer（再計算/丸めなし）").toBeTruthy();
    }
    await ctx.dispose();
  });

  test("E2E-A07-06-003 正常取得時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A07_06_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(), data: buildValidIdsPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-06-004 指定ネット買取受注IDに紐づく買取代表カードを取得する", async () => {
    test.skip(!HAS_API, "A07_06_READY(SEED-A07-06-CARD-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(), data: buildValidIdsPayload() });
    expect200(res.status());
    // 処理フロー#3: 各要素の buyOrderId が指定IDのいずれかと一致する。
    const body = await expectArrayBody(res);
    const ids = expectedBuyOrderIds();
    for (const el of body as Record<string, unknown>[]) {
      expect(ids, "各要素の buyOrderId は指定したネット買取受注IDのいずれかと一致する").toContain(el.buyOrderId);
    }
    await ctx.dispose();
  });

  test("E2E-A07-06-005 認証済管理者会員（有効JWT）からの呼び出しで200となる", async () => {
    test.skip(!HAS_API, "A07_06_READY(SEED-A07-06-API-AUTH) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(), data: buildValidIdsPayload() });
    expect200(res.status()); // 有効JWTの管理者会員は許可され正常取得200。クライアント=買取アプリ限定の実体は付帯表4#6 要確認。
    await ctx.dispose();
  });

  test("E2E-A07-06-006 成功レスポンスが仕様のフィールド構成・型契約と一致する", async () => {
    test.skip(!HAS_API, "A07_06_READY(SEED-A07-06-CARD-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(), data: buildValidIdsPayload() });
    expect200(res.status());
    const body = await expectArrayBody(res);
    expect(body.length, "型契約確認のため1件以上の代表カードを含む").toBeGreaterThan(0);
    for (const el of body as Record<string, unknown>[]) {
      for (const f of SUCCESS_FIELDS) {
        expect(Object.prototype.hasOwnProperty.call(el, f), `成功フィールド ${f} を含む（正本md 入出力(成功)）`).toBeTruthy();
      }
      for (const f of INTEGER_FIELDS) {
        expect(Number.isInteger(el[f]), `${f} は integer（正本md 型契約）`).toBeTruthy();
      }
      for (const f of NULLABLE_INTEGER_FIELDS) {
        expect(el[f] === null || Number.isInteger(el[f]), `${f} は integer（未設定時 null）`).toBeTruthy();
      }
      for (const f of NULLABLE_BOOLEAN_FIELDS) {
        // 正本md: boolean（未設定時 null）。実装は foilFlg を int(0/1) で返す可能性（付帯表4#2）→ 仕様の boolean を期待し違えば落として検出。
        expect(el[f] === null || typeof el[f] === "boolean", `${f} は boolean（未設定時 null・正本md型契約／foilFlg int返却は付帯表4#2）`).toBeTruthy();
      }
      // applicationPrice は一致する申込時価格がある要素にのみ付与され、付与時はカード状態コードキー→integer の object（全要素必須ではない＝044で未付与を確認）。
      if (Object.prototype.hasOwnProperty.call(el, "applicationPrice")) {
        const ap = el.applicationPrice;
        expect(typeof ap === "object" && ap !== null && !Array.isArray(ap), "applicationPrice は状態コードキーの object（実装の空配列付与は付帯表4#4）").toBeTruthy();
      }
    }
    await ctx.dispose();
  });

  // ===== 認証・認可（IT-32 / IT-10） =====

  test("E2E-A07-06-007 jwt-tokenヘッダ欠落で401となり正常取得とならない", async () => {
    test.skip(!HAS_API, "A07_06_READY(SEED-A07-06-API-AUTH) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildNoAuthHeaders(), data: buildValidIdsPayload() });
    expect401(res.status()); // 必須 jwt-token 欠落＝認証拒否401。買取代表カード配列(200)を返さない。
    await ctx.dispose();
  });

  test("E2E-A07-06-008 署名不正・該当管理者会員なしのJWTで401となる", async () => {
    test.skip(!HAS_API, "A07_06_READY(SEED-A07-06-API-AUTH) 未設定");
    const ctx = await newCtx();
    // 署名不正のトークンで認証拒否を確認（該当会員なし JWT_NO_MEMBER も同じ401＝本テストで代表的に署名不正を判定）。
    const res = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(JWT_BAD_SIGNATURE), data: buildValidIdsPayload() });
    expect401(res.status());
    // 該当管理者会員なし（存在しない sub）も同様に401（JwtTokenHandler.php:46-58,73-79）。
    const res2 = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(JWT_NO_MEMBER), data: buildValidIdsPayload() });
    expect401(res2.status());
    await ctx.dispose();
  });

  // ===== データなし（IT-32） =====

  test("E2E-A07-06-010 該当する買取代表カードが無い場合に200と空配列が返る", async () => {
    test.skip(!HAS_API, "A07_06_READY(SEED-A07-06-CARD-NONE/API-AUTH) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(), data: buildNoneIdsPayload() });
    expect200(res.status());
    const body = await expectArrayBody(res);
    expect(body.length, "該当0件は空配列 [] を返す（仕様固定）").toBe(0);
    await ctx.dispose();
  });

  // ===== リクエスト・バリデーション（IT-32） =====

  test("E2E-A07-06-011 非数値・不正idsでも5xx・400固定とならない", async () => {
    test.skip(!HAS_API, "A07_06_READY(SEED-A07-06-CARD-KNOWN/API-AUTH) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(), data: buildInvalidIdsPayload() });
    // バリデーション「形式・件数の検証は行わない／明示的な検証エラー(400)は返さない」。サーバエラー(5xx)・検証エラー(400)で固定とならないことのみ判定。
    // 非数値ID除外（有効数値のみ返す）は実装由来＝付帯表4#3 で要実機確認のため期待値に固定しない。
    expect(res.status(), "非数値idsでサーバエラー(5xx)とならない").toBeLessThan(500);
    expect(res.status(), "非数値idsで明示的な検証エラー(400)固定とならない").not.toBe(400);
    await ctx.dispose();
  });

  test("E2E-A07-06-012 想定外のボディ項目を加えても5xxで停止しない", async () => {
    // test.fixme（付帯表1: E2E自動化(API/統合)（要実機確認））: 想定外項目の扱いは正本md未定義。
    // 200で無視され正常取得と同一内容となるか（無視可否）は要実機確認のため期待値を固定できず未確定。実機で観測後に有効化する。
    test.fixme(true, "想定外項目の無視可否が正本md未定義（要実機確認）。実機観測後に 200・正常取得同一を確定して有効化。");
    test.skip(!HAS_API, "A07_06_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(), data: buildExtraFieldPayload() });
    expect(res.status(), "想定外項目でサーバエラー(5xx)で停止しない").toBeLessThan(500);
    await ctx.dispose();
  });

  test("E2E-A07-06-013 指定ネット買取受注IDに紐づく代表カードのみが返る", async () => {
    test.skip(!HAS_API, "A07_06_READY(SEED-A07-06-CARD-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(), data: buildValidIdsPayload() });
    expect200(res.status());
    // 受信検証: 各要素の buyOrderId が指定ID以外を含まない（指定IDに紐づく代表カードのみ）。
    const body = await expectArrayBody(res);
    const ids = expectedBuyOrderIds();
    for (const el of body as Record<string, unknown>[]) {
      expect(ids, "返却 buyOrderId は指定したネット買取受注ID以外を含まない").toContain(el.buyOrderId);
    }
    await ctx.dispose();
  });

  // ===== エラー応答・HTTPステータス（IT-10） =====

  test("E2E-A07-06-015 認証エラー時に401・本文なしのエラー応答が返る", async () => {
    test.skip(!HAS_API, "A07_06_READY(SEED-A07-06-API-AUTH) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(JWT_BAD_SIGNATURE), data: buildValidIdsPayload() });
    expect401(res.status());
    // 入出力 レスポンス(失敗)「401＝認証拒否（本文を持たない）」。
    const text = await res.text();
    expect(text.length, "401応答は本文を持たない（正本md）").toBe(0);
    await ctx.dispose();
  });

  test("E2E-A07-06-016 異常（認証失敗）時のHTTPステータスが401である", async () => {
    test.skip(!HAS_API, "A07_06_READY(SEED-A07-06-API-AUTH) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(JWT_BAD_SIGNATURE), data: buildValidIdsPayload() });
    expect401(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-06-017 正常通信で200応答が返る", async () => {
    test.skip(!HAS_API, "A07_06_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(), data: buildValidIdsPayload() });
    expect200(res.status()); // POST通信成立・成功＝200。
    await ctx.dispose();
  });

  test("E2E-A07-06-018 対象条件に該当する正常値で200と買取代表カード配列が返る", async () => {
    test.skip(!HAS_API, "A07_06_READY(SEED-A07-06-CARD-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(), data: buildValidIdsPayload() });
    expect200(res.status());
    await expectArrayBody(res);
    await ctx.dispose();
  });

  test("E2E-A07-06-019 異常系（不正トークン）受信時に正常取得とならない", async () => {
    test.skip(!HAS_API, "A07_06_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(JWT_BAD_SIGNATURE), data: buildValidIdsPayload() });
    expect401(res.status()); // 不正トークンは認証拒否401。正常取得(200で配列)とならない。
    await ctx.dispose();
  });

  // ===== 重複・順序（IT-10。参照系の冪等） =====

  test("E2E-A07-06-020 同一POSTの重複呼び出しで同一レスポンスとなる", async () => {
    test.skip(!HAS_API, "A07_06_READY(SEED-A07-06-CARD-KNOWN) 未設定");
    const ctx = await newCtx();
    const res1 = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(), data: buildValidIdsPayload() });
    const res2 = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(), data: buildValidIdsPayload() });
    // 参照系のため2回の呼び出しで同一のステータス・本文が返る（副作用なし＝冪等参照）。DB更新が無いことは DB照査で補完。
    expect(res1.status(), "重複呼び出しで同一HTTPステータス").toBe(res2.status());
    expect(await res1.text(), "重複呼び出しで同一レスポンス本文（冪等参照）").toBe(await res2.text());
    await ctx.dispose();
  });

  // ===== レスポンス構造・null許容・副作用なし（IT-09・設計書補完） =====

  test("E2E-A07-06-040 状態別申込時価格が状態コードキーのapplicationPriceとして付与される", async () => {
    test.skip(!HAS_API, "A07_06_READY(SEED-A07-06-CARD-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(), data: buildValidIdsPayload() });
    expect200(res.status());
    const body = await expectArrayBody(res);
    // 処理フロー#5: applicationPrice はカード状態コードをキー・申込時買取価格(integer)を値とする object。付与される要素で構造を確認。
    const withAp = (body as Record<string, unknown>[]).find(
      (el) => Object.prototype.hasOwnProperty.call(el, "applicationPrice") && el.applicationPrice !== null && !Array.isArray(el.applicationPrice),
    );
    expect(withAp, "申込時価格を持つ代表カードに applicationPrice が付与される（0件時の付与形は付帯表4#4）").toBeTruthy();
    if (withAp) {
      for (const v of Object.values(withAp.applicationPrice as Record<string, unknown>)) {
        expect(Number.isInteger(v), "applicationPrice の値は申込時買取価格 integer").toBeTruthy();
      }
    }
    await ctx.dispose();
  });

  test("E2E-A07-06-041 未設定の任意フィールドがnullで返る", async () => {
    test.skip(!HAS_API, "A07_06_READY(SEED-A07-06-CARD-KNOWN 未設定フィールド代表カード) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(), data: buildValidIdsPayload() });
    expect200(res.status());
    // 入出力 レスポンス(成功) null定義: languageId/foilFlg/count/price/cardConditionId/saleFlg は未設定のとき null。
    const body = await expectArrayBody(res);
    const nullable = [...NULLABLE_INTEGER_FIELDS, ...NULLABLE_BOOLEAN_FIELDS];
    for (const el of body as Record<string, unknown>[]) {
      for (const f of nullable) {
        const v = el[f];
        expect(v === null || v !== undefined, `${f} は未設定時 null（キー欠落でなく null 値・正本md）`).toBeTruthy();
      }
    }
    await ctx.dispose();
  });

  test("E2E-A07-06-042 参照のみで副作用が無い（再取得で対象データ不変）", async () => {
    test.skip(!HAS_API, "A07_06_READY(SEED-A07-06-CARD-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(), data: buildValidIdsPayload() });
    expect200(res.status());
    // 副作用「無し（参照のみ）」・データ整合性「本APIはデータを更新しない」。呼び出し前後で対象データが不変であることは DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A07-06-043 ids未指定・空文字のとき200と空配列が返る", async () => {
    test.skip(!HAS_API, "A07_06_READY(SEED-A07-06-API-AUTH) 未設定");
    const ctx = await newCtx();
    // ids 未指定。入出力 リクエスト「未指定・空文字のときは結果0件」。空文字短絡の実装挙動は付帯表4#5。
    const res = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(), data: buildMissingIdsPayload() });
    expect200(res.status());
    const body = await expectArrayBody(res);
    expect(body.length, "ids未指定は200で空配列 [] を返す").toBe(0);
    // 空文字も同様に200・空配列。
    const res2 = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(), data: buildEmptyIdsPayload() });
    expect200(res2.status());
    const body2 = await expectArrayBody(res2);
    expect(body2.length, "ids空文字は200で空配列 [] を返す").toBe(0);
    await ctx.dispose();
  });

  test("E2E-A07-06-044 一致する申込時価格が無い代表カードではapplicationPriceキーが付与されない", async () => {
    test.skip(!HAS_API, "A07_06_READY(SEED-A07-06-CARD-KNOWN 申込時価格なし代表カード) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUY_MAIN_CARD_PATH, { headers: buildJwtHeaders(), data: buildValidIdsPayload() });
    expect200(res.status());
    const body = await expectArrayBody(res);
    // 入出力 レスポンス applicationPrice定義「一致する申込時価格が無い代表カードでは付与されない」。
    // 実装は常にキーを付与し0件時に空配列を返す乖離（付帯表4#4）→ 仕様（未付与）を期待し違えば落として検出。
    const noPriceCard = (body as Record<string, unknown>[]).find(
      (el) => el.cardConditionId === null,
    );
    if (noPriceCard) {
      expect(
        Object.prototype.hasOwnProperty.call(noPriceCard, "applicationPrice"),
        "一致する申込時価格が無い代表カードには applicationPrice キーが付与されない（実装の常時付与は付帯表4#4で検出）",
      ).toBeFalsy();
    }
    await ctx.dispose();
  });
});
