/**
 * 管理画面 受注詳細メール通知 E2E。納品ケース表 integration_test/e2e/m05_15_admin_order_order_mail_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち非破壊で実行可能なものを実装し、破壊的(実メール送信＋送信履歴登録)・
 * 要実機(aceエディタへの本文入力・テンプレ同期未完状態)は test.fixme（理由付き）で残す。
 * 手動/間接・対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約準拠）。
 * 期待結果は仕様(設計書 functions/ec-cube-enterprise/m05-15_admin_order_order_mail.md / 観点表 /
 * messages.ja.yaml / validators.ja.yaml)由来（オラクル独立性）。実装の現挙動・Form制約値を期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 *
 * シード（環境変数。コミットしない）:
 *  - ORDER_ID          : SEED-M05-15-ORDER（メール送信先のある既存受注。会員紐付き・メールアドレス有り）
 *  - 少なくとも1件のメールテンプレート（dtb_mail_template）が存在すること（テンプレ選択ケース用）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OrderOrderMailPage } from "../../../pages/admin/m05/m05_15_admin_order_order_mail.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const ORDER_ID = process.env.ORDER_ID || "";
const HAS_ORDER = HAS_CREDS && !!ORDER_ID;

const HOME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/?(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;
// 管理プレフィックス込みで照合（別経路 /order/{id}/mail 等を誤通過させない）。
const MAIL_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/order/\\d+/mail(\\?|$)`);
const EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/order/\\d+/edit(\\?|$)`);

// 仕様(messages.ja.yaml / validators.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const SEND_COMPLETE = "メールを送信しました。"; // messages.ja.yaml:2346 admin.order.mail_send_complete
const SUBJECT_REQUIRED = "入力されていません。"; // validators.ja.yaml:17 NotBlank
const TWIG_INVALID = "Twigのフォーマットが正しくありません。"; // validators.ja.yaml:36 TwigLint
const TPL_NOT_FOUND = "選択されたテンプレートの本文が見つかりませんでした。"; // messages.ja.yaml:2338（前方一致）

/** 管理ログインしてホームへ到達する。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).toHaveURL(HOME_RE);
}

/** ログインしてメール通知 編集画面を開く。 */
async function openMail(page: Page, id = ORDER_ID) {
  await loginToHome(page);
  const mail = new OrderOrderMailPage(page);
  await mail.goto(id);
  return mail;
}

