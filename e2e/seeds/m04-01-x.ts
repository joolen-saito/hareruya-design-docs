/**
 * M04-01 在庫検索/一覧の続き（-x）の画面シード。正本: cases/M04-01_seed_data.tsv
 * 実施不可の見直し（not_runnable_seed_recheck2.tsv。依頼者決定 2026-11-10「E2E が作った行だけ DB に書いてよい」）で流せる見込みになったケースのもの。
 *
 * 作り方:
 * - S-M04-01-MASTER（共有可・1回の起動で一度）: 店舗（東京本店・大阪支店は S-M04-01-ADM-ALL と同じ店舗。上野閉店は登録してから閉店にする）、
 *   カテゴリ（グッズの親カテゴリ＝番号2の下に「子カテゴリ作成」）・カードセット・タグ・部門・略称タグ・売上分析タグを画面で登録する。
 *   棚番号「A-01」は名前の入力チェック（英大文字-数字3桁）を通らないので、チェックを通る名前で画面から登録し、その E2E の棚番号の名前だけ DB で書き換える。
 *   表示件数の10件・12000件は、マスタデータ管理の最大ページ表示にあることを DB の参照で確かめる（無ければ止める。全員が使うマスタなので足さない）。
 * - 商品のシード: グッズ商品CSV登録で商品を作り、対象の店舗・EC-CUBE の行を在庫編集で入庫して、別の管理者が承認する。
 *   商品規格の登録で自動で作られる、対象以外の店舗別在庫は画面で消せないので、シード表のとおり E2E の商品の行だけ DB で消す。
 * - 管理者: 全店舗試験管理者（S-M04-01-ADM-ALL。seeds/m04-01.ts）が在庫を登録し、承認は東京本店・大阪支店を編集できる別の試験管理者（このファイルで作る）が行う。
 *
 * シードでの解釈（記録にも書く）:
 * - 決め打ちの名前・商品コードには実行の印を付ける（依頼者決定 2026-10-28「案A」）。ケースが検索に使う先頭の部分（例「M0401-AUTH-029」）に印を付け、
 *   その後ろに正本の残り（例「-01」）を続ける（前の実行の商品・マスタを検索で拾わないため）。ケースの文の同じ値も、同じ対応で読む（コード()）。
 * - 東京本店・大阪支店は印を付けない（S-M04-01-ADM-ALL と同じ。期待結果が店名そのものを見る）。上野閉店・マスタの名前は印を付ける。
 * - シード表が在庫を定めない商品（件数・ページング・CSV の比較用など）は在庫を入れない（在庫0の行を残す）。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 在庫承認の最大ID } from "../db/f03_08";
import { 対象以外の店舗別在庫を消す, 店名略称がある, 棚番号の名前がある, 棚番号の名前を書き換える, 部門コードがある, 表示件数の選択肢 } from "../db/m04_01_x";
import { getSeed } from "../lib/catalog";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { CategoryPage } from "../pages/admin/category";
import { expectSaved } from "../pages/admin/common";
import { readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { TagPage } from "../pages/admin/m03_13_tag";
import { SalesAnalysisTagPage } from "../pages/admin/m03_17_sales_analysis_tag";
import { DepartmentPage } from "../pages/admin/m03_18_department";
import { ShelfNumberPage } from "../pages/admin/m03_21_shelf_number";
import { openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { addClass, openClassList } from "../pages/admin/m03_30_products";
import { searchStockByCode } from "../pages/admin/m04_02_rc_stock";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { createStore, findOpenStoreId, M0424StoreInput } from "../pages/admin/m04_24_store";
import { ensureCardset, GOODS_ROOT_CATEGORY_ID } from "../pages/admin/product_masters";
import { ShortTagPage } from "../pages/admin/short_tag";
import { registerStockEdit, StockApprovalListPage } from "../pages/admin/stock_edit";
import { adminUrl } from "../lib/session";
import { ALL_NAME, M0401_ALL, OSAKA, TOKYO, 店舗ID } from "./m04-01";

// ---- 正本の値 → 実際の値（実行の印） ----
const 対応 = new Map<string, string>();
/** 正本の商品コード・検索語・マスタの名前を、この実行で作った実際の値にする（未登録なら印を付けた値） */
export function コード(正本: string): string {
  return 対応.get(正本) ?? rc(正本);
}
function 先頭に印(先頭: string, 全体: string): string {
  if (!全体.startsWith(先頭)) throw new Error(`商品コード ${全体} は ${先頭} で始まらない`);
  const v = `${rc(先頭)}${全体.slice(先頭.length)}`;
  対応.set(先頭, rc(先頭)); 対応.set(全体, v);
  return v;
}

