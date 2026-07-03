/**
 * フロント 支店スマホ版ナビゲーション（F02-04）E2E。
 * integration_test/e2e/f02_04_front_global_nav_branch_global_nav_sp_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f02-04_front_global_nav_branch_global_nav_sp.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 実在の店舗はシード依存のため、非破壊に走る 404 系のみ live 化し、店舗表示・店舗切替系は test.fixme で保留する。
 */
import { test } from "@playwright/test";
import { FrontBranchGlobalNavSpPage } from "../../../pages/front/f02/f02_04_front_global_nav_branch_global_nav_sp.page";

test.describe("フロント > 支店 > スマホ版ナビゲーション", { tag: ["@front", "@branch", "@nav", "@sp"] }, () => {
  test("E2E-F02-04-023 存在しない店舗識別名の店舗紹介ページで見つからない（HTTP404）となる", async ({ page }) => {
    const nav = new FrontBranchGlobalNavSpPage(page);
    await nav.useSpViewport();
    await nav.expectShopNotFound("e2e_no_such_shop_0204");
  });

  test("E2E-F02-04-021 イベント店舗文脈で該当なしの店舗IDを指定すると見つからない（HTTP404）となる", async ({ page }) => {
    const nav = new FrontBranchGlobalNavSpPage(page);
    await nav.useSpViewport();
    await nav.expectEventsShopNotFound("99999999");
  });

  // --- 要シード（実在店舗）。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F02-04-005 タブレット用店舗一覧・右カラムセクションナビ・店舗ヘッダが描画される（要: SEED 実在店舗）", async () => {});
  test.fixme("E2E-F02-04-006 タブレット用店舗一覧のリンクから当該店舗の店舗紹介ページへ遷移する（要: SEED 複数店舗）", async () => {});
  test.fixme("E2E-F02-04-007 右カラムセクションナビ押下でセクションへアンカー移動する（要: SEED 店舗ページ要素）", async () => {});
  test.fixme("E2E-F02-04-008 イベント店舗文脈の店舗切替セレクトで当該店舗の文脈へ遷移する（要: SEED 実在店舗ID）", async () => {});
  test.fixme("E2E-F02-04-009 SP幅でタブレット用店舗一覧・店舗切替セレクト等のSP用要素が表示される（要: SEED 実在店舗）", async () => {});
  test.fixme("E2E-F02-04-014 登録済みの右カラム項目だけがセクションナビに並ぶ（要: SEED 店舗ページ要素）", async () => {});
  test.fixme("E2E-F02-04-015 タブレット用店舗一覧は店舗名、店舗切替セレクトは短縮店舗名で表示される（要: SEED 実在店舗）", async () => {});
});
