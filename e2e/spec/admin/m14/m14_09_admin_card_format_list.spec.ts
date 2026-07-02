/**
 * 管理画面 カード管理 > フォーマット一覧 E2E。
 * 納品ケース表 integration_test/e2e/m14_09_admin_card_format_list_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケース（実装済み）と、自動化予定だが未実装/要シード・要実機・仕様乖離検出の test.fixme のみを残す。
 * 手動/間接・対象外はケース表で全量管理し、specに大量のfixmeを残さない。
 * 期待結果は仕様（正本 functions/pf-eccube3/m14-09_admin_card_format_list.md / 観点表）由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 重要（設計源と刷新先の乖離・付帯表4）: 設計書は pf-eccube3 / HareruyaEc プラグインのリバース。刷新先 ec-cube-enterprise は
 *  - 削除がアンカー直接送信ではなく Bootstrap モーダル(#DeleteModal)経由（一覧テンプレートに javascript ブロックとモーダルが存在＝設計と乖離 #2/#3）。
 *  - 削除ルートが `DELETE /{admin_route}/product/format/{id}/delete`（設計 /format/{id}/delete と乖離 #4）。
 *  - フォーマット名セルが素テキストで、編集は鉛筆アイコン a.action-edit（設計の名称リンクと乖離 #5）。
 *  - 削除拒否時の遷移先が一覧（設計の Referer と乖離 #6）／エラーメッセージが3キー（設計の単一キーと乖離 #7）。
 *  - 設計の format.css 読込なし（#8）。
 * テストは主観測（一覧表示・遷移URL・削除可否）で乖離の影響を避けつつ仕様どおりに書き、該当ケースは要確認として可視化する。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の
 * spec/admin/login.spec.ts・two_factor_auth.spec.ts・m13 系も @playwright/test を直接使う。本specもこれに倣い
 * @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針:
 *  - ログイン要ケースは ECCUBE_ADMIN_USER/PASS（SEED-M14-09-ADMIN）が無いと走らないよう test.skip でガード。
 *  - 一覧に≥1件のフォーマットが必要なケースは SEED_M14_FORMATS=1 を前提（無ければ skip）。
 *  - 削除成功/拒否/404 は破壊的・関連データ依存のため test.fixme（SEED-M14-09-DELETABLE / SEED-M14-09-LINKED 整備後に実装）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { CardFormatListPage } from "../../../pages/admin/m14/m14_09_admin_card_format_list.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// 一覧に≥1件のフォーマットが投入済みのとき true（データ行・編集/削除アイコンが描画される前提）。
const HAS_FORMATS = process.env.SEED_M14_FORMATS === "1";

const LOGIN_RE = /\/login(\?|$)/;
const FORMAT_LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/format(\\?|$)`);
const FORMAT_NEW_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/format/new(\\?|$)`);
const FORMAT_EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/format/\\d+/edit(\\?|$)`);

/** 管理者ログインしてフォーマット一覧を閲覧できる状態にする（SEED-M14-09-ADMIN は2FA OFF前提）。 */
async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).not.toHaveURL(LOGIN_RE); // ログイン成功でログイン画面から離脱
}

