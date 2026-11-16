/**
 * F01-02 支店ECTOP の試験支店を、ケースの間で使い回すための部品（依頼者の指示 2026-11-12「毎回作らずに1個でいけるやつは使い回す」）。セレクタはここだけに書く。
 *
 * 以前はケースの番号ごとに支店を作っていた（1回の流しで約100店）。いまは決まった名前の試験支店1つ（公開。006 だけは非公開の支店1つ）を全部のケースで使い、
 * ケースの初め（シードの作成の最初）に、試験支店の中身をそのケースの状態にそろえる。
 *
 * アプリの作り（実ソースで確かめた）:
 * - 支店ECTOPの SALE中の商品・今週の売れ筋・タイル・ピックアップは、どれも「商品の公開状態が公開」かつ「支店の商品公開ステータスが公開」の商品だけを出す。
 * - 商品公開CSV登録（商品ID・商品公開ステータス・支店の商品公開ステータス）は、在庫がある商品でも公開状態を変えられる（廃止の商品は飛ばす）。
 *
 * そろえ方: 商品マスターで、商品コードに F01-02 の頭（「F0102-」）を含み公開状態が「公開」の商品（前のケース・前の回の残り。どれも E2E の印つきの商品）を全部読み、
 * 商品公開CSV登録で「非公開・支店も非公開」にする。そのあと、もう一度検索して1件も残っていないことを確かめる（残っていれば止める）。
 * このケースの商品は、そろえたあとで作るので外さない。
 */
import { Page, expect } from "@playwright/test";
import { adminUrl, withAdminSession } from "../../lib/session";
import { SETUP_ADMIN } from "../../config/env";
import { registerRestore } from "../../lib/shared_restore";
import { expectSaved } from "./common";
import { describeCsvUpload, ProductCsvUploadScreen, 商品公開CSV登録 } from "./m03_38_product_status_csv";
import { TenantEditPage } from "./m10_15_tenant";
import { allTagRows } from "./m03_28_seed_ops";
import { タグを用意する } from "./f01_02_setup";
import { withCreateOnceLock } from "../../lib/create_once_lock";
import { ProductSearchPage } from "./product_search";

type Issue = (m: string) => void;

/** F01-02 が作る商品の商品コードの頭（どの商品コードもこの頭で始まり、末尾に実行の印が付く） */
export const F0102の商品コードの頭 = "F0102-";

/** 商品マスター(検索結果)の行（商品ごと。2列目が商品ID、4列目が先頭の商品規格の商品コード） */
const productRows = (page: Page) => page.locator('tr[id^="ex-product-"]');

async function 行を読む(page: Page): Promise<{ id: string; code: string }[]> {
  return productRows(page).evaluateAll((trs) => trs.map((tr) => ({
    id: (tr.querySelectorAll("td")[1]?.textContent ?? "").trim(),
    code: (tr.querySelectorAll("td")[3]?.textContent ?? "").trim(),
  })));
}

/**
 * 商品マスターで、商品コードに 頭 を含み（画面の検索は部分一致）、公開状態が「公開」の商品を全ページ読む。
 * 既定でチェックされている絞り込み（公開状態・状態・高額商品）は外し、公開状態は「公開」だけにする。行の商品コードが 頭 で始まるものだけを返す。
 */
export async function 公開中の商品を読む(page: Page, 頭: string): Promise<{ id: string; code: string }[]> {
  page.setDefaultTimeout(120_000);
  const s = new ProductSearchPage(page);
  await s.open();
  await s.ensureDetailVisible();
  for (const field of ["status", "card_condition", "expensive"]) {
    for (const o of await s.choiceOptions(field)) if (o.checked) await s.setChecked(field, o.value, false);
  }
  const 公開 = (await s.choiceOptions("status")).filter((o) => o.label === "公開");
  if (公開.length !== 1) throw new Error(`商品マスターの公開状態の絞り込みに「公開」が ${公開.length} 件（1件のはず）`);
  await s.setChecked("status", 公開[0].value, true);
  await s.field("product_code").fill(頭);
  await s.submitAndWaitForResult();
  const m = /検索結果：\s*(\d+)\s*件/.exec((await page.locator("body").innerText()).replace(/\s+/g, " "));
  const total = m ? Number(m[1]) : 0;
  if (total === 0) return [];
  // 1ページの件数を選択肢のいちばん大きい値にして、全ページを読む（ページを移っても検索の条件は画面が覚えている）
  const opts = await page.locator("#page_count_pulldown option").evaluateAll((os) => os.map((o) => ({ path: (o as HTMLOptionElement).value, n: Number((o.textContent ?? "").replace(/\D/g, "")) })));
  const best = opts.filter((o) => o.path && o.n > 0).sort((a, b) => b.n - a.n)[0];
  if (best) await page.goto(new URL(best.path, page.url()).toString(), { waitUntil: "load" });
  const 件数 = best?.n ?? (await productRows(page).count());
  const found = new Map<string, string>();
  for (const r of await 行を読む(page)) found.set(r.id, r.code);
  for (let p = 2; p <= Math.ceil(total / Math.max(1, 件数)); p++) {
    await page.goto(adminUrl(`/product/page/${p}`), { waitUntil: "load" });
    for (const r of await 行を読む(page)) found.set(r.id, r.code);
  }
  if (found.size !== total) throw new Error(`商品マスターの検索結果 ${total} 件のうち、読めた商品は ${found.size} 件（全ページを読めない）`);
  return [...found].map(([id, code]) => ({ id, code })).filter((r) => /^\d+$/.test(r.id) && r.code.startsWith(頭));
}

