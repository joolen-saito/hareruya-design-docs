/**
 * 管理画面 デッキ管理 > アーキタイプ 登録・編集・削除 E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m15_09_admin_deck_deck_archetype_crud_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち非破壊で安全に実行できる表示・必須/文字列長エラー（送信失敗＝未登録で副作用なし）・
 * 未認証/404ガードを test() で実装する。新規登録/更新/削除の成功（DB副作用あり）・既存アーキタイプ依存の表示・
 * 代表カード検索結果（カードデータ依存）・刷新先乖離検出（旧アーキタイプID欄欠落・削除失敗時遷移先）は
 * test.fixme（理由付き）で残す。手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 *
 * 期待結果は仕様（pf-eccube3 正本 m15-09_admin_deck_deck_archetype_crud.md／観点表／基本設計）由来（オラクル独立性）。
 * 設計源は pf-eccube3（HareruyaEc プラグイン）、刷新先 ec-cube-enterprise ではコア標準機能。乖離（ルート末尾 /edit・/delete、
 * DELETE→POST、成功/失敗フラッシュキー、削除失敗時の遷移先＝設計は検索1ページ目/実装は編集画面、旧アーキタイプID欄欠落、
 * 代表カードXHRの単一JSON化）はケース表「付帯表4」に出し、テストは仕様どおりに書く（実装が違えば落ちて検出する）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / m15系）に倣い @playwright/test + AdminLoginPage 直利用とする。
 * 実行方針: 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 * 生成系テストは識別接頭辞（E2E_）付きの値で作成し、撤去はケース表 付帯表3（シード要件）で管理する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { DeckDeckArchetypeCrudPage } from "../../../pages/admin/m15/m15_09_admin_deck_deck_archetype_crud.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
// 成功時オラクル＝設計書「数値IDのアーキタイプ編集画面へ遷移」（functions/pf-eccube3 §画面遷移：
// GET /{admin_route}/archetype/{id}）。設計ルートは末尾 /edit を持たないため、合否は「archetype/{数値ID}」を
// 上位オラクルとし、刷新先実装が付与する末尾 /edit は任意（位置情報・付帯表4#1）として許容のみ＝期待値に固定しない。
const ARCHETYPE_EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/archetype/\\d+(/edit)?(\\?|$)`);

/** 管理ログインしてからアーキタイプ新規画面を開く。 */
async function gotoNewAsAdmin(page: Page): Promise<DeckDeckArchetypeCrudPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const crud = new DeckDeckArchetypeCrudPage(page);
  await crud.gotoNew();
  return crud;
}