test.describe("管理画面 > フォーマット一覧", { tag: ["@admin", "@card", "@format"] }, () => {
  // ===== 認証不要・非破壊（常時実行可） =====

  test("E2E-M14-09-030 未ログインでフォーマット一覧URL→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/format`);
    await expect(page).toHaveURL(LOGIN_RE); // 画面遷移: 未認証は管理ログインURLへ誘導（仕様: 権限・認可）
    await expect(page.locator("#login_id")).toBeVisible(); // 権限・認可: ログイン画面の表示
  });

  // ===== ログイン要・非破壊（SEED-M14-09-ADMIN） =====

  test("E2E-M14-09-001 一覧画面にタイトル・テーブル・新規登録ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M14-09-ADMIN）");
    await login(page);
    const list = new CardFormatListPage(page);
    await list.goto();
    await list.seeListBasics(); // フロント挙動（表示要素）。タイトル文言の乖離は付帯表4#1
  });

  test("E2E-M14-09-002 一覧テーブルの見出しが「フォーマット名」「略称」「認定」である", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new CardFormatListPage(page);
    await list.goto();
    await list.seeTableHeaders();
  });

  test("E2E-M14-09-003 サブタイトル右の「新規登録」ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new CardFormatListPage(page);
    await list.goto();
    await expect(list.newButton).toBeVisible(); // UI部品（IT-25）
  });

  test("E2E-M14-09-010 「新規登録」押下で登録フォーム画面（/format/new）へ遷移する", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new CardFormatListPage(page);
    await list.goto();
    await list.newButton.click();
    await expect(page).toHaveURL(FORMAT_NEW_RE); // 画面遷移（設計: 新規登録→登録フォーム）
  });

  test("E2E-M14-09-011 編集導線押下で当該フォーマットの編集画面（/format/{id}/edit）へ遷移する", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(!HAS_FORMATS, "SEED_M14_FORMATS=1 未設定（一覧に≥1件必要）");
    await login(page);
    const list = new CardFormatListPage(page);
    await list.goto();
    // 設計は「フォーマット名リンク」。刷新先は素テキスト＋鉛筆アイコン a.action-edit（付帯表4#5）。
    await list.clickFirstEdit();
    await expect(page).toHaveURL(FORMAT_EDIT_RE);
  });

  test("E2E-M14-09-012 削除導線押下で削除確認が提示される（刷新先はモーダル方式）", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(!HAS_FORMATS, "SEED_M14_FORMATS=1 未設定（一覧に≥1件必要）");
    await login(page);
    const list = new CardFormatListPage(page);
    await list.goto();
    // 設計はアンカー直接(data-method=delete)。刷新先はモーダル#DeleteModalを開く（付帯表4#2/#3、CSRF付きアンカーは delete_modal.twig:21）。
    await list.openFirstDeleteModal();
    await expect(list.deleteModal).toBeVisible();
    await expect(list.modalDeleteAnchor).toBeVisible(); // CSRF付き削除アンカーが提示される
  });

  // ===== 自動化予定だが未実装/要シード・要実機・仕様乖離検出（fixme・抜け漏れ可視化） =====

  test.fixme(
    "E2E-M14-09-020 一覧は rank昇順・id昇順で並ぶ（要: 既知ソート順シード SEED-M14-09-ORDER）",
    async () => {
      // 期待は仕様(業務ルール・計算: 第一キー rank ASC, 第二キー id ASC)由来。既知順序のシード投入後に行テキスト順を検証。
    }
  );

  test.fixme(
    "E2E-M14-09-021 認定IDがNULLの行は認定列が空表示（要: cert無/有の両シード SEED-M14-09-CERT）",
    async () => {
      // 期待は仕様(フロント挙動: certificationId が非NULLのときのみ和名/英名、NULLは空)由来。
    }
  );

  test.fixme(
    "E2E-M14-09-040 関連データ無しフォーマット削除→成功し一覧へ戻る（破壊的・要 SEED-M14-09-DELETABLE）",
    async () => {
      // 期待は仕様(処理フロー: 関連が空なら削除しフラッシュ＋一覧へ)由来。刷新先は admin.common.delete_complete「削除しました」＋ admin_format_list。
      // 破壊的のため使い捨てフォーマットを投入し、削除モーダル→実行アンカー押下、一覧URL復帰と成功フラッシュを確認。
    }
  );

  test.fixme(
    "E2E-M14-09-041 関連データ有りフォーマット削除→拒否されエラーが表示される（要 SEED-M14-09-LINKED）",
    async () => {
      // 期待は仕様(エラー処理: イベント/デッキ/アーキタイプ紐づきで削除拒否＋フラッシュ)由来。
      // 設計は Referer へ戻る／単一キー。刷新先は一覧へ戻り3キー(messages.ja.yaml:4027-4029)（付帯表4#6/#7・要確認）。
    }
  );

  test.fixme(
    "E2E-M14-09-042 存在しないIDの削除要求→HTTP 404（DELETEメソッド・要実機）",
    async () => {
      // 期待は仕様(エラー処理: 削除対象が存在しなければ404)由来。UIからはモーダルアンカー(DELETE)経由のため、メソッドオーバーライド送信の発火確認は要実機。
    }
  );

  test.fixme(
    "E2E-M14-09-043 無効CSRFトークンの削除要求→削除されず共通CSRFエラー処理（手動/要実機）",
    async () => {
      // 期待は仕様(権限・認可/エラー処理: CSRF検証失敗時は削除されず管理画面共通のCSRFエラー処理)由来。
      // 結果(未削除・共通エラー)はブラウザ観測可能だが、UIからのトークン改ざん送信は要実機（メソッドオーバーライド＋不正トークンのDELETE送信）。
      // CSRFトークン名・属性名など実装固有値はオラクル化しない（観測対象は「削除されないこと」と共通エラー処理）。
    }
  );

  test.fixme(
    "E2E-M14-09-022 フォーマット0件でも表ヘッダ表示・データ行0（空tbody）（要 SEED-M14-09-EMPTY）",
    async () => {
      // 期待は仕様(処理フロー: 0件でも表ヘッダは表示・データ行は出力されない＝空のtbody)由来。
      // 0件環境のシード整備後、見出し(フォーマット名/略称/認定)の表示と tbody tr 件数0を検証。
    }
  );

  test.fixme(
    "E2E-M14-09-023 認定ID非NULLの行は認定列に和名/英名が「 / 」区切りで表示（要 SEED-M14-09-CERT）",
    async () => {
      // 期待は仕様(フロント挙動/データ整合性: certificationId 非NULL時のみ認定マスタの和名/英名を「 / 」区切りで表示)由来。
      // E2E-021(NULL空表示)の正常系対。具体の認定名はシード既知値で照合（実装文言はオラクル化しない）。
    }
  );

  test.fixme(
    "E2E-M14-09-024 論理削除済み(deleted_at)フォーマットは一覧に表示されない（要 SEED-M14-09-SOFTDEL）",
    async () => {
      // 期待は仕様(処理フロー: 論理削除済み行を除外 / データ整合性: deleted_at ソフト削除)由来。
      // deleted_at 設定済み行と通常行を投入し、論理削除済みフォーマットが一覧 tbody に現れないことを検証。
    }
  );

  test.fixme(
    "E2E-M14-09-031 未ログインで削除要求(DELETE)→管理ログイン画面へ誘導（要実機・DELETEメソッド送信）",
    async () => {
      // 期待は仕様(権限・認可: 未認証の削除もログイン要求に帰着)由来。E2E-030(未認証GET)のDELETE対。
      // UIからのDELETEメソッド送信は要実機（メソッドオーバーライド）。観測対象は削除されないこととログイン画面誘導。
    }
  );
});
