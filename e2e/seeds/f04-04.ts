/**
 * F04-04 決済〜購入完了の画面シード。正本: cases/F04-04_seed_data.tsv
 *
 * 作り方（シード表の投入方法の順）:
 * - 会員: シード表は「管理画面の会員登録画面で登録」と定めるが、管理画面の会員は編集の画面しか無く新規登録の経路が無い
 *   （/customer/{id}/edit だけ）。フロントの会員登録で作り、本登録のメールは受け口で読む（依頼者決定 2026-10-31）。顧客グループは既定の通常。
 * - 商品: グッズ商品CSV登録（F04 の部品 商品を作って入庫する）→ 商品規格一覧で取込で作られた規格を開き、部門は先頭・公開で登録 → 在庫編集で入庫
 *   （TAGS 系は在庫変更CSV登録）し、別のメンバーが承認する。
 * - 専用ブラウザ: シードの中のブラウザで会員としてログインし、カートに入れ、ご注文方法指定画面を開いて支払方法を選ぶ（購入処理中の受注ができる）。
 *   そのブラウザの Cookie を控え、ケースの開始時にケースのブラウザへ移す（同じセッションの購入処理中の受注を引き継ぐ）。受注IDは管理画面の受注情報検索で控える。
 * - PB 系（040〜046・054・055）: 在庫の登録者 f0404pb-admin・承認者 f0404pb-apr（ケースの手順が使うログインID。印を付けず、あれば使う）。
 *   会員はフロント（本店）にログインしてカートに入れるだけ（ご注文方法指定画面は開かない）。ケースの手順でログインし直すと、カートは会員に引き継がれる。
 *
 * シードでの解釈（記録にも書く）:
 * - 決め打ちの商品コード・商品名・会員のメールの前半に実行の印を付ける（依頼者決定 2026-10-28）。パスワードには付けない。
 * - 管理画面の会員登録で入れる「任意のパスワード」は Passw0rd-F0404（PB 系はシード表の値）。お名前は「試験 太郎」（PB 系はシード表の値）。
 * - 商品カテゴリ(ID)は、F04 の部品のとおり、グッズの既存のカテゴリ（流し直しのセッションが番号2で探す形に直した部品）。
 * - 「グッズ商品CSVの原価単価」は取り込まれない列（アプリの列定義が dummy）なので、総原価は入庫の仕入単価から決まる。
 * - 管理者の権限はシステム管理者（在庫管理・会員管理・在庫編集承認を含む）。名前は F0404PB管理者・F0404PB承認者。
 */
import { Browser, BrowserContext, Cookie } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 処理中受注ID一覧, 表示中の支払方法名, 表示中の配送方法名 } from "../db/f04_02";
import { rc } from "../lib/run_marker";
import { getSeed } from "../lib/catalog";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { 会員を登録して待つ, 管理者, 商品を作って入庫する, 商品の定め, 作った商品, 処理中の受注IDを読む, 本店の店名 } from "../pages/admin/f04_setup";
import { openClassListByName, publishImportedClass } from "../pages/admin/m04_02_rc_stock";
import { addToCart, clearCart, frontLogin } from "../pages/admin/m04_19_order_shortage";
import { 会員IDを一覧から読む } from "../pages/admin/m05_11_order_edit";
import { ensureMember } from "../pages/admin/member";
import { CheckoutPage } from "../pages/front/f04_04_checkout";
import { FrontMember } from "../pages/front/member_entry";

export const PB_ADM: 管理者 = { 名前: "F0404PB管理者", account: { loginId: "f0404pb-admin", password: "Passw0rd-PB0404" } };
export const PB_APR: 管理者 = { 名前: "F0404PB承認者", account: { loginId: "f0404pb-apr", password: "Passw0rd-PB0404A" } };
const PW = "Passw0rd-F0404";

export type 準備 = { 会員: FrontMember; 会員ID: string; 商品: 作った商品[]; cookies: Cookie[]; 受注ID: string };
const 準備済み = new Map<string, 準備>();
/** シードが作った会員・商品・専用ブラウザの Cookie・受注ID */
export function 準備の(seedId: string): 準備 {
  const s = 準備済み.get(seedId);
  if (!s) throw new Error(`${seedId} はまだ作っていない`);
  return s;
}
/** ケースのブラウザを、シードの専用ブラウザと同じ状態（ログイン・購入処理中の受注）にする */
export async function 専用ブラウザにする(context: BrowserContext, seedId: string): Promise<void> {
  const s = 準備の(seedId);
  if (s.cookies.length === 0) throw new Error(`${seedId} の専用ブラウザの Cookie が無い`);
  await context.clearCookies();
  await context.addCookies(s.cookies);
}

