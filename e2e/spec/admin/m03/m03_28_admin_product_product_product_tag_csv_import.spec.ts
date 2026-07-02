/**
 * 管理画面 商品管理「商品タグ更新CSV登録（アップロード）」E2E。
 * 納品ケース表 integration_test/e2e/m03_28_admin_product_product_product_tag_csv_import_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装し、シード/細工CSVが必要なものは test.fixme（理由付き）で残す。
 * 手動・対象外はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-28_admin_product_product_product_tag_csv_import.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約(NotBlank/File maxSize)は期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: 管理画面操作ケースは ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 *  未ログイン誘導(050)は資格情報不要のため skip しない。
 * 取込成功・商品/タグ不存在・行数超過・ファイルnullバイパス等はシードや細工が要るため test.fixme とし、
 *  ケース表のシード要件(付帯表3)で管理する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductProductTagCsvImportPage } from "../../../pages/admin/m03/m03_28_admin_product_product_product_tag_csv_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const MSG_INVALID_FORMAT = "CSVのフォーマットが一致しません"; // :1561 admin.common.csv_invalid_format（ファイルnull）
const MSG_FORMAT_HEADER = "CSVのフォーマットが一致しません。"; // :2209 admin.csv.error.format.header（ヘッダ不備）
const MSG_REGISTER_COMPLETE = "登録が完了しました。"; // :1773 admin.register.complete（取込成功）
const MSG_MAXRECORD = "行を超えるCSVファイルは登録できません。"; // :1429 admin.csv.error.upload.maxrecord（%maxRecord%=5010）

const UPLOAD_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/product_tag_csv_upload(\\?|$)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 商品管理 > 商品タグ更新CSV登録",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== アップロード画面の表示要素（UI部品） =====

    test("E2E-M03-28-001 アップロード画面にファイル入力欄とアップロードボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new ProductProductProductTagCsvImportPage(page);
      await p.gotoUpload();
      await p.seeUploadForm();
    });

    test("E2E-M03-28-002 フォーマット説明表に「商品ID」「タグID」行と必須バッジが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new ProductProductProductTagCsvImportPage(page);
      await p.gotoUpload();
      await expect(p.formatTitle).toBeVisible();
      await expect(page.locator("body")).toContainText("商品ID");
      await expect(page.locator("body")).toContainText("タグID");
      await expect(p.requiredBadge.first()).toBeVisible(); // csv_required_header_keys=商品ID/タグID
    });

    test("E2E-M03-28-003 雛形DLリンク押下で product_tag_template.csv がダウンロードされる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new ProductProductProductTagCsvImportPage(page);
      await p.gotoUpload();
      const dl = await p.downloadTemplate();
      // 仕様(処理フロー: ファイル名 product_tag_template.csv / Controller.php:56)由来。CSV内容（ヘッダ見出しのみ）は手動確認。
      expect(dl.suggestedFilename()).toBe("product_tag_template.csv");
    });

    test("E2E-M03-28-004 取込履歴カードにファイル名・アップロード日時・作業者の見出しが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new ProductProductProductTagCsvImportPage(page);
      await p.gotoUpload();
      await expect(p.historyTitle).toBeVisible();
      await expect(page.locator("body")).toContainText("ファイル名");
      await expect(page.locator("body")).toContainText("アップロード日時");
      await expect(page.locator("body")).toContainText("作業者");
    });

    test("E2E-M03-28-005 履歴件数プルダウンで件数を選ぶと page_count 付きURLへ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new ProductProductProductTagCsvImportPage(page);
      await p.gotoUpload();
      // プルダウンが描画される（履歴ありの場合のみ）こと自体が前提。存在時のみ遷移確認する。
      const cnt = await p.pageCountPulldown.count();
      test.skip(cnt === 0, "取込履歴が0件で件数プルダウンが描画されないためスキップ（要: 履歴データ）");
      await p.changePageCount(1);
      await expect(page).toHaveURL(/[?&]page_count=\d+/); // 許容リスト値がクエリに付与される
    });

    test("E2E-M03-28-006 送信前確認ダイアログはなくアップロードボタンは type=submit である", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new ProductProductProductTagCsvImportPage(page);
      await p.gotoUpload();
      // 仕様(フロント挙動: 送信前確認ダイアログはない)由来。即時送信される type=submit ボタンであること。
      await expect(p.uploadButton).toHaveAttribute("type", "submit");
    });

    // ===== 異常系（細工CSVのみで再現可・シード不要） =====

    test("E2E-M03-28-030 ヘッダ不備のCSVを取込むと「CSVのフォーマットが一致しません。」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new ProductProductProductTagCsvImportPage(page);
      await p.gotoUpload();
      // 期待は仕様(判定順序#3: ヘッダ不備→admin.csv.error.format.header)由来。見出しが「商品ID/タグID」と一致しないCSV。
      await p.uploadCsv({
        name: "bad_header.csv",
        buffer: Buffer.from("foo,bar\n1,2\n", "utf-8"),
      });
      await expect(page.locator("body")).toContainText(MSG_FORMAT_HEADER);
    });

    test("E2E-M03-28-031 取込送信後は常にアップロード画面へリダイレクトされる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new ProductProductProductTagCsvImportPage(page);
      await p.gotoUpload();
      // 期待は仕様(画面遷移: 送信完了(成功/失敗)→常に GET …/product_tag_csv_upload へリダイレクト)由来。
      await p.uploadCsv({
        name: "bad_header.csv",
        buffer: Buffer.from("foo,bar\n1,2\n", "utf-8"),
      });
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-28-032 ヘッダのみ（データ行なし）CSVは取込が確定せずアップロード画面へリダイレクトされる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new ProductProductProductTagCsvImportPage(page);
      await p.gotoUpload();
      // 期待は仕様(判定順序#3: ヘッダは読めるがデータ行が無い→データ空エラー)由来。
      // 具体エラー文言は未確定（付帯表4#6）。オラクル独立のため「成功フラッシュ非表示＋常時リダイレクト」で判定。
      await p.uploadCsv({
        name: "header_only.csv",
        buffer: Buffer.from("商品ID,タグID\n", "utf-8"),
      });
      await expect(page).toHaveURL(UPLOAD_RE);
      await expect(page.locator("body")).not.toContainText(MSG_REGISTER_COMPLETE);
    });

    test("E2E-M03-28-033 列数が2と一致しないCSVは取込が確定せずアップロード画面へリダイレクトされる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new ProductProductProductTagCsvImportPage(page);
      await p.gotoUpload();
      // 期待は仕様(判定順序#4: 各データ行の列数=2と一致しない→中断)由来。文言は固定しない（付帯表4#6）。
      await p.uploadCsv({
        name: "bad_columns.csv",
        buffer: Buffer.from("商品ID,タグID\n1,2,3\n", "utf-8"),
      });
      await expect(page).toHaveURL(UPLOAD_RE);
      await expect(page.locator("body")).not.toContainText(MSG_REGISTER_COMPLETE);
    });

    test("E2E-M03-28-025 タグID列が空白の行は必須違反で取込が確定しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new ProductProductProductTagCsvImportPage(page);
      await p.gotoUpload();
      // 期待は仕様(判定順序#5: タグID必須・列単体検証は商品ID実在チェックより前→breakAll)由来。
      // 商品ID実在に依存せず必須違反へ到達するため細工CSVのみで成立。文言は固定しない（付帯表4#6）。
      await p.uploadCsv({
        name: "tag_blank.csv",
        buffer: Buffer.from("商品ID,タグID\n1,\n", "utf-8"),
      });
      await expect(page).toHaveURL(UPLOAD_RE);
      await expect(page.locator("body")).not.toContainText(MSG_REGISTER_COMPLETE);
    });

    test("E2E-M03-28-026 商品ID列が非数値の行は数値検証エラーで取込が確定しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new ProductProductProductTagCsvImportPage(page);
      await p.gotoUpload();
      // 期待は仕様(判定順序#5: 商品IDの数値検証は実在チェックより前→breakAll)由来。文言は固定しない（付帯表4#6）。
      await p.uploadCsv({
        name: "pid_nonnumeric.csv",
        buffer: Buffer.from("商品ID,タグID\nabc,1\n", "utf-8"),
      });
      await expect(page).toHaveURL(UPLOAD_RE);
      await expect(page.locator("body")).not.toContainText(MSG_REGISTER_COMPLETE);
    });

    // ===== 権限・認可 =====

    test("E2E-M03-28-040 POST専用の取込ルートへGET直接アクセスすると許可されない(405)", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new ProductProductProductTagCsvImportPage(page);
      const res = await page.goto(p.importPath); // GET（ルートは methods=['POST']）
      expect(res?.status()).toBe(405); // Method Not Allowed
    });

    test("E2E-M03-28-050 未ログインでアップロード画面URLへアクセスすると管理ログイン画面へ誘導される", async ({ page }) => {
      // 資格情報不要（未認証ガードの検証）。
      const p = new ProductProductProductTagCsvImportPage(page);
      await p.gotoUpload();
      // 仕様(権限・認可: 管理共通認証通過が前提→未認証はログイン画面へ誘導)由来。
      // URL が管理ログイン画面へ遷移したこと＋ログインIDフィールド表示の両方で誤検知を排除する。
      await expect(page).toHaveURL(new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$|/)`));
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 保留（シード/細工が必要・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M03-28-010 有効なCSV取込で成功フラッシュ「登録が完了しました。」が表示される（要: SEED-M03-28-PRODUCT-TAG）",
      async () => {
        // 期待は仕様(処理フロー#8: admin.register.complete / messages.ja.yaml:1773)由来。
        // 実在する商品ID・タグIDを含むCSVのため、安定シード(商品＋タグ)後に実装。
        void MSG_REGISTER_COMPLETE;
      }
    );

    test.fixme(
      "E2E-M03-28-011 取込成功後に履歴一覧へ当該ファイル名の行が追加表示される（要: SEED-M03-28-PRODUCT-TAG）",
      async () => {
        // 期待は仕様(処理フロー#8: dtb_csv_import_history へINSERT＋種別=商品タグ取込のみ表示 / データ整合性)由来。
        // DB値そのものは観測外だが、履歴一覧へのファイル名行表示で間接確認する。
      }
    );

    test.fixme(
      "E2E-M03-28-020 ファイル未選択で取込送信すると「CSVのフォーマットが一致しません」が表示される（要: HTML5 required バイパス）",
      async () => {
        // 期待は仕様(処理フロー#3: import_file=null→admin.common.csv_invalid_format / messages.ja.yaml:1561)由来。
        // FileType required＋HTML5でブラウザ送信が阻止されるため、空送信を成立させる手順を実機確認後に実装。
        void MSG_INVALID_FORMAT;
      }
    );

    test.fixme(
      "E2E-M03-28-021 行数が5010以上のCSVは「…行を超えるCSVファイルは登録できません。」が表示される（要: 大容量CSV生成）",
      async () => {
        // 期待は仕様(判定順序#2: ADMIN_CSV_IMPORT_MAX_ROWS=5010以上→admin.csv.error.upload.maxrecord / messages.ja.yaml:1429)由来。
        // 5010行超のCSVを生成して送信する（送信前チェック）。実行コスト配慮のため実機確認後に実装。
        void MSG_MAXRECORD;
      }
    );

    test.fixme(
      "E2E-M03-28-024 アップロードサイズ上限を超えるファイルはサイズ超過エラーで取込されない（要: 大容量ファイル生成）",
      async () => {
        // 期待は仕様(判定順序#1: File maxSize=eccube_csv_size 超過→フラッシュのみ・DB未到達)由来。
        // 上限超ファイル生成（配布既定5M超）が要・上限値は設定/実機依存のため期待文言に数値を固定しない（付帯表4#7）。
      }
    );

    test.fixme(
      "E2E-M03-28-022 存在しない商品IDを含むCSVは商品不存在エラーがフラッシュ表示される（要: SEED＋細工CSV）",
      async () => {
        // 期待は仕様(判定順序#6: 商品ID実在チェック失敗→breakAll＋エラーフラッシュ admin.csv.error.product.not_exists 系)由来。
        // 正しいヘッダ＋存在しない商品IDのCSV。タグID実在を満たすシード後に実装。
      }
    );

    test.fixme(
      "E2E-M03-28-023 存在しないタグIDを含むCSVはタグ不存在エラーがフラッシュ表示される（要: SEED＋細工CSV）",
      async () => {
        // 期待は仕様(判定順序#5: タグID実在チェック失敗→breakAll＋エラーフラッシュ)由来。
        // 正しいヘッダ＋実在商品ID＋存在しないタグIDのCSV。商品実在を満たすシード後に実装。
      }
    );
  }
);
