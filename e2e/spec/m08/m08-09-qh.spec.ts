/**
 * M08-09 配送先一覧表示/編集（公開側の配送先一覧と管理画面の編集・削除のつながり）。正本: cases/M08-09_test_cases.tsv
 * 実装した: 037（管理画面の編集がフロントの配送先一覧に出る）・039（管理画面の削除がフロントの配送先一覧から消える）
 * 実装しない: 038・040（商品コード QH0809-P-002／004 の商品の登録・入庫の承認・カート・配送方法の共有の設定の書き換えが要る。別の回）
 * 補い: ブラウザA（会員）は fixture の page、ブラウザB（管理者）は新しいコンテキスト。会員のメールアドレスには実行の印が付く。
 */
import { test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { 会員の保存内容 } from "../../db/m08_04";
import { expect, caseTest } from "../../lib/case";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { DeliveryEditPage, DeliveryListPage } from "../../pages/admin/m08_09_delivery";
import { 会員としてログインする } from "../../pages/front/f06_18_change";
import { front } from "../../pages/front/f04_shopping";
import { M0809_QH_ADMIN, QH会員のパスワード } from "../../seeds/m08-09-qh";
import { expectSaved } from "../../pages/admin/common";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** ブラウザAの配送先一覧画面（マイページ）の本文を読む */
async function 配送先一覧の文(page: import("@playwright/test").Page): Promise<string> {
  await page.goto(front("/mypage/delivery"), { timeout: 60_000 });
  await page.waitForLoadState("load");
  const box = page.locator(".p-hareruya-delivery-list__container");
  await expect(box, "配送先一覧画面の本文").toBeVisible({ timeout: 30_000 });
  return ((await box.innerText()) ?? "").replace(/\s+/g, " ").trim();
}

caseTest("IT-M08-09-037", async ({ page, notes, step, expected }) => {
  const 会員ID = notes.get("〔会員ID-M0809-QH001〕");
  const 配送先ID = notes.get("〔配送先ID-M0809-QH001〕");
  const メール = String(会員の保存内容(会員ID)?.メールアドレス ?? "");
  note(`会員ログインに使うメールアドレス: ${メール}（正本の qh0809-001@example.test に実行の印が付いたもの）`);
  const ctxB = await page.context().browser()!.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctxB);
    const pageB = await ctxB.newPage();
    pageB.setDefaultTimeout(60_000);
    let 更新前 = "";
    let 更新後 = "";
    await step(1, async () => { await 会員としてログインする(page, メール, QH会員のパスワード("001")); });
    await step(2, async () => {
      更新前 = await 配送先一覧の文(page);
      for (const v of ["旧姓A001", "旧名B001", "渋谷区旧町001", "旧ビル001", "旧会社M0809-001"]) expect.soft(更新前, `更新前の配送先一覧に「${v}」が表示されている`).toContain(v);
    });
    await step(3, async () => { await loginAdmin(pageB, M0809_QH_ADMIN); });
    const edit = new DeliveryEditPage(pageB);
    await step(4, async () => { const res = await edit.open(会員ID, 配送先ID); expect(res?.status(), "配送先の編集画面の応答").toBe(200); });
    await step(5, async () => { await edit.fill({ 姓: "新姓A001", 名: "新名B001", 住所1: "新宿区新町001", 住所2: "新ビル001", 会社名: "新会社M0809-001" }); });
    await step(6, async () => { await edit.pressRegister(); await expectSaved(pageB, "配送先の登録（保存しました）"); });
    await step(7, async () => { 更新後 = await 配送先一覧の文(page); });
    await expected(async () => {
      for (const v of ["新姓A001", "新名B001", "新宿区新町001", "新ビル001", "新会社M0809-001"]) expect.soft(更新後, `更新後の配送先一覧に「${v}」が表示される`).toContain(v);
      for (const v of ["旧姓A001", "旧名B001", "渋谷区旧町001", "旧ビル001", "旧会社M0809-001"]) expect.soft(更新後, `更新後の配送先一覧に更新前の「${v}」が表示されない`).not.toContain(v);
    });
  } finally { await ctxB.close(); }
});

caseTest("IT-M08-09-039", async ({ page, notes, step, expected }) => {
  const 会員ID = notes.get("〔会員ID-M0809-QH003〕");
  const 配送先ID = notes.get("〔配送先ID-M0809-QH003〕");
  const メール = String(会員の保存内容(会員ID)?.メールアドレス ?? "");
  note(`会員ログインに使うメールアドレス: ${メール}（正本の qh0809-003@example.test に実行の印が付いたもの）`);
  const ctxB = await page.context().browser()!.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctxB);
    const pageB = await ctxB.newPage();
    pageB.setDefaultTimeout(60_000);
    let 削除後 = "";
    await step(1, async () => { await 会員としてログインする(page, メール, QH会員のパスワード("003")); });
    await step(2, async () => { expect(await 配送先一覧の文(page), "削除前の配送先一覧に住所1「千代田区削除対象003」が表示されている").toContain("千代田区削除対象003"); });
    await step(3, async () => { await loginAdmin(pageB, M0809_QH_ADMIN); });
    const list = new DeliveryListPage(pageB);
    await step(4, async () => { const res = await list.open(会員ID); expect(res?.status(), "会員編集画面（配送先一覧）の応答").toBe(200); });
    let modal!: Awaited<ReturnType<DeliveryListPage["削除の操作を選ぶ"]>>;
    await step(5, async () => {
      modal = await list.削除の操作を選ぶ(配送先ID);
      expect.soft(((await modal.innerText()) ?? ""), "確認に対象の配送先名称「削除対象003」を含む").toContain("削除対象003");
      await list.了承する(modal);
    });
    await step(6, async () => { await expect(pageB.locator(".alert-success"), "「削除しました」の表示").toContainText("削除しました"); });
    await step(7, async () => { 削除後 = await 配送先一覧の文(page); });
    await expected(async () => {
      expect(削除後, "削除後の配送先一覧に、削除前に表示されていた住所1「千代田区削除対象003」の枠が表示されない").not.toContain("千代田区削除対象003");
    });
  } finally { await ctxB.close(); }
});
