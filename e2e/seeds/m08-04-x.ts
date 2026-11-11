/**
 * M08-04 会員登録/編集の続き（-x）のシード。仕分け直し（review/not_runnable_recheck_cases2.tsv）で流せる見込みになったもの。
 * 正本: cases/M08-04_seed_data.tsv
 *
 * 型: 会員は seeds/m08-common.ts の 会員を用意する（フロントで会員登録 → 管理画面で本会員にする → 本人確認）。
 * 画面で作れない値だけ、E2E の会員の行へ DB で書き足す（lib/db_write.ts・db/m08_04_x.ts）:
 * - 累計注文回数・累計注文金額（002）、スマレジID（070）。
 * - 受注（038・039・042・043・082）: 商品を作って入庫し（pages/admin/f04_setup.ts）、会員がフロントで購入（またはご注文方法指定画面を開いて購入処理中）して受注を作り、
 *   注文日時・発送日・支払方法の表示名・購入金額・受注ステータス・受注番号を DB で書き足す。
 * - お届け先（033〜036・088・089）: 管理画面の「お届け先住所を追加」で登録し、会員登録で自動で作られた既定のお届け先に、DB で削除の印を付ける（アプリの削除と同じ論理削除）。
 *
 * シードでの解釈（正本の外の補い。記録にも書く）:
 * - 正本の受注ID・受注番号（80438001・920001 など）は指定できない。画面・DB が振る番号を使う（042 は受注番号を空にする）。
 * - 支払方法「試験支払A」は、受注に残る支払方法の表示名を DB で書き換えた（支払方法のマスタは共有なので足さない）。
 * - S-M08-04-MASTERS（国・都道府県・性別・職業・顧客グループの試験用の値）は、全員が使うマスタなので足さない。開発環境に既にある値で読み替える（spec の 読み替えのマスタ）。
 * - 購入の配送方法・支払方法は「ゆうパック」「銀行振込」（選べなければ選ばれているもの）。ケースは確かめない（支払方法は表示名を書き換える）。
 */
import { Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 既定のお届け先を削除済みにする } from "../db/f04_03_x";
import { 会員の受注, 受注を書き足す, スマレジIDを書き足す, 累計を書き足す } from "../db/m08_04_x";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { adminUrl, hideDebugToolbar, withAdminSession } from "../lib/session";
import { chooseByLabel, expectSaved } from "../pages/admin/common";
import { 商品を作って入庫する } from "../pages/admin/f04_setup";
import { addToCart, clearCart, frontLogin } from "../pages/admin/m04_19_order_shortage";
import { CheckoutPage } from "../pages/front/f04_04_checkout";
import { ShoppingPage } from "../pages/front/f04_shopping";
import { 会員を用意する, 会員の用意, M08PW } from "./m08-common";

/** 受注の番号など、ケースが読む値（シードIDごと） */
export type 作った受注 = { 受注ID: string; 受注番号: string };
const 受注たち = new Map<string, 作った受注[]>();
export function 受注の(seedId: string): 作った受注[] {
  const v = 受注たち.get(seedId);
  if (!v) throw new Error(`${seedId} はまだ作っていない`);
  return v;
}

const 旧: Pick<会員の用意, "姓" | "名" | "セイ" | "メイ"> = { 姓: "旧姓", 名: "旧名", セイ: "キュウ", メイ: "カイイン" };

// ---- 累計・スマレジID ----
defineSeed("S-M08-04-BASE-002", async (ctx) => {
  const { メール } = await 会員を用意する(ctx, { 前半: "m0804-002", ...旧 });
  累計を書き足す(ctx.seed.シードID, メール, 12, 345600);
});
defineSeed("S-M08-04-BASE-008", async (ctx) => { await 会員を用意する(ctx, { 前半: "m0804-008", ...旧 }); });
defineSeed("S-M08-04-SMAREGI-070", async (ctx) => {
  const { メール } = await 会員を用意する(ctx, { 前半: "m0804-070", ...旧 });
  スマレジIDを書き足す(ctx.seed.シードID, メール, "7080070");
});

// ---- マスタ（読み替え） ----
defineSeed("S-M08-04-MASTERS", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "国「試験国A」・都道府県「試験都道府県A」・性別「試験性別A」・職業「試験職業A」・顧客グループ「試験顧客グループA」は全員が使うマスタなので足さず、開発環境に既にある値で読み替えた（国 United States・都道府県 大阪府・性別 女性・職業 その他・顧客グループ 会員の今の値と違う既存のもの。正本の外の補い）");
});

