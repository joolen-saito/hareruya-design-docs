/**
 * 管理画面 イベント管理「イベント申込一括CSV登録（CSVアップロード/取込）」E2E（M13-13）。
 * 納品ケース表 integration_test/e2e/m13_13_admin_event_event_entry_csv_import_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装する。取込成功時のDB登録内容・件数・原子性(ロールバック)・一時ファイル・
 * 件数ログ・CSV各列の値検証・文字コード正規化・スピナー表示・CSRFはケース表で全量管理する
 * （規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m13-13_admin_event_event_entry_csv_import.md / 観点表)由来（オラクル独立性）。
 * 設計源は pf-eccube3（HareruyaEcプラグイン）のリバースだが、基本設計/設計書を上位オラクルとし、
 * 刷新先 ec-cube-enterprise に当該画面の存在を確認済み:
 *   アップロード画面 admin_event_entry_bulk_csv_import = GET/POST /<route>/event/entry/bulk_csv_import（EventEntryBulkCsvController.php:59）/
 *   雛形DL admin_event_entry_bulk_csv_template = GET /<route>/event/entry/bulk_csv_template（同:156, ファイル名 event_entry.csv :172）。
 * 実装の現挙動・Form制約・行数上限の実装値(5010)・成功メッセージの実装文言は期待値に流用しない（付帯表4 不具合候補）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(030/031)は資格情報不要。取込成功(010)はマスタ整合シードが必要なため fixme。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { EventEventEntryCsvImportPage } from "../../../pages/admin/m13/m13_13_admin_event_event_entry_csv_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様(設計書 表示メッセージ節)由来の文言。実装文言に合わせて変えない（オラクル独立性）。
const ERR_HEADER = "CSVのフォーマットが一致しません。"; // 前提検証: ヘッダ形式エラー
const ERR_NO_DATA = "CSVデータが存在しません。"; // 前提検証: データ無し
const ERR_MAXROWS_PART = "行を超えるCSVファイルは登録できません"; // 行数上限超過（上限値は設計書5000・実装5010で乖離→部分一致）

const IMPORT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/event/entry/bulk_csv_import(\\?|$|/)`);
// 未認証ガードの誘導先は管理画面共通ログイン（/<route>/login）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$|/)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

// 5010行超のデータ行を持つCSV（行数上限超過の再現）。ヘッダ＋データを生成。
function csvWithRows(dataRows: number): string {
  const header = "イベント名（日）,イベント名（英）";
  const lines = [header];
  for (let i = 0; i < dataRows; i++) lines.push(`evt_${i},evt_${i}`);
  return lines.join("\n");
}

test.describe(
  "管理画面 イベント管理 > イベント申込一括CSV登録",
  { tag: ["@admin", "@event", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M13-13-030 未ログインでアップロード画面URL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new EventEventEntryCsvImportPage(page);
      await p.goto();
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可: 未ログインはアクセス不可
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M13-13-031 未ログインで雛形ダウンロードURL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new EventEventEntryCsvImportPage(page);
      await p.gotoTemplate();
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS 未設定（資格情報はコミットしない）");

      test.beforeEach(async ({ page }) => {
        await login(page);
      });

      // --- 画面表示（GET） ---

      test("E2E-M13-13-001 アップロード画面に見出し（イベント一括登録CSVアップロード）が表示される", async ({ page }) => {
        const p = new EventEventEntryCsvImportPage(page);
        await p.goto();
        await expect(page.locator("body")).toContainText("イベント一括登録CSVアップロード"); // 利用者視点の入口
      });

      test("E2E-M13-13-002 アップロード画面にファイル選択・一括登録ボタン・雛形DLリンク・フォーマット表が表示される", async ({ page }) => {
        const p = new EventEventEntryCsvImportPage(page);
        await p.goto();
        await p.seeUploadForm(); // フロント挙動: 表示要素
      });

      test("E2E-M13-13-003 フォーマット表に必須列の必須バッジが表示される", async ({ page }) => {
        const p = new EventEventEntryCsvImportPage(page);
        await p.goto();
        await expect(p.requiredBadge.first()).toBeVisible(); // 取込フォーマット: 必須列
      });

      test("E2E-M13-13-008 フォーマット表に各列（複数）の定義行が表示される", async ({ page }) => {
        const p = new EventEventEntryCsvImportPage(page);
        await p.goto();
        // 仕様(フロント挙動 表示要素): フォーマット説明テーブルは「ヘッダ名と各列の入力ルール」を表示する＝列定義は複数行。
        // 列の論理名・入力ルールの内容照合は実装文言依存のため手動(ケース表008)。ここでは複数行の存在のみを観測判定する。
        await expect(p.formatTable).toBeVisible();
        expect(await p.formatTableRowCount()).toBeGreaterThan(1);
      });

      test("E2E-M13-13-004 一括登録(送信)ボタンが初期状態では非活性である", async ({ page }) => {
        const p = new EventEventEntryCsvImportPage(page);
        await p.goto();
        // 仕様(フロント挙動/JS): ファイル未選択では送信できない。初期は送信不可。
        await expect(p.uploadButton).toBeDisabled();
      });

      test("E2E-M13-13-006 ファイル選択でファイル名が表示され一括登録ボタンが活性化する", async ({ page }) => {
        const p = new EventEventEntryCsvImportPage(page);
        await p.goto();
        await p.fileInput.setInputFiles({
          name: "event_entry.csv",
          mimeType: "text/csv",
          buffer: Buffer.from("イベント名（日）\nx", "utf-8"),
        });
        await expect(p.fileNameLabel).toHaveText("event_entry.csv"); // 選択ファイル名表示（JS）
        await expect(p.uploadButton).toBeEnabled(); // 送信可否制御（JS）
      });

      // --- 雛形ダウンロード（GET） ---

      test("E2E-M13-13-005 雛形ダウンロードリンク押下でCSVがダウンロードされる", async ({ page }) => {
        const p = new EventEventEntryCsvImportPage(page);
        await p.goto();
        const download = await p.clickTemplateDownload();
        // 仕様(雛形ダウンロード導線): 取込用CSVのひな型を出力する。ファイル名はCSV拡張子。
        expect(download.suggestedFilename()).toMatch(/\.csv$/);
        // 仕様(利用者視点の入口): 雛形は「ヘッダのみのひな型」=データ行を持たない。
        const body = await p.fetchTemplate();
        const lines = body.split(/\r?\n/).filter((l) => l.trim() !== "");
        expect(lines.length).toBe(1);
      });

      // --- アップロード異常系（前提検証・行数上限・取込エラー） ---

      test("E2E-M13-13-020 空CSVアップロードでヘッダ形式エラーが表示され画面に留まる", async ({ page }) => {
        const p = new EventEventEntryCsvImportPage(page);
        await p.goto();
        await p.upload("event_entry.csv", ""); // ヘッダ行が無い
        await expect(p.errorAlert).toContainText(ERR_HEADER); // 前提検証エラー
        await expect(page).toHaveURL(IMPORT_RE); // 取込せず同画面を再描画
      });

      test("E2E-M13-13-021 ヘッダのみ（データ行なし）CSVでデータ無しエラーが表示される", async ({ page }) => {
        const p = new EventEventEntryCsvImportPage(page);
        await p.goto();
        // 仕様: ヘッダはフォーマットエラーを避けるため雛形の見出しと一致させる必要がある。
        // 列名は雛形DLから動的取得し（位置情報）、データ行を付けずデータ無しエラー分岐に到達させる。
        const header = await p.fetchTemplateHeader();
        await p.upload("event_entry.csv", header); // ヘッダ一致・データ行なし
        await expect(p.errorAlert).toContainText(ERR_NO_DATA); // 前提検証エラー
        await expect(page).toHaveURL(IMPORT_RE);
      });

      test("E2E-M13-13-022 行数上限超過CSVで上限超過エラーが表示され画面に留まる", async ({ page }) => {
        const p = new EventEventEntryCsvImportPage(page);
        await p.goto();
        // 設計書: 5000行以上は登録不可。実装上限値(5010)に依存せず確実に超過する行数を投入する。
        await p.upload("event_entry.csv", csvWithRows(6000));
        await expect(p.errorAlert).toContainText(ERR_MAXROWS_PART); // 行数上限超過
        await expect(page).toHaveURL(IMPORT_RE);
      });

      test("E2E-M13-13-023 不正データ行を含むCSVで取込エラー一覧が表示され画面に留まる", async ({ page }) => {
        const p = new EventEventEntryCsvImportPage(page);
        await p.goto();
        // 仕様: ヘッダはフォーマットエラーを避けるため雛形の見出しと一致させ、取込(行検証)分岐に到達させる。
        // 必須列を空にした不正データ行を1行付与する。仕様(エラー処理): エラー一覧表示＋全件ロールバック。
        const header = await p.fetchTemplateHeader();
        const emptyRow = new Array(header.split(",").length).fill("").join(",");
        await p.upload("event_entry.csv", `${header}\n${emptyRow}`);
        await expect(p.errorAlert).toBeVisible(); // 行ごとの取込エラーを列挙
        await expect(page).toHaveURL(IMPORT_RE); // ロールバックし同画面を再描画
      });
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M13-13-010 正しいCSV取込成功で完了メッセージ表示＋アップロード画面へリダイレクト（要: 店舗/会場/フォーマット/ルール適用度/公開状態のマスタ整合シード）",
      async () => {
        // 期待は仕様(結果報告/表示メッセージ)由来。成功には全必須列＋名称一致するマスタが必要。
        // SEED-M13-13-MASTER を整備後に実装。成功フラッシュ表示と /event/entry/bulk_csv_import への 302 を確認する。
        // 注: 成功フラッシュの実装文言は設計書「イベント情報を登録しました。」と乖離（付帯表4 不具合候補#2）。
      }
    );

    test.fixme(
      "E2E-M13-13-024 ファイル未選択で送信→「ファイルを選択してください。」（要: 送信ボタンの初期非活性を回避する実機手順）",
      async () => {
        // 期待は仕様(バリデーション/フォーム検証エラー)由来。#upload-button はJSで初期 disabled のため、
        // UI操作のみでは空送信できない。実機での回避手順（disabled解除/直接POST）確認後に実装。
      }
    );

    test.fixme(
      "E2E-M13-13-025 サイズ上限超過ファイルでサイズ超過メッセージ（要: 設定上限を超える大容量CSV生成）",
      async () => {
        // 期待は仕様(バリデーション)由来。eccube_csv_size 設定値超過の大容量ファイル生成が必要。
      }
    );

    test.fixme(
      "E2E-M13-13-026 行数上限境界（設計5000=上限。5001行で上限超過）（要確認: 設計5000 vs 実装5010の境界乖離・要マスタ整合シード）",
      async () => {
        // 期待は仕様(取込フォーマット 行数上限「5000行以上は登録不可」)由来。
        // 5000行は登録可・5001行は上限超過エラー。テストは設計値で書き、実装上限(5010)との
        // 乖離は付帯表4#3で管理（5001で通れば不具合検出）。5000行成功側はマスタ整合シードが必要。
      }
    );

    test.fixme(
      "E2E-M13-13-027 TSV（タブ区切り）ファイル受理で取込される（要確認: 実装accept=text/csv,.csvのTSV受理可否・要マスタ整合シード）",
      async () => {
        // 期待は仕様(フロント挙動 受理タイプ text/csv,text/tsv／取込フォーマット 区切り: 拡張子tsvはタブ区切り)由来。
        // 設計はTSVを受理。刷新先 accept=text/csv,.csv（付帯表4#5）との乖離はテストで検出する（実装に寄せない）。
      }
    );
  }
);
