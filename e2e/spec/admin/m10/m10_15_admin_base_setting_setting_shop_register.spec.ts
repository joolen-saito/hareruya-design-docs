/**
 * 管理画面 店舗設定 > 店舗基本設定の店舗登録（SHOPマスター保存）（M10-15）E2E。
 * 納品ケース表 integration_test/e2e/m10_15_admin_base_setting_setting_shop_register_e2e_cases.md に対応。
 * 本機能は M10-01 と同一画面 /admin/setting/shop（shop_master.twig / ShopMasterType）の
 * 「登録」ボタンによる POST 保存（dtb_base_info 既定1行の更新）の観点を主とする。
 *
 * 本specには「E2E自動化」ケースを test() で実装する。手動/対象外（DB原値・結果キャッシュ・ログ出力抑止・
 * DB検索の非該当・権限/IP拒否の環境設定切替・楽観ロック・住所マークアップ表示差等）はケース表で全量管理しspecに残さない。
 * 自動化予定だが未実装/要実機（013 type=email クライアント検証回避・015/016 永続値復元・017 number入力欄への非数投入）は
 * test.fixme で抜け漏れを可視化する。
 * 期待結果は仕様（正本 functions/pf-eccube3/m10-15_admin_base_setting_setting_shop_register.md / 観点表）由来（オラクル独立性）。
 * 設計源は pf-eccube3（リバース）であり、刷新先 ec-cube-enterprise との乖離はケース表の付帯表4（不具合候補）で管理する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証について: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の
 * spec/admin/login.spec.ts・m02-m10/*.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報（ECCUBE_ADMIN_USER/PASS）が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *
 * 実行方針（安全第一・共有ステージング）:
 *  - 003/004 はフォームを無変更で再送信する冪等な正常系とし、副作用を最小化する（成功時は永続化されるが値は不変）。
 *  - 検証エラー系（010-014,017,018,019）は送信が失敗するため dtb_base_info を更新しない。
 *  - 015/016 は店名/数量を上書きし永続化するため、専用シード（SEED-M10-15-BASEINFO-RW）と値復元が要る → test.fixme。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { BaseSettingSettingShopRegisterPage } from "../../../pages/admin/m10/m10_15_admin_base_setting_setting_shop_register.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const SHOP_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/setting/shop(\\?|$)`);

/** 管理者ログインして店舗基本設定（保存）画面を開く。 */
async function gotoShopAsAdmin(page: Page): Promise<BaseSettingSettingShopRegisterPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const shop = new BaseSettingSettingShopRegisterPage(page);
  await shop.goto();
  return shop;
}

