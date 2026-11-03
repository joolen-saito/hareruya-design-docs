/** M10-15 店舗登録（新規登録状態の画面だけで確かめられるケース）。正本: integration_test/casegen/cases/M10-15_test_cases.tsv */
import { Page } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin, adminUrl } from "../../lib/session";
import { M1015_ADMIN } from "../../seeds/m10-15";

async function 新規登録を開く(page: Page): Promise<void> {
  await page.goto(adminUrl("/mall/tenant/create"), { timeout: 60_000 });
  await page.waitForLoadState("load");
  await expect(page.locator('[name="mall_tenant_shop_master[shop_name]"]'), "店名の欄").toBeVisible({ timeout: 30_000 });
}
/** 項目名（左の見出し）の行にあるラジオボタンのうち、選ばれているものの表示名 */
async function 選ばれている(page: Page, 見出し: string): Promise<string> {
  const row = page.locator("div.row").filter({ has: page.locator(`div.col-3 span:text-is("${見出し}")`) }).first();
  const checked = row.locator("input[type=radio]:checked");
  if ((await checked.count()) === 0) return "（選ばれていない）";
  return ((await checked.first().evaluate((n) => (n as HTMLInputElement).labels?.item(0)?.textContent ?? "")) ?? "").trim();
}

caseTest("IT-M10-15-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1015_ADMIN);
  let 数 = -1; let 欄 = -1;
  await step(1, async () => { await 新規登録を開く(page); });
  await step(2, async () => {
    数 = await page.locator("form").getByText("テスト用店舗").count();
    欄 = await page.locator('[name$="[test_store_flg]"], [name*="test_store"]').count();
  });
  await expected(async () => {
    expect.soft(数, "画面の「テスト用店舗」の表示の数").toBe(0);
    expect.soft(欄, "テスト用店舗の入力欄の数").toBe(0);
  });
});

caseTest("IT-M10-15-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M1015_ADMIN);
  const got: Record<string, string> = {};
  await step(1, async () => {
    await 新規登録を開く(page);
    got["店舗種別"] = await 選ばれている(page, "店舗種別");
    got["公開"] = await 選ばれている(page, "公開");
    got["開店"] = await 選ばれている(page, "開店");
  });
  await expected(async () => {
    expect.soft(got["店舗種別"], "店舗種別の選択").toBe("支店");
    expect.soft(got["公開"], "公開の選択").toBe("非公開");
    expect.soft(got["開店"], "開店の選択").toBe("閉店");
  });
});

caseTest("IT-M10-15-077", async ({ page, step, expected }) => {
  await loginAdmin(page, M1015_ADMIN);
  let 選択 = "";
  await step(1, async () => { await 新規登録を開く(page); });
  await step(2, async () => { 選択 = await 選ばれている(page, "売上集計の検索項目"); });
  await expected(async () => { expect.soft(選択, "売上集計の検索項目の選択").toBe("表示しない"); });
});
