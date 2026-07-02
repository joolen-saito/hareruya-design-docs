/**
 * 管理画面 イベント新規申込登録 E2E。納品ケース表
 *   integration_test/e2e/m13_12_admin_event_event_entry_register_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、要実機/実装乖離の040・041・042は test.fixme、
 * 手動/間接(050 申込・申込プレイヤー・申込履歴のDB件数比較等)はケース表で全量管理する
 * （規約「手動/対象外はspecに残さない」）。
 * 期待結果は仕様(functions/pf-eccube3/m13-12_admin_event_event_entry_register.md / 観点表)由来（オラクル独立性）。
 * 設計源は pf-eccube3（旧システムのリバース）であり基本設計・観点表を上位オラクルとする。刷新先
 * ec-cube-enterprise との乖離はケース表 付帯表4 に記録（成功フラッシュ文言・遷移先・支払金額の無効化・
 * 参加者重複検証欠落・entryPlayer単一化・ルート相違 等）。テストは仕様どおりに書き、乖離は落ちて検出する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ゲート（env未設定ならskipして抜け漏れを可視化）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS … 管理ログイン（SEED-M13-12-ADMIN）
 *  - M13_12_EVENT_DETAIL_ID … 担当店舗の公開イベント日程ID（SEED-M13-12-EVENTDETAIL）
 *  - M13_12_PLAYER_KEYWORD  … 会員紐付きプレイヤーがヒットする検索語（SEED-M13-12-PLAYER）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AdminEventEventEntryRegisterPage } from "../../../pages/admin/m13/m13_12_admin_event_event_entry_register.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);
const EVENT_DETAIL_ID = process.env.M13_12_EVENT_DETAIL_ID || "";
const HAS_DETAIL = !!EVENT_DETAIL_ID;
const PLAYER_KEYWORD = process.env.M13_12_PLAYER_KEYWORD || "";
const HAS_PLAYER = !!PLAYER_KEYWORD;

// 仕様(設計書 表示メッセージ節)由来の期待文言。実装に合わせて変えない（オラクル独立性）。
// ※実装は成功時「保存しました」(messages.ja.yaml:1398)＝乖離#1。テストは設計文言を期待し落ちて検出。
const SUCCESS_FLASH = "登録が完了しました。";

const LOGIN_RE = /\/login(\?|$)/;
const SELECT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/entry_registration(\\?|$|/)`);
// 仕様: 登録成功は「登録した申込の編集画面」(/event/entry/{id}/edit)。
// 実装は admin_event_entry_event_detail（/event/entry/event_detail/{id}）へ遷移＝乖離#5で落ちて検出。
const EDIT_RE = /\/event\/entry\/\d+\/edit(\?|$)/;

/** 管理ログインして新規申込入力画面を開く。 */
async function loginAndOpenNew(page: Page): Promise<AdminEventEventEntryRegisterPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const reg = new AdminEventEventEntryRegisterPage(page);
  await reg.gotoNew(EVENT_DETAIL_ID);
  return reg;
}

/** 候補プレイヤーを検索・選択して参加者を確定する。 */
async function confirmPlayer(reg: AdminEventEventEntryRegisterPage) {
  await reg.openSearchModal();
  await expect(reg.modal).toBeVisible();
  await reg.searchPlayer(PLAYER_KEYWORD);
  await expect(reg.modalCandidate.first()).toBeVisible();
  await reg.selectFirstCandidate();
  await expect(reg.playerIdHidden).not.toHaveValue("");
}

