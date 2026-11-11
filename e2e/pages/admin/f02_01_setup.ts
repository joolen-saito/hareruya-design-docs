/**
 * F02-01 本店PC版ナビゲーションのシードが使う、管理画面の操作。セレクタはここだけに書く。
 * - カードセット管理の新規登録（カードセット名(日)・(英)・略称・リリース日）
 * - グッズ商品CSV登録で商品を作り、商品マスターで商品IDを読む（地域別販売制限・価格を行ごとに指定）
 * - 在庫検索一覧から在庫編集を開いて在庫を増減し、登録者とは別の管理者が在庫編集承認一覧で一括承認する
 *   （承認一覧の行は、この実行だけの登録者の未承認の行で選ぶ。DB の参照に頼らない＝共有の開発環境でも動く）
 * 画面の部品は M03-01・M04-02・F04 のものを使う。
 */
import { Browser, expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { RUN_MARK } from "../../lib/run_marker";
import { Account, adminUrl, withAdminSession } from "../../lib/session";
import { expectSaved } from "./common";
import { 本店の店名 } from "./f04_setup";
import { ensureMember } from "./member";
import { downloadGoodsCsvTemplate, readExistingGoodsChildCategoryId } from "./m03_01_goods_csv";
import { registerGoodsCsv } from "./m03_01_goods_register";
import { openProductEditByCode } from "./m03_23_seed_products";
import { searchStockByCode, stockInRow } from "./m04_02_rc_stock";
import { loggedInMemberName, registerStockEdit, StockApprovalListPage } from "./stock_edit";

export type Issue = (m: string) => void;

// ---------------------------------------------------------------------------
// カードセット
// ---------------------------------------------------------------------------

/** カードセット管理の新規登録。登録後のカードセット詳細（編集）のアドレス末尾のカードセットIDを返す */
export async function カードセットを登録する(page: Page, v: { 名日: string; 名英: string; 略称: string; リリース日: string }, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/cardset/new"));
  await page.waitForLoadState("load");
  await page.locator("#admin_cardset_nameJp").fill(v.名日);
  await page.locator("#admin_cardset_nameEn").fill(v.名英);
  await page.locator("#admin_cardset_code").fill(v.略称);
  const single = page.locator('input[name="admin_cardset[releaseDate]"]');
  if (await single.count()) await single.fill(v.リリース日);
  else {
    const [y, m, d] = v.リリース日.split("-");
    await page.locator('[name="admin_cardset[releaseDate][year]"]').selectOption(y);
    await page.locator('[name="admin_cardset[releaseDate][month]"]').selectOption(String(Number(m)));
    await page.locator('[name="admin_cardset[releaseDate][day]"]').selectOption(String(Number(d)));
  }
  await page.getByRole("button", { name: "登録", exact: true }).click();
  for (const w of await expectSaved(page, `カードセット「${v.名日}」の登録`)) issue(`カードセット「${v.名日}」の警告「${w}」`);
  const m = /\/cardset\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`カードセット「${v.名日}」を登録したが、カードセット詳細（編集）へ移らない（${page.url()}）`);
  return m[1];
}

// ---------------------------------------------------------------------------
// 商品（グッズ商品CSV登録）
// ---------------------------------------------------------------------------

export type グッズ商品 = { 商品コード: string; 商品名: string; 価格?: string; 地域別販売制限?: "0" | "1"; カードセットID?: string };
/** グッズ商品CSVの雛形の、カードセットの列の見出し（無ければ止める） */
function カードセットの列(headers: string[]): string {
  const h = headers.includes("カードセット(ID)") ? ["カードセット(ID)"] : headers.filter((x) => x.startsWith("カードセット"));
  if (h.length !== 1) throw new Error(`グッズ商品CSVの雛形に、カードセットの列が1つ無い（${h.join("・")}）`);
  return h[0];
}
export type 作ったグッズ = { 商品ID: string; 商品コード: string; 商品名: string };

/**
 * グッズ商品CSV登録で1〜数件を登録し（商品公開ステータスは公開・購入グループ「通常商品」）、商品マスターを商品コードで検索して商品IDを読む。
 * 地域別販売制限の列は行ごとの値（省略は 0＝日本語英語両サイト）。
 */
