/**
 * 管理画面 日別/月別集計（集計一覧表示）E2E。
 * 納品ケース表 integration_test/e2e/m12_01_admin_analytics_sales_daily_monthly_summary_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケース（実装済み）と、自動化予定だが未実装/要実機・仕様乖離検出の test.fixme のみを残す。
 * 手動/間接（集計数値の厳密検証・セッション保存）と対象外はケース表で全量管理し、specに大量のfixmeを残さない。
 * 期待結果は仕様(m12-01_admin_analytics_sales_daily_monthly_summary.md / integration-test-viewpoints.md)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 重要(仕様乖離): 設計書は pf-eccube3 / HareruyaEc プラグインのリバースであり、刷新先 ec-cube-enterprise の本画面は
 * 集計フィールド・集計列が大きく異なる（付帯表4 参照）。設計書固有の入力部品（商品名/コード・利用端末・表示項目）と
 * 集計列（来客数/会員数/購買率 等）は刷新先に存在しないため、当該ケースは fixme で残す。
 * 注意: test.fixme は実行されない＝自動では失敗検出されない保留である。これらは「仕様どおりの期待値を保持しつつ、
 * 移行設計でフィルタ/集計指標の対応が確定した後に E2E化 または 対象外 を判断する要確認項目」であり、
 * 付帯表4(不具合候補)・付帯表5(網羅マトリクス)では「保留(要確認)」として扱う（自動カバー済みではない）。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の
 * spec/admin/login.spec.ts・two_factor_auth.spec.ts も @playwright/test を直接使う。本specもこれに倣い
 * @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針:
 *  - ログインが要るケースは ECCUBE_ADMIN_USER/PASS（config/default.config.ts）が無いと走らないよう test.skip でガード。
 *  - シード前提: SEED-M12-ADMIN は「2FA OFF」の管理者。集計結果一覧の出現には対象期間の受注データ（SEED-M12-ORDERS）が必要。
 *  - 集計数値（金額・件数・購買率・会員数・0補完）の厳密検証はDB依存のため手動（ケース表で管理）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AnalyticsSalesDailyMonthlySummaryPage } from "../../../pages/admin/m12/m12_01_admin_analytics_sales_daily_monthly_summary.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// 対象期間の受注データが投入済みのとき true（集計結果一覧が描画される前提）。
const HAS_ORDERS = process.env.SEED_M12_ORDERS === "1";
const LOGIN_RE = /\/login(\?|$)/;
const RESULT_RE = /\/analysis\/summary\/result(\?|$)/;

/** 管理者ログインして集計画面を閲覧できる状態にする（SEED-M12-ADMIN は2FA OFF前提）。 */
async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).not.toHaveURL(LOGIN_RE); // ログイン成功でログイン画面から離脱
}

// 仕様(処理フロー)由来の集計日既定値。実装値ではなく仕様の算出規則で期待値を作る（オラクル独立性）。
function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function firstDayThisMonth(): string {
  const n = new Date();
  return ymd(new Date(n.getFullYear(), n.getMonth(), 1));
}
function lastDayThisMonth(): string {
  const n = new Date();
  return ymd(new Date(n.getFullYear(), n.getMonth() + 1, 0));
}
function firstDayTwoMonthsAgo(): string {
  const n = new Date();
  return ymd(new Date(n.getFullYear(), n.getMonth() - 2, 1));
}

