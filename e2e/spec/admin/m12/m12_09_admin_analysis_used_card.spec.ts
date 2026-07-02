/**
 * 管理画面 分析集計「デッキ採用枚数集計 ／ 特集タグ編集CSVダウンロード」E2E。
 * 納品ケース表 integration_test/e2e/m12_09_admin_analysis_used_card_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装し、CSV内容/件数の検証など手動・対象外はケース表で全量管理する
 * （規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m12-09_admin_analysis_used_card.md / 観点表 / 基本設計)由来（オラクル独立性）。
 * 設計書は pf-eccube3 のリバースであり、刷新先 ec-cube-enterprise の実装には設計が定める
 * 「集計結果表示画面」「セッション保持・引き継ぎ」「形式指定 /export/{mode}」「なりすまし対策トークン」が無い
 * ＝ケース表 付帯表4（不具合候補・仕様乖離）。テストは仕様どおりの観測可能な範囲（CSVエクスポート画面）で書く。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 010/011（ダウンロード発火）はフォーマットマスタ(MtbFormat)に選択肢が1件以上必要（SEED-M12-09-FORMAT）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AnalysisUsedCardPage } from "../../../pages/admin/m12/m12_09_admin_analysis_used_card.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様: ファイル名は集計対象と日時を含むCSV。拡張子のみ仕様由来で判定し、接頭辞 `used_card_product_` 等は
// 実装/サービス由来値のためオラクル化しない（オラクル独立性）。
const FILENAME_RE = /\.csv$/;
const USED_CARD_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/analysis/used-card(\\?|$)`);
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 分析集計 > デッキ採用枚数集計（特集タグ編集CSVダウンロード）",
  { tag: ["@admin", "@analysis", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要・常時実行可） =====

    test("E2E-M12-09-050 未ログインで集計画面URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/analysis/used-card`);
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可: 未ログインはアクセス不可
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M12-09-051 未ログインでCSV出力POST先へPOSTするとCSVを返さずアクセス不可になる", async ({ page }) => {
      // 認証ガードはコントローラ前のファイアウォールで働く。CSV出力エンドポイントへ未ログインでPOSTし、
      // CSV添付を返さず管理ログインへ誘導（リダイレクト/認可エラー）されることを観測する（権限・認可: アクセス不可）。
      const resp = await page.request.post(
        `/${ECCUBE_ADMIN_ROUTE}/analysis/used-card`,
        { maxRedirects: 0, failOnStatusCode: false }
      );
      expect([301, 302, 303, 401, 403]).toContain(resp.status()); // 未ログインPOSTはCSV(200添付)を返さない
      const contentDisposition = resp.headers()["content-disposition"] ?? "";
      expect(contentDisposition).not.toMatch(/attachment/); // CSVファイルを出力していないこと
    });

    // ===== 画面表示・CSV出力（ログイン必須） =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M12-09-001 画面に集計期間・フォーマット・基本土地・CSVダウンロードボタンが表示される", async ({
        page,
      }) => {
        await login(page);
        const p = new AnalysisUsedCardPage(page);
        await p.goto();
        await p.seeSearchForm(); // 出力条件の検索フォーム・CSVダウンロードの導線（仕様: フロント挙動 表示要素）
      });

      test("E2E-M12-09-002 集計画面がHTTP200で表示され検索フォームが表示される", async ({ page }) => {
        await login(page);
        const p = new AnalysisUsedCardPage(page);
        const resp = await page.goto(p.url);
        expect(resp?.status()).toBe(200); // IT-25 HTTPステータス
        await expect(page).toHaveURL(USED_CARD_RE);
        await expect(p.searchForm).toBeVisible();
      });

      test("E2E-M12-09-010 有効な出力条件でCSVダウンロードが発火し画面遷移しない", async ({ page }) => {
        // SEED-M12-09-FORMAT: フォーマット選択肢が1件以上存在すること（無い場合 selectFirstFormat が失敗＝シード不足）。
        await login(page);
        const p = new AnalysisUsedCardPage(page);
        await p.goto();
        await p.selectFirstFormat(); // 開始日は既定値が入っているためフォーマット選択のみで有効条件
        const download = await p.downloadAndWait();
        expect(download.suggestedFilename()).toMatch(FILENAME_RE); // 仕様: ファイル名は集計対象と日時を含む
        // 画面遷移しない（CSVはストリーミング出力で別画面へ遷移しない）。
        await expect(page).toHaveURL(USED_CARD_RE);
      });

      test("E2E-M12-09-011 CSVダウンロード後も集計画面に留まる", async ({ page }) => {
        await login(page);
        const p = new AnalysisUsedCardPage(page);
        await p.goto();
        await p.selectFirstFormat();
        await p.downloadAndWait();
        await expect(page).toHaveURL(USED_CARD_RE); // 画面遷移せずCSVを出力する（仕様: 画面遷移）
      });

      test("E2E-M12-09-012 集計期間（開始日・終了日）とフォーマットを指定してCSVが出力され画面遷移しない", async ({
        page,
      }) => {
        // 仕様: 入力項目「出力条件＝集計範囲の指定」／集計条件「出力条件に従う採用枚数の集計」。
        // 集計期間（範囲）を明示指定する正常系。CSVの内容・件数・集計値は手動（ここでは発火と非遷移のみ判定）。
        await login(page);
        const p = new AnalysisUsedCardPage(page);
        await p.goto();
        // 集計期間の範囲を明示指定（YYYY-MM-DD）。値そのものは仕様の「範囲指定」を満たす任意の有効日付。
        await p.fillDateRange("2024-01-01", "2024-12-31");
        await p.selectFirstFormat();
        const download = await p.downloadAndWait();
        expect(download.suggestedFilename()).toMatch(FILENAME_RE); // 仕様: ファイル名は集計対象と日時を含む
        await expect(page).toHaveURL(USED_CARD_RE); // 画面遷移しない
      });

      // 出力条件の必須/任意は仕様乖離（要確認）。設計書「入力項目＝出力条件は任意」が上位オラクルだが、
      // 実装は formats Count(min:1) / start_date NotBlank で必須。`downloaded===false` は実装Form制約由来の
      // オラクル混入のため固定しない。仕様(任意)由来の期待＝「出力される」は実装で失敗＝検出見込みのため test.fixme。
      // 必須/任意の正が確定（付帯表4#5）し、エラー領域セレクタ（used_card.twig:44/36 form_errors）を実機確認後に実装する。
      test.fixme(
        "E2E-M12-09-020 出力条件（フォーマット）未指定で送信時の挙動（設計は任意・実装はCount(min:1)＝付帯表4#5・要確認）",
        async () => {
          // 期待は仕様(出力条件＝任意)由来＝CSVが出力されること。実装はCount(min:1)で再表示するため失敗で検出見込み。
        }
      );

      test.fixme(
        "E2E-M12-09-021 開始日未入力で送信時の挙動（設計は任意・実装はNotBlank＝付帯表4#5・要確認）",
        async () => {
          // 期待は仕様(出力条件＝任意)由来＝CSVが出力されること。実装はstart_date NotBlankで再表示するため失敗で検出見込み。
        }
      );

      // なりすまし対策トークン（CSRF）は設計書「入力」に明記。実装は SearchUsedCardType.php:34-36 で
      // csrf_protection=false＝トークン無し（付帯表4#4）。仕様由来の期待＝フォームにCSRF hidden(_token)が存在することは
      // 実装で失敗＝検出見込みのため test.fixme（実機でセレクタ #search_form input[name$="[_token]"] 確認後に実装）。
      test.fixme(
        "E2E-M12-09-040 出力条件フォームになりすまし対策トークン（CSRF hidden）が含まれる（実装は csrf_protection=false＝付帯表4#4）",
        async () => {
          // 期待は仕様(入力「なりすまし対策トークン」)由来＝CSRF hidden(_token)が存在すること。実装は無効化のため失敗で検出見込み。
        }
      );
    });
  }
);
