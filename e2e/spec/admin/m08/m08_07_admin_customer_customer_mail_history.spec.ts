/**
 * 管理画面 会員管理 メール送信履歴（M08-07）E2E。納品ケース表
 * integration_test/e2e/m08_07_admin_customer_customer_mail_history_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、要データ十分性・要実機確認は test.fixme（理由付き）で残す。
 * 手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/pf-eccube3/m08-07_admin_customer_customer_mail_history.md / 観点表)の挙動由来（オラクル独立性）。
 * pf-eccube3(HareruyaEcプラグイン)由来設計だが、刷新先 ec-cube-enterprise に同一画面
 * (route admin_customer_mail_history)が実在するためE2E化した。
 * 表示文言のうち i18n リソース(messages.ja.yaml)由来の語はオラクルにせず、設計書が明記する挙動・観測で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・m07/*.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報・シードが無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *
 * シード/環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン
 *  - SEED-M08-07-MAILHIST: M08_07_CUSTOMER_ID（履歴のある会員）／M08_07_TEMPLATE_ID（該当履歴を持つテンプレ）
 *                          ／M08_07_TEMPLATE_ID_UNUSED（当該会員が未使用のテンプレ）
 *  - M08_07_CUSTOMER_ID_ABSENT: 存在しない会員ID（既定 99999999）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { CustomerCustomerMailHistoryPage } from "../../../pages/admin/m08/m08_07_admin_customer_customer_mail_history.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// SEED-M08-07-MAILHIST: 履歴のある会員と、該当/未使用テンプレートID。
const CUSTOMER_ID = process.env.M08_07_CUSTOMER_ID || "";
const TEMPLATE_ID = process.env.M08_07_TEMPLATE_ID || "";
const TEMPLATE_ID_UNUSED = process.env.M08_07_TEMPLATE_ID_UNUSED || "";
const HAS_SEED = HAS_CREDS && !!CUSTOMER_ID;
const ABSENT_ID = process.env.M08_07_CUSTOMER_ID_ABSENT || "99999999";
// SEED-M08-07-NOHIST: 履歴0件の会員（検索結果0件の正常空表示用）。
const CUSTOMER_ID_NOHIST = process.env.M08_07_CUSTOMER_ID_NOHIST || "";
// 値整合（E2E-017）: 当該会員の履歴に含まれる既知の件名（シード投入値＝自前データ）。
const KNOWN_SUBJECT = process.env.M08_07_KNOWN_SUBJECT || "";
// 非数値の会員ID（route id=\d+ 制約外）。固定値で十分（DB不要）。
const NON_NUMERIC_ID = "abc";
// 存在しない/不正なテンプレートID（DB相関の不正値）。固定値で十分。
const INVALID_TEMPLATE_ID = "999999999";

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const HISTORY_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/customer/mail/\\d+/history`);
const EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/customer/\\d+/edit(\\?|$)`);
// 絞り込みGETクエリ名（form GET・prefix admin_customer_mail_history）。
const TEMPLATE_PARAM = "admin_customer_mail_history[mailTemplate]";

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
}

test.describe("会員管理 > メール送信履歴", { tag: ["@admin", "@customer"] }, () => {
  // ===== 認証不要・非破壊（常時実行可） =====

  test("E2E-M08-07-008 未ログインで履歴URL→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/customer/mail/1/history`);
    await expect(page).toHaveURL(LOGIN_RE); // 権限・認可: 未ログインは閲覧不可
    await expect(page.locator("#login_id")).toBeVisible();
  });

  // ===== ログインのみで実行可（シード不要） =====

  test("E2E-M08-07-007 存在しない会員IDの履歴URLで404", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/customer/mail/${ABSENT_ID}/history`);
    expect(res?.status()).toBe(404); // エラー処理: 会員不存在→ページが見つからない
  });

  test("E2E-M08-07-014 非数値の会員IDの履歴URLで404", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    // route id=\d+ の数値制約外＝会員を特定できずページが見つからない扱い（観点表No.16「数値以外はエラー」相当）。
    const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/customer/mail/${NON_NUMERIC_ID}/history`);
    expect(res?.status()).toBe(404); // 数値以外→404（実装の数値制約はオラクルにせず観測404のみ期待値化）
  });

  // ===== 一覧表示（SEED-M08-07-MAILHIST） =====

  test("E2E-M08-07-001 履歴画面: 見出し・テンプレート絞り込み・一覧テーブル(3列)が表示される", async ({
    page,
  }) => {
    test.skip(!HAS_SEED, "SEED-M08-07-MAILHIST 未設定（M08_07_CUSTOMER_ID）");
    await login(page);
    const hist = new CustomerCustomerMailHistoryPage(page);
    await hist.goto(CUSTOMER_ID);
    await expect(hist.cardTitle).toBeVisible(); // 見出し(メール送信履歴の一覧。文言差は不具合候補#2)
    await hist.seeListLayout(); // 絞り込みセレクト＋3列見出しの一覧テーブル
  });

  test("E2E-M08-07-002 メールテンプレート絞り込みセレクトが表示される", async ({ page }) => {
    test.skip(!HAS_SEED, "SEED-M08-07-MAILHIST 未設定");
    await login(page);
    const hist = new CustomerCustomerMailHistoryPage(page);
    await hist.goto(CUSTOMER_ID);
    await expect(hist.templateSelect).toBeVisible();
    // 選択肢にテンプレート一覧（先頭の空選択肢以外）を含むこと。
    const optionCount = await hist.templateSelect.locator("option").count();
    expect(optionCount).toBeGreaterThan(1);
  });

  test("E2E-M08-07-004 絞り込みなしで全送信履歴が新しい順に一覧表示される", async ({ page }) => {
    test.skip(!HAS_SEED, "SEED-M08-07-MAILHIST 未設定");
    await login(page);
    const hist = new CustomerCustomerMailHistoryPage(page);
    await hist.goto(CUSTOMER_ID);
    // 当該会員の履歴が1件以上表示されること。
    await expect(hist.historyRows.first()).toBeVisible();
    expect(await hist.historyRows.count()).toBeGreaterThan(0);
    // 業務ルール「並び順＝新しい順（送信日降順）」を検証する（仕様由来オラクル）。
    // 送信日はゼロ詰め Y/m/d 表示のため文字列降順＝時系列降順に一致する。同日同順は許容。
    const dates = (await hist.getSendDateTexts()).map((s) => s.trim()).filter(Boolean);
    const desc = [...dates].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
    expect(dates).toEqual(desc);
  });

  test("E2E-M08-07-009 ログイン済み管理者は履歴URL直接アクセスで一覧を閲覧できる", async ({ page }) => {
    test.skip(!HAS_SEED, "SEED-M08-07-MAILHIST 未設定");
    await login(page);
    const hist = new CustomerCustomerMailHistoryPage(page);
    await hist.goto(CUSTOMER_ID);
    await expect(page).toHaveURL(HISTORY_RE); // 権限・認可: ログイン済みは閲覧可
    await expect(hist.historyTable).toBeVisible();
  });

  test("E2E-M08-07-010 戻るリンクから会員編集画面へ遷移する", async ({ page }) => {
    test.skip(!HAS_SEED, "SEED-M08-07-MAILHIST 未設定");
    await login(page);
    const hist = new CustomerCustomerMailHistoryPage(page);
    await hist.goto(CUSTOMER_ID);
    await hist.backLink.click();
    await expect(page).toHaveURL(EDIT_RE); // 画面遷移: 会員編集へ
  });

  // ===== 絞り込み（SEED-M08-07-MAILHIST ＋ テンプレートID） =====

  test("E2E-M08-07-003 テンプレート選択で絞り込みが送信されURLにmailTemplateが反映される", async ({
    page,
  }) => {
    test.skip(!(HAS_SEED && TEMPLATE_ID), "M08_07_TEMPLATE_ID 未設定");
    await login(page);
    const hist = new CustomerCustomerMailHistoryPage(page);
    await hist.goto(CUSTOMER_ID);
    await hist.selectTemplate(TEMPLATE_ID); // change で GET 自動送信
    await page.waitForURL(new RegExp(`mailTemplate.*=${TEMPLATE_ID}`));
    await expect(page).toHaveURL(HISTORY_RE); // 絞り込み条件がURLに反映される
    // 業務ルール「当該テンプレートの履歴のみ表示」(m08-07.md:93)まで検証する（URL反映だけにしない）。
    // TEMPLATE_ID は該当履歴を持つテンプレ（SEED）のため1件以上残り、全行が選択テンプレに一致する。
    expect(await hist.historyRows.count()).toBeGreaterThan(0);
    const selected = await hist.getSelectedTemplateLabel();
    for (const t of (await hist.getTemplateCellTexts()).map((s) => s.trim()).filter(Boolean)) {
      expect(t).toBe(selected);
    }
  });

  test("E2E-M08-07-011 mailTemplate指定URL直接アクセスで絞り込み条件がセレクトに反映される", async ({
    page,
  }) => {
    test.skip(!(HAS_SEED && TEMPLATE_ID), "M08_07_TEMPLATE_ID 未設定");
    await login(page);
    const hist = new CustomerCustomerMailHistoryPage(page);
    await hist.goto(CUSTOMER_ID, TEMPLATE_ID); // 処理フロー#4: 絞り込み条件をフォームへ反映
    await expect(hist.templateSelect).toHaveValue(TEMPLATE_ID);
  });

  test("E2E-M08-07-012 一致テンプレートで絞り込むと該当履歴が一覧に含まれる", async ({ page }) => {
    test.skip(!(HAS_SEED && TEMPLATE_ID), "M08_07_TEMPLATE_ID 未設定");
    await login(page);
    const hist = new CustomerCustomerMailHistoryPage(page);
    await hist.goto(CUSTOMER_ID, TEMPLATE_ID);
    // 該当履歴を持つテンプレートのため、絞り込み後も履歴が1件以上含まれること。
    expect(await hist.historyRows.count()).toBeGreaterThan(0);
    // 業務ルール「絞り込み＝当該テンプレートの履歴のみ表示」を検証する（仕様由来オラクル / m08-07.md:93）。
    // 「単一値に収束」だけでは弱いため、表示テンプレ列が選択中テンプレ（option:checked のラベル）と一致することまで確認する。
    const selected = await hist.getSelectedTemplateLabel();
    const templates = (await hist.getTemplateCellTexts()).map((s) => s.trim()).filter(Boolean);
    for (const t of templates) {
      expect(t).toBe(selected);
    }
  });

  test("E2E-M08-07-013 未使用テンプレートで絞り込むと該当履歴が含まれない（空・エラーにならない）", async ({
    page,
  }) => {
    test.skip(!(HAS_SEED && TEMPLATE_ID_UNUSED), "M08_07_TEMPLATE_ID_UNUSED 未設定");
    await login(page);
    const hist = new CustomerCustomerMailHistoryPage(page);
    await hist.goto(CUSTOMER_ID, TEMPLATE_ID_UNUSED);
    await expect(page).toHaveURL(HISTORY_RE); // 仕様: エラーにならず画面は表示される（不具合候補#5）
    expect(await hist.historyRows.count()).toBe(0); // 該当履歴は含まれない（空）
  });

  test("E2E-M08-07-015 不正/存在しないテンプレートID指定でもエラーにならず履歴画面が表示される", async ({
    page,
  }) => {
    test.skip(!HAS_SEED, "SEED-M08-07-MAILHIST 未設定");
    await login(page);
    const hist = new CustomerCustomerMailHistoryPage(page);
    // 本機能は参照専用。エラー処理は会員不存在404のみ＝不正テンプレ指定はエラーページにしない（不正値の具体挙動は設計未記載＝要仕様確認）。
    const res = await hist.goto(CUSTOMER_ID, INVALID_TEMPLATE_ID);
    expect(res?.status()).toBe(200); // 404/500等のエラーページにならない
    await expect(hist.historyTable).toBeVisible(); // 履歴一覧画面が表示される
  });

  test("E2E-M08-07-016 履歴0件の会員の履歴画面は空の一覧が表示されエラーにならない", async ({ page }) => {
    test.skip(!(HAS_SEED && CUSTOMER_ID_NOHIST), "SEED-M08-07-NOHIST 未設定（M08_07_CUSTOMER_ID_NOHIST）");
    await login(page);
    const hist = new CustomerCustomerMailHistoryPage(page);
    const res = await hist.goto(CUSTOMER_ID_NOHIST);
    expect(res?.status()).toBe(200); // 会員は存在するため404にならない（エラー処理は会員不存在のみ）
    await expect(hist.historyTable).toBeVisible(); // 一覧テーブル自体は表示される
    expect(await hist.historyRows.count()).toBe(0); // 履歴0件＝正常な空表示
  });

  test("E2E-M08-07-017 一覧行に既知の件名を持つ履歴が表示される（値整合）", async ({ page }) => {
    test.skip(!(HAS_SEED && KNOWN_SUBJECT), "M08_07_KNOWN_SUBJECT 未設定");
    await login(page);
    const hist = new CustomerCustomerMailHistoryPage(page);
    await hist.goto(CUSTOMER_ID);
    // DBカラム subject が一覧表示に使用される（m08-07.md:130,132）。期待値はシード投入した既知 subject（自前データ）でありオラクル独立。
    await expect(hist.historyTable.getByText(KNOWN_SUBJECT, { exact: false }).first()).toBeVisible();
  });

  // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M08-07-005 件名リンク押下で本文モーダルが開く（要: 設計は『本機能専用のモーダルは無い』(m08-07.md:72)＝実装独自挙動のため仕様確認後に実装）",
    async () => {
      // 設計はフロント挙動で「本機能専用のモーダルは無い」と明記。
      // 件名リンク a.btn-link → 本文モーダル #mailhistorybody_* は実装独自表示でありオラクル化しない（不具合候補#6）。
      // 仕様で本文表示が確定したら subjectLinks.openBody → bodyModal/modalCloseButton 表示で検証する。
    }
  );

  test.fixme(
    "E2E-M08-07-006 テンプレート未使用履歴は「テンプレート無し」と表示（要: template_id=NULL履歴のシード十分性＆表示文言の実機確認）",
    async () => {
      // 期待は表示ラベル admin.customer.not_mail_template 由来（不具合候補#4＝設計未記載）。
      // template_id=NULL の履歴を確実に含むシード投入後に実装する。
    }
  );
});
