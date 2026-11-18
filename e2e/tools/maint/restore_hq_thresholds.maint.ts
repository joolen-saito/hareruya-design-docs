/**
 * 保守用（ケースではない）。2026-11-18 依頼者指示「元の 980・4800・空 に戻してよい」。
 * 11/18 08:03 ごろ、本店（店舗ID 1）の高額商品閾値が 1000/5000/空 に書き換わっていた（書き換えた流しは不明）。
 * 店舗編集画面から、決まった値 980/4800/空 へ戻し、DB で確かめる（pages/admin/m04_33_return_list.ts の setStoreThresholds）。
 * 戻す相手は店舗ID 1 の閾値の3項目だけ。ほかの項目・店舗には触らない。印は置かない（戻すだけなので）。
 */
import { test, expect } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { withAdminSession } from "../../lib/session";
import { setStoreThresholds } from "../../pages/admin/m04_33_return_list";
import { 店舗の高額商品閾値, 流す前の高額商品閾値 } from "../../db/m04_33";

test("本店の高額商品閾値を決まった値へ戻す", async ({ browser }) => {
  const 前 = 店舗の高額商品閾値("1").join("/");
  console.log(`戻す前: 店舗1=${前}`);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await setStoreThresholds(page, "1", 流す前の高額商品閾値, "保守: 本店の高額商品閾値を 980/4800/空 へ戻す（依頼者指示 2026-11-18）", { 印を置かない: true });
  });
  const 後 = 店舗の高額商品閾値("1").map((x) => (x ?? "").replace(/,/g, "").trim());
  console.log(`戻した後: 店舗1=${後.join("/")}`);
  expect(後).toEqual([...流す前の高額商品閾値]);
});
