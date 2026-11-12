/**
 * F10-02 購入完了の売上連携（フロント アクセス解析）。正本: cases/F10-02_test_cases.tsv
 *
 * - 「ブラウザの開発者ツールのコンソールで受け渡し領域（dataLayer）の内容を表示する」は、ページの中で受け渡し領域の値を読み出して代える（F10-01・F10-03 と同じ）。読んだ中身は手順の注記に残す。
 * - 事前準備の「専用ブラウザで会員に完全ログイン」は、手順の前に会員のメールとパスワードでログインする。ご注文方法指定画面を開いたあと、配送方法・支払方法が
 *   シードで選んだとおりでなければ選び直す（画面を開き直すと既定に戻ることがあるため。選んだ内容は注記に残す）。
 * - 手順「注文する」ボタンを押す: 画面の「この内容で注文を確定します。」のチェックを入れてから押す（これを入れないとボタンが押せない）。
 * - 値の比べ方: 「その値が X」は型も含めて比べる（文字の "1620" は数値の 1620 と違う）。配送方法の名称・商品コード・商品名・メールは実行の印つきの値として読む。
 *   受注ID は、購入完了のあとに会員の最新の受注の番号を DB で読み、8桁に満たなければ左を0で埋める。
 * 実装しないケース（理由は報告）: 001〜003（固定の受注ID）・005（複数のお届け先）・009（手数料・値引き）・017（同じ商品の別行）・028（共有のレイアウトの試験用ブロック）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseBody, CaseCtx } from "../../lib/case";
import { SETUP_ADMIN } from "../../config/env";
import { loginAdmin } from "../../lib/session";
import { 会員の最新の受注ID } from "../../db/f10_02";
import { 受注の小計を読む } from "../../pages/admin/f10_02_order";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import {
  TOP画面か, ご注文方法指定を開く, 先頭部のHTML, 入口, 支払方法を選ぶ, 注文するを押す, 配送方法を選ぶ, 使用ポイントを入れる, 購入完了画面か, 購入完了画面を開く,
  購入完了画面の読み込み前に受け渡し領域へ積む,
} from "../../pages/front/f10_02_purchase";
import { 受け渡し領域の要素, 項目を持つ要素, 読んだ領域 } from "../../pages/front/f10_03_retargeting";
import { 会員のパスワード, 会員のメール, 商品コード, 商品名, 配送名 } from "../../seeds/f10-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 受け渡し領域を読み、中身を注記に残す（コンソールで表示する代わり） */
async function 表示する(page: Page): Promise<読んだ領域> {
  const d = await 受け渡し領域の要素(page);
  note(`受け渡し領域（${new URL(page.url()).pathname}）: ${d.配列か ? `配列・${d.要素.length}要素 ${d.要素.map((e) => e.文).join(" , ").slice(0, 3000)}` : `配列でない（型 ${d.型}）`}`);
  return d;
}

const 値の文 = (v: unknown): string => (v === undefined ? "（無い）" : typeof v === "object" ? JSON.stringify(v) : `${typeof v === "string" ? `"${v}"` : String(v)}`);
const 値の並び = (d: 読んだ領域, 項目名: string): string => 項目を持つ要素(d, 項目名).map((e) => 値の文(e.値[項目名])).join(" / ") || "なし";

/** 項目名と値（型も含めて）が同じ要素の数 */
function 値が同じ要素の数(d: 読んだ領域, 項目名: string, 値: unknown): number {
  return d.要素.filter((e) => e.項目名.includes(項目名) && e.値[項目名] === 値).length;
}
/** 項目名が値の要素が1件あること */
function 一件で値(d: 読んだ領域, 項目名: string, 値: unknown): void {
  expect.soft(値が同じ要素の数(d, 項目名, 値), `項目名 ${項目名} が値 ${値の文(値)} の要素の数（積まれた値: ${値の並び(d, 項目名)}）`).toBe(1);
}
/** 項目名 transactionId を持つ要素 */
const 売上の要素 = (d: 読んだ領域) => 項目を持つ要素(d, "transactionId");
/** 項目名 transactionProducts を持つ要素が1件あり、その値の配列（無ければ空） */
function 商品の配列(d: 読んだ領域): Record<string, unknown>[] {
  const els = 項目を持つ要素(d, "transactionProducts");
  expect.soft(els.length, "項目名 transactionProducts を持つ要素の数").toBe(1);
  const v = els[0]?.値.transactionProducts;
  expect.soft(Array.isArray(v), `項目名 transactionProducts の値が配列（実際 ${値の文(v)}）`).toBe(true);
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
}
const 八桁 = (id: string): string => id.padStart(8, "0");

async function ログインする(page: Page, 番号: string): Promise<void> {
  await frontLogin(page, { メール: 会員のメール(番号), パスワード: 会員のパスワード() });
}
function 会員IDの(notes: CaseCtx["notes"], 番号: string): string { return notes.get(`〔会員ID-F1002-${番号}〕`); }

