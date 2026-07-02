/**
 * 管理画面 在庫移動・振替登録/編集 E2E（納品ケース表
 * integration_test/e2e/m04_09_admin_stock_stock_move_transfer_register_edit_e2e_cases.md に対応）。
 * 本specには「E2E自動化」のうち実行可能（非破壊＝表示・検証失敗・404・400・補助API・未認証誘導）なものを実装し、
 * 以下は test.fixme（理由付き）で残す:
 *  - DBを書き換える破壊的成功系（010移動登録/040振替登録/051・052更新）・要特定ステータスシード（080）。
 *  - 入力エラー表示要素（form_errors 出力先セレクタ）の実機確認が前提（021/024/043）。
 *  - 042（承認通知先必須）は単独オラクル化に readonly な振替先コードの商品検索モーダル経由設定が必要（不具合候補#3）。
 * 手動/間接・対象外（在庫減算/履歴/承認一覧の内部値・DB検索・CSRF・ログ等）はケース表で全量管理しspecに残さない。
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-09_...md / 基本設計仕様書 / messages.ja.yaml)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が存在せず、既存 spec（login/two_factor_auth/m02/m03）も
 * @playwright/test を直接使う。本specも既存規約に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針: 資格情報（ECCUBE_ADMIN_USER/PASS）と対象の productStockId / 移動振替ID / product_class_id が無いと走らないよう
 * test.skip でガード。表示・検証失敗・404/400 は副作用を残さない（検証で弾かれ保存されない）。
 * 移動 登録は「登録」ボタンが確認モーダルを開くJS実装のため、モーダル確定の挙動は要実機確認（不具合候補#1）。
 *
 * シード/環境変数（コミットしない）:
 *  - SEED-M04-09-ADMIN        : ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（在庫管理URLを許可する管理者・2FA OFF）
 *  - SEED-M04-09-MOVE-SRC     : MOVE_SRC_IDS（移動元 productStockId のカンマ区切り。在庫数>1・店舗/区分既知）
 *  - SEED-M04-09-TRANSFER-SRC : TRANSFER_SRC_IDS（本店EC・EC-CUBE在庫区分の振替元 productStockId）
 *  - SEED-M04-09-MOVE-NEW     : MOVE_EDIT_ID（status=新規登録(1) の移動振替ID。編集画面表示用）
 *  - SEED-M04-09-PRODUCT-CLASS: PRODUCT_CLASS_ID（有効な product_class_id）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockStockMoveTransferRegisterEditPage } from "../../../pages/admin/m04/m04_09_admin_stock_stock_move_transfer_register_edit.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);
const MOVE_SRC_IDS = (process.env.MOVE_SRC_IDS || "").split(",").filter(Boolean);
const TRANSFER_SRC_IDS = (process.env.TRANSFER_SRC_IDS || "").split(",").filter(Boolean);
const MOVE_EDIT_ID = process.env.MOVE_EDIT_ID || "";
const PRODUCT_CLASS_ID = process.env.PRODUCT_CLASS_ID || "";
const HAS_MOVE_SRC = HAS_CREDS && MOVE_SRC_IDS.length > 0;
const HAS_TRANSFER_SRC = HAS_CREDS && TRANSFER_SRC_IDS.length > 0;

const LOGIN_RE = /\/login(\?|$)/;

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const ERR_SAME_STORE = "出庫元と入庫先が同じです。"; // :4290
const ERR_EXCEEDS_STOCK = "移動点数が現在の在庫数を超えています。"; // :4291
const ERR_DEST_CODE_REQUIRED = "振替先の商品コードを入力してください。"; // :4506
const ERR_NOTIFY_REQUIRED = "承認通知先のメンバーを1人以上選択してください。"; // :4295

/** 管理者でログインし、ログイン画面から遷移するまで。 */
async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  await expect(page.locator("#login_id")).toBeHidden();
}

