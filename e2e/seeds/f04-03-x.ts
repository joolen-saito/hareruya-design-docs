/**
 * F04-03 配送先の新規登録・変更の続き（-x）のシード。仕分け直し（review/not_runnable_recheck_cases2.tsv）で流せる見込みになったもの。
 * 正本: cases/F04-03_seed_data.tsv
 *
 * 型（seeds/f04-03.ts と同じ）: 商品をグッズ商品CSV登録で作り、本店・EC-CUBE に10入庫して別のメンバーが承認 → フロントで会員登録 →
 * 管理画面で会員IDを控える → 会員登録で自動で作られた既定のお届け先に、DB で削除の印を付ける（画面に削除の操作が無い。lib/db_write.ts・E2E の会員だけ）→
 * フロントにログインしてマイページで配送先を登録 → 本店の商品詳細でカートに入れ、ご注文方法指定画面を開いてお届け先・配送方法・支払方法を選ぶ。
 * 2件目の配送（029・055・060・061）は、画面で分けられないので DB で足す（1件目の配送の値を写し、住所1・住所2だけ変える）。
 *
 * シードでの解釈（正本の外の補い。記録にも書く）:
 * - 会員のメールはシード表の値の前半に実行の印を付け、ドメインは example.com で代えた（seeds/f04-03.ts と同じ）。氏名はシード表が示さないものは「試験 太郎」。
 * - お名前（姓）「確定CBF0403059」「確定CBF0403061」は、前の実行の会員と見分けるため実行の印を付けた（059 は受注情報検索で注文者名を入れる）。
 * - 既定のお届け先の「削除」は、アプリのお届け先の削除と同じく削除の印を付けること（行は消さない）。
 * - 正本の2件目の配送ID（8903129・8905505）は指定できない。DB が振る番号を使う。
 * - 〔配送ID-…〕（1件目）は、ご注文方法指定画面の「新しいお届け先情報を登録する」ボタンの行き先に含まれる配送の番号を読んだ（ボタンを押して戻る代わり）。
 * - 059・061 の在庫は、在庫変更CSV登録で入れて別のメンバーが承認した（シード表のとおり）。購入完了の支払方法「郵便振替」が選べなければ、選べる支払方法で代えて記録に書く。
 * - 配送方法「ゆうパック」・支払方法「銀行振込」が選べなければ、選べる先頭のもので代えて記録に書く（ケースは配送方法・支払方法を確かめない）。
 * - S-F04-03-PA-ENV（配送方法・支払方法の共有の設定）は書き換えない。開発環境の今の設定を使う。
 */
import { Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 既定のお届け先を削除済みにする, 完了した受注ID一覧, 受注の配送一覧, 二件目の配送を足す } from "../db/f04_03_x";
import { 処理中受注ID一覧 } from "../db/f04_02";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { 会員を登録して待つ, 商品を作って入庫する, 作った商品 } from "../pages/admin/f04_setup";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { addToCart, clearCart, frontLogin } from "../pages/admin/m04_19_order_shortage";
import { 会員IDを一覧から読む } from "../pages/admin/m05_11_order_edit";
import { CheckoutPage } from "../pages/front/f04_04_checkout";
import { マイページで配送先を足す } from "../pages/front/f04_mypage_delivery";
import { ShoppingPage } from "../pages/front/f04_shopping";
import { FrontMember } from "../pages/front/member_entry";
import { 自宅 } from "./f04-03";

const PASSWORD = "Passw0rd!F0403";
export const 英語の店 = `${BASE_URL}/en`;

type 住所の定め = ReturnType<typeof 自宅>;
const 住所 = (名称: string, 住所1: string, 住所2: string): 住所の定め => ({ ...自宅(名称), 住所1, 住所2 });

