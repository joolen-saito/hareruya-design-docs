/**
 * 管理画面 カードCSV登録（取込） E2E。
 * 納品ケース表 integration_test/e2e/m14_05_admin_card_card_csv_import_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装し、要シード(MASTER)/大容量/要実機の 050/051/034/035/080 は
 * test.fixme（理由付き）。手動/間接(040,052,010)・対象外(070)はケース表で全量管理し、specに大量のfixmeを残さない（規約準拠）。
 * 期待結果は仕様(pf-eccube3 m14-05_admin_card_card_csv_import.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 刷新差分（ケース表 付帯表4）: 旧設計は /card/csvimport、刷新先は GET /card/csv_upload・POST /card/import・
 * 雛形 /card/csv_template。ナビゲーションは刷新先パスを用い、合否は上位オラクル（観点表・基本設計）で判定する。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { CardCardCsvImportPage } from "../../../pages/admin/m14/m14_05_admin_card_card_csv_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const UPLOAD_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/card/csv_upload(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const ERR_HEADER = "CSVのフォーマットが一致しません。"; // :2209 admin.csv.error.format.header
const ERR_BODY = "CSVのフォーマットが一致しません。"; // :2210 admin.csv.error.format.body（行番号付き／前方一致で確認）
const ERR_EMPTY = "CSVデータが存在しません。"; // :2211 admin.csv.error.data.empty
const ERR_REQUIRE = "は必須項目です。"; // :2213 admin.csv.error.data.require（%s は必須項目です。 %d 行目…／部分一致）
const SUCCESS = "登録が完了しました。"; // :1773 admin.register.complete

/** 管理ログインしてホームへ到達する。 */
async function loginToAdmin(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).not.toHaveURL(LOGIN_RE);
}

/**
 * 想定ヘッダ（1行目の論理キー列）。設計書「CSV 列（論理キー）一覧」
 * (functions/pf-eccube3/m14-05_admin_card_card_csv_import.md:173-213) の順序定義由来の上位オラクル。
 * 実装の雛形DL(admin_card_csv_template)から取得すると実装出力にテストが追従し、
 * ヘッダ列・必須列・除外列の仕様乖離を吸収してしまうため、設計書の固定値を用いる（オラクル独立性）。
 * ヘッダ完全一致照合(判定順序#3)で実装の除外列差(付帯表4#4)があれば、本値との不一致として表面化する。
 */
const CANONICAL_HEADER = [
  "name_jp", "name_en", "arena_format_name_jp", "arena_format_name_en",
  "text_jp", "text_en", "mana_cost", "cmc", "power", "toughness", "loyalty",
  "color", "cardtype", "subtype", "specialtype", "keyword_ability", "format",
  "set", "rarity", "illustrator", "layout", "flavor_jp", "flavor_en", "card_no",
  "promotion", "foil_flg", "promotion_flg", "image_jp", "image_en",
  "card_detail_id", "back_card_detail_id", "color_sequence", "color_identity",
].join(",");

/** メモリ上のCSVをアップロードする（一時ファイル不要）。 */
async function uploadCsv(target: CardCardCsvImportPage, name: string, content: string) {
  await target.fileInput.setInputFiles({
    name,
    mimeType: "text/csv",
    buffer: Buffer.from(content, "utf-8"),
  });
  await target.uploadButton.click();
}