type 商品の作り方 = { コード: string; 数量: number; 価格?: string; 入庫数: number; 入庫方法: "在庫編集" | "在庫変更CSV"; 仕入単価: string; 在庫変動理由?: string; CSVの値?: Record<string, string>; 商品IDの呼び名?: string };
type 作り方 = {
  メール: string; パスワード?: string; 姓?: string; 名?: string; セイ?: string; メイ?: string;
  商品: 商品の作り方[];
  /** 専用ブラウザでご注文方法指定画面を開き、この支払方法を選ぶ（購入処理中の受注を作る）。省略するとカートに入れるだけ */
  開く?: { 支払方法: string };
  /** 商品をカートに入れない（会員だけ） */
  カートなし?: boolean;
  PB?: boolean;
  会員IDの呼び名?: string;
  受注IDの呼び名?: string;
};

let PB管理者を用意した = false;
async function PB管理者を用意する(browser: Browser): Promise<void> {
  if (PB管理者を用意した) return;
  const shop = await 本店の店名(browser);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const a of [PB_ADM, PB_APR]) {
      await ensureMember(page, {
        名前: a.名前, 所属店舗: shop, ログインID: a.account.loginId, メールアドレス: `${a.account.loginId}@example.test`,
        パスワード: a.account.password, 権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
      });
    }
  });
  PB管理者を用意した = true;
}

async function 作る({ browser, seed, notes }: SeedCtx, a: 作り方): Promise<void> {
  const seedId = seed.シードID;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const shop = await 本店の店名(browser);
  const m: FrontMember = {
    姓: a.姓 ?? "試験", 名: a.名 ?? "太郎", セイ: a.セイ ?? "シケン", メイ: a.メイ ?? "タロウ",
    メール: `${rc(a.メール)}@example.test`, パスワード: a.パスワード ?? PW,
    詳細: { 郵便番号1: "100", 郵便番号2: "0001", 都道府県: "東京都", 住所1: "千代田区千代田", 住所2: "1-1", 電話: ["03", "1234", "5678"] },
  };
  await 会員を登録して待つ(browser, m);
  const 会員ID = await withAdminSession(browser, SETUP_ADMIN, (page) => 会員IDを一覧から読む(page, m.メール));
  if (a.会員IDの呼び名) {
    if (notes.has(a.会員IDの呼び名)) issue(`${a.会員IDの呼び名} はほかのシードが先に控えている（正本の呼び名の重複）。このケースはシードの会員を直接使う`);
    else notes.set(a.会員IDの呼び名, 会員ID);
  }

  let 商品: 作った商品[] = [];
  if (a.商品.length) {
    if (a.PB) await PB管理者を用意する(browser);
    const defs: 商品の定め[] = a.商品.map((p) => ({
      商品コード: rc(p.コード), 商品名: rc(p.コード), 価格: p.価格 ?? "1000", 入庫数: p.入庫数, 入庫方法: p.入庫方法,
      仕入単価: p.仕入単価, 在庫変動理由: p.在庫変動理由, CSVの値: p.CSVの値,
    }));
    商品 = await 商品を作って入庫する(browser, seedId, defs, issue, a.PB ? { 登録者: PB_ADM, 承認者: PB_APR } : {});
    // 商品規格一覧で、取込で作られた規格を開き、部門は先頭・公開ステータスは公開で登録する（シード表の手順）
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      for (const p of 商品) {
        await openClassListByName(page, p.商品名);
        await publishImportedClass(page, p.商品コード, `${seedId}: ${p.商品コード} の商品規格`, issue);
      }
    });
    a.商品.forEach((p, i) => { if (p.商品IDの呼び名) notes.set(p.商品IDの呼び名, 商品[i].productId); });
  }

  // 専用ブラウザ（会員としてログインし、カートに入れる。開くときはご注文方法指定画面で支払方法を選ぶ）
  let cookies: Cookie[] = [];
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await frontLogin(page, m);
    if (!a.カートなし) {
      await clearCart(page, (d) => issue(`カートを空にするときの確認「${d}」`));
      for (const [i, p] of a.商品.entries()) await addToCart(page, 商品[i].productId, p.数量, `${seedId}: ${p.コード} をカートに入れる`);
      if (a.開く) {
        const c = new CheckoutPage(page);
        await c.買い物かごから開く();
        await c.支払方法を選ぶ(a.開く.支払方法);
      }
    }
    cookies = await context.cookies();
  } finally { await context.close(); }

  let 受注ID = "";
  if (a.開く) {
    受注ID = await withAdminSession(browser, SETUP_ADMIN, (page) => 処理中の受注IDを読む(page, m.メール, shop, seedId));
    if (!処理中受注ID一覧(会員ID).includes(受注ID)) throw new Error(`${seedId}: 受注情報検索で見つけた受注 ${受注ID} が会員の購入処理中の受注に無い`);
    if (a.受注IDの呼び名) notes.set(a.受注IDの呼び名, 受注ID);
  }
  準備済み.set(seedId, { 会員: m, 会員ID, 商品, cookies, 受注ID });
}

