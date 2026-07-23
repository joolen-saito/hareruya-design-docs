/**
 * 管理画面 コンテンツ管理 — 新着情報管理（m09-01）pilot 実走 spec。
 *
 * 目的: PILOT_m09_01_news_executable_grade.md の代表サブセットを稼働環境へ実走し、
 *       「ケース表グレード → 実行時実行可能」を実証する。
 *
 * 絶対規約:
 *  - テストケース(期待値)が正。期待どおりでなくても期待値も SUT も変更しない。不一致は×(乖離)として記録。
 *  - ハーネス(page/spec)自体のバグのみ修正して再実行可。
 *  - 冪等性: 作成行 title に run-id prefix `E2E-<runid>-`。afterEach で当該 run の作成行を必ず削除
 *    （リダイレクトURL の id で DELETE ＋ 安全網として prefix でも DELETE）。
 *
 * 期待値の正は fixtures/oracle/m09_01_oracle.json（L1オラクルID）。spec に期待値リテラルを直書きしない。
 * -EN 系は管理画面ロケール切替口が無い（env固定ja・実測）ため理由付き未実施(要D15)で記録する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { NewsPilotPage } from "../../../pages/admin/m09/m09_01_news_pilot.page";
import { o, runFill, makeRunId } from "../../../helpers/oracle";
import * as db from "../../../helpers/db";
import {
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const EDIT_RE = /\/content\/news\/\d+\/edit(\?|$)/;
const NEW_RE = /\/content\/news\/new(\?|$)/;

// 管理画面 en 切替不能の理由（§5・§9-3。実測: Accept-Language / ?_locale=en いずれも ja のまま）。
const EN_SKIP_REASON =
  "未実施(要D15): 管理画面ロケール切替口なし。ECCUBE_LOCALE=env固定(既定ja)・admin routeに_locale無し。" +
  "Accept-Language:en / ?_locale=en いずれも ja のままを実測。container 環境変更は SUT設定変更のため不可。";

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await page.waitForURL(/\/admin\//);
}

// 冪等性: 各テストの run prefix と作成 id を追跡し afterEach で必ず掃除する。
let runPrefix = "";
let createdIds: number[] = [];

test.beforeEach(() => {
  runPrefix = `E2E-${makeRunId()}-`;
  createdIds = [];
});

test.afterEach(() => {
  // 主特定: 捕捉した id で削除。
  for (const id of createdIds) {
    try {
      db.deleteNewsById(id);
    } catch {
      /* 掃除は best-effort。安全網で拾う。 */
    }
  }
  // 安全網: prefix で残骸を掃除し、掃除後 0 件（run 帯に残骸なし）を保証する。
  db.deleteNewsByTitlePrefix(runPrefix);
  const leftover = db.newsCountByTitlePrefix(runPrefix);
  expect(leftover, `cleanup後にrun prefix ${runPrefix} の残骸なし`).toBe(0);
});

