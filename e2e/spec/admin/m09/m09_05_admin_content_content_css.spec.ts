/**
 * 管理画面 コンテンツ管理 > CSS管理（M09-05）E2E。納品ケース表
 * integration_test/e2e/m09_05_admin_content_content_css_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、自動化予定だが未実装/要実機（403制限・書込失敗・JS活性制御）は
 * test.fixme（理由付き）で残す。手動/対象外（ストレージ実反映・DB副作用無し・店舗フロント反映・権限委譲・
 * 同時編集last-write・ログ記録 等）はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/ec-cube-enterprise/m09-05_admin_content_content_css.md / 観点表)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form 由来の位置情報のみ。表示文言の i18n リソース値はオラクルにせず、
 * 設計書「表示メッセージ」が明記する文言・観測（フラッシュ領域の表示・該当URLへの遷移）で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・m08/*.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報が無ければ走らないよう test.skip(!HAS_CREDS) でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *
 * 永続化注意: 本機能は customize.css を全文上書きする。共有ステージングでの実行は店舗フロント表示へ影響しうるため、
 * 専用環境または後始末前提で実行すること（SEED-M09-05-CSS）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ContentContentCssPage } from "../../../pages/admin/m09/m09_05_admin_content_content_css.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const CSS_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/content/css(\\?|$)`);
const PAGE_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/content/page(\\?|$)`);

// 設計書「表示メッセージ」由来の文言（仕様＝オラクル）。部分一致で判定し i18n 句読点差に左右されない。
const SUCCESS_MSG = "保存しました"; // 設計書 フラッシュ（保存成功）
const RESTRICT_INFO = "ECCUBE_RESTRICT_FILE_UPLOAD"; // 設計書 案内（アップロード制限の案内・常時表示）
const TOOLTIP_TEXT = "カスタマイズ用CSSファイルを編集します。CSSで記述します。"; // 設計書 表示メッセージ（ツールチップ文言）

async function loginAndOpen(page: Page): Promise<ContentContentCssPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const css = new ContentContentCssPage(page);
  await css.goto();
  return css;
}

test.describe("管理画面 > コンテンツ管理 > CSS管理", { tag: ["@admin", "@content"] }, () => {
  // ===== 画面表示（E2E自動化） =====

  test("E2E-M09-05-001 CSS管理画面: カード見出し「CSS設定」が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const css = await loginAndOpen(page);
    await expect(css.cardTitle).toContainText("CSS設定");
  });

  test("E2E-M09-05-002 CSS管理画面: コード入力欄(Aceエディタ)と送信用隠しtextareaが存在する", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const css = await loginAndOpen(page);
    await expect(css.editor).toBeVisible();
    await expect(css.hiddenCss).toHaveCount(1); // 送信値textareaは1つ（仕様: 入力項目は1つ）
  });

  test("E2E-M09-05-003 CSS管理画面: 「必須」バッジが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const css = await loginAndOpen(page);
    await expect(css.requiredBadge).toContainText("必須");
  });

  test("E2E-M09-05-015 CSS管理画面: コード見出しのツールチップに案内文言が設定される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const css = await loginAndOpen(page);
    // 文言は title 属性に格納（hover不要で観測可能）。期待は設計書「表示メッセージ」のツールチップ文言=オラクル。
    await expect(css.tooltip).toHaveAttribute("title", TOOLTIP_TEXT);
  });

  test("E2E-M09-05-004 CSS管理画面: アップロード制限の案内が画面表示時に表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    // addInfoOnce はセッションで一度。新規コンテキストの初回表示で観測する。
    const css = await loginAndOpen(page);
    await expect(page.locator("body")).toContainText(RESTRICT_INFO);
  });

  // ===== 保存（正常系・E2E自動化） =====
  // 本群は customize.css を全文上書きする破壊的ケース。共有環境の店舗フロント表示へ副作用を残さないよう、
  // beforeEach で現行 customize.css 内容（隠しtextarea初期値）を退避し、afterEach で同内容へ復元する。
  test.describe("保存（正常系・customize.css 退避/復元）", () => {
    let css: ContentContentCssPage;
    let originalCss = "";

    test.beforeEach(async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      css = await loginAndOpen(page);
      originalCss = await css.readHiddenCss(); // 退避: 現行 customize.css の内容
    });

    test.afterEach(async () => {
      if (!HAS_CREDS) return;
      // 復元: 破壊的上書きの後始末（リダイレクト後の /content/css でエディタへ書き戻し再保存）。
      await css.fillCode(originalCss);
      await css.submit();
    });

    test("E2E-M09-05-005 正常保存: コード入力→登録で「保存しました」が表示される", async ({ page }) => {
      await css.fillCode(`/* e2e ${Date.now()} */ body{}`);
      await css.submit();
      await expect(page.locator("body")).toContainText(SUCCESS_MSG);
    });

    test("E2E-M09-05-006 正常保存後: 同一CSS管理画面へリダイレクトする", async ({ page }) => {
      await css.fillCode(`/* e2e ${Date.now()} */`);
      await css.submit();
      await expect(page).toHaveURL(CSS_RE); // 同一画面へリダイレクト
    });

    test("E2E-M09-05-007 保存後の再表示: 保存内容が初期表示される(間接永続化)", async ({ page }) => {
      const marker = `/* e2e-persist ${Date.now()} */`;
      await css.fillCode(marker);
      await css.submit();
      await expect(page.locator("body")).toContainText(SUCCESS_MSG);
      // リダイレクト後の再表示で保存内容がフォーム初期値へ流し込まれる（仕様: データ整合性）。
      // 送信値(隠しtextarea)とAceエディタ表示の双方に初期表示されることを確認（仕様: 初期表示はエディタへ）。
      expect(await css.readHiddenCss()).toContain(marker);
      expect(await css.readEditorValue()).toContain(marker);
    });

    test("E2E-M09-05-008 コード空のまま登録: 任意項目のため検証を妨げず保存成功する", async ({ page }) => {
      await css.fillCode(""); // 空内容
      await css.submit();
      await expect(page.locator("body")).toContainText(SUCCESS_MSG); // 必須エラーは出ない（仕様: requiredは偽）
    });

    test("E2E-M09-05-009 サーバ側文字数上限なし: 長大CSSでも保存成功する", async ({ page }) => {
      const big = "/* big */\n" + ".x{color:red}\n".repeat(5000); // 文字数上限なしの確認
      await css.fillCode(big);
      await css.submit();
      await expect(page.locator("body")).toContainText(SUCCESS_MSG);
    });
  });

  // ===== 遷移・認可（E2E自動化） =====

  test("E2E-M09-05-010 戻り導線リンク→ページ管理(コンテンツ管理一覧)へ遷移する", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const css = await loginAndOpen(page);
    await css.backLink.click();
    await expect(page).toHaveURL(PAGE_RE); // 文言「CSS管理」だが遷移先はページ管理（不具合候補#1）
  });

  test("E2E-M09-05-011 未ログインでCSS管理URL→管理ログイン画面へ誘導される", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/content/css`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  // 注: 旧 E2E-M09-05-015「CSRFトークン(hidden)存在」は、Symfony Form の DOM 生成（_token 要素）に依存する
  // 実装由来オラクルのため削除。設計書は「CSRFトークン値・検証成否は本書で扱わない」とし、共通フォーム基盤へ委譲（対象外）。

  // ===== 保留（自動化予定だが未実装/要実機。手動/対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M09-05-012 アップロード制限有効時はCSS管理URLが403で遮断される（要: ECCUBE_RESTRICT_FILE_UPLOAD=1 環境）",
    async () => {
      // 期待は仕様(権限・認可/エッジケース)由来。環境変数の切替が必要なため専用環境で実機確認後に実装。
    }
  );

  test.fixme(
    "E2E-M09-05-013 ファイル書き込み失敗時に「保存に失敗しました」を表示し同一画面に留まる（要: 書込不可状態の生成）",
    async () => {
      // 期待は仕様(処理フロー 書き込み失敗/エラー処理)由来。customize.css を書込不可にする前提を実機で用意後に実装。
    }
  );

  test.fixme(
    "E2E-M09-05-014 エディタのエラー注釈で「登録」ボタンが非活性になる（要: Ace注釈の安定生成）",
    async () => {
      // 期待は仕様(フロント挙動 JS保存ボタン制御・異常系)由来。Aceのerror注釈を安定発火させる手順を実機確認後に実装。
    }
  );

  test.fixme(
    "E2E-M09-05-018 エディタにエラー注釈が無いとき「登録」ボタンが活性になる（要: Ace注釈の安定生成）",
    async () => {
      // 期待は仕様(フロント挙動 JS保存ボタン制御・正常系=注釈空/エラー無しで活性)由来。E2E-014の正常系対。
      // Aceのerror注釈が無い状態を安定生成して #save-button が非disabledであることを実機確認後に実装。
    }
  );
});
