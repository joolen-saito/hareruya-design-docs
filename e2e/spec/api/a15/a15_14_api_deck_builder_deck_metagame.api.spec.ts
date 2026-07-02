/**
 * a15-14 デッキビルダー_メタゲーム（指定フォーマットのアーキタイプ別大会デッキ件数と占有率を返す JSON API・GET参照系）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a15_14_api_deck_builder_deck_metagame_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装する。要実機確認の修飾子が付く 006（想定外クエリの無視可否）・045（from_date 書式の意味＝付帯表4#4）は test.fixme。
 * 手動（015 タイムアウト実再現・048 DB障害実再現＝いずれも要実機確認）はケース表で全量管理し本specには書かない（規約）。
 * 本機能はブラウザ向け画面を持たないAPI（正本md「対象はJSON APIエンドポイントであり、ブラウザ向けの画面を持たない」）のためUI専用specは無い（自動化(UI)0件）。
 *
 * 期待結果は仕様（正本md＝設計書・観点表・基本設計）由来（オラクル独立性）。実装のレスポンス形・FW既定値・エラーメッセージ文言を期待値に流用しない。
 *  - 送信先は実装の実効パス `GET /api/metagame`（DeckController.php:556／routes.yaml:5-7・認証属性なし）。正本md `GET /metagame` は `/api` プレフィクスを欠き不一致（付帯表4#1）。
 *  - 本APIは認証を行わない公開参照系（正本md）。合否は設計書の意味で判定する：正常集計＝formats配列＋200／format_id未指定＝400／一致フォーマットなし＝404／集計対象0件＝200空archetypes／count で上位件絞り込み／rate は小数第2位。
 *  - 400/404 の message は正本md文言（「invalid request parameter」「format not found」）を期待し、実装文言と違えば落として検出する（付帯表4#2/#3。実装文言へ寄せない）。
 *  - 集計値（deck_count の既知件数・公開/大会のみ絞り込み・降順・占有率の実値）はDB照合で確定するため、本specはAPI応答の構造/型/関係を一次に置き、既知件数の確定値照合は「DB照査で補完」（本リポでDBは実行しない）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_14_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildMetagamePath,
  buildMetagamePathMulti,
  buildMetagamePathWithCount,
  buildMetagamePathNoFormatId,
  buildMetagamePathWithUnknownQuery,
  buildNoAuthHeaders,
  buildAltClientHeaders,
  FORMAT_ID,
  COUNT_LIMIT,
  FORMAT_FIELDS,
  ARCHETYPE_FIELDS,
  TYPE_ORACLE,
  FROM_DATE_PATTERN,
  SPEC_ERROR_MESSAGE,
} from "../../../pages/api/a15/a15_14_api_deck_builder_deck_metagame.api";

const HAS_API = !!process.env.A15_14_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常集計＝200（正本md: 入出力 レスポンス（成功）HTTP200）").toBe(200);
}
function expect400(status: number) {
  expect(status, "format_id未指定＝400（正本md: 処理フロー#1・入力不正）").toBe(400);
}
function expect404(status: number) {
  expect(status, "一致フォーマットなし＝404（正本md: 処理フロー#2・データなし）").toBe(404);
}
function expectNotServerError(status: number) {
  // 想定外クエリでもサーバエラー(5xx)で停止しないことのみを判定（006・正本に200固定の明記なし＝要実機確認）。
  expect(status, "想定外クエリでも5xxで停止しない").toBeLessThan(500);
}

async function readBody(res: { json: () => Promise<unknown> }): Promise<Record<string, unknown>> {
  return (await res.json()) as Record<string, unknown>;
}

/** 成功本文の formats を配列として取り出す（正本md: トップレベル {code, formats}）。 */
async function readFormats(res: { json: () => Promise<unknown> }): Promise<Array<Record<string, unknown>>> {
  const body = await readBody(res);
  expect(Array.isArray(body.formats), "成功本文は formats 配列を含む（正本md: 入出力 レスポンス（成功））").toBeTruthy();
  return body.formats as Array<Record<string, unknown>>;
}

/** 先頭 format の archetypes を配列として取り出す。 */
function readArchetypes(format: Record<string, unknown>): Array<Record<string, unknown>> {
  expect(Array.isArray(format.archetypes), "formats[].archetypes は配列（正本md: 集計単位 archetype）").toBeTruthy();
  return format.archetypes as Array<Record<string, unknown>>;
}

