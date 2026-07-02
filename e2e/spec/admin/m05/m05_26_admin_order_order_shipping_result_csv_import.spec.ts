/**
 * 管理画面 受注管理「出荷実績インポート登録」E2E（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m05_26_admin_order_order_shipping_result_csv_import_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケース（画面表示・UI部品・未認証誘導）のみ実装し、
 * 取込実行(成功/各種エラー)は破壊的経路かつ要受注シード/要CSV/要ロック操作のため test.fixme（理由付き）で残す。
 * 手動・対象外はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md / 観点表 / 基本設計)由来（オラクル独立性）。
 * 実装の現挙動・Form制約(NotBlank/File maxSize)・成功文言・ロック方式は期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 重要（設計＝pf-eccube3 HareruyaEc プラグイン、刷新先 ec-cube-enterprise とで乖離あり。ケース表 付帯表4 参照）:
 *  - POSTパス: 設計 `/order/shipping_result_csv/upload` ／ 刷新先は GET と同一 path `/order/shipping_result_csv/import`（methods=POST）。
 *  - ボタン文言: 設計「CSV，TSVファイルのアップロード」／ 刷新先「CSVファイルのアップロード」。
 *  - ロック: 設計 MySQL GET_LOCK ／ 刷新先 advisory lock。
 *  テストは仕様どおりに書き、実装が違えば落ちて検出する（期待値を実装へ書き換えない）。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OrderOrderShippingResultCsvImportPage } from "../../../pages/admin/m05/m05_26_admin_order_order_shipping_result_csv_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// オラクル独立性: 期待は設計書（表示メッセージ＝意味）由来。刷新先 messages.ja.yaml / Twig の完全一致文言は
// 実装由来オラクルとして固定しない（過去版で固定していた SPEC_FORMAT_ERROR 等の messages キー直書きは除去済み）。
// 設計 フロント挙動(設計書:43) の見出しは「出荷実績登録CSV，TSV に相当する文言」。完全一致ではなく、
// 設計が保証する語を substring 照合する（実装文言「…アップロード」へ寄せない）。
const HEADING_TOKEN = "出荷実績"; // 設計 利用者視点の入口/フロント挙動: 見出し相当に含まれる語
const HEADING_CSV_TOKEN = "CSV"; // 設計 アップロードカード見出しに含まれる CSV の語
const FORMAT_TOKEN = "フォーマット"; // 設計 フロント挙動/バリデーション: 列一覧フォーマット表の見出し相当

const IMPORT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/order/shipping_result_csv/import(\\?|$)`);
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 受注管理 > 出荷実績インポート登録",
  { tag: ["@admin", "@order", "@csv"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M05-26-020 未ログインで出荷実績インポートURL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order/shipping_result_csv/import`);
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可: 未ログインは管理ログインへ
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 画面表示（要管理ログイン・非破壊） =====

    test("E2E-M05-26-001 画面UI: ファイル選択ボタン・アップロードボタン・フォーマット表が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M05-26-ADMIN）");
      await login(page);
      const csv = new OrderOrderShippingResultCsvImportPage(page);
      await csv.goto();
      await csv.seeUploadForm();
    });

    test("E2E-M05-26-002 画面に「出荷実績登録CSVアップロード」「出荷実績登録CSVファイルフォーマット」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new OrderOrderShippingResultCsvImportPage(page);
      await csv.goto();
      // 設計が保証する語の substring 照合（実装の完全一致文言へ寄せない）。
      await expect(page.locator("body")).toContainText(HEADING_TOKEN); // アップロードカード見出し相当（出荷実績）
      await expect(page.locator("body")).toContainText(HEADING_CSV_TOKEN); // CSV の語
      await expect(csv.formatCard).toContainText(FORMAT_TOKEN); // フォーマット表見出し相当
    });

    test("E2E-M05-26-003 フォーマット表の先頭列が「注文番号」で「出荷日」「送り状No.」列が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new OrderOrderShippingResultCsvImportPage(page);
      await csv.goto();
      // 仕様(業務ルール・計算 / ファイル内の論理入力): 注文番号は突合鍵（先頭列）。出荷日・送り状No. が列として並ぶ。
      await expect(csv.formatHeaderRow.locator("th").first()).toHaveText("注文番号");
      await expect(csv.formatHeaderRow).toContainText("出荷日");
      await expect(csv.formatHeaderRow).toContainText("送り状No.");
    });

    test("E2E-M05-26-004 初期表示で確認ダイアログ・モーダル・ポップアップが表示されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new OrderOrderShippingResultCsvImportPage(page);
      await csv.goto();
      // 仕様(フロント挙動 モーダル・ポップアップ): アップロード前の確認ダイアログは設けられていない。
      await expect(page.locator(".modal.show")).toHaveCount(0);
    });

    test("E2E-M05-26-005 アップロード（送信）ボタンが画面に表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new OrderOrderShippingResultCsvImportPage(page);
      await csv.goto();
      // 仕様(フロント挙動 JS挙動): プラグインテンプレートは送信ボタン中心の経路。送信ボタンの存在を観測する。
      // 注: file未選択時の活性制御は実装JS依存(twig:29 change時のみ活性化、初期disabledなし)＝活性可否はオラクル化しない（要実機確認）。
      await expect(csv.uploadButton).toBeVisible();
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M05-26-030 ファイル未選択でアップロード→エラー表示・取込されず画面復帰（要実機: 設計はフォーム妥当性のリダイレクト返却が呼び出し元で返却しきれない盲点=不具合候補#6。flash表示位置を実機確認）",
      async () => {
        // 期待は仕様(バリデーション「アップロードファイル必須」)由来＝意味（ファイル選択を促すエラー・取込されず同画面復帰）。
        // 完全一致文言（messages の require キー文言）はオラクル化しない。復帰先は設計 画面遷移節の …/import。
        void IMPORT_RE;
      }
    );

    test.fixme(
      "E2E-M05-26-031 ヘッダ不一致CSV→フォーマット誤りで取込されず画面復帰（要CSV: 非破壊だがロック取得後のヘッダ照合に到達。要実機）",
      async () => {
        // 期待は仕様(処理フロー#8 期待ヘッダと不一致でフォーマット誤り異常終了)由来＝意味。
        // 完全一致文言（messages の format.header キー文言）はオラクル化しない。
        void IMPORT_RE;
      }
    );

    test.fixme(
      "E2E-M05-26-032 データ行0件のCSV→空データエラーで取込されず画面復帰（要CSV。要実機）",
      async () => {
        // 期待は仕様(処理フロー#9 データ行が無ければ異常終了)由来＝意味。
        // 完全一致文言（messages の data.empty キー文言）はオラクル化しない。
        void IMPORT_RE;
      }
    );

    test.fixme(
      "E2E-M05-26-033 同種CSV処理のロック保持中に再実行→「既に処理中」相当エラーで一覧へ復帰（要: 同時実行/advisory lock 保持状態の生成）",
      async () => {
        // 期待は仕様(エッジケース 同時処理のロックが取れない / 処理フロー#6)由来＝意味（「既に処理中」を意味するエラーで一覧復帰）。
        // 完全一致文言（messages の already_executing キー文言）はオラクル化しない。刷新先は advisory lock(=不具合候補#4)。
        void IMPORT_RE;
      }
    );

    test.fixme(
      "E2E-M05-26-060 正常CSV取込→成功フラッシュ表示し出荷実績インポート画面へ復帰（要受注シード・要CSV・破壊的: 親注文状態/出荷日/送り状No./配送コミット日時/ポイントを更新）",
      async () => {
        // 期待は仕様(処理フロー#15-18 成功時 成功メッセージ＋同画面へリダイレクト)由来。
        // 取込後のDB原値照合(IT-16/IT-24/IT-27)は手動/間接。成功文言は刷新先で「登録が完了しました。」=不具合候補#3。
      }
    );

    test.fixme(
      "E2E-M05-26-061 出荷日が空の行はスキップ（親・サブ・伝票・配送コミット日時を更新しない）（要受注シード・破壊的。DB原値は手動/間接）",
      async () => {
        // 期待は仕様(処理フロー#12 出荷日が空なら continue でスキップ)由来。取込結果はDB照合のため手動/間接。
      }
    );

    test.fixme(
      "E2E-M05-26-062 出荷日ありで会員未紐付けの行→異常終了し取込されず画面復帰（要受注シード(会員なし)・要CSV）",
      async () => {
        // 期待は仕様(処理フロー#13 出荷日あり＆親注文に会員が紐付いていない場合は異常終了)由来。
      }
    );

    test.fixme(
      "E2E-M05-26-063 注文番号がサブ注文に未存在→行番号付きエラーで異常終了（要CSV。行エラーは画面フラッシュで観測・要実機）",
      async () => {
        // 期待は仕様(処理フロー#11 桁埋め注文番号で検索し無ければ行番号付きエラーで異常終了)由来。
      }
    );

    // ===== 監査追記（網羅の穴埋め）: いずれも理由付き保留。手動/間接(039/040/022/065/066)はケース表で管理しspec未実装 =====

    test.fixme(
      "E2E-M05-26-006 受注管理メニューから出荷実績インポート画面へ遷移（要実機: 側メニューのナビDOM/リンク文言が未確定。設計の入口=側メニュー配下からの遷移）",
      async () => {
        // 期待は仕様(利用者視点の入口 側メニュー「受注管理」配下から当画面へ遷移)由来＝意味（…/import が表示）。
        // ナビのリンク文言/セレクタは要実機確認（実装文言へ寄せない）。
        void IMPORT_RE;
      }
    );

    test.fixme(
      "E2E-M05-26-021 CSRFトークン欠落/改ざんでアップロード→取込されず副作用なし（要トークン操作。トークン値はオラクル化しない）",
      async () => {
        // 期待は仕様(入出力 CSRF用トークン / 権限・認可)由来＝意味（リクエスト不受理・対象データ不変＝副作用なし）。
        // トークンのCookie名/フィールド名/文言は固定しない。
        void IMPORT_RE;
      }
    );

    test.fixme(
      "E2E-M05-26-034 列数不一致の行を含むCSV→行番号付きエラーで異常終了し取込されず復帰（要CSV）",
      async () => {
        // 期待は仕様(処理フロー#11 各行の列数一致を検証・不一致は行番号付きエラーで異常終了)由来＝意味。063(未存在注文番号)とは別分岐。
        void IMPORT_RE;
      }
    );

    test.fixme(
      "E2E-M05-26-035 注文番号が空の行を含むCSV→行番号付きエラーで異常終了し取込されず復帰（要CSV）",
      async () => {
        // 期待は仕様(処理フロー#11 注文番号必須・空なら行番号付きエラーで異常終了 / ファイル内の論理入力 注文番号)由来＝意味。
        void IMPORT_RE;
      }
    );

    test.fixme(
      "E2E-M05-26-036 出荷日が日時として解釈できない行を含むCSV→異常終了し取込されず復帰（要CSV）",
      async () => {
        // 期待は仕様(処理フロー#14 出荷日を日時コンストラクタで解釈・例外なら異常終了)由来＝意味。
        void IMPORT_RE;
      }
    );

    test.fixme(
      "E2E-M05-26-037 0バイト（空）ファイルをアップロード→取込されず画面復帰（処理フロー#3 サイズ0でもオブジェクト経路に残りうる境界。flash/エラー位置は要実機）",
      async () => {
        // 期待は仕様(処理フロー#3 / 入力項目 ファイル必須の境界)由来＝意味（取込されず同画面復帰）。030(未選択)とは別分岐。
        void IMPORT_RE;
      }
    );

    test.fixme(
      "E2E-M05-26-038 サイズ上限を超えるファイルをアップロード→ファイルサイズエラーで取込されず復帰（要大容量ファイル。上限値はオラクル化しない）",
      async () => {
        // 期待は仕様(バリデーション アップロードファイル Symfonyのサイズ上限 eccube_csv_size 相当・境界 上限+1)由来＝意味。
        void IMPORT_RE;
      }
    );

    test.fixme(
      "E2E-M05-26-064 正常なTSV（拡張子tsv・タブ区切り）取込→成功フラッシュ表示し画面へ復帰（要受注シード・破壊的。区切り適用後のDB原値は手動/間接）",
      async () => {
        // 期待は仕様(処理フロー#4 拡張子tsv のとき区切りはタブ / 成功時 同画面復帰)由来＝意味。060(CSV正常)に対するTSV正常系。
        void IMPORT_RE;
      }
    );
  }
);
