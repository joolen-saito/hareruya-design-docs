/** F08-03 店頭買取査定申込登録確認。正本: cases/F08-03_test_cases.tsv（画面だけで準備できる 001 を実装） */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { StoreEntryPage } from "../../pages/front/f08_store_url";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

// 存在しない店舗識別名の登録確認
caseTest("IT-F08-03-001", async ({ page, step, expected }) => {
  const entry = new StoreEntryPage(page);
  let r = { status: 0, url: "" };
  await step(1, async () => { r = await entry.開く("unknown-f0803", "登録確認"); });
  await expected(async () => {
    expect.soft(r.status, "HTTPの応答").toBe(404);
    await expect.soft(entry.申込の入力欄(), "申込の入力欄（表示されない）").toHaveCount(0);
  });
  note("事前準備の「存在する場合は削除する」は、その店舗識別名の店舗が無いので行っていない");
});
