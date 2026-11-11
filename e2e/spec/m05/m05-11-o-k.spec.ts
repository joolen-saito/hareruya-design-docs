// 取り込み注記: 同じ機能を main 側（別の方）も実装していたため、栗野側の版を別ファイルにした。main に無いケースだけを残している（main にあるケースは main を優先して除いた）。
/** M05-11 受注情報編集（明細の変更と在庫・原価・累計注文金額、ポイント発生、ステータス、キャンセル）。正本: cases/M05-11_test_cases.tsv */
import { Browser, Page, test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { 会員ポイント, 受注, 受注の全項目, 受注明細, 受注明細ID, 商品の在庫 } from "../../db/m05_11";
import { 会員の累計注文金額, 受注のポイント, 受注のポイント履歴, 受注の日付, 商品の在庫値, 在庫変動履歴の詳細, 週間販売数 } from "../../db/m05_11_write";
import { OrderEditPage, OrderItemsEdit, 明細行 } from "../../pages/admin/m05_11_order_edit";
import "../../seeds/m05-11-n-k";
import { 経過日数 } from "../../seeds/m05-11-n-k";
import { M0511_ADMIN_A, 店舗Aの店名 } from "../../seeds/m05-11";

const key = (n: string) => `〔受注番号-M0511-${n}〕`;
const onDialog = (m: string) => test.info().annotations.push({ type: "手順の注記", description: `ダイアログを受け入れた: ${m}` });
async function 開く(browser: Browser, page: Page, no: string): Promise<OrderEditPage> {
  const p = new OrderEditPage(page);
  await p.openByOrderNo(no, await 店舗Aの店名(browser));
  return p;
}
const コード = (n: string, k: string) => rc(`CBM0511-${n}-${k}`);

/** DBで確かめる結果（在庫・総原価・在庫値・受注明細・在庫変動履歴の増減の件数・会員の累計注文金額） */
type 結果 = {
  在庫: Record<string, { 在庫: number; 総原価: number }>; 在庫値: Record<string, string | null>;
  明細: ReturnType<typeof 受注明細>; 履歴: Record<string, number[]>; 累計: number | null;
};
function 読む(no: string, codes: string[], 会員あり: boolean): 結果 {
  const r: 結果 = { 在庫: {}, 在庫値: {}, 明細: 受注明細(no), 履歴: {}, 累計: 会員あり ? 会員の累計注文金額(no) : null };
  for (const c of codes) {
    r.在庫[c] = 商品の在庫(c); r.在庫値[c] = 商品の在庫値(c);
    r.履歴[c] = 在庫変動履歴の詳細(c).filter((h) => !h.理由.includes("M05-11試験データ")).map((h) => h.増減数);
  }
  return r;
}
const 行 = (r: 結果, code: string) => r.明細.find((x) => x.商品コード === code);
const 価格数量 = (r: 結果, code: string): [number, string] | undefined => { const x = 行(r, code); return x ? [Number(x.価格), x.数量] : undefined; };

// ---- 明細の数量を減らす・増やす ----
type 数量ケース = { 番号: string; 変更後: string; 在庫: number; 総原価: number; 受注数量: string; 受注総原価: number; 履歴: number; 累計?: number; ゲスト?: boolean; 原価?: string };
function 数量を変える(c: 数量ケース) {
  return async ({ page, browser, notes, step, expected }: import("../../lib/case").CaseCtx) => {
    await loginAdmin(page, M0511_ADMIN_A);
    const no = notes.get(key(c.番号)), x = コード(c.番号, "X");
    let p!: OrderEditPage;
    let r!: 結果;
    await step(1, async () => { p = await 開く(browser, page, no); });
    await step(2, async () => { await new OrderItemsEdit(page).明細に入れる(x, { 数量: c.変更後 }); });
    await step(3, async () => { await p.登録を押す(onDialog); });
    if (Number(c.変更後) < 3) await step(4, async () => { await page.waitForLoadState("load"); /* 一部キャンセルの確認ダイアログは、登録を押したときに受け入れた（注記に残る） */ });
    await step(Number(c.変更後) < 3 ? 5 : 4, async () => { r = 読む(no, [x], !c.ゲスト); });
    await expected(async () => {
      expect.soft(r.在庫[x].在庫, `商品の在庫（${c.在庫}）`).toBe(c.在庫);
      expect.soft(r.在庫[x].総原価, `商品総原価（${c.総原価}）`).toBe(c.総原価);
      expect.soft([行(r, x)?.数量, Number(行(r, x)?.総原価)], `受注数量・受注総原価（${c.受注数量}・${c.受注総原価}）`).toEqual([c.受注数量, c.受注総原価]);
      expect.soft(r.履歴[x].filter((h) => h === c.履歴).length, `増減数${c.履歴 > 0 ? "+" : ""}${c.履歴}の在庫変動履歴の件数`).toBe(1);
      if (c.累計 !== undefined) expect.soft(r.累計, `会員の累計注文金額（${c.累計}）`).toBe(c.累計);
      expect.soft(価格数量(r, x), `配送商品の価格・数量（1000・${c.受注数量}）`).toEqual([1000, c.受注数量]);
    });
  };
}
caseTest("IT-M05-11-225", 数量を変える({ 番号: "225", 変更後: "2", 在庫: 8, 総原価: 4000, 受注数量: "2", 受注総原価: 1000, 履歴: 1, 累計: 9000 }));
caseTest("IT-M05-11-227", 数量を変える({ 番号: "227", 変更後: "4", 在庫: 6, 総原価: 3000, 受注数量: "4", 受注総原価: 2000, 履歴: -1, ゲスト: true }));
caseTest("IT-M05-11-229", 数量を変える({ 番号: "229", 変更後: "4", 在庫: 8, 総原価: 3200, 受注数量: "4", 受注総原価: 1900, 履歴: -1, 累計: 11000 }));

// ---- 欠品登録（在庫・総原価は変わらない） ----
function 欠品を登録する(n: string) {
  return async ({ page, browser, notes, step, expected }: import("../../lib/case").CaseCtx) => {
    await loginAdmin(page, M0511_ADMIN_A);
    const no = notes.get(key(n)), x = コード(n, "X");
    let p!: OrderEditPage;
    let r!: 結果;
    const 前 = { 在庫: n === "236" ? 7 : 9, 総原価: n === "236" ? 3500 : 3600 };
    await step(1, async () => { p = await 開く(browser, page, no); });
    await step(2, async () => { await 明細行(page, x).locator("button.btn-stockout").click({ timeout: 20_000 }); });
    await step(3, async () => { await 明細行(page, x).locator('input[name$="[stockout]"]').fill("1", { timeout: 20_000 }); });
    await step(4, async () => { await p.登録を押す(onDialog); });
    await step(5, async () => { r = 読む(no, [x], true); });
    await expected(async () => {
      expect.soft([r.在庫[x].在庫, r.在庫[x].総原価], `商品の在庫・商品総原価（${前.在庫}・${前.総原価}のまま）`).toEqual([前.在庫, 前.総原価]);
      expect.soft([行(r, x)?.数量, 行(r, x)?.欠品数量, Number(行(r, x)?.総原価)], "受注数量・欠品数量・受注総原価（2・1・1000）").toEqual(["2", "1", 1000]);
      expect.soft(r.累計, "会員の累計注文金額（10000から9000）").toBe(9000);
      expect.soft(価格数量(r, x), "配送商品の価格・数量（1000・2）").toEqual([1000, "2"]);
    });
  };
}
caseTest("IT-M05-11-236", 欠品を登録する("236"));
caseTest("IT-M05-11-238", 欠品を登録する("238"));

// ---- 明細の削除 ----
function 明細を削除する(n: string, 管理する: boolean, ゲスト: boolean) {
  return async ({ page, browser, notes, step, expected }: import("../../lib/case").CaseCtx) => {
    await loginAdmin(page, M0511_ADMIN_A);
    const no = notes.get(key(n)), x = コード(n, "X"), y = コード(n, "Y");
    let p!: OrderEditPage;
    let r!: 結果;
    let 前値: string | null = null;
    await step(1, async () => { p = await 開く(browser, page, no); 前値 = 商品の在庫値(x); });
    await step(2, async () => { await new OrderItemsEdit(page).削除を押す(x); });
    await step(3, async () => { await new OrderItemsEdit(page).削除を確定する(x); });
    await step(4, async () => { await p.登録を押す(onDialog); });
    await step(5, async () => { await page.waitForLoadState("load"); /* 一部キャンセルの確認ダイアログは、登録を押したときに受け入れた（注記に残る） */ });
    await step(6, async () => { r = 読む(no, [x, y], !ゲスト); });
    await expected(async () => {
      if (管理する) {
        expect.soft(r.在庫[x].在庫, "商品の在庫（7から10）").toBe(10);
        expect.soft(r.履歴[x].filter((h) => h === 3).length, "増減数+3の在庫変動履歴の件数").toBe(1);
      } else {
        expect.soft(r.在庫値[x], `商品の在庫値（操作前の${前値 === null ? "未設定" : 前値}のまま）`).toBe(前値);
      }
      expect.soft(行(r, x), "商品Xの受注明細（削除された）").toBeUndefined();
      if (!ゲスト) expect.soft(r.累計, "会員の累計注文金額（10000から7000）").toBe(7000);
      expect.soft(r.明細.map((m) => `${m.商品コード}・${Number(m.価格)}・${m.数量}`), "配送商品（商品Yの価格1000・数量2だけ）").toEqual([`${y}・1000・2`]);
    });
  };
}
caseTest("IT-M05-11-230", 明細を削除する("230", true, false));
caseTest("IT-M05-11-231", 明細を削除する("231", false, true));

// ---- 商品の追加 ----
function 商品を追加する(n: string, 在庫: number, ゲスト: boolean) {
  return async ({ page, browser, notes, step, expected }: import("../../lib/case").CaseCtx) => {
    await loginAdmin(page, M0511_ADMIN_A);
    const no = notes.get(key(n)), x = コード(n, "X"), y = コード(n, "Y");
    let p!: OrderEditPage;
    let r!: 結果;
    await step(1, async () => { p = await 開く(browser, page, no); });
    await step(2, async () => { await page.locator('a[data-bs-target="#addProduct"]').first().click({ timeout: 20_000 }); });
    await step(3, async () => { await page.locator("#addProduct input[type=text]").first().fill(rc(`組合せ商品M0511-${n}-X`)); await page.locator("#searchProductModalButton").click({ timeout: 20_000 }); });
    await step(4, async () => {
      const row = page.locator("#searchProductModalList tr").filter({ has: page.locator(`option[data-product-code="${x}"]`) });
      await expect(row, `検索結果に商品コード「${x}」`).toHaveCount(1, { timeout: 60_000 });
      await row.locator("select").first().selectOption((await row.locator(`option[data-product-code="${x}"]`).first().getAttribute("value"))!);
      await row.locator("button.add-order-item").click({ timeout: 20_000 });
    });
    await step(5, async () => { await new OrderItemsEdit(page).明細に入れる(x, { 数量: "2" }); });
    await step(6, async () => { await p.登録を押す(onDialog); });
    await step(7, async () => { r = 読む(no, [x], !ゲスト); });
    await expected(async () => {
      expect.soft(r.在庫[x].在庫, `商品の在庫（${在庫 + 2}から${在庫}）`).toBe(在庫);
      expect.soft(価格数量(r, x)?.[1], "追加した商品Xの受注明細の数量").toBe("2");
      expect.soft(r.履歴[x].filter((h) => h === -2).length, "増減数-2の在庫変動履歴の件数").toBe(1);
      if (!ゲスト) expect.soft(r.累計, "会員の累計注文金額（10000から12000）").toBe(12000);
      expect.soft(r.明細.map((m) => `${m.商品コード}・${Number(m.価格)}・${m.数量}`).sort(), "配送商品（商品Yと商品Xの2件。価格1000・数量2）").toEqual([`${y}・1000・2`, `${x}・1000・2`].sort());
    });
  };
}
caseTest("IT-M05-11-233", 商品を追加する("233", 8, true));
caseTest("IT-M05-11-235", 商品を追加する("235", 10, false));

// ---- 合計金額の上限 ----
caseTest("IT-M05-11-241", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const no = notes.get(key("241")), x = コード("241", "X");
  let p!: OrderEditPage;
  let 合計 = "", 明細ID = "", r: ReturnType<typeof 受注明細> = [];
  await step(1, async () => { p = await 開く(browser, page, no); });
  await step(2, async () => { await new OrderItemsEdit(page).明細に入れる(x, { 価格: "10000000000" }); });
  await step(3, async () => { await p.登録を押す(onDialog); });
  await step(4, async () => { 合計 = String(受注の全項目(no).payment_total); 明細ID = 受注明細ID(no)[x]; r = 受注明細(no); });
  await expected(async () => {
    expect.soft(Number(合計), "受注の合計金額（1000のまま）").toBe(1000);
    expect.soft(明細ID, "配送商品ID（更新前のまま）").toBe(notes.get("〔配送商品ID-M0511-241〕"));
    expect.soft(r.map((m) => `${m.商品コード}・${Number(m.価格)}・${m.数量}`), "配送商品（商品X・価格1000・数量1）").toEqual([`${x}・1000・1`]);
  });
});

