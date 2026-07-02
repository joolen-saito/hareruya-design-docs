/**
 * 管理画面 商品管理「商品公開CSV登録」E2E。
 * 納品ケース表 integration_test/e2e/m03_38_admin_product_product_status_csv_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装し、正常取込（valid CSV＝DB副作用あり）・履歴増加は test.fixme（理由付き）で残す。
 * 手動・対象外（DB値の検証・廃止商品スキップ・ログ出力等）はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-38_admin_product_product_status_csv.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 取込成功・履歴増加は「実在する商品ID＋正規マスタ」を要し、かつ dtb_product の公開列を更新する破壊的操作のため、
 * SEED-M03-38-PRODUCT と隔離環境を要件化し test.fixme とする。
 * 事前検証エラー（ファイル未選択・ヘッダのみ・ヘッダ名不備・列数不一致・列必須空・行数上限・公開ステータス/支店公開の選択肢不正・商品ID不存在）は
 * 不正CSVを in-test 生成でき、判定エラーで breakAll＝ロールバックされDB副作用が無いため自動化する。
 * 未ログインPOST取込・accept指定・許容外page_count非採用も観測可能なため自動化する。
 */
import { readFileSync } from "fs";
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductStatusCsvPage } from "../../../pages/admin/m03/m03_38_admin_product_product_status_csv.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const MSG_SUCCESS = "登録が完了しました。"; // :1773 admin.register.complete（本機能の成功フラッシュ）
const MSG_MAXRECORD = "行を超えるCSVファイルは登録できません。"; // :1429 admin.csv.error.upload.maxrecord（%maxRecord%=5010）

// 商品公開CSVの日本語ヘッダ行（getCsvHeader() のキー順）。事前検証を起こすための最小入力に使う（入力データ・期待値ではない）。
const HEADER_LINE = "商品ID,商品公開ステータス,支店の商品公開ステータス";
// 実在しない前提の商品ID（商品実在チェック#6を必ず落とすための入力）。
const NONEXISTENT_PRODUCT_ID = "99999999";

