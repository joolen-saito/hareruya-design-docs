/**
 * F04-02 同梱の表示・国外配送の選択肢・支店の配送方法のシード（026・028・084・100・101・142〜153）。正本: cases/F04-02_seed_data.tsv
 *
 * これらのシードはシード表上「共有の設定（配送方法・支払方法の表示・紐付け）」を書き換えると書かれているが、ケースが確かめる「同梱の表示」の前提
 * （支払方法が表示中・ゆうパックと同梱に必要な支払方法が紐付いている）は手元で既に成り立つので、設定は書き換えない。
 * 前提はDBの参照で確かめ、成り立たなければシードを止める。書き換えないので元へ戻す操作は無い。
 *
 * シードでの解釈:
 * - 既存受注は、フロントで注文を確定し（支払方法は銀行振込・郵便振替・店頭支払のうち目的のもの。目的がそれ以外ならまず銀行振込で確定）、
 *   管理画面の受注情報編集で支払方法と対応状況を目的のものにして登録する。支店（大阪）の注文は店頭支払で確定する。
 * - 国外配送の 142〜153 の「EMS・Small packet の支払方法に銀行振込を選ぶ」は、ケースが確かめないので書き換えない。
 * - 決め打ちの商品コード・会員のメール前半には実行ごとの印を付ける。
 */
import { Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 会員の最新の受注ID, 受注の支払方法, 配送方法の支払方法名 } from "../db/f04_02_b";
import { 表示中の支払方法名 } from "../db/f04_02";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { F04大阪承認者, F04大阪登録者, 会員を登録して待つ, 会員のお届け先を足す, 商品を作って入庫する, 大阪の店名, 大阪の店舗ページ, 大阪の管理者を用意する, 本店の店名 } from "../pages/admin/f04_setup";
import { 受注を開く, 受注を開き直す, ステータスを変える } from "../pages/admin/f06_07_order";
import { addToCart, clearCart, frontLogin } from "../pages/admin/m04_19_order_shortage";
import { 会員IDを一覧から読む } from "../pages/admin/m05_11_order_edit";
import { 注文を確定する } from "../pages/front/f04_order_flow";
import { カートに入れる } from "../pages/front/f04_shopping";
import { FrontMember } from "../pages/front/member_entry";

export type 同梱の状態 = { 会員: FrontMember; 会員ID: string; 既存受注: Record<string, string>; 商品ID: string; 店舗ページ: string };
const built = new Map<string, 同梱の状態>();
export function 同梱の状態の(seedId: string): 同梱の状態 {
  const s = built.get(seedId);
  if (!s) throw new Error(`${seedId} はまだ作っていない`);
  return s;
}

type 受注の定め = { 状態: string; 支払: string; 控え: string };
type 作り方 = {
  メール: string; 商品コード: string; 店舗?: "本店" | "大阪"; 既存受注: 受注の定め[]; 海外の配送先?: string;
  前提支払: string[]; 前提紐付け?: { 配送方法: string; 支払方法: string[] }[];
};

/** 受注情報編集の支払方法欄の選択肢の値（クレジットカード決済は同名が複数あるので、使える側の値） */
async function 支払方法を選ぶ(page: Page, ラベル: string, 値の候補 = 0): Promise<boolean> {
  const sel = page.locator("#order_Payment");
  const opts = await sel.locator("option").evaluateAll((os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, t: (o.textContent ?? "").trim(), s: (o as HTMLOptionElement).selected })));
  const hits = opts.filter((o) => o.t === ラベル);
  if (hits.length === 0) throw new Error(`受注の支払方法の選択肢に「${ラベル}」が無い（${opts.map((o) => o.t).join("、")}）`);
  if (hits.some((h) => h.s)) return false;
  const order = ラベル === "クレジットカード決済" ? ["24", "5"] : [];
  const pick = order.length ? (hits.find((h) => h.v === order[値の候補]) ?? hits[hits.length - 1]) : hits[0];
  await sel.selectOption({ value: pick.v }, { timeout: 20_000 });
  return true;
}

