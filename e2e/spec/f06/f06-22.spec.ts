/**
 * F06-22 お問い合わせ。正本: cases/F06-22_test_cases.tsv
 * 実装するのは、件名のマスタ（SUBJECTS）・会員を使わない 013・014・015・016・048。
 * ほかは件名のマスタの登録（共有の設定）や会員Aを要するため実装しない。記録 review/F06-22_progress_2026-11-04.md
 */
import { caseTest, expect } from "../../lib/case";
import { ContactPage } from "../../pages/front/f06_22_contact";

caseTest("IT-F06-22-013", async ({ page, step, expected }) => {
  const c = new ContactPage(page);
  let 遷移した = true;
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { 遷移した = await c.現在地を押そうとする(); });
  await expected(async () => {
    expect.soft(await c.現在地がリンクか(), "現在表示中の「お問い合わせ」が押下可能なリンクになっている").toBe(false);
    expect.soft(遷移した, "押して遷移した").toBe(false);
  });
});
caseTest("IT-F06-22-014", async ({ page, step, expected }) => {
  const c = new ContactPage(page);
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.押して遷移する(c.パンくずホーム); });
  await expected(async () => { expect.soft(c.path, "遷移した画面（本店ECTOP）").toMatch(/^\/(ja\/?)?$/); });
});
caseTest("IT-F06-22-015", async ({ page, step, expected }) => {
  const c = new ContactPage(page);
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.押して遷移する(c.ご利用案内); });
  await expected(async () => { expect.soft(c.path, "遷移した画面（ヘルプ）").toMatch(/\/help/); });
});
caseTest("IT-F06-22-016", async ({ page, step, expected }) => {
  const c = new ContactPage(page);
  await step(1, async () => { await c.トップを開く(); });
  await step(2, async () => { await c.開く(); });
  await step(3, async () => { await c.押して遷移する(c.戻る); });
  await expected(async () => { expect.soft(c.path, "遷移した画面（ブラウザ履歴の1つ前の本店ECTOP）").toMatch(/^\/(ja\/?)?$/); });
});
caseTest("IT-F06-22-048", async ({ page, step, expected }) => {
  const ja = new ContactPage(page, "ja");
  const en = new ContactPage(page, "en");
  let jaN3 = -1, jaN1 = -1, enN3 = -1, enN1 = -1;
  let enType: string | null = null;
  await step(1, async () => { await ja.開く(); jaN3 = await ja.表示されている数(ja.電話番号の3分割欄); jaN1 = await ja.表示されている数(ja.電話番号の1欄); });
  await step(2, async () => { await en.開く(); enN3 = await en.表示されている数(en.電話番号の3分割欄); enN1 = await en.表示されている数(en.電話番号の1欄); enType = await en.電話番号欄の種類(); });
  await expected(async () => {
    expect.soft(jaN3, "日本語ページの電話番号の3分割欄の数").toBe(3);
    expect.soft(jaN1, "日本語ページの電話番号の1欄の数").toBe(0);
    expect.soft(enN3, "英語ページの電話番号の3分割欄の数").toBe(0);
    expect.soft(enN1, "英語ページの電話番号の1欄の数").toBe(1);
    expect.soft(enType, "英語ページの電話番号欄の入力の種類（数値）").toBe("number");
  });
});
