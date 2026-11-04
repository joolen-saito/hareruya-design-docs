/**
 * F04-02 の複数配送設定（店舗基本設定。共有の設定＝店舗ID 1）を、ケースの開始時に有効・無効にし、終わったら元の値へ戻す。
 * 元の値は、書き換える前に DB の参照で控え、戻したあとに DB の参照で一致を確かめる。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { 店舗基本情報を読む } from "../../db/m10_01_shop";
import { withAdminSession } from "../../lib/session";
import { ShopBasicPage } from "./m10_01_shop";

/** 保存の反映をDBの参照で待つ（最大20秒） */
async function 反映を待つ(want: boolean): Promise<boolean> {
  for (let i = 0; i < 10; i++) {
    if (複数配送か() === want) return true;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return 複数配送か() === want;
}
const 複数配送か = (): boolean => ["t", "true", "1"].includes(String(店舗基本情報を読む()["複数配送"]));

/** DBの参照が want になるまで、画面で切り替えて保存する（保存が反映されないことがあるので、最大3回やり直す） */
async function 画面で合わせる(browser: Browser, want: boolean, what: string): Promise<void> {
  for (let i = 1; i <= 3; i++) {
    if (複数配送か() === want) return;
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      const p = new ShopBasicPage(page);
      await p.open();
      await p.トグルを("複数配送", want);
      await p.押して保存を確かめる(`${what}（${i}回目）`);
    });
    if (await 反映を待つ(want)) return;
  }
  throw new Error(`${what}: 画面で3回保存したが、DBの参照で ${want ? "有効" : "無効"} にならない`);
}

/** 複数配送設定を on/off にする。書き換える前の値（元の値）を返す */
export async function 複数配送を設定する(browser: Browser, on: boolean): Promise<boolean> {
  // 元の値は「無効」（この作業を始めた時点のDBの値。前のケースが戻し損ねても、戻す先はここで決める）
  const orig = false;
  await 画面で合わせる(browser, on, `複数配送設定を${on ? "有効" : "無効"}にする`);
  return orig;
}

/** 元の値へ戻し、DBの参照で元の値と一致することを確かめる */
export async function 複数配送を元へ戻す(browser: Browser, orig: boolean): Promise<void> {
  await 画面で合わせる(browser, orig, "複数配送設定を元の値へ戻す");
}

export { 複数配送か };
