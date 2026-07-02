/**
 * 管理画面 受注管理 メール一括通知／手動メール一括（M05-06）E2E。納品ケース表
 * integration_test/e2e/m05_06_admin_order_order_bulk_manual_mail_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、要シード（既知配送ID＋受注＋顧客メール）や
 * 破壊的（実メール発火）・要実機確認は test.fixme（理由付き）で残す。
 * 手動/間接・対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様（正本 functions/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.md / 観点表 /
 * 移行先 ec-cube-enterprise messages.ja.yaml）由来（オラクル独立性）。実装の現挙動・Form制約値を期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・two_factor_auth.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *
 * 送信(011/012)は受注ごとに実SMTPへメールを発火し dtb_mail_history を追加する破壊的・外部副作用ありの操作。
 * 共有ステージングでの常時実行を避けるため test.fixme とし、隔離アカウント＋実メール許容環境でのみ実装する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OrderOrderBulkManualMailPage } from "../../../pages/admin/m05/m05_06_admin_order_order_bulk_manual_mail.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const SEND_COMPLETE = "メールを送信しました。"; // :2346 admin.order.mail_send_complete
const NO_CHECK_ALERT = "チェックボックスが選択されていません"; // index.twig:87（一覧JS）

const MAIL_ALL_RE = /\/order\/manual_mail\/mail_all(\/\d+)?(\?|$)/;
const LOGIN_RE = /\/login(\?|$)/;
const ORDER_LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/order(\\?|$|/(\\?|$))`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  // ログイン後の遷移完了（=ログイン画面から離脱）を待ち、セッション確立前の次リクエストによる
  // フレークを防ぐ（codexレビュー中指摘）。LOGIN_RE は pathname で判定する。
  await page.waitForURL((url) => !LOGIN_RE.test(url.pathname), { timeout: 15000 });
}

test.describe("受注管理 > メール一括通知／手動メール一括", { tag: ["@admin", "@order", "@mail"] }, () => {
  // ===== 資格情報不要・非破壊（常時実行可） =====

  test("E2E-M05-06-017 未ログインで入口URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order/manual_mail/mail_all?ids%5B%5D=1`);
    await expect(page).toHaveURL(LOGIN_RE); // 管理ログイン画面へURL誘導されること（codexレビュー低指摘）
    await expect(page.locator("#login_id")).toBeVisible(); // 管理ログインフォーム表示
  });

  // ===== 要ログイン・非破壊（受注一覧データに依存） =====

  test("E2E-M05-06-015 ids未指定で入口URL直接アクセス→404", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const target = new OrderOrderBulkManualMailPage(page);
    const resp = await page.goto(target.mailAllUrl); // ids 無し
    expect(resp?.status(), "ids 空・非配列は NotFoundHttpException(404)").toBe(404);
  });

  test("E2E-M05-06-016 数値でないtemplateIdで入口URLへアクセス→404", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    // ルート requirements templateId=\d+。非数値はルーティングで一致せず 404。
    const resp = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order/manual_mail/mail_all/abc?ids%5B%5D=1`);
    expect(resp?.status(), "非数値 templateId は 404").toBe(404);
  });

  test("E2E-M05-06-001 受注一覧の「その他」に「メール一括通知」リンクが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const target = new OrderOrderBulkManualMailPage(page);
    await target.gotoList();
    // 検索結果が0件の環境では一括導線が描画されない（設計書 フロント挙動）。リンク有無を確認する。
    await target.seeBulkMailEntry();
  });

  test("E2E-M05-06-002 未チェックで「メール一括通知」→alert表示・遷移しない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const target = new OrderOrderBulkManualMailPage(page);
    await target.gotoList();
    let dialogMessage = "";
    page.on("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });
    await target.openOtherMenu();
    await target.clickManualMailAll(); // 未チェックのまま押下
    // alert 文言（index.twig:87）と、入口URLへ遷移しないこと（一覧に滞留）を確認する。
    await expect.poll(() => dialogMessage).toContain(NO_CHECK_ALERT);
    await expect(page).not.toHaveURL(MAIL_ALL_RE);
  });

  // ===== 要シード（SEED-M05-06-ORDER：既知配送ID＋受注＋顧客メール）＝未実装で可視化 =====

  test.fixme(
    "E2E-M05-06-003 チェック1件以上で「メール一括通知」→テンプレ未選択の入力画面が開く（要SEED配送ID）",
    async () => {
      // 期待は仕様(処理フロー 一覧から当機能へ入る#1-#3)由来。既知配送IDの受注を一覧に出し、
      // 配送行をチェック→その他→メール一括通知で form_bulk を GET 送信し、mail_all へ遷移することを確認する。
    }
  );

  test.fixme(
    "E2E-M05-06-004 入力画面のUI部品（テンプレ選択/件名/本文プレビュー/送信先テーブル/確認/戻る）（要SEED配送ID）",
    async () => {
      // 期待は仕様(フロント挙動・入力項目)由来。target.gotoMailAll([shippingId]) → target.seeInputForm()。
    }
  );

  test.fixme(
    "E2E-M05-06-005 テンプレ未選択のとき「確認」ボタンが disabled（要SEED配送ID／要実機: クライアント制御）",
    async () => {
      // 期待は仕様(入力項目: テンプレ未確定の間 確認ボタンは disabled / manual_mail_all.twig:161)由来。
    }
  );

  test.fixme(
    "E2E-M05-06-006 テンプレ選択→ids保持のまま mail_all_edit/{templateId} へ再構築遷移（要SEED配送ID）",
    async () => {
      // 期待は仕様(フロント挙動 JS: ids%5B%5D 連結→location.href)由来。selectTemplate→URLが /{templateId}?ids[]=… へ。
    }
  );

  test.fixme(
    "E2E-M05-06-007 テンプレ選択後「確認」→先頭受注プレビュー付き確認画面（要SEED配送ID）",
    async () => {
      // 期待は仕様(処理フロー 確認画面へ進む POST mode=confirm)由来。submitConfirm→確認画面でテンプレ名/件名/本文プレビュー表示。
    }
  );

  test.fixme(
    "E2E-M05-06-008 確認画面に「送信」ボタン・「手動メール通知画面に戻る」リンクが表示される（要SEED配送ID）",
    async () => {
      // 期待は仕様(フロント挙動 確認画面の表示要素 / manual_mail_all_confirm.twig:156,165)由来。
    }
  );

  test.fixme(
    "E2E-M05-06-009 確認画面「手動メール通知画面に戻る」→入力画面へ戻る（要SEED配送ID）",
    async () => {
      // 期待は仕様(利用者視点の入口 確認→入力に戻る)由来。backToEditLink→mail_all/{templateId}?ids[]=…。
    }
  );

  test.fixme(
    "E2E-M05-06-010 入力画面「受注一覧画面へ戻る」→受注一覧へ戻る（要SEED配送ID）",
    async () => {
      // 期待は仕様(利用者視点の入口 受注一覧に戻る)由来。backToListLink→admin_order。
    }
  );

  test.fixme(
    "E2E-M05-06-013 件名を空にして「確認」→検証エラーで送信が完了しない（要SEED配送ID／要実機: エラー表示位置）",
    async () => {
      // 期待は仕様(入力項目: 件名 必須)由来。fillSubject("")→submitConfirm→確認画面へ進まず送信未完了。
      // header/footer は hidden と textarea が同居しうる（不具合候補#3）ため実機でエラー表示を確認。
    }
  );

  test.fixme(
    "E2E-M05-06-014 配送IDの一部がDBに存在しない→欠番エラーフラッシュ→受注一覧へ戻る（要存在配送ID＋不存在ID）",
    async () => {
      // 期待は仕様(エッジケース: 一部の配送IDがDBに存在しない / messages.ja.yaml:2519)由来。
      // gotoMailAll([存在ID, 不存在の大きなID]) → エラーフラッシュ「注文ID <id> の注文情報を取得できませんでした。」表示＋admin_orderへ。
      // 注: 文言は「注文ID」だが埋め込み値は配送ID（不具合候補#2・要確認）。
    }
  );

  test.fixme(
    "E2E-M05-06-018 ヘッダ空での検証（要実機確認: header は hidden 事前充填でUI操作不可）",
    async () => {
      // 期待は仕様(入力項目: ヘッダ 必須)由来。ただし header は manual_mail_all.twig:51 で
      // input[type=hidden name="mail[header]"] としてテンプレ値で事前充填され、可視の入力欄が無い。
      // 通常UI操作で空に出来ないため、空検証の発火はテンプレ側ヘッダ空時のみ（不具合候補#3・要確認）。
      // 必須の正は設計書「入力項目」（Form NotBlank はオラクル根拠化しない）。実機でエラー表示を確認する。
    }
  );

  test.fixme(
    "E2E-M05-06-019 フッタ空での検証（要実機確認: footer は hidden 事前充填でUI操作不可）",
    async () => {
      // 期待は仕様(入力項目: フッタ 必須)由来。footer も manual_mail_all.twig:52 の hidden 事前充填で
      // 可視入力欄が無い（不具合候補#3・要確認）。実機でエラー表示・送信値解釈を確認する。
    }
  );

  test.fixme(
    "E2E-M05-06-020 数値だが存在しないtemplateId（許可外/未存在）→404（要SEED配送ID）",
    async () => {
      // 期待は仕様(エッジケース: 不正templateId→404)由来。getManualMailTemplate は許可ベースファイルに
      // 該当する MailTemplate が無いと NotFoundHttpException を投げる。
      // ただしテンプレ照合到達には ids の配送が存在する必要があるため要SEED。
      // gotoMailAll([存在配送ID], 9999999) → HTTP 404。
    }
  );

  test.fixme(
    "E2E-M05-06-021 同一受注の複数配送を選択→送信先テーブルに当該受注が重複表示されない（要SEED: 同一受注2配送）",
    async () => {
      // 期待は仕様(エッジケース: 同一受注の複数配送→受注ユニーク集約)由来。送信件数自体はDB/実メールで手動だが、
      // 入力/確認画面の送信先情報テーブル(#common_info_box・注文番号)に受注が1件のみ表示される画面集約は観測可。
      // gotoMailAll([同一受注の配送ID2件]) → 送信先テーブルに注文番号が1行のみ。
    }
  );

  test.fixme(
    "E2E-M05-06-022 編集した件名が確認画面プレビューに反映される（正常系・要SEED配送ID）",
    async () => {
      // 期待は仕様(入力項目: 件名を任意編集した値が確認プレビューに反映される / 確認フロー)由来。
      // テンプレ選択済入力画面で fillSubject(任意値)→submitConfirm→確認画面プレビュー件名に編集値が表示される。
      // 空値異常系013の対（正常系）。任意編集値はテスト側で与え、実装文言をオラクル化しない。
    }
  );

  test.fixme(
    "E2E-M05-06-023 受注一覧の検索結果0件のとき一括導線（その他/form_bulk）が描画されない（要0件検索状態）",
    async () => {
      // 期待は仕様(フロント挙動: 検索結果件数が正のときだけ一括用 form_bulk と「その他」が描画 / エッジケース 検索結果0件)由来。
      // 検索結果0件の一覧で #otherDropDown / #form_bulk が非表示＝001の裏返し。
      // 0件状態への到達は検索フォーム操作（m05-01依存）が必要なため要実機確認。
    }
  );

  test.fixme(
    "E2E-M05-06-024 長大な件名でも文字列長エラーにならず確認画面へ進める（境界正常系・要SEED配送ID）",
    async () => {
      // 期待は仕様(入力項目: 件名にフォーム側 Length 制約は無い / 付帯表4#5)由来。
      // テンプレ選択済入力画面で件名に長大文字列→submitConfirm→Lengthエラーにならず確認画面へ進む。
      // 最大長はフォーム制約に依存させない。長大文字列値はオラクル根拠化しない。
    }
  );

  // ===== 破壊的（実メール発火・dtb_mail_history追加）＝隔離環境でのみ実装 =====

  test.fixme(
    "E2E-M05-06-011 確認画面で「送信」→成功フラッシュ「メールを送信しました。」（破壊的・実メール発火・要隔離）",
    async () => {
      // 期待は仕様(処理フロー 送信 POST mode=complete / messages.ja.yaml:2346)由来。
      // submitSend→ await expect(page.getByText(SEND_COMPLETE)).toBeVisible(); 実SMTP発火のため隔離アカウントで。
      void SEND_COMPLETE;
    }
  );

  test.fixme(
    "E2E-M05-06-012 送信完了後 受注一覧（admin_order）へリダイレクト（破壊的・実メール発火・要隔離）",
    async () => {
      // 期待は仕様(画面遷移: 確認で送信POST成功→admin_order / MailController.php:400)由来。
      // submitSend→ await expect(page).toHaveURL(ORDER_LIST_RE);
      void ORDER_LIST_RE;
    }
  );
});
