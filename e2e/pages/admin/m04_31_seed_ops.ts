/**
 * M04-31 棚卸計画・M04-32 在庫編集承認一覧のシードで使う画面操作（グッズ商品の登録と規格の公開）。
 * 共通の部品（M04-17 の uploadGoodsLines）は商品名(英)を商品名(日)と同じにし、原価単価を10に決め打ちしているので、
 * シード表の列の値（商品名(英)・原価単価・価格）を入れられる局所の部品にした。
 * - 商品公開ステータスは、シード表が「2（公開）」と書くが、画面のCSV形式の説明は「1:公開」。シード表の意図（公開）に合わせて
 *   画面の説明で「公開」にあたる値を入れ、注記に残す（依頼者決定 2026-10-22: この補いだけでは条件付きにしない）。
 * - シード表の「表示された確認モーダルでアップロードを確定する」: いまの実装には確認モーダルが無い。出なければそのまま進めて注記に残す
 *   （依頼者決定 2026-10-22: この補いだけでは条件付きにしない）。
 * - 地域別販売制限はシード表どおり0を入れる（取り込みのあとで商品登録編集を保存する操作はしない）。
 */
import { Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";
import { buildGoodsCsv, downloadGoodsCsvTemplate, publishedValue, readExistingSellGroupName, readJapaneseLanguageId } from "./m03_01_goods_csv";
import { readGoodsProductId } from "./m03_01_goods_list_seed";
import { openClassListFromProductEdit } from "./m03_01_product_class";
import { publishImportedClass } from "./m04_02_rc_stock";
import { readSupplyGoodsCategoryId } from "./m04_17_seed_ops";

type Issue = (message: string) => void;

export type GoodsProduct = {
  商品コード: string; 商品名: string; 商品名英: string; 基準価格: string; 販売価格: string; 買取価格: string; 原価単価: string;
};

/**
 * グッズ商品CSV登録で1行を取り込み（雛形の見出しで、シード表の列の値を入れる）、商品マスターで商品コードの行の商品IDを読み、
 * 商品規格一覧から取り込みで作られた規格を開いて公開にする（販売種別は既定・高額商品コードは空・スマレジ連携しない・部門は先頭）。
 * 商品IDを返す。
 */
export async function createGoodsProduct(page: Page, p: GoodsProduct, what: string, onIssue: Issue): Promise<string> {
  const categoryId = await readSupplyGoodsCategoryId(page);
  const template = await downloadGoodsCsvTemplate(page);
  const japaneseLanguageId = await readJapaneseLanguageId(page);
  const sellGroupName = await readExistingSellGroupName(page);
  const published = publishedValue(template, "商品公開ステータス");
  if (published !== "2") {
    onIssue(`${what}: シード表は商品公開ステータスを「2（公開）」と書くが、画面のCSV形式の説明では公開は「${published}」。シード表の意図の「公開」に合わせて ${published} を入れた`);
  }
  const branchPublished = publishedValue(template, "支店の商品公開ステータス");
  if (branchPublished !== "1") throw new Error(`${what}: シード表は支店の商品公開ステータスを「1（公開）」と書くが、画面の説明では公開は「${branchPublished}」。どちらに合わせるか決められない`);
  const csv = buildGoodsCsv(template, [{
    "商品ID": "", "商品コード": p.商品コード, "商品名(日)": p.商品名, "商品名(英)": p.商品名英,
    "言語(ID)": japaneseLanguageId, "商品公開ステータス": published, "支店の商品公開ステータス": branchPublished,
    "基準価格": p.基準価格, "販売価格": p.販売価格, "買取価格": p.買取価格,
    "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": categoryId, "購入グループ名称": sellGroupName,
    "原価単価": p.原価単価, "地域別販売制限": "0", "スマレジ連携フラグ": "0", "スマレジ商品コード": "", "部門ID": "",
  }]);
  await page.goto(adminUrl("/product/product_goods_csv_upload"));
  await page.locator("#upload-form input[type=file]").setInputFiles({ name: `${p.商品コード}-goods.csv`, mimeType: "text/csv", buffer: csv });
  const modal = page.locator(".modal.show").first();
  const navigated = page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 180_000 }).then(() => "結果" as const);
  const confirmShown = modal.waitFor({ state: "visible", timeout: 180_000 }).then(() => "確認" as const);
  navigated.catch(() => undefined);
  confirmShown.catch(() => undefined);
  await page.locator("#upload-button").click();
  if ((await Promise.race([navigated, confirmShown])) === "確認") {
    await modal.locator("button.btn-ec-conversion, button[type=submit]").last().click();
    await navigated;
  } else {
    onIssue(`${what}: グッズ商品CSVのアップロードで確認モーダルは出なかった（いまの実装には無い）。モーダルでの確定をせずに進めた`);
  }
  for (const w of await expectSaved(page, `${what}（グッズ商品CSV登録）`)) onIssue(`${what}: ${w}`);
  const productId = await readGoodsProductId(page, p.商品コード, p.商品名);
  await page.goto(adminUrl(`/product/product/${productId}/edit`));
  await openClassListFromProductEdit(page, productId);
  await publishImportedClass(page, p.商品コード, `${what}（商品規格の登録）`, onIssue);
  return productId;
}
