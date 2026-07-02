/**
 * 管理画面 店舗基本設定（SHOPマスター）メールアドレス設定 E2E。
 * 納品ケース表 integration_test/e2e/m10_09_admin_base_setting_setting_shop_mail_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装する（手動/対象外・間接はケース表で全量管理＝specに大量fixmeを残さない）。
 * 期待結果は仕様(functions/pf-eccube3/m10-09_admin_base_setting_setting_shop_mail.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行方針（安全第一・共有ステージング）:
 *  - 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 更新系（010〜012）は dtb_base_info の既定1行のメール値を書き換える。共有環境では実行後に既知有効値へ戻すか専用環境を用いる（SEED-M10-09-BASEINFO）。
 *  - CSRFトークン改ざん（050）・各メール送信側のヘッダ割当・DB内部値/キャッシュ/ログはケース表で手動/対象外として管理。
 *
 * シード/資格情報（環境変数。コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）
 *  - 前提: SEED-M10-09-BASEINFO（dtb_base_info 既定1行のメール以外の必須項目が有効値で埋まっている＝保存系が成立する状態）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { BaseSettingSettingShopMailPage } from "../../../pages/admin/m10/m10_09_admin_base_setting_setting_shop_mail.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 一意な有効メール（識別接頭辞 e2e-）。更新系で使う。
const VALID = {
  e1: "e2e-from@example.com",
  e2: "e2e-inquiry@example.com",
  e3: "e2e-reply@example.com",
  e4: "e2e-error@example.com",
};

const SHOP_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/setting/shop(\\?|$)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 > 店舗設定 > 店舗基本設定（メールアドレス設定）",
  { tag: ["@admin", "@setting"] },
  () => {
    // 更新系(010〜012)は dtb_base_info 既定1行のメール値を上書きする破壊的テスト。
    // 競合・順序依存を避けるため直列実行する。共有環境では実行後に既知有効値へ復元すること
    // （SEED-M10-09-BASEINFO／要確認: 復元の自動teardownは環境のシード機構に委譲）。
    test.describe.configure({ mode: "serial" });

    // ===== 認証不要・非破壊 =====

    test("E2E-M10-09-040 未ログインで店舗基本設定URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/shop`);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 表示系（SEED-M10-09-BASEINFO・非破壊） =====

    test("E2E-M10-09-001 メール4入力欄が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const shop = new BaseSettingSettingShopMailPage(page);
      await shop.goto();
      await shop.seeMailFields();
    });

    test("E2E-M10-09-002 メール4欄に必須バッジが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const shop = new BaseSettingSettingShopMailPage(page);
      await shop.goto();
      // 仕様: 4項目とも必須。画面全体のバッジ数ではなく、各メール欄の row 内に必須バッジが付くことを確認する
      // （画面全体カウントだとメール欄に必須表示が無くても通り得るため、当該欄近傍で判定）。
      await expect(shop.requiredBadgeFor(1)).toBeVisible();
      await expect(shop.requiredBadgeFor(2)).toBeVisible();
      await expect(shop.requiredBadgeFor(3)).toBeVisible();
      await expect(shop.requiredBadgeFor(4)).toBeVisible();
    });

    test("E2E-M10-09-003 メール欄にHTML必須属性が付かない（必須はサーバ側）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const shop = new BaseSettingSettingShopMailPage(page);
      await shop.goto();
      // 仕様(フロント挙動): クライアント側のHTML必須属性は付かない確認値（メール各入力欄=email01〜04）。
      await expect(shop.email01).not.toHaveAttribute("required", /.*/);
      await expect(shop.email02).not.toHaveAttribute("required", /.*/);
      await expect(shop.email03).not.toHaveAttribute("required", /.*/);
      await expect(shop.email04).not.toHaveAttribute("required", /.*/);
    });

    // 仕様乖離検出（付帯表4#1）: 設計の並び順は email01→email02→email03→email04。
    // 実装は email01→email03→email04→email02 のため、本テストは落ちて乖離を検出する見込み。
    test("E2E-M10-09-004 メール4欄が設計どおりの並び順で表示される（仕様乖離検出）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const shop = new BaseSettingSettingShopMailPage(page);
      await shop.goto();
      const order = await shop.mailFieldOrder();
      // 期待は仕様（設計フロント挙動の並び順）。実装が違えば失敗＝検出。
      expect(order).toEqual([
        "shop_master_email01",
        "shop_master_email02",
        "shop_master_email03",
        "shop_master_email04",
      ]);
    });

    test("E2E-M10-09-005 メール各欄が単一行のメール入力型（type=email）で表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const shop = new BaseSettingSettingShopMailPage(page);
      await shop.goto();
      // 仕様(フロント挙動): いずれも単一行のメール入力型（HTML5入力支援）。
      await expect(shop.email01).toHaveAttribute("type", "email");
      await expect(shop.email02).toHaveAttribute("type", "email");
      await expect(shop.email03).toHaveAttribute("type", "email");
      await expect(shop.email04).toHaveAttribute("type", "email");
    });

    test("E2E-M10-09-006 メール欄にHTML maxlength属性が付かない（Length制約なし）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const shop = new BaseSettingSettingShopMailPage(page);
      await shop.goto();
      // 仕様(業務ルール): フォーム上は最大長を明示制約しない（Symfony Length制約は無し）。
      await expect(shop.email01).not.toHaveAttribute("maxlength", /.*/);
      await expect(shop.email02).not.toHaveAttribute("maxlength", /.*/);
      await expect(shop.email03).not.toHaveAttribute("maxlength", /.*/);
      await expect(shop.email04).not.toHaveAttribute("maxlength", /.*/);
    });

    // ===== 保存成功系（破壊的・要復元 SEED-M10-09-BASEINFO） =====

    test("E2E-M10-09-010 有効な4メールで登録すると保存完了メッセージが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const shop = new BaseSettingSettingShopMailPage(page);
      await shop.goto();
      await shop.fillEmails(VALID.e1, VALID.e2, VALID.e3, VALID.e4);
      await shop.submit();
      await shop.seeSaveComplete(); // 仕様: admin.common.save_complete「保存しました」
    });

    test("E2E-M10-09-011 登録成功後は店舗基本設定画面（同一画面）へ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const shop = new BaseSettingSettingShopMailPage(page);
      await shop.goto();
      await shop.fillEmails(VALID.e1, VALID.e2, VALID.e3, VALID.e4);
      await shop.submit();
      await expect(page).toHaveURL(SHOP_RE); // 同一画面(/setting/shop)へ
      await shop.seeMailFields(); // メール欄が再表示される
    });

    test("E2E-M10-09-012 登録後の再表示でメール欄に保存値が出る（間接永続化）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const shop = new BaseSettingSettingShopMailPage(page);
      await shop.goto();
      await shop.fillEmails(VALID.e1, VALID.e2, VALID.e3, VALID.e4);
      await shop.submit();
      await shop.seeSaveComplete();
      // 再取得・再表示された値が保存値であること（処理フロー#8）。
      await expect(shop.email01).toHaveValue(VALID.e1);
      await expect(shop.email02).toHaveValue(VALID.e2);
      await expect(shop.email03).toHaveValue(VALID.e3);
      await expect(shop.email04).toHaveValue(VALID.e4);
    });

    test("E2E-M10-09-013 検証失敗後の再描画で送信した値が入力欄に保持される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const shop = new BaseSettingSettingShopMailPage(page);
      await shop.goto();
      // 仕様(処理フロー/画面遷移): 検証失敗時はフォームに送信値とエラーが載る。
      await shop.email01.fill("notanemail");
      await shop.submit();
      await expect(page).toHaveURL(SHOP_RE);
      await expect(shop.successAlert).toHaveCount(0);
      await expect(shop.email01).toHaveValue("notanemail"); // 送信値が保持される
    });

    // ===== 必須バリデーション（破壊送信だが検証失敗で永続化されない） =====

    test("E2E-M10-09-020 メール空送信は保存されず同一画面に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const shop = new BaseSettingSettingShopMailPage(page);
      await shop.goto();
      await shop.email01.fill(""); // 送信元を空に
      await shop.submit();
      await expect(page).toHaveURL(SHOP_RE); // 同一画面に留まる
      await expect(shop.successAlert).toHaveCount(0); // 成功フラッシュなし＝保存されない
    });

    test("E2E-M10-09-021 メール空送信で成功フラッシュが積まれない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const shop = new BaseSettingSettingShopMailPage(page);
      await shop.goto();
      await shop.email01.fill("");
      await shop.submit();
      await expect(shop.successAlert).toHaveCount(0); // 仕様: 検証失敗時は成功フラッシュを積まない
    });

    test("E2E-M10-09-022 メール空送信で当該欄にエラーが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const shop = new BaseSettingSettingShopMailPage(page);
      await shop.goto();
      await shop.email01.fill("");
      await shop.submit();
      // 仕様: NotBlankにより「当該」項目(email01)がエラー。文言はFW由来のためオラクル化せず、
      // 当該欄(email01)の row 内にエラー表示が出ることで確認する（画面のどこかではなく当該欄近傍）。
      await expect(shop.fieldErrorFor(1).first()).toBeVisible();
    });

    // ===== 厳密メール形式バリデーション =====
    // 要確認(付帯表4#3,#6): 実装はメール欄が EmailType(type="email") かつフォームに novalidate が無い
    // （shop_master.twig の <form id="point_form"> は手書きで novalidate 未指定）。このため "notanemail" は
    // ブラウザのネイティブ検証でPOST前に止まり、サーバ側 .invalid-feedback に到達しない可能性がある。
    // 期待は仕様(厳密メール検証で保存されない=同一画面滞留)どおりに据え置く。031のフィールドエラーは
    // ネイティブ検証先取り時に成立しないことがあるため実機確認とする（テストは実装へ寄せない）。

    test("E2E-M10-09-030 メール形式不正は保存されず同一画面に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const shop = new BaseSettingSettingShopMailPage(page);
      await shop.goto();
      await shop.email01.fill("notanemail"); // 形式不正
      await shop.submit();
      await expect(page).toHaveURL(SHOP_RE);
      await expect(shop.successAlert).toHaveCount(0); // 厳密メール検証でエラー＝保存されない
    });

    test("E2E-M10-09-031 メール形式不正で当該欄にエラーが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const shop = new BaseSettingSettingShopMailPage(page);
      await shop.goto();
      await shop.email01.fill("notanemail");
      await shop.submit();
      // 当該欄(email01)の row 内に形式エラーが出ること（要確認: ネイティブ検証先取り時は別挙動）。
      await expect(shop.fieldErrorFor(1).first()).toBeVisible();
    });

    // ===== 必須バリデーション 他項目（email02/03/04）=====
    // 仕様: email01〜04 それぞれ NotBlank。異常系が email01 のみに偏らないよう、他3項目も空送信を検証。
    const EMPTY_FIELD_CASES: { id: string; n: 2 | 3 | 4; label: string }[] = [
      { id: "E2E-M10-09-023", n: 2, label: "問い合わせ受付メール(email02)" },
      { id: "E2E-M10-09-024", n: 3, label: "返信受付メール(email03)" },
      { id: "E2E-M10-09-025", n: 4, label: "送信エラー受付メール(email04)" },
    ];
    for (const c of EMPTY_FIELD_CASES) {
      test(`${c.id} ${c.label}を空にして送信すると保存されず当該欄にエラー`, async ({ page }) => {
        test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
        await login(page);
        const shop = new BaseSettingSettingShopMailPage(page);
        await shop.goto();
        await shop.emailField(c.n).fill(""); // 当該欄を空に
        await shop.submit();
        await expect(page).toHaveURL(SHOP_RE); // 同一画面に留まる
        await expect(shop.successAlert).toHaveCount(0); // 成功フラッシュなし＝保存されない
        await expect(shop.fieldErrorFor(c.n).first()).toBeVisible(); // 当該欄にNotBlankエラー
      });
    }

    // ===== 厳密メール形式バリデーション 他項目（email02/03/04）=====
    // 要確認(付帯表4#6): ネイティブ検証先取り時はサーバ側 .invalid-feedback に到達しないことがある（実機確認）。
    const FORMAT_FIELD_CASES: { id: string; n: 2 | 3 | 4; label: string }[] = [
      { id: "E2E-M10-09-032", n: 2, label: "問い合わせ受付メール(email02)" },
      { id: "E2E-M10-09-033", n: 3, label: "返信受付メール(email03)" },
      { id: "E2E-M10-09-034", n: 4, label: "送信エラー受付メール(email04)" },
    ];
    for (const c of FORMAT_FIELD_CASES) {
      test(`${c.id} ${c.label}の形式不正で当該欄にエラーが表示される`, async ({ page }) => {
        test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
        await login(page);
        const shop = new BaseSettingSettingShopMailPage(page);
        await shop.goto();
        await shop.emailField(c.n).fill("notanemail"); // 形式不正
        await shop.submit();
        await expect(page).toHaveURL(SHOP_RE);
        await expect(shop.successAlert).toHaveCount(0); // 厳密メール検証でエラー＝保存されない
        await expect(shop.fieldErrorFor(c.n).first()).toBeVisible(); // 当該欄に形式エラー（要確認）
      });
    }

    // ===== 手動/対象外（ケース表で全量管理） =====
    // E2E-M10-09-050 CSRFトークン不正→保存されない: トークン改ざんの自動再現が高コスト＝手動（ケース表 付帯表4#5）。
  }
);
