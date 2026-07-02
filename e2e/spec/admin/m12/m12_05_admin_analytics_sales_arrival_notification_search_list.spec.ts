/**
 * 管理画面 分析・集計 > 入荷通知依頼 一覧表示（M12-05）E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m12_05_admin_analytics_sales_arrival_notification_search_list_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち非破壊で安全に実行できるケースを test() で実装する。
 * 厳密件数・該当行表示・依頼日範囲・表示件数打ち切り・CSV起点・multi該当検索・販売金額範囲・売上分析タグ絞り込み・並べ替え結果順は要シード(SEED-M12-05-REQUEST)のため test.fixme（理由付き）で残す。
 * 手動/対象外（会員名/購入日/購入状況/行操作=刷新先に部品無し、DB内部結合、セッション保存、DB障害誘発等）はケース表で全量管理しspecに残さない（規約）。
 * 期待結果は仕様（正本 functions/pf-eccube3/m12-05_..._search_list.md／観点表／基本設計）由来（オラクル独立性）。
 * 設計源は pf-eccube3（リバース）であり、刷新先 ec-cube-enterprise との乖離（URLパス・購入状況/購入日/会員名並替・行操作・集計粒度・フォームキー名）は
 * ケース表「付帯表4（不具合候補）」で管理し、テストは仕様どおりに書く（実装が違えば落ちて検出する）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証について: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / m11系）に倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報（ECCUBE_ADMIN_USER/PASS）が無ければ走らないよう test.skip(!HAS_CREDS) でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *
 * 実行方針（安全第一・共有ステージング・参照系）:
 *  - 本機能は参照系（検索のみ・DB更新なし）のため、表示/検索/0件確認は非破壊で安全に実行できる。
 *
 * 環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）。2FA OFFのテスト用アカウント推奨。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AnalyticsSalesArrivalNotificationSearchListPage } from "../../../pages/admin/m12/m12_05_admin_analytics_sales_arrival_notification_search_list.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);

/** 管理ログインしてから入荷通知依頼一覧画面を開く。 */
async function gotoListAsAdmin(
  page: Page
): Promise<AnalyticsSalesArrivalNotificationSearchListPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const list = new AnalyticsSalesArrivalNotificationSearchListPage(page);
  await list.goto();
  return list;
}