// POST /import は常に GET csv_upload へリダイレクトされる（処理フロー #9）。
const UPLOAD_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/status/csv_upload(\\?|$)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 商品管理 > 商品公開CSV登録",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== 権限・認可（資格情報不要・サイト到達のみ） =====

    test("E2E-M03-38-040 未ログインでアップロードURL直接→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/status/csv_upload`);
      await expect(page.locator("#login_id")).toBeVisible(); // 管理ログイン画面（admin/login.twig:26）
    });

    test("E2E-M03-38-041 未ログインで雛形ダウンロードURL直接→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/status/csv_template`);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M03-38-043 未ログインで取込POSTを直接送信すると管理ログインへ誘導される", async ({ page }) => {
      // 仕様（権限・認可: 認証済みのみ到達。利用者視点の入口 POST …/product/status/import）。
      // 未ログインの POST はセキュリティ層で管理ログインへリダイレクトされ、取込は実行されない。
      const res = await page.request.post(`/${ECCUBE_ADMIN_ROUTE}/product/status/import`, {
        multipart: {
          "admin_csv_import[import_file]": {
            name: "e2e_unauth.csv",
            mimeType: "text/csv",
            buffer: Buffer.from(`${HEADER_LINE}\n${NONEXISTENT_PRODUCT_ID},1,1\n`),
          },
        },
        failOnStatusCode: false,
      });
      // リダイレクト追従後の最終URLが管理ログイン画面であること（取込画面ではない）。
      expect(res.url()).toContain("login");
    });

    // ===== 以降は管理画面ログインを要する =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      // ----- 画面表示・UI部品 -----

      test("E2E-M03-38-001 アップロード画面が表示されサブタイトル「商品公開CSV登録」が出る", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        await expect(page).toHaveURL(UPLOAD_RE);
        await expect(page.locator("body")).toContainText("商品公開CSV登録"); // sub_title messages:1822
      });

      test("E2E-M03-38-012 サイドナビ 商品管理>商品CSV管理 に商品公開CSV登録への導線がある", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        // 仕様（入口: ナビ 商品管理→商品CSV管理→商品公開CSV登録 eccube_nav.yaml:40-72）。
        // 文言ではなく route 由来の href で導線リンクの存在を確認する（セレクタ創作を避ける）。
        // サイドナビは折り畳まれ得るため可視ではなく DOM 存在で判定する。
        await expect(p.navUploadLink.first()).toBeAttached();
      });

      test("E2E-M03-38-002 ファイル入力欄とCSVアップロードボタンが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        await p.seeUploadForm();
      });

      test("E2E-M03-38-013 ファイル入力欄がCSV/TSVを受け付けるaccept指定である", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        // 仕様（フロント挙動 表示要素: ファイル入力の accept は .csv, text/csv, .tsv, text/tsv）。設計書由来で値を期待化。
        const accept = (await p.fileInput.getAttribute("accept")) ?? "";
        expect(accept).toContain(".csv");
        expect(accept).toContain(".tsv");
      });

      test("E2E-M03-38-003 フォーマット説明表が見出し「項目名」「説明」で表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        await p.seeFormatTable();
      });

      test("E2E-M03-38-004 必須列に「必須」バッジが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        await expect(p.requiredBadge.first()).toBeVisible(); // 必須列バッジ base_csv_upload.twig:101
      });

      test("E2E-M03-38-005 雛形ダウンロードリンク「雛形ファイルダウンロード」が表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        await expect(p.downloadTemplateLink).toBeVisible();
        await expect(p.downloadTemplateLink).toContainText("雛形ファイルダウンロード"); // messages:1548
      });

      test("E2E-M03-38-006 取込履歴テーブル（ファイル名/アップロード日時/作業者）が表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        await p.seeHistoryTable();
      });

      test("E2E-M03-38-007 履歴の表示件数プルダウンが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        await expect(p.pageCountPulldown).toBeVisible(); // csv_import_history.twig:10
      });

      test("E2E-M03-38-008 送信前に確認ダイアログを介さず送信できる（type=submit・dialog無し）", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        // 仕様（フロント挙動: 送信前の確認ダイアログはない）。送信を実行し、その過程で dialog が出れば失敗させる。
        let dialogShown = false;
        page.on("dialog", async (d) => {
          dialogShown = true;
          await d.dismiss();
        });
        await expect(p.uploadButton).toHaveAttribute("type", "submit");
        // 実際に送信（ファイル未選択でも POST→常に csv_upload へ）し、確認ダイアログを挟まず遷移すること。
        await p.submitWithoutFile();
        await expect(page).toHaveURL(UPLOAD_RE);
        expect(dialogShown).toBe(false);
      });

      test("E2E-M03-38-009 ファイル選択でラベルにファイル名が表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        // JS（base_csv_upload.twig:25-27）: change で custom-file-label にファイル名を表示する。
        await p.selectFileBuffer("e2e_status_label.csv", HEADER_LINE + "\n");
        await expect(p.fileLabel).toContainText("e2e_status_label.csv");
      });

      test("E2E-M03-38-010 フォーマット説明に商品公開ステータスの凡例「2:非公開 1:公開」が表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        // 仕様（フロント挙動: 説明セルは getCsvHeader() の値を nl2br 表示 ProductStatusCsvController.php:183-184）。
        await expect(page.locator("body")).toContainText("2:非公開 1:公開");
        await expect(page.locator("body")).toContainText("0:非公開 1:公開");
      });

      // ----- 雛形ダウンロード（ファイル出力） -----

      test("E2E-M03-38-011 雛形ダウンロードで product_status_template.csv がダウンロードされる", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        const dl = await p.downloadTemplate();
        expect(dl.suggestedFilename()).toBe("product_status_template.csv"); // 仕様: ファイル名（処理フロー雛形DL #4）
        // 仕様（列仕様: 雛形ヘッダ1行は CSV列＝商品ID/商品公開ステータス/支店の商品公開ステータス）。
        // ダウンロード本文の先頭行が列仕様どおりであることを自動確認する（BOM有無の厳密判定は手動）。
        const path = await dl.path();
        const body = path ? readFileSync(path, "utf8") : "";
        const firstLine = body.replace(/^﻿/, "").split(/\r?\n/)[0]?.trim();
        expect(firstLine).toBe(HEADER_LINE); // 列順は設計書の列仕様由来
      });

      // ----- 取込エラー（不正CSV＝ロールバックされDB副作用なし・自動化） -----

      test("E2E-M03-38-030 ファイル未選択で送信するとエラーが表示され取込されない", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        await p.submitWithoutFile(); // 必須(NotBlank)/ファイル未選択
        // 仕様（バリデーション: ファイル必須。エラー処理: フォーム不正/null はフラッシュしリダイレクト）。
        await expect(p.errorAlert.first()).toBeVisible();
        await expect(p.successAlert).toHaveCount(0); // 成功フラッシュは出ない
        await expect(page).toHaveURL(UPLOAD_RE); // 常にアップロード画面（GET）へ戻る
      });

      test("E2E-M03-38-020 送信後は常にアップロード画面（GET）へリダイレクトされる", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        await p.submitWithoutFile(); // POST /import → 常にGET csv_upload へ（成功/失敗いずれも）
        await expect(page).toHaveURL(UPLOAD_RE);
        await expect(p.uploadButton).toBeVisible(); // GETアップロード画面が再描画される
      });

      test("E2E-M03-38-031 ヘッダのみ（データ行なし）CSVでエラーが表示され履歴が増えない", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        await p.uploadBuffer("e2e_header_only.csv", HEADER_LINE + "\n");
        // 仕様（判定順序#3: データ行が読めること。データ空エラーをインポータが返す）。
        await expect(p.errorAlert.first()).toBeVisible();
        await expect(p.successAlert).toHaveCount(0); // 成功・履歴INSERTは行わない
        await expect(page).toHaveURL(UPLOAD_RE);
      });

      test("E2E-M03-38-032 列数不一致（3列でない）データ行を含むCSVでエラーが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        // ヘッダは3列、データ行は2列＝列数不一致（判定順序#4: 列数3一致でなければ全体中断）。
        await p.uploadBuffer("e2e_col_mismatch.csv", HEADER_LINE + "\n1,1\n");
        await expect(p.errorAlert.first()).toBeVisible();
        await expect(p.successAlert).toHaveCount(0);
        await expect(page).toHaveURL(UPLOAD_RE);
      });

      test("E2E-M03-38-039 ヘッダ名が仕様と異なるCSVでエラーが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        // 仕様（判定順序#3: ヘッダ行が読めること。ヘッダ形式エラーをインポータが返す）。ヘッダ名を仕様外にする。
        await p.uploadBuffer("e2e_bad_header.csv", `col1,col2,col3\n${NONEXISTENT_PRODUCT_ID},1,1\n`);
        await expect(p.errorAlert.first()).toBeVisible();
        await expect(p.successAlert).toHaveCount(0);
        await expect(page).toHaveURL(UPLOAD_RE);
      });

      test("E2E-M03-38-042 データ行の必須列が空のCSVでエラーが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        // 仕様（判定順序#5: 各列の必須検証。列仕様: 商品公開ステータスは必須）。必須列を空にする。
        await p.uploadBuffer("e2e_col_required.csv", HEADER_LINE + `\n${NONEXISTENT_PRODUCT_ID},,1\n`);
        await expect(p.errorAlert.first()).toBeVisible();
        await expect(p.successAlert).toHaveCount(0);
        await expect(page).toHaveURL(UPLOAD_RE);
      });

      test("E2E-M03-38-033 行数上限（5010行以上）のCSVで上限超過メッセージが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        // ヘッダ＋5010データ行（改行カウントが ADMIN_CSV_IMPORT_MAX_ROWS=5010 以上）。値の正否でなく行数で拒否（判定順序#2）。
        const rows = Array.from({ length: 5010 }, () => "1,1,1").join("\n");
        await p.uploadBuffer("e2e_maxrecord.csv", HEADER_LINE + "\n" + rows + "\n");
        await expect(p.errorAlert).toContainText(MSG_MAXRECORD); // admin.csv.error.upload.maxrecord
        await expect(p.successAlert).toHaveCount(0);
        await expect(page).toHaveURL(UPLOAD_RE);
      });

      test("E2E-M03-38-038 行数上限の直前（境界内）のCSVでは上限超過メッセージが出ない", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        // 境界の正常側（判定順序#2: 5010行未満は行数チェックを通過する）。
        // 上限直前の行数では maxrecord メッセージが出ないこと（後続の実在/選択肢検証で別エラーにはなり得る）。
        const rows = Array.from({ length: 5000 }, () => `${NONEXISTENT_PRODUCT_ID},1,1`).join("\n");
        await p.uploadBuffer("e2e_under_maxrecord.csv", HEADER_LINE + "\n" + rows + "\n");
        await expect(p.errorAlert).not.toContainText(MSG_MAXRECORD); // 上限超過メッセージは出ない
        await expect(page).toHaveURL(UPLOAD_RE);
      });

      test("E2E-M03-38-034 商品公開ステータスが1/2以外の行でエラーが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        // 仕様（列仕様: 商品公開ステータスの許容は 1/2 のみ。選択肢検証#5で breakAll）。値9は不正。
        await p.uploadBuffer("e2e_status_choice.csv", HEADER_LINE + `\n${NONEXISTENT_PRODUCT_ID},9,1\n`);
        await expect(p.errorAlert.first()).toBeVisible();
        await expect(p.successAlert).toHaveCount(0);
        await expect(page).toHaveURL(UPLOAD_RE);
      });

      test("E2E-M03-38-035 支店の商品公開ステータスが0/1以外の行でエラーが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        // 仕様（列仕様: 支店公開の許容は 0/1 のみ。選択肢検証#5で breakAll）。値9は不正。
        await p.uploadBuffer("e2e_branch_choice.csv", HEADER_LINE + `\n${NONEXISTENT_PRODUCT_ID},1,9\n`);
        await expect(p.errorAlert.first()).toBeVisible();
        await expect(p.successAlert).toHaveCount(0);
        await expect(page).toHaveURL(UPLOAD_RE);
      });

      test("E2E-M03-38-036 実在しない商品IDの行でエラーが表示され取込されない", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        // 仕様（判定順序#6: 商品ID実在チェック。不存在なら breakAll しエラー結果。DB相関バリデーション）。
        await p.uploadBuffer("e2e_not_exists.csv", HEADER_LINE + `\n${NONEXISTENT_PRODUCT_ID},1,1\n`);
        await expect(p.errorAlert.first()).toBeVisible();
        await expect(p.successAlert).toHaveCount(0);
        await expect(page).toHaveURL(UPLOAD_RE);
      });

      test("E2E-M03-38-037 取込結果にエラーがあると成功フラッシュも履歴行も増えない", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        const before = await p.historyRows.count();
        await p.uploadBuffer("e2e_error_no_history.csv", HEADER_LINE + `\n${NONEXISTENT_PRODUCT_ID},1,1\n`);
        // 仕様（処理フロー#7/#8 エッジケース: エラーが1件でもあれば成功メッセージ・履歴INSERTを行わない）。
        await expect(p.successAlert).toHaveCount(0);
        await expect(p.errorAlert.first()).toBeVisible();
        await p.gotoUpload(); // 再表示して履歴件数を確認
        await expect(p.historyRows).toHaveCount(before); // 履歴は増えない
      });

      // ----- 履歴のページサイズ変更 -----

      test("E2E-M03-38-050 履歴表示件数を変更するとURLに page_count が反映される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        await p.gotoUpload();
        await p.changePageCount(50); // プルダウン変更で window.location.href 差し替え
        await expect(page).toHaveURL(/page_count=50/); // 許容リスト内の件数はクエリへ反映
      });

      test("E2E-M03-38-051 許容外の表示件数を指定しても採用されず既定件数になる", async ({ page }) => {
        await login(page);
        const p = new ProductProductStatusCsvPage(page);
        // 仕様（処理フロー 画面表示#3／セッション: page_count が許容リストに含まれる場合のみ保存。含まれなければ既定）。
        // 許容外の page_count=7 でアクセスしても、件数プルダウンには許容外の値が採用されない。
        await page.goto(`${p.uploadUrl}?page_count=7`);
        await expect(p.pageCountPulldown).toBeVisible();
        // 件数プルダウンの各オプション値は history_page_route のURL（page_count=許容値）。
        // 許容外(7)は選択肢に無く、選択中オプションのURLにも page_count=7 は現れない＝採用されない（既定が選択される）。
        const selectedUrl = await p.pageCountPulldown.inputValue();
        expect(selectedUrl).not.toContain("page_count=7");
        await expect(
          page.locator(`#page_count_pulldown option[value*="page_count=7&"], #page_count_pulldown option[value$="page_count=7"]`)
        ).toHaveCount(0);
      });
    });

    // ===== 保留（要シード・DB副作用・隔離環境。抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M03-38-021 正規CSVの取込成功で「登録が完了しました。」が表示される（要: SEED-M03-38-PRODUCT＋実在商品ID）",
      async () => {
        // 期待は仕様(処理フロー#8 成功フラッシュ admin.register.complete / messages.ja.yaml:1773)由来。
        // 実在する商品ID＋1/2・0/1の正規行を要し、dtb_product の公開列を更新する破壊的操作のため隔離環境＋SEED後に実装。
        // 実装時: body に MSG_SUCCESS を期待し、UPLOAD_RE へリダイレクト。
        void MSG_SUCCESS;
      }
    );

    test.fixme(
      "E2E-M03-38-022 取込成功時に取込履歴が1件増える（要: SEED-M03-38-PRODUCT＋実在商品ID）",
      async () => {
        // 期待は仕様(処理フロー#8: エラーが無いときだけ dtb_csv_import_history へ INSERT)由来。
        // 実装時: 取込前後で historyRows 件数差＝+1、先頭行にアップロードしたファイル名を期待。
      }
    );
  }
);
