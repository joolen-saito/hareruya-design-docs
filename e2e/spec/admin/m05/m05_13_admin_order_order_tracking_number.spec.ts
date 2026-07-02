/**
 * 管理画面 受注管理 問い合わせ番号入力（送り状No.）（M05-13）E2E。納品ケース表
 * integration_test/e2e/m05_13_admin_order_order_tracking_number_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、自動化予定だが未実装/要実機/不具合候補(一覧UI未配置)は
 * test.fixme（理由付き）で残す。手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/ec-cube-enterprise/m05-13_admin_order_order_tracking_number.md / 観点表 /
 * messages.ja.yaml / validators.ja.yaml)由来（オラクル独立性）。実装の現挙動・Form制約を期待値へ流用しない。
 * 本機能は ec-cube-enterprise を正典（標準機能）とし、刷新先に受注編集の送り状No.欄(admin_order_edit)が実在する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・m05_01 も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報が無ければ走らないよう test.skip でガードする（ECCUBE_ADMIN_USER/PASS）。
 * 受注編集は既存受注データに依存するため、一覧に受注が無い場合は test.skip でガードする（要シード SEED-M05-13-ORDER）。
 *
 * データ汚染の注意（要確認: 後始末の実装は未着手）:
 *  022/023(と手動の025)は受注編集フォーム送信で dtb_shipping.tracking_number を確定保存する副作用を持つ。
 *  本specは現状、一覧の「先頭受注」を開いて保存するため、実行すると当該受注のデータを書き換える。
 *  恒久対応として、保存系は使い捨て/専用 SEED-M05-13-ORDER に限定し afterEach で初期値へ復元すべき
 *  （ケース表 付帯表3 参照）。シード/復元の実装が入るまでは保存系を本番相当データへ流さないこと。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OrderOrderTrackingNumberPage } from "../../../pages/admin/m05/m05_13_admin_order_order_tracking_number.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);

// 仕様(messages.ja.yaml / validators.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const ERR_FORM_CHAR = "半角英数字かハイフンのみを入力してください。"; // validators.ja.yaml:41 form_error.graph_and_hyphen_only（受注編集フォーム）
// const ERR_LIST_CHAR = "送り状No.は半角英数字かハイフンのみを入力してください。"; // messages.ja.yaml:2332（受注一覧の非同期保存）→ 一覧UI未配置のため fixme で管理

// 仕様由来の入力値。文字種は半角英数字とハイフンのみ許可（/^[0-9a-zA-Z-]+$/u）。
const VALID_TN = "E2E-ABC-12345";
const INVALID_SYMBOL_TN = "ABC@123"; // ハイフン以外の記号を含む＝文字種エラー
const FULLWIDTH_TN = "ＡＢＣ１２３"; // 受注編集経路は半角変換しないため文字種エラー（エッジケース）

/** 管理ログインして受注編集の送り状No.欄まで到達する。受注が無ければ null。 */
async function loginAndOpenOrderEdit(
  page: Page
): Promise<OrderOrderTrackingNumberPage | null> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const tn = new OrderOrderTrackingNumberPage(page);
  const ok = await tn.openFirstOrderEdit();
  return ok ? tn : null;
}

