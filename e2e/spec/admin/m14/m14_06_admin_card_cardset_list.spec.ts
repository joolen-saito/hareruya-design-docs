/**
 * 管理画面 カードセット管理（一覧） E2E。
 * 納品ケース表 integration_test/e2e/m14_06_admin_card_cardset_list_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、画像/特殊セットのシード前提が必要なものは test.fixme（理由付き）。
 * 手動/対象外（参照系一覧で非該当・DB内部観測外・別機能委譲）はケース表で全量管理し、specには残さない。
 * 期待結果は仕様（functions/pf-eccube3/m14-06_admin_card_cardset_list.md ＋ 観点表）由来（オラクル独立性）。
 * 実装の現挙動・ルート名・セッションキー・現UI文言を期待値へ流用しない。設計書と実装の乖離は付帯表4を参照。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証: 既存リポ規約（spec/admin/login.spec.ts）に倣い @playwright/test + AdminLoginPage 直利用。
 *       資格情報が無いと走らないよう env-gate（test.skip(!HAS_CREDS)）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { CardCardsetListPage } from "../../../pages/admin/m14/m14_06_admin_card_cardset_list.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// 仕様（設計書）由来の確認文言。実装文言に合わせて変えない（オラクル独立性）。
const CONFIRM_PROMO = "プロモカード一覧をダウンロードしますか?"; // 設計書 フロント挙動/JS挙動

const NEW_RE = /\/cardset\/new(\?|$)/; // admin_cardset_new（仕様）
const EDIT_RE = /\/cardset\/\d+\/edit(\?|$)/; // admin_cardset_edit（仕様）
const MASTER_RE = /mtg_master_data/; // ブロックマスタ管理（admin_data_mtg_master_data）
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/cardset(/page/1)?(\\?|$)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
}

test.describe("カードセット管理 > 一覧", { tag: ["@admin", "@card", "@cardset"] }, () => {
  // ===== 未認証ガード（資格情報不要） =====

  test("E2E-M14-06-070 未ログインで一覧URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/cardset`);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  // ===== 一覧表示（SEED-M14-06-CARDSET） =====

  test("E2E-M14-06-001 一覧初期表示でサブタイトル「カードセット管理」が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new CardCardsetListPage(page);
    await list.goto();
    await expect(page.locator("body")).toContainText("カードセット管理");
  });

  test("E2E-M14-06-002 一覧テーブルの見出し列が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new CardCardsetListPage(page);
    await list.goto();
    await list.seeTableHeaders();
  });

  test("E2E-M14-06-003 新規登録・ブロック追加・画像DL（セット別/言語別）の各ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new CardCardsetListPage(page);
    await list.goto();
    await expect(list.newLink).toBeVisible();
    await expect(list.addBlockLink).toBeVisible();
    await expect(list.downloadBySetButton).toBeVisible();
    await expect(list.downloadByLangButton).toBeVisible();
  });

  test("E2E-M14-06-004 一覧がHTMLテーブルでレンダリングされる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new CardCardsetListPage(page);
    await list.goto();
    await expect(list.table).toBeVisible();
  });

  // ===== 画面遷移 =====

  test("E2E-M14-06-010 「新規登録」→ カードセット新規登録画面へ遷移", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new CardCardsetListPage(page);
    await list.goto();
    await list.newLink.click();
    await expect(page).toHaveURL(NEW_RE); // 仕様: admin_cardset_new
  });

  test("E2E-M14-06-011 行「編集」→ カードセット編集画面へ遷移", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new CardCardsetListPage(page);
    await list.goto();
    await expect(list.editLinks.first()).toBeVisible(); // 前提: 1件以上（SEED-M14-06-CARDSET）
    await list.editLinks.first().click();
    await expect(page).toHaveURL(EDIT_RE); // 仕様: admin_cardset_edit
  });

  test("E2E-M14-06-012 「ブロックの追加」→ ブロックマスタ管理画面へ遷移", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new CardCardsetListPage(page);
    await list.goto();
    await list.addBlockLink.click();
    await expect(page).toHaveURL(MASTER_RE); // 仕様: ブロックマスタ管理画面
  });

  test("E2E-M14-06-013 行「削除」アイコン→ 削除確認モーダルが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new CardCardsetListPage(page);
    await list.goto();
    await expect(list.deleteTriggers.first()).toBeVisible(); // 前提: 1件以上
    await list.deleteTriggers.first().click();
    await expect(list.deleteModal).toBeVisible();
  });

  // ===== 表示件数・並び順・ページング（SEED-M14-06-CARDSET-MULTI） =====

  test("E2E-M14-06-020 表示件数ドロップダウンで別件数を選ぶと選択件数が反映される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new CardCardsetListPage(page);
    await list.goto();
    // 件数ドロップダウンは件数>0時のみ描画される（index.twig:87）。表示されなければデータ前提不足。
    await expect(list.pageCountSelect).toBeVisible();
    const optionValues = await list.pageCountSelect.locator("option").evaluateAll(
      (opts) => (opts as HTMLOptionElement[]).map((o) => o.value),
    );
    test.skip(optionValues.length < 2, "表示件数候補が2件未満（mtb_page_max前提不足）");
    // onchange で option value（URL）へ遷移する（index.twig:20-25）。
    // 仕様: 選択件数が一覧へ反映される（page_count 一致時のみ反映・設計書 処理フロー5）。
    await list.pageCountSelect.selectOption({ index: 1 });
    await expect(list.table).toBeVisible();
    // 選択した件数が selected として反映されること（仕様: 表示件数の反映）。
    await expect(list.pageCountSelect).toHaveValue(optionValues[1]);
  });

  test("E2E-M14-06-021 並び順ドロップダウンで別順を選ぶと選択した並び順が反映される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new CardCardsetListPage(page);
    await list.goto();
    await expect(list.sortSelect).toBeVisible();
    const optionValues = await list.sortSelect.locator("option").evaluateAll(
      (opts) => (opts as HTMLOptionElement[]).map((o) => o.value),
    );
    test.skip(optionValues.length < 2, "並び順候補が2件未満");
    // 仕様: 定義済み並び順のいずれかと一致する場合のみ反映（設計書 処理フロー6）。
    await list.sortSelect.selectOption({ index: 1 });
    await expect(list.table).toBeVisible();
    // 選択した並び順が selected として反映されること（行順の厳密検証はシード依存のため手動・付帯表3）。
    await expect(list.sortSelect).toHaveValue(optionValues[1]);
  });

  test("E2E-M14-06-022 ページャの2ページ目リンク押下で2ページ目が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new CardCardsetListPage(page);
    await list.goto();
    const hasPager = await list.pagination.isVisible().catch(() => false);
    test.skip(!hasPager, "2ページ未満（SEED-M14-06-CARDSET-MULTI 前提不足）");
    // 仕様: ページャの2ページ目リンクを押下し該当ページの行を表示する（直接URL遷移ではなくリンク操作）。
    const page2Link = list.pageLink(2);
    test.skip((await page2Link.count()) < 1, "2ページ目リンクが無い（2ページ未満）");
    await page2Link.first().click();
    await expect(list.table).toBeVisible();
    await expect(page).toHaveURL(/\/cardset\/page\/2/);
  });

  test("E2E-M14-06-023 表示件数変更後の再アクセスで選択状態が維持される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new CardCardsetListPage(page);
    await list.goto();
    await expect(list.pageCountSelect).toBeVisible();
    const optionValues = await list.pageCountSelect.locator("option").evaluateAll(
      (opts) => (opts as HTMLOptionElement[]).map((o) => o.value),
    );
    test.skip(optionValues.length < 2, "表示件数候補が2件未満");
    const chosen = optionValues[1];
    await list.pageCountSelect.selectOption({ index: 1 });
    await list.goto(); // 再アクセス（後続GET）
    // 仕様: セッション保持により後続GETでも選択件数が selected として維持されること（設計書 処理フロー5/9）。
    await expect(list.pageCountSelect).toHaveValue(chosen);
    await expect(list.table).toBeVisible();
  });

  // ===== 不正クエリの無視（バリデーション） =====

  test("E2E-M14-06-030 マスタに無い表示件数クエリは無視され一覧が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    // 入力は仕様のクエリ名 pageCount（設計書 入口/処理フロー5・117行）を使用。
    // mtb_page_max.name に非存在の値は無視され、専用エラー画面にならず一覧が表示される。
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/cardset/page/1?pageCount=9999`);
    const list = new CardCardsetListPage(page);
    await expect(list.table).toBeVisible(); // 仕様: 無効件数は無視・専用エラー画面なし
  });

  test("E2E-M14-06-031 定義外の並び順クエリは無視され一覧が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    // 入力は仕様のクエリ名 sortSelect（設計書 入口/処理フロー6）を使用。
    // 定義済み4文言と完全一致しない値は無視され、専用エラー画面にならず一覧が表示される。
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/cardset/page/1?sortSelect=invalid`);
    const list = new CardCardsetListPage(page);
    await expect(list.table).toBeVisible(); // 仕様: 無効並び順は無視・専用エラー画面なし
  });

  test("E2E-M14-06-032 非数値の表示件数クエリは無視され一覧が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    // 設計書 処理フロー5「pageCount があり数値であり」の数値判定の否定分岐（E2E-030のマスタ非存在数値とは別の対）。
    // 非数値は無視され、専用エラー画面にならず一覧が表示される。
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/cardset/page/1?pageCount=abc`);
    const list = new CardCardsetListPage(page);
    await expect(list.table).toBeVisible(); // 仕様: 非数値件数は無視・専用エラー画面なし
  });

  // ===== 全選択JS =====

  test("E2E-M14-06-040 表頭チェックの全選択で行チェックが一括ONになる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new CardCardsetListPage(page);
    await list.goto();
    const count = await list.rowCheckboxes.count();
    test.skip(count < 1, "カードセット0件（SEED-M14-06-CARDSET 前提不足）");
    await list.toggleSelectAll(true);
    for (let i = 0; i < count; i++) {
      await expect(list.rowCheckboxes.nth(i)).toBeChecked();
    }
  });

  test("E2E-M14-06-041 表頭チェック再操作で行チェックが一括OFFになる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new CardCardsetListPage(page);
    await list.goto();
    const count = await list.rowCheckboxes.count();
    test.skip(count < 1, "カードセット0件");
    await list.toggleSelectAll(true);
    await list.toggleSelectAll(false);
    for (let i = 0; i < count; i++) {
      await expect(list.rowCheckboxes.nth(i)).not.toBeChecked();
    }
  });

  // ===== confirm 確認ダイアログ（未選択時） =====

  test("E2E-M14-06-052 未選択で画像ダウンロード押下→確認ダイアログが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new CardCardsetListPage(page);
    await list.goto();
    let dialogMessage = "";
    page.once("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });
    await list.downloadBySetButton.click(); // 行未選択
    await expect.poll(() => dialogMessage).toContain(CONFIRM_PROMO); // 設計書 JS挙動 由来
  });

  test("E2E-M14-06-053 確認ダイアログでキャンセルすると送信が中止され一覧に滞留する", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new CardCardsetListPage(page);
    await list.goto();
    page.once("dialog", async (dialog) => {
      await dialog.dismiss(); // 否定
    });
    await list.downloadBySetButton.click();
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(LIST_RE); // 送信されず一覧に滞留
  });

  test("E2E-M14-06-054 行を選択して画像DL（セット別）押下→確認ダイアログ無しで送信される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new CardCardsetListPage(page);
    await list.goto();
    const count = await list.rowCheckboxes.count();
    test.skip(count < 1, "カードセット0件（SEED-M14-06-CARDSET 前提不足）");
    // 仕様（設計書 JS挙動）: 少なくとも1行が選択されていれば確認なしで送信を継続する。
    let dialogShown = false;
    page.on("dialog", async (dialog) => {
      dialogShown = true;
      await dialog.dismiss();
    });
    await list.rowCheckboxes.first().check();
    await list.downloadBySetButton.click();
    await page.waitForTimeout(300);
    expect(dialogShown).toBe(false); // 選択ありは confirm が出ない（送信継続）
  });

  test("E2E-M14-06-055 未選択で画像DL（言語別）押下→確認ダイアログが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new CardCardsetListPage(page);
    await list.goto();
    let dialogMessage = "";
    page.once("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });
    await list.downloadByLangButton.click(); // 行未選択
    await expect.poll(() => dialogMessage).toContain(CONFIRM_PROMO); // 設計書 JS挙動 由来
  });

  test("E2E-M14-06-056 言語別DLの確認ダイアログでキャンセルすると送信が中止され一覧に滞留する", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new CardCardsetListPage(page);
    await list.goto();
    page.once("dialog", async (dialog) => {
      await dialog.dismiss(); // 否定
    });
    await list.downloadByLangButton.click();
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(LIST_RE); // 送信されず一覧に滞留
  });

  test("E2E-M14-06-080 行チェックはセッションに保存されず再表示で復元されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new CardCardsetListPage(page);
    await list.goto();
    const count = await list.rowCheckboxes.count();
    test.skip(count < 1, "カードセット0件（SEED-M14-06-CARDSET 前提不足）");
    // 仕様（設計書 セッションへ保存しない情報＝行チェックON/OFF）: 再表示で復元されない。
    await list.rowCheckboxes.first().check();
    await list.goto(); // 再表示（後続GET）
    await expect(list.rowCheckboxes.first()).not.toBeChecked();
  });

  // ===== シード前提が必要（未実装・抜け漏れ可視化） =====

  test.fixme(
    "E2E-M14-06-050 行選択し画像DL（セット別）→ ZIPダウンロード発火（要: 画像有りセットのシード SEED-M14-06-CARDSET-IMG）",
    async () => {
      // 期待は仕様（画像DL POST→ZIP応答）由来。waitForEvent('download') で発火確認。
      // 画像実体がないと execute がエラーリダイレクトするため、画像シード整備後に実装。
    }
  );

  test.fixme(
    "E2E-M14-06-051 行選択し画像DL（言語別）→ ZIPダウンロード発火（要: SEED-M14-06-CARDSET-IMG・ルート乖離 付帯表4#6）",
    async () => {
      // 期待は仕様（言語別DL POST→ZIP応答）由来。ZIP内容は手動。
    }
  );

  test.fixme(
    "E2E-M14-06-060 特殊セットフラグ真の行にタグアイコン表示（要: SEED-M14-06-CARDSET-SPECIAL）",
    async () => {
      // 期待は仕様（special_flg真でタグアイコン・DBカラム節 設計書135行）由来。special_flg=真の行シード後に実装。
    }
  );

  test.fixme(
    "E2E-M14-06-061 サイドメニュー表示フラグ真の行にアイコン表示（要: SEED-M14-06-CARDSET-SIDEMENU）",
    async () => {
      // 期待は仕様（display_side_menu_flg真でタグアイコン・設計書135行）由来。
      // 列アイコンのDOM根拠（i.fa-*）は要実機確認のためフラグ真の行シード後に実装。
    }
  );

  test.fixme(
    "E2E-M14-06-062 支店表示フラグ真の行にアイコン表示（要: SEED-M14-06-CARDSET-BRANCH）",
    async () => {
      // 期待は仕様（branch_display_flg真でタグアイコン・設計書135行）由来。
      // 列アイコンのDOM根拠は要実機確認のためフラグ真の行シード後に実装。
    }
  );

  test.fixme(
    "E2E-M14-06-005 シンボル画像列に画像（無ければプレースホルダ）が表示される（要: SEED-M14-06-CARDSET-IMG）",
    async () => {
      // 期待は仕様（symbol_image: 有れば画像URL・無ければプレースホルダ・設計書132行）由来。
      // シンボル列セルのDOM根拠は要実機確認のため画像有り行シード後に実装。
    }
  );

  test.fixme(
    "E2E-M14-06-006 シンボル画像が無いセットの行にプレースホルダが表示される（要: SEED-M14-06-CARDSET-NOIMG）",
    async () => {
      // 期待は仕様（symbol_image 無しはプレースホルダ・設計書132行・E2E-005の異常対）由来。
      // シンボル列セルのDOM根拠は要実機確認のため画像無し行シード後に実装。
    }
  );

  test.fixme(
    "E2E-M14-06-063 特殊セットフラグ偽の行にタグアイコンが表示されない（要: SEED-M14-06-CARDSET-SPECIAL 偽行）",
    async () => {
      // 期待は仕様（special_flg 偽でタグ非表示・設計書135行・E2E-060の異常対）由来。
      // 偽行の特定とタグアイコン列DOMは要実機確認のため special_flg=偽 の行シード後に実装。
    }
  );

  test.fixme(
    "E2E-M14-06-090 resume=1 で再アクセスすると保持された表示件数が維持される（要: resume機構・付帯表4#2）",
    async () => {
      // 期待は仕様（設計書 入口33行/処理フロー3: resume=1 で3キー保持）由来。
      // 表示件数を変更後 /cardset?resume=1 を開き、選択件数が維持されることを確認。
      // 刷新先は resume 未実装（不具合候補#2）のため実機で挙動差を不具合検出する。
    }
  );

  test.fixme(
    "E2E-M14-06-091 resume無しで一覧入口へ入ると保持値がクリアされ既定件数に戻る（要: resume機構・付帯表4#2）",
    async () => {
      // 期待は仕様（設計書 処理フロー3/セッション222行: page_no無し かつ resume≠1 で3キー削除＝初期化）由来。
      // 表示件数を変更後 /cardset（page_no無し・resume無し）を開き、既定件数へ戻ることを確認。
      // 刷新先は resume/クリア未実装（不具合候補#2）のため実機で挙動差を不具合検出する。
    }
  );
});