// ---- 管理者 ----
const PASS = "Passw0rd!M0401X";
export const M0401_LIMIT: Account = { loginId: rc("m0401_limit").toLowerCase(), password: "Passw0rd!M0401L" };
const LIMIT_NAME = rc("M04-01東京本店だけの試験管理者");
const 承認者: { 名前: string; account: Account } = { 名前: rc("M04-01承認試験管理者"), account: { loginId: rc("m0401_apr").toLowerCase(), password: PASS } };

let 承認者あり = false;
async function 承認者を用意する(browser: Browser): Promise<void> {
  if (承認者あり) return;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await ensureMemberByStoreIds(page, {
      名前: 承認者.名前, ログインID: 承認者.account.loginId, メールアドレス: `${承認者.account.loginId}@example.test`, パスワード: 承認者.account.password,
      権限: "システム管理者", 所属店舗ID: 店舗ID.東京本店, デフォルト検索表示店舗ID: 店舗ID.東京本店, 編集可能店舗ID: [店舗ID.東京本店, 店舗ID.大阪支店],
    });
  });
  承認者あり = true;
}

defineSeed("S-M04-01-ADM-LIMIT", { needs: ["S-M04-01-ADM-ALL"] }, async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await ensureMemberByStoreIds(page, {
      名前: LIMIT_NAME, ログインID: M0401_LIMIT.loginId, メールアドレス: `${M0401_LIMIT.loginId}@example.test`, パスワード: M0401_LIMIT.password,
      権限: "システム管理者", 所属店舗ID: 店舗ID.東京本店, デフォルト検索表示店舗ID: 店舗ID.東京本店, 編集可能店舗ID: [店舗ID.東京本店],
    });
  });
});

// ---- 検索選択肢マスタ（共有可） ----
export const マスタ = { 上野閉店: "", カードゲームA: "", カードゲームB: "", カードゲームAのID: "", SET_A: "", SET_B: "", 在庫タグA: "", カード部門: "", 棚番号A01: "", 略称A: "", 分析A: "" };
let マスタあり = false;

const UENO: M0424StoreInput = {
  店名: rc("上野閉店"), 店名カナ: "ウエノヘイテン", 店名英語: "Ueno Closed", 支店URL: rc("m0401ueno").toLowerCase().replace(/[^a-z0-9]/g, ""), 店名略称3文字: "",
  ショップ名略称: rc("上野閉店"), 会社名: "株式会社晴れる屋", 会社名カナ: "カブシキガイシャハレルヤ", 郵便番号: "110-0005", 都道府県: "東京都",
  住所1: "台東区上野1-1-1", 住所2: "晴ビル12F", 電話番号: "03-0401-0003",
};

/** 店舗編集画面で閉店にして登録する */
async function 閉店にする(page: Page, id: string, what: string): Promise<void> {
  await page.goto(adminUrl(`/mall/tenant/detail/${id}`));
  await page.waitForLoadState("load");
  await page.getByLabel("閉店", { exact: true }).check();
  await page.getByRole("button", { name: "登録", exact: true }).click();
  await expectSaved(page, what);
}

/** 3文字の店名略称（英大文字）を、使われていないものから選ぶ */
function 店名略称(): string {
  for (let i = 0; i < 50; i++) {
    const c = "U" + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
    if (!店名略称がある(c)) return c;
  }
  throw new Error("使われていない店名略称（3文字）を選べない");
}

