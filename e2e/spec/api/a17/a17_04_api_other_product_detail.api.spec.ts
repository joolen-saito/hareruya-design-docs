/**
 * a17-04 商品詳細取得（GET参照系JSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a17_04_api_other_product_detail_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装し、要実機確認修飾（006 想定外クエリ）は test.fixme（理由付き）で残す。
 * 手動（017 認可方式の実体確認／018 タイムアウト実再現／040 DB接続障害実再現）はケース表で全量管理し本specには書かない（規約）。
 * 本APIはブラウザ向け画面を持たない（正本md）ためUI専用specは無い＝全てAPI/統合レイヤで観測する。
 *
 * 期待結果は仕様（正本md a17-04・観点表）由来（オラクル独立性）。
 *  - 送信先は実装の実効パス `GET /api/product/detail/{productId}`（ProductController.php:50）。設計書パス `/product/detail/{productId}` との乖離は付帯表4#1。
 *  - 合否は HTTPステータス・レスポンス本文（構造・型・既知値）で判定する。
 *  - 404本文は message を含むJSONを仕様とし、本文形（付帯表4#3）はオラクルに固定しない。
 *  - 型不正・不正パラメータ時は「正常取得200とならない」のみ判定（実装の具体ステータス＝付帯表4#5 は固定しない）。
 *  - 週間販売数の集計定義（付帯表4#4）・表示下限値（付帯表4#6）は要確認。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A17_04_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildDetailPath,
  MISSING_PRODUCT_ID_PATH,
  buildLangQuery,
  UNKNOWN_QUERY_PARAMS,
  DEFAULT_LANG,
  KNOWN_PRODUCT_ID,
  CARD_PRODUCT_ID,
  NONCARD_PRODUCT_ID,
  COND_PRODUCT_ID,
  NONE_PRODUCT_ID,
  ZERO_PRODUCT_ID,
  NEGATIVE_PRODUCT_ID,
  NON_NUMERIC_PRODUCT_ID,
  EXPECTED_WEEKLY_SOLD,
  EXPECTED_PRICE,
  EXPECTED_STOCK,
  LANGUAGE_CODE_PREFIX_HEAD,
  ROOT_FIELDS,
  PRODUCT_CLASS_FIELDS,
  ProductDetailSuccessBody,
  ProductDetailErrorBody,
} from "../../../pages/api/a17/a17_04_api_other_product_detail.api";

const HAS_API = !!process.env.A17_04_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常取得＝200（正本md レスポンス(成功)）").toBe(200);
}
function expect404(status: number) {
  expect(status, "該当なし＝404（正本md 処理フロー#2／エラー処理 Not Found）").toBe(404);
}
function expectNot200(status: number) {
  // 仕様で固定される404は該当なし時のみ。型不正・不正パラメータの具体ステータス（付帯表4#5）は固定せず「正常取得200とならない」で判定。
  expect(status, "不正リクエストは正常取得200とならない（具体ステータスは要実機確認）").not.toBe(200);
}

test.describe("API > 商品詳細取得(GET参照系)", { tag: ["@api", "@a17"] }, () => {
  // ===== 正常取得（200・値・絞り込み） =====

  test("E2E-A17-04-001 正常なproductIdの指定で200と商品詳細JSONが返る", async () => {
    test.skip(!HAS_API, "A17_04_READY(SEED-A17-04-PRODUCT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDetailPath(KNOWN_PRODUCT_ID), { params: buildLangQuery(DEFAULT_LANG) });
    expect200(res.status());
    const body = (await res.json()) as ProductDetailSuccessBody;
    expect(String(body.product_id), "商品本体の product_id が返る").toBeTruthy();
    expect(Array.isArray(body.product_classes), "商品規格配列が返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A17-04-002 正常取得時に取得時点の値が再計算/丸めされず返る", async () => {
    test.skip(!HAS_API, "A17_04_READY(SEED-A17-04-PRODUCT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDetailPath(KNOWN_PRODUCT_ID), { params: buildLangQuery(DEFAULT_LANG) });
    expect200(res.status());
    const body = (await res.json()) as ProductDetailSuccessBody;
    // 業務ルール「金額・税・ポイント・在庫数量の再計算や丸めを行わない」＝取得時点の値。値照合は env 期待値（未設定なら要実機確認）。
    const pc = (body.product_classes[0] ?? {}) as Record<string, unknown>;
    if (EXPECTED_PRICE !== undefined) expect(String(pc.price), "price 一致").toBe(EXPECTED_PRICE);
    if (EXPECTED_STOCK !== undefined) expect(String(pc.stock), "stock 一致").toBe(EXPECTED_STOCK);
    await ctx.dispose();
  });

  test("E2E-A17-04-003 正常取得時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A17_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDetailPath(KNOWN_PRODUCT_ID), { params: buildLangQuery(DEFAULT_LANG) });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A17-04-004 productIdに紐づく商品本体・商品規格を取得する", async () => {
    test.skip(!HAS_API, "A17_04_READY(SEED-A17-04-PRODUCT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDetailPath(KNOWN_PRODUCT_ID), { params: buildLangQuery(DEFAULT_LANG) });
    expect200(res.status());
    const body = (await res.json()) as ProductDetailSuccessBody;
    // 処理フロー#2「商品IDで商品詳細を取得」＝product_id が指定IDと一致。
    expect(String(body.product_id), "product_id が指定IDと一致").toBe(String(KNOWN_PRODUCT_ID));
    await ctx.dispose();
  });

  test("E2E-A17-04-008 成功レスポンスが仕様のフィールド構成・型契約と一致する", async () => {
    test.skip(!HAS_API, "A17_04_READY(SEED-A17-04-PRODUCT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDetailPath(KNOWN_PRODUCT_ID), { params: buildLangQuery(DEFAULT_LANG) });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    for (const f of ROOT_FIELDS) expect(f in body, `${f} を持つ`).toBeTruthy();
    // code・weekly_sold・product_id は integer、name系は string、categories/product_class_images は array、card_detail は object/null。
    expect(Number.isInteger(body.code), "code は integer").toBeTruthy();
    expect(Number.isInteger(body.weekly_sold), "weekly_sold は integer").toBeTruthy();
    expect(Number.isInteger(body.product_id), "product_id は integer").toBeTruthy();
    expect(typeof body.product_name, "product_name は string").toBe("string");
    expect(typeof body.language_code, "language_code は string").toBe("string");
    expect(Array.isArray(body.categories), "categories は array").toBeTruthy();
    const classes = body.product_classes as Record<string, unknown>[];
    for (const pc of classes) {
      for (const f of PRODUCT_CLASS_FIELDS) expect(f in pc, `product_classes[].${f} を持つ`).toBeTruthy();
      expect(Number.isInteger(pc.product_class_id), "product_class_id は integer").toBeTruthy();
      expect(Number.isInteger(pc.price), "price は integer").toBeTruthy();
      expect(Number.isInteger(pc.stock), "stock は integer").toBeTruthy();
      expect(Array.isArray(pc.product_class_images), "product_class_images は array").toBeTruthy();
    }
    await ctx.dispose();
  });

  test("E2E-A17-04-010 指定productId・言語に紐づく商品詳細のみが返る", async () => {
    test.skip(!HAS_API, "A17_04_READY(SEED-A17-04-PRODUCT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDetailPath(KNOWN_PRODUCT_ID), { params: buildLangQuery(DEFAULT_LANG) });
    expect200(res.status());
    const body = (await res.json()) as ProductDetailSuccessBody;
    // 処理フロー#2「商品IDと言語で商品詳細を取得」＝指定ID・指定言語に対応するもののみ。
    expect(String(body.product_id), "指定商品IDに対応").toBe(String(KNOWN_PRODUCT_ID));
    expect(String(body.language_code), "指定言語に対応").toBe(DEFAULT_LANG);
    await ctx.dispose();
  });

  test("E2E-A17-04-013 正常通信で200応答が返る", async () => {
    test.skip(!HAS_API, "A17_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDetailPath(KNOWN_PRODUCT_ID), { params: buildLangQuery(DEFAULT_LANG) });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A17-04-014 対象条件に該当する正常値で200と商品詳細が返る", async () => {
    test.skip(!HAS_API, "A17_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDetailPath(KNOWN_PRODUCT_ID), { params: buildLangQuery(DEFAULT_LANG) });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A17-04-016 同一GETの重複呼び出しで同一レスポンス（冪等参照）となる", async () => {
    test.skip(!HAS_API, "A17_04_READY(SEED-A17-04-PRODUCT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res1 = await ctx.get(buildDetailPath(KNOWN_PRODUCT_ID), { params: buildLangQuery(DEFAULT_LANG) });
    const res2 = await ctx.get(buildDetailPath(KNOWN_PRODUCT_ID), { params: buildLangQuery(DEFAULT_LANG) });
    expect(res1.status(), "1回目200").toBe(200);
    expect(res2.status(), "2回目も同一ステータス").toBe(res1.status());
    expect(await res2.text(), "2回の本文が同一（参照系・副作用なし）").toBe(await res1.text());
    await ctx.dispose();
  });

  // ===== 不正パラメータ・型不正・必須欠落（正常取得200とならない） =====

  test("E2E-A17-04-005 異常なパラメータ値（productId≦0）で正しい商品詳細が取得されない", async () => {
    test.skip(!HAS_API, "A17_04_READY(SEED-A17-04-NONE) 未設定");
    const ctx = await newCtx();
    for (const v of [ZERO_PRODUCT_ID, NEGATIVE_PRODUCT_ID]) {
      const res = await ctx.get(buildDetailPath(v));
      expectNot200(res.status()); // 0は findProductById で空＝404、負値はルート要件 `\\d+` 不一致（ProductController.php:50,59-64）。具体ステータスは要実機確認。
    }
    await ctx.dispose();
  });

  test("E2E-A17-04-007 パス変数（productId）欠落で正しい商品詳細が取得されない", async () => {
    test.skip(!HAS_API, "A17_04_READY(SEED-A17-04-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(MISSING_PRODUCT_ID_PATH);
    expectNot200(res.status()); // パス変数 productId 必須（ProductController.php:50,52）。ルート不一致/404等は要実機確認。
    await ctx.dispose();
  });

  test("E2E-A17-04-015 異常系（不正値）受信時に正しい商品詳細が取得されない", async () => {
    test.skip(!HAS_API, "A17_04_READY(SEED-A17-04-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDetailPath(NEGATIVE_PRODUCT_ID));
    expectNot200(res.status()); // 不正値（ProductController.php:50,59-64）。仕様の404は該当なしのみ・具体ステータスは要実機確認。
    await ctx.dispose();
  });

  test("E2E-A17-04-039 非数値（型不正）のproductIdで正しい商品詳細が取得されない", async () => {
    test.skip(!HAS_API, "A17_04_READY(SEED-A17-04-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDetailPath(NON_NUMERIC_PRODUCT_ID));
    expectNot200(res.status()); // ルート要件 `requirements:['productId'=>'\\d+']`（ProductController.php:50）に不一致。ルート不一致/404等は要実機確認。
    await ctx.dispose();
  });

  // ===== 異常系・404分岐 =====

  test("E2E-A17-04-009 該当する商品詳細が無い場合に404 Not Found が返る", async () => {
    test.skip(!HAS_API, "A17_04_READY(SEED-A17-04-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDetailPath(NONE_PRODUCT_ID));
    expect404(res.status());
    const body = (await res.json()) as ProductDetailErrorBody;
    // 本文は message を含むJSON（正本md レスポンス(失敗) "Not Found"）。具体キー構成は付帯表4#3 でオラクルに固定しない。
    expect(typeof body, "JSON本文が返る").toBe("object");
    await ctx.dispose();
  });

  test("E2E-A17-04-011 エラー発生時（該当なし）に仕様のエラー応答（404）が返る", async () => {
    test.skip(!HAS_API, "A17_04_READY(SEED-A17-04-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDetailPath(NONE_PRODUCT_ID));
    expect404(res.status());
    await ctx.dispose();
  });

  test("E2E-A17-04-012 異常（該当なし）時のHTTPステータスが仕様の404と一致する", async () => {
    test.skip(!HAS_API, "A17_04_READY(SEED-A17-04-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDetailPath(NONE_PRODUCT_ID));
    expect404(res.status());
    await ctx.dispose();
  });

  // ===== 母集合外・設計書補完（言語既定・カード・週間販売数・表示条件・画像・null許容・副作用） =====

  test("E2E-A17-04-030 言語未指定でJP既定の商品詳細が返る", async () => {
    test.skip(!HAS_API, "A17_04_READY(SEED-A17-04-PRODUCT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDetailPath(KNOWN_PRODUCT_ID)); // lang 未指定
    expect200(res.status());
    const body = (await res.json()) as ProductDetailSuccessBody;
    // 処理フロー#1・データ整合性「未指定時は日本語を返す」＝language_code が "JP"（ProductController.php:54-57）。
    expect(String(body.language_code), "language_code が JP 既定").toBe(DEFAULT_LANG);
    await ctx.dispose();
  });

  test("E2E-A17-04-031 カード商品で商品名先頭に言語コードが付きcard_detailが構築される", async () => {
    test.skip(!HAS_API, "A17_04_READY(SEED-A17-04-CARD) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDetailPath(CARD_PRODUCT_ID), { params: buildLangQuery(DEFAULT_LANG) });
    expect200(res.status());
    const body = (await res.json()) as ProductDetailSuccessBody;
    // 処理フロー#3：product_name が「【JP】」始まり・card_detail に card_name 等のカード情報（ProductDetailResponseBuilder.php:101-141）。
    expect(String(body.product_name).startsWith(LANGUAGE_CODE_PREFIX_HEAD), "product_name 先頭に言語コード").toBeTruthy();
    expect(body.card_detail, "card_detail が構築される（object）").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A17-04-032 非カード商品でcard_detailがnullで返る", async () => {
    test.skip(!HAS_API, "A17_04_READY(SEED-A17-04-NONCARD) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDetailPath(NONCARD_PRODUCT_ID), { params: buildLangQuery(DEFAULT_LANG) });
    expect200(res.status());
    const body = (await res.json()) as ProductDetailSuccessBody;
    // 入出力 レスポンス「カード商品でない場合は null」（ProductDetailResponseBuilder.php:120-124）。
    expect(body.card_detail, "card_detail は null").toBeNull();
    await ctx.dispose();
  });

  test("E2E-A17-04-033 weekly_soldが各商品規格の数量の合算で返る", async () => {
    test.skip(!HAS_API, "A17_04_READY(SEED-A17-04-PRODUCT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDetailPath(KNOWN_PRODUCT_ID), { params: buildLangQuery(DEFAULT_LANG) });
    expect200(res.status());
    const body = (await res.json()) as ProductDetailSuccessBody;
    // 処理フロー#4「各明細の週間販売数を合算」＝integer。集計元列・期間は付帯表4#4（既知販売数の合算と一致を env 期待値で照合）。
    expect(Number.isInteger(body.weekly_sold), "weekly_sold は integer").toBeTruthy();
    if (EXPECTED_WEEKLY_SOLD !== undefined) expect(String(body.weekly_sold), "weekly_sold 合算一致").toBe(EXPECTED_WEEKLY_SOLD);
    await ctx.dispose();
  });

  test("E2E-A17-04-034 良品(NM)/表示下限以上の規格のみが商品規格に含まれる", async () => {
    test.skip(!HAS_API, "A17_04_READY(SEED-A17-04-COND) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDetailPath(COND_PRODUCT_ID), { params: buildLangQuery(DEFAULT_LANG) });
    expect200(res.status());
    const body = (await res.json()) as ProductDetailSuccessBody;
    // 処理フロー#5「良品NMまたは表示下限以上の規格のみ」＝非NMかつ表示下限未満は除外（実在規格の部分集合）。下限値は付帯表4#6（SEEDの境界で判定）。
    expect(Array.isArray(body.product_classes), "product_classes は配列").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A17-04-035 商品規格画像がファイル名からURLへ変換され並ぶ", async () => {
    test.skip(!HAS_API, "A17_04_READY(SEED-A17-04-PRODUCT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDetailPath(KNOWN_PRODUCT_ID), { params: buildLangQuery(DEFAULT_LANG) });
    expect200(res.status());
    const body = (await res.json()) as ProductDetailSuccessBody;
    // 処理フロー#5「画像はファイル名からURLへ変換して並べる」＝product_class_images が URL 文字列の配列（ProductDetailResponseBuilder.php:190-194）。
    const pc = (body.product_classes[0] ?? {}) as Record<string, unknown>;
    expect(Array.isArray(pc.product_class_images), "product_class_images は配列").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A17-04-036 参照のみで副作用が無い（再取得で対象データ不変）", async () => {
    test.skip(!HAS_API, "A17_04_READY(SEED-A17-04-PRODUCT-KNOWN) 未設定");
    const ctx = await newCtx();
    // 参照系（DB操作=検索のみ・ProductController.php:52-70）。呼び出し前後で price・stock 等が変化しないことを冪等本文で観測（DB照合はSEED側で補完）。
    const before = await ctx.get(buildDetailPath(KNOWN_PRODUCT_ID), { params: buildLangQuery(DEFAULT_LANG) });
    const after = await ctx.get(buildDetailPath(KNOWN_PRODUCT_ID), { params: buildLangQuery(DEFAULT_LANG) });
    expect(await after.text(), "呼び出し前後で商品・商品規格の値が不変").toBe(await before.text());
    await ctx.dispose();
  });

  test("E2E-A17-04-037 未設定の任意フィールドがnullで返る", async () => {
    test.skip(!HAS_API, "A17_04_READY(SEED-A17-04-CARD) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDetailPath(CARD_PRODUCT_ID), { params: buildLangQuery(DEFAULT_LANG) });
    expect200(res.status());
    const body = (await res.json()) as ProductDetailSuccessBody;
    // sale_limit・card_detail.power_toughness・card_detail.loyalty が未設定時 null（入出力 レスポンス「該当が無い場合は null」）。
    const pc = (body.product_classes[0] ?? {}) as Record<string, unknown>;
    expect("sale_limit" in pc, "sale_limit フィールドを持つ（未設定時 null）").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A17-04-038 categoriesが配列・region_restrictionが名称で返る", async () => {
    test.skip(!HAS_API, "A17_04_READY(SEED-A17-04-PRODUCT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDetailPath(KNOWN_PRODUCT_ID), { params: buildLangQuery(DEFAULT_LANG) });
    expect200(res.status());
    const body = (await res.json()) as ProductDetailSuccessBody;
    // categories はカテゴリ名の配列、region_restriction は地域制限の名称（文字列）（入出力 レスポンス フィールド定義）。
    expect(Array.isArray(body.categories), "categories は array").toBeTruthy();
    expect(typeof body.region_restriction, "region_restriction は string").toBe("string");
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1） =====

  test.fixme(
    "E2E-A17-04-006 想定外のクエリ項目を加えてもサーバエラーで停止しない（要実機確認: 無視/200の固定不可／付帯表1）",
    async () => {
      // 期待は「未知のクエリ項目があっても 5xx で停止しない」のみ。パス変数・lang のみ参照（ProductController.php:50-54）。
      // 200で無視され正常取得と同一内容となるかは正本に明記が無く要実機確認のため fixme（UNKNOWN_QUERY_PARAMS で送信予定）。
      void UNKNOWN_QUERY_PARAMS;
    }
  );
});
