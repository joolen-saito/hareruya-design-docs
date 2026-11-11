/**
 * F10-02 購入完了の売上連携（フロント アクセス解析）のシード（画面操作）。正本: cases/F10-02_seed_data.tsv
 *
 * 作り方（シード表は DB への登録だが、画面で作れるものは画面で作る。依頼者決定 2026-11-10）:
 * 会員（フロントの新規会員登録 → 本登録のメールのURL。F06 と同じ作り方）→ 商品（グッズ商品CSV登録・購入グループ「通常商品」・在庫編集で入庫して承認。F04-01 と同じ作り方）
 * → 配送方法（配送方法設定の新規登録。名前に実行の印を付ける。支払方法は銀行振込、送料は47都道府県一律）→ 会員でログインして商品をカートに入れる
 * → ご注文方法指定画面を開いて配送方法・支払方法を選ぶ（開くと購入処理中の受注ができる）→ 受注IDを控える。
 *
 * シード表と違えたところ（解釈。記録・報告にも書く）:
 * - 会員のメール・商品コード・商品名・配送方法の名称には、実行の印を付ける（依頼者決定 2026-10-28）。ケースの「配送便F1002-004」などは、印つきの値として読む。
 * - 固定の受注ID（ORDER-001〜003）・複数のお届け先（005）・手数料と値引き（009）・同じ商品の別行（017）・共有のレイアウトの試験用ブロック（MARKER-ENV・028）は、画面で作れない／共有の設定を書き換えるため作らない。
 * - 配送方法設定の画面には購入グループ・地域別販売制限へ結びつける欄が無い。ご注文方法指定画面に出すため、画面で作った（印つきの）配送方法だけを DB で結びつける（db/f10_02.ts）。
 * - 011「注文時に保存されたメールアドレス」: 画面に、購入処理中の受注のメールを会員と別にする操作が無いので、印つきの会員の受注に限り DB で書き換える。
 * - 020「商品カテゴリ「カテゴリF1002-020」を設定」: グッズ商品CSV登録で作った商品は、既存の子カテゴリに入る。新しいカテゴリは作らず、そのカテゴリを「カテゴリが設定されている」状態として使う。
 * - 008「使用ポイント200」: 会員にポイントを管理画面で付与しておき、使用ポイントはケースの手順（注文する）の直前に画面で入れる。
 * - 034・035「購入完了画面のレイアウト設定の先頭部に置いたブロックは無い」: 共有のレイアウトは書き換えず、先頭部のブロックを画面で読んで記録に残すだけ。
 * - 税抜単価・税込単価・送料は、商品の販売価格・配送方法の送料で入れる。税込単価は画面の税の設定で決まる（ケースは小計の値で確かめる）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 会員の最新の受注ID, 受注のメールを変える, 配送方法の番号, 配送方法を購入できる状態にする } from "../db/f10_02";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { getSeed } from "../lib/catalog";
import { reportSeedIssue } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { DeliveryPage } from "../pages/admin/m10_06_delivery";
import { 商品を作って入庫する } from "../pages/admin/f04_setup";
import { URLでページを探す, ページのPCのレイアウト, 先頭部のブロック } from "../pages/admin/f10_03_setup";
import { ポイントを付与する } from "../pages/admin/m05_11_order_edit";
import { frontLogin } from "../pages/admin/m04_19_order_shortage";
import { ShoppingPage, カートに入れる } from "../pages/front/f04_shopping";
import { 配送方法を選ぶ, 支払方法を選ぶ } from "../pages/front/f10_02_purchase";
import { defineSeed } from "./current_seed";
import { markedMail, 本会員を作る } from "./f06-member";

const パスワード = "Passw0rd!F1002";
const 購入グループ名 = "通常商品";
const 支払 = "銀行振込";

type 品 = { 字: "A" | "B"; 価格: string; 数量: number; 名?: string };
type 定め = { 番号: string; 品: 品[]; 送料: string; ポイント?: number; 注文メール?: string; 先頭部を読む?: boolean };

const 標準品: 品[] = [{ 字: "A", 価格: "500", 数量: 3 }];
const 二行品: 品[] = [{ 字: "A", 価格: "500", 数量: 3 }, { 字: "B", 価格: "1000", 数量: 2 }];
const d = (番号: string, 追加: Partial<定め> = {}): 定め => ({ 番号, 品: 標準品, 送料: "600", ...追加 });

/** 作る注文（正本のうち、画面で作れるもの） */
export const F1002の定め: 定め[] = [
  d("004"), d("006"), d("007", { 品: 二行品 }), d("008", { ポイント: 200 }), d("010"), d("011", { 注文メール: "f1002-011-order" }),
  d("012"), d("013"), d("014"), d("015"), d("016", { 品: 二行品 }),
  d("018", { 品: [{ 字: "A", 価格: "500", 数量: 3, 名: "日本語商品F1002-018" }] }),
  d("019", { 送料: "0" }), d("020"), d("021"), d("022"), d("023"), d("024"), d("026"), d("027"),
  d("029"), d("030"), d("032", { 品: 二行品 }), d("033"), d("034", { 先頭部を読む: true }), d("035", { 先頭部を読む: true }),
  d("039", { 品: [{ 字: "A", 価格: "333", 数量: 3 }] }),
];

