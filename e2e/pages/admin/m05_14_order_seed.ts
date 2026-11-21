/**
 * M05-14 対応状況設定の連携ケースの受注シードが使う、試験商品の用意。
 * M05-01 の部品（pages/admin/m05_01_orders.ts の 試験商品を用意する）と同じ作りだが、在庫の承認だけ違う。
 * 本店の在庫編集承認一覧は未承認の行が1,000件を超えて積み重なり、一覧の表示に今回の行が出ないため（2026-11-21 M05-14 の流しで確認）、
 * 今回の在庫変更の番号を DB から引き（参照だけ）、承認一覧を「?id=」で開いて承認する（M03-05 と同じ。共通の部品は変えず、ここに書く）。
 */
import { Browser, expect } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { 未承認の在庫変更CSVの番号 } from "../../db/m05_14_order";
import { withCreateOnceLock } from "../../lib/create_once_lock";
import { rcFixed } from "../../lib/run_marker";
import { Account, adminUrl, withAdminSession } from "../../lib/session";
import { downloadGoodsCsvTemplate } from "./m03_01_goods_csv";
import { registerGoodsCsv } from "./m03_01_goods_register";
import { openProductEditByCode } from "./m03_23_seed_products";
import { goodsCategoryIdForCsv } from "./m04_19_masters";
import { registerStockChangeCsv } from "./m04_19_stock_change_csv";
import { ensureMemberAligned, storeName, 本店ID } from "./m05_01_orders";
import { loggedInMemberName, StockApprovalListPage } from "./stock_edit";

/** 在庫を入れる登録者（承認は登録者と別のメンバーでないとできない）。使い回す決まった印つき */
const 在庫登録者 = { 名前: rcFixed("M05-14在庫登録者"), account: { loginId: rcFixed("m0514_stockreg").toLowerCase(), password: "Passw0rd!M0514S" } as Account };

export type 試験商品 = { 商品ID: string; 商品コード: string; 商品名: string };
let productPromise: Promise<試験商品> | null = null;

/** この実行の注文に使う商品を1件作って本店に入庫して承認する（1回の実行で1度だけ）。価格100円・在庫90 */
export function 試験商品を用意する(browser: Browser, 承認者: { 名前: string; account: Account }, 商品コード: string, 商品名: string, onIssue: (m: string) => void): Promise<試験商品> {
  if (!productPromise) {
    productPromise = make(browser, 承認者, 商品コード, 商品名, onIssue);
    productPromise.catch(() => { productPromise = null; });
  }
  return productPromise;
}

async function make(browser: Browser, 承認者: { 名前: string; account: Account }, 商品コード: string, 商品名: string, onIssue: (m: string) => void): Promise<試験商品> {
  const 本店 = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureMemberAligned(page, {
      名前: 在庫登録者.名前, ログインID: 在庫登録者.account.loginId, メールアドレス: `${在庫登録者.account.loginId}@example.test`, パスワード: 在庫登録者.account.password,
      権限: "システム管理者", 所属店舗ID: 本店ID, デフォルト検索表示店舗ID: 本店ID, 編集可能店舗ID: [本店ID],
    }, onIssue);
    return storeName(page, 本店ID);
  });
  const 入庫数 = 90;
  const { 商品ID, registrant } = await withAdminSession(browser, 在庫登録者.account, async (page) => {
    const categoryId = await goodsCategoryIdForCsv(page, onIssue);
    const region = Object.fromEntries((await downloadGoodsCsvTemplate(page)).headers.filter((h) => h.includes("地域") || h.includes("スマレジ連携")).map((h) => [h, "0"]));
    await registerGoodsCsv(page, {
      what: "M05-14 の試験商品のグッズ商品CSV登録", fileName: `m0514-item-${Date.now()}.csv`, categoryId,
      common: { "購入グループ名称": "通常商品", ...region },
      lines: [{ code: 商品コード, nameJp: 商品名, nameEn: 商品名, values: { "基準価格": "100", "販売価格": "100", "買取価格": "10", "原価単価": "10" } }],
      onWarning: (w) => onIssue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 180_000,
    });
    const id = await openProductEditByCode(page, 商品コード);
    return { 商品ID: id, registrant: await loggedInMemberName(page) };
  });
  // 在庫変更CSV登録と承認は、並べて流している回の同じ手続きと同時にしない（M05-01 と同じ鍵の考え方。名前は M05-14 用）
  await withCreateOnceLock("m0514-stock-approval", async () => {
    await withAdminSession(browser, 在庫登録者.account, async (page) => {
      await registerStockChangeCsv(page, {
        店舗: 本店, 在庫区分: "EC-CUBE", 在庫変動区分: "入庫/その他", 在庫変動理由: "シード作成", 承認者: 承認者.名前,
        行: [{ 商品コード, 在庫増減数: String(入庫数), 仕入単価: "100" }], ファイル名: `m0514-stock-${Date.now()}.csv`,
      }, "M05-14 の試験商品の在庫変更CSV登録", onIssue);
    });
    const srcs = 未承認の在庫変更CSVの番号(在庫登録者.account.loginId, 本店ID, 入庫数);
    if (srcs.length === 0) throw new Error(`${商品コード} の在庫変更（${入庫数}）の未承認の行が DB に無い`);
    await withAdminSession(browser, 承認者.account, async (page) => {
      page.setDefaultTimeout(60_000);
      const list = new StockApprovalListPage(page);
      await page.goto(adminUrl(`/product/stock/approval_list?id=${srcs[0]}`), { timeout: 60_000 });
      await expect(page.locator("#form_search_stock_approval_list_update"), "在庫編集承認一覧の結果").toBeVisible();
      await page.waitForLoadState("load");
      await list.ensureShopChosen(本店);
      const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === registrant && r.quantity.replace(/[+,\s]/g, "") === String(入庫数));
      if (rows.length !== 1) throw new Error(`在庫変更の番号 ${srcs[0]} で開いた在庫編集承認一覧に、登録者「${registrant}」の未承認の行（増減数 ${入庫数}）が ${rows.length} 件（1件のはず）`);
      await list.approve(rows.map((r) => r.id), "M05-14 の試験商品の入庫の承認", onIssue);
    });
    onIssue("本店の在庫編集承認一覧は未承認の行が1,000件を超えて今回の行が表示に出ないので、在庫編集の番号で開いて承認した");
  }, 15 * 60_000);
  return { 商品ID, 商品コード, 商品名 };
}
