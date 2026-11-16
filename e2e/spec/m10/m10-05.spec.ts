/**
 * M10-05 送料無料条件（本店の店舗基本設定を書き換えて、買い物かごの案内を確かめる）。正本: cases/M10-05_test_cases.tsv
 * 本店の店舗基本設定は共有の設定。シードが書き換える前の全項目を控えて基盤へ登録し、ケースの終わりに画面から元の値へ戻して確かめる。
 * 実装: 001〜005・015〜019。実装しない: 006〜014（受注の送料。宅配便の都道府県別の送料表を作り直す必要があり、共有の配送方法を元のとおりには戻せない）。
 * 手順の注記: 買い物かごの案内は、金額条件があるときだけ表示される画面の作り。個数条件の案内文は画面に無い。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { ShopBasicPage } from "../../pages/admin/m10_01_shop";
import { CartPage } from "../../pages/front/f04_01_cart";
import { M1005L_ADMIN, 会員の } from "../../seeds/m10-05";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 送料無料です = "現在送料無料です。";

type 検査 = [名前: string, 実際: (案内: string, 文: string) => unknown, 期待: unknown][];
const 不足の案内 = (文: string) => /あと|不足/.test(文);
const 個数不足の案内 = (文: string) => /6\s*個/.test(文);

/**
 * 001〜005: 管理画面で送料無料条件を書き換える → 画面で確かめる → 会員Aの別のブラウザセッションで買い物かごを見る。
 * 手順5の「別ブラウザセッション」は、ケースの画面のブラウザの Cookie をすべて消して（管理者のセッションを捨てて）から会員Aでログインする。
 * 別の Playwright のブラウザセッションを開くと、エビデンスにケースの画面（管理画面）しか写らず、買い物かごが1枚も残らなかった（2026-11-13 の見直し）。
 * 期待結果は買い物かごの画面の部品（送料無料の案内・集計欄）で確かめ、確かめた所を画面に印として残す。
 */
function 連携(番号: string, 入力: { 金額?: string; 数量?: string }, 確かめ: (cart: CartPage) => Promise<void>) {
  return async (ctx: CaseCtx): Promise<void> => {
    const { page, step, expected } = ctx;
    await loginAdmin(page, M1005L_ADMIN);
    const p = new ShopBasicPage(page);
    const cart = new CartPage(page);
    await step(1, async () => { await p.open(); });
    await step(2, async () => {
      if (入力.金額 !== undefined) await p.入れる("送料無料条件(金額)", 入力.金額);
      if (入力.数量 !== undefined) await p.入れる("送料無料条件(数量)", 入力.数量);
    });
    await step(3, async () => { await p.押して保存を確かめる(`IT-M10-05-${番号} 店舗基本設定の保存`); });
    await step(4, async () => {
      await p.open();
      if (入力.金額 !== undefined) expect.soft((await p.値("送料無料条件(金額)")).replace(/,/g, ""), "保存後の送料無料条件(金額)").toBe(入力.金額);
      if (入力.数量 !== undefined) expect.soft((await p.値("送料無料条件(数量)")).replace(/,/g, ""), "保存後の送料無料条件(数量)").toBe(入力.数量);
    });
    await step(5, async () => {
      note("手順5の別ブラウザセッション: 管理画面のセッションの Cookie をすべて消し、新しいセッションとして会員Aで本店にログインした");
      await page.context().clearCookies();
      await frontLogin(page, 会員の(番号));
    });
    await step(6, async () => {
      await cart.開く();
      await expect(cart.集計欄, "買い物かご画面の集計欄が表示される").toBeVisible();
      note(`買い物かごの集計欄: ${await cart.集計欄の文()}`);
    });
    await expected(async () => {
      await expect(cart.集計欄, "買い物かご画面の集計欄").toBeVisible();
      await 確かめ(cart);
    });
  };
}

const 送料無料です_の案内が出ない = (cart: CartPage) => expect.soft(cart.集計欄, "「現在送料無料です。」は表示されない").not.toContainText(送料無料です);
const 不足額6000円の案内 = async (cart: CartPage) => {
  await expect.soft(cart.送料無料の案内, "送料無料金額10,000円と合計4,000円の差額6,000円が不足額として案内される").toContainText(/(あと|不足)[^0-9]*6,000/);
  await expect.soft(cart.集計欄, "買い物かごの合計（税込）が4,000円").toContainText(/合計[\s\S]*4,000/);
  await 送料無料です_の案内が出ない(cart);
};

