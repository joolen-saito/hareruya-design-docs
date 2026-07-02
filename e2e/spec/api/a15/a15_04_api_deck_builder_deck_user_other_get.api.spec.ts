/**
 * a15-04 デッキビルダー_他ユーザー取得（GET参照系JSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a15_04_api_deck_builder_deck_user_other_get_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装し、要実機確認修飾(009 想定外クエリの無視可否)は test.fixme（理由付き）で残す。
 * 手動（018 タイムアウト実再現・042 DB接続障害実再現）はケース表で全量管理し本specには書かない（規約）。
 * 本機能はブラウザ向け画面を持たない参照系GET API（正本md「ブラウザ向けの画面を持たない」）のためUI専用specは無い（全件API/統合）。
 *
 * 期待結果は仕様（設計書 a15-04・入出力・認証認可・エラー処理）由来（オラクル独立性）。実装のレスポンス形・型を期待値に流用しない。
 *  - 送信先は実装の実効パス `GET /api/user?deck_user_id={deckUserId}`（UserController.php:43,50。設計書 `GET /user?deck_user_id=...` とは
 *    `/api` プレフィクスで不一致＝付帯表4#1）。合否は設計書の意味で判定する。
 *  - 合否（成功）は HTTPステータス200＋本文 code(integer=200)/user_name/profile/deck_user_id(string・未設定時null・snake_case)。
 *  - 合否（該当なし）は 400＋本文 {code, message}（message=「Invalid request parameters」）。該当なしは404でなく400（処理フロー#3）。
 *    実メッセージ文言は翻訳辞書次第＝要確認（付帯表4#2）、失敗時 code の具体値も要確認（付帯表4#6）＝仕様どおり期待し違えば落として検出。
 *  - 本分岐は deck_user_id 指定時に token を検証せず、トークン欠落/無効でも200取得・401非発生（認証・認可／付帯表4#3）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_04_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  USER_PATH,
  buildUserParams,
  KNOWN_DECK_USER_ID,
  KNOWN_NULL_DECK_USER_ID,
  NONE_DECK_USER_ID,
  SEED_USER_NAME,
  SEED_PROFILE,
  INVALID_REQUEST_MESSAGE,
  UNKNOWN_QUERY_PARAMS,
  SUCCESS_FIELDS,
  STRING_OR_NULL_FIELDS,
  buildNoTokenHeaders,
  buildInvalidTokenHeaders,
} from "../../../pages/api/a15/a15_04_api_deck_builder_deck_user_other_get.api";

const HAS_API = !!process.env.A15_04_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "他ユーザー取得＝200（設計: 処理フロー#4 取得成功）").toBe(200);
}
function expect400(status: number) {
  // 設計: 該当なしは入力不正400（404でなく400・処理フロー#3）。仕様で固定されるのは「他ユーザー取得200」「該当なし400」のみ。
  expect(status, "該当なし＝400（設計: 処理フロー#3 入力不正）").toBe(400);
}

test.describe("API > デッキビルダー_他ユーザー取得(GET参照系)", { tag: ["@api", "@a15"] }, () => {
  // ===== 正常取得（200・公開向け情報JSON）IT-09 / IT-32 / IT-10 =====

  test("E2E-A15-04-001 正常なデッキユーザーIDの指定で200と公開情報JSONが返る", async () => {
    test.skip(!HAS_API, "A15_04_READY(SEED-A15-04-PLAYER-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { params: buildUserParams(KNOWN_DECK_USER_ID) });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 設計 入出力(成功): 当該 deck_user_id の公開向け情報（user_name・profile・deck_user_id）がJSONで返る。
    for (const k of ["user_name", "profile", "deck_user_id"]) {
      expect(Object.prototype.hasOwnProperty.call(body, k), `本文に ${k} が存在`).toBeTruthy();
    }
    await ctx.dispose();
  });

  test("E2E-A15-04-002 他ユーザー取得時に取得時点の値が再計算・加工されず返る", async () => {
    test.skip(!HAS_API, "A15_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { params: buildUserParams(KNOWN_DECK_USER_ID) });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 業務ルール「計算処理を行わない・取得時点の値」: user_name・profile・deck_user_id が再計算/表示加工されずSEED投入値のまま返る。
    expect(body.user_name, "user_name＝SEED投入値（加工なし）").toBe(SEED_USER_NAME);
    expect(body.profile, "profile＝SEED投入値（加工なし）").toBe(SEED_PROFILE);
    expect(body.deck_user_id, "deck_user_id＝指定値（加工なし）").toBe(String(KNOWN_DECK_USER_ID));
    await ctx.dispose();
  });

  test("E2E-A15-04-003 他ユーザー取得時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A15_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { params: buildUserParams(KNOWN_DECK_USER_ID) });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-04-004 デッキユーザーIDに一致するプレイヤーを引いて返す", async () => {
    test.skip(!HAS_API, "A15_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { params: buildUserParams(KNOWN_DECK_USER_ID) });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 処理フロー#2: findOneBy(['deckUserId'=>...])（GetUserAction.php:42）で指定IDに一致するプレイヤー1件が引かれる。
    expect(body.deck_user_id, "返却 deck_user_id が指定値と一致").toBe(String(KNOWN_DECK_USER_ID));
    expect(body.user_name, "一致プレイヤーの user_name が返る").toBe(SEED_USER_NAME);
    await ctx.dispose();
  });

  test("E2E-A15-04-005 jwt-token欠落/無効でもデッキユーザーID指定で200取得され401が発生しない", async () => {
    test.skip(!HAS_API, "A15_04_READY(SEED-A15-04-PLAYER-KNOWN/ENV) 未設定");
    const ctx = await newCtx();
    // 認証・認可「deck_user_idを指定する限り認証は行わない／401は発生しない」（GetUserAction.php:41-42・付帯表4#3）。
    // トークン欠落でも200取得・401非発生。
    const noToken = await ctx.get(USER_PATH, {
      params: buildUserParams(KNOWN_DECK_USER_ID),
      headers: buildNoTokenHeaders(),
    });
    expect(noToken.status(), "トークン欠落でも401が発生しない").not.toBe(401);
    expect200(noToken.status());
    // 無効トークンでも200取得・401非発生。
    const invalidToken = await ctx.get(USER_PATH, {
      params: buildUserParams(KNOWN_DECK_USER_ID),
      headers: buildInvalidTokenHeaders(),
    });
    expect(invalidToken.status(), "無効トークンでも401が発生しない").not.toBe(401);
    expect200(invalidToken.status());
    await ctx.dispose();
  });

  test("E2E-A15-04-006 成功レスポンスが仕様のフィールド構成・型契約と一致する", async () => {
    test.skip(!HAS_API, "A15_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { params: buildUserParams(KNOWN_DECK_USER_ID) });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 設計 入出力(成功): code・user_name・profile・deck_user_id が snake_case キーで含まれる（UserController.php:70-75）。
    for (const k of SUCCESS_FIELDS) {
      expect(Object.prototype.hasOwnProperty.call(body, k), `本文に ${k}（snake_case）が存在`).toBeTruthy();
    }
    // code は integer（成功時200）。キー名・型の実装差異は付帯表4#2/#6 で検出する。
    expect(Number.isInteger(body.code), "code は integer").toBeTruthy();
    expect(body.code, "成功時 code は 200").toBe(200);
    // user_name・profile・deck_user_id は string（未設定時 null 許容）。
    for (const k of STRING_OR_NULL_FIELDS) {
      const v = body[k];
      expect(typeof v === "string" || v === null, `${k} は string（未設定時null）`).toBeTruthy();
    }
    await ctx.dispose();
  });

  test("E2E-A15-04-007 deck_user_id指定で他ユーザー参照分岐に入る（指定有無で分岐）", async () => {
    test.skip(!HAS_API, "A15_04_READY 未設定");
    const ctx = await newCtx();
    // 処理フロー#1・利用者視点の入口（deck_user_id の有無で分岐）: deckUserId !== null で本分岐（GetUserAction.php:41-42）。
    // deck_user_id 指定時は認証を行わずプレイヤーを引いて200で返す。
    const res = await ctx.get(USER_PATH, { params: buildUserParams(KNOWN_DECK_USER_ID) });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.deck_user_id, "他ユーザー参照分岐で deck_user_id が返る").toBe(String(KNOWN_DECK_USER_ID));
    await ctx.dispose();
  });

  test("E2E-A15-04-008 指定デッキユーザーIDに一致する単一プレイヤーのみ返る", async () => {
    test.skip(!HAS_API, "A15_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { params: buildUserParams(KNOWN_DECK_USER_ID) });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 処理フロー#2「一致するプレイヤーを1件取得」・データ整合性「単一プレイヤーの参照のみ」: 一覧でなく単一オブジェクトで、
    // 返却 deck_user_id が指定値に一致し他プレイヤーが混在しない。
    expect(Array.isArray(body), "応答は配列(一覧)でない＝単一プレイヤー").toBe(false);
    expect(body.deck_user_id, "返却プレイヤーが指定 deck_user_id に一致").toBe(String(KNOWN_DECK_USER_ID));
    await ctx.dispose();
  });

  // ===== 該当なし（400・Invalid request parameters）IT-32 / IT-10 =====

  test("E2E-A15-04-010 該当するデッキユーザーIDが無い場合に400・Invalid request parameters が返る", async () => {
    test.skip(!HAS_API, "A15_04_READY(SEED-A15-04-PLAYER-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { params: buildUserParams(NONE_DECK_USER_ID) });
    expect400(res.status()); // 処理フロー#3: 該当なしは404でなく入力不正400（GetUserAction.php:45-47／UserController.php:63-67）。
    const body = (await res.json()) as Record<string, unknown>;
    // 設計 入出力(失敗): 本文は {code, message}・message は「Invalid request parameters」。
    // 実レンダリングは翻訳辞書次第（付帯表4#2）・失敗時 code 値は要確認（付帯表4#6）＝仕様どおり期待し違えば落として検出。
    expect(Object.prototype.hasOwnProperty.call(body, "code"), "本文に code が存在").toBeTruthy();
    expect(body.message, "message は「Invalid request parameters」").toBe(INVALID_REQUEST_MESSAGE);
    await ctx.dispose();
  });

  test("E2E-A15-04-011 異常なdeck_user_id値（該当なし）で正常取得200とならない", async () => {
    test.skip(!HAS_API, "A15_04_READY(SEED-A15-04-PLAYER-NONE) 未設定");
    const ctx = await newCtx();
    // バリデーション「形式・桁数の事前検証は行わず、一致なしは400」: 一致なし異常値では正常取得200とならず400となる。
    const res = await ctx.get(USER_PATH, { params: buildUserParams(NONE_DECK_USER_ID) });
    expect(res.status(), "異常値は正常取得200とならない").not.toBe(200);
    expect400(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-04-012 該当なしエラーで400とメッセージを含むJSONが返る", async () => {
    test.skip(!HAS_API, "A15_04_READY(SEED-A15-04-PLAYER-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { params: buildUserParams(NONE_DECK_USER_ID) });
    expect400(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // エラー処理「該当なし→入力不正400」: {code, message} の JSON で message を含む（メッセージ形は付帯表4#2／code値は付帯表4#6）。
    expect(Object.prototype.hasOwnProperty.call(body, "code"), "本文に code が存在").toBeTruthy();
    expect(body.message, "message（「Invalid request parameters」）を含む").toBe(INVALID_REQUEST_MESSAGE);
    await ctx.dispose();
  });

  test("E2E-A15-04-013 異常（該当なし）時のHTTPステータスが仕様の400と一致する", async () => {
    test.skip(!HAS_API, "A15_04_READY(SEED-A15-04-PLAYER-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { params: buildUserParams(NONE_DECK_USER_ID) });
    expect400(res.status()); // 該当なしは404でなく400。
    await ctx.dispose();
  });

  // ===== 通信・正常系・異常系・冪等参照（IT-10） =====

  test("E2E-A15-04-014 正常通信で200応答が返る", async () => {
    test.skip(!HAS_API, "A15_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { params: buildUserParams(KNOWN_DECK_USER_ID) });
    expect200(res.status()); // 通信成立・正常取得200。
    await ctx.dispose();
  });

  test("E2E-A15-04-015 対象条件に該当する正常値で200と公開情報が返る", async () => {
    test.skip(!HAS_API, "A15_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { params: buildUserParams(KNOWN_DECK_USER_ID) });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 処理フロー#4・正常取得: 公開向け情報（user_name・profile・deck_user_id）が返る。
    expect(body.user_name, "user_name が返る").toBe(SEED_USER_NAME);
    expect(body.deck_user_id, "deck_user_id が返る").toBe(String(KNOWN_DECK_USER_ID));
    await ctx.dispose();
  });

  test("E2E-A15-04-016 異常系（不正／該当なし値）で正常取得200とならない", async () => {
    test.skip(!HAS_API, "A15_04_READY(SEED-A15-04-PLAYER-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { params: buildUserParams(NONE_DECK_USER_ID) });
    expect(res.status(), "不正・該当なしは正常取得200とならない").not.toBe(200);
    expect400(res.status()); // 入力不正400。
    await ctx.dispose();
  });

  test("E2E-A15-04-017 同一GETの重複呼び出しで同一レスポンス（冪等参照）となる", async () => {
    test.skip(!HAS_API, "A15_04_READY 未設定");
    const ctx = await newCtx();
    const r1 = await ctx.get(USER_PATH, { params: buildUserParams(KNOWN_DECK_USER_ID) });
    const r2 = await ctx.get(USER_PATH, { params: buildUserParams(KNOWN_DECK_USER_ID) });
    expect200(r1.status());
    expect200(r2.status());
    // 副作用「無し（参照のみ）」: 2回の HTTPステータス・本文が一致しDB更新の副作用が発生しない。
    expect(await r2.json(), "2回の応答本文が一致（冪等参照）").toEqual(await r1.json());
    await ctx.dispose();
  });

  // ===== 補完ケース（設計書由来・母集合外） =====

  test("E2E-A15-04-040 未設定の項目がnullで返る（serialize_null）", async () => {
    test.skip(!HAS_API, "A15_04_READY(SEED-A15-04-PLAYER-KNOWN null用) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { params: buildUserParams(KNOWN_NULL_DECK_USER_ID) });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 入出力 レスポンス(成功)「未設定の場合はnull」・serialize_null有効: nickname・profile 未設定プレイヤーで user_name・profile が null。
    expect(body.user_name, "未設定 user_name は null").toBeNull();
    expect(body.profile, "未設定 profile は null").toBeNull();
    expect(body.deck_user_id, "deck_user_id は指定値が返る").toBe(String(KNOWN_NULL_DECK_USER_ID));
    await ctx.dispose();
  });

  test("E2E-A15-04-041 参照のみで副作用が無い（再取得で対象データ不変）", async () => {
    test.skip(!HAS_API, "A15_04_READY 未設定");
    const ctx = await newCtx();
    // 副作用「無し（参照のみ）」・DB操作は検索のみ（GetUserAction.php:41-53）: 呼び出し前後で対象プレイヤーの公開情報が変化しない。
    const before = await ctx.get(USER_PATH, { params: buildUserParams(KNOWN_DECK_USER_ID) });
    expect200(before.status());
    const after = await ctx.get(USER_PATH, { params: buildUserParams(KNOWN_DECK_USER_ID) });
    expect200(after.status());
    expect(await after.json(), "参照前後で user_name・profile・deck_user_id が不変").toEqual(await before.json());
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1） =====

  test.fixme(
    "E2E-A15-04-009 想定外のクエリ項目を加えてもサーバエラーで停止しない（要実機確認: 無視可否／付帯表1）",
    async () => {
      // 期待は「未知クエリ項目があっても 5xx で停止しない」のみ（正本に想定外クエリ項目の扱いの明記なし）。
      // 200で無視され正常取得と同一内容となるか（UNKNOWN_QUERY_PARAMS 付与時の挙動）は要実機確認のため fixme。
      void USER_PATH;
      void UNKNOWN_QUERY_PARAMS;
      void buildUserParams;
      void KNOWN_DECK_USER_ID;
    }
  );
});
