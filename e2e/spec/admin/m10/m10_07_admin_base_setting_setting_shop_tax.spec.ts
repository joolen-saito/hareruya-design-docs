/**
 * 管理画面 店舗設定 — 税率設定（共通税率・商品別税率オプション）E2E。
 * 納品ケース表 integration_test/e2e/m10_07_admin_base_setting_setting_shop_tax_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち安全に実行できるケースのみを置く（手動/対象外はケース表で全量管理）。
 * 自動化予定だが未実装/破壊的（登録・削除でDBを書き換える）/要実機/刷新先に画面なし のものは test.fixme（理由付き）で残す。
 * 期待結果は仕様（設計書 functions/pf-eccube3/m10-07_admin_base_setting_setting_shop_tax.md / 観点表）由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 仕様乖離（設計源=pf-eccube3 vs 刷新先=ec-cube-enterprise・付帯表4）:
 *  #1 個別税率設定ブロック（商品別税率機能ラジオ＋上部「登録」＋edit_param）が刷新先に無い → 050/051 は test.fixme。
 *  #2 適用日時重複の文言が乖離（実装「同時刻の適用日時を設定できません。」）→ 023 は文言厳密一致せず「保存されない」を主観測。
 *  #3 実装は削除確認モーダルあり（設計は不使用）→ 032 で観測（仕様乖離の検出）。
 *  #4 物理削除（del_flg なし）→ 論理削除済み状態の検証は不能。
 *  #5 編集はインライン・新規ボタン文言は「新規作成」。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / two_factor_auth.spec.ts / m09系）に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針（安全第一・共有環境）:
 *  - 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 検証エラー系（消費税率/適用日時 必須・範囲外）は「保存に失敗してDBを変えない」ため安全に実行できる。
 *  - 登録成功(010/011/012)・削除成功(030/031)はDBを書き換える破壊的操作のため test.fixme（使い捨てシードで実装）。
 *  - 適用日時重複(023)・削除モーダル(032)は既存行シード（TAX_DUP_DATE / TAX_RULE_ID）が要るため skip ガード。
 *
 * 環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）
 *  - TAX_DUP_DATE : 既存の共通税率行の適用日時（YYYY-MM-DD HH:mm。023 で使用）
 *  - TAX_RULE_ID  : 削除可能な基本税率以外の共通税率行ID（032 で使用）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { BaseSettingSettingShopTaxPage } from "../../../pages/admin/m10/m10_07_admin_base_setting_setting_shop_tax.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const TAX_DUP_DATE = process.env.TAX_DUP_DATE || "";
const TAX_RULE_ID = process.env.TAX_RULE_ID || "";

const LOGIN_RE = /\/login(\?|$)/;
// 税率設定画面の系列（一覧 /tax・新規POST再描画 /tax/new・インライン編集 /tax/{id}/edit）を許容。
// 新規フォームの action は /setting/shop/tax/new のため、検証エラー再描画で /tax のみにマッチする正規表現だと誤判定する。
const TAX_RE = /\/setting\/shop\/tax(\/(new|\d+\/edit))?(\?|$)/;

/** 管理ログインして税率設定画面を開く。 */
async function gotoTaxScreen(page: Page): Promise<BaseSettingSettingShopTaxPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const tax = new BaseSettingSettingShopTaxPage(page);
  await tax.goto();
  return tax;
}

