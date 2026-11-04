/**
 * F04-02 複数配送のシード（007・008・095）。作り方の型は seeds/f04-02.ts と同じで、さらにフロントのマイページで配送先を足す。
 * 「複数配送設定」の切り替え（S-F04-02-MULTI-SETTING）は共有の設定で、ケースの開始時に spec が行い、終わりに元へ戻す（pages/admin/f04_multi_shipping.ts）。
 * 会員の配送先は、会員登録時に自動で作られる既定のお届け先のほかに、マイページで足す（正本は「配送先2件」＝既定を含めた件数ではなく、足す操作の回数が 2 回と定めている）。
 */
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 処理中受注ID一覧 } from "../db/f04_02";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { 会員を登録して待つ, 商品を作って入庫する, 処理中の受注IDを読む, 本店の店名 } from "../pages/admin/f04_setup";
import { addToCart, clearCart, frontLogin } from "../pages/admin/m04_19_order_shortage";
import { 会員IDを一覧から読む } from "../pages/admin/m05_11_order_edit";
import { マイページで配送先を足す } from "../pages/front/f04_mypage_delivery";
import { ShoppingPage } from "../pages/front/f04_shopping";
import { FrontMember } from "../pages/front/member_entry";

export type 複数配送の状態 = { 会員: FrontMember; 会員ID: string; 受注ID: string };
const built = new Map<string, 複数配送の状態>();
export function 複数配送の状態の(seedId: string): 複数配送の状態 {
  const s = built.get(seedId);
  if (!s) throw new Error(`${seedId} はまだ作っていない`);
  return s;
}

async function 作る({ browser, seed, notes }: SeedCtx, a: { メール: string; 商品コード: string; 足す回数: number; 開かない?: boolean; 名?: string }): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const shop = await 本店の店名(browser);
  const m: FrontMember = { 姓: "試験", 名: a.名 ?? "太郎", セイ: "シケン", メイ: "タロウ", メール: `${rc(a.メール)}@example.com`, パスワード: "Passw0rd!F0402" };
  await 会員を登録して待つ(browser, m);
  const 会員ID = await withAdminSession(browser, SETUP_ADMIN, (page) => 会員IDを一覧から読む(page, m.メール));
  const [商品] = await 商品を作って入庫する(browser, seed.シードID, [{ 商品コード: rc(a.商品コード), 商品名: rc(`${a.商品コード}-商品`), 価格: "1000" }], issue);
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await frontLogin(page, m);
    for (let i = 1; i <= a.足す回数; i++) {
      await マイページで配送先を足す(page, { 配送先名称: `配送先${i}`, 国: "Japan", 郵便番号: "1500001", 都道府県: "東京都", 住所1: "渋谷区神宮前", 住所2: `${i}-${i}`, 姓: "晴", 名: "太郎", 電話: "03-1111-2222" }, seed.シードID);
    }
    await clearCart(page, () => undefined);
    await addToCart(page, 商品.productId, 1, `${seed.シードID}: 商品をカートに入れる`);
    if (!a.開かない) await new ShoppingPage(page).買い物かごから開く();
  } finally {
    await context.close();
  }
  let 受注ID = "";
  if (!a.開かない) {
    受注ID = await withAdminSession(browser, SETUP_ADMIN, (page) => 処理中の受注IDを読む(page, m.メール, shop, seed.シードID));
    if (!処理中受注ID一覧(会員ID).includes(受注ID)) throw new Error(`${seed.シードID}: 見つけた受注が会員の購入処理中の受注に無い`);
  }
  for (const l of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    if (l.includes("…")) continue;
    if (l.includes("会員ID")) notes.set(l, 会員ID);
    else if (l.includes("受注ID")) notes.set(l, 受注ID);
  }
  built.set(seed.シードID, { 会員: m, 会員ID, 受注ID });
}

defineSeed("S-F04-02-MULTI-SETTING", async () => { /* 切り替えは spec がケースの開始時に行い、終わりに元へ戻す */ });
defineSeed("S-F04-02-MULTI-OFF-007", (c) => 作る(c, { メール: "f0402-007", 商品コード: "F0402-MULTI-OFF-P-007", 足す回数: 2 }));
defineSeed("S-F04-02-MULTI-ON-008", (c) => 作る(c, { メール: "f0402-008", 商品コード: "F0402-MULTI-ON-P-008", 足す回数: 2 }));
defineSeed("S-F04-02-MULTI-ONE-095", (c) => 作る(c, { メール: "f0402-095", 商品コード: "F0402-095-PROD", 足す回数: 1 }));

// 処理中の受注を作らない（ご注文方法指定画面を開かない）シード。会員の氏名の名にケース専用の値を入れる
const 開かない: [string, string, number][] = [["CBMEMBEROFF1-166", "166", 1], ["CBMEMBERON1-173", "173", 1], ["CBMEMBERONN-174", "174", 2], ["CBMEMBEROFFN-175", "175", 2]];
for (const [id, n, 回数] of 開かない) {
  defineSeed(`S-F04-02-${id}`, (c) => 作る(c, { メール: `cbf0402-${n}`, 商品コード: `F0402-CB${n}-P`, 足す回数: 回数, 開かない: true, 名: `F0402-CB${n}` }));
}