test.describe(
  "管理画面 > 分析・集計 > 入荷通知依頼 一覧表示",
  { tag: ["@admin", "@analysis"] },
  () => {
    // ===== 初期表示・UI部品（GET・非破壊） =====

    test("E2E-M12-05-001 初期表示で検索画面が表示され一覧が表示されない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      await expect(list.searchForm).toBeVisible(); // 検索フォーム表示（処理フロー 初期表示4）
      await expect(list.resultList).toHaveCount(0); // 一覧は無し
    });

    test("E2E-M12-05-002 初期表示で依頼日に当月初日〜当月末日・並び順昇順が初期設定される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      // 仕様: 依頼日Fromに当月初日、Toに当月末日、並び順は昇順（処理フロー 初期表示3）。
      // 期待値は仕様（当月初日/末日）由来でテスト側で独立算出する（実装の既定値を正としない）。
      // 日付は type=date の HTML標準書式 yyyy-mm-dd で観測する（実装固有の整形ではない）。
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const lastDay = String(
        new Date(yyyy, now.getMonth() + 1, 0).getDate()
      ).padStart(2, "0");
      await expect(list.createDateFrom).toHaveValue(`${yyyy}-${mm}-01`); // 当月初日
      await expect(list.createDateTo).toHaveValue(`${yyyy}-${mm}-${lastDay}`); // 当月末日
      await expect(list.ascRadio).toBeChecked();
    });

    test("E2E-M12-05-003 検索フォームのUI部品が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      await list.seeSearchForm(); // 商品名/会員名・依頼日From/To・販売金額From/To・並べ替え・表示件数・検索ボタン
      await expect(list.tagSalesAnalysis).toBeAttached(); // 売上分析タグ（select2 で隠れる場合があるため attached で確認）
    });

    test("E2E-M12-05-004 検索条件のアコーディオン（詳細検索）が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      await expect(list.detailToggle).toBeVisible();
      await expect(list.detailBlock).toBeAttached();
    });

    // ===== 検索実行（POST・参照系で非破壊） =====

    test("E2E-M12-05-010 検索ボタン押下で同一画面に検索結果領域が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      await list.submitSearch();
      await expect(list.resultList).toBeVisible(); // 同一画面に一覧（検索結果領域）を表示（処理フロー 検索5）
    });

    test("E2E-M12-05-020 該当しない条件で検索すると0件見出しが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      // 実在しないキーワードで検索→該当データなし（エッジケース「検索結果が0件」）。
      await list.searchByKeyword("___no_such_request_zzz_99999___");
      await expect(list.emptyMessage).toBeVisible(); // 該当データが無い旨の見出し
    });

    test("E2E-M12-05-040 任意項目を未入力のまま検索しても検索が継続される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      await list.submitSearch(); // 任意項目は未入力（multi等）。既定の依頼日範囲のみ。
      await expect(list.resultList).toBeVisible(); // エラー無しで検索継続（入力項目=任意）
    });

    test("E2E-M12-05-042 販売金額に数値を入力して検索が成立する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      await list.searchByPriceFrom("100"); // 数値（バリデーション 数値 正常）
      await expect(list.resultList).toBeVisible();
    });

    test("E2E-M12-05-043 販売金額に非数値を入力すると検索が成立しない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      await list.searchByPriceFrom("abc"); // 非数値（バリデーション 数値 異常）
      await expect(list.resultList).toHaveCount(0); // 検索不成立＝検索結果領域は表示されない
    });

    test("E2E-M12-05-044 商品名/会員名欄に長文字列を入力しても検索が継続される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      await list.searchByKeyword("あ".repeat(255)); // 設計上フォーム上限なし＝継続
      await expect(list.resultList).toBeVisible();
    });

    // ===== 権限・認可（非破壊） =====

    test("E2E-M12-05-030 未ログインで一覧URLへ直接アクセスするとログイン画面へ誘導される", async ({
      page,
    }) => {
      // 認証不要（未ログイン状態を作るため資格情報ガード不要）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/analysis/product-request`);
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可: 未ログインはアクセス不可→ログイン誘導
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 保留（要シード/要実機。抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M12-05-011 該当データありの条件で検索すると一覧に該当行が表示される（要 SEED-M12-05-REQUEST）",
      async () => {
        // 期待は仕様(集計条件/IT-23)由来。既知の依頼日を持つ入荷通知依頼シード投入後に実装。
        // オラクルは仕様（依頼単位明細）由来とし、列＝商品コード/状態/在庫数/会員名/依頼日/購入日/通知日＋行操作の
        //   存在と行内容で判定する（実装の集計列＝商品ID/言語/商品名/通知待ち/削除カウントへ寄せない）。
        // 刷新先実装には会員名/購入日/通知日列・行操作が無いため、本シード実装時は仕様列で検証し落として検出する
        //   （付帯表4#5,#6）。集計列への期待値書き換えは行わない。
      }
    );

    test.fixme(
      "E2E-M12-05-012 検索結果ありのときCSVダウンロードのUIが利用可能になる（要 SEED-M12-05-REQUEST。CSV内容はM12-06/手動）",
      async () => {
        // 期待は仕様(画面遷移 CSVダウンロード押下/M12-06委譲)由来。該当データが返る条件をシード投入後に実装。
      }
    );

    test.fixme(
      "E2E-M12-05-021 依頼日From/Toの範囲外の依頼は一覧に含まれない（要 SEED-M12-05-REQUEST）",
      async () => {
        // 期待は仕様(集計条件 期間/IT-23)由来。範囲内/範囲外の既知依頼日シード投入後に実装。
      }
    );

    test.fixme(
      "E2E-M12-05-041 表示件数を選択して検索すると一覧が件数上限で打ち切られる（要 SEED-M12-05-REQUEST）",
      async () => {
        // 期待は仕様(業務ルール 表示件数の上限で打ち切る)由来。複数ページ分の依頼シード投入後に実装。
      }
    );

    test.fixme(
      "E2E-M12-05-013 商品名/会員名キーワードに合致する依頼が一覧に表示される（要 SEED-M12-05-REQUEST）",
      async () => {
        // 期待は仕様(入力項目 multi 部分一致絞り込み/IT-23)由来。
        // 既知の商品名/会員名/商品ID/規格コードに合致するキーワードで multi を検索し、該当依頼が一覧に出ることを判定する。
        // 0件キーワード(E2E-020)と対の正常系。オラクルは仕様の部分一致絞り込み由来とし、実装の集計列へ寄せない。
      }
    );

    test.fixme(
      "E2E-M12-05-022 販売金額From/Toの範囲で範囲内が含まれ範囲外が除外される（要 SEED-M12-05-REQUEST）",
      async () => {
        // 期待は仕様(集計条件 販売金額 price02 で絞り込む)由来。範囲内/範囲外の販売金額を持つ依頼シード投入後に実装。
      }
    );

    test.fixme(
      "E2E-M12-05-050 売上分析タグを指定するとそのタグに紐づく依頼に絞り込まれる（要 SEED-M12-05-REQUEST）",
      async () => {
        // 期待は仕様(集計条件 売上分析タグ＝商品サブのタグで絞り込む)由来。タグ一致/不一致の依頼シード投入後に実装。
      }
    );

    test.fixme(
      "E2E-M12-05-051 並べ替えと昇順/降順の指定で一覧の並び順が変わる（要 SEED-M12-05-REQUEST）",
      async () => {
        // 期待は仕様(集計条件 並べ替え＝商品名/販売金額を昇順/降順)由来。並べ替え対象列で異なる値を持つ依頼シード投入後に実装。
      }
    );
  }
);
