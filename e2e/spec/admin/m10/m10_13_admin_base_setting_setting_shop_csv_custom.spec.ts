/**
 * 管理画面 店舗設定 > カスタムCSV出力項目設定 E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m10_13_admin_base_setting_setting_shop_csv_custom_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち非破壊で安全に実行できるケースのみ test 本体で実装し、
 * 保存(POST=dtb_csv_extension/dtb_csv_csv_extension 更新)・削除(DELETE)・要シード・要改ざん・DB値の間接確認は
 * test.fixme（理由付き）で残す。手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様（正本 pf-eccube3 md / 観点表 / 基本設計）由来（オラクル独立性）。
 * pf-eccube3 リバース設計と刷新先 ec-cube-enterprise の表示文言・選択肢の乖離はケース表「付帯表4」に出し、テストは仕様どおりに書く。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / m09-m10系）に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針（安全第一・共有環境）:
 *  - 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 種別/定義切替・直接アクセス・JSリスト操作（移送/順序）は DOM 内のみで保存しないため安全に実行できる。
 *  - 保存成功(030/031/032/033)・削除(050)・CSRF不正削除(051)は破壊的/要改ざん/DB観測のため test.fixme。
 *
 * 環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { BaseSettingSettingShopCsvCustomPage } from "../../../pages/admin/m10/m10_13_admin_base_setting_setting_shop_csv_custom.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// URLアサーションは管理ルート(ECCUBE_ADMIN_ROUTE)込みで判定し、別ルートへの誤遷移を取りこぼさない。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const CUSTOM_RE = (typeId: number) =>
  new RegExp(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/custom_csv/${typeId}(/|\\?|$)`);

/** 管理ログインしてからカスタムCSV出力項目設定画面（指定種別）を開く。 */
async function gotoCustomAsAdmin(
  page: Page,
  csvTypeId: number = BaseSettingSettingShopCsvCustomPage.CSV_TYPE_PRODUCT
): Promise<BaseSettingSettingShopCsvCustomPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const cc = new BaseSettingSettingShopCsvCustomPage(page);
  await cc.goto(csvTypeId);
  return cc;
}

