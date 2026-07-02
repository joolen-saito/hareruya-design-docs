/**
 * 管理画面 店舗設定 > 受注対応状況設定 E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m10_11_admin_base_setting_setting_shop_order_status_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち非破壊で安全に実行できるケースのみ test 本体で実装し、
 * 保存(POST=mtb_order_status / mtb_customer_order_status / mtb_order_status_color 更新)・要シード・権限(403)は
 * test.fixme（理由付き）で残す。手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様（正本 functions/ec-cube-enterprise/m10-11_... / 観点表 / 基本設計）由来（オラクル独立性）。
 * 表示文言は messages.ja.yaml/validators.ja.yaml の確認値を仕様として用い、実装の現挙動を期待値へ写さない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / m10系）に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針（安全第一・共有環境）:
 *  - 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 表示(GET)・未認証誘導・バリデーション失敗(flush前停止でDB不変)は非破壊で安全に実行できる。
 *  - 保存成功(010/011/012/013/014)・最大長境界/最小長の保存成功(023/028)はマスタを更新するため test.fixme（要: 使い捨てシードと現状復帰）。
 *  - 権限拒否(031=tenant_owner/032=tenant_operator)は tenant 権種アカウントのシードが要るため test.fixme。
 *  - GET初期表示(009)・名称(マイページ)/色の最大長超過(026/027)は非破壊で実行可能（検証失敗は flush 前停止）。
 *  - sort_no昇順(015)・欠損行 保存時失われる(041)・CSRF改ざん(050)は手動/間接・改ざん区分でケース表のみ管理。
 *
 * 環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { BaseSettingSettingShopOrderStatusPage } from "../../../pages/admin/m10/m10_11_admin_base_setting_setting_shop_order_status.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
// 管理ルート接頭辞まで含めて誤遷移検出力を確保する（既存M10-01に倣う）。
const ORDER_STATUS_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/order_status(\\?|$)`);

/** 管理ログインしてから受注対応状況設定画面を開く。 */
async function gotoAsAdmin(page: Page): Promise<BaseSettingSettingShopOrderStatusPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const os = new BaseSettingSettingShopOrderStatusPage(page);
  await os.goto();
  return os;
}

