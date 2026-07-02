/**
 * 管理画面 店頭買取管理 — 買取詳細（買取情報の確認と保存） E2E。
 * 納品ケース表 integration_test/e2e/m06_03_admin_store_purchase_purchase_store_otc_buy_info_edit_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」かつ非破壊で実行可能なものを実装し、要シード状態(許可ステータス・店舗一致)/破壊的
 * (保存・ステータス遷移・個別実在庫登録)/要実機(Ajaxモーダル・確認ダイアログ後の遷移)は test.fixme（理由付き）。
 * 手動/間接・対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約準拠）。
 * 期待結果は仕様(設計書 functions/pf-eccube3/m06-03_..._otc_buy_info_edit.md / 観点表 / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約値を期待値に流用しない。
 * pf-eccube3(HareruyaEcプラグイン)と ec-cube-enterprise の実装差・仕様乖離はケース表 付帯表4 に分離する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 *
 * シード（環境変数。コミットしない）:
 *  - OTC_ORDER_ID         : SEED-M06-03-OTC（編集可能店舗・既存の店頭買取注文。表示/保存の参照系で使う）
 *  - OTC_PCLASS_ID        : SEED-M06-03-OTC の在庫編集表に出る商品規格ID（増減数保存の対象。破壊的のため fixme）
 *  - OTC_PENDING_ID       : SEED-M06-03-PENDING（経理払出し待ちステータスの注文。経理払出し済→買取完了 用・破壊的）
 *  - OTC_INDIV_ID         : SEED-M06-03-INDIV（未登録の個別入力商品を持つ注文。個別実在庫登録 用・破壊的）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StorePurchasePurchaseStoreOtcBuyInfoEditPage } from "../../../pages/admin/m06/m06_03_admin_store_purchase_purchase_store_otc_buy_info_edit.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const OTC_ORDER_ID = process.env.OTC_ORDER_ID || "";
const HAS_ORDER = HAS_CREDS && !!OTC_ORDER_ID;

const HOME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/?(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;
const DETAIL_RE = /\/otcbuyorder\/\d+(\?|$)/;
const STATUS_RE = /\/otcbuyorder\/status\/\d+(\?|$)/;
const LIST_RE = /\/otcbuyorder(\/page\/\d+)?(\?|$)/;

// 仕様(messages.ja.yaml / 設計書 / コントローラのハードコード文言)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const SAVE_COMPLETE = "保存しました"; // messages.ja.yaml:1398 admin.common.save_complete
const ACCOUNT_CONFIRM = "経理払出し済みに変更します。よろしいですか？"; // detail.twig:653 confirm
const ACCOUNT_WRONG_STATUS = "経理払出し待ちステータスの買取ではありません"; // OtcBuyOrderController.php:423
const INDIV_COMPLETE = "実在庫登録が完了しました。"; // OtcBuyOrderController.php:612
const SEARCH_FAIL_ALERT = "商品の検索に失敗しました。"; // detail.twig:628 ajax fail
const EDIT_RELEASE_CONFIRM = "編集した内容は元に戻ります。解除しますか？"; // detail.twig:667 confirm

/** 管理ログインしてホームへ到達する。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).toHaveURL(HOME_RE);
}

/** ログインして買取詳細画面を開く。 */
async function openDetail(page: Page, id = OTC_ORDER_ID) {
  await loginToHome(page);
  const detail = new StorePurchasePurchaseStoreOtcBuyInfoEditPage(page);
  await detail.goto(id);
  return detail;
}

