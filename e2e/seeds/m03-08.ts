/**
 * M03-08 商品規格一覧の画面シード。正本: cases/M03-08_seed_data.tsv
 * 仕分け直し（review/not_runnable_recheck_cases2.tsv）で流せる見込みになったケースの分（記録 review/M03-08_progress_2026-11-11_dev.md）。
 *
 * - S-M03-08-ADM: メンバー管理で、権限「システム管理者」の試験管理者を登録する。開発環境に手動テスト用の同じログインIDのメンバーがあるので、
 *   ログインID・名前に実行の印を付けて作る（M03-26 などと同じ）。
 * - S-M03-08-MASTER: シード表は DB で店舗・在庫場所・言語・状態・部門などを登録すると定める。DB シードでマスタを登録しない決まりなので、
 *   開発環境に既にあるマスタ（言語 日本語・英語、状態 NM・SP・MP・HP、部門10、公開ステータス 公開・非公開・廃止）を DB の参照で確かめるだけにする。
 * - 商品: シード表のとおり、グッズ商品CSV登録で1行を取り込み（取り込みで状態NMの規格が1件できる）、商品マスターの検索から商品規格一覧を開き、
 *   取り込みでできた規格を編集し、2件目からは商品規格一覧の「新規作成」で登録する（pages/admin/m03_30_products.ts の部品）。
 *   商品コード・商品名には実行の印を付ける（依頼者決定 2026-10-28）。ケースの文の同じ値も、同じ印を付けた値として読む。
 * - 画面で作れない状態は、E2E が作った商品規格だけに DB で書き足す（依頼者決定 2026-11-10。db/m03_08.ts）:
 *   言語未設定・状態未設定（画面は仮の値で登録し、DB で外す）。
 *   「商品規格0件（取り込みでできた規格をDBで直接削除する）」は、アプリの商品規格の削除と同じく、公開ステータスを廃止にして削除済みの印を付ける（行は消さない。正本の外の補い）。
 * - 在庫（006 の本店ECCUBE在庫1・033 の本店ECCUBE在庫5）: 在庫検索一覧から本店・EC-CUBE の在庫編集で入庫し、別のメンバーが承認する（F04 の登録者・承認者）。
 *   006 はシード表が「廃止の規格の在庫はDBへ直接設定する」と定めるが、廃止にする前に画面で入庫して同じ状態にした（正本の外の補い）。
 * - スマレジ連携有効（003）・スマレジ在庫（009・032）は作らない（スマレジは後回しの決定。review/recheck_not_buildable_M03-08.tsv）。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { ある言語, 部門が有効か, 状態の名前 } from "../db/m03_09";
import { 在庫承認の最大ID } from "../db/f03_08";
import { 規格の言語を外す, 規格の状態を外す, 規格を削除済みにする, 商品がある, 商品コードの規格の数 } from "../db/m03_08";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc, rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { 使い回して作る } from "./seed_reuse";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { chooseByLabel, expectSaved } from "../pages/admin/common";
import { F04承認者, F04登録者, 管理者を用意する, 本店の店名 } from "../pages/admin/f04_setup";
import { ensureMember } from "../pages/admin/member";
import { downloadGoodsCsvTemplate } from "../pages/admin/m03_01_goods_csv";
import { searchStockByCode } from "../pages/admin/m04_02_rc_stock";
import { addClass, deleteClassOnEdit, displayedClassId, openClassList, openClassListByCode, registerGoodsProduct } from "../pages/admin/m03_30_products";
import { ClassEditPage } from "../pages/admin/m03_09_class_edit";
import { loggedInMemberName, registerStockEdit, StockApprovalListPage } from "../pages/admin/stock_edit";

/** 試験管理者（ログインID・名前に実行の印） */
export const M0308_ADMIN: Account = { loginId: rcFixed("m0308_admin").toLowerCase(), password: "Passw0rd!M0308" };
const ADMIN_NAME = rcFixed("M03-08試験管理者");

