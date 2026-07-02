/**
 * a16-02 トップバナー一覧（言語コード指定・GET参照系JSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a16_02_api_top_banner_list_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装し、要実機確認修飾（005 認可方式未確定の正常呼び出し／014 想定外クエリの無視可否）は test.fixme（理由付き）で残す。
 * 手動（008 異常資格情報・認可方式未確定／030 タイムアウト実再現）はケース表で全量管理し本specには書かない（規約）。
 * 本APIはブラウザ向け画面を持たない（正本md）ためUI専用specは無い＝全てAPI/統合レイヤで観測する。
 *
 * 期待結果は仕様（正本md a16-02・観点表）由来（オラクル独立性）。
 *  - 送信先は実装の実効パス `GET /topBanners/{languageCode}`（ContentController.php:87／routes.yaml:5-7）。実装の `.json` 余剰ルートは付帯表4#5。
 *  - 合否は HTTPステータス・レスポンス本文（配列構造・型・既知値）で判定する。
 *  - 応答プロパティは仕様の camelCase（imageUrl/dispType/nameJp/nameEn）を期待し、実装 snake_case（付帯表4#1）はオラクルに寄せない。
 *  - トップレベルはラップなしのトップバナーオブジェクト配列（正本md レスポンス(成功)）。
 *  - 404本文は仕様 {code, message} を期待し、実装 {code, errors:['Not Found']}（付帯表4#3）はオラクルに寄せない。文言は要実機確認。
 *  - 404条件は処理フロー#3=OR（言語不存在 or バナー0件）を上位採用（入出力(失敗)=AND との不整合は付帯表4#4）。
 *  - 必須欠落時は「正常取得200とならない」のみ判定し、具体ステータスはオラクル化しない（要実機確認）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A16_02_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildTopBannersPath,
  TOP_BANNERS_MISSING_CODE_PATH,
  UNKNOWN_QUERY_PARAMS,
  LANG_BANNER_CODE,
  LANG_EMPTY_CODE,
  LANG_NONE_CODE,
  EXPECTED_CONTAINED_CODE,
  NOT_FOUND_MESSAGE,
  TopBannerListSuccessBody,
  TopBannerListErrorBody,
} from "../../../pages/api/a16/a16_02_api_top_banner_list.api";

const HAS_API = !!process.env.A16_02_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常取得＝200（正本md 入出力 レスポンス(成功)）").toBe(200);
}
function expect404(status: number) {
  expect(status, "言語不存在/バナー0件＝404（正本md 入出力 レスポンス(失敗)）").toBe(404);
}
function expectNot200(status: number) {
  // 必須欠落時の具体ステータスは正典未定義（オラクル化しない＝要実機確認）。
  expect(status, "正しい一覧が取得されない＝正常取得200とならない").not.toBe(200);
}

test.describe("API > トップバナー一覧(言語コード指定・GET参照系)", { tag: ["@api", "@a16"] }, () => {
  // ===== 正常取得（200・配列JSON・値非再計算） =====

  test("E2E-A16-02-001 正常な言語コードの指定で200と設定済みトップバナー配列JSONが返る", async () => {
    test.skip(!HAS_API, "A16_02_READY(SEED-A16-02-LANG-BANNER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(LANG_BANNER_CODE));
    expect200(res.status());
    const body = (await res.json()) as TopBannerListSuccessBody;
    // 当該言語に紐づく設定済みトップバナーがオブジェクト配列（ラップなし）で返る。
    expect(Array.isArray(body), "トップレベルが配列（ラップなし）").toBeTruthy();
    expect(body.length, "設定済みバナーが1件以上").toBeGreaterThanOrEqual(1);
    await ctx.dispose();
  });

  test("E2E-A16-02-002 正常取得時に取得時点の値が再計算されず返る", async () => {
    test.skip(!HAS_API, "A16_02_READY(SEED-A16-02-LANG-BANNER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(LANG_BANNER_CODE));
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>[];
    // 業務ルール「取得後に業務値を再計算しない」。各要素の id・imageUrl・link・dispType が永続化値型のまま返る（丸め・補正なし）。
    // 値そのものは SEED 既知レコードで照合する想定（要実機確認）。ここでは型の非加工のみを確認。
    const item = body[0];
    expect(item, "先頭要素が存在する").toBeTruthy();
    expect(Number.isInteger(item.id), "id が integer のまま（再計算なし）").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A16-02-003 正常取得時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A16_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(LANG_BANNER_CODE));
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A16-02-004 指定言語に紐づく設定済みトップバナーのみが取得される", async () => {
    test.skip(!HAS_API, "A16_02_READY(SEED-A16-02-LANG-BANNER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(LANG_BANNER_CODE));
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>[];
    // 処理フロー#2「指定言語の設定済みトップバナー一覧を取得」。各要素の languages 配列に当該言語コードが含まれる。
    for (const item of body) {
      const langs = (item.languages as Record<string, unknown>[]) || [];
      const codes = langs.map((l) => String(l.code));
      expect(codes, "languages に指定言語コードが含まれる").toContain(EXPECTED_CONTAINED_CODE);
    }
    await ctx.dispose();
  });

  // ===== レスポンス構造・型契約（camelCase＝仕様。実装 snake_case は付帯表4#1） =====

  test("E2E-A16-02-006 成功レスポンスが仕様のフィールド構成・型契約と一致する", async () => {
    test.skip(!HAS_API, "A16_02_READY(SEED-A16-02-LANG-BANNER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(LANG_BANNER_CODE));
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>[];
    // 仕様: 各要素 id integer・imageUrl string・link string・dispType integer・languages array。プロパティは camelCase。
    // 実装が snake_case を返せば命名乖離として落ちて検出する（付帯表4#1）。
    for (const item of body) {
      expect(Number.isInteger(item.id), "id は integer").toBeTruthy();
      expect(typeof item.imageUrl, "imageUrl は string").toBe("string");
      expect(typeof item.link, "link は string").toBe("string");
      expect(Number.isInteger(item.dispType), "dispType は integer").toBeTruthy();
      expect(Array.isArray(item.languages), "languages は array").toBeTruthy();
    }
    await ctx.dispose();
  });

  test("E2E-A16-02-040 成功レスポンスがラップなしのトップバナーオブジェクト配列で返る", async () => {
    test.skip(!HAS_API, "A16_02_READY(SEED-A16-02-LANG-BANNER 複数件) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(LANG_BANNER_CODE));
    expect200(res.status());
    const body = (await res.json()) as TopBannerListSuccessBody;
    // トップレベルがラップオブジェクトを持たない配列で、各要素が id・imageUrl・link・dispType・languages を持つ。
    expect(Array.isArray(body), "トップレベルが配列").toBeTruthy();
    for (const item of body as Record<string, unknown>[]) {
      expect("id" in item, "id を持つ").toBeTruthy();
      expect("imageUrl" in item, "imageUrl を持つ").toBeTruthy();
      expect("link" in item, "link を持つ").toBeTruthy();
      expect("dispType" in item, "dispType を持つ").toBeTruthy();
      expect("languages" in item, "languages を持つ").toBeTruthy();
    }
    await ctx.dispose();
  });

  test("E2E-A16-02-041 languages 配列の子フィールド構成・型が仕様と一致する", async () => {
    test.skip(!HAS_API, "A16_02_READY(SEED-A16-02-LANG-BANNER languages設定) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(LANG_BANNER_CODE));
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>[];
    // languages 各要素が id(integer)・nameJp(string)・nameEn(string)・code(string)（仕様 camelCase）。
    for (const item of body) {
      for (const lang of (item.languages as Record<string, unknown>[]) || []) {
        expect(Number.isInteger(lang.id), "languages[].id は integer").toBeTruthy();
        expect(typeof lang.nameJp, "languages[].nameJp は string").toBe("string");
        expect(typeof lang.nameEn, "languages[].nameEn は string").toBe("string");
        expect(typeof lang.code, "languages[].code は string").toBe("string");
      }
    }
    await ctx.dispose();
  });

  // ===== 受信検証（指定言語の設定済みのみ・他言語/未設定混在なし） =====

  test("E2E-A16-02-013 指定言語の設定済みトップバナーのみが返り他言語・未設定は混在しない", async () => {
    test.skip(!HAS_API, "A16_02_READY(SEED-A16-02-LANG-BANNER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(LANG_BANNER_CODE));
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>[];
    // 集計条件「取得対象＝指定言語の設定済みトップバナー」。返却各要素の languages に指定言語が含まれ、無関係なバナーが混在しない。
    for (const item of body) {
      const codes = ((item.languages as Record<string, unknown>[]) || []).map((l) => String(l.code));
      expect(codes, "指定言語コードに紐づく要素のみ").toContain(EXPECTED_CONTAINED_CODE);
    }
    await ctx.dispose();
  });

  // ===== 通信・正常系 =====

  test("E2E-A16-02-017 正常通信で200応答が返る", async () => {
    test.skip(!HAS_API, "A16_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(LANG_BANNER_CODE));
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A16-02-018 対象条件に該当する正常値で200と一覧が返る", async () => {
    test.skip(!HAS_API, "A16_02_READY(SEED-A16-02-LANG-BANNER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(LANG_BANNER_CODE));
    expect200(res.status());
    const body = (await res.json()) as TopBannerListSuccessBody;
    expect(Array.isArray(body), "設定済みトップバナー一覧が返る").toBeTruthy();
    await ctx.dispose();
  });

  // ===== 冪等参照・並び順不変・副作用なし =====

  test("E2E-A16-02-020 同一GETの重複呼び出しで同一レスポンス（冪等参照・並び順不変）となる", async () => {
    test.skip(!HAS_API, "A16_02_READY(SEED-A16-02-LANG-BANNER) 未設定");
    const ctx = await newCtx();
    const res1 = await ctx.get(buildTopBannersPath(LANG_BANNER_CODE));
    const res2 = await ctx.get(buildTopBannersPath(LANG_BANNER_CODE));
    // 参照系のため2回の呼び出しで同一のHTTPステータス・レスポンス本文（並び順を含む）が返り、副作用なし。
    expect(res1.status(), "1回目=2回目のステータス").toBe(res2.status());
    expect(await res1.text(), "1回目=2回目の本文（並び順含む）").toBe(await res2.text());
    await ctx.dispose();
  });

  test("E2E-A16-02-042 参照のみで副作用が無い（再取得で対象データ不変）", async () => {
    test.skip(!HAS_API, "A16_02_READY(SEED-A16-02-LANG-BANNER) 未設定");
    const ctx = await newCtx();
    // 副作用「無し（参照のみ）」。API呼び出し前後で対象トップバナー・言語関連の値が変化しない＝参照系のため同一本文。
    const before = await ctx.get(buildTopBannersPath(LANG_BANNER_CODE));
    await ctx.get(buildTopBannersPath(LANG_BANNER_CODE));
    const after = await ctx.get(buildTopBannersPath(LANG_BANNER_CODE));
    expect(await before.text(), "呼び出し前後で本文不変").toBe(await after.text());
    await ctx.dispose();
  });

  // ===== 異常系・404（言語不存在 or バナー0件。処理フロー#3=OR を上位採用＝付帯表4#4） =====

  test("E2E-A16-02-010 言語は存在するが設定済みバナーが0件の場合に404が返る", async () => {
    test.skip(!HAS_API, "A16_02_READY(SEED-A16-02-LANG-EMPTY) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(LANG_EMPTY_CODE));
    expect404(res.status());
    const body = (await res.json()) as TopBannerListErrorBody;
    // 仕様のエラー形式 {code, message}。実装本文形 {code, errors:['Not Found']} が違えば落ちて検出する（付帯表4#3）。文言は要実機確認。
    expect(typeof body.code, "code を持つ").toBe("number");
    expect(body.message, "message を持つ（文言は要実機確認）").toBe(NOT_FOUND_MESSAGE);
    await ctx.dispose();
  });

  test("E2E-A16-02-011 言語マスタに存在しない言語コードで404が返り正常取得とならない", async () => {
    test.skip(!HAS_API, "A16_02_READY(SEED-A16-02-LANG-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(LANG_NONE_CODE));
    expect404(res.status()); // 言語不存在→404（処理フロー#3）。正常取得200とならない。
    await ctx.dispose();
  });

  test("E2E-A16-02-015 エラー（該当なし）発生時に仕様のエラー応答（404）が返る", async () => {
    test.skip(!HAS_API, "A16_02_READY(SEED-A16-02-LANG-EMPTY) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(LANG_EMPTY_CODE));
    expect404(res.status()); // 一覧が空→コード404のJSON（エラー処理）。
    await ctx.dispose();
  });

  test("E2E-A16-02-016 異常（該当なし）時のHTTPステータスが仕様の404と一致する", async () => {
    test.skip(!HAS_API, "A16_02_READY(SEED-A16-02-LANG-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(LANG_NONE_CODE));
    expect404(res.status());
    await ctx.dispose();
  });

  test("E2E-A16-02-019 異常系（存在しない言語コード）で正しい一覧が取得されない", async () => {
    test.skip(!HAS_API, "A16_02_READY(SEED-A16-02-LANG-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildTopBannersPath(LANG_NONE_CODE));
    expect404(res.status()); // 仕様で固定される404は言語不存在・バナー0件のみ。正常取得200とならない。
    await ctx.dispose();
  });

  // ===== 必須欠落（正常取得200とならない＝具体ステータスは要実機確認） =====

  test("E2E-A16-02-007 パス変数（languageCode）欠落で正しいトップバナー一覧が取得されない", async () => {
    test.skip(!HAS_API, "A16_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(TOP_BANNERS_MISSING_CODE_PATH);
    expectNot200(res.status()); // 必須パス変数欠落＝正常取得200とならない（ルート不一致/404等の具体ステータスは要実機確認）。
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1/付帯表4） =====

  test.fixme(
    "E2E-A16-02-005 認証済クライアントからの呼び出しで応答が処理結果と一致する（要実機確認: 認可方式未確定／付帯表1・付帯表4#2）",
    async () => {
      // 期待は権限・認可「クライアントから呼び出す・pf-api方針」由来＝正常呼び出しで200・処理結果一致。
      // 当該パスは `app`(JWT) ファイアウォール `^/api/v1/` に不一致でJWT対象外の可能性があり、認可方式が設計書から確定できないため fixme。
      // 実機で認可方式が確定したら、正常資格情報での 200・レスポンス本文一致を検証する。
    }
  );

  test.fixme(
    "E2E-A16-02-014 想定外のクエリ項目を加えてもサーバエラーで停止しない（要実機確認: 無視可否未確定／付帯表1）",
    async () => {
      // 期待は入出力 リクエスト「想定外項目」由来。未知クエリで 5xx 停止しないことのみが判定対象。
      // 200で無視され正常取得と同一内容になるかは正本に明記が無く要実機確認のため fixme（UNKNOWN_QUERY_PARAMS を付与して送信する）。
      void UNKNOWN_QUERY_PARAMS;
    }
  );
});
