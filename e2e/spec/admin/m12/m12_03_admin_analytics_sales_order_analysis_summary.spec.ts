/**
 * 管理画面 受注/売上分析（集計一覧表示）E2E。
 * 納品ケース表 integration_test/e2e/m12_03_admin_analytics_sales_order_analysis_summary_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装する（手動/間接/対象外はケース表 付帯表2/2b で全量管理＝specに大量fixmeを残さない）。
 * 期待結果は仕様(functions/pf-eccube3/m12-03_..._summary.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 *   設計(pf-eccube3)は旧システムのリバースであり、刷新先(ec-cube-enterprise)との乖離は付帯表4(不具合候補)に出す。
 *   ブラウザで観測する UI 文言は刷新先 sales.twig の trans 値だが、合否の意味は設計の初期値・挙動(注文日/商品/昇順/0件見出し等)に一致。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行方針（安全第一・共有ステージング・本機能は参照のみで非破壊）:
 *  - 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（未ログイン誘導の030のみ資格情報不要）。
 *  - 集計結果テーブルの行表示（商品/カテゴリ列・合計行・CSVリンク）は集計対象レコード(SEED)に依存するため test.fixme。
 *  - 集計数値・割合・表示件数の厳密打ち切り・絞り込みの含む/含まないはDB件数依存＝ケース表で手動/間接管理。
 *
 * 資格情報（環境変数。コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AnalyticsSalesOrderAnalysisSummaryPage } from "../../../pages/admin/m12/m12_03_admin_analytics_sales_order_analysis_summary.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const NO_RESULT = "検索条件に合致するデータが見つかりませんでした"; // :1542 0件見出し
const LOGIN_RE = /\/login(\?|$)/;
const SALES_RE = /\/analysis\/sales(\?|$)/;

/** 管理ログインして受注/売上分析の初期検索画面を開く。 */
async function gotoSummary(page: Page): Promise<AnalyticsSalesOrderAnalysisSummaryPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const target = new AnalyticsSalesOrderAnalysisSummaryPage(page);
  await target.goto();
  return target;
}

