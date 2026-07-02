/**
 * 管理画面 店舗基本設定（SHOPマスター） — 送料無料条件（金額／数量） E2E。
 * 納品ケース表 integration_test/e2e/m10_05_admin_base_setting_setting_shop_delivery_free_conditions_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち安全に実行できるケースのみを置く（手動/対象外はケース表で全量管理）。
 * 登録成功・任意項目クリア（dtb_base_info のショップ共通設定をDB更新する破壊的操作）と、桁上限/桁区切りの
 * 境界が設計(price_len)と実装(eccube_price_max/MoneyType)で乖離し得るケースは test.fixme（理由付き）で残す。
 * 期待結果は仕様（正本md functions/pf-eccube3/m10-05_...md / 観点表 / ec-cube-enterprise確認値 messages.ja.yaml）由来
 * （オラクル独立性）。設計源は pf-eccube3 リバースのため、画面・遷移・メッセージの正は設計書/観点表とする。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / two_factor_auth.spec.ts / m09系）に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針（安全第一・共有環境）:
 *  - 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 表示系（001/002）・検証エラー系（020/021/030/031）は「保存に失敗してDBを変えない」ため安全に実行できる。
 *  - 登録成功（010/011）・任意クリア（012）はショップ共通設定をDB更新する破壊的操作のため test.fixme
 *    （現行値を退避・復元する使い捨て手順の実装後に有効化）。
 *  - 桁区切り（022）・桁超過（023）は境界が設計と実装で乖離し得るため test.fixme（要実機確認）。
 *
 * 環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { BaseSettingSettingShopDeliveryFreeConditionsPage } from "../../../pages/admin/m10/m10_05_admin_base_setting_setting_shop_delivery_free_conditions.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// URLアサーションは管理ルート(ECCUBE_ADMIN_ROUTE)込みで固定し、front側や別ルートでの誤検知を避ける。
const SHOP_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/setting/shop(\\?|$)`);
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 > 店舗基本設定 > 送料無料条件（金額・数量）",
  { tag: ["@admin", "@setting"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M10-05-040 未ログインで店舗基本設定URLへ直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/shop`);
      // 期待は仕様(権限・認可/未認証は保存操作に至らない)由来。未認証は管理ログイン画面へ。
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 表示系（非破壊。検証は保存しない） =====

    test("E2E-M10-05-001 送料設定ブロックに金額・数量の入力欄と見出しが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new BaseSettingSettingShopDeliveryFreeConditionsPage(page);
      await target.goto();
      await target.seeDeliveryFreeBlock();
    });

    test("E2E-M10-05-002 現在保存値が金額・数量の入力欄に表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new BaseSettingSettingShopDeliveryFreeConditionsPage(page);
      await target.goto();
      // 仕様(利用者視点の入口「現在保存値が表示される」)由来。実値はDB依存のため固定しないが、
      // 保存値を反映する入力欄であることを確認する＝両欄が可視で、value が数字のみ（任意項目のため空も可）の形＝/^\d*$/。
      // （DB現行値との一致照合は IT/手動の責務。ここでは「数値以外が初期表示されない」ことまでを観測する）
      await expect(target.deliveryFreeAmount).toBeVisible();
      await expect(target.deliveryFreeQuantity).toBeVisible();
      await expect(target.deliveryFreeAmount).toHaveJSProperty("tagName", "INPUT");
      await expect(target.deliveryFreeAmount).toHaveAttribute("value", /^\d*$/);
      await expect(target.deliveryFreeQuantity).toHaveAttribute("value", /^\d*$/);
    });

    // ===== 検証エラー系（非破壊。保存されず同一画面に留まる） =====

    test("E2E-M10-05-020 金額に数字以外を入力→検証エラーで保存されず滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new BaseSettingSettingShopDeliveryFreeConditionsPage(page);
      await target.goto();
      await target.submit("abc", "10"); // 金額に英字（/^\d+$/ 違反 ＝ 仕様エッジケース「数字以外」）
      await target.seeValidationError();
      await expect(page).toHaveURL(SHOP_RE); // 同一画面で再描画
    });

    test("E2E-M10-05-021 金額に負値を入力→検証エラーで保存されず滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new BaseSettingSettingShopDeliveryFreeConditionsPage(page);
      await target.goto();
      await target.submit("-1", "10"); // 金額に負値（仕様エッジケース「負値」）
      await target.seeValidationError();
      await expect(page).toHaveURL(SHOP_RE);
    });

    test("E2E-M10-05-030 数量に数字以外を入力→検証エラーで保存されず滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new BaseSettingSettingShopDeliveryFreeConditionsPage(page);
      await target.goto();
      await target.submit("1000", "abc"); // 数量に英字（/^\d+$/ 違反）
      await target.seeValidationError();
      await expect(page).toHaveURL(SHOP_RE);
    });

    test("E2E-M10-05-031 数量に負値を入力→検証エラーで保存されず滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new BaseSettingSettingShopDeliveryFreeConditionsPage(page);
      await target.goto();
      await target.submit("1000", "-1"); // 数量に負値
      await target.seeValidationError();
      await expect(page).toHaveURL(SHOP_RE);
    });

    // ===== 保留（破壊的/境界要実機確認。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M10-05-010 有効な金額・数量で登録→登録完了メッセージ表示（破壊的: dtb_base_info 更新）",
      async () => {
        // 期待は仕様(処理フロー 検証成功→成功フラッシュ＋GET再表示)由来。
        // 現行のショップ共通設定値を退避→投入→復元する使い捨て手順の実装後に有効化する。
      }
    );

    test.fixme(
      "E2E-M10-05-011 登録成功後に店舗基本設定画面(GET)へ再表示され入力値が反映される（破壊的）",
      async () => {
        // 期待は仕様(画面遷移 検証成功→同一店舗基本設定のGETリダイレクト・保存後値の読み直し)由来。
      }
    );

    test.fixme(
      "E2E-M10-05-012 金額・数量とも空（任意）で登録→検証エラーなく保存完了（破壊的・null化）",
      async () => {
        // 期待は仕様(入力項目 任意/required false、未入力可)由来。クリア後に現行値へ復元する手順を要実装。
      }
    );

    test.fixme(
      "E2E-M10-05-022 金額に桁区切り（カンマ付き）文字列→検証エラー（要実機確認: MoneyType の桁区切り解釈）",
      async () => {
        // 期待は仕様(エッジケース「桁区切り文字列がエラーとなる例がある」)由来。金額は PriceType(親MoneyType,grouping=true)で
        // Regex は持たないため、MoneyType の桁区切り解釈により「1,000」の可否が分かれる＝要実機確認。
      }
    );

    test.fixme(
      "E2E-M10-05-023 金額に上限超過の値→検証エラー（要実機確認: 設計price_len(桁数)と実装Range max=eccube_price_max(値域)の乖離）",
      async () => {
        // 期待は仕様(上限超過でエラー)由来。実装の金額制約は Range(min=0,max=eccube_price_max)＝値域上限で、
        // 設計の「最大長price_len(=8桁)」とは制約種別・境界値が異なり得るため境界は要実機確認。
      }
    );
  }
);
