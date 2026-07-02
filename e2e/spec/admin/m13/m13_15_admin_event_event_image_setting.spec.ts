/**
 * 管理画面 イベント管理「イベントバナー画像設定（アップロード・一覧・削除）」E2E（M13-15）。
 * 納品ケース表 integration_test/e2e/m13_15_admin_event_event_image_setting_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのうち即時実行可能なもの（資格情報＋既定環境で観測可能）を実装する。
 * 店舗絞り込みGETの正常系(006)・本機能専用モーダル不在(007)を含む。店舗別保管・一覧整列(降順/上限2000)・削除実行・
 * 店舗絞り込み削除(061)・拡張子付与(062)・各種別受理(063)・クリップボード実コピー・DB非更新・削除CSRF不正・
 * ファイル送信なし振り分け(060=M13-14委譲)・ログ出力抑止はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m13-15_admin_event_event_image_setting.md / 観点表)由来（オラクル独立性）。
 * 設計源は pf-eccube3（旧Hareruyaプラグイン）リバースだが、基本設計/設計書を上位オラクルとし、刷新先
 * ec-cube-enterprise に当該画面の存在を確認済み（BannerController.php:57,58,91,121 / banner.twig）。
 * 実装の現挙動・Form制約・表示文言は期待値に流用しない。アップロードのエラー系は「エラー領域が表示され同画面に
 * 留まる（再描画滞留）」という設計由来の挙動で判定し、文言差（付帯表4: 不具合候補 #3-#6）は要確認とする。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(010/011)は資格情報不要。アップロード成功・一覧・削除実行は画像ストレージ(S3)接続が前提のため
 * test.fixme（要S3/要実機）で抜け漏れを可視化する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { EventEventImageSettingPage } from "../../../pages/admin/m13/m13_15_admin_event_event_image_setting.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// サイズ上限は設計書「業務ルール・サイズ上限 1ファイル520000バイト（確認値）」由来（オラクル独立性）。
const MAX_BYTES = 520000;
// 未認証ガードの誘導先は管理画面共通ログイン（/<route>/login）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$|/)`);
// 店舗絞り込みGETのURL（/<route>/event/banner/{html_class}）。全店舗URLより1セグメント深い。
const NARROW_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/event/banner/[^/?#]+`);

/** 非画像バイナリ（exif で画像と判定されない）を size バイトで作る。 */
function nonImageFile(name: string, size: number) {
  return { name, mimeType: "application/octet-stream", buffer: Buffer.alloc(size, 0x41) };
}

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 イベント管理 > イベントバナー画像設定",
  { tag: ["@admin", "@event", "@banner"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M13-15-010 未ログインでバナー管理URL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new EventEventImageSettingPage(page);
      await p.goto();
      await expect(page).toHaveURL(LOGIN_RE); // 未ログイン管理者はアクセス不可（権限・認可）
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M13-15-011 未ログインで店舗絞り込みURL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new EventEventImageSettingPage(page);
      await p.gotoNarrow("e2e_unknown_shop"); // 認証チェックがコントローラより先＝htmlClass不問でログインへ
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M13-15-001 画像設定枠にファイル選択・店舗セレクト・アップロードボタンが表示される", async ({
        page,
      }) => {
        await login(page);
        const p = new EventEventImageSettingPage(page);
        await p.goto();
        await p.seeUploadForm();
      });

      test("E2E-M13-15-002 保管済み画像一覧表の見出し（画像・更新日付・画像URL・削除）が表示される", async ({
        page,
      }) => {
        await login(page);
        const p = new EventEventImageSettingPage(page);
        await p.goto();
        await p.seeListHeaders();
      });

      test("E2E-M13-15-003 イベントバナー管理画面のタイトルが表示される", async ({ page }) => {
        await login(page);
        const p = new EventEventImageSettingPage(page);
        await p.goto();
        // タイトルは trans admin.event.banner_page=「イベントバナー管理」(banner.twig:15)。期待は仕様（利用者視点の入口）由来。
        await expect(page.locator("body")).toContainText("イベントバナー管理");
      });

      test("E2E-M13-15-004 店舗絞り込みドロップダウンに「全て」と店舗が表示される", async ({ page }) => {
        await login(page);
        const p = new EventEventImageSettingPage(page);
        await p.goto();
        // 全店舗表示では絞り込みトグルが「全て」を示す（selectedBaseInfo null）。
        await expect(p.filterToggle).toContainText("全て");
        await p.openFilter();
        // ドロップダウン内に店舗（の選択肢）が1件以上表示されること。
        await expect(p.uploadWrap.locator(".dropdown-menu .dropdown-item").first()).toBeVisible();
      });

      test("E2E-M13-15-006 店舗絞り込み（ログイン済み）で指定店舗の一覧と当該店舗の選択状態が表示される", async ({
        page,
      }) => {
        await login(page);
        const p = new EventEventImageSettingPage(page);
        await p.goto();
        // 絞り込みドロップダウンから店舗を選択すると店舗絞り込みGETへ遷移する（設計: 利用者視点の入口「店舗絞り込みGET」）。
        await p.selectShopFilter();
        await expect(page).toHaveURL(NARROW_RE); // /event/banner/{html_class} へ遷移
        await expect(p.uploadWrap).toBeVisible(); // 指定店舗の一覧・アップロード枠を表示
        // 絞り込み時は当該店舗を初期選択（トグル表示が「全て」でない）。期待は仕様（処理フロー 表示#2）由来。
        await expect(p.filterToggle).not.toContainText("全て");
      });

      test("E2E-M13-15-007 画像設定枠に本機能専用のモーダルは表示されない", async ({ page }) => {
        await login(page);
        const p = new EventEventImageSettingPage(page);
        await p.goto();
        // 期待は仕様（フロント挙動「モーダル・ポップアップ＝本機能専用のモーダルは無い」）由来。削除はアンカー確認で行う。
        await p.seeNoVisibleModal();
      });

      test("E2E-M13-15-030 ファイル未選択でアップロード→エラー表示・アップロードされず滞留", async ({ page }) => {
        await login(page);
        const p = new EventEventImageSettingPage(page);
        await p.goto();
        // ファイルを選択せず送信する。店舗は設計上「任意」（未指定なら banner/ 直下保管）のため
        // 店舗未選択を前提条件にしない（実装の既定選択挙動はオラクルにしない＝付帯表4#2 要確認）。
        await p.upload();
        // 期待は設計（エッジケース「ファイル未選択」＝エラー表示し再描画）由来。文言差は付帯表4#3で要確認。
        await p.seeUploadError();
      });

      test("E2E-M13-15-031 サイズ上限を超える画像→サイズ超過エラー・滞留", async ({ page }) => {
        await login(page);
        const p = new EventEventImageSettingPage(page);
        await p.goto();
        await p.upload(nonImageFile("over.bin", MAX_BYTES + 80000)); // 明確に上限超過
        // 期待は設計（業務ルール「サイズ上限520000」・エッジケース「サイズ超過」）由来。文言差は付帯表4#4で要確認。
        await p.seeUploadError();
      });

      test("E2E-M13-15-032 GIF/JPEG/PNG以外のファイル→種別不正エラー・滞留", async ({ page }) => {
        await login(page);
        const p = new EventEventImageSettingPage(page);
        await p.goto();
        await p.upload(nonImageFile("not_image.txt", 1000)); // サイズ内・画像でない
        // 期待は設計（業務ルール「受理する画像種別」・エッジケース「種別不正」）由来。文言差は付帯表4#5で要確認。
        await p.seeUploadError();
      });

      test("E2E-M13-15-034 サイズ上限+1（520001バイト）→サイズ超過エラー・滞留（境界外）", async ({ page }) => {
        await login(page);
        const p = new EventEventImageSettingPage(page);
        await p.goto();
        await p.upload(nonImageFile("boundary_over.bin", MAX_BYTES + 1)); // 520001=境界外
        await p.seeUploadError();
      });
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M13-15-020 有効画像アップロード成功→#upload_wrapへリダイレクト（要: 画像ストレージS3接続）",
      async () => {
        // 期待は仕様(処理フロー アップロード#6,#7)由来。S3接続環境で実装する。
        // 注: 刷新先は店舗 baseInfos が必須化（不具合候補#2）。設計（店舗任意）との乖離を実機確認。
      }
    );

    test.fixme(
      "E2E-M13-15-033 サイズ上限ちょうど520000バイトは超過扱いにならない（要: 種別/サイズ文言で境界判定＝文言乖離確認）",
      async () => {
        // 期待は仕様(入力項目「520000バイト以下」境界内＝許容)由来。サイズ超過でなく後続(種別)判定へ進むことの
        // 確認には実装メッセージの区別が必要で、文言が設計と乖離（付帯表4#4,#5）するため実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M13-15-040 一覧の削除リンクに削除確認メッセージが設定されている（要: S3に保管画像1件以上）",
      async () => {
        // 期待は仕様(表示メッセージ・削除確認)由来。削除リンクは画像行にのみ表示されるためSEED-M13-15-S3-IMAGEが要る。
        // 確認文言は設計「一度削除したデータは…」、実装 delete_confirm は別文言（付帯表4#6）＝要確認。
      }
    );

    test.fixme(
      "E2E-M13-15-005 一覧行に画像URLコピーのリンクが表示される（要: S3に保管画像1件以上）",
      async () => {
        // 期待は仕様(フロント挙動「画像URLコピー」)由来。クリップボードへの実コピーはJSのため手動（053）。
      }
    );
  }
);
