/**
 * 管理画面 店舗設定 > CSV出力項目設定 E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m10_10_admin_base_setting_setting_shop_csv_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち非破壊で安全に実行できるケースのみ test 本体で実装し、
 * 保存(POST=dtb_csv 更新)・要シード・要リクエスト改ざん・DB値の間接確認は test.fixme（理由付き）で残す。
 * 手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様（正本 pf-eccube3 md / 観点表 / 基本設計）由来（オラクル独立性）。
 * pf-eccube3 リバース設計と刷新先 ec-cube-enterprise の表示文言の乖離はケース表「付帯表4」に出し、テストは仕様どおりに書く。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / two_factor_auth.spec.ts / m09系）に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針（安全第一・共有環境）:
 *  - 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 種別切替・直接アクセス・JSリスト操作（移送/順序）は DOM 内のみで保存しないため安全に実行できる。
 *  - 保存成功(030/031)・保存後DB一致(032)・キー欠落(042)・他種別行ID(043)・トークン不正(044)は破壊的/要改ざん/DB観測のため test.fixme。
 *
 * 環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { BaseSettingSettingShopCsvPage } from "../../../pages/admin/m10/m10_10_admin_base_setting_setting_shop_csv.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const LOGIN_RE = /\/login(\?|$)/;
const CSV_RE = (id: number) => new RegExp(`/setting/shop/csv/${id}(\\?|$)`);

/** 管理ログインしてからCSV出力項目設定画面（指定種別）を開く。 */
async function gotoCsvAsAdmin(
  page: Page,
  id: number = BaseSettingSettingShopCsvPage.CSV_TYPE_ORDER
): Promise<BaseSettingSettingShopCsvPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const csv = new BaseSettingSettingShopCsvPage(page);
  await csv.goto(id);
  return csv;
}

