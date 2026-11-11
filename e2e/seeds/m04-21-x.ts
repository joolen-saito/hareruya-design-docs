/**
 * M04-21 在庫変更CSV登録の続き（-x）の画面シード。正本: cases/M04-21_seed_data.tsv
 * 仕分け直し（e2e/review/not_runnable_recheck_cases2.tsv）で流せる見込みになったケースのシード。振り分けと解釈は記録 review/M04-21_progress_2026-11-11_dev.md。
 *
 * 作り方（シード表の投入方法の順。画面で作れない状態だけ、E2E の行へ DB で書き足す。依頼者決定 2026-11-10）:
 * - S-M04-21-MASTER: 店舗・所属は作らない。開発環境に既にある試験用の店舗「試験店舗A」・所属「試験所属A」を、
 *   シード表の「試験店舗A（M04-21）」「試験所属A（M04-21）」として使う（店舗は作ると在庫の行が約36万行でき消せない・所属のマスタは全員が使う）。
 *   店舗IDは店名で DB の参照から読んで控える。在庫区分（EC-CUBE・スマレジ）・在庫変動区分（入庫/問屋仕入・廃棄/廃棄(破損)）は開発環境のマスタにあるので書き足さない。
 *   続けて、試験店舗A の在庫を編集できる試験管理者「M04-21試験管理者」を作る（下の注記1）。
 * - S-M04-21-APPROVERS: 承認者A・B をメンバー登録画面で登録する（所属 試験所属A・所属店舗と編集可能店舗 試験店舗A・権限 システム管理者）。
 *   権限管理の承認権限の列は書き換えない（システム管理者は承認権限の列にチェックがある。M04-02・M04-23 の開発環境の流しで確かめ済み）。
 * - ケースの商品: グッズ商品CSV登録で取り込み（シードの商品をまとめて1つのCSVで）、商品マスターで商品コードを検索して商品IDを控える。
 *   商品規格ID・在庫IDは DB の参照で読んで控える。在庫は、シード表が画面と書くものは「試験管理者の在庫編集（入庫/問屋仕入）→承認者Aが在庫編集承認一覧で承認」、
 *   DB と書くもの（024・038・041・042・047）は E2E の規格の在庫へ DB で書き足す。在庫一覧（在庫検索一覧）で在庫を確かめる。
 * - ケースのCSV: 在庫変更CSV登録の「雛形ファイルダウンロード」の雛形（文字コード・改行はそのまま）の見出し行の下に、正本の行を書いて、
 *   ケースの出力の場所に置く。在庫変更CSV登録履歴に同じファイル名の行が無いことを確かめる。
 * - 商品コード・商品名・ファイル名・メンバーの名前とログインIDには実行の印を付ける（依頼者決定 2026-10-28 案A。同じファイル名は1か月取り込めない作り）。
 *   017 の商品コード（半角英字Lを255文字）は値そのものを確かめるので印を付けない（一度しか流せない）。
 *
 * 注記:
 * 1. S-M04-21-ADM の作り方は既存（seeds/m04-21.ts。本店だけを編集できる m0421_admin）で、044 がそのまま使う。続きのケースは試験店舗A の在庫編集権限が要るので、
 *    同じ名前・ログインIDに実行の印を付けた試験管理者を、MASTER で試験店舗A を決めたあとに作り、続きのケースはこの試験管理者でログインする。
 * 2. 030 の「直近に取り込まれた同名のファイル」は、DB へ行を足す代わりに、シードで同じ名前のファイルを画面から一度取り込み、
 *    その取込の記録と在庫編集の承認の登録日時を「ケース開始の10分前」へ DB で書き換える（E2E の取込の記録だけ）。
 * 3. 026 の削除済みの商品・商品規格は、画面で作った E2E の商品・規格の公開ステータスを「廃止」（アプリの削除済みの扱い）へ DB で書き換える。
 */
