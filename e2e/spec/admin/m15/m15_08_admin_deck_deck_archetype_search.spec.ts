/**
 * 管理画面 デッキ管理 > デッキ一覧（アーキタイプ検索条件）E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m15_08_admin_deck_deck_archetype_search_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち非破壊で安全に実行できる表示・検索・遷移・未認証ガードを test() で実装し、
 * 既知アーキタイプ/デッキのシード（SEED-M15-08-DECKSET）に依存する検索条件・ページング・並べ替え・ラベル確認、
 * および刷新先未実装の連動無効化（付帯表4#1）・選択肢ラベル乖離（付帯表4#2）・非存在ID注入は
 * test.fixme（理由付き）で残す。手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 *
 * 期待結果は仕様（pf-eccube3 正本 m15-08_admin_deck_deck_archetype_search.md／観点表）由来（オラクル独立性）。
 * 設計源は pf-eccube3（HareruyaEc プラグイン）、刷新先 ec-cube-enterprise ではコア標準機能。乖離（deck-search.js連動の欠落・
 * 選択肢ラベルの日本語名のみ・検索POST先URL・order不正エラーパスのUI消失・CSRF設定の逆転）はケース表「付帯表4」に出し、
 * テストは仕様どおりに書く（実装が違えば落ちて検出する）。ec-cube-enterprise の Playwright は本リポジトリでは実行不可。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / m11系）に倣い @playwright/test + AdminLoginPage 直利用とする。
 * 実行方針: 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { DeckDeckArchetypeSearchPage } from "../../../pages/admin/m15/m15_08_admin_deck_deck_archetype_search.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const DECK_EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/deck/\\d+/edit(\\?|$)`);

/** 管理ログインしてからデッキ一覧画面を開く。 */
async function gotoDeckListAsAdmin(
  page: Page
): Promise<DeckDeckArchetypeSearchPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const list = new DeckDeckArchetypeSearchPage(page);
  await list.goto();
  return list;
}