/** ご注文方法指定画面を開いて、配送方法・支払方法がシードのとおりか確かめ、違えば選び直す */
async function 注文方法を整える(page: Page, 番号: string): Promise<void> {
  await 配送方法を選ぶ(page, 配送名(番号), `F1002-${番号}`);
  await 支払方法を選ぶ(page, "銀行振込", `F1002-${番号}`);
  note(`ご注文方法指定画面の配送方法は「${配送名(番号)}」、支払方法は「銀行振込」（シードで選んだとおり）`);
}

type 標準の指定 = { 店?: 入口; ポイント?: number; 読む?: (d: 読んだ領域, ctx: CaseCtx, 番号: string, 受注ID: string) => void | Promise<void>; 前に?: (page: Page) => Promise<void> };

/** 標準の3手順（ご注文方法指定画面を開く → 注文する → 購入完了画面で受け渡し領域を表示する）のケース */
function 標準(番号: string, 確かめ: (d: 読んだ領域, 受注ID: string) => void, 指定: 標準の指定 = {}): CaseBody {
  return async (ctx) => {
    const { page, notes, step, expected } = ctx;
    let d: 読んだ領域 | undefined;
    let 受注ID = "";
    await ログインする(page, 番号);
    if (指定.前に) await 指定.前に(page);
    await step(1, async () => {
      await ご注文方法指定を開く(page, 指定.店 ?? 入口.日本語);
      if (!指定.店 || 指定.店 === 入口.日本語) await 注文方法を整える(page, 番号);
    });
    await step(2, async () => {
      if (指定.ポイント) { await 使用ポイントを入れる(page, 指定.ポイント, `F1002-${番号}`); note(`使用ポイントの欄に ${指定.ポイント} を入れて注文した`); }
      await 注文するを押す(page, `F1002-${番号}`);
    });
    await step(3, async () => {
      受注ID = 会員の最新の受注ID(会員IDの(notes, 番号));
      note(`この会員の最新の受注ID: ${受注ID}（シードが控えた受注ID: ${notes.get(`〔受注ID-F1002-${番号}〕`)}）`);
      d = await 表示する(page);
    });
    await expected(async () => {
      expect.soft(購入完了画面か(page), `購入完了画面が表示されている（パス ${new URL(page.url()).pathname}）`).toBe(true);
      確かめ(d!, 受注ID);
    });
  };
}

// ---------------------------------------------------------------------------
// 積む値（項目ごと）
// ---------------------------------------------------------------------------

caseTest("IT-F10-02-004", 標準("004", (d) => 一件で値(d, "transactionAffiliation", 配送名("004"))));
caseTest("IT-F10-02-006", 標準("006", (d) => 一件で値(d, "transactionTotal", "1620")));
caseTest("IT-F10-02-007", 標準("007", (d) => 一件で値(d, "transactionTotal", "3780")));
caseTest("IT-F10-02-008", 標準("008", (d) => 一件で値(d, "transactionTotal", "1620"), { ポイント: 200 }));
caseTest("IT-F10-02-010", 標準("010", (d) => 一件で値(d, "transactionShipping", "600")));
caseTest("IT-F10-02-011", 標準("011", (d) => 一件で値(d, "transactionMailaddress", 会員のメール("011"))));

// ---------------------------------------------------------------------------
// 商品の値
// ---------------------------------------------------------------------------

caseTest("IT-F10-02-012", 標準("012", (d) => { const a = 商品の配列(d); expect.soft(a.length, "transactionProducts の配列の件数").toBe(1); expect.soft(a[0]?.sku, "1件目の sku").toBe(商品コード("012", "A")); }));
caseTest("IT-F10-02-013", 標準("013", (d) => { const a = 商品の配列(d); expect.soft(a.length, "transactionProducts の配列の件数").toBe(1); expect.soft(a[0]?.name, "1件目の name").toBe(商品名("013", "A")); }));
caseTest("IT-F10-02-014", 標準("014", (d) => { const a = 商品の配列(d); expect.soft(a.length, "transactionProducts の配列の件数").toBe(1); expect.soft(a[0]?.price, "1件目の price").toBe("500"); }));
caseTest("IT-F10-02-015", 標準("015", (d) => { const a = 商品の配列(d); expect.soft(a.length, "transactionProducts の配列の件数").toBe(1); expect.soft(a[0]?.quantity, "1件目の quantity").toBe("3"); }));
caseTest("IT-F10-02-016", 標準("016", (d) => {
  const a = 商品の配列(d);
  expect.soft(a.length, "transactionProducts の配列の件数").toBe(2);
  expect.soft(a[0]?.sku, "1件目の sku").toBe(商品コード("016", "A"));
  expect.soft(a[1]?.sku, "2件目の sku").toBe(商品コード("016", "B"));
}));

