/**
 * F03-05 商品リコメンドの画面シード（追加分。012・013 は seeds/f03-05.ts）。正本: cases/F03-05_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10）: テストデータは「既存データ または 画面から作ったデータ」に読み替えてよい。画面で作れない部分は、
 * E2E が作った実行の印つきのデータに限り DB へ書き込んでよい（db/f03_05_orders.ts。db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通す）。
 *
 * 作り方（シード表の投入方法を、次のように読み替える）:
 * 1. 商品: グッズ商品CSV登録で商品を取り込む（商品コード・商品名は正本の値に実行の印を付ける。価格・公開状態・地域別販売制限は正本の値）。
 *    商品規格が非公開なら商品規格の編集で公開にする。
 * 2. 在庫: 在庫編集で本店・EC-CUBE に入庫し、登録者とは別の管理者が一括承認する（正本の在庫数。「購入で減る分を足した数」は足さず、注文はDBで作るので在庫数のまま）。
 * 3. 会員: フロントの会員情報登録で登録し、管理画面で本会員にする。ログインIDは画面で指定できないので、印つきのメールアドレスをログインに使う。
 * 4. 注文: シード表はフロントで会員が注文して受注日時を DB で設定すると定めるが、多数の商品・数量・日時・状態の注文を画面で重ねるのは現実的でないので、
 *    印つきの基の会員が画面で印つきの基の商品1点を注文した受注（基の受注）を1件だけ作り、それを写して DB で受注日時・状態・注文者・明細（商品・単価・数量）を設定した。
 *    DB で設定したこと: 「DBで注文の受注日時・受注状況・注文者・明細の商品と数量を設定した」。
 * 5. カード: 商品のカードは、既存のカード詳細（マスタ。読むだけ）を DB で商品に指定した（同一カード・別カード・Foil）。
 *
 * 作らないシード（理由は 記録 e2e/review/F03-05_progress_2026-11-11.md）: 購入完了（002）・TC大阪支店（009・030・032・034）・状態別の規格（017・019・021）。
 *
 * 決め打ちの識別の値（商品コード・商品名・メール）には実行ごとの印を付ける（rc。依頼者決定 2026-10-28）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 承認一覧の最大番号 } from "../db/f03_05";
import * as db from "../db/f03_05_orders";
import { 注文の受注ID } from "../db/f06_07_k";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { withAdminSession } from "../lib/session";
import { openProductEditByCodeAnyStatus } from "../pages/admin/f03_06_products";
import { savePublishedClass } from "../pages/admin/f03_07_restock";
import { ensureStockAdmin, STOCK_ADMIN } from "../pages/admin/f03_08_masters";
import { readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { classRowsFromProductEdit } from "../pages/admin/m03_23_seed_products";
import { searchStockByCode, stockInRow } from "../pages/admin/m04_02_rc_stock";
import { loggedInMemberName, registerStockEdit, StockApprovalListPage, StockListPage } from "../pages/admin/stock_edit";
import { 会員が注文する } from "../pages/front/m05_front_order";
import { markedMail, 本会員を作る } from "./f06-member";

// ---- シード表の値を表す型 ----

type 商品 = {
  /** 正本の商品コード（商品名も同じ） */
  code: string;
  price?: number;
  /** 本店・EC-CUBE の在庫（省略すると5。0は入庫しない） */
  stock?: number;
  /** 地域別販売制限: 0=日本語英語両サイト・1=日本語サイト（省略）・2=英語サイト */
  region?: "0" | "1" | "2";
  非公開?: boolean;
  /** 英語名（省略すると商品コードと同じ） */
  nameEn?: string;
  /** カード: 同じ1・同じ2 は同一カード、別 は別カード、Foil・通常 は Foil の区分 */
  card?: "同じ1" | "同じ2" | "別" | "Foil" | "通常";
};
type 会員 = { key: string; local: string; password: string };
type 注文 = {
  /** 控える呼び名の後半（〔受注ID-F0305-<ラベル>〕）。控えない注文は省略 */
  ラベル?: string;
  /** 注文者の会員（省略すると基の会員＝「別の会員」） */
  持ち主?: string;
  日前?: number;
  時間前?: number;
  状態?: db.受注の状態;
  明細: (string | [string, number])[];
};
type ケース = { 商品: 商品[]; 会員?: 会員[]; 注文: 注文[]; 注記?: string };