// ---- ポイント発生 ----
function ポイント発生(n: string, 使用: string, 発生: number, 理由: string) {
  return async ({ page, browser, notes, step, expected }: import("../../lib/case").CaseCtx) => {
    await loginAdmin(page, M0511_ADMIN_A);
    const no = notes.get(key(n));
    let p!: OrderEditPage;
    let 支払 = "", 実際 = -1;
    await step(1, async () => { p = await 開く(browser, page, no); });
    await step(2, async () => { await p.お支払情報を開く(); 支払 = ((await page.locator("#order_Payment option:checked").textContent()) ?? "").trim(); });
    if (n === "242") await step(3, async () => { await p.先頭明細の価格("2010"); });
    await step(n === "242" ? 4 : 3, async () => { await page.locator("#order_spendedPoints").fill(使用, { timeout: 20_000 }); });
    await step(n === "242" ? 5 : 4, async () => { await p.登録を押す(onDialog); });
    await step(n === "242" ? 6 : 5, async () => { 実際 = 受注のポイント(no).発生; });
    await expected(async () => {
      expect.soft(支払, "変更後お支払方法（店頭支払系以外の銀行振込）").toBe("銀行振込");
      expect.soft(実際, `発生ポイント（${理由}）`).toBe(発生);
    });
  };
}
caseTest("IT-M05-11-242", ポイント発生("242", "100", 95, "50から95。(小計2010−使用100)×5%"));
caseTest("IT-M05-11-243", ポイント発生("243", "1000", 0, "50から0。小計1000−使用1000が0以下"));

