/**
 * a14-01 カード取得（GET参照系JSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a14_01_api_card_card_get_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装し、要実機確認修飾（005 認可方式未特定／014 想定外クエリ無視可否未定）は test.fixme（理由付き）で残す。
 * 手動（007 必須id欠落＝別ルート到達／008 異常資格情報＝認可方式未特定／030 タイムアウト実再現／031 DB障害実再現）は
 * ケース表で全量管理し本specには書かない（規約）。E2E自動化(UI) は0件（本APIはブラウザ向け画面を持たない／正本md）。
 *
 * 期待結果は仕様（正本md a14-01・観点表）由来（オラクル独立性）。
 *  - 送信先は実装の実効パス `GET /api/cards/{id}`（CardController.php:142。設計書 `/cards/{id}` との `/api` 乖離＝付帯表4#1）。
 *  - 合否は HTTPステータス・レスポンス本文（構造・型・既知値）で判定する。
 *  - 応答キーは仕様の camelCase を期待（実装 snake_case 乖離＝付帯表4#4）／公開対象外フィールド非混入を期待（付帯表4#5）。
 *  - 404本文 message は仕様「Not Found」を期待（実装「見つかりません」乖離＝付帯表4#3／日時TZ＝付帯表4#6／関連構造＝付帯表4#7。いずれもオラクルへ寄せない）。
 *  - 仕様で固定される404は該当なし時のみ。id≦0・非数値・負値の具体ステータスは要実機確認＝200とならないことのみ判定。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A14_01_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildCardPath,
  buildNoAuthHeaders,
  UNKNOWN_QUERY_PARAMS,
  KNOWN_CARD_ID,
  ARRAY_FIELD_CARD_ID,
  NULL_FIELD_CARD_ID,
  NONE_CARD_ID,
  ZERO_CARD_ID,
  NEGATIVE_CARD_ID,
  NON_NUMERIC_CARD_ID,
  EXPECTED_NAME_JP,
  EXPECTED_NAME_EN,
  EXPECTED_MANA_COST,
  NOT_FOUND_MESSAGE,
  STRING_FIELDS,
  ARRAY_FIELDS,
  PUBLIC_EXCLUDED_FIELDS,
  NULLABLE_FIELDS,
  CardGetSuccessBody,
  CardGetErrorBody,
} from "../../../pages/api/a14/a14_01_api_card_card_get.api";

const HAS_API = !!process.env.A14_01_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常取得＝200（正本md 入出力 レスポンス(成功)）").toBe(200);
}
function expect404(status: number) {
  expect(status, "該当なし＝404 Not Found（正本md 入出力 レスポンス(失敗)）").toBe(404);
}
function expectNot200(status: number) {
  // 仕様で固定される404は該当なし時のみ。id≦0/非数値/負値の具体ステータスは要実機確認のため「正常取得200とならない」のみ判定。
  expect(status, "不正パラメータは正常取得200とならない（具体ステータスは要実機確認）").not.toBe(200);
}

test.describe("API > カード取得(GET参照系)", { tag: ["@api", "@a14"] }, () => {
  // ===== 正常取得（HTTPステータス・id一致・値非加工） =====

  test("E2E-A14-01-001 正常なカードIDの指定で200とカード情報JSONが返る", async () => {
    test.skip(!HAS_API, "A14_01_READY(SEED-A14-01-CARD-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildCardPath(KNOWN_CARD_ID));
    expect200(res.status());
    const body = (await res.json()) as CardGetSuccessBody;
    expect("id" in body, "カードマスタ情報JSON（id を含む）が返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A14-01-002 正常取得時に取得時点の値が再計算・丸めされず返る", async () => {
    test.skip(!HAS_API, "A14_01_READY(SEED-A14-01-CARD-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildCardPath(KNOWN_CARD_ID));
    expect200(res.status());
    const body = (await res.json()) as CardGetSuccessBody;
    // DB/リポジトリ取得時点の値がそのまま返る（業務ルール「再計算/丸めを行わない」）。値照合は env 期待値で行う（未設定なら要実機確認）。
    if (EXPECTED_NAME_JP !== undefined) expect(String(body.nameJp), "nameJp 一致").toBe(EXPECTED_NAME_JP);
    if (EXPECTED_NAME_EN !== undefined) expect(String(body.nameEn), "nameEn 一致").toBe(EXPECTED_NAME_EN);
    if (EXPECTED_MANA_COST !== undefined) expect(String(body.manaCost), "manaCost 一致").toBe(EXPECTED_MANA_COST);
    await ctx.dispose();
  });

  test("E2E-A14-01-003 正常取得時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A14_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildCardPath(KNOWN_CARD_ID));
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A14-01-004 指定カードIDに対応するカードマスタが取得される", async () => {
    test.skip(!HAS_API, "A14_01_READY(SEED-A14-01-CARD-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildCardPath(KNOWN_CARD_ID));
    expect200(res.status());
    const body = (await res.json()) as CardGetSuccessBody;
    // 応答の id が指定IDと一致（処理フロー#2「当該IDのカードを取得」）。
    expect(String(body.id), "応答の id が指定カードIDと一致").toBe(String(KNOWN_CARD_ID));
    await ctx.dispose();
  });

  // ===== レスポンス構造・型契約（命名 camelCase=付帯表4#4／公開対象外除外=付帯表4#5） =====

  test("E2E-A14-01-006 成功レスポンスが仕様のフィールド構成・型契約と一致する", async () => {
    test.skip(!HAS_API, "A14_01_READY(SEED-A14-01-CARD-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildCardPath(KNOWN_CARD_ID));
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // id=integer／文字列群=string／cmc=number／配列群=array／colorSequence=object（正本md 入出力 レスポンス(成功)）。
    // 命名は仕様 camelCase（実装 snake_case 乖離＝付帯表4#4）・日時TZ＝付帯表4#6・関連構造＝付帯表4#7はオラクルへ寄せない。
    expect(Number.isInteger(body.id), "id は integer").toBeTruthy();
    expect(typeof body.cmc, "cmc は number").toBe("number");
    for (const f of STRING_FIELDS) {
      expect(typeof body[f], `${f} は string`).toBe("string");
    }
    for (const f of ARRAY_FIELDS) {
      expect(Array.isArray(body[f]), `${f} は array`).toBeTruthy();
    }
    expect(
      typeof body.colorSequence === "object" || body.colorSequence === null,
      "colorSequence は object（未設定時 null）"
    ).toBeTruthy();
    await ctx.dispose();
  });

  // ===== 受信検証・冪等参照・副作用なし =====

  test("E2E-A14-01-013 指定カードIDに対応するカードのみが返る", async () => {
    test.skip(!HAS_API, "A14_01_READY(SEED-A14-01-CARD-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildCardPath(KNOWN_CARD_ID));
    expect200(res.status());
    const body = (await res.json()) as CardGetSuccessBody;
    // 無関係なカードでなく指定IDのカードのみが返る（処理フロー#2）。
    expect(String(body.id), "返却カードが指定IDに一致（無関係カードでない）").toBe(String(KNOWN_CARD_ID));
    await ctx.dispose();
  });

  test("E2E-A14-01-017 正常通信で200応答が返る", async () => {
    test.skip(!HAS_API, "A14_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildCardPath(KNOWN_CARD_ID));
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A14-01-018 対象条件に該当する正常値で200とカード情報が返る", async () => {
    test.skip(!HAS_API, "A14_01_READY(SEED-A14-01-CARD-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildCardPath(KNOWN_CARD_ID));
    expect200(res.status());
    const body = (await res.json()) as CardGetSuccessBody;
    expect("id" in body, "正常取得でカードマスタ情報が返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A14-01-020 同一GETの重複呼び出しで同一レスポンス（冪等参照）となる", async () => {
    test.skip(!HAS_API, "A14_01_READY(SEED-A14-01-CARD-KNOWN) 未設定");
    const ctx = await newCtx();
    const res1 = await ctx.get(buildCardPath(KNOWN_CARD_ID));
    const res2 = await ctx.get(buildCardPath(KNOWN_CARD_ID));
    // 参照系のため2回で同一のHTTPステータス・本文（副作用「無し（参照のみ）」）。
    expect(res1.status(), "2回の呼び出しで同一ステータス").toBe(res2.status());
    expect(await res1.text(), "2回の呼び出しで同一本文").toBe(await res2.text());
    await ctx.dispose();
  });

  test("E2E-A14-01-042 参照のみで副作用が無い（再取得で対象データ不変）", async () => {
    test.skip(!HAS_API, "A14_01_READY(SEED-A14-01-CARD-KNOWN) 未設定");
    const ctx = await newCtx();
    // 呼び出し前後で同一本文＝参照系で値が変化しない（副作用「無し（参照のみ）」・データ整合性「更新しない」）。
    const before = await ctx.get(buildCardPath(KNOWN_CARD_ID));
    await ctx.get(buildCardPath(KNOWN_CARD_ID));
    const after = await ctx.get(buildCardPath(KNOWN_CARD_ID));
    expect(await before.text(), "API前後で対象カードマスタの値が不変").toBe(await after.text());
    await ctx.dispose();
  });

  // ===== 配列/オブジェクト構造・公開対象外除外・null許容 =====

  test("E2E-A14-01-040 成功レスポンスの配列・オブジェクトフィールドが仕様どおり返る", async () => {
    test.skip(!HAS_API, "A14_01_READY(SEED-A14-01-CARD-KNOWN 配列/オブジェクト保持) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildCardPath(ARRAY_FIELD_CARD_ID));
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // cardtypes〜cardFormats は array・colorSequence は object（正本md 入出力 レスポンス(成功)）。
    for (const f of ARRAY_FIELDS) {
      expect(Array.isArray(body[f]), `${f} は array`).toBeTruthy();
    }
    expect(
      typeof body.colorSequence === "object" || body.colorSequence === null,
      "colorSequence は色順序情報の object（未設定時 null）"
    ).toBeTruthy();
    // 公開対象外フィールド（cardtags/keywordAbilities/articles/deckCards）が含まれないこと（混入は付帯表4#5で検出）。
    for (const f of PUBLIC_EXCLUDED_FIELDS) {
      expect(f in body, `公開対象外フィールド ${f} が応答に含まれない`).toBeFalsy();
    }
    await ctx.dispose();
  });

  test("E2E-A14-01-041 未設定の任意フィールドがnullで返る", async () => {
    test.skip(!HAS_API, "A14_01_READY(SEED-A14-01-CARD-KNOWN power/toughness/loyalty/colorSequence 未設定) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildCardPath(NULL_FIELD_CARD_ID));
    expect200(res.status());
    const body = (await res.json()) as CardGetSuccessBody;
    // power/toughness/loyalty が未設定のとき null・colorSequence が未設定のとき null（正本md サンプルレスポンスの null 例）。
    for (const f of NULLABLE_FIELDS) {
      expect(body[f], `${f} は未設定時 null`).toBeNull();
    }
    expect(body.colorSequence, "colorSequence は未設定時 null").toBeNull();
    await ctx.dispose();
  });

  // ===== 異常系・404分岐 =====

  test("E2E-A14-01-010 該当カードが無い場合に404 Not Found が返る", async () => {
    test.skip(!HAS_API, "A14_01_READY(SEED-A14-01-CARD-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildCardPath(NONE_CARD_ID));
    expect404(res.status());
    const body = (await res.json()) as CardGetErrorBody;
    // 404本文は {code, message}。message は仕様「Not Found」（実装「見つかりません」乖離＝付帯表4#3。期待値を実装文言へ寄せない）。
    expect(typeof body.code, "code を持つ").toBe("number");
    expect(body.message, "message=Not Found（仕様由来）").toBe(NOT_FOUND_MESSAGE);
    await ctx.dispose();
  });

  test("E2E-A14-01-011 異常なパラメータ値（id≦0）で正しいカードが取得されない", async () => {
    test.skip(!HAS_API, "A14_01_READY 未設定");
    const ctx = await newCtx();
    // id=0 は find が null で404・負値は要件 \d+ 不一致。具体ステータスは要実機確認のため200とならないことのみ判定。
    const resZero = await ctx.get(buildCardPath(ZERO_CARD_ID));
    expectNot200(resZero.status());
    const resNeg = await ctx.get(buildCardPath(NEGATIVE_CARD_ID));
    expectNot200(resNeg.status());
    await ctx.dispose();
  });

  test("E2E-A14-01-012 非数値（型不正）のカードIDで正しいカードが取得されない", async () => {
    test.skip(!HAS_API, "A14_01_READY 未設定");
    const ctx = await newCtx();
    // 非数値は int パス変数の要件 \d+ に不一致（具体ステータス＝ルート不一致/404等は要実機確認）。
    const res = await ctx.get(buildCardPath(NON_NUMERIC_CARD_ID));
    expectNot200(res.status());
    await ctx.dispose();
  });

  test("E2E-A14-01-015 エラー発生時に仕様のエラー応答（404 Not Found）が返る", async () => {
    test.skip(!HAS_API, "A14_01_READY(SEED-A14-01-CARD-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildCardPath(NONE_CARD_ID));
    expect404(res.status());
    const body = (await res.json()) as CardGetErrorBody;
    expect(typeof body.code, "code を持つ").toBe("number");
    expect(body.message, "message=Not Found（仕様由来）").toBe(NOT_FOUND_MESSAGE);
    await ctx.dispose();
  });

  test("E2E-A14-01-016 異常（該当なし）時のHTTPステータスが仕様の404と一致する", async () => {
    test.skip(!HAS_API, "A14_01_READY(SEED-A14-01-CARD-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildCardPath(NONE_CARD_ID));
    expect404(res.status());
    await ctx.dispose();
  });

  test("E2E-A14-01-019 異常系（不正値）受信時に正しいカードが取得されない", async () => {
    test.skip(!HAS_API, "A14_01_READY 未設定");
    const ctx = await newCtx();
    // 不正値（非数値）は正しいカードマスタ情報（200）を返さない（仕様の404は該当なしのみ・具体ステータスは要実機確認）。
    const res = await ctx.get(buildCardPath(NON_NUMERIC_CARD_ID));
    expectNot200(res.status());
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1/付帯表4） =====

  test.fixme(
    "E2E-A14-01-005 クライアントからの正常呼び出しで応答が処理結果と一致する（要実機確認: 認可方式未特定／付帯表4#2）",
    async () => {
      // 本エンドポイントは認可属性が無く（公開／CORS制御のみ・AbstractDeckBuilderController.php:51-72）、
      // 設計書の認可方式（pf-api 方針）が未特定のため正常呼び出しの可否前提を固定できず fixme。
      // 実装時は正常呼び出しで 200・カードマスタ情報が返ること（処理結果一致）を確認する。
      const ctx = await newCtx();
      const res = await ctx.get(buildCardPath(KNOWN_CARD_ID), { headers: buildNoAuthHeaders() });
      expect200(res.status());
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-01-014 想定外のクエリ項目を加えてもサーバエラーで停止しない（要実機確認: 無視可否が正本未定義／付帯表1）",
    async () => {
      // 想定外クエリの扱い（200で無視され正常取得と同一内容か）は正本に明記が無く要実機確認のため fixme。
      // 判定はサーバエラー(5xx)で停止しないことのみ（無視可否=200/同一内容は実機確認）。
      const ctx = await newCtx();
      const res = await ctx.get(buildCardPath(KNOWN_CARD_ID), { params: UNKNOWN_QUERY_PARAMS });
      expect(res.status(), "5xx で停止しない").toBeLessThan(500);
      await ctx.dispose();
    }
  );
});