// ---- 実行中に控える対応 ----

type 作った商品 = { productId: string; classId: string; code: string; name: string; price: number };
const products = new Map<string, 作った商品>();
const members = new Map<string, { mail: string; password: string; id: string }>();
const orders = new Map<string, string>();

/** ケースの文の商品コード（正本の値）から、シードが作った商品を引く */
export function productOf(正本の商品コード: string): 作った商品 {
  const p = products.get(rc(正本の商品コード));
  if (!p) throw new Error(`商品 ${正本の商品コード} はまだ作っていない`);
  return p;
}
export function memberOf(key: string): { mail: string; password: string; id: string } {
  const m = members.get(key);
  if (!m) throw new Error(`会員 ${key} はまだ作っていない`);
  return m;
}
export function orderOf(ラベル: string): string {
  const o = orders.get(ラベル);
  if (!o) throw new Error(`受注 ${ラベル} はまだ作っていない`);
  return o;
}

// ---- 基の会員と基の受注 ----

const 基の会員の資格 = { 前半: `f0305-base-${process.pid}`, パスワード: "Passw0rd!F0305BASE" };
let 基: Promise<{ 受注ID: string; 会員ID: string }> | null = null;

/** 印つきの基の会員が、印つきの基の商品（グッズ商品CSVで作る）1点を画面で注文した受注（注文の写しの元）。プロセスで1回だけ作る */
function 基の受注(browser: Browser): Promise<{ 受注ID: string; 会員ID: string }> {
  if (!基) {
    基 = (async () => {
      const 会員ID = await 本会員を作る(browser, { 姓: "試験会員", 名: "F0305基", セイ: "シケンカイイン", メイ: "ベース", ...基の会員の資格 });
      const code = `F0305-ORDERBASE-${process.pid}`;
      const issue = (m: string) => reportSeedIssue("S-F03-05-CONFIG", m);
      await createProducts(browser, "S-F03-05-基の商品", [{ code }], issue);
      await stockTo(browser, "S-F03-05-基の商品", [{ code: rc(code), qty: 5 }], issue);
      const 注文番号 = await 会員が注文する(browser, { メール: markedMail(基の会員の資格.前半), パスワード: 基の会員の資格.パスワード }, "S-F03-05 基の受注", { 商品ID: productOf(code).productId });
      return { 受注ID: 注文の受注ID(注文番号), 会員ID };
    })();
  }
  return 基;
}

// ---- 商品と在庫 ----

async function createProducts(browser: Browser, seedId: string, defs: 商品[], issue: (m: string) => void): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const categoryId = await readExistingGoodsChildCategoryId(page);
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId}.csv`, categoryId,
      lines: defs.map((d) => ({
        code: rc(d.code), nameJp: rc(d.code), nameEn: d.nameEn ?? rc(d.code), productStatus: d.非公開 ? "非公開" : "公開",
        values: { "基準価格": String(d.price ?? 100), "販売価格": String(d.price ?? 100), "地域別販売制限": d.region ?? "1" },
      })),
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`),
      uploadWaitMs: 180_000,
    });
    for (const d of defs) {
      const code = rc(d.code);
      const productId = await openProductEditByCodeAnyStatus(page, code);
      const rows = await classRowsFromProductEdit(page, productId);
      if (rows.length !== 1 || rows[0].商品コード !== code) throw new Error(`${seedId}: ${code} の取込直後の商品規格が1件でない: ${JSON.stringify(rows)}`);
      if (rows[0].公開状態 !== "公開") await savePublishedClass(page, { productId, classId: rows[0].商品規格ID }, `${seedId}: ${code}`, issue);
      products.set(code, { productId, classId: rows[0].商品規格ID, code, name: code, price: d.price ?? 100 });
    }
  });
}

