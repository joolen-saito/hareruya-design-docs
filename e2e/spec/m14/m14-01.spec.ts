/** M14-01 カード検索（一覧・条件抽出）。正本: cases/M14-01_test_cases.tsv */
import { caseTest, CaseBody, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { CardSearchPage, select2に入れる, 検索欄, 検索条件の入力値, 展開式の選択肢, 展開式を選ぶ } from "../../pages/admin/m14_card";
import { M1401_ADMIN } from "../../seeds/m14-01";

caseTest("IT-M14-01-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const list = new CardSearchPage(page);
  await step(1, async () => { await list.open(); });
  await expected(async () => {
    expect.soft(await list.キーワード.inputValue(), "カード名・テキストの検索条件").toBe("");
    expect.soft(await 検索条件の入力値(page), "入力・選択されている検索条件").toEqual([]);
    expect.soft(await list.行.count(), "表示されているカードの行数").toBe(0);
    expect.soft(await page.getByText(/検索結果：\d+件/).count(), "検索結果の件数表示").toBe(0);
  });
});

caseTest("IT-M14-01-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const list = new CardSearchPage(page);
  let 一回目 = false, 二回目 = true;
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.詳細検索の開閉.click(); await page.waitForTimeout(800); 一回目 = await list.詳細検索.isVisible(); });
  await step(3, async () => { await list.詳細検索の開閉.click(); await page.waitForTimeout(800); 二回目 = await list.詳細検索.isVisible(); });
  await expected(async () => {
    expect.soft(一回目, "最初の押下のあと、検索条件（カラー・マナ・コスト・固有色ほか）が表示されている").toBe(true);
    expect.soft(二回目, "次の押下のあと、検索条件が表示されていない").toBe(false);
  });
});

caseTest("IT-M14-01-003", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const list = new CardSearchPage(page);
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.検索条件を展開する(); });
  await expected(async () => {
    expect.soft(await page.getByText("禁止カードも表示する").count(), "「禁止カードも表示する」の入力項目の数").toBe(0);
  });
});

caseTest("IT-M14-01-004", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const list = new CardSearchPage(page);
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.getByRole("link", { name: "新規登録", exact: true }).click()]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示された画面のアドレス（カード詳細（登録））").toMatch(/\/card\/new$/);
    expect.soft(await page.locator("form#form1").count(), "カード詳細の入力フォーム").toBe(1);
  });
});

caseTest("IT-M14-01-005", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const list = new CardSearchPage(page);
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.getByRole("link", { name: "CSV取り込み", exact: true }).click()]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示された画面のアドレス（カード情報CSVアップロード）").toMatch(/\/card\/csv_upload$/);
  });
});

caseTest("IT-M14-01-021", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const list = new CardSearchPage(page);
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    await list.検索条件を展開する();
    await select2に入れる(page, 検索欄.使用可能フォーマット, "スタンダード", true);
  });
  await expected(async () => {
    const r = await 展開式の選択肢(page, "restriction");
    expect.soft(r.map((x) => x.無効).includes(true), "リーガリティの選択肢に無効（選択できない）のものがある").toBe(false);
    expect.soft(r.find((x) => x.ラベル === "使用可")?.選択, "「使用可」が選択状態").toBe(true);
  });
});

caseTest("IT-M14-01-022", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const list = new CardSearchPage(page);
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.検索条件を展開する(); });
  await expected(async () => {
    const r = await 展開式の選択肢(page, "restriction");
    expect.soft(r.length, "リーガリティの選択肢の数").toBeGreaterThan(0);
    expect.soft(r.every((x) => x.無効), "リーガリティの全選択肢が選択できない状態").toBe(true);
  });
});

caseTest("IT-M14-01-023", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const list = new CardSearchPage(page);
  const 検索 = async (制限: string) => {
    await list.open();
    await list.キーワード.fill(rc("M1401LEGALITY"));
    await list.検索条件を展開する();
    await select2に入れる(page, 検索欄.使用可能フォーマット, "スタンダード", true);
    await 展開式を選ぶ(page, "restriction", 制限);
    await list.検索する();
    return list.表示中のカードID();
  };
  let 使用可: string[] = [], 制限: string[] = [], 禁止: string[] = [];
  await step(1, async () => { 使用可 = await 検索("使用可"); });
  await step(2, async () => { 制限 = await 検索("制限"); });
  await step(3, async () => { 禁止 = await 検索("禁止"); });
  await expected(async () => {
    const id = (x: string) => notes.get(`〔カードID-M1401-共有LEGALITY-${x}〕`);
    expect.soft(使用可, "使用可で表示されたカードID").toEqual([id("A")]);
    expect.soft(制限, "制限で表示されたカードID").toEqual([id("B")]);
    expect.soft(禁止, "禁止で表示されたカードID").toEqual([id("C")]);
  });
});