async function 作る({ browser, seed, notes }: SeedCtx, a: 作り方): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const 表示中 = 表示中の支払方法名();
  for (const n of a.前提支払) if (!表示中.includes(n)) throw new Error(`支払方法「${n}」が表示中でない。シード表は表示にする（共有の設定の書き換え）と定めるが、書き換えていない`);
  for (const k of a.前提紐付け ?? []) {
    const have = 配送方法の支払方法名(k.配送方法);
    for (const p of k.支払方法) if (!have.includes(p)) throw new Error(`配送方法「${k.配送方法}」に支払方法「${p}」が紐付いていない。シード表は紐付けると定めるが、書き換えていない`);
  }
  issue("共有の設定（配送方法・支払方法の表示・紐付け）は、必要な状態がすでに成り立っていることをDBの参照で確かめ、書き換えていない");
  const 支店 = a.店舗 === "大阪";
  const base = 支店 ? 大阪の店舗ページ : "";
  const shop = 支店 ? 大阪の店名 : await 本店の店名(browser);
  if (支店) await 大阪の管理者を用意する(browser);
  const m: FrontMember = { 姓: "試験", 名: "太郎", セイ: "シケン", メイ: "タロウ", メール: `${rc(a.メール)}@example.com`, パスワード: "Passw0rd!F0402" };
  await 会員を登録して待つ(browser, m);
  const 会員ID = await withAdminSession(browser, SETUP_ADMIN, (page) => 会員IDを一覧から読む(page, m.メール));
  if (a.海外の配送先) {
    await withAdminSession(browser, SETUP_ADMIN, (page) => 会員のお届け先を足す(page, 会員ID, {
      配送先名称: a.海外の配送先!, 国: "United States", 海外郵便番号: "10001", 住所1: "Main Street 1", 住所2: "New York", 姓: "Taro", 名: "Hare", 電話: "0311112222",
    }, `${seed.シードID}: 海外の配送先`));
  }
  const [商品] = await 商品を作って入庫する(browser, seed.シードID, [{ 商品コード: rc(a.商品コード), 商品名: rc(`${a.商品コード}-商品`), 価格: "1000" }], issue,
    支店 ? { 店舗名: 大阪の店名, 登録者: F04大阪登録者, 承認者: F04大阪承認者 } : {});
  const 既存: Record<string, string> = {};
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await frontLogin(page, m);
    await clearCart(page, () => undefined);
    for (const o of a.既存受注) {
      const what = `${seed.シードID}: 既存受注${o.控え}`;
      const 状態名 = o.状態 === "発送済み" ? "出荷完了" : o.状態;
      if (状態名 !== o.状態) issue("対応状況「発送済み」は、この環境の対応状況の選択肢に無いので「出荷完了」で代えた");
      const 外部決済 = o.状態 === "決済処理中";
      const 確定時の支払 = 外部決済 ? o.支払 : (支店 ? "店頭支払" : (["銀行振込", "郵便振替"].includes(o.支払) ? o.支払 : "銀行振込"));
      if (外部決済) issue("対応状況「決済処理中」は管理画面の対応状況の選択肢に無いので、フロントでクレジットカード決済を選んで注文し、決済画面へ移った時点の受注を使った");
      const 注文番号 = await 注文を確定する(page, base, 商品.productId, 確定時の支払, what, 外部決済);
      const 受注ID = await (async () => {
        if (外部決済) {
          const id = 会員の最新の受注ID(会員ID);
          if (!id) throw new Error(`${what}: 決済画面へ移ったあとの受注が見つからない`);
          return id;
        }
        const 注文ID = 会員の最新の受注ID(会員ID);
        if (!注文ID || 注文番号 === "") throw new Error(`${what}: 確定した受注が見つからない`);
        // 管理画面の受注情報編集で、対応状況と支払方法を整える。クレジットカード決済で保存した受注は、保存のあと編集画面がシステムエラーになるので、
        // 対応状況を先に整え、支払方法は最後に保存する
        await withAdminSession(browser, SETUP_ADMIN, async (ap) => {
          if ((await (await 受注を開き直す(ap, 注文ID)).現在のステータス()) !== 状態名) await ステータスを変える(ap, 注文ID, 状態名);
          const q = await 受注を開き直す(ap, 注文ID);
          await q.お支払情報を開く();
          if (await 支払方法を選ぶ(ap, o.支払)) {
            try { await q.受注情報を登録する(() => undefined); } catch (e) {
              if (o.支払 !== "クレジットカード決済" || !String(e).includes("システムエラー") || 受注の支払方法(注文ID) !== o.支払) throw e;
              issue("受注の支払方法をクレジットカード決済にして保存すると、保存は行われるが画面がシステムエラーになった（保存した支払方法はDBの参照で確かめた）");
            }
          }
        });
        return 注文ID;
      })();
      既存[o.控え] = 受注ID;
    }
    // 新規カート（ご注文方法指定画面は開かない）
    await addToCartAt(page, base, 商品.productId, `${seed.シードID}: 新規カート`);
  } finally {
    await context.close();
  }
  for (const l of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    if (l.includes("…")) continue;
    if (l.includes("会員ID")) notes.set(l, 会員ID);
    else if (l.includes("既存受注ID")) {
      const key = /([AB])〕?$/.exec(l)?.[1] ?? "";
      const id = 既存[key] ?? 既存[""];
      if (!id) throw new Error(`${l} を控える既存受注が無い`);
      notes.set(l, id);
    }
  }
  built.set(seed.シードID, { 会員: m, 会員ID, 既存受注: 既存, 商品ID: 商品.productId, 店舗ページ: base });
}

async function addToCartAt(page: Page, base: string, 商品ID: string, what: string): Promise<void> {
  if (base === "") { await addToCart(page, 商品ID, 1, what); return; }
  await カートに入れる(page, base, 商品ID, 1, what);
}