defineSeed("S-M03-08-ADM", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await page.goto(adminUrl("/setting/system/member/new"));
    const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((os) => os
      .map((o) => o as HTMLOptionElement).filter((o) => o.value !== "").map((o) => o.textContent?.trim() ?? "").filter(Boolean));
    if (stores.length === 0) throw new Error(`${seed.シードID}: メンバーに割り当てられる店舗が画面に無い`);
    await ensureMember(page, {
      名前: ADMIN_NAME, 所属店舗: stores[0], ログインID: M0308_ADMIN.loginId, メールアドレス: `${M0308_ADMIN.loginId}@example.test`,
      パスワード: M0308_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: stores[0], 編集可能店舗: [stores[0]],
    });
  });
  reportSeedIssue(seed.シードID, "開発環境に手動テスト用の同じログインIDのメンバーがあるので、ログインID・名前に実行の印を付けて作った（権限はシステム管理者）");
});

defineSeed("S-M03-08-MASTER", async ({ seed }) => {
  const langs = ある言語(["日本語", "英語"]);
  if (langs.length !== 2) throw new Error(`言語「日本語」「英語」が登録されていない（あるもの: ${langs.join("、")}）`);
  const states = 状態の名前();
  for (const s of ["ニアミント", "スライトリープレイド", "モデレトリープレイド", "ヘビープレイド"]) if (!states.includes(s)) throw new Error(`状態「${s}」が無い（${states.join("、")}）`);
  if (!部門が有効か("10")) throw new Error("部門10が有効でない");
  reportSeedIssue(seed.シードID, "マスタは DB シードで登録せず、開発環境に既にあるもの（言語 日本語・英語、状態 NM・SP・MP・HP、部門10、公開ステータス 公開・非公開・廃止）を使い、DB の参照で確かめた。書き換えていない");
});

// ---- 商品と規格 ----

const 状態の名 = { NM: "ニアミント", SP: "スライトリープレイド", MP: "モデレトリープレイド", HP: "ヘビープレイド" } as const;
type 状態 = keyof typeof 状態の名;
type 規格の定め = {
  /** 〔規格ID-M0308-◯◯〕の◯◯ */
  呼び名: string; コード: string; 公開: "公開" | "非公開" | "廃止"; 言語: "日本語" | "英語" | "未設定"; 状態: 状態 | "未設定";
  販売制限数?: string; 価格?: [基準: string, 販売: string, 買取: string]; 在庫?: number;
};
type 商品の定め = { 番号: string; 商品名: string; 規格: 規格の定め[] };

const K = (呼び名: string, コード: string, 公開: 規格の定め["公開"], 言語: 規格の定め["言語"], 状態: 規格の定め["状態"], more: Partial<規格の定め> = {}): 規格の定め =>
  ({ 呼び名, コード, 公開, 言語, 状態, ...more });
/** 002・005・023 の7規格（稼働中4・廃止3） */
const 七規格 = (n: string): 規格の定め[] => [
  K(`${n}A`, `M0308-ACT-01-${n}`, "公開", "日本語", "NM"), K(`${n}B`, `M0308-ACT-02-${n}`, "非公開", "英語", "SP"),
  K(`${n}C`, `M0308-ACT-03-${n}`, "公開", "未設定", "NM"), K(`${n}D`, `M0308-ACT-04-${n}`, "公開", "日本語", "未設定"),
  K(`${n}E`, `M0308-RET-01-${n}`, "廃止", "日本語", "HP"), K(`${n}F`, `M0308-RET-02-${n}`, "廃止", "未設定", "MP"),
  K(`${n}G`, `M0308-RET-03-${n}`, "廃止", "日本語", "未設定"),
];

