/**
 * 管理画面 受注管理 送り状CSV出力 E2E。
 * 納品ケース表 integration_test/e2e/m05_07_admin_order_order_labels_csv_export_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、要シード/要実機のものは test.fixme（理由付き）で残す。
 * 手動/対象外はケース表で全量管理し、specには大量のfixmeを残さない。
 * 期待結果は仕様(m05-07_admin_order_order_labels_csv_export.md / 観点表)由来（オラクル独立性）。
 * 実装からはセレクタ（位置情報）のみ取得し、合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証/シード（環境変数。コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS … 管理者ログイン（config/default.config.ts）
 *  - SEED-M05-07-ORDER … 受注一覧に出荷行（name="ids[]" チェックボックス）が最低1件存在する状態
 *  - SEED-M05-07-STANDBY … 出荷指示編集に到達できる出荷指示ID（M05_07_STANDBY_ID）と order_ids 行
 * 実行方針: 認証/シードが無いと走らないよう test.skip でガード（存在はするが未実行＝抜け漏れ可視化）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AdminOrderOrderLabelsCsvExportPage } from "../../../pages/admin/m05/m05_07_admin_order_order_labels_csv_export.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// 仕様(設計書 利用者視点の入口/フロント挙動)由来の文言・パターン。実装に合わせて変えない。
const ALERT_UNSELECTED = "チェックボックスが選択されていません"; // 受注一覧 未チェック時 alert
const LABELS_FILENAME_RE = /^labels_\d{14}\.csv$/; // labels_<YmdHis>.csv（処理フロー#9）

async function loginAdmin(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
}

test.describe(
  "管理画面 受注管理 > 送り状CSV出力",
  { tag: ["@admin", "@order", "@csv"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M05-07-010 未ログインで送り状CSVエンドポイント直アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      // 期待は仕様(権限・認可: 管理画面に入れない利用者は到達できない)由来。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/standby/labels`);
      // 管理ログイン画面へ誘導される（URL=ログイン画面・ログインフォーム表示）。
      await expect(page).toHaveURL(new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login`));
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 認証必須（SEED不要） =====

    test("E2E-M05-07-004 ids不備(GET・ids無し)でエンドポイントへ届くとHTTP 404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginAdmin(page);
      const target = new AdminOrderOrderLabelsCsvExportPage(page);
      const resp = await target.gotoLabelsEndpointWithoutIds(); // ids を付けずに直接アクセス
      expect(resp?.status()).toBe(404); // 処理フロー#3: 配列でない/空→404
    });

    test("E2E-M05-07-012 ids非配列(スカラ ids=1・GET)でエンドポイントへ届くとHTTP 404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginAdmin(page);
      const target = new AdminOrderOrderLabelsCsvExportPage(page);
      // 設計書は「配列でない or 空配列」を404と規定。空(004)の対として非配列スカラを検証。
      const resp = await target.gotoLabelsEndpointWithScalarId(1);
      expect(resp?.status()).toBe(404); // 処理フロー#3: 配列でない→404
    });

    // ===== 受注一覧（要 SEED-M05-07-ORDER：出荷行1件以上） =====

    test("E2E-M05-07-006 受注一覧: 一括フォーム内に送り状出力ボタン(id=labelsExport)が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginAdmin(page);
      const target = new AdminOrderOrderLabelsCsvExportPage(page);
      await target.gotoOrderList();
      test.skip((await target.rowCount()) === 0, "SEED-M05-07-ORDER 未投入（受注一覧に出荷行が無い）");
      await target.seeListBulkUi();
    });

    test("E2E-M05-07-007 受注一覧: 各行チェックボックスのPOST名が ids[] である", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginAdmin(page);
      const target = new AdminOrderOrderLabelsCsvExportPage(page);
      await target.gotoOrderList();
      test.skip((await target.rowCount()) === 0, "SEED-M05-07-ORDER 未投入");
      // 期待は仕様(入力項目: POSTパラメータ名 ids[])由来。name属性で確認する。
      await expect(target.rowCheckboxes.first()).toHaveAttribute("name", "ids[]");
    });

    test("E2E-M05-07-003 受注一覧: チェック無しで送り状出力→alertで止まりダウンロードされない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginAdmin(page);
      const target = new AdminOrderOrderLabelsCsvExportPage(page);
      await target.gotoOrderList();
      test.skip((await target.rowCount()) === 0, "SEED-M05-07-ORDER 未投入");
      let alertMsg = "";
      page.on("dialog", (d) => {
        alertMsg = d.message();
        void d.dismiss();
      });
      let downloaded = false;
      page.on("download", () => {
        downloaded = true;
      });
      await target.clickLabelsExport(); // 未チェックのまま押下
      await expect.poll(() => alertMsg).toContain(ALERT_UNSELECTED); // 仕様: alert で止める
      expect(downloaded).toBe(false); // preventDefault でダウンロードされない
    });

    test("E2E-M05-07-001 受注一覧: 行をチェックし送り状出力→CSVダウンロードが発火する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginAdmin(page);
      const target = new AdminOrderOrderLabelsCsvExportPage(page);
      await target.gotoOrderList();
      test.skip((await target.rowCount()) === 0, "SEED-M05-07-ORDER 未投入");
      const download = await target.exportViaListAndWaitDownload();
      expect(download).toBeTruthy(); // 仕様: ファイルダウンロードとして応答を扱う（CSV内容は手動）
      // 画面遷移なし＝受注一覧URLを維持したままダウンロード扱い（仕様: ページ離脱なし）。
      await expect(page).toHaveURL(new RegExp(`/${ECCUBE_ADMIN_ROUTE}/order`));
    });

    test("E2E-M05-07-002 受注一覧: ダウンロードファイル名が labels_<日時>.csv である", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginAdmin(page);
      const target = new AdminOrderOrderLabelsCsvExportPage(page);
      await target.gotoOrderList();
      test.skip((await target.rowCount()) === 0, "SEED-M05-07-ORDER 未投入");
      const download = await target.exportViaListAndWaitDownload();
      // 期待は仕様(処理フロー#9: 接頭辞 labels_ ＋ YmdHis ＋ .csv)由来。
      expect(download.suggestedFilename()).toMatch(LABELS_FILENAME_RE);
    });

    test("E2E-M05-07-011 受注一覧: 行をチェックした送り状出力では出力前の確認ダイアログが出ない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginAdmin(page);
      const target = new AdminOrderOrderLabelsCsvExportPage(page);
      await target.gotoOrderList();
      test.skip((await target.rowCount()) === 0, "SEED-M05-07-ORDER 未投入");
      let confirmShown = false;
      page.on("dialog", (d) => {
        confirmShown = true;
        void d.dismiss();
      });
      const download = await target.exportViaListAndWaitDownload();
      expect(download).toBeTruthy();
      expect(confirmShown).toBe(false); // 仕様: 出力前の確認ダイアログはない
    });

    // ===== 保留（要シード/要実機。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M05-07-005 存在しない出荷IDのみ→404にせずCSVダウンロード発火（要: CSRFトークン取得＋認証済みrequest POST）",
      async () => {
        // 期待は仕様(エッジケース: データ行0件・ヘッダのみCSV・エラーにしない)由来。
        // form_bulk の CSRF hidden を読み取り ids[]=存在しない値で POST し、HTTP 200＋attachment を確認する手順を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M05-07-008 出荷指示編集: 送り状出力ボタンが表示される（要: SEED-M05-07-STANDBY 出荷指示ID）",
      async () => {
        // 期待は仕様(フロント挙動: 出荷指示編集にも送り状出力導線)由来。
        // 注: 当画面のボタン文言は trans admin.stock.move_instruction.csv_download_invoice=「送り状CSVダウンロード」（不具合候補#1）。
      }
    );

    test.fixme(
      "E2E-M05-07-009 出荷指示編集: 行をチェックし送り状出力→hidden ids[]を組み立てCSVダウンロード発火（要: SEED-M05-07-STANDBY）",
      async () => {
        // 期待は仕様(利用者視点の入口: data-shipping-id から hidden ids[] を付け足して送信)由来。
      }
    );

    test.fixme(
      "E2E-M05-07-013 出荷指示編集: 未選択のまま送り状出力→受注一覧alertの対（出荷指示編集側は未チェックガード差）（要: SEED-M05-07-STANDBY・要実機）",
      async () => {
        // 期待は仕様(利用者視点の入口)由来。受注一覧(003)はalertでpreventDefaultだが、
        // 出荷指示編集側は未チェックalertガードが無く hidden ids[] が組み立てられず送信されうる。
        // その場合サーバ側で ids 空→HTTP 404（処理フロー#3）。alert異常系(003)との対として実機確認後に実装。
        // 不具合候補#2（画面差）に対応。挙動は実装に寄せず仕様(404 or 送信抑止)で判定する。
      }
    );
  }
);