// ---- 名前・値（シードとケースで同じ値を引く） ----
export const 会員のメール = (番号: string): string => markedMail(`f1002-${番号}`);
export const 会員のパスワード = (): string => パスワード;
export const 配送名 = (番号: string): string => rc(`配送便F1002-${番号}`);
export const 商品コード = (番号: string, 字: "A" | "B"): string => rc(`F1002-${番号}-${字}`);
export const 商品名 = (番号: string, 字: "A" | "B"): string => rc(定めの(番号).品.find((p) => p.字 === 字)?.名 ?? `商品F1002-${番号}-${字}`);
export function 定めの(番号: string): 定め {
  const x = F1002の定め.find((v) => v.番号 === 番号);
  if (!x) throw new Error(`F10-02 の ${番号} の定めが無い`);
  return x;
}

/** シード表の文に出る呼び名（〔会員ID-F1002-NNN〕・〔受注ID-F1002-NNN〕）を控える */
function 呼び名を控える(seedId: string, notes: Notes, v: { 会員ID: string; 受注ID?: string }): void {
  const s = getSeed(seedId);
  for (const l of Notes.labelsIn(s["状態・属性"] + s.投入方法)) {
    const m = /^〔(会員ID|受注ID)-F1002-\d{3}〕$/.exec(l);
    if (!m) throw new Error(`${seedId}: 呼び名 ${l} の形が読めない`);
    const value = m[1] === "会員ID" ? v.会員ID : v.受注ID;
    if (!value) throw new Error(`${seedId}: 呼び名 ${l} の値を読めない`);
    notes.set(l, value);
  }
}

async function 会員を作る(browser: Browser, 番号: string): Promise<string> {
  return 本会員を作る(browser, { 姓: "F1002試験", 名: 番号, セイ: "シケン", メイ: "カイイン", 前半: `f1002-${番号}`, パスワード });
}

