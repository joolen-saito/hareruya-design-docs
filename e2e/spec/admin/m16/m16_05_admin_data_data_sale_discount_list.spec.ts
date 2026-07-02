/**
 * 管理画面 データ管理 — 販売割引率一覧 E2E（閲覧専用 list 画面）。
 * 納品ケース表 integration_test/e2e/m16_05_admin_data_data_sale_discount_list_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装し、乖離検出（005 タイトル／011 未定義）・要シード（012 rate値）は
 * test.fixme（理由付き）。手動/間接・対象外はケース表で全量管理し、spec に大量の fixme を残さない（規約準拠）。
 * 期待結果は仕様（functions/pf-eccube3/m16-05_admin_data_data_sale_discount_list.md / 観点表）由来（オラクル独立性）。
 * 実装（ec-cube-enterprise の現挙動）からはセレクタのみ取得する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 設計（pf-eccube3 HareruyaEc）と刷新先（ec-cube-enterprise コア）の乖離（ケース表 付帯表4）:
 *  - #1 タイトル: 設計「割引率管理」/「割引率一覧」 vs 刷新「販売割引率一覧」/「データ管理」（005 を fixme）
 *  - #2 交差なしセル: 設計「未定義」 vs 刷新「-」（011 を fixme）
 *  - #3 入口パス: 設計 /{admin_route}/discount vs 刷新 /{admin_route}/data/discount（刷新先パスでナビゲート）
 * ナビゲーションは刷新先パスを用い、合否は上位オラクル（設計書・観点表）で判定する。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { DataDataSaleDiscountListPage } from "../../../pages/admin/m16/m16_05_admin_data_data_sale_discount_list.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 刷新先入口（付帯表4#3）。設計の /{admin_route}/discount ではなく /{admin_route}/data/discount。
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/data/discount(\\?|$)`);

/** 管理者ログインして販売割引率一覧画面を表示する。 */
async function loginAndOpenList(page: Page): Promise<DataDataSaleDiscountListPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const list = new DataDataSaleDiscountListPage(page);
  await list.goto();
  return list;
}

test.describe("データ管理 > 販売割引率一覧", { tag: ["@admin", "@data", "@discount"] }, () => {
  // ===== 認証不要・非破壊（常時実行可） =====

  test("E2E-M16-05-010 未認証で一覧URL直接GET→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/data/discount`);
    await expect(page.locator("#login_id")).toBeVisible(); // 権限・認可: 未認証は共通ログイン要求
    // 設計「一覧を表示せず管理ログイン画面へ誘導」: 割引一覧表は出力されない
    await expect(page.locator("table.discount-table")).toHaveCount(0);
  });

  // ===== 認証必須（SEED-M16-05-ADMIN／一部 SEED-M16-05-MASTER） =====

  test("E2E-M16-05-001 一覧画面が表示され左端「名称」列を含む表が出力される", async ({ page }) => {
    test.skip(!HAS_CREDS, "管理者資格情報 未設定（ECCUBE_ADMIN_USER/PASS）");
    const list = await loginAndOpenList(page);
    await expect(page).toHaveURL(LIST_RE);
    await list.seeList(); // table 表示＋左端ヘッダ「名称」（設計値）
  });

  test("E2E-M16-05-002 URL直接GETで同一の一覧画面（共通フレーム）が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "管理者資格情報 未設定");
    const list = await loginAndOpenList(page);
    await expect(page).toHaveURL(LIST_RE); // 同一URL滞留
    await expect(list.table).toBeVisible(); // 割引一覧表を含むHTML
  });

  test("E2E-M16-05-003 表頭が左端「名称」＋カード状態 code の列見出しで構成される", async ({ page }) => {
    test.skip(!HAS_CREDS, "管理者資格情報 未設定");
    const list = await loginAndOpenList(page);
    await expect(list.nameHeader).toHaveText("名称"); // 設計: 左端ヘッダ
    const codes = await list.columnCodeHeaders(); // 以降の列見出し（カード状態 code）
    expect(codes.length, "カード状態コードの列見出しが1列以上（要 SEED-M16-05-MASTER）").toBeGreaterThan(0);
    // 設計: 各列見出しはカード状態 code 文字列（和名/英名は出さない）。値は SEED 依存のため非空であることで構造を確認。
    for (const code of codes) {
      expect(code.length, "各カード状態列の見出しが非空（CardCondition.code）").toBeGreaterThan(0);
    }
  });

  test("E2E-M16-05-004 各データ行が名称セル＋カード状態ごとのセルで構成される", async ({ page }) => {
    test.skip(!HAS_CREDS, "管理者資格情報 未設定");
    const list = await loginAndOpenList(page);
    const rowCount = await list.bodyRows.count();
    test.skip(rowCount === 0, "割引マスタ0件（要 SEED-M16-05-MASTER の mtb_discount）");
    const headerCount = await list.headerCells.count(); // 名称列＋カード状態列数
    const cellCount = await list.firstRowCellCount();
    expect(cellCount, "データ行のセル数＝表頭の列数（名称列＋カード状態列）").toBe(headerCount);
    // 設計: 各行の先頭セルは対応する割引マスタの名称（Discount.name）。値は SEED 依存のため非空であることで確認。
    const firstName = (await list.bodyRows.first().locator("td").first().innerText()).trim();
    expect(firstName.length, "データ行の先頭セルに割引マスタ名称が表示される（非空）").toBeGreaterThan(0);
  });

  test("E2E-M16-05-006 一覧テンプレートに入力欄・送信ボタン・行リンクが無い（閲覧専用）", async ({ page }) => {
    test.skip(!HAS_CREDS, "管理者資格情報 未設定");
    const list = await loginAndOpenList(page);
    await expect(list.table).toBeVisible();
    await list.seeReadOnly(); // form/button/input/a が本文表領域に無い
  });

  test("E2E-M16-05-007 表示後も同一URLに留まり遷移・送信が発生しない", async ({ page }) => {
    test.skip(!HAS_CREDS, "管理者資格情報 未設定");
    const list = await loginAndOpenList(page);
    await expect(page).toHaveURL(LIST_RE);
    await list.table.click(); // 表領域を操作しても
    await expect(page).toHaveURL(LIST_RE); // 同一URLに留まる（リンク/送信を定義しない）
  });

  // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M16-05-005 タイトル/サブタイトルが設計値「割引率管理」/「割引率一覧」（付帯表4#1 乖離検出）",
    async () => {
      // 期待は仕様（設計 block title/sub_title）由来。刷新先は「販売割引率一覧」/「データ管理」を出力し失敗で検出する。
      // タイトルの既定フレーム出力先セレクタが要実機確認のため fixme。期待値を実装へ書き換えない（オラクル独立性）。
    }
  );

  test.fixme(
    "E2E-M16-05-011 交差なしセルに設計の固定文言「未定義」が表示される（付帯表4#2 乖離検出・要GAPシード）",
    async () => {
      // 期待は仕様（エッジケース: 交差なし→「未定義」）由来。刷新先は「-」を出力し失敗で検出する。
      // SEED-M16-05-GAP（交差欠損の割引×カード状態の組合せ）整備後に実装。
    }
  );

  test.fixme(
    "E2E-M16-05-012 交差ありセルに rate 数値が桁区切り/%なしで表示される（要 SEED-M16-05-MASTER 既知rate）",
    async () => {
      // 期待は仕様（業務ルール: セル値= rate の参照・丸め/百分率なし）由来。
      // 既知の (discount_id, card_condition_id, rate) を投入後、当該セルのテキスト一致で実装。
    }
  );
});
