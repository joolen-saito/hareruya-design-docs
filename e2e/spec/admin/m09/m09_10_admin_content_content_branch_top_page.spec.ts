/**
 * 管理画面 コンテンツ管理 支店トップページ管理（M09-10）E2E。納品ケース表
 * integration_test/e2e/m09_10_admin_content_content_branch_top_page_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、要シード（既存画像・タイル整合・複数支店・S3）や永続化副作用ありは
 * test.fixme（理由付き）で残す。手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/pf-eccube3/m09-10_admin_content_content_branch_top_page.md / 観点表)の挙動由来（オラクル独立性）。
 *
 * 設計源は旧 pf-eccube3 のリバース、刷新先 ec-cube-enterprise に同一機能（admin_content_branch_toppage）が実在するためE2E化した。
 * 設計源と刷新先の URL・支店選択方式（GET→POST）・成功文言（登録しました→保存しました）・バナー文言統合などの乖離は
 * ケース表 付帯表4（不具合候補）に集約。表示文言の i18n リソース由来語はオラクルにせず、設計書が定める挙動・観測
 *（メッセージ領域の表示有無・該当画面への滞留/遷移）で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の
 * spec/admin/login.spec.ts・m08/*.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ContentContentBranchTopPagePage } from "../../../pages/admin/m09/m09_10_admin_content_content_branch_top_page.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const BRANCH_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/content/branch_toppage`);

/** 管理者ログインして支店トップページ管理画面を開く。 */
async function loginAndOpen(page: Page): Promise<ContentContentBranchTopPagePage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const target = new ContentContentBranchTopPagePage(page);
  await target.goto();
  return target;
}