test.describe("管理画面 > 受注/売上分析（集計一覧表示）", { tag: ["@admin", "@analysis"] }, () => {
  // ===== 権限・認可（資格情報不要） =====

  test("E2E-M12-03-030 未ログインで受注/売上分析URL→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/analysis/sales`);
    await expect(page.locator("#login_id")).toBeVisible(); // 権限・認可: 未ログインは閲覧不可→ログイン誘導
    await expect(page).toHaveURL(LOGIN_RE);
  });

  // ===== 初期表示・UI部品（要ログイン） =====

  test("E2E-M12-03-001 初期表示: 検索フォーム（汎用ワード欄・詳細検索枠・検索ボタン）が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const s = await gotoSummary(page);
    await s.seeSearchForm();
  });

  test("E2E-M12-03-002 初期表示: 検索条件の主要入力項目が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const s = await gotoSummary(page);
    await expect(s.summaryDateFrom).toBeVisible();
    await expect(s.summaryDateTo).toBeVisible();
    await expect(s.dateTypeRadio("order_date")).toBeAttached(); // 使用日付ラジオ
    await expect(s.summaryType).toBeVisible(); // 集計単位
    await expect(s.sortKey).toBeVisible(); // 並べ替え
    await expect(s.ascDescRadio("ASC")).toBeAttached(); // 昇順/降順
    await expect(s.pageCount).toBeVisible(); // 表示件数
    await expect(s.categoryId).toBeVisible(); // カテゴリ
    await expect(s.priceFrom).toBeVisible(); // 平均単価From
    await expect(s.priceTo).toBeVisible(); // 平均単価To
    await expect(s.quantityFrom).toBeVisible(); // 数量From
    await expect(s.quantityTo).toBeVisible(); // 数量To
    // 状態(card_condition)・売上分析タグ・カードセットは設計の入力項目。select2/チェックは表示加工されるため存在(attached)で確認。
    await expect(s.cardCondition).toBeAttached(); // 状態
    await expect(s.tagSalesAnalysis).toBeAttached(); // 売上分析タグ（select2で原select非表示）
    await expect(s.cardset).toBeAttached(); // カードセット（select2で原select非表示）
    // 注: 設計の 都道府県/性別/誕生日From-To/利用端末 は刷新先に部品なし＝部品不在（不具合候補#3）。
  });

  test("E2E-M12-03-003 初期表示: 使用日付の既定が「注文日(order_date)」で選択されている", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const s = await gotoSummary(page);
    await expect(s.dateTypeRadio("order_date")).toBeChecked(); // 設計 初期値=注文日
  });

  test("E2E-M12-03-004 初期表示: 集計単位の既定が「商品(product_id)」で選択されている", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const s = await gotoSummary(page);
    await expect(s.summaryType).toHaveValue("product_id"); // 設計 初期値=商品
  });

  test("E2E-M12-03-005 初期表示: 並び順の既定が「昇順(ASC)」で選択されている", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const s = await gotoSummary(page);
    await expect(s.ascDescRadio("ASC")).toBeChecked(); // 設計 初期値=昇順
  });

  test("E2E-M12-03-006 初期表示: 集計日From/Toに当月相当の日時が初期設定される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const s = await gotoSummary(page);
    // 当月を「ローカル時刻」で算出（toISOString=UTC基準だとAsia/Tokyoの月境界で誤判定するため避ける）。
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth(); // 0-based
    const ym = `${y}-${String(m + 1).padStart(2, "0")}`; // 当月 YYYY-MM
    const lastDay = String(new Date(y, m + 1, 0).getDate()).padStart(2, "0"); // 当月末日
    await expect(s.summaryDateFrom).not.toHaveValue(""); // 設計 初期値=当月初日
    await expect(s.summaryDateTo).not.toHaveValue(""); // 設計 初期値=当月末日相当
    // 設計: From=当月初日 / To=当月末日。時刻表現(00:00:00 / 23:59:59)の厳密一致は要実機確認(付帯表4 #6)。
    await expect(s.summaryDateFrom).toHaveValue(new RegExp(`^${ym}-01`));
    await expect(s.summaryDateTo).toHaveValue(new RegExp(`^${ym}-${lastDay}`));
  });

  test("E2E-M12-03-007 初期表示: 並べ替えの既定が「集計単位(summary_type)」で選択されている", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const s = await gotoSummary(page);
    await expect(s.sortKey).toHaveValue("summary_type"); // 設計 初期値=並べ替え:集計単位（L137）
  });

  // ===== 集計実行・結果表示（要ログイン） =====

  test("E2E-M12-03-010 検索ボタン押下で同一画面に集計結果セクション（件数表示）が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const s = await gotoSummary(page);
    await s.submitSearch();
    // 設計は「集計実行で同一画面に結果」。設計上のパス名 /result も刷新先の /search も、
    // パス名自体は実装由来オラクル（不具合候補#1）なので固定しない。集計実行サブアクションへ遷移したことのみ確認。
    await expect(page).toHaveURL(/\/analysis\/sales\//);
    await expect(s.resultCount).toBeVisible(); // searched=true で結果件数セクションが表示（＝同一画面に集計結果）
  });

  test("E2E-M12-03-013 集計対象0件で「データが見つかりませんでした」見出しが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const s = await gotoSummary(page);
    // 一致しないユニーク語＋過去日で確実に0件にする（集計対象が0件＝エッジケース）。
    await s.multi.fill(`__e2e_no_hit_${Date.now()}__`);
    await s.summaryDateFrom.fill("2000-01-01T00:00:00");
    await s.summaryDateTo.fill("2000-01-02T00:00:00");
    await s.submitSearch();
    await expect(s.noResultHeading).toBeVisible();
    await expect(page.getByText(NO_RESULT)).toBeVisible();
  });

  test("E2E-M12-03-016 「検索条件をクリア」で初期状態の検索画面へ戻る", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const s = await gotoSummary(page);
    await s.multi.fill("dummy");
    await s.submitSearch();
    await s.searchClearLink.click();
    await expect(page).toHaveURL(SALES_RE); // admin_analysis_sales（初期表示）へ
    await expect(s.resultCount).toHaveCount(0); // 結果セクションが無い初期状態
    await expect(s.dateTypeRadio("order_date")).toBeChecked(); // 既定値に戻る
  });

  // ===== 異常系（数値項目の検証・要ログイン） =====

  test.fixme(
    "E2E-M12-03-020 平均単価Fromに数値以外を入力して検索すると集計結果が表示されない（要確認: number入力で非数値が入力不可）",
    async () => {
      // 期待は仕様(数値バリデーションで集計結果一覧が表示されない／IT-22 数値)由来。
      // 要確認(不具合候補#9): 刷新先の平均単価/数量は IntegerType=<input type="number"> で、
      // ブラウザが非数値入力を破棄するため UI から非数値を送信できず、設計の「数値バリデーション(サーバ側エラー)」
      // を UI で観測できない。テストは設計どおりの期待のまま保留（実装へ寄せない）。
      // DOM 直接書込み等で送信を強制するのは実装依存の迂回となるため自動化しない＝手動/要確認で管理。
    }
  );

  // ===== URL直接アクセス（要ログイン） =====

  test("E2E-M12-03-031 ログイン済みで受注/売上分析URLを直接GETすると初期検索画面が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const s = await gotoSummary(page);
    await expect(page).toHaveURL(SALES_RE);
    await expect(s.searchForm).toBeVisible();
    await expect(s.resultCount).toHaveCount(0); // 直接GETは searched=false で結果なし
  });

  // ===== 結果テーブルの内容（集計対象データ=SEED 依存のため保留） =====

  test.fixme(
    "E2E-M12-03-011 集計単位=商品で検索すると結果に商品コード列・商品名列が表示される（要: 集計対象レコード）",
    async () => {
      // 期待は仕様(集計単位=商品→商品コード/商品名列 sales.twig:271-272)由来。結果行が出るSEED投入後に実装。
    }
  );

  test.fixme(
    "E2E-M12-03-012 集計単位=カテゴリで検索すると結果にカテゴリ列が表示され商品コード列を出さない（要: 集計対象レコード）",
    async () => {
      // 期待は仕様(集計単位=カテゴリ→カテゴリ列 sales.twig:269)由来。
    }
  );

  test.fixme(
    "E2E-M12-03-014 集計結果に合計行が表示される（要: 集計対象レコード／合算値はDB依存で手動）",
    async () => {
      // 期待は仕様(合計行=数量・合計・件数の合算 sales.twig:295-302)由来。presenceのみ自動化対象。
    }
  );

  test.fixme(
    "E2E-M12-03-015 集計結果に「CSVダウンロード」リンクが表示される（要: 集計対象レコード／内容はM12-04）",
    async () => {
      // 期待は仕様(結果ありで CSV ダウンロード導線 sales.twig:260)由来。リンク存在のみ。
    }
  );

  test.fixme(
    "E2E-M12-03-040 汎用ワードで絞り込むと条件に応じた集計結果が表示される（要: 既知商品名のSEED／厳密件数は間接）",
    async () => {
      // 期待は仕様(絞り込み multi で対応条件を追加 設計 集計条件・絞り込み)由来。一致/不一致のSEED後に実装。
    }
  );
});
