/**
 * F06-26 店頭PC用アカウント制御の画面シード。正本: cases/F06-26_seed_data.tsv
 * 実装するのはケース 016 が使う GROUPS・DPENV-016・DPVIEW-016 だけ。
 *
 * - GROUPS（共有可）: 顧客グループ管理で「店内アカウント」「支店店内アカウント」「通常会員」があれば区分を確かめて使い、無ければ登録する。
 *   名称を押して開いた編集画面のアドレスの末尾の番号を控える。区分が違う同じ名称があれば落とす（共有の顧客グループを書き換えない）。
 * - DPENV-016: 店舗設定のお気に入り商品機能（共有の設定）は書き換えず、有効であることを画面で確かめるだけ（条件付き。F06-09 の ENV と同じ扱い）。
 * - DPVIEW-016: グッズ商品CSV登録で在庫0の商品を作り、取り込みで作られた商品規格を公開で登録する。会員は本店の新規会員登録画面で登録し、
 *   管理画面で本会員にする（pages/admin/member_activate.ts）。会員登録/編集で顧客グループ「通常会員」を選んで登録する。
 *   商品コード・商品名と会員のメールアドレスの前半には実行の印を付ける（依頼者決定 2026-10-28）。
 *
 * 作らないシード: MAIL（≪共有の設定≫のメール試験サーバー）・NOTIFY-014・DPNOTIFY-017・CBNOFAV-018・CBNOSALE-019（セール通知のバッチを実行コンソールで起動するケース用）、
 * FGIP・FGSHOPS・FGRESTRICT-020/021・FGORDER-022・FGBUTTON-023・FGTICKET-024・FGREFLECT-025（本店・支店の店頭用アカウントIPアドレスと本店の公開・開店を書き換える。021 は所属店舗を DB で設定）。
 */
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { withAdminSession } from "../lib/session";
import { savePublishedClass } from "../pages/admin/f03_07_restock";
import { readFavoriteOption } from "../pages/admin/f03_08_masters";
import { 会員の顧客グループを選ぶ, 顧客グループを用意する } from "../pages/admin/f06_26_setup";
import { 会員を登録して本会員にする } from "../pages/admin/member_activate";
import { downloadGoodsCsvTemplate } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode, readGoodsRootCategoryId } from "../pages/admin/m03_23_seed_products";
import { markedMail } from "./f06-member";

// ---- 顧客グループ ----

defineSeed("S-F06-26-GROUPS", async ({ browser, notes, seed }) => {
  const made: string[] = [];
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const [名称, 店内注文専用, 支店店内注文専用, label] of [
      ["店内アカウント", true, false, "〔顧客グループID-F0626-共有A〕"],
      ["支店店内アカウント", false, true, "〔顧客グループID-F0626-共有B〕"],
      ["通常会員", false, false, "〔顧客グループID-F0626-共有C〕"],
    ] as const) {
      const r = await 顧客グループを用意する(page, 名称, { 店内注文専用, 支店店内注文専用 });
      notes.set(label, r.id);
      made.push(`「${名称}」ID ${r.id}（${r.作った ? "登録した。ポイント還元率は0" : "既にあったものを区分を確かめて使った"}）`);
    }
  });
  reportSeedIssue(seed.シードID, `顧客グループ: ${made.join("、")}`);
});

// ---- お気に入り商品機能（確かめるだけ） ----

defineSeed("S-F06-26-DPENV-016", async ({ browser, seed }) => {
  const on = await withAdminSession(browser, SETUP_ADMIN, (page) => readFavoriteOption(page));
  if (!on) throw new Error("店舗設定のお気に入り商品機能が無効。共有の設定は書き換えないので、有効にしてから流す");
  reportSeedIssue(seed.シードID, "店舗設定のお気に入り商品機能は共有の設定なので保存せず、有効であることを画面で確かめた（条件付き）");
});

// ---- 通常会員と売り切れ商品（016） ----

export type 作った商品 = { productId: string; classId: string; code: string };
const products = new Map<string, 作った商品>();
/** シード表の商品コード（正本の値）から、シードが作った商品を引く */
export function productOf(正本の商品コード: string): 作った商品 {
  const p = products.get(rc(正本の商品コード));
  if (!p) throw new Error(`商品コード ${正本の商品コード} の商品はまだ作っていない`);
  return p;
}
/** シード表のメールアドレスの前半（正本の値）に実行の印を付けたメールアドレス */
export const mailOf = (正本の前半: string): string => markedMail(正本の前半);

defineSeed("S-F06-26-DPVIEW-016", { needs: ["S-F06-26-GROUPS"] }, async ({ browser, notes, seed }) => {
  const seedId = seed.シードID;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const code = rc("F0626-SOLD-016");
  // 商品（在庫0）
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const categoryId = await readGoodsRootCategoryId(page);
    const template = await downloadGoodsCsvTemplate(page);
    const region = Object.fromEntries(template.headers.filter((h) => h.includes("地域")).map((h) => [h, "0"]));
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId,
      common: { ...region, "スマレジ連携フラグ": "0", "原価単価": "10" },
      lines: [{ code, nameJp: code, nameEn: code, values: { "基準価格": "1000", "販売価格": "1000", "買取価格": "100" } }],
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`),
    });
    const productId = await openProductEditByCode(page, code);
    const rows = await classRowsFromProductEdit(page, productId);
    if (rows.length !== 1 || rows[0].商品コード !== code) throw new Error(`${seedId}: 取込直後の商品規格が1件でない: ${JSON.stringify(rows)}`);
    await savePublishedClass(page, { productId, classId: rows[0].商品規格ID }, `${seedId}: ${code}`, issue);
    products.set(code, { productId, classId: rows[0].商品規格ID, code });
    issue(`商品 ${code}（商品ID ${productId}・商品規格ID ${rows[0].商品規格ID}）をグッズ商品CSV登録で作り、商品規格を公開で登録した。入庫はしていない（在庫0）。基準価格・販売価格1000・買取価格100・サイズ1・重量1・カテゴリはサプライ・グッズ（シード表は「有効な値」とだけ定める）`);
  });
  // 会員（通常会員）
  const mail = mailOf("dpf0626-016-a");
  const id = await 会員を登録して本会員にする(browser, {
    姓: "F06-26", 名: "会員016", セイ: "シケン", メイ: "カイイン", メール: mail, パスワード: "Passw0rd-F0626016",
  }, issue);
  notes.set("〔会員ID-F0626-016〕", id);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await 会員の顧客グループを選ぶ(page, id, notes.get("〔顧客グループID-F0626-共有C〕"));
  });
  issue(`会員 ${mail}（会員ID ${id}）の顧客グループを「通常会員」にして登録した。お気に入り・入荷通知依頼は登録していない`);
});
