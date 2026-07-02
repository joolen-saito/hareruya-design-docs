/**
 * 管理画面 カード管理 > カードセット 新規登録/編集/削除 E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m14_08_admin_card_cardset_register_update_delete_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」（実装済み）と、自動化予定だが未実装/要実機・破壊的シード前提の test.fixme のみを残す。
 * 手動/間接（永続値の厳密検証・シンボルストレージ・session保持）と対象外はケース表で全量管理し、specに大量のfixmeを残さない。
 * 期待結果は仕様(m14-08_admin_card_cardset_register_update_delete.md / integration-test-viewpoints.md)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 重要(仕様乖離): 設計書は pf-eccube3 / HareruyaEc プラグインのリバース。刷新先 ec-cube-enterprise では
 *  - 送信ボタンは新規/編集とも「登録」(admin.common.registration)。設計の編集「更新」とは乖離(付帯表4#1)
 *  - 成功フラッシュは admin.common.save_complete「保存しました」。設計の登録完了文言とは乖離(#2)。テストはフラッシュ表示＋編集画面遷移を観測し文言は固定しない
 *  - 更新POSTは /cardset/{id}/edit・/cardset/new（GET/POST兼用）。設計の /cardset/edit 単一ルートとは乖離(#3)
 *  - 削除は DELETE /product/cardset/{id}/delete（設計 /cardset/{id}/delete と乖離#4）。削除不可はFK例外catch→一覧へ(#5,#6)
 *  - 並び順rank/カテゴリ/各種フラグ/symbol hidden 等の入力項目が刷新先フォームに無い(#7)。該当観点はケース表で対象外/要確認
 *  - リリース日は DateType(年/月/日 select)(#8)、削除は専用モーダル #DeleteModal(#9)
 * いずれも付帯表4で管理し、テストは仕様どおりの観測（登録/更新成功で編集画面へ・検証失敗で滞留・削除可否）を期待する。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の
 * spec/admin/login.spec.ts・two_factor_auth.spec.ts も @playwright/test を直接使う。本specもこれに倣い
 * @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行ゲート（環境変数。コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（管理者ログイン）= HAS_CREDS
 *  - CARDSET_ID            : 収録カード0件の既存カードセット（編集表示/更新/削除モーダル表示に使用）
 *  - CARDSET_WITH_CARDS_ID : 収録カード1件以上のカードセット（削除不可確認）
 *  - 破壊的な削除成功(031)は使い捨てカードセット前提のため test.fixme で保留
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { CardCardsetRegisterUpdateDeletePage } from "../../../pages/admin/m14/m14_08_admin_card_cardset_register_update_delete.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);
const CARDSET_ID = process.env.CARDSET_ID || "";
const HAS_CARDSET = HAS_CREDS && !!CARDSET_ID;
const CARDSET_WITH_CARDS_ID = process.env.CARDSET_WITH_CARDS_ID || "";
const HAS_CARDSET_WITH_CARDS = HAS_CREDS && !!CARDSET_WITH_CARDS_ID;

// 仕様(設計書/messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const PAGE_TITLE = "カードセット詳細"; // admin.card.cardset_registration :4199
const DELETE_HAS_CARDS = "削除することができません"; // admin.card.cardset.error.delete_has_cards :4212（部分一致で観測）

const EDIT_RE = /\/cardset\/\d+\/edit(\?|$)/;
// 一覧URL: 設計は /cardset/{page_no}?resume=1（付帯表4#6）、刷新先は /cardset。
// 仕様（戻る→一覧）を満たす両形を許容し、実装ルートへ固定しない。
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/cardset(/\\d+|/page/\\d+)?(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
}

/** 一意な識別子（撤去用接頭辞 E2E_ を付ける）。 */
function uniqueSuffix(): string {
  return Date.now().toString().slice(-8);
}

