/**
 * 管理画面 商品管理 棚番号登録/編集 E2E。
 * 納品ケース表 integration_test/e2e/m03_21_admin_product_product_shelf_number_register_edit_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装し、破壊的INSERT/UPDATE・削除（確認ダイアログ依存）・要シード・要大規模CSVは
 * test.fixme（理由付き）で残す。手動/間接・対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約準拠）。
 * 期待結果は仕様(設計書 functions/pf-eccube3/m03-21_admin_product_product_shelf_number_register_edit.md / 観点表 /
 * messages.ja.yaml)由来（オラクル独立性）。設計源は pf-eccube3 のリバースであり、刷新先 ec-cube-enterprise との
 * 乖離は付帯表4（不具合候補）に分離する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 *
 * 棚番号の名称は仕様で正規表現 ^[A-Z][-][0-9]{3}$（大文字1＋ハイフン＋数字3桁。例 A-001）に固定され、名称空間が
 * 26×1000=26000 と限定的かつ一意制約のため、登録成功は任意のタイムスタンプ名を使えない。破壊的INSERTを伴う登録成功・
 * 一意制約違反は使い捨て名/既存名のシードを環境変数で受け渡す。
 *
 * シード（環境変数。コミットしない）:
 *  - SHELF_ID        : SEED-M03-21-ROW（編集表示用の既存棚番号ID。非破壊・参照のみ）
 *  - SHELF_NEW_NAME  : SEED-M03-21-NEW（未登録の形式妥当名 例 Z-999。登録成功でINSERT＝使い捨て・後始末対象）
 *  - SHELF_DUP_NAME  : SEED-M03-21-DUP（既に存在する形式妥当名。一意制約違反の確認用・INSERTは失敗するため非破壊）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductShelfNumberRegisterEditPage } from "../../../pages/admin/m03/m03_21_admin_product_product_shelf_number_register_edit.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const SHELF_ID = process.env.SHELF_ID || "";
const HAS_SHELF = HAS_CREDS && !!SHELF_ID;
const SHELF_NEW_NAME = process.env.SHELF_NEW_NAME || "";
const HAS_NEW = HAS_CREDS && !!SHELF_NEW_NAME;
const SHELF_DUP_NAME = process.env.SHELF_DUP_NAME || "";
const HAS_DUP = HAS_CREDS && !!SHELF_DUP_NAME;

const HOME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/?(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;
// 一覧ルート（新規モード /product/shelf_number、編集 /product/shelf_number/{id}、成功時の ?id= 付与）。
// /store・/master_csv_upload・/csv 等のサブパスには一致させない（緩いマッチによる誤検知防止）。
const INDEX_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/shelf_number(/\\d+)?/?(\\?|$)`);
const STORE_RE = /\/product\/shelf_number\/store(\/\d+)?(\?|$)/;
// CSV取込画面（master_csv_upload）と後方互換URL（/csv）は別ルート。設計上どちらも同一画面を「表示」し
// /csv はリダイレクトしないため、遷移先URLは厳密に区別して検証する（設計書 入口 :46,:48）。
const CSV_UPLOAD_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/product/shelf_number/master_csv_upload(\\?|$)`
);
const CSV_COMPAT_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/product/shelf_number/csv(\\?|$)`
);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const SUCCESS_FLASH = "登録が完了しました。"; // :1773 admin.register.complete
const FAILED_FLASH = "登録できませんでした。"; // :1774 admin.register.failed
const NON_UNIQUE_FLASH = "値が重複しています。"; // :1777 admin.error.non_unique
const NAME_REGEX_ERROR =
  "※名称は大文字アルファベットと-(ハイフン)と3桁の数値の形式のみ登録可能です。"; // ShelfNumberType.php:42

/** 管理ログインしてホームへ到達する。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).toHaveURL(HOME_RE);
}

test.describe(
  "管理画面 > 商品管理 棚番号登録/編集",
  { tag: ["@admin", "@product"] },
  () => {
    // ===== 未認証（資格情報不要・非破壊） =====

    test("E2E-M03-21-060 未ログインで棚番号画面URL直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      // 期待は仕様(権限・認可: 未到達主体は管理画面共通認証で拒否／IT-13 URL直接アクセス・IT-15 未認証)由来。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/shelf_number`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 表示・遷移（HAS_CREDS） =====

    test("E2E-M03-21-001 新規画面: 名称/並び順/登録ボタンと下部一覧が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductShelfNumberRegisterEditPage(page);
      await target.gotoIndex();
      await expect(page).toHaveURL(INDEX_RE);
      await target.seeRegisterForm();
    });

    test("E2E-M03-21-002 新規時: カード見出しが「新規追加」", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductShelfNumberRegisterEditPage(page);
      await target.gotoIndex();
      // 仕様: 新規は admin.common.registration__add=「新規追加」（編集は「編集」）。
      await expect(target.cardTitle).toContainText("新規追加");
    });

    test("E2E-M03-21-003 タイトル「商品管理」・サブタイトル「棚番号登録/編集」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductShelfNumberRegisterEditPage(page);
      await target.gotoIndex();
      // 仕様(フロント挙動 表示要素): title=admin.product.product_management、sub_title=admin.product.shelf_number_management。
      await expect(page.locator("body")).toContainText("商品管理");
      await expect(page.locator("body")).toContainText("棚番号登録/編集");
    });

    test("E2E-M03-21-004 一覧ヘッダ(ID/名称/並び順)・編集/削除導線・表示件数セレクトが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductShelfNumberRegisterEditPage(page);
      await target.gotoIndex();
      await expect(target.listTable).toBeVisible();
      await expect(target.listTable).toContainText("ID");
      await expect(target.listTable).toContainText("名称");
      await expect(target.listTable).toContainText("並び順");
      await expect(target.pageCountSelect).toBeVisible();
      // 仕様(表示要素: 一覧行は編集・削除導線を持つ)。SEED-M03-ADMIN は一覧に1件以上を保証するが、
      // 0件環境でも落とさないよう行が在る場合のみ導線を検証する。
      const rowCount = await target.listRows.count();
      test.skip(rowCount < 1, "一覧が0件（編集/削除導線の検証には1件以上が必要）");
      await expect(target.editLinks.first()).toBeVisible();
      await expect(target.deleteLinks.first()).toBeVisible();
    });

    test("E2E-M03-21-005 「CSV出力」「CSV入力」リンクが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductShelfNumberRegisterEditPage(page);
      await target.gotoIndex();
      await expect(target.csvExportLink).toBeVisible();
      await expect(target.csvImportLink).toBeVisible();
    });

    test("E2E-M03-21-061 存在しないidの編集URLはHTTP404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      // 仕様(エラー処理: 存在しない編集id→404)。極端に大きいidで不存在を狙う。
      const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/shelf_number/999999999`);
      expect(res?.status()).toBe(404);
    });

    test("E2E-M03-21-050 表示件数プルダウン変更でURLにpage_countが付き再読込される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductShelfNumberRegisterEditPage(page);
      await target.gotoIndex();
      await target.changePageCount("50"); // 許容リスト[10,50,100,300,500,1000,2000,10000,12000]
      await expect(page).toHaveURL(/[?&]page_count=50(\&|$)/);
    });

    test("E2E-M03-21-052 一覧が並び順(sort_no)昇順で表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductShelfNumberRegisterEditPage(page);
      await target.gotoIndex();
      // 仕様(集計条件/業務ルール: 一覧は sort_no 昇順)。並び順列(3列目)が昇順であることを観測する。
      const count = await target.listRows.count();
      test.skip(count < 2, "一覧の行数が2未満（順序検証には2行以上が必要）");
      const sortNos: number[] = [];
      for (let i = 0; i < count; i++) {
        const cell = target.listRows.nth(i).locator("td").nth(2);
        sortNos.push(parseInt((await cell.innerText()).trim(), 10));
      }
      const sorted = [...sortNos].sort((a, b) => a - b);
      expect(sortNos).toEqual(sorted);
    });

    test("E2E-M03-21-053 表示件数セレクトの選択肢が仕様の9値(10/50/100/300/500/1000/2000/10000/12000)である", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductShelfNumberRegisterEditPage(page);
      await target.gotoIndex();
      // 仕様(利用者視点の入口: 表示件数の選択肢は 10,50,100,300,500,1000,2000,10000,12000 のみ)。
      const values = await target.pageCountSelect.locator("option").evaluateAll((els) =>
        els.map((e) => (e as HTMLOptionElement).value)
      );
      expect(values).toEqual([
        "10",
        "50",
        "100",
        "300",
        "500",
        "1000",
        "2000",
        "10000",
        "12000",
      ]);
    });

    // ===== CSV 導線（HAS_CREDS） =====

    test("E2E-M03-21-040 「CSV出力」押下でCSVダウンロードが開始される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductShelfNumberRegisterEditPage(page);
      await target.gotoIndex();
      // 仕様(CSVエクスポート: 全件をストリーム出力・ファイル名 shelf_number_YYYYMMDDHHmmss.csv)。
      // 出力内容(CSVの中身)は手動確認とし、ダウンロード発火とファイル名形式のみ観測する。
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        target.csvExportLink.click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/^shelf_number_\d{14}\.csv$/);
    });

    test("E2E-M03-21-041 「CSV入力」押下でマスタCSVアップロード画面へ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductShelfNumberRegisterEditPage(page);
      await target.gotoIndex();
      await target.csvImportLink.click();
      await expect(page).toHaveURL(CSV_UPLOAD_RE);
    });

    test("E2E-M03-21-042 後方互換URL(/product/shelf_number/csv)でも取込画面が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductShelfNumberRegisterEditPage(page);
      // 仕様(利用者視点の入口: /csv は master_csv_upload と同一画面・後方互換用。リダイレクトせず /csv のまま表示)。
      await page.goto(target.csvCompatUrl);
      await expect(page).toHaveURL(CSV_COMPAT_RE);
    });

    test("E2E-M03-21-044 マスタCSVヘッダー雛形(master_csv_template)のダウンロードが発火する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      // 仕様(利用者視点の入口: 雛形DL admin_product_shelf_number_master_csv_template)。
      // 画面導線(shelf_number.twig)の露出は要実機確認のため、ルートを直接GETしDL発火を観測する。内容(ヘッダのみ)は手動確認。
      const templateUrl = `/${ECCUBE_ADMIN_ROUTE}/product/shelf_number/master_csv_template`;
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        // 添付応答へのナビゲーションは ERR_ABORTED になり得るため握りつぶす（download イベントで判定）。
        page.goto(templateUrl).catch(() => undefined),
      ]);
      expect(download.suggestedFilename()).toMatch(/\.csv$/);
    });

    // ===== 登録 異常系（バリデーション失敗→失敗フラッシュ・同テンプレート再描画＝非破壊） =====

    test("E2E-M03-21-020 名称未入力で登録→失敗フラッシュが表示され同画面が再描画される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductShelfNumberRegisterEditPage(page);
      await target.gotoIndex();
      // 仕様(バリデーション: 名称 必須／判定順序#1 失敗→admin.register.failed＋同テンプレート200再描画)。
      await target.submitForm({ name: "", sortNo: "100" });
      await expect(target.errorFlash).toContainText(FAILED_FLASH);
      await expect(page).toHaveURL(STORE_RE); // リダイレクトせず store で再描画
    });

    test("E2E-M03-21-021 形式不正な名称で登録→名称の形式エラーメッセージが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductShelfNumberRegisterEditPage(page);
      await target.gotoIndex();
      // 仕様(業務ルール 名称形式 ^[A-Z][-][0-9]{3}$／バリデーション: Regexメッセージはフォーム種別にハードコード)。
      await target.submitForm({ name: "abc", sortNo: "100" });
      await expect(page.locator("body")).toContainText(NAME_REGEX_ERROR);
      await expect(target.errorFlash).toContainText(FAILED_FLASH);
    });

    test("E2E-M03-21-022 並び順未入力で登録→失敗フラッシュが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductShelfNumberRegisterEditPage(page);
      await target.gotoIndex();
      // 仕様(バリデーション: 並び順 必須)。形式妥当な名称＋並び順空。
      await target.submitForm({ name: "A-001", sortNo: "" });
      await expect(target.errorFlash).toContainText(FAILED_FLASH);
      await expect(page).toHaveURL(STORE_RE);
    });

    test("E2E-M03-21-023 編集モード(/store/{id})でも名称未入力で登録→失敗フラッシュ・store再描画（非破壊）", async ({
      page,
    }) => {
      test.skip(!HAS_SHELF, "SEED-M03-21-ROW 未設定（SHELF_ID）");
      await loginToHome(page);
      const target = new ProductProductShelfNumberRegisterEditPage(page);
      await target.gotoEdit(SHELF_ID);
      // 仕様(登録更新#2-3/判定順序#1: 編集 /store/{id} でも検証失敗→admin.register.failed＋同テンプレート再描画。
      // 検証失敗のため persist されず更新は確定しない＝非破壊)。
      await target.submitForm({ name: "", sortNo: "100" });
      await expect(target.errorFlash).toContainText(FAILED_FLASH);
      await expect(page).toHaveURL(STORE_RE); // /store/{id} で再描画（一覧へリダイレクトしない）
    });

    // ===== 登録 正常系／一意制約（要シード名） =====

    test("E2E-M03-21-010 正常系: 形式妥当な未登録名称＋並び順で登録→成功フラッシュ表示", async ({
      page,
    }) => {
      test.skip(!HAS_NEW, "SEED-M03-21-NEW 未設定（SHELF_NEW_NAME・使い捨て形式妥当名）");
      await loginToHome(page);
      const target = new ProductProductShelfNumberRegisterEditPage(page);
      await target.gotoIndex();
      // 仕様(判定順序#3: 検証成功でpersist/flush→admin.register.complete／画面遷移: 一覧へリダイレクト)。
      await target.submitForm({ name: SHELF_NEW_NAME, sortNo: "999" });
      await expect(target.successFlash).toContainText(SUCCESS_FLASH);
      await expect(page).toHaveURL(INDEX_RE); // admin_product_shelf_number(?id=) へ
    });

    test("E2E-M03-21-024 既存名称と同一名称で登録→一意制約違反メッセージで一覧へリダイレクト", async ({
      page,
    }) => {
      test.skip(!HAS_DUP, "SEED-M03-21-DUP 未設定（SHELF_DUP_NAME・既存の形式妥当名）");
      await loginToHome(page);
      const target = new ProductProductShelfNumberRegisterEditPage(page);
      await target.gotoIndex();
      // 仕様(判定順序#2: flush時の一意制約違反→admin.error.non_unique＋admin_product_shelf_number へリダイレクト)。
      await target.submitForm({ name: SHELF_DUP_NAME, sortNo: "998" });
      await expect(target.errorFlash).toContainText(NON_UNIQUE_FLASH);
      await expect(page).toHaveURL(INDEX_RE);
    });

    // ===== 削除導線（属性確認は非破壊） =====

    test("E2E-M03-21-030 一覧の削除リンクが data-method=delete と確認メッセージ属性を持つ", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductShelfNumberRegisterEditPage(page);
      await target.gotoIndex();
      const count = await target.deleteLinks.count();
      test.skip(count < 1, "一覧に削除リンクが無い（棚番号レコードが0件）");
      // 仕様(モーダル・ポップアップ: 削除アンカーは data-method=delete と確認メッセージ属性を持ち共通確認後にDELETE)。
      const first = target.deleteLinks.first();
      await expect(first).toHaveAttribute("data-method", "delete");
      await expect(first).toHaveAttribute("data-message", /.+/);
    });

    // ===== 編集表示（HAS_SHELF: 参照用シード行・非破壊） =====

    test("E2E-M03-21-006 編集画面: カード見出し「編集」と「新規登録へ戻る」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_SHELF, "SEED-M03-21-ROW 未設定（SHELF_ID）");
      await loginToHome(page);
      const target = new ProductProductShelfNumberRegisterEditPage(page);
      await target.gotoEdit(SHELF_ID);
      // 仕様(フロント挙動: 編集時はカード見出し「編集」、上部に「新規登録へ戻る」)。
      await expect(target.cardTitle).toContainText("編集");
      await expect(target.backToNewLink).toBeVisible();
    });

    test("E2E-M03-21-007 編集画面: 上部フォームが当該行の名称・並び順を反映する", async ({ page }) => {
      test.skip(!HAS_SHELF, "SEED-M03-21-ROW 未設定（SHELF_ID）");
      await loginToHome(page);
      const target = new ProductProductShelfNumberRegisterEditPage(page);
      await target.gotoEdit(SHELF_ID);
      // 仕様(処理フロー 表示: 解決された行をフォームに載せる)。具体値はシード依存のため固定せず、
      // 上部フォームの名称が下部一覧にも存在する＝当該行をバインドしていることを相互照合する。
      const nameVal = await target.nameInput.inputValue();
      const sortNoVal = await target.sortNoInput.inputValue();
      expect(nameVal).not.toBe("");
      expect(sortNoVal).not.toBe("");
      await expect(target.listTable).toContainText(nameVal);
    });

    test("E2E-M03-21-008 編集画面で「新規登録へ戻る」→新規モード(一覧トップ)へ戻る", async ({
      page,
    }) => {
      test.skip(!HAS_SHELF, "SEED-M03-21-ROW 未設定（SHELF_ID）");
      await loginToHome(page);
      const target = new ProductProductShelfNumberRegisterEditPage(page);
      await target.gotoEdit(SHELF_ID);
      await target.backToNewLink.click();
      // 仕様(利用者視点の入口/画面遷移: 「新規登録へ戻る」→GET admin_product_shelf_number 新規モード・保存しない)。
      await expect(page).toHaveURL(INDEX_RE);
      await expect(target.cardTitle).toContainText("新規追加");
    });

    // ===== 保留（破壊的/要シード/要実機・確認ダイアログ。手動・対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M03-21-011 登録成功後は一覧(admin_product_shelf_number)へ遷移（破壊的INSERT・使い捨て名SHELF_NEW_NAME共有のため010に集約）",
      async () => {
        // 期待は仕様(画面遷移: POST検証成功→GET admin_product_shelf_number、生成URLに保存後id付与)由来。
        // 010と同一の使い捨て名INSERTを再実行すると一意制約衝突するため、別の使い捨て名シード確立後に実装。
      }
    );

    test.fixme(
      "E2E-M03-21-012 登録後に一覧へ登録名称が表示される（間接DB確認・破壊的INSERT・要使い捨て名）",
      async () => {
        // 期待は仕様(DB操作: persist/flushで即時反映＝一覧に反映)由来。010の使い捨て名と衝突しない名・後始末確立後に実装。
      }
    );

    test.fixme(
      "E2E-M03-21-013 編集更新成功で成功フラッシュ表示（破壊的UPDATE・要使い捨てシード行）",
      async () => {
        // 期待は仕様(判定順序#3: 検証成功でpersist/flush・admin.register.complete)由来。既存行を書き換えるため使い捨てシード前提。
      }
    );

    test.fixme(
      "E2E-M03-21-014 編集更新後に変更値が一覧/再編集フォームに反映される（間接DB確認・破壊的UPDATE・要使い捨てシード行）",
      async () => {
        // 期待は仕様(DB操作: 更新 persist/flush 即時反映＝変更値が一覧/再編集に反映 設計書 :200)由来。
        // 既存行を書き換えるため使い捨てシード行確立後に実装（013の成功フラッシュに加え反映値を観測）。
      }
    );

    test.fixme(
      "E2E-M03-21-054 編集時ページリンク(/{id}/page/{page_no})で編集idを保持したまま指定ページが表示される（要: 複数ページ＋編集行シード）",
      async () => {
        // 期待は仕様(利用者視点の入口: 編集時ページリンクは編集idを保持しpage_noをセッションへ書く 設計書 :41)由来。
        // 編集行(SHELF_ID)＋既定10件で2ページ以上になる件数のシード確立後に実装。
      }
    );

    test.fixme(
      "E2E-M03-21-031 参照なし棚番号の削除→「削除しました」成功フラッシュ（破壊的DELETE＋確認ダイアログ・要使い捨てシード）",
      async () => {
        // 期待は仕様(削除 判定順序#4: ProductClasses空→remove/flush・admin.common.delete_complete)由来。
        // 削除は共通JS(data-method=delete)の確認ダイアログ経由のため dialog ハンドリングを実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M03-21-032 商品規格に参照される棚番号の削除→「商品で使用されているため…」エラー・削除されない（要参照シード＋確認ダイアログ）",
      async () => {
        // 期待は仕様(削除 判定順序#3: ProductClasses非空→削除せずadmin.shelf_number.delete.failed／一覧へリダイレクト)由来。
        // dtb_product_class が当該棚番号を参照するシード(SEED-M03-21-LINKED)確立後に実装。
      }
    );

    test.fixme(
      "E2E-M03-21-043 CSV取込で行数上限(5010)超過→件数上限メッセージ（要: 大規模CSV生成）",
      async () => {
        // 期待は仕様(CSV取込: ADMIN_CSV_IMPORT_MAX_ROWS以上でadmin.csv.error.upload.maxrecord／取込画面へ戻し)由来。
        // 5010行超のCSVを動的生成して投入する手順を確立後に実装。取込後DB値は間接/手動（ケース表参照）。
      }
    );

    test.fixme(
      "E2E-M03-21-051 一覧ページリンク(/page/{page_no})で指定ページが表示される（要: 複数ページ分のシード）",
      async () => {
        // 期待は仕様(利用者視点の入口/処理フロー: page_noをセッションへ書き当該ページの一覧を返す)由来。
        // 既定10件で2ページ以上になる件数のシード確立後に実装。
      }
    );
  }
);
