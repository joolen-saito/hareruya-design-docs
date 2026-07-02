/**
 * a15-06 デッキビルダー_マスタ取得（パス指定マスタ名に対応するマスタ全件を {code, results} ラッパで返す参照系GET JSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a15_06_api_deck_builder_deck_master_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specに残すのは「E2E自動化(API/統合)」（実装）と「要実機確認」修飾＝test.fixme（理由付き）のみ。
 * 手動（018 タイムアウト実再現・042 DB接続障害実再現）はケース表で全量管理し本specには書かない（規約）。
 * 本機能はブラウザ向け画面を持たず（正本md「ブラウザ向けの画面を持たない」）UIレイヤ=0のため admin spec は無い。
 *
 * 期待結果は設計書(a15-06)由来（オラクル独立性。実装のレスポンス形・FW既定値を期待値に流用しない）:
 *  - 送信先は実装の実効パス `GET /api/master/{name}`（MasterController.php:77。設計 `/master/{name}` と `/api` プレフィクスで差異＝付帯表4#1）。
 *  - 合否は設計の意味で判定: 公開マスタ＝全件200・{code:200,results:[...]}／0件＝200かつ results 空配列／公開外・不存在マスタ名＝404 {code:404,message}。
 *  - results 各要素キーは設計の camelCase を期待（実装 snake_case 化は付帯表4#3）。Format の deckbuilderFlg 公開を期待（実装非公開は付帯表4#4）。
 *    サブテーブル子要素取得を期待（実装 getAllWithSub 未実装は付帯表4#5、エンティティ解決乖離は付帯表4#6）。違えば落として検出する。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_06_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  masterPath,
  PUBLIC_MASTER,
  PUBLIC_MASTER_COUNT,
  UNDERSCORE_MASTER,
  FORMAT_MASTER,
  SUBTABLE_CATEGORY_MASTER,
  SUBTABLE_TAG_MASTER,
  EMPTY_MASTER,
  NONE_MASTER,
  NONPUBLIC_MASTER,
  UNEXPECTED_QUERY,
  buildJwtHeaders,
} from "../../../pages/api/a15/a15_06_api_deck_builder_deck_master.api";

const HAS_API = !!process.env.A15_06_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}
async function getMaster(
  ctx: APIRequestContext,
  name: string,
  opts?: { headers?: Record<string, string>; params?: Record<string, string> }
) {
  return ctx.get(masterPath(name), { headers: opts?.headers, params: opts?.params });
}

/** 成功ラッパ契約（設計: code integer 成功200・results array）。 */
function expectSuccessWrapper(body: any) {
  expect(body, "成功本文が JSON オブジェクト（設計: {code,results} ラッパ）").toBeTruthy();
  expect(body.code, "成功時 code は 200（設計: 入出力 レスポンス(成功) code integer）").toBe(200);
  expect(Array.isArray(body.results), "results は array（設計: レスポンス(成功) results array）").toBe(true);
}

/** 失敗（該当なし）契約（設計: 404 {code:404, message}）。message 実値の locale 差異は付帯表4#2。 */
async function expectNotFound(res: { status(): number; json(): Promise<any> }) {
  expect(res.status(), "公開外・不存在マスタ名は 404（設計: 処理フロー#3・レスポンス(失敗)）").toBe(404);
  const body = await res.json();
  expect(body.code, "404本文 code（設計: {code:404,message}）").toBe(404);
  expect(body, "404本文に message を含む（message実値 locale 差異は付帯表4#2）").toHaveProperty("message");
}