test.describe(
  "管理画面 > 受注管理 > 問い合わせ番号入力（送り状No.）",
  { tag: ["@admin", "@order"] },
  () => {
    // ===== 権限・認可（認証不要・非破壊） =====

    test("E2E-M05-13-001 未ログインで受注一覧URL直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      // 仕様 権限・認可: 未認証は管理用ファイアウォールで到達不可＝ログインへ誘導。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M05-13-002 未ログインで受注編集URL直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      // 仕様 権限・認可: 受注編集(送り状No.欄)も管理側URL＝未認証はログインへ誘導。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order/1/edit`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M05-13-003 ログアウト後に受注編集URLへ再アクセス→管理ログイン画面へ誘導（セッション失効後の保護）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      // 仕様 権限・認可/状態変化: ログアウト/セッション失効後は管理ファイアウォールで到達不可＝ログイン誘導。
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      // ログイン成立後にログアウト（admin_logout）。以降は認証無効。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/logout`);
      // 受注編集URLへ再アクセス→未認証としてログインへ誘導される（継続利用できない）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order/1/edit`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 受注編集の送り状No.欄（ログイン＋既存受注データ） =====

    test("E2E-M05-13-010 受注編集に「送り状No.」ラベルと入力欄が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const tn = await loginAndOpenOrderEdit(page);
      test.skip(tn === null, "受注が無く受注編集を開けない（要シード SEED-M05-13-ORDER）");
      // 仕様 フロント挙動(表示要素・受注編集): 出荷情報に「送り状No.」ラベルと1行テキスト欄を表示する。
      await tn!.seeEditTrackingField();
    });

    test("E2E-M05-13-011 受注編集の送り状No.ラベルにツールチップ説明が付与される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const tn = await loginAndOpenOrderEdit(page);
      test.skip(tn === null, "受注が無く受注編集を開けない（要シード SEED-M05-13-ORDER）");
      // 仕様 フロント挙動(表示要素・受注編集): ツールチップ付きの欄である（tooltip.order.shipping_info.tracking_number）。
      await expect(tn!.editTrackingLabel).toBeVisible();
    });

    test("E2E-M05-13-020 受注編集で記号入りを入力し保存→文字種エラーが欄直下に表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const tn = await loginAndOpenOrderEdit(page);
      test.skip(tn === null, "受注が無く受注編集を開けない（要シード SEED-M05-13-ORDER）");
      // 仕様 バリデーション(受注編集): 文字種 /^[0-9a-zA-Z-]+$/u 以外はエラー（form_error.graph_and_hyphen_only）。
      // 欄直下の項目エラー表示＝フォーム検証で弾かれ保存に至らない（＝「保存されない」の観測代理）。
      // 変更前値が保持される点のDB間接確認は手動050。
      await tn!.fillAndSaveEditTracking(INVALID_SYMBOL_TN);
      await tn!.seeMessage(ERR_FORM_CHAR);
    });

    test("E2E-M05-13-021 受注編集で全角英数字を入力し保存→文字種エラー（編集経路は半角変換しない）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const tn = await loginAndOpenOrderEdit(page);
      test.skip(tn === null, "受注が無く受注編集を開けない（要シード SEED-M05-13-ORDER）");
      // 仕様 エッジケース(全角英数字・受注編集): 半角変換を行わないため文字種エラーとなる。
      await tn!.fillAndSaveEditTracking(FULLWIDTH_TN);
      await tn!.seeMessage(ERR_FORM_CHAR);
    });

    test("E2E-M05-13-022 受注編集で半角英数字＋ハイフンの正しい値を保存→文字種エラーが出ない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const tn = await loginAndOpenOrderEdit(page);
      test.skip(tn === null, "受注が無く受注編集を開けない（要シード SEED-M05-13-ORDER）");
      // 仕様 バリデーション(受注編集)の正常対: 半角英数字とハイフンのみは文字種エラーにならず保存できる。
      await tn!.fillAndSaveEditTracking(VALID_TN);
      await expect(page.getByText(ERR_FORM_CHAR)).toHaveCount(0);
      // 仕様 データ整合性(一覧と編集の一致・参照時点): 保存後の再表示で入力値が初期値へ反映される。
      // ＝「エラーが出ない」だけでなく保存成立を観測可能な範囲で確認する（DB永続の直接確認は手動050）。
      // 要確認: 受注編集フォームは他項目の必須検証を含むため、完備した SEED-M05-13-ORDER でのみ成立する。
      await expect(tn!.editTrackingNumber).toHaveValue(VALID_TN);
    });

    test("E2E-M05-13-023 受注編集で送り状No.を空のまま保存→任意項目のため文字種エラーが出ない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const tn = await loginAndOpenOrderEdit(page);
      test.skip(tn === null, "受注が無く受注編集を開けない（要シード SEED-M05-13-ORDER）");
      // 仕様 入力項目(受注編集 任意)・エッジケース(値が空・受注編集): 空のまま保存し得る（文字種エラーにしない）。
      await tn!.fillAndSaveEditTracking("");
      await expect(page.getByText(ERR_FORM_CHAR)).toHaveCount(0);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外/不具合候補はケース表で全量管理） =====

    test.fixme(
      "E2E-M05-13-024 受注編集で200文字超を保存→文字数超過エラー（Symfony Length文言は環境依存・要実機）",
      async () => {
        // 期待は仕様(最大長 受注編集=eccube_mtext_len 確認値200)由来。描画される文字数超過メッセージ文言は要実機確認。
      }
    );

    test.fixme(
      "E2E-M05-13-030 受注一覧の出荷行に送り状No.入力欄と更新ボタンが表示される（不具合候補#1: 一覧テンプレに入力欄/更新ボタン未配置）",
      async () => {
        // 期待は仕様(フロント挙動・受注一覧 表示要素)由来。Enterprise の index.twig(line 1293 TODO)は
        // input.update_tracking_number / button.update_tracking_number を未配置でJSフックのみ存在。仕様どおりの表示を期待。
      }
    );

    test.fixme(
      "E2E-M05-13-032 受注一覧で更新ボタン押下→PUT非同期保存し入力欄へ保存後の値を反映（不具合候補#1＋要シード出荷）",
      async () => {
        // 期待は仕様(処理フロー 受注一覧#3,#7・成功時ステータスOK＋保存後値反映)由来。一覧UI配置後に実装。
      }
    );

    test.fixme(
      "E2E-M05-13-033 受注一覧で記号入りを非同期保存→「送り状No.は半角英数字かハイフンのみを入力してください。」をアラート表示（不具合候補#1）",
      async () => {
        // 期待は仕様(表示メッセージ・受注一覧 文字種 messages.ja.yaml:2332)由来。一覧UI配置後に実装。
      }
    );

    test.fixme(
      "E2E-M05-13-034 受注一覧で全角英数字を非同期保存→半角変換後に保存される（不具合候補#1）",
      async () => {
        // 期待は仕様(業務ルール 半角変換・受注一覧 mb_convert_kana)由来。一覧UI配置後に実装。
      }
    );

    test.fixme(
      "E2E-M05-13-038 受注一覧でEnter押下→非同期保存し次の出荷行入力欄へフォーカス移動（不具合候補#1: 一覧UI未配置・仮セレクタ）",
      async () => {
        // 期待は仕様(フロント挙動・受注一覧 JS挙動: Enterで保存後に次入力欄へフォーカス移動)由来。
        // index.twig:254-271 の keypress(code13)→updateTrackingNumber＋`:gt(index):first`.focus()。一覧UI配置後に実装。
      }
    );

    test.fixme(
      "E2E-M05-13-040 非同期保存をXHRでない/トークン不正で送信→ステータスNGのHTTP400（要: 認証セッション＋出荷ID＋低レベル要求）",
      async () => {
        // 期待は仕様(エラー処理・XHR/なりすまし対策トークン不正→HTTP400 NG / OrderController.php:568-569)由来。
        // ブラウザ低レベル要求(page.request)＋有効CSRFトークン取得を要し、専用出荷IDで隔離実行する。
      }
    );
  }
);
