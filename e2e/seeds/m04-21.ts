/**
 * M04-21 在庫変更CSV登録の画面シード。正本: cases/M04-21_seed_data.tsv
 *
 * 作るのは、画面だけで準備できるケース（044・057・058）が使うシードだけ。
 * - S-M04-21-ADM: 試験管理者 m0421_admin。正本の「メンバーID 142190001」「店舗ID 142190010 の在庫編集権限」の番号は画面で指定できない
 *   （店舗ID 142190010 の店舗は S-M04-21-MASTER（DBへの直接設定を含む）でも作られない）。編集可能店舗は本店（店舗ID 1）にした。
 *   権限はシステム管理者（M04-02・M04-17 などと同じ）。所属は選択肢の先頭。
 * - S-M04-21-TEMPLATE-044: ダウンロードの保存先のフォルダ M0421-044-DL を、そのケースの出力の場所に作って空にする。
 * - RC-ORG-*: 申請者と承認者。所属はマスタデータ管理で所属のマスタに足した「RC0421-00N所属」（空いているID＝いまの最大＋1）。
 *   所属店舗・デフォルト検索表示店舗・編集可能店舗はその店舗（057 は店舗登録で作る支店、058 は本店＝店舗ID 1）。
 *   権限グループは「在庫管理を操作できるもの（承認者は承認権限の列にチェックのある権限）」で、どちらもシステム管理者にした。
 *   デフォルト検索表示店舗はシード表に無いが、メンバー登録画面で必須。
 * - RC-STOCK-*: グッズ商品CSV登録で1行を取り込み、商品規格一覧から取り込みで作られた規格を開いて公開にし、
 *   申請者が在庫編集で入庫/その他・試験データ・10・仕入単価100を登録して、承認者が在庫編集承認一覧で承認する。
 *   在庫検索一覧で在庫が10になったことを確かめる。在庫変更CSV登録の「雛形ファイルダウンロード」で雛形を取り、
 *   見出し行の下に正本の1行を足して、ケースの出力の場所へ正本のファイル名で置く。在庫変更CSV登録履歴に同じファイル名の行が無いことを確かめる。
 *   商品コードは正本の固定の値で、正本に清掃の手順が無い。前の実行の商品が残っていれば作らずに止める（流し直すかは依頼者が決める）。
 * 「本店」は手元の環境の店舗ID 1（親店舗）。店名は環境で違う（手元は「Hareruya」）ので、在庫検索一覧の検索欄「店舗」の選択肢から読む。
 */
import fs from "node:fs";
import { expect, Page, test } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { openClassListFromProductEdit } from "../pages/admin/m03_01_product_class";
import { readGoodsProductId } from "../pages/admin/m03_01_goods_list_seed";
import { ensureDepartment } from "../pages/admin/m04_13_setup";
import { expectNoProductCodes, readSupplyGoodsCategoryId, uploadGoodsLines } from "../pages/admin/m04_17_seed_ops";
import {
  approveOne, fillStockEdit, publishImportedClass, searchApprovals, searchStockByCode, stockInRow, submitStockEdit,
} from "../pages/admin/m04_02_rc_stock";
import {
  downloadBytes, downloadStockChangeTemplate, ensureMemberWithDept, historyRowsOfFile, openStockChangeCsv,
} from "../pages/admin/m04_21_stock_change_csv";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { ensureStore, M0424StoreInput } from "../pages/admin/m04_24_store";
import { StockListPage } from "../pages/admin/stock_edit";

// ---- 044 ----

export const M0421_ADMIN: Account = { loginId: "m0421_admin", password: "Passw0rd!M0421" };

defineSeed("S-M04-21-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: "M04-21試験管理者", ログインID: M0421_ADMIN.loginId, メールアドレス: "m0421_admin@example.test", パスワード: M0421_ADMIN.password,
    権限: "システム管理者", 所属店舗ID: "1", デフォルト検索表示店舗ID: "1", 編集可能店舗ID: ["1"],
  }));
  await withAdminSession(browser, M0421_ADMIN, async () => undefined);
});