/** 商品公開CSV登録で、商品IDの商品を「商品公開ステータス 非公開（2）・支店の商品公開ステータス 非公開（0）」にする（2000件ずつ） */
export async function 商品を非公開にする(page: Page, ids: string[], what: string): Promise<void> {
  for (let i = 0; i < ids.length; i += 2000) {
    const part = ids.slice(i, i + 2000);
    const text = `商品ID,商品公開ステータス,支店の商品公開ステータス\n${part.map((id) => `${id},2,0`).join("\n")}\n`;
    const scr = new ProductCsvUploadScreen(page, 商品公開CSV登録);
    await scr.open();
    const r = await scr.upload({ name: `f0102-reset-${Date.now()}.csv`, bytes: Buffer.from(text, "utf-8") });
    if (!r.送信した || r.上部のエラー.length > 0 || r.上部の成功.length === 0) throw new Error(`${what}: 商品公開CSV登録が成功の表示にならない（${describeCsvUpload(r)}）`);
  }
}

/**
 * 試験支店の中身をそろえる: 前のケース・前の回が作った F01-02 の商品（公開中のもの）を全部「非公開・支店も非公開」にし、残っていないことを確かめる。
 * どの支店ECTOPにも、このあとこのケースが作る商品だけが出る状態にする。
 */
export async function 試験支店の商品をそろえる(page: Page, what: string, issue: Issue): Promise<void> {
  const left = await 公開中の商品を読む(page, F0102の商品コードの頭);
  if (left.length === 0) {
    issue(`ケースの初めに、試験支店を使い回すため、商品コードの頭「${F0102の商品コードの頭}」の公開中の商品（前のケース・前の回の残り）が無いことを商品マスターで確かめた`);
    return;
  }
  await 商品を非公開にする(page, left.map((r) => r.id), what);
  const again = await 公開中の商品を読む(page, F0102の商品コードの頭);
  if (again.length > 0) throw new Error(`${what}: 前のケース・前の回の商品を非公開にしたのに、公開中のものが ${again.length} 件残る（${again.slice(0, 5).map((r) => `${r.id}:${r.code}`).join("、")}）`);
  const 例 = left.slice(0, 3).map((r) => r.code).join("、");
  issue(`ケースの初めに、試験支店を使い回すため、前のケース・前の回が作った印つきの商品 ${left.length} 件（商品コードの頭「${F0102の商品コードの頭}」・公開中。例 ${例}）を、商品公開CSV登録で「非公開・支店も非公開」にし、公開中のものが残っていないことを確かめた（このケースの商品はこのあとで作る）`);
}

/** 店舗登録画面で、店舗の公開の区分が 期待 であることを確かめる（違えば止める。書き換えない） */
export async function 店舗の公開を確かめる(page: Page, 店舗ID: string, 期待: "公開" | "非公開", what: string): Promise<void> {
  const p = new TenantEditPage(page);
  const st = await p.直接開く(店舗ID);
  if (st !== 200) throw new Error(`${what}: 店舗ID ${店舗ID} の店舗登録画面が開けない（応答 ${st}）`);
  await p.待つ();
  const got = await p.選択("公開");
  if (got !== 期待) throw new Error(`${what}: 店舗ID ${店舗ID} の公開の区分が「${got}」（「${期待}」のはず）。使い回す店舗が書き換えられているので止める`);
}

