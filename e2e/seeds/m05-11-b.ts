/** M05-11 受注情報編集のシード（問い合わせを初期値にしてから使うもの）。型は seeds/m05-11.ts と同じ */
import { 購入直後のシード } from "./m05-11";
import { OrderEditPage } from "../pages/admin/m05_11_order_edit";
import { 店舗Aの店名 } from "./m05-11";

/** 受注情報編集画面で問い合わせを「初期問い合わせ」にして「受注情報を登録」を押す（シード表: 問い合わせ=初期問い合わせ） */
async function 問い合わせを初期値にする(page: import("@playwright/test").Page, 注文番号: string, 店: string): Promise<void> {
  const p = new OrderEditPage(page);
  await p.openByOrderNo(注文番号, 店);
  await p.注文者情報を開く();
  await p.問い合わせ.fill("初期問い合わせ");
  await p.受注情報を登録する(() => undefined);
}

購入直後のシード("S-M05-11-BASE-069", "069", "m0511-069", {
  後処理: async (page, no) => 問い合わせを初期値にする(page, no, await 店舗Aの店名(page.context().browser()!)),
});
購入直後のシード("S-M05-11-LIM-118", "118", "m0511-118", {
  後処理: async (page, no) => 問い合わせを初期値にする(page, no, await 店舗Aの店名(page.context().browser()!)),
});