test.describe("管理画面 > 受注詳細メール通知", { tag: ["@admin", "@order"] }, () => {
  // ===== 未認証・存在しないID（非破壊） =====

  test("E2E-M05-15-060 未ログインでメール通知URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
    // 期待は仕様(権限・認可: 未ログインは管理ログインへ誘導)由来（IT-15 未認証）。
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order/1/mail`);
    await expect(page).toHaveURL(LOGIN_RE);
  });

  test("E2E-M05-15-061 存在しない受注IDのメール通知はHTTP404", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    // 期待は仕様(エラー処理: 受注識別子が存在しない→アクセスできない)由来（IT-13 URL直接アクセス）。
    await loginToHome(page);
    const mail = new OrderOrderMailPage(page);
    const res = await mail.goto(999999999);
    expect(res?.status()).toBe(404);
  });

  // ===== 編集画面 表示（SEED-M05-15-ORDER・読み取りのみ） =====

  test("E2E-M05-15-001 編集画面: メール内容カード/テンプレ選択/件名/本文エディタ/確認ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_ORDER, "SEED-M05-15-ORDER 未設定（ORDER_ID）");
    // 期待は仕様(フロント挙動 表示要素（メール内容）)由来（IT-25 UI部品）。
    const mail = await openMail(page);
    await mail.seeEditForm();
  });

  test("E2E-M05-15-005 受注編集画面の送信履歴ブロック「メールを作成」→メール通知画面が開く", async ({ page }) => {
    test.skip(!HAS_ORDER, "SEED-M05-15-ORDER 未設定");
    // 期待は仕様(利用者視点の入口 主経路: 受注編集画面のメール送信履歴ブロックで「メールを作成」→ メール通知画面)由来（IT-20 識別子）。
    await loginToHome(page);
    const mail = new OrderOrderMailPage(page);
    await mail.gotoEdit(ORDER_ID);
    await mail.createMailLink.click();
    await expect(page).toHaveURL(MAIL_RE); // メール通知画面が開く
    await mail.seeEditForm();
  });

  test("E2E-M05-15-002 編集画面: メール送信先カードに受注の参照項目が表示される", async ({ page }) => {
    test.skip(!HAS_ORDER, "SEED-M05-15-ORDER 未設定");
    // 期待は仕様(フロント挙動 表示要素（送信先情報）: 注文番号・購入金額・注文者・購入商品・対応状況を参照表示)由来（IT-25）。
    const mail = await openMail(page);
    await expect(mail.destinationCard).toBeVisible();
    await mail.seeDestinationDetails();
  });

  test("E2E-M05-15-003 編集画面: 件名に必須バッジが表示される", async ({ page }) => {
    test.skip(!HAS_ORDER, "SEED-M05-15-ORDER 未設定");
    // 期待は仕様(入力項目: 件名は必須＝必須バッジ付き)由来（IT-22 必須制御）。
    const mail = await openMail(page);
    await expect(mail.subjectRequiredBadge).toBeVisible();
  });

  test("E2E-M05-15-004 編集画面: 送信先/テンプレ/件名ラベルにツールチップ属性が付与される", async ({ page }) => {
    test.skip(!HAS_ORDER, "SEED-M05-15-ORDER 未設定");
    // 期待は仕様(フロント挙動 ツールチップ: 送信先・テンプレ・件名の各ラベルに吹き出し説明)由来（IT-03）。
    const mail = await openMail(page);
    await expect(page.locator('[data-bs-toggle="tooltip"]').first()).toBeVisible();
    expect(await page.locator('[data-bs-toggle="tooltip"]').count()).toBeGreaterThanOrEqual(3);
  });

  test("E2E-M05-15-006 編集画面: 送信先/メール内容カードをヘッダ矢印で折りたたみ/展開できる", async ({ page }) => {
    test.skip(!HAS_ORDER, "SEED-M05-15-ORDER 未設定");
    // 期待は仕様(フロント挙動 CSS・レイアウト: 各カードはヘッダの矢印で開閉できる)由来（IT-25 UI部品）。
    const mail = await openMail(page);
    await mail.toggleCard(mail.destinationToggle, mail.destinationBody);
    await mail.toggleCard(mail.mailInfoToggle, mail.mailInfoBody);
  });

  // ===== テンプレート選択（mode=change・非破壊：DB更新なし） =====

  test("E2E-M05-15-010 テンプレ選択(change)で件名・本文が読み込まれ同一編集画面に留まる", async ({ page }) => {
    test.skip(!HAS_ORDER, "SEED-M05-15-ORDER 未設定（要: テンプレート1件以上）");
    // 期待は仕様(処理フロー モード change: 件名と当該受注で描画した本文を読み込み直し同一画面を再表示)由来（IT-15 状態変化）。
    const mail = await openMail(page);
    await mail.selectTemplateByIndex(1);
    await expect(page).toHaveURL(MAIL_RE); // 同一編集画面に留まる
    await expect(mail.subjectInput).not.toHaveValue(""); // テンプレ件名が反映される
    await expect(mail.bodyTextarea).not.toHaveValue(""); // 当該受注で描画した本文が反映される
  });

  // ===== 確認（mode=confirm・非破壊：送信しない） =====

  test("E2E-M05-15-020 件名入力・本文空のまま「送信内容を確認」→確認画面（送信ボタン・戻るリンク）へ進む", async ({ page }) => {
    test.skip(!HAS_ORDER, "SEED-M05-15-ORDER 未設定");
    // 期待は仕様(処理フロー モード confirm: 検証成功で確認画面へ。件名のみ必須・本文は任意)由来（IT-25 UI部品）。
    const mail = await openMail(page);
    const subject = "E2Eテスト件名";
    await mail.fillSubject(subject);
    await mail.submitConfirm();
    // 件名・本文を編集不可で再表示する確認画面へ進み、送信ボタン・戻るリンクが出る。
    await mail.seeConfirmReadonly(subject);
  });

  test("E2E-M05-15-021 確認画面で「メール通知」(戻る)→編集画面の初期描画に戻る", async ({ page }) => {
    test.skip(!HAS_ORDER, "SEED-M05-15-ORDER 未設定");
    // 期待は仕様(処理フロー モード back: 明示分岐なし＝編集画面の初期描画に戻る)由来（IT-03 画面遷移）。
    const mail = await openMail(page);
    await mail.fillSubject("E2Eテスト件名");
    await mail.submitConfirm();
    await mail.clickBack();
    await expect(page).toHaveURL(MAIL_RE);
    await expect(mail.confirmButton).toBeVisible(); // 編集画面（「送信内容を確認」）へ戻る
  });

  // ===== 必須バリデーション（mode=confirm 失敗・非破壊） =====

  test("E2E-M05-15-050 件名未入力で「送信内容を確認」→必須エラーで編集画面に留まる", async ({ page }) => {
    test.skip(!HAS_ORDER, "SEED-M05-15-ORDER 未設定");
    // 期待は仕様(バリデーション 件名: 空不可／エラー処理: 確認・送信へ進まない)由来（IT-22 必須）。
    const mail = await openMail(page);
    await mail.fillSubject(""); // 件名空
    await mail.submitConfirm();
    await expect(page).toHaveURL(MAIL_RE); // 確認画面へ進まず編集画面に滞留
    await expect(page.locator("body")).toContainText(SUBJECT_REQUIRED);
  });

  // ===== 受注登録リンク（メール送信なしで受注編集画面へ） =====

  test("E2E-M05-15-040 「受注登録」リンク→メール送信せず受注編集画面へ戻る", async ({ page }) => {
    test.skip(!HAS_ORDER, "SEED-M05-15-ORDER 未設定");
    // 期待は仕様(利用者視点の入口/画面遷移: 受注登録リンクはメール送信せず受注編集画面へ)由来（IT-25）。
    const mail = await openMail(page);
    await mail.orderRegistrationLink.click();
    await expect(page).toHaveURL(EDIT_RE);
  });

  // ===== 破壊的/要実機（理由付きで未実装・抜け漏れ可視化） =====

  test.fixme(
    "E2E-M05-15-030 確認画面で「送信」→「メールを送信しました。」フラッシュ＋受注編集画面へ（破壊的・実メール送信＋送信履歴登録）",
    async () => {
      // 期待は仕様(処理フロー モード complete: 送信→送信履歴記録→成功フラッシュ→受注編集画面へ)由来
      // （IT-26 登録内容 / mail_send_complete=メールを送信しました。）。実受信・本文内容は手動。
      // 実装すると dtb_mail_history に行が増え実メールが飛ぶため、使い捨て受注＋メールサンドボックスで実機実行する。
    }
  );

  test.fixme(
    "E2E-M05-15-051 本文に不正Twig構文で確認→「Twigのフォーマットが正しくありません。」で滞留（要: aceエディタへの入力）",
    async () => {
      // 期待は仕様(バリデーション 本文: Twig構文検証／表示メッセージ)由来（IT-03 画面遷移）。
      // 本文は ace エディタ実体で、送信直前に隠し textarea へ書き戻す（mail.twig:41-43）。
      // aceへの入力手順（ace_text-input への type 等）は実機確認後に実装する。
    }
  );

  test.fixme(
    "E2E-M05-15-052 テンプレ本文の読込失敗時にエラーメッセージ表示・本文は空のまま再描画（要: テンプレ同期未完状態）",
    async () => {
      // 期待は仕様(処理フロー change#4 / 表示メッセージ: 本文テンプレ読込失敗でエラー表示・本文空)由来（IT-22）。
      // 期待文言は前方一致「選択されたテンプレートの本文が見つかりませんでした。」。
      // ファイル未存在テンプレートの用意（同期未完の再現）が要るため実機確認後に実装する。
    }
  );

  test.fixme(
    "E2E-M05-15-022 確認画面で本文の改行が反映して（複数行で）表示される（要: aceエディタへの本文入力）",
    async () => {
      // 期待は仕様(処理フロー confirm: 本文は改行を反映して表示する)由来（IT-03）。
      // 確認画面の本文は #detail_box__tpl_data に nl2br で出力（mail_confirm.twig:113-114）。
      // 本文(改行含む)入力には ace エディタへの type が要るため実機確認後に実装する。
    }
  );

  test.fixme(
    "E2E-M05-15-031 送信完了後 受注編集画面の送信履歴ブロックに当該履歴が表示される（破壊的・実メール送信＋送信履歴登録）",
    async () => {
      // 期待は仕様(データ整合性: 送信完了後に受注編集画面の送信履歴ブロックへ当該履歴が一覧表示される)由来（IT-23）。
      // E2E-030 の送信を伴うため使い捨て受注＋メールサンドボックスで実機実行する。履歴の表示順・内容の細部は受注編集画面側を正とする。
    }
  );
});
