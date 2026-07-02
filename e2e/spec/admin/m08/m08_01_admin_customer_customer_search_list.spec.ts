/**
 * 管理画面 会員管理 会員検索/一覧（M08-01）E2E。納品ケース表
 * integration_test/e2e/m08_01_admin_customer_customer_search_list_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、要データ十分性・要実機確認・永続化副作用ありは test.fixme（理由付き）で残す。
 * 手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/pf-eccube3/m08-01_admin_customer_customer_search_list.md / 観点表)の挙動由来（オラクル独立性）。
 * pf-eccube3(HareruyaEcプラグイン)由来設計だが、刷新先 ec-cube-enterprise に同一画面(admin_customer)が実在するためE2E化した。
 * 設計源と刷新先の文言・URL・入力項目の乖離はケース表 付帯表4（不具合候補）に集約。表示文言の i18n リソース由来語は
 * オラクルにせず、設計書が明記する挙動・観測（メッセージ領域の表示有無・該当URLへの遷移）で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・m06/m07/*.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 * 会員一覧・操作導線を要するケースは SEED-M08-CUSTOMER（会員1件以上）が前提。検索パターンは SEED-M08-PATTERN。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { CustomerCustomerSearchListPage } from "../../../pages/admin/m08/m08_01_admin_customer_customer_search_list.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
// 検索は form action="" のため /customer へPOSTし同一画面に滞留する（index.twig:41 / Controller.php:69）。
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/customer(\\?|$)`);
// 会員編集 admin_customer_edit = /{admin_route}/customer/{id}/edit（id は \d+）。
const EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/customer/\\d+/edit`);
// 会員CSV出力 admin_customer_export = /{admin_route}/customer/export。
const EXPORT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/customer/export`);
// 会員削除 admin_customer_delete = /{admin_route}/customer/{id}/delete（CustomerController.php:227）。
const DELETE_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/customer/\\d+/delete`);

// 設計書が明記する件数見出しの共通語（仕様由来＝オラクル）。句読点差(付帯表4#2)を避け部分一致で判定。
const RESULT_COUNT_TEXT = "該当しました"; // 仕様「集計条件」＝件数見出し

// どの会員（ID・メール・お名前）にも一致しないフリーワード（0件を確実に誘発）。
const NO_MATCH = "ZZZ-E2E-M08-NO-MATCH-0000000000";

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
}

test.describe(
  "管理画面 > 会員管理 > 会員検索/一覧",
  { tag: ["@admin", "@search", "@customer"] },
  () => {
    // ===== 認証ガード（資格情報不要・非破壊） =====

    test("E2E-M08-01-050 未ログインで会員マスターURL直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/customer`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 初期表示（ログインのみ・seed不要） =====

    test("E2E-M08-01-001 初期表示で検索フォーム（フリーワード欄・検索ボタン）が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new CustomerCustomerSearchListPage(page);
      await list.goto();
      await expect(page).toHaveURL(LIST_RE);
      await list.seeSearchForm();
    });

    test("E2E-M08-01-002 フリーワード欄に「会員ID・メールアドレス・お名前」の案内文言が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new CustomerCustomerSearchListPage(page);
      await list.goto();
      // 仕様「フロント挙動（表示要素）」由来。実装は label（不具合候補#8 プレースホルダではない）だが、案内文言の表示を観測する。
      await expect(list.multiLabel.first()).toBeVisible();
    });

    test("E2E-M08-01-003 詳細条件のアコーディオン展開トグルが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new CustomerCustomerSearchListPage(page);
      await list.goto();
      await expect(list.searchDetailToggle.first()).toBeVisible();
    });

    test("E2E-M08-01-004 「検索条件をクリア」リンクが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new CustomerCustomerSearchListPage(page);
      await list.goto();
      await expect(list.clearLink).toBeAttached(); // 詳細パネル内のためアタッチで判定
    });

    test("E2E-M08-01-005 初期表示(GET・条件なし)では一覧・件数見出し・該当なしメッセージとも描画されない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new CustomerCustomerSearchListPage(page);
      await list.goto();
      // 仕様「処理フロー（初回は空・pagination null）」: 一覧・件数・該当なしカードのいずれも出さない（index.twig:556-557）。
      await expect(list.resultTable).toHaveCount(0);
      await expect(list.countHeading).toHaveCount(0);
      await expect(list.messageCard).toHaveCount(0);
    });

    // ===== 検索 0件（ログインのみ・該当しない条件で誘発） =====

    test("E2E-M08-01-011 該当しないフリーワードで該当データなしメッセージが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new CustomerCustomerSearchListPage(page);
      await list.goto();
      await list.searchByMulti(NO_MATCH);
      // 仕様「エッジケース（検索結果0件）」: 該当なしメッセージ領域を表示する。
      // 文言は正典が「ロケール定義を確認値とする」と明記（オラクル独立性）のため、文言ではなく領域の表示を観測。
      await expect(list.messageCard).toBeVisible();
      // 0件カードと検証失敗カードは見出しセレクタを共有するため、構造（.text-muted 行数）で識別する。
      // 0件カード=3行（見出し+条件変更案内+詳細検索案内 index.twig:561-564）/ 検証失敗=2行（index.twig:552-553）。
      // フリーワードは検証を通過する有効入力のため has_errors=偽＝0件分岐（相互排他 index.twig:549-565）であることを併せて固定する。
      await expect(list.messageCardBody.locator(".text-muted")).toHaveCount(3);
      await expect(list.resultTable).toHaveCount(0);
      await expect(list.countHeading).toHaveCount(0);
    });

    // ===== 検索（会員データ前提＝SEED-M08-CUSTOMER。staging既存会員で代替可） =====

    test("E2E-M08-01-010 条件未指定で検索実行→件数見出しが表示され同一画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new CustomerCustomerSearchListPage(page);
      await list.goto();
      await list.searchAll();
      await expect(page).toHaveURL(LIST_RE); // form action="" ＝ /customer へPOST・滞留
      // 仕様「集計条件」: 検索後は件数見出しを出す（pagination 真）。件数1件以上の会員データを前提とする。
      await expect(list.countHeading).toContainText(RESULT_COUNT_TEXT);
    });

    test("E2E-M08-01-012 検索実行で会員一覧テーブルが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（会員1件以上＝SEED-M08-CUSTOMER 前提）");
      await login(page);
      const list = new CustomerCustomerSearchListPage(page);
      await list.goto();
      await list.searchAll();
      // 仕様「処理フロー（検索結果一覧表示）」: 一覧テーブルが描画される（totalItemCount>0）。
      await expect(list.resultTable.first()).toBeVisible();
      await expect(list.resultRows.first()).toBeVisible();
    });

    test("E2E-M08-01-013 検索結果あり時に表示件数プルダウンと表示件数選択URLが設定される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（会員1件以上前提）");
      await login(page);
      const list = new CustomerCustomerSearchListPage(page);
      await list.goto();
      await list.searchAll();
      await expect(list.pageCountPulldown).toBeVisible();
      // 仕様「業務ルール（表示件数）／利用者視点の入口（page/{page_no}）」: option に admin_customer_page page_count URL。
      const value = await list.pageCountPulldown
        .locator("option[value*='page_count=']")
        .first()
        .getAttribute("value");
      expect(value, "表示件数optionに会員ページ(page_count付き)URLが設定されること").toBeTruthy();
      expect(value as string).toMatch(
        new RegExp(`/${ECCUBE_ADMIN_ROUTE}/customer/page/\\d+`)
      );
    });

    // ===== 操作導線リンク（会員データ前提） =====

    test("E2E-M08-01-040 会員編集導線が会員編集(admin_customer_edit)を指す", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（会員1件以上前提）");
      await login(page);
      const list = new CustomerCustomerSearchListPage(page);
      await list.goto();
      await list.searchAll();
      const href = await list.editLinks.first().getAttribute("href");
      expect(href, "会員編集導線のリンク先").toBeTruthy();
      expect(href as string).toMatch(EDIT_RE); // 仕様「画面遷移」: /customer/{id}/edit
    });

    test("E2E-M08-01-041 メール履歴導線がメール送信履歴(mail_history)を指す", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（会員1件以上前提）");
      await login(page);
      const list = new CustomerCustomerSearchListPage(page);
      await list.goto();
      await list.searchAll();
      const href = await list.mailHistoryLinks.first().getAttribute("href");
      expect(href, "メール履歴導線のリンク先").toBeTruthy();
      expect(href as string).toContain("mail_history"); // 仕様「画面遷移」: メール送信履歴 m08-07
    });

    test("E2E-M08-01-042 CSVダウンロード導線が会員CSV出力(admin_customer_export)を指す", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（会員1件以上前提）");
      await login(page);
      const list = new CustomerCustomerSearchListPage(page);
      await list.goto();
      await list.searchAll();
      const href = await list.csvExportLink.first().getAttribute("href");
      expect(href, "CSVダウンロード導線のリンク先").toBeTruthy();
      expect(href as string).toMatch(EXPORT_RE); // 仕様「画面遷移」: 会員CSV出力
    });

    test("E2E-M08-01-043 会員削除導線が会員削除(admin_customer_delete)を指す", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（会員1件以上前提）");
      await login(page);
      const list = new CustomerCustomerSearchListPage(page);
      await list.goto();
      await list.searchAll();
      const href = await list.deleteLinks.first().getAttribute("href");
      expect(href, "会員削除導線のリンク先").toBeTruthy();
      expect(href as string).toMatch(DELETE_RE); // 仕様「画面遷移」: 削除→会員削除 admin_customer_delete
    });

    test("E2E-M08-01-044 メール通知導線が手動メール通知(admin_customer_manual_mail)を指す", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（会員1件以上前提）");
      await login(page);
      const list = new CustomerCustomerSearchListPage(page);
      await list.goto();
      await list.searchAll();
      const href = await list.manualMailLinks.first().getAttribute("href");
      expect(href, "メール通知導線のリンク先").toBeTruthy();
      expect(href as string).toContain("manual_mail"); // 仕様「画面遷移」: メール通知→手動メール通知 M08-08
    });

    test("E2E-M08-01-045 メール一括送信導線がメール一括送信(admin_customer_mail)を指す", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（会員1件以上前提）");
      await login(page);
      const list = new CustomerCustomerSearchListPage(page);
      await list.goto();
      await list.searchAll();
      const href = await list.bulkMailLink.first().getAttribute("href");
      expect(href, "メール一括送信導線のリンク先").toBeTruthy();
      expect(href as string).toContain("/customer/mail"); // 仕様「画面遷移」: メール一括送信 M08-08
    });

    test("E2E-M08-01-060 詳細条件アコーディオンを展開すると詳細検索パネルが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new CustomerCustomerSearchListPage(page);
      await list.goto();
      // 仕様「フロント挙動（JS挙動）: アコーディオンの開閉」由来。トグル押下で #searchDetail が可視になる実挙動を観測。
      await expect(page.locator("#searchDetail")).not.toBeVisible();
      await list.openDetail();
      await expect(page.locator("#searchDetail")).toBeVisible();
      await expect(list.dciName).toBeVisible(); // 詳細条件フィールドが操作可能になる
    });

    // ===== 存在しない検索パターン適用（資格情報のみ） =====

    test("E2E-M08-01-024 存在しない検索パターンを適用すると404になる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      // 仕様「処理フロー（パターン適用）／エラー処理」: 不存在パターンは404（Controller.php:400近傍 NotFound）。
      // 実装ルートは /customer/pattern/{id}（設計の /customer/search/pattern/ と差・不具合候補#3）。
      const res = await page.goto(
        `/${ECCUBE_ADMIN_ROUTE}/customer/pattern/999999999`
      );
      expect(res?.status(), "存在しないパターン適用は404").toBe(404);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M08-01-020 検索パターン名未入力で保存→パターン名未入力エラー（要実機: 詳細アコーディオン展開＋.submit JSでの保存POST経路）",
      async () => {
        // 期待は仕様「処理フロー（パターン保存・名前空はエラー）」由来（SearchControllerTrait.php:245-246）。
        // 「検索パターン名を入力」を含むエラー表示を主観測。アコーディオン展開と data-action 切替submitを実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M08-01-021 検索パターン名入力で保存→保存成功メッセージ（要: DtbSearchPattern登録の永続化副作用・一意接頭辞E2E_M08_でクリーンアップ）",
      async () => {
        // 期待は仕様「処理フロー（パターン保存成功）」由来（SearchControllerTrait.php:264）。文言差は不具合候補#4。
        // 永続化を伴うため専用名＋後始末を設計後に実装する。
      }
    );

    test.fixme(
      "E2E-M08-01-022 保存済み検索パターン適用→条件復元と一覧表示（要: SEED-M08-PATTERN 会員用パターン）",
      async () => {
        // 期待は仕様「処理フロー（保存パターン適用→復元一覧）」由来（Controller.php:400-412）。
        // a[href*="/customer/pattern/"] のリンク押下で復元。会員用パターンの投入後に実装。
      }
    );

    test.fixme(
      "E2E-M08-01-023 検索パターン削除→削除成功・会員マスターへ戻る（要: SEED-M08-PATTERN＋削除の副作用）",
      async () => {
        // 期待は仕様「処理フロー（パターン削除成功→会員マスター）」由来（Controller.php:382-391）。文言差は不具合候補#5。
        // 削除はパターンID設定時のみボタン表示。使い捨てパターン投入後に実装。
      }
    );

    test.fixme(
      "E2E-M08-01-030 買取総額に不正値→検証失敗で検索条件不正表示（要実機: 詳細アコーディオン展開＋検証失敗カード表示）",
      async () => {
        // 期待は仕様「バリデーション（買取総額：整数・数字のみ・最小1）／エラー処理」由来（has_errors Controller.php:111-120）。
        // 詳細パネル展開後に #admin_search_customer_sell_total_start へ不正値→検索で検証失敗を確認する。
      }
    );

    test.fixme(
      "E2E-M08-01-031 登録日 開始>終了で日付範囲の検証失敗（要実機: 詳細アコーディオン展開＋日付ピッカー入力）",
      async () => {
        // 期待は仕様「バリデーション（登録日範囲相関）」由来（SearchCustomerType.php:533-537 admin.product.date_range_error）。
      }
    );

    test.fixme(
      "E2E-M08-01-032 MTG Companion登録本名に最大長(64)で検証エラーなく継続（要実機: 詳細アコーディオン展開）",
      async () => {
        // 期待は仕様「バリデーション（MTG本名 最大長＝境界内は継続）」由来（SearchCustomerType.php:497-507）。
      }
    );

    test.fixme(
      "E2E-M08-01-033 全条件未入力で検索しても検証エラーなく継続（要実機: 検証エラー要素の不在確認）",
      async () => {
        // 期待は仕様「バリデーション（検索条件は必須でない）」由来（Controller.php:105 isValid）。
        // 010で件数見出し表示は確認済み。検証エラー要素が出ないことの明示確認を実機後に実装。
      }
    );
  }
);
