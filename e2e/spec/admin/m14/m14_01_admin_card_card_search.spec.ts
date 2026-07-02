/**
 * 管理画面 カード管理 カード検索/一覧（M14-01）E2E。納品ケース表
 * integration_test/e2e/m14_01_admin_card_card_search_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、データ十分性・要実機確認・仕様乖離は test.fixme（理由付き）で残す。
 * 手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(設計 functions/pf-eccube3/m14-01_admin_card_card_search.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * 設計はpf-eccube3のリバース。刷新先 ec-cube-enterprise との乖離はケース表「不具合候補」を参照（テストは仕様どおりに書く）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts も @playwright/test を直接使う。本specも踏襲し、資格情報が無ければ
 * 走らないよう test.skip(!HAS_CREDS) でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *
 * 資格情報/シード（環境変数。コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（管理者・SEED-M14-01-ADMIN）
 *  - E2E_M14_CARD_KEYWORD（一覧に1件以上ヒットする既知の複合キーワード・SEED-M14-01-CARDS）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AdminCardCardSearchPage } from "../../../pages/admin/m14/m14_01_admin_card_card_search.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);
// 一覧に1件以上ヒットする既知のキーワード（SEED-M14-01-CARDS）。未設定なら全件検索にフォールバックせず skip。
const CARD_KEYWORD = process.env.E2E_M14_CARD_KEYWORD || "";

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/card(\\?|$)`);
const SEARCH_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/card/search/\\d+`);
const EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/card/\\d+/edit(\\?|$)`);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const NO_RESULT = "検索条件に合致するデータが見つかりませんでした"; // :1542
const CARD_MANAGEMENT = "カード管理"; // admin.product.card_management :3943（仕様: ページタイトル）

/** 管理ログインしてカード一覧を開く。 */
async function loginAndOpenList(page: Page): Promise<AdminCardCardSearchPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const list = new AdminCardCardSearchPage(page);
  await list.goto();
  return list;
}

