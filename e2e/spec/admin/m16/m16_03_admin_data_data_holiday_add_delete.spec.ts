/**
 * 管理画面 データ管理 > 祝日の追加・削除 E2E。
 * 納品ケース表 integration_test/e2e/m16_03_admin_data_data_holiday_add_delete_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」かつ非破壊で安全に実行できるケースを test として実装し、破壊的（mtb_holiday の
 * insert/delete を伴う追加成功・削除成功）や専用シード/トークン偽造が必要なケースは test.fixme（理由付き）で
 * 抜け漏れを可視化する。手動/間接・対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約準拠）。
 * 期待結果は仕様(設計書 functions/pf-eccube3/m16-03_admin_data_data_holiday_add_delete.md / 観点表 /
 * 刷新先 messages.ja.yaml・validators.ja.yaml)由来（オラクル独立性）。実装の現挙動・Form制約値(NotBlank/Length max=64)を
 * 期待値に流用しない。
 * 本設計書は現行 pf-eccube3(HareruyaEcプラグイン)のリバースであり、刷新先 ec-cube-enterprise はコア提供。
 * ルート(/data/holiday)・トグル要素・メッセージ鍵・タイトルの乖離はケース表 付帯表4 に分離する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も @playwright/test を
 * 直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 *
 * シード（環境変数。コミットしない）:
 *  - HOLIDAY_DUP_DATE : SEED-M16-03-HOLIDAY（既存祝日の日付 yyyy-MM-dd。重複エラー検証用・参照のみ）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { DataDataHolidayAddDeletePage } from "../../../pages/admin/m16/m16_03_admin_data_data_holiday_add_delete.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const HOLIDAY_DUP_DATE = process.env.HOLIDAY_DUP_DATE || ""; // 既存祝日日付（重複検証用）
const HAS_DUP = HAS_CREDS && !!HOLIDAY_DUP_DATE;

// 仕様(刷新先 messages.ja.yaml / validators.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const MSG_REGISTER_COMPLETE = "登録が完了しました。"; // admin.register.complete :1773（追加成功）
const MSG_REGISTER_FAILED = "登録できませんでした。"; // admin.register.failed :1774（検証失敗）
const MSG_OVERLAP = "入力した日付が、登録済みの祝日と重複しています。"; // admin.data.holiday.overlap :5839
const LABEL_ADD = "新規登録"; // admin.data.holiday.add_button :5828
const LABEL_BACK = "戻る"; // admin.common.back :1464

const LOGIN_RE = /\/login(\?|$)/;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// 一覧URL（admin_data_holiday = /<route>/data/holiday）。追加/削除の各分岐は同ルートへリダイレクトされる仕様。
const LIST_RE = new RegExp(`/${escapeRe(ECCUBE_ADMIN_ROUTE)}/data/holiday(\\?|$)`);

async function adminLogin(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 > データ管理 祝日の追加・削除",
  { tag: ["@admin", "@data", "@holiday"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M16-03-050 未ログインで祝日管理URL直接→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/data/holiday`);
      await expect(page.locator("#login_id")).toBeVisible();
      await expect(page).toHaveURL(LOGIN_RE);
    });

    test("E2E-M16-03-051 未ログインで追加POSTを直接送信→管理ログインゲート（保存されない）", async ({ request }) => {
      // 期待は仕様(権限・認可 未ログインは管理ログインゲートにより到達しない 正本md:173)由来。
      // 認証ファイアウォールがコントローラ前段で働くため、未ログインPOSTはログインへ誘導される（保存されない）。
      const resp = await request.post(`/${ECCUBE_ADMIN_ROUTE}/data/holiday`, {
        form: { "holiday_add[name]": "未ログイン", "holiday_add[date]": "2099-12-31" },
      });
      expect(resp.url()).toMatch(LOGIN_RE);
    });

    test("E2E-M16-03-052 未ログインで削除DELETEを直接送信→管理ログインゲート（削除されない）", async ({ request }) => {
      // 期待は仕様(権限・認可 正本md:173)由来。ゲートはID解決前に働くためダミーIDで足りる（削除されない）。
      const resp = await request.fetch(`/${ECCUBE_ADMIN_ROUTE}/data/holiday/999999/delete`, {
        method: "DELETE",
      });
      expect(resp.url()).toMatch(LOGIN_RE);
    });

    // ===== 表示・トグル（非破壊・HAS_CREDS） =====

    test("E2E-M16-03-001 一覧が列見出し「名称」「日付」「削除」付きで表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M16-03-ADMIN）");
      await adminLogin(page);
      const holiday = new DataDataHolidayAddDeletePage(page);
      await holiday.gotoList();
      await holiday.seeListColumns();
    });

    test("E2E-M16-03-005 入口に期間指定の一括読込フォーム（開始～終了日付）が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M16-03-ADMIN）");
      await adminLogin(page);
      const holiday = new DataDataHolidayAddDeletePage(page);
      await holiday.gotoList();
      // 期待は仕様(利用者視点の入口 上部に期間指定の一括読込用フォーム 正本md:28)由来。DOM id は要実機確認。
      await holiday.seeLoadForm();
    });

    test("E2E-M16-03-006 一覧が登録済み祝日を日付昇順で表示する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const holiday = new DataDataHolidayAddDeletePage(page);
      await holiday.gotoList();
      const dates = await holiday.listDateCells();
      test.skip(dates.length < 2, "日付の異なる祝日が複数件必要（SEED-M16-03-HOLIDAY 複数）");
      // 期待は仕様(処理フロー 一覧は mtb_holiday 全件を日付昇順で表示 正本md:55,82)由来。
      // 日付は Y/m/d でゼロ詰めのため文字列昇順＝暦日昇順。
      const sorted = [...dates].sort();
      expect(dates).toEqual(sorted);
    });

    test("E2E-M16-03-002 新規登録ボタンが表示され追加フォームは初期非表示", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const holiday = new DataDataHolidayAddDeletePage(page);
      await holiday.gotoList();
      await expect(holiday.addToggle).toContainText(LABEL_ADD); // 「新規登録」
      await expect(holiday.addForm).toBeHidden(); // 追加フォームは初期非表示
    });

    test("E2E-M16-03-003 新規登録押下で追加フォーム表示・ボタン「戻る」に切替", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const holiday = new DataDataHolidayAddDeletePage(page);
      await holiday.gotoList();
      await holiday.openAddForm();
      await expect(holiday.addForm).toBeVisible();
      // 展開後の可視ラベルは「戻る」（仕様: 新規登録 ⇄ 戻る）。collapse のラベル切替は要実機確認。
      await expect(holiday.toggleVisibleLabel()).resolves.toContain(LABEL_BACK);
    });

    test("E2E-M16-03-004 「戻る」押下で追加フォーム非表示・ボタン「新規登録」に復帰", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const holiday = new DataDataHolidayAddDeletePage(page);
      await holiday.gotoList();
      await holiday.openAddForm();
      await holiday.closeAddForm();
      await expect(holiday.addForm).toBeHidden();
      await expect(holiday.toggleVisibleLabel()).resolves.toContain(LABEL_ADD);
    });

    // ===== 追加 検証失敗（非破壊＝DB書込なし・HAS_CREDS） =====

    test("E2E-M16-03-020 名称未入力で追加→失敗メッセージ・一覧へリダイレクト", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const holiday = new DataDataHolidayAddDeletePage(page);
      await holiday.gotoList();
      await holiday.openAddForm();
      await holiday.submitAdd("", "2099-12-31"); // 名称空・日付有効
      await holiday.seeMessage(MSG_REGISTER_FAILED);
      await expect(page).toHaveURL(LIST_RE); // 一覧へリダイレクト
    });

    test("E2E-M16-03-021 日付未入力で追加→失敗メッセージ・一覧へリダイレクト", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const holiday = new DataDataHolidayAddDeletePage(page);
      await holiday.gotoList();
      await holiday.openAddForm();
      await holiday.submitAdd("E2Eテスト祝日", ""); // 日付空・名称有効
      await holiday.seeMessage(MSG_REGISTER_FAILED);
      await expect(page).toHaveURL(LIST_RE);
    });

    test("E2E-M16-03-012 検証失敗リダイレクト後 追加フォームは初期非表示へ戻り入力値が保持されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const holiday = new DataDataHolidayAddDeletePage(page);
      await holiday.gotoList();
      await holiday.openAddForm();
      await holiday.submitAdd("", "2099-12-31"); // 名称空＝検証失敗で一覧へリダイレクト（非破壊）
      await expect(page).toHaveURL(LIST_RE);
      // 期待は仕様(画面遷移 遷移後は追加フォーム再び非表示・入力値をセッション退避しない 正本md:190,231)由来。
      await expect(holiday.addForm).toBeHidden();
      await expect(holiday.nameInput).toHaveValue("");
    });

    // ===== 追加 重複（非破壊＝保存されない・要既存祝日シード） =====

    test("E2E-M16-03-030 既登録と同一日付で追加→重複エラーメッセージ・追加されない", async ({ page }) => {
      test.skip(!HAS_DUP, "HOLIDAY_DUP_DATE 未設定（SEED-M16-03-HOLIDAY 既存祝日日付）");
      await adminLogin(page);
      const holiday = new DataDataHolidayAddDeletePage(page);
      await holiday.gotoList();
      await holiday.openAddForm();
      await holiday.submitAdd("E2E重複祝日", HOLIDAY_DUP_DATE); // 既存と同一日付
      await holiday.seeMessage(MSG_OVERLAP); // 重複エラー（保存しない）
      await expect(page).toHaveURL(LIST_RE);
    });

    // ===== 削除 確認ダイアログ却下（非破壊・要既存祝日） =====

    test("E2E-M16-03-041 削除確認ダイアログを却下すると削除されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const holiday = new DataDataHolidayAddDeletePage(page);
      await holiday.gotoList();
      const count = await holiday.deleteLinks.count();
      test.skip(count === 0, "削除可能な既存祝日が無い（SEED-M16-03-HOLIDAY）");
      page.on("dialog", (d) => d.dismiss()); // 確認ダイアログを却下
      await holiday.deleteLinks.first().click();
      // 却下のため削除POSTは発生せず、URLは一覧のまま・行数不変・削除成功メッセージは出ないこと。
      await expect(page).toHaveURL(LIST_RE);
      await expect(holiday.deleteLinks).toHaveCount(count);
      await expect(page.locator("body")).not.toContainText("削除しました");
    });

    // ===== 保留（破壊的/手動・理由付きで未実行・抜け漏れ可視化。ケース表で全量管理） =====

    test.fixme(
      "E2E-M16-03-010 未登録日付で追加→登録完了メッセージ（破壊的: mtb_holiday insert・要クリーンアップ）",
      async () => {
        // 期待は仕様(処理フロー 追加成功 admin.register.complete)由来。識別接頭辞付き未来日付で投入し後始末する手順を実装。
      }
    );

    test.fixme(
      "E2E-M16-03-011 追加成功後 一覧に当該日付行が表示される（破壊的・間接DB確認）",
      async () => {
        // 期待は仕様(データ整合性 一覧は mtb_holiday 現在状態を日付昇順)由来。SEED投入＋クリーンアップ後に実装。
      }
    );

    test.fixme(
      "E2E-M16-03-022 名称64文字（境界内）で追加→登録完了（破壊的: insert・要クリーンアップ）",
      async () => {
        // 期待は仕様(バリデーション 祝日名 最大64＝境界内は成功)由来。
      }
    );

    test.fixme(
      "E2E-M16-03-023 名称65文字（境界外）で追加→失敗メッセージ・一覧へリダイレクト（要: maxlength回避）",
      async () => {
        // 期待は仕様(バリデーション 祝日名 最大64＝超過は失敗・admin.register.failed)由来。
        // 仕様(正本md:96)上ウィジェットに maxlength=64 が付くため、fill("あ".repeat(65)) はブラウザで64文字へ
        // 丸められ、サーバ側Lengthを越えず登録成功＝mtb_holiday へ insert する破壊的副作用となり境界超過を検証できない。
        // 65文字をサーバへ実送信するには DOM の maxlength 属性除去か直接POSTが必要。実機確認後に実装する（付帯表4#8）。
      }
    );

    test.fixme(
      "E2E-M16-03-040 削除確認承認→削除完了メッセージ（破壊的: delete・使い捨てSEED-M16-03-HOLIDAY-DEL）",
      async () => {
        // 期待は仕様(処理フロー 削除成功 admin.common.delete_complete)由来。使い捨て祝日を投入し削除する手順を実装。
      }
    );

    test.fixme(
      "E2E-M16-03-042 削除成功後 一覧から当該日付行が消える（破壊的・間接DB確認）",
      async () => {
        // 期待は仕様(データ整合性 削除直後 一覧再読込で行が消える)由来。
      }
    );

    test.fixme(
      "E2E-M16-03-060 CSRF無効な追加送信→アクセス拒否(403)（要: 無効トークンでのPOST生成）",
      async () => {
        // 期待は仕様(エラー処理 CSRF不正→403)由来。トークン偽造リクエストを実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M16-03-061 CSRF無効な削除送信→アクセス拒否(403)（要: 無効トークンでのDELETE生成）",
      async () => {
        // 期待は仕様(エラー処理 CSRF不正→403・Controller.php:139 isTokenValid)由来。
      }
    );

    test.fixme(
      "E2E-M16-03-070 存在しないIDへの削除→アプリケーションエラー応答（要: DELETE＋有効CSRF生成）",
      async () => {
        // 期待は仕様(エラー処理 削除対象なし)由来。404 か delete_error フラッシュかは付帯表4#9の要確認。
      }
    );
  }
);