import fs from "node:fs";
import { Browser, BrowserContext, expect, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, hideDebugToolbar, loginAdmin, withAdminSession } from "../lib/session";
import * as db from "../db/m04_21_x";
import { 在庫と総原価, 在庫を検索する } from "../pages/admin/f04_04_stock";
import { downloadGoodsCsvTemplate, readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { approveOne, fillStockEdit, searchApprovals, submitStockEdit } from "../pages/admin/m04_02_rc_stock";
import { 在庫編集画面を開く } from "../pages/admin/m04_02_stock_x";
import { downloadBytes, downloadStockChangeTemplate, ensureMemberWithDept, historyRowsOfFile, openStockChangeCsv } from "../pages/admin/m04_21_stock_change_csv";
import { ファイルを選ぶ, 一括登録を押す, 入力する, 承認通知先の候補, 規格の商品コードを変える } from "../pages/admin/m04_21_x_csv";
import { caseCsvPath } from "./m04-21";

// ---- 店舗・所属・メンバー ----

/** シード表の「試験店舗A（M04-21）」として使う、開発環境の試験用の店舗 */
export const 試験店舗Aの店名 = "試験店舗A";
/** 038 の「M0421-038-ST-B」として使う、開発環境の試験用の店舗 */
export const 試験店舗Bの店名 = "試験店舗B";
/** シード表の「試験所属A（M04-21）」として使う、開発環境の所属 */
export const 試験所属A = "試験所属A";

const 店舗IDの控え = new Map<string, string>();
/** 店名の店舗ID（DB の参照で読み、同じ実行の中では控えを使う） */
export function 店舗IDの(店名: string): string {
  if (!店舗IDの控え.has(店名)) 店舗IDの控え.set(店名, db.店名の店舗ID(店名));
  return 店舗IDの控え.get(店名)!;
}
export const 試験店舗A = () => ({ ID: 店舗IDの(試験店舗Aの店名), 店名: 試験店舗Aの店名 });
export const 試験店舗B = () => ({ ID: 店舗IDの(試験店舗Bの店名), 店名: 試験店舗Bの店名 });

export type 管理者 = { 名前: string; account: Account; email: string };
const 人の = (名前: string, loginId: string, password: string): 管理者 => {
  const id = rc(loginId).toLowerCase();
  return { 名前: rc(名前), account: { loginId: id, password }, email: `${id}@example.test` };
};
/** シード表・ケースの手順のパスワード */
const PASSWORD = "Passw0rd!M0421";
/** M04-21試験管理者（試験店舗A の在庫を編集できる。注記1） */
export const 試験管理者 = 人の("M04-21試験管理者", "m0421_admin", PASSWORD);
export const 承認者A = 人の("M04-21承認者A", "m0421_apr_a", PASSWORD);
export const 承認者B = 人の("M04-21承認者B", "m0421_apr_b", PASSWORD);
/** S-M04-21-ADM-007（ログインID m0421_admin-007・パスワード M0421Adm007!z） */
export const 管理者007 = 人の("M04-21試験管理者007", "m0421_admin-007", "M0421Adm007!z");
/** S-M04-21-STOREPERM-038 */
export const ユーザー038 = 人の("M0421-038-ユーザー", "m0421-038-user", PASSWORD);
/** S-M04-21-APPRV-047 */
export const 登録者047 = 人の("M0421-047-登録者", "m0421-047-user", PASSWORD);
export const 承認者047 = 人の("M0421-047-承認者", "m0421-047-approver", PASSWORD);

async function メンバーを用意する(page: Page, m: 管理者, 店舗ID: string): Promise<string> {
  page.setDefaultTimeout(60_000);
  return ensureMemberWithDept(page, {
    名前: m.名前, ログインID: m.account.loginId, メールアドレス: m.email, パスワード: m.account.password, 権限: "システム管理者",
    所属店舗ID: 店舗ID, 所属: 試験所属A, デフォルト検索表示店舗ID: 店舗ID, 編集可能店舗ID: [店舗ID],
  });
}

/** 1つのブラウザの、ログイン済みの管理画面のセッション */
async function セッションを開く(browser: Browser, account: Account): Promise<{ page: Page; context: BrowserContext }> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(context);
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, account);
  return { page, context };
}

let 試験管理者のID = "";
/** 試験管理者のメンバーID（MASTER で作る） */
export function 試験管理者のメンバーID(): string {
  if (!試験管理者のID) 試験管理者のID = db.メンバーIDの(試験管理者.名前);
  return 試験管理者のID;
}

defineSeed("S-M04-21-MASTER", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  if (!db.所属がある(試験所属A)) throw new Error(`所属のマスタに「${試験所属A}」が無い（所属のマスタは足さない）`);
  const a = 試験店舗A();
  notes.set("〔店舗ID-M0421-共有〕", a.ID);
  issue(`店舗「試験店舗A（M04-21）」は作らず、開発環境の試験用の店舗「${a.店名}」（店舗ID ${a.ID}）を使った。所属「試験所属A（M04-21）」は開発環境の所属「${試験所属A}」を使った`);
  issue("店舗・所属関係・在庫区分・在庫変動区分の番号の DB への設定は行わない（在庫区分 EC-CUBE・スマレジと、在庫変動区分 入庫/問屋仕入・廃棄/廃棄(破損) は開発環境のマスタにある）");
  await withAdminSession(browser, SETUP_ADMIN, (page) => メンバーを用意する(page, 試験管理者, a.ID));
  試験管理者のID = db.メンバーIDの(試験管理者.名前);
  await withAdminSession(browser, 試験管理者.account, async () => undefined);
});

