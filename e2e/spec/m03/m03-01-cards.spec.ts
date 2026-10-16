/** M03-01-008・011・015〜018・052: カードを紐づけた商品の、商品名・カード名・言語・プロモ・Foil による検索。 */
import { expect, test } from "@playwright/test";
import { CaseCtx, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { ProductResultPaging } from "../../pages/admin/product_result_paging";
import { ProductSearchPage } from "../../pages/admin/product_search";
import { M0301_ADMIN } from "../../seeds/m03-01";
import "../../seeds/m03-01-cards";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function openFresh(search: ProductSearchPage): Promise<void> {
  await search.open();
  await search.expectNoRetainedSearchConditions();
}

/** 検索画面の選択肢を、表示名で1つだけ選ぶ・外す */
async function setChoiceByLabel(search: ProductSearchPage, field: string, label: string, checked: boolean): Promise<void> {
  const matches = (await search.choiceOptions(field)).filter((o) => o.label === label);
  if (matches.length !== 1) throw new Error(`${field} に「${label}」の選択肢が1つではない: ${JSON.stringify(await search.choiceOptions(field))}`);
  await search.setChecked(field, matches[0].value, checked);
}

async function uncheckAll(search: ProductSearchPage, field: string): Promise<void> {
  for (const o of await search.choiceOptions(field)) if (o.checked) await search.setChecked(field, o.value, false);
  expect(await search.checkedValues(field), `${field} は未選択`).toEqual([]);
}

caseTest("IT-M03-01-008", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  const paging = new ProductResultPaging(page);
  await step(1, () => openFresh(search));
  await step(2, async () => {
    await search.field("product_name").fill("青空テスト商品-008");
  });
  await step(3, () => search.submitAndWaitForResult());
  await expected(async () => {
    const id = notes.get("〔商品ID-M0301-008〕");
    await expect.soft(page.locator(`#ex-product-${id}`), "商品マスター(検索結果)に対象の商品").toBeVisible();
    expect.soft(await paging.totalCount(), "該当件数1件").toBe(1);
    await expect.soft(paging.rows, "結果の行は1件").toHaveCount(1);
  });
});

caseTest("IT-M03-01-011", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  const paging = new ProductResultPaging(page);
  await step(1, () => openFresh(search));
  await step(2, async () => {
    await search.ensureDetailVisible();
    await search.field("card_name").fill("稲妻　カード");
  });
  await step(3, () => search.submitAndWaitForResult());
  await expected(async () => {
    const a = notes.get("〔商品ID-M0301-011A〕");
    const b = notes.get("〔商品ID-M0301-011B〕");
    await expect.soft(page.locator(`#ex-product-${a}`), "稲妻とカードをともに含むカード名の商品Aは表示").toBeVisible();
    await expect.soft(page.locator(`#ex-product-${b}`), "稲妻だけを含むカード名の商品Bは除外").toHaveCount(0);
    await expect.soft(paging.rows, "商品Aだけが表示").toHaveCount(1);
  });
});

/** 015・016: 商品名と言語のチェックで検索し、表示・除外を確かめる */
function languageCase(n: string, languages: string[], shown: string[], hidden: string[]) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    await loginAdmin(page, M0301_ADMIN);
    const search = new ProductSearchPage(page);
    const paging = new ProductResultPaging(page);
    await step(1, () => openFresh(search));
    await step(2, async () => {
      await search.field("product_name").fill(`区分商品-${n}`);
    });
    await step(3, async () => {
      await search.ensureDetailVisible();
      await uncheckAll(search, "language");
      for (const l of languages) await setChoiceByLabel(search, "language", l, true);
      expect((await search.checkedChoices("language")).map((c) => c.label), "チェックした言語").toEqual(languages);
    });
    await step(4, () => search.submitAndWaitForResult());
    await expected(async () => {
      for (const k of shown) await expect.soft(page.locator(`#ex-product-${notes.get(`〔商品ID-M0301-${n}${k}〕`)}`), `商品${k}は表示`).toBeVisible();
      for (const k of hidden) await expect.soft(page.locator(`#ex-product-${notes.get(`〔商品ID-M0301-${n}${k}〕`)}`), `商品${k}は表示されない`).toHaveCount(0);
      await expect.soft(paging.rows, `表示は${shown.join("・")}の${shown.length}件`).toHaveCount(shown.length);
    });
  };
}

