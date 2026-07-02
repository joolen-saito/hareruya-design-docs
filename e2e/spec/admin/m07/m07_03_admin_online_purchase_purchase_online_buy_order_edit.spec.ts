/**
 * 管理画面 ネット買取管理 — 買取情報編集（買取詳細）E2E。
 * 納品ケース表 integration_test/e2e/m07_03_admin_online_purchase_purchase_online_buy_order_edit_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち実装済みのケースのみを置く（手動/対象外はケース表で全量管理）。
 * 期待結果は仕様（正本md / 観点表 / ec-cube-enterprise確認値 messages.ja.yaml・validators.ja.yaml）由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / two_factor_auth.spec.ts）に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針（安全第一・共有環境）:
 *  - 資格情報/シードが無いと走らないよう test.skip でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 保存成功(020/021)・一括売却(041)・XHR行生成(004)・CSV内容(040)は破壊的/非決定的のため test.fixme。
 *  - バリデーション/相関エラー系は「保存に失敗してDBを変えない」ため安全に実行できる（要: 各状態のシード注文ID）。
 *
 * シード/環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS  : 管理ログイン（config/default.config）
 *  - BUY_ORDER_EDITABLE_ID  : 査定承諾〜入庫待ちの編集可能な買取注文ID（表示・必須/形式・適格請求書検証で使用）
 *  - BUY_ORDER_STOCKED_ID   : 入庫済みステータスの買取注文ID（030 ステータス変更拒否で使用）
 *  - BUY_ORDER_NOSTOCKEDIT_ID : 実在庫編集不可ステータスの買取注文ID（031 増減不可で使用）
 *  - BUY_ORDER_TRANSFERREADY_ID : 振込依頼済みへ遷移可能だが身分証未登録の買取注文ID（032で使用）
 */
import { test, expect } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AdminOnlinePurchasePurchaseOnlineBuyOrderEditPage } from "../../../pages/admin/m07/m07_03_admin_online_purchase_purchase_online_buy_order_edit.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const EDITABLE_ID = process.env.BUY_ORDER_EDITABLE_ID || "";
const STOCKED_ID = process.env.BUY_ORDER_STOCKED_ID || "";
const NOSTOCKEDIT_ID = process.env.BUY_ORDER_NOSTOCKEDIT_ID || "";
const TRANSFERREADY_ID = process.env.BUY_ORDER_TRANSFERREADY_ID || "";

// 仕様(ec-cube-enterprise確認値)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const MSG_COMPLETE = "登録が完了しました。"; // messages.ja.yaml:1773 admin.register.complete
const MSG_STOCKED_IMMUTABLE = "入庫済みステータスは他のステータスに変更できません。"; // validators.ja.yaml:74
const MSG_STOCK_EDIT_NOT_ALLOWED =
  "実在庫情報の登録は「査定内容承諾」〜「入庫待ち」のステータスの場合のみ可能です。"; // validators.ja.yaml:75
const MSG_IDENTIFICATION_REQUIRED = "買取依頼者の身分証明書が未登録です。"; // validators.ja.yaml:71

const LOGIN_RE = /\/login(\?|$)/;
const EDIT_RE = /\/purchase\/\d+\/edit(\?|$)/;
const PAGE_RE = /\/purchase\/page\/\d+(\?|$)/;

