/** M16-07 買取価格対応表（編集）。正本: cases/M16-07_test_cases.tsv */
import { Browser, test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin, withAdminSession } from "../../lib/session";
import { registerRestore } from "../../lib/shared_restore";
import { BuyPriceEditPage, 行を控える, 行を戻す, 行が元と同じか, 行の控え } from "../../pages/admin/m16_07_buy_price";
import { M1607_ADMIN } from "../../seeds/m16-07";

// 買取価格対応表は共有のマスタ。試験用の行（識別ID 1607xxxxx）は足さない。
// 010・012・013・014 は、既存の行の更新を試みる（保存されないはずの操作）。万一保存されても戻せるよう、操作の前に画面から行の値を控え、
// ケースの終わりに基盤（lib/shared_restore.ts）が画面で元の値に戻して確かめる（夜に1本だけで流す）。
// 画面に既にある行を使い、値を変えない確かめ方（戻る・入力の誤り・不正な送信）のケースだけを書く。
const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 行の注記 = "シード表の試験用の行（識別ID）は、共有のマスタに足さない決まりのため作らず、一覧にある既存の行を使った";
const 画面で確認の注記 = "手順のDBでの確認は、編集画面を開き直して買取価格を読む形で行った";
/** 共有の既存の行を触る 010・012・013・014 用。書き換える前に行の元の値を控え、ケースの終わりに画面で戻して確かめる登録をする */
function 戻す登録(browser: Browser, 元: 行の控え): void {
  registerRestore(
    `買取価格対応表（識別ID ${元.id}）の行`,
    元,
    async () => { await withAdminSession(browser, M1607_ADMIN, async (page) => { await 行を戻す(new BuyPriceEditPage(page), 元); }); },
    async () => withAdminSession(browser, M1607_ADMIN, async (page) => 行が元と同じか(new BuyPriceEditPage(page), 元)),
  );
}
const 戻す注記 = "既存の行の買取価格を、操作の前に画面から控えた（表示項目も含む）。ケースの終わりに画面で元の値に戻し、同じことを確かめる（途中で更新されてしまった場合の備え）";
/** 「更新」を押し、更新の要求を送ったかと、その応答を控える（ブラウザの入力チェックで送られなかった場合と、サーバーが出し直した場合を見分ける） */
async function 更新を押して控える(page: import("@playwright/test").Page, p: BuyPriceEditPage): Promise<{ 送った: boolean; 応答: number | null }> {
  let 送った = false;
  let 応答: number | null = null;
  const onReq = (r: import("@playwright/test").Request) => { if (r.method() === "POST" && /\/data\/buy_price_list\/\d+\/update/.test(r.url())) 送った = true; };
  const onRes = (r: import("@playwright/test").Response) => { if (r.request().method() === "POST" && /\/data\/buy_price_list\/\d+\/update/.test(r.url()) && 応答 === null) 応答 = r.status(); };
  page.on("request", onReq);
  page.on("response", onRes);
  try { await p.更新を押す(); } finally { page.off("request", onReq); page.off("response", onRes); }
  if (!送った) {
    const msg = await p.買取価格欄.evaluate((e) => (e as HTMLInputElement).validationMessage).catch(() => "");
    note(`「更新」を押したが、更新の要求は送られなかった（ブラウザの入力チェック: ${msg || "読めない"}）`);
  } else note(`更新の要求を送った。応答 ${応答 ?? "なし"}、表示中の画面 ${new URL(page.url()).pathname}`);
  return { 送った, 応答 };
}
const 別の値 = (前: string) => String(Number(前) === 850 ? 851 : 850);

caseTest("IT-M16-07-003", async ({ page, step, expected }) => {
  await loginAdmin(page, M1607_ADMIN);
  const p = new BuyPriceEditPage(page);
  let status = 0;
  await step(1, async () => { status = await p.開く(799999); });
  note("識別ID 799999 が未登録であることは、共有のマスタを触らず、画面で開けないことをもって前提とした");
  await expected(async () => {
    expect.soft(status, "応答の状態（表示されない）").not.toBe(200);
    expect.soft(await p.編集画面か(), "買取価格の入力欄がある").toBe(false);
  });
});

caseTest("IT-M16-07-004", async ({ page, step, expected }) => {
  await loginAdmin(page, M1607_ADMIN);
  const p = new BuyPriceEditPage(page);
  const id = await p.一覧の最初の行のID();
  await step(1, async () => { expect(await p.開く(id), "編集画面の応答").toBe(200); });
  let 入力部品: string[] = [], 表の入力数 = 0;
  await step(2, async () => {
    await expect(p.買取価格欄).toBeVisible();
    入力部品 = await p.見える入力部品の名前();
    表の入力数 = await p.表の中の入力部品.count();
  });
  note(行の注記);
  await expected(async () => {
    expect.soft(await p.表示項目のセル.count(), "NM価格・カード状態・Foil or Promotion Card?の表示欄の数").toBe(3);
    expect.soft(表の入力数, "NM価格・カード状態・Foil or Promotion Card?の欄の中の入力部品の数").toBe(0);
    expect.soft(入力部品, "フォームの中で見える入力部品（買取価格だけ）").toEqual(["buy_price_list_edit[price]"]);
  });
});

caseTest("IT-M16-07-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M1607_ADMIN);
  const p = new BuyPriceEditPage(page);
  const id = await p.一覧の最初の行のID();
  let 更新前 = "", 更新後 = "";
  await step(1, async () => { expect(await p.開く(id), "編集画面の応答").toBe(200); 更新前 = await p.買取価格(); });
  await step(2, async () => { await p.入力する(別の値(更新前)); await p.戻るを押す(); });
  await step(3, async () => { await p.開く(id); 更新後 = await p.買取価格(); });
  note(行の注記 + "。" + 画面で確認の注記);
  await expected(async () => {
    expect.soft(更新後, "戻る操作のあとの買取価格（更新前と同じ）").toBe(更新前);
  });
});