// ---- 環境（確かめるだけ。共有の設定は書き換えない） ----
defineSeed("S-F04-04-REF", async () => {
  const 表示中 = 表示中の支払方法名();
  if (!表示中.includes("銀行振込")) throw new Error(`支払方法「銀行振込」が表示中でない（表示中: ${表示中.join("、")}）。共有の設定は書き換えない`);
});
defineSeed("S-F04-04-PB-ENV", async () => {
  const 支払 = 表示中の支払方法名(); const 配送 = 表示中の配送方法名();
  if (!支払.includes("郵便振替")) throw new Error(`支払方法「郵便振替」が表示中でない（表示中: ${支払.join("、")}）。共有の設定は書き換えない`);
  if (!配送.includes("ゆうパック")) throw new Error(`配送方法「ゆうパック」が表示中でない（表示中: ${配送.join("、")}）。共有の設定は書き換えない`);
});
defineSeed("S-F04-04-PB-ADM", async ({ browser }) => { await PB管理者を用意する(browser); });
defineSeed("S-F04-04-PB-APR", async ({ browser }) => { await PB管理者を用意する(browser); });

// ---- 会員だけ（003） ----
defineSeed("S-F04-04-NO-ORDER-003", async (ctx) => {
  await 作る(ctx, { メール: "f0404-no-order-003", 商品: [], カートなし: true, 会員IDの呼び名: "〔会員ID-F0404-003〕" });
});

// ---- 銀行振込で購入処理中の受注まで作る ----
const 銀行振込 = { 支払方法: "銀行振込" };
const 在庫編集 = (コード: string, 数量: number, 入庫数: number, 仕入単価: string, CSVの値?: Record<string, string>): 商品の作り方 =>
  ({ コード, 数量, 入庫数, 入庫方法: "在庫編集", 仕入単価, 在庫変動理由: "結合テスト用", CSVの値 });
const 通常 = (n: string, メール: string, 商品: 商品の作り方[], extra: Partial<作り方> = {}) =>
  defineSeed(n, async (ctx) => {
    const k = n.slice(-3);
    // シード表が商品IDの呼び名〔商品ID-F0404-<番号>〕を定めるもの（商品1つ）は、作った商品の商品IDを控える
    const 商品ID = `〔商品ID-F0404-${k}〕`;
    const 商品2 = 商品.length === 1 && !商品[0].商品IDの呼び名 && getSeed(n).状態・属性.includes(商品ID) ? [{ ...商品[0], 商品IDの呼び名: 商品ID }] : 商品;
    await 作る(ctx, { メール, 商品: 商品2, 開く: 銀行振込, 会員IDの呼び名: `〔会員ID-F0404-${k}〕`, 受注IDの呼び名: `〔受注ID-F0404-${k}〕`, ...extra });
  });
