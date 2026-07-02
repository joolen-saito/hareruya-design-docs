/**
 * a01-01 スマレジ連携処理（Webhook受信→在庫更新）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a01_01_api_stock_smaregi_stock_sync_e2e_cases.md に対応。
 * 本specには「E2E自動化(API/統合)」ケースのみ実装し、要実機確認/外部依存は test.fixme（理由付き）で残す。
 * 手動・対象外（060/061/062/070/072 等）はケース表で全量管理し本specには書かない（規約）。
 *
 * 期待結果は仕様（設計書 a01-01・観点表 IT-09/10/32/33・基本設計 0202/0501）由来（オラクル独立性）。
 *  - 設計レスポンス書式は「なし(ステータスコードのみ)」（付帯表4#3）。合否は HTTPステータス＋在庫副作用で判定し、
 *    実装が返すJSON本文（{status:...}）はオラクルにしない。
 *  - 送信先は実装の実効パス `POST /smaregi/webhook/`（付帯表4#1。設計書の `/smaregi/stocks` とは不一致＝不具合候補）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。
 *
 * 非同期設計の注意（WebhookController.php:102,107）: 受信は即時に成功応答(2xx)を返し、在庫更新は非同期ワーカーで実行される。
 * そのため「在庫副作用（在庫数変動/不変・二重更新なし・ロールバック・受信履歴ステータス）」を真のオラクルとするケースは
 * 受信レイヤのHTTPステータスでは判定できず、DB/ワーカー観測が要る分は test.fixme（要実機確認）とする。
 *
 * 環境ガード（SEED/IP許可・認証資格情報が無い環境では実行しない）:
 *  - SMAREGI_WEBHOOK_ALLOWED : SEED-A01-01-IP-ALLOW（受信検証通過の資格情報/許可元）が用意済みのとき true。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  SMAREGI_WEBHOOK_PATH,
  buildStockWebhookPayload,
  buildMissingFieldPayload,
  buildInvalidValuePayload,
  buildSmaregiHeaders,
  MALFORMED_JSON_BODY,
} from "../../../pages/api/a01/a01_01_api_stock_smaregi_stock_sync.api";

const HAS_API = !!process.env.SMAREGI_WEBHOOK_ALLOWED;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

// 仕様由来のステータス意味（実装の具体値を期待値に固定しない＝範囲で判定）。
function expect2xx(status: number) {
  expect(status, "正常受信＝2xx系（設計: 成功応答）").toBeGreaterThanOrEqual(200);
  expect(status, "正常受信＝2xx系").toBeLessThan(300);
}
function expect4xx(status: number) {
  expect(status, "入力不備/拒否＝4xx系").toBeGreaterThanOrEqual(400);
  expect(status, "入力不備/拒否＝4xx系").toBeLessThan(500);
}
function expectErrorStatus(status: number) {
  expect(status, "異常＝4xx/5xx（エラー応答）").toBeGreaterThanOrEqual(400);
  expect(status, "異常＝4xx/5xx").toBeLessThan(600);
}

test.describe("API > スマレジ連携処理(Webhook受信→在庫更新)", { tag: ["@api", "@smaregi"] }, () => {
  // ===== IT-09 正常受信（HTTPステータス＝2xx） =====

  test("E2E-A01-01-001 売上(02)正常受信で正常応答(2xx)が返る", async () => {
    test.skip(!HAS_API, "SMAREGI_WEBHOOK_ALLOWED(SEED-A01-01-IP-ALLOW) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
      headers: buildSmaregiHeaders(),
      data: buildStockWebhookPayload({ transactionType: "02" }),
    });
    expect2xx(res.status()); // 設計: 正常受信＝成功ステータス（IT-09）
    await ctx.dispose();
  });

  test("E2E-A01-01-002 返品(12)正常受信で正常応答(2xx)が返る", async () => {
    test.skip(!HAS_API, "SMAREGI_WEBHOOK_ALLOWED 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
      headers: buildSmaregiHeaders(),
      data: buildStockWebhookPayload({ transactionType: "12" }),
    });
    expect2xx(res.status());
    await ctx.dispose();
  });

  test("E2E-A01-01-003 正常受信で受信応答が成功(2xx)（受信履歴記録の入口）", async () => {
    test.skip(!HAS_API, "SMAREGI_WEBHOOK_ALLOWED 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
      headers: buildSmaregiHeaders(),
      data: buildStockWebhookPayload({ transactionType: "02" }),
    });
    expect2xx(res.status());
    // 受信履歴(dtb_smaregi_webhook_request)への1件記録は DB 観測（SmaregiWebhookEvent.php:22）＝HTTPでは不可視。
    // 記録有無の確認は要実機確認（DBアサーション）。本レイヤは受信成功(2xx)までを判定する。
    await ctx.dispose();
  });

  test("E2E-A01-01-004 正常受信時のHTTPステータスが成功(2xx)と一致する", async () => {
    test.skip(!HAS_API, "SMAREGI_WEBHOOK_ALLOWED 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
      headers: buildSmaregiHeaders(),
      data: buildStockWebhookPayload({ transactionType: "02" }),
    });
    expect2xx(res.status()); // 設計レスポンス書式「ステータスコードのみ」（付帯表4#3）
    await ctx.dispose();
  });

  // ===== IT-32 受信検証・入力不備・想定外項目・データなし・レスポンス書式 =====

  test("E2E-A01-01-012 必須項目欠落のリクエストはエラー応答となる", async () => {
    test.skip(!HAS_API, "SMAREGI_WEBHOOK_ALLOWED 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
      headers: buildSmaregiHeaders(),
      data: buildMissingFieldPayload("contractId"), // 契約ID欠落
    });
    expectErrorStatus(res.status()); // 設計: 入力不備はエラー応答（在庫不変はUI/DBで別途・本レイヤはステータスで判定）
    await ctx.dispose();
  });

  test("E2E-A01-01-013 異常なパラメータ値のリクエストは4xxとなる", async () => {
    test.skip(!HAS_API, "SMAREGI_WEBHOOK_ALLOWED 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
      headers: buildSmaregiHeaders(),
      data: buildInvalidValuePayload(),
    });
    expect4xx(res.status()); // 設計: 型不正/範囲外は異常（4xx）
    await ctx.dispose();
  });

  test("E2E-A01-01-014 想定外項目を加えても5xxで停止せず正常系(2xx)で受理される", async () => {
    test.skip(!HAS_API, "SMAREGI_WEBHOOK_ALLOWED 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
      headers: buildSmaregiHeaders(),
      data: buildStockWebhookPayload({ transactionType: "02", extra: { unknownField: "x", foo: 1 } }),
    });
    expect2xx(res.status()); // 設計: 未知項目があっても5xxで停止しない（在庫反映量はUI 050で観測）
    await ctx.dispose();
  });

  test("E2E-A01-01-015 対象在庫変動履歴IDが空のリクエストは正常系(2xx)で更新なし", async () => {
    test.skip(!HAS_API, "SMAREGI_WEBHOOK_ALLOWED 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
      headers: buildSmaregiHeaders(),
      data: buildStockWebhookPayload({ transactionType: "02", ids: [] }),
    });
    expect2xx(res.status()); // 設計: 対象なしは正常系。在庫不変・履歴新規なしはUI/DBで別途観測
    await ctx.dispose();
  });

  test("E2E-A01-01-017 正常受信のレスポンス書式は仕様(ステータスコードのみ)で2xx", async () => {
    test.skip(!HAS_API, "SMAREGI_WEBHOOK_ALLOWED 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
      headers: buildSmaregiHeaders(),
      data: buildStockWebhookPayload({ transactionType: "02" }),
    });
    expect2xx(res.status()); // 合否はステータスのみ。応答本文({status:...})は内容を合否条件にしない（付帯表4#3）
    await ctx.dispose();
  });

  // ===== IT-10 異常系HTTPステータス・通信・形式不正 =====

  test("E2E-A01-01-020 エラー誘発リクエストで4xx/5xxが返る", async () => {
    test.skip(!HAS_API, "SMAREGI_WEBHOOK_ALLOWED 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
      headers: buildSmaregiHeaders(),
      data: buildInvalidValuePayload(),
    });
    expectErrorStatus(res.status()); // 在庫不整合が残らないことのDB確認は別途（要実機）
    await ctx.dispose();
  });

  test("E2E-A01-01-021 異常受信時のHTTPステータスが4xx/5xxと一致する", async () => {
    test.skip(!HAS_API, "SMAREGI_WEBHOOK_ALLOWED 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
      headers: buildSmaregiHeaders(),
      data: buildInvalidValuePayload(),
    });
    expectErrorStatus(res.status());
    await ctx.dispose();
  });

  test("E2E-A01-01-022 正常通信での受信応答が2xxとなる", async () => {
    test.skip(!HAS_API, "SMAREGI_WEBHOOK_ALLOWED 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
      headers: buildSmaregiHeaders(),
      data: buildStockWebhookPayload({ transactionType: "02" }),
    });
    expect2xx(res.status());
    await ctx.dispose();
  });

  test("E2E-A01-01-023 対象条件に該当する正常値受信(02/12)で2xx", async () => {
    test.skip(!HAS_API, "SMAREGI_WEBHOOK_ALLOWED 未設定");
    const ctx = await newCtx();
    for (const tt of ["02", "12"] as const) {
      const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
        headers: buildSmaregiHeaders(),
        data: buildStockWebhookPayload({ transactionType: tt }),
      });
      expect2xx(res.status());
    }
    await ctx.dispose();
  });

  test("E2E-A01-01-024 形式不正(JSON不正)は成功扱いされず拒否される", async () => {
    test.skip(!HAS_API, "SMAREGI_WEBHOOK_ALLOWED 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
      headers: buildSmaregiHeaders(),
      data: MALFORMED_JSON_BODY, // 不正JSON生文字列
    });
    expectErrorStatus(res.status()); // 設計: 形式不正は成功扱いしない（在庫/履歴不更新はDB/UIで別途）
    await ctx.dispose();
  });

  test("E2E-A01-01-025 異常系受信時のHTTPステータスが4xx/5xxとなる", async () => {
    test.skip(!HAS_API, "SMAREGI_WEBHOOK_ALLOWED 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
      headers: buildSmaregiHeaders(),
      data: buildInvalidValuePayload(),
    });
    expectErrorStatus(res.status());
    await ctx.dispose();
  });

  test("E2E-A01-01-026 外部連携成功時の受信応答が正常系(2xx)", async () => {
    test.skip(!HAS_API, "SMAREGI_WEBHOOK_ALLOWED 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
      headers: buildSmaregiHeaders(),
      data: buildStockWebhookPayload({ transactionType: "02" }),
    });
    expect2xx(res.status());
    // 自他システムの状態が同一取引として整合する点（在庫・履歴）はDB/UI観測（要実機）。本レイヤは受信成功まで。
    await ctx.dispose();
  });

  // ===== IT-09/10 非同期投入（受信応答即時返却） =====

  test("E2E-A01-01-071 受信時点で正常系(2xx)応答が即時返る（非同期投入の入口）", async () => {
    test.skip(!HAS_API, "SMAREGI_WEBHOOK_ALLOWED 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
      headers: buildSmaregiHeaders(),
      data: buildStockWebhookPayload({ transactionType: "02" }),
    });
    expect2xx(res.status()); // 設計: 受信時点で即時応答（WebhookController.php:107）
    // 受信履歴ステータス(PENDING)・非同期投入完了の確認はDB/キュー観測（要実機）。
    await ctx.dispose();
  });

  // ===== IT-33 区分整合（02/12以外は処理されない） =====

  test("E2E-A01-01-040 02/12以外の在庫区分でも5xxで停止せず受理される（対象外は無視）", async () => {
    test.skip(!HAS_API, "SMAREGI_WEBHOOK_ALLOWED 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
      // 02/12以外は無視仕様（設計書1-2）。区分マッピングは要実機確認（付帯表4#5）。
      data: { contractId: "TEST", event: "pos:transactions", action: "edited", ids: [], transactionType: "01" },
      headers: buildSmaregiHeaders(),
    });
    expect2xx(res.status()); // 受理して無視。更新対象外の数量・金額不変はUI 055で観測
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝ケース表 付帯表4） =====

  test.fixme(
    "E2E-A01-01-010 受信検証失敗で在庫が更新されない（要実機確認: 受信検証の照合方式／付帯表4#2＋在庫副作用はDB観測）",
    async () => {
      // 期待は設計(受信検証=資格情報照合の通過/拒否)由来。AuthenticationService.verify(WebhookController.php:52) の
      // 実照合方式（IP/署名/ヘッダ）が要実機確認のため、失敗状態の安定再現と在庫不変のDB確認を実機確認後に実装。
    }
  );

  test.fixme(
    "E2E-A01-01-011 資格情報が不正なリクエストは拒否応答(認可不可)となる（要実機確認: 認証方式細部／付帯表4#2）",
    async () => {
      // 期待は設計(資格情報不正→拒否)由来。実照合方式が要実機確認のため fixme。
    }
  );

  test.fixme(
    "E2E-A01-01-028 売上(02)同一イベント重複受信で在庫が二重更新されない（要実機確認: 冪等判定キー／付帯表4#7＋在庫副作用はDB観測）",
    async () => {
      // 期待は設計(重複受信で1回分のみ反映)由来。実装は HTTPヘッダ smaregi-event-id で重複判定するが
      // 設計の受信項目に冪等キーの記載が無く要実機確認。在庫の二重更新なしはDB/UIで観測する。
    }
  );

  test.fixme(
    "E2E-A01-01-029 売上(02)順序入替受信でも最終在庫が整合する（要実機確認: 冪等/順序＋在庫副作用はDB観測）",
    async () => {
      // 期待は設計(受信順序によらず時系列適用の最終在庫)由来。最終在庫の観測がDB/UI依存のため fixme。
    }
  );

  test.fixme(
    "E2E-A01-01-031 返品(12)同一イベント重複受信で在庫が二重更新されない（要実機確認: 冪等判定キー／付帯表4#7）",
    async () => {
      // 期待は設計(返品1回分の加算のみ)由来。冪等キーが要実機確認・在庫副作用はDB観測のため fixme。
    }
  );

  test.fixme(
    "E2E-A01-01-032 返品(12)順序入替受信でも最終在庫が整合する（要実機確認: 冪等/順序＋在庫副作用はDB観測）",
    async () => {
      // 期待は設計(時系列適用の最終在庫)由来。最終在庫の観測がDB/UI依存のため fixme。
    }
  );

  test.fixme(
    "E2E-A01-01-027 売上(02)自システム更新失敗時に二重更新/状態不整合を起こさない（要実機確認: 非同期ワーカー失敗誘発＋在庫副作用はDB観測）",
    async () => {
      // 期待は設計(例外処理・二重計上なし/履歴1件以内)由来。受信は2xx即時応答で、更新は非同期ワーカー(WebhookController.php:102)。
      // 自システム更新失敗の誘発と在庫/履歴のDB観測が実機依存のため fixme。
    }
  );

  test.fixme(
    "E2E-A01-01-030 売上(02)配列内一部失敗でロールバックし片側更新が残らない（要実機確認: 部分失敗誘発＋在庫副作用はDB観測）",
    async () => {
      // 期待は設計(共通処理1-3-1 ロールバック・在庫/履歴受信前一致)由来。非同期処理結果のDB観測が実機依存のため fixme。
    }
  );

  test.fixme(
    "E2E-A01-01-033 返品(12)配列内一部失敗でロールバックし整合する（要実機確認: 部分失敗誘発＋在庫副作用はDB観測）",
    async () => {
      // 期待は設計(共通処理1-3-1)由来。非同期処理結果のDB観測が実機依存のため fixme。
    }
  );

  test.fixme(
    "E2E-A01-01-034 返品(12)自システム更新失敗時に二重更新/状態不整合を起こさない（要実機確認: ワーカー失敗誘発＋在庫副作用はDB観測）",
    async () => {
      // 期待は設計(二重計上なし/履歴1件以内)由来。失敗誘発とDB観測が実機依存のため fixme。
    }
  );

  test.fixme(
    "E2E-A01-01-041 数量更新失敗/検証エラー/連携エラー時に数量・金額・履歴が部分更新されない（要実機確認: 失敗誘発＋副作用はDB観測）",
    async () => {
      // 期待は設計(部分更新なし・連携元/先双方整合)由来。非同期/連携失敗の誘発とDB観測が実機依存のため fixme。
    }
  );

  test.fixme(
    "E2E-A01-01-042 外部連携エラー時に片側だけ更新された状態にならない（要実機確認: 外部連携失敗誘発／付帯表4＋副作用はDB観測）",
    async () => {
      // 期待は設計(連携元/先/数量/金額/履歴いずれも片側更新なし)由来。外部障害誘発が実機依存のため fixme。
    }
  );
});
