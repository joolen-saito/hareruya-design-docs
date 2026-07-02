/**
 * 管理画面 デッキ管理「検索一覧からの一括編集」E2E（M15-04・未実行雛形）。
 * 納品ケース表 integration_test/e2e/m15_04_admin_deck_deck_bulk_update_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 本specには「E2E自動化」ケース（実装済み）と、自動化予定だが未実装/要実機/仕様乖離の test.fixme（理由付き）のみを残す。
 * 手動/対象外（CSRF改ざんPOST・存在しないID混在・member_id更新やタグ/画像更新のDB内部値・確認ダイアログ系・検索条件 等）は
 * ケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(functions/pf-eccube3/m15-04_admin_deck_deck_bulk_update.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * 設計はpf-eccube3(HareruyaEc)のリバース。刷新先 ec-cube-enterprise との乖離はケース表「付帯表4 不具合候補」を参照（テストは仕様どおりに書く＝落ちて検出）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の
 * spec/admin/login.spec.ts も @playwright/test を直接使う。本specも踏襲し、資格情報が無ければ走らないよう
 * test.skip(!HAS_CREDS) でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *
 * 資格情報/シード（環境変数。コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（管理者・SEED-M15-04-ADMIN）
 *  - E2E_M15_DECK_KEYWORD（一覧に1件以上ヒットする既知の検索キーワード・SEED-M15-04-DECKS。未設定時は空検索）
 *  - E2E_M15_ALLOW_WRITE=1（一括編集を実行する破壊的テスト020/021を許可・SEED-M15-04-DECKS-WRITABLE）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AdminDeckDeckBulkUpdatePage } from "../../../pages/admin/m15/m15_04_admin_deck_deck_bulk_update.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);
const DECK_KEYWORD = process.env.E2E_M15_DECK_KEYWORD || "";
const ALLOW_WRITE = process.env.E2E_M15_ALLOW_WRITE === "1";

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const SEARCH_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/deck(/search/\\d+)?(\\?|$)`);

/** 管理ログインしてデッキ一覧の検索結果（≥1件）を表示する。 */
async function loginAndSearch(page: Page): Promise<AdminDeckDeckBulkUpdatePage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const target = new AdminDeckDeckBulkUpdatePage(page);
  await target.gotoList();
  await target.search(DECK_KEYWORD || undefined);
  return target;
}

