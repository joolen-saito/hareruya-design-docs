/**
 * a06-05 店頭仕入_買取注文ステータス（買取アプリ＝MTGバイヤーが店頭買取受注のステータスをPUT更新するJSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a06_05_api_store_purchase_otc_buy_order_status_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装し、要実機確認修飾(010/011/012＝JWT発行・会員紐づけ)は test.fixme（理由付き）で残す。
 * 手動（035 想定外項目・050 保存例外500・051 タイムアウト）はケース表で全量管理し本specには書かない（規約）。本機能は画面なしAPIのためUI専用specは無い（管理画面UI確認は母集合外の補助観測＝要実機）。
 *
 * 期待結果は仕様（正本md a06-05・観点表・基本設計）由来（オラクル独立性）。
 *  - 送信先は実装の実効パス `PUT /api/v1/admin/otcBuyOrder/{id}/status.json`（付帯表4#1。正本md `/admin/otcBuyOrder/{id}/status.json` には接頭辞 `/api/v1` が無い／拡張子なし別名は付帯表4#2で要確認）。
 *  - 合否は HTTPステータス＋応答本文（成功 {code:200}・失敗 {code,errors}）＋副作用（dtb_otc_buy_order・dtb_otc_buy_order_status_history のDB観測）で判定。
 *  - 実装のエラーメッセージ文言・ステータスマスタ値定義（5/8の意味づけ・査定終了集合）はオラクルに固定しない。正本md文言・値定義で照合し実装差は付帯表4#3/#4/#5で検出。
 *  - status UPDATE系（040-048,044-046）はDB副作用が一次オラクル。本specではHTTPステータスを実行時検証し、永続化先テーブルの観測はDB照査で補完（コメントに明記）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A06_05_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildStatusPath,
  buildJwtHeaders,
  buildStatusPayload,
  buildEmptyStatusPayload,
  STATUS,
  ORDER_ID,
  JWT_TOKEN,
  SPEC_MESSAGE,
} from "../../../pages/api/a06/a06_05_api_store_purchase_otc_buy_order_status.api";

const HAS_API = !!process.env.A06_05_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常更新＝200（正本md: 成功応答）").toBe(200);
}
function expect400(status: number) {
  expect(status, "入力不正＝400（正本md: バリデーション/占有/査定終了の拒否）").toBe(400);
}
function expect404(status: number) {
  expect(status, "該当なし＝404（正本md: 受注取得失敗）").toBe(404);
}

test.describe("API > 店頭仕入_買取注文ステータス(PUT更新)", { tag: ["@api", "@a06"] }, () => {
  // ===== 正常更新（HTTP/本文契約） =====

  test("E2E-A06-05-001 未終了受注のステータス更新が正常応答となる", async () => {
    test.skip(!HAS_API, "A06_05_READY(SEED-A06-05-JWT-MEMBER/ORDER-INTERMEDIATE/STATUS-MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_A),
      data: buildStatusPayload(STATUS.IN_ASSESSMENT), // 商品到着5 → 査定中6
    });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-05-002 成功レスポンス本文が仕様の型契約と一致する", async () => {
    test.skip(!HAS_API, "A06_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_A),
      data: buildStatusPayload(STATUS.IN_ASSESSMENT),
    });
    expect200(res.status());
    const body = (await res.json()) as { code?: unknown };
    // 正本md: 成功本文は {code:200}（code は integer型・値200）。
    expect(typeof body.code, "code は integer 型").toBe("number");
    expect(body.code, "code の値は 200").toBe(200);
    await ctx.dispose();
  });

  test("E2E-A06-05-003 正常通信で成功ステータスが返る", async () => {
    test.skip(!HAS_API, "A06_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_A),
      data: buildStatusPayload(STATUS.IN_ASSESSMENT),
    });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-05-004 対象条件に該当する正常値で正常更新される", async () => {
    test.skip(!HAS_API, "A06_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_A),
      data: buildStatusPayload(STATUS.IN_ASSESSMENT), // マスタに存在する正常な status 値（例 6:査定中）
    });
    expect200(res.status());
    await ctx.dispose();
  });

  // ===== 占有判定（処理フロー#6） =====

  test("E2E-A06-05-013 他担当者が査定中の受注を査定中・査定再開へ更新すると入力不正となる", async () => {
    test.skip(!HAS_API, "A06_05_READY(SEED-A06-05-JWT-OTHER/ORDER-INPROGRESS-A) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INPROGRESS_A), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_B), // 査定担当者=会員A の受注を会員Bが更新
      data: buildStatusPayload(STATUS.RESUMED), // 査定中6 → 査定再開9
    });
    expect400(res.status()); // 占有拒否（$Member !== $OtcBuyOrder->getMember()／UpdateStatusAction.php:99-101）
    await ctx.dispose();
  });

  test("E2E-A06-05-014 占有拒否時のエラーメッセージが査定担当者名を含む仕様文言となる", async () => {
    test.skip(!HAS_API, "A06_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INPROGRESS_A), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_B),
      data: buildStatusPayload(STATUS.RESUMED),
    });
    expect400(res.status());
    const body = (await res.json()) as { errors?: unknown };
    // 正本md文言「この受注は「（査定担当者名）」が査定中です。」をオラクルとする。
    // 担当者名は動的のため安定部分で照合。実装は鉤括弧・末尾句点を欠く（付帯表4#4：実装が違えば落ちて検出）。
    expect(JSON.stringify(body.errors ?? ""), "errors に占有メッセージ（査定担当者名を含む仕様文言）").toContain(
      SPEC_MESSAGE.OCCUPANCY_STABLE
    );
    await ctx.dispose();
  });

  test("E2E-A06-05-015 査定担当者本人は査定中の受注を査定再開へ更新できる", async () => {
    test.skip(!HAS_API, "A06_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INPROGRESS_A), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_A), // 担当者本人（会員A）
      data: buildStatusPayload(STATUS.RESUMED), // 査定中6 → 査定再開9
    });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-05-016 他担当者が査定中の受注を査定中へ更新しても占有拒否となる", async () => {
    test.skip(!HAS_API, "A06_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INPROGRESS_A), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_B),
      data: buildStatusPayload(STATUS.IN_ASSESSMENT), // 更新前と同区分・同値（6→6）でも担当者違いは占有拒否
    });
    expect400(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-05-017 更新前が査定再開の受注を他担当者が更新すると占有拒否となる", async () => {
    test.skip(!HAS_API, "A06_05_READY(SEED-A06-05-ORDER-RESUMED-A) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.RESUMED_A), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_B),
      data: buildStatusPayload(STATUS.IN_ASSESSMENT), // 査定再開9 → 査定中6・担当者違い＝占有拒否
    });
    expect400(res.status());
    await ctx.dispose();
  });

  // ===== 査定終了判定（処理フロー#5） =====

  test("E2E-A06-05-020 査定終了の受注を査定中へ更新すると入力不正となる", async () => {
    test.skip(!HAS_API, "A06_05_READY(SEED-A06-05-ORDER-FINISHED) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.FINISHED), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_A),
      data: buildStatusPayload(STATUS.IN_ASSESSMENT), // 成立1（査定終了）→ 査定中6
    });
    expect400(res.status()); // 査定終了判定（UpdateStatusAction.php:79-85）
    await ctx.dispose();
  });

  test("E2E-A06-05-021 査定終了→査定中・査定再開のエラーメッセージが仕様文言となる", async () => {
    test.skip(!HAS_API, "A06_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.FINISHED), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_A),
      data: buildStatusPayload(STATUS.IN_ASSESSMENT),
    });
    expect400(res.status());
    const body = (await res.json()) as { errors?: unknown };
    // 正本md文言「この査定はすでに終了しているため開くことができません。」をオラクルとする。
    expect(JSON.stringify(body.errors ?? ""), "errors に査定終了→査定中・査定再開の仕様文言").toContain(
      SPEC_MESSAGE.FINISHED_OPEN
    );
    await ctx.dispose();
  });

  test("E2E-A06-05-022 査定終了→それ以外のステータスのエラーメッセージが仕様文言となる", async () => {
    test.skip(!HAS_API, "A06_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.FINISHED), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_A),
      data: buildStatusPayload(STATUS.CANCEL), // キャンセル2（査定中・査定再開以外）
    });
    expect400(res.status());
    const body = (await res.json()) as { errors?: unknown };
    // 正本md文言「この査定はすでに終了しているためステータスの更新に失敗しました。」をオラクルとする。
    expect(JSON.stringify(body.errors ?? ""), "errors に査定終了→それ以外の仕様文言").toContain(
      SPEC_MESSAGE.FINISHED_UPDATE_FAIL
    );
    await ctx.dispose();
  });

  // ===== 受注取得・必須・マスタ存在（処理フロー#2/#4・バリデーション） =====

  test("E2E-A06-05-030 存在しない受注IDは該当なしとなる", async () => {
    test.skip(!HAS_API, "A06_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.NONEXISTENT), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_A),
      data: buildStatusPayload(STATUS.IN_ASSESSMENT),
    });
    expect404(res.status()); // 受注取得404（OtcBuyOrderController.php:193-196）
    await ctx.dispose();
  });

  test("E2E-A06-05-031 status未指定は入力不正となる", async () => {
    test.skip(!HAS_API, "A06_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_A),
      data: buildEmptyStatusPayload(), // status ボディ値なし
    });
    expect400(res.status()); // status必須・形式判定400（OtcBuyOrderController.php:198-201）
    await ctx.dispose();
  });

  test("E2E-A06-05-032 マスタに存在しないステータスIDは入力不正となる", async () => {
    test.skip(!HAS_API, "A06_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_A),
      data: buildStatusPayload(STATUS.NOT_IN_MASTER), // 999＝マスタ非存在
    });
    expect400(res.status()); // マスタ存在判定400（OtcBuyOrderController.php:204-207）
    await ctx.dispose();
  });

  test("E2E-A06-05-033 マスタ非存在ステータスIDのエラーメッセージが仕様文言となる", async () => {
    test.skip(!HAS_API, "A06_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_A),
      data: buildStatusPayload(STATUS.NOT_IN_MASTER),
    });
    expect400(res.status());
    const body = (await res.json()) as { errors?: unknown };
    // 正本md文言「正しい店頭買取ステータスIDを入力してください」をオラクルとする。
    // 実装は別文言（付帯表4#3：'ステータスが見つかりません'）＝実装が違えば落ちて検出。
    expect(JSON.stringify(body.errors ?? ""), "errors にマスタ非存在の仕様文言").toContain(SPEC_MESSAGE.INVALID_MASTER);
    await ctx.dispose();
  });

  test("E2E-A06-05-034 非整数・空文字のstatusは入力不正となる", async () => {
    test.skip(!HAS_API, "A06_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_A),
      data: buildStatusPayload("abc"), // 非整数。空文字も同様に入力不正
    });
    expect400(res.status()); // status形式判定400（OtcBuyOrderController.php:198-201）
    await ctx.dispose();
  });

  test("E2E-A06-05-036 失敗時のレスポンス本文が仕様の型契約と一致する", async () => {
    test.skip(!HAS_API, "A06_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_A),
      data: buildStatusPayload(STATUS.NOT_IN_MASTER), // 999＝マスタ非存在で失敗
    });
    expect400(res.status());
    const body = (await res.json()) as { code?: unknown; errors?: unknown };
    // 正本md: 失敗本文は {code, errors}（errors に該当メッセージ）。
    expect(body, "失敗本文に code を含む").toHaveProperty("code");
    expect(body, "失敗本文に errors を含む").toHaveProperty("errors");
    await ctx.dispose();
  });

  // ===== 副作用（DB観測が一次オラクル・HTTPは本specで検証／DB照査で補完） =====

  test("E2E-A06-05-040 更新後ステータスが受注テーブルに反映される", async () => {
    test.skip(!HAS_API, "A06_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_A),
      data: buildStatusPayload(STATUS.IN_ASSESSMENT), // 商品到着5 → 査定中6
    });
    expect200(res.status());
    // 一次オラクル: dtb_otc_buy_order.otc_buy_order_status_id が査定中(6)へ更新（副作用）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-05-041 更新時に認証した管理者会員が査定担当者として記録される", async () => {
    test.skip(!HAS_API, "A06_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_A), // 会員A
      data: buildStatusPayload(STATUS.IN_ASSESSMENT),
    });
    expect200(res.status());
    // 一次オラクル: dtb_otc_buy_order.member_id が認証会員（会員A）として記録（副作用）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-05-042 更新時にステータス変更履歴が1件登録される", async () => {
    test.skip(!HAS_API, "A06_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_A),
      data: buildStatusPayload(STATUS.IN_ASSESSMENT), // 商品到着5 → 査定中6
    });
    expect200(res.status());
    // 一次オラクル: dtb_otc_buy_order_status_history に対象受注の履歴が1件追加（updateStatusWithHistory／UpdateStatusAction.php:112）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-05-043 登録された履歴の内容が更新内容と一致する", async () => {
    test.skip(!HAS_API, "A06_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_A), // 会員A
      data: buildStatusPayload(STATUS.IN_ASSESSMENT),
    });
    expect200(res.status());
    // 一次オラクル: 履歴行の otc_buy_order_status_id(6)・member_id(会員A)・create_date が更新内容と一致。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-05-044 ステータス更新で受注の他項目が変動しない", async () => {
    test.skip(!HAS_API, "A06_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_A),
      data: buildStatusPayload(STATUS.IN_ASSESSMENT),
    });
    expect200(res.status());
    // 一次オラクル: dtb_otc_buy_order の他項目（買取合計金額・成立日時・明細等）が更新前と不変（負確認）。更新前後の控え値とDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-05-045 査定終了拒否時に受注ステータスが更新されない", async () => {
    test.skip(!HAS_API, "A06_05_READY(SEED-A06-05-ORDER-FINISHED) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.FINISHED), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_A),
      data: buildStatusPayload(STATUS.IN_ASSESSMENT), // 成立1（査定終了）→ 査定中6 で400
    });
    expect400(res.status());
    // 一次オラクル: 拒否時 dtb_otc_buy_order.otc_buy_order_status_id が成立(1)のまま不変（負確認）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-05-046 更新が拒否された場合にステータス変更履歴が登録されない", async () => {
    test.skip(!HAS_API, "A06_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.FINISHED), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_A),
      data: buildStatusPayload(STATUS.IN_ASSESSMENT), // 査定終了拒否で400
    });
    expect400(res.status());
    // 一次オラクル: 拒否時 dtb_otc_buy_order_status_history に新規行が追加されない（負確認）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-05-047 更新前後が同じステータスでも正常応答となる", async () => {
    test.skip(!HAS_API, "A06_05_READY(SEED-A06-05-ORDER-INPROGRESS-A) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INPROGRESS_A), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_A), // 担当者本人（会員A）
      data: buildStatusPayload(STATUS.IN_ASSESSMENT), // 更新前=査定中6 と同一の 6
    });
    expect200(res.status()); // 同一ステータスでも200（データ整合性・処理フロー#7-8）
    await ctx.dispose();
  });

  test("E2E-A06-05-048 更新前後が同じステータスのときは履歴が登録されない", async () => {
    test.skip(!HAS_API, "A06_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INPROGRESS_A), {
      headers: buildJwtHeaders(JWT_TOKEN.MEMBER_A),
      data: buildStatusPayload(STATUS.IN_ASSESSMENT), // 更新前=査定中6 と同一
    });
    expect200(res.status());
    // 一次オラクル: 同一ステータスは更新も履歴登録もしない＝dtb_otc_buy_order_status_history に新規行が追加されない（負確認）。DB照査で補完。
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1：JWT発行・会員紐づけ） =====

  test.fixme(
    "E2E-A06-05-010 jwt-tokenヘッダ欠落は認証拒否となる（要実機確認: JWT発行・会員紐づけ／付帯表1）",
    async () => {
      // 期待は正本md（jwt-token・HS256・認証失敗401／firewall app・JwtTokenHeaderExtractor.php:29）由来。
      // jwt-tokenヘッダなしで PUT し 401 を期待するが、有効/無効トークンの発行・会員紐づけが実機依存のため fixme。
    }
  );

  test.fixme(
    "E2E-A06-05-011 署名不正のjwt-tokenは認証拒否となる（要実機確認: JWT発行・会員紐づけ／付帯表1）",
    async () => {
      // 期待は正本md（HS256署名照合・401）由来。署名不正トークンの生成・HS256シークレット(JWT_SECRET)が実機依存のため fixme。
    }
  );

  test.fixme(
    "E2E-A06-05-012 該当する管理者会員のないトークンは認証拒否となる（要実機確認: JWT発行・会員紐づけ／付帯表1）",
    async () => {
      // 期待は正本md（署名は正当だが対応する管理者会員が存在しない→401／処理フロー#1・外部取得）由来。
      // 会員に紐づかない正当署名トークンの発行が実機依存のため fixme。
    }
  );
});
