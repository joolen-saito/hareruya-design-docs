/**
 * M10-06 配送方法設定 のシード（実装したケースが使うもの）。正本: cases/M10-06_seed_data.tsv
 * - 名称は決め打ちの識別の値なので実行の印を付ける（rc）。支払方法「連携支払L」も印つきで、実行ごとに1度だけ作る。
 * - 正本の作り方の「全国一律送料を入れて各都道府県に適用ボタンを押す」は、画面にその入力欄・ボタンが無いので、
 *   都道府県別送料の「新規登録」の行を47回使って、47都道府県すべての送料を800にした（シードの作り方の解釈）。
 * - メールテンプレートは、元からある注文確認（銀行振込）で代える（M10-04 と同じ）。
 */
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { rc } from "../lib/run_marker";
import { DeliveryPage } from "../pages/admin/m10_06_delivery";
import { 支払方法を作る } from "./m10-04";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1006L_ADMIN: Account = { loginId: "m1006l_admin", password: "Passw0rd!M1006L" };
export const 連携支払L = () => rc("連携支払L");
export const 配送名 = {
  d002: () => rc("連携配送L002M1006n002"), d005: () => rc("料金更新M1006-005-A"), d006: () => rc("適用確認M1006-006-A"),
  d009: () => rc("除外確認M1006-009-A"), d010: () => rc("支払選択M1006-010-D"), d021: () => rc("M1006-CB021-配送A"),
  d025: () => rc("削除取消M1006-FG025-A"), d029: () => rc("支払未選択M1006-FG029-A"),
};
export const 支払名 = { a: () => rc("支払M1006-010-A"), b: () => rc("支払M1006-010-B"), c: () => rc("支払M1006-010-C"), 条件付: () => rc("条件付支払M1006-CB021-A") };

defineSeed("S-M10-06-L-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M10-06連携試験管理者", account: M1006L_ADMIN, メール: "m1006l_admin@example.test" });
});
defineSeed("S-M10-06-L-PAY", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await 支払方法を作る(page, { 方法: 連携支払L(), 英: "LinkPayment-L", 手数料: "0" }); });
  reportSeedIssue(seed.シードID, "メールテンプレートは、選択肢の先頭ではなく、元からある注文確認（銀行振込）の日本語・英語にした");
});

async function 配送を作る(browser: import("@playwright/test").Browser, seedId: string, 業者名: string, 英: string, 支払: string[], notes?: { set(l: string, v: string): void }, 控え?: string, 除外 = false): Promise<void> {
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return new DeliveryPage(page).作る({ 配送業者名: 業者名, 名称: 業者名, 英語名称: 英, 支払方法: 支払, 送料: "800", 出荷指示から除外: 除外 });
  });
  if (notes && 控え) notes.set(控え, id);
  reportSeedIssue(seedId, "全国一律送料の入力欄・適用ボタンが画面に無いので、都道府県別送料の新規登録の行で47都道府県の送料を800にした");
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
