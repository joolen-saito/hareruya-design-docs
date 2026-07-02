/**
 * a08-01 API_トップバナー取得（GET参照系JSON API・topBannerId 単一取得）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a08_01_api_top_banner_get_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装し、要実機確認修飾(006 想定外クエリの扱い)は test.fixme（理由付き）で残す。
 * 手動（011 認可方式未特定・018 タイムアウト実再現・031 DB障害実再現）はケース表で全量管理し本specには書かない（規約）。
 * 本APIはブラウザ向け画面を持たない（正本md）ためUI専用specは無い＝全てAPI/統合レイヤで観測する。
 *
 * 期待結果は仕様（正本md a08-01・観点表・基本設計）由来（オラクル独立性）。
 *  - 送信先は実装の実効パス `GET /topBanner/{topBannerId}`（ContentController.php:48・routes.yaml:5-7）。設計のパス変数名 `{id}` とは乖離（付帯表4#1）。
 *  - 合否は HTTPステータス・レスポンス本文（構造・型・既知値）で判定する。
 *  - 成功フィールド名は仕様の camelCase（id・imageUrl・link・dispType・languages[].{id,nameJp,nameEn,code}）を契約とする。
 *    実装の snake_case（付帯表4#4）／失敗本文 message⇔errors（付帯表4#3）は実装の現挙動をオラクルへ固定しない＝乖離があれば落ちて検出する。
 *  - 不正パラメータ（0以下・非数値・必須欠落）時の具体ステータスは仕様未定義。仕様で固定の404は該当なし時のみ（付帯表4#5）。
 *    よって不正系は「正常取得200とならない」（!=200）で判定し404固定にしない。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A08_01_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildTopBannerPath,
  buildUnknownQuery,
  buildNoAuthHeaders,
  MISSING_PATH_VAR_PATH,
  KNOWN_BANNER_ID,
  NONE_BANNER_ID,
  LANG_RICH_BANNER_ID,
  INVALID_ID_ZERO,
  INVALID_ID_NEGATIVE,
  NON_NUMERIC_ID,
  EXPECTED_BANNER_ID,
  EXPECTED_IMAGE_URL,
  EXPECTED_LINK,
  EXPECTED_DISP_TYPE,
  NOT_FOUND_MESSAGE,
  TopBannerSuccessBody,
  TopBannerErrorBody,
} from "../../../pages/api/a08/a08_01_api_top_banner_get.api";

const HAS_API = !!process.env.A08_01_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常取得＝200（正本md レスポンス(成功)）").toBe(200);
}
function expect404(status: number) {
  expect(status, "該当なし＝404 Not Found（正本md レスポンス(失敗)・処理フロー#3）").toBe(404);
}
function expectNot200(status: number) {
  // 不正パラメータ（0以下・非数値・必須欠落）時の具体ステータスは仕様未定義（付帯表4#5）。
  // 仕様の確約は「正常取得200とならない」ことのみ＝404固定にしない（実装の現挙動を期待値へ流用しない）。
  expect(status, "正常取得200とならない（具体ステータスは要実機確認）").not.toBe(200);
}

test.describe("API > トップバナー取得(GET参照系・単一)", { tag: ["@api", "@a08"] }, () => {
  // ===== 正常取得（HTTPステータス・取得値・指定ID絞り込み） =====

  test("E2E-A08-01-001 正常なトップバナーIDの指定で200とトップバナー情報JSONが返る", async () => {
    test.skip(!HAS_API, "A08_01_READY(SEED-A08-01-BANNER-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    expect200(res.status());
    const body = (await res.json()) as TopBannerSuccessBody;
    expect(body, "トップバナー情報がJSONで返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A08-01-002 正常取得時に取得時点の値が再計算されず返る", async () => {
    test.skip(!HAS_API, "A08_01_READY(SEED-A08-01-BANNER-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 画像URL・リンク・表示タイプ等が再計算/丸めされず取得時点の値がそのまま返る（業務ルール）。値照合は env 期待値で行う（未設定なら要実機確認）。
    if (EXPECTED_IMAGE_URL !== undefined) expect(String(body.imageUrl), "imageUrl が取得時点の値").toBe(EXPECTED_IMAGE_URL);
    if (EXPECTED_LINK !== undefined) expect(String(body.link), "link が取得時点の値").toBe(EXPECTED_LINK);
    if (EXPECTED_DISP_TYPE !== undefined) expect(String(body.dispType), "dispType が取得時点の値").toBe(EXPECTED_DISP_TYPE);
    await ctx.dispose();
  });

  test("E2E-A08-01-003 正常取得時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A08_01_READY(SEED-A08-01-BANNER-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A08-01-004 指定したトップバナーIDのトップバナー情報を取得する", async () => {
    test.skip(!HAS_API, "A08_01_READY(SEED-A08-01-BANNER-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 返却 id が指定IDと一致（処理フロー#2 当該IDのトップバナーを取得）。id は camelCase 契約（付帯表4#4）。
    expect(String(body.id), "id が指定トップバナーIDと一致").toBe(EXPECTED_BANNER_ID);
    await ctx.dispose();
  });

  // ===== レスポンス構造・型契約（camelCase 契約＝付帯表4#4。実装 snake_case はオラクルに寄せない） =====

  test("E2E-A08-01-008 成功レスポンスが仕様のフィールド構成・型契約・camelCaseと一致する", async () => {
    test.skip(!HAS_API, "A08_01_READY(SEED-A08-01-BANNER-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    expect200(res.status());
    const body = (await res.json()) as TopBannerSuccessBody;
    // 仕様の成功フィールド（camelCase）＝ id/dispType/languages[].id:integer・imageUrl/link/languages[].{nameJp,nameEn,code}:string・languages:array。
    // 実装は snake_case（image_url 等・付帯表4#4）で返すため本アサートが落ちれば命名casing乖離として検出する（期待値を snake_case へ寄せない）。
    expect(Number.isInteger(body.id), "id は integer").toBeTruthy();
    expect(typeof body.imageUrl, "imageUrl は string").toBe("string");
    expect(typeof body.link, "link は string").toBe("string");
    expect(Number.isInteger(body.dispType), "dispType は integer").toBeTruthy();
    expect(Array.isArray(body.languages), "languages は array").toBeTruthy();
    for (const lang of body.languages) {
      expect(Number.isInteger(lang.id), "languages[].id は integer").toBeTruthy();
      expect(typeof lang.nameJp, "languages[].nameJp は string").toBe("string");
      expect(typeof lang.nameEn, "languages[].nameEn は string").toBe("string");
      expect(typeof lang.code, "languages[].code は string").toBe("string");
    }
    await ctx.dispose();
  });

  test("E2E-A08-01-009 指定したトップバナーIDのトップバナー情報のみが返る", async () => {
    test.skip(!HAS_API, "A08_01_READY(SEED-A08-01-BANNER-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 返却 id が指定IDと一致し、指定IDのレコードの情報のみが返る（処理フロー#2・受信検証）。
    expect(String(body.id), "id が指定IDと一致＝指定IDのレコードのみ").toBe(EXPECTED_BANNER_ID);
    await ctx.dispose();
  });

  test("E2E-A08-01-040 成功レスポンスの関連言語が languages 配列で各言語オブジェクトを持つ", async () => {
    test.skip(!HAS_API, "A08_01_READY(SEED-A08-01-BANNER-KNOWN 関連言語あり) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(LANG_RICH_BANNER_ID));
    expect200(res.status());
    const body = (await res.json()) as TopBannerSuccessBody;
    // languages が配列で各要素が id/nameJp/nameEn/code を持つ（入出力 レスポンス(成功) languages 配列定義）。
    expect(Array.isArray(body.languages), "languages は配列").toBeTruthy();
    expect(body.languages.length, "関連言語が1件以上").toBeGreaterThanOrEqual(1);
    for (const lang of body.languages) {
      expect("id" in lang && "nameJp" in lang && "nameEn" in lang && "code" in lang, "言語オブジェクトが id/nameJp/nameEn/code を持つ").toBeTruthy();
    }
    await ctx.dispose();
  });

  // ===== 異常系・404分岐（該当なし） =====

  test("E2E-A08-01-010 該当するトップバナーが無い場合に404が返る", async () => {
    test.skip(!HAS_API, "A08_01_READY(SEED-A08-01-BANNER-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(NONE_BANNER_ID));
    expect404(res.status()); // 未登録ID→find が null→404（ContentController.php:60-64）。
    const body = (await res.json()) as TopBannerErrorBody;
    // 失敗本文は仕様 `{code, message}`（message="Not Found"）。実装は `{code, errors}`（付帯表4#3）で乖離＝落ちて検出。
    expect(typeof body.code, "code を持つ").toBe("number");
    expect(body.message, "message=Not Found（仕様契約・実装は errors で乖離＝付帯表4#3）").toBe(NOT_FOUND_MESSAGE);
    await ctx.dispose();
  });

  test("E2E-A08-01-012 該当トップバナーなしのエラーで404が返る", async () => {
    test.skip(!HAS_API, "A08_01_READY(SEED-A08-01-BANNER-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(NONE_BANNER_ID));
    expect404(res.status());
    const body = (await res.json()) as TopBannerErrorBody;
    expect(typeof body.code, "code を含むJSON").toBe("number"); // メッセージを含むJSON（エラー処理）。
    await ctx.dispose();
  });

  test("E2E-A08-01-013 異常（該当なし）時のHTTPステータスが仕様の404と一致する", async () => {
    test.skip(!HAS_API, "A08_01_READY(SEED-A08-01-BANNER-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(NONE_BANNER_ID));
    expect404(res.status());
    await ctx.dispose();
  });

  // ===== 通信・正常値・冪等参照 =====

  test("E2E-A08-01-014 正常通信で200応答が返る", async () => {
    test.skip(!HAS_API, "A08_01_READY(SEED-A08-01-BANNER-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    expect200(res.status()); // 通信成立＝200。
    await ctx.dispose();
  });

  test("E2E-A08-01-015 対象条件に該当する正常値で200とトップバナー情報が返る", async () => {
    test.skip(!HAS_API, "A08_01_READY(SEED-A08-01-BANNER-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const body = (await res.json()) as TopBannerSuccessBody;
    expect(body, "トップバナー情報が返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A08-01-017 同一GETの重複呼び出しで同一レスポンス（冪等参照）となる", async () => {
    test.skip(!HAS_API, "A08_01_READY(SEED-A08-01-BANNER-KNOWN) 未設定");
    const ctx = await newCtx();
    const res1 = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    const res2 = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    // 参照系＝2回の呼び出しで同一のHTTPステータス・レスポンス本文（副作用なし／DB更新なし）。
    expect(res1.status(), "2回のHTTPステータスが一致").toBe(res2.status());
    const body1 = await res1.text();
    const body2 = await res2.text();
    expect(body1, "2回のレスポンス本文が一致（冪等参照）").toBe(body2);
    await ctx.dispose();
  });

  test("E2E-A08-01-041 参照のみで副作用が無い（再取得で対象データ不変）", async () => {
    test.skip(!HAS_API, "A08_01_READY(SEED-A08-01-BANNER-KNOWN) 未設定");
    const ctx = await newCtx();
    // API呼び出し前後で対象トップバナーの値が変化しない（副作用「無し（参照のみ）」）。
    // DB直接観測は本ランナーでは行わず、参照系の不変性をAPI再取得の同一性で代理判定する。
    const before = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    const after = await ctx.get(buildTopBannerPath(KNOWN_BANNER_ID));
    expect200(before.status());
    expect200(after.status());
    expect(await before.text(), "呼び出し前後で対象データが不変").toBe(await after.text());
    await ctx.dispose();
  });

  // ===== 不正パラメータ（正常取得200とならない・404固定にしない＝付帯表4#5） =====

  test("E2E-A08-01-005 異常なパラメータ値（topBannerId≦0）で正しいトップバナー情報が取得されない", async () => {
    test.skip(!HAS_API, "A08_01_READY 未設定");
    const ctx = await newCtx();
    const res0 = await ctx.get(buildTopBannerPath(INVALID_ID_ZERO));
    const resNeg = await ctx.get(buildTopBannerPath(INVALID_ID_NEGATIVE));
    // 0以下のIDでは正常取得200とならない（id は integer・必須。具体ステータスは要実機確認＝付帯表4#5）。
    expectNot200(res0.status());
    expectNot200(resNeg.status());
    await ctx.dispose();
  });

  test("E2E-A08-01-007 パス変数（topBannerId）欠落で正しいトップバナー情報が取得されない", async () => {
    test.skip(!HAS_API, "A08_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(MISSING_PATH_VAR_PATH);
    // 必須パス変数欠落では正常取得200とならない（欠落時の具体ステータス＝ルート不一致/404等は要実機確認）。
    expectNot200(res.status());
    await ctx.dispose();
  });

  test("E2E-A08-01-016 異常系（不正値）受信時に正しいトップバナー情報が取得されない", async () => {
    test.skip(!HAS_API, "A08_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(INVALID_ID_NEGATIVE));
    expectNot200(res.status()); // 不正値では正常取得200とならない（仕様で固定の404は該当なし時のみ）。
    await ctx.dispose();
  });

  test("E2E-A08-01-030 非数値（型不正）のトップバナーIDで正しいトップバナー情報が取得されない", async () => {
    test.skip(!HAS_API, "A08_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannerPath(NON_NUMERIC_ID));
    // topBannerId が整数でない場合は正常取得200とならない（id は型integer・必須。具体ステータス＝ルート不一致/404等は要実機確認＝付帯表4#5）。
    expectNot200(res.status());
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1） =====

  test.fixme(
    "E2E-A08-01-006 想定外のクエリ項目を加えてもサーバエラーで停止しない（要実機確認: 想定外クエリの扱い未定義／付帯表1）",
    async () => {
      // 期待は「未知のクエリ項目でも 5xx で停止しない」ことのみ（パス変数のみ参照＝ContentController.php）。
      // 200で無視され正常取得と同一内容となるかは正本に明記が無く要実機確認のため fixme。
      // 実装時は ctx.get(buildTopBannerPath(KNOWN_BANNER_ID), { params: buildUnknownQuery() }) で status < 500 を判定する。
      void buildUnknownQuery;
    }
  );
});
