/**
 * F01-02 支店ECTOP のシード（支店だけを作るもの・SALE中の商品）。正本: cases/F01-02_seed_data.tsv
 *
 * 支店は使い回す（依頼者の指示 2026-11-12「毎回作らずに1個でいけるやつは使い回す」。店舗は消せず、1店作るごとに店舗別の在庫の行が大量にできる）:
 * - シード表はケースごとに支店を作るとするが、決まった名前の試験支店「F0102試験支店-E2E」（公開。共有の設定を書き換えるケースと同じ1店）を全部のケースで使う。
 *   006（非公開の支店）だけは、公開の区分そのものを確かめるので、決まった名前の非公開の支店「F0102非公開支店-E2E」1店を使う。どちらも無ければ1度だけ作る。
 * - ケースの初めに、試験支店の中身をそのケースの状態にそろえる（pages/admin/f01_02_branch_reset.ts）: 前のケース・前の回が作った F01-02 の商品を
 *   「非公開・支店も非公開」にし、残っていないことを確かめてから、このケースの商品を作る。
 * - 在庫を申請・承認する管理者も、試験支店の決まった管理者2人（f0102rshe2e・f0102ashe2e）を使い回す（以前はケースごと・実行ごとに2人作っていた）。
 * - 店舗一覧のIDは、シード表の呼び名〔支店ID-F0102-<番号>〕に控える（どの番号も同じ試験支店のID）。
 * 店舗登録は保存されたうえでシステムエラーの画面になることがある（店舗一覧に出ていれば先へ進み、報告する）。
 */
import { SETUP_ADMIN } from "../config/env";
import { FIXED_MARK, rc, rcFixed } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { withAdminSession } from "../lib/session";
import { findTenantId } from "../pages/admin/tenant_k";
import { 店舗の設定をケースの間だけ書き換える } from "../pages/admin/store_setting_restore";
import { 店舗の実際を読む, 読み替えの文 } from "../lib/store_pick";
import { Browser, Page } from "@playwright/test";
import { downloadGoodsCsvTemplate, readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { タグを付けて商品を登録する, 規格のセールを設定する, 管理者 } from "../pages/admin/f01_02_setup";
import { F0102試験支店, F0102試験支店を用意する, 試験支店の管理者 } from "../pages/admin/f01_02_layout";
import { 店舗のX公式アカウントURLをそろえる, 店舗の公開を確かめる, 試験支店の商品をそろえる } from "../pages/admin/f01_02_branch_reset";
import { searchStockByCode } from "../pages/admin/m04_02_rc_stock";
import { loggedInMemberName, registerStockEdit, StockApprovalListPage } from "../pages/admin/stock_edit";

/** 非公開の支店を使うケースの番号（公開の区分そのものを確かめる） */
const 非公開の番号 = "006";
/** 店舗は作らない（依頼者 2026-11-15）。非公開の店舗は使い回す店舗の表の 店舗ID 4974（非公開・閉店。開店の非公開は表に無い） */
const 非公開支店ID = "4974";
const 非公開支店 = { get 店名(): string { return 店舗の実際を読む(非公開支店ID).店名; }, get 支店URL(): string { return 店舗の実際を読む(非公開支店ID).支店URL; } };
/** ケース n が開く支店の支店URL（006 は非公開の支店、ほかは全部同じ試験支店） */
export const 支店URL = (n: string): string => (n === 非公開の番号 ? 非公開支店.支店URL : F0102試験支店.支店URL);
const 略称 = (s: string): string => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; const L = "ABCDEFGHJKLMNPQRSTUVWXYZ"; return [h % 24, (h >>> 5) % 24, (h >>> 10) % 24].map((i) => L[i]).join(""); };
/** ケース n の支店の店名（006 は非公開の支店、ほかは全部同じ試験支店） */
export const 支店名 = (n: string): string => (n === 非公開の番号 ? 非公開支店.店名 : F0102試験支店.店名);

