/**
 * 試験端末（MTGバイヤー）の手動試験用データ（O01-01）の店頭買取の申込。フロントの店頭買取査定申込（会員登録なし）。
 *
 * pages/front/m06_otc_buy.ts の申込と同じ画面の操作だが、あちらは電話連絡・大会参加・適格請求書発行事業者の値が固定で、
 * 返却希望サプライも入れられない。ここは、シード表が決める値（適格請求書発行事業者「はい」と登録番号・電話連絡「必要」・
 * 大会参加「はい」・返却希望サプライの「その他」）を指定できる。共通の部品（m06_otc_buy.ts）は変えない。
 */
import { expect, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const OPEN = 30_000;
const front = (p: string) => `${BASE_URL}/ja${p}`;

export type O01申込 = {
  姓: string; 名: string; セイ: string; メイ: string;
  /** 適格請求書発行事業者。「はい」のとき登録番号を入れる */
  適格請求書発行事業者: boolean;
  登録番号?: string;
  /** 電話連絡「必要」（既定は不必要） */
  電話連絡を必要にする?: boolean;
  /** 大会参加中または参加予定「はい」（既定はいいえ） */
  大会参加?: boolean;
  /** 返却希望サプライの「その他」の欄 */
  返却サプライその他?: string;
};

async function 入力する(page: Page, a: O01申込): Promise<void> {
  const f = (name: string) => page.locator(`[name="otc_buy_order[${name}]"]`);
  await expect(f("lastName"), "申込情報入力画面のお名前（姓）の欄").toBeVisible({ timeout: OPEN });
  await f("lastName").fill(a.姓, { timeout: OPEN });
  await f("firstName").fill(a.名, { timeout: OPEN });
  await f("lastNameKana").fill(a.セイ, { timeout: OPEN });
  await f("firstNameKana").fill(a.メイ, { timeout: OPEN });
  await f("postal_code_1").fill("169", { timeout: OPEN });
  await f("postal_code_2").fill("0075", { timeout: OPEN });
  // 郵便番号の欄を離れると住所が自動で入る（遅れて届き、あとの入力を上書きすることがある）。落ち着いてから残りを入れる
  await f("postal_code_2").blur();
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);
  await page.waitForTimeout(1500);
  await f("pref").selectOption({ label: "東京都" }, { timeout: OPEN });
  await f("addr01").fill("新宿区高田馬場", { timeout: OPEN });
  await f("addr02").fill("3-12-2", { timeout: OPEN });
  await f("birth][year").selectOption("1990", { timeout: OPEN });
  await f("birth][month").selectOption("1", { timeout: OPEN });
  await f("birth][day").selectOption("1", { timeout: OPEN });
  await f("tel01").fill("03", { timeout: OPEN });
  await f("tel02").fill("5332", { timeout: OPEN });
  await f("tel03").fill("7517", { timeout: OPEN });
  await f("job").selectOption({ index: 1 }, { timeout: OPEN });
  if (a.返却サプライその他) await f("return_supply_text").fill(a.返却サプライその他, { timeout: OPEN });
  await page.locator(`input[name="otc_buy_order[call_flg]"][value="${a.電話連絡を必要にする ? 1 : 0}"]`).check({ timeout: OPEN });
  await page.locator(`input[name="otc_buy_order[playing_flg]"][value="${a.大会参加 ? 1 : 0}"]`).check({ timeout: OPEN });
  await page.locator(`input[name="otc_buy_order[qualifiedInvoiceIssuerFlg]"][value="${a.適格請求書発行事業者 ? 1 : 0}"]`).check({ timeout: OPEN });
  if (a.適格請求書発行事業者) {
    const code = page.locator('input[name*="qualifiedInvoiceIssuerCode"]').first();
    await expect(code, "適格請求書発行事業者登録番号の欄").toBeVisible({ timeout: OPEN });
    await code.fill(a.登録番号 ?? "T1234567890123", { timeout: OPEN });
  }
  await page.locator('input[name="otc_buy_order[privacy_flg]"]').check({ timeout: OPEN });
  await page.waitForTimeout(500);
  for (const [name, value] of [["addr01", "新宿区高田馬場"], ["addr02", "3-12-2"], ["tel01", "03"], ["tel02", "5332"], ["tel03", "7517"]] as const) {
    if ((await f(name).inputValue({ timeout: OPEN })) !== value) await f(name).fill(value, { timeout: OPEN });
  }
}

/** 会員登録なしで申込む（申込前ログイン画面 → 情報入力 → 会員登録をスキップ → 確認 → 完了）。完了画面の番号を返す */
export async function o01申込む(page: Page, 支店URL: string, a: O01申込): Promise<string> {
  await page.goto(front(`/otcbuy/${支店URL}/entry`), { timeout: 60_000 });
  await page.waitForLoadState("load");
  await page.getByRole("link", { name: "アカウントをお持ちでない方はこちら" }).click({ timeout: OPEN });
  await page.waitForLoadState("load");
  await 入力する(page, a);
  await Promise.all([page.waitForURL(/\/otcbuy\/\w+\/register_customer/, { timeout: 60_000 }), page.locator("button#otcBuyOrderApply").click({ timeout: OPEN, noWaitAfter: true })]);
  await page.waitForLoadState("load");
  const skip = page.getByRole("link", { name: "会員登録をスキップする" });
  await expect(skip, "会員登録の画面の「会員登録をスキップする」").toBeVisible({ timeout: OPEN });
  await Promise.all([page.waitForURL(/\/otcbuy\/\w+\/confirm/, { timeout: 60_000 }), skip.click({ timeout: OPEN, noWaitAfter: true })]);
  await page.waitForLoadState("load");
  const apply = page.locator("button#otcBuyOrderApply");
  await expect(apply, "申込確認画面の「査定申込み」ボタン").toBeVisible({ timeout: OPEN });
  await Promise.all([page.waitForURL(/\/otcbuy\/\w+\/complete/, { timeout: 60_000 }), apply.click({ timeout: OPEN, noWaitAfter: true })]);
  await expect(page.getByText("査定申込みが完了しました。"), "申込完了の表示").toBeVisible({ timeout: OPEN });
  const text = (await page.getByText(/査定番号\s*\S+/).first().innerText({ timeout: OPEN })).replace(/\s+/g, " ");
  const m = /査定番号\s*(\S+)/.exec(text);
  if (!m) throw new Error(`申込完了の画面に査定番号が無い（${text}）`);
  return m[1];
}
