/**
 * F04-02 ご注文方法指定の続き（-f）のシード。実施不可の見直し（review/not_runnable_recheck_cases.tsv）で流せる見込みになった 002・055・057・062・099。
 * 正本: cases/F04-02_seed_data.tsv
 *
 * 型（seeds/f04-02.ts と同じ）: フロントの会員登録 → 管理画面で会員IDを控える → 必要なら管理画面のポイント付与 → 商品をグッズ商品CSV登録で作り、
 * 在庫変更CSV登録で本店・EC-CUBE に入庫して別のメンバーが承認 → 会員でログインして商品をカートに入れ、ご注文方法指定画面を開く（購入処理中の受注ができる）→
 * 管理画面の受注情報検索で受注IDを控える。決め打ちの商品コード・会員のメールの前半には実行の印を付ける。
 *
 * シードでの解釈（正本の外の補い。記録にも書く）:
 * - 002「DBシードで試験会員と商品0件のカートを登録する」: フロントの会員登録で会員を作り、商品を1点カートに入れてから買い物かごを空にして、商品0件のカートにした。
 *   会員ID「F0402-EMPTY-002」は画面が振る番号に読み替えた（ケースは会員IDの値を確かめない）。
 * - 055・057「利用可能ポイント=800」: 画面で指定できない（保有ポイントとは別の値）。管理画面のポイント付与で保有ポイント1000だけを作った。ケースは800を確かめない。
 * - 099「利用可能ポイント=0はDBで確かめ」: 登録したばかりの会員（ポイント付与なし）なので保有0。DB は書き換えない。
 * - 062「銀行振込の手数料に200を入れて登録する」「支払方法ID 999999は未登録」: 支払方法の設定は共有の設定なので書き換えない。銀行振込が表示中であることと、
 *   999999 が未登録であることを DB の参照で確かめ、成り立たなければ止める。手数料は開発環境の値のまま（ケースは変更後の手数料0を確かめる）。
 */
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 処理中受注ID一覧, 表示中の支払方法名 } from "../db/f04_02";
import { 支払方法の設定 } from "../db/f04_02_b";
import { 支払方法IDがあるか } from "../db/f04_02_f";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { 会員を登録して待つ, 商品を作って入庫する, 処理中の受注IDを読む, 本店の店名 } from "../pages/admin/f04_setup";
import { addToCart, clearCart, frontLogin } from "../pages/admin/m04_19_order_shortage";
import { 会員IDを一覧から読む, ポイントを付与する } from "../pages/admin/m05_11_order_edit";
import { ShoppingPage } from "../pages/front/f04_shopping";
import { FrontMember } from "../pages/front/member_entry";

const PASSWORD = "Passw0rd!F0402";

export type 作った状態 = { 会員: FrontMember; 会員ID: string; 受注ID?: string };
const built = new Map<string, 作った状態>();
export function 状態(seedId: string): 作った状態 {
  const s = built.get(seedId);
  if (!s) throw new Error(`${seedId} はまだ作っていない`);
  return s;
}

type 作り方 = { メール: string; 商品コード: string; ポイント?: number; 空のカート?: boolean };

async function 作る({ browser, seed, notes }: SeedCtx, a: 作り方): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const shop = await 本店の店名(browser);
  const m: FrontMember = { 姓: "試験", 名: "太郎", セイ: "シケン", メイ: "タロウ", メール: `${rc(a.メール)}@example.com`, パスワード: PASSWORD };
  await 会員を登録して待つ(browser, m);
  const 会員ID = await withAdminSession(browser, SETUP_ADMIN, (page) => 会員IDを一覧から読む(page, m.メール));
  if (a.ポイント) {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await ポイントを付与する(page, 会員ID, a.ポイント!); });
  }
  const [商品] = await 商品を作って入庫する(browser, seed.シードID, [{ 商品コード: rc(a.商品コード), 商品名: rc(`${a.商品コード}-商品`), 価格: "1000" }], issue);
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await frontLogin(page, m);
    await clearCart(page, () => undefined);
    await addToCart(page, 商品.productId, 1, `${seed.シードID}: ${a.商品コード} をカートに入れる`);
    if (a.空のカート) {
      await clearCart(page, () => undefined);
    } else {
      await new ShoppingPage(page).買い物かごから開く();
    }
  } finally { await context.close(); }
  let 受注ID: string | undefined;
  if (!a.空のカート) {
    受注ID = await withAdminSession(browser, SETUP_ADMIN, (page) => 処理中の受注IDを読む(page, m.メール, shop, seed.シードID));
    if (!処理中受注ID一覧(会員ID).includes(受注ID)) throw new Error(`${seed.シードID}: 受注情報検索で見つけた受注 ${受注ID} が会員の購入処理中の受注に無い`);
  }
  for (const l of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    if (l.includes("会員ID")) notes.set(l, 会員ID);
    else if (l.includes("受注ID") && 受注ID) notes.set(l, 受注ID);
  }
  built.set(seed.シードID, { 会員: m, 会員ID, 受注ID });
}

defineSeed("S-F04-02-EMPTY-CART-002", (c) => 作る(c, { メール: "f0402-empty-002", 商品コード: "F0402-EMPTY-P-002", 空のカート: true }));
defineSeed("S-F04-02-POINT-055", (c) => 作る(c, { メール: "f0402-055", 商品コード: "F0402-POINT-P-055", ポイント: 1000 }));
defineSeed("S-F04-02-POINT-057", (c) => 作る(c, { メール: "f0402-057", 商品コード: "F0402-POINT-P-057", ポイント: 1000 }));
defineSeed("S-F04-02-POINT-ZERO-099", (c) => 作る(c, { メール: "f0402-099", 商品コード: "F0402-099-PROD" }));
defineSeed("S-F04-02-EC-062", async (c) => {
  if (!表示中の支払方法名().includes("銀行振込")) throw new Error("支払方法「銀行振込」が表示中でない（共有の設定は書き換えない）");
  if (支払方法IDがあるか("999999")) throw new Error("支払方法ID 999999 が登録されている（正本は未登録。消さない）");
  const 手数料 = 支払方法の設定("銀行振込").map((p) => p.手数料).join("・");
  reportSeedIssue(c.seed.シードID, `支払方法の設定は共有の設定なので書き換えていない。銀行振込の手数料は開発環境の値（${手数料}）のまま。999999 が未登録であることは DB の参照で確かめた`);
  await 作る(c, { メール: "f0402-062", 商品コード: "F0402-A-062" });
});
