/**
 * M08-08 手動メール通知（会員）の追加分: 005。正本: cases/M08-08_test_cases.tsv
 * 自動送信用のテンプレートは、開発環境に既にある自動送信のテンプレートで読み替える（seeds/m08-08-r.ts）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { CustomerManualMailPage } from "../../pages/admin/m08_08_manual_mail";
import { M0808_ADMIN, 作った会員の, 自動送信の読み替え } from "../../seeds/m08-08";
import "../../seeds/m08-08-r";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

caseTest("IT-M08-08-005", async ({ page, step, expected }) => {
  await loginAdmin(page, M0808_ADMIN);
  const d = 自動送信の読み替え();
  const m = 作った会員の("S-M08-08-DATA-005");
  const c = new CustomerManualMailPage(page);
  let 応答 = 0;
  await step(1, async () => {
    const st = await c.入力画面を開く(m.会員ID);
    expect(st, "手動メール通知(入力画面)の応答").toBe(200);
  });
  await step(2, async () => { note(`開発者ツールの代わりに、テンプレ選択へ値 ${d.ID}（自動送信のテンプレート「${d.名前}」）の選択肢をスクリプトで足した`); });
  await step(3, async () => { 応答 = await c.選択肢を足して選ぶ(d.ID, d.名前); note(`選択肢を選んで change を起こしたあとの応答: ${応答}・画面: ${page.url()}`); });
  await expected(async () => {
    supplement(`正本のテンプレートID 8084005「D-自動送信-005」は、開発環境に会員ベースの自動送信テンプレートが無く足さないので、自動送信のテンプレート「${d.名前}」（番号 ${d.ID}）で読み替えた`);
    expect.soft(応答, "応答がHTTP404となる").toBe(404);
  });
});