/**
 * ケース n の支店を用意し、店舗IDを返す（決まった名前で無ければ1度だけ作り、あれば使い回す）。
 * - 006 は非公開の支店（公開の区分が「非公開」であることを店舗登録画面で確かめる）。
 * - ほかは試験支店。X公式アカウントURL の指定（067）があれば、店舗登録画面でその値にそろえる。
 * - 試験支店のときは、ケースの初めとして、前のケース・前の回の商品を外す（試験支店の商品をそろえる）。
 */
export async function 決まった支店を用意する(page: Page, n: string, issue: (m: string) => void, 他: { 公開?: "公開" | "非公開"; X公式アカウントURL?: string } = {}): Promise<string> {
  if (n === 非公開の番号 || 他.公開 === "非公開") {
    if (n !== 非公開の番号) throw new Error(`支店 ${n} に非公開の指定がある（非公開の支店は ${非公開の番号} だけが使う）`);
    const { 店名 } = 非公開支店;
    const id = (await findTenantId(page, 店名)) ?? "";
    if (id !== 非公開支店ID) throw new Error(`非公開の支店（店舗ID ${非公開支店ID}）が店舗一覧に無い`);
    // 非公開・開店の店舗は表に無いので、E2E の店舗 4974（非公開・閉店）をケースの間だけ開店にして表す（終わりに閉店へ戻す。依頼者 2026-11-15）
    await 店舗の設定をケースの間だけ書き換える(page, id, { 開店: "開店" }, `支店 ${n}（${店名}）を開店にする`, issue);
    issue(読み替えの文("テスト支店B（非公開・開店）", { id, 店名 }, "公開=非公開のまま、開店をケースの間だけ「開店」にして正本の状態にした"));
    await 店舗の公開を確かめる(page, id, "非公開", `支店 ${n}（${店名}）`);
    issue(`非公開の支店は、決まった名前の「${店名}」（店舗ID ${id}）を使い、公開の区分が「非公開」であることを店舗登録画面で確かめた`);
    return id;
  }
  const id = await F0102試験支店を用意する(page, issue);
  if (他.X公式アカウントURL) await 店舗のX公式アカウントURLをそろえる(page, id, 他.X公式アカウントURL, `支店 ${n} の X公式アカウントURL`, issue);
  await 試験支店の商品をそろえる(page, `支店 ${n} のケースの初めに試験支店の商品をそろえる`, issue);
  return id;
}

/** 試験支店の在庫を申請・承認する決まった管理者（実行の中で1度だけ確かめる） */
let 管理者の控え: Promise<{ 登録者: 管理者; 承認者: 管理者 }> | null = null;
export function 試験支店の決まった管理者(browser: Browser): Promise<{ 登録者: 管理者; 承認者: 管理者 }> {
  if (!管理者の控え) {
    管理者の控え = withAdminSession(browser, SETUP_ADMIN, (page) => 試験支店の管理者(page));
    管理者の控え.catch(() => { 管理者の控え = null; });
  }
  return 管理者の控え;
}

/**
 * 在庫編集承認一覧で、決まった管理者（登録者）の未承認の行を全部承認する。
 * 登録者は試験支店だけの E2E の管理者なので、未承認の行はどれも E2E の商品（前の回の残りがあれば合わせて承認する）。
 */
