/**
 * 管理画面 商品管理「カード商品CSV登録」E2E。
 * 納品ケース表 integration_test/e2e/m03_26_admin_product_product_card_csv_import_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装し、正常取込（valid CSV＝DB副作用あり）等は test.fixme（理由付き）で残す。
 * 手動・対象外はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-26_admin_product_product_card_csv_import.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 取込成功・履歴増加・業務エラー（販売<買取等）は「言語/カテゴリ/カード詳細/割引等のマスタが整った
 * 正規CSV」を要し、かつ商品/規格/在庫/価格履歴をDB更新するため、SEEDと隔離環境を要件化し test.fixme とする。
 * 事前検証エラー（ヘッダのみ・列数不一致・行数上限・ファイル未選択）は不正CSVを in-test 生成でき、
 * ロールバックされDB副作用が無いため自動化する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductCardCsvImportPage } from "../../../pages/admin/m03/m03_26_admin_product_product_card_csv_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const MSG_SUCCESS = "CSVファイルをアップロードしました"; // :1409 admin.common.csv_upload_complete
const MSG_INVALID_FORMAT = "CSVのフォーマットが一致しません"; // :1561 admin.common.csv_invalid_format
const MSG_MAXRECORD = "行を超えるCSVファイルは登録できません。"; // :1429 admin.csv.error.upload.maxrecord（%maxRecord%=5010）

// カード商品登録CSVの日本語ヘッダ行（CardCsvController.getStructuredImportHeaders() のキー順）。
// 事前検証（ヘッダ有・データ行有無/列数）を起こすための最小入力に使う。期待値ではなく入力データ。
const HEADER_LINE =
  "商品ID,言語(ID),商品公開ステータス,支店の商品公開ステータス,商品名(日),商品名(英),サイズ,重量,商品説明(日),商品説明(英),買取商品説明(日),買取商品説明(英),検索ワード,規格画像,商品カテゴリ(ID),購入グループ名称,割引率(ID),買取減額率(ID),略称タグ(ID),売上分析タグ(ID),タグ(ID),発送日目安(ID),販売制限数,基準価格,販売価格,買取価格,原価単価,カード詳細(ID),地域別販売制限,フリーエリア";

const UPLOAD_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/product_card_csv_upload(\\?|$)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 商品管理 > カード商品CSV登録",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== 権限・認可（資格情報不要・サイト到達のみ） =====

    test("E2E-M03-26-040 未ログインでアップロードURL直接→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/product_card_csv_upload`);
      await expect(page.locator("#login_id")).toBeVisible(); // 管理ログイン画面（admin/login.twig:26）
    });

    test("E2E-M03-26-041 未ログインで雛形ダウンロードURL直接→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/product_card/csv_template`);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 以降は管理画面ログインを要する =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      // ----- 画面表示・UI部品 -----

      test("E2E-M03-26-001 アップロード画面が表示されタイトル「カード商品登録CSVアップロード」が出る", async ({ page }) => {
        await login(page);
        const p = new ProductProductCardCsvImportPage(page);
        await p.gotoUpload();
        await expect(page.locator("body")).toContainText("カード商品登録CSVアップロード"); // csv_box_title messages:1737
      });

      test("E2E-M03-26-002 ファイル入力欄とCSVアップロードボタンが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductCardCsvImportPage(page);
        await p.gotoUpload();
        await p.seeUploadForm();
      });

      test("E2E-M03-26-003 フォーマット説明表が見出し「項目名」「説明」で表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductCardCsvImportPage(page);
        await p.gotoUpload();
        await p.seeFormatTable();
      });

      test("E2E-M03-26-004 必須列に「必須」バッジが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductCardCsvImportPage(page);
        await p.gotoUpload();
        await expect(p.requiredBadge.first()).toBeVisible(); // 必須列バッジ base_csv_upload.twig:101
      });

      test("E2E-M03-26-005 雛形ダウンロードリンク「雛形ファイルダウンロード」が表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductCardCsvImportPage(page);
        await p.gotoUpload();
        await expect(p.downloadTemplateLink).toBeVisible();
        await expect(p.downloadTemplateLink).toContainText("雛形ファイルダウンロード"); // messages:1548
      });

      test("E2E-M03-26-006 取込履歴テーブル（ファイル名/アップロード日時/作業者）が表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductCardCsvImportPage(page);
        await p.gotoUpload();
        await p.seeHistoryTable();
      });

      test("E2E-M03-26-007 履歴の表示件数プルダウンが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductCardCsvImportPage(page);
        await p.gotoUpload();
        await expect(p.pageCountPulldown).toBeVisible(); // csv_import_history.twig:10
      });

      test("E2E-M03-26-008 送信前に確認ダイアログを介さず送信できる（type=submit・dialog無し）", async ({ page }) => {
        await login(page);
        const p = new ProductProductCardCsvImportPage(page);
        await p.gotoUpload();
        // 仕様（フロント挙動: 送信前の確認ダイアログはない）。dialog が出れば記録して失敗させる。
        let dialogShown = false;
        page.on("dialog", async (d) => {
          dialogShown = true;
          await d.dismiss();
        });
        await expect(p.uploadButton).toHaveAttribute("type", "submit");
        // 実際に押下しても確認ダイアログを介さずそのまま送信され、アップロード画面へ戻る。
        await p.submit();
        await expect(page).toHaveURL(UPLOAD_RE);
        expect(dialogShown).toBe(false);
      });

      test("E2E-M03-26-009 ファイル選択でラベルにファイル名が表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductCardCsvImportPage(page);
        await p.gotoUpload();
        // JS（base_csv_upload.twig:25-27）: change で custom-file-label にファイル名を表示する。
        await p.selectFileBuffer("e2e_card_label.csv", HEADER_LINE + "\n");
        await expect(p.fileLabel).toContainText("e2e_card_label.csv");
      });

      // ----- 雛形ダウンロード -----

      test("E2E-M03-26-010 雛形ダウンロードで product_card.csv がダウンロードされる", async ({ page }) => {
        await login(page);
        const p = new ProductProductCardCsvImportPage(page);
        await p.gotoUpload();
        const dl = await p.downloadTemplate();
        expect(dl.suggestedFilename()).toBe("product_card.csv"); // 仕様: ファイル名 product_card.csv（処理フロー・入口）
        // CSV本文（ヘッダ1行・列順）は手動確認（ケース表 付帯表2）。
      });

      // ----- 取込エラー（不正CSV＝ロールバックされDB副作用なし・自動化） -----

      test("E2E-M03-26-030 ファイル未選択で送信するとエラーが表示され取込されない", async ({ page }) => {
        await login(page);
        const p = new ProductProductCardCsvImportPage(page);
        await p.gotoUpload();
        await p.submitWithoutFile(); // 必須(NotBlank)/ファイル未選択
        // 仕様（エラー処理: フォーム不正・ファイル未選択は該当キーをフラッシュしリダイレクト）。
        await expect(p.errorAlert.first()).toBeVisible();
        await expect(p.successAlert).toHaveCount(0); // 成功フラッシュは出ない
        await expect(page).toHaveURL(UPLOAD_RE); // アップロード画面へ戻る
      });

      test("E2E-M03-26-021 送信後は常にアップロード画面（GET）へリダイレクトされる", async ({ page }) => {
        await login(page);
        const p = new ProductProductCardCsvImportPage(page);
        await p.gotoUpload();
        await p.submitWithoutFile(); // POST→常にGETアップロード画面へ（成功/失敗いずれも）
        await expect(page).toHaveURL(UPLOAD_RE);
        await expect(p.uploadButton).toBeVisible(); // GETアップロード画面が再描画される
      });

      test("E2E-M03-26-031 ヘッダのみ（データ行なし）CSVでエラーが表示され履歴が増えない", async ({ page }) => {
        await login(page);
        const p = new ProductProductCardCsvImportPage(page);
        await p.gotoUpload();
        await p.selectFileBuffer("e2e_header_only.csv", HEADER_LINE + "\n");
        await p.submit();
        // 仕様（処理フロー/インポータ事前検証: ヘッダのみ・データ行なしはエラー集合を返す）。
        await expect(p.errorAlert.first()).toBeVisible();
        await expect(p.successAlert).toHaveCount(0); // 成功・履歴INSERTは行わない（エッジケース）
        await expect(page).toHaveURL(UPLOAD_RE);
      });

      test("E2E-M03-26-032 列数不一致のデータ行を含むCSVでエラーが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductCardCsvImportPage(page);
        await p.gotoUpload();
        // ヘッダは30列、データ行は3列＝列数不一致（判定順序#2）。
        await p.selectFileBuffer("e2e_col_mismatch.csv", HEADER_LINE + "\n1,2,3\n");
        await p.submit();
        await expect(p.errorAlert.first()).toBeVisible();
        await expect(p.successAlert).toHaveCount(0);
        await expect(page).toHaveURL(UPLOAD_RE);
      });

      test("E2E-M03-26-033 行数上限（5010行以上）のCSVで上限超過メッセージが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductCardCsvImportPage(page);
        await p.gotoUpload();
        // ヘッダ＋5010データ行（改行カウントが ADMIN_CSV_IMPORT_MAX_ROWS=5010 以上）。値の正否ではなく行数で拒否される。
        const rows = Array.from({ length: 5010 }, () => "1").join("\n");
        await p.selectFileBuffer("e2e_maxrecord.csv", HEADER_LINE + "\n" + rows + "\n");
        await p.submit();
        await expect(p.errorAlert).toContainText(MSG_MAXRECORD); // admin.csv.error.upload.maxrecord
        await expect(p.successAlert).toHaveCount(0);
        await expect(page).toHaveURL(UPLOAD_RE);
      });

      test("E2E-M03-26-035 取込結果にエラーがあると成功フラッシュも履歴行も増えない", async ({ page }) => {
        await login(page);
        const p = new ProductProductCardCsvImportPage(page);
        await p.gotoUpload();
        const before = await p.historyRows.count();
        await p.selectFileBuffer("e2e_error_no_history.csv", HEADER_LINE + "\n1,2,3\n");
        await p.submit();
        // 仕様（エッジケース: エラーが1件でもあれば成功メッセージ・取込履歴INSERTを行わない）。
        await expect(p.successAlert).toHaveCount(0);
        await expect(p.errorAlert.first()).toBeVisible();
        await p.gotoUpload(); // 再表示して履歴件数を確認
        await expect(p.historyRows).toHaveCount(before); // 履歴は増えない
      });

      // ----- 履歴のページサイズ変更 -----

      test("E2E-M03-26-050 履歴表示件数を変更するとURLに page_count が反映される", async ({ page }) => {
        await login(page);
        const p = new ProductProductCardCsvImportPage(page);
        await p.gotoUpload();
        await p.changePageCount(50); // プルダウン変更で window.location.href 差し替え
        await expect(page).toHaveURL(/page_count=50/); // 許容リスト内の件数はクエリへ反映
      });

      test("E2E-M03-26-051 履歴件数に許容リスト外の値を指定しても反映されず既定（10件）の選択が維持される", async ({ page }) => {
        await login(page);
        const p = new ProductProductCardCsvImportPage(page);
        // 仕様（処理フロー#3／セッション節: page_count が許容リストに含まれないときは既定 10 を採用）。
        // 許容リスト外（9999）を直接指定しても無視され、プルダウンの選択は許容リスト内の既定 10 のまま。
        await page.goto(`${p.uploadUrl}?page_count=9999`);
        // selected option の value は path(history_page_route, {page_count: 10})＝page_count=10 を含む（既定維持）。
        await expect(p.pageCountPulldown).toHaveValue(/page_count=10(?:&|$)/);
      });
    });

    // ===== 保留（要シード・DB副作用・隔離環境。抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M03-26-020 正規CSVの取込成功で「CSVファイルをアップロードしました」が表示される（要: SEED-M03-26-MASTER＋正規CSV）",
      async () => {
        // 期待は仕様(処理フロー#9 成功フラッシュ admin.common.csv_upload_complete / messages.ja.yaml:1409)由来。
        // 言語/カテゴリ/カード詳細/割引/購入グループ等のマスタが整った正規CSVを要し、商品/規格/在庫/価格履歴を
        // DB更新する破壊的操作のため、隔離環境＋SEED後に実装。実装時: body に MSG_SUCCESS を期待。
        void MSG_SUCCESS;
      }
    );

    test.fixme(
      "E2E-M03-26-022 取込成功時に取込履歴が1件増える（要: SEED-M03-26-MASTER＋正規CSV）",
      async () => {
        // 期待は仕様(データ整合性: エラー配列が空のときだけ履歴が1件増える)由来。
        // 実装時: 取込前後で historyRows 件数差＝+1、先頭行にアップロードしたファイル名を期待。
      }
    );

    test.fixme(
      "E2E-M03-26-034 業務エラー（買取価格が販売価格を上回る等）CSVでエラー表示・成功/履歴なし（要: SEED-M03-26-MASTER）",
      async () => {
        // 期待は仕様(行処理判定順序#4 販売<買取で全体中断 / エッジケース: 中断時はロールバック・履歴INSERTなし)由来。
        // 正規マスタ参照の整った行＋買取>販売の1セルが必要なため SEED 後に実装。
        // 実装時: errorAlert 可視・successAlert=0・取込前後で履歴件数不変。
      }
    );
  }
);
