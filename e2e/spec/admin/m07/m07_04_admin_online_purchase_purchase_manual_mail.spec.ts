/**
 * 管理画面 ネット買取管理「手動メール通知」E2E（M07-04）。
 * 納品ケース表 integration_test/e2e/m07_04_admin_online_purchase_purchase_manual_mail_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化（実装済み）」と「自動化予定だが未実装/要SEED・実送信副作用（test.fixme・理由付き）」のみ残す。
 * 手動（メール本文/Content-Type＝081／メールヘッダ To/From/Bcc/Reply-To/Return-Path＝086／指定宛先送信正常終了 IT-11＝087／
 * 送信元未設定#1＝082／SMTP失敗#3＝088／Twig破損・警告ログ＝083／件名255超DB例外＝084／
 * 境界/特殊文字でも送信正常終了 IT-28＝091／complete時テンプレ参照なし防御分岐＝092）と
 * 手動・間接（メール履歴INSERT件数＝080／履歴保存列値＝089／受注マスタ非更新＝090／テンプレ候補集合＝085）はケース表で全量管理する
 * （規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m07-04_...md の 処理フロー・バリデーション・画面遷移・エッジケース
 * ＋ messages.ja.yaml の翻訳キー)由来（オラクル独立性）。実装の現挙動・Form制約(NotBlank)・Cookie名は期待値に流用しない。
 * 検証エラーの表示文言・出力先クラスは bootstrap_4 レイアウト依存のため文言一致では判定せず、
 * 「確認画面へ進まず入力画面に留まる」を仕様(バリデーションNotBlank)由来の主判定とする（付帯表4-5）。
 *
 * 刷新先 ec-cube-enterprise に当該機能が存在することを確認済み:
 *   route admin_purchase_manual_mail = GET/POST /<route>/purchase/{buyOrderId}/mail（MailController.php:48）。
 *   入力 Twig manual_mail.twig / 確認 Twig manual_mail_confirm.twig / Form PurchaseManualMailType（getBlockPrefix=admin_purchase_manual_mail）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。未ログイン誘導(070)は資格情報不要。
 *  - 既存買取受注ID（SEED-M07-04-BUYORDER）が要るケースは BUYORDER_ID（環境変数）で供給。無ければ test.skip。
 *  - テンプレSEED依存（010/020/021/040/051/052）と 実送信副作用（030）は test.fixme（理由付き・抜け漏れ可視化）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OnlinePurchasePurchaseManualMailPage } from "../../../pages/admin/m07/m07_04_admin_online_purchase_purchase_manual_mail.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// 存在する買取受注ID（SEED-M07-04-BUYORDER）。無ければ表示系ケースは skip。
const BUYORDER_ID = process.env.BUYORDER_ID || "";
const HAS_BUYORDER = !!BUYORDER_ID;
// 確実に存在しない買取ID（int上限）。404分岐を踏むためのダミー。
const NON_EXISTENT_ID = "2147483647";

const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const MAIL_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/purchase/\\d+/mail(\\?|$)`);
// 成功フラッシュ（messages.ja.yaml:2346 admin.order.mail_send_complete）。仕様参照のlocale値であり実装定数の写しではない。
const SUCCESS_FLASH = "メールを送信しました。";

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 ネット買取管理 > 手動メール通知",
  { tag: ["@admin", "@online_purchase", "@mail"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M07-04-070 未ログインで入力URL直接→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new OnlinePurchasePurchaseManualMailPage(page);
      await p.gotoMail(NON_EXISTENT_ID); // 権限・認可（未ログインは管理FWで到達不可）
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M07-04-071 未ログインで確認POST→業務処理されず管理ログインへ誘導", async ({ page }) => {
      const p = new OnlinePurchasePurchaseManualMailPage(page);
      // 未ログインPOSTも管理ファイアウォールで到達不可（070のPOST対）。確認画面は返らずログインへ。
      const res = await page.request.post(p.mailUrl(NON_EXISTENT_ID), {
        form: { mode: "confirm" },
        maxRedirects: 0,
        failOnStatusCode: false,
      });
      // 管理FWはログイン画面へリダイレクトする（権限・認可 仕様由来。確認画面=200本文を返さない）。
      expect([301, 302, 307, 308]).toContain(res.status());
      expect(res.headers()["location"] || "").toMatch(
        new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login`)
      );
    });

    // ===== 404（資格情報のみ・SEED不要） =====

    test("E2E-M07-04-060 存在しない買取IDでGET→HTTP404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new OnlinePurchasePurchaseManualMailPage(page);
      const res = await page.goto(p.mailUrl(NON_EXISTENT_ID)); // エッジケース(404)
      expect(res?.status()).toBe(404);
    });

    test("E2E-M07-04-061 存在しない買取IDでPOST(mode=confirm)→HTTP404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new OnlinePurchasePurchaseManualMailPage(page);
      // 買取受注取得が先（Controller.php:51-54）。POSTでも find() 不一致で404。
      const res = await page.request.post(p.mailUrl(NON_EXISTENT_ID), {
        form: { mode: "confirm" },
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(404);
    });

    // ===== 入力画面表示（SEED-M07-04-BUYORDER） =====

    test("E2E-M07-04-001 入力画面: 見出し・カード・テンプレ選択・件名・本文・確認ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_BUYORDER, "SEED-M07-04-BUYORDER（BUYORDER_ID）未設定");
      await login(page);
      const p = new OnlinePurchasePurchaseManualMailPage(page);
      await p.gotoMail(BUYORDER_ID);
      // 見出しは default_frame 経由（page_title/sub_title）。出力先DOM要実機確認のため body テキストで確認。
      await expect(page.locator("body")).toContainText("買取管理");
      await expect(page.locator("body")).toContainText("手動メール通知");
      await p.seeInputForm(); // カード「手動メール送信」・テンプレ/件名/本文/確認ボタン
    });

    test("E2E-M07-04-002 入力画面: 買取番号が7桁ゼロ埋めで表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_BUYORDER, "SEED-M07-04-BUYORDER（BUYORDER_ID）未設定");
      await login(page);
      const p = new OnlinePurchasePurchaseManualMailPage(page);
      await p.gotoMail(BUYORDER_ID);
      // '%07d'|format(BuyOrder.id)（manual_mail.twig:37）。仕様(データ整合性 ゼロ埋め規則)由来。
      const padded = String(Number(BUYORDER_ID)).padStart(7, "0");
      await expect(page.locator("body")).toContainText(padded);
    });

    test("E2E-M07-04-003 入力画面: テンプレ選択が未選択(プレースホルダ)で初期表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_BUYORDER, "SEED-M07-04-BUYORDER（BUYORDER_ID）未設定");
      await login(page);
      const p = new OnlinePurchasePurchaseManualMailPage(page);
      await p.gotoMail(BUYORDER_ID);
      // 入力項目(テンプレ選択 初期未選択)。選択値が空＝プレースホルダであること。
      await expect(p.templateSelect).toHaveValue("");
    });

    test("E2E-M07-04-004 入力画面: 下部コンバージョンエリアに「買取編集画面に戻る」リンクが表示され買取編集を指す", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_BUYORDER, "SEED-M07-04-BUYORDER（BUYORDER_ID）未設定");
      await login(page);
      const p = new OnlinePurchasePurchaseManualMailPage(page);
      await p.gotoMail(BUYORDER_ID);
      // フロント挙動(下部コンバージョンエリアのリンク)・画面遷移(買取編集へ)。manual_mail.twig:66 path(admin_purchase_edit)。
      await expect(p.editBackLink).toBeVisible();
      await expect(p.editBackLink).toHaveAttribute(
        "href",
        p.editUrlRe(BUYORDER_ID)
      );
    });

    test("E2E-M07-04-005 入力画面: GET直後は件名・本文が空で初期表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_BUYORDER, "SEED-M07-04-BUYORDER（BUYORDER_ID）未設定");
      await login(page);
      const p = new OnlinePurchasePurchaseManualMailPage(page);
      await p.gotoMail(BUYORDER_ID);
      // 入力項目(件名/本文 GET直後は空)。設計書 入力項目「GET 直後は空」由来。
      await expect(p.subject).toHaveValue("");
      await expect(p.body).toHaveValue("");
    });

    // ===== 必須バリデーション（全項目未入力は SEED-M07-04-BUYORDER のみで観測可） =====

    test("E2E-M07-04-050 全項目未入力で確認→入力画面に留まり検証エラー", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_BUYORDER, "SEED-M07-04-BUYORDER（BUYORDER_ID）未設定");
      await login(page);
      const p = new OnlinePurchasePurchaseManualMailPage(page);
      await p.gotoMail(BUYORDER_ID);
      await p.clickConfirm(); // テンプレ未選択・件名空・本文空（NotBlank×3）
      // 主判定: 確認画面へ進まず入力画面に留まる（仕様 バリデーション/処理フロー検証失敗）。
      await expect(page).toHaveURL(MAIL_RE);
      await expect(p.confirmButton).toBeVisible(); // 入力画面の確認ボタンが依然存在
      await expect(p.sendButton).toHaveCount(0); // 確認画面の送信ボタンは出ない
      // 副判定: 検証エラーが表示される（ケース表期待・仕様 NotBlank由来）。
      // 文言/出力先クラスは bootstrap_4 レイアウト依存（要実機確認）のため、文言一致ではなく
      // エラー要素の存在のみで判定する（オラクル独立性）。
      await expect(p.error.first()).toBeVisible();
    });

    test("E2E-M07-04-053 テンプレ未選択のみ(件名・本文は有効)で確認→入力画面に留まり検証エラー", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_BUYORDER, "SEED-M07-04-BUYORDER（BUYORDER_ID）未設定");
      await login(page);
      const p = new OnlinePurchasePurchaseManualMailPage(page);
      await p.gotoMail(BUYORDER_ID);
      // 件名・本文は手入力で有効値（テンプレSEED不要）。テンプレ選択のみ未選択＝template NotBlank の単独異常系。
      await p.fillSubject("テスト件名");
      await p.fillBody("テスト本文");
      await p.clickConfirm();
      // 主判定: 確認画面へ進まず入力画面に留まる（仕様 バリデーション template NotBlank）。
      await expect(page).toHaveURL(MAIL_RE);
      await expect(p.confirmButton).toBeVisible();
      await expect(p.sendButton).toHaveCount(0);
      // 副判定: 検証エラーが表示される（文言/出力先クラスは bootstrap_4 依存のため存在のみで判定）。
      await expect(p.error.first()).toBeVisible();
    });

    // ===== 保留（要テンプレSEED・実送信副作用。理由付きで未実行・抜け漏れ可視化） =====

    test.fixme(
      "E2E-M07-04-010 テンプレ変更(mode=change)で件名・本文が選択テンプレ由来でセットされる（要: SEED-M07-04-MAILTEMPLATE）",
      async () => {
        // 期待は仕様(処理フロー mode=change Controller.php:64-75)由来。買取メールテンプレ名が必要なため実機SEED確認後に実装。
      }
    );

    test.fixme(
      "E2E-M07-04-020 全項目入力で確認(mode=confirm)→確認画面が返る（要: SEED-M07-04-MAILTEMPLATE）",
      async () => {
        // 期待は仕様(処理フロー mode=confirm Controller.php:76-86)由来。テンプレ選択→件名/本文確定→確認の流れにテンプレSEEDが要る。
      }
    );

    test.fixme(
      "E2E-M07-04-021 確認画面の本文が white-space:pre-wrap の静的ブロックで表示される（要: SEED-M07-04-MAILTEMPLATE）",
      async () => {
        // 期待は仕様(フロント挙動 CSS / confirm.twig:56)由来。確認画面到達にテンプレSEEDが要る。
      }
    );

    test.fixme(
      "E2E-M07-04-040 確認画面で戻る(mode=back)→入力画面が返り内容維持（要: SEED-M07-04-MAILTEMPLATE）",
      async () => {
        // 期待は仕様(利用者視点の入口 mode=back・既定処理で入力テンプレ)由来。確認画面到達にテンプレSEEDが要る。
      }
    );

    test.fixme(
      "E2E-M07-04-051 件名未入力で確認→検証エラーで滞留（要: SEED-M07-04-MAILTEMPLATE）",
      async () => {
        // 期待は仕様(バリデーション subject NotBlank)由来。テンプレ・本文を埋めて件名のみ空にするためテンプレSEEDが要る。
      }
    );

    test.fixme(
      "E2E-M07-04-052 本文未入力で確認→検証エラーで滞留（要: SEED-M07-04-MAILTEMPLATE）",
      async () => {
        // 期待は仕様(バリデーション body NotBlank)由来。stub行025の「継続」期待は設計と矛盾＝設計優先（付帯表4-4）。
      }
    );

    test.fixme(
      "E2E-M07-04-030 送信(mode=complete)→成功フラッシュ付きで詳細編集へリダイレクト（要: 実メール送信＋履歴INSERTの副作用・専用受注/メールサーバ隔離）",
      async () => {
        // 期待は仕様(処理フロー mode=complete Controller.php:87-103 / 成功フラッシュ messages.ja.yaml:2346 = `${SUCCESS_FLASH}`)由来。
        // 実送信・dtb_mail_history INSERT の副作用があるため SEED-M07-04-MAILFROM＋使い捨て受注＋MailHog等の隔離後に実装。
      }
    );
  }
);
