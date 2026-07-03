/**
 * フロント 会員「お気に入り登録商品一覧」（F06-09）E2E。
 * 対応ケース表: integration_test/e2e/f06_09_front_member_mypage_favorite_product_e2e_cases.md
 *
 * 本リポジトリでは未実行の雛形（ec-cube-enterprise の Playwright は構造参考のみ）。
 * 期待結果（オラクル）は functions/pf-eccube3/f06-09_front_member_mypage_favorite_product.md 由来
 * （実装/POM の表示文言をオラクル化しない）。
 *
 * この画面は会員ログイン必須のマイページ保護画面である。
 * - 未認証で保護URLへ直接アクセス→ログイン誘導 は資格情報不要のため live。
 * - ログイン後の一覧表示（見出し・案内文・商品数・切替/表示順リンク）は
 *   ECCUBE_FRONT_USER/PASS を要するため test.skip ガード付き live（skip付きlive）。
 * - お気に入りの登録有無に依存する内容（0件表示・登録状態反映・検索条件の含む/含まない）は
 *   専用会員シードを要するため test.fixme（理由付き保留）。
 * - 手動・対象外の観点はケース表（付帯表2/2b）で全量管理し、spec には残さない。
 */
import { test, expect } from "@playwright/test";
import { FrontMemberMypageFavoriteProductPage } from "../../../pages/front/f06/f06_09_front_member_mypage_favorite_product.page";
import {
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

const HAS_FRONT_CREDS = !!(ECCUBE_FRONT_USER && ECCUBE_FRONT_PASS);

test.describe(
  "フロント > マイページ > お気に入り登録商品一覧",
  { tag: ["@front", "@member"] },
  () => {
    // --- 未認証（資格情報不要）: live ---

    test("E2E-F06-09-021 未ログインでお気に入り一覧URLへ直接アクセスするとログイン画面へ誘導される", async ({ page }) => {
      const favorite = new FrontMemberMypageFavoriteProductPage(page);
      await favorite.gotoFavoriteList();
      await favorite.expectLoginRedirect();
    });

    test("E2E-F06-09-002 未認証でクエリ付きお気に入り一覧URLへアクセスしても一覧を表示せずログイン誘導される", async ({ page }) => {
      const favorite = new FrontMemberMypageFavoriteProductPage(page);
      await favorite.gotoFavoriteList("?sale=1");
      await favorite.expectLoginRedirect();
    });

    // --- ログイン後の一覧表示（要資格情報・非破壊）: skip付きlive ---

    test("E2E-F06-09-006 ログイン後にお気に入り一覧の表示要素（見出し・会員様・マイページボタン）が表示される", async ({ page }) => {
      test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
      const favorite = new FrontMemberMypageFavoriteProductPage(page);
      await favorite.login();
      await favorite.gotoFavoriteList();
      await favorite.seeFavoriteListScreen();
    });

    test("E2E-F06-09-012 ログイン後にセール通知の案内文が常時表示される", async ({ page }) => {
      test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
      const favorite = new FrontMemberMypageFavoriteProductPage(page);
      await favorite.login();
      await favorite.gotoFavoriteList();
      await favorite.seeSaleNotice();
    });

    test("E2E-F06-09-011 ログイン後に商品数が表示される", async ({ page }) => {
      test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
      const favorite = new FrontMemberMypageFavoriteProductPage(page);
      await favorite.login();
      await favorite.gotoFavoriteList();
      await favorite.seeItemCount();
    });

    test("E2E-F06-09-004 ログイン後にセール絞り込み切替が表示され sale クエリで再表示できる", async ({ page }) => {
      test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
      const favorite = new FrontMemberMypageFavoriteProductPage(page);
      await favorite.login();
      await favorite.gotoFavoriteList();
      await favorite.seeSaleToggle();
      await favorite.gotoFavoriteList("?sale=1");
      await expect(page).toHaveURL(/[?&]sale=1(?:&|$)/);
      await favorite.seeFavoriteListScreen();
    });

    test("E2E-F06-09-005 ログイン後に表示順リンクが表示され sort クエリで再表示できる", async ({ page }) => {
      test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
      const favorite = new FrontMemberMypageFavoriteProductPage(page);
      await favorite.login();
      await favorite.gotoFavoriteList();
      await favorite.seeSortLinks();
      await favorite.gotoFavoriteList("?sort=default");
      await favorite.seeFavoriteListScreen();
    });

    test("E2E-F06-09-010 価格順クエリ（sort=price&order=ASC/DESC）で一覧を再表示できる", async ({ page }) => {
      test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
      const favorite = new FrontMemberMypageFavoriteProductPage(page);
      await favorite.login();
      await favorite.gotoFavoriteList("?sort=price&order=DESC");
      await favorite.seeFavoriteListScreen();
      await favorite.gotoFavoriteList("?sort=price&order=ASC");
      await favorite.seeFavoriteListScreen();
    });

    test("E2E-F06-09-020 ログイン後にお気に入り一覧がHTMLとして正常表示（GET 200）される", async ({ page }) => {
      test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
      const favorite = new FrontMemberMypageFavoriteProductPage(page);
      await favorite.login();
      const res = await page.goto(favorite.favoriteUrl);
      expect(res?.status()).toBe(200);
      await favorite.seeFavoriteListScreen();
    });

    test("E2E-F06-09-017 想定外の sort/order 値でもエラーにせず既定（登録順）へ丸めて一覧を表示する", async ({ page }) => {
      test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
      const favorite = new FrontMemberMypageFavoriteProductPage(page);
      await favorite.login();
      const res = await page.goto(`${favorite.favoriteUrl}?sort=__invalid__&order=__x__`);
      expect(res?.status()).toBe(200);
      await favorite.seeFavoriteListScreen();
    });

    // --- お気に入り登録有無に依存（要専用会員シード）: fixme ---

    test.fixme("E2E-F06-09-016 お気に入り0件の会員は商品数0で一覧領域が空表示になる（要: お気に入り0件の会員シード）", async () => {});
    test.fixme("E2E-F06-09-018 別機能での登録/解除後、次回一覧取得で参照時点の登録状態が反映される（要: お気に入り状態を変更できる会員シード）", async () => {});
    test.fixme("E2E-F06-09-057 会員自身が登録したお気に入り商品が一覧に含まれる（要: お気に入り登録済み会員シード）", async () => {});
    test.fixme("E2E-F06-09-058 他会員/非該当の商品は一覧に含まれない（要: 会員間で分離したお気に入りシード）", async () => {});
  },
);