const 定め: Record<string, 商品の定め> = {
  "LIST-001": { 番号: "001", 商品名: "M03-08表示商品-001", 規格: [] },
  "LIST-002": { 番号: "002", 商品名: "M03-08表示商品-002", 規格: 七規格("002") },
  "COUNT-004": { 番号: "004", 商品名: "M03-08表示商品-004", 規格: 七規格("004").slice(0, 4) },
  "RETIRED-LIST-005": { 番号: "005", 商品名: "M03-08表示商品-005", 規格: 七規格("005") },
  "RETIRED-ROW-006": { 番号: "006", 商品名: "M03-08表示商品-006", 規格: [K("006", "M0308-RET-01-006", "廃止", "日本語", "HP", { 販売制限数: "5", 価格: ["700", "600", "200"], 在庫: 1 })] },
  "COLLAPSE-007": { 番号: "007", 商品名: "M03-08表示商品-007", 規格: [K("007", "M0308-RET-01-007", "廃止", "日本語", "HP")] },
  "EXPAND-008": { 番号: "008", 商品名: "M03-08表示商品-008", 規格: [K("008", "M0308-RET-01-008", "廃止", "日本語", "HP")] },
  "NEWLINK-011": { 番号: "011", 商品名: "M03-08表示商品-011", 規格: [] },
  "EDITLINK-012": { 番号: "012", 商品名: "M03-08表示商品-012", 規格: [K("012", "M0308-ACT-01-012", "公開", "日本語", "NM")] },
  "RETURN-013": { 番号: "013", 商品名: "M03-08表示商品-013", 規格: [] },
  "NOTFOUND-014": { 番号: "014", 商品名: "M03-08表示商品-014", 規格: [] },
  "NEW-017": { 番号: "017", 商品名: "M03-08新規登録商品-017", 規格: [] },
  "UPDATE-020": { 番号: "020", 商品名: "M03-08表示商品-020", 規格: [K("020", "M0308-ACT-01-020", "公開", "日本語", "NM", { 販売制限数: "10", 価格: ["1200", "1000", "400"] })] },
  "DELETE-021": { 番号: "021", 商品名: "M03-08表示商品-021", 規格: [K("021A", "M0308-ACT-01-021", "公開", "日本語", "NM"), K("021B", "M0308-ACT-02-021", "非公開", "英語", "SP")] },
  "CLEAR-023": { 番号: "023", 商品名: "M03-08表示商品-023", 規格: 七規格("023") },
  "COUNTRET-027": { 番号: "027", 商品名: "M0308-027-PROD", 規格: [
    K("027A", "M0308-027-ACT-01", "公開", "日本語", "NM"), K("027B", "M0308-027-ACT-02", "非公開", "英語", "SP"), K("027C", "M0308-027-ACT-03", "公開", "日本語", "MP"),
    K("027D", "M0308-027-RET-01", "廃止", "日本語", "HP"), K("027E", "M0308-027-RET-02", "廃止", "日本語", "NM"),
  ] },
  "CLEARZERO-028": { 番号: "028", 商品名: "M0308-028-PROD", 規格: [
    K("028A", "M0308-028-ACT-01", "公開", "未設定", "NM"), K("028B", "M0308-028-ACT-02", "非公開", "日本語", "未設定"), K("028C", "M0308-028-RET-01", "廃止", "未設定", "HP"),
  ] },
  "CLEARZERONAV-029": { 番号: "029", 商品名: "M0308-029-PROD", 規格: [K("029A", "M0308-029-ACT-01", "公開", "未設定", "NM"), K("029B", "M0308-029-ACT-02", "非公開", "日本語", "未設定")] },
  "CLEARNAV-030": { 番号: "030", 商品名: "M0308-030-PROD", 規格: [K("030A", "M0308-030-ACT-01", "公開", "日本語", "NM"), K("030B", "M0308-030-ACT-02", "非公開", "英語", "SP")] },
  "EMPTYSPEC-031": { 番号: "031", 商品名: "M03-08規格無し商品-031", 規格: [] },
  "STOCKECC-033": { 番号: "033", 商品名: "M03-08ECCUBE在庫商品-033", 規格: [K("033", "M0308-ACT-01-033", "公開", "日本語", "NM", { 在庫: 5 })] },
  "NORETIRED-034": { 番号: "034", 商品名: "M03-08廃止無し商品-034", 規格: [K("034", "M0308-ACT-01-034", "公開", "日本語", "NM")] },
  "CBLIST-035": { 番号: "035", 商品名: "M0308-CB035-商品", 規格: [K("035A", "M0308-CB035-A", "公開", "日本語", "NM"), K("035B", "M0308-CB035-B", "公開", "日本語", "未設定"), K("035C", "M0308-CB035-C", "廃止", "日本語", "未設定")] },
  "CBLIST-036": { 番号: "036", 商品名: "M0308-CB036-商品", 規格: [K("036A", "M0308-CB036-A", "公開", "日本語", "NM"), K("036B", "M0308-CB036-B", "公開", "未設定", "NM"), K("036C", "M0308-CB036-C", "廃止", "未設定", "HP")] },
};