// ---- 本人確認ステータスのある会員 ----
const 確認住所 = { 住所1: "確認住所1", 住所2: "確認住所2" };
for (const n of ["027", "029"]) {
  defineSeed(`S-M08-04-VERIFY-${n}`, async (ctx) => {
    await 会員を用意する(ctx, {
      前半: `m0804-${n}`, 姓: "書留", 名: "会員", セイ: "カキトメ", メイ: "カイイン", ...確認住所,
      ...(n === "027" ? { 文字: { abroadPostalCode: "1000001" } } : {}),
      本人確認: { オンライン: true, 期限: "2027-12-31", 簡易書留: true },
    });
  });
}
for (const [n, 名] of [["074", "COUNTRY"], ["075", "ZIP"], ["076", "OVERSEAS"], ["077", "PREF"], ["078", "ADDR1"], ["079", "ADDR2"]] as const) {
  defineSeed(`S-M08-04-VERIFY-ONLINE-${名}-${n}`, async (ctx) => {
    await 会員を用意する(ctx, {
      前半: `m0804-${n}`, 姓: "確認", 名: "会員", セイ: "カクニン", メイ: "カイイン", ...確認住所,
      文字: { abroadPostalCode: "1000001" }, 本人確認: { オンライン: true, 期限: "2027-12-31" },
    });
  });
}

// ---- お届け先 ----
type お届け先の定め = { 名称: string; 名: string; カナ名: string; 電話: [string, string, string]; 住所1: string; 住所2: string; 呼び名: string };

/** 管理画面の会員登録/編集画面の「お届け先住所を追加」から、お届け先登録画面で登録する。登録後の画面のアドレスのお届け先の番号を返す */
async function お届け先を足す(page: Page, 会員ID: string, d: お届け先の定め, what: string): Promise<string> {
  await page.goto(adminUrl(`/customer/${会員ID}/edit`), { timeout: 60_000 });
  await page.waitForLoadState("load");
  const add = page.locator(`a[href$="/customer/${会員ID}/delivery/new"]`).first();
  await Promise.all([page.waitForURL(/\/delivery\/new/, { timeout: 60_000 }), add.click({ timeout: 30_000 })]);
  await page.waitForLoadState("load");
  const f = (name: string) => page.locator(`[name="customer_address[${name}]"]`);
  await f("address_name").fill(d.名称);
  if ((await f("country").count()) > 0) await chooseByLabel(f("country"), ["Japan", "日本"]);
  await f("name][name01").fill("配送");
  await f("name][name02").fill(d.名);
  if ((await f("kana][kana01").count()) > 0) { await f("kana][kana01").fill("ハイソウ"); await f("kana][kana02").fill(d.カナ名); }
  await f("tel][tel01").fill(d.電話[0]); await f("tel][tel02").fill(d.電話[1]); await f("tel][tel03").fill(d.電話[2]);
  await f("postalCode][postalCode01").fill("100"); await f("postalCode][postalCode02").fill("0001");
  await page.waitForTimeout(500);
  await chooseByLabel(f("address][pref"), "東京都");
  await f("address][addr01").fill(d.住所1);
  await f("address][addr02").fill(d.住所2);
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), page.locator("form button[type=submit]").filter({ hasText: /登録/ }).first().click({ timeout: 30_000 })]);
  await expectSaved(page, `${what}: お届け先「${d.名称}」の登録`);
  const id = /\/delivery\/(\d+)\/edit/.exec(page.url())?.[1];
  if (!id) throw new Error(`${what}: 登録後の画面のアドレスからお届け先の番号を読めない（${page.url()}）`);
  return id;
}

function お届け先の会員(seedId: string, 前半: string, パスワード: string | undefined, 先: Omit<お届け先の定め, "呼び名">[], 呼び名: string[]): void {
  defineSeed(seedId, async (ctx) => {
    const { 会員ID, メール } = await 会員を用意する(ctx, { 前半, 姓: "配送", 名: "会員", セイ: "ハイソウ", メイ: "カイイン", 住所1: "会員住所1", 住所2: "会員住所2", パスワード });
    await withAdminSession(ctx.browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      for (const [i, d] of 先.entries()) ctx.notes.set(呼び名[i], await お届け先を足す(page, 会員ID, { ...d, 呼び名: 呼び名[i] }, seedId));
    });
    既定のお届け先を削除済みにする(seedId, メール);
  });
}
const 太郎 = (名称: string, 電話: [string, string, string]) => ({ 名称, 名: "太郎", カナ名: "タロウ", 電話, 住所1: "千代田区", 住所2: "1-1" });
const 花子 = { 名称: "試験お届け先B", 名: "花子", カナ名: "ハナコ", 電話: ["03", "0884", "2222"] as [string, string, string], 住所1: "港区", 住所2: "2-2" };
for (const n of ["033", "034", "035", "036"]) {
  お届け先の会員(`S-M08-04-DELIVERY-${n}`, `m0804-${n}`, undefined, [太郎("試験お届け先", ["03", "1111", "2222"])], [`〔お届け先ID-M0804-${n}〕`]);
}
for (const n of ["088", "089"]) {
  お届け先の会員(`S-M08-04-DELIVERY-${n}`, `dpm0804-${n}`, `Passw0rd-M0804${n}`, [太郎("試験お届け先A", ["03", "0884", "1111"]), 花子], [`〔お届け先ID-M0804-${n}-A〕`, `〔お届け先ID-M0804-${n}-B〕`]);
}

// ---- 受注 ----
type 受注の定め = { 状態: "購入完了" | "購入処理中"; 書き足し: Parameters<typeof 受注を書き足す>[3] };

