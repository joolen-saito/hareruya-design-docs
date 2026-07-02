/**
 * 管理画面 店頭買取管理「古物台帳入力用CSV出力」E2E（M06-02）。
 * 納品ケース表 integration_test/e2e/m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装する。CSV各列の値・住所/年齢/電話形式・数量集計・並び順・BOM/エンコード・
 * 種別不正のシステムエラー画面観測（隠し項目改ざん要）・DB抽出結果の照合はケース表で全量管理する
 * （規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m06-02_..._csv_export.md / 観点表)由来（オラクル独立性）。
 * 実装の現挙動・Form制約・Cookie名は期待値に流用しない。表示文言は i18n(messages.ja.yaml)由来のため
 * 主オラクルにせず、観測挙動（ダウンロード発火・ファイル名・応答ヘッダ・遷移先URL）で判定する。
 * 設計源は pf-eccube3(HareruyaEc) リバースだが、刷新先 ec-cube-enterprise に同一画面が実在するためE2E化した:
 *   買取一覧 admin_otcbuyorder = GET/POST /<route>/otcbuyorder（OtcBuyOrderController.php:90-104）/
 *   CSV出力 admin_otcbuyorder_export = POST /<route>/otcbuyorder/export（OtcBuyOrderController.php:162-169）/
 *   起点リンク a.export-link[data-type=old_goods_account]（index.twig:184）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * さらにダウンロード/応答系は SEED-M06-02-OTC-ORDERS（買取注文1件以上）が前提のため、検索結果0件のときは
 * 各テスト内で test.skip して抜け漏れを可視化する。未認証ガード(030/031)は資格情報不要。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StorePurchaseOtcBuyOrderOldGoodsAccountCsvExportPage } from "../../../pages/admin/m06/m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 期待値は設計書「ファイル名は接頭辞 old_goods_account_ と日時 YmdHis と拡張子 .csv」(処理フロー#8)由来。
// 実装に合わせて変えない（オラクル独立性）。日時はリクエスト時刻で動的のため正規表現照合。
const FILENAME_RE = /^old_goods_account_\d{14}\.csv$/;
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$|/)`);
// 選択なし送信の誘導先（admin_otcbuyorder_page）。買取一覧ルートまで固定して誤検知を防ぐ。
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

/** 買取一覧を開いて検索し、結果を表示する。結果0件なら null を返す（呼び出し側で skip）。 */
async function openListWithResults(
  page: Page
): Promise<StorePurchaseOtcBuyOrderOldGoodsAccountCsvExportPage | null> {
  const p = new StorePurchaseOtcBuyOrderOldGoodsAccountCsvExportPage(page);
  await p.goto();
  await p.search(); // 条件未指定で全件検索（SEED-M06-02-OTC-ORDERS 前提）
  const count = await p.rowCheckboxes.count();
  return count > 0 ? p : null;
}

