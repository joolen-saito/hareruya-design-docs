/**
 * M07-03 のシードが使うフロントの操作（会員登録・ネット買取の申込）。セレクタはここにだけ書く。
 *
 * 画面の作り（アプリのテンプレートで確かめた）:
 * - 会員情報登録（/ja/entry）→ 確認画面の「登録する」。本登録のメールを使う設定だと仮会員になる。
 *   共有の開発環境ではメールの受け口を読めないので、ここではメールを読まない（本会員にするのは管理画面の会員編集で行う）。
 * - 買取手続き（/ja/purchase/fill）: 買取の承諾方法は「査定結果を確認してから承諾する」（値 0）と「自動承諾」（値 1）のラジオ。
 *   適格請求書発行事業者の確認は「はい」「いいえ」のラジオで、「はい」のときだけ登録番号の欄が出る。
 */
import { expect, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const front = (p: string) => `${BASE_URL}/ja${p}`;
const OPEN = 30_000;

export type 登録する会員 = {
  姓: string; 名: string; セイ: string; メイ: string; メール: string; パスワード: string;
  郵便番号: [string, string]; 都道府県: string; 住所1: string; 住所2: string; 電話: [string, string, string];
  生年月日: [string, string, string]; 住所3?: string;
};

/** 会員情報登録画面で登録する（メールは読まない）。登録後に仮会員か本会員かを返す（完了画面の URL で見分ける） */
export async function 会員登録する(page: Page, v: 登録する会員): Promise<"仮会員" | "本会員"> {
  await page.goto(front("/entry"), { timeout: 60_000 });
  await page.waitForLoadState("load");
  const form = page.locator("form#entry_form");
  await expect(form, "会員情報登録画面").toBeVisible({ timeout: OPEN });
  const f = (name: string) => form.locator(`[name="entry[${name}]"]`);
  await f("name][name01").fill(v.姓);
  await f("name][name02").fill(v.名);
  await f("kana][kana01").fill(v.セイ);
  await f("kana][kana02").fill(v.メイ);
  await f("birth][year").selectOption(v.生年月日[0]);
  await f("birth][month").selectOption(v.生年月日[1]);
  await f("birth][day").selectOption(v.生年月日[2]);
  await f("email][first").fill(v.メール);
  await f("email][second").fill(v.メール);
  await f("plain_password][first").fill(v.パスワード);
  await f("plain_password][second").fill(v.パスワード);
  await f("postalCode][postalCode01").fill(v.郵便番号[0]);
  await f("postalCode][postalCode02").fill(v.郵便番号[1]);
  await f("address][pref").selectOption({ label: v.都道府県 });
  await f("address][addr01").fill(v.住所1);
  await f("address][addr02").fill(v.住所2);
  if (v.住所3 !== undefined) {
    if ((await f("address][addr03").count()) === 0) throw new Error("会員情報登録画面に住所3の欄が無い");
    await f("address][addr03").fill(v.住所3);
  }
  await f("tel][tel01").fill(v.電話[0]);
  await f("tel][tel02").fill(v.電話[1]);
  await f("tel][tel03").fill(v.電話[2]);
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.getByRole("button", { name: "同意して確認画面へ" }).click()]);
  await page.waitForLoadState("load");
  const errors = (await page.locator(".ec-errorMessage, .form-error-message, .invalid-feedback, .c-hareruya-form__error").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  if (errors.length) throw new Error(`会員「${v.姓} ${v.名}」の会員情報登録で入力エラー: ${errors.join(" / ")}`);
  const register = page.locator('button[name="mode"][value="complete"]');
  await expect(register, "確認画面の「登録する」").toBeVisible({ timeout: OPEN });
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), register.click()]);
  await page.waitForLoadState("load");
  if (/\/entry\/regist_error/.test(page.url())) throw new Error(`会員「${v.姓} ${v.名}」を登録できない（${page.url()}）`);
  return /\/entry\/complete/.test(page.url()) ? "仮会員" : "本会員";
}

export type 申込の条件 = {
  承諾方法: "査定結果を確認してから承諾する" | "自動承諾";
  /** 適格請求書発行事業者の確認。登録番号を渡すと「はい」、null は「いいえ」 */
  登録番号: string | null;
  口座名義: string;
  銀行名?: string; 支店名?: string; 口座番号?: string; 箱数?: string;
  /** 口座種別の表示名（例「当座」）。省略は選択肢の先頭（「普通」） */
  口座種別?: string;
};

/** 買取商品詳細で数量を入れて「カートに追加」を押す */
async function カートに入れる(page: Page, 商品ID: string, 数量: string): Promise<void> {
  await page.goto(front(`/purchase/detail/${商品ID}`), { timeout: 60_000 });
  await page.waitForLoadState("load");
  const add = page.locator("button.addCart.detail").first();
  await expect(add, `買取商品詳細（商品ID ${商品ID}）の「カートに追加」ボタン`).toBeVisible({ timeout: OPEN });
  const qty = page.locator('input[name="quantityToBuy"]').first();
  await qty.fill(数量, { timeout: OPEN });
  await qty.blur();
  const res = page.waitForResponse((r) => /\/purchase\/add$/.test(new URL(r.url()).pathname) && r.request().method() === "POST", { timeout: 30_000 });
  await add.click({ timeout: OPEN });
  expect((await res).status(), "買取カートへ追加する要求の応答").toBe(200);
}

