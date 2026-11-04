/**
 * F04-03 配送先の新規登録・変更のシード（DBでの準備を含まないもの）。正本: cases/F04-03_seed_data.tsv
 * 型: 商品をグッズ商品CSV登録で作り、在庫検索一覧の在庫編集で本店・EC-CUBE に10入庫して別のメンバーが承認 → フロントで会員登録 →
 * 管理画面で会員IDを控える → フロントにログインしてマイページで配送先を登録（編集リンクの番号を控える）→
 * 本店の商品詳細でカートに入れ、ご注文方法指定画面を開いてお届け先を選ぶ（購入処理中の受注ができる）。
 *
 * シードでの解釈:
 * - 会員のメールはシード表の値（f0403-base-001@example.test など）の前半に実行の印を付け、ドメインは example.com で代えた（印を付けた値の書式は確かめない）。
 * - 会員の氏名はシード表が示さないので「試験 太郎」にした。
 * - 〔注文手続き中ID-…〕は、シード表が「番号そのものは控えない」と言いつつ呼び名を定めているので、管理画面の受注情報検索で見つけた購入処理中の受注の受注IDを控えた。
 */
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { 会員を登録して待つ, 商品を作って入庫する, 作った商品, 本店の店名, 配送先の定め, 処理中の受注IDを読む } from "../pages/admin/f04_setup";
import { addToCart, clearCart, frontLogin } from "../pages/admin/m04_19_order_shortage";
import { 会員IDを一覧から読む } from "../pages/admin/m05_11_order_edit";
import { ShoppingPage } from "../pages/front/f04_shopping";
import { マイページで配送先を足す } from "../pages/front/f04_mypage_delivery";
import { FrontMember } from "../pages/front/member_entry";

const PASSWORD = "Passw0rd!F0403";
type カナ付き = 配送先の定め & { カナ姓?: string; カナ名?: string };

export const 自宅: (名称: string) => カナ付き = (名称) => ({
  配送先名称: 名称, 国: "Japan", 郵便番号: "1000001", 都道府県: "東京都", 住所1: "千代田区千代田", 住所2: "1-1", 住所3: "", 姓: "晴", 名: "太郎", カナ姓: "ハレ", カナ名: "タロウ", 電話: "03-1234-5678",
});
export const 海外確認住所: カナ付き = {
  配送先名称: "海外確認住所-052", 国: "United States", 海外郵便番号: "10001", 住所1: "1 Main St", 住所2: "New York", 住所3: "Apt 5", 姓: "晴", 名: "太郎", 電話: "03-1234-5678",
};

export type 状態 = { 会員: FrontMember; 会員ID: string; 商品: 作った商品; 配送先ID: string };
const built = new Map<string, 状態>();
export function 状態の(seedId: string): 状態 {
  const s = built.get(seedId);
  if (!s) throw new Error(`${seedId} はまだ作っていない`);
  return s;
}

async function 作る({ browser, seed, notes }: SeedCtx, a: { 番号: string; メール: string; 商品コード: string; 配送先?: カナ付き; 選ぶ: boolean; 配送と支払を選ぶ: boolean }): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const shop = await 本店の店名(browser);
  const [商品] = await 商品を作って入庫する(browser, seed.シードID, [{ 商品コード: rc(a.商品コード), 商品名: rc(`${a.商品コード}-商品`), 価格: "1000", 入庫数: 10, 入庫方法: "在庫編集" }], issue);
  const m: FrontMember = { 姓: "試験", 名: "太郎", セイ: "シケン", メイ: "タロウ", メール: `${rc(a.メール)}@example.com`, パスワード: PASSWORD };
  await 会員を登録して待つ(browser, m);
  const 会員ID = await withAdminSession(browser, SETUP_ADMIN, (page) => 会員IDを一覧から読む(page, m.メール));
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  let 配送先ID = "";
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await frontLogin(page, m);
    if (a.配送先) 配送先ID = await マイページで配送先を足す(page, a.配送先, seed.シードID);
    await clearCart(page, () => undefined);
    await addToCart(page, 商品.productId, 1, `${seed.シードID}: 商品をカートに入れる`);
    const sp = new ShoppingPage(page);
    await sp.買い物かごから開く();
    if (a.選ぶ && a.配送先) await sp.お届け先を選ぶ(a.配送先.配送先名称);
    if (a.配送と支払を選ぶ) await 配送と支払を選ぶ(page, "ゆうパック", "銀行振込", issue);
  } finally {
    await context.close();
  }
  const 受注ID = await withAdminSession(browser, SETUP_ADMIN, (page) => 処理中の受注IDを読む(page, m.メール, shop, seed.シードID));
  for (const l of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    if (l.includes("…")) continue;
    if (l.includes("会員ID")) notes.set(l, 会員ID);
    else if (l.includes("商品ID")) notes.set(l, 商品.productId);
    else if (l.includes("配送先ID") && 配送先ID) notes.set(l, 配送先ID);
    else if (l.includes("注文手続き中ID")) notes.set(l, 受注ID);
  }
  built.set(seed.シードID, { 会員: m, 会員ID, 商品, 配送先ID });
}