defineSeed("S-M04-21-APPROVERS", { needs: ["S-M04-21-MASTER"] }, async ({ browser, notes }) => {
  const a = 試験店舗A();
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    notes.set("〔メンバーID-M0421-共有A〕", await メンバーを用意する(page, 承認者A, a.ID));
    notes.set("〔メンバーID-M0421-共有B〕", await メンバーを用意する(page, 承認者B, a.ID));
  });
  for (const m of [承認者A, 承認者B]) await withAdminSession(browser, m.account, async () => undefined);
  // 在庫変更CSV登録画面で、店舗に試験店舗A・承認通知先（所属選択）に試験所属A を選び、承認通知先（メンバー選択）の候補に2名が出ること
  await withAdminSession(browser, 試験管理者.account, async (page) => {
    await openStockChangeCsv(page);
    await 入力する(page, { 店舗: a, 所属: 試験所属A, 承認者: [] });
    await expect.poll(() => 承認通知先の候補(page), { message: "承認通知先（メンバー選択）の候補に承認者A・B が出る", timeout: 60_000 })
      .toEqual(expect.arrayContaining([承認者A.名前, 承認者B.名前]));
  });
});

defineSeed("S-M04-21-ADM-007", { needs: ["S-M04-21-MASTER"] }, async ({ browser, seed }) => {
  const a = 試験店舗A();
  const id = await withAdminSession(browser, SETUP_ADMIN, (page) => メンバーを用意する(page, 管理者007, a.ID));
  await withAdminSession(browser, 管理者007.account, async () => undefined);
  const n = db.登録者の承認情報と在庫変更履歴の件数(id);
  if (n.承認情報 !== 0 || n.在庫変更履歴 !== 0) {
    throw new Error(`${seed.シードID}: ${管理者007.名前} を登録者とする在庫編集承認情報 ${n.承認情報} 件・在庫変更履歴 ${n.在庫変更履歴} 件がある（0件のはず）`);
  }
});

// ---- ケースの商品と在庫・CSV ----

/** ケースのファイル名（正本の名前の「.csv」の前に実行の印を付ける）。ケースもこの名前で読む */
export const ファイル名の = (正本の名前: string): string => `${rc(正本の名前.replace(/\.csv$/, ""))}.csv`;
/** ケースの商品コード（実行の印つき）。ケースは正本の商品コードで引く */
export const 商品コードの = (正本の商品コード: string): string => rc(正本の商品コード);
/** 017 の商品コード（半角英字Lを255文字。値そのものを確かめるので印を付けない） */
export const 長い商品コード = "L".repeat(255);
/** ケースの商品名（実行の印つき） */
export const 商品名の = (正本の商品名: string): string => rc(正本の商品名);

type 在庫の作り方 = { 画面: [number, number][] } | { DB: [number, number] };
type 商品の定め = {
  /** 控える呼び名の番号（〔商品ID-M0421-<呼び名>〕など）。シード表に無い呼び名は控えない */
  呼び名?: string;
  コード: string; 名前: string;
  /** 商品コードに実行の印を付けない（017） */
  印なし?: boolean;
  店舗?: "A" | "B";
  在庫?: 在庫の作り方;
  /** 取り込んだあと、商品規格登録編集で商品コードをこの正本の値（印つき）に変える（026 の重複コード） */
  コードを変える?: string;
  /** 取り込んだあと、削除済みにする（026） */
  削除?: "商品" | "規格";
};
type CSVの定め = { 名前: string; 行: (string | number)[][] };
type シードの定め = { シードID: string; 商品: 商品の定め[]; CSV: CSVの定め[]; 未登録のコード?: string[] };

const 実際のコード = (d: 商品の定め): string => (d.印なし ? d.コード : 商品コードの(d.コード));
/** CSV の行の商品コードを、正本の値から実際の値に読み替える（定めの商品コード・未登録のコード） */
function 行の値(s: シードの定め, v: string | number): string {
  const t = String(v);
  const d = s.商品.find((x) => x.コード === t);
  if (d) return 実際のコード(d);
  if (s.未登録のコード?.includes(t)) return 商品コードの(t);
  return t;
}

