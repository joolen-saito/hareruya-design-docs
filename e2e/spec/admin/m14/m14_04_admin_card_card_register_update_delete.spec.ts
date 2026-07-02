/**
 * 管理画面 カード管理 > 新規登録・編集・削除（詳細フォーム）（M14-04）E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m14_04_admin_card_card_register_update_delete_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち非破壊で安全に実行できるケースのみ test() 本体で実装する。
 * 破壊的（新規/更新の永続化・単体削除）・要シード（既存カード/商品紐付き/削除可カード）・要実機（最大長値・数値型の不正値投入）・
 * 仕様乖離（更新POST対象なし=仕様403/実装404）は test.fixme（理由付き）で残し、抜け漏れを可視化する。
 * 手動/対象外はケース表で全量管理し、spec に大量の fixme を残さない（規約）。
 * 期待結果は仕様（正本 functions/pf-eccube3/m14-04_admin_card_card_register_update_delete.md / 観点表 / 基本設計）由来（オラクル独立性）。
 * 設計源は pf-eccube3 の HareruyaEc プラグイン（リバース）であり、刷新先 ec-cube-enterprise との乖離はケース表の付帯表4（不具合候補）で管理する。
 * テストは仕様どおりに書き、実装が違えば落ちて検出する（期待値を実装へ書き換えない）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証について: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が無く、既存 spec（login.spec.ts / m11 系）も
 * @playwright/test + AdminLoginPage 直利用。本specも踏襲し、資格情報（ECCUBE_ADMIN_USER/PASS）が無ければ走らないよう
 * test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *
 * 実行方針（安全第一・共有ステージング）:
 *  - 表示・遷移（GET）・モーダル開閉キャンセル・必須未入力での非送信（新規008/009・編集014）は DB を変更せず安全に実行できる。
 *  - 新規保存(020)・編集保存(021)・詳細必須(022)・リーガリティ必須(024)・最大長(023)・数値形式(013)・削除(030/031)・
 *    削除対象なし404(032)・更新403(040)・CSRF欠落(041登録/042削除)は破壊的/要シード/要実機/要送信コンテキストのため test.fixme。
 *
 * 環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）。
 *  - CARD_ID         : SEED-M14-04-CARD（既存カード1）の id（010/011 表示・モーダル）。
 *  - CARD_ID_PRODUCT : SEED-M14-04-CARD-PRODUCT（商品紐付き詳細を持つカード）の id（012 削除不可文言）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { CardCardRegisterUpdateDeletePage } from "../../../pages/admin/m14/m14_04_admin_card_card_register_update_delete.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const CARD_ID = process.env.CARD_ID || "";
const CARD_ID_PRODUCT = process.env.CARD_ID_PRODUCT || "";

const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const NEW_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/card/new(\\?|$)`);
const EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/card/\\d+/edit(\\?|$)`);
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/card(/search/\\d+)?(\\?|$)`);

/** 管理ログインしてカード新規フォームを開く。 */
async function loginAndGotoNew(page: Page): Promise<CardCardRegisterUpdateDeletePage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const card = new CardCardRegisterUpdateDeletePage(page);
  await card.gotoNew();
  return card;
}

