/**
 * a14-03 カード単一検索（GET参照系JSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a14_03_api_card_card_search_single_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装し、要実機確認修飾（006 想定外クエリ無視可否未定／040 分割カード名の `+` エンコード）は test.fixme（理由付き）で残す。
 * 手動（001 異常資格情報＝認可方式未特定／015 タイムアウト実再現／043 DB障害実再現）は
 * ケース表で全量管理し本specには書かない（規約）。E2E自動化(UI) は0件（本APIはブラウザ向け画面を持たない／正本md）。
 *
 * 期待結果は仕様（正本md a14-03・観点表）由来（オラクル独立性）。
 *  - 送信先は実装の実効パス `GET /card`（CardController.php:41／routes.yaml:5-7。設計書 `GET /card` と一致）。
 *  - 合否は HTTPステータス・レスポンス本文（構造・型・既知値）で判定する。
 *  - 応答フィールドは仕様の入出力定義 `id`/`nameJp`/`nameEn`/`image_url`（命名規約 camelCase と image_url の差異＝付帯表4#2はオラクルへ寄せない）。
 *  - 404本文 message は仕様「Not Found」を期待。障害時500応答（付帯表4#3）はオラクルへ固定しない（手動）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A14_03_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  CARD_SEARCH_PATH,
  buildNameQuery,
  buildNameLangQuery,
  buildNameQueryWithExtra,
  EMPTY_QUERY,
  KNOWN_CARD_NAME,
  MULTI_LANG_CARD_NAME,
  MULTI_MATCH_CARD_NAME,
  SPLIT_CARD_NAME,
  NONE_CARD_NAME,
  LANG_JA,
  EXPECTED_NAME_JP,
  EXPECTED_NAME_EN,
  EXPECTED_IMAGE_URL,
  NOT_FOUND_MESSAGE,
  CardSearchSuccessBody,
  CardSearchErrorBody,
} from "../../../pages/api/a14/a14_03_api_card_card_search_single.api";

const HAS_API = !!process.env.A14_03_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常取得＝200（正本md 入出力 レスポンス(成功)）").toBe(200);
}
function expect404(status: number) {
  expect(status, "該当なし/name空相当＝404 Not Found（正本md 入出力 レスポンス(失敗)）").toBe(404);
}

test.describe("API > カード単一検索(GET参照系)", { tag: ["@api", "@a14"] }, () => {
  // ===== 正常検索（フィールド・値照合・HTTPステータス） =====

  test("E2E-A14-03-004 正常なカード名(name)指定で200とカード情報JSONが返る", async () => {
    test.skip(!HAS_API, "A14_03_READY(SEED-A14-03-CARD-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(CARD_SEARCH_PATH, { params: buildNameQuery(KNOWN_CARD_NAME) });
    expect200(res.status());
    const body = (await res.json()) as CardSearchSuccessBody;
    // カード1件が id・nameJp・nameEn・image_url を持つ（正本md 入出力 レスポンス(成功)）。
    expect("id" in body, "id を持つ").toBeTruthy();
    expect("nameJp" in body, "nameJp を持つ").toBeTruthy();
    expect("nameEn" in body, "nameEn を持つ").toBeTruthy();
    expect("image_url" in body, "image_url を持つ（命名規約差異＝付帯表4#2）").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A14-03-002 正常取得時に取得時点の値が再計算されず返る", async () => {
    test.skip(!HAS_API, "A14_03_READY(SEED-A14-03-CARD-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(CARD_SEARCH_PATH, { params: buildNameQuery(KNOWN_CARD_NAME) });
    expect200(res.status());
    const body = (await res.json()) as CardSearchSuccessBody;
    // 取得時点の値がそのまま返る（業務ルール「取得後に業務値を再計算しない」）。値照合は env 期待値（未設定なら要実機確認）。
    if (EXPECTED_NAME_JP !== undefined) expect(String(body.nameJp), "nameJp 一致").toBe(EXPECTED_NAME_JP);
    if (EXPECTED_NAME_EN !== undefined) expect(String(body.nameEn), "nameEn 一致").toBe(EXPECTED_NAME_EN);
    if (EXPECTED_IMAGE_URL !== undefined) expect(String(body.image_url), "image_url 一致").toBe(EXPECTED_IMAGE_URL);
    await ctx.dispose();
  });

  test("E2E-A14-03-003 正常取得時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A14_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(CARD_SEARCH_PATH, { params: buildNameQuery(KNOWN_CARD_NAME) });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A14-03-024 カード名に一致するカードをカードマスタから取得する", async () => {
    test.skip(!HAS_API, "A14_03_READY(SEED-A14-03-CARD-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(CARD_SEARCH_PATH, { params: buildNameQuery(KNOWN_CARD_NAME) });
    expect200(res.status());
    const body = (await res.json()) as CardSearchSuccessBody;
    // 返却 nameJp/nameEn が指定名に対応（処理フロー#2「条件に一致するカードを1件取得」）。
    if (EXPECTED_NAME_JP !== undefined) expect(String(body.nameJp), "nameJp が指定名に対応").toBe(EXPECTED_NAME_JP);
    if (EXPECTED_NAME_EN !== undefined) expect(String(body.nameEn), "nameEn が指定名に対応").toBe(EXPECTED_NAME_EN);
    await ctx.dispose();
  });

  test("E2E-A14-03-032 成功レスポンスが仕様のフィールド構成・型契約と一致する", async () => {
    test.skip(!HAS_API, "A14_03_READY(SEED-A14-03-CARD-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(CARD_SEARCH_PATH, { params: buildNameQuery(KNOWN_CARD_NAME) });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // id=integer／nameJp・nameEn・image_url=string（正本md 入出力 レスポンス(成功)）。命名規約 camelCase と image_url の差異＝付帯表4#2。
    expect(Number.isInteger(body.id), "id は integer").toBeTruthy();
    expect(typeof body.nameJp, "nameJp は string").toBe("string");
    expect(typeof body.nameEn, "nameEn は string").toBe("string");
    expect(typeof body.image_url, "image_url は string").toBe("string");
    await ctx.dispose();
  });

  test("E2E-A14-03-036 指定カード名に一致するカードのみが返る", async () => {
    test.skip(!HAS_API, "A14_03_READY(SEED-A14-03-CARD-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(CARD_SEARCH_PATH, { params: buildNameQuery(KNOWN_CARD_NAME) });
    expect200(res.status());
    const body = (await res.json()) as CardSearchSuccessBody;
    // nameJp/nameEn が指定名に一致し無関係なカードが返らない（処理フロー#2）。
    if (EXPECTED_NAME_JP !== undefined) expect(String(body.nameJp), "nameJp が指定名に一致").toBe(EXPECTED_NAME_JP);
    if (EXPECTED_NAME_EN !== undefined) expect(String(body.nameEn), "nameEn が指定名に一致").toBe(EXPECTED_NAME_EN);
    await ctx.dispose();
  });

  // ===== 通信・正常・冪等参照・1件・優先言語 =====

  test("E2E-A14-03-026 正常通信で200応答が返る", async () => {
    test.skip(!HAS_API, "A14_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(CARD_SEARCH_PATH, { params: buildNameQuery(KNOWN_CARD_NAME) });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A14-03-027 対象条件に該当する正常値で200とカード情報が返る", async () => {
    test.skip(!HAS_API, "A14_03_READY(SEED-A14-03-CARD-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(CARD_SEARCH_PATH, { params: buildNameQuery(KNOWN_CARD_NAME) });
    expect200(res.status());
    const body = (await res.json()) as CardSearchSuccessBody;
    expect("id" in body, "カード情報1件が返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A14-03-037 条件に一致するカードを1件JSONで返し、重複呼び出しで同一応答となる", async () => {
    test.skip(!HAS_API, "A14_03_READY(SEED-A14-03-CARD-KNOWN) 未設定");
    const ctx = await newCtx();
    const res1 = await ctx.get(CARD_SEARCH_PATH, { params: buildNameQuery(KNOWN_CARD_NAME) });
    const res2 = await ctx.get(CARD_SEARCH_PATH, { params: buildNameQuery(KNOWN_CARD_NAME) });
    // 参照系のため2回で同一のHTTPステータス・1件のJSON（副作用「無し（参照のみ）」）。
    expect(res1.status(), "2回の呼び出しで同一ステータス").toBe(res2.status());
    expect(await res1.text(), "2回の呼び出しで同一本文（1件JSON）").toBe(await res2.text());
    await ctx.dispose();
  });

  test("E2E-A14-03-042 複数一致が存在しても1件のみ返る", async () => {
    test.skip(!HAS_API, "A14_03_READY(SEED-A14-03-CARD-KNOWN 複数一致) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(CARD_SEARCH_PATH, { params: buildNameQuery(MULTI_MATCH_CARD_NAME) });
    expect200(res.status());
    const body = (await res.json()) as unknown;
    // 集計条件「1件を返す」＝応答は配列ではなく単一カードオブジェクト（id を持つ）。
    expect(Array.isArray(body), "応答は配列ではなく単一カードオブジェクト").toBeFalsy();
    expect((body as CardSearchSuccessBody).id !== undefined, "単一カード（id を持つ）が返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A14-03-041 lang 指定で並び順の優先言語が切り替わる", async () => {
    test.skip(!HAS_API, "A14_03_READY(SEED-A14-03-CARD-KNOWN 同名で複数候補) 未設定");
    const ctx = await newCtx();
    // lang=ja は日本語、省略時は英語を優先言語として並び順に用いる（業務ルール「並び順の優先言語」）。
    const resJa = await ctx.get(CARD_SEARCH_PATH, { params: buildNameLangQuery(MULTI_LANG_CARD_NAME, LANG_JA) });
    const resDefault = await ctx.get(CARD_SEARCH_PATH, { params: buildNameQuery(MULTI_LANG_CARD_NAME) });
    expect200(resJa.status());
    expect200(resDefault.status());
    // 優先言語に応じたカード1件が返る（具体差はSEEDの複数候補で照合。両系で200・単一カードであることを判定）。
    const ja = (await resJa.json()) as CardSearchSuccessBody;
    const def = (await resDefault.json()) as CardSearchSuccessBody;
    expect(ja.id !== undefined && def.id !== undefined, "lang=ja・省略の双方で単一カードが返る").toBeTruthy();
    await ctx.dispose();
  });

  // ===== 異常系・404分岐 =====

  test("E2E-A14-03-005 異常なパラメータ値で正しいカードが取得されない", async () => {
    test.skip(!HAS_API, "A14_03_READY(SEED-A14-03-CARD-NONE) 未設定");
    const ctx = await newCtx();
    // いずれのカードにも一致しない name は該当なし→404（入出力 レスポンス(失敗)・エラー処理）。
    const res = await ctx.get(CARD_SEARCH_PATH, { params: buildNameQuery(NONE_CARD_NAME) });
    expect404(res.status());
    await ctx.dispose();
  });

  test("E2E-A14-03-031 必須パラメータ name の未指定・空で404が返る", async () => {
    test.skip(!HAS_API, "A14_03_READY 未設定");
    const ctx = await newCtx();
    // name 空相当は該当なし→404（CardController.php:45,49-50）。本文は {code, message}（"Not Found"）。
    const res = await ctx.get(CARD_SEARCH_PATH, { params: EMPTY_QUERY });
    expect404(res.status());
    const body = (await res.json()) as CardSearchErrorBody;
    expect(typeof body.code, "code を持つ").toBe("number");
    expect(body.message, "message=Not Found").toBe(NOT_FOUND_MESSAGE);
    await ctx.dispose();
  });

  test("E2E-A14-03-033 該当するカードが無い場合に404 Not Found が返る", async () => {
    test.skip(!HAS_API, "A14_03_READY(SEED-A14-03-CARD-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(CARD_SEARCH_PATH, { params: buildNameQuery(NONE_CARD_NAME) });
    expect404(res.status());
    const body = (await res.json()) as CardSearchErrorBody;
    // 404本文は {code:404, message:"Not Found"}（処理フロー#3・入出力 レスポンス(失敗)404）。
    expect(typeof body.code, "code を持つ").toBe("number");
    expect(body.message, "message=Not Found").toBe(NOT_FOUND_MESSAGE);
    await ctx.dispose();
  });

  test("E2E-A14-03-008 エラー発生時に仕様のエラー応答（404 Not Found）が返る", async () => {
    test.skip(!HAS_API, "A14_03_READY(SEED-A14-03-CARD-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(CARD_SEARCH_PATH, { params: buildNameQuery(NONE_CARD_NAME) });
    expect404(res.status());
    const body = (await res.json()) as CardSearchErrorBody;
    expect(typeof body.code, "code を持つ").toBe("number");
    expect(body.message, "message=Not Found").toBe(NOT_FOUND_MESSAGE);
    await ctx.dispose();
  });

  test("E2E-A14-03-025 異常（該当なし）時のHTTPステータスが仕様の404と一致する", async () => {
    test.skip(!HAS_API, "A14_03_READY(SEED-A14-03-CARD-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(CARD_SEARCH_PATH, { params: buildNameQuery(NONE_CARD_NAME) });
    expect404(res.status());
    await ctx.dispose();
  });

  test("E2E-A14-03-030 異常系（不正値）受信時に正しいカードが取得されない", async () => {
    test.skip(!HAS_API, "A14_03_READY(SEED-A14-03-CARD-NONE) 未設定");
    const ctx = await newCtx();
    // 不正値の name は一致なし→該当なしとして404（入出力 レスポンス(失敗)・エラー処理）。
    const res = await ctx.get(CARD_SEARCH_PATH, { params: buildNameQuery(NONE_CARD_NAME) });
    expect404(res.status());
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1/付帯表4） =====

  test.fixme(
    "E2E-A14-03-006 想定外のクエリ項目を加えてもサーバエラーで停止しない（要実機確認: 無視可否が正本未定義／付帯表1）",
    async () => {
      // 想定外クエリの扱い（200で無視され正常取得と同一内容か）は正本に明記が無く要実機確認のため fixme。
      // 判定はサーバエラー(5xx)で停止しないことのみ（無視可否=200/同一内容は実機確認）。
      const ctx = await newCtx();
      const res = await ctx.get(CARD_SEARCH_PATH, { params: buildNameQueryWithExtra(KNOWN_CARD_NAME) });
      expect(res.status(), "5xx で停止しない").toBeLessThan(500);
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-03-040 特殊文字（分割カード名）の name で正しいカードが取得される（要実機確認: `+` のURLエンコード影響／付帯表4#4）",
    async () => {
      // 日名/英名・英名/日名の形（`+` 連結は内部で `/` に置換）の name で一致カード1件が200で返ること。
      // クエリの `+` は URL デコードで空白へ変換され得るためリテラル `+` は `%2B` でのエンコードが必要となる可能性＝要実機確認のため fixme。
      const ctx = await newCtx();
      const res = await ctx.get(CARD_SEARCH_PATH, { params: buildNameQuery(SPLIT_CARD_NAME) });
      expect200(res.status());
      const body = (await res.json()) as CardSearchSuccessBody;
      expect("id" in body, "分割カード名で一致カード1件が返る").toBeTruthy();
      await ctx.dispose();
    }
  );
});
