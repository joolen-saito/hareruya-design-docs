/** F04-03 のシードが使う、フロントのマイページの配送先の新規登録・変更（一覧 → 入力 → 確認 → 登録）。 */
import { expect, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { 配送先の定め } from "../admin/f04_setup";

const front = (p: string) => `${BASE_URL}/ja${p}`;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** マイページの配送先一覧で「新しい住所を追加」を押し、入力して確認画面で「登録する」を押す。登録した配送先の編集リンクの番号（配送先ID）を返す */
export async function マイページで配送先を足す(page: Page, v: 配送先の定め & { カナ姓?: string; カナ名?: string }, what: string): Promise<string> {
  await page.goto(front("/mypage/delivery"), { timeout: 60_000 });
  await page.waitForLoadState("load");
  const add = page.locator('a[href$="/mypage/delivery/new/edit"]').first();
  await expect(add, `${what}: 配送先一覧の「新しい住所を追加」`).toBeVisible({ timeout: 30_000 });
  await Promise.all([page.waitForURL(/\/mypage\/delivery\/new\/edit/, { waitUntil: "domcontentloaded", timeout: 60_000 }), add.click({ timeout: 30_000 })]);
  await page.waitForLoadState("load");
  const f = (name: string) => page.locator(`form [name$="[${name}]"]`).first();
  const country = v.国 ?? "Japan";
  if (country !== "Japan") {
    // 国を変えると画面が作り直されるので、ほかの欄を入れる前に選ぶ
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), f("country").selectOption({ label: country })]);
    await page.waitForLoadState("load");
  }
  await f("address_name").fill(v.配送先名称);
  await f("name01").fill(v.姓);
  await f("name02").fill(v.名);
  if (v.カナ姓 !== undefined) await f("kana01").fill(v.カナ姓);
  if (v.カナ名 !== undefined) await f("kana02").fill(v.カナ名);
  if (country === "Japan") {
    const zip = (v.郵便番号 ?? "").replace(/\D/g, "");
    await f("postalCode01").fill(zip.slice(0, 3));
    await f("postalCode02").fill(zip.slice(3));
    await f("pref").selectOption({ label: v.都道府県 ?? "東京都" });
  } else {
    await f("abroadPostalCode").fill(v.海外郵便番号 ?? "");
  }
  await f("addr01").fill(v.住所1);
  await f("addr02").fill(v.住所2);
  if (v.住所3 !== undefined && (await f("addr03").count()) > 0) await f("addr03").fill(v.住所3);
  const tel = v.電話.replace(/\D/g, "");
  const parts = v.電話.includes("-") ? v.電話.split("-") : [tel.slice(0, 2), tel.slice(2, 6), tel.slice(6)];
  await f("tel01").fill(parts[0]);
  await f("tel02").fill(parts[1]);
  await f("tel03").fill(parts[2]);
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), page.locator("form:has([name$='[address_name]']) button[type=submit]").first().click({ timeout: 30_000 })]);
  await page.waitForLoadState("load");
  if (!/confirm|complete/.test(page.url()) && (await page.getByRole("button", { name: "登録する" }).count()) === 0) {
    const errs = (await page.locator(".c-hareruya-form-input__field-error, .c-hareruya-form-input--error, .ec-errorMessage, .invalid-feedback").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    throw new Error(`${what}: 配送先の入力が確認画面へ進まない（${page.url()}）: ${errs.join(" / ") || "入力エラーの表示なし"}`);
  }
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), page.getByRole("button", { name: "登録する" }).click({ timeout: 30_000 })]);
  await page.waitForLoadState("load");
  await expect(page, `${what}: 登録後に配送先一覧へ戻る`).toHaveURL(/\/mypage\/delivery$/, { timeout: 30_000 });
  const row = page.locator("li, div").filter({ has: page.locator(`text=${v.配送先名称}`) }).locator('a[href*="/mypage/delivery/"][href$="/edit"]').last();
  const hrefs = await page.locator('a[href*="/mypage/delivery/"][href$="/edit"]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
  void row; void esc;
  const ids = hrefs.map((h) => /\/mypage\/delivery\/(\d+)\/edit/.exec(h)?.[1]).filter((x): x is string => !!x);
  if (ids.length === 0) throw new Error(`${what}: 配送先一覧に編集リンクが無い`);
  // 登録した配送先は、番号が最大のもの（一覧の最後に追加される）
  return String(Math.max(...ids.map(Number)));
}
