/**
 * 管理画面 受注情報編集 E2E。納品ケース表 integration_test/e2e/m05_11_admin_order_order_edit_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのうち非破壊で実行可能なものを実装し、要シード/破壊的(POST保存・ステータス変更・
 * 日付クリア)/要実機(Ajaxモーダル・返り先解釈)は test.fixme（理由付き）。手動/間接・対象外はケース表で全量管理し、
 * specに大量のfixmeを残さない（規約準拠）。
 * 期待結果は仕様(設計書 functions/pf-eccube3/m05-11_admin_order_order_edit.md / 観点表 / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約値を期待値に流用しない。
 * 設計源は pf-eccube3。刷新先 ec-cube-enterprise には同一画面が存在する（route=admin_order_edit）。
 * pf-eccube3 と ec-cube-enterprise の実装差（PurchaseFlow有無・手動メールUI）はケース表 付帯表4 に分離する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 *
 * シード（環境変数。コミットしない）:
 *  - ORDER_ID            : SEED-M05-11-ORDER（編集可能な既存受注。商品明細1件以上・単一配送・会員紐付き）
 *  - ORDER_NO_SHIPPING_ID: SEED-M05-11-NOSHIP（配送が1件も無い受注。納品書印刷404確認用）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OrderOrderEditPage } from "../../../pages/admin/m05/m05_11_admin_order_order_edit.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const ORDER_ID = process.env.ORDER_ID || "";
const HAS_ORDER = HAS_CREDS && !!ORDER_ID;

const HOME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/?(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;
const EDIT_RE = /\/order\/\d+\/edit(\?|$)/;

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const SAVE_COMPLETE = "保存しました"; // :2414 admin.order.save.complete
const CANCEL_COMPLETE = "全キャンセルが完了しました。"; // :2412 admin.order.cancel.complete
const STATUS_CHANGE_ERROR = "にはステータス変更できません"; // :2409 failed_to_change_status__short の部分

/** 管理ログインしてホームへ到達する。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).toHaveURL(HOME_RE);
}

/** ログインして受注編集画面を開く。 */
async function openEdit(page: Page, id = ORDER_ID) {
  await loginToHome(page);
  const edit = new OrderOrderEditPage(page);
  await edit.goto(id);
  return edit;
}

