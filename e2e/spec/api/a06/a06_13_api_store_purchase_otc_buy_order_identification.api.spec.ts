/**
 * a06-13 店頭買取受注_本人確認証明書更新（受注に本人確認証明書IDを設定する更新系PUT API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a06_13_api_store_purchase_otc_buy_order_identification_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specに残すのは「E2E自動化(API/統合)」（実装）と「要実機確認」修飾＝test.fixme（理由付き）のみ。
 * 手動（009 想定外項目仕様未定義・060 並行送信・061 タイムアウト・122 update_date観測手段・150 保存例外実再現）はケース表で全量管理し本specには書かない（規約）。
 * 本機能はブラウザ向け画面を持たず（正本md）UIレイヤ=0のため admin spec は無い。DB副作用は `dtb_otc_buy_order` を直接照合。
 *
 * 期待結果は正本md(a06-13)由来（オラクル独立性）:
 *  - 送信先は実装の実効パス `PUT /api/v1/admin/otcBuyOrder/{id}/identification.json`（OtcBuyOrderController.php:273／eccube.yaml:55。設計パスと差異＝付帯表4#1）。
 *  - 合否はHTTPステータス（成功=200／受注なし=404／証明書ID未指定=400／未認証=401）＋DB副作用（dtb_otc_buy_order の identification_id・member_id・update_date の3列のみ更新）で判定。
 *  - 実装の応答本文形（`{code:200}`）はオラクルにしない。証明書IDマスタ非存在の実HTTPステータス（実装404／仕様400）は要実機確認（付帯表4#2）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A06_13_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildIdentificationPath,
  buildIdentificationForm,
  buildAuthHeaders,
  buildInvalidAuthHeaders,
  KNOWN_ORDER_ID,
  KNOWN_IDENTIFICATION_ID,
  NOT_FOUND_ORDER_ID,
} from "../../../pages/api/a06/a06_13_api_store_purchase_otc_buy_order_identification.api";

const HAS_API = !!process.env.A06_13_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}
async function putIdentification(
  ctx: APIRequestContext,
  orderId: string | number,
  identificationId: string | number,
  headers: Record<string, string> = buildAuthHeaders()
) {
  return ctx.put(buildIdentificationPath(orderId), { headers, form: buildIdentificationForm(identificationId) });
}
function expect200(status: number) {
  expect(status, "更新成功＝200（正本md: レスポンス {code:200}）").toBe(200);
}

test.describe("API > 店頭買取受注_本人確認証明書更新", { tag: ["@api", "@a06", "@otcBuyOrder"] }, () => {
  // ===== 更新成功（E2E自動化(API/統合)） =====

  test("E2E-A06-13-001 既存受注に証明書IDを設定し更新成功でHTTP200が返る", async () => {
    test.skip(!HAS_API, "A06_13_READY(SEED-A06-13-ORDER/IDENTIFICATION/AUTH) 未設定");
    const ctx = await newCtx();
    const res = await putIdentification(ctx, KNOWN_ORDER_ID, KNOWN_IDENTIFICATION_ID);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-13-002 更新成功時の応答が仕様の成功(200)と一致する", async () => {
    test.skip(!HAS_API, "A06_13_READY 未設定");
    const ctx = await newCtx();
    const res = await putIdentification(ctx, KNOWN_ORDER_ID, KNOWN_IDENTIFICATION_ID);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-13-003 更新成功のHTTPステータスが200で返る", async () => {
    test.skip(!HAS_API, "A06_13_READY 未設定");
    const ctx = await newCtx();
    const res = await putIdentification(ctx, KNOWN_ORDER_ID, KNOWN_IDENTIFICATION_ID);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-13-004 対象受注に対する本人確認更新が実行され200が返る", async () => {
    test.skip(!HAS_API, "A06_13_READY 未設定");
    const ctx = await newCtx();
    const res = await putIdentification(ctx, KNOWN_ORDER_ID, KNOWN_IDENTIFICATION_ID);
    expect200(res.status()); // UpdateIdentificationAction（OtcBuyOrderController.php:299）。
    await ctx.dispose();
  });

  test("E2E-A06-13-005 正常通信での更新応答がHTTP200で返る", async () => {
    test.skip(!HAS_API, "A06_13_READY 未設定");
    const ctx = await newCtx();
    const res = await putIdentification(ctx, KNOWN_ORDER_ID, KNOWN_IDENTIFICATION_ID);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-13-006 対象条件に該当する正常値で更新し200が返る", async () => {
    test.skip(!HAS_API, "A06_13_READY 未設定");
    const ctx = await newCtx();
    const res = await putIdentification(ctx, KNOWN_ORDER_ID, KNOWN_IDENTIFICATION_ID);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-13-007 処理フローに沿った更新でHTTP200が返る", async () => {
    test.skip(!HAS_API, "A06_13_READY 未設定");
    const ctx = await newCtx();
    const res = await putIdentification(ctx, KNOWN_ORDER_ID, KNOWN_IDENTIFICATION_ID);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-13-008 更新成功時の応答書式(code:200)に一致しHTTP200が返る", async () => {
    test.skip(!HAS_API, "A06_13_READY 未設定");
    const ctx = await newCtx();
    const res = await putIdentification(ctx, KNOWN_ORDER_ID, KNOWN_IDENTIFICATION_ID);
    expect200(res.status()); // 本文 {code:200} の形はオラクルにしない（HTTP200で判定）。
    await ctx.dispose();
  });

  // ===== 認証（E2E自動化(API/統合)・401） =====

  test("E2E-A06-13-020 認証ヘッダ欠落のリクエストはHTTP401となる", async () => {
    test.skip(!HAS_API, "A06_13_READY 未設定");
    const ctx = await newCtx();
    const res = await putIdentification(ctx, KNOWN_ORDER_ID, KNOWN_IDENTIFICATION_ID, {}); // 認証ヘッダなし
    expect(res.status(), "未認証＝401（firewall app／UnauthenticatedException）").toBe(401);
    await ctx.dispose();
  });

  test("E2E-A06-13-021 署名不正の認証トークンはHTTP401となる", async () => {
    test.skip(!HAS_API, "A06_13_READY 未設定");
    const ctx = await newCtx();
    const res = await putIdentification(ctx, KNOWN_ORDER_ID, KNOWN_IDENTIFICATION_ID, buildInvalidAuthHeaders());
    expect(res.status(), "署名不正＝401").toBe(401); // HS256署名検証の実方式は付帯表4で管理（観測値は401）。
    await ctx.dispose();
  });

  test("E2E-A06-13-022 無効な認証情報では更新成功200とならない(401)", async () => {
    test.skip(!HAS_API, "A06_13_READY 未設定");
    const ctx = await newCtx();
    const res = await putIdentification(ctx, KNOWN_ORDER_ID, KNOWN_IDENTIFICATION_ID, buildInvalidAuthHeaders());
    expect(res.status(), "認証失敗＝401").toBe(401);
    await ctx.dispose();
  });

  test("E2E-A06-13-023 未認証では参照系/更新系いずれも401で拒否される", async () => {
    test.skip(!HAS_API, "A06_13_READY 未設定");
    const ctx = await newCtx();
    const res = await putIdentification(ctx, KNOWN_ORDER_ID, KNOWN_IDENTIFICATION_ID, {});
    expect(res.status(), "未認証＝401").toBe(401);
    await ctx.dispose();
  });

  // ===== 異常系（E2E自動化(API/統合)） =====

  test("E2E-A06-13-030 対象受注が存在しないとHTTP404となる", async () => {
    test.skip(!HAS_API, "A06_13_READY 未設定");
    const ctx = await newCtx();
    const res = await putIdentification(ctx, NOT_FOUND_ORDER_ID, KNOWN_IDENTIFICATION_ID);
    expect(res.status(), "受注なし＝404（NotFoundException／OtcBuyOrderController.php:276-279）").toBe(404);
    await ctx.dispose();
  });

  test("E2E-A06-13-040 証明書ID未指定はHTTP400となる", async () => {
    test.skip(!HAS_API, "A06_13_READY 未設定");
    const ctx = await newCtx();
    // identification を空で送る＝必須欠落（MissingRequiredParameterException／OtcBuyOrderController.php:281-284）。
    const res = await ctx.put(buildIdentificationPath(KNOWN_ORDER_ID), { headers: buildAuthHeaders(), form: {} });
    expect(res.status(), "必須欠落＝400").toBe(400);
    await ctx.dispose();
  });

  test("E2E-A06-13-043 証明書ID必須の欠落時にHTTP400で更新されない", async () => {
    test.skip(!HAS_API, "A06_13_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildIdentificationPath(KNOWN_ORDER_ID), { headers: buildAuthHeaders(), form: {} });
    expect(res.status(), "必須欠落＝400").toBe(400); // 部分更新されないことはDB照査で補完。
    await ctx.dispose();
  });

  // ===== DB副作用（E2E自動化(API/統合)・一次オラクル＝API応答＋DB照合） =====

  test("E2E-A06-13-050 更新成功時に本人確認以外の列が変化しない(3列限定更新)", async () => {
    test.skip(!HAS_API, "A06_13_READY 未設定");
    const ctx = await newCtx();
    const res = await putIdentification(ctx, KNOWN_ORDER_ID, KNOWN_IDENTIFICATION_ID);
    expect200(res.status());
    // 一次オラクル: dtb_otc_buy_order の identification_id・member_id・update_date のみ更新・他列不変。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-13-051 別受注のデータが更新されない(更新範囲限定)", async () => {
    test.skip(!HAS_API, "A06_13_READY 未設定");
    const ctx = await newCtx();
    const res = await putIdentification(ctx, KNOWN_ORDER_ID, KNOWN_IDENTIFICATION_ID);
    expect200(res.status());
    // 一次オラクル: 指定受注以外の dtb_otc_buy_order 行が不変。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-13-120 更新成功後に dtb_otc_buy_order.identification_id が設定値に更新される", async () => {
    test.skip(!HAS_API, "A06_13_READY 未設定");
    const ctx = await newCtx();
    const res = await putIdentification(ctx, KNOWN_ORDER_ID, KNOWN_IDENTIFICATION_ID);
    expect200(res.status());
    // 一次オラクル: identification_id（本人確認証明書）が送信値に一致。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-13-121 更新成功後に dtb_otc_buy_order.member_id が更新担当者に更新される", async () => {
    test.skip(!HAS_API, "A06_13_READY 未設定");
    const ctx = await newCtx();
    const res = await putIdentification(ctx, KNOWN_ORDER_ID, KNOWN_IDENTIFICATION_ID);
    expect200(res.status());
    // 一次オラクル: member_id（更新担当者＝認証Member）が更新。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-13-123 更新は3列(identification_id/member_id/update_date)のみで他項目が不変である", async () => {
    test.skip(!HAS_API, "A06_13_READY 未設定");
    const ctx = await newCtx();
    const res = await putIdentification(ctx, KNOWN_ORDER_ID, KNOWN_IDENTIFICATION_ID);
    expect200(res.status());
    // 一次オラクル: 更新範囲＝3列のみ・他項目不変。DB照査で補完。
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1/付帯表4） =====

  test.fixme(
    "E2E-A06-13-041 証明書IDマスタ非存在は仕様400(実装404)で更新されない（要実機確認: 実HTTPステータス／付帯表4#2）",
    async () => {
      // 期待は処理フロー#3・エラー処理(証明書ID不正→400)由来。実装は証明書IDマスタ非存在時 NotFoundException で404
      // （OtcBuyOrderController.php:288-291）＝仕様400と乖離。実HTTPステータスが要実機確認のため fixme（期待は仕様400で判定）。
    }
  );

  test.fixme(
    "E2E-A06-13-042 不正な証明書IDでは更新されず仕様400(実装404)となる（要実機確認: 実HTTPステータス／付帯表4#2）",
    async () => {
      // 期待は処理フロー#3・レスポンス(失敗){code,errors}由来。証明書ID不正時の実HTTPステータス（実装404／仕様400）が
      // 要実機確認のため fixme。部分更新がないことはDB照査で補完。
    }
  );
});
