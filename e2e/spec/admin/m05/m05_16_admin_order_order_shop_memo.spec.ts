/**
 * 管理画面 受注編集 ショップ用メモ登録（M05-16）E2E。納品ケース表
 * integration_test/e2e/m05_16_admin_order_order_shop_memo_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、自動化予定だが未実装/要実機（検証失敗時のエラー表示位置・属性）は
 * test.fixme（理由付き）で残す。手動/対象外（フロント非表示・DB原値・同時編集・ログ抑止・権限/IP拒否）は
 * ケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/ec-cube-enterprise/m05-16_admin_order_order_shop_memo.md / 観点表 /
 * messages.ja.yaml)由来（オラクル独立性）。実装の現挙動・Form制約値(eccube_ltext_len)・POM見出しを期待値へ流用しない。
 * 本機能は標準機能で ec-cube-enterprise を正典とし、刷新先に受注編集(admin_order_edit)の右カラムに
 * ショップ用メモ欄カードが実在する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・m05_11・m05_13 も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報が無ければ走らないよう test.skip でガードする（ECCUBE_ADMIN_USER/PASS）。
 * 受注編集は既存受注データに依存するため、一覧に受注が無い場合は test.skip でガードする（要シード SEED-M05-16-ORDER）。
 *
 * データ汚染の注意（暫定後始末を実装済み・恒久対応は要確認）:
 *  010/011/012/015 は受注編集フォーム送信で dtb_order.note を確定保存する副作用を持つ。
 *  本specは一覧の「先頭受注」を開いて保存するため、実行すると当該受注のメモを書き換える。
 *  暫定対応として armNoteRestore() で保存前のメモ値を退避し afterEach で書き戻す（恒久変更を残さない）。
 *  恒久対応として、保存系は使い捨て/専用 SEED-M05-16-ORDER に限定すべき（ケース表 付帯表3 参照）。
 *  シード基盤が入るまで先頭受注利用は暫定であり、専用受注隔離への置換は要確認。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OrderOrderShopMemoPage } from "../../../pages/admin/m05/m05_16_admin_order_order_shop_memo.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/order/\\d+/edit(\\?|$)`);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const TOOLTIP = "店舗用メモを保存しておけます。フロント画面には表示されません。"; // :3420 tooltip.order.shop_memo

// 仕様(設計書 入力項目)由来の最大長。eccube_ltext_len 確認値3000は実装側の値であり、
// 期待の合否は設計書の「最大長3000・超過はエラー」で判定する。境界の実数は環境設定依存（付帯表4#1）。
const MEMO_OK = "E2E ショップ用メモ サンプル";
const MEMO_MULTILINE = "1行目\n2行目\n3行目";
const MEMO_OVER = "あ".repeat(3001); // 最大長(3000)超過

/** 管理ログインして受注一覧から先頭受注の編集画面を開く。受注が無ければ null。 */
async function loginAndOpenOrderEdit(page: Page): Promise<OrderOrderShopMemoPage | null> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const memo = new OrderOrderShopMemoPage(page);
  const ok = await memo.openFirstOrderEdit();
  return ok ? memo : null;
}

// 破壊系（dtb_order.note を保存で書き換える 010/011/012/015）の後始末。専用シード/復元が未整備のため
// （付帯表3）、開いた受注の元メモ値を退避し afterEach で書き戻して恒久変更を残さない。
// 恒久対応は専用 SEED-M05-16-ORDER への隔離（要確認: シード/復元基盤の実装後に置換）。
let restoreNote: (() => Promise<void>) | null = null;

/** 破壊系テストの先頭で現行メモ値を退避し、afterEach での書き戻しを予約する。 */
async function armNoteRestore(memo: OrderOrderShopMemoPage) {
  const original = await memo.noteValue();
  restoreNote = async () => {
    await memo.fillNote(original);
    await memo.submitRegister();
  };
}

test.afterEach(async () => {
  if (restoreNote) {
    const fn = restoreNote;
    restoreNote = null;
    await fn();
  }
});

