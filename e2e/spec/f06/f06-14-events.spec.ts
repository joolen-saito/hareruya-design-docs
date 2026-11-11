/**
 * F06-14 マイイベント・デッキ登録（イベント一覧のケース）。正本: cases/F06-14_test_cases.tsv
 * 画面遷移・未ログインのケース（021・022・024・025・026）は f06-14.spec.ts。ここは大会・申込・デッキを画面で作るシード（seeds/f06-14-events.ts）を使うケース。
 *
 * - 大会名は、シードが実行の印を付けて作る。手順・期待結果の同じ名前は、印つきの名前として確かめる。
 * - 「デッキ登録状況」「デッキ登録/編集」は、画面では見出し「デッキ登録」の値（登録済み・未登録）と、ボタン（デッキ登録・デッキ編集）。
 *   期待結果の「デッキ登録済み」「デッキ未登録」は、見出し「デッキ登録」＋値「登録済み」「未登録」の意味に読み、値で確かめる。
 * - 「処理状態」は画面の見出し「処理状態」の値。
 * - 実装しないケース: 018（イベント130件・申込130件を残す大量データ）、027（申込状況のマスタへ試験の行を足す必要があり、共有のマスタに試験の値を足さない）。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { EventHistoryPage } from "../../pages/front/f06_14_event_history_k";
import { DeckEntryEditPage } from "../../pages/front/f06_16_deck_entry_k";
import { 試験会員, 試験大会 } from "../../seeds/f06-14-events";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** ケースの会員でログインする（事前準備の「ブラウザで…としてログインしている」） */
async function ログイン(page: import("@playwright/test").Page, 会員key: string): Promise<EventHistoryPage> {
  const e = new EventHistoryPage(page);
  const m = 試験会員(会員key);
  await e.ログインする(m.メール, m.パスワード);
  return e;
}
const 名 = (key: string): string => 試験大会(key).名;
const 英名 = (key: string): string => 試験大会(key).英名;

/** デッキ登録状況（見出し「デッキ登録」の行）とデッキ登録/編集（ボタン）が表示されない */
function デッキの項目が出ない(会員: string, 大会: string, 対象: string, 前に確かめる?: (e: EventHistoryPage) => Promise<void>) {
  return async ({ page, step, expected }: Parameters<Parameters<typeof caseTest>[1]>[0]) => {
    const e = await ログイン(page, 会員);
    await step(1, async () => { await e.開く(); });
    await step(2, async () => {
      await expect(e.行(名(大会)), `「${対象}」の行`).toHaveCount(1);
      if (前に確かめる) await 前に確かめる(e);
    });
    await expected(async () => {
      expect.soft(await e.デッキ登録の状況(名(大会)), `「${対象}」のデッキ登録状況`).toBeNull();
      expect.soft(await e.デッキのボタン(名(大会)).count(), `「${対象}」のデッキ登録/編集（ボタン）の数`).toBe(0);
    });
  };
}

/** 日本語の一覧を開いてから、言語切替で英語にする（手順 1・2）。英語の一覧のイベント名は英語名 */
async function 英語にする(e: EventHistoryPage, step: (n: number, body: () => Promise<void>) => Promise<void>): Promise<void> {
  await step(1, async () => { await e.開く(); });
  await step(2, async () => { await e.押して遷移する(e.日英切替); });
}