/** 開いている商品規格登録/編集画面で、言語・状態・部門10・連携しない・公開ステータス・販売制限数・価格を入れて「商品規格を登録」する */
async function 規格を整える(page: Page, v: { 言語?: string; 状態?: 状態; 公開?: string; 販売制限数?: string; 価格?: [string, string, string] }, what: string, issue: (m: string) => void): Promise<void> {
  const e = new ClassEditPage(page);
  if (v.言語) await chooseByLabel(e.言語, v.言語);
  if (v.状態) await e.状態を選ぶ(状態の名[v.状態]);
  await e.部門を選ぶ("10");
  await e.スマレジ連携を選ぶ(false);
  if (v.公開) await e.公開ステータスを選ぶ(v.公開);
  if (v.販売制限数 !== undefined) await e.販売制限数.fill(v.販売制限数);
  if (v.価格) {
    const [基準, 販売, 買取] = v.価格;
    // 販売価格が基準価格と違うときはセールフラグを付ける（シード表: セールフラグにチェックを入れ、販売価格に…）
    if (販売 !== 基準) await e.セールフラグ.check(); else await e.セールフラグ.uncheck();
    await e.基準価格.fill(基準); await e.販売価格.fill(販売); await e.買取価格.fill(買取);
  }
  page.once("dialog", (d) => { issue(`${what}: 確認の表示「${d.message()}」で OK を押した`); d.accept().catch(() => {}); });
  const r = await e.登録を押す();
  for (const w of await expectSaved(page, `${what}: 商品規格の登録`)) issue(`${what}: 警告「${w}」`);
  const p = new URL(r.URL).pathname;
  if (!/\/product\/product\/class\/\d+\/edit\/\d+$/.test(p) && !(v.公開 === "廃止" && /\/product\/product\/class\/\d+$/.test(p))) throw new Error(`${what}: 登録後に商品規格登録編集画面へ移らない（${r.URL}）`);
}

/** 本店・EC-CUBE の在庫編集で入庫し、別のメンバーが在庫編集承認一覧で承認する */
async function 本店に入庫する(browser: Browser, code: string, 数: number, what: string, issue: (m: string) => void): Promise<void> {
  await 管理者を用意する(browser);
  const shop = await 本店の店名(browser);
  const baseline = 在庫承認の最大ID();
  let registrant = "";
  await withAdminSession(browser, F04登録者.account, async (page) => {
    page.setDefaultTimeout(60_000);
    const stock = await searchStockByCode(page, { 商品コード: code, 店舗: shop, 在庫区分: "EC-CUBE" });
    await stock.openEdit(stock.row(code, shop, "EC-CUBE"));
    await registerStockEdit(page, { changeType: "入庫/その他", reason: `${code}-試験データ`, quantity: String(数), purchasePrice: "0", approverName: F04承認者.名前 }, `${what}: 在庫編集`, issue);
    registrant = await loggedInMemberName(page);
  });
  await withAdminSession(browser, F04承認者.account, async (page) => {
    page.setDefaultTimeout(60_000);
    const list = new StockApprovalListPage(page);
    await list.openAll(shop);
    const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === registrant && Number(r.id) > baseline && r.quantity === String(数));
    if (rows.length === 0) throw new Error(`${what}: 在庫編集承認一覧に、登録者「${registrant}」の未承認の行が無い`);
    try { await list.approve([rows[0].id], `${what}: 在庫編集の承認`, issue); } catch (err) {
      if (!String(err).includes("成功メッセージ")) throw err;
      await list.openAll(shop);
      if ((await list.rowValues()).some((r) => r.id === rows[0].id && r.status === "未承認")) throw err;
      issue(`${what}: 承認の成功の表示は出なかったが、承認一覧の行は未承認でなくなった`);
    }
  });
}

/** シード表の投入方法から、グッズ商品CSV登録で書く商品コード（取り込みでできる規格の商品コード）を読む */
function 取込のコード(seedId: string): string {
  const m = /グッズ商品CSV登録画面で、商品IDを空、商品コードに(M0308-[A-Z0-9-]+?)、/.exec(getSeed(seedId).投入方法);
  if (!m) throw new Error(`${seedId}: 投入方法からグッズ商品CSV登録の商品コードを読めない`);
  return m[1];
}

