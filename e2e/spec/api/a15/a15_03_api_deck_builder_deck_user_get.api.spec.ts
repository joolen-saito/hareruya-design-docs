/**
 * a15-03 デッキビルダー_ユーザー取得（GET参照系JSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a15_03_api_deck_builder_deck_user_get_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装し、要実機確認修飾(014 想定外クエリ／041 認証後プレイヤー取得不可400)は
 * test.fixme（理由付き）で残す。手動（030 タイムアウト実再現）はケース表で全量管理し本specには書かない（規約）。
 * 本機能はブラウザ向け画面を持たない参照系GET API（正本md「ブラウザ向けの画面を持たない」）のためUI専用specは無い（全件API/統合）。
 *
 * 期待結果は仕様（設計書 a15-03・処理フロー・入出力・エラー処理）由来（オラクル独立性）。
 *  - 送信先は実装の実効パス `GET /api/user`（UserController.php:43／routes.yaml:6）。設計書 `GET /user` とは `/api` プレフィクスで不一致（付帯表4#1）。
 *  - 合否は HTTPステータス＋応答JSONのフィールド構成/型契約/既知値で判定（正常取得200／ヘッダ欠落・署名不正・該当なしは認証拒否401／認証後取得不可は入力不正400）。
 *  - 該当プレイヤーなし時のステータス（設計401／実装400＝付帯表4#3）・401/400メッセージ文言（英/日＝付帯表4#4/#5）・claim名 aud/sub（付帯表4#2）はオラクルにしない（落ちて検出）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_03_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  USER_PATH,
  buildValidHeaders,
  buildNullableHeaders,
  buildNoPlayerHeaders,
  buildInvalidHeaders,
  buildMissingHeaders,
  UNKNOWN_QUERY_PARAMS,
  SUCCESS_FIELDS,
  NULLABLE_FIELDS,
  ERROR_FIELDS,
  KNOWN_USER_NAME,
  KNOWN_PROFILE,
  KNOWN_DECK_USER_ID,
} from "../../../pages/api/a15/a15_03_api_deck_builder_deck_user_get.api";

const HAS_API = !!process.env.A15_03_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常取得＝200（設計: 入出力 レスポンス(成功)）").toBe(200);
}
function expect401(status: number) {
  // 設計: ヘッダ欠落・署名不正・該当プレイヤーなしは認証拒否＝401（処理フロー#2・入出力 レスポンス(失敗)）。
  expect(status, "認証拒否＝401（設計の意味で判定。実装の該当なし時400は付帯表4#3で検出）").toBe(401);
}

test.describe("API > デッキビルダー_ユーザー取得(GET参照系)", { tag: ["@api", "@a15"] }, () => {
  // ===== 正常取得（200・自分のユーザー情報JSON） =====

  test("E2E-A15-03-001 正常なjwt-tokenの指定で200と自分のユーザー情報JSONが返る", async () => {
    test.skip(!HAS_API, "A15_03_READY(SEED-A15-03-PLAYER-KNOWN/JWT-VALID) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { headers: buildValidHeaders() });
    expect200(res.status());
    const body = await res.json();
    // 本文に当該プレイヤーの user_name・profile・deck_user_id（SEED既知値）がJSONで返る（入出力 レスポンス(成功)）。
    expect(body.user_name, "user_name は SEED 既知値").toBe(KNOWN_USER_NAME);
    expect(body.profile, "profile は SEED 既知値").toBe(KNOWN_PROFILE);
    expect(body.deck_user_id, "deck_user_id は SEED 既知値").toBe(KNOWN_DECK_USER_ID);
    await ctx.dispose();
  });

  test("E2E-A15-03-002 正常取得時に取得時点の値が再計算・加工されず返る", async () => {
    test.skip(!HAS_API, "A15_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { headers: buildValidHeaders() });
    expect200(res.status());
    const body = await res.json();
    // 業務ルール「計算処理を行わない」: ニックネーム・プロフィール・デッキユーザーIDが丸め等の再計算を受けず、
    // DB／リポジトリ取得時点の値（SEED既知値）がそのまま返る（GetUserAction.php:50-52）。
    expect(body.user_name, "再計算されず取得時点の値").toBe(KNOWN_USER_NAME);
    expect(body.profile, "再計算されず取得時点の値").toBe(KNOWN_PROFILE);
    expect(body.deck_user_id, "再計算されず取得時点の値").toBe(KNOWN_DECK_USER_ID);
    await ctx.dispose();
  });

  test("E2E-A15-03-003 正常取得時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A15_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { headers: buildValidHeaders() });
    expect200(res.status()); // 入出力 レスポンス(成功)HTTP200。
    await ctx.dispose();
  });

  test("E2E-A15-03-004 jwt-tokenから特定したプレイヤーの情報を取得する", async () => {
    test.skip(!HAS_API, "A15_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { headers: buildValidHeaders() });
    expect200(res.status());
    const body = await res.json();
    // 処理フロー#2: token の顧客IDから特定したプレイヤー1件の情報が返り、別プレイヤーの情報が混在しない。
    // 特定プレイヤーの既知値で照合する（claim名 aud/sub の実体は付帯表4#2＝SEED生成時に要確認）。
    expect(body.deck_user_id, "token特定プレイヤー自身の deck_user_id").toBe(KNOWN_DECK_USER_ID);
    await ctx.dispose();
  });

  test("E2E-A15-03-005 認証済プレイヤーからの呼び出しで応答が処理結果と一致する", async () => {
    test.skip(!HAS_API, "A15_03_READY 未設定");
    const ctx = await newCtx();
    // 権限・認可: 認証済プレイヤーからの呼び出しが許可され、HTTPステータス・本文が処理結果（正常取得＝200）と一致する。
    const res = await ctx.get(USER_PATH, { headers: buildValidHeaders() });
    expect200(res.status());
    const body = await res.json();
    expect(body && typeof body === "object", "処理結果と一致するユーザー情報JSON").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A15-03-006 成功レスポンスが仕様のフィールド構成・型契約と一致する", async () => {
    test.skip(!HAS_API, "A15_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { headers: buildValidHeaders() });
    expect200(res.status());
    const body = await res.json();
    // 入出力 レスポンス(成功)由来の型契約: code・user_name・profile・deck_user_id（snake_case）を含み、
    //  code は integer(200)、user_name・profile・deck_user_id は string（未設定時null）（UserController.php:70-75）。
    for (const f of SUCCESS_FIELDS) {
      expect(body, `成功本文に ${f} を含む`).toHaveProperty(f);
    }
    expect(typeof body.code, "code は integer").toBe("number");
    expect(body.code, "code は 200").toBe(200);
    for (const f of NULLABLE_FIELDS) {
      const v = body[f];
      expect(["string", "object"].includes(typeof v), `${f} は string（未設定時null）`).toBeTruthy();
      if (v !== null) expect(typeof v, `${f} は string`).toBe("string");
    }
    await ctx.dispose();
  });

  // ===== 認証拒否（401・自分のユーザー情報を返さない） =====

  test("E2E-A15-03-007 jwt-tokenヘッダ欠落で正常取得とならず認証拒否（401）となる", async () => {
    test.skip(!HAS_API, "A15_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { headers: buildMissingHeaders() });
    // 必須の jwt-token ヘッダ欠落→InvalidTokenException→401（バリデーション・処理フロー#2／UserController.php:58-62）。
    expect401(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-03-008 異常な資格情報（欠落・署名不正）で許可されず正常取得とならない", async () => {
    test.skip(!HAS_API, "A15_03_READY 未設定");
    const ctx = await newCtx();
    // 権限・認可の負例: 欠落・署名不正の資格情報は許可せず認証拒否401・正常取得200を返さない（処理フロー#2）。
    const resInvalid = await ctx.get(USER_PATH, { headers: buildInvalidHeaders() });
    expect401(resInvalid.status());
    const resMissing = await ctx.get(USER_PATH, { headers: buildMissingHeaders() });
    expect401(resMissing.status());
    await ctx.dispose();
  });

  test("E2E-A15-03-010 audに該当するプレイヤーが無い場合に認証拒否（401）となる", async () => {
    test.skip(!HAS_API, "A15_03_READY(SEED-A15-03-JWT-NOPLAYER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { headers: buildNoPlayerHeaders() });
    // 処理フロー#2・入出力 レスポンス(失敗)401: aud顧客IDに該当プレイヤーが無い場合は認証拒否401。
    // 実装は PlayerNotFoundException→400 で返す（付帯表4#3）ため、設計401期待が落ちて乖離を検出する（期待値を実装400へ寄せない）。
    expect401(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-03-011 異常なパラメータ値（改ざんトークン）で正常取得とならない", async () => {
    test.skip(!HAS_API, "A15_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { headers: buildInvalidHeaders() });
    // 入出力 リクエスト（異常パラメータ）・処理フロー#2: 改ざん・検証不可のtokenは認証拒否401・正常取得200を返さない。
    expect401(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-03-013 jwt-tokenで特定したプレイヤー自身の情報のみが返る", async () => {
    test.skip(!HAS_API, "A15_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { headers: buildValidHeaders() });
    expect200(res.status());
    const body = await res.json();
    // 処理フロー#2・自分参照のみ: 返却 user_name・profile・deck_user_id が token顧客IDのプレイヤー自身の値のみで、
    // 他プレイヤーの情報が混在しない（findOneBy(['Customer' => (int)$sub])／GetUserAction.php:76）。SEED既知値で照合。
    expect(body.user_name, "自分の user_name のみ").toBe(KNOWN_USER_NAME);
    expect(body.profile, "自分の profile のみ").toBe(KNOWN_PROFILE);
    expect(body.deck_user_id, "自分の deck_user_id のみ").toBe(KNOWN_DECK_USER_ID);
    await ctx.dispose();
  });

  // ===== エラー応答（401本文・ステータス） =====

  test("E2E-A15-03-015 認証不可時に仕様のエラー応答（401・{code,message}）が返る", async () => {
    test.skip(!HAS_API, "A15_03_READY(SEED-A15-03-JWT-INVALID) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { headers: buildInvalidHeaders() });
    expect401(res.status());
    const body = await res.json();
    // エラー処理（認証拒否→{code,message}）。message は認証失敗を示す文言（具体文言の英/日差異は付帯表4#4で検出・固定しない）。
    for (const f of ERROR_FIELDS) {
      expect(body, `失敗本文に ${f} を含む`).toHaveProperty(f);
    }
    expect(typeof body.message, "message は文字列").toBe("string");
    await ctx.dispose();
  });

  test("E2E-A15-03-016 異常（認証不可）時のHTTPステータスが401である", async () => {
    test.skip(!HAS_API, "A15_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { headers: buildInvalidHeaders() });
    expect401(res.status()); // 入出力 レスポンス(失敗)401・HTTPステータス（UserController.php:60）。
    await ctx.dispose();
  });

  // ===== 通信・正常系・冪等参照 =====

  test("E2E-A15-03-017 正常通信で200応答が返る", async () => {
    test.skip(!HAS_API, "A15_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { headers: buildValidHeaders() });
    expect200(res.status()); // 入出力 レスポンス(成功)200。
    await ctx.dispose();
  });

  test("E2E-A15-03-018 対象条件に該当する正常値で200と自分のユーザー情報が返る", async () => {
    test.skip(!HAS_API, "A15_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { headers: buildValidHeaders() });
    expect200(res.status()); // 処理フロー#4・正常取得。
    const body = await res.json();
    expect(body && typeof body === "object", "正常取得のユーザー情報JSON").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A15-03-019 異常系（不正トークン）受信時に正常取得とならない", async () => {
    test.skip(!HAS_API, "A15_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { headers: buildInvalidHeaders() });
    // 入出力 レスポンス(失敗): 不正なjwt-token では正常取得200とならず認証拒否401（GetUserAction.php:65-69）。
    expect401(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-03-020 同一GETの重複呼び出しで同一レスポンス（冪等参照）となる", async () => {
    test.skip(!HAS_API, "A15_03_READY 未設定");
    const ctx = await newCtx();
    const r1 = await ctx.get(USER_PATH, { headers: buildValidHeaders() });
    const r2 = await ctx.get(USER_PATH, { headers: buildValidHeaders() });
    expect200(r1.status());
    expect200(r2.status());
    // 副作用「無し（参照のみ）」: 2回の HTTPステータス・本文が一致し DB更新の副作用が発生しない。
    expect(await r2.json(), "同一レスポンス本文").toEqual(await r1.json());
    await ctx.dispose();
  });

  // ===== 応答 null許容・副作用なし =====

  test("E2E-A15-03-040 未設定の項目がnullで返る", async () => {
    test.skip(!HAS_API, "A15_03_READY(SEED-A15-03-PLAYER-NULLABLE/JWT-VALID) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(USER_PATH, { headers: buildNullableHeaders() });
    expect200(res.status());
    const body = await res.json();
    // 入出力 レスポンス(成功) null定義・serialize_null 有効: user_name・profile・deck_user_id が未設定のとき各 null。
    for (const f of NULLABLE_FIELDS) {
      expect(body, `null許容フィールド ${f} を含む`).toHaveProperty(f);
      expect(body[f], `${f} は未設定時 null`).toBeNull();
    }
    await ctx.dispose();
  });

  test("E2E-A15-03-042 参照のみで副作用が無い（再取得で対象データ不変）", async () => {
    test.skip(!HAS_API, "A15_03_READY 未設定");
    const ctx = await newCtx();
    const before = await ctx.get(USER_PATH, { headers: buildValidHeaders() });
    expect200(before.status());
    const after = await ctx.get(USER_PATH, { headers: buildValidHeaders() });
    expect200(after.status());
    // 副作用「無し（参照のみ）」・DB操作は参照系のみ: 呼び出し前後で user_name・profile・deck_user_id が変化しない。
    expect(await after.json(), "参照前後で対象データ不変").toEqual(await before.json());
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1/付帯表4） =====

  test.fixme(
    "E2E-A15-03-014 想定外のクエリ項目を加えてもサーバエラーで停止しない（要実機確認: 無視可否／付帯表1）",
    async () => {
      // 期待は「未知のクエリ項目があってもサーバエラー(5xx)で停止しない」のみ（正本に想定外項目の扱いの明記なし）。
      // 200で無視され正常取得と同一となるか（UNKNOWN_QUERY_PARAMS 付与時の挙動）は要実機確認のため fixme。
      // deck_user_id 指定は他ユーザー参照分岐（UserController.php:50／GetUserAction.php:41-42・本書対象外）のため除く。
      void UNKNOWN_QUERY_PARAMS;
      void USER_PATH;
    }
  );

  test.fixme(
    "E2E-A15-03-041 認証は通ったが対象プレイヤーが取得できない場合に入力不正（400）となる（要実機確認: 状態再現／付帯表4#5）",
    async () => {
      // 期待は設計(処理フロー#3・入出力 レスポンス(失敗)400)由来＝入力不正400・本文 message が「Invalid request parameters」相当。
      // 「認証後に特定したプレイヤーが取得できない」状態（PlayerNotFoundException→400／UserController.php:63-67）の再現が
      // 要実機確認のため fixme。実装メッセージ文言の英/日差異は付帯表4#5（オラクルに固定しない）。
    }
  );
});
