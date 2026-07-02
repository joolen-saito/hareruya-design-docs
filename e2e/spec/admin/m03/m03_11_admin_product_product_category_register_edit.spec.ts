/**
 * 管理画面 商品管理 カテゴリ登録・編集 E2E（納品ケース表
 * integration_test/e2e/m03_11_admin_product_product_category_register_edit_e2e_cases.md に対応）。
 * 本specには「E2E自動化」のうち実行可能（非破壊＝表示・検証失敗・404・未認証誘導）なものを実装し、
 * DBを書き換える成功系（010/011/012/013/021/025/028/029/041）・要深い階層シード（030）・要画像フィクスチャ（040/042）は
 * test.fixme（理由付き）で残す。手動/対象外（008,060,061 等）はケース表で全量管理しspecに残さない。
 * 期待結果は仕様(functions/pf-eccube3/m03-11_admin_product_product_category_register_edit.md / messages.ja.yaml)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が存在せず、既存 spec（login/two_factor_auth/m02）も
 * @playwright/test を直接使う。本specも既存規約に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針: 資格情報（ECCUBE_ADMIN_USER/PASS）と対象カテゴリid（CAT_PARENT_ID/CAT_EDIT_ID）が無いと走らないよう
 * test.skip でガード。表示・検証失敗・404 は副作用を残さない（保存は失敗するため）。
 *
 * シード/環境変数（コミットしない）:
 *  - SEED-M03-11-ADMIN     : ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（カテゴリ管理URLを許可する管理者・2FA OFF）
 *  - SEED-M03-11-CAT-PARENT: CAT_PARENT_ID（子を追加できる既存親カテゴリのid）
 *  - SEED-M03-11-CAT-EDIT  : CAT_EDIT_ID（親を持つ編集対象カテゴリのid）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductCategoryRegisterEditPage } from "../../../pages/admin/m03/m03_11_admin_product_product_category_register_edit.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);
const CAT_PARENT_ID = process.env.CAT_PARENT_ID || "";
const CAT_EDIT_ID = process.env.CAT_EDIT_ID || "";

const LOGIN_RE = /\/login(\?|$)/;

// オラクル独立性: 表示文言の固定（"入力されていません。"/"保存しました" 等）は実装i18n
// (validators.ja.yaml / messages.ja.yaml) 由来のため期待値に固定しない。設計書が正典化するのは
// 「フォーム検証NG→同一Twig200・フィールドエラー表示」(エラー処理 functions:216) と
// 「成功→302リダイレクト＋成功フラッシュ admin.common.save_complete」(処理フロー functions:76)という
// 構造的事実。判定はフィールドエラー要素の表示有無・同一フォーム滞留（未送信）／リダイレクト遷移で行う。

/** 管理者でログインし、ログイン画面から遷移するまで。 */
async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  await expect(page.locator("#login_id")).toBeHidden();
}