test.describe(
  "管理画面 > 店頭買取管理 > 買取詳細",
  { tag: ["@admin", "@purchase_store"] },
  () => {
    // ===== 未認証・存在しないID（資格情報のみ・非破壊） =====

    test("E2E-M06-03-080 未認証で買取詳細URL→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      // 期待は仕様(権限・認可: 未認証は管理画面に入れない)由来。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/1`);
      await expect(page.locator("#login_id")).toBeVisible();
      await expect(page).toHaveURL(LOGIN_RE);
    });

    test("E2E-M06-03-005 存在しないIDの買取詳細GETで404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      // 期待は仕様(処理フロー#2 / エラー処理: 存在しない注文IDは404)由来。
      await loginToHome(page);
      const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/999999999`);
      expect(res?.status()).toBe(404);
    });

    // ===== 表示（SEED-M06-03-OTC・非破壊） =====

    test("E2E-M06-03-001 買取詳細: サブタイトル『買取詳細』と主要5カードが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_ORDER, "SEED-M06-03-OTC 未設定（OTC_ORDER_ID）");
      const detail = await openDetail(page);
      await expect(page.locator("body")).toContainText("買取詳細"); // sub_title(detail.twig:7)
      await detail.seeDetailCards();
    });

    test("E2E-M06-03-002 買取詳細: 査定合計金額が買取情報カードに表示される", async ({
      page,
    }) => {
      test.skip(!HAS_ORDER, "SEED-M06-03-OTC 未設定");
      const detail = await openDetail(page);
      // 期待は仕様(集計条件: 査定合計金額は total_price を価格フォーマットで表示)由来。
      // 値はデータ依存のため、買取情報カード内に「査定合計金額」ラベルと数値が表示されることで確認する。
      // 通貨記号/桁区切りの正確な書式は実装/ロケール依存のため固定しない（オラクル混入回避）。
      const buyCard = page.locator(".card", {
        has: page.locator(".card-header", { hasText: "買取情報" }),
      });
      await expect(buyCard).toContainText("査定合計金額");
      await expect(buyCard).toContainText(/\d/); // 価格（数値）が表示されること
    });

    test("E2E-M06-03-003 買取詳細: フリーコメント入力欄が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_ORDER, "SEED-M06-03-OTC 未設定");
      const detail = await openDetail(page);
      await expect(detail.freeComment).toBeVisible();
    });

    test("E2E-M06-03-004 買取詳細: フッタに保存/経理/入庫/ステータス変更/一覧の操作が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_ORDER, "SEED-M06-03-OTC 未設定");
      const detail = await openDetail(page);
      await detail.seeFooterControls();
    });

    test("E2E-M06-03-070 実在庫情報: 編集ボタンで増減数入力の編集表が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_ORDER, "SEED-M06-03-OTC 未設定（実在庫1件以上）");
      const detail = await openDetail(page);
      // 期待は仕様(フロント挙動 JS: 編集で表示/編集ブロックを切替え)由来。
      await expect(detail.stockEditTable).toBeHidden(); // 初期非表示(detail.twig:306)
      await detail.editStockSwitch.click();
      await expect(detail.stockEditTable).toBeVisible();
    });

    test("E2E-M06-03-071 実在庫情報: 編集解除で確認ダイアログが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_ORDER, "SEED-M06-03-OTC 未設定（実在庫1件以上）");
      const detail = await openDetail(page);
      await detail.editStockSwitch.click(); // 編集モードへ
      let dialogMessage = "";
      page.once("dialog", async (d) => {
        dialogMessage = d.message();
        await d.dismiss();
      });
      await detail.editStockSwitch.click(); // 編集解除
      // 期待は仕様(フロント挙動 JS: 編集解除時は確認後に動的追加行削除)由来。
      expect(dialogMessage).toContain(EDIT_RELEASE_CONFIRM);
    });

    test("E2E-M06-03-030 経理払出し済: 送信前に確認ダイアログが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_ORDER, "SEED-M06-03-OTC 未設定");
      const detail = await openDetail(page);
      let dialogMessage = "";
      page.once("dialog", async (d) => {
        dialogMessage = d.message();
        await d.dismiss(); // キャンセルして遷移させない（非破壊）
      });
      await detail.accountTeamPaidButton.click();
      // 期待は仕様(フロント挙動 JS: 経理払出し済送信前に confirm)由来。
      expect(dialogMessage).toContain(ACCOUNT_CONFIRM);
    });

    test("E2E-M06-03-050 ステータス変更リンクでステータス変更画面へ遷移", async ({
      page,
    }) => {
      test.skip(!HAS_ORDER, "SEED-M06-03-OTC 未設定");
      const detail = await openDetail(page);
      await detail.statusChangeLink.click();
      // 期待は仕様(画面遷移: ステータス変更→GET .../otcbuyorder/status/{id})由来。
      await expect(page).toHaveURL(STATUS_RE);
    });

    test("E2E-M06-03-060 個別実在庫登録: 実在庫情報登録ボタンでモーダルが開く", async ({
      page,
    }) => {
      test.skip(
        !HAS_ORDER,
        "SEED-M06-03-OTC 未設定（未登録の個別入力商品を持つ注文が必要）"
      );
      const detail = await openDetail(page);
      // 個別入力商品が未登録の場合のみ .item-regist-button が描画される（detail.twig:232-242）。
      test.skip(
        (await detail.itemRegistButton.count()) === 0,
        "未登録の個別入力商品が無いためボタン非表示"
      );
      await detail.itemRegistButton.click();
      await expect(detail.registModal).toBeVisible();
      await expect(detail.modalSearchButton).toBeVisible();
    });

    // ===== 破壊的・要シード状態・要実機（理由付きで未実行・抜け漏れ可視化） =====

    test.fixme(
      "E2E-M06-03-010 フリーコメント保存で成功フラッシュ『保存しました』が表示される（破壊的: free_comment 更新）",
      async () => {
        // 期待は仕様(保存処理判定順序#2,#3空・処理フロー#7,#8 / save_complete)由来。
        // SEED-M06-03-OTC のフリーコメントを更新し、専用注文/復元手順を整えてから実装。
      }
    );

    test.fixme(
      "E2E-M06-03-011 フリーコメント保存後に同じ買取詳細へリダイレクトされる（破壊的）",
      async () => {
        // 期待は仕様(画面遷移: POST完了後 GET .../otcbuyorder/{id} / 入出力: 詳細への302)由来。
      }
    );

    test.fixme(
      "E2E-M06-03-012 フリーコメント空でも保存が継続する（任意項目・破壊的）",
      async () => {
        // 期待は仕様(バリデーション: フリーコメントは必須でない / 入力項目)由来。空送信→成功フラッシュ。
      }
    );

    test.fixme(
      "E2E-M06-03-020 在庫増減を入力して保存すると成功フラッシュが表示される（破壊的: 在庫・履歴更新）",
      async () => {
        // 期待は仕様(処理フロー#6 在庫更新アクション成功→save_complete)由来。
        // OTC_PCLASS_ID へ正の増減数を入力（編集モード）→保存。専用注文で実施。
      }
    );

    test.fixme(
      "E2E-M06-03-021 許可ステータス外での在庫更新はエラーフラッシュで詳細へ戻る（500にならない）",
      async () => {
        // 期待は仕様(エッジケース: 許可ステータス外は例外メッセージをエラーフラッシュしリダイレクト・500にならない)由来。
        // 在庫更新が許可されないステータスの注文に対し増減数POST→.alert-danger かつ DETAIL_RE 滞留。
      }
    );

    test.fixme(
      "E2E-M06-03-022 在庫が負になる増減数は数量下限違反でエラーフラッシュ・詳細滞留（500にならない）",
      async () => {
        // 期待は仕様(判定順序#4 数量下限: 在庫数量が負になる増減は例外メッセージをエラーフラッシュしリダイレクト・500にならない)由来。
        // 既存在庫数を超える減算（在庫が負になる値）を OTC_PCLASS_ID へ入力→保存→.alert-danger かつ DETAIL_RE 滞留。
        // 021(許可ステータス外)とは別条件。文言は固定せずエラーフラッシュ表示で判定（オラクル独立性）。
      }
    );

    test.fixme(
      "E2E-M06-03-031 経理払出し待ち→経理払出し済で買取完了へ遷移し成功フラッシュ（破壊的: ステータス遷移）",
      async () => {
        // 期待は仕様(経理払出し済処理#5 成功→save_complete)由来。OTC_PENDING_ID で confirm を accept。
      }
    );

    test.fixme(
      "E2E-M06-03-032 経理払出し待ち以外で経理払出し済を実行するとエラーフラッシュ",
      async () => {
        // 期待は仕様(経理払出し済処理#4 現在が経理払出し待ちでなければエラー / OtcBuyOrderController.php:423)由来。
        // confirm を accept→.alert-danger に「経理払出し待ちステータスの買取ではありません」。
      }
    );

    test.fixme(
      "E2E-M06-03-040 入庫済みにするで成功フラッシュ（破壊的: ステータス遷移）",
      async () => {
        // 期待は仕様(入庫済み処理#4 成功→save_complete)由来。編集可能店舗の注文で実施。
      }
    );

    test.fixme(
      "E2E-M06-03-051 店頭買取一覧リンクで一覧画面へ遷移する",
      async () => {
        // 期待は仕様(画面遷移: フッタ店頭買取一覧→GET .../otcbuyorder/page/{page_no})由来。LIST_RE で確認。
      }
    );

    test.fixme(
      "E2E-M06-03-061 個別実在庫登録の決定で成功フラッシュ『実在庫登録が完了しました。』（破壊的・要Ajax）",
      async () => {
        // 期待は仕様(個別登録処理#5 成功→実在庫登録が完了しました。 / OtcBuyOrderController.php:612)由来。
        // モーダル検索Ajax→規格決定→POST。専用注文(OTC_INDIV_ID)で実施。
      }
    );

    test.fixme(
      "E2E-M06-03-062 商品検索Ajax失敗で『商品の検索に失敗しました。』のalertが出る（要実機・失敗注入）",
      async () => {
        // 期待は仕様(エラー処理: 商品検索Ajax失敗は alert で表示 / detail.twig:628)由来。
        // Ajaxを失敗させる経路(route abort 等)を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M06-03-063 個別登録で商品規格が取得できないとエラーフラッシュで詳細へ戻る（要実機・POST生成）",
      async () => {
        // 期待は仕様(個別登録処理#3: product_class_id で商品規格を取得できなければエラーメッセージを積み詳細へリダイレクト)由来。
        // 取得できない product_class_id で個別登録POST→.alert-danger かつ DETAIL_RE 滞留。文言は固定しない（オラクル独立性）。
      }
    );

    test.fixme(
      "E2E-M06-03-064 個別登録の二重登録は拒否されエラーフラッシュで詳細へ戻る（破壊的・要既登録データ）",
      async () => {
        // 期待は仕様(エッジケース: 個別登録が重複は拒否 / 個別登録処理#4 二重防止)由来。
        // 既に実在庫登録済みの個別入力商品に対し個別登録POST→.alert-danger（既登録の旨）かつ DETAIL_RE 滞留。
      }
    );

    test.fixme(
      "E2E-M06-03-065 注文に属さない個別入力商品IDの個別登録POSTは404（要CSRF付きPOST生成）",
      async () => {
        // 期待は仕様(個別登録処理#2: 個別入力商品が当該注文に属さなければ404)由来。
        // 他注文の individualProductId で /register-individual-stock POST→HTTP 404。
      }
    );

    test.fixme(
      "E2E-M06-03-091 CSRFトークン無効の個別登録/経理/入庫POSTはエラーフラッシュで詳細へ戻る（要実機・トークン無効化）",
      async () => {
        // 期待は仕様(エラー処理: CSRF無効(経理・入庫・個別登録)はエラーフラッシュして詳細へ)由来。
        // トークンを除去/改ざんしたPOST→.alert-danger かつ DETAIL_RE 滞留・500にならない。
        // CSRFトークン名(register_individual_stock 等)は実装由来のため期待値に固定しない（オラクル独立性）。
      }
    );

    test.fixme(
      "E2E-M06-03-090 数量0の在庫表示行は実在庫情報の表に出ない（要データ条件）",
      async () => {
        // 期待は仕様(集計条件: 数量0の在庫行は表に出さない)由来。数量0行を持つ注文を用意して確認。
      }
    );

    test.fixme(
      "E2E-M06-03-081 存在しないIDへ保存POSTすると404（要CSRF付きPOST生成）",
      async () => {
        // 期待は仕様(利用者視点の入口: 存在しない otcBuyOrderId への保存POSTは404)由来。
      }
    );

    test.fixme(
      "E2E-M06-03-033 存在しないIDへ経理払出し済POSTすると404（要CSRF付きPOST生成）",
      async () => {
        // 期待は仕様(経理払出し済処理#2 注文が無ければ404 / 設計書md:94)由来。
        // /otcbuyorder/999999999/account_team_paid へCSRF付きPOST→HTTP 404。
      }
    );

    test.fixme(
      "E2E-M06-03-041 存在しないIDへ入庫済みPOSTすると404（要CSRF付きPOST生成）",
      async () => {
        // 期待は仕様(入庫済み処理#2 注文が無ければ404 / 設計書md:103)由来。
        // /otcbuyorder/999999999/restocked へCSRF付きPOST→HTTP 404。
      }
    );

    test.fixme(
      "E2E-M06-03-092 保存POSTがフォーム不正なら成功フラッシュ無しで詳細へ戻る（要実機・トークン不正化）",
      async () => {
        // 期待は仕様(判定順序#2: フォームが妥当でなければ保存処理を行わず成功・失敗フラッシュを積まずリダイレクト / 設計書md:115,153)由来。
        // 保存フォームのトークンを無効化/改ざんして update POST→.alert-success 不在 かつ DETAIL_RE 滞留。
        // 保存されないことの確証はDB側（手動/間接）。トークン名は実装由来のため期待値に固定しない（オラクル独立性）。
      }
    );

    test.fixme(
      "E2E-M06-03-093 実在庫0件のとき編集ボタン・編集表を出さず『実在庫情報はありません。』が表示される（要データ・要実機確認）",
      async () => {
        // 期待は仕様(エッジケース: 実在庫0件は編集ボタンと編集表を出さない・空メッセージ / 設計書md:157)由来。
        // SEED-M06-03-NOSTOCK（実在庫0件）で #edit_stock_switch・#detail_stock_edit 非表示＋空メッセージを確認。
        // 実装の現挙動は付帯表4#1 のとおり仕様乖離の疑いがあり、テストは仕様どおりに書く（要実機確認）。
      }
    );

    test.fixme(
      "E2E-M06-03-095 明細小計が表示され数量0の明細/個別入力行は表に出ない（要データ）",
      async () => {
        // 期待は仕様(集計条件: 明細小計=数量×単価表示・数量0の明細/個別入力行は表に出さない / 設計書md:126,127)由来。
        // 数量0行を含む注文を用意し、表示行に小計が出ること・数量0行が表に無いことを確認する。
      }
    );
  }
);