// ---- ステータス（ゲスト購入） ----
caseTest("IT-M05-11-244", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const no = notes.get(key("244"));
  let p!: OrderEditPage;
  let 前: Record<string, string | null> = {}, 後: Record<string, string | null> = {};
  await step(1, async () => { 前 = 受注の全項目(no); });
  await step(2, async () => { p = await 開く(browser, page, no); });
  await step(3, async () => { await p.ステータスを選ぶ("入金済み"); });
  await step(4, async () => { await p.ステータスを変更する(onDialog); });
  await step(5, async () => { 後 = 受注の全項目(no); });
  await expected(async () => {
    expect.soft(Object.keys(前).filter((k) => 前[k] !== 後[k]), "操作前から値が変わった受注の項目").toEqual([]);
  });
});
caseTest("IT-M05-11-252", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const no = notes.get(key("252"));
  let p!: OrderEditPage;
  let 入金: string | null = null;
  await step(1, async () => { p = await 開く(browser, page, no); });
  await step(2, async () => { await p.ステータスを選ぶ("入金済み"); });
  await step(3, async () => { await p.ステータスを変更する(onDialog); });
  await step(4, async () => { 入金 = 受注の日付(no, "入金日"); });
  await expected(async () => { expect.soft(入金, "受注の入金日（登録された）").not.toBeNull(); });
});