async function 注文を用意する(browser: Browser, seedId: string, notes: Notes, v: 定め): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 会員ID = await 会員を作る(browser, v.番号);
  const メール = 会員のメール(v.番号);
  // 商品（グッズ商品CSV登録 → 在庫編集で入庫 → 別の管理者が承認）
  const made = await 商品を作って入庫する(browser, seedId, v.品.map((p) => ({
    商品コード: 商品コード(v.番号, p.字), 商品名: 商品名(v.番号, p.字), 価格: p.価格, 入庫数: 10, 入庫方法: "在庫編集" as const, 在庫変動理由: "結合テスト用",
  })), issue);
  // 配送方法（画面で作り、購入グループ・地域別販売制限へ DB で結びつける）
  const 名 = 配送名(v.番号);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await new DeliveryPage(page).作る({ 配送業者名: 名, 名称: 名, 英語名称: `DeliveryF1002-${v.番号}`, 支払方法: [支払], 送料: v.送料 });
  });
  配送方法を購入できる状態にする(seedId, 配送方法の番号(名), 名, 購入グループ名);
  issue("配送方法設定の画面に購入グループ・地域別販売制限へ結びつける欄が無いので、画面で作った（印つきの）配送方法だけを DB で結びつけた。送料は47都道府県の一律");
  if (v.ポイント) await withAdminSession(browser, SETUP_ADMIN, (page) => ポイントを付与する(page, 会員ID, 1000));
  // 会員でログインして商品をカートに入れ、ご注文方法指定画面で配送方法・支払方法を選ぶ（開くと購入処理中の受注ができる）
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctx);
    const page = await ctx.newPage();
    await frontLogin(page, { メール, パスワード });
    for (const [i, p] of v.品.entries()) await カートに入れる(page, "", made[i].productId, p.数量, `${seedId}: 商品${p.字}をカートへ`);
    await new ShoppingPage(page).買い物かごから開く("");
    await 配送方法を選ぶ(page, 名, seedId);
    await 支払方法を選ぶ(page, 支払, seedId);
  } finally { await ctx.close(); }
  const 受注ID = 会員の最新の受注ID(会員ID);
  if (v.注文メール) {
    受注のメールを変える(`${seedId}: 受注に保存されたメール`, 受注ID, メール, `${rc(v.注文メール)}@example.test`);
    issue(`注文時に保存されたメールアドレスは、印をつけた ${rc(v.注文メール)}@example.test に DB で変えた`);
  }
  if (v.先頭部を読む) await 購入完了画面の先頭部を読む(browser, seedId);
  呼び名を控える(seedId, notes, { 会員ID, 受注ID });
}

/** 購入完了画面（ページ管理の URL が「shopping_complete」のページ）のPCのレイアウトの先頭部のブロックを読み、記録に残す（書き換えない） */
async function 購入完了画面の先頭部を読む(browser: Browser, seedId: string): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    try {
      const p = await URLでページを探す(page, "shopping_complete");
      const l = await ページのPCのレイアウト(page, p.ページID);
      if (!l) { reportSeedIssue(seedId, "購入完了画面のPCのレイアウトが選ばれていない"); return; }
      const b = await 先頭部のブロック(page, l.レイアウトID);
      reportSeedIssue(seedId, `購入完了画面のレイアウト「${l.名称}」の先頭部に置いてあるブロック: ${b.map((x) => x.名前).join("、") || "なし"}（読むだけ。書き換えていない）`);
    } catch (e) {
      reportSeedIssue(seedId, `購入完了画面のレイアウトの先頭部を読めなかった: ${(e as Error).message.split("\n")[0]}`);
    }
  });
}

defineSeed("S-F10-02-REF", async ({ browser }) => {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    for (const 入口 of ["/ja", "/en"]) {
      const res = await page.goto(`${BASE_URL}${入口}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      if ((res?.status() ?? 0) >= 400) throw new Error(`S-F10-02-REF: 公開側（${入口}/）の応答が ${res?.status()}`);
    }
  } finally { await context.close(); }
  reportSeedIssue("S-F10-02-REF", "共有のマスタ・設定は書き換えず、日本語サイト・英語サイトのTOP画面が開けることを画面で確かめた");
});

for (const v of F1002の定め) {
  defineSeed(`S-F10-02-ORDER-${v.番号}`, async ({ browser, notes, seed }) => { await 注文を用意する(browser, seed.シードID, notes, v); });
}

defineSeed("S-F10-02-NOORDER-031", async ({ browser, notes, seed }) => {
  const 会員ID = await 会員を作る(browser, "031");
  呼び名を控える(seed.シードID, notes, { 会員ID });
});

defineSeed("S-F10-02-PREDL-035", async () => { /* 購入完了画面を読み込む前の受け渡し領域は、ケースの手順の前にブラウザへ仕込む（ケースの注記に残す） */ });
