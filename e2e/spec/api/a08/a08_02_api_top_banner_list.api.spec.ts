/**
 * a08-02 API_トップバナー一覧（GET参照系JSON API・languageCode で一覧取得）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a08_02_api_top_banner_list_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装し、要実機確認修飾(011 想定外クエリの扱い・019 並び順のソートキー)は test.fixme（理由付き）で残す。
 * 手動（005 認可方式未確定・018 タイムアウト実再現）はケース表で全量管理し本specには書かない（規約）。
 * 本APIはブラウザ向け画面を持たない（正本md）ためUI専用specは無い＝全てAPI/統合レイヤで観測する。
 *
 * 期待結果は仕様（正本md a08-02・観点表・基本設計）由来（オラクル独立性）。
 *  - 送信先は実装の実効パス `GET /topBanners/{languageCode}`（ContentController.php:87・routes.yaml:6-8）。設計と実効パスは一致（.json別名は付帯表4#6）。
 *  - 合否は HTTPステータス・レスポンス本文（配列構造・フィールド・型契約・絞り込み）で判定する。
 *  - 成功フィールド名は仕様の camelCase（id・imageUrl・link・dispType・languages[].{id,nameJp,nameEn,code}）を契約とする。
 *    実装の snake_case（付帯表4#2）／404本文 message⇔errors（付帯表4#1）は実装の現挙動をオラクルへ固定しない＝乖離があれば落ちて検出する。
 *  - 0件（言語あり・バナー空）は仕様で404と定義（付帯表4#4）。言語なし・バナー空の両分岐とも404（処理フロー#3 OR・付帯表4#3）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A08_02_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildTopBannersPath,
  buildUnknownQuery,
  buildNoAuthHeaders,
  MISSING_PATH_VAR_PATH,
  KNOWN_LANGUAGE_CODE,
  NONE_LANGUAGE_CODE,
  NOBANNER_LANGUAGE_CODE,
  EXPECTED_IMAGE_URL,
  EXPECTED_LINK,
  EXPECTED_DISP_TYPE,
  NOT_FOUND_MESSAGE,
  TopBannerListBody,
  TopBannerListItem,
  TopBannerListErrorBody,
} from "../../../pages/api/a08/a08_02_api_top_banner_list.api";

const HAS_API = !!process.env.A08_02_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常取得＝200（正本md レスポンス(成功)）").toBe(200);
}
function expect404(status: number) {
  expect(status, "言語なし／バナー空＝404（正本md 処理フロー#3・レスポンス(失敗)）").toBe(404);
}
function expectNot200(status: number) {
  // 必須パス変数欠落時の具体ステータスは仕様未定義（ルート不一致/404等は要実機確認）。
  expect(status, "正常取得200とならない（具体ステータスは要実機確認）").not.toBe(200);
}

test.describe("API > トップバナー一覧(GET参照系・一覧)", { tag: ["@api", "@a08"] }, () => {
  // ===== 正常取得（一覧・HTTPステータス・取得値・絞り込み） =====

  test("E2E-A08-02-001 正常な言語コードの指定で200と設定済みトップバナー一覧JSONが返る", async () => {
    test.skip(!HAS_API, "A08_02_READY(SEED-A08-02-LANG-BANNER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(KNOWN_LANGUAGE_CODE));
    expect200(res.status());
    const body = (await res.json()) as TopBannerListBody;
    expect(Array.isArray(body), "トップバナー一覧がJSON配列で返る").toBeTruthy();
    expect(body.length, "設定済みトップバナーが1件以上含まれる").toBeGreaterThanOrEqual(1);
    await ctx.dispose();
  });

  test("E2E-A08-02-002 正常取得時に取得時点の値が再計算されず返る", async () => {
    test.skip(!HAS_API, "A08_02_READY(SEED-A08-02-LANG-BANNER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(KNOWN_LANGUAGE_CODE));
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>[];
    const first = body[0] ?? {};
    // id・imageUrl・link・dispType が取得時点の値のまま返り、丸め/補正/再計算が行われない（業務ルール）。値照合は env 期待値で行う（未設定なら要実機確認）。
    if (EXPECTED_IMAGE_URL !== undefined) expect(String(first.imageUrl), "imageUrl が取得時点の値").toBe(EXPECTED_IMAGE_URL);
    if (EXPECTED_LINK !== undefined) expect(String(first.link), "link が取得時点の値").toBe(EXPECTED_LINK);
    if (EXPECTED_DISP_TYPE !== undefined) expect(String(first.dispType), "dispType が取得時点の値").toBe(EXPECTED_DISP_TYPE);
    await ctx.dispose();
  });

  test("E2E-A08-02-003 正常取得時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A08_02_READY(SEED-A08-02-LANG-BANNER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(KNOWN_LANGUAGE_CODE));
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A08-02-004 指定言語コードに紐づく設定済みトップバナーを取得する", async () => {
    test.skip(!HAS_API, "A08_02_READY(SEED-A08-02-LANG-BANNER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(KNOWN_LANGUAGE_CODE));
    expect200(res.status());
    const body = (await res.json()) as TopBannerListItem[];
    // 各バナーが指定言語コードに紐づく（処理フロー#2・集計条件）。当該言語と関連しないバナーが混在しない＝各要素の languages に指定 code を含む。
    for (const item of body) {
      const codes = (item.languages ?? []).map((l) => l.code);
      expect(codes.includes(KNOWN_LANGUAGE_CODE), "各バナーが指定言語コードに紐づく").toBeTruthy();
    }
    await ctx.dispose();
  });

  // ===== レスポンス構造・型契約（camelCase 契約＝付帯表4#2。実装 snake_case はオラクルに寄せない） =====

  test("E2E-A08-02-006 成功レスポンスが仕様のフィールド構成・型契約（camelCase）と一致する", async () => {
    test.skip(!HAS_API, "A08_02_READY(SEED-A08-02-LANG-BANNER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(KNOWN_LANGUAGE_CODE));
    expect200(res.status());
    const body = (await res.json()) as TopBannerListBody;
    expect(Array.isArray(body), "配列で返る").toBeTruthy();
    // 各要素は camelCase の id/dispType/languages[].id:integer・imageUrl/link/languages[].{nameJp,nameEn,code}:string・languages:array。
    // 実装は snake_case（付帯表4#2）で返すため本アサートが落ちれば命名乖離として検出する（期待値を snake_case へ寄せない）。
    for (const item of body) {
      expect(Number.isInteger(item.id), "id は integer").toBeTruthy();
      expect(typeof item.imageUrl, "imageUrl は string").toBe("string");
      expect(typeof item.link, "link は string").toBe("string");
      expect(Number.isInteger(item.dispType), "dispType は integer").toBeTruthy();
      expect(Array.isArray(item.languages), "languages は array").toBeTruthy();
      for (const lang of item.languages) {
        expect(Number.isInteger(lang.id), "languages[].id は integer").toBeTruthy();
        expect(typeof lang.nameJp, "languages[].nameJp は string").toBe("string");
        expect(typeof lang.nameEn, "languages[].nameEn は string").toBe("string");
        expect(typeof lang.code, "languages[].code は string").toBe("string");
      }
    }
    await ctx.dispose();
  });

  test("E2E-A08-02-009 指定言語コードに紐づくトップバナーのみが返る", async () => {
    test.skip(!HAS_API, "A08_02_READY(SEED-A08-02-LANG-BANNER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(KNOWN_LANGUAGE_CODE));
    expect200(res.status());
    const body = (await res.json()) as TopBannerListItem[];
    // 返却各要素が指定言語コードに紐づくものに限られ、当該言語と関連しないバナーが混在しない（処理フロー#2・集計条件・受信検証）。
    for (const item of body) {
      const codes = (item.languages ?? []).map((l) => l.code);
      expect(codes.includes(KNOWN_LANGUAGE_CODE), "指定言語コードに紐づくバナーのみ").toBeTruthy();
    }
    await ctx.dispose();
  });

  // ===== 異常系・404分岐（言語なし／バナー空。処理フロー#3 OR・付帯表4#3） =====

  test("E2E-A08-02-008 言語マスタに存在しない言語コードで404が返る", async () => {
    test.skip(!HAS_API, "A08_02_READY(SEED-A08-02-LANG-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(NONE_LANGUAGE_CODE));
    expect404(res.status()); // findOneBy(['code'=>...]) 空→404（ContentController.php:95-100）。
    const body = (await res.json()) as TopBannerListErrorBody;
    // 失敗本文は仕様 `{code, message}`（message="Language code is not found"）。実装は `{code, errors}`／'Not Found'（付帯表4#1）で乖離＝落ちて検出。
    expect(typeof body.code, "code を含むJSON").toBe("number");
    expect(body.message, "message=Language code is not found（仕様契約・実装は errors で乖離＝付帯表4#1）").toBe(NOT_FOUND_MESSAGE);
    await ctx.dispose();
  });

  test("E2E-A08-02-010 言語は存在するが設定済みバナーが0件の場合に404が返る", async () => {
    test.skip(!HAS_API, "A08_02_READY(SEED-A08-02-LANG-NOBANNER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(NOBANNER_LANGUAGE_CODE));
    // 本APIの0件表現は仕様で404と定義（付帯表4#4・getTopBanners 空時404＝ContentController.php:103-108）。0件→200空配列にはしない。
    expect404(res.status());
    const body = (await res.json()) as TopBannerListErrorBody;
    expect(typeof body.code, "code を含むJSON").toBe("number");
    await ctx.dispose();
  });

  test("E2E-A08-02-012 該当なし（言語コード不存在）時に仕様のエラー応答（404）が返る", async () => {
    test.skip(!HAS_API, "A08_02_READY(SEED-A08-02-LANG-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(NONE_LANGUAGE_CODE));
    expect404(res.status());
    const body = (await res.json()) as TopBannerListErrorBody;
    expect(typeof body.code, "code・message を含むJSON").toBe("number"); // エラー処理（一覧が空・言語が存在しない→404）。
    await ctx.dispose();
  });

  test("E2E-A08-02-013 異常（該当なし）時のHTTPステータスが仕様の404と一致する", async () => {
    test.skip(!HAS_API, "A08_02_READY(SEED-A08-02-LANG-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(NONE_LANGUAGE_CODE));
    expect404(res.status());
    await ctx.dispose();
  });

  test("E2E-A08-02-016 異常系（不正・不存在の言語コード）受信時に正しい一覧が取得されない", async () => {
    test.skip(!HAS_API, "A08_02_READY(SEED-A08-02-LANG-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(NONE_LANGUAGE_CODE));
    // 不正・不存在の言語コードでは正常取得200とならず、仕様の失敗応答（404）となる（入出力 レスポンス(失敗)404）。
    expect404(res.status());
    await ctx.dispose();
  });

  // ===== 必須条件（パス変数欠落） =====

  test("E2E-A08-02-007 パス変数（languageCode）欠落で正しい一覧が取得されない", async () => {
    test.skip(!HAS_API, "A08_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(MISSING_PATH_VAR_PATH);
    // 必須パス変数欠落では正常取得200とならない（欠落時の具体ステータス＝ルート不一致/404等は要実機確認）。
    expectNot200(res.status());
    await ctx.dispose();
  });

  // ===== 通信・正常値・冪等参照・副作用なし =====

  test("E2E-A08-02-014 正常通信で200応答が返る", async () => {
    test.skip(!HAS_API, "A08_02_READY(SEED-A08-02-LANG-BANNER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(KNOWN_LANGUAGE_CODE));
    expect200(res.status()); // 通信成立＝200。
    await ctx.dispose();
  });

  test("E2E-A08-02-015 対象条件に該当する正常値で200と一覧が返る", async () => {
    test.skip(!HAS_API, "A08_02_READY(SEED-A08-02-LANG-BANNER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(KNOWN_LANGUAGE_CODE), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const body = (await res.json()) as TopBannerListBody;
    expect(Array.isArray(body), "トップバナー一覧が返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A08-02-017 同一GETの重複呼び出しで同一レスポンス（冪等参照）となる", async () => {
    test.skip(!HAS_API, "A08_02_READY(SEED-A08-02-LANG-BANNER) 未設定");
    const ctx = await newCtx();
    const res1 = await ctx.get(buildTopBannersPath(KNOWN_LANGUAGE_CODE));
    const res2 = await ctx.get(buildTopBannersPath(KNOWN_LANGUAGE_CODE));
    // 参照系＝2回の呼び出しで同一のHTTPステータス・レスポンス本文（副作用なし／DB更新なし）。
    expect(res1.status(), "2回のHTTPステータスが一致").toBe(res2.status());
    expect(await res1.text(), "2回のレスポンス本文が一致（冪等参照）").toBe(await res2.text());
    await ctx.dispose();
  });

  test("E2E-A08-02-020 参照のみで副作用が無い（再取得で対象データ不変）", async () => {
    test.skip(!HAS_API, "A08_02_READY(SEED-A08-02-LANG-BANNER) 未設定");
    const ctx = await newCtx();
    // API呼び出し前後で対象トップバナー・言語関連の値が変化しない（副作用「無し（参照のみ）」・DB操作は検索のみ）。
    // DB直接観測は本ランナーでは行わず、参照系の不変性をAPI再取得の同一性で代理判定する。
    const before = await ctx.get(buildTopBannersPath(KNOWN_LANGUAGE_CODE));
    await ctx.get(buildTopBannersPath(KNOWN_LANGUAGE_CODE));
    const after = await ctx.get(buildTopBannersPath(KNOWN_LANGUAGE_CODE));
    expect200(before.status());
    expect200(after.status());
    expect(await before.text(), "呼び出し前後で対象データが不変").toBe(await after.text());
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1） =====

  test.fixme(
    "E2E-A08-02-011 想定外のクエリ項目を加えてもサーバエラーで停止しない（要実機確認: 想定外クエリの扱い未定義／付帯表1）",
    async () => {
      // 期待は「未知のクエリ項目でも 5xx で停止しない」ことのみ（パス変数のみ参照）。
      // 200で無視され正常取得と同一内容となるかは正本に明記が無く要実機確認のため fixme。
      // 実装時は ctx.get(buildTopBannersPath(KNOWN_LANGUAGE_CODE), { params: buildUnknownQuery() }) で status < 500 を判定する。
      void buildUnknownQuery;
    }
  );

  test.fixme(
    "E2E-A08-02-019 複数バナーが既存実装の表示順で返る（要実機確認: ソートキー未指定／付帯表1）",
    async () => {
      // 期待は「複数の設定済みバナーが配列で返り、並び順は既存実装のデフォルトに従う」（業務ルール）。
      // 具体的なソートキー（sort_no 等）は正本に明記が無く期待値を固定できないため fixme。
      // 実装時は KNOWN_LANGUAGE_CODE（複数バナー紐づき）で body.length>=2 を確認し、確定したソートキーで順序を照合する。
    }
  );
});