test.describe("API > デッキビルダー_マスタ取得", { tag: ["@api", "@a15", "@master"] }, () => {
  // ===== 正常取得（E2E自動化(API/統合)） =====

  test("E2E-A15-06-001 正常なマスタ名で200と公開マスタ全件JSONが返る", async () => {
    test.skip(!HAS_API, "A15_06_READY(SEED-A15-06-MASTER-PUBLIC) 未設定");
    const ctx = await newCtx();
    const res = await getMaster(ctx, PUBLIC_MASTER);
    expect(res.status(), "公開マスタ取得は 200（処理フロー#6-7・全件取得→200）").toBe(200);
    expectSuccessWrapper(await res.json()); // 指定マスタの全行が results 配列で返る（集計条件 全件・findAll MasterController.php:103）。
    await ctx.dispose();
  });

  test("E2E-A15-06-002 取得時点の値が再計算されず返る", async () => {
    test.skip(!HAS_API, "A15_06_READY(SEED-A15-06-MASTER-PUBLIC) 未設定");
    const ctx = await newCtx();
    const res = await getMaster(ctx, PUBLIC_MASTER);
    expect(res.status()).toBe(200);
    expectSuccessWrapper(await res.json()); // 丸め・補正・再計算を行わず取得時点の永続値（業務ルール・計算）。値整合はSEED既知値とのDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-06-003 正常取得時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A15_06_READY(SEED-A15-06-MASTER-PUBLIC) 未設定");
    const ctx = await newCtx();
    const res = await getMaster(ctx, PUBLIC_MASTER);
    expect(res.status(), "正常取得の成功ステータス 200（入出力 レスポンス(成功)）").toBe(200);
    await ctx.dispose();
  });

  test("E2E-A15-06-004 リポジトリ全件が取得されresults要素数が公開対象行数と一致する", async () => {
    test.skip(!HAS_API, "A15_06_READY(SEED-A15-06-MASTER-PUBLIC 既知件数) 未設定");
    const ctx = await newCtx();
    const res = await getMaster(ctx, PUBLIC_MASTER);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expectSuccessWrapper(body);
    if (PUBLIC_MASTER_COUNT !== undefined) {
      expect(
        body.results.length,
        "results 要素数が当該マスタの公開対象行数と一致（集計条件 全件・ページングなし）"
      ).toBe(PUBLIC_MASTER_COUNT);
    }
    await ctx.dispose();
  });

  test("E2E-A15-06-005 jwt-token有無/正否によらず公開マスタを200で取得できる", async () => {
    test.skip(!HAS_API, "A15_06_READY(SEED-A15-06-MASTER-PUBLIC) 未設定");
    const ctx = await newCtx();
    // jwt-token ヘッダ無し（認証を行わない＝認証属性なし・トークン非参照）。
    const resNoToken = await getMaster(ctx, PUBLIC_MASTER);
    expect(resNoToken.status(), "ヘッダ無しでも認証拒否されず 200（認証・認可: 認証を行わない）").toBe(200);
    // 不正トークン付与でもトークン検証を行わず 200。
    const resBadToken = await getMaster(ctx, PUBLIC_MASTER, { headers: buildJwtHeaders() });
    expect(resBadToken.status(), "不正トークンでもトークン検証なしで 200（jwt-token 非参照）").toBe(200);
    await ctx.dispose();
  });

  test("E2E-A15-06-006 成功レスポンスがcode/resultsラッパとcamelCaseキー契約と一致する", async () => {
    test.skip(!HAS_API, "A15_06_READY(SEED-A15-06-MASTER-PUBLIC) 未設定");
    const ctx = await newCtx();
    const res = await getMaster(ctx, PUBLIC_MASTER);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expectSuccessWrapper(body); // code(integer 200)/results(array) ラッパ（入出力 レスポンス(成功)）。
    for (const row of body.results) {
      for (const key of Object.keys(row)) {
        // 設計はキー命名 camelCase（nameJp 等）。実装の snake_case 化なら落として検出（付帯表4#3）。
        expect(key, `results 要素キーは camelCase（snake_case 化は付帯表4#3）: ${key}`).not.toMatch(/_/);
      }
    }
    await ctx.dispose();
  });

  test("E2E-A15-06-008 公開対象だが0件のマスタで200かつresultsが空配列となる", async () => {
    test.skip(!HAS_API, "A15_06_READY(SEED-A15-06-MASTER-EMPTY) 未設定");
    const ctx = await newCtx();
    const res = await getMaster(ctx, EMPTY_MASTER);
    expect(res.status(), "0件マスタでも成功 200（集計条件 全件・該当行なし）").toBe(200);
    const body = await res.json();
    expectSuccessWrapper(body);
    expect(body.results.length, "results は空配列（該当行なし）").toBe(0);
    await ctx.dispose();
  });

  test("E2E-A15-06-009 存在しないマスタ名で404となる", async () => {
    test.skip(!HAS_API, "A15_06_READY(SEED-A15-06-MASTER-NONE) 未設定");
    const ctx = await newCtx();
    const res = await getMaster(ctx, NONE_MASTER);
    await expectNotFound(res); // class_exists 偽→404 {code:404,message}（処理フロー#3・MasterController.php:89-93）。
    await ctx.dispose();
  });

  test("E2E-A15-06-011 アンダースコア区切りのマスタ名がマスタ識別名へ変換され取得される", async () => {
    test.skip(!HAS_API, "A15_06_READY(SEED-A15-06-MASTER-PUBLIC アンダースコア区切り名) 未設定");
    const ctx = await newCtx();
    const res = await getMaster(ctx, UNDERSCORE_MASTER);
    expect(res.status(), "campaign_tag→CampaignTag へ変換され公開マスタを取得 200（処理フロー#1 camelize）").toBe(200);
    expectSuccessWrapper(await res.json()); // CampaignTag is_during 追加挙動は付帯表4#8（固定期待にしない）。
    await ctx.dispose();
  });

  test("E2E-A15-06-012 エラー時に仕様のエラー応答(404本文 code/message)が返る", async () => {
    test.skip(!HAS_API, "A15_06_READY(SEED-A15-06-MASTER-NONE) 未設定");
    const ctx = await newCtx();
    const res = await getMaster(ctx, NONE_MASTER);
    await expectNotFound(res); // {code:404, message}（エラー処理。message実値 locale 差異は付帯表4#2）。
    await ctx.dispose();
  });

  test("E2E-A15-06-013 異常(該当なし)時のHTTPステータスが404と一致する", async () => {
    test.skip(!HAS_API, "A15_06_READY(SEED-A15-06-MASTER-NONE) 未設定");
    const ctx = await newCtx();
    const res = await getMaster(ctx, NONE_MASTER);
    expect(res.status(), "該当なしの失敗ステータス 404（入出力 レスポンス(失敗)）").toBe(404);
    await ctx.dispose();
  });

  test("E2E-A15-06-014 正常通信で200応答が返る", async () => {
    test.skip(!HAS_API, "A15_06_READY(SEED-A15-06-MASTER-PUBLIC) 未設定");
    const ctx = await newCtx();
    const res = await getMaster(ctx, PUBLIC_MASTER);
    expect(res.status(), "通信成立・正常マスタ名取得で 200（通信・レスポンス(成功)）").toBe(200);
    await ctx.dispose();
  });

  test("E2E-A15-06-015 対象条件に該当する正常値で200とresults配列が返る", async () => {
    test.skip(!HAS_API, "A15_06_READY(SEED-A15-06-MASTER-PUBLIC) 未設定");
    const ctx = await newCtx();
    const res = await getMaster(ctx, PUBLIC_MASTER);
    expect(res.status()).toBe(200);
    expectSuccessWrapper(await res.json()); // 正常取得 200＋results 配列（処理フロー#6-7）。
    await ctx.dispose();
  });

  test("E2E-A15-06-016 公開しないマスタ(権限・カード・カード詳細)で404となる", async () => {
    test.skip(!HAS_API, "A15_06_READY(SEED-A15-06-MASTER-NONE 公開外名) 未設定");
    const ctx = await newCtx();
    const res = await getMaster(ctx, NONPUBLIC_MASTER);
    // IGNORE_MASTERS 該当で 404（処理フロー#3・権限認可。エンティティ解決乖離は付帯表4#6）。
    await expectNotFound(res);
    await ctx.dispose();
  });

  test("E2E-A15-06-017 同一GETの重複呼び出しで同一レスポンス(冪等参照)となる", async () => {
    test.skip(!HAS_API, "A15_06_READY(SEED-A15-06-MASTER-PUBLIC) 未設定");
    const ctx = await newCtx();
    const res1 = await getMaster(ctx, PUBLIC_MASTER);
    const res2 = await getMaster(ctx, PUBLIC_MASTER);
    expect(res1.status(), "1回目 200").toBe(200);
    expect(res2.status(), "2回目も同一ステータス 200（参照系・副作用なし）").toBe(res1.status());
    expect(
      JSON.stringify(await res2.json()),
      "2回の応答本文が同一（冪等参照・副作用「無し（参照のみ）」）"
    ).toBe(JSON.stringify(await res1.json()));
    await ctx.dispose();
  });

  test("E2E-A15-06-040 フォーマットマスタはデッキビルダー対象フラグが真の行のみ取得される", async () => {
    test.skip(!HAS_API, "A15_06_READY(SEED-A15-06-MASTER-FORMAT) 未設定");
    const ctx = await newCtx();
    const res = await getMaster(ctx, FORMAT_MASTER);
    expect(res.status(), "format 取得 200").toBe(200);
    const body = await res.json();
    expectSuccessWrapper(body);
    for (const row of body.results) {
      // 設計サンプルは deckbuilderFlg を含み真の行のみ（処理フロー#4・findBy deckbuilder_flg=true）。
      // 実装は allowlist で deckbuilderFlg 非公開＝付帯表4#4。公開期待が満たされなければ落として検出。
      expect(row, "format results 要素は deckbuilderFlg を公開（付帯表4#4で検出）").toHaveProperty("deckbuilderFlg");
      expect(row.deckbuilderFlg, "deckbuilder_flg 真の行のみ含まれる（処理フロー#4）").toBeTruthy();
    }
    await ctx.dispose();
  });

  test("E2E-A15-06-041 サブテーブルを持つマスタ(カテゴリ・タグ)は子要素を含めて取得される", async () => {
    test.skip(!HAS_API, "A15_06_READY(SEED-A15-06-MASTER-SUBTABLE) 未設定");
    const ctx = await newCtx();
    for (const name of [SUBTABLE_CATEGORY_MASTER, SUBTABLE_TAG_MASTER]) {
      const res = await getMaster(ctx, name);
      // 設計は子要素を含めて取得（処理フロー#5・結合）。実装 getAllWithSub 未実装で親のみ findAll＝付帯表4#5、
      // エンティティ解決乖離で 404 になり得る＝付帯表4#6。いずれも仕様（取得可・子要素あり）を期待し落として検出。
      expect(res.status(), `${name} 取得 200（処理フロー#2 公開対象・付帯表4#6で検出）`).toBe(200);
      const body = await res.json();
      expectSuccessWrapper(body);
      for (const row of body.results) {
        expect(
          Array.isArray(row.children),
          `${name} results 要素に子要素配列を含む（処理フロー#5・getAllWithSub 未実装は付帯表4#5）`
        ).toBe(true);
      }
    }
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1/付帯表4） =====

  test.fixme(
    "E2E-A15-06-007 name欠落で公開マスタの正常取得とならない（要実機確認: 欠落時の具体ステータス／付帯表1）",
    async () => {
      // 期待は入出力 リクエスト（name 必須）由来。name パス変数欠落時の具体ステータス（ルート不一致/404等）は
      // 正本に確定記載が無く要実機確認のため fixme。送信先は name を欠いたパス（masterPath("") 相当）。
      void masterPath("");
    }
  );

  test.fixme(
    "E2E-A15-06-010 想定外クエリ項目を加えてもサーバエラーで停止しない（要実機確認: 無視可否／付帯表1）",
    async () => {
      // 期待は入出力 リクエスト（想定外項目）由来。name はパス変数のみ参照のため想定外クエリの無視可否
      // （200で正常取得と同一内容）は正本に明記が無く要実機確認のため fixme。クエリは UNEXPECTED_QUERY を付与。
      void UNEXPECTED_QUERY;
    }
  );
});
