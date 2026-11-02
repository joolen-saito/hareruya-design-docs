/** M05-11 受注情報編集のシード（任意項目に初期値を入れておくもの）。型は seeds/m05-11-c.ts と同じ */
import { OrderEditPage } from "../pages/admin/m05_11_order_edit";
import { 購入直後のシード } from "./m05-11";

購入直後のシード("S-M05-11-BASE-060", "060", "m0511-060", {
  後処理: async (page, no, { 店 }) => {
    const p = new OrderEditPage(page);
    await p.openByOrderNo(no, 店);
    await p.両方に入れる([
      ["kana_kana01", "シケンセイ"], ["kana_kana02", "シケンメイ"], ["postalCode_postalCode01", "123"], ["postalCode_postalCode02", "4567"],
      ["abroad_postal_code", "12345"], ["address_addr03", "千代田3"], ["fax_fax01", "03"], ["fax_fax02", "1234"], ["fax_fax03", "5679"],
    ]);
    await page.locator("#order_company_name").fill("試験会社", { timeout: 20_000 });
    await p.問い合わせ.fill("初期問い合わせ", { timeout: 20_000 });
    await page.locator("#order_Shipping_shipping_delivery_date").fill("2026-12-01", { timeout: 20_000 });
    const time = page.locator("#order_Shipping_DeliveryTime");
    if ((await time.locator("option").count()) > 1) await time.selectOption({ index: 1 }, { timeout: 20_000 });
    await page.locator("#order_invoiceNumber").fill("SLIP-001", { timeout: 20_000 });
    await p.受注情報を登録する(() => undefined);
  },
});
