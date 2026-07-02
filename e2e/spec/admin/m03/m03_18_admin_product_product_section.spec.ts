/**
 * 管理画面 商品管理 部門登録／編集 E2E（納品ケース表
 * integration_test/e2e/m03_18_admin_product_product_section_e2e_cases.md に対応）。
 * 本specには「E2E自動化」のうち実行可能（非破壊＝表示・検証失敗・404・未認証誘導・遷移・DLリンク・form action・編集検証失敗）を実装し、
 * DBを書き換える成功系（020/021/022/032/036）・要シード削除（040/041）は test.fixme（理由付き）で残す。
 * 手動/対象外（CSV内容・副作用messenger_job・DB検索系・ログ・一覧セル変換037・免税範囲外改ざん038・CSRF不正042・削除その他失敗043等）はケース表で全量管理しspecに残さない。
 * 期待結果は仕様(functions/pf-eccube3/m03-18_admin_product_product_section.md / messages.ja.yaml)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が存在せず、既存 spec（login/two_factor_auth/m02/m03）も
 * @playwright/test を直接使う。本specも既存規約に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針: 資格情報（ECCUBE_ADMIN_USER/PASS）と対象部門id（SECTION_EDIT_ID）が無いと走らないよう test.skip でガード。
 * 表示・検証失敗・404 は副作用を残さない（保存は検証で弾かれる）。
 *
 * シード/環境変数（コミットしない）:
 *  - SEED-M03-18-ADMIN    : ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（部門管理URLへ到達できる管理者・2FA OFF）
 *  - SEED-M03-18-SECTION  : SECTION_EDIT_ID（編集対象の既存 mtb_section の id）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductSectionPage } from "../../../pages/admin/m03/m03_18_admin_product_product_section.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);
const SECTION_EDIT_ID = process.env.SECTION_EDIT_ID || "";

const LOGIN_RE = /\/login(\?|$)/;
const SECTION_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/section(\\?|$)`);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const SAVE_COMPLETE = "保存しました"; // :1398 admin.common.save_complete
const REGISTER_FAILED = "登録できませんでした。"; // :1774 admin.register.failed
// 画面タイトルは仕様(設計書 表示要素 / admin.product.section_management 確認値)「部門登録／編集」(全角スラッシュ)。
// オラクル独立性のため仕様値で判定する。実装の半角「部門登録/編集」との差(付帯表4#1)はテストが落ちて検出する＝実装へ寄せない。
const TITLE_DESIGN = "部門登録／編集";

/** 管理者でログインし、ログイン画面から遷移するまで。 */
async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  await expect(page.locator("#login_id")).toBeHidden();
}