test.describe(
  "管理画面 > デッキ管理 > アーキタイプ検索条件",
  { tag: ["@admin", "@deck", "@search"] },
  () => {
    // ===== 表示・検索・遷移（非破壊・参照系。資格情報のみで実行可） =====

    test("E2E-M15-08-001 デッキ一覧を開くと検索フォームのみ表示され結果一覧は表示されない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoDeckListAsAdmin(page);
      await list.seeSearchFormOnly();
    });

    test("E2E-M15-08-002 検索フォームにアーキタイプ複数選択セレクト（DOM ID admin_search_deck_archetypes）が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoDeckListAsAdmin(page);
      await list.seeArchetypeSelect();
    });

    test("E2E-M15-08-003 検索ボタン押下で検索が実行され結果領域（一覧または結果なし）が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoDeckListAsAdmin(page);
      await list.submitSearch();
      await list.seeResultArea(); // 検索成立（仕様：成功時出力＝一覧HTML/結果なし）
    });

    test("E2E-M15-08-004 アーキタイプ未選択でもエラーなく検索を継続できる（任意項目）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoDeckListAsAdmin(page);
      // アーキタイプは required=false（任意）。未選択のまま検索しても入力エラーにならない。
      await list.submitSearch();
      await list.seeResultArea();
    });

    test("E2E-M15-08-012 検索条件クリアでアーキタイプ・入力欄がリセットされる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoDeckListAsAdmin(page);
      await list.deckIdInput.fill("123");
      // 仕様「すべてクリア」: テキスト入力とアーキタイプ等の選択がリセットされる。
      await list.searchClearLink.click();
      await expect(list.deckIdInput).toHaveValue("");
      await list.expectArchetypeCleared();
    });

    test("E2E-M15-08-013 未認証で /admin/deck へ直接アクセスすると管理ログイン画面へ誘導される", async ({
      page,
    }) => {
      // 資格情報不要（未ログインのガード確認）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/deck`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M15-08-020 デッキ検索後に一覧を開き直すと検索条件セッションがクリアされ初期表示に戻る", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoDeckListAsAdmin(page);
      // 任意の条件（デッキID）を入れて検索しセッションへ条件を保存させる。
      await list.deckIdInput.fill("123");
      await list.submitSearch();
      await list.seeResultArea();
      // 仕様: GET /deck で検索関連セッションがクリアされ、初期表示（入力欄空・結果なし）へ戻る。
      await list.goto();
      await expect(list.deckIdInput).toHaveValue("");
      await list.seeSearchFormOnly();
    });

    test("E2E-M15-08-023 未認証で /admin/deck/search/{page_no} へ直接アクセスすると管理ログイン画面へ誘導される", async ({
      page,
    }) => {
      // 資格情報不要（未ログインのガード確認・/deck/search ルートへの拡張）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/deck/search/2`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 自動化予定（要シード SEED-M15-08-DECKSET 等）／要実機・乖離検出は fixme で可視化 =====
    // 注: 以下は「要シード/要実機/不正注入手順の実機確認」が前提で本リポジトリでは実行不可のため test.fixme で残す
    // （規約：自動化予定/要実機のみ fixme）。乖離検出ケース（014/015）は実装と異なれば失敗で検出する想定だが、
    // fixme は常時スキップで自動検出されないため、検出責務はケース表「付帯表4（不具合候補）」の監査が正本。
    // 手動/対象外はここに残さずケース表で全量管理する（codex指摘反映）。

    test.fixme(
      "E2E-M15-08-005 アーキタイプAを選択して検索→Aに紐づくデッキだけが結果に含まれる（要 SEED-M15-08-DECKSET）",
      async () => {
        // 期待は仕様(判定順序#2 アーキタイプIN)由来。既知アーキタイプA/Bのデッキ投入後に option value を特定して実装。
      }
    );

    test.fixme(
      "E2E-M15-08-006 アーキタイプA,Bを複数選択→いずれかに一致するデッキがヒット（論理和・要 SEED-M15-08-DECKSET）",
      async () => {
        // 期待は仕様(判定順序#2 論理和)由来。
      }
    );

    test.fixme(
      "E2E-M15-08-007 フォーマット×アーキタイプ矛盾→「検索結果はありません」（0件・要 SEED-M15-08-DECKSET）",
      async () => {
        // 期待は仕様(業務ルール：両条件を独立適用し0件になり得る)由来。
      }
    );

    test.fixme(
      "E2E-M15-08-008 一覧行のデッキ詳細リンク→デッキ編集(admin_deck_edit)へ遷移（要デッキ1件以上）",
      async () => {
        // 期待は仕様(画面遷移：一覧行→m15-05 デッキ編集)由来。DECK_EDIT_RE で確認。
        void DECK_EDIT_RE;
      }
    );

    test.fixme(
      "E2E-M15-08-009 ページリンクでNページ目→セッション復元で同じアーキタイプ条件表示（要2ページ以上のシード）",
      async () => {
        // 期待は仕様(処理フロー#5 セッション復元・/deck/search/{page_no})由来。
      }
    );

    test.fixme(
      "E2E-M15-08-010 表示件数変更→1ページ件数更新・アーキタイプ条件維持（要 SEED-M15-08-DECKSET）",
      async () => {
        // 期待は仕様(利用者視点の入口：表示件数変更・条件はセッション維持)由来。
      }
    );

    test.fixme(
      "E2E-M15-08-011 並べ替え変更→並び順更新・アーキタイプ条件維持（要 SEED-M15-08-DECKSET）",
      async () => {
        // 期待は仕様(利用者視点の入口：ソート変更・条件はセッション維持)由来。
      }
    );

    test.fixme(
      "E2E-M15-08-014 アーキタイプ選択肢ラベルが「日本語名＋フォーマット名」（付帯表4#2 乖離・刷新先は日本語名のみ＝失敗で検出）",
      async () => {
        // 期待は仕様(業務ルール getNameWithFormatNameJp)由来。実装は choice_label='nameJp' のため落ちて検出する想定。
      }
    );

    test.fixme(
      "E2E-M15-08-015 フォーマット/色変更でアーキタイプの不一致オプションが無効化される（付帯表4#1 刷新先未実装＝失敗で検出・select2要実機）",
      async () => {
        // 期待は仕様(フロント挙動 deck-search.js)由来。刷新先に deck-search.js が無く連動が起きないため落ちて検出する想定。
      }
    );

    test.fixme(
      "E2E-M15-08-016 マスタ非存在のアーキタイプIDを送信→選択肢検証で拒否（要 archetypes[] パラメータ注入）",
      async () => {
        // 期待は仕様(バリデーション：送信IDをマスタ存在に制限)由来。非存在IDの注入手順を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M15-08-017 色のみ指定で検索→当該色を持つアーキタイプのデッキに限定（判定順序#3 色IN・要 SEED-M15-08-DECKSET）",
      async () => {
        // 期待は仕様(判定順序#3：色IN・dtb_archetype_color結合)由来。色チェック div.col-3.deck-search-check 内の
        // #admin_search_deck_color_* を選択し、アーキタイプ未指定のまま検索する。option value は実機確認後に特定。
      }
    );

    test.fixme(
      "E2E-M15-08-018 未来開始イベントのデッキ・ユーザ作成種別デッキは結果に含まれない（判定順序#1 共通除外・要 SEED-M15-08-DECKSET）",
      async () => {
        // 期待は仕様(判定順序#1：未来イベント・ユーザ作成種別は共通除外)由来。除外データを含むシード投入後に実装。
      }
    );

    test.fixme(
      "E2E-M15-08-021 アーキタイプAと色を同時指定→両方を満たすデッキだけがヒット（AND正常系・要 SEED-M15-08-DECKSET）",
      async () => {
        // 期待は仕様(業務ルール：アーキタイプINと色は両方を満たす・判定順序#2+#3)由来。
        // アーキタイプAと「Aが持つ色」を選択して検索。option/checkbox value は実機・シード確認後に特定。
      }
    );

    test.fixme(
      "E2E-M15-08-022 アーキタイプ一致でも色が不一致なら0件「検索結果はありません」（AND異常系対・要 SEED-M15-08-DECKSET）",
      async () => {
        // 期待は仕様(業務ルール：色条件も満たす必要があり両立しなければ0件)由来。021の異常対。
        // アーキタイプAと「Aが持たない色」を選択して検索し0件表示を確認する。
      }
    );

    test.fixme(
      "E2E-M15-08-019 order に ASC/DESC 以外を注入→admin.error.sort 相当のエラー表示＋一覧初期化（失敗時出力・要 order 注入）",
      async () => {
        // 期待は仕様(失敗時出力：order≠ASC/DESC でエラーパス・一覧初期化)由来（SearchControllerTrait のエラーパス）。
        // 刷新先UIは dropdown 固定で到達不能のため URL/パラメータ改ざんで注入する。注入手順は実機確認後に実装。
      }
    );
  }
);
