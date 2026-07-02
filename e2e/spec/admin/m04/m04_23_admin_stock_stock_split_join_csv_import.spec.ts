/**
 * 管理画面 在庫管理「在庫分割結合CSV登録」E2E。
 * 納品ケース表 integration_test/e2e/m04_23_admin_stock_stock_split_join_csv_import_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装する。自動化予定だが未実装/要実機（直POST・要シード）は test.fixme で残し、
 * 手動（CSV雛形の内容＝BOM/ヘッダ文字コード・取込内容のDB一致・在庫増減・承認アラートメール）・
 * 対象外（ログ出力抑止・取込履歴は記録なし・送信可否制御）はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-23_admin_stock_stock_split_join_csv_import.md
 *   / 基本設計仕様書(在庫管理機能 M04-23シート) / messages.ja.yaml)由来（オラクル独立性）。
 *   実装の現挙動・Form制約(NotBlank/File)は期待値へ流用しない。
 * 刷新先 ec-cube-enterprise に該当画面・ルートが存在することを確認済み
 *   （StockSplitJoinController.php / stock_split_join_index.twig＋モーダル本体twig）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(050-053)は資格情報不要。取込成功(040/041)は分割元/結合先/結合元の ProductStock 実在が前提のため
 *   要シード＝fixme。ファイル未添付(024/032)・在庫区分不正(025/033)はブラウザのHTML5 required等で通常送信が阻まれ得るため
 *   直POST構築が必要＝fixme（要実機確認）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockStockSplitJoinCsvImportPage } from "../../../pages/admin/m04/m04_23_admin_stock_stock_split_join_csv_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const MSG_CSRF = "セッションがタイムアウトしました。もう一度やり直してください。"; // :3941 admin.common.csrf_invalid
const MSG_UPLOAD_ERR = "CSVファイルのアップロードに失敗しました"; // :1410 admin.common.csv_upload_error
const MSG_SPLIT_DONE_RE = /件の分割を登録し、承認申請まで進めました。/; // :4585 list_csv_split_import_done
const MSG_JOIN_DONE_RE = /件の結合を登録し、欠品入力まで進めました。/; // :4584 list_csv_join_import_done

// 取込後は常に一覧へリダイレクト(PRG)。一覧URL限定（下位 /list-split-csv-import 等を誤一致させない）。
const LIST_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/product/stock/split-join(?:[?#]|$)`
);
const LOGIN_RE = /\/login(\?|$)/;

// 取込エラー検証用CSV（業務データ不要＝ヘッダ/列/数値の形式不正で全件ロールバックを発生させる）。
const SPLIT_WRONG_COLUMNS = "列A,列B\n1,2\n"; // 必須4列でない＝列数/ヘッダ不一致
const SPLIT_MISSING_HEADER = "分割元商品コード,分割数,分割先商品コード\nX,1,Y\n"; // 必須ヘッダ「分割先在庫数」欠落
const SPLIT_BAD_NUMBER = "分割元商品コード,分割数,分割先商品コード,分割先在庫数\nX,0,Y,1\n"; // 分割数0（>0でない）
const JOIN_WRONG_COLUMNS = "列A,列B\n1,2\n"; // 必須5列でない
const JOIN_BAD_NUMBER =
  "結合先商品コード,結合数,結合元商品コード,結合元在庫区分,結合元在庫数\nA,0,B,1,1\n"; // 結合数=0（>0でない）。ヘッダ表記はExcel正典（設計md:69）
const JOIN_MISSING_HEADER =
  "結合先商品コード,結合数,結合元商品コード,結合元在庫区分\nA,1,B,1\n"; // 必須ヘッダ「結合元在庫数」欠落（分割021と対）

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).not.toHaveURL(LOGIN_RE);
}

test.describe(
  "管理画面 在庫管理 > 在庫分割結合CSV登録",
  { tag: ["@admin", "@stock", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M04-23-050 未ログインで分割CSV雛形URL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new StockStockSplitJoinCsvImportPage(page);
      await page.goto(p.splitTemplatePath);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M04-23-052 未ログインで結合CSV雛形URL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new StockStockSplitJoinCsvImportPage(page);
      await page.goto(p.joinTemplatePath);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M04-23-053 未ログインで承認通知先メンバー取得URL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new StockStockSplitJoinCsvImportPage(page);
      await page.goto(`${p.approvalMembersPath}?store_id=1`);
      await expect(page).toHaveURL(LOGIN_RE);
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      // --- モーダルUI表示 ---

      test("E2E-M04-23-001 一覧に「在庫分割CSV登録」「在庫結合CSV登録」ボタンが表示される", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        await p.gotoList();
        await p.seeRegisterButtons();
      });

      test("E2E-M04-23-002 分割モーダルに店舗・在庫区分・ファイル選択・「CSVから登録」が表示される", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        await p.gotoList();
        await p.openSplitModal();
        await expect(p.splitStore).toBeVisible();
        await expect(p.splitInventoryEcCube).toBeAttached();
        await expect(p.splitFile).toBeAttached(); // d-none のため visible でなく attached
        await expect(p.splitSubmit).toBeVisible();
        await expect(p.splitSubmit).toHaveText("CSVから登録"); // list_csv_import_submit（:4582）
      });

      test("E2E-M04-23-003 分割モーダルに承認通知先メンバー欄が表示される", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        await p.gotoList();
        await p.openSplitModal();
        await expect(p.splitApprovalMembers).toBeAttached();
        await expect(p.splitModal).toContainText("承認通知先"); // approval_notification_target（:4644）
      });

      test("E2E-M04-23-007 分割モーダルに承認通知先「所属」セレクトが表示される", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        await p.gotoList();
        await p.openSplitModal();
        // 設計のアップロードフォーム項目「承認通知先所属（1-3）」セレクトが表示されること。
        await expect(p.splitApprovalDept).toBeAttached();
      });

      test("E2E-M04-23-004 分割モーダルのCSVフォーマット表に4列の項目名が表示される", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        await p.gotoList();
        await p.openSplitModal();
        // 期待は基本設計(Excel)由来の列名。分割は実装表記もExcelと一致する。
        for (const col of ["分割元商品コード", "分割数", "分割先商品コード", "分割先在庫数"]) {
          await expect(p.splitModal).toContainText(col);
        }
      });

      test("E2E-M04-23-005 結合モーダルに店舗・在庫区分・ファイル選択・「CSVから登録」が表示される", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        await p.gotoList();
        await p.openJoinModal();
        await expect(p.joinStore).toBeVisible();
        await expect(p.joinInventoryEcCube).toBeAttached();
        await expect(p.joinFile).toBeAttached();
        await expect(p.joinSubmit).toBeVisible();
        await expect(p.joinSubmit).toHaveText("CSVから登録");
      });

      test("E2E-M04-23-006 結合モーダルのCSVフォーマット表に「結合数」列が表示される（仕様乖離検出見込み）", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        await p.gotoList();
        await p.openJoinModal();
        // 期待は基本設計(Excel)由来の列名「結合数」。実装の表ラベルは format_join_quantity=「結合元在庫数」(messages:4682)で
        // 「結合数」を表示していない＝不具合候補#1。仕様どおりに期待値を書く（落ちて検出する）。
        await expect(p.joinModal).toContainText("結合先商品コード");
        await expect(p.joinModal).toContainText("結合数");
        await expect(p.joinModal).toContainText("結合元商品コード");
        await expect(p.joinModal).toContainText("結合元在庫区分");
        await expect(p.joinModal).toContainText("結合元在庫数");
      });

      // --- CSV雛形ダウンロード（内容＝BOM/ヘッダ文字コードは手動） ---

      test("E2E-M04-23-010 分割CSV雛形リンク押下でダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        await p.gotoList();
        const download = await p.downloadSplitTemplate();
        expect(download).toBeTruthy();
      });

      test("E2E-M04-23-011 分割CSV雛形がCSV形式（拡張子 .csv）でダウンロードされる", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        await p.gotoList();
        const download = await p.downloadSplitTemplate();
        // 仕様(設計md:51「ヘッダのみのCSV雛形をダウンロード」)由来＝CSVであること(.csv)を判定する。
        // 厳密なファイル名 stock_split_template.csv は設計書未規定の実装確認値のためオラクル化しない（手動/要確認）。
        expect(download.suggestedFilename()).toMatch(/\.csv$/i);
      });

      test("E2E-M04-23-012 分割CSV雛形応答がHTTP200を返す", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        const res = await page.request.get(p.splitTemplatePath);
        expect(res.status()).toBe(200);
      });

      test("E2E-M04-23-013 分割CSV雛形応答がダウンロード（添付）として返る", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        const res = await page.request.get(p.splitTemplatePath);
        // 仕様(設計md:51「ダウンロードする」)由来＝添付ダウンロードであること。
        // Content-Type=application/octet-stream は設計書未規定の実装確認値のためオラクル化しない。
        expect(res.headers()["content-disposition"] || "").toContain("attachment");
      });

      test("E2E-M04-23-014 分割CSV雛形応答が attachment かつ CSV(.csv) ファイル名を返す", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        const res = await page.request.get(p.splitTemplatePath);
        const cd = res.headers()["content-disposition"] || "";
        expect(cd).toContain("attachment");
        // 仕様(CSV雛形)由来＝.csv であること。厳密名 stock_split_template.csv は実装確認値でありオラクル化しない。
        expect(cd).toMatch(/\.csv/i);
      });

      test("E2E-M04-23-015 結合CSV雛形リンク押下でダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        await p.gotoList();
        const download = await p.downloadJoinTemplate();
        expect(download).toBeTruthy();
      });

      test("E2E-M04-23-016 結合CSV雛形がCSV形式（拡張子 .csv）でダウンロードされる", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        await p.gotoList();
        const download = await p.downloadJoinTemplate();
        // 仕様(設計md:52)由来＝CSVであること。厳密名 stock_join_template.csv は実装確認値でありオラクル化しない（手動/要確認）。
        expect(download.suggestedFilename()).toMatch(/\.csv$/i);
      });

      test("E2E-M04-23-017 結合CSV雛形応答がHTTP200を返す", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        const res = await page.request.get(p.joinTemplatePath);
        expect(res.status()).toBe(200);
      });

      // --- 取込エラー（全件ロールバック・一覧へ滞留。業務データ不要） ---

      test("E2E-M04-23-020 分割: 列数/ヘッダ不一致CSV取込→エラー表示・一覧へ・登録されない", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        await p.gotoList();
        await p.uploadSplit("bad_columns.csv", SPLIT_WRONG_COLUMNS);
        await expect(page).toHaveURL(LIST_RE);
        await expect(p.errorAlert.first()).toBeVisible(); // 行/形式エラーを addError 表示（全件ロールバック）
        await expect(p.successAlert).toHaveCount(0); // 成功表示は出ない
      });

      test("E2E-M04-23-021 分割: 必須ヘッダ欠落CSV取込→エラー表示・一覧へ", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        await p.gotoList();
        await p.uploadSplit("missing_header.csv", SPLIT_MISSING_HEADER);
        await expect(page).toHaveURL(LIST_RE);
        await expect(p.errorAlert.first()).toBeVisible();
        await expect(p.successAlert).toHaveCount(0);
      });

      test("E2E-M04-23-022 分割: 数値不正行(分割数0)取込→エラー表示・全件ロールバック", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        await p.gotoList();
        await p.uploadSplit("bad_number.csv", SPLIT_BAD_NUMBER);
        await expect(page).toHaveURL(LIST_RE);
        await expect(p.errorAlert.first()).toBeVisible();
        await expect(p.successAlert).toHaveCount(0);
      });

      test("E2E-M04-23-023 分割: CSRFトークン不正でPOST→セッションタイムアウト表示・一覧へ", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        await p.gotoList();
        await p.openSplitModal();
        await p.selectFirstStore(p.splitStore);
        await p.splitInventoryEcCube.check();
        await p.splitFile.setInputFiles({
          name: "any.csv",
          mimeType: "text/csv",
          buffer: Buffer.from(SPLIT_MISSING_HEADER, "utf-8"),
        });
        // hidden な CSRF トークンを不正値に書き換える（CSRF検証が最初の判定＝判定順序#1）。
        await p.splitToken.evaluate((el: HTMLInputElement) => (el.value = "invalid-token"));
        await p.splitSubmit.click();
        await expect(page).toHaveURL(LIST_RE);
        await expect(p.errorAlert).toContainText(MSG_CSRF);
      });

      test("E2E-M04-23-030 結合: 列数/ヘッダ不一致CSV取込→エラー表示・一覧へ", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        await p.gotoList();
        await p.uploadJoin("bad_columns.csv", JOIN_WRONG_COLUMNS);
        await expect(page).toHaveURL(LIST_RE);
        await expect(p.errorAlert.first()).toBeVisible();
        await expect(p.successAlert).toHaveCount(0);
      });

      test("E2E-M04-23-035 結合: 必須ヘッダ欠落CSV取込→エラー表示・一覧へ（分割021と対）", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        await p.gotoList();
        await p.uploadJoin("missing_header.csv", JOIN_MISSING_HEADER);
        await expect(page).toHaveURL(LIST_RE);
        await expect(p.errorAlert.first()).toBeVisible();
        await expect(p.successAlert).toHaveCount(0);
      });

      test("E2E-M04-23-034 結合: 数値不正行(結合数0)取込→エラー表示・全件ロールバック", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        await p.gotoList();
        await p.uploadJoin("bad_number.csv", JOIN_BAD_NUMBER);
        await expect(page).toHaveURL(LIST_RE);
        await expect(p.errorAlert.first()).toBeVisible(); // 形式エラー→addError（全件ロールバック）
        await expect(p.successAlert).toHaveCount(0); // 成功表示は出ない（登録されない＝間接観測）
      });

      test("E2E-M04-23-031 結合: CSRFトークン不正でPOST→セッションタイムアウト表示・一覧へ", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        await p.gotoList();
        await p.openJoinModal();
        await p.selectFirstStore(p.joinStore);
        await p.joinInventoryEcCube.check();
        await p.joinFile.setInputFiles({
          name: "any.csv",
          mimeType: "text/csv",
          buffer: Buffer.from(JOIN_WRONG_COLUMNS, "utf-8"),
        });
        await p.joinToken.evaluate((el: HTMLInputElement) => (el.value = "invalid-token"));
        await p.joinSubmit.click();
        await expect(page).toHaveURL(LIST_RE);
        await expect(p.errorAlert).toContainText(MSG_CSRF);
      });

      test("E2E-M04-23-060 承認通知先メンバー取得が application/json をHTTP200で返す", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvImportPage(page);
        const res = await page.request.get(`${p.approvalMembersPath}?store_id=1`);
        expect(res.status()).toBe(200);
        expect(res.headers()["content-type"]).toContain("application/json");
      });
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M04-23-024 分割: ファイル未添付POST→「CSVファイルのアップロードに失敗しました」（要: HTML5 required回避の直POST）",
      async () => {
        // 期待は仕様(検証順序#2 / messages.ja.yaml:1410)由来。FileType required によりブラウザ送信が阻まれ得るため
        // multipart の直POST構築を実機確認後に実装する。期待値 MSG_UPLOAD_ERR。
        void MSG_UPLOAD_ERR;
      }
    );

    test.fixme(
      "E2E-M04-23-025 分割: 在庫区分が1/2以外のPOST→アップロード失敗メッセージ（要: 直POST）",
      async () => {
        // 期待は仕様(検証順序#4 split は inventory_category∈{1,2})由来。ラジオは1/2のみのため直POSTが必要。
      }
    );

    test.fixme(
      "E2E-M04-23-032 結合: ファイル未添付POST→アップロード失敗メッセージ（要: 直POST）",
      async () => {
        // 期待は仕様(検証順序#2)由来。
      }
    );

    test.fixme(
      "E2E-M04-23-026 分割: 店舗未解決POST→「CSVファイルのアップロードに失敗しました」（要: 存在しないstore直POST）",
      async () => {
        // 期待は仕様(検証順序#3 店舗解決不可→csv_upload_error / messages.ja.yaml:1410)由来。
        // store セレクトは実在選択肢のみのため、存在しないIDの送信は直POST構築が必要。期待値 MSG_UPLOAD_ERR。
        void MSG_UPLOAD_ERR;
      }
    );

    test.fixme(
      "E2E-M04-23-028 分割: 非CSV(画像等)ファイル取込→エラー/アップロード失敗（要: 直POST・MIME検証要実機）",
      async () => {
        // 期待は仕様(基本設計「csv以外のファイルはエラー」)由来。取込ルートはフォームFile制約を経ずMIME未検証の
        // 可能性（不具合候補#4）。非CSVバイト列の送信・サーバ判定の検証は直POST/実機確認が必要。
      }
    );

    test.fixme(
      "E2E-M04-23-033 結合: 在庫区分<1のPOST→アップロード失敗メッセージ（要: 直POST）",
      async () => {
        // 期待は仕様(検証順序#4 結合は inventory_category≥1)由来。
      }
    );

    test.fixme(
      "E2E-M04-23-040 分割: 正常CSV取込→「N件の分割を登録し、承認申請まで進めました。」（要シード: 分割元/分割先 ProductStock）",
      async () => {
        // 期待は仕様(処理フロー onAfterImport / messages.ja.yaml:4585)由来。SEED-M04-23-SPLIT-OK 投入後に実装。
        void MSG_SPLIT_DONE_RE;
      }
    );

    test.fixme(
      "E2E-M04-23-041 結合: 正常CSV取込→「N件の結合を登録し、欠品入力まで進めました。」（要シード: 結合先/結合元 ProductStock）",
      async () => {
        // 期待は仕様(処理フロー onAfterImport / messages.ja.yaml:4584)由来。SEED-M04-23-JOIN-OK 投入後に実装。
        void MSG_JOIN_DONE_RE;
      }
    );

    test.fixme(
      "E2E-M04-23-051 未ログインで分割CSV登録POST→管理ログイン画面へ誘導（要: 未認証multipart直POST）",
      async () => {
        // 期待は仕様(権限・認可: 管理ファイアウォールで未ログインPOSTはログインへ)由来。
      }
    );

    test.fixme(
      "E2E-M04-23-054 未ログインで結合CSV登録POST→管理ログイン画面へ誘導（要: 未認証multipart直POST）",
      async () => {
        // 期待は仕様(権限・認可: 管理ファイアウォールで未ログインPOSTはログインへ)由来。
        // 分割(051)と対の異常系。結合POST list-join-csv-import を未認証で叩く。
      }
    );
  }
);