test.describe("管理画面 > 商品管理 部門登録／編集", { tag: ["@admin", "@product"] }, () => {
  // ===== 認証不要・非破壊（常時実行可） =====

  test("E2E-M03-18-050 未ログインで部門登録URL→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/section`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  test("E2E-M03-18-051 未ログインで部門編集URL→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/section/1`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  // ===== 認証あり・非破壊（表示／遷移／検証失敗／404。資格情報があるときのみ実行） =====

  test("E2E-M03-18-001 部門登録／編集画面が表示される（見出し「部門登録／編集」＝仕様値）", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M03-18-ADMIN）");
    await login(page);
    const sec = new ProductProductSectionPage(page);
    await sec.gotoIndex();
    await expect(sec.pageTitle).toContainText(TITLE_DESIGN); // 仕様値「部門登録／編集」(admin.product.section_management)
  });

  test("E2E-M03-18-002 上部に新規フォーム（部門名/コード/免税区分/MTGBuyer表示）が表示", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const sec = new ProductProductSectionPage(page);
    await sec.gotoIndex();
    await sec.seeNewForm();
  });

  test("E2E-M03-18-003 下部に部門一覧テーブルが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const sec = new ProductProductSectionPage(page);
    await sec.gotoIndex();
    await sec.seeList();
  });

  test("E2E-M03-18-004 新規モードでは「新規登録へ戻る」リンクが表示されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const sec = new ProductProductSectionPage(page);
    await sec.gotoIndex();
    await expect(sec.backToNewLink).toHaveCount(0); // 編集モードでのみ出る（section.twig:39-43）
  });

  test("E2E-M03-18-005 ヘッダにCSV出力・CSV取込リンク（href）が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const sec = new ProductProductSectionPage(page);
    await sec.gotoIndex();
    await expect(sec.csvExportLink).toBeVisible();
    await expect(sec.csvImportLink).toBeVisible();
  });

  test("E2E-M03-18-006 免税区分に対象外/一般品/消耗品の3選択肢がある", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const sec = new ProductProductSectionPage(page);
    await sec.gotoIndex();
    // 仕様: 免税区分の永続化値 0/1/2（業務ルール・計算 / ProductDepartmentType:64-73）
    await expect(sec.taxFreeSelect.locator("option")).toHaveCount(3);
  });

  test("E2E-M03-18-007 一覧の削除リンクに data-method=delete と data-message が付与される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const sec = new ProductProductSectionPage(page);
    await sec.gotoIndex();
    const first = sec.deleteLinks.first();
    // 一覧に1件以上ある前提（前提条件: 既存 mtb_section）。空一覧時は要シード。
    test.skip((await sec.deleteLinks.count()) === 0, "部門が0件のためdata-message未検証（要シード）");
    await expect(first).toHaveAttribute("data-method", "delete"); // section.twig:133（JS挙動）
    await expect(first).toHaveAttribute("data-message", /.+/);
  });

  test("E2E-M03-18-010 一覧の編集リンクで当該部門がフォームに読み込まれ「新規登録へ戻る」が表示", async ({ page }) => {
    test.skip(!HAS_CREDS || !SECTION_EDIT_ID, "ECCUBE_ADMIN_USER/PASS または SECTION_EDIT_ID 未設定");
    await login(page);
    const sec = new ProductProductSectionPage(page);
    await sec.gotoEdit(SECTION_EDIT_ID);
    await expect(page).toHaveURL(new RegExp(`/product/section/${SECTION_EDIT_ID}(\\?|$)`));
    await expect(sec.backToNewLink).toBeVisible(); // 編集モードのみ（section.twig:39-43）
    await expect(sec.nameInput).not.toHaveValue(""); // 既存行が読み込まれている
  });

  test("E2E-M03-18-011 編集モードで「新規登録へ戻る」→新規画面(GET section)へ戻る", async ({ page }) => {
    test.skip(!HAS_CREDS || !SECTION_EDIT_ID, "ECCUBE_ADMIN_USER/PASS または SECTION_EDIT_ID 未設定");
    await login(page);
    const sec = new ProductProductSectionPage(page);
    await sec.gotoEdit(SECTION_EDIT_ID);
    await sec.backToNewLink.click();
    await expect(page).toHaveURL(SECTION_RE);
    await expect(sec.backToNewLink).toHaveCount(0); // 新規モードへ戻った
  });

  test("E2E-M03-18-030 部門名未入力で送信→「登録できませんでした。」表示・保存されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const sec = new ProductProductSectionPage(page);
    await sec.gotoIndex();
    await sec.submit({ name: "", code: "E2E_CODE", taxFree: "0" }); // 部門名空（必須NG）
    // 仕様(処理フロー#4 / エラー処理 admin.register.failed)由来。検証で弾かれ保存・遷移しない。
    await expect(sec.errorFlash).toContainText(REGISTER_FAILED);
    await expect(sec.registerButton).toBeVisible(); // 同一画面再表示＝保存されない
  });

  test("E2E-M03-18-031 部門コード未入力で送信→「登録できませんでした。」表示・保存されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const sec = new ProductProductSectionPage(page);
    await sec.gotoIndex();
    await sec.submit({ name: "E2E部門", code: "", taxFree: "0" }); // 部門コード空（必須NG）
    await expect(sec.errorFlash).toContainText(REGISTER_FAILED);
    await expect(sec.registerButton).toBeVisible();
  });

  test("E2E-M03-18-033 部門名129文字(最大長+1)で送信→「登録できませんでした。」表示・保存されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const sec = new ProductProductSectionPage(page);
    await sec.gotoIndex();
    await sec.submit({ name: "あ".repeat(129), code: "E2E_CODE", taxFree: "0" }); // 上限128超過（設計値）
    // 仕様(入力項目 部門名 Length max=128 / バリデーション)由来。文言は固定しない領域はフラッシュで判定。
    await expect(sec.errorFlash).toContainText(REGISTER_FAILED);
    await expect(sec.registerButton).toBeVisible(); // 同一画面滞留＝保存されない
  });

  test("E2E-M03-18-034 部門コード129文字(最大長+1)で送信→「登録できませんでした。」表示・保存されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const sec = new ProductProductSectionPage(page);
    await sec.gotoIndex();
    await sec.submit({ name: "E2E部門", code: "a".repeat(129), taxFree: "0" }); // 部門コード上限128超過（設計値・md:129）
    // 仕様(入力項目 部門コード Length max=128 / バリデーション)由来。設計書は部門名と同上の128上限。
    await expect(sec.errorFlash).toContainText(REGISTER_FAILED);
    await expect(sec.registerButton).toBeVisible(); // 同一画面滞留＝保存されない
  });

  test("E2E-M03-18-009 新規フォームのactionが …/product/section/store（id無し）で解決される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const sec = new ProductProductSectionPage(page);
    await sec.gotoIndex();
    // 仕様(処理フロー 新規表示#4: action=store パラメータ無し / section.twig:54)由来。
    await expect(sec.formSection).toHaveAttribute("action", /\/product\/section\/store$/);
  });

  test("E2E-M03-18-012 編集フォームのactionが …/product/section/store/{id} で解決される", async ({ page }) => {
    test.skip(!HAS_CREDS || !SECTION_EDIT_ID, "ECCUBE_ADMIN_USER/PASS または SECTION_EDIT_ID 未設定");
    await login(page);
    const sec = new ProductProductSectionPage(page);
    await sec.gotoEdit(SECTION_EDIT_ID);
    // 仕様(処理フロー 編集表示#5: action=store/{id} / section.twig:54)由来。
    await expect(sec.formSection).toHaveAttribute(
      "action",
      new RegExp(`/product/section/store/${SECTION_EDIT_ID}$`)
    );
  });

  test("E2E-M03-18-035 編集モードで部門名を空にして送信→「登録できませんでした。」で滞留・更新されない", async ({ page }) => {
    test.skip(!HAS_CREDS || !SECTION_EDIT_ID, "ECCUBE_ADMIN_USER/PASS または SECTION_EDIT_ID 未設定");
    await login(page);
    const sec = new ProductProductSectionPage(page);
    await sec.gotoEdit(SECTION_EDIT_ID);
    await sec.submit({ name: "" }); // 編集対象の部門名を空に（必須NG。code/免税区分は既存値のまま）
    // 仕様(バリデーション 部門名NotBlank / 処理フロー#4)由来。検証で弾かれ更新・遷移しない＝022/085成功系の異常系対。
    await expect(sec.errorFlash).toContainText(REGISTER_FAILED);
    await expect(sec.registerButton).toBeVisible(); // 編集画面に滞留＝更新されない
  });

  test("E2E-M03-18-052 存在しないidで部門編集GET→404", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/section/99999999`);
    expect(res?.status()).toBe(404); // 利用者視点の入口: 存在しない{id}は404
  });

  test("E2E-M03-18-053 CSV取込リンク→部門マスタCSV取込画面へ遷移", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const sec = new ProductProductSectionPage(page);
    await sec.gotoIndex();
    await sec.csvImportLink.click();
    await expect(page).toHaveURL(/\/product\/section\/master_csv_upload(\?|$)/);
  });

  test("E2E-M03-18-060 CSV出力リンク押下→ダウンロード(添付応答 section_*.csv)が発火", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const sec = new ProductProductSectionPage(page);
    await sec.gotoIndex();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      sec.csvExportLink.click(),
    ]);
    // 仕様(画面遷移 CSV出力＝ダウンロード応答 / Controller:224 filename=section_YmdHis.csv)由来。
    // ファイル名先頭 section_ のみ検証。CSV本文（ヘッダ・全件・コード昇順）は手動（ケース表 061）。
    expect(download.suggestedFilename()).toMatch(/^section_.*\.csv$/);
  });

  // ===== 保留（破壊的＝DB登録/更新/削除。要シード・後始末。手動/対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M03-18-020 新規登録成功で成功フラッシュ「保存しました」（要: 使い捨て部門の後始末）",
    async () => {
      // 期待は仕様(処理フロー#5-7 persist/flush→addSuccess admin.common.save_complete / Controller:118-122)由来。
    }
  );
  test.fixme(
    "E2E-M03-18-021 新規登録成功後 GET …/product/section へ遷移し新規フォームに戻る（要後始末）",
    async () => {
      // 期待は仕様(処理フロー#8 redirectToRoute admin_product_section / Controller:124)由来。
    }
  );
  test.fixme(
    "E2E-M03-18-022 編集保存成功で「保存しました」＋一覧へ遷移（要: 編集対象シード・使い捨て）",
    async () => {
      // 期待は仕様(処理フロー#5-8 編集行更新→成功フラッシュ→一覧GET / Controller:117-124)由来。
    }
  );
  test.fixme(
    "E2E-M03-18-032 部門名128文字ちょうどで保存成功（境界内・要後始末）",
    async () => {
      // 期待は仕様(入力項目 部門名 Length max=128 境界内)由来。成功フラッシュ「保存しました」。
    }
  );
  test.fixme(
    "E2E-M03-18-036 部門コード128文字ちょうどで保存成功（境界内・要後始末）",
    async () => {
      // 期待は仕様(入力項目 部門コード Length max=128 境界内 md:129)由来。成功フラッシュ「保存しました」。032(部門名128)の部門コード側の対。
    }
  );
  test.fixme(
    "E2E-M03-18-040 削除(商品規格の参照なし)→「削除しました」＋一覧（要: 使い捨て部門シード）",
    async () => {
      // 期待は仕様(利用者視点の入口 削除/ エラー処理 / Controller:177-183 delete_complete)由来。
    }
  );
  test.fixme(
    "E2E-M03-18-041 削除(商品規格 dtb_product_class の参照あり)→拒否・部門名含むエラー＋一覧（要: 参照シード）",
    async () => {
      // 期待は仕様(エッジケース 削除拒否 / Controller:147-149 delete_product_class.failed)由来。
    }
  );
});
