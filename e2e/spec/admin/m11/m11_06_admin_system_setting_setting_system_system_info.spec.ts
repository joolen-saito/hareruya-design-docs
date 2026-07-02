/**
 * 管理画面 設定 > システム設定 > システム情報 E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m11_06_admin_system_setting_setting_system_system_info_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち非破壊で安全に実行できるケースのみ test 本体で実装する。
 * phpinfo 有効環境(011/012)は env 切替＋サーバ再起動を要する「手動」、店舗オーナー/オペレーターの403(022-024)は
 * 専用ロールアカウントのシード前提のため test.fixme（理由付き）で残す。手動/対象外はケース表で全量管理し、
 * specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様（正本 m11-06_...md / 観点表 / messages.ja.yaml）由来（オラクル独立性）。実装からはセレクタ(位置情報)のみ取得。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec(login/m10系)も
 * @playwright/test を直接使う。既存リポ規約に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針（安全第一・共有環境）:
 *  - 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 本機能は参照専用(GET)でフォーム/POST/DB更新が無いため、表示系は非破壊で安全に実行できる。
 *  - 折りたたみ(008/009)は Bootstrap collapse のアニメ完了待ちが要るため aria-expanded で観測する。
 *
 * 環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { SystemSettingSettingSystemSystemInfoPage } from "../../../pages/admin/m11/m11_06_admin_system_setting_setting_system_system_info.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// URLアサーションは管理ルート(ECCUBE_ADMIN_ROUTE)込みで判定し、別ルートへの誤遷移を取りこぼさない。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const SYSTEM_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/setting/system/system(\\?|$)`);

/** 管理ログインしてからシステム情報画面を開く。 */
async function gotoAsAdmin(page: Page): Promise<SystemSettingSettingSystemSystemInfoPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const p = new SystemSettingSettingSystemSystemInfoPage(page);
  await p.goto();
  return p;
}

