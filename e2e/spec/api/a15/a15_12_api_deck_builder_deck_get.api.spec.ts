/**
 * a15-12 デッキビルダー_デッキ取得（デッキIDを指定して1件のデッキ情報を返す JSON API・GET参照系）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a15_12_api_deck_builder_deck_get_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を normal test、E2E可否に（要実機確認）修飾が付く E2E-A15-12-006 を test.fixme で実装する。
 * 手動（015 タイムアウト実再現・028 Redis下書き不正・029 Redis接続障害＝いずれも代替動作が正典未定義・実再現が外部依存）はケース表で全量管理し本specには書かない（規約）。
 * 本機能はブラウザ向け画面を持たないAPI（正本md「ブラウザ向けの画面を持たない」）のためUI専用specは無い（自動化(UI)0件）。
 *
 * 期待結果は仕様（正本md＝設計書／観点表・基本設計）由来（オラクル独立性）。実装のレスポンス形・型・HTTPライブラリ既定値・Form制約を期待値に流用しない。
 *  - 送信先は実装の実効パス `GET /api/deck/{id}`（DeckController.php:214＋routes.yaml:6。正本md `GET /deck/{id}` は `/api` を欠き不一致＝付帯表4#1）。
 *  - `display_token` はクエリ受領（DeckController.php:221）、`jwt-token` ヘッダは optionalAuthenticate（DeckController.php:747-759／無効・欠落は null＝所有者扱いしない）。公開デッキはトークン無しでも参照可（401は返さない）。
 *  - 取得順は Redis下書き優先（DeckService.php:305）→ 無ければ DB（DeckController.php:239／deleted_at 非nullは404）。公開範囲判定は canViewDeck（DeckController.php:764-789）。
 *  - 合否（成功）は HTTP200＋応答 `{..., code:200, message:"Get deck success"}`、（失敗＝該当なし・参照不可）は 404＋`{code, message:"Deck is not found"}` を仕様由来で判定する。
 *    実装の日本語文言（「デッキ取得に成功しました」「デッキが見つかりません」＝付帯表4#2/#3）と違えば落として検出する（実装へ寄せない）。
 *    `deck_private_flag` は仕様 boolean（実装 int＝付帯表4#4）、`scope_id` は仕様意味（実装 disp_id 直充当＝付帯表4#6）で期待する。
 *  - `id` 非数値・0以下・id欠落の具体ステータスは正典未定義（要実機確認＝付帯表4#5）。テストは「正常取得200とならない」ことのみ判定する。
 *  - 本APIは参照系（DB更新・Redis書き込み無し）。副作用なし・物理削除なし・取得時点の値（再計算なし）はDB/Redis照合で補完する想定。本specは一次オラクルとしてAPI応答を確認し、DB/Redis副作用は「DB照査で補完」（本リポでDBは実行しない）。
 *  - 有効JWT原値・display_token原値・SEEDデッキID は env で供給し原値はコミットしない。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_12_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildDeckPath,
  buildDeckPathNoId,
  buildDeckPathWithToken,
  buildJwtHeaders,
  buildNoAuthHeaders,
  JWT_INVALID,
  DECK_ID,
  DISPLAY_TOKEN,
  UNKNOWN_QUERY,
  SCOPE,
  MESSAGE,
  SUCCESS_FIELDS,
} from "../../../pages/api/a15/a15_12_api_deck_builder_deck_get.api";

const HAS_API = !!process.env.A15_12_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常取得＝200（正本md: レスポンス成功 HTTP200）").toBe(200);
}
function expect404(status: number) {
  expect(status, "該当なし・参照不可＝404（正本md: エラー処理 createErrorResponse(404)）").toBe(404);
}
function expectNot200(status: number) {
  // 正本md: 正常取得は200。不正id・id欠落の具体ステータスは正典未定義（要実機確認＝付帯表4#5）。
  // 「正常取得200とならない」ことのみ判定し具体ステータスは固定しない。
  expect(status, "正常取得（200）とならない（正本md: 不正id時ステータスは要実機確認・付帯表4#5）").not.toBe(200);
}
function expectNotServerError(status: number) {
  // 想定外クエリ（006）はサーバエラー（5xx）で停止しないことのみ判定（無視可否は要実機確認）。
  expect(status, "サーバエラー（5xx）で停止しない（正本md: 想定外項目の扱いは未定義のため要実機確認）").toBeLessThan(500);
}
async function expectMessage(res: { json: () => Promise<unknown> }, message: string, why: string) {
  const body = (await res.json()) as Record<string, unknown>;
  // message 要素の表現差異を吸収しつつ正本md文言の存在で照合する（実装の日本語文言と違えば落として検出）。
  expect(JSON.stringify(body), why).toContain(message);
}
async function expectCode200Body(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(body.code, "成功本文は code:200（正本md: レスポンス成功 code）").toBe(200);
}
async function expectSuccessFields(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  for (const f of SUCCESS_FIELDS) {
    expect(Object.prototype.hasOwnProperty.call(body, f), `成功本文に仕様フィールド ${f} を含む（正本md: 入出力 レスポンス成功）`).toBeTruthy();
  }
  // 型契約（正本md）: code・scope_id は integer、deck_private_flag は boolean、deck_tags・campaign_tags・cards は array。
  expect(Number.isInteger(body.code), "code は integer（正本md 型契約）").toBeTruthy();
  expect(Number.isInteger(body.scope_id), "scope_id は integer（正本md 型契約・実装 disp_id 直充当は付帯表4#6）").toBeTruthy();
  expect(typeof body.deck_private_flag, "deck_private_flag は boolean（正本md 型契約・実装 int は付帯表4#4）").toBe("boolean");
  expect(Array.isArray(body.deck_tags), "deck_tags は array（正本md 型契約）").toBeTruthy();
  expect(Array.isArray(body.campaign_tags), "campaign_tags は array（正本md 型契約）").toBeTruthy();
  expect(Array.isArray(body.cards), "cards は array（正本md 型契約）").toBeTruthy();
}

test.describe("API > デッキビルダー_デッキ取得", { tag: ["@api", "@a15"] }, () => {
  // ===== 資格情報・認可（IT-32／無効トークンで非公開は所有者扱いされず404） =====

  test("E2E-A15-12-001 無効/欠落トークンでは非公開デッキが所有者扱いされず参照不可となる", async () => {
    test.skip(!HAS_API, "A15_12_READY(SEED-A15-12-DECK-PRIVATE/JWT) 未設定");
    const ctx = await newCtx();
    // 無効トークンは optionalAuthenticate で null 化され所有者扱いされない（非公開2は所有者本人のみ参照可）。
    const res = await ctx.get(buildDeckPath(DECK_ID.PRIVATE), { headers: buildJwtHeaders(JWT_INVALID) });
    expect404(res.status());
    await expectMessage(res, MESSAGE.NOT_FOUND, "本文 message が正本「Deck is not found」（実装日本語文言は付帯表4#2）");
    await ctx.dispose();
  });

  // ===== 正常取得（IT-09／取得時点の値・HTTPステータス・リクエスト） =====

  test("E2E-A15-12-002 正常取得時に取得時点の値が再計算されず返る", async () => {
    test.skip(!HAS_API, "A15_12_READY(SEED-A15-12-DECK-PUBLIC) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDeckPath(DECK_ID.PUBLIC), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectCode200Body(res);
    // 取得時点の値が再計算・丸め・補正されないこと（DB／Redis取得値と一致）はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-12-003 正常取得時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A15_12_READY(SEED-A15-12-DECK-PUBLIC) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDeckPath(DECK_ID.PUBLIC), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-12-004 正常なデッキIDの指定で期待どおりのデッキ情報が返る", async () => {
    test.skip(!HAS_API, "A15_12_READY(SEED-A15-12-DECK-PUBLIC) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDeckPath(DECK_ID.PUBLIC), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectSuccessFields(res); // 指定IDに対応するデッキ情報（deck_name・format・cards 等）がJSONで返る。
    await ctx.dispose();
  });

  // ===== リクエスト異常（IT-32／id≦0） =====

  test("E2E-A15-12-005 異常なパラメータ値（id≦0）で正しいデッキが取得されない", async () => {
    test.skip(!HAS_API, "A15_12_READY(SEED-A15-12-DECK-PUBLIC) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDeckPath(DECK_ID.INVALID_ZERO), { headers: buildNoAuthHeaders() });
    expectNot200(res.status()); // 0以下では正常取得200とならない（具体ステータスは要実機確認＝付帯表4#5）。
    await ctx.dispose();
  });

  // ===== 想定外クエリ（IT-32／006＝E2E可否（要実機確認）修飾＝test.fixme） =====

  test.fixme("E2E-A15-12-006 想定外のクエリ項目を加えてもサーバエラーで停止しない（無視可否は要実機確認）", async () => {
    test.skip(!HAS_API, "A15_12_READY(SEED-A15-12-DECK-PUBLIC) 未設定");
    const ctx = await newCtx();
    // 未知クエリ項目があってもサーバエラー（5xx）で停止しないことのみ判定。200で無視され正常取得と同一となるかは要実機確認（付帯表1）。
    const res = await ctx.get(buildDeckPath(DECK_ID.PUBLIC, UNKNOWN_QUERY), { headers: buildNoAuthHeaders() });
    expectNotServerError(res.status());
    await ctx.dispose();
  });

  // ===== エラー応答（IT-10／該当なし・参照不可で404） =====

  test("E2E-A15-12-008 参照不可・該当なしのエラー時に仕様のエラー応答（404）が返る", async () => {
    test.skip(!HAS_API, "A15_12_READY(SEED-A15-12-DECK-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDeckPath(DECK_ID.NONEXISTENT), { headers: buildNoAuthHeaders() });
    expect404(res.status());
    await expectMessage(res, MESSAGE.NOT_FOUND, "失敗本文 {code, message} の message が正本「Deck is not found」（実装日本語文言は付帯表4#2）");
    await ctx.dispose();
  });

  // ===== 外部取得（IT-09／Redis下書き優先・DBフォールバック） =====

  test("E2E-A15-12-024 Redis一時保存（下書き）を優先し無ければデータベースから取得する", async () => {
    test.skip(!HAS_API, "A15_12_READY(SEED-A15-12-DECK-DRAFT/PUBLIC) 未設定");
    const ctx = await newCtx();
    // 下書きあり/なしを切り替えた同一IDで取得し、取得順（Redis下書き優先→DBフォールバック）を確認する想定。
    const resDraft = await ctx.get(buildDeckPath(DECK_ID.DRAFT), { headers: buildNoAuthHeaders() });
    expect200(resDraft.status());
    const resDb = await ctx.get(buildDeckPath(DECK_ID.DRAFT), { headers: buildNoAuthHeaders() });
    expect200(resDb.status());
    // 下書きありは確定前内容・無しはDB確定内容が返ること（取得順）はRedis/DB照査で補完（本リポでDB/Redisは実行しない）。
    await ctx.dispose();
  });

  // ===== HTTPステータス・通信・正常（IT-10） =====

  test("E2E-A15-12-025 該当なし時のHTTPステータスが仕様の404と一致する", async () => {
    test.skip(!HAS_API, "A15_12_READY(SEED-A15-12-DECK-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDeckPath(DECK_ID.NONEXISTENT), { headers: buildNoAuthHeaders() });
    expect404(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-12-026 正常通信で200応答が返る", async () => {
    test.skip(!HAS_API, "A15_12_READY(SEED-A15-12-DECK-PUBLIC) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDeckPath(DECK_ID.PUBLIC), { headers: buildNoAuthHeaders() });
    expect200(res.status()); // GET通信成立・成功＝200。
    await ctx.dispose();
  });

  test("E2E-A15-12-027 公開デッキは対象条件に該当する正常値で200とデッキ情報が返る", async () => {
    test.skip(!HAS_API, "A15_12_READY(SEED-A15-12-DECK-PUBLIC) 未設定");
    const ctx = await newCtx();
    // 公開デッキ（scope_id=1）は任意の利用者が参照できる。
    const res = await ctx.get(buildDeckPath(DECK_ID.PUBLIC), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectMessage(res, MESSAGE.GET_SUCCESS, "成功本文 message が正本「Get deck success」（実装日本語文言は付帯表4#3）");
    await ctx.dispose();
  });

  // ===== 異常系（IT-10／限定公開トークン不一致かつ非所有者で404） =====

  test("E2E-A15-12-030 限定公開デッキをトークン不一致かつ非所有者で参照すると404となる", async () => {
    test.skip(!HAS_API, "A15_12_READY(SEED-A15-12-DECK-UNLISTED) 未設定");
    const ctx = await newCtx();
    // 限定公開（scope_id=3）はトークン不一致かつ所有者でない場合は参照不可（jwt-token無し）。
    const res = await ctx.get(buildDeckPathWithToken(DECK_ID.UNLISTED, DISPLAY_TOKEN.MISMATCH), {
      headers: buildNoAuthHeaders(),
    });
    expect404(res.status());
    await expectMessage(res, MESSAGE.NOT_FOUND, "本文 message が正本「Deck is not found」（実装日本語文言は付帯表4#2）");
    await ctx.dispose();
  });

  // ===== 必須条件（IT-32／パス変数 id 欠落） =====

  test("E2E-A15-12-031 パス変数（id）欠落で正しいデッキが取得されない", async () => {
    test.skip(!HAS_API, "A15_12_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDeckPathNoId(), { headers: buildNoAuthHeaders() });
    expectNot200(res.status()); // 必須パス変数 id 欠落では正常取得200とならない（具体ステータスは要実機確認）。
    await ctx.dispose();
  });

  // ===== レスポンス（IT-32／フィールド構成・型契約） =====

  test("E2E-A15-12-032 成功レスポンスが仕様のフィールド構成・型契約と一致する", async () => {
    test.skip(!HAS_API, "A15_12_READY(SEED-A15-12-DECK-PUBLIC) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDeckPath(DECK_ID.PUBLIC), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectMessage(res, MESSAGE.GET_SUCCESS, "成功本文 message が正本「Get deck success」（付帯表4#3）");
    await expectSuccessFields(res); // code・scope_id integer／deck_private_flag boolean（付帯表4#4）／deck_tags・campaign_tags・cards array。
    await ctx.dispose();
  });

  // ===== データなし（IT-32／存在しないデッキID） =====

  test("E2E-A15-12-033 存在しないデッキIDの場合に404が返る", async () => {
    test.skip(!HAS_API, "A15_12_READY(SEED-A15-12-DECK-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDeckPath(DECK_ID.NONEXISTENT), { headers: buildNoAuthHeaders() });
    expect404(res.status());
    await expectMessage(res, MESSAGE.NOT_FOUND, "失敗本文 {code, message} の message が正本「Deck is not found」（付帯表4#2）");
    await ctx.dispose();
  });

  // ===== 受信検証（IT-32／限定公開トークン一致で参照・指定IDのみ） =====

  test("E2E-A15-12-036 限定公開トークン一致時に限定公開デッキが参照でき指定IDのデッキのみ返る", async () => {
    test.skip(!HAS_API, "A15_12_READY(SEED-A15-12-DECK-UNLISTED) 未設定");
    const ctx = await newCtx();
    // display_token 一致で限定公開を参照でき、指定IDのデッキ情報のみが返る。
    const res = await ctx.get(buildDeckPathWithToken(DECK_ID.UNLISTED, DISPLAY_TOKEN.MATCH), {
      headers: buildNoAuthHeaders(),
    });
    expect200(res.status());
    await expectMessage(res, MESSAGE.GET_SUCCESS, "成功本文 message が正本「Get deck success」（付帯表4#3）");
    // 限定公開（scope_id=3）として返ること・指定IDのデッキのみであること。
    await ctx.dispose();
  });

  // ===== 重複・順序（IT-10／冪等参照・物理削除なし） =====

  test("E2E-A15-12-037 同一GETの重複呼び出しで同一レスポンスとなり物理削除等の副作用が無い", async () => {
    test.skip(!HAS_API, "A15_12_READY(SEED-A15-12-DECK-PUBLIC) 未設定");
    const ctx = await newCtx();
    const res1 = await ctx.get(buildDeckPath(DECK_ID.PUBLIC), { headers: buildNoAuthHeaders() });
    const res2 = await ctx.get(buildDeckPath(DECK_ID.PUBLIC), { headers: buildNoAuthHeaders() });
    // 参照系のため2回の呼び出しで同一のHTTPステータス・レスポンス本文が返る。
    expect(res1.status(), "1回目と2回目のHTTPステータスが一致（冪等参照）").toBe(res2.status());
    expect(await res1.text(), "1回目と2回目のレスポンス本文が一致（冪等参照）").toBe(await res2.text());
    // 物理削除・DB更新等の副作用が発生しないことはDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  // ===== 外部取得（IT-09・設計書補完／下書き内容・DBフォールバック） =====

  test("E2E-A15-12-040 Redis下書きがある場合は下書き（確定前）の内容を返す", async () => {
    test.skip(!HAS_API, "A15_12_READY(SEED-A15-12-DECK-DRAFT) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDeckPath(DECK_ID.DRAFT), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    // 下書きあり時は確定前内容（cards の count・board_id・campaign_tags 開催状態等）を返し、DB確定内容と一致しないことがある＝Redis/DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-12-041 Redis下書きが無い場合はデータベースの確定内容を返す", async () => {
    test.skip(!HAS_API, "A15_12_READY(SEED-A15-12-DECK-PUBLIC) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDeckPath(DECK_ID.PUBLIC), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    // 下書きなし時はDBの確定内容を返すこと（取得順）はDB照査で補完。
    await ctx.dispose();
  });

  // ===== 資格情報 正常側補助（IT-32・設計書補完／所有者本人の参照） =====

  test("E2E-A15-12-042 非公開デッキを所有者本人（有効トークン）が参照すると200で返る", async () => {
    test.skip(!HAS_API, "A15_12_READY(SEED-A15-12-DECK-PRIVATE/JWT) 未設定");
    const ctx = await newCtx();
    // 所有者本人の有効 jwt-token で非公開（scope_id=2）を参照できる。
    const res = await ctx.get(buildDeckPath(DECK_ID.PRIVATE), { headers: buildJwtHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-12-043 限定公開デッキを所有者本人（有効トークン）がトークン無しでも参照できる", async () => {
    test.skip(!HAS_API, "A15_12_READY(SEED-A15-12-DECK-UNLISTED/JWT) 未設定");
    const ctx = await newCtx();
    // display_token 無しでも所有者本人の有効 jwt-token で限定公開（scope_id=3）を参照できる。
    const res = await ctx.get(buildDeckPath(DECK_ID.UNLISTED), { headers: buildJwtHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  // ===== データなし（IT-32・設計書補完／論理削除済みは404） =====

  test("E2E-A15-12-044 論理削除済みデッキは該当なし（404）となり存在の有無を区別しない", async () => {
    test.skip(!HAS_API, "A15_12_READY(SEED-A15-12-DECK-NONE 論理削除レコード) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDeckPath(DECK_ID.DELETED), { headers: buildNoAuthHeaders() });
    expect404(res.status());
    await expectMessage(res, MESSAGE.NOT_FOUND, "本文 message が正本「Deck is not found」で存在の有無を区別しない（実装日本語文言は付帯表4#2）");
    await ctx.dispose();
  });

  // ===== レスポンス（IT-09・設計書補完／配列構造・開催状態） =====

  test("E2E-A15-12-045 採用カード・デッキタグ・キャンペーンタグが配列で返り開催状態を含む", async () => {
    test.skip(!HAS_API, "A15_12_READY(SEED-A15-12-DECK-PUBLIC タグ・採用カード) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDeckPath(DECK_ID.PUBLIC), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // cards（id・count・board_id 等）・deck_tags（id・name_jp・name_en）・campaign_tags（id・name_jp・name_en・is_during）が配列で返る。
    expect(Array.isArray(body.cards), "cards は array（正本md 集計条件）").toBeTruthy();
    expect(Array.isArray(body.deck_tags), "deck_tags は array（正本md）").toBeTruthy();
    expect(Array.isArray(body.campaign_tags), "campaign_tags は array（正本md・is_during 開催状態を含む）").toBeTruthy();
    await ctx.dispose();
  });

  // ===== 実行結果（IT-09・設計書補完／参照のみ・副作用なし） =====

  test("E2E-A15-12-046 参照のみで副作用が無い（Redis書き込みなし・再取得で対象データ不変）", async () => {
    test.skip(!HAS_API, "A15_12_READY(SEED-A15-12-DECK-PUBLIC) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildDeckPath(DECK_ID.PUBLIC), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    // API呼び出し前後でデッキデータが変化せず Redis一時保存への書き込み・削除も発生しないこと（参照のみ）はDB/Redis照査で補完（本リポでDB/Redisは実行しない）。
    await ctx.dispose();
  });

  // 参照: SCOPE（公開1/非公開2/限定公開3）は公開範囲判定の仕様意味（付帯表4#6）を表す定数として pages に保持（spec はステータス/本文で判定）。
  void SCOPE;
});