/** 試験管理者の在庫編集（入庫/問屋仕入）を承認者Aが在庫編集承認一覧で承認する（1回ずつ） */
async function 画面で入庫して承認する(browser: Browser, seedId: string, 在庫ID: string, 店名: string, 入庫: [number, number][], issue: (m: string) => void): Promise<void> {
  const reg = await セッションを開く(browser, 試験管理者.account);
  const apr = await セッションを開く(browser, 承認者A.account);
  try {
    for (const [i, [数, 単価]] of 入庫.entries()) {
      const what = `${seedId}: 在庫編集（入庫/問屋仕入・${数}・仕入単価${単価}）`;
      expect(await 在庫編集画面を開く(reg.page, 在庫ID), `${what}: 在庫編集画面の応答`).toBe(200);
      await fillStockEdit(reg.page, { 在庫変動区分: "入庫/問屋仕入", 在庫変動理由: `試験データ${i + 1}`, 在庫増減数: String(数), 仕入単価: String(単価), 承認通知先: 承認者A.名前 });
      await submitStockEdit(reg.page, what, issue);
      await searchApprovals(apr.page, { 店舗: 店名, 登録者: 試験管理者.名前 });
      await approveOne(apr.page, "在庫編集", `${what}の承認`, issue);
    }
  } finally {
    await reg.context.close();
    await apr.context.close();
  }
}

/** 雛形の見出し行の下に行を書いたファイルを作る（雛形の文字コード・改行のまま） */
function 雛形に行を書く(template: Buffer, rows: string[][], seedId: string): Buffer {
  const text = template.toString("latin1");
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const head = text.replace(/(\r\n|\n)+$/, "");
  if (/\r|\n/.test(head)) throw new Error(`${seedId}: 在庫変更CSVの雛形が見出しの1行だけではない`);
  const body = rows.map((r) => r.join(",")).join(eol);
  return Buffer.concat([template.subarray(0, Buffer.byteLength(head, "latin1")), Buffer.from(`${eol}${body}${eol}`, "utf-8")]);
}

async function CSVを置く(page: Page, s: シードの定め): Promise<void> {
  await openStockChangeCsv(page);
  const template = await downloadBytes(await downloadStockChangeTemplate(page));
  for (const f of s.CSV) {
    const name = ファイル名の(f.名前);
    fs.writeFileSync(caseCsvPath(name), 雛形に行を書く(template, f.行.map((r) => r.map((v) => 行の値(s, v))), s.シードID));
    expect(await historyRowsOfFile(page, name), `${s.シードID}: 在庫変更CSV登録履歴にファイル「${name}」の行は無い`).toBe(0);
  }
}

