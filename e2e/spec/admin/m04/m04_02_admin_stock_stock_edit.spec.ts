/**
 * 管理画面 在庫編集（在庫承認）E2E。納品ケース表 integration_test/e2e/m04_02_admin_stock_stock_edit_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装し、要シード/破壊的/要実機の 010・011・032・033・070・071 は
 * test.fixme（理由付き）。手動/間接・対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約準拠）。
 * 期待結果は仕様(設計書 functions/ec-cube-enterprise/m04-02_admin_stock_stock_edit.md / 観点表 / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約値を期待値に流用しない。
 * 本機能は新規実装でありリバース元(pf-eccube3)に相当機能は無い。仕様乖離はケース表 付帯表4 に分離する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 *
 * シード（環境変数。コミットしない）:
 *  - STOCK_ID         : SEED-M04-02-STOCK（ログイン管理者が編集権限を持つ店舗の規格在庫ID。承認権限メンバーが1名以上）
 *  - STOCK_NOPERM_ID  : SEED-M04-02-NOPERM（ログイン管理者が編集権限を持たない店舗の規格在庫ID）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockStockEditPage } from "../../../pages/admin/m04/m04_02_admin_stock_stock_edit.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const STOCK_ID = process.env.STOCK_ID || "";
const STOCK_NOPERM_ID = process.env.STOCK_NOPERM_ID || "";
const HAS_STOCK = HAS_CREDS && !!STOCK_ID;
const HAS_NOPERM = HAS_CREDS && !!STOCK_NOPERM_ID;

const HOME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/?(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;
const NEW_RE = /\/product\/stock\/\d+\/stock-approval\/new(\?|$)/;
const STORE_RE = /\/product\/stock\/\d+\/stock-approval\/store(\?|$)/;
const STOCK_LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/stock(/|\\?|$)`);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const SAVE_COMPLETE = "保存しました"; // :1398 admin.common.save_complete
const SAVE_ERROR = "保存に失敗しました"; // :1399 admin.common.save_error
const NOT_EDITABLE = "この店舗の在庫を編集する権限がありません。"; // :5022 admin.stock.approval.not_editable_store
const BE_STOCKED_ERR = "入庫の場合は1以上の数値を入力してください"; // :4529 be_stocked_error
const DISPOSAL_ERR = "廃棄の場合は-1以下の数値を入力してください"; // :4530 disposal_error
const BE_STOCKED_REQUIRED = "入庫の場合は仕入単価を入力してください"; // :4533 purchase_price.be_stocked_required

/** 管理ログインしてホームへ到達する。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).toHaveURL(HOME_RE);
}

/** ログインして在庫承認（編集）画面を開く。 */
async function openEdit(page: Page, productStockId = STOCK_ID) {
  await loginToHome(page);
  const edit = new StockStockEditPage(page);
  await edit.goto(productStockId);
  return edit;
}