type 定め = {
  番号: string; メール: string; 商品コード: string;
  /** 購入完了済みの受注に使う商品（059・061） */
  完了用の商品コード?: string;
  言語?: "ja" | "en";
  姓?: string;
  住所?: 住所の定め[];
  /** ご注文方法指定画面で選ぶお届け先 */
  選ぶ?: string;
  /** 購入完了済みの受注（届け先の配送先名称） */
  完了の届け先?: string;
  /** ご注文方法指定画面を開かない（059） */
  開かない?: boolean;
  /** 1件目の配送の番号を控える呼び名 */
  配送ID?: string;
  /** 2件目の配送（DBで足す）。控える呼び名があれば番号を控える */
  二件目?: { 住所1: string; 住所2: string; 呼び名?: string };
  /** 配送先IDを控える: 呼び名の頭（A〜T を付ける）か、配送先名称ごとの呼び名 */
  配送先IDの頭?: string;
  配送先IDの呼び名?: Record<string, string>;
  在庫変更CSV?: boolean;
  /** 購入完了済みの受注の配送の番号を控える呼び名（061） */
  完了の配送ID呼び名?: string;
};

export type 状態 = { 会員: FrontMember; 会員ID: string; 商品: 作った商品; 言語: "ja" | "en"; 処理中の受注ID: string };
const built = new Map<string, 状態>();
export function 状態の(seedId: string): 状態 {
  const s = built.get(seedId);
  if (!s) throw new Error(`${seedId} はまだ作っていない`);
  return s;
}

/** 英語のご注文方法指定画面を、英語の買い物かご画面の「購入手続きへ」から開く */
export async function 英語の買い物かごから開く(page: Page): Promise<void> {
  await page.goto(`${英語の店}/cart`, { timeout: 60_000 });
  await page.waitForLoadState("load");
  const toShopping = page.locator("a.p-hareruya-cart__checkout-btn");
  await toShopping.first().waitFor({ state: "attached", timeout: 30_000 });
  await Promise.all([page.waitForURL(/\/shopping(\?.*)?$/, { waitUntil: "domcontentloaded", timeout: 60_000 }), toShopping.first().click({ timeout: 30_000 })]);
  await page.waitForLoadState("load");
}

/** 配送方法・支払方法を名前で選ぶ。無ければ選べる先頭のもので代えて記録に書く */
async function 配送と支払を選ぶ(page: Page, 配送: string, 支払: string, issue: (m: string) => void): Promise<void> {
  const co = new CheckoutPage(page);
  try { await co.配送方法を選ぶ(配送); } catch (e) { issue(`配送方法「${配送}」を選べなかった（${String((e as Error).message).split("\n")[0]}）。選ばれている配送方法のまま進めた（ケースは配送方法を確かめない）`); }
  try { await co.支払方法を選ぶ(支払); } catch (e) { issue(`支払方法「${支払}」を選べなかった（${String((e as Error).message).split("\n")[0]}）。選ばれている支払方法のまま進めた（ケースは支払方法を確かめない）`); }
}

/** ご注文方法指定画面の「新しいお届け先情報を登録する」ボタンの行き先に含まれる配送の番号 */
async function 一件目の配送ID(page: Page): Promise<string> {
  const path = await new ShoppingPage(page).新しいお届け先を登録するボタン.first().getAttribute("data-path", { timeout: 30_000 });
  const id = /\/shopping\/shipping_edit\/(\d+)/.exec(path ?? "")?.[1];
  if (!id) throw new Error(`ご注文方法指定画面の「新しいお届け先情報を登録する」の行き先から配送の番号を読めない（${path}）`);
  return id;
}

