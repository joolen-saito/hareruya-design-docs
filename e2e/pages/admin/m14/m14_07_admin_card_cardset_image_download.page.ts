import { APIResponse, Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 カードセット管理「収録カード画像 ZIP ダウンロード（セット別／言語別）」Page Object（M14-07）。
 * 納品ケース表 integration_test/e2e/m14_07_admin_card_cardset_image_download_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m14-07_admin_card_cardset_image_download.md / 観点表)由来（オラクル独立性）。
 * 実装の現挙動・刷新先の個別エラーメッセージキー文言・内部セッションキー名は期待値に流用しない。
 * セレクタ（位置情報）のみ刷新先 ec-cube-enterprise の Twig/Controller 由来で確定する。
 *
 * 本機能はカードセット一覧（admin_cardset_list = GET /<route>/cardset）上部の2ボタンから
 * formaction を差し替えて POST 送信し、選択カードセットの収録カード画像を単一 ZIP（card_image.zip）で返す。
 * 自動化はUI部品表示・確認ダイアログ（未選択時 JS confirm）・送信可否制御・ダウンロード発火・ファイル名・
 * 失敗時のエラーフラッシュ＋一覧滞留・未認証ガードに限る。
 * ZIP内容（言語フォルダ構造・ファイル数・1枚打ち切り）・デッドリンクフラグ更新・列挙順は実ファイル/DBの手動確認。
 *
 * セレクタ根拠（app/template/admin/Cardset/index.twig）:
 *  - 一覧:                 route admin_cardset_list = GET /<route>/cardset（CardsetController.php:49）
 *  - セット別DLボタン:       #admin_cardset_download_by_set（index.twig:70 / formaction admin_cardset_download index.twig:72 /
 *                          ラベル trans admin.card.cardset.download_images_by_set messages.ja.yaml:4190）
 *  - 言語別DLボタン:         #admin_cardset_download_by_lang（index.twig:77 / formaction admin_cardset_download_each_lang index.twig:79 /
 *                          ラベル trans admin.card.cardset.download_images_by_language messages.ja.yaml:4191）
 *  - 行チェックボックス:      input[name="cardsetIds[]"]（index.twig:144-146）
 *  - 全選択チェックボックス:   #chose_all（index.twig:129 / JS index.twig:34-37）
 *  - 未選択時 confirm:       JS index.twig:40-48（trans admin.card.cardset.confirm.download_promo_card_list messages.ja.yaml:4207）
 *
 * ルート/応答（src/Eccube/Controller/Admin/Card/CardsetController.php / Service/Admin/Cardset/CardsetDownloadAction.php）:
 *  - セット別:  admin_cardset_download = POST /<route>/cardset/download（CardsetController.php:233）
 *  - 言語別:    admin_cardset_download_each_lang = POST /<route>/cardset/download_each_lang（CardsetController.php:252）
 *  - 成功応答:  BinaryFileResponse Content-Disposition attachment; filename=card_image.zip（CardsetController.php:274-281）
 *  - 失敗応答:  addError(flash) ＋ redirect admin_cardset_list（CardsetController.php:243-245,262-264 /
 *               エラー CardsetDownloadAction.php:173 admin.card.cardset.error.download_no_images 等）
 *
 * 仕様乖離メモ（テストは仕様どおりに書き、期待値を実装へ書き換えない。詳細はケース表 付帯表4）:
 *  - 設計書の言語別ルートは admin_cardset_download_lang（/cardset/download_lang）。刷新先は download_each_lang に改名。
 *  - 設計書のエラーキー（...set_not_exist_card / admin.download.card.not_found / ...image_not_exist）は刷新先で
 *    admin.card.cardset.error.download_no_images 等に集約。E2Eは「エラーフラッシュ表示＋一覧滞留」を挙動で期待する。
 *  - 設計書はエラー時 admin_cardset_page（page_no復元）へ。刷新先は admin_cardset_list（復元なし）。
 *  - 一覧フォームに CSRF トークン hidden が無く、download POST は isTokenValid() を呼ばない。設計書は入力項目に
 *    CSRF トークンを明記するため仕様乖離（不具合候補#5）。CSRF観点は手動/要確認（無トークンPOST通過の検出。
 *    トークン名・文言はオラクル化しない）。
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class CardCardsetImageDownloadPage {
  readonly page: Page;
  readonly listUrl: string; // カードセット一覧（ダウンロード操作の起点画面）
  readonly downloadBySetPath: string; // セット別ダウンロード POST ルート（未認証POST到達検証用）

  readonly downloadBySetButton: Locator; // セット別ダウンロードボタン（index.twig:70）
  readonly downloadByLangButton: Locator; // 言語別ダウンロードボタン（index.twig:77）
  readonly rowCheckboxes: Locator; // 各行の選択チェックボックス（index.twig:144-146）
  readonly selectAll: Locator; // 全選択チェックボックス（index.twig:129）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/cardset`;
    this.downloadBySetPath = `/${ECCUBE_ADMIN_ROUTE}/cardset/download`;

    this.downloadBySetButton = page.locator("#admin_cardset_download_by_set");
    this.downloadByLangButton = page.locator("#admin_cardset_download_by_lang");
    this.rowCheckboxes = page.locator('input[name="cardsetIds[]"]');
    this.selectAll = page.locator("#chose_all");
  }

  /** カードセット一覧（ダウンロード操作の起点画面）を開く。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /**
   * 未認証で「ダウンロードPOSTルート」へ POST 送信する（権限・認可: 未ログインは当POSTに到達しない）。
   * 入口はPOST専用（設計書 利用者視点の入口）。GET 直アクセスでは「未ログインPOSTが処理に到達しない」
   * オラクルにならないため、APIRequestContext で実際に POST し、リダイレクト無効で応答を観測する。
   */
  async postDownloadBySetUnauthenticated(): Promise<APIResponse> {
    return this.page.request.post(this.downloadBySetPath, {
      maxRedirects: 0,
      failOnStatusCode: false,
    });
  }

  /** 先頭のカードセット行をチェックする。 */
  async checkFirstRow() {
    await this.rowCheckboxes.first().check();
  }

  /** 全選択チェックボックスをオンにする。 */
  async checkSelectAll() {
    await this.selectAll.check();
  }

  /**
   * 未選択でダウンロードボタンを押したとき表示される確認ダイアログのメッセージを取得し、
   * dismiss（キャンセル＝e.preventDefault で送信抑止）する。
   * 仕様（フロント挙動「未選択で confirm」）どおりにダイアログが出ること自体を検証する。
   */
  async clickAndCaptureConfirm(button: Locator): Promise<string> {
    let message = "";
    this.page.once("dialog", async (dialog) => {
      message = dialog.message();
      await dialog.dismiss(); // キャンセル＝送信させない
    });
    await button.click();
    await expect.poll(() => message).not.toBe("");
    return message;
  }

  /**
   * 未選択でダウンロードボタンを押し、確認ダイアログを accept（OK）して送信を続行させる。
   * 仕様（フロント挙動「OKでそのまま送信」＋利用者視点の入口「未選択時はID=0でPOSTが進む」）どおり、
   * 確認OKで送信が抑止されないこと（プロモ相当POSTへ進むこと）を検証するための補助。
   * 押下後の遷移／ダウンロードは呼び出し側で観測する。
   */
  async clickAndAcceptConfirm(button: Locator): Promise<void> {
    this.page.once("dialog", async (dialog) => {
      await dialog.accept(); // OK＝送信を続行させる
    });
    await button.click();
  }

  /** ダウンロードボタン押下でダウンロード発火を待って Download を返す（成功系。要シード＋S3）。 */
  async downloadVia(button: Locator): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      button.click(),
    ]);
    return download;
  }

  /** カードセット一覧（ダウンロード操作の起点画面）に到達していること。 */
  async seeListScreen() {
    await expect(this.downloadBySetButton).toBeVisible();
  }

  /** 2ダウンロードボタンが一覧上部に表示されること（仕様: フロント挙動 表示要素）。 */
  async seeDownloadButtons() {
    await expect(this.downloadBySetButton).toBeVisible();
    await expect(this.downloadByLangButton).toBeVisible();
  }
}
