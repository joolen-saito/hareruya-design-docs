/** M14-06 カードセット管理(一覧) と M14-07 カードセット管理(画像ダウンロード)。正本: cases/M14-06_test_cases.tsv・M14-07_test_cases.tsv */
import { Dialog, Page } from "@playwright/test";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { M1406_ADMIN, M1407_ADMIN } from "../../seeds/m14-06";

async function 一覧を開く(page: Page): Promise<void> {
  await page.goto(adminUrl("/cardset"));
  await page.waitForLoadState("load");
  await expect(page.locator("#admin_cardset_download_by_set"), "カードセット一覧の「画像ダウンロード(セット別)」").toBeVisible();
}

caseTest("IT-M14-06-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  const r = { 見出し: [] as string[], 行: 0 };
  await step(1, async () => { await 一覧を開く(page); });
  await step(2, async () => {
    r.見出し = (await page.locator("table thead th").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    r.行 = await page.locator('tbody tr:has(input[name="cardsetIds[]"])').count();
  });
  await expected(async () => {
    expect.soft(r.行, "一覧に表示されたカードセットの行数").toBeGreaterThan(0);
    expect.soft(r.見出し.filter((t) => /サイドメニュー|支店/.test(t)), "「サイドメニュー表示」「支店表示」の列").toEqual([]);
  });
});

caseTest("IT-M14-06-006", async ({ page, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  await step(1, async () => { await 一覧を開く(page); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("a.btn").filter({ hasText: /^\s*新規登録\s*$/ }).first().click({ timeout: 20_000 })]); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname.endsWith("/cardset/new"), "遷移先がカードセット詳細(登録)画面").toBe(true);
    await expect.soft(page.locator("#admin_cardset_nameJp"), "カードセット名(日本語)の入力欄").toBeVisible();
  });
});

caseTest("IT-M14-06-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M1406_ADMIN);
  await step(1, async () => { await 一覧を開く(page); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("a.btn").filter({ hasText: /ブロックの追加/ }).first().click({ timeout: 20_000 })]); });
  await expected(async () => {
    const u = new URL(page.url());
    expect.soft(u.pathname.endsWith("/data/mtg_master_data"), "遷移先がMTGマスターデータ画面").toBe(true);
    expect.soft(u.searchParams.get("entity"), "選ばれている種別（カードセットブロック）").toBe("cardsetblock");
    await expect.soft(page.locator("form#edit_form table.mtg-master-table"), "カードセットブロックのマスターデータ一覧").toBeVisible();
  });
});

/** 未選択で画像ダウンロードを押し、確認ダイアログでキャンセルする型 */
function ダイアログで取り消す(ログイン: typeof M1406_ADMIN, ボタン: string, 事前に外す: boolean, ダウンロード履歴: boolean): CaseBody {
  return async ({ page, step, expected }) => {
    await loginAdmin(page, ログイン);
    let ダイアログ: Dialog | null = null;
    let 文 = "";
    let ダウンロード = 0;
    let クリック: Promise<unknown> = Promise.resolve();
    page.on("download", () => { ダウンロード += 1; });
    const 手順 = ダウンロード履歴 ? 1 : 0; // 履歴確認の手順がある型は番号が1つずれる
    let n = 1;
    if (ダウンロード履歴) await step(n++, async () => { ダウンロード = 0; });
    await step(n++, async () => { await 一覧を開く(page); });
    if (事前に外す) await step(n++, async () => { await page.locator("#chose_all").setChecked(false, { timeout: 20_000 }); await expect(page.locator('input[name="cardsetIds[]"]:checked'), "選択されているカードセット").toHaveCount(0); });
    await step(n++, async () => {
      // 確認ダイアログが開いている間はクリック操作が終わらないので、クリックは待たずに、ダイアログが出るのを待つ
      const wait = page.waitForEvent("dialog", { timeout: 20_000 });
      クリック = page.locator(ボタン).click({ timeout: 20_000, noWaitAfter: true }).catch(() => undefined);
      ダイアログ = await wait;
      文 = ダイアログ.message();
    });
    await step(n++, async () => { await ダイアログ!.dismiss(); await クリック; await page.waitForTimeout(1500); });
    if (ダウンロード履歴) await step(n++, async () => { /* ダウンロード数を期待結果で確かめる */ expect.soft(ダウンロード, "ダウンロードされたファイルの数").toBe(0); });
    void 手順;
    await expected(async () => {
      expect.soft(文, "確認ダイアログの文").toContain("ダウンロード");
      expect.soft(new URL(page.url()).pathname.replace(/\/$/, "").endsWith("/cardset"), "画面がカードセット一覧のまま").toBe(true);
      expect.soft(ダウンロード, "ダウンロードが実行されない").toBe(0);
    });
  };
}
caseTest("IT-M14-06-030", ダイアログで取り消す(M1406_ADMIN, "#admin_cardset_download_by_set", false, false));
caseTest("IT-M14-07-003", ダイアログで取り消す(M1407_ADMIN, "#admin_cardset_download_by_set", true, false));
caseTest("IT-M14-07-004", ダイアログで取り消す(M1407_ADMIN, "#admin_cardset_download_by_set", true, true));
