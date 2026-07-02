/**
 * a15-13 デッキビルダー_デッキ検索（検索条件に一致するデッキ一覧と総件数をページング付きで返す参照系JSON API・GET）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a15_13_api_deck_builder_deck_search_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を test(...) で実装し、（要実機確認）修飾の 009・010 のみ test.fixme(...) とする。手動（019 タイムアウト実再現）はケース表で全量管理し本specには書かない（規約）。
 * 本機能は画面なしAPI（正本md「ブラウザ向けの画面を持たない」）のためUI専用specは無い（自動化(UI)0件）。
 *
 * 期待結果は仕様（正本md＝pf-api挙動／観点表・基本設計）由来（オラクル独立性）。実装のレスポンス形・追加フィールド・型・日時形式・FW既定値を期待値に流用しない。
 *  - 送信先は実装の実効パス `GET /api/decks`（DeckController.php:262）。正本md `GET /decks` は `/api` 接頭辞を欠き不一致（付帯表4#1）。テストは実効パスへ送信し合否は設計の意味で判定する。
 *  - mode=public は認証不要・公開デッキ一覧＋総件数＋200。mode=private は jwt-token 必須で失敗時401（DeckController.php:280-288／JwtPlayerAuthenticator.php:35-54）。
 *  - 合否（成功）は HTTP200＋`{code:200, message, total_count, decks}`、条件不一致は空 decks＋total_count=0＋200（本APIは404を返さない）、（失敗）は mode=private 認証失敗の401。
 *  - 成功 message「Deck search success」・型契約（deck_private_flag は boolean／日時 ISO8601）・追加 cache_key・display_token 含有条件は仕様どおり期待し、実装乖離は付帯表4#2-9 で記録（実装へ寄せない）。
 *  - 不正mode(009)・想定外クエリ(010)の具体ステータスは正典未固定のため期待値を固定せず（要実機確認＝test.fixme）。
 *  - 参照系のためDB副作用（前後不変・cache_key書込が業務データを更新しない）はDB照合で補完する想定（本リポでDBは実行しない）。
 *  - JWT原値・SEED値は env で供給し原値はコミットしない（付帯表3）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_13_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildSearchPath,
  buildJwtHeaders,
  buildNoAuthHeaders,
  JWT_BAD_SIGNATURE,
  JWT_NO_PLAYER,
  PER_PAGE_MAX,
  PER_PAGE_OVER_MAX,
  SUCCESS_MESSAGE,
  AUTH_ERROR_MESSAGE,
  TOP_LEVEL_FIELDS,
  DECK_INTEGER_FIELDS,
  DECK_STRING_FIELDS,
  DECK_BOOLEAN_FIELDS,
  DECK_ARRAY_FIELDS,
  DISPLAY_TOKEN_FIELD,
  DECK_TAG_FIELDS,
  CAMPAIGN_TAG_FIELDS,
  publicSearchQuery,
  privateSearchQuery,
  invalidModeQuery,
  unknownParamQuery,
  filterQuery,
  pagingQuery,
  perPageOverMaxQuery,
  deckTypeNoneQuery,
  noMatchQuery,
  cacheKeyQuery,
} from "../../../pages/api/a15/a15_13_api_deck_builder_deck_search.api";

const HAS_API = !!process.env.A15_13_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常検索＝200（正本md: レスポンス成功 公開デッキ一覧＋総件数）").toBe(200);
}
function expect401(status: number) {
  expect(status, "mode=private 認証失敗＝401（正本md: 認証拒否。仕様で固定される失敗応答は private 認証失敗の401のみ）").toBe(401);
}
function expectNotServerError(status: number) {
  // 想定外クエリ(010)はサーバエラー(5xx)で停止しないことのみ判定。正常無視か否かは正本未明記＝要実機確認。
  expect(status, "5xxで停止しない（想定外クエリの扱いは正本未明記＝要実機確認）").toBeLessThan(500);
}
function expectNotSuccessfulSearch(status: number) {
  // 不正mode(009)は正常検索（200＋一覧）とならないことのみ判定（具体ステータスは付帯表4#9 要実機確認）。
  expect(status, "正常検索（200）とならない（不正mode・付帯表4#9）").not.toBe(200);
}

/** 成功本文（code=200・message・total_count integer・decks array）を仕様で照合。 */
async function expectSearchSuccessBody(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  for (const field of TOP_LEVEL_FIELDS) {
    expect(Object.prototype.hasOwnProperty.call(body, field), `成功本文に ${field} を含む（正本md: code/message/total_count/decks）`).toBeTruthy();
  }
  expect(body.code, "code=200（成功）").toBe(200);
  expect(body.message, "message=「Deck search success」（正本md。実装の未定義transキー文字列は付帯表4#2）").toBe(SUCCESS_MESSAGE);
  expect(typeof body.total_count, "total_count は integer").toBe("number");
  expect(Array.isArray(body.decks), "decks は配列").toBeTruthy();
}

