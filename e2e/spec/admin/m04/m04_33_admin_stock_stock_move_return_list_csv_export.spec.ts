/**
 * 管理画面 在庫管理「戻しリストCSV出力（M04-33）」E2E。
 * 納品ケース表 integration_test/e2e/m04_33_admin_stock_stock_move_return_list_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースを実装する。資格情報のみ/シード不要で成立する 001/010/020/021 と、
 * 隠しフォームのCSRFトークン取得（または不正トークン）だけで成立する 011/012/018/041 を実装。
 * シード依存（選択行ありのダウンロード/ファイル名/応答ヘッダ 002-004・各相関NG分岐 013-017・
 *   ページ番号保持 005・許可ステータス正常境界 019・複数まとめて 040）は
 * test.fixme（理由付き）で残す。手動（CSV本文＝8列見出し・ピッキング区分振分・並び順・文字コード/BOM・棚番/略称/色R/商品名整形）・
 * 対象外（log_info出力・参照のみのDB内部値・CSV_HEADER定数・登録なし）はケース表で全量管理する
 * （規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-33_admin_stock_stock_move_return_list_csv_export.md
 *   / 基本設計仕様書(在庫管理機能))由来（オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 * 刷新先 ec-cube-enterprise の同等ルート admin_stock_move_transfer_return_list_csv_export
 *   （StockMoveTransferController.php:437 / index.twig:628・692・971）の存在を確認済み。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(020)は資格情報不要。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockStockMoveReturnListCsvExportPage } from "../../../pages/admin/m04/m04_33_admin_stock_stock_move_return_list_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 期待値は設計書「CSV出力仕様 / ファイル名」由来（stock_move_transfer_return_list_<7桁min id>_<YmdHis>.csv）。
// 実装に合わせて変えない（オラクル独立性）。最小ID・日時は動的のため正規表現照合。
const FILENAME_RE = /^stock_move_transfer_return_list_\d{7}_\d{14}\.csv$/;
// 未選択時のメッセージ（仕様 m04-33 md:105: 1つ以上の在庫移動情報を選択してください。）。クライアントalert/サーバflash共通。
const NO_SELECTION_MSG = "1つ以上の在庫移動情報を選択してください。";
// 対象データなしのメッセージ（仕様 m04-33 md:116）。実装文言ではなく設計書由来オラクル。
const NOT_FOUND_MSG = "対象のデータが見つかりません。";
const LIST_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/product/stock/move_transfer(/page/\\d+)?(\\?|$)`
);
const LOGIN_RE = /\/login(\?|$)/;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 在庫管理 > 戻しリストCSV出力",
  { tag: ["@admin", "@stock", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M04-33-020 未ログインで戻しリストCSV出力URLへアクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      const p = new StockStockMoveReturnListCsvExportPage(page);
      // POST専用ルートだが、未認証時はファイアウォールがCSRF/メソッド処理前にログインへ誘導する仕様を検証する。
      const res = await page.request.post(p.exportPath, {
        form: {},
        maxRedirects: 5,
      });
      expect(res.url()).toMatch(LOGIN_RE);
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M04-33-001 一覧に「戻しリストCSV出力」ボタンが表示される", async ({ page }) => {
        await login(page);
        const p = new StockStockMoveReturnListCsvExportPage(page);
        await p.gotoList();
        await p.seeReturnListButton();
      });

      test("E2E-M04-33-010 未選択でボタン押下→「1つ以上の在庫移動情報を選択してください。」のalertが出てCSV出力されない", async ({
        page,
      }) => {
        await login(page);
        const p = new StockStockMoveReturnListCsvExportPage(page);
        await p.gotoList();
        let dialogMsg = "";
        page.on("dialog", async (d) => {
          dialogMsg = d.message();
          await d.dismiss();
        });
        // ダウンロードが発火しないこと（alertでJS送信が中断される仕様 index.twig:172-176）。
        let downloadFired = false;
        page.on("download", () => {
          downloadFired = true;
        });
        await p.returnListCsvButton.click();
        await expect.poll(() => dialogMsg).toContain(NO_SELECTION_MSG);
        expect(downloadFired).toBe(false);
        await expect(page).toHaveURL(LIST_RE); // 一覧に留まる
      });

      test("E2E-M04-33-021 戻しリストCSV出力URLへGET直接アクセス→POST専用のため許可されない", async ({
        page,
      }) => {
        await login(page);
        const p = new StockStockMoveReturnListCsvExportPage(page);
        // route は methods:['POST']（Controller.php:437）。GETは 405 Method Not Allowed を期待する。
        const res = await page.request.get(p.exportPath);
        expect(res.status()).toBe(405);
      });

      // ===== シード不要のサーバ側検証（隠しフォームのCSRFトークンを取得して直接POST） =====

      test("E2E-M04-33-011 ids空でPOST→一覧へリダイレクトし「1つ以上の在庫移動情報を選択してください。」が表示される", async ({
        page,
      }) => {
        // 期待は仕様(プロセスフロー2 no_selection / md:105)由来。サーバ側必須検証。シード不要。
        await login(page);
        const p = new StockStockMoveReturnListCsvExportPage(page);
        await p.gotoList();
        const token = await p.readCsrfToken();
        const res = await p.postExport([], token);
        expect(res.url()).toMatch(LIST_RE); // 一覧へリダイレクト
        expect(await res.text()).toContain(NO_SELECTION_MSG);
      });

      test("E2E-M04-33-012 存在しないIDのみでPOST→「対象のデータが見つかりません。」で一覧へリダイレクト", async ({
        page,
      }) => {
        // 期待は仕様(出力前バリデーション 対象なし / md:116)由来。存在しないIDのみ＝対象0件。シード不要。
        await login(page);
        const p = new StockStockMoveReturnListCsvExportPage(page);
        await p.gotoList();
        const token = await p.readCsrfToken();
        const res = await p.postExport(["99999999"], token);
        expect(res.url()).toMatch(LIST_RE);
        expect(await res.text()).toContain(NOT_FOUND_MSG);
      });

      test("E2E-M04-33-018 不正CSRFトークンでPOST→CSVを出力せず拒否される", async ({
        page,
      }) => {
        // 期待は仕様(分岐・遷移 CSRF不正でCSV非出力)由来。不正トークンでCSV添付応答を返さないことを観測。シード不要。
        await login(page);
        const p = new StockStockMoveReturnListCsvExportPage(page);
        await p.gotoList();
        const res = await p.postExport(["1"], "invalid-csrf-token");
        // CSVダウンロード（application/octet-stream の attachment）が返らないこと。
        const contentType = res.headers()["content-type"] ?? "";
        const disposition = res.headers()["content-disposition"] ?? "";
        expect(contentType).not.toContain("application/octet-stream");
        expect(disposition).not.toContain("attachment");
      });

      test("E2E-M04-33-041 ids空要素のみ（空文字）でPOST→整数化・空要素除去で未選択エラー", async ({
        page,
      }) => {
        // 期待は仕様(プロセスフロー2 idsの整数化・空要素除去 / md:105)由来。
        // 空文字等の空要素のみは整数化・空要素除去で空配列扱いとなり no_selection。シード不要。
        await login(page);
        const p = new StockStockMoveReturnListCsvExportPage(page);
        await p.gotoList();
        const token = await p.readCsrfToken();
        const res = await p.postExport(["", ""], token);
        expect(res.url()).toMatch(LIST_RE); // 一覧へリダイレクト
        expect(await res.text()).toContain(NO_SELECTION_MSG);
      });

      // ===== シード依存（自動化予定・未実装。理由付き fixme） =====

      test.fixme(
        "E2E-M04-33-005 2ページ目から検証NG→現在のページ番号を保持して一覧へリダイレクト（要: 2ページ以上のシード）",
        async () => {
          // 期待は仕様(利用者視点の入口/分岐遷移 セッション page_no を用いた admin_stock_move_transfer_page / md:56,129)由来。
        }
      );

      test.fixme(
        "E2E-M04-33-019 出庫承認済み(4)のIDでPOST→許可ステータス正常境界で出力成功（要: status=4シード）",
        async () => {
          // 期待は仕様(許可ステータス 出庫承認済み4/移動中5/入庫承認待ち6/入庫承認済み7 / md:123)由来。
          // ※実装 ALLOWED_STATUS_IDS は5/6/7のみで4を含まない乖離（付帯表4 #6）。テストは仕様どおり成功を期待し検出する。
        }
      );

      test.fixme(
        "E2E-M04-33-040 入庫先未設定＋対象外ステータス＋存在しないID混在でPOST→複数エラーをまとめて表示（要: 複合シード）",
        async () => {
          // 期待は仕様(出力前バリデーション「エラーは複数まとめて返す」/ md:112)由来。各メッセージが全て表示されることを観測。
        }
      );

      test.fixme(
        "E2E-M04-33-002 行選択しボタン押下でCSVダウンロードが発火する（要: 許可ステータス＋同一店舗＋権限ありの選択可能行シード）",
        async () => {
          // 期待は仕様(分岐・遷移 検証OK→StreamedResponse)由来。
          // 選択可能な在庫移動・振替行（移動中5/入庫承認待ち6/入庫承認済み7のいずれか・入庫先設定済・担当店舗・単一店舗）のシード投入後に実装。
        }
      );

      test.fixme(
        "E2E-M04-33-003 ダウンロードファイル名が stock_move_transfer_return_list_<7桁min id>_<日時>.csv 形式（要: 選択可能行シード）",
        async () => {
          // 期待は仕様(CSV出力仕様 ファイル名 / Service.php:95-96)由来。FILENAME_RE で照合する。
          void FILENAME_RE;
        }
      );

      test.fixme(
        "E2E-M04-33-004 CSV出力応答が application/octet-stream / attachment を返す（要: 選択可能行シード＋CSRFトークン）",
        async () => {
          // 期待は仕様(Service.php:97-100)由来。隠しフォームのCSRFトークンを使い page.request.post で応答ヘッダを観測する。
        }
      );

      test.fixme(
        "E2E-M04-33-013 一部存在しないIDでPOST→「ID: {id} は存在しません。」で一覧へリダイレクト（要: 有効1件＋無効1件シード）",
        async () => {
          // 期待は仕様(出力前バリデーション / Service.php:164)由来。
        }
      );

      test.fixme(
        "E2E-M04-33-014 入庫先店舗未設定IDでPOST→「ID: {id} は入庫先店舗が設定されていません。」（要: 入庫先未設定シード）",
        async () => {
          // 期待は仕様(出力前バリデーション / Service.php:144)由来。
        }
      );

      test.fixme(
        "E2E-M04-33-015 権限のない店舗のIDでPOST→「ID: {id} は権限のない店舗のデータです。」（要: 担当外店舗シード）",
        async () => {
          // 期待は仕様(出力前バリデーション / Service.php:149)由来。
        }
      );

      test.fixme(
        "E2E-M04-33-016 対象外ステータスのIDでPOST→「ID: {id} は対象外のステータスです。」（要: 新規/差戻し等のシード）",
        async () => {
          // 期待は仕様(許可ステータス ALLOWED_STATUS_IDS=4/5/6/7 / Service.php:154-156)由来。
        }
      );

      test.fixme(
        "E2E-M04-33-017 複数店舗混在のIDでPOST→「複数店舗の在庫移動・振替情報を同時に処理することはできません。」（要: 別店舗の2件シード）",
        async () => {
          // 期待は仕様(出力前バリデーション / Service.php:169)由来。
        }
      );

    });
  }
);
