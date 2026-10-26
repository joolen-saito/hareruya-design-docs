/** M03-01-057: 状態ごとに分けて表示し、在庫数(通販+TC東京)を合算しない。 */
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { ProductResultPaging } from "../../pages/admin/product_result_paging";
import { ProductSearchPage } from "../../pages/admin/product_search";
import { M0301_ADMIN } from "../../seeds/m03-01";
import "../../seeds/m03-01-057";

caseTest("IT-M03-01-057", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  const paging = new ProductResultPaging(page);
  const id = notes.get("〔商品ID-M0301-057〕");
  let rows: Awaited<ReturnType<ProductResultPaging["classRows"]>> = [];
  await step(1, async () => {
    await search.open();
    await search.expectNoRetainedSearchConditions();
  });
  await step(2, async () => {
    await search.field("product_name").fill("状態別表示商品-057");
  });
  await step(3, async () => {
    await search.ensureDetailVisible();
    for (const o of await search.choiceOptions("card_condition")) await search.setChecked("card_condition", o.value, ["NM", "SP", "MP", "HP"].includes(o.label));
    expect((await search.checkedChoices("card_condition")).map((c) => c.label), "状態はNM・SP・MP・HP").toEqual(["NM", "SP", "MP", "HP"]);
  });
  await step(4, () => search.submitAndWaitForResult());
  await step(5, async () => {
    rows = await paging.classRows(id);
  });
  await expected(async () => {
    const byCondition = Object.fromEntries(rows.map((r) => [r.condition, r.mainStock]));
    expect.soft(rows.map((r) => r.condition).sort(), "状態NM・SP・MP・HPの4行に分かれて表示").toEqual(["HP", "MP", "NM", "SP"]);
    expect.soft(byCondition, "在庫数(通販+TC東京)はNM行1・SP行2・MP行3・HP行4").toEqual({ NM: "1", SP: "2", MP: "3", HP: "4" });
    expect.soft(rows.filter((r) => r.mainStock === "10"), "4状態を合算した10の行は表示されない").toEqual([]);
  });
});