test.describe(
  "管理画面 > 受注編集 > ショップ用メモ登録",
  { tag: ["@admin", "@order"] },
  () => {
    // ===== 権限・認可（認証不要・非破壊） =====

    test("E2E-M05-16-020 未ログインで受注編集URL直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      // 仕様 権限・認可: 受注編集はメモ欄を含め管理側URL＝未認証はメモ欄へ到達できずログインへ誘導。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order/1/edit`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M05-16-021 未ログインで新規受注登録URL直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      // 仕様 権限・認可/利用者視点の入口: 新規受注画面も管理側URL＝未認証はログインへ誘導。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order/new`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 表示（既存受注編集画面・GET） =====

    test("E2E-M05-16-001 受注編集の右カラムにショップ用メモ欄カードとテキストエリアが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const memo = await loginAndOpenOrderEdit(page);
      test.skip(memo === null, "受注が無く受注編集を開けない（要シード SEED-M05-16-ORDER）");
      // 仕様 フロント挙動(表示要素): 右カラムに「ショップ用メモ欄」カードとテキストエリア1個を表示する。
      await memo!.seeShopMemoCard();
    });

    test("E2E-M05-16-002 ショップ用メモ欄見出しにツールチップ説明が付与される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const memo = await loginAndOpenOrderEdit(page);
      test.skip(memo === null, "受注が無く受注編集を開けない（要シード SEED-M05-16-ORDER）");
      // 仕様 フロント挙動(ツールチップ): 見出しに tooltip.order.shop_memo の説明文を持つ（title属性で確認）。
      // hover時のBootstrapポップオーバー実描画はJS依存のため title属性存在で代替（付帯表4#4）。
      const tooltipHost = page.locator('[data-bs-toggle="tooltip"]', { hasText: "ショップ用メモ欄" });
      await expect(tooltipHost).toHaveAttribute("title", TOOLTIP);
    });

    test("E2E-M05-16-003 折りたたみリンクで本文領域(#freeArea)を開閉でき初期は展開", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const memo = await loginAndOpenOrderEdit(page);
      test.skip(memo === null, "受注が無く受注編集を開けない（要シード SEED-M05-16-ORDER）");
      // 仕様 フロント挙動(開閉): 初期状態は展開（表示）。折りたたみリンクで開閉できる。
      await expect(memo!.freeArea).toBeVisible(); // 初期は展開
      await memo!.collapseToggle.click();
      await expect(memo!.freeArea).toBeHidden(); // 折りたたみで非表示
    });

    test("E2E-M05-16-004 既存受注ではメモ欄に現行メモ(dtb_order.note)が初期表示される", async ({
      page,
    }) => {
      // 仕様 処理フロー(GET初期表示)・データ整合性: 既存受注はDB現行メモを初期値として表示する。
      // 既知の初期メモ値を持つ専用シード(SEED-M05-16-ORDER-WITHNOTE)が前提。資格/値が無ければ要実機確認。
      test.fixme(
        true,
        "既知の初期メモ値を持つ専用受注シード(SEED-M05-16-ORDER-WITHNOTE)が必要。投入後に初期表示値の一致を実装"
      );
    });

    test("E2E-M05-16-005 新規受注登録画面ではショップ用メモ欄が空で表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const memo = new OrderOrderShopMemoPage(page);
      await memo.gotoNew();
      // 仕様 利用者視点の入口/処理フロー(新規GET): 新規受注はメモ欄が空で表示される。
      await expect(memo.note).toBeVisible();
      await expect(memo.note).toHaveValue("");
    });

    // ===== 保存（既存受注編集画面・POST。dtb_order.note を更新する破壊系） =====

    test("E2E-M05-16-010 メモを入力して登録→保存成功し同一受注の編集画面へ遷移", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const memo = await loginAndOpenOrderEdit(page);
      test.skip(memo === null, "受注が無く受注編集を開けない（要シード SEED-M05-16-ORDER）");
      // 仕様 処理フロー(POST保存)・画面遷移: 検証成功時メモを含む受注を永続化し同一受注の編集画面へリダイレクト。
      await armNoteRestore(memo!); // 後始末: 元メモ値を退避（付帯表3）
      await memo!.fillNoteAndRegister(`${MEMO_OK} ${Date.now()}`);
      await expect(page).toHaveURL(EDIT_RE);
      await expect(memo!.successFlash).toBeVisible();
    });

    test("E2E-M05-16-011 保存後の編集画面再表示でメモ欄に保存値が表示される(間接永続化)", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const memo = await loginAndOpenOrderEdit(page);
      test.skip(memo === null, "受注が無く受注編集を開けない（要シード SEED-M05-16-ORDER）");
      // 仕様 データ整合性: 保存成功後の再表示も同一列(dtb_order.note)を読むため入力値と一致する（間接永続化確認）。
      await armNoteRestore(memo!); // 後始末: 元メモ値を退避（付帯表3）
      const value = `${MEMO_OK} ${Date.now()}`;
      await memo!.fillNoteAndRegister(value);
      await expect(page).toHaveURL(EDIT_RE);
      await expect(memo!.note).toHaveValue(value);
    });

    test("E2E-M05-16-012 メモ未入力でも登録できる(任意項目)", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const memo = await loginAndOpenOrderEdit(page);
      test.skip(memo === null, "受注が無く受注編集を開けない（要シード SEED-M05-16-ORDER）");
      // 仕様 業務ルール(未入力時)・バリデーション(任意): 必須制約なし＝空のまま保存できエラーで滞留しない。
      await armNoteRestore(memo!); // 後始末: 元メモ値を退避（付帯表3）
      await memo!.fillNote("");
      await memo!.submitRegister();
      await expect(page).toHaveURL(EDIT_RE);
      await expect(memo!.successFlash).toBeVisible();
    });

    test("E2E-M05-16-015 改行を含むメモを保存→再表示で改行を保持", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const memo = await loginAndOpenOrderEdit(page);
      test.skip(memo === null, "受注が無く受注編集を開けない（要シード SEED-M05-16-ORDER）");
      // 仕様 エッジケース(改行を含むメモ): 複数行テキストエリアのため改行を含めて保存・再表示する。
      await armNoteRestore(memo!); // 後始末: 元メモ値を退避（付帯表3）
      await memo!.fillNoteAndRegister(MEMO_MULTILINE);
      await expect(page).toHaveURL(EDIT_RE);
      await expect(memo!.note).toHaveValue(MEMO_MULTILINE);
    });

    // ===== 保留（自動化予定だが要実機/シード未整備。理由付きで未実行＝抜け漏れ可視化） =====

    test.fixme(
      "E2E-M05-16-013 最大長(3000文字)を入力して登録→エラーなく保存できる（境界内・正常。実数は環境設定依存=付帯表4#1要確認）",
      async () => {
        // 期待は仕様(入力項目 最大長3000・境界内は正常)由来。境界文字数は eccube_ltext_len 設定依存のため実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M05-16-014 最大長超過を入力して登録→検証エラーで保存されず編集画面に留まる（異常系）",
      async () => {
        // 期待は仕様(エラー処理 最大長超過はエラー・保存しない・同一画面再表示)由来。
        // OrderType note は Length(max) のみでメッセージ未指定＝Symfony既定文言。エラー表示位置(インライン/上部alert)が
        // 要実機確認のため(付帯表4#2)、エラー要素セレクタを実機確認後に確定して実装する。
        // 注: 検証失敗も成功リダイレクトも最終URLは EDIT_RE に一致し得るためURLのみでは「滞留」を判定できない。
        //     「保存しない・滞留」は (a) 成功フラッシュが出ない (b) エラー要素が出る (c) 退避した保存前値が不変、の複合で判定する。
        // 例: const before = await memo.noteValue(); await memo.fillNoteAndRegister(MEMO_OVER);
        //     await expect(memo.successFlash).toHaveCount(0); await expect(error要素).toBeVisible();
      }
    );

    test.fixme(
      "E2E-M05-16-016 検証失敗(超過)時に入力したメモが再表示される（エラーパス再表示）",
      async () => {
        // 期待は仕様(失敗時出力 入力したメモを再表示)由来。014と同じくエラー表示位置の実機確認後に実装。
        // 例: await memo.fillNoteAndRegister(MEMO_OVER); await expect(memo.note).toHaveValue(MEMO_OVER);
      }
    );
  }
);
