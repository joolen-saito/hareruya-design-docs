/**
 * 管理画面 受注管理 店頭注文番号札管理（M05-27）E2E。納品ケース表
 * integration_test/e2e/m05_27_admin_order_order_waiting_tag_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、自動化予定だが未実装/要実機（店名プルダウン切替・店舗別ボタン表示）は
 * test.fixme（理由付き）で残す。手動/対象外（ログ抑止・DB検索観点・フロント連携・削除例外再現等）は
 * ケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/pf-eccube3/m05-27_admin_order_order_waiting_tag.md / 観点表 /
 * messages.ja.yaml)由来（オラクル独立性）。実装の現挙動・Form制約値(Length/NotBlank/Regex)・POM見出しを期待値へ流用しない。
 * 本機能はカスタマイズで、画面挙動は現行(pf-eccube3)踏襲・永続化は ec-cube-enterprise を正典とする。
 * 刷新先 ec-cube-enterprise に該当画面(admin_order_waiting_tag /order/waiting_tag)が実在し、セレクタを導出できた。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・m05_16 も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報が無ければ走らないよう test.skip でガードする（ECCUBE_ADMIN_USER/PASS）。
 *
 * データ汚染の注意（後始末は未着手）:
 *  010/011/030/040 は dtb_waiting_tag を INSERT/DELETE する破壊系。札文字列は英字のみ・最大10文字制約のため、
 *  本specは実行毎に英字ランダム接頭辞 `E2e` + ランダム英字でユニーク値を作り、登録→（040は）削除して原状回復に努める。
 *  恒久対応として専用シード SEED-M05-27-TAG / 撤去（接頭辞 E2e で識別）はケース表 付帯表3 を正とする。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OrderOrderWaitingTagPage } from "../../../pages/admin/m05/m05_27_admin_order_order_waiting_tag.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/order/waiting_tag(\\?|$)`);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const TITLE = "店頭注文番号札管理"; // :5484 admin.order.waiting_tag.title
const SUB_TITLE = "受注管理"; // :2254 admin.order.order_management（サブタイトル）
const LIST_HEADER = "注文番号札"; // :5485 admin.order.waiting_tag.list
const REGISTER_COMPLETE = "登録が完了しました。"; // :1773 admin.register.complete
const REGISTER_FAILED = "登録できませんでした。"; // :1774 admin.register.failed
const ALREADY_EXISTS = "同一店頭注文番号札が存在しています"; // :5488 admin.order.waiting_tag.already_exists
const REGEX_ERROR = "半角英字のみで入力してください"; // :5487 admin.order.waiting_tag.regex_error

/** 英字のみ・指定長（既定10）のユニークな札文字列を作る（接頭辞 E2e で撤去識別）。 */
function uniqueTag(len = 10): string {
  const a = "abcdefghijklmnopqrstuvwxyz";
  let s = "E2e"; // 撤去識別用の英字接頭辞
  while (s.length < len) s += a[Math.floor(Math.random() * a.length)];
  return s.slice(0, len);
}

// 破壊系(INSERT)で登録した札を afterEach で best-effort 撤去し原状回復する（後始末）。
const createdTags: string[] = [];

/** 管理ログインして店頭注文番号札管理画面を開く。 */
async function loginAndGoto(page: Page): Promise<OrderOrderWaitingTagPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const wt = new OrderOrderWaitingTagPage(page);
  await wt.goto();
  return wt;
}