test.describe(
  "管理画面 > 日別/月別集計（集計一覧表示）",
  { tag: ["@admin", "@analysis", "@summary"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M12-01-030 未ログインで日別集計URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/analysis/summary/daily`);
      await expect(page).toHaveURL(LOGIN_RE); // 権限: 未ログイン管理者はアクセス不可
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M12-01-031 未ログインで月別集計URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/analysis/summary/monthly`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== ログイン必須（SEED-M12-ADMIN） =====

    test("E2E-M12-01-032 ログイン済み管理者は日別集計画面を閲覧できる（権限・認可 正常系）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M12-ADMIN）");
      await login(page);
      const summary = new AnalyticsSalesDailyMonthlySummaryPage(page);
      await summary.gotoDaily();
      await expect(page).not.toHaveURL(LOGIN_RE);
      await expect(summary.searchForm).toBeVisible();
    });

    test("E2E-M12-01-033 ログイン済み管理者は月別集計画面を閲覧できる（権限・認可 正常系・032の月別対）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M12-ADMIN）");
      await login(page);
      const summary = new AnalyticsSalesDailyMonthlySummaryPage(page);
      await summary.gotoMonthly();
      await expect(page).not.toHaveURL(LOGIN_RE);
      await expect(summary.searchForm).toBeVisible();
    });

    test("E2E-M12-01-001 日別集計画面に検索フォーム（集計タイプ・集計日・検索ボタン）が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M12-ADMIN）");
      await login(page);
      const summary = new AnalyticsSalesDailyMonthlySummaryPage(page);
      await summary.gotoDaily();
      await summary.seeSearchForm();
    });

    test("E2E-M12-01-002 初期表示では集計結果一覧が表示されない（集計結果は空）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M12-ADMIN）");
      await login(page);
      const summary = new AnalyticsSalesDailyMonthlySummaryPage(page);
      await summary.gotoDaily();
      await summary.expectNoResultList(); // 初期表示は集計結果を出さない
    });

    test("E2E-M12-01-003 日別集計エントリで集計タイプ既定が「日次」", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M12-ADMIN）");
      await login(page);
      const summary = new AnalyticsSalesDailyMonthlySummaryPage(page);
      await summary.gotoDaily();
      expect(await summary.checkedSummaryType()).toBe("daily"); // 入口daily→日次
    });

    test("E2E-M12-01-004 月別集計エントリで集計タイプ既定が「月次」", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M12-ADMIN）");
      await login(page);
      const summary = new AnalyticsSalesDailyMonthlySummaryPage(page);
      await summary.gotoMonthly();
      expect(await summary.checkedSummaryType()).toBe("monthly"); // 入口monthly→月次
    });

    test("E2E-M12-01-005 日別集計エントリの集計日既定が当月初日〜当月末日", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M12-ADMIN）");
      await login(page);
      const summary = new AnalyticsSalesDailyMonthlySummaryPage(page);
      await summary.gotoDaily();
      expect(await summary.dateFromValue()).toBe(firstDayThisMonth()); // 仕様: 集計日Fromは当月初日
      expect(await summary.dateToValue()).toBe(lastDayThisMonth()); // 仕様: 集計日Toは当月末日
    });

    test("E2E-M12-01-006 月別集計エントリの集計日既定が2か月前初日〜当月末日", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M12-ADMIN）");
      await login(page);
      const summary = new AnalyticsSalesDailyMonthlySummaryPage(page);
      await summary.gotoMonthly();
      expect(await summary.dateFromValue()).toBe(firstDayTwoMonthsAgo()); // 仕様: 2か月前へ繰り上げ
      // 仕様: 集計日Toは当月末日。実装は当月初日のため当該行は失敗で乖離を検出する見込み（付帯表4 #2）。
      expect(await summary.dateToValue()).toBe(lastDayThisMonth());
    });

    test("E2E-M12-01-020 集計日From未入力で検索すると集計結果が表示されない（必須）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M12-ADMIN）");
      await login(page);
      const summary = new AnalyticsSalesDailyMonthlySummaryPage(page);
      await summary.gotoDaily();
      await summary.clearDateFrom();
      await summary.submitSearch();
      // 仕様(必須・集計されない)由来の観測: 集計結果一覧が出ず、かつ検索フォームのまま留まる。
      // 必須未入力では集計実行(result)へ到達しないこと（HTML5抑止/サーバ検証いずれでも結果が出ない）。
      await expect(page).not.toHaveURL(RESULT_RE);
      await expect(summary.searchForm).toBeVisible();
      await summary.expectNoResultList(); // 集計日Fromは必須=集計されない
    });

    test("E2E-M12-01-021 集計日To未入力で検索すると集計結果が表示されない（必須）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M12-ADMIN）");
      await login(page);
      const summary = new AnalyticsSalesDailyMonthlySummaryPage(page);
      await summary.gotoDaily();
      await summary.clearDateTo();
      await summary.submitSearch();
      await expect(page).not.toHaveURL(RESULT_RE); // 必須未入力では集計実行へ到達しない
      await expect(summary.searchForm).toBeVisible();
      await summary.expectNoResultList(); // 集計日Toは必須=集計されない
    });

    // ===== 集計実行・結果一覧（SEED-M12-ADMIN ＋ SEED-M12-ORDERS） =====

    test("E2E-M12-01-010 検索ボタン押下で同一画面に集計結果一覧が表示される（正常系）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M12-ADMIN）");
      test.skip(!HAS_ORDERS, "SEED_M12_ORDERS 未設定（対象期間の受注データが必要）");
      await login(page);
      const summary = new AnalyticsSalesDailyMonthlySummaryPage(page);
      await summary.gotoDaily();
      await summary.submitSearch();
      await expect(page).toHaveURL(RESULT_RE); // POST result（同一画面）
      await summary.seeResultList(); // 集計結果一覧と合計行を表示
    });

    test("E2E-M12-01-011 集計結果一覧の最終行に合計行（総合計）が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M12-ADMIN）");
      test.skip(!HAS_ORDERS, "SEED_M12_ORDERS 未設定（対象期間の受注データが必要）");
      await login(page);
      const summary = new AnalyticsSalesDailyMonthlySummaryPage(page);
      await summary.gotoDaily();
      await summary.submitSearch();
      await expect(summary.resultDateHeader).toBeVisible(); // 日付列見出し「集計日」
      await expect(summary.grandTotalCell).toBeVisible(); // 仕様: 最終行に合計行
    });

    test("E2E-M12-01-012 集計結果表示時にCSVダウンロード操作部が表示される（CSV内容はM12-02）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M12-ADMIN）");
      test.skip(!HAS_ORDERS, "SEED_M12_ORDERS 未設定（対象期間の受注データが必要）");
      await login(page);
      const summary = new AnalyticsSalesDailyMonthlySummaryPage(page);
      await summary.gotoDaily();
      await summary.submitSearch();
      await expect(summary.csvDownloadLink).toBeVisible(); // 画面遷移: CSVダウンロードはM12-02で内容検証
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M12-01-022 集計タイプ未選択で検索すると集計されない（要実機: 必須ラジオの未選択化手順）",
      async () => {
        // 期待は仕様(バリデーション: 集計タイプは必須選択)由来。既定でいずれかが選択済みのため、
        // 未選択状態の作成手順（DOM操作 or リクエスト改変）を実機確認後に実装する。
      }
    );

    test.fixme(
      "E2E-M12-01-023 集計日に無効な書式を入力して検索すると集計されない（バリデーション 異常系・要実機: HTML5 date入力の書式抑止確認）",
      async () => {
        // 期待は仕様(バリデーション: 日付項目に無効な書式の値が入力された場合エラー＝集計されない)由来（観点表 No.22）。
        // 正常系(有効書式の日付で集計実行)は 005(既定値=有効日付) / 010(検索実行) が対を成す。
        // 刷新先は DateType single_text=HTML5 <input type=date> のため任意文字列を入力できず、未選択化と同様に
        // 入力手順の実機確認が要る。書式抑止の観測方法（typeで非date化 or リクエスト改変）確定後に実装する。
      }
    );

    test.fixme(
      "E2E-M12-01-050 商品名(日/英)・商品コードの絞り込み入力欄が表示される（仕様乖離=移行設計で要確認・付帯表4#1）",
      async () => {
        // 期待は仕様(入力項目: フォームキー multi)由来。刷新先 ec-cube-enterprise の本画面に該当入力欄が無いため、
        // セレクタを創作せず fixme で保持。移行設計での扱い確定後に実装/対象外を決定する。
      }
    );

    test.fixme(
      "E2E-M12-01-051 利用端末（device_type）チェックボックスが表示される（仕様乖離=移行設計で要確認・付帯表4#1）",
      async () => {
        // 期待は仕様(入力項目: フォームキー device_type)由来。刷新先は集計対象=通販/店舗別フィルタのみで device_type が無い。
      }
    );

    test.fixme(
      "E2E-M12-01-052 表示項目（注文 columns_order / 明細 columns_product）チェックボックスが表示される（仕様乖離・付帯表4#1）",
      async () => {
        // 期待は仕様(入力項目: columns_order / columns_product と「全て選択」)由来。刷新先は集計列が固定で表示項目選択を持たない。
      }
    );

    test.fixme(
      "E2E-M12-01-053 集計結果列に来客数・注文・リピート注文数・会員数・購買率(%)が並ぶ（仕様乖離=移行設計で要確認・付帯表4#3）",
      async () => {
        // 期待は仕様(フロント挙動 表示要素 / 集計条件)由来。刷新先の集計列は店舗名・総売上・原価・粗利益高・販売点数 等で別設計のため、
        // 当該列は出現しない見込み。移行設計で集計指標の対応を確定後に実装/対象外を決定する。
      }
    );

    test.fixme(
      "E2E-M12-01-024 集計日Toに無効な書式を入力して検索すると集計されない（バリデーション 異常系・要実機: HTML5 date入力の書式抑止確認・023のTo側対）",
      async () => {
        // 期待は仕様(バリデーション: 集計日To 必須・日付形式)由来。From異常系は023、正常系の有効書式は006/010が対。
        // 刷新先は DateType single_text=HTML5 <input type=date> のため任意文字列を入力できず、書式抑止の観測方法を実機確認後に実装する。
      }
    );

    test.fixme(
      "E2E-M12-01-054 表示項目を未選択で検索すると集計結果が日付列のみになる（エッジ・仕様乖離=移行設計で要確認・付帯表4#1/#3）",
      async () => {
        // 期待は仕様(エッジケース: 表示項目未選択→日付列のみ)由来。刷新先は表示項目選択を持たず未選択状態を作れないため fixme。
        // 053(表示項目選択時の列)の対となる正常系エッジ。移行設計で表示項目選択の扱い確定後に実装/対象外を決定する。
      }
    );

    test.fixme(
      "E2E-M12-01-055 商品名/商品コードの部分一致で商品別集計が絞り込まれる（業務ルール・仕様乖離=移行設計で要確認・付帯表4#1）",
      async () => {
        // 期待は仕様(業務ルール: 入力語を空白・カンマで分割し商品コードまたは商品名の部分一致で商品別集計対象とする)由来。
        // 刷新先 ec-cube-enterprise に該当入力(フォームキー multi)が無いため fixme。移行設計でフィルタ要件確定後に実装/対象外を決定する。
      }
    );

    test.fixme(
      "E2E-M12-01-060 表示項目「全て選択」で配下チェックボックスが一括切替される（JS・仕様乖離=移行設計で要確認・付帯表4#1）",
      async () => {
        // 期待は仕様(JS挙動: 「全て選択」チェックで配下のチェックボックスを一括切替)由来。
        // 刷新先は表示項目選択(columns_*)を持たないため該当部品が無く fixme。移行設計で確定後に実装/対象外を決定する。
      }
    );
  }
);
