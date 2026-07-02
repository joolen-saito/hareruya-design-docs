/**
 * 管理画面 商品管理 売上分析タグ登録/編集 E2E（納品ケース表
 * integration_test/e2e/m03_17_admin_product_product_sales_analysis_management_e2e_cases.md に対応）。
 * 本specには「E2E自動化」のうち非破壊（表示・ナビ・遷移・未認証誘導・404）なものを実装し、
 * 必須/範囲/重複/保存成功/更新/削除（DB副作用・破壊的・HTML5ネイティブ検証バイパス要）は test.fixme（理由付き）で残す。
 * 手動/間接（同時更新・セッション内部値・DB関連件数）・対象外（IT-23検索なし/IT-20ログ）はケース表で全量管理しspecに残さない
 * （規約「手動/対象外はspecに残さない」）。
 * 期待結果は仕様(functions/pf-eccube3/m03-17_admin_product_product_sales_analysis_management.md / messages.ja.yaml)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が存在せず、既存 spec（login/two_factor_auth/m02/m03）も
 * @playwright/test を直接使う。本specも既存規約に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針: 資格情報（ECCUBE_ADMIN_USER/PASS）と編集対象id（TAG_SA_EDIT_ID）が無いと走らないよう test.skip でガード。
 * 検証失敗・表示確認は保存に至らず副作用を残さない。
 *
 * シード/環境変数（コミットしない）:
 *  - SEED-M03-17-ADMIN  : ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（/product 配下に到達できる管理者・2FA OFF）
 *  - SEED-M03-17-TAG    : TAG_SA_EDIT_ID（既存 mtb_tag_sales_analysis の id。編集モード表示の対象。参照系のみ）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductSalesAnalysisManagementPage } from "../../../pages/admin/m03/m03_17_admin_product_product_sales_analysis_management.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);
const TAG_SA_EDIT_ID = process.env.TAG_SA_EDIT_ID || "";

// 管理ルートを含めた URL アサーション（誤判定防止）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);

// 仕様(設計書/messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
// 注: NotBlank/Length/Range のフィールド検証文言(validators.ja.yaml/Form)は実装翻訳由来のためオラクル化しない。
const TITLE_PRODUCT_MGMT = "商品管理"; // messages.ja.yaml:1723（admin.product.product_management）
const SUBTITLE_TAG_SA = "売上分析タグ"; // messages.ja.yaml:2039（admin.product.tag_sales_analysis）
const CARD_NEW = "新規追加"; // messages.ja.yaml:1438（admin.common.registration__add）
const CARD_EDIT = "編集"; // messages.ja.yaml:1439（admin.common.edit）

/** 管理者でログインし、ログイン画面から遷移するまで。 */
async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  await expect(page.locator("#login_id")).toBeHidden();
}

