/**
 * フロント 支店トップページ表示（F01-02, 店舗紹介ページ）E2E。
 * integration_test/e2e/f01_02_front_top_home_branch_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f01-02_front_top_home_branch.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 実在の店舗識別名はシード依存のため、非破壊に走る 404 系のみ live 化し、店舗表示系は test.fixme で保留する。
 */
import { test } from "@playwright/test";
import { FrontTopHomeBranchPage } from "../../../pages/front/f01/f01_02_front_top_home_branch.page";

test.describe("フロント > 支店 > トップページ表示（店舗紹介）", { tag: ["@front", "@branch"] }, () => {
  test("E2E-F01-02-020 存在しない店舗識別名で見つからない（HTTP404）となる", async ({ page }) => {
    const shop = new FrontTopHomeBranchPage(page);
    await shop.expectNotFound("e2e_no_such_shop_0102");
  });

  test("E2E-F01-02-021 不正な文字を含む店舗識別名で見つからない（HTTP404）となる", async ({ page }) => {
    const shop = new FrontTopHomeBranchPage(page);
    // 店舗識別名は英数字とアンダースコアに限定。範囲外文字は該当店舗なし＝404。
    await shop.expectNotFound("e2e-invalid.name");
  });

  // --- 要シード（実在店舗）。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F01-02-004 有効な店舗識別名で支店TOP（店舗紹介ページ）が表示される（要: SEED 実在店舗）", async () => {});
  test.fixme("E2E-F01-02-007 店舗紹介ページのUI部品（ヘッダ画像・右カラムナビ等）が表示される（要: SEED 実在店舗）", async () => {});
  test.fixme("E2E-F01-02-011 右カラムは値のあるセクションのみ表示される（要: SEED 店舗ページ要素）", async () => {});
  test.fixme("E2E-F01-02-012 右カラムが定義順（店舗案内→…→アクセス）で並ぶ（要: SEED 店舗ページ要素）", async () => {});
  test.fixme("E2E-F01-02-013 左カラム店舗一覧に全店舗が並び、表示中店舗が選択状態になる（要: SEED 複数店舗）", async () => {});
});
