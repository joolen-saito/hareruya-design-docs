/**
 * F04-01 買い物かごの画面シード。正本: cases/F04-01_seed_data.tsv
 *
 * - S-F04-01-SHOPS（共有）: 本店（店舗ID 1）は既存の店舗を使う。支店A・支店Bは F02-03 の部品（店舗登録画面）で登録する。
 *   シードでの解釈: 店名は「支店A（F04-01）」「支店B（F04-01）」（ほかの機能の同名と分ける。M04-09 の前例）、支店URLは画面の入力チェックを通る
 *   「f0401a」「f0401b」（正本の識別子 shop-a-f0401 はハイフンを含み画面で入らない。ケースの文はこの識別子を使わないので DB へは書き足さない）。
 *   正本の固定の配送方法ID（940100101〜103）も、ケースの文が使わないので作らない（支店の配送方法は、開発環境の支店の作りのまま）。
 *   支店の在庫を入庫・承認するため、本店・支店A・支店Bを編集できる試験用の登録者・承認者を作る（印つき）。
 * - S-F04-01-SETTINGS（共有・≪共有の設定≫）: 送料無料条件（金額・数量）と入荷通知最大数は、ケースの開始時に spec が
 *   「共有の設定を整える」で正本の値にし、終わるたびに「共有の設定を戻す」で元の値へ戻す。元の値は控えのファイルにも残し、途中で止まっても次の回に戻す。
 * - ケースのシード: 会員はフロントの会員登録（本登録のメールは開発環境の受け口）。商品はグッズ商品CSV登録（購入グループ「通常商品」）と在庫編集・別の管理者の承認。
 *   カートは会員でログインした別のブラウザで、商品詳細から入れる。
 *   シードでの解釈: 購入グループ G1 は既存の「通常商品」を使う（購入グループのマスタを増やさない。ケースは購入グループの名前を確かめない）。
 *   商品名は商品コードと同じ値（印つき）。販売価格は正本が任意のときは1,000円。
 *   画面に出ない番号（プレイヤーID・購入グループID・カートID・明細ID・商品規格ID・在庫ID）は、シード表が呼び名を定めるので DB の参照で読んで控える（書き込みはしない）。
 *   決め打ちの商品コード・メールの前半には実行の印を付ける。
 */
import fs from "node:fs";
import path from "node:path";
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN, STATE_DIR } from "../config/env";
import { 会員の店舗のカートID, カートの明細ID, 購入グループID, 商品の商品規格ID, 店舗の在庫ID } from "../db/f04_01";
import { プレイヤーID } from "../db/f03_07";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc, RUN_MARK } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { ensureBranch, 支店の入力 } from "../pages/admin/f02_03_store";
import { readArrivalMax, setArrivalMax } from "../pages/admin/f03_07_restock";
import { 管理者, 商品を作って入庫する, 本店の店名 } from "../pages/admin/f04_setup";
import { ShopBasicPage } from "../pages/admin/m10_01_shop";
import { frontLogin } from "../pages/admin/m04_19_order_shortage";
import { ensureMember } from "../pages/admin/member";
import { カートに入れる } from "../pages/front/f04_shopping";
import { CartPage } from "../pages/front/f04_01_cart";
import { markedMail, 本会員を作る } from "./f06-member";