test.describe(
  "管理画面 > カードCSV登録（取込）",
  { tag: ["@admin", "@card", "@csv"] },
  () => {
    // ===== 未認証（資格情報不要・非破壊） =====

    test("E2E-M14-05-060 未ログインでアップロード画面URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/card/csv_upload`);
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可: 未認証はログインへ
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 認証必須・表示（HAS_CREDS） =====

    test("E2E-M14-05-001 アップロード画面にファイル選択欄・ボタン・フォーマット表が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new CardCardCsvImportPage(page);
      await target.goto();
      await target.seeUploadForm();
    });

    test("E2E-M14-05-002 カード一覧の「CSV取り込み」リンクからアップロード画面へ遷移", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/card`);
      await page.getByRole("link", { name: "CSV取り込み" }).click();
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M14-05-003 フォーマット表に論理キーと必須キーの「必須」バッジが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new CardCardCsvImportPage(page);
      await target.goto();
      // 設計書「CSV 列（論理キー）一覧」の必須論理キー(:213 name_en,cmc,rarity,layout,promotion_flg,image_en)が
      // フォーマット表に並ぶこと（上位オラクル）。実装の必須集合差(付帯表4#3)は本キー欠落として表面化する。
      for (const key of ["name_en", "cmc", "rarity", "layout", "promotion_flg", "image_en"]) {
        await expect(target.formatTable, `論理キー ${key} がフォーマット表に表示される`).toContainText(key);
      }
      await expect(target.requiredBadge.first()).toBeVisible(); // 必須キーに必須バッジ
    });

    test("E2E-M14-05-004 雛形ファイルダウンロードボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new CardCardCsvImportPage(page);
      await target.goto();
      await expect(target.templateDownloadButton).toBeVisible();
    });

    test("E2E-M14-05-005 取込前に確認ダイアログ・モーダルが表示されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new CardCardCsvImportPage(page);
      await target.goto();
      await expect(page.locator(".modal.show")).toHaveCount(0); // 確認ダイアログはない（仕様）
    });

    test("E2E-M14-05-006 アップロード画面URL直接アクセスで取込画面が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/card/csv_upload`);
      await expect(page).toHaveURL(UPLOAD_RE);
      await expect(page.locator("#upload-form")).toBeVisible();
    });

    // ===== バリデーション（マスタ照合の手前で確定＝MASTERシード不要） =====

    test("E2E-M14-05-020 ファイル未選択でアップロード→エラー表示・同画面滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new CardCardCsvImportPage(page);
      await target.goto();
      await target.submitWithoutFile();
      await expect(target.errorFlash).toBeVisible(); // 判定順序#1 ファイル必須
      await expect(page).toHaveURL(UPLOAD_RE); // 取込されずアップロード画面に留まる
    });

    test("E2E-M14-05-030 ヘッダ不一致CSV→フォーマット不一致メッセージで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new CardCardCsvImportPage(page);
      await target.goto();
      await uploadCsv(target, "bad_header.csv", "foo,bar,baz\n1,2,3\n");
      await expect(target.errorFlash).toContainText(ERR_HEADER); // 判定順序#3
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M14-05-031 ヘッダのみ（データ無し）CSV→データ無しメッセージで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new CardCardCsvImportPage(page);
      await target.goto();
      const header = CANONICAL_HEADER; // 設計書由来の想定ヘッダ（オラクル独立）
      await uploadCsv(target, "header_only.csv", header + "\n");
      await expect(target.errorFlash).toContainText(ERR_EMPTY); // 判定順序#4
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M14-05-032 列数不一致のデータ行→行番号付きフォーマット不一致で滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new CardCardCsvImportPage(page);
      await target.goto();
      const header = CANONICAL_HEADER;
      // ヘッダ列数より少ない列数のデータ行
      await uploadCsv(target, "col_mismatch.csv", header + "\n1,2,3\n");
      await expect(target.errorFlash).toContainText(ERR_BODY); // 判定順序#5（行番号付き）
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M14-05-033 必須論理キー(name_en)空→必須項目エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new CardCardCsvImportPage(page);
      await target.goto();
      const header = CANONICAL_HEADER;
      const cols = header.split(",");
      const nameEnIdx = cols.findIndex((c) => c.trim() === "name_en");
      expect(nameEnIdx, "想定ヘッダに name_en 列が存在する").toBeGreaterThanOrEqual(0);
      // 全列ダミー値・name_en のみ空のデータ行（判定順序#6 必須チェックに到達）
      const row = cols.map((_, i) => (i === nameEnIdx ? "" : "x"));
      await uploadCsv(target, "require.csv", header + "\n" + row.join(",") + "\n");
      await expect(target.errorFlash).toContainText(ERR_REQUIRE); // 判定順序#6
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M14-05-036 必須論理キー(rarity)空→必須項目エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new CardCardCsvImportPage(page);
      await target.goto();
      const header = CANONICAL_HEADER;
      const cols = header.split(",");
      const rarityIdx = cols.findIndex((c) => c.trim() === "rarity");
      expect(rarityIdx, "想定ヘッダに rarity 列が存在する").toBeGreaterThanOrEqual(0);
      // name_en は埋め rarity のみ空。設計の必須論理キー集合(:213)のうち name_en 以外の必須キー欠落を判定順序#6で検出。
      const nameEnIdx = cols.findIndex((c) => c.trim() === "name_en");
      const row = cols.map((_, i) => (i === rarityIdx ? "" : i === nameEnIdx ? "DUMMY_EN" : "x"));
      await uploadCsv(target, "require_rarity.csv", header + "\n" + row.join(",") + "\n");
      await expect(target.errorFlash).toContainText(ERR_REQUIRE); // 判定順序#6（必須キー集合は基本設計を正とする）
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    // ===== 保留（要シードMASTER／大容量／要実機。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M14-05-050/051 正しいCSV取込成功→「登録が完了しました。」＋アップロード画面へリダイレクト（要: SEED-M14-05-MASTER 参照マスタ一式）",
      async () => {
        // 期待は仕様(処理フロー成功時 admin.register.complete / CardCsvController.php:135-137)由来。
        // 全必須列・実在マスタ参照値を満たすCSVと参照マスタ整備後に実装。
        void SUCCESS;
      }
    );

    test.fixme(
      "E2E-M14-05-034 実在しないマスタ英名参照→「マスターから取得できません」（要: 全ヘッダCSV＋MASTERシード）",
      async () => {
        // 期待は仕様(判定順序#7 admin.csv.error.data.not_registered / CardCsv.php)由来。
        // 全必須列を満たし実在しないマスタ英名を参照する行で判定順序#7へ到達させる。
      }
    );

    test.fixme(
      "E2E-M14-05-035 TSVは旧設計どおりタブ区切りで取込される（不具合候補#2: 刷新先はTSV拒否で検出見込み・要実機確認）",
      async () => {
        // 期待は上位オラクル(旧設計 フロント挙動「CSV, TSV」/処理フロー#6)由来。
        // 刷新先は admin.card.csv_tsv_not_allowed で拒否するため失敗で乖離を検出する想定。
      }
    );

    test.fixme(
      "E2E-M14-05-080 上限行数超過CSV→行数上限エラー（要: 大容量CSV・上限値は基本設計を正とし要確認）",
      async () => {
        // 期待はバリデーション(行数上限)由来。刷新追加分(付帯表4#5)のため上限要件確認後に実装。
      }
    );
  }
);
