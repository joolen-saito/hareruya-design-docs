/**
 * 管理画面 在庫管理 在庫移動・振替CSV登録（M04-22）E2E。納品ケース表
 * integration_test/e2e/m04_22_admin_stock_stock_move_transfer_csv_import_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、取込本体（商品・在庫マスタの要シード）は test.fixme で残す。
 * 手動/対象外（DB副作用・承認通知メール・CSRF・ログ抑止）はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(基本設計仕様書〔在庫管理機能 M04-22〕 / 正本 functions/ec-cube-enterprise/m04-22_admin_stock_stock_move_transfer_csv_import.md /
 * 観点表 / messages.ja.yaml)由来（オラクル独立性）。実装の現挙動・Form制約・POM見出しをオラクル化しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の
 * spec/admin/login.spec.ts・two_factor_auth.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報が無ければ走らないよう test.skip(!HAS_CREDS) でガードする（存在はするが未実行＝抜け漏れ可視化）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockStockMoveTransferCsvImportPage } from "../../../pages/admin/m04/m04_22_admin_stock_stock_move_transfer_csv_import.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

const LOGIN_RE = /\/login(\?|$)/;

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const SUCCESS = "登録が完了しました。"; // admin.register.complete :1773
const FILE_SELECT_EMPTY = "選択されていません"; // admin.common.file_select_empty :1560

/** 管理ログインして在庫移動振替一覧を開く。 */
async function loginAndOpenList(
  page: Page
): Promise<StockStockMoveTransferCsvImportPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const target = new StockStockMoveTransferCsvImportPage(page);
  await target.goto();
  return target;
}

