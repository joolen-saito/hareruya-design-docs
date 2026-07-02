/**
 * 管理画面 受注管理 受注情報検索/一覧（M05-01）E2E。納品ケース表
 * integration_test/e2e/m05_01_admin_order_order_search_list_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、データ十分性・破壊的操作・要実機確認は test.fixme（理由付き）で残す。
 * 手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/pf-eccube3/m05-01_admin_order_order_search_list.md / 観点表)の挙動由来（オラクル独立性）。
 * i18n リソース(messages/validators.ja.yaml)の表示文言は実装由来のためオラクルにせず、観測挙動（一覧組立可否・遷移先URL）で判定する。
 * pf-eccube3 由来設計だが刷新先 ec-cube-enterprise に同一画面(admin_order)が実在するためE2E化した。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・two_factor_auth.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OrderOrderSearchListPage } from "../../../pages/admin/m05/m05_01_admin_order_order_search_list.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/order(\\?|$)`);
const ORDER_EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/order/\\d+/edit(\\?|$)`);
const PAGE_COUNT_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/order/page/1(\\?|$)`
);
// 検索パターン適用ルート（保存成功時のリダイレクト先）。名称空エラー時はここへ遷移しない＝非破壊の観測差。
const SEARCH_PATTERN_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/order/search/pattern`
);

// オラクル独立性: 表示文言の厳密一致は実装(i18n: validators.ja.yaml / messages.ja.yaml)由来のため
// 主オラクルにしない。設計書は「カナ正規表現で検証エラー」「名称空はエラーで admin_order へ」「検証失敗は
// 一覧領域を空メッセージ扱いで一覧を組み立てない」と挙動のみ規定する。よって各テストの主オラクルは
// 「一覧が組み立てられない=件数見出し(#search_total_count)が描画されない」「遷移先URL」という観測挙動に置く。
// 下記の想定描画文言は参考（実機確認用＝要確認）であり、テストの合否判定には用いない。
//   form_error.kana_only                      : 「カタカナで入力してください。」(validators.ja.yaml:38)
//   admin.common.search_invalid_condition     : 「検索条件に誤りがあります」(messages.ja.yaml:1541)
//   admin.order.save_pattern.error.name_empty : 「検索パターン名を入力して下さい」(messages.ja.yaml:5526)

/** 管理ログインして受注一覧を開く。 */
async function loginAndOpenList(page: Page): Promise<OrderOrderSearchListPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const list = new OrderOrderSearchListPage(page);
  await list.goto();
  return list;
}

