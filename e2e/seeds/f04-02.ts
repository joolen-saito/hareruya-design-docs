/**
 * F04-02 ご注文方法指定のシード。正本: cases/F04-02_seed_data.tsv
 *
 * 作るのは、DBでの準備も共有の設定の書き換えも含まないシードだけ。
 * 型: フロントの会員登録（本登録のメールは手元の受け口で読む）→ 管理画面で会員IDを控える → 必要ならお届け先を管理画面で足す →
 * 商品をグッズ商品CSV登録で作り、在庫変更CSV登録で本店・EC-CUBEに入庫して別のメンバーが承認 →
 * その会員でフロントにログインして商品を数量nでカートに入れ、必要ならご注文方法指定画面を開く（購入処理中の受注ができる）→
 * 管理画面の受注情報検索（対応状況は全ステータス）で受注IDを控える。
 *
 * シードでの解釈:
 * - 決め打ちの商品コード・商品名・会員のメール前半には実行ごとの印を付ける（依頼者決定 2026-10-28）。
 * - 会員の登録は国内住所（東京都千代田区）で行う。正本が海外の会員を求めるシード（044）でも、ケースが会員情報の住所を確かめないので国内で代えた。
 * - お届け先の氏名・住所などの「ケース専用の値」は、ケースが示す値があればそれ、無ければ勤務先の値（晴 太郎・渋谷区神宮前）を使う。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 処理中受注ID一覧 } from "../db/f04_02";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { 会員を登録して待つ, 会員のお届け先を足す, 商品の定め, 商品を作って入庫する, 作った商品, 本店の店名, 配送先の定め } from "../pages/admin/f04_setup";
import { addToCart, clearCart, frontLogin } from "../pages/admin/m04_19_order_shortage";
import { 会員IDを一覧から読む, } from "../pages/admin/m05_11_order_edit";
import { 処理中の受注IDを読む } from "../pages/admin/f04_setup";
import { ShoppingPage } from "../pages/front/f04_shopping";
import { FrontMember } from "../pages/front/member_entry";

const PASSWORD = "Passw0rd!F0402";

/** 勤務先のお届け先（正本 EC-012 が示す値。ほかの勤務先のシードも同じ値にする） */
export const 勤務先: 配送先の定め = {
  配送先名称: "勤務先", 国: "Japan", 郵便番号: "1500001", 都道府県: "東京都", 住所1: "渋谷区神宮前", 住所2: "2-2", 住所3: "第3ビル", 姓: "晴", 名: "太郎", 電話: "0311112222",
};

export type 作った状態 = { 会員: FrontMember; 会員ID: string; 商品: 作った商品[]; 受注ID?: string };
/** シードIDごとに、作ったものを spec が引けるようにする */
const built = new Map<string, 作った状態>();
export function 状態(seedId: string): 作った状態 {
  const s = built.get(seedId);
  if (!s) throw new Error(`${seedId} はまだ作っていない`);
  return s;
}

type 商品の指定 = { 商品コード: string; 商品名?: string; 価格?: string; 数量: number; 言語?: "英語" };
type 作り方 = {
  /** 会員のメールの前半（正本の値。印を付ける） */
  メール: string;
  お届け先?: 配送先の定め[];
  商品: 商品の指定[];
  /** カートに入れたあと、ご注文方法指定画面を開く（購入処理中の受注ができる）。開いた直後に選ぶお届け先 */
  開く?: { お届け先を選ぶ?: string };
  /** カートに入れず、会員登録だけ */
  カートなし?: boolean;
  /** 会員にログインせず匿名のカートに入れる */
  匿名?: boolean;
};