test.describe(
  "管理画面 > 設定 > システム設定 > システム情報",
  { tag: ["@admin", "@setting"] },
  () => {
    // ===== 表示（GET・非破壊・要ログイン） =====

    test("E2E-M11-06-001 システム情報画面が表示されカード見出し「システム情報」が出る", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const p = await gotoAsAdmin(page);
      // 期待は仕様（利用者視点の入口・成功時出力「管理画面共通レイアウトのHTML／システム情報カード」）由来。HTTP200到達も兼ねる。
      await expect(page).toHaveURL(SYSTEM_RE);
      await p.seeSystemInfoCard();
    });

    test("E2E-M11-06-002 ページタイトルに「システム情報」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const p = await gotoAsAdmin(page);
      // 期待は仕様（フロント挙動「ページタイトルにシステム情報」 system.twig:16 block title）由来。
      // block title の出力先は共通フレームの h2.c-pageTitle__title（default_frame.twig:196）。カード見出し(001)とは別領域。
      await expect(p.pageTitle).toContainText("システム情報");
    });

    test("E2E-M11-06-003 サブタイトルに「システム設定」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const p = await gotoAsAdmin(page);
      // 期待は仕様（フロント挙動「サブタイトルにシステム設定」 system.twig:17 block sub_title=admin.setting.system）由来。
      // block sub_title の出力先は共通フレームの span.c-pageTitle__subTitle（default_frame.twig:196）。サイドナビ等の別領域と区別する。
      await expect(p.pageSubTitle).toContainText("システム設定");
    });

    test("E2E-M11-06-004 見出しに問い合わせ（ツールチップ）アイコンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const p = await gotoAsAdmin(page);
      // 期待は仕様（フロント挙動「ツールチップ付き見出し、問い合わせアイコン」 system.twig:27-29）由来。
      await expect(p.tooltipIcon).toBeVisible();
      await expect(p.tooltipWrap).toHaveAttribute("title", /.+/);
    });

    test("E2E-M11-06-005 システム情報カードに6つの行ラベルが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const p = await gotoAsAdmin(page);
      // 期待は仕様（処理フロー#2の表示順「EC-CUBE/サーバーOS/DBサーバー/WEBサーバー/PHP/User Agent」）由来。
      await p.seeRowLabels();
    });

    test("E2E-M11-06-006 各行の値コンテナに連番id(server_info_box__value--N)が付与される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const p = await gotoAsAdmin(page);
      // 期待は仕様（フロント挙動「行コンテナには連番に基づく識別子がある」 system.twig:49 loop.index）由来。
      // 行数は実行時情報により可変だが、設計の固定ラベルは6件。prefix件数だけでは連番性を検証できないため、
      // 連番 --1〜--6 が実在することを観測する（同一prefixの非連番DOMでは通らない）。
      expect(await p.valueCells.count()).toBeGreaterThanOrEqual(6);
      await p.seeSequentialValueIds();
    });

    test("E2E-M11-06-007 EC-CUBE行に値（バージョン文字列）が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const p = await gotoAsAdmin(page);
      // 期待は仕様（業務ルール・計算「EC-CUBE=製品が定数として保持するバージョン文字列」）由来。
      // 値そのものの正当性(定数一致)はDB/環境依存＝手動。ここでは先頭行の値が空でないことを構造で観測する。
      await expect(p.valueCells.first()).not.toBeEmpty();
    });

    test("E2E-M11-06-008 折りたたみアイコン押下でカード本文が折りたたまれる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const p = await gotoAsAdmin(page);
      // 期待は仕様（利用者視点の入口「角度アイコン押下でカード本文が折りたたみ/展開」 system.twig:33-40 collapse）由来。
      await expect(p.collapseBody).toBeVisible(); // 既定は展開(class collapse show)
      await p.toggleCollapse();
      await expect(p.collapseBody).toBeHidden(); // 折りたたみで本文非表示
    });

    test("E2E-M11-06-009 折りたたみ後に再度押下でカード本文が展開される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const p = await gotoAsAdmin(page);
      await p.toggleCollapse();
      await expect(p.collapseBody).toBeHidden();
      await p.toggleCollapse();
      await expect(p.collapseBody).toBeVisible(); // 再展開で本文表示
    });

    test("E2E-M11-06-010 既定環境(phpinfo無効)ではPHP情報カードがDOM上に存在しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const p = await gotoAsAdmin(page);
      // 期待は仕様（処理フロー「eccube_phpinfo_enabled 偽ならPHP情報カード自体を出力しない」＋既定は偽 業務ルール・計算）由来。
      await expect(p.phpInfoHeader).toHaveCount(0);
      await expect(p.phpInfoFrame).toHaveCount(0);
    });

    test("E2E-M11-06-013 本画面はモーダル/確認ダイアログ/トーストを表示しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await gotoAsAdmin(page);
      // 期待は仕様（フロント挙動「モーダル、確認ダイアログ、トーストを表示しない」）由来。
      await expect(page.locator(".modal.show")).toHaveCount(0);
      await expect(page.locator('[role="dialog"]')).toHaveCount(0);
      // トーストも仕様どおり非表示であること（Bootstrap トースト）。
      await expect(page.locator(".toast.show")).toHaveCount(0);
    });

    test("E2E-M11-06-015 クエリ付きURLでも出力が変わらずシステム情報が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
      // 期待は仕様（処理フロー「要求クエリの有無やキーは情報組立に使われない」正本md:94）由来。
      // クエリ付きで開いてもカードと6行ラベルがクエリ無しと同様に出ること（出力不変）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/system/system?probe=e2e&x=1`);
      await expect(page).toHaveURL(SYSTEM_RE);
      const p = new SystemSettingSettingSystemSystemInfoPage(page);
      await p.seeSystemInfoCard();
      await p.seeRowLabels();
    });

    test("E2E-M11-06-016 サイドナビのシステム情報リンクから同一画面へ到達できる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
      // 期待は仕様（利用者視点の入口/画面遷移「メニューからシステム情報を選ぶ→同一画面表示」正本md:68,220）由来。
      // ナビ内のシステム情報リンクは route admin_setting_system_system（href 末尾 /setting/system/system）。
      // ナビ容器（折りたたみ階層）のセレクタは Twig 未grounding のため 要実機確認。
      const navLink = page.locator(`a[href$="/setting/system/system"]`).first();
      await navLink.click();
      await expect(page).toHaveURL(SYSTEM_RE);
      const p = new SystemSettingSettingSystemSystemInfoPage(page);
      await p.seeSystemInfoCard();
    });

    // ===== 権限・認可（資格情報不要・非破壊） =====

    test("E2E-M11-06-020 未認証でシステム情報URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      // 資格情報不要（未ログイン前提）。期待は仕様（権限・認可「未認証は管理領域要件に従い利用不可」）由来。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/system/system`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M11-06-021 未認証でphpinfo URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      // 資格情報不要。期待は仕様（権限・認可「未認証は利用不可」・phpinfo も管理領域配下）由来。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/system/system/phpinfo`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M11-06-022 店舗オーナーでシステム情報URLアクセス→403（要: 店舗オーナーロールのシードアカウント）",
      async () => {
        // 期待は仕様（権限・認可「店舗オーナーは初期データの拒否行によりシステム情報パスが403」処理フロー(権限拒否時)）由来。
        // dtb_authority_role の deny_url 先頭一致で403。SEED-M11-06-SHOP-OWNER 投入後に実装し HTTP403 をアサート。
      }
    );

    test.fixme(
      "E2E-M11-06-023 店舗オペレーターでシステム情報URLアクセス→403（要: 店舗オペレーターロールのシードアカウント）",
      async () => {
        // 期待は仕様（権限・認可「店舗オペレーターは拒否行により403」）由来。SEED-M11-06-SHOP-OPERATOR 投入後に実装。
      }
    );

    test.fixme(
      "E2E-M11-06-024 店舗オーナーでphpinfo URLアクセス→403（要: 店舗オーナーロールのシードアカウント）",
      async () => {
        // 期待は仕様（権限・認可「より長いパスのphpinfo側も同一拒否パターン先頭一致で403」処理フロー(権限拒否時)#2）由来。
        // SEED-M11-06-SHOP-OWNER で /setting/system/system/phpinfo に対し HTTP403 をアサート。
      }
    );

    test.fixme(
      "E2E-M11-06-025 店舗オペレーターでphpinfo URLアクセス→403（要: 店舗オペレーターロールのシードアカウント）",
      async () => {
        // 期待は仕様（権限・認可 正本md:71「店舗オペレーターも本体と同拒否先頭一致のphpinfoが403」処理フロー(権限拒否時)#2）由来。
        // 022/024 が店舗オーナーの本体/phpinfo、023 が店舗オペレーターの本体を担う。本ケースは店舗オペレーターのphpinfo異常系の対を埋める。
        // SEED-M11-06-SHOP-OPERATOR で /setting/system/system/phpinfo に対し HTTP403 をアサート。
      }
    );

    test.fixme(
      "E2E-M11-06-026 拒否ロールではサイドナビにシステム情報項目が表示されない（要: 店舗オーナーロールのシードアカウント）",
      async () => {
        // 期待は仕様（権限・認可 正本md:212「拒否URLに合致するナビ項目は表示されない場合がある」）由来。
        // SEED-M11-06-SHOP-OWNER でログインし、サイドナビにシステム情報リンク（href 末尾 /setting/system/system）が無いことを確認する。
        // URL直接アクセス時の403は 022 が担い、本ケースはその拒否ロールのナビ非表示（手動・要実機確認）を対にする。
      }
    );

    test.fixme(
      "E2E-M11-06-011 phpinfo有効環境でPHP情報カード見出し「PHP情報」とiframeが表示される（手動: ECCUBE_PHPINFO_ENABLED=1 切替＋再起動要）",
      async () => {
        // 期待は仕様（処理フロー「phpinfo_enabled 真のときのみPHP情報カードとiframe(src=phpinfo)を出力」）由来。
        // 環境変数 ECCUBE_PHPINFO_ENABLED をサーバ側で真にしてキャッシュ再構築する運用が要るため手動。実機切替後に実装可。
      }
    );

    test.fixme(
      "E2E-M11-06-012 phpinfo応答が管理共通レイアウトを経由しない生HTMLである（手動: phpinfo有効環境要）",
      async () => {
        // 期待は仕様（処理フロー(PHP情報)「共通フレームTwigを通さず生HTMLを応答」副作用「iframe内応答」）由来。
        // phpinfo 有効環境で iframe src を直接GETし、管理ヘッダ/ナビを含まない素のphpinfo HTMLであることを確認する。
      }
    );
  }
);

// UA は context 生成時に固定するため、UA 反映/エスケープ検証は専用 userAgent の describe で隔離する。
test.describe(
  "管理画面 > 設定 > システム設定 > システム情報（User Agent反映・エスケープ）",
  { tag: ["@admin", "@setting"] },
  () => {
    // 目印文字列に HTML 特殊文字を含め、エスケープされプレーンテキストとして表示されることを観測する。
    const UA_MARKER = 'e2e-ua-probe-<b>mk</b>';
    test.use({ userAgent: UA_MARKER });

    test("E2E-M11-06-014 User Agent行に要求UA値がエスケープされプレーンテキスト表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const p = await gotoAsAdmin(page);
      // 期待は仕様（業務ルール・計算「User Agent=要求ヘッダ」正本md:123／フロント挙動「値はエスケープされたプレーンテキスト」md:80）由来。
      // 表示順6行目（処理フロー#2）が User Agent 行。要求で送った UA がそのまま該当行に出る。
      const uaCell = p.valueCells.nth(5);
      await expect(uaCell).toContainText("e2e-ua-probe-");
      // HTML として解釈されず子要素化されない（エスケープ）こと。
      await expect(uaCell.locator("b")).toHaveCount(0);
    });
  }
);