defineSeed("S-M04-01-MASTER", { needs: ["S-M04-01-ADM-ALL"] }, async ({ browser, seed }) => {
  if (マスタあり) return;
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  // 表示件数（全員が使うマスタ。足さずに、あることを確かめる）
  const pm = 表示件数の選択肢();
  for (const n of ["10", "12000"]) if (!pm.includes(n)) throw new Error(`マスタデータ管理の最大ページ表示に ${n} が無い（全員が使うマスタなので足さない）`);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    // 上野閉店: 登録してから閉店にする（閉店の店舗は開店の店舗の検索で探せないので、実行ごとに印つきで作る）
    if (!(await findOpenStoreId(page, UENO.店名, UENO.会社名))) {
      try { await createStore(page, { ...UENO, 店名略称3文字: 店名略称() }); } catch (e) { issue(`上野閉店の登録で画面が成功を表示しなかった（${String(e).split("\n")[0].slice(0, 120)}）`); }
    }
    const ueno = await findOpenStoreId(page, UENO.店名, UENO.会社名);
    if (!ueno) throw new Error("上野閉店を登録できない");
    await 閉店にする(page, ueno, "上野閉店を閉店にする");
    マスタ.上野閉店 = UENO.店名;

    // カテゴリ: グッズの親カテゴリ（番号2）の下に、子カテゴリとして2つ作る
    const cat = new CategoryPage(page);
    for (const k of ["カードゲームA", "カードゲームB"] as const) {
      const name = rc(k);
      await cat.openChildrenOf(GOODS_ROOT_CATEGORY_ID);
      let hit = (await cat.rowValues()).filter((r) => r.nameJp === name);
      if (hit.length === 0) {
        await cat.fill({ nameJp: name });
        await cat.submitAndWait();
        for (const w of await expectSaved(page, `カテゴリ「${name}」の登録`)) issue(w);
        await cat.openChildrenOf(GOODS_ROOT_CATEGORY_ID);
        hit = (await cat.rowValues()).filter((r) => r.nameJp === name);
      }
      if (hit.length !== 1) throw new Error(`カテゴリ「${name}」が ${hit.length} 件`);
      マスタ[k] = name;
      if (k === "カードゲームA") マスタ.カードゲームAのID = hit[0].id;
    }
    // カードセット
    for (const [k, key] of [["SET-A", "SET_A"], ["SET-B", "SET_B"]] as const) {
      const name = rc(k);
      await ensureCardset(page, name, name, name.slice(0, 32), issue);
      マスタ[key] = name;
    }
    // タグ
    const tag = new TagPage(page);
    await tag.openNew();
    マスタ.在庫タグA = rc("在庫タグA");
    await tag.register({ 名称日: マスタ.在庫タグA, 名称英: rc("Stock Tag A"), 並び順: "1" }, "タグ「在庫タグA」の登録");
    // 部門（部門コードは使われていない数字）
    const dept = new DepartmentPage(page);
    await dept.openNew();
    let code = "";
    for (let i = 0; i < 20; i++) { const c = String(80000000 + Math.floor(Math.random() * 9999999)); if (!部門コードがある(c)) { code = c; break; } }
    if (!code) throw new Error("使われていない部門コードを選べない");
    マスタ.カード部門 = rc("カード部門");
    await dept.register({ 部門名: マスタ.カード部門, 部門コード: code, 免税区分: "対象外", MTGBuyer表示フラグ: false }, "部門「カード部門」の登録");
    // 略称タグ・売上分析タグ
    const st = new ShortTagPage(page);
    await st.openNew();
    マスタ.略称A = rc("略称A");
    await st.register({ 名称: マスタ.略称A, 並び順: "1", アルファベット順: false }, "略称タグ「略称A」の登録");
    const sa = new SalesAnalysisTagPage(page);
    await sa.openNew();
    マスタ.分析A = rc("分析A");
    await sa.register({ 名称: マスタ.分析A, 並び順: "1" }, "売上分析タグ「分析A」の登録");
    // 棚番号: 入力チェックを通る名前で画面から登録し、E2E の行の名前を「A-01」（印つき）に書き換える
    const shelf = new ShelfNumberPage(page);
    await shelf.openNew();
    let tmp = "";
    for (let i = 0; i < 30; i++) { const c = `Q-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`; if (!棚番号の名前がある(c)) { tmp = c; break; } }
    if (!tmp) throw new Error("使われていない棚番号の名前を選べない");
    const shelfId = await shelf.register({ 名称: tmp, 並び順: "1" }, `棚番号「${tmp}」の登録`);
    マスタ.棚番号A01 = rc("A-01");
    棚番号の名前を書き換える("S-M04-01-MASTER: 棚番号の名前を A-01 にする（入力チェックを通らない名前）", shelfId, tmp, マスタ.棚番号A01);
    issue(`棚番号「A-01」は名前の入力チェックを通らないので、「${tmp}」で画面から登録し、その棚番号の名前だけ DB で「${マスタ.棚番号A01}」に書き換えた`);
  });
  for (const k of ["SET-A", "SET-B", "カードゲームA", "カードゲームB", "在庫タグA", "カード部門", "略称A", "分析A", "A-01", "上野閉店"]) 対応.set(k, rc(k));
  マスタあり = true;
});

