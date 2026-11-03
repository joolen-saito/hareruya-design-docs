/** M10-13 カスタムCSV出力設定の続き（016・017・019〜023）。正本: integration_test/casegen/cases/M10-13_test_cases.tsv
 * 流し終えた m10-13.spec.ts は触らないので、新しいファイルに書く。 */
import { test, expect as pwExpect, Page } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin, adminUrl } from "../../lib/session";
import { CustomCsvPage } from "../../pages/admin/m10_13_custom_csv";
import { 定義の状態を読む } from "../../db/m10_13";
import { M1013_ADMIN } from "../../seeds/m10-13";
import { 削除試験名 } from "../../seeds/m10-13-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 注記_項目 = "出力項目は、正本の「CSV商品コード」「CSV商品名」の代わりに、画面にある「商品コード」「商品名(日)」にしたシードの上で行った";

/** 削除リンク→モーダルを開き、削除ボタンを返す */
async function 削除モーダルを開く(p: CustomCsvPage) {
  await p.削除リンク.click({ timeout: 30_000 });
  const modal = p.page.locator("#DeleteModal");
  await pwExpect(modal).toBeVisible({ timeout: 30_000 });
  const ok = modal.locator('a.btn-ec-delete[data-method="delete"]');
  await pwExpect.poll(async () => (await ok.getAttribute("href")) ?? "#", "削除の送り先（モーダルが開き終わると入る）").toMatch(/custom_csv\/delete\/\d+/);
  return ok;
}
type 要求 = { method: string; url: string; status?: number };
function 記録する(page: Page): 要求[] {
  const list: 要求[] = [];
  page.on("response", (r) => { if (/custom_csv/.test(r.url())) list.push({ method: r.request().method(), url: r.url(), status: r.status() }); });
  return list;
}

caseTest("IT-M10-13-016", async ({ page, step, expected, notes }) => {
  await loginAdmin(page, M1013_ADMIN);
  const p = new CustomCsvPage(page);
  let 記録: 要求[] = [];
  await step(1, async () => { 記録 = 記録する(page); note("開発者ツールのネットワーク記録に当たるものとして、画面の応答を記録した"); });
  await step(2, async () => { await p.open("1", notes.get("〔カスタム定義ID-M1013-016〕")); await pwExpect(p.名前).toHaveValue(削除試験名("016")); });
  await step(3, async () => { await p.名前.fill("URL分離確認CSV"); await p.設定する("カスタム定義の更新"); });
  await step(4, async () => { await 削除モーダルを開く(p); });
  await step(5, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), p.page.locator('#DeleteModal a.btn-ec-delete[data-method="delete"]').click({ timeout: 30_000 })]); });
  let 参照: 要求 | undefined, 設定: 要求 | undefined, 削除: 要求 | undefined;
  await step(6, async () => {
    参照 = 記録.find((r) => r.method === "GET" && /custom_csv\/1\/\d+/.test(r.url));
    設定 = 記録.find((r) => r.method === "POST");
    削除 = 記録.find((r) => /custom_csv\/delete\//.test(r.url));
    note(`記録した要求先: 参照 ${参照?.url ?? "なし"}／設定 ${設定?.url ?? "なし"}／削除 ${削除?.url ?? "なし"}`);
  });
  await expected(async () => {
    expect.soft(!!参照 && !!設定 && !!削除, `画面参照・設定・削除の要求が記録されている（参照 ${参照?.url ?? "なし"}／設定 ${設定?.url ?? "なし"}／削除 ${削除?.url ?? "なし"}）`).toBe(true);
    const urls = [参照?.url, 設定?.url, 削除?.url].filter(Boolean) as string[];
    expect.soft(new Set(urls).size, "要求先URLの種類の数（3種類が互いに異なる）").toBe(3);
  });
});

caseTest("IT-M10-13-017", async ({ page, step, expected }) => {
  await loginAdmin(page, M1013_ADMIN);
  const p = new CustomCsvPage(page);
  let status = 0; let 表示された = false;
  await step(1, async () => { await p.open(); });
  await step(2, async () => {
    const res = await page.goto(adminUrl("/setting/shop/custom_csv/999999"));
    status = res?.status() ?? 0;
    表示された = await p.CSV選択.isVisible().catch(() => false);
  });
  await expected(async () => {
    expect.soft(表示された, "カスタムCSV出力設定画面が表示されている").toBe(false);
    expect.soft(status, "HTTPの応答コード（エラー）").toBeGreaterThanOrEqual(400);
  });
});