test.describe("m09-01 新着情報管理 pilot 実走", { tag: ["@admin", "@content", "@pilot"] }, () => {
  // ===== 表示: 一覧HTTP200 + 見出し3文言(ja) [L1-M0901-002,005] =====
  test("E2E-M0901X-010 一覧HTTP200＋見出し3文言(ja)", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new NewsPilotPage(page);
    const res = await news.gotoList();
    expect(res?.status()).toBe(o("L1-M0901-002").get<number>("expected_status"));
    await expect(news.listHeaderRow).toBeVisible();
    const header = await news.listHeaderRow.innerText();
    for (const label of o("L1-M0901-005").jaList()) {
      expect(header, `見出しに ${label}`).toContain(label);
    }
  });

  // ===== 表示: 見出し(en) — 未実施(要D15) =====
  test("E2E-M0901X-010-EN 一覧見出し(en)", async () => {
    test.skip(true, EN_SKIP_REASON);
  });

  // ===== 必須: タイトル空→HTML5 valueMissing [L1-M0901-010(HTML5層)] =====
  test("E2E-M0901X-030 タイトル空はHTML5層で送信ブロック(valueMissing)", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new NewsPilotPage(page);
    await news.gotoNew();
    // title は空のまま（新規既定）。publish_date は現在日時が prefill 済み。
    await expect(news.title).toHaveValue("");
    await news.submitRegister();
    const v = await news.titleValidity();
    expect(v.valueMissing, "title.validity.valueMissing").toBe(true);
    await expect(page, "送信ブロックで新規画面に留まる").toHaveURL(NEW_RE);
  });

  // ===== 必須: 直接POSTのサーバ検証 ja [L1-M0901-010(サーバ層)] =====
  test("E2E-M0901X-031 タイトル空の直接POST→サーバ検証メッセージ(ja)", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new NewsPilotPage(page);
    const res = await news.directPostNew({ title: "" });
    expect(res.status(), "検証失敗は再描画(200・リダイレクトしない)").toBe(200);
    const body = await res.text();
    expect(body, "サーバ検証メッセージ(ja)").toContain(o("L1-M0901-010").ja());
    expect(body, "成功フラッシュは出ない").not.toContain(o("L1-M0901-023").ja());
  });

  // ===== 必須: 直接POSTのサーバ検証 en — 未実施(要D15) =====
  test("E2E-M0901X-031-EN タイトル空サーバ検証(en)", async () => {
    test.skip(true, EN_SKIP_REASON);
  });

  // ===== 最大長: タイトル200字受理→DB char_length=200 [L1-M0901-011,013,014] =====
  test("E2E-M0901X-032 タイトル200字(ascii)受理→DB文字長=200", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new NewsPilotPage(page);
    await news.gotoNew();
    const max = o("L1-M0901-011").get<number>("max"); // 200
    const titleVal = runFill(max, "ascii", runPrefix);
    expect([...titleVal].length).toBe(max); // 生成が境界ちょうど
    await news.title.fill(titleVal);
    await news.submitRegister();
    await expect(page, "成功で編集画面へ遷移").toHaveURL(EDIT_RE);
    await expect(page.locator("body")).toContainText(o("L1-M0901-023").ja());
    const id = NewsPilotPage.extractIdFromEditUrl(page.url());
    expect(id, "リダイレクトURLからid捕捉").not.toBeNull();
    createdIds.push(id!);
    expect(db.newsTitleCharLength(id!), "DB char_length(title)").toBe(max);
  });

  // ===== 最大長: タイトル201字→Form拒否＋DB未到達 [L1-M0901-011,012,013] =====
  test("E2E-M0901X-033 タイトル201字(ascii)はForm層で拒否・DB未到達", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new NewsPilotPage(page);
    await news.gotoNew();
    const max = o("L1-M0901-011").get<number>("max"); // 200
    const titleVal = runFill(max + 1, "ascii", runPrefix); // 201字
    expect([...titleVal].length).toBe(max + 1);
    await news.title.fill(titleVal);
    await news.submitRegister();
    // Form Length 拒否: 同一新規画面に留まり超過文言を表示。
    await expect(page).toHaveURL(NEW_RE);
    await expect(page.locator("body")).toContainText(
      o("L1-M0901-012").ja({ limit: max })
    );
    await expect(page.locator("body")).not.toContainText(o("L1-M0901-023").ja());
    // DB未到達（201≦DB255段差でもForm段で止まる）。
    expect(db.newsCountByTitlePrefix(runPrefix), "DBに当該run行が無い").toBe(0);
  });

  // ===== 最大長: タイトル201字拒否メッセージ(en) — 未実施(要D15) =====
  test("E2E-M0901X-033-EN タイトル201字拒否メッセージ(en)", async () => {
    test.skip(true, EN_SKIP_REASON);
  });

  // ===== 文字長意味論: 200字マルチバイト混在受理→char_length=200 [L1-M0901-011,013,014] =====
  test("E2E-M0901X-034 タイトル200字マルチバイト混在受理→DB文字長=200", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new NewsPilotPage(page);
    await news.gotoNew();
    const max = o("L1-M0901-011").get<number>("max"); // 200
    const titleVal = runFill(max, "mixed", runPrefix); // 「あ」混在で200字
    expect([...titleVal].length).toBe(max); // 文字数はちょうど200
    // バイト長は200超（マルチバイト混在の実証）。
    expect(Buffer.byteLength(titleVal, "utf8")).toBeGreaterThan(max);
    await news.title.fill(titleVal);
    await news.submitRegister();
    await expect(page).toHaveURL(EDIT_RE);
    await expect(page.locator("body")).toContainText(o("L1-M0901-023").ja());
    const id = NewsPilotPage.extractIdFromEditUrl(page.url());
    expect(id).not.toBeNull();
    createdIds.push(id!);
    // バイト長でなく文字長で判定される。
    expect(db.newsTitleCharLength(id!), "DB char_length(title)=文字長").toBe(max);
  });

  // ===== 任意: URL空で保存成功 [L1-M0901-015,023,024] =====
  test("E2E-M0901X-037 URL空で保存成功(任意の実証)", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new NewsPilotPage(page);
    await news.gotoNew();
    await news.title.fill(`${runPrefix}URL任意`);
    await news.url.fill(""); // URL 空
    await news.submitRegister();
    await expect(page, "成功で編集画面へ遷移").toHaveURL(EDIT_RE);
    await expect(page.locator("body")).toContainText(o("L1-M0901-023").ja());
    const id = NewsPilotPage.extractIdFromEditUrl(page.url());
    expect(id).not.toBeNull();
    createdIds.push(id!);
  });

  // ===== URL形式: 不正URL拒否 ja [L1-M0901-016] =====
  test("E2E-M0901X-038 URL形式不正が拒否される(ja)", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const news = new NewsPilotPage(page);
    await news.gotoNew();
    await news.title.fill(`${runPrefix}URL不正`);
    await news.url.fill("not-a-url");
    await news.submitRegister();
    await expect(page, "検証失敗で新規画面に留まる").toHaveURL(NEW_RE);
    await expect(page.locator("body")).toContainText(o("L1-M0901-016").ja());
    await expect(page.locator("body")).not.toContainText(o("L1-M0901-023").ja());
    // 保存されない（DB未到達）。
    expect(db.newsCountByTitlePrefix(runPrefix)).toBe(0);
  });

  // ===== URL形式: 不正URL拒否 en — 未実施(要D15) =====
  test("E2E-M0901X-038-EN URL形式不正(en)", async () => {
    test.skip(true, EN_SKIP_REASON);
  });
});
