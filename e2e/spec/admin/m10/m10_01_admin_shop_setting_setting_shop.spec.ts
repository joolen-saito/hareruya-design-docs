/**
 * 管理画面 店舗設定 > 店舗基本設定（SHOPマスター／旧ショップマスター）（M10-01）E2E。
 * 納品ケース表 integration_test/e2e/m10_01_admin_shop_setting_setting_shop_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースを test() で実装する。手動/対象外（DB原値・結果キャッシュ・ログ出力抑止・
 * DB検索の非該当・権限/IP拒否の環境設定切替・楽観ロック等）はケース表で全量管理しspecに残さない。
 * 自動化予定だが未実装/要実機（013 type=email クライアント検証回避・015/016 永続値復元・017 number入力欄への非数投入）は
 * test.fixme で抜け漏れを可視化する。
 * 期待結果は仕様（正本 functions/pf-eccube3/m10-01_admin_shop_setting_setting_shop.md / 観点表）由来（オラクル独立性）。
 * 設計源は pf-eccube3（リバース）であり、刷新先 ec-cube-enterprise との乖離はケース表の付帯表4（不具合候補）で管理する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証について: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の
 * spec/admin/login.spec.ts・m02-m09/*.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報（ECCUBE_ADMIN_USER/PASS）が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *
 * 実行方針（安全第一・共有ステージング）:
 *  - 003/004 はフォームを無変更で再送信する冪等な正常系とし、副作用を最小化する。
 *  - 検証エラー系（010-014,017,018）は送信が失敗するため dtb_base_info を更新しない。
 *  - 015/016 は店名/数量を上書きし永続化するため、専用シード（SEED-M10-01-BASEINFO-RW）と値復元が要る → test.fixme。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AdminShopSettingSettingShopPage } from "../../../pages/admin/m10/m10_01_admin_shop_setting_setting_shop.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const SHOP_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/setting/shop(\\?|$)`);

/** 管理者ログインして店舗基本設定画面を開く。 */
async function gotoShopAsAdmin(page: Page): Promise<AdminShopSettingSettingShopPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const shop = new AdminShopSettingSettingShopPage(page);
  await shop.goto();
  return shop;
}

