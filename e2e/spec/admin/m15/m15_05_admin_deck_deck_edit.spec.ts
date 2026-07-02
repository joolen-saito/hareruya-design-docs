/**
 * 管理画面 デッキ管理（新規登録・編集・削除・複製）E2E。
 * 納品ケース表 integration_test/e2e/m15_05_admin_deck_deck_edit_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」かつ非破壊で安全に実行できるケースを test として実装し、破壊的（DB更新/新規/複製/削除）や
 * 専用シードが必要なケースは test.fixme（理由付き）で抜け漏れを可視化する。手動/間接・対象外はケース表で全量管理し、
 * specに大量のfixmeを残さない（規約準拠）。
 * 期待結果は仕様(設計書 functions/pf-eccube3/m15-05_admin_deck_deck_edit.md / 観点表 / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約値（max/min/Length/NotBlank）を期待値に流用しない。
 * 本設計書は現行 pf-eccube3 のリバースであり、刷新先 ec-cube-enterprise とのルート・文言・項目の乖離はケース表 付帯表4 に分離する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も @playwright/test を
 * 直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 *
 * シード（環境変数。コミットしない）:
 *  - DECK_ID       : SEED-M15-05-DECK（編集表示・非破壊検証用の既存デッキID。記事非参照）
 *  - DECK_DEL_ID   : SEED-M15-05-DECK-DEL（削除可能・使い捨てデッキID）
 *  - DECK_USED_ID  : SEED-M15-05-DECK-USED（記事参照中で削除中止になるデッキID）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { DeckDeckEditPage } from "../../../pages/admin/m15/m15_05_admin_deck_deck_edit.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const DECK_ID = process.env.DECK_ID || "";
const HAS_DECK = HAS_CREDS && !!DECK_ID;

// 正規表現メタ文字を含み得る環境可変値（ECCUBE_ADMIN_ROUTE）を安全にURLアサーションへ埋め込む。
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// オラクル独立性: 上位オラクルは設計書ルート「対象デッキの編集画面 /{admin}/deck/{id}」（付帯表4#1）。
// 実装は末尾 /edit が付くため、末尾 /edit は任意一致として許容し、実装ルート文字列を期待値に固定しない。
const EDIT_RE = (id: string | number) =>
  new RegExp(`/${escapeRe(ECCUBE_ADMIN_ROUTE)}/deck/${id}(/edit)?(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;

async function adminLogin(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 > デッキ管理（新規登録・編集・削除・複製）",
  { tag: ["@admin", "@deck"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M15-05-050 未認証で編集URL直接→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/deck/1/edit`);
      await expect(page.locator("#login_id")).toBeVisible();
      await expect(page).toHaveURL(LOGIN_RE);
    });

    test("E2E-M15-05-052 未認証で新規登録URL直接→管理ログイン画面へ誘導", async ({ page }) => {
      // 権限・認可: 新規GET入口の未認証ガード（設計書「権限・認可：ログイン済み管理のみ」）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/deck/new`);
      await expect(page.locator("#login_id")).toBeVisible();
      await expect(page).toHaveURL(LOGIN_RE);
    });

    // ===== ログイン必須・非破壊（存在しないID／表示確認） =====

    test("E2E-M15-05-051 存在しないデッキIDの編集URLは404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/deck/99999999/edit`);
      expect(res?.status()).toBe(404); // 処理フロー: 行未取得で404
    });

    test("E2E-M15-05-008 新規登録画面が空フォームで表示され削除ブロックが表示されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const deck = new DeckDeckEditPage(page);
      await deck.gotoNew();
      // 処理フロー(新規入力画面表示)：`id`未設定の空フォーム。削除/複製モーダルは既存ID時のみ表示するブロック。
      await expect(deck.deckName).toBeVisible();
      await expect(deck.deleteButton).toHaveCount(0); // id未設定＝削除ブロック非表示
    });

    test("E2E-M15-05-001 編集画面が開きタイトル「デッキ管理」「デッキ編集」が表示される", async ({ page }) => {
      test.skip(!HAS_DECK, "SEED-M15-05-DECK 未設定（DECK_ID）");
      await adminLogin(page);
      const deck = new DeckDeckEditPage(page);
      await deck.gotoEdit(DECK_ID);
      // 設計書(フロント挙動)：タイトル「デッキ管理」・サブタイトル「デッキ編集」。実装は表示位置が逆のため
      // 両文言の存在で判定（不具合候補#2・順序非依存）。
      await expect(page.locator("body")).toContainText("デッキ管理");
      await expect(page.locator("body")).toContainText("デッキ編集");
    });

    test("E2E-M15-05-002 編集画面にデッキ名入力欄が表示される", async ({ page }) => {
      test.skip(!HAS_DECK, "SEED-M15-05-DECK 未設定");
      await adminLogin(page);
      const deck = new DeckDeckEditPage(page);
      await deck.gotoEdit(DECK_ID);
      await expect(deck.deckName).toBeVisible();
    });

    test("E2E-M15-05-003 代表カード画像の隠しID欄と選択ボタンが存在する", async ({ page }) => {
      test.skip(!HAS_DECK, "SEED-M15-05-DECK 未設定");
      await adminLogin(page);
      const deck = new DeckDeckEditPage(page);
      await deck.gotoEdit(DECK_ID);
      await expect(deck.cardImageId).toHaveCount(1); // hidden（number widget）
      // ケース表は「代表カード選択ボタン」も期待（edit.twig:181）。
      await expect(deck.cardImageSelectButton).toBeVisible();
    });

    test("E2E-M15-05-004 プレイヤー検索ボタン・クリアボタンが表示される", async ({ page }) => {
      test.skip(!HAS_DECK, "SEED-M15-05-DECK 未設定");
      await adminLogin(page);
      const deck = new DeckDeckEditPage(page);
      await deck.gotoEdit(DECK_ID);
      // ケース表は検索ボタン（edit.twig:207）とクリアボタン（:208）の双方を期待。
      await expect(deck.playerSearchButton).toBeVisible();
      await expect(deck.clearPlayerButton).toBeVisible();
    });

    test("E2E-M15-05-005 統率・メイン・サイドのリスト入力欄が表示される", async ({ page }) => {
      test.skip(!HAS_DECK, "SEED-M15-05-DECK 未設定");
      await adminLogin(page);
      const deck = new DeckDeckEditPage(page);
      await deck.gotoEdit(DECK_ID);
      await deck.seeEditForm();
    });

    test("E2E-M15-05-006 複製モーダルに回数入力欄・複製保存・複製新規が表示される", async ({ page }) => {
      test.skip(!HAS_DECK, "SEED-M15-05-DECK 未設定");
      await adminLogin(page);
      const deck = new DeckDeckEditPage(page);
      await deck.gotoEdit(DECK_ID);
      await deck.openCopyModal();
      await expect(deck.copyCount).toBeVisible();
      await expect(deck.copySaveButton).toBeVisible();
      await expect(deck.copyNewLink).toBeVisible();
    });

    test("E2E-M15-05-007 削除ボタン押下で確認ダイアログが表示されキャンセルで削除されない", async ({ page }) => {
      test.skip(!HAS_DECK, "SEED-M15-05-DECK 未設定");
      await adminLogin(page);
      const deck = new DeckDeckEditPage(page);
      await deck.gotoEdit(DECK_ID);
      let dialogShown = false;
      page.once("dialog", async (d) => {
        dialogShown = true;
        await d.dismiss(); // キャンセル＝削除しない
      });
      await deck.deleteButton.click();
      await expect.poll(() => dialogShown).toBe(true);
      await expect(page).toHaveURL(EDIT_RE(DECK_ID)); // 滞留（削除されない）
    });

    // ===== バリデーション異常系（送信は失敗し再描画＝非破壊） =====

    test("E2E-M15-05-020 リスト行フォーマット不正→エラーで編集画面に滞留", async ({ page }) => {
      test.skip(!HAS_DECK, "SEED-M15-05-DECK 未設定");
      await adminLogin(page);
      const deck = new DeckDeckEditPage(page);
      await deck.gotoEdit(DECK_ID);
      await deck.textMain.fill("これは数量行ではない不正な行");
      await deck.updateButton.click();
      await expect(page).toHaveURL(EDIT_RE(DECK_ID)); // 判定順序#2: 送信中止で再表示
      await expect(deck.flashSuccess).toHaveCount(0); // 成功にはならない
      // 期待は仕様「行フォーマット不正のエラー表示」。沈黙再描画/別エラーで通らないようエラー表示を主観測。
      await expect(deck.validationError.first()).toBeVisible();
    });

    test("E2E-M15-05-023 デッキ名が最大長+1（256文字）→長さエラーで滞留", async ({ page }) => {
      test.skip(!HAS_DECK, "SEED-M15-05-DECK 未設定");
      await adminLogin(page);
      const deck = new DeckDeckEditPage(page);
      await deck.gotoEdit(DECK_ID);
      await deck.deckName.fill("あ".repeat(256)); // 仕様(最大長255)由来の境界外
      await deck.updateButton.click();
      await expect(page).toHaveURL(EDIT_RE(DECK_ID));
      await expect(deck.flashSuccess).toHaveCount(0);
      // 期待は仕様「文字列長エラー表示で滞留」。エラー表示を主観測（沈黙再描画を排除）。
      await expect(deck.validationError.first()).toBeVisible();
    });

    test("E2E-M15-05-024 順位に0を入力→数値エラーで滞留", async ({ page }) => {
      test.skip(!HAS_DECK, "SEED-M15-05-DECK 未設定");
      await adminLogin(page);
      const deck = new DeckDeckEditPage(page);
      await deck.gotoEdit(DECK_ID);
      await deck.ranking.fill("0"); // 仕様(1以上)由来の範囲外
      await deck.updateButton.click();
      await expect(page).toHaveURL(EDIT_RE(DECK_ID));
      await expect(deck.flashSuccess).toHaveCount(0);
      // 期待は仕様「順位の数値エラー表示で滞留」。エラー表示を主観測（沈黙再描画を排除）。
      await expect(deck.validationError.first()).toBeVisible();
    });

    test("E2E-M15-05-026 大会参加人数に0を入力→数値エラーで滞留", async ({ page }) => {
      test.skip(!HAS_DECK, "SEED-M15-05-DECK 未設定");
      await adminLogin(page);
      const deck = new DeckDeckEditPage(page);
      await deck.gotoEdit(DECK_ID);
      await deck.participants.fill("0"); // 仕様(1以上)由来の範囲外
      await deck.updateButton.click();
      await expect(page).toHaveURL(EDIT_RE(DECK_ID));
      await expect(deck.flashSuccess).toHaveCount(0);
      // 期待は仕様「参加人数の数値エラー表示で滞留」。エラー表示を主観測（沈黙再描画を排除）。
      await expect(deck.validationError.first()).toBeVisible();
    });

    // ===== 破壊的／専用シード（理由付きで未実行・抜け漏れ可視化） =====

    test.fixme(
      "E2E-M15-05-021 公開かつイベント種別でイベント名未入力→必須エラーで滞留（要実機確認・前提条件成立）",
      async () => {
        // 期待は仕様(RequireWhenDisplayed：公開かつイベント種別でイベント名必須)由来。
        // 前提「公開状態=公開・デッキ種別=イベント」を満たさないと正常更新となりDB変更し得る（誤合格回避）。
        // 公開状態(#admin_deck_Disp)・デッキ種別(#admin_deck_DeckType)の選択肢値は要実機確認のため、
        // 前提を確実に成立させた上でイベント名空送信→必須エラー表示(validationError)＋編集URL滞留で実装する。
      }
    );

    test.fixme(
      "E2E-M15-05-027 公開かつイベント種別でイベント名EN未入力→必須エラーで滞留（要前提・要実機）",
      async () => {
        // 期待は仕様(RequireWhenDisplayed：公開かつイベント種別でイベント名EN必須)由来。
        // 公開状態(#admin_deck_Disp)・デッキ種別(#admin_deck_DeckType)の選択肢値を実機確認し前提成立後、
        // eventNameEn 空送信→必須エラー(validationError)＋編集URL滞留で実装する。
      }
    );

    test.fixme(
      "E2E-M15-05-028 公開かつイベント種別で大会開催日時未入力→必須エラーで滞留（要前提・要実機）",
      async () => {
        // 期待は仕様(RequireWhenDisplayed：公開かつイベント種別で大会開催日時必須)由来。
        // 前提成立後、eventDate 空送信→必須エラー＋編集URL滞留で実装する。
      }
    );

    test.fixme(
      "E2E-M15-05-033 複製回数が上限超→エラーで複製されず編集URLへ戻る（要実機上限値）",
      async () => {
        // 期待は仕様(回数は1以上 deck.copy_max 以下・範囲外で複製不可)由来。
        // 上限値は実装で乖離（付帯表4#3）のため実機確認のうえ上限+1で送信し、alert-danger＋編集URL戻りを観測する。
      }
    );

    test.fixme(
      "E2E-M15-05-042 存在しないデッキIDの削除→対象未取得で中止（404相当・破壊的経路）",
      async () => {
        // 期待は仕様(処理フロー単体削除#4：モデル未取得なら404)由来。削除POST/DELETEを発火するため
        // 専用検証として実機確認のうえ実装する（存在IDを誤って消さないよう不存在IDに限定）。
      }
    );

    test.fixme(
      "E2E-M15-05-053 削除後 page_no 保持時は一覧検索URLへ遷移（要セッション準備・破壊的）",
      async () => {
        // 期待は仕様(処理フロー単体削除#7：page_no があれば一覧検索URLへ)由来。
        // 一覧でページ送りしセッション admin.deck.search.page_no を保持→使い捨てデッキ削除で遷移先を観測する。
      }
    );

    test.fixme(
      "E2E-M15-05-010/011 既存デッキ更新成功→成功フラッシュ＋同一編集URL（破壊的・要DB復元）",
      async () => {
        // 期待は仕様(処理フロー 更新→成功→編集URL)由来。共有環境でDBを変更するため使い捨て/復元シード確立後に実装。
      }
    );

    test.fixme(
      "E2E-M15-05-012 新規登録成功→発番後の編集URLへ遷移（破壊的・要マスタシード）",
      async () => {
        // 期待は仕様(処理フロー 新規→発番→編集URL)由来。SEED-M15-05-MASTER の選択肢特定後に実装。
      }
    );

    test.fixme(
      "E2E-M15-05-022 デッキ名255文字で更新継続（破壊的・正常境界）",
      async () => {
        // 期待は仕様(最大長255以内は継続)由来。更新を伴うため復元シード確立後に実装。
      }
    );

    test.fixme(
      "E2E-M15-05-025 順位に正の整数で更新継続（破壊的・正常境界）",
      async () => {
        // 期待は仕様(1以上は継続)由来。更新を伴うため復元シード確立後に実装。
      }
    );

    test.fixme(
      "E2E-M15-05-030 複製保存（回数1）成功→元編集URLへ302（破壊的・複製レコード生成）",
      async () => {
        // 期待は仕様(複製保存→編集URLへ戻る)由来。生成レコードの後始末確立後に実装。
      }
    );

    test.fixme(
      "E2E-M15-05-031 複製回数0→エラーで複製されず編集URLへ戻る（要モーダル数値制御の実機確認）",
      async () => {
        // 期待は仕様(回数不備でエラー戻り)由来。HTML number の min による入力制御を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M15-05-032 複製新規→元データ初期値の新規送信フォーム（GET duplicate）",
      async () => {
        // 期待は仕様(複製入力用新規)由来。初期値の照合方法を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M15-05-040 削除成功→成功フラッシュ＋一覧へ（破壊的・使い捨てDECK_DEL_ID）",
      async () => {
        // 期待は仕様(削除→一覧)由来。confirm承認で削除されるため使い捨てシードで実装。
      }
    );

    test.fixme(
      "E2E-M15-05-041 記事参照中デッキ削除→エラーで中止（要記事参照シードDECK_USED_ID）",
      async () => {
        // 期待は仕様(記事使用中で削除中止)由来。戻り先はReferer→編集URLに乖離（不具合候補#8）。
      }
    );
  }
);
