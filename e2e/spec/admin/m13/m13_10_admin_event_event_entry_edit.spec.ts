/**
 * 管理画面 イベント申込詳細・編集 E2E。納品ケース表
 *   integration_test/e2e/m13_10_admin_event_event_entry_edit_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、要実機/実装乖離の031・032は test.fixme、
 * 手動/間接(050 申込履歴のDB件数比較等)はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 * 期待結果は仕様(functions/pf-eccube3/m13-10_admin_event_event_entry_edit.md / 観点表)由来（オラクル独立性）。
 * 設計源は pf-eccube3（旧システムのリバース）であり基本設計・観点表を上位オラクルとする。刷新先
 * ec-cube-enterprise との乖離はケース表 付帯表4 に記録（成功フラッシュ文言・支払金額の無効化・重複検証欠落 等）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ゲート（env未設定ならskipして抜け漏れを可視化）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS … 管理ログイン（SEED-M13-10-ADMIN）
 *  - M13_10_ENTRY_ID … 参加者1名付き既存申込ID（SEED-M13-10-ENTRY）
 *  - M13_10_PLAYER_KEYWORD … プレイヤー検索でヒットする検索語（SEED-M13-10-PLAYER）
 *  - M13_10_ENTRY_PAYNO_ID … 支払番号ありの既存申込ID（SEED-M13-10-ENTRY-PAYNO）
 *  - M13_10_FOREIGN_ENTRY_ID … 編集可能店舗外の既存申込ID（SEED-M13-10-FOREIGN）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AdminEventEventEntryEditPage } from "../../../pages/admin/m13/m13_10_admin_event_event_entry_edit.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);
const ENTRY_ID = process.env.M13_10_ENTRY_ID || "";
const HAS_ENTRY = !!ENTRY_ID;
const PLAYER_KEYWORD = process.env.M13_10_PLAYER_KEYWORD || "";
const HAS_PLAYER = !!PLAYER_KEYWORD;
const ENTRY_PAYNO_ID = process.env.M13_10_ENTRY_PAYNO_ID || "";
const HAS_ENTRY_PAYNO = !!ENTRY_PAYNO_ID;
const FOREIGN_ENTRY_ID = process.env.M13_10_FOREIGN_ENTRY_ID || "";
const HAS_FOREIGN_ENTRY = !!FOREIGN_ENTRY_ID;

// 仕様(設計書 表示メッセージ節)由来の期待文言。実装に合わせて変えない（オラクル独立性）。
// ※実装は「保存しました」(messages.ja.yaml:1398)＝乖離#4。テストは設計文言を期待し落ちて検出する。
const SUCCESS_FLASH = "登録が完了しました。";

// URLアサーションは管理ルート（ECCUBE_ADMIN_ROUTE）配下を明示し、フロント側類似URLとの誤一致を防ぐ。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/event/entry/\\d+/edit(\\?|$)`);
// 「同日程の新規申込へ」遷移先（M13-12）。管理ルート配下の新規申込URLに限定。
const NEW_ENTRY_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/entry_registration/new/\\d+(\\?|$)`);

/** 管理ログインして編集画面を開く。 */
async function loginAndOpenEdit(page: Page): Promise<AdminEventEventEntryEditPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const edit = new AdminEventEventEntryEditPage(page);
  await edit.goto(ENTRY_ID);
  return edit;
}

