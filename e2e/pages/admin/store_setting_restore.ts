/**
 * 使い回す店舗の設定（店舗登録画面の値）を、ケースの間だけ書き換えて、ケースの終わりに必ず元へ戻す部品（依頼者 2026-11-15）。
 * - 書き換えてよいのは E2E の店舗（lib/store_create_ban.ts の E2Eの店舗）だけ。元からある店舗は読むだけ（書き換えるケースは solo_cases.tsv の一人で流す回に回す）。
 * - 書き換える前の値を lib/shared_restore.ts に登録し、ケースの終わりに画面で戻して、戻ったかを開き直して確かめる。
 */
import { expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { E2Eの店舗 } from "../../lib/store_create_ban";
import { withAdminSession } from "../../lib/session";
import { registerRestore } from "../../lib/shared_restore";
import { expectSaved } from "./common";
import { TenantEditPage, 店舗の値 } from "./m10_15_tenant";

async function 開く(page: Page, 店舗ID: string, what: string): Promise<TenantEditPage> {
  const p = new TenantEditPage(page);
  const st = await p.直接開く(店舗ID);
  if (st !== 200) throw new Error(`${what}: 店舗ID ${店舗ID} の店舗登録画面が開けない（応答 ${st}）`);
  await p.待つ();
  return p;
}

async function 読む(p: TenantEditPage, keys: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const k of keys) out[k] = k in { 店舗種別: 1, 公開: 1, 開店: 1, 売上集計の検索項目: 1 } ? await p.選択(k as never) : await p.値(k as never);
  return out;
}

async function 保存する(page: Page, p: TenantEditPage, 値: Record<string, string>, what: string): Promise<void> {
  const errs = await p.入れる全部(値 as 店舗の値);
  if (errs.length) throw new Error(`${what}: ${errs.join(" / ")}`);
  const sent = await p.登録を押す();
  if (!sent.sent) throw new Error(`${what}: ブラウザの入力チェックで送信が止まった（${sent.止めた項目.join(" / ")}）`);
  const e = await p.エラーの文();
  if (e.length) throw new Error(`${what}: 店舗登録画面がエラーを表示した（${e.join(" / ")}）`);
  await expectSaved(page, what);
}

/**
 * E2E の店舗の設定を値にそろえる（同じなら触らない）。書き換えるときは、元の値を登録して、ケースの終わりに戻す。
 * 値の項目名は TenantEditPage の項目（高額商品閾値1 など）・ラジオ項目（公開・開店など）。
 */
export async function 店舗の設定をケースの間だけ書き換える(page: Page, 店舗ID: string, 値: Record<string, string>, what: string, issue: (m: string) => void): Promise<void> {
  if (!E2Eの店舗.some((s) => s.id === 店舗ID)) throw new Error(`${what}: 店舗ID ${店舗ID} は E2E の店舗ではない。元からある店舗の設定は書き換えない（書き換えるケースは solo_cases.tsv の一人で流す回に回す）`);
  const keys = Object.keys(値);
  const p = await 開く(page, 店舗ID, what);
  const before = await 読む(p, keys);
  if (keys.every((k) => before[k] === 値[k])) { issue(`店舗ID ${店舗ID} の ${keys.join("・")} はすでに求める値だったので書き換えなかった`); return; }
  const br = page.context().browser();
  if (!br) throw new Error(`${what}: ブラウザを取れず、設定を戻す手当てができない`);
  const same = (a: Record<string, string>) => keys.every((k) => a[k] === before[k]);
  registerRestore(`店舗ID ${店舗ID} の設定（${keys.join("・")}）`, { 店舗ID, before },
    async () => { await withAdminSession(br, SETUP_ADMIN, async (pg) => { const q = await 開く(pg, 店舗ID, `${what}（元へ戻す）`); await 保存する(pg, q, before, `${what}（元へ戻す）`); }); },
    async () => withAdminSession(br, SETUP_ADMIN, async (pg) => same(await 読む(await 開く(pg, 店舗ID, `${what}（戻したか）`), keys))));
  await 保存する(page, p, 値, what);
  const after = await 読む(await 開く(page, 店舗ID, `${what}（保存後）`), keys);
  if (!keys.every((k) => after[k] === 値[k])) throw new Error(`${what}: 保存後の値が求める値と違う（${JSON.stringify(after)}）`);
  issue(`E2E の店舗（店舗ID ${店舗ID}）の ${keys.map((k) => `${k}「${before[k]}」→「${値[k]}」`).join("・")} をケースの間だけ書き換えた（ケースの終わりに画面で元へ戻して確かめる）`);
}