/** decks 各要素の型契約（006・正本md）を照合。実装の int 化/日時形式は付帯表4#4/#5で落として検出。 */
async function expectDeckTypeContract(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  const decks = (body.decks as Array<Record<string, unknown>>) ?? [];
  expect(decks.length, "型契約照合のため decks に1件以上（SEED-A15-13-PUBLIC-DECKS）").toBeGreaterThan(0);
  const deck = decks[0];
  for (const f of DECK_INTEGER_FIELDS) expect(typeof deck[f], `${f} は integer`).toBe("number");
  for (const f of DECK_STRING_FIELDS) expect(typeof deck[f], `${f} は string`).toBe("string");
  for (const f of DECK_BOOLEAN_FIELDS) expect(typeof deck[f], `${f} は boolean（実装の int 化は付帯表4#4）`).toBe("boolean");
  for (const f of DECK_ARRAY_FIELDS) expect(Array.isArray(deck[f]), `${f} は array`).toBeTruthy();
}

/** 条件不一致＝空 decks＋total_count=0（012/024・本APIは404を返さない）。 */
async function expectEmptyResult(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(Array.isArray(body.decks) && (body.decks as unknown[]).length === 0, "decks は空配列").toBeTruthy();
  expect(body.total_count, "total_count=0").toBe(0);
}

/** mode=private 認証失敗本文（401＋message 相当・decks 正常検索を返さない）。 */
async function expectAuthErrorBody(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(JSON.stringify(body), "message に「Access Token is incorrect」相当を含む（008・付帯表4#9）").toContain(AUTH_ERROR_MESSAGE);
  expect(Object.prototype.hasOwnProperty.call(body, "decks"), "正常検索（decks）を返さない").toBeFalsy();
}

