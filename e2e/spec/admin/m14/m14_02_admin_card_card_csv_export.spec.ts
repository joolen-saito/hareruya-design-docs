/**
 * 管理画面 カード管理「カード情報CSV出力」E2E（M14-02・未実行雛形）。
 * 納品ケース表 integration_test/e2e/m14_02_admin_card_card_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 本specには「E2E自動化」ケース（実装済み）と、自動化予定だが未実装/要実機の test.fixme のみを残す。
 * CSV各列の値・見出し・並び順・BOM/文字コード・選択順保持・ログ出力（カードCSV出力ファイル名）・DB検索（別機能m14-01へ委譲）は
 * ケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m14-02_admin_card_card_csv_export.md / 観点表)由来（オラクル独立性）。
 * 設計源は pf-eccube3 / HareruyaEc プラグインのリバースだが、基本設計/観点表を上位オラクルとし、
 * 刷新先 ec-cube-enterprise に当該画面の存在を確認済み（一覧 admin_card_list=GET/POST /<route>/card：CardController.php:64 /
 * 出力 admin_card_export_csv=POST /<route>/card/export_csv：CardCsvController.php:143 / 「CSV出力」ボタン index.twig:346-352）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 重要（設計源と刷新先の乖離・ケース表 付帯表4）:
 *  - 出力URLは設計 /card/csvexport ではなく /card/export_csv（#1）。
 *  - 設計「CSRFトークンは付かない」に対し実装は csrf_token_for_anchor＋isTokenValid で CSRF 強制（#2＝基本設計上は妥当）。
 *  - 全選択は設計 #allCheck ではなく #chose_all（#3）。
 *  - 未選択時は設計の server flash ではなく JS alert でクライアント側ブロック（#4）。
 *  テストは主観測（出力可否＝ダウンロード発火/不発・遷移URL・応答ヘッダ）で仕様どおりに書き、文言差の影響を避ける。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の
 * spec/admin/login.spec.ts・two_factor_auth.spec.ts も @playwright/test を直接使う。本specもこれに倣い
 * @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行ガード:
 *  - ログインが要るケースは ECCUBE_ADMIN_USER/PASS（config/default.config.ts）が無ければ test.skip。
 *  - 検索結果（一覧の行・CSV出力ボタン）の出現には検索ヒットするカードのシードが必要（SEED-M14-02-CARDS）。SEED_M14_CARDS=1 でガード解除。
 *  - 未認証ガード（030）は資格情報不要。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { CardCardCsvExportPage } from "../../../pages/admin/m14/m14_02_admin_card_card_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// 検索ヒットするカードのシードが入っているか（一覧の行・CSV出力ボタンの出現に必要）。
const HAS_CARDS = process.env.SEED_M14_CARDS === "1";

// 期待値は設計書「ファイル名は接頭辞 cards_ と日時 YmdHis と拡張子 .csv」(処理フロー#10) 由来。
// 実装に合わせて変えない（オラクル独立性）。日時は出力時刻で動的のため正規表現照合。
const FILENAME_RE = /^cards_\d{14}\.csv$/;
const SEARCH_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/card/search`);
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$|/)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 カード管理 > カード情報CSV出力",
  { tag: ["@admin", "@card", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M14-02-030 未ログインでカード一覧URL→管理ログイン画面へ誘導（出力起点へ到達できない）", async ({
      page,
    }) => {
      const p = new CardCardCsvExportPage(page);
      await p.gotoList();
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可: 未ログインは当パスへ到達できない
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M14-02-031 未ログインで出力POSTパスへ直接POST→管理ログインへ誘導しCSVを出力しない", async ({
      page,
    }) => {
      const p = new CardCardCsvExportPage(page);
      // 出力起点GET（030）に対する出力POSTパス自体の未認証ガード（正常×異常の対）。
      // 未ログイン context のため request はセッション無し＝管理画面共通認証で遮断される。
      // 期待は仕様「権限・認可: 未ログインは当パスへ到達できない」由来。トークンは未保有のため空。
      const res = await p.postExport(["1"], "", 0);
      // 主観測: CSVストリーム(200/text/csv)を返さず、管理ログインへリダイレクトする。
      expect(res.status()).toBe(302); // CSV(200)ではなくリダイレクト
      expect(res.headers()["location"]).toMatch(LOGIN_RE); // 管理ログイン画面へ誘導
      expect(res.headers()["content-type"] ?? "").not.toContain("text/csv"); // CSVは出力されない
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      // --- 検索結果0件（シード不要・検索操作で0件を作る） ---

      test("E2E-M14-02-025 検索結果0件のとき「CSV出力」ボタンが表示されない", async ({ page }) => {
        await login(page);
        const p = new CardCardCsvExportPage(page);
        // ヒットしないキーワードで検索＝結果ボックスにボタンを置かない（利用者視点の入口）。
        await p.searchNoResult("__e2e_no_hit_keyword_zzz__");
        await expect(p.csvExportButton).toHaveCount(0);
      });

      // --- 検索結果あり（SEED-M14-02-CARDS） ---

      test.describe(() => {
        test.skip(!HAS_CARDS, "SEED-M14-02-CARDS 未投入（SEED_M14_CARDS=1 で有効化）");

        test("E2E-M14-02-001 検索結果があるとき結果ボックスに「CSV出力」ボタンが表示される", async ({
          page,
        }) => {
          await login(page);
          const p = new CardCardCsvExportPage(page);
          await p.searchAll();
          await p.seeExportButton(); // totalItemCount>0 のときだけ描画される
        });

        test("E2E-M14-02-002 各行に cardIds[] チェックボックスが表示される", async ({ page }) => {
          await login(page);
          const p = new CardCardCsvExportPage(page);
          await p.searchAll();
          expect(await p.rowCheckboxes.count()).toBeGreaterThan(0);
        });

        test("E2E-M14-02-003 全選択チェック（#chose_all）で全行のチェックがONになる", async ({ page }) => {
          await login(page);
          const p = new CardCardCsvExportPage(page);
          await p.searchAll();
          await p.checkAll();
          const total = await p.rowCheckboxes.count();
          const checked = await p.rowCheckboxes.evaluateAll(
            (els) => els.filter((e) => (e as HTMLInputElement).checked).length
          );
          expect(checked).toBe(total); // 全行が選択される（フロント挙動: 表頭チェックで一括ON）
        });

        test("E2E-M14-02-013 「CSV出力」に出力前の確認ダイアログ（モーダル）が無い", async ({ page }) => {
          await login(page);
          const p = new CardCardCsvExportPage(page);
          await p.searchAll();
          // フロント挙動「出力前の確認ダイアログはない」: モーダル起動属性も実行確認属性も持たない。
          await expect(p.csvExportButton).not.toHaveAttribute("data-bs-toggle", "modal");
          await expect(p.csvExportButton).not.toHaveAttribute("data-confirm", /.+/);
        });

        test("E2E-M14-02-010 カードを選択し「CSV出力」押下でCSVダウンロードが発火する", async ({ page }) => {
          await login(page);
          const p = new CardCardCsvExportPage(page);
          await p.searchAll();
          await p.checkFirstCard();
          const download = await p.exportSelected();
          expect(download).toBeTruthy(); // 選択IDがPOSTされCSVがダウンロードされる（出力成功）
        });

        test("E2E-M14-02-011 ダウンロードファイル名が cards_<日時>.csv 形式である", async ({ page }) => {
          await login(page);
          const p = new CardCardCsvExportPage(page);
          await p.searchAll();
          await p.checkFirstCard();
          const download = await p.exportSelected();
          expect(download.suggestedFilename()).toMatch(FILENAME_RE);
        });

        test("E2E-M14-02-012 エクスポート応答が text/csv + attachment のHTTPヘッダを返す", async ({
          page,
        }) => {
          await login(page);
          const p = new CardCardCsvExportPage(page);
          await p.searchAll();
          const id = await p.readFirstCardId();
          const token = await p.readCsrfToken(); // CSV出力ボタンの token-for-anchor（_token 値）
          const res = await p.postExport([id], token);
          expect(res.status()).toBe(200);
          const headers = res.headers();
          expect(headers["content-type"]).toContain("text/csv");
          expect(headers["content-disposition"]).toContain("attachment");
          expect(headers["content-disposition"]).toMatch(/filename=cards_\d{14}\.csv/);
        });

        test("E2E-M14-02-020 未選択で「CSV出力」を押すとCSVが出力されず一覧に留まる", async ({ page }) => {
          await login(page);
          const p = new CardCardCsvExportPage(page);
          await p.searchAll();
          // 主観測（仕様・観点表 IT-22 必須/IT-27 出力失敗由来）: 未選択では出力されない＝一覧に滞留しダウンロード非発火。
          let downloaded = false;
          page.on("download", () => {
            downloaded = true;
          });
          // クリックで送信を試みる。刷新先JSが alert で中止するのは実装由来のため、その有無/文言は
          // 期待値（オラクル）にしない。dismiss して画面を進めず、主観測のみ判定する。
          await p.exportWithoutSelection();
          // 主観測（仕様由来）: 未選択ではCSVが出力されず、一覧（出力起点）に留まる。
          expect(downloaded).toBe(false); // CSVは出力されない
          await expect(p.csvExportButton).toBeVisible(); // 一覧（出力起点）に留まる
          // サーバ側の空配列ガード（処理フロー#5）は E2E-022 で直接POSTして検証する。
        });

        test("E2E-M14-02-021 存在しないカードIDで出力すると検索一覧へリダイレクトし出力されない", async ({
          page,
        }) => {
          await login(page);
          const p = new CardCardCsvExportPage(page);
          await p.searchAll();
          const token = await p.readCsrfToken();
          // 全IDが存在しない＝設計「残りが空ならエラー」・実装 not_registered 双方でエラー＝出力されずリダイレクト。
          const res = await p.postExport(["999999999"], token, 0);
          expect(res.status()).toBe(302); // CSVストリーム(200)ではなくリダイレクト
          expect(res.headers()["location"]).toMatch(SEARCH_RE); // 検索一覧（admin_card_search）へ戻す
        });

        test("E2E-M14-02-022 cardIds空配列の出力POSTはCSVを返さず検索一覧へリダイレクトする", async ({
          page,
        }) => {
          await login(page);
          const p = new CardCardCsvExportPage(page);
          await p.searchAll();
          const token = await p.readCsrfToken();
          // 設計 処理フロー#5: cardIds が empty のときフラッシュ＋ m14-01（検索一覧）へリダイレクト。
          // トークンは CSRF を切り分けるための搬送手段で、空配列ガードを主観測する（トークン値は判定しない）。
          const res = await p.postExport([], token, 0);
          expect(res.status()).toBe(302); // CSVストリーム(200)を返さない
          expect(res.headers()["location"]).toMatch(SEARCH_RE); // 検索一覧へ戻す（出力されない）
        });
      });
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M14-02-040 出力POSTのCSRFトークン欠落時の挙動（仕様矛盾のため要確認）",
      async () => {
        // 設計書フロント挙動は「CSV出力にもCSRFトークンフィールドは付かない」と明記し、トークン欠落でも
        // 出力経路が成立しうる。一方で観点表/基本設計は CSRF 保護を要求する（付帯表4 #2）。両者が矛盾するため、
        // 特定の保護結果（403/リダイレクト/出力）を期待値に固定しない（オラクル混入回避）。
        // 仕様確定後に、トークン欠落POSTの応答を実機確認して期待値を確定し実装する＝要確認。
      }
    );

    test.fixme(
      "E2E-M14-02-023 存在ID＋不存在ID混在の出力は設計上は存在分のCSVを出力する（実装は一律エラー＝要確認）",
      async () => {
        // 期待は設計書データ整合性「DB に無い ID は静かに無視され、残りが空ならエラー」由来＝部分欠落では
        // 存在分の CSV（200/text/csv）が出力される。実装は取得件数不一致で一律 not_registered エラー→302
        // （付帯表4 #5）のため挙動が乖離する。仕様/実装どちらに合わせるか確定後に実装する＝要確認。
        // 例: const res = await p.postExport([existingId, "999999999"], token, 0); expect(res.status()).toBe(200);
      }
    );
  }
);
