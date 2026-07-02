/**
 * 管理画面 カード管理 一括削除 E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m14_03_admin_card_card_bulk_delete_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」（実装済み・非破壊）と、自動化予定だが未実装/破壊系/要実機の test.fixme のみを残す。
 * 手動/間接（DB内部値・支店連携・ログ）と対象外はケース表で全量管理し、specに大量のfixmeを残さない。
 * 期待結果は仕様(functions/pf-eccube3/m14-03_admin_card_card_bulk_delete.md / integration-test-viewpoints.md)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 重要(仕様乖離): 設計書は pf-eccube3 / HareruyaEc プラグインのリバース。刷新先 ec-cube-enterprise では
 *  - ルートは設計 `POST /card/delete` ではなく `admin_card_bulk_delete`＝`/card/bulk_delete`（JSが _method=DELETE 注入）
 *  - 成功フラッシュキー `admin.delete.complete` → `admin.common.delete_complete`
 *  - 未選択は設計「メッセージ無しで一覧へ」だが実装はJS alert で送信抑止
 *  - 削除ブロックは設計「打ち切り＋Referer＋支店通知」だが実装は skip 継続＋検索一覧へ（支店連携なし）
 * いずれも付帯表4で管理し、テストは仕様どおりの観測（削除可否・削除の有無・メッセージ表示）を期待する。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の
 * spec/admin/login.spec.ts・two_factor_auth.spec.ts も @playwright/test を直接使う。本specもこれに倣い
 * @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行ゲート（環境変数。コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（管理者ログイン）= HAS_CREDS
 *  - SEED-M14-03-CARDS    : カードが1件以上（全選択は2件以上）存在する状態（表示・非破壊操作）
 *  - SEED-M14-03-DELETABLE: デッキ採用も商品紐付けも無い使い捨てカード（削除成功＝破壊系・fixme）
 *  - SEED-M14-03-BLOCKED  : デッキ採用または商品紐付けありで削除不可なカード（fixme）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { CardCardBulkDeletePage } from "../../../pages/admin/m14/m14_03_admin_card_card_bulk_delete.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

/** 管理者ログインしてカード一覧の検索結果を表示する。 */
async function loginAndOpenList(page: Page): Promise<CardCardBulkDeletePage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const card = new CardCardBulkDeletePage(page);
  await card.openListWithResults();
  return card;
}

