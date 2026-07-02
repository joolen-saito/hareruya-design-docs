/**
 * デッキ管理 — デッキタグ一覧 E2E。納品ケース表
 *   integration_test/e2e/m15_07_admin_deck_deck_tag_list_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装する。手動/対象外はケース表で全量管理する
 * （規約「手動/対象外はspecに残さない」に従う）。
 * 期待結果は仕様（基本設計＝刷新後要件 / messages.ja.yaml）由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * screenExists=false: 設計書(pf-eccube3 カスタムプラグイン)の専用画面 deckTag.twig（モーダル/件数・並びドロップ
 *   ダウン/ページネーション/行単位の利用中チェック付き削除）は刷新先 ec-cube-enterprise に存在しない。
 *   デッキタグ管理は汎用「MTGマスターデータ管理」画面（admin_data_mtg_master_data?entity=deck_tag）で行う。
 *   本specの自動化は**代替画面**に対するものであり、設計書固有の検証エラー表示/表示順重複制約/利用中削除
 *   ガード/更新ID 404 は刷新先に無い（ケース表 付帯表4 不具合候補参照）。
 *
 * 実行方針（安全第一・共有ステージング）:
 *  - 資格情報（ECCUBE_ADMIN_USER/PASS）が無いと走らないよう test.skip でガード（未実行＝抜け漏れ可視化）。
 *  - 010/011/012/020 はマスタデータを変更するため、識別接頭辞付きシード（SEED-M15-07-DECKTAG /
 *    SEED-M15-07-DECKTAG-DEL）で隔離・復元する前提（実装は後工程）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { DeckDeckTagListPage } from "../../../pages/admin/m15/m15_07_admin_deck_deck_tag_list.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// 管理ログインへの誘導を判定。誤った（フロント等の）ログイン画面で通過しないよう
// 管理ルート配下の /login に限定する（権限・認可＝未認証は共通管理ログインへ）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);

/** 管理ログインして代替画面（entity=deck_tag）を開く。 */
async function loginAndOpen(page: Page): Promise<DeckDeckTagListPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const target = new DeckDeckTagListPage(page);
  await target.goto();
  return target;
}

test.describe("デッキ管理 > デッキタグ一覧", { tag: ["@admin", "@deck"] }, () => {
  // ===== 認証不要 =====

  test("E2E-M15-07-030 未ログインで代替画面URL→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/data/mtg_master_data?entity=deck_tag`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  // ===== 表示（SEED-M15-07-DECKTAG） =====

  test("E2E-M15-07-001 デッキタグ一覧（列見出しと既存行）が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const target = await loginAndOpen(page);
    await expect(target.entitySelect).toHaveValue("deck_tag"); // entity=deck_tag が選択済み
    await target.seeList();
  });

  test("E2E-M15-07-002 デッキタグ行が表示順（sort_no）昇順で並ぶ", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const target = await loginAndOpen(page);
    await target.seeList();
    const sortInputs = target.table.locator('tbody input[name$="[sortNo]"]');
    const count = await sortInputs.count();
    let prev = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < count; i++) {
      const raw = (await sortInputs.nth(i).inputValue()).trim();
      if (raw === "") continue; // 末尾の新規空行はスキップ
      const v = Number(raw);
      expect(v, `sort_no が昇順（行${i}=${v} >= 直前=${prev}）`).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });

  // ===== 登録・更新・削除（DB副作用は成功フラッシュ＋再表示で間接観測） =====

  test("E2E-M15-07-010 既存デッキタグの日本語名を更新→成功フラッシュ「保存しました」", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const target = await loginAndOpen(page);
    const id = await target.firstRowId();
    test.skip(!id, "デッキタグ行が無い（SEED-M15-07-DECKTAG 未投入）");
    const original = await target.rowInput(id!, "nameJp").inputValue(); // 後始末用に原値退避
    const newName = `E2E更新_${Date.now()}`;
    try {
      await target.rowInput(id!, "nameJp").fill(newName);
      await target.clickRegister();
      await target.seeSaveComplete(); // admin.common.save_complete
    } finally {
      // マスタデータ汚染防止：原値へ復元（付帯表3 復元前提）
      await target.goto();
      await target.rowInput(id!, "nameJp").fill(original);
      await target.clickRegister();
    }
  });

  test("E2E-M15-07-011 新規行に名称・表示順を入力→保存し再表示に出現する", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const target = await loginAndOpen(page);
    const newName = `E2E新規_${Date.now()}`;
    await target.newRowInput("nameJp").fill(newName);
    await target.newRowInput("nameEn").fill(`E2ENew_${Date.now()}`);
    await target.newRowInput("sortNo").fill("9001");
    await target.clickRegister();
    await target.seeSaveComplete();
    await target.goto(); // 再表示
    await expect(
      target.table.locator(`tbody input[value="${newName}"]`)
    ).toHaveCount(1); // 追加した name_jp の行が含まれる
  });

  test("E2E-M15-07-012 更新後の再表示に保存値が反映される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const target = await loginAndOpen(page);
    const id = await target.firstRowId();
    test.skip(!id, "デッキタグ行が無い（SEED-M15-07-DECKTAG 未投入）");
    const original = await target.rowInput(id!, "nameJp").inputValue(); // 後始末用に原値退避
    const newName = `E2E反映_${Date.now()}`;
    try {
      await target.rowInput(id!, "nameJp").fill(newName);
      await target.clickRegister();
      await target.seeSaveComplete();
      await target.goto(); // 再表示
      await expect(target.rowInput(id!, "nameJp")).toHaveValue(newName);
    } finally {
      // マスタデータ汚染防止：原値へ復元（付帯表3 復元前提）
      await target.goto();
      await target.rowInput(id!, "nameJp").fill(original);
      await target.clickRegister();
    }
  });

  // 要確認（オラクル混入の回避）: 設計書の削除は DELETE /deckTag/{id}（CSRF→404→デッキ/アーキ
  //   タイプ利用中ガード）。一方この自動化が依拠する「行の全値を空にすると当該行を削除」は刷新先
  //   代替画面の実装仕様（MtgMasterDataStoreAction.php:75-79）であり設計書/観点表から導けない実装
  //   由来トリガである。削除という観測結果（再表示で行が消える）は仕様由来だが、起動条件が実装由来の
  //   ため自動化（passing skip）から fixme へ降格し、刷新後の削除仕様確定まで要実機確認とする。
  test.fixme("E2E-M15-07-020 [要確認] 削除トリガが実装由来（全値空=remove）。刷新後削除仕様の確定後に実機検証", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    // 削除専用シード（デッキ・アーキタイプから未参照）でのみ安全に実行する。
    const delName = process.env.DECKTAG_DEL_NAME || "";
    test.skip(!delName, "DECKTAG_DEL_NAME 未設定（SEED-M15-07-DECKTAG-DEL の name_jp）");
    const target = await loginAndOpen(page);
    const delInput = target.table.locator(`tbody input[value="${delName}"]`).first();
    test.skip((await delInput.count()) === 0, "削除対象デッキタグ行が見つからない");
    const name = await delInput.getAttribute("name"); // rows[<id>][nameJp]
    const id = name?.match(/^rows\[(\w+)\]/)?.[1];
    test.skip(!id, "削除対象行 id を特定できない");
    await target.rowInput(id!, "nameJp").fill("");
    await target.rowInput(id!, "nameEn").fill("");
    await target.rowInput(id!, "sortNo").fill("");
    await target.clickRegister();
    await target.seeSaveComplete();
    await target.goto(); // 再表示
    await expect(target.table.locator(`tbody input[value="${delName}"]`)).toHaveCount(0);
  });
});