test.describe("管理画面 > 商品管理 売上分析タグ登録/編集", { tag: ["@admin", "@product"] }, () => {
  // ===== 認証不要・非破壊（常時実行可） =====

  test("E2E-M03-17-011 未ログインで一覧URL→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/tag_sales_analysis`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  test("E2E-M03-17-012 未ログインで編集URL(/{id})→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/tag_sales_analysis/1`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  // ===== 認証あり・非破壊（表示／ナビ／遷移。資格情報があるときのみ実行） =====

  test("E2E-M03-17-001 新規フォーム（名称・並び順入力欄・登録ボタン）と一覧が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M03-17-ADMIN）");
    await login(page);
    const sa = new ProductProductSalesAnalysisManagementPage(page);
    await sa.gotoNew();
    await sa.seeForm();
    await sa.seeList();
  });

  test("E2E-M03-17-002 親フレームタイトル「商品管理」・サブタイトル「売上分析タグ」が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const sa = new ProductProductSalesAnalysisManagementPage(page);
    await sa.gotoNew();
    await expect(page.locator("body")).toContainText(TITLE_PRODUCT_MGMT); // admin.product.product_management
    await expect(page.locator("body")).toContainText(SUBTITLE_TAG_SA); // admin.product.tag_sales_analysis
  });

  test("E2E-M03-17-003 新規モードのカード見出しが「新規追加」", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const sa = new ProductProductSalesAnalysisManagementPage(page);
    await sa.gotoNew();
    await expect(sa.cardTitle).toContainText(CARD_NEW); // admin.common.registration__add
  });

  test("E2E-M03-17-004 一覧テーブル（ID/名称/並び順ヘッダ）・編集/削除ボタン・表示件数セレクトが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const sa = new ProductProductSalesAnalysisManagementPage(page);
    await sa.gotoNew();
    await expect(sa.listTable.locator("thead")).toContainText("ID"); // admin.common.id
    await expect(sa.listTable.locator("thead")).toContainText("名称"); // form.name.vars.label
    await expect(sa.listTable.locator("thead")).toContainText("並び順"); // form.rank.vars.label
    await expect(sa.pageCountSelect).toBeVisible();
  });

  test("E2E-M03-17-005 表示件数セレクト変更で page_count クエリ付きURLへ再描画", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const sa = new ProductProductSalesAnalysisManagementPage(page);
    await sa.gotoNew();
    await sa.pageCountSelect.selectOption("50"); // .js-page-count change で location 置換
    // 設計: 同一画面へ page_count クエリ付きでフル読み込みされる。
    await expect(page).toHaveURL(
      new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/tag_sales_analysis(/page/\\d+)?\\?.*page_count=50`)
    );
  });

  test("E2E-M03-17-006 /tag_sales_analysis/{id} 直接アクセスで編集モード表示（見出し「編集」・現行値）", async ({ page }) => {
    test.skip(!HAS_CREDS || !TAG_SA_EDIT_ID, "ECCUBE_ADMIN_USER/PASS または TAG_SA_EDIT_ID 未設定（SEED-M03-17-TAG）");
    await login(page);
    const sa = new ProductProductSalesAnalysisManagementPage(page);
    await sa.gotoEdit(TAG_SA_EDIT_ID);
    await expect(sa.cardTitle).toContainText(CARD_EDIT); // admin.common.edit
    await expect(sa.nameInput).not.toHaveValue(""); // 既存行の現行値がフォームに載る
  });

  test("E2E-M03-17-007 一覧の編集リンク押下で編集モードへ遷移する（操作起点）", async ({ page }) => {
    test.skip(!HAS_CREDS || !TAG_SA_EDIT_ID, "ECCUBE_ADMIN_USER/PASS または TAG_SA_EDIT_ID 未設定");
    await login(page);
    const sa = new ProductProductSalesAnalysisManagementPage(page);
    await sa.gotoNew();
    await sa.clickEditLink(TAG_SA_EDIT_ID);
    // 管理ルートを含めた URL アサーション（他パス誤判定防止）。
    await expect(page).toHaveURL(
      new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/tag_sales_analysis/${TAG_SA_EDIT_ID}(\\?|$)`)
    );
    await expect(sa.cardTitle).toContainText(CARD_EDIT);
  });

  test("E2E-M03-17-009 編集時の一覧ページャリンクが /{id}/page/ を指す", async ({ page }) => {
    test.skip(!HAS_CREDS || !TAG_SA_EDIT_ID, "ECCUBE_ADMIN_USER/PASS または TAG_SA_EDIT_ID 未設定");
    await login(page);
    const sa = new ProductProductSalesAnalysisManagementPage(page);
    await sa.gotoEdit(TAG_SA_EDIT_ID);
    // 設計: 編集モードのページャは /tag_sales_analysis/{id}/page/{page_no}（編集モード向けルートに切替）。
    const pageLinks = page.locator(
      `a[href*="/product/tag_sales_analysis/${TAG_SA_EDIT_ID}/page/"]`
    );
    if ((await pageLinks.count()) > 0) {
      await expect(pageLinks.first()).toBeVisible();
    } else {
      test.skip(true, "タグが1ページに収まりページャ未表示（>表示件数のタグが必要）");
    }
  });

  test("E2E-M03-17-008 新規時の一覧ページャリンクが /tag_sales_analysis/page/ を指す", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const sa = new ProductProductSalesAnalysisManagementPage(page);
    await sa.gotoNew();
    const pageLinks = page.locator('a[href*="/product/tag_sales_analysis/page/"]');
    if ((await pageLinks.count()) > 0) {
      await expect(pageLinks.first()).toBeVisible();
    } else {
      test.skip(true, "タグが1ページに収まりページャ未表示（>表示件数のタグが必要）");
    }
  });

  test("E2E-M03-17-010 一覧の削除リンクに削除確認モーダル文言(data-message)が設定される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const sa = new ProductProductSalesAnalysisManagementPage(page);
    await sa.gotoNew();
    if ((await sa.deleteLinks.count()) === 0) {
      test.skip(true, "一覧に行が無く削除ボタン未表示（mtb_tag_sales_analysis に1件以上必要）");
    }
    // 設計: 削除前に共通の削除確認モーダル文言（admin.common.delete_modal__message・名称が埋め込まれる）。
    // 文言は trans 由来（仕様）。data-method=delete のアンカーに data-message が付くこと。
    await expect(sa.deleteLinks.first()).toHaveAttribute("data-message", /削除してよろしいですか/);
  });

  test("E2E-M03-17-013 存在しない id の編集GETで 404", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    // 設計(エッジケース): 存在しない id の編集 GET はマスタ読み込みに失敗し 404。
    const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/tag_sales_analysis/99999999`);
    expect(res?.status()).toBe(404);
  });

  test("E2E-M03-17-014 表示件数セレクトに設計どおりの選択肢が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const sa = new ProductProductSalesAnalysisManagementPage(page);
    await sa.gotoNew();
    // 設計(利用者視点の入口/フロント挙動): 選択肢は 10/50/100/300/500/1000/2000/10000/12000。
    for (const v of ["10", "50", "100", "300", "500", "1000", "2000", "10000", "12000"]) {
      await expect(sa.pageCountSelect.locator(`option[value="${v}"]`)).toHaveCount(1);
    }
  });

  test("E2E-M03-17-015 新規モードのフォーム初期値が空欄", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const sa = new ProductProductSalesAnalysisManagementPage(page);
    await sa.gotoNew();
    // 設計(処理フローGET表示/入力項目): 新規は空フォーム。編集の現行値表示(E2E-006)と対。
    await expect(sa.nameInput).toHaveValue("");
    await expect(sa.rankInput).toHaveValue("");
  });

  test("E2E-M03-17-016 フォームaction が新規=store／編集=store/{id} に切り替わる", async ({ page }) => {
    test.skip(!HAS_CREDS || !TAG_SA_EDIT_ID, "ECCUBE_ADMIN_USER/PASS または TAG_SA_EDIT_ID 未設定");
    await login(page);
    const sa = new ProductProductSalesAnalysisManagementPage(page);
    await sa.gotoNew();
    // 設計(処理フローGET表示): 新規の action は無修飾 store。
    await expect(sa.formEl).toHaveAttribute("action", /\/tag_sales_analysis\/store$/);
    await sa.gotoEdit(TAG_SA_EDIT_ID);
    // 設計: 編集の action は同一主キーを付けた store/{id}。
    await expect(sa.formEl).toHaveAttribute(
      "action",
      new RegExp(`/tag_sales_analysis/store/${TAG_SA_EDIT_ID}$`)
    );
  });

  test.fixme(
    "E2E-M03-17-017 ナビ「売上分析登録/編集」から当該画面へ遷移しメニューがハイライトされる（要実機確認: 共通ナビのセレクタが Twig 未確認）",
    async () => {
      // 期待は仕様(利用者視点の入口 ナビ「売上分析登録/編集」→新規フォームと一覧 / フロント挙動 メニューハイライト product・tag_sales_analysis)由来。
      // 共通メニュー(eccube_nav キー sales_analysis)のセレクタが本機能 Twig に無く実機確認が必要なため fixme。
    }
  );

  // ===== 必須/範囲の検証失敗（要確認: HTML5 required・number min/max がクライアント遮断するため fixme） =====
  // 名称・並び順は required 属性付き、並び順は input[type=number] min=1/max=65535。form に novalidate が無いため、
  // 未入力/範囲外/非数値での「登録」押下はブラウザのネイティブ検証で POST が遮断され、サーバ側フラッシュ
  // 「登録できませんでした。」やフィールド検証に到達しない（操作経路がオラクル以前に成立しない）。
  // サーバ側検証の確認にはネイティブ検証のバイパスが必要なため実機確認まで fixme。期待は仕様(判定順序#1)由来。

  test.fixme(
    "E2E-M03-17-020 名称未入力で登録→「登録できませんでした。」再描画（要確認: HTML5 required がクライアント遮断）",
    async () => {
      // 期待は仕様(判定順序#1 検証失敗→admin.register.failed「登録できませんでした。」/ Controller.php:109)由来。
    }
  );
  test.fixme(
    "E2E-M03-17-021 並び順未入力で登録→「登録できませんでした。」再描画（要確認: HTML5 required がクライアント遮断）",
    async () => {
      // 期待は仕様(判定順序#1 検証失敗→admin.register.failed)由来。
    }
  );
  test.fixme(
    "E2E-M03-17-022 名称65文字で登録→文字列長エラー・保存されない（要確認: input maxlength=64 が65文字目入力を抑止し UI経路が成立しない）",
    async () => {
      // 期待は仕様(バリデーション 名称 最大64・最大長+1はエラー)由来。maxlength 属性により fill が64文字に切られる。
      // 長さ超過のサーバ側 Length 検証到達には maxlength バイパスが必要。フィールド文言(Length)はオラクル化しない。
    }
  );
  test.fixme(
    "E2E-M03-17-023 名称64文字ちょうど＋並び順1で登録成功（境界内・要: 作成行の後始末＝破壊的）",
    async () => {
      // 期待は仕様(バリデーション 名称最大64境界内/並び順最小1境界内→成功)由来。成功フラッシュ「登録が完了しました。」。
    }
  );
  test.fixme(
    "E2E-M03-17-024 並び順0(範囲外)で登録→範囲エラー・保存されない（要確認: number min=1 がクライアント遮断）",
    async () => {
      // 期待は仕様(バリデーション 並び順1〜65535・範囲外はエラー)由来。Range 文言はオラクル化しない。
    }
  );
  test.fixme(
    "E2E-M03-17-025 並び順65536(範囲外)で登録→範囲エラー・保存されない（要確認: number max=65535 がクライアント遮断）",
    async () => {
      // 期待は仕様(バリデーション 並び順1〜65535・範囲外はエラー)由来。
    }
  );
  test.fixme(
    "E2E-M03-17-026 並び順に非数値を入力して登録→保存されない（要確認: input[type=number] は非数値を保持できず操作経路が成立しない）",
    async () => {
      // 期待は仕様(並び順は整数)由来。number input には fill('abc') が通らない。確認方法は実機で要確認。
    }
  );
  test.fixme(
    "E2E-M03-17-027 名称1文字(最小長境界)＋並び順1で登録成功→「登録が完了しました。」（境界内・要: 作成行の後始末＝破壊的）",
    async () => {
      // 期待は仕様(バリデーション 名称最小長1境界内→成功)由来。成功フラッシュ「登録が完了しました。」。
    }
  );
  test.fixme(
    "E2E-M03-17-028 並び順65535(上限境界)で登録成功→「登録が完了しました。」（境界内・要: 作成行の後始末＝破壊的）",
    async () => {
      // 期待は仕様(バリデーション 並び順上限65535境界内→成功)由来。Range 文言はオラクル化しない。
    }
  );

  // ===== 保存/更新/重複/削除（破壊的＝DB副作用・要シード・要CSRF。手動/対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M03-17-030 名称・並び順入力で新規登録成功→「登録が完了しました。」＋一覧へリダイレクト(クエリid付)（要: 作成行の後始末）",
    async () => {
      // 期待は仕様(判定順序#3 成功→admin.register.complete＋admin_product_tag_sales_analysis リダイレクト・クエリid付 / Controller.php:138-140)由来。
    }
  );
  test.fixme(
    "E2E-M03-17-031 既存行を更新成功→「登録が完了しました。」（要: 使い捨て編集対象シード・後勝ち更新で復元）",
    async () => {
      // 期待は仕様(処理フロー 更新成功→admin.register.complete / Controller.php:138)由来。
    }
  );
  test.fixme(
    "E2E-M03-17-032 既存名称と重複で登録→「値が重複しています。」再描画（要: 重複名称シード＋一意制約）",
    async () => {
      // 期待は仕様(判定順序#2 一意制約違反→admin.error.non_unique「値が重複しています。」/ Controller.php:125-126)由来。
    }
  );
  test.fixme(
    "E2E-M03-17-033 検証失敗時 同一画面に一覧付きフォームが再描画され「登録できませんでした。」（要確認: HTML5 検証バイパス）",
    async () => {
      // 期待は仕様(エラー処理 フォーム検証失敗→admin.register.failed＋同テンプレ再描画(一覧付き) / Controller.php:108-118)由来。
    }
  );
  test.fixme(
    "E2E-M03-17-034 検証失敗時 送信済みの入力値がフォームへ保持される（要確認: HTML5 検証バイパス）",
    async () => {
      // 期待は仕様(セッション/画面遷移 送信失敗時はPOST済みデータがフォームに残る / Controller.php:108-118 handleRequest 後フォーム値保持)由来。
    }
  );
  test.fixme(
    "E2E-M03-17-040 紐付けなしタグのDELETE削除→「削除しました」一覧へリダイレクト（要: CSRF＋使い捨てタグ）",
    async () => {
      // 期待は仕様(処理フロー(削除)#4 紐付けなし→remove/flush＋admin.common.delete_complete / Controller.php:174-178)由来。
      // DELETEメソッド＋isTokenValid のため fetch/フォーム経由でトークン付与が必要。破壊的＝使い捨てタグで実施。
    }
  );
  test.fixme(
    "E2E-M03-17-041 商品紐付けありタグのDELETE削除→「商品で使用されているため…削除することができません。」一覧へ（要: 商品紐付けシード）",
    async () => {
      // 期待は仕様(処理フロー(削除)#2 admin.tag.delete.failed＋一覧リダイレクト・タグ本体は残る / Controller.php:156-163)由来。
    }
  );
  test.fixme(
    "E2E-M03-17-042 注文明細紐付けありタグのDELETE削除→「購入済の商品で使用されているため…削除することができません。」一覧へ（要: 注文明細紐付けシード）",
    async () => {
      // 期待は仕様(処理フロー(削除)#3 admin.order_tag.delete.failed＋一覧リダイレクト / Controller.php:165-172)由来。
    }
  );
  test.fixme(
    "E2E-M03-17-043 DELETEのCSRFトークン不正→アクセス拒否(HTTP 403)（要: 不正トークンでのDELETE発火）",
    async () => {
      // 期待は仕様(エッジケース/エラー処理 DELETE CSRF不正→403 / Controller.php:154 isTokenValid())由来。
    }
  );
});
