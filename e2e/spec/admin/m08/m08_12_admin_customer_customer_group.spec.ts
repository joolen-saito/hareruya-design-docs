/**
 * 管理画面 会員管理 顧客グループ管理（M08-12）E2E。納品ケース表
 * integration_test/e2e/m08_12_admin_customer_customer_group_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」かつ非破壊で走るケースのみ実装し、破壊的(DB登録/更新/削除)・要実機確認・仕様乖離検出見込みは
 * test.fixme（理由付き）で残す。手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/pf-eccube3/m08-12_admin_customer_customer_group.md / 観点表)由来（オラクル独立性）。
 * pf-eccube3(HareruyaEc現行踏襲)由来の設計だが、刷新先 ec-cube-enterprise に顧客グループ管理画面が実在するためE2E化した。
 * 表示文言のうち i18n リソース(messages.ja.yaml)由来の語はオラクルにせず、設計書が定める観測挙動（一覧反映・遷移・滞留）で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・m07/m08/*.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報/シードが無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *
 * シード（環境変数。コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 顧客グループ管理が可能な管理者（SEED-M08-12-ADMIN）
 *  - M08_12_GROUP_ID   : 既存の顧客グループID（編集フォーム表示・削除モーダル表示の対象。SEED-M08-12-GROUP）
 *  - M08_12_GROUP_NAME : 上記グループの現在の名称（編集フォームに現行値が表示されることの確認に使用）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { CustomerCustomerGroupPage } from "../../../pages/admin/m08/m08_12_admin_customer_customer_group.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// SEED-M08-12-GROUP: 既存グループID（編集フォーム表示・削除モーダル表示の対象）。
const GROUP_ID = process.env.M08_12_GROUP_ID || "";
const GROUP_NAME = process.env.M08_12_GROUP_NAME || "";
const HAS_GROUP = HAS_CREDS && !!GROUP_ID;

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
// 一覧（顧客グループ管理）画面の合否オラクル。設計書のパスは `/{admin_route}/customer_group`、実装は
// `/{admin_route}/customer/customer_group`（不具合候補#1）と乖離するため、`customer/` 有無のどちらでも成立する
// 正規表現とし、実装パスを期待値に固定しない（オラクル独立性。判定の主はUI要素・遷移）。
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/(customer/)?customer_group(\\?|$)`);
// 既存グループの編集フォーム画面（設計/実装どちらのパスでも成立）。
const EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/(customer/)?customer_group/\\d+(\\?|$)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
}

test.describe(
  "管理画面 > 会員管理 > 顧客グループ管理",
  { tag: ["@admin", "@customer"] },
  () => {
    // ===== 入口・権限（資格情報不要で観測可） =====

    test("E2E-M08-12-040 未ログインで顧客グループ管理URLへ直接アクセスすると管理ログイン画面へ誘導", async ({
      page,
    }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/customer/customer_group`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 一覧・フォーム表示（SEED-M08-12-ADMIN） =====

    test("E2E-M08-12-001 顧客グループ管理画面を開くと登録済み一覧と登録フォームが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M08-12-ADMIN 未設定（ECCUBE_ADMIN_USER/PASS）");
      await login(page);
      const m = new CustomerCustomerGroupPage(page);
      await m.gotoList();
      await expect(m.cardTitle.first()).toContainText("顧客グループ管理"); // 見出し
      await expect(m.groupTable).toBeVisible(); // 登録済みグループ一覧
      await expect(m.nameInput).toBeVisible(); // 登録フォーム
    });

    test("E2E-M08-12-002 登録フォームに名称入力欄と登録ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M08-12-ADMIN 未設定");
      await login(page);
      const m = new CustomerCustomerGroupPage(page);
      await m.gotoList();
      await m.seeListForm();
    });

    test("E2E-M08-12-011 名称未入力で登録すると登録されず登録フォーム画面に留まる", async ({
      page,
    }) => {
      // 仕様: 顧客グループ名は必須。未入力は検証失敗で一覧画面を再表示し、登録しない。
      test.skip(!HAS_CREDS, "SEED-M08-12-ADMIN 未設定");
      await login(page);
      const m = new CustomerCustomerGroupPage(page);
      await m.gotoList();
      await m.submitName(""); // 名称を空のまま登録
      // 検証失敗時は一覧画面を再表示（新規登録は完了しない＝一覧/フォーム画面に留まる）。
      await expect(page).toHaveURL(LIST_RE);
      await expect(m.nameInput).toBeVisible();
    });

    // ===== 既存グループ編集フォーム・削除モーダル表示（SEED-M08-12-GROUP・非破壊） =====

    test("E2E-M08-12-020 一覧の名称リンクから編集フォーム画面へ遷移し現行値が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_GROUP, "SEED-M08-12-GROUP 未設定（M08_12_GROUP_ID）");
      await login(page);
      const m = new CustomerCustomerGroupPage(page);
      // 仕様(画面遷移: 一覧の名称リンク→編集フォーム)どおり、一覧からリンクをクリックして遷移する（直アクセスにしない）。
      await m.gotoList();
      await m.groupEditLink(GROUP_ID).first().click();
      await expect(page).toHaveURL(EDIT_RE);
      await expect(m.nameInput).toBeVisible();
      if (GROUP_NAME) {
        await expect(m.nameInput).toHaveValue(GROUP_NAME); // 編集は現行値を初期表示
      }
    });

    test("E2E-M08-12-022 編集で名称を空にして更新すると更新されず画面に留まる", async ({
      page,
    }) => {
      // 仕様: 必須の名称を空にした更新は検証失敗で一覧画面を再表示し、更新しない（非破壊：保存に到達しない）。
      test.skip(!HAS_GROUP, "SEED-M08-12-GROUP 未設定");
      await login(page);
      const m = new CustomerCustomerGroupPage(page);
      await m.gotoEdit(GROUP_ID);
      await m.submitName(""); // 名称を空にして更新
      await expect(m.nameInput).toBeVisible(); // 更新完了せずフォームに留まる
    });

    test("E2E-M08-12-030 削除ボタン押下で削除確認モーダルが表示され対象を特定できる", async ({
      page,
    }) => {
      test.skip(!HAS_GROUP, "SEED-M08-12-GROUP 未設定");
      await login(page);
      const m = new CustomerCustomerGroupPage(page);
      await m.gotoList();
      await m.deleteOpenButton(GROUP_ID).first().click();
      await expect(m.deleteModal(GROUP_ID)).toBeVisible();
      // IT-25 確認ダイアログ: 削除対象を特定できること。確認文に当該グループ名称（データ）が表示される。
      if (GROUP_NAME) {
        await expect(m.deleteModal(GROUP_ID)).toContainText(GROUP_NAME);
      }
    });

    test("E2E-M08-12-033 削除確認モーダルでキャンセルすると削除されずモーダルが閉じる", async ({
      page,
    }) => {
      // 仕様(IT-25 確認ダイアログ): キャンセル＝破壊操作の中止。削除は実行されず対象が一覧に残る（非破壊）。
      test.skip(!HAS_GROUP, "SEED-M08-12-GROUP 未設定");
      await login(page);
      const m = new CustomerCustomerGroupPage(page);
      await m.gotoList();
      await m.deleteOpenButton(GROUP_ID).first().click();
      await expect(m.deleteModal(GROUP_ID)).toBeVisible();
      await m.deleteCancelButton(GROUP_ID).click(); // キャンセル（data-bs-dismiss=modal）
      await expect(m.deleteModal(GROUP_ID)).toBeHidden(); // モーダルが閉じる
      await expect(m.groupEditLink(GROUP_ID).first()).toBeVisible(); // 当該グループは一覧に残る（削除されない）
    });

    // ===== 保留（破壊的/要実機確認/仕様乖離検出見込み。手動・対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M08-12-010 名称を入力し登録すると一覧へ戻り新規グループが一覧に表示される（破壊的: レコード作成。使い捨て名称＋撤去前提）",
      async () => {
        // 期待は仕様(処理フロー 登録成功→一覧へ戻る／IT-26 登録内容)由来。
        // 注: 実装フォームは point_percentage が必須のため、設計どおり名称のみでは検証エラーになる見込み（不具合候補#2）。
        //     テストは仕様(名称のみ必須)どおりに書き、落ちて検出する。SEED-M08-12-NEW(使い捨て接頭辞)が必要。
      }
    );

    test.fixme(
      "E2E-M08-12-012 名称255文字（最大長・境界内）で登録すると登録に成功する（破壊的: レコード作成）",
      async () => {
        // 期待は仕様(入力項目 名称 最大長255)由来。255文字は登録成功し一覧に表示される。使い捨て名称で実行。
      }
    );

    test.fixme(
      "E2E-M08-12-013 名称256文字（最大長+1・境界外）で登録するとエラーで登録されない（仕様乖離検出見込み・破壊的）",
      async () => {
        // 期待は仕様(入力項目 名称 最大長255)由来。256文字は検証エラーで登録されないことを期待する。
        // 実装フォームは name に Length 制約を持たず required のみ（不具合候補#3）のため、フォーム検証では弾かれずDB列長依存になる見込み。
        // テストは仕様どおり「エラーで登録されない」を期待し、落ちて検出する。
      }
    );

    test.fixme(
      "E2E-M08-12-014 名称1文字（最小長・境界内）で登録すると登録に成功する（破壊的: レコード作成）",
      async () => {
        // 期待は仕様(入力項目 名称 最小長境界＝1文字以上は許容)由来。1文字は登録成功し一覧に表示される。
        // 255最大長(012)とは別境界。使い捨て名称(SEED-M08-12-NEW 接頭辞)で実行する。
      }
    );

    test.fixme(
      "E2E-M08-12-023 編集で名称256文字（最大長+1）に変更して更新するとエラーで更新されない（仕様乖離検出見込み・破壊的）",
      async () => {
        // 期待は仕様(入力項目 名称 最大長255)由来。更新側でも256文字は検証エラーで更新されないことを期待する。
        // 登録・更新は同一 index アクション＋同一 CustomerGroupType フォーム（付帯表4#8）。
        // 実装フォームは name に Length 制約を持たず required のみ（不具合候補#3）のため落ちて検出する見込み。専用グループ(SEED-M08-12-GROUP-MUT)で実行。
      }
    );

    test.fixme(
      "E2E-M08-12-021 既存グループの名称を変更して更新すると一覧に変更後の名称が表示される（破壊的: レコード更新。専用グループで実行）",
      async () => {
        // 期待は仕様(処理フロー 更新成功→一覧へ戻る／IT-26 更新内容)由来。専用の使い捨てグループ(SEED-M08-12-GROUP-MUT)で実行。
      }
    );

    test.fixme(
      "E2E-M08-12-031 削除確認モーダルで削除実行すると一覧から当該グループが消える（破壊的: レコード削除。専用グループで実行）",
      async () => {
        // 期待は仕様(処理フロー 削除→一覧へ戻る／IT-26)由来。削除実行リンクは data-method=delete でDELETE発火（JS依存・要実機確認）。
        // 専用の使い捨てグループ(SEED-M08-12-GROUP-DEL)で実行する。
      }
    );

    test.fixme(
      "E2E-M08-12-032 会員が使用中のグループを削除しようとすると削除されずエラーが表示される（仕様乖離・要シード）",
      async () => {
        // 実装固有分岐（Controller.php:79-84 players.count>0 で削除拒否 delete_failed）。設計書には削除拒否分岐の記載が無い（不具合候補#4）。
        // 仕様(削除＝指定したグループを削除する)を上位オラクルとしつつ、刷新先の利用中削除拒否挙動の有無を要確認。会員が紐づくグループ(SEED-M08-12-GROUP-INUSE)が必要。
      }
    );
  }
);
