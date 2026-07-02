/**
 * 管理画面 データ管理 > 買取減額率一覧 E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m16_08_admin_data_data_buy_discount_list_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち非破壊で安全に実行できるケースのみ test 本体で実装し、
 * データ依存（厳密な浮動小数表示など）は test.fixme（理由付き）で残す。
 * 手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様（正本 functions/pf-eccube3/m16-08_admin_data_data_buy_discount_list.md／観点表／基本設計）由来（オラクル独立性）。
 * 実装から取るのはセレクタ（位置情報）のみ。
 *
 * pf-eccube3 リバース設計と刷新先 ec-cube-enterprise の乖離（入口パス：仕様 /buy_discount に対し実装 /data/buy_discount、
 * title/sub_title ブロック割当、設計記載の id news_list_box__list_header 不在）はケース表「付帯表4」に出し、
 * テストは仕様どおりに書く（実装が違えば落ちて検出する＝入口パスも仕様値 /buy_discount を期待）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / m15系）に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針（安全第一・共有環境・参照系）:
 *  - 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 本機能は参照系（GET）でありDBを変更しない。表示・遷移は安全に実行できる。
 *  - 列見出し・行名称・レート値・「未定義」表示はマスタ/交差データ依存。マスタが空の環境では skip/fixme で可視化する。
 *
 * 環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）。
 *  - BD_SEED_CODE / BD_SEED_NAME : 一覧に必ず現れるカード状態コード・買取減額率名称（SEED-M16-08-MASTER 由来。任意）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { DataDataBuyDiscountListPage } from "../../../pages/admin/m16/m16_08_admin_data_data_buy_discount_list.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
// 設計書「利用者視点の入口」= /buy_discount（仕様由来オラクル）。実装 route admin_data_buy_discount = /data/buy_discount への移設は
// 仕様どおりの本アサーションが落ちて検出する（title/sub_title 乖離と同方針）。乖離は付帯表4#1。
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/buy_discount(\\?|$)`);

const SEED_CODE = process.env.BD_SEED_CODE || "";
const SEED_NAME = process.env.BD_SEED_NAME || "";

/** 管理ログインしてから買取減額率一覧（仕様入口 GET /buy_discount）を開く。 */
async function gotoListAsAdmin(page: Page): Promise<DataDataBuyDiscountListPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const list = new DataDataBuyDiscountListPage(page);
  await list.goto();
  return list;
}

test.describe(
  "管理画面 > データ管理 > 買取減額率一覧",
  { tag: ["@admin", "@data", "@buy_discount"] },
  () => {
    // ===== 未認証（資格情報不要・非破壊） =====

    test("E2E-M16-08-003 未認証でURL直接GET→管理ログイン画面へ誘導", async ({ page }) => {
      // 期待は仕様（権限・認可: 未認証は管理ログイン要求に帰着）由来。
      const list = new DataDataBuyDiscountListPage(page);
      await list.goto();
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 表示（GET・非破壊。資格情報必須） =====

    test("E2E-M16-08-002 URL直接GETで買取減額率一覧表が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      await expect(page).toHaveURL(LIST_RE);
      await list.seeTable();
    });

    test("E2E-M16-08-001 ナビ「データ管理」→「買取減額率一覧」で一覧表が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
      const list = new DataDataBuyDiscountListPage(page);
      await list.gotoViaMenu(); // ナビ開閉DOMは要実機確認（リンク文言で特定）
      await expect(page).toHaveURL(LIST_RE);
      await list.seeTable();
    });

    test("E2E-M16-08-004 一覧GETが200でHTML（共通フレーム＋表）を返す", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
      const list = new DataDataBuyDiscountListPage(page);
      const resp = await page.goto(list.url);
      expect(resp?.status()).toBe(200); // 仕様（入出力: 成功時HTML）由来
      await list.seeTable();
    });

    test("E2E-M16-08-007 左端ヘッダ列が「名称」である", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      // 期待は仕様（フロント挙動: 左端ヘッダは「名称」）由来。
      await expect(list.nameHeader).toHaveText("名称");
    });

    test("E2E-M16-08-012 一覧テンプレートに行クリック/操作ボタンが定義されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      // 期待は仕様（画面遷移: 一覧テンプレートは行クリックやボタンを定義しない）由来。
      await expect(list.table.locator("button")).toHaveCount(0);
      await expect(list.table.locator("a")).toHaveCount(0);
    });

    test("E2E-M16-08-013 一覧表示は同一URLのHTMLに留まる（送信・遷移を発生させない）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      await expect(page).toHaveURL(LIST_RE);
      await list.seeTable();
      await expect(page).toHaveURL(LIST_RE); // 自動遷移しないこと
    });

    test("E2E-M16-08-014 表ラッパー/表本体に設計どおりのレイアウトクラスが付与される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      // 期待は仕様（フロント挙動 CSS・レイアウト: table-responsive with-border / table table-striped）由来。
      await list.seeLayoutClasses();
    });

    // ===== タイトル/サブタイトル（仕様乖離あり＝失敗で検出見込み。付帯表4#2/#3） =====

    test("E2E-M16-08-005 タイトル帯が「買取減額率管理」である", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      // 期待は設計書（フロント挙動: block title=「買取減額率管理」）由来。
      // 刷新実装の trans admin.data.buy_discount_management は「買取減額率一覧」で乖離＝付帯表4#2。仕様どおり期待し落ちて検出する。
      await expect(list.pageTitle).toContainText("買取減額率管理");
    });

    test("E2E-M16-08-006 サブタイトルが「買取減額率一覧」である", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      // 期待は設計書（フロント挙動: block sub_title=「買取減額率一覧」）由来。
      // 刷新実装の trans admin.data.data_management は「データ管理」で乖離＝付帯表4#3。仕様どおり期待し落ちて検出する。
      await expect(list.subTitle).toContainText("買取減額率一覧");
    });

    // ===== データ依存（マスタ/交差シード必須） =====

    test("E2E-M16-08-011 交差なしセルに固定文言「未定義」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      // 期待は仕様（業務ルール・エッジケース: 交差が無いセルは「未定義」）由来。要・欠損交差シード（SEED-M16-08-MASTER）。
      await list.seeUndefinedCell();
    });

    test("E2E-M16-08-008 列見出しにカード状態コードが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!SEED_CODE, "BD_SEED_CODE 未設定（SEED-M16-08-MASTER のカード状態コード）");
      const list = await gotoListAsAdmin(page);
      // 期待は仕様（フロント挙動: 列ヘッダは mtb_card_condition の code）由来。
      await list.seeColumnCode(SEED_CODE);
    });

    test("E2E-M16-08-009 各行の先頭セルに買取減額率マスタ名称が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!SEED_NAME, "BD_SEED_NAME 未設定（SEED-M16-08-MASTER の買取減額率名称）");
      const list = await gotoListAsAdmin(page);
      // 期待は仕様（フロント挙動: 各行の第一データ列は mtb_buy_discount の名称）由来。
      await list.seeRowName(SEED_NAME);
    });

    // ===== 自動化予定だが要実機/データ依存（fixme・抜け漏れ可視化） =====

    test.fixme(
      "E2E-M16-08-010 交差ありセルに rate の数値（桁区切り/％なしの素の浮動小数）が表示される（要: 既知レートの交差シードと正規表現照合）",
      async () => {
        // 期待は仕様（フロント挙動/エッジケース: rate を Twig が素の浮動小数として出力、桁落ち表現もあり得る）由来。
        // 既知の (buy_discount_id, card_condition_id, rate) を固定シードした上で、当該セルの数値表現を照合する手順を実機確認後に実装。
      }
    );
  }
);