// ---- 商品のシード ----
type 在庫の定め = { 店舗: "東京本店" | "大阪支店"; 数: number };
type 商品の定め = { 正本: string; 名前?: string; 在庫: 在庫の定め[]; 呼び名?: string; カテゴリ?: "カードゲームA" };
type シードの定め = { 先頭: string; 商品: 商品の定め[]; 同じ商品の規格?: boolean; 消さない?: boolean };

/** 作った商品（正本の商品コード → 商品ID） */
export const 商品ID = new Map<string, string>();

async function 商品を作る(browser: Browser, seedId: string, d: シードの定め): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await 承認者を用意する(browser);
  const 定め = getSeed(seedId).状態・属性;
  const 実 = d.商品.map((p) => ({ ...p, 実: 先頭に印(d.先頭, p.正本) }));
  const 名前 = (p: 商品の定め & { 実: string }): string => {
    if (!p.名前) return p.実;
    対応.set(p.名前, rc(p.名前));
    return rc(p.名前);
  };
  await withAdminSession(browser, M0401_ALL, async (page) => {
    page.setDefaultTimeout(60_000);
    const categoryId = await readExistingGoodsChildCategoryId(page);
    const lines = (d.同じ商品の規格 ? 実.slice(0, 1) : 実).map((p) => ({
      code: p.実, nameJp: 名前(p), nameEn: 名前(p),
      values: { "基準価格": "1000", "販売価格": "1000", "買取価格": "100", "原価単価": "10", ...(p.カテゴリ ? { "商品カテゴリ(ID)": マスタ.カードゲームAのID } : {}) },
    }));
    await registerGoodsCsv(page, { what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId, lines, onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 180_000 });
    for (const p of d.同じ商品の規格 ? 実.slice(0, 1) : 実) 商品ID.set(p.正本, await openProductEditByCode(page, p.実));
    if (d.同じ商品の規格) {
      const pid = 商品ID.get(実[0].正本)!;
      for (const p of 実.slice(1)) {
        await openClassList(page, pid);
        await addClass(page, pid, { 言語: "日本語", 状態: "ニアミント", 商品コード: p.実, 基準価格: "1000", 販売価格: "1000", 買取価格: "100" }, `${seedId}: ${p.実}`, issue);
        商品ID.set(p.正本, pid);
      }
    }
    // 入庫（在庫編集）。登録者は全店舗試験管理者、承認は別の試験管理者
    const baseline = 在庫承認の最大ID();
    const 入庫 = 実.flatMap((p) => p.在庫.filter((z) => z.数 > 0).map((z) => ({ code: p.実, 店舗: z.店舗, 数: z.数 })));
    for (const z of 入庫) {
      const stock = await searchStockByCode(page, { 商品コード: z.code, 店舗: z.店舗, 在庫区分: "EC-CUBE" });
      await stock.openEdit(stock.row(z.code, z.店舗, "EC-CUBE"));
      await registerStockEdit(page, { changeType: "入庫/その他", reason: "試験データ登録", quantity: String(z.数), purchasePrice: "0", approverName: 承認者.名前 }, `${seedId}: ${z.code} の在庫編集（${z.店舗}）`, issue);
    }
    if (入庫.length) {
      await withAdminSession(browser, 承認者.account, async (ap) => {
        ap.setDefaultTimeout(60_000);
        for (const 店舗 of [...new Set(入庫.map((z) => z.店舗))]) {
          const list = new StockApprovalListPage(ap);
          await list.open(店舗);
          const want = 入庫.filter((z) => z.店舗 === 店舗).length;
          const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === ALL_NAME && Number(r.id) > baseline);
          if (rows.length < want) throw new Error(`${seedId}: 在庫編集承認一覧（${店舗}）に未承認の行が ${rows.length} 件（${want} 件のはず）`);
          await list.approve(rows.slice(0, want).map((r) => r.id), `${seedId} の在庫編集の承認（${店舗}）`, issue);
        }
      });
    }
  });
  // 対象以外の店舗別在庫（自動で作られた在庫0の行）を消す（シード表のとおり。E2E の商品の行だけ）
  if (!d.消さない) {
    const 残す = 実.flatMap((p) => (p.在庫.length ? p.在庫 : [{ 店舗: "東京本店" as const, 数: 0 }]).map((z) => ({ 商品コード: p.実, 店舗ID: 店舗ID[z.店舗], 在庫区分: "EC-CUBE" as const })));
    const n = 対象以外の店舗別在庫を消す(`${seedId}: 対象以外の店舗別在庫を消す`, 実.map((p) => p.実), 残す);
    issue(`商品規格の登録で自動で作られた、対象以外の店舗別在庫 ${n} 行を DB で消した（E2E の商品の行だけ。シード表のとおり）`);
  }
  // シード表が定める呼び名だけ控える
  for (const p of 実) if (p.呼び名 && 定め.includes(p.呼び名)) notesOf(seedId).set(p.呼び名, 商品ID.get(p.正本)!);
}