const 本店ゆうパック同梱 = [
  { 配送方法: "ゆうパック", 支払方法: ["銀行振込", "郵便振替", "クレジットカード決済"] },
  { 配送方法: "同梱", 支払方法: ["銀行振込", "郵便振替"] },
];

defineSeed("S-F04-02-BUNDLE-POSTAL-026", (c) => 作る(c, { メール: "f0402-026", 商品コード: "F0402-BUNDLE-POSTAL-P-026", 既存受注: [{ 状態: "注文受領", 支払: "郵便振替", 控え: "" }], 前提支払: ["郵便振替"] }));
defineSeed("S-F04-02-BUNDLE-CREDIT-028", (c) => 作る(c, { メール: "f0402-028", 商品コード: "F0402-BUNDLE-CREDIT-P-028", 既存受注: [{ 状態: "注文受領", 支払: "クレジットカード決済", 控え: "" }], 前提支払: ["銀行振込"] }));
defineSeed("S-F04-02-BUNDLE-OLDSTATUS-084", (c) => 作る(c, { メール: "f0402-084", 商品コード: "F0402-084-PROD", 既存受注: [{ 状態: "発送済み", 支払: "銀行振込", 控え: "A" }, { 状態: "発送済み", 支払: "郵便振替", 控え: "B" }], 前提支払: ["銀行振込", "郵便振替"] }));
defineSeed("S-F04-02-BUNDLE-MIXED-OK-100", (c) => 作る(c, { メール: "f0402-100", 商品コード: "F0402-100-PROD", 既存受注: [{ 状態: "発送済み", 支払: "銀行振込", 控え: "A" }, { 状態: "注文受領", 支払: "銀行振込", 控え: "B" }], 前提支払: ["銀行振込"] }));
defineSeed("S-F04-02-BUNDLE-SPLIT-101", (c) => 作る(c, { メール: "f0402-101", 商品コード: "F0402-101-PROD", 既存受注: [{ 状態: "注文受領", 支払: "クレジットカード決済", 控え: "A" }, { 状態: "発送済み", 支払: "銀行振込", 控え: "B" }], 前提支払: ["銀行振込", "クレジットカード決済"] }));

const 国内 = (n: string, 状態: string, 支払: string) => (c: SeedCtx) => 作る(c, { メール: `f0402-${n}`, 商品コード: `F0402-CB${n}-P`, 既存受注: [{ 状態, 支払, 控え: "" }], 前提支払: ["銀行振込", "郵便振替", "クレジットカード決済"], 前提紐付け: 本店ゆうパック同梱 });
defineSeed("S-F04-02-CBBUNDLEVIEW-142", 国内("142", "注文受領", "銀行振込"));
defineSeed("S-F04-02-CBBUNDLEVIEW-143", 国内("143", "決済処理中", "クレジットカード決済"));
defineSeed("S-F04-02-CBBUNDLEVIEW-144", 国内("144", "発送済み", "銀行振込"));
defineSeed("S-F04-02-CBBUNDLEVIEW-145", 国内("145", "発送済み", "クレジットカード決済"));
const 海外 = (n: string, 状態: string, 支払: string) => (c: SeedCtx) => 作る(c, { メール: `f0402-${n}`, 商品コード: `F0402-CB${n}-P`, 既存受注: [{ 状態, 支払, 控え: "" }], 海外の配送先: `海外F0402-CB${n}`, 前提支払: ["銀行振込", "郵便振替", "クレジットカード決済"], 前提紐付け: 本店ゆうパック同梱 });
defineSeed("S-F04-02-CBBUNDLEVIEW-146", 海外("146", "入金済み", "郵便振替"));
defineSeed("S-F04-02-CBBUNDLEVIEW-147", 海外("147", "ピック中", "クレジットカード決済"));
defineSeed("S-F04-02-CBBUNDLEVIEW-148", 海外("148", "発送済み", "銀行振込"));
defineSeed("S-F04-02-CBBUNDLEVIEW-149", 海外("149", "発送済み", "クレジットカード決済"));
const 支店 = (n: string, 状態: string, 支払: string) => (c: SeedCtx) => 作る(c, { メール: `f0402-${n}`, 商品コード: `F0402-CB${n}-P`, 店舗: "大阪", 既存受注: [{ 状態, 支払, 控え: "" }], 前提支払: ["店頭支払", "銀行振込", "郵便振替", "クレジットカード決済"], 前提紐付け: 本店ゆうパック同梱 });
defineSeed("S-F04-02-CBBUNDLEBRANCH-150", 支店("150", "出荷指示", "銀行振込"));
defineSeed("S-F04-02-CBBUNDLEBRANCH-151", 支店("151", "入金待ち", "クレジットカード決済"));
defineSeed("S-F04-02-CBBUNDLEBRANCH-152", 支店("152", "発送済み", "郵便振替"));
defineSeed("S-F04-02-CBBUNDLEBRANCH-153", 支店("153", "発送済み", "クレジットカード決済"));
