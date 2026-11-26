/**
 * M04-21 在庫変更CSV登録の「公開側へ届く」ケース（051・052）のシード。正本: cases/M04-21_seed_data.tsv
 *  - S-M04-21-QE-ENV: 公開側のブラウザの環境（日本語・PC・ログアウト・ユニサーチ試験環境へ接続可）。検索サービスの接続の設定は書き換えない（共有の設定）。公開側のブラウザはケースの新しいブラウザで代える
 *  - S-M04-21-QE-DETAIL-051: 本店の商品（在庫0）と在庫変更CSV。申請者・承認者は正本の名前・ログインIDで「あれば使い、無ければ作る」
 *  - S-M04-21-QE-SALE-052: 支店のSALE中の商品（在庫5）と在庫変更CSV（廃棄）。支店は作らず、使い回しの「試験支店」で読み替える
 *
 * 読み替え（reportSeedIssue と、ケースの「正本の外の補い」に残す）:
 *  - 店舗は作らない（依頼者決定）。052 の支店「QE0421-002支店」・支店URL「qe0421s002」は、開発環境の「試験支店」で読む。
 *  - 所属は所属のマスタに既にある「試験所属A」で読む（所属は足さない）。権限はシステム管理者（承認権限あり）。
 *  - 商品コード・商品名・CSVのファイル名には実行の印を付ける（決め打ちの値は印つき）。申請者・承認者のログインIDは正本のまま。
 *  - 取り込みで作られた規格は、公開側に出るよう公開で登録する（正本の「表示対象」）。
 */
import fs from "node:fs";
import { Browser, expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 所属がある } from "../db/m04_21_x";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { 規格のセールを設定する, タグを付けて商品を登録する } from "../pages/admin/f01_02_setup";
import { savePublishedClass } from "../pages/admin/f03_07_restock";
import { classRowsFromProductEdit, openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { fillStockEdit, searchApprovals, searchStockByCode, stockInRow, submitStockEdit, approveOne } from "../pages/admin/m04_02_rc_stock";
import { expectNoProductCodes, readSupplyGoodsCategoryId, uploadGoodsLines } from "../pages/admin/m04_17_seed_ops";
import { downloadBytes, downloadStockChangeTemplate, ensureMemberWithDept, historyRowsOfFile, openStockChangeCsv } from "../pages/admin/m04_21_stock_change_csv";
import { 試験支店, 試験支店の店舗ID } from "../pages/admin/reuse_store";
import { StockListPage } from "../pages/admin/stock_edit";
import { caseCsvPath } from "./m04-21";

export const 試験所属 = "試験所属A";
export type 人 = { 名前: string; account: Account; email: string };
export const 人の = (loginId: string, 名前: string, password: string): 人 => ({ 名前, account: { loginId, password }, email: `${loginId}@example.test` });

/** 固定のSALEタグ（アプリがセールに使うタグ。F01-02 のシードと同じ番号） */
const SALE_TAG_ID = "8";

/** 在庫変更CSVを、雛形の見出し行の下に正本の1行を足して、ケースの出力の場所に作る（雛形の文字コード・改行のまま） */
export async function 在庫変更CSVを作る(page: Page, seedId: string, ファイル名: string, 行: string): Promise<string> {
  await openStockChangeCsv(page);
  const template = await downloadBytes(await downloadStockChangeTemplate(page));
  const text = template.toString("latin1");
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const head = text.replace(/(\r\n|\n)+$/, "");
  if (/\r|\n/.test(head)) throw new Error(`${seedId}: 在庫変更CSVの雛形が見出しの1行だけではない`);
  const body = Buffer.concat([template.subarray(0, Buffer.byteLength(head, "latin1")), Buffer.from(`${eol}${行}${eol}`, "ascii")]);
  const path = caseCsvPath(ファイル名);
  fs.writeFileSync(path, body);
  expect(await historyRowsOfFile(page, ファイル名), `${seedId}: 在庫変更CSV登録履歴にファイル「${ファイル名}」の行は無い`).toBe(0);
  return path;
}

export async function 管理者を用意する(page: Page, p: 人, 店舗ID: string): Promise<void> {
  page.setDefaultTimeout(60_000);
  await ensureMemberWithDept(page, {
    名前: p.名前, ログインID: p.account.loginId, メールアドレス: p.email, パスワード: p.account.password, 権限: "システム管理者",
    所属店舗ID: 店舗ID, 所属: 試験所属, デフォルト検索表示店舗ID: 店舗ID, 編集可能店舗ID: [店舗ID],
  });
}


/** 申請者の在庫編集（入庫/その他）を、承認者が在庫編集承認一覧で承認する（承認のあとの在庫を確かめる。入庫の前の在庫は0） */
export async function 入庫して承認する(browser: Browser, seedId: string, v: { 店名: string; code: string; 数: number; 単価: number; 申請者: 人; 承認者: 人 }, issue: (m: string) => void): Promise<void> {
  await withAdminSession(browser, v.申請者.account, async (page) => {
    const list = await searchStockByCode(page, { 商品コード: v.code, 店舗: v.店名, 在庫区分: "EC-CUBE" });
    const row = list.row(v.code, v.店名, "EC-CUBE");
    expect(await stockInRow(row), `${seedId}: 入庫の前の ${v.店名}・EC-CUBE の在庫`).toBe(0);
    await list.openEdit(row);
    await fillStockEdit(page, { 在庫変動区分: "入庫/その他", 在庫変動理由: "試験データ", 在庫増減数: String(v.数), 仕入単価: String(v.単価), 承認通知先: v.承認者.名前 });
    await submitStockEdit(page, `${seedId} の在庫編集（入庫${v.数}）`, issue);
  });
  await withAdminSession(browser, v.承認者.account, async (page) => {
    await searchApprovals(page, { 店舗: v.店名, 登録者: v.申請者.名前 });
    await approveOne(page, "在庫編集", `${seedId} の在庫編集の承認`, issue);
    const list = await searchStockByCode(page, { 商品コード: v.code, 店舗: v.店名, 在庫区分: "EC-CUBE" });
    expect(await stockInRow(list.row(v.code, v.店名, "EC-CUBE")), `${seedId}: 承認のあとの ${v.店名}・EC-CUBE の在庫は${v.数}`).toBe(v.数);
  });
}

// ---------------------------------------------------------------- 共通

defineSeed("S-M04-21-QE-ENV", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "検索サービス（ユニサーチ）の接続の設定は書き換えない（共有の設定）。公開側のブラウザはケースの新しいブラウザ（日本語・PC・ログアウト）で代える");
});