test.describe("管理画面 > 店舗設定 > CSV出力項目設定", { tag: ["@admin", "@setting"] }, () => {
  // ===== 表示（GET・非破壊） =====

  test("E2E-M10-10-001 既定種別(受注CSV)で画面が開きタイトル「CSV出力項目設定」が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const csv = await gotoCsvAsAdmin(page);
    await expect(page).toHaveURL(CSV_RE(BaseSettingSettingShopCsvPage.CSV_TYPE_ORDER));
    await expect(page.locator("body")).toContainText(csv.title);
  });

  test("E2E-M10-10-002 種別セレクト・左右マルチセレクト・保存ボタン・CSRFトークンhiddenが存在する", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const csv = await gotoCsvAsAdmin(page);
    await csv.seeForm();
    // 観点表 IT-03/IT-15「CSRFトークンhidden が画面に埋め込まれる」（付帯表2b 行017）を仕様要件として判定。
    // hidden は非表示要素のため toBeAttached で存在を確認する（選択子は csv.twig:80 input[name=_token]）。
    await expect(csv.csrfToken).toBeAttached();
  });

  test("E2E-M10-10-003 4つの移送ボタンと4つの順序ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const csv = await gotoCsvAsAdmin(page);
    await csv.seeOperationButtons();
  });

  test("E2E-M10-10-004 当種別のdtb_csv項目が左右リストにdisp_nameで振り分け表示される(間接)", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const csv = await gotoCsvAsAdmin(page);
    // 主観測: 当種別の定義行(option)が左右いずれかに存在すること（右=有効/左=無効はDB状態を間接反映）。
    const total = (await csv.notOutputOptions.count()) + (await csv.outputOptions.count());
    expect(total).toBeGreaterThan(0);
    // 処理フロー(GET)#3「disp_name をラベルにする」由来のオラクル: 各 option のラベルが非空であること。
    // （有効/無効の左右振り分けと sort_no 昇順の値一致は DB 内部値の間接確認のため 032/手動。ここでは表示ラベルの存在を判定）
    for (const opt of await csv.notOutputOptions.all()) {
      expect(((await opt.textContent()) ?? "").trim().length).toBeGreaterThan(0);
    }
    for (const opt of await csv.outputOptions.all()) {
      expect(((await opt.textContent()) ?? "").trim().length).toBeGreaterThan(0);
    }
  });

  test("E2E-M10-10-005 操作説明文(項目操作・項目順序の使い方)が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const csv = await gotoCsvAsAdmin(page);
    // 設計書「フロント挙動／表示要素（操作説明）」由来のオラクル＝「操作説明文が表示される」。
    // ec-cube-enterprise の how_to_use 文言（messages.ja.yaml:2970）の完全一致はオラクル独立性のため固定しない（付帯表4 要確認）。
    // how_to_use は専用 id を持たず .card-body 末尾に出力される（csv.twig:184）ため、説明文ブロックを内包する .card-body が
    // 非空のガイダンス（設計の中核名詞「項目」）を含むことで存在を判定する。
    await expect(csv.helpArea).toContainText("項目");
  });

  test("E2E-M10-10-006 サブタイトル「システム設定」がタイトル帯に表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const csv = await gotoCsvAsAdmin(page);
    // 設計書「フロント挙動・表示要素＝タイトル帯『システム設定／CSV出力項目設定』」由来のオラクル。
    // 左ナビの「システム設定」メニューと取り違えないよう、ページ見出し領域(pageTitleArea=要実機確認)に限定して判定する。
    // 実装は admin.setting.basic_info=「基本情報設定」(csv.twig:16) のため本判定は落ちて付帯表4#3 を検出する想定（テストは仕様どおりに書く）。
    await expect(csv.pageTitleArea).toContainText(csv.subTitle);
  });

  test("E2E-M10-10-007 保存ボタンのラベルが「設定」である", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const csv = await gotoCsvAsAdmin(page);
    // 設計書「利用者視点の入口＝『設定』を押す」由来のオラクル。
    // 実装は admin.common.registration=「登録」(csv.twig:200) のため本判定は落ちて付帯表4#2 を検出する想定。
    await expect(csv.saveButton).toHaveText(csv.saveLabel);
  });

  // ===== 種別切替・直接アクセス・導線（GET・非破壊） =====

  test("E2E-M10-10-012 各管理画面の出力項目設定リンクから文脈種別で当画面へ遷移できる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
    // 設計書「利用者視点の入口＝各管理画面の出力項目設定リンク」由来。受注管理画面の #orderCsvSetting（Order/index.twig:1147）が
    // 受注CSV(id=3)の当画面URLを指すこと（クリック遷移はドロップダウン開閉に依存するため href一致を主観測とする）。
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order`);
    await expect(page.locator("#orderCsvSetting")).toHaveAttribute(
      "href",
      CSV_RE(BaseSettingSettingShopCsvPage.CSV_TYPE_ORDER)
    );
  });

  test("E2E-M10-10-010 種別セレクト変更で当該種別IDの画面へ遷移し再読み込みされる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const csv = await gotoCsvAsAdmin(page, BaseSettingSettingShopCsvPage.CSV_TYPE_ORDER);
    await csv.changeType(BaseSettingSettingShopCsvPage.CSV_TYPE_PRODUCT);
    await expect(page).toHaveURL(CSV_RE(BaseSettingSettingShopCsvPage.CSV_TYPE_PRODUCT));
  });

  test("E2E-M10-10-011 種別ID直接指定で当該種別が選択された状態で開ける", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const csv = await gotoCsvAsAdmin(page, BaseSettingSettingShopCsvPage.CSV_TYPE_CUSTOMER);
    await expect(page).toHaveURL(CSV_RE(BaseSettingSettingShopCsvPage.CSV_TYPE_CUSTOMER));
    expect(await csv.selectedTypeValue()).toBe(String(BaseSettingSettingShopCsvPage.CSV_TYPE_CUSTOMER));
  });

  // ===== JSリスト操作（クライアント側DOM・保存しない・非破壊） =====

  test("E2E-M10-10-020 「出力」ボタンで左の選択項目が右へDOM移動し保存されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const csv = await gotoCsvAsAdmin(page);
    const leftBefore = await csv.notOutputOptions.count();
    test.skip(leftBefore === 0, "当種別の「出力しない項目」が0件のため移送を観測できない（要シード）");
    const rightBefore = await csv.outputOptions.count();
    await csv.transferFirstToOutput();
    expect(await csv.outputOptions.count()).toBe(rightBefore + 1);
    expect(await csv.notOutputOptions.count()).toBe(leftBefore - 1);
    await expect(page).toHaveURL(CSV_RE(BaseSettingSettingShopCsvPage.CSV_TYPE_ORDER)); // 画面遷移せず保存もしない
  });

  test("E2E-M10-10-021 「解除」ボタンで右の選択項目が左へDOM移動し保存されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const csv = await gotoCsvAsAdmin(page);
    const rightBefore = await csv.outputOptions.count();
    test.skip(rightBefore === 0, "当種別の「出力する項目」が0件のため解除を観測できない（要シード）");
    const leftBefore = await csv.notOutputOptions.count();
    await csv.output.locator("option").first().evaluate((el: HTMLOptionElement) => {
      el.selected = true;
    });
    await csv.removeButton.click();
    expect(await csv.notOutputOptions.count()).toBe(leftBefore + 1);
    expect(await csv.outputOptions.count()).toBe(rightBefore - 1);
    await expect(page).toHaveURL(CSV_RE(BaseSettingSettingShopCsvPage.CSV_TYPE_ORDER));
  });

  test("E2E-M10-10-022 「すべて出力」で左の全項目が右へ移動する", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const csv = await gotoCsvAsAdmin(page);
    const leftBefore = await csv.notOutputOptions.count();
    const rightBefore = await csv.outputOptions.count();
    await csv.transferAllToOutput();
    expect(await csv.notOutputOptions.count()).toBe(0);
    expect(await csv.outputOptions.count()).toBe(leftBefore + rightBefore);
  });

  test("E2E-M10-10-023 「すべて解除」で右の全項目が左へ移動する", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const csv = await gotoCsvAsAdmin(page);
    const leftBefore = await csv.notOutputOptions.count();
    const rightBefore = await csv.outputOptions.count();
    await csv.releaseAllToNotOutput();
    expect(await csv.outputOptions.count()).toBe(0);
    expect(await csv.notOutputOptions.count()).toBe(leftBefore + rightBefore);
  });

  test("E2E-M10-10-024 「ひとつ上へ」で右リストの選択行が一つ上へ並べ替わる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const csv = await gotoCsvAsAdmin(page);
    const rightBefore = await csv.outputOptions.count();
    test.skip(rightBefore < 2, "右リストが2件未満のため順序入替を観測できない（要シード）");
    const second = csv.output.locator("option").nth(1);
    const secondLabel = (await second.textContent())?.trim() ?? "";
    await second.evaluate((el: HTMLOptionElement) => {
      el.selected = true;
    });
    await csv.moveUp.click();
    const firstLabel = (await csv.output.locator("option").first().textContent())?.trim() ?? "";
    expect(firstLabel).toBe(secondLabel); // 2番目が先頭へ繰り上がる
  });

  test("E2E-M10-10-025 「一番下へ」で右リストの選択行が末尾へ並べ替わる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const csv = await gotoCsvAsAdmin(page);
    const rightBefore = await csv.outputOptions.count();
    test.skip(rightBefore < 2, "右リストが2件未満のため順序入替を観測できない（要シード）");
    const first = csv.output.locator("option").first();
    const firstLabel = (await first.textContent())?.trim() ?? "";
    await first.evaluate((el: HTMLOptionElement) => {
      el.selected = true;
    });
    await csv.moveBottom.click();
    const lastLabel = (await csv.output.locator("option").last().textContent())?.trim() ?? "";
    expect(lastLabel).toBe(firstLabel); // 先頭行が末尾へ移動する
  });

  test("E2E-M10-10-026 「ひとつ下へ」で右リストの選択行が一つ下へ並べ替わる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const csv = await gotoCsvAsAdmin(page);
    const rightBefore = await csv.outputOptions.count();
    test.skip(rightBefore < 2, "右リストが2件未満のため順序入替を観測できない（要シード）");
    const first = csv.output.locator("option").first();
    const firstLabel = (await first.textContent())?.trim() ?? "";
    await first.evaluate((el: HTMLOptionElement) => {
      el.selected = true;
    });
    await csv.moveDown.click();
    const secondLabel = (await csv.output.locator("option").nth(1).textContent())?.trim() ?? "";
    expect(secondLabel).toBe(firstLabel); // 先頭行が2番目へ繰り下がる
  });

  test("E2E-M10-10-027 「一番上へ」で右リストの選択行が先頭へ並べ替わる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const csv = await gotoCsvAsAdmin(page);
    const rightBefore = await csv.outputOptions.count();
    test.skip(rightBefore < 2, "右リストが2件未満のため順序入替を観測できない（要シード）");
    const last = csv.output.locator("option").last();
    const lastLabel = (await last.textContent())?.trim() ?? "";
    await last.evaluate((el: HTMLOptionElement) => {
      el.selected = true;
    });
    await csv.moveTop.click();
    const firstLabel = (await csv.output.locator("option").first().textContent())?.trim() ?? "";
    expect(firstLabel).toBe(lastLabel); // 末尾行が先頭へ移動する
  });

  // ===== エラー・エッジ（非破壊で実行可能） =====

  test("E2E-M10-10-040 存在しない種別IDで画面を開くとNotFound(404)になる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    // 先に管理ログインしてから、ブラウザで開いた当該URLの応答そのものを検証する（別リクエストでの再取得はしない）。
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
    const csv = new BaseSettingSettingShopCsvPage(page);
    const res = await page.goto(csv.url(999999));
    expect(res?.status()).toBe(404);
  });

  test("E2E-M10-10-041 未認証で当画面URLへ直接アクセスすると管理ログイン画面へ誘導される", async ({ page }) => {
    // 資格情報不要（未ログイン前提）。
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/csv/3`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M10-10-030 「設定」押下で成功フラッシュが表示される（破壊的: dtb_csv を更新。要: 使い捨てシードと後始末）",
    async () => {
      // 期待は仕様（処理フロー(POST)・入出力「成功フラッシュ」）由来。保存は dtb_csv.enabled/sort_no を更新するため
      // 専用CSV種別の使い捨てシード＋保存後の現状復帰を用意してから実装する。成功文言の正は仕様（付帯表4 不具合候補#1）。
    }
  );

  test.fixme(
    "E2E-M10-10-031 保存成功後に同一種別の画面へリダイレクトし再表示される（破壊的）",
    async () => {
      // 期待は仕様（画面遷移「保存成功→同一種別へGET再表示」CsvController.php:162）由来。030と同じ使い捨てシードで実装。
    }
  );

  test.fixme(
    "E2E-M10-10-032 保存後に同一種別で再表示すると2リストがDB(保存内容)と一致する（破壊的・間接DB確認）",
    async () => {
      // 期待は仕様（データ整合性「flush後のDBと一致」）由来。並び替え→保存→再GETで右リストの順序一致を観測する。
    }
  );

  test.fixme(
    "E2E-M10-10-033 保存成功フラッシュに仕様文言「CSV出力を設定しました。」が表示される（破壊的・要使い捨てシード）",
    async () => {
      // 期待は仕様（入出力「成功時出力＝CSV出力を設定しました。」）由来。実装は admin.common.save_complete=「保存しました」
      // (CsvController.php:160) のため落ちて付帯表4#1 を検出する想定。030と同じ使い捨てシードで実装する。
    }
  );

  test.fixme(
    "E2E-M10-10-042 POSTで片側キー欠落時はその側の更新ループをスキップし該当行を変更しない（要: リクエスト改ざん・間接DB確認）",
    async () => {
      // 期待は仕様（エッジケース「キー欠落時スキップ」CsvController.php:126,137）由来。改ざんPOST後に該当行のenabled/sort_noが不変であることを確認する。
    }
  );

  test.fixme(
    "E2E-M10-10-043 POSTに他種別の行IDを含めると主キー解決で当該行も更新され得る（要: リクエスト改ざん・間接DB確認・隔離）",
    async () => {
      // 期待は仕様（エッジケース「主キーだけで行を解決」CsvController.php:130,141）由来。種別整合の再検証を持たない挙動を検証する。破壊的のため隔離環境で実施。
    }
  );

  test.fixme(
    "E2E-M10-10-044 なりすまし対策トークン不正のPOSTは保存されず再表示される（要: トークン改ざん）",
    async () => {
      // 期待は仕様（バリデーション「CSRF」CsvController.php:124 isTokenValid）由来。不正トークンでflushに到達しないこと（成功フラッシュ非表示）を確認する。
    }
  );
});