test.describe(
  "管理画面 店頭買取管理 > 古物台帳入力用CSV出力",
  { tag: ["@admin", "@purchase", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M06-02-030 未ログインで買取一覧URL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new StorePurchaseOtcBuyOrderOldGoodsAccountCsvExportPage(page);
      await p.goto();
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M06-02-031 未ログインでエクスポートエンドポイント送信→処理に到達せず管理ログインへ誘導", async ({
      page,
    }) => {
      const p = new StorePurchaseOtcBuyOrderOldGoodsAccountCsvExportPage(page);
      // request はリダイレクトを追従する。未認証なら最終的に管理ログイン画面（CSV応答にならない）。
      const res = await page.request.post(p.exportPath, {
        form: { export_type: "old_goods_account" },
      });
      expect(res.headers()["content-type"] ?? "").not.toContain(
        "application/octet-stream"
      );
      expect(res.url()).toMatch(LOGIN_RE);
    });

    // ===== 認証必須（SEED-M06-02-OTC-ORDERS 前提） =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M06-02-010 検索結果1件以上でCSVダウンロードドロップダウンと古物台帳リンクが表示される", async ({
        page,
      }) => {
        await login(page);
        const p = await openListWithResults(page);
        test.skip(p === null, "SEED-M06-02-OTC-ORDERS 未投入（検索結果0件）");
        await p!.seeCsvDownloadEntry();
      });

      test("E2E-M06-02-011 検索結果の各行にチェックボックスと表頭の全選択チェックが表示される", async ({
        page,
      }) => {
        await login(page);
        const p = await openListWithResults(page);
        test.skip(p === null, "SEED-M06-02-OTC-ORDERS 未投入（検索結果0件）");
        await p!.seeRowSelectors();
      });

      test("E2E-M06-02-012 古物台帳入力用CSVは確認モーダルを持たない（出力前ダイアログがない）", async ({
        page,
      }) => {
        await login(page);
        const p = await openListWithResults(page);
        test.skip(p === null, "SEED-M06-02-OTC-ORDERS 未投入（検索結果0件）");
        await p!.openCsvDropdown();
        // 通常リンク（確認モーダル属性 data-bs-toggle=modal を持たない）であること。
        await expect(p!.oldGoodsAccountLink).not.toHaveAttribute(
          "data-bs-toggle",
          "modal"
        );
      });

      test("E2E-M06-02-013 表頭の全選択チェックを押すと全行のチェックが一括オンになる", async ({
        page,
      }) => {
        await login(page);
        const p = await openListWithResults(page);
        test.skip(p === null, "SEED-M06-02-OTC-ORDERS 未投入（検索結果0件）");
        await p!.checkAll();
        const total = await p!.rowCheckboxes.count();
        // JS(otc-buy-order.js:16-18)が [otcBuyOrderId] を一括オンにする。全行が checked であること。
        for (let i = 0; i < total; i++) {
          await expect(p!.rowCheckboxes.nth(i)).toBeChecked();
        }
      });

      test("E2E-M06-02-001 1件チェックして古物台帳入力用CSVを選ぶとダウンロードが発火する", async ({
        page,
      }) => {
        await login(page);
        const p = await openListWithResults(page);
        test.skip(p === null, "SEED-M06-02-OTC-ORDERS 未投入（検索結果0件）");
        await p!.checkFirstRow();
        const urlBefore = page.url();
        const download = await p!.downloadViaLink();
        expect(download).toBeTruthy(); // 添付応答のダウンロードが発火
        await expect(page).toHaveURL(urlBefore); // HTML画面遷移を伴わない
      });

      test("E2E-M06-02-002 ダウンロードファイル名が old_goods_account_<日時>.csv 形式である", async ({
        page,
      }) => {
        await login(page);
        const p = await openListWithResults(page);
        test.skip(p === null, "SEED-M06-02-OTC-ORDERS 未投入（検索結果0件）");
        await p!.checkFirstRow();
        const download = await p!.downloadViaLink();
        expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      });

      test("E2E-M06-02-003 エクスポート応答のContent-Typeがoctet-streamである", async ({
        page,
      }) => {
        await login(page);
        const p = await openListWithResults(page);
        test.skip(p === null, "SEED-M06-02-OTC-ORDERS 未投入（検索結果0件）");
        await p!.checkFirstRow();
        await p!.openCsvDropdown();
        // 実UIフォームを送信し、その export 応答ヘッダを観測する。_token 等のForm制約値を手で固定して
        // 送らない（オラクル独立性：実装由来の入力をテストに混ぜない）。
        const [res] = await Promise.all([
          page.waitForResponse((r) => r.url().includes("/otcbuyorder/export")),
          p!.oldGoodsAccountLink.click(),
        ]);
        expect(res.status()).toBe(200);
        expect(res.headers()["content-type"]).toContain(
          "application/octet-stream"
        );
      });

      test("E2E-M06-02-004 エクスポート応答のContent-Dispositionがattachmentでファイル名を含む", async ({
        page,
      }) => {
        await login(page);
        const p = await openListWithResults(page);
        test.skip(p === null, "SEED-M06-02-OTC-ORDERS 未投入（検索結果0件）");
        await p!.checkFirstRow();
        await p!.openCsvDropdown();
        // 003 と同様、実UIフォーム送信の応答を観測（_token を手で固定しない）。
        const [res] = await Promise.all([
          page.waitForResponse((r) => r.url().includes("/otcbuyorder/export")),
          p!.oldGoodsAccountLink.click(),
        ]);
        const disposition = res.headers()["content-disposition"] ?? "";
        expect(disposition).toContain("attachment");
        expect(disposition).toMatch(/filename=old_goods_account_\d{14}\.csv/);
      });

      test("E2E-M06-02-020 チェックなしで古物台帳入力用CSVを選ぶと選択なしエラーが表示される", async ({
        page,
      }) => {
        await login(page);
        const p = await openListWithResults(page);
        test.skip(p === null, "SEED-M06-02-OTC-ORDERS 未投入（検索結果0件）");
        // どの行もチェックせずに送信＝otcBuyOrderIds[] 実質空。リダイレクト後にエラーフラッシュが見える。
        await p!.openCsvDropdown();
        await p!.oldGoodsAccountLink.click();
        // 期待は仕様(処理フロー#4 / messages.ja.yaml:5247 admin.purchase.online.csv_export.no_selection)由来。
        await expect(
          page.getByText("1つ以上の買取注文情報を選択してください。")
        ).toBeVisible();
      });

      test("E2E-M06-02-021 選択なし送信は買取一覧ページへリダイレクトされダウンロードしない", async ({
        page,
      }) => {
        await login(page);
        const p = await openListWithResults(page);
        test.skip(p === null, "SEED-M06-02-OTC-ORDERS 未投入（検索結果0件）");
        // 送信前から一覧URLに居るため toHaveURL だけでは偽陽性。リダイレクト後の再描画と
        // 「添付ダウンロードが発火しないこと」を主オラクルにする（成功=DL／失敗=一覧リダイレクトの対）。
        let downloadFired = false;
        page.on("download", () => {
          downloadFired = true;
        });
        await p!.openCsvDropdown();
        await p!.oldGoodsAccountLink.click();
        // 買取一覧ページ（admin_otcbuyorder_page）が再描画されること。
        await expect(p!.searchForm).toBeVisible();
        await expect(page).toHaveURL(LIST_RE);
        // 仕様: 選択なしは出力失敗＝ダウンロードは発火しない。
        expect(downloadFired).toBe(false);
      });

      test("E2E-M06-02-014 検索結果0件のときCSVダウンロードドロップダウンが表示されない", async ({
        page,
      }) => {
        await login(page);
        const p = new StorePurchaseOtcBuyOrderOldGoodsAccountCsvExportPage(page);
        await p.goto();
        // 該当0件となる条件で検索する（SEED-M06-02-OTC-EMPTY）。検索フォームへの条件入力は実機の入力欄に依存するため
        // ここでは0件状態の観測のみを行い、条件投入手順は要実機確認。
        // 仕様: totalItemCount>0 のときのみ CSVダウンロードが描画される（index.twig:159,181）。
        if (await p.noResultMessage.isVisible().catch(() => false)) {
          await expect(p.csvDropdownToggle).toHaveCount(0);
        } else {
          test.skip(
            true,
            "0件状態の生成（SEED-M06-02-OTC-EMPTY の検索条件）が必要。条件投入は要実機確認"
          );
        }
      });
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M06-02-022 export_type許可リスト外で送信→システムエラー応答（要: 隠し #export_type 改ざん＋500画面観測）",
      async () => {
        // 期待は仕様(バリデーション/エラー処理「export_type許可リスト外は例外＝HTTP500・システムエラー」)由来。
        // 隠し項目 #export_type を不正値に書き換えて #result_form を送信し、買取一覧へのアプリ制御リダイレクトに
        // ならず例外エラー応答になることを確認する。共有環境では500画面の観測手段が要実機確認のため fixme。
      }
    );

    test.fixme(
      "E2E-M06-02-023 otcBuyOrderIdsに非整数のみ送信→整数化後空でエラーリダイレクト（要: #result_form へ非整数注入）",
      async () => {
        // 期待は仕様(バリデーション「otcBuyOrderIds 整数化後に空ならエラーメッセージを表示してリダイレクト」/
        // 処理フロー#4)由来。otcBuyOrderIds[] に非整数値（整数化→array_filter で除去され空になる値）を注入して
        // #result_form を送信し、選択なしと同一の失敗分岐（フラッシュ＋買取一覧リダイレクト・DL不発火）になることを
        // 確認する。実UIでは行チェックが整数IDを入れるため非整数注入が要実機確認＝fixme。
        // 未選択＝空配列(021)とは入力経路が異なる別ケース。
      }
    );
  }
);
