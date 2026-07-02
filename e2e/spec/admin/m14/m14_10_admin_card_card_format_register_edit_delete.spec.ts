/**
 * 管理画面 カード管理 > フォーマット 新規登録・編集・削除 E2E。
 * 納品ケース表 integration_test/e2e/m14_10_admin_card_card_format_register_edit_delete_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」（実装済み・非破壊）と、自動化予定だが要シード/後始末・要実機・仕様乖離検出の test.fixme のみを残す。
 * 手動/間接（DB反映の間接確認・CSRF 403）と対象外（検索UIなし・刷新先未実装の禁止/制限カードUI・ログ抑止）はケース表で全量管理する。
 * 期待結果は仕様（正本 functions/pf-eccube3/m14-10_admin_card_card_format_register_edit_delete.md / 観点表）由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 重要（設計源と刷新先の乖離・付帯表4）: 設計書は pf-eccube3 / HareruyaEc プラグインのリバース。刷新先 ec-cube-enterprise は
 *  - 削除ルートが DELETE `/{route}/product/format/{id}/delete`（設計は `/{route}/format/{id}/delete`）。
 *  - 禁止カード/制限カード/カードセット の複数選択UIが FormType・edit.twig に無い（設計の入力項目の一部が未実装）。
 *  - nameJp/nameEn/code/rule に Length 制約が無い（設計は最大長 64/10/65535）。文字列長の異常系は刷新先で再現しない可能性 → 要確認。
 *  - 検証失敗フラッシュ admin.register.failed が無い（form_errors 再表示のみ）／削除拒否は一覧固定遷移（設計は Referer）。
 * 該当ケース（027/029/054/089 系の文字列長、031 削除拒否の遷移先）は test.fixme で残し、要確認として可視化する（自動カバー済みではない）。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 本specもこれに倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針（安全第一・共有ステージング）:
 *  - ログインが要るケースは ECCUBE_ADMIN_USER/PASS（config/default.config.ts）が無いと走らないよう test.skip でガード。
 *  - 編集・削除など既存データに依存するケースは SEED-M14-10-FORMAT 系（環境変数 SEED_M14_FORMAT_ID 等）が無いとガードで停止。
 *  - 登録/更新/削除の成功（データ永続化・破壊）系は後始末が必要なため test.fixme（要シード/後始末）で残す。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { CardCardFormatRegisterEditDeletePage } from "../../../pages/admin/m14/m14_10_admin_card_card_format_register_edit_delete.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// 既存フォーマット（編集表示/削除モーダル確認用）。SEED-M14-10-FORMAT のレコードID。
const FORMAT_ID = process.env.SEED_M14_FORMAT_ID || "";
const HAS_FORMAT = !!FORMAT_ID;

const LOGIN_RE = /\/login(\?|$)/;
// 編集画面（成功遷移先）。/format/{id}/edit。
const EDIT_RE = /\/format\/\d+\/edit(\?|$)/;
// 一覧（削除成功遷移先）。/format（末尾編集/新規でない）。
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/format(\\?|$)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "カード管理 > フォーマット新規登録・編集・削除",
  { tag: ["@admin", "@card", "@format"] },
  () => {
    // ===== 未ログイン・認証ガード（資格情報不要） =====

    test("E2E-M14-10-070 未ログインで一覧URL直接→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/format`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M14-10-071 未ログインで編集URL直接→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/format/1/edit`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M14-10-072 未ログインで新規登録URL直接→管理ログイン画面へ誘導", async ({ page }) => {
      // 保護対象POST(/format/new)の入口GETの未ログインガード。070(一覧)/071(編集)と対。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/format/new`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 一覧・画面表示（ログインのみ・非破壊） =====

    test("E2E-M14-10-001 一覧に新規登録ボタンと列見出し（フォーマット名/略称/認定）が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fmt = new CardCardFormatRegisterEditDeletePage(page);
      await fmt.gotoList();
      await expect(fmt.newButton).toBeVisible();
      await expect(fmt.listTable).toContainText("フォーマット名");
      await expect(fmt.listTable).toContainText("略称");
      await expect(fmt.listTable).toContainText("認定");
    });

    test("E2E-M14-10-010 新規登録画面に見出し・必須項目・登録ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fmt = new CardCardFormatRegisterEditDeletePage(page);
      await fmt.gotoNew();
      await fmt.seeEditForm();
    });

    test("E2E-M14-10-011 編集画面に既存値がロードされ削除ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_FORMAT, "SEED-M14-10-FORMAT 未設定（SEED_M14_FORMAT_ID）");
      await login(page);
      const fmt = new CardCardFormatRegisterEditDeletePage(page);
      await fmt.gotoEdit(FORMAT_ID);
      await fmt.seeEditForm();
      await expect(fmt.nameJp).not.toHaveValue(""); // 既存値がロードされる
      await expect(fmt.deleteButtonOnEdit).toBeVisible(); // 編集時のみ削除ボタン
    });

    test("E2E-M14-10-012 新規登録画面に追加入力項目（コード/枚数/統率）が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fmt = new CardCardFormatRegisterEditDeletePage(page);
      await fmt.gotoNew();
      // 設計「入力項目」の網羅（010の必須項目に加えコード/枚数/統率）。禁止/制限/カードセットは刷新先未実装＝付帯表4#2。
      await expect(fmt.code).toBeVisible();
      await expect(fmt.mainMaxCardCount).toBeVisible();
      await expect(fmt.sideMaxCardCount).toBeVisible();
      await expect(fmt.useCommandFlg).toBeVisible();
    });

    test("E2E-M14-10-050 存在しないIDの編集はHTTP404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fmt = new CardCardFormatRegisterEditDeletePage(page);
      const resp = await fmt.gotoEdit(9999999);
      expect(resp?.status()).toBe(404); // エッジケース: 対象なし→404
    });

    // ===== バリデーション異常系（POST 失敗＝永続化されない・非破壊） =====

    test("E2E-M14-10-040 フォーマット名(日)未入力で検証エラー・登録画面に滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fmt = new CardCardFormatRegisterEditDeletePage(page);
      await fmt.gotoNew();
      await fmt.fillRequired({ nameJp: "" }); // 必須未入力
      await fmt.submit();
      await fmt.expectStayOnNewWithError(); // 登録画面に滞留
      await expect(fmt.nameJp).toBeVisible(); // 再表示
    });

    test("E2E-M14-10-041 フォーマット名(英)未入力で検証エラー・滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fmt = new CardCardFormatRegisterEditDeletePage(page);
      await fmt.gotoNew();
      await fmt.fillRequired({ nameEn: "" });
      await fmt.submit();
      await fmt.expectStayOnNewWithError();
    });

    test("E2E-M14-10-042 フォーマット名(英)に不正文字（日本語）で形式エラー・滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fmt = new CardCardFormatRegisterEditDeletePage(page);
      await fmt.gotoNew();
      await fmt.fillRequired({ nameEn: "日本語名" }); // 半角英数字等のみ許可
      await fmt.submit();
      await fmt.expectStayOnNewWithError();
    });

    test("E2E-M14-10-043 並び順未入力で検証エラー・滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fmt = new CardCardFormatRegisterEditDeletePage(page);
      await fmt.gotoNew();
      await fmt.fillRequired({ rank: "" });
      await fmt.submit();
      await fmt.expectStayOnNewWithError();
    });

    test("E2E-M14-10-044 並び順に非数値で数値エラー・滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fmt = new CardCardFormatRegisterEditDeletePage(page);
      await fmt.gotoNew();
      await fmt.fillRequired();
      await fmt.rank.fill("abc"); // 数値以外
      await fmt.submit();
      await fmt.expectStayOnNewWithError();
    });

    test("E2E-M14-10-045 フォーマットコードに不正文字で形式エラー・滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fmt = new CardCardFormatRegisterEditDeletePage(page);
      await fmt.gotoNew();
      await fmt.fillRequired();
      await fmt.code.fill("コード"); // 半角英数字等のみ許可
      await fmt.submit();
      await fmt.expectStayOnNewWithError();
    });

    test("E2E-M14-10-046 メタゲーム分析日数が範囲外で範囲エラー・滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fmt = new CardCardFormatRegisterEditDeletePage(page);
      await fmt.gotoNew();
      await fmt.fillRequired({ metaRange: "10001" }); // 仕様レンジ 1〜10000 の上限超過
      await fmt.submit();
      await fmt.expectStayOnNewWithError();
    });

    test("E2E-M14-10-047 メイン上限枚数が範囲外で範囲エラー・滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fmt = new CardCardFormatRegisterEditDeletePage(page);
      await fmt.gotoNew();
      await fmt.fillRequired();
      await fmt.mainMaxCardCount.fill("4097"); // 仕様レンジ 0〜4096 の上限超過
      await fmt.submit();
      await fmt.expectStayOnNewWithError();
    });

    test("E2E-M14-10-054 メタゲーム分析日数が下限-1（0）で範囲エラー・滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fmt = new CardCardFormatRegisterEditDeletePage(page);
      await fmt.gotoNew();
      await fmt.fillRequired({ metaRange: "0" }); // 仕様レンジ 1〜10000 の下限-1。046(上限+1)と対。
      await fmt.submit();
      await fmt.expectStayOnNewWithError();
    });

    test("E2E-M14-10-055 サイド上限枚数が範囲外（4097）で範囲エラー・滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fmt = new CardCardFormatRegisterEditDeletePage(page);
      await fmt.gotoNew();
      await fmt.fillRequired();
      await fmt.sideMaxCardCount.fill("4097"); // 仕様レンジ 0〜4096 の上限超過。047(メイン上限)と並ぶサイド枚数。
      await fmt.submit();
      await fmt.expectStayOnNewWithError();
    });

    // ===== JS 挙動・確認ダイアログ（非破壊） =====

    test("E2E-M14-10-060 統率チェックOFFで統率枚数欄がdisabled、ONで活性になる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const fmt = new CardCardFormatRegisterEditDeletePage(page);
      await fmt.gotoNew();
      // 初期（チェックなし想定）: disabled
      if (await fmt.useCommandFlg.isChecked()) await fmt.useCommandFlg.uncheck();
      await expect(fmt.commandMaxCardCount).toBeDisabled();
      await expect(fmt.commandMinCardCount).toBeDisabled();
      // ON: 活性化
      await fmt.useCommandFlg.check();
      await expect(fmt.commandMaxCardCount).toBeEnabled();
      await expect(fmt.commandMinCardCount).toBeEnabled();
    });

    test("E2E-M14-10-061 削除リンク押下で確認モーダルが表示される（送信前確認）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_FORMAT, "SEED-M14-10-FORMAT 未設定（SEED_M14_FORMAT_ID）");
      await login(page);
      const fmt = new CardCardFormatRegisterEditDeletePage(page);
      await fmt.gotoEdit(FORMAT_ID);
      await fmt.deleteButtonOnEdit.click();
      await expect(fmt.deleteModal).toBeVisible(); // 確認ダイアログ表示
      await expect(fmt.modalConfirmDelete).toBeVisible(); // 削除実行アンカー
    });

    // ===== 保留（破壊的/要シード後始末・要確認・手動。ケース表で全量管理） =====

    test.fixme(
      "E2E-M14-10-020 必須入力で新規登録が成功し当該IDの編集画面へ遷移＋成功メッセージ（要: 生成データ後始末）",
      async () => {
        // 期待は仕様(処理フロー#14 / 画面遷移)由来＝保存後 admin_format_edit へリダイレクト・成功フラッシュ。
        // 実データを永続化するため、識別接頭辞付きシードと後始末（撤去）確立後に実装。EDIT_RE/LIST_RE は本ファイル定義。
      }
    );

    test.fixme(
      "E2E-M14-10-021 既存値変更で更新成功し同一編集画面へ遷移＋成功メッセージ（要: SEED編集対象＋復元）",
      async () => {
        // 期待は仕様(画面遷移: 更新成功→編集画面再表示)由来。更新後に元値へ復元する後始末が必要。
      }
    );

    test.fixme(
      "E2E-M14-10-030 関連なしフォーマットを削除し一覧へ戻る＋削除完了メッセージ（要: 使い捨て削除可能シード）",
      async () => {
        // 期待は仕様(削除フロー#7: 一覧へリダイレクト・削除完了)由来。削除は破壊的のため使い捨てシードで実装。
        // 注: 刷新先の削除ルートは DELETE /{route}/product/format/{id}/delete（付帯表4 #1）。
      }
    );

    test.fixme(
      "E2E-M14-10-031 関連あり（大会/デッキ/アーキタイプ）フォーマットの削除が拒否されエラー表示（要確認: 遷移先がReferer/設計 vs 一覧/実装＝付帯表4 #5）",
      async () => {
        // 期待は仕様(削除フロー#4: 削除せずエラーフラッシュしRefererへ)由来。
        // 刷新先は一覧へ固定遷移するため、仕様どおり書くと遷移先で失敗＝乖離検出見込み。要シード（関連データ付）。
      }
    );

    test.fixme(
      "E2E-M14-10-032 デッキ紐付フォーマットの削除が拒否されエラー表示（削除フロー#4 デッキ分岐・要関連付シード）",
      async () => {
        // 期待は仕様(削除フロー#4: 削除せずエラーフラッシュ)由来。031(大会)と対の分岐。要 SEED-M14-10-FORMAT-LINKED-DECK。
        // 拒否先は刷新先で一覧固定（設計は Referer ＝付帯表4 #5）。各エラーメッセージ文言は付帯表4#6で相違＝未判定。
      }
    );

    test.fixme(
      "E2E-M14-10-033 アーキタイプ紐付フォーマットの削除が拒否されエラー表示（削除フロー#4 アーキタイプ分岐・要関連付シード）",
      async () => {
        // 期待は仕様(削除フロー#4)由来。031(大会)/032(デッキ)と並ぶアーキタイプ分岐。要 SEED-M14-10-FORMAT-LINKED-ARCHETYPE。
      }
    );

    test.fixme(
      "E2E-M14-10-052 存在しないIDへの削除DELETEはHTTP404（手動/要確認: 直接DELETE要・削除フロー#3 対象なし→404）",
      async () => {
        // 期待は仕様(削除フロー#3: 対象 ID なし→404)由来。GET不能のためUI到達不可。トークン有効・存在しないIDで直接DELETEし404を確認。
        // 050(GET404)/051(POST404)と並ぶDELETE経路の404。
      }
    );

    test.fixme(
      "E2E-M14-10-080 不正CSRFトークンでの削除はHTTP403（手動/要確認: UI経由はトークン自動付与のため直接DELETE要）",
      async () => {
        // 期待は仕様(エラー処理: CSRF無効→403)由来。アンカートークンを意図的に無効化する手順は実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M14-10-048 文字列長の境界（最大長/最大長+1）の正常×異常（要確認: 刷新先に Length 制約が無い＝付帯表4 #3）",
      async () => {
        // 期待は仕様(入力項目: nameJp 64文字上限 等)由来。刷新先は Length 未実装のため最大長+1 でも通過しうる＝乖離検出見込み。
      }
    );

    test.fixme(
      "E2E-M14-10-051 存在しないIDへの更新POSTはHTTP404（手動/要確認: 直接POST要・設計はGET/POST両方404）",
      async () => {
        // 期待は仕様(エッジケース: 編集対象 ID が存在しない→GET／POST とも 404)由来。
        // GET /format/9999999/edit が 404 のためフォームを開けず、UI操作では到達不能。POSTを直接送信して 404 を確認する。
      }
    );

    test.fixme(
      "E2E-M14-10-081 不正CSRFトークンでの登録/更新POSTはHTTP403（手動/要確認: 設計はPOST/DELETE両方403・直接POST要）",
      async () => {
        // 期待は仕様(エッジケース: CSRF無効→POST はフォームトークン単位で 403)由来。
        // UI経由はトークンが自動付与されるため、トークンを無効化した直接POSTが必要。080(DELETE)と対の異常系。
      }
    );

    test.fixme(
      "E2E-M14-10-062 編集画面の「戻る」で一覧へ遷移する（要実機確認: 戻るリンクのセレクタ未確定）",
      async () => {
        // 期待は仕様(画面遷移: 編集で戻る→一覧 GET)由来。edit.twig の戻る/一覧リンクのDOM根拠が未確定のため要実機確認。
        // セレクタ確定後に gotoEdit→戻る押下→一覧URL(LIST_RE)アサーションで実装する。
      }
    );
  }
);
