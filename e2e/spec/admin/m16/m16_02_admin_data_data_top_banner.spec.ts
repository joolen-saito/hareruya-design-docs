/**
 * 管理画面 データ管理 — トップバナー管理 E2E。
 * 納品ケース表 integration_test/e2e/m16_02_admin_data_data_top_banner_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」かつ非破壊で安全に実行できるケースを test として実装し、破壊的（DB更新/保存・
 * ストレージへのアップロード/削除）や専用シード・fixtureファイルが必要なケースは test.fixme（理由付き）で
 * 抜け漏れを可視化する。手動/間接・対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約準拠）。
 *
 * 期待結果は仕様（設計書 functions/pf-eccube3/m16-02_admin_data_data_top_banner.md / 観点表
 * integration_test/integration-test-viewpoints.md）由来（オラクル独立性）。実装の現挙動・Form制約値（Length/
 * NotBlank/maxlength）・messages.ja.yaml/validators.ja.yaml の表示文言を期待値に流用しない（文言固定はオラクル混入）。
 * 本設計書は現行 pf-eccube3（HareruyaEcプラグイン）のリバースであり、刷新先 ec-cube-enterprise とのルート
 * （/banner/top → /data/top_banner）・フォーム名・並び順検証の実装場所・フラッシュ有無などの乖離はケース表
 * 付帯表4 に分離する。ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も @playwright/test を
 * 直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 *
 * シード（環境変数・ケース表 付帯表3）:
 *  - SEED-M16-02-BANNER     : mtb_top_banner マスタ（初期マイグレーションの連番スロット。参照系で原値不変）
 *  - SEED-M16-02-BANNER-DISP: 保存成功用の使い捨てスロット（030・破壊的）
 *  - SEED-M16-02-BANNER-FILE: 一覧表示/削除用のストレージ画像（031,032,041,042・破壊的）
 *  - SEED-M16-02-BASEINFO   : 店舗絞り込み用の shop_digit を持つ店舗（040）
 *  - 画像/非画像/サイズ超過 fixture（021,022,031）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { DataDataTopBannerPage } from "../../../pages/admin/m16/m16_02_admin_data_data_top_banner.page";
import { ECCUBE_ADMIN_ROUTE, ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS } from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 正規表現メタ文字を含み得る環境可変値（ECCUBE_ADMIN_ROUTE）を安全にURLアサーションへ埋め込む。
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// バナー設定画面（実装ルート）。POST失敗時は同一URLで再描画される。
// 末尾境界を持たせ /data/top_banner（基本）・/data/top_banner/{digit}（店舗絞り込み）・?・#upload_wrap のみ許容し、
// /data/top_banner_xxx のような別パスを誤マッチさせない。
const TOP_RE = new RegExp(`/${escapeRe(ECCUBE_ADMIN_ROUTE)}/data/top_banner(?:/[a-z0-9]+)?(?:[?#].*)?$`);

/** 管理者ログイン後にトップバナー画面を開く。 */
async function loginAndGoto(page: Page): Promise<DataDataTopBannerPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const target = new DataDataTopBannerPage(page);
  await target.goto();
  return target;
}

