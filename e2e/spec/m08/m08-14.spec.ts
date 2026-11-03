/**
 * M08-14 仮会員メール再送。正本: cases/M08-14_test_cases.tsv
 * 実装しないケース（記録 review/M08-14_progress_*.md。020 も、店舗基本設定・メールテンプレート・メール受信環境のシードを使うので実装しない）: シードが本登録用シークレットなどをDBで設定するもの、メールの受信・送信内容を確かめるもの、
 * 店舗基本設定・メールテンプレートを書き換える環境（SHOP・TEMPLATE）が要るもの。
 */
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { M08CustomerListPage } from "../../pages/admin/m08_customer_list";
import { M0814_ADMIN } from "../../seeds/m08-14";

/** 結果の行のサブメニュー（…）を開き、仮会員メール再送のリンクが見えるか */
async function サブメニューを開いて再送リンクを見る(list: M08CustomerListPage, id: string): Promise<boolean> {
  const row = list.row(id);
  await expect(row, `検索結果に会員ID ${id} の行が1つある`).toHaveCount(1, { timeout: 30_000 });
  await row.locator("i.dropdown-menu-toggle").click({ timeout: 30_000 });
  return row.locator(`a[data-bs-target="#discontinuance_cus_${id}"]`).isVisible();
}

caseTest("IT-M08-14-002", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0814-共有本会員〕");
  await loginAdmin(page, M0814_ADMIN);
  const list = new M08CustomerListPage(page);
  let 見える = true;
  await step(1, async () => { await list.open(); await list.searchMulti(id); });
  await step(2, async () => { 見える = await サブメニューを開いて再送リンクを見る(list, id); });
  await expected(async () => {
    expect.soft(見える, `会員ID ${id} のサブメニューに仮会員メール再送リンクが表示される`).toBe(false);
  });
});