/** 本店・EC-CUBE在庫を指定の数にする（登録者とは別の管理者が承認する。F03-08 の在庫の入れ方と同じ） */
async function stockTo(browser: Browser, tag: string, items: { code: string; qty: number }[], issue: (m: string) => void): Promise<void> {
  if (items.length === 0) return;
  const approverName = await withAdminSession(browser, SETUP_ADMIN, (page) => loggedInMemberName(page));
  const shop = await withAdminSession(browser, SETUP_ADMIN, (page) => new StockListPage(page).shopNameById("1"));
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureStockAdmin(page));
  const baseline = 承認一覧の最大番号();
  const registeredBy = await withAdminSession(browser, STOCK_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const registrant = await loggedInMemberName(page);
    if (registrant === approverName) throw new Error(`${tag}: 登録者と承認者が同じ管理者になっている`);
    const stock = new StockListPage(page);
    for (const it of items) {
      await stock.searchByProductCode(it.code);
      await stock.openEdit(stock.row(it.code, shop, "EC-CUBE"));
      await registerStockEdit(page, { changeType: "入庫/その他", reason: "F03-05試験データ", quantity: String(it.qty), purchasePrice: "0", approverName }, `${tag}: ${it.code} の在庫編集（${it.qty}）`, issue);
    }
    return registrant;
  });
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const list = new StockApprovalListPage(page);
    await list.open(shop);
    const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === registeredBy && r.shop.startsWith(shop)
      && r.changeType.endsWith("入庫/その他") && Number(r.id) > baseline);
    if (rows.length < items.length) throw new Error(`${tag}: 在庫編集の未承認の行が ${rows.length} 件（${items.length} 件のはず）`);
    await list.approve(rows.slice(0, items.length).map((r) => r.id), `${tag}: 在庫編集の承認（${items.length}件）`, issue);
    for (const it of items) {
      const after = await searchStockByCode(page, { 商品コード: it.code, 店舗: shop, 在庫区分: "EC-CUBE" });
      const n = await stockInRow(after.row(it.code, shop, "EC-CUBE"));
      if (n !== it.qty) throw new Error(`${tag}: ${it.code} の在庫が ${n}（${it.qty}のはず）`);
    }
  });
}

// ---- カード ----

function カードを指定する(defs: 商品[], issue: (m: string) => void): void {
  const withCard = defs.filter((d) => d.card);
  if (withCard.length === 0) return;
  const 通常 = db.カード詳細の候補(0);
  const foil = db.カード詳細の候補(1);
  const first = 通常[0];
  const other = 通常.find((c) => first && c.カードID !== first.カードID);
  const pick = (d: 商品): db.カード詳細 | undefined =>
    d.card === "同じ1" || d.card === "同じ2" ? first : d.card === "別" ? other : d.card === "Foil" ? foil[0] : 通常[0];
  for (const d of withCard) {
    const detail = pick(d);
    if (!detail) throw new Error(`${d.code}: 指定できる既存のカード詳細（${d.card}）が手元の環境に無い`);
    db.商品にカード詳細を指定する(products.get(rc(d.code))!.productId, detail.詳細ID);
  }
  issue("カードは、商品登録のカード指定の画面でなく、既存のカード詳細（マスタ。読むだけ）をDBで印つきの商品に指定した（同一カード・別カード・Foilの区分）");
}

// ---- 呼び名の控え ----

function 日時(日前 = 0, 時間前 = 0): string {
  const t = new Date(Date.now() + 9 * 3600_000 - 日前 * 86400_000 - 時間前 * 3600_000);
  return t.toISOString().slice(0, 19).replace("T", " ");
}

function noteLabels(seedId: string, notes: Notes, login?: string): void {
  const seed = getSeed(seedId);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    const m = /^〔(会員ID|受注ID)-F0305-([^〕]+)〕$/.exec(label);
    if (m?.[1] === "会員ID" && login) notes.set(label, memberOf(login).id);
    else if (m?.[1] === "受注ID") notes.set(label, orderOf(m[2]));
    else throw new Error(`${seedId}: 呼び名 ${label} が未対応`);
  }
}

