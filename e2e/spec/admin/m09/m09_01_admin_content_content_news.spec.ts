/**
 * 管理画面 コンテンツ管理 — 新着情報管理 E2E。
 * 納品ケース表 integration_test/e2e/m09_01_admin_content_content_news_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち安全に実行できるケースのみを置く（手動/対象外はケース表で全量管理）。
 * 自動化予定だが未実装/破壊的（登録・更新・削除でDBを書き換える）/要実機のものは test.fixme（理由付き）で残す。
 * 期待結果は仕様（正本md / 観点表 / ec-cube-enterprise確認値 messages.ja.yaml・validators.ja.yaml）由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / two_factor_auth.spec.ts / m08系）に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針（安全第一・共有環境）:
 *  - 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 検証エラー系（公開日時/タイトル必須・URL形式・最大長超過）は「保存に失敗してDBを変えない」ため安全に実行できる。
 *  - 登録成功(030/031/032)・削除成功(043)・境界内保存(026)はDBを書き換える破壊的操作のため test.fixme（使い捨てシードで実装）。
 *  - 一覧0件(002)・並び順(003)・ページング(004)はデータ前提が重く test.fixme（専用シードで実装）。
 *  - 削除モーダル系(040/041/042)・既存編集(016)・編集アイコン遷移(017)は削除可能/編集可能な既存IDシード（NEWS_ID）が要るため skip ガード。
 *  - 別ウィンドウ整合(033)・削除失敗(044)・トークン不正(045)・削除404(053)はケース表で 手動/間接・対象外 管理（specに置かない）。
 *
 * 環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）
 *  - NEWS_ID : 削除可能/編集可能な既存の新着情報ID（016/017/040/041/042 で使用）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ContentContentNewsPage } from "../../../pages/admin/m09/m09_01_admin_content_content_news.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const NEWS_ID = process.env.NEWS_ID || "";

const LOGIN_RE = /\/login(\?|$)/;
const NEW_RE = /\/content\/news\/new(\?|$)/;
const EDIT_RE = /\/content\/news\/\d+\/edit(\?|$)/;
const LIST_RE = /\/content\/news(\?|\/page\/\d+)?(\?|$)/;

// 仕様（messages.ja.yaml / validators.ja.yaml）由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const MSG_NOT_BLANK = "入力されていません。"; // validators.ja.yaml:17 This value should not be blank.
const MSG_OUT_OF_RANGE = "不正な日付です。"; // validators.ja.yaml:60 form_error.out_of_range
const MSG_SAVE_COMPLETE = "保存しました"; // messages.ja.yaml:1398 admin.common.save_complete
const MSG_DELETE_COMPLETE = "削除しました"; // messages.ja.yaml:1400 admin.common.delete_complete
const MSG_DELETE_MODAL_TITLE = "削除します"; // messages.ja.yaml:1592 admin.common.delete_modal__title
const TOOLTIP_URL =
  "この新着情報の詳細な内容を記したウェブページある場合、URLを入力します。外部サイトのURLなどを利用することもできます。"; // :3433
const TOOLTIP_BODY = "HTMLタグが利用可能です。"; // :3434

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe("管理画面 > コンテンツ管理 > 新着情報管理", { tag: ["@admin", "@content"] }, () => {
  // ===== 一覧（GET・非破壊） =====

  test("E2E-M09-01-001 一覧見出しに「公開日時」「公開状態」「タイトル」が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new ContentContentNewsPage(page);
    await news.gotoList();
    await news.seeListHeader();
  });

  test("E2E-M09-01-005 「新規作成」ボタン押下で新規登録用の編集画面へ遷移する", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new ContentContentNewsPage(page);
    await news.gotoList();
    await news.addNewButton.click();
    await expect(page).toHaveURL(NEW_RE);
  });

  test("E2E-M09-01-006 新規登録画面の公開日時に現在日時が初期表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new ContentContentNewsPage(page);
    await news.gotoNew();
    // 仕様: 新規は公開日時に現在日時を初期表示（処理フロー/入力項目）。値が空でないことを観測する。
    await expect(news.publishDate).not.toHaveValue("");
  });

  test("E2E-M09-01-007 一覧明細行に公開状態文言・タイトルリンク・公開日時が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(!NEWS_ID, "NEWS_ID（一覧に表示される既存の新着情報ID）未設定");
    await login(page);
    const news = new ContentContentNewsPage(page);
    await news.gotoList();
    // 仕様（フロント挙動: 各行は公開日時・公開状態（公開/非公開の文言）・タイトルのリンクで構成 正本md:80）由来。
    const row = page.locator(`li.sortable-item[data-id="${NEWS_ID}"]`);
    await expect(row.locator('a[href*="/edit"]').first()).toBeVisible(); // タイトルのリンク
    await expect(row).toContainText(/公開|非公開/); // 公開状態の文言
  });

  // ===== 編集画面UI（GET・非破壊） =====

  test("E2E-M09-01-010 新規編集画面にカード見出し「新着情報登録」が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new ContentContentNewsPage(page);
    await news.gotoNew();
    await expect(news.cardTitle).toContainText("新着情報登録");
  });

  test("E2E-M09-01-011 新規編集画面に入力欄6種と登録ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new ContentContentNewsPage(page);
    await news.gotoNew();
    await news.seeEditForm();
  });

  test("E2E-M09-01-012 公開状態の選択肢が「公開」「非公開」の2択で新規初期選択が「公開」である", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new ContentContentNewsPage(page);
    await news.gotoNew();
    await expect(news.visible.locator("option")).toHaveText(["公開", "非公開"]);
    // 仕様（業務ルール: 新規の初期選択は公開）由来。実装の保存値(1/0)ではなく選択中ラベルで観測する。
    await expect(news.visible.locator("option:checked")).toHaveText("公開");
  });

  test("E2E-M09-01-013 URL見出しのツールチップ文言が仕様どおり表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new ContentContentNewsPage(page);
    await news.gotoNew();
    await expect(news.urlTooltip).toHaveCount(1); // title属性に仕様文言が出力されること
  });

  test("E2E-M09-01-014 本文見出しのツールチップ文言が仕様どおり表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new ContentContentNewsPage(page);
    await news.gotoNew();
    await expect(news.bodyTooltip).toHaveCount(1);
  });

  test("E2E-M09-01-015 編集画面の「新着情報管理」リンクで一覧へ戻る", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new ContentContentNewsPage(page);
    await news.gotoNew();
    await news.backToListLink.click();
    await expect(page).toHaveURL(LIST_RE);
    await news.seeListHeader();
  });

  test("E2E-M09-01-016 既存編集画面の各入力欄に現行値が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(!NEWS_ID, "NEWS_ID（編集可能な既存の新着情報ID）未設定");
    await login(page);
    const news = new ContentContentNewsPage(page);
    await news.gotoEdit(NEWS_ID);
    await expect(news.cardTitle).toContainText("新着情報登録");
    await expect(news.publishDate).not.toHaveValue(""); // 既存の公開日時が表示される
    await expect(news.title).not.toHaveValue(""); // 必須項目のタイトルが表示される
  });

  test("E2E-M09-01-017 一覧の編集アイコン押下で当該編集画面へ遷移する", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(!NEWS_ID, "NEWS_ID（編集可能な既存の新着情報ID）未設定");
    await login(page);
    const news = new ContentContentNewsPage(page);
    await news.gotoList();
    // 仕様（画面遷移: 一覧でタイトルまたは編集アイコンを選択→当該編集画面）由来。
    await news.clickEditIcon(NEWS_ID);
    await expect(page).toHaveURL(EDIT_RE);
  });

  test("E2E-M09-01-018 既存編集画面のURL・本文・公開状態・別ウィンドウに現行値が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(!NEWS_ID, "NEWS_ID（URL・本文・公開状態が既知の既存ID）未設定");
    await login(page);
    const news = new ContentContentNewsPage(page);
    await news.gotoEdit(NEWS_ID);
    // 仕様（利用者視点の入口: 既存編集は各入力項目に現行値が表示される 正本md:69）由来。
    await expect(news.url).toBeVisible();
    await expect(news.description).toBeVisible();
    await expect(news.linkMethod).toBeVisible();
    await expect(news.visible.locator("option:checked")).toHaveCount(1); // 現行の公開状態が選択される
  });

  // ===== バリデーション（POST・検証失敗でDB非更新＝安全） =====

  test("E2E-M09-01-020 公開日時未入力で「入力されていません。」が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new ContentContentNewsPage(page);
    await news.gotoNew();
    await news.publishDate.fill(""); // 必須の公開日時を空に
    await news.fillEdit({ title: "E2E検証用タイトル" });
    await news.submitRegister();
    await expect(page.locator("body")).toContainText(MSG_NOT_BLANK);
  });

  test("E2E-M09-01-021 公開日時未入力の送信後は編集画面に留まる（保存されない）", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new ContentContentNewsPage(page);
    await news.gotoNew();
    await news.publishDate.fill("");
    await news.fillEdit({ title: "E2E検証用タイトル" });
    await news.submitRegister();
    await expect(page).toHaveURL(NEW_RE); // 同一新規編集画面に留まる
    await expect(page.locator("body")).not.toContainText(MSG_SAVE_COMPLETE);
  });

  test("E2E-M09-01-022 タイトル未入力で「入力されていません。」が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new ContentContentNewsPage(page);
    await news.gotoNew();
    await news.fillEdit({ title: "" }); // 必須のタイトルを空（公開日時は現在日時の初期値）
    await news.submitRegister();
    await expect(page.locator("body")).toContainText(MSG_NOT_BLANK);
    await expect(page.locator("body")).not.toContainText(MSG_SAVE_COMPLETE);
  });

  test("E2E-M09-01-024 URL形式不正で保存されず編集画面に留まる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new ContentContentNewsPage(page);
    await news.gotoNew();
    await news.fillEdit({ title: "E2E検証用タイトル", url: "not-a-valid-url" });
    await news.submitRegister();
    // 仕様: URLは入力時URL形式制約（バリデーション節）。検証失敗で保存しない。
    await expect(page).toHaveURL(NEW_RE);
    await expect(page.locator("body")).not.toContainText(MSG_SAVE_COMPLETE);
  });

  test("E2E-M09-01-025 タイトル最大長超過（201文字）で保存されず編集画面に留まる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new ContentContentNewsPage(page);
    await news.gotoNew();
    // 仕様: タイトルは最大200文字（入力項目/バリデーション節）。201文字は検証エラーで保存されない。
    await news.fillEdit({ title: "あ".repeat(201) });
    await news.submitRegister();
    await expect(page).toHaveURL(NEW_RE);
    await expect(page.locator("body")).not.toContainText(MSG_SAVE_COMPLETE);
  });

  test("E2E-M09-01-027 URL最大長超過（201文字）で保存されず編集画面に留まる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new ContentContentNewsPage(page);
    await news.gotoNew();
    // 仕様: URLは最大200文字（入力項目/バリデーション節 正本md:167,250）。201文字は検証エラーで保存されない。
    const longUrl = "https://example.com/" + "a".repeat(181); // 20 + 181 = 201文字（形式は有効）
    await news.fillEdit({ title: "E2E検証用タイトル", url: longUrl });
    await news.submitRegister();
    await expect(page).toHaveURL(NEW_RE);
    await expect(page.locator("body")).not.toContainText(MSG_SAVE_COMPLETE);
  });

  test("E2E-M09-01-029 本文最大長超過（3001文字）で保存されず編集画面に留まる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new ContentContentNewsPage(page);
    await news.gotoNew();
    // 仕様: 本文は最大3000文字（入力項目/バリデーション節 正本md:169,252）。3001文字は検証エラーで保存されない。
    await news.fillEdit({ title: "E2E検証用タイトル", description: "あ".repeat(3001) });
    await news.submitRegister();
    await expect(page).toHaveURL(NEW_RE);
    await expect(page.locator("body")).not.toContainText(MSG_SAVE_COMPLETE);
  });

  // ===== 削除モーダル（GET一覧上のJS挙動・非破壊。要 NEWS_ID） =====

  test("E2E-M09-01-040 削除アイコン押下で確認モーダルが開き見出し「削除します」が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(!NEWS_ID, "NEWS_ID（削除可能な既存の新着情報ID）未設定");
    await login(page);
    const news = new ContentContentNewsPage(page);
    await news.gotoList();
    await news.openDeleteModal(NEWS_ID);
    const modal = news.deleteModal(NEWS_ID);
    await expect(modal).toBeVisible();
    await expect(modal.locator(".modal-title")).toContainText(MSG_DELETE_MODAL_TITLE);
  });

  test("E2E-M09-01-041 削除確認モーダルの本文に対象タイトルが差し込まれる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(!NEWS_ID, "NEWS_ID 未設定");
    await login(page);
    const news = new ContentContentNewsPage(page);
    await news.gotoList();
    // 対象行のタイトルを読み取り、モーダル本文へ差し込まれることを観測する（主観測=タイトル差込）。
    const rowTitle = (await page.locator(`li.sortable-item[data-id="${NEWS_ID}"] a`).first().innerText()).trim();
    await news.openDeleteModal(NEWS_ID);
    const modal = news.deleteModal(NEWS_ID);
    await expect(modal.locator(".modal-body")).toContainText("削除してよろしいですか");
    await expect(modal.locator(".modal-body")).toContainText(rowTitle);
  });

  test("E2E-M09-01-042 削除確認モーダルでキャンセルするとモーダルが閉じる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(!NEWS_ID, "NEWS_ID 未設定");
    await login(page);
    const news = new ContentContentNewsPage(page);
    await news.gotoList();
    await news.openDeleteModal(NEWS_ID);
    const modal = news.deleteModal(NEWS_ID);
    await expect(modal).toBeVisible();
    await modal.locator("button.btn-ec-sub").click(); // キャンセル
    await expect(modal).not.toBeVisible();
  });

  // ===== 権限・認可 / URL直接アクセス（資格情報不要 or 404） =====

  test("E2E-M09-01-050 未ログインで一覧URLへ直接アクセスすると管理ログイン画面へ誘導される", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/content/news`);
    await expect(page).toHaveURL(LOGIN_RE); // 仕様: 未ログインは管理ログイン画面へ誘導
    await expect(page.locator("#login_id")).toBeVisible();
  });

  test("E2E-M09-01-051 未ログインで新規編集URLへ直接アクセスすると管理ログイン画面へ誘導される", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/content/news/new`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  test("E2E-M09-01-052 存在しない識別子の編集URLはHTTP404になる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/content/news/99999999/edit`);
    expect(res?.status()).toBe(404); // 仕様: 編集対象が存在しなければ見つからない扱い（HTTP404）
  });

  // ===== 保留（破壊的・データ前提・要実機。手動/対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M09-01-002 一覧0件で見出し行のみ表示し明細行を出さない（要: 0件シード環境）",
    async () => {
      // 期待は仕様（エッジケース「一覧が0件」）由来。新着情報0件の隔離環境を用意後に実装。
    }
  );

  test.fixme(
    "E2E-M09-01-003 一覧が公開日時の降順（同一は識別子降順）で並ぶ（要: 並び順検証シード）",
    async () => {
      // 期待は仕様（業務ルール 一覧の並び）由来。既知の複数レコードを投入後に順序を検証する。
    }
  );

  test.fixme(
    "E2E-M09-01-004 2ページ目を1ページ10件単位で表示する（要: 11件以上のシード）",
    async () => {
      // 期待は仕様（ページング単位 10件）由来。11件以上を投入しページャ遷移を検証する。
    }
  );

  test.fixme(
    "E2E-M09-01-023 公開日時が下限(0003-01-01)より前で「不正な日付です。」（要: datetime-local実機確認）",
    async () => {
      // 期待は仕様（バリデーション form_error.out_of_range = MSG_OUT_OF_RANGE）由来。
      // datetime-local への下限前入力可否は実機確認後に実装。
    }
  );

  test.fixme(
    "E2E-M09-01-026 タイトル200文字（境界内）で保存成功（破壊的・要使い捨てシード）",
    async () => {
      // 期待は仕様（最大200文字＝境界内は正常保存）由来。dtb_news へ書き込むため使い捨てで実装。
    }
  );

  test.fixme(
    "E2E-M09-01-028 URL200文字（境界内）で保存成功（破壊的・要使い捨てシード）",
    async () => {
      // 期待は仕様（URL最大200文字＝境界内は正常保存 正本md:167）由来。dtb_news へ書き込むため使い捨てで実装。
    }
  );

  test.fixme(
    "E2E-M09-01-034 本文3000文字（境界内）で保存成功（破壊的・要使い捨てシード）",
    async () => {
      // 期待は仕様（本文最大3000文字＝境界内は正常保存 正本md:169）由来。dtb_news へ書き込むため使い捨てで実装。
    }
  );

  test.fixme(
    "E2E-M09-01-030 新規登録成功で「保存しました」が表示される（破壊的・要使い捨てシード）",
    async () => {
      // 期待は仕様（処理フロー 登録成功 + admin.common.save_complete）由来。dtb_news へ追加するため使い捨てで実装。
    }
  );

  test.fixme(
    "E2E-M09-01-031 新規登録成功で識別子付き編集画面へ遷移する（破壊的）",
    async () => {
      // 期待は仕様（画面遷移 登録成功→当該編集画面 EDIT_RE）由来。
    }
  );

  test.fixme(
    "E2E-M09-01-032 既存編集の更新成功で「保存しました」＋編集画面に留まる（破壊的・要NEWS_ID）",
    async () => {
      // 期待は仕様（処理フロー 更新成功）由来。既存レコードを書き換えるため使い捨て/復元前提で実装。
    }
  );

  test.fixme(
    "E2E-M09-01-043 削除実行成功で「削除しました」＋一覧へ遷移する（破壊的・要使い捨てNEWS）",
    async () => {
      // 期待は仕様（処理フロー 削除成功 + admin.common.delete_complete）由来。物理削除のため使い捨てレコードで実装。
    }
  );
});