test.describe(
  "管理画面 > 店舗設定 > 店舗基本設定の店舗登録（SHOPマスター保存）",
  { tag: ["@admin", "@setting", "@shop"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M10-15-020 未ログインで店舗基本設定URL→管理ログイン画面へ誘導（保存未到達）", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/shop`);
      await expect(page.locator("#login_id")).toBeVisible(); // 管理ログイン画面へ誘導（仕様: 権限・認可 / 判定順序#1）
    });

    // ===== 画面表示（SEED-M10-15-BASEINFO） =====

    test("E2E-M10-15-001 保存フォームに基本情報カードと登録ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const shop = await gotoShopAsAdmin(page);
      await shop.seeForm();
    });

    test("E2E-M10-15-002 送料/会員/商品/地図の各設定カードが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await gotoShopAsAdmin(page);
      // 正典フロント挙動「表示要素」の節構成（送料/会員/商品/地図）由来。各カードの画面ラベルを観測する。
      // 「税設定」は正典 pf-eccube3 に該当節がなく刷新先のみの追加（invoice_registration_number）のため
      // オラクル化しない（付帯表4#8 不具合候補/要確認）。
      const body = page.locator("body");
      await expect(body).toContainText("送料設定");
      await expect(body).toContainText("会員設定");
      await expect(body).toContainText("商品設定");
      await expect(body).toContainText("地図設定");
    });

    test("E2E-M10-15-021 トグルスイッチと各入力欄が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const shop = await gotoShopAsAdmin(page);
      await expect(shop.companyName).toBeVisible();
      await expect(shop.shopName).toBeVisible();
      await expect(shop.email01).toBeVisible();
      await expect(shop.optionNostockHidden).toBeVisible();
    });

    // ===== 正常系保存（冪等・無変更再送信） =====

    test("E2E-M10-15-003 有効な現在値のまま登録→保存され成功フラッシュが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M10-15-BASEINFO 必要）");
      const shop = await gotoShopAsAdmin(page);
      await shop.submit(); // 無変更で登録（冪等）
      await shop.seeSaveSuccess(); // 成功フラッシュ（仕様: 処理フロー POST検証成功・入出力 成功時出力）
    });

    test("E2E-M10-15-004 保存成功後は同一の店舗基本設定画面へリダイレクトされ再表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M10-15-BASEINFO 必要）");
      const shop = await gotoShopAsAdmin(page);
      await shop.submit();
      // URLは送信前から /setting/shop なので toHaveURL 単独では「POST後リダイレクトGET」を識別できない。
      // 成功フラッシュは PRG のリダイレクト先 GET でのみ描画されるため、フラッシュ表示を伴ってリダイレクト遷移を判定する
      // （仕様: 画面遷移 検証成功→同一画面へHTTPリダイレクトGET）。
      await shop.seeSaveSuccess();
      await expect(page).toHaveURL(SHOP_RE);
      await expect(shop.registerButton).toBeVisible();
    });

    // ===== 異常系（バリデーション・非破壊：送信失敗で永続化されない） =====

    test("E2E-M10-15-010 送信元メール未入力→必須エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const shop = await gotoShopAsAdmin(page);
      await shop.email01.fill(""); // 送信元メールを空に（required属性なし＝サーバ側NotBlankで判定）
      await shop.submit();
      await expect(shop.fieldError(shop.email01).first()).toBeVisible(); // 送信元メール欄近傍のエラーに限定
      await expect(shop.successAlert).toHaveCount(0); // 成功フラッシュは出ない
      await expect(page).toHaveURL(SHOP_RE); // 同画面に滞留
    });

    test("E2E-M10-15-011 問い合わせ受付メール未入力→必須エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const shop = await gotoShopAsAdmin(page);
      await shop.email02.fill("");
      await shop.submit();
      await expect(shop.fieldError(shop.email02).first()).toBeVisible(); // 問い合わせ受付メール欄近傍に限定
      await expect(shop.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(SHOP_RE);
    });

    test("E2E-M10-15-005 返信受付メール（email03）未入力→必須エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const shop = await gotoShopAsAdmin(page);
      // 正典はメール4項目（email01-04）を各々必須とする。email01/email02 の代表に寄せず項目別に確認する。
      await shop.email03.fill("");
      await shop.submit();
      await expect(shop.fieldError(shop.email03).first()).toBeVisible(); // 返信受付メール欄近傍に限定
      await expect(shop.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(SHOP_RE);
    });

    test("E2E-M10-15-006 送信エラー受付メール（email04）未入力→必須エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const shop = await gotoShopAsAdmin(page);
      await shop.email04.fill("");
      await shop.submit();
      await expect(shop.fieldError(shop.email04).first()).toBeVisible(); // 送信エラー受付メール欄近傍に限定
      await expect(shop.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(SHOP_RE);
    });

    test("E2E-M10-15-012 複数メール項目を空→複数の必須エラーが同時に表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const shop = await gotoShopAsAdmin(page);
      await shop.email01.fill("");
      await shop.email02.fill("");
      await shop.submit();
      // メール2項目それぞれの欄近傍にエラー（仕様: エッジケース「メール4項目のいずれか空→NotBlankで同時エラー」）
      await expect(shop.fieldError(shop.email01).first()).toBeVisible();
      await expect(shop.fieldError(shop.email02).first()).toBeVisible();
      await expect(shop.successAlert).toHaveCount(0);
    });

    test("E2E-M10-15-007 店名未入力→必須エラーで滞留（保存されない）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const shop = await gotoShopAsAdmin(page);
      // 正典「入力項目／バリデーション」で店名は NotBlank（必須）。空送信→必須エラー滞留・保存されない。
      // メール4項目だけでなく店名 NotBlank の異常系を項目別に確認（required属性なし＝サーバ側NotBlankで判定）。
      await shop.shopName.fill("");
      await shop.submit();
      await expect(shop.fieldError(shop.shopName).first()).toBeVisible(); // 店名欄近傍のエラーに限定
      await expect(shop.successAlert).toHaveCount(0); // 成功フラッシュは出ない
      await expect(page).toHaveURL(SHOP_RE); // 同画面に滞留
    });

    test("E2E-M10-15-024 店名フリガナにカタカナ以外→文字種エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const shop = await gotoShopAsAdmin(page);
      // 正典は会社名フリガナだけでなく店名フリガナにもカタカナ Regex を定義。会社名(018)に寄せず項目別に確認する。
      await shop.shopKana.fill("abc"); // カタカナ以外（仕様: 店名フリガナはカタカナ）
      await shop.submit();
      await expect(shop.fieldError(shop.shopKana).first()).toBeVisible(); // 店名フリガナ欄近傍に限定
      await expect(shop.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(SHOP_RE);
    });

    test("E2E-M10-15-014 店名 最大長+1→文字列長エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const shop = await gotoShopAsAdmin(page);
      // 正典の店名最大長 50文字（stext_len 確認値）を超える長さ。最大長の正は仕様由来でForm制約値そのものはオラクル化しない。
      await shop.shopName.fill("あ".repeat(51));
      await shop.submit();
      await expect(shop.fieldError(shop.shopName).first()).toBeVisible(); // 店名欄近傍に限定
      await expect(shop.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(SHOP_RE);
    });

    test("E2E-M10-15-018 会社名フリガナにカタカナ以外→文字種エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const shop = await gotoShopAsAdmin(page);
      await shop.companyKana.fill("abc"); // カタカナ以外（仕様: 会社名フリガナはカタカナ）
      await shop.submit();
      await expect(shop.fieldError(shop.companyKana).first()).toBeVisible(); // 会社名フリガナ欄近傍に限定
      await expect(shop.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(SHOP_RE);
    });

    test("E2E-M10-15-019 送料無料条件（金額）に非数→エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const shop = await gotoShopAsAdmin(page);
      // 正典エッジケース「送料無料金額に数字以外→Regexエラー」。金額欄は text 入力（MoneyType由来）のため非数を投入可能。
      // 投入値そのものはオラクル化せず、数字以外＝エラー滞留という仕様挙動を観測する。
      await shop.deliveryFreeAmount.fill("abc");
      await shop.submit();
      await expect(shop.fieldError(shop.deliveryFreeAmount).first()).toBeVisible(); // 金額欄近傍に限定
      await expect(shop.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(SHOP_RE);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M10-15-013 送信元メール不正形式→メール形式エラー（要: type=email のクライアント検証回避）",
      async () => {
        // 期待は仕様（厳密メール Email strict）由来。<input type=email> のブラウザ検証で submit がブロックされるため、
        // novalidate 付与等の回避を実機確認後に実装する。
      }
    );

    test.fixme(
      "E2E-M10-15-015 店名 最大長ちょうど→保存成功（要: SEED-M10-15-BASEINFO-RW と永続値復元）",
      async () => {
        // 期待は仕様（境界内＝保存成功）由来。店名を上書き永続化するため専用シードと値復元手順が必要。
      }
    );

    test.fixme(
      "E2E-M10-15-016 送料無料数量に整数→保存成功（要: SEED-M10-15-BASEINFO-RW と永続値復元）",
      async () => {
        // 期待は仕様（数量 整数＝保存成功）由来。数量を上書き永続化するため専用シードと値復元手順が必要。
      }
    );

    test.fixme(
      "E2E-M10-15-017 送料無料数量に非数→数値エラー（要: number入力欄への非数投入の回避）",
      async () => {
        // 期待は仕様（数量 Regex \d+）由来。IntegerType(type=number) は非数の入力を弾くため、
        // DOM直接設定等の回避を実機確認後に実装する。
      }
    );
  }
);