test.describe(
  "管理画面 > コンテンツ管理 > 支店トップページ管理",
  { tag: ["@admin", "@content"] },
  () => {
    // ===== 認証不要・非破壊 =====

    test("E2E-M09-10-010 未ログインで管理URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/content/branch_toppage`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 表示系（SEED-M09-ADMIN・非破壊） =====

    test("E2E-M09-10-001 画面表示: 見出し「支店トップページ管理」と登録ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M09-ADMIN）");
      const target = await loginAndOpen(page);
      await expect(page).toHaveURL(BRANCH_RE);
      await target.seeManagementScreen();
    });

    test("E2E-M09-10-002 画面表示: 支店選択カードとトップページ設定カードが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpen(page);
      await target.seeCards();
    });

    test("E2E-M09-10-003 画面表示: バナー画像欄とバナーリンクタグ欄が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpen(page);
      await target.seeBannerArea();
    });

    test("E2E-M09-10-004 画面表示: タイル設定行にタイル位置・タイル属性・タイルタグのラベルが出る", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpen(page);
      await target.seeTileLabels();
    });

    test("E2E-M09-10-006 共通（mall）初期表示: 支店共通設定チェックボックスが無効表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpen(page);
      // 初期表示は getMallBaseInfo＝共通支店（is_common_branch 真）→ disabled。設計: 支店ID0相当で無効表示。
      await expect(target.commonSetting).toBeDisabled();
    });

    test("E2E-M09-10-011 送信可否: 登録ボタンがフォーム送信(type=submit)である", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpen(page);
      await expect(target.registerButton).toHaveAttribute("type", "submit");
    });

    test("E2E-M09-10-005 メニュー操作: コンテンツ管理から支店トップページ管理へ遷移できる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const target = new ContentContentBranchTopPagePage(page);
      // メニュー展開セレクタは default_frame 依存＝要実機確認。失敗時は付帯表1（005）の根拠で実機調整する。
      await target.gotoViaMenu();
      await expect(page).toHaveURL(BRANCH_RE);
    });

    // ===== 保存・エラー系（要シード／永続化副作用あり＝fixme。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M09-10-020 有効入力で登録→保存完了メッセージ（要: SEED-M09-BRANCH 整合データ・非破壊化）",
      async () => {
        // 期待は設計(処理フロー #10-11／表示メッセージ「管理画面共通の保存完了文言」)由来。
        // 非共通支店・既存画像維持・タイル4枠相異・ピックアップ以外タグ設定済のシード投入後に実装。
        // 成功文言は付帯表4#3（保存しました）の差異を踏まえ、保存完了領域の表示で判定する。
      }
    );

    test.fixme(
      "E2E-M09-10-021 共通無効で画像空→「バナーイメージファイルを指定してください。」で滞留（要: SEED-M09-BRANCH-NOIMG）",
      async () => {
        // 期待は設計(処理フロー #5／表示メッセージ：支店共通設定無効＋既存/新規画像なし)由来＝
        // 「バナーイメージファイルを指定してください。」。S3保存結果空時の「バナー画像の登録に失敗しました。」とは区別。
        // 刷新実装は両者を後者へ統合（付帯表4#4）。実装文言にオラクルを寄せず、設計文言の表示有無＋同一画面滞留で判定。
        // addError の出力先セレクタは要実機確認（付帯表4#7）。
      }
    );

    test.fixme(
      "E2E-M09-10-022 タイル位置重複→「タイル位置に重複があります。…」で滞留（要: SEED-M09-BRANCH）",
      async () => {
        // 期待は設計(処理フロー #6／表示メッセージ duplicate_section)由来。タイル位置を2枠で同一値にして検証。
      }
    );

    test.fixme(
      "E2E-M09-10-023 ピックアップ以外でタグ未設定→「タイルタグを設定してください」で滞留（要: SEED-M09-BRANCH）",
      async () => {
        // 期待は設計(処理フロー #7／表示メッセージ tag_required)由来。括弧差は付帯表4#5（部分一致判定）。
      }
    );

    test.fixme(
      "E2E-M09-10-024 支店共通設定を有効にして登録→共通フラグだけ保存（要: SEED-M09-BRANCH 非共通支店）",
      async () => {
        // 期待は設計(処理フロー 支店共通設定を保存／業務ルール 支店共通設定優先)由来。
        // 共通フラグだけ保存・保存完了メッセージを観測（フラグ値・タイル未更新はDB間接/手動）。
      }
    );

    test.fixme(
      "E2E-M09-10-025 支店選択を変更→選択支店の設定が再表示（要: SEED-M09-MULTI 複数支店・刷新はPOST select）",
      async () => {
        // 期待は設計(利用者視点の入口 支店選択変更)由来。刷新は branch_list change→POST admin_content_branch_toppage_select（付帯表4#2）。
        // 複数支店シードで別支店を選択し、選択支店で再表示されることを判定する。
      }
    );

    test.fixme(
      "E2E-M09-10-026 タイル位置未選択で登録→必須フォームエラーで保存されず滞留（要: SEED-M09-BRANCH）",
      async () => {
        // 期待は設計(入力項目:タイル位置=必須／エラー処理:フォーム制約違反はフォームエラー)由来。
        // いずれかのタイル位置を空値で送信し、フォームエラー表示＋同一画面滞留＋未保存で判定。
        // 実装の必須メッセージ文言はオラクル化しない（.alert.alert-danger の表示有無で判定）。
      }
    );

    test.fixme(
      "E2E-M09-10-027 タイル属性未選択で登録→必須フォームエラーで保存されず滞留（要: SEED-M09-BRANCH）",
      async () => {
        // 期待は設計(入力項目:タイル属性=必須／エラー処理:フォーム制約違反はフォームエラー)由来。
        // いずれかのタイル属性を空値で送信し、フォームエラー表示＋同一画面滞留＋未保存で判定。
      }
    );

    test.fixme(
      "E2E-M09-10-028 ピックアップ商品ならタグ空でも登録できる→保存完了（E2E-023の正常系対）（要: SEED-M09-BRANCH）",
      async () => {
        // 期待は設計(タイルタグ:ピックアップ商品はタグ不要／業務ルール)由来。
        // タイル属性=ピックアップ商品(id=4)・タグ空で登録し、保存完了領域の表示＋滞留で判定。
        // tag_id=NULL のDB値確認は間接/手動（付帯表2b 064）。
      }
    );
  }
);
