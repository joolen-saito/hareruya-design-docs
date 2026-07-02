/**
 * 管理画面 在庫管理「在庫移動実績CSV登録（送り状No.一括登録）」E2E（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m04_29_admin_stock_stock_move_result_csv_import_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装し、要シード/破壊的/要実機（CSRF・request直送・ヘッダ不正）のケースは
 * test.fixme（理由付き）で残す。手動・対象外はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-29_..._csv_import.md / messages.ja.yaml / 観点表 / 基本設計)由来
 * （オラクル独立性）。実装の Form 制約・accept 属性・行数上限値は期待値へ流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 画面構成: 単独画面ではなく在庫移動指示一覧（admin_stock_move_instruction_list）上のモーダルから CSV を POST し、
 * 一覧へ resume=1 付きでリダイレクトしてフラッシュ（.alert）で結果を表示する。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 取込成功(020)・店舗名不一致(061/062)・送り状No.空(070)は既存の在庫移動指示レコード（既知ID・店舗名）が必要なため
 * SEED-M04-29-INSTRUCTION 整備後に実装（破壊的: tracking_no を上書きするため使い捨てアカウント/レコード推奨）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AdminStockStockMoveResultCsvImportPage } from "../../../pages/admin/m04/m04_29_admin_stock_stock_move_result_csv_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様(messages.ja.yaml / 設計書 表示メッセージ)由来の表示文言・ラベル。実装に合わせて変えない（オラクル独立性）。
const FEATURE_LABEL = "在庫移動実績CSV登録"; // モーダル起動ボタン/見出し messages.ja.yaml:4973
const OVERWRITE_NOTE = "（既に在庫移動実績を登録している場合、上書きされます）"; // :4975
const FILE_LIMIT_NOTE = "（1ファイルの登録上限は10,000件です）"; // :4976
const MODAL_LEAD = "CSVファイルを選択し、登録ボタンをクリックしてください。"; // :4974
const FORMAT_TITLE = "CSVファイルフォーマット"; // :4977
const HEAD_INSTRUCTION_ID = "移動指示ID"; // :4978（必須列）
const HEAD_TRACKING_NO = "送り状No."; // :4984（必須列）
const MSG_SUCCESS = "送り状No.を一括登録しました。"; // :5006 成功件数>0
const MSG_NO_VALID_ROWS = "有効な行がありません。"; // :5005 成功0・エラー0
const MSG_INSTRUCTION_NOT_FOUND = "移動指示が見つかりません"; // :5008 行内エラー
const MSG_SHOP_MISMATCH_FROM = "出庫元店舗が一致しません"; // :5009
const MSG_SHOP_MISMATCH_TO = "入庫先店舗が一致しません"; // :5010
const MSG_TRACKING_EMPTY = "送り状Noが空欄です"; // :5011
const MSG_FILE_INVALID = "ファイルが不正です。"; // :5003
const MSG_HEADER_INVALID = "CSVのヘッダーが不正です。"; // :5004
const MSG_ERRORS_CAPPED = "エラーは20件まで表示されます"; // :5013（>20件）

const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/stock/move-instruction`);
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
// 取込後は一覧へ resume=1 付きでリダイレクト（設計書「利用者視点の入口」「結果メッセージ・エラー行/不正行の扱い」由来）。
const RESUME_RE = /[?&]resume=1(?:&|$)/;

// ヘッダー（取込CSV仕様 必須/任意列。順序は設計書「取込CSV仕様」に従う）
const CSV_HEADER = "移動指示ID,出庫元店舗(名称),入庫先店舗(名称),送り状No.";
// 拡張子tsvはタブ区切りで解釈される（設計書「取込CSV仕様」eccube_csv_import_delimiter）。
const TSV_HEADER = "移動指示ID\t出庫元店舗(名称)\t入庫先店舗(名称)\t送り状No.";
// 失敗行は行番号付き（「n行目: …」）で表示される（設計書「結果メッセージ・エラー行／不正行の扱い」）。
const ROW_NUMBER_RE = /\d+行目/;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 在庫管理 > 在庫移動実績CSV登録",
  { tag: ["@admin", "@stock", "@csv"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M04-29-110 未ログインで在庫移動指示一覧URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock/move-instruction`);
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可: 未ログインは管理ログインへ
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 画面/モーダルUI表示（要管理ログイン・非破壊） =====

    test("E2E-M04-29-010 一覧の「在庫移動実績CSV登録」ボタンでモーダルが開く", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M04-29-ADMIN）");
      await login(page);
      const csv = new AdminStockStockMoveResultCsvImportPage(page);
      await csv.goto();
      await expect(csv.openModalButton).toContainText(FEATURE_LABEL); // 操作起点ボタン文言
      await csv.openModal();
    });

    test("E2E-M04-29-001 モーダルにファイル選択欄・登録ボタン・フォーマット表が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new AdminStockStockMoveResultCsvImportPage(page);
      await csv.goto();
      await csv.openModal();
      await csv.seeModalForm();
    });

    test("E2E-M04-29-002 モーダルに上書き注記・登録上限注記・リード文が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new AdminStockStockMoveResultCsvImportPage(page);
      await csv.goto();
      await csv.openModal();
      await expect(csv.modal).toContainText(OVERWRITE_NOTE);
      await expect(csv.modal).toContainText(FILE_LIMIT_NOTE);
      await expect(csv.modal).toContainText(MODAL_LEAD);
    });

    test("E2E-M04-29-005 フォーマット表に「移動指示ID」「送り状No.」が必須列として表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new AdminStockStockMoveResultCsvImportPage(page);
      await csv.goto();
      await csv.openModal();
      await expect(csv.modal).toContainText(FORMAT_TITLE);
      await expect(csv.formatTable).toContainText(HEAD_INSTRUCTION_ID);
      await expect(csv.formatTable).toContainText(HEAD_TRACKING_NO);
      // 必須列（移動指示ID・送り状No.）に必須バッジが2個表示されること。
      await expect(csv.requiredBadges).toHaveCount(2);
    });

    test("E2E-M04-29-003 登録ボタンはファイル未選択では非活性・選択で活性化する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new AdminStockStockMoveResultCsvImportPage(page);
      await csv.goto();
      await csv.openModal();
      // 仕様(送信可否制御): ファイル未選択では登録できない。
      await expect(csv.uploadButton).toBeDisabled();
      await csv.fileInput.setInputFiles({
        name: "result.csv",
        mimeType: "text/csv",
        buffer: Buffer.from(`${CSV_HEADER}\n`, "utf-8"),
      });
      await expect(csv.uploadButton).toBeEnabled(); // ファイル選択で活性化
      await expect(csv.fileNameLabel).toContainText("result.csv"); // 選択ファイル名表示
    });

    // ===== 取込（要管理ログイン・シード不要＝不存在ID/ヘッダのみで決定的に再現） =====

    test("E2E-M04-29-050 データ行0件（ヘッダのみ）→「有効な行がありません。」で一覧へ", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new AdminStockStockMoveResultCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("header_only.csv", `${CSV_HEADER}\n`);
      await expect(page).toHaveURL(LIST_RE); // 一覧へリダイレクト
      await expect(page).toHaveURL(RESUME_RE); // resume=1 付き（設計書 取込手順）
      await csv.seeFlash(MSG_NO_VALID_ROWS);
    });

    test("E2E-M04-29-060 存在しない移動指示ID行→「移動指示が見つかりません」で当該行失敗", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new AdminStockStockMoveResultCsvImportPage(page);
      await csv.goto();
      // 移動指示ID=999999（DB未存在）・送り状No.あり。判定順序: 指示不存在で失敗。
      await csv.uploadCsv("not_found.csv", `${CSV_HEADER}\n999999,,,TRK-0001\n`);
      await expect(page).toHaveURL(LIST_RE);
      await expect(page).toHaveURL(RESUME_RE); // resume=1 付き
      await csv.seeFlash(MSG_INSTRUCTION_NOT_FOUND);
    });

    test("E2E-M04-29-080 失敗行21件→「エラーは20件まで表示されます」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new AdminStockStockMoveResultCsvImportPage(page);
      await csv.goto();
      // 不存在ID行を21件＝表示上限20件超過。仕様: 21件目以降は省略し件数超過メッセージを表示。
      const rows = Array.from({ length: 21 }, (_, i) => `${900000 + i},,,TRK-${i}`).join("\n");
      await csv.uploadCsv("capped.csv", `${CSV_HEADER}\n${rows}\n`);
      await expect(page).toHaveURL(LIST_RE);
      await expect(page).toHaveURL(RESUME_RE); // resume=1 付き
      await csv.seeFlash(MSG_ERRORS_CAPPED);
    });

    test("E2E-M04-29-052 拡張子tsv（タブ区切り）ヘッダのみ→「有効な行がありません。」", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new AdminStockStockMoveResultCsvImportPage(page);
      await csv.goto();
      // 拡張子.tsv はタブ区切りとして解釈される（設計書 取込CSV仕様）。ヘッダのみ＝データ行0件。
      await csv.uploadCsv("header_only.tsv", `${TSV_HEADER}\n`, "text/tsv");
      await expect(page).toHaveURL(LIST_RE);
      await expect(page).toHaveURL(RESUME_RE);
      await csv.seeFlash(MSG_NO_VALID_ROWS);
    });

    test("E2E-M04-29-063 移動指示IDが非数値の行→数値チェックで取込されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new AdminStockStockMoveResultCsvImportPage(page);
      await csv.goto();
      // 移動指示ID=ABC（非数値）。仕様: 数値必須でこの行は取込されない（060の不存在ID照合とは別経路）。
      await csv.uploadCsv("non_numeric.csv", `${CSV_HEADER}\nABC,,,TRK-0001\n`);
      await expect(page).toHaveURL(LIST_RE);
      await expect(page).toHaveURL(RESUME_RE);
      // 取込されないため成功フラッシュは出ない（仕様: 数値必須でスキップ）。
      await expect(csv.flash.filter({ hasText: MSG_SUCCESS })).toHaveCount(0);
    });

    test("E2E-M04-29-065 失敗行のエラーは行番号付き（「n行目: 」形式）で表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new AdminStockStockMoveResultCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("row_number.csv", `${CSV_HEADER}\n999999,,,TRK-0001\n`);
      await expect(page).toHaveURL(LIST_RE);
      // 仕様: 失敗行は行番号付きメッセージで蓄積・表示される。
      await expect(csv.flash.filter({ hasText: ROW_NUMBER_RE })).toBeVisible();
    });

    test("E2E-M04-29-081 失敗行20件ちょうどでは上限超過メッセージが表示されない（境界）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new AdminStockStockMoveResultCsvImportPage(page);
      await csv.goto();
      // 不存在ID行を20件＝表示上限ちょうど。仕様: 超過していないため件数超過メッセージは出ない（080の境界正常側）。
      const rows = Array.from({ length: 20 }, (_, i) => `${900000 + i},,,TRK-${i}`).join("\n");
      await csv.uploadCsv("capped_boundary.csv", `${CSV_HEADER}\n${rows}\n`);
      await expect(page).toHaveURL(LIST_RE);
      await expect(csv.flash.filter({ hasText: MSG_ERRORS_CAPPED })).toHaveCount(0);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M04-29-020 正常CSV取込→「送り状No.を一括登録しました。」（要シード: 既知の在庫移動指示ID。破壊的: tracking_no 上書き）",
      async () => {
        // 期待は仕様(処理フロー#5 成功時 csv_tracking_success ＋ 指示/振替の tracking_no 更新)由来。
        // SEED-M04-29-INSTRUCTION（既知ID・出庫元/入庫先店舗名）整備後に実装。tracking_no 永続化は手動/間接確認。
        void MSG_SUCCESS;
      }
    );

    test.fixme(
      "E2E-M04-29-022 店舗名空欄の正常行→照合せず正常更新（要シード: 既知の在庫移動指示ID。061/062の正常対）",
      async () => {
        // 期待は仕様(onReadRow#2/#3 店舗名が空なら照合スキップ→正常更新→csv_tracking_success)由来。
        // SEED-M04-29-INSTRUCTION の既知IDに対し出庫元/入庫先店舗名を空欄にした正常行を与える。
        void MSG_SUCCESS;
      }
    );

    test.fixme(
      "E2E-M04-29-064 正常行＋失敗行の混在→正常行のみ反映し成功とエラー併存（要シード: 既知の在庫移動指示ID。020/060の部分成功対）",
      async () => {
        // 期待は仕様(不正行スキップで処理継続。成功>0で csv_tracking_success ＋ 失敗行は行番号付きエラー)由来。
        // 既知ID正常1行＋不存在ID失敗1行の混在CSVを与える。
        void MSG_SUCCESS;
        void MSG_INSTRUCTION_NOT_FOUND;
      }
    );

    test.fixme(
      "E2E-M04-29-031 不正アップロード（isValid不成立）→「ファイルが不正です。」（要実機: request直送）",
      async () => {
        // 期待は仕様(例外処理 csv_file が UploadedFile でない/isValid() false→csv_tracking_file_invalid)由来。
        // モーダルUIからは不正アップロードを再現しづらいため、CSRFトークン付きで request 直送して確認する（030の不正ファイル対）。
        void MSG_FILE_INVALID;
      }
    );

    test.fixme(
      "E2E-M04-29-061 出庫元店舗名不一致行→「出庫元店舗が一致しません」（要シード: 既知指示の出庫元店舗名）",
      async () => {
        // 期待は仕様(onReadRow#2 出庫元店舗不一致で失敗)由来。SEED-M04-29-INSTRUCTION の店舗名と不一致値を与える。
        void MSG_SHOP_MISMATCH_FROM;
      }
    );

    test.fixme(
      "E2E-M04-29-062 入庫先店舗名不一致行→「入庫先店舗が一致しません」（要シード: 既知指示の入庫先店舗名）",
      async () => {
        // 期待は仕様(onReadRow#3 入庫先店舗不一致で失敗)由来。
        void MSG_SHOP_MISMATCH_TO;
      }
    );

    test.fixme(
      "E2E-M04-29-070 送り状No.空欄行→「送り状Noが空欄です」（要シード: 既知の在庫移動指示ID）",
      async () => {
        // 期待は仕様(onReadRow#4 trim後空で失敗)由来。空送り状はまず行バリデーション(RequiredValidator)でスキップされ得るため
        // 実機で skipRow とエラー収集の表示挙動を確認のうえ実装（不具合候補#2）。SEED-M04-29-INSTRUCTION が前提。
        void MSG_TRACKING_EMPTY;
      }
    );

    test.fixme(
      "E2E-M04-29-030 ファイル未送信POST→「ファイルが不正です。」（要実機: モーダルは未選択で登録ボタン非活性。request直送が必要）",
      async () => {
        // 期待は仕様(取込手順#1 csv_file 不在/不正→csv_tracking_file_invalid)由来。
        // クライアントJSが送信を防ぐため、CSRFトークン付きの POST を request コンテキストで直送して確認する。
        void MSG_FILE_INVALID;
      }
    );

    test.fixme(
      "E2E-M04-29-040 ヘッダ不正CSV→「CSVのヘッダーが不正です。」（要実機: ヘッダ取得不能を決定的に再現する条件確認）",
      async () => {
        // 期待は仕様(取込手順#3 ヘッダ取得不可→RuntimeException csv_tracking_header_invalid)由来。
        // 列名相違は行スキップ扱いになり得るため、ヘッダ例外を確実に起こす入力（空ファイル等）を実機確認後に実装。
        void MSG_HEADER_INVALID;
      }
    );

    test.fixme(
      "E2E-M04-29-090 CSRFトークン不正POST→拒否（要実機: Symfony Form 内部完結。request直送でトークン欠落を検証）",
      async () => {
        // 期待は仕様(取込手順#1 isTokenValid)由来。CSRF はフレームワーク内部で完結し画面観測しづらいため request 直送で確認する。
      }
    );
  }
);