/** ケースの出力の場所に置く、ダウンロードの保存先のフォルダ（正本のフォルダ名） */
export function templateDownloadDir(): string {
  return test.info().outputPath("M0421-044-DL");
}

defineSeed("S-M04-21-TEMPLATE-044", async () => {
  const dir = templateDownloadDir();
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  expect(fs.readdirSync(dir), "フォルダ M0421-044-DL は空").toEqual([]);
});

// ---- 057・058（在庫変更CSV登録の結果がほかの画面へ届くこと） ----

export type RcPerson = { 名前: string; account: Account; email: string };
export type RcOrg = { 申請者: RcPerson; 承認者: RcPerson; 所属: string };

function rcOrg(prefix: string, label: string, password: string): RcOrg {
  return {
    申請者: { 名前: `${label}申請者`, account: { loginId: `${prefix}-ap`, password }, email: `${prefix}-ap@example.test` },
    承認者: { 名前: `${label}承認者`, account: { loginId: `${prefix}-ar`, password }, email: `${prefix}-ar@example.test` },
    所属: `${label}所属`,
  };
}

export const RC057 = rcOrg("rc0421-001", "RC0421-001", "Passw0rd-RC0421001");
export const RC058 = rcOrg("rc0421-002", "RC0421-002", "Passw0rd-RC0421002");

/** 057 の支店。店名・支店URL・支店・公開・開店はシード表の値。そのほかの必須項目は「任意の有効な値」 */
export const RC057_BRANCH: M0424StoreInput = {
  店名: "RC0421-001支店", 店名カナ: "アールシーシテン", 店名英語: "RC Branch One", 支店URL: "rc0421s001", 店名略称3文字: "R41",
  ショップ名略称: "RC0421-001支店", 会社名: "RC0421試験会社", 会社名カナ: "アールシーシケンガイシャ", 郵便番号: "160-0022",
  都道府県: "東京都", 住所1: "新宿区新宿4-21-1", 住所2: "試験ビル", 電話番号: "03-0421-0001",
};

export type RcStore = { 本店: true } | { 支店: M0424StoreInput };
export const MAIN_STORE: RcStore = { 本店: true };

/** 店舗IDと店名（在庫検索一覧の選択肢の表示名）。本店は店舗ID 1 の店名を在庫検索一覧の選択肢から読む */
export async function resolveStore(page: Page, store: RcStore, onIssue: (m: string) => void): Promise<{ id: string; 店名: string }> {
  if ("本店" in store) return { id: "1", 店名: await new StockListPage(page).shopNameById("1") };
  return { id: await ensureStore(page, store.支店, onIssue), 店名: store.支店.店名 };
}

function defineRcOrg(seedId: string, org: RcOrg, store: RcStore): void {
  defineSeed(seedId, async ({ browser }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      const s = await resolveStore(page, store, issue);
      await ensureDepartment(page, org.所属);
      for (const who of [org.申請者, org.承認者]) {
        await ensureMemberWithDept(page, {
          名前: who.名前, ログインID: who.account.loginId, メールアドレス: who.email, パスワード: who.account.password,
          権限: "システム管理者", 所属店舗ID: s.id, 所属: org.所属, デフォルト検索表示店舗ID: s.id, 編集可能店舗ID: [s.id],
        });
      }
    });
    for (const who of [org.申請者, org.承認者]) await withAdminSession(browser, who.account, async () => undefined);
  });
}

/** ケースの出力の場所に置く、正本の名前のCSVファイル */
export function caseCsvPath(fileName: string): string {
  return test.info().outputPath(fileName);
}

type RcStock = { 商品コード: string; 商品名: string; csv: { ファイル名: string; 行: [string, string, string] } };

