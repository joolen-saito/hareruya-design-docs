/**
 * M10-06 配送方法設定 のシード（実装したケースが使うもの）。正本: cases/M10-06_seed_data.tsv
 * - 名称は決め打ちの識別の値なので実行の印を付ける（rc）。支払方法「連携支払L」も印つきで、実行ごとに1度だけ作る。
 * - 正本の作り方の「全国一律送料を入れて各都道府県に適用ボタンを押す」は、画面にその入力欄・ボタンが無いので、
 *   都道府県別送料の「新規登録」の行を47回使って、47都道府県すべての送料を800にした（シードの作り方の解釈）。
 * - メールテンプレートは、元からある注文確認（銀行振込）で代える（M10-04 と同じ）。
 */
import { SETUP_ADMIN } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { query } from "../lib/db";
import { 受注を整える } from "../db/m05_01_order_write";
import { 受注を作る } from "./m05-01";
import { rc } from "../lib/run_marker";
import { expectSaved } from "../pages/admin/common";
import { DeliveryPage } from "../pages/admin/m10_06_delivery";
import { 支払方法を作る } from "./m10-04";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1006L_ADMIN: Account = { loginId: "m1006l_admin", password: "Passw0rd!M1006L" };
export const 連携支払L = () => rc("連携支払L");
export const 配送名 = {
  d002: () => rc("連携配送L002M1006n002"), d005: () => rc("料金更新M1006-005-A"), d006: () => rc("適用確認M1006-006-A"),
  d009: () => rc("除外確認M1006-009-A"), d010: () => rc("支払選択M1006-010-D"), d021: () => rc("M1006-CB021-配送A"),
  d025: () => rc("削除取消M1006-FG025-A"), d029: () => rc("支払未選択M1006-FG029-A"),
  d001: () => rc("連携配送L001M1006n001"), d003: () => rc("連携配送L003M1006n003"), d004: () => rc("連携配送L004M1006n004"),
  d007: () => rc("ID表示M1006-007-A"), d008: () => rc("検証配送M1006-008-A"), d011: () => rc("時間設定M1006-011-D"),
  d012: () => rc("行追加M1006-012-A"), d013: () => rc("地域未選択M1006-013-A"), d014: () => rc("サイズ不正M1006-014-A"),
  d015: () => rc("送料未入力M1006-015-A"), d016: () => rc("送料不正M1006-016-A"), d017: () => rc("新規送料M1006-017-A"),
  d019: () => rc("二行追加M1006-019-A"), d020: () => rc("M1006-CB020-配送A"),
  d022a: () => rc("新規先頭M1006-FG022-A"), d022b: () => rc("新規先頭M1006-FG022-B"),
  d023x: () => rc("並替M1006-FG023-X"), d023y: () => rc("並替M1006-FG023-Y"), d024x: () => rc("並替M1006-FG024-X"), d024y: () => rc("並替M1006-FG024-Y"),
  d026: () => rc("使用中M1006-FG026-A"), d031: () => rc("行削除M1006-FG031-A"),
};
export const 支払名 = { a: () => rc("支払M1006-010-A"), b: () => rc("支払M1006-010-B"), c: () => rc("支払M1006-010-C"), 条件付: () => rc("条件付支払M1006-CB021-A"), 条件付020: () => rc("条件付支払M1006-CB020-A") };

defineSeed("S-M10-06-L-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M10-06連携試験管理者", account: M1006L_ADMIN, メール: "m1006l_admin@example.test" });
});
defineSeed("S-M10-06-L-PAY", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await 支払方法を作る(page, { 方法: 連携支払L(), 英: "LinkPayment-L", 手数料: "0" }); });
  reportSeedIssue(seed.シードID, "メールテンプレートは、選択肢の先頭ではなく、元からある注文確認（銀行振込）の日本語・英語にした");
});