// notes はシードの作り方に渡されるので、作り方の中で受け取ったものを使う
const notesBy = new Map<string, { set: (k: string, v: string) => void }>();
function notesOf(seedId: string) { const n = notesBy.get(seedId); if (!n) throw new Error(`${seedId}: notes が無い`); return n; }

function 商品(seedId: string, d: シードの定め): void {
  defineSeed(seedId, { needs: ["S-M04-01-ADM-ALL", "S-M04-01-MASTER"] }, async ({ browser, notes }) => {
    notesBy.set(seedId, notes);
    await 商品を作る(browser, seedId, d);
  });
}
const T = (数: number): 在庫の定め[] => [{ 店舗: "東京本店", 数 }];
const O = (数: number): 在庫の定め[] => [{ 店舗: "大阪支店", 数 }];
const 印 = (n: string, s: string) => `〔商品ID-M0401-${n}${s}〕`;

商品("S-M04-01-ACTION-029", { 先頭: "M0401-AUTH-029", 商品: [{ 正本: "M0401-AUTH-029-01", 在庫: T(5), 呼び名: 印("029", "A") }, { 正本: "M0401-AUTH-029-02", 在庫: T(3), 呼び名: 印("029", "B") }] });
for (const n of ["030", "033", "037"]) 商品(`S-M04-01-ACTION-${n}`, { 先頭: `NOAUTH-M0401-01-${n}`, 商品: [{ 正本: `NOAUTH-M0401-01-${n}`, 在庫: O(4), 呼び名: 印(n, "") }] });
for (const n of ["031", "034", "038"]) 商品(`S-M04-01-ACTION-${n}`, { 先頭: `M0401-MULTI-${n}`, 商品: [{ 正本: `M0401-MULTI-${n}-TOKYO`, 在庫: T(2), 呼び名: 印(n, "A") }, { 正本: `M0401-MULTI-${n}-OSAKA`, 在庫: O(2), 呼び名: 印(n, "B") }] });
for (const n of ["032", "036"]) 商品(`S-M04-01-ACTION-${n}`, { 先頭: `M0401-AUTH-${n}-01`, 商品: [{ 正本: `M0401-AUTH-${n}-01`, 在庫: T(5), 呼び名: 印(n, "") }] });
商品("S-M04-01-ACTION-035", { 先頭: "ZERO-M0401-01", 商品: [{ 正本: "ZERO-M0401-01", 在庫: [], 呼び名: 印("035", "") }] });
for (const n of ["045", "046", "050"]) 商品(`S-M04-01-${n === "050" ? "BTN" : "ACTION"}-${n}`, { 先頭: `M0401-${n}`, 商品: [{ 正本: `M0401-${n}-A`, 在庫: T(5), 呼び名: 印(n, "A") }, { 正本: `M0401-${n}-B`, 在庫: T(3), 呼び名: 印(n, "B") }] });
for (const n of ["061", "062"]) 商品(`S-M04-01-CBCSVHIDE-${n}`, { 先頭: `M0401-CB${n}-A`, 商品: [{ 正本: `M0401-CB${n}-A`, 在庫: T(2), 呼び名: 印(n, "A") }] });
商品("S-M04-01-CBHISTPRICE-064", { 先頭: "M0401-CB064", 消さない: true, 商品: [{ 正本: "M0401-CB064-A", 在庫: [], 呼び名: 印("064", "A") }, { 正本: "M0401-CB064-B", 在庫: [], 呼び名: 印("064", "B") }] });
商品("S-M04-01-CBMOVEOK-057", { 先頭: "M0401-CB057", 商品: [{ 正本: "M0401-CB057-A", 在庫: T(5), 呼び名: 印("057", "A") }, { 正本: "M0401-CB057-B", 在庫: T(3), 呼び名: 印("057", "B") }] });
商品("S-M04-01-CBXFERMULTI-058", { 先頭: "M0401-CB058", 商品: [{ 正本: "M0401-CB058-A", 在庫: [{ 店舗: "東京本店", 数: 2 }, { 店舗: "大阪支店", 数: 2 }], 呼び名: 印("058", "A") }] });
商品("S-M04-01-CBXFERZERO-060", { 先頭: "M0401-CB060", 商品: [{ 正本: "M0401-CB060-A", 在庫: T(3), 呼び名: 印("060", "A") }, { 正本: "M0401-CB060-B", 在庫: [], 呼び名: 印("060", "B") }] });
商品("S-M04-01-COUNT-014", { 先頭: "COUNT-M0401", 商品: ["A", "B", "C"].map((s, i) => ({ 正本: `COUNT-M0401-0${i + 1}-014`, 在庫: [], 呼び名: 印("014", s) })) });
// 024・025 の比較用（検索語に当たらない商品）は、それぞれのシードの中で一緒に作る
const 比較用 = new Map<string, string>([["S-M04-01-CSV-024", "CSV-COMPARE-024"], ["S-M04-01-CSV-025", "CSV-COMPARE-025"]]);
for (const [seedId, code] of 比較用) {
  // 先頭が違うので、別の定めで作る（呼び名 〔商品ID-M0401-024B〕 等）
  const n = seedId.slice(-3);
  defineSeed(`${seedId}`, { needs: ["S-M04-01-ADM-ALL", "S-M04-01-MASTER"] }, async ({ browser, notes }) => {
    notesBy.set(seedId, notes);
    await 商品を作る(browser, seedId, { 先頭: n === "024" ? "REC-M0401" : "INFO-M0401", 商品: [{ 正本: n === "024" ? "REC-M0401-01" : "INFO-M0401-01", 在庫: T(1), 呼び名: 印(n, "A") }] });
    await 商品を作る(browser, seedId, { 先頭: code, 商品: [{ 正本: code, 在庫: T(1), 呼び名: 印(n, "B") }] });
  });
}
defineSeed("S-M04-01-CSVROWS-056", { needs: ["S-M04-01-ADM-ALL", "S-M04-01-MASTER"] }, async ({ browser, notes }) => {
  notesBy.set("S-M04-01-CSVROWS-056", notes);
  await 商品を作る(browser, "S-M04-01-CSVROWS-056", { 先頭: "M0401-056", 商品: [4, 5, 6].map((q, i) => ({ 正本: `M0401-056-0${i + 1}`, 在庫: T(q), 呼び名: 印("056", "ABC"[i]) })) });
  // 比較用（検索語に当たらない商品）
  await 商品を作る(browser, "S-M04-01-CSVROWS-056", { 先頭: "CMP0401-056", 商品: [{ 正本: "CMP0401-056", 在庫: T(7) }] });
});
商品("S-M04-01-DEFAULT-051", { 先頭: "M0401-051", 商品: Array.from({ length: 11 }, (_, i) => ({ 正本: `M0401-051-${String(i + 1).padStart(2, "0")}`, 在庫: T(5), 呼び名: 印("051", "ABCDEFGHIJK"[i]) })) });
商品("S-M04-01-LINK-042", { 先頭: "STK-PART-001-042", 商品: [{ 正本: "STK-PART-001-042", 名前: "部分一致商品Alpha-042", 在庫: T(5), 呼び名: 印("042", "") }] });
商品("S-M04-01-OPTION-052", { 先頭: "M0401-052-A", 商品: [{ 正本: "M0401-052-A", 在庫: T(5), 呼び名: 印("052", "") }] });
商品("S-M04-01-PAGING-043", { 先頭: "PAGE11-M0401", 商品: Array.from({ length: 11 }, (_, i) => ({ 正本: `PAGE11-M0401-${String(i + 1).padStart(3, "0")}`, 在庫: [], 呼び名: 印("043", "ABCDEFGHIJK"[i]) })) });
商品("S-M04-01-ROWS-053", { 先頭: "M0401-053", 同じ商品の規格: true, 商品: [{ 正本: "M0401-053-A1", 在庫: T(5), 呼び名: 印("053", "") }, { 正本: "M0401-053-A2", 在庫: T(3) }] });
商品("S-M04-01-SAVE-017", { 先頭: "STK-PART-001-017", 商品: [{ 正本: "STK-PART-001-017", 名前: "部分一致商品Alpha-017", 在庫: T(1), カテゴリ: "カードゲームA", 呼び名: 印("017", "") }] });
商品("S-M04-01-STORES-055", { 先頭: "M0401-055-A", 商品: [{ 正本: "M0401-055-A", 在庫: [{ 店舗: "東京本店", 数: 3 }, { 店舗: "大阪支店", 数: 5 }], 呼び名: 印("055", "") }] });

