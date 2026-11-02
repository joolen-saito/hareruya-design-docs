/**
 * M05-11 受注情報編集のシード（商品をグッズ商品CSVで作り、入庫・承認を経て注文するもの）。
 * 正本の順: 商品CSV登録 → 商品の規格を公開 → 在庫編集で入庫（承認通知先を選び、別の管理者が承認）→ 会員登録 → 注文 → 受注番号を控える → 受注情報編集で価格などを整える。
 * 解釈: 購入グループ名称は「既存の購入グループの名称」のうち、配送方法・支払方法が結び付いている「通常商品」（先頭の購入グループでは注文できる配送方法が無い）。
 * 商品の登録は商品ごとに1行の CSV だが、同じシードの商品は1回の CSV にまとめた。入庫の承認者はシステム管理者（登録者の M0511管理者A とは別）。
 * 商品コード・商品名は実行ごとの印を付ける（依頼者決定 2026-10-28）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 在庫承認の最大ID } from "../db/f03_08";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { savePublishedClass } from "../pages/admin/f03_07_restock";
import { downloadGoodsCsvTemplate, readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { OrderEditPage, OrderItemsEdit } from "../pages/admin/m05_11_order_edit";
import { loggedInMemberName, registerStockEdit, StockApprovalListPage, StockListPage } from "../pages/admin/stock_edit";
import { 会員が注文する, 会員を用意する, 販売中の商品 } from "../pages/front/m05_11_order";
import { ADMIN_A_NAME, M0511_ADMIN_A, 店舗Aの店名, 試験会員 } from "./m05-11";
import { ポイントを付与する, 会員IDを一覧から読む, メールで受注を開く } from "../pages/admin/m05_11_order_edit";
import { FrontMember } from "../pages/front/member_entry";

export type 商品 = { code: string; name: string; 価格?: string; 原価単価?: string; 高額商品コード?: string; 入庫: { 数量: number; 仕入単価: string }[] };
export const 実商品コード = (code: string): string => rc(code);

const productIds = new Map<string, string>();
export const 商品IDの控え = (code: string): string => {
  const id = productIds.get(rc(code));
  if (!id) throw new Error(`商品コード ${rc(code)} の商品IDを控えていない`);
  return id;
};

/** 商品をグッズ商品CSVで作り、規格を公開し、入庫する（承認まで） */
export async function 商品を用意する(browser: Browser, seedId: string, defs: 商品[]): Promise<void> {
  if (defs.length === 0) return;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await withAdminSession(browser, M0511_ADMIN_A, async (page) => {
    const categoryId = await readExistingGoodsChildCategoryId(page);
    // 「地域別販売制限は0（日英の両サイト）」: 雛形の「地域」を含む列をすべて 0 にする
    const region = Object.fromEntries((await downloadGoodsCsvTemplate(page)).headers.filter((h) => h.includes("地域")).map((h) => [h, "0"]));
    issue(`地域別販売制限の列: ${Object.keys(region).join("・") || "（雛形に無い）"} を 0 にした`);
    await registerGoodsCsv(page, {
      common: { "購入グループ名称": "通常商品", ...region },
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId,
      lines: defs.map((d) => ({ code: rc(d.code), nameJp: rc(d.name), nameEn: rc(d.name), values: { "基準価格": d.価格 ?? "1000", "販売価格": d.価格 ?? "1000", "買取価格": "100", "原価単価": d.原価単価 ?? "10" } })),
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 180_000,
    });
    for (const d of defs) {
      const code = rc(d.code);
      const productId = await openProductEditByCode(page, code);
      const rows = await classRowsFromProductEdit(page, productId);
      if (rows.length !== 1 || rows[0].商品コード !== code) throw new Error(`${seedId}: ${code} の取込直後の商品規格が1件でない`);
      if (rows[0].公開状態 !== "公開") await savePublishedClass(page, { productId, classId: rows[0].商品規格ID, highPriceCode: d.高額商品コード ? rc(d.高額商品コード) : undefined }, `${seedId}: ${code}`, issue);
      productIds.set(code, productId);
    }
  });
  const rounds = Math.max(...defs.map((d) => d.入庫.length));
  for (let i = 0; i < rounds; i++) {
    const items = defs.filter((d) => d.入庫[i]).map((d) => ({ code: rc(d.code), ...d.入庫[i] }));
    await 入庫する(browser, seedId, items);
  }
}

