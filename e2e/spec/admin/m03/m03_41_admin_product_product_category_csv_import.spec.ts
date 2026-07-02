/**
 * 管理画面 商品管理「カテゴリCSV登録」E2E（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m03_41_admin_product_product_category_csv_import_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」で非破壊なケースのみ実装し、DB副作用を伴う成功系/要シードは test.fixme（理由付き）で残す。
 * 手動・対象外はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-41_admin_product_product_category_csv_import.md / 設計書本文の行エラー文言 / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約(NotBlank/maxSize)は期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 取込CSVはテスト内で生成（setInputFiles バッファ）。異常系は addErrors→renderWithError 打ち切り＝ロールバックされ非破壊。
 * 成功系(010,011,012,013,014,015,050)は dtb_category を INSERT/UPDATE/DELETE する破壊的ケースのため fixme（ケース表 付帯表3 のシード/後始末で管理）。
 * 060(削除フラグ1・ID無し無処理行)は空コミットで成功メッセージのみ・行は変更されず非破壊のため実装する。
 * 006(CSRFトークン/multipart)・007(ファイル名ラベル更新)・008(import_file識別子/accept)・009(成功後フォーム空再表示)は非破壊で実装する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductCategoryCsvImportPage } from "../../../pages/admin/m03/m03_41_admin_product_product_category_csv_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様(messages.ja.yaml / 設計書本文に引用された打ち切りメッセージ)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const MSG_INVALID_FORMAT = "CSVのフォーマットが一致しません"; // :1561 admin.common.csv_invalid_format
const MSG_NO_DATA = "CSVデータが存在しません"; // :1562 admin.common.csv_invalid_no_data
const MSG_SUCCESS = "CSVファイルをアップロードしました"; // :1409 admin.common.csv_upload_complete
// 行単位の業務エラーは Controller にハードコードされた和文（設計書「◯行目〜」の確認値）。
const ROW_ID_NOT_NUMERIC = "1行目のカテゴリIDが存在しません。"; // CsvImportController.php:719
const ROW_ID_NOT_EXIST =
  "1行目の更新対象のカテゴリIDが存在しません。新規登録の場合は、カテゴリIDの値を空で登録してください。"; // :725
const ROW_NAME_EMPTY = "1行目のカテゴリ名が設定されていません。"; // :757
const ROW_PARENT_NOT_EXIST = "1行目の親カテゴリIDが存在しません。"; // :767,775,785（非数字・不存在・階層不整合で共通）

// 取込CSVのヘッダ（getCategoryCsvHeader の trans 値）。必須は「カテゴリ名」のみ。
const COL_ID = "カテゴリID";
const COL_NAME = "カテゴリ名";
const COL_PARENT = "親カテゴリID";
const COL_DEL = "カテゴリ削除フラグ";
const COL_LEVEL = "階層"; // 雛形に無い任意列。連想キーは固定文字列「階層」（正本md:140/146）

// 「存在しないカテゴリID」は環境DBで未使用が保証された値を用いる必要がある（要確認: 固定値 99999999 が
// 当該環境に存在しない保証はない＝SEED-M03-41-NONEXIST-ID で予約/未使用IDを確定する。付帯表3）。
const NONEXISTENT_ID = "99999999"; // 要確認: 環境シードで未使用が保証されること
const IMPORT_PATH = `/${ECCUBE_ADMIN_ROUTE}/product/category_csv_upload`;
const IMPORT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/category_csv_upload(\\?|$)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 商品管理 > カテゴリCSV登録",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M03-41-040 未ログインでカテゴリCSV登録URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(IMPORT_PATH);
      await expect(page.locator("#login_id")).toBeVisible(); // 管理ログイン画面へ誘導（権限・認可）
    });

    // ===== 画面表示（要管理ログイン・非破壊） =====

    test("E2E-M03-41-001 画面UI: ファイル選択・一括登録・雛形ダウンロードが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M03-41-ADMIN）");
      await login(page);
      const csv = new ProductProductCategoryCsvImportPage(page);
      await csv.goto();
      await csv.seeUploadForm();
    });

    test("E2E-M03-41-002 タイトル「カテゴリCSV登録」・サブタイトル「商品管理」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductCategoryCsvImportPage(page);
      await csv.goto();
      await expect(page.locator("body")).toContainText("カテゴリCSV登録"); // title block messages:1742
      await expect(page.locator("body")).toContainText("商品管理"); // sub_title messages:1723
    });

    test("E2E-M03-41-003 フォーマット表でカテゴリ名にのみ必須バッジが付く", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductCategoryCsvImportPage(page);
      await csv.goto();
      // 必須ヘッダは category_name の1列のみ（getCategoryCsvHeader）。フォーマット表内の「必須」バッジは1個。
      await expect(csv.formatTable.getByText(COL_NAME, { exact: true })).toBeVisible();
      await expect(csv.requiredBadges).toHaveCount(1);
    });

    test("E2E-M03-41-004 送信前の確認ダイアログが表示されず直接送信される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      let dialogShown = false;
      page.on("dialog", async (d) => {
        dialogShown = true;
        await d.dismiss();
      });
      const csv = new ProductProductCategoryCsvImportPage(page);
      await csv.goto();
      // 非破壊CSV（カテゴリ名空＝行エラーで打ち切り・ロールバック）を送信し、確認ダイアログが介在しないことを観測。
      await csv.uploadCsv("e2e_no_confirm.csv", `${COL_ID},${COL_NAME}\n,\n`);
      await expect(csv.errors).toContainText(ROW_NAME_EMPTY); // POSTが直接実行された証跡
      expect(dialogShown).toBe(false); // 確認ダイアログなし（仕様: モーダル・ポップアップなし）
    });

    test("E2E-M03-41-005 雛形ダウンロードボタンで category.csv の取得が発火する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductCategoryCsvImportPage(page);
      await csv.goto();
      const download = await csv.downloadTemplate();
      expect(download.suggestedFilename()).toBe("category.csv"); // ファイル名のみ（内容は手動確認）
    });

    test("E2E-M03-41-006 アップロードフォームにCSRFトークンが存在しmultipartでPOSTされる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductCategoryCsvImportPage(page);
      await csv.goto();
      // 仕様(正本md:34/172「CSRFを伴うマルチパートPOST」)由来。トークン値は照合しない（オラクル独立性）。
      await expect(csv.uploadForm).toHaveAttribute("enctype", "multipart/form-data");
      await expect(csv.csrfToken).toHaveCount(1); // hidden CSRFトークン項目が存在する
    });

    test("E2E-M03-41-007 ファイル選択後にファイル名ラベルが選択ファイル名へ更新される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductCategoryCsvImportPage(page);
      await csv.goto();
      // 仕様(正本md:44「選択後はファイル名ラベルを更新」)由来。送信しない＝非破壊。
      await csv.pickFileViaChooser("e2e_pick.csv", `${COL_NAME}\nE2Eカテゴリ\n`);
      await expect(csv.fileNameLabel).toHaveText("e2e_pick.csv");
    });

    test("E2E-M03-41-008 ファイル入力にimport_file識別子とaccept属性が設定される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductCategoryCsvImportPage(page);
      await csv.goto();
      // 仕様(正本md:123「入力の accept は text/csv,text/tsv・フォーム項目キー import_file」)由来。
      await expect(csv.fileInput).toHaveAttribute("id", /import_file/);
      await expect(csv.fileInput).toHaveAttribute("accept", "text/csv,text/tsv");
    });

    // ===== 取込バリデーション（要管理ログイン・打ち切り＝ロールバックで非破壊） =====

    test("E2E-M03-41-020 ファイル未選択で一括登録するとフォーム検証エラーで同画面に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductCategoryCsvImportPage(page);
      await csv.goto();
      await csv.submitWithoutFile(); // ファイル未選択のまま送信（import_file NotBlank）
      await expect(page).toHaveURL(IMPORT_RE); // 同画面に留まる（リダイレクトなし）
      await expect(page.locator("body")).not.toContainText(MSG_SUCCESS); // 取込は実行されない
      // 注: フォーム検証エラーの正確な表示セレクタ/文言は bootstrap_4_horizontal_layout 依存＝要実機確認（不具合候補#1）
    });

    test("E2E-M03-41-021 ヘッダ不一致のCSVで「CSVのフォーマットが一致しません」", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductCategoryCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_bad_header.csv", "col1,col2\nv1,v2\n");
      await expect(csv.errors).toContainText(MSG_INVALID_FORMAT);
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M03-41-022 必須ヘッダ（カテゴリ名）欠落のCSVで形式エラー", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductCategoryCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_missing_header.csv", `${COL_ID},${COL_PARENT}\n,1\n`);
      await expect(csv.errors).toContainText(MSG_INVALID_FORMAT);
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M03-41-023 ヘッダのみ（データ行0）で「CSVデータが存在しません」", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductCategoryCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_no_data.csv", `${COL_NAME}\n`);
      await expect(csv.errors).toContainText(MSG_NO_DATA);
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M03-41-030 カテゴリID非数字で「1行目のカテゴリIDが存在しません。」打ち切り", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductCategoryCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_id_nan.csv", `${COL_ID},${COL_NAME}\nabc,E2Eカテゴリ\n`);
      await expect(csv.errors).toContainText(ROW_ID_NOT_NUMERIC);
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M03-41-031 存在しないカテゴリIDで更新対象不存在エラー打ち切り", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductCategoryCsvImportPage(page);
      await csv.goto();
      // 未使用が保証されたID（非破壊：更新対象が無く打ち切り）。NONEXISTENT_ID は要シード確定（要確認）。
      await csv.uploadCsv("e2e_id_missing.csv", `${COL_ID},${COL_NAME}\n${NONEXISTENT_ID},E2Eカテゴリ\n`);
      await expect(csv.errors).toContainText(ROW_ID_NOT_EXIST);
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M03-41-033 カテゴリ名空で「1行目のカテゴリ名が設定されていません。」打ち切り", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductCategoryCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_name_empty.csv", `${COL_ID},${COL_NAME}\n,\n`);
      await expect(csv.errors).toContainText(ROW_NAME_EMPTY);
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M03-41-034 親カテゴリID非数字で「1行目の親カテゴリIDが存在しません。」打ち切り", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductCategoryCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_parent_nan.csv", `${COL_NAME},${COL_PARENT}\nE2Eカテゴリ,abc\n`);
      await expect(csv.errors).toContainText(ROW_PARENT_NOT_EXIST);
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M03-41-035 親カテゴリID不存在で「1行目の親カテゴリIDが存在しません。」打ち切り", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductCategoryCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_parent_missing.csv", `${COL_NAME},${COL_PARENT}\nE2Eカテゴリ,${NONEXISTENT_ID}\n`);
      await expect(csv.errors).toContainText(ROW_PARENT_NOT_EXIST);
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M03-41-038 雛形に無い「階層」列付き・親なし・階層≠1で「1行目の親カテゴリIDが存在しません。」打ち切り", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductCategoryCsvImportPage(page);
      await csv.goto();
      // 雛形に無い「階層」列を付けたCSVは読込許容され、親なしで階層が1以外のとき
      // 「親カテゴリIDが存在しません。」と同一文言で終了（正本md:75/146）。打ち切り＝ロールバックで非破壊。
      await csv.uploadCsv("e2e_level_col.csv", `${COL_NAME},${COL_LEVEL}\nE2Eカテゴリ,2\n`);
      await expect(csv.errors).toContainText(ROW_PARENT_NOT_EXIST);
      await expect(page).toHaveURL(IMPORT_RE);
    });

    // ===== 無処理行（非破壊・空コミットで成功メッセージ） =====

    test("E2E-M03-41-060 削除フラグ1かつID無しの行は無処理で成功メッセージが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductCategoryCsvImportPage(page);
      await csv.goto();
      // 削除フラグ1・ID列なし→削除ブロックで getId() null のため continue（無処理）。
      // 名前チェックに到達せず、ループ後 commit→成功フラッシュ。dtb_category は変更されない（非破壊）。
      await csv.uploadCsv("e2e_noop_delete.csv", `${COL_NAME},${COL_DEL}\n,1\n`);
      await expect(page.locator("body")).toContainText(MSG_SUCCESS); // 成功メッセージ（無処理でも commit）
    });

    test("E2E-M03-41-009 POST成功後にアップロードフォームが空で再表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductCategoryCsvImportPage(page);
      await csv.goto();
      // 無処理行(削除フラグ1・ID無し)の空コミット成功＝非破壊。成功後に同URLでフォームが空再表示されることを観測。
      await csv.uploadCsv("e2e_noop_for_reset.csv", `${COL_NAME},${COL_DEL}\n,1\n`);
      await expect(page.locator("body")).toContainText(MSG_SUCCESS);
      await expect(page).toHaveURL(IMPORT_RE); // リダイレクト無し（同一URL再描画）
      // 仕様(正本md:230「フォームは空の状態で再表示される」)由来。フォームが空で再提示される。
      await expect(csv.fileSelectButton).toBeVisible();
      await expect(csv.uploadButton).toBeVisible();
      await expect(csv.fileInput).toHaveValue(""); // 選択ファイルは保持されない（空フォーム）
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M03-41-010 カテゴリID空の有効CSV取込で成功メッセージ（要: 後始末＝接頭辞E2Eの dtb_category 削除。破壊的）",
      async () => {
        // 期待は仕様(処理フロー11 / messages.ja.yaml:1409「CSVファイルをアップロードしました」)由来。
        // dtb_category へ INSERT する破壊的ケース。SEED-M03-41-CSV-NEW の後始末を整備後に実装。
        void MSG_SUCCESS;
      }
    );

    test.fixme(
      "E2E-M03-41-011 既存カテゴリID指定の有効CSV取込で名称が更新される（要: SEED-M03-41-CATEGORY＋値復元。破壊的）",
      async () => {
        // 期待は仕様(業務ルール: 既存IDで更新・成功メッセージ)由来。既知IDの既存 dtb_category を用意し更新後に値を復元する。
      }
    );

    test.fixme(
      "E2E-M03-41-012 削除フラグ1かつ既存IDで対象カテゴリが削除される（要: SEED-M03-41-CATEGORY-DELETABLE。破壊的）",
      async () => {
        // 期待は仕様(処理フロー8 削除→continue・成功)由来。FK参照の無い使い捨てカテゴリを用意し削除する。
      }
    );

    test.fixme(
      "E2E-M03-41-013 既存親ID指定で子カテゴリ新規登録が成功（親ID相関エラー034/035の正常対。要: SEED-M03-41-CATEGORY＋後始末。破壊的）",
      async () => {
        // 期待は仕様(処理フロー8: 既存親IDで子カテゴリを新規登録・成功メッセージ)由来。
        // 親ID不存在(034/035)の異常系に対する正常系の対。既知の既存親ID(SEED-M03-41-CATEGORY)を親に指定し新規INSERT後に後始末する。
        void MSG_SUCCESS;
      }
    );

    test.fixme(
      "E2E-M03-41-050 列順を入れ替えた有効CSVでも取込成功（要: 後始末＝dtb_category 削除。破壊的）",
      async () => {
        // 期待は仕様(業務ルール: 列の並びは問わずヘッダ名一致でマップ)由来。列順逆でも成功することを確認する。
      }
    );

    test.fixme(
      "E2E-M03-41-032 カテゴリIDと親カテゴリID同一で「1行目のカテゴリIDと親カテゴリIDが同じです。」（要: 既存カテゴリID）",
      async () => {
        // 期待は仕様(処理フロー8 自己親子同一禁止 / Controller.php:731)由来。
        // 自己親子同一チェック(Controller.php:730)は ID で既存カテゴリが見つかった後に判定するため、既知の既存カテゴリID（SEED-M03-41-CATEGORY）が要る。打ち切り＝非破壊だが要シードのため fixme。
      }
    );

    test.fixme(
      "E2E-M03-41-036 算出階層が最大レベル超過で「最大レベルを超えているため設定できません。」（要: 深い親カテゴリ階層）",
      async () => {
        // 期待は仕様(処理フロー8 階層上限 eccube_category_nest_level / Controller.php:800)由来。
        // 階層上限到達には深い親カテゴリ階層が要る（SEED-M03-41-CATEGORY-DEEP）。打ち切り＝非破壊だが要シードのため fixme。
      }
    );

    test.fixme(
      "E2E-M03-41-037 削除でFK参照が残るカテゴリは「関連するデータがあるため…削除できませんでした」（要: FK参照付きカテゴリ。破壊的/要シード）",
      async () => {
        // 期待は仕様(エラー処理 削除時FK / messages.ja.yaml:1402 admin.common.delete_error_foreign_key)由来。
        // 子カテゴリor商品でFK参照を持つ既存カテゴリ（SEED-M03-41-CATEGORY-FK）が要る。
      }
    );

    test.fixme(
      "E2E-M03-41-014 削除フラグ0の有効CSVは削除分岐に入らず登録/更新へ進み成功（削除フラグ1削除012/FK037の正常対。要: 後始末＝dtb_category 削除。破壊的）",
      async () => {
        // 期待は仕様(業務ルール: category_del_flg はトリム後`1`のときのみ削除分岐・`0`/非`1`は登録/更新へ・正本md:134/71)由来。
        // 削除フラグ0・カテゴリ名ありで新規INSERTし成功メッセージ。SEED-M03-41-CSV-NEW の後始末を整備後に実装。
        void MSG_SUCCESS;
      }
    );

    test.fixme(
      "E2E-M03-41-015 雛形に無い「階層」列=1・親なしの有効CSVが正常取込（親なし階層≠1エラー038/上限超過036の正常対。要: 後始末＝dtb_category 削除。破壊的）",
      async () => {
        // 期待は仕様(オプション列「階層」=1・親なし既定階層1で登録・正本md:140/76)由来。
        // 明示階層1・親なしで新規INSERTし成功メッセージ。SEED-M03-41-CSV-NEW の後始末を整備後に実装。
        void MSG_SUCCESS;
      }
    );
  }
);
