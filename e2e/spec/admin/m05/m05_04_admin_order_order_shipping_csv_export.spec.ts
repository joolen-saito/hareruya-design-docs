/**
 * 管理画面 受注管理「配送CSV出力（出荷CSVダウンロード）」E2E（M05-04）。
 * 納品ケース表 integration_test/e2e/m05_04_admin_order_order_shipping_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装する。手動（CSV本文＝列・順序・disp_name・型変換・文字コード・BOM・区切り・
 * 対象データ一致・検索条件反映・受注明細単位の行数・同一配送複数明細）・間接（参照のみ＝業務データ非更新）・
 * 対象外（入力フォーム非保持のバリデーション群・ログ抑止/識別子・CSRF＝GETのため非該当・出力中例外・確認ダイアログ）は
 * ケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m05-04_admin_order_order_shipping_csv_export.md / 観点表)由来
 * （オラクル独立性）。実装の現挙動・CSV列構成・ファイル名prefixは期待値に流用しない。
 * 刷新先 ec-cube-enterprise に当該機能が存在することを確認済み（screenExists=true）:
 *   route admin_order_export_shipping = GET /<route>/order/export/shipping（OrderController.php:387）/
 *   起点リンク a#shippingCsvDownload「出荷CSVダウンロード」index.twig:1144（受注一覧 admin_order の CSVダウンロードドロップダウン内）。
 * 設計(pf-eccube3 HareruyaEc)と刷新先で同名ルート・同一リンクIDであり入口は一致。列名差異（enable_flg→enabled /
 * rank→sort_no / csv_type→csv_type_id）は設計の「リニューアル移行時の扱い」で調整済み（正本md:19-28）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(020/021)は資格情報不要。CSV本文検査・検索条件反映・参照のみ非更新・0列エラー・0件ヘッダのみは
 * シード/DB依存のためケース表(付帯表3/4)で管理する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OrderOrderShippingCsvExportPage } from "../../../pages/admin/m05/m05_04_admin_order_order_shipping_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const ORDER_LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/order(\\?|/|$)`);
const LOGIN_RE = /\/login(\?|$)/;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 受注管理 > 配送CSV出力（出荷CSVダウンロード）",
  { tag: ["@admin", "@order", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M05-04-020 未ログインで受注一覧URL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new OrderOrderShippingCsvExportPage(page);
      await p.gotoList();
      await expect(page).toHaveURL(LOGIN_RE); // 未ログイン管理者はアクセス不可（権限・認可）
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M05-04-021 未ログインで配送CSV出力URLへ直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new OrderOrderShippingCsvExportPage(page);
      await p.gotoExport();
      await expect(page).toHaveURL(LOGIN_RE); // GETルートだが未認証は出力されずログインへ誘導
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M05-04-001 受注一覧画面（CSV出力の起点）が表示される", async ({ page }) => {
        await login(page);
        const p = new OrderOrderShippingCsvExportPage(page);
        await p.gotoList();
        await expect(page).toHaveURL(ORDER_LIST_RE);
        await p.seeListScreen(); // CSVダウンロードドロップダウンが描画される
        await expect(page.locator("body")).toContainText("受注一覧"); // 仕様: 受注一覧が起点（trans admin.order.order_list）
      });

      test("E2E-M05-04-002 「CSVダウンロード」内に「出荷CSVダウンロード」リンク(id=shippingCsvDownload)が表示される", async ({ page }) => {
        await login(page);
        const p = new OrderOrderShippingCsvExportPage(page);
        await p.gotoList();
        await p.openCsvDropdown();
        await expect(p.shippingCsvLink).toBeVisible();
        await expect(p.shippingCsvLink).toContainText("出荷CSVダウンロード"); // trans admin.order.shipping_csv.download
      });

      test("E2E-M05-04-010 「出荷CSVダウンロード」押下でCSVのダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new OrderOrderShippingCsvExportPage(page);
        await p.gotoList();
        const download = await p.downloadViaShippingLink();
        expect(download).toBeTruthy(); // 単純GETリンク押下でCSVダウンロードが発火（成功時出力＝CSVファイル）
      });

      test("E2E-M05-04-011 配送CSVが添付ファイル（.csvファイル）として発火する", async ({ page }) => {
        await login(page);
        const p = new OrderOrderShippingCsvExportPage(page);
        await p.gotoList();
        // 仕様: 成功時出力＝application/octet-stream の添付ダウンロード（ファイル名 shipping_*.csv）。
        // ※Content-Type値・Content-Disposition値は実装由来のため期待値に固定しない（オラクル独立性）。
        //   download イベント発火自体が添付応答であることを示し、suggestedFilename の .csv 拡張子で「CSVファイル」を判定する。
        const download = await p.downloadViaShippingLink();
        expect(download.suggestedFilename()).toMatch(/\.csv$/i);
      });

      test("E2E-M05-04-012 CSV出力は画面遷移せず受注一覧に滞留しダウンロードのみ行われる", async ({ page }) => {
        await login(page);
        const p = new OrderOrderShippingCsvExportPage(page);
        await p.gotoList();
        const urlBefore = page.url();
        const download = await p.downloadViaShippingLink();
        expect(download).toBeTruthy();
        await expect(page).toHaveURL(ORDER_LIST_RE); // ダウンロード後も受注一覧に滞留（画面遷移なし＝ストリーム応答）
        expect(page.url()).toBe(urlBefore);
      });

      test("E2E-M05-04-013 配送CSV出力URLへの直接GET（ブックマーク/アドレスバー）でCSVが発火する", async ({ page }) => {
        await login(page);
        const p = new OrderOrderShippingCsvExportPage(page);
        await p.gotoList(); // 受注一覧を開きセッションを確立（初期表示直後の検索状態は既定＝空）
        const download = await p.downloadViaDirectUrl();
        // 仕様: 出力URLへの直接GET（ボディを用いない）でCSVが発火する＝URL直接アクセス可（IT-13）。
        // ※非空の検索条件を確立した上でその条件が直接GET出力へ反映される確認は要シードのため 091（手動/間接）で実施（ケース表 013 注記）。
        expect(download).toBeTruthy();
      });

      test("E2E-M05-04-014 ダウンロードCSVのファイル名が shipping_<出力時刻>.csv である", async ({ page }) => {
        await login(page);
        const p = new OrderOrderShippingCsvExportPage(page);
        await p.gotoList();
        // 仕様: ファイル名は「shipping_」+「YmdHis」+「.csv」（正本md:68,127）。
        const download = await p.downloadViaShippingLink();
        expect(download.suggestedFilename()).toMatch(/^shipping_\d{14}\.csv$/);
      });

      test("E2E-M05-04-015 出力URLにクエリパラメータを付与してもCSVが発火する（クエリ絞り込みは受け付けない）", async ({ page }) => {
        await login(page);
        const p = new OrderOrderShippingCsvExportPage(page);
        await p.gotoList(); // 受注一覧を開きセッション検索状態を確立（既定＝空）
        // 仕様: 入力はGETボディもクエリによる絞り込み指示も受け付けず、抽出条件はセッションの受注検索条件のみ（正本md:126）。
        // クエリ付与の有無に関わらずダウンロードが発火する（クエリは無視される）。
        // ※クエリが無視されCSV内容がセッション条件のみを反映する点のCSV本文照合は091（手動）。
        const download = await p.downloadViaDirectUrlWithQuery("?order_no=__ignored__");
        expect(download).toBeTruthy();
      });
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M05-04-030 有効な出力列が0件のときエラー応答となる（要: dtb_csv 配送種別の enabled を全件OFFにするDB操作）",
      async () => {
        // 期待は仕様(エッジケース／エラー処理: 有効列0件はヘッダ出力時点で論理例外＝応答はエラー系)由来。
        // 配送種別(csv_type_id=4)の dtb_csv.enabled を全件 false にするシード/DB操作の安定手順を実機確認後に実装する（付帯表4#3）。
      }
    );

    test.fixme(
      "E2E-M05-04-031 検索結果が0件のときヘッダ行のみのCSVが出力される（要: 0件ヒットの受注検索条件のシード/手順）",
      async () => {
        // 期待は仕様(エッジケース: 検索結果0件＝ヘッダのみのファイルを返す)由来。
        // 受注一覧で0件ヒットする検索条件を確立した上で出力し、ヘッダ行のみのCSVを確認する手順を実機確認後に実装する。
      }
    );
  }
);
