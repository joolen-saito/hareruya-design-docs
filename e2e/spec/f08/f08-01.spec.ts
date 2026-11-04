/** F08-01 店頭買取査定申込前ログイン。正本: cases/F08-01_test_cases.tsv（画面だけで準備できる 002・012 を実装） */
import { caseTest, expect } from "../../lib/case";
import { StoreEntryPage } from "../../pages/front/f08_store_url";

// 存在しない店舗識別名
caseTest("IT-F08-01-002", async ({ page, step, expected }) => {
  const entry = new StoreEntryPage(page);
  let r = { status: 0, url: "" };
  await step(1, async () => { r = await entry.開く("it_f0801_no_store", "申込前ログイン"); });
  await expected(async () => {
    expect.soft(r.status, "HTTPの応答").toBe(404);
    await expect.soft(entry.ログイン欄(), "店頭買取査定申込前ログイン画面のログイン欄（表示されない）").toHaveCount(0);
  });
});

// 規則に合わない店舗識別名（ハイフン入り・300文字）
caseTest("IT-F08-01-012", async ({ page, step, expected }) => {
  const entry = new StoreEntryPage(page);
  let a = { status: 0, url: "" };
  let b = { status: 0, url: "" };
  await step(1, async () => { a = await entry.開く("it-f0801", "申込前ログイン"); });
  const ログイン欄 = [0, 0];
  await step(2, async () => {
    ログイン欄[0] = await entry.ログイン欄().count();
    b = await entry.開く("a".repeat(300), "申込前ログイン");
    ログイン欄[1] = await entry.ログイン欄().count();
  });
  await expected(async () => {
    expect.soft(a.status, "ハイフン入りの店舗識別名の要求のHTTP応答").toBe(404);
    expect.soft(b.status, "300文字の店舗識別名の要求のHTTP応答").toBe(404);
    expect.soft(ログイン欄[0], "ハイフン入りの店舗識別名で表示されたログイン欄の数（表示されない）").toBe(0);
    expect.soft(ログイン欄[1], "300文字の店舗識別名で表示されたログイン欄の数（表示されない）").toBe(0);
  });
});