/** シードの商品を作り、呼び名を控え、在庫を作る。作った商品の実際の商品コード→在庫ID を返す */
async function 商品と在庫を作る(browser: Browser, notes: Notes, s: シードの定め): Promise<Map<string, string>> {
  const issue = (m: string) => reportSeedIssue(s.シードID, m);
  const text = (() => { const r = getSeed(s.シードID); return r["状態・属性"] + r.投入方法; })();
  const 控える = (l: string, v: string) => { if (text.includes(l)) notes.set(l, v); };
  for (const d of s.商品) {
    if (db.商品コードの規格の件数(実際のコード(d)) > 0) {
      throw new Error(`${s.シードID}: 商品コード ${d.印なし ? `${d.コード.slice(0, 8)}…（${d.コード.length}文字）` : 実際のコード(d)} の商品が既にある（前の実行の残り。印を付けない値なので流し直せない）`);
    }
  }
  for (const c of s.未登録のコード ?? []) {
    if (db.商品コードの規格の件数(商品コードの(c)) > 0) throw new Error(`${s.シードID}: 未登録のはずの商品コード ${商品コードの(c)} の商品がある`);
  }
  const 在庫ID = new Map<string, string>();
  const 規格ID = new Map<商品の定め, { 商品ID: string; 商品規格ID: string }>();
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const categoryId = await readExistingGoodsChildCategoryId(page);
    const flags = Object.fromEntries((await downloadGoodsCsvTemplate(page)).headers.filter((h) => h.includes("地域") || h.includes("スマレジ連携")).map((h) => [h, "0"]));
    await registerGoodsCsv(page, {
      what: `${s.シードID} のグッズ商品CSV登録`, fileName: `${s.シードID.toLowerCase()}-${Date.now()}.csv`, categoryId,
      common: { "基準価格": "100", "販売価格": "100", "買取価格": "100", "原価単価": "10", ...flags },
      lines: s.商品.map((d) => ({ code: 実際のコード(d), nameJp: 商品名の(d.名前), nameEn: 商品名の(d.名前) })),
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 180_000,
    });
    for (const d of s.商品) {
      const 商品ID = await openProductEditByCode(page, 実際のコード(d));
      規格ID.set(d, { 商品ID, 商品規格ID: db.商品のただ1つの規格(商品ID) });
    }
    for (const d of s.商品) {
      const x = 規格ID.get(d)!;
      if (d.コードを変える) await 規格の商品コードを変える(page, x.商品ID, x.商品規格ID, 商品コードの(d.コードを変える), `${s.シードID}: 商品コードを ${商品コードの(d.コードを変える)} に変える`, issue);
    }
  });
  for (const d of s.商品) {
    const x = 規格ID.get(d)!;
    const store = d.店舗 === "B" ? 試験店舗B() : 試験店舗A();
    const st = db.規格の在庫(x.商品規格ID, store.ID);
    if (d.呼び名) {
      控える(`〔商品ID-M0421-${d.呼び名}〕`, x.商品ID);
      控える(`〔商品規格ID-M0421-${d.呼び名}〕`, x.商品規格ID);
      控える(`〔在庫ID-M0421-${d.呼び名}〕`, st.在庫ID);
    }
    const code = d.コードを変える ? 商品コードの(d.コードを変える) : 実際のコード(d);
    在庫ID.set(`${code}#${x.商品規格ID}`, st.在庫ID);
    if (d.削除 === "商品") { db.商品を削除済みにする(`${s.シードID}: 削除済みの商品`, x.商品ID); issue(`商品 ${code}（商品ID ${x.商品ID}）を DB で削除済み（公開ステータス「廃止」）にした（注記3）`); }
    if (d.削除 === "規格") { db.規格を削除済みにする(`${s.シードID}: 削除済みの商品規格`, x.商品規格ID); issue(`商品規格 ${code}（商品規格ID ${x.商品規格ID}）を DB で削除済み（公開ステータス「廃止」）にした（注記3）`); }
    if (!d.在庫) continue;
    if ("DB" in d.在庫) {
      const [数, 総原価] = d.在庫.DB;
      db.在庫数と総原価を整える(s.シードID, st.在庫ID, 数, 総原価);
      issue(`${code} の ${store.店名}・EC-CUBE の在庫数${数}・総原価${総原価}は画面で指定できないので、E2E の規格の在庫（在庫ID ${st.在庫ID}）へ DB で書き足した（シード表の投入方法のとおり）`);
    } else {
      await 画面で入庫して承認する(browser, s.シードID, st.在庫ID, store.店名, d.在庫.画面, issue);
    }
  }
  // 在庫一覧画面で在庫を確かめる
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const d of s.商品.filter((x) => !x.削除 && !x.コードを変える && x.コード !== "DUP-M421-026")) {
      const store = d.店舗 === "B" ? 試験店舗B() : 試験店舗A();
      const want = !d.在庫 ? [0, 0] : "DB" in d.在庫 ? d.在庫.DB : d.在庫.画面.reduce(([n, c], [q, p]) => [n + q, c + q * p], [0, 0]);
      const code = 実際のコード(d);
      const got = await 在庫と総原価(await 在庫を検索する(page, code, store.店名), code, store.店名);
      expect(got, `${s.シードID}: 在庫一覧の ${code} の ${store.店名}・EC-CUBE の在庫と総原価`).toEqual({ 行の数: 1, 在庫: want[0], 総原価: want[1] });
    }
  });
  return 在庫ID;
}

function defineCaseSeed(seedId: string, d: Omit<シードの定め, "シードID">, after?: (ctx: { browser: Browser; notes: Notes }) => Promise<void>): void {
  const s: シードの定め = { シードID: seedId, ...d };
  defineSeed(seedId, { needs: ["S-M04-21-MASTER", "S-M04-21-APPROVERS"] }, async ({ browser, notes }) => {
    await 商品と在庫を作る(browser, notes, s);
    await withAdminSession(browser, 試験管理者.account, (page) => CSVを置く(page, s));
    if (after) await after({ browser, notes });
  });
}

const 入庫10 = { 画面: [[10, 100]] as [number, number][] };
const 一行 = (code: string, n: number | string, p: number | string): (string | number)[][] => [[code, n, p]];