/** 019〜021: 削除の要求を書き換えて送る */
function 書き換え削除(n: string, 書き換え: (a: import("@playwright/test").Locator, id: string) => Promise<void>, 期待: "拒否と残る" | "HTTPエラー"): (ctx: import("../../lib/case").CaseCtx) => Promise<void> {
  return async ({ page, step, expected, notes }) => {
    await loginAdmin(page, M1013_ADMIN);
    const p = new CustomCsvPage(page);
    const id = () => notes.get(`〔カスタム定義ID-M1013-${n}〕`);
    let status: number | null = null; let db = { 定義の行数: -1, 削除済みの行数: -1, 出力項目の関連数: -1 };
    await step(1, async () => { await p.open("1", id()); await pwExpect(p.名前).toHaveValue(削除試験名(n)); });
    let ok!: import("@playwright/test").Locator;
    await step(2, async () => { ok = await 削除モーダルを開く(p); await 書き換え(ok, id()); });
    await step(3, async () => {
      const resp = page.waitForResponse((r) => /custom_csv\/delete/.test(r.url()) || /custom_csv\/\d+\/delete/.test(r.url()), { timeout: 60_000 }).catch(() => null);
      await ok.click({ timeout: 30_000 });
      const r = await resp; status = r ? r.status() : null;
      await page.waitForLoadState("load");
    });
    if (期待 === "拒否と残る") await step(4, async () => { db = 定義の状態を読む(削除試験名(n)); });
    await expected(async () => {
      expect.soft(status !== null && status >= 400 || 期待 === "拒否と残る", `削除の要求の応答（${status}）がHTTPエラー`).toBe(true);
      if (期待 === "拒否と残る") {
        expect.soft(db.定義の行数, "削除されていない定義の数").toBe(1);
        expect.soft(db.出力項目の関連数, "出力項目の関連の数").toBe(2);
      }
    });
  };
}
caseTest("IT-M10-13-019", 書き換え削除("019", async (a) => { await a.evaluate((x) => x.setAttribute("token-for-anchor", "invalid-token")); }, "拒否と残る"));
caseTest("IT-M10-13-020", 書き換え削除("020", async (a, id) => { await a.evaluate((x, i) => x.setAttribute("href", (x.getAttribute("href") ?? "").replace(`/${i}`, "")), id); }, "HTTPエラー"));
caseTest("IT-M10-13-021", 書き換え削除("021", async (a, id) => { await a.evaluate((x, i) => x.setAttribute("href", (x.getAttribute("href") ?? "").replace(`/${i}`, "/999999")), id); }, "HTTPエラー"));

caseTest("IT-M10-13-022", async ({ page, step, expected, notes }) => {
  await loginAdmin(page, M1013_ADMIN);
  const p = new CustomCsvPage(page);
  let db = { 定義の行数: -1, 削除済みの行数: -1, 出力項目の関連数: -1 };
  await step(1, async () => { await p.open("1", notes.get("〔カスタム定義ID-M1013-022〕")); await pwExpect(p.名前).toHaveValue(削除試験名("022")); });
  await step(2, async () => { await 削除モーダルを開く(p); });
  await step(3, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator('#DeleteModal a.btn-ec-delete[data-method="delete"]').click({ timeout: 30_000 })]); });
  await step(4, async () => { db = 定義の状態を読む(削除試験名("022")); });
  await expected(async () => {
    expect.soft(db.定義の行数, "削除されていない定義の数").toBe(0);
    expect.soft(db.出力項目の関連数, "紐づく出力項目の関連の数").toBe(0);
  });
});

caseTest("IT-M10-13-023", async ({ page, step, expected, notes }) => {
  await loginAdmin(page, M1013_ADMIN);
  const p = new CustomCsvPage(page);
  await step(1, async () => { await p.open("1", notes.get("〔カスタム定義ID-M1013-023〕")); await pwExpect(p.名前).toHaveValue(削除試験名("023")); });
  await step(2, async () => { await 削除モーダルを開く(p); });
  await step(3, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator('#DeleteModal a.btn-ec-delete[data-method="delete"]').click({ timeout: 30_000 })]); await page.waitForLoadState("load"); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "削除後の画面（カスタムCSV出力設定画面の先頭）").toMatch(/\/setting\/shop\/custom_csv(\/\d+)?$/);
    expect.soft(await p.選択中の表示名(p.追加されたCSV選択), "追加されたCSV選択（先頭＝新規作成）").toBe("新規作成");
  });
});
void 注記_項目;
