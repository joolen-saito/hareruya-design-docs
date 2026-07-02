/**
 * 管理画面 商品編集 E2E。納品ケース表 integration_test/e2e/m03_02_admin_product_product_edit_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装し、要シード/要実機の 060・061 は test.fixme（理由付き）。
 * 手動/間接・対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約準拠）。
 * 期待結果は仕様(設計書 functions/pf-eccube3/m03-02_admin_product_product_edit.md / 観点表)由来（オラクル独立性）。
 * 設計源は pf-eccube3 のリバースであり、刷新先 ec-cube-enterprise との乖離は付帯表4（不具合候補）に分離する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 *
 * シード（環境変数。コミットしない）:
 *  - PRODUCT_ID            : SEED-M03-02-PRODUCT（規格あり・全必須入力済の編集可能な既存商品ID）
 *  - PRODUCT_NO_CLASS_ID   : SEED-M03-02-NO-CLASS（規格を持たない商品ID。ステータス欄表示切替の確認用）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductEditPage } from "../../../pages/admin/m03/m03_02_admin_product_product_edit.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const PRODUCT_ID = process.env.PRODUCT_ID || "";
const HAS_PRODUCT = HAS_CREDS && !!PRODUCT_ID;

const HOME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/?(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;
const EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/product/\\d+/edit`);
const CLASS_LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/product/\\d+/class`);

// 仕様(設計書「表示メッセージ/フラッシュ」)由来の成功フラッシュ文言。実装に合わせて変えない（オラクル独立性）。
// 設計は「登録が完了しました。」(キー admin.register.complete)。刷新先実装は別キー(付帯表4#1=不具合候補)。
const SUCCESS_FLASH = "登録が完了しました。";

/** 管理ログインしてホームへ到達する。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).toHaveURL(HOME_RE);
}

test.describe(
  "管理画面 > 商品編集",
  { tag: ["@admin", "@product"] },
  () => {
    // ===== 未認証（資格情報不要・非破壊） =====

    test("E2E-M03-02-050 未ログインで商品編集URL直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      // 期待は仕様(権限・認可: 未ログインは管理ログイン誘導／IT-15 未認証・IT-13 URL直接アクセス)由来。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/product/1/edit`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M03-02-051 未ログインでは商品編集フォームを利用できない", async ({ page }) => {
      // 期待は仕様(権限・認可)由来。編集画面へ到達できないため基本情報フォームは存在しない。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/product/1/edit`);
      await expect(page.locator("#admin_product_name")).toHaveCount(0);
    });

    // ===== 表示（HAS_PRODUCT: 資格情報＋編集可能な商品ID） =====

    test("E2E-M03-02-001 編集画面に基本情報カード・フリーエリアカード・登録ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_PRODUCT, "ECCUBE_ADMIN_USER/PASS または PRODUCT_ID 未設定");
      await loginToHome(page);
      const edit = new ProductProductEditPage(page);
      await edit.goto(PRODUCT_ID);
      await edit.seeEditForm();
    });

    test("E2E-M03-02-002 更新時(既存商品)の編集画面に商品IDが表示される", async ({ page }) => {
      test.skip(!HAS_PRODUCT, "PRODUCT_ID 未設定");
      await loginToHome(page);
      const edit = new ProductProductEditPage(page);
      await edit.goto(PRODUCT_ID);
      // 設計「商品IDは更新時のみ表示する」。値が当該IDと一致することまで確認する。
      await expect(edit.productIdValue).toContainText(String(PRODUCT_ID));
    });

    test("E2E-M03-02-003 商品名・商品名(英)欄に現行値が初期表示される", async ({ page }) => {
      test.skip(!HAS_PRODUCT, "PRODUCT_ID 未設定");
      await loginToHome(page);
      const edit = new ProductProductEditPage(page);
      await edit.goto(PRODUCT_ID);
      // 設計「指定IDの商品本体と商品付加情報を読み込み、基本情報フォームに現行値を載せて表示」。
      await expect(edit.name).toBeVisible();
      await expect(edit.name).not.toHaveValue(""); // 既存商品名が初期値として載る
      await expect(edit.nameEn).toBeVisible();
    });

    test("E2E-M03-02-004 カード指定ボタンでカード検索モーダルが開く", async ({ page }) => {
      test.skip(!HAS_PRODUCT, "PRODUCT_ID 未設定");
      await loginToHome(page);
      const edit = new ProductProductEditPage(page);
      await edit.goto(PRODUCT_ID);
      // 設計「カード指定ボタンでカード検索モーダルを開く」。
      // 刷新先は Product.CardDetail が登録済みの既存商品ではカード指定ボタンが disabled になる
      //（product.twig:172 isSingleCardReadonly）。本ケースは「カード詳細未登録」のSEED商品が前提。
      await expect(edit.cardSelectButton.first()).toBeEnabled();
      await edit.cardSelectButton.first().click();
      await expect(edit.cardSearchModal).toBeVisible();
    });

    test("E2E-M03-02-005 削除ボタンで削除確認モーダルが表示される", async ({ page }) => {
      test.skip(!HAS_PRODUCT, "PRODUCT_ID 未設定");
      await loginToHome(page);
      const edit = new ProductProductEditPage(page);
      await edit.goto(PRODUCT_ID);
      // 設計「複製・削除ボタンは確認ダイアログ文言を伴う」。
      await edit.deleteButton.first().click();
      await expect(edit.deleteModal).toBeVisible();
    });

    test("E2E-M03-02-006 編集画面の右カラムに商品ステータス欄・操作ボタン・ショップ用メモ欄が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_PRODUCT, "PRODUCT_ID 未設定");
      await loginToHome(page);
      const edit = new ProductProductEditPage(page);
      await edit.goto(PRODUCT_ID);
      // 設計「フロント挙動/表示要素: 右カラムに商品ステータス・各操作ボタン・登録日／更新日・ショップ用メモ欄を表示」。
      // 規格ありSEED商品ではステータス欄が表示される（規格有無での表示切替は060で別途検証）。
      await expect(edit.status).toBeVisible();
      await expect(edit.note).toBeVisible();
      await expect(edit.productClassLink.first()).toBeVisible();
      await expect(edit.deleteButton.first()).toBeVisible();
    });

    // ===== 画面遷移（HAS_PRODUCT） =====

    test("E2E-M03-02-010 規格設定リンク押下→商品規格一覧へ遷移", async ({ page }) => {
      test.skip(!HAS_PRODUCT, "PRODUCT_ID 未設定");
      await loginToHome(page);
      const edit = new ProductProductEditPage(page);
      await edit.goto(PRODUCT_ID);
      // 設計「規格設定ボタン→商品規格一覧（M03-09）」。data-action=confirm の確認は実機UI依存のため遷移先で判定。
      const href = await edit.productClassLink.first().getAttribute("href");
      expect(href, "規格設定リンクは商品規格一覧へ").toMatch(CLASS_LIST_RE);
    });

    test("E2E-M03-02-011 確認ボタンはフロント商品表示(別タブ)へのリンクである", async ({ page }) => {
      test.skip(!HAS_PRODUCT, "PRODUCT_ID 未設定");
      await loginToHome(page);
      const edit = new ProductProductEditPage(page);
      await edit.goto(PRODUCT_ID);
      // 設計「確認ボタン→フロント商品表示（別タブ）」。
      await expect(edit.confirmFrontLink.first()).toHaveAttribute("target", "_blank");
      const href = await edit.confirmFrontLink.first().getAttribute("href");
      expect(href, "確認ボタンはフロント商品詳細へ").toMatch(/\/products\/detail\//);
    });

    test("E2E-M03-02-012 商品検索に戻るリンクが商品一覧へ遷移する", async ({ page }) => {
      test.skip(!HAS_PRODUCT, "PRODUCT_ID 未設定");
      await loginToHome(page);
      const edit = new ProductProductEditPage(page);
      await edit.goto(PRODUCT_ID);
      // 設計「商品検索に戻るリンク→商品検索一覧」。
      // 編集URL(/product/product/{id}/edit)へ部分一致しないよう、一覧URL(末尾 or /page/{n})に限定する。
      await edit.backToListLink.first().click();
      await expect(page).toHaveURL(
        new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product(/page/\\d+)?(\\?|$)`)
      );
    });

    // ===== 更新（成功・HAS_PRODUCT） =====

    test("E2E-M03-02-020 現行値のまま登録(更新)すると成功フラッシュが表示される", async ({ page }) => {
      test.skip(!HAS_PRODUCT, "PRODUCT_ID 未設定");
      await loginToHome(page);
      const edit = new ProductProductEditPage(page);
      await edit.goto(PRODUCT_ID);
      // 現行値は初期表示済のため、無変更で送信すれば検証に合格し更新成功する想定。
      await edit.submit();
      // 期待は設計「登録が完了しました。」(admin.register.complete)由来。
      // 刷新先実装は別メッセージキーのため失敗する見込み＝不具合候補#1を検出する（期待値は仕様どおりに保持）。
      await expect(page.locator(".alert, .ec-alert, #ex-alert")).toContainText(SUCCESS_FLASH);
    });

    test("E2E-M03-02-021 更新成功後は同じ商品の編集画面へ戻る", async ({ page }) => {
      test.skip(!HAS_PRODUCT, "PRODUCT_ID 未設定");
      await loginToHome(page);
      const edit = new ProductProductEditPage(page);
      await edit.goto(PRODUCT_ID);
      await edit.submit();
      // 設計「更新成功→GET /{admin_route}/product/product/{id}/edit（同じ商品の編集画面）」。
      await expect(page).toHaveURL(EDIT_RE);
      await expect(page).toHaveURL(new RegExp(`/product/product/${PRODUCT_ID}/edit`));
    });

    test("E2E-M03-02-022 更新した値が保存され再表示で反映される（DB更新の間接確認）", async ({ page }) => {
      test.skip(!HAS_PRODUCT, "PRODUCT_ID 未設定");
      await loginToHome(page);
      const edit = new ProductProductEditPage(page);
      await edit.goto(PRODUCT_ID);
      // 設計「処理フロー(更新): 商品本体と商品付加情報を永続化し、更新日時を現在時刻にして確定する」。
      // DB直接確認はできないため、ブラウザ観測可能な「編集画面の再表示で更新値が初期値に載る」で間接確認する。
      // 副作用の小さいショップ用メモ(note 任意項目)を一意マーカーで更新→再GETして反映を判定する。
      const marker = `E2E-M03-02-022 ${Date.now()}`;
      await edit.note.fill(marker);
      await edit.submit();
      await expect(page).toHaveURL(EDIT_RE);
      // 再表示（別リクエスト）で永続化された値が初期値として読み込まれること。
      await edit.goto(PRODUCT_ID);
      await expect(edit.note).toHaveValue(marker);
    });

    // ===== バリデーション（異常系・HAS_PRODUCT） =====

    test("E2E-M03-02-030 商品名を空で更新するとエラーで同じ編集画面に滞留する", async ({ page }) => {
      test.skip(!HAS_PRODUCT, "PRODUCT_ID 未設定");
      await loginToHome(page);
      const edit = new ProductProductEditPage(page);
      await edit.goto(PRODUCT_ID);
      // 設計「バリデーション: 商品名 NotBlank」「検証失敗→同じ編集画面を200で再表示」。
      await edit.name.fill("");
      await edit.submit();
      await expect(page).toHaveURL(EDIT_RE); // 同じ編集画面に滞留
      await expect(edit.name).toBeVisible(); // フォーム再描画（入力値とエラーを保持）
      // 商品名フィールド直下のエラーを確認（他フィールドの警告で誤検出しない）。
      await expect(edit.fieldErrors(edit.name).first()).toBeVisible();
    });

    test("E2E-M03-02-031 商品名(英)を空で更新するとエラーで同じ編集画面に滞留する", async ({ page }) => {
      test.skip(!HAS_PRODUCT, "PRODUCT_ID 未設定");
      await loginToHome(page);
      const edit = new ProductProductEditPage(page);
      await edit.goto(PRODUCT_ID);
      // 設計「バリデーション: 商品名(英) NotBlank」。
      // 注: 刷新先 ProductType は name_en に Length のみで NotBlank が無い（付帯表4#7）。
      //     期待値は仕様(NotBlank)どおりに保持し、実装乖離があれば本ケースが失敗で検出する。
      await edit.nameEn.fill("");
      await edit.submit();
      await expect(page).toHaveURL(EDIT_RE);
      await expect(edit.fieldErrors(edit.nameEn).first()).toBeVisible();
    });

    test("E2E-M03-02-032 商品カテゴリ未選択で更新するとエラーで同じ編集画面に滞留する", async ({ page }) => {
      test.skip(!HAS_PRODUCT, "PRODUCT_ID 未設定");
      await loginToHome(page);
      const edit = new ProductProductEditPage(page);
      await edit.goto(PRODUCT_ID);
      // 設計「バリデーション: 商品カテゴリ NotBlank（複数選択で1件以上）」「エッジケース: 商品カテゴリ未選択→検証失敗」。
      await edit.uncheckAllCategories();
      await edit.submit();
      await expect(page).toHaveURL(EDIT_RE);
      await expect(edit.errors.first()).toBeVisible();
    });

    test("E2E-M03-02-033 サイズを空で更新するとエラーで同じ編集画面に滞留する", async ({ page }) => {
      test.skip(!HAS_PRODUCT, "PRODUCT_ID 未設定");
      await loginToHome(page);
      const edit = new ProductProductEditPage(page);
      await edit.goto(PRODUCT_ID);
      // 設計「バリデーション: サイズ NotBlank / Length max9 / 0..999999999」。
      await edit.size.fill("");
      await edit.submit();
      await expect(page).toHaveURL(EDIT_RE);
      await expect(edit.fieldErrors(edit.size).first()).toBeVisible();
    });

    test("E2E-M03-02-034 重量を空で更新するとエラーで同じ編集画面に滞留する", async ({ page }) => {
      test.skip(!HAS_PRODUCT, "PRODUCT_ID 未設定");
      await loginToHome(page);
      const edit = new ProductProductEditPage(page);
      await edit.goto(PRODUCT_ID);
      // 設計「バリデーション: 重量 NotBlank / Length max9 / 0..999999999」。
      await edit.weight.fill("");
      await edit.submit();
      await expect(page).toHaveURL(EDIT_RE);
      await expect(edit.fieldErrors(edit.weight).first()).toBeVisible();
    });

    // ===== エラー処理（HAS_CREDS） =====

    test("E2E-M03-02-040 存在しない商品IDの編集画面は見つからない(HTTP404)", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const edit = new ProductProductEditPage(page);
      // 設計「商品が存在しなければ見つからない（HTTP404）」。十分大きいIDで不存在を作る。
      const res = await edit.goto(99999999);
      expect(res?.status(), "不存在商品は404").toBe(404);
    });

    // ===== 自動化予定だが要シード/要実機（未実装。手動/対象外はケース表で管理） =====

    test.fixme(
      "E2E-M03-02-060 商品ステータス欄は規格が1件以上ある商品のみ表示され規格なしは非表示（要: 規格あり/なしのシード商品・刷新先表示条件の乖離=付帯表4#2）",
      async () => {
        // 期待は設計(フロント挙動「商品ステータス欄は規格が1件以上ある場合のみ表示」)由来。
        // 刷新先は表示条件が異なる可能性があり（Product.Status!=廃止で表示・付帯表4#2）、
        // PRODUCT_ID(規格あり)と PRODUCT_NO_CLASS_ID(規格なし)を用意し表示/非表示の差を検証する。
      }
    );

    test.fixme(
      "E2E-M03-02-061 商品画像追加XHRはXHR以外/ファイルなし/非画像MIMEを拒否する（要: 画像追加XHRの直接呼び出し検証）",
      async () => {
        // 期待は設計(エラー処理「XHR以外=400/ファイルなし=400/非画像MIME=415」)由来。
        // ブラウザUIのD&Dアップロード経路ではHTTPステータスの直接観測が難しく、APIリクエスト検証として実機確認後に実装。
        // 乖離(付帯表4#8): 正典ルートは /image/add だが刷新先は /image/process。
        //   かつ刷新先の不正判定は「!isXmlHttpRequest() && isTokenValid()」で、XHR以外が常に400とは限らない。
        //   期待値は仕様どおりに保持し、ルート/判定条件の乖離は付帯表4に分離（テストを実装へ寄せない）。
      }
    );

    test.fixme(
      "E2E-M03-02-062 画像追加XHRに画像ファイルを正しく送ると一時保存されファイル名一覧がJSONで返る（061の正常系の対。要API検証）",
      async () => {
        // 期待は設計(処理フロー「商品画像を追加する」手順4: 元拡張子を保ったユニークなファイル名で一時保存し、
        // ファイル名一覧をJSONで返す)由来。061(異常系: XHR以外400/ファイルなし400/非画像415)の正常系の対。
        // 乖離(付帯表4#8): 正典ルート /image/add に対し刷新先は /image/process。期待値は仕様どおりに保持する。
      }
    );

    // ===== 手動（要シード/要フォーム改変。ケース表で全量管理しspecには実装しない） =====
    // E2E-M03-02-035/036/038 割引率/販売制限/購入グループ 必須異常系: EntityType/ラジオの未入力化がUIで困難、
    //   かつ刷新先実装でNotBlank欠落（付帯表4#11）。期待値は仕様(NotBlank/必須)どおり。手動で検証する。
    // E2E-M03-02-037 商品ステータス 必須異常系: 設計・実装ともNotBlank。セレクト未選択化は要実機確認のため手動。
    // E2E-M03-02-052 権限なしログイン済み拒否: 商品管理権限を持たない管理者シードが必要なため手動。
    //   いずれもケース表(付帯表1/2b/5)で分類・根拠を管理し、specに大量のfixmeを残さない（規約準拠）。
  }
);