/** 配送方法・支払方法を名前で選ぶ。選べなければ選ばれているもののまま進めて記録に書く */
async function 配送と支払を選ぶ(page: Page, issue: (m: string) => void): Promise<void> {
  const co = new CheckoutPage(page);
  try { await co.配送方法を選ぶ("ゆうパック"); } catch (e) { issue(`配送方法「ゆうパック」を選べなかった（${String((e as Error).message).split("\n")[0]}）。選ばれているもののまま進めた`); }
  try { await co.支払方法を選ぶ("銀行振込"); } catch (e) { issue(`支払方法「銀行振込」を選べなかった（${String((e as Error).message).split("\n")[0]}）。選ばれているもののまま進めた`); }
}

async function 受注のある会員(ctx: SeedCtx, o: { 前半: string; 姓: string; セイ: string; パスワード?: string; 住所1?: string; 住所2?: string }, 受注: 受注の定め[]): Promise<void> {
  const { browser, seed } = ctx;
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const [商品] = await 商品を作って入庫する(browser, seed.シードID, [{ 商品コード: rc(`M0804-${o.前半}`), 商品名: rc(`M0804-${o.前半}-商品`), 価格: "1200", 入庫数: 10, 入庫方法: "在庫編集" }], issue);
  const パスワード = o.パスワード ?? M08PW;
  const { 会員ID, メール } = await 会員を用意する(ctx, { 前半: o.前半, 姓: o.姓, 名: "会員", セイ: o.セイ, メイ: "カイイン", パスワード, ...(o.住所1 ? { 住所1: o.住所1, 住所2: o.住所2 } : {}) });
  const 作った: 作った受注[] = [];
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await frontLogin(page, { メール, パスワード });
    for (const [i, u] of 受注.entries()) {
      const 前 = new Set(会員の受注(会員ID).map((r) => r.受注ID));
      await clearCart(page, () => undefined);
      await addToCart(page, 商品.productId, 1, `${seed.シードID}: ${i + 1}件目の受注の商品をカートに入れる`);
      await new ShoppingPage(page).買い物かごから開く();
      await 配送と支払を選ぶ(page, issue);
      if (u.状態 === "購入完了") {
        const co = new CheckoutPage(page);
        await co.確定のチェックを付ける();
        await co.注文するを押す();
        if (!(await co.購入完了画面か())) throw new Error(`${seed.シードID}: ${i + 1}件目の受注が購入完了画面にならない（${page.url()}）`);
      }
      const 増えた = 会員の受注(会員ID).filter((r) => !前.has(r.受注ID));
      if (増えた.length !== 1) throw new Error(`${seed.シードID}: ${i + 1}件目の受注が ${増えた.length} 件増えた（1件のはず）`);
      if (Object.keys(u.書き足し).length > 0) 受注を書き足す(seed.シードID, 増えた[0].受注ID, メール, u.書き足し);
      const r = 会員の受注(会員ID).find((x) => x.受注ID === 増えた[0].受注ID)!;
      作った.push({ 受注ID: r.受注ID, 受注番号: r.受注番号 });
    }
  } finally {
    await context.close();
  }
  受注たち.set(seed.シードID, 作った);
}

const 入金済み = (注文日時: string, 発送日: string | null, 受注番号?: null): 受注の定め => ({
  状態: "購入完了", 書き足し: { 注文日時, 発送日, 支払方法: "試験支払A", 購入金額: 1200, 受注ステータス: "入金済み", ...(受注番号 === null ? { 受注番号: null } : {}) },
});
defineSeed("S-M08-04-PURCHASE-READ", (ctx) => 受注のある会員(ctx, { 前半: "m0804-purchase-read", 姓: "購入", セイ: "シケン" }, [入金済み("2026-08-01 10:00:00+09", "2026-08-02 00:00:00+09")]));
defineSeed("S-M08-04-PURCHASE-042", (ctx) => 受注のある会員(ctx, { 前半: "m0804-042", 姓: "購入", セイ: "シケン" }, [入金済み("2026-08-01 11:00:00+09", null, null)]));
defineSeed("S-M08-04-PURCHASE-STATUS-039", (ctx) => 受注のある会員(ctx, { 前半: "m0804-039", 姓: "購入", セイ: "シケン" }, [
  { 状態: "購入処理中", 書き足し: { 受注ステータス: "決済処理中" } },
  { 状態: "購入処理中", 書き足し: {} },
]));
defineSeed("S-M08-04-MIXED-082", (ctx) => 受注のある会員(ctx, { 前半: "dpm0804-082", 姓: "混在", セイ: "コンザイ", パスワード: "Passw0rd-M0804082", 住所1: "混在住所1", 住所2: "混在住所2" }, [
  { 状態: "購入完了", 書き足し: { 注文日時: "2026-08-01 10:00:00+09", 購入金額: 1200, 受注ステータス: "入金済み" } },
  { 状態: "購入処理中", 書き足し: { 注文日時: "2026-08-02 10:00:00+09", 購入金額: 3400, 受注ステータス: "決済処理中" } },
]));
