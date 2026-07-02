/**
 * 管理画面 カードセット管理「収録カード画像 ZIP ダウンロード（セット別／言語別）」E2E（M14-07）。
 * 納品ケース表 integration_test/e2e/m14_07_admin_card_cardset_image_download_e2e_cases.md に対応。
 * 本specには「E2E自動化（実装済み）」ケースのみ実装し、要シード/要S3/要実機は test.fixme（理由付き）で残す。
 * 手動/対象外はケース表で全量管理する（規約「手動/対象外はspecに残さない」に従う＝ケース表とspecは完全1:1ではない）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m14-07_admin_card_cardset_image_download.md / 観点表)由来（オラクル独立性）。
 * 刷新先 ec-cube-enterprise の個別エラーメッセージキー文言・内部セッションキー名は期待値に流用しない。
 * 失敗系の期待は「エラーフラッシュ表示＋一覧滞留」という挙動レベル（観点表 IT-03/IT-27 由来）で書く。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行方針（安全第一・共有ステージング）:
 *  - ログインが要るケースは ECCUBE_ADMIN_USER/PASS（config/default.config.ts）が無いと走らないよう test.skip でガード。
 *  - ダウンロード成功系（020-022）はオブジェクトストレージ(S3)実体が要るため test.fixme（要シードSEED-M14-07-CARDSET-IMAGES）。
 *  - 失敗系（030,031）は画像0件セット（SEED-M14-07-CARDSET-NOIMAGE）が要るため test.fixme。
 *  - 013（チェックあり→confirm抑止で送信）・014（未選択→confirm OKで送信続行＝プロモ相当POST）は
 *    POST副作用（S3/ZIPまたはエラー）を伴うため test.fixme。
 *  - 041（未認証POSTがダウンロード処理に到達しない）は実機の未認証ガード応答確認が要るため test.fixme。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { CardCardsetImageDownloadPage } from "../../../pages/admin/m14/m14_07_admin_card_cardset_image_download.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様（フロント挙動・messages.ja.yaml:4207）由来の確認ダイアログ文言。設計書・刷新先で一致。
const CONFIRM_PROMO = "プロモカード一覧をダウンロードしますか?";
const LIST_RE = /\/cardset(\?|$)/;

/** 管理者でログインしてカードセット一覧（操作起点）を開く。 */
async function loginAndGotoList(page: Page): Promise<CardCardsetImageDownloadPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const pom = new CardCardsetImageDownloadPage(page);
  await pom.gotoList();
  return pom;
}

