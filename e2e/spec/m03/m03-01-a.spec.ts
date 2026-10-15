/** M03-01 商品マスター（検索入力）— CSV不要の先行ケース。 */
import { expect } from "@playwright/test";
import { caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import {
  ChoiceObservation, ProductSearchPage, SEARCH_CHOICE_FIELDS, SEARCH_SELECT_FIELDS, SEARCH_TEXT_FIELDS,
} from "../../pages/admin/product_search";
import { M0301_ADMIN } from "../../seeds/m03-01";

const sorted = (items: string[]) => [...items].sort();
type CheckedChoice = Pick<ChoiceObservation, "value" | "label">;

async function openFreshSearch(search: ProductSearchPage, checkPageState = false): Promise<void> {
  await search.open();
  await search.expectNoRetainedSearchConditions();
  if (checkPageState) await search.expectNoRetainedPageState();
}

caseTest("IT-M03-01-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  await step(1, () => openFreshSearch(search, true));
  let status: CheckedChoice[] = [], condition: CheckedChoice[] = [], expensive: CheckedChoice[] = [];
  await step(2, async () => {
    await search.ensureDetailVisible();
    status = await search.checkedChoices("status");
    condition = await search.checkedChoices("card_condition");
    expensive = await search.checkedChoices("expensive");
  });
  await expected(async () => {
    expect.soft(status, "公開状態の初期選択は公開だけ").toEqual([{ value: "1", label: "公開" }]);
    expect.soft(condition, "状態の初期選択はNMだけ").toEqual([{ value: "1", label: "NM" }]);
    expect.soft(expensive, "高額商品を除外するだけが初期選択").toEqual([{ value: "2", label: "高額商品を除外する" }]);
  });
});

caseTest("IT-M03-01-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  await step(1, () => openFreshSearch(search, true));
  const options: Record<string, ChoiceObservation[]> = {};
  await step(2, async () => {
    await search.ensureDetailVisible();
    for (const field of ["status", "rarity", "language", "card_condition", "foil", "frame", "promotion", "order_date"])
      options[field] = await search.choiceOptions(field);
  });
  await expected(async () => {
    const wanted: Record<string, string[]> = {
      status: ["公開", "非公開"],
      rarity: ["コモン", "アンコモン", "レア", "神話レア", "基本土地", "スペシャル", "トークン"],
      language: ["日本語", "英語", "その他言語"],
      card_condition: ["NM", "SP", "MP", "HP", "その他"],
      foil: ["Foil", "ノーマル", "特殊"],
      frame: ["通常", "特殊"],
      promotion: ["プロモ", "ノーマル"],
      order_date: ["昨日", "3日間", "1週間", "1ヶ月", "90日間", "180日間", "365日間"],
    };
    for (const [field, labels] of Object.entries(wanted)) {
      expect.soft(sorted((options[field] ?? []).map((option) => option.label)), `${field} の選択肢`).toEqual(sorted(labels));
      for (const option of options[field] ?? []) {
        expect.soft(option.visible, `${field}「${option.label}」が表示される`).toBe(true);
        expect.soft(option.enabled, `${field}「${option.label}」を選択できる`).toBe(true);
      }
    }
  });
});

caseTest("IT-M03-01-003", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  await step(1, () => openFreshSearch(search));
  let categories: string[] = [], cardsets: string[] = [];
  await step(2, async () => {
    await search.ensureDetailVisible();
    categories = await search.select2Candidates("category_id", "M03カテゴリ");
  });
  await step(3, async () => { cardsets = await search.select2Candidates("cardset", "M03セット"); });
  await expected(async () => {
    expect.soft(sorted(categories), "カテゴリ候補はA/Bの2件だけ").toEqual(["M03カテゴリA", "M03カテゴリB"]);
    expect.soft(sorted(cardsets), "エキスパンション候補はA/Bの2件だけ").toEqual(["M03セットA", "M03セットB"]);
    for (const [field, name, label] of [
      ["category_id", "M03カテゴリA", "〔カテゴリID-M0301-共有A〕"],
      ["category_id", "M03カテゴリB", "〔カテゴリID-M0301-共有B〕"],
      ["cardset", "M03セットA", "〔カードセットID-M0301-共有A〕"],
      ["cardset", "M03セットB", "〔カードセットID-M0301-共有B〕"],
    ]) {
      await expect.soft(search.field(field).locator(`option[value="${notes.get(label)}"]`), `${name} の採番ID`).toContainText(name);
    }
  });
});