// ---- サジェストのマスタ（047・049） ----
defineSeed("S-M04-01-SUGGEST-047", { needs: ["S-M04-01-ADM-ALL"] }, async ({ browser }) => {
  const term = rc("M0401-047"); 対応.set("M0401-047", term);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const tag = new TagPage(page);
    for (const s of ["A", "B"]) {
      const name = `在庫タグ${term}-${s}`; 対応.set(`在庫タグM0401-047-${s}`, name);
      await tag.openNew();
      await tag.register({ 名称日: name, 名称英: `Stock Tag ${term}-${s}`, 並び順: "1" }, `タグ「${name}」の登録`);
    }
  });
});
defineSeed("S-M04-01-SUGGEST-049", { needs: ["S-M04-01-ADM-ALL"] }, async ({ browser }) => {
  const term = rc("M0401-049"); 対応.set("M0401-049", term);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const st = new ShortTagPage(page);
    const sa = new SalesAnalysisTagPage(page);
    for (const s of ["A", "B"]) {
      const a = `略称${term}-${s}`; 対応.set(`略称M0401-049-${s}`, a);
      await st.openNew();
      await st.register({ 名称: a, 並び順: "1", アルファベット順: false }, `略称タグ「${a}」の登録`);
      const b = `分析${term}-${s}`; 対応.set(`分析M0401-049-${s}`, b);
      await sa.openNew();
      await sa.register({ 名称: b, 並び順: "1" }, `売上分析タグ「${b}」の登録`);
    }
  });
});

export { TOKYO, OSAKA };