test.describe(
  "カードセット管理 > 収録カード画像ZIPダウンロード（セット別／言語別）",
  { tag: ["@admin", "@card", "@download"] },
  () => {
    // ===== 認証不要（資格情報不要・常時実行可） =====

    test("E2E-M14-07-040 未ログインでカードセット一覧URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/cardset`);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 一覧UI部品（要ログイン・SEED-M14-07-CARDSET） =====

    test("E2E-M14-07-001 一覧上部にセット別・言語別の2ダウンロードボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const pom = await loginAndGotoList(page);
      await pom.seeDownloadButtons();
    });

    test("E2E-M14-07-002 各カードセット行に選択用チェックボックスが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const pom = await loginAndGotoList(page);
      // SEED-M14-07-CARDSET（1件以上）が必要。行が無い環境では表示確認できない。
      await expect(pom.rowCheckboxes.first()).toBeVisible();
    });

    test("E2E-M14-07-003 全選択チェックボックスで全行のチェックがオンになる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const pom = await loginAndGotoList(page);
      const count = await pom.rowCheckboxes.count();
      test.skip(count === 0, "SEED-M14-07-CARDSET（カードセット1件以上）が必要");
      await pom.checkSelectAll();
      for (let i = 0; i < count; i++) {
        await expect(pom.rowCheckboxes.nth(i)).toBeChecked();
      }
    });

    // ===== 確認ダイアログ・送信可否制御（要ログイン・SEED-M14-07-CARDSET） =====

    test("E2E-M14-07-010 未選択でセット別ボタン→確認ダイアログが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const pom = await loginAndGotoList(page);
      const msg = await pom.clickAndCaptureConfirm(pom.downloadBySetButton);
      expect(msg).toContain(CONFIRM_PROMO);
    });

    test("E2E-M14-07-011 未選択で言語別ボタン→確認ダイアログが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const pom = await loginAndGotoList(page);
      const msg = await pom.clickAndCaptureConfirm(pom.downloadByLangButton);
      expect(msg).toContain(CONFIRM_PROMO);
    });

    test("E2E-M14-07-012 確認ダイアログでキャンセル→送信されず一覧に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const pom = await loginAndGotoList(page);
      // clickAndCaptureConfirm は dismiss(=キャンセル)する。送信抑止＝一覧URLに留まること。
      await pom.clickAndCaptureConfirm(pom.downloadBySetButton);
      await expect(page).toHaveURL(LIST_RE);
    });

    test("E2E-M14-07-015 言語別で確認ダイアログをキャンセル→送信されず一覧に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      // 012(セット別キャンセル)の言語別側の対。期待は仕様(フロント挙動「確認でキャンセル時は送信しない」)由来。
      const pom = await loginAndGotoList(page);
      await pom.clickAndCaptureConfirm(pom.downloadByLangButton);
      await expect(page).toHaveURL(LIST_RE);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M14-07-013 1件以上選択時は確認ダイアログを出さず送信する（要: SEED-M14-07-CARDSET-IMAGES・POST副作用）",
      async () => {
        // 期待は仕様(フロント挙動「チェックがあればそのまま送信」)由来。チェック→確認ダイアログ非表示で送信される。
        // POSTがS3取得/ZIP生成またはエラーへ進む副作用があるため、専用シード整備後に実装。
      }
    );

    test.fixme(
      "E2E-M14-07-014 未選択で確認ダイアログをOK→プロモ相当ダウンロードへ送信される（要: SEED-M14-07-CARDSET・POST副作用）",
      async () => {
        // 期待は仕様(利用者視点の入口「未選択時は確認後カードセットID=0扱いでPOSTが進む」＋
        // フロント挙動「OKでそのまま送信」)由来。clickAndAcceptConfirm でダイアログをaccept(OK)し、
        // 送信が抑止されず download POST へ進むこと（プロモ相当）を観測する。010/011/012(キャンセル系)と対の正常系。
        // 未選択POSTはS3取得/ZIP生成またはエラーへ進む副作用があるため、シード整備後に実装。
      }
    );

    test.fixme(
      "E2E-M14-07-016 言語別で1件以上選択時は確認ダイアログを出さず送信する（要: SEED-M14-07-CARDSET-IMAGES・POST副作用）",
      async () => {
        // 013(セット別)の言語別側の対。期待は仕様(フロント挙動「チェックがあればそのまま送信」)由来。
        // チェック→確認ダイアログ非表示で言語別DLルートへ送信。POST副作用のためシード整備後に実装。
      }
    );

    test.fixme(
      "E2E-M14-07-017 未選択で言語別の確認ダイアログをOK→プロモ相当ダウンロードへ送信される（要: SEED-M14-07-CARDSET・POST副作用）",
      async () => {
        // 014(セット別)の言語別側の対。期待は仕様(フロント挙動「OKでそのまま送信」)由来。
        // clickAndAcceptConfirm(downloadByLangButton) でダイアログをaccept(OK)し、送信が抑止されず
        // 言語別DLルート(プロモ相当)へ進むことを観測する。POST副作用のためシード整備後に実装。
      }
    );

    test.fixme(
      "E2E-M14-07-020/021 セット別ダウンロード成功でcard_image.zipが保存される（要: SEED-M14-07-CARDSET-IMAGES＋S3実機）",
      async () => {
        // 期待は仕様(入出力「成功時 card_image.zip バイナリ」)由来。ダウンロード発火＋download.suggestedFilename()==="card_image.zip"。
        // S3から実画像を取得できる環境が前提のため fixme。
      }
    );

    test.fixme(
      "E2E-M14-07-022 言語別ダウンロード成功でcard_image.zipが保存される（要: SEED-M14-07-CARDSET-IMAGES＋S3実機）",
      async () => {
        // 期待は仕様(言語別 ZIP 応答)由来。#admin_cardset_download_by_lang から発火。ZIPの言語フォルダ構造は手動確認。
      }
    );

    test.fixme(
      "E2E-M14-07-030/031 対象画像が無い場合エラーフラッシュ表示で一覧へ戻る（要: SEED-M14-07-CARDSET-NOIMAGE）",
      async () => {
        // 期待は仕様(エラー処理「ZIPが最終的に存在しない→エラー表示して一覧へリダイレクト」)由来。
        // 個別メッセージキー文言はオラクル化せず、エラーフラッシュ表示＋一覧URL(/admin/cardset)滞留を期待する（不具合候補#2,#3）。
      }
    );

    test.fixme(
      "E2E-M14-07-032 セット別でカード詳細0件→set_not_exist_card分岐でエラーフラッシュ表示で一覧へ戻る（要: SEED-M14-07-CARDSET-NODETAIL）",
      async () => {
        // 030(画像0件=image_not_exist分岐)とは別の失敗分岐（設計書 処理フロー11 カード詳細0件→set_not_exist_card）。
        // 個別メッセージキー文言はオラクル化せず、エラーフラッシュ表示＋一覧URL(/admin/cardset)滞留を期待する。
      }
    );

    test.fixme(
      "E2E-M14-07-033 言語別で全選択セットにカード詳細が無い→エラーフラッシュ表示で一覧へ戻る（要: SEED-M14-07-CARDSET-NODETAIL）",
      async () => {
        // 設計書 処理フロー21・エッジケース「言語別で全セットにカード詳細が無い→continue後ZIP無し→エラー」由来。
        // 030/031と同様に挙動レベル（エラーフラッシュ＋一覧滞留）を期待し、個別文言はオラクル化しない。
      }
    );

    test.fixme(
      "E2E-M14-07-041 未ログインでダウンロードPOSTがダウンロード処理に到達しない（要実機: 未認証ガード応答確認）",
      async () => {
        // 期待は仕様(権限・認可「未ログインは当POSTに到達しない」)由来。入口はPOST専用のため
        // pom.postDownloadBySetUnauthenticated() で実際に POST し、ZIP応答ではなくログイン誘導
        // （3xxリダイレクト等）になることを観測する。GET直アクセスではPOST不到達のオラクルにならない。
        // 実機の未認証ガード応答（ステータス/Location）を確認後に実装。
      }
    );

    test.fixme(
      "E2E-M14-07-042 未ログインで言語別ダウンロードPOSTがダウンロード処理に到達しない（要実機: 未認証ガード応答確認）",
      async () => {
        // 041(セット別)の言語別側の対＝2種ダウンロード両ルートの未認証ガード（設計書 権限・認可）。
        // 言語別DLルート(刷新先 /cardset/download_each_lang・付帯表4 #1)へ未認証POSTし、ZIP応答ではなく
        // ログイン誘導(3xx等)になることを観測する。実機の未認証ガード応答確認後に実装。
      }
    );
  }
);