caseTest("IT-M03-01-005", async ({ page, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  let initial!: Awaited<ReturnType<ProductSearchPage["detailState"]>>;
  let once!: Awaited<ReturnType<ProductSearchPage["detailState"]>>;
  let twice!: Awaited<ReturnType<ProductSearchPage["detailState"]>>;
  let missingControls: string[] = [];
  await step(1, async () => {
    await openFreshSearch(search);
    missingControls = await search.missingDetailControls();
    initial = await search.detailState();
  });
  await step(2, async () => { await search.toggleDetail(); once = await search.detailState(); });
  await step(3, async () => { await search.toggleDetail(); twice = await search.detailState(); });
  await expected(async () => {
    expect.soft(missingControls, "識別ID 3〜31 は全て開閉領域内").toEqual([]);
    expect.soft(initial.expanded, "初期の開閉ボタン状態は画面表示と一致").toBe(String(initial.visible));
    expect.soft(once.visible, "1回目は反対の表示状態へ切替").toBe(!initial.visible);
    expect.soft(once.expanded, "1回目のボタン状態は画面表示と一致").toBe(String(once.visible));
    expect.soft(twice, "2回目は元の表示状態へ復帰").toEqual(initial);
  });
});

caseTest("IT-M03-01-006", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  await step(1, () => openFreshSearch(search));
  let statusBeforeClear: CheckedChoice[] = [], languageBeforeClear: CheckedChoice[] = [], conditionBeforeClear: CheckedChoice[] = [];
  let expensiveBeforeClear: CheckedChoice[] = [];
  await step(2, async () => {
    await search.ensureDetailVisible();
    await search.field("product_name").fill("青空");
    await search.chooseSelect2("category_id", "M03カテゴリA");
    await search.chooseSelect2("category_id", "M03カテゴリB");
    expect(await search.selectedValues("category_id")).toEqual(sorted([
      notes.get("〔カテゴリID-M0301-共有A〕"), notes.get("〔カテゴリID-M0301-共有B〕"),
    ]));
    await search.setChecked("status", "1", false);
    await search.setChecked("status", "2", true);
    await search.setChecked("language", "2", true);
    await search.setChecked("card_condition", "1", false);
    await search.setChecked("card_condition", "2", true);
    statusBeforeClear = await search.checkedChoices("status");
    languageBeforeClear = await search.checkedChoices("language");
    conditionBeforeClear = await search.checkedChoices("card_condition");
  });
  await step(3, async () => {
    await search.setChecked("expensive", "2", false);
    await search.setChecked("expensive", "1", true);
    expensiveBeforeClear = await search.checkedChoices("expensive");
  });
  await step(4, () => search.clear());
  await expected(async () => {
    expect.soft(statusBeforeClear, "クリア前の公開状態は非公開").toEqual([{ value: "2", label: "非公開" }]);
    expect.soft(languageBeforeClear, "クリア前の言語は英語").toEqual([{ value: "2", label: "英語" }]);
    expect.soft(conditionBeforeClear, "クリア前の状態はSP").toEqual([{ value: "2", label: "SP" }]);
    expect.soft(expensiveBeforeClear, "クリア前は高額商品のみ表示").toEqual([{ value: "1", label: "高額商品のみ表示" }]);
    const state = await search.snapshot();
    for (const field of SEARCH_TEXT_FIELDS) expect.soft(state[field], `${field} はクリア`).toBe("");
    for (const field of SEARCH_SELECT_FIELDS) expect.soft(state[field], `${field} は未選択`).toEqual([]);
    for (const field of SEARCH_CHOICE_FIELDS) {
      const want = field === "status" || field === "card_condition" ? ["1"] : field === "expensive" ? ["2"] : [];
      expect.soft(state[field], `${field} は初期状態`).toEqual(want);
    }
    expect.soft(await search.checkedChoices("status"), "公開状態は『公開』へ復帰").toEqual([{ value: "1", label: "公開" }]);
    expect.soft(await search.checkedChoices("card_condition"), "状態は『NM』へ復帰").toEqual([{ value: "1", label: "NM" }]);
    expect.soft(await search.checkedChoices("expensive"), "『高額商品を除外する』へ復帰").toEqual([{ value: "2", label: "高額商品を除外する" }]);
  });
});
