/**
 * M03-04 グッズ商品CSV出力の画面シード。正本: cases/M03-04_seed_data.tsv
 *
 * 作るシード: ADM・SESSION-011・NOTFOUND-016（ケース 011・016 が使う）。
 *
 * 作らないシード（実装しないケースだけが使う）:
 * - S-M03-04-MASTER（参照マスターと店舗・在庫場所を「DBシードで」登録する）。011・016 以外のケースはすべてこれを使う
 * - MASTER を使うケース専用の商品シード（RICH-001 ほか）・CONFIG・FORMAT-*（CONFIG を使うケースは MASTER も使う）
 */
import { expect } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { storeNameById } from "../pages/admin/m04_19_masters";
import { ensureMember } from "../pages/admin/member";
import { ProductSearchPage } from "../pages/admin/product_search";

export const M0304_ADMIN: Account = { loginId: "m0304_admin", password: "Passw0rd!M0304" };

/** アプリが本店（親店舗）として扱う店舗ID（正本: 所属先=本店） */
const MAIN_SHOP_ID = "1";

defineSeed("S-M03-04-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const shop = await storeNameById(page, MAIN_SHOP_ID);
    await ensureMember(page, {
      名前: "M03-04試験管理者", 所属店舗: shop, ログインID: M0304_ADMIN.loginId, メールアドレス: "m0304_admin@example.test",
      パスワード: M0304_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
    });
  });
  // ログインでき、商品管理（商品一覧）を操作できること（ケースのセッションとは別。ケースの「商品一覧画面は未訪問」を崩さない）
  await withAdminSession(browser, M0304_ADMIN, async (page) => {
    await new ProductSearchPage(page).open();
  });
});

/**
 * 正本の作り方「新しいブラウザプロファイルを用意し、商品一覧画面を開く前にM03-04試験管理者でログインする」は、
 * ケースのブラウザの状態そのもの。Playwright はケースごとに新しいブラウザの状態（クッキー・保存領域が空）を用意するので、
 * ここでは何も作らず、ケースの初めにログインだけを行う（spec の IT-M03-04-011）。
 */
defineSeed("S-M03-04-SESSION-011", { needs: ["S-M03-04-ADM"] }, async () => {});

defineSeed("S-M03-04-NOTFOUND-016", { needs: ["S-M03-04-ADM"] }, async ({ browser }) => {
  await withAdminSession(browser, M0304_ADMIN, async (page) => {
    const search = new ProductSearchPage(page);
    await search.open();
    await search.ensureDetailVisible();
    // 公開状態などほかの条件で絞り込まれないように: 公開状態はすべて選び、既定で入っている状態（NM）・高額商品（除外する）の絞り込みを外す
    for (const option of await search.choiceOptions("status")) await search.setChecked("status", option.value, true);
    for (const field of ["card_condition", "expensive"]) {
      for (const option of await search.choiceOptions(field)) if (option.checked) await search.setChecked(field, option.value, false);
      await expect.poll(() => search.checkedValues(field), `${field} の絞り込みを外す`).toEqual([]);
    }
    await search.field("product_id").fill("999999016");
    await search.submitAndWaitForResult();
    const rows = await page.locator('tr[id^="ex-product-"]').count();
    // 正本は行があれば削除するが、未登録の前提で作っている。あれば消さずに止める
    if (rows > 0) throw new Error(`商品ID 999999016 が商品一覧に ${rows} 件ある。削除の操作は実装していないので止めた`);
    await expect(page.getByText("検索条件に合致するデータが見つかりませんでした"), "商品ID 999999016 の検索結果が0件").toBeVisible();
  });
});
