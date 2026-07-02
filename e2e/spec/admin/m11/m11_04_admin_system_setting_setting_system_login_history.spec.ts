/**
 * 管理画面 システム情報設定 > ログイン履歴（一覧・検索） E2E。
 * 納品ケース表 integration_test/e2e/m11_04_admin_system_setting_setting_system_login_history_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装する（手動/対象外・間接はケース表で全量管理＝specに大量fixmeを残さない）。
 * 期待結果は仕様(functions/ec-cube-enterprise/m11-04_admin_system_setting_setting_system_login_history.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行方針（安全第一・共有ステージング・本機能は参照のみで非破壊）:
 *  - 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 管理ログイン自体が dtb_login_history へ「成功」履歴を1行残すため、ログイン後は最低1行が存在する前提で
 *    列見出し・成功バッジ・件数・自ログインIDでの検索一致を観測する（追加シード不要）。
 *  - 失敗バッジ・ステータス絞り込み・期間絞り込み（混在データ／datetimepicker操作）・別欄の最大長検証・期間範囲下限は
 *    要シード/要実機のため test.fixme（ケース表 付帯表1/4 で管理）。
 *  - DB登録・更新観点(IT-23/IT-26)・CSRF(IT-15)・ログ秘匿(IT-20)はブラウザ観測外/別機能(認証m01)委譲＝ケース表で対象外管理。
 *
 * 資格情報（環境変数。コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）。検索一致の既知ログインIDにも用いる。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { SystemSettingSettingSystemLoginHistoryPage } from "../../../pages/admin/m11/m11_04_admin_system_setting_setting_system_login_history.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様(設計書 表示メッセージ)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const TITLE = "ログイン履歴"; // 設計書 画面タイトル（messages.ja.yaml:2794 と一致）
const SUB_TITLE = "システム設定"; // :2787 admin.setting.system（設計書用語「システム情報設定」と差異・付帯表4#1。実装ラベルではなく差異検出のため観測）
const KEYWORD_LABEL = "ログインID・IPアドレス"; // 設計書 入力項目「ログインID・IPアドレス」（messages.ja.yaml:3112 と一致）
// 注: 検証エラー/0件の表示文言は設計書(「検索条件が無効です。」「検索結果がありませんでした。」)と実装(messages.ja.yaml)が乖離するため（付帯表4#2）、
// 文言をオラクルに固定せず、設計書 処理フロー(L107)/エッジケース(L200)の構造的挙動（一覧を出さない・検証失敗時は詳細検索ブロックを開く）で判定する。

const LIST_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/setting/system/login_history`
);
// 255文字ちょうど(境界内)と256文字(境界外＝Length max=eccube_stext_len 255 超過)。
const MAX_LEN = 255;
const STR_255 = "a".repeat(MAX_LEN);
const STR_256 = "a".repeat(MAX_LEN + 1);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 > システム情報設定 > ログイン履歴",
  { tag: ["@admin", "@system"] },
  () => {
    // ===== 認証不要・非破壊 =====

    test("E2E-M11-04-050 未ログインで一覧URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/system/login_history`);
      // 仕様(権限・認可：未認証は利用不可→管理ログイン画面へ誘導)。一覧へ到達せずログイン画面URL・ログインID欄を観測。
      await expect(page).toHaveURL(/\/login(\?|$)/);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 初期表示・UI部品（HAS_CREDS・非破壊） =====

    test("E2E-M11-04-001 一覧表示でページタイトル「ログイン履歴」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      await lh.goto();
      await expect(lh.pageTitle).toContainText(TITLE);
    });

    test("E2E-M11-04-002 サブタイトルにシステム情報設定の見出しが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      await lh.goto();
      // 設計書はサブタイトルに「システム情報設定の見出し」を併記とする。実装ラベルは admin.setting.system「システム設定」。
      await expect(lh.subTitle).toContainText(SUB_TITLE);
    });

    test("E2E-M11-04-003 キーワード検索欄と検索ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      await lh.goto();
      await expect(lh.keyword).toBeVisible();
      await expect(lh.searchButton).toBeVisible();
    });

    test("E2E-M11-04-004 キーワード検索ラベルとヘルプアイコンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      await lh.goto();
      await expect(lh.keywordLabelHelp).toContainText(KEYWORD_LABEL);
      // ツールチップ用ヘルプアイコン（i.fa-question-circle）がラベル内に存在すること。
      await expect(lh.keywordLabelHelp.locator("i.fa-question-circle")).toBeVisible();
    });

    test("E2E-M11-04-005 詳細検索リンクが表示され、詳細検索ブロックは初期は折りたたまれている", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      await lh.goto();
      await expect(lh.detailToggle).toContainText("詳細検索");
      // 初期は collapse（show なし）＝中の入力欄が非表示。
      await expect(lh.userName).toBeHidden();
    });

    test("E2E-M11-04-006 詳細検索を開くとログインID/IPアドレス/期間/ステータス欄が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      await lh.goto();
      await lh.openDetail();
      await expect(lh.userName).toBeVisible();
      await expect(lh.clientIp).toBeVisible();
      await expect(lh.dateStart).toBeVisible();
      await expect(lh.dateEnd).toBeVisible();
    });

    test("E2E-M11-04-007 ステータスのチェックボックス（失敗・成功）が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      await lh.goto();
      await lh.openDetail();
      // 区分マスタ 失敗0／成功1 の複数選択チェックボックス（expanded）。
      await expect(lh.statusFail).toBeAttached();
      await expect(lh.statusSuccess).toBeAttached();
    });

    // ===== 一覧・検索（HAS_CREDS：自ログインの成功履歴が1行以上存在する前提・非破壊） =====

    test("E2E-M11-04-010 全条件空で検索すると一覧が表示される（全件・降順は間接）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      await lh.goto();
      // 仕様(エッジケース：全条件空で検索→全件を並び順で表示)。直前ログインで最低1行あるため一覧が描画される。
      await lh.searchKeyword("");
      await expect(lh.table).toBeVisible();
    });

    test("E2E-M11-04-011 一覧の列見出し（ID/ログインID/IPアドレス/ログイン試行日/ステータス）が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      await lh.goto();
      await expect(lh.tableHead).toContainText("ID");
      await expect(lh.tableHead).toContainText("ログインID");
      await expect(lh.tableHead).toContainText("IPアドレス");
      await expect(lh.tableHead).toContainText("ログイン試行日");
      await expect(lh.tableHead).toContainText("ステータス");
    });

    test("E2E-M11-04-012 検索結果件数「検索結果：N件が該当しました」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      await lh.goto();
      // 仕様(表示メッセージ：検索結果がある一覧表示時に件数を表示)。pagination 有時のみ表示。
      await expect(lh.searchResultCount).toContainText("検索結果");
      await expect(lh.searchResultCount).toContainText("件が該当しました");
    });

    test("E2E-M11-04-013 ステータスバッジ（成功/失敗）が一覧に表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      await lh.goto();
      // 仕様(フロント挙動/表示メッセージ)：成功失敗区分はバッジ表示。最低1行（自ログイン成功）でバッジが出る。
      await expect(lh.statusBadges.first()).toBeVisible();
    });

    test("E2E-M11-04-014 キーワード（自ログインID）で検索すると該当行が一覧に含まれる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      await lh.goto();
      // 仕様(集計条件：キーワードはログインID/IPアドレスに部分一致)。直前ログインの user_name で該当行が出る。
      await lh.searchKeyword(ECCUBE_ADMIN_USER);
      await expect(lh.rowContaining(ECCUBE_ADMIN_USER).first()).toBeVisible();
    });

    test("E2E-M11-04-015 詳細検索のログインID単独で検索すると該当行が含まれる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      await lh.goto();
      // 仕様(集計条件：ログインID検索は user_name に部分一致)。
      await lh.searchUserName(ECCUBE_ADMIN_USER);
      await expect(lh.rowContaining(ECCUBE_ADMIN_USER).first()).toBeVisible();
    });

    test("E2E-M11-04-016 成功区分が青系バッジ「成功」で表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      await lh.goto();
      // 仕様(成功区分バッジ：成功は青系)。直前ログインは成功＝「成功」バッジ(badge-ec-blue)。
      const successBadge = page.locator("table.table tbody .badge.badge-ec-blue", {
        hasText: "成功",
      });
      await expect(successBadge.first()).toBeVisible();
    });

    test("E2E-M11-04-018 キーワードに前後スペースを含めても該当行が含まれる（スペース除去）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      await lh.goto();
      // 仕様(集計条件/エッジケース 設計書L122,L196：キーワードは半角・全角スペース除去後に部分一致)。
      // 自ログインIDを前後スペース付きで入力しても、スペース除去後に同じ該当行が一覧へ出ることを観測。
      await lh.searchKeyword(`　 ${ECCUBE_ADMIN_USER} 　`);
      await expect(lh.rowContaining(ECCUBE_ADMIN_USER).first()).toBeVisible();
    });

    test("E2E-M11-04-019 キーワードに全角・途中スペースを含めても該当行が含まれる（スペース除去）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      await lh.goto();
      // 仕様(業務ルール/エッジケース 設計書L173,L196：半角・全角スペースを除去してから部分一致)。
      // 全角スペースで前後を囲い、かつ途中にも全角スペースを挟む。除去後は元のログインIDに戻り同一行が出る。
      const mid =
        ECCUBE_ADMIN_USER.length > 1
          ? `${ECCUBE_ADMIN_USER[0]}　${ECCUBE_ADMIN_USER.slice(1)}`
          : ECCUBE_ADMIN_USER;
      await lh.searchKeyword(`　${mid}　`);
      await expect(lh.rowContaining(ECCUBE_ADMIN_USER).first()).toBeVisible();
    });

    // ===== ページ送り・表示件数・再表示 =====

    test("E2E-M11-04-020 表示件数プルダウン変更で件数付きURL（/1?page_count=N）へ遷移する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      await lh.goto();
      // 仕様(JS挙動/画面遷移 設計書L111)：プルダウン変更で {page_no:1, page_count:選択値} のURL（/login_history/1?page_count=N）へ遷移。
      await expect(lh.pageCountPulldown).toBeVisible();
      const selected = await lh.changePageCountToLast();
      await expect(page).toHaveURL(
        new RegExp(
          `/${ECCUBE_ADMIN_ROUTE}/setting/system/login_history/1\\?page_count=${selected}`
        )
      );
    });

    test("E2E-M11-04-021 ページ送りGET（/{page_no}）で一覧が再表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      await lh.goto();
      // 仕様(処理フロー L98/L113：ページ番号付きURLは保存済み検索条件のまま指定ページを表示)。
      // 先に検索条件を確定（セッション保存）→ページ送りで条件が保持されることを検索欄の値で観測。
      await lh.searchKeyword(ECCUBE_ADMIN_USER);
      await lh.gotoPage(1);
      await expect(page).toHaveURL(LIST_RE);
      await expect(lh.keyword).toHaveValue(ECCUBE_ADMIN_USER); // 保存済み検索条件で再表示
    });

    test("E2E-M11-04-022 resume=1 で前回条件・ページの一覧が再表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      await lh.goto();
      // 仕様(利用者視点の入口/処理フロー L98：resume=1 はセッションの検索条件・ページ番号で再表示)。
      // 先に検索条件を確定→resumeでセッション保存条件が復元されることを検索欄の値で観測。
      await lh.searchKeyword(ECCUBE_ADMIN_USER);
      await lh.gotoResume();
      await expect(page).toHaveURL(LIST_RE);
      await expect(lh.keyword).toHaveValue(ECCUBE_ADMIN_USER); // セッション保存条件で再表示
    });

    test("E2E-M11-04-041 表示件数に不正値を渡しても採用されず一覧表示が継続する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      // 仕様(業務ルール L175 / エッジケース L201 / エラー処理 L317：page_count がマスタ値に一致しなければ採用せず、
      // 保存済みまたは既定の件数で表示)。不正値でも検証エラーを出さず一覧が描画されることを構造的に観測（文言固定しない）。
      await lh.gotoPageCount(1, 99999999);
      await expect(lh.table).toBeVisible();
      await expect(lh.userName).toBeHidden(); // 検証エラー由来の詳細検索自動展開が無いこと
    });

    test("E2E-M11-04-051 非数値のpage_noを指定すると一覧に到達しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      // 仕様(利用者視点の入口 L73：{page_no} は数字のみ)。非数値はページ送りルートに一致せず一覧へ到達しない。
      const resp = await lh.gotoRawPage("abc");
      expect(resp?.ok()).toBeFalsy(); // ルート不一致＝一覧(200)に到達しない
      await expect(lh.pageTitle).not.toContainText(TITLE);
    });

    // ===== バリデーション（正常境界×異常境界の対） =====

    test("E2E-M11-04-030 キーワード255文字超過で検証エラー：検索無効メッセージが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      await lh.goto();
      // 仕様(処理フロー L107：検証失敗時は一覧を出さず、詳細検索ブロックを開いた状態で再描画)。
      // 文言ではなく構造的挙動で判定（オラクル独立性・付帯表4#2）。
      await lh.searchKeyword(STR_256);
      await expect(lh.table).toBeHidden();
      await expect(lh.userName).toBeVisible(); // has_errors→#searchDetail show（twig:50）
    });

    test("E2E-M11-04-031 キーワード255文字ちょうどはエラーにならず処理継続（境界内）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      await lh.goto();
      // 仕様(バリデーション：最大長以内は検証成功で継続 設計書L107)。検証エラーが無いため詳細検索ブロックは自動展開されない。
      await lh.searchKeyword(STR_255);
      await expect(lh.userName).toBeHidden(); // has_errors=false→#searchDetail show付かず（twig:50）
    });

    test("E2E-M11-04-040 該当0件のキーワードで検索すると0件メッセージが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
      await lh.goto();
      // 仕様(エッジケース L200：検索結果0件は一覧表を出さない)。検証は成功するため詳細検索ブロックは自動展開されない（030の検証失敗と区別）。
      await lh.searchKeyword("e2e-no-such-login-zzz-000000");
      await expect(lh.table).toBeHidden();
      await expect(lh.userName).toBeHidden();
    });

    // ===== 手動/要実機・要シード（ケース表 付帯表1/4 で全量管理。抜け漏れ可視化のため fixme） =====

    test.fixme(
      "E2E-M11-04-032 ログインID欄/IPアドレス欄の255文字超過で検証エラー（代表030でカバー・別欄個別は要実機）",
      async () => {
        // 期待は仕様(バリデーション 各欄 max255)由来。詳細検索内 user_name/client_ip 個別の超過を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M11-04-033 期間（開始/終了）に下限0003-01-01未満で範囲エラー（要: datetimepicker操作）",
      async () => {
        // 期待は仕様(バリデーション Range 下限0003-01-01)由来。日時ピッカーの入力手順を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M11-04-034 失敗区分が赤系バッジ「失敗」で表示される（要: 失敗履歴シード SEED-M11-04-FAIL）",
      async () => {
        // 期待は仕様(失敗区分バッジ：失敗は赤系 badge-ec-red)由来。失敗履歴行の投入後に実装。
      }
    );

    test.fixme(
      "E2E-M11-04-035 ステータス「成功」のみチェックで成功行のみに絞り込まれる（要: 成功/失敗混在データ）",
      async () => {
        // 期待は仕様(集計条件：チェックした区分のいずれかに一致で絞り込み)由来。混在データのシード後に実装。
      }
    );

    test.fixme(
      "E2E-M11-04-036 期間指定で日時範囲が絞り込まれる（要: 混在日時データ・datetimepicker操作）",
      async () => {
        // 期待は仕様(集計条件：開始以上・終了未満)由来。日時ピッカー操作と混在データの整備後に実装。
      }
    );

    test.fixme(
      "E2E-M11-04-017 IPアドレス欄で検索すると該当行が含まれる（要: 既知IPの履歴シード SEED-M11-04-MIX）",
      async () => {
        // 期待は仕様(集計条件 設計書L124,L184：client_ip 部分一致)由来。
        // 共有ステージングでは自ログインのIPが不定のため、既知 client_ip を持つ履歴行のシード後に実装。
      }
    );

    test.fixme(
      "E2E-M11-04-037 一覧が作成日時降順・同一日時内ID降順で並ぶ（要: 既知の複数履歴シード）",
      async () => {
        // 期待は仕様(処理フロー L100 / 集計条件 L128：create_date DESC, id DESC)由来。
        // 並び順の検証には既知日時・IDの複数行が必要なため、混在シード整備後に行の並びを検証する。
      }
    );
  }
);
