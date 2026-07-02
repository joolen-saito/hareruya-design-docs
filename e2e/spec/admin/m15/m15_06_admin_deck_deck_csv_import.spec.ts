/**
 * 管理画面 デッキ登録 CSV/TSV 取込 E2E。
 * 納品ケース表 integration_test/e2e/m15_06_admin_deck_deck_csv_import_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装し、要MASTERシード(050)/要row整備(040)/要実機(031)/刷新追加(080)/
 * 刷新差分(030)は test.fixme（理由付き）。手動・間接(取込後DB一致/明細増殖/disp写像/取込結果のDB検索)・
 * 対象外(ログ・CSRF内部・JS差分)はケース表で全量管理し、specに大量のfixmeを残さない（規約準拠）。
 * 期待結果は仕様(pf-eccube3 m15-06_admin_deck_deck_csv_import.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 刷新差分（ケース表 付帯表4）:
 *  - ルート: 旧設計 /deck/csvimport → 刷新先 GET/POST /deck/csv_import（同一ルート）。
 *  - ヘッダ列: 旧設計24列（win/loss/draw_count・dci_no・old_deck_id を含む）→ 刷新先 getCsvHeader() は20列で
 *    それらを持たず「tags」を加える。フォーマット表の列照合(002)は設計24列で行い、欠落列があれば失敗で表面化。
 *  - ヘッダ厳密一致: 旧設計は「並びだけ誤ればヘッダ比較で即拒否」。刷新先 CsvImporter はヘッダ行の存在のみ確認し
 *    論理キーで列解決するため列内容/順序の不一致は format.header を出さない（付帯表4#3,#8。030 を fixme）。
 *  - 成功フラッシュ: 旧設計 admin.register.complete → 刷新先 admin.common.csv_upload_complete。
 *  - 失敗時遷移: 旧設計は成功/失敗いずれもHTTP302で取込GETへ。刷新先 失敗時は同一URLで in-place 再描画（付帯表4#5）。
 *  ナビゲーションは刷新先パスを用い、合否は上位オラクル（観点表・基本設計・旧設計）で判定する。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { DeckDeckCsvImportPage } from "../../../pages/admin/m15/m15_06_admin_deck_deck_csv_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const IMPORT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/deck/csv_import(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const ERR_HEADER = "CSVのフォーマットが一致しません。"; // :2209 admin.csv.error.format.header（ヘッダ行なし）
const ERR_EMPTY = "CSVデータが存在しません。"; // :2211 admin.csv.error.data.empty（データ0件）
const ERR_REQUIRE = "は必須項目です。"; // :2213 admin.csv.error.data.require（%s は必須項目です。 %d 行目…／部分一致）
const ERR_MASTER = "がマスターから取得できません。"; // :2214 admin.csv.error.data.not_registered（%s : %s が…／部分一致）
// 成功フラッシュの表示文言は実装由来（admin.common.csv_upload_complete「CSVファイルをアップロードしました」messages.ja.yaml:1409）であり、
// 期待値オラクルには採用しない（オラクル独立性）。正典の成功鍵は admin.register.complete（md:94）。
// 050 の合否は「成功フラッシュ表示＋取込GET(リダイレクト)へ収束」で判定し、文言キーの一致は付帯表4#4 として要確認に置く。

/**
 * 設計書「CSV 論理キー列（画面上のヘッダ行）」(functions/pf-eccube3/m15-06_admin_deck_deck_csv_import.md:132-159)
 * の24論理キー（上位オラクル）。フォーマット表(thead は {{ key }}＝論理キー)に並ぶことを照合する。
 * 実装(getCsvHeader)から取得すると実装出力にテストが追従し、列欠落(win/loss/draw_count・dci_no・old_deck_id＝
 * 付帯表4#3)を吸収してしまうため、設計の固定値を用いる（オラクル独立性）。
 */
const DESIGN_HEADER_KEYS = [
  "player_name",
  "format",
  "archetype",
  "event_detail_id",
  "deck_name",
  "win_count",
  "loss_count",
  "draw_count",
  "ranking",
  "result",
  "dci_no",
  "event_name_en",
  "event_name_jp",
  "event_date",
  "source_url",
  "participants",
  "disp_flg",
  "private_flg",
  "main_list",
  "side_list",
  "commander",
  "deck_id",
  "image_card_name",
  "old_deck_id",
];

/**
 * 取込入力用のヘッダ論理キー（位置情報＝フィールド識別子。セレクタと同様に実装由来の位置情報のみ利用）。
 * 刷新先 getCsvHeader()（DeckCsvController.php:158-182）の20キーで、ハンドラが論理キーで列解決する。
 * 期待結果(エラー文言)は仕様由来であり、入力ヘッダは fixture として実装の列識別子に合わせる。
 */
