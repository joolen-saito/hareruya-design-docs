/**
 * 管理画面 店舗設定 > 定休日カレンダー設定（M10-12）E2E。
 * 納品ケース表 integration_test/e2e/m10_12_admin_base_setting_setting_shop_calendar_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースを test() で実装する。手動/対象外（CSRF偽造・DB内部値・店舗解決・ログ出力抑止・
 * DB検索の非該当・数値/文字種など本機能非該当のバリデーション等）はケース表で全量管理しspecに残さない。
 * 自動化予定だが未実装/要実機（010/011 新規保存の永続・後始末／030/031 インライン更新の永続・後始末／
 * 033 同日重複インライン（要シード2行）／040 削除（削除応答がソース未確定＝要実機）／041 CSRF偽造）は
 * test.fixme で抜け漏れを可視化する。
 * 期待結果は仕様（正本 functions/ec-cube-enterprise/m10-12_admin_base_setting_setting_shop_calendar.md /
 * messages.ja.yaml・validators.ja.yaml）由来（オラクル独立性）。実装の現挙動・Form制約値は期待値に流用しない。
 * 設計源・刷新先ともに ec-cube-enterprise（標準・正典）。乖離はケース表 付帯表4（不具合候補）で管理する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証について: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の
 * spec/admin/login.spec.ts・m10/*.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報（ECCUBE_ADMIN_USER/PASS）が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *
 * 実行方針（安全第一・共有ステージング）:
 *  - 表示系（001-003）・検証エラー系（020-024,032）は送信が失敗するため dtb_calendar を更新しない（非破壊）。
 *  - 行依存（004,005,006,032,060,061）は既存定休日行が無いと観測できないため、行0件なら test.skip（SEED-M10-12-CAL 要）。
 *  - 永続化を伴う成功系（010,011,030,031）・削除（040）は専用シード＋後始末が要るため test.fixme。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AdminBaseSettingSettingShopCalendarPage } from "../../../pages/admin/m10/m10_12_admin_base_setting_setting_shop_calendar.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const CAL_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/calendar(\\?|$)`);
// 成功遷移先＝管理者ホーム（admin_homepage = /<route>/ ）。仕様（処理フロー :74,:107）由来で明示確認する。
const HOME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/?(\\?|$)`);

// 仕様（messages.ja.yaml / validators.ja.yaml）由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const DUP_ERROR = "同日の定休日が既に存在しているため、設定できません。"; // :2992
const RANGE_ERROR = "不正な日付です。"; // validators.ja.yaml:60
const SAVE_SUCCESS = "保存しました"; // :1398

/** 管理者ログインして定休日カレンダー設定画面を開く。 */
async function gotoCalendarAsAdmin(
  page: Page
): Promise<AdminBaseSettingSettingShopCalendarPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const cal = new AdminBaseSettingSettingShopCalendarPage(page);
  await cal.goto();
  return cal;
}

