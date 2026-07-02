/**
 * a15-16 デッキビルダー_直近イベント（直近に開催された大会の一覧〔大会日・フォーマット・大会名・参加者数〕を返す参照系 GET JSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a15_16_api_deck_builder_deck_recent_event_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を normal test として実装し、「E2E自動化(API/統合)（要実機確認）」修飾の 011/014 を test.fixme で置く。
 * 手動（030 取得処理中の例外・031 タイムアウト・032 DB接続障害＝いずれも外部依存の実再現が要実機確認）はケース表で全量管理し本specには書かない（規約）。
 * 本機能はブラウザ向け画面を持たないAPI（正本md「対象はJSON APIエンドポイントであり、ブラウザ向けの画面を持たない」）のためUI専用specは無い（自動化(UI)0件）。
 *
 * オラクル独立性: 期待結果は仕様（正本md＝設計書・観点表・基本設計）由来であり、実装のレスポンス形・型・日時整形・HTTPライブラリ既定値を期待値に流用しない。
 *  - effective path（実効パス）: `GET /api/recent_event`（DeckController.php:643）。正本md `GET /recent_event` は `/api` プレフィクスを欠き不一致（付帯表4#1）。
 *    テストは実効パスへ送信し、合否は設計の意味（直近大会一覧＝大会日・フォーマット・大会名・参加者数のJSON＋200／有効行のみ／id昇順／該当なしは空配列＋200／認証不要の公開参照系）で判定する。
 *  - 認証不要（DeckController.php:643-665 に認証属性なし）。jwt-token 欠落でも 200（005）。event_date のISO8601期待は付帯表4#2で実装の Y-m-d 乖離を検出。
 *  - 副作用なし（参照系）の不変・冪等は永続化先（mtb_latest_event_deck）の直接DB照合で判定する想定。本specはAPI応答を一次に確認し、DB副作用・抽出除外の同定はDB照査で補完（本リポでDBは実行しない）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_16_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildRecentEventPath,
  buildNoAuthHeaders,
  buildJwtHeaders,
  buildAbnormalParamQuery,
  buildUnknownItemQuery,
  EXPECTED_CODE,
  EVENT_FIELDS,
  ISO8601_DATETIME_PATTERN,
  isInteger,
} from "../../../pages/api/a15/a15_16_api_deck_builder_deck_recent_event.api";

const HAS_API = !!process.env.A15_16_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常取得＝200（正本md: 入出力 レスポンス(成功)HTTP200）").toBe(200);
}
function expectNot5xx(status: number) {
  // 本APIは入力パラメータを持たないため、異常値/想定外項目でもサーバエラー(5xx)で停止しないことのみ判定する（200無視は要実機確認）。
  expect(status, "5xxで停止しない（本APIは入力パラメータ非参照）").toBeLessThan(500);
}
async function expectBody(res: { json: () => Promise<unknown> }): Promise<{ code: unknown; events: unknown[] }> {
  const body = (await res.json()) as Record<string, unknown>;
  expect(body.code, "成功本文は code:200（snake_case ラッパ {code, events}）").toBe(EXPECTED_CODE);
  expect(Array.isArray(body.events), "events は配列（正本md: 一覧を events 配列で返却）").toBeTruthy();
  return { code: body.code, events: body.events as unknown[] };
}

test.describe("API > デッキビルダー_直近イベント", { tag: ["@api", "@a15"] }, () => {
  // ===== 正常取得（IT-09 / IT-10） =====

  test("E2E-A15-16-001 直近大会一覧の取得で200と大会一覧JSONが返る", async () => {
    test.skip(!HAS_API, "A15_16_READY(SEED-A15-16-EVENT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRecentEventPath(), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectBody(res); // code=200 と events 配列がJSONで返る。
    await ctx.dispose();
  });

  test("E2E-A15-16-002 正常取得時に取得時点の値が再計算されず返る", async () => {
    test.skip(!HAS_API, "A15_16_READY(SEED-A15-16-EVENT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRecentEventPath(), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectBody(res);
    // 大会日・参加者数等が丸め・補正されずDB／リポジトリ取得時点の値で返ること（業務ルール）は既知SEED値との一致＝DB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-16-003 正常取得時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A15_16_READY(SEED-A15-16-EVENT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRecentEventPath(), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-16-004 フォーマットマスタ結合でフォーマット名が返る", async () => {
    test.skip(!HAS_API, "A15_16_READY(SEED-A15-16-EVENT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRecentEventPath(), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const { events } = await expectBody(res);
    // 各大会に format_id・format_name_jp・format_name_en が含まれ、結合先の名称が返ること（集計条件）。結合先名称の値一致はDB照査で補完。
    for (const ev of events) {
      const e = ev as Record<string, unknown>;
      expect(e, "events 要素に format_id を含む").toHaveProperty("format_id");
      expect(e, "events 要素に format_name_jp を含む").toHaveProperty("format_name_jp");
      expect(e, "events 要素に format_name_en を含む").toHaveProperty("format_name_en");
    }
    await ctx.dispose();
  });

  // ===== 資格情報・必須条件・レスポンス・データなし（IT-32） =====

  test("E2E-A15-16-005 認証なし（jwt-token欠落）でも200で一覧が取得できる", async () => {
    test.skip(!HAS_API, "A15_16_READY(SEED-A15-16-EVENT-KNOWN) 未設定");
    const ctx = await newCtx();
    // jwt-token ヘッダなしで送信。本APIは認証を行わない公開参照系のため 401 とならず 200 取得（付帯表4#4: クライアント限定の制御手段は要確認のため固定しない）。
    const res = await ctx.get(buildRecentEventPath(), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectBody(res);
    await ctx.dispose();
  });

  test("E2E-A15-16-006 成功レスポンスが仕様のフィールド構成・型契約と一致する", async () => {
    test.skip(!HAS_API, "A15_16_READY(SEED-A15-16-EVENT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRecentEventPath(), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const { events } = await expectBody(res);
    expect(events.length, "型契約検証には1件以上の events が必要（SEED-KNOWN）").toBeGreaterThan(0);
    for (const ev of events) {
      const e = ev as Record<string, unknown>;
      for (const field of EVENT_FIELDS) {
        expect(e, `events 要素に ${field} を含む（snake_case）`).toHaveProperty(field);
      }
      // 型契約（正本md）。event_date は ISO8601 日時文字列を期待＝実装の Y-m-d（付帯表4#2）なら不一致で落ちて検出する（期待値を実装へ寄せない）。
      expect(typeof e.event_date, "event_date は string（ISO8601 日時文字列）").toBe("string");
      expect(String(e.event_date), "event_date は ISO8601 日時文字列（付帯表4#2: 実装の Y-m-d 乖離を検出）").toMatch(ISO8601_DATETIME_PATTERN);
      expect(isInteger(e.format_id), "format_id は integer").toBeTruthy();
      expect(isInteger(e.participants), "participants は integer").toBeTruthy();
      expect(typeof e.format_name_jp, "format_name_jp は string").toBe("string");
      expect(typeof e.format_name_en, "format_name_en は string").toBe("string");
      expect(typeof e.event_name_jp, "event_name_jp は string").toBe("string");
      expect(typeof e.event_name_en, "event_name_en は string").toBe("string");
    }
    await ctx.dispose();
  });

  test("E2E-A15-16-007 入力パラメータ無しのGETで200取得できる（必須入力なし）", async () => {
    test.skip(!HAS_API, "A15_16_READY(SEED-A15-16-EVENT-KNOWN) 未設定");
    const ctx = await newCtx();
    // クエリ・ボディを付けずに送信。本APIは必須入力を持たず正常取得（200）となること（処理フロー#1）。
    const res = await ctx.get(buildRecentEventPath(), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-16-010 条件に合致する大会が無い場合に空配列と200が返る", async () => {
    test.skip(!HAS_API, "A15_16_READY(SEED-A15-16-EVENT-NONE) 未設定");
    const ctx = await newCtx();
    // 有効大会が0件の状態。エラーとせず events＝空配列・code=200・HTTP200（エラー処理: 該当大会なし→空配列＋200）。
    const res = await ctx.get(buildRecentEventPath(), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const { events } = await expectBody(res);
    expect(events.length, "該当なしは空配列（[]）").toBe(0);
    await ctx.dispose();
  });

  // ===== 011/014: 異常パラメータ値・想定外項目（E2E自動化(API/統合)（要実機確認）＝test.fixme） =====

  test.fixme("E2E-A15-16-011 異常なパラメータ値を加えてもサーバエラーで停止しない（無視可否は要実機確認）", async () => {
    test.skip(!HAS_API, "A15_16_READY(SEED-A15-16-EVENT-KNOWN) 未設定");
    const ctx = await newCtx();
    // 本APIは入力パラメータを非参照。5xx で停止しないことのみ判定する。200で無視され正常取得と同一内容かは正本md未記載＝要実機確認のため固定しない。
    const res = await ctx.get(buildRecentEventPath(), { headers: buildNoAuthHeaders(), params: buildAbnormalParamQuery() });
    expectNot5xx(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-16-013 大会日設定済かつ大会名が空でない有効行のみが返る", async () => {
    test.skip(!HAS_API, "A15_16_READY(SEED-A15-16-EVENT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRecentEventPath(), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const { events } = await expectBody(res);
    // 返却各行は大会日が設定済かつ大会名（日本語・英語）がいずれも空でない有効行のみ（処理フロー#2・集計条件）。
    for (const ev of events) {
      const e = ev as Record<string, unknown>;
      expect(String(e.event_date ?? ""), "大会日が設定済（非空）の有効行のみ").not.toBe("");
      expect(String(e.event_name_jp ?? ""), "大会名(jp)が空でない有効行のみ").not.toBe("");
      expect(String(e.event_name_en ?? ""), "大会名(en)が空でない有効行のみ").not.toBe("");
    }
    await ctx.dispose();
  });

  test.fixme("E2E-A15-16-014 想定外項目を加えてもサーバエラーで停止しない（無視可否は要実機確認）", async () => {
    test.skip(!HAS_API, "A15_16_READY(SEED-A15-16-EVENT-KNOWN) 未設定");
    const ctx = await newCtx();
    // 未知の項目を加えても 5xx で停止しないことのみ判定する。200で無視され正常取得と同一内容かは正本md未記載＝要実機確認のため固定しない。
    const res = await ctx.get(buildRecentEventPath(), { headers: buildNoAuthHeaders(), params: buildUnknownItemQuery() });
    expectNot5xx(res.status());
    await ctx.dispose();
  });

  // ===== HTTPステータス・通信・正常・重複/順序（IT-10） =====

  test("E2E-A15-16-016 正常取得時のHTTPステータスが仕様の200と一致する", async () => {
    test.skip(!HAS_API, "A15_16_READY(SEED-A15-16-EVENT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRecentEventPath(), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-16-017 正常通信で200応答が返る", async () => {
    test.skip(!HAS_API, "A15_16_READY(SEED-A15-16-EVENT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRecentEventPath(), { headers: buildNoAuthHeaders() });
    expect200(res.status()); // 通信成立・成功＝200。
    await ctx.dispose();
  });

  test("E2E-A15-16-018 対象条件に該当する有効大会で200と一覧が返る", async () => {
    test.skip(!HAS_API, "A15_16_READY(SEED-A15-16-EVENT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRecentEventPath(), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectBody(res);
    await ctx.dispose();
  });

  test("E2E-A15-16-020 公開で利用者状態によらず同一結果（冪等参照）となる", async () => {
    test.skip(!HAS_API, "A15_16_READY(SEED-A15-16-EVENT-KNOWN) 未設定");
    const ctx = await newCtx();
    // 1回目=資格情報なし／2回目=資格情報あり。公開参照系のため利用者状態によらず同一のHTTPステータス・レスポンス本文が返ること（権限・認可）。
    const res1 = await ctx.get(buildRecentEventPath(), { headers: buildNoAuthHeaders() });
    const res2 = await ctx.get(buildRecentEventPath(), { headers: buildJwtHeaders() });
    expect200(res1.status());
    expect200(res2.status());
    const body1 = JSON.stringify(await res1.json());
    const body2 = JSON.stringify(await res2.json());
    // 結果キャッシュ反映遅延は付帯表4#5 要確認（キャッシュ無効化/キー隔離で抽出結果を確定する前提）。副作用（DB更新）が発生しないことはDB照査で補完（本リポでDBは実行しない）。
    expect(body2, "利用者状態によらず2回の呼び出しで同一レスポンス本文（冪等参照）").toBe(body1);
    await ctx.dispose();
  });

  // ===== 並び順・副作用なし・抽出除外（IT-09／IT-32 母集合外・設計書補完） =====

  test("E2E-A15-16-040 大会一覧が識別子の昇順で並ぶ", async () => {
    test.skip(!HAS_API, "A15_16_READY(SEED-A15-16-EVENT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRecentEventPath(), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectBody(res);
    // events が最新大会デッキマスタの識別子（id）昇順で並ぶこと（集計条件: orderBy id ASC）。
    // 応答に識別子（id）は含まれないため、既知SEEDの id 前後関係に対する並び順照合はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-16-041 参照のみで副作用が無い（再取得で対象データ不変）", async () => {
    test.skip(!HAS_API, "A15_16_READY(SEED-A15-16-EVENT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildRecentEventPath(), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    // API呼び出し前後で最新大会デッキマスタの値が変化しないこと（副作用なし・参照系）は呼び出し前後のDB値比較＝DB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-16-042 大会日が未設定の行は一覧に含まれない（除外）", async () => {
    test.skip(!HAS_API, "A15_16_READY(SEED-A15-16-EVENT-INVALID) 未設定");
    const ctx = await newCtx();
    // 大会日未設定の行を含む状態。当該行が events に含まれないこと（集計条件: eventDate IS NOT NULL）。
    const res = await ctx.get(buildRecentEventPath(), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const { events } = await expectBody(res);
    // 返却行はいずれも大会日が設定済（非空）。除外対象行（大会日NULL）が含まれないことの既知キー同定はDB照査で補完。
    for (const ev of events) {
      const e = ev as Record<string, unknown>;
      expect(String(e.event_date ?? ""), "大会日未設定の行は除外（返却行は大会日が非空）").not.toBe("");
    }
    await ctx.dispose();
  });

  test("E2E-A15-16-043 大会名が空の行は一覧に含まれない（除外）", async () => {
    test.skip(!HAS_API, "A15_16_READY(SEED-A15-16-EVENT-INVALID) 未設定");
    const ctx = await newCtx();
    // 大会名（日本語または英語）が空の行を含む状態。当該行が events に含まれないこと（集計条件: eventNameJp != '' かつ eventNameEn != ''）。
    const res = await ctx.get(buildRecentEventPath(), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const { events } = await expectBody(res);
    // 返却行はいずれも大会名（jp/en）が非空。除外対象行（大会名空）が含まれないことの既知キー同定はDB照査で補完。
    for (const ev of events) {
      const e = ev as Record<string, unknown>;
      expect(String(e.event_name_jp ?? ""), "大会名(jp)が空の行は除外（返却行は非空）").not.toBe("");
      expect(String(e.event_name_en ?? ""), "大会名(en)が空の行は除外（返却行は非空）").not.toBe("");
    }
    await ctx.dispose();
  });
});