test.describe(
  "管理画面 > 受注管理 > 受注情報検索/一覧",
  { tag: ["@admin", "@order"] },
  () => {
    // ===== 認証不要 =====

    test("E2E-M05-01-040 未ログインで受注一覧URL直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order`);
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可: 未ログインは管理ログインへ
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M05-01-041 存在しないpattern_idで検索パターン適用→HTTP404", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      // 仕様 エラー処理: 検索パターンID無効(適用時)は HTTP404（処理フロー 検索パターン適用#1）。
      const res = await page.goto(
        `/${ECCUBE_ADMIN_ROUTE}/order/search/pattern/99999999`
      );
      expect(res?.status()).toBe(404);
    });

    // ===== 初期表示（ログインのみ・データ不要） =====

    test("E2E-M05-01-001 受注一覧画面が開きページタイトル「受注一覧」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginAndOpenList(page);
      // 仕様 フロント挙動(表示要素): ページタイトルは受注一覧（trans admin.order.order_list）。
      await expect(page).toHaveURL(LIST_RE);
      await expect(page.locator("body")).toContainText("受注一覧");
    });

    test("E2E-M05-01-002 受注一覧画面にサブタイトル「受注管理」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginAndOpenList(page);
      // 仕様 フロント挙動(表示要素): サブタイトルは受注管理（trans admin.order.order_management）。
      await expect(page.locator("body")).toContainText("受注管理");
    });

    test("E2E-M05-01-003 基本検索フォーム部品（注文番号/注文者名/複合検索）と検索ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.seeSearchForm();
    });

    test("E2E-M05-01-004 検索条件クリアボタン押下で入力済みの検索条件が空に戻る", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様 フロント挙動(JS .search-clear): #search_form 内の .input_search 等の入力をクリアする。
      // 実装ではクリアボタンは詳細検索枠(#searchDetail collapse)内のため、開いてから可視確認する。
      await list.openDetailSearch();
      await expect(list.clearSearchBtn).toBeVisible();
      await list.orderNumber.fill("TEST-CLEAR-0001");
      await expect(list.orderNumber).toHaveValue("TEST-CLEAR-0001");
      await list.clearSearch();
      await expect(list.orderNumber).toHaveValue("");
    });

    test("E2E-M05-01-005 詳細検索トグル押下で詳細検索枠(#searchDetail)が開く", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様 フロント挙動(JS Bootstrap collapse): 詳細検索ボタンで折りたたみブロックが開く。
      await list.openDetailSearch();
      await expect(list.detailArea).toBeVisible();
    });

    test("E2E-M05-01-006 配送詳細トグル押下で配送詳細検索枠(#searchDetailDelivery)が開く", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.openDeliveryDetailSearch();
      await expect(list.deliveryArea).toBeVisible();
    });

    test("E2E-M05-01-007 詳細検索枠に対応状況チェック群が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.openDetailSearch();
      // 仕様 入力項目(対応状況 複数チェック): 詳細枠に対応状況チェック群が描画される。
      await expect(list.statusBlock).toBeVisible();
    });

    // ===== 検索 正常系 =====

    test("E2E-M05-01-010 既定条件で検索すると同一一覧URLで再描画され件数見出しが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様 画面遷移(検索成功POST): 同一一覧URL(admin_order)でテンプレート再描画＋件数見出し表示。
      await list.submitSearch();
      await expect(page).toHaveURL(LIST_RE);
      await list.seeResultCountHeading(); // trans admin.common.search_result
    });

    test("E2E-M05-01-011 resume=1で一覧へ戻るとセッション復元で一覧が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.submitSearch(); // 検索状態をセッションへ確立
      // 仕様 利用者視点の入口(resume): セッションの検索ビューデータ・ページ番号を復元して一覧表示。
      await list.gotoResume();
      await expect(page).toHaveURL(LIST_RE);
      await list.seeResultCountHeading();
    });

    test("E2E-M05-01-012 order_status_id指定の入口で一覧が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様 利用者視点の入口(ステータス件数リンク): order_status_id を初期データに載せ一覧表示。
      await list.gotoByStatusId(1);
      await expect(page).toHaveURL(LIST_RE);
      await list.seeResultCountHeading();
      // 仕様「ステータスIDが単一選択状態としてフォーム初期データに載る」を観測で確認する。
      // 対応状況チェック群(#admin_search_order_status)内で value=1 のチェックが選択済みであること。
      await list.openDetailSearch();
      await expect(
        list.statusBlock.locator('input[type="checkbox"][value="1"]')
      ).toBeChecked();
    });

    // ===== 検索 バリデーション（正常×異常の対・ログインのみで決定的） =====

    test("E2E-M05-01-020 注文者カナに非カナを入力して検索→検証エラーで一覧が組み立てられない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様 入力項目(注文者カナ カナ正規表現)＋画面遷移(検証失敗): 非カナは検証エラーとなり一覧を組み立てない。
      // 主オラクルは観測挙動（件数見出しが描画されない＝検索成立せず）。エラー文言は i18n由来のため判定に用いない（要確認）。
      await list.searchByKana("abc123");
      await expect(page).toHaveURL(LIST_RE);
      await expect(list.resultCount).toHaveCount(0); // #search_total_count 未描画＝一覧未組立
    });

    test("E2E-M05-01-021 注文者カナに正しいカナを入力して検索→カナ検証エラーが出ず検索が成立する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様 入力項目(注文者カナ)の正常対: 正しいカナは検証を通過し検索が成立する。
      // 主オラクルは観測挙動（件数見出しが描画される＝一覧が組み立てられた）。
      await list.searchByKana("ヤマダ");
      await expect(page).toHaveURL(LIST_RE);
      await list.seeResultCountHeading(); // 検索成立（一覧組立）
    });

    test("E2E-M05-01-022 配送先カナに非カナを入力して検索→検証エラーで一覧が組み立てられない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様 入力項目(配送先カナ カナ正規表現)＋画面遷移(検証失敗): 非カナは検証エラーとなり一覧を組み立てない。
      // 主オラクルは観測挙動（件数見出しが描画されない＝検索成立せず）。エラー文言は i18n由来のため判定に用いない（要確認）。
      await list.searchByShippingKana("abc123");
      await expect(page).toHaveURL(LIST_RE);
      await expect(list.resultCount).toHaveCount(0); // #search_total_count 未描画＝一覧未組立
    });

    test("E2E-M05-01-023 検索検証失敗時は同一URLで再描画され一覧が組み立てられない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様 画面遷移(検索検証失敗): 同一一覧URLで再描画され、一覧領域は空メッセージ扱いで一覧を組み立てない（has_errors）。
      // 主オラクルは観測挙動（件数見出しが描画されない＝一覧未組立）。空メッセージの厳密文言は i18n由来のため判定に用いない（要確認）。
      await list.searchByKana("abc123");
      await expect(page).toHaveURL(LIST_RE);
      await expect(list.resultCount).toHaveCount(0); // 検証失敗時は pagination 不在＝件数見出し未描画
    });

    // ===== 検索パターン保存（名称未入力＝非破壊） =====

    test("E2E-M05-01-030 検索パターン名未入力で保存→保存されずadmin_orderへ戻る(非破壊)", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様 処理フロー(検索パターン保存#2): 名称空はエラーで admin_order へ戻る（DB登録なし＝非破壊）。
      // 主オラクルは観測挙動（適用ルート admin_order_search_pattern へ遷移しない＝保存されていない）。
      // エラーフラッシュ文言は i18n由来のため判定に用いない（要確認）。
      await list.savePattern("");
      await expect(page).toHaveURL(LIST_RE);
      await expect(page).not.toHaveURL(SEARCH_PATTERN_RE);
    });

    test("E2E-M05-01-031 検索パターン名未入力で保存→受注一覧(admin_order)へ戻る", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様 画面遷移(検索パターン保存で名称空): admin_order へリダイレクト。
      await list.savePattern("");
      await expect(page).toHaveURL(LIST_RE);
    });

    // ===== 一覧操作・遷移（データ依存はガード） =====

    test("E2E-M05-01-050 並びアイコン押下で検索フォームが送信され一覧が再描画される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.submitSearch();
      const icons = await list.sortIcons.count();
      test.skip(icons === 0, "検索結果が0件で並びヘッダが描画されない（要シードデータ）");
      // 仕様 利用者視点の入口(並びアイコン): sortkey/sorttype 更新で #search_form 送信＝一覧再描画。
      // 基本機能確認のため、リポジトリ並びキーマップに存在するキー（orderer）を踏む。
      // data-sortkey=order_date 等のマップ未整合疑い（不具合候補#5）は別途 要確認/手動で検証する。
      await list.sortByKey("orderer");
      await expect(page).toHaveURL(LIST_RE);
      await list.seeResultCountHeading();
    });

    test("E2E-M05-01-060 表示件数プルダウン変更でページ件数指定URLへ遷移する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.submitSearch();
      const count = await list.pageCountPulldown.count();
      test.skip(count === 0, "検索結果が無く表示件数プルダウンが描画されない（要シード）");
      const options = await list.pageCountPulldown.locator("option").all();
      test.skip(options.length < 2, "表示件数の選択肢が複数無く別値へ変更できない");
      // 仕様 利用者視点の入口(表示件数変更): option値=path('admin_order_page',{page_no:1,page_count})。
      // 実装は change で window.location.href=option値へ遷移。遷移完了を待ってからURLを判定する。
      await Promise.all([
        page.waitForURL(PAGE_COUNT_RE),
        list.pageCountPulldown.selectOption({ index: options.length - 1 }),
      ]);
      await expect(page).toHaveURL(PAGE_COUNT_RE);
    });

    test("E2E-M05-01-070 受注日/注文番号リンク押下で受注編集画面へ遷移する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.submitSearch();
      const linkCount = await list.firstOrderEditLink.count();
      test.skip(linkCount === 0, "一覧に受注が無く編集リンクが描画されない（要シード）");
      // 仕様 利用者視点の入口(一覧リンク): 受注日/注文番号リンク→受注編集（admin_order_edit）。
      await list.firstOrderEditLink.click();
      await expect(page).toHaveURL(ORDER_EDIT_RE);
    });

    test("E2E-M05-01-071 一覧チェックボックス選択で一括操作ボタン群が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.submitSearch();
      const rows = await list.rowChecks.count();
      test.skip(rows === 0, "一覧に受注が無く行チェックボックスが描画されない（要シード）");
      // 仕様 フロント挙動(JS): チェック選択で一括ボタン表示を連動（btn-bulk-wrapper d-none 解除）。
      await list.rowChecks.first().check();
      await expect(list.bulkWrapper.first()).toBeVisible();
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M05-01-080 検索パターン保存成功→保存メッセージ＋admin_order_search_patternへ（破壊的: dtb_search_pattern作成）",
      async () => {
        // 期待は仕様(処理フロー 検索パターン保存#5)由来。DB登録を伴うため使い捨てパターン名＋後始末を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M05-01-081 保存済みパターン名クリックで復号条件が適用され一覧表示（要シード: dtb_search_pattern）",
      async () => {
        // 期待は仕様(処理フロー 検索パターン適用)由来。事前に display_key=order の保存済みパターン(SEED-M05-01-PATTERN)が必要。
      }
    );

    test.fixme(
      "E2E-M05-01-082 検索パターン削除成功→削除メッセージ＋admin_orderへ（要シード: 既存パターン＋pattern_id）",
      async () => {
        // 期待は仕様(処理フロー 検索パターン削除#2)由来。事前に保存済みパターンが必要。削除ボタンは pattern_id 設定時のみ描画。
      }
    );

    test.fixme(
      "E2E-M05-01-083 検索パターン件数取得XHRが count を返す（要シード/JSON応答・XHR）",
      async () => {
        // 期待は仕様(API/バッチ結果 count/pattern)由来。要保存済みパターン。JSON応答の件数厳密一致はDB依存で手動寄り。
      }
    );

    test.fixme(
      "E2E-M05-01-084 注文日時 開始>終了で日付範囲エラー（DateTimeType choice widget操作・描画文言 要実機: 不具合候補#1）",
      async () => {
        // 期待は仕様(エッジケース 日時範囲 終了<開始でフォームエラー)由来。
        // 実装は trans('admin.product.date_range_error')(SearchOrderType.php:363)を使うが当該キーは messages.ja.yaml 未定義。
        // 描画文言は要実機確認のうえ、検証失敗の空メッセージ(検索条件に誤りがあります)も併せて確認する。
      }
    );

    test.fixme(
      "E2E-M05-01-013 ページリンク /order/page/{n} でセッション検索状態を復元し指定ページ表示（要複数ページ分シード）",
      async () => {
        // 期待は仕様(処理フロー 通常一覧#5 セッション検索ビューデータ/ページ番号復元)由来。
        // 2ページ目以上の表示には複数ページ分の受注データ(SEED-M05-ORDERS 複数ページ)が必要。
      }
    );

    test.fixme(
      "E2E-M05-01-086 削除対象pattern_idが存在しない場合はエラーで admin_order へ戻り削除されない（要保存済みパターン非在状態）",
      async () => {
        // 期待は仕様(処理フロー 検索パターン削除#1 対象無しエラー)由来＝082削除成功の異常対。
        // 主オラクルは観測挙動（admin_order へ戻る＝適用ルートへ遷移しない・レコード非削除）。フラッシュ文言は i18n由来で判定外。
      }
    );

    test.fixme(
      "E2E-M05-01-087 存在しないpattern_idの件数取得XHRは件数を返さずエラー応答（要不存在pattern・XHR）",
      async () => {
        // 期待は仕様(エラー処理 件数API パターン無し失敗 / API/バッチ結果 count/pattern)由来＝083成功XHRの異常対。
        // 主オラクルは観測挙動（件数JSONが返らずエラー応答）。HTTPステータス等の厳密値は要実機確認。
      }
    );
  }
);