export async function 決まった登録者の在庫を承認する(browser: Browser, 承認者: 管理者, 登録者の名前: string, 件数: number, seedId: string, issue: (m: string) => void): Promise<void> {
  if (件数 === 0) return;
  await withAdminSession(browser, 承認者.account, async (ap) => {
    const list = new StockApprovalListPage(ap);
    await list.open(F0102試験支店.店名);
    const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === 登録者の名前);
    if (rows.length < 件数) throw new Error(`${seedId}: 在庫編集の未承認の行が ${rows.length} 件（${件数} 件のはず）`);
    const ids = rows.map((r) => r.id);
    try {
      await list.approve(ids, `${seedId}: 在庫編集の承認`, issue);
    } catch (e) {
      // 承認の成功の表示が出なかったとき、承認の一覧で承認済みになったかを確かめる（なっていれば先へ進み、報告する）
      await list.open(F0102試験支店.店名);
      const after = (await list.rowValues()).filter((r) => ids.includes(r.id));
      if (after.some((r) => r.status === "未承認")) throw new Error(`${(e as Error).message.split("\n")[0]}（承認の一覧で未承認のまま: ${after.map((r) => `${r.id}:${r.status}`).join(",")}）`);
      issue(`在庫編集の承認で、成功の表示は出なかったが、承認の一覧から未承認の行が無くなっていた（${(e as Error).message.split("\n")[0]}）`);
    }
    if (rows.length > 件数) issue(`在庫編集承認一覧に、同じ登録者の前の回の未承認の行が ${rows.length - 件数} 件あり、合わせて承認した（どれも E2E の商品）`);
  });
}

defineSeed("S-F01-02-BROWSER", async () => { /* ブラウザの言語・ログイン状態は各ケースが開始時に設定する（フロントは日本語表示のURL /ja/ を開く） */ });

for (const n of ["009", "021", "057"]) {
  defineSeed(`S-F01-02-CASE-${n}`, async ({ browser, notes, seed }) => {
    const id = await withAdminSession(browser, SETUP_ADMIN, (page) => 決まった支店を用意する(page, n, (m) => reportSeedIssue(seed.シードID, m)));
    notes.set(`〔支店ID-F0102-${n}〕`, id);
  });
}

// ---- SALE中の商品（商品A・Bの組合せ） ----
const SALE_TAG_ID = "8"; // 「固定のセールタグ」: 手元のDBでは名称「sale1(未使用)」のタグ（アプリがセールに使うタグ）

type セール商品 = {
  suffix: string; name: string; 支店公開?: boolean; タグ?: boolean; フラグ?: boolean; 販売価格?: string; 在庫?: number; 廃止?: boolean;
};
export const 商品コード = (n: string, suffix: string): string => rc(`F0102-${n}${suffix}`);

