/**
 * 管理画面 在庫分割結合登録/編集 E2E。納品ケース表
 * integration_test/e2e/m04_13_admin_stock_stock_split_join_register_edit_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装し、破壊的/deep要シードの 010・050・053・060・070 は test.fixme（理由付き）。
 * 043（結合編集/承認/欠品入力の未認証ガード）は資格情報・シード不要のため 040-042 と同様に実装する。
 * 手動/間接（承認申請・承認・却下・欠品入力遷移・Ajax・CSV・メール）はケース表で全量管理し、
 * specに大量のfixmeを残さない（規約準拠）。
 * 期待結果は仕様（設計書 functions/ec-cube-enterprise/m04-13_admin_stock_stock_split_join_register_edit.md /
 * 観点表 / messages.ja.yaml）由来（オラクル独立性）。実装の現挙動・Form制約値（min/max/required）を期待値に流用しない。
 * 本機能は新規実装でありリバース元(pf-eccube3)に相当機能は無い。仕様乖離はケース表 付帯表4 に分離する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 *
 * シード（環境変数。コミットしない）:
 *  - SPLIT_SRC_ID : SEED-M04-13-SPLIT-SRC（ログイン者が編集権限を持つ店舗・在庫数>0 の分割元 productStockId）
 *  - JOIN_DEST_ID : SEED-M04-13-JOIN-DEST（ログイン者が編集権限を持つ店舗の結合先 productStockId）
 *  - NOPERM_ID    : SEED-M04-13-NOPERM（ログイン者が編集権限を持たない店舗の productStockId）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockStockSplitJoinRegisterEditPage } from "../../../pages/admin/m04/m04_13_admin_stock_stock_split_join_register_edit.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const SPLIT_SRC_ID = process.env.SPLIT_SRC_ID || "";
// 分割元在庫数（SEED-M04-13-SPLIT-SRC 由来。シードDBの真値）。在庫超過値の生成に用いる。
// Form/Twig の max 属性（実装値）からは算出しない（オラクル独立性）。
const SPLIT_SRC_STOCK = process.env.SPLIT_SRC_STOCK || "";
const JOIN_DEST_ID = process.env.JOIN_DEST_ID || "";
const NOPERM_ID = process.env.NOPERM_ID || "";
const HAS_SPLIT = HAS_CREDS && !!SPLIT_SRC_ID;
const HAS_JOIN = HAS_CREDS && !!JOIN_DEST_ID;
const HAS_NOPERM = HAS_CREDS && !!NOPERM_ID;

// URLアサーションは管理ルート（仕様の入口URL）込みでアンカーし、別画面/誤パスの部分一致を防ぐ。
const HOME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/?(\\?|$)`);
const SPLIT_NEW_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/stock/\\d+/split/new(\\?|$)`);
const SPLIT_EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/stock/split/\\d+/edit(\\?|$)`);
const JOIN_NEW_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/stock/\\d+/join/new(\\?|$)`);
const JOIN_EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/stock/join/\\d+/edit(\\?|$)`);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const SPLIT_REGISTER_COMPLETE = "在庫分割を登録しました。"; // :4698
const SPLIT_QUANTITY_MIN = "分割数は1以上を入力してください。"; // :4695
const SPLIT_QUANTITY_EXCEEDS = "分割数が在庫数を超えています。"; // :4697
const SPLIT_NOT_EDITABLE = "この店舗の在庫を編集する権限がありません。"; // :4748
const SPLIT_DESTINATION_REQUIRED = "分割先を1件以上追加してください。"; // :4699
const JOIN_REGISTER_COMPLETE = "在庫結合を開始しました。"; // :4789
const JOIN_DEST_STOCK_MIN = "結合先在庫数に1以上を入力してください。"; // :4753
const JOIN_NOT_EDITABLE = "この店舗の在庫を編集する権限がありません。"; // :4872

/** 管理ログインしてホームへ到達する。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).toHaveURL(HOME_RE);
}

test.describe("管理画面 > 在庫分割結合登録/編集", { tag: ["@admin", "@stock"] }, () => {
  // ===== 未認証ガード（資格情報不要・常時実行可） =====

  test("E2E-M04-13-040 未ログインで分割新規URL→管理ログイン画面へ誘導", async ({ page }) => {
    const target = new StockStockSplitJoinRegisterEditPage(page);
    await page.goto(target.splitNewUrl(1));
    await expect(page.locator("#login_id")).toBeVisible();
  });

  test("E2E-M04-13-041 未ログインで結合新規URL→管理ログイン画面へ誘導", async ({ page }) => {
    const target = new StockStockSplitJoinRegisterEditPage(page);
    await page.goto(target.joinNewUrl(1));
    await expect(page.locator("#login_id")).toBeVisible();
  });

  test("E2E-M04-13-042 未ログインで分割編集・承認URL→管理ログイン画面へ誘導", async ({ page }) => {
    const target = new StockStockSplitJoinRegisterEditPage(page);
    await page.goto(target.splitEditUrl(1));
    await expect(page.locator("#login_id")).toBeVisible();
    await page.goto(target.splitApprovalUrl(1));
    await expect(page.locator("#login_id")).toBeVisible();
  });

  test("E2E-M04-13-043 未ログインで結合編集・承認・欠品入力URL→管理ログイン画面へ誘導", async ({ page }) => {
    // 設計書「利用者視点の入口」=全エンドポイントが管理ログイン必須。分割側(042)に対する結合側の未認証ガード。
    const target = new StockStockSplitJoinRegisterEditPage(page);
    await page.goto(target.joinEditUrl(1));
    await expect(page.locator("#login_id")).toBeVisible();
    await page.goto(target.joinApprovalUrl(1));
    await expect(page.locator("#login_id")).toBeVisible();
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock/join/1/shortage-entry`);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  // ===== 分割新規画面（SEED-M04-13-SPLIT-SRC） =====

  test("E2E-M04-13-001 分割新規画面: 分割元商品・分割数入力欄・保存ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_SPLIT, "SEED-M04-13-SPLIT-SRC 未設定（ECCUBE_ADMIN_USER/PASS・SPLIT_SRC_ID）");
    await loginToHome(page);
    const target = new StockStockSplitJoinRegisterEditPage(page);
    await target.gotoSplitNew(SPLIT_SRC_ID);
    await target.seeSplitNewForm();
  });

  test("E2E-M04-13-002 分割新規画面: 分割数欄に必須バッジ「必須」が表示される", async ({ page }) => {
    test.skip(!HAS_SPLIT, "SEED-M04-13-SPLIT-SRC 未設定");
    await loginToHome(page);
    const target = new StockStockSplitJoinRegisterEditPage(page);
    await target.gotoSplitNew(SPLIT_SRC_ID);
    await expect(target.splitRequiredBadge).toBeVisible();
  });

  test("E2E-M04-13-011 分割数が在庫数を超えると在庫超過メッセージで滞留", async ({ page }) => {
    test.skip(!HAS_SPLIT, "SEED-M04-13-SPLIT-SRC 未設定");
    await loginToHome(page);
    const target = new StockStockSplitJoinRegisterEditPage(page);
    await target.gotoSplitNew(SPLIT_SRC_ID);
    // 在庫超過値はシードDBの在庫数（SPLIT_SRC_STOCK）+1。未供給時はどの在庫数も確実に超える番兵値。
    // Form/Twig の max 属性（実装値）はオラクルにもテストデータ生成にも流用しない（不具合候補#2）。
    // クライアント側max検証は submitSplitRegisterServerSide が属性除去で回避しサーバ側判定を観測する。
    const over = SPLIT_SRC_STOCK ? String(Number(SPLIT_SRC_STOCK) + 1) : "999999999";
    await target.submitSplitRegisterServerSide(over);
    await expect(target.errorFlash).toContainText(SPLIT_QUANTITY_EXCEEDS);
    await expect(page).toHaveURL(SPLIT_NEW_RE);
  });

  test("E2E-M04-13-012 分割数が1未満だと最小値エラーで滞留", async ({ page }) => {
    test.skip(!HAS_SPLIT, "SEED-M04-13-SPLIT-SRC 未設定");
    await loginToHome(page);
    const target = new StockStockSplitJoinRegisterEditPage(page);
    await target.gotoSplitNew(SPLIT_SRC_ID);
    await target.submitSplitRegisterServerSide("0");
    await expect(target.errorFlash).toContainText(SPLIT_QUANTITY_MIN);
    await expect(page).toHaveURL(SPLIT_NEW_RE);
  });

  test("E2E-M04-13-013 編集権限のない店舗の分割登録で権限エラー", async ({ page }) => {
    test.skip(!HAS_NOPERM, "SEED-M04-13-NOPERM 未設定（NOPERM_ID）");
    await loginToHome(page);
    const target = new StockStockSplitJoinRegisterEditPage(page);
    await target.gotoSplitNew(NOPERM_ID);
    await target.submitSplitRegister("1");
    await expect(target.errorFlash).toContainText(SPLIT_NOT_EDITABLE);
  });

  // ===== 結合新規画面（SEED-M04-13-JOIN-DEST） =====

  test("E2E-M04-13-020 結合新規画面: 結合先商品・結合数入力欄・保存ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_JOIN, "SEED-M04-13-JOIN-DEST 未設定（JOIN_DEST_ID）");
    await loginToHome(page);
    const target = new StockStockSplitJoinRegisterEditPage(page);
    await target.gotoJoinNew(JOIN_DEST_ID);
    await target.seeJoinNewForm();
  });

  test("E2E-M04-13-021 結合新規画面: 結合数欄に必須バッジ「必須」が表示される", async ({ page }) => {
    test.skip(!HAS_JOIN, "SEED-M04-13-JOIN-DEST 未設定");
    await loginToHome(page);
    const target = new StockStockSplitJoinRegisterEditPage(page);
    await target.gotoJoinNew(JOIN_DEST_ID);
    await expect(target.joinRequiredBadge).toBeVisible();
  });

  test("E2E-M04-13-030 結合登録成功で編集画面へ遷移し開始メッセージ表示", async ({ page }) => {
    test.skip(!HAS_JOIN, "SEED-M04-13-JOIN-DEST 未設定");
    // 結合登録は在庫操作なし（成功時は dtb_stock_split_join のNEWレコードを作成）。生成レコードは使い捨てシードで撤去。
    await loginToHome(page);
    const target = new StockStockSplitJoinRegisterEditPage(page);
    await target.gotoJoinNew(JOIN_DEST_ID);
    await target.submitJoinRegister("1");
    await expect(page).toHaveURL(JOIN_EDIT_RE); // 結合編集画面へ遷移
    await expect(target.successFlash).toContainText(JOIN_REGISTER_COMPLETE);
  });

  test("E2E-M04-13-031 結合点数が1未満だと最小値エラーで滞留", async ({ page }) => {
    test.skip(!HAS_JOIN, "SEED-M04-13-JOIN-DEST 未設定");
    await loginToHome(page);
    const target = new StockStockSplitJoinRegisterEditPage(page);
    await target.gotoJoinNew(JOIN_DEST_ID);
    await target.submitJoinRegisterServerSide("0");
    await expect(target.errorFlash).toContainText(JOIN_DEST_STOCK_MIN);
    await expect(page).toHaveURL(JOIN_NEW_RE);
  });

  test("E2E-M04-13-032 編集権限のない店舗の結合登録で権限エラー", async ({ page }) => {
    test.skip(!HAS_NOPERM, "SEED-M04-13-NOPERM 未設定");
    await loginToHome(page);
    const target = new StockStockSplitJoinRegisterEditPage(page);
    await target.gotoJoinNew(NOPERM_ID);
    await target.submitJoinRegister("1");
    await expect(target.errorFlash).toContainText(JOIN_NOT_EDITABLE);
  });

  // ===== 保留（破壊的/deep要シード。理由付きで未実行・抜け漏れ可視化。手動/間接はケース表で全量管理） =====

  test.fixme(
    "E2E-M04-13-010 分割登録成功で編集画面へ遷移＋登録完了メッセージ（要: 分割元在庫を減算する破壊的操作・使い捨てSEED-M04-13-SPLIT-SRC）",
    async () => {
      // 期待は仕様(在庫増減ロジック#1・register_complete=「在庫分割を登録しました。」)由来。
      // 在庫数・総原価を変動させるため使い捨てシードで隔離後に実装。SPLIT_EDIT_RE と SPLIT_REGISTER_COMPLETE で判定。
    }
  );

  test.fixme(
    "E2E-M04-13-050 分割IDで結合編集URL→分割編集画面へリダイレクト（要: 種別=分割の既存レコード SEED-M04-13-SPLIT-NEW）",
    async () => {
      // 期待は仕様(分岐・遷移=種別取り違えで対応編集画面へリダイレクト)由来。SPLIT_EDIT_RE で判定。
    }
  );

  test.fixme(
    "E2E-M04-13-053 結合IDで分割編集URL→結合編集画面へリダイレクト（要: 種別=結合の既存レコード SEED-M04-13-JOIN-NEW）",
    async () => {
      // 期待は仕様(分岐・遷移=種別取り違えで対応編集画面へリダイレクト・逆方向)由来。JOIN_EDIT_RE で判定。
      // 050(分割→結合編集URL)に対する逆方向の対。
    }
  );

  test.fixme(
    "E2E-M04-13-060 分割承認申請で分割先未登録→未登録エラー（要: 分割先0件のNEWレコード SEED-M04-13-SPLIT-NEW）",
    async () => {
      // 期待は仕様(在庫増減ロジック#2コミット規則=destination_required=「分割先を1件以上追加してください。」)由来。
    }
  );

  test.fixme(
    "E2E-M04-13-070 欠品入力遷移で結合元未登録→必須エラー（要: 結合元0件のNEWレコード SEED-M04-13-JOIN-NEW）",
    async () => {
      // 期待は仕様(在庫増減ロジック#5検証=require_at_least_one_source=「承認申請には結合元を1件以上登録してください。」)由来。
      // 付帯表2b/付帯表1でE2E自動化(deep)に分類。欠品入力遷移はPOST操作・要deepシードのため未実行fixme。
    }
  );
});