test.describe("店舗設定 > 税率設定", { tag: ["@admin", "@setting", "@tax"] }, () => {
  // ===== 認証不要・非破壊（常時実行可） =====

  test("E2E-M10-07-040 未ログインで税率設定URL→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/tax`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  // ===== 表示（SEED-M10-07-ADMIN / TAXBASE） =====

  test("E2E-M10-07-001 見出し「税率設定」と「基本情報設定」が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const tax = await gotoTaxScreen(page);
    await tax.seeHeadings(); // 位置(タイトル/サブ)の正否は付帯表4#7で要確認
  });

  test("E2E-M10-07-002 共通税率の入力欄（消費税率・課税規則・適用日時）と登録ボタンが表示される", async ({
    page,
  }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const tax = await gotoTaxScreen(page);
    await tax.seeCommonTaxForm();
  });

  test("E2E-M10-07-003 税率一覧が表示され基本税率行の適用日時に「基本税率設定」が表示される", async ({
    page,
  }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const tax = await gotoTaxScreen(page);
    await expect(tax.listTable).toBeVisible();
    await expect(tax.listTable).toContainText("基本税率設定"); // 基本税率行(ID固定値1)の適用日時
  });

  test("E2E-M10-07-004 基本税率行には削除導線が無い（削除抑止）", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const tax = await gotoTaxScreen(page);
    // 基本税率行 id=1。削除アイコン a[data-bs-target="#DeleteModal_1"] が出力されないこと（tax_rule.twig:166）。
    await expect(tax.deleteTrigger(1)).toHaveCount(0);
  });

  // ===== バリデーション（非破壊：保存に失敗しDBを変えない） =====

  test("E2E-M10-07-020 消費税率未入力で登録→エラーで保存されず画面に留まる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const tax = await gotoTaxScreen(page);
    // 消費税率を空のまま適用日時を入力して送信（適用日時は将来日時の有効書式）。
    await tax.submitNewTaxRule("", "2099-01-01 00:00");
    await expect(page).toHaveURL(TAX_RE); // 保存成功で一覧に戻らず同画面に留まる
    await expect(tax.successAlert).toHaveCount(0); // 保存成功フラッシュが出ない
  });

  test("E2E-M10-07-021 適用日時未入力で登録→エラーで保存されず画面に留まる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const tax = await gotoTaxScreen(page);
    await tax.submitNewTaxRule("10"); // 適用日時を空のまま
    await expect(page).toHaveURL(TAX_RE);
    await expect(tax.successAlert).toHaveCount(0);
  });

  test("E2E-M10-07-022 消費税率に範囲外（負数）→エラーで保存されず画面に留まる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const tax = await gotoTaxScreen(page);
    await tax.submitNewTaxRule("-1", "2099-01-01 00:00"); // 範囲(0以上)違反
    await expect(page).toHaveURL(TAX_RE);
    await expect(tax.successAlert).toHaveCount(0);
  });

  test("E2E-M10-07-023 既存行と同一の適用日時で登録→重複エラーで保存されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(!TAX_DUP_DATE, "TAX_DUP_DATE（既存共通税率行の適用日時）未設定");
    const tax = await gotoTaxScreen(page);
    // 仕様: 同一適用日時の別行が存在すると保存しない（文言は付帯表4#2で乖離のため厳密一致せず保存抑止を主観測）。
    await tax.submitNewTaxRule("8", TAX_DUP_DATE);
    await expect(page).toHaveURL(TAX_RE);
    await expect(tax.successAlert).toHaveCount(0);
  });

  test("E2E-M10-07-025 消費税率に数値以外（文字列）→エラーで保存されず画面に留まる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const tax = await gotoTaxScreen(page);
    // 期待は設計書「消費税率 数値書式パターン制約」由来。非数値は保存に失敗しDBを変えない（非破壊）。
    await tax.submitNewTaxRule("abc", "2099-01-01 00:00");
    await expect(page).toHaveURL(TAX_RE);
    await expect(tax.successAlert).toHaveCount(0);
  });

  // ===== 削除確認モーダル（設計は不使用。期待値は設計書由来＝モーダル不在） =====

  test("E2E-M10-07-032 設計どおり削除に確認モーダルを使わない（実装はモーダルありで乖離検出）", async ({
    page,
  }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(!TAX_RULE_ID, "TAX_RULE_ID（削除可能な共通税率行ID）未設定");
    const tax = await gotoTaxScreen(page);
    // 期待値は設計書「本機能では確認モーダルは使わない」由来（オラクル独立）。
    // 実装は確認モーダル DeleteModal_{id} を持つ（付帯表4#3）ため、本アサーションは実装に対しては失敗し乖離を検出する。
    // モーダルを開く/削除を実行する操作は行わない（非破壊・実装追従の期待値固定を避ける）。
    await expect(tax.deleteModal(TAX_RULE_ID)).toHaveCount(0);
  });

  // ===== 保留（破壊的・要実機・刷新先に画面なし。手動/対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M10-07-010/011/012 共通税率の登録成功→「保存しました」表示・一覧復帰・一覧反映（破壊的・要使い捨てシード）",
    async () => {
      // 期待は仕様（処理フロー 共通税率保存 成功時 成功メッセージ→一覧）由来。
      // DBへ dtb_tax_rule を挿入するため使い捨てシード/後始末を整えてから実装。
    }
  );

  test.fixme(
    "E2E-M10-07-030/031 共通税率の削除成功→「削除しました」表示・一覧から消える（破壊的・要TAXDELシード）",
    async () => {
      // 期待は仕様（DELETE 論理削除→成功メッセージ）由来。実装は物理削除（付帯表4#4）。
      // DELETEメソッドはeccube admin JS（data-method=delete）で誘発＝要実機確認。削除可能IDの使い捨てシードで実装。
    }
  );

  test.fixme(
    "E2E-M10-07-024 消費税率 上限超過(101)→範囲(0〜100)エラーで保存されない（実装はRange min=0のみ＝乖離#8で保存され得る・破壊的）",
    async () => {
      // 期待は設計書「消費税率 0〜100」由来。実装は上限未強制のため101が保存され得る（破壊的）→乖離は失敗で検出。
      // 使い捨てシード/後始末を整えてから有効化。
    }
  );

  test.fixme(
    "E2E-M10-07-026 消費税率 境界値(0/100)は有効として保存される（境界正常・破壊的）",
    async () => {
      // 期待は設計書「消費税率 0〜100」境界の正常受理由来。保存はDBを書き換えるため使い捨てシードで実装。
    }
  );

  test.fixme(
    "E2E-M10-07-027 課税規則 未選択/不正値→必須エラーで保存されない（selectは既定値ありで未選択再現が要実機）",
    async () => {
      // 期待は設計書「課税規則 必須」由来。selectは既定選択肢を持つためUIでの未選択状態が作れず、値改ざん送信＝要実機確認。
    }
  );

  test.fixme(
    "E2E-M10-07-042 権限マスタで拒否された管理者は税率設定画面にアクセスできない（権限拒否シード要・要実機）",
    async () => {
      // 期待は設計書「権限・認可（権限マスタ拒否）」由来。権限拒否管理者のシードが要るため要実機確認。
    }
  );

  test.fixme(
    "E2E-M10-07-043 IP制限不一致のアクセス元は税率設定画面にアクセスできない（IP制限は環境依存・自動E2E制御外）",
    async () => {
      // 期待は設計書「権限・認可（IP制限不一致）」由来。IP制限はインフラ/環境設定依存で自動E2Eでは制御不能＝要実機確認。
    }
  );

  test.fixme(
    "E2E-M10-07-041 存在しないIDの削除要求→警告メッセージ＋一覧へ戻る（DELETE誘発・ルート差異 要実機）",
    async () => {
      // 期待は仕様（処理フローDELETE「対象無ければフラッシュを消し警告メッセージだけ残し一覧へリダイレクト」/エラー処理「削除対象が存在しない→警告」）由来。
      // 編集表示GET /{id}/edit 不存在=例外（エラー画面系）は別分岐＝E2E-044。刷新先は {id}/delete のParamConverterで404となり乖離（付帯表4#5）。
    }
  );

  test.fixme(
    "E2E-M10-07-050 個別税率設定ブロック（商品別税率機能ラジオ・上部「登録」）が表示される（刷新先に画面なし＝不具合候補#1）",
    async () => {
      // 期待は設計書（フロント挙動 個別税率設定ブロック）由来。刷新先 tax_rule.twig に当該UIが無く要確認。
      // 実装され次第セレクタを確定し有効化。仕様どおり「表示される」を期待値とする（無ければ失敗で検出）。
    }
  );

  test.fixme(
    "E2E-M10-07-051 上部「登録」で商品別税率機能（option_product_tax_rule）が店舗基本情報へ保存される（刷新先に経路なし＝不具合候補#1）",
    async () => {
      // 期待は設計書（処理フロー 商品別税率機能だけを保存 edit_param）由来。刷新先に edit_param 経路が無く要確認。
    }
  );

  test.fixme(
    "E2E-M10-07-060 既存共通税率行を編集し更新→更新成功・一覧反映（破壊的・ルート乖離#5・要シード）",
    async () => {
      // 期待は設計書（利用者視点の入口 編集 GET/POST /{id}/edit→更新）由来。
      // 刷新先はインライン編集 mode=edit_inline（新規は /new）でルート乖離（付帯表4#5）＝要実機確認。
      // 既存行を書き換えるため使い捨てシード/後始末を整えてから有効化。
    }
  );

  test.fixme(
    "E2E-M10-07-061 既存行を不正値（消費税率 空）で更新→エラーで更新されない（ルート乖離#5・要シード）",
    async () => {
      // 期待は設計書（編集の更新時バリデーション 消費税率 空白不可）由来。ルート乖離は付帯表4#5＝要実機確認。
    }
  );
});
