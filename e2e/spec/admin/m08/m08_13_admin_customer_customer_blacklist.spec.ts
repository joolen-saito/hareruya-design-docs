/**
 * 管理画面 会員管理 — ブラックリスト登録/編集/削除 E2E。
 * 納品ケース表 integration_test/e2e/m08_13_admin_customer_customer_blacklist_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装する。手動/対象外はケース表で全量管理し、specには残さない（規約）。
 * 破壊的（DB書込）・専用シード必須のケース（030/031/032/040/041/042/043）は test.fixme（理由付き）で
 * 抜け漏れを可視化する。資格情報不足は test.skip(!HAS_CREDS) で実行ガードする。
 *
 * 期待結果（合否）は仕様（正本 functions/pf-eccube3/m08-13_admin_customer_customer_blacklist.md・観点表・
 * 設計書が「画面文言は実装を確認値とする」と委譲した範囲で ec-cube-enterprise messages.ja.yaml）由来とする
 * （オラクル独立性）。本specが実装から取るのはセレクタ（位置情報）と、設計が表示文言を実装へ委譲した範囲の
 * 文言のみ。Form の必須/最大長/数値制約そのものを合否オラクルへ流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 異常系URL方針（ケース表 付帯表4#5）: 設計は「重複・不正は登録せず一覧へ戻る」。刷新先実装は検証NG時に
 * リダイレクトせず POST /update のまま blacklist.twig を再描画する（一覧画面の再表示＝表示は等価だがURLは
 * /update のまま）。仕様（一覧へ戻る＝一覧画面の再表示）に忠実に「エラー文言表示＋一覧フォームの再表示」を
 * 合否とし、実装由来の到達URL（/update か /blacklist か）はオラクルに固定しない（要確認）。
 *
 * シード（環境変数。コミットしない）:
 *  - SEED-M08-13-LOGIN : ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（一覧表示・登録操作可の管理者）
 *  - SEED-M08-13-TAG   : mtb_blacklist_tag に電話番号項目（TEL_ID=2）を含む初期マスタ（標準インストール既定）
 *  - SEED-M08-13-ROW   : dtb_blacklist の既知行1件（重複・空編集・編集成功・削除の対象。接頭辞付き使い捨て）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { CustomerCustomerBlacklistPage } from "../../../pages/admin/m08/m08_13_admin_customer_customer_blacklist.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様（設計書が表示文言を実装へ委譲した範囲。messages.ja.yaml 由来）の文言。実装に合わせて変えない（オラクル独立性）。
const SUBTITLE = "ブラックリスト管理"; // admin.customer.blacklist_management（:3852）
const DESC =
  "項目を選択し、キーワードに入力してください。電話番号は半角数字のみで入力してください。"; // admin.customer.blacklist.discription（:3853）
const HDR_TAG = "項目"; // admin.customer.blacklist.blacklist_tag（:3854）
const HDR_KEYWORD = "キーワード"; // admin.customer.blacklist.keyword（:3855）
const ERR_INPUT = "入力が正しくありません"; // admin.customer.blacklist.input_error（:3856）
const ERR_REGISTERED = "既に登録されています"; // admin.customer.blacklist.registered_error（:3857）
const ERR_NEW_TAG = "新規登録の項目が選択されていません"; // admin.customer.blacklist.new_register_tag_error（:3858）

const LOGIN_RE = /\/login(\?|$)/;
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/customer/blacklist(\\?|$)`);

/** 管理者でログインしてブラックリスト一覧を開く。 */
async function loginAndOpenList(page: Page): Promise<CustomerCustomerBlacklistPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const bl = new CustomerCustomerBlacklistPage(page);
  await bl.gotoList();
  return bl;
}