export async function グッズ商品を登録する(page: Page, seedId: string, defs: グッズ商品[], issue: Issue): Promise<作ったグッズ[]> {
  const categoryId = await readExistingGoodsChildCategoryId(page);
  const headers = (await downloadGoodsCsvTemplate(page)).headers;
  const 地域の列 = headers.filter((h) => h.includes("地域"));
  const 連携の列 = Object.fromEntries(headers.filter((h) => h.includes("スマレジ連携")).map((h) => [h, "0"]));
  await registerGoodsCsv(page, {
    what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId,
    common: { "購入グループ名称": "通常商品", ...連携の列 },
    lines: defs.map((d) => ({
      code: d.商品コード, nameJp: d.商品名, nameEn: d.商品名,
      values: {
        ...Object.fromEntries(地域の列.map((h) => [h, d.地域別販売制限 ?? "0"])),
        ...(d.価格 ? { "基準価格": d.価格, "販売価格": d.価格 } : {}),
        ...(d.カードセットID ? { [カードセットの列(headers)]: d.カードセットID } : {}),
      },
    })),
    onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 180_000,
  });
  const made: 作ったグッズ[] = [];
  for (const d of defs) made.push({ 商品ID: await openProductEditByCode(page, d.商品コード), 商品コード: d.商品コード, 商品名: d.商品名 });
  return made;
}

// ---------------------------------------------------------------------------
// 在庫（在庫編集 → 別の管理者の一括承認）
// ---------------------------------------------------------------------------

const PASS = "Passw0rd!F0201stock";
const 登録者 = { 名前: `F0201在庫登録者-${RUN_MARK}`, account: { loginId: `f0201reg${RUN_MARK}`.toLowerCase(), password: PASS } as Account };
const 承認者 = { 名前: `F0201在庫承認者-${RUN_MARK}`, account: { loginId: `f0201apr${RUN_MARK}`.toLowerCase(), password: PASS } as Account };
let 用意した = false;

/** 在庫の登録者と承認者（どちらも本店を編集できるシステム管理者。この実行だけの者）を一度だけ用意する */
async function 在庫の管理者を用意する(browser: Browser): Promise<string> {
  const shop = await 本店の店名(browser);
  if (用意した) return shop;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const a of [登録者, 承認者]) {
      await ensureMember(page, {
        名前: a.名前, 所属店舗: shop, ログインID: a.account.loginId, メールアドレス: `${a.account.loginId}@example.test`,
        パスワード: a.account.password, 権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
      });
    }
  });
  用意した = true;
  return shop;
}

export type 在庫の増減 = { 商品コード: string; 数: number; 区分: "入庫/その他" | "廃棄/廃棄(その他)"; 承認後の在庫: number };

/**
 * 在庫検索一覧で商品コード・本店・EC-CUBE の行を開き、在庫編集で在庫変動区分・在庫変動理由「結合試験」・在庫増減数・仕入単価0・承認通知先を入れて登録する。
 * そのあと承認者が在庫編集承認一覧で、登録者の未承認の行を選んで「一括承認」を押し、本店のEC-CUBE在庫が承認後の数になったことを確かめる。
 */
export async function 在庫を増減して承認する(browser: Browser, seedId: string, items: 在庫の増減[], issue: Issue): Promise<void> {
  if (items.length === 0) return;
  const shop = await 在庫の管理者を用意する(browser);
  await withAdminSession(browser, 登録者.account, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const it of items) {
      const stock = await searchStockByCode(page, { 商品コード: it.商品コード, 店舗: shop, 在庫区分: "EC-CUBE" });
      await stock.openEdit(stock.row(it.商品コード, shop, "EC-CUBE"));
      await registerStockEdit(page, {
        changeType: it.区分, reason: "結合試験", quantity: String(it.数), purchasePrice: "0", approverName: 承認者.名前,
      }, `${seedId}: ${it.商品コード} の在庫編集（${it.区分}・${it.数}）`, issue);
    }
    const registrant = await loggedInMemberName(page);
    if (registrant !== 登録者.名前) issue(`在庫の登録者の表示名が「${registrant}」（「${登録者.名前}」のはず）`);
  });
  await withAdminSession(browser, 承認者.account, async (page) => {
    page.setDefaultTimeout(60_000);
    const list = new StockApprovalListPage(page);
    await list.open(shop);
    const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === 登録者.名前);
    if (rows.length !== items.length) throw new Error(`${seedId}: 在庫編集承認一覧に、登録者「${登録者.名前}」の未承認の行が ${rows.length} 件（${items.length} 件のはず）`);
    await list.approve(rows.map((r) => r.id), `${seedId}: 在庫編集の一括承認（${items.length}件）`, issue);
    for (const it of items) {
      const after = await searchStockByCode(page, { 商品コード: it.商品コード, 店舗: shop, 在庫区分: "EC-CUBE" });
      const n = await stockInRow(after.row(it.商品コード, shop, "EC-CUBE"));
      expect(n, `${seedId}: ${it.商品コード} の承認後の在庫`).toBe(it.承認後の在庫);
    }
  });
}