test.describe(
  "管理画面 > 店舗設定 > カスタムCSV出力項目設定",
  { tag: ["@admin", "@setting"] },
  () => {
    // ===== 表示（GET・非破壊） =====

    test("E2E-M10-13-001 既定種別(商品CSV)で画面が開き「CSV出力項目」見出しが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cc = await gotoCustomAsAdmin(page);
      await expect(page).toHaveURL(CUSTOM_RE(BaseSettingSettingShopCsvCustomPage.CSV_TYPE_PRODUCT));
      await expect(page.locator("body")).toContainText(cc.columnsLabel);
    });

    test("E2E-M10-13-002 サブタイトルに「カスタムCSV出力項目設定」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cc = await gotoCustomAsAdmin(page);
      // 期待は仕様（フロント挙動「サブタイトル『カスタムCSV出力項目設定』」）由来。
      // 刷新先は別文言「基本情報設定」を表示（付帯表4 不具合候補#2）。テストは仕様文言を期待し、
      // 乖離は「落として検出」する。セレクタは創作せず body のテキスト包含で観測する。
      await expect(page.locator("body")).toContainText(cc.subTitleSpec);
    });

    test("E2E-M10-13-003 CSV種別/カスタムCSV/出力名/左右マルチセレクト/設定ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cc = await gotoCustomAsAdmin(page);
      await cc.seeForm();
    });

    test("E2E-M10-13-004 中央の移送ボタン4種と右の順序ボタン4種が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cc = await gotoCustomAsAdmin(page);
      await cc.seeOperationButtons();
    });

    test("E2E-M10-13-005 新規作成状態(カスタム定義未指定)では削除ボタンが表示されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cc = await gotoCustomAsAdmin(page);
      // 設計書「フロント挙動」: 削除リンクは既存定義時のみ。新規(csvExtensionId 無し)では非表示。
      await expect(cc.deleteButton).toHaveCount(0);
    });

    test("E2E-M10-13-006 CSV種別セレクトの選択肢が商品・受注・配送の3種のみである", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cc = await gotoCustomAsAdmin(page);
      // 期待は仕様（業務ルール「商品・受注・配送の3種に限定」）由来。選択肢は当該3種「のみ」であること。
      // テストは仕様どおりに書く。刷新先は会員/在庫系も掲載（付帯表4 不具合候補#1）のため、本アサーションは
      // 超過掲載を「落として検出」する（仕様乖離を可視化）。存在のみの緩い判定にしない。
      const values = (await cc.typeOptionValues()).map(Number).sort((a, b) => a - b);
      expect(values).toEqual([
        BaseSettingSettingShopCsvCustomPage.CSV_TYPE_PRODUCT,
        BaseSettingSettingShopCsvCustomPage.CSV_TYPE_ORDER,
        BaseSettingSettingShopCsvCustomPage.CSV_TYPE_SHIPPING,
      ]);
    });

    test("E2E-M10-13-007 ページタイトルに「システム設定」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cc = await gotoCustomAsAdmin(page);
      // 期待は仕様（フロント挙動「ページタイトル『システム設定』」md:83）由来。
      // 刷新先 title block は「カスタムCSV」を表示（付帯表4 #2）。テストは仕様文言を期待し乖離は落として検出する。
      await expect(page.locator("body")).toContainText(cc.pageTitleSpec);
    });

    test("E2E-M10-13-009 新規状態では右リストが空・左リストに当種別の出力項目が重複なく表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cc = await gotoCustomAsAdmin(page);
      // 期待は仕様（処理フロー(GET)#4「右=紐付け項目、左=同種別の残りを sort_no/id 順」md:99。新規は紐付けなし）由来。
      const right = await cc.outputOptions.count();
      const left = await cc.notOutputOptions.count();
      expect(right).toBe(0); // 新規(定義未指定)は右リストに紐付けが無い
      test.skip(left === 0, "当種別の dtb_csv が0件のため左リスト構成を観測できない（要シード）");
      // 左右に同一主キーが重複しないこと（GET構築条件）。右が空なので左の値が一意であることを確認する。
      const leftValues = await cc.notOutput
        .locator("option")
        .evaluateAll((els) => els.map((e) => (e as HTMLOptionElement).value));
      expect(new Set(leftValues).size).toBe(leftValues.length);
    });

    // ===== 種別・定義切替（GET・非破壊） =====

    test("E2E-M10-13-010 CSV種別セレクト変更で当該種別IDのGETへ遷移し再読み込みされる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cc = await gotoCustomAsAdmin(page, BaseSettingSettingShopCsvCustomPage.CSV_TYPE_PRODUCT);
      await cc.changeType(BaseSettingSettingShopCsvCustomPage.CSV_TYPE_ORDER);
      await expect(page).toHaveURL(CUSTOM_RE(BaseSettingSettingShopCsvCustomPage.CSV_TYPE_ORDER));
    });

    test("E2E-M10-13-011 種別ID直接指定で当該種別が選択された状態で開ける", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cc = await gotoCustomAsAdmin(page, BaseSettingSettingShopCsvCustomPage.CSV_TYPE_SHIPPING);
      await expect(page).toHaveURL(CUSTOM_RE(BaseSettingSettingShopCsvCustomPage.CSV_TYPE_SHIPPING));
      expect(await cc.selectedTypeValue()).toBe(
        String(BaseSettingSettingShopCsvCustomPage.CSV_TYPE_SHIPPING)
      );
    });

    // ===== JSリスト操作（クライアント側DOM・保存しない・非破壊） =====

    test("E2E-M10-13-020 「出力」ボタンで左の選択項目が右へDOM移動し保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cc = await gotoCustomAsAdmin(page);
      const leftBefore = await cc.notOutputOptions.count();
      test.skip(leftBefore === 0, "当種別の「出力しない項目」が0件のため移送を観測できない（要シード）");
      const rightBefore = await cc.outputOptions.count();
      await cc.transferFirstToOutput();
      expect(await cc.outputOptions.count()).toBe(rightBefore + 1);
      expect(await cc.notOutputOptions.count()).toBe(leftBefore - 1);
      // 画面遷移せず保存もしない（クライアントJSのみ）。
      await expect(page).toHaveURL(CUSTOM_RE(BaseSettingSettingShopCsvCustomPage.CSV_TYPE_PRODUCT));
    });

    test("E2E-M10-13-021 「すべて出力」で左の全項目が右へ移動する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cc = await gotoCustomAsAdmin(page);
      const leftBefore = await cc.notOutputOptions.count();
      const rightBefore = await cc.outputOptions.count();
      await cc.transferAllToOutput();
      expect(await cc.notOutputOptions.count()).toBe(0);
      expect(await cc.outputOptions.count()).toBe(leftBefore + rightBefore);
    });

    test("E2E-M10-13-022 「すべて解除」で右の全項目が左へ移動する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cc = await gotoCustomAsAdmin(page);
      const leftBefore = await cc.notOutputOptions.count();
      const rightBefore = await cc.outputOptions.count();
      await cc.releaseAllToNotOutput();
      expect(await cc.outputOptions.count()).toBe(0);
      expect(await cc.notOutputOptions.count()).toBe(leftBefore + rightBefore);
    });

    test("E2E-M10-13-023 「一番下へ」で右リストの選択行が末尾へ並べ替わる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cc = await gotoCustomAsAdmin(page);
      // 並べ替え観測には右リストに2件以上必要。0件なら左から全出力で用意してから検証する。
      if ((await cc.outputOptions.count()) < 2) {
        await cc.transferAllToOutput();
      }
      test.skip(
        (await cc.outputOptions.count()) < 2,
        "右リストが2件未満のため順序入替を観測できない（要シード）"
      );
      const first = cc.output.locator("option").first();
      const firstLabel = (await first.textContent())?.trim() ?? "";
      await first.evaluate((el: HTMLOptionElement) => {
        el.selected = true;
      });
      await cc.moveBottom.click();
      const lastLabel = (await cc.output.locator("option").last().textContent())?.trim() ?? "";
      expect(lastLabel).toBe(firstLabel); // 先頭行が末尾へ移動する
    });

    test("E2E-M10-13-024 「解除」で右の選択項目が左へDOM移動し保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cc = await gotoCustomAsAdmin(page);
      // 右に項目が無ければ左から1件移してから検証する（非破壊）。
      if ((await cc.outputOptions.count()) === 0) {
        test.skip(
          (await cc.notOutputOptions.count()) === 0,
          "左右いずれも0件のため移送を観測できない（要シード）"
        );
        await cc.transferFirstToOutput();
      }
      const rightBefore = await cc.outputOptions.count();
      const leftBefore = await cc.notOutputOptions.count();
      await cc.releaseFirstToNotOutput();
      expect(await cc.outputOptions.count()).toBe(rightBefore - 1);
      expect(await cc.notOutputOptions.count()).toBe(leftBefore + 1);
      await expect(page).toHaveURL(CUSTOM_RE(BaseSettingSettingShopCsvCustomPage.CSV_TYPE_PRODUCT));
    });

    test("E2E-M10-13-025 「一つ上へ」で右リストの選択行が一つ上へ並べ替わる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cc = await gotoCustomAsAdmin(page);
      if ((await cc.outputOptions.count()) < 2) await cc.transferAllToOutput();
      test.skip((await cc.outputOptions.count()) < 2, "右リストが2件未満のため順序入替を観測できない（要シード）");
      const second = cc.output.locator("option").nth(1);
      const secondLabel = (await second.textContent())?.trim() ?? "";
      await cc.selectOutputOption(1);
      await cc.moveUp.click();
      const firstLabel = (await cc.output.locator("option").first().textContent())?.trim() ?? "";
      expect(firstLabel).toBe(secondLabel); // 2番目だった行が先頭(=一つ上)へ移動する
    });

    test("E2E-M10-13-026 「一つ下へ」で右リストの選択行が一つ下へ並べ替わる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cc = await gotoCustomAsAdmin(page);
      if ((await cc.outputOptions.count()) < 2) await cc.transferAllToOutput();
      test.skip((await cc.outputOptions.count()) < 2, "右リストが2件未満のため順序入替を観測できない（要シード）");
      const first = cc.output.locator("option").first();
      const firstLabel = (await first.textContent())?.trim() ?? "";
      await cc.selectOutputOption(0);
      await cc.moveDown.click();
      const secondLabel = (await cc.output.locator("option").nth(1).textContent())?.trim() ?? "";
      expect(secondLabel).toBe(firstLabel); // 先頭だった行が2番目(=一つ下)へ移動する
    });

    test("E2E-M10-13-027 「一番上へ」で右リストの選択行が先頭へ並べ替わる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cc = await gotoCustomAsAdmin(page);
      if ((await cc.outputOptions.count()) < 2) await cc.transferAllToOutput();
      test.skip((await cc.outputOptions.count()) < 2, "右リストが2件未満のため順序入替を観測できない（要シード）");
      const last = cc.output.locator("option").last();
      const lastLabel = (await last.textContent())?.trim() ?? "";
      const lastIndex = (await cc.outputOptions.count()) - 1;
      await cc.selectOutputOption(lastIndex);
      await cc.moveTop.click();
      const firstLabel = (await cc.output.locator("option").first().textContent())?.trim() ?? "";
      expect(firstLabel).toBe(lastLabel); // 末尾だった行が先頭(=一番上)へ移動する
    });

    // ===== エラー・直接アクセス（非破壊で実行可能） =====

    test("E2E-M10-13-040 存在しないCSV種別IDで画面を開くとNotFound(404)になる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cc = await gotoCustomAsAdmin(page);
      // 期待は仕様（エラー処理「不正なCSV種別ID→該当HTTPエラー」）由来。
      const res = await page.request.get(cc.url(999999));
      expect(res.status()).toBe(404);
    });

    test("E2E-M10-13-041 存在しないカスタム定義IDで画面を開くとNotFound(404)になる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cc = await gotoCustomAsAdmin(page);
      // 期待は仕様（エラー処理「不正なカスタム定義ID(GET)→該当HTTPエラー」）由来。
      const res = await page.request.get(
        cc.url(BaseSettingSettingShopCsvCustomPage.CSV_TYPE_PRODUCT, 999999)
      );
      expect(res.status()).toBe(404);
    });

    test("E2E-M10-13-042 未認証で当画面URLへ直接アクセスすると管理ログイン画面へ誘導される", async ({ page }) => {
      // 資格情報不要（未ログイン前提）。期待は仕様（権限・認可「未ログインは共通認証フローへ誘導」）由来。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/custom_csv/1`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M10-13-052 存在しないカスタム定義IDの削除リクエストは該当HTTPエラー(404)になる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const cc = await gotoCustomAsAdmin(page);
      // 期待は仕様（エラー処理「削除時に対象なし→該当HTTPエラー」md:272）由来。存在しないIDのためDBは破壊しない（非破壊）。
      // CSRFトークン不一致と区別するため、当画面の有効トークンを付与して「対象なし」分岐に到達させる。
      const token = await cc.csrfToken.inputValue();
      const res = await page.request.fetch(cc.deleteUrl(999999), {
        method: "DELETE",
        form: { _token: token },
      });
      expect(res.status()).toBe(404);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M10-13-013 カスタムCSVで「新規作成」を選ぶと定義IDなしGET（新規状態）へ遷移（要: 既存カスタム定義シード）",
      async () => {
        // 期待は仕様（画面遷移「カスタム定義セレクト変更→未定義(新規)のGET」md:72 / JS空値→extensionId無し twig:54-60）由来。
        // 既存定義(SEED-M10-13-CUSTOM-DEF)を開いた状態からセレクト先頭「新規作成」を選び、定義ID無しURLへ戻ることを観測する。
      }
    );

    test.fixme(
      "E2E-M10-13-012 カスタムCSVセレクト変更で定義ID付きGETへ遷移（要: 既存カスタム定義シード）",
      async () => {
        // 期待は仕様（画面遷移「カスタムCSVセレクト変更→定義ID付きGET」）由来。既存定義(SEED-M10-13-CUSTOM-DEF)投入後に実装。
      }
    );

    test.fixme(
      "E2E-M10-13-030 「設定」押下で成功フラッシュ「CSV出力項目を保存しました。」が表示される（破壊的: dtb_csv_extension/dtb_csv_csv_extension を保存。要: 使い捨てシードと後始末）",
      async () => {
        // 期待は仕様（処理フロー(POST)・成功メッセージ）由来。文言の正は仕様（messages.ja.yaml admin.setting.shop.csv.save.complete）。
        // POST は isValid() を経由せず生パラメータを保存するため、専用CSV種別での使い捨て定義＋保存後の撤去を用意してから実装する。
      }
    );

    test.fixme(
      "E2E-M10-13-031 保存成功後に定義ID付きで同一機能のGETへリダイレクト再表示される（破壊的）",
      async () => {
        // 期待は仕様（画面遷移「保存成功→同一機能GET(定義ID付き)」CustomerCsvController.php:84）由来。030と同じ使い捨てシードで実装。
      }
    );

    test.fixme(
      "E2E-M10-13-032 保存後に定義を再表示すると右リストが保存した順序(rank)と一致する（破壊的・間接DB確認）",
      async () => {
        // 期待は仕様（処理フロー(POST)#5「配列添字を0起算 rank として保存」）由来。並べ替え→保存→再GETで右リスト順序の一致を観測する。
      }
    );

    test.fixme(
      "E2E-M10-13-033 既存定義の更新で旧 dtb_csv_csv_extension を全削除し右リスト並びで再登録する（破壊的・間接DB確認）",
      async () => {
        // 期待は仕様（処理フロー(POST)#3「同一定義の紐付け行を一括削除してから再挿入」）由来。更新前後の紐付け件数/順序差を再GETで観測する。
      }
    );

    test.fixme(
      "E2E-M10-13-050 削除モーダルから削除実行で定義が削除され新規状態へリダイレクトし「削除しました」が表示される（破壊的・要シード）",
      async () => {
        // 期待は仕様（処理フロー(DELETE)・画面遷移「削除成功→トップ相当へ」CustomerCsvController.php:105）由来。
        // 使い捨て定義(SEED-M10-13-CUSTOM-DEF)に対し DeleteModal→delete アンカー(data-method=delete)で実行する。
      }
    );

    test.fixme(
      "E2E-M10-13-051 CSRFトークン不正のDELETEはアクセス拒否となり削除されない（要: トークン改ざん）",
      async () => {
        // 期待は仕様（エラー処理「CSRF不一致→アクセス拒否例外」）由来＝「アクセス拒否となり定義が残る」こと。
        // HTTPステータス(403等)は共通CSRFリスナー実装に依存し当機能のControllerに明示検証が無い（付帯表4 #5: 根拠 file:line 要確認）。
        // よって固定ステータスをオラクル化せず、拒否(2xx成功でない)かつ定義が残ることを観測する。
      }
    );
  }
);