test.describe(
  "イベント新規申込登録 > 新規申込",
  { tag: ["@admin", "@event", "@entry"] },
  () => {
    // ===== 認証ガード・404（資格情報のみ／シード最小） =====

    test("E2E-M13-12-001 未ログインで新規申込URL直接→管理ログイン画面へ誘導", async ({ page }) => {
      test.skip(!HAS_DETAIL, "M13_12_EVENT_DETAIL_ID 未設定（SEED-M13-12-EVENTDETAIL）");
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/entry_registration/new/${EVENT_DETAIL_ID}`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M13-12-002 存在しないイベント日程IDの新規申込URLは404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M13-12-ADMIN）");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/entry_registration/new/99999999`);
      expect(res?.status()).toBe(404);
    });

    // ===== 登録先選択画面（SEED-M13-12-ADMIN / EVENTDETAIL） =====

    test("E2E-M13-12-003 登録先選択画面に検索フォーム・検索ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M13-12-ADMIN）");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const reg = new AdminEventEventEntryRegisterPage(page);
      await reg.gotoSelect();
      // TSV期待: 検索フォーム（店舗・日程条件）と「検索」ボタン。店舗条件selectも確認する。
      await expect(reg.searchBaseInfo).toBeVisible();
      await expect(reg.searchButton).toBeVisible();
    });

    test("E2E-M13-12-004 登録先選択画面の「新規登録」リンクで新規申込入力画面へ遷移", async ({ page }) => {
      test.skip(!HAS_CREDS || !HAS_DETAIL, "資格情報またはSEED-M13-12-EVENTDETAIL未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const reg = new AdminEventEventEntryRegisterPage(page);
      await reg.gotoSelect();
      // 対象データ固定: シード日程(M13_12_EVENT_DETAIL_ID)行の「新規登録」リンクを押下し、
      // 同一IDの新規申込画面へ遷移したことを確認する（任意行の first() では別日程でも通り得る）。
      const link = reg.registerLinkForDetail(EVENT_DETAIL_ID);
      await expect(link.first()).toBeVisible();
      await link.first().click();
      await expect(page).toHaveURL(new RegExp(`/entry_registration/new/${EVENT_DETAIL_ID}(\\?|$)`));
    });

    // ===== 新規申込入力画面 表示要素（SEED-M13-12-EVENTDETAIL） =====

    test("E2E-M13-12-010 イベント名・店舗・フォーマットが読み取り専用で表示される", async ({ page }) => {
      test.skip(!HAS_CREDS || !HAS_DETAIL, "資格情報またはSEED-M13-12-EVENTDETAIL未設定");
      const reg = await loginAndOpenNew(page);
      await reg.seeReadonlyEventInfo();
    });

    test("E2E-M13-12-011 申込状況セレクトが無効化表示（参加で固定）", async ({ page }) => {
      test.skip(!HAS_CREDS || !HAS_DETAIL, "資格情報またはSEED-M13-12-EVENTDETAIL未設定");
      const reg = await loginAndOpenNew(page);
      await expect(reg.entryStatus).toBeVisible();
      await expect(reg.entryStatus).toBeDisabled(); // 仕様: 申込状況は新規で無効化（参加固定）
    });

    test("E2E-M13-12-012 支払方法セレクトが無効化表示（管理者で固定）", async ({ page }) => {
      test.skip(!HAS_CREDS || !HAS_DETAIL, "資格情報またはSEED-M13-12-EVENTDETAIL未設定");
      const reg = await loginAndOpenNew(page);
      await expect(reg.payment).toBeVisible();
      await expect(reg.payment).toBeDisabled(); // 仕様: 支払方法はフォーム無効化（管理者固定）
    });

    test("E2E-M13-12-013 支払金額欄が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS || !HAS_DETAIL, "資格情報またはSEED-M13-12-EVENTDETAIL未設定");
      const reg = await loginAndOpenNew(page);
      await expect(reg.price).toBeVisible();
      // 仕様(業務ルール): 支払金額の初期値=イベント参加費。空でない初期値が入っていることを確認する。
      // ※具体の参加費額はSEED依存のため値一致ではなく非空で検証（実装の固定値オラクル化を避ける）。
      await expect(reg.price).not.toHaveValue("");
    });

    test("E2E-M13-12-014 支払会員が新規時は「－」で表示される", async ({ page }) => {
      test.skip(!HAS_CREDS || !HAS_DETAIL, "資格情報またはSEED-M13-12-EVENTDETAIL未設定");
      const reg = await loginAndOpenNew(page);
      await expect(reg.payingMember).toContainText("－"); // 新規は支払会員「－」で開始
    });

    test("E2E-M13-12-015 送信（保存）ボタンが初期状態で無効", async ({ page }) => {
      test.skip(!HAS_CREDS || !HAS_DETAIL, "資格情報またはSEED-M13-12-EVENTDETAIL未設定");
      const reg = await loginAndOpenNew(page);
      await expect(reg.submitButton).toBeDisabled(); // 参加者確定まで送信不可
    });

    test("E2E-M13-12-016 戻るリンクで登録先選択画面へ遷移", async ({ page }) => {
      test.skip(!HAS_CREDS || !HAS_DETAIL, "資格情報またはSEED-M13-12-EVENTDETAIL未設定");
      const reg = await loginAndOpenNew(page);
      await reg.backLink.click();
      await expect(page).toHaveURL(SELECT_RE);
    });

    // ===== プレイヤー検索モーダル・送信可否制御 =====

    test("E2E-M13-12-020 検索ボタンでプレイヤー検索モーダルが開く", async ({ page }) => {
      test.skip(!HAS_CREDS || !HAS_DETAIL, "資格情報またはSEED-M13-12-EVENTDETAIL未設定");
      const reg = await loginAndOpenNew(page);
      await reg.openSearchModal();
      await expect(reg.modal).toBeVisible();
    });

    test("E2E-M13-12-021 モーダルで検索すると候補一覧がXHRで表示される", async ({ page }) => {
      test.skip(!HAS_CREDS || !HAS_DETAIL || !HAS_PLAYER, "資格情報/SEED-M13-12-EVENTDETAIL/PLAYER未設定");
      const reg = await loginAndOpenNew(page);
      await reg.openSearchModal();
      await expect(reg.modal).toBeVisible();
      await reg.searchPlayer(PLAYER_KEYWORD);
      await expect(reg.modalCandidate.first()).toBeVisible(); // XHR候補一覧
    });

    test("E2E-M13-12-022 候補選択で参加者行に反映され送信ボタンが有効化される", async ({ page }) => {
      test.skip(!HAS_CREDS || !HAS_DETAIL || !HAS_PLAYER, "資格情報/SEED-M13-12-EVENTDETAIL/PLAYER未設定");
      const reg = await loginAndOpenNew(page);
      await confirmPlayer(reg);
      await expect(reg.submitButton).toBeEnabled(); // 参加者確定後に有効化
    });

    test("E2E-M13-12-023 候補選択で1行目の会員が支払会員欄に反映される", async ({ page }) => {
      test.skip(!HAS_CREDS || !HAS_DETAIL || !HAS_PLAYER, "資格情報/SEED-M13-12-EVENTDETAIL/PLAYER未設定");
      const reg = await loginAndOpenNew(page);
      await confirmPlayer(reg);
      await expect(reg.payingMember).not.toContainText("－"); // 支払会員＝1行目会員に変わる
    });

    test("E2E-M13-12-024 参加者を削除すると送信ボタンが無効化される（参加者必須）", async ({ page }) => {
      test.skip(!HAS_CREDS || !HAS_DETAIL || !HAS_PLAYER, "資格情報/SEED-M13-12-EVENTDETAIL/PLAYER未設定");
      const reg = await loginAndOpenNew(page);
      await confirmPlayer(reg);
      await reg.clearPlayer();
      await expect(reg.playerIdHidden).toHaveValue("");
      await expect(reg.submitButton).toBeDisabled(); // 参加者未選択では登録不可
    });

    // ===== 登録（正常系。会員紐付きプレイヤー必須） =====

    test("E2E-M13-12-030 参加者を選択し登録送信すると成功フラッシュが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS || !HAS_DETAIL || !HAS_PLAYER, "資格情報/SEED-M13-12-EVENTDETAIL/PLAYER未設定");
      const reg = await loginAndOpenNew(page);
      await confirmPlayer(reg);
      await expect(reg.submitButton).toBeEnabled();
      await reg.submit();
      // 期待は設計書「登録が完了しました。」。実装は「保存しました」＝乖離#1で落ちて検出見込み。
      await expect(reg.flash).toContainText(SUCCESS_FLASH);
    });

    test("E2E-M13-12-031 登録成功で登録した申込の編集画面へ遷移", async ({ page }) => {
      test.skip(!HAS_CREDS || !HAS_DETAIL || !HAS_PLAYER, "資格情報/SEED-M13-12-EVENTDETAIL/PLAYER未設定");
      const reg = await loginAndOpenNew(page);
      await confirmPlayer(reg);
      await expect(reg.submitButton).toBeEnabled();
      await reg.submit();
      // 期待は設計書「登録した申込の編集画面」。実装は日程別申込一覧へ遷移＝乖離#5で落ちて検出見込み。
      await expect(page).toHaveURL(EDIT_RE);
    });

    // ===== 保留（要実機/実装乖離・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M13-12-040 参加者未選択での登録送信は失敗（要: 直POST・乖離#2/#7 未送信文言/必須メッセージ未定義）",
      async () => {
        // 期待は仕様(エラー処理「未送信は登録失敗」/ 参加者必須)由来。UIは送信ボタンdisabledのため直POSTで検証。
        // 実装は専用の「登録できませんでした。」文言を持たず、player_required も翻訳キー未定義（不具合候補#2/#7）。
      }
    );

    test.fixme(
      "E2E-M13-12-041 支払金額が非数字→金額メッセージで再描画（不具合候補#3: price が disabled＝UIから入力不可）",
      async () => {
        // 期待は仕様(バリデーション「半角数字で金額を入力してください。」)由来。
        // 実装は EventEntryDetailType.php:111-112 で price disabled・初期=参加費固定のため到達不能。要実機/仕様確認。
      }
    );

    test.fixme(
      "E2E-M13-12-042 参加者重複→申込重複メッセージで再描画（不具合候補#4: StoreAction に重複検証が見当たらない）",
      async () => {
        // 期待は仕様(バリデーション「参加者重複→申込重複メッセージ」)由来。
        // SEED-M13-12-DUP（同日程に既申込のプレイヤー）の用意後、実機で実装。
      }
    );
  }
);