test.describe(
  "管理画面 > 店舗設定 > 定休日カレンダー設定",
  { tag: ["@admin", "@setting", "@shop"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M10-12-050 未ログインで定休日カレンダー設定URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/calendar`);
      await expect(page.locator("#login_id")).toBeVisible(); // 管理ログイン画面へ誘導（仕様: 権限・認可/利用者視点の入口）
    });

    test("E2E-M10-12-051 未ログインで新規作成URLへ直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/calendar/new`);
      await expect(page.locator("#login_id")).toBeVisible(); // 機能未到達（仕様: 未認証は受理されない）
    });

    // ===== 画面表示（SEED-M10-12-ADMIN：管理者ログインのみ） =====

    test("E2E-M10-12-001 定休日カレンダー設定画面: カード見出し・新規行の入力欄/送信ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cal = await gotoCalendarAsAdmin(page);
      await cal.seeScreen();
    });

    test("E2E-M10-12-002 一覧テーブルに ID・タイトル・日付 の列見出しが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cal = await gotoCalendarAsAdmin(page);
      const headers = cal.tableHeaders;
      await expect(headers.filter({ hasText: "ID" }).first()).toBeVisible();
      await expect(headers.filter({ hasText: "タイトル" }).first()).toBeVisible();
      await expect(headers.filter({ hasText: "日付" }).first()).toBeVisible();
    });

    test("E2E-M10-12-003 新規行は ID列空・タイトル/日付入力欄・「新規登録」ボタンを持つ", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cal = await gotoCalendarAsAdmin(page);
      await expect(cal.newTitle).toBeVisible();
      await expect(cal.newHoliday).toBeVisible();
      // 期待文言は設計書（表示要素 :82「新規登録」ラベルの送信ボタン）由来＝オラクル。
      // 実装は Twig 翻訳 admin.common.create__new=「新規作成」を描画するため不一致で落ちて検出する（付帯表4 不具合候補#7）。
      await expect(cal.newSubmit).toHaveText(/新規登録/);
    });

    test("E2E-M10-12-008 新規行フォームにCSRF隠しフィールドが埋め込まれている", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cal = await gotoCalendarAsAdmin(page);
      // 仕様（処理フロー 初回表示: 新規用フォームはCSRFフィールドを先行埋め込み）由来。トークン値はオラクル化しない（存在のみ確認）。
      await expect(cal.newToken).toHaveCount(1);
    });

    // ===== 新規作成バリデーション（非破壊：送信失敗で永続化されない） =====

    test("E2E-M10-12-020 新規 タイトル未入力→保存されず設定画面に滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cal = await gotoCalendarAsAdmin(page);
      // タイトル空・日付のみ入力して送信（必須はサーバ側で判定。Form制約値はオラクル化しない）
      await cal.newHoliday.fill("2099-12-31");
      await cal.newSubmit.click();
      await expect(cal.successAlert).toHaveCount(0); // 「保存しました」は出ない
      await expect(page).toHaveURL(CAL_RE); // 設定画面に滞留（ホームへ遷移しない）
    });

    test("E2E-M10-12-025 新規 タイトル空白のみ→保存されず設定画面に滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cal = await gotoCalendarAsAdmin(page);
      // 設計書（入力項目: タイトルは「未入力および空白のみはフレームワークの必須検証により無効」）由来の異常系。
      // 空白のみ＝必須違反として保存されない（非破壊。Form制約値はオラクル化しない）。
      await cal.submitNew("   ", "2099-12-31");
      await expect(cal.successAlert).toHaveCount(0); // 「保存しました」は出ない
      await expect(page).toHaveURL(CAL_RE); // 設定画面に滞留
    });

    test("E2E-M10-12-021 新規 タイトル最大長+1→保存されず設定画面に滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cal = await gotoCalendarAsAdmin(page);
      // 仕様の確認値 255 を1超過した256文字（最大長の正は設計書。Form定数はオラクル化しない）
      await cal.submitNew("あ".repeat(256), "2099-12-31");
      await expect(cal.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(CAL_RE);
    });

    test("E2E-M10-12-022 新規 日付未入力→保存されず設定画面に滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cal = await gotoCalendarAsAdmin(page);
      await cal.newTitle.fill("E2E_休業日_必須テスト");
      await cal.newSubmit.click(); // 日付空のまま送信
      await expect(cal.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(CAL_RE);
    });

    test("E2E-M10-12-023 新規 日付下限外(0003年以前)→「不正な日付です。」で滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cal = await gotoCalendarAsAdmin(page);
      await cal.submitNew("E2E_休業日_範囲外テスト", "0002-01-01");
      await expect(cal.newError).toContainText(RANGE_ERROR); // 日付下限外（仕様: 検証順序#2 / エラー処理）
      await expect(cal.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(CAL_RE);
    });

    test("E2E-M10-12-024 新規 同日重複→「同日の定休日が既に存在しているため、設定できません。」で滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cal = await gotoCalendarAsAdmin(page);
      test.skip((await cal.rowCount()) < 1, "SEED-M10-12-CAL（既存定休日行）未投入");
      // 既存行の保存済み日付を読み取り、新規へ同じ日付＋有効タイトルで送信→重複エラー（非破壊）
      const existingDate = await cal.readRowHoliday(0);
      await cal.submitNew("E2E_休業日_重複テスト", existingDate);
      await expect(cal.newError).toContainText(DUP_ERROR); // 仕様: 検証順序#3 同一店舗・同一日
      await expect(cal.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(CAL_RE);
    });

    // ===== インライン編集（既存行依存・非破壊） =====

    test("E2E-M10-12-005 鉛筆押下で当該行の編集ブロックが表示され閲覧ブロックが隠れる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cal = await gotoCalendarAsAdmin(page);
      test.skip((await cal.rowCount()) < 1, "SEED-M10-12-CAL（既存定休日行）未投入");
      await cal.clickPencil(0); // JS: .list を隠し .edit を表示（calendar.twig:39-44）
      await expect(cal.editBlock(0)).toBeVisible();
      await expect(cal.listBlock(0)).toBeHidden();
    });

    test("E2E-M10-12-006 キャンセル押下で同一の定休日カレンダー設定画面へGET再読み込みされる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cal = await gotoCalendarAsAdmin(page);
      test.skip((await cal.rowCount()) < 1, "SEED-M10-12-CAL（既存定休日行）未投入");
      await cal.clickPencil(0);
      await cal.clickCancel(0); // JS: location.href = admin_setting_shop_calendar（calendar.twig:46-48）
      await expect(page).toHaveURL(CAL_RE);
    });

    test("E2E-M10-12-032 インライン編集 タイトル未入力→保存されず設定画面に滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cal = await gotoCalendarAsAdmin(page);
      test.skip((await cal.rowCount()) < 1, "SEED-M10-12-CAL（既存定休日行）未投入");
      await cal.clickPencil(0);
      await cal.submitInlineEdit(0, "", null); // タイトルを空にして「決定」
      await expect(cal.successAlert).toHaveCount(0); // 保存されない（仕様: 必須違反は has-error で編集表示固定）
      await expect(page).toHaveURL(CAL_RE);
    });

    test("E2E-M10-12-034 インライン編集 日付未入力→保存されず設定画面に滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cal = await gotoCalendarAsAdmin(page);
      test.skip((await cal.rowCount()) < 1, "SEED-M10-12-CAL（既存定休日行）未投入");
      await cal.clickPencil(0);
      await cal.submitInlineEdit(0, null, ""); // 日付を空にして「決定」（020/030に対する異常系の対）
      await expect(cal.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(CAL_RE);
    });

    test("E2E-M10-12-035 インライン編集 タイトル空白のみ→保存されず設定画面に滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cal = await gotoCalendarAsAdmin(page);
      test.skip((await cal.rowCount()) < 1, "SEED-M10-12-CAL（既存定休日行）未投入");
      await cal.clickPencil(0);
      // 設計書（入力項目: 空白のみは必須検証により無効）をインライン編集側で検出（非破壊）
      await cal.submitInlineEdit(0, "   ", null);
      await expect(cal.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(CAL_RE);
    });

    test("E2E-M10-12-036 インライン編集 タイトル最大長+1→保存されず設定画面に滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cal = await gotoCalendarAsAdmin(page);
      test.skip((await cal.rowCount()) < 1, "SEED-M10-12-CAL（既存定休日行）未投入");
      await cal.clickPencil(0);
      // 仕様の確認値 255 を1超過した256文字（最大長の正は設計書。Form定数はオラクル化しない）
      await cal.submitInlineEdit(0, "あ".repeat(256), null);
      await expect(cal.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(CAL_RE);
    });

    test("E2E-M10-12-037 インライン編集 日付下限外(0003年以前)→「不正な日付です。」で滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cal = await gotoCalendarAsAdmin(page);
      test.skip((await cal.rowCount()) < 1, "SEED-M10-12-CAL（既存定休日行）未投入");
      await cal.clickPencil(0);
      await cal.submitInlineEdit(0, null, "0002-01-01"); // 023のインライン編集側の対（非破壊）
      await expect(cal.rowError(0)).toContainText(RANGE_ERROR);
      await expect(cal.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(CAL_RE);
    });

    test("E2E-M10-12-009 既存行フォームにCSRF隠しフィールドが埋め込まれている", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cal = await gotoCalendarAsAdmin(page);
      test.skip((await cal.rowCount()) < 1, "SEED-M10-12-CAL（既存定休日行）未投入");
      // 仕様（処理フロー 初回表示: 各行に各行専用CSRFを埋め込む）由来。トークン値はオラクル化しない（存在のみ確認）。
      await expect(cal.rowToken(0)).toHaveCount(1);
    });

    test("E2E-M10-12-062 既存行の閲覧ブロックでタイトルがプレーンテキスト表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cal = await gotoCalendarAsAdmin(page);
      test.skip((await cal.rowCount()) < 1, "SEED-M10-12-CAL（既存定休日行）未投入");
      // 仕様（フロント挙動 表示要素: 既存行はタイトルをプレーンテキストで表示）由来。入力欄でなく span 表示。
      await expect(cal.rowTitleText(0)).toBeVisible();
    });

    // ===== 削除モーダル表示（既存行依存・非破壊：実行はしない） =====

    test("E2E-M10-12-004 削除アイコン押下で削除確認モーダルが開く", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cal = await gotoCalendarAsAdmin(page);
      test.skip((await cal.rowCount()) < 1, "SEED-M10-12-CAL（既存定休日行）未投入");
      await cal.openDeleteModal(0);
      const link = cal.deleteConfirmLink(0);
      await expect(link).toBeVisible(); // モーダル内の削除実行リンク（CSRF属性・data-method=delete を持つ）
      await expect(link).toHaveAttribute("data-method", "delete");
    });

    test("E2E-M10-12-007 削除実行リンクが確認ダイアログ抑止フラグを持ち押下時にconfirmが出ない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cal = await gotoCalendarAsAdmin(page);
      test.skip((await cal.rowCount()) < 1, "SEED-M10-12-CAL（既存定休日行）未投入");
      // 仕様（フロント挙動 モーダル: 削除実行リンクには確認ダイアログ抑止フラグが付いており、押した瞬間に confirm は出ない）由来。
      await cal.openDeleteModal(0);
      const link = cal.deleteConfirmLink(0);
      let dialogShown = false;
      page.on("dialog", async (d) => {
        dialogShown = true;
        await d.dismiss();
      });
      await link.click();
      expect(dialogShown).toBe(false); // 押下時にブラウザ confirm が発火しない（確認ダイアログ抑止）
    });

    // ===== 一覧表示（既存行依存・非破壊） =====

    test("E2E-M10-12-060 一覧が ID 降順で表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cal = await gotoCalendarAsAdmin(page);
      const n = await cal.rowCount();
      test.skip(n < 2, "SEED-M10-12-CAL（2件以上の既存定休日行）未投入");
      const ids: number[] = [];
      for (let i = 0; i < n; i++) {
        const txt = (await cal.rowAt(i).locator("td span").first().innerText()).trim();
        ids.push(Number(txt));
      }
      const sortedDesc = [...ids].sort((a, b) => b - a);
      expect(ids).toEqual(sortedDesc); // 仕様: 一覧表示順は ID 降順
    });

    test("E2E-M10-12-061 一覧の日付が日粒度(date_day)で表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cal = await gotoCalendarAsAdmin(page);
      test.skip((await cal.rowCount()) < 1, "SEED-M10-12-CAL（既存定休日行）未投入");
      // 閲覧ブロックの日付テキストが日粒度（YYYY/MM/DD 相当）で時刻を含まないこと（仕様: 日表示 date_day）
      const dateText = (await cal.listBlock(0).innerText()).trim();
      expect(dateText).not.toMatch(/\d{1,2}:\d{2}/); // 時刻表記を含まない
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M10-12-010 新規 有効入力で登録→「保存しました」フラッシュ（要: 専用シード＋作成行の後始末）",
      async () => {
        // 期待は仕様（処理フロー 新規作成 :66-74 / save_complete=「保存しました」）由来。
        // dtb_calendar に行を挿入し永続化するため、識別接頭辞付き使い捨てデータと削除手順が要る。
      }
    );

    test.fixme(
      "E2E-M10-12-011 新規登録成功で管理者ホームへ遷移（要: 専用シード＋作成行の後始末）",
      async () => {
        // 期待は仕様（:74 redirectToRoute admin_homepage）由来。HOME_RE で遷移先を確認する想定。
      }
    );

    test.fixme(
      "E2E-M10-12-013 新規 タイトル最大長ちょうど(境界正常)で登録→「保存しました」（要: 専用シード＋作成行の後始末）",
      async () => {
        // 021（最大長+1で未保存）の正常対。境界内＝有効として保存される（仕様 入力項目: 最大長まで有効）。
        // 永続化を伴うため使い捨てデータ＋後始末が要る。最大長の正は設計書由来でForm定数はオラクル化しない。
      }
    );

    test.fixme(
      "E2E-M10-12-014 新規 日付下限0003-01-01ちょうど(境界正常)で登録→「保存しました」（要: 専用シード＋作成行の後始末）",
      async () => {
        // 023（下限未満で範囲エラー）の正常対。下限ちょうどは有効（仕様 検証順序#2: 0003年以降）。
      }
    );

    test.fixme(
      "E2E-M10-12-030 インライン編集 決定で更新→「保存しました」フラッシュ（要: SEED-M10-12-CAL＋値復元）",
      async () => {
        // 期待は仕様（処理フロー インライン更新 :93-107 / save_complete）由来。既存行の値を上書き永続化するため値復元が要る。
      }
    );

    test.fixme(
      "E2E-M10-12-031 インライン更新成功で管理者ホームへ遷移（要: SEED-M10-12-CAL＋値復元）",
      async () => {
        // 期待は仕様（:107 redirectToRoute admin_homepage）由来。
      }
    );

    test.fixme(
      "E2E-M10-12-033 インライン編集 同日重複(自ID除外)→「同日の定休日が既に存在しているため、設定できません。」（要: 既存2行）",
      async () => {
        // 期待は仕様（検証順序#3 更新時は自IDを除外 / CalendarType.php:105-110）由来。別行の日付を持つ2件のシードが要る。
      }
    );

    test.fixme(
      "E2E-M10-12-040 モーダルから削除実行→「削除しました」・行が一覧から消える（要: SEED-M10-12-CAL＋削除応答の実機確認）",
      async () => {
        // 期待は仕様（delete :135-139 / delete_complete=「削除しました」）由来。
        // 削除ハンドラは配列のみ返し明示リダイレクトが無い（設計書: 応答解釈に依存）ため、画面表示・遷移は要実機確認。
      }
    );

    test.fixme(
      "E2E-M10-12-041 CSRFトークン不正な削除→受理されない（アクセス拒否）（要: トークン偽造＝実機/リクエスト操作）",
      async () => {
        // 期待は仕様（権限・認可 / エラー処理 isTokenValid :135 不合格はアクセス拒否例外）由来。
        // 正規UIからはトークン偽造ができないため、リクエストレベル操作を実機確認後に実装する。
      }
    );
  }
);
