/**
 * 管理画面 アーキタイプ登録 CSV/TSV 取込 E2E。
 * 納品ケース表 integration_test/e2e/m15_10_admin_deck_archetype_csv_import_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装し、要MASTERシード(050,051,041)/要実機(031,010)/刷新追加(080)は
 * test.fixme（理由付き）。手動・間接(disp上書き/UPSERT副作用/comment非更新/旧アーキタイプID格納054/ログ)・
 * 対象外(JS送信制御070＝刷新でスピナー無し付帯表4#7)はケース表で全量管理し、specに大量のfixmeを残さない（規約準拠）。
 * 失敗系の取込画面収束(016)はURL収束＋エラー表示で判定する。設計どおりの302厳密判定(成功/失敗ともHTTP302 md:211)は
 * 刷新先の失敗時in-place描画(付帯表4#5)と乖離するため response.status() 判定を要実機の残課題とする（要確認）。
 * 期待結果は仕様(pf-eccube3 m15-10_admin_deck_archetype_csv_import.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 刷新差分（ケース表 付帯表4）:
 *  - ルート: 旧設計 /archetype/csvimport → 刷新先 GET/POST /archetype/csv_import（同一ルート）。
 *  - ヘッダ列: 旧設計は6列（末尾に「旧アーキタイプID」）→ 刷新先 getCsvHeader() は5列で「旧アーキタイプID」を持たない。
 *    ヘッダ完全一致照合のため、設計由来ヘッダを用いる本specの 021/022/023/024/025/040 は刷新差分があれば失敗で表面化する。
 *  - 成功フラッシュ: 旧設計 admin.register.complete → 刷新先 admin.common.csv_upload_complete。
 *  ナビゲーションは刷新先パスを用い、合否は上位オラクル（観点表・基本設計・旧設計）で判定する。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { DeckArchetypeCsvImportPage } from "../../../pages/admin/m15/m15_10_admin_deck_archetype_csv_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const IMPORT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/archetype/csv_import(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const ERR_HEADER = "CSVのフォーマットが一致しません。"; // :2209 admin.csv.error.format.header
const ERR_BODY = "CSVのフォーマットが一致しません。"; // :2210 admin.csv.error.format.body（行番号付き／前方一致で確認）
const ERR_EMPTY = "CSVデータが存在しません。"; // :2211 admin.csv.error.data.empty
const ERR_REQUIRE = "は必須項目です。"; // :2213 admin.csv.error.data.require（%s は必須項目です。 %d 行目…／部分一致）
const ERR_MASTER = "がマスターから取得できません。"; // :2214 admin.csv.error.data.not_registered（%s : %s が…／部分一致）
// 成功文言は要MASTERシードの fixme でのみ使用。旧設計 admin.register.complete に対し刷新先 :1409。
const SUCCESS = "CSVファイルをアップロードしました"; // :1409 admin.common.csv_upload_complete（刷新差分・付帯表4#4）

/**
 * 想定ヘッダ（1行目の論理キー列）。設計書「アップロードファイル内の列（第1行ヘッダの文言と順序）」
 * (functions/pf-eccube3/m15-10_admin_deck_archetype_csv_import.md:111-122) の順序定義由来の上位オラクル。
 * 実装(getCsvHeader)から取得すると実装出力にテストが追従し、ヘッダ列差(旧アーキタイプID除外＝付帯表4#3)を
 * 吸収してしまうため、設計書の固定値（6列）を用いる（オラクル独立性）。
 */
const CANONICAL_HEADER = [
  "アーキタイプ名（日本語）",
  "アーキタイプ名（英語）",
  "代表カード名",
  "色",
  "フォーマット",
  "旧アーキタイプID",
].join(",");
const COLS = CANONICAL_HEADER.split(",");

/** 全列ダミー値・指定列だけ空のデータ行を作る（必須チェック#7 へ到達させる）。 */
function rowWithEmptyAt(header: string): string {
  const idx = COLS.findIndex((c) => c === header);
  return COLS.map((_, i) => (i === idx ? "" : "x")).join(",");
}

/** 管理ログインしてホームへ到達する。 */
async function loginToAdmin(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).not.toHaveURL(LOGIN_RE);
}