/** 018: 手順3は「ページ先頭部のHTMLの内容を表示する」 */
caseTest("IT-F10-02-018", async ({ page, step, expected }) => {
  let html = "";
  await ログインする(page, "018");
  await step(1, async () => { await ご注文方法指定を開く(page); await 注文方法を整える(page, "018"); });
  await step(2, async () => { await 注文するを押す(page, "F1002-018"); });
  await step(3, async () => { html = await 先頭部のHTML(page); note(`ページ先頭部のHTML（長さ ${html.length}）: ${html.replace(/\s+/g, " ").slice(0, 3000)}`); });
  await expected(async () => {
    const 名 = 商品名("018", "A");
    const 置き換え = Array.from(名).map((ch) => (ch.charCodeAt(0) > 127 ? `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}` : ch)).join("");
    expect.soft(html.includes(名), `ページ先頭部のHTMLに商品名「${名}」がそのままの文字で含まれる`).toBe(true);
    expect.soft(html.toLowerCase().includes(置き換え.toLowerCase()), `ページ先頭部のHTMLに商品名が文字コード置き換え表記（${置き換え}）で含まれない`).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// エッジケース・形式
// ---------------------------------------------------------------------------

caseTest("IT-F10-02-019", 標準("019", (d) => 一件で値(d, "transactionShipping", "0")));
caseTest("IT-F10-02-020", 標準("020", (d) => { const a = 商品の配列(d); expect.soft(a.length, "transactionProducts の配列の件数").toBeGreaterThanOrEqual(1); expect.soft(a[0]?.category, "1件目の category").toBe(""); }));
caseTest("IT-F10-02-021", 標準("021", (d) => 一件で値(d, "transactionTax", 0)));
caseTest("IT-F10-02-022", 標準("022", (d) => {
  const els = 売上の要素(d);
  expect.soft(els.length, "項目名 transactionId を持つ要素の数").toBe(1);
  expect.soft([...(els[0]?.項目名 ?? [])].sort(), "その要素が持つ項目").toEqual(["transactionAffiliation", "transactionId", "transactionMailaddress", "transactionProducts", "transactionShipping", "transactionTax", "transactionTotal"]);
}));
caseTest("IT-F10-02-023", 標準("023", (d) => {
  const els = 売上の要素(d);
  expect.soft(els.length, "項目名 transactionId を持つ要素の数").toBe(1);
  const 配列の項目 = Object.entries(els[0]?.値 ?? {}).filter(([, v]) => Array.isArray(v)).map(([k]) => k);
  expect.soft(配列の項目, "値が配列である項目").toEqual(["transactionProducts"]);
}));
caseTest("IT-F10-02-024", 標準("024", (d) => {
  const els = 売上の要素(d);
  expect.soft(els.length, "項目名 transactionId を持つ要素の数").toBe(1);
  for (const k of ["transactionId", "transactionAffiliation", "transactionTotal", "transactionShipping", "transactionMailaddress"]) expect.soft(typeof els[0]?.値[k], `項目 ${k} の値の型（実際 ${値の文(els[0]?.値[k])}）`).toBe("string");
}));
caseTest("IT-F10-02-026", 標準("026", (d) => {
  const a = 商品の配列(d);
  expect.soft(a.length, "transactionProducts の配列の件数").toBeGreaterThanOrEqual(1);
  expect.soft(Object.keys(a[0] ?? {}).sort(), "配列の1件目が持つ項目").toEqual(["category", "name", "price", "quantity", "sku"]);
}));
caseTest("IT-F10-02-027", 標準("027", (d) => {
  const a = 商品の配列(d);
  expect.soft(a.length, "transactionProducts の配列の件数").toBeGreaterThanOrEqual(1);
  for (const k of ["sku", "name", "category", "price", "quantity"]) expect.soft(typeof a[0]?.[k], `配列の1件目の ${k} の値の型（実際 ${値の文(a[0]?.[k])}）`).toBe("string");
}));

// 029: 英語版
caseTest("IT-F10-02-029", 標準("029", (d, id) => 一件で値(d, "transactionId", 八桁(id)), { 店: 入口.英語 }));

// 030: ご注文方法指定画面では積まない（注文はしない）
caseTest("IT-F10-02-030", async ({ page, step, expected }) => {
  let d: 読んだ領域 | undefined;
  await ログインする(page, "030");
  await step(1, async () => { await ご注文方法指定を開く(page); await 注文方法を整える(page, "030"); });
  await step(2, async () => { d = await 表示する(page); });
  await expected(async () => { expect.soft(売上の要素(d!).length, `項目名 transactionId を持つ要素の数（ご注文方法指定画面。パス ${new URL(page.url()).pathname}）`).toBe(0); });
});

// 031: 購入処理中の受注が無い会員が購入完了画面のURLを開くと TOP 画面へ移る
caseTest("IT-F10-02-031", async ({ page, step, expected }) => {
  let d: 読んだ領域 | undefined;
  await ログインする(page, "031");
  await step(1, async () => { await 購入完了画面を開く(page); note(`開いたあとの画面: ${new URL(page.url()).pathname}`); });
  await step(2, async () => { d = await 表示する(page); });
  await expected(async () => {
    expect.soft(TOP画面か(page), `TOP画面が表示されている（パス ${new URL(page.url()).pathname}）`).toBe(true);
    expect.soft(売上の要素(d!).length, "項目名 transactionId を持つ要素の数").toBe(0);
  });
});

// 032: 明細2行でも、受注1件につき要素1件
caseTest("IT-F10-02-032", 標準("032", (d) => expect.soft(売上の要素(d).length, `項目名 transactionId を持つ要素の数（積まれた値: ${値の並び(d, "transactionId")}）`).toBe(1)));

// 033: 購入完了画面を再読み込みすると TOP 画面へ移り、値を積まない
caseTest("IT-F10-02-033", async ({ page, step, expected }) => {
  let d: 読んだ領域 | undefined;
  await ログインする(page, "033");
  await step(1, async () => { await ご注文方法指定を開く(page); await 注文方法を整える(page, "033"); });
  await step(2, async () => { await 注文するを押す(page, "F1002-033"); });
  await step(3, async () => {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForLoadState("load");
    note(`再読み込みのあとの画面: ${new URL(page.url()).pathname}`);
  });
  await step(4, async () => { d = await 表示する(page); });
  await expected(async () => {
    expect.soft(購入完了画面か(page), "再読み込みのあとも購入完了画面のまま、ではない").toBe(false);
    expect.soft(TOP画面か(page), `TOP画面へ移動している（パス ${new URL(page.url()).pathname}）`).toBe(true);
    expect.soft(売上の要素(d!).length, "項目名 transactionId を持つ要素の数").toBe(0);
  });
});

// 034: 受け渡し領域が配列で、要素がちょうど1件
caseTest("IT-F10-02-034", 標準("034", (d, id) => {
  expect.soft(d.配列か, `受け渡し領域が配列（型 ${d.型}）`).toBe(true);
  expect.soft(d.要素.length, "受け渡し領域の要素の数").toBe(1);
  expect.soft(d.要素[0]?.値.transactionId, "その1件の transactionId").toBe(八桁(id));
}));

// 035: 購入完了画面を読み込む前に積まれていた要素を残し、末尾へ足す
caseTest("IT-F10-02-035", 標準("035", (d, id) => {
  expect.soft(d.要素.length, "受け渡し領域の要素の数").toBe(2);
  expect.soft(d.要素[0]?.値["pre-F1002-035"], "1件目の項目 pre-F1002-035 の値").toBe("F1002-035");
  expect.soft(d.要素[1]?.値.transactionId, "2件目の transactionId").toBe(八桁(id));
}, {
  前に: async (page) => {
    await 購入完了画面の読み込み前に受け渡し領域へ積む(page, "pre-F1002-035", "F1002-035");
    note("購入完了画面を読み込む前の受け渡し領域へ、項目名 pre-F1002-035・値 F1002-035 の要素を1件入れておいた（購入完了画面の文書が作られる前に入れるスクリプトをブラウザへ仕込んだ）");
  },
}));

// 039: 商品小計は税込の合計、price は税抜。管理画面の受注の商品小計と同じ
caseTest("IT-F10-02-039", async ({ page, notes, step, expected }) => {
  let d: 読んだ領域 | undefined;
  let 受注ID = "";
  let 小計 = "";
  await ログインする(page, "039");
  await step(1, async () => { await ご注文方法指定を開く(page); await 注文方法を整える(page, "039"); });
  await step(2, async () => { await 注文するを押す(page, "F1002-039"); });
  await step(3, async () => { 受注ID = 会員の最新の受注ID(会員IDの(notes, "039")); d = await 表示する(page); });
  await step(4, async () => {
    await loginAdmin(page, SETUP_ADMIN);
    小計 = await 受注の小計を読む(page, 受注ID);
    note(`受注ID ${受注ID} の受注情報編集画面の小計の欄: ${小計}`);
  });
  await expected(async () => {
    一件で値(d!, "transactionTotal", "1080");
    const a = 商品の配列(d!);
    expect.soft(a.length, "transactionProducts の配列の件数").toBe(1);
    expect.soft(a[0]?.price, "配列の1件目の price").toBe("333");
    expect.soft(小計.replace(/[^0-9]/g, ""), `管理画面の受注の小計（欄の文 ${小計}）の数字`).toBe("1080");
  });
});