// ---- 支店（共有） ----
const 支店の定め = (k: "A" | "B"): 支店の入力 => ({
  店名: `支店${k}（F04-01）`, 店名カナ: `シテン${k === "A" ? "エー" : "ビー"}`, 店名英語: `Branch ${k} F0401`, 支店URL: `f0401${k.toLowerCase()}`,
  店名略称3文字: `F4${k}`, ショップ名略称: `支店${k}（F04-01）`,
  郵便番号: "100-0001", 都道府県: "東京都", 住所1: "千代田区試験", 住所2: "4-1", 電話番号: "03-0000-0401",
  地図URL: `${BASE_URL}/maps/f0401${k.toLowerCase()}`,
});
export const 支店のページ = (k: "A" | "B"): string => `/f0401${k.toLowerCase()}`;
export const 支店の店名 = (k: "A" | "B"): string => `支店${k}（F04-01）`;
const 店舗ID = new Map<string, string>([["本店", "1"]]);
export const 店舗IDの = (店: 店): string => {
  const id = 店舗ID.get(店);
  if (!id) throw new Error(`${店} の店舗IDをまだ控えていない（S-F04-01-SHOPS）`);
  return id;
};
export type 店 = "本店" | "支店A" | "支店B";
export const 店のページ = (店: 店): string => (店 === "本店" ? "" : 支店のページ(店 === "支店A" ? "A" : "B"));

const PASS = "Passw0rd!F0401";
const F0401登録者: 管理者 = { 名前: `F0401登録者-${RUN_MARK}`, account: { loginId: `f0401reg${RUN_MARK}`.toLowerCase(), password: PASS } };
const F0401承認者: 管理者 = { 名前: `F0401承認者-${RUN_MARK}`, account: { loginId: `f0401apr${RUN_MARK}`.toLowerCase(), password: PASS } };

defineSeed("S-F04-01-SHOPS", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const 本店 = await 本店の店名(browser);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const k of ["A", "B"] as const) {
      const id = await ensureBranch(page, 支店の定め(k), issue);
      店舗ID.set(`支店${k}`, id);
      notes.set(`〔店舗ID-F0401-共有${k}〕`, id);
    }
    for (const a of [F0401登録者, F0401承認者]) {
      await ensureMember(page, {
        名前: a.名前, 所属店舗: 本店, ログインID: a.account.loginId, メールアドレス: `${a.account.loginId}@example.test`,
        パスワード: a.account.password, 権限: "システム管理者", デフォルト検索表示店舗: 本店, 編集可能店舗: [本店, 支店の店名("A"), 支店の店名("B")],
      });
    }
  });
});

// ---- 共有の設定（送料無料条件・入荷通知最大数）。ケースの開始時に整え、終わるたびに戻す ----
type 設定の値 = { 金額: string; 数量: string; 入荷通知上限: string };
const 控え = path.join(STATE_DIR, "f04_01_shared_original.json");
defineSeed("S-F04-01-SETTINGS", async () => { /* 書き換えはケースの開始時（spec の 共有の設定を整える）。ここでは何もしない */ });

async function 今の値(browser: Browser): Promise<設定の値> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new ShopBasicPage(page);
    await p.open();
    const 金額 = await p.値("送料無料条件(金額)");
    const 数量 = await p.値("送料無料条件(数量)");
    return { 金額, 数量, 入荷通知上限: await readArrivalMax(page) };
  });
}
async function 書く(browser: Browser, v: 設定の値, 今: 設定の値, what: string): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    if (v.金額 !== 今.金額 || v.数量 !== 今.数量) {
      const p = new ShopBasicPage(page);
      await p.open();
      await p.入れる("送料無料条件(金額)", v.金額);
      await p.入れる("送料無料条件(数量)", v.数量);
      await p.押して保存を確かめる(`${what}（送料無料条件 金額「${v.金額 || "設定なし"}」・数量「${v.数量 || "設定なし"}」）`);
    }
    if (v.入荷通知上限 !== 今.入荷通知上限) await setArrivalMax(page, v.入荷通知上限);
  });
}
/** 共有の設定をケースの開始時の値にする（元の値は控えのファイルに残す。前の回の控えがあれば、それが元の値） */
export async function 共有の設定を整える(browser: Browser, v: 設定の値): Promise<void> {
  const 今 = await 今の値(browser);
  if (!fs.existsSync(控え)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.writeFileSync(控え, JSON.stringify(今));
  }
  await 書く(browser, v, 今, "共有の設定をケースの開始時の値にする");
}
/** 共有の設定を元の値へ戻し、戻った値を画面で確かめて返す（戻せなかったときは文を返す） */
export async function 共有の設定を戻す(browser: Browser): Promise<string> {
  if (!fs.existsSync(控え)) return "";
  const 元 = JSON.parse(fs.readFileSync(控え, "utf-8")) as 設定の値;
  await 書く(browser, 元, await 今の値(browser), "共有の設定を元の値へ戻す");
  const 後 = await 今の値(browser);
  if (後.金額 !== 元.金額 || 後.数量 !== 元.数量 || 後.入荷通知上限 !== 元.入荷通知上限) {
    return `共有の設定を元の値へ戻せていない（元 ${JSON.stringify(元)}・今 ${JSON.stringify(後)}）`;
  }
  fs.rmSync(控え, { force: true });
  return "";
}

