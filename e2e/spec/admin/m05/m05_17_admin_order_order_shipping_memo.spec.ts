/**
 * 管理画面 受注管理 配達用メモ登録（出荷用メモ欄）（M05-17）E2E。納品ケース表
 * integration_test/e2e/m05_17_admin_order_order_shipping_memo_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、自動化予定だが未実装/要実機（永続化の再表示確認）は
 * test.fixme（理由付き）で残す。手動/対象外（CSV参照・権限拒否・お届け先追加削除・ログ抑止等）は
 * ケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/ec-cube-enterprise/m05-17_admin_order_order_shipping_memo.md / 観点表 /
 * messages.ja.yaml)由来（オラクル独立性）。実装の現挙動・Form制約（Length/maxlength）を期待値へ流用しない。
 * 本機能は ec-cube-enterprise を正典（標準機能）とし、刷新先に受注編集/出荷編集の出荷用メモ欄が実在する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・m05_* も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報が無ければ走らないよう test.skip でガードする（ECCUBE_ADMIN_USER/PASS）。
 *
 * データ依存・汚染の注意（要確認: 後始末の実装は未着手）:
 *  - 受注編集/出荷編集は既存受注に依存する。単一お届け先受注ID（ORDER_SINGLE_ID）・複数お届け先受注ID
 *    （ORDER_MULTI_ID）を環境変数で与える。未設定なら該当テストは skip（要シード 付帯表3）。
 *  - 010/020/030/031 は dtb_shipping.note を書き換える保存系。使い捨て/専用 SEED-M05-17-ORDER-SINGLE に
 *    限定し、初期メモへ復元すべき。シード/復元の実装が入るまでは本番相当データへ流さないこと。
 *  - 受注編集の保存成立には受注フォーム全体の必須項目完備が前提（要確認）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OrderOrderShippingMemoPage } from "../../../pages/admin/m05/m05_17_admin_order_order_shipping_memo.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// 既存受注ID（要シード）。URL直接アクセスのガード確認は資格情報・受注不要。
const ORDER_SINGLE_ID = process.env.ORDER_SINGLE_ID || ""; // 出荷1件（単一お届け先）
const ORDER_MULTI_ID = process.env.ORDER_MULTI_ID || ""; // 複数お届け先（出荷2件以上）
const HAS_SINGLE = !!ORDER_SINGLE_ID;
const HAS_MULTI = !!ORDER_MULTI_ID;

// SEED-M05-17-ORDER-SINGLE が dtb_shipping.note に投入する既知の初期メモ（初期表示確認用）。
// シード値はテストデータ定義由来であり実装の現挙動ではない。未設定なら初期値一致の検証はスキップする。
const ORDER_SINGLE_NOTE = process.env.ORDER_SINGLE_NOTE || "";
const HAS_SINGLE_NOTE = !!ORDER_SINGLE_NOTE;

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const ORDER_EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/order/\\d+/edit(\\?|$)`);
const SHIPPING_EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/shipping/\\d+/edit(\\?|$)`);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const MEMO_LABEL = "出荷用メモ欄"; // admin.order.shop_memo_for_shipped:2353
const MEMO_TOOLTIP =
  "出荷担当者、及び配送業者用のメモを保存しておけます。出荷用CSV等で確認が可能です。"; // tooltip.order.shipping_info.shop_memo:3418

// 仕様(入力項目/バリデーション)由来の境界。Length上限3000（確認値 eccube_ltext_len）。
const NOTE_WITHIN = "a".repeat(3000);
const NOTE_OVER = "a".repeat(3001);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
}

test.describe(
  "管理画面 > 受注管理 > 配達用メモ登録（出荷用メモ欄）",
  { tag: ["@admin", "@order"] },
  () => {
    // ===== 権限・認可（認証不要・非破壊） =====

    test("E2E-M05-17-040 未ログインで受注編集URL直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      // 仕様 権限・認可: 未認証は管理用ファイアウォールで到達不可＝ログインへ誘導。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order/1/edit`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M05-17-041 未ログインで出荷編集URL直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      // 仕様 権限・認可: 出荷編集も管理側URL＝未認証はログインへ誘導。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/shipping/1/edit`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 受注編集（出荷1件）の表示（ログイン＋既存受注） =====

    test("E2E-M05-17-001 受注編集（出荷1件）に出荷用メモ欄が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_SINGLE, "出荷1件の受注が無い（要シード SEED-M05-17-ORDER-SINGLE / ORDER_SINGLE_ID）");
      // 仕様 フロント挙動(表示要素・受注編集)＋データ整合性(画面と保存値): 出荷情報ブロックに
      //   ラベル「出荷用メモ欄」とtextareaを表示し、保存済みメモ（シード既知値）を初期表示する。
      await login(page);
      const m = new OrderOrderShippingMemoPage(page);
      await m.gotoOrderEdit(ORDER_SINGLE_ID);
      await m.seeOrderNoteField();
      // 仕様「保存済みのメモが初期表示される」の検証。期待値はシード定義(ORDER_SINGLE_NOTE)由来。
      test.skip(!HAS_SINGLE_NOTE, "シード既知メモ未設定（ORDER_SINGLE_NOTE 未指定のため初期値一致は未検証）");
      await expect(m.orderShippingNote).toHaveValue(ORDER_SINGLE_NOTE);
    });

    test("E2E-M05-17-002 受注編集の出荷用メモ欄ラベルにツールチップ説明が付与される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_SINGLE, "出荷1件の受注が無い（要シード SEED-M05-17-ORDER-SINGLE）");
      // 仕様 フロント挙動(ツールチップ): ラベルにツールチップ説明が付与される。
      await login(page);
      const m = new OrderOrderShippingMemoPage(page);
      await m.gotoOrderEdit(ORDER_SINGLE_ID);
      await expect(
        page.locator(`label[title="${MEMO_TOOLTIP}"]`).filter({ hasText: MEMO_LABEL })
      ).toBeVisible();
    });

    test("E2E-M05-17-003 受注新規登録画面に空の出荷用メモ欄が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      // 仕様 利用者視点の入口(受注新規)・処理フロー: 出荷情報ブロックに空の出荷用メモ欄を表示する。
      await login(page);
      const m = new OrderOrderShippingMemoPage(page);
      await m.gotoOrderNew();
      await expect(m.orderShippingNote).toBeVisible();
      await expect(m.orderShippingNote).toHaveValue("");
    });

    test("E2E-M05-17-004 出荷編集で出荷ごとに出荷用メモ欄が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_SINGLE, "受注が無い（要シード SEED-M05-17-ORDER-SINGLE）");
      // 仕様 フロント挙動(表示要素・出荷編集)＋データ整合性(画面と保存値): 各出荷ブロックに出荷用メモ欄
      //   (textarea)を表示し、保存済みメモ（シード既知値）を初期表示する。
      await login(page);
      const m = new OrderOrderShippingMemoPage(page);
      await m.gotoShippingEdit(ORDER_SINGLE_ID);
      await expect(page.getByText(MEMO_LABEL).first()).toBeVisible();
      await expect(m.shippingNote(0)).toBeVisible();
      // 仕様「保存済みのメモが初期表示される」の検証。期待値はシード定義(ORDER_SINGLE_NOTE)由来。
      test.skip(!HAS_SINGLE_NOTE, "シード既知メモ未設定（ORDER_SINGLE_NOTE 未指定のため初期値一致は未検証）");
      await expect(m.shippingNote(0)).toHaveValue(ORDER_SINGLE_NOTE);
    });

    // ===== 複数お届け先での表示・導線 =====

    test("E2E-M05-17-005 複数お届け先の受注編集に出荷用メモ欄が表示されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_MULTI, "複数お届け先の受注が無い（要シード SEED-M05-17-ORDER-MULTI / ORDER_MULTI_ID）");
      // 仕様 業務ルール(受注編集の入力範囲): 複数お届け先では受注編集画面に出荷用メモ欄を表示しない。
      await login(page);
      const m = new OrderOrderShippingMemoPage(page);
      await m.gotoOrderEdit(ORDER_MULTI_ID);
      await expect(m.orderShippingNote).toHaveCount(0);
    });

    test("E2E-M05-17-006 複数お届け先の受注編集に「お届け先を編集」導線があり出荷編集へ遷移する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_MULTI, "複数お届け先の受注が無い（要シード SEED-M05-17-ORDER-MULTI）");
      // 仕様 画面遷移(複数お届け先の編集導線): 「お届け先を編集」から出荷編集画面へ遷移する。
      await login(page);
      const m = new OrderOrderShippingMemoPage(page);
      await m.gotoOrderEdit(ORDER_MULTI_ID);
      await expect(m.editMultipleLink).toBeVisible();
      await m.editMultipleLink.click();
      await expect(page).toHaveURL(SHIPPING_EDIT_RE);
    });

    test("E2E-M05-17-007 複数お届け先の出荷編集で出荷ごとに出荷用メモ欄が独立して表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_MULTI, "複数お届け先の受注が無い（要シード SEED-M05-17-ORDER-MULTI / ORDER_MULTI_ID）");
      // 仕様 フロント挙動(表示要素・出荷編集)・業務ルール(保存単位＝出荷ごと/複数お届け先での入力範囲):
      //   出荷の数だけ出荷用メモ欄を出荷ごとに独立して表示する（出荷2件以上で2つ以上の入力欄）。
      await login(page);
      const m = new OrderOrderShippingMemoPage(page);
      await m.gotoShippingEdit(ORDER_MULTI_ID);
      await expect(m.shippingNote(0)).toBeVisible();
      await expect(m.shippingNote(1)).toBeVisible(); // 2件目の出荷ブロックにも独立した出荷用メモ欄
    });

    // ===== 受注編集の保存（出荷1件・保存系＝データ書き換え） =====

    test("E2E-M05-17-010 受注編集で出荷用メモを入力し登録→「保存しました」表示", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_SINGLE, "出荷1件の受注が無い（要シード SEED-M05-17-ORDER-SINGLE・使い捨て推奨）");
      // 仕様 処理フロー(受注編集で登録 出荷1件)・画面遷移(成功で同一受注編集): 保存完了メッセージを表示する。
      await login(page);
      const m = new OrderOrderShippingMemoPage(page);
      await m.gotoOrderEdit(ORDER_SINGLE_ID);
      await m.fillAndSaveOrderNote(`E2E配達用メモ ${Date.now()}`);
      await expect(m.saveComplete).toBeVisible();
      await expect(page).toHaveURL(ORDER_EDIT_RE); // 仕様 画面遷移: 成功で同一受注編集画面に留まる
    });

    test("E2E-M05-17-012 受注編集で出荷用メモを空のまま登録→任意項目のためエラーなく保存完了", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_SINGLE, "出荷1件の受注が無い（要シード SEED-M05-17-ORDER-SINGLE）");
      // 仕様 業務ルール(未入力時=NULL相当)・バリデーション(任意・NotBlankなし): 空でも保存できる。
      await login(page);
      const m = new OrderOrderShippingMemoPage(page);
      await m.gotoOrderEdit(ORDER_SINGLE_ID);
      await m.fillAndSaveOrderNote("");
      await expect(m.saveComplete).toBeVisible();
    });

    test("E2E-M05-17-030 受注編集で出荷用メモ3000文字（上限内）を登録→エラーなく保存完了", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_SINGLE, "出荷1件の受注が無い（要シード SEED-M05-17-ORDER-SINGLE）");
      // 仕様 バリデーション(Length上限3000・確認値 eccube_ltext_len)の正常対: 上限内は保存できる。
      await login(page);
      const m = new OrderOrderShippingMemoPage(page);
      await m.gotoOrderEdit(ORDER_SINGLE_ID);
      await m.fillAndSaveOrderNote(NOTE_WITHIN);
      await expect(m.saveComplete).toBeVisible();
    });

    test("E2E-M05-17-031 受注編集で出荷用メモ3001文字（上限超過）を登録→保存されず同一画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_SINGLE, "出荷1件の受注が無い（要シード SEED-M05-17-ORDER-SINGLE）");
      // 仕様 バリデーション(上限超過は違反・保存しない)・エラー処理(同一画面再描画):
      //   Symfony Length 既定の超過文言・項目エラーの出力クラスは環境依存のため文言一致や専用セレクタ
      //   では判定せず、(a)「保存しました」非表示=保存されない (b)受注編集URLに滞留=同一画面再描画
      //   (c)入力値が残存=フォーム再描画、で確認する。加えて項目近傍の検証エラー存在を
      //   Bootstrap標準クラス(.invalid-feedback/.text-danger)で許容的に確認する（不具合候補#1,#2,#4）。
      await login(page);
      const m = new OrderOrderShippingMemoPage(page);
      await m.gotoOrderEdit(ORDER_SINGLE_ID);
      await m.fillAndSaveOrderNote(NOTE_OVER);
      await expect(m.saveComplete).toHaveCount(0); // (a) 保存されない
      await expect(page).toHaveURL(ORDER_EDIT_RE); // (b) 同一受注編集画面に滞留
      await expect(m.orderShippingNote).not.toHaveValue(""); // (c) 入力値が残存（再描画・非保存）
      // 検証エラー表示。出力クラスは要実機確認のため許容的に確認する（不具合候補#2）。
      await expect(m.validationError.first()).toBeVisible();
    });

    // ===== 出荷編集の保存（保存系＝データ書き換え） =====

    test("E2E-M05-17-020 出荷編集で出荷用メモを入力し登録→「保存しました」＋出荷編集へリダイレクト", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_SINGLE, "受注が無い（要シード SEED-M05-17-ORDER-SINGLE・使い捨て推奨）");
      // 仕様 処理フロー(出荷編集で登録)・画面遷移(成功で出荷編集へリダイレクト): 保存完了メッセージを表示する。
      await login(page);
      const m = new OrderOrderShippingMemoPage(page);
      await m.gotoShippingEdit(ORDER_SINGLE_ID);
      await m.fillAndSaveShippingNote(`E2E配達用メモ ${Date.now()}`);
      await expect(m.saveComplete).toBeVisible();
      await expect(page).toHaveURL(SHIPPING_EDIT_RE);
    });

    test("E2E-M05-17-022 出荷編集で出荷用メモを空のまま登録→任意項目のためエラーなく保存完了", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_SINGLE, "受注が無い（要シード SEED-M05-17-ORDER-SINGLE）");
      // 仕様 業務ルール(未入力時=NULL相当)・バリデーション(任意・NotBlankなし)の出荷編集側: 空でも保存できる。
      //   受注編集側012と対の出荷編集側正常系（空保存）。
      await login(page);
      const m = new OrderOrderShippingMemoPage(page);
      await m.gotoShippingEdit(ORDER_SINGLE_ID);
      await m.fillAndSaveShippingNote("");
      await expect(m.saveComplete).toBeVisible();
    });

    test("E2E-M05-17-033 出荷編集で出荷用メモ3000文字（上限内）を登録→エラーなく保存完了", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_SINGLE, "受注が無い（要シード SEED-M05-17-ORDER-SINGLE）");
      // 仕様 バリデーション(Length上限3000・確認値 eccube_ltext_len)の出荷編集側正常対: 上限内は保存できる。
      //   出荷編集側032(3001異常)と対の正常系（3000上限内）。
      await login(page);
      const m = new OrderOrderShippingMemoPage(page);
      await m.gotoShippingEdit(ORDER_SINGLE_ID);
      await m.fillAndSaveShippingNote(NOTE_WITHIN);
      await expect(m.saveComplete).toBeVisible();
    });

    test("E2E-M05-17-032 出荷編集で出荷用メモ3001文字（上限超過）を登録→保存されず同一画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_SINGLE, "受注が無い（要シード SEED-M05-17-ORDER-SINGLE）");
      // 仕様 バリデーション(上限超過は違反・保存しない)・エラー処理(出荷編集でも検証失敗時は同一画面再描画):
      //   受注編集側031と対の出荷編集側異常系。文言/専用セレクタに依存せず保存非成立＋滞留＋入力残存＋
      //   項目エラー存在で確認する（不具合候補#1,#2,#4）。
      await login(page);
      const m = new OrderOrderShippingMemoPage(page);
      await m.gotoShippingEdit(ORDER_SINGLE_ID);
      await m.fillAndSaveShippingNote(NOTE_OVER);
      await expect(m.saveComplete).toHaveCount(0); // 保存されない
      await expect(page).toHaveURL(SHIPPING_EDIT_RE); // 同一出荷編集画面に滞留
      await expect(m.shippingNote(0)).not.toHaveValue(""); // 入力値が残存（再描画・非保存）
      await expect(m.validationError.first()).toBeVisible(); // 検証エラー表示（出力クラスは要実機確認）
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M05-17-011 受注編集で保存した出荷用メモが再表示で初期値反映（要: 使い捨てシード＋初期メモ復元）",
      async () => {
        // 期待は仕様(データ整合性・DB操作 dtb_shipping.note 更新)由来。保存後に同一受注編集を再度開き
        // #order_Shipping_note の値が入力値と一致することで永続化を間接確認する。dtb_shipping.note を
        // 書き換えるため使い捨て SEED-M05-17-ORDER-SINGLE と afterEach 復元の実装後に有効化する。
      }
    );

    test.fixme(
      "E2E-M05-17-021 出荷編集で保存した出荷用メモが再表示で初期値反映（要: 使い捨てシード＋初期メモ復元）",
      async () => {
        // 期待は仕様(データ整合性・DB操作)由来。#form_shippings_0_note の再表示値で間接確認する。
        // 保存系のためシード/復元の実装後に有効化する。
      }
    );
  }
);