test.describe("管理画面 > 在庫編集（在庫承認）", { tag: ["@admin", "@stock"] }, () => {
  // ===== 未認証（資格情報不要・非破壊） =====

  test("E2E-M04-02-051 未ログインで在庫承認画面URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
    // 期待は仕様(利用者視点の入口・権限/認可: 管理画面ログインを要する)由来（IT-15未認証・IT-13）。
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock/1/stock-approval/new`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  test("E2E-M04-02-052 未ログインでは在庫承認フォームを利用できない", async ({ page }) => {
    // 期待は仕様(権限/認可)由来。編集画面へ到達できないため在庫変動内容フォームは存在しない。
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock/1/stock-approval/new`);
    await expect(page.locator("#admin_stock_approval_new_stock_change_quantity")).toHaveCount(0);
  });

  // ===== エラー処理（HAS_CREDS） =====

  test("E2E-M04-02-050 存在しない在庫IDの在庫承認画面は見つからない(HTTP404)", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    // 期待は仕様(分岐: productStockId 未存在→404／#[MapEntity]解決失敗)由来。
    await loginToHome(page);
    const edit = new StockStockEditPage(page);
    const res = await edit.goto(99999999);
    expect(res?.status(), "不存在在庫は404").toBe(404);
  });

  test("E2E-M04-02-053 存在しない在庫IDへの登録(store)POSTは見つからない(HTTP404)", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    // 期待は仕様(分岐: store POST の productStockId 未存在→404)由来。
    // #[MapEntity] 解決は CSRF/フォーム検証より前に行われるため、本文無しPOSTでも404＝非破壊。
    await loginToHome(page);
    const res = await page.request.post(
      `/${ECCUBE_ADMIN_ROUTE}/product/stock/99999999/stock-approval/store`
    );
    expect(res.status(), "不存在在庫へのstore POSTは404").toBe(404);
  });

  // ===== 表示（HAS_STOCK） =====

  test("E2E-M04-02-001 在庫承認画面に在庫情報カード・在庫変動内容フォーム・登録ボタンが表示される", async ({
    page,
  }) => {
    test.skip(!HAS_STOCK, "ECCUBE_ADMIN_USER/PASS または STOCK_ID 未設定");
    // 期待は仕様(画面表示・一覧項目／登録フォーム項目)由来。
    const edit = await openEdit(page);
    await edit.seeEditForm();
  });

  test("E2E-M04-02-002 在庫承認画面に在庫変動履歴一覧セクションが表示される", async ({ page }) => {
    test.skip(!HAS_STOCK, "STOCK_ID 未設定");
    // 期待は仕様(在庫変動履歴一覧を表示)由来。データ件数や並び順・マスクは要承認データのためケース表で手動/間接管理。
    const edit = await openEdit(page);
    await expect(edit.historyTitle).toBeVisible();
    await expect(edit.historySection).toBeAttached();
  });

  test("E2E-M04-02-003 在庫一覧に戻るリンクが在庫一覧へ遷移する", async ({ page }) => {
    test.skip(!HAS_STOCK, "STOCK_ID 未設定");
    // 期待は仕様(画面遷移: 在庫一覧に戻る→admin_stock_list)由来（IT-03 外部画面）。
    const edit = await openEdit(page);
    await edit.backToListLink.click();
    await expect(page).toHaveURL(STOCK_LIST_RE);
  });

  // ===== バリデーション（必須・異常系。送信失敗で同画面=store URL に滞留し save_error 表示） =====

  test("E2E-M04-02-020 在庫変動区分未選択で登録すると保存失敗メッセージで滞留する", async ({ page }) => {
    test.skip(!HAS_STOCK, "STOCK_ID 未設定");
    // 期待は仕様(バリデーション: 在庫変動区分 NotBlank／フォーム未送信・無効は save_error 表示で再描画)由来。
    const edit = await openEdit(page);
    await edit.submit(); // 区分その他必須を未入力のまま送信
    await expect(page).toHaveURL(STORE_RE); // リダイレクトせず同画面(store)を再描画
    await expect(edit.errorFlash).toContainText(SAVE_ERROR);
  });

  test("E2E-M04-02-021 在庫変動理由未入力で登録すると保存失敗メッセージで滞留する", async ({ page }) => {
    test.skip(!HAS_STOCK, "STOCK_ID 未設定");
    // 期待は仕様(バリデーション: 在庫変動理由 NotBlank)由来。
    // 要確認: 承認通知先メンバーの選択は select2 のため自動化を fixme としており（010参照）、
    // 本ケースではメンバー未選択も同時の不正要因となる。期待結果は「保存に失敗→同画面再描画」という
    // 必要条件の観測に留める（理由 NotBlank への完全な単項目帰属はメンバー選択実装後に強化）。
    const edit = await openEdit(page);
    await edit.selectChangeType("入庫");
    await edit.fillQuantity("1");
    await edit.fillPurchasePrice("100");
    await edit.fillReason(""); // 理由のみ未入力（他の入力可能な必須は有効値）
    await edit.submit();
    await expect(page).toHaveURL(STORE_RE);
    await expect(edit.errorFlash).toContainText(SAVE_ERROR);
  });

  test("E2E-M04-02-022 在庫増減数未入力で登録すると保存失敗メッセージで滞留する", async ({ page }) => {
    test.skip(!HAS_STOCK, "STOCK_ID 未設定");
    // 期待は仕様(バリデーション: 在庫増減数 NotBlank)由来。
    // 要確認: 021と同様、承認通知先メンバー未選択も同時の不正要因（select2自動化はfixme）。
    // 期待結果は「保存に失敗→同画面再描画」の必要条件観測に留める。
    const edit = await openEdit(page);
    await edit.selectChangeType("入庫");
    await edit.fillReason("E2E reason");
    await edit.fillPurchasePrice("100");
    await edit.fillQuantity(""); // 増減数のみ未入力（他の入力可能な必須は有効値）
    await edit.submit();
    await expect(page).toHaveURL(STORE_RE);
    await expect(edit.errorFlash).toContainText(SAVE_ERROR);
  });

  test("E2E-M04-02-023 承認通知先メンバー未選択で登録すると保存失敗メッセージで滞留する", async ({ page }) => {
    test.skip(!HAS_STOCK, "STOCK_ID 未設定");
    // 期待は仕様(必須制御: 承認通知先メンバー Count(min=1))由来。
    const edit = await openEdit(page);
    await edit.selectChangeType("入庫");
    await edit.fillReason("E2E reason");
    await edit.fillQuantity("1");
    await edit.fillPurchasePrice("100");
    // 承認通知先メンバーは未選択のまま送信する。
    await edit.submit();
    await expect(page).toHaveURL(STORE_RE);
    await expect(edit.errorFlash).toContainText(SAVE_ERROR);
  });

  test("E2E-M04-02-024 在庫変動理由が最大長を超えると登録できず滞留する", async ({ page }) => {
    test.skip(!HAS_STOCK, "STOCK_ID 未設定");
    // 期待は仕様(バリデーション: 在庫変動理由 Length(max))由来。
    // 制約値そのもの(最大文字数)はオラクル化しない。「最大長を十分に超えれば登録不可」という仕様だけを根拠に、
    // 実装の max 値に依存しない十分大きな長さで境界外を作る（具体桁数は実装由来オラクルとして固定しない）。
    const edit = await openEdit(page);
    await edit.selectChangeType("入庫");
    await edit.fillQuantity("1");
    await edit.fillPurchasePrice("100");
    await edit.fillReason("あ".repeat(100000)); // 最大長を十分超過（制約値はオラクル化しない）
    await edit.submit();
    await expect(page).toHaveURL(STORE_RE);
    await expect(edit.errorFlash).toContainText(SAVE_ERROR);
  });

  test("E2E-M04-02-025 在庫増減数が範囲外だと登録できず滞留する", async ({ page }) => {
    test.skip(!HAS_STOCK, "STOCK_ID 未設定");
    // 期待は仕様(バリデーション: 在庫増減数 Range)由来。範囲外（最大値超）で境界外を作る。
    // 有効範囲の具体値(min/max)はオラクル化しない。実装 max に依存しない十分大きな桁数で境界外を作る。
    const edit = await openEdit(page);
    await edit.selectChangeType("入庫");
    await edit.fillReason("E2E reason");
    await edit.fillPurchasePrice("100");
    await edit.fillQuantity("999999999999"); // 有効範囲を十分超過（制約値はオラクル化しない）
    await edit.submit();
    await expect(page).toHaveURL(STORE_RE);
    await expect(edit.errorFlash).toContainText(SAVE_ERROR);
  });

  test("E2E-M04-02-026 仕入単価が範囲外だと登録できず滞留する", async ({ page }) => {
    test.skip(!HAS_STOCK, "STOCK_ID 未設定");
    // 期待は仕様(バリデーション: 仕入単価 Range)由来。範囲外（負数）で境界外を作る。
    // 有効範囲の最小値はオラクル化しない。負数は仕様上の範囲外であることのみを根拠とする。
    const edit = await openEdit(page);
    await edit.selectChangeType("入庫");
    await edit.fillReason("E2E reason");
    await edit.fillQuantity("1");
    await edit.fillPurchasePrice("-1"); // 負数=有効範囲外（最小値はオラクル化しない）
    await edit.submit();
    await expect(page).toHaveURL(STORE_RE);
    await expect(edit.errorFlash).toContainText(SAVE_ERROR);
  });

  // ===== 相関バリデーション（POST_SUBMIT。区分×増減数/仕入単価で固有メッセージ） =====

  test("E2E-M04-02-030 入庫区分で在庫増減数が1未満だと入庫エラーが表示される", async ({ page }) => {
    test.skip(!HAS_STOCK, "STOCK_ID 未設定");
    // 期待は仕様(相関バリデーション: 入庫で増減数<1 → be_stocked_error)由来。
    const edit = await openEdit(page);
    await edit.selectChangeType("入庫");
    await edit.fillReason("E2E reason");
    await edit.fillQuantity("0"); // 入庫で1未満
    await edit.submit();
    await expect(page).toHaveURL(STORE_RE);
    await expect(edit.form).toContainText(BE_STOCKED_ERR);
  });

  test("E2E-M04-02-031 廃棄区分で在庫増減数が-1超だと廃棄エラーが表示される", async ({ page }) => {
    test.skip(!HAS_STOCK, "STOCK_ID 未設定");
    // 期待は仕様(相関バリデーション: 廃棄で増減数>-1 → disposal_error)由来。
    const edit = await openEdit(page);
    await edit.selectChangeType("廃棄");
    await edit.fillReason("E2E reason");
    await edit.fillQuantity("1"); // 廃棄で-1超(正数)
    await edit.submit();
    await expect(page).toHaveURL(STORE_RE);
    await expect(edit.form).toContainText(DISPOSAL_ERR);
  });

  test("E2E-M04-02-034 入庫区分で仕入単価未入力だと仕入単価必須エラーが表示される", async ({ page }) => {
    test.skip(!HAS_STOCK, "STOCK_ID 未設定");
    // 期待は仕様(相関バリデーション: 入庫で仕入単価null → be_stocked_required)由来。
    const edit = await openEdit(page);
    await edit.selectChangeType("入庫");
    await edit.fillReason("E2E reason");
    await edit.fillQuantity("1");
    await edit.fillPurchasePrice(""); // 入庫で仕入単価未入力
    await edit.submit();
    await expect(page).toHaveURL(STORE_RE);
    await expect(edit.form).toContainText(BE_STOCKED_REQUIRED);
  });

  // ===== フロント挙動（JS入力制御） =====

  test("E2E-M04-02-060 廃棄区分を選択すると仕入単価入力が無効化される", async ({ page }) => {
    test.skip(!HAS_STOCK, "STOCK_ID 未設定");
    // 期待は仕様(入力制限: 廃棄選択時は仕入単価の入力を不可)由来。
    const edit = await openEdit(page);
    await expect(edit.purchasePrice).toBeEnabled(); // 初期(未選択/入庫)は入力可
    await edit.selectChangeType("廃棄");
    await expect(edit.purchasePrice).toBeDisabled();
  });

  // ===== 権限・認可（HAS_NOPERM: 編集権限外店舗の在庫） =====

  // 設計(StockApprovalController.php:88-101)では isSubmitted/isValid を先に評価し、
  // フォームが有効な場合にのみ isEditableShop による not_editable_store 分岐へ到達する。
  // 承認通知先メンバー(Count min=1)を満たすには select2 でのメンバー選択が必須のため（010と同じ理由で
  // 自動化は fixme）、有効フォーム送信を前提とする権限エラーケースも fixme とする。
  // メンバー未選択のままでは isValid 失敗で save_error となり not_editable_store に到達しない。
  test.fixme(
    "E2E-M04-02-040 編集権限のない店舗の在庫を登録すると権限エラー(not_editable_store)で滞留する（要: 編集権限外店舗のSEED＋承認通知先メンバー選択で有効フォーム送信）",
    async () => {
      // 期待は仕様(分岐: 有効フォーム送信かつ編集権限のない店舗→not_editable_store を表示し再描画・登録しない)由来。
      void HAS_NOPERM;
      void STOCK_NOPERM_ID;
      void NOT_EDITABLE;
      void STORE_RE;
    }
  );

  // ===== 自動化予定だが要シード/破壊的/要実機（未実装。手動/間接・対象外はケース表で管理） =====

  test.fixme(
    "E2E-M04-02-004 在庫一覧の商品名リンクから在庫承認画面へ遷移できる（要: 在庫一覧(M04-01)に対象在庫が表示されるSEED）",
    async () => {
      // 期待は仕様(利用者視点の入口: 在庫一覧の商品名リンクから在庫承認画面を開く 設計書:22,51)由来。
      // 在庫一覧画面(admin_stock_list)の対象行特定は M04-01 のシード・表示構造に依存するため実機確認後に実装する。
      void NEW_RE;
    }
  );

  test.fixme(
    "E2E-M04-02-012 廃棄で必須を満たし登録すると成功し在庫が即時減算・履歴が即時登録される（要: 現在在庫が既知のSEED＋承認権限メンバー。破壊的・廃棄ロック）",
    async () => {
      // 期待は仕様(廃棄のみ即時在庫減算・履歴即時登録→save_complete 表示 設計書:99,104,132-133)由来（SAVE_COMPLETE）。
      // 廃棄登録は在庫ロック(即時減算)を伴う破壊的操作のため隔離環境で実機確認後に実装する。
      void SAVE_COMPLETE;
    }
  );

  test.fixme(
    "E2E-M04-02-072 在庫変動理由の非同期更新は理由空/最大長超をHTTP400で拒否する（要: 編集可能な履歴SEED・APIリクエスト直接検証）",
    async () => {
      // 期待は仕様(理由 NotBlank/Length 違反→form invalid→HTTP400)由来。
      // ブラウザUI経路ではHTTPステータスの直接観測が難しく、APIリクエスト検証として実機確認後に実装する。
    }
  );

  test.fixme(
    "E2E-M04-02-073 在庫変動理由の非同期更新は別在庫参照/編集不可の対象IDをHTTP400で拒否する（要: 別在庫/編集不可の履歴SEED・APIリクエスト直接検証）",
    async () => {
      // 期待は仕様(別在庫参照・編集不可→InvalidArgumentException→HTTP400)由来。
      // 対象レコードの状態(別在庫参照・編集不可)を作るシードと API 直接検証が必要なため実機確認後に実装する。
    }
  );

  test.fixme(
    "E2E-M04-02-010 入庫で必須を満たし登録すると成功メッセージ「保存しました」が表示される（要: 編集可能在庫＋承認権限メンバーのSEED。承認情報登録＋通知メール送信を伴う破壊的操作）",
    async () => {
      // 期待は仕様(登録成功→admin.common.save_complete 表示)由来（SAVE_COMPLETE）。
      // 承認通知先メンバーの select2 選択と通知メール送信を伴うため、隔離環境で実機確認後に実装する。
      void SAVE_COMPLETE;
    }
  );

  test.fixme(
    "E2E-M04-02-011 登録成功後は admin_stock_approval_new（在庫承認画面）へリダイレクトされる（要: 010と同じSEED・破壊的）",
    async () => {
      // 期待は仕様(登録成功→admin_stock_approval_new へリダイレクト)由来（NEW_RE）。
      void NEW_RE;
    }
  );

  test.fixme(
    "E2E-M04-02-032 入庫で現在在庫+増減数が最大値を超えると合算超過エラーが表示される（要: 既知の現在在庫値を持つSEED）",
    async () => {
      // 期待は仕様(相関バリデーション: 入庫で現在在庫+増減数>最大 → be_stocked_max_stock_error)由来。
    }
  );

  test.fixme(
    "E2E-M04-02-033 廃棄で廃棄数が現在在庫を超えると合算下回りエラーが表示される（要: 既知の現在在庫値を持つSEED）",
    async () => {
      // 期待は仕様(相関バリデーション: 廃棄で廃棄数(絶対値)>現在在庫 → disposal_exceeds_stock_error)由来。
    }
  );

  test.fixme(
    "E2E-M04-02-070 在庫変動履歴の理由をインライン編集(XHR)すると表示理由が更新される（要: 編集可能な履歴/承認待ち入庫詳細のSEED・実機UI）",
    async () => {
      // 期待は仕様(在庫変動理由の非同期更新: success=true と整形理由をJSONで返し表示更新)由来。
      // ペン編集トグル→保存のUIはステージングデータ依存のため実機確認後に実装する。
    }
  );

  test.fixme(
    "E2E-M04-02-071 在庫変動理由の非同期更新はXHR以外/対象ID不正を400で拒否する（要: APIリクエスト直接検証）",
    async () => {
      // 期待は仕様(XHR以外=HTTP400／stock_history_idとstock_edit_approval_detail_idの両方指定・両方未指定=HTTP400)由来。
      // ブラウザUI経路ではHTTPステータスの直接観測が難しく、APIリクエスト検証として実機確認後に実装する。
    }
  );
});
