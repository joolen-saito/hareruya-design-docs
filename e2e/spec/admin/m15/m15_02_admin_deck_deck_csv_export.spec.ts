/**
 * 管理画面 デッキ管理「デッキ CSV 出力」E2E。
 * 納品ケース表 integration_test/e2e/m15_02_admin_deck_deck_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装し、細工POST/特定データが要るものは test.fixme（理由付き）で残す。
 * 手動・対象外はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m15-02_admin_deck_deck_csv_export.md / 観点表)由来（オラクル独立性）。
 * 実装の現挙動・メッセージ文言・Form制約は期待値に流用しない。CSVの中身は手動確認とする。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * ダウンロード発火(010)は検索結果に1件以上のデッキが必要なため、行が無ければ skip する。
 *
 * 刷新先との乖離（付帯表4）: 設計書(pf-eccube3)の「CSV出力（旧サイト）」ルート/ボタンは ec-cube-enterprise に
 * 存在せず、クライアントalertも実装されていない。該当ケースは test.fixme / ケース表で要確認管理する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { DeckDeckCsvExportPage } from "../../../pages/admin/m15/m15_02_admin_deck_deck_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
// 成功時出力ファイル名: 接頭辞 deck_ ＋ YmdHis ＋ .csv（設計書「入出力」deck_XXXXXXXX.csv）
const DECK_CSV_FILENAME_RE = /^deck_\d{14}\.csv$/;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 デッキ管理 > デッキ CSV 出力",
  { tag: ["@admin", "@deck", "@csv"] },
  () => {
    // ===== 認証ガード（資格情報不要・非破壊） =====

    test("E2E-M15-02-030 未ログインでデッキ一覧URLへアクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      const p = new DeckDeckCsvExportPage(page);
      await p.gotoList();
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M15-02-031 未ログインでCSV出力ルート自体へアクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      // 仕様（権限・認可 / 画面遷移）: CSV出力ルート（POST /<route>/deck/csvexport）も認証済み管理者のみ操作可で、
      // 未認証は管理ログインへ誘導される。030（一覧URL）に対しPOST専用ルート自体の未認証ガードを写像する。
      // GET直アクセスは405想定だが、未認証時は認証ファイヤウォールがログインへ誘導する側を一次オラクルとする。
      const p = new DeckDeckCsvExportPage(page);
      await p.gotoCsvExportRoute();
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 以降は管理ログインが必要 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M15-02-001 検索結果が正のとき一覧に「CSV出力」ボタンが表示される", async ({ page }) => {
        await login(page);
        const p = new DeckDeckCsvExportPage(page);
        await p.gotoList();
        await p.search();
        // 仕様（フロント挙動「表示要素」）: CSV出力ボタンは検索結果サマリーで件数が正のときに描画される。
        // 件数が0なら前提（検索結果が正）を満たさないためデータ不足としてスキップ（データ依存）。
        test.skip((await p.checkboxes.count()) === 0, "検索結果が0件のためCSV出力ボタン表示の前提（件数が正）を満たさない");
        await expect(p.resultCount).toBeVisible();
        await expect(p.csvExportButton).toBeVisible();
      });

      test("E2E-M15-02-005 検索結果一覧が無い（件数未定義）ときCSV出力ボタンが描画されない", async ({ page }) => {
        // 仕様（利用者視点の入口 / フロント挙動「表示要素」）: CSV出力ボタンは検索結果一覧が存在し件数が正のときのみ
        // 描画される。001（件数正で表示）に対する異常系の対として、件数未定義/0件で非描画を写像する。
        await login(page);
        const p = new DeckDeckCsvExportPage(page);
        await p.gotoList(); // 検索を実行しない初期状態（件数未定義）
        // 初期状態で既に件数が正の一覧が描画される実装の場合は前提（件数未定義/0件）を満たさずスキップ（データ依存）。
        test.skip(
          (await p.checkboxes.count()) > 0,
          "初期表示で既に検索結果が描画されており件数未定義/0件の前提を満たさない"
        );
        await expect(p.csvExportButton).toHaveCount(0);
      });

      test("E2E-M15-02-002 各デッキ行に deckId[] チェックボックスが表示される", async ({ page }) => {
        await login(page);
        const p = new DeckDeckCsvExportPage(page);
        await p.gotoList();
        await p.search();
        test.skip((await p.checkboxes.count()) === 0, "検索結果が0件のため対象行なし");
        await expect(p.checkboxes.first()).toBeVisible();
      });

      test("E2E-M15-02-003 #allCheck で全行のチェックボックスが一括オンになる", async ({ page }) => {
        await login(page);
        const p = new DeckDeckCsvExportPage(page);
        await p.gotoList();
        await p.search();
        const n = await p.checkboxes.count();
        test.skip(n === 0, "検索結果が0件のため対象行なし");
        await p.checkAll();
        for (let i = 0; i < n; i++) {
          await expect(p.checkboxes.nth(i)).toBeChecked();
        }
      });

      test("E2E-M15-02-010 デッキを選択しCSV出力すると deck_<日時>.csv がダウンロードされる", async ({
        page,
      }) => {
        await login(page);
        const p = new DeckDeckCsvExportPage(page);
        await p.gotoList();
        await p.search();
        test.skip((await p.checkboxes.count()) === 0, "出力対象のデッキが無いためスキップ");
        await p.checkFirst();
        const download = await p.exportAndWaitDownload();
        // 成功時はCSVダウンロード応答のみ（ファイル名は接頭辞deck_＋タイムスタンプ＋.csv）。中身は手動確認。
        expect(download.suggestedFilename()).toMatch(DECK_CSV_FILENAME_RE);
      });

      test("E2E-M15-02-020 未選択でCSV出力を押すと仕様のクライアントalertで送信が止まりダウンロードされない", async ({
        page,
      }) => {
        await login(page);
        const p = new DeckDeckCsvExportPage(page);
        await p.gotoList();
        await p.search();
        // 仕様（フロント挙動「JS 挙動」）: チェック0件で「CSV出力」クリック時はブラウザ alert
        //「CSV出力するデッキをひとつ以上選択してください。」を出して false を返し送信しない
        // （ダウンロード発火なし・前画面に留まる）。alert文言は設計書由来のオラクルで実装由来ではない。
        // 刷新先 ec-cube-enterprise には当該クライアント抑止が無い（不具合候補#2）ため、本テストは
        // 仕様どおりに書き（alert出現を期待）、実装に無ければ失敗して乖離を検出する＝実装へ寄せない。
        let dialogMessage: string | null = null;
        page.on("dialog", async (d) => {
          dialogMessage = d.message();
          await d.dismiss();
        });
        let downloadFired = false;
        page.on("download", () => {
          downloadFired = true;
        });
        const beforeUrl = page.url();
        await p.clickCsvExport();
        // 仕様の alert が出れば送信されず前画面に留まる。出ない（=刷新先）なら空POSTで遷移し poll が失敗する。
        await expect
          .poll(() => dialogMessage, { message: "未選択クリックで仕様のalertが出ること" })
          .toContain("CSV出力するデッキをひとつ以上選択してください");
        await expect(page).toHaveURL(beforeUrl);
        expect(downloadFired, "未選択時はCSVダウンロードが発火しないこと").toBe(false);
      });
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M15-02-021 クライアント抑止をバイパスした空POSTでサーバが選択空エラー(require)を出し前画面へ戻す（要: JS無効/細工POST）",
      async () => {
        // 期待は仕様(処理フロー手順5 / エラー処理)由来。deckId空のサーバ到達時は admin.csv.error.export.require を
        // フラッシュし Referer（前画面）へ戻す。仕様ではクライアントalertで送信が止まる経路（020）が一次であり、
        // サーバ到達はJS無効/細工POSTでの抑止バイパスが要るため fixme。遷移先/文言の実装乖離は不具合候補#3。
      }
    );

    test.fixme(
      "E2E-M15-02-040 CSRFトークン不正でCSV出力POST→出力されずエラーで一覧へ戻る（要: トークンを改ざんした細工POST）",
      async () => {
        // 期待は仕様(処理フロー/権限)由来。csv_exportのCSRF検証(DeckController.php:681)を、
        // hidden #bulk_form_token を無効値へ書き換えた送信で検証する。実機で要素改ざん手順確認後に実装。
      }
    );

    test.fixme(
      "E2E-M15-02-050 DBに存在しないデッキIDのみ送信→未登録系メッセージで出力抑止（要: 存在しないIDの細工POST）",
      async () => {
        // 期待は仕様(エラー処理: DBヒットなし→出力されず一覧へ戻る)由来。deckId[] に存在しないIDを注入する
        // 細工POSTが必要なため fixme。実装(DeckController.php:699-703)はメッセージを区別しない点は不具合候補#3。
      }
    );

    test.fixme(
      "E2E-M15-02-060 「CSV出力（旧サイト）」で旧サイトレイアウトCSVが出力される（要確認: 刷新先 ec-cube-enterprise に当該ルート/ボタンが存在しない）",
      async () => {
        // 設計書(pf-eccube3)は admin_deck_csv_export_old（POST /deck/csvexport_old）/ #csvexport_old を定めるが、
        // ec-cube-enterprise に実装が無い（不具合候補#1）。旧サイトCSVは正典の必須機能であり、未実装は仕様乖離。
        // 刷新先に追加されるまでE2E化不可のため fixme で残し、仕様どおり「旧サイトCSVが出力される」を期待値とする。
      }
    );
  }
);