defineCaseSeed("S-M04-21-FORM-006", { 商品: [{ 呼び名: "006", コード: "M421-IN-006", 名前: "M0421-006-商品", 在庫: 入庫10 }],
  CSV: [1, 2, 3, 4, 5, 6].map((i) => ({ 名前: `required-screen-${i}-006.csv`, 行: 一行("M421-IN-006", 1, 100) })),
});
defineCaseSeed("S-M04-21-FORM-008", { 商品: [{ 呼び名: "008", コード: "M421-IN-008", 名前: "M0421-008-商品", 在庫: 入庫10 }], CSV: [{ 名前: "max-reason-008.csv", 行: 一行("M421-IN-008", 1, 100) }] });
defineCaseSeed("S-M04-21-FORM-009", { 商品: [{ 呼び名: "009", コード: "M421-IN-009", 名前: "M0421-009-商品", 在庫: 入庫10 }], CSV: [{ 名前: "over-reason-009.csv", 行: 一行("M421-IN-009", 1, 100) }] });
defineCaseSeed("S-M04-21-VALID-012", { 商品: [{ 呼び名: "012", コード: "M421-IN-012", 名前: "入庫商品", 在庫: 入庫10 }], CSV: [{ 名前: "inbound-valid-012.csv", 行: 一行("M421-IN-012", 3, 200) }] });
defineCaseSeed("S-M04-21-WASTE-013", { 商品: [{ 呼び名: "013", コード: "M421-WASTE-013", 名前: "廃棄商品", 在庫: 入庫10 }], CSV: [{ 名前: "discard-cost-013.csv", 行: 一行("M421-WASTE-013", -3, 999) }] });
defineCaseSeed("S-M04-21-BOUNDARY-014", { 商品: [
    { 呼び名: "014A", コード: "M421-QMAX-014", 名前: "M0421-014A-商品" },
    { 呼び名: "014B", コード: "M421-QMIN-014", 名前: "M0421-014B-商品", 在庫: { 画面: [[99999999, 1]] } },
  ],
  CSV: [{ 名前: "alert-plus-014.csv", 行: 一行("M421-QMAX-014", 100, 1) }, { 名前: "alert-minus-014.csv", 行: 一行("M421-QMIN-014", -100, 0) }],
});
defineCaseSeed("S-M04-21-BOUNDARY-015", { 商品: [{ 呼び名: "015", コード: "M421-QMAX-015", 名前: "M0421-015-商品" }], CSV: [{ 名前: "alert-ok-015.csv", 行: 一行("M421-QMAX-015", 100, 1) }] });
defineCaseSeed("S-M04-21-VALIDATION-016", { 商品: [{ 呼び名: "016", コード: "M421-IN-016", 名前: "M0421-016-商品", 在庫: 入庫10 }],
  // 2行目は商品コードだけ空（ほかの列は任意の有効な値）、3行目は在庫増減数だけ空、4行目は仕入単価だけ空
  CSV: [{ 名前: "required-columns-016.csv", 行: [["", 1, 100], ["M421-IN-016", "", 100], ["M421-IN-016", 1, ""]] }],
});
defineCaseSeed("S-M04-21-LONGCODE-017", { 商品: [{ 呼び名: "017", コード: 長い商品コード, 名前: "M0421-017-商品", 印なし: true }], CSV: [{ 名前: "code-255-017.csv", 行: 一行(長い商品コード, 1, 100) }] });
defineCaseSeed("S-M04-21-BOUNDARY-019", { 商品: [{ 呼び名: "019", コード: "M421-QMAX-019", 名前: "M0421-019-商品" }], CSV: [{ 名前: "quantity-max-019.csv", 行: 一行("M421-QMAX-019", 99999999, 1) }] });
defineCaseSeed("S-M04-21-BOUNDARY-020", { 商品: [{ 呼び名: "020", コード: "M421-QMIN-020", 名前: "M0421-020-商品", 在庫: { 画面: [[99999999, 1]] } }],
  CSV: [{ 名前: "quantity-min-020.csv", 行: 一行("M421-QMIN-020", -99999999, 0) }],
});
defineCaseSeed("S-M04-21-BOUNDARY-022", { 商品: [{ 呼び名: "022A", コード: "M421-COST0-022", 名前: "M0421-022A-商品" }, { 呼び名: "022B", コード: "M421-COSTMAX-022", 名前: "M0421-022B-商品" }],
  CSV: [{ 名前: "cost-boundary-022.csv", 行: [["M421-COST0-022", 1, 0], ["M421-COSTMAX-022", 1, 999999999]] }],
});
defineCaseSeed("S-M04-21-VALIDATION-024", { 商品: [
    { 呼び名: "024A", コード: "M421-ZERO-024", 名前: "M0421-024A-商品", 在庫: { DB: [5, 500] } },
    { 呼び名: "024B", コード: "M421-IN-024", 名前: "M0421-024B-商品", 在庫: { DB: [10, 1000] } },
  ],
  CSV: [{ 名前: "zero-then-valid-024.csv", 行: [["M421-ZERO-024", 0, 0], ["M421-IN-024", 1, 100]] }],
});
defineCaseSeed("S-M04-21-VALIDATION-026", { 商品: [
    { 呼び名: "026A", コード: "M421-VALID-026", 名前: "M0421-026A-商品", 在庫: 入庫10 },
    { 呼び名: "026B", コード: "DUP-M421-026", 名前: "M0421-026B-商品" },
    { 呼び名: "026C", コード: "DUP-M421-026-2", 名前: "M0421-026C-商品", コードを変える: "DUP-M421-026" },
    { コード: "DEL-P-M421-026", 名前: "M0421-026D-商品", 削除: "商品" },
    { コード: "DEL-C-M421-026", 名前: "M0421-026E-商品", 削除: "規格" },
  ],
  未登録のコード: ["UNKNOWN-M421-026"],
  // 各行の在庫増減数・仕入単価は任意の有効な値（1・100）
  CSV: [{ 名前: "db-errors-026.csv", 行: ["UNKNOWN-M421-026", "M421-VALID-026", "DUP-M421-026", "DEL-P-M421-026", "DEL-C-M421-026"].map((c) => [c, 1, 100]) }],
});
defineCaseSeed("S-M04-21-BOUNDARY-027", { 商品: [{ 呼び名: "027", コード: "M421-UPPER-027", 名前: "M0421-027-商品", 在庫: { 画面: [[99999999, 1]] } }],
  CSV: [{ 名前: "post-upper-027.csv", 行: 一行("M421-UPPER-027", 1, 1) }],
});
defineCaseSeed("S-M04-21-BOUNDARY-028", { 商品: [{ 呼び名: "028", コード: "M421-LOW-028", 名前: "M0421-028-商品", 在庫: { 画面: [[5, 100]] } }],
  CSV: [{ 名前: "below-zero-028.csv", 行: 一行("M421-LOW-028", -6, 999) }],
});
defineCaseSeed(
  "S-M04-21-RECENT-030", { 商品: [{ 呼び名: "030", コード: "M421-IN-030", 名前: "M0421-030-商品", 在庫: 入庫10 }], CSV: [{ 名前: "repeat-030.csv", 行: 一行("M421-IN-030", 1, 100) }] },
  async ({ browser }) => {
    // 注記2: 同じ名前のファイルを画面から一度取り込み、取込の記録と在庫編集の承認の登録日時を「ケース開始の10分前」へ書き換える
    const name = ファイル名の("repeat-030.csv");
    const a = 試験店舗A();
    await withAdminSession(browser, 試験管理者.account, async (page) => {
      page.setDefaultTimeout(60_000);
      await openStockChangeCsv(page);
      await 入力する(page, { 店舗: a, 在庫区分: "EC-CUBE", 在庫変動区分: "入庫/問屋仕入", 在庫変動理由: "試験データ", 所属: 試験所属A, 承認者: [承認者A.名前] });
      await ファイルを選ぶ(page, caseCsvPath(name));
      const r = await 一括登録を押す(page);
      if (r.結果 !== "送信" || r.成功.length === 0 || r.誤り.length) throw new Error(`S-M04-21-RECENT-030: 同じ名前のファイルの先の取込ができなかった（${JSON.stringify(r)}）`);
    });
    db.取込の登録日時を戻す("S-M04-21-RECENT-030: 直近の同名の取込", name, new Date(Date.now() - 10 * 60_000).toISOString());
    reportSeedIssue("S-M04-21-RECENT-030", `直近の同名の取込は、DB へ行を足す代わりに画面から ${name} を一度取り込み、取込の記録と在庫編集の承認の登録日時を10分前へ DB で書き換えた（注記2）`);
  },
);
defineCaseSeed("S-M04-21-LARGEFILE-039", { 商品: [{ 呼び名: "039", コード: "M0421-039-A", 名前: "M0421-039-商品" }], CSV: [{ 名前: "rows-9999-039.csv", 行: Array.from({ length: 9999 }, () => ["M0421-039-A", 1, 100]) }] });
defineCaseSeed("S-M04-21-INMETA-040", { 商品: [{ 呼び名: "040", コード: "M0421-040-A", 名前: "M0421-040-入庫商品", 在庫: 入庫10 }], CSV: [{ 名前: "inbound-meta-040.csv", 行: 一行("M0421-040-A", 2, 300) }] });
defineCaseSeed("S-M04-21-WASTEDTL-041", { 商品: [{ 呼び名: "041", コード: "M0421-041-A", 名前: "M0421-041-廃棄商品", 在庫: { DB: [20, 2000] } }], CSV: [{ 名前: "discard-detail-041.csv", 行: 一行("M0421-041-A", -5, 999) }] });
defineCaseSeed("S-M04-21-WASTEMETA-042", { 商品: [{ 呼び名: "042", コード: "M0421-042-A", 名前: "M0421-042-商品", 在庫: { DB: [20, 2000] } }], CSV: [{ 名前: "discard-meta-042.csv", 行: 一行("M0421-042-A", -5, 999) }] });
defineCaseSeed("S-M04-21-NOTIFY-048", { 商品: [{ 呼び名: "048", コード: "M0421-048-A", 名前: "M0421-048-商品", 在庫: 入庫10 }], CSV: [{ 名前: "notify-048.csv", 行: 一行("M0421-048-A", 1, 100) }] });
defineCaseSeed("S-M04-21-WASTEBLANK-053", { 商品: [{ 呼び名: "053-A", コード: "M0421-053-A", 名前: "M0421-053-廃棄商品", 在庫: 入庫10 }], CSV: [{ 名前: "waste-blank-m0421-053.csv", 行: 一行("M0421-053-A", -2, "") }] });
defineCaseSeed("S-M04-21-TWOROWS-054", { 商品: [{ 呼び名: "054-A", コード: "M0421-054-A", 名前: "M0421-054-入庫商品A", 在庫: 入庫10 }, { 呼び名: "054-B", コード: "M0421-054-B", 名前: "M0421-054-入庫商品B", 在庫: 入庫10 }],
  CSV: [{ 名前: "inbound-two-m0421-054.csv", 行: [["M0421-054-A", 1, 200], ["M0421-054-B", 3, 300]] }],
});
defineCaseSeed("S-M04-21-ROUND-055", { 商品: [{ 呼び名: "055-A", コード: "M0421-055-A", 名前: "M0421-055-廃棄商品", 在庫: { 画面: [[1, 400], [2, 300]] } }],
  CSV: [{ 名前: "waste-round-m0421-055.csv", 行: 一行("M0421-055-A", -1, "") }],
});
defineCaseSeed("S-M04-21-REPEAT-056", { 商品: [{ 呼び名: "056-A", コード: "M0421-056-A", 名前: "M0421-056-入庫商品", 在庫: 入庫10 }],
  CSV: [{ 名前: "same-a-m0421-056.csv", 行: 一行("M0421-056-A", 1, 200) }, { 名前: "same-b-m0421-056.csv", 行: 一行("M0421-056-A", 1, 200) }],
});

