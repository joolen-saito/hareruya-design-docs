/**
 * 管理画面 受注管理 スタック用紙印刷 E2E（納品ケース表
 * integration_test/e2e/m05_08_admin_order_order_stack_paper_print_e2e_cases.md に対応）。
 * 期待結果は仕様(正本 functions/pf-eccube3/m05-08_admin_order_order_stack_paper_print.md /
 * 観点表 / 基本設計)由来（オラクル独立性）。実装の現挙動・文言を期待値に流用しない。
 * 設計書(pf-eccube3 リバース)と刷新先 ec-cube-enterprise は、本ルートの処理フロー・固定メッセージが一致する
 * （CSRF→400「不正なリクエストです。」/ids空→404「対象の注文が指定されていません。」/未採番→400
 *  「注文番号が未採番の注文があります。」/成功→200「印刷予約を受け付けました。」）。詳細はケース表 付帯表4。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 本specには「E2E自動化」ケースのみ実装する。手動/対象外(DB内部値・印字SQL・ログ抑止・本機能に非該当の
 * 入力バリデーション等)はケース表で全量管理しspecに残さない。シード/正トークン依存で未実装のものは
 * 理由付き test.fixme で抜け漏れを可視化する。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が存在せず、既存 spec も
 * @playwright/test を直接使う。本specも既存規約（login.spec.ts / m04 系）に倣い
 * @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針: 資格情報（ECCUBE_ADMIN_USER/PASS）が無いと走らないよう test.skip でガードする。
 * 印刷予約 AJAX エンドポイントはステータス・確定日・担当者・印刷フラグを更新するため、共有ステージングでは
 * 専用テストアカウント／使い捨て受注での実行を推奨（破壊系の 012/040/060/061 は fixme）。
 *
 * シード/環境変数（コミットしない）:
 *  - SEED-M05-08-ADMIN  : ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（受注一覧に到達できる管理者・2FA OFF）
 *  - SEED-M05-08-ORDER  : 採番済 order_no を持つ受注1件（配送行が一覧に表示される）→ STACK_SHIPPING_ID
 *  - SEED-M05-08-NEW    : ステータス「注文受領(NEW)」かつ採番済の使い捨て受注（ピック中遷移の間接確認用）
 *  - SEED-M05-08-NONUM  : order_no 未採番の配送行（未採番エラー検証用）
 *  - STACK_PRINT_TOKEN  : 印刷予約POSTの有効な _token（実機の画面生成トークン。創作しないため要実機確認）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OrderOrderStackPaperPrintPage } from "../../../pages/admin/m05/m05_08_admin_order_order_stack_paper_print.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様(処理フロー/エラー処理)由来の固定メッセージ。実装に合わせて変えない（オラクル独立性）。
const MSG_SUCCESS = "印刷予約を受け付けました。"; // 正常 200（処理フロー#10）
const MSG_CSRF = "不正なリクエストです。"; // CSRF不正 400（処理フロー#2 / エラー処理）
const MSG_NO_TARGET = "対象の注文が指定されていません。"; // ids空 404（処理フロー#3）
const MSG_NO_NUMBER = "注文番号が未採番の注文があります。"; // 未採番 400（処理フロー#6）
const ALERT_NO_SELECT = "チェックボックスが選択されていません"; // 未選択中断（フロント挙動）

const LOGIN_RE = /\/login(\?|$)/;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 受注管理 > スタック用紙印刷",
  { tag: ["@admin", "@order", "@print"] },
  () => {
    // ===== UI部品・操作起点（SEED-M05-08-ADMIN） =====

    test("E2E-M05-08-001 受注一覧に「スタック用紙印刷」ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M05-08-ADMIN 未設定（ECCUBE_ADMIN_USER/PASS）");
      await login(page);
      const target = new OrderOrderStackPaperPrintPage(page);
      await target.gotoList();
      await target.seePrintStackButton(); // 文言「スタック用紙印刷」（仕様 trans 由来）
    });

    test("E2E-M05-08-020 未選択で印刷ボタン押下→「チェックボックスが選択されていません」で中断", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M05-08-ADMIN 未設定");
      await login(page);
      const target = new OrderOrderStackPaperPrintPage(page);
      await target.gotoList();
      // 全チェックを外して未選択状態にする。
      const boxes = target.shippingCheckboxes;
      const n = await boxes.count();
      for (let i = 0; i < n; i++) {
        const b = boxes.nth(i);
        if (await b.isChecked()) await b.uncheck();
      }
      let dialogText = "";
      let childOpened = false;
      page.on("dialog", async (d) => {
        dialogText = d.message();
        await d.dismiss();
      });
      page.context().on("page", () => {
        childOpened = true;
      });
      await target.printStackButton.click();
      await expect.poll(() => dialogText).toContain(ALERT_NO_SELECT);
      expect(childOpened, "未選択時は子ウィンドウを開かず中断すること").toBe(false);
    });

    // 010/011 は「破壊系」。子ウィンドウは読込完了後に自動で AJAX 印刷予約 POST を発火し、
    // 対象受注の browser_print_flg 等を更新する（print_stack_window.twig:33-47）。実データを選んで
    // 子画面を開くだけで DB が変わるため、共有ステージングでは使い捨て SEED-M05-08-ORDER が前提。
    // 現時点は破壊系として test.fixme で抜け漏れ可視化（レビュー指摘=高1反映）。dialog は子ページで捕捉する。
    test.fixme(
      "E2E-M05-08-010/011 配送行を選択し印刷ボタン押下→子ウィンドウが開き見出し「スタック用紙印刷中」が表示される（破壊系: 子ウィンドウ自動AJAXがDB更新。要 使い捨て SEED-M05-08-ORDER）",
      async ({ page }) => {
        await login(page);
        const target = new OrderOrderStackPaperPrintPage(page);
        await target.gotoList();
        const parentUrl = page.url(); // 親URLは変わらない（仕様: 画面遷移）。低1反映。
        await target.selectFirstShipping();
        const child = await target.clickPrintStackAndGetChild(); // 別ウィンドウ生成（処理フロー）
        await target.seeChildHeading(child); // 見出し「スタック用紙印刷中」（print_stack_window.twig:68）
        expect(page.url(), "親URLは子ウィンドウ生成後も不変であること").toBe(parentUrl);
      }
    );

    // ===== 印刷予約エンドポイントの HTTP/JSON（直接POST・観測可能） =====

    test("E2E-M05-08-030 _token不正で印刷予約POST→HTTP400 JSON「不正なリクエストです。」", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M05-08-ADMIN 未設定");
      await login(page);
      const target = new OrderOrderStackPaperPrintPage(page);
      // CSRF は ids 判定より前（処理フロー#2）。不正トークンは ids 有無に関わらず 400。
      const res = await target.postPrintStack({ id: "1", token: "invalid-token" });
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.message).toBe(MSG_CSRF);
    });

    // ===== 権限・認可（未ログイン） =====

    test("E2E-M05-08-050 未ログインで印刷予約POST→管理ログインへ誘導（当パスに到達しない）", async ({
      page,
    }) => {
      // ログインしない素のコンテキストで直接 POST する。
      const target = new OrderOrderStackPaperPrintPage(page);
      const res = await target.postPrintStack({ id: "1", token: "x" }, 0);
      // 認証ガードによりログインへリダイレクト（処理フロー前提=管理セキュリティ）。
      expect([301, 302, 303, 307, 308]).toContain(res.status());
      const loc = res.headers()["location"] || "";
      expect(loc).toMatch(LOGIN_RE);
    });

    // ===== 保留（シード/正トークン依存・破壊系・DB間接。理由付きで未実行・抜け漏れ可視化） =====

    test.fixme(
      "E2E-M05-08-012 子ウィンドウAJAX成功でアラート「印刷予約を受け付けました。」表示後にウィンドウが閉じる（要: 採番済受注 SEED-M05-08-ORDER ＋ 子ウィンドウのdialog/closeを安定捕捉）",
      async () => {
        // 期待は仕様(処理フロー#10 / print_stack_window.twig:34-38)由来。
        // 実装時は POM.captureChildDialogMessage(child) で子ウィンドウ alert を捕捉し MSG_SUCCESS と突合。
        void MSG_SUCCESS;
      }
    );

    test.fixme(
      "E2E-M05-08-013 子ウィンドウAJAXがJSON失敗(例: 未採番)を返したときレスポンス本文のmessageをアラートして閉じる（012の異常系対。要: JSON失敗となる受注=SEED-M05-08-NONUM 等・破壊系/実機準備）",
      async () => {
        // 期待は仕様(エラー処理: 失敗時はレスポンス本文の message をアラート / 処理フロー)由来。
        // 子ウィンドウ fail 経路（print_stack_window.twig:40-46）で responseJSON.message を alert。
        // 実装時は POM.captureChildDialogMessage(child) で捕捉し、例として MSG_NO_NUMBER と突合。
        void MSG_NO_NUMBER;
      }
    );

    test.fixme(
      "E2E-M05-08-031 ids空(正token)で印刷予約POST→HTTP404 JSON「対象の注文が指定されていません。」（要: 有効な_token=STACK_PRINT_TOKEN。創作禁止のため実機トークン取得後に実装）",
      async () => {
        // 期待は仕様(処理フロー#3)由来。CSRF 通過後でないと 404 に到達しないため正トークンが必要。
        void MSG_NO_TARGET;
      }
    );

    test.fixme(
      "E2E-M05-08-032 order_no未採番の配送ID(正token)→HTTP400 JSON「注文番号が未採番の注文があります。」（要: SEED-M05-08-NONUM ＋ 正token）",
      async () => {
        // 期待は仕様(処理フロー#6 / エラー処理)由来。DB更新が行われないことは間接(ケース表)。
        void MSG_NO_NUMBER;
      }
    );

    test.fixme(
      `E2E-M05-08-040 有効な配送ID(正token)で印刷予約POST→HTTP200 JSON「${MSG_SUCCESS}」（要: SEED-M05-08-ORDER ＋ 正token。受注を更新する破壊系のため使い捨て）`,
      async () => {
        // 期待は仕様(処理フロー#10)由来。route admin_order_print_stack /${ECCUBE_ADMIN_ROUTE}/order/print/stack。
      }
    );

    test.fixme(
      "E2E-M05-08-060 新規受付(NEW)受注を印刷予約→一覧でステータスが「ピック中」に遷移（要: SEED-M05-08-NEW・破壊系・一覧の状態表示で間接確認）",
      async () => {
        // 期待は仕様(スタック用紙印字データ組み立て時の判定/業務ルール: NEW のみピック中(ID10)へ遷移)由来。
      }
    );

    test.fixme(
      "E2E-M05-08-061 印刷予約成功で対象受注の browser_print_flg が真になる（DB直接=ブラウザ観測外・手動/間接。ケース表 付帯表2/5で管理）",
      async () => {
        // 期待は仕様(DBカラム/副作用)由来。画面表示では原値を観測できないため間接確認に留める。
      }
    );

    test.fixme(
      "E2E-M05-08-062 AJAX応答が非JSON/失敗時、子ウィンドウに固定システムエラー文を表示して閉じる（要: 非JSON応答の安定生成・実機確認）",
      async () => {
        // 期待は仕様(エラー処理 / print_stack_window.twig:44 固定文)由来。
      }
    );
  }
);
