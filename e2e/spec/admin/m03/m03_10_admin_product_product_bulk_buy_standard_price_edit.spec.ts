/**
 * 商品管理「買取・基準価格一括編集」E2E。
 * 納品ケース表 integration_test/e2e/m03_10_admin_product_product_bulk_buy_standard_price_edit_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装する。価格更新の永続化（buy_price/standard_price 再計算・
 * dtb_price_history INSERT・行単位コミット・price02不変）はブラウザで観測できずDB照合が必要なため
 * 手動/間接としてケース表で全量管理し、specに大量のfixmeを残さない（規約準拠）。
 * 要シード（削除済み規格・買取マスタ無）と不具合候補（買取vs販売NM・買取必須）は test.fixme で残す。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-10_admin_product_product_bulk_buy_standard_price_edit.md /
 * messages.ja.yaml)由来（オラクル独立性）。設計源は pf-eccube3 のリバースであり、刷新先 ec-cube-enterprise
 * との乖離はケース表 付帯表4 に記載。実装からはセレクタ・ルート（位置情報）のみを取り、合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 *
 * シード（SEED-M03-10-PRODUCT 等）はステージング投入前提。価格更新系（020/021/031）は破壊的のため
 * 隔離環境または使い捨てシードで実行する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductBulkBuyStandardPriceEditPage } from "../../../pages/admin/m03/m03_10_admin_product_product_bulk_buy_standard_price_edit.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const PRODUCT_LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product(/page/\\d+)?(\\?|$)`);
// 注: 検証失敗時の登録 POST 先は admin_product_bulk_update_buy_price（/product/bulk_update_buy_price）であり、
// 編集表示 GET の admin_product_edit_bulk_update_buy_price とは別ルート。失敗時はリダイレクトせず
// 同テンプレートを再表示する（Controller render）。仕様の判定はURL文字列ではなく
// 「編集画面の再表示（フォーム可視・一覧へ遷移しない）＋エラーフラッシュ」で行う（オラクル独立性）。

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const FLASH_NOT_SELECT = "1つ以上の商品を選択してください"; // :1769 ids空
const FLASH_REGISTER_COMPLETE = "登録が完了しました。"; // :1773 成功
// 買取>基準(NM)の相関エラー（:1772）。動的パラメータを含むため固定部分で確認する。
const ERR_BUY_EXCEEDS_STANDARD = "買取価格は基準価格";

/** 管理ログインする。 */
async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 > 商品管理 > 買取・基準価格一括編集",
  { tag: ["@admin", "@product"] },
  () => {
    // ===== 認証不要（資格情報不要・常時実行可） =====

    test("E2E-M03-10-012 未ログインで編集URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      const target = new ProductProductBulkBuyStandardPriceEditPage(page);
      await target.gotoEdit([1]);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 入口・表示（要シード SEED-M03-10-PRODUCT） =====

    test("E2E-M03-10-001 一覧でチェックし一括編集ボタンを押すと編集表が開く", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new ProductProductBulkBuyStandardPriceEditPage(page);
      await target.gotoList();
      await target.openEditorFromList();
      await expect(target.form).toBeVisible();
    });

    test("E2E-M03-10-002 編集URLをGET(?ids[]=)で開くと編集表が開く", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new ProductProductBulkBuyStandardPriceEditPage(page);
      // 対象商品IDはシード由来。ここでは存在するIDを env で受ける想定（既定1）。
      const productId = Number(process.env.E2E_M0310_PRODUCT_ID || "1");
      await target.gotoEdit([productId]);
      await expect(target.form).toBeVisible();
    });

    test("E2E-M03-10-003 編集表のヘッダ・登録ボタン・商品一覧リンクが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new ProductProductBulkBuyStandardPriceEditPage(page);
      const productId = Number(process.env.E2E_M0310_PRODUCT_ID || "1");
      await target.gotoEdit([productId]);
      await target.seeEditForm();
      await expect(page.locator("body")).toContainText("買取価格(NM)"); // ヘッダ trans :2086
      await expect(page.locator("body")).toContainText("基準価格(NM)"); // ヘッダ trans :2092
    });

    test("E2E-M03-10-004 買取価格(NM)・基準価格(NM)入力で価格比率がJS再計算される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new ProductProductBulkBuyStandardPriceEditPage(page);
      const productId = Number(process.env.E2E_M0310_PRODUCT_ID || "1");
      await target.gotoEdit([productId]);
      await target.buyPriceNm.first().fill("500");
      await target.basePriceNm.first().fill("1000");
      // 買取÷基準=0.5 がJSで読み取り専用欄に反映される（仕様：価格比率の再計算）。
      await expect(target.ratioOutput.first()).toHaveValue("0.5");
    });

    test("E2E-M03-10-005 基準価格(SP)欄はreadonlyで編集できない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new ProductProductBulkBuyStandardPriceEditPage(page);
      const productId = Number(process.env.E2E_M0310_PRODUCT_ID || "1");
      await target.gotoEdit([productId]);
      // SP規格を持つ商品が前提（SEED-M03-10-PRODUCT）。無ければ skip 相当。
      test.skip(
        (await target.basePriceSp.count()) === 0,
        "SP規格を持つ商品が編集表に無い（SEED-M03-10-PRODUCT 要件）"
      );
      await expect(target.basePriceSp.first()).toHaveAttribute("readonly", /.*/);
    });

    test("E2E-M03-10-006 商品ID・NM規格IDの隠しフィールドが存在する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new ProductProductBulkBuyStandardPriceEditPage(page);
      const productId = Number(process.env.E2E_M0310_PRODUCT_ID || "1");
      await target.gotoEdit([productId]);
      await expect(
        page.locator('input[name*="[product_id]"]').first()
      ).toHaveCount(1);
      await expect(
        page.locator('input[name*="[product_class_id_nm]"]').first()
      ).toHaveCount(1);
    });

    test("E2E-M03-10-007 編集表の初期表示時にNM買取各行の価格比率がJS算出される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new ProductProductBulkBuyStandardPriceEditPage(page);
      const productId = Number(process.env.E2E_M0310_PRODUCT_ID || "1");
      await target.gotoEdit([productId]);
      // 仕様(フロント挙動 JS挙動)：初期表示時もNM買取各行に対して一度計算する。
      // 入力操作前でも価格比率欄に算出値が表示される。具体値はシード依存のため数値であることのみ確認（オラクル独立）。
      await expect(target.ratioOutput.first()).toHaveValue(/\d/);
    });

    // ===== ガード・遷移 =====

    test("E2E-M03-10-010 idsを付けず編集URLへ→エラーフラッシュ＋一覧リダイレクト", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new ProductProductBulkBuyStandardPriceEditPage(page);
      await target.gotoEdit([]); // ids なし
      await expect(page).toHaveURL(PRODUCT_LIST_RE); // 商品一覧へリダイレクト
      await expect(target.errorFlash).toContainText(FLASH_NOT_SELECT);
    });

    test("E2E-M03-10-011 「商品一覧」リンクで商品一覧へ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new ProductProductBulkBuyStandardPriceEditPage(page);
      const productId = Number(process.env.E2E_M0310_PRODUCT_ID || "1");
      await target.gotoEdit([productId]);
      await target.productListLink.first().click();
      await expect(page).toHaveURL(PRODUCT_LIST_RE);
    });

    // ===== 確定・成功（破壊的・要シード） =====

    test("E2E-M03-10-020 妥当な価格を入力し登録→成功フラッシュ＋一覧resume=1リダイレクト", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new ProductProductBulkBuyStandardPriceEditPage(page);
      const productId = Number(process.env.E2E_M0310_PRODUCT_ID || "1");
      await target.gotoEdit([productId]);
      // 買取(NM)≦基準(NM) の妥当値（仕様：買取は基準以下）。
      await target.basePriceNm.first().fill("1000");
      await target.buyPriceNm.first().fill("500");
      await target.submit();
      await expect(target.successFlash).toContainText(FLASH_REGISTER_COMPLETE);
      await expect(page).toHaveURL(/resume=1/);
    });

    test("E2E-M03-10-021 登録成功後の一覧はセッションのページ番号とresumeで再表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new ProductProductBulkBuyStandardPriceEditPage(page);
      await target.gotoList(); // 一覧でセッションを確立（page_no/検索条件のシード確立は別途必要）
      const productId = Number(process.env.E2E_M0310_PRODUCT_ID || "1");
      await target.gotoEdit([productId]);
      await target.basePriceNm.first().fill("1000");
      await target.buyPriceNm.first().fill("500");
      await target.submit();
      // E2E観測範囲: 成功後に一覧へ resume=1 付きでリダイレクトされること（セッションpage_no引き継ぎ）。
      // 「直前の検索条件・検索結果の再表示」は本specでは検索条件をシードしていないため検証対象外
      // （要確認: 検索条件確立シード＋一覧再描画の照合は手動/間接。ケース表 付帯表5 IT-23 参照）。
      await expect(page).toHaveURL(PRODUCT_LIST_RE);
      await expect(page).toHaveURL(/resume=1/);
    });

    // ===== バリデーション（相関） =====

    test("E2E-M03-10-030 買取(NM)が基準(NM)を上回ると相関エラーで編集再表示", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new ProductProductBulkBuyStandardPriceEditPage(page);
      const productId = Number(process.env.E2E_M0310_PRODUCT_ID || "1");
      await target.gotoEdit([productId]);
      await target.basePriceNm.first().fill("1000");
      await target.buyPriceNm.first().fill("2000"); // 買取 > 基準
      await target.submit();
      // 仕様：買取は基準以下。超過時はリダイレクトせず編集画面を再表示(HTTP200)し一覧へは遷移しない。
      await expect(target.errorFlash).toContainText(ERR_BUY_EXCEEDS_STANDARD);
      await expect(target.form).toBeVisible();
      await expect(page).not.toHaveURL(PRODUCT_LIST_RE);
    });

    test("E2E-M03-10-031 買取(NM)が基準(NM)以下なら検証を通過し登録できる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new ProductProductBulkBuyStandardPriceEditPage(page);
      const productId = Number(process.env.E2E_M0310_PRODUCT_ID || "1");
      await target.gotoEdit([productId]);
      await target.basePriceNm.first().fill("1000");
      await target.buyPriceNm.first().fill("1000"); // 買取 = 基準（境界・許容）
      await target.submit();
      await expect(target.successFlash).toContainText(FLASH_REGISTER_COMPLETE);
    });

    // ===== 保留（不具合候補・要シード。理由付きで未実行・抜け漏れ可視化） =====

    test.fixme(
      "E2E-M03-10-032 買取(NM)未入力で登録するとエラーで確定しない（仕様＝必須・不具合候補#2：刷新先にサーバ必須制約が無い可能性）",
      async () => {
        // 期待は仕様(入力項目 買取価格NM=必須)由来。BulkUpdateProductPriceDetailType に NotBlank が無く、
        // サーバ未強制なら確定してしまう。期待値は仕様どおり「必須エラーで確定しない」とし、失敗で検出する。
      }
    );

    test.fixme(
      "E2E-M03-10-033 買取(NM)が販売(NM)を上回ると相関エラー（仕様 buyprice_valid_bulk・不具合候補#1：刷新先に未実装の可能性）",
      async () => {
        // 期待は仕様(バリデーション 買取vs販売NM)由来。刷新先は買取vs基準のみ実装で
        // buyprice_valid_bulk キーが存在しない。販売価格(NM)既知のシードが必要。仕様どおり書き失敗で検出する。
      }
    );

    test.fixme(
      "E2E-M03-10-040 規格ID不正・削除済みで例外メッセージ（要 SEED-M03-10-DELETED-CLASS：編集表表示後にNM規格を削除）",
      async () => {
        // 期待は仕様(処理フロー#6 / admin.product.to_show_complete)由来。削除済み規格の安定生成を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M03-10-041 買取がマスタに無い低額帯で例外メッセージ（要 SEED-M03-10-NOPRICE：買取減額率なし商品＋mtb_buy_price_list未登録値）",
      async () => {
        // 期待は仕様(処理フロー#7 / admin.product.not_found_nm_price)由来。マスタ未登録の低額帯値を用意して実装。
      }
    );

    test.fixme(
      "E2E-M03-10-042 低額帯かつ買取マスタに該当ありで登録成功（041の正常系対・要 SEED-M03-10-PRICE-HIT：買取減額率なし商品＋mtb_buy_price_list登録値）",
      async () => {
        // 期待は仕様(処理フロー#7の成功分岐 / admin.register.complete)由来。
        // 低額帯(1〜10000)でマスタ該当ありなら例外にならず成功する。マスタ登録値シードを用意して実装。
      }
    );

    test.fixme(
      "E2E-M03-10-043 買取(NM)=0でマスタ存在チェックをスキップして登録成功（設計エッジケース「買取0」・破壊的・要シード）",
      async () => {
        // 期待は仕様(業務ルール エッジケース「買取0」)由来。買取0はマスタ存在チェックをスキップし率SQL分岐へ進み成功する。
      }
    );
  }
);
