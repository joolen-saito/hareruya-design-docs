/**
 * 管理画面 システム情報設定 > メンバー登録・編集（M11-02）E2E。
 * 納品ケース表 integration_test/e2e/m11_02_admin_system_setting_setting_system_member_edit_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースを test() で実装する。手動/対象外（DB原値・保存失敗フラッシュの誘発・DB検索の非該当・
 * 権限/IP拒否の環境設定切替・ログ出力抑止・スマレジ一意性の刷新先未実装等）はケース表で全量管理しspecに残さない。
 * 自動化予定だが未実装/要実機（010/011 メンバーを永続化する破壊的保存・036 印字不可文字の投入・037 ログインID重複seed・
 * 040 スマレジ一意性=刷新先未実装）は test.fixme で抜け漏れを可視化する。
 * 期待結果は仕様（正本 functions/pf-eccube3/m11-02_admin_system_setting_setting_system_member_edit.md / 観点表）由来（オラクル独立性）。
 * 設計源は pf-eccube3（リバース）であり、刷新先 ec-cube-enterprise との乖離はケース表の付帯表4（不具合候補）で管理する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証について: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の
 * spec/admin/login.spec.ts・m02-m10/*.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報（ECCUBE_ADMIN_USER/PASS）が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *
 * 実行方針（安全第一・共有ステージング）:
 *  - 表示系（001/002）と検証エラー系（030-035,038）は新規フォームで送信失敗するため dtb_member を更新しない（非破壊）。
 *  - 編集GET（003/004）は既知メンバーID（MEMBER_EDIT_ID）を要し、非破壊（GETのみ）。未設定なら skip。
 *  - 新規/編集の保存成功（010/011）は dtb_member を永続化（INSERT/UPDATE）するため test.fixme（専用シードと後始末が要る）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { SystemSettingSettingSystemMemberEditPage } from "../../../pages/admin/m11/m11_02_admin_system_setting_setting_system_member_edit.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// 編集GET検証用の既知メンバーID（SEED-M11-02-MEMBER）。未設定なら編集GET系を skip する。
const MEMBER_EDIT_ID = process.env.MEMBER_EDIT_ID || "";
const HAS_EDIT_ID = !!MEMBER_EDIT_ID;

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const NEW_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/setting/system/member/new(\\?|$)`);
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/setting/system/member(\\?|$)`);
// 未ログイン誘導先＝管理ログイン画面（/<admin>/login）。要素表示に加え遷移先URLでも誤検知を抑える。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);

/** 管理者ログインして新規メンバー登録画面を開く。 */
async function gotoNewAsAdmin(page: Page): Promise<SystemSettingSettingSystemMemberEditPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const m = new SystemSettingSettingSystemMemberEditPage(page);
  await m.gotoNew();
  return m;
}

