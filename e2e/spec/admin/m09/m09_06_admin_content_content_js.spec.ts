/**
 * 管理画面 コンテンツ管理 JavaScript管理（customize.js 編集）E2E。
 * 納品ケース表 integration_test/e2e/m09_06_admin_content_content_js_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、要実機/破壊的/環境操作は test.fixme（理由付き）で残す。
 * 「手動」「対象外」はケース表で全量管理し、spec には大量の fixme を残さない（規約準拠）。
 *
 * 期待結果は仕様(m09-06_admin_content_content_js.md / messages.ja.yaml)由来（オラクル独立性）。
 * 実装(Twig/Controller)から取得したのはセレクタ(位置情報)のみで、合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行方針（安全第一・共有ステージング）:
 *  - 認証情報（ECCUBE_ADMIN_USER/PASS）が無ければ test.skip でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 保存系は customize.js を上書きするため、**現在のエディタ内容をそのまま登録する冪等送信**のみ実装し、
 *    内容を変える 012（空文字保存）は破壊的なため fixme（隔離環境でのみ実施）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ContentContentJsPage } from "../../../pages/admin/content_content_js.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const SAVE_COMPLETE = "保存しました"; // admin.common.save_complete :1398
const TOOLTIP_TEXT =
  "カスタマイズ用JavaScriptファイルを編集します。JavaScriptで記述します。"; // tooltip.content.js_source_code :3443

const JS_RE = /\/content\/js(\?|$)/;
const PAGE_RE = /\/content\/page(\?|$)/;
const LOGIN_RE = /\/login(\?|$)/;

/** 管理ログインして JavaScript管理画面を開く。 */
async function openJsScreen(page: Page): Promise<ContentContentJsPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const js = new ContentContentJsPage(page);
  await js.goto();
  await expect(page).toHaveURL(JS_RE);
  return js;
}