test.describe(
  "管理画面 > 受注管理 > 店頭注文番号札管理",
  { tag: ["@admin", "@order"] },
  () => {
    // 破壊系で登録した札を best-effort で撤去し原状回復する（共有環境汚染・再実行失敗の防止）。
    test.afterEach(async ({ page }) => {
      if (!HAS_CREDS || createdTags.length === 0) return;
      const wt = new OrderOrderWaitingTagPage(page);
      try {
        await wt.goto();
        for (const tag of createdTags.splice(0)) {
          if (await wt.rowByTag(tag).count()) await wt.deleteTag(tag);
        }
      } catch {
        createdTags.splice(0); // best-effort（削除失敗は撤去をシード側に委ねる）
      }
    });

    // ===== 権限・認可（認証不要・非破壊） =====

    test("E2E-M05-27-050 未ログインで一覧URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      // 仕様 権限・認可: 本パスは管理画面ルート配下＝未認証は管理ログインへ寄せられる。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order/waiting_tag`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M05-27-051 未ログインで登録POST(/new)→管理ログイン画面へ誘導", async ({ page }) => {
      // 仕様 権限・認可/利用者視点の入口: 登録入口は POST /order/waiting_tag/new（GETでは到達せずメソッド不一致）。
      // 実メソッド(POST)で未認証ガード（ファイアウォール→管理ログイン誘導）を検証する。GETプローブはルートのメソッド不一致を見るだけで仕様検証にならない。
      const res = await page.request.post(`/${ECCUBE_ADMIN_ROUTE}/order/waiting_tag/new`, {
        failOnStatusCode: false,
      });
      expect(res.url()).toMatch(LOGIN_RE); // 302→ログインを辿った最終URL
    });

    test("E2E-M05-27-052 未ログインで削除DELETE→管理ログイン画面へ誘導", async ({ page }) => {
      // 仕様 権限・認可: DELETE /order/waiting_tag/{id}/delete も管理側＝未認証はファイアウォールでログインへ寄せられる。
      // {id} は正の整数（ルート要件 \d+）。実在不要（認証ガードは行解決前に発火）。
      const res = await page.request.delete(`/${ECCUBE_ADMIN_ROUTE}/order/waiting_tag/1/delete`, {
        failOnStatusCode: false,
      });
      expect(res.url()).toMatch(LOGIN_RE);
    });

    test("E2E-M05-27-053 未ログインで店名切替POST(/order/waiting_tag)→管理ログイン画面へ誘導", async ({ page }) => {
      // 仕様 権限・認可/利用者視点の入口: 店名プルダウン変更の送信先 POST /order/waiting_tag も管理側＝未認証はファイアウォールでログインへ寄せられる。
      const res = await page.request.post(`/${ECCUBE_ADMIN_ROUTE}/order/waiting_tag`, {
        failOnStatusCode: false,
      });
      expect(res.url()).toMatch(LOGIN_RE);
    });

    // ===== 表示（一覧・新規フォーム GET） =====

    test("E2E-M05-27-001 一覧と新規登録フォームが表示されページタイトルが「店頭注文番号札管理」", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const wt = await loginAndGoto(page);
      // 仕様 利用者視点の入口/フロント挙動(表示要素): GET で一覧と新規登録フォームを表示し、タイトルは waiting_tag.title。
      await expect(page).toHaveURL(LIST_RE);
      await expect(page.locator("body")).toContainText(TITLE);
      await expect(wt.newForm).toBeVisible();
    });

    test("E2E-M05-27-002 新規登録カード・店名プルダウン・店頭注文番号札入力欄・登録ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const wt = await loginAndGoto(page);
      // 仕様 フロント挙動(表示要素)/入力項目: 新規枠に店名・店頭注文番号札・登録ボタン（ログイン店舗選択時）を表示。
      await wt.seeNewForm();
    });

    test("E2E-M05-27-003 一覧見出しに「注文番号札」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const wt = await loginAndGoto(page);
      // 仕様 フロント挙動(表示要素): 一覧見出しは admin.order.waiting_tag.list=「注文番号札」。
      await expect(wt.listHeader).toBeVisible();
      await expect(wt.listHeader).toContainText(LIST_HEADER);
    });

    test("E2E-M05-27-004 「確認」が別タブ(target=_blank)で店頭表示URLを開くリンクである", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const wt = await loginAndGoto(page);
      // 仕様 利用者視点の入口(確認ボタン別タブ): 確認は target=_blank の店頭確認用リンク。href は /{store}/waiting_number を組み立てる。
      await expect(wt.confirmLink).toHaveAttribute("target", "_blank");
      await expect(wt.confirmLink).toHaveAttribute("href", /\/waiting_number$/);
    });

    test("E2E-M05-27-005 削除確認モーダル(#DeleteModal)が画面に存在する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const wt = await loginAndGoto(page);
      // 仕様 フロント挙動(モーダル): Bootstrap 系の削除確認モーダルを持つ。
      await expect(wt.deleteModal).toHaveCount(1);
    });

    test("E2E-M05-27-006 初期GETでサブタイトルに「受注管理」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const wt = await loginAndGoto(page);
      // 仕様 フロント挙動(表示要素): サブタイトルは admin.order.order_management=「受注管理」。
      await expect(wt.subTitle).toContainText(SUB_TITLE);
    });

    // ===== 登録（POST /new。dtb_waiting_tag を INSERT する破壊系） =====

    test("E2E-M05-27-010 有効な英字を登録→成功フラッシュ「登録が完了しました。」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const wt = await loginAndGoto(page);
      // 仕様 処理フロー(登録成功)/エラー処理: 検証成功時は admin.register.complete を成功フラッシュに積み一覧へリダイレクト。
      const tag = uniqueTag();
      createdTags.push(tag);
      await wt.fillAndRegister(tag);
      await expect(page).toHaveURL(LIST_RE);
      await expect(page.locator("body")).toContainText(REGISTER_COMPLETE);
    });

    test("E2E-M05-27-011 登録成功後に一覧へ登録した札が表示される(間接永続化)", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const wt = await loginAndGoto(page);
      // 仕様 副作用(INSERT)/データ整合性: 登録した札は選択店舗の一覧行として表示される（間接の永続化確認）。
      const tag = uniqueTag();
      createdTags.push(tag);
      await wt.fillAndRegister(tag);
      await expect(page).toHaveURL(LIST_RE);
      await expect(wt.rowByTag(tag)).toBeVisible();
    });

    test("E2E-M05-27-012 最大長10文字の英字を登録→エラーなく登録できる(境界内・正常)", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const wt = await loginAndGoto(page);
      // 仕様 入力項目(最大長10・英字): 境界値=ちょうど10文字の英字は正常登録できる。
      // 毎回ユニークな英字10文字を生成（固定値だと初回以降に重複030へ化けるため・べき等）。
      const tag = uniqueTag(10);
      createdTags.push(tag);
      await wt.fillAndRegister(tag);
      await expect(page).toHaveURL(LIST_RE);
      await expect(page.locator("body")).toContainText(REGISTER_COMPLETE);
    });

    // ===== 登録のエラーパス（同一画面に留まり登録されない） =====

    test("E2E-M05-27-020 店頭注文番号札 未入力で登録→エラーフラッシュ「登録できませんでした。」で滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const wt = await loginAndGoto(page);
      // 仕様 バリデーション(必須)/エラー処理: 未送信・検証失敗時は admin.register.failed を積み同一画面を描画（リダイレクトしない）。
      // サーバ側の必須(NotBlank)を観測するため、HTML5 のクライアント検証(required)を外して送信を到達させる。
      await wt.newForm.evaluate((f) => ((f as HTMLFormElement).noValidate = true));
      await wt.fillAndRegister("");
      await expect(page.locator("body")).toContainText(REGISTER_FAILED);
      await expect(page).not.toHaveURL(LIST_RE); // 一覧へリダイレクトせず同一画面に留まる
    });

    test("E2E-M05-27-021 数字のみを登録→正規表現エラー「半角英字のみで入力してください」で滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const wt = await loginAndGoto(page);
      // 仕様 入力項目(正規表現 /^[a-zA-Z]+$/・数字不可)/エラー処理: 数字のみは regex_error で検証失敗。
      await wt.fillAndRegister("123456");
      await expect(page.locator("body")).toContainText(REGEX_ERROR);
      await expect(page).not.toHaveURL(LIST_RE); // 登録されず同一画面に留まる
    });

    test("E2E-M05-27-022 記号混入を登録→正規表現エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const wt = await loginAndGoto(page);
      // 仕様 入力項目(英字のみ)/エッジケース(記号混入): 記号混入は regex_error で検証失敗。
      await wt.fillAndRegister("abc-de");
      await expect(page.locator("body")).toContainText(REGEX_ERROR);
      await expect(page).not.toHaveURL(LIST_RE); // 登録されず同一画面に留まる
    });

    test("E2E-M05-27-023 11文字以上の英字を登録→文字列長エラーで登録されず滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const wt = await loginAndGoto(page);
      // 仕様 入力項目(最大長10)/エッジケース(11文字以上): Length で不正＝同一画面に留まり登録されない。
      // 既定 Length 文言は実装(validators)由来のためオラクル化せず、失敗フラッシュ＋滞留で判定（付帯表4#2）。
      const tag = "Abcdefghijk"; // 11文字英字
      await wt.fillAndRegister(tag);
      await expect(page.locator("body")).toContainText(REGISTER_FAILED);
      await expect(page).not.toHaveURL(LIST_RE); // 登録されず同一画面に留まる
      await expect(wt.rowByTag(tag)).toHaveCount(0);
    });

    test("E2E-M05-27-030 既存と同一の札を再登録→例外フラッシュ「同一店頭注文番号札が存在しています」で滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const wt = await loginAndGoto(page);
      // 仕様 業務ルール(登録可否)/処理フロー(重複例外): waiting_tag 文字列が既存なら already_exists 例外を積み同一画面を描画。
      const tag = uniqueTag();
      createdTags.push(tag); // 1回目で登録された行を後始末対象に
      await wt.fillAndRegister(tag); // 1回目（成功）
      await expect(page).toHaveURL(LIST_RE);
      await wt.fillAndRegister(tag); // 2回目（重複）
      await expect(page.locator("body")).toContainText(ALREADY_EXISTS);
      await expect(page).not.toHaveURL(LIST_RE); // 重複は登録されず同一画面に留まる
    });

    // ===== 削除（DELETE。dtb_waiting_tag を DELETE する破壊系） =====

    test("E2E-M05-27-040 削除モーダル確定→一覧へリダイレクトし対象の札が一覧から消える", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const wt = await loginAndGoto(page);
      // 仕様 処理フロー(削除)/画面遷移: 削除後は成否にかかわらず一覧へリダイレクト。成功時は対象行が一覧から消える。
      const tag = uniqueTag();
      await wt.fillAndRegister(tag); // 削除対象を用意
      await expect(wt.rowByTag(tag)).toBeVisible();
      await wt.deleteTag(tag);
      await expect(page).toHaveURL(LIST_RE);
      await expect(wt.rowByTag(tag)).toHaveCount(0);
      // 仕様 エラー処理: 削除成功の専用フラッシュはコントローラにない＝登録完了フラッシュ等の成功通知が出ないこと。
      await expect(page.locator("body")).not.toContainText(REGISTER_COMPLETE);
    });

    // ===== 保留（自動化予定だが複数店舗シード/要実機。理由付きで未実行＝抜け漏れ可視化） =====

    test.fixme(
      "E2E-M05-27-060 店名プルダウン変更で一覧が付け替わり登録されない（要: 複数店舗シード SEED-M05-27-MULTI-STORE）",
      async () => {
        // 期待は仕様(処理フロー POST店名切替・DB登録しない)由来。単一店舗環境では切替を観測できないため複数店舗シード投入後に実装。
      }
    );

    test.fixme(
      "E2E-M05-27-061 ログイン店舗以外を選択中は「登録」「削除」ボタンが非表示（要: 複数店舗シード）",
      async () => {
        // 期待は仕様(権限・認可 テンプレートの BaseInfo.id 比較)由来。複数店舗と他店所属の札が必要なため実機シード後に実装。
      }
    );

    test.fixme(
      "E2E-M05-27-062 別店舗が同一の店頭注文番号札を保持→登録拒否（要: 複数店舗シード SEED-M05-27-MULTI-STORE）",
      async () => {
        // 期待は仕様(エッジケース 別店舗が同一札を保持→already_exists で登録拒否・正本md 業務ルール/処理フロー手順4)由来。
        // 重複チェックは waiting_tag 単独(base_info_id を条件に含めない=店舗横断)。030 は同一店舗の二重登録のみで
        // 「別店舗保持」は検証できないため、他店所属の札を持つ複数店舗シード投入後に実装する。
      }
    );
  }
);
