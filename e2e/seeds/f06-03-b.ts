/**
 * F06-03 ログインの続き（-b）の画面シード（005・006・043〜045）。正本: cases/F06-03_seed_data.tsv
 *
 * - 会員（AUTH-005・006、REMEMBERED-043〜045）: seeds/f06-03.ts と同じ作り方（フロントの会員登録＋本登録のメール＋管理画面の会員一覧で会員IDを控える）。
 *   REMEMBERED の「保持Cookieあり・完全なログインセッションなし」の状態は、シード表のとおりケースの事前準備で作る（spec の開始時）。
 * - 商品（PRODUCT）: グッズ商品CSV登録で2行（F0603-NOTIFY・F0603-FAVORITE）を1回で取り込み、取込で作られた商品規格が公開でなければ公開にする（F03-07 と同じ作り方）。
 *   在庫は登録しない（在庫数0）。そのあと、ログアウトした本店の商品詳細画面で「入荷時に通知」「お気に入りに追加する」が出ることを確かめる。
 *   商品コード・商品名には実行の印を付ける（依頼者決定 2026-10-28）。商品名はシード表が「任意の有効な値」なので商品コードと同じにした。
 *   商品ID・商品規格IDはシード表が控えると定めていないので、呼び名では控えず、このファイルの中だけで持ち回す。
 */
import { BASE_URL } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { hideDebugToolbar } from "../lib/session";
import { FrontFavorite } from "../pages/front/f03_08_favorite";
import { FrontRestock } from "../pages/front/f03_07_restock_notify";
import { createProducts } from "./f03-07";
import { PW, 会員を作る } from "./f06-03";

for (const k of ["005", "006", "043", "044", "045"]) {
  const seedId = Number(k) < 40 ? `S-F06-03-AUTH-${k}` : `S-F06-03-REMEMBERED-${k}`;
  defineSeed(seedId, async ({ browser, notes }) => { await 会員を作る(browser, notes, `f0603-base-${k}`, PW, `〔会員ID-F0603-${k}〕`); });
}

export type 作った商品 = { productId: string; classId: string };
const 商品 = new Map<string, 作った商品>();
/** 正本の商品コード（F0603-NOTIFY・F0603-FAVORITE）から、シードが作った商品を引く */
export function 商品の(code: string): 作った商品 {
  const p = 商品.get(code);
  if (!p) throw new Error(`商品 ${code} はまだ作っていない（S-F06-03-PRODUCT）`);
  return p;
}

defineSeed("S-F06-03-PRODUCT", async ({ browser }) => {
  if (商品.size === 2) return;
  const seedId = "S-F06-03-PRODUCT";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const codes = ["F0603-NOTIFY", "F0603-FAVORITE"];
  const made = await createProducts(browser, "F06-03 の商品", codes.map((c) => ({ name: c, classes: [{ code: c }] })), issue);
  made.forEach((m, i) => 商品.set(codes[i], { productId: m.productId, classId: m.classIds[0] }));

  // ログアウトした本店の商品詳細画面で、ボタンが出ることを確かめる
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctx);
    const page = await ctx.newPage();
    const n = 商品の("F0603-NOTIFY");
    const r = new FrontRestock(page);
    await r.openDetail(n.productId);
    if (!(await r.classButton(n.classId).isVisible())) throw new Error(`F0603-NOTIFY（商品ID ${n.productId}）の商品詳細画面に「入荷時に通知」が表示されない`);
    const f = 商品の("F0603-FAVORITE");
    const fav = new FrontFavorite(page);
    await fav.openDetail(f.productId);
    if (!(await fav.お気に入りボタン.isVisible())) throw new Error(`F0603-FAVORITE（商品ID ${f.productId}）の商品詳細画面に「お気に入りに追加する」が表示されない`);
  } finally { await ctx.close(); }
});
