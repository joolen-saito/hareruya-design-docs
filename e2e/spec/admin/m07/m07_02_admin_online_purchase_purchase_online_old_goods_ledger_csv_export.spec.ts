/**
 * 管理画面 ネット買取管理「古物台帳入力用CSV出力」E2E（M07-02）。
 * 納品ケース表 integration_test/e2e/m07_02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 本specには「E2E自動化」ケースのみ実装する。CSV各列値（日付/受注番号/氏名/住所/年齢/職業/身分証/点数/金額/利用回数/前回利用日）・
 * 点数/利用回数/前回利用日の集計・並び順・BOM/エンコード・一部IDのみ存在時の出力行・DB抽出結果の照合はケース表で全量管理する
 * （規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m07-02_..._csv_export.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * 実装の現挙動・Form制約・Cookie名は期待値に流用しない。表示文言は i18n(messages.ja.yaml)由来のため
 * 主オラクルにせず、観測挙動（ダウンロード発火・ファイル名・応答ヘッダ・クライアントalert・遷移先）で判定する。
 * 設計源は pf-eccube3(HareruyaEc) リバースだが、刷新先 ec-cube-enterprise に同一画面が実在するためE2E化した:
 *   買取一覧 admin_purchase_list = GET /<route>/purchase/list（PurchaseController.php:121）/
 *   買取詳細 admin_purchase_edit = GET /<route>/purchase/{id}/edit（PurchaseController.php:199）/
 *   CSV出力 admin_purchase_csv_export = POST /<route>/purchase/csv_export（PurchaseController.php:535・CSRF検証なし）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * さらにダウンロード/UI系は SEED-M07-02-BUY-ORDERS（買取注文1件以上）が前提のため、検索結果0件のときは
 * 各テスト内で test.skip して抜け漏れを可視化する。未認証ガード(030/031)・全件不存在(022)は買取注文に依存しない。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OnlinePurchasePurchaseOnlineOldGoodsLedgerCsvExportPage } from "../../../pages/admin/m07/m07_02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 期待値は設計書「ファイル名は接頭辞 purchase_ ＋ 最小IDの7桁ゼロ埋め ＋ _ ＋ 日時YmdHis ＋ .csv」(処理フロー#11)由来。
// 実装に合わせて変えない（オラクル独立性）。最小ID・日時は動的のため正規表現照合。
const FILENAME_RE = /^purchase_\d{7}_\d{14}\.csv$/;
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$|/)`);
// 失敗時の誘導先は設計書(処理フロー/エラー処理)の「GET /{admin_route}/purchase/page/{page_no}」由来。
// 旧 /purchase だけの広い正規表現は詳細(/purchase/{id}/edit)等にも一致し誤検知するため page/{n} まで固定する。
const PURCHASE_REDIRECT_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/purchase/page/\\d+`
);
// 注: サーバフラッシュ文言（「1つ以上の…」等）は messages.ja.yaml 由来の実装リソースであり、
// 設計書(正典)は翻訳キーのみを仕様としている。文言固定はオラクル混入のためアサートしない。
// 出力失敗は観測可能挙動（octet-stream にならず買取一覧ページへリダイレクト）で判定する。

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

/** 買取一覧を開いて検索し、結果を表示する。結果0件なら null を返す（呼び出し側で skip）。 */
async function openListWithResults(
  page: Page
): Promise<OnlinePurchasePurchaseOnlineOldGoodsLedgerCsvExportPage | null> {
  const p = new OnlinePurchasePurchaseOnlineOldGoodsLedgerCsvExportPage(page);
  await p.searchAll(); // 条件未指定で全件検索（SEED-M07-02-BUY-ORDERS 前提）
  const count = await p.rowCheckboxes.count();
  return count > 0 ? p : null;
}