// ---- 038: 編集権限が片方の店舗だけのメンバー ----

defineSeed("S-M04-21-STOREPERM-038", { needs: ["S-M04-21-MASTER", "S-M04-21-APPROVERS"] }, async ({ browser, notes, seed }) => {
  const a = 試験店舗A(), b = 試験店舗B();
  notes.set("〔店舗ID-M0421-038A〕", a.ID);
  notes.set("〔店舗ID-M0421-038B〕", b.ID);
  reportSeedIssue(seed.シードID, `店舗「M0421-038-ST-A」「M0421-038-ST-B」は作らず、開発環境の試験用の店舗「${a.店名}」（店舗ID ${a.ID}）・「${b.店名}」（店舗ID ${b.ID}）を使った`);
  notes.set("〔メンバーID-M0421-038〕", await withAdminSession(browser, SETUP_ADMIN, (page) => メンバーを用意する(page, ユーザー038, a.ID)));
  await withAdminSession(browser, ユーザー038.account, async () => undefined);
  const s: シードの定め = {
    シードID: seed.シードID, 商品: [{ 呼び名: "038", コード: "M0421-038-A", 名前: "M0421-038-商品", 店舗: "B", 在庫: { DB: [10, 1000] } }],
    CSV: [{ 名前: "perm-b-038.csv", 行: 一行("M0421-038-A", 1, 100) }],
  };
  await 商品と在庫を作る(browser, notes, s);
  await withAdminSession(browser, 試験管理者.account, (page) => CSVを置く(page, s));
});

