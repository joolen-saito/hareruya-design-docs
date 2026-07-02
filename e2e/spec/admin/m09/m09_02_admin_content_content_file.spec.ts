/**
 * 管理画面 コンテンツ管理「ファイル管理」E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m09_02_admin_content_content_file_e2e_cases.md に対応。
 * 本specには「E2E自動化」のうち非破壊で実行可能なケースのみ test 本体で実装し、
 * 破壊的(作成/アップロード保存/削除/移動)・要シード(既存ファイル/フォルダ)・要環境変数(アップロード制限)・
 * 手動(CSRFリクエスト改変/クリップボード)のケースは test.fixme（理由付き）で残す。
 * 手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(functions/ec-cube-enterprise/m09-02_admin_content_content_file.md / 設計書「表示メッセージ」)由来
 * （オラクル独立性）。実装の現挙動・Form制約(NotBlank/Regex)・i18n文言は期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・m08/*.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 * 破壊系/要シードは SEED-M09-02-FILES（user_data 配下のファイル/フォルダ配置）が前提。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ContentContentFilePage } from "../../../pages/admin/m09/m09_02_admin_content_content_file.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// 管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);

// 設計書「表示メッセージ」由来＝オラクル（i18n リソースの確認用ではなく仕様文言）。
const MSG_FILE_NOT_SELECTED = "選択されていません"; // 仕様：ファイル未選択
const MSG_SYMBOL = "使用できない文字が含まれています。"; // 仕様：使用不可文字（フォルダ/ファイル共用）
const MSG_PERIOD_FOLDER = "ピリオド(.)で始まる名前は使用できません。"; // 仕様：フォルダ先頭ピリオド
const MSG_DOTFILE = ".で始まるファイルはアップロードできません。"; // 仕様：ファイル先頭ピリオド
const MSG_EXTENSION = "アップロードできないファイル拡張子です。"; // 仕様：許可外拡張子
const INFO_RESTRICT = "ECCUBE_RESTRICT_FILE_UPLOAD"; // 仕様：表示時の情報メッセージ（部分一致）

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
}

test.describe(
  "管理画面 > コンテンツ管理 > ファイル管理",
  { tag: ["@admin", "@content", "@file"] },
  () => {
    // ===== 認証ガード（資格情報不要・非破壊） =====

    test("E2E-M09-02-080 未認証でファイル管理URL直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/content/file_manager`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 初期表示（ログインのみ・非破壊） =====

    test("E2E-M09-02-001 ファイル管理画面に「ファイル・フォルダを追加」カードが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fm = new ContentContentFilePage(page);
      await fm.goto();
      await expect(fm.addCardTitle).toBeVisible();
    });

    test("E2E-M09-02-002 アップロードファイル選択欄が複数選択（multiple）に対応する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fm = new ContentContentFilePage(page);
      await fm.goto();
      await expect(fm.fileInput).toHaveAttribute("multiple", /.*/); // 仕様：複数選択対応
    });

    test("E2E-M09-02-003 フォルダ名入力欄（プレースホルダ「フォルダ名」）と作成ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fm = new ContentContentFilePage(page);
      await fm.goto();
      await expect(fm.createFileInput).toHaveAttribute("placeholder", "フォルダ名");
      await expect(fm.createButton).toBeVisible();
    });

    test("E2E-M09-02-004 「このフォルダ内のファイル」一覧カードが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fm = new ContentContentFilePage(page);
      await fm.goto();
      await expect(fm.fileListCardTitle).toBeVisible();
    });

    test("E2E-M09-02-005 「フォルダ構成」ツリー（user_data 起点）が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fm = new ContentContentFilePage(page);
      await fm.goto();
      await expect(fm.directoryTreeCardTitle).toBeVisible();
      await expect(fm.directoryTree).toContainText("user_data");
    });

    test("E2E-M09-02-006 画面表示時に情報メッセージが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fm = new ContentContentFilePage(page);
      await fm.goto();
      await expect(page.locator("body")).toContainText(INFO_RESTRICT);
    });

    test("E2E-M09-02-015 情報メッセージは画面内に重複せず一度だけ表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fm = new ContentContentFilePage(page);
      await fm.goto();
      // 仕様(表示メッセージ「情報を一度だけ」/セッション)：情報メッセージは重複せず1件だけ表示する。
      const infoMessages = page
        .locator(".alert", { hasText: INFO_RESTRICT })
        .or(page.getByText(INFO_RESTRICT));
      await expect(infoMessages.first()).toBeVisible();
      await expect(infoMessages).toHaveCount(1);
    });

    test("E2E-M09-02-007 パンくず領域が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fm = new ContentContentFilePage(page);
      await fm.goto();
      await expect(fm.breadcrumb).toBeAttached();
    });

    // ===== フォルダ作成バリデーション（非破壊＝検証で拒否され作成されない） =====

    test("E2E-M09-02-011 フォルダ名未入力で作成→エラーになり作成されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fm = new ContentContentFilePage(page);
      await fm.goto();
      await fm.createFolder(""); // 空のまま作成（必須）
      await expect(fm.errors.first()).toBeVisible(); // 仕様：エラー表示・未作成（文言は実装依存のためオラクル化しない）
    });

    test("E2E-M09-02-012 使用できない文字を含むフォルダ名→エラー", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fm = new ContentContentFilePage(page);
      await fm.goto();
      await fm.createFolder("e2e@ng/name"); // 英数字_.- 以外を含む
      await fm.seeError(MSG_SYMBOL);
    });

    test("E2E-M09-02-013 ピリオドで始まるフォルダ名→エラー", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fm = new ContentContentFilePage(page);
      await fm.goto();
      await fm.createFolder(".e2ehidden"); // 先頭ピリオド
      await fm.seeError(MSG_PERIOD_FOLDER);
    });

    // ===== アップロードバリデーション（非破壊＝検証で拒否され保存されない） =====

    test("E2E-M09-02-021 ファイル未選択でアップロード→「選択されていません」", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fm = new ContentContentFilePage(page);
      await fm.goto();
      await fm.clickUpload(); // 未選択のまま送信
      await fm.seeError(MSG_FILE_NOT_SELECTED);
    });

    test("E2E-M09-02-022 許可外拡張子のファイル→「アップロードできないファイル拡張子です。」", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fm = new ContentContentFilePage(page);
      await fm.goto();
      await fm.uploadFiles({
        name: "e2e_invalid.exe",
        mimeType: "application/octet-stream",
        buffer: Buffer.from("e2e"),
      });
      await fm.seeError(MSG_EXTENSION);
    });

    test("E2E-M09-02-023 使用できない文字を含むファイル名→「使用できない文字が含まれています。」", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fm = new ContentContentFilePage(page);
      await fm.goto();
      await fm.uploadFiles({
        name: "e2e@ng.png", // @ は許可外（英数字・半角スペース・_-.() のみ許可）
        mimeType: "image/png",
        buffer: Buffer.from("e2e"),
      });
      await fm.seeError(MSG_SYMBOL);
    });

    test("E2E-M09-02-024 ピリオドで始まるファイル→「.で始まるファイルはアップロードできません。」", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fm = new ContentContentFilePage(page);
      await fm.goto();
      await fm.uploadFiles({
        name: ".e2ehidden.png", // 先頭ピリオド
        mimeType: "image/png",
        buffer: Buffer.from("e2e"),
      });
      await fm.seeError(MSG_DOTFILE);
    });

    // ===== ディレクトリトラバーサル（非破壊・GET直叩き） =====

    test("E2E-M09-02-052 表示で領域外（..）のパスを指定→HTTP404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const res = await page.goto(
        `/${ECCUBE_ADMIN_ROUTE}/content/file_view?file=${encodeURIComponent("/../../etc/passwd")}`
      );
      expect(res?.status()).toBe(404); // 仕様：領域外は見つからない
    });

    test("E2E-M09-02-053 ダウンロードで領域外（..）のパスを指定→HTTP404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const res = await page.goto(
        `/${ECCUBE_ADMIN_ROUTE}/content/file_download?select_file=${encodeURIComponent("/../../etc/passwd")}`
      );
      expect(res?.status()).toBe(404); // 仕様：領域外・フォルダは見つからない
    });

    test("E2E-M09-02-054 領域外（..）のカレントディレクトリ指定→404にならずトップ起点で再表示", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fm = new ContentContentFilePage(page);
      // 仕様(エッジケース)：カレント指定が領域外/..を含む場合は user_data トップを起点に表示する。
      const res = await page.goto(
        `/${ECCUBE_ADMIN_ROUTE}/content/file_manager?tree_select_file=${encodeURIComponent("../../")}`
      );
      expect(res?.status()).toBe(200); // 表示の処理フローに乗り、トップへフォールバック（エラー終了しない）
      await expect(fm.directoryTreeCardTitle).toBeVisible();
      await expect(fm.directoryTree).toContainText("user_data"); // 起点が user_data トップ
    });

    // ===== 保留（破壊的/要シード/要環境変数/手動。理由付き fixme＝抜け漏れ可視化） =====

    test.fixme(
      "E2E-M09-02-008 一覧の各ファイル行に更新日時が表示される（要シード：ファイル1件以上）",
      async () => {
        // 期待は仕様(フロント挙動 表示要素＝行はアイコン/名前/サイズ/更新日時/操作)由来。
      }
    );

    test.fixme(
      "E2E-M09-02-009 トップ階層以外では一覧先頭に親ディレクトリへ戻る行が表示される（要シード：サブフォルダ）",
      async () => {
        // 期待は仕様(フロント挙動 一覧の表示分け＝トップ階層以外は親ディレクトリ行)由来。
      }
    );

    test.fixme(
      "E2E-M09-02-027 同名ファイルの再アップロードは上書き保存される（破壊的＋要シード：同名ファイル既存）",
      async () => {
        // 期待は仕様(エッジケース 同名ファイル再アップロード＝重複を妨げず上書き)由来。
      }
    );

    test.fixme(
      "E2E-M09-02-028 複数ファイルの一部が検証外でも通った分は保存し成功件数を表示（破壊的：複数アップロード）",
      async () => {
        // 期待は仕様(エッジケース 一部スキップ・成功件数は実保存件数)由来。
      }
    );

    test.fixme(
      "E2E-M09-02-055 アップロード先(now_dir)が領域外→アップロード先不正エラーで保存されない（手動：hidden値改変）",
      async () => {
        // 期待は仕様(エッジケース アップロード先 now_dir 領域外＝不正エラー・未保存)由来。
        // ブラウザ操作では now_dir は正規値が付与されるため hidden 改変で検証＝手動。
      }
    );

    test.fixme(
      "E2E-M09-02-056 ダウンロード対象名が記号類のみで整形後に空→ファイル名指定なしの添付でDL（手動：内容確認）",
      async () => {
        // 期待は仕様(エッジケース 整形後空＝ファイル名指定なし添付)由来。添付ヘッダ確認は手動。
      }
    );


    test.fixme(
      "E2E-M09-02-010 有効なフォルダ名で作成→「作成しました」（破壊的：作成後の撤去が必要）",
      async () => {
        // 期待は仕様(処理フロー フォルダ作成 成功＝admin.common.create_complete)由来。
        // 共有環境保護のため使い捨てフォルダ作成→削除のクリーンアップ実装後に本体へ昇格。
      }
    );

    test.fixme(
      "E2E-M09-02-014 既存と同名のフォルダ名→重複エラー（要シード：SEED-M09-02-FILES 同名フォルダ）",
      async () => {
        // 期待は仕様(エッジケース 同名既存＝admin.content.file.dir_exists)由来。
      }
    );

    test.fixme(
      "E2E-M09-02-020 許可拡張子ファイルをアップロード→「N件のファイルをアップロードしました。(成功/選択)」（破壊的：保存後の撤去が必要）",
      async () => {
        // 期待は仕様(処理フロー アップロード 成功件数表示)由来。
      }
    );

    test.fixme(
      "E2E-M09-02-025 同名フォルダ存在時のファイルは拒否（要シード：SEED-M09-02-FILES 同名フォルダ）",
      async () => {
        // 期待は仕様(同名フォルダ衝突＝admin.content.file.same_name_folder_exists)由来。
      }
    );

    test.fixme(
      "E2E-M09-02-026 複数ファイルで同一の検証エラーは1回だけ表示（破壊的/間接：複数アップロード）",
      async () => {
        // 期待は仕様(エッジケース 同一文言1回)由来。
      }
    );

    test.fixme(
      "E2E-M09-02-030 一覧のフォルダ名リンク押下で当該フォルダへ移動（要シード：フォルダ1件以上）",
      async () => {
        // 期待は仕様(処理フロー フォルダ移動＝カレント再表示・パンくず更新)由来。
      }
    );

    test.fixme(
      "E2E-M09-02-040 削除ボタン押下で対象名を含む削除確認モーダル表示（要シード：ファイル1件以上）",
      async () => {
        // 期待は仕様(フロント挙動 削除モーダル＝admin.common.delete_modal__message %name%)由来。
      }
    );

    test.fixme(
      "E2E-M09-02-041 削除を確定→「削除しました」（破壊的＋要シード：削除用ファイル）",
      async () => {
        // 期待は仕様(処理フロー 削除 成功＝admin.common.delete_complete)由来。
      }
    );

    test.fixme(
      "E2E-M09-02-042 空でないフォルダの削除ボタンが無効化（要シード：非空フォルダ）",
      async () => {
        // 期待は仕様(業務ルール 空でないフォルダ削除不可＝disabled)由来。
      }
    );

    test.fixme(
      "E2E-M09-02-043 なりすまし対策トークン不正の削除は実行されない（手動：リクエスト改変）",
      async () => {
        // 期待は仕様(エラー処理 トークン不正は削除しない)由来。ブラウザ操作では正規トークンが付与されるため手動。
      }
    );

    test.fixme(
      "E2E-M09-02-050 表示ボタンは別タブ（target=_blank）でファイル表示URLを開く（要シード：ファイル1件以上）",
      async () => {
        // 期待は仕様(画面遷移 表示は別タブ)由来。a.action-view[target=_blank] の href＝content/file_view を確認。
      }
    );

    test.fixme(
      "E2E-M09-02-051 ダウンロードボタン押下で添付ファイルのダウンロードが発火（要シード：ファイル1件以上）",
      async () => {
        // 期待は仕様(処理フロー ダウンロード発火)由来。page.waitForEvent('download')。内容厳密検査は手動。
      }
    );

    test.fixme(
      "E2E-M09-02-060 パスコピー押下で公開URL入力欄が表示される（要シード：ファイル1件以上／実コピーは手動）",
      async () => {
        // 期待は仕様(フロント挙動 パスコピー＝.copy-file-path 表示)由来。execCommand('copy') の実コピーは手動。
      }
    );

    test.fixme(
      "E2E-M09-02-070 アップロード制限有効でメニュー非表示・HTTP403（手動：環境変数 ECCUBE_RESTRICT_FILE_UPLOAD=1）",
      async () => {
        // 期待は仕様(権限・認可 アップロード制限)由来。環境変数切替が必要なため手動。
      }
    );

    test.fixme(
      "E2E-M09-02-031 ツリーのフォルダ名押下で当該フォルダへ移動（要シード：フォルダ1件以上）",
      async () => {
        // 期待は仕様(処理フロー フォルダ移動 ツリー起点＝カレント再表示・パンくず更新)由来。
      }
    );

    test.fixme(
      "E2E-M09-02-032 パンくずの階層押下で当該フォルダへ移動（要シード：サブフォルダ）",
      async () => {
        // 期待は仕様(処理フロー フォルダ移動 パンくず起点＝押下階層をカレント再表示)由来。
      }
    );

    test.fixme(
      "E2E-M09-02-044 空フォルダの削除を確定→「削除しました」（破壊的＋要シード：空フォルダ）",
      async () => {
        // 期待は仕様(処理フロー 削除 空フォルダ成功＝admin.common.delete_complete)由来。041(ファイル)と対の空フォルダ削除。
      }
    );

    test.fixme(
      "E2E-M09-02-057 領域内ファイルの表示は内容を返す（HTTP200・要シード：領域内ファイル）",
      async () => {
        // 期待は仕様(処理フロー ファイル表示 正常系＝user_data配下は内容返却)由来。052(領域外404)と対の正常系。
      }
    );

    test.fixme(
      "E2E-M09-02-058 ダウンロードでフォルダを指定→HTTP404（要シード：領域内フォルダ）",
      async () => {
        // 期待は仕様(処理フロー ダウンロード フォルダ指定404)由来。053(領域外404)と異なる分岐。
      }
    );

    test.fixme(
      "E2E-M09-02-029 保存失敗ファイルは「（ファイル名）のアップロードに失敗しました。」（手動：保存失敗の誘発が困難）",
      async () => {
        // 期待は仕様(表示メッセージ エラー アップロード失敗)由来。ブラウザ操作で保存失敗を確実に誘発できず手動。
      }
    );

    test.fixme(
      "E2E-M09-02-045 削除対象が空/未指定/`/` は削除せず一覧へ戻る（手動：リクエスト改変）",
      async () => {
        // 期待は仕様(エッジケース 削除対象 空/未指定//＝no-op)由来。正規操作では対象パスが付与されるため手動。
      }
    );

    test.fixme(
      "E2E-M09-02-061 パスコピー実行後ツールチップがコピー完了表示へ切替（手動：クリップボード権限）",
      async () => {
        // 期待は仕様(フロント挙動 パスコピー＝コピー後ツールチップ切替)由来。execCommand('copy')はブラウザ権限依存で手動。
      }
    );
  }
);
