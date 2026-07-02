/**
 * a15-07 デッキビルダー_アーキタイプ検索（フォーマットIDに紐づくアーキタイプ一覧を返すJSON API・GET参照系）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a15_07_api_deck_builder_deck_archetype_search_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装し、要実機確認修飾(009 想定外クエリ項目の扱い)は test.fixme（理由付き）で残す。
 * 手動（018 タイムアウト実再現）はケース表で全量管理し本specには書かない（規約）。
 * 本APIはブラウザ向け画面・管理画面反映を持たない（正本md「ブラウザ向けの画面を持たない」）ためUI専用specは無い＝全てAPI/統合レイヤで観測する。
 *
 * 期待結果は仕様（正本md a15-07・観点表・基本設計）由来（オラクル独立性）。実装のレスポンス形・FW既定値・ルート制約を期待値に流用しない。
 *  - 送信先は実装の実効パス `GET /api/archetypes/{formatId}`（ArchetypeController.php:38）。設計書 pf-api `GET /archetypes/{formatId}` とは `/api` プレフィクスで不一致（付帯表4#1）。
 *  - 合否（成功）は HTTP200＋本文 `{code, archetypes:[{id, name_jp, name_en}]}` を仕様型（code/id=integer・name_jp/name_en=string・snake_caseキー）で判定（ArchetypeController.php:55-58／DtbArchetypeRepository.php:138-143）。
 *  - 合否（フォーマット不存在）は HTTP404＋本文 `{code, message}`（message=仕様の「The format does not exist」）。実装文言は翻訳キー値で乖離（付帯表4#2）＝仕様文言を期待し違えば落として検出する。
 *  - 合否（アーキタイプ0件）は HTTP200＋ archetypes 空配列（観点表 データなし＝0件は正常系で空配列。フォーマット実在のため404ではない）。
 *  - 必須欠落(007)・不正値(016)・非数値(041)は「正常取得200とならない」のみを判定し、具体ステータスは要実機確認とする（付帯表4#4・未定義挙動を仕様化しない）。
 *  - 本APIは認証を行わない＝資格情報欠落/不正でも401を返さず200となる（005）。CORS/OPTIONS挙動（付帯表4#3）はGET主経路の合否に固定しない。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_07_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  ARCHETYPE_BASE_PATH,
  buildArchetypePath,
  MISSING_FORMAT_PATH,
  KNOWN_FORMAT_ID,
  EMPTY_FORMAT_ID,
  NONE_FORMAT_ID,
  NON_NUMERIC_FORMAT_ID,
  buildNoAuthHeaders,
  buildInvalidAuthHeaders,
  UNKNOWN_QUERY_PARAMS,
  EXPECTED_ARCHETYPE_ID,
  EXPECTED_ARCHETYPE_NAME_JP,
  EXPECTED_ARCHETYPE_NAME_EN,
  OTHER_FORMAT_ARCHETYPE_ID,
  NOT_FOUND_MESSAGE,
  ArchetypeSuccessBody,
  ArchetypeErrorBody,
} from "../../../pages/api/a15/a15_07_api_deck_builder_deck_archetype_search.api";

const HAS_API = !!process.env.A15_07_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常取得＝200（正本md: 処理フロー#4 取得結果を code・archetypes に包んで200）").toBe(200);
}
function expect404(status: number) {
  expect(status, "フォーマット不存在＝404（正本md: 処理フロー#2／入出力 レスポンス(失敗)）").toBe(404);
}
function expectNot200(status: number) {
  // 必須欠落/不正値/非数値は「正常取得200とならない」のみを判定。具体ステータス（ルート不一致/404/405等）は要実機確認（付帯表4#4）。
  expect(status, "正しいアーキタイプ一覧（正常取得=200）が取得されないこと（具体ステータスは要実機確認）").not.toBe(200);
}

test.describe("API > デッキビルダー_アーキタイプ検索(GET参照系)", { tag: ["@api", "@a15"] }, () => {
  // ===== 正常取得（IT-09: リクエスト・実行結果・HTTPステータス・外部取得） =====

  test("E2E-A15-07-001 正常なフォーマットIDの指定で200とアーキタイプ一覧JSONが返る", async () => {
    test.skip(!HAS_API, "A15_07_READY(SEED-A15-07-FORMAT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildArchetypePath(KNOWN_FORMAT_ID));
    expect200(res.status());
    const body = (await res.json()) as ArchetypeSuccessBody;
    // 当該フォーマットに属するアーキタイプ一覧が code・archetypes のラッパJSONで返る（ArchetypeController.php:55-58）。
    expect(typeof body.code, "code を持つ").toBe("number");
    expect(Array.isArray(body.archetypes), "archetypes 配列が返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A15-07-002 正常取得時に取得時点の値が再計算されず返る", async () => {
    test.skip(!HAS_API, "A15_07_READY(SEED-A15-07-FORMAT-KNOWN 既知値) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildArchetypePath(KNOWN_FORMAT_ID));
    expect200(res.status());
    const body = (await res.json()) as ArchetypeSuccessBody;
    // 業務ルール「取得後に業務値を再計算しない」＝SEED投入の既知レコード値とそのまま一致。値照合は env 期待値で行う（未設定なら要実機確認）。
    if (EXPECTED_ARCHETYPE_ID !== undefined) {
      const hit = body.archetypes.find((a) => String(a.id) === EXPECTED_ARCHETYPE_ID);
      expect(hit, "既知アーキタイプ(id一致)が含まれる").toBeTruthy();
      if (hit && EXPECTED_ARCHETYPE_NAME_JP !== undefined)
        expect(hit.name_jp, "name_jp が既知値とそのまま一致").toBe(EXPECTED_ARCHETYPE_NAME_JP);
      if (hit && EXPECTED_ARCHETYPE_NAME_EN !== undefined)
        expect(hit.name_en, "name_en が既知値とそのまま一致").toBe(EXPECTED_ARCHETYPE_NAME_EN);
    }
    await ctx.dispose();
  });

  test("E2E-A15-07-003 正常取得時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A15_07_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildArchetypePath(KNOWN_FORMAT_ID));
    expect200(res.status()); // 入出力 レスポンス(成功) HTTP200。
    await ctx.dispose();
  });

  test("E2E-A15-07-004 指定フォーマットに紐づくアーキタイプを取得する", async () => {
    test.skip(!HAS_API, "A15_07_READY(SEED-A15-07-FORMAT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildArchetypePath(KNOWN_FORMAT_ID));
    expect200(res.status());
    const body = (await res.json()) as ArchetypeSuccessBody;
    // 処理フロー#3: 指定フォーマットに属するアーキタイプが取得され、既知アーキタイプ識別子が含まれる（getDeckBuilderArchetypesByFormat＝DtbArchetypeRepository.php:136-149）。
    expect(body.archetypes.length, "紐づくアーキタイプが1件以上含まれる").toBeGreaterThanOrEqual(1);
    if (EXPECTED_ARCHETYPE_ID !== undefined) {
      const ids = body.archetypes.map((a) => String(a.id));
      expect(ids, "既知アーキタイプ識別子が含まれる").toContain(EXPECTED_ARCHETYPE_ID);
    }
    await ctx.dispose();
  });

  // ===== 資格情報（IT-32: 本APIは認証を行わない＝拒否されず200） =====

  test("E2E-A15-07-005 資格情報が欠落/不正でも認証拒否されず正常取得200となる", async () => {
    test.skip(!HAS_API, "A15_07_READY 未設定");
    const ctx = await newCtx();
    // 本APIは認証を行わない（IsGranted/トークン検証が実装に存在しない・ArchetypeController.php全体）。
    // 資格情報(jwt-token)欠落・無効でも認証起因の拒否(401)を返さず200でアーキタイプ一覧が返る。
    const missing = await ctx.get(buildArchetypePath(KNOWN_FORMAT_ID), { headers: buildNoAuthHeaders() });
    expect(missing.status(), "資格情報欠落でも401を返さない").not.toBe(401);
    expect200(missing.status());
    const invalid = await ctx.get(buildArchetypePath(KNOWN_FORMAT_ID), { headers: buildInvalidAuthHeaders() });
    expect(invalid.status(), "資格情報不正でも401を返さない").not.toBe(401);
    expect200(invalid.status());
    await ctx.dispose();
  });

  // ===== レスポンス構造・型契約（IT-32） =====

  test("E2E-A15-07-006 成功レスポンスが仕様のラッパ構造・フィールド構成・型契約と一致する", async () => {
    test.skip(!HAS_API, "A15_07_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildArchetypePath(KNOWN_FORMAT_ID));
    expect200(res.status());
    const body = (await res.json()) as ArchetypeSuccessBody;
    // ラッパ構造 code・archetypes。code は integer（成功時200）。
    expect(Number.isInteger(body.code), "code は integer").toBeTruthy();
    expect(Array.isArray(body.archetypes), "archetypes は array").toBeTruthy();
    // archetypes 各要素は id(integer)・name_jp(string)・name_en(string)、配列要素キーは snake_case。
    // name型の null 可否は付帯表4#5（仕様 string を基準にし実装注釈 string|null へ寄せない）。
    for (const a of body.archetypes) {
      expect(Number.isInteger(a.id), "id は integer").toBeTruthy();
      expect(typeof a.name_jp, "name_jp は string").toBe("string");
      expect(typeof a.name_en, "name_en は string").toBe("string");
      const keys = Object.keys(a as Record<string, unknown>);
      expect(keys, "配列要素キーは snake_case(name_jp)").toContain("name_jp");
      expect(keys, "配列要素キーは snake_case(name_en)").toContain("name_en");
    }
    await ctx.dispose();
  });

  // ===== 必須条件・異常パラメータ・データなし（IT-32） =====

  test("E2E-A15-07-007 パス変数（formatId）欠落で正しいアーキタイプ一覧が取得されない", async () => {
    test.skip(!HAS_API, "A15_07_READY 未設定");
    const ctx = await newCtx();
    // 必須パス変数 formatId 欠落（ArchetypeController.php:38）。仕様で固定される404は不存在時のみ・欠落時の具体ステータスは要実機確認（付帯表4#4）。
    const res = await ctx.get(MISSING_FORMAT_PATH);
    expectNot200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-07-008 異常なパラメータ値（存在しないformatId）で404が返る", async () => {
    test.skip(!HAS_API, "A15_07_READY(SEED-A15-07-FORMAT-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildArchetypePath(NONE_FORMAT_ID));
    expect404(res.status());
    const body = (await res.json()) as ArchetypeErrorBody;
    // 本文は {code, message}（message は仕様の「The format does not exist」）。実装文言の差異は付帯表4#2＝仕様文言を期待し違えば落として検出。
    expect(typeof body.code, "code を持つ").toBe("number");
    expect(body.message, "message=仕様文言(The format does not exist)").toBe(NOT_FOUND_MESSAGE);
    await ctx.dispose();
  });

  test("E2E-A15-07-010 フォーマット実在かつアーキタイプ0件で200と空配列が返る", async () => {
    test.skip(!HAS_API, "A15_07_READY(SEED-A15-07-FORMAT-EMPTY) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildArchetypePath(EMPTY_FORMAT_ID));
    // 観点表 データなし＝0件は正常系で空配列。フォーマットは実在するため404ではない。
    expect200(res.status());
    const body = (await res.json()) as ArchetypeSuccessBody;
    expect(Array.isArray(body.archetypes), "archetypes は配列").toBeTruthy();
    expect(body.archetypes.length, "archetypes は空配列(0件表現)").toBe(0);
    await ctx.dispose();
  });

  // ===== 受信検証（IT-32: 指定フォーマットに紐づくアーキタイプのみ） =====

  test("E2E-A15-07-011 指定フォーマットに紐づくアーキタイプのみが返る", async () => {
    test.skip(!HAS_API, "A15_07_READY(SEED-A15-07-FORMAT-KNOWN 他フォーマット併存) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildArchetypePath(KNOWN_FORMAT_ID));
    expect200(res.status());
    const body = (await res.json()) as ArchetypeSuccessBody;
    // 集計条件「パスのフォーマットに紐づくアーキタイプの全件」・format_idで絞り込み（where a.Format=:Format＝DtbArchetypeRepository.php:144-145）。
    // 指定フォーマット以外に属するアーキタイプ（別フォーマットの既知id）が混在しないこと。
    if (OTHER_FORMAT_ARCHETYPE_ID !== undefined) {
      const ids = body.archetypes.map((a) => String(a.id));
      expect(ids, "別フォーマットのアーキタイプは混在しない").not.toContain(OTHER_FORMAT_ARCHETYPE_ID);
    }
    await ctx.dispose();
  });

  // ===== エラー応答・HTTPステータス・通信・正常/異常系・重複順序（IT-10） =====

  test("E2E-A15-07-012 エラー発生時に仕様のエラー応答（404・code/message）が返る", async () => {
    test.skip(!HAS_API, "A15_07_READY(SEED-A15-07-FORMAT-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildArchetypePath(NONE_FORMAT_ID));
    expect404(res.status());
    const body = (await res.json()) as ArchetypeErrorBody;
    // エラー処理「指定フォーマットが存在しない→コード404・メッセージのJSON」。本文メッセージの実装差異は付帯表4#2。
    expect(typeof body.code, "code を持つ").toBe("number");
    expect(body.message, "message=仕様文言(The format does not exist)").toBe(NOT_FOUND_MESSAGE);
    await ctx.dispose();
  });

  test("E2E-A15-07-013 異常（フォーマット不存在）時のHTTPステータスが仕様の404と一致する", async () => {
    test.skip(!HAS_API, "A15_07_READY(SEED-A15-07-FORMAT-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildArchetypePath(NONE_FORMAT_ID));
    expect404(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-07-014 正常通信で200応答が返る", async () => {
    test.skip(!HAS_API, "A15_07_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildArchetypePath(KNOWN_FORMAT_ID));
    expect200(res.status()); // 通信成立・入出力 レスポンス(成功)200。
    await ctx.dispose();
  });

  test("E2E-A15-07-015 対象条件に該当する正常値で200とアーキタイプ一覧が返る", async () => {
    test.skip(!HAS_API, "A15_07_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildArchetypePath(KNOWN_FORMAT_ID));
    expect200(res.status());
    const body = (await res.json()) as ArchetypeSuccessBody;
    expect(Array.isArray(body.archetypes), "アーキタイプ一覧が返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A15-07-016 異常系（不正値）受信時に正しいアーキタイプ一覧が取得されない", async () => {
    test.skip(!HAS_API, "A15_07_READY(SEED-A15-07-FORMAT-NONE) 未設定");
    const ctx = await newCtx();
    // 不正値のフォーマットIDでは正常取得200とならない。仕様で固定される404は不存在時のみで具体ステータスは要実機確認（付帯表4#4）。
    const res = await ctx.get(buildArchetypePath(NONE_FORMAT_ID));
    expectNot200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-07-017 既定順で返り同一GETの重複呼び出しで同一レスポンスとなる", async () => {
    test.skip(!HAS_API, "A15_07_READY 未設定");
    const ctx = await newCtx();
    // 集計条件「並び順は明示なく既定順」・副作用「無し（参照のみ）」＝2回の呼び出しで同一HTTPステータス・本文（archetypesの順序含む）。
    const r1 = await ctx.get(buildArchetypePath(KNOWN_FORMAT_ID));
    const r2 = await ctx.get(buildArchetypePath(KNOWN_FORMAT_ID));
    expect(r1.status(), "1回目200").toBe(200);
    expect(r2.status(), "2回目も同一の200").toBe(r1.status());
    const b1 = (await r1.json()) as ArchetypeSuccessBody;
    const b2 = (await r2.json()) as ArchetypeSuccessBody;
    expect(JSON.stringify(b2), "本文(順序含む)が2回で同一").toBe(JSON.stringify(b1));
    await ctx.dispose();
  });

  // ===== 補完ケース（設計書由来・母集合外） =====

  test("E2E-A15-07-040 参照のみで副作用が無い（再取得で対象データ不変）", async () => {
    test.skip(!HAS_API, "A15_07_READY(SEED-A15-07-FORMAT-KNOWN) 未設定");
    const ctx = await newCtx();
    // 副作用「無し（参照のみ）」・DB操作は検索系のみ＝API呼び出し前後で対象アーキタイプの値(name_jp/name_en等)が変化しない。
    const before = await ctx.get(buildArchetypePath(KNOWN_FORMAT_ID));
    expect200(before.status());
    const b1 = (await before.json()) as ArchetypeSuccessBody;
    const after = await ctx.get(buildArchetypePath(KNOWN_FORMAT_ID));
    expect200(after.status());
    const b2 = (await after.json()) as ArchetypeSuccessBody;
    expect(JSON.stringify(b2.archetypes), "呼び出し前後で対象データ(archetypes値)が不変").toBe(
      JSON.stringify(b1.archetypes)
    );
    await ctx.dispose();
  });

  test("E2E-A15-07-041 非数値（型不正）のフォーマットIDで正しいアーキタイプ一覧が取得されない", async () => {
    test.skip(!HAS_API, "A15_07_READY 未設定");
    const ctx = await newCtx();
    // formatId が integer でない場合（requirements \d+ にルート不一致）は正常取得200とならない。
    // 仕様で固定される404は不存在時のみで、型不正時の具体ステータス（ルート不一致/404等）は要実機確認（付帯表4#4）。
    const res = await ctx.get(buildArchetypePath(NON_NUMERIC_FORMAT_ID));
    expectNot200(res.status());
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1/付帯表4） =====

  test.fixme(
    "E2E-A15-07-009 想定外のクエリ項目を加えてもサーバエラーで停止しない（要実機確認: 無視可否は正本に明記なし／付帯表1）",
    async () => {
      // 期待は「未知のクエリ項目があってもサーバエラー(5xx)で停止しないことのみ」（正本md: formatIdはパス変数で受領・クエリは未参照＝ArchetypeController.php:38-39）。
      // 想定外クエリ200固定（無視され正常取得と同一内容か）は正本に明記が無く期待値を固定できないため要実機確認＝fixme。
      // 実装時は ctx.get(buildArchetypePath(KNOWN_FORMAT_ID), { params: UNKNOWN_QUERY_PARAMS }) で 5xx でないことを確認する。
      void UNKNOWN_QUERY_PARAMS;
      void ARCHETYPE_BASE_PATH;
    }
  );
});