async function 商品を作る(browser: Browser, seedId: string, d: 商品の定め, notes: Notes, issue: (m: string) => void): Promise<void> {
  const 投入方法 = getSeed(seedId).投入方法;
  const csv = 取込のコード(seedId);
  const 取込の規格 = d.規格.find((k) => k.コード === csv);
  // 取り込みでできた規格（シード表の仮のコード M0308-TMP-…）の扱い: 画面で削除／DBで削除済みにする／残す
  const 仮の規格の扱い = 取込の規格 ? "使う" : 投入方法.includes(`商品コード${csv}の行の編集ボタンから商品規格編集画面を開き、商品規格を削除ボタン`) ? "画面で削除"
    : /商品規格0件は画面で指定できないため、グッズ商品CSV登録が同時に作った商品規格1件をDBで直接削除/.test(投入方法) ? "DBで削除済み" : "残す";
  const 印つき = (c: string) => rc(c);
  const ids = new Map<string, string>();
  let 商品ID = "";
  let 仮の規格ID = "";
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const tpl = await downloadGoodsCsvTemplate(page);
    const zeros = Object.fromEntries(tpl.headers.filter((h) => h.includes("地域") || h.includes("スマレジ連携")).map((h) => [h, "0"]));
    const p0 = 取込の規格?.価格 ?? ["500", "500", "200"];
    await registerGoodsProduct(page, {
      what: seedId, code: 印つき(csv), nameJp: rc(d.商品名), nameEn: rc(d.商品名),
      values: { "基準価格": p0[0], "販売価格": p0[0], "買取価格": p0[2], "原価単価": "10", ...zeros }, onIssue: issue,
    });
    const r = await openClassListByCode(page, 印つき(csv));
    商品ID = r.productId;
    notes.set(`〔商品ID-M0308-${d.番号}〕`, 商品ID);
    if (r.rows.length !== 1) throw new Error(`${seedId}: 取り込み直後の商品規格が1件でない（${r.rows.length}件）`);
    仮の規格ID = r.rows[0].商品規格ID;
    // 1) 規格を公開・非公開で作る（廃止・言語未設定・状態未設定はあとで）
    for (const k of d.規格) {
      const what = `${seedId}: ${印つき(k.コード)}`;
      const 仮の言語 = k.言語 === "未設定" ? "日本語" : k.言語;
      const 仮の状態: 状態 = k.状態 === "未設定" ? "NM" : k.状態;
      const 公開 = k.公開 === "廃止" ? "公開" : k.公開;
      if (k === 取込の規格) {
        const e = new ClassEditPage(page);
        await e.編集で開く(商品ID, 仮の規格ID);
        await 規格を整える(page, { 言語: 仮の言語, 状態: 仮の状態, 公開, 販売制限数: k.販売制限数, 価格: k.価格 }, what, issue);
        ids.set(k.呼び名, 仮の規格ID);
      } else {
        await openClassList(page, 商品ID);
        const [基準, , 買取] = k.価格 ?? ["500", "500", "200"];
        const id = await addClass(page, 商品ID, { 言語: 仮の言語, 状態: 状態の名[仮の状態], 商品コード: 印つき(k.コード), 基準価格: 基準, 販売価格: 基準, 買取価格: 買取 }, what, issue);
        await 規格を整える(page, { 公開, 販売制限数: k.販売制限数, 価格: k.価格 }, what, issue);
        ids.set(k.呼び名, id);
      }
      notes.set(`〔規格ID-M0308-${k.呼び名}〕`, ids.get(k.呼び名)!);
    }
  });
  // 2) 在庫（廃止にする前に入庫する）
  for (const k of d.規格) if (k.在庫) {
    await 本店に入庫する(browser, 印つき(k.コード), k.在庫, `${seedId}: ${印つき(k.コード)}`, issue);
    if (k.公開 === "廃止") issue(`${seedId}: シード表は廃止の規格の本店ECCUBE在庫${k.在庫}をDBへ直接設定すると定めるが、廃止にする前に在庫編集で入庫して同じ状態にした（正本の外の補い）`);
  }
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    // 3) 取り込みでできた仮の規格を画面で削除する（シード表の手順）
    if (仮の規格の扱い === "画面で削除") {
      const e = new ClassEditPage(page);
      await e.編集で開く(商品ID, 仮の規格ID);
      await deleteClassOnEdit(page, `${seedId}: ${印つき(csv)} の削除`, issue);
    }
    // 4) 廃止にする
    for (const k of d.規格) if (k.公開 === "廃止") {
      const e = new ClassEditPage(page);
      await e.編集で開く(商品ID, ids.get(k.呼び名)!);
      await 規格を整える(page, { 公開: "廃止" }, `${seedId}: ${印つき(k.コード)} を廃止`, issue);
    }
    await openClassList(page, 商品ID);
  });
  // 5) 画面で作れない状態を、E2E の規格だけに DB で書き足す
  if (仮の規格の扱い === "DBで削除済み") {
    規格を削除済みにする(seedId, [仮の規格ID]);
    issue(`${seedId}: 「商品規格0件（取り込みでできた規格をDBで直接削除）」は、アプリの商品規格の削除と同じく、その規格を公開ステータス廃止・削除済みの印にした（行は消さない。正本の外の補い）`);
  }
  const 言語なし = d.規格.filter((k) => k.言語 === "未設定").map((k) => ids.get(k.呼び名)!);
  const 状態なし = d.規格.filter((k) => k.状態 === "未設定").map((k) => ids.get(k.呼び名)!);
  if (言語なし.length) 規格の言語を外す(seedId, 言語なし);
  if (状態なし.length) 規格の状態を外す(seedId, 状態なし);
  if (言語なし.length || 状態なし.length) issue(`${seedId}: 言語未設定・状態未設定は画面で選べないので、仮の値（日本語・NM）で登録してから DB で外した（E2E の規格だけ）`);
}

