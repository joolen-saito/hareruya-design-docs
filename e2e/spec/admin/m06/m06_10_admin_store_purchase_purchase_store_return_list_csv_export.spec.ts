/**
 * 管理画面 店頭買取管理「戻しリストCSV出力」E2E（M06-10）。
 * 納品ケース表 integration_test/e2e/m06_10_admin_store_purchase_purchase_store_return_list_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化（実装済み）」と「自動化予定だが未実装/要SEED（test.fixme・理由付き）」のみ残す。
 * 手動（CSV各列の値・権限限定アカウント）・手動/間接（棚戻し済みフラグ＝DB内部）・対象外（ログ/無効export_type）は
 * ケース表で全量管理する（規約「手動/対象外はspecに残さない」）。CSRF拒否は副作用ありPOSTの帰結が観測可能なため自動化（025）。
 *
 * 期待結果は仕様(functions/.../m06-10_...md の 例外処理・プロセスフロー・入出力仕様 ＋ Excel原典 戻しリストCSV 8列)由来
 * （オラクル独立性）。実装の現挙動・Form制約・Cookie名は期待値に流用しない。各エラーは設計md 例外処理由来の
 * 「エラー表示＋CSV非出力」を正とし、locale未登録のハードコード文言（対象なし/対象外ステータス/複数店舗/権限）は
 * 文言一致では判定しない（付帯表4）。選択必須エラー文言は locale(messages.ja.yaml:5247)由来で照合可。
 *
 * 刷新先 ec-cube-enterprise に当該機能が存在することを確認済み:
 *   起点 route admin_otcbuyorder = /<route>/otcbuyorder（OtcBuyOrderController.php:90-104）/ 戻しリストCSVリンク index.twig:186。
 *   出力 route admin_otcbuyorder_export = POST /<route>/otcbuyorder/export（OtcBuyOrderController.php:162-168）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(030)は資格情報不要。ダウンロード本体(010-012)・状態/複数店舗(022,023)はSEED（付帯表3）が要るため fixme。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StorePurchasePurchaseStoreReturnListCsvExportPage } from "../../../pages/admin/m06/m06_10_admin_store_purchase_purchase_store_return_list_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder(\\?|/|$)`);
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
// 選択必須エラー（messages.ja.yaml:5247 admin.purchase.online.csv_export.no_selection）。仕様参照のlocale値であり実装定数の写しではない。
const ERR_NO_SELECTION = "1つ以上の買取注文情報を選択してください。";
// 存在しないことが確実なID（int上限）。対象なしエラー分岐を踏むためのダミー入力。
const NON_EXISTENT_ID = 2147483647;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 店頭買取管理 > 戻しリストCSV出力",
  { tag: ["@admin", "@store_purchase", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M06-10-030 未ログインで買取一覧/エクスポートURL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new StorePurchasePurchaseStoreReturnListCsvExportPage(page);
      // (a) 一覧GET（IT-13 URL直接アクセス）
      await p.gotoList();
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
      // (b) 出力POST（admin_otcbuyorder_export）も未認証では出力されないこと。
      //     仕様 権限・認可（開始条件＝ログイン済み）由来。CSV添付ではなくログインへ誘導される。
      const res = await p.postExport([NON_EXISTENT_ID], "x");
      expect(
        StorePurchasePurchaseStoreReturnListCsvExportPage.isCsvAttachment(res)
      ).toBe(false);
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M06-10-001 買取一覧（戻しリストCSV出力の起点）が表示される", async ({ page }) => {
        await login(page);
        const p = new StorePurchasePurchaseStoreReturnListCsvExportPage(page);
        await p.gotoList();
        await expect(page).toHaveURL(LIST_RE);
        await p.seeListScreen();
      });

      test("E2E-M06-10-002 検索実行で買取一覧に留まり結果セクションが評価される", async ({ page }) => {
        await login(page);
        const p = new StorePurchasePurchaseStoreReturnListCsvExportPage(page);
        await p.runSearch();
        // 検索後も一覧URLに留まること（仕様 画面遷移=一覧滞留）。
        await expect(page).toHaveURL(LIST_RE);
        // 結果セクションが評価されること（結果ありなら #result_list、0件なら見出し）。
        // 結果有無はSEED依存のため、いずれか一方の表示で「検索結果が描画された」を判定する。
        await expect(p.resultList.or(p.noResultHeading)).toBeVisible();
      });

      test("E2E-M06-10-003 検索結果があるとCSVメニューに「戻しリストCSV」が表示される", async ({ page }) => {
        await login(page);
        const p = new StorePurchasePurchaseStoreReturnListCsvExportPage(page);
        await p.runSearch();
        // 結果0件ではメニュー自体が出ない（pagination 条件）のが正のため skip し偽陽性を避ける（SEED-M06-10-OTC 投入後に検証）。
        test.skip(
          !(await p.hasResults()),
          "店頭買取データ未投入（SEED-M06-10-OTC）のため検索結果0件＝メニュー非表示が正。seed投入後に検証する"
        );
        await p.openCsvMenu();
        await expect(p.restockCsvLink).toBeVisible();
      });

      test("E2E-M06-10-020 選択なしで戻しリストCSV送信→選択必須エラーでCSV非出力", async ({ page }) => {
        await login(page);
        const p = new StorePurchasePurchaseStoreReturnListCsvExportPage(page);
        await p.gotoList(); // #result_form の CSRF トークンを取得（pagination 有無に依らずレンダリング）
        const token = await p.readCsrfToken();
        const res = await p.postExport([], token); // otcBuyOrderIds 空＝選択なし
        expect(res.status()).toBe(200);
        // 主判定（仕様 例外処理由来）: CSV添付(octet-stream/attachment)は出力されない。
        expect(
          StorePurchasePurchaseStoreReturnListCsvExportPage.isCsvAttachment(res)
        ).toBe(false);
        // 副判定: 一覧へ戻り選択必須エラー（locale値）が表示される。
        expect(await res.text()).toContain(ERR_NO_SELECTION);
      });

      test("E2E-M06-10-021 存在しないIDで送信→対象なしでCSV非出力", async ({ page }) => {
        await login(page);
        const p = new StorePurchasePurchaseStoreReturnListCsvExportPage(page);
        await p.gotoList();
        const token = await p.readCsrfToken();
        const res = await p.postExport([NON_EXISTENT_ID], token);
        expect(res.status()).toBe(200);
        // 仕様 例外処理「対象なし＝エラー」由来: CSV添付は出力されない（文言はハードコードのため一致判定しない／付帯表4）。
        expect(
          StorePurchasePurchaseStoreReturnListCsvExportPage.isCsvAttachment(res)
        ).toBe(false);
        // 仕様 画面遷移「エラー時は買取一覧へ戻る」由来: octet-stream添付ではなく一覧HTMLへ戻る。
        // （ログイン画面や別エラー応答で偽陽性にならないよう、戻り先が買取一覧URL・HTML応答であることを確認。）
        expect(res.url()).toMatch(LIST_RE);
        expect(res.headers()["content-type"] ?? "").toContain("text/html");
      });

      test("E2E-M06-10-026 不正なexport_typeで送信→CSV非出力（入力値検証）", async ({ page }) => {
        await login(page);
        const p = new StorePurchasePurchaseStoreReturnListCsvExportPage(page);
        await p.gotoList();
        const token = await p.readCsrfToken();
        // 仕様 入力値検証（リクエスト本文の出力種別が許容値でない＝不正入力）由来:
        // 有効トークンでも許容外の export_type は対象を確定せずCSVを出力しない。
        // 値「__invalid_export_type__」は許容集合に含まれないことだけを利用（実装の許容値・例外文言には依存しない）。
        const res = await p.postExport(
          [NON_EXISTENT_ID],
          token,
          "__invalid_export_type__"
        );
        expect(
          StorePurchasePurchaseStoreReturnListCsvExportPage.isCsvAttachment(res)
        ).toBe(false);
      });

      test("E2E-M06-10-025 無効CSRFトークンで送信→拒否されCSV非出力", async ({ page }) => {
        await login(page);
        const p = new StorePurchasePurchaseStoreReturnListCsvExportPage(page);
        await p.gotoList();
        // 仕様 権限・認可（CSRF保護）由来: 不正トークンの副作用ありPOSTは拒否され出力されない。
        // トークン値は故意に壊した文字列（実装の有効値・Cookie名・Form制約に依存しない）。
        const res = await p.postExport([NON_EXISTENT_ID], "invalid-csrf-token");
        // CSV添付(octet-stream/attachment)は出力されないこと（拒否の観測可能な帰結）。
        expect(
          StorePurchasePurchaseStoreReturnListCsvExportPage.isCsvAttachment(res)
        ).toBe(false);
      });
    });

    // ===== 自動化予定だが未実装/要SEED（理由付きで fixme。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M06-10-010 対象選択→戻しリストCSV実行でダウンロード発火（要: SEED-M06-10-OTC-ELIGIBLE 棚入れ待ち/完了・単一店舗）",
      async () => {
        // 期待は仕様(プロセスフロー#4-5・入出力仕様=CSVダウンロード)由来。出力で棚戻し済み更新＝破壊的のため使い捨てseed後に実装。
      }
    );

    test.fixme(
      "E2E-M06-10-011 ダウンロードファイル名が otc_buy_order_restock_list_csv_<日時>.csv（要: SEED-M06-10-OTC-ELIGIBLE）",
      async () => {
        // 期待はファイル名形式 /^otc_buy_order_restock_list_csv_\d{14}\.csv$/（仕様=CSV出力。日時は動的）。
      }
    );

    test.fixme(
      "E2E-M06-10-012 エクスポート応答が octet-stream/attachment の200を返す（要: SEED-M06-10-OTC-ELIGIBLE の対象ID）",
      async () => {
        // 期待は仕様(入出力仕様=CSVダウンロード)由来。既知の対象IDで postExport→isCsvAttachment=true を検証。
      }
    );

    test.fixme(
      "E2E-M06-10-013 ダウンロードCSVのヘッダが戻しリスト8列構成である（要: SEED-M06-10-OTC-ELIGIBLE）",
      async () => {
        // 期待はExcel原典(戻しリストCSV 8列: ピッキング区分/棚番号/言語・状態/略称/色R/数/商品名/基準価格)由来。
        // ダウンロード本文をSJIS→UTF-8変換し1行目(ヘッダ)の列数・列名を照合する（出力物から観測可能）。
        // 各セルの値・ピッキング区分閾値・色R抽出・サプライ品表示は対象データ依存のため手動（付帯表5/ケース表E2E-M06-10-040）。
      }
    );

    test.fixme(
      "E2E-M06-10-022 対象外ステータスの買取を選択→エラーでCSV非出力（要: SEED-M06-10-OTC-INELIGIBLE-STATUS）",
      async () => {
        // 期待は仕様 例外処理(状態不整合＝処理対象外/エラー)由来。CSV非出力＋一覧リダイレクトを検証。
      }
    );

    test.fixme(
      "E2E-M06-10-023 複数店舗の買取を同時選択→エラーでCSV非出力（要: SEED-M06-10-OTC-MULTISHOP）",
      async () => {
        // 期待は仕様 例外処理(入力不備＝エラー)由来。複数店舗同時処理不可でCSV非出力＋一覧リダイレクトを検証。
      }
    );

    // E2E-M06-10-024（権限のない店舗データはエラー＝要: 権限限定アカウント SEED-M06-10-OTC-NOPERM）と
    // E2E-M06-10-031（出力成功後 棚戻し済みフラグ更新＝DB内部値の間接確認）は手動/間接のためspecに残さず
    // ケース表（付帯表1/3/5）で管理する（規約「手動/対象外はspecに残さない」）。
  }
);