// ---------------------------------------------------------------- 051

export type M0421QE051 = { 本店名: string; 申請者: 人; 承認者: 人; 商品ID: string; 商品コード: string; 商品名: string; ファイル名: string; csvPath: string };
let qe051: M0421QE051 | null = null;
export function m0421QE051(): M0421QE051 {
  if (!qe051) throw new Error("S-M04-21-QE-DETAIL-051 をまだ作っていない");
  return qe051;
}

defineSeed("S-M04-21-QE-DETAIL-051", async ({ browser, seed, notes }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  if (!所属がある(試験所属)) throw new Error(`所属のマスタに「${試験所属}」が無い（所属のマスタは足さない）`);
  const code = rc("QE0421-001-CODE"), name = rc("QE0421-001-NAME");
  const ap = 人の("qe0421-001-ap", "QE0421-001申請者", "Passw0rd-QE0421001");
  const ar = 人の("qe0421-001-ar", "QE0421-001承認者", "Passw0rd-QE0421001");
  const ファイル名 = `${rc("qe0421-001")}.csv`;
  let 本店名 = "", 商品ID = "";
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    本店名 = await new StockListPage(page).shopNameById("1");
    for (const p of [ap, ar]) await 管理者を用意する(page, p, "1");
    await expectNoProductCodes(page, [code], seed.シードID);
    await uploadGoodsLines(page, {
      what: `${seed.シードID} のグッズ商品CSV登録`, fileName: `${seed.シードID.toLowerCase()}-${Date.now()}.csv`, categoryId: await readSupplyGoodsCategoryId(page), onIssue: issue,
      lines: [{ 商品コード: code, 商品名: name, 基準価格: "100", 販売価格: "100", 買取価格: "1" }],
    });
    商品ID = await openProductEditByCode(page, code);
    const rows = await classRowsFromProductEdit(page, 商品ID);
    if (rows.length !== 1) throw new Error(`${code} の取込直後の商品規格が1件でない`);
    await savePublishedClass(page, { productId: 商品ID, classId: rows[0].商品規格ID }, `${name} の取り込みで作られた規格`, issue);
  });
  notes.set("〔商品ID-M0421-001〕", 商品ID);
  for (const p of [ap, ar]) await withAdminSession(browser, p.account, async () => undefined);
  const csvPath = await withAdminSession(browser, ap.account, (page) => 在庫変更CSVを作る(page, seed.シードID, ファイル名, `${code},4,100`));
  qe051 = { 本店名, 申請者: ap, 承認者: ar, 商品ID, 商品コード: code, 商品名: name, ファイル名, csvPath };
  issue(`店舗は本店（${本店名}）。申請者「${ap.名前}」・承認者「${ar.名前}」は所属「${試験所属}」（所属のマスタの既存の名称。正本は任意の有効な値で同じ所属）・権限はシステム管理者（承認権限あり）・編集可能店舗は本店（あれば使う）`);
  issue(`商品コード ${code}・商品名 ${name}・CSVのファイル名 ${ファイル名} は、正本の値に実行の印を付けた。取り込みで作られた規格を公開で登録した。本店のEC-CUBE在庫は0（入庫していない）`);
});

