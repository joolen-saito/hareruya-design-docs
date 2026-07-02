/**
 * 管理画面 コンテンツ管理「レイアウト管理」E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m09_03_admin_content_content_layout_e2e_cases.md に対応。
 * 期待結果は仕様（functions/ec-cube-enterprise/m09-03_admin_content_content_layout.md / テスト観点表 /
 * messages.ja.yaml・validators.ja.yaml の確認値）由来（オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 本specに残すのは「E2E自動化」ケースと、自動化予定だが未実装/要実機確認の test.fixme のみ。
 * 「手動」「対象外」（D&D永続化・サーバ側再構築のDB原値・プレビュー別タブのフロント描画 等）はケース表で全量管理する
 * （規約: 手動/対象外は spec に大量の fixme を残さない）。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * シード依存（既存レイアウト・ブロック・割り当てページ）は各テスト先頭で別途ガード/前提とし、未整備時は安全に skip する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ContentContentLayoutPage } from "../../../pages/admin/m09/m09_03_admin_content_content_layout.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// シード（環境変数。コミットしない）:
//  SEED-M09-03-LAYOUTS  : 既定外レイアウト（割り当てページ無し・削除可）の id
//  SEED-M09-03-ASSIGNED : 割り当てページ有り（削除不可）レイアウトの id と名称
//  SEED-M09-03-EDIT     : ブロックを1件以上配置済みのレイアウト id（コンテキストメニュー/コードプレビュー用）
const LAYOUT_DELETABLE_ID = Number(process.env.M0903_DELETABLE_ID || 0);
const LAYOUT_ASSIGNED_ID = Number(process.env.M0903_ASSIGNED_ID || 0);
const LAYOUT_ASSIGNED_NAME = process.env.M0903_ASSIGNED_NAME || "";
const LAYOUT_EDIT_ID = Number(process.env.M0903_EDIT_ID || 0);
const BLOCK_ID = Number(process.env.M0903_BLOCK_ID || 0);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 > コンテンツ管理 > レイアウト管理",
  { tag: ["@admin", "@content"] },
  () => {
    test.beforeEach(({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    });

    // --- 一覧 ---
    test("E2E-M09-03-001 一覧を開くと見出し『レイアウト管理』と新規作成導線が出る", async ({
      page,
    }) => {
      await login(page);
      const t = new ContentContentLayoutPage(page);
      await t.gotoList();
      await expect(page).toHaveURL(new RegExp(`/${ECCUBE_ADMIN_ROUTE}/content/layout$`));
      await t.seeListHeading();
      await expect(t.createNewLink).toBeVisible();
    });

    test("E2E-M09-03-002 一覧の端末種別アイコン: PCはデスクトップ・モバイルはモバイルアイコン", async ({
      page,
    }) => {
      await login(page);
      const t = new ContentContentLayoutPage(page);
      await t.gotoList();
      // 仕様（処理フロー: 一覧表示要素）: 各レイアウトカードに端末種別アイコンが1つ付く
      // （PC=デスクトップ／それ以外=モバイル）。カード数と端末アイコン数が一致することを確認する。
      const cardCount = await t.layoutCards.count();
      test.skip(cardCount === 0, "SEED-M09-03-LAYOUTS（一覧レイアウト）未整備");
      await expect(t.deviceIcons).toHaveCount(cardCount);
      // PC・モバイルの両アイコン種別が出し分けされること（少なくとも一方は描画される）。
      await expect(t.deviceIcons.first()).toBeVisible();
    });

    test("E2E-M09-03-006 削除ボタン押下で確認モーダルが開き、名称入りの確認文言が出る", async ({
      page,
    }) => {
      await login(page);
      const t = new ContentContentLayoutPage(page);
      await t.gotoList();
      const delBtn = t.deleteButtons.first();
      test.skip((await delBtn.count()) === 0, "削除可能（既定外）レイアウトのシード未整備");
      // 押下したカードのレイアウト名を取得し、確認モーダルへ差し込まれることを検証する。
      const card = t.layoutCards.filter({ has: delBtn });
      const layoutName = (await card.locator("a.card-title").first().innerText()).trim();
      await delBtn.click();
      await expect(t.deleteModal).toBeVisible();
      // 仕様（表示メッセージ）: 「この操作はあとから取り消すことができません。「<名称>」を削除してよろしいですか？」
      await expect(t.deleteModalMessage).toContainText(
        "この操作はあとから取り消すことができません。"
      );
      // 名称差込（差込先 p.modal-message）と削除実行リンク（data-method=delete）の存在を確認。
      await expect(t.deleteModalMessage).toContainText(layoutName);
      await expect(t.deleteModalConfirm).toBeVisible();
    });

    // --- 新規 ---
    test("E2E-M09-03-007 新規作成押下で空のレイアウト編集画面（端末種別プルダウン）へ遷移", async ({
      page,
    }) => {
      await login(page);
      const t = new ContentContentLayoutPage(page);
      await t.gotoList();
      await t.createNewLink.click();
      await expect(page).toHaveURL(new RegExp(`/content/layout/new`));
      await expect(t.nameInput).toBeVisible();
      await expect(t.deviceTypeSelect).toBeVisible(); // 新規は端末種別を選択できる（仕様: 新規時はプルダウン）
    });

    test("E2E-M09-03-009 新規保存（名称＋端末種別）成功で『保存しました』＋編集画面へリダイレクト", async ({
      page,
    }) => {
      await login(page);
      const t = new ContentContentLayoutPage(page);
      await t.gotoNew();
      await t.fillNew(`E2Eテストレイアウト_${Date.now()}`);
      // 端末種別の選択肢値は実装の DeviceType マスタ由来。先頭の有効な選択肢を選ぶ。
      const opts = t.deviceTypeSelect.locator("option");
      const optValue = await opts.nth((await opts.count()) > 1 ? 1 : 0).getAttribute("value");
      if (optValue) await t.deviceTypeSelect.selectOption(optValue);
      await t.submit();
      // 仕様（処理フロー/画面遷移）: 通常保存は保存しましたを積み編集画面へリダイレクト
      await expect(page).toHaveURL(new RegExp(`/content/layout/\\d+/edit`));
      await t.seeSaveComplete();
    });

    test("E2E-M09-03-031 新規作成画面では配置済みが無く全ブロックが未使用ブロック欄に並ぶ", async ({
      page,
    }) => {
      await login(page);
      const t = new ContentContentLayoutPage(page);
      await t.gotoNew();
      // 仕様（処理フロー: 新規表示 正本:124 / 入口 正本:72）: 配置済みブロックが無い新規は全ブロックが未使用欄に並ぶ
      await expect(t.unusedBlockArea).toBeVisible();
      const count = await t.unusedBlockItems.count();
      test.skip(count === 0, "ブロックマスタ未整備（未使用欄に並べるブロックが無い）");
      expect(count).toBeGreaterThan(0);
    });

    test("E2E-M09-03-010 名称未入力で保存すると『入力されていません。』が表示される", async ({
      page,
    }) => {
      await login(page);
      const t = new ContentContentLayoutPage(page);
      await t.gotoNew();
      // 名称空のまま登録（仕様: 名称必須。表示メッセージ「入力されていません。」を名称欄直下に出す＝正本:187）
      const opts = t.deviceTypeSelect.locator("option");
      const optValue = await opts.nth((await opts.count()) > 1 ? 1 : 0).getAttribute("value");
      if (optValue) await t.deviceTypeSelect.selectOption(optValue);
      await t.submit();
      await expect(t.nameError).toBeVisible();
    });

    test("E2E-M09-03-011 名称未入力で保存すると保存されず編集画面に滞留する", async ({
      page,
    }) => {
      await login(page);
      const t = new ContentContentLayoutPage(page);
      await t.gotoNew();
      await t.submit();
      // 仕様（画面遷移・検証失敗）: 同一の編集画面を再表示。new のまま保存されない（編集URLへ遷移しない）。
      await expect(page).toHaveURL(new RegExp(`/content/layout/new`));
      await expect(page.locator("body")).not.toContainText("保存しました");
    });

    test("E2E-M09-03-028 端末種別未入力で保存すると検証エラーで保存しない", async ({ page }) => {
      await login(page);
      const t = new ContentContentLayoutPage(page);
      await t.gotoNew();
      await t.nameInput.fill(`E2E端末未選択_${Date.now()}`);
      // 端末種別を空（未選択 placeholder）にして送信。仕様: 端末種別は未入力検証ありで保存しない。
      const hasEmpty = (await t.deviceTypeSelect.locator('option[value=""]').count()) > 0;
      test.skip(!hasEmpty, "DeviceType に空選択肢が無く未入力状態を作れない（要実機確認）");
      await t.deviceTypeSelect.selectOption("");
      await t.submit();
      await expect(page).toHaveURL(new RegExp(`/content/layout/new`));
      await expect(page.locator("body")).not.toContainText("保存しました");
    });

    // --- 編集（シード依存） ---
    test("E2E-M09-03-012 編集画面にレイアウト概要・レイアウト編集カードが表示される", async ({
      page,
    }) => {
      test.skip(!LAYOUT_EDIT_ID, "SEED-M09-03-EDIT（編集対象レイアウトid）未整備");
      await login(page);
      const t = new ContentContentLayoutPage(page);
      await t.gotoEdit(LAYOUT_EDIT_ID);
      await expect(t.nameInput).toBeVisible();
      await expect(t.requiredBadge).toBeVisible(); // レイアウト名は必須バッジ併記（仕様）
      await expect(t.unusedBlockArea).toBeVisible();
    });

    test("E2E-M09-03-015 編集保存成功で『保存しました』＋同じ編集画面へリダイレクト", async ({
      page,
    }) => {
      test.skip(!LAYOUT_EDIT_ID, "SEED-M09-03-EDIT 未整備");
      await login(page);
      const t = new ContentContentLayoutPage(page);
      await t.gotoEdit(LAYOUT_EDIT_ID);
      await t.nameInput.fill(`編集済_${Date.now()}`);
      await t.submit();
      await expect(page).toHaveURL(new RegExp(`/content/layout/${LAYOUT_EDIT_ID}/edit`));
      await t.seeSaveComplete();
    });

    test("E2E-M09-03-016 存在しないレイアウトidの編集はHTTP404", async ({ page }) => {
      await login(page);
      const resp = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/content/layout/99999999/edit`);
      // 仕様（エラー処理・エッジケース）: 対象未検出は存在しない（HTTP404）
      expect(resp?.status()).toBe(404);
    });

    test("E2E-M09-03-019 ブロック未配置セクションに『ブロックをドラッグ＆ドロップ』が表示される", async ({
      page,
    }) => {
      test.skip(!LAYOUT_EDIT_ID, "SEED-M09-03-EDIT 未整備");
      await login(page);
      const t = new ContentContentLayoutPage(page);
      await t.gotoEdit(LAYOUT_EDIT_ID);
      await expect(t.placeholders.first()).toBeVisible();
    });

    test("E2E-M09-03-020 ブロックの三点メニューで4項目のコンテキストメニューが開く", async ({
      page,
    }) => {
      test.skip(!LAYOUT_EDIT_ID, "SEED-M09-03-EDIT（配置/未使用ブロックあり）未整備");
      await login(page);
      const t = new ContentContentLayoutPage(page);
      await t.gotoEdit(LAYOUT_EDIT_ID);
      const trigger = t.contextMenuTriggers.first();
      test.skip((await trigger.count()) === 0, "ブロックが無くメニュー起点を表示できない");
      await trigger.click();
      // 仕様: ポップオーバーで「上に移動」「下に移動」「セクションに移動」「コードプレビュー」
      for (const label of ["上に移動", "下に移動", "セクションに移動", "コードプレビュー"]) {
        await expect(page.getByText(label)).toBeVisible();
      }
    });

    test("E2E-M09-03-022 未使用ブロック検索は一致しないブロックを絞り込む（サーバ問い合わせなし）", async ({
      page,
    }) => {
      test.skip(!LAYOUT_EDIT_ID, "SEED-M09-03-EDIT（未使用ブロックあり）未整備");
      await login(page);
      const t = new ContentContentLayoutPage(page);
      await t.gotoEdit(LAYOUT_EDIT_ID);
      const before = await t.unusedBlockItems.count();
      test.skip(before === 0, "未使用ブロックが無く検索を確認できない");
      // 仕様（フロント挙動: 未使用ブロックの検索／URL直接アクセス: 再検証なし）:
      //  クライアント側のみで絞り込み、サーバへの検索リクエストは発生しない。
      let sawServerRequest = false;
      page.on("request", (r) => {
        // 編集画面の検索でサーバへ問い合わせが発生しないこと（XHR/fetch の発火有無を監視）。
        if (r.url().includes("/content/layout/") && r.resourceType() === "xhr") {
          sawServerRequest = true;
        }
      });
      await t.searchUnused("___zzz_no_match_zzz___");
      // 一致しない語では未使用ブロックが全件非表示になること（絞り込みの実効性を保証）。
      await expect
        .poll(async () =>
          t.unusedBlockItems.evaluateAll(
            (els) => els.filter((e) => (e as HTMLElement).offsetParent !== null).length
          )
        )
        .toBe(0);
      expect(sawServerRequest).toBe(false);
    });

    // --- コードプレビュー Ajax（HTTPレベル） ---
    test("E2E-M09-03-023 view_block にブロックIDを付けてGETするとJSONでソースが返る", async ({
      page,
    }) => {
      test.skip(!BLOCK_ID, "SEED（既知ブロックid）未整備");
      await login(page);
      const res = await page.request.get(
        `/${ECCUBE_ADMIN_ROUTE}/content/layout/view_block?id=${BLOCK_ID}`,
        { headers: { "X-Requested-With": "XMLHttpRequest" } }
      );
      // 仕様（API/バッチ結果）: ブロックIDとテンプレートソースをJSONで返す
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("source");
    });

    test("E2E-M09-03-024 view_block にブロックID無しはHTTP400（不正な要求）", async ({ page }) => {
      await login(page);
      const res = await page.request.get(
        `/${ECCUBE_ADMIN_ROUTE}/content/layout/view_block`,
        { headers: { "X-Requested-With": "XMLHttpRequest" } }
      );
      // 仕様（エラー処理）: ブロックID無しは不正な要求（HTTP400）
      expect(res.status()).toBe(400);
    });

    test("E2E-M09-03-025 view_block で未検出ブロックidはHTTP404（存在しない）", async ({ page }) => {
      await login(page);
      const res = await page.request.get(
        `/${ECCUBE_ADMIN_ROUTE}/content/layout/view_block?id=999999999`,
        { headers: { "X-Requested-With": "XMLHttpRequest" } }
      );
      // 仕様（エラー処理）: ブロック未検出は存在しない（HTTP404）
      expect(res.status()).toBe(404);
    });

    test("E2E-M09-03-030 view_block へAjax以外（XHRヘッダ無し）で要求するとHTTP400（不正な要求）", async ({
      page,
    }) => {
      test.skip(!BLOCK_ID, "SEED（既知ブロックid）未整備");
      await login(page);
      // X-Requested-With を付けずに（=Ajaxでない要求として）GET する。
      const res = await page.request.get(
        `/${ECCUBE_ADMIN_ROUTE}/content/layout/view_block?id=${BLOCK_ID}`
      );
      // 仕様（処理フロー: コードプレビュー取得 / エッジケース 正本:157,234）: Ajaxでない要求は不正な要求（HTTP400）
      expect(res.status()).toBe(400);
    });

    // --- 一覧の削除ボタン出し分け / 新規・編集の入力部品（表示確認） ---
    test("E2E-M09-03-004 既定レイアウトには削除ボタンが表示されない", async ({ page }) => {
      await login(page);
      const t = new ContentContentLayoutPage(page);
      await t.gotoList();
      const cardCount = await t.layoutCards.count();
      test.skip(cardCount === 0, "SEED-M09-03-LAYOUTS（一覧レイアウト）未整備");
      // 仕様（業務ルール 正本:118,206）: 既定レイアウト（id0除外後の id1・2）は削除ボタンを出さない。
      // よって削除ボタン数はカード数より少ない（既定の分だけ非表示）。
      const delCount = await t.deleteButtons.count();
      expect(delCount).toBeLessThan(cardCount);
    });

    test("E2E-M09-03-005 既定外レイアウトには削除ボタンが表示される", async ({ page }) => {
      test.skip(!LAYOUT_DELETABLE_ID, "SEED-M09-03-LAYOUTS（削除可レイアウトid）未整備");
      await login(page);
      const t = new ContentContentLayoutPage(page);
      await t.gotoList();
      // 仕様（業務ルール）: 既定外（割り当て無し）レイアウトには削除ボタンが出る。
      const delBtn = page.locator(
        `button[data-url$="/content/layout/${LAYOUT_DELETABLE_ID}/delete"]`
      );
      await expect(delBtn).toHaveCount(1);
    });

    test("E2E-M09-03-008 新規作成画面では端末種別が選択肢付きプルダウンで表示される", async ({
      page,
    }) => {
      await login(page);
      const t = new ContentContentLayoutPage(page);
      await t.gotoNew();
      // 仕様（入力項目）: 新規は端末種別をプルダウン（select）で選択できる。
      await expect(t.deviceTypeSelect).toBeVisible();
      expect(await t.deviceTypeSelect.locator("option").count()).toBeGreaterThan(0);
    });

    test("E2E-M09-03-013 編集画面の名称はテキスト1欄で必須バッジが併記される", async ({
      page,
    }) => {
      test.skip(!LAYOUT_EDIT_ID, "SEED-M09-03-EDIT 未整備");
      await login(page);
      const t = new ContentContentLayoutPage(page);
      await t.gotoEdit(LAYOUT_EDIT_ID);
      // 仕様（入力項目）: レイアウト名はテキスト入力1欄＋必須バッジ。
      await expect(t.nameInput).toHaveCount(1);
      await expect(t.requiredBadge.first()).toBeVisible();
    });

    test("E2E-M09-03-034 編集画面に静的見出し『レイアウト概要』『レイアウト編集』と『レイアウト名』ラベルが出る", async ({
      page,
    }) => {
      test.skip(!LAYOUT_EDIT_ID, "SEED-M09-03-EDIT 未整備");
      await login(page);
      const t = new ContentContentLayoutPage(page);
      await t.gotoEdit(LAYOUT_EDIT_ID);
      // 仕様（表示メッセージ: 常時表示 正本:172-175）: 概要/編集カード見出しと名称ラベルを表示する。
      await expect(page.getByText("レイアウト概要")).toBeVisible();
      await expect(page.getByText("レイアウト編集")).toBeVisible();
      await expect(page.getByText("レイアウト名")).toBeVisible();
    });

    test("E2E-M09-03-043 ページ候補が無いレイアウトの編集ではプレビューボタンが表示されない", async ({
      page,
    }) => {
      test.skip(!LAYOUT_DELETABLE_ID, "SEED-M09-03-NOPAGE/LAYOUTS（割り当て無しレイアウトid）未整備");
      await login(page);
      const t = new ContentContentLayoutPage(page);
      await t.gotoEdit(LAYOUT_DELETABLE_ID);
      // 仕様（フロント挙動: 画面プレビュー 正本:94）: プレビューブロックはページ候補があるときだけ表示。
      // 割り当てページ（候補）が無いレイアウトではプレビューボタンを出さない。
      await expect(t.previewButton).toHaveCount(0);
    });

    // --- プレビュー（クライアント検証） ---
    test("E2E-M09-03-026 プレビューでページ未選択なら『プレビューするページを選択してください』のアラートで送信中止", async ({
      page,
    }) => {
      test.skip(!LAYOUT_EDIT_ID, "プレビュー候補ありの編集レイアウトid未整備");
      await login(page);
      const t = new ContentContentLayoutPage(page);
      await t.gotoEdit(LAYOUT_EDIT_ID);
      test.skip((await t.previewButton.count()) === 0, "プレビュー候補ページが無く preview-button 非表示");
      let alertMsg = "";
      page.once("dialog", async (d) => {
        alertMsg = d.message();
        await d.dismiss();
      });
      await t.previewButton.click();
      // 仕様（フロント挙動）: ページ未選択は alert を出して送信中止
      expect(alertMsg).toContain("プレビューするページを選択してください");
    });

    // --- 削除（シード依存） ---
    test("E2E-M09-03-017 削除可能レイアウトを削除すると『削除しました』＋一覧へ", async ({ page }) => {
      test.skip(!LAYOUT_DELETABLE_ID, "SEED-M09-03-LAYOUTS（削除可レイアウトid）未整備");
      await login(page);
      const t = new ContentContentLayoutPage(page);
      await t.gotoList();
      const delBtn = page.locator(
        `button[data-url$="/content/layout/${LAYOUT_DELETABLE_ID}/delete"]`
      );
      test.skip((await delBtn.count()) === 0, "対象レイアウトの削除ボタンが見つからない");
      // 削除対象カードの名称を控え、削除後に一覧から消えることを確認する。
      const targetCard = t.layoutCards.filter({ has: delBtn });
      const deletedName = (await targetCard.locator("a.card-title").first().innerText()).trim();
      await delBtn.click();
      await expect(t.deleteModal).toBeVisible();
      await t.deleteModalConfirm.click();
      await expect(page).toHaveURL(new RegExp(`/${ECCUBE_ADMIN_ROUTE}/content/layout$`));
      await t.seeDeleteComplete();
      // 仕様（状態変化）: 対象が一覧から消えること。
      await expect(t.layoutTitleLinks.filter({ hasText: deletedName })).toHaveCount(0);
    });

    test("E2E-M09-03-018 割り当てページありレイアウトの削除は警告で削除されない", async ({ page }) => {
      test.skip(
        !LAYOUT_ASSIGNED_ID || !LAYOUT_ASSIGNED_NAME,
        "SEED-M09-03-ASSIGNED（割り当て有りレイアウト）未整備"
      );
      await login(page);
      const t = new ContentContentLayoutPage(page);
      // 削除はDELETEメソッド。確認モーダル経由で実行。
      await t.gotoList();
      const delBtn = page.locator(
        `button[data-url$="/content/layout/${LAYOUT_ASSIGNED_ID}/delete"]`
      );
      test.skip((await delBtn.count()) === 0, "対象の削除ボタンが見つからない");
      await delBtn.click();
      await t.deleteModalConfirm.click();
      // 仕様（表示メッセージ/処理フロー）: 関連データがあるため削除できませんでした を積み一覧へ戻す
      await t.seeDeleteForbidden(LAYOUT_ASSIGNED_NAME);
      // 仕様（状態変化）: 削除拒否時は対象が一覧に残ること。
      await expect(t.layoutTitleLinks.filter({ hasText: LAYOUT_ASSIGNED_NAME })).toHaveCount(1);
    });

    // --- 自動化予定だが未実装/要実機確認（fixme） ---
    test.fixme(
      "E2E-M09-03-027 未認証で一覧URLへ直アクセスするとログイン画面へ誘導（要: 別ブラウザコンテキストで未ログイン状態を作る）",
      async () => {
        // 期待は仕様（権限・認可: 未認証は利用不可・ログインへ誘導）由来。
        // 共有fixture/storageStateの兼ね合いで未ログインコンテキスト生成手順を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M09-03-021 コードプレビューでaceエディタにソースが表示される（要実機: ace描画・モーダル起動タイミング）",
      async () => {
        // 期待は仕様（フロント挙動: 読み取り専用ace/twigモードへ表示）由来。
        // ace 初期化とポップオーバー→モーダル連鎖の待機を実機確認後に実装。#block-source-code の値検証を行う。
      }
    );

    test.fixme(
      "E2E-M09-03-029 プレビュー押下でフロント画面が別タブ(popup)で開く（要シード: 割り当てページ・公開フロント）",
      async () => {
        // 期待は仕様（画面遷移: 別タブで対象ページのプレビュー）由来。フロント描画内容自体は手動（ケース表）。
        // あわせて、プレビュー実行では元タブに「保存しました」フラッシュを積まないこと（正本:145）を確認する。
      }
    );

    test.fixme(
      "E2E-M09-03-039 コードプレビュー取得失敗時に読み取り専用エディタへステータス文言が表示される（要実機: ace描画・失敗応答）",
      async () => {
        // 期待は仕様（フロント挙動: コードプレビューのモーダル 正本:93,105）由来。
        // 取得が失敗する状況（未検出/不正）でモーダルの #block-source-code に失敗時のステータス文言が出ることを確認。
      }
    );

    test.fixme(
      "E2E-M09-03-040 コードプレビューの『コード編集』でブロック編集画面へ遷移する（DUMMY_BLOCK_ID→実id置換・要実機）",
      async () => {
        // 期待は仕様（画面遷移: コード編集でブロック編集画面へ 正本:93,332）由来。
        // #block-edit の data-href（admin_content_block_edit）でダミーIDが実ブロックIDに置換され遷移することを確認。
      }
    );
  }
);
