/**
 * 管理画面 デッキ表示（M13-08）E2E。納品ケース表 integration_test/e2e/m13_08_admin_event_event_deck_view_e2e_cases.md に対応。
 * 本specには資格情報のみで動く非破壊ケース（001-007 のうち資格情報不要003含む）を実装し、
 * 要シード/要実機の 008/009/010/011 は test.fixme で残す（008の#decklistは結果0件時にJS disabled化されるため要シード）。
 * 手動（デッキ内容：プレイヤー名・DCI・枚数・サイド・カナ代替・抽出包含）／対象外（入力バリデーション・読み取り専用の書込）は
 * ケース表（付帯表2b）で全量管理し、specには大量のfixmeを残さない。
 *
 * 期待結果は仕様(functions/pf-eccube3/m13-08_admin_event_event_deck_view.md / messages.ja.yaml)由来（オラクル独立性）。
 * デッキ表示は印刷向けの読み取り専用画面。設計（pf-eccube3 リバース）と刷新先 ec-cube-enterprise 実装の乖離
 * （40枚ページ分割・サイドボード描画・DCIナンバー表示・イベント名英表記・セッションキー名・URLパス）は
 * ケース表 付帯表4（不具合候補）に記録済み。テストは仕様どおりに書く。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 資格情報（環境変数。コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（SEED-M13-08-ADMIN：イベント管理URLへ到達できる管理者・2FA OFF）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { M13_08AdminEventEventDeckViewPage } from "../../../pages/admin/m13/m13_08_admin_event_event_deck_view.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const DECKLIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/event/entry/decklist(\\?|$)`);

/** 管理者でログインする（SEED-M13-08-ADMIN）。 */
async function loginAsAdmin(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).not.toHaveURL(LOGIN_RE); // ログイン成功（ログイン画面に滞留しない）
}

test.describe(
  "管理画面 > イベント管理 > デッキ表示",
  { tag: ["@admin", "@event", "@deck"] },
  () => {
    // ===== 資格情報不要・非破壊 =====

    test("E2E-M13-08-003 未ログインでデッキ表示URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/event/entry/decklist`);
      await expect(page.locator("#login_id")).toBeVisible(); // 管理ログイン画面
    });

    // ===== ログイン済み・読み取り専用（SEED-M13-08-ADMIN） =====

    test("E2E-M13-08-001 ログイン済みでデッキ表示画面が表示されタイトルがデッキリスト", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M13-08-ADMIN 未設定（ECCUBE_ADMIN_USER/PASS）");
      await loginAsAdmin(page);
      const deck = new M13_08AdminEventEventDeckViewPage(page);
      await deck.goto();
      await deck.seeDeckListScreen(); // title「デッキリスト」＋印刷ボタン
    });

    test("E2E-M13-08-002 デッキ表示画面の上部に印刷ボタン（印刷する）が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M13-08-ADMIN 未設定");
      await loginAsAdmin(page);
      const deck = new M13_08AdminEventEventDeckViewPage(page);
      await deck.goto();
      await deck.seePrintButton();
    });

    test("E2E-M13-08-004 デッキ表示画面は入力フォーム・テキスト入力を持たない", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M13-08-ADMIN 未設定");
      await loginAsAdmin(page);
      const deck = new M13_08AdminEventEventDeckViewPage(page);
      await deck.goto();
      await deck.seeNoInputForm();
    });

    test("E2E-M13-08-005 デッキ表示画面は管理共通フレームを持たない独立HTMLである", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M13-08-ADMIN 未設定");
      await loginAsAdmin(page);
      const deck = new M13_08AdminEventEventDeckViewPage(page);
      await deck.goto();
      await deck.seeStandaloneFrame(); // 管理ナビゲーション不在（管理フレーム特定は要実機確認）
    });

    test("E2E-M13-08-006 デッキ表示画面はモーダル・確認ダイアログを表示しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M13-08-ADMIN 未設定");
      await loginAsAdmin(page);
      const deck = new M13_08AdminEventEventDeckViewPage(page);
      await deck.goto();
      await deck.seeNoModal();
    });

    test("E2E-M13-08-007 デッキ表示のGETが正常応答（HTTP 200）を返す", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M13-08-ADMIN 未設定");
      await loginAsAdmin(page);
      const deck = new M13_08AdminEventEventDeckViewPage(page);
      const res = await deck.goto();
      expect(res?.status(), "デッキ表示GETは200で応答すること").toBe(200);
    });

    // ===== 保留（要シード/要実機。抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M13-08-008 申込一覧のデッキ表示ボタン押下で別ウィンドウにデッキ表示画面が開く（要シード: SEED-M13-08-DECK）",
      async () => {
        // 期待は仕様(利用者視点の入口: 別ウィンドウ960x900でデッキ表示URLが開く)由来。
        // 申込一覧の #decklist ボタンは検索結果が無いとき JS で disabled 化される（index.twig:214-217）ため、
        // SEED-M13-08-DECK で該当デッキ・申込を投入し検索結果を持たせてから popup を検証する。
        // 手順: gotoEntryList → entryDeckButton 活性確認 → openDeckListPopup → popup の URL が DECKLIST_RE。
      }
    );

    test.fixme(
      "E2E-M13-08-009 印刷ボタン押下でブラウザの印刷ダイアログ（window.print）が開く（要実機: window.print スタブ）",
      async () => {
        // 期待は仕様(フロント挙動: 印刷ボタンは印刷ダイアログを開く)由来。
        // window.print は Playwright で直接観測できないため、addInitScript でスタブ化し呼出フラグを検証する手順を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M13-08-010 該当デッキ0件でデッキリストに何も表示されず印刷ボタンのみ（要シード: SEED-M13-08-NO-DECK）",
      async () => {
        // 期待は仕様(エッジケース: デッキ0件はデッキリストに何も表示しない・印刷ボタンのみ)由来。
        // 空表示の固定文言は設計書が規定しないためオラクル化しない（page.seeEmptyDeckList＝.wrapper 0件＋印刷ボタン表示）。
        // 申込一覧で0件になる検索条件をセッションに作る手順を整備後に実装。
      }
    );

    test.fixme(
      "E2E-M13-08-011 申込検索条件に該当するデッキが一覧に表示される（要シード: SEED-M13-08-DECK）",
      async () => {
        // 期待は仕様(集計条件: 該当デッキのデッキリスト表示)由来。
        // 該当デッキ・申込・会員・イベント詳細のシード投入と検索条件セッション整備後に実装（.wrapper 1件以上）。
      }
    );
  }
);
