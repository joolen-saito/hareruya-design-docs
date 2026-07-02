/**
 * 管理画面 在庫管理 在庫移動指示リスト作成/検索 E2E。納品ケース表
 * integration_test/e2e/m04_24_admin_stock_stock_move_instruction_search_create_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、要シード/要ファイル/要実機確認など自動化予定だが未実装のものは test.fixme で残す。
 * 手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/ec-cube-enterprise/m04-24_admin_stock_stock_move_instruction_search_create.md /
 * 基本設計(在庫管理機能) / 観点表 / messages.ja.yaml)由来（オラクル独立性）。実装の現挙動を期待値に写さない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・two_factor_auth.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報(ECCUBE_ADMIN_USER/PASS)が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockStockMoveInstructionSearchCreatePage } from "../../../pages/admin/m04/m04_24_admin_stock_stock_move_instruction_search_create.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

const LOGIN_RE = /\/login(\?|$)/;

// 表示文言の期待値（仕様 messages.ja.yaml 由来）は POM のロケータ側に集約する（オラクル独立性）。

/** 管理ログインして在庫移動指示一覧を開く。 */
async function loginAndOpenList(page: Page): Promise<StockStockMoveInstructionSearchCreatePage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const list = new StockStockMoveInstructionSearchCreatePage(page);
  await list.goto();
  return list;
}

