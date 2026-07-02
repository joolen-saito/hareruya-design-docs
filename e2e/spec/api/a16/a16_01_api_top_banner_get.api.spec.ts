/**
 * a16-01 トップバナー取得（GET参照系JSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a16_01_api_top_banner_get_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装し、要実機確認修飾（005 認可方式未確定の正常呼び出し／014 想定外クエリの無視可否）は test.fixme（理由付き）で残す。
 * 手動（008 異常資格情報・認可方式未確定／030 タイムアウト実再現／031 DB障害実再現）はケース表で全量管理し本specには書かない（規約）。
 * 本APIはブラウザ向け画面を持たない（正本md）ためUI専用specは無い＝全てAPI/統合レイヤで観測する。
 *
 * 期待結果は仕様（正本md a16-01・観点表）由来（オラクル独立性）。
 *  - 送信先は実装の実効パス `GET /topBanner/{topBannerId}`（ContentController.php:48／routes.yaml:5-7）。設計のパス変数 id との差異は付帯表4#1。
 *  - 合否は HTTPステータス・レスポンス本文（構造・型・既知値）で判定する。
 *  - 応答プロパティは仕様の camelCase（imageUrl/dispType/nameJp/nameEn）を期待し、実装 snake_case（付帯表4#2）はオラクルに寄せない。
 *  - 404本文は仕様 {code, message}（"Not Found"）を期待し、実装 {code, errors}（付帯表4#3）はオラクルに寄せない。
 *  - 不正パラメータ（欠落・0以下・非数値・不正値）時は「正常取得200とならない」のみ判定し、実装の404はオラクル化しない（付帯表4#5）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A16_01_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildTopBannerPath,
  TOP_BANNER_MISSING_ID_PATH,
  UNKNOWN_QUERY_PARAMS,
  KNOWN_BANNER_ID,
  NONE_BANNER_ID,
  ZERO_OR_NEGATIVE_ID,
  NON_NUMERIC_ID,
  INVALID_ID,
  EXPECTED_IMAGE_URL,
  EXPECTED_LINK,
  EXPECTED_DISP_TYPE,
  NOT_FOUND_MESSAGE,
  TopBannerGetSuccessBody,
  TopBannerErrorBody,
} from "../../../pages/api/a16/a16_01_api_top_banner_get.api";

const HAS_API = !!process.env.A16_01_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常取得＝200（正本md 入出力 レスポンス(成功)）").toBe(200);
}
function expect404(status: number) {
  expect(status, "該当なし＝404（正本md 入出力 レスポンス(失敗)）").toBe(404);
}
function expectNot200(status: number) {
  // 不正パラメータ時の具体ステータスは正典未定義（実装は404だがオラクル化しない＝付帯表4#5）。
  expect(status, "正しいトップバナーが取得されない＝正常取得200とならない（付帯表4#5）").not.toBe(200);
}

test.describe("API > トップバナー取得(GET参照系)", { tag: ["@api", "@a16"] }, () => {
  // ===== 正常取得（200・JSON・指定ID一致・値非再計算） =====

  test("E2E-A16-01-001 正常なトップバナーIDの指定で200とトップバナー情報JSONが返る", async () => {
    test.skip(!HAS_API, "A16_01_READY(SEED-A16-01-BANNER-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    expect200(res.status());
    const body = (await res.json()) as TopBannerGetSuccessBody;
    expect(body, "トップバナー情報オブジェクトが返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A16-01-002 正常取得時に取得時点の値が再計算されず返る", async () => {
    test.skip(!HAS_API, "A16_01_READY(SEED-A16-01-BANNER-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 業務ルール「計算処理を行わない／取得時点の値を返す」。imageUrl・link・dispType が SEED既知値とそのまま一致。
    // 値照合は env 期待値で行う（未設定なら要実機確認）。命名は仕様 camelCase（実装 snake_case は付帯表4#2）。
    if (EXPECTED_IMAGE_URL !== undefined) expect(String(body.imageUrl), "imageUrl 一致").toBe(EXPECTED_IMAGE_URL);
    if (EXPECTED_LINK !== undefined) expect(String(body.link), "link 一致").toBe(EXPECTED_LINK);
    if (EXPECTED_DISP_TYPE !== undefined) expect(String(body.dispType), "dispType 一致").toBe(EXPECTED_DISP_TYPE);
    await ctx.dispose();
  });

  test("E2E-A16-01-003 正常取得時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A16_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A16-01-004 指定トップバナーIDに対応するトップバナーを取得する", async () => {
    test.skip(!HAS_API, "A16_01_READY(SEED-A16-01-BANNER-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 処理フロー#2「当該IDのトップバナーを取得」。レスポンスの id が指定IDと一致する。
    expect(String(body.id), "レスポンス id が指定IDと一致").toBe(String(KNOWN_BANNER_ID));
    await ctx.dispose();
  });

  // ===== レスポンス構造・型契約（camelCase＝仕様。実装 snake_case は付帯表4#2でオラクルにしない） =====

  test("E2E-A16-01-006 成功レスポンスが仕様のフィールド構成・型契約（camelCase）と一致する", async () => {
    test.skip(!HAS_API, "A16_01_READY(SEED-A16-01-BANNER-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 仕様: id・dispType・languages[].id は integer、imageUrl・link・languages[].nameJp/nameEn/code は string、languages は array。
    // プロパティは camelCase（正本md「プロパティはcamelCase」）。実装の snake_case を返せば命名乖離として落ちて検出する（付帯表4#2）。
    expect(Number.isInteger(body.id), "id は integer").toBeTruthy();
    expect(typeof body.imageUrl, "imageUrl は string").toBe("string");
    expect(typeof body.link, "link は string").toBe("string");
    expect(Number.isInteger(body.dispType), "dispType は integer").toBeTruthy();
    expect(Array.isArray(body.languages), "languages は array").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A16-01-040 成功レスポンスの languages が言語オブジェクトの配列で返る", async () => {
    test.skip(!HAS_API, "A16_01_READY(SEED-A16-01-BANNER-KNOWN 言語1件以上) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    expect200(res.status());
    const body = (await res.json()) as TopBannerGetSuccessBody;
    // languages は配列、各要素が id(integer)・nameJp(string)・nameEn(string)・code(string)（仕様 camelCase）。
    expect(Array.isArray(body.languages), "languages は配列").toBeTruthy();
    expect(body.languages.length, "言語要素が1件以上").toBeGreaterThanOrEqual(1);
    for (const lang of body.languages as Record<string, unknown>[]) {
      expect(Number.isInteger(lang.id), "languages[].id は integer").toBeTruthy();
      expect(typeof lang.nameJp, "languages[].nameJp は string").toBe("string");
      expect(typeof lang.nameEn, "languages[].nameEn は string").toBe("string");
      expect(typeof lang.code, "languages[].code は string").toBe("string");
    }
    await ctx.dispose();
  });

  // ===== 受信検証（指定IDのみ・無関係混在なし） =====

  test("E2E-A16-01-013 指定トップバナーIDに紐づくトップバナーのみが返る", async () => {
    test.skip(!HAS_API, "A16_01_READY(SEED-A16-01-BANNER-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 処理フロー#2／データ整合性。返却 id が指定IDと一致し、無関係なトップバナーが混在しない（単一オブジェクト応答）。
    expect(String(body.id), "返却 id が指定IDと一致").toBe(String(KNOWN_BANNER_ID));
    await ctx.dispose();
  });

  // ===== 通信・正常系（HTTPステータス・正常値） =====

  test("E2E-A16-01-017 正常通信で200応答が返る", async () => {
    test.skip(!HAS_API, "A16_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A16-01-018 対象条件に該当する正常値で200とトップバナー情報が返る", async () => {
    test.skip(!HAS_API, "A16_01_READY(SEED-A16-01-BANNER-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    expect200(res.status());
    const body = (await res.json()) as TopBannerGetSuccessBody;
    expect(body, "トップバナー情報が返る").toBeTruthy();
    await ctx.dispose();
  });

  // ===== 冪等参照・副作用なし =====

  test("E2E-A16-01-020 同一GETの重複呼び出しで同一レスポンス（冪等参照）となる", async () => {
    test.skip(!HAS_API, "A16_01_READY(SEED-A16-01-BANNER-KNOWN) 未設定");
    const ctx = await newCtx();
    const res1 = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    const res2 = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    // 参照系のため2回の呼び出しで同一のHTTPステータス・レスポンス本文が返る（副作用なし）。
    expect(res1.status(), "1回目=2回目のステータス").toBe(res2.status());
    expect(await res1.text(), "1回目=2回目の本文").toBe(await res2.text());
    await ctx.dispose();
  });

  test("E2E-A16-01-042 参照のみで副作用が無い（再取得で対象データ不変）", async () => {
    test.skip(!HAS_API, "A16_01_READY(SEED-A16-01-BANNER-KNOWN) 未設定");
    const ctx = await newCtx();
    // 副作用「無し（参照のみ）」。API呼び出し前後で対象トップバナーの値が変化しない＝参照系のため同一本文が返る。
    const before = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    const after = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    expect(await before.text(), "呼び出し前後で本文不変").toBe(await after.text());
    await ctx.dispose();
  });

  // ===== 異常系・該当なし404（仕様で固定される404は該当なし時のみ） =====

  test("E2E-A16-01-010 該当するトップバナーが無い場合に404が返る", async () => {
    test.skip(!HAS_API, "A16_01_READY(SEED-A16-01-BANNER-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(NONE_BANNER_ID));
    expect404(res.status());
    const body = (await res.json()) as TopBannerErrorBody;
    // 仕様の失敗応答 {code, message}（"Not Found"）。実装本文形 {code, errors} が違えば落ちて検出する（付帯表4#3）。
    expect(typeof body.code, "code を持つ").toBe("number");
    expect(body.message, "message=Not Found").toBe(NOT_FOUND_MESSAGE);
    await ctx.dispose();
  });

  test("E2E-A16-01-015 エラー発生時に仕様のエラー応答（404）が返る", async () => {
    test.skip(!HAS_API, "A16_01_READY(SEED-A16-01-BANNER-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(NONE_BANNER_ID));
    expect404(res.status()); // 該当トップバナーなし→コード404のJSON（エラー処理）。
    await ctx.dispose();
  });

  test("E2E-A16-01-016 異常（該当なし）時のHTTPステータスが仕様の404と一致する", async () => {
    test.skip(!HAS_API, "A16_01_READY(SEED-A16-01-BANNER-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(NONE_BANNER_ID));
    expect404(res.status());
    await ctx.dispose();
  });

  // ===== 不正パラメータ（正常取得200とならない＝具体ステータスは付帯表4#5でオラクル化しない） =====

  test("E2E-A16-01-007 パス変数（topBannerId）欠落で正しいトップバナーが取得されない", async () => {
    test.skip(!HAS_API, "A16_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(TOP_BANNER_MISSING_ID_PATH);
    expectNot200(res.status()); // 必須パス変数欠落＝正常取得200とならない（ルート不一致/404等の具体ステータスは要実機確認）。
    await ctx.dispose();
  });

  test("E2E-A16-01-011 異常なパラメータ値（id≦0）で正しいトップバナーが取得されない", async () => {
    test.skip(!HAS_API, "A16_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(ZERO_OR_NEGATIVE_ID));
    expectNot200(res.status()); // 0以下のID＝正常取得200とならない（実装は404だがオラクル化しない＝付帯表4#5）。
    await ctx.dispose();
  });

  test("E2E-A16-01-012 非数値（型不正）のトップバナーIDで正しいトップバナーが取得されない", async () => {
    test.skip(!HAS_API, "A16_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(NON_NUMERIC_ID));
    expectNot200(res.status()); // 非数値は `^\d+$` 不一致＝正常取得200とならない（具体ステータスは要実機確認＝付帯表4#5）。
    await ctx.dispose();
  });

  test("E2E-A16-01-019 異常系（不正値）受信時に正しいトップバナーが取得されない", async () => {
    test.skip(!HAS_API, "A16_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(INVALID_ID));
    expectNot200(res.status()); // 不正値＝正常取得200とならない（具体ステータスは要実機確認＝付帯表4#5）。
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1/付帯表4） =====

  test.fixme(
    "E2E-A16-01-005 認証済クライアントからの呼び出しで応答が処理結果と一致する（要実機確認: 認可方式未確定／付帯表1・付帯表4#4）",
    async () => {
      // 期待は権限・認可「クライアントから呼び出す・pf-api方針」由来＝正常呼び出しで200・処理結果一致。
      // 当メソッドに認可属性が無く（ContentController.php:49）認可方式（公開/IP制限/認証）が設計書から確定できないため fixme。
      // 実機で認可方式が確定したら、正常資格情報での 200・レスポンス本文一致を検証する。
    }
  );

  test.fixme(
    "E2E-A16-01-014 想定外のクエリ項目を加えてもサーバエラーで停止しない（要実機確認: 無視可否未確定／付帯表1）",
    async () => {
      // 期待は入出力 リクエスト「想定外項目」由来。未知クエリで 5xx 停止しないことのみが判定対象。
      // 200で無視され正常取得と同一内容になるかは正本に明記が無く要実機確認のため fixme（UNKNOWN_QUERY_PARAMS を付与して送信する）。
      void UNKNOWN_QUERY_PARAMS;
    }
  );
});