通常("S-F04-04-NORMAL-021", "f0404-normal-021", [在庫編集("F0404-NORMAL-021", 3, 10, "500")]);
通常("S-F04-04-NORMAL-022", "f0404-normal-022", [在庫編集("F0404-NORMAL-022", 3, 10, "0")]);
通常("S-F04-04-NORMAL-027", "f0404-normal-027", [在庫編集("F0404-NORMAL-027", 3, 10, "0")]);
通常("S-F04-04-EXACT-047", "f0404-exact-047", [在庫編集("F0404-EXACT-047", 3, 3, "0", { "販売制限数": "3" })]);
通常("S-F04-04-CBCHKSTOCK-061", "cbf0404-stock-061", [在庫編集("CBF0404-STOCK-061", 2, 3, "0", { "販売制限数": "3" })]);
const タグつき = (コード: string, タグ: string | null, 呼び名: string): 商品の作り方 =>
  ({ コード, 数量: 1, 入庫数: 100, 入庫方法: "在庫変更CSV", 仕入単価: "100", 在庫変動理由: "シード作成", CSVの値: タグ ? { "売上分析タグ(ID)": タグ } : undefined, 商品IDの呼び名: 呼び名 });
通常("S-F04-04-TAGS-034", "f0404-tags-034", [タグつき("F0404-TAG-A-034", "31", "〔商品ID-F0404-034A〕"), タグつき("F0404-TAG-B-034", "32,33", "〔商品ID-F0404-034B〕")]);
通常("S-F04-04-TAGMIX-053", "f0404-tags-053", [タグつき("F0404-TAG-A-053", "31", "〔商品ID-F0404-053A〕"), タグつき("F0404-TAG-B-053", null, "〔商品ID-F0404-053B〕")]);

// ---- PB 系（在庫の連携の確認。カートに入れるだけ） ----
const PB品 = (コード: string, 数量: number, 仕入単価 = "500"): 商品の作り方 =>
  ({ コード, 数量, 価格: "2000", 入庫数: 10, 入庫方法: "在庫編集", 仕入単価, 在庫変動理由: "結合テスト用", CSVの値: { "サイズ": "100", "重量": "100", "販売制限数": "3" } });
const PB = (n: string, メール: string, パスワード: string, 姓: string, 商品: 商品の作り方[], extra: Partial<作り方> = {}) =>
  defineSeed(n, { needs: ["S-F04-04-PB-ADM", "S-F04-04-PB-APR"] }, async (ctx) => {
    await 作る(ctx, { メール, パスワード, 姓, 名: "太郎", セイ: "ザイコレンケイ", メイ: "タロウ", 商品, PB: true, ...extra });
  });
PB("S-F04-04-PB-STOCK-040", "f0404pb-001", "Passw0rd!001", "在庫連携F0404PB001", [PB品("F0404PB-001", 3)]);
PB("S-F04-04-PB-HIST-041", "f0404pb-002", "Passw0rd!002", "在庫連携F0404PB002", [PB品("F0404PB-002", 3)]);
PB("S-F04-04-PB-CUM-042", "f0404pb-003", "Passw0rd-003", "累計連携F0404PB003", [PB品("F0404PB-003", 3)], { セイ: "ルイケイレンケイ", 会員IDの呼び名: "〔会員ID-F0404-003〕" });
PB("S-F04-04-DPSTOCK-043", "dpf0404-043", "Passw0rd-F0404043", "在庫連携F0404DP043", [PB品("F0404DP-043", 1)]);
PB("S-F04-04-DPHIST-044", "dpf0404-044", "Passw0rd-F0404044", "在庫連携F0404DP044", [PB品("F0404DP-044", 1)]);
PB("S-F04-04-DPSTOCK-045", "dpf0404-045", "Passw0rd-F0404045", "在庫連携F0404DP045", [PB品("F0404DP-045A", 1), PB品("F0404DP-045B", 2, "400")]);
PB("S-F04-04-DPHIST-046", "dpf0404-046", "Passw0rd-F0404046", "在庫連携F0404DP046", [PB品("F0404DP-046A", 1), PB品("F0404DP-046B", 2, "400")]);
PB("S-F04-04-DPSTOCK-054", "dpf0404-054", "Passw0rd-F0404054", "在庫連携F0404DP054", [PB品("F0404DP-054", 3)]);
PB("S-F04-04-DPHIST-055", "dpf0404-055", "Passw0rd-F0404055", "在庫連携F0404DP055", [PB品("F0404DP-055", 3)]);
