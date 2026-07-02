/**
 * a15-11 デッキビルダー_デッキ削除（JWT認証つき DELETE API＝自身デッキの論理削除＋Redis下書き削除）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a15_11_api_deck_builder_deck_delete_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装する。021/022/023 は E2E可否セルに「（要実機確認: HS256署名検証の実方式）」修飾が付くため test.fixme とする。
 * 手動（040 想定外body項目・051 例外ロールバック・060 並行送信・061 タイムアウト・062 Redis障害・150 保存例外）はケース表で全量管理し本specには書かない（規約）。
 * 本機能は画面なしAPI（正本md「ブラウザ向けの画面を持たない」）のためUI専用specは無い（自動化(UI)0件）。
 *
 * 期待結果は仕様（正本md＝pf-api挙動／観点表・基本設計）由来（オラクル独立性）。実装のレスポンス形・FW既定値・例外整形を期待値に流用しない。
 *  - 送信先は実装の実効パス `DELETE /api/deck/{id}`（DeckController.php:177／付帯表1・付帯表4#1。正本md `DELETE /deck/{id}` は `/api` を欠き不一致）。path id は `\d+` 必須。
 *  - 認証は jwt-token ヘッダのJWT（HS256・aud→プレイヤー）を JwtPlayerAuthenticator で検証（DeleteDeckAction.php:29,43-46）。欠落/署名不正/該当プレイヤーなし＝401。
 *  - 合否（成功）は HTTP200＋応答 `{code:200, message:"Deck delete success"}`、（失敗）は所有者外＝401「Authentication failed」・対象なし＝404「The deck does not exist」を仕様由来で判定する。
 *    応答メッセージは正本md文言で照合（実装 en 文言の乖離＝付帯表4#2/#3、所有者外は乖離なし＝付帯表4#6）。実装文言へ寄せない。
 *  - 本APIはブラウザ向け画面を持たないため、削除副作用（論理削除 deleted_at 設定・採用カード等の物理削除なし・Redis下書き削除）は永続化先テーブル dtb_deck とRedis一時保存を直接DB／Redis照合（副作用観測）して判定する想定。
 *    本specは一次オラクルとしてAPI応答を確認し、DB／Redis副作用は「DB照査で補完」（本リポでDB/Redisは実行しない）。
 *  - 有効JWT原値・署名シークレット（auth_magic）・SEEDデッキID は env で供給し原値はコミットしない。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_11_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildDeletePath,
  buildJwtHeaders,
  buildNoAuthHeaders,
  JWT_BAD_SIGNATURE,
  JWT_NO_PLAYER,
  DECK_ID,
  SPEC_MESSAGE,
} from "../../../pages/api/a15/a15_11_api_deck_builder_deck_delete.api";

const HAS_API = !!process.env.A15_11_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常削除＝200（正本md: レスポンス成功 code:200）").toBe(200);
}
function expect401(status: number) {
  expect(status, "認証拒否＝401（正本md: 認証・認可／InvalidTokenException|PlayerNotFoundException|DeckAccessDeniedException）").toBe(401);
}
function expect404(status: number) {
  expect(status, "対象デッキなし＝404（正本md: DeckNotFoundException）").toBe(404);
}
async function expectSuccessBody(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(body.code, "成功本文は code:200（正本md: {code, message}）").toBe(200);
  // メッセージは正本md文言「Deck delete success」で照合（実装 en「Deck deletion succeeded」と乖離＝付帯表4#2）。本文全体を文字列化して文言の存在で照合。
  expect(JSON.stringify(body), "成功本文に message=\"Deck delete success\" を含む（正本md文言・付帯表4#2）").toContain(SPEC_MESSAGE.DELETE_SUCCESS);
}
async function expectMessageContains(res: { json: () => Promise<unknown> }, message: string, why: string) {
  const body = (await res.json()) as Record<string, unknown>;
  // 応答 {code, message} の message を正本md文言で照合。要素形の差異を吸収するため本文全体を文字列化して文言の存在で照合する。
  expect(JSON.stringify(body), why).toContain(message);
}

test.describe("API > デッキビルダー_デッキ削除", { tag: ["@api", "@a15"] }, () => {
  // ===== 正常削除（IT-09 / IT-10 / IT-32） =====

  test("E2E-A15-11-001 正常リクエストで自身デッキの削除が成功する", async () => {
    test.skip(!HAS_API, "A15_11_READY(SEED-A15-11-JWT-PLAYER/DECK) 未設定");
    const ctx = await newCtx();
    const res = await ctx.delete(buildDeletePath(DECK_ID.TARGET), { headers: buildJwtHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-11-002 削除実行後の処理結果が成功と一致する", async () => {
    test.skip(!HAS_API, "A15_11_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.delete(buildDeletePath(DECK_ID.TARGET), { headers: buildJwtHeaders() });
    expect200(res.status());
    await expectSuccessBody(res); // 処理結果（成功）が応答 {code:200, message} と一致。論理削除のDB反映はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-11-003 成功時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A15_11_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.delete(buildDeletePath(DECK_ID.TARGET), { headers: buildJwtHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-11-004 成功レスポンス本文がcodeとmessageを含む", async () => {
    test.skip(!HAS_API, "A15_11_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.delete(buildDeletePath(DECK_ID.TARGET), { headers: buildJwtHeaders() });
    expect200(res.status());
    await expectSuccessBody(res); // 正本md: 成功本文は {code:200, message:"Deck delete success"}（付帯表4#2）。
    await ctx.dispose();
  });

  test("E2E-A15-11-005 正常通信で200が返る", async () => {
    test.skip(!HAS_API, "A15_11_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.delete(buildDeletePath(DECK_ID.TARGET), { headers: buildJwtHeaders() });
    expect200(res.status()); // DELETE通信成立・成功＝200。
    await ctx.dispose();
  });

  test("E2E-A15-11-006 対象条件に該当する正常値で200が返る", async () => {
    test.skip(!HAS_API, "A15_11_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.delete(buildDeletePath(DECK_ID.TARGET), { headers: buildJwtHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-11-007 成功レスポンス書式がcode/messageと一致する", async () => {
    test.skip(!HAS_API, "A15_11_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.delete(buildDeletePath(DECK_ID.TARGET), { headers: buildJwtHeaders() });
    expect200(res.status());
    await expectSuccessBody(res); // 正本md: 成功書式は {code, message}（code=200・message="Deck delete success"）。
    await ctx.dispose();
  });

  test("E2E-A15-11-008 入力受信検証を満たすリクエストで削除成功200となる", async () => {
    test.skip(!HAS_API, "A15_11_READY 未設定");
    const ctx = await newCtx();
    // jwt-token ヘッダと path id がいずれも有効＝受信検証を満たす正常リクエスト。
    const res = await ctx.delete(buildDeletePath(DECK_ID.TARGET), { headers: buildJwtHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-11-009 必須のjwt-tokenとpath idが揃うと削除が成功する", async () => {
    test.skip(!HAS_API, "A15_11_READY 未設定");
    const ctx = await newCtx();
    // 必須の認証ヘッダ（jwt-token）と必須の path id（integer）を満たす。
    const res = await ctx.delete(buildDeletePath(DECK_ID.TARGET), { headers: buildJwtHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  // ===== 資格情報・認可（IT-32 / IT-10） =====

  test("E2E-A15-11-020 有効なJWTかつ所有者で削除が成功する", async () => {
    test.skip(!HAS_API, "A15_11_READY(SEED-A15-11-JWT-PLAYER/DECK) 未設定");
    const ctx = await newCtx();
    const res = await ctx.delete(buildDeletePath(DECK_ID.TARGET), { headers: buildJwtHeaders() });
    expect200(res.status()); // 資格情報が有効かつ所有者＝200。
    await ctx.dispose();
  });

  // ===== 認証失敗（IT-10 / IT-32。HS256署名検証の実方式は要実機確認＝E2E可否セル修飾のため test.fixme） =====

  test.fixme("E2E-A15-11-021 jwt-tokenヘッダ欠落で401となり削除されない", async () => {
    test.skip(!HAS_API, "A15_11_READY(SEED-A15-11-DECK) 未設定");
    const ctx = await newCtx();
    const res = await ctx.delete(buildDeletePath(DECK_ID.TARGET), { headers: buildNoAuthHeaders() });
    expect401(res.status()); // ヘッダ欠落＝認証拒否401。対象デッキが論理削除されないことはDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test.fixme("E2E-A15-11-022 署名不正のJWTで401となり削除されない", async () => {
    test.skip(!HAS_API, "A15_11_READY(SEED-A15-11-DECK) 未設定");
    const ctx = await newCtx();
    const res = await ctx.delete(buildDeletePath(DECK_ID.TARGET), { headers: buildJwtHeaders(JWT_BAD_SIGNATURE) });
    expect401(res.status()); // 署名検証失敗＝401。HS256署名検証の実方式は要実機確認だが結果（401・非削除）で判定。非削除はDB照査で補完。
    await ctx.dispose();
  });

  test.fixme("E2E-A15-11-023 該当プレイヤーが無いJWTで401となる", async () => {
    test.skip(!HAS_API, "A15_11_READY(SEED-A15-11-DECK) 未設定");
    const ctx = await newCtx();
    const res = await ctx.delete(buildDeletePath(DECK_ID.TARGET), { headers: buildJwtHeaders(JWT_NO_PLAYER) });
    expect401(res.status()); // JWTの顧客IDからプレイヤーを特定できず401（PlayerNotFoundException）。非削除はDB照査で補完。
    await ctx.dispose();
  });

  // ===== 所有者外（IT-10） =====

  test("E2E-A15-11-024 他人デッキの削除で401となり削除されない", async () => {
    test.skip(!HAS_API, "A15_11_READY(SEED-A15-11-JWT-PLAYER/DECK-OTHER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.delete(buildDeletePath(DECK_ID.OTHER), { headers: buildJwtHeaders() });
    expect401(res.status()); // 別プレイヤー所有＝DeckAccessDeniedException→401。
    await expectMessageContains(res, SPEC_MESSAGE.AUTH_FAILED, "本文に message=\"Authentication failed\" を含む（正本md文言・付帯表4#6 乖離なし）");
    // 対象デッキが削除されないことはDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  // ===== データなし（IT-32） =====

  test("E2E-A15-11-030 存在しないデッキIDで404となり本文を返す", async () => {
    test.skip(!HAS_API, "A15_11_READY(SEED-A15-11-JWT-PLAYER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.delete(buildDeletePath(DECK_ID.NONEXISTENT), { headers: buildJwtHeaders() });
    expect404(res.status()); // 該当デッキなし＝DeckNotFoundException→404。
    await expectMessageContains(res, SPEC_MESSAGE.DECK_NOT_FOUND, "本文に message=\"The deck does not exist\" を含む（正本md文言・付帯表4#3。実装 en「Deck is not found」と乖離）");
    await ctx.dispose();
  });

  // ===== 区分整合・副作用（IT-33。一次オラクル＝API応答＋DB副作用照合） =====

  test("E2E-A15-11-050 削除後に関連テーブル・他デッキが物理削除されず不変", async () => {
    test.skip(!HAS_API, "A15_11_READY(SEED-A15-11-JWT-PLAYER/DECK 採用カードあり/DECK-OTHER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.delete(buildDeletePath(DECK_ID.TARGET), { headers: buildJwtHeaders() });
    expect200(res.status());
    // 一次オラクル: 対象デッキの採用カード等関連テーブル（dtb_deck_card）は物理削除されず、別プレイヤーの他デッキ（dtb_deck）も変動しない。
    // DB副作用はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  // ===== Redis下書き削除（IT-10。一次オラクル＝Redis副作用照合） =====

  test("E2E-A15-11-070 削除後にRedis一時保存(下書き)が残らない", async () => {
    test.skip(!HAS_API, "A15_11_READY(SEED-A15-11-JWT-PLAYER/DECK Redis下書きあり) 未設定");
    const ctx = await newCtx();
    const res = await ctx.delete(buildDeletePath(DECK_ID.TARGET), { headers: buildJwtHeaders() });
    expect200(res.status());
    // 一次オラクル: 当該デッキのRedis一時保存（下書き）が削除され、削除後に下書きが残らない。
    // Redis副作用はDB（Redis）照査で補完（本リポでRedisは実行しない）。
    await ctx.dispose();
  });

  // ===== 論理削除のDB副作用（IT-05・設計書補完。一次オラクル＝DB副作用照合。本specはAPI応答を確認しDB照査で補完） =====

  test("E2E-A15-11-120 削除でデッキのdeleted_atに現在日時が設定される", async () => {
    test.skip(!HAS_API, "A15_11_READY(SEED-A15-11-JWT-PLAYER/DECK) 未設定");
    const ctx = await newCtx();
    const res = await ctx.delete(buildDeletePath(DECK_ID.TARGET), { headers: buildJwtHeaders() });
    expect200(res.status());
    // 一次オラクル: dtb_deck.deleted_at に現在日時が設定され論理削除される。DB副作用はDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-11-121 レコードは物理削除されずdeleted_atのみ更新される", async () => {
    test.skip(!HAS_API, "A15_11_READY(SEED-A15-11-JWT-PLAYER/DECK) 未設定");
    const ctx = await newCtx();
    const res = await ctx.delete(buildDeletePath(DECK_ID.TARGET), { headers: buildJwtHeaders() });
    expect200(res.status());
    // 一次オラクル: dtb_deck の当該レコードは物理削除されず残り、deleted_at のみ更新（物理削除ではない）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A15-11-122 論理削除後に検索・参照の対象から外れる", async () => {
    test.skip(!HAS_API, "A15_11_READY(SEED-A15-11-JWT-PLAYER/DECK) 未設定");
    const ctx = await newCtx();
    const res = await ctx.delete(buildDeletePath(DECK_ID.TARGET), { headers: buildJwtHeaders() });
    expect200(res.status());
    // 一次オラクル: deleted_at が NULL でないため検索・参照対象（deleted_at IS NULL）から外れる。DB照査で補完。
    await ctx.dispose();
  });
});
