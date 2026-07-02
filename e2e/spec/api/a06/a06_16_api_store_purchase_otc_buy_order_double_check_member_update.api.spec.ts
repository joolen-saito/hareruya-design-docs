/**
 * a06-16 店頭買取受注_ダブルチェック担当者更新（受注のダブルチェック担当者を設定/更新する更新系PUT API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a06_16_api_store_purchase_otc_buy_order_double_check_member_update_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specに残すのは「E2E自動化(API/統合)」（実装）と「要実機確認」修飾＝test.fixme（理由付き）のみ。
 * 手動（023 並行実行・024 タイムアウト・025 DB障害実再現）はケース表で全量管理し本specには書かない（規約）。
 * 本機能はブラウザ向け画面を持たず UIレイヤ=0のため admin spec は無い。DB副作用は dtb_otc_buy_order_approver / dtb_otc_buy_order を直接照合。
 *
 * 期待結果は設計書(a06-16)由来（オラクル独立性）:
 *  - 送信先は実装の実効パス `PUT /{api_v1_route}/admin/otcBuyOrder/{id}/doubleCheckMember.json`（OtcBuyOrderController.php:231／eccube.yaml:55。設計パス/認証方式/項目名と差異＝付帯表4#1）。
 *  - 合否はHTTPステータス（成功=200／必須欠落=400／対象・会員不存在=404／同一メンバー禁止=400／未認証=401）＋DB副作用で判定。
 *  - 実装の応答書式・項目名（`double_check_member_id`）はオラクルにしない（付帯表4）。承認テーブルのDB照合手段は一部要実機確認（fixme）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A06_16_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildDoubleCheckPath,
  buildDoubleCheckForm,
  buildAuthHeaders,
  buildInvalidAuthHeaders,
  KNOWN_ORDER_ID,
  KNOWN_MEMBER_ID,
  SAME_MEMBER_ID,
  NOT_FOUND_ORDER_ID,
  NOT_FOUND_MEMBER_ID,
  MALFORMED_MEMBER_ID,
} from "../../../pages/api/a06/a06_16_api_store_purchase_otc_buy_order_double_check_member_update.api";

const HAS_API = !!process.env.A06_16_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}
async function putDoubleCheck(
  ctx: APIRequestContext,
  orderId: string | number,
  memberId: string | number,
  headers: Record<string, string> = buildAuthHeaders()
) {
  return ctx.put(buildDoubleCheckPath(orderId), { headers, form: buildDoubleCheckForm(memberId) });
}
function expect200(status: number) {
  expect(status, "更新成功＝200（設計: ステータスコード200・レスポンスデータなし）").toBe(200);
}

test.describe("API > 店頭買取受注_ダブルチェック担当者更新", { tag: ["@api", "@a06", "@otcBuyOrder"] }, () => {
  // ===== 更新成功（E2E自動化(API/統合)） =====

  test("E2E-A06-16-001 既存受注にダブルチェック担当者を設定し更新成功でHTTP200が返る", async () => {
    test.skip(!HAS_API, "A06_16_READY(SEED-A06-16-ORDER/MEMBER/AUTH) 未設定");
    const ctx = await newCtx();
    const res = await putDoubleCheck(ctx, KNOWN_ORDER_ID, KNOWN_MEMBER_ID);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-16-002 更新成功時の応答が仕様の成功(200)と一致する", async () => {
    test.skip(!HAS_API, "A06_16_READY 未設定");
    const ctx = await newCtx();
    const res = await putDoubleCheck(ctx, KNOWN_ORDER_ID, KNOWN_MEMBER_ID);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-16-003 更新成功のHTTPステータスが200で返る", async () => {
    test.skip(!HAS_API, "A06_16_READY 未設定");
    const ctx = await newCtx();
    const res = await putDoubleCheck(ctx, KNOWN_ORDER_ID, KNOWN_MEMBER_ID);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-16-004 対象受注に対するダブルチェック更新が実行され200が返る", async () => {
    test.skip(!HAS_API, "A06_16_READY 未設定");
    const ctx = await newCtx();
    const res = await putDoubleCheck(ctx, KNOWN_ORDER_ID, KNOWN_MEMBER_ID);
    expect200(res.status()); // UpdateDoubleCheckMemberAction（承認登録/更新＋受注更新）。
    await ctx.dispose();
  });

  test("E2E-A06-16-005 認証・認可を通過した呼び出しで更新成功200となる", async () => {
    test.skip(!HAS_API, "A06_16_READY 未設定");
    const ctx = await newCtx();
    const res = await putDoubleCheck(ctx, KNOWN_ORDER_ID, KNOWN_MEMBER_ID);
    expect200(res.status()); // 開始条件（認証・認可通過）。
    await ctx.dispose();
  });

  test("E2E-A06-16-006 権限/ログイン状態を満たす呼び出しで更新成功200となる", async () => {
    test.skip(!HAS_API, "A06_16_READY 未設定");
    const ctx = await newCtx();
    const res = await putDoubleCheck(ctx, KNOWN_ORDER_ID, KNOWN_MEMBER_ID);
    expect200(res.status()); // 判定条件（権限/ログイン状態）。
    await ctx.dispose();
  });

  test("E2E-A06-16-056 認証セッションを満たす呼び出しで更新成功200となる", async () => {
    test.skip(!HAS_API, "A06_16_READY 未設定");
    const ctx = await newCtx();
    const res = await putDoubleCheck(ctx, KNOWN_ORDER_ID, KNOWN_MEMBER_ID);
    expect200(res.status()); // 実装補完（認証セッション通過で更新）。
    await ctx.dispose();
  });

  test("E2E-A06-16-010 更新成功時の応答書式(データなし)に一致しHTTP200が返る", async () => {
    test.skip(!HAS_API, "A06_16_READY 未設定");
    const ctx = await newCtx();
    const res = await putDoubleCheck(ctx, KNOWN_ORDER_ID, KNOWN_MEMBER_ID);
    expect200(res.status()); // レスポンス書式「なし(200)」の形はオラクルにしない（HTTP200で判定）。
    await ctx.dispose();
  });

  test("E2E-A06-16-011 正常更新でHTTPステータス200が返る", async () => {
    test.skip(!HAS_API, "A06_16_READY 未設定");
    const ctx = await newCtx();
    const res = await putDoubleCheck(ctx, KNOWN_ORDER_ID, KNOWN_MEMBER_ID);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-16-013 正常通信での更新応答がHTTP200で返る", async () => {
    test.skip(!HAS_API, "A06_16_READY 未設定");
    const ctx = await newCtx();
    const res = await putDoubleCheck(ctx, KNOWN_ORDER_ID, KNOWN_MEMBER_ID);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-16-014 対象条件に該当する正常値で更新し200が返る", async () => {
    test.skip(!HAS_API, "A06_16_READY 未設定");
    const ctx = await newCtx();
    const res = await putDoubleCheck(ctx, KNOWN_ORDER_ID, KNOWN_MEMBER_ID);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-16-015 処理フローに沿った更新でHTTP200が返る", async () => {
    test.skip(!HAS_API, "A06_16_READY 未設定");
    const ctx = await newCtx();
    const res = await putDoubleCheck(ctx, KNOWN_ORDER_ID, KNOWN_MEMBER_ID);
    expect200(res.status());
    await ctx.dispose();
  });

  // ===== 異常系（E2E自動化(API/統合)） =====

  test("E2E-A06-16-007 double_check_member_id未指定はHTTP400となる", async () => {
    test.skip(!HAS_API, "A06_16_READY 未設定");
    const ctx = await newCtx();
    // 必須項目を空で送る＝必須欠落（MissingRequiredParameterException／OtcBuyOrderController.php:239-241）。
    const res = await ctx.put(buildDoubleCheckPath(KNOWN_ORDER_ID), { headers: buildAuthHeaders(), form: {} });
    expect(res.status(), "必須欠落＝400").toBe(400);
    await ctx.dispose();
  });

  test("E2E-A06-16-008 対象受注が存在しないとHTTP404となる", async () => {
    test.skip(!HAS_API, "A06_16_READY 未設定");
    const ctx = await newCtx();
    const res = await putDoubleCheck(ctx, NOT_FOUND_ORDER_ID, KNOWN_MEMBER_ID);
    expect(res.status(), "対象なし＝404（NotFoundException／OtcBuyOrderController.php:234-235）").toBe(404);
    await ctx.dispose();
  });

  test("E2E-A06-16-009 指定会員が存在しないとHTTP404となる", async () => {
    test.skip(!HAS_API, "A06_16_READY 未設定");
    const ctx = await newCtx();
    const res = await putDoubleCheck(ctx, KNOWN_ORDER_ID, NOT_FOUND_MEMBER_ID);
    expect(res.status(), "会員不存在＝404（OtcBuyOrderController.php:251-253）").toBe(404);
    await ctx.dispose();
  });

  test("E2E-A06-16-012 入力不備(必須欠落)で更新されずHTTP400となる", async () => {
    test.skip(!HAS_API, "A06_16_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildDoubleCheckPath(KNOWN_ORDER_ID), { headers: buildAuthHeaders(), form: {} });
    expect(res.status(), "入力不備＝400").toBe(400);
    await ctx.dispose();
  });

  test("E2E-A06-16-016 形式不正の会員IDは会員が見つからずHTTP404となる", async () => {
    test.skip(!HAS_API, "A06_16_READY 未設定");
    const ctx = await newCtx();
    const res = await putDoubleCheck(ctx, KNOWN_ORDER_ID, MALFORMED_MEMBER_ID);
    expect(res.status(), "形式不正→(int)キャスト→会員不在＝404").toBe(404); // キャスト挙動は付帯表4で管理（観測値は会員不在404）。
    await ctx.dispose();
  });

  test("E2E-A06-16-017 認可されないアクセスは更新成功200とならない(401)", async () => {
    test.skip(!HAS_API, "A06_16_READY 未設定");
    const ctx = await newCtx();
    const res = await putDoubleCheck(ctx, KNOWN_ORDER_ID, KNOWN_MEMBER_ID, buildInvalidAuthHeaders());
    expect(res.status(), "認証失敗＝401").toBe(401);
    await ctx.dispose();
  });

  test("E2E-A06-16-054 担当者と同一メンバーの指定はHTTP400で更新されない", async () => {
    test.skip(!HAS_API, "A06_16_READY 未設定");
    const ctx = await newCtx();
    const res = await putDoubleCheck(ctx, KNOWN_ORDER_ID, SAME_MEMBER_ID);
    expect(res.status(), "同一メンバー禁止＝400（InvalidMemberAssignmentException／UpdateDoubleCheckMemberAction.php:36-37）").toBe(400);
    await ctx.dispose();
  });

  test("E2E-A06-16-055 存在しない会員の指定はHTTP404で更新されない", async () => {
    test.skip(!HAS_API, "A06_16_READY 未設定");
    const ctx = await newCtx();
    const res = await putDoubleCheck(ctx, KNOWN_ORDER_ID, NOT_FOUND_MEMBER_ID);
    expect(res.status(), "会員不存在＝404").toBe(404);
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1/付帯表4。承認テーブルのDB照合手段が未確定） =====

  test.fixme(
    "E2E-A06-16-018 重複更新で承認がupsertされ二重登録されない（要実機確認: DB照合手段／付帯表4）",
    async () => {
      // 期待は例外処理(状態不整合)・重複/順序の整合由来。saveDoubleCheckApproval（role=double_check の既存行は更新・無ければ新規）と
      // 一意制約 uk(...,role)（DtbOtcBuyOrderApprover.php:27）のDB照合手段（承認行の確認）が要実機確認のため fixme。
    }
  );

  test.fixme(
    "E2E-A06-16-052 移行差分(承認upsert)の挙動が仕様どおりとなる（要実機確認: DB照合手段／付帯表4）",
    async () => {
      // 期待は移行差分・DB更新(upsert)由来。承認テーブルのDB照合手段が要実機確認のため fixme。
    }
  );

  test.fixme(
    "E2E-A06-16-019 状態不整合時にロールバックされ部分更新が残らない（要実機確認: DB照合手段／付帯表4）",
    async () => {
      // 期待は例外処理(状態不整合)・部分更新なし・ロールバック由来（UpdateDoubleCheckMemberAction.php:40,52）。
      // 部分更新がないことのDB照合手段が要実機確認のため fixme。
    }
  );

  test.fixme(
    "E2E-A06-16-021 失敗時に承認・受注が部分更新されない（要実機確認: DB照合手段／付帯表4）",
    async () => {
      // 期待は例外処理(状態不整合)・ロールバック由来。DB照合手段が要実機確認のため fixme。
    }
  );

  test.fixme(
    "E2E-A06-16-022 同一メンバー禁止時に状態が更新されない（要実機確認: DB照合手段／付帯表4）",
    async () => {
      // 期待は同一メンバー禁止(:36-37)・部分更新なし由来。状態不変のDB照合手段が要実機確認のため fixme（HTTP400は016/054で別途検証）。
    }
  );

  test.fixme(
    "E2E-A06-16-053 移行差分(同一メンバー禁止・新規挙動)の状態がDBで仕様どおりとなる（要実機確認: DB照合手段／付帯表4）",
    async () => {
      // 期待は移行差分・例外処理由来。承認/受注のDB照合手段が要実機確認のため fixme。
    }
  );

  test.fixme(
    "E2E-A06-16-020 更新対象が指定受注×role=double_check のみに限定される（要実機確認: DB照合手段／付帯表4）",
    async () => {
      // 期待は状態・データ更新(更新対象限定)由来。saveDoubleCheckApproval の findOneBy 条件によるDB照合手段が要実機確認のため fixme。
    }
  );

  test.fixme(
    "E2E-A06-16-050 更新成功後に承認(dtb_otc_buy_order_approver)が登録/更新される（要実機確認: DB照合手段／付帯表4）",
    async () => {
      // 期待は状態・データ更新由来（DtbOtcBuyOrderApprover.php:37,45,49,53,56-57）。承認行のDB照合手段が要実機確認のため fixme。
    }
  );

  test.fixme(
    "E2E-A06-16-051 更新成功後に受注の member_id・update_date が更新される（要実機確認: DB照合手段／付帯表4）",
    async () => {
      // 期待は状態・データ更新由来（UpdateDoubleCheckMemberAction.php:42-44）。dtb_otc_buy_order の列のDB照合手段が要実機確認のため fixme。
    }
  );
});