// ---- 047: 入庫承認後の在庫更新 ----

defineSeed("S-M04-21-APPRV-047", { needs: ["S-M04-21-MASTER", "S-M04-21-APPROVERS"] }, async ({ browser, notes, seed }) => {
  const a = 試験店舗A();
  const s: シードの定め = {
    シードID: seed.シードID, 商品: [{ 呼び名: "047", コード: "M0421-047-A", 名前: "M0421-047-商品", 在庫: { DB: [10, 10000] } }],
    CSV: [{ 名前: "inbound-approve-047.csv", 行: 一行("M0421-047-A", 1, 900) }],
  };
  const 在庫IDs = await 商品と在庫を作る(browser, notes, s);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    notes.set("〔メンバーID-M0421-047A〕", await メンバーを用意する(page, 登録者047, a.ID));
    notes.set("〔メンバーID-M0421-047B〕", await メンバーを用意する(page, 承認者047, a.ID));
  });
  for (const m of [登録者047, 承認者047]) await withAdminSession(browser, m.account, async () => undefined);
  await withAdminSession(browser, 試験管理者.account, (page) => CSVを置く(page, s));
  // ⑧ 在庫変動履歴に行が無いこと・在庫編集承認一覧に M0421-047-登録者 の行が無いこと
  const 在庫ID = [...在庫IDs.values()][0];
  expect(db.在庫の変動履歴(在庫ID).length, `${seed.シードID}: M0421-047-A の在庫変動履歴は無い`).toBe(0);
  expect(db.登録者の承認情報と在庫変更履歴の件数(notes.get("〔メンバーID-M0421-047A〕")).承認情報, `${seed.シードID}: 登録者 M0421-047-登録者 の在庫編集承認情報は無い`).toBe(0);
});