caseTest("IT-M16-07-008", async ({ page, step, expected }) => {
  await loginAdmin(page, M1607_ADMIN);
  const p = new BuyPriceEditPage(page);
  const id = await p.一覧の最初の行のID();
  let 更新前 = "";
  await step(1, async () => { expect(await p.開く(id), "編集画面の応答").toBe(200); 更新前 = await p.買取価格(); });
  await step(2, async () => { await p.入力する(別の値(更新前)); await p.戻るを押す(); });
  note(行の注記);
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移先の画面（買取価格対応表（一覧））").toMatch(/\/data\/buy_price_list\/?$/);
  });
});

caseTest("IT-M16-07-010", async ({ page, browser, step, expected }) => {
  await loginAdmin(page, M1607_ADMIN);
  const p = new BuyPriceEditPage(page);
  const id = await p.一覧の最初の行のID();
  await step(1, async () => { expect(await p.開く(id), "編集画面の応答").toBe(200); 戻す登録(browser, await 行を控える(p, id)); });
  let r = { 送った: false, 応答: null as number | null };
  await step(2, async () => { await p.入力する(""); r = await 更新を押して控える(page, p); });
  note(行の注記 + "。" + 戻す注記);
  await expected(async () => {
    // 「再表示される」は、送った更新の要求にサーバーが編集画面を出し直すこと。送られずに元の画面のままの場合を合格にしない
    expect.soft(r.送った, "更新の要求を送った（ブラウザの入力チェックで止まっていない）").toBe(true);
    expect.soft(r.応答, "更新の要求への応答（転送されずに画面が出し直される）").toBe(200);
    expect.soft(new URL(page.url()).pathname, `識別ID ${id} の買取価格対応表（編集）画面のアドレス`).toMatch(new RegExp(`/data/buy_price_list/${id}/(edit|update)$`));
    expect.soft(await p.編集画面か(), "買取価格対応表（編集）画面が表示されている").toBe(true);
  });
});

caseTest("IT-M16-07-012", async ({ page, browser, step, expected }) => {
  await loginAdmin(page, M1607_ADMIN);
  const p = new BuyPriceEditPage(page);
  const id = await p.一覧の最初の行のID();
  await step(1, async () => { expect(await p.開く(id), "編集画面の応答").toBe(200); 戻す登録(browser, await 行を控える(p, id)); });
  await step(2, async () => { await p.入力欄を文字列入力可能にする(); await p.入力する("abc"); });
  let r = { 送った: false, 応答: null as number | null };
  await step(3, async () => { r = await 更新を押して控える(page, p); });
  note(行の注記 + "。" + 戻す注記);
  await expected(async () => {
    expect.soft(r.送った, "更新の要求を送った").toBe(true);
    expect.soft(r.応答, "更新の要求への応答（転送されずに画面が出し直される）").toBe(200);
    expect.soft(new URL(page.url()).pathname, `識別ID ${id} の買取価格対応表（編集）画面のアドレス`).toMatch(new RegExp(`/data/buy_price_list/${id}/(edit|update)$`));
    expect.soft(await p.編集画面か(), "買取価格対応表（編集）画面が表示されている").toBe(true);
  });
});

caseTest("IT-M16-07-013", async ({ page, browser, step, expected }) => {
  await loginAdmin(page, M1607_ADMIN);
  const p = new BuyPriceEditPage(page);
  const id = await p.一覧の最初の行のID();
  let 更新前 = "", 更新後 = "", 追加の応答 = 0;
  await step(1, async () => { expect(await p.開く(id), "編集画面の応答").toBe(200); 更新前 = await p.買取価格(); 戻す登録(browser, await 行を控える(p, id)); });
  await step(2, async () => { await p.入力する(別の値(更新前)); });
  await step(3, async () => { await p.送信先のIDを変える(799999); });
  await step(4, async () => { await p.更新を押す(); });
  await step(5, async () => {
    await p.開く(id);
    更新後 = await p.買取価格();
    追加の応答 = await p.開く(799999);
  });
  note(行の注記 + "。" + 画面で確認の注記 + "。識別ID 799999 の行が無いことは、その編集画面が開けないことで確かめた。" + 戻す注記);
  await expected(async () => {
    expect.soft(更新後, "元の行の買取価格（更新前のまま）").toBe(更新前);
    expect.soft(追加の応答, "識別ID 799999 の編集画面の応答（行が追加されていない）").not.toBe(200);
  });
});

caseTest("IT-M16-07-014", async ({ page, browser, step, expected }) => {
  await loginAdmin(page, M1607_ADMIN);
  const p = new BuyPriceEditPage(page);
  const id = await p.一覧の最初の行のID();
  let 更新前 = "", 更新後 = "";
  await step(1, async () => { expect(await p.開く(id), "編集画面の応答").toBe(200); 更新前 = await p.買取価格(); 戻す登録(browser, await 行を控える(p, id)); });
  await step(2, async () => { await p.入力する(別の値(更新前)); await p.トークンを変える("なし"); await p.更新を押す(); });
  await step(3, async () => { expect(await p.開く(id), "編集画面の応答").toBe(200); });
  await step(4, async () => { await p.入力する(別の値(更新前)); await p.トークンを変える("invalid-token"); await p.更新を押す(); });
  await step(5, async () => { await p.開く(id); 更新後 = await p.買取価格(); });
  note(行の注記 + "。" + 画面で確認の注記 + "。" + 戻す注記);
  await expected(async () => {
    expect.soft(更新後, "2回の送信後の買取価格（更新前のまま）").toBe(更新前);
  });
});