const 注記 = "シード表は注文を会員のフロント注文（受注日時だけDB）で作ると定めるが、印つきの基の会員が画面で印つきの基の商品1点（共有の商品の在庫は減らさない）を注文した受注を写し、DBで受注日時・受注状況・注文者・明細の商品と数量を設定して作った（DBで注文の受注日時・受注状況・注文者・明細の商品と数量を設定した）。商品の在庫は正本の数のまま（注文はDBで作るので減らない）。ログインIDは画面で指定できないので、印つきのメールアドレスでログインする";

function define(seedId: string, c: ケース, login?: string): void {
  defineSeed(seedId, { needs: ["S-F03-05-CONFIG"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const base = c.注文.length > 0 ? await 基の受注(browser) : null;
    for (const m of c.会員 ?? []) {
      const id = await 本会員を作る(browser, { 姓: "試験会員", 名: "F0305", セイ: "シケンカイイン", メイ: "エフゼロサンゼロゴ", 前半: m.local, パスワード: m.password });
      members.set(m.key, { mail: markedMail(m.local), password: m.password, id });
      issue(`会員 ${m.local} を登録した（会員ID ${id}）。ログインIDの代わりに印つきのメールアドレス ${markedMail(m.local)} でログインする`);
    }
    if (c.商品.length > 0) await createProducts(browser, seedId, c.商品, issue);
    await stockTo(browser, seedId, c.商品.filter((d) => (d.stock ?? 5) > 0).map((d) => ({ code: rc(d.code), qty: d.stock ?? 5 })), issue);
    カードを指定する(c.商品, issue);
    for (const o of c.注文) {
      const 明細 = o.明細.map((x) => {
        const [code, 数量] = typeof x === "string" ? [x, 1] : x;
        const p = productOf(code);
        return { 商品ID: p.productId, 規格ID: p.classId, 商品コード: p.code, 商品名: p.name, 単価: p.price, 数量 };
      });
      const id = db.注文を足す(base!.受注ID, {
        会員ID: o.持ち主 ? memberOf(o.持ち主).id : undefined,
        受注日時: 日時(o.日前 ?? 0, o.時間前 ?? 0), 状態: o.状態 ?? "入金済み", 明細,
      });
      if (o.ラベル) orders.set(o.ラベル, id);
    }
    issue(c.注記 ? `${注記}。${c.注記}` : 注記);
    noteLabels(seedId, notes, login);
  });
}

const P = (code: string, o: Omit<商品, "code"> = {}): 商品 => ({ code, ...o });

// ---- マイページ ----

define("S-F03-05-CASE-001", {
  会員: [{ key: "M", local: "f0305_member-001", password: "Passw0rd-001!F0305-001" }],
  商品: [P("BASE-PROCESS-HIGH-001"), P("REC-PROCESS-001"), P("BASE-MYP-HIGH-001", { price: 3000 }), P("BASE-MYP-LOW-001", { price: 1000 })],
  注文: [
    { ラベル: "001", 持ち主: "M", 時間前: 2, 明細: ["BASE-MYP-HIGH-001", "BASE-MYP-LOW-001"] },
    { 持ち主: "M", 時間前: 1, 状態: "処理中", 明細: ["BASE-PROCESS-HIGH-001", "REC-PROCESS-001"] },
  ],
}, "M");

define("S-F03-05-CASE-005", { 会員: [{ key: "M", local: "f0305_noorder-005", password: "Passw0rd-005!F0305N-005" }], 商品: [], 注文: [] }, "M");

define("S-F03-05-ONE-025", {
  会員: [{ key: "M", local: "f0305_member-025", password: "Passw0rd-F0305025" }],
  商品: [P("F0305-025-BASE"), P("F0305-025-REC")],
  注文: [
    { ラベル: "025A", 持ち主: "M", 日前: 1, 明細: ["F0305-025-BASE"] },
    { ラベル: "025B", 日前: 1, 明細: ["F0305-025-BASE", "F0305-025-REC"] },
  ],
}, "M");

define("S-F03-05-TWOORD-026", {
  会員: [{ key: "M", local: "f0305_member-026", password: "Passw0rd-F0305026" }],
  商品: [P("F0305-026-OLDHIGH", { price: 3000 }), P("F0305-026-NEWLOW", { price: 1000 }), P("F0305-026-RECOLD"), P("F0305-026-RECNEW")],
  注文: [
    { ラベル: "026A", 持ち主: "M", 日前: 3, 明細: ["F0305-026-OLDHIGH"] },
    { ラベル: "026B", 持ち主: "M", 日前: 1, 明細: ["F0305-026-NEWLOW"] },
    { ラベル: "026C", 日前: 1, 明細: ["F0305-026-OLDHIGH", "F0305-026-RECOLD"] },
    { ラベル: "026D", 日前: 1, 明細: ["F0305-026-NEWLOW", "F0305-026-RECNEW"] },
  ],
}, "M");

// ---- 商品詳細 ----

define("S-F03-05-CASE-003", {
  商品: [P("BASE-DETAIL-003"), P("REC-DETAIL-003")],
  注文: [{ ラベル: "003", 日前: 1, 明細: ["BASE-DETAIL-003", "REC-DETAIL-003"] }],
});

define("S-F03-05-CASE-006", {
  商品: [P("BASE-CORR-006"), P("REC-QTY-5-006"), P("REC-QTY-3-006"), P("REC-OLD-006"), P("REC-PROCESS-006")],
  注文: [
    { ラベル: "006A", 日前: 1, 明細: ["BASE-CORR-006", ["REC-QTY-5-006", 5], ["REC-QTY-3-006", 3]] },
    { ラベル: "006B", 日前: 31, 明細: ["BASE-CORR-006", ["REC-OLD-006", 20]] },
    { 日前: 1, 状態: "処理中", 明細: ["BASE-CORR-006", ["REC-PROCESS-006", 20]] },
  ],
});

define("S-F03-05-CASE-007", {
  商品: [P("BASE-SAME-007", { card: "同じ1" }), P("SAME-CARD-ALT-007", { card: "同じ1" }), P("OTHER-CARD-007", { card: "別" })],
  注文: [{ ラベル: "007", 日前: 1, 明細: ["BASE-SAME-007", "SAME-CARD-ALT-007", "OTHER-CARD-007"] }],
});

define("S-F03-05-CASE-008", {
  商品: [
    P("BASE-FILTER-008"), P("FILTER-OK-008", { stock: 2 }), P("FILTER-PRIVATE-008", { stock: 2, 非公開: true }),
    P("FILTER-EN-008", { stock: 2, region: "2" }), P("FILTER-NOSTOCK-008", { stock: 0 }),
  ],
  注文: [{ ラベル: "008", 日前: 1, 明細: ["BASE-FILTER-008", "FILTER-OK-008", "FILTER-PRIVATE-008", "FILTER-EN-008", "FILTER-NOSTOCK-008"] }],
});

define("S-F03-05-CASE-010", {
  会員: [{ key: "M", local: "f0305_member-010", password: "Passw0rd-010!F0305-010" }],
  商品: [P("BASE-PURCHASED-010"), P("PURCHASED-REC-010"), P("NEW-REC-010")],
  注文: [
    { ラベル: "010A", 日前: 1, 明細: ["BASE-PURCHASED-010", "PURCHASED-REC-010", "NEW-REC-010"] },
    { ラベル: "010B", 持ち主: "M", 日前: 10, 明細: ["PURCHASED-REC-010"] },
  ],
}, "M");

const limitProducts = (no: string): 商品[] => [P(`BASE-LIMIT-${no}`), ...Array.from({ length: 11 }, (_, i) => P(`LIMIT-${String(i + 1).padStart(2, "0")}-${no}`))];
const limitItems = (no: string): 注文["明細"] => [`BASE-LIMIT-${no}`, ...Array.from({ length: 11 }, (_, i): [string, number] => [`LIMIT-${String(i + 1).padStart(2, "0")}-${no}`, 11 - i])];
define("S-F03-05-CASE-011", { 商品: limitProducts("011"), 注文: [{ ラベル: "011", 日前: 1, 明細: limitItems("011") }] });
define("S-F03-05-CASE-018", { 商品: limitProducts("018"), 注文: [{ ラベル: "018", 日前: 1, 明細: limitItems("018") }] });

define("S-F03-05-CASE-014", {
  商品: [P("BASE-EN-014", { region: "0" }), P("EN-OK-014", { region: "2", nameEn: "English Recommendation" }), P("JP-ONLY-014", { region: "1" })],
  注文: [{ ラベル: "014", 日前: 1, 明細: ["BASE-EN-014", "EN-OK-014", "JP-ONLY-014"] }],
});

define("S-F03-05-CASE-015", {
  商品: [P("BASE-DETAIL-015"), P("REC-DETAIL-015")],
  注文: [{ ラベル: "015", 日前: 1, 明細: ["BASE-DETAIL-015", "REC-DETAIL-015"] }],
});

define("S-F03-05-CASE-016", {
  商品: [P("BASE-ASYNC-016"), P("ASYNC-A-016"), P("ASYNC-B-016")],
  注文: [{ ラベル: "016", 日前: 1, 明細: ["BASE-ASYNC-016", "ASYNC-A-016"] }],
});

define("S-F03-05-SUM-028", {
  商品: [P("F0305-028-BASE"), P("F0305-028-A"), P("F0305-028-B")],
  注文: [
    { ラベル: "028A", 日前: 1, 明細: ["F0305-028-BASE", ["F0305-028-A", 2]] },
    { ラベル: "028B", 日前: 1, 明細: ["F0305-028-BASE", ["F0305-028-A", 2]] },
    { ラベル: "028C", 日前: 1, 明細: ["F0305-028-BASE", ["F0305-028-B", 3]] },
  ],
});

define("S-F03-05-FOIL-029", {
  商品: [P("F0305-029-BASE"), P("F0305-029-FOIL", { card: "Foil" }), P("F0305-029-PLAIN", { card: "通常" })],
  注文: [{ ラベル: "029", 日前: 1, 明細: ["F0305-029-BASE", ["F0305-029-FOIL", 2], "F0305-029-PLAIN"] }],
});

define("S-F03-05-CBPROC-031", {
  会員: [{ key: "P", local: "cbf0305-031p", password: "Passw0rd-CBF0305031P" }],
  商品: [P("F0305-CB031-BASE"), P("F0305-CB031-RECA"), P("F0305-CB031-RECP")],
  注文: [
    { ラベル: "031A", 持ち主: "P", 日前: 1, 明細: ["F0305-CB031-BASE", "F0305-CB031-RECA"] },
    { 持ち主: "P", 日前: 1, 状態: "処理中", 明細: ["F0305-CB031-BASE", "F0305-CB031-RECP"] },
  ],
});

// ---- 買い物かご ----

define("S-F03-05-CASE-004", {
  商品: [P("CART-HIGH-004", { price: 3000 }), P("CART-LOW-004", { price: 1000 }), P("REC-CART-HIGH-004"), P("REC-CART-LOW-004")],
  注文: [
    { ラベル: "004A", 日前: 1, 明細: ["CART-HIGH-004", "REC-CART-HIGH-004"] },
    { ラベル: "004B", 日前: 1, 明細: ["CART-LOW-004", "REC-CART-LOW-004"] },
  ],
});

define("S-F03-05-CART1-027", {
  商品: [P("F0305-027-CART"), P("F0305-027-REC")],
  注文: [{ ラベル: "027", 日前: 1, 明細: ["F0305-027-CART", "F0305-027-REC"] }],
});

define("S-F03-05-CBPAID-033", {
  会員: [{ key: "P", local: "cbf0305-033p", password: "Passw0rd-CBF0305033P" }],
  商品: [P("F0305-CB033-BASE"), P("F0305-CB033-RECA")],
  注文: [{ ラベル: "033A", 持ち主: "P", 日前: 1, 明細: ["F0305-CB033-BASE", "F0305-CB033-RECA"] }],
});

/** 016: 同時購入の実績を置き換える（DB。印つきの受注の明細の商品だけ） */
export function 同時購入の実績を置き換える(受注ラベル: string, 旧: string, 新: string): void {
  const n = productOf(新);
  db.明細の商品を置き換える(orderOf(受注ラベル), productOf(旧).productId, { 商品ID: n.productId, 規格ID: n.classId, 商品コード: n.code, 商品名: n.name });
}
