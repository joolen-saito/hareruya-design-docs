/**
 * 管理画面 設定 > システム設定 > マスタデータ管理 E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m11_05_admin_system_setting_setting_system_masterdata_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち非破壊で安全に実行できるケースのみ test 本体で実装する:
 *  - 表示(GET・選択→リダイレクト・直接URL)・未認証誘導・バリデーション失敗(flush前停止＝DB不変)。
 * 保存成功(010/011/012=マスタテーブル更新)・flush失敗(030)・権限403(031)・マスタ未選択NotBlank(024・UI制約要確認)・
 * sort_no振り直し間接確認(040)は test.fixme（理由付き）で残す。手動/対象外はケース表で全量管理する（規約）。
 * 期待結果は仕様（正本md / 観点表 / messages.ja.yaml・validators.ja.yaml の確認値）由来（オラクル独立性）。
 * 表示文言は実装の現挙動を写さず仕様の確認値を用いる。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / m10系）に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { SystemSettingSettingSystemMasterdataPage } from "../../../pages/admin/m11/m11_05_admin_system_setting_setting_system_masterdata.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/setting/system/masterdata(\\?|$)`);
// 選択成功時のリダイレクト先 /masterdata/{entity}/edit
const VIEW_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/setting/system/masterdata/[^/]+/edit(\\?|$)`);
// 保存POST(form2 action=admin_setting_system_masterdata_edit)の宛先 /masterdata/edit。
// 検証失敗時はこのURLで200再表示される（設計書「処理フロー(保存) 検証失敗→同一画面でエラー再表示」）。
const EDIT_STAY_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/setting/system/masterdata/edit(\\?|$)`);

// 仕様(messages.ja.yaml / validators.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const HEADING = "マスタデータ管理"; // messages.ja.yaml:2795
const DESC_LINE1 = "マスターデータの値を設定できます。"; // :3133
const DESC_DUP = "重複したIDを登録することはできません。"; // :3134/3139
const ERR_NUMERIC = "数字で入力してください。"; // validators.ja.yaml:37 form_error.numeric_only
const ERR_BLANK = "入力されていません。"; // validators.ja.yaml:17 (ID入力時に名称空)
const ERR_DUP_ID = "重複したIDを登録することはできません。"; // messages.ja.yaml:3139 duplicate_id
const SAVE_COMPLETE = "保存しました"; // messages.ja.yaml:1398

/** 管理ログインしてからマスタデータ管理画面（マスタ未選択）を開く。 */
async function gotoAsAdmin(page: Page): Promise<SystemSettingSettingSystemMasterdataPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const md = new SystemSettingSettingSystemMasterdataPage(page);
  await md.gotoList();
  return md;
}

/** ログイン→マスタ未選択画面→先頭マスタを選択して編集テーブルを表示する。 */
async function gotoWithMasterSelected(
  page: Page
): Promise<SystemSettingSettingSystemMasterdataPage> {
  const md = await gotoAsAdmin(page);
  await md.selectFirstMaster();
  await expect(page).toHaveURL(VIEW_RE); // 選択成功→/{entity}/edit へリダイレクト
  return md;
}

