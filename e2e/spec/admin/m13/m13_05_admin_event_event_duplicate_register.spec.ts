/**
 * 管理画面 イベント複製新規（M13-05）E2E。
 * 納品ケース表 integration_test/e2e/m13_05_admin_event_event_duplicate_register_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケース（実装済み）と、自動化予定だが未実装/要実機・仕様乖離検出の test.fixme のみを残す。
 * 手動/間接（複製元の不更新・登録者ID/採番のDB内部値・M13-02委譲バリデーション）と対象外はケース表で全量管理し、
 * spec に大量の fixme を残さない。
 * 期待結果は仕様(functions/pf-eccube3/m13-05_admin_event_event_duplicate_register.md / integration-test-viewpoints.md)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 重要(仕様乖離・付帯表4):
 *  - 複製ルートが相違。設計書=admin_event_duplicate `/event/{id}/duplicate`、実装=admin_event_copy `/event/{id}/copy`
 *    (EventController.php:195)。本specは到達のため実装ルート(/copy)を使うが、相違はケース表の不具合候補で管理する。
 *  - 送信ボタン文言が相違。設計書=「イベント登録」、実装=admin.common.registration「登録」(edit.twig:499)。
 *    期待値は仕様の「イベント登録」のままにせず、ここでは可視性のみ確認し、文言相違は不具合候補で管理する。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の
 * spec/admin/login.spec.ts・two_factor_auth.spec.ts も @playwright/test を直接使う。本specもこれに倣い
 * @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針:
 *  - ログインが要るケースは ECCUBE_ADMIN_USER/PASS（config/default.config.ts）が無いと走らないよう test.skip でガード。
 *  - シード前提: SEED-M13-05-SRC＝複製元となる登録済みイベント1件（環境変数 EVENT_DUP_SRC_ID にそのIDを与える）。
 *    HAS_SRC が false のときは複製元IDに依存するケースを skip する。
 *  - 保存系（新規イベント登録）はデータを増やすため、隔離環境／使い捨て前提で実行する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { EventEventDuplicateRegisterPage } from "../../../pages/admin/m13/m13_05_admin_event_event_duplicate_register.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// SEED-M13-05-SRC: 複製元の登録済みイベントID。
const SRC_ID = process.env.EVENT_DUP_SRC_ID || "";
const HAS_SRC = !!SRC_ID;
// 確実に存在しない複製元ID（404確認用）。実機の最大ID未満になり得るため十分大きい値を環境変数で上書き可能。
const MISSING_ID = process.env.EVENT_DUP_MISSING_ID || "99999999";

const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
// 管理ルート配下に限定（緩いマッチで管理画面外URLに誤合格しないように）。
const COPY_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/event/\\d+/copy(\\?|$)`);
const EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/event/\\d+/edit(\\?|$)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 > イベント複製新規",
  { tag: ["@admin", "@event", "@m13"] },
  () => {
    // ===== 認証不要（権限・認可） =====

    test("E2E-M13-05-040 未ログインで複製新規URL→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/event/1/copy`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M13-05-041 未ログインで複製保存(create POST)→保存成功に到達しない", async ({
      page,
    }) => {
      // 仕様(権限・認可: 複製新規の表示・保存／入出力: 保存POST)由来。未認証の複製保存は新規登録に到達せず、
      // 編集画面(2xx)へ遷移しないこと(ログイン誘導/拒否)で判定する。実装の応答コードはオラクルに固定しない。
      const res = await page.request.post(
        `/${ECCUBE_ADMIN_ROUTE}/event/create`,
        { form: { _dummy: "1" }, maxRedirects: 0, failOnStatusCode: false }
      );
      // 成功(2xx=新規イベント登録・編集画面表示)に到達しないこと。未認証はリダイレクト/拒否となる。
      expect(res.status()).toBeGreaterThanOrEqual(300);
    });

    // ===== 複製新規画面の表示（SEED-M13-05-SRC） =====

    test("E2E-M13-05-001 編集画面の複製新規リンク押下で複製新規画面へ遷移", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_SRC, "SEED-M13-05-SRC 未設定（EVENT_DUP_SRC_ID）");
      await login(page);
      const dup = new EventEventDuplicateRegisterPage(page);
      await dup.gotoEdit(SRC_ID);
      const srcName = await dup.readNameJp();
      await dup.clickCopyLink();
      // 期待は仕様「複製元の値を載せた新規登録画面へ遷移」。実装ルート名(/copy)は設計(/duplicate)と相違する
      // ため URL をオラクルに固定せず、新規登録フォームの表示＋複製元の初期値が載ることで判定する（オラクル独立）。
      await dup.seeDuplicateForm();
      await expect(dup.nameJp).toHaveValue(srcName);
    });

    test("E2E-M13-05-003 複製新規画面は新規登録と同一のイベント情報フォームを表示", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_SRC, "SEED-M13-05-SRC 未設定");
      await login(page);
      const dup = new EventEventDuplicateRegisterPage(page);
      await dup.gotoCopy(SRC_ID);
      await dup.seeDuplicateForm();
    });

    test("E2E-M13-05-002 複製元イベントの値が初期値として表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_SRC, "SEED-M13-05-SRC 未設定");
      await login(page);
      const dup = new EventEventDuplicateRegisterPage(page);
      // 仕様(業務ルール「複製する項目」)由来。複製元(編集画面)の代表複数項目を読み、複製新規画面でも
      // 同値が初期値で載ることを確認する。値はハードコードせず複製元⇔複製新規の同値比較で判定（オラクル独立）。
      await dup.gotoEdit(SRC_ID);
      const srcFields = await dup.readCopiedFieldValues();
      await dup.gotoCopy(SRC_ID);
      const copyFields = await dup.readCopiedFieldValues();
      expect(copyFields).toEqual(srcFields);
      // 少なくともイベント名(日)は複製元の値が初期値で載ること。
      await expect(dup.nameJp).toHaveValue(srcFields.nameJp);
    });

    test("E2E-M13-05-005 複製新規画面では日程一覧/日程操作ボタンを表示しない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_SRC, "SEED-M13-05-SRC 未設定");
      await login(page);
      const dup = new EventEventDuplicateRegisterPage(page);
      await dup.gotoCopy(SRC_ID);
      // 複製新規は新規登録扱い(isNew=true)のため、日程操作ブロック(edit.twig:392 {% if not isNew %})は出ない。
      await expect(dup.scheduleAddButton).toHaveCount(0);
    });

    test("E2E-M13-05-006 複製新規画面では複製新規リンクを表示しない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_SRC, "SEED-M13-05-SRC 未設定");
      await login(page);
      const dup = new EventEventDuplicateRegisterPage(page);
      await dup.gotoCopy(SRC_ID);
      // 仕様(フロント挙動/利用者視点の入口)由来。複製新規ボタンは登録済みイベントの編集画面にのみ表示され、
      // 複製新規画面(isNew=true, edit.twig:491 {% if not isNew %})には出ない。
      await expect(dup.copyLink).toHaveCount(0);
    });

    // ===== URL直接アクセス・エラー処理 =====

    test("E2E-M13-05-030 存在しない複製元IDで複製新規→404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const res = await page.goto(
        `/${ECCUBE_ADMIN_ROUTE}/event/${MISSING_ID}/copy`
      );
      expect(res?.status()).toBe(404);
    });

    test("E2E-M13-05-031 複製元ID非整数で複製新規→ルート制約不一致で到達しない(404)", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      // ルート requirements id=\d+（EventController.php:195）に一致しないため到達しない。
      const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/event/abc/copy`);
      expect(res?.status()).toBe(404);
    });

    test("E2E-M13-05-032 複製元ID=0（1未満）で複製新規→到達しない(404)", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      // 仕様(エッジ: 複製元IDは1以上、1未満は到達不可)由来。0 はルート制約/業務上の有効IDでないため到達しない。
      const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/event/0/copy`);
      expect(res?.status()).toBe(404);
    });

    // ===== 保存（新規登録経路 admin_event_create） =====

    test("E2E-M13-05-010 入力を変更せず保存→新規イベントの編集画面へ遷移", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_SRC, "SEED-M13-05-SRC 未設定");
      await login(page);
      const dup = new EventEventDuplicateRegisterPage(page);
      await dup.gotoCopy(SRC_ID);
      await dup.submit(); // 複製元と同じ入力値のまま保存（新規登録）
      // 保存成功は登録した新規イベントの編集画面へ遷移（複製元の /copy ではなく /{newId}/edit）。
      await expect(page).toHaveURL(EDIT_RE);
      await expect(page).not.toHaveURL(COPY_RE);
    });

    test("E2E-M13-05-011 保存成功時に成功メッセージ「保存しました」を表示", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_SRC, "SEED-M13-05-SRC 未設定");
      await login(page);
      const dup = new EventEventDuplicateRegisterPage(page);
      await dup.gotoCopy(SRC_ID);
      await dup.submit();
      // 仕様(入出力: 成功時フラッシュ)由来。実装メッセージキー名ではなく表示文言で判定。
      await expect(page.locator("body")).toContainText("保存しました"); // admin.common.save_complete
    });

    test("E2E-M13-05-020 必須未入力で保存→検証エラー表示で滞留（新規登録扱い）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_SRC, "SEED-M13-05-SRC 未設定");
      await login(page);
      const dup = new EventEventDuplicateRegisterPage(page);
      await dup.gotoCopy(SRC_ID);
      await dup.nameJp.fill(""); // 必須項目を空にして検証失敗を誘発（必須の正はM13-02）
      await dup.submit();
      // 検証失敗は新規登録テンプレートを再描画（編集画面へは遷移しない）。
      await expect(page).not.toHaveURL(EDIT_RE);
      await expect(dup.fieldError.first()).toBeVisible();
    });

    // ===== 保留（手動/間接・要実機。自動カバー済みではない） =====

    test.fixme(
      "E2E-M13-05-050 保存後も複製元イベントは更新されない（要: 複製元の保存前後比較／DB間接確認）",
      async () => {
        // 期待は仕様(データ整合性: 複製元との独立性)由来。複製元の更新有無は新規IDと別レコードでの突合が要り、
        // 安定確認に複製元の保存前後比較かDB参照が必要なため実機確認後に実装する。
      }
    );

    test.fixme(
      "E2E-M13-05-051 登録者IDがログイン中の管理者・イベントIDが新規採番（DB内部値・要実機/間接）",
      async () => {
        // 期待は仕様(業務ルール: 複製しない項目=採番・登録者)由来。member_id/採番はDB内部値で画面から直接観測できない。
      }
    );
  }
);