async function 配送を作る(browser: import("@playwright/test").Browser, seedId: string, 業者名: string, 英: string, 支払: string[], notes?: { set(l: string, v: string): void }, 控え?: string, 除外 = false): Promise<string> {
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return new DeliveryPage(page).作る({ 配送業者名: 業者名, 名称: 業者名, 英語名称: 英, 支払方法: 支払, 送料: "800", 出荷指示から除外: 除外 });
  });
  if (notes && 控え) notes.set(控え, id);
  reportSeedIssue(seedId, "全国一律送料の入力欄・適用ボタンが画面に無いので、都道府県別送料の新規登録の行で47都道府県の送料を800にした");
  return id;
}
const NEED = ["S-M10-06-L-PAY"];
defineSeed("S-M10-06-L-DEL-002", { needs: NEED }, async ({ browser, notes, seed }) => { await 配送を作る(browser, seed.シードID, 配送名.d002(), "LinkDelivery-L002", [連携支払L()], notes, "〔配送方法ID-M1006-002〕"); });
defineSeed("S-M10-06-FEE-005", { needs: NEED }, async ({ browser, notes, seed }) => { await 配送を作る(browser, seed.シードID, 配送名.d005(), "FeeUpdate-M1006-005-B", [連携支払L()], notes, "〔配送方法ID-M1006-005〕"); });
defineSeed("S-M10-06-APPLY-006", { needs: NEED }, async ({ browser, notes, seed }) => { await 配送を作る(browser, seed.シードID, 配送名.d006(), "ApplyCheck-M1006-006-B", [連携支払L()], notes, "〔配送方法ID-M1006-006〕"); });
defineSeed("S-M10-06-EXCL-009", { needs: NEED }, async ({ browser, notes, seed }) => { await 配送を作る(browser, seed.シードID, 配送名.d009(), "ExcludeCheck-M1006-009-B", [連携支払L()], notes, "〔配送方法ID-M1006-009〕"); });
defineSeed("S-M10-06-FGDELCANCEL-025", { needs: NEED }, async ({ browser, seed }) => { await 配送を作る(browser, seed.シードID, 配送名.d025(), "CancelDelFg-M1006-FG025-A", [連携支払L()]); });
defineSeed("S-M10-06-FGNOPAY-029", { needs: NEED }, async ({ browser, seed }) => { await 配送を作る(browser, seed.シードID, 配送名.d029(), "NoPayFg-M1006-FG029-A", [連携支払L()]); });
defineSeed("S-M10-06-PAYSEL-010", { needs: NEED }, async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const [n, e] of [[支払名.a(), "Pay-M1006-010-A"], [支払名.b(), "Pay-M1006-010-B"], [支払名.c(), "Pay-M1006-010-C"]] as const) await 支払方法を作る(page, { 方法: n, 英: e, 手数料: "0" });
  });
  await 配送を作る(browser, seed.シードID, 配送名.d010(), "PaySelect-M1006-010-E", [支払名.a(), 支払名.b()], notes, "〔配送方法ID-M1006-010〕");
});
defineSeed("S-M10-06-CBEXIST-021", { needs: NEED }, async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await 支払方法を作る(page, { 方法: 支払名.条件付(), 英: "CondPayM1006-CB021-A", 手数料: "0", 下限: "1000" }); });
  await 配送を作る(browser, seed.シードID, 配送名.d021(), "DeliveryM1006-CB021-B", [連携支払L()]);
});

// ---- 残りのケースのシード ----
// 「登録されていない状態」のシードは、印つきの名称が無いことで成り立つので、作らない（何もしない）。
defineSeed("S-M10-06-L-CLEAN-001", async () => {});
defineSeed("S-M10-06-REG-008", async () => {});
defineSeed("S-M10-06-NEWFEE-017", async () => {});
// CBNEW-020 の支払方法「条件付支払M1006-CB020-A」（利用条件の下限1000）は、画面で作る
defineSeed("S-M10-06-CBNEW-020", { needs: NEED }, async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await 支払方法を作る(page, { 方法: 支払名.条件付020(), 英: "CondPayM1006-CB020-A", 手数料: "0", 下限: "1000" }); });
});
defineSeed("S-M10-06-FGNEWTOP-022", { needs: NEED }, async ({ browser, seed }) => { await 配送を作る(browser, seed.シードID, 配送名.d022b(), "NewTopFg-M1006-FG022-B", [連携支払L()]); });
defineSeed("S-M10-06-FGSORTOK-023", { needs: NEED }, async ({ browser, seed }) => {
  await 配送を作る(browser, seed.シードID, 配送名.d023x(), "SortFg-M1006-FG023-X", [連携支払L()]);
  await 配送を作る(browser, seed.シードID, 配送名.d023y(), "SortFg-M1006-FG023-Y", [連携支払L()]);
});
defineSeed("S-M10-06-FGSORTNG-024", { needs: NEED }, async ({ browser, seed }) => {
  await 配送を作る(browser, seed.シードID, 配送名.d024x(), "SortFg-M1006-FG024-X", [連携支払L()]);
  await 配送を作る(browser, seed.シードID, 配送名.d024y(), "SortFg-M1006-FG024-Y", [連携支払L()]);
});
defineSeed("S-M10-06-IDSHOW-007", { needs: NEED }, async ({ browser, seed }) => {
  await 配送を作る(browser, seed.シードID, 配送名.d007(), "IdShow-M1006-007-B", [連携支払L()]);
  reportSeedIssue(seed.シードID, "配送方法ID 9106507 は画面で指定できないので、画面が振った配送方法IDに読み替えた（ケースは、一覧の行のID欄が、その行のリンクの配送方法IDと同じであることで確かめる）");
});
defineSeed("S-M10-06-TIME-011", { needs: NEED }, async ({ browser, notes, seed }) => { await 配送を作る(browser, seed.シードID, 配送名.d011(), "TimeSet-M1006-011-E", [連携支払L()], notes, "〔配送方法ID-M1006-011〕"); });
defineSeed("S-M10-06-ADDROW-012", { needs: NEED }, async ({ browser, notes, seed }) => { await 配送を作る(browser, seed.シードID, 配送名.d012(), "AddRow-M1006-012-B", [連携支払L()], notes, "〔配送方法ID-M1006-012〕"); });
defineSeed("S-M10-06-REGION-013", { needs: NEED }, async ({ browser, notes, seed }) => { await 配送を作る(browser, seed.シードID, 配送名.d013(), "NoRegion-M1006-013-B", [連携支払L()], notes, "〔配送方法ID-M1006-013〕"); });
defineSeed("S-M10-06-SIZE-014", { needs: NEED }, async ({ browser, notes, seed }) => { await 配送を作る(browser, seed.シードID, 配送名.d014(), "BadSize-M1006-014-B", [連携支払L()], notes, "〔配送方法ID-M1006-014〕"); });
defineSeed("S-M10-06-FEEBLANK-015", { needs: NEED }, async ({ browser, notes, seed }) => { await 配送を作る(browser, seed.シードID, 配送名.d015(), "NoFee-M1006-015-B", [連携支払L()], notes, "〔配送方法ID-M1006-015〕"); });
defineSeed("S-M10-06-FEEALPHA-016", { needs: NEED }, async ({ browser, notes, seed }) => { await 配送を作る(browser, seed.シードID, 配送名.d016(), "BadFee-M1006-016-B", [連携支払L()], notes, "〔配送方法ID-M1006-016〕"); });
defineSeed("S-M10-06-DP-TWOROWS-019", { needs: NEED }, async ({ browser, notes, seed }) => { await 配送を作る(browser, seed.シードID, 配送名.d019(), "TwoRows-M1006-019-B", [連携支払L()], notes, "〔配送方法ID-M1006-019〕"); });
defineSeed("S-M10-06-FGFEEDEL-031", { needs: NEED }, async ({ browser, seed }) => {
  await 配送を作る(browser, seed.シードID, 配送名.d031(), "DelRowFg-M1006-FG031-A", [連携支払L()]);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const d = new DeliveryPage(page);
    await d.編集を開く(配送名.d031());
    await d.送料の行を足す({ 地域: "東京都", サイズ: "60", 送料: "1500" });
    await d.登録を押す();
    await expectSaved(page, "東京都の行（サイズ60・送料1500）の追加");
  });
});

