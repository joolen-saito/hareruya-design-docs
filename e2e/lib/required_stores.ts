/**
 * 2026-11-17 のアプリの直し ECCUBE_HARERUYA-4094 で、在庫機能の一覧の検索欄の店舗が必須（複数選択・1件以上）になった。
 *   在庫検索一覧（admin_search_stock_list[base_info]）・在庫履歴（admin_stock_history[base_info]）・
 *   在庫編集承認一覧（admin_search_stock_approval_list[base_info]）・
 *   在庫移動・振替検索一覧（admin_search_stock_move_transfer[move_from_base_info]・[move_to_base_info]）・
 *   在庫分割結合検索一覧（admin_search_stock_split_join[store]）・棚卸計画一覧（admin_stock_inventory_plan_list[base_info]）。
 * 空のまま「検索」を押すとブラウザの入力チェックで送られず、画面の移動を待ち続けて止まる（11/18 に M04-33・34 の32件が2晩続けて止まった）。
 *
 * 正本の手順が店舗を指定していない検索（ID や作成日だけで探す）のために、店舗の欄が空のときだけ全店舗を選ぶ。
 * 全店舗を選ぶのは「店舗で絞らない」のと同じ結果になる。選んだら「正本の外の補い」として注記に残す。
 * 店舗の欄に何か選ばれていれば、何もしない（正本どおりに選んだ店舗を変えない）。
 */
import { Locator, test } from "@playwright/test";

/** form の中の select（id で指定）が空なら、空でない選択肢を全部選ぶ。どれかを選んだら true */
export async function selectAllStoresIfEmpty(form: Locator, selectIds: string[], 画面: string): Promise<boolean> {
  const 選んだ欄: string[] = [];
  for (const id of selectIds) {
    const sel = form.locator(`#${id}`);
    if ((await sel.count()) === 0) continue;
    const done = await sel.evaluate((el) => {
      const s = el as HTMLSelectElement;
      if ([...s.selectedOptions].some((o) => o.value !== "")) return false;
      for (const o of [...s.options]) o.selected = o.value !== "";
      s.dispatchEvent(new Event("change", { bubbles: true }));
      const w = window as unknown as { jQuery?: (e: Element) => { trigger: (n: string) => void } };
      w.jQuery?.(s).trigger("change");
      return true;
    });
    if (done) 選んだ欄.push(id);
  }
  if (選んだ欄.length > 0) {
    test.info().annotations.push({
      type: "正本の外の補い",
      description: `${画面}の検索欄の店舗が必須で空だった（2026-11-17 の ECCUBE_HARERUYA-4094 から）ので、全店舗を選んでから検索した（店舗で絞らないのと同じ結果）`,
    });
  }
  return 選んだ欄.length > 0;
}
