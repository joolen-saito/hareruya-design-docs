/**
 * 管理画面 コンテンツ管理 > ページ管理（M09-04）E2E。納品ケース表
 * integration_test/e2e/m09_04_admin_content_content_page_e2e_cases.md に対応。
 * 本specには「E2E自動化」のうち非破壊で資格情報のみで走るケースを実装し、永続化副作用あり（新規/編集/削除）・
 * 要実機確認（ACE本文クリア・CSRF直接DELETE・重複URLシード）は test.fixme（理由付き）で残す。
 * 手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様（正本 functions/pf-eccube3/m09-04_admin_content_content_page.md / 観点表）の挙動由来（オラクル独立性）。
 * 設計源は pf-eccube3（HareruyaEcプラグイン）だが、刷新先 ec-cube-enterprise に同一画面（admin_content_page 系）が実在するためE2E化。
 * 設計源と刷新先の文言・検索方式・UI部品の乖離はケース表 付帯表4（不具合候補）に集約。表示文言の i18n リソース由来語は
 * オラクルにせず、設計書が明記する挙動・観測（フォーム滞留・該当URLへの遷移・エラー表示有無）で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証について: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の spec/admin/login.spec.ts・
 * m08/*.spec.ts も @playwright/test を直接使う。本specも踏襲する。資格情報が無ければ走らないよう test.skip でガードする。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ContentContentPagePage } from "../../../pages/admin/m09/m09_04_admin_content_content_page.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/content/page(\\?|$)`);
const NEW_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/content/page/new`);
const EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/content/page/\\d+/edit`);

// 設計オラクル: バリデーション失敗の観測は「保存されない＝新規フォームに留まり編集画面へ遷移しない」で判定する。
// エラー表示の媒体（.invalid-feedback / HTML5 ネイティブ検証バブル）は実装依存のためオラクル化しない。
// i18n リソース文言（例「入力されていません。」「登録」「新規作成」）は期待値に固定しない（オラクル独立性）。

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
}

test.describe(
  "管理画面 > コンテンツ管理 > ページ管理",
  { tag: ["@admin", "@content", "@page"] },
  () => {
    // ===== 認証ガード（資格情報不要・非破壊） =====

    test("E2E-M09-04-050 未ログインで一覧URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/content/page`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 一覧表示（ログインのみ・seed不要） =====

    test("E2E-M09-04-001 一覧に新規作成ボタン・検索ボックス・5列ヘッダが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const pm = new ContentContentPagePage(page);
      await pm.gotoList();
      await expect(page).toHaveURL(LIST_RE);
      await pm.seeListUi();
    });

    test("E2E-M09-04-002 検索ボックス入力で一覧行が部分一致で絞り込まれる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const pm = new ContentContentPagePage(page);
      await pm.gotoList();
      const total = await pm.listRows.count();
      expect(total).toBeGreaterThan(0);
      // 一致語: 既存の任意行（先頭行）のページ名の一部を語にすると当該行は表示され続ける（IT行060 / ケース表 002 前段）。
      const firstName = ((await pm.listRows.first().locator("td:first-child").innerText()) || "").trim();
      const matchWord = firstName.slice(0, Math.min(3, firstName.length));
      if (matchWord.length > 0) {
        await pm.typeSearch(matchWord);
        await expect(pm.listRows.first()).toBeVisible();
      }
      // 不一致語: どの行にも一致しない語を入れると可視行が初期より減る（クライアント側フィルタ・付帯表4#1）。
      await pm.typeSearch("ZZZ-E2E-M0904-NO-MATCH-0000");
      // 主観測: 不一致語で可視行が初期より減る（厳密件数はDB依存のため減少のみを判定）。
      const visible = await page.locator("table.table tbody tr:visible").count();
      expect(visible).toBeLessThan(total);
    });

    test("E2E-M09-04-003 新規作成フォームに名称・URL・ファイル名・本文・任意メタ・登録ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const pm = new ContentContentPagePage(page);
      await pm.gotoNew();
      await expect(page).toHaveURL(NEW_RE);
      await pm.seeFormParts();
      await expect(pm.urlInput).toBeVisible(); // 新規（利用者作成）はURL欄が編集可能
      await expect(pm.fileNameInput).toBeVisible();
      // 設計 入力項目表が定める任意メタ項目（author/description/keyword/robots/追加metaタグ）も表示される。
      await pm.seeMetaFields();
    });

    test("E2E-M09-04-004 一覧のページ名リンクから編集フォームが現行値とともに表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定 / SEED-M09-04-DEFAULT 前提");
      await login(page);
      const pm = new ContentContentPagePage(page);
      await pm.gotoList();
      await pm.pageNameLinks.first().click();
      await expect(page).toHaveURL(EDIT_RE);
      await expect(pm.nameInput).toBeVisible();
      await expect(pm.nameInput).not.toHaveValue(""); // 現行値が入る
    });

    // ===== 画面遷移（非破壊） =====

    test("E2E-M09-04-040 新規作成ボタン押下で新規作成フォームへ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const pm = new ContentContentPagePage(page);
      await pm.gotoList();
      await pm.createNewButton.click();
      await expect(page).toHaveURL(NEW_RE);
    });

    test("E2E-M09-04-041 一覧のページ名リンク押下で編集フォームへ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定 / SEED-M09-04-DEFAULT 前提");
      await login(page);
      const pm = new ContentContentPagePage(page);
      await pm.gotoList();
      await pm.pageNameLinks.first().click();
      await expect(page).toHaveURL(EDIT_RE);
    });

    // ===== バリデーション（非破壊：検証失敗で保存されずフォーム滞留） =====
    // 設計オラクル＝「保存されない＝新規フォームに留まり編集画面(EDIT_RE)へ遷移しない」。
    // 各ケースは対象項目のみを違反させ他の必須項目は有効値で埋める（フィールド別オラクル化）。
    // 必須未入力(020/021/022/027)は実装がHTML5 required/maxlength（MainEditType.php required=>true・新規はurl/file_nameも必須）を
    // 持つため、サーバ側 .invalid-feedback が描画されない場合がある。媒体に依存せず観測できる「保存されず滞留」で判定する。

    test("E2E-M09-04-020 名称未入力で送信すると保存されず新規フォームに留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const pm = new ContentContentPagePage(page);
      await pm.gotoNew();
      await pm.nameInput.fill(""); // 名称のみ空（他の必須項目は有効値）
      await pm.urlInput.fill("e2e_m0904_req");
      await pm.fileNameInput.fill("e2e_m0904_req");
      await pm.submit();
      await expect(page).not.toHaveURL(EDIT_RE); // 保存されず編集画面へ進まない
      await expect(page).toHaveURL(NEW_RE); // フォーム滞留
    });

    test("E2E-M09-04-021 URL未入力で送信すると保存されず新規フォームに留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const pm = new ContentContentPagePage(page);
      await pm.gotoNew();
      await pm.nameInput.fill("E2E M0904 名称");
      await pm.urlInput.fill(""); // URLのみ空
      await pm.fileNameInput.fill("e2e_m0904_req");
      await pm.submit();
      await expect(page).not.toHaveURL(EDIT_RE);
      await expect(page).toHaveURL(NEW_RE);
    });

    test("E2E-M09-04-022 ファイル名未入力で送信すると保存されず新規フォームに留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const pm = new ContentContentPagePage(page);
      await pm.gotoNew();
      await pm.nameInput.fill("E2E M0904 名称");
      await pm.urlInput.fill("e2e_m0904_req");
      await pm.fileNameInput.fill(""); // ファイル名のみ空
      await pm.submit();
      await expect(page).not.toHaveURL(EDIT_RE);
      await expect(page).toHaveURL(NEW_RE);
    });

    test("E2E-M09-04-024 URL末尾スラッシュは形式エラーで新規フォームに留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const pm = new ContentContentPagePage(page);
      await pm.gotoNew();
      await pm.nameInput.fill("E2E M0904 名称");
      await pm.urlInput.fill("e2e_m0904_sample/"); // 末尾スラッシュ不可（サーバ側正規表現）
      await pm.fileNameInput.fill("e2e_m0904_sample");
      await pm.submit();
      await expect(page).not.toHaveURL(EDIT_RE); // 形式エラーで保存されず滞留
      await expect(page).toHaveURL(NEW_RE);
      // 形式違反はサーバ側検証に到達するためURL欄のフィールドエラーを併せて確認（フィールド別）。
      await expect(pm.fieldError(pm.urlInput)).toBeVisible();
    });

    test("E2E-M09-04-028 ファイル名の許可外文字は形式エラーで新規フォームに留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const pm = new ContentContentPagePage(page);
      await pm.gotoNew();
      await pm.nameInput.fill("E2E M0904 名称");
      await pm.urlInput.fill("e2e_m0904_sample");
      await pm.fileNameInput.fill("e2e m0904 invalid"); // 半角空白は許可外（サーバ側正規表現）
      await pm.submit();
      await expect(page).not.toHaveURL(EDIT_RE);
      await expect(page).toHaveURL(NEW_RE);
      await expect(pm.fieldError(pm.fileNameInput)).toBeVisible();
    });

    test("E2E-M09-04-027 名称256文字は文字列長超過で保存されず新規フォームに留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const pm = new ContentContentPagePage(page);
      await pm.gotoNew();
      // 注意: #main_edit_name に HTML maxlength=255 があると 256 文字目が入力されず超過にならない可能性（要確認）。
      await pm.nameInput.fill("あ".repeat(256)); // 最大長(255)+1
      await pm.urlInput.fill("e2e_m0904_len");
      await pm.fileNameInput.fill("e2e_m0904_len");
      await pm.submit();
      await expect(page).not.toHaveURL(EDIT_RE); // 超過で保存されず滞留
      await expect(page).toHaveURL(NEW_RE);
    });

    test("E2E-M09-04-029 URL256文字は文字列長超過で保存されず新規フォームに留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const pm = new ContentContentPagePage(page);
      await pm.gotoNew();
      // 注意: #main_edit_url に HTML maxlength=255 があると 256 文字目が入力されず超過にならない可能性（要確認・付帯表1）。
      await pm.nameInput.fill("E2E M0904 名称");
      await pm.urlInput.fill("a".repeat(256)); // 許可文字のみで最大長(255)+1
      await pm.fileNameInput.fill("e2e_m0904_len");
      await pm.submit();
      await expect(page).not.toHaveURL(EDIT_RE); // 超過で保存されず滞留
      await expect(page).toHaveURL(NEW_RE);
    });

    test("E2E-M09-04-036 ファイル名256文字は文字列長超過で保存されず新規フォームに留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const pm = new ContentContentPagePage(page);
      await pm.gotoNew();
      // 注意: #main_edit_file_name に HTML maxlength=255 があると 256 文字目が入力されない可能性（要確認・付帯表1）。
      await pm.nameInput.fill("E2E M0904 名称");
      await pm.urlInput.fill("e2e_m0904_len");
      await pm.fileNameInput.fill("a".repeat(256)); // 許可文字のみで最大長(255)+1
      await pm.submit();
      await expect(page).not.toHaveURL(EDIT_RE);
      await expect(page).toHaveURL(NEW_RE);
    });

    test("E2E-M09-04-042 存在しないページIDの編集URL直接アクセスで見つからない扱い(HTTP404)", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      // 設計オラクル: 該当IDが無い編集は「見つからない扱い（HTTP 404）」(md:121 / エラー処理 md:305)。応答ステータスで判定し画面文言は固定しない。
      const resp = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/content/page/99999999/edit`);
      expect(resp?.status()).toBe(404);
      await expect(page.locator("#main_edit_name")).toHaveCount(0); // 編集フォームは描画されない
    });

    // ===== 保留（永続化副作用あり / 要実機確認。手動・対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M09-04-010 新規作成成功→編集画面へ遷移（要: 使い捨てURL/ファイル名・DB行とtwigファイル生成の後始末。ACE本文同期は要実機）",
      async () => {
        // 期待は仕様(処理フロー 新規作成送信 4-7 / Controller.php:307-312)由来。SEED-M09-04-DISPOSABLE のべき等化後に実装。
      }
    );

    test.fixme(
      "E2E-M09-04-011 利用者作成ページ編集成功→保存しました（要: SEED-M09-04-USERPAGE・永続化副作用）",
      async () => {
        // 期待は仕様(処理フロー 編集送信)由来。利用者作成ページのシード投入後に実装。
      }
    );

    test.fixme(
      "E2E-M09-04-012 初期投入ページ編集は名称のみ更新しURL/ファイル名を保持（要: SEED-M09-04-DEFAULT特定・永続化副作用）",
      async () => {
        // 期待は仕様(業務ルール 初期投入保持 / Controller.php:181-186)由来。
      }
    );

    test.fixme(
      "E2E-M09-04-023 本文未入力で必須エラー（要: ACEエディタの本文クリア操作の実機確認）",
      async () => {
        // 期待は仕様(本文 NotBlank / MainEditType.php:87-90)由来。ACE setValue('') の挙動を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M09-04-025 既存と同一URLで重複エラー（要: SEED-M09-04-DUPURL の既知URL）",
      async () => {
        // 期待は仕様(URL一意性 / MainEditType.php:188-213)由来。重複基準データの投入後に実装。
      }
    );

    test.fixme(
      "E2E-M09-04-026 名称255文字以内で保存継続（要: 使い捨てデータ・永続化副作用）",
      async () => {
        // 期待は仕様(名称 Length max=255 境界内)由来。SEED-M09-04-DISPOSABLE 後始末前提で実装。
      }
    );

    test.fixme(
      "E2E-M09-04-030 利用者作成ページ削除→一覧へ削除しました（要: SEED-M09-04-USERPAGE・モーダル承認・永続化副作用）",
      async () => {
        // 期待は仕様(処理フロー 削除 / messages.ja.yaml:1400)由来。削除確認モーダル(page.twig:97-121)の承認後に実装。
      }
    );

    test.fixme(
      "E2E-M09-04-031 初期投入ページ行に削除アイコンが表示されない（要: 初期投入/利用者作成の行特定）",
      async () => {
        // 期待は仕様(エッジケース 初期投入は削除導線なし / page.twig:95-122)由来。行のedit_type特定後に実装。
      }
    );

    test.fixme(
      "E2E-M09-04-032 存在しないID削除で削除に失敗しました（要: 有効CSRFトークン取得・直接DELETE）",
      async () => {
        // 期待は仕様(エラー処理 削除対象なし / messages.ja.yaml:1401 / Controller.php:344-348)由来。
      }
    );

    test.fixme(
      "E2E-M09-04-033 削除確認モーダルでキャンセルすると削除されず行が残る（要: SEED-M09-04-USERPAGE・モーダル起動）",
      async () => {
        // 期待は仕様(フロントエンド側ビジネスロジック 削除確認 キャンセルで送信しない md:96)由来。
        // #delete_{id}(page.twig:97) を開きキャンセル→ data-method=delete 未送信で当該行が一覧に残ることを確認。
      }
    );

    test.fixme(
      "E2E-M09-04-034 初期投入ページIDへ直接DELETEしても削除されず行が残る（要: 有効CSRFトークン取得・直接DELETE）",
      async () => {
        // 期待は仕様(エッジケース 削除対象が初期投入データ＝レコード・ファイル不削除 md:209)由来。
        // 直接DELETE後も一覧に当該行が残ることで判定（文言はオラクル化しない）。
      }
    );
  }
);