test.describe(
  "管理画面 > カード管理 > カード検索/一覧",
  { tag: ["@admin", "@card"] },
  () => {
    // ===== 認証不要・非破壊 =====

    test("E2E-M14-01-060 未ログインでカード一覧URL直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/card`);
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可: 未ログインは管理ログインへ
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 初期表示（ログインのみ・データ不要） =====

    test("E2E-M14-01-001 初期表示: 検索フォームのみ表示・結果エリアなし", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M14-01-ADMIN 未設定（ECCUBE_ADMIN_USER/PASS）");
      const list = await loginAndOpenList(page);
      await expect(page).toHaveURL(LIST_RE);
      await list.seeSearchFormOnly(); // 検索フォーム表示・結果エリアなし（件数ゼロ相当）
    });

    test("E2E-M14-01-002 初期表示: 複合キーワード欄(placeholder)と検索ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M14-01-ADMIN 未設定");
      const list = await loginAndOpenList(page);
      await expect(list.multi).toBeVisible();
      await expect(list.multi).toHaveAttribute("placeholder", "カード名・テキスト"); // :3961
      await expect(list.searchButton).toBeVisible(); // 「検索」:1446
    });

    test("E2E-M14-01-003 初期表示: ページタイトル「カード管理」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M14-01-ADMIN 未設定");
      const list = await loginAndOpenList(page);
      await list.seeCardManagementTitle(); // 仕様: ページタイトル「カード管理」
    });

    test("E2E-M14-01-004 詳細検索トグルで色・マナコスト等の条件欄が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M14-01-ADMIN 未設定");
      const list = await loginAndOpenList(page);
      await list.openSearchDetail();
      await expect(list.searchDetail).toBeVisible();
      await expect(list.cmc).toBeVisible(); // マナ・コスト :3954
      await expect(list.colorArea).toBeVisible(); // 色 :3955
    });

    test("E2E-M14-01-005 サブタイトル行に新規登録・CSV取込・カード名リスト作成ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M14-01-ADMIN 未設定");
      const list = await loginAndOpenList(page);
      // 設計「フロント挙動/表示要素」: サブタイトル行の操作ボタン。各遷移先処理は別機能で表示のみ確認。
      await expect(list.newButton).toBeVisible();
      await expect(list.csvImportButton).toBeVisible();
      await expect(list.generateListButton).toBeVisible();
    });

    // ===== 検索（ログイン＋カードデータ） =====

    test("E2E-M14-01-010 複合キーワード検索: 一覧と件数見出しが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M14-01-ADMIN 未設定");
      test.skip(!CARD_KEYWORD, "E2E_M14_CARD_KEYWORD 未設定（SEED-M14-01-CARDS）");
      const list = await loginAndOpenList(page);
      await list.searchByKeyword(CARD_KEYWORD);
      await expect(list.resultCount).toBeVisible(); // 「検索結果：%count%件が該当しました」:1538
      await expect(list.resultRows.first()).toBeVisible(); // 1ページ目の一覧が返る
    });

    test("E2E-M14-01-011 該当しないキーワード検索: 該当なしメッセージが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M14-01-ADMIN 未設定");
      const list = await loginAndOpenList(page);
      // 通常存在し得ない長いランダム文字列で確実に0件にする（衝突回避）。
      await list.searchByKeyword("zzz_no_such_card_xyz_9f3k2");
      await expect(list.noResult).toBeVisible(); // :1542 該当レコードが取得結果に含まれない
    });

    test("E2E-M14-01-020 表示件数変更: 選択した件数で一覧が再表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M14-01-ADMIN 未設定");
      test.skip(!CARD_KEYWORD, "E2E_M14_CARD_KEYWORD 未設定（SEED-M14-01-CARDS）");
      const list = await loginAndOpenList(page);
      await list.searchByKeyword(CARD_KEYWORD);
      await expect(list.pageCountPulldown).toBeVisible();
      // 先頭以外の件数オプションを選ぶと page_count 付きURLへ遷移する（index.twig:367-374）。
      const optionUrl = await list.pageCountPulldown
        .locator("option")
        .last()
        .getAttribute("value");
      expect(optionUrl).toContain("page_count="); // 表示件数がURLに反映される（マスタ mtb_page_max 由来）
      await list.pageCountPulldown.selectOption({ index: 1 });
      await expect(page).toHaveURL(SEARCH_RE); // /card/search/1?page_count=… でセッション保存・再分割
    });

    test("E2E-M14-01-041 セッションなしで検索URLを直接GET→空フォームの一覧へフォールバック", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M14-01-ADMIN 未設定");
      // 期待は仕様(処理フロー#10・エッジケース「ブックマークGETでセッションなし→空フォームへフォールバック」)由来。
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const list = new AdminCardCardSearchPage(page);
      // 検索を実施せずに検索URLを直接GET（セッションに条件なし）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/card/search/1`);
      await list.seeSearchFormOnly(); // 復元不可→空フォーム一覧（件数見出し・該当なしのいずれも出さない＝初期表示相当）
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M14-01-030 一覧のカード名リンクからカード編集画面へ遷移する（要実機確認: 不具合候補#5）",
      async () => {
        // 期待は仕様(設計 利用者視点の入口:39／画面遷移:224「行のカード名またはID→カード編集 admin_card_edit」)由来。
        // 検索→list.cardNameLinks.first() を押下→EDIT_RE へ遷移を確認する（page.cardNameLinks は実装の編集アイコン
        // /edit を除外し、設計どおりカード名リンク GET /card/{id} を対象にする）。
        // 刷新先 index.twig:424 はカード名がプレーンテキスト＝非リンクのため当リンクが存在せず、テストは仕様乖離を検出する
        // （実装へ寄せない＝編集アイコン押下に置換しない）。実機で導線を確認後に実装する（不具合候補#5）。
      }
    );

    test.fixme(
      "E2E-M14-01-012 詳細条件(色)で絞り込み検索→一覧が返る（要: 色属性が分かる十分なカードデータ）",
      async () => {
        // 期待は仕様(判定順序#3 色の複数選択 AND)由来。#admin_search_card_color のチェック→検索→一覧。
        // 色ごとの該当件数が分かるシード(SEED-M14-01-CARDS)確定後に実装する。
      }
    );

    test.fixme(
      "E2E-M14-01-040 検索後にセッションへ条件保存→resume再表示で復元（要: 詳細条件込みの検索データ）",
      async () => {
        // 期待は仕様(処理フロー#10 セッション復元・データ整合性 検索条件の再現)由来。
        // 詳細条件込みで検索→/card/search/1?resume=1 で同一条件が復元されることを確認。シード確定後に実装。
      }
    );

    test.fixme(
      "E2E-M14-01-021 並び順変更: 1ページ目から該当順で一覧表示（要: ソートが観測できる十分なデータ＋順序検証）",
      async () => {
        // 期待は仕様(処理フロー#5,#11 並び順 c.id)由来。#sort_key_pulldown 変更→hidden反映→POST再描画。
        // 厳密な並び順検証は既知IDの並びを持つシード(SEED-M14-01-CARDS)確定後に実装する。
      }
    );

    test.fixme(
      "E2E-M14-01-022 ページリンクでNページ目→直前条件をセッション復元し表示（要: 複数ページ分のカードデータ）",
      async () => {
        // 期待は仕様(利用者視点の入口 GET /card/search/{page_no}・処理フロー#10 セッション復元)由来。
        // page_count を超えるカード件数のシード確定後に実装する。
      }
    );

    test.fixme(
      "E2E-M14-01-050 ソートorderが許容パターン外→エラー表示のうえ一覧初期化（要実機確認: 不具合候補#1/#2）",
      async () => {
        // 期待は仕様(処理フロー#7・エラー処理 admin.error.sort・画面遷移 admin_card_list)由来。
        // 刷新先は (1) trans キー admin.error.sort がロケール未定義、(2) SearchControllerTrait.php:144 が
        // index() を再帰呼び出しし無限ループ/500 の懸念があるため実機で挙動を確認後に実装する（ケース表 不具合候補#1/#2）。
      }
    );

    test.fixme(
      "E2E-M14-01-051 複合キーワード最大長(50)超過→仕様ではエラー（要実機確認: 不具合候補#3）",
      async () => {
        // 期待は仕様(バリデーション・入力項目 複合キーワード最大長50)由来。刷新先 SearchCardType.php:45-51 の
        // multi には Length 制約が無く、51文字でもエラーにならない可能性が高い（不具合候補#3）。テストは仕様どおり
        // 「エラー表示・処理未完了」を期待し、実機で乖離を確認する。
      }
    );

    test.fixme(
      "E2E-M14-01-013 複合キーワード複数トークン→トークン間ANDで両方含む行のみ（要シード）",
      async () => {
        // 期待は仕様(判定順序#1 トークンを空白・カンマで分割しトークン間AND・各列OR)由来。
        // 両トークンを含む行が既知のシード(SEED-M14-01-CARDS)確定後に実装する。
      }
    );

    test.fixme(
      "E2E-M14-01-014 詳細マスタ条件(レアリティ等)で絞り込み→非該当レコード除外（要シード）",
      async () => {
        // 期待は仕様(判定順序#2 各マスタ IN・カテゴリ間AND)由来。選択マスタ値に該当する行のみが返ることを確認。
        // 各マスタの該当/非該当が分かるシード(SEED-M14-01-CARDS)確定後に実装する。
      }
    );

    test.fixme(
      "E2E-M14-01-015 マナコスト範囲で絞り込み→範囲内のみ（要シード・要確認: 不具合候補#7）",
      async () => {
        // 期待は仕様(判定順序#4-5 cmc 下限以上・上限以下／入力項目 マナコスト下限/上限)由来。
        // 刷新先は cmc 単一入力で下限/上限の2項目を持たない（不具合候補#7）。テストは仕様どおり範囲絞り込みを期待。
      }
    );

    test.fixme(
      "E2E-M14-01-016 フォーマット+レガル表示チェックON/OFFで制限区分が変わる（要シード・要確認: 不具合候補#6）",
      async () => {
        // 期待は仕様(判定順序#6 OFFはレガル/レストリクションのみ・ONはバンも許容／入力項目 レガル表示チェック)由来。
        // 刷新先は restriction 多選択で legalFlg 単一チェックと項目構成が異なる（不具合候補#6）。
      }
    );

    test.fixme(
      "E2E-M14-01-042 マスタにない page_count→保存されず既定件数維持（要確認）",
      async () => {
        // 期待は仕様(処理フロー#9 page_count はマスタ一致時のみセッション保存。非該当は保存しない)由来。
        // セッション内部値の非保存は間接観測のため、ページ分割件数が既定/既存維持であることで確認する。
      }
    );

    test.fixme(
      "E2E-M14-01-070 CSRF保護無効→トークンなしPOSTでも検索成立（要実機確認: 不具合候補#8）",
      async () => {
        // 期待は仕様(入出力「検索フォームは CSRF 保護を明示的に無効」)由来。トークンなしPOSTでも拒否されず一覧が返る。
        // 刷新先 SearchCardType.php:210-213 は csrf_protection=true で乖離（不具合候補#8）。テストは仕様どおり成立を期待。
      }
    );
  }
);
