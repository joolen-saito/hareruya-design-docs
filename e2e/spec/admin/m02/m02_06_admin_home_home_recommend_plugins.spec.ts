/**
 * 管理画面ホーム おすすめプラグイン E2E。納品ケース表
 * integration_test/e2e/m02_06_admin_home_home_recommend_plugins_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、データ依存(モーダル等)は test.fixme、
 * 状態別CTA/外部リンク/取得失敗などの手動・対象外はケース表で全量管理する（spec とケース表は完全1:1ではない）。
 * 期待結果は仕様(m02-06_admin_home_home_recommend_plugins.md / messages.ja.yaml)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 本機能の構造的制約（重要）: おすすめプラグインはホーム表示時にサーバ側で外部プラグインAPIから取得する
 * （AdminController.php:189 getRecommended()）。サーバ間通信のためブラウザの route interception では
 * モックできず、プラグイン行・詳細モーダル・状態別CTA・対応バージョン警告・取得失敗時の空表示は
 * 外部APIが特定状態を返す必要がありE2Eで決定論的に再現できない。常時観測できるのはカード枠と未認証ガードのみ。
 *
 * 資格情報（環境変数。コミットしない）: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（SEED-M02-06-ADMIN）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AdminHomeHomeRecommendPluginsPage } from "../../../pages/admin/m02/m02_06_admin_home_home_recommend_plugins.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const LOGIN_RE = /\/login(\?|$)/;
// オーナーズストア検索（route admin_store_plugin_owners_search_page）。実パスは要実機確認のため store/plugin で部分一致。
const OWNERS_STORE_RE = /\/store\/plugin/;

/** 管理者でログインしてホームへ到達する。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面ホーム > おすすめプラグイン",
  { tag: ["@admin", "@home"] },
  () => {
    // ===== 認証不要（常時実行可） =====

    test("E2E-M02-06-004 未ログインでホームURL直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/`);
      await expect(page).toHaveURL(LOGIN_RE); // 本カードに到達できない
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== カード枠（外部API状態に依存せず常時描画される・SEED-M02-06-ADMIN） =====

    test("E2E-M02-06-001 ホームにおすすめプラグインカードと見出し「おすすめのプラグイン」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M02-06-ADMIN 未設定（ECCUBE_ADMIN_USER/PASS）");
      await loginToHome(page);
      const home = new AdminHomeHomeRecommendPluginsPage(page);
      await home.goto();
      await expect(home.card).toBeVisible();
      await expect(home.cardTitle).toContainText("おすすめのプラグイン");
    });

    test("E2E-M02-06-002 カード下部に「オーナーズストア」リンクが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M02-06-ADMIN 未設定");
      await loginToHome(page);
      const home = new AdminHomeHomeRecommendPluginsPage(page);
      await home.goto();
      await expect(home.ownerStoreLink).toBeVisible(); // 件数によらず常時表示
    });

    test("E2E-M02-06-003 「オーナーズストア」押下でオーナーズストア検索へ遷移する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M02-06-ADMIN 未設定");
      await loginToHome(page);
      const home = new AdminHomeHomeRecommendPluginsPage(page);
      await home.goto();
      await home.clickOwnerStore();
      await expect(page).toHaveURL(OWNERS_STORE_RE); // 管理画面内のオーナーズストア検索
    });

    test("E2E-M02-06-005 カード本文が最大高さを持ち縦スクロールする", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M02-06-ADMIN 未設定");
      await loginToHome(page);
      const home = new AdminHomeHomeRecommendPluginsPage(page);
      await home.goto();
      // index.twig:280 の inline style（max-height / overflow-y:scroll）を観測する。
      const overflowY = await home.cardBody.evaluate(
        (el) => getComputedStyle(el).overflowY
      );
      expect(["scroll", "auto"]).toContain(overflowY);
    });

    // ===== 自動化予定だがデータ依存で未実装（外部APIが推奨プラグインを返す必要・fixme） =====

    test.fixme(
      "E2E-M02-06-006 おすすめプラグイン行に画像・名称・短い説明が縦に表示される（要: SEED-M02-06-RECOMMEND）",
      async () => {
        // 期待は仕様(フロント挙動 表示要素 / 利用者視点の入口)由来：各プラグイン行に画像・名称・短い説明が縦に並ぶ。
        // 行の存在自体が外部API応答に依存（index.twig:281-296 for recommendedPlugins）ためデータ整備後に実装。
        // 画像・名称・説明の固定値はオラクルにしない（外部API取得値）。
      }
    );

    test.fixme(
      "E2E-M02-06-010 プラグイン名/画像押下で詳細モーダルが開く（要: 外部APIが推奨プラグイン1件以上を返す状態）",
      async () => {
        // 期待は仕様(処理フロー 詳細モーダル表示)由来。外部APIはサーバ側取得でブラウザmock不可のため、
        // SEED-M02-06-RECOMMEND（スタブAPI/ステージング既知データ）整備後に、行リンク押下→#searchPluginModal-{id}表示を実装。
      }
    );

    test.fixme(
      "E2E-M02-06-011 詳細モーダルに設計『モーダル内容』の全表示項目が表示される（要: SEED-M02-06-RECOMMEND）",
      async () => {
        // 期待は仕様(フロント挙動 モーダル内容)由来：画像・名称・短い説明・税込価格・ダウンロード数・バージョン・
        // 対応EC-CUBEバージョン・公開日・最終更新日・ライセンス・制作者・問い合わせURL・マニュアルURL・長い説明。
        // 価格は税込であることが分かる形で表示される（ラベル固定文言はオラクルにしない。文言根拠 messages.ja.yaml:3231/82）。
      }
    );

    test.fixme(
      "E2E-M02-06-012 「一覧に戻る」/閉じる押下でモーダルが閉じる（要: SEED-M02-06-RECOMMEND）",
      async () => {
        // 期待は仕様(モーダル開閉・サーバ通信なし)由来。データ整備後に btn-close / 「一覧に戻る」で閉じることを確認。
      }
    );

    // 注: 状態別CTA(020 入手/アップデート, 021 インストール済み, 022 購入), 外部リンク(023 資料/マニュアル),
    //     対応バージョン警告(024), 取得失敗(030)/空配列(031) は外部API状態を決定論的に再現できないため
    //     ケース表で「手動」として全量管理し、spec には残さない（実行結果のノイズ防止）。
  }
);
