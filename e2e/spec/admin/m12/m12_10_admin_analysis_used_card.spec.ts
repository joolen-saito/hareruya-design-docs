/**
 * 管理画面 分析・集計 > デッキ採用枚数集計（特集タグ編集CSVダウンロード） E2E。
 * 納品ケース表 integration_test/e2e/m12_10_admin_analysis_used_card_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装する（手動/対象外・間接はケース表で全量管理＝specに大量fixmeを残さない）。
 * 期待結果は仕様(functions/pf-eccube3/m12-10_admin_analysis_used_card.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 重要（仕様乖離）: 設計書は pf-eccube3 のリバースで、刷新先 ec-cube-enterprise 実装と大きく乖離する
 *  （集計結果画面・出力条件のセッション保持・mode別形式出力・CSRFトークンが実装に無い＝ケース表 付帯表4）。
 *  本specは仕様どおりに書き、実装欠落・要確認の分岐は test.fixme で抜け漏れ可視化する。
 *
 * 実行方針（安全第一・共有ステージング・本機能は参照のみで非破壊）:
 *  - 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - CSVダウンロード(010/011)はフォーマットマスタ(mtb_format)に1件以上の選択肢が必要（SEED-M12-10-FORMAT）。
 *  - 入力バリデーション(030/031)は設計書が定めない仕様乖離（実装はNotBlank/Count）。期待値は仕様(任意)由来のため
 *    実機の表示挙動を確認したうえで test.fixme で管理する。
 *  - CSV内容(採用枚数集計値)・DB検索内部レコード・ログ秘匿はブラウザ観測外/手動＝ケース表で対象外/手動管理。
 *
 * 資格情報（環境変数。コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AnalysisUsedCardPage } from "../../../pages/admin/m12/m12_10_admin_analysis_used_card.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 実装パスはハイフン `used-card`（設計書のアンダースコア表記とは差異＝ケース表 付帯表4#4）。
const USED_CARD_PATH = `/${ECCUBE_ADMIN_ROUTE}/analysis/used-card`;
const LOGIN_RE = /\/login(\?|$)/;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 > 分析・集計 > デッキ採用枚数集計（特集タグ編集CSVダウンロード）",
  { tag: ["@admin", "@analysis"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M12-10-020 未ログインで採用枚数集計URL→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      await page.goto(USED_CARD_PATH);
      // 権限・認可「未ログイン管理者＝アクセス不可」。採用枚数集計画面を表示せずログインへ。
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 検索フォーム表示（SEED-M12-10-ADMIN） =====

    test("E2E-M12-10-001 入口GETで採用枚数集計の検索フォームが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "管理資格情報(ECCUBE_ADMIN_USER/PASS)未設定");
      await login(page);
      const target = new AnalysisUsedCardPage(page);
      await target.goto();
      await target.seeSearchForm();
    });

    test("E2E-M12-10-002 検索フォームに集計期間・フォーマット・基本土地を含めるが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "管理資格情報未設定");
      await login(page);
      const target = new AnalysisUsedCardPage(page);
      await target.goto();
      // 設計書「表示要素＝出力条件の検索フォーム」を入力要素の構造存在で確認する。
      // ラベル文言(集計期間/フォーマット/基本土地を含める)は messages.ja.yaml 由来＝実装オラクルのため
      // 合否判定には用いない（オラクル独立性。「基本土地を含める」は設計書に項目記載が無い実装由来項目）。
      await expect(target.startDate).toBeVisible();
      await expect(target.formats).toBeVisible();
      await expect(target.includeBasic).toBeVisible();
    });

    test("E2E-M12-10-003 検索フォームに条件クリア導線が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "管理資格情報未設定");
      await login(page);
      const target = new AnalysisUsedCardPage(page);
      await target.goto();
      // 設計書「初期表示で保持していた出力条件を消去」の導線(a.search-clear)を構造で確認する。
      // リンク文言「検索条件をクリア」は messages.ja.yaml:1545 由来＝実装オラクルのため合否に用いない。
      // 実装はクライアントリセット（付帯表4#7）。導線の存在で判定する。
      await expect(target.searchClearLink).toBeVisible();
    });

    test("E2E-M12-10-021 ログイン済みでURL直接アクセスすると検索フォームが200表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "管理資格情報未設定");
      await login(page);
      const target = new AnalysisUsedCardPage(page);
      const resp = await page.goto(target.url);
      expect(resp?.status()).toBe(200); // 移植先に画面が存在すること
      await expect(target.searchForm).toBeVisible();
    });

    // ===== CSVダウンロード（SEED-M12-10-FORMAT） =====

    test("E2E-M12-10-010 有効な出力条件で送信するとCSVがダウンロードされる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "管理資格情報未設定");
      await login(page);
      const target = new AnalysisUsedCardPage(page);
      await target.goto();
      // 集計期間 開始日は既定値(2週間前)が入る。フォーマットを1件選択して必須を満たす。
      await target.selectFirstFormat();
      // 設計書「画面遷移せずCSVを出力」「成功時出力＝指定形式のCSVファイル」。DL発火を観測する。
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        target.clickDownload(),
      ]);
      expect(download).toBeTruthy();
    });

    test("E2E-M12-10-011 CSVダウンロードの応答が.csv添付ファイルとして返る", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "管理資格情報未設定");
      await login(page);
      const target = new AnalysisUsedCardPage(page);
      await target.goto();
      await target.selectFirstFormat();
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        target.clickDownload(),
      ]);
      // 設計書「ファイル名は形式と日時を含む」。ファイル名形式は実装値のため拡張子のみ仕様で判定する。
      expect(download.suggestedFilename()).toMatch(/\.csv$/);
    });

    // ===== 保留（仕様乖離・要実機確認。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M12-10-030 集計期間(開始日)未入力で送信時の挙動（設計は任意・実装はNotBlank＝仕様乖離 付帯表4#5）",
      async () => {
        // 期待は仕様(入力項目「出力条件＝任意」)由来＝出力されること。実装はNotBlankで再表示するため失敗で検出見込み。
        // エラー領域(form_errors used_card.twig:36)のセレクタを実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M12-10-031 フォーマット未選択で送信時の挙動（設計は任意・実装はCount min1＝仕様乖離 付帯表4#5）",
      async () => {
        // 期待は仕様(入力項目「出力条件＝任意」)由来＝出力されること。実装はCount min1で再表示するため失敗で検出見込み。
        // エラー領域(form_errors used_card.twig:44)のセレクタを実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M12-10-040 検索フォームにCSRFトークン（隠しフィールド）が存在する（設計は必須・実装は無し＝仕様乖離 付帯表4#6）",
      async () => {
        // 期待は仕様(入出力「入力＝なりすまし対策トークン」)由来＝フォーム内に隠しトークンが存在すること。
        // 実装は csrf_protection=false（SearchUsedCardType.php:35）でトークンを持たないため失敗で検出見込み。
        // セレクタ: form#search_form 内 input[type=hidden][name$="[_token]"] を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M12-10-041 検索（POST）で集計結果画面が表示される（設計は結果画面・実装は直接CSV出力＝仕様乖離 付帯表4#1）",
      async () => {
        // 期待は仕様(画面遷移「検索→集計結果画面」/処理フロー「POSTで集計結果を表示」)由来＝集計結果画面が表示されること。
        // 実装は POST で画面遷移せず直接CSVをストリーミング出力（UsedCardController.php:52-65）するため失敗で検出見込み。
        // 集計結果画面(admin_used_card_result 相当)の表示要素セレクタを実機確認後に実装。
      }
    );
  }
);
