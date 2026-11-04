/**
 * F06-25 店頭モニター。正本: cases/F06-25_test_cases.tsv
 * 実装するのは、番号札を使わない 003〜006。正本のアドレスは本番の「https://www.hareruyamtg.com/ja/…」で書かれているため、手元の接続先の同じ「/ja/…」で開いた（正本の外の補い）。
 * ほかは番号札の登録・管理画面・音声の確認を要するため実装しない。記録 review/F06-25_progress_2026-11-04.md
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { WaitingPage } from "../../pages/front/f06_25_waiting";
import "../../seeds/f06-25";

const supplement = () => test.info().annotations.push({ type: "正本の外の補い", description: "正本のアドレスは本番(https://www.hareruyamtg.com)で書かれているため、手元の接続先の同じ「/ja/…」を開いた。店名は書き換えず、店舗ID 1 が本店・店舗ID 5 が支店(osaka)であることを確かめて使った" });

caseTest("IT-F06-25-003", async ({ page, step, expected }) => {
  supplement();
  const w = new WaitingPage(page);
  await step(1, async () => { await w.開く("/ja/waiting_number_1"); });
  await step(2, async () => { await expect(w.番号札の枠, "店頭モニターの番号札の枠").toBeAttached({ timeout: 30_000 }); });
  await expected(async () => { expect.soft(await w.WiFi欄.count(), "WiFiパスワードの欄が表示される").toBe(1); });
});
caseTest("IT-F06-25-004", async ({ page, step, expected }) => {
  supplement();
  const w = new WaitingPage(page);
  await step(1, async () => { await w.開く("/ja/osaka/waiting_number"); });
  await step(2, async () => { await expect(w.番号札の枠, "店頭モニターの番号札の枠").toBeAttached({ timeout: 30_000 }); });
  await expected(async () => { expect.soft(await w.WiFi欄.count(), "WiFiパスワードの欄が表示されない").toBe(0); });
});
caseTest("IT-F06-25-005", async ({ page, step, expected }) => {
  supplement();
  const w = new WaitingPage(page);
  let status = 0;
  await step(1, async () => { status = await w.開く("/ja/waiting_number_1"); });
  await expected(async () => {
    expect.soft(status, "応答の状態").toBe(200);
    expect.soft(await w.モニター画面である(), "本店の店頭モニター画面が表示される").toBe(true);
  });
});
caseTest("IT-F06-25-006", async ({ page, step, expected }) => {
  supplement();
  const w = new WaitingPage(page);
  let status = 0;
  await step(1, async () => { status = await w.開く("/ja/waiting_number_2"); });
  await expected(async () => {
    expect.soft(await w.モニター画面である(), "2つ目の本店用店頭モニター画面が表示されない").toBe(false);
    expect.soft(status, "応答の状態（存在しない画面）").toBe(404);
  });
});