const 画像の欄 = (page: Page, 名: string) => page.locator(`[name="mall_tenant_shop_master[${名}]"]`);

/**
 * E2E の店舗に、ご当地晴れる屋くん画像（と、画面と比べる店舗の値）をケースの間だけ設定し、ケースの終わりに元へ戻す。
 * 元の画像が無い店舗だけに使える（元の画像があると、元へ戻せないので止める）。戻すときは画像を削除し、値を元へ戻して、開き直して照合する。
 */
export async function 店舗の画像と値をケースの間だけ設定する(page: Page, 店舗ID: string, 画像: string, 値: Record<string, string>, what: string, issue: (m: string) => void): Promise<void> {
  if (!E2Eの店舗.some((s) => s.id === 店舗ID)) throw new Error(`${what}: 店舗ID ${店舗ID} は E2E の店舗ではない。元からある店舗の登録内容は書き換えない`);
  const keys = Object.keys(値);
  const p = await 開く(page, 店舗ID, what);
  const before = await 読む(p, keys);
  const 元の画像 = await 画像の欄(page, "local_hareruyakun_image").inputValue();
  if (元の画像) throw new Error(`${what}: 店舗ID ${店舗ID} にはもとの画像が登録されていて、ケースの後に元へ戻せない`);
  const br = page.context().browser();
  if (!br) throw new Error(`${what}: ブラウザを取れず、戻す手当てができない`);
  const 戻す = async (pg: Page) => {
    const q = await 開く(pg, 店舗ID, `${what}（元へ戻す）`);
    const いま = await 画像の欄(pg, "local_hareruyakun_image").inputValue();
    if (いま) await 画像の欄(pg, "delete_local_hareruyakun_image").evaluate((el, v) => { (el as HTMLInputElement).value = v as string; }, いま);
    await 保存する(pg, q, before, `${what}（元へ戻す）`);
  };
  registerRestore(`店舗ID ${店舗ID} のご当地画像と ${keys.join("・")}`, { 店舗ID, before },
    async () => { await withAdminSession(br, SETUP_ADMIN, async (pg) => { await 戻す(pg); }); },
    async () => withAdminSession(br, SETUP_ADMIN, async (pg) => {
      const q = await 開く(pg, 店舗ID, `${what}（戻したか）`);
      const v = await 読む(q, keys);
      return keys.every((k) => v[k] === before[k]) && (await 画像の欄(pg, "local_hareruyakun_image").inputValue()) === "";
    }));
  await page.locator("div.col:has(#hareruyakun-upload-zone) input[type=file]").first().setInputFiles(画像);
  await expect(画像の欄(page, "add_local_hareruyakun_image"), `${what}: 画像の送信`).not.toHaveValue("", { timeout: 60_000 });
  await 保存する(page, p, 値, what);
  const q = await 開く(page, 店舗ID, `${what}（保存後）`);
  const after = await 読む(q, keys);
  if (!keys.every((k) => after[k] === 値[k])) throw new Error(`${what}: 保存後の値が求める値と違う（${JSON.stringify(after)}）`);
  if (!(await 画像の欄(page, "local_hareruyakun_image").inputValue())) throw new Error(`${what}: 保存後に画像が登録されていない`);
  issue(`E2E の店舗（店舗ID ${店舗ID}）に、ご当地晴れる屋くん画像（${画像.split("/").pop()}）と ${keys.join("・")} をケースの間だけ設定した（終わりに画像を削除し、値を元へ戻して照合する）`);
}