/**
 * 会員でログイン済みのページで、商品を順にカートへ入れ、買取手続きで条件を入れて申込む。
 * 完了画面の買取番号（PU日付-10桁）の番号部分（数字）を返す。
 */
export async function 条件つきで申込む(page: Page, 商品: { 商品ID: string; 数量: string }[], c: 申込の条件): Promise<string> {
  for (const p of 商品) await カートに入れる(page, p.商品ID, p.数量);
  await page.goto(front("/purchase/cart"), { timeout: 60_000 });
  await page.waitForLoadState("load");
  const proceed = page.locator("button.js-purchase-cart-proceed");
  if (!(await proceed.waitFor({ state: "visible", timeout: 8_000 }).then(() => true, () => false))) { await page.reload({ timeout: 60_000 }); await page.waitForLoadState("load"); }
  await expect(proceed, "買取カートの「買取手続きへ」ボタン").toBeVisible({ timeout: OPEN });
  await Promise.all([page.waitForURL(/\/purchase\/(fill|login)/, { timeout: 60_000 }), proceed.dispatchEvent("click")]);
  await page.waitForLoadState("load");
  const f = (name: string) => page.locator(`[name="purchase_confirm[${name}]"]`);
  await expect(f("bankCode"), "買取手続き画面の銀行名の欄").toBeVisible({ timeout: OPEN });
  await f("bankCode").fill(c.銀行名 ?? "晴屋銀行", { timeout: OPEN });
  await f("branchCode").fill(c.支店名 ?? "本店", { timeout: OPEN });
  // 口座種別の選択肢の先頭は「普通」（買取手続きのフォームの既定値）
  const types = page.locator('input[name="purchase_confirm[accountTypeId]"]');
  if (c.口座種別) {
    const names = await types.evaluateAll((os) => os.map((o) => ((o as HTMLInputElement).labels?.[0]?.textContent ?? "").trim()));
    const idx = names.indexOf(c.口座種別);
    if (idx < 0) throw new Error(`買取手続き画面の口座種別に「${c.口座種別}」が無い（ある選択肢: ${names.join("、")}）`);
    await types.nth(idx).check({ timeout: OPEN });
  } else {
    await types.first().check({ timeout: OPEN });
  }
  await f("accountNo").fill(c.口座番号 ?? "1234567", { timeout: OPEN });
  await f("accountHolder").fill(c.口座名義, { timeout: OPEN });
  if ((await f("packageCount").count()) > 0) {
    const opts = await f("packageCount").locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value).filter(Boolean));
    await f("packageCount").selectOption(c.箱数 && opts.includes(c.箱数) ? c.箱数 : opts[0], { timeout: OPEN });
  }
  await page.locator(`input[name="purchase_confirm[autoApprovalFlg]"][value="${c.承諾方法 === "自動承諾" ? "1" : "0"}"]`).check({ timeout: OPEN });
  if ((await f("job").count()) > 0) await f("job").selectOption({ label: "会社員" }, { timeout: OPEN }).catch(async () => { await f("job").selectOption({ index: 1 }, { timeout: OPEN }); });
  if ((await f("birth][year").count()) > 0) {
    await f("birth][year").selectOption("1990", { timeout: OPEN });
    await f("birth][month").selectOption("1", { timeout: OPEN });
    await f("birth][day").selectOption("1", { timeout: OPEN });
  }
  if (c.登録番号) {
    await page.locator("#isQualifiedInvoiceIssuer_true").check({ timeout: OPEN });
    const code = page.locator("[data-js-invoice-code-validation]");
    await expect(code, "適格請求書発行事業者の登録番号の欄").toBeVisible({ timeout: OPEN });
    await code.fill(c.登録番号, { timeout: OPEN });
    await code.blur();
  } else {
    await page.locator("#isQualifiedInvoiceIssuer_false").check({ timeout: OPEN });
  }
  await page.locator("#confirm-purchase").check({ timeout: OPEN });
  const submit = page.locator("#purchase-confirm-button");
  await expect(submit, "買取手続き画面の「申込み」ボタン").toBeEnabled({ timeout: OPEN });
  await submit.click({ timeout: OPEN });
  const modalSubmit = page.locator("#purchase-confirm-modal [data-js-confirm-modal-submit]");
  await expect(modalSubmit, "確認モーダルの「申込み」ボタン").toBeVisible({ timeout: OPEN });
  await Promise.all([page.waitForURL(/\/purchase\/complete/, { timeout: 90_000 }), modalSubmit.click({ timeout: OPEN })]);
  await page.waitForLoadState("load");
  const body = (await page.locator("body").innerText({ timeout: OPEN })).replace(/\s+/g, " ");
  const m = /PU\d{6}-(\d{10})/.exec(body);
  if (!m) throw new Error(`買取の申込完了の画面に買取番号が無い（${body.slice(0, 200)}）`);
  return String(Number(m[1]));
}
