/**
 * 商品管理「買取/販売価格履歴 CSV 出力」E2E。
 * 納品ケース表 integration_test/e2e/m03_24_admin_product_product_buy_sale_price_history_csv_export_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装する。手動（CSVファイル内容＝列順・列値・NULL→空セル・SJIS-win・BOM・
 * 区切り文字・名称2列順入替・抽出集合一致・出力行数・登録日形式・登録者名）／対象外（GET CSRF＝FW内部、
 * set_time_limit/ストリーム＝内部、ログ抑止、スナップショット一貫性、IT-22バリデーション＝CSV専用入力なし・委譲、
 * IT-23検索条件＝別機能m03-23委譲、IT-26登録内容＝参照系で登録更新なし）はケース表で全量管理し、specに
 * 大量のfixmeを残さない（規約準拠）。要シード/要実機の分のみ test.fixme で残す。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-24_admin_product_product_buy_sale_price_history_csv_export.md /
 * BuySalePriceHistoryController.php / messages.ja.yaml)由来（オラクル独立性）。
 * 実装からはセレクタ・ルート（位置情報）のみを取り、合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductBuySalePriceHistoryCsvExportPage } from "../../../pages/admin/m03/m03_24_admin_product_product_buy_sale_price_history_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const HOME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/?(\\?|$)`);
// 未認証ガードは「管理ログイン画面」へ誘導される（公開側 /mypage/login 等ではない）。
// 管理ログインは /<admin_route>/login（AdminLoginPage.url と一致）なので admin ルートに限定する。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
// 買取/販売価格履歴一覧（admin_product_buy_sale_price_history / /search/{page_no}）。
const LIST_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/product/buy_sale_price_history(/search/\\d+)?(\\?|$)`
);
// 仕様: ファイル名 buy_sale_price_{YmdHis}.csv（Controller.php:213）。
const FILENAME_RE = /^buy_sale_price_\d{14}\.csv$/;

// 仕様(BuySalePriceHistoryController.php:189 ハードコード)由来のフラッシュ文言。実装に合わせて変えない。
const ERR_NO_SESSION = "検索条件を指定してからCSVをダウンロードしてください。";

/** 管理ログインしてホームへ到達する。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).toHaveURL(HOME_RE);
}

test.describe(
  "商品管理 > 買取/販売価格履歴 CSV 出力",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== 未認証（資格情報不要・非破壊） =====

    test("E2E-M03-24-020 未ログインで出力ルート直アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      // 権限・認可: 未認証は管理画面共通制約でログインへ。CSV を返さない。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/buy_sale_price_history/export`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M03-24-021 未ログインで一覧URL直アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/buy_sale_price_history`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== セッション欠落エラー（認証要・シード不要） =====

    test("E2E-M03-24-010 検索未実行で出力ルート直アクセス→一覧へリダイレクト", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      // 同一コンテキストで検索を一度も実行していない＝セッションキー null（Controller.php:188）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/buy_sale_price_history/export`);
      // 仕様: 一覧初期ルートへリダイレクト（Controller.php:191）。CSV ストリームは返らない。
      await expect(page).toHaveURL(LIST_RE);
    });

    test("E2E-M03-24-011 検索未実行で出力ルート直アクセス→フラッシュ「検索条件を指定してから…」を表示", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/buy_sale_price_history/export`);
      await expect(page).toHaveURL(LIST_RE);
      const p = new ProductProductBuySalePriceHistoryCsvExportPage(page);
      // 'admin' namespace のフラッシュは管理フレームの .alert-danger に描画される。
      await expect(p.dangerAlert).toContainText(ERR_NO_SESSION);
    });

    // ===== 検索結果あり・CSV リンク／ダウンロード（認証要・要シード履歴） =====

    test("E2E-M03-24-001 検索結果1件以上で一覧に「CSVダウンロード」リンクが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductBuySalePriceHistoryCsvExportPage(page);
      await p.gotoList();
      await p.searchAll(); // 条件なし＝全件ヒット
      test.skip((await p.resultCount()) === 0, "価格履歴が無い（SEED-M03-24-HISTORY）");
      // pagination.totalItemCount>0 のときだけ描画される（buy_sale_price_history.twig:218,247）。
      await p.seeDownloadLink();
    });

    test("E2E-M03-24-002 「CSVダウンロード」リンクが CSV 出力ルートを指す", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductBuySalePriceHistoryCsvExportPage(page);
      await p.gotoList();
      await p.searchAll();
      test.skip((await p.resultCount()) === 0, "価格履歴が無い（SEED-M03-24-HISTORY）");
      // 仕様(利用者視点の入口): href は管理ルート配下の export エンドポイント
      // （/<admin_route>/product/buy_sale_price_history/export）。管理ルート欠落・別ルート誤リンクも検出する。
      await expect(p.csvDownloadLink).toHaveAttribute(
        "href",
        new RegExp(
          `/${ECCUBE_ADMIN_ROUTE}/product/buy_sale_price_history/export(\\?|$)`
        )
      );
    });

    test("E2E-M03-24-003 CSVダウンロード押下→ダウンロード発火・ファイル名 buy_sale_price_{YmdHis}.csv", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductBuySalePriceHistoryCsvExportPage(page);
      await p.gotoList();
      await p.searchAll();
      test.skip((await p.resultCount()) === 0, "価格履歴が無い（SEED-M03-24-HISTORY）");
      const download = await p.clickDownloadAndWait();
      // 仕様: filename="buy_sale_price_{YmdHis}.csv"。CSVの中身は手動確認（ケース表 付帯表）。
      expect(download.suggestedFilename()).toMatch(FILENAME_RE);
    });

    test("E2E-M03-24-004 検索済みセッションで出力ルートGET→octet-stream の添付応答が返る", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductBuySalePriceHistoryCsvExportPage(page);
      await p.gotoList();
      await p.searchAll(); // セッションに検索条件を保存
      test.skip((await p.resultCount()) === 0, "価格履歴が無い（SEED-M03-24-HISTORY）");
      // 認証済みコンテキストで GET し応答ヘッダを観測（ブラウザのダウンロード保存を介さない）。
      const res = await page.context().request.get(p.exportUrl);
      expect(res.status()).toBe(200);
      // 仕様(入出力/処理フロー#8): Content-Type application/octet-stream・Content-Disposition attachment・filename。
      const contentDisposition = res.headers()["content-disposition"] || "";
      expect(res.headers()["content-type"] || "").toContain("application/octet-stream");
      expect(contentDisposition).toContain("attachment");
      expect(contentDisposition).toContain("buy_sale_price_");
    });

    test("E2E-M03-24-008 検索済みセッションで余計なクエリ付き出力GETでも無視され同様にCSVが返る", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductBuySalePriceHistoryCsvExportPage(page);
      await p.gotoList();
      await p.searchAll(); // セッションに検索条件を保存
      test.skip((await p.resultCount()) === 0, "価格履歴が無い（SEED-M03-24-HISTORY）");
      // 仕様(入出力 md:160): GET のみ・クエリパラメータは解釈しない。検索条件はセッションからのみ復元される
      // （Controller.php:188,225-236）。余計なクエリを付けても応答は通常GETと同じ添付CSVになる。
      const res = await page
        .context()
        .request.get(`${p.exportUrl}?dummy=1&page_count=9999`);
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"] || "").toContain("application/octet-stream");
      expect(res.headers()["content-disposition"] || "").toContain("attachment");
    });

    test("E2E-M03-24-006 CSV出力リンク押下時に確認ダイアログ（モーダル/alert）を表示しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductBuySalePriceHistoryCsvExportPage(page);
      await p.gotoList();
      await p.searchAll();
      test.skip((await p.resultCount()) === 0, "価格履歴が無い（SEED-M03-24-HISTORY）");
      // 設計フロント挙動: 出力確認ダイアログは無い・二重押し防止/クライアント検証も無い。
      let dialogShown = false;
      page.on("dialog", async (d) => {
        dialogShown = true;
        await d.dismiss();
      });
      const download = await p.clickDownloadAndWait();
      expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      expect(dialogShown, "出力前の確認ダイアログは表示されない").toBe(false);
    });

    test("E2E-M03-24-012 「CSVダウンロード」リンクは別タブ指定がなく同一タブでダウンロードする", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductBuySalePriceHistoryCsvExportPage(page);
      await p.gotoList();
      await p.searchAll();
      test.skip((await p.resultCount()) === 0, "価格履歴が無い（SEED-M03-24-HISTORY）");
      // 仕様(フロント挙動 md:49「別タブ指定なし」／画面遷移 md:208「同一タブでファイルダウンロード応答」):
      // CSVリンクは通常リンクで target="_blank" を持たない。新規タブ/ウィンドウは開かない。
      const target = await p.csvDownloadLink.getAttribute("target");
      expect(target === null || target !== "_blank").toBe(true);
    });

    // ===== 検索結果0件・送信可否（認証要・要シード履歴） =====

    test("E2E-M03-24-005 検索結果0件のとき「CSVダウンロード」リンクが表示されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductBuySalePriceHistoryCsvExportPage(page);
      await p.gotoList();
      // どの履歴にも一致しないフリーワードで 0 件を作る（実在値を創作しない）。
      await p.searchNoMatch("ZZZ_NO_MATCH_ZZZ_2406");
      // 仕様(m03-24 利用者視点の入口): totalItemCount=0 では CSV ダウンロードリンクを描画しない。
      // ＝本機能 m03-24 のオラクルはこの「リンク非表示」。
      await expect(p.csvDownloadLink).toHaveCount(0);
      // 補助確認: 0 件時のデータ無しメッセージは親機能 m03-23（一覧/検索）の表示仕様由来。
      // m03-24 の合否判定はリンク非表示で行い、本行は一覧描画の補助確認に留める。
      await expect(p.noDataMessage).toBeVisible();
    });

    test("E2E-M03-24-007 0件検索後（セッションあり）に出力ルートGET→リダイレクトせずヘッダ行のみCSVが返る", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductBuySalePriceHistoryCsvExportPage(page);
      await p.gotoList();
      // 0 件でも検索を「実行」する＝セッションに検索ビューデータが保存される（リンク非表示とは独立）。
      await p.searchNoMatch("ZZZ_NO_MATCH_ZZZ_2406");
      // UI 上はリンク非表示だが、実行可否は「セッションキー有無」で決まる（リンク非表示＝送信不可ではない）。
      await expect(p.csvDownloadLink).toHaveCount(0);
      // 仕様(利用者視点の入口・エッジケース / functions/...md:38,135):
      // 検索実行済みでセッションに検索ビューデータが残っていれば、URL 直叩きでも
      // リダイレクトせずヘッダ行のみの CSV（200 / octet-stream / attachment）が返る。
      const res = await page
        .context()
        .request.get(p.exportUrl, { maxRedirects: 0 });
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"] || "").toContain(
        "application/octet-stream"
      );
      expect(res.headers()["content-disposition"] || "").toContain("attachment");
      // ヘッダ1行のみという CSV 内部の中身検査はファイル内部検査＝手動（ケース表 付帯表）。
    });

    test("E2E-M03-24-009 出力ルートへ非GET（POST）アクセスはCSVとして処理されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductBuySalePriceHistoryCsvExportPage(page);
      await p.gotoList();
      await p.searchAll(); // セッションに検索条件を保存（GET以外でも処理されないことを確認するため成功条件を整える）
      test.skip((await p.resultCount()) === 0, "価格履歴が無い（SEED-M03-24-HISTORY）");
      // 仕様(入出力 md:160・処理フロー md:58): 本機能の入力は「HTTP GET のみ」。
      // 出力ルートは GET 限定のため、非GET（POST）は CSV 添付応答にならない（GET専用ルート＝Method Not Allowed）。
      const res = await page
        .context()
        .request.post(p.exportUrl, { maxRedirects: 0 });
      expect(res.status()).not.toBe(200);
      expect(res.headers()["content-type"] || "").not.toContain(
        "application/octet-stream"
      );
    });
  }
);