function ステータスで日付が入る(n: string, 変更後: string, 欄: "入金日" | "店頭予約日") {
  return async ({ page, browser, notes, step, expected }: import("../../lib/case").CaseCtx) => {
    await loginAdmin(page, M0511_ADMIN_A);
    const no = notes.get(key(n));
    let p!: OrderEditPage;
    let 日: string | null = null;
    await step(1, async () => { p = await 開く(browser, page, no); });
    await step(2, async () => { await p.ステータスを選ぶ(変更後); });
    await step(3, async () => { await p.ステータスを変更する(onDialog); });
    await step(4, async () => { 日 = 受注の日付(no, 欄); });
    await expected(async () => { expect.soft(日, `受注の${欄}（登録された）`).not.toBeNull(); });
  };
}
caseTest("IT-M05-11-245", ステータスで日付が入る("245", "入金済み", "入金日"));
caseTest("IT-M05-11-251", ステータスで日付が入る("251", "店頭予約", "店頭予約日"));

caseTest("IT-M05-11-212", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const no = notes.get(key("212"));
  let p!: OrderEditPage;
  let メモ: string | null = null;
  await step(1, async () => { p = await 開く(browser, page, no); });
  await step(2, async () => { await p.note.fill("ゲスト保存確認"); });
  await step(3, async () => { await p.受注情報を登録する(onDialog); });
  await step(4, async () => { メモ = 受注(no).ショップ用メモ; });
  await expected(async () => { expect.soft(メモ, "ショップ用メモ欄（エラーなく保存された）").toBe("ゲスト保存確認"); });
});