caseTest("IT-M14-01-027", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const list = new CardSearchPage(page);
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.検索条件を展開する(); });
  await expected(async () => {
    const boxes = page.locator('#admin_search_form input[name^="admin_search_card[cmc"]');
    expect.soft(await boxes.count(), "マナ・コストの入力欄の数").toBe(1);
    expect.soft(await boxes.first().getAttribute("type"), "マナ・コストの入力欄の種類").toBe("text");
    expect.soft(await page.locator('#admin_search_form input[type="number"]').count(), "数値範囲の入力欄の数").toBe(0);
  });
});

caseTest("IT-M14-01-029", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const list = new CardSearchPage(page);
  const 候補: Record<string, string[]> = {};
  const 入力 = async (欄: keyof typeof 検索欄, 語: string) => { 候補[欄] = await select2に入れる(page, 検索欄[欄], 語, false); };
  await list.open();
  await list.検索条件を展開する();
  await step(1, async () => { await 入力("カードタイプ", "試験カードタイプ"); });
  await step(2, async () => { await 入力("サブタイプ", "試験サブタイプ"); });
  await step(3, async () => { await 入力("特殊タイプ", "試験特殊タイプ"); });
  await step(4, async () => { await 入力("カードセット", "試験カードセット"); });
  await step(5, async () => { await 入力("使用可能フォーマット", "試験フォーマット"); });
  await step(6, async () => { await 入力("イラストレーター", "試験イラストレーター"); });
  await step(7, async () => { await 入力("プロモ種別", "試験プロモ種別"); });
  await expected(async () => {
    for (const [欄, 語] of [["カードタイプ", "試験カードタイプ"], ["サブタイプ", "試験サブタイプ"], ["特殊タイプ", "試験特殊タイプ"], ["カードセット", "試験カードセット"],
      ["使用可能フォーマット", "試験フォーマット"], ["イラストレーター", "試験イラストレーター"], ["プロモ種別", "試験プロモ種別"]]) {
      expect.soft((候補[欄] ?? []).some((t) => t.includes(語)), `${欄}の入力欄に「${語}」と一致する候補が表示される（候補: ${(候補[欄] ?? []).join("、")}）`).toBe(true);
    }
  });
});

caseTest("IT-M14-01-030", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const list = new CardSearchPage(page);
  await list.open();
  await step(1, async () => {
    await list.キーワード.fill("Alpha");
    await list.検索条件を展開する();
    await 展開式を選ぶ(page, "color", "白");
    await 展開式を選ぶ(page, "color_identity", "白");
    await 展開式を選ぶ(page, "rarity", "レア");
    await select2に入れる(page, 検索欄.使用可能フォーマット, "スタンダード", true);
    await 展開式を選ぶ(page, "restriction", "使用可");
    await 展開式を選ぶ(page, "foil", "なし");
    await 展開式を選ぶ(page, "frame", "通常");
    expect(await 検索条件の入力値(page), "入力した検索条件が入っている").not.toEqual([]);
  });
  await step(2, async () => { await page.getByText("検索条件をクリア", { exact: true }).click(); await page.waitForTimeout(800); });
  await expected(async () => {
    expect.soft(await 検索条件の入力値(page), "クリア後に入力・選択が残っている検索条件").toEqual([]);
  });
});

function 選択肢を確かめる(欄: string, 見出し: string, 期待: string[]): CaseBody {
  return async ({ page, step, expected }) => {
    await loginAdmin(page, M1401_ADMIN);
    const list = new CardSearchPage(page);
    await step(1, async () => { await list.open(); });
    await step(2, async () => { await list.検索条件を展開する(); });
    let 選択肢: string[] = [];
    await step(3, async () => { 選択肢 = (await 展開式の選択肢(page, 欄)).map((x) => x.ラベル); });
    await expected(async () => {
      expect.soft(選択肢, `${見出し}の選択肢`).toEqual(期待);
    });
  };
}
const 色 = ["白", "青", "黒", "赤", "緑", "無色"];
caseTest("IT-M14-01-073", 選択肢を確かめる("color", "カラー", 色));
caseTest("IT-M14-01-074", 選択肢を確かめる("color_identity", "固有色", 色));
caseTest("IT-M14-01-075", 選択肢を確かめる("foil", "Foil", ["なし", "通常", "特殊"]));
