/**
 * 管理画面 データ管理 > MTGマスターデータ編集 E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m16_04_admin_data_hareruya_mtg_masterdata_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち非破壊で安全に実行できるケース（表示・遷移・未認証）のみ test 本体で実装し、
 * 破壊的な登録/更新/削除・固定行シード依存・CSRF要実機は test.fixme（理由付き）で残す。
 * 手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様（正本 functions/pf-eccube3/m16-04_admin_data_hareruya_mtg_masterdata.md／観点表／基本設計）由来（オラクル独立性）。
 * 実装から取るのはセレクタ（位置情報）のみ。
 *
 * pf-eccube3 リバース設計と刷新先 ec-cube-enterprise の乖離（入口 /masterdata→/data/mtg_master_data、種別実値の短縮キー化、
 * 成功文言 register.complete→save_complete、日時必須 Referer302→flash+303、検証失敗 404→再描画、NotBlank分岐の不在、
 * int数値検証の追加とメッセージキー未定義）はケース表「付帯表4」に出し、テストは仕様どおりに書く（実装が違えば落ちて検出する）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / m15・m16系）に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針（安全第一・共有環境）:
 *  - 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 表示・選択・名前付きURL・未認証誘導は非破壊で安全に実行できる。
 *  - 登録/更新/削除はマスタを変更する破壊的操作のため、専用環境・専用行・後始末を要する＝test.fixme（ケース表 SEED-M16-04-EDIT）。
 *
 * 環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { DataHareruyaMtgMasterdataPage } from "../../../pages/admin/m16/m16_04_admin_data_hareruya_mtg_masterdata.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
// 実装 route admin_data_mtg_master_data = /data/mtg_master_data（位置情報）。設計入口 /masterdata との乖離は付帯表4#1。
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/data/mtg_master_data(\\?|$)`);

/** 管理ログインしてからMTGマスターデータ編集画面（GET /data/mtg_master_data）を開く。 */
async function gotoAsAdmin(
  page: Page,
  entityKey?: string
): Promise<DataHareruyaMtgMasterdataPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const md = new DataHareruyaMtgMasterdataPage(page);
  await md.goto(entityKey);
  return md;
}