caseTest("IT-M03-01-015", languageCase("015", ["日本語", "英語", "その他言語"], ["A", "B", "C"], []));
caseTest("IT-M03-01-016", languageCase("016", ["日本語", "英語"], ["A", "B"], ["C"]));

caseTest("IT-M03-01-017", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  const paging = new ProductResultPaging(page);
  await step(1, () => openFresh(search));
  await step(2, async () => {
    await search.field("product_name").fill("区分商品-017");
  });
  await step(3, async () => {
    await search.ensureDetailVisible();
    await uncheckAll(search, "promotion");
    await uncheckAll(search, "foil");
    await setChoiceByLabel(search, "promotion", "プロモ", true);
    // 正本の「Foil」は、シード表の「Foil 1（Foil）」と、カードCSVの Foil 列の説明「1: 通常」から、画面の「通常」に当たる
    await setChoiceByLabel(search, "foil", "通常", true);
    note("正本のFoil欄の「Foil」は、画面では「通常」（シード表の Foil 1、カードCSVの説明「1: 通常」）。画面の選択肢は「なし・通常・特殊」");
  });
  await step(4, () => search.submitAndWaitForResult());
  await expected(async () => {
    await expect.soft(page.locator(`#ex-product-${notes.get("〔商品ID-M0301-017A〕")}`), "プロモかつFoilの商品Aは表示").toBeVisible();
    await expect.soft(page.locator(`#ex-product-${notes.get("〔商品ID-M0301-017B〕")}`), "プロモ・ノーマルの商品Bは表示されない").toHaveCount(0);
    await expect.soft(page.locator(`#ex-product-${notes.get("〔商品ID-M0301-017C〕")}`), "ノーマル・Foilの商品Cは表示されない").toHaveCount(0);
    await expect.soft(paging.rows, "商品Aだけが表示").toHaveCount(1);
  });
});

caseTest("IT-M03-01-018", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  const paging = new ProductResultPaging(page);
  await step(1, () => openFresh(search));
  await step(2, async () => {
    await search.field("product_name").fill("区分商品-018");
  });
  await step(3, async () => {
    await search.ensureDetailVisible();
    await uncheckAll(search, "promotion");
    await uncheckAll(search, "foil");
  });
  await step(4, () => search.submitAndWaitForResult());
  await expected(async () => {
    for (const k of ["A", "B", "C"])
      await expect.soft(page.locator(`#ex-product-${notes.get(`〔商品ID-M0301-018${k}〕`)}`), `商品${k}は表示`).toBeVisible();
    await expect.soft(paging.rows, "プロモとFoilで絞り込まれず3件").toHaveCount(3);
  });
});

caseTest("IT-M03-01-052", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  const paging = new ProductResultPaging(page);
  await step(1, () => openFresh(search));
  await step(2, async () => {
    await search.ensureDetailVisible();
    await search.field("card_name").fill("M0301-052-ThunderCard");
  });
  await step(3, () => search.submitAndWaitForResult());
  await expected(async () => {
    await expect.soft(page.locator(`#ex-product-${notes.get("〔商品ID-M0301-052A〕")}`), "カード名(英)が一致する商品Aは表示").toBeVisible();
    await expect.soft(page.locator(`#ex-product-${notes.get("〔商品ID-M0301-052B〕")}`), "商品Bは表示されない").toHaveCount(0);
    expect.soft(await paging.totalCount(), "該当件数1件").toBe(1);
  });
});
