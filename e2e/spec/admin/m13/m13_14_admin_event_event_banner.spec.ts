/**
 * 管理画面 イベント管理「バナー設定（イベントバナー管理）」E2E（M13-14）。
 * 納品ケース表 integration_test/e2e/m13_14_admin_event_event_banner_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」（実装済み）と、自動化対象だが seed(mtb_bannerスロット)/S3/JSダイアログのため
 * 未実装の test.fixme のみを残す。手動/対象外はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m13-14_admin_event_event_banner.md / 観点表)由来（オラクル独立性）。
 * 実装の現挙動・Form制約・内部ルート名・Cookie名は期待値に流用しない。設計源は pf-eccube3 リバースだが、
 * 基本設計/観点表を上位オラクルとし、刷新先 ec-cube-enterprise に当該画面の存在を確認済み:
 *   一覧/設定 admin_event_banner = GET /<route>/event/banner（BannerController.php:57）/
 *   店舗絞り込み admin_event_banner_narrow = GET /<route>/event/banner/{htmlClass}（:58）/
 *   設定保存 = POST /<route>/event/banner/settings（:71）/ アップロード = POST /<route>/event/banner/image/upload（:91）/
 *   削除 = DELETE /<route>/event/banner/delete（:121）。
 *   ※設計書の路由表記 /banner/event とは順序が相違（ケース表 付帯表4#1。位置情報として実パスを使用）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(012)は資格情報不要。店舗絞り込み(010)は BANNER_HTML_CLASS が無ければ skip。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { EventEventBannerPage } from "../../../pages/admin/m13/m13_14_admin_event_event_banner.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// 店舗絞り込み(010)用。有効な店舗HTMLクラス（無ければ skip）。
const BANNER_HTML_CLASS = process.env.BANNER_HTML_CLASS || "";

// 未認証ガードの誘導先は管理画面共通ログイン（/<route>/login）に固定する。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$|/)`);
const INDEX_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/event/banner(\\?|$|/|#)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 イベント管理 > バナー設定",
  { tag: ["@admin", "@event", "@banner"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M13-14-012 未ログインで設定画面URL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new EventEventBannerPage(page);
      await p.goto();
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可（未ログイン管理者はアクセス不可）
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M13-14-001 設定画面にイベントバナー管理のタイトルが表示される", async ({ page }) => {
        await login(page);
        const p = new EventEventBannerPage(page);
        await p.goto();
        await expect(page).toHaveURL(INDEX_RE);
        // タイトルは仕様の表示名で確認（実装trans admin.event.banner_page）。
        await expect(page.locator("body")).toContainText("イベントバナー管理");
      });

      test("E2E-M13-14-002 設定画面にイベント管理のサブタイトルが表示される", async ({ page }) => {
        await login(page);
        const p = new EventEventBannerPage(page);
        await p.goto();
        await expect(page.locator("body")).toContainText("イベント管理");
      });

      test("E2E-M13-14-003 設定フォーム（画像URL・リンク先URL・表示タイプ・言語・表示店舗・画像alt・並び順）が表示される", async ({
        page,
      }) => {
        // 設定フォームのスロット入力欄は mtb_banner スロットの存在に依存する（SEED-M13-14-BANNER）。
        await login(page);
        const p = new EventEventBannerPage(page);
        await p.goto();
        await p.seeSettingForm();
      });

      test("E2E-M13-14-004 アップロードフォーム（画像ファイル・店舗・アップロードボタン）が表示される", async ({
        page,
      }) => {
        await login(page);
        const p = new EventEventBannerPage(page);
        await p.goto();
        await p.seeUploadForm();
      });

      test("E2E-M13-14-005 画像一覧テーブルの見出し（画像/更新日付/画像URL/削除）が表示される", async ({
        page,
      }) => {
        await login(page);
        const p = new EventEventBannerPage(page);
        await p.goto();
        await p.seeFileListHeaders();
      });

      test("E2E-M13-14-006 店舗未指定時に絞り込みドロップダウンへ「全て」が表示される", async ({ page }) => {
        await login(page);
        const p = new EventEventBannerPage(page);
        await p.goto();
        await expect(p.filterToggle).toContainText("全て"); // trans admin.event.banner.filter_all
      });

      test("E2E-M13-14-007 「バナー設定」送信ボタンが表示される", async ({ page }) => {
        await login(page);
        const p = new EventEventBannerPage(page);
        await p.goto();
        await expect(p.settingSubmit).toBeVisible();
        await expect(p.settingSubmit).toContainText("バナー設定"); // trans admin.event.banner.setting_submit
      });

      test("E2E-M13-14-010 店舗で絞り込むと当該店舗に絞り込んだ画面が表示される", async ({ page }) => {
        test.skip(!BANNER_HTML_CLASS, "BANNER_HTML_CLASS 未設定（有効な店舗HTMLクラス）");
        await login(page);
        const p = new EventEventBannerPage(page);
        await p.gotoNarrow(BANNER_HTML_CLASS);
        // 絞り込み画面でも設定画面の入口（一覧テーブル）が表示されること。母集合の厳密一致は手動/間接。
        await expect(page).toHaveURL(new RegExp(`/event/banner/${BANNER_HTML_CLASS}(\\?|$|/|#)`));
        await expect(page.locator("body")).toContainText("イベントバナー管理");
      });

      test("E2E-M13-14-011 存在しないhtmlClassで絞り込みアクセスすると404になる", async ({ page }) => {
        await login(page);
        const p = new EventEventBannerPage(page);
        // 認証済みコンテキストの request で応答ステータスを観測する（不正htmlClass→NotFoundHttpException）。
        const res = await page.request.get(p.narrowUrl("e2e_no_such_class_xyz"));
        expect(res.status()).toBe(404);
      });
    });

    // ===== 保留（自動化対象だが seed/S3/JSダイアログのため未実装。理由付き fixme・抜け漏れ可視化） =====

    test.fixme(
      "E2E-M13-14-020 有効入力で「バナー設定」→保存完了メッセージ（要: SEED-M13-14-BANNER スロット・保存は破壊的）",
      async () => {
        // 期待は仕様(処理フロー 設定・更新→保存完了)由来。flash admin.common.save_complete を確認。
      }
    );

    test.fixme(
      "E2E-M13-14-021 設定保存成功後に設定画面へリダイレクト（PRG）（要: SEED-M13-14-BANNER）",
      async () => {
        // 期待は仕様(画面遷移 設定・更新後 設定画面へ戻る)由来。303→/event/banner を確認。
      }
    );

    test.fixme(
      "E2E-M13-14-023 検証エラー時に確定しない入力値が再表示フォームに保持される（要: SEED-M13-14-BANNER）",
      async () => {
        // 期待は仕様(データ整合性「再表示」=検証エラー時に確定しない入力値はフォーム値に留まる)由来。
        // 検証エラー（例: 並び順空）で設定画面再表示・入力値保持を確認。実装文言は流用しない。
      }
    );

    test.fixme(
      "E2E-M13-14-024 店舗絞り込み中に保存→当該絞り込み画面へ戻る（narrow PRG）（要: SEED-M13-14-BANNER・SEED-M13-14-SHOP）",
      async () => {
        // 期待は仕様(利用者視点の入口 POST /banner/event/{html_class}・画面遷移 設定後 設定画面へ戻る)由来。
        // 303→/event/banner/{htmlClass} を確認。
      }
    );

    test.fixme(
      "E2E-M13-14-038 リンク先URL上限長超過→文字列長エラーで保存されない（036の対）（要: SEED-M13-14-BANNER・文言は要実機確認）",
      async () => {
        // 期待は仕様(文字列長)由来。長さ超過メッセージは刷新先既定文言のため要実機確認（Form制約を流用しない）。
      }
    );

    test.fixme(
      "E2E-M13-14-039 並び順 1未満（0/負）→範囲外エラーで保存されない（032の下限対）（要: SEED-M13-14-BANNER）",
      async () => {
        // 期待は仕様(数値範囲 下限境界)由来。サーバ sort_no_range（下限分岐）。
      }
    );

    test.fixme(
      "E2E-M13-14-030 並び順 空送信→並び順が空である旨のエラーで保存されない（要: スロットseed・JSダイアログ）",
      async () => {
        // 期待は仕様(入力項目 並び順必須)由来。JSアラート（alert_sort_no_empty）またはサーバ sort_no_required。
      }
    );

    test.fixme(
      "E2E-M13-14-031 並び順 重複送信→並び順重複エラーで保存されない（要: スロットseed・JSダイアログ）",
      async () => {
        // 期待は仕様(相関 並び順重複)由来。
      }
    );

    test.fixme(
      "E2E-M13-14-032 並び順 範囲外送信→範囲外エラーで保存されない（要: SEED-M13-14-BANNER）",
      async () => {
        // 期待は仕様(数値範囲)由来。サーバ sort_no_range（JSは範囲を検査せず到達する）。
      }
    );

    test.fixme(
      "E2E-M13-14-033 画像URLに業務ルール上許可されない値→検証エラーで保存されない（要: SEED-M13-14-BANNER）",
      async () => {
        // 期待は仕様(その他バリデーション・検証失敗で設定画面再表示)由来。
        // 具体規則（禁止ドメイン等）は実装固有で観点表/設計書に定義が無い＝付帯表4#7 要確認。実装文言は流用しない。
      }
    );

    test.fixme(
      "E2E-M13-14-034 画像URLに使用不可文字→文字種エラーで保存されない（要: SEED-M13-14-BANNER）",
      async () => {
        // 期待は仕様(文字種)由来。
      }
    );

    test.fixme(
      "E2E-M13-14-035 リンク先URLに使用不可文字→文字種エラーで保存されない（要: SEED-M13-14-BANNER）",
      async () => {
        // 期待は仕様(文字種)由来。
      }
    );

    test.fixme(
      "E2E-M13-14-036 画像URL上限長超過→文字列長エラーで保存されない（要: SEED-M13-14-BANNER・文言は要実機確認）",
      async () => {
        // 期待は仕様(文字列長)由来。長さ超過メッセージは刷新先既定文言のため要実機確認（Form制約を流用しない）。
      }
    );

    test.fixme(
      "E2E-M13-14-037 画像URL上限長以内→文字列長エラーにならず保存できる（要: SEED-M13-14-BANNER）",
      async () => {
        // 期待は仕様(文字列長 上限内は正常)由来。
      }
    );

    test.fixme(
      "E2E-M13-14-040 店舗未選択でアップロード→店舗必須エラーで処理されない（要: 編集可能店舗seed）",
      async () => {
        // 期待は仕様(アップロード店舗必須)由来。upload_shops_required を確認。S3呼出前で非破壊。
      }
    );

    test.fixme(
      "E2E-M13-14-050 削除リンクに確認ダイアログ文言とCSRFトークンが設定される（要: SEED-M13-14-IMAGE）",
      async () => {
        // 期待は仕様(確認ダイアログ・CSRF)由来。data-message=delete_confirm ＋ csrf_token を確認。
      }
    );
  }
);