// 受注つき（納品書・削除できない配送方法）。受注は M05-01 と同じ方法で、本店の画面で試験用の会員が注文し、その受注の配送方法を DB で、作った配送方法に付け替える（印つきの受注だけ）
const 作った受注 = new Map<string, { 注文番号: string; 受注ID: string }>();
export function 受注の取得(キー: string): { 注文番号: string; 受注ID: string } {
  const o = 作った受注.get(キー);
  if (!o) throw new Error(`受注「${キー}」をまだ作っていない`);
  return o;
}
async function 受注つき配送を作る(
  ctx: { browser: import("@playwright/test").Browser; notes: { set(l: string, v: string): void }; seed: { シードID: string } },
  キー: string, 業者名: string, 英: string, 控え: string, 正本の注文番号: string,
): Promise<void> {
  const seedId = ctx.seed.シードID;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 配送ID = await 配送を作る(ctx.browser, seedId, 業者名, 英, [連携支払L()], ctx.notes, 控え);
  const o = await 受注を作る(ctx.browser, seedId, "注文受領", issue);
  const r = query(`select count(*) as n from dtb_player p join dtb_order o on o.customer_id = p.customer_id where o.id = $1::int`, [o.受注ID]);
  if (Number(r[0]?.n ?? 0) === 0) throw new Error(`${seedId}: 受注の会員にプレイヤーが無い（納品書は会員とプレイヤーの両方を持つ受注だけが対象）`);
  const 済 = 受注を整える(o.受注ID, { 配送先: { 配送方法ID: 配送ID, 配送方法名: 業者名 } });
  作った受注.set(キー, o);
  issue(`読み替え: 注文番号 ${正本の注文番号} は画面で指定できないので、本店の画面で試験用の会員が注文した受注の注文番号 ${o.注文番号} に読み替えた。会員・プレイヤー・商品・明細もその注文が作ったもの（シード表の固定ID・価格1000・数量1・受注日は再現していない。ケースは注文番号で検索する）`);
  issue(`DBで、その受注の配送方法を作った配送方法に付け替えた（${済.join("・")}。印つきの受注だけ）。対応状況は注文直後のまま（新規受付に当たる）`);
}
defineSeed("S-M10-06-L-ORD-003", { needs: [...NEED, "S-M05-01-ADM"] }, async (ctx) => { await 受注つき配送を作る(ctx, "003", 配送名.d003(), "LinkDelivery-L003", "〔配送方法ID-M1006-003〕", "LNK-ORD-003"); });
defineSeed("S-M10-06-L-ORD-004", { needs: [...NEED, "S-M05-01-ADM"] }, async (ctx) => { await 受注つき配送を作る(ctx, "004", 配送名.d004(), "LinkDelivery-L004", "〔配送方法ID-M1006-004〕", "LNK-ORD-004"); });
defineSeed("S-M10-06-FGDELUSED-026", { needs: [...NEED, "S-M05-01-ADM"] }, async (ctx) => { await 受注つき配送を作る(ctx, "026", 配送名.d026(), "InUseFg-M1006-FG026-A", "〔配送方法ID-M1006-026〕", "FGM1006-ORD-026"); });