test.describe(
  "管理画面 > デッキ管理 > 検索一覧からの一括編集",
  { tag: ["@admin", "@deck"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M15-04-001 未ログインでデッキ一覧URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/deck`);
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可: 未ログインは管理ログインへ
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M15-04-002 未ログインで一括編集POSTルートへPOST→管理ログイン画面へ誘導（認証壁で未処理）", async ({ page }) => {
      // 仕様: bulk_update は POST 専用ルート。未認証POSTは CSRF/フォーム検証以前に共通の認証壁で弾かれる。
      // GET ではなく POST で到達不可を検証する（codex指摘#4: POSTルートを実POSTで確認）。
      const res = await page.request.post(`/${ECCUBE_ADMIN_ROUTE}/deck/bulk_update`, {
        failOnStatusCode: false,
      });
      await expect(res.url()).toMatch(LOGIN_RE); // リダイレクト追跡後の最終URLが管理ログイン
    });

    // ===== 一覧・パネル表示（SEED-M15-04-ADMIN ＋ SEED-M15-04-DECKS） =====

    test("E2E-M15-04-010 検索結果1件以上で一覧・行チェックボックス・一括編集ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M15-04-ADMIN 未設定（ECCUBE_ADMIN_USER/PASS）");
      const target = await loginAndSearch(page);
      await target.seeListWithBulkControls(); // 行チェック(deckId[])・「一括編集」ボタン
    });

    test("E2E-M15-04-011 「一括編集」ボタン押下で一括編集パネルが開く", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M15-04-ADMIN 未設定");
      const target = await loginAndSearch(page);
      await target.openBulkEditPanel(); // #bulk_edit_panel が表示される
    });

    test("E2E-M15-04-012 変更フラグのチェックで対応入力ブロックが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M15-04-ADMIN 未設定");
      const target = await loginAndSearch(page);
      await target.openBulkEditPanel();
      await expect(target.eventNameJp).toBeHidden(); // 初期は display:none
      await target.checkChangeFlag("eventNameJp");
      await expect(target.eventNameJp).toBeVisible(); // フラグONで表示
    });

    test("E2E-M15-04-013 表頭の全選択チェックで全行のチェックボックスが一括オンになる", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M15-04-ADMIN 未設定");
      const target = await loginAndSearch(page);
      await target.checkAll();
      const count = await target.rowCheckboxes.count();
      for (let i = 0; i < count; i++) {
        await expect(target.rowCheckboxes.nth(i)).toBeChecked();
      }
    });

    test("E2E-M15-04-014 検索結果ゼロの初期画面では一括編集パネル・ボタンが描画されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M15-04-ADMIN 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const target = new AdminDeckDeckBulkUpdatePage(page);
      await target.gotoList(); // 検索未実行の初期GET（pagination 無し）
      await expect(target.toggleBulkEditButton).toHaveCount(0); // 一括編集ボタン非描画
      await expect(target.bulkEditPanel).toHaveCount(0); // パネル非描画＝この入口からは実行不可
    });

    // ===== クライアント/サーバ バリデーション（非破壊：検証で中止/停止） =====

    test("E2E-M15-04-030 項目チェック有・入力空で実行→クライアント必須エラーで送信中止", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M15-04-ADMIN 未設定");
      const target = await loginAndSearch(page);
      await target.selectFirstRow();
      await target.openBulkEditPanel();
      await target.checkChangeFlag("eventNameJp"); // 仕様(JS挙動): フラグONで当該入力に required 付与。空のまま実行。
      await target.clickExecute();
      // 仕様オラクル: 必須未入力で送信中止＝一覧に留まる（観測可能な仕様挙動）。
      await expect(page).toHaveURL(SEARCH_RE);
      // 補助確認: 刷新先のカスタム必須エラー表示（HTML5 native でなく実装固有divのためセレクタ根拠付きの補助・要確認）。
      await expect(target.clientRequiredError).toBeVisible();
    });

    test("E2E-M15-04-031 変更フラグを1つも付けずに実行→クライアントがアラートで送信ブロック", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M15-04-ADMIN 未設定");
      const target = await loginAndSearch(page);
      await target.selectFirstRow();
      await target.openBulkEditPanel(); // 変更フラグはすべてOFF
      // 仕様(エッジケース): 変更フラグ0件はクライアント「一括編集実行」でブロックされる。
      // アラート文言「変更されている項目がありません。」は設計書(JS挙動)由来の仕様オラクル。
      let dialogMsg = "";
      page.on("dialog", async (d) => {
        dialogMsg = d.message();
        await d.dismiss();
      });
      await target.clickExecute();
      await expect.poll(() => dialogMsg).toContain("変更されている項目がありません");
      await expect(page).toHaveURL(SEARCH_RE); // 送信されず一覧に留まる
      // 注: 刷新先JSは当該ブロックを持たず送信→一覧リダイレクトし得る＝不具合候補#6で落ちて検出。
    });

    test("E2E-M15-04-032 変更フラグはONだがデッキ未選択(0件)で実行→クライアントがアラートで送信ブロック", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M15-04-ADMIN 未設定");
      const target = await loginAndSearch(page);
      // 仕様(JS挙動 m15-04.md:39): クライアントは順に[変更フラグ0件]→[デッキ0件]を判定する。
      // 変更フラグ0件ブロックを先に通すため、フラグON＋値入力を行い、行チェックは一切付けない。
      await target.openBulkEditPanel();
      await target.checkChangeFlag("eventNameJp");
      await target.eventNameJp.fill("x"); // 必須チェックも通過させ、デッキ未選択ブロックへ到達させる
      let dialogMsg = "";
      page.on("dialog", async (d) => {
        dialogMsg = d.message();
        await d.dismiss();
      });
      await target.clickExecute();
      // アラート文言「一括編集するデッキをひとつ以上選択してください。」は設計書(JS挙動)由来の仕様オラクル。
      await expect.poll(() => dialogMsg).toContain("一括編集するデッキをひとつ以上選択してください");
      await expect(page).toHaveURL(SEARCH_RE); // 送信されず一覧に留まる
      // 注: 刷新先JSは当該ブロックを持たない可能性＝不具合候補#6で落ちて検出。
    });

    test("E2E-M15-04-040 順位に1未満(0)を入力して実行→検証エラーで一覧へ戻り更新されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M15-04-ADMIN 未設定");
      const target = await loginAndSearch(page);
      await target.selectFirstRow();
      await target.openBulkEditPanel();
      await target.checkChangeFlag("ranking");
      await target.ranking.fill("0"); // 仕様: 順位は1超 99999999以下 → 0は不正
      await target.clickExecute();
      // 仕様: フォーム検証失敗でエラーフラッシュ＋検索一覧へリダイレクト（更新されない）。
      await expect(page).toHaveURL(SEARCH_RE);
      await expect(target.errorAlert).toBeVisible(); // エラーフラッシュ（.alert-danger 要実機確認）
    });

    // ===== 破壊的（一括編集を実際に実行：SEED-M15-04-DECKS-WRITABLE・要 E2E_M15_ALLOW_WRITE=1） =====

    test("E2E-M15-04-020 デッキ選択＋項目チェック＋値入力で一括編集実行→成功フラッシュ表示", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M15-04-ADMIN 未設定");
      test.skip(!ALLOW_WRITE, "破壊的テスト。E2E_M15_ALLOW_WRITE=1 と SEED-M15-04-DECKS-WRITABLE が必要");
      const target = await loginAndSearch(page);
      await target.selectFirstRow();
      await target.openBulkEditPanel();
      await target.checkChangeFlag("eventNameJp");
      await target.eventNameJp.fill(`E2E更新_${Date.now()}`);
      await target.clickExecute();
      // 仕様: 成功フラッシュが積まれる（文言/キー admin.register.complete は実装依存のためオラクル化しない）。
      // 成功種別を独立判定し、エラーalertでの誤検知を排除する（codex指摘#8）。
      await expect(page.locator(".alert-success")).toBeVisible();
      await expect(target.errorAlert).toBeHidden();
    });

    test("E2E-M15-04-021 一括編集成功後は検索一覧（直前一覧）へ戻る", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M15-04-ADMIN 未設定");
      test.skip(!ALLOW_WRITE, "破壊的テスト。E2E_M15_ALLOW_WRITE=1 と SEED-M15-04-DECKS-WRITABLE が必要");
      const target = await loginAndSearch(page);
      await target.selectFirstRow();
      await target.openBulkEditPanel();
      await target.checkChangeFlag("eventNameJp");
      await target.eventNameJp.fill(`E2E更新_${Date.now()}`);
      await target.clickExecute();
      await expect(page).toHaveURL(SEARCH_RE); // 検索一覧へリダイレクト
    });

    test("E2E-M15-04-051 イベント名(日)50文字ちょうどで一括編集実行→正常更新（最大長境界の正常系）", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M15-04-ADMIN 未設定");
      test.skip(!ALLOW_WRITE, "破壊的テスト。E2E_M15_ALLOW_WRITE=1 と SEED-M15-04-DECKS-WRITABLE が必要");
      const target = await loginAndSearch(page);
      await target.selectFirstRow();
      await target.openBulkEditPanel();
      await target.checkChangeFlag("eventNameJp");
      // 仕様(入力項目: イベント名(日) 最大50文字)由来。上限ちょうどは検証を通過し更新される（050=51文字異常系の対）。
      await target.eventNameJp.fill("あ".repeat(50));
      await target.clickExecute();
      await expect(page.locator(".alert-success")).toBeVisible(); // 成功フラッシュ（文言はオラクル化しない）
      await expect(target.errorAlert).toBeHidden();
    });

    // ===== 保留（仕様乖離/crafted/要実機確認。手動・対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M15-04-022 一括編集実行のクライアント検証通過後に送信前confirm「一括編集の内容を送信しますか？」が表示される（刷新先JSにconfirm不在＝不具合候補#6・要実機確認）",
      async () => {
        // 期待は仕様(JS挙動 m15-04.md:39: フォームsubmitに確認「一括編集の内容を送信しますか？」を紐付け)由来。
        // 刷新先JSは当該confirmを持たないため実装どおりだと表示されず＝落ちて検出。
        // 正常系confirmの観測には dialog ハンドラで confirm 種別とメッセージを検証する想定（実機確認後に実装）。
      }
    );

    test.fixme(
      "E2E-M15-04-041 順位 上限超過(99999999超)→検証エラー（刷新先に上限制約なし＝不具合候補#2・要実機確認）",
      async () => {
        // 期待は仕様(入力項目: 順位 1超 99999999以下)由来。刷新先 Form は GreaterThan(0) のみで上限が無いため
        // 実装どおりだと検証を通過し得る＝落ちて検出する想定。破壊的なため WRITABLE シードと許可フラグ確定後に実装。
      }
    );

    test.fixme(
      "E2E-M15-04-050 イベント名(日) 51文字→文字列長検証エラー（刷新先 max=255＝不具合候補#3・要実機確認）",
      async () => {
        // 期待は仕様(イベント名(日) 最大50文字)由来。刷新先 Form は max=255 のため実装どおりだと通過し得る＝落ちて検出。
      }
    );

    test.fixme(
      "E2E-M15-04-060 CSRFトークン不正の一括編集POST→アクセス拒否（crafted POST要・刷新先は403でなくredirect＝不具合候補#5）",
      async () => {
        // 期待は仕様(判定順序#1: CSRF無効はアクセス拒否)由来。正規UI操作ではトークンが常に有効なため、
        // _token を改ざん/除去した POST を request.post 等で組み立てて検証する（実機確認後に実装）。
      }
    );

    test.fixme(
      "E2E-M15-04-070 deckId に非数字を含めてPOST→HTTP404（crafted POST要・刷新先は正規表現検査なし＝不具合候補#4）",
      async () => {
        // 期待は仕様(判定順序#3: 各deckIdは ^\\d+$、1件でも不正なら404)由来。行チェックは数値IDのみ送出するため
        // deckId[]=非数字を含む POST を手組みして 404 を確認する（実機確認後に実装）。
      }
    );

    test.fixme(
      "E2E-M15-04-080 存在ID＋非存在deckId混在で実行→取得できた行のみ更新（crafted・破壊的・刷新先は404throw＝不具合候補#1）",
      async () => {
        // 期待は仕様(エッジケース: 存在しないIDはエラーにせず取得行のみ更新)由来。刷新先 Action は null で404throw のため
        // 実装どおりだと404＝落ちて検出する想定。SEED-M15-04-DECKS-WRITABLE と非存在IDの手組みPOSTで実装。
      }
    );

    test.fixme(
      "E2E-M15-04-090 勝/敗/分・DCIナンバーの変更フラグ・入力欄が存在する（刷新先フォーム不在＝不具合候補#7・落ちて検出）",
      async () => {
        // 期待は仕様(変更対象列に winCount/lossCount/drawCount/dciNo を含む・入力項目表 m15-04.md:86,107-110)由来。
        // 刷新先 DeckBulkUpdateType に当該項目が無く change_flgs[winCount] 等／#admin_deck_bulk_update_winCount は描画されないため、
        // 当該UIの存在アサーションは実装どおりだと不在＝落ちて検出する（項目欠落の検出）。要実機確認。
        // 例: await expect(target.changeFlag("winCount")).toHaveCount(1) 等を各列で検証する想定。
      }
    );
  }
);
