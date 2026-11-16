/**
 * 本店（店舗ID 1）の店舗基本設定を書き換える共通の手続き（M10-05・M07-04 のシードが使う。シードの登録は含まない）。
 * 書き換える前に画面の全項目の値を控え、lib/shared_restore.ts の registerRestore に「画面から全項目を元の値へ戻す」手続きと
 * 「戻したあとの画面の全項目が控えと同じか」の確かめを登録する。戻すのはケースの終わり（基盤）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { registerRestore } from "../lib/shared_restore";
import { withAdminSession } from "../lib/session";
import { ShopBasicPage, 七つのトグル, 控え } from "../pages/admin/m10_01_shop";

export type 値 = Record<string, string>;

async function 本店の基本設定を読む(browser: Browser): Promise<控え> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new ShopBasicPage(page);
    await p.open();
    return p.全部読む();
  });
}
/** 控えた全項目の値へ画面から戻す */
async function 控えへ戻す(browser: Browser, 元: 控え): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await new ShopBasicPage(page).控えへ戻して保存する(元, "本店の店舗基本設定を元の値へ戻す");
  });
}
async function 控えと同じか(browser: Browser, 元: 控え): Promise<boolean> {
  const 今 = await 本店の基本設定を読む(browser);
  return Object.keys(元).every((k) => 元[k] === 今[k]);
}


/** 本店の店舗基本設定の項目（正本の項目名 → 値）を書き換える。全トグルを無効にするときは トグルを無効 を true */
export async function 本店の基本設定を控えて書き換える(browser: Browser, seedId: string, v: 値, トグルを無効: boolean): Promise<void> {
  const 元 = await 本店の基本設定を読む(browser);
  registerRestore(`本店の店舗基本設定（${seedId}）`, 元, () => 控えへ戻す(browser, 元), () => 控えと同じか(browser, 元));
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new ShopBasicPage(page);
    await p.入れて保存する(`${seedId} 店舗基本設定の保存`, async () => {
      for (const [k, val] of Object.entries(v)) await p.入れる(k, val);
      if (トグルを無効) for (const t of 七つのトグル) await p.トグルを(t, false);
    });
  });
}
