/**
 * 管理画面「デッキ管理 — 一括削除」E2E。
 * 納品ケース表 integration_test/e2e/m15_03_admin_deck_deck_bulk_delete_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装し、CSRF403(022)/不存在ID404(023)は test.fixme（理由付き）。
 * 手動/間接（DB副作用観測）・対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約準拠）。
 * 期待結果は仕様(functions/pf-eccube3/m15-03_admin_deck_deck_bulk_delete.md / 観点表)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 *
 * シード（環境変数。コミットしない）:
 *  - SEED-M15-03-DECK-DELETABLE : 記事に紐付かない削除可能デッキが検索一覧に1件以上（破壊的・使い捨て）
 *  - SEED-M15-03-DECK-INARTICLE : 記事(dtb_article_deck)参照中のデッキが検索一覧に1件以上（非破壊・削除不可）
 *  破壊的ケース(001/002)は使い捨てデッキ前提のため、シード無しでは test.skip でガードする。
 *
 * 不具合候補（テストは仕様どおりに書く。実装が違えば失敗で検出する）:
 *  - CSRF 失敗: 仕様=HTTP403。実装(DeckController.php:143-147)=エラーフラッシュ+一覧リダイレクト → 022 で乖離検出見込み。
 *  - 記事参照中: 仕様=フラッシュ admin.deck.is_used.article + Referer 戻り。実装=delete_error_article + admin_deck_search → 021 で乖離検出見込み。
 *  - 途中で記事参照中: 仕様=既削除分は確定。実装=全件トランザクションrollback（確定しない）→ ケース表 手動/間接で管理。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { M15DeckDeckBulkDeletePage } from "../../../pages/admin/m15/m15_03_admin_deck_deck_bulk_delete.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// 削除可能デッキの存在を前提とする破壊的ケース用ガード（使い捨てシード）
const HAS_DELETABLE = HAS_CREDS && process.env.SEED_M15_03_DELETABLE === "1";
// 記事参照中デッキの存在を前提とする非破壊ケース用ガード
const HAS_INARTICLE = HAS_CREDS && process.env.SEED_M15_03_INARTICLE === "1";
// 対象デッキの決定論的選択用 id（任意）。未指定時は先頭行を選ぶ（先頭固定は保証されない＝要確認）。
// codex指摘(高): SEED フラグだけでは対象が先頭に来る保証が無いため、シードが対象 id を渡せば確実化する。
const DELETABLE_ID = process.env.SEED_M15_03_DELETABLE_ID || undefined;
const INARTICLE_ID = process.env.SEED_M15_03_INARTICLE_ID || undefined;

// リダイレクト先（admin_deck_list/admin_deck_search どちらも許容）の包含判定用。期待は仕様(画面遷移節)由来。
// 要確認: 設計書は page_no の有無で /deck と /deck/search/{page_no} に分岐する。当 spec はセッションの page_no を
// 制御しないため遷移先を厳密分岐せず「検索一覧群へ戻る」ことのみ確認する（page_no 別分岐は手動/要実機確認）。
const SEARCH_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/deck(/search(/\\d+)?)?(\\?|$)`);

async function loginAndOpenSearch(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const target = new M15DeckDeckBulkDeletePage(page);
  await target.gotoList();
  await target.submitSearch(); // 検索結果ブロック（一括フォーム）を描画させる
  return target;
}

test.describe("管理画面 > デッキ管理 一括削除", { tag: ["@admin", "@deck"] }, () => {
  // ===== UI部品・表示（非破壊・検索結果1件以上が前提） =====

  test("E2E-M15-03-010 検索結果1件以上のとき一括削除ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const target = await loginAndOpenSearch(page);
    await target.seeBulkDeleteVisible(); // 仕様: フロント挙動/表示要素
  });

  test("E2E-M15-03-011 一覧に表頭チェック#allCheckと行チェックdeckId[]・一括削除ボタンが存在する", async ({
    page,
  }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const target = await loginAndOpenSearch(page);
    await target.seeListControls(); // 仕様: 表頭チェック#allCheck・deckId[]
  });

  test("E2E-M15-03-012 表頭チェック#allCheckで行チェックが一括連動する", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const target = await loginAndOpenSearch(page);
    await target.checkAll();
    const count = await target.rowChecks.count();
    for (let i = 0; i < count; i++) {
      await expect(target.rowChecks.nth(i)).toBeChecked(); // 仕様: deck-search.js のチェック連動
    }
  });

  test("E2E-M15-03-013 一括削除ボタンの確認ダイアログをキャンセルすると送信されず同画面に留まる", async ({
    page,
  }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const target = await loginAndOpenSearch(page);
    await target.checkFirstRow();
    const urlBefore = page.url();
    await target.clickBulkDelete(false); // confirm をキャンセル
    await expect(target.bulkDeleteButton).toBeVisible(); // 同画面に留まる（送信されない）
    expect(page.url()).toBe(urlBefore);
  });

  test("E2E-M15-03-014 検索結果ゼロのとき一括削除ボタン・チェックボックスが表示されない", async ({
    page,
  }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
    const target = new M15DeckDeckBulkDeletePage(page);
    await target.gotoList();
    // 0件になる検索条件で検索する（存在しないデッキ名等）。条件入力は実機の検索欄に依存するため
    // ここでは「結果ゼロ表示が出たら一括削除ボタンが無いこと」を確認する。
    await target.submitSearch();
    if (await target.searchNoResult.isVisible()) {
      await expect(target.bulkDeleteButton).toHaveCount(0); // 仕様: 入口節（ボタン非描画）
      await expect(target.allCheck).toHaveCount(0);
    } else {
      test.skip(true, "検索結果が0件にならない環境のため未判定（ケース表で管理）");
    }
  });

  test("E2E-M15-03-015 一括削除の確認ダイアログ文言に「選択されたデッキ」が含まれる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const target = await loginAndOpenSearch(page);
    await target.checkFirstRow();
    const message = await target.captureConfirmMessage(); // 読み取り後キャンセル（非破壊）
    // 仕様: フロント挙動の confirm 文言は format('選択されたデッキ') を埋める（設計由来）。
    // 実装の翻訳キー(admin.deck.bulk_delete_confirm)は期待値化せず、設計の format 値「選択されたデッキ」の包含で判定する。
    expect(message).toContain("選択されたデッキ");
  });

  // ===== 異常系（非破壊） =====

  test("E2E-M15-03-020 チェック未選択で一括削除→フラッシュ無しで検索一覧へリダイレクトし削除が発生しない", async ({
    page,
  }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const target = await loginAndOpenSearch(page);
    await target.clickBulkDelete(true); // 何もチェックせず送信（confirm は許可）
    await expect(page).toHaveURL(SEARCH_RE); // 仕様: deckId 無し→検索ページ/一覧へリダイレクト
    await expect(target.successAlert).toHaveCount(0); // 仕様: フラッシュ無し
  });

  test("E2E-M15-03-021 記事参照中デッキを一括削除→エラーメッセージが表示され削除されない", async ({
    page,
  }) => {
    test.skip(!HAS_INARTICLE, "SEED-M15-03-DECK-INARTICLE 未設定（記事参照中デッキが必要）");
    const target = await loginAndOpenSearch(page);
    // 記事参照中デッキを決定論的に選択（id 指定が無い場合は先頭行＝要確認）。
    const id = await target.checkTargetRow(INARTICLE_ID);
    await target.clickBulkDelete(true);
    // 仕様: 記事参照中はエラーフラッシュ + リダイレクト。削除は実行されない。
    // 実装の翻訳キー(delete_error_article)は期待値に固定しない（オラクル独立性）。エラー alert の表示と
    // 当該デッキの残存で判定する。文言キー相当・Referer 戻り・途中削除確定は手動/要実機確認（ケース表 不具合候補#2/#3）。
    await expect(target.errorAlert.first()).toBeVisible();
    // 削除されていないこと（一覧再表示で当該デッキの行チェックが再び存在する）。
    await target.gotoList();
    await target.submitSearch();
    await expect(page.locator(`input[name="deckId[]"][value="${id}"]`)).toHaveCount(1);
  });

  // ===== 権限・認可（非破壊・認証不要） =====

  test("E2E-M15-03-030 未ログインでデッキ一覧URL直接→管理ログイン画面へ誘導される", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/deck`);
    await expect(page.locator("#login_id")).toBeVisible(); // 仕様: 権限・認可（管理画面の認可に阻まれる）
  });

  // ===== 正常系（破壊的・使い捨てシード前提） =====

  test("E2E-M15-03-001 削除可能デッキを一括削除→成功メッセージが表示される", async ({ page }) => {
    test.skip(!HAS_DELETABLE, "SEED-M15-03-DECK-DELETABLE 未設定（破壊的・使い捨てデッキが必要）");
    const target = await loginAndOpenSearch(page);
    await target.checkTargetRow(DELETABLE_ID); // 使い捨てデッキを決定論的に選択（id 指定が無い場合は先頭行＝要確認）
    await target.clickBulkDelete(true);
    await expect(target.successAlert.first()).toBeVisible(); // 仕様: 成功フラッシュ（削除完了）
  });

  test("E2E-M15-03-002 一括削除成功でデッキ検索一覧へ遷移し対象デッキが一覧から消える", async ({ page }) => {
    test.skip(!HAS_DELETABLE, "SEED-M15-03-DECK-DELETABLE 未設定（破壊的・使い捨てデッキが必要）");
    const target = await loginAndOpenSearch(page);
    const id = await target.checkTargetRow(DELETABLE_ID);
    await target.clickBulkDelete(true);
    await expect(page).toHaveURL(SEARCH_RE); // 仕様: 302 で検索一覧/一覧へ
    await target.gotoList();
    await target.submitSearch();
    await expect(page.locator(`input[name="deckId[]"][value="${id}"]`)).toHaveCount(0); // 一覧から消える
  });

  // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M15-03-022 CSRFトークン不正で一括削除→拒否され削除されない（仕様=HTTP403。要: トークン改竄＋実機確認）",
    async () => {
      // 期待は仕様(判定順序#1・エラー処理 HTTP403)由来。実装は redirect+errorflash の可能性（不具合候補#1）。
      // tamperToken でトークンを壊して送信し、403 もしくは削除非実行を実機確認後に実装する。
    }
  );

  test.fixme(
    "E2E-M15-03-023 存在しないデッキIDで一括削除→HTTP404で打ち切り（要: deckId値改竄＋実機確認）",
    async () => {
      // 期待は仕様(判定順序#3・エラー処理 HTTP404)由来。tamperRowValue で不存在IDに改竄して送信し、
      // 404 応答を実機確認後に実装する。
    }
  );
});