async function 作る({ browser, seed, notes }: SeedCtx, d: 定め): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const 入庫方法 = d.在庫変更CSV ? "在庫変更CSV" as const : "在庫編集" as const;
  const defs = [d.商品コード, ...(d.完了用の商品コード ? [d.完了用の商品コード] : [])].map((code) => ({
    商品コード: rc(code), 商品名: rc(`${code}-商品`), 価格: "1000", 入庫数: 10, 入庫方法,
  }));
  const 商品たち = await 商品を作って入庫する(browser, seed.シードID, defs, issue);
  const 商品 = 商品たち[0];
  const m: FrontMember = { 姓: d.姓 ? rc(d.姓) : "試験", 名: "太郎", セイ: "シケン", メイ: "タロウ", メール: `${rc(d.メール)}@example.com`, パスワード: PASSWORD };
  await 会員を登録して待つ(browser, m);
  const 会員ID = await withAdminSession(browser, SETUP_ADMIN, (page) => 会員IDを一覧から読む(page, m.メール));
  既定のお届け先を削除済みにする(seed.シードID, m.メール);
  const 言語 = d.言語 ?? "ja";
  const ids = new Map<string, string>();
  let 配送ID = "";
  const context = await browser.newContext({ baseURL: BASE_URL, locale: 言語 === "en" ? "en-US" : "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await frontLogin(page, m);
    for (const a of d.住所 ?? []) ids.set(a.配送先名称, await マイページで配送先を足す(page, a, seed.シードID));
    await clearCart(page, () => undefined);
    if (d.完了用の商品コード) {
      // 購入完了済みの受注（届け先・ゆうパック・郵便振替）
      await addToCart(page, 商品たち[1].productId, 1, `${seed.シードID}: 購入完了用の商品をカートに入れる`);
      const sp = new ShoppingPage(page);
      await sp.買い物かごから開く();
      if (d.完了の届け先) await sp.お届け先を選ぶ(d.完了の届け先);
      await 配送と支払を選ぶ(page, "ゆうパック", "郵便振替", issue);
      const co = new CheckoutPage(page);
      await co.確定のチェックを付ける();
      await co.注文するを押す();
      if (!(await co.購入完了画面か())) throw new Error(`${seed.シードID}: 購入完了画面にならない（${page.url()}）`);
      await clearCart(page, () => undefined);
    }
    await addToCart(page, 商品.productId, 1, `${seed.シードID}: 商品をカートに入れる`);
    if (!d.開かない) {
      if (言語 === "en") await 英語の買い物かごから開く(page);
      else await new ShoppingPage(page).買い物かごから開く();
      if (d.選ぶ) await new ShoppingPage(page).お届け先を選ぶ(d.選ぶ);
      await 配送と支払を選ぶ(page, "ゆうパック", "銀行振込", issue);
      if (d.配送ID || d.二件目) 配送ID = await 一件目の配送ID(page);
    }
  } finally {
    await context.close();
  }
  const 処理中 = d.開かない ? [] : 処理中受注ID一覧(会員ID);
  const 処理中の受注ID = 処理中[処理中.length - 1] ?? "";
  if (!d.開かない && !処理中の受注ID) throw new Error(`${seed.シードID}: 会員 ${会員ID} の購入処理中の受注が無い`);
  let 二件目ID = "";
  if (d.二件目) 二件目ID = 二件目の配送を足す(seed.シードID, 処理中の受注ID, m.メール, d.二件目);

  const 控える = (l: string, v: string) => { if (v) notes.set(l, v); };
  // ケースの文はシード表に無い呼び名（〔注文手続き中ID-F0403-053〕など）も使うので、番号から呼び名を作って控える
  控える(`〔会員ID-F0403-${d.番号}〕`, 会員ID);
  控える(`〔商品ID-F0403-${d.番号}〕`, 商品.productId);
  控える(`〔注文手続き中ID-F0403-${d.番号}〕`, d.開かない ? "（ケースの手順1でご注文方法指定画面を開いたときに振られる。番号は控えない）" : 処理中の受注ID);
  if (d.完了の配送ID呼び名) {
    const 完了 = 完了した受注ID一覧(会員ID);
    if (完了.length !== 1) throw new Error(`${seed.シードID}: 会員 ${会員ID} の購入完了済みの受注が ${完了.length} 件（1件のはず）`);
    控える(d.完了の配送ID呼び名, 受注の配送一覧(完了[0])[0]?.配送ID ?? "");
  }
  if (d.配送ID) 控える(d.配送ID, 配送ID);
  if (d.二件目?.呼び名) 控える(d.二件目.呼び名, 二件目ID);
  if (d.配送先IDの頭) {
    const letters = "ABCDEFGHIJKLMNOPQRST";
    (d.住所 ?? []).forEach((a, i) => 控える(`〔${d.配送先IDの頭}${letters[i]}〕`, ids.get(a.配送先名称) ?? ""));
  }
  for (const [名称, 呼び名] of Object.entries(d.配送先IDの呼び名 ?? {})) 控える(呼び名, ids.get(名称) ?? "");
  built.set(seed.シードID, { 会員: m, 会員ID, 商品, 言語, 処理中の受注ID });
}

