/**
 * A17-05 商品名検索APIの「カード詳細を持つ商品」のケース（012・013）のシード。正本: cases/A17-05_seed_data.tsv
 * 作り方（シード表の投入方法の順）: カード詳細を画面で新規登録（カードのマスタ。実行の印つきの名前で足すだけ）→ グッズ商品CSV登録で1行を取り込む →
 * 商品マスターで商品IDを控える → 商品登録編集の「カード指定」でそのカードを指定して登録 → 商品規格一覧の新規作成で規格を3件足す
 * （JP・NM・A1705-GRP-NNN-2／EN・NM・-3／JP・NM・-4・高額商品コード HIGH-A-NNN。販売価格はすべて100）。
 * 商品名・商品コード・カード名には実行の印を付ける（ケースの検索語・期待結果も同じ値で読む）。高額商品コードは値そのものを見るので印を付けない。
 * 環境の設定（商品規格の表示下限100）は S-A17-05-LIMIT（seeds/a17-05.ts）と同じく画面から変えない。
 */
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { adminUrl } from "../lib/session";
import { expect, Page } from "@playwright/test";
import { expectSaved } from "../pages/admin/common";
import { カードを登録する } from "../pages/admin/m14_card";
import { グッズ商品を取り込む, 取込の商品と規格を読む, 規格を足す } from "../pages/admin/a17_05_setup";
import "./a17-05";

export const 集約カードの商品名 = (n: string): string => rc(`組合せ集約カード-${n}`);
export const 集約カードの商品コード = (n: string, 末尾: string): string => rc(`A1705-GRP-${n}-${末尾}`);
export const 集約の高額商品コード = (n: string): string => `HIGH-A-${n}`;

/** 商品登録編集の「カード指定」で、カード名で検索して名前が一致する行を決定し、割引率は先頭を選んで「商品を登録」する */
async function 指定のカードを商品に指定する(page: Page, 商品ID: string, カード名: string, 商品名: string, what: string, issue: (m: string) => void): Promise<void> {
  await page.goto(adminUrl(`/product/product/${商品ID}/edit`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  const open = page.locator('button[data-bs-target="#searchCardDetailModal"]');
  await expect(open, `${what}: 「カード指定 >」を押せる`).toBeEnabled({ timeout: 30_000 });
  await open.click();
  const modal = page.locator("#searchCardDetailModal");
  await expect(modal, `${what}: カード検索`).toBeVisible();
  await modal.locator("#admin_search_card_detail_card_name").fill(カード名);
  await modal.locator("#searchCardDetailModalButton").click();
  const rows = modal.locator("#searchCardDetailModalList tbody tr").filter({ hasText: カード名 });
  await expect(rows, `${what}: カード検索の結果にカード「${カード名}」の行が1件`).toHaveCount(1, { timeout: 60_000 });
  const d = rows.first().getByRole("button", { name: "決定", exact: true });
  for (let k = 0; k < 3; k++) {
    const sent = page.waitForResponse((r) => r.url().includes("/product/detail/search/id"), { timeout: 15_000 }).then(() => true, () => false);
    await d.click();
    if ((await sent) || !(await modal.isVisible())) break;
  }
  await expect(modal, `${what}: カードを決定するとカード検索が閉じる`).toBeHidden({ timeout: 60_000 });
  for (const name of ['input[name="admin_product[name]"]', 'input[name="admin_product[name_en]"]']) {
    const field = form.locator(name);
    if ((await field.inputValue()) !== 商品名 && name.includes("[name]")) await field.fill(商品名);
  }
  const discount = form.locator('select[name="admin_product[Discount]"]');
  if (!(await discount.inputValue())) {
    const first = await discount.locator("option").evaluateAll((ns) => ns.map((n) => (n as HTMLOptionElement).value).find((x) => x !== ""));
    if (first) await discount.selectOption(first);
  }
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), form.locator("button[type=submit]").filter({ hasText: /^\s*商品を登録\s*$/ }).click({ timeout: 20_000, noWaitAfter: true })]);
  for (const w of await expectSaved(page, `${what}: カードを指定して商品を登録`)) issue(`${what}: ${w}`);
}

for (const n of ["012", "013"]) {
  defineSeed(`S-A17-05-GROUPING-${n}`, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const カード名日 = rc(`A1705集約カード-${n}`), カード名英 = rc(`A1705 Grouping Card-${n}`);
      const カードID = await カードを登録する(page, { カード名日, カード名英, 点数で見たマナ: "0" }, `${seed.シードID} のカード詳細`, issue);
      notes.set(`〔カード詳細ID-A1705-${n}〕`, カードID);
      const 商品名 = 集約カードの商品名(n);
      const code1 = 集約カードの商品コード(n, "1");
      await グッズ商品を取り込む(page, seed.シードID, [{ 商品コード: code1, 商品名日: 商品名, 商品名英: rc(`Grouping Card-${n}`), 価格: "100" }], issue);
      const { 商品ID } = await 取込の商品と規格を読む(page, code1, issue);
      notes.set(`〔商品ID-A1705-${n}〕`, 商品ID);
      await 指定のカードを商品に指定する(page, 商品ID, カード名英, 商品名, `${seed.シードID}: ${code1}`, issue);
      for (const [末尾, 言語, 高額] of [["2", "日本語", undefined], ["3", "英語", undefined], ["4", "日本語", 集約の高額商品コード(n)]] as const) {
        await 規格を足す(page, 商品ID, { 言語, 状態: "ニアミント", 商品コード: 集約カードの商品コード(n, 末尾), 価格: "100", 高額商品コード: 高額 }, `${seed.シードID}: ${集約カードの商品コード(n, 末尾)}`, issue);
      }
    });
    issue("カード詳細は、シード表の名前に実行の印を付けて新規に登録した（カードのマスタに足すだけ）。商品に指定するカードは、カード名で検索して一致する行を選んだ。商品名(英)・カード名には実行の印を付けた。規格の在庫は0のまま（シード表は在庫を指定しない）");
  });
}
