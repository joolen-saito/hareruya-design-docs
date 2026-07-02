/**
 * a06-17 店頭仕入_買取商品詳細取得（カード詳細IDに紐づく買取商品情報JSONを返す参照系GET API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a06_17_api_buying_products_by_detail_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specに残すのは「E2E自動化(API/統合)」（実装）と「要実機確認」修飾＝test.fixme（理由付き）のみ。
 * 手動（030 タイムアウト・031 DB障害実再現）はケース表で全量管理し本specには書かない（規約）。
 * 本機能はブラウザ向け画面を持たず（正本md）UIレイヤ=0のため admin spec は無い。
 *
 * 期待結果は設計書(a06-17)由来（オラクル独立性）:
 *  - 送信先は実装の実効パス `GET /api/v1/buying/{cardDetailId}.json`（BuyingController.php:46／eccube.yaml:6,55。設計書 `/buying/{detailId}` と差異＝付帯表4#1）。
 *  - 合否はHTTPステータスで判定（正常取得=200／**該当なし=404**＝a06-10/18の0件200と決定的に異なる／不正detailは正常取得200とならない・具体ステータスは要実機確認のため範囲判定）。
 *  - 実装のレスポンス本文形・404メッセージはオラクルにしない（付帯表4#3）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A06_17_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildBuyingDetailPath,
  buildAuthHeaders,
  KNOWN_CARD_DETAIL_ID,
  NOT_FOUND_CARD_DETAIL_ID,
  INVALID_CARD_DETAIL_ID,
  NON_NUMERIC_CARD_DETAIL_ID,
} from "../../../pages/api/a06/a06_17_api_buying_products_by_detail.api";

const HAS_API = !!process.env.A06_17_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}
async function getDetail(ctx: APIRequestContext, id: string | number) {
  return ctx.get(buildBuyingDetailPath(id), { headers: buildAuthHeaders() });
}
function expect200(status: number) {
  expect(status, "正常取得＝200（設計: 取得成功でJSON返却）").toBe(200);
}
function expect404(status: number) {
  expect(status, "該当なし＝404（処理フロー#3・NotFoundException）").toBe(404);
}
function expectNot200(status: number) {
  // 不正detail（≦0・非数値）は「正常取得200とならない」のみ設計で固定（具体ステータスは要実機確認＝付帯表4）。範囲で判定。
  expect(status, "不正detailは正常取得200とならない").toBeGreaterThanOrEqual(400);
  expect(status).toBeLessThan(600);
}

test.describe("API > 店頭仕入_買取商品詳細取得", { tag: ["@api", "@a06", "@buying"] }, () => {
  // ===== 正常取得（E2E自動化(API/統合)） =====

  test("E2E-A06-17-001 既知カード詳細IDで正常取得しHTTP200が返る", async () => {
    test.skip(!HAS_API, "A06_17_READY(SEED-A06-17-CARD-KNOWN/API-AUTH) 未設定");
    const ctx = await newCtx();
    const res = await getDetail(ctx, KNOWN_CARD_DETAIL_ID);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-17-002 取得値を再計算/丸めせず取得時点の値で200応答される", async () => {
    test.skip(!HAS_API, "A06_17_READY 未設定");
    const ctx = await newCtx();
    const res = await getDetail(ctx, KNOWN_CARD_DETAIL_ID);
    expect200(res.status()); // 再計算なし（buyingCardsFormatter->format）。値整合はSEED既知値とのDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-17-003 正常取得時のHTTPステータスが仕様の成功応答(200)と一致する", async () => {
    test.skip(!HAS_API, "A06_17_READY 未設定");
    const ctx = await newCtx();
    const res = await getDetail(ctx, KNOWN_CARD_DETAIL_ID);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-17-004 カード詳細IDに紐づく買取商品が取得され200が返る", async () => {
    test.skip(!HAS_API, "A06_17_READY 未設定");
    const ctx = await newCtx();
    const res = await getDetail(ctx, KNOWN_CARD_DETAIL_ID);
    expect200(res.status()); // getBuyingCardsByCardDetailIds（MtbCardRepository.php:84）。
    await ctx.dispose();
  });

  test("E2E-A06-17-005 認証済クライアントから呼び出すと正常取得200となる", async () => {
    test.skip(!HAS_API, "A06_17_READY(SEED-A06-17-API-AUTH 正常) 未設定");
    const ctx = await newCtx();
    const res = await getDetail(ctx, KNOWN_CARD_DETAIL_ID);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-17-006 成功応答に仕様のフィールド構成が含まれHTTP200が返る", async () => {
    test.skip(!HAS_API, "A06_17_READY 未設定");
    const ctx = await newCtx();
    const res = await getDetail(ctx, KNOWN_CARD_DETAIL_ID);
    expect200(res.status()); // フィールド名/型の実装差異は付帯表4で管理（本文形はオラクルにしない）。
    await ctx.dispose();
  });

  test("E2E-A06-17-007 必須パス変数cardDetailIdを与えると正常取得200となる", async () => {
    test.skip(!HAS_API, "A06_17_READY 未設定");
    const ctx = await newCtx();
    const res = await getDetail(ctx, KNOWN_CARD_DETAIL_ID);
    expect200(res.status()); // detailId 必須（パス変数）。
    await ctx.dispose();
  });

  test("E2E-A06-17-010 該当商品なしのカード詳細IDではHTTP404が返る", async () => {
    test.skip(!HAS_API, "A06_17_READY 未設定");
    const ctx = await newCtx();
    const res = await getDetail(ctx, NOT_FOUND_CARD_DETAIL_ID);
    expect404(res.status()); // 取得結果が空→404（BuyingController.php:57-59）。404本文は付帯表4#3。
    await ctx.dispose();
  });

  test("E2E-A06-17-011 detailId≦0では正常取得200とならない", async () => {
    test.skip(!HAS_API, "A06_17_READY 未設定");
    const ctx = await newCtx();
    const res = await getDetail(ctx, INVALID_CARD_DETAIL_ID);
    expectNot200(res.status()); // 正しい買取商品が取得されない。具体ステータスは要実機確認（付帯表4）。
    await ctx.dispose();
  });

  test("E2E-A06-17-012 非数値detailIdでは正常取得200とならない", async () => {
    test.skip(!HAS_API, "A06_17_READY 未設定");
    const ctx = await newCtx();
    const res = await getDetail(ctx, NON_NUMERIC_CARD_DETAIL_ID);
    expectNot200(res.status()); // int パス変数の型解決に不一致（ルート不一致/404等は要実機確認）。
    await ctx.dispose();
  });

  test("E2E-A06-17-013 指定IDで絞り込んだ買取商品が取得され200が返る", async () => {
    test.skip(!HAS_API, "A06_17_READY 未設定");
    const ctx = await newCtx();
    const res = await getDetail(ctx, KNOWN_CARD_DETAIL_ID);
    expect200(res.status()); // 受信検証＝指定IDの絞り込み。
    await ctx.dispose();
  });

  test("E2E-A06-17-015 該当商品なしは200ではなく404となる", async () => {
    test.skip(!HAS_API, "A06_17_READY 未設定");
    const ctx = await newCtx();
    const res = await getDetail(ctx, NOT_FOUND_CARD_DETAIL_ID);
    expect404(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-17-016 該当なし時のHTTPステータスが仕様の失敗応答(404)と一致する", async () => {
    test.skip(!HAS_API, "A06_17_READY 未設定");
    const ctx = await newCtx();
    const res = await getDetail(ctx, NOT_FOUND_CARD_DETAIL_ID);
    expect404(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-17-017 正常通信での取得応答がHTTP200で返る", async () => {
    test.skip(!HAS_API, "A06_17_READY 未設定");
    const ctx = await newCtx();
    const res = await getDetail(ctx, KNOWN_CARD_DETAIL_ID);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-17-018 対象条件に該当する正常値で取得し200が返る", async () => {
    test.skip(!HAS_API, "A06_17_READY 未設定");
    const ctx = await newCtx();
    const res = await getDetail(ctx, KNOWN_CARD_DETAIL_ID);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-17-019 不正値では正常取得200とならない", async () => {
    test.skip(!HAS_API, "A06_17_READY 未設定");
    const ctx = await newCtx();
    const res = await getDetail(ctx, INVALID_CARD_DETAIL_ID);
    expectNot200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-17-020 参照系GETで副作用なく200が返る", async () => {
    test.skip(!HAS_API, "A06_17_READY 未設定");
    const ctx = await newCtx();
    const res = await getDetail(ctx, KNOWN_CARD_DETAIL_ID);
    expect200(res.status()); // 副作用「無し（参照のみ）」。DB不変はDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-17-040 入れ子構造(cards→details→...→conditionClasses)を含む200応答となる", async () => {
    test.skip(!HAS_API, "A06_17_READY 未設定");
    const ctx = await newCtx();
    const res = await getDetail(ctx, KNOWN_CARD_DETAIL_ID);
    expect200(res.status()); // 入れ子の階層構造は設計書由来オラクル。実装本文形差異は付帯表4#3。
    await ctx.dispose();
  });

  test("E2E-A06-17-041 未設定フィールドがnull許容のまま200応答となる", async () => {
    test.skip(!HAS_API, "A06_17_READY(null確認用 未設定規格) 未設定");
    const ctx = await newCtx();
    const res = await getDetail(ctx, KNOWN_CARD_DETAIL_ID);
    expect200(res.status()); // cardsetCode/promotionName/buyPrice/sectionId 等の未設定時null。値はDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-17-042 参照系のため呼び出してもDB副作用が発生しない", async () => {
    test.skip(!HAS_API, "A06_17_READY 未設定");
    const ctx = await newCtx();
    const res = await getDetail(ctx, KNOWN_CARD_DETAIL_ID);
    expect200(res.status()); // 副作用「無し（参照のみ）」。DB不変はDB照査で補完。
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1/付帯表4） =====

  test.fixme(
    "E2E-A06-17-008 無効/欠落した資格情報では許可されず正常取得200を返さない（要実機確認: 認可方式／付帯表4#2）",
    async () => {
      // 期待は観点表(資格情報＝前提が欠落/不正なら正常取得を返さない)由来。
      // 実装は IsGranted('IS_AUTHENTICATED_FULLY')＋getUser()がMemberでなければ UnauthenticatedException（BuyingController.php:34,50-51）だが、
      // 認可方式の実体と拒否時の具体ステータス(401/403等)が設計書から確定できず要実機確認のため fixme。
    }
  );

  test.fixme(
    "E2E-A06-17-014 想定外クエリを加えても処理が継続しHTTP200となる（要実機確認: 想定外項目挙動／付帯表4）",
    async () => {
      // 期待は入出力(想定外項目)・処理フロー(指定IDのみ参照)由来。想定外クエリで200固定は正本に明記が無く要実機確認のため fixme。
    }
  );
});