// ---------------------------------------------------------------- 052

export type M0421QE052 = { 支店ID: string; 支店名: string; 支店URL: string; 申請者: 人; 承認者: 人; 商品ID: string; 商品コード: string; 商品名: string; ファイル名: string; csvPath: string };
let qe052: M0421QE052 | null = null;
export function m0421QE052(): M0421QE052 {
  if (!qe052) throw new Error("S-M04-21-QE-SALE-052 をまだ作っていない");
  return qe052;
}

defineSeed("S-M04-21-QE-SALE-052", async ({ browser, seed, notes }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  if (!所属がある(試験所属)) throw new Error(`所属のマスタに「${試験所属}」が無い（所属のマスタは足さない）`);
  const 支店ID = 試験支店の店舗ID();
  const 支店名 = 試験支店.店名, 支店URL = 試験支店.支店URL;
  const code = rc("QE0421-002-CODE"), name = rc("QE0421-002-NAME");
  const ap = 人の("qe0421-002-ap", "QE0421-002申請者", "Passw0rd-QE0421002");
  const ar = 人の("qe0421-002-ar", "QE0421-002承認者", "Passw0rd-QE0421002");
  const ファイル名 = `${rc("qe0421-002")}.csv`;
  let 商品ID = "";
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const p of [ap, ar]) await 管理者を用意する(page, p, 支店ID);
    await expectNoProductCodes(page, [code], seed.シードID);
    await uploadGoodsLines(page, {
      what: `${seed.シードID} のグッズ商品CSV登録`, fileName: `${seed.シードID.toLowerCase()}-${Date.now()}.csv`, categoryId: await readSupplyGoodsCategoryId(page), onIssue: issue,
      lines: [{ 商品コード: code, 商品名: name, 基準価格: "1", 販売価格: "1", 買取価格: "1" }],
    });
    商品ID = await openProductEditByCode(page, code);
    const rows = await classRowsFromProductEdit(page, 商品ID);
    if (rows.length !== 1) throw new Error(`${code} の取込直後の商品規格が1件でない`);
    await savePublishedClass(page, { productId: 商品ID, classId: rows[0].商品規格ID }, `${name} の取り込みで作られた規格`, issue);
    await タグを付けて商品を登録する(page, 商品ID, SALE_TAG_ID, null, `${seed.シードID}: ${code}`, issue);
    await 規格のセールを設定する(page, 商品ID, rows[0].商品規格ID, { フラグ: true, 販売価格: "1" }, `${seed.シードID}: ${code} のセール`, issue);
  });
  notes.set("〔商品ID-M0421-002〕", 商品ID);
  notes.set("〔支店ID-M0421-002〕", 支店ID);
  for (const p of [ap, ar]) await withAdminSession(browser, p.account, async () => undefined);
  await 入庫して承認する(browser, seed.シードID, { 店名: 支店名, code, 数: 5, 単価: 1, 申請者: ap, 承認者: ar }, issue);
  const csvPath = await withAdminSession(browser, ap.account, (page) => 在庫変更CSVを作る(page, seed.シードID, ファイル名, `${code},-5,0`));
  qe052 = { 支店ID, 支店名, 支店URL, 申請者: ap, 承認者: ar, 商品ID, 商品コード: code, 商品名: name, ファイル名, csvPath };
  issue(`支店「QE0421-002支店」（支店URL qe0421s002）は、店舗を作らない決まりのため、使い回しの試験支店「${支店名}」（店舗ID ${支店ID}・支店URL ${支店URL}）で読み替えた`);
  issue(`固定セールタグ（タグID ${SALE_TAG_ID}）・セールフラグ1・販売価格1円。申請者「${ap.名前}」・承認者「${ar.名前}」は所属「${試験所属}」・システム管理者・編集可能店舗は試験支店。この支店のEC-CUBE在庫は5（入庫の申請を承認済み）`);
  issue("「この支店で在庫を持つ商品はこの1件だけ」は、共有の試験支店のため保証できない（ほかの機能の商品が残っていることがある）。ケースは自分の商品の表示だけを確かめる");
});