test.describe(
  "管理画面 > アーキタイプ登録CSV取込",
  { tag: ["@admin", "@deck", "@csv"] },
  () => {
    // ===== 未認証（資格情報不要・非破壊） =====

    test("E2E-M15-10-060 未ログインで取込画面URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/archetype/csv_import`);
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可: 未認証はログインへ
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 認証必須・表示（HAS_CREDS） =====

    test("E2E-M15-10-001 取込画面にファイル選択欄・アップロードボタン・フォーマット表が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckArchetypeCsvImportPage(page);
      await target.goto();
      await target.seeUploadForm();
    });

    test("E2E-M15-10-002 フォーマット表に設計どおりのヘッダ列が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckArchetypeCsvImportPage(page);
      await target.goto();
      // 設計書(:115-122)の6列見出しがフォーマット表に並ぶこと（上位オラクル）。
      // 刷新先は「旧アーキタイプID」を持たない（付帯表4#3）ため、その欠落として表面化する。
      for (const header of COLS) {
        await expect(target.formatTable, `フォーマット表に「${header}」列が表示される`).toContainText(header);
      }
    });

    test("E2E-M15-10-003 取込前に確認ダイアログ・モーダルが表示されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckArchetypeCsvImportPage(page);
      await target.goto();
      await expect(page.locator(".modal.show")).toHaveCount(0); // 確認モーダルはない（仕様）
    });

    test("E2E-M15-10-004 アーキタイプ一覧の「CSV取り込み」リンクから取込画面へ遷移", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/archetype`);
      await page.getByRole("link", { name: "CSV取り込み" }).click(); // index.twig:68 admin.archetype.csv_import
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M15-10-005 取込画面URL直接アクセスで単独画面として表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/archetype/csv_import`);
      await expect(page).toHaveURL(IMPORT_RE); // 一覧検索条件を引き継がず単独表示
      await expect(page.locator("#upload-form")).toBeVisible();
    });

    // ===== バリデーション（マスタ照合前に確定＝MASTERシード不要） =====

    test("E2E-M15-10-020 ヘッダ不一致CSV→フォーマット不一致メッセージで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckArchetypeCsvImportPage(page);
      await target.goto();
      await target.uploadContent("bad_header.csv", "foo,bar,baz\n1,2,3\n");
      await expect(target.errorAlert).toContainText(ERR_HEADER); // 判定順序#4
      await expect(page).toHaveURL(IMPORT_RE); // 取込されず取込画面に留まる
    });

    test("E2E-M15-10-030 ヘッダ列の順序のみ入替→ヘッダ形式エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckArchetypeCsvImportPage(page);
      await target.goto();
      // 設計ヘッダの先頭2列を入れ替えた（文字列完全一致のためエラー＝エッジケース md:128）
      const reordered = [COLS[1], COLS[0], ...COLS.slice(2)].join(",");
      await target.uploadContent("reordered.csv", reordered + "\na,b,c,d,e,f\n");
      await expect(target.errorAlert).toContainText(ERR_HEADER); // 判定順序#4
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M15-10-021 ヘッダのみ（データ行なし）→データ無しメッセージで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckArchetypeCsvImportPage(page);
      await target.goto();
      await target.uploadContent("header_only.csv", CANONICAL_HEADER + "\n");
      await expect(target.errorAlert).toContainText(ERR_EMPTY); // 判定順序#5
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M15-10-022 列数不一致のデータ行→行番号付きフォーマット不一致で滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckArchetypeCsvImportPage(page);
      await target.goto();
      // ヘッダ列数(6)より少ない列数のデータ行
      await target.uploadContent("col_mismatch.csv", CANONICAL_HEADER + "\n1,2,3\n");
      await expect(target.errorAlert).toContainText(ERR_BODY); // 判定順序#6（行番号付き）
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M15-10-023 必須列「アーキタイプ名（日本語）」空→必須項目エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckArchetypeCsvImportPage(page);
      await target.goto();
      const row = rowWithEmptyAt("アーキタイプ名（日本語）");
      await target.uploadContent("require_jp.csv", CANONICAL_HEADER + "\n" + row + "\n");
      await expect(target.errorAlert).toContainText(ERR_REQUIRE); // 判定順序#7
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M15-10-024 必須列「アーキタイプ名（英語）」空→必須項目エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckArchetypeCsvImportPage(page);
      await target.goto();
      const row = rowWithEmptyAt("アーキタイプ名（英語）");
      await target.uploadContent("require_en.csv", CANONICAL_HEADER + "\n" + row + "\n");
      await expect(target.errorAlert).toContainText(ERR_REQUIRE); // 判定順序#7
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M15-10-025 必須列「フォーマット」空→必須項目エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckArchetypeCsvImportPage(page);
      await target.goto();
      const row = rowWithEmptyAt("フォーマット");
      await target.uploadContent("require_format.csv", CANONICAL_HEADER + "\n" + row + "\n");
      await expect(target.errorAlert).toContainText(ERR_REQUIRE); // 判定順序#7
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M15-10-040 実在しないフォーマット英名→マスタ未取得エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckArchetypeCsvImportPage(page);
      await target.goto();
      // 必須3列を満たし、フォーマットのみ実在しない英名（判定順序#8 マスタ解決失敗へ到達）
      const row = ["E2Eテスト", "E2E Test", "", "", "__NO_SUCH_FORMAT__", ""].join(",");
      await target.uploadContent("master_ng.csv", CANONICAL_HEADER + "\n" + row + "\n");
      await expect(target.errorAlert).toContainText(ERR_MASTER); // 判定順序#8（行番号付き）
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M15-10-016 取込失敗時は取込画面へ戻りエラーが表示される（取込GETへ収束）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckArchetypeCsvImportPage(page);
      await target.goto();
      await target.uploadContent("bad.csv", "foo\n1\n");
      // 旧設計は成功・失敗いずれもHTTP302→取込GET。刷新先は失敗時 in-place render（同一URL）（付帯表4#5）。
      await expect(page).toHaveURL(IMPORT_RE); // 取込画面（/archetype/csv_import）へ収束
      await expect(target.errorAlert).toBeVisible(); // 赤枠エラー表示
    });

    // ===== 保留（要MASTERシード／要実機／刷新追加。手動・対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M15-10-050 正しいCSV取込成功→成功フラッシュ＋取込画面へリダイレクト（要: SEED-M15-10-MASTER 実在 mtb_format/mtb_color）",
      async () => {
        // 期待は仕様(処理フロー#11 成功フラッシュ＋取込GETへリダイレクト)由来。実在フォーマット英名・色名を満たすCSVと
        // 参照マスタ整備後に実装。成功文言は刷新差分(付帯表4#4)があれば失敗で検出する。
        void SUCCESS;
      }
    );

    test.fixme(
      "E2E-M15-10-051 同一UPSERTキーCSV再取込→既存行を更新（間接確認・要: SEED-M15-10-MASTER）",
      async () => {
        // 期待は業務ルール(UPSERTキー＝日本語名/英語名/フォーマット/未削除)由来。新規→再取込で件数が増えないこと（間接）。
      }
    );

    test.fixme(
      "E2E-M15-10-041 実在しない色の日本語名→マスタ未取得エラー（要: 実在フォーマット＝SEED-M15-10-MASTER）",
      async () => {
        // 期待は判定順序#11(色マスタ解決失敗)由来。フォーマットは実在英名で#8を通過させ、色のみ未定義にして#11へ到達させる。
      }
    );

    test.fixme(
      "E2E-M15-10-031 ファイル未選択で送信→ファイル必須（要実機: #upload-button は初期 disabled で通常UIから空送信不可）",
      async () => {
        // 期待はバリデーション(ファイル NotBlank)由来。JS活性化(twig:45-51)を介さず空POSTを強制する手順を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M15-10-080 上限(5010)行超過CSV→行数上限エラー（要: 大容量CSV・刷新追加分 付帯表4#6・上限値は基本設計を正とし要確認）",
      async () => {
        // 期待はバリデーション(行数上限 admin.csv.error.upload.maxrecord :1429)由来。旧設計に上限規定なし＝刷新追加。
      }
    );

    test.fixme(
      "E2E-M15-10-010 拡張子tsvタブ区切りファイルの取込→取込実行（要実機/要MASTER: 設計はCSV/TSV許容、刷新先 accept はTSV提示なし 付帯表4#2）",
      async () => {
        // 期待は入口/フロント挙動(CSV/TSV許容・拡張子tsvはタブ区切り md:30,60)由来。
        // 実在マスタ参照の有効TSV(タブ区切り・拡張子.tsv)を mimeType "text/tab-separated-values" / 拡張子.tsv で
        // setInputFiles し、成功フラッシュ＋取込GETへの収束を確認する（要MASTER整備後に実装）。
        // 刷新先の accept='text/csv,.csv'(付帯表4#2)でTSV不可なら、設計どおりの期待で失敗し乖離を検出する。
      }
    );
  }
);