test.describe("管理画面 > 会員管理 > ブラックリスト", { tag: ["@admin", "@customer", "@blacklist"] }, () => {
  // ===== 未認証ガード（資格情報不要・非破壊） =====

  test("E2E-M08-13-010 未ログインで一覧URL直接→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/customer/blacklist`);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  test("E2E-M08-13-011 未ログインで更新（POST専用）を実行→更新せず管理ログインへ誘導", async ({ page }) => {
    // 更新ルートは POST 専用（BlacklistController.php:61）。GET 直叩きは認証ではなくルーティング(405)挙動を
    // 見てしまうため、メソッド一致の POST で「未認証は更新を実行できない＝ログインへ誘導」を検証する。
    const updateUrl = `/${ECCUBE_ADMIN_ROUTE}/customer/blacklist/update`;
    const resp = await page.request.post(updateUrl, {
      form: { "admin_customer_blacklist_update[new_keyword]": "e2e_guard" },
      maxRedirects: 5,
    });
    // 認証ガードによりログイン画面へ誘導される（更新は実行されない）。到達URL/本文のいずれかでログインを確認。
    const landedLogin = LOGIN_RE.test(resp.url()) || /id="login_id"/.test(await resp.text());
    expect(landedLogin, "未認証の更新POSTは管理ログインへ誘導されること").toBeTruthy();
  });

  // ===== 一覧画面 表示（SEED-M08-13-LOGIN） =====

  test("E2E-M08-13-001 一覧画面: 項目選択・キーワード入力欄・登録ボタンと一覧見出しが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M08-13-LOGIN）");
    const bl = await loginAndOpenList(page);
    await bl.seeListForm();
    await bl.seeText(HDR_TAG);
    await bl.seeText(HDR_KEYWORD);
  });

  test("E2E-M08-13-002 一覧画面: 入力ガイド説明文が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const bl = await loginAndOpenList(page);
    await bl.seeText(DESC);
  });

  test("E2E-M08-13-003 一覧画面: サブタイトル/カード見出しに「ブラックリスト管理」が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const bl = await loginAndOpenList(page);
    await bl.seeText(SUBTITLE);
  });

  test("E2E-M08-13-004 一覧画面: 登録フォームになりすまし対策トークン(hidden)が含まれる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const bl = await loginAndOpenList(page);
    // 設計書 入出力「なりすまし対策トークン」。hidden _token の存在のみ確認（値はオラクル化しない）。
    // CSRF検証NG（無効/欠落トークン）の内部結果はブラウザ観測外＝対象外（付帯表2b IT行001）。
    await expect(bl.tokenField).toHaveCount(1);
  });

  // ===== 新規登録 異常系（非破壊：検証で弾かれDBを変えない。SEED-M08-13-LOGIN/TAG） =====

  test("E2E-M08-13-020 新規キーワード入力＋項目未選択→項目選択エラーで一覧に留まる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const bl = await loginAndOpenList(page);
    await bl.registerNew("e2e_no_tag"); // 項目未選択のままキーワードのみ
    await bl.seeError(ERR_NEW_TAG);
    await bl.seeListForm(); // 登録されず一覧フォームが再表示される（URLは固定しない＝付帯表4#5）
  });

  test("E2E-M08-13-021 電話番号項目で非数字キーワード→入力エラーで一覧に留まる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（要マスタ SEED-M08-13-TAG: TEL_ID=2）");
    const bl = await loginAndOpenList(page);
    // 電話番号項目を選択（option value=2=TEL_ID。MtbBlacklistTag.php:32 由来のセレクタ値）。
    await bl.registerNew("０9０abc", CustomerCustomerBlacklistPage.TEL_TAG_VALUE);
    await bl.seeError(ERR_INPUT);
    await bl.seeListForm();
  });

  // ===== 新規登録 正常系（破壊的：DB追加。要使い捨てシード→fixme） =====

  test.fixme(
    "E2E-M08-13-030 項目＋一意キーワードで登録→成功メッセージ＋一覧へ戻り追加行が表示される（要: 使い捨て隔離環境）",
    async ({ page }) => {
      const bl = await loginAndOpenList(page);
      const keyword = `e2e_bl_${Date.now()}`;
      await bl.registerNew(keyword, CustomerCustomerBlacklistPage.TEL_TAG_VALUE);
      // 成功時は一覧（admin_customer_blacklist）へリダイレクト（Controller.php:109）。一覧再表示で追加行を確認。
      await expect(page).toHaveURL(LIST_RE);
      await bl.seeText(keyword);
      // 成功フラッシュ文言キーは設計(admin.register.complete)と刷新先(admin.common.save_complete=「保存しました」)で
      // 差異あり＝要確認（付帯表4#2）。合否は「一覧へ戻り追加行が表示される」で判定する。
    }
  );

  test.fixme(
    "E2E-M08-13-031 既存行を削除して登録→一覧へ戻り当該行が消える（要: SEED-M08-13-ROW 使い捨て）",
    async ({ page }) => {
      const bl = await loginAndOpenList(page);
      await bl.deleteRowButtons.first().click(); // 行を非表示化＋delete-checkbox=ON（blacklist.twig:13-19,75,79）
      await bl.submitButton.click();
      await expect(page).toHaveURL(LIST_RE);
      // 削除対象キーワードが一覧から消えること（対象キーワードは SEED-M08-13-ROW の既知接頭辞で確認）。
    }
  );

  test.fixme(
    "E2E-M08-13-032 既存行のキーワードを別の有効値へ編集→成功で一覧へ戻り更新後の値が表示される（要: SEED-M08-13-ROW 使い捨て）",
    async ({ page }) => {
      // 設計書「既存編集」正常系（codexレビュー高指摘の補完）。破壊的（DB更新）のため fixme。
      const bl = await loginAndOpenList(page);
      const newValue = `e2e_bl_edit_${Date.now()}`;
      await bl.editRowKeyword(newValue, 0);
      await expect(page).toHaveURL(LIST_RE);
      await bl.seeText(newValue);
    }
  );

  // ===== 既存行 異常系（重複は非破壊だが対象シード必須／空編集→fixme） =====

  test.fixme(
    "E2E-M08-13-040 既存と同一の項目＋キーワードを新規登録→重複エラーで一覧に留まる（要: SEED-M08-13-ROW）",
    async ({ page }) => {
      const bl = await loginAndOpenList(page);
      // 既存行と同一の項目・キーワードを新規入力（既存行の値はシード接頭辞で既知）。
      await bl.registerNew("<SEED-M08-13-ROW.keyword>", "<SEED-M08-13-ROW.tagValue>");
      await bl.seeError(ERR_REGISTERED);
      await bl.seeListForm(); // 登録されず一覧再表示（URLは固定しない＝付帯表4#5）
    }
  );

  test.fixme(
    "E2E-M08-13-041 既存行のキーワードを空にして登録→入力エラーで一覧に留まる（要: SEED-M08-13-ROW）",
    async ({ page }) => {
      const bl = await loginAndOpenList(page);
      await bl.editRowKeyword("", 0); // 既存行のキーワードを空に
      await bl.seeError(ERR_INPUT);
      await bl.seeListForm();
    }
  );

  test.fixme(
    "E2E-M08-13-043 既存行のキーワードを別の既存行と同一値へ編集→重複エラーで一覧に留まる（要: SEED-M08-13-ROW×2）",
    async ({ page }) => {
      // 設計書「既存編集」異常系の重複分岐（040[新規重複]の既存編集対）。重複は更新せずDBを変えない（非破壊）が
      // 異なる2件の既存行シードを要するため fixme。期待は「重複は登録せず一覧へ戻る」（設計由来）。
      const bl = await loginAndOpenList(page);
      await bl.editRowKeyword("<SEED-M08-13-ROW.otherRow.keyword>", 0);
      await bl.seeError(ERR_REGISTERED);
      await bl.seeListForm(); // 更新されず一覧再表示（URLは固定しない＝付帯表4#5）
    }
  );

  // ===== 設計書の最大長(255)境界（刷新先formに長さ制約なし＝設計差。要確認・付帯表4#3） =====

  test.fixme(
    "E2E-M08-13-042 最大長+1(256文字)のキーワード登録→設計上は入力エラーで一覧に留まる（要確認: 刷新先form長さ制約なし=付帯表4#3）",
    async ({ page }) => {
      // 設計書は keyword 最大255。刷新先 form は Length 制約なし(BlacklistUpdateType.php:40-43)・maxlength属性なしのため、
      // 本テストは設計仕様（255超は登録しない）に忠実に書く＝実装に寄せない。実装では DB 切り捨て/save_error の可能性があり要確認。
      const bl = await loginAndOpenList(page);
      // 文字種違反を混入させないため数字のみで256文字（TEL項目でも長さ違反のみが争点になる）。
      const over = "9".repeat(256);
      await bl.registerNew(over, CustomerCustomerBlacklistPage.TEL_TAG_VALUE);
      await bl.seeError(ERR_INPUT);
      await bl.seeListForm();
    }
  );
});