// ---- ケースのシード ----
export type 品 = { 字: string; 店: 店; 価格?: number; 在庫: number; 上限?: number; カート: number };
type 定め = { 番号: string; 接頭: "f0401" | "cbf0401"; 品: 品[] };
export const 会員の = (d: { 番号: string; 接頭: string }) => ({ メール: markedMail(`${d.接頭}-${d.番号}`), パスワード: "Passw0rd!F0401" });
export const 商品コードの = (d: { 番号: string; 接頭: string }, 字: string): string => rc(`${d.接頭 === "cbf0401" ? "CBF0401" : "F0401"}-${字}-${d.番号}`);

/** シードが作った商品（字 → 商品ID・商品規格ID・在庫ID・店舗）と会員 */
export type 作ったもの = { 会員ID: string; 品: Map<string, { 商品ID: string; 商品規格ID: string; 在庫ID: string; 店: 店; 商品コード: string }> };
const 作った = new Map<string, 作ったもの>();
export function 作ったものの(番号: string): 作ったもの {
  const x = 作った.get(番号);
  if (!x) throw new Error(`F04-01 の ${番号} のシードをまだ作っていない`);
  return x;
}

/** シード表の文に出る呼び名を、作ったものから控える（シード表が定める呼び名だけ） */
function 呼び名を控える(seedId: string, notes: Notes, d: 定め, x: 作ったもの): void {
  const s = getSeed(seedId);
  const labels = Notes.labelsIn(s["状態・属性"] + s.投入方法).filter((l) => !l.includes("…"));
  for (const l of labels) {
    const m = /^〔([^-〕]+)-F0401-(\d{3})([A-Z]?)(本店|支店A|支店B)?〕$/.exec(l);
    if (!m) throw new Error(`${seedId}: 呼び名 ${l} の読み方が決まらない`);
    const [, 種類, , 字, 店名] = m;
    const p = 字 ? x.品.get(字) : (x.品.size === 1 ? [...x.品.values()][0] : undefined);
    const 店: 店 = (店名 as 店) ?? p?.店 ?? (d.品[0]?.店 ?? "本店");
    let v = "";
    if (種類 === "会員ID") v = x.会員ID;
    else if (種類 === "プレイヤーID") v = プレイヤーID(x.会員ID) ?? "";
    else if (種類 === "購入グループID") v = 購入グループID("通常商品");
    else if (種類 === "商品ID") v = p?.商品ID ?? "";
    else if (種類 === "商品規格ID") v = p?.商品規格ID ?? "";
    else if (種類 === "在庫ID") v = p?.在庫ID ?? "";
    else if (種類 === "カートID") {
      v = 会員の店舗のカートID(x.会員ID, 店舗IDの(店));
      // 商品を1件も入れていないカートは、行がまだ作られない（ケースの手順・期待結果はこの番号を使わない）
      if (!v && !d.品.some((q) => q.店 === 店 && q.カート > 0)) v = "（商品を入れていないので、カートの行はまだ作られていない）";
    }
    else if (種類 === "明細ID") v = p ? カートの明細ID(x.会員ID, 店舗IDの(p.店), p.商品規格ID) : "";
    if (!v) throw new Error(`${seedId}: 呼び名 ${l} の値を読めない（作っていないか、画面が振っていない）`);
    notes.set(l, v);
  }
}