function defineRcStock(seedId: string, orgSeedId: string, org: RcOrg, store: RcStore, product: RcStock): void {
  defineSeed(seedId, { needs: [orgSeedId] }, async ({ browser }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const shop = await withAdminSession(browser, org.申請者.account, async (page) => (await resolveStore(page, store, issue)).店名);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      await expectNoProductCodes(page, [product.商品コード], seedId);
      const categoryId = await readSupplyGoodsCategoryId(page);
      await uploadGoodsLines(page, {
        what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId}-goods.csv`, categoryId, onIssue: issue,
        lines: [{ 商品コード: product.商品コード, 商品名: product.商品名, 基準価格: "1", 販売価格: "1", 買取価格: "1" }],
      });
      const productId = await readGoodsProductId(page, product.商品コード, product.商品名);
      await page.goto(adminUrl(`/product/product/${productId}/edit`));
      await openClassListFromProductEdit(page, productId);
      await publishImportedClass(page, product.商品コード, `${seedId} の商品規格の登録`, issue);
    });
    await withAdminSession(browser, org.申請者.account, async (page) => {
      const list = await searchStockByCode(page, { 商品コード: product.商品コード, 店舗: shop, 在庫区分: "EC-CUBE" });
      const row = list.row(product.商品コード, shop, "EC-CUBE");
      expect(await stockInRow(row), `${seedId}: 入庫の前の ${shop}・EC-CUBE の在庫`).toBe(0);
      await list.openEdit(row);
      await fillStockEdit(page, { 在庫変動区分: "入庫/その他", 在庫変動理由: "試験データ", 在庫増減数: "10", 仕入単価: "100", 承認通知先: org.承認者.名前 });
      await submitStockEdit(page, `${seedId} の在庫編集（入庫10）`, issue);
    });
    await withAdminSession(browser, org.承認者.account, async (page) => {
      await searchApprovals(page, { 店舗: shop, 登録者: org.申請者.名前 });
      await approveOne(page, "在庫編集", `${seedId} の在庫編集の承認`, issue);
      const list = await searchStockByCode(page, { 商品コード: product.商品コード, 店舗: shop, 在庫区分: "EC-CUBE" });
      expect(await stockInRow(list.row(product.商品コード, shop, "EC-CUBE")), `${seedId}: 承認のあとの ${shop}・EC-CUBE の在庫は10`).toBe(10);
    });
    // CSV: 在庫変更CSV登録の雛形の見出し行の下に、正本の1行を足す（雛形の文字コード・改行のまま）
    await withAdminSession(browser, org.申請者.account, async (page) => {
      await openStockChangeCsv(page);
      const template = await downloadBytes(await downloadStockChangeTemplate(page));
      const text = template.toString("latin1");
      const eol = text.includes("\r\n") ? "\r\n" : "\n";
      const head = text.replace(/(\r\n|\n)+$/, "");
      if (/\r|\n/.test(head)) throw new Error(`${seedId}: 在庫変更CSVの雛形が見出しの1行だけではない`);
      const body = Buffer.concat([template.subarray(0, Buffer.byteLength(head, "latin1")), Buffer.from(`${eol}${product.csv.行.join(",")}${eol}`, "ascii")]);
      fs.writeFileSync(caseCsvPath(product.csv.ファイル名), body);
      expect(await historyRowsOfFile(page, product.csv.ファイル名), `${seedId}: 在庫変更CSV登録履歴にファイル「${product.csv.ファイル名}」の行は無い`).toBe(0);
    });
  });
}

defineRcOrg("S-M04-21-RC-ORG-057", RC057, { 支店: RC057_BRANCH });
defineRcOrg("S-M04-21-RC-ORG-058", RC058, MAIN_STORE);
defineRcStock("S-M04-21-RC-STOCK-057", "S-M04-21-RC-ORG-057", RC057, { 支店: RC057_BRANCH }, {
  商品コード: "RC0421001CODE", 商品名: "RC0421-001-NAME", csv: { ファイル名: "rc0421-001.csv", 行: ["RC0421001CODE", "-3", "999"] },
});
defineRcStock("S-M04-21-RC-STOCK-058", "S-M04-21-RC-ORG-058", RC058, MAIN_STORE, {
  商品コード: "RC0421002CODE", 商品名: "RC0421-002-NAME", csv: { ファイル名: "rc0421-002.csv", 行: ["RC0421002CODE", "3", "300"] },
});
