/**
 * 管理画面 店舗設定 — 自動送信メールテンプレート編集 E2E。
 * 納品ケース表 integration_test/e2e/m10_08_admin_base_setting_setting_shop_auto_mail_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち安全に実行できるケースのみを置く（手動/対象外はケース表で全量管理）。
 * 自動化予定だが未実装/破壊的（登録でDBを書き換える）/要実機/仕様乖離検出のものは test.fixme（理由付き）で残す。
 * 期待結果は仕様（正本md functions/pf-eccube3/...・観点表）由来（オラクル独立性）。実装の現挙動・Form制約を
 * 期待値に流用しない。設計源 pf-eccube3 と刷新先 ec-cube-enterprise の乖離はケース表の不具合候補表で管理する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を
 * 直接使う。既存リポ規約（login.spec.ts / two_factor_auth.spec.ts / m09系）に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針（安全第一・共有環境）:
 *  - 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 表示・遷移・必須検証エラー（保存に失敗してDBを変えない）は安全に実行できる。
 *  - 登録成功(010/011)はDBを書き換える破壊的操作のため test.fixme（使い捨てシードで実装）。
 *  - 最大長境界(021)・名称必須乖離(022)・対象外識別子404(032)・null行POST(033)・CSRF(034)は
 *    仕様乖離検出/専用シード/JS阻止回避が要るため test.fixme（理由付き）で残す。
 *
 * 環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）
 *  - AUTO_MAIL_NG_ID : 自動送信対象外（is_auto_send=false）の既存メールテンプレID（032 で使用）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { BaseSettingSettingShopAutoMailPage } from "../../../pages/admin/m10/m10_08_admin_base_setting_setting_shop_auto_mail.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const AUTO_MAIL_NG_ID = process.env.AUTO_MAIL_NG_ID || "";

const LOGIN_RE = /\/login(\?|$)/;
const EDIT_RE = /\/mall\/auto_mail\/\d+(\?|$)/;

// 合否は仕様（設計書: 件名の必須エラー表示・編集画面に留まる／成功メッセージ表示）由来の構造で判定する。
// validators.ja.yaml / messages.ja.yaml の具体文言は実装由来オラクルのため期待値に固定しない。

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 > 店舗設定 > 自動送信メールテンプレート編集",
  { tag: ["@admin", "@setting", "@mail"] },
  () => {
    // ===== 未ログインガード（資格情報不要・非破壊） =====

    test("E2E-M10-08-030 未ログインで自動送信メール画面URL直接→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/mall/auto_mail`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 表示・遷移（要ログイン・非破壊） =====

    test("E2E-M10-08-001 識別子なしGET: テンプレ選択セレクトが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new BaseSettingSettingShopAutoMailPage(page);
      await target.goto();
      await target.seeTemplateSelect();
    });

    test("E2E-M10-08-002 テンプレ選択を変更すると識別子付き編集表示へ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new BaseSettingSettingShopAutoMailPage(page);
      await target.goto();
      await target.selectFirstTemplate();
      await expect(page).toHaveURL(EDIT_RE); // 同一機能内の別識別子の編集表示（GET）
    });

    test("E2E-M10-08-003 識別子付き編集画面に名称・件名・ヘッダー・フッター・登録ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new BaseSettingSettingShopAutoMailPage(page);
      await target.goto();
      await target.selectFirstTemplate();
      await target.seeEditForm();
      // 本文プレビューボックス(#mail_tpl_data)の存在（仕様: 入口の表示要素 md:72,85,90）。
      // 中身（注釈除去・改行br・header/footer差込）の厳密検証は帳票相当で手動/対象外。
      await expect(target.tplData).toBeVisible();
    });

    test("E2E-M10-08-004 編集画面の件名項目に必須バッジが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new BaseSettingSettingShopAutoMailPage(page);
      await target.goto();
      await target.selectFirstTemplate();
      await expect(target.subjectRequiredBadge.first()).toBeVisible(); // 件名は必須（仕様: バリデーション）
    });

    test("E2E-M10-08-005 編集画面にメイン見出し（テンプレート編集）が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new BaseSettingSettingShopAutoMailPage(page);
      await target.goto();
      await target.selectFirstTemplate();
      await expect(target.cardTitle).toBeVisible(); // メイン見出し領域（文言は不具合候補#1で要確認）
    });

    // ===== 必須バリデーション（要ログイン・非破壊：保存に失敗しDBを変えない） =====

    test("E2E-M10-08-020 件名未入力で登録→必須エラーが表示され保存されず編集画面に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new BaseSettingSettingShopAutoMailPage(page);
      await target.goto();
      await target.selectFirstTemplate();
      await target.mailSubject.fill(""); // 件名を空に
      await target.registerButton.click();
      // 件名の必須エラーが表示される（構造で判定。具体文言は実装由来オラクルのため固定しない）。
      await expect(target.subjectError.first()).toBeVisible();
      await expect(page).toHaveURL(EDIT_RE); // 編集画面に留まる（成功リダイレクトしない＝保存されない）
    });

    // ===== 404（要ログイン・非破壊） =====

    test("E2E-M10-08-031 存在しない識別子で開くと404相当の応答となる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/mall/auto_mail/99999999`);
      expect(res?.status()).toBe(404); // 対象テンプレ不在→404（エラー処理）
    });

    // ===== 保留（破壊的/仕様乖離検出/専用シード/JS阻止回避。手動・対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M10-08-006 識別子なし初期表示で名称・件名・本文プレビュー・登録ボタンも表示される（仕様md:72）— 実装は編集状態のみ描画＝乖離検出（不具合候補#7）",
      async () => {
        // 期待は仕様(利用者視点の入口: 初期表示で全要素)由来。識別子なしGET(/mall/auto_mail)で
        // #mail_name/#mail_mail_subject/#mail_tpl_data/登録ボタンが表示されることを構造で確認する。
        // 実装は {% if Mail and Mail.id %} で編集状態のみ描画のため、初期表示では非表示＝仕様どおり書けば失敗で検出。
      }
    );

    test.fixme(
      "E2E-M10-08-007 テンプレ選択で空（未選択）に戻すと識別子なし初期表示へ戻る（仕様md:86・002の対）— 実装は空optionをdisabled化＝UI到達不可なら乖離検出",
      async () => {
        // 期待は仕様(フロント挙動JS: 空選択でベースパスへ戻す)由来。編集状態で #mail_template を空選択し
        // URL がベースパス(/mall/auto_mail 識別子なし)へ戻ることを確認する。実装は pageshow で
        // option[value=""] を disabled 化しており、空選択の force 操作が要るため実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M10-08-012 ヘッダー・フッター編集で登録→保存成功し、リダイレクト先で名称/件名/header/footer の保存値が再表示される（仕様md:210,312。破壊的: 011の値確認補完）",
      async () => {
        // 期待は仕様(入力項目: header/footer保存・遷移時に引き継ぐ状態: DB最新値で再表示)由来。
        // 破壊的のため使い捨てシードで実装。リダイレクト先で各入力欄 value が入力値と一致することを確認する。
      }
    );

    test.fixme(
      "E2E-M10-08-010 有効な名称・件名で登録成功→成功メッセージ表示（破壊的: dtb_mail_template を更新。使い捨てシードで実装）",
      async () => {
        // 期待は仕様(処理フロー: 検証成功で保存＋管理画面向け成功メッセージ)由来。
        // 成功メッセージ領域(.alert-success 等)の表示と同一識別子編集への滞留を構造で確認する（具体文言は固定しない）。
      }
    );

    test.fixme(
      "E2E-M10-08-011 登録成功後に同一識別子の編集表示（リダイレクトGET）へ遷移（破壊的: 010 と対）",
      async () => {
        // 期待は仕様(画面遷移: 登録成功→同一識別子の編集表示へリダイレクト)由来。URL が EDIT_RE を保つことを確認。
      }
    );

    test.fixme(
      "E2E-M10-08-021 名称の文字列長境界（最大長ちょうど=保存成功／最大長+1=エラー の正常・異常対）（要確認: 最大長は設計50・実装stext_lenで乖離。不具合候補#4）",
      async () => {
        // 期待は仕様(入力項目: 名称最大長)由来。正常系(最大長ちょうどは継続)と異常系(最大長+1はエラー)を対で確認する。
        // 境界長は設計値(50)と実装値(stext_len)が異なるため実機確認後に確定して実装。
      }
    );

    test.fixme(
      "E2E-M10-08-022 名称未入力でも保存できる（仕様: 名称は任意）— 実装はNotBlankで拒否＝乖離検出（不具合候補#3）",
      async () => {
        // 期待は仕様(入力項目: 名称 任意)由来。テストは仕様どおり「保存成功」を期待し、実装がNotBlankなら失敗で検出する。破壊的のため使い捨てシードで実装。
      }
    );

    test.fixme(
      "E2E-M10-08-032 自動送信対象外識別子で開くと404（仕様）— 実装は{Mail}解決にis_auto_send絞り込み無し＝乖離検出（不具合候補#2, 要 AUTO_MAIL_NG_ID）",
      async () => {
        // 期待は仕様(エッジケース: AUTO_SEND_MAILS外→404)由来。テストは404を期待し、実装が200を返せば失敗で検出する。
        void AUTO_MAIL_NG_ID;
      }
    );

    test.fixme(
      "E2E-M10-08-033 POST現在行null→（仕様）エラーフラッシュ＋識別子なし表示へリダイレクト（実装は識別子なしPOSTでnull参照の致命的エラー500相当＝乖離#5・JSがsubmit阻止のため要回避）",
      async () => {
        // 期待は仕様(処理フロー: POST現在行null→フラッシュ＋リダイレクト)由来。JS阻止を回避した直接POSTで検証する手順を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M10-08-034 CSRFトークン不正で登録→アクセス拒否（ブラウザからのトークン改ざんが高コスト＝手動寄り）",
      async () => {
        // 期待は仕様(エラー処理: CSRF不正→アクセス拒否)由来。トークン改ざん手順を実機確認後に実装。
      }
    );
  }
);