const INPUT_HEADER_KEYS = [
  "player_name",
  "format",
  "archetype",
  "event_detail_id",
  "deck_name",
  "ranking",
  "result",
  "tags",
  "event_name_en",
  "event_name_jp",
  "event_date",
  "source_url",
  "participants",
  "disp_flg",
  "private_flg",
  "main_list",
  "side_list",
  "commander",
  "deck_id",
  "image_card_name",
];
const INPUT_HEADER = INPUT_HEADER_KEYS.join(",");

/** 全列ダミー値・指定論理キーだけ空のデータ行を作る（必須チェックへ到達させる）。 */
function rowWithEmptyAt(key: string): string {
  const idx = INPUT_HEADER_KEYS.findIndex((k) => k === key);
  return INPUT_HEADER_KEYS.map((_, i) => (i === idx ? "" : "x")).join(",");
}

/** 管理ログインしてホームへ到達する。 */
async function loginToAdmin(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).not.toHaveURL(LOGIN_RE);
}

test.describe(
  "管理画面 > デッキ登録CSV取込",
  { tag: ["@admin", "@deck", "@csv"] },
  () => {
    // ===== 未認証（資格情報不要・非破壊） =====

    test("E2E-M15-06-060 未ログインで取込画面URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/deck/csv_import`);
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可: 未認証はログインへ
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M15-06-061 未ログインで取込POST→取込実行されずログインへ誘導", async ({ page }) => {
      // 権限・認可はGET画面とPOST取込の両到達可否を対象とする（md:233-235）。
      // 未認証POSTでリダイレクトを追わず（maxRedirects:0）、2xxで取込実行されないこと＝ログインへ転送/拒否を確認する。
      const res = await page.request.post(`/${ECCUBE_ADMIN_ROUTE}/deck/csv_import`, {
        failOnStatusCode: false,
        maxRedirects: 0,
        multipart: {
          "admin_csv_import[import_file]": {
            name: "x.csv",
            mimeType: "text/csv",
            buffer: Buffer.from("player_name\nx\n", "utf-8"),
          },
        },
      });
      expect(res.status(), "未認証POSTは2xxで取込成立しない（ログインへ転送/拒否）").toBeGreaterThanOrEqual(300);
      const loc = res.headers()["location"] ?? "";
      expect(loc.includes("/login") || res.status() === 403 || res.status() === 401).toBeTruthy();
    });

    // ===== 認証必須・表示（HAS_CREDS） =====

    test("E2E-M15-06-001 取込画面にファイル選択欄・アップロードボタン・フォーマット表が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckDeckCsvImportPage(page);
      await target.goto();
      await target.seeUploadForm();
    });

    test("E2E-M15-06-002 フォーマット表に設計どおりの論理キー列が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckDeckCsvImportPage(page);
      await target.goto();
      // 設計書(:132-159)の24論理キーがフォーマット表 thead に並ぶこと（上位オラクル）。
      // 刷新先は win/loss/draw_count・dci_no・old_deck_id を持たない（付帯表4#3）ため欠落として表面化する。
      for (const key of DESIGN_HEADER_KEYS) {
        await expect(target.formatTable, `フォーマット表に「${key}」列が表示される`).toContainText(key);
      }
    });

    test("E2E-M15-06-003 取込前に確認ダイアログ・モーダルが表示されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckDeckCsvImportPage(page);
      await target.goto();
      await expect(page.locator(".modal.show")).toHaveCount(0); // 取込前の確認モーダルはない（仕様 md:49）
    });

    test("E2E-M15-06-004 デッキ一覧の「CSV登録」リンクから取込画面へ遷移", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/deck`);
      await page.getByRole("link", { name: "CSV登録" }).click(); // index.twig:226 admin.deck.csv_import :4078
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M15-06-005 取込画面URL直接アクセスで単独画面として表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/deck/csv_import`);
      await expect(page).toHaveURL(IMPORT_RE); // 一覧検索条件を引き継がず単独表示（md:246 セッションに検索状態を載せない）
      await expect(page.locator("#upload-form")).toBeVisible();
    });

    test("E2E-M15-06-008 取込画面に見出し「デッキ管理」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckDeckCsvImportPage(page);
      await target.goto();
      // 設計の表示要素（ページ見出し「デッキ管理」md:42）。実装文言ではなく設計の見出し名を期待値化する。
      await expect(page.getByText("デッキ管理").first()).toBeVisible();
    });

    test("E2E-M15-06-006 ファイル入力のaccept属性に設計のCSV/TSV許容値が並ぶ", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckDeckCsvImportPage(page);
      await target.goto();
      // 設計（アップロード入力補助 md:50）は accept に .csv/text/csv/.tsv/text/tsv が並ぶ。
      // 刷新先は accept='text/csv,.csv' でTSV値が欠落（付帯表4#2）するため、設計値で照合すると失敗で表面化する（オラクル独立性）。
      const accept = await target.fileInput.getAttribute("accept");
      expect(accept ?? "", "accept に設計のTSV許容値(.tsv)が並ぶ（刷新欠落は付帯表4#2）").toContain(".tsv");
    });

    test("E2E-M15-06-007 厳密チェック「strict」項目が既定オンで表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckDeckCsvImportPage(page);
      await target.goto();
      // 設計（処理フロー#GET strict項目 md:59／入力項目 既定オン md:130）。
      // 刷新先テンプレートは strict を描画しない（付帯表4#7）ため、表示・既定チェックの期待は失敗で表面化する（オラクル独立性）。
      await expect(target.strictCheckbox).toBeVisible();
      await expect(target.strictCheckbox).toBeChecked();
    });

    // ===== バリデーション（マスタ照合前に確定＝MASTERシード不要） =====

    test("E2E-M15-06-016 取込失敗時は取込画面へ戻りエラーが表示される（取込画面へ収束）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckDeckCsvImportPage(page);
      await target.goto();
      await target.uploadContent("empty.csv", ""); // ヘッダ行なし＝確実に失敗させる
      // 旧設計は成功・失敗いずれもHTTP302→取込GET。刷新先は失敗時 in-place render（同一URL）（付帯表4#5）。
      await expect(page).toHaveURL(IMPORT_RE); // 取込画面（/deck/csv_import）へ収束
      await expect(target.errorAlert).toBeVisible(); // 赤枠エラー表示
    });

    test("E2E-M15-06-020 ヘッダ行なしの空CSV→フォーマット不一致メッセージで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckDeckCsvImportPage(page);
      await target.goto();
      await target.uploadContent("no_header.csv", ""); // 判定順序#3: ヘッダ行が取得できない
      await expect(target.errorAlert).toContainText(ERR_HEADER);
      await expect(page).toHaveURL(IMPORT_RE); // 取込されず取込画面に留まる
    });

    test("E2E-M15-06-021 ヘッダのみ（データ行なし）→データ無しメッセージで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckDeckCsvImportPage(page);
      await target.goto();
      await target.uploadContent("header_only.csv", INPUT_HEADER + "\n");
      await expect(target.errorAlert).toContainText(ERR_EMPTY); // 判定順序#3（データ最低1行）
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M15-06-022 必須列「player_name」空→必須項目エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckDeckCsvImportPage(page);
      await target.goto();
      const row = rowWithEmptyAt("player_name");
      await target.uploadContent("require_player.csv", INPUT_HEADER + "\n" + row + "\n");
      await expect(target.errorAlert).toContainText(ERR_REQUIRE); // 判定順序#4（必須空欄禁止）
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M15-06-023 必須列「format」空→必須項目エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckDeckCsvImportPage(page);
      await target.goto();
      const row = rowWithEmptyAt("format");
      await target.uploadContent("require_format.csv", INPUT_HEADER + "\n" + row + "\n");
      await expect(target.errorAlert).toContainText(ERR_REQUIRE); // 判定順序#4
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M15-06-024 必須列「disp_flg」空→必須項目エラーで滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToAdmin(page);
      const target = new DeckDeckCsvImportPage(page);
      await target.goto();
      const row = rowWithEmptyAt("disp_flg");
      await target.uploadContent("require_disp.csv", INPUT_HEADER + "\n" + row + "\n");
      await expect(target.errorAlert).toContainText(ERR_REQUIRE); // 判定順序#4（必須論理キー md:159）
      await expect(page).toHaveURL(IMPORT_RE);
    });

    // 残りの必須論理キー（md:159: archetype/event_name_en/event_name_jp/event_date/private_flg）も
    // 判定順序#4（ヘッダ列長→必須空欄→マスタ照合 md:112）で空欄禁止になる。代表3列(022/023/024)に加え
    // 全必須キーの対を網羅する（刷新先が一部を必須化していなければ失敗で表面化＝付帯表4・実装に寄せない）。
    const ADDITIONAL_REQUIRED_KEYS: Array<{ id: string; key: string }> = [
      { id: "E2E-M15-06-025", key: "archetype" },
      { id: "E2E-M15-06-026", key: "event_name_en" },
      { id: "E2E-M15-06-027", key: "event_name_jp" },
      { id: "E2E-M15-06-028", key: "event_date" },
      { id: "E2E-M15-06-029", key: "private_flg" },
    ];
    for (const { id, key } of ADDITIONAL_REQUIRED_KEYS) {
      test(`${id} 必須列「${key}」空→必須項目エラーで滞留`, async ({ page }) => {
        test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
        await loginToAdmin(page);
        const target = new DeckDeckCsvImportPage(page);
        await target.goto();
        const row = rowWithEmptyAt(key);
        await target.uploadContent(`require_${key}.csv`, INPUT_HEADER + "\n" + row + "\n");
        await expect(target.errorAlert).toContainText(ERR_REQUIRE); // 判定順序#4（必須論理キー md:159）
        await expect(page).toHaveURL(IMPORT_RE);
      });
    }

    // ===== 保留（刷新差分／要row整備／要実機／要MASTERシード／刷新追加。手動・対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M15-06-070 main_list 空→必須エラー（条件付き必須: private_flg が非公開特例のときのみ必須解除 md:78,159,165。private_flg=公開側で main_list 空を必須化させる row 整備が必要）",
      async () => {
        // 期待は判定順序#4（必須論理キー md:159）由来。main_list は private_flg の非公開特例で必須が外れる分岐があるため
        // private_flg を公開側にした行で main_list 空を作り、ERR_REQUIRE を確認する。二値写像の有効値整備後に実装。
        void ERR_REQUIRE;
      }
    );

    test.fixme(
      "E2E-M15-06-071 厳密チェック(strict)オン/オフでリスト異常種別の昇格が変わる（旧仕様 md:130,166。刷新先は strict UI/機能欠落＝付帯表4#7。手動/旧仕様照合）",
      async () => {
        // 期待は業務ルール（厳密オンで禁止・制限超過を昇格／オフで継続し得る md:166）由来。
        // 刷新先テンプレートに strict チェックボックスが無く（付帯表4#7）自動操作不可のため、手動で旧仕様との対を確認する。
      }
    );

    test.fixme(
      "E2E-M15-06-030 ヘッダ列順入替/内容不一致→ヘッダ形式エラー（刷新差分: 刷新先 CsvImporter は厳密一致せず論理キー解決のため format.header を出さない 付帯表4#3,#8）",
      async () => {
        // 期待は設計「並びだけ誤ればヘッダ比較で即拒否」(md:177)＝admin.csv.error.format.header 由来（上位オラクル）。
        // 刷新先は列内容不一致時に require/master 系エラーへ分岐するため、乖離を実機確認後に確定する。
        void ERR_HEADER;
      }
    );

    test.fixme(
      "E2E-M15-06-040 実在しないフォーマット英名→マスタ未取得エラー（要: 全必須列充足かつ disp_flg/private_flg/event_date を有効値にしてマスタ照合へ到達させる row 整備）",
      async () => {
        // 期待は判定順序#4(フォーマット英名マスタ必須 admin.csv.error.data.not_registered :2214 / DeckUpdateImportHandler.php:119-121)由来。
        // disp_flg/private_flg の二値一致・event_date のパース可否が先行するため、それらを満たす行整備後に実装。
        void ERR_MASTER;
      }
    );

    test.fixme(
      "E2E-M15-06-031 ファイル未選択で送信→ファイル必須（要実機: #upload-button は初期 disabled で通常UIから空送信不可）",
      async () => {
        // 期待はバリデーション(ファイル NotBlank CsvImportType.php:52-53／admin.csv.error.upload.require :1427)由来。
        // JS活性化(twig:55-61)を介さず空POSTを強制する手順を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M15-06-050 正しいCSV取込成功→成功フラッシュ＋取込画面へリダイレクト（要: SEED-M15-06-MASTER 実在 mtb_format/dtb_archetype/dtb_event_detail・有効カードリスト）",
      async () => {
        // 期待は処理フロー#17-18(成功フラッシュ＋取込GETへリダイレクト md:94,244)由来。実在マスタ・有効カードリストを満たすCSVと
        // 参照マスタ整備後に実装。合否は「成功フラッシュ表示＋取込GETへ収束」で判定し、文言キー一致(admin.register.complete vs
        // 刷新先 admin.common.csv_upload_complete)は期待値に固定しない＝付帯表4#4 として要確認（オラクル独立性）。
      }
    );

    test.fixme(
      "E2E-M15-06-080 上限(5010)行超過CSV→行数上限エラー（要: 大容量CSV・刷新追加分 付帯表4・上限値は基本設計を正とし要確認）",
      async () => {
        // 期待はバリデーション(行数上限 admin.csv.error.upload.maxrecord :1429 / AbstractController.php:364 ADMIN_CSV_IMPORT_MAX_ROWS=5010)由来。
        // 旧設計に上限規定なし＝刷新追加（試行制限 md:262-263）。
      }
    );
  }
);
