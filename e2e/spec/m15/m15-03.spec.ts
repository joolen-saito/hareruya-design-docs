/** M15-03 デッキ一括削除（ページ送りの戻り先）。正本: cases/M15-03_test_cases.tsv。前面の確認・DB での準備が要るケースは実装しない */
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { デッキ一覧 } from "../../pages/admin/m15_deck";
import { M1503QM_ADMIN, 選手名, 語CB004 } from "../../seeds/m15-03";

caseTest("IT-M15-03-004", async ({ page, step, expected }) => {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(90_000);
  const l = new デッキ一覧(page);
  const 対象 = ["11", "12", "13"].map(選手名);
  await step(1, async () => { await loginAdmin(page, M1503QM_ADMIN); });
  await step(2, async () => {
    await l.開く();
    await l.日付クリア.click();
    await l.f("player_name").fill(`${語CB004()}-選手`);
    await l.検索する();
    // 件数・並べかえ項目・ソート順は、選ぶと検索条件を保ったまま一覧が読み直される
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.件数選択.selectOption({ label: "10件" })]); await l.結果を待つ();
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.並べ替え項目.selectOption({ label: "プレイヤー名" })]); await l.結果を待つ();
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.並び順.selectOption({ label: "昇順" })]); await l.結果を待つ();
  });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator(".pagination a.page-link", { hasText: "2" }).first().click()]);
    await l.結果を待つ();
    await expect(page.locator(".pagination .page-item.active"), "現在のページ（2ページ目）").toContainText("2");
  });
  await step(4, async () => {
    for (const n of 対象) await page.locator("tr", { hasText: n }).locator("input.searched_deck_id").check();
  });
  await step(5, async () => {
    page.once("dialog", (d) => { void d.accept(); });
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.一括削除.click()]);
    await l.結果を待つ();
  });
  await expected(async () => {
    const 文言 = (await page.locator(".alert").allInnerTexts()).join(" ").replace(/\s+/g, " ");
    expect.soft(文言, "管理画面上部のメッセージ").toContain("削除しました");
    expect.soft(await page.locator(".pagination .page-item.active").first().innerText().catch(() => ""), "表示されているページ（2ページ目）").toContain("2");
    expect.soft(await l.件数(), "該当件数").toBe(11);
    const 表 = (await page.locator(".deck-result-table tbody").innerText().catch(() => "")).replace(/\s+/g, " ");
    expect.soft(表.includes(選手名("14")), "プレイヤー「選手14」の行が表示される").toBe(true);
    for (const n of 対象) expect.soft(表.includes(n), `プレイヤー「${n.split("-").pop()}」の行が含まれない`).toBe(false);
    expect.soft(await page.locator(".deck-result-table tbody tr").count(), "そのページに表示された行数").toBe(1);
  });
});
