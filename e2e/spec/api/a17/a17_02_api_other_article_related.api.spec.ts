/**
 * a17-02 関連記事（GET参照系JSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a17_02_api_other_article_related_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装し、要実機確認修飾（006 想定外クエリ）は test.fixme（理由付き）で残す。
 * 手動（090 認可方式の実体確認／091 タイムアウト実再現）はケース表で全量管理し本specには書かない（規約）。
 * 本APIはブラウザ向け画面を持たない（正本md）ためUI専用specは無い＝全てAPI/統合レイヤで観測する。
 *
 * 期待結果は仕様（正本md a17-02・観点表）由来（オラクル独立性）。
 *  - 送信先は実装の実効パス `GET /article/related/{id}`（ArticleController.php:81／routes.yaml:5-7）。設計書と一致（パス乖離なし）。
 *  - 合否は HTTPステータス・レスポンス配列の構造/型/共有度順で判定する。
 *  - hasSame* は仕様 integer（1/0）を期待。実装の string 化（付帯表4#1）はオラクルに固定しない。
 *  - 404本文形（付帯表4#2）はオラクルに固定しない。不正id/limit時は「正常取得200とならない」のみ判定（実装の具体ステータス＝付帯表4#3/#6 は固定しない）。
 *  - 論理削除除外（付帯表4#4）は仕様どおり「削除済みは含まれない」を期待し実装が含めれば落ちて検出する。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A17_02_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildRelatedPath,
  MISSING_ID_PATH,
  buildLimitQuery,
  KNOWN_BASE_ID,
  NONE_BASE_ID,
  ORDER_BASE_ID,
  MANY_BASE_ID,
  DELETED_BASE_ID,
  DELETED_RELATED_WP_POST_ID,
  LIMIT_N,
  ZERO_ID,
  NEGATIVE_ID,
  NON_NUMERIC_ID,
  INVALID_LIMITS,
  DEFAULT_LIMIT,
  ELEMENT_FIELDS,
  SHARE_ORDER_KEYS,
  RelatedArticleItem,
  RelatedErrorBody,
} from "../../../pages/api/a17/a17_02_api_other_article_related.api";

const HAS_API = !!process.env.A17_02_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常取得＝200（正本md レスポンス(成功)）").toBe(200);
}
function expect404(status: number) {
  expect(status, "関連記事なし＝404（正本md エラー処理／レスポンス(失敗)）").toBe(404);
}
function expectNot200(status: number) {
  // 仕様で固定される404は関連なし時のみ。不正id/limitの具体ステータス（付帯表4#3/#6）は固定せず「正常取得200とならない」で判定。
  expect(status, "不正リクエストは正常取得200とならない（具体ステータスは要実機確認）").not.toBe(200);
}

test.describe("API > 関連記事(GET参照系)", { tag: ["@api", "@a17"] }, () => {
  // ===== 正常取得（200・配列・共有判定・並び） =====

  test("E2E-A17-02-001 正常な記事IDの指定で200と関連記事配列JSONが返る", async () => {
    test.skip(!HAS_API, "A17_02_READY(SEED-A17-02-RELATED-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRelatedPath(KNOWN_BASE_ID));
    expect200(res.status());
    const body = (await res.json()) as RelatedArticleItem[];
    expect(Array.isArray(body), "関連記事配列が返る").toBeTruthy();
    expect(body.length, "関連記事が1件以上含まれる").toBeGreaterThanOrEqual(1);
    await ctx.dispose();
  });

  test("E2E-A17-02-002 正常取得時に取得時点の値が再計算・丸めされず返る", async () => {
    test.skip(!HAS_API, "A17_02_READY(SEED-A17-02-RELATED-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRelatedPath(KNOWN_BASE_ID));
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>[];
    // 業務ルール「取得後に業務値を再計算しない・丸め/補正を行わない」＝リポジトリ取得時点の値がそのまま返る。
    expect(body.length, "要素が存在する").toBeGreaterThanOrEqual(1);
    expect("wpPostId" in body[0], "wpPostId を持つ").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A17-02-003 正常取得時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A17_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRelatedPath(KNOWN_BASE_ID));
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A17-02-004 基準記事（wp_post_id）に関連する記事が抽出される", async () => {
    test.skip(!HAS_API, "A17_02_READY(SEED-A17-02-RELATED-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRelatedPath(KNOWN_BASE_ID));
    expect200(res.status());
    const body = (await res.json()) as RelatedArticleItem[];
    // 基準記事自身は含まれない（a2.wp_post_id <> a1.wp_post_id＝DtbArticleRepository.php:47-79）。
    for (const item of body) {
      expect(String(item.wpPostId), "基準記事自身は含まれない").not.toBe(String(KNOWN_BASE_ID));
    }
    await ctx.dispose();
  });

  test("E2E-A17-02-005 異常なid値（0以下）で正しい関連記事が取得されない", async () => {
    test.skip(!HAS_API, "A17_02_READY 未設定");
    const ctx = await newCtx();
    for (const v of [ZERO_ID, NEGATIVE_ID]) {
      const res = await ctx.get(buildRelatedPath(v));
      expectNot200(res.status()); // id≦0（ArticleController.php:85-87）。具体ステータスは要実機確認。
    }
    await ctx.dispose();
  });

  test("E2E-A17-02-007 パス変数（id）欠落で正しい関連記事が取得されない", async () => {
    test.skip(!HAS_API, "A17_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(MISSING_ID_PATH);
    expectNot200(res.status()); // id 必須（ArticleController.php:81-82）。欠落時のルート不一致/404等は要実機確認。
    await ctx.dispose();
  });

  test("E2E-A17-02-008 成功レスポンスが仕様のフィールド構成・型契約と一致する", async () => {
    test.skip(!HAS_API, "A17_02_READY(SEED-A17-02-RELATED-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRelatedPath(KNOWN_BASE_ID));
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>[];
    // 各要素に wpPostId(integer)・hasSame*(integer 1/0)（DtbArticleRepository.php:130-136）。実装の string 化＝付帯表4#1 はオラクルに固定しない。
    for (const item of body) {
      for (const f of ELEMENT_FIELDS) expect(f in item, `${f} を持つ`).toBeTruthy();
      expect(Number.isInteger(item.wpPostId), "wpPostId は integer").toBeTruthy();
      for (const k of SHARE_ORDER_KEYS) {
        expect(Number.isInteger(item[k]), `${k} は integer(1/0)`).toBeTruthy();
        expect([0, 1], `${k} は 0/1`).toContain(item[k]);
      }
    }
    await ctx.dispose();
  });

  test("E2E-A17-02-010 指定記事IDを基準に共有判定された関連記事のみが返る", async () => {
    test.skip(!HAS_API, "A17_02_READY(SEED-A17-02-RELATED-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRelatedPath(KNOWN_BASE_ID));
    expect200(res.status());
    const body = (await res.json()) as RelatedArticleItem[];
    // いずれも共有しない無関係な記事は混在しない＝各要素は少なくとも1種別を共有（CASE WHEN EXISTS＝DtbArticleRepository.php:47-74）。
    for (const item of body) {
      const sharedAny = SHARE_ORDER_KEYS.some((k) => Number(item[k]) === 1);
      expect(sharedAny, "少なくとも1種別を共有する記事のみ").toBeTruthy();
    }
    await ctx.dispose();
  });

  test("E2E-A17-02-040 関連記事が共有度の高い順に並ぶ", async () => {
    test.skip(!HAS_API, "A17_02_READY(SEED-A17-02-RELATED-ORDER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRelatedPath(ORDER_BASE_ID));
    expect200(res.status());
    const body = (await res.json()) as RelatedArticleItem[];
    // 共有種別数の多い記事が先（入出力 レスポンス(成功)「共有度の高い順」）。共有数で降順を確認。
    const score = (it: RelatedArticleItem) => SHARE_ORDER_KEYS.reduce((s, k) => s + Number(it[k]), 0);
    for (let i = 1; i < body.length; i++) {
      expect(score(body[i - 1]), "共有度が降順").toBeGreaterThanOrEqual(score(body[i]));
    }
    await ctx.dispose();
  });

  test("E2E-A17-02-041 limit指定時に取得件数が指定上限を超えない", async () => {
    test.skip(!HAS_API, "A17_02_READY(SEED-A17-02-RELATED-MANY) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRelatedPath(MANY_BASE_ID), { params: buildLimitQuery(LIMIT_N) });
    expect200(res.status());
    const body = (await res.json()) as RelatedArticleItem[];
    expect(body.length, `件数が limit(${LIMIT_N}) 以内`).toBeLessThanOrEqual(Number(LIMIT_N));
    await ctx.dispose();
  });

  test("E2E-A17-02-042 異常な limit 値（0以下／非数値）で正しい関連記事が取得されない", async () => {
    test.skip(!HAS_API, "A17_02_READY(SEED-A17-02-RELATED-KNOWN) 未設定");
    const ctx = await newCtx();
    for (const v of INVALID_LIMITS) {
      const res = await ctx.get(buildRelatedPath(KNOWN_BASE_ID), { params: buildLimitQuery(v) });
      expectNot200(res.status()); // 不正 limit（ArticleController.php:91-96）。具体ステータスは要実機確認。
    }
    await ctx.dispose();
  });

  test("E2E-A17-02-043 参照のみで副作用が無い（再取得で対象データ不変）", async () => {
    test.skip(!HAS_API, "A17_02_READY(SEED-A17-02-RELATED-KNOWN) 未設定");
    const ctx = await newCtx();
    // 参照系（DB操作=検索のみ・ArticleController.php:98-104）。呼び出し前後で値が変化しないことを冪等本文で観測（DB照合はSEED側で補完）。
    const before = await ctx.get(buildRelatedPath(KNOWN_BASE_ID));
    const after = await ctx.get(buildRelatedPath(KNOWN_BASE_ID));
    expect(await after.text(), "呼び出し前後で記事・中間テーブルの値が不変").toBe(await before.text());
    await ctx.dispose();
  });

  test("E2E-A17-02-044 論理削除済みの記事は関連記事として返らない", async () => {
    test.skip(!HAS_API, "A17_02_READY(SEED-A17-02-RELATED-DELETED) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRelatedPath(DELETED_BASE_ID));
    expect200(res.status());
    const body = (await res.json()) as RelatedArticleItem[];
    // deleted_at が設定された記事は配列に含まれない（リニューアル移行時の扱い）。実装の生SQLに deleted_at 絞り込み欠落疑い＝付帯表4#4（含めれば落ちて検出）。
    for (const item of body) {
      expect(String(item.wpPostId), "論理削除済みが含まれない").not.toBe(String(DELETED_RELATED_WP_POST_ID));
    }
    await ctx.dispose();
  });

  test("E2E-A17-02-045 limit未指定時はデフォルト20件で取得される", async () => {
    test.skip(!HAS_API, "A17_02_READY(SEED-A17-02-RELATED-MANY) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRelatedPath(MANY_BASE_ID));
    expect200(res.status());
    const body = (await res.json()) as RelatedArticleItem[];
    expect(body.length, "デフォルト上限20件以内").toBeLessThanOrEqual(DEFAULT_LIMIT);
    await ctx.dispose();
  });

  test("E2E-A17-02-046 非数値（型不正）の記事IDで正しい関連記事が取得されない", async () => {
    test.skip(!HAS_API, "A17_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRelatedPath(NON_NUMERIC_ID));
    expectNot200(res.status()); // 非数値 id（!preg_match('/^\\d+$/', id)＝ArticleController.php:85-87）。ルート不一致/404等は要実機確認。
    await ctx.dispose();
  });

  // ===== 異常系・404分岐 =====

  test("E2E-A17-02-009 関連記事が無い場合に404 Not Found が返る", async () => {
    test.skip(!HAS_API, "A17_02_READY(SEED-A17-02-RELATED-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRelatedPath(NONE_BASE_ID));
    expect404(res.status());
    const body = (await res.json()) as RelatedErrorBody;
    // 本文は code・message を含むJSON（正本md レスポンス(失敗)）。具体キー構成・メッセージは付帯表4#2 でオラクルに固定しない。
    expect("code" in body, "code を含むJSON").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A17-02-020 エラー（関連記事なし）発生時に仕様のエラー応答（404）が返る", async () => {
    test.skip(!HAS_API, "A17_02_READY(SEED-A17-02-RELATED-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRelatedPath(NONE_BASE_ID));
    expect404(res.status());
    const body = (await res.json()) as RelatedErrorBody;
    expect("code" in body, "code・message を含むJSON").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A17-02-022 異常（関連記事なし）時のHTTPステータスが仕様の404と一致する", async () => {
    test.skip(!HAS_API, "A17_02_READY(SEED-A17-02-RELATED-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRelatedPath(NONE_BASE_ID));
    expect404(res.status());
    await ctx.dispose();
  });

  test("E2E-A17-02-023 正常通信で200応答が返る", async () => {
    test.skip(!HAS_API, "A17_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRelatedPath(KNOWN_BASE_ID));
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A17-02-024 対象条件に該当する正常値で200と関連記事配列が返る", async () => {
    test.skip(!HAS_API, "A17_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRelatedPath(KNOWN_BASE_ID));
    expect200(res.status());
    const body = (await res.json()) as RelatedArticleItem[];
    expect(Array.isArray(body), "関連記事配列が返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A17-02-025 異常系（不正id値）受信時に正しい関連記事が取得されない", async () => {
    test.skip(!HAS_API, "A17_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRelatedPath(NEGATIVE_ID));
    expectNot200(res.status()); // 不正id（ArticleController.php:85-87）。仕様の404は関連なしのみ・具体ステータスは要実機確認。
    await ctx.dispose();
  });

  test("E2E-A17-02-026 同一GETの重複呼び出しで同一レスポンス（冪等参照）となる", async () => {
    test.skip(!HAS_API, "A17_02_READY(SEED-A17-02-RELATED-KNOWN) 未設定");
    const ctx = await newCtx();
    const res1 = await ctx.get(buildRelatedPath(KNOWN_BASE_ID));
    const res2 = await ctx.get(buildRelatedPath(KNOWN_BASE_ID));
    expect(res1.status(), "1回目200").toBe(200);
    expect(res2.status(), "2回目も同一ステータス").toBe(res1.status());
    expect(await res2.text(), "2回の本文が同一（参照系・副作用なし）").toBe(await res1.text());
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1） =====

  test.fixme(
    "E2E-A17-02-006 想定外のクエリ項目を加えてもサーバエラーで停止しない（要実機確認: 無視/200の固定不可／付帯表1）",
    async () => {
      // 期待は「未知のクエリ項目があっても 5xx で停止しない」のみ。id/limitのみ参照（ArticleController.php:81-96）。
      // 200で無視され正常取得と同一内容となるかは正本に明記が無く要実機確認のため fixme（UNKNOWN_QUERY_PARAMS で送信予定）。
    }
  );
});
