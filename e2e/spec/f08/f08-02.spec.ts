/** F08-02 店頭買取査定申込情報入力。正本: cases/F08-02_test_cases.tsv（画面だけで準備できる 017 を実装） */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { StoreEntryPage } from "../../pages/front/f08_store_url";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

// 存在しない店舗識別名のエントリー画面・申込フォーム・会員登録フォーム
caseTest("IT-F08-02-017", async ({ page, step, expected }) => {
  const entry = new StoreEntryPage(page);
  const name = "it_f0802_no_store";
  const r: Record<string, number> = {};
  await step(1, async () => { r.エントリー画面 = (await entry.開く(name, "申込前ログイン")).status; });
  await step(2, async () => { r.申込フォーム = (await entry.開く(name, "申込フォーム")).status; });
  await step(3, async () => { r.会員登録フォーム = (await entry.開く(name, "会員登録フォーム")).status; });
  await expected(async () => {
    expect.soft(r.エントリー画面, "エントリー画面の要求のHTTP応答").toBe(404);
    expect.soft(r.申込フォーム, "申込フォームの要求のHTTP応答").toBe(404);
    expect.soft(r.会員登録フォーム, "会員登録フォームの要求のHTTP応答").toBe(404);
  });
  note("事前準備の「存在する場合は削除する」は、その店舗識別名の店舗が無いので行っていない。エントリー画面＝申込前ログイン画面、申込フォーム＝店舗直下の入力画面、会員登録フォーム＝会員登録の画面として、それぞれのURLを開いた");
});