test.describe("管理画面 > 在庫管理 > 在庫移動指示リスト作成/検索", { tag: ["@admin", "@stock"] }, () => {
  // ===== 認証ガード（資格情報不要・非破壊） =====

  test("E2E-M04-24-080 未ログインで一覧URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock/move-instruction`);
    await expect(page).toHaveURL(LOGIN_RE); // 利用者視点の入口: すべて管理ログインを要する
    await expect(page.locator("#login_id")).toBeVisible();
  });

  test("E2E-M04-24-081 未ログインで詳細URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock/move-instruction/1`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  test("E2E-M04-24-082 未ログインでCSV雛形DL URL(GET)直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
    // list/detail/csv-template の GET は同一 ^/admin firewall。GET系入口の網羅。
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock/move-instruction/csv-template`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  // ===== 一覧・検索（ログインのみで非破壊） =====

  test("E2E-M04-24-001 一覧: 検索カード・CSVファイル登録カード・検索ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const list = await loginAndOpenList(page);
    await expect(list.searchCardTitle).toBeVisible();
    await expect(list.csvRegistrationCardTitle).toBeVisible();
    await expect(list.csvRegistrationButton).toBeVisible();
    await expect(list.searchButton).toBeVisible();
  });

  test("E2E-M04-24-002 一覧: 検索フォームの各入力項目が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const list = await loginAndOpenList(page);
    await list.seeSearchForm();
    await expect(list.createDateStart).toBeVisible();
    await expect(list.updateDateStart).toBeVisible();
    await expect(list.shipmentStatusNotDone).toBeAttached();
    await expect(list.shipmentStatusDone).toBeAttached();
  });

  test("E2E-M04-24-004 検索実行: 条件未指定POSTで検索結果件数見出しが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const list = await loginAndOpenList(page);
    await list.search({}); // 全件検索（プロセスフロー#2 正常POST）
    await expect(list.searchResultCount).toBeVisible(); // 「検索結果：N件が該当しました」
  });

  test("E2E-M04-24-005 検索0件: 一致しない移動指示IDで該当なしメッセージが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const list = await loginAndOpenList(page);
    await list.search({ instructionId: "999999999999" }); // 部分一致でも該当しない値
    await expect(list.searchNoResult).toBeVisible();
  });

  test("E2E-M04-24-006 検索バリデーション: 登録日 From>To で検索が実行されず未検索プロンプトに留まる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    // 仕様(検索条件節/分岐): 日付 From>To はフォーム検証エラーでリダイレクトせず一覧空で再表示。
    // 注: エラー文言キー admin.product.date_range_error は messages.ja.yaml に未定義（不具合候補#3）。
    //     文言そのものはオラクル化せず、「検索が実行されない（結果件数が出ない）」ことで仕様を判定する。
    const list = await loginAndOpenList(page);
    await list.search({ createDateStart: "2025-12-31", createDateEnd: "2025-01-01" });
    await expect(list.searchFirst).toBeVisible(); // 検索ブロック→未検索プロンプト
    await expect(list.searchResultCount).toHaveCount(0);
  });

  test("E2E-M04-24-007 検索バリデーション: 更新日 From>To で検索が実行されず未検索プロンプトに留まる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const list = await loginAndOpenList(page);
    await list.search({ updateDateStart: "2025-12-31", updateDateEnd: "2025-01-01" });
    await expect(list.searchFirst).toBeVisible();
    await expect(list.searchResultCount).toHaveCount(0);
  });

  test("E2E-M04-24-021 詳細: 存在しない移動指示IDへアクセスすると404になる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(ADMIN_USER, ADMIN_PASS);
    const resp = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock/move-instruction/99999999`);
    expect(resp?.status()).toBe(404); // find($id)=null → NotFoundHttpException
  });

  test("E2E-M04-24-060 CSV雛形ダウンロード: リンク押下でダウンロードが発火する（内容はM04-25/手動）", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const list = await loginAndOpenList(page);
    await list.search({}); // 一覧結果ヘッダにダウンロードリンクを出現させる
    await expect(list.csvTemplateLink).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      list.csvTemplateLink.click(),
    ]);
    expect(download.suggestedFilename()).toContain("stock_move_instruction_record_template");
  });

  test("E2E-M04-24-070 送り状CSV出力: 未選択で出力ボタン押下すると選択を促すダイアログが出る", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const list = await loginAndOpenList(page);
    await list.search({}); // 出力ボタンを出現させる
    await expect(list.labelsExportButton).toBeVisible();
    const [dialog] = await Promise.all([
      page.waitForEvent("dialog"),
      list.labelsExportButton.click(),
    ]);
    // 期待文言は仕様(messages.ja.yaml:4969)由来。
    expect(dialog.message()).toContain("送り状CSVを出力する在庫移動指示にチェックを入れてください。");
    await dialog.dismiss();
  });

  // ===== 自動化予定だが未実装/要シード・要ファイル・要実機確認（fixme・抜け漏れ可視化） =====

  test("E2E-M04-24-003 初回GET(resume無し)は一覧空・未検索プロンプトを表示する（@known-defect 不具合候補#1）", { tag: ["@known-defect"] }, async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    // 期待は仕様(プロセスフロー#4: 初回GETは検索条件初期化・一覧は空)由来。
    // 実装(Controller index else節:125-135)は常にpaginateするため本テストは現状失敗想定（仕様乖離の検出）。実装に寄せない。
    const list = await loginAndOpenList(page); // list.goto() = resume無しの初回GET
    await expect(list.searchFirst).toBeVisible();
    await expect(list.searchResultCount).toHaveCount(0);
  });
  test.fixme("E2E-M04-24-083 未ログインで更新系POST(tracking/delete/labels/csv-tracking)→認証要求（要: 直接POST）", async () => {});
  test.fixme("E2E-M04-24-073 CSRFトークン欠落の更新系POSTは受理されない（要: 直接POST。期待は『処理されない』で判定し実装シンボルはオラクル化しない）", async () => {});
  test.fixme("E2E-M04-24-008 一覧は登録日降順で表示される（要: 既知の登録日を持つ複数シード）", async () => {});
  test.fixme("E2E-M04-24-011 出庫元店舗で絞り込むと該当指示のみ結果に含まれる（要 SEED-M04-24-SEARCH）", async () => {});
  test.fixme("E2E-M04-24-012 入庫先店舗で絞り込むと該当指示のみ結果に含まれる（要 SEED-M04-24-SEARCH）", async () => {});
  test.fixme("E2E-M04-24-013 在庫移動振替IDで絞り込むと該当指示のみ結果に含まれる（要 SEED-M04-24-SEARCH）", async () => {});
  test.fixme("E2E-M04-24-014 発送状況(未のみ/済のみ/両方/未指定)で絞り込むと該当指示のみ結果に含まれる（要 SEED-M04-24-SEARCH）", async () => {});
  test.fixme("E2E-M04-24-015 登録日/更新日の範囲(境界含む)で絞り込むと範囲内のみ結果に含まれる（要 SEED-M04-24-SEARCH）", async () => {});
  test.fixme("E2E-M04-24-016 移動指示IDの部分一致(CONCAT(id,'') LIKE %値%)で該当指示が結果に含まれる（005の0件と対の正常系・要 SEED-M04-24-SEARCH）", async () => {});
  test.fixme("E2E-M04-24-017 移動指示IDに % または _ を入力するとエスケープされリテラル一致として扱われ全件ヒットにならない（要 SEED-M04-24-SEARCH）", async () => {});
  test.fixme("E2E-M04-24-026 存在しないIDへの更新系POST(detail/tracking/delete)は404（GET詳細404=021と対・要: CSRFトークン付き直接POST）", async () => {});
  test.fixme("E2E-M04-24-025 詳細画面に移動指示の各表示項目(ID・発送状況・店舗・登録/更新日・登録者/更新者・各金額・在庫移動一覧)が表示される（要シード）", async () => {});
  test.fixme("E2E-M04-24-009 POST検索後 ?resume=1 で同一条件の検索結果が復元される（要シード）", async () => {});
  test.fixme("E2E-M04-24-010 一覧行にチェックボックス・移動指示IDリンク・送り状No.登録ボタンが表示される（要シード）", async () => {});
  test.fixme("E2E-M04-24-020 詳細: 移動指示IDリンクから詳細画面へ遷移し登録ボタンが表示される（要シード）", async () => {});
  test.fixme("E2E-M04-24-022 詳細更新: 送り状No.・備考を更新すると「保存しました」が表示され詳細へ留まる（要シード）", async () => {});
  test.fixme("E2E-M04-24-023 詳細: 登録済み送り状No.を空白に戻して登録するとエラー表示で更新されない（要: 送り状No.登録済みシード）", async () => {
    // 期待は仕様(Excel: 変更時の空白のみ更新は不可)＋messages.ja.yaml:5014「送り状番号を空に戻して…」由来。
  });
  test.fixme("E2E-M04-24-024 詳細: 送り状No.登録済みの指示は削除ボタンが非活性（要: 送り状No.登録済みシード）", async () => {});
  test.fixme("E2E-M04-24-030 一覧モーダルから送り状No.登録すると「送り状No.を登録しました。」表示で一覧へ（要シード）", async () => {});
  test.fixme("E2E-M04-24-040 送り状No.未登録の指示を削除すると「削除しました」表示で一覧へ（要シード）", async () => {});
  test.fixme("E2E-M04-24-041 送り状No.登録済みの指示は削除不可で「送り状No.登録後は削除できません。」表示（要シード）", async () => {});
  test.fixme("E2E-M04-24-050 CSV登録: ファイル未選択/不正は「ファイルが不正です。」表示（要: JS無効化での直接POST or 実機確認）", async () => {});
  test.fixme("E2E-M04-24-051 CSV登録: 正常CSVで「送り状No.を一括登録しました。」表示（要シード＋CSVファイル）", async () => {});
  test.fixme("E2E-M04-24-052 CSV登録: ヘッダ不正CSVで「CSVのヘッダーが不正です。」表示（要CSVファイル）", async () => {});
  test.fixme("E2E-M04-24-053 CSV登録: ヘッダのみCSVで「有効な行がありません。」表示（要CSVファイル）", async () => {});
  test.fixme("E2E-M04-24-054 CSV登録: 存在しない移動指示ID行で「移動指示が見つかりません」表示（要CSVファイル）", async () => {});
  test.fixme("E2E-M04-24-055 CSV登録: 送り状No.空行で「送り状Noが空欄です」表示（要シード＋CSVファイル）", async () => {});
  test.fixme("E2E-M04-24-056 CSV登録: 出庫元店舗不一致行で「出庫元店舗が一致しません」表示（要CSVファイル）", async () => {});
  test.fixme("E2E-M04-24-057 CSV登録: 入庫先店舗不一致行で「入庫先店舗が一致しません」表示（要CSVファイル）", async () => {});
  test.fixme("E2E-M04-24-058 CSV登録: 列数不一致行でフォーマット不一致エラー表示（要CSVファイル）", async () => {});
  test.fixme("E2E-M04-24-059 CSV登録: 移動指示ID非数値/0以下行で「移動指示が見つかりません」表示（要CSVファイル）", async () => {});
  test.fixme("E2E-M04-24-061 CSV登録: 必須列が存在しない行は列不存在の行エラーで当該行スキップ・処理継続（列数不一致058・ヘッダ不正052とは別分岐 Handler.php:88-89・要CSVファイル）", async () => {});
  test.fixme("E2E-M04-24-071 送り状CSV出力: 行を選択して出力するとダウンロードが発火する（要シード／内容はM04-25/手動）", async () => {});
  test.fixme("E2E-M04-24-072 送り状CSV出力: ID空のPOSTは404（要: CSRFトークン付き直接POST）", async () => {});
});
