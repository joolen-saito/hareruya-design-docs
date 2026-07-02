/**
 * 管理画面 受注管理 対応状況一括変更（M05-12）E2E。納品ケース表
 * integration_test/e2e/m05_12_admin_order_order_bulk_status_change_e2e_cases.md に対応。
 * 本specには「E2E自動化」かつ非破壊のケースのみ実装する。一括変更の実行（PUT送信）は受注の
 * order_status・在庫・ポイント・会員集計を更新する破壊的操作のため test.fixme（理由付き・要シード/隔離）で残す。
 * 手動/間接・対象外はケース表で全量管理し、spec に大量の fixme を残さない（規約）。
 * 期待結果は仕様（正本 functions/ec-cube-enterprise/m05-12_admin_order_order_bulk_status_change.md /
 * 観点表 / messages.ja.yaml）由来（オラクル独立性）。実装の現挙動・Form制約値を期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・m05/* も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *
 * 前提データ: 一括操作領域・確認モーダルは受注一覧に出荷行が1件以上あるときのみ描画される
 * （Order/index.twig:1094 totalItemCount>0）。読み取り系テストは行が無い環境では skip する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OrderOrderBulkStatusChangePage } from "../../../pages/admin/m05/m05_12_admin_order_order_bulk_status_change.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// 仕様（messages.ja.yaml / index.twig スクリプト直書き）由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const STATUS_INITIAL = "対応状況の変更"; // :2372 admin.order.change_status（プルダウン初期行）
const NO_STATUS_ALERT = "対応状況を選択してください"; // confirmationModal_js.twig:47（変更先未選択の警告）
const IN_PROGRESS = "処理中..."; // :2362 admin.order.bulk_action__in_progress_message
const COMPLETE = "完了しました。"; // :2363 admin.order.bulk_action__complete_message

const LOGIN_RE = /\/login(\?|$)/;
const RESUME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/order\\?(.*)resume=1`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
}

test.describe("受注管理 > 対応状況一括変更", { tag: ["@admin", "@order"] }, () => {
  // ===== 資格情報不要・非破壊（常時実行可） =====

  test("E2E-M05-12-050 未ログインで受注一覧URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order`);
    await expect(page.locator("#login_id")).toBeVisible(); // 管理ログイン画面へ誘導（権限・認可: 未認証は利用不可）
  });

  test("E2E-M05-12-051 未ログインで更新エンドポイントへ直接アクセス→処理されず管理ログインへ誘導", async ({ page }) => {
    // 更新エンドポイントは PUT・XHR・トークン必須。未認証のブラウザGETでは到達できない（利用不可）。
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/shipping/1/order_status`);
    await expect(page).toHaveURL(LOGIN_RE);
  });

  // ===== 要ログイン・非破壊（受注一覧の表示・選択JS。出荷行データに依存） =====

  test("E2E-M05-12-001 受注一覧にヘッダ全選択・各出荷行チェックボックスが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const target = new OrderOrderBulkStatusChangePage(page);
    await target.gotoList();
    test.skip(!(await target.hasRows()), "受注一覧に出荷行が無い（要 SEED-M05-12-ORDER）");
    await target.seeListSelectionControls();
  });

  test("E2E-M05-12-003 対応状況プルダウンの初期行が「対応状況の変更」", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const target = new OrderOrderBulkStatusChangePage(page);
    await target.gotoList();
    test.skip(!(await target.hasRows()), "受注一覧に出荷行が無い（要 SEED-M05-12-ORDER）");
    // 初期選択 value="" のラベルが「対応状況の変更」であること（DOM上は存在。領域は1件チェックで表示）。
    await expect(target.statusSelect.locator('option[value=""]')).toHaveText(STATUS_INITIAL);
  });

  test("E2E-M05-12-002 対応状況プルダウンに初期行＋登録済みの対応状況が並び順で表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const target = new OrderOrderBulkStatusChangePage(page);
    await target.gotoList();
    test.skip(!(await target.hasRows()), "受注一覧に出荷行が無い（要 SEED-M05-12-ORDER）");
    // 仕様（フロント挙動 表示要素: 初期行に続けて登録済みの対応状況を並び順で並べる）由来。
    // 初期行 value="" の後に value 付きの対応状況オプションが1件以上並ぶこと（値そのものは実装依存のため数のみ判定）。
    await expect(target.statusSelect.locator('option[value=""]')).toHaveText(STATUS_INITIAL);
    const valued = target.statusSelect.locator('option:not([value=""])');
    expect(await valued.count()).toBeGreaterThan(0);
  });

  test("E2E-M05-12-009 各出荷行チェックボックスが受注ではなく出荷ID単位の更新先を保持する", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const target = new OrderOrderBulkStatusChangePage(page);
    await target.gotoList();
    test.skip(!(await target.hasRows()), "受注一覧に出荷行が無い（要 SEED-M05-12-ORDER）");
    // 仕様（利用者視点の入口/処理フロー: 更新エンドポイントのパスのidは出荷のID。受注IDではない）由来。
    const url = await target.firstRowUpdateStatusUrl();
    expect(url).toMatch(/\/shipping\/\d+\/order_status/); // /shipping/{出荷ID}/order_status 形式
  });

  test("E2E-M05-12-008 ヘッダ全選択をOFFにすると全出荷行が解除される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const target = new OrderOrderBulkStatusChangePage(page);
    await target.gotoList();
    test.skip(!(await target.hasRows()), "受注一覧に出荷行が無い（要 SEED-M05-12-ORDER 複数行）");
    // 仕様「全選択チェックボックスのオンで全行を選択、オフで全解除する」(正本:90) の正常/異常対（006↔008）。
    await target.toggleSelectAll();
    const total = await target.rowCheckboxes.count();
    await expect(target.checkedRowCheckboxes()).toHaveCount(total);
    await target.toggleSelectAllOff();
    await expect(target.checkedRowCheckboxes()).toHaveCount(0); // 全選択OFFで全解除
  });

  test("E2E-M05-12-004 チェック0件のとき一括操作領域が非表示", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const target = new OrderOrderBulkStatusChangePage(page);
    await target.gotoList();
    test.skip(!(await target.hasRows()), "受注一覧に出荷行が無い（要 SEED-M05-12-ORDER）");
    await expect(target.decisionButton).toBeHidden(); // 0件は .btn-bulk-wrapper が d-none
  });

  test("E2E-M05-12-005 出荷行を1件チェックすると一括操作領域（見出し・プルダウン・決定）が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const target = new OrderOrderBulkStatusChangePage(page);
    await target.gotoList();
    test.skip(!(await target.hasRows()), "受注一覧に出荷行が無い（要 SEED-M05-12-ORDER）");
    await target.checkFirstRow();
    await target.seeBulkArea();
  });

  test("E2E-M05-12-006 ヘッダ全選択チェックで全出荷行が選択される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const target = new OrderOrderBulkStatusChangePage(page);
    await target.gotoList();
    test.skip(!(await target.hasRows()), "受注一覧に出荷行が無い（要 SEED-M05-12-ORDER）");
    await target.toggleSelectAll();
    const total = await target.rowCheckboxes.count();
    // チェック済みは input 自身を :checked で絞り込む（子孫検索ではない）。
    await expect(target.checkedRowCheckboxes()).toHaveCount(total);
  });

  test("E2E-M05-12-007 全選択中に個別チェックを外すとヘッダ全選択が解除される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const target = new OrderOrderBulkStatusChangePage(page);
    await target.gotoList();
    test.skip(!(await target.hasRows()), "受注一覧に出荷行が無い（要 SEED-M05-12-ORDER 複数行）");
    test.skip((await target.rowCheckboxes.count()) < 1, "出荷行が無い");
    // 仕様「個別チェックの変更時は全選択チェックを外す」(正本:90) の正常/異常対。
    await target.toggleSelectAll();
    expect(await target.isSelectAllChecked()).toBe(true);
    await target.uncheckFirstRow();
    expect(await target.isSelectAllChecked()).toBe(false); // 個別解除でヘッダ全選択が外れる
  });

  test("E2E-M05-12-010 変更先未選択で決定→「対応状況を選択してください」アラートで中断", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const target = new OrderOrderBulkStatusChangePage(page);
    await target.gotoList();
    test.skip(!(await target.hasRows()), "受注一覧に出荷行が無い（要 SEED-M05-12-ORDER）");
    await target.checkFirstRow(); // 一括操作領域を出す（クライアント側のみ）
    let dialogMessage = "";
    page.on("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });
    await target.clickDecision(); // 変更先 未選択のまま決定
    await expect.poll(() => dialogMessage).toContain(NO_STATUS_ALERT);
  });

  test("E2E-M05-12-011 変更先未選択で決定→確認モーダルを開かない（サーバへ送信しない）", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const target = new OrderOrderBulkStatusChangePage(page);
    await target.gotoList();
    test.skip(!(await target.hasRows()), "受注一覧に出荷行が無い（要 SEED-M05-12-ORDER）");
    await target.checkFirstRow();
    page.on("dialog", async (dialog) => {
      await dialog.dismiss();
    });
    await target.clickDecision();
    await expect(target.modal).toBeHidden(); // 警告のみで確認モーダルは表示しない
  });

  // ===== 破壊的（一括変更を実行＝order_status・在庫・ポイント・会員集計を更新）＝要シード/隔離。未実装で可視化 =====

  test.fixme(
    "E2E-M05-12-020 出荷選択＋変更先選択＋決定→確認モーダルが開き進捗バーと「処理中...」を表示（破壊的・要 SEED-M05-12-ORDER）",
    async () => {
      // 期待は仕様（処理フロー 確認モーダルを開く / 表示メッセージ admin.order.bulk_action__in_progress_message=「処理中...」:2362）由来。
      // checkFirstRow → selectStatus(遷移可能な対応状況ID) → clickDecision で #sentUpdateModal 表示・.progress 表示・.modal-message=「処理中...」。
      // 決定で更新エンドポイントへ PUT が発火するため破壊的。隔離受注で実装する。
      void IN_PROGRESS;
    }
  );

  test.fixme(
    "E2E-M05-12-021 全件の送信が終わると進捗バーを隠し「完了しました。」と閉じるボタンを表示（破壊的・要 SEED-M05-12-ORDER）",
    async () => {
      // 期待は仕様（JS挙動(完了) / 表示メッセージ admin.order.bulk_action__complete_message=「完了しました。」:2363 / 閉じる admin.common.close:1450）由来。
      // 一括変更完了後 .modal-message=「完了しました。」・#bulkChangeComplete（「閉じる」）が visible。
      void COMPLETE;
    }
  );

  test.fixme(
    "E2E-M05-12-022 閉じるボタン→受注一覧へ戻り検索条件を復旧して再表示（resume=1）（破壊的・要 SEED-M05-12-ORDER）",
    async () => {
      // 期待は仕様（画面遷移 確認モーダルの閉じる→受注一覧再表示・検索条件をセッションから復旧 / 正本:78・index.twig:289-291 admin_order?resume=1）由来。
      // 検索条件復旧の確認: 事前に一覧で検索条件（例: 対応状況フィルタ/ページ番号）を設定→一括変更→閉じる→
      // toHaveURL(RESUME_RE) かつ復旧後の一覧に同一の検索条件・ページ番号が反映されていること（URL resume=1 だけに依存しない）。
      void RESUME_RE;
    }
  );

  test.fixme(
    "E2E-M05-12-032 複数選択で成功＋スキップ/遷移不可が混在しても他出荷の変更は確定する（部分的失敗）（破壊的・要 混在SEED）",
    async () => {
      // 期待は仕様（データ整合性 部分的失敗: 一部の出荷がスキップ・遷移不可・エラーでも他の出荷の変更は確定する / 正本:221）由来。
      // 成功する出荷＋スキップ/遷移不可になる出荷を同時選択し決定→ #sentUpdateModal #bulkErrors に当該出荷の NOTICE 行が出つつ、
      // 成功出荷は閉じる→一覧再表示で変更が確定していること（一括全体をロールバックしない）。
    }
  );

  test.fixme(
    "E2E-M05-12-030 変更先＝現在の対応状況と同一→結果一覧に「<出荷ID>: ステータス変更をスキップしました」（破壊的経路・要 同一状況SEED）",
    async () => {
      // 期待は仕様（エッジケース 同一スキップ / messages.ja.yaml:2410 admin.order.skip_change_status）由来。
      // 現在の対応状況と同じ変更先を選び決定→ #bulkErrors に NOTICE 行（スキップ文言）が追記され、変更は確定しない。
    }
  );

  test.fixme(
    "E2E-M05-12-031 遷移できない組合せ→結果一覧に「<出荷ID>: <from> から <to> にはステータス変更できません」（破壊的経路・要 SEED）",
    async () => {
      // 期待は仕様（エッジケース 遷移不可 / messages.ja.yaml:2408 admin.order.failed_to_change_status）由来。
      // 状態遷移ルールで許可されない変更先を選び決定→ #bulkErrors に NOTICE 行（変更不可文言）が追記され、変更されない。
    }
  );

  test.fixme(
    "E2E-M05-12-023 配送完了へ変更し全出荷が出荷済みになると受注が配送完了へ進む（破壊的・要 SEED-M05-12-DELIVERED）",
    async () => {
      // 期待は仕様（配送完了の判定順序 #3-#5 / 正本:140-142: 配送完了で当該出荷に出荷日設定・全出荷出荷済みで受注を配送完了へ進める）由来。
      // 配送完了へ遷移可能な受注の全出荷を選択→変更先=配送完了で決定→完了→閉じる→一覧再表示で受注の対応状況=配送完了。
      // shipping_date 設定はDB値（間接）。受注の対応状況進行は一覧の対応状況列で観測する。破壊的のため隔離受注。
    }
  );

  test.fixme(
    "E2E-M05-12-024 配送完了へ変更しても他出荷が未出荷なら受注は配送完了へ進まない（破壊的・要 SEED-M05-12-DELIVERED-PARTIAL）",
    async () => {
      // 期待は仕様（配送完了の判定順序 #4-#5 / エッジケース: 他出荷未出荷なら当該出荷の出荷日は設定するが受注は配送完了へ進めない / 正本:142,206）由来。
      // 複数出荷受注の一部出荷のみ選択→配送完了で決定→閉じる→一覧再表示で受注の対応状況は配送完了に進まないこと（023の異常寄り対）。
    }
  );

  test.fixme(
    "E2E-M05-12-040 更新エンドポイントへ XHR以外/トークン不正で送信→異常応答(HTTP400)（要 API直叩き＋トークン制御）",
    async () => {
      // 期待は仕様（バリデーション リクエストの正当性 / OrderController.php:475-477 ['status'=>'NG'],400）由来。
      // XHRヘッダ無し or 不正トークンで PUT /shipping/{id}/order_status → 400。画面では結果一覧へシステムエラー（admin.common.system_error:1414）。
    }
  );

  test.fixme(
    "E2E-M05-12-041 変更先の対応状況IDが存在しない→異常応答(HTTP400)→結果一覧にシステムエラー（破壊的経路・要 SEED）",
    async () => {
      // 期待は仕様（エラー処理 変更先ID不存在 / OrderController.php:482-484 ['status'=>'NG'],400 / 表示 admin.common.system_error:1414）由来。
      // 存在しない order_status を送信→当該出荷の更新が 400・#bulkErrors に ERROR 行（システムエラー）。
    }
  );
});
