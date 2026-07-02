/**
 * 管理画面 商品管理 タグ登録/編集 E2E（納品ケース表
 * integration_test/e2e/m03_13_admin_product_product_tag_e2e_cases.md に対応）。
 * 本specには「E2E自動化」のうち非破壊（表示・ナビ・選択肢集合007・一覧昇順008・編集ページャ013・
 * 検証失敗034-039/046・未認証誘導）なものを実装し、
 * DBを書き換える成功系（040/041/044/045/047）・?id=リダイレクト（043）・要シードの優先コード相関（042）・
 * DELETE削除拒否（051）は test.fixme（理由付き）で残す。手動/間接（054,055,060,061,062,063,064）・
 * 対象外（IT-23検索/IT-20ログ 等）はケース表で全量管理しspecに残さない（規約「手動/対象外はspecに残さない」）。
 * 期待結果は仕様(functions/pf-eccube3/m03-13_admin_product_product_tag.md / messages.ja.yaml / validators.ja.yaml)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が存在せず、既存 spec（login/two_factor_auth/m02/m03）も
 * @playwright/test を直接使う。本specも既存規約に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針: 資格情報（ECCUBE_ADMIN_USER/PASS）と編集対象タグid（TAG_EDIT_ID）が無いと走らないよう test.skip でガード。
 * 検証失敗ケースは保存に至らず副作用を残さない（POST失敗＝同テンプレ再描画）。
 *
 * シード/環境変数（コミットしない）:
 *  - SEED-M03-13-ADMIN   : ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（/product/tag を deny_url に持たない管理者・2FA OFF）
 *  - SEED-M03-13-TAG     : TAG_EDIT_ID（既存タグのid。編集モード表示・更新の対象）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductTagPage } from "../../../pages/admin/m03/m03_13_admin_product_product_tag.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);
const TAG_EDIT_ID = process.env.TAG_EDIT_ID || "";

// 管理ルートを含めた URL アサーション（誤判定防止）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const TAG_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/tag(\\?|/|$)`);

// 仕様(設計書/messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
// 注: NotBlank 等のフィールド検証メッセージ(validators.ja.yaml)は実装翻訳由来のためオラクル化しない（固定文言を期待値にしない）。
const REGISTER_FAILED = "登録できませんでした。"; // messages.ja.yaml:1774（admin.register.failed）
const REGISTER_COMPLETE = "登録が完了しました。"; // messages.ja.yaml:1773（admin.register.complete）
const TITLE_TAG_MGMT = "タグ管理"; // messages.ja.yaml:1733（admin.product.tag_management）
const CARD_NEW = "新規追加"; // messages.ja.yaml:1438（admin.common.registration__add）
const CARD_EDIT = "編集"; // messages.ja.yaml:1439（admin.common.edit）

/** 管理者でログインし、ログイン画面から遷移するまで。 */
async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  await expect(page.locator("#login_id")).toBeHidden();
}

