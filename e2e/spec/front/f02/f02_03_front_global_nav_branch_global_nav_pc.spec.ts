/**
 * フロント 支店PC版ナビゲーション（F02-03）E2E。
 * integration_test/e2e/f02_03_front_global_nav_branch_global_nav_pc_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f02-03_front_global_nav_branch_global_nav_pc.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 実在の店舗はシード依存のため、非破壊に走る 404 系のみ live 化し、店舗表示・店舗切替系は test.fixme で保留する。
 */
import { test } from "@playwright/test";
import { FrontBranchGlobalNavPcPage } from "../../../pages/front/f02/f02_03_front_global_nav_branch_global_nav_pc.page";

test.describe("フロント > 支店 > PC版ナビゲーション", { tag: ["@front", "@branch", "@nav"] }, () => {
  test("E2E-F02-03-023 存在しない店舗識別名の店舗紹介ページで見つからない（HTTP404）となる", async ({ page }) => {
    const nav = new FrontBranchGlobalNavPcPage(page);
    await nav.expectShopNotFound("e2e_no_such_shop_0203");
  });

  test("E2E-F02-03-021 イベント店舗文脈で該当なしの店舗IDを指定すると見つからない（HTTP404）となる", async ({ page }) => {
    const nav = new FrontBranchGlobalNavPcPage(page);
    await nav.expectEventsShopNotFound("99999999");
  });

  // --- 要シード（実在店舗）。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F02-03-005 店舗ヘッダ・左カラム店舗一覧・右カラムセクションナビが描画される（要: SEED 実在店舗）", async () => {});
  test.fixme("E2E-F02-03-006 左カラム店舗一覧のリンクから当該店舗の店舗紹介ページへ遷移する（要: SEED 複数店舗）", async () => {});
  test.fixme("E2E-F02-03-007 右カラムセクションナビ押下でセクションへアンカー移動する（要: SEED 店舗ページ要素）", async () => {});
  test.fixme("E2E-F02-03-008 イベント店舗選択で当該店舗のイベント店舗文脈へ遷移する（要: SEED 実在店舗ID）", async () => {});
  test.fixme("E2E-F02-03-009 店舗ヘッダ（ロゴ・店舗一覧導線・マイページ・言語切替・カート）が表示される（要: SEED 実在店舗）", async () => {});
  test.fixme("E2E-F02-03-014 登録済みの右カラム項目だけがセクションナビに並ぶ（要: SEED 店舗ページ要素）", async () => {});
  test.fixme("E2E-F02-03-015 左カラムは店舗名、イベント店舗選択は短縮店舗名で表示される（要: SEED 実在店舗）", async () => {});
});