/** 本店・EC-CUBE に入庫する（M0511管理者A が在庫編集で登録し、システム管理者が承認） */
export async function 入庫する(browser: Browser, seedId: string, items: { code: string; 数量: number; 仕入単価: string }[]): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const approverName = await withAdminSession(browser, SETUP_ADMIN, (page) => loggedInMemberName(page));
  const shop = await 店舗Aの店名(browser);
  const baseline = 在庫承認の最大ID();
  await withAdminSession(browser, M0511_ADMIN_A, async (page) => {
    if ((await loggedInMemberName(page)) === approverName) throw new Error(`${seedId}: 登録者と承認者が同じ管理者`);
    const stock = new StockListPage(page);
    for (const it of items) {
      await stock.searchByProductCode(it.code);
      await stock.openEdit(stock.row(it.code, shop, "EC-CUBE"));
      await registerStockEdit(page, { changeType: "入庫/その他", reason: "M05-11試験データ", quantity: String(it.数量), purchasePrice: it.仕入単価, approverName }, `${seedId}: ${it.code} の在庫編集（${it.数量}）`, issue);
    }
  });
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const list = new StockApprovalListPage(page);
    await list.open(shop);
    const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === ADMIN_A_NAME && r.shop.startsWith(shop) && Number(r.id) > baseline);
    if (rows.length < items.length) throw new Error(`${seedId}: 在庫編集の未承認の行が ${rows.length} 件（${items.length} 件のはず）`);
    await list.approve(rows.slice(0, items.length).map((r) => r.id), `${seedId}: 在庫編集の承認（${items.length}件）`, issue);
  });
}

type 設定 = {
  番号: string; メール前半: string; 商品: 商品[]; 注文?: { code: string; 数量: number }[];
  /** 会員のポイントを付ける（会員情報編集の「ポイント履歴追加」で、注文番号は空のまま） */
  ポイント?: number;
  整える?: (p: OrderEditPage, items: OrderItemsEdit) => Promise<void>;
  /** 整えたあとに順に変える受注ステータス */
  状態?: string[];
  注文後?: (browser: Browser, seedId: string, ctx: { m: FrontMember; 注文番号: string }) => Promise<void>;
};

/** 商品→入庫→会員登録→注文→受注番号を控え→（整える）の流れ */
export function 商品注文のシード(seedId: string, s: 設定): void {
  defineSeed(seedId, { needs: ["S-M05-11-ADM-A"] }, async ({ browser, notes, seed }) => {
    await 商品を用意する(browser, seedId, s.商品);
    const m = 試験会員(s.メール前半);
    await 会員を用意する(browser, m);
    const lines = s.注文 ? s.注文.map((o) => ({ 商品ID: 商品IDの控え(o.code), 数量: o.数量 })) : 販売中の商品(1).map((商品ID) => ({ 商品ID, 数量: 1 }));
    await 会員が注文する(browser, m, lines, seed.シードID);
    const shop = await 店舗Aの店名(browser);
    const no = await withAdminSession(browser, M0511_ADMIN_A, async (page) => (await メールで受注を開く(page, m.メール, shop, seedId)).注文番号);
    notes.set(`〔受注番号-M0511-${s.番号}〕`, no);
    if (s.ポイント) await withAdminSession(browser, M0511_ADMIN_A, async (page) => ポイントを付与する(page, await 会員IDを一覧から読む(page, m.メール), s.ポイント!));
    if (s.注文後) await s.注文後(browser, seedId, { m, 注文番号: no });
    if (s.整える) {
      await withAdminSession(browser, M0511_ADMIN_A, async (page) => {
        const p = new OrderEditPage(page);
        await p.openByOrderNo(no, shop);
        await s.整える!(p, new OrderItemsEdit(page));
        await p.受注情報を登録する(() => undefined);
        for (const st of s.状態 ?? []) { await p.ステータスを選ぶ(st); await p.ステータスを変更する(() => undefined); }
      });
    }
  });
}