test.describe(
  "管理画面_ネット買取管理 > 古物台帳入力用CSV出力",
  { tag: ["@admin", "@purchase", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M07-02-030 未ログインで買取一覧URL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new OnlinePurchasePurchaseOnlineOldGoodsLedgerCsvExportPage(page);
      await p.gotoList();
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M07-02-031 未ログインでエクスポートエンドポイント送信→処理に到達せず管理ログインへ誘導", async ({
      page,
    }) => {
      const p = new OnlinePurchasePurchaseOnlineOldGoodsLedgerCsvExportPage(page);
      // request はリダイレクトを追従する。未認証なら最終的に管理ログイン画面（CSV応答にならない）。
      const res = await page.request.post(p.exportPath, {
        form: { "buyOrderIds[]": "1" },
      });
      expect(res.headers()["content-type"] ?? "").not.toContain(
        "application/octet-stream"
      );
      expect(res.url()).toMatch(LOGIN_RE);
    });

    // ===== 認証必須・買取注文非依存（SEED-M07-02-ADMIN） =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M07-02-022 全件存在しないIDでエクスポート到達→存在しないIDエラーで一覧へ戻る", async ({
        page,
      }) => {
        await login(page);
        const p = new OnlinePurchasePurchaseOnlineOldGoodsLedgerCsvExportPage(page);
        // クライアントJSを介さずエンドポイントへ直接POST（export()はCSRF検証なし PurchaseController.php:535-559）。
        // 存在しないIDのみ→Service.php:73 RuntimeException→not_registered フラッシュ＋一覧リダイレクト。
        const res = await page.request.post(p.exportPath, {
          form: { "buyOrderIds[]": "99999999" },
        });
        // 仕様: 出力失敗＝octet-stream にならず買取一覧ページ(/purchase/page/{n})へリダイレクト（処理フロー#6）。
        // フラッシュ文言は実装リソース(messages.ja.yaml)由来のため固定しない（オラクル独立性）。
        expect(res.headers()["content-type"] ?? "").not.toContain(
          "application/octet-stream"
        );
        expect(res.url()).toMatch(PURCHASE_REDIRECT_RE);
      });

      test("E2E-M07-02-021 buyOrderIds空でエクスポート到達→選択なしエラーで一覧へ戻る", async ({
        page,
      }) => {
        await login(page);
        const p = new OnlinePurchasePurchaseOnlineOldGoodsLedgerCsvExportPage(page);
        // buyOrderIds を含めずに直接POST（一覧UIはJSが空送信を中断するため、サーバ no_selection は非経由送信で到達）。
        const res = await page.request.post(p.exportPath, { form: {} });
        // 仕様: 処理フロー#4。出力失敗＝octet-stream にならず買取一覧ページ(/purchase/page/{n})へリダイレクト。
        // フラッシュ文言は実装リソース(messages.ja.yaml)由来のため固定しない（オラクル独立性）。
        expect(res.headers()["content-type"] ?? "").not.toContain(
          "application/octet-stream"
        );
        expect(res.url()).toMatch(PURCHASE_REDIRECT_RE);
      });

      test("E2E-M07-02-023 buyOrderIds[]=0のみ（正規化で除去され空）→選択なしエラーで一覧へ戻る", async ({
        page,
      }) => {
        await login(page);
        const p = new OnlinePurchasePurchaseOnlineOldGoodsLedgerCsvExportPage(page);
        // 仕様(処理フロー#3-#4): 0は intval 後 array_filter で除去され配列が空になる→no_selection
        // （Controller.php:542-545 で array_filter(array_map('intval',...)) 後に === [] 判定）。
        // 021（パラメータ無し）とは別の「正規化後に空になる」境界を検証する。実装文言は固定しない。
        const res = await page.request.post(p.exportPath, {
          form: { "buyOrderIds[]": "0" },
        });
        expect(res.headers()["content-type"] ?? "").not.toContain(
          "application/octet-stream"
        );
        expect(res.url()).toMatch(PURCHASE_REDIRECT_RE);
      });

      // ===== 認証必須・買取注文1件以上（SEED-M07-02-BUY-ORDERS） =====

      test("E2E-M07-02-010 検索結果1件以上で「ダウンロード」ドロップダウンと古物台帳入力用CSVが表示される", async ({
        page,
      }) => {
        await login(page);
        const p = await openListWithResults(page);
        test.skip(p === null, "SEED-M07-02-BUY-ORDERS 未投入（検索結果0件）");
        await p!.seeCsvDownloadEntry();
      });

      test("E2E-M07-02-011 検索結果の各行にチェックボックスと表頭の全選択チェックが表示される", async ({
        page,
      }) => {
        await login(page);
        const p = await openListWithResults(page);
        test.skip(p === null, "SEED-M07-02-BUY-ORDERS 未投入（検索結果0件）");
        await p!.seeSelectionCheckboxes();
      });

      test("E2E-M07-02-012 古物台帳入力用CSVは出力前の確認モーダルを持たない", async ({
        page,
      }) => {
        await login(page);
        const p = await openListWithResults(page);
        test.skip(p === null, "SEED-M07-02-BUY-ORDERS 未投入（検索結果0件）");
        await p!.openDownloadMenu();
        // 通常のsubmit（確認モーダル属性 data-bs-toggle=modal を持たない）であること。未選択時のみJS alert。
        await expect(p!.csvExportButton).not.toHaveAttribute(
          "data-bs-toggle",
          "modal"
        );
      });

      test("E2E-M07-02-013 表頭の全選択チェックを押すと全行のチェックが一括オンになる", async ({
        page,
      }) => {
        await login(page);
        const p = await openListWithResults(page);
        test.skip(p === null, "SEED-M07-02-BUY-ORDERS 未投入（検索結果0件）");
        await p!.selectAll();
        const total = await p!.rowCheckboxes.count();
        // JS(purchase.js:2-5)が同フォーム内の [buyOrderId] を一括オンにする。全行が checked であること。
        for (let i = 0; i < total; i++) {
          await expect(p!.rowCheckboxes.nth(i)).toBeChecked();
        }
      });

      test("E2E-M07-02-001 1件チェックして古物台帳入力用CSVを選ぶとダウンロードが発火する", async ({
        page,
      }) => {
        await login(page);
        const p = await openListWithResults(page);
        test.skip(p === null, "SEED-M07-02-BUY-ORDERS 未投入（検索結果0件）");
        await p!.selectFirstRow();
        const urlBefore = page.url();
        const download = await p!.downloadViaList();
        expect(download).toBeTruthy(); // 添付応答のダウンロードが発火
        await expect(page).toHaveURL(urlBefore); // HTML画面遷移を伴わない
      });

      test("E2E-M07-02-002 ダウンロードファイル名が purchase_<最小ID7桁>_<日時>.csv 形式である", async ({
        page,
      }) => {
        await login(page);
        const p = await openListWithResults(page);
        test.skip(p === null, "SEED-M07-02-BUY-ORDERS 未投入（検索結果0件）");
        await p!.selectFirstRow();
        // 単一選択のため設計書(処理フロー#11)の「最小ID」＝選択した行のID。
        // ファイル名がそのIDの7桁ゼロ埋めを含むことまで確認し、選択IDとファイル名の対応を検証する。
        const id = await p!.firstRowBuyOrderId();
        const download = await p!.downloadViaList();
        const name = download.suggestedFilename();
        expect(name).toMatch(FILENAME_RE);
        const padded = String(parseInt(id, 10)).padStart(7, "0");
        expect(name).toMatch(
          new RegExp(`^purchase_${padded}_\\d{14}\\.csv$`)
        );
      });

      test("E2E-M07-02-003 エクスポート応答のContent-Typeがoctet-streamである", async ({
        page,
      }) => {
        await login(page);
        const p = await openListWithResults(page);
        test.skip(p === null, "SEED-M07-02-BUY-ORDERS 未投入（検索結果0件）");
        await p!.selectFirstRow();
        await p!.openDownloadMenu();
        // 実UIフォームを送信し、その csv_export 応答ヘッダを観測する。_token 等のForm制約値を手で固定して
        // 送らない（オラクル独立性：実装由来の入力をテストに混ぜない）。
        const [res] = await Promise.all([
          page.waitForResponse((r) => r.url().includes("/purchase/csv_export")),
          p!.clickCsvExport(),
        ]);
        expect(res.status()).toBe(200);
        expect(res.headers()["content-type"]).toContain(
          "application/octet-stream"
        );
      });

      test("E2E-M07-02-004 エクスポート応答のContent-Dispositionがattachmentでファイル名を含む", async ({
        page,
      }) => {
        await login(page);
        const p = await openListWithResults(page);
        test.skip(p === null, "SEED-M07-02-BUY-ORDERS 未投入（検索結果0件）");
        await p!.selectFirstRow();
        await p!.openDownloadMenu();
        const [res] = await Promise.all([
          page.waitForResponse((r) => r.url().includes("/purchase/csv_export")),
          p!.clickCsvExport(),
        ]);
        const disposition = res.headers()["content-disposition"] ?? "";
        expect(disposition).toContain("attachment");
        expect(disposition).toMatch(/filename=purchase_\d{7}_\d{14}\.csv/);
      });

      test("E2E-M07-02-020 未選択で古物台帳入力用CSVを押すとクライアントalertで中断されダウンロードしない", async ({
        page,
      }) => {
        await login(page);
        const p = await openListWithResults(page);
        test.skip(p === null, "SEED-M07-02-BUY-ORDERS 未投入（検索結果0件）");
        // 仕様(フロント挙動 / purchase.js:13-19): 選択0件は alert で中断し submit しない＝DLが発火しない。
        let dialogShown = false;
        page.on("dialog", (d) => {
          dialogShown = true;
          d.dismiss().catch(() => {});
        });
        let downloadFired = false;
        page.on("download", () => {
          downloadFired = true;
        });
        const urlBefore = page.url();
        await p!.openDownloadMenu();
        await p!.clickCsvExport(); // どの行もチェックせずに押下
        await page.waitForTimeout(500); // alert発火と多重押下抑止タイマ(500ms)の経過を待つ
        expect(dialogShown).toBe(true); // クライアントalertで選択を促す
        expect(downloadFired).toBe(false); // ダウンロードは開始されない
        await expect(page).toHaveURL(urlBefore); // 同一の検索結果一覧に留まる（遷移しない）
      });

      test("E2E-M07-02-005 買取詳細で古物台帳入力用CSV出力を押すと1件分のダウンロードが発火する", async ({
        page,
      }) => {
        await login(page);
        const list = await openListWithResults(page);
        test.skip(list === null, "SEED-M07-02-BUY-ORDERS 未投入（検索結果0件）");
        // 一覧先頭行の詳細リンク（index.twig:234 由来・POMで根拠管理）経由で詳細へ到達。
        await list!.openFirstDetail();
        const p = new OnlinePurchasePurchaseOnlineOldGoodsLedgerCsvExportPage(page);
        const urlBefore = page.url();
        const download = await p.downloadViaDetail();
        expect(download).toBeTruthy(); // 隠しbuyOrderIds送信＝選択チェック対象外で常時送信
        await expect(page).toHaveURL(urlBefore); // 画面遷移を伴わない
      });

      test("E2E-M07-02-014 買取詳細に古物台帳入力用CSV出力ボタンと隠しbuyOrderIdsが存在する", async ({
        page,
      }) => {
        await login(page);
        const list = await openListWithResults(page);
        test.skip(list === null, "SEED-M07-02-BUY-ORDERS 未投入（検索結果0件）");
        await list!.openFirstDetail();
        const p = new OnlinePurchasePurchaseOnlineOldGoodsLedgerCsvExportPage(page);
        await expect(p.detailExportButton).toBeVisible();
        // 隠し入力（type=hidden）は可視性ではなく存在と name/value 属性で確認する。
        await expect(p.detailHiddenBuyOrderIds).toHaveAttribute(
          "name",
          "buyOrderIds[]"
        );
        // 設計書(入口・詳細)由来: 隠しフィールドは「当該買取注文ID」を送る。URL /purchase/{id}/edit の id と一致すること。
        const idMatch = page.url().match(/\/purchase\/(\d+)\/edit/);
        expect(idMatch, "詳細URLから買取注文IDを取得").not.toBeNull();
        await expect(p.detailHiddenBuyOrderIds).toHaveAttribute(
          "value",
          idMatch![1]
        );
      });
    });
  }
);