test.describe(
  "管理画面 > カード管理 > 新規登録・編集・削除",
  { tag: ["@admin", "@card", "@m14"] },
  () => {
    // ===== 認証不要・非破壊（未ログインガード） =====

    test("E2E-M14-04-005 未ログインでカード新規URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/card/new`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M14-04-006 未ログインでカード編集URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/card/1/edit`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 新規フォーム表示（非破壊・ログインのみ） =====

    test("E2E-M14-04-001 新規フォーム: カード名(英)・点数で見たマナコスト・登録ボタンが表示され削除リンクは無い", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const card = await loginAndGotoNew(page);
      await expect(page).toHaveURL(NEW_RE);
      await card.seeNewForm();
    });

    test("E2E-M14-04-002 新規フォーム: タイトル「カード管理」・サブタイトル「カード詳細」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const card = await loginAndGotoNew(page);
      // 仕様(pf-eccube3 フロント挙動): タイトル「カード管理」/サブタイトル「カード詳細」。
      // 刷新先は title=カード詳細・sub=カード管理 と割当が逆（付帯表4#2）。両文言の存在で観測し割当順は付帯表4で検出する。
      await expect(page.locator("body")).toContainText("カード管理");
      await expect(page.locator("body")).toContainText("カード詳細");
    });

    test("E2E-M14-04-003 新規フォーム: 基本情報カード見出し「カード新規登録:基本情報」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const card = await loginAndGotoNew(page);
      await expect(card.basicInfoTitle).toContainText("カード新規登録");
    });

    test("E2E-M14-04-004 新規フォームの「カード一覧」リンクで一覧へ戻る", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const card = await loginAndGotoNew(page);
      await card.backLink.click();
      await expect(page).toHaveURL(LIST_RE);
    });

    // ===== バリデーション（非破壊・必須未入力で非送信） =====

    test("E2E-M14-04-008 カード名(英)未入力で登録すると保存されず新規画面に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const card = await loginAndGotoNew(page);
      // 必須(NotBlank)のカード名(英)を空のまま、点数で見たマナコストのみ入力して送信。
      await card.cmc.fill("1");
      await card.submit();
      // 仕様: 必須エラーで保存されない。編集画面へリダイレクトされず新規画面に留まること。
      await expect(page).toHaveURL(NEW_RE);
      await expect(page).not.toHaveURL(EDIT_RE);
      // 仕様(保存時の判定順序#2): 同一画面にフィールドエラーを表示する。
      // 単なる送信失敗/JS抑止/通信失敗と区別するため、フィールドエラー表示まで確認する。
      await expect(card.fieldError.first()).toBeVisible();
    });

    test("E2E-M14-04-009 点数で見たマナコスト未入力で登録すると保存されず新規画面に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const card = await loginAndGotoNew(page);
      // 必須(NotBlank)の点数で見たマナコストを空のまま、カード名(英)のみ入力して送信。
      await card.nameEn.fill("E2E TEST CARD");
      await card.submit();
      // 仕様: 必須エラーで保存されない。新規画面に留まること。
      await expect(page).toHaveURL(NEW_RE);
      await expect(page).not.toHaveURL(EDIT_RE);
      // 仕様(保存時の判定順序#2): 同一画面にフィールドエラーを表示する。
      await expect(card.fieldError.first()).toBeVisible();
    });

    // ===== 既存カード編集表示・削除モーダル（要シード SEED-M14-04-CARD・非破壊） =====

    test("E2E-M14-04-010 既存カード編集フォーム: 既存値が表示され削除リンクが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!CARD_ID, "SEED-M14-04-CARD 未設定（CARD_ID）");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
      const card = new CardCardRegisterUpdateDeletePage(page);
      await card.gotoEdit(CARD_ID);
      await expect(page).toHaveURL(EDIT_RE);
      await expect(card.nameEn).not.toHaveValue(""); // 既存のカード名(英)が埋まっている
      await expect(card.basicInfoTitle).toContainText("カード編集");
      await expect(card.deleteTrigger).toBeVisible(); // 編集時は削除リンクあり
    });

    test("E2E-M14-04-011 削除モーダルを開いてキャンセルしても削除されず編集画面に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!CARD_ID, "SEED-M14-04-CARD 未設定（CARD_ID）");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
      const card = new CardCardRegisterUpdateDeletePage(page);
      await card.gotoEdit(CARD_ID);
      await card.openDeleteModal();
      await card.deleteCancel.click();
      await expect(page).toHaveURL(EDIT_RE); // キャンセルで削除されず編集画面に留まる
    });

    test("E2E-M14-04-014 編集でカード名(英)を空にして更新→検証エラーで保存されず編集画面に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!CARD_ID, "SEED-M14-04-CARD 未設定（CARD_ID）");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
      const card = new CardCardRegisterUpdateDeletePage(page);
      await card.gotoEdit(CARD_ID);
      // 必須(NotBlank)のカード名(英)を空にして更新送信（更新成功021の異常系対）。
      await card.nameEn.fill("");
      await card.submit();
      // 仕様(保存時の判定順序#2): 検証エラーで保存されず、編集画面(同一POST経路の再描画)に留まる。
      await expect(page).toHaveURL(EDIT_RE);
      await expect(card.fieldError.first()).toBeVisible();
    });

    // ===== 商品紐付き詳細の削除不可表示（要シード SEED-M14-04-CARD-PRODUCT・非破壊） =====

    test("E2E-M14-04-012 商品紐付き詳細は削除ボタンを出さず削除不可の説明文を表示する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!CARD_ID_PRODUCT, "SEED-M14-04-CARD-PRODUCT 未設定（CARD_ID_PRODUCT）");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
      const card = new CardCardRegisterUpdateDeletePage(page);
      await card.gotoEdit(CARD_ID_PRODUCT);
      // 仕様: 商品規格に引用された詳細は「この詳細情報を削除」ボタンを出さず説明文のみ表示。
      await expect(card.undeletableNote).toBeVisible();
    });

    // ===== 編集GETで対象なし→HTTP 404（非破壊） =====

    test("E2E-M14-04-007 存在しないIDの編集フォーム表示はHTTP 404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
      const card = new CardCardRegisterUpdateDeletePage(page);
      const res = await card.gotoEditRaw(999999999);
      // 仕様: 編集表示対象が存在しないと HTTP 404。
      expect(res?.status()).toBe(404);
    });

    // ===== 保留（破壊的/要シード/要実機/仕様乖離。理由付き未実行・抜け漏れ可視化） =====

    test.fixme(
      "E2E-M14-04-020 新規保存成功→編集画面へ遷移＋登録完了フラッシュ（要: 永続化レコードの後始末／SEED-M14-04-MASTER）",
      async () => {
        // 期待は仕様(処理フロー 新規保存→GET /card/{新ID} ＋登録完了フラッシュ)由来。
        // 刷新先のフラッシュ文言は admin.common.save_complete=「保存しました」（付帯表4#3）。.alert-success の表示と EDIT_RE 遷移で観測する。
        // カード作成は破壊的のため、識別接頭辞付きデータ＋削除での後始末を実装後に有効化する。
      }
    );

    test.fixme(
      "E2E-M14-04-021 編集保存成功→同編集画面＋完了フラッシュ（要: SEED-M14-04-CARD・原状復帰）",
      async () => {
        // 期待は仕様(更新成功→同 GET /card/{id} ＋完了フラッシュ)由来。編集は既存値を書き換えるため復帰手順を実装後に有効化。
      }
    );

    test.fixme(
      "E2E-M14-04-022 詳細行追加で必須(レアリティ/レイアウト/プロモ種別)未選択→検証エラーで保存されない（要: マスタ存在＋詳細追加JS）",
      async () => {
        // 期待は仕様(入力項目: レアリティ/レイアウト/プロモ種別は必須)由来。#add-detail で行追加後 未選択送信→.invalid-feedback。
      }
    );

    test.fixme(
      "E2E-M14-04-023 カード名(英)が最大長超過→検証エラーで保存されない（要実機: 最大長値はプラグインconfig依存）",
      async () => {
        // 期待は仕様(入力項目: カード名は最大255文字)由来。max+1 文字投入→保存されないこと。最大長値は環境のconfig確認後に確定。
      }
    );

    test.fixme(
      "E2E-M14-04-030 単体削除成功→一覧へ遷移＋削除完了フラッシュ（要: SEED-M14-04-CARD-DELETABLE・使い捨て）",
      async () => {
        // 期待は仕様(削除成功→検索一覧/一覧 へ遷移＋削除完了フラッシュ)由来。刷新先フラッシュは admin.common.delete_complete=「削除しました」（付帯表4#3）。
        // 削除は破壊的のため、デッキ採用・商品紐付きの無い使い捨てカードを投入して実行する。
      }
    );

    test.fixme(
      "E2E-M14-04-031 削除ブロック（デッキ採用/未削除商品参照）→エラーフラッシュで参照元へ戻る（要: SEED-M14-04-CARD-PRODUCT）",
      async () => {
        // 期待は仕様(削除不可条件→エラーメッセージしリファラへ)由来。刷新先メッセージは admin.card.delete.error_foreign_key（付帯表4#4）。
        // .alert-danger の表示と削除されないこと（編集/一覧へ戻る）で観測する。
      }
    );

    test.fixme(
      "E2E-M14-04-013 点数で見たマナコストが非数値形式→検証エラーで保存されない（要実機: html5 number欄の入力可否はブラウザ/実装依存）",
      async () => {
        // 期待は仕様(業務ルール: 点数で見たマナコストは整数または小数の数値形式)由来。
        // カード名(英)は有効値、cmc に非数値(整数/小数以外)を投入し送信→保存されず同画面に留まり .invalid-feedback 表示。
        // #admin_card_cmc は html5 number 欄のため非数値の投入可否が実機依存。挙動確認のうえ有効化する。
      }
    );

    test.fixme(
      "E2E-M14-04-041 CSRFトークン欠落の登録POSTは拒否され保存されない（要: 認証済リクエストコンテキスト）",
      async () => {
        // 期待は仕様(保存時の判定順序#1: CSRF無効→アクセス拒否)由来。
        // APIRequestContext で _token を欠落させた登録POSTを送り、成功遷移/保存されず拒否されることを観測する。
        // 期待ステータス値は実装に固定しない（成功でないこと＝拒否、で判定する）。
      }
    );

    test.fixme(
      "E2E-M14-04-040 更新POSTで対象カードが存在しない→仕様はHTTP403（実装は404・付帯表4#5）",
      async () => {
        // 期待は仕様(エラー処理: 更新対象カードが存在しない=HTTP403)由来。刷新先は ParamConverter により404になるため、
        // テストは仕様どおり403を期待し、乖離を落として検出する（期待値を実装側404へ書き換えない）。
      }
    );

    test.fixme(
      "E2E-M14-04-024 リーガリティ行のフォーマット/制限区分が未選択→検証エラーで保存されない（要: マスタ存在＋リーガリティ追加JS）",
      async () => {
        // 期待は仕様(入力項目: リーガリティの各行 フォーマット/制限区分は必須・設計:128,154-155)由来。
        // card-detail.js のプロトタイプでリーガリティ行を追加し、未選択のまま送信→保存されず .invalid-feedback。
      }
    );

    test.fixme(
      "E2E-M14-04-032 削除対象が存在しないIDへのDELETE→HTTP404（要: DELETE送信＋認証コンテキスト）",
      async () => {
        // 期待は仕様(エラー処理: 削除対象が存在しない=HTTP404・設計:92,289)由来（単体削除030の異常系対）。
        // APIRequestContext で存在しないIDへ DELETE を送り、404を観測する。
      }
    );

    test.fixme(
      "E2E-M14-04-042 CSRFトークン欠落の削除DELETEは拒否され削除されない（要: 認証済リクエストコンテキスト）",
      async () => {
        // 期待は仕様(DELETE時CSRF無効→アクセス拒否・設計:89,285)由来（登録CSRF041の削除側対）。
        // _token を欠落させた DELETE を送り、削除されず拒否されることを観測する（期待ステータス値は実装に固定しない）。
      }
    );
  }
);