test.describe(
  "管理画面 > デッキ管理 > アーキタイプ登録・編集・削除",
  { tag: ["@admin", "@deck", "@archetype"] },
  () => {
    // ===== 表示（非破壊・参照系。資格情報のみで実行可） =====

    test("E2E-M15-09-001 新規画面: 名称(日/英)・公開状態・フォーマットの必須項目と保存ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const crud = await gotoNewAsAdmin(page);
      await crud.seeNewRequiredFields();
    });

    test("E2E-M15-09-002 新規画面: 解説(日/英)・タグ・代表カード選択ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const crud = await gotoNewAsAdmin(page);
      await crud.seeNewOptionalFields();
    });

    test("E2E-M15-09-005 代表カード選択ボタンで「代表カード検索」モーダルが開く", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const crud = await gotoNewAsAdmin(page);
      await crud.openCardModal();
    });

    test("E2E-M15-09-006 代表カード検索モーダルに検索語・完全一致・カードテキスト・検索ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const crud = await gotoNewAsAdmin(page);
      await crud.openCardModal();
      await crud.seeCardModalFields();
    });

    test("E2E-M15-09-007 タグ欄に複数選択ウィジェット(select2)が適用される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const crud = await gotoNewAsAdmin(page);
      // 仕様: deckTags に select2 を適用（フロント挙動）。select2 化で .select2-container が生成される。
      await expect(page.locator(".select2-container")).toHaveCount(1);
    });

    test("E2E-M15-09-008 新規画面: カラー(複数選択)欄が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const crud = await gotoNewAsAdmin(page);
      // 仕様: カラーは任意・複数チェックの入力項目（業務ルール・入力項目）。表示の有無のみを判定。
      await crud.seeColorsField();
    });

    // ===== 必須/文字列長バリデーション（送信失敗＝未登録。DB副作用なしで安全） =====

    test("E2E-M15-09-020 名称(日)未入力で登録→必須エラーが表示され新規画面に滞留する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const crud = await gotoNewAsAdmin(page);
      // 名称(英)のみ入力し名称(日)を空で送信。仕様: 名称(日)は必須（空白不可）。
      await crud.nameEn.fill("E2E_archetype_en");
      await crud.submit();
      await expect(crud.fieldError.first()).toBeVisible(); // 必須エラー表示
      await expect(page).toHaveURL(/\/archetype\/new(\?|$)/); // 登録されず新規画面に滞留
    });

    test("E2E-M15-09-021 名称(英)未入力で登録→必須エラーが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const crud = await gotoNewAsAdmin(page);
      await crud.nameJp.fill("E2E_アーキタイプ");
      await crud.nameEn.fill("");
      await crud.submit();
      await expect(crud.fieldError.first()).toBeVisible();
    });

    test("E2E-M15-09-022 名称(日)が最大長超過で登録→文字列長エラーが表示され未登録", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const crud = await gotoNewAsAdmin(page);
      // 仕様: 名称は最大255文字。境界外（256文字）はエラー。値の正は設計書、フォーム制約値はオラクル化しない。
      await crud.fillRequired("あ".repeat(256), "E2E_en");
      await crud.submit();
      await expect(crud.fieldError.first()).toBeVisible();
      await expect(page).toHaveURL(/\/archetype\/new(\?|$)/);
    });

    test("E2E-M15-09-025 解説(日)が最大長超過で登録→文字列長エラーが表示され未登録", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const crud = await gotoNewAsAdmin(page);
      // 仕様: 解説は最大1024文字。境界外（1025文字）はエラー。
      await crud.fillRequired("E2E_名称", "E2E_en");
      await crud.commentJp.fill("a".repeat(1025));
      await crud.submit();
      await expect(crud.fieldError.first()).toBeVisible();
      await expect(page).toHaveURL(/\/archetype\/new(\?|$)/);
    });

    test("E2E-M15-09-024 名称(英)が最大長超過で登録→文字列長エラーが表示され未登録（日英独立）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const crud = await gotoNewAsAdmin(page);
      // 仕様: 名称は最大255文字。日英は別入力項目で独立検証。名称(英)256文字でエラー＝送信失敗で未登録（副作用なし）。
      await crud.fillRequired("E2E_名称", "a".repeat(256));
      await crud.submit();
      await expect(crud.fieldError.first()).toBeVisible();
      await expect(page).toHaveURL(/\/archetype\/new(\?|$)/);
    });

    test("E2E-M15-09-026 解説(英)が最大長超過で登録→文字列長エラーが表示され未登録（日英独立）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const crud = await gotoNewAsAdmin(page);
      // 仕様: 解説は最大1024文字。日英は別入力項目で独立検証。解説(英)1025文字でエラー＝送信失敗で未登録。
      await crud.fillRequired("E2E_名称", "E2E_en");
      await crud.commentEn.fill("a".repeat(1025));
      await crud.submit();
      await expect(crud.fieldError.first()).toBeVisible();
      await expect(page).toHaveURL(/\/archetype\/new(\?|$)/);
    });

    // ===== 認証・404ガード =====

    test("E2E-M15-09-060 不存在IDの編集画面アクセス→HTTP 404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
      // 仕様: 編集の対象ID不存在は HTTP 404（設計 §エッジケース／§画面遷移 GET /{admin_route}/archetype/{id}）。
      // 合否オラクルは status 404（エンティティ不存在）。設計ルートは末尾 /edit を持たないが、編集エンドポイントへ
      // 到達するための goto は刷新先の位置情報（末尾 /edit・付帯表4#1）として用いる＝期待値ではない。極大IDで不存在を再現する。
      const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/archetype/999999999/edit`);
      expect(res?.status()).toBe(404);
    });

    test("E2E-M15-09-061 未ログインで新規画面URLへ直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      // 資格情報不要（未ログインのガード確認）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/archetype/new`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M15-09-062 未ログインで編集画面URLへ直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      // 資格情報不要。仕様: 各入口は未ログインで到達しない（権限・認可）。認証ガードは404判定より先に作用するため、
      // ID存在有無に依らずログイン誘導を上位オラクルとする（実装位置情報として末尾 /edit を用いる・付帯表4#1）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/archetype/1/edit`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M15-09-080 新規画面の「戻る」ボタンで一覧/検索画面へ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const crud = await gotoNewAsAdmin(page);
      // 仕様(画面遷移): 詳細・新規の「戻る」は検索/一覧へ戻る。合否オラクルは「新規画面を離れ一覧/検索へ遷移」。
      // 実装は admin_archetype_list?resume=1（設計は admin_archetype_search・付帯表4#1）でルート末尾差は許容＝期待値に固定しない。
      await crud.backLink.click();
      await expect(page).not.toHaveURL(/\/archetype\/new(\?|$)/);
      await expect(page).toHaveURL(/\/archetype(\?[^/]*)?$/);
    });

    // ===== 自動化予定（要シード／DB副作用あり／刷新先乖離検出は fixme で可視化） =====

    test.fixme(
      "E2E-M15-09-003 編集画面: 既存値が載ったフォームと見出し「アーキタイプ編集」が表示される（要 SEED-M15-09-ARCHETYPE）",
      async () => {
        // 期待は仕様(処理フロー：編集はGETで既存値を載せて表示)由来。既知アーキタイプID投入後に実装。
      }
    );

    test.fixme(
      "E2E-M15-09-004 編集画面: 更新・削除・戻るボタンが表示される（要 SEED-M15-09-ARCHETYPE）",
      async () => {
        // 期待は仕様(フロント挙動：編集は「更新」「削除」「戻る」)由来。
      }
    );

    test.fixme(
      "E2E-M15-09-010 新規登録正常: 必須を全入力して登録→保存完了メッセージが表示される（DB INSERT・要撤去）",
      async () => {
        // 期待は仕様(処理フロー：検証成功で persist/flush＋登録完了フラッシュ)由来。識別接頭辞 E2E_ で作成し撤去する。
        void ARCHETYPE_EDIT_RE;
      }
    );

    test.fixme(
      "E2E-M15-09-011 新規登録正常: 登録した行の編集画面(URL)へ遷移する（DB INSERT・要撤去）",
      async () => {
        // 期待は仕様(画面遷移：新規送信成功で付与IDの編集画面へ)由来。ARCHETYPE_EDIT_RE で確認。
      }
    );

    test.fixme(
      "E2E-M15-09-023 名称255文字・解説1024文字(境界内)で登録→エラーなく登録成功（DB INSERT・要撤去）",
      async () => {
        // 期待は仕様(バリデーション：最大長は境界内で受理)由来。境界内正常は 022/025 の異常と対。
      }
    );

    test.fixme(
      "E2E-M15-09-040 編集更新正常: 名称変更して更新→保存完了メッセージが表示される（要 SEED-M15-09-ARCHETYPE・DB UPDATE）",
      async () => {
        // 期待は仕様(処理フロー：更新成功で保存＋成功フラッシュ)由来。
      }
    );

    test.fixme(
      "E2E-M15-09-041 編集更新正常: 同一IDの編集画面(URL)へ遷移する（要 SEED-M15-09-ARCHETYPE）",
      async () => {
        // 期待は仕様(画面遷移：更新成功は同一IDの編集画面へリダイレクト)由来。
      }
    );

    test.fixme(
      "E2E-M15-09-042 編集で名称(日)を空にして更新→必須エラーで更新されず滞留（要 SEED-M15-09-ARCHETYPE）",
      async () => {
        // 期待は仕様(バリデーション：必須空でエラー・同画面再描画)由来。020 新規必須エラーと対の編集側。
      }
    );

    test.fixme(
      "E2E-M15-09-043 編集で名称(英)を空にして更新→必須エラーで更新されず滞留（要 SEED-M15-09-ARCHETYPE）",
      async () => {
        // 期待は仕様(バリデーション：名称(英)も必須・空白不可)由来。021 新規名称(英)必須と対の編集側（日英独立）。
      }
    );

    test.fixme(
      "E2E-M15-09-013 タグ・カラーを選択して登録→編集画面で選択が再表示される（DB INSERT・中間表保存・要撤去）",
      async () => {
        // 期待は仕様(DB操作：登録で dtb_archetype_deck_tag / dtb_archetype_color を保存)由来。
        // 登録後の編集再表示で選択状態が残ることを間接確認。識別接頭辞 E2E_ で作成し撤去する。
      }
    );

    test.fixme(
      "E2E-M15-09-054 削除確認ダイアログでキャンセル→削除されず編集画面に留まる（要 SEED-M15-09-ARCHETYPE）",
      async () => {
        // 期待は仕様(フロント挙動：確認キャンセルで処理されず状態保持・観点表 IT-25:380)由来。
        // page.on('dialog', d => d.dismiss()) でキャンセルし、編集画面URL不変・行残存を確認（非破壊）。
      }
    );

    test.fixme(
      "E2E-M15-09-050 削除ボタン押下で確認ダイアログ「このアーキタイプを削除してもよろしいですか？」が表示される（要 SEED-M15-09-ARCHETYPE）",
      async () => {
        // 期待は仕様(モーダル：詳細からの削除確認文言)由来。page.on('dialog') で文言を検証する。
        // 設計は一覧=admin.confirm.delete／詳細=admin.confirm.archetype_delete で文言キーが異なる（付帯表4#6）。文言はオラクル化せず確認ダイアログ表示で判定。
      }
    );

    test.fixme(
      "E2E-M15-09-051 関連デッキなしのアーキタイプを削除→削除完了メッセージが表示される（要 SEED-M15-09-ARCHETYPE-NODECK・論理削除）",
      async () => {
        // 期待は仕様(処理フロー：関連デッキ0で論理削除＋削除完了フラッシュ)由来。deleted_at 更新は間接。
      }
    );

    test.fixme(
      "E2E-M15-09-052 関連デッキなし削除後: 一覧へ戻り当該行が一覧に表示されない（要 SEED-M15-09-ARCHETYPE-NODECK）",
      async () => {
        // 期待は仕様(画面遷移：削除成功でセッションのページ番号があれば検索、無ければ一覧へ)由来。
        // 設計の戻り先（検索/一覧の分岐）と実装（常に一覧）の差は付帯表4#3。
      }
    );

    test.fixme(
      "E2E-M15-09-053 関連デッキありのアーキタイプを削除→削除されず削除不可エラーが表示される（要 SEED-M15-09-ARCHETYPE-WITHDECK）",
      async () => {
        // 期待は仕様(エラー処理：関連デッキありは削除せずエラーフラッシュし検索1ページ目へ)由来。
        // 実装は編集画面へ戻る＋delete_error_deck_exists（付帯表4#3＝遷移先乖離・失敗で検出見込み）。
      }
    );

    test.fixme(
      "E2E-M15-09-055 関連デッキあり削除失敗後→検索1ページ目へ遷移する（要 SEED-M15-09-ARCHETYPE-WITHDECK・遷移先乖離）",
      async () => {
        // 期待は仕様(画面遷移：削除失敗は admin_archetype_search の1ページ目へ)由来。053のエラー表示と対の遷移先判定。
        // 実装は編集画面へ戻る（付帯表4#3）ため、仕様どおり検索1pを期待し落ちて乖離を検出する想定。
      }
    );

    test.fixme(
      "E2E-M15-09-056 検索ページ番号セッション保持時の削除成功→当該検索ページへ戻る（要 SEED-M15-09-ARCHETYPE-NODECK）",
      async () => {
        // 期待は仕様(画面遷移/セッション：admin.archetype.search.page_no 保持時は検索当該ページへ)由来。
        // 052(ページ番号なし→一覧初期表示)と対の分岐。実装は常に一覧(付帯表4#4)のため落ちて検出する想定。
      }
    );

    test.fixme(
      "E2E-M15-09-072 代表カード検索結果のページング操作で検索条件が維持され次ページが表示される（要 SEED-M15-09-CARD）",
      async () => {
        // 期待は仕様(処理フロー/セッション：GETページングで検索語をセッション維持し次ページ結果を返す)由来。070初回検索と対のページング。
      }
    );

    test.fixme(
      "E2E-M15-09-030 編集フォームに旧アーキタイプID入力欄が存在する（付帯表4#5 刷新先欠落＝失敗で検出）",
      async () => {
        // 期待は仕様(入力項目：旧アーキタイプID 任意・最大16文字・^[\\w\\d]+$)由来。刷新先フォームに当欄が無く落ちて検出する想定。
      }
    );

    test.fixme(
      "E2E-M15-09-031 旧アーキタイプIDに記号を含む値で登録→文字種エラーが表示される（付帯表4#5 刷新先欠落＝失敗で検出）",
      async () => {
        // 期待は仕様(バリデーション：旧アーキタイプIDは ^[\\w\\d]+$ 違反でエラー)由来。刷新先に当欄が無く検証されないため落ちて検出する想定。
      }
    );

    test.fixme(
      "E2E-M15-09-032 旧アーキタイプIDが最大長超過(17文字)で登録→文字列長エラーが表示される（付帯表4#5 刷新先欠落＝失敗で検出）",
      async () => {
        // 期待は仕様(入力項目/バリデーション：旧アーキタイプIDは最大16文字)由来。17文字でエラー＝031文字種と対の長さ異常。
        // 刷新先に当欄が無いため落ちて欠落を検出する想定（実装に寄せない）。
      }
    );

    test.fixme(
      "E2E-M15-09-070 代表カード検索モーダルで検索語送信→検索結果一覧が表示される（要 SEED-M15-09-CARD）",
      async () => {
        // 期待は仕様(代表カードモーダル：検索結果HTML/一覧の更新)由来。既知カード画像の投入後に実装。
      }
    );

    test.fixme(
      "E2E-M15-09-071 検索結果から1件確定→hidden(cardImageId)・プレビュー画像・カード名が更新される（要 SEED-M15-09-CARD）",
      async () => {
        // 期待は仕様(代表カード確定：フォームhidden・プレビュー画像・カード名の更新)由来。XHR JSONからの反映を確認。
      }
    );
  }
);