test.describe(
  "管理画面 > 在庫管理 在庫移動・振替登録/編集",
  { tag: ["@admin", "@stock"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可。未ログイン誘導） =====

    test("E2E-M04-09-070 未ログインで移動 初期登録URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock/move/new`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M04-09-071 未ログインで振替 初期登録URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock/transfer/new`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M04-09-072 未ログインで移動 編集URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock/move/outbound_approval_request/1`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M04-09-073 未ログインで振替補助API URL→管理ログイン画面へ誘導", async ({ page }) => {
      // 全ルートは管理ログイン要。補助API（dest-product-class-info）も未ログインはログインへ誘導される（JSONを返さない）。
      await page.goto(
        `/${ECCUBE_ADMIN_ROUTE}/product/stock/transfer/dest-product-class-info?product_class_id=1`
      );
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 移動 初期登録 表示（SEED-M04-09-MOVE-SRC） =====

    test("E2E-M04-09-001 移動 初期登録画面に入庫先店舗・在庫区分・移動点数・メモ・登録ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_MOVE_SRC, "ECCUBE_ADMIN_USER/PASS または MOVE_SRC_IDS 未設定（SEED-M04-09-MOVE-SRC）");
      await login(page);
      const sm = new StockStockMoveTransferRegisterEditPage(page);
      await sm.gotoMoveNew(MOVE_SRC_IDS);
      await sm.seeMoveNewForm();
    });

    test("E2E-M04-09-002 移動 初期登録画面に出庫元店舗・在庫区分が表示される", async ({ page }) => {
      test.skip(!HAS_MOVE_SRC, "SEED-M04-09-MOVE-SRC 未設定");
      await login(page);
      const sm = new StockStockMoveTransferRegisterEditPage(page);
      await sm.gotoMoveNew(MOVE_SRC_IDS);
      // 出庫元店舗/在庫区分のラベルが表示される。
      await expect(page.locator("body")).toContainText("出庫元店舗");
      await expect(page.locator("body")).toContainText("出庫元在庫区分");
      // 出庫元が先頭在庫由来であること（仕様: new() 先頭在庫の店舗・区分）。
      // 表示名は環境依存のため、出庫元 hidden（move_from_*）が非空＝先頭在庫から確定済であることで確認する。
      expect(await sm.moveFromBaseInfoId.inputValue()).not.toBe("");
      expect(await sm.moveFromStockLocationId.inputValue()).not.toBe("");
    });

    test("E2E-M04-09-003 移動 登録ボタン押下で在庫移動登録確認モーダルが表示される", async ({ page }) => {
      test.skip(!HAS_MOVE_SRC, "SEED-M04-09-MOVE-SRC 未設定");
      await login(page);
      const sm = new StockStockMoveTransferRegisterEditPage(page);
      await sm.gotoMoveNew(MOVE_SRC_IDS);
      // 登録ボタンのJSは form.reportValidity() 通過後にのみモーダルを開く（move_new.twig:41-46）。
      // 必須の入庫先店舗・在庫区分を選択しないとモーダルは開かないため、先に選択する。
      await sm.selectMoveDestByIndex();
      await sm.moveQuantity0.fill("1");
      await sm.openMoveConfirm();
      // 確認モーダル表示。モーダルJSの開閉条件は要実機確認（不具合候補#1）。
      await expect(sm.moveConfirmModal).toBeVisible();
    });

    test("E2E-M04-09-020 移動 入庫先店舗未選択で登録すると登録されず初期登録画面に留まる", async ({ page }) => {
      test.skip(!HAS_MOVE_SRC, "SEED-M04-09-MOVE-SRC 未設定");
      await login(page);
      const sm = new StockStockMoveTransferRegisterEditPage(page);
      await sm.gotoMoveNew(MOVE_SRC_IDS);
      // 入庫先店舗を選ばず移動点数のみ入力して登録ボタンを押下。
      // 必須未充足のため reportValidity() で止まり確認モーダルは開かず＝送信されない（move_new.twig:41-46,99）。
      await sm.moveQuantity0.fill("1");
      await sm.openMoveConfirm();
      await expect(sm.moveConfirmModal).toBeHidden();
      // 移動 初期登録画面に留まる（登録されない）。HTML5必須のエラー表示要素は form_errors 出力先で要実機確認。
      await expect(page).toHaveURL(/\/product\/stock\/move\/new/);
    });

    test("E2E-M04-09-025 移動 入庫先在庫区分未選択で登録されず初期登録画面に留まる", async ({ page }) => {
      test.skip(!HAS_MOVE_SRC, "SEED-M04-09-MOVE-SRC 未設定");
      await login(page);
      const sm = new StockStockMoveTransferRegisterEditPage(page);
      await sm.gotoMoveNew(MOVE_SRC_IDS);
      // 入庫先店舗のみ選択し在庫区分を未選択のまま移動点数を入力して登録ボタンを押下。
      // 在庫区分は必須（move_new.twig:111）のため reportValidity() で止まり確認モーダルは開かず＝送信されない。
      await sm.moveToBaseInfo.selectOption({ index: 1 });
      await sm.moveQuantity0.fill("1");
      await sm.openMoveConfirm();
      await expect(sm.moveConfirmModal).toBeHidden();
      // 移動 初期登録画面に留まる（登録されない）。HTML5必須のエラー表示要素は form_errors 出力先で要実機確認。
      await expect(page).toHaveURL(/\/product\/stock\/move\/new/);
    });

    // ===== 移動 初期登録 バリデーション（非破壊＝検証で弾かれ保存されない） =====

    test("E2E-M04-09-022 移動 出庫元と入庫先が同一店舗・同一区分で同一指定エラーが表示される", async ({ page }) => {
      test.skip(!HAS_MOVE_SRC, "SEED-M04-09-MOVE-SRC 未設定");
      await login(page);
      const sm = new StockStockMoveTransferRegisterEditPage(page);
      await sm.gotoMoveNew(MOVE_SRC_IDS);
      // 入庫先に出庫元（move_from_* hidden 値）と同一の店舗・区分を選択する（シード非依存で相関を再現）。
      await sm.selectMoveDestSameAsSource();
      await sm.moveQuantity0.fill("1");
      await sm.submitMove();
      // 期待は仕様(追加バリデーション same_store_same_location_error)由来。
      await expect(page.locator("body")).toContainText(ERR_SAME_STORE);
    });

    test("E2E-M04-09-023 移動 移動点数が現在庫数を超えると在庫超過エラーが表示される", async ({ page }) => {
      test.skip(!HAS_MOVE_SRC, "SEED-M04-09-MOVE-SRC 未設定");
      await login(page);
      const sm = new StockStockMoveTransferRegisterEditPage(page);
      await sm.gotoMoveNew(MOVE_SRC_IDS);
      // 必須の入庫先店舗・在庫区分を選択（未選択だと reportValidity でモーダルが開かず送信に至らない）。
      // 入庫先は出庫元と異なる前提（要確認: シードに別店舗/区分の選択肢があること）。
      await sm.selectMoveDestByIndex();
      // 現在庫数を超える点数（在庫数はシード既知。ここでは十分大きい値で超過させる）。
      await sm.moveQuantity0.fill("99999999");
      await sm.submitMove();
      // 期待は仕様(追加バリデーション movement_quantity_exceeds_stock)由来。
      await expect(page.locator("body")).toContainText(ERR_EXCEEDS_STOCK);
    });

    // ===== 振替 初期登録 表示（SEED-M04-09-TRANSFER-SRC） =====

    test("E2E-M04-09-030 振替 初期登録画面に承認通知先・振替先コード（検索）・振替点数・メモ・登録が表示される", async ({ page }) => {
      test.skip(!HAS_TRANSFER_SRC, "ECCUBE_ADMIN_USER/PASS または TRANSFER_SRC_IDS 未設定（SEED-M04-09-TRANSFER-SRC）");
      await login(page);
      const sm = new StockStockMoveTransferRegisterEditPage(page);
      await sm.gotoTransferNew(TRANSFER_SRC_IDS);
      await sm.seeTransferNewForm();
    });

    test("E2E-M04-09-031 振替 振替先「検索」ボタンで商品検索モーダルが開く", async ({ page }) => {
      test.skip(!HAS_TRANSFER_SRC, "SEED-M04-09-TRANSFER-SRC 未設定");
      await login(page);
      const sm = new StockStockMoveTransferRegisterEditPage(page);
      await sm.gotoTransferNew(TRANSFER_SRC_IDS);
      await sm.openTransferProductSearch();
      await expect(sm.transferProductModal).toBeVisible();
    });

    // ===== 振替 初期登録 バリデーション（非破壊） =====

    test("E2E-M04-09-041 振替 振替先商品コード未入力でコード必須エラーが表示される", async ({ page }) => {
      test.skip(!HAS_TRANSFER_SRC, "SEED-M04-09-TRANSFER-SRC 未設定");
      await login(page);
      const sm = new StockStockMoveTransferRegisterEditPage(page);
      await sm.gotoTransferNew(TRANSFER_SRC_IDS);
      // 振替先コード未入力エラーを単独化するため、他の必須（承認通知先・振替点数）は満たす。
      // dest_product_code は readonly（検索モーダル経由設定）のため初期空のまま送信＝コード未入力を再現。
      await sm.selectFirstNotifyMember();
      await sm.transferQuantity0.fill("1");
      await sm.submitTransfer();
      // 期待は仕様(分岐 dest_product_code_required)由来。
      await expect(page.locator("body")).toContainText(ERR_DEST_CODE_REQUIRED);
    });

    // ===== 移動 編集 表示 / 404 =====

    test("E2E-M04-09-050 移動 編集（ピック・出庫承認申請）画面が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS || !MOVE_EDIT_ID, "ECCUBE_ADMIN_USER/PASS または MOVE_EDIT_ID 未設定（SEED-M04-09-MOVE-NEW）");
      await login(page);
      const sm = new StockStockMoveTransferRegisterEditPage(page);
      const res = await page.goto(sm.moveEditUrl(MOVE_EDIT_ID));
      // status=新規登録(1) なら本ルートが適切でリダイレクトされず表示される。
      expect(res?.status()).toBeLessThan(400);
      await expect(page).toHaveURL(new RegExp(`/move/outbound_approval_request/${MOVE_EDIT_ID}`));
    });

    test("E2E-M04-09-053 存在しない移動振替IDの編集URLは404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const sm = new StockStockMoveTransferRegisterEditPage(page);
      const res = await page.goto(sm.moveEditUrl(99999999));
      expect(res?.status()).toBe(404);
    });

    // ===== 振替補助API（dest-product-class-info） =====

    test("E2E-M04-09-060 振替補助API 有効なproduct_class_idでJSON200が返る", async ({ page }) => {
      test.skip(!HAS_CREDS || !PRODUCT_CLASS_ID, "ECCUBE_ADMIN_USER/PASS または PRODUCT_CLASS_ID 未設定");
      await login(page);
      const sm = new StockStockMoveTransferRegisterEditPage(page);
      const res = await page.request.get(sm.destApiUrl(PRODUCT_CLASS_ID));
      expect(res.status()).toBe(200);
      const json = await res.json();
      // 仕様(振替補助API)由来: 商品名・コード・言語・カード状態・Foil・基準価格の6項目を含む。
      expect(json).toHaveProperty("product_name");
      expect(json).toHaveProperty("product_code");
      expect(json).toHaveProperty("language");
      expect(json).toHaveProperty("card_condition");
      expect(json).toHaveProperty("foil");
      expect(json).toHaveProperty("standard_price");
    });

    test("E2E-M04-09-061 振替補助API product_class_id=0で400が返る", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const sm = new StockStockMoveTransferRegisterEditPage(page);
      const res = await page.request.get(sm.destApiUrl(0));
      expect(res.status()).toBe(400);
    });

    test("E2E-M04-09-062 振替補助API 未存在のproduct_class_idで404が返る", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const sm = new StockStockMoveTransferRegisterEditPage(page);
      const res = await page.request.get(sm.destApiUrl(99999999));
      expect(res.status()).toBe(404);
    });

    // ===== 保留（破壊的＝DB登録/更新・要特定ステータスシード。手動/間接・対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M04-09-010 移動 正常登録で「保存しました」＋出庫承認申請画面へ遷移（要: 使い捨て移動元シード・在庫減算の後始末）",
      async () => {
        // 期待は仕様(プロセスフロー 移動登録#6 save_complete＋admin_stock_move_outbound_approval_request遷移)由来。
        // 入庫先選択・確認モーダル確定の操作はモーダルJS依存で要実機確認（不具合候補#1）。
      }
    );
    test.fixme(
      "E2E-M04-09-021 移動 移動点数未入力で入力エラー・滞留（要: エラー表示セレクタ実機確認＝form_errors出力先）",
      async () => {
        // 期待は仕様(フォーム項目 quantity 必須・movement_quantity_required)由来。エラー要素特定後に実装。
      }
    );
    test.fixme(
      "E2E-M04-09-024 移動 移動点数0で1以上エラー・滞留（要: エラー表示セレクタ実機確認）",
      async () => {
        // 期待は仕様(フォーム項目 移動点数1以上・movement_quantity_min)由来。Form制約はオラクル化しない。
      }
    );
    test.fixme(
      "E2E-M04-09-040 振替 正常登録で「保存しました」＋振替承認待ち画面へ遷移（要: 使い捨てシード・readonlyコードはモーダル経由設定）",
      async () => {
        // 期待は仕様(プロセスフロー 振替登録#4 save_complete＋admin_stock_transfer_approval遷移)由来。
        // 振替先コードはモーダル経由設定（不具合候補#3）・承認通知先メンバー選択が必要。
      }
    );
    test.fixme(
      "E2E-M04-09-042 振替 承認通知先メンバー未選択で通知先必須エラー（要: 振替先コードをモーダル経由設定し通知先エラーを単独化）",
      async () => {
        // 期待は仕様(分岐 approval_notification_target_required)由来。
        // 通知先エラーを単独オラクル化するには他の必須＝振替先コードを満たす必要があるが、
        // dest_product_code は readonly で商品検索モーダル経由でしか設定できない（不具合候補#3）。
        // モーダル操作のセレクタ確定後に実装する。
      }
    );
    test.fixme(
      "E2E-M04-09-043 振替 振替点数0で1以上エラー・滞留（要: エラー表示セレクタ実機確認）",
      async () => {
        // 期待は仕様(フォーム項目 振替点数1以上)由来。
      }
    );
    test.fixme(
      "E2E-M04-09-051 移動 編集 店舗内移動の更新確定で入庫完了＋「保存しました」（要: 店舗内移動の使い捨てシード）",
      async () => {
        // 期待は仕様(プロセスフロー 移動編集#2-3 店舗内→入庫完了(7)＋完了画面連鎖)由来。
      }
    );
    test.fixme(
      "E2E-M04-09-052 移動 編集 店舗間移動の更新確定で出庫承認待ち＋出庫承認画面へ遷移（要: 店舗間移動の使い捨てシード）",
      async () => {
        // 期待は仕様(プロセスフロー 移動編集#3 店舗間→出庫承認待ち(2)＋admin_stock_move_outbound_approval)由来。
      }
    );
    test.fixme(
      "E2E-M04-09-080 ステータス不適合の編集URLは対応画面へリダイレクト（要: 特定ステータスの移動振替シード）",
      async () => {
        // 期待は仕様(ステータスと遷移 STATUS_TO_ROUTE・redirectByMoveTransferStatus)由来。
      }
    );
  }
);
