/**
 * 部門未設定チェックバッチ（B02-04）UIレイヤ E2E。
 * 納品ケース表 integration_test/e2e/b02_04_batch_product_product_no_section_check_e2e_cases.md に対応。
 *
 * ── ケース表対応（付帯表1 E2E可否＝実装の正） ───────────────────
 *  本specには「E2E自動化(UI)」2ケース（017,018）のみを実装する。API/統合(8)は spec/batch/b02 側、手動/対象外はケース表で全量管理（規約）。
 *
 * ── オラクル独立性 ─────────────────────────────────────────────
 *  バッチ結果（アラートメール）はUIに反映されない。ここで確認するのは「抽出対象の入力条件（公開状態・部門）の商品一覧でのUI観測」であり、
 *  「バッチ結果のUI観測」ではない（付帯表1注記）。期待は仕様（抽出条件「公開中かつ部門未設定」正本md:40-43,83／IT-30,IT-16）由来。
 *
 * ── 未実行雛形 ─────────────────────────────────────────────────
 *  ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *  AdminLoginPage を直利用し、資格情報が無ければ走らないよう test.skip(!HAS_CREDS) でガードする。
 *  ※ 部門「未設定」の具体オプション値・行レベルの部門表示は要実機確認のため、本specは入力条件の検索控（公開状態・部門）の存在をUI観測する。
 *
 * 資格情報: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（環境変数。コミットしない。SEED-B02-04-ADMIN）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { NoSectionCheckProductListPage } from "../../../pages/admin/b02/b02_04_batch_product_product_no_section_check.page";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

/** SEED-B02-04-ADMIN でログインする（商品一覧の参照権限あり）。 */
async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  await expect(page.locator("#login_id")).toBeHidden();
}

test.describe("部門未設定チェックバッチ > 抽出入力条件のUI観測", { tag: ["@admin", "@product", "@b02"] }, () => {
  test("E2E-B02-04-017 抽出対象（公開中かつ部門未設定）の入力条件を商品一覧の検索条件でUI確認", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-B02-04-ADMIN）");
    // 前提: SEED-B02-04-NO-SECTION（公開中かつ部門未設定の商品規格）が存在すること。
    await login(page);
    const list = new NoSectionCheckProductListPage(page);
    await list.goto();
    // 期待（仕様由来）: 商品一覧に抽出条件（公開状態・部門）の検索控が現れる＝抽出対象（公開中かつ部門未設定）の入力条件をUIで指定・観測できる。
    await expect(list.searchForm).toBeVisible();
    await expect(list.statusField).toBeVisible(); // 公開状態（抽出条件「公開中」）
    await expect(list.sectionField).toBeVisible(); // 部門（抽出条件「部門未設定」。未設定の具体値は要実機確認）
  });

  test("E2E-B02-04-018 部門設定済または非公開の商品が抽出対象外であることを検索条件でUI確認", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-B02-04-ADMIN）");
    // 前提: 部門設定済または非公開の商品規格が存在すること（抽出対象外の入力条件）。
    await login(page);
    const list = new NoSectionCheckProductListPage(page);
    await list.goto();
    // 期待（仕様由来・IT-16）: 同じ検索条件（公開状態・部門）で抽出対象外（部門設定済・非公開）の入力条件をUIで指定・観測できる。
    await expect(list.searchForm).toBeVisible();
    await expect(list.statusField).toBeVisible(); // 公開状態（抽出対象外「非公開」の指定面）
    await expect(list.sectionField).toBeVisible(); // 部門（抽出対象外「部門設定済」の指定面。具体値は要実機確認）
  });
});