test.describe("管理画面 > 受注情報編集", { tag: ["@admin", "@order"] }, () => {
  // ===== 未認証・存在しないID（資格情報のみ・非破壊） =====

  test("E2E-M05-11-006 未ログインで編集URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
    // 期待は仕様(権限・認可: 未ログインは管理ログインへ誘導)由来（IT-15未認証）。
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order/1/edit`);
    await expect(page).toHaveURL(LOGIN_RE);
  });

  test("E2E-M05-11-005 存在しない受注IDの編集はHTTP404", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    // 期待は仕様(利用者視点の入口・エラー処理: 受注不存在は404)由来（IT-13）。
    await loginToHome(page);
    const edit = new OrderOrderEditPage(page);
    const res = await edit.goto(999999999);
    expect(res?.status()).toBe(404);
  });

  // ===== 編集画面 表示（SEED-M05-11-ORDER・読み取りのみ） =====

  test("E2E-M05-11-001 編集画面: 受注概要/商品明細/注文者カード・登録ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_ORDER, "SEED-M05-11-ORDER 未設定（ORDER_ID）");
    // 期待は仕様(フロント挙動・表示要素)由来（IT-25 UI部品）。
    const edit = await openEdit(page);
    await edit.seeEditForm();
  });

  test("E2E-M05-11-002 編集画面: 既存受注では受注ステータス変更欄が表示される", async ({ page }) => {
    test.skip(!HAS_ORDER, "SEED-M05-11-ORDER 未設定");
    // 期待は仕様(入力項目: 受注ステータスは既存受注のみ表示)由来（IT-25 操作起点）。
    const edit = await openEdit(page);
    await edit.seeOrderStatusField();
  });

  test("E2E-M05-11-003 編集画面: 納品書印刷ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_ORDER, "SEED-M05-11-ORDER 未設定");
    // 期待は仕様(画面遷移: 納品書印刷を新窓)由来（IT-25 操作起点）。
    const edit = await openEdit(page);
    await expect(edit.printDeliveryButton).toBeVisible();
  });

  test("E2E-M05-11-004 編集画面: 手動メール導線が表示される", async ({ page }) => {
    test.skip(!HAS_ORDER, "SEED-M05-11-ORDER 未設定");
    // 期待は仕様(フロント挙動: 画面上部に「手動メール」ボタン)由来（IT-25）。
    // 期待文言は仕様の「手動メール」で固定（実装文言「手動メール通知」はオラクル化しない）。
    // 設計は「ボタン」、実装は admin_order_manual_mail へのリンク＝乖離は付帯表4#2で分離（テストは仕様どおり）。
    const edit = await openEdit(page);
    await expect(edit.manualMailLink).toBeVisible();
  });

  // ===== 納品書印刷（配送0件→404・SEED-M05-11-NOSHIP） =====

  test("E2E-M05-11-051 配送が1件も無い受注の納品書印刷はHTTP404", async ({ page }) => {
    test.skip(!HAS_CREDS || !process.env.ORDER_NO_SHIPPING_ID, "SEED-M05-11-NOSHIP 未設定（ORDER_NO_SHIPPING_ID）");
    // 期待は仕様(調査補助: 配送が1件も無い受注はHTTP404)由来（IT-13）。
    await loginToHome(page);
    const edit = new OrderOrderEditPage(page);
    const res = await page.goto(edit.printDeliveryUrl(process.env.ORDER_NO_SHIPPING_ID as string));
    expect(res?.status()).toBe(404);
  });

  // ===== 要シード/破壊的/要実機（理由付きで未実装・抜け漏れ可視化） =====

  test.fixme(
    "E2E-M05-11-010 姓未入力で登録→エラー表示・同画面再描画（要: 編集可能受注のPOST。フォームエラー領域セレクタ要実機確認）",
    async () => {
      // 期待は仕様(バリデーション: 姓は必須)由来（IT-22 必須）。実装の制約値は期待化しない。
    }
  );

  test.fixme(
    "E2E-M05-11-016 商品明細0件で登録→商品種別1件以上エラー・保存されない（要: 明細削除POST）",
    async () => {
      // 期待は仕様(バリデーション: 商品明細件数 商品種別1未満でエラー)由来（IT-22 必須制御/件数）。
    }
  );

  test.fixme(
    "E2E-M05-11-015 国外住所で国外郵便番号空→エラー・保存されない（要: 国外国選択のPOST）",
    async () => {
      // 期待は仕様(入力項目: 国外国指定時は国外郵便番号必須)由来（IT-22 相関）。
    }
  );

  test.fixme(
    "E2E-M05-11-020 正常入力で登録→「保存しました」フラッシュ＋編集画面へリダイレクト（破壊的・要: 編集可能受注。return_link未指定時=021を本フローで内包検証）",
    async () => {
      // 期待は仕様(処理フロー: 登録成功で成功フラッシュ・編集画面へ)由来（IT-26 登録内容 / save.complete=保存しました）。
      // 021（保存後 同一ID編集画面へリダイレクト・return_link未指定時）は本ケースのリダイレクト検証で内包する（単独fixmeは置かない）。
    }
  );

  test.fixme(
    "E2E-M05-11-017 単一配送 国内郵便番号空→エラー・保存されない（要: 国内住所のPOST。070解釈不能/015国外郵便の対）",
    async () => {
      // 期待は仕様(バリデーション: 配送 国内郵便番号必須)由来（IT-22 相関）。015 国外郵便必須の対。
    }
  );

  test.fixme(
    "E2E-M05-11-022 return_link解釈可（内部パス）で登録→保存後その内部ルートへ遷移（破壊的・hidden改変。070解釈不能フォールバックの正常系対）",
    async () => {
      // 期待は仕様(画面遷移: return_link解釈可で内部ルートへ)由来（IT-23）。実装の解釈ロジックを期待化しない。
    }
  );

  test.fixme(
    "E2E-M05-11-033 ステータスをキャンセルへ変更→キャンセル専用完了メッセージ（破壊的・mode=status_change。030汎用保存完了の対）",
    async () => {
      // 期待は仕様(status_change: 新キャンセルは専用完了メッセージ)由来。文言は CANCEL_COMPLETE（messages.ja.yaml由来）で判定しオラクル独立。
    }
  );

  test.fixme(
    "E2E-M05-11-030 遷移可能なステータスへ変更→「保存しました」（破壊的・mode=status_change）",
    async () => {
      // 期待は仕様(ステータスだけ更新: 汎用保存完了メッセージ)由来（IT-23/IT-26）。
    }
  );

  test.fixme(
    "E2E-M05-11-031 遷移不可ステータスへ変更→「…にはステータス変更できません」（要: ステートマシン不可遷移／不可IDは選択肢から除外されるためoption追加等のDOM改変かPOST改変で送信）",
    async () => {
      // 期待は仕様(エラー処理: ステータス遷移不可は短い管理メッセージ)由来（IT-22 / failed_to_change_status__short）。
      // 注: 通常UIのselectOptionでは不可遷移を選べない。サーバ側のステートマシン再判定を発火させるためDOM/POST改変が必要。
    }
  );

  test.fixme(
    "E2E-M05-11-040 日付クリア(許可target)→「保存しました」・編集画面へ（破壊的・mode=clear_date）",
    async () => {
      // 期待は仕様(日付をクリアする: 成功時 保存完了系フラッシュ・編集画面へ)由来。
    }
  );

  test.fixme(
    "E2E-M05-11-050 納品書印刷ボタン押下→新ウィンドウで納品書テンプレートが開く（要: 新窓ハンドリング実機確認）",
    async () => {
      // 期待は仕様(画面遷移: 納品書印刷を新窓)由来（IT-15 状態変化）。
    }
  );

  test.fixme(
    "E2E-M05-11-060 会員検索モーダルで検索→会員一覧HTML断片がモーダル内に差し込まれる（Ajax・要実機）",
    async () => {
      // 期待は仕様(利用者視点の入口: 会員検索 HTML断片差込)由来（IT-23）。
    }
  );

  test.fixme(
    "E2E-M05-11-070 return_link が解釈不能→編集画面へフォールバック（要: hidden return_link 改変POST）",
    async () => {
      // 期待は仕様(エッジケース: return_link 解釈不能は警告ログのうえ編集画面へフォールバック)由来（IT-13）。ログは観測外。
    }
  );
});