test.describe(
  "管理画面 > 店舗設定 > 受注対応状況設定",
  { tag: ["@admin", "@setting"] },
  () => {
    // ===== 表示（GET・非破壊） =====

    test("E2E-M10-11-001 画面見出し「受注対応状況設定」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const os = await gotoAsAdmin(page);
      await expect(page).toHaveURL(ORDER_STATUS_RE);
      await expect(page.locator("body")).toContainText(os.title);
    });

    test("E2E-M10-11-002 サブ見出し「基本情報設定」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const os = await gotoAsAdmin(page);
      // sub_title(twig:17) は管理レイアウトのヘッダ/パンくず領域で描画される。body 全体への containText は
      // 左ナビ等の同一文言と衝突し得るため、実機で確定後はサブ見出し要素へ絞る（付帯表4#6 要確認）。
      await expect(page.locator("body")).toContainText(os.subTitle);
    });

    test("E2E-M10-11-003 全ステータス行が表示され各行ID・登録ボタンが見える", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const os = await gotoAsAdmin(page);
      expect(await os.rows.count()).toBeGreaterThan(0); // 初期マスタの全行が並ぶ（sort_no 昇順は付帯表で間接）
      await expect(os.idCell(0)).not.toHaveText(""); // ID 列が参照表示される
      await expect(os.registerButton).toBeVisible();
    });

    test("E2E-M10-11-004 列ヘッダ5列と各行4入力欄が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const os = await gotoAsAdmin(page);
      await os.seeColumnHeaders();
      await os.seeForm();
    });

    test("E2E-M10-11-005 色入力ウィジェットに form-control-color が付与される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const os = await gotoAsAdmin(page);
      await expect(os.color(0)).toHaveClass(/form-control-color/);
    });

    test("E2E-M10-11-006 件数表示がチェックボックス（トグル）で表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const os = await gotoAsAdmin(page);
      await expect(os.displayOrderCount(0)).toHaveAttribute("type", "checkbox");
    });

    test("E2E-M10-11-007 ID列は参照表示で入力欄を持たない（編集不可）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const os = await gotoAsAdmin(page);
      await expect(os.idCell(0).locator("input")).toHaveCount(0); // ID セルに入力要素なし
    });

    test("E2E-M10-11-008 カードヘッダ見出し「受注対応状況」とツールチップ質問アイコンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const os = await gotoAsAdmin(page);
      await expect(os.cardHeader).toContainText(os.cardLabel);
      expect(await os.tooltipIcons.count()).toBeGreaterThan(0);
    });

    test("E2E-M10-11-009 名称(マイページ)・色がGET初期表示で関連テーブル由来値で表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const os = await gotoAsAdmin(page);
      // 仕様（処理フロー(GET) POST_SET_DATA で同一IDの CustomerOrderStatus.name / OrderStatusColor.name を初期表示に埋める）由来。
      // 関連行が揃う先頭行では初期値が空でない（具体値はオラクル化せず非空のみを観測）。
      await expect(os.customerOrderStatusName(0)).not.toHaveValue("");
      await expect(os.color(0)).not.toHaveValue("");
    });

    // ===== バリデーション失敗（POST するが flush 前に停止＝DB不変・非破壊で実行可能） =====

    test("E2E-M10-11-020 名称(受注管理)未入力で登録すると「入力されていません。」が表示され滞留する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const os = await gotoAsAdmin(page);
      await os.adminOrderStatusName(0).fill(""); // 必須未入力
      await os.submit();
      await os.seeNotBlankError(); // validators.ja.yaml:17（NotBlank）
      await expect(page).toHaveURL(ORDER_STATUS_RE); // 同一画面に滞留（flush せず）
    });

    test("E2E-M10-11-021 名称(マイページ)未入力で登録すると必須エラーになり保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const os = await gotoAsAdmin(page);
      await os.customerOrderStatusName(0).fill("");
      await os.submit();
      await os.seeNotBlankError();
      await expect(os.successAlert).toHaveCount(0); // 成功フラッシュが出ない＝保存されない
    });

    test("E2E-M10-11-022 色未入力で登録すると必須エラーになり保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const os = await gotoAsAdmin(page);
      // ColorType は空文字を入れて NotBlank を発火させる（属性の挙動は付帯表4 要確認）。
      await os.color(0).evaluate((el: HTMLInputElement) => {
        el.value = "";
      });
      await os.submit();
      await os.seeNotBlankError();
      await expect(os.successAlert).toHaveCount(0);
    });

    test("E2E-M10-11-024 名称(受注管理)に最大長+1(256文字)で登録するとエラーになり保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const os = await gotoAsAdmin(page);
      await os.adminOrderStatusName(0).fill("あ".repeat(256)); // eccube_stext_len=255 超過
      await os.submit();
      await expect(os.successAlert).toHaveCount(0); // Length 超過で flush に到達しない（文言の正は仕様）
      await expect(page).toHaveURL(ORDER_STATUS_RE);
    });

    test("E2E-M10-11-026 名称(マイページ)に最大長+1(256文字)で登録するとエラーになり保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const os = await gotoAsAdmin(page);
      await os.customerOrderStatusName(0).fill("あ".repeat(256)); // eccube_stext_len=255 超過
      await os.submit();
      await expect(os.successAlert).toHaveCount(0); // Length 超過で flush に到達しない
      await expect(page).toHaveURL(ORDER_STATUS_RE);
    });

    test("E2E-M10-11-027 色に最大長+1(256文字)を注入して登録するとエラーになり保存されない（ブラウザ依存）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const os = await gotoAsAdmin(page);
      // input[type=color] は通常 #rrggbb に正規化されるため、サーバ側 Length(max=255) 検証用に value を直接注入する。
      // 注入可否・正規化はブラウザ依存（付帯表4#4 要実機確認）。期待値は仕様（色は最大長255・超過は送信無効）由来。
      await os.color(0).evaluate((el: HTMLInputElement, v: string) => {
        el.value = v;
      }, "x".repeat(256));
      await os.submit();
      await expect(os.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(ORDER_STATUS_RE);
    });

    test("E2E-M10-11-025 行フォームに一部だけ入力して送信しても部分保存されずエラーになる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const os = await gotoAsAdmin(page);
      // 1行の必須を欠くとフォーム全体が無効になり、他行も含め一切 flush しない（部分保存なし）。
      await os.adminOrderStatusName(0).fill("");
      await os.submit();
      await os.seeNotBlankError();
      await expect(os.successAlert).toHaveCount(0);
    });

    // ===== 権限・認可（未認証は資格情報不要・非破壊） =====

    test("E2E-M10-11-030 未認証で当画面URLへ直接アクセスすると管理ログイン画面へ誘導される", async ({ page }) => {
      // 資格情報不要（未ログイン前提）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/order_status`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M10-11-010 登録成功で成功フラッシュ「保存しました」が表示される（破壊的: マスタ3表を更新。要: 使い捨てシードと後始末）",
      async () => {
        // 期待は仕様（処理フロー(POST・成功) addSuccess admin.common.save_complete / 表示メッセージ「保存しました」）由来。
        // 名称(受注管理)を一時値へ更新→保存→「保存しました」表示を確認後、元値へ復元する手順を用意してから実装する。
      }
    );

    test.fixme(
      "E2E-M10-11-011 登録成功後に同一画面へリダイレクトし更新値で再表示される（破壊的・間接DB確認・クロスエンティティ全項目）",
      async () => {
        // 期待は仕様（画面遷移「成功→admin_setting_shop_order_status へリダイレクトしGET再表示」OrderStatusController.php:77）由来。
        // クロスエンティティ更新の網羅: 名称(受注管理)=mtb_order_status / 名称(マイページ)=mtb_customer_order_status /
        // 色=mtb_order_status_color の3項目をいずれも一時値へ更新→保存→再GETで各入力欄に更新後マスタ値が載ることを観測する。
        // 件数表示の往復は 012 が担う。010 と同じ使い捨てシードで実装し、検証後に元値へ復元する。
      }
    );

    test.fixme(
      "E2E-M10-11-012 件数表示トグルをオン/オフして登録すると display_order_count が更新され成功する（破壊的）",
      async () => {
        // 期待は仕様（入力項目「件数表示」→ mtb_order_status.display_order_count 上書き / 業務ルール）由来。
        // トグル切替→保存→再表示で状態反映を確認後、元状態へ復元する。
      }
    );

    test.fixme(
      "E2E-M10-11-023 名称(受注管理)に最大長(255文字)で登録するとエラーにならず保存できる（破壊的・境界内）",
      async () => {
        // 期待は仕様（入力項目「最大長 eccube_stext_len=255」境界内は有効）由来。保存成功はマスタ更新のため使い捨てシードで実装。
      }
    );

    test.fixme(
      "E2E-M10-11-028 名称(受注管理)に最小長(1文字)で登録するとエラーにならず保存できる（破壊的・境界内）",
      async () => {
        // 期待は仕様（最小長1は境界内＝有効。NotBlank のみで min 制約なし）由来。保存成功はマスタ更新のため使い捨てシードで実装。
      }
    );

    test.fixme(
      "E2E-M10-11-013 名称(マイページ)を有効値に更新し登録すると成功し再表示で反映される（破壊的・間接DB）",
      async () => {
        // 期待は仕様（処理フロー(POST成功)：名称(マイページ)を mtb_customer_order_status.name へコピー・再表示で反映）由来。
        // customer_order_status_name を一時値へ更新→保存→「保存しました」→再GETで同欄に更新値が載ることを観測後、元値へ復元する。
      }
    );

    test.fixme(
      "E2E-M10-11-014 色を有効値に更新し登録すると成功し再表示で反映される（破壊的・間接DB）",
      async () => {
        // 期待は仕様（処理フロー(POST成功)：色を mtb_order_status_color.name へコピー・再表示で反映）由来。
        // color を有効な一時値へ更新→保存→再GETで色欄に更新値が載ることを観測後、元値へ復元する。
      }
    );

    test.fixme(
      "E2E-M10-11-031 店舗系権種(tenant_owner)でGETすると認可失敗で HTTP 403 になる（要: tenant 権種アカウントのシード）",
      async () => {
        // 期待は仕様（権限・認可「/setting/shop 先頭一致の deny_url で 403」/ 利用者視点の入口）由来。
        // dtb_authority_role に拒否が紐付く tenant_owner アカウントでログインし GET の応答が 403 であることを確認する。
      }
    );

    test.fixme(
      "E2E-M10-11-032 店舗系権種(tenant_operator)でGETすると認可失敗で HTTP 403 になる（要: tenant_operator シード・operator成否は要確認）",
      async () => {
        // 期待は仕様（権限・認可：設計md:249 で tenant_operator(mtb_authority.id=5) も /setting/shop deny_url 対象）由来。
        // PHPUnit は tenant_owner のみ明示のため operator 単体の403成否は要実機確認（付帯表4#7）。
      }
    );

    // 注: 015(sort_no昇順=既知ID順シード) / 041(欠損行 保存時失われる=破壊的) / 050(CSRF改ざん) は
    //     手動/間接・改ざん区分のためケース表で全量管理し、spec には fixme を残さない（規約）。
  }
);
