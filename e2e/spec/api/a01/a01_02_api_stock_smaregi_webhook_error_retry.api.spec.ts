/**
 * A01-02 スマレジ Webhook 連携エラー再連携 — API/統合レイヤ E2E。
 * 納品ケース表 integration_test/e2e/a01_02_api_stock_smaregi_webhook_error_retry_e2e_cases.md の
 * 「E2E自動化(API/統合)」を実装する（手動/対象外はケース表で全量管理し spec に残さない）。
 *
 * ケース表対応: 付帯表1 の E2E可否＝E2E自動化(API/統合) のうち、Webhook の同期HTTP契約
 * （署名/必須ヘッダ/重複の受理応答）で観測できるものを実テスト化。在庫状態の確定は
 * 非同期(Symfony Messenger)ワーカー＋DB/管理画面観測が必要なため、当該オラクルは test.fixme。
 *
 * オラクル独立性: 期待値（HTTPステータス・在庫状態）は設計書/観点表/0202 由来。実装の
 * レスポンス本文・文言（WebhookController の固定 JSON 'status'）はオラクルにしない＝ステータスのみ判定。
 *
 * 未実行雛形: ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成。
 * 実機(E2E_BASE_URL=staging)に対しては署名secret・Webhook許可が要るため test.skip でガードする。
 *
 * test.fixme の主項目（付帯表4）:
 *  - 在庫状態の確定（減算/不変/二重反映なし）は非同期ワーカー＋DB観測が必要＝要実機確認。
 *  - 再連携バッチ起動口（コマンド/Step Functions/トリガーAPI）は未実装（付帯表4 #1）。
 *  - スマレジ在庫修正（EC-CUBE正で上書き）パスは未確認（付帯表4 #2）。
 *  - 必須キー名・JSONスキーマ・余剰項目の許容可否は未定義（付帯表4 #4）。
 *  - 外部障害/タイムアウト/失敗注入/アラートメール実受信は外部・時刻依存＝手動相当。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  SMAREGI_WEBHOOK_PATH,
  HAS_WEBHOOK_ENV,
  buildEventId,
  buildWebhookHeaders,
  buildWebhookEnvelope,
  MALFORMED_JSON_BODY,
  DEFICIENT_BODY,
} from "../../../pages/api/a01/a01_02_api_stock_smaregi_webhook_error_retry.api";

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

test.describe(
  "API > スマレジWebhook連携エラー再連携(Webhook受信)",
  { tag: ["@api", "@smaregi", "@a01"] },
  () => {
    // ===== 受信の同期HTTP契約（実装可能・環境ガード付き） =====

    test("E2E-A01-02-001 売上(02)webhook受信で200受理される", async () => {
      test.skip(!HAS_WEBHOOK_ENV, "SEED-A01-02-WEBHOOK 未設定（SMAREGI_WEBHOOK_SECRET）");
      const ctx = await newCtx();
      const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
        headers: buildWebhookHeaders({ eventId: buildEventId("001"), validSignature: true }),
        data: buildWebhookEnvelope({ transactionType: "02" }),
      });
      expect(res.status()).toBe(200); // 仕様: 署名・必須ヘッダ充足で受理（成功扱い）
      await ctx.dispose();
    });

    test("E2E-A01-02-002 返品(12)webhook受信で200受理される", async () => {
      test.skip(!HAS_WEBHOOK_ENV, "SEED-A01-02-WEBHOOK 未設定");
      const ctx = await newCtx();
      const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
        headers: buildWebhookHeaders({ eventId: buildEventId("002"), validSignature: true }),
        data: buildWebhookEnvelope({ transactionType: "12" }),
      });
      expect(res.status()).toBe(200); // 仕様: 返品(12)も受信で受理
      await ctx.dispose();
    });

    test("E2E-A01-02-003 署名検証失敗で401となり受理されない", async () => {
      test.skip(!HAS_WEBHOOK_ENV, "SEED-A01-02-WEBHOOK 未設定");
      const ctx = await newCtx();
      const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
        headers: buildWebhookHeaders({ eventId: buildEventId("003"), validSignature: false }),
        data: buildWebhookEnvelope({ transactionType: "02" }),
      });
      expect(res.status()).toBe(401); // 仕様: 認証(署名)失敗で受理されない（付帯表4 #3: 方式の細部は固定しない）
      await ctx.dispose();
    });

    test("E2E-A01-02-004 Smaregi-Event-Idヘッダ欠落で400となる", async () => {
      test.skip(!HAS_WEBHOOK_ENV, "SEED-A01-02-WEBHOOK 未設定");
      const ctx = await newCtx();
      const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
        headers: buildWebhookHeaders({ eventId: null, validSignature: true }), // 必須ヘッダを付けない
        data: buildWebhookEnvelope({ transactionType: "02" }),
      });
      expect(res.status()).toBe(400); // 仕様: 受信検証（必須ヘッダ欠落）で受理されない
      await ctx.dispose();
    });

    test("E2E-A01-02-005 JSON構文不正の本文は成功扱いせずエラー応答となる", async () => {
      test.skip(!HAS_WEBHOOK_ENV, "SEED-A01-02-WEBHOOK 未設定");
      const ctx = await newCtx();
      const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
        headers: buildWebhookHeaders({ eventId: buildEventId("005"), validSignature: true }),
        data: MALFORMED_JSON_BODY, // 文字列をそのまま送る＝JSON構文不正
      });
      // 仕様: 成功扱いせずエラー応答（4xx/5xx）。具体コードは実装に固定しない＝範囲で判定。
      expect(res.status(), "JSON構文不正は2xxにならない").toBeGreaterThanOrEqual(400);
      await ctx.dispose();
    });

    test("E2E-A01-02-006 署名と必須ヘッダ充足で受理される", async () => {
      test.skip(!HAS_WEBHOOK_ENV, "SEED-A01-02-WEBHOOK 未設定");
      const ctx = await newCtx();
      const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
        headers: buildWebhookHeaders({ eventId: buildEventId("006"), validSignature: true }),
        data: buildWebhookEnvelope({ transactionType: "02" }),
      });
      expect(res.status()).toBe(200); // 仕様: 終了条件（署名+必須ヘッダ充足で受理）
      await ctx.dispose();
    });

    test("E2E-A01-02-007 連携済み重複イベントの再連携は再処理されず200で返る", async () => {
      test.skip(!HAS_WEBHOOK_ENV, "SEED-A01-02-WEBHOOK／SEED-A01-02-DUP 未設定");
      // 重複判定の同期応答（200）のみをオラクルとする。「在庫不変」は非同期＋DB観測が必要のため別途fixme(030相当)。
      const ctx = await newCtx();
      const dupId = buildEventId("007-DUP"); // SEED-A01-02-DUP で status=completed 既受信済みのID（要実機確認）
      const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
        headers: buildWebhookHeaders({ eventId: dupId, validSignature: true }),
        data: buildWebhookEnvelope({ transactionType: "02" }),
      });
      expect(res.status()).toBe(200); // 仕様(1-3-2 冪等性): 重複は受理応答(200)が返るが再処理されない
      await ctx.dispose();
    });

    // ===== 在庫状態の確定（非同期ワーカー＋DB/管理画面観測が必要＝要実機確認 fixme） =====

    test.fixme(
      "E2E-A01-02-008 同一在庫変動履歴IDの再連携で二重反映されない（冪等性・非同期＋在庫観測=要実機確認）",
      async () => {
        // 期待は仕様(1-3-2 冪等性)由来。existsBySmaregiStockChangeId 悲観ロック(Applier.php:128-134)で
        // 二重反映を抑止。在庫の二重変動なしの確定は非同期処理完了＋DB/管理画面観測が必要。
      }
    );

    test.fixme(
      "E2E-A01-02-009 売上(02)再連携で在庫がN減算され連携元・連携先が整合（非同期＋在庫観測=要実機確認）",
      async () => {
        // 期待は仕様(機能仕様2 売上減算・SmaregiStockChangeApplier.php:224)由来。在庫確定は非同期＋DB観測。
      }
    );

    test.fixme(
      "E2E-A01-02-010 02/12以外の区分は反映対象外で在庫・金額が不変（非同期＋在庫観測=要実機確認）",
      async () => {
        // 期待は仕様(入力データ詳細 区分02/12のみ・Applier.php:221-226 default→無視)由来。在庫確定は非同期＋DB観測。
      }
    );

    test.fixme(
      "E2E-A01-02-011 再連携失敗時に数量・履歴が片側だけ更新されない（失敗注入＝要実機確認）",
      async () => {
        // 期待は仕様(1-3-1 ロールバック)由来。SmaregiWebhookEventMessageHandler.php:83-91/STATUS_FAILED:117。
        // 処理途中の失敗注入が必要＝外部依存のため fixme。
      }
    );

    test.fixme(
      "E2E-A01-02-015 同一イベント同時実行を抑止し二重処理しない（悲観ロック・非同期＝要実機確認）",
      async () => {
        // 期待は仕様(同時実行制限)由来。SmaregiMessengerJobProcessingLock.php:39,46。
        // 二重処理なしの確定は非同期ワーカー＋在庫観測が必要。
      }
    );

    test.fixme(
      "E2E-A01-02-016 再連携起動で取得期間内の未連携(02/12)が連携済みになる（起動口未実装＝付帯表4 #1）",
      async () => {
        // 期待は仕様(機能仕様1-2 取得期間内抽出・再連携)由来。再連携専用バッチ起動口（コマンド/Step Functions/
        // トリガーAPI）は実装に存在せず（grep AsCommand 該当なし）。本リポジトリから叩けないため fixme。
      }
    );

    test.fixme(
      "E2E-A01-02-017 差異残存時にEC-CUBEを正としてスマレジ在庫を上書き修正（在庫修正パス未確認＝付帯表4 #2）",
      async () => {
        // 期待は仕様(0202 2-1-2)由来。区分「スマレジその他」=38 は定数(MtbStockChangeTypeDetail.php:54)だが、
        // 再連携でのEC-CUBE正・上書き修正パスは実装で未確認。
      }
    );

    test.fixme(
      "E2E-A01-02-023 店頭受取(OTC)データは再連携対象外で在庫が不変（非同期＋在庫観測=要実機確認）",
      async () => {
        // 期待は仕様(入力データ詳細「店頭受取のデータではない」)由来。Applier.php:107-118 で OTC は在庫反映せず無視。
        // 在庫不変の確定は非同期＋DB観測が必要。
      }
    );

    test.fixme(
      "E2E-A01-02-024 再連携バッチが対象0件でno-op・在庫不変（起動口未実装＝付帯表4 #1）",
      async () => {
        // 期待は仕様(機能仕様1 対象0件no-op)由来。再連携バッチ起動口が未実装のため fixme。
      }
    );

    test.fixme(
      "E2E-A01-02-025 再連携バッチ異常終了時に未完了ステータスで在庫が部分更新されない（起動口未実装＝付帯表4 #1）",
      async () => {
        // 期待は仕様(機能仕様1・例外処理)由来。STATUS_FAILED(Handler:117)。起動口未実装のため fixme。
      }
    );

    test.fixme(
      "E2E-A01-02-026 返品(12)の既反映履歴IDの再連携で二重加算されない（冪等性・非同期＋在庫観測=要実機確認）",
      async () => {
        // 期待は仕様(1-3-2 冪等性・返品12)由来。Applier.php:225/悲観ロック128-134。在庫確定は非同期＋DB観測。
      }
    );

    test.fixme(
      "E2E-A01-02-027 返品(12)再連携の部分失敗時にロールバックし在庫が加算されない（失敗注入＝要実機確認）",
      async () => {
        // 期待は仕様(1-3-1 ロールバック・返品12)由来。失敗注入が必要のため fixme。
      }
    );

    test.fixme(
      "E2E-A01-02-028 売上(02)再連携の部分失敗時にロールバックし在庫が減算されない（失敗注入＝要実機確認）",
      async () => {
        // 期待は仕様(1-3-1 ロールバック・売上02)由来。失敗注入が必要のため fixme。
      }
    );

    test.fixme(
      "E2E-A01-02-029 入力不備(必須項目欠落等)の本文は成功扱いせずエラー応答（必須キー未定義＝付帯表4 #4）",
      async () => {
        // 期待は仕様(例外処理 入力不備はエラー)由来。ただし必須キー名・JSONスキーマが未定義のため、
        // どの本文が「入力不備」になるかは要実機確認。DEFICIENT_BODY で最小再現。
      }
    );

    test.fixme(
      "E2E-A01-02-030 JSON構文不正の本文受信時に在庫が変動しない（非同期＋在庫観測=要実機確認）",
      async () => {
        // 期待は仕様(例外処理 登録・更新対象を確定しない)由来。在庫不変の確定はDB/管理画面観測が必要。
      }
    );

    test.fixme(
      "E2E-A01-02-031 入力不備の本文受信時に在庫が変動しない（必須キー未定義＋在庫観測＝要実機確認・付帯表4 #4）",
      async () => {
        // 期待は仕様(例外処理)由来。必須キー未定義＋在庫観測の二重に要実機確認。
      }
    );

    test.fixme(
      "E2E-A01-02-033 想定外の余剰項目を加えても必須情報充足なら2xx受理（余剰項目の許容可否未定義＝付帯表4 #4）",
      async () => {
        // 期待は仕様(受信検証)由来。余剰項目の拒否/許容ロジックは実装上未確認のため fixme。
        // buildWebhookEnvelope({extraFields:{...}}) で再現可能だが、許容可否のオラクルが未定義。
      }
    );
  }
);