test.describe(
  "コンテンツ管理 > JavaScript管理",
  { tag: ["@admin", "@content"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M09-06-017 未ログインで /content/js 直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/content/js`);
      await expect(page.locator("#login_id")).toBeVisible();
      await expect(page).toHaveURL(LOGIN_RE);
    });

    // ===== 表示要素（ログイン要・非破壊） =====

    test("E2E-M09-06-001 見出し「JavaScript管理」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const js = await openJsScreen(page);
      await expect(js.pageTitle).toContainText("JavaScript管理");
    });

    test("E2E-M09-06-002 サブ見出し「コンテンツ管理」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const js = await openJsScreen(page);
      await expect(js.pageSubTitle).toContainText("コンテンツ管理");
    });

    test("E2E-M09-06-003 カード見出し「JavaScript設定」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const js = await openJsScreen(page);
      await expect(js.cardTitle).toContainText("JavaScript設定");
    });

    test("E2E-M09-06-004 コード項目ラベルと必須バッジ「必須」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const js = await openJsScreen(page);
      await expect(js.codeLabel).toBeVisible();
      await expect(js.requiredBadge).toBeVisible(); // 画面は必須バッジ表示（フォームは required=false）
    });

    test("E2E-M09-06-005 コードエディタ領域(#editor)が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const js = await openJsScreen(page);
      await expect(js.editor).toBeVisible();
    });

    test("E2E-M09-06-006 登録ボタン「登録」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const js = await openJsScreen(page);
      await expect(js.saveButton).toBeVisible();
      await expect(js.saveButton).toContainText("登録");
    });

    test("E2E-M09-06-007 戻る導線リンクが表示される（content/page へ）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const js = await openJsScreen(page);
      await expect(js.backLink).toBeVisible();
    });

    test("E2E-M09-06-008 コード見出しのツールチップ文言（title属性）が仕様どおり", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const js = await openJsScreen(page);
      await expect(js.tooltipAnchor).toHaveAttribute("title", TOOLTIP_TEXT);
    });

    test("E2E-M09-06-015 構文エラーが無い間は登録ボタンが活性である", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const js = await openJsScreen(page);
      await expect(js.saveButton).toBeEnabled(); // 注釈エラー無し＝活性（仕様: JS挙動 構文チェック）
    });

    test("E2E-M09-06-019 本画面はモーダル・確認ダイアログを表示しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const js = await openJsScreen(page);
      await expect(page.locator(".modal.show")).toHaveCount(0); // 仕様: モーダル/ポップアップ不使用
    });

    // ===== 登録（冪等＝既存内容のまま保存。非破壊） =====

    test("E2E-M09-06-010 現在の内容で登録すると「保存しました」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const js = await openJsScreen(page);
      await js.submitUnchanged(); // 既存 customize.js をそのまま上書き（内容不変）
      await expect(page.locator("body")).toContainText(SAVE_COMPLETE);
    });

    test("E2E-M09-06-011 登録成功後は同一のJavaScript管理画面へリダイレクトされる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const js = await openJsScreen(page);
      await js.submitUnchanged();
      await expect(page).toHaveURL(JS_RE); // 仕様: 成功時は同一画面へリダイレクト
    });

    test("E2E-M09-06-013 登録成功後の再表示でエディタへ保存後内容が読み直される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const js = await openJsScreen(page);
      const before = await js.readEditorValue(); // 送信前のエディタ内容（Ace）
      await js.submitUnchanged();
      await expect(page).toHaveURL(JS_RE);
      await expect(js.editor).toBeVisible();
      // 仕様(データ整合性: 保存後の内容を読み直す)由来。冪等送信のため再表示値は送信前と一致する。
      // 注: 内容を変えた書戻し(editor→#form_js)の検証は破壊的なため 012(隔離環境) で実施＝要確認。
      const after = await js.readEditorValue();
      expect(after).toBe(before);
    });

    // ===== 戻る導線 =====

    test("E2E-M09-06-016 戻る導線を押下するとページ管理一覧へ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const js = await openJsScreen(page);
      await js.backLink.click();
      await expect(page).toHaveURL(PAGE_RE);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M09-06-009 案内メッセージ(ECCUBE_RESTRICT_FILE_UPLOAD)が初回のみ表示・2回目以降は非表示（要: 未表示セッション状態）",
      async () => {
        // 期待は仕様(処理フロー: addInfoOnce で同一セッション1回限り / messages.ja.yaml:1602)由来。
        // 正常系(初回アクセスで案内表示)と異常系の対(2回目アクセスでは案内が再表示されないこと)の両側を検証する。
        // addInfoOnce はセッション既表示フラグに依存するため、未表示の新規セッションを用意して実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M09-06-012 空文字で登録→検証通過し保存成功（必須なし。破壊的のため隔離環境のみ）",
      async () => {
        // 期待は仕様(バリデーション: コードは required=false／業務ルール: 空内容で上書き保存され得る)由来。
        // customize.js を空に上書きするため共有環境では実行しない。隔離環境＋復元手順の整備後に実装。
      }
    );

    test.fixme(
      "E2E-M09-06-014 JavaScript構文エラー検知で登録ボタンが非活性になる（要: Aceエディタ操作の実機確認）",
      async () => {
        // 期待は仕様(フロント挙動 JS挙動 構文チェック: 注釈にエラー種別1件以上で非活性)由来。
        // Ace の注釈(lint)反映は非同期かつ環境差があるため、待機・トリガ手順を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M09-06-021 編集した非空JSを登録→保存後の再表示で同一内容が読み直される（送信書戻し・データ整合性。破壊的のため隔離環境のみ）",
      async ({ page }) => {
        // 期待は仕様(フロント挙動 JS挙動 送信書戻し／データ整合性 保存後に読み直す)由来。
        // 送信時にエディタ値が非表示textareaへ書き戻され、保存後リダイレクト先で同一内容が再読込されることを検証する。
        // customize.js を一意な非空JSで上書きするため共有環境では実行しない。隔離環境(SEED-M09-06-ISOLATED)＋復元手順の整備後に実装。
        const js = await openJsScreen(page);
        const code = `/* e2e-${Date.now()} */ window.__e2e = 1;`;
        await js.setEditorValue(code);
        await js.submit();
        await expect(page).toHaveURL(JS_RE);
        await expect(page.locator("body")).toContainText(SAVE_COMPLETE);
        await expect(js.editor).toBeVisible();
        expect(await js.readEditorValue()).toBe(code);
      }
    );
  }
);
