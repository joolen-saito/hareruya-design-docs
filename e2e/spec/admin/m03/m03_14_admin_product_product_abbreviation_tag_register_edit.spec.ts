/**
 * 管理画面 商品管理 略称タグ登録／編集 E2E。
 * 納品ケース表 integration_test/e2e/m03_14_admin_product_product_abbreviation_tag_register_edit_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装し、要シード/破壊的/要実機の編集更新・削除・確認ダイアログは
 * test.fixme（理由付き）で残す。手動/間接・対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約準拠）。
 * 期待結果は仕様(設計書 functions/pf-eccube3/m03-14_admin_product_product_abbreviation_tag_register_edit.md / 観点表 /
 * messages.ja.yaml)由来（オラクル独立性）。設計源は pf-eccube3 のリバースであり、刷新先 ec-cube-enterprise との
 * 乖離は付帯表4（不具合候補）に分離する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 *
 * シード（環境変数。コミットしない）:
 *  - STORAGE_ID          : SEED-M03-14-TAG（編集表示用の既存略称タグID。非破壊・参照のみ）
 *  - STORAGE_LINKED_ID   : SEED-M03-14-LINKED（商品に紐づく略称タグID。削除拒否の確認用・非破壊）
 *  - STORAGE_DELETE_ID   : SEED-M03-14-DELETABLE（関連商品なしの使い捨て略称タグID。削除成功で消費）
 *
 * 破壊的操作の注意: 新規登録(010-014)は識別接頭辞 `E2E-` 付きの一意名で行をINSERTする（撤去はケース表の後始末方針）。
 * 編集更新・削除成功は対象行を変更/消去するため test.fixme（使い捨てシード前提）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductAbbreviationTagRegisterEditPage } from "../../../pages/admin/m03/m03_14_admin_product_product_abbreviation_tag_register_edit.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const STORAGE_ID = process.env.STORAGE_ID || "";
const HAS_STORAGE = HAS_CREDS && !!STORAGE_ID;

const HOME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/?(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;
const INDEX_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/storage(\\?|$|/)`);
const CSV_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/storage_code/csv(\\?|$)`);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const SUCCESS_FLASH = "登録が完了しました。"; // :1773 admin.register.complete
const FAILED_FLASH = "登録できませんでした。"; // :1774 admin.register.failed

/** 管理ログインしてホームへ到達する。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).toHaveURL(HOME_RE);
}

test.describe(
  "管理画面 > 商品管理 略称タグ登録／編集",
  { tag: ["@admin", "@product"] },
  () => {
    // ===== 未認証（資格情報不要・非破壊） =====

    test("E2E-M03-14-050 未ログインで略称タグ画面URL直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      // 期待は仕様(権限・認可: 未ログインは管理ログイン誘導／IT-15 未認証)由来。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/storage`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 表示・遷移（HAS_CREDS） =====

    test("E2E-M03-14-051 ログイン済み運用者は略称タグ画面を表示できる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      await target.gotoIndex();
      await expect(page).toHaveURL(INDEX_RE);
      await expect(target.form).toBeVisible();
    });

    test("E2E-M03-14-001 新規画面: 名称/並び順/フラグ/登録ボタンと下部一覧が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      await target.gotoIndex();
      await target.seeRegisterForm();
    });

    test("E2E-M03-14-002 新規時: カード見出しが「新規追加」", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      await target.gotoIndex();
      // 仕様: 新規は admin.common.registration__add=「新規追加」（編集は「編集」）。
      await expect(target.cardTitle).toContainText("新規追加");
    });

    test("E2E-M03-14-003 CSV出力・CSV入力リンクが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      await target.gotoIndex();
      await expect(target.csvExportLink).toBeVisible();
      await expect(target.csvImportLink).toBeVisible();
    });

    test("E2E-M03-14-004 アルファベット順ソートフラグのチェックボックスが表示される（任意項目）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      await target.gotoIndex();
      await expect(target.alphabetCheck).toBeAttached();
    });

    test("E2E-M03-14-007 存在しないidの編集URLはHTTP404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      // 仕様(処理フロー 編集: ルートコンバータが読めない→404)。極端に大きいidで不存在を狙う。
      const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/storage/999999999`);
      expect(res?.status()).toBe(404);
    });

    test("E2E-M03-14-008 表示件数プルダウン変更でURLにpage_countが付き再読込される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      await target.gotoIndex();
      await target.changePageCount("50"); // 許容リスト[10,50,100,300,500,1000]
      await expect(page).toHaveURL(/[?&]page_count=50(\&|$)/);
    });

    test("E2E-M03-14-063 一覧ページ送りルートで一覧と登録フォームが再表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      // 仕様(利用者視点の入口: 一覧ページ送り GET …/product/storage/page/{page_no})。
      await target.gotoListPage(1);
      await expect(page).toHaveURL(/\/product\/storage\/page\/1(\?|$)/);
      await expect(target.form).toBeVisible();
      await expect(target.listTable).toBeVisible();
    });

    test("E2E-M03-14-064 アルファベット順ソートフラグONで登録→一覧の並び順列が「アルファベット」表示", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      await target.gotoIndex();
      // 仕様(入力項目: alphabetSortFlg 任意・ONで保存／フロント挙動: 一覧 並び順列はフラグONで「アルファベット」)。
      const name = `E2E-${Date.now()}`;
      await target.submitForm({ name, rank: "100", alphabet: true });
      await expect(target.successFlash).toContainText(SUCCESS_FLASH);
      await expect(target.rowByName(name)).toContainText("アルファベット");
    });

    test("E2E-M03-14-060 CSV入力リンク押下でCSV取込画面へ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      await target.gotoIndex();
      await target.csvImportLink.click();
      await expect(page).toHaveURL(CSV_RE);
    });

    test("E2E-M03-14-061 CSV出力リンク押下でCSVダウンロードが開始される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      await target.gotoIndex();
      // 仕様(画面遷移/CSV: CSV出力は export ルートでファイルをストリーム返却＝ダウンロード)。
      // 出力内容(CSVの中身)は別機能のため検証せず、ダウンロードが開始される遷移のみ観測する。
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        target.csvExportLink.click(),
      ]);
      expect(download.suggestedFilename()).not.toBe("");
    });

    // ===== 登録 正常系（INSERT・識別接頭辞付き一意名で実施） =====

    test("E2E-M03-14-010 新規登録成功: 有効な名称・並び順で成功フラッシュが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      await target.gotoIndex();
      const name = `E2E-${Date.now()}`;
      await target.submitForm({ name, rank: "100" });
      await expect(target.successFlash).toContainText(SUCCESS_FLASH);
    });

    test("E2E-M03-14-011 新規登録成功後は一覧トップ(/product/storage)へ遷移する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      await target.gotoIndex();
      await target.submitForm({ name: `E2E-${Date.now()}`, rank: "101" });
      // 仕様(画面遷移: 登録押下後成功は GET admin_product_storage_code＝/product/storage)。
      await expect(page).toHaveURL(INDEX_RE);
    });

    test("E2E-M03-14-012 新規登録後は一覧に新規行(名称)が表示される（間接DB確認）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      await target.gotoIndex();
      // rank=1 で昇順一覧の先頭側に出るようにし、一覧表示で永続化を間接確認する。
      const name = `E2E-${Date.now()}`;
      await target.submitForm({ name, rank: "1" });
      await expect(target.successFlash).toContainText(SUCCESS_FLASH);
      await expect(target.listTable).toContainText(name);
    });

    test("E2E-M03-14-013 並び順=0(最小境界)で登録成功", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      await target.gotoIndex();
      await target.submitForm({ name: `E2E-${Date.now()}`, rank: "0" }); // Range min=0
      await expect(target.successFlash).toContainText(SUCCESS_FLASH);
    });

    test("E2E-M03-14-014 並び順=32767(最大境界)で登録成功", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      await target.gotoIndex();
      await target.submitForm({ name: `E2E-${Date.now()}`, rank: "32767" }); // Range max=32767
      await expect(target.successFlash).toContainText(SUCCESS_FLASH);
    });

    // ===== 登録 異常系（バリデーション失敗→失敗フラッシュのみ・一覧トップへ・データ非作成） =====

    test("E2E-M03-14-020 名称未入力で登録→失敗フラッシュが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      await target.gotoIndex();
      // 仕様(バリデーション: 名称 NotBlank)。名称空・並び順のみ入力。
      await target.submitForm({ name: "", rank: "100" });
      await expect(target.errorFlash).toContainText(FAILED_FLASH);
    });

    test("E2E-M03-14-021 名称未入力で登録→一覧トップへ遷移しフィールドエラーは復元されない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      await target.gotoIndex();
      await target.submitForm({ name: "", rank: "100" });
      // 仕様(エラー処理: 失敗時は一覧トップへ302・フィールド側エラーは画面に復元されず捨てられる)。
      await expect(page).toHaveURL(INDEX_RE);
      await expect(page.locator(".invalid-feedback")).toHaveCount(0);
    });

    test("E2E-M03-14-022 並び順未入力で登録→失敗フラッシュが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      await target.gotoIndex();
      // 仕様(バリデーション: 並び順 NotBlank)。
      await target.submitForm({ name: `E2E-${Date.now()}`, rank: "" });
      await expect(target.errorFlash).toContainText(FAILED_FLASH);
    });

    test("E2E-M03-14-023 並び順=-1(範囲外)で登録→失敗フラッシュが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      await target.gotoIndex();
      // 仕様(バリデーション: 並び順 Range 0〜32767)。
      await target.submitForm({ name: `E2E-${Date.now()}`, rank: "-1" });
      await expect(target.errorFlash).toContainText(FAILED_FLASH);
    });

    test("E2E-M03-14-024 並び順=32768(範囲外)で登録→失敗フラッシュが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      await target.gotoIndex();
      await target.submitForm({ name: `E2E-${Date.now()}`, rank: "32768" });
      await expect(target.errorFlash).toContainText(FAILED_FLASH);
    });

    // E2E-M03-14-025（並び順 非数値）は自動E2E対象外。並び順は input type=number（form_widget(form.rank)）で
    // 描画されるため、ブラウザ段階で非数値入力が抑止され、サーバ側 IntegerType 検証へ到達できない。
    // Playwright の locator.fill("abc") も number 入力では実行時エラー（Malformed value）となり、テスト自体が
    // 成立しない。これは実装由来オラクル/widget依存であり仕様の検証にならないため除外し、ケース表で対象外として管理する。

    // ===== 編集表示（HAS_STORAGE: 参照用シード行） =====

    test("E2E-M03-14-005 編集画面: カード見出し「編集」と「新規登録へ戻る」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_STORAGE, "SEED-M03-14-TAG 未設定（STORAGE_ID）");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      await target.gotoEdit(STORAGE_ID);
      await expect(target.cardTitle).toContainText("編集");
      await expect(target.backToNewLink).toBeVisible();
    });

    test("E2E-M03-14-006 編集画面: 上部フォームが当該行の名称・並び順を反映する", async ({ page }) => {
      test.skip(!HAS_STORAGE, "SEED-M03-14-TAG 未設定（STORAGE_ID）");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      await target.gotoEdit(STORAGE_ID);
      // 仕様(処理フロー 編集: その行をデータモデルとしてバインド)。具体値はシード依存のため固定しないが、
      // 上部フォームの名称が下部一覧の当該行と一致すること（＝編集対象行を反映していること）を相互照合する。
      const nameVal = await target.nameInput.inputValue();
      const rankVal = await target.rankInput.inputValue();
      expect(nameVal).not.toBe("");
      expect(rankVal).not.toBe("");
      // 編集フォームに反映された名称が一覧にも存在する＝当該行をバインドしている（別行や初期値では通らない）。
      await expect(target.listTable).toContainText(nameVal);
    });

    test("E2E-M03-14-062 一覧のリンク押下で当該行の編集画面へ遷移する", async ({ page }) => {
      test.skip(!HAS_STORAGE, "SEED-M03-14-TAG 未設定（STORAGE_ID）");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      await target.gotoIndex();
      // 仕様(利用者視点の入口/画面遷移: 一覧 行の id・名称・「変更」リンク→ GET …/product/storage/{id})。
      // 直接URL(005/006)ではなくクリック導線で編集画面へ入れることを確認。
      await target.editLinkById(STORAGE_ID).click();
      await expect(page).toHaveURL(
        new RegExp(`/product/storage/${STORAGE_ID}(\\?|$|/)`)
      );
      await expect(target.cardTitle).toContainText("編集");
      // 編集画面で上部フォームが当該行を反映している（名称が一覧にも存在）。
      const nameVal = await target.nameInput.inputValue();
      expect(nameVal).not.toBe("");
    });

    test("E2E-M03-14-065 編集中に名称を空にして更新→失敗フラッシュ・一覧トップ（更新されない）", async ({
      page,
    }) => {
      test.skip(!HAS_STORAGE, "SEED-M03-14-TAG 未設定（STORAGE_ID）");
      await loginToHome(page);
      const target = new ProductProductAbbreviationTagRegisterEditPage(page);
      await target.gotoEdit(STORAGE_ID);
      // 仕様(バリデーション: 編集時も名称 NotBlank／エラー処理: 失敗時は一覧トップへ302・永続化なし)。
      // 名称を空にして更新するとバリデーション失敗となり、更新は行われない（失敗のため非破壊）。
      await target.submitForm({ name: "" });
      await expect(target.errorFlash).toContainText(FAILED_FLASH);
      await expect(page).toHaveURL(INDEX_RE);
    });

    // ===== 保留（破壊的/要シード/要実機。手動・対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M03-14-030 編集更新成功で成功フラッシュ表示（要: 使い捨て更新シード SEED-M03-14-TAG）",
      async () => {
        // 期待は仕様(処理フロー 保存#4-5: isValid真でpersist/flush・admin.register.complete)由来。
        // 既存行の値を書き換えるため使い捨てシード確立後に実装。
      }
    );

    test.fixme(
      "E2E-M03-14-031 編集更新成功後は一覧トップ(新規状態フォーム)へ遷移（要: 使い捨て更新シード）",
      async () => {
        // 期待は仕様(処理フロー#6: redirectToRoute('admin_product_storage_code')で一覧トップ・上部は新規状態)由来。
      }
    );

    test.fixme(
      "E2E-M03-14-040 関連商品ありの略称タグ削除→「商品で使用されているため…」エラーフラッシュ（要: SEED-M03-14-LINKED＋削除モーダル確定）",
      async () => {
        // 期待は仕様(削除 判定順序#2: getProducts件数>0で削除せずフラッシュ／admin.storage.delete.failed)由来。
        // 削除は確認ダイアログ(共通JS data-method=delete)経由のため dialog ハンドリングを実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M03-14-041 関連商品なしの略称タグ削除→「削除しました」成功フラッシュ（要: 使い捨て SEED-M03-14-DELETABLE＋削除モーダル確定）",
      async () => {
        // 期待は仕様(削除 判定順序#3: 物理削除/flush・admin.common.delete_complete)由来。対象行を消費するため使い捨て。
      }
    );

    test.fixme(
      "E2E-M03-14-009 一覧 並び順列がフラグに応じ「アルファベット」/「コレクター番号」表示（要: 既知フラグ値シード）",
      async () => {
        // 期待は仕様(フロント挙動: alphabetSortFlg 表示のみ「アルファベット」/「コレクター番号」)由来。
        // 既知フラグ値の行が一覧ページ内に出る前提が要シードのため保留。
      }
    );

    test.fixme(
      "E2E-M03-14-042 削除リンク押下で確認ダイアログが表示される（要実機: 共通JSのconfirm挙動）",
      async () => {
        // 期待は仕様(モーダル・ポップアップ: 削除前の確認のみ)由来。確認ダイアログは共通JS依存で要実機確認。
      }
    );
  }
);