function ケースのシード(seedId: string, d: 定め): void {
  defineSeed(seedId, { needs: ["S-F04-01-SHOPS"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const 会員 = 会員の(d);
    const 会員ID = await 本会員を作る(browser, { 姓: "F0401試験", 名: d.番号, セイ: "シケン", メイ: "カイイン", 前半: `${d.接頭}-${d.番号}`, パスワード: 会員.パスワード });
    const x: 作ったもの = { 会員ID, 品: new Map() };
    for (const 店 of ["本店", "支店A", "支店B"] as 店[]) {
      const items = d.品.filter((p) => p.店 === 店);
      if (items.length === 0) continue;
      const 店名 = 店 === "本店" ? await 本店の店名(browser) : 支店の店名(店 === "支店A" ? "A" : "B");
      const made = await 商品を作って入庫する(browser, seedId, items.map((p) => ({
        商品コード: 商品コードの(d, p.字), 商品名: 商品コードの(d, p.字), 価格: String(p.価格 ?? 1000), 入庫数: p.在庫, 入庫方法: "在庫編集" as const,
        在庫変動理由: "結合テスト用", ...(p.上限 !== undefined ? { CSVの値: { "販売制限数": String(p.上限) } } : {}),
      })), issue, 店 === "本店" ? {} : { 店舗名: 店名, 登録者: F0401登録者, 承認者: F0401承認者 });
      items.forEach((p, i) => {
        const 商品規格ID = 商品の商品規格ID(made[i].productId);
        x.品.set(p.字, { 商品ID: made[i].productId, 商品規格ID, 在庫ID: 店舗の在庫ID(商品規格ID, 店舗IDの(店)), 店, 商品コード: made[i].商品コード });
      });
    }
    const 入れる = d.品.filter((p) => p.カート > 0);
    if (入れる.length === 0) {
      // 本店の買い物かごに商品を入れず、買い物かご画面で商品が0件であることを確かめる（031・053）
      const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
      try {
        await hideDebugToolbar(ctx);
        const page = await ctx.newPage();
        await frontLogin(page, 会員);
        const cart = new CartPage(page);
        await cart.開く();
        if ((await cart.商品の行.count()) !== 0) throw new Error(`${seedId}: 会員の本店の買い物かごに商品がある（0件のはず）`);
      } finally { await ctx.close(); }
    }
    if (入れる.length) {
      const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
      try {
        await hideDebugToolbar(ctx);
        const page = await ctx.newPage();
        await frontLogin(page, 会員);
        for (const p of 入れる) await カートに入れる(page, 店のページ(p.店), x.品.get(p.字)!.商品ID, p.カート, `${seedId}: ${p.店}の商品${p.字}をカートへ`);
      } finally { await ctx.close(); }
    }
    作った.set(d.番号, x);
    呼び名を控える(seedId, notes, d, x);
  });
}

const 三店 = (): 品[] => [
  { 字: "A", 店: "本店", 在庫: 10, カート: 1 }, { 字: "B", 店: "本店", 在庫: 10, カート: 1 },
  { 字: "C", 店: "支店A", 在庫: 10, カート: 1 }, { 字: "D", 店: "支店A", 在庫: 10, カート: 1 },
  { 字: "E", 店: "支店B", 在庫: 10, カート: 1 }, { 字: "F", 店: "支店B", 在庫: 10, カート: 1 },
];
const 支店Aの二品 = (): 品[] => [{ 字: "C", 店: "支店A", 在庫: 10, カート: 1 }, { 字: "D", 店: "支店A", 在庫: 10, カート: 1 }];
const 本店A = (o: Partial<品> = {}): 品[] => [{ 字: "A", 店: "本店", 在庫: 10, カート: 1, ...o }];
const 本店AB = (): 品[] => [{ 字: "A", 店: "本店", 在庫: 10, カート: 1 }, { 字: "B", 店: "本店", 在庫: 10, カート: 1 }];

export const ケースの定め: Record<string, { seedId: string; d: 定め }> = {};
const 定める = (seedId: string, 番号: string, 品: 品[], 接頭: 定め["接頭"] = "f0401") => {
  const d = { 番号, 接頭, 品 };
  ケースの定め[番号] = { seedId, d };
  ケースのシード(seedId, d);
};
for (const n of ["001", "014", "025"]) 定める(`S-F04-01-CASE-${n}`, n, 三店());
for (const n of ["002", "013", "018", "024", "026"]) 定める(`S-F04-01-CASE-${n}`, n, 支店Aの二品());
定める("S-F04-01-CASE-003", "003", 本店A({ 価格: 1000, 上限: 10, カート: 1 }));
定める("S-F04-01-CASE-004", "004", 本店A({ 価格: 1000, 上限: 10, カート: 2 }));
定める("S-F04-01-CASE-005", "005", 本店A({ 価格: 1000, 上限: 10, カート: 1 }));
定める("S-F04-01-CASE-006", "006", [{ 字: "S", 店: "本店", 在庫: 2, 上限: 10, カート: 2 }]);
定める("S-F04-01-CASE-007", "007", [{ 字: "L", 店: "本店", 在庫: 10, 上限: 4, カート: 4 }]);
for (const n of ["008", "009", "019", "020"]) 定める(`S-F04-01-CASE-${n}`, n, 本店A({ 上限: 10, カート: 1 }));
定める("S-F04-01-CASE-011", "011", [{ 字: "T", 店: "本店", 在庫: 5, 上限: 5, カート: 1 }]);
定める("S-F04-01-CASE-012", "012", [{ 字: "T", 店: "本店", 在庫: 5, 上限: 5, カート: 1 }]);
定める("S-F04-01-CASE-027", "027", 本店A({ 価格: 1000, カート: 1 }));
定める("S-F04-01-CASE-028", "028", 本店A({ 価格: 1000, カート: 5 }));
定める("S-F04-01-CASE-029", "029", [{ 字: "Q", 店: "本店", 価格: 100, 在庫: 10, カート: 3 }]);
定める("S-F04-01-CASE-030", "030", 本店A({ 価格: 1000, カート: 1 }));
定める("S-F04-01-CASE-031", "031", []);
定める("S-F04-01-CASE-048", "048", 本店A({ 価格: 1000, 上限: 10, カート: 1 }));
定める("S-F04-01-CASE-049", "049", [{ 字: "A", 店: "本店", 価格: 100, 在庫: 2000, 上限: 2000, カート: 1 }]);
定める("S-F04-01-CASE-053", "053", 本店A({ カート: 0 }));
定める("S-F04-01-CASE-054", "054", [{ 字: "R", 店: "本店", 価格: 100, 在庫: 10, カート: 1 }, { 字: "S", 店: "本店", 価格: 200, 在庫: 10, カート: 2 }]);
定める("S-F04-01-CASE-055", "055", 本店AB());
定める("S-F04-01-CASE-056", "056", 本店A({ 価格: 1000, カート: 1 }));
定める("S-F04-01-CBBRNOSET-060", "060", [{ 字: "C", 店: "支店A", 価格: 1000, 在庫: 10, カート: 1 }], "cbf0401");
定める("S-F04-01-CBMAINCNTLOW-061", "061", 本店A({ 価格: 1000, カート: 1 }), "cbf0401");
定める("S-F04-01-CBBOTHREACH-062", "062", 本店A({ 価格: 1000, カート: 5 }), "cbf0401");
定める("S-F04-01-CBAMTONLY-063", "063", 本店A({ 価格: 1000, カート: 5 }), "cbf0401");
定める("S-F04-01-CBDELONE-064", "064", 本店AB(), "cbf0401");
定める("S-F04-01-CBDELALL-065", "065", 本店AB(), "cbf0401");
定める("S-F04-01-CBVIEWBR-066", "066", 支店Aの二品(), "cbf0401");
