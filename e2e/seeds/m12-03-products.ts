/**
 * M12-03 受注売上分析 のシードが使う、カテゴリと商品の用意（2026-11-12 追加。画面の操作）。
 *
 * - カテゴリ: 決まった名前（印 -E2E）で、あれば使い、無ければカテゴリ登録で作る。作ったカテゴリは「フロントの検索で非表示」「支店で非表示」にする
 *   （共有のカテゴリの並びに試験のカテゴリが足されるため、公開側にできるだけ出さない）。カテゴリは消さない（あとの実行で使い回す）。
 * - 商品: 決まった商品コード（印 -E2E）のグッズ商品を、あれば使い、無ければグッズ商品CSV登録で作る。そのあと商品登録編集で、
 *   商品カテゴリをシード表のカテゴリだけにする（CSV登録が入れるカテゴリも外す。未所属の商品はチェックを全部外す）。
 * - 受注明細の商品は、この商品に向ける（DBで、印つきの受注の明細だけを書き換える。商品は書き換えない）。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 商品コードの商品ID } from "../db/m05_06";
import { rcFixed } from "../lib/run_marker";
import { withAdminSession } from "../lib/session";
import { 商品のカテゴリを付け替える } from "../pages/admin/a17_05_setup";
import { CategoryPage, createTopByCsv } from "../pages/admin/category";
import { 子カテゴリを登録する } from "../pages/admin/f03_02_seed_ops";
import { readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";

type Issue = (m: string) => void;

/** カテゴリの名前（正本の名前に印 -E2E） */
export const カテゴリ名 = (正本: string): string => rcFixed(正本);
/** 商品コード（正本の名前に印 -E2E） */
export const 商品コード = (正本: string): string => rcFixed(正本);

/** カテゴリを、あれば使い、無ければ作る（親を指定すると、その子カテゴリ）。カテゴリIDを返す */
export async function カテゴリを用意する(page: Page, 正本: string, 親ID: string | null, what: string, issue: Issue): Promise<{ ID: string; 名: string }> {
  const 名 = カテゴリ名(正本);
  const c = new CategoryPage(page);
  if (親ID) await c.openChildrenOf(親ID); else await c.openTop();
  const found = (await c.rowValues()).filter((r) => r.nameJp === 名);
  if (found.length > 1) throw new Error(`${what}: カテゴリ「${名}」が同じ親の下に ${found.length} 件ある。どれを使うか決められない`);
  if (found.length === 1) return { ID: found[0].id, 名 };
  // 最上位のカテゴリは、カテゴリ管理の最上位の画面に入力欄が無い（アプリのテンプレートは、親を選んだときか編集のときだけ入力欄を出す）ので、
  // カテゴリ登録CSV（画面）で登録する（F03-02 の BASE-CARD が入力欄を待って止まったのと同じ。2026-11-14 の見直し）
  const id = 親ID ? await 子カテゴリを登録する(page, 親ID, 名, what, issue)
    : await createTopByCsv(page, { nameJp: 名, nameEn: 名, frontHide: "1", branchHide: "1" }, `m1203-top-${Date.now()}.csv`, (w) => issue(`${what}: ${w}`));
  if (!親ID) issue(`${what}: 最上位のカテゴリ「${名}」は、カテゴリ管理の最上位の画面に入力欄が無いので、カテゴリ登録CSVで登録した（カテゴリID ${id}）`);
  await c.update(id, { frontHide: true, branchHide: true }, (w) => issue(`${what}: ${w}`));
  issue(`${what}: カテゴリ「${名}」（正本「${正本}」）を作った（カテゴリID ${id}。フロントの検索・支店で非表示）`);
  return { ID: id, 名 };
}

export type 商品の定め = { 記号: string; 正本のコード: string; 名: string; カテゴリID: string[] };

/** 商品を、あれば使い、無ければグッズ商品CSV登録で作り、商品カテゴリを定めのカテゴリだけにする。記号 → 商品ID */
export async function 商品たちを用意する(browser: Browser, defs: 商品の定め[], what: string, issue: Issue): Promise<Record<string, { 商品ID: string }>> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 無い = defs.filter((d) => !商品コードの商品ID(商品コード(d.正本のコード)));
    if (無い.length) {
      const 仮 = await readExistingGoodsChildCategoryId(page);
      await registerGoodsCsv(page, {
        what: `${what}: 商品の登録`, fileName: `m1203-${Date.now()}.csv`, categoryId: 仮,
        lines: 無い.map((d) => ({ code: 商品コード(d.正本のコード), nameJp: d.名, nameEn: d.名 })),
        onWarning: (w) => issue(`${what}: 商品の登録の警告「${w}」`),
      });
      issue(`${what}: 商品 ${無い.map((d) => 商品コード(d.正本のコード)).join("・")} をグッズ商品CSV登録で作った（グッズ配下の既存カテゴリで登録し、次の商品登録編集でカテゴリを付け替える）`);
    }
    const out: Record<string, { 商品ID: string }> = {};
    for (const d of defs) {
      const id = 商品コードの商品ID(商品コード(d.正本のコード));
      if (!id) throw new Error(`${what}: 商品「${商品コード(d.正本のコード)}」を作ったが、商品IDが読めない`);
      await 商品のカテゴリを付け替える(page, id, d.カテゴリID, `${what}: 商品「${商品コード(d.正本のコード)}」`, issue);
      out[d.記号] = { 商品ID: id };
    }
    return out;
  });
}

/** カテゴリを順に用意する（[正本の名前, 親の正本の名前|null]）。正本の名前 → カテゴリ */
export async function カテゴリたちを用意する(browser: Browser, defs: [string, string | null][], what: string, issue: Issue): Promise<Record<string, { ID: string; 名: string }>> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const out: Record<string, { ID: string; 名: string }> = {};
    for (const [名, 親] of defs) out[名] = await カテゴリを用意する(page, 名, 親 ? out[親].ID : null, what, issue);
    return out;
  });
}
