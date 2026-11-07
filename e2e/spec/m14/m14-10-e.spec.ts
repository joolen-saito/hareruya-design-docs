/** M14-10 フォーマット詳細（デッキビルダー利用の設定がフロントのマイデッキ取得へ反映される連携確認）。正本: cases/M14-10_test_cases.tsv */
import { Page, test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { 編集画面を開く, 入力する, 登録を押す } from "../../pages/admin/m14_10_format";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { マイデッキ取得の絞り込み選択肢 } from "../../pages/admin/m14_10_downstream";
import { DeckEditPage } from "../../pages/front/f06_16_deck_entry";
import { M1410_ADMIN } from "../../seeds/m14-10";
import { 連携の会員, 連携の日程 } from "../../seeds/m14-10-e";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function 利用を選んで登録(page: Page, id: string): Promise<boolean> {
  await 入力する(page, { チェック: { DeckbuilderFlg: true } });
  const r = await 登録を押す(page);
  return r.sent && (await page.locator(".alert-success").count()) > 0;
}

caseTest("IT-M14-10-033", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  const id = notes.get("〔フォーマットID-M1410-033〕"), 名 = rc("連携確認フォーマット-033");
  const 会員 = 連携の会員.get("033")!, 日程ID = 連携の日程.get("033")!;
  const e = new DeckEditPage(page);
  let r = { 選択欄あり: false, 選択肢: [] as string[], マイデッキ数: 0 };
  await step(1, async () => { await 編集画面を開く(page, id); });
  await step(2, async () => { expect.soft(await 利用を選んで登録(page, id), "フォーマットの変更が保存された（成功メッセージが表示された）").toBe(true); });
  await step(3, async () => { await frontLogin(page, 会員); await e.開く(日程ID); });
  await step(4, async () => { await e.マイデッキを開く(); r = await マイデッキ取得の絞り込み選択肢(e); });
  await expected(async () => {
    expect.soft(r.選択欄あり, "マイデッキ取得の画面に、フォーマットで絞り込む選択欄がある").toBe(true);
    expect.soft(r.選択肢, "セレクトボックスの選択肢").toContain(名);
  });
  if (r.マイデッキ数 === 0) note("シード表の会員にはマイデッキが無く、マイデッキ取得の画面は「マイデッキが無い」表示になる（絞り込みの選択欄はマイデッキがあるときだけ出る作り）");
});

caseTest("IT-M14-10-064", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  const A = notes.get("〔フォーマットID-M1410-064A〕"), B名 = rc("連携確認フォーマットB-064");
  const 会員 = 連携の会員.get("064")!, 日程ID = 連携の日程.get("064")!;
  const e = new DeckEditPage(page);
  let r = { 選択欄あり: false, 選択肢: [] as string[], マイデッキ数: 0 };
  await step(1, async () => { await 編集画面を開く(page, A); });
  await step(2, async () => { expect.soft(await 利用を選んで登録(page, A), "フォーマットの変更が保存された（成功メッセージが表示された）").toBe(true); });
  await step(3, async () => { await frontLogin(page, 会員); await e.開く(日程ID); });
  await step(4, async () => { await e.マイデッキを開く(); });
  await step(5, async () => { r = await マイデッキ取得の絞り込み選択肢(e); });
  await expected(async () => {
    expect.soft(r.選択欄あり, "マイデッキ取得の画面に、フォーマットで絞り込む選択欄が表示されている（選択肢を確かめられる状態）").toBe(true);
    expect.soft(r.選択肢, "セレクトボックスの選択肢に利用未選択のフォーマットBが表示されない").not.toContain(B名);
  });
  note("マイデッキの所有選手は、プレイヤー検索の全ページから最大IDを探す代わりに、選手IDを入力欄へ直接入れて登録した");
});