/** 「上限確認住所01-008」のように、番号のあとに後ろの文字が付く名称の連番 */
const 連番2 = (前: string, 後: string, n: number, 住所1 = "千代田区千代田", 住所2 = "1-1"): 住所の定め[] =>
  Array.from({ length: n }, (_, i) => 住所(`${前}${String(i + 1).padStart(2, "0")}${後}`, 住所1, 住所2));

// アドレス帳0件の会員（002〜007・021〜025・031〜047）
for (const n of ["002", "003", "004", "005", "006", "007", "021", "022", "023", "025", "031", "032", "033", "035", "036", "037", "038", "039", "045", "047"]) {
  defineSeed(`S-F04-03-NEW-${n}`, { needs: ["S-F04-03-REF"] }, (c) => 作る(c, {
    番号: n, メール: `f0403-new-${n}`, 商品コード: `F0403-P-NEW-${n}`, 言語: n === "007" ? "en" : "ja",
  }));
}

// アドレス帳20件・19件
defineSeed("S-F04-03-CAP20-008", { needs: ["S-F04-03-REF", "S-F04-03-LIMIT"] }, (c) => 作る(c, {
  番号: "008", メール: "f0403-cap20-008", 商品コード: "F0403-P-CAP20-008", 住所: 連番2("上限確認住所", "-008", 20), 選ぶ: "上限確認住所01-008", 配送先IDの頭: "配送先ID-F0403-008",
}));
defineSeed("S-F04-03-CAP20-009", { needs: ["S-F04-03-REF", "S-F04-03-LIMIT"] }, (c) => 作る(c, {
  番号: "009", メール: "f0403-cap20-009", 商品コード: "F0403-P-CAP20-009", 住所: 連番2("上限確認住所", "-009", 20), 選ぶ: "上限確認住所01-009", 配送先IDの頭: "配送先ID-F0403-009",
}));
defineSeed("S-F04-03-CAP19-026", { needs: ["S-F04-03-REF", "S-F04-03-LIMIT"] }, (c) => 作る(c, {
  番号: "026", メール: "f0403-cap19-026", 商品コード: "F0403-P-CAP19-026", 住所: 連番2("上限事前住所", "-026", 19), 配送先IDの頭: "配送先ID-F0403-026",
}));
defineSeed("S-F04-03-DP-CAP19-053", { needs: ["S-F04-03-REF", "S-F04-03-LIMIT"] }, (c) => 作る(c, {
  番号: "053", メール: "dpf0403-cap19-053", 商品コード: "F0403-P-DP-CAP19-053", 住所: 連番2("件数境界住所", "-053", 19),
}));
defineSeed("S-F04-03-DP-CAP20-054", { needs: ["S-F04-03-REF", "S-F04-03-LIMIT"] }, (c) => 作る(c, {
  番号: "054", メール: "dpf0403-cap20-054", 商品コード: "F0403-P-DP-CAP20-054", 住所: 連番2("変更確定住所", "-054", 20), 選ぶ: "変更確定住所01-054",
  配送先IDの呼び名: { "変更確定住所01-054": "〔配送先ID-F0403-054〕" },
}));

