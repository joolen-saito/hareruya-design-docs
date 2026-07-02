/**
 * 管理画面 在庫管理「戻しリストPDF出力」E2E。
 * 納品ケース表 integration_test/e2e/m04_34_admin_stock_stock_move_return_list_pdf_export_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 本機能は、在庫移動・振替一覧で選択した在庫移動・振替情報から戻しリストHTMLを生成し、別ウィンドウ（ポップアップ）で
 * 表示してブラウザ印刷する。サーバは POST .../return_list_pdf_export を受け、CSRF検証・対象バリデーション後に
 * JSONで {success:true, html} もしくは {success:false, redirectUrl} を返す（StockMoveTransferController.php:455）。
 *
 * 期待結果は仕様（正本 functions/ec-cube-enterprise/m04-34_*.md / 基本設計仕様書(在庫管理機能) / messages.ja.yaml）由来
 * （オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 *
 * spec に残すのは E2E自動化（実装済み）＋自動化予定だが要シード/要実機の test.fixme のみ。
 * 帳票内容（閾値グループ・30行ページ分割・並び順・列整形・小計）／ポップアップ表示・印刷ダイアログ／参照のみ(DB副作用なし)等の
 * 手動・対象外はケース表（付帯表）で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * シード（環境変数。コミットしない）:
 *  - SEED-M04-34-EXPORTABLE: 出力可能な状態（許可ステータス・入庫先店舗設定済・ログイン管理者の権限店舗）の
 *    在庫移動・振替情報。検証OKで {success:true, html} を返すために必要。未設定時は 003/004 を test.fixme で保留。
 *  - SEED-M04-34-INVALID: 検証NGを起こす業務相関レコード（対象外ステータス／権限外店舗／入庫先未設定／複数店舗混在）。
 *    014〜017 で {success:false, redirectUrl} を観測するために必要。未設定のため test.fixme で保留。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockStockMoveReturnListPdfExportPage } from "../../../pages/admin/m04/m04_34_admin_stock_stock_move_return_list_pdf_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const NO_SELECTION = "1つ以上の在庫移動情報を選択してください。"; // :5139

const LOGIN_RE = /\/login(\?|$)/;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 在庫管理 > 戻しリストPDF出力",
  { tag: ["@admin", "@stock", "@pdf"] },
  () => {
    // ===== 一覧画面の入口（ログインのみで実行可） =====

    test("E2E-M04-34-001 一覧画面に「戻しリストPDF出力」ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new StockStockMoveReturnListPdfExportPage(page);
      await target.gotoList();
      await target.seePdfExportButton(); // 操作起点・UI部品（index.twig:629）
    });

    test("E2E-M04-34-002 チェック未選択でPDF出力ボタン押下→選択を促すalertが表示され処理が中断する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new StockStockMoveReturnListPdfExportPage(page);
      await target.gotoList();
      // 期待は仕様(プロセスフロー/no_selection)由来: 未選択時はクライアントで送信を中断しalertで通知する。
      let dialogMessage = "";
      let popupOpened = false;
      page.on("dialog", async (d) => {
        dialogMessage = d.message();
        await d.dismiss();
      });
      page.on("popup", () => {
        popupOpened = true;
      });
      await target.pdfExportButton.click();
      expect(dialogMessage).toContain(NO_SELECTION);
      expect(popupOpened).toBeFalsy(); // 送信せずポップアップを開かない（送信可否制御）
    });

    // ===== エンドポイント直接POSTの判定（ログイン＋CSRFトークン） =====

    test("E2E-M04-34-010 選択無し(ids空)でエンドポイントへPOST→{success:false, redirectUrl}を返す", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new StockStockMoveReturnListPdfExportPage(page);
      await target.gotoList();
      const token = await target.readCsrfToken();
      const res = await target.postExport([], token); // ids 空＝未選択
      expect(res.ok()).toBeTruthy(); // 検証NGでもHTTP200のままJSONを返す（Controller.php:462）
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(typeof body.redirectUrl).toBe("string"); // 一覧ページへの戻り先URL
    });

    test("E2E-M04-34-011 存在しないIDでエンドポイントへPOST→{success:false, redirectUrl}を返す", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new StockStockMoveReturnListPdfExportPage(page);
      await target.gotoList();
      const token = await target.readCsrfToken();
      const res = await target.postExport(["999999999"], token); // 対象データなし＝検証NG
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.success).toBe(false); // validateReturnListExportIds が「対象のデータが見つかりません。」
      expect(typeof body.redirectUrl).toBe("string");
    });

    test("E2E-M04-34-012 CSRFトークン不正でエンドポイントへPOST→戻しリストHTMLを返さず拒否される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new StockStockMoveReturnListPdfExportPage(page);
      await target.gotoList();
      const res = await target.postExport(["1"], "invalid-csrf-token");
      // 期待は仕様(分岐・例外: CSRF不正→例外)由来。成功HTMLを返さないこと。
      if (res.ok()) {
        const body = await res.json().catch(() => ({}));
        expect(body.success).not.toBe(true);
        expect(body.html).toBeUndefined();
      } else {
        expect(res.status()).toBeGreaterThanOrEqual(400);
      }
    });

    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M04-34-013 未ログインでエンドポイントへPOST→管理ログイン画面へ誘導される", async ({
      request,
    }) => {
      const res = await request.post(
        `/${ECCUBE_ADMIN_ROUTE}/product/stock/move_transfer/return_list_pdf_export`,
        { form: { _token: "x", "ids[0]": "1" } }
      );
      // 未認証は管理ログインへリダイレクト（最終到達がログイン画面、または一覧/PDF出力本処理に到達しない）。
      expect(res.url()).toMatch(LOGIN_RE);
      expect(res.url()).not.toMatch(/return_list_pdf_export/);
    });

    // ===== メソッド境界（POST限定。ログインのみで実行可） =====

    test("E2E-M04-34-030 非POST(GET)でエンドポイントへアクセス→戻しリストHTML出力本処理に到達しない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new StockStockMoveReturnListPdfExportPage(page);
      // 期待は仕様(利用者視点の入口: POSTメソッド限定 md:50,54)由来。GET は本処理に到達しない。
      const res = await page.request.get(target.exportEndpoint);
      // 成功HTML(JSON success:true)を返さないこと（メソッド不一致で拒否）。
      const body = await res.json().catch(() => ({} as { success?: boolean; html?: string }));
      expect(body.success).not.toBe(true);
      expect(body.html).toBeUndefined();
    });

    // ===== 自動化予定だが要シード（検証OK経路）＝ test.fixme =====

    test.fixme(
      "E2E-M04-34-003 有効IDを選択してPOST→{success:true, html}で戻しリストHTMLが返る（要: SEED-M04-34-EXPORTABLE）",
      async () => {
        // 期待は仕様(プロセスフロー4・分岐「検証OK」)由来。出力可能な在庫移動・振替情報のシード投入後に有効化。
        // 手順: 一覧で当該行を選択→CSRFトークン取得→postExport([id], token)→body.success===true かつ body.html を含む。
      }
    );

    test.fixme(
      "E2E-M04-34-004 返却HTMLにタイトル「戻しリスト」・印刷ボタン#printButton・明細列見出しが含まれる（要: SEED-M04-34-EXPORTABLE）",
      async () => {
        // 期待は仕様(帳票レイアウト要素・識別ID1〜13)由来。body.html 文字列に <title>戻しリスト・id="printButton"(印刷する)・
        // 列見出し(No/棚番号/言語/状態/略称/色/R/数/商品名/価格/備考) が含まれることを検査（return_list.twig:6,11,34-42）。
        // 帳票の中身（閾値グループ/並び順/30行ページ分割/列整形/小計）は手動確認のためケース表で管理する。
      }
    );

    // ===== 業務相関バリデーション異常系（自動化予定だが要シード）＝ test.fixme =====
    // 設計書 md:34 が明記する4業務条件。いずれも {success:false, redirectUrl} を HTTP200 で観測でき自動化可能。
    // 期待は仕様(出力前バリデーション→検証NG)由来。html を返さないことのみを判定し、実装の個別メッセージはオラクル化しない。

    test.fixme(
      "E2E-M04-34-014 対象外ステータスのIDでPOST→{success:false, redirectUrl}（要: SEED-M04-34-INVALID）",
      async () => {
        // 手順: 対象外ステータス行のID→postExport([id], token)→body.success===false かつ body.html === undefined。
      }
    );

    test.fixme(
      "E2E-M04-34-015 権限外店舗のIDでPOST→{success:false, redirectUrl}（要: SEED-M04-34-INVALID）",
      async () => {
        // 手順: ログイン管理者の権限外店舗の行のID→postExport([id], token)→body.success===false かつ body.html === undefined。
      }
    );

    test.fixme(
      "E2E-M04-34-016 入庫先店舗未設定(shopId=null)のIDでPOST→{success:false, redirectUrl}（要: SEED-M04-34-INVALID）",
      async () => {
        // 手順: 入庫先未設定の行のID→postExport([id], token)→body.success===false かつ body.html === undefined。
      }
    );

    test.fixme(
      "E2E-M04-34-017 複数店舗混在のIDでPOST→{success:false, redirectUrl}（要: SEED-M04-34-INVALID）",
      async () => {
        // 手順: 複数の入庫先店舗が混在する行のID→postExport([id], token)→body.success===false かつ body.html === undefined。
      }
    );
  }
);