test.describe(
  "管理画面 > 在庫管理 > 在庫移動・振替CSV登録",
  { tag: ["@admin", "@stock", "@csv"] },
  () => {
    // ===== 認証不要 =====

    test("E2E-M04-22-030 未ログインで一覧URL直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock/move_transfer`);
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可: 未ログインは管理ログインへ
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== モーダルUI（ログインのみ・要マスタ最小） =====

    test("E2E-M04-22-001 在庫移動CSV登録モーダル: 必須項目と登録ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpenList(page);
      await target.openMoveModal();
      await target.seeMoveModalParts();
    });

    test("E2E-M04-22-002 在庫移動モーダル: CSVフォーマット説明と雛形DLリンクが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpenList(page);
      await target.openMoveModal();
      await expect(target.moveModal).toContainText("商品コード"); // admin.product.product_code :1889
      await expect(target.moveModal).toContainText("移動点数"); // admin.stock.move.movement_quantity :4273
      await expect(target.moveTemplateLink).toBeVisible(); // 雛形ファイルダウンロード :1548
    });

    test("E2E-M04-22-003 在庫移動モーダル: ファイル未選択時に「選択されていません」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpenList(page);
      await target.openMoveModal();
      await expect(target.moveFileName).toContainText(FILE_SELECT_EMPTY);
    });

    test("E2E-M04-22-010 在庫振替CSV登録モーダル: 必須項目・承認通知先・登録ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpenList(page);
      await target.openTransferModal();
      await target.seeTransferModalParts();
    });

    test("E2E-M04-22-011 在庫振替モーダル: CSVフォーマット説明(振替元/先/点数)と雛形DLリンクが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpenList(page);
      await target.openTransferModal();
      await expect(target.transferModal).toContainText("振替元商品コード"); // :5153
      await expect(target.transferModal).toContainText("振替先商品コード"); // :5154
      await expect(target.transferModal).toContainText("振替点数"); // :5155
      await expect(target.transferTemplateLink).toBeVisible();
    });

    // ===== 雛形ダウンロード（内容は手動・発火とファイル名のみ自動化） =====

    test("E2E-M04-22-020 在庫移動CSV雛形ダウンロード: ファイル名が stock_move.csv", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpenList(page);
      await target.openMoveModal();
      const download = await target.downloadMoveTemplate();
      expect(download.suggestedFilename()).toBe("stock_move.csv");
    });

    test("E2E-M04-22-021 在庫振替CSV雛形ダウンロード: ファイル名が stock_transfer.csv", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpenList(page);
      await target.openTransferModal();
      const download = await target.downloadTransferTemplate();
      expect(download.suggestedFilename()).toBe("stock_transfer.csv");
    });

    // ===== URL/HTTPステータス（登録はPOST専用） =====

    test("E2E-M04-22-031 移動CSV登録URLにGET直接アクセス→405（POST専用）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const resp = await page.goto(
        `/${ECCUBE_ADMIN_ROUTE}/product/stock/move_transfer/move_csv_import`
      );
      expect(resp?.status()).toBe(405); // 登録は methods=['POST'] のみ（Controller:224）
    });

    test("E2E-M04-22-032 振替CSV登録URLにGET直接アクセス→405（POST専用）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const resp = await page.goto(
        `/${ECCUBE_ADMIN_ROUTE}/product/stock/move_transfer/transfer_csv_import`
      );
      expect(resp?.status()).toBe(405); // 登録は methods=['POST'] のみ（Controller:318）
    });

    // ===== 取込本体（要シード: 商品・在庫マスタ）。自動化予定だが未実装＝理由付きfixme =====

    test.fixme(
      "E2E-M04-22-040 移動CSV取込成功→「登録が完了しました。」表示（要SEED-M04-22-MOVE）",
      async () => {
        // 期待は仕様(取込手順#6・messages.ja.yaml:1773 admin.register.complete)由来。
        // 商品コードに対応する規格在庫(出庫元/入庫先)のシード投入後に実装する。フラッシュ表示領域セレクタは要実機確認。
      }
    );

    test.fixme(
      "E2E-M04-22-041 移動CSV取込成功→出庫承認依頼画面へ遷移（要SEED-M04-22-MOVE）",
      async () => {
        // 期待は仕様(取込手順#6・Controller:310 admin_stock_move_outbound_approval_request)由来。
      }
    );

    test.fixme(
      "E2E-M04-22-042 振替CSV取込成功→「登録が完了しました。」表示（要SEED-M04-22-TRANSFER）",
      async () => {
        // 期待は仕様(取込手順 振替・messages.ja.yaml:1773)由来。
      }
    );

    test.fixme(
      "E2E-M04-22-043 振替CSV取込成功→在庫振替詳細画面へ遷移（要SEED-M04-22-TRANSFER）",
      async () => {
        // 期待は仕様(取込手順 振替・Controller:405 admin_stock_transfer)由来。
      }
    );

    test.fixme(
      "E2E-M04-22-050 移動: 必須未選択で登録→エラー表示・一覧リダイレクト（要実機: フォームエラー文言/表示領域）",
      async () => {
        // 期待は仕様(取込手順#1・フォーム項目 必須)由来。csv_invalid_format到達性は不具合候補#3で要確認。
      }
    );

    test.fixme(
      "E2E-M04-22-051 移動: ヘッダ不一致CSV→「CSVのフォーマットが一致しません。」（要SEED-M04-22-MOVE）",
      async () => {
        // 期待は仕様(取込手順 行検証・messages.ja.yaml:2209 admin.csv.error.format.header)由来。
      }
    );

    test.fixme(
      "E2E-M04-22-052 移動: 未存在商品コード→データ取得不可エラー（要SEED-M04-22-MOVE）",
      async () => {
        // 期待は仕様(取込手順 行検証 breakAll・messages.ja.yaml:2218 admin.csv.error.product.not_exists)由来。
      }
    );

    test.fixme(
      "E2E-M04-22-053 移動: 移動点数が範囲外(0〜999999999外)/非数値→値異常エラー（要SEED-M04-22-MOVE）",
      async () => {
        // 期待は仕様(取込手順 行検証 breakAll・messages.ja.yaml:2217 admin.csv.error.product.invalid)由来。
        // 許容範囲は Excel基本設計=0〜999999999。異常値は範囲外(負数/上限超過1000000000)・非数値とする。
        // 「0=1未満エラー」は実装(int<=0)由来オラクルのため採用しない（下限0の可否は不具合候補#6）。
      }
    );

    test.fixme(
      "E2E-M04-22-054 移動: 上限行数超過→登録不可エラー（Excel上限10,000・不具合候補#1）",
      async () => {
        // 期待は仕様(最大行数 Excel基本設計=移動10,000)由来。実装は共通定数5010一律のため失敗で検出見込み。
      }
    );

    test.fixme(
      "E2E-M04-22-055 振替: 振替元・振替先が完全同一の重複行→エラー（Excel要件・不具合候補#2）",
      async () => {
        // 期待は仕様(Excel基本設計: 完全同一の重複行はエラー)由来。実装に重複チェック未確認のため失敗で検出見込み。
      }
    );

    test.fixme(
      "E2E-M04-22-056 振替: 未存在の振替元/振替先商品コード→データ取得不可エラー（要SEED-M04-22-TRANSFER）",
      async () => {
        // 期待は仕様(取込手順 振替 行検証・messages.ja.yaml:2218)由来。
      }
    );

    test.fixme(
      "E2E-M04-22-057 振替: 振替点数が範囲外(0〜999999999外)/非数値→値異常エラー（要SEED-M04-22-TRANSFER）",
      async () => {
        // 期待は仕様(取込手順 振替 行検証・messages.ja.yaml:2217)由来。
        // 許容範囲は Excel基本設計=0〜999999999。異常値は範囲外(負数/上限超過1000000000)・非数値とする（下限0の可否は不具合候補#6）。
      }
    );

    test.fixme(
      "E2E-M04-22-058 振替: 上限行数超過→登録不可エラー（Excel上限2,000・不具合候補#1）",
      async () => {
        // 期待は仕様(最大行数 Excel基本設計=振替2,000)由来。実装は共通定数5010一律のため失敗で検出見込み。
      }
    );

    test.fixme(
      "E2E-M04-22-059 移動: csv以外のファイル→エラー・取込まれず一覧へ（要SEED-M04-22-MOVE）",
      async () => {
        // 期待は仕様(登録処理実行時のエラー: csv以外のファイルの場合・正本md:200)由来。
        // 具体メッセージ(csv_invalid_format系か拡張子検証か)は要実機確認のため文言を期待値固定しない。
      }
    );

    test.fixme(
      "E2E-M04-22-065 振替: csv以外のファイル→エラー・取込まれず一覧へ（要SEED-M04-22-TRANSFER）",
      async () => {
        // 期待は仕様(登録処理実行時のエラー: csv以外のファイルの場合・正本md:283)由来。具体メッセージは要実機確認。
      }
    );

    test.fixme(
      "E2E-M04-22-066 振替: 必須未選択で登録→エラー表示・一覧リダイレクト（要実機: フォームエラー文言/表示領域）",
      async () => {
        // 期待は仕様(取込手順#1・フォーム項目 振替 必須)由来。050(移動)の振替対。
      }
    );

    test.fixme(
      "E2E-M04-22-067 振替: ヘッダ不一致CSV→「CSVのフォーマットが一致しません。」（要SEED-M04-22-TRANSFER）",
      async () => {
        // 期待は仕様(取込手順 振替 行検証・messages.ja.yaml:2209 admin.csv.error.format.header)由来。051(移動)の振替対。
      }
    );

    test.fixme(
      "E2E-M04-22-068 移動: データ行が空のCSV→空データエラー・一覧リダイレクト（要SEED-M04-22-MOVE）",
      async () => {
        // 期待は仕様(エラー行/不正行の扱い・空データ 正本md:108,111 admin.csv.error.data.empty)由来。メッセージキーは要確認のため文言を期待値固定しない。
      }
    );

    test.fixme(
      "E2E-M04-22-069 振替: データ行が空のCSV→空データエラー・一覧リダイレクト（要SEED-M04-22-TRANSFER）",
      async () => {
        // 期待は仕様(エラー行/不正行の扱い・空データ 正本md:111)由来。068(移動)の振替対。
      }
    );

    test.fixme(
      "E2E-M04-22-074 移動: 商品は存在するが選択店舗・在庫区分の規格在庫が無い→在庫未存在エラー（要SEED-M04-22-MOVE）",
      async () => {
        // 期待は仕様(例外処理 在庫未存在・正本md:133,92)由来。商品コード未存在(052)とは別分岐＝onReadRowでProductStock未取得時の例外。
      }
    );

    test.fixme(
      "E2E-M04-22-075 振替: 商品は存在するが選択店舗・在庫区分の規格在庫が無い→在庫未存在エラー（要SEED-M04-22-TRANSFER）",
      async () => {
        // 期待は仕様(例外処理 在庫未存在・正本md:133,102)由来。056とは別分岐。074(移動)の振替対。
      }
    );
  }
);