test.describe("管理画面 > 商品管理 タグ登録/編集", { tag: ["@admin", "@product"] }, () => {
  // ===== 認証不要・非破壊（常時実行可） =====

  test("E2E-M03-13-020 未ログインでタグ管理URL→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/tag`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  test("E2E-M03-13-021 未ログインで編集URL(/product/tag/{id})→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/tag/1`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  // ===== 認証あり・非破壊（表示／ナビ／検証失敗。資格情報があるときのみ実行） =====

  test("E2E-M03-13-022 ログイン済み・拒否なしでタグ管理画面が表示される（到達可）", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M03-13-ADMIN）");
    await login(page);
    const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/tag`);
    expect(res?.status()).toBe(200); // 権限照合通過＝200
  });

  test("E2E-M03-13-001 タグ管理画面に新規フォーム（名称日/英・並び順・登録）と一覧が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const tag = new ProductProductTagPage(page);
    await tag.gotoNew();
    await expect(page.locator("h1, h2, body")).toContainText(TITLE_TAG_MGMT); // 画面タイトル「タグ管理」
    await tag.seeForm();
    await tag.seeList();
  });

  test("E2E-M03-13-002 新規モードのカード見出しが「新規追加」", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const tag = new ProductProductTagPage(page);
    await tag.gotoNew();
    await expect(tag.cardTitle).toContainText(CARD_NEW); // admin.common.registration__add
  });

  test("E2E-M03-13-003 一覧テーブルのヘッダ（ID/名称日/名称英/並び順）と表示件数セレクトが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const tag = new ProductProductTagPage(page);
    await tag.gotoNew();
    await expect(tag.listTable.locator("thead")).toContainText("名称(日)");
    await expect(tag.listTable.locator("thead")).toContainText("名称(英)");
    await expect(tag.listTable.locator("thead")).toContainText("並び順");
    await expect(tag.pageCountSelect).toBeVisible();
  });

  test("E2E-M03-13-004 折りたたみ「その他の設定」内にフリーエリア(日/英)/優先表示商品/タイトル(日/英)/説明(日/英)欄がある", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const tag = new ProductProductTagPage(page);
    await tag.gotoNew();
    // 折りたたみは初期 collapse。展開して該当入力欄の存在（DOM上の存在）を確認する。
    // 設計/フォーム型: 任意項目はフリーエリア(日)(英)・優先表示商品・タイトル(日)(英)・説明(日)(英)。
    await tag.accordionToggle.click();
    await expect(tag.freeAreaJpInput).toHaveCount(1);
    await expect(tag.freeAreaEnInput).toHaveCount(1);
    await expect(tag.priorityProductsInput).toHaveCount(1);
    await expect(tag.titleJpInput).toHaveCount(1);
    await expect(tag.titleEnInput).toHaveCount(1);
    await expect(tag.descriptionJpInput).toHaveCount(1);
    await expect(tag.descriptionEnInput).toHaveCount(1);
  });

  test("E2E-M03-13-007 表示件数セレクトの選択肢が設計値集合（10/50/100/300/500/1000/2000/10000/12000）である", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const tag = new ProductProductTagPage(page);
    await tag.gotoNew();
    // 設計: 選択肢はこの集合のみ（設計書「利用者視点の入口」）。
    await expect(tag.pageCountOptions).toHaveCount(9);
    const values = await tag.pageCountOptions.evaluateAll((opts) =>
      opts.map((o) => (o as HTMLOptionElement).value)
    );
    expect(values).toEqual(["10", "50", "100", "300", "500", "1000", "2000", "10000", "12000"]);
  });

  test("E2E-M03-13-008 一覧の並び順列が昇順（sort_no昇順）で表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M03-13-TAG: 並び順の異なる複数タグ）");
    await login(page);
    const tag = new ProductProductTagPage(page);
    await tag.gotoNew();
    const count = await tag.sortNoCells.count();
    test.skip(count < 2, "昇順比較には2件以上のタグが必要");
    const nums = (await tag.sortNoCells.allInnerTexts()).map((t) => Number(t.trim()));
    const sorted = [...nums].sort((a, b) => a - b);
    expect(nums).toEqual(sorted); // 設計: dtb_tag を sort_no 昇順でページング
  });

  test("E2E-M03-13-006 hideNormalProductsFlg（優先表示商品のみ表示）の入力欄は画面に存在しない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const tag = new ProductProductTagPage(page);
    await tag.gotoNew();
    // 仕様: フォーム型に存在するが当Twigでは form_row されず画面に出ない（不具合候補#1）。
    await expect(tag.hideNormalFlg).toHaveCount(0);
  });

  test("E2E-M03-13-005 一覧の編集リンク押下で編集モードに遷移しカード見出しが「編集」", async ({ page }) => {
    test.skip(!HAS_CREDS || !TAG_EDIT_ID, "ECCUBE_ADMIN_USER/PASS または TAG_EDIT_ID 未設定（SEED-M03-13-TAG）");
    await login(page);
    const tag = new ProductProductTagPage(page);
    await tag.gotoNew();
    // 操作起点の確認: 一覧から当該タグ行の「編集」リンクを実クリックして編集モードへ遷移する（012の直接URLとは別観点）。
    await tag.clickEditLink(TAG_EDIT_ID);
    await expect(page).toHaveURL(new RegExp(`/product/tag/${TAG_EDIT_ID}(\\?|$)`));
    await expect(tag.cardTitle).toContainText(CARD_EDIT); // admin.common.edit
    await expect(tag.nameInput).not.toHaveValue(""); // 既存タグの現行値がフォームに載る
  });

  test("E2E-M03-13-012 /product/tag/{id} 直接アクセスで当該タグが編集モードで表示される", async ({ page }) => {
    test.skip(!HAS_CREDS || !TAG_EDIT_ID, "ECCUBE_ADMIN_USER/PASS または TAG_EDIT_ID 未設定");
    await login(page);
    const tag = new ProductProductTagPage(page);
    await tag.gotoEdit(TAG_EDIT_ID);
    await expect(tag.cardTitle).toContainText(CARD_EDIT);
    await tag.seeForm();
  });

  test("E2E-M03-13-010 表示件数セレクト変更で page_count クエリ付きURLへ再描画", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const tag = new ProductProductTagPage(page);
    await tag.gotoNew();
    await tag.pageCountSelect.selectOption("50"); // .js-page-count change で location 置換
    // 設計: 同一タグ管理画面へ page_count クエリ付きで再描画される。
    await expect(page).toHaveURL(new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/tag(/page/\\d+)?\\?.*page_count=50`));
  });

  test("E2E-M03-13-011 新規時の一覧ページャリンクが /product/tag/page/ を指す", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const tag = new ProductProductTagPage(page);
    await tag.gotoNew();
    // ページャが存在する場合、新規時リンクは admin_product_tag_page（/product/tag/page/{n}）を指す。
    const pageLinks = page.locator(`a[href*="/product/tag/page/"]`);
    if ((await pageLinks.count()) > 0) {
      await expect(pageLinks.first()).toBeVisible();
    } else {
      test.skip(true, "タグが1ページに収まりページャ未表示（>表示件数のタグが必要）");
    }
  });

  test("E2E-M03-13-013 編集モードの一覧ページャリンクが /product/tag/{id}/page/ を指す", async ({ page }) => {
    test.skip(!HAS_CREDS || !TAG_EDIT_ID, "ECCUBE_ADMIN_USER/PASS または TAG_EDIT_ID 未設定（SEED-M03-13-TAG）");
    await login(page);
    const tag = new ProductProductTagPage(page);
    await tag.gotoEdit(TAG_EDIT_ID);
    // 編集モードのページャは admin_product_tag_edit_page（/product/tag/{id}/page/{n}・編集対象IDを保持）。
    const pageLinks = page.locator(`a[href*="/product/tag/${TAG_EDIT_ID}/page/"]`);
    if ((await pageLinks.count()) > 0) {
      await expect(pageLinks.first()).toBeVisible();
    } else {
      test.skip(true, "タグが1ページに収まりページャ未表示（>表示件数のタグが必要）");
    }
  });

  // ===== 必須未入力の検証失敗（要確認: HTML5 required で操作経路がクライアント遮断される） =====
  // 名称(日)/名称(英)/並び順は required 属性付き・form に novalidate が無いため、未入力での「登録」押下は
  // ブラウザのネイティブ検証で POST が遮断され、サーバ側フラッシュ「登録できませんでした。」/フィールド検証
  // メッセージに到達しない（操作経路がオラクル以前に成立しない）。サーバ側検証の確認にはネイティブ検証の
  // バイパスが必要なため、実機での挙動確認まで fixme（要確認）で残す。期待は仕様(判定順序#1 検証失敗→
  // admin.register.failed / Controller.php:120)由来。フィールド検証文言(NotBlank)はオラクル化しない。

  test.fixme(
    "E2E-M03-13-030 名称(日)未入力で登録→失敗（要確認: HTML5 required がクライアント遮断するためサーバ側フラッシュ未到達）",
    async () => {
      // 期待は仕様(判定順序#1 検証失敗→admin.register.failed「登録できませんでした。」)由来。
    }
  );
  test.fixme(
    "E2E-M03-13-031 名称(日)未入力で登録→必須エラー表示・同ページ滞留（要確認: HTML5 required／フィールド文言はオラクル化しない）",
    async () => {
      // 期待は仕様(判定順序#1 検証失敗→同テンプレ再描画＋フィールド検証エラー表示)由来。
      // NotBlank の固定文言(validators.ja.yaml)は実装翻訳由来のため期待値に固定しない。
    }
  );
  test.fixme(
    "E2E-M03-13-032 名称(英)未入力で登録→失敗（要確認: HTML5 required がクライアント遮断）",
    async () => {
      // 期待は仕様(判定順序#1 検証失敗→admin.register.failed)由来。
    }
  );
  test.fixme(
    "E2E-M03-13-033 並び順未入力で登録→失敗（要確認: HTML5 required がクライアント遮断）",
    async () => {
      // 期待は仕様(判定順序#1 検証失敗→admin.register.failed)由来。
    }
  );

  // ===== 文字列長の検証失敗（非破壊。必須充足で POST 到達→サーバ側 Length 検証で再描画） =====

  test("E2E-M03-13-034 名称(日)256文字で登録→文字列長エラー・保存されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const tag = new ProductProductTagPage(page);
    await tag.gotoNew();
    await tag.submitRequired("あ".repeat(256), "valid_en", "1"); // 上限255超過（設計値）
    await expect(tag.fieldError).toBeVisible();
    await expect(page.locator("body")).not.toContainText(REGISTER_COMPLETE); // 保存されない
  });

  test("E2E-M03-13-035 タイトル(日)256文字で登録→文字列長エラー・保存されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const tag = new ProductProductTagPage(page);
    await tag.gotoNew();
    await tag.accordionToggle.click();
    await tag.titleJpInput.fill("あ".repeat(256)); // 上限255超過（設計値）
    await tag.submitRequired("valid_ja", "valid_en", "1");
    await expect(tag.fieldError).toBeVisible();
    await expect(page.locator("body")).not.toContainText(REGISTER_COMPLETE);
  });

  test("E2E-M03-13-036 説明(日)4001文字で登録→文字列長エラー・保存されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const tag = new ProductProductTagPage(page);
    await tag.gotoNew();
    await tag.accordionToggle.click();
    await tag.descriptionJpInput.fill("あ".repeat(4001)); // 上限4000超過（設計値）
    await tag.submitRequired("valid_ja", "valid_en", "1");
    await expect(tag.fieldError).toBeVisible();
    await expect(page.locator("body")).not.toContainText(REGISTER_COMPLETE);
  });

  test.fixme(
    "E2E-M03-13-037 並び順に非数値を入力して登録→保存されない（要確認: #tag_sortNo は number input のため非数値を fill できず操作経路が成立しない）",
    async () => {
      // 設計: 並び順は整数（IntegerType → input[type=number]）。
      // number input には Playwright の fill('abc') が通らず（ブラウザが非数値を保持しない）、
      // 「非数値を入力して送信」という操作自体が成立しない。クライアント制約／キー入力での
      // 確認方法は実機で要確認。期待は仕様(並び順は整数)由来。
    }
  );

  test("E2E-M03-13-046 名称(英)256文字で登録→文字列長エラー・保存されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const tag = new ProductProductTagPage(page);
    await tag.gotoNew();
    await tag.submitRequired("valid_ja", "a".repeat(256), "1"); // 名称(英)上限255超過（設計値。034の対）
    await expect(tag.fieldError).toBeVisible();
    await expect(page.locator("body")).not.toContainText(REGISTER_COMPLETE); // 保存されない
  });

  test("E2E-M03-13-038 タイトル(英)256文字で登録→文字列長エラー・保存されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const tag = new ProductProductTagPage(page);
    await tag.gotoNew();
    await tag.accordionToggle.click();
    await tag.titleEnInput.fill("a".repeat(256)); // 上限255超過（設計値）
    await tag.submitRequired("valid_ja", "valid_en", "1");
    await expect(tag.fieldError).toBeVisible();
    await expect(page.locator("body")).not.toContainText(REGISTER_COMPLETE);
  });

  test("E2E-M03-13-039 説明(英)4001文字で登録→文字列長エラー・保存されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const tag = new ProductProductTagPage(page);
    await tag.gotoNew();
    await tag.accordionToggle.click();
    await tag.descriptionEnInput.fill("a".repeat(4001)); // 上限4000超過（設計値）
    await tag.submitRequired("valid_ja", "valid_en", "1");
    await expect(tag.fieldError).toBeVisible();
    await expect(page.locator("body")).not.toContainText(REGISTER_COMPLETE);
  });

  // ===== 削除（UI） =====

  test("E2E-M03-13-050 一覧の各行に削除ボタンが無い（編集ボタンのみ・削除はルートのみ）", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const tag = new ProductProductTagPage(page);
    await tag.gotoNew();
    // 仕様: 削除は画面にボタンが無くルートのみ存在。行のアクションは「編集」のみ。
    await expect(page.locator("tr.sortable-item a", { hasText: "削除" })).toHaveCount(0);
  });

  // ===== 保留（破壊的＝DB登録/更新・要シード。手動/対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M03-13-040 必須3項目入力で新規登録成功→「登録が完了しました。」＋一覧へリダイレクト（要: 作成タグの後始末）",
    async () => {
      // 期待は仕様(処理フロー#6 成功時 admin.register.complete＋admin_product_tag リダイレクト / Controller.php:150-152)由来。
    }
  );
  test.fixme(
    "E2E-M03-13-041 既存タグ更新成功→「登録が完了しました。」（要: 使い捨て編集対象シード TAG_EDIT_ID）",
    async () => {
      // 期待は仕様(処理フロー 更新成功→admin.register.complete / Controller.php:150)由来。後勝ち更新で復元すること。
    }
  );
  test.fixme(
    "E2E-M03-13-042 新規タグに優先表示商品コードのみ入力→規格解決失敗の例外メッセージ・同ページ（rollback）（要: 商品コード）",
    async () => {
      // 期待は仕様(判定順序#4＋エラー処理 admin.error.not_exist_code / TagStoreAction.php:62)由来。
      // 新規タグはまだ商品に付いていないため規格解決に失敗し例外＝同テンプレ再描画。
    }
  );
  test.fixme(
    "E2E-M03-13-045 名称(日)255文字ちょうどで保存成功（境界内・要: 作成タグの後始末）",
    async () => {
      // 期待は仕様(バリデーション 名称(日) 最大255 境界内)由来。成功フラッシュ「登録が完了しました。」。
    }
  );
  test.fixme(
    "E2E-M03-13-047 名称(英)255文字ちょうどで保存成功（境界内・045の対・要: 作成タグの後始末）",
    async () => {
      // 期待は仕様(バリデーション 名称(英) 最大255 境界内)由来。成功フラッシュ「登録が完了しました。」。
    }
  );
  test.fixme(
    "E2E-M03-13-043 登録成功後リダイレクトURLにクエリidが付与され遷移後フォームは新規空（不具合候補#2・要: 作成タグの後始末）",
    async () => {
      // 期待は仕様(画面遷移 登録成功→admin_product_tag リダイレクト・遷移時に引き継ぐ状態:
      // ルートに{id}が無いためクエリidだけでは行解決されずフォームは新規空)由来。
    }
  );
  test.fixme(
    "E2E-M03-13-044 優先表示商品に有効コードで登録成功→dtb_tag_sort作成（042異常系の対・要: 紐付けシード）",
    async () => {
      // 期待は仕様(判定順序#4-5 規格解決成功→rank付きinsert＋commit→admin.register.complete)由来。
      // 有効コードは「当該タグ付き商品の表示中規格コード」。042(新規タグで規格解決失敗)の正常系の対。
    }
  );
  test.fixme(
    "E2E-M03-13-051 商品紐付けありタグのDELETE削除→「商品で使用されているため…削除できません」一覧へ戻る（要: CSRF＋紐付けシード）",
    async () => {
      // 期待は仕様(処理フロー(削除)#2 admin.tag.delete.failed / Controller.php:170-177)由来。
      // DELETEメソッド＋isTokenValid のため fetch/フォーム経由でトークン付与が必要。
    }
  );
  test.fixme(
    "E2E-M03-13-052 商品紐付けなしタグのDELETE削除→削除成功・タグ管理へリダイレクト（要: CSRF＋使い捨てタグ）",
    async () => {
      // 期待は仕様(処理フロー(削除)#3 紐付けなし→タグ本体＋dtb_tag_sort削除→リダイレクト)由来。
      // DELETEメソッド＋isTokenValid のためトークン付与が必要。破壊的＝使い捨てタグで実施。
    }
  );
  // 注: E2E-M03-13-023(deny_url 403=要ロールシード) / 053(削除時FK違反=DB制約誘発) /
  // 054(削除の無効CSRF=フレームワーク内部挙動) / 055(その他保存例外=DB例外誘発) /
  // 060,061,062,063,064(dtb_tag_sort/セッションのDB内部値) は手動/間接・要確認のため
  // ケース表(付帯表)で全量管理し spec には残さない（規約: 手動/対象外は spec に残さない）。
});