/** 失敗本文が {code, message} 形式で、message が正本md文言を含むことを照合（実装文言の乖離は付帯表4で記録）。 */
async function expectErrorBody(res: { json: () => Promise<unknown> }, specMessage: string, why: string) {
  const body = await readBody(res);
  expect(Object.prototype.hasOwnProperty.call(body, "code"), "失敗本文に code を含む（正本md {code,message}）").toBeTruthy();
  expect(Object.prototype.hasOwnProperty.call(body, "message"), "失敗本文に message を含む（正本md {code,message}）").toBeTruthy();
  // message 文言は正本md由来で照合。実装文言（付帯表4#2/#3）と違えば落として検出する（実装へ寄せない）。
  expect(JSON.stringify(body), why).toContain(specMessage);
}

test.describe("API > デッキビルダー_メタゲーム", { tag: ["@api", "@a15"] }, () => {
  // ===== 認証なし公開参照系・正常集計（IT-32 / IT-09 / IT-10） =====

  test("E2E-A15-14-001 認証なしのクライアントから呼び出せ200と集計JSONが返る", async () => {
    test.skip(!HAS_API, "A15_14_READY(SEED-A15-14-FORMAT-METAGAME) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePath(FORMAT_ID.METAGAME), { headers: buildNoAuthHeaders() });
    expect200(res.status()); // 認証なしでも許可（正本md: 本APIは認証を行わない参照系）。
    await readFormats(res); // 当該フォーマットのメタゲーム集計（formats配列）が返る。
    await ctx.dispose();
  });

  test("E2E-A15-14-002 集計結果が取得時点の値で返り再計算・補正されない", async () => {
    test.skip(!HAS_API, "A15_14_READY(SEED-A15-14-FORMAT-METAGAME) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePath(FORMAT_ID.METAGAME), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const formats = await readFormats(res);
    const archetypes = readArchetypes(formats[0]);
    // 業務ルール: deck_count は集計時点の件数がそのまま返り、レスポンス生成時の補正を行わない（rate のみ占有率算出）。
    for (const a of archetypes) {
      expect(Number.isInteger(a.deck_count), "deck_count は integer（集計時点の件数・補正なし）").toBeTruthy();
    }
    // deck_count が DB／リポジトリ集計時点の件数と一致（補正なし）であることの確定値照合はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-14-003 正常集計時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A15_14_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePath(FORMAT_ID.METAGAME), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-14-004 正常な format_id で archetypes を含む200集計が返る", async () => {
    test.skip(!HAS_API, "A15_14_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePath(FORMAT_ID.METAGAME), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const formats = await readFormats(res);
    readArchetypes(formats[0]); // アーキタイプ別集計（formats[].archetypes）を含む。
    await ctx.dispose();
  });

  test("E2E-A15-14-005 異常な format_id 値（不正・非数値）で404該当なしが返る", async () => {
    test.skip(!HAS_API, "A15_14_READY(SEED-A15-14-FORMAT-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePath(FORMAT_ID.NON_NUMERIC), { headers: buildNoAuthHeaders() });
    expect404(res.status()); // 一致フォーマットなし＝404（正本md 処理フロー#2）。正常集計（200・formats配列）とならない。
    await expectErrorBody(res, SPEC_ERROR_MESSAGE.FORMAT_NOT_FOUND, "404本文に「format not found」を含む（正本md文言・実装乖離=付帯表4#3）");
    await ctx.dispose();
  });

  // E2E-A15-14-006: 想定外クエリ項目の無視可否は正本に明記なし＝要実機確認（付帯表1 修飾子）→ test.fixme
  test.fixme("E2E-A15-14-006 想定外のクエリ項目を加えてもサーバエラーで停止しない", async () => {
    test.skip(!HAS_API, "A15_14_READY(SEED-A15-14-FORMAT-METAGAME) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePathWithUnknownQuery(FORMAT_ID.METAGAME), { headers: buildNoAuthHeaders() });
    expectNotServerError(res.status()); // 5xxで停止しないことのみを判定。count 非数値は追加検証なし仕様。想定外項目が無視され正常集計と同一になるかは要実機確認。
    await ctx.dispose();
  });

  test("E2E-A15-14-008 format_id未指定で400と {code, message} エラーJSONが返る", async () => {
    test.skip(!HAS_API, "A15_14_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePathNoFormatId(), { headers: buildNoAuthHeaders() });
    expect400(res.status());
    await expectErrorBody(res, SPEC_ERROR_MESSAGE.FORMAT_ID_REQUIRED, "400本文に「invalid request parameter」を含む（正本md文言・実装乖離=付帯表4#2）");
    await ctx.dispose();
  });

  // ===== 集計取得・受信検証（IT-09 / IT-32） =====

  test("E2E-A15-14-024 公開・大会・集計範囲内のデッキをアーキタイプ別に集計取得する", async () => {
    test.skip(!HAS_API, "A15_14_READY(SEED-A15-14-FORMAT-METAGAME) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePath(FORMAT_ID.METAGAME), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const formats = await readFormats(res);
    const archetypes = readArchetypes(formats[0]);
    for (const a of archetypes) {
      expect(Number.isInteger(a.deck_count), "archetypes[].deck_count は archetype 別の件数（integer）").toBeTruthy();
    }
    // 集計範囲（メタ範囲日数前0時〜本日23:59:59）内の公開区分=公開かつデッキ種別=大会のみが archetype_id 別に集計された既知件数との一致はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-14-025 一致フォーマットなし時のHTTPステータスが404である", async () => {
    test.skip(!HAS_API, "A15_14_READY(SEED-A15-14-FORMAT-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePath(FORMAT_ID.UNREGISTERED), { headers: buildNoAuthHeaders() });
    expect404(res.status()); // 該当なし＝404（正本md: 入出力 レスポンス（失敗）404）。
    await ctx.dispose();
  });

  test("E2E-A15-14-026 正常通信で200応答が返る", async () => {
    test.skip(!HAS_API, "A15_14_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePath(FORMAT_ID.METAGAME), { headers: buildNoAuthHeaders() });
    expect200(res.status()); // 通信成立・成功＝200。
    await ctx.dispose();
  });

  test("E2E-A15-14-027 対象条件に該当する正常値で200と集計結果が返る", async () => {
    test.skip(!HAS_API, "A15_14_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePath(FORMAT_ID.METAGAME), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await readFormats(res); // フォーマット別・アーキタイプ別の集計結果。
    await ctx.dispose();
  });

  test("E2E-A15-14-030 format_id未指定の異常リクエストで400エラー応答となる", async () => {
    test.skip(!HAS_API, "A15_14_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePathNoFormatId(), { headers: buildNoAuthHeaders() });
    expect400(res.status());
    await expectErrorBody(res, SPEC_ERROR_MESSAGE.FORMAT_ID_REQUIRED, "400本文に「invalid request parameter」を含む（正本md文言・付帯表4#2）");
    await ctx.dispose();
  });

  test("E2E-A15-14-031 必須パラメータ format_id 未指定で正常集計とならず400となる", async () => {
    test.skip(!HAS_API, "A15_14_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePathNoFormatId(), { headers: buildNoAuthHeaders() });
    expect400(res.status()); // 正常集計（200・formats配列）が取得されず入力不正（400）となる。
    await ctx.dispose();
  });

  test("E2E-A15-14-032 成功レスポンスが仕様のフィールド構成・型契約と一致する", async () => {
    test.skip(!HAS_API, "A15_14_READY(SEED-A15-14-FORMAT-METAGAME) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePath(FORMAT_ID.METAGAME), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const body = await readBody(res);
    expect(Number.isInteger(body.code), "code は integer（正本md 型契約）").toBeTruthy();
    const formats = await readFormats(res);
    for (const f of FORMAT_FIELDS) {
      expect(Object.prototype.hasOwnProperty.call(formats[0], f), `formats[] に snake_case フィールド ${f} を含む`).toBeTruthy();
    }
    expect(typeof formats[0].from_date, "from_date は string（Y/m/d h:m:s）").toBe("string");
    const archetypes = readArchetypes(formats[0]);
    const a = archetypes[0];
    for (const f of ARCHETYPE_FIELDS) {
      expect(Object.prototype.hasOwnProperty.call(a, f), `archetypes[] に snake_case フィールド ${f} を含む`).toBeTruthy();
    }
    for (const f of TYPE_ORACLE.INTEGER_FIELDS) {
      expect(Number.isInteger(a[f]), `${f} は integer（正本md 型契約）`).toBeTruthy();
    }
    for (const f of TYPE_ORACLE.STRING_FIELDS) {
      expect(typeof a[f], `${f} は string（正本md 型契約）`).toBe("string");
    }
    expect(["string", "object"], "card_image は string（未設定時null＝serialize_null 有効）").toContain(typeof a.card_image);
    expect(typeof a.rate, "rate は number（百分率・小数第2位）").toBe("number");
    await ctx.dispose();
  });

  test("E2E-A15-14-033 一致するフォーマットが1件も無い場合に404 Not Found が返る", async () => {
    test.skip(!HAS_API, "A15_14_READY(SEED-A15-14-FORMAT-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePath(FORMAT_ID.UNREGISTERED), { headers: buildNoAuthHeaders() });
    expect404(res.status());
    await expectErrorBody(res, SPEC_ERROR_MESSAGE.FORMAT_NOT_FOUND, "404本文に「format not found」を含む（正本md文言・付帯表4#3）");
    await ctx.dispose();
  });

  test("E2E-A15-14-036 公開・大会デッキのみが集計対象となり非公開・非大会は除外される", async () => {
    test.skip(!HAS_API, "A15_14_READY(SEED-A15-14-FORMAT-METAGAME) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePath(FORMAT_ID.METAGAME), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const formats = await readFormats(res);
    readArchetypes(formats[0]);
    // 公開区分=公開かつデッキ種別=大会のデッキのみが件数集計され、非公開・大会以外・集計範囲外が deck_count に含まれないこと（既知件数との照合）はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  // ===== 重複・順序（冪等参照・副作用なし）（IT-10） =====

  test("E2E-A15-14-037 利用者状態によらず同一の集計結果が返る（冪等参照・副作用なし）", async () => {
    test.skip(!HAS_API, "A15_14_READY(SEED-A15-14-FORMAT-METAGAME) 未設定");
    const ctx = await newCtx();
    const res1 = await ctx.get(buildMetagamePath(FORMAT_ID.METAGAME), { headers: buildNoAuthHeaders() });
    const res2 = await ctx.get(buildMetagamePath(FORMAT_ID.METAGAME), { headers: buildAltClientHeaders() });
    expect200(res1.status());
    expect(res2.status(), "2回目（別状態）も同一のHTTPステータス（冪等参照）").toBe(res1.status());
    const body1 = JSON.stringify(await readBody(res1));
    const body2 = JSON.stringify(await readBody(res2));
    expect(body2, "利用者状態によらず同一の集計結果（公開デッキのみ集計）").toBe(body1);
    // 参照系のためDB更新の副作用が発生しないこと（副作用「無し（参照のみ）」）はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  // ===== 集計0件・件数制限・占有率・並び順・型（IT-09/IT-32 母集合外・設計書補完） =====

  test("E2E-A15-14-040 集計対象0件でも一致フォーマットありで200・空archetypesが返る", async () => {
    test.skip(!HAS_API, "A15_14_READY(SEED-A15-14-FORMAT-EMPTY) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePath(FORMAT_ID.EMPTY), { headers: buildNoAuthHeaders() });
    expect200(res.status()); // 一致フォーマットは存在するため404ではなく200（一致なし404と区別）。
    const formats = await readFormats(res);
    const archetypes = readArchetypes(formats[0]);
    expect(archetypes.length, "集計対象0件のフォーマットは archetypes が空配列").toBe(0);
    await ctx.dispose();
  });

  test("E2E-A15-14-041 count 指定でフォーマットごとに上位 count 件のアーキタイプに絞り込まれる", async () => {
    test.skip(!HAS_API, "A15_14_READY(SEED-A15-14-FORMAT-METAGAME) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePathWithCount(FORMAT_ID.METAGAME, COUNT_LIMIT), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const formats = await readFormats(res);
    const archetypes = readArchetypes(formats[0]);
    expect(archetypes.length, "上位 count 件に絞り込まれる（件数 ≤ count）").toBeLessThanOrEqual(COUNT_LIMIT);
    // 件数降順で上位 count 件が選ばれること（どの archetype が残るか）の確定値照合はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-14-042 count 未指定時はアーキタイプが全件返る", async () => {
    test.skip(!HAS_API, "A15_14_READY(SEED-A15-14-FORMAT-METAGAME) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePath(FORMAT_ID.METAGAME), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const formats = await readFormats(res);
    const archetypes = readArchetypes(formats[0]);
    expect(archetypes.length, "count 未指定はフォーマット内の全アーキタイプが返る").toBeGreaterThan(COUNT_LIMIT);
    // 全件であること（フォーマット内アーキタイプ総数との一致）の確定値照合はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-14-043 占有率（rate）が百分率・小数第2位で算出される", async () => {
    test.skip(!HAS_API, "A15_14_READY(SEED-A15-14-FORMAT-METAGAME) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePath(FORMAT_ID.METAGAME), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const formats = await readFormats(res);
    const archetypes = readArchetypes(formats[0]);
    for (const a of archetypes) {
      const rate = a.rate as number;
      expect(typeof rate, "rate は number（百分率）").toBe("number");
      expect(Math.round(rate * 100) / 100, "rate は小数第2位までに丸められている").toBe(rate);
    }
    // 各 rate が「フォーマット内全アーキタイプ件数合計を分母とした件数の百分率（小数第2位四捨五入）」と一致する確定値照合はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-14-044 アーキタイプがデッキ件数の降順で並ぶ", async () => {
    test.skip(!HAS_API, "A15_14_READY(SEED-A15-14-FORMAT-METAGAME) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePath(FORMAT_ID.METAGAME), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const formats = await readFormats(res);
    const archetypes = readArchetypes(formats[0]);
    for (let i = 1; i < archetypes.length; i++) {
      expect(
        (archetypes[i].deck_count as number) <= (archetypes[i - 1].deck_count as number),
        "archetypes は deck_count の降順で並ぶ",
      ).toBeTruthy();
    }
    await ctx.dispose();
  });

  // E2E-A15-14-045: from_date の書式トークン h/m の意味（時分秒の妥当性）は要確認＝要実機確認（付帯表1 修飾子・付帯表4#4）→ test.fixme
  test.fixme("E2E-A15-14-045 from_date が集計範囲開始日時として Y/m/d h:m:s 書式で返る", async () => {
    test.skip(!HAS_API, "A15_14_READY(SEED-A15-14-FORMAT-METAGAME) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePath(FORMAT_ID.METAGAME), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const formats = await readFormats(res);
    const fromDate = formats[0].from_date as string;
    expect(fromDate, "from_date は `Y/m/d h:m:s` 書式の文字列（正本md・サンプル 2026/05/04 00:05:00）").toMatch(FROM_DATE_PATTERN);
    // 書式トークン h(12時間)/m(月) が時刻として意図された時分秒と異なる（付帯表4#4）。意味の妥当性は実機確認。
    await ctx.dispose();
  });

  test("E2E-A15-14-046 代表カード画像未設定時に card_image が null で返る", async () => {
    test.skip(!HAS_API, "A15_14_READY(SEED-A15-14-FORMAT-METAGAME) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePath(FORMAT_ID.METAGAME), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const formats = await readFormats(res);
    const archetypes = readArchetypes(formats[0]);
    // 代表カード画像が未設定のアーキタイプは card_image が null（serialize_null 有効）。null キー存在の照合（どの archetype が null か）はDB照査で補完（本リポでDBは実行しない）。
    for (const a of archetypes) {
      expect(["string", "object"], "card_image は string または null").toContain(typeof a.card_image);
    }
    await ctx.dispose();
  });

  test("E2E-A15-14-047 複数 format_id（配列）指定で各フォーマットの集計が配列で返る", async () => {
    test.skip(!HAS_API, "A15_14_READY(SEED-A15-14-FORMAT-METAGAME 複数) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildMetagamePathMulti([FORMAT_ID.METAGAME, FORMAT_ID.METAGAME_2]), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const formats = await readFormats(res);
    expect(formats.length, "指定した各フォーマットの集計が formats 配列の各要素で返る").toBeGreaterThanOrEqual(2);
    await ctx.dispose();
  });
});