test.describe("API > デッキビルダー_デッキ検索", { tag: ["@api", "@a15"] }, () => {
  // ===== 公開検索 正常系（IT-09 / IT-10） =====

  test("E2E-A15-13-001 公開検索（mode=public）で200とデッキ一覧・総件数が返る", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-PUBLIC-DECKS) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildSearchPath(publicSearchQuery()), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectSearchSuccessBody(res);
    await ctx.dispose();
  });

  test("E2E-A15-13-002 正常検索時に取得時点の値が再計算されず返る", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-PUBLIC-DECKS) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildSearchPath(publicSearchQuery()), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    // 業務ルール「取得後に業務値を再計算しない」。SEED 既知値（デッキ名・日時・順位・参加人数）との一致はDB照査で補完（本リポでDBは実行しない）。
    await expectSearchSuccessBody(res);
    await ctx.dispose();
  });

  test("E2E-A15-13-003 正常検索時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-PUBLIC-DECKS) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildSearchPath(publicSearchQuery()), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-13-004 検索条件に一致する公開デッキのみが取得される", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-PUBLIC-DECKS) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildSearchPath(publicSearchQuery()), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    // 公開（scope_id=公開）かつ削除日時無しのみが返り、非公開・論理削除済みが含まれないこと（集計条件 対象データ）はSEED既知値とのDB照査で補完。
    await expectSearchSuccessBody(res);
    await ctx.dispose();
  });

  // ===== 自分のデッキ検索 / レスポンス契約（IT-32） =====

  test("E2E-A15-13-005 自分のデッキ検索（mode=private）で有効JWTにより所有デッキが返り応答が処理結果と一致する", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-PLAYER-OWNED 有効JWT) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildSearchPath(privateSearchQuery()), { headers: buildJwtHeaders() });
    expect200(res.status());
    // 認証プレイヤー所有デッキのみ（他人のデッキ非混在）はSEED既知値とのDB照査で補完。
    await expectSearchSuccessBody(res);
    await ctx.dispose();
  });

  test("E2E-A15-13-006 成功レスポンスが仕様のフィールド構成・型契約と一致する", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-PUBLIC-DECKS) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildSearchPath(publicSearchQuery()), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectSearchSuccessBody(res);
    // 型・追加フィールド(cache_key)・日時形式・メッセージの実装差異は付帯表4#2-5で落として検出。
    await expectDeckTypeContract(res);
    await ctx.dispose();
  });

  test("E2E-A15-13-007 mode=private で jwt-token 欠落時に401となり正常検索を返さない", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-AUTH-INVALID) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildSearchPath(privateSearchQuery()), { headers: buildNoAuthHeaders() });
    expect401(res.status()); // jwt-token 欠落＝認証拒否401（mode=private は認証必須）。decks（正常検索）を返さない。
    await ctx.dispose();
  });

  test("E2E-A15-13-008 mode=private で無効・署名不正トークン時に401となり正常検索を返さない", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-AUTH-INVALID) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildSearchPath(privateSearchQuery()), { headers: buildJwtHeaders(JWT_BAD_SIGNATURE) });
    expect401(res.status());
    await expectAuthErrorBody(res); // message「Access Token is incorrect」相当を含み decks を返さない（付帯表4#9）。
    await ctx.dispose();
  });

  // ===== 異常パラメータ（要実機確認＝test.fixme。具体ステータスは正典未固定＝付帯表4#9） =====

  test.fixme("E2E-A15-13-009 異常なパラメータ値（不正mode）で正常検索とならない", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-PUBLIC-DECKS) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildSearchPath(invalidModeQuery()), { headers: buildNoAuthHeaders() });
    expectNotSuccessfulSearch(res.status()); // 不正mode具体ステータス(400)は仕様未定義＝要実機確認（付帯表4#9）。
    await ctx.dispose();
  });

  test.fixme("E2E-A15-13-010 想定外のクエリ項目を加えてもサーバエラーで停止しない", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-PUBLIC-DECKS) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildSearchPath(unknownParamQuery()), { headers: buildNoAuthHeaders() });
    expectNotServerError(res.status()); // 200で無視され正常検索と同一かは正本未明記＝要実機確認。
    await ctx.dispose();
  });

  // ===== モード別対象範囲 / データなし（IT-32） =====

  test("E2E-A15-13-011 検索モードに応じて対象デッキが正しく絞り込まれる", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-PUBLIC-DECKS / SEED-A15-13-PLAYER-OWNED 有効JWT) 未設定");
    const ctx = await newCtx();
    const pub = await ctx.get(buildSearchPath(publicSearchQuery()), { headers: buildNoAuthHeaders() });
    const priv = await ctx.get(buildSearchPath(privateSearchQuery()), { headers: buildJwtHeaders() });
    expect200(pub.status());
    expect200(priv.status());
    // public は公開デッキのみ・private は所有デッキのみで対象範囲が混在しないこと（処理フロー#3）はSEED既知値とのDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-13-012 条件不一致時に空の decks と total_count=0 が200で返る", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildSearchPath(noMatchQuery()), { headers: buildNoAuthHeaders() });
    expect200(res.status()); // 該当なしでも404を返さない（仕様）。
    await expectEmptyResult(res);
    await ctx.dispose();
  });

  // ===== 認証失敗 401（IT-10） =====

  test("E2E-A15-13-013 mode=private 認証不可時に仕様の401応答が返る", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-AUTH-INVALID) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildSearchPath(privateSearchQuery()), { headers: buildJwtHeaders(JWT_NO_PLAYER) });
    expect401(res.status());
    await expectAuthErrorBody(res); // {code, message} 形式のJSON。
    await ctx.dispose();
  });

  test("E2E-A15-13-014 異常（mode=private 認証失敗）時のHTTPステータスが仕様の401と一致する", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-AUTH-INVALID) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildSearchPath(privateSearchQuery()), { headers: buildJwtHeaders(JWT_BAD_SIGNATURE) });
    expect401(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-13-015 正常通信で200応答が返る", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-PUBLIC-DECKS) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildSearchPath(publicSearchQuery()), { headers: buildNoAuthHeaders() });
    expect200(res.status()); // GET通信成立・成功＝200。
    await ctx.dispose();
  });

  test("E2E-A15-13-016 対象条件に該当する正常値で200とデッキ一覧が返る", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-PUBLIC-DECKS) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildSearchPath(publicSearchQuery()), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectSearchSuccessBody(res);
    await ctx.dispose();
  });

  test("E2E-A15-13-017 異常系（mode=private 認証失敗）受信時に正常検索とならない", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-AUTH-INVALID) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildSearchPath(privateSearchQuery()), { headers: buildJwtHeaders(JWT_BAD_SIGNATURE) });
    expect401(res.status()); // 正常検索（200＋一覧）とならず401。
    await ctx.dispose();
  });

  // ===== 冪等参照 / 絞り込み / ページング / ソート（IT-09・設計書補完） =====

  test("E2E-A15-13-018 同一GETの重複呼び出しで同一レスポンス（冪等参照）となる", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-PUBLIC-DECKS) 未設定");
    const ctx = await newCtx();
    const first = await ctx.get(buildSearchPath(publicSearchQuery()), { headers: buildNoAuthHeaders() });
    const second = await ctx.get(buildSearchPath(publicSearchQuery()), { headers: buildNoAuthHeaders() });
    expect200(first.status());
    expect200(second.status());
    expect(await second.text(), "2回の呼び出しで同一レスポンス本文（参照系・副作用なし）").toBe(await first.text());
    // 業務データ非更新（副作用なし）はDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-13-020 フォーマット・アーキタイプ・タグ等の絞り込み条件が反映される", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-PUBLIC-DECKS) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildSearchPath(filterQuery()), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    // 指定条件一致のみが decks に返り total_count も連動（集計条件 絞り込み）はSEED既知値とのDB照査で補完。クエリキー名は要実機確認。
    await expectSearchSuccessBody(res);
    await ctx.dispose();
  });

  test("E2E-A15-13-021 page・per_page で1ページ分が返り total_count はページング非依存となる", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-PUBLIC-DECKS) 未設定");
    const ctx = await newCtx();
    const perPage = 2;
    const res = await ctx.get(buildSearchPath(pagingQuery(1, perPage)), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    const decks = (body.decks as unknown[]) ?? [];
    expect(decks.length, "decks は指定 per_page 以下の1ページ分").toBeLessThanOrEqual(perPage);
    // total_count はページングの影響を受けず条件一致の総件数（重複排除後）が返ること（ページネーション 出力）はSEED総件数とのDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-13-022 per_page が100超のとき最大100件に丸められる", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-PUBLIC-DECKS 101件以上) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildSearchPath(perPageOverMaxQuery()), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    const decks = (body.decks as unknown[]) ?? [];
    expect(decks.length, `per_page=${PER_PAGE_OVER_MAX} 指定でも最大${PER_PAGE_MAX}件に丸め（ページネーション 入力）`).toBeLessThanOrEqual(PER_PAGE_MAX);
    await ctx.dispose();
  });

  test("E2E-A15-13-023 検索結果が作成日時の降順で並ぶ", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-PUBLIC-DECKS 作成日時相異) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildSearchPath(publicSearchQuery()), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    const decks = (body.decks as Array<Record<string, unknown>>) ?? [];
    const dates = decks.map((d) => String(d.create_date));
    const sorted = [...dates].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
    expect(dates, "decks は create_date の降順（集計条件 並び順・処理フロー#4。実装の追加 sort/order は付帯表4#8）").toEqual(sorted);
    await ctx.dispose();
  });

  // ===== デッキ種別 / display_token / レギュ違反 / 副作用 / タグ整形 / cache_key（IT-32 / IT-09） =====

  test("E2E-A15-13-024 デッキ種別フラグが両方対象外のとき空・total_count=0で返る", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-PUBLIC-DECKS) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildSearchPath(deckTypeNoneQuery()), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectEmptyResult(res); // event_deck_flag=0・user_deck_flag=0 はいずれも対象外＝空＋total_count=0（集計条件 デッキ種別）。
    await ctx.dispose();
  });

  test("E2E-A15-13-025 自分のデッキ検索（private）で display_token が含まれる", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-PLAYER-OWNED 限定公開デッキ所有・有効JWT) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildSearchPath(privateSearchQuery()), { headers: buildJwtHeaders() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    const decks = (body.decks as Array<Record<string, unknown>>) ?? [];
    expect(decks.length, "display_token 確認のため所有デッキに1件以上").toBeGreaterThan(0);
    // 正本md: display_token は private の場合に含める。実装は UNLISTED 限定＝付帯表4#6（SEED は UNLISTED デッキを含めて固定）。
    expect(decks.some((d) => Object.prototype.hasOwnProperty.call(d, DISPLAY_TOKEN_FIELD)), "private 応答デッキに display_token を含む（付帯表4#6）").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A15-13-026 レギュレーション違反デッキが既定で除外される", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-PUBLIC-DECKS レギュ違反デッキ1件) 未設定");
    const ctx = await newCtx();
    // regulation_violation_flag 未指定（既定0）。
    const res = await ctx.get(buildSearchPath(publicSearchQuery()), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    // 既定では違反フラグの立つデッキが decks に含まれないこと（集計条件 絞り込み・リニューアル移行時の扱い）はSEED既知値とのDB照査で補完。
    await expectSearchSuccessBody(res);
    await ctx.dispose();
  });

  test("E2E-A15-13-027 参照のみで副作用が無い（再検索で対象データ不変）", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-PUBLIC-DECKS) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildSearchPath(publicSearchQuery()), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    // API呼び出し前後で対象デッキのデータが変化しないこと（副作用「無し（参照のみ）」）はDB照査で補完。cache_key 指定時のキャッシュ挙動は付帯表5。
    await ctx.dispose();
  });

  test("E2E-A15-13-028 各デッキに deck_tags・campaign_tags が整形付与される", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-PUBLIC-DECKS タグ付きデッキ) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildSearchPath(publicSearchQuery()), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    const decks = (body.decks as Array<Record<string, unknown>>) ?? [];
    const tagged = decks.find((d) => Array.isArray(d.deck_tags) && (d.deck_tags as unknown[]).length > 0);
    expect(tagged, "deck_tags 付きデッキが存在（SEED）").toBeTruthy();
    const deckTag = ((tagged?.deck_tags as Array<Record<string, unknown>>) ?? [])[0];
    for (const f of DECK_TAG_FIELDS) expect(Object.prototype.hasOwnProperty.call(deckTag ?? {}, f), `deck_tags 要素に ${f} を含む（処理フロー#5）`).toBeTruthy();
    const campaigned = decks.find((d) => Array.isArray(d.campaign_tags) && (d.campaign_tags as unknown[]).length > 0);
    const campaignTag = ((campaigned?.campaign_tags as Array<Record<string, unknown>>) ?? [])[0];
    if (campaignTag) {
      for (const f of CAMPAIGN_TAG_FIELDS) expect(Object.prototype.hasOwnProperty.call(campaignTag, f), `campaign_tags 要素に ${f} を含む（is_during=開催前0/中1/後2）`).toBeTruthy();
    }
    await ctx.dispose();
  });

  test("E2E-A15-13-029 cache_key 指定時に正常検索が200で返り業務データを更新しない", async () => {
    test.skip(!HAS_API, "A15_13_READY(SEED-A15-13-PUBLIC-DECKS) 未設定");
    const ctx = await newCtx();
    const first = await ctx.get(buildSearchPath(cacheKeyQuery()), { headers: buildNoAuthHeaders() });
    expect200(first.status());
    await expectSearchSuccessBody(first); // cache_key 指定が正常検索を妨げない（code=200・total_count・decks）。
    const second = await ctx.get(buildSearchPath(cacheKeyQuery()), { headers: buildNoAuthHeaders() });
    expect200(second.status());
    expect(await second.text(), "同一 cache_key の2回呼び出しで同一 total_count・decks").toBe(await first.text());
    // cache_key 書込が業務データ（dtb_deck 等）を更新しないことはDB照査で補完。キャッシュ命中の内部状態は観測外＝付帯表5。
    await ctx.dispose();
  });
});
