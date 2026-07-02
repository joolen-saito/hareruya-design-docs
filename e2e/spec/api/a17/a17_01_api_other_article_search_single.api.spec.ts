/**
 * a17-01 記事単一検索（GET参照系JSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a17_01_api_other_article_search_single_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装し、要実機確認修飾（008 異常資格情報／014 想定外クエリ／022 論理削除除外）は test.fixme（理由付き）で残す。
 * 手動（030 タイムアウト実再現／031 DB接続障害実再現）はケース表で全量管理し本specには書かない（規約）。
 * 本APIはブラウザ向け画面を持たない（正本md）ためUI専用specは無い＝全てAPI/統合レイヤで観測する。
 *
 * 期待結果は仕様（正本md a17-01・観点表）由来（オラクル独立性）。
 *  - 送信先は実装の実効パス `GET /article.json`（ArticleController.php:45／routes.yaml:5-7）。設計書パス `/article` との乖離は付帯表4#1。
 *  - 合否は HTTPステータス・レスポンス本文（構造・型・既知値）で判定する。
 *  - 応答プロパティは仕様契約の camelCase を期待（実装の snake_case 化＝付帯表4#4 はオラクルに固定しない）。
 *  - 404本文は {code, message} を仕様とし、実装の {code, errors}（付帯表4#3）はオラクルに固定しない。
 *  - 必須欠落・型不正・特殊文字時は「正常取得200とならない」のみ判定（実装400＝付帯表4#6 は固定しない）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A17_01_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  ARTICLE_PATH,
  buildWpPostIdQuery,
  EMPTY_QUERY,
  KNOWN_WP_POST_ID,
  RELATED_WP_POST_ID,
  NO_RELATION_WP_POST_ID,
  NONE_WP_POST_ID,
  ZERO_WP_POST_ID,
  NEGATIVE_WP_POST_ID,
  DECIMAL_WP_POST_ID,
  NON_NUMERIC_WP_POST_ID,
  SPECIAL_CHAR_WP_POST_ID,
  EXPECTED_ARTICLE_ID,
  EXPECTED_URL,
  SUCCESS_FIELDS,
  RELATION_ARRAY_FIELDS,
  NON_PUBLIC_FIELD,
  ArticleSuccessBody,
  ArticleErrorBody,
} from "../../../pages/api/a17/a17_01_api_other_article_search_single.api";

const HAS_API = !!process.env.A17_01_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常取得＝200（正本md レスポンス(成功)）").toBe(200);
}
function expect404(status: number) {
  expect(status, "該当記事なし＝404（正本md 処理フロー#3／エラー処理）").toBe(404);
}
function expectNot200(status: number) {
  // 仕様で固定される404は該当なし時のみ。欠落・型不正・特殊文字の具体ステータス（実装400＝付帯表4#6）は固定せず「正常取得200とならない」で判定。
  expect(status, "不正リクエストは正常取得200とならない（具体ステータスは要実機確認）").not.toBe(200);
}

test.describe("API > 記事単一検索(GET参照系)", { tag: ["@api", "@a17"] }, () => {
  // ===== 正常取得（200・値・絞り込み） =====

  test("E2E-A17-01-001 正常なwpPostIdの指定で200と記事情報JSONが返る", async () => {
    test.skip(!HAS_API, "A17_01_READY(SEED-A17-01-ARTICLE-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(ARTICLE_PATH, { params: buildWpPostIdQuery(KNOWN_WP_POST_ID) });
    expect200(res.status());
    const body = (await res.json()) as ArticleSuccessBody;
    expect(body, "記事情報がJSONで返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A17-01-002 正常取得時に取得時点の値が再計算されず返る", async () => {
    test.skip(!HAS_API, "A17_01_READY(SEED-A17-01-ARTICLE-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(ARTICLE_PATH, { params: buildWpPostIdQuery(KNOWN_WP_POST_ID) });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 業務ルール「レスポンス生成時の丸め・補正は行わない」＝DB/リポジトリ取得時点の値がそのまま返る。値照合は env 期待値（未設定なら要実機確認）。
    if (EXPECTED_ARTICLE_ID !== undefined) expect(String(body.articleId), "articleId 一致").toBe(EXPECTED_ARTICLE_ID);
    if (EXPECTED_URL !== undefined) expect(String(body.url), "url 一致").toBe(EXPECTED_URL);
    await ctx.dispose();
  });

  test("E2E-A17-01-003 正常取得時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A17_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(ARTICLE_PATH, { params: buildWpPostIdQuery(KNOWN_WP_POST_ID) });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A17-01-004 指定wpPostIdに一致する記事を取得する", async () => {
    test.skip(!HAS_API, "A17_01_READY(SEED-A17-01-ARTICLE-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(ARTICLE_PATH, { params: buildWpPostIdQuery(KNOWN_WP_POST_ID) });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 処理フロー#2「条件に一致する記事を1件取得」＝返却 wpPostId が指定値と一致し articleId が返る（camelCase は付帯表4#4）。
    expect(String(body.wpPostId), "wpPostId が指定値と一致").toBe(String(KNOWN_WP_POST_ID));
    expect("articleId" in body, "対応する articleId が返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A17-01-005 認証済クライアントからの呼び出しで応答が処理結果と一致する", async () => {
    test.skip(!HAS_API, "A17_01_READY(SEED-A17-01-ARTICLE-KNOWN) 未設定");
    const ctx = await newCtx();
    // 認可方式は pf-api 方針＝未確定（付帯表4#2）。実装は認可属性を持たず正常呼び出しは200を期待（正常側の補助）。
    const res = await ctx.get(ARTICLE_PATH, { params: buildWpPostIdQuery(KNOWN_WP_POST_ID) });
    expect200(res.status());
    await ctx.dispose();
  });

  // ===== レスポンス構造・型契約（camelCase＝付帯表4#4） =====

  test("E2E-A17-01-006 成功レスポンスが仕様のフィールド構成・型契約と一致する", async () => {
    test.skip(!HAS_API, "A17_01_READY(SEED-A17-01-ARTICLE-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(ARTICLE_PATH, { params: buildWpPostIdQuery(KNOWN_WP_POST_ID) });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 仕様フィールド（camelCase）が含まれ各型が一致（ArticleResponseBuilder.php:35-46。snake_case 化＝付帯表4#4 はオラクルに固定しない）。
    for (const f of SUCCESS_FIELDS) expect(f in body, `${f} を持つ`).toBeTruthy();
    expect(Number.isInteger(body.articleId), "articleId は integer").toBeTruthy();
    expect(Number.isInteger(body.wpPostId), "wpPostId は integer").toBeTruthy();
    expect(Number.isInteger(body.wpTypeId), "wpTypeId は integer").toBeTruthy();
    expect(typeof body.url, "url は string").toBe("string");
    expect(typeof body.updateDate, "updateDate は string(ISO8601)").toBe("string");
    expect(typeof body.createDate, "createDate は string(ISO8601)").toBe("string");
    for (const f of RELATION_ARRAY_FIELDS) expect(Array.isArray(body[f]), `${f} は array`).toBeTruthy();
    await ctx.dispose();
  });

  // ===== 必須欠落・異常パラメータ・型不正・特殊文字（正常取得200とならない） =====

  test("E2E-A17-01-007 必須クエリ（wpPostId）欠落で正しい記事が取得されない", async () => {
    test.skip(!HAS_API, "A17_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(ARTICLE_PATH, { params: EMPTY_QUERY });
    expectNot200(res.status()); // wpPostId 必須（ArticleController.php:49-52）。欠落時の具体ステータスは要実機確認。
    await ctx.dispose();
  });

  test("E2E-A17-01-011 異常なパラメータ値（wpPostId≦0・非整数）で正しい記事が取得されない", async () => {
    test.skip(!HAS_API, "A17_01_READY 未設定");
    const ctx = await newCtx();
    for (const v of [ZERO_WP_POST_ID, NEGATIVE_WP_POST_ID, DECIMAL_WP_POST_ID]) {
      const res = await ctx.get(ARTICLE_PATH, { params: buildWpPostIdQuery(v) });
      expectNot200(res.status()); // 0以下・非整数（ArticleController.php:54-56）。具体ステータスは要実機確認。
    }
    await ctx.dispose();
  });

  test("E2E-A17-01-012 非数値（型不正）のwpPostIdで正しい記事が取得されない", async () => {
    test.skip(!HAS_API, "A17_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(ARTICLE_PATH, { params: buildWpPostIdQuery(NON_NUMERIC_WP_POST_ID) });
    expectNot200(res.status()); // wpPostId integer（ArticleController.php:54-56）。具体ステータスは要実機確認。
    await ctx.dispose();
  });

  test("E2E-A17-01-013 指定wpPostIdに一致する記事のみが返る", async () => {
    test.skip(!HAS_API, "A17_01_READY(SEED-A17-01-ARTICLE-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(ARTICLE_PATH, { params: buildWpPostIdQuery(KNOWN_WP_POST_ID) });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 集計条件「1件を返す」＝単一記事オブジェクトで wpPostId が指定値と一致（別記事の混在なし）。
    expect(Array.isArray(body), "単一記事オブジェクト（配列でない）").toBeFalsy();
    expect(String(body.wpPostId), "wpPostId が指定値と一致").toBe(String(KNOWN_WP_POST_ID));
    await ctx.dispose();
  });

  test("E2E-A17-01-021 特殊文字・記号を含むwpPostIdで正しい記事が取得されない", async () => {
    test.skip(!HAS_API, "A17_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(ARTICLE_PATH, { params: buildWpPostIdQuery(SPECIAL_CHAR_WP_POST_ID) });
    expectNot200(res.status()); // 特殊文字は整数判定不一致（ArticleController.php:54-56）。5xxで停止しない。具体ステータスは要実機確認。
    expect(res.status(), "サーバエラー(5xx)で停止しない").toBeLessThan(500);
    await ctx.dispose();
  });

  // ===== 異常系・404分岐 =====

  test("E2E-A17-01-010 該当記事が無い場合に404が返る", async () => {
    test.skip(!HAS_API, "A17_01_READY(SEED-A17-01-ARTICLE-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(ARTICLE_PATH, { params: buildWpPostIdQuery(NONE_WP_POST_ID) });
    expect404(res.status());
    const body = (await res.json()) as ArticleErrorBody;
    // 仕様の標準エラー応答＝コード・メッセージを含むJSON（正本md レスポンス(失敗)）。実装本文形 {code, errors} は付帯表4#3 でオラクルに固定しない。
    expect("code" in body, "code を含むJSON").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A17-01-015 エラー発生時に仕様のエラー応答（404）が返る", async () => {
    test.skip(!HAS_API, "A17_01_READY(SEED-A17-01-ARTICLE-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(ARTICLE_PATH, { params: buildWpPostIdQuery(NONE_WP_POST_ID) });
    expect404(res.status());
    const body = (await res.json()) as ArticleErrorBody;
    expect("code" in body, "コード・メッセージを含むJSON").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A17-01-016 異常（該当なし）時のHTTPステータスが仕様の404と一致する", async () => {
    test.skip(!HAS_API, "A17_01_READY(SEED-A17-01-ARTICLE-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(ARTICLE_PATH, { params: buildWpPostIdQuery(NONE_WP_POST_ID) });
    expect404(res.status());
    await ctx.dispose();
  });

  test("E2E-A17-01-017 正常通信で200応答が返る", async () => {
    test.skip(!HAS_API, "A17_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(ARTICLE_PATH, { params: buildWpPostIdQuery(KNOWN_WP_POST_ID) });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A17-01-018 対象条件に該当する正常値で200と記事情報が返る", async () => {
    test.skip(!HAS_API, "A17_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(ARTICLE_PATH, { params: buildWpPostIdQuery(KNOWN_WP_POST_ID) });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A17-01-019 異常系（不正値）受信時に正しい記事が取得されない", async () => {
    test.skip(!HAS_API, "A17_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(ARTICLE_PATH, { params: buildWpPostIdQuery(NEGATIVE_WP_POST_ID) });
    expectNot200(res.status()); // 不正値（ArticleController.php:54-61）。仕様の404は該当なしのみ・具体ステータスは要実機確認。
    await ctx.dispose();
  });

  test("E2E-A17-01-020 同一GETの重複呼び出しで同一レスポンス（冪等参照）となる", async () => {
    test.skip(!HAS_API, "A17_01_READY(SEED-A17-01-ARTICLE-KNOWN) 未設定");
    const ctx = await newCtx();
    const res1 = await ctx.get(ARTICLE_PATH, { params: buildWpPostIdQuery(KNOWN_WP_POST_ID) });
    const res2 = await ctx.get(ARTICLE_PATH, { params: buildWpPostIdQuery(KNOWN_WP_POST_ID) });
    expect(res1.status(), "1回目200").toBe(200);
    expect(res2.status(), "2回目も同一ステータス").toBe(res1.status());
    expect(await res2.text(), "2回の本文が同一（参照系・副作用なし）").toBe(await res1.text());
    await ctx.dispose();
  });

  // ===== 関連配列・副作用・非公開フィールド（母集合外・設計書補完） =====

  test("E2E-A17-01-040 関連カード・アーキタイプ・デッキ・イベント詳細が配列で返る", async () => {
    test.skip(!HAS_API, "A17_01_READY(SEED-A17-01-ARTICLE-KNOWN 関連あり) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(ARTICLE_PATH, { params: buildWpPostIdQuery(RELATED_WP_POST_ID) });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // cards・archetypes・decks・eventDetails は中間テーブル由来の一覧として配列（ArticleResponseBuilder.php:41-46）。
    for (const f of RELATION_ARRAY_FIELDS) expect(Array.isArray(body[f]), `${f} は array`).toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A17-01-041 関連が無いとき各関連フィールドが空配列で返る", async () => {
    test.skip(!HAS_API, "A17_01_READY(SEED-A17-01-ARTICLE-KNOWN 関連なし) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(ARTICLE_PATH, { params: buildWpPostIdQuery(NO_RELATION_WP_POST_ID) });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 関連が無い場合は空配列（[]）（サンプルレスポンスの空配列例）。
    for (const f of RELATION_ARRAY_FIELDS) {
      expect(Array.isArray(body[f]), `${f} は array`).toBeTruthy();
      expect((body[f] as unknown[]).length, `${f} は空配列`).toBe(0);
    }
    await ctx.dispose();
  });

  test("E2E-A17-01-042 参照のみで副作用が無い（再取得で対象データ不変）", async () => {
    test.skip(!HAS_API, "A17_01_READY(SEED-A17-01-ARTICLE-KNOWN) 未設定");
    const ctx = await newCtx();
    // 参照系（DB操作=検索のみ・ArticleController.php:46-71）。呼び出し前後で記事レコード値が変化しないことを冪等本文で観測（DB照合はSEED側で補完）。
    const before = await ctx.get(ARTICLE_PATH, { params: buildWpPostIdQuery(KNOWN_WP_POST_ID) });
    const after = await ctx.get(ARTICLE_PATH, { params: buildWpPostIdQuery(KNOWN_WP_POST_ID) });
    expect(await after.text(), "呼び出し前後で記事の値が不変").toBe(await before.text());
    await ctx.dispose();
  });

  test("E2E-A17-01-043 削除日時（deletedAt）が応答に含まれない", async () => {
    test.skip(!HAS_API, "A17_01_READY(SEED-A17-01-ARTICLE-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(ARTICLE_PATH, { params: buildWpPostIdQuery(KNOWN_WP_POST_ID) });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // シリアライズ対象は公開指定のプロパティのみ＝deletedAt は含まれない（ArticleResponseBuilder.php:35-46）。
    expect(NON_PUBLIC_FIELD in body, "deletedAt を含まない").toBeFalsy();
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1） =====

  test.fixme(
    "E2E-A17-01-008 異常な資格情報での呼び出しが許可されず正常取得とならない（要実機確認: 認可方式が未確定／付帯表4#2）",
    async () => {
      // 期待は権限・認可「前提が欠落/不正なら正常取得を返さない」（負例本体）由来。
      // 実装に認可属性が無く（ArticleController.php:30-71）認可方式が設計から確定できないため拒否時の具体ステータス（401/403等）が固定できず fixme。
      // 実装時は buildInvalidAuthHeaders() で送信し「記事情報JSON＋200を返さない」ことを判定する。
    }
  );

  test.fixme(
    "E2E-A17-01-014 想定外のクエリ項目を加えてもサーバエラーで停止しない（要実機確認: 無視/200の固定不可／付帯表1）",
    async () => {
      // 期待は「未知のクエリ項目があっても 5xx で停止しない」のみ。wpPostIdのみ参照（ArticleController.php:49）。
      // 200で無視され正常取得と同一内容となるかは正本に明記が無く要実機確認のため fixme（buildWpPostIdQueryWithExtra で送信予定）。
    }
  );

  test.fixme(
    "E2E-A17-01-022 論理削除済み記事（deletedAt）は応答対象外で該当なし扱いとなる（要実機確認: 論理削除除外が未確認／付帯表4#5）",
    async () => {
      // 期待は「deleted_at が設定された記事は応答対象外＝正常取得200とならず該当なし扱い」（リニューアル移行時の扱い）由来。
      // findOneBy が論理削除を除外する仕組みが実装で確認できない（ArticleController.php:58）ため fixme（DELETED_WP_POST_ID で送信予定）。
    }
  );
});