test.describe("イベント申込詳細・編集 > 申込編集", { tag: ["@admin", "@event", "@entry"] }, () => {
  // ===== 認証ガード・404（資格情報のみ／シード最小） =====

  test("E2E-M13-10-041 未ログインで編集URL直接→管理ログイン画面へ誘導", async ({ page }) => {
    // 未認証リダイレクトはエンティティ解決前のファイアウォールで発生するため実在申込IDは不要。
    // 実IDがあれば使い、無ければ任意の数値IDで認証ガードを検証する。
    const guardId = ENTRY_ID || "1";
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/event/entry/${guardId}/edit`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  test("E2E-M13-10-040 存在しない申込IDの編集URLは404", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M13-10-ADMIN）");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(ADMIN_USER, ADMIN_PASS);
    const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/event/entry/99999999/edit`);
    expect(res?.status()).toBe(404);
  });

  test("E2E-M13-10-042 編集可能店舗外の申込の編集URLは404（店舗ACL）", async ({ page }) => {
    test.skip(!HAS_CREDS || !HAS_FOREIGN_ENTRY, "資格情報またはSEED-M13-10-FOREIGN未設定");
    // 仕様(権限・認可:209): アクセス制御リストがURLを許可するときのみ表示・更新可。
    // 実装は編集可能店舗外で createNotFoundException（EntryController.php:254-255 / isEditableShop Member.php:78）。
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(ADMIN_USER, ADMIN_PASS);
    const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/event/entry/${FOREIGN_ENTRY_ID}/edit`);
    expect(res?.status()).toBe(404);
  });

  // ===== 編集画面 表示要素（SEED-M13-10-ENTRY） =====

  test("E2E-M13-10-001 申込ID・イベント名・店舗・会場・フォーマット・支払会員が読み取り専用で表示される", async ({ page }) => {
    test.skip(!HAS_CREDS || !HAS_ENTRY, "資格情報またはSEED-M13-10-ENTRY未設定");
    const edit = await loginAndOpenEdit(page);
    await edit.seeReadonlyEntryInfo();
  });

  test("E2E-M13-10-002 申込状況セレクトが表示され編集可能である", async ({ page }) => {
    test.skip(!HAS_CREDS || !HAS_ENTRY, "資格情報またはSEED-M13-10-ENTRY未設定");
    const edit = await loginAndOpenEdit(page);
    await expect(edit.entryStatus).toBeVisible();
    await expect(edit.entryStatus).toBeEnabled(); // 編集時 entry_status_editable=true
  });

  test("E2E-M13-10-003 支払方法セレクトは無効化されている", async ({ page }) => {
    test.skip(!HAS_CREDS || !HAS_ENTRY, "資格情報またはSEED-M13-10-ENTRY未設定");
    const edit = await loginAndOpenEdit(page);
    await expect(edit.payment).toBeVisible();
    await expect(edit.payment).toBeDisabled(); // 仕様: 支払方法はフォーム無効化
  });

  test("E2E-M13-10-004 支払金額欄と支払番号（なし時「なし」）が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS || !HAS_ENTRY, "資格情報またはSEED-M13-10-ENTRY未設定");
    const edit = await loginAndOpenEdit(page);
    await expect(edit.price).toBeVisible();
    // 仕様(表示メッセージ): 支払番号が無いとき「なし」と表示する。SEEDは支払番号なし。
    await expect(edit.paymentNo).toBeVisible();
    await expect(edit.paymentNo).toContainText("なし");
  });

  test("E2E-M13-10-008 支払番号があるとき支払番号の値が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS || !HAS_ENTRY_PAYNO, "資格情報またはSEED-M13-10-ENTRY-PAYNO未設定");
    // 仕様(表示要素:83): 支払番号は編集時のみ表示し、なし時のみ「なし」。あり時は値を表示する。
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(ADMIN_USER, ADMIN_PASS);
    const edit = new AdminEventEventEntryEditPage(page);
    await edit.goto(ENTRY_PAYNO_ID);
    await expect(edit.paymentNo).toBeVisible();
    // 値が表示され「なし」ではないこと（具体値はシード/実装依存のためオラクル化しない）。
    await expect(edit.paymentNo).not.toContainText("なし");
  });

  test("E2E-M13-10-005 送信（登録）ボタンは初期状態で無効", async ({ page }) => {
    test.skip(!HAS_CREDS || !HAS_ENTRY, "資格情報またはSEED-M13-10-ENTRY未設定");
    const edit = await loginAndOpenEdit(page);
    await expect(edit.submitButton).toBeDisabled(); // JS: 参加者確定まで送信不可
  });

  // ===== 画面遷移 =====

  test("E2E-M13-10-006 戻るリンクで申込一覧へ遷移", async ({ page }) => {
    test.skip(!HAS_CREDS || !HAS_ENTRY, "資格情報またはSEED-M13-10-ENTRY未設定");
    const edit = await loginAndOpenEdit(page);
    await edit.backToListLink.click();
    await expect(page).toHaveURL(new RegExp(`/${ECCUBE_ADMIN_ROUTE}/event/entry(\\?|$|/)`));
  });

  test("E2E-M13-10-007 「同日程の新規申込へ」リンクで新規申込画面へ遷移", async ({ page }) => {
    test.skip(!HAS_CREDS || !HAS_ENTRY, "資格情報またはSEED-M13-10-ENTRY未設定");
    const edit = await loginAndOpenEdit(page);
    await edit.newSameScheduleLink.click();
    await expect(page).toHaveURL(NEW_ENTRY_RE); // 同日程の新規申込（M13-12・管理ルート配下）
  });

  // ===== プレイヤー検索モーダル・送信可否制御 =====

  test("E2E-M13-10-010 検索ボタンでプレイヤー検索モーダルが開く", async ({ page }) => {
    test.skip(!HAS_CREDS || !HAS_ENTRY, "資格情報またはSEED-M13-10-ENTRY未設定");
    const edit = await loginAndOpenEdit(page);
    // SEED-M13-10-ENTRY は参加者選択済みのため検索ボタンは隠れている（edit.twig:278 div_search d-none）。
    // 参加者を入れ替える業務フローに合わせ、未選択にして検索ボタンを表示させてから開く。
    await edit.makeSearchAvailable();
    await edit.openSearchModal();
    await expect(edit.modal).toBeVisible();
  });

  test("E2E-M13-10-011 モーダルで検索すると候補一覧がXHRで表示される", async ({ page }) => {
    test.skip(!HAS_CREDS || !HAS_ENTRY || !HAS_PLAYER, "資格情報/SEED-M13-10-ENTRY/PLAYER未設定");
    const edit = await loginAndOpenEdit(page);
    await edit.makeSearchAvailable(); // 検索ボタンを表示（参加者を未選択化）
    await edit.openSearchModal();
    await expect(edit.modal).toBeVisible();
    await edit.searchPlayer(PLAYER_KEYWORD);
    // XHRで候補一覧が描画されること（選択用要素の出現で確認）。
    await expect(edit.modalList.locator(".js-entry-player-select").first()).toBeVisible();
  });

  test("E2E-M13-10-012 候補選択で参加者行に反映され送信ボタンが有効化される", async ({ page }) => {
    test.skip(!HAS_CREDS || !HAS_ENTRY || !HAS_PLAYER, "資格情報/SEED-M13-10-ENTRY/PLAYER未設定");
    const edit = await loginAndOpenEdit(page);
    await edit.makeSearchAvailable(); // 検索ボタンを表示（参加者を未選択化）
    await edit.openSearchModal();
    await edit.searchPlayer(PLAYER_KEYWORD);
    await edit.modalList.locator(".js-entry-player-select").first().click();
    await expect(edit.playerIdHidden).not.toHaveValue(""); // 参加者行に反映
    await expect(edit.submitButton).toBeEnabled(); // 送信ボタンが有効化
  });

  test("E2E-M13-10-030 参加者を未選択にすると送信ボタンが無効化される（参加者必須）", async ({ page }) => {
    test.skip(!HAS_CREDS || !HAS_ENTRY, "資格情報またはSEED-M13-10-ENTRY未設定");
    const edit = await loginAndOpenEdit(page);
    await edit.clearPlayer(); // 既存参加者を削除
    await expect(edit.playerIdHidden).toHaveValue("");
    await expect(edit.submitButton).toBeDisabled(); // 参加者未選択では更新不可
  });

  // ===== 更新（正常系） =====

  test("E2E-M13-10-020 正常更新で成功フラッシュが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS || !HAS_ENTRY, "資格情報またはSEED-M13-10-ENTRY未設定");
    const edit = await loginAndOpenEdit(page);
    // 参加者は既存が設定済みの想定（SEED-M13-10-ENTRY）。送信ボタン活性化を待って送信。
    await expect(edit.submitButton).toBeEnabled();
    await edit.submitUpdate();
    // 期待は設計書「登録が完了しました。」。実装は「保存しました」＝乖離#4で落ちて検出見込み。
    await expect(edit.flash).toContainText(SUCCESS_FLASH);
  });

  test("E2E-M13-10-021 正常更新で同じ申込の編集画面へリダイレクトされる", async ({ page }) => {
    test.skip(!HAS_CREDS || !HAS_ENTRY, "資格情報またはSEED-M13-10-ENTRY未設定");
    const edit = await loginAndOpenEdit(page);
    await expect(edit.submitButton).toBeEnabled();
    await edit.submitUpdate();
    await expect(page).toHaveURL(EDIT_RE); // 同じ申込の編集画面へ
  });

  // ===== 保留（要実機/実装乖離・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M13-10-022 申込状況を変更し更新→再表示で変更後の申込状況（要: 申込状況マスタの別値・間接永続化確認）",
    async () => {
      // 期待は仕様(処理フロー#4)由来。申込状況の別値選択と再表示後の選択値比較を実機で実装。
    }
  );

  test.fixme(
    "E2E-M13-10-031 支払金額が非数字→金額メッセージで再描画（不具合候補#5: 実装で price が disabled＝UIから入力不可）",
    async () => {
      // 期待は仕様(エラー処理「半角数字で金額を入力してください。」)由来。
      // 実装は EventEntryDetailType.php:111-115 で price disabled のため到達不能。要実機/仕様確認。
    }
  );

  test.fixme(
    "E2E-M13-10-032 参加者重複→重複メッセージで再描画（不具合候補#6: 実装の更新に重複検証が見当たらない）",
    async () => {
      // 期待は仕様(バリデーション「参加者重複→重複メッセージ」)由来。
      // SEED-M13-10-DUP（同一プレイヤーが他申込・同日程）の用意後、実機で実装。
    }
  );
});
