/**
 * 管理画面 店頭買取管理 買取ステータス変更（M06-04）E2E。納品ケース表
 * integration_test/e2e/m06_04_admin_store_purchase_purchase_store_status_change_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、破壊的更新（受注ステータスを変えるもの）は test.fixme（理由付き）で残す。
 * 非破壊の業務拒否（021 入庫済みからの違反遷移）はシードを env で受け取り skip ガードで実行する。
 * 手動（CSRF改竄=060 は_token機構が白箱・店舗不一致=022/061 は専用権限）・DB副作用はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/pf-eccube3/m06-04_admin_store_purchase_purchase_store_status_change.md / 観点表)の挙動由来（オラクル独立性）。
 * i18nメッセージ文言(messages.ja.yaml)は実装由来のためオラクルにせず、観測挙動（表示要素・遷移先URL・フラッシュ領域の出現）で判定する。
 * 業務拒否文言「経理払出し待ちステータスの買取ではありません」・confirm文言は設計書本文に明記された値のため採用する。
 * pf-eccube3 由来設計だが刷新先 ec-cube-enterprise に同一画面(admin_otcbuyorder_status)が実在するためE2E化した。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts も @playwright/test を直接使う。本specも踏襲し、資格情報・対象受注IDが
 * 無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *
 * シード/資格情報（環境変数。コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 編集可能店舗を持つ管理者
 *  - OTC_ORDER_ID : SEED-M06-04-ORDER（現在ステータスが経理払出し待ち(10)・入庫済み(11)以外の店頭買取受注ID）
 *  - OTC_RESTOCKED_ID : SEED-M06-04-RESTOCKED（現在ステータス=入庫済み(11)の受注ID。021 非破壊の業務拒否用）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AdminStorePurchasePurchaseStoreStatusChangePage } from "../../../pages/admin/m06/m06_04_admin_store_purchase_purchase_store_status_change.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);
const OTC_ORDER_ID = process.env.OTC_ORDER_ID || "";
const HAS_ORDER = !!(HAS_CREDS && OTC_ORDER_ID);
// SEED-M06-04-RESTOCKED: 現在ステータス=入庫済み(11)の受注ID。入庫済みからの違反遷移(管理者取消以外)拒否=非破壊。
const OTC_RESTOCKED_ID = process.env.OTC_RESTOCKED_ID || "";
const HAS_RESTOCKED = !!(HAS_CREDS && OTC_RESTOCKED_ID);

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const STATUS_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/status/\\d+`);
const DETAIL_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/\\d+(\\?|$)`);

// 業務拒否文言は設計書フロー#4に明記＝仕様由来（オラクル）。
const ERR_NOT_ACCOUNTING_PENDING = "経理払出し待ちステータスの買取ではありません";
// confirm文言は設計書フロント挙動に明記＝仕様由来。
const CONFIRM_ACCOUNT_TEAM_PAID = "経理払出し済みに変更します。よろしいですか？";

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
}

test.describe(
  "管理画面 > 店頭買取管理 > 買取ステータス変更",
  { tag: ["@admin", "@otcbuyorder"] },
  () => {
    // ===== 認証不要 =====

    test("E2E-M06-04-050 未ログインでステータス変更URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/status/1`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== ステータス変更画面の表示（SEED-M06-04-ORDER・非破壊） =====

    test("E2E-M06-04-001 ステータス変更画面: 査定番号・現在ステータス・select・保存が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_ORDER, "SEED-M06-04-ORDER 未設定（ECCUBE_ADMIN_USER/PASS・OTC_ORDER_ID）");
      await login(page);
      const sc = new AdminStorePurchasePurchaseStoreStatusChangePage(page);
      await sc.gotoStatus(OTC_ORDER_ID);
      await sc.seeStatusForm();
    });

    test("E2E-M06-04-002 ステータス変更画面: selectの先頭がプレースホルダ（value空・初期選択なし）", async ({
      page,
    }) => {
      test.skip(!HAS_ORDER, "SEED-M06-04-ORDER 未設定");
      await login(page);
      const sc = new AdminStorePurchasePurchaseStoreStatusChangePage(page);
      await sc.gotoStatus(OTC_ORDER_ID);
      // 先頭optionがプレースホルダ（value空）＝初期選択値を載せない（GET#3）。
      // プレースホルダ文言「ステータスを選択」はi18n実装由来のためオラクルにせず、value空であることのみ判定する。
      const first = sc.statusSelect.locator("option").first();
      await expect(first).toHaveAttribute("value", "");
    });

    test("E2E-M06-04-003 ステータス変更画面: 店頭買取詳細へ戻るリンクが表示される", async ({ page }) => {
      test.skip(!HAS_ORDER, "SEED-M06-04-ORDER 未設定");
      await login(page);
      const sc = new AdminStorePurchasePurchaseStoreStatusChangePage(page);
      await sc.gotoStatus(OTC_ORDER_ID);
      await expect(sc.backToDetailLink).toBeVisible();
    });

    test("E2E-M06-04-004 ステータス変更画面: カード見出しが「ステータス変更」", async ({ page }) => {
      test.skip(!HAS_ORDER, "SEED-M06-04-ORDER 未設定");
      await login(page);
      const sc = new AdminStorePurchasePurchaseStoreStatusChangePage(page);
      await sc.gotoStatus(OTC_ORDER_ID);
      await expect(sc.cardHeader).toBeVisible();
    });

    test("E2E-M06-04-005 変更後ステータスのプルダウンは廃止IDを除外しID昇順で表示される", async ({
      page,
    }) => {
      test.skip(!HAS_ORDER, "SEED-M06-04-ORDER 未設定");
      await login(page);
      const sc = new AdminStorePurchasePurchaseStoreStatusChangePage(page);
      await sc.gotoStatus(OTC_ORDER_ID);
      const values = await sc.optionValues();
      // 廃止ステータス(ID=3,4,7)は選択肢に出さない（業務ルール・仕様由来）。
      for (const dep of ["3", "4", "7"]) {
        expect(values).not.toContain(dep);
      }
      // ID昇順（数値として単調増加）であること。
      const nums = values.map((v) => Number(v));
      const sorted = [...nums].sort((a, b) => a - b);
      expect(nums).toEqual(sorted);
    });

    test("E2E-M06-04-020 変更後ステータス未選択で保存→詳細へ遷移せず同画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_ORDER, "SEED-M06-04-ORDER 未設定");
      await login(page);
      const sc = new AdminStorePurchasePurchaseStoreStatusChangePage(page);
      await sc.gotoStatus(OTC_ORDER_ID);
      await sc.save(); // 何も選択せず保存
      // 未選択では保存が完了せず詳細へ遷移しない。HTML5ネイティブ必須でPOST抑止/サーバ側200再表示のどちらでも
      // 「詳細へ遷移しない＝同画面滞留」が成立する（必須はForm制約=実装由来のためオラクル化せず、観測挙動で判定）。
      await expect(page).not.toHaveURL(DETAIL_RE);
      await expect(sc.statusSelect).toBeVisible();
      // フィールドエラー出力クラスは要実機確認のため、主オラクルは「同画面滞留＋select健在」に置く。
    });

    // ===== 店頭買取詳細のショートカット表示・確認ダイアログ（非破壊） =====

    test("E2E-M06-04-030 詳細に「経理払出し済」「入庫済みにする」「ステータス変更」が常時表示される", async ({
      page,
    }) => {
      test.skip(!HAS_ORDER, "SEED-M06-04-ORDER 未設定");
      await login(page);
      const sc = new AdminStorePurchasePurchaseStoreStatusChangePage(page);
      await sc.gotoDetail(OTC_ORDER_ID);
      await expect(sc.detailAccountTeamPaidButton).toBeVisible();
      await expect(sc.detailRestockedButton).toBeVisible();
      await expect(sc.detailStatusChangeLink).toBeVisible();
    });

    test("E2E-M06-04-006 詳細の「ステータス変更」リンク押下でステータス変更画面へ遷移する", async ({
      page,
    }) => {
      test.skip(!HAS_ORDER, "SEED-M06-04-ORDER 未設定");
      await login(page);
      const sc = new AdminStorePurchasePurchaseStoreStatusChangePage(page);
      await sc.gotoDetail(OTC_ORDER_ID);
      // 利用者視点の入口: 詳細の「ステータス変更」リンク→ステータス変更画面へ遷移（E2E-030はリンク表示のみ）。
      await sc.detailStatusChangeLink.click();
      await expect(page).toHaveURL(STATUS_RE);
      await expect(sc.cardHeader).toBeVisible();
    });

    test("E2E-M06-04-031 「経理払出し済」確認ダイアログが出て取消すと送信されない", async ({ page }) => {
      test.skip(!HAS_ORDER, "SEED-M06-04-ORDER 未設定");
      await login(page);
      const sc = new AdminStorePurchasePurchaseStoreStatusChangePage(page);
      await sc.gotoDetail(OTC_ORDER_ID);
      // 確認ダイアログを取消(dismiss)＝POSTしない。文言は設計書フロント挙動由来。
      let dialogMessage = "";
      page.once("dialog", async (dialog) => {
        dialogMessage = dialog.message();
        await dialog.dismiss();
      });
      await sc.detailAccountTeamPaidButton.click();
      expect(dialogMessage).toContain(CONFIRM_ACCOUNT_TEAM_PAID);
      // 取消なので詳細に留まり、成功フラッシュは出ない。
      await expect(page).toHaveURL(DETAIL_RE);
      await expect(sc.flashSuccess).toHaveCount(0);
    });

    // ===== 業務拒否（入庫済みからの違反遷移・非破壊。SEED-M06-04-RESTOCKED） =====

    test("E2E-M06-04-021 業務拒否(入庫済みからの違反遷移)→ステータス変更画面(同一ID)へ戻りエラーフラッシュ", async ({
      page,
    }) => {
      test.skip(
        !HAS_RESTOCKED,
        "SEED-M06-04-RESTOCKED 未設定（OTC_RESTOCKED_ID＝現在ステータス=入庫済みの受注ID）"
      );
      await login(page);
      const sc = new AdminStorePurchasePurchaseStoreStatusChangePage(page);
      await sc.gotoStatus(OTC_RESTOCKED_ID);
      // 入庫済みからは管理者取消(ID14)以外への遷移は業務拒否される（判定順序#2・仕様由来）。拒否は非破壊。
      const values = await sc.optionValues();
      const target = values.find((v) => v !== "14");
      test.skip(!target, "選択可能な非・管理者取消ステータスがマスタに無い");
      await sc.selectStatusByValue(target as string);
      await sc.save();
      // 業務拒否→同一IDのステータス変更画面へGETリダイレクト＋エラーフラッシュ（POST#4 / Controller.php:357-363）。
      // 文言はi18n実装由来のためオラクル化せず、遷移先URL＝STATUS_RE＋.alert-danger 出現で判定。
      await expect(page).toHaveURL(STATUS_RE);
      await expect(sc.flashDanger).toBeVisible();
    });

    // ===== 404 =====

    test("E2E-M06-04-051 存在しない店頭買取IDのステータス変更画面は404", async ({ page }) => {
      test.skip(!HAS_CREDS, "管理者資格情報 未設定（ECCUBE_ADMIN_USER/PASS）");
      await login(page);
      const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/status/999999999`);
      expect(res?.status()).toBe(404);
    });

    // ===== 保留（破壊的更新・専用権限・要実機確認。理由付きで未実行・抜け漏れ可視化） =====

    test.fixme(
      "E2E-M06-04-010 有効ステータス選択→保存で成功フラッシュ（破壊的: 受注ステータスを更新するため使い捨てシード要）",
      async () => {
        // 期待は仕様(処理フローPOST#5 保存完了フラッシュ)由来。.alert-success の出現で判定（i18n文言はオラクル外）。
      }
    );

    test.fixme(
      "E2E-M06-04-011 保存成功→店頭買取詳細へ302リダイレクト（破壊的: 使い捨てシード要）",
      async () => {
        // 期待は仕様(画面遷移: 成功→店頭買取詳細 / Controller.php:367-369)由来。遷移先URL=DETAIL_RE で判定。
      }
    );

    test.fixme(
      "E2E-M06-04-012 保存成功後の詳細で現在ステータスが新値（間接・破壊的: 使い捨てシード要）",
      async () => {
        // 期待は仕様(データ整合性: 再読込値が新ステータスと一致)由来。詳細の現在ステータス表示で間接確認。
      }
    );

    test.fixme(
      "E2E-M06-04-032 「経理払出し済」確認OK＋経理払出し待ち→成功フラッシュ・詳細（破壊的: 買取成立へ遷移／SEED-M06-04-ACCOUNTING-PENDING）",
      async () => {
        // 期待は仕様(処理フロー経理払出し済#5-6 / Controller.php:430-443)由来。.alert-success＋DETAIL_RE で判定。
      }
    );

    test.fixme(
      "E2E-M06-04-033 「経理払出し済」を経理払出し待ちでない受注で実行→エラーフラッシュで詳細（要: 現在≠経理払出し待ちの確実なシード）",
      async () => {
        // 期待は仕様(処理フロー経理払出し済#4 / Controller.php:422-426)由来。.alert-danger に
        // 「経理払出し待ちステータスの買取ではありません」を含み DETAIL_RE で判定。
        // 確認ダイアログをaccept→POSTするため、対象受注が経理払出し待ちでないことを保証できる環境でのみ実行する。
      }
    );

    test.fixme(
      "E2E-M06-04-040 「入庫済みにする」は確認なしで送信され詳細へ戻る（破壊的: 入庫済みへ更新／使い捨てシード要）",
      async () => {
        // 期待は仕様(処理フロー入庫済みにする#4-5 / Controller.php:483-496・フロント挙動「確認は無い」)由来。
        // dialog ハンドラ未登録でもPOSTされること＋DETAIL_RE で判定。
      }
    );
  }
);
