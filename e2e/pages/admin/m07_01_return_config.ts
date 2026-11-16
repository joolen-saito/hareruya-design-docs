/**
 * M07-01 戻しリストの並び順（065・101〜112）のシードが使う画面の操作。セレクタはここだけに書く。
 *
 * - 店舗基本設定（本店）の高額商品閾値1〜3: 店舗基本設定の部品（m10_01_shop.ts）で開き、閾値の欄だけを入れて保存する。
 *   保存は、送信の印が無効で保存されなかったときに開き直して入れ直す（ShopBasicPage.入れて保存する）。
 * - MTGマスターデータ管理の「色順」: 行の並び順を入れて「登録」する（MtgMasterEditPage）。
 * - 略称タグ登録/編集・棚番号登録/編集: 一覧は全件をCSV出力で読む（一覧の画面はページに分かれるため）。
 * - 商品登録編集の略称タグを外す（印つきの商品を共有の略称タグから外して戻す）。
 * - ダウンロードしたCSVの中身を、別のタブに表として出す（エビデンスの画面に残すため。アプリの画面ではない）。
 */
import { expect, Page } from "@playwright/test";
import { csvRecords } from "../../lib/csv";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";
import { ShopBasicPage } from "./m10_01_shop";
import { MtgMasterEditPage, マスタの行 } from "./m16_04_master";
import { ShortTagInput, ShortTagPage, shortTagEditUrl } from "./short_tag";
import { ShelfNumberPage } from "./m03_21_shelf_number";

const OPEN = 30_000;

// ---------------------------------------------------------------------------
// 本店の高額商品閾値
// ---------------------------------------------------------------------------

export type 閾値 = [string, string, string];
const 閾値の欄 = (page: Page, n: number) => page.locator(`[name="shop_master[expensive_threshold${n}]"]`);

/** 店舗基本設定（本店）を開き、高額商品閾値1〜3を読む（空は ""。桁区切りは外す） */
export async function 本店の閾値を読む(page: Page): Promise<閾値> {
  await new ShopBasicPage(page).open();
  const out: string[] = [];
  for (const n of [1, 2, 3]) {
    await expect(閾値の欄(page, n), `店舗基本設定の高額商品閾値${n}の欄`).toBeVisible({ timeout: OPEN });
    out.push((await 閾値の欄(page, n).inputValue()).replace(/[,\s]/g, ""));
  }
  return out as 閾値;
}

/** 店舗基本設定（本店）で高額商品閾値1〜3だけを入れて「登録」し、保存されたことを確かめる（ほかの項目は表示の値のまま） */
export async function 本店の閾値を入れて保存する(page: Page, v: 閾値, what: string): Promise<void> {
  const p = new ShopBasicPage(page);
  await p.入れて保存する(what, async () => {
    for (const n of [1, 2, 3]) await 閾値の欄(page, n).fill(v[n - 1], { timeout: OPEN });
  });
}

// ---------------------------------------------------------------------------
// 色順（MTGマスターデータ管理）
// ---------------------------------------------------------------------------

export async function 色順を開く(page: Page): Promise<MtgMasterEditPage> {
  const m = new MtgMasterEditPage(page);
  await m.open();
  await m.種別を選んで表示する("色順");
  return m;
}

/** 色順の行の名称と並び順の項目名（画面の入力欄の送信名） */
export const 色順の項目 = (r: マスタの行): { 名称: string; 並び順: string } => ({
  名称: "name" in r.値 ? "name" : "nameJp",
  並び順: "sort_no" in r.値 ? "sort_no" : "sortNo",
});

/** 色順の全行（識別番号と、画面の入力欄の値） */
export async function 色順の全行(page: Page): Promise<マスタの行[]> {
  return (await 色順を開く(page)).全行を読む();
}

/** 色順の行（識別番号）の並び順を入れて「登録」し、保存されたことを確かめる */
export async function 色順の並び順を入れて登録する(page: Page, 番号: number, 項目: string, 並び順: string, what: string): Promise<void> {
  const m = await 色順を開く(page);
  await m.行に入れる(番号, { [項目]: 並び順 });
  await m.登録を押す();
  await expectSaved(page, what);
}

/** 色順の全行を、控えた値へ戻して「登録」する（違う行だけ入れ直す。違いが無ければ登録しない） */
export async function 色順を控えへ戻す(page: Page, 前: マスタの行[], what: string): Promise<void> {
  const m = await 色順を開く(page);
  const 今 = await m.全行を読む();
  let 変える = 0;
  for (const r of 前) {
    const now = 今.find((x) => x.番号 === r.番号);
    if (!now) throw new Error(`${what}: 色順の元の行（番号 ${r.番号}）が無い`);
    const 違う = Object.fromEntries(Object.entries(r.値).filter(([k, v]) => now.値[k] !== v));
    if (Object.keys(違う).length) { await m.行に入れる(r.番号, 違う); 変える += 1; }
  }
  if (変える === 0) return;
  await m.登録を押す();
  await expectSaved(page, what);
}

// ---------------------------------------------------------------------------
// 略称タグ
// ---------------------------------------------------------------------------

export type 一覧の行 = { ID: string; 名称: string; 並び順: number };

const 一覧の行に = (text: string): 一覧の行[] =>
  csvRecords(text).map((r) => ({ ID: (r["ID"] ?? "").trim(), 名称: (r["名称"] ?? "").trim(), 並び順: Number((r["並び順"] ?? "").trim()) }));

