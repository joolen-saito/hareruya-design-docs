/**
 * M13-02 イベント登録/編集（公開側のイベント詳細画面で確かめるもの・検索結果のページ送り。IT-M13-02-030、031、057）
 * ケースの正本: integration_test/casegen/cases/M13-02_test_cases.tsv（手順・期待結果の文は正本から引く）
 */
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { openEventEdit, openEventSearchPage, EventForm } from "../../pages/admin/event";
import { FrontEventDetail, openFrontEventDetail } from "../../pages/front/event";
import { M1302_ADMIN } from "../../seeds/m13-02";

caseTest("IT-M13-02-030", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, notes.get("〔イベントID-M1302-030〕")); });
  const area = (n: number) => ({ 項目名日: `案内${n}`, 項目名英: `Guide ${n}`, 内容日: `案内${n}の内容`, 内容英: `Guide ${n} content`, 初期表示は閉じる: true });
  await step(2, async () => { await form.fill({ フリー入力エリア: [area(1), area(2), area(3)] }); });
  await step(3, async () => { await form.submit(form.更新ボタン); });
  let front!: FrontEventDetail;
  await step(4, async () => { front = await openFrontEventDetail(page, notes.get("〔日程ID-M1302-030〕")); });
  await expected(async () => {
    for (const n of [1, 2, 3] as const) {
      // アコーディオン表示の対象＝見出しを押して開閉でき、初期表示は閉じている
      await expect.soft(front.フリー入力エリアの見出し(n), `フリー入力エリア${n}の見出し`).toHaveText(`案内${n}`);
      await expect.soft(front.フリー入力エリアの見出し(n), `フリー入力エリア${n}は初期表示で閉じている`).toHaveAttribute("aria-expanded", "false");
      await expect.soft(front.フリー入力エリアの内容(n), `フリー入力エリア${n}の内容は初期表示で隠れている`).toBeHidden();
      await front.フリー入力エリアの見出し(n).click();
      await expect.soft(front.フリー入力エリアの内容(n), `フリー入力エリア${n}は見出しを押すと開く`).toBeVisible();
      await expect.soft(front.フリー入力エリアの内容(n), `フリー入力エリア${n}の内容`).toHaveText(`案内${n}の内容`);
    }
  });
});

caseTest("IT-M13-02-031", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, notes.get("〔イベントID-M1302-031〕")); });
  await step(2, async () => {
    await form.fill({ フリー入力エリア: [{ 項目名日: "共通案内", 内容日: "全日程共通内容" }] });
    await form.submit(form.更新ボタン);
  });
  const 表示: Record<string, { 見出し: string; 内容: string }> = {};
  await step(3, async () => {
    for (const x of ["A", "B"]) {
      const front = await openFrontEventDetail(page, notes.get(`〔日程ID-M1302-031${x}〕`));
      表示[x] = {
        見出し: (await front.フリー入力エリアの見出し(1).count()) ? (await front.フリー入力エリアの見出し(1).innerText()).trim() : "（フリー入力エリア1が表示されていない）",
        内容: (await front.フリー入力エリアの内容(1).count()) ? (await front.フリー入力エリアの内容(1).textContent() ?? "").trim() : "（フリー入力エリア1が表示されていない）",
      };
    }
  });
  await expected(async () => {
    for (const x of ["A", "B"]) {
      expect.soft(表示[x].見出し, `日程${x}のイベント説明の見出し`).toBe("共通案内");
      expect.soft(表示[x].内容, `日程${x}のイベント説明の内容`).toBe("全日程共通内容");
    }
  });
});

caseTest("IT-M13-02-057", async ({ page, notes, step, expected }) => {
  const c = notes.get("〔イベントID-M1302-057C〕");
  await loginAdmin(page, M1302_ADMIN);
  await step(1, async () => {
    const { ids } = await openEventSearchPage(page, "M1302-PAGING-057", 10, 3);
    expect(ids, "検索結果3ページ目に、イベントID 〔イベントID-M1302-057C〕が出ている").toContain(c);
  });
  let form!: EventForm;
  await step(2, async () => {
    await page.locator("table tbody tr").filter({ has: page.locator("td:first-child", { hasText: new RegExp(`^\\s*${c}\\s*$`) }) }).locator("td").nth(1).getByRole("link").click();
    await page.waitForLoadState("load");
    form = new EventForm(page);
  });
  await step(3, async () => {
    await form.削除ボタン.click();
    const modal = page.locator(`#event_delete_${c}`);
    await expect(modal).toBeVisible();
    await modal.locator("a.btn-ec-delete").click();
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    await expect(page, "イベント一覧（検索結果）画面の3ページ目へ遷移する").toHaveURL(/\/event\/page\/3(\?.*)?$/);
  });
});