/**
 * 使い回すシード（依頼者決定 2026-11-11「シードの使い回しを進めて」）。キーのシードは作らず、値のシードが作った商品を使う（元のシードも同じ）。
 * - 011（新規作成ボタンを押す）は 001（商品名の表示を見る）と同じ中身（規格0件の商品）。011 は商品名を確かめない。
 * - 008（「▼」を押して廃止規格一覧を開く）は 007（廃止規格一覧の初期の閉じた状態を見る）と同じ中身（廃止の規格1件）。どちらも商品名・コードを確かめず、開閉は画面の中だけ。
 */
const 使い回しの元: Record<string, string> = { "LIST-001": "LIST-001", "NEWLINK-011": "LIST-001", "COLLAPSE-007": "COLLAPSE-007", "EXPAND-008": "COLLAPSE-007" };

for (const [k, d] of Object.entries(定め)) {
  const seedId = `S-M03-08-${k}`;
  defineSeed(seedId, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const s = getSeed(seedId);
    if (!(s["状態・属性"] + s.投入方法).includes(d.商品名)) throw new Error(`${seedId}: シード表に商品名 ${d.商品名} が無い（作り方の表の誤り）`);
    for (const x of d.規格) if (!(s["状態・属性"] + s.投入方法).includes(x.コード)) throw new Error(`${seedId}: シード表に商品コード ${x.コード} が無い（作り方の表の誤り）`);
    const 元 = 使い回しの元[k];
    if (元) {
      // 使い回し（依頼者決定 2026-11-11）: 使うケースは商品規格一覧を開く・ボタンを押すだけで、商品と規格を変えず、商品名・コードも確かめない
      const ds = 定め[元];
      await 使い回して作る({
        seedId, canonical: `S-M03-08-${元}`, notes,
        rename: (l) => l.replace(`-M0308-${ds.番号}`, `-M0308-${d.番号}`),
        build: (n) => 商品を作る(browser, `S-M03-08-${元}`, ds, n, (m) => reportSeedIssue(`S-M03-08-${元}`, m)),
      });
    } else {
      await 商品を作る(browser, seedId, d, notes, issue);
    }
    // 「手順で入力する商品コードのデータが無い状態にする（あれば削除する）」は、実行の印を付けた商品コードで無いことを確かめる（印つきの値は前の実行と重ならない）
    const 手順のコード = { "NEW-017": "M0308-NEW-01", "UPDATE-020": "M0308-UPD-01" }[k];
    if (手順のコード && 商品コードの規格の数(rc(手順のコード)) !== 0) throw new Error(`${seedId}: 商品コード ${rc(手順のコード)} の規格がすでにある`);
    if (k === "NOTFOUND-014" && 商品がある("999999014")) throw new Error(`${seedId}: 商品ID 999999014 の商品が登録されている（正本は未登録を求める。消すのは判断待ち）`);
  });
}
