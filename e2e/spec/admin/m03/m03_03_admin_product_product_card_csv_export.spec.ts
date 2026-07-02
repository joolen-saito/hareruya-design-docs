/**
 * 管理画面 商品管理「カード商品CSV出力」E2E。
 * 納品ケース表 integration_test/e2e/m03_03_admin_product_product_card_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装し、シード/細工POSTが必要なものは test.fixme（理由付き）で残す。
 * 手動・対象外はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-03_admin_product_product_card_csv_export.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * ダウンロード成功・例外メッセージ系は「カード詳細＋規格を持つ商品」「カード詳細/規格を持たない商品」等の
 * シードや細工POSTが要るため test.fixme とし、ケース表のシード要件(付帯表3)で管理する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductCardCsvExportPage } from "../../../pages/admin/m03/m03_03_admin_product_product_card_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const MSG_NOT_SELECT = "1つ以上の商品を選択してください"; // :1769（responseNoProductIdError ProductCsvController.php:151）
const MSG_NOT_REGISTERED = "存在しないカードIDが含まれています。"; // :2244（admin.csv.error.export.not_registered）
const MSG_NO_CARD_DATA = "カードデータが存在しないためエクスポートできません。"; // :2246（admin.csv.error.export.no_card_data）

const PRODUCT_LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product(/page/\\d+)?(\\?|$)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 商品管理 > カード商品CSV出力",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

    // ===== UI部品（検索結果がある一覧） =====

    test("E2E-M03-03-010 検索結果が正のとき一覧に「カード商品CSV出力」ボタンが表示される", async ({ page }) => {
      await login(page);
      const p = new ProductProductCardCsvExportPage(page);
      await p.gotoList();
      await p.search(); // 全件検索で一覧ブロックを描画
      await expect(p.cardCsvButton).toBeVisible();
    });

    test("E2E-M03-03-011 各商品行に ids[] チェックボックスが表示される", async ({ page }) => {
      await login(page);
      const p = new ProductProductCardCsvExportPage(page);
      await p.gotoList();
      await p.search();
      await expect(p.checkboxes.first()).toBeVisible();
    });

    test("E2E-M03-03-012 表頭の全選択で商品チェックボックスが一括ONになる", async ({ page }) => {
      await login(page);
      const p = new ProductProductCardCsvExportPage(page);
      await p.gotoList();
      await p.search();
      await p.triggerCheckAll.check();
      await expect(p.checkboxes.first()).toBeChecked(); // JS index.twig:131-138
    });

    test("E2E-M03-03-013 検索結果0件のとき「カード商品CSV出力」ボタンが表示されない", async ({ page }) => {
      await login(page);
      const p = new ProductProductCardCsvExportPage(page);
      await p.gotoList();
      await p.searchNoResult("E2E-NO-SUCH-PRODUCT-" + Date.now());
      await expect(p.noResult).toBeVisible(); // 仕様: 件数0では一括フォーム/ボタン行が出ない
      await expect(p.cardCsvButton).toHaveCount(0);
    });

    test("E2E-M03-03-014 カード商品CSV出力ボタンは確認ダイアログを介さず送信される(type=submit)", async ({ page }) => {
      await login(page);
      const p = new ProductProductCardCsvExportPage(page);
      await p.gotoList();
      await p.search();
      // 仕様: 出力前の確認ダイアログは無く、type=submit のまま即送信される（一括公開のような未チェックalertは掛からない）。
      await expect(p.cardCsvButton).toHaveAttribute("type", "submit");
    });

    test("E2E-M03-03-015 表頭の全選択をON→OFFすると商品チェックボックスが一括解除される", async ({ page }) => {
      await login(page);
      const p = new ProductProductCardCsvExportPage(page);
      await p.gotoList();
      await p.search();
      await p.triggerCheckAll.check();
      await expect(p.checkboxes.first()).toBeChecked();
      await p.triggerCheckAll.uncheck();
      // 仕様: 全選択は「一括オンオフ」（index.twig:135-137 でチェック解除）。OFFで check_ が一括解除される。
      await expect(p.checkboxes.first()).not.toBeChecked();
    });

    test("E2E-M03-03-016 カード商品CSV出力ボタンの送信先が本ルート(formaction)である", async ({ page }) => {
      await login(page);
      const p = new ProductProductCardCsvExportPage(page);
      await p.gotoList();
      await p.search();
      // 仕様: 一括フォーム(form_bulk)の action は空で、カードCSVボタンだけ formaction で本ルート(POST 専用)へ送信する。
      // 期待は仕様(利用者視点の入口: POST /<route>/product/product_card_csv_export)由来。
      await expect(p.cardCsvButton).toHaveAttribute(
        "formaction",
        new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/product_card_csv_export$`)
      );
    });

    // ===== 必須(商品ID未選択) エラー =====

    test("E2E-M03-03-020 商品未選択で出力すると「1つ以上の商品を選択してください」が表示される", async ({ page }) => {
      await login(page);
      const p = new ProductProductCardCsvExportPage(page);
      await p.gotoList();
      await p.search();
      await p.clickCardCsvExport(); // 1件もチェックせず送信 → 有効IDなし
      await expect(page.locator("body")).toContainText(MSG_NOT_SELECT);
    });

    test("E2E-M03-03-021 商品未選択で出力すると商品一覧へリダイレクトされる", async ({ page }) => {
      await login(page);
      const p = new ProductProductCardCsvExportPage(page);
      await p.gotoList();
      await p.search();
      await p.clickCardCsvExport();
      await expect(page).toHaveURL(PRODUCT_LIST_RE); // ページ番号はセッションの検索ページ
    });

    // ===== 権限・認可 =====

    test("E2E-M03-03-041 POST専用ルートへGET直接アクセスすると許可されない(405)", async ({ page }) => {
      await login(page);
      const p = new ProductProductCardCsvExportPage(page);
      const res = await page.goto(p.cardCsvExportPath); // GET（ルートは methods=['POST']）
      expect(res?.status()).toBe(405); // Method Not Allowed
    });

    // ===== 保留（シード/細工POSTが必要・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M03-03-001 商品(カード詳細＋規格あり)を選択し出力するとCSVダウンロードが発火する（要: SEED-M03-03-CARD-OK）",
      async () => {
        // 期待は仕様(処理フロー#10-12・成功時出力)由来。カード詳細と規格を持つ商品の安定シード後に実装。
      }
    );

    test.fixme(
      "E2E-M03-03-002 ダウンロードファイル名が product_card_<YmdHis>.csv である（要: SEED-M03-03-CARD-OK）",
      async () => {
        // 期待は仕様(処理フロー#11 接頭辞 product_card_＋YmdHis＋.csv)由来。
        // 実装時: const dl = await p.exportAndWaitDownload(); expect(dl.suggestedFilename()).toMatch(/^product_card_\d{14}\.csv$/);
      }
    );

    test.fixme(
      "E2E-M03-03-022 ids[] が 0以下・非数値のみのとき未選択扱いで一覧へリダイレクトされる（要: 細工POST）",
      async () => {
        // 期待は仕様(処理フロー#2-3 配列でない→空配列・整数化・0より大きいIDのみ残す / エッジケース「ids未送信・空・文字列のみ→一覧へリダイレクト」 m03-03正本:58,151)由来。
        // 実装時: 認証済みコンテキストで ids[]=["0","-1","abc"] をPOSTし、body に MSG_NOT_SELECT を期待＋URLが PRODUCT_LIST_RE。
        void MSG_NOT_SELECT;
      }
    );

    test.fixme(
      "E2E-M03-03-023 ids が非配列スカラー(文字列のみ)のとき未選択扱いで一覧へリダイレクトされる（要: 細工POST）",
      async () => {
        // 期待は仕様(処理フロー#2「ids が配列でない場合は空配列とみなす」/ エッジケース「ids未送信・空・文字列のみ→一覧へリダイレクト」 m03-03正本:58,151)由来。
        // 022(ids[]=配列で0以下/非数値)とは別分岐。実装時: 認証済みコンテキストで ids="abc"（配列でないスカラー）をPOSTし、
        // body に MSG_NOT_SELECT を期待＋URLが PRODUCT_LIST_RE。
        void MSG_NOT_SELECT;
      }
    );

    test.fixme(
      "E2E-M03-03-024 未選択時にセッションの検索ページ番号が遷移先ページに反映される（要: 多ページ一覧シード＋細工POST）",
      async () => {
        // 期待は仕様(処理フロー#3 / セッション読み取り eccube.admin.product.search.page_no で admin_product_page のページ番号を決める m03-03正本:59,277)由来。
        // 実装時: 一覧を複数ページにし page/{N} を表示してセッションに page_no=N を残し、未選択でCSV出力POST →
        // リダイレクト先URLが /<route>/product/page/N（セッションのページ番号）であること。
      }
    );

    test.fixme(
      "E2E-M03-03-030 存在しない商品IDのみをPOSTすると「存在しないカードIDが含まれています。」が表示される（要: 細工POST）",
      async () => {
        // 期待は仕様(エラー処理 admin.csv.error.export.not_registered / messages.ja.yaml:2244)由来。
        // 実装時: 認証済みコンテキストで ids[]=巨大な非存在ID をPOSTし body に MSG_NOT_REGISTERED を期待。
        void MSG_NOT_REGISTERED;
      }
    );

    test.fixme(
      "E2E-M03-03-031 カード詳細/規格を持たない商品IDのみで出力すると「カードデータが存在しないためエクスポートできません。」（要: SEED-M03-03-NO-CARD）",
      async () => {
        // 期待は仕様(エラー処理 admin.csv.error.export.no_card_data / messages.ja.yaml:2246)由来。
        void MSG_NO_CARD_DATA;
      }
    );

    test.fixme(
      "E2E-M03-03-032 実行時例外時にRefererヘッダがあればRefererへリダイレクトする（要: 細工POST＋Referer）",
      async () => {
        // 期待は仕様(エラー処理・画面遷移 ProductCsvController.php:93-96)由来。
      }
    );

    test.fixme(
      "E2E-M03-03-033 実行時例外時にRefererが無ければ admin_product_page へリダイレクトする（要: 細工POST）",
      async () => {
        // 期待は仕様(エラー処理 ProductCsvController.php:98)由来。
      }
    );

    // 注: 040 は「未ログイン」検証のため資格情報不要（ケース表 付帯表1: E2E自動化(資格情報不要)）。
    // 本describeの先頭 test.skip(!HAS_CREDS) は資格情報を要する管理画面ケース向けのガードであり、
    // 040 を実装する際は HAS_CREDS ガードに依存させず、未認証(storageState なし)の独立コンテキストで
    // 本ルートへ POST → 管理ログインへ誘導されること（CSV非出力）を検証する。現状は実機ファイアウォール
    // 挙動の確認待ちのため test.fixme で残置する。
    test.fixme(
      "E2E-M03-03-040 未ログインで本ルートへPOSTすると管理ログイン画面へ誘導される（要: 未認証コンテキストでのPOST検証・資格情報不要）",
      async () => {
        // 期待は仕様(権限・認可: 未ログインは当パスへ到達できない)由来。ファイアウォールのPOST挙動を実機確認後に実装。
      }
    );
  }
);
