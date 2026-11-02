/**
 * F01-02 支店ECTOP のシード（支店だけを作るもの）。正本: cases/F01-02_seed_data.tsv
 * 管理画面の店舗登録で支店を作り、店舗一覧のIDを控える。支店URLは正本の例の値に実行ごとの印（小文字）を足した半角英数字。
 * 店舗登録は保存されたうえでシステムエラーの画面になることがある（店舗一覧に出ていれば先へ進み、報告する）。
 */
import { SETUP_ADMIN } from "../config/env";
import { RUN_MARK, rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { ensureTenant } from "../pages/admin/tenant";
import { Browser } from "@playwright/test";
import { downloadGoodsCsvTemplate, readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { storeNameById } from "../pages/admin/m04_19_masters";
import { タグを付けて商品を登録する, 規格のセールを設定する, 支店の管理者を用意する, 管理者 } from "../pages/admin/f01_02_setup";
import { searchStockByCode } from "../pages/admin/m04_02_rc_stock";
import { loggedInMemberName, registerStockEdit, StockApprovalListPage } from "../pages/admin/stock_edit";
import { 在庫承認の最大ID } from "../db/f03_08";

export const 支店URL = (n: string): string => `f0102c${n}${RUN_MARK.toLowerCase()}`;
const 略称 = (s: string): string => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; const L = "ABCDEFGHJKLMNPQRSTUVWXYZ"; return [h % 24, (h >>> 5) % 24, (h >>> 10) % 24].map((i) => L[i]).join(""); };
export const 支店名 = (n: string): string => rc(`F0102-${n}支店`);

defineSeed("S-F01-02-BROWSER", async () => { /* ブラウザの言語・ログイン状態は各ケースが開始時に設定する（フロントは日本語表示のURL /ja/ を開く） */ });

for (const n of ["009", "021", "057"]) {
  defineSeed(`S-F01-02-CASE-${n}`, async ({ browser, notes, seed }) => {
    const url = 支店URL(n);
    const id = await withAdminSession(browser, SETUP_ADMIN, (page) => ensureTenant(page, {
      店名: 支店名(n), 店名カナ: "シケンシテン", 店名英語: "Branch Shop", 支店URL: url, 店名略称3文字: 略称(url), ショップ名略称: 支店名(n),
    }, (m) => reportSeedIssue(seed.シードID, m)));
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
  const url = 支店URL(n);
  const 本店名 = await withAdminSession(browser, SETUP_ADMIN, (page) => storeNameById(page, "1"));
  const 支店ID = await withAdminSession(browser, SETUP_ADMIN, (page) => ensureTenant(page, {
    店名: 支店名(n), 店名カナ: "シケンシテン", 店名英語: "Branch Shop", 支店URL: url, 店名略称3文字: 略称(url), ショップ名略称: 支店名(n),
  }, issue));
  notes.set(`〔支店ID-F0102-${n}〕`, 支店ID);
  const 管: { 登録者: 管理者; 承認者: 管理者 } = await withAdminSession(browser, SETUP_ADMIN, (page) => 支店の管理者を用意する(page, n, RUN_MARK, 支店名(n), 本店名));
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
    const 入れる = defs.filter((d) => (d.在庫 ?? 5) > 0);
    const baseline = 在庫承認の最大ID();
    for (const d of 入れる) {
      const code = 商品コード(n, d.suffix);
      const stock = await searchStockByCode(page, { 商品コード: code, 店舗: 支店名(n), 在庫区分: "EC-CUBE" });
      await stock.openEdit(stock.row(code, 支店名(n), "EC-CUBE"));
      await registerStockEdit(page, { changeType: "入庫/その他", reason: "F01-02試験データ", quantity: String(d.在庫 ?? 5), purchasePrice: "1", approverName: 管.承認者.名前 }, `${seedId}: ${code} の在庫編集`, issue);
    }
    await withAdminSession(browser, 管.承認者.account, async (ap) => {
      const list = new StockApprovalListPage(ap);
      await list.open(支店名(n));
      const registrant = await loggedInMemberName(page);
      const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === registrant && Number(r.id) > baseline);
      if (rows.length < 入れる.length) throw new Error(`${seedId}: 在庫編集の未承認の行が ${rows.length} 件（${入れる.length} 件のはず）`);
      await list.approve(rows.slice(0, 入れる.length).map((r) => r.id), `${seedId}: 在庫編集の承認`, issue);
    });
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
  "017": [{ suffix: "A", name: "セール価格1円商品-017" }, { suffix: "B", name: "セール価格0円商品-017", 販売価格: "0" }],
};
for (const [n, defs] of Object.entries(セール)) {
  defineSeed(`S-F01-02-CASE-${n}`, async ({ browser, notes, seed }) => { await セールの支店を作る(browser, seed.シードID, n, defs, notes, seed.投入方法); });
}