test.describe(
  "管理画面 > データ管理 > MTGマスターデータ編集",
  { tag: ["@admin", "@data"] },
  () => {
    // ===== 未認証（資格情報不要・非破壊） =====

    test("E2E-M16-04-013 未認証で直接アクセスすると管理ログイン画面へ誘導される", async ({
      page,
    }) => {
      const md = new DataHareruyaMtgMasterdataPage(page);
      await md.goto();
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 表示・遷移（管理ログイン・非破壊） =====

    test("E2E-M16-04-001 GET入口（entity未指定）で種別選択プルダウンを備えた入口画面が開ける", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M16-04-ADMIN）");
      const md = await gotoAsAdmin(page);
      await expect(page).toHaveURL(LIST_RE);
      // 設計由来オラクル: 入口GETは種別選択プルダウンを備えた画面（設計では一覧表ブロック非保証）。
      // 実装は先頭種別の一覧へリダイレクトするが、その一覧表示の有無は固定オラクル化しない（付帯表4#9）。
      await expect(md.entitySelect).toBeVisible();
    });

    test("E2E-M16-04-004 画面見出しに「MTGマスターデータ管理」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const md = await gotoAsAdmin(page);
      await md.seeTitle();
    });

    test("E2E-M16-04-005 種別プルダウンにマスタ種別の選択肢が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const md = await gotoAsAdmin(page);
      await expect(md.entitySelect).toBeVisible();
      // 設計の種別ラベル（観点表・基本設計由来）。実装の種別集合との差は付帯表4#2。
      await expect(md.entitySelect).toContainText("カードタイプ");
      await expect(md.entitySelect).toContainText("キャンペーンタグ");
    });

    test("E2E-M16-04-006 一覧編集の「登録」ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const md = await gotoAsAdmin(page);
      await expect(md.registerButton).toBeVisible();
    });

    test("E2E-M16-04-002 種別プルダウンで選び「選択」で当該種別の一覧表が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const md = await gotoAsAdmin(page);
      await md.selectEntityByLabel("レアリティ");
      await expect(page).toHaveURL(LIST_RE);
      await md.seeList();
    });

    test("E2E-M16-04-003 名前付きURL（?entity=campaign_tag）で指定種別の一覧を直接開ける", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const md = await gotoAsAdmin(page, "campaign_tag");
      await expect(page).toHaveURL(LIST_RE);
      await md.seeList();
    });

    test("E2E-M16-04-007 真偽値列が0/1選択の入力部品で描画される（カードタイプ）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M16-04-MASTER cardtype）");
      const md = await gotoAsAdmin(page, "cardtype");
      await md.seeList();
      // 真偽列 product_search_flg は <select>（0/1）で描画される（twig:94-98）。
      await expect(
        md.table.locator('tbody select[name^="rows["]').first()
      ).toBeVisible();
    });

    test("E2E-M16-04-008 日時列が日時入力部品（datetime-local）で描画される（キャンペーンタグ）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M16-04-MASTER campaign_tag）");
      const md = await gotoAsAdmin(page, "campaign_tag");
      await md.seeList();
      await expect(
        md.table.locator('tbody input[type="datetime-local"]').first()
      ).toBeVisible();
    });

    test("E2E-M16-04-009 種別一覧に既存全件と末尾の新規入力用空行が表示される（レアリティ）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M16-04-MASTER rarity）");
      const md = await gotoAsAdmin(page, "rarity");
      await md.seeList();
      // 設計 処理フロー: 全件findBy＋末尾に空行を1行追加。既存行と末尾の新規入力行（rows[new]）が存在する。
      await expect(md.bodyRows.first()).toBeVisible();
      await expect(
        md.table.locator('tbody input[name^="rows[new]"]').first()
      ).toBeVisible();
    });

    test("E2E-M16-04-014 列見出しがucfirst変換で表示され先頭フィールド列がhiddenで描画される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M16-04-MASTER）");
      const md = await gotoAsAdmin(page, "rarity");
      await md.seeList();
      // 設計 フロント挙動: 列見出しは ucfirst(プロパティ名)、先頭フィールドは hidden。
      await expect(md.headerCells.first()).toBeVisible();
      await expect(
        md.table.locator('tbody input[type="hidden"][name^="rows["]').first()
      ).toBeAttached();
    });

    test("E2E-M16-04-015 一覧表示時の注意文とカード一覧への名前付きリンクが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M16-04-MASTER）");
      const md = await gotoAsAdmin(page, "rarity");
      await md.seeList();
      // 設計 フロント挙動 表示要素: 注意文（行を空にすると削除）を一覧表示時に出す。
      // 刷新先で無ければ落として検出（付帯表4#2系）。文言の完全一致はオラクル化せず代表語で確認。
      await expect(page.locator("body")).toContainText("削除");
    });

    test("E2E-M16-04-016 無効な種別を名前付きURLで指定すると当該種別の一覧表が表示されない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M16-04-ADMIN）");
      const md = await gotoAsAdmin(page, "__invalid__");
      // 設計 エラー処理: メタデータ解決不能/リポジトリ異常は404。無効種別の一覧表は描画されない。
      // 実値（404 か再描画か）は付帯表4。合否は「無効種別の一覧が描画されない」を設計由来で判定。
      await expect(md.table).toHaveCount(0);
    });

    // ===== 破壊的・シード依存・要実機（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M16-04-010/011 既存行を更新して登録→成功フラッシュ表示・再読み込みで反映（要: SEED-M16-04-EDIT 専用行＋後始末。破壊的）",
      async () => {
        // 期待は仕様(処理フロー 成功フラッシュ＋名前付きURL再読み込み)由来。成功文言の完全一致はオラクル化しない（付帯表4#5）。
      }
    );

    test.fixme(
      "E2E-M16-04-012 新規行に値入力して登録→成功フラッシュ表示（要: SEED-M16-04-EDIT 専用種別＋後始末。破壊的）",
      async () => {
        // 期待は仕様(処理フロー 新規persist＋成功フラッシュ)由来。
      }
    );

    test.fixme(
      "E2E-M16-04-020 キャンペーンタグ日時列を空で登録→エラー表示・登録不成立（要: SEED-M16-04-EDIT。破壊試行）",
      async () => {
        // 期待は仕様(バリデーション 日時必須・エッジケース)由来＝エラー表示＋成功フラッシュ無し。
        // 設計は Referer302、刷新実装は flash+303（付帯表4#4）。テストは「エラー表示＋登録不成立」を観測する。
      }
    );

    test.fixme(
      "E2E-M16-04-021 数値列（sort_no）に非数値で登録→エラー表示・登録不成立（要: SEED-M16-04-EDIT。実装int_invalidキー未定義 付帯表4#6）",
      async () => {
        // 期待は観点表IT-22(数値)由来＝エラー表示＋処理未完了。
      }
    );

    test.fixme(
      "E2E-M16-04-022 固定行を持つ種別（ボード）の先頭固定行が読み取り専用で描画される（要: FIXED_FORM_NUM>0 の行が存在するシード）",
      async () => {
        // 期待は仕様(フロント挙動・固定行インデックス readonly)由来。fixedFormNum 境界の固定行が存在する種別/件数が必要。
      }
    );

    test.fixme(
      "E2E-M16-04-030 既存非固定行の全列を空にして登録→当該行が削除される（要: SEED-M16-04-EDIT。破壊的・削除挙動差 付帯表4#7）",
      async () => {
        // 期待は仕様(処理フロー 全空＝削除)由来＝当該行が一覧から消える。設計の削除説明との差は落として検出する。
      }
    );

    test.fixme(
      "E2E-M16-04-031 編集フォームのCSRFトークン不正時は登録が成立しない（要実機: 設計HTTP404／実装は再描画 付帯表4#3）",
      async () => {
        // 期待は仕様(エラー処理 検証失敗時 登録不成立)由来。トークン改変POSTの組み立てを実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M16-04-017 固定行境界を超える行は編集可能（readonlyでない）で描画される（要: FIXED_FORM_NUM>0かつ境界超え行が存在するシード）",
      async () => {
        // 期待は仕様(固定行インデックス 行キー>FIXED_FORM_NUM は通常入力可能)由来。022(readonly)の境界正常側の対。
      }
    );

    test.fixme(
      "E2E-M16-04-023 キャンペーンタグ日時列に有効値を入力して更新→成功（正常系）（要: SEED-M16-04-EDIT。破壊的）",
      async () => {
        // 期待は仕様(入力項目 日時有効値→更新成立)由来。020の異常系の対。
      }
    );

    test.fixme(
      "E2E-M16-04-024 ViewStartDateのみ空で登録→エラー・登録不成立（要: SEED-M16-04-EDIT。破壊試行）",
      async () => {
        // 期待は仕様(入力項目 ViewStartDate必須)由来＝エラー表示＋成功フラッシュ無し。両日時空020からの分離。
      }
    );

    test.fixme(
      "E2E-M16-04-025 ViewEndDateのみ空で登録→エラー・登録不成立（要: SEED-M16-04-EDIT。破壊試行）",
      async () => {
        // 期待は仕様(入力項目 ViewEndDate必須)由来＝エラー表示＋成功フラッシュ無し。両日時空020からの分離。
      }
    );

    test.fixme(
      "E2E-M16-04-026 並び順（数値列）に有効な数値を入力して登録→成功（正常系）（要: SEED-M16-04-EDIT。破壊的）",
      async () => {
        // 期待は観点表IT-22(数値 正常境界)由来＝成功フラッシュ・数値エラー無し。021(非数値)の対。
      }
    );

    test.fixme(
      "E2E-M16-04-027 空の新規行のみを送信しても登録されず一覧が増えない（要: SEED-M16-04-MASTER。間接）",
      async () => {
        // 期待は仕様(エッジケース prm0無し入力なしはスキップ)由来＝一覧件数不変。012(新規追加)の非登録系の対。
      }
    );

    test.fixme(
      "E2E-M16-04-028 新規行の値が登録後に再読み込みした一覧（DB結果）に反映される（要: SEED-M16-04-EDIT。破壊的・間接）",
      async () => {
        // 期待は仕様(データ整合性 永続化後 名前付きURLで再描画)由来。012の成功フラッシュとは別にDB反映を確認する対。
      }
    );

    test.fixme(
      "E2E-M16-04-029 マスタ種別を未選択のまま送信→エラー・一覧非表示（設計NotBlank。実装は既定種別へ誘導でNotBlank分岐無し 付帯表4#8）",
      async () => {
        // 期待は仕様(バリデーション マスタ種別 NotBlank 未選択検知)由来。実装が違えば落ちて検出。空値POSTの組み立ては要実機確認。
      }
    );
  }
);