const 基本 = (code: string, name: string): 商品 => ({ code, name, 入庫: [{ 数量: 10, 仕入単価: "100" }] });
const AB = (n: string): 商品[] => [基本(`BASE-A-${n}`, "基本商品A"), 基本(`BASE-B-${n}`, "基本商品B")];
const 注文AB = (n: string) => [{ code: `BASE-A-${n}`, 数量: 2 }, { code: `BASE-B-${n}`, 数量: 1 }];

商品注文のシード("S-M05-11-BASE-002", {
  番号: "002", メール前半: "base-002", 商品: AB("002"), 注文: 注文AB("002"),
  整える: async (_p, items) => { await items.明細に入れる(rc("BASE-A-002"), { 価格: "1000" }); await items.明細に入れる(rc("BASE-B-002"), { 価格: "1000" }); await items.金額欄({ 送料: "0", 手数料: "0", 値引き: "0" }); },
});
商品注文のシード("S-M05-11-BASE-043", { 番号: "043", メール前半: "base-043", 商品: AB("043"), 注文: 注文AB("043") });
商品注文のシード("S-M05-11-BASE-044", { 番号: "044", メール前半: "base-044", 商品: AB("044"), 注文: 注文AB("044") });
商品注文のシード("S-M05-11-BASE-049", { 番号: "049", メール前半: "base-049", 商品: AB("049"), 注文: 注文AB("049") });
商品注文のシード("S-M05-11-ADD-082", {
  番号: "082", メール前半: "base-082",
  商品: [...AB("082"), 基本("ADD-001-082", "追加確認商品")], 注文: 注文AB("082"),
});
商品注文のシード("S-M05-11-BASE-073", {
  番号: "073", メール前半: "base-073",
  商品: [{ code: "BASE-A-073", name: "整数入力確認商品", 入庫: [{ 数量: 12, 仕入単価: "100" }] }], 注文: [{ code: "BASE-A-073", 数量: 2 }],
  整える: async (p, items) => {
    await items.明細に入れる(rc("BASE-A-073"), { 価格: "900", 数量: "2" }); await items.金額欄({ 送料: "0", 手数料: "0", 値引き: "0" }); await p.ポイント設定("0", "0");
  },
});
商品注文のシード("S-M05-11-LIMIT-051", {
  番号: "051", メール前半: "limit-051",
  商品: [{ code: "LIMIT-001-051", name: "合計上限確認商品", 入庫: [{ 数量: 10, 仕入単価: "100" }] }], 注文: [{ code: "LIMIT-001-051", 数量: 1 }],
  整える: async (_p, items) => { await items.明細に入れる(rc("LIMIT-001-051"), { 価格: "1000", 数量: "1" }); await items.金額欄({ 送料: "0", 手数料: "0", 値引き: "0" }); },
});
商品注文のシード("S-M05-11-CANCEL-022", {
  番号: "022", メール前半: "m0511-022",
  商品: [{ code: "CANCEL-ITEM-022", name: "キャンセル在庫確認商品", 入庫: [{ 数量: 10, 仕入単価: "100" }] }], 注文: [{ code: "CANCEL-ITEM-022", 数量: 2 }],
});
for (const n of ["035", "039"]) {
  商品注文のシード(`S-M05-11-COST-${n}`, {
    番号: n, メール前半: `m0511-cost-${n}`,
    商品: [{ code: `COST-001-${n}`, name: "原価確認商品", 入庫: [{ 数量: 10, 仕入単価: "500" }] }], 注文: [{ code: `COST-001-${n}`, 数量: 3 }],
    注文後: async (browser, seedId) => { await 入庫する(browser, seedId, [{ code: rc(`COST-001-${n}`), 数量: 2, 仕入単価: "50" }]); },
  });
}
export { 基本, AB, 注文AB };