async function 配送と支払を選ぶ(page: import("@playwright/test").Page, 配送: string, 支払: string, issue: (m: string) => void): Promise<void> {
  const dsel = 'input[name="_shopping_order[Shippings][0][Delivery]"]';
  const d = page.locator(dsel).filter({ has: page.locator("xpath=self::*") });
  void d;
  const pick = async (sel: string, label: string) => {
    const c = page.locator(sel);
    const items = await c.evaluateAll((ns) => ns.map((n) => ({ v: (n as HTMLInputElement).value, checked: (n as HTMLInputElement).checked, t: ((n as HTMLInputElement).closest("label")?.textContent ?? "").replace(/\s+/g, " ").trim() })));
    let hit = items.find((i) => i.t === label);
    if (!hit && items.length > 0) {
      hit = items[0];
      issue(`「${label}」の選択肢が無い（${items.map((i) => i.t).join("、")}）。海外のお届け先で選べる先頭の「${hit.t}」で代えた（ケースは配送方法・支払方法を確かめない）`);
    }
    if (!hit) throw new Error(`「${label}」の選択肢が無い（${items.map((i) => i.t).join("、")}）`);
    if (!hit.checked) {
      await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), page.locator(`${sel}[value="${hit.v}"]`).check({ force: true })]);
      await page.waitForLoadState("load");
    }
  };
  await pick(dsel, 配送);
  await pick('input[name="_shopping_order[Payment]"]', 支払);
}

defineSeed("S-F04-03-REF", async () => { /* 国・都道府県の初期マスタと郵便番号の自動補完は、試験環境にあるものを使う（画面で作らない） */ });
for (const n of ["001", "024", "046"]) {
  defineSeed(`S-F04-03-BASE-${n}`, { needs: ["S-F04-03-REF"] }, (c) => 作る(c, {
    番号: n, メール: `f0403-base-${n}`, 商品コード: `F0403-P-BASE-${n}`,
    配送先: 自宅(n === "046" ? "F0403-046-自宅住所" : `自宅住所-${n}`), 選ぶ: true, 配送と支払を選ぶ: n === "001",
  }));
}
defineSeed("S-F04-03-DP-OVS-052", { needs: ["S-F04-03-REF"] }, (c) => 作る(c, {
  番号: "052", メール: "dpf0403-ovs-052", 商品コード: "F0403-P-DP-OVS-052", 配送先: 海外確認住所, 選ぶ: true, 配送と支払を選ぶ: true,
}));

// 配送先登録上限は、アプリの既定が20件（シード表の「20件にする」と同じ）。変更の画面は無いので、既定のまま使う
defineSeed("S-F04-03-LIMIT", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "配送先登録上限を画面で設定する場所が無い。アプリの既定値が20件（設定ファイル）で、シード表の定めと同じなので、そのまま使った");
});
defineSeed("S-F04-03-CBNEW-057", { needs: ["S-F04-03-REF", "S-F04-03-LIMIT"] }, (c) => 作る(c, {
  番号: "057", メール: "cbf0403-new-057", 商品コード: "CBF0403-P-057", 選ぶ: false, 配送と支払を選ぶ: true,
}));
defineSeed("S-F04-03-CBOPENNEW-062", { needs: ["S-F04-03-REF", "S-F04-03-LIMIT"] }, (c) => 作る(c, {
  番号: "062", メール: "cbf0403-open-062", 商品コード: "CBF0403-P-062", 選ぶ: false, 配送と支払を選ぶ: true,
}));
defineSeed("S-F04-03-CBOPENCHG-063", { needs: ["S-F04-03-REF", "S-F04-03-LIMIT"] }, (c) => 作る(c, {
  番号: "063", メール: "cbf0403-open-063", 商品コード: "CBF0403-P-063", 配送先: 自宅("変更表示住所CBF0403-063"), 選ぶ: true, 配送と支払を選ぶ: true,
}));
