/**
 * 管理画面 デッキ管理 — 直近の大会管理（編集）E2E。
 * 納品ケース表 integration_test/e2e/m15_11_admin_deck_deck_latest_event_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」かつ非破壊で安全に実行できるケースを test として実装し、破壊的（全行一括上書き保存）・
 * 専用シードが必要・仕様乖離で挙動が異なるケースは test.fixme（理由付き）で抜け漏れを可視化する。
 * 手動/間接・対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約準拠）。
 * 期待結果は仕様(設計書 functions/pf-eccube3/m15-11_admin_deck_deck_latest_event.md / 観点表 / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約値（Length max/Range）を期待値に流用しない。
 * 本設計書は現行 pf-eccube3(プラグイン)のリバースであり、刷新先 ec-cube-enterprise(コア)とのルート・文言・失敗時挙動の
 * 乖離はケース表 付帯表4 に分離する。ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考の未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も @playwright/test を
 * 直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 *
 * シード前提（SEED-M15-11-ROWS）: mtb_latest_event_deck にスロット行が1件以上存在すること
 *  （初期マイグレーションで固定件数の空行が投入される想定）。0件時の挙動は別シードで fixme 管理。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { DeckDeckLatestEventPage } from "../../../pages/admin/m15/m15_11_admin_deck_deck_latest_event.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// オラクル独立性: 設計書の正典パス末尾 `/latest_event_deck` で在席判定する。実装固有の `/deck/` セグメント
// （付帯表4#1の乖離）は期待値に固定しない。ナビゲーション（page.goto / page.url）でのみ実装ルートを位置情報として用いる。
const LIST_RE = /\/latest_event_deck(\?|$)/;
const LOGIN_RE = /\/login(\?|$)/;

async function adminLogin(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 > デッキ管理 — 直近の大会管理（編集）",
  { tag: ["@admin", "@deck"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M15-11-040 未認証で一覧URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/deck/latest_event_deck`);
      await expect(page.locator("#login_id")).toBeVisible(); // 権限・認可: 未認証は管理ログインへ
      await expect(page).toHaveURL(LOGIN_RE);
    });

    // ===== ログイン必須・非破壊（表示確認） =====

    test("E2E-M15-11-001 一覧（編集）画面のページタイトル「直近の大会管理」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const target = new DeckDeckLatestEventPage(page);
      await target.goto();
      await expect(page).toHaveURL(LIST_RE);
      // 設計書「ページタイトルは『直近の大会管理』」（フロント挙動・表示要素）。出力先要素は実機差があるため本文存在で判定。
      await expect(page.locator("body")).toContainText("直近の大会管理");
    });

    test("E2E-M15-11-002 各スロットに5項目（開催日/フォーマット/イベント名日英/参加人数）入力欄が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const target = new DeckDeckLatestEventPage(page);
      await target.goto();
      await target.seeListForm(); // 設計書「各スロットは5行の表（見出しセルにラベル、データセルにウィジェット）」
    });

    test("E2E-M15-11-003 送信ボタン「直近の大会設定」がページ上下に表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const target = new DeckDeckLatestEventPage(page);
      await target.goto();
      // 設計書「ページ上下に同一文言の送信ボタン『直近の大会設定』」
      await expect(target.submitButtons).toHaveCount(2);
    });

    test("E2E-M15-11-004 各表に「消去」ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const target = new DeckDeckLatestEventPage(page);
      await target.goto();
      // 設計書「各スロット（表）右列に『消去』ボタン」。1表につき1ボタンで、表数と消去ボタン数が一致すること（各表網羅）。
      await expect(target.clearButtons.first()).toBeVisible();
      const tableCount = await target.tables.count();
      expect(tableCount).toBeGreaterThan(0);
      await expect(target.clearButtons).toHaveCount(tableCount);
    });

    test("E2E-M15-11-012 フォーマット欄に空のプレースホルダと選択肢が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const target = new DeckDeckLatestEventPage(page);
      await target.goto();
      const fmt = target.formatSelect(0);
      await expect(fmt).toBeVisible();
      // 設計書「選択肢はフォーマットマスタの一覧。プレースホルダは未選択（空）」。文言はオラクル化せず、空値プレースホルダ＋選択肢の構造で判定。
      const options = fmt.locator("option");
      expect(await options.count()).toBeGreaterThan(0);
      await expect(options.first()).toHaveAttribute("value", ""); // 未選択（空）のプレースホルダ
    });

    // ===== クライアントJS挙動（送信しない＝非破壊） =====

    test("E2E-M15-11-010 「消去」押下で同一表内の入力欄がクリアされる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const target = new DeckDeckLatestEventPage(page);
      await target.goto();
      await target.eventNameJp(0).fill("消去テスト");
      await target.clearRow(0); // サーバ送信しないクライアント挙動
      await expect(target.eventNameJp(0)).toHaveValue(""); // 設計書「同一表内の入力欄をクリアする」
    });

    test("E2E-M15-11-011 いずれかの欄に入力すると同一表に必須バッジ「必須」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const target = new DeckDeckLatestEventPage(page);
      await target.goto();
      await target.eventNameJp(0).fill("必須テスト"); // 設計書「いずれかに文字があれば同一表の各入力に required を付け、必須装飾を表示」
      await expect(target.requiredBadges.first()).toBeVisible();
      // 期待は仕様「同一表内の該当入力に required を付ける」由来。必須バッジ表示だけでなく required 属性付与も確認する。
      await expect(target.eventNameEn(0)).toHaveJSProperty("required", true);
      await expect(target.participants(0)).toHaveJSProperty("required", true);
    });

    test("E2E-M15-11-020 一部の欄のみ入力して送信するとHTML5検証で送信が止まり成功しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      const target = new DeckDeckLatestEventPage(page);
      await target.goto();
      await target.eventNameJp(0).fill("部分入力"); // 他欄は空＝JSで同一表の各欄が required になる
      await target.submit();
      // 設計書「値の入った表ではHTML5 required が付くため、ブラウザの制約で送信が止まる場合がある」
      await expect(page).toHaveURL(LIST_RE); // 一覧URLに滞留（成功遷移しない）
      await expect(target.flashSuccess).toHaveCount(0); // 保存成功フラッシュは出ない
    });

    // ===== 破壊的／仕様乖離／専用シード（理由付きで未実行・抜け漏れ可視化） =====

    test.fixme(
      "E2E-M15-11-005 全項目に有効値を入力し送信→保存成功フラッシュ＋一覧GETへリダイレクト（破壊的・全行上書き）",
      async () => {
        // 期待は仕様(処理フロー: 有効→全スロット更新→成功メッセージ→GET一覧へ)由来。
        // 実装は全行を送信内容で一括上書きするため共有環境を破壊する。使い捨て/復元シード確立後に実装。
        // 乖離: 成功メッセージは設計 admin.register.complete に対し実装 admin.common.save_complete「保存しました」（付帯表4#2）。
      }
    );

    test.fixme(
      "E2E-M15-11-021 イベント名(日)を最大長255文字＋同一表の必須欄を有効入力で送信→保存継続（破壊的・正常境界）",
      async () => {
        // 期待は仕様(最大長255以内は継続・deck.length.name)由来。更新を伴うため復元シード確立後に実装。
      }
    );

    test.fixme(
      "E2E-M15-11-024 参加人数を境界0で同一表を有効入力し送信→保存継続（破壊的・正常境界 下限）",
      async () => {
        // 期待は仕様(参加人数0以上は継続・Range下限)由来。number min=0 のクライアント制御と併せ実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M15-11-026 参加人数を上限境界(99999999)＋同一表を有効入力し送信→保存継続（破壊的・正常境界 上限）",
      async () => {
        // 期待は仕様(参加人数 上限以下は継続・Range上限)由来。上限値はForm制約のオラクル化を避け、
        // 設計書「99999999以下」を仕様根拠とする（実装定数値に追従しない）。範囲外023との正常/異常対。
        // 更新を伴うため復元シード確立後に実装。
      }
    );

    test.fixme(
      "E2E-M15-11-022 イベント名(日)を最大長+1(256文字)＋他欄有効入力で送信→保存されない（文字列長超過・異常系）",
      async () => {
        // 期待は仕様(イベント名 最大長255・超過は保存されない・Length)由来。正常境界021との対。
        // 他欄を有効入力してHTML5必須を突破し、サーバ側Length検証へ到達させる。最大長値はForm制約をオラクル化せず
        // 設計書「最大255」を仕様根拠とする（実装定数に追従しない）。失敗時挙動は付帯表4#3で乖離検出見込み。
      }
    );

    test.fixme(
      "E2E-M15-11-023 参加人数を下限未満(-1)で送信→保存されない（数値範囲・異常系・境界0 024 との対／要: number制約のクライアント突破手順）",
      async () => {
        // 期待は仕様(0未満は不可・処理が完了しない・Range下限)由来。input type=number min のクライアント検証で
        // 送信前に止まるため、サーバ側Range検証の到達には実機での制御突破手順が必要。要実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M15-11-027 参加人数を上限超(設計書上限+1)で送信→保存されない（数値範囲・異常系・上限境界 026 との対）",
      async () => {
        // 期待は仕様(上限超は不可・処理が完了しない・Range上限)由来。上限値はForm制約をオラクル化せず
        // 設計書「99999999以下」を仕様根拠とする（実装定数に追従しない）。input type=number max の
        // クライアント検証突破が必要なため要実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M15-11-006 イベント名(英)を最大長255文字＋必須欄を有効入力で送信→保存継続（破壊的・正常境界・英フィールド個別配線）",
      async () => {
        // 期待は仕様(イベント名(英) 最大長255以内は継続・deck.length.name)由来。日(021)と別に英フィールドの
        // name/maxlength/保存先(event_name_en)配線を個別検出する。更新を伴うため復元シード確立後に実装。
      }
    );

    test.fixme(
      "E2E-M15-11-007 イベント名(英)を最大長+1(256文字)＋他欄有効入力で送信→保存されない（文字列長超過・異常系・英フィールド個別配線）",
      async () => {
        // 期待は仕様(イベント名(英) 最大長255・超過は保存されない・Length)由来。正常境界006との対。
        // 他欄を有効入力してHTML5必須を突破しサーバ側Length検証へ到達させる。失敗時挙動は付帯表4#3で乖離検出見込み。
      }
    );

    test.fixme(
      "E2E-M15-11-028 全表を空のまま送信→条件付き必須が発火せず保存継続（正常系・部分入力 020 との対）",
      async () => {
        // 期待は仕様(Symfony上は全項目任意・全欄空なら JS の required も付かず送信が通る)由来。部分入力(020)の正常側対。
        // 全行を空で上書きするため破壊的。復元シード確立後に実装。
      }
    );

    test.fixme(
      "E2E-M15-11-025 フォーム検証エラー時に登録失敗フラッシュ表示＋一覧へリダイレクト（仕様乖離・失敗で検出見込み）",
      async () => {
        // 期待は仕様(エラー処理: admin.register.failed フラッシュ＋一覧URLへリダイレクト・フィールド別非表示)由来。
        // 実装は無効時に同テンプレートを再描画（リダイレクトなし・フラッシュなし・form_errorsでフィールドエラー表示）するため
        // 本ケースは実装に対し失敗してdeviationを検出する見込み（付帯表4#3・#6）。期待値は実装側へ書き換えない。
      }
    );

    test.fixme(
      "E2E-M15-11-050 スロット0件時は表ブロックが描画されずCSRFトークンのみ（要: 専用0件シード）",
      async () => {
        // 期待は仕様(エッジケース: 0件ならフォームはCSRFトークンのみ相当・表ブロック非描画)由来。
        // 初期マイグレーションは固定件数を投入するため、0件状態を作る専用シード確立後に実装。
      }
    );
  }
);