/** 店舗登録画面で、X公式アカウントURLを url にそろえる（同じなら触らない）。保存したあと開き直して値を確かめる */
export async function 店舗のX公式アカウントURLをそろえる(page: Page, 店舗ID: string, url: string, what: string, issue: Issue, 戻す側 = false): Promise<void> {
  const p = new TenantEditPage(page);
  const open = async () => {
    const st = await p.直接開く(店舗ID);
    if (st !== 200) throw new Error(`${what}: 店舗ID ${店舗ID} の店舗登録画面が開けない（応答 ${st}）`);
    await p.待つ();
  };
  await open();
  const now = await p.値("X公式アカウントURL");
  if (now === url) {
    issue(`使い回す試験支店（店舗ID ${店舗ID}）の X公式アカウントURL が「${url}」であることを店舗登録画面で確かめた`);
    return;
  }
  // 店舗の設定を書き換えるので、ケースの終わりに元の値へ戻す（依頼者 2026-11-15）。戻す側の保存は、ここ（registerRestore を呼ばない）で同じ手順を踏む
  if (!戻す側) {
    const br = page.context().browser();
    if (!br) throw new Error(`${what}: ブラウザを取れず、X公式アカウントURLを戻す手当てができない`);
    registerRestore(`店舗ID ${店舗ID} の X公式アカウントURL`, { 店舗ID, 元の値: now },
      async () => { await withAdminSession(br, SETUP_ADMIN, async (pg) => { await 店舗のX公式アカウントURLをそろえる(pg, 店舗ID, now, `${what}（元へ戻す）`, () => undefined, true); }); },
      async () => withAdminSession(br, SETUP_ADMIN, async (pg) => { const q = new TenantEditPage(pg); await q.直接開く(店舗ID); await q.待つ(); return (await q.値("X公式アカウントURL")) === now; }));
  }
  const r = await p.入れる("X公式アカウントURL", url);
  if (r) throw new Error(`${what}: ${r}`);
  const sent = await p.登録を押す();
  if (!sent.sent) throw new Error(`${what}: ブラウザの入力チェックで送信が止まった（${sent.止めた項目.join(" / ")}）`);
  const errs = await p.エラーの文();
  if (errs.length) throw new Error(`${what}: 店舗登録画面がエラーを表示した（${errs.join(" / ")}）`);
  for (const w of await expectSaved(page, what)) issue(w);
  await open();
  await expect.poll(() => p.値("X公式アカウントURL"), { message: `${what}: 保存後の X公式アカウントURL` }).toBe(url);
  issue(`使い回す試験支店（店舗ID ${店舗ID}）の X公式アカウントURL を「${now || "（空）"}」から「${url}」に変えて保存した（ほかのケースは X公式アカウントURL を確かめない）`);
}

/**
 * 決まった名前（実行の印なし）のタグを、タグ管理に無ければ1度だけ作り、あれば使い回してタグIDを返す（共有のマスタに実行ごとに行を足さない）。
 * タイルは「タグが付いた・公開中の・支店に在庫がある商品」を出すので、前のケース・前の回の商品を外してあれば（試験支店の商品をそろえる）、使い回しても出る商品はこのケースの商品だけ。
 * 同じ名前のタグが2件以上あれば、どれを使うか決められないので止める。
 */
export async function 決まったタグを用意する(page: Page, 名称: string, what: string, issue: Issue): Promise<string> {
  const find = async (): Promise<string | null> => {
    const hits = (await allTagRows(page)).filter((r) => r.名称日 === 名称);
    if (hits.length > 1) throw new Error(`${what}: タグ管理に名称「${名称}」のタグが ${hits.length} 件ある（タグID ${hits.map((h) => h.ID).join("・")}）。どれを使うか決められない`);
    return hits[0]?.ID ?? null;
  };
  const exist = await find();
  if (exist) { issue(`タグは、決まった名前の「${名称}」（タグID ${exist}）を前の回から使い回した`); return exist; }
  return withCreateOnceLock(`tag-${名称}`, async () => {
    const again = await find();
    if (again) { issue(`タグは、決まった名前の「${名称}」（タグID ${again}）を使い回した`); return again; }
    const id = await タグを用意する(page, 名称, what);
    issue(`タグは、決まった名前の「${名称}」（タグID ${id}）をこの回で1度だけ作った（以後の回は使い回す）`);
    return id;
  });
}