async function login(page: import("@playwright/test").Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 > ネット買取管理 買取情報編集（買取詳細）",
  { tag: ["@admin", "@purchase"] },
  () => {
    // ===== 権限・認可 / HTTPステータス（資格情報のみ） =====

    test("E2E-M07-03-010 未ログインで買取詳細URLへアクセスすると管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/purchase/1/edit`);
      await expect(page).toHaveURL(LOGIN_RE); // 利用者視点の入口/権限・認可（未ログインは管理ログインへ）
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M07-03-011 存在しないidの買取詳細GETは404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new AdminOnlinePurchasePurchaseOnlineBuyOrderEditPage(page);
      const resp = await target.goto(2147483646); // 存在しない想定の大きなID（処理フロー#2: 404）
      expect(resp?.status()).toBe(404);
    });

    test("E2E-M07-03-012 存在しないidのupdate POSTは404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new AdminOnlinePurchasePurchaseOnlineBuyOrderEditPage(page);
      // update()は注文取得で先に404（CSRF検査前）。ログイン済みコンテキストのcookieを共有してPOSTする。
      const resp = await page.request.post(target.updateUrl(2147483646), { failOnStatusCode: false });
      expect(resp.status()).toBe(404);
    });

    // ===== 表示・UI部品（要: 編集可能な買取注文シード） =====

    test("E2E-M07-03-001 買取詳細(編集GET)が表示され保存ボタン・一覧戻りが見える", async ({ page }) => {
      test.skip(!HAS_CREDS || !EDITABLE_ID, "ECCUBE_ADMIN_USER/PASS または BUY_ORDER_EDITABLE_ID 未設定");
      await login(page);
      const target = new AdminOnlinePurchasePurchaseOnlineBuyOrderEditPage(page);
      await target.goto(EDITABLE_ID);
      await expect(page).toHaveURL(EDIT_RE);
      await target.seeDetail();
    });

    test("E2E-M07-03-002 フッタの保存・一括売却・手動メール・一覧戻りボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS || !EDITABLE_ID, "BUY_ORDER_EDITABLE_ID 未設定");
      await login(page);
      const target = new AdminOnlinePurchasePurchaseOnlineBuyOrderEditPage(page);
      await target.goto(EDITABLE_ID);
      await target.seeFooterButtons();
    });

    test("E2E-M07-03-003 買取情報ブロックに商品追加・査定編集・CSVボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS || !EDITABLE_ID, "BUY_ORDER_EDITABLE_ID 未設定");
      await login(page);
      const target = new AdminOnlinePurchasePurchaseOnlineBuyOrderEditPage(page);
      await target.goto(EDITABLE_ID);
      await target.seePurchaseInfoButtons();
    });

    test("E2E-M07-03-005 選んで買取の商品追加モーダルが開く", async ({ page }) => {
      test.skip(!HAS_CREDS || !EDITABLE_ID, "BUY_ORDER_EDITABLE_ID 未設定");
      await login(page);
      const target = new AdminOnlinePurchasePurchaseOnlineBuyOrderEditPage(page);
      await target.goto(EDITABLE_ID);
      await target.openSearchProductModal();
      await expect(target.searchProductModalButton).toBeVisible();
    });

    // ===== 画面遷移 / JS挙動 =====

    test("E2E-M07-03-013 一覧戻りリンクはネット買取一覧(page)へ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS || !EDITABLE_ID, "BUY_ORDER_EDITABLE_ID 未設定");
      await login(page);
      const target = new AdminOnlinePurchasePurchaseOnlineBuyOrderEditPage(page);
      await target.goto(EDITABLE_ID);
      await target.backToListLink.click();
      await expect(page).toHaveURL(PAGE_RE); // admin_purchase_page（セッションのページ番号で一覧へ）
    });

    // E2E-M07-03-014 は期待結果(.product 入力の編集可否 readonly/pointer-events 切替)の観測点が要実機確認で、
    // 現状はボタン可視のみの無意味アサーションだった（オラクル不成立・codex中指摘#7）。観測点確定まで fixme。
    test.fixme(
      "E2E-M07-03-014 査定編集ボタンで商品系入力(.product)の編集可否(readonly/pointer-events)が切り替わる（要確認: 観測点）",
      async () => {
        // 期待は仕様(フロント挙動: 査定編集トグル)由来。.product 入力の readonly/pointer-events をトグル前後で比較する。
      }
    );

    // ===== バリデーション・相関（保存失敗＝DB非変更で安全に実行） =====

    test("E2E-M07-03-022 口座名義を空にして保存するとエラーで詳細に留まり保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS || !EDITABLE_ID, "BUY_ORDER_EDITABLE_ID 未設定");
      await login(page);
      const target = new AdminOnlinePurchasePurchaseOnlineBuyOrderEditPage(page);
      await target.goto(EDITABLE_ID);
      await target.accountHolder.fill(""); // 口座名義 必須（仕様: 入力項目表）
      await target.clickSave();
      // 失敗時は200で詳細再描画（リダイレクトしない＝編集URLに留まる、または成功フラッシュが出ない）。
      await expect(target.saveButton).toBeVisible();
      await expect(page.locator("body")).not.toContainText(MSG_COMPLETE);
    });

    test("E2E-M07-03-023 E-mailを不正形式にして保存するとエラーで保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS || !EDITABLE_ID, "BUY_ORDER_EDITABLE_ID 未設定");
      await login(page);
      const target = new AdminOnlinePurchasePurchaseOnlineBuyOrderEditPage(page);
      await target.goto(EDITABLE_ID);
      // E-mailは依頼者ブロックの入力で初期はロック状態。仕様の依頼者編集フローに従いトグルで解除してから入力する。
      await target.enableCustomerEdit();
      await target.email.fill("not-an-email"); // メール形式検証（仕様: 入力項目表 E-mail）
      await target.clickSave();
      await expect(page.locator("body")).not.toContainText(MSG_COMPLETE);
    });

    test("E2E-M07-03-024 適格請求書 事業者選択で登録番号未入力なら必須エラーで保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS || !EDITABLE_ID, "BUY_ORDER_EDITABLE_ID 未設定");
      await login(page);
      const target = new AdminOnlinePurchasePurchaseOnlineBuyOrderEditPage(page);
      await target.goto(EDITABLE_ID);
      // 仕様: 事業者のとき登録番号はNotBlank。事業者ラジオ「事業者(on)」を選び登録番号を空にして保存。
      // ラジオは expanded=true の実input（_1=on）。index→value対応は要実機確認。
      await target.qiIssuerFlgOn.check();
      await target.qiIssuerCode.fill("");
      await target.clickSave();
      await expect(page.locator("body")).not.toContainText(MSG_COMPLETE);
    });

    test("E2E-M07-03-025 適格請求書 登録番号が14文字以外なら形式エラーで保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS || !EDITABLE_ID, "BUY_ORDER_EDITABLE_ID 未設定");
      await login(page);
      const target = new AdminOnlinePurchasePurchaseOnlineBuyOrderEditPage(page);
      await target.goto(EDITABLE_ID);
      // 登録番号の長さ/形式検証は事業者(on)選択時のみ発火する（仕様: 事業者条件付き検証）。
      await target.qiIssuerFlgOn.check();
      await target.qiIssuerCode.fill("123"); // 仕様: 英数字ちょうど14文字
      await target.clickSave();
      await expect(page.locator("body")).not.toContainText(MSG_COMPLETE);
    });

    test("E2E-M07-03-026 口座番号を空にして保存するとエラーで保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS || !EDITABLE_ID, "ECCUBE_ADMIN_USER/PASS または BUY_ORDER_EDITABLE_ID 未設定");
      await login(page);
      const target = new AdminOnlinePurchasePurchaseOnlineBuyOrderEditPage(page);
      await target.goto(EDITABLE_ID);
      await target.accountNo.fill(""); // 口座番号 必須（仕様: 入力項目表 口座番号・数値7桁Range）。022の口座名義とは別項目（IT行024）
      await target.clickSave();
      await expect(target.saveButton).toBeVisible();
      await expect(page.locator("body")).not.toContainText(MSG_COMPLETE);
    });

    // 027 は事業者選択＋14文字英数字で「検証エラーが出ない＝保存成立」を見る正常対。保存成立は破壊的のため
    // 使い捨てシードが要る。024/025(必須/長さ異常)の正常系ペア（codex (C)指摘）。
    test.fixme(
      "E2E-M07-03-027 適格請求書 事業者選択＋登録番号14文字英数字なら検証エラーが出ない（正常系・破壊的）",
      async () => {
        // 期待は仕様(バリデーション: 事業者時 英数字ちょうど14文字)由来。024/025の正常対。
      }
    );

    // 030/032 は買取状況を特定ステータス(入庫済→別 / 振込依頼済み)へ変更する操作が成立条件。
    // 選択肢value/順序は mtb_buy_order_status の rank・シード依存で、selectOption({index})では
    // 「現状と異なる/狙ったステータス」を選ぶ保証がない（codex高指摘#4）。option値の実機確認まで fixme。
    test.fixme(
      "E2E-M07-03-030 入庫済みからのステータス変更は拒否メッセージが表示される（要確認: 買取状況の選択肢値）",
      async () => {
        // 期待は仕様(業務ルール: 入庫済からの変更拒否 / validators.ja.yaml:74 MSG_STOCKED_IMMUTABLE)由来。
        // buyOrderStatus を現状(入庫済)と異なるステータスへ変更し保存→拒否メッセージを確認する。
      }
    );

    test("E2E-M07-03-031 実在庫編集不可ステータスで増減を入れるとエラーが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS || !NOSTOCKEDIT_ID, "BUY_ORDER_NOSTOCKEDIT_ID 未設定");
      await login(page);
      const target = new AdminOnlinePurchasePurchaseOnlineBuyOrderEditPage(page);
      await target.goto(NOSTOCKEDIT_ID);
      // 実在庫増減(diff_stock)欄に0以外を入れて保存。セレクタは admin_purchase_buy_order_stock 名前空間由来。
      await target.stockDiffInput.first().fill("1");
      await target.clickSave();
      await target.seeMessage(MSG_STOCK_EDIT_NOT_ALLOWED); // validators.ja.yaml:75
    });

    test.fixme(
      "E2E-M07-03-032 振込依頼済みへ遷移で身分証未登録だとエラーが表示される（要確認: 振込依頼済みの選択肢値）",
      async () => {
        // 期待は仕様(業務ルール: 振込依頼時 身分証必須 / validators.ja.yaml:71 MSG_IDENTIFICATION_REQUIRED)由来。
        // buyOrderStatus を「振込依頼済み」へ変更して保存→身分証未登録エラーを確認する。
      }
    );

    // 034 は身分証未登録(032)の本人確認分岐の異常対。高額(eccube_purchase_identification_required_amount 以上)で
    // 会員プレイヤーなし/本人確認未完了のとき振込依頼済みへ遷移できない。高額シードと選択肢値が要実機確認。
    test.fixme(
      "E2E-M07-03-034 振込依頼済みへ遷移で高額時に会員本人確認未完了だとエラーが表示される（要確認: 選択肢値/高額シード）",
      async () => {
        // 期待は仕様(業務ルール: 振込依頼 高額時 会員本人確認)由来。032(身分証未登録)の本人確認分岐の対。
      }
    );

    // ===== 保留（破壊的/非決定的。理由付きで未実装。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M07-03-020 正常保存で「登録が完了しました。」フラッシュ（要: 全必須を満たす編集可能注文・破壊的）",
      async () => {
        // 期待は仕様(処理フロー#8 / messages.ja.yaml:1773)由来。DBを更新するため専用使い捨て注文シードで実装する。
      }
    );

    test.fixme(
      "E2E-M07-03-021 正常保存後に同一買取詳細(admin_purchase_edit)へリダイレクト（破壊的）",
      async () => {
        // 期待は仕様(処理フロー#9)由来。020と同じく破壊的のため使い捨てシードで実装する。
      }
    );

    test.fixme(
      "E2E-M07-03-033 実在庫増減で数量が負になると保存失敗（ロールバック）（要: 在庫行シード・例外挙動の実機確認）",
      async () => {
        // 期待は仕様(エッジケース InvalidArgumentException / エラー処理 実在庫数量矛盾)由来。
      }
    );

    test.fixme(
      "E2E-M07-03-040 CSVエクスポートボタンでダウンロードが発火する（内容検査は手動）",
      async () => {
        // 期待は仕様(利用者視点の入口 admin_purchase_csv_export)由来。download発火のみ自動化対象、ファイル内容は手動。
      }
    );

    test.fixme(
      "E2E-M07-03-042 商品一覧CSV(type=sale)エクスポートでダウンロードが発火する（内容検査は手動）",
      async () => {
        // 期待は仕様(利用者視点の入口 admin_purchase_csv_export_product_list)由来。040(csv_export)とは別ルート。
        // #csvexport_product_list の download 発火のみ自動化対象、ファイル内容は手動。
      }
    );

    test.fixme(
      "E2E-M07-03-041 一括売却登録ボタンで確認後に別ルート(admin_purchase_bulk_detail_sell)へ送信（破壊的・confirm要実機）",
      async () => {
        // 期待は仕様(利用者視点の入口・状態変化)由来。売却フラグ一括更新は破壊的のため使い捨てシードで実装する。
      }
    );

    test.fixme(
      "E2E-M07-03-004 まとめて買取アコーディオン初回展開でXHR行が生成される（行セレクタ・タイミング要実機）",
      async () => {
        // 期待は仕様(フロント挙動・admin_purchase_bulk_purchase_load)由来。bulk明細シードと挿入行セレクタを実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M07-03-015 依頼者編集ボタンで会員系入力のreadonly/疑似readonlyが切り替わる（観測点要実機）",
      async () => {
        // 期待は仕様(フロント挙動・#edit_customer_switch detail.twig:728)由来。切替の観測点を実機確認後に実装。
      }
    );
  }
);
