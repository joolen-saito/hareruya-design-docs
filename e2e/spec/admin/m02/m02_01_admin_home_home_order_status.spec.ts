/**
 * 管理画面ホーム「受注状況（注文状況）」カード E2E。
 * 納品ケース表 integration_test/e2e/m02_01_admin_home_home_order_status_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装し、要シードの021/022は test.fixme（理由付き）。
 * 手動/間接・対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約準拠）。
 * 期待結果は仕様(m02-01_admin_home_home_order_status.md / messages.ja.yaml)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { HomeHomeOrderStatusPage } from "../../../pages/admin/m02/m02_01_admin_home_home_order_status.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const HOME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/?(\\?|$)`);
const ORDER_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/order(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;

// 仕様(設計書「業務ルール・計算/除外条件」)由来の除外ステータス5区分の表示名。実装に合わせて変えない。
// 設計は「キャンセル・出荷完了・決済処理中・購入処理中・返品」を表示対象/件数集計から除外する。
// 表示名の厳密一致はロケール文言依存のため要確認（ケース表 付帯表4 #1）。
const EXCLUDED_NAMES = ["キャンセル", "出荷完了", "決済処理中", "購入処理中", "返品"];

/** 管理ログインしてホームへ到達する。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  // 認証成功でホーム画面相当へ（2FA等が無効な共通アカウント前提）。
  await expect(page).toHaveURL(HOME_RE);
}

test.describe(
  "管理画面ホーム > 受注状況カード",
  { tag: ["@admin", "@home"] },
  () => {
    // ===== 未認証（資格情報不要・非破壊） =====

    test("E2E-M02-01-040 未ログインでホームURL直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/`);
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可: 未認証はログインへ
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M02-01-041 未ログインでは受注状況カードを利用できない", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/`);
      // ホーム自体に到達できないため、受注状況カードは存在しない。
      await expect(page.locator("#order-status")).toHaveCount(0);
    });

    // ===== 認証必須・表示（HAS_CREDS） =====

    test("E2E-M02-01-001 ホーム受注状況カードに見出し「注文状況」とステータス行が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const card = new HomeHomeOrderStatusPage(page);
      await card.gotoHome();
      await card.seeCard();
    });

    test("E2E-M02-01-002 各ステータス行にステータス名と件数が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const card = new HomeHomeOrderStatusPage(page);
      await card.gotoHome();
      // 行リンクが1件以上あり、件数表示要素が行と同数ある（名前＋件数の対）。
      const rowCount = await card.statusRowLinks.count();
      expect(rowCount).toBeGreaterThan(0);
      await expect(card.counts).toHaveCount(rowCount);
      await expect(card.statusRowLinks.first()).not.toBeEmpty();
    });

    test("E2E-M02-01-003 件数が0以上の整数で表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const card = new HomeHomeOrderStatusPage(page);
      await card.gotoHome();
      const texts = await card.counts.allInnerTexts();
      for (const t of texts) {
        expect(t.trim(), `件数は0以上の整数（仕様: 件数は整数表示）: "${t}"`).toMatch(/^\d+$/);
      }
    });

    // ===== 認証必須・遷移（HAS_CREDS） =====

    test("E2E-M02-01-010 カード見出し押下→受注一覧へ遷移しステータス条件が付与されない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const card = new HomeHomeOrderStatusPage(page);
      await card.gotoHome();
      await card.clickHeading();
      await expect(page).toHaveURL(ORDER_RE); // 受注一覧へ
      expect(page.url()).not.toContain("order_status_id"); // 見出し経路はステータス条件なし
    });

    test("E2E-M02-01-011 ステータス行押下→受注一覧へ遷移し当該ステータスで絞り込まれる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const card = new HomeHomeOrderStatusPage(page);
      await card.gotoHome();
      // 設計「ステータス行から受注一覧へ：そのステータスの識別子がクエリとして付与される」。
      // クリックした行 href の識別子と、遷移後URLの order_status_id 値が一致することまで確認する。
      const href = await card.statusRowLinks.first().getAttribute("href");
      const m = href?.match(/order_status_id=([^&]+)/);
      expect(m, "ステータス行 href は order_status_id を持つ").not.toBeNull();
      const id = m![1];
      await card.statusRowLinks.first().click();
      await expect(page).toHaveURL(ORDER_RE);
      await expect(page).toHaveURL(new RegExp(`order_status_id=${id}(?:&|$)`)); // クリック行の識別子が遷移後URLに反映
    });

    test("E2E-M02-01-012 ステータス行リンクのhrefに当該ステータス識別子(order_status_id)が含まれる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const card = new HomeHomeOrderStatusPage(page);
      await card.gotoHome();
      const href = await card.statusRowLinks.first().getAttribute("href");
      expect(href, "ステータス行リンクは order_status_id を一覧へ渡す").toContain("order_status_id");
    });

    // ===== 認証必須・入力（クエリ非受領）（HAS_CREDS） =====

    test("E2E-M02-01-013 不要なステータスクエリを付与してもカード表示・件数・行が変化しない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const card = new HomeHomeOrderStatusPage(page);
      // 通常表示の行数・件数を記録する。
      await card.gotoHome();
      await card.seeCard();
      const baseRows = await card.statusRowLinks.count();
      const baseCounts = await card.counts.allInnerTexts();
      // 設計「入力＝ホーム画面表示要求。クエリでステータスを本ブロックが受け取る設計にしない」。
      // 不要な order_status_id クエリを付与してホームを再表示しても、カードの行・件数は不変であること。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/?order_status_id=999999`);
      await card.seeCard();
      expect(await card.statusRowLinks.count(), "不要クエリでも表示行数は不変").toBe(baseRows);
      expect(await card.counts.allInnerTexts(), "不要クエリでも各件数は不変").toEqual(baseCounts);
    });

    // ===== 認証必須・除外/UIの否定確認（HAS_CREDS） =====

    test("E2E-M02-01-020 除外5区分(キャンセル/出荷完了/決済処理中/購入処理中/返品)がカードに表示されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const card = new HomeHomeOrderStatusPage(page);
      await card.gotoHome();
      await card.seeCard();
      // 除外5区分（設計「除外条件」由来）はいずれも表示対象から外れる。5区分すべての非表示を確認する。
      for (const name of EXCLUDED_NAMES) {
        await expect(
          card.rowByName(name),
          `除外区分はカードのステータス行に表示されない: ${name}`
        ).toHaveCount(0);
      }
    });

    test("E2E-M02-01-030 受注状況カードにモーダル/ポップアップ/トースト/確認ダイアログが表示されない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const card = new HomeHomeOrderStatusPage(page);
      await card.gotoHome();
      await card.seeCard();
      await expect(card.card.locator(".modal, .toast, [role='dialog']")).toHaveCount(0);
    });

    test("E2E-M02-01-031 受注状況カードにフォーム・テキスト入力欄が無い", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const card = new HomeHomeOrderStatusPage(page);
      await card.gotoHome();
      await card.seeCard();
      await expect(card.card.locator("form, input, textarea, select")).toHaveCount(0);
    });

    // ===== 自動化予定だが要シード（未実装。手動/対象外はケース表で管理） =====

    test.fixme(
      "E2E-M02-01-021 ステータス行がマスタの表示順(sort_no昇順)で並ぶ（要: 既知の受注ステータスマスタ並び順シード）",
      async () => {
        // 期待は仕様(処理フロー/業務ルール「表示順」)由来。マスタ sort_no を既知化したシード投入後に
        // 表示行のテキスト順序がマスタ昇順と一致することを検証する。
      }
    );

    test.fixme(
      "E2E-M02-01-022 該当受注0件の非除外ステータスも行として表示され件数0（要: 0件ステータスを含むシード）",
      async () => {
        // 期待は仕様(集計条件/エッジケース「マスタに存在し0件のステータス」)由来。
        // 非除外かつ受注0件のステータスを用意し、行が残り件数が「0」表示になることを検証する。
      }
    );

    test.fixme(
      "E2E-M02-01-023 ステータス行の件数が受注台帳の集計結果と一致し除外分・期間絞り込みなしで数える（要: 件数既知シード）",
      async () => {
        // 期待は仕様(処理フロー「ステータス別件数の取得＝識別子ごとにグループ集計した読み取り／除外は集計から除く／
        // 期間・会員・支払方法等の絞り込みは課さない」・集計条件)由来。
        // 非除外ステータスにN件、除外ステータスに別件数を投入し、当該行の件数がNと一致すること
        // （除外分は加算されない・期間で間引かれない）を検証する。件数はDB集計由来でPOM文言に依らない。
      }
    );

    test.fixme(
      "E2E-M02-01-024 ステータス行件数は会員・支払方法・配送先・店舗の差異に関わらず全件数える（要: 属性差シード）",
      async () => {
        // 期待は仕様(集計条件「期間・会員・支払方法・配送先・店舗の絞り込みを課さない」・
        // 処理フロー「ステータス別件数の取得＝識別子ごとにグループ集計した読み取り」)由来。
        // 非除外の同一ステータスに、会員・支払方法・配送先の異なる受注を複数投入し、
        // 当該行の件数が全件と一致し属性差で間引かれないことを検証する。件数はDB集計由来でPOM文言に依らない。
      }
    );
  }
);