test.describe("管理画面 > カード管理 一括削除", { tag: ["@admin", "@card"] }, () => {
  // ===== 認証不要・非破壊（常時実行可） =====

  test("E2E-M14-03-012 未ログインでカード一覧URL→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/card`);
    // 権限・認可: 未ログインは管理ログイン画面へ誘導される
    await expect(page).toHaveURL(/\/login(\?|$)/);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  // ===== 表示・非破壊操作（SEED-M14-03-CARDS） =====

  test("E2E-M14-03-001 検索結果が1件以上あるとき一括削除ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const card = await loginAndOpenList(page);
    // 仕様: totalItemCount > 0 のときのみ一括削除ボタンが表示される
    await expect(card.bulkDeleteButton).toBeVisible();
  });

  test("E2E-M14-03-002 検索結果の各行にカード選択チェックボックスが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const card = await loginAndOpenList(page);
    await expect(card.rowCheckboxes.first()).toBeVisible();
  });

  test("E2E-M14-03-003 全選択チェックで全行のチェックがオンになる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M14-03-CARDS 2件以上）");
    const card = await loginAndOpenList(page);
    const count = await card.rowCheckboxes.count();
    // 全選択の検証は複数行の一括オンが目的のため 2 件以上を要求する
    test.skip(count < 2, "一覧にカードが 2 件未満（SEED-M14-03-CARDS 2件以上が必要）");
    await card.selectAll.check();
    // 全行がオンになること（フロント挙動: 表頭の一括オンオフ）
    for (let i = 0; i < count; i++) {
      await expect(card.rowCheckboxes.nth(i)).toBeChecked();
    }
  });

  test("E2E-M14-03-004 確認ダイアログでキャンセルすると削除されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const card = await loginAndOpenList(page);
    const before = await card.rowCheckboxes.count();
    await card.checkFirstRow();
    // 仕様: confirm でキャンセルなら送信しない＝削除は実行されない
    page.once("dialog", (d) => d.dismiss());
    await card.clickBulkDelete();
    // 送信されず一覧に留まり、行数が変わらないこと（削除されない）
    await expect(card.rowCheckboxes).toHaveCount(before);
    await expect(card.successAlert).toHaveCount(0);
  });

  test("E2E-M14-03-010 チェックを付けずに一括削除を押すと削除が実行されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const card = await loginAndOpenList(page);
    const before = await card.rowCheckboxes.count();
    // 仕様(判定順序#2): cardIds 欠如は削除を実行しない（メッセージ有無は不具合候補#3で要確認）
    // 実装はJS alert で送信抑止するため、念のため alert を閉じる
    page.once("dialog", (d) => d.dismiss());
    await card.clickBulkDelete();
    await expect(card.rowCheckboxes).toHaveCount(before); // 削除されていない
    await expect(card.successAlert).toHaveCount(0); // 成功フラッシュは出ない
  });

  test("E2E-M14-03-014 検索結果が0件のときは一括削除ボタン・行チェックが表示されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(ADMIN_USER, ADMIN_PASS);
    const card = new CardCardBulkDeletePage(page);
    // 仕様(利用者視点の入口): 件数ゼロでは #form_bulk（totalItemCount条件）が描画されない
    await card.openListWithNoResults("____no_such_card_zzz_9999____");
    await expect(card.bulkDeleteButton).toHaveCount(0);
    await expect(card.rowCheckboxes).toHaveCount(0);
  });

  // ===== 破壊系・要シード・要実機（理由付きで保留。手動/対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M14-03-005/006/007 削除可能カードを選択し確認OKで削除完了→一覧から消える→検索一覧へ遷移（要 SEED-M14-03-DELETABLE 使い捨て）",
    async () => {
      // 期待は仕様(処理フロー#10 成功フラッシュ／データ整合性 一覧再取得／画面遷移 検索一覧)由来。
      // 削除でカードを消費する破壊系のため、使い捨てカードの投入手順を整えてから実装する。
      // 成功メッセージのキーは設計 admin.delete.complete／刷新先 admin.common.delete_complete（不具合候補#2）。
    }
  );

  test.fixme(
    "E2E-M14-03-008/009 デッキ採用のあるカードは削除できずエラー表示・一覧に残る（判定順序#4・要 SEED-M14-03-BLOCKED-DECK）",
    async () => {
      // 期待は仕様(判定順序#4 デッキ採用→削除ブロック＝エラーフラッシュ・残存)由来。
      // 刷新先は skip 継続＋検索一覧へ（Referer/支店通知なし＝不具合候補#6,#8）。テストは仕様どおり書く。
    }
  );

  test.fixme(
    "E2E-M14-03-017 商品紐付けのあるカードは削除できずエラー表示・一覧に残る（判定順序#5・要 SEED-M14-03-BLOCKED-PRODUCT）",
    async () => {
      // 期待は仕様(判定順序#5 論理未削除商品がカード詳細経由で存在→削除ブロック＝エラーフラッシュ・残存)由来。
      // 判定順序#4(デッキ)と#5(商品)を分離するため、商品紐付けのみで削除不可なシードを使う。
    }
  );

  test.fixme(
    "E2E-M14-03-015 cardIdsを空配列で明示送信した場合の挙動（要実機・リクエスト改変）",
    async () => {
      // 期待は仕様(エッジケース cardIds 空配列→ループ0回・削除なし)由来。
      // cardIds 欠如(010)とは別分岐。UIから空配列を送れないためリクエスト改変での検証手順を実機確認後に実装。
      // 刷新先 empty($cardIds) 判定の挙動・フラッシュ有無は不具合候補#3で要確認。
    }
  );

  test.fixme(
    "E2E-M14-03-016 可削除カードと削除不可カードの混在選択で可能分のみ削除・不可分は残る（途中ブロック・要 SEED-M14-03-MIXED）",
    async () => {
      // 期待は仕様(エッジケース 途中ブロック＝flush済みは残る・1件分エラー・Refererへ遷移)由来。
      // 刷新先は skip 継続＋admin_card_search（Referer/支店通知なし＝不具合候補#6,#8）。テストは仕様どおり書く。
      // DELETABLE は削除で消費する破壊系のため、混在シード(MIXED)の投入手順を整えてから実装する。
    }
  );

  test.fixme(
    "E2E-M14-03-011 CSRFトークンが不正な一括削除はアクセス拒否(403)となる（要実機・トークン改ざん）",
    async () => {
      // 期待は仕様(判定順序#1 CSRF無効→HTTP 403)由来。_token は JS 注入のため、リクエスト改変での検証手順を実機確認後に実装。
      // 刷新先 isTokenValid() の例外/ステータスは要確認（不具合候補#4）。
    }
  );

  test.fixme(
    "E2E-M14-03-013 存在しないカードIDの一括削除はHTTP 404となる（要実機・リクエスト改変）",
    async () => {
      // 期待は仕様(判定順序#3 カード不在→HTTP 404)由来。刷新先は findBy 空で404を投げない可能性（不具合候補#5）。
      // UIから不在IDを送れないためリクエスト改変での検証手順を実機確認後に実装。
    }
  );
});
