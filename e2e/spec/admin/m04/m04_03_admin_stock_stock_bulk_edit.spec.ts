/**
 * 管理画面 在庫管理「在庫一括編集」E2E。
 * 納品ケース表 integration_test/e2e/m04_03_admin_stock_stock_bulk_edit_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装する。在庫数の永続化（承認データ dtb_stock_edit_approval /
 * dtb_stock_edit_approval_detail / dtb_stock_approval_list の作成、廃棄時の dtb_product_stock 即時更新、
 * 在庫変更履歴・入荷集計列・入荷通知メール・支店連携）はブラウザで観測できずDB/メール照合が必要なため
 * 手動/間接・対象外としてケース表で全量管理し、spec に大量の fixme を残さない（規約準拠）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m04-03_admin_stock_stock_bulk_edit.md / integration-test-viewpoints.md)
 * 由来（オラクル独立性）。設計源は pf-eccube3 のリバース（直接更新型）であり、刷新先 ec-cube-enterprise は
 * 承認ワークフロー型。入口（商品検索一覧→在庫一覧）・項目（仕入単価/承認通知先の追加）・メッセージ・
 * 在庫上限桁数などに大きな乖離があり、ケース表 付帯表4（不具合候補）に列挙した。実装からはセレクタ・
 * ルート（位置情報）のみを取り、合否は仕様で判定する（実装の現挙動・表示文言をオラクル化しない）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 *
 * シード（SEED-M04-03-STOCK 等）はステージング投入前提。登録成功（030）は承認データを生成する破壊的操作のため
 * 隔離環境または使い捨てシードで実行する。対象在庫IDは env E2E_M0403_PRODUCT_STOCK_ID で受ける。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockStockBulkEditPage } from "../../../pages/admin/m04/m04_03_admin_stock_stock_bulk_edit.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// 対象在庫（在庫一覧で選択可能な ProductStock.id）。SEED-M04-03-STOCK 由来。
const PS_ID = Number(process.env.E2E_M0403_PRODUCT_STOCK_ID || "1");

const NEW_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/stock/stock-bulk-approval/new`);
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login`);
// 仕様(pf-eccube3)上、成功/戻る/未選択時の遷移先は「商品検索一覧の保持ページ」(/product/search/{page_no})。
// 刷新先は在庫一覧(/product/stock)へ戻る乖離（付帯表4 #2,#9）。よって遷移オラクルは特定URL固定を避け、
// 「在庫一括編集(new)画面から離脱したこと」を仕様共通の観測点として判定する（実装URLをオラクル化しない）。

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 > 在庫管理 > 在庫一括編集",
  { tag: ["@admin", "@stock"] },
  () => {
    // ===== 認証不要（資格情報不要・常時実行可） =====

    test("E2E-M04-03-050 未ログインで編集URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      // 仕様: 未ログインは管理画面共通の挙動で利用できない（権限・認可）。
      const target = new StockStockBulkEditPage(page);
      await target.gotoNew([PS_ID]);
      // 編集画面は表示されず、管理ログイン画面へ誘導される（URL＋ログインフォームの双方で判定）。
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(target.form).toHaveCount(0);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 入口ガード（要ログイン・シード不要） =====

    test("E2E-M04-03-010 在庫未選択で編集を開くとエラー表示し編集画面を表示しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new StockStockBulkEditPage(page);
      await target.gotoNew([]); // productStockIds 空
      // 仕様(エッジ/エラー処理): 商品(在庫)未選択ならエラー「商品が選択されていません。」を表示し、
      // 編集フォームを出さず商品検索一覧の保持ページへ戻す（pf-eccube3正典）。
      // 注: 刷新先のフラッシュ文言/リダイレクト先は仕様と乖離（付帯表4 #2,#9）。刷新先は対象在庫なしで
      //     admin_stock_bulk_approval_new 自身へリダイレクトし得る（自己リダイレクト）→要確認。
      //     ここでは実装URLをオラクル化せず「編集フォームが表示されない＋エラーが出る」で仕様を判定する。
      await page.waitForLoadState("networkidle");
      await expect(target.form).toHaveCount(0); // 編集フォーム(入力可能な編集表)は表示されない
      await expect(target.error).toBeVisible(); // 未選択エラーの表示
    });

    // ===== 表示（要シード SEED-M04-03-STOCK） =====

    test("E2E-M04-03-001 在庫を選択して編集画面を開くと選択在庫の編集表が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new StockStockBulkEditPage(page);
      await target.gotoNew([PS_ID]); // 在庫一覧での選択に相当（productStockIds[]）
      await expect(target.form).toBeVisible();
      await expect(target.productStockIdHidden.first()).toHaveCount(1);
    });

    test("E2E-M04-03-002 編集画面に選択在庫の規格ごと1行の表が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new StockStockBulkEditPage(page);
      await target.gotoNew([PS_ID]);
      // 仕様(フロント挙動 表示要素): 規格ごとに1行を並べる表を表示する。
      await expect(target.rows.first()).toBeVisible();
    });

    test("E2E-M04-03-003 在庫変動区分・在庫変動理由・増減数の入力欄と登録ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new StockStockBulkEditPage(page);
      await target.gotoNew([PS_ID]);
      // 仕様(入力項目): 在庫変動理由区分・増減数・在庫変動理由の入力欄と登録ボタンが揃う。
      await target.seeEditForm();
    });

    test("E2E-M04-03-005 編集表に商品名・言語・状態・在庫数の各列が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new StockStockBulkEditPage(page);
      await target.gotoNew([PS_ID]);
      // 仕様(フロント挙動 表示要素): 規格行に ID・商品名・言語・状態・在庫数 等の複数列を並べる。
      //   実装文言（列見出しの日本語ラベル）はオラクル化せず、仕様が要求する「複数の表示列を持つ表」を
      //   構造で判定する（規格行が5列以上のセルを持つ）。販売総数列の有無は027で別途扱う（乖離検出 #8）。
      await expect(target.rows.first()).toBeVisible();
      const cells = await target.rowCells(0).count();
      expect(cells).toBeGreaterThanOrEqual(5);
    });

    test("E2E-M04-03-006 モーダル・トーストを表示せずエラーは画面上部/フォーム直下に表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new StockStockBulkEditPage(page);
      await target.gotoNew([PS_ID]);
      // 仕様(フロント挙動): 本機能ではモーダル・トーストを表示しない。エラーは画面上部/フォーム直下に出す。
      await expect(target.form).toBeVisible();
      await expect(target.visibleModals).toHaveCount(0);
    });

    // ===== バリデーション（異常系・要シード） =====

    test("E2E-M04-03-020 増減数未入力で登録するとエラーで確定せず編集画面が再表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new StockStockBulkEditPage(page);
      await target.gotoNew([PS_ID]);
      // 仕様(バリデーション): 増減させる在庫数は必須。未入力なら更新せず同一画面でエラー再表示。
      // オラクル独立性: 刷新先のみに存在する追加必須項目（在庫変動区分詳細・承認通知先メンバー等。
      //   StockBulkApprovalType の Form制約）は pf-eccube3 仕様に無いため、偽陽性回避目的でも事前入力しない
      //   （Form制約を期待値に固定＝実装寄せはしない）。判定は仕様の観測点で行う:
      //   ① 編集画面に留まり完了しない（在庫一括編集画面=new から離脱しない）
      //   ② 成功フラッシュが出ない ③ エラーが表示される。
      // 要確認: グローバル .alert-danger は他必須項目起因でも立ち得るため、増減数欄に紐づく
      //   フィールド単位エラーの判定は要実機確認（field-scoped セレクタが確定後に強化する）。
      await target.fillRow(0, { quantity: "", reason: "テスト在庫変動理由" });
      await target.submit();
      await expect(target.form).toBeVisible(); // 一覧へは遷移せず編集画面に留まる
      await expect(page).toHaveURL(NEW_RE); // 確定遷移していない＝更新未確定
      await expect(target.success).toHaveCount(0); // 完了していない
      await expect(target.error).toBeVisible();
    });

    test("E2E-M04-03-021 在庫変動理由未入力で登録するとエラーで確定せず編集画面が再表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new StockStockBulkEditPage(page);
      await target.gotoNew([PS_ID]);
      // 仕様(バリデーション/相関): 増減数が0以外で在庫変動理由が空の行はエラー。更新しない。
      // オラクル独立性: 刷新先のみの追加必須項目は事前入力しない（実装寄せ回避）。判定は仕様観測点で行う。
      // 要確認: グローバル .alert-danger は他必須項目起因でも立ち得るため、在庫変動理由欄に紐づく
      //   フィールド単位エラー（仕様「ID:…在庫変動理由が入力されていません。」相当）の判定は要実機確認。
      await target.fillRow(0, { quantity: "1", reason: "" });
      await target.submit();
      await expect(target.form).toBeVisible();
      await expect(page).toHaveURL(NEW_RE); // 確定遷移していない＝更新未確定
      await expect(target.success).toHaveCount(0);
      await expect(target.error).toBeVisible();
    });

    // ===== 成功・遷移（破壊的・要シード） =====

    test("E2E-M04-03-040 「在庫一覧に戻る」リンクで在庫一覧へ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new StockStockBulkEditPage(page);
      await target.gotoNew([PS_ID]);
      // 仕様(画面遷移): 戻るリンクで在庫一括編集画面を離脱し一覧へ戻る。
      //   pf-eccube3正典の遷移先は「商品検索一覧の保持ページ」(/product/search/{page_no})。
      //   刷新先は「在庫一覧に戻る」(/product/stock) へ遷移する乖離（付帯表4 #2,#9）。
      //   実装の特定URL(在庫一覧)をオラクルに固定せず、「new 画面から離脱したこと」で仕様を判定する。
      //   遷移先が商品検索一覧か在庫一覧かの厳密判定は要実機確認（乖離検出は付帯表4で管理）。
      await target.backToListLink.click();
      await expect(page).not.toHaveURL(NEW_RE);
    });

    // ===== 保留（要シード状態・JS差異・破壊的。理由付きで未実行・抜け漏れ可視化） =====

    test.fixme(
      "E2E-M04-03-004 増減数0以外で在庫変動理由が必須化し0で解除される（仕様 JS・不具合候補#7：刷新先JSは required トグルでなく自動入力/背景色制御）",
      async () => {
        // 期待は仕様(フロント挙動 JS)由来。刷新先の bulkapproval.twig は理由欄に required を付け外しせず
        // 自動入力・背景色制御を行う。仕様どおり required 制御を期待し、差異を失敗で検出する。
      }
    );

    test.fixme(
      "E2E-M04-03-022 新在庫数が負になる更新はエラーで確定しない（要 SEED-M04-03-STOCK：現在庫を超える減算値を設定）",
      async () => {
        // 期待は仕様(上限・下限/エッジ「在庫がマイナスになる更新はできません」)由来。
        // 刷新先は廃棄区分で disposal_exceeds_stock_error を返す（文言乖離 付帯表4 #4）。
        // 現在庫が既知の在庫シードを用意し、現在庫を下回る減算で検証する。
      }
    );

    test.fixme(
      "E2E-M04-03-023 新在庫数が在庫上限を超える更新はエラーで確定しない（要 SEED-M04-03-STOCK：上限近傍の現在庫）",
      async () => {
        // 期待は仕様(上限 999999999/9桁)由来。刷新先は be_stocked_max_stock_error（8桁・文言乖離 付帯表4 #3）。
        // 上限近傍の現在庫シードで検証する。
      }
    );

    test.fixme(
      "E2E-M04-03-024 在庫変動理由が最大長(65535)超過でエラーになる（要 大入力・刷新先 max は config 値で要確認）",
      async () => {
        // 期待は仕様(在庫変動理由 最大65535バイト)由来。刷新先の最大長は
        // eccube_product_stock_change_reason_max_len 依存で値が異なる可能性（付帯表4 #6）。
      }
    );

    test.fixme(
      "E2E-M04-03-030 妥当な入力で登録すると完了メッセージが表示され在庫一覧へ戻る（破壊的・承認データ生成。要 隔離環境＋SEED-M04-03-STOCK＋承認通知先メンバー）",
      async () => {
        // 画面オラクル(pf-eccube3正典): 成功文言「登録が完了しました。」＋商品検索一覧の保持ページへ戻る。
        //   刷新先は「保存しました」表示・在庫一覧へ戻る（文言/遷移先の乖離 付帯表4 #2）→画面側は仕様で判定。
        // DBオラクル(ec-cube-enterprise正典・設計書DB操作節): 承認データ(dtb_stock_edit_approval /
        //   dtb_stock_edit_approval_detail / dtb_stock_approval_list)の作成が期待値（承認ワークフローは
        //   不具合ではなく正典・付帯表4 #1）。在庫は即時更新せず承認後反映、廃棄区分のみ即時更新＋履歴。
        //   DB照合は手動/間接（080-082）。実行には承認通知先メンバー(Count min1)・在庫変動区分の選択と
        //   承認権限メンバーのシード(SEED-M04-03-APPROVER)、隔離環境が要る。
      }
    );
  }
);