async function 作る({ browser, seed, notes }: SeedCtx, a: 作り方): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const shop = await 本店の店名(browser);
  const m: FrontMember = { 姓: "試験", 名: "太郎", セイ: "シケン", メイ: "タロウ", メール: `${rc(a.メール)}@example.com`, パスワード: PASSWORD };
  let 会員ID = "";
  if (!a.匿名) {
    await 会員を登録して待つ(browser, m);
    会員ID = await withAdminSession(browser, SETUP_ADMIN, (page) => 会員IDを一覧から読む(page, m.メール));
    if (a.お届け先?.length) {
      await withAdminSession(browser, SETUP_ADMIN, async (page) => {
        for (const d of a.お届け先!) await 会員のお届け先を足す(page, 会員ID, d, seed.シードID);
      });
    }
  }
  const defs: 商品の定め[] = a.商品.map((p) => ({ 商品コード: rc(p.商品コード), 商品名: rc(p.商品名 ?? `${p.商品コード}-商品`), 価格: p.価格 ?? "1000", 言語: p.言語 }));
  const 商品 = await 商品を作って入庫する(browser, seed.シードID, defs, issue);
  let 受注ID: string | undefined;
  if (!a.カートなし) {
    const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(context);
      const page = await context.newPage();
      page.setDefaultTimeout(60_000);
      if (!a.匿名) {
        await frontLogin(page, m);
        await clearCart(page, () => undefined);
      }
      for (const [i, p] of a.商品.entries()) await addToCart(page, 商品[i].productId, p.数量, `${seed.シードID}: ${p.商品コード} をカートに入れる`);
      if (a.開く) {
        const sp = new ShoppingPage(page);
        await sp.買い物かごから開く();
        if (a.開く.お届け先を選ぶ) await sp.お届け先を選ぶ(a.開く.お届け先を選ぶ);
      }
    } finally {
      await context.close();
    }
    if (a.開く) {
      受注ID = await withAdminSession(browser, SETUP_ADMIN, (page) => 処理中の受注IDを読む(page, m.メール, shop, seed.シードID));
      if (!処理中受注ID一覧(会員ID).includes(受注ID)) throw new Error(`${seed.シードID}: 受注情報検索で見つけた受注 ${受注ID} が会員の購入処理中の受注に無い`);
    }
  }
  控える(notes, seed["状態・属性"] + seed.投入方法, 会員ID, 受注ID);
  built.set(seed.シードID, { 会員: m, 会員ID, 商品, 受注ID });
}

function 控える(notes: Notes, text: string, 会員ID: string, 受注ID?: string): void {
  for (const l of Notes.labelsIn(text)) {
    if (l.includes("…")) continue;
    if (l.includes("会員ID")) notes.set(l, 会員ID);
    else if (l.includes("受注ID")) {
      if (!受注ID) throw new Error(`${l} を控える受注が無い`);
      notes.set(l, 受注ID);
    }
  }
}


/** 勤務先を持ち、商品1点で注文方法指定画面を開いた状態（EC-012 など） */
const 勤務先で開いた = (n: string): 作り方 => ({ メール: `f0402-${n}`, お届け先: [勤務先], 商品: [{ 商品コード: `F0402-A-${n}`, 数量: 1 }], 開く: {} });

defineSeed("S-F04-02-NO-CART-001", (c) => 作る(c, { メール: "f0402-001", 商品: [], カートなし: true }));
defineSeed("S-F04-02-GUEST-UNREGISTERED-003", (c) => 作る(c, { メール: "f0402-003", 商品: [{ 商品コード: "F0402-GUEST-003", 数量: 1 }], 匿名: true }));
for (const n of ["012", "014", "015", "016", "017", "018", "045"]) {
  defineSeed(`S-F04-02-EC-${n}`, (c) => 作る(c, n === "045"
    ? { メール: `f0402-${n}`, お届け先: [勤務先], 商品: [{ 商品コード: `F0402-A-${n}`, 数量: 1 }], 開く: { お届け先を選ぶ: "勤務先" } }
    : 勤務先で開いた(n)));
}
for (const n of ["030", "066", "072"]) {
  defineSeed(`S-F04-02-EC-${n}`, (c) => 作る(c, { メール: `f0402-${n}`, 商品: [{ 商品コード: `F0402-A-${n}`, 数量: 1 }], 開く: {} }));
}
defineSeed("S-F04-02-BUNDLE-NONE-027", (c) => 作る(c, { メール: "f0402-027", 商品: [{ 商品コード: "F0402-BUNDLE-NONE-P-027", 数量: 1 }] }));
defineSeed("S-F04-02-ITEMS-083", (c) => 作る(c, {
  メール: "f0402-083",
  商品: [{ 商品コード: "F0402-083-PRODA", 商品名: "F0402-083-NAMEA", 価格: "1100", 数量: 2 }, { 商品コード: "F0402-083-PRODB", 商品名: "F0402-083-NAMEB", 価格: "550", 数量: 3, 言語: "英語" }],
}));
defineSeed("S-F04-02-ORDER-EXIST-098", async (c) => {
  await 作る(c, { メール: "f0402-098", 商品: [{ 商品コード: "F0402-098-PROD", 数量: 1 }], 開く: {} });
});
defineSeed("S-F04-02-OVERSEAS-044", (c) => 作る(c, {
  メール: "f0402-044",
  お届け先: [{ 配送先名称: "海外倉庫", 国: "United States", 海外郵便番号: "SW1A 1AA", 住所1: "10 Downing St", 住所2: "London", 住所3: "Floor 3", 姓: "Taro", 名: "Hare", 電話: "0311112222" }],
  商品: [{ 商品コード: "F0402-OVERSEAS-P-044", 数量: 1 }], 開く: {},
}));