test.describe("管理画面 > カードセット 新規登録/編集/削除", { tag: ["@admin", "@card"] }, () => {
  // ===== 認証不要・非破壊（常時実行可） =====

  test("E2E-M14-08-050 未ログインで新規URL直接→管理ログイン画面へ誘導", async ({ page }) => {
    // 期待は仕様(利用者視点の入口: 未ログインは管理ログイン誘導)由来。
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/cardset/new`);
    await expect(page.locator("#login_id")).toBeVisible();
    await expect(page).toHaveURL(LOGIN_RE);
  });

  test("E2E-M14-08-051 未ログインで編集URL直接→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/cardset/1/edit`);
    await expect(page.locator("#login_id")).toBeVisible();
    await expect(page).toHaveURL(LOGIN_RE);
  });

  // ===== 新規フォーム表示・登録（HAS_CREDS） =====

  test("E2E-M14-08-001 新規フォームに必須項目・登録ボタンが表示され削除導線が無い", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const cs = new CardCardsetRegisterUpdateDeletePage(page);
    await cs.gotoNew();
    await cs.seeNewForm();
  });

  test("E2E-M14-08-002 カードセット詳細のページタイトルが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const cs = new CardCardsetRegisterUpdateDeletePage(page);
    await cs.gotoNew();
    await expect(page.locator("body")).toContainText(PAGE_TITLE);
  });

  test("E2E-M14-08-004 新規フォームにブロック選択・特殊セット・シンボル画像入力欄が表示される", async ({ page }) => {
    // 期待は仕様(フロント挙動: ブロックプルダウン・チェックボックス・シンボルファイル)由来。
    // 刷新先に存在する入力部品のみ観測。欠落項目(rank/カテゴリ/各フラグ/symbol hidden)は付帯表4#7で実装側へ差し戻し。
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const cs = new CardCardsetRegisterUpdateDeletePage(page);
    await cs.gotoNew();
    await expect(cs.cardsetblock).toBeVisible();
    await expect(cs.specialFlg).toBeVisible();
    await expect(cs.symbolImageFile).toBeVisible();
  });

  test("E2E-M14-08-012 英語名未入力で登録→登録されず新規フォームに留まる", async ({ page }) => {
    // 期待は仕様(入力項目: 英語名 必須／エラー処理: 検証失敗→詳細テンプレ再描画)由来。
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const cs = new CardCardsetRegisterUpdateDeletePage(page);
    await cs.gotoNew();
    const sfx = uniqueSuffix();
    await cs.nameJp.fill(`E2E_${sfx}`);
    await cs.code.fill(`E2E${sfx}`);
    await cs.releaseYear.selectOption({ index: 1 });
    await cs.releaseMonth.selectOption({ index: 1 });
    await cs.releaseDay.selectOption({ index: 1 });
    // 英語名は空のまま送信
    await cs.submit();
    // 仕様(英語名 必須／検証失敗→再描画)由来。滞留先URLは実装ルート(付帯表4#3)に依存するため固定しない。
    await expect(page).not.toHaveURL(EDIT_RE); // 登録されない
    await expect(cs.registerButton).toBeVisible(); // 入力フォームに留まる
  });

  test("E2E-M14-08-026 英語名 最大長+1(65)→文字列長エラーで登録されず新規フォームに留まる", async ({ page }) => {
    // 期待は仕様(英語名 最大長64・境界外は不可)由来。境界の正は設計書(64文字)。
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const cs = new CardCardsetRegisterUpdateDeletePage(page);
    await cs.gotoNew();
    const sfx = uniqueSuffix();
    const name65 = ("E2E_" + sfx).padEnd(65, "x").slice(0, 65);
    await cs.fillValidRequired({ nameJp: `E2E_${sfx}`, nameEn: name65, code: `E2E${sfx}` });
    await cs.submit();
    // 仕様(英語名 最大長64・境界外は不可／検証失敗→再描画)由来。滞留先URLは固定しない(付帯表4#3)。
    await expect(page).not.toHaveURL(EDIT_RE); // 文字列長エラーで登録されない
    await expect(cs.registerButton).toBeVisible(); // 入力フォームに留まる
  });

  test("E2E-M14-08-010 新規登録成功: 必須入力し登録→編集画面へ遷移し成功フラッシュ", async ({ page }) => {
    // 期待は仕様(処理フロー: isValid→persist→admin_cardset_edit へ redirect＋成功フラッシュ)由来。
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const cs = new CardCardsetRegisterUpdateDeletePage(page);
    await cs.gotoNew();
    const sfx = uniqueSuffix();
    await cs.fillValidRequired({ nameJp: `E2E_${sfx}`, nameEn: `E2E_${sfx}`, code: `E2E${sfx}` });
    await cs.submit();
    await expect(page).toHaveURL(EDIT_RE); // 採番IDの編集画面へ遷移
    await expect(page.locator(".alert")).toBeVisible(); // 成功フラッシュ（文言は付帯表4#2: 仕様の成功表示をオラクル化、文言固定せず）
  });

  test("E2E-M14-08-025 日本語名 最大長(64)で正常登録され編集画面へ遷移する（境界内）", async ({ page }) => {
    // 期待は仕様(カードセット名 最大長64・境界内は登録可)由来。最大長の正は設計書(64文字)。
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const cs = new CardCardsetRegisterUpdateDeletePage(page);
    await cs.gotoNew();
    const sfx = uniqueSuffix();
    const name64 = ("E2E_" + sfx).padEnd(64, "x").slice(0, 64);
    await cs.fillValidRequired({ nameJp: name64, nameEn: `E2E_${sfx}`, code: `E2E${sfx}` });
    await cs.submit();
    await expect(page).toHaveURL(EDIT_RE); // 境界内は登録成功
  });

  test("E2E-M14-08-020 日本語名未入力で登録→登録されず新規フォームに留まる", async ({ page }) => {
    // 期待は仕様(入力項目: 日本語名 必須／エラー処理: 検証失敗→詳細テンプレ再描画)由来。
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const cs = new CardCardsetRegisterUpdateDeletePage(page);
    await cs.gotoNew();
    const sfx = uniqueSuffix();
    await cs.nameEn.fill(`E2E_${sfx}`);
    await cs.code.fill(`E2E${sfx}`);
    await cs.releaseYear.selectOption({ index: 1 });
    await cs.releaseMonth.selectOption({ index: 1 });
    await cs.releaseDay.selectOption({ index: 1 });
    await cs.submit();
    // 仕様(画面遷移: 検証失敗→同テンプレ再描画/採番IDの編集画面へ遷移しない)由来。
    // 滞留先URL(/cardset/new 等)は実装ルート(付帯表4#3)に依存するため固定しない。
    await expect(page).not.toHaveURL(EDIT_RE); // 採番IDの編集画面へ遷移しない＝登録されない
    await expect(cs.registerButton).toBeVisible(); // 入力フォームに留まる
  });

  test("E2E-M14-08-021 略称未入力で登録→登録されず新規フォームに留まる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const cs = new CardCardsetRegisterUpdateDeletePage(page);
    await cs.gotoNew();
    const sfx = uniqueSuffix();
    await cs.nameJp.fill(`E2E_${sfx}`);
    await cs.nameEn.fill(`E2E_${sfx}`);
    await cs.releaseYear.selectOption({ index: 1 });
    await cs.releaseMonth.selectOption({ index: 1 });
    await cs.releaseDay.selectOption({ index: 1 });
    await cs.submit();
    // 仕様(略称 必須／検証失敗→再描画)由来。滞留先URLは実装ルート依存(付帯表4#3)で固定しない。
    await expect(page).not.toHaveURL(EDIT_RE); // 登録されない
    await expect(cs.registerButton).toBeVisible(); // 入力フォームに留まる
  });

  test("E2E-M14-08-023 略称に全角文字→半角のみエラーで登録されず新規フォームに留まる", async ({ page }) => {
    // 期待は仕様(入力項目: 略称 半角ASCIIのみ)由来。
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const cs = new CardCardsetRegisterUpdateDeletePage(page);
    await cs.gotoNew();
    const sfx = uniqueSuffix();
    await cs.fillValidRequired({ nameJp: `E2E_${sfx}`, nameEn: `E2E_${sfx}`, code: "あいう" });
    await cs.submit();
    // 仕様(略称 半角ASCIIのみ／検証失敗→再描画)由来。滞留先URLは固定しない(付帯表4#3)。
    await expect(page).not.toHaveURL(EDIT_RE); // 文字種エラーで登録されない
    await expect(cs.registerButton).toBeVisible(); // 入力フォームに留まる
  });

  test("E2E-M14-08-024 日本語名 最大長+1(65)→文字列長エラーで登録されず新規フォームに留まる", async ({ page }) => {
    // 期待は仕様(カードセット名 最大長64・境界外は不可)由来。境界の正は設計書。
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const cs = new CardCardsetRegisterUpdateDeletePage(page);
    await cs.gotoNew();
    const sfx = uniqueSuffix();
    const name65 = ("E2E_" + sfx).padEnd(65, "x").slice(0, 65);
    await cs.fillValidRequired({ nameJp: name65, nameEn: `E2E_${sfx}`, code: `E2E${sfx}` });
    await cs.submit();
    // 仕様(カードセット名 最大長64・境界外は不可／検証失敗→再描画)由来。滞留先URLは固定しない(付帯表4#3)。
    await expect(page).not.toHaveURL(EDIT_RE); // 文字列長エラーで登録されない
    await expect(cs.registerButton).toBeVisible(); // 入力フォームに留まる
  });

  test("E2E-M14-08-040 存在しないIDの編集GET→404", async ({ page }) => {
    // 期待は仕様(エラー処理: 編集GETで存在しない→404)由来。
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/cardset/999999999/edit`);
    expect(res?.status()).toBe(404);
  });

  test("E2E-M14-08-060 戻る導線でカードセット一覧へ遷移する", async ({ page }) => {
    // 期待は仕様(画面遷移: フッタ戻る→一覧)由来。
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const cs = new CardCardsetRegisterUpdateDeletePage(page);
    await cs.gotoNew();
    await cs.backToList.first().click();
    await expect(page).toHaveURL(LIST_RE); // カードセット一覧へ
  });

  // ===== 編集表示・更新・削除モーダル（HAS_CARDSET = 収録カード0件の既存カードセット） =====

  test("E2E-M14-08-003 編集フォームに既存値・削除導線・収録カードリストが表示される", async ({ page }) => {
    test.skip(!HAS_CARDSET, "HAS_CREDS かつ CARDSET_ID 未設定");
    await login(page);
    const cs = new CardCardsetRegisterUpdateDeletePage(page);
    await cs.gotoEdit(CARDSET_ID);
    await expect(page).toHaveURL(EDIT_RE);
    await cs.seeEditForm(); // 既存値の入力欄・削除導線・収録カードリスト見出し
  });

  test("E2E-M14-08-011 更新成功: 日本語名を変更し登録→編集画面へ遷移し成功フラッシュ", async ({ page }) => {
    // 期待は仕様(処理フロー: 更新→admin_cardset_edit へ redirect＋成功フラッシュ)由来。
    test.skip(!HAS_CARDSET, "HAS_CREDS かつ CARDSET_ID 未設定");
    await login(page);
    const cs = new CardCardsetRegisterUpdateDeletePage(page);
    await cs.gotoEdit(CARDSET_ID);
    const newName = `E2E更新_${uniqueSuffix()}`;
    await cs.nameJp.fill(newName);
    await cs.submit();
    await expect(page).toHaveURL(EDIT_RE); // 同IDの編集画面へ
    await expect(page.locator(".alert")).toBeVisible(); // 成功フラッシュ（文言は付帯表4#2）
    await expect(cs.nameJp).toHaveValue(newName); // 更新値が再描画に反映（間接DB確認）
  });

  test("E2E-M14-08-013 編集で日本語名を空にして更新→更新されず編集フォームに留まる", async ({ page }) => {
    // 期待は仕様(エラー処理: 検証失敗→同テンプレ再描画／処理フロー: 編集POST isValid偽でcardlist再取得)由来。
    // 編集固有フロー(hidden ID・既存値・収録リスト再取得 設計md:73)の異常対。検証失敗のため永続化されず非破壊。
    test.skip(!HAS_CARDSET, "HAS_CREDS かつ CARDSET_ID 未設定");
    await login(page);
    const cs = new CardCardsetRegisterUpdateDeletePage(page);
    await cs.gotoEdit(CARDSET_ID);
    await cs.nameJp.fill("");
    await cs.submit();
    // 更新成功(編集確定の成功フラッシュ)とならず、同一編集テンプレートに留まる。
    await expect(cs.registerButton).toBeVisible(); // 編集フォームに留まる
    await expect(cs.cardListHeading.first()).toBeVisible(); // 収録カードリストが引き続き表示
    await expect(cs.nameJp).toHaveValue(""); // 送信した未入力値が再描画に保持＝更新確定していない
  });

  test("E2E-M14-08-030 削除導線押下で確認ダイアログ（削除モーダル）が表示される", async ({ page }) => {
    // 期待は仕様(削除前確認)由来。設計は「モーダル無し」だが刷新先はモーダルあり（付帯表4#9）。
    test.skip(!HAS_CARDSET, "HAS_CREDS かつ CARDSET_ID 未設定");
    await login(page);
    const cs = new CardCardsetRegisterUpdateDeletePage(page);
    await cs.gotoEdit(CARDSET_ID);
    await cs.openDeleteModal();
    await expect(cs.deleteModal).toBeVisible();
    await expect(cs.deleteConfirm).toBeVisible();
  });

  // ===== 削除不可（HAS_CARDSET_WITH_CARDS = 収録カード1件以上） =====

  test("E2E-M14-08-032 収録カードありの削除はエラーとなり削除されない", async ({ page }) => {
    // 期待は仕様(業務ルール: 子カード有無で削除可否／エラー処理: 削除で子カード存在)由来。
    // 刷新先はFK例外catch→一覧へ（付帯表4#5）。日本語文言は設計と一致。
    test.skip(!HAS_CARDSET_WITH_CARDS, "HAS_CREDS かつ CARDSET_WITH_CARDS_ID 未設定");
    await login(page);
    const cs = new CardCardsetRegisterUpdateDeletePage(page);
    await cs.gotoEdit(CARDSET_WITH_CARDS_ID);
    await cs.confirmDelete();
    await expect(page.locator("body")).toContainText(DELETE_HAS_CARDS); // 削除不可エラー
    // 当該カードセットが残存することの再確認（編集画面が引き続き開ける＝削除されていない）。
    const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/cardset/${CARDSET_WITH_CARDS_ID}/edit`);
    expect(res?.status()).toBe(200);
  });

  // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M14-08-022 リリース日未選択で登録→検証エラーで滞留（要実機: DateType select の未選択送信挙動を確認）",
    async () => {
      // 期待は仕様(入力項目: リリース日 必須)由来。DateType の空送信(年/月/日 未選択)がサーバ検証へ到達するか実機確認後に実装。
    }
  );

  test.fixme(
    "E2E-M14-08-031 収録カード0件のカードセット削除成功→一覧へ遷移し成功フラッシュ（破壊的・使い捨てカードセット要）",
    async () => {
      // 期待は仕様(処理フロー: remove→delete_complete→一覧)由来。使い捨てカードセット(SEED-M14-08-CARDSET-DISPOSABLE)投入後に実装。
    }
  );
});