test.describe(
  "管理画面 > システム情報設定 > メンバー登録・編集",
  { tag: ["@admin", "@setting", "@system", "@member"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M11-02-020 未ログインで新規登録URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/system/member/new`);
      await expect(page.locator("#login_id")).toBeVisible(); // 権限・認可: 未ログインは管理ログインへ誘導
      await expect(page).toHaveURL(LOGIN_RE); // 誘導先が管理ログインURLであること
    });

    test("E2E-M11-02-021 未ログインで編集URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/system/member/1/edit`);
      await expect(page.locator("#login_id")).toBeVisible();
      await expect(page).toHaveURL(LOGIN_RE);
    });

    // ===== 画面表示（新規フォーム・非破壊） =====

    test("E2E-M11-02-001 新規登録フォームに見出し・登録ボタン・戻るリンクが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const m = await gotoNewAsAdmin(page);
      await m.seeForm();
    });

    test("E2E-M11-02-002 新規登録フォームに設計書の9入力項目が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const m = await gotoNewAsAdmin(page);
      // 設計書フロント挙動「入力項目」: 名前/所属/ログインID/パスワード/確認/権限/所属店舗/稼働/スマレジ
      await m.seeAllInputFields();
    });

    test("E2E-M11-02-023 戻るリンク押下でメンバー一覧へ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const m = await gotoNewAsAdmin(page);
      await m.backLink.click();
      await expect(page).toHaveURL(LIST_RE); // 画面遷移: 戻るリンク→メンバー一覧（M11-01）
    });

    test("E2E-M11-02-022 存在しないIDで編集を開くと404になる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const m = new SystemSettingSettingSystemMemberEditPage(page);
      // 充分大きい非存在ID。要件: 編集対象/補助メンバー情報が無いとき404（処理フロー/エラー処理）。
      const res = await page.goto(m.editUrl(999999999));
      expect(res?.status()).toBe(404);
    });

    // ===== 画面表示（編集GET・非破壊・要 MEMBER_EDIT_ID） =====

    test("E2E-M11-02-003 編集フォームに既存値が表示されパスワード欄はプレースホルダで初期化される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_EDIT_ID, "MEMBER_EDIT_ID 未設定（SEED-M11-02-MEMBER 必要）");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const m = new SystemSettingSettingSystemMemberEditPage(page);
      await m.gotoEdit(MEMBER_EDIT_ID);
      // 要件: 選択メンバーの各項目がフォームに表示され、パスワード欄はプレースホルダ(default_password)が入った状態（データ整合性）。
      // 設計書「既存メンバーの編集を開く」: 各項目（名前/所属/ログインID/パスワード/権限/所属店舗/稼働/スマレジ）が表示される。
      await m.seeAllInputFields();
      await expect(m.name).toHaveValue(/.+/); // 名前は既存値
      await expect(m.loginId).toHaveValue(/.+/); // ログインIDは既存値（編集時 disabled でも value は載る）
      await expect(m.passwordFirst).toHaveValue(/.+/); // 空でなくプレースホルダ値が載る
    });

    test("E2E-M11-02-004 編集画面にサブタイトル「システム設定」とカード見出しが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_EDIT_ID, "MEMBER_EDIT_ID 未設定（SEED-M11-02-MEMBER 必要）");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const m = new SystemSettingSettingSystemMemberEditPage(page);
      await m.gotoEdit(MEMBER_EDIT_ID);
      await expect(page.locator("body")).toContainText("システム設定"); // サブタイトル(member_edit.twig:16)
      // カード見出しは設計書(正典)文言「メンバー登録・編集」を仕様オラクルとしてアサート（刷新先「メンバー登録」との乖離=付帯表4#2を失敗で検出）
      await expect(m.cardTitle.first()).toContainText("メンバー登録・編集");
    });

    // ===== 異常系（バリデーション・新規フォーム・非破壊：送信失敗で永続化されない） =====

    test("E2E-M11-02-030 名前未入力で登録→名前欄に必須エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const m = await gotoNewAsAdmin(page);
      await m.submit(); // 空のまま送信（form は novalidate のためサーバ NotBlank で判定）
      await expect(m.fieldError(m.name).first()).toBeVisible(); // 名前欄近傍の必須エラー
      await expect(m.successAlert).toHaveCount(0); // 成功フラッシュは出ない
      await expect(page).toHaveURL(NEW_RE); // 同画面に滞留
    });

    test("E2E-M11-02-031 ログインID未入力で登録→ログインID欄に必須エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const m = await gotoNewAsAdmin(page);
      await m.submit();
      await expect(m.fieldError(m.loginId).first()).toBeVisible();
      await expect(m.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(NEW_RE);
    });

    test("E2E-M11-02-032 所属未選択で登録→所属欄に必須エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const m = await gotoNewAsAdmin(page);
      await m.submit();
      // 所属は NotBlank（正典の入力種別は text・空白不可。空送信で必須エラー）。select/未選択という刷新先実装は前提化しない（付帯表4#8）。
      await expect(m.fieldError(m.department).first()).toBeVisible();
      await expect(m.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(NEW_RE);
    });

    test("E2E-M11-02-033 権限未選択で登録→権限欄に必須エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const m = await gotoNewAsAdmin(page);
      await m.submit();
      await expect(m.fieldError(m.authority).first()).toBeVisible(); // 権限は NotBlank
      await expect(m.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(NEW_RE);
    });

    test("E2E-M11-02-038 稼働未選択で登録→稼働欄に必須エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const m = await gotoNewAsAdmin(page);
      await m.submit();
      // 稼働(Work)は expanded radio かつ NotBlank。新規は既定で未選択のため必須エラーになる。
      const workField = page.locator("input[name='admin_member[Work]']").first();
      await expect(m.fieldError(workField).first()).toBeVisible();
      await expect(m.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(NEW_RE);
    });

    test("E2E-M11-02-034 パスワードと確認が不一致で登録→相関エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const m = await gotoNewAsAdmin(page);
      // repeated により first/second の一致が必須。形式は満たしつつ値だけ食い違わせる。
      await m.passwordFirst.fill("Passw0rd1");
      await m.passwordSecond.fill("Passw0rd2");
      await m.submit();
      await expect(m.fieldError(m.passwordFirst).first()).toBeVisible(); // パスワード欄近傍に不一致エラー
      await expect(m.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(NEW_RE);
    });

    test("E2E-M11-02-035 ログインID最大長+1で登録→文字列長エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const m = await gotoNewAsAdmin(page);
      // 正典のログインID最大長 id_max_len=50（確認値）。最大長の正は仕様由来でForm制約値そのものはオラクル化しない。
      await m.loginId.fill("a".repeat(51));
      await m.submit();
      await expect(m.fieldError(m.loginId).first()).toBeVisible(); // ログインID欄近傍の文字列長エラー
      await expect(m.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(NEW_RE);
    });

    test("E2E-M11-02-039 パスワード未入力で登録→パスワード欄に必須エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const m = await gotoNewAsAdmin(page);
      await m.submit(); // 空のまま送信。パスワードは新規で NotBlank（入力項目表）
      await expect(m.fieldError(m.passwordFirst).first()).toBeVisible(); // パスワード欄近傍の必須エラー
      await expect(m.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(NEW_RE);
    });

    test("E2E-M11-02-041 パスワード最小長未満で登録→文字列長エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const m = await gotoNewAsAdmin(page);
      // 仕様確認値 id_min_len=4 未満の3文字。first/second を一致させ相関エラーではなく長さエラーを誘発する。
      await m.passwordFirst.fill("ab1");
      await m.passwordSecond.fill("ab1");
      await m.submit();
      await expect(m.fieldError(m.passwordFirst).first()).toBeVisible(); // パスワード欄近傍の文字列長エラー
      await expect(m.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(NEW_RE);
    });

    test("E2E-M11-02-042 ログインID最小長未満(3文字)で登録→文字列長エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const m = await gotoNewAsAdmin(page);
      // 正典のログインID下限 id_min_len=4（確認値）。下限未満の3文字で長さエラーを誘発（035 上限+1 と対の下限側）。
      // 印字可能文字のみで構成し、文字種エラーではなく長さエラーに切り分ける。
      await m.loginId.fill("ab1");
      await m.submit();
      await expect(m.fieldError(m.loginId).first()).toBeVisible(); // ログインID欄近傍の文字列長エラー
      await expect(m.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(NEW_RE);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M11-02-010 新規登録 有効入力→成功フラッシュ＋作成メンバーの編集画面へ遷移（要: 破壊的 INSERT の専用シード/後始末）",
      async () => {
        // 期待は仕様（処理フロー POST検証成功→保存→成功フラッシュ→編集画面遷移）由来。
        // dtb_member を恒久的に INSERT するため、識別接頭辞付きの使い捨てアカウントと後始末を実機確認後に実装する。
      }
    );

    test.fixme(
      "E2E-M11-02-011 編集 パスワードをプレースホルダのまま登録→成功フラッシュ＋同編集画面（要: SEED-M11-02-MEMBER-RW）",
      async () => {
        // 期待は仕様（編集成功→同編集画面・パスワード未変更で既存ハッシュ維持）由来。
        // 既存ハッシュ維持の確認は DB内部値で観測不能（手動/間接）。UI上は update_date を永続化するため専用RWシードが要る。
      }
    );

    test.fixme(
      "E2E-M11-02-012 所属店舗を未選択のまま有効入力→成功フラッシュ＋保存成立（所属店舗は任意。要: 破壊的 INSERT の専用シード/後始末）",
      async () => {
        // 期待は仕様（入力項目表: 所属店舗は任意 ／ 処理フロー#4: 未選択なら空 ／ エッジケース: 所属店舗を未選択で保存）由来。
        // 所属店舗(#admin_member_baseInfo)を未選択のまま全必須項目を有効値で送信し、成功フラッシュ表示で保存成立を観測する。
        // dtb_member を恒久 INSERT するため、識別接頭辞付きの使い捨てアカウントと後始末を実機確認後に実装する。
      }
    );

    test.fixme(
      "E2E-M11-02-013 編集 パスワードを変更して登録→成功フラッシュ＋同編集画面（判定順序#2 変更側でソルト生成・再ハッシュ。要: SEED-M11-02-MEMBER-RW）",
      async () => {
        // 期待は仕様（処理フロー POST検証成功・判定順序#2: プレースホルダと異なる→ソルト生成・再ハッシュ→保存→成功→同編集画面）由来。
        // 011（プレースホルダ維持＝既存ハッシュ維持）の異常/正常の対となる「変更側」。再ハッシュ結果は DB内部値で観測不能（手動/間接）。
        // dtb_member を UPDATE で永続化するため使い捨て RW シードと後始末を実機確認後に実装する。
      }
    );

    test.fixme(
      "E2E-M11-02-043 他に有効なスマレジ用アカウントが無い状態で有効化→成功フラッシュ＋保存成立（040 重複異常の正常側。要: SEED-M11-02-SMAREGI-NONE）",
      async () => {
        // 期待は仕様（判定順序#5・入力項目表: スマレジ用アカウントは他に有効行が無い場合のみ有効化可能）由来。
        // 040（他に有効1件で重複エラー）の異常系に対する正常系。dtb_member を UPDATE で永続化するため使い捨てシードと後始末が要る。
      }
    );

    test.fixme(
      "E2E-M11-02-036 ログインIDに印字不可文字→文字種エラーで滞留（要: 印字不可/制御文字の投入手段）",
      async () => {
        // 期待は仕様（ログインIDは印字可能文字＋空白の正規表現 graph_only）由来。
        // 通常入力では graph 違反を作りにくいため DOM直接設定等の手段を実機確認後に実装する。
      }
    );

    test.fixme(
      "E2E-M11-02-037 新規でログインID重複→重複エラーで滞留（要: 既存 login_id を持つ SEED-M11-02-MEMBER-DUP）",
      async () => {
        // 期待は仕様（ログインID一意制約・enterprise.form.type.member_already_exists）由来。
        // 既知の重複 login_id を持つシードが必要。
      }
    );

    test.fixme(
      "E2E-M11-02-040 スマレジ用アカウント重複→重複エラーフラッシュ（刷新先 ec-cube-enterprise 未実装：付帯表4#3）",
      async () => {
        // 期待は仕様（スマレジ用アカウントは全メンバー1件まで・admin.member.save.exist_smaregi_member_error）由来。
        // 刷新先には当該一意性チェック/メッセージが存在しないため、テストは仕様どおりに書けば失敗で乖離を検出する見込み。
        // 重複状態の SEED-M11-02-SMAREGI-DUP も要る。
      }
    );
  }
);