/** 略称タグの全件（CSV出力で読む。ID・名称・並び順） */
export async function 略称タグの全件(page: Page): Promise<一覧の行[]> {
  const t = new ShortTagPage(page);
  await t.openNew();
  return 一覧の行に((await t.downloadCsv()).text);
}

/** 略称タグの編集欄を開き、名称・並び順・アルファベット順ソートフラグを読む */
export async function 略称タグを開いて読む(page: Page, id: string): Promise<ShortTagInput> {
  await page.goto(shortTagEditUrl(id), { timeout: 60_000 });
  const t = new ShortTagPage(page);
  await t.ready();
  return t.inputValues();
}

/** 略称タグの編集欄を開き、値を入れて「登録」する（成功の表示を確かめる） */
export async function 略称タグを書き換える(page: Page, id: string, v: ShortTagInput, what: string): Promise<void> {
  await page.goto(shortTagEditUrl(id), { timeout: 60_000 });
  const t = new ShortTagPage(page);
  await t.ready();
  await t.register(v, what);
}

/** 略称タグを新しく登録し、IDを返す */
export async function 略称タグを新しく登録する(page: Page, v: ShortTagInput, what: string): Promise<string> {
  const t = new ShortTagPage(page);
  await t.openNew();
  return t.register(v, what);
}

/** 略称タグ（ID）を一覧の削除ボタンで消す（一覧を全件の表示にしてから行を探す） */
export async function 略称タグを消す(page: Page, id: string, what: string): Promise<void> {
  const t = new ShortTagPage(page);
  await t.showFirstPageWith("12000");
  await t.deleteRow(t.rowById(id), what);
}

// ---------------------------------------------------------------------------
// 棚番号
// ---------------------------------------------------------------------------

/** 棚番号の全件（CSV出力で読む。ID・名称・並び順） */
export async function 棚番号の全件(page: Page): Promise<一覧の行[]> {
  const s = new ShelfNumberPage(page);
  await s.openNew();
  return 一覧の行に((await s.downloadCsv()).text);
}

/** 棚番号を新しく登録し、IDを返す */
export async function 棚番号を新しく登録する(page: Page, v: { 名称: string; 並び順: number }, what: string): Promise<string> {
  const s = new ShelfNumberPage(page);
  await s.openNew();
  return s.register({ 名称: v.名称, 並び順: String(v.並び順) }, what);
}

// ---------------------------------------------------------------------------
// 商品の略称タグ
// ---------------------------------------------------------------------------

const 商品の略称タグの欄 = (page: Page) => page.locator('form#form1 select[name="admin_product[StorageCode]"]');

async function 商品を開く(page: Page, 商品ID: string): Promise<void> {
  await page.goto(adminUrl(`/product/product/${商品ID}/edit`), { timeout: 60_000 });
  await page.waitForLoadState("load");
  await expect(商品の略称タグの欄(page), `商品ID ${商品ID} の商品登録編集画面の略称タグの欄`).toBeVisible({ timeout: OPEN });
}

/** 商品登録編集画面で選ばれている略称タグの名称（未選択は ""） */
export async function 商品の略称タグ(page: Page, 商品ID: string): Promise<string> {
  await 商品を開く(page, 商品ID);
  if (!(await 商品の略称タグの欄(page).inputValue())) return "";
  return ((await 商品の略称タグの欄(page).locator("option:checked").textContent()) ?? "").trim();
}

/** 商品登録編集画面で略称タグを未選択にして「商品を登録」する。もともと未選択なら何もしない（false を返す） */
export async function 商品の略称タグを外す(page: Page, 商品ID: string, what: string): Promise<boolean> {
  await 商品を開く(page, 商品ID);
  if (!(await 商品の略称タグの欄(page).inputValue())) return false;
  await 商品の略称タグの欄(page).selectOption("", { timeout: OPEN });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }).catch(() => null),
    page.locator('form#form1 button[type="submit"]').filter({ hasText: /^\s*商品を登録\s*$/ }).click({ timeout: OPEN, noWaitAfter: true }),
  ]);
  await expectSaved(page, what);
  return true;
}

// ---------------------------------------------------------------------------
// CSVの中身を表として見せる
// ---------------------------------------------------------------------------

/**
 * 同じブラウザセッションに新しいタブを開き、CSVの見出しと行を表として出す（エビデンスの画面に中身を残すため。アプリの画面ではない）。
 * 開いたタブを返す（手順・期待結果の自動の撮影で、ケースの画面と一緒に撮られる）。
 */
export async function CSVを表で見せる(page: Page, 題: string, 見出し: string[], 行: Record<string, string>[]): Promise<Page> {
  const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
  const head = `<tr><th>行</th>${見出し.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>`;
  const body = 行.map((r, i) => `<tr><td>${i + 1}</td>${見出し.map((h) => `<td>${esc(r[h] ?? "")}</td>`).join("")}</tr>`).join("");
  const t = await page.context().newPage();
  await t.setContent(`<html lang="ja"><head><meta charset="utf-8"><title>${esc(題)}</title></head><body style="font-family:sans-serif;padding:16px">
    <h2>${esc(題)}</h2><p>E2E がダウンロードしたCSVの中身を、そのままの行の順で表にしたもの（アプリの画面ではない）。</p>
    <table border="1" cellpadding="6" style="border-collapse:collapse;font-size:14px">${head}${body}</table></body></html>`);
  return t;
}
