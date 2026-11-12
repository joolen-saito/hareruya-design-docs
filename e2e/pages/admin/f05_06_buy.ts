/**
 * F05-06 の連携ケースが管理画面で確かめる読み取り（買取検索一覧と買取情報編集）。共通の部品（m07_buy.ts・m07_01_list.ts・m07_03_edit.ts）に足す形で、
 * ここにだけセレクタを書く。読むだけ（保存はしない）。
 *
 * 画面の作り（アプリの admin/Purchase/index.twig・detail.twig で確かめた）:
 * - 一覧の買取依頼者氏名は「姓&nbsp;名」、買取詳細は商品名と数量の組の並び＋「申込時買取金額合計」、箱数は数字（＋「箱」）。
 * - 買取情報編集の買取依頼者情報は、都道府県・職業が選択、住所1〜3・E-mail が入力欄。口座情報は銀行名・支店名・口座番号・口座名義が入力欄、口座種別は選択か選択肢。
 * - 選んで買取の明細の「申込時買取価格」は、行の「purchase_list_main__application_price」の欄。
 * - 買取の承諾方法は、自動承諾なら「自動承諾」、そうでなければ「手動承諾」と表示される。
 */
import { expect, Page } from "@playwright/test";
import { M0701ListPage } from "./m07_01_list";
import { M0703EditPage } from "./m07_03_edit";

const OPEN = 30_000;
const norm = (s: string) => s.replace(/ /g, " ").replace(/\s+/g, " ").trim();

/** 買取検索一覧(検索入力)で注文者名を入れて検索する */
export async function 注文者名で検索する(page: Page, 注文者名: string): Promise<M0701ListPage> {
  const list = new M0701ListPage(page);
  await list.open();
  await list.注文者名を入れる(注文者名);
  await list.検索する();
  return list;
}

/** 一覧の行（番号＝買取IDの数字）の、箱数・氏名・買取詳細（商品名と数量の組）・申込時買取金額合計 */
export async function 一覧の行を読む(page: Page, list: M0701ListPage, 番号: string): Promise<{
  行の数: number; 氏名: string; 箱数: string; 買取状況: string; 明細: { 商品名: string; 数量: string }[]; 申込時買取金額合計: string;
}> {
  const rows = (await list.行()).filter((r) => r.番号 === String(Number(番号)));
  const id = Number(番号);
  const 明細 = rows.length === 1
    ? await page.locator(`#result_list_main__purchase_purchase_detail--${id} .row`).evaluateAll((es) => es
      .map((e) => ({ 商品名: (e.querySelector(".col-md-8")?.textContent ?? "").replace(/\s+/g, " ").trim(), 数量: (e.querySelector(".col-md-4")?.textContent ?? "").replace(/\s+/g, " ").trim() }))
      .filter((x) => x.商品名 !== "" && !x.商品名.startsWith("申込時買取金額合計")))
    : [];
  return {
    行の数: rows.length,
    氏名: rows[0] ? norm(rows[0].氏名) : "",
    箱数: rows[0] ? norm(rows[0].箱数) : "",
    買取状況: rows[0] ? norm(rows[0].買取状況) : "",
    明細,
    申込時買取金額合計: rows.length === 1 ? await list.申込時買取金額合計(String(id)) : "",
  };
}

/** 一覧の買取番号のリンクから買取情報編集画面を開く */
export async function 買取情報編集を開く(page: Page, list: M0701ListPage, 番号: string): Promise<M0703EditPage> {
  await list.編集画面を開く(番号);
  const edit = new M0703EditPage(page);
  await edit.読み込みを待つ();
  return edit;
}

/** 買取情報編集の買取依頼者情報 */
export async function 依頼者情報を読む(page: Page): Promise<{ 都道府県: string; 住所1: string; 住所2: string; 住所3: string; メール: string; 職業: string }> {
  const sel = async (id: string) => norm(await page.locator(`#${id} select`).evaluate((s) => (s as HTMLSelectElement).selectedOptions[0]?.textContent ?? ""));
  const inp = async (id: string) => page.locator(`#${id} input`).first().inputValue({ timeout: OPEN });
  await expect(page.locator("#detail_box__pref"), "買取依頼者情報の都道府県").toHaveCount(1, { timeout: OPEN });
  return {
    都道府県: await sel("detail_box__pref"), 住所1: await inp("detail_box__addr01"), 住所2: await inp("detail_box__addr02"),
    住所3: await inp("detail_box__addr03"), メール: await inp("detail_box__email"), 職業: await sel("detail_box__job"),
  };
}

/** 買取情報編集の口座情報 */
export async function 口座情報を読む(page: Page): Promise<{ 銀行名: string; 支店名: string; 口座種別: string; 口座番号: string; 口座名義: string }> {
  const box = page.locator("#edit_customer_info_box__bank_code");
  await expect(box, "口座情報").toHaveCount(1, { timeout: OPEN });
  const v = async (name: string) => box.locator(`[name$="[${name}]"]`).first().inputValue({ timeout: OPEN });
  const type = box.locator('[name$="[accountTypeId]"]');
  const 種別 = (await type.first().evaluate((e) => e.tagName)) === "SELECT"
    ? norm(await type.first().evaluate((s) => (s as HTMLSelectElement).selectedOptions[0]?.textContent ?? ""))
    : await box.locator('input[name$="[accountTypeId]"]:checked').first().inputValue({ timeout: OPEN });
  return { 銀行名: await v("bankCode"), 支店名: await v("branchCode"), 口座種別: 種別, 口座番号: await v("accountNo"), 口座名義: await v("accountHolder") };
}

/** 選んで買取の明細で、商品コードの行の商品名・数量・申込時買取価格 */
export async function 明細の申込時買取価格を読む(page: Page, edit: M0703EditPage, 商品コード: string): Promise<{ 行の数: number; 商品名: string; 数量: string; 申込時買取価格: string }> {
  const rows = (await edit.選んで買取の明細()).filter((r) => r.商品コード === 商品コード);
  if (rows.length !== 1) return { 行の数: rows.length, 商品名: "", 数量: "", 申込時買取価格: "" };
  const price = await page.locator("#buy_main_cards_field_list tr")
    .filter({ has: page.locator('td[id^="purchase_list_main__product_code--"]', { hasText: 商品コード }) })
    .locator('td[id^="purchase_list_main__application_price--"]').first().innerText({ timeout: OPEN });
  return { 行の数: 1, 商品名: rows[0].商品名, 数量: rows[0].数量, 申込時買取価格: norm(price) };
}