caseTest("IT-M10-05-001", 連携("001", { 金額: "3000" }, async (cart) => {
  await expect.soft(cart.送料無料の案内, "買い物かごに「現在送料無料です。」が表示される").toContainText(送料無料です);
  await expect.soft(cart.集計欄, "送料無料までの不足額の案内は表示されない").not.toContainText(/あと|不足/);
}));
caseTest("IT-M10-05-002", 連携("002", { 金額: "10000" }, 不足額6000円の案内));
caseTest("IT-M10-05-003", 連携("003", { 数量: "3" }, async (cart) => {
  await expect.soft(cart.送料無料の案内, "合計個数3が送料無料個数3以上なので、買い物かごに「現在送料無料です。」が表示される").toContainText(送料無料です);
  await expect.soft(cart.集計欄, "送料無料までの不足額の案内は表示されない").not.toContainText(/あと|不足/);
}));
caseTest("IT-M10-05-004", 連携("004", { 金額: "", 数量: "" }, async (cart) => {
  await expect.soft(cart.送料無料の案内, "送料無料の案内の欄が表示されない").toHaveCount(0);
  await 送料無料です_の案内が出ない(cart);
  await expect.soft(cart.集計欄, "送料無料までの不足額の案内は表示されない").not.toContainText(/あと|不足/);
}));
caseTest("IT-M10-05-005", 連携("005", { 数量: "5" }, 不足額6000円の案内));

/** 015〜019: 店舗基本設定はシードで書き換え済み。会員Aでログインしてカートに入れた状態の買い物かごを見る */
function かご(番号: string, 確かめ: 検査) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const cart = new CartPage(page);
    let 案内 = ""; let 文 = "";
    await step(1, async () => { await frontLogin(page, 会員の(番号)); });
    await step(2, async () => {
      // 商品Aを数量4でカートに入れる操作は、同じ内容をシードで先に行ってある。ここではカートに入っている数量を確かめる
      await cart.開く();
      const ids = await cart.行の商品規格ID();
      expect.soft(ids.length, "カートに入っている商品A（1明細）").toBe(1);
      if (ids.length === 1) expect.soft(await cart.数量(ids[0]), "商品Aの数量").toBe("4");
    });
    await step(3, async () => {
      await cart.開く();
      await expect(cart.集計欄, "買い物かごの集計欄").toBeVisible();
      案内 = await cart.テキスト(cart.送料無料の案内); 文 = await cart.集計欄の文(); note(`買い物かごの集計欄: ${文}`);
    });
    await expected(async () => {
      for (const [名前, 実際, 期待] of 確かめ) expect.soft(実際(案内, 文), 名前).toEqual(期待);
    });
  };
}
const 送料無料の表示: 検査 = [["「現在送料無料」が表示される", (_a, 文) => 文.includes("現在送料無料"), true], ["送料無料までの不足の案内は表示されない", (_a, 文) => 不足の案内(文), false]];
caseTest("IT-M10-05-015", かご("015", [
  ["送料無料個数10と合計個数4の差の6個が不足個数として案内される", (_a, 文) => 個数不足の案内(文), true],
  ["金額の不足額の案内は表示されない", (案内) => 案内.includes("円"), false], ["「現在送料無料」は表示されない", (_a, 文) => 文.includes("現在送料無料"), false]]));
caseTest("IT-M10-05-016", かご("016", 送料無料の表示));
caseTest("IT-M10-05-017", かご("017", [
  ["送料無料金額10,000円と合計4,000円の差額6,000円の不足額", (案内) => 案内.includes("6,000"), true],
  ["送料無料個数10と合計個数4の差の6個の不足個数が併記される", (_a, 文) => 個数不足の案内(文), true], ["「現在送料無料」は表示されない", (_a, 文) => 文.includes("現在送料無料"), false]]));
caseTest("IT-M10-05-018", かご("018", 送料無料の表示));
caseTest("IT-M10-05-019", かご("019", 送料無料の表示));
