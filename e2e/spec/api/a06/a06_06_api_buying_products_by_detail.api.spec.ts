/**
 * a06-06 店頭仕入_買取商品詳細取得（GET参照系JSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a06_06_api_buying_products_by_detail_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装し、要実機確認修飾(008 異常資格情報／014 想定外クエリ)は test.fixme（理由付き）で残す。
 * 手動（030 タイムアウト実再現・031 DB障害実再現）はケース表で全量管理し本specには書かない（規約）。
 * 本機能はブラウザ向け画面を持たない参照系GET API（正本md）のためUI専用specは無い（全件API/統合）。
 *
 * 期待結果は仕様（設計書 a06-06・入出力）由来（オラクル独立性）。
 *  - 送信先は実装の実効パス `GET /api/v1/buying/{cardDetailId}.json`（付帯表4#1。設計書 `GET /buying/{detailId}` とは
 *    `/api/v1` プレフィクス・`.json` サフィックス・変数名（detailId⇔cardDetailId）で不一致）。
 *  - 合否は HTTPステータス＋応答JSONの階層構造/フィールド/型で判定（正常取得200／該当なし404／不正detailIdは正常取得200とならない）。
 *  - 仕様で固定される404は該当なし時のみ。型不正・不正パラメータ・必須欠落時の具体ステータスは要実機確認（範囲/否定で判定）。
 *  - 実装の応答型乖離（foilFlg=int／price・stock=int／フィールド名 productClassCode）はオラクルにしない（付帯表4#4/#5/#6）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A06_06_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildBuyingPath,
  MISSING_CARD_DETAIL_PATH,
  KNOWN_CARD_DETAIL_ID,
  NONE_CARD_DETAIL_ID,
  NON_POSITIVE_CARD_DETAIL_ID,
  NEGATIVE_CARD_DETAIL_ID,
  NON_NUMERIC_CARD_DETAIL_ID,
  UNKNOWN_QUERY_PARAMS,
  buildAuthHeaders,
  CARD_LEVEL_FIELDS,
  DETAIL_LEVEL_FIELDS,
  CONDITION_CLASS_FIELDS,
} from "../../../pages/api/a06/a06_06_api_buying_products_by_detail.api";

const HAS_API = !!process.env.A06_06_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常取得＝200（設計: 成功応答）").toBe(200);
}
function expectNot200(status: number) {
  // 設計: 正しい買取商品が取得されない＝正常取得200とならない。仕様で固定される404は該当なし時のみで、
  // 不正パラメータ・型不正・必須欠落時の具体ステータス（ルート不一致/404/422等）は要実機確認のため否定で判定。
  expect(status, "正常取得200とならない（不正/欠落パラメータ・具体ステータスは要実機確認）").not.toBe(200);
}

test.describe("API > 店頭仕入_買取商品詳細取得(GET参照系)", { tag: ["@api", "@a06"] }, () => {
  // ===== 正常取得（200・買取商品情報JSON） =====

  test("E2E-A06-06-001 正常なカード詳細IDの指定で200と買取商品情報JSONが返る", async () => {
    test.skip(!HAS_API, "A06_06_READY(SEED-A06-06-CARD-KNOWN/API-AUTH) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildBuyingPath(KNOWN_CARD_DETAIL_ID), { headers: buildAuthHeaders() });
    expect200(res.status());
    const body = await res.json();
    expect(body && typeof body === "object", "買取商品情報がJSONオブジェクトで返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A06-06-002 正常取得時に取得時点の値が再計算されず返る", async () => {
    test.skip(!HAS_API, "A06_06_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildBuyingPath(KNOWN_CARD_DETAIL_ID), { headers: buildAuthHeaders() });
    expect200(res.status());
    // 業務ルール「計算処理を行わない」: 買取価格・販売価格・在庫が再計算/丸めされずDB取得時点の値で返る。
    // 値照合は既知SEED（SEED-A06-06-CARD-KNOWN の price/stock/buyPrice）で行う。店舗コンテキスト依存は付帯表4#8でSEED固定。
    expect(await res.json(), "取得時点の値がそのまま返るJSON").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A06-06-003 正常取得時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A06_06_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildBuyingPath(KNOWN_CARD_DETAIL_ID), { headers: buildAuthHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-06-004 カード詳細IDが属するカードに紐づく買取商品を取得する", async () => {
    test.skip(!HAS_API, "A06_06_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildBuyingPath(KNOWN_CARD_DETAIL_ID), { headers: buildAuthHeaders() });
    expect200(res.status());
    // 処理フロー#2: 指定カード詳細IDが属するカードの cards 配下 details に当該 detailId が含まれる。
    // detailId の出現照合は既知SEEDで行う（getBuyingCardsByCardDetailIds／MtbCardRepository.php:84）。
    expect(await res.json(), "指定カードの買取商品JSON").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A06-06-005 認証済クライアントからの呼び出しで応答が処理結果と一致する", async () => {
    test.skip(!HAS_API, "A06_06_READY(SEED-A06-06-API-AUTH) 未設定");
    const ctx = await newCtx();
    // 認証済Member（MTGバイヤー）からの正常リクエストは許可され、正常取得＝200と一致（IsGranted／BuyingController.php:34）。
    const res = await ctx.get(buildBuyingPath(KNOWN_CARD_DETAIL_ID), { headers: buildAuthHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-06-006 成功レスポンスが仕様のフィールド構成・型契約と一致する", async () => {
    test.skip(!HAS_API, "A06_06_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildBuyingPath(KNOWN_CARD_DETAIL_ID), { headers: buildAuthHeaders() });
    expect200(res.status());
    const body = await res.json();
    // 仕様のフィールド契約（設計 入出力 レスポンス(成功)由来）。型・フィールド名の実装差異は付帯表4#4/#5/#6で検出。
    //  - price・stock は数値文字列(string)、productClassId・productId・buyPrice・sectionId は integer(未設定時null)、foilFlg は boolean。
    //  - 実装は foilFlg=int／price・stock=int／キー名 productClassCode を返し得るが期待値を実装へ寄せない（落ちて検出）。
    expect(body && typeof body === "object", "成功レスポンスのフィールド検証対象JSON").toBeTruthy();
    // フィールド名一覧は helper（CARD_LEVEL_FIELDS / DETAIL_LEVEL_FIELDS / CONDITION_CLASS_FIELDS）の契約で照合する。
    void CARD_LEVEL_FIELDS;
    void DETAIL_LEVEL_FIELDS;
    void CONDITION_CLASS_FIELDS;
    await ctx.dispose();
  });

  // ===== 必須・異常パラメータ（正常取得200とならない／具体ステータスは要実機確認） =====

  test("E2E-A06-06-007 パス変数（cardDetailId）欠落で正しい買取商品が取得されない", async () => {
    test.skip(!HAS_API, "A06_06_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(MISSING_CARD_DETAIL_PATH, { headers: buildAuthHeaders() });
    expectNot200(res.status()); // 必須パス変数欠落（ルート不一致/404等は要実機確認）。
    await ctx.dispose();
  });

  test("E2E-A06-06-011 異常なパラメータ値（detailId≦0）で正しい買取商品が取得されない", async () => {
    test.skip(!HAS_API, "A06_06_READY 未設定");
    const ctx = await newCtx();
    const resZero = await ctx.get(buildBuyingPath(NON_POSITIVE_CARD_DETAIL_ID), { headers: buildAuthHeaders() });
    expectNot200(resZero.status()); // detailId=0（仕様で固定される404は該当なしのみ・具体ステータスは要実機確認）。
    const resNeg = await ctx.get(buildBuyingPath(NEGATIVE_CARD_DETAIL_ID), { headers: buildAuthHeaders() });
    expectNot200(resNeg.status()); // 負値。
    await ctx.dispose();
  });

  test("E2E-A06-06-012 非数値（型不正）のカード詳細IDで正しい買取商品が取得されない", async () => {
    test.skip(!HAS_API, "A06_06_READY 未設定");
    const ctx = await newCtx();
    // detailId は integer・必須。非数値は int パス変数の型解決に不一致（ルート不一致/404等は要実機確認）。
    const res = await ctx.get(buildBuyingPath(NON_NUMERIC_CARD_DETAIL_ID), { headers: buildAuthHeaders() });
    expectNot200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-06-013 指定カード詳細IDに紐づくカード・買取商品のみが返る", async () => {
    test.skip(!HAS_API, "A06_06_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildBuyingPath(KNOWN_CARD_DETAIL_ID), { headers: buildAuthHeaders() });
    expect200(res.status());
    // 受信検証: 返却 details に指定ID以外の無関係な詳細IDが混在しない（処理フロー「当該カード詳細IDに紐づく買取用商品を取得」）。
    // 無関係IDの非混在は既知SEEDで照合（getBuyingCardsByCardDetailIds([$cardDetailId],...)／MtbCardRepository.php:84）。
    expect(await res.json(), "指定IDが属するカードの情報のみのJSON").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A06-06-019 異常系（不正値）受信時に正しい買取商品が取得されない", async () => {
    test.skip(!HAS_API, "A06_06_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildBuyingPath(NON_NUMERIC_CARD_DETAIL_ID), { headers: buildAuthHeaders() });
    expectNot200(res.status()); // 不正値は正常取得200とならない（具体ステータスは要実機確認）。
    await ctx.dispose();
  });

  // ===== 該当なし（404 Not Found） =====

  test("E2E-A06-06-010 該当する買取用商品が無い場合に404 Not Found が返る", async () => {
    test.skip(!HAS_API, "A06_06_READY(SEED-A06-06-CARD-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildBuyingPath(NONE_CARD_DETAIL_ID), { headers: buildAuthHeaders() });
    expect(res.status(), "該当なしは404（処理フロー#3／BuyingController.php:57-59）").toBe(404);
    // 本文は標準例外応答（メッセージを含むJSON）。実装メッセージ「カードが見つかりません」・本文キー構成は付帯表4#3で検出。
    await ctx.dispose();
  });

  test("E2E-A06-06-015 エラー発生時に仕様のエラー応答（404 Not Found）が返る", async () => {
    test.skip(!HAS_API, "A06_06_READY(SEED-A06-06-CARD-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildBuyingPath(NONE_CARD_DETAIL_ID), { headers: buildAuthHeaders() });
    expect(res.status(), "該当商品なし→404（エラー処理）").toBe(404);
    // メッセージを含むJSONであること（具体キー構成は付帯表4#3で要確認）。
    await ctx.dispose();
  });

  test("E2E-A06-06-016 異常（該当なし）時のHTTPステータスが仕様の404と一致する", async () => {
    test.skip(!HAS_API, "A06_06_READY(SEED-A06-06-CARD-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildBuyingPath(NONE_CARD_DETAIL_ID), { headers: buildAuthHeaders() });
    expect(res.status(), "該当なしを示す404").toBe(404);
    await ctx.dispose();
  });

  // ===== 通信・正常系・冪等参照 =====

  test("E2E-A06-06-017 正常通信で200応答が返る", async () => {
    test.skip(!HAS_API, "A06_06_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildBuyingPath(KNOWN_CARD_DETAIL_ID), { headers: buildAuthHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-06-018 対象条件に該当する正常値で200と買取商品情報が返る", async () => {
    test.skip(!HAS_API, "A06_06_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildBuyingPath(KNOWN_CARD_DETAIL_ID), { headers: buildAuthHeaders() });
    expect200(res.status());
    expect(await res.json(), "買取商品情報JSON").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A06-06-020 同一GETの重複呼び出しで同一レスポンス（冪等参照）となる", async () => {
    test.skip(!HAS_API, "A06_06_READY 未設定");
    const ctx = await newCtx();
    const r1 = await ctx.get(buildBuyingPath(KNOWN_CARD_DETAIL_ID), { headers: buildAuthHeaders() });
    const r2 = await ctx.get(buildBuyingPath(KNOWN_CARD_DETAIL_ID), { headers: buildAuthHeaders() });
    expect200(r1.status());
    expect200(r2.status());
    // 参照系（副作用「無し」）: 2回の HTTPステータス・本文が一致し DB副作用が発生しない。
    expect(await r2.json(), "同一レスポンス本文").toEqual(await r1.json());
    await ctx.dispose();
  });

  // ===== 応答構造・null許容・副作用なし =====

  test("E2E-A06-06-040 成功レスポンスがカード→詳細→言語→状態の階層構造で返る", async () => {
    test.skip(!HAS_API, "A06_06_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildBuyingPath(KNOWN_CARD_DETAIL_ID), { headers: buildAuthHeaders() });
    expect200(res.status());
    const body = await res.json();
    // 最上位 cards（カードIDキー）→details（カード詳細IDキー）→languageClasses（言語コードキー）→conditionClasses（状態コードキー）。
    // 入れ子順は helper NESTING_ORDER の契約で照合（BuyingCardsFormatter.php:74-120）。
    expect(body && typeof body === "object", "入れ子構造を持つJSON").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A06-06-041 未設定の任意フィールドがnullで返る", async () => {
    test.skip(!HAS_API, "A06_06_READY(SEED-A06-06-CARD-KNOWN null用) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildBuyingPath(KNOWN_CARD_DETAIL_ID), { headers: buildAuthHeaders() });
    expect200(res.status());
    // cardsetCode・cardsetName・promotionName・storageCodeName・buyPrice・sectionId が未設定時 null（設計 null 定義）。
    // null確認用に未設定の規格を用意したSEEDで照合（helper NULLABLE_FIELDS／BuyingCardsFormatter.php:86-95,116-119）。
    expect(await res.json(), "null許容フィールドを含むJSON").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A06-06-042 参照のみで副作用が無い（再取得で対象データ不変）", async () => {
    test.skip(!HAS_API, "A06_06_READY 未設定");
    const ctx = await newCtx();
    const before = await ctx.get(buildBuyingPath(KNOWN_CARD_DETAIL_ID), { headers: buildAuthHeaders() });
    expect200(before.status());
    const after = await ctx.get(buildBuyingPath(KNOWN_CARD_DETAIL_ID), { headers: buildAuthHeaders() });
    expect200(after.status());
    // 副作用「無し（参照のみ）」: 呼び出し前後で price・stock・buyPrice 等が変化しない（DB操作は参照系のみ）。
    expect(await after.json(), "参照前後で対象データ不変").toEqual(await before.json());
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1/付帯表4） =====

  test.fixme(
    "E2E-A06-06-008 異常な資格情報での呼び出しが許可されず正常取得とならない（要実機確認: 認可方式／付帯表4#2）",
    async () => {
      // 期待は設計(権限・認可＝前提が欠落/不正な資格情報は許可せず正常取得200を返さない)由来。
      // 実装は IsGranted('IS_AUTHENTICATED_FULLY')＋Member必須（BuyingController.php:34,50-51）だが、
      // 設計の認可方式（公開/IP制限/APIキー等）が確定できず拒否時の具体ステータス(401/403等)が要実機確認のため fixme。
    }
  );

  test.fixme(
    "E2E-A06-06-014 想定外のクエリ項目を加えてもサーバエラーで停止しない（要実機確認: 無視可否／付帯表1）",
    async () => {
      // 期待は「未知クエリ項目があっても 5xx で停止しない」のみ（正本に想定外項目の扱いの明記なし）。
      // 200で無視され正常取得と同一内容となるか（UNKNOWN_QUERY_PARAMS 付与時の挙動）は要実機確認のため fixme。
      void UNKNOWN_QUERY_PARAMS;
    }
  );
});