test.describe("管理画面 > 店舗設定 > 店舗基本設定", { tag: ["@admin", "@setting", "@shop"] }, () => {
  // ===== 認証不要・非破壊（常時実行可） =====

  test("E2E-M10-01-020 未ログインで店舗基本設定URL→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/shop`);
    await expect(page.locator("#login_id")).toBeVisible(); // 管理ログイン画面へ誘導（仕様: 権限・認可）
  });

  // ===== 画面表示（SEED-M10-01-BASEINFO） =====

  test("E2E-M10-01-001 店舗基本設定画面: 基本情報カードと登録ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const shop = await gotoShopAsAdmin(page);
    await shop.seeForm();
  });

  test("E2E-M10-01-002 店舗基本設定画面: 送料/会員/商品/地図の各カードが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const shop = await gotoShopAsAdmin(page);
    // 正典フロント挙動「表示要素」の節構成（送料/会員/商品/地図）由来。各カードの画面ラベルを観測する。
    // 「税設定」は正典 pf-eccube3 に該当節がなく刷新先のみの追加（invoice_registration_number）のため
    // オラクル化しない（付帯表4#8 不具合候補/要確認）。
    const body = page.locator("body");
    await expect(body).toContainText("送料設定");
    await expect(body).toContainText("会員設定");
    await expect(body).toContainText("商品設定");
    await expect(body).toContainText("地図設定");
  });

  test("E2E-M10-01-021 店舗基本設定画面: トグルスイッチと各入力欄が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const shop = await gotoShopAsAdmin(page);
    await expect(shop.companyName).toBeVisible();
    await expect(shop.shopName).toBeVisible();
    await expect(shop.email01).toBeVisible();
    await expect(shop.optionNostockHidden).toBeVisible();
  });

  // ===== 正常系保存（冪等・無変更再送信） =====

  test("E2E-M10-01-003 有効な現在値のまま登録→成功フラッシュが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M10-01-BASEINFO 必要）");
    const shop = await gotoShopAsAdmin(page);
    await shop.submit(); // 無変更で登録（冪等）
    await expect(shop.successAlert).toBeVisible(); // 成功フラッシュ（仕様: 処理フロー POST検証成功）
  });

  test("E2E-M10-01-004 保存成功後は同一の店舗基本設定画面へ遷移し再表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M10-01-BASEINFO 必要）");
    const shop = await gotoShopAsAdmin(page);
    await shop.submit();
    await expect(page).toHaveURL(SHOP_RE); // 同一画面へリダイレクト（仕様: 画面遷移）
    await expect(shop.registerButton).toBeVisible();
  });

  // ===== 異常系（バリデーション・非破壊：送信失敗で永続化されない） =====

  test("E2E-M10-01-010 送信元メール未入力→必須エラーで滞留", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const shop = await gotoShopAsAdmin(page);
    await shop.email01.fill(""); // 送信元メールを空に（required属性なし＝サーバ側NotBlankで判定）
    await shop.submit();
    await expect(shop.fieldError(shop.email01).first()).toBeVisible(); // 送信元メール欄近傍のエラーに限定（M1）
    await expect(shop.successAlert).toHaveCount(0); // 成功フラッシュは出ない
    await expect(page).toHaveURL(SHOP_RE); // 同画面に滞留
  });

  test("E2E-M10-01-011 問い合わせ受付メール未入力→必須エラーで滞留", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const shop = await gotoShopAsAdmin(page);
    await shop.email02.fill("");
    await shop.submit();
    await expect(shop.fieldError(shop.email02).first()).toBeVisible(); // 問い合わせ受付メール欄近傍に限定（M1）
    await expect(shop.successAlert).toHaveCount(0);
    await expect(page).toHaveURL(SHOP_RE);
  });

  test("E2E-M10-01-012 複数メール項目を空→複数の必須エラーが同時に表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const shop = await gotoShopAsAdmin(page);
    await shop.email01.fill("");
    await shop.email02.fill("");
    await shop.submit();
    // メール2項目それぞれの欄近傍にエラー（仕様: エッジケース「メール項目空・他は入力＝4項目NotBlankで同時エラー」）
    await expect(shop.fieldError(shop.email01).first()).toBeVisible();
    await expect(shop.fieldError(shop.email02).first()).toBeVisible();
    await expect(shop.successAlert).toHaveCount(0);
  });

  test("E2E-M10-01-014 店名 最大長+1→文字列長エラーで滞留", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const shop = await gotoShopAsAdmin(page);
    // 正典の店名最大長 50文字（stext_len 確認値）を超える長さ。最大長の正は仕様由来でForm制約値そのものはオラクル化しない。
    await shop.shopName.fill("あ".repeat(51));
    await shop.submit();
    await expect(shop.fieldError(shop.shopName).first()).toBeVisible(); // 店名欄近傍に限定（M1）
    await expect(shop.successAlert).toHaveCount(0);
    await expect(page).toHaveURL(SHOP_RE);
  });

  test("E2E-M10-01-018 会社名フリガナにカタカナ以外→文字種エラーで滞留", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const shop = await gotoShopAsAdmin(page);
    await shop.companyKana.fill("abc"); // カタカナ以外（仕様: 会社名フリガナはカタカナ）
    await shop.submit();
    await expect(shop.fieldError(shop.companyKana).first()).toBeVisible(); // 会社名フリガナ欄近傍に限定（M1）
    await expect(shop.successAlert).toHaveCount(0);
    await expect(page).toHaveURL(SHOP_RE);
  });

  test("E2E-M10-01-019 送料無料条件（金額）に負数→範囲エラーで滞留", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const shop = await gotoShopAsAdmin(page);
    // 正典エッジケース「送料無料金額に負数・非数→エラー」。金額欄は text 入力（MoneyType由来）のため非数/負数を投入可能。
    // 負数の境界値（-1）そのものはオラクル化せず、負値＝範囲外でエラー滞留という仕様挙動を観測する。
    await shop.deliveryFreeAmount.fill("-1");
    await shop.submit();
    await expect(shop.fieldError(shop.deliveryFreeAmount).first()).toBeVisible(); // 金額欄近傍に限定
    await expect(shop.successAlert).toHaveCount(0);
    await expect(page).toHaveURL(SHOP_RE);
  });

  test("E2E-M10-01-022 返信受付メール未入力→必須エラーで滞留", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const shop = await gotoShopAsAdmin(page);
    await shop.email03.fill(""); // 返信受付メール（ReplyTo）を空に（仕様: 返信受付メール=必須）
    await shop.submit();
    await expect(shop.fieldError(shop.email03).first()).toBeVisible(); // 返信受付メール欄近傍に限定（M1）
    await expect(shop.successAlert).toHaveCount(0);
    await expect(page).toHaveURL(SHOP_RE);
  });

  test("E2E-M10-01-023 送信エラー受付メール未入力→必須エラーで滞留", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const shop = await gotoShopAsAdmin(page);
    await shop.email04.fill(""); // 送信エラー受付メール（ReturnPath）を空に（仕様: 送信エラー受付メール=必須）
    await shop.submit();
    await expect(shop.fieldError(shop.email04).first()).toBeVisible(); // 送信エラー受付メール欄近傍に限定（M1）
    await expect(shop.successAlert).toHaveCount(0);
    await expect(page).toHaveURL(SHOP_RE);
  });

  test("E2E-M10-01-024 検証失敗時に入力値とエラーが保持され同画面で再描画される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const shop = await gotoShopAsAdmin(page);
    // 仕様: 処理フロー（POST、検証失敗）＝同一テンプレートを再描画し各項目のエラーを表示。入力値は再描画後も保持される。
    // 店名(text入力・変換リスナーなし)に最大長+1を入力して検証失敗させ、再描画後にその入力値が残ることを観測する。
    const tooLong = "あ".repeat(51);
    await shop.shopName.fill(tooLong);
    await shop.submit();
    await expect(shop.fieldError(shop.shopName).first()).toBeVisible(); // 文字列長エラー表示
    await expect(shop.shopName).toHaveValue(tooLong); // 入力値保持（再描画）
    await expect(shop.successAlert).toHaveCount(0); // 成功フラッシュは出ない
  });

  // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M10-01-013 送信元メール不正形式→メール形式エラー（要: type=email のクライアント検証回避）",
    async () => {
      // 期待は仕様（厳密メール）由来。<input type=email> のブラウザ検証で submit がブロックされるため、
      // novalidate 付与等の回避を実機確認後に実装する。
    }
  );

  test.fixme(
    "E2E-M10-01-015 店名 最大長ちょうど→保存成功（要: SEED-M10-01-BASEINFO-RW と永続値復元）",
    async () => {
      // 期待は仕様（境界内＝保存成功）由来。店名を上書き永続化するため専用シードと値復元手順が必要。
    }
  );

  test.fixme(
    "E2E-M10-01-016 送料無料数量に整数→保存成功（要: SEED-M10-01-BASEINFO-RW と永続値復元）",
    async () => {
      // 期待は仕様（数量 整数＝保存成功）由来。数量を上書き永続化するため専用シードと値復元手順が必要。
    }
  );

  test.fixme(
    "E2E-M10-01-017 送料無料数量に非数→数値エラー（要: number入力欄への非数投入の回避）",
    async () => {
      // 期待は仕様（数量 Regex \d+）由来。IntegerType(type=number) は非数の入力を弾くため、
      // DOM直接設定等の回避を実機確認後に実装する。
    }
  );
});
