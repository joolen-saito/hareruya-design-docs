/**
 * M03-33 セール用高額商品価格変更CSV登録（その4）。正本: cases/M03-33_test_cases.tsv
 * 実装したのは、1つの商品に規格が2つあるときのタグの入れ替え・全削除（007・008）と、同じ商品コードの商品が2件あるときの無更新（044）。
 * 取込ファイルは画面の雛形の見出し行の下に正本のデータ行を入れる（その他の補いは seeds/m03-33-d.ts の冒頭）。期待結果は正本どおり。
 * 判定済みのケースの指紋を変えないため、別のファイルにした。
 */
import { Page, test } from "@playwright/test";
import { 商品規格の状態 } from "../../db/m03_32_high_price";
import { 商品のタグ } from "../../db/m03_13_x";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { HighPriceCsvUploadPage } from "../../pages/admin/m03_32_high_price_csv";
import { M0333_ADMIN, m0333FilePath } from "../../seeds/m03-33";
import "../../seeds/m03-33-d";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function open(page: Page): Promise<HighPriceCsvUploadPage> {
  await loginAdmin(page, M0333_ADMIN);
  const u = new HighPriceCsvUploadPage(page, "セール用高額商品価格変更");
  await u.open();
  return u;
}

/** ファイルを選んで「CSVファイルのアップロード」を押し、画面上部のメッセージを返す */
async function importFile(u: HighPriceCsvUploadPage, file: string): Promise<string> {
  await u.choose(m0333FilePath(file));
  expect(await u.chosenNames(), "取込ファイルの欄で選ばれているファイル").toEqual([file]);
  const r = await u.submit();
  if (!r.sent) note(`「CSVファイルをアップロード」を押すと、ブラウザの入力チェックが送信を止めた（${r.止めた項目.join(" / ")}）`);
  const m = await u.messages();
  note(`押したあとの画面上部のメッセージ: 成功「${m.成功.join(" / ") || "なし"}」・警告「${m.警告.join(" / ") || "なし"}」・エラー「${m.エラー.join(" / ") || "なし"}」`);
  return [...m.成功, ...m.警告, ...m.エラー].join(" / ");
}

function stateOf(id: string): NonNullable<ReturnType<typeof 商品規格の状態>> {
  const s = 商品規格の状態(id);
  expect(s, `商品規格ID ${id} の商品規格`).not.toBeNull();
  return s!;
}

caseTest("IT-M03-33-007", async ({ page, notes, step, expected }) => {
  const productId = notes.get("〔商品ID-M0333-007〕");
  note(`取込前（DBの参照）: 商品のタグ ${商品のタグ(productId).join(",")}・規格A ${notes.get("〔商品規格ID-M0333-007A〕")}・規格B ${notes.get("〔商品規格ID-M0333-007B〕")}`);
  let u!: HighPriceCsvUploadPage;
  await step(1, async () => { u = await open(page); });
  await step(2, async () => { await importFile(u, "tags_replace-007.csv"); });
  let tags: string[] = [];
  await step(3, async () => { tags = 商品のタグ(productId); note(`取込後（DBの参照）: 商品全体のタグ（番号の順） ${tags.join(",") || "なし"}`); });
  await expected(async () => {
    expect.soft(tags.includes("1"), "取込前のタグID 1が削除されている").toBe(false);
    expect.soft(tags, "商品全体のタグがID 2とID 3だけ（CSV指定順の2,3。DBは番号の順に読む）").toEqual(["2", "3"]);
  });
});

caseTest("IT-M03-33-008", async ({ page, notes, step, expected }) => {
  const productId = notes.get("〔商品ID-M0333-008〕");
  note(`取込前（DBの参照）: 商品のタグ ${商品のタグ(productId).join(",")}`);
  let u!: HighPriceCsvUploadPage;
  await step(1, async () => { u = await open(page); });
  await step(2, async () => { await importFile(u, "tags_empty-008.csv"); });
  let tags: string[] = [];
  await step(3, async () => { tags = 商品のタグ(productId); note(`取込後（DBの参照）: 商品のタグ ${tags.join(",") || "なし"}`); });
  await expected(async () => {
    expect.soft(tags, "商品に登録されていたタグがすべて削除され、登録タグが0件").toEqual([]);
  });
});

caseTest("IT-M03-33-044", async ({ page, notes, step, expected }) => {
  const a = notes.get("〔商品規格ID-M0333-044A〕");
  const b = notes.get("〔商品規格ID-M0333-044B〕");
  const beforeA = stateOf(a);
  const beforeB = stateOf(b);
  note(`取込前（DBの参照）: A ${beforeA.商品コード}・${beforeA.販売価格}/${beforeA.買取価格}/${beforeA.セール}、B ${beforeB.商品コード}・${beforeB.販売価格}/${beforeB.買取価格}/${beforeB.セール}`);
  await step(1, async () => { const u = await open(page); await importFile(u, "duplicate_product_code-044.csv"); });
  let afterA!: ReturnType<typeof stateOf>;
  let afterB!: ReturnType<typeof stateOf>;
  await step(2, async () => {
    afterA = stateOf(a); afterB = stateOf(b);
    note(`取込後（DBの参照）: A ${afterA.販売価格}/${afterA.買取価格}/${afterA.セール}、B ${afterB.販売価格}/${afterB.買取価格}/${afterB.セール}`);
  });
  await expected(async () => {
    expect.soft(afterA.商品コード, "2件とも同じ商品コード").toBe(afterB.商品コード);
    expect.soft([afterA.販売価格, afterA.買取価格, afterA.セール], "商品Aの販売価格・買取価格・セールが更新されない").toEqual(["1500", "600", false]);
    expect.soft([afterB.販売価格, afterB.買取価格, afterB.セール], "商品Bの販売価格・買取価格・セールが更新されない").toEqual(["1500", "600", false]);
    expect.soft(afterA.全項目, "商品Aの商品規格が更新されない（全項目が取込前と同じ）").toBe(beforeA.全項目);
    expect.soft(afterB.全項目, "商品Bの商品規格が更新されない（全項目が取込前と同じ）").toBe(beforeB.全項目);
  });
});