test.describe(
  "管理画面 > システム設定 > マスタデータ管理",
  { tag: ["@admin", "@setting", "@system"] },
  () => {
    // ===== 表示（GET・非破壊） =====

    test("E2E-M11-05-001 マスタ選択フォーム・選択ボタン・ツールチップ見出しが表示され編集テーブルは出ない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const md = await gotoAsAdmin(page);
      await expect(page).toHaveURL(LIST_RE);
      await md.seeSelectForm();
      await expect(md.headingSpan).toContainText(HEADING);
      await expect(md.form2).toHaveCount(0); // マスタ未選択では第2カード（編集テーブル）を出さない
    });

    test("E2E-M11-05-002 見出しに Bootstrap ツールチップ属性 data-bs-toggle が付与される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const md = await gotoAsAdmin(page);
      await expect(md.tooltipHeading).toHaveAttribute("data-bs-toggle", "tooltip");
    });

    test("E2E-M11-05-003 マスタを選び「選択」を送信すると一覧入口へリダイレクトし編集テーブルが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const md = await gotoWithMasterSelected(page);
      await expect(md.editTable).toBeVisible();
      expect(await md.editRows.count()).toBeGreaterThan(0);
    });

    test("E2E-M11-05-004 選択済マスタの入口URLへ直接GETすると選択欄に当該マスタが入り編集テーブルが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const md = await gotoWithMasterSelected(page);
      const key = await md.editMasterKey(); // 選択中マスタキー
      await md.gotoEntity(key); // /{entity}/edit を直接GET
      await expect(md.editTable).toBeVisible();
      await expect(md.masterSelect).toHaveValue(key); // 選択欄に当該マスタが入る
    });

    test("E2E-M11-05-009 無効なマスタキーで直接GETすると編集テーブルが表示されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const md = await gotoAsAdmin(page);
      // 選択肢に存在しないマスタキー。form['masterdata'] が無効となり findBy を実行せず form2.data が空のまま。
      await md.gotoEntity("Invalid-Master-Key");
      // 設計書 エッジケース(無効マスタキー): マッピング/検証不成立で編集テーブル（form2）を出さない。
      await expect(md.form2).toHaveCount(0);
    });

    test("E2E-M11-05-005 編集テーブルに説明文（重複ID不可・空IDで削除等）が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const md = await gotoWithMasterSelected(page);
      await expect(md.description).toContainText(DESC_LINE1);
      await expect(md.description).toContainText(DESC_DUP);
    });

    test("E2E-M11-05-006 編集テーブルの列見出し「ID」「Name」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const md = await gotoWithMasterSelected(page);
      await md.seeColumnHeaders();
    });

    test("E2E-M11-05-007 一覧末尾にID・名称が空の追加行が1行表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const md = await gotoWithMasterSelected(page);
      const last = (await md.editRows.count()) - 1;
      await expect(md.rowId(last)).toHaveValue(""); // 末尾行は ID 空
      await expect(md.rowName(last)).toHaveValue(""); // 末尾行は 名称 空
    });

    test("E2E-M11-05-013 編集のみ入口へ直接GETすると200で編集テーブルが表示されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const md = await gotoAsAdmin(page);
      // 設計書「編集のみの入口へ GET /masterdata/edit」: 200応答・編集対象データが無ければ編集表を出さない。
      const resp = await page.goto(md.editPostUrl);
      expect(resp?.status()).toBe(200);
      await expect(md.form2).toHaveCount(0); // 編集テーブル（第2カード）は出ない
    });

    test("E2E-M11-05-014 マスタ選択プルダウンに候補マスタが載り除外クラスは選択肢に出ない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const md = await gotoAsAdmin(page);
      const values = await md.masterOptionValues();
      expect(values.length).toBeGreaterThan(0); // 候補マスタが1件以上載る
      // 設計書 業務ルール: 除外クラスは候補から外す（OrderStatus/OrderStatusColor/CustomerOrderStatus/MtbColorSequence/Country）。
      // マスタキーは FQCN をハイフン区切りにした識別子のため、末尾クラス名で除外を判定する。
      const EXCLUDED = [
        "OrderStatusColor",
        "CustomerOrderStatus",
        "OrderStatus",
        "MtbColorSequence",
        "Country",
      ];
      for (const v of values) {
        const cls = v.split("-").pop() ?? "";
        expect(EXCLUDED).not.toContain(cls);
      }
    });

    // ===== 権限・認可（未認証は資格情報不要・非破壊） =====

    test("E2E-M11-05-008 未認証で当画面URLへ直接アクセスすると管理ログイン画面へ誘導される", async ({ page }) => {
      // 資格情報不要（未ログイン前提）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/system/masterdata`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== バリデーション失敗（POST するが検証失敗で同一画面200再表示＝flushせずDB不変・非破壊） =====

    test("E2E-M11-05-020 行IDに非数字を入力して保存すると数字エラーで保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const md = await gotoWithMasterSelected(page);
      const last = (await md.editRows.count()) - 1; // 末尾の空行を使う
      await md.rowId(last).fill("abc"); // 十進非負整数のみ許可（Regex）に違反
      await md.rowName(last).fill("e2e-numeric");
      await md.save();
      await expect(page.locator("body")).toContainText(ERR_NUMERIC); // form_error.numeric_only
      // 検証失敗→/edit で200再表示（リダイレクトしない＝flush未到達でDB不変）。フラッシュクラス不在は補助判定。
      await expect(page).toHaveURL(EDIT_STAY_RE);
      await expect(md.successAlert).toHaveCount(0);
    });

    test("E2E-M11-05-021 行IDを入力し名称を空にして保存すると名称必須エラーで保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const md = await gotoWithMasterSelected(page);
      const last = (await md.editRows.count()) - 1;
      await md.rowId(last).fill("99999"); // ID 入力
      await md.rowName(last).fill(""); // 名称 空＝POST_SUBMIT でブランクエラー
      await md.save();
      await expect(page.locator("body")).toContainText(ERR_BLANK);
      await expect(page).toHaveURL(EDIT_STAY_RE); // 検証失敗→/edit で200再表示（保存されない）
      await expect(md.successAlert).toHaveCount(0);
    });

    test("E2E-M11-05-022 同一送信内で同じIDを複数行に入力して保存すると重複IDエラーで保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const md = await gotoWithMasterSelected(page);
      // 先頭行の既存IDと同じ値を末尾の空行へ入れて重複させる。
      const dupId = await md.rowId(0).inputValue();
      const last = (await md.editRows.count()) - 1;
      await md.rowId(last).fill(dupId);
      await md.rowName(last).fill("e2e-dup");
      await md.save();
      await expect(page.locator("body")).toContainText(ERR_DUP_ID);
      await expect(page).toHaveURL(EDIT_STAY_RE); // 検証失敗→/edit で200再表示（保存されない）
      await expect(md.successAlert).toHaveCount(0);
    });

    test("E2E-M11-05-023 行IDに最大長+1桁を入力して保存するとエラーで保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const md = await gotoWithMasterSelected(page);
      const last = (await md.editRows.count()) - 1;
      // 行IDは最大長 eccube_int_len(確認値9)。10桁は長さ超過（期待値は設計書の最大長9由来）。
      await md.rowId(last).fill("1".repeat(10));
      await md.rowName(last).fill("e2e-len");
      await md.save();
      // 検証失敗→/edit で200再表示（成功リダイレクト /{entity}/edit に進まない＝flush未到達でDB不変）。
      await expect(page).toHaveURL(EDIT_STAY_RE);
      await expect(md.successAlert).toHaveCount(0);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M11-05-010 保存成功で成功フラッシュ「保存しました」が表示され一覧入口へリダイレクトする（破壊的: マスタ更新。要: 使い捨てシードと後始末）",
      async () => {
        // 期待は仕様（処理フロー(保存#7) addSuccess admin.common.save_complete / 画面遷移「成功→/{entity}/edit へリダイレクト」）由来。
        // 既存名称を一時値へ更新→保存→SAVE_COMPLETE 表示→元値へ復元する手順を用意してから実装する。
        void SAVE_COMPLETE;
      }
    );

    test.fixme(
      "E2E-M11-05-011 末尾行に新規ID・名称を入力して保存すると新規行が追加される（破壊的・間接DB確認・要シード）",
      async () => {
        // 期待は仕様（業務ルール「既存に無い主キーが送られれば新規 persist」/ DB副作用）由来。
        // 末尾空行へ未使用ID＋名称→保存→再GETで当該行が一覧に出る→撤去（行クリア保存）で後始末する。
      }
    );

    test.fixme(
      "E2E-M11-05-012 既存行のID・名称を空にして保存すると当該行が削除される（破壊的・間接DB確認・要シード）",
      async () => {
        // 期待は仕様（業務ルール「IDと名称が両方nullかつ行キーが非空ID一覧に無い→remove」）由来。
        // 使い捨てマスタ行を投入→ID/名称をクリア保存→一覧から消えることを確認する。外部キー参照のない安全なマスタで行う。
      }
    );

    test.fixme(
      "E2E-M11-05-024 マスタ未選択（NotBlank）で「選択」を送信するとエラーで処理が完了しない（要実機確認: select に空選択肢が無くUIで再現可否を確認）",
      async () => {
        // 期待は仕様（バリデーション「マスタ選択 NotBlank」）由来。
        // ChoiceType に placeholder が無く先頭マスタが既定選択されるため、空送信を UI で再現できるかを実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M11-05-030 flush 例外時にエラーフラッシュ「保存に失敗しました」が積まれリダイレクトする（要: 外部キー参照のある行の削除でDB例外を誘発）",
      async () => {
        // 期待は仕様（エラー処理「flush 例外→addError admin.common.save_error→リダイレクト」/ messages.ja.yaml:1399）由来。
        // 参照されているマスタ行をクリア（削除）保存して flush 例外を起こす。環境依存のため手動寄り。
      }
    );

    test.fixme(
      "E2E-M11-05-031 店舗系権種(tenant_owner)でGETすると認可失敗で HTTP 403 になる（要: tenant 権種アカウントのシード）",
      async () => {
        // 期待は仕様（権限・認可「店舗側権種は /setting/system/masterdata への GET が 403」）由来。
        // 拒否リスト該当の tenant_owner でログインし GET の応答が 403 であることを確認する。
      }
    );

    test.fixme(
      "E2E-M11-05-040 保存後に sort_no が画面行順へ0起算で振り直される（破壊的・間接DB確認・要シード）",
      async () => {
        // 期待は仕様（業務ルール・DBカラム「保存時に sort_no を0起算で連番付け直し」）由来。
        // 行順を入れ替えて保存→再GETの並び（sort_no 昇順）で反映を間接確認する。マスタを更新するため使い捨てシードで実装。
      }
    );
  }
);
