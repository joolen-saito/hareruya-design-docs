/**
 * 管理画面 商品管理 カテゴリ一覧 E2E。納品ケース表
 * integration_test/e2e/m03_45_admin_product_product_category_list_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、並べ替えAjax・外部キー削除・画像検証・階層上限など
 * 要実機確認/要データは test.fixme で残す。手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/pf-eccube3/m03-45_admin_product_product_category_list.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・m03_01 等も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 * 作成(021)/削除(030)は破壊的なため専用シード・後始末を前提とし、データ不足時は test.skip でガードする。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductCategoryListPage } from "../../../pages/admin/m03/m03_45_admin_product_product_category_list.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

const LOGIN_RE = /\/login(\?|$)/;
const ROOT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/category(\\?|$)`);
const SHOW_RE = /\/product\/category\/\d+(\?|$)/;

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const SAVE_COMPLETE = "保存しました"; // :1398 admin.common.save_complete
const DELETE_COMPLETE = "削除しました"; // :1400 admin.common.delete_complete
const CSV_DOWNLOAD = "CSVダウンロード"; // :1546 admin.common.csv_download
const CATEGORY_ALL = "すべてのカテゴリ"; // :1955 admin.product.category_all

/** 管理ログインしてカテゴリ一覧（ルート直下）を開く。 */
async function loginAndOpenList(
  page: Page
): Promise<ProductProductCategoryListPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const list = new ProductProductCategoryListPage(page);
  await list.goto();
  return list;
}

