/**
 * 管理画面 商品規格 登録/編集（M03-09）E2E。
 * 納品ケース表 integration_test/e2e/m03_09_admin_product_product_class_edit_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装し、要シード/破壊的/仕様乖離で自動化予定だが未実装のものは
 * test.fixme（理由付き）。手動/間接・対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約準拠）。
 * 期待結果は仕様(functions/pf-eccube3/m03-09_admin_product_product_class_edit.md / 観点表)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 重要（仕様乖離の検出方針）: 期待結果は設計書(pf-eccube3 リバース詳細設計)由来で固定し、
 * 実装(ec-cube-enterprise)の現挙動に合わせて書き換えない。設計と実装の食い違い（成功/失敗フラッシュ文言、
 * 更新成功時の遷移先、商品コード必須/任意、代表画像必須、最後の1件削除のHTTP400 など）は
 * ケース表 付帯表4 に列挙し、当該テストは「失敗＝乖離検出見込み」を注記する。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報・対象データは環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（未設定時は認証必須ケースを test.skip）
 *  - PC_PRODUCT_ID        : 規格を1件以上持つ商品ID（新規画面・編集画面の対象）
 *  - PC_PRODUCT_CLASS_ID  : PC_PRODUCT_ID 配下の既存規格ID（編集画面の対象）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductClassEditPage } from "../../../pages/admin/m03/m03_09_admin_product_product_class_edit.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const PC_PRODUCT_ID = process.env.PC_PRODUCT_ID || "";
const PC_PRODUCT_CLASS_ID = process.env.PC_PRODUCT_CLASS_ID || "";
const HAS_NEW = HAS_CREDS && !!PC_PRODUCT_ID; // 新規画面の対象商品あり
const HAS_SEED = HAS_NEW && !!PC_PRODUCT_CLASS_ID; // 編集画面の対象規格あり

const HOME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/?(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;
// 更新成功時、設計は「同じ規格の編集画面へリダイレクト」を要求する（付帯表4 #3：実装は規格一覧へ遷移＝乖離）。
const EDIT_RE = /\/product\/product\/class\/\d+\/edit\/\d+/;

/** 管理ログインしてホームへ到達する。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).toHaveURL(HOME_RE);
}

test.describe(
  "管理画面 > 商品規格 登録/編集",
  { tag: ["@admin", "@product"] },
  () => {
    // ===== 権限・認可（資格情報不要・非破壊） =====

    test("E2E-M03-09-050 未ログインで編集URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      // 設計「権限・認可」: 未ログインは管理ログイン誘導に従う（利用不可）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/product/class/1/edit/1`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M03-09-051 未ログインで新規登録URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/product/class/1/new`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== エラー処理（要creds・非破壊） =====

    test("E2E-M03-09-061 存在しない商品IDで新規画面→見つからない(404)", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      // 設計「エラー処理」: 商品が存在しなければ HTTP404。存在しない巨大IDを用いる。
      const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/product/class/999999999/new`);
      expect(res?.status()).toBe(404);
    });

    test("E2E-M03-09-060 存在しない規格IDで編集画面→見つからない(404)", async ({ page }) => {
      test.skip(!HAS_NEW, "PC_PRODUCT_ID 未設定（実在商品ID）");
      await loginToHome(page);
      // 設計「エラー処理」: 規格が存在しなければ HTTP404。実在商品＋存在しない規格ID。
      const res = await page.goto(
        `/${ECCUBE_ADMIN_ROUTE}/product/product/class/${PC_PRODUCT_ID}/edit/999999999`
      );
      expect(res?.status()).toBe(404);
    });

    // ===== 新規登録画面の表示（要creds＋対象商品） =====

    test("E2E-M03-09-001 新規登録画面に見出し「商品規格登録」・登録ボタン・一覧リンクが表示される", async ({ page }) => {
      test.skip(!HAS_NEW, "PC_PRODUCT_ID 未設定");
      await loginToHome(page);
      const sc = new ProductProductClassEditPage(page);
      await sc.gotoNew(PC_PRODUCT_ID);
      await sc.seeForm();
    });

    test("E2E-M03-09-002 新規登録画面では言語・状態が選択欄(有効なselect)で表示される", async ({ page }) => {
      test.skip(!HAS_NEW, "PC_PRODUCT_ID 未設定");
      await loginToHome(page);
      const sc = new ProductProductClassEditPage(page);
      await sc.gotoNew(PC_PRODUCT_ID);
      // 設計「言語・状態の入力切替」: 新規は選択欄として表示（編集時の読み取り表示と対）。
      await expect(sc.language).toBeVisible();
      await expect(sc.language).toBeEnabled();
      await expect(sc.cardCondition).toBeVisible();
      await expect(sc.cardCondition).toBeEnabled();
    });

    test("E2E-M03-09-003 新規登録画面では商品規格ID行と削除ボタンが表示されない", async ({ page }) => {
      test.skip(!HAS_NEW, "PC_PRODUCT_ID 未設定");
      await loginToHome(page);
      const sc = new ProductProductClassEditPage(page);
      await sc.gotoNew(PC_PRODUCT_ID);
      // 設計「フロント挙動」: 商品規格IDは編集時のみ、削除ボタンは削除可能(=編集)時のみ。
      await expect(sc.productClassIdRow).toHaveCount(0);
      await expect(sc.deleteButton).toHaveCount(0);
    });

    // ===== 編集画面の表示（要creds＋対象規格） =====

    test("E2E-M03-09-010 編集画面に商品規格IDが表示され現行値がフォームに載る", async ({ page }) => {
      test.skip(!HAS_SEED, "PC_PRODUCT_ID/PC_PRODUCT_CLASS_ID 未設定");
      await loginToHome(page);
      const sc = new ProductProductClassEditPage(page);
      await sc.gotoEdit(PC_PRODUCT_ID, PC_PRODUCT_CLASS_ID);
      await sc.seeForm();
      // 設計「規格の編集画面」: 商品規格IDを表示し現行値を初期表示する。
      await expect(sc.productClassIdRow).toBeVisible();
      await expect(sc.price02).not.toHaveValue(""); // 現行の販売価格が初期表示される
    });

    test("E2E-M03-09-011 編集画面では言語・状態が読み取り表示(変更不可)である", async ({ page }) => {
      test.skip(!HAS_SEED, "PC_PRODUCT_ID/PC_PRODUCT_CLASS_ID 未設定");
      await loginToHome(page);
      const sc = new ProductProductClassEditPage(page);
      await sc.gotoEdit(PC_PRODUCT_ID, PC_PRODUCT_CLASS_ID);
      // 設計「言語・状態の固定」: 編集では変更せず読み取り表示（実装は disabled+hidden）。
      await expect(sc.language).toBeDisabled();
      await expect(sc.cardCondition).toBeDisabled();
    });

    test("E2E-M03-09-012 編集画面に削除ボタン「削除」が表示される", async ({ page }) => {
      test.skip(!HAS_SEED, "PC_PRODUCT_ID/PC_PRODUCT_CLASS_ID 未設定");
      await loginToHome(page);
      const sc = new ProductProductClassEditPage(page);
      await sc.gotoEdit(PC_PRODUCT_ID, PC_PRODUCT_CLASS_ID);
      await expect(sc.deleteButton).toBeVisible();
      await expect(sc.deleteButton).toContainText("削除");
    });

    test("E2E-M03-09-013 編集画面の削除ボタン押下で確認ダイアログ(モーダル)が表示される", async ({ page }) => {
      test.skip(!HAS_SEED, "PC_PRODUCT_ID/PC_PRODUCT_CLASS_ID 未設定");
      await loginToHome(page);
      const sc = new ProductProductClassEditPage(page);
      await sc.gotoEdit(PC_PRODUCT_ID, PC_PRODUCT_CLASS_ID);
      // 設計「モーダル・ポップアップ」: 削除は確認ダイアログ文言を伴う。
      await sc.deleteButton.click();
      await expect(sc.deleteModal).toBeVisible();
    });

    test("E2E-M03-09-014 編集画面に期間別販売数カードが表示される", async ({ page }) => {
      test.skip(!HAS_SEED, "PC_PRODUCT_ID/PC_PRODUCT_CLASS_ID 未設定");
      await loginToHome(page);
      const sc = new ProductProductClassEditPage(page);
      await sc.gotoEdit(PC_PRODUCT_ID, PC_PRODUCT_CLASS_ID);
      // 設計「フロント挙動」: 編集時は右カラムに期間別販売数を表示。
      await expect(sc.salesQuantityCard).toBeVisible();
    });

    test("E2E-M03-09-020 編集画面に規格固有の主要入力欄が表示される", async ({ page }) => {
      test.skip(!HAS_SEED, "PC_PRODUCT_ID/PC_PRODUCT_CLASS_ID 未設定");
      await loginToHome(page);
      const sc = new ProductProductClassEditPage(page);
      await sc.gotoEdit(PC_PRODUCT_ID, PC_PRODUCT_CLASS_ID);
      await sc.seeMainInputs();
    });

    test("E2E-M03-09-004 商品規格一覧リンク押下で規格一覧画面へ遷移する", async ({ page }) => {
      test.skip(!HAS_NEW, "PC_PRODUCT_ID 未設定");
      await loginToHome(page);
      const sc = new ProductProductClassEditPage(page);
      await sc.gotoNew(PC_PRODUCT_ID);
      // 設計「画面遷移」: 商品規格一覧に戻るリンク→規格一覧（:295）。遷移先パス形は実装依存（付帯表4 #5）。
      // 合否は「新規/編集フォームから離脱し規格一覧へ到達」で判定する（実装文言/ルート名はオラクル化しない）。
      await sc.classListLink.click();
      await expect(page).not.toHaveURL(/\/class\/\d+\/new(\?|$)/);
      await expect(page).toHaveURL(/\/product\/product\//);
    });

    // ===== 自動化予定だが未実装（要シード・破壊的・仕様乖離。手動/対象外はケース表で管理） =====

    test.fixme(
      "E2E-M03-09-030 有効値で登録→成功フラッシュ「登録が完了しました。」表示（要: 投入可能な規格シード一式＋代表画像選択。破壊的）",
      async () => {
        // 期待は設計「表示メッセージ/フラッシュ」(admin.register.complete=登録が完了しました。)由来。
        // 付帯表4 #1: 実装は admin.common.save_complete=「保存しました」を表示する＝乖離（テストは設計文言で落とし検出）。
      }
    );

    test.fixme(
      "E2E-M03-09-031 更新成功後は同じ規格の編集画面へ遷移する（要: 規格シード。破壊的）",
      async () => {
        // 期待は設計「画面遷移/更新成功」(同じ規格の編集画面へリダイレクト)由来。EDIT_RE で判定する。
        // 付帯表4 #3: 実装は規格一覧(admin_product_product_class)へ遷移する＝乖離（テストは設計どおり EDIT_RE を期待し落として検出）。
      }
    );

    test.fixme(
      "E2E-M03-09-032 更新成功後、編集画面に更新後の値が反映表示される(間接)（要: 規格シード。破壊的）",
      async () => {
        // 期待は設計「データ整合性/参照時点」(更新確定後の現行値を初期表示)由来。再表示画面で入力値の一致を確認する。
      }
    );

    test.fixme(
      "E2E-M03-09-033 新規規格を有効値で登録→成功フラッシュ「登録が完了しました。」表示（要: 投入可能な商品シード＋言語/状態選択＋代表画像選択。破壊的）",
      async () => {
        // 期待は設計「概要(新規登録と編集は同一更新処理を共有):5」＋「表示メッセージ(admin.register.complete=登録が完了しました。)」由来。
        // 新規登録画面(/new)から言語・状態を選択して登録する。030(編集更新)とは別経路（新規作成成功）。
        // 付帯表4 #1: 実装は admin.common.save_complete=「保存しました」を表示する＝乖離（テストは設計文言で落とし検出）。
      }
    );

    test.fixme(
      "E2E-M03-09-034 新規登録で言語・状態を未選択にして登録→検証失敗で同一画面に留まる（要: 投入可能な商品シード）",
      async () => {
        // 期待は設計「入力項目(言語・状態 必須・新規のみ選択):157,158」＋「バリデーション:263,264」由来。
        // 新規登録画面でのみ言語・状態を選択できる（編集は読み取り表示=011と対）。
      }
    );

    test.fixme(
      "E2E-M03-09-040 販売価格未入力で登録→検証失敗フラッシュ「登録できませんでした。」表示し同一画面に留まる（要: 規格シード）",
      async () => {
        // 期待は設計「バリデーション(販売価格 必須)」＋「フラッシュ(admin.register.failed=登録できませんでした。)」由来。
        // 付帯表4 #2: 実装は admin.common.save_error=「保存に失敗しました」を表示する＝乖離（テストは設計文言で落とし検出）。
      }
    );

    test.fixme(
      "E2E-M03-09-041 販売価格に数値以外を入力→検証エラー（正の整数のみ許容）で同一画面に留まる（要: 規格シード）",
      async () => {
        // 期待は設計「バリデーション(販売価格 正の整数・Regex数値)」(設計:164,267)由来。
        // 具体的エラー文言は実装i18n(validators.ja.yaml)由来のためオラクル化しない。検証失敗・同一画面留まりで判定する。
      }
    );

    test.fixme(
      "E2E-M03-09-042 買取価格未入力で登録→検証失敗で同一画面に留まる（要: 規格シード）",
      async () => {
        // 期待は設計「バリデーション(買取価格 NotBlank)」由来。
      }
    );

    test.fixme(
      "E2E-M03-09-043 代表画像未選択で登録→検証失敗(必須)（要: 規格シード。仕様乖離）",
      async () => {
        // 期待は設計「バリデーション(代表画像 必須)」由来。
        // 付帯表4 #4: 実装の ProductClassType は ProductClassImages を required=false＝乖離（テストは必須を期待し落として検出）。
      }
    );

    test.fixme(
      "E2E-M03-09-044 部門未選択で登録→検証失敗(必須)（要: 規格シード）",
      async () => {
        // 期待は設計「バリデーション(部門 必須選択)」由来（実装 Section NotBlank＝一致）。
      }
    );

    test.fixme(
      "E2E-M03-09-045 在庫数も在庫無制限も未設定→「在庫数を入力、もしくは在庫無制限を設定してください。」（要確認: 当該編集画面に在庫無制限欄が描画されない＝乖離）",
      async () => {
        // 期待は設計「エッジケース/インライン(admin.product.product_class_set_stock_quantity)」由来。
        // 付帯表4 #6: 実装の単一規格編集フォーム(ProductClassType/edit.twig)は stock_unlimited を描画せず、
        // 当該相関検証は行内一括フォーム(ProductClassEditType)側にあるため、本画面では発火しない見込み＝要確認。
      }
    );

    test.fixme(
      "E2E-M03-09-046 棚番号未選択で登録→検証失敗(必須)で同一画面に留まる（要: 規格シード。仕様乖離）",
      async () => {
        // 期待は設計「入力項目(棚番号 必須選択):173」＋「バリデーション(部門・棚番号 必須選択):271」由来。
        // 付帯表4 #9: 実装の ProductClassType は ShelfNumber を required=false＝乖離（テストは必須を期待し落として検出）。
      }
    );

    test.fixme(
      "E2E-M03-09-047 商品コードを空にして登録→任意のため登録成功する（要: 規格シード。破壊的・仕様乖離）",
      async () => {
        // 期待は設計「入力項目(商品コード 任意):159」由来（観点No.2 任意項目未入力でエラーとならない）。
        // 付帯表4 #8: 実装の ProductClassType は code を NotBlank＝乖離（テストは設計どおり「空でも成功」を期待し落として検出）。
      }
    );

    test.fixme(
      "E2E-M03-09-021 削除可能な規格を削除→規格一覧へ遷移する（要: 規格2件以上のシード。破壊的）",
      async () => {
        // 期待は設計「規格を削除(最後の1件以外は論理削除):124-126」＋「画面遷移/削除成功→規格一覧:294」由来。
        // 070(最後の1件は削除不可=HTTP400)と対の正常系。削除後に規格一覧へ到達することで判定する。
      }
    );

    test.fixme(
      "E2E-M03-09-035 販売制限数に1未満/数値以外を入力→検証失敗で同一画面に留まる（要: 規格シード）",
      async () => {
        // 期待は設計「入力項目(販売制限数 1以上の正の整数):161」＋「バリデーション:266(Length max10・GreaterThanOrEqual1・Regex数値)」由来。
        // 具体的エラー文言は実装i18n由来のためオラクル化しない。検証失敗・同一画面留まりで判定する。
      }
    );

    test.fixme(
      "E2E-M03-09-048 買取価格に数値以外を入力→検証エラー（正の整数のみ許容）で同一画面に留まる（要: 規格シード）",
      async () => {
        // 期待は設計「バリデーション(買取価格 Length max9・正の整数・Regex):268」由来。
        // 042(買取価格未入力=NotBlank)と対の数値異常系。文言はオラクル化しない。
      }
    );

    test.fixme(
      "E2E-M03-09-036 任意項目(帯URL・セールフラグ・高額商品コード・下代・備考)を空にして登録→任意のため登録成功する（要: 規格シード。破壊的）",
      async () => {
        // 期待は設計「入力項目(帯URL・セールフラグ・高額商品コード・下代・備考 任意):167-171」由来。
        // 047(商品コード任意)と同系の任意項目空許容（正常系）。検証失敗とならず登録成功を期待する。
      }
    );

    test.fixme(
      "E2E-M03-09-070 最後の1規格を削除しようとすると削除できない（要: 規格1件のみのシード。破壊的・仕様乖離）",
      async () => {
        // 期待は設計「削除可否/エラー処理」(最後の1件は削除しない＝不正要求 HTTP400)由来。
        // 付帯表4 #7: 実装に「最後の1件」ガードは見当たらず、外部キー制約違反時のみ削除エラー文言を表示する＝乖離（要確認）。
      }
    );
  }
);
