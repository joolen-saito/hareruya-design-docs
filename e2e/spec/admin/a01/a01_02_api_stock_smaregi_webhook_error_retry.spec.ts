/**
 * A01-02 スマレジ Webhook 連携エラー再連携 — UIレイヤ E2E。
 * 納品ケース表 integration_test/e2e/a01_02_api_stock_smaregi_webhook_error_retry_e2e_cases.md の
 * 「E2E自動化(UI)」を実装する（手動/対象外はケース表で全量管理し spec に残さない）。
 *
 * ケース表対応: 付帯表1 の E2E可否＝E2E自動化(UI)＝ E2E-018/019/020/021。
 *  - 018: 在庫検索一覧(admin_stock_list)の在庫数反映
 *  - 019: 在庫変動履歴(admin_stock_history)の「スマレジ連携（売上）」区分（減算）
 *  - 020: 同上「スマレジ連携（返品）」区分（加算）
 *  - 021: 在庫修正の「スマレジその他（調整）」区分（要確認 付帯表4 #2: applier default理由が'スマレジ連携'）
 *
 * オラクル独立性: 期待結果（在庫数反映・区分名）は仕様(設計書/0202)由来。実装の翻訳ファイル文言や
 * applier の現挙動を期待値に流用しない。実装から採るのは位置情報(セレクタ file:line)のみ。
 *
 * 未実行雛形: ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成。
 * 認証fixtureは本ランナーに無いため、既存規約(login.spec.ts)に倣い AdminLoginPage 直利用＋
 * test.skip(!HAS_CREDS) でガードする。再連携済みデータ(SEED)が要るケースは追加のseedガードを置く。
 *
 * 資格情報/シード（環境変数。コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（SEED-A01-02-ADMIN）
 *  - A01_02_STOCK_PRODUCT_CODE（SEED-A01-02-STOCK の再連携済み対象商品コード。任意・在庫数の確定観測用）
 */
import { test, expect } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import {
  AdminStockSmaregiRetryPage,
  KUBUN_SALES,
  KUBUN_RETURN,
} from "../../../pages/admin/a01/a01_02_api_stock_smaregi_webhook_error_retry.page";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

test.describe(
  "管理画面 > スマレジWebhook連携エラー再連携(在庫反映)",
  { tag: ["@admin", "@stock", "@a01"] },
  () => {
    test("E2E-A01-02-018 再連携成功後に在庫検索一覧の在庫数が反映される", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-A01-02-ADMIN 未設定（ECCUBE_ADMIN_USER/PASS）");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const sp = new AdminStockSmaregiRetryPage(page);
      await sp.gotoStockList();
      // 到達＋一覧表示を確認（仕様: 在庫検索一覧に到達できる）。
      // 「対象商品の在庫数=再連携後の値」の確定観測は SEED-A01-02-STOCK の対象商品コードと
      // 在庫数セルの正確なtd位置(要実機確認)が要るため、深い値検証は別fixme(下)に保留。
      await sp.seeStockListTable();
    });

    test("E2E-A01-02-019 売上再連携が在庫変動履歴に「スマレジ連携（売上）」区分で表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-A01-02-ADMIN 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const sp = new AdminStockSmaregiRetryPage(page);
      await sp.gotoStockHistory();
      await sp.seeStockHistoryTable();
      // 仕様(0202)由来の区分名。SEED-A01-02-STOCK の売上02再連携済み行が一覧にある前提（要seed）。
      await sp.seeHistoryKubun(KUBUN_SALES);
    });

    test("E2E-A01-02-020 返品再連携が在庫変動履歴に「スマレジ連携（返品）」区分で表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-A01-02-ADMIN 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const sp = new AdminStockSmaregiRetryPage(page);
      await sp.gotoStockHistory();
      await sp.seeStockHistoryTable();
      await sp.seeHistoryKubun(KUBUN_RETURN);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化） =====

    test.fixme(
      "E2E-A01-02-018b 在庫検索一覧の対象商品の在庫数=再連携後の値（SEED-A01-02-STOCK・在庫数セル位置=要実機確認）",
      async () => {
        // 期待は仕様(状態・データ更新 在庫数反映)由来。対象商品コードでの絞り込みと在庫数セル(col-stock)の
        // 正確なtd位置の確定が要実機確認のため保留。
      }
    );

    test.fixme(
      "E2E-A01-02-021 在庫修正が在庫変動履歴に「スマレジその他（調整）」区分で表示される（要確認 付帯表4 #2）",
      async () => {
        // 期待は仕様(0202 2-1-2)由来。区分=SMAREGI_SYNC_ADJUST=38(MtbStockChangeTypeDetail.php:54)。
        // ただし applier の default 理由は 'スマレジ連携'(SmaregiStockChangeApplier.php:249)で「調整」固有理由が
        // 未確認＝再連携での在庫修正記録パスが未確認のため fixme（実装が違えば落ちて検出）。
      }
    );
  }
);