test.describe(
  "管理画面 > 商品管理 > カテゴリ一覧",
  { tag: ["@admin", "@product"] },
  () => {
    // ===== 認証不要 =====

    test("E2E-M03-45-012 未ログインで /product/category 直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/category`);
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可: 未ログインはフォームログインへ
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== ルート一覧 表示（ログインのみ） =====

    test("E2E-M03-45-001 ルート一覧: タイトル帯「商品管理」「カテゴリ一覧」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginAndOpenList(page);
      await expect(page.locator("body")).toContainText("商品管理"); // trans admin.product.product_management
      await expect(page.locator("body")).toContainText("カテゴリ一覧"); // trans admin.product.category_list
    });

    test("E2E-M03-45-002 ルート一覧: CSVダウンロード/CSV出力項目設定ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.seeCsvButtons();
    });

    test("E2E-M03-45-003 ルート一覧: 右カラムに「すべてのカテゴリ」ツリーが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.seeTree();
    });

    test("E2E-M03-45-004 ルート一覧: 上部の入力カードを表示しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様(処理フロー・エッジケース): ルート(親なし)はフォーム開始タグ自体を出力しない。
      await expect(list.inputCard).toHaveCount(0);
      await expect(list.submitButton).toHaveCount(0);
    });

    test("E2E-M03-45-013 ルート一覧: 「CSVダウンロード」押下でファイルダウンロードが発火する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様(CSV出力): ブラウザがファイルとして受け取る（Attachment）。内容検証は手動。
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        list.csvDownloadButton.click(),
      ]);
      expect(download.suggestedFilename().length).toBeGreaterThan(0);
    });

    test("E2E-M03-45-011 ルート一覧: 「CSV出力項目設定」押下でCSV項目設定画面へ遷移する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.csvSettingButton.click();
      await expect(page).toHaveURL(/\/setting\/shop\/csv\//); // admin_setting_shop_csv
    });

    // ===== 404 =====

    test("E2E-M03-45-009 無効な parent_id でアクセスすると404になる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const res = await page.goto(
        `/${ECCUBE_ADMIN_ROUTE}/product/category/99999999`
      );
      expect(res?.status()).toBe(404); // 仕様(エッジケース): 無効parent_id=404
    });

    // ===== 親深掘り・編集・パンくず（データ依存はガード） =====

    test("E2E-M03-45-007 カテゴリ名リンク押下で一段深い親配下一覧(show)へ遷移する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      const count = await list.firstNameLink.count();
      test.skip(count === 0, "ルート直下にカテゴリが無く名前リンクが描画されない（要シード）");
      await list.openFirstChild();
      await expect(page).toHaveURL(SHOW_RE); // 画面遷移: /product/category/{id}
    });

    test("E2E-M03-45-005 親を開くと入力カードと「子カテゴリ作成」ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      const count = await list.firstNameLink.count();
      test.skip(count === 0, "親カテゴリが無く深掘りできない（要シード）");
      await list.openFirstChild();
      await expect(list.nameInput).toBeVisible(); // カテゴリ名(日)入力欄
      await expect(list.submitButton).toContainText("子カテゴリ作成"); // trans category_submit_create_child
    });

    test("E2E-M03-45-006 編集アイコンから開くと変換ボタンが「カテゴリ更新」になる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 編集アイコンはルート直下の各行にも描画される（兄弟一覧）。無い場合はガード。
      const count = await list.firstEditLink.count();
      test.skip(count === 0, "編集対象カテゴリが無い（要シード）");
      await list.openFirstEdit();
      await expect(list.submitButton).toContainText("カテゴリ更新"); // trans category_submit_update（isCategoryEdit）
    });

    test("E2E-M03-45-016 編集画面では画像アップロード欄が出力されない（読み取り専用枠）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      const count = await list.firstEditLink.count();
      test.skip(count === 0, "編集対象カテゴリが無い（要シード）");
      await list.openFirstEdit();
      // 仕様(フロント挙動・処理フロー edit): 編集は allow_image_upload=false。画像ファイル入力欄は非出力。
      await expect(list.bannerImageFile).toHaveCount(0);
    });

    test("E2E-M03-45-014 親配下一覧で兄弟一覧と並べ替え対象コンテナが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      const count = await list.firstNameLink.count();
      test.skip(count === 0, "親カテゴリが無く深掘りできない（要シード）");
      await list.openFirstChild();
      // 仕様(フロント挙動 表示要素): 親配下では兄弟一覧（並べ替え対象集合）が描画される。
      // ヘッダ「ID/カテゴリ」見出し・並べ替え説明文の出力先クラスは要実機確認のためコンテナ存在で確認。
      await expect(list.listContainer).toBeVisible();
    });

    test("E2E-M03-45-008 親配下一覧でパンくず「すべてのカテゴリ」を押下するとルート一覧へ戻る", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      const count = await list.firstNameLink.count();
      test.skip(count === 0, "親カテゴリが無く深掘りできない（要シード）");
      await list.openFirstChild();
      await expect(page).toHaveURL(SHOW_RE);
      await list.breadcrumbRootLink.click();
      await expect(page).toHaveURL(ROOT_RE); // パンくずでルートへ復帰
    });

    // ===== 削除モーダル（表示のみ・非破壊） =====

    test("E2E-M03-45-010 削除アイコン押下で削除確認モーダルが対象名入りで開く", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      const count = await list.firstNameLink.count();
      test.skip(count === 0, "親カテゴリが無く一覧行が無い（要シード）");
      await list.openFirstChild(); // 削除トリガは親配下の兄弟一覧に出る
      const delCount = await list.firstDeleteTrigger.count();
      test.skip(delCount === 0, "削除対象の行が無い（要シード）");
      // 対象名は実行時データ由来。確認文言の体系は仕様(delete_modal__message %name%)由来でオラクル独立。
      const targetName = (await list.firstNameLink.innerText()).trim();
      await list.openFirstDeleteModal();
      await expect(list.deleteModal).toBeVisible();
      // 仕様(確認ダイアログ): 削除確認メッセージに対象カテゴリ名が含まれること（JSで対象名入りメッセージを差し込む）。
      await expect(list.deleteModalMessage).toContainText(targetName);
    });

    // ===== 作成POST 正常×異常の対（データ依存・破壊的はガード） =====

    test("E2E-M03-45-020 子カテゴリ作成: カテゴリ名未入力だと検証エラーで同一画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      const count = await list.firstNameLink.count();
      test.skip(count === 0, "親カテゴリが無く子カテゴリ作成欄を開けない（要シード）");
      await list.openFirstChild();
      await expect(page).toHaveURL(SHOW_RE);
      await list.submitCategoryName(""); // カテゴリ名 NotBlank（空送信）
      // 仕様(エラー処理): 同一Twigを200で再描画＝親配下URLに留まり、検証エラーが出る。
      await expect(page).toHaveURL(SHOW_RE);
      await expect(list.formErrors.first()).toBeVisible();
    });

    test("E2E-M03-45-021 子カテゴリ作成: 有効名で保存成功し親配下一覧へ戻る（破壊的・要後始末）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      const count = await list.firstNameLink.count();
      test.skip(count === 0, "親カテゴリが無く子カテゴリ作成ができない（要シード）");
      await list.openFirstChild();
      const uniqueName = `e2e_cat_${Date.now()}`; // 一意名（後始末対象）
      await list.submitCategoryName(uniqueName);
      // 仕様(処理フロー): 保存成功フラッシュ＋親show一覧へリダイレクト。
      await expect(page.locator("body")).toContainText(SAVE_COMPLETE);
      await expect(page).toHaveURL(SHOW_RE);
      await expect(page.locator("body")).toContainText(uniqueName);
    });

    test("E2E-M03-45-023 子カテゴリ作成: カテゴリ名が上限超過だと検証エラーで留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      const count = await list.firstNameLink.count();
      test.skip(count === 0, "親カテゴリが無く子カテゴリ作成欄を開けない（要シード）");
      await list.openFirstChild();
      // 仕様(バリデーション): カテゴリ名は桁長制約あり。上限値はオラクル化せず明らかな超過で検証。
      await list.submitCategoryName("あ".repeat(1000));
      await expect(page).toHaveURL(SHOW_RE); // 同一Twig 200に留まる
      await expect(list.formErrors.first()).toBeVisible();
    });

    test("E2E-M03-45-080 子カテゴリ作成: カテゴリ名（英）が上限超過だと検証エラーで留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      const count = await list.firstNameLink.count();
      test.skip(count === 0, "親カテゴリが無く子カテゴリ作成欄を開けない（要シード）");
      await list.openFirstChild();
      // 仕様(バリデーション): カテゴリ名(英)は任意だが桁長Length。日名は有効値とし英名の桁超過のみを検証。
      await list.submitWithField(list.nameEnInput, "a".repeat(1000));
      await expect(page).toHaveURL(SHOW_RE); // 同一Twig 200に留まる
      await expect(list.formErrors.first()).toBeVisible();
    });

    test("E2E-M03-45-081 子カテゴリ作成: 検索パラメーターが上限超過だと検証エラーで留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      const count = await list.firstNameLink.count();
      test.skip(count === 0, "親カテゴリが無く子カテゴリ作成欄を開けない（要シード）");
      await list.openFirstChild();
      // 仕様(バリデーション): 検索パラメーターは任意だが桁長Length。日名は有効値とし検索パラメーターの桁超過のみを検証。
      await list.submitWithField(list.searchParametersInput, "a".repeat(5000));
      await expect(page).toHaveURL(SHOW_RE); // 同一Twig 200に留まる
      await expect(list.formErrors.first()).toBeVisible();
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M03-45-022 編集更新: 有効名へ更新し保存成功で一覧へ戻る（要: 専用編集対象＋後始末）",
      async () => {
        // 期待は仕様(処理フロー 更新POST成功→save_complete＋親一覧へ)由来。専用カテゴリのシード後に実装。
      }
    );

    test.fixme(
      "E2E-M03-45-024 編集更新: カテゴリ名未入力は検証エラーで同一Twig200に留まる（要: 専用編集対象）",
      async () => {
        // 期待は仕様(バリデーション 更新時もカテゴリ名NotBlank→同一Twig200再描画)由来。作成020と対の更新異常系。
      }
    );

    test.fixme(
      "E2E-M03-45-025 編集更新: カテゴリ名が上限超過は検証エラーで留まる（要: 専用編集対象）",
      async () => {
        // 期待は仕様(バリデーション 更新時のカテゴリ名桁長超過→同一Twig200)由来。上限値はオラクル化しない。作成023と対の更新異常系。
      }
    );

    test.fixme(
      "E2E-M03-45-030 削除: 子も商品紐づけも無いカテゴリ削除で削除完了フラッシュ（要: SEED-M03-45-DELETABLE・破壊的）",
      async () => {
        // 期待は仕様(削除成功→delete_complete＋一覧へ Controller.php:464)由来。使い捨て削除可能カテゴリ投入後に実装。
        void DELETE_COMPLETE;
      }
    );

    test.fixme(
      "E2E-M03-45-040 並べ替え: ドラッグ/上下移動の確認承認時のみ送信し本文Successful（要: 兄弟2件以上＋dialog/sortable操作の実機確認）",
      async () => {
        // 期待は仕様(並べ替えAjax 本文Successful Controller.php:510)由来。window.confirm(page.on('dialog'))とsortable操作を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M03-45-050 削除: 子/商品紐づけありの削除送信は外部キーエラーで親一覧へ（要: SEED-M03-45-LINKED＋直送信手順）",
      async () => {
        // 期待は仕様(エッジケース・削除論理順序#4 外部キーエラー Controller.php:473)由来。disabled回避の直送信手順を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M03-45-060 子カテゴリ作成: 不正画像のアップロードで検証エラー（要: allow_image_upload時の画像欄＋不正ファイル）",
      async () => {
        // 期待は仕様(バリデーション 画像Image制約＋サーバ側MIME/拡張子 CategoryType.php:73-113)由来。作成フローで実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M03-45-070 保存: 階層上限を超える保存試行はHTTP400（要: SEED-M03-45-DEEP 最深親）",
      async () => {
        // 期待は仕様(保存論理順序#3 eccube_category_nest_level超過→BadRequest Controller.php:293)由来。最深階層シード後に実装。
      }
    );

    test.fixme(
      "E2E-M03-45-026 削除: 不存在idの削除送信は警告フラッシュのみで一覧へ（要: 不存在id＋直送信手順）030の対の異常系",
      async () => {
        // 期待は仕様(削除論理順序#2 削除対象実在 無→警告フラッシュのみ一覧 正本md:96,125,200)由来。直送信手順を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M03-45-041 並べ替え: 非XHRで直送信するとHTTP400（要: 非XHRのPOST直送信）040の対の異常系",
      async () => {
        // 期待は仕様(並べ替え論理順序#1 Ajaxフラグ無→HTTP400 正本md:88,114 / Controller.php:491-492)由来。非XHR直送信手順を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M03-45-042 並べ替え: 確認ダイアログを拒否すると送信されず元並び維持（要: 兄弟2件以上＋dialog dismiss/sortable操作）040の対のキャンセル系",
      async () => {
        // 期待は仕様(JS挙動 確認拒否で元並びへ戻し未送信 正本md:51)由来。page.on('dialog')でdismissしAjax未送信と並び維持を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M03-45-051 送信可否制御: 子/商品紐づけありの削除トリガがdisabled表示（要: SEED-M03-45-LINKED）",
      async () => {
        // 期待は仕様(フロント挙動 送信可否制御 disabledクラス 正本md:171 / category.twig:426)由来。紐づけありカテゴリのシード後に実装。
      }
    );

    test.fixme(
      "E2E-M03-45-061 子カテゴリ作成: 有効画像のアップロードで保存成功（要: allow_image_upload時の画像欄＋有効ファイル）060の対の正常系",
      async () => {
        // 期待は仕様(バリデーション 画像正常系→save_complete Controller.php:212)由来。作成フローで実機確認後に実装。
        void SAVE_COMPLETE;
      }
    );

    void CSV_DOWNLOAD;
    void CATEGORY_ALL;
  }
);
