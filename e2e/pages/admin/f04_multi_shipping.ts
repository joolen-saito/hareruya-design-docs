/**
 * F04-02 の複数配送設定（店舗基本設定。共有の設定＝店舗ID 1）を、ケースの開始時に有効・無効にし、終わったら元の値へ戻す。
 * 元の値は、書き換える前に DB の参照で控え、戻したあとに DB の参照で一致を確かめる。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { 店舗基本情報を読む } from "../../db/m10_01_shop";
import { withAdminSession } from "../../lib/session";
import { ShopBasicPage } from "./m10_01_shop";

const 複数配送か = (): boolean => ["t", "true", "1"].includes(String(店舗基本情報を読む()["複数配送"]));

/** 複数配送設定を on/off にする。書き換える前の値（元の値）を返す */
export async function 複数配送を設定する(browser: Browser, on: boolean): Promise<boolean> {
  const orig = 複数配送か();
  if (orig !== on) {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      const p = new ShopBasicPage(page);
      await p.open();
      await p.トグルを("複数配送", on);
      await p.押して保存を確かめる(`複数配送設定を${on ? "有効" : "無効"}にする`);
    });
  }
  if (複数配送か() !== on) throw new Error(`複数配送設定を${on ? "有効" : "無効"}にしたが、DBの参照で反映されていない`);
  return orig;
}

/** 元の値へ戻し、DBの参照で元の値と一致することを確かめる */
export async function 複数配送を元へ戻す(browser: Browser, orig: boolean): Promise<void> {
  if (複数配送か() !== orig) {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      const p = new ShopBasicPage(page);
      await p.open();
      await p.トグルを("複数配送", orig);
      await p.押して保存を確かめる("複数配送設定を元の値へ戻す");
    });
  }
  if (複数配送か() !== orig) throw new Error("複数配送設定を元の値へ戻したが、DBの参照で元の値と一致しない");
}

export { 複数配送か };