test.describe("管理画面 > データ管理 — トップバナー管理", { tag: ["@admin", "@data", "@top_banner"] }, () => {
  // ===== 認証不要・非破壊（常時実行可） =====

  test("E2E-M16-02-006 未ログインで保護URL→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/data/top_banner`);
    await expect(page.locator("#login_id")).toBeVisible(); // 管理ログイン画面へ誘導
  });

  // ===== 表示（要ログイン・SEED-M16-02-BANNER／非破壊） =====

  test("E2E-M16-02-001 バナー設定画面: 案内文・バナー設定ボタン・▼画像設定リンクが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const target = await loginAndGoto(page);
    await target.seeBannerSettingForm();
  });

  test("E2E-M16-02-002 各スロットに画像URL/リンク先/言語/表示タイプ/alt/並び順の入力欄が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const target = await loginAndGoto(page);
    await target.seeSlotInputs();
    // 見出しラベル（messages.ja.yaml:5794-5799 由来）
    await expect(page.locator("body")).toContainText("画像URL");
    await expect(page.locator("body")).toContainText("リンク先URL");
    await expect(page.locator("body")).toContainText("言語");
    await expect(page.locator("body")).toContainText("表示タイプ");
    await expect(page.locator("body")).toContainText("画像alt属性");
    await expect(page.locator("body")).toContainText("並び順");
  });

  test("E2E-M16-02-003 見出し「データ管理」「トップバナー管理」が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const target = await loginAndGoto(page);
    await expect(page.locator("body")).toContainText("データ管理");
    await expect(page.locator("body")).toContainText("トップバナー管理");
  });

  test("E2E-M16-02-004 画像設定ブロック: 店舗選択・ファイル入力・アップロードボタン・一覧表が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const target = await loginAndGoto(page);
    await target.seeUploadBlock();
  });

  test("E2E-M16-02-005 「▼画像設定」リンクが同一ページ内 #upload_wrap を指す", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const target = await loginAndGoto(page);
    await expect(target.imageSettingAnchor).toHaveAttribute("href", "#upload_wrap");
  });

  test("E2E-M16-02-007 各スロットのプレビュー画像srcが当該行の画像URL入力値と一致する", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M16-02-BANNER）");
    const target = await loginAndGoto(page);
    // 期待は仕様(フロント挙動「プレビュー画像」)由来。先頭スロットの img src が当該行 image_url 入力値と一致すること。
    // 値の具体文字列は実装/シード依存のため固定せず、画面内の対応関係（src==入力値）で判定する（オラクル独立）。
    const src = await target.previewImages.first().getAttribute("src");
    const inputVal = await target.firstImageUrl.inputValue();
    expect(src).toBe(inputVal);
  });

  // ===== バナー設定 異常系（要ログイン・非破壊：検証失敗は保存されない） =====

  test("E2E-M16-02-010 画像URL最大長超過→エラー表示で滞留（保存されない）", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const target = await loginAndGoto(page);
    await target.firstImageUrl.fill("a".repeat(256)); // 最大長(255)超過＝設計書「業務ルール/画像URL」
    await target.submitBannerSetting();
    await expect(target.formError.first()).toBeVisible();
    await expect(page).toHaveURL(TOP_RE); // 同一画面に留まる
  });

  test("E2E-M16-02-011 画像URLに参照禁止ホスト→独自検証で拒否され滞留", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const target = await loginAndGoto(page);
    await target.firstImageUrl.fill("https://admin.hareruyamtg.com/banner.png"); // 参照禁止ホスト
    await target.submitBannerSetting();
    await expect(target.formError.first()).toBeVisible();
    await expect(page).toHaveURL(TOP_RE);
  });

  test("E2E-M16-02-012 リンク先URL最大長超過→エラー表示で滞留（保存されない）", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const target = await loginAndGoto(page);
    await target.firstLink.fill("a".repeat(256)); // 最大長(255)超過＝設計書「バリデーション/リンク先URL」
    await target.submitBannerSetting();
    await expect(target.formError.first()).toBeVisible();
    await expect(page).toHaveURL(TOP_RE);
  });

  test("E2E-M16-02-013 並び順が空→空エラーで滞留（保存されない）", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const target = await loginAndGoto(page);
    await target.firstSortNo.fill(""); // 並び順 空（設計書 エッジケース「並び順が空」）
    await target.submitBannerSetting();
    // 期待は仕様(エッジケース「並び順が空」→検証エラーで保存されず同一画面再描画)由来。
    // 実装はサーバ側POST_SUBMIT検証で当該sort_noフィールドにエラー付与（付帯表4#2）。
    // オラクル独立性のため実装メッセージ文言(validators.ja.yaml)は固定せず、フィールドエラー表示で判定する。
    await expect(target.formError.first()).toBeVisible();
    await expect(page).toHaveURL(TOP_RE);
  });

  test("E2E-M16-02-014 並び順が重複→重複エラーで滞留（保存されない）", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const target = await loginAndGoto(page);
    const sortInputs = page.locator('input[id^="top_banner_sort_no_"]');
    const second = await sortInputs.nth(1).inputValue(); // 2番目スロットの並び順値
    await sortInputs.nth(0).fill(second); // 先頭を2番目と同値にして重複させる
    await target.submitBannerSetting();
    // 期待は仕様(エッジケース「並び順が重複」→検証エラーで保存されず同一画面再描画)由来。
    // 実装はサーバ側POST_SUBMIT検証（付帯表4#2）。オラクル独立性のため実装メッセージ文言は固定せず、フィールドエラー表示で判定する。
    await expect(target.formError.first()).toBeVisible();
    await expect(page).toHaveURL(TOP_RE);
  });

  // ===== アップロード 異常系（要ログイン・非破壊：未選択はJSが送信阻止） =====

  test("E2E-M16-02-020 ファイル未選択でアップロード→必須エラーで送信されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const target = await loginAndGoto(page);
    await target.submitUpload(); // ファイル未選択のまま送信→JSがpreventDefault
    // 期待は仕様(処理フロー「ファイル未選択は送信阻止」)由来。
    // オラクル独立性のため実装メッセージ文言(messages.ja.yaml)は固定せず、必須エラー表示で判定する。
    await expect(target.uploadJsError).toBeVisible();
    await expect(page).toHaveURL(TOP_RE); // 送信されず画面に留まる
  });

  // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M16-02-021 非画像ファイルアップロードで形式エラー（要: 非画像fixtureファイル）",
    async () => {
      // 期待は仕様(validators.ja.yaml:134「ファイルがGIF・JPG・PNGではありません。」)由来。
      // text/plain 等の fixture を #top_banner_upload_file に setInputFiles 後に実装。
    }
  );

  test.fixme(
    "E2E-M16-02-022 上限サイズ超過アップロードでサイズエラー（要: >520000バイトの画像fixture）",
    async () => {
      // 期待は仕様(validators.ja.yaml:133 / 設計書「画像ファイル 520000バイト以下」)由来。
    }
  );

  test.fixme(
    "E2E-M16-02-030 バナー設定保存成功→GET /data/top_banner へリダイレクト（破壊的: DB更新／要使い捨てシード）",
    async () => {
      // 期待は仕様(処理フロー 成功時GETリダイレクト)由来。保存はmtb_top_bannerを更新するため
      // SEED-M16-02-BANNER-DISP（使い捨て）で実行し、フラッシュ有無は期待値に固定しない（付帯表4#4）。
    }
  );

  test.fixme(
    "E2E-M16-02-031 画像アップロード成功→#upload_wrap付きGETへリダイレクト（破壊的: ストレージput／要画像fixture）",
    async () => {
      // 期待は仕様(処理フロー アップロード成功→#upload_wrap付きGET)由来。SEED-M16-02-BANNER-FILE で後始末。
    }
  );

  test.fixme(
    "E2E-M16-02-032 一覧の削除リンクで確認後に削除→#upload_wrap付きGETへ（破壊的: ストレージdelete／要画像シード）",
    async () => {
      // 期待は仕様(処理フロー 削除→#upload_wrap付きGET)由来。確認ダイアログ承認後にDELETE。
    }
  );

  test.fixme(
    "E2E-M16-02-040 店舗絞り込みで特定店舗→/data/top_banner/{shop_digit}#upload_wrap へ遷移（要: 店舗digitシード）",
    async () => {
      // 期待は仕様(利用者視点の入口 店舗絞り込みGET)由来。実装は details/summary のアンカー（付帯表4#6）。
    }
  );

  test.fixme(
    "E2E-M16-02-041 一覧の削除リンクに削除確認文言が設定される（要: 一覧に画像シード）",
    async () => {
      // 期待は仕様(フロント挙動 削除は確認ダイアログ / messages.ja.yaml:5810)由来。
      // a[data-method="delete"] の data-message 属性を確認。
    }
  );

  test.fixme(
    "E2E-M16-02-042 一覧に「画像URLコピー」ボタンが表示される（要: 一覧に画像シード。実コピーは手動）",
    async () => {
      // 期待は仕様(フロント挙動 URLコピー / messages.ja.yaml:5805)由来。.js-copy-url の表示を確認。
    }
  );

  test.fixme(
    "E2E-M16-02-043 店舗絞り込み「全て」選択→/data/top_banner#upload_wrap（全店舗ルート）へ戻る（要: 店舗digitシード＋絞り込み状態）",
    async () => {
      // 期待は仕様(画面遷移 店舗ドロップダウン「全て」→全店舗ルート 設計書 line 234)由来。
      // 「全て」アンカーは絞り込み中(filterBaseInfoDigit!=null)のみ描画（top_banner.twig:291-296）。
      // /data/top_banner/{shop_digit} を開いてから .top-banner-filter__menu の filter_all アンカーを辿る。
    }
  );

  test.fixme(
    "E2E-M16-02-044 店舗選択ありアップロード→banner/{digit}/保存・店舗付き#upload_wrapへ遷移（破壊的: ストレージput／要店舗digit＋画像fixture）",
    async () => {
      // 期待は仕様(処理フロー 店舗選択ありアップロード→banner/{html_class}/保存・店舗付き#upload_wrap 設計書 lines 80-83,231)由来。
      // 店舗絞り込みルートで base_info 選択のうえ画像を setInputFiles。後始末は SEED-M16-02-BANNER-FILE。
    }
  );

  test.fixme(
    "E2E-M16-02-045 店舗サブディレクトリ削除→店舗付き#upload_wrapへ戻る（破壊的: ストレージdelete／要店舗サブフォルダ画像シード）",
    async () => {
      // 期待は仕様(処理フロー 店舗サブディレクトリDELETE→店舗付き#upload_wrap 設計書 lines 32,85-90)由来。
      // 絞り込み一覧の削除リンクは admin_data_top_banner_delete_filter（top_banner.twig:344-352）。
    }
  );
});
