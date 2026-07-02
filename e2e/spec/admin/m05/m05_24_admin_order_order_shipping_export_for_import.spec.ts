/**
 * 管理画面 受注管理「出荷実績入力用CSV出力」E2E（M05-24）。
 * 納品ケース表 integration_test/e2e/m05_24_admin_order_order_shipping_export_for_import_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのうち資格情報のみで成立し かつ オラクルが安定なもの（001/030/031）を実行可能実装し、
 * STANDBY/NOSHIP シード依存のもの（002/003/010/011/012/020/040）は test.fixme で残す（自動化可能だが要シードで未実行）。
 * 021（出力URL直接GET）は直接GETのルート優先順位が環境依存（正本md:105・付帯表4#3）でオラクルを固定できないため
 * 同じく test.fixme（要確認）で残す。手動（CSV本文＝固定ヘッダ・列順・日時書式・郵便番号3桁/4桁分割・
 * 配送先FAX空文字3列・文字コード/BOM・区切り・対象IDのみ抽出・dtb_shipping脱落・同一受注複数配送の行重複）・
 * 対象外（フォーム入力種別チェック非保持のバリデーション群・ログ抑止/識別子・CSRF・確認ダイアログ・登録なし）は
 * ケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.md / 観点表)由来
 * （オラクル独立性）。実装の現挙動・CSV列構成・ファイル名prefixは期待値に流用しない。
 * 刷新先 ec-cube-enterprise に当該機能が存在することを確認済み（screenExists=true）:
 *   出荷指示編集 admin_shipping_standby_edit（ShippingStandbyController.php:152）の #orderExportForInput ボタン
 *   （edit.twig:126 / trans admin.order.shipping_export_for_import=「出荷実績入力用CSVダウンロード」messages.ja.yaml:3819）→
 *   JS submit（edit.twig:37-42）→ 出力ルート admin_order_export_for_input = GET/POST /<route>/order/export/order
 *   （OrderCsvController.php:191）→ StreamedResponse でCSV（OrderCsv.php:57）。
 *   order_ids 空/非配列のときは addError admin.common.select=「選択してください」（OrderCsvController.php:202）→ Referer/admin_order へ。
 * 設計(pf-eccube3)と刷新先で同名ルート・同一ボタンID・同一 POST submit 挙動であり入口は一致。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(030/031)は資格情報不要。ダウンロード発火・ボタン表示・選択欠損(編集画面)はSTANDBYシード依存のため fixme。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OrderOrderShippingExportForImportPage } from "../../../pages/admin/m05/m05_24_admin_order_order_shipping_export_for_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const STANDBY_LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/standby/search(\\?|$)`);
// admin_order 一覧URL（/<route>/order・末尾スラッシュ/クエリ可）に限定。
// 旧 `/order(\?|/|$)` は出力URL `/order/export/order` にも一致し、リダイレクト成立を検証できなかったため是正。
const ORDER_LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/order/?(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;
// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const SELECT_FLASH = "選択してください"; // :1530 admin.common.select（order_ids空時のフラッシュ）

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 受注管理 > 出荷実績入力用CSV出力",
  { tag: ["@admin", "@order", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M05-24-030 未ログインで出荷指示一覧URL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new OrderOrderShippingExportForImportPage(page);
      await p.gotoStandbyList();
      await expect(page).toHaveURL(LOGIN_RE); // 未ログイン管理者はアクセス不可（権限・認可）
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M05-24-031 未ログインで出力URLへ直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new OrderOrderShippingExportForImportPage(page);
      await p.gotoExportDirect();
      await expect(page).toHaveURL(LOGIN_RE); // GET/POSTルートだが未認証はCSV出力されずログインへ誘導
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 認証必須・資格情報のみで成立 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M05-24-001 出荷指示一覧画面（CSV出力の起点導線）が表示される", async ({ page }) => {
        await login(page);
        const p = new OrderOrderShippingExportForImportPage(page);
        await p.gotoStandbyList();
        await expect(page).toHaveURL(STANDBY_LIST_RE);
        // 仕様: 出荷指示一覧が出力導線の起点（サブタイトル trans admin.order.shipping_standby_export）。
        await expect(page.locator("body")).toContainText("出荷指示リストエクスポート");
      });

      // E2E-M05-24-021 は直接GETのルート解決が環境依存（要確認・付帯表4#3）のため fixme で保留する。
      // 仕様(判定順序/エラー処理 正本md:60)は order_ids 非配列/空→admin.common.select フラッシュ＋
      // Referer無し→受注一覧(admin_order)へリダイレクトだが、正本md:105 は「GETで /order/export/order に入ると
      // 受注dtb_csv系（GETのみ）ルートが優先される確認環境がある」と明記しており、直接GET時の遷移先・出力は
      // 環境依存になりうる。安定オラクルにできないため、本ルート起動が確実なPOST submit経由（020）を正系とし、
      // 直接GETの期待は実機でルート優先順位を確認後に確定する（オラクル独立性）。
      test.fixme(
        "E2E-M05-24-021 出力URLへ order_ids 無しで直接GET→受注一覧へリダイレクトし選択フラッシュ（要確認: 直接GETのルート優先順位が環境依存・付帯表4#3）",
        async () => {
          // 実機でGETの解決先（admin_order_export_for_input か受注dtb_csv系か）を確認後、
          // 選択フラッシュ＋admin_orderリダイレクトを期待として実装する。ORDER_LIST_RE / SELECT_FLASH を流用。
        }
      );

      // 判定順序の分岐（正本md:60: `!is_array($rawOrderIds) || empty(...)`、Referer有無のリダイレクト先）を補うケース。
      // いずれも直接POSTのためCSRFトークン要否が環境依存（付帯表4#2）でオラクル固定不可＝fixmeで残す。
      test.fixme(
        "E2E-M05-24-022 order_ids を非配列（スカラ）で直接POST→選択フラッシュ＋リダイレクト（要確認: 直接POSTのCSRF要否・付帯表4#2）",
        async () => {
          // 期待は仕様(判定順序: order_ids 非配列→admin.common.select＋Referer/admin_order 正本md:60)由来。
          // 実機でCSRF要否を確認後、order_ids=スカラのPOSTで SELECT_FLASH 表示とリダイレクトを期待として実装する。
        }
      );

      test.fixme(
        "E2E-M05-24-023 order_ids無し・Referer無しで直接POST→受注一覧(admin_order)へリダイレクト＋選択フラッシュ（要確認: 直接POST/Referer制御・付帯表4#2）",
        async () => {
          // 期待は仕様(判定順序: Referer空→admin_order 正本md:60,176)由来。ORDER_LIST_RE / SELECT_FLASH を流用。
          // Referer無しPOSTはテストクライアントのヘッダ制御が必要。CSRF要否確認後に実装する。
        }
      );

      test.fixme(
        "E2E-M05-24-024 GETで出力URLへ直接アクセス→受注dtb_csv系ルートが優先されうる（要実機: 環境依存・付帯表4#3）",
        async () => {
          // 設計(正本md:105)はGET時に本ルートでなく受注dtb_csv系（GETのみ）ルートが優先される確認環境があると明記。
          // 遷移先・出力種別が環境依存でオラクル固定不可。実機でルート解決を確認後に期待を確定する。
          // 本ルート起動が確実なPOST submit経由（010）を正系とする。
        }
      );
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M05-24-002 出荷指示編集画面に出力ボタン(id=orderExportForInput)が表示される（要: SEED-M05-24-STANDBY の編集画面id）",
      async () => {
        // 期待は仕様(フロント挙動: #orderExportForInput 表示 edit.twig:126)由来。
        // 出荷指示編集を開ける標準的なstandby idのシード/取得手順を実機確認後に実装する（付帯表3）。
      }
    );

    test.fixme(
      "E2E-M05-24-003 出荷指示編集画面の一覧各行チェックボックスが既定でオンである（要: SEED-M05-24-STANDBY）",
      async () => {
        // 期待は仕様(フロント挙動: order_ids チェックは既定でオン edit.twig:157)由来。
      }
    );

    test.fixme(
      "E2E-M05-24-010 チェック付きで出力ボタン押下→CSVダウンロード発火（要: SEED-M05-24-STANDBY）",
      async () => {
        // 期待は仕様(処理フロー: 成功時 StreamedResponse でCSV返却 正本md:55-71)由来。
        // 出荷指示編集画面で clickExportAndWaitDownload() の download 発火を確認する。
      }
    );

    test.fixme(
      "E2E-M05-24-011 出力後も出荷指示編集画面に滞留しダウンロードのみ行われる（要: SEED-M05-24-STANDBY）",
      async () => {
        // 期待は仕様(画面遷移: 成功時は別ストリーム応答で編集画面のまま 正本md:175)由来。
      }
    );

    test.fixme(
      "E2E-M05-24-012 ダウンロードCSVのファイル名が order_<YmdHis>.csv である（要: SEED-M05-24-STANDBY）",
      async () => {
        // 期待は仕様(業務ルール: ファイル名 order_+YmdHis+.csv 正本md:68)由来。
        // download.suggestedFilename() を /^order_\d{14}\.csv$/ で照合する。Content-Disposition値は固定しない。
      }
    );

    test.fixme(
      "E2E-M05-24-020 編集画面で全チェック解除→出力ボタン押下で選択フラッシュ表示＋編集画面に滞留（要: SEED-M05-24-STANDBY）",
      async () => {
        // 期待は仕様(エラー処理: order_ids空→admin.common.select＋Refererへリダイレクト 正本md:60,103)由来。
        // uncheckAll() 後 clickExport() で「選択してください」表示と編集画面(Referer)滞留を確認する。
      }
    );

    test.fixme(
      "E2E-M05-24-040 取得結果が論理偽の受注のみ選択時はメッセージ付きフラッシュとリダイレクト（要: SEED-M05-24-NOSHIP・要DB状態）",
      async () => {
        // 期待は仕様(エラー処理: exportCsv論理偽→RuntimeException→フラッシュ＋リダイレクト 正本md:62-63)由来。
        // 標準文言はキー転用(messages.ja.yaml:2244「存在しないカードIDが含まれています。」)＝不具合候補#1。
        // テストは「ダウンロード非発火＋エラーフラッシュ＋リダイレクト」を期待し、文言の正否は要確認。
      }
    );
  }
);