// ---- キャンセル（255〜272）。DBの確認の期待は、受注日からの経過日数に応じて期間別の販売数が減る列（当日・翌日・3日以内・7日以内・28日以内・90日以内・180日以内・365日以内） ----
const 今日 = (): string => new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
const 減る列 = (日: number): boolean[] => [日 === 0, 日 === 1, 日 <= 3, 日 <= 7, 日 <= 28, 日 <= 90, 日 <= 180, true];
const 列名 = ["当日欄", "翌日欄", "3日以内欄", "7日以内欄", "28日以内欄", "90日以内欄", "180日以内欄", "365日以内欄"];
function キャンセルを確認する(no: string) {
  const 相殺 = Number(no) % 2 === 1, 日 = 経過日数[no];
  return async ({ page, browser, notes, step, expected }: import("../../lib/case").CaseCtx) => {
    await loginAdmin(page, M0511_ADMIN_A);
    const 注文 = notes.get(key(no)), code = rc(`M0511-CB${no}-ITM`);
    let p!: OrderEditPage;
    let キャンセル日: string | null = null, 在庫 = -1, 週: number[] = [], 履歴: { 増減数: number; 変更前在庫: number; 変更後在庫: number; 理由: string }[] = [], 点履歴: number[] = [], 点 = -1;
    await step(1, async () => { p = await 開く(browser, page, 注文); });
    await step(2, async () => { await p.ステータスを選ぶ("キャンセル"); });
    await step(3, async () => { await p.ステータスを変更する(onDialog); });
    await step(4, async () => {
      キャンセル日 = 受注の日付(注文, "キャンセル日"); 在庫 = 商品の在庫(code).在庫; 週 = 週間販売数(code); 点履歴 = 受注のポイント履歴(注文); 点 = 会員ポイント(注文);
      履歴 = 在庫変動履歴の詳細(code).filter((h) => !h.理由.includes("M05-11試験データ"));
    });
    await expected(async () => {
      if (日 === null) {
        expect.soft(キャンセル日, "受注のキャンセル日（2026-08-24のまま）").toBe("2026-08-24");
        expect.soft(在庫, "商品の在庫数（9のまま）").toBe(9);
        expect.soft(週, "商品規格別の週間販売数の各比較欄（すべて5のまま）").toEqual([5, 5, 5, 5, 5, 5, 5, 5]);
        expect.soft(点, "会員の保持ポイント（1000のまま）").toBe(1000);
        expect.soft(点履歴, `本受注のポイント履歴（${相殺 ? "+50と-50の2件" : "+50の1件"}のまま）`).toEqual(相殺 ? [50, -50] : [50]);
        return;
      }
      expect.soft(キャンセル日, "受注のキャンセル日（試験実行日）").toBe(今日());
      expect.soft(在庫, "商品の在庫数（9から10）").toBe(10);
      expect.soft(履歴.filter((h) => h.増減数 === 1 && h.変更前在庫 === 9 && h.変更後在庫 === 10 && h.理由.includes(注文)).length, "本受注のキャンセルによる在庫戻し（変更前9・変更後10・増減1）の履歴の件数").toBe(1);
      expect.soft(週, `商品規格別の週間販売数（${列名.filter((_, i) => 減る列(日)[i]).join("・")}は5から4、ほかは5のまま）`).toEqual(減る列(日).map((d) => (d ? 4 : 5)));
      expect.soft(点履歴.length, "本受注のポイント履歴の件数（削除されて0件）").toBe(0);
      expect.soft(点, `会員の保持ポイント（${相殺 ? "1000のまま" : "1000から950"}）`).toBe(相殺 ? 1000 : 950);
    });
  };
}