async function セールの支店を作る(browser: Browser, seedId: string, n: string, defs: セール商品[], notes: { set(k: string, v: string): void }, 投入方法: string): Promise<void> {
  const 定め = new Set([...投入方法.matchAll(/〔[^〕]+〕/g)].map((m) => m[0]));
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 支店ID = await withAdminSession(browser, SETUP_ADMIN, (page) => 決まった支店を用意する(page, n, issue));
  notes.set(`〔支店ID-F0102-${n}〕`, 支店ID);
  const 管 = await 試験支店の決まった管理者(browser);
  const ids = new Map<string, { productId: string; classId: string }>();
  await withAdminSession(browser, 管.登録者.account, async (page) => {
    const categoryId = await readExistingGoodsChildCategoryId(page);
    const region = Object.fromEntries((await downloadGoodsCsvTemplate(page)).headers.filter((h) => h.includes("地域") || h.includes("スマレジ連携")).map((h) => [h, "0"]));
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId,
      common: { "購入グループ名称": "通常商品", ...region },
      lines: defs.map((d) => ({
        code: 商品コード(n, d.suffix), nameJp: rc(d.name), nameEn: rc(d.name), branchStatus: d.支店公開 === false ? "非公開" : "公開",
        values: { "基準価格": d.販売価格 ?? "1", "販売価格": d.販売価格 ?? "1", "買取価格": d.販売価格 === "0" ? "0" : "1", "原価単価": "1" },
      })),
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 180_000,
    });
    for (const d of defs) {
      const code = 商品コード(n, d.suffix);
      const productId = await openProductEditByCode(page, code);
      const rows = await classRowsFromProductEdit(page, productId);
      if (rows.length !== 1) throw new Error(`${seedId}: ${code} の取込直後の商品規格が1件でない`);
      await タグを付けて商品を登録する(page, productId, d.タグ === false ? null : SALE_TAG_ID, null, `${seedId}: ${code}`, issue);
      if (d.フラグ !== false) await 規格のセールを設定する(page, productId, rows[0].商品規格ID, { フラグ: true, 販売価格: d.販売価格 ?? "1" }, `${seedId}: ${code}`, issue);
      ids.set(code, { productId, classId: rows[0].商品規格ID });
    }
    // 在庫がある商品規格は廃止にできない（アプリの制約）ので、廃止する商品には在庫を入れない
    const 在庫数 = (d: セール商品): number => d.在庫 ?? (d.廃止 ? 0 : 5);
    const 入れる = defs.filter((d) => 在庫数(d) > 0);
    for (const d of 入れる) {
      const code = 商品コード(n, d.suffix);
      const stock = await searchStockByCode(page, { 商品コード: code, 店舗: 支店名(n), 在庫区分: "EC-CUBE" });
      await stock.openEdit(stock.row(code, 支店名(n), "EC-CUBE"));
      await registerStockEdit(page, { changeType: "入庫/その他", reason: "F01-02試験データ", quantity: String(在庫数(d)), purchasePrice: "1", approverName: 管.承認者.名前 }, `${seedId}: ${code} の在庫編集`, issue);
    }
    await 決まった登録者の在庫を承認する(browser, 管.承認者, await loggedInMemberName(page), 入れる.length, seedId, issue);
    // シード表が「控える」と定めた呼び名（商品ID・商品規格ID）を控える
    for (const d of defs) {
      const v = ids.get(商品コード(n, d.suffix))!;
      for (const [k, val] of [[`〔商品ID-F0102-${n}${d.suffix}〕`, v.productId], [`〔商品規格ID-F0102-${n}${d.suffix}〕`, v.classId]]) {
        if (定め.has(k)) notes.set(k, val); // シード表が控えると定めた呼び名だけ控える
      }
    }
    for (const d of defs.filter((x) => x.廃止)) {
      await タグを付けて商品を登録する(page, ids.get(商品コード(n, d.suffix))!.productId, null, "廃止", `${seedId}: ${商品コード(n, d.suffix)} を廃止`, issue);
    }
  });
}

const 基準 = (n: string): セール商品 => ({ suffix: "A", name: `セール基準商品-${n}` });
const セール: Record<string, セール商品[]> = {
  "011": [{ suffix: "", name: "セール基準商品-011" }],
  "012": [基準("012"), { suffix: "B", name: "セール非公開商品-012", 支店公開: false }],
  "013": [基準("013"), { suffix: "B", name: "セール廃止商品-013", 廃止: true }],
  "014": [{ suffix: "A", name: "セール基準商品-014", 在庫: 1 }, { suffix: "B", name: "セール在庫なし商品-014", 在庫: 0 }],
  "015": [基準("015"), { suffix: "B", name: "セールタグなし商品-015", タグ: false }],
  "016": [基準("016"), { suffix: "B", name: "セールフラグOFF商品-016", フラグ: false }],
  "024": [{ suffix: "", name: "セール基準商品-024", 販売価格: "500" }],
  "026": [{ suffix: "", name: "セール基準商品-026", 販売価格: "500" }],
  "032": [{ suffix: "", name: "セール基準商品-032", 販売価格: "500" }],
  "017": [{ suffix: "A", name: "セール価格1円商品-017" }, { suffix: "B", name: "セール価格0円商品-017", 販売価格: "0" }],
};
for (const [n, defs] of Object.entries(セール)) {
  defineSeed(`S-F01-02-CASE-${n}`, async ({ browser, notes, seed }) => { await セールの支店を作る(browser, seed.シードID, n, defs, notes, seed.投入方法); });
}
