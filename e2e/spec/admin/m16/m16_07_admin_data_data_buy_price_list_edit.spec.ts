/**
 * 管理画面 データ管理 > 買取価格対応表（編集） E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m16_07_admin_data_data_buy_price_list_edit_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち非破壊で安全に実行できるケースのみ test 本体で実装し、
 * 破壊的更新・要実機確認・要確認(仕様乖離)は test.fixme（理由付き）で残す。
 * 手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様（正本 functions/pf-eccube3/m16-07_admin_data_data_buy_price_list_edit.md／観点表）由来（オラクル独立性）。
 * pf-eccube3 リバース設計と刷新先 ec-cube-enterprise の乖離（URLパス・フォームprefix名・タイトル/サブタイトル割当・
 * 価格 GreaterThanOrEqual(0) 制約・戻るが<a>リンク）はケース表「付帯表4」に出し、テストは仕様どおりに書く
 * （実装が違えば落ちて検出する）。ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / m15系）に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針（安全第一・共有環境）:
 *  - 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 更新(010/011)は mtb_buy_price_list マスタ値を変更するため、元値の退避→更新→復元を行い後始末する。
 *  - CSRF 403・戻るで保存されない(間接)・不正値(負値/非数値=仕様乖離要確認)は test.fixme で残す。
 *
 * シード資格情報（環境変数。コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理者ログイン（config/default.config）
 *  - SEED-M16-07-BUYPRICE : mtb_buy_price_list の編集対象行（マスタ初期データに存在。更新後は元値へ復元）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { DataDataBuyPriceListEditPage } from "../../../pages/admin/m16/m16_07_admin_data_data_buy_price_list_edit.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 正規表現メタ文字を含み得る環境可変値（ECCUBE_ADMIN_ROUTE）を安全にURLへ埋め込む。
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// URLアサーションは仕様（利用者視点の入口）由来＝一覧 `/{admin_route}/buy_price_list`、
// 編集 `/{admin_route}/buy_price_list/{id}`。実装(enterprise)の `/data/.../edit`・`/update` 乖離は
// 付帯表4#1 の不具合候補であり、本アサートは仕様URLを期待として実装乖離を「失敗」で検出する（オラクル独立性）。
// 一方、ページへ到達するための goto/リンク遷移（POM）は到達のため実装URLを位置情報として用いる。
const LIST_RE = new RegExp(
  `/${escapeRe(ECCUBE_ADMIN_ROUTE)}/buy_price_list(\\?|$)`
);
const EDIT_RE = new RegExp(
  `/${escapeRe(ECCUBE_ADMIN_ROUTE)}/buy_price_list/\\d+(\\?|$)`
);
const LOGIN_RE = /\/login(\?|$)/;

// 仕様(処理フロー#7／messages.ja.yaml:1773)由来の成功フラッシュ文言。実装に合わせて変えない（オラクル独立性）。
const SUCCESS_MSG = "登録が完了しました。";

async function adminLogin(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 > データ管理（買取価格対応表 編集）",
  { tag: ["@admin", "@data", "@buy_price_list"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M16-07-070 未認証で編集URL直接→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/data/buy_price_list/1/edit`);
      await expect(page.locator("#login_id")).toBeVisible();
      await expect(page).toHaveURL(LOGIN_RE);
    });

    // ===== ログイン必須・非破壊（直接アクセス／表示確認） =====

    test("E2E-M16-07-040 存在しないidの編集URLは404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const target = new DataDataBuyPriceListEditPage(page);
      const res = await target.gotoEdit(99999999); // 判定順序#1: 行未取得で404
      expect(res?.status()).toBe(404);
    });

    test("E2E-M16-07-041 非数値idの編集URLは404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      // ルート要件 id=\d+ に一致せず到達不可（利用者視点の入口: 存在しないid→404）。
      const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/data/buy_price_list/abc/edit`);
      expect(res?.status()).toBe(404);
    });

    test("E2E-M16-07-001 一覧の金額セル押下で編集画面へ遷移し買取価格欄が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const target = new DataDataBuyPriceListEditPage(page);
      await target.openEditFromList();
      await expect(page).toHaveURL(EDIT_RE); // 利用者視点の入口（仕様URL）
      await expect(target.priceInput).toBeVisible();
      // フロント挙動（表示要素）: 画面タイトルは仕様で「買取価格対応表」。テキスト一致のみ（CSS創作なし）。
      await expect(target.pageTitle).toBeVisible();
    });

    test("E2E-M16-07-002 編集画面に識別表（NM価格/カード状態/Foil列）が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const target = new DataDataBuyPriceListEditPage(page);
      await target.openEditFromList();
      await expect(target.idTable).toBeVisible();
      await expect(target.idTable).toContainText("NM価格"); // 表示のみの識別情報
      await expect(target.idTable).toContainText("カード状態");
      // 仕様（フロント挙動・表示要素）: 識別表は3列（NM価格／カード状態／Foil or Promotion Card?）。
      // 第3列ヘッダ文言は実装trans依存のため文言を固定せず、列構造（3列）で検証（オラクル独立性）。
      await expect(target.idTable.locator("thead th")).toHaveCount(3);
    });

    test("E2E-M16-07-003 買取価格欄に必須バッジ「必須」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const target = new DataDataBuyPriceListEditPage(page);
      await target.openEditFromList();
      await expect(target.requiredBadge).toBeVisible(); // 買取価格(円)は必須（入力項目定義）
    });

    test("E2E-M16-07-004 編集画面に「更新」「戻る」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const target = new DataDataBuyPriceListEditPage(page);
      await target.openEditFromList();
      await expect(target.updateButton).toBeVisible();
      await expect(target.backLink).toBeVisible();
    });

    test("E2E-M16-07-005 編集画面に現在の買取価格が初期値として表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const target = new DataDataBuyPriceListEditPage(page);
      await target.openEditFromList();
      // 入力項目（仕様）: 初期値＝当該行の現行 price。具体値は実データ依存のため固定せず
      // 「空でないこと」で初期値表示を検証（オラクル独立性）。
      await expect(target.priceInput).not.toHaveValue("");
    });

    test("E2E-M16-07-022 買取価格未入力で更新しても成功メッセージが表示されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const target = new DataDataBuyPriceListEditPage(page);
      await target.openEditFromList();
      // 処理フロー#5: 検証失敗時は成功フラッシュを積まない。空送信は保存されないため非破壊。
      await target.update("");
      await expect(page).toHaveURL(EDIT_RE);
      await expect(page.locator("body")).not.toContainText(SUCCESS_MSG);
    });

    test("E2E-M16-07-042 存在しないidへの更新POSTは404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      // 判定順序#1: 行未存在は CSRF(#2) 判定より先に404（GET/POST両系）。
      // page.request はログイン済みコンテキストの Cookie を共有。対象行が無いため DB 副作用なし（非破壊）。
      const res = await page.request.post(
        `/${ECCUBE_ADMIN_ROUTE}/data/buy_price_list/99999999/update`,
        { form: {}, failOnStatusCode: false }
      );
      expect(res.status()).toBe(404);
    });

    // E2E-020 はエラー表示の厳密セレクタが未確認（付帯表4#7・要実機確認）のため fixme で保留。
    // 「未入力→検証失敗で保存されない」の仕様不変条件は E2E-021（編集画面滞留）が能動的に担保する。
    test.fixme(
      "E2E-M16-07-020 買取価格未入力で更新するとエラーが表示される（要実機確認: form_errors表示セレクタ）",
      async () => {
        // 期待は仕様(判定順序#3・必須バリデーション)由来=エラー表示。表示領域の厳密セレクタ
        // （EC-CUBE標準 .invalid-feedback 等）は実機確認後に確定して能動アサート化する。
        // 未確認セレクタを能動テストの合否オラクルにしない（オラクル独立性・付帯表4#7）。
      }
    );

    test("E2E-M16-07-021 買取価格未入力で更新すると編集画面に滞留し保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const target = new DataDataBuyPriceListEditPage(page);
      await target.openEditFromList();
      await target.update(""); // 検証失敗→編集テンプレ再表示（一覧へ遷移しない）
      await expect(page).toHaveURL(EDIT_RE);
    });

    test("E2E-M16-07-030 「戻る」押下で一覧へ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const target = new DataDataBuyPriceListEditPage(page);
      await target.openEditFromList();
      await target.backLink.click();
      await expect(page).toHaveURL(LIST_RE); // 戻る→一覧（保存しない）
    });

    // ===== 破壊的更新（マスタ値変更・元値復元で後始末） =====

    test("E2E-M16-07-010 有効な買取価格で更新すると一覧へリダイレクトされる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const target = new DataDataBuyPriceListEditPage(page);
      await target.openEditFromList();
      const original = await target.priceInput.inputValue(); // 元値退避（後始末）
      const editUrl = page.url();
      try {
        await target.update("123"); // 判定順序#4: 妥当→保存し一覧へリダイレクト
        await expect(page).toHaveURL(LIST_RE);
      } finally {
        // 後始末: マスタ値を元に戻す（共有環境を汚さない）。
        await page.goto(editUrl);
        await target.update(original);
      }
    });

    test("E2E-M16-07-011 更新成功時に成功メッセージ「登録が完了しました。」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const target = new DataDataBuyPriceListEditPage(page);
      await target.openEditFromList();
      const original = await target.priceInput.inputValue();
      const editUrl = page.url();
      try {
        await target.update("123");
        await expect(page.locator("body")).toContainText(SUCCESS_MSG); // 処理フロー#7 成功フラッシュ
      } finally {
        await page.goto(editUrl);
        await target.update(original);
      }
    });

    // ===== 保留（要実機確認・要確認・間接。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M16-07-050 CSRFトークン無効の更新POST→403（要: トークン改ざんPOSTの実機確認）",
      async () => {
        // 期待は仕様(判定順序#2／エラー処理)由来=HTTP 403。ブラウザUIからのCSRF改ざんは実機手順確定後に実装。
      }
    );

    test.fixme(
      "E2E-M16-07-031 「戻る」では買取価格が保存されない（DB値の間接確認・要シード/再表示比較）",
      async () => {
        // 期待は仕様(画面遷移: 戻るは保存されない)由来。価格変更→戻る→再編集で値が不変であることの間接確認手順を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M16-07-060 不正な買取価格（負値/非数値）で更新→エラー（要確認: 仕様乖離 付帯表4#5）",
      async () => {
        // 設計書は明示Range制約なしと記す一方、enterpriseは GreaterThanOrEqual(0)。負値の合否は仕様要確認のため保留。
      }
    );
  }
);
