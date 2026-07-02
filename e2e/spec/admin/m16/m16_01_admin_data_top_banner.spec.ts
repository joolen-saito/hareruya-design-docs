/**
 * 管理画面 データ管理 — トップバナー管理（バナー設定）E2E。
 * 納品ケース表 integration_test/e2e/m16_01_admin_data_top_banner_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」かつ非破壊で安全に実行できるケースを test として実装し、破壊的（バナー設定保存/アップロード/削除）や
 * 専用シード・画像fixtureが必要なケースは test.fixme（理由付き）で抜け漏れを可視化する。手動/間接・対象外はケース表で全量管理し、
 * specに大量のfixmeを残さない（規約準拠）。
 * 期待結果は仕様(設計書 functions/pf-eccube3/m16-01_admin_data_top_banner.md / 観点表 / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約値（max/min/Length/NotBlank）を期待値に流用しない。
 * 本設計書は現行 pf-eccube3（HareruyaEc プラグイン）のリバースであり、刷新先 ec-cube-enterprise（コア）との
 * ルート(/banner/top→/data/top_banner)・フォーム名・絞り込み・サーバー検証の有無の乖離はケース表 付帯表4 に分離する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も @playwright/test を
 * 直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 *
 * シード（環境変数。コミットしない）。詳細はケース表 付帯表3:
 *  - SEED-M16-01-BANNER : 参照系（バナー枠1件以上・先頭枠 image_url 設定済）。HAS_CREDS で代替可（マスタ既定枠）。
 *  - SEED-M16-01-BANNER-RW / -FILE / -MULTISHOP : 破壊的・専用（fixme）。
 *  - FIXTURE-IMAGE / -NONIMAGE / -OVERSIZE : アップロード用画像fixture（fixme）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { DataTopBannerPage } from "../../../pages/admin/m16/m16_01_admin_data_top_banner.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 正規表現メタ文字を含み得る環境可変値（ECCUBE_ADMIN_ROUTE）を安全にURLアサーションへ埋め込む。
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// 上位オラクルは設計書ルート「/{admin}/banner/top」。刷新先実装は /{admin}/data/top_banner（付帯表4#9）。
// ナビゲーションは実装ルートを位置情報として用い、滞留/遷移の合否は「同一トップバナー管理URLに留まる/戻る」で判定する。
const LIST_RE = new RegExp(
  `/${escapeRe(ECCUBE_ADMIN_ROUTE)}/data/top_banner(/[a-z0-9]+)?(\\?|#|$)`
);
const LOGIN_RE = /\/login(\?|$)/;

// 仕様(messages.ja.yaml / validators.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const ERR_IMAGE_URL_REGEX = "admin.hareruyamtg.com"; // 画像URL regex_error（指定不可）validators.ja.yaml:127
const ERR_SORT_EMPTY = "並び順が空"; // sort_no_required validators.ja.yaml:130（部分一致）
const ERR_SORT_DUP = "並び順が重複"; // sort_no_duplicate validators.ja.yaml:131（部分一致）
const ERR_UPLOAD_REQUIRED = "画像ファイルを選択してください"; // upload_required messages.ja.yaml:5807

async function adminLogin(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 > データ管理 — トップバナー管理（バナー設定）",
  { tag: ["@admin", "@data", "@top_banner"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M16-01-060 未認証でトップバナー管理URL直接→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/data/top_banner`);
      await expect(page.locator("#login_id")).toBeVisible(); // 権限・認可: 未認証は管理ログインへ
      await expect(page).toHaveURL(LOGIN_RE);
    });

    // ===== ログイン必須・非破壊（画面表示／UI部品） =====

    test("E2E-M16-01-001 画面が開きタイトル「データ管理」「トップバナー管理」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M16-01-BANNER）");
      await adminLogin(page);
      const banner = new DataTopBannerPage(page);
      await banner.goto();
      // 設計書(フロント挙動)：ブロックタイトル「データ管理」・サブタイトル「トップバナー管理」。
      // 実装は title/sub_title の割当が逆（不具合候補#1）。設計どおりの配置(block title=データ管理 /
      // sub_title=トップバナー管理)を期待し、乖離はテスト失敗で検出する（実装へ寄せない＝オラクル独立）。
      // セレクタ .c-pageTitle__title / __subTitle は位置情報（default_frame.twig:196 のDOMスロット）由来。
      await expect(page.locator(".c-pageTitle__title")).toContainText("データ管理");
      await expect(page.locator(".c-pageTitle__subTitle")).toContainText("トップバナー管理");
    });

    test("E2E-M16-01-002 上部に案内文が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const banner = new DataTopBannerPage(page);
      await banner.goto();
      await expect(page.locator("body")).toContainText("画像とリンク先を入力・変更してください");
      await expect(page.locator("body")).toContainText("空欄にすると表示から削除されます");
    });

    test("E2E-M16-01-003 「バナー設定」ボタンが上下2箇所に表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const banner = new DataTopBannerPage(page);
      await banner.goto();
      await expect(banner.settingButton).toHaveCount(2); // 設計: 上下2箇所
    });

    test("E2E-M16-01-004 各バナー枠に画像URL・リンク・言語・表示タイプ・alt・並び順の入力欄が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（バナー枠1件以上）");
      await adminLogin(page);
      const banner = new DataTopBannerPage(page);
      await banner.goto();
      await banner.seeFirstBannerRow();
    });

    test("E2E-M16-01-005 アップロードエリアに店舗選択・ファイル入力・アップロードボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const banner = new DataTopBannerPage(page);
      await banner.goto();
      await expect(banner.uploadBaseInfo).toBeVisible();
      await expect(banner.uploadFile).toBeVisible();
      await expect(banner.uploadButton).toBeVisible();
    });

    test("E2E-M16-01-006 画像一覧テーブルの見出し（画像/更新日時/画像URL/削除）が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const banner = new DataTopBannerPage(page);
      await banner.goto();
      await expect(banner.fileListTable).toContainText("画像");
      await expect(banner.fileListTable).toContainText("更新日時");
      await expect(banner.fileListTable).toContainText("画像URL");
      await expect(banner.fileListTable).toContainText("削除");
    });

    test("E2E-M16-01-007 店舗絞り込みドロップダウンに既定「全て」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const banner = new DataTopBannerPage(page);
      await banner.goto();
      await expect(banner.filterLabel).toContainText("全て"); // filter_all（絞り込みなし時の既定）
    });

    test("E2E-M16-01-008 プレビュー画像のsrcが各行の画像URL値を表示する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（image_url設定済の枠）");
      await adminLogin(page);
      const banner = new DataTopBannerPage(page);
      await banner.goto();
      // 設計(データ整合性): プレビュー img src は各行の入力値（旧URL）。
      const src = await banner.previewImages.first().getAttribute("src");
      const inputVal = await banner.imageUrlInputs.first().inputValue();
      expect(src).toBe(inputVal);
    });

    test("E2E-M16-01-009 「▼画像設定」アンカーで #upload_wrap アップロード領域へ移動する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M16-01-BANNER）");
      await adminLogin(page);
      const banner = new DataTopBannerPage(page);
      await banner.goto();
      // 設計(利用者視点の入口): 「▼画像設定」/ページ内アンカーで #upload_wrap へスクロールする。
      await banner.uploadAnchor.first().click();
      await expect(page).toHaveURL(/#upload_wrap$/);
      await expect(banner.uploadWrap).toBeVisible();
    });

    test("E2E-M16-01-015 全バナー枠のフォームが枠数分（id昇順全件）表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（バナー枠1件以上・理想2件以上）");
      await adminLogin(page);
      const banner = new DataTopBannerPage(page);
      await banner.goto();
      // 設計(処理フローGET): mtb_top_banner を id 昇順で全件取得し、各 id ごとに表を分割して全枠表示する。
      // 観測は破壊せず、各枠が画像URL欄・並び順欄・プレビューを枠数分そろえること（全件描画）で代替判定する。
      const rows = await banner.imageUrlInputs.count();
      expect(rows).toBeGreaterThanOrEqual(1);
      await expect(banner.sortNoInputs).toHaveCount(rows);
      await expect(banner.previewImages).toHaveCount(rows);
    });

    test("E2E-M16-01-051 絞り込みドロップダウンに「全て」（絞り込み解除）項目が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const banner = new DataTopBannerPage(page);
      await banner.goto();
      // 設計(利用者視点の入口/画面遷移): narrow から「全て」へ戻るリンクが出る（絞り込み解除＝base 一覧）。
      // base 表示では遷移自体は破壊的でないため、「全て」項目が絞り込みなし一覧URLを指すこと（戻り口の存在）を観測する。
      await banner.filterSummary.click();
      await expect(banner.filterAllItem).toContainText("全て");
      const href = await banner.filterAllItem.getAttribute("href");
      expect(href).toMatch(/\/data\/top_banner(#upload_wrap)?$/);
    });

    // ===== バリデーション異常系（POST失敗で再描画＝非破壊・保存されない） =====

    test("E2E-M16-01-020 画像URLに admin.hareruyamtg.com を含めて保存→エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const banner = new DataTopBannerPage(page);
      await banner.goto();
      await banner.imageUrlInputs.first().fill("https://admin.hareruyamtg.com/banner.png");
      await banner.submitSetting();
      await expect(page).toHaveURL(LIST_RE); // 保存されず同一画面に滞留
      await expect(banner.flashSuccess).toHaveCount(0); // 成功にはならない
      // 期待は仕様(画像URL regex 禁止)由来。エラー表示を主観測（沈黙再描画を排除）。
      await expect(page.locator("body")).toContainText(ERR_IMAGE_URL_REGEX);
    });

    test("E2E-M16-01-021 画像URLが最大長(255)超過→長さエラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const banner = new DataTopBannerPage(page);
      await banner.goto();
      await banner.imageUrlInputs.first().fill("a".repeat(256)); // 仕様(最大255)由来の境界外
      await banner.submitSetting();
      await expect(page).toHaveURL(LIST_RE);
      await expect(banner.flashSuccess).toHaveCount(0);
      await expect(banner.fieldError.first()).toBeVisible(); // 文字列長エラー表示で滞留
    });

    test("E2E-M16-01-022 リンク先URLが最大長(255)超過→長さエラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const banner = new DataTopBannerPage(page);
      await banner.goto();
      await banner.linkInputs.first().fill("a".repeat(256));
      await banner.submitSetting();
      await expect(page).toHaveURL(LIST_RE);
      await expect(banner.flashSuccess).toHaveCount(0);
      await expect(banner.fieldError.first()).toBeVisible();
    });

    test("E2E-M16-01-023 並び順を空にして保存→空欄エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const banner = new DataTopBannerPage(page);
      await banner.goto();
      // 設計はクライアントalertだが刷新先はサーバー検証（不具合候補#2）。仕様の「空はエラー」を期待値とする。
      await banner.sortNoInputs.first().fill("");
      await banner.submitSetting();
      await expect(page).toHaveURL(LIST_RE);
      await expect(banner.flashSuccess).toHaveCount(0);
      await expect(page.locator("body")).toContainText(ERR_SORT_EMPTY);
    });

    test("E2E-M16-01-024 並び順を重複させて保存→重複エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（バナー枠2件以上）");
      await adminLogin(page);
      const banner = new DataTopBannerPage(page);
      await banner.goto();
      const count = await banner.sortNoInputs.count();
      test.skip(count < 2, "バナー枠が2件未満のため重複検証不可（SEED-M16-01-BANNER 枠2件以上が必要）");
      // 設計はクライアントalertだが刷新先はサーバー検証（不具合候補#2）。仕様の「重複はエラー」を期待値とする。
      const v = await banner.sortNoInputs.nth(0).inputValue();
      await banner.sortNoInputs.nth(1).fill(v || "1");
      await banner.submitSetting();
      await expect(page).toHaveURL(LIST_RE);
      await expect(banner.flashSuccess).toHaveCount(0);
      await expect(page.locator("body")).toContainText(ERR_SORT_DUP);
    });

    test("E2E-M16-01-030 画像未選択でアップロード→ファイル選択エラーが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const banner = new DataTopBannerPage(page);
      await banner.goto();
      // 期待は仕様(アップロード必須)由来。クライアントJS(#top-banner-upload-error)とサーバーNotBlackの
      // いずれで表示されても「ファイル選択を促すメッセージが出る」ことを主観測する。
      await banner.submitUpload();
      await expect(page.locator("body")).toContainText(ERR_UPLOAD_REQUIRED);
    });

    // ===== 破壊的／専用シード・fixture（理由付きで未実行・抜け漏れ可視化） =====

    test.fixme(
      "E2E-M16-01-010 妥当値でバナー設定保存成功→一覧URLへ遷移（破壊的・要DB復元 SEED-M16-01-BANNER-RW）",
      async () => {
        // 期待は仕様(画面遷移: 保存成功→一覧GET)由来。設計は「フラッシュを使わずリダイレクト」だが実装は
        // 成功フラッシュを追加（不具合候補#3）。主観測は一覧URL遷移。共有環境でDBを更新するため復元シード確立後に実装。
      }
    );

    test.fixme(
      "E2E-M16-01-011 妥当画像をアップロード成功→保存され #upload_wrap 付きで遷移（破壊的・要 FIXTURE-IMAGE）",
      async () => {
        // 期待は仕様(画面遷移: アップロード成功→#upload_wrap)由来。ストレージへ書き込むため隔離・後始末確立後に実装。
        // setInputFiles で 520000バイト以下の JPEG/PNG/GIF を投入する。
      }
    );

    test.fixme(
      "E2E-M16-01-012 非画像ファイルをアップロード→GIF/JPG/PNGエラー（要 FIXTURE-NONIMAGE）",
      async () => {
        // 期待は仕様(exif 1〜3 以外は形式エラー)由来。実装は mime 判定（不具合候補#8）。拡張子偽装fixture投入後に実装。
      }
    );

    test.fixme(
      "E2E-M16-01-013 520000バイト超の画像をアップロード→サイズ超過エラー（要 FIXTURE-OVERSIZE）",
      async () => {
        // 期待は仕様(520000バイト超はサイズ超過)由来。大容量fixture投入後に実装。
      }
    );

    test.fixme(
      "E2E-M16-01-040 一覧の削除を実行→ #upload_wrap 付きで遷移（破壊的・要 SEED-M16-01-BANNER-FILE）",
      async () => {
        // 期待は仕様(画面遷移: 削除成功→#upload_wrap)由来。ストレージのオブジェクトを削除するため使い捨てシード後に実装。
      }
    );

    test.fixme(
      "E2E-M16-01-041 削除リンクの確認メッセージ表示・キャンセルで削除されない（要実機確認: data-message 発火機構）",
      async () => {
        // 期待は仕様(エラー処理: 確認メッセージ後に削除)由来。data-method=delete + data-message の確認UIが
        // ネイティブ dialog かカスタムモーダルか実機確認後に実装（要 SEED-M16-01-BANNER-FILE）。
      }
    );

    test.fixme(
      "E2E-M16-01-050 店舗を絞り込むと当該店舗の narrow URLへ遷移（要 SEED-M16-01-BANNER-MULTISHOP・店舗2件以上）",
      async () => {
        // 期待は仕様(画面遷移: 店舗選択→/{admin}/banner/top/{html_class})由来。実装は base_info_digit（不具合候補#4）。
        // details を開き dropdown-item を選択→URLが /data/top_banner/{digit} へ変わることを確認する。複数店舗シード後に実装。
      }
    );
  }
);