test.describe("管理画面 > 商品管理 カテゴリ登録・編集", { tag: ["@admin", "@product"] }, () => {
  // ===== 認証不要・非破壊（常時実行可） =====

  test("E2E-M03-11-050 未ログインで新規フォームURL(show)→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/category/1`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  test("E2E-M03-11-051 未ログインで編集フォームURL→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/category/1/edit`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  // ===== 認証あり・非破壊（表示／検証失敗／404。資格情報があるときのみ実行） =====

  test("E2E-M03-11-003 ルート直下一覧（親null）では登録フォームカードが表示されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M03-11-ADMIN）");
    await login(page);
    const cat = new ProductProductCategoryRegisterEditPage(page);
    await cat.gotoRoot();
    await expect(cat.formCard).toHaveCount(0); // 親null→フォームカードを出さない
    await expect(cat.nameInput).toHaveCount(0);
  });

  test("E2E-M03-11-001 親を選んだ子一覧に新規フォームと各入力欄・「子カテゴリ作成」が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS || !CAT_PARENT_ID, "ECCUBE_ADMIN_USER/PASS または CAT_PARENT_ID 未設定");
    await login(page);
    const cat = new ProductProductCategoryRegisterEditPage(page);
    await cat.gotoShow(CAT_PARENT_ID);
    await cat.seeCreateForm();
  });

  test("E2E-M03-11-004 新規フォームのみバナー/アイコンのファイル入力が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS || !CAT_PARENT_ID, "ECCUBE_ADMIN_USER/PASS または CAT_PARENT_ID 未設定");
    await login(page);
    const cat = new ProductProductCategoryRegisterEditPage(page);
    await cat.gotoShow(CAT_PARENT_ID);
    await expect(cat.bannerFile).toHaveCount(1);
    await expect(cat.iconFile).toHaveCount(1);
  });

  test("E2E-M03-11-002 編集モードで編集フォームと「カテゴリ更新」が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS || !CAT_EDIT_ID, "ECCUBE_ADMIN_USER/PASS または CAT_EDIT_ID 未設定");
    await login(page);
    const cat = new ProductProductCategoryRegisterEditPage(page);
    await cat.gotoEdit(CAT_EDIT_ID);
    await cat.seeEditForm();
  });

  test("E2E-M03-11-005 編集フォームには画像ファイル入力が無い（画像差し替え不可）", async ({ page }) => {
    test.skip(!HAS_CREDS || !CAT_EDIT_ID, "ECCUBE_ADMIN_USER/PASS または CAT_EDIT_ID 未設定");
    await login(page);
    const cat = new ProductProductCategoryRegisterEditPage(page);
    await cat.gotoEdit(CAT_EDIT_ID);
    await expect(cat.bannerFile).toHaveCount(0);
    await expect(cat.iconFile).toHaveCount(0);
  });

  test("E2E-M03-11-052 存在しない親idのshow URLは404", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/category/99999999`);
    expect(res?.status()).toBe(404);
  });

  test("E2E-M03-11-053 存在しない編集idのedit URLは404", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    // 設計書(処理フロー GET edit パスidのカテゴリ読込・不存在→404 functions:36,65)由来。
    const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/category/99999999/edit`);
    expect(res?.status()).toBe(404);
  });

  test("E2E-M03-11-020 カテゴリ名(日)未入力で送信→必須エラーが表示され保存されない", async ({ page }) => {
    test.skip(!HAS_CREDS || !CAT_PARENT_ID, "ECCUBE_ADMIN_USER/PASS または CAT_PARENT_ID 未設定");
    await login(page);
    const cat = new ProductProductCategoryRegisterEditPage(page);
    await cat.gotoShow(CAT_PARENT_ID);
    await cat.submitCreate(""); // 名称(日)空
    // 設計書(エラー処理 functions:216 フォーム検証NG→フィールドエラー表示)由来。文言は固定しない。
    await expect(cat.fieldError.first()).toBeVisible();
    await expect(cat.createButton).toBeVisible(); // 同一フォームに滞留＝保存・遷移していない
  });

  test("E2E-M03-11-022 カテゴリ名(日)256文字で送信→文字列長エラーが表示され保存されない", async ({ page }) => {
    test.skip(!HAS_CREDS || !CAT_PARENT_ID, "ECCUBE_ADMIN_USER/PASS または CAT_PARENT_ID 未設定");
    await login(page);
    const cat = new ProductProductCategoryRegisterEditPage(page);
    await cat.gotoShow(CAT_PARENT_ID);
    await cat.submitCreate("あ".repeat(256)); // 上限255超過（設計値）
    // 設計書(入力項目 functions:114 カテゴリ名(日) Length eccube_stext_len=255)由来。文言は固定しない。
    await expect(cat.fieldError.first()).toBeVisible();
    await expect(cat.createButton).toBeVisible(); // 同一フォーム滞留＝保存されない
  });

  test("E2E-M03-11-023 検索パラメーター3001文字で送信→文字列長エラーが表示され保存されない", async ({ page }) => {
    test.skip(!HAS_CREDS || !CAT_PARENT_ID, "ECCUBE_ADMIN_USER/PASS または CAT_PARENT_ID 未設定");
    await login(page);
    const cat = new ProductProductCategoryRegisterEditPage(page);
    await cat.gotoShow(CAT_PARENT_ID);
    await cat.nameInput.fill("e2e_valid_name");
    await cat.searchParams.fill("a".repeat(3001)); // 上限3000超過（設計値）
    await cat.createButton.click();
    // 設計書(入力項目 functions:122 検索パラメーター Length eccube_ltext_len=3000)由来。文言は固定しない。
    await expect(cat.fieldError.first()).toBeVisible();
    await expect(cat.createButton).toBeVisible(); // 同一フォーム滞留＝保存されない
  });

  test("E2E-M03-11-026 カテゴリ名(英)を上限超過(256文字)で送信→文字列長エラーが表示され保存されない", async ({ page }) => {
    test.skip(!HAS_CREDS || !CAT_PARENT_ID, "ECCUBE_ADMIN_USER/PASS または CAT_PARENT_ID 未設定");
    await login(page);
    const cat = new ProductProductCategoryRegisterEditPage(page);
    await cat.gotoShow(CAT_PARENT_ID);
    await cat.nameInput.fill("e2e_valid_name");
    await cat.nameEnInput.fill("a".repeat(256)); // 英名 上限255超過（設計値 eccube_stext_len=255）
    await cat.createButton.click();
    // 設計書(入力項目 functions:115 カテゴリ名(英) 任意・Length eccube_stext_len=255)由来。文言は固定しない。
    await expect(cat.fieldError.first()).toBeVisible();
    await expect(cat.createButton).toBeVisible(); // 同一フォーム滞留＝保存されない
  });

  test("E2E-M03-11-024 編集でカテゴリ名(日)を空にして更新→必須エラーが表示され同一フォームに滞留", async ({ page }) => {
    test.skip(!HAS_CREDS || !CAT_EDIT_ID, "ECCUBE_ADMIN_USER/PASS または CAT_EDIT_ID 未設定");
    await login(page);
    const cat = new ProductProductCategoryRegisterEditPage(page);
    await cat.gotoEdit(CAT_EDIT_ID);
    await cat.submitUpdate(""); // 既存名称(日)を空にして更新
    // 設計書(処理フロー functions:81-83 POST update 検証NG→同一Twig200／エラー処理 functions:216)由来。
    // 検証で弾かれ保存されない＝非破壊。文言は固定しない。
    await expect(cat.fieldError.first()).toBeVisible();
    await expect(cat.updateButton).toBeVisible(); // 同一編集フォーム滞留＝更新されない
  });

  test("E2E-M03-11-027 編集でカテゴリ名(英)256文字で更新→文字列長エラーが表示され同一フォームに滞留", async ({ page }) => {
    test.skip(!HAS_CREDS || !CAT_EDIT_ID, "ECCUBE_ADMIN_USER/PASS または CAT_EDIT_ID 未設定");
    await login(page);
    const cat = new ProductProductCategoryRegisterEditPage(page);
    await cat.gotoEdit(CAT_EDIT_ID);
    await cat.nameEnInput.fill("a".repeat(256)); // 英名 上限255超過（設計値 eccube_stext_len=255）
    await cat.updateButton.click();
    // 設計書(処理フロー POST update 検証NG→同一Twig200 functions:81／入力項目 カテゴリ名(英) Length 255 functions:115)由来。
    // 検証で弾かれ更新されない＝非破壊。文言は固定しない。
    await expect(cat.fieldError.first()).toBeVisible();
    await expect(cat.updateButton).toBeVisible(); // 同一編集フォーム滞留＝更新されない
  });

  // ===== 保留（破壊的＝DB登録/更新。要シード/後始末。手動/対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M03-11-010 子カテゴリ作成成功で成功フラッシュ「保存しました」（要: 使い捨て親シード＋作成子の後始末）",
    async () => {
      // 期待は仕様(処理フロー POST create 成功→addSuccess save_complete / CategoryController.php:212)由来。
    }
  );
  test.fixme(
    "E2E-M03-11-013 子カテゴリ作成成功→show遷移し作成名が兄弟一覧に表示（DB登録の間接確認・要後始末）",
    async () => {
      // 期待は仕様(画面遷移 新規成功→/product/category/{parent_id} / CategoryController.php:427)由来。
    }
  );
  test.fixme(
    "E2E-M03-11-011 親ありカテゴリ更新成功→show遷移＋成功フラッシュ（要: 編集対象シード・使い捨て）",
    async () => {
      // 期待は仕様(画面遷移 更新成功 親あり→show / CategoryController.php:424-427)由来。
    }
  );
  test.fixme(
    "E2E-M03-11-012 親なし(ルート)カテゴリ更新成功→/product/category へ遷移（要: ルートカテゴリシード・使い捨て）",
    async () => {
      // 期待は仕様(画面遷移 更新成功 親なし→category / CategoryController.php:430)由来。
    }
  );
  test.fixme(
    "E2E-M03-11-021 カテゴリ名(日)255文字ちょうどで保存成功（境界内・要後始末）",
    async () => {
      // 期待は仕様(入力項目 カテゴリ名(日) eccube_stext_len=255 境界内)由来。成功フラッシュ「保存しました」。
    }
  );
  test.fixme(
    "E2E-M03-11-025 カテゴリ名(英)未入力でも保存成功（任意項目・要後始末）",
    async () => {
      // 期待は仕様(入力項目 カテゴリ名(英) 任意)由来。
    }
  );
  test.fixme(
    "E2E-M03-11-030 階層上限(5)超過の親配下に新規作成→HTTP400（要: hierarchy=5 の深い階層シード）",
    async () => {
      // 期待は仕様(保存判定順序#2 eccube_category_nest_level<hierarchy→400 / CategoryController.php:290-294)由来。
    }
  );
  test.fixme(
    "E2E-M03-11-040 新規でMIME/拡張子不正のファイルをバナーに指定→アップロードエラー・滞留（要: 不正画像フィクスチャ）",
    async () => {
      // 期待は仕様(エラー処理 画像アップロード失敗→upload_error「アップロードに失敗しました」/ CategoryController.php:232,254-277)由来。
    }
  );
  test.fixme(
    "E2E-M03-11-042 新規でMIME/拡張子不正のファイルをアイコンに指定→アップロードエラー・滞留（要: 不正画像フィクスチャ）",
    async () => {
      // 期待は仕様(エラー処理 アイコン側の画像アップロード失敗→upload_error / functions:74,217)由来。バナー(040)の対となるアイコン異常分岐。
    }
  );
  test.fixme(
    "E2E-M03-11-041 新規で有効なバナー/アイコン画像を指定→保存成功し編集画面で登録画像が読み取り表示（要: 有効画像フィクスチャ・後始末）",
    async () => {
      // 期待は仕様(処理フロー 新規のみ画像処理→banner_image/icon_image保存 functions:74,118,119／副作用 functions:155)由来。
    }
  );
  test.fixme(
    "E2E-M03-11-028 検索パラメーター3000文字ちょうどで保存成功（境界内・要後始末）",
    async () => {
      // 期待は仕様(入力項目 検索パラメーター eccube_ltext_len=3000 境界内 functions:122)由来。成功フラッシュ admin.common.save_complete。
    }
  );
  test.fixme(
    "E2E-M03-11-029 チェック2種/HTML2種/検索パラメーターを入力して作成→各値が保存され編集画面に復元表示（要後始末）",
    async () => {
      // 期待は仕様(入力項目 front_search_hide_flg/branch_hide_flg/html_ja/html_en/search_parameters の保存先 functions:116,120,121,122)由来。
    }
  );
});