// 注文手続き中の配送が2件
defineSeed("S-F04-03-MULTI-029", { needs: ["S-F04-03-REF"] }, (c) => 作る(c, {
  番号: "029", メール: "f0403-multi-029", 商品コード: "F0403-P-MULTI-029",
  住所: [住所("複数配送先A-F0403-029", "新宿区西新宿", "1-1"), 住所("複数配送先B-F0403-029", "台東区上野", "2-2")], 選ぶ: "複数配送先A-F0403-029",
  配送ID: "〔配送ID-F0403-029〕", 二件目: { 住所1: "台東区上野", 住所2: "2-2" },
}));
defineSeed("S-F04-03-DP-MULTI-055", { needs: ["S-F04-03-REF"] }, (c) => 作る(c, {
  番号: "055", メール: "dpf0403-multi-055", 商品コード: "F0403-P-DP-MULTI-055",
  住所: [住所("複数変更住所F0403-A-055", "新宿区西新宿", "1-1"), 住所("複数変更住所B-055", "台東区上野", "2-2")], 選ぶ: "複数変更住所F0403-A-055",
  配送ID: "〔配送ID-F0403-055〕", 二件目: { 住所1: "台東区上野", 住所2: "2-2" },
}));
defineSeed("S-F04-03-CBMULTICAP-060", { needs: ["S-F04-03-REF", "S-F04-03-LIMIT"] }, (c) => 作る(c, {
  番号: "060", メール: "cbf0403-multi-060", 商品コード: "CBF0403-P-060",
  住所: [住所("住所CBF0403-060-01", "新宿区西新宿", "1-1"), ...連番2("住所CBF0403-060-", "", 20).slice(1)], 選ぶ: "住所CBF0403-060-01",
  配送ID: "〔配送ID-F0403-060〕", 二件目: { 住所1: "台東区上野", 住所2: "2-2", 呼び名: "〔配送ID-F0403-060B〕" },
}));

// 購入完了済みの受注がある会員
defineSeed("S-F04-03-CBORDCAP-059", { needs: ["S-F04-03-REF", "S-F04-03-LIMIT"] }, (c) => 作る(c, {
  番号: "059", メール: "cbf0403-ord-059", 商品コード: "CBF0403-B-059", 完了用の商品コード: "CBF0403-A-059", 姓: "確定CBF0403059", 在庫変更CSV: true,
  住所: [住所("住所CBF0403-059-01", "渋谷区神宮前", "1-1"), ...連番2("住所CBF0403-059-", "", 20).slice(1)], 完了の届け先: "住所CBF0403-059-01", 開かない: true,
}));
defineSeed("S-F04-03-CBORDMULTICAP-061", { needs: ["S-F04-03-REF", "S-F04-03-LIMIT"] }, (c) => 作る(c, {
  番号: "061", メール: "cbf0403-ord-061", 商品コード: "CBF0403-B-061", 完了用の商品コード: "CBF0403-A-061", 姓: "確定CBF0403061", 在庫変更CSV: true,
  住所: [住所("住所CBF0403-061-01", "新宿区西新宿", "1-1"), ...連番2("住所CBF0403-061-", "", 20).slice(1)], 完了の届け先: "住所CBF0403-061-01", 選ぶ: "住所CBF0403-061-01",
  配送ID: "〔配送ID-F0403-061〕", 二件目: { 住所1: "台東区上野", 住所2: "2-2", 呼び名: "〔配送ID-F0403-061B〕" }, 完了の配送ID呼び名: "〔受注の配送ID-F0403-061〕",
}));

// 本店の公開・配送方法・支払方法（共有の設定）。書き換えない決まりなので、開発環境の今の設定を使う
defineSeed("S-F04-03-PA-ENV", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "配送方法設定・支払方法設定（ゆうパックの送料・お届け時間・郵便振替の手数料など）は共有の設定なので書き換えず、開発環境の今の設定を使った（ケースは送料・手数料を確かめない。正本の外の補い）");
});

/** 受注情報を確かめる試験管理者（059）。開発環境に同じログインIDの手動テスト用のメンバーがありうるので、ログインID・名前に実行の印を付ける */
export const F0403PA_ADMIN: Account = { loginId: rc("f0403pa-admin").toLowerCase(), password: "Passw0rd-PA0403" };
defineSeed("S-F04-03-PA-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await ensureMemberByStoreIds(page, {
      名前: rc("F04-03受注確認者"), ログインID: F0403PA_ADMIN.loginId, メールアドレス: `${F0403PA_ADMIN.loginId}@example.test`, パスワード: F0403PA_ADMIN.password,
      権限: "システム管理者", 所属店舗ID: "1", デフォルト検索表示店舗ID: "1", 編集可能店舗ID: ["1"],
    });
  });
});
