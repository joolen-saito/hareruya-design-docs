/**
 * F03-03 商品詳細検索。正本: cases/F03-03_test_cases.tsv
 *
 * 実装したのは、商品を検索用の外部の試験索引へ反映しなくても成り立つケース（モーダルの開閉・項目・選択肢・カテゴリの階層）と、
 * 2026-11-10 の方針で足した 001・005・025・027（モーダルの表示元・検索後のアドレスだけを確かめ、検索結果の商品には依らない。シードは既存データへの読み替え）。
 * 検索結果の商品を確かめるケース（006〜010・018〜021・023・024・031・035）と DB での準備を含む 007 は実装しない
 * （画面で作った商品は外部の検索索引にすぐ出ず、既存の商品で代えると期待を弱めるため。前回の記録 e2e/review/F03-03_progress_2026-10-29.md）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { FrontDetailSearch } from "../../pages/front/f03_03_detail_search";
import { 共有マスタ } from "../../seeds/f03-03";
import { FrontDetail } from "../../pages/front/f03_02_detail";
import { FrontProductList } from "../../pages/front/f03_01_product_list";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 事前準備: 本店の商品一覧を、保存済み検索条件なし・モーダルが閉じた状態で新しいブラウザセッションに開く */
async function openList(search: FrontDetailSearch): Promise<void> {
  await search.openProductList("/ja");
  expect(await search.モーダルが開いている(), "開始時に商品詳細検索モーダルが閉じている").toBe(false);
}

/** 商品一覧の「詳細検索」を押して、モーダルが開くのを待つ */
async function pressDetailSearch(search: FrontDetailSearch): Promise<void> {
  const 押したもの = await search.詳細検索を押す();
  if (押したもの !== "商品一覧の詳細検索ボタン") note("固定のヘッダーが商品一覧の中の「詳細検索」ボタンを覆って押せなかったため、画面上部の「詳細検索」ボタンを押した");
  await expect(search.モーダル, "商品詳細検索モーダル（開いた状態）").toHaveClass(/is-visible/);
}

// ---- モーダルの開閉 ----

caseTest("IT-F03-03-002", async ({ page, step, expected }) => {
  const search = new FrontDetailSearch(page);
  // 「フッター」はSP版の画面下端のナビゲーションにある。操作できる状態にするため、SP版の画面幅で開く
  await page.setViewportSize({ width: 390, height: 844 });
  await openList(search);
  await expect(search.フッターの詳細検索ボタン(), "フッターを操作できる状態（フッターの詳細検索ボタン）").toBeVisible();
  const 閉じた: Record<string, boolean> = {};
  await step(1, async () => { await pressDetailSearch(search); });
  await step(2, async () => { await search.モーダル外を押す(); 閉じた["モーダル外を押したあと"] = !(await search.開閉後のモーダル()); });
  await step(3, async () => { await pressDetailSearch(search); });
  await step(4, async () => { await search.フッターの詳細検索ボタン().click({ timeout: 30_000 }); 閉じた["フッターの詳細検索ボタンを押したあと"] = !(await search.開閉後のモーダル()); });
  await step(5, async () => { await pressDetailSearch(search); });
  await step(6, async () => { await search.閉じるボタン.click({ timeout: 30_000 }); 閉じた["閉じるボタンを押したあと"] = !(await search.開閉後のモーダル()); });
  await expected(async () => {
    for (const [いつ, v] of Object.entries(閉じた)) expect.soft(v, `${いつ}、商品詳細検索モーダルが閉じている`).toBe(true);
  });
});

// ---- 項目 ----

caseTest("IT-F03-03-003", async ({ page, step, expected }) => {
  const search = new FrontDetailSearch(page);
  await openList(search);
  let 見出し: string[] = [];
  await step(1, async () => { await pressDetailSearch(search); });
  await step(2, async () => { 見出し = await search.項目の見出し(); note(`モーダルの検索条件の見出し: ${見出し.join("、")}`); });
  await expected(async () => {
    expect.soft(見出し.filter((h) => h.includes("カードセット")), "カードセットの見出し").toHaveLength(0);
    // 表示が「カードセット」だけの要素（見出し・ラベル）を探す。カテゴリの選択肢にある名前（開発環境の「その他カードセット」など）は入力項目ではないので含めない
    await expect.soft(search.フォーム.getByText(/^\s*カードセット\s*$/), "モーダルの中の「カードセット」の表示").toHaveCount(0);
    await expect.soft(search.フォーム.locator('[name*="cardset" i], [id*="cardset" i]'), "カードセットの入力項目").toHaveCount(0);
  });
});

caseTest("IT-F03-03-022", async ({ page, step, expected }) => {
  const search = new FrontDetailSearch(page);
  await openList(search);
  const 選択: Record<string, string> = {};
  await step(1, async () => { await pressDetailSearch(search); });
  await step(2, async () => {
    const { from, to } = search.価格の選択欄();
    選択["価格(From)"] = await search.選ばれている表示名(from);
    選択["価格(To)"] = await search.選ばれている表示名(to);
  });
  await expected(async () => {
    expect.soft(選択["価格(From)"], "価格(From)の初期値").toBe("指定しない");
    expect.soft(選択["価格(To)"], "価格(To)の初期値").toBe("指定しない");
  });
});

// ---- 選択肢（共通マスタ） ----

caseTest("IT-F03-03-013", async ({ page, step, expected }) => {
  const search = new FrontDetailSearch(page);
  await openList(search);
  const 第1階層: string[] = [];
  const 第2階層: string[] = [];
  await step(1, async () => { await pressDetailSearch(search); });
  await step(2, async () => {
    第1階層.push(...(await search.カテゴリの選択肢(0)));
    // 第2階層の選択肢は、第1階層で親を選ぶと現れる。表示対象の親を選んで、その直下の選択肢を見る
    await search.カテゴリを選ぶ(0, 共有マスタ.表示対象親カテゴリ);
    第2階層.push(...(await search.カテゴリの選択肢(1)));
    note(`第1階層の選択肢に「${共有マスタ.非表示対象親カテゴリ}」は${第1階層.includes(共有マスタ.非表示対象親カテゴリ) ? "ある" : "ない"}。「${共有マスタ.表示対象親カテゴリ}」を選ぶと第2階層が現れた`);
  });
  await expected(async () => {
    expect.soft(第2階層, `表示対象の親カテゴリ直下の選択肢に「${共有マスタ.表示対象カテゴリ}」が提示される`).toContain(共有マスタ.表示対象カテゴリ);
    expect.soft(第1階層, `第1階層に非表示の親カテゴリ「${共有マスタ.非表示対象親カテゴリ}」が提示されない`).not.toContain(共有マスタ.非表示対象親カテゴリ);
    expect.soft(第1階層, `第1階層に「${共有マスタ.非表示対象カテゴリ}」が提示されない`).not.toContain(共有マスタ.非表示対象カテゴリ);
    expect.soft(第2階層, `第2階層に「${共有マスタ.非表示対象カテゴリ}」が提示されない`).not.toContain(共有マスタ.非表示対象カテゴリ);
  });
});

caseTest("IT-F03-03-014", async ({ page, step, expected }) => {
  const search = new FrontDetailSearch(page);
  await openList(search);
  let 選択肢: string[] = [];
  await step(1, async () => { await pressDetailSearch(search); });
  await step(2, async () => { 選択肢 = await search.カードタイプの選択肢(); note(`カードタイプの選択肢: ${選択肢.join("、")}`); });
  await expected(async () => {
    expect.soft(選択肢, `商品検索に表示する設定の「${共有マスタ.クリーチャー}」が提示される`).toContain(共有マスタ.クリーチャー);
    expect.soft(選択肢, `商品検索に表示しない設定の「${共有マスタ.非表示カードタイプ}」が提示されない`).not.toContain(共有マスタ.非表示カードタイプ);
  });
});

caseTest("IT-F03-03-015", async ({ page, step, expected }) => {
  const search = new FrontDetailSearch(page);
  await openList(search);
  let 選択肢: string[] = [];
  await step(1, async () => { await pressDetailSearch(search); });
  await step(2, async () => { 選択肢 = await search.フォーマットの選択肢(); note(`フォーマットの選択肢: ${選択肢.join("、")}`); });
  await expected(async () => {
    expect.soft(選択肢, `商品検索に表示する設定の「${共有マスタ.フォーマット10}」が提示される`).toContain(共有マスタ.フォーマット10);
    expect.soft(選択肢, `商品検索に表示する設定の「${共有マスタ.フォーマット20}」が提示される`).toContain(共有マスタ.フォーマット20);
    expect.soft(選択肢, `商品検索に表示しない設定の「${共有マスタ.非表示フォーマット}」が提示されない`).not.toContain(共有マスタ.非表示フォーマット);
  });
});

caseTest("IT-F03-03-016", async ({ page, step, expected }) => {
  const search = new FrontDetailSearch(page);
  await openList(search);
  let 選択肢: string[] = [];
  await step(1, async () => { await pressDetailSearch(search); });
  await step(2, async () => { 選択肢 = await search.フォーマットの選択肢(); note(`フォーマットの選択肢（上から）: ${選択肢.join("、")}`); });
  await expected(async () => {
    const i10 = 選択肢.indexOf(共有マスタ.フォーマット10);
    const i20 = 選択肢.indexOf(共有マスタ.フォーマット20);
    expect.soft(i10, `「${共有マスタ.フォーマット10}」の位置（上から）`).toBeGreaterThanOrEqual(0);
    expect.soft(i20, `「${共有マスタ.フォーマット20}」の位置（上から）`).toBeGreaterThanOrEqual(0);
    expect.soft(i10 < i20, "表示順の昇順で「フォーマット10」が「フォーマット20」より上に提示される").toBe(true);
  });
});

caseTest("IT-F03-03-017", async ({ page, step, expected }) => {
  const search = new FrontDetailSearch(page);
  await openList(search);
  let イラストレーター: string[] = [];
  let サブタイプ: string[] = [];
  await step(1, async () => { await pressDetailSearch(search); });
  await step(2, async () => {
    イラストレーター = await search.イラストレーターの選択肢();
    サブタイプ = await search.サブタイプの選択肢();
  });
  await expected(async () => {
    const a = イラストレーター.indexOf(共有マスタ.イラストレーターA);
    const b = イラストレーター.indexOf(共有マスタ.イラストレーターB);
    expect.soft(a, `イラストレーター「${共有マスタ.イラストレーターA}」の位置`).toBeGreaterThanOrEqual(0);
    expect.soft(b, `イラストレーター「${共有マスタ.イラストレーターB}」の位置`).toBeGreaterThanOrEqual(0);
    expect.soft(a < b, "イラストレーターが「Alpha Artist」、「Beta Artist」の順に提示される").toBe(true);
    const sa = サブタイプ.indexOf(共有マスタ.サブタイプA日);
    const sb = サブタイプ.indexOf(共有マスタ.サブタイプB日);
    expect.soft(sa, `サブタイプ（英語名${共有マスタ.サブタイプA英}）の日本語名「${共有マスタ.サブタイプA日}」の位置`).toBeGreaterThanOrEqual(0);
    expect.soft(sb, `サブタイプ（英語名${共有マスタ.サブタイプB英}）の日本語名「${共有マスタ.サブタイプB日}」の位置`).toBeGreaterThanOrEqual(0);
    expect.soft(sa < sb, "サブタイプが英語名の順（AlphaSubtype、BetaSubtype）に、日本語名「んタイプ」、「あタイプ」の順で提示される").toBe(true);
  });
});

// ---- カテゴリの階層 ----

caseTest("IT-F03-03-028", async ({ page, step, expected }) => {
  const search = new FrontDetailSearch(page);
  await openList(search);
  const A = rc("F0303-028-A"), B = rc("F0303-028-B");
  let 開始時の欄数 = 0;
  let 選択後の欄数 = 0;
  let 第2階層: string[] = [];
  await step(1, async () => { await pressDetailSearch(search); });
  await step(2, async () => { 開始時の欄数 = await search.カテゴリ選択欄の数(); });
  await step(3, async () => {
    await search.カテゴリを選ぶ(0, A);
    選択後の欄数 = await search.カテゴリ選択欄の数();
    第2階層 = await search.カテゴリの選択肢(1);
  });
  await expected(async () => {
    expect.soft(開始時の欄数, "開いた直後のカテゴリ選択欄の数（第1階層だけ）").toBe(1);
    expect.soft(選択後の欄数, `「${A}」を選んだあとのカテゴリ選択欄の数（第2階層が現れる）`).toBe(2);
    expect.soft(第2階層, `第2階層の選択肢に「${B}」が提示される`).toContain(B);
  });
});

caseTest("IT-F03-03-029", async ({ page, step, expected }) => {
  const search = new FrontDetailSearch(page);
  await openList(search);
  const A = rc("F0303-029-A");
  let 選択後の欄数 = 0;
  await step(1, async () => { await pressDetailSearch(search); });
  await step(2, async () => { await search.カテゴリを選ぶ(0, A); 選択後の欄数 = await search.カテゴリ選択欄の数(); });
  await expected(async () => {
    expect.soft(選択後の欄数, `子カテゴリを持たない「${A}」を選んだあとのカテゴリ選択欄の数（第1階層だけ）`).toBe(1);
    await expect.soft(search.カテゴリ選択欄(1), "第2階層のカテゴリ選択欄").toHaveCount(0);
  });
});

caseTest("IT-F03-03-030", async ({ page, step, expected }) => {
  const search = new FrontDetailSearch(page);
  await openList(search);
  const [A, B, C] = [rc("F0303-030-A"), rc("F0303-030-B"), rc("F0303-030-C")];
  let 第3階層: string[] = [];
  let 選択後の欄数 = 0;
  await step(1, async () => { await pressDetailSearch(search); });
  await step(2, async () => { await search.カテゴリを選ぶ(0, A); });
  await step(3, async () => {
    await search.カテゴリを選ぶ(1, B);
    選択後の欄数 = await search.カテゴリ選択欄の数();
    第3階層 = await search.カテゴリの選択肢(2);
  });
  await expected(async () => {
    expect.soft(選択後の欄数, `「${B}」を選んだあとのカテゴリ選択欄の数（第3階層が現れる）`).toBe(3);
    expect.soft(第3階層, `第3階層の選択肢に「${C}」が提示される`).toContain(C);
  });
});

caseTest("IT-F03-03-032", async ({ page, step, expected }) => {
  const search = new FrontDetailSearch(page);
  await openList(search);
  const [A, B, C, D] = [rc("F0303-032-A"), rc("F0303-032-B"), rc("F0303-032-C"), rc("F0303-032-D")];
  let 第4階層: string[] = [];
  let 選択後の欄数 = 0;
  await step(1, async () => { await pressDetailSearch(search); });
  await step(2, async () => { await search.カテゴリを選ぶ(0, A); });
  await step(3, async () => { await search.カテゴリを選ぶ(1, B); });
  await step(4, async () => {
    await search.カテゴリを選ぶ(2, C);
    選択後の欄数 = await search.カテゴリ選択欄の数();
    第4階層 = await search.カテゴリの選択肢(3);
  });
  await expected(async () => {
    expect.soft(選択後の欄数, `「${C}」を選んだあとのカテゴリ選択欄の数（第4階層が現れる）`).toBe(4);
    expect.soft(第4階層, `第4階層の選択肢に「${D}」が提示される`).toContain(D);
  });
});

caseTest("IT-F03-03-033", async ({ page, step, expected }) => {
  const search = new FrontDetailSearch(page);
  await openList(search);
  const [A, B] = [rc("F0303-033-A"), rc("F0303-033-B")];
  let 選択後の欄数 = 0;
  await step(1, async () => { await pressDetailSearch(search); });
  await step(2, async () => { await search.カテゴリを選ぶ(0, A); });
  await step(3, async () => { await search.カテゴリを選ぶ(1, B); 選択後の欄数 = await search.カテゴリ選択欄の数(); });
  await expected(async () => {
    expect.soft(選択後の欄数, `子カテゴリを持たない第2階層の「${B}」を選んだあとのカテゴリ選択欄の数（第2階層まで）`).toBe(2);
    await expect.soft(search.カテゴリ選択欄(2), "第3階層のカテゴリ選択欄").toHaveCount(0);
  });
});

caseTest("IT-F03-03-034", async ({ page, step, expected }) => {
  const search = new FrontDetailSearch(page);
  await openList(search);
  const [A, B, C] = [rc("F0303-034-A"), rc("F0303-034-B"), rc("F0303-034-C")];
  let 選択後の欄数 = 0;
  await step(1, async () => { await pressDetailSearch(search); });
  await step(2, async () => { await search.カテゴリを選ぶ(0, A); });
  await step(3, async () => { await search.カテゴリを選ぶ(1, B); });
  await step(4, async () => { await search.カテゴリを選ぶ(2, C); 選択後の欄数 = await search.カテゴリ選択欄の数(); });
  await expected(async () => {
    expect.soft(選択後の欄数, `子カテゴリを持たない第3階層の「${C}」を選んだあとのカテゴリ選択欄の数（第3階層まで）`).toBe(3);
    await expect.soft(search.カテゴリ選択欄(3), "第4階層のカテゴリ選択欄").toHaveCount(0);
  });
});

// ---- 2026-11-10 の方針で足したケース ----

type アドレスの形 = { パス: string; 引数: [string, string][]; 文: string };

/** モーダルの表示元の確認で、その表示元で記録する値 */
type 表示元の結果 = { モーダルが開いた: boolean; 遷移しなかった: boolean };

caseTest("IT-F03-03-001", async ({ page, notes, step, expected }) => {
  const search = new FrontDetailSearch(page);
  const 商品ID = notes.get("〔商品ID-F0303-001〕");
  const 結果: Record<string, 表示元の結果> = {};
  /** 表示元の画面を開き、入口を押してモーダルが画面の上に開くことを記録し、閉じるボタンで閉じる */
  async function 表示元(名前: string, path: string, 幅: "PC" | "SP", 入口: () => ReturnType<FrontDetailSearch["PC版ナビの詳細検索ボタン"]>): Promise<void> {
    await page.setViewportSize(幅 === "SP" ? { width: 390, height: 844 } : { width: 1280, height: 720 });
    const status = await search.画面を開く(path);
    expect(status, `${名前}の応答`).toBeLessThan(400);
    expect(await search.モーダルが開いている(), `${名前}を開いた直後、商品詳細検索モーダルが閉じている`).toBe(false);
    const before = new URL(page.url());
    await search.入口を押す(入口());
    const after = new URL(page.url());
    結果[名前] = {
      モーダルが開いた: await search.モーダルが開いている(),
      遷移しなかった: after.pathname === before.pathname && after.search === before.search,
    };
    await search.閉じるボタン.click({ timeout: 30_000 });
    await search.開閉後のモーダル();
  }
  await step(1, async () => { await 表示元("本店PC版のTOP画面", "/ja", "PC", () => search.PC版ナビの詳細検索ボタン()); });
  await step(2, async () => { await 表示元("本店SP版のTOP画面", "/ja", "SP", () => search.SP版ナビの詳細検索ボタン()); });
  await step(3, async () => { await 表示元("TC大阪支店PC版のTOP画面", "/ja/osaka", "PC", () => search.PC版ナビの詳細検索ボタン()); });
  await step(4, async () => { await 表示元("TC大阪支店SP版のTOP画面", "/ja/osaka", "SP", () => search.SP版ナビの詳細検索ボタン()); });
  await step(5, async () => { await 表示元("本店ECTOP", "/ja", "PC", () => search.詳細検索の入口().first()); });
  await step(6, async () => { await 表示元("支店ECTOP", "/ja/osaka", "PC", () => search.詳細検索の入口().first()); });
  await step(7, async () => { await 表示元("商品一覧画面", "/ja/products/search", "PC", () => search.詳細検索の入口().first()); });
  await step(8, async () => {
    note("商品HQ-001-F0303-001は作らず、本店の商品一覧にある既存の商品（シードの注記）の商品詳細画面で押した。TOP画面とECTOPは同じアドレス（本店 /ja・支店 /ja/osaka）で、TOP画面はPC版・SP版のナビゲーション、ECTOPは見えている「詳細検索」の入口を押した");
    await 表示元("商品詳細画面", `/ja/products/detail/${商品ID}`, "PC", () => search.詳細検索の入口().first());
  });
  await expected(async () => {
    expect.soft(Object.keys(結果), "確かめた表示元の数").toHaveLength(8);
    for (const [名前, r] of Object.entries(結果)) {
      expect.soft(r.モーダルが開いた, `${名前}の上に商品詳細検索モーダルが表示される`).toBe(true);
      expect.soft(r.遷移しなかった, `${名前}から独立した商品詳細検索画面へ遷移しない（アドレスが変わらない）`).toBe(true);
    }
  });
});

caseTest("IT-F03-03-005", async ({ page, notes, step, expected }) => {
  const search = new FrontDetailSearch(page);
  const タグID = notes.get("〔タグID-F0303-005〕");
  const カテゴリID = notes.get("〔カテゴリID-F0303-共有B〕");
  let 結果: アドレスの形 = { パス: "", 引数: [], 文: "" };
  await step(1, async () => {
    expect(await search.画面を開く(`/ja/products/search/tags/${タグID}`), "タグで絞り込んだ商品一覧の応答").toBeLessThan(400);
  });
  await step(2, async () => { await search.入口を押す(search.詳細検索の入口().first()); });
  await step(3, async () => {
    await search.カテゴリを選ぶ(0, 共有マスタ.表示対象親カテゴリ);
    await search.カテゴリを選ぶ(1, 共有マスタ.表示対象カテゴリ);
    await search.Foilを選ぶ("特殊");
    await search.検索する();
  });
  await step(4, async () => {
    結果 = search.アドレス();
    note(`検索後のアドレス: ${結果.文}（Foil「特殊」はFoilの欄の値として送られたものを見る）`);
  });
  await expected(async () => {
    expect.soft(結果.パス, `タグ「T-F0303-005」（タグID ${タグID}）がアドレスのパスに含まれる`).toMatch(new RegExp(`/tags/${タグID}(?:/|$)`));
    expect.soft(結果.パス, `カテゴリ「${共有マスタ.表示対象カテゴリ}」（カテゴリID ${カテゴリID}）がアドレスのパスに含まれる`).toMatch(new RegExp(`/cate/${カテゴリID}(?:/|$)`));
    expect.soft(結果.引数.filter(([k]) => /foil/i.test(k)).map(([, v]) => v), "Foil「特殊」がGETパラメータに含まれる（Foilの欄の値が1つ送られる）").toHaveLength(1);
    expect.soft(結果.引数.some(([k]) => /^(tags|category)(\[|$)/.test(k)), "タグとカテゴリはGETパラメータではなくパスに入る（パラメータに残らない）").toBe(false);
  });
});

caseTest("IT-F03-03-025", async ({ page, notes, step, expected }) => {
  const search = new FrontDetailSearch(page);
  const list = new FrontProductList(page);
  const カードID = notes.get("〔カードID-F0303-025A〕");
  let 結果: アドレスの形 = { パス: "", 引数: [], 文: "" };
  let 開始 = "";
  await step(1, async () => {
    // 並び順「価格(高い順)」のIDは、一覧の並び順のボタン（表示名「価格（高い順）」）から読む
    await search.画面を開く("/ja/products/search");
    const 並び順の欄 = await list.並び順の欄の名前();
    const 並び順ID = await list.並び順のID("価格（高い順）");
    expect(並び順ID, "並び順「価格(高い順)」の番号（一覧の並び順のボタンから読む。正本の表記は半角括弧、画面は全角括弧）").not.toBe("");
    await search.画面を開く(`/ja/products/search?cardId=${カードID}&${並び順の欄}=${並び順ID}&pageno=2`);
    開始 = search.アドレス().文;
    note(`開始時のアドレス: ${開始}`);
  });
  await step(2, async () => { await search.入口を押す(search.詳細検索の入口().first()); });
  await step(3, async () => { await search.商品名の入力欄.fill("F0303-CARRY-025"); await search.検索する(); });
  await step(4, async () => { 結果 = search.アドレス(); note(`検索後のアドレス: ${結果.文}`); });
  await expected(async () => {
    const keys = 結果.引数.map(([k]) => k);
    expect.soft(keys.filter((k) => /^orderby$/i.test(k)), "検索後のアドレスに遷移元の並び順が含まれない").toHaveLength(0);
    expect.soft(keys.filter((k) => /^pageno$/i.test(k)), "検索後のアドレスに遷移元のページ番号が含まれない").toHaveLength(0);
    expect.soft(keys.filter((k) => /^card_?id$/i.test(k)), `検索後のアドレスに遷移元のカードID（${カードID}）が含まれない`).toHaveLength(0);
    expect.soft(結果.引数.some(([, v]) => v === カードID && /card/i.test(結果.文)), "カードIDの値がアドレスに残らない").toBe(false);
  });
});

caseTest("IT-F03-03-027", async ({ page, step, expected }) => {
  const search = new FrontDetailSearch(page);
  let 結果: アドレスの形 = { パス: "", 引数: [], 文: "" };
  await step(1, async () => {
    await search.画面を開く("/ja/products/search");
    await search.入口を押す(search.詳細検索の入口().first());
  });
  await step(2, async () => { await search.商品名の入力欄.fill("F0303-CARRY-027"); await search.検索する(); });
  await step(3, async () => {
    結果 = search.アドレス();
    note(`検索後のアドレス: ${結果.文}。「検索条件」は、商品名・カテゴリ・色などの絞り込みの項目。表示件数・並び順・ページ番号・画面の動作の指定は検索条件に数えない`);
  });
  await expected(async () => {
    const 条件 = 結果.引数.filter(([k]) => !/^(disp_?number|orderby|pageno|mode|pick_up)$/i.test(k));
    expect.soft(条件.map(([k, v]) => `${k}=${v}`), "商品名「F0303-CARRY-027」だけが検索条件としてアドレスに含まれる").toEqual([expect.stringMatching(/^(.*\[)?product(\])?=F0303-CARRY-027$/)]);
    expect.soft(結果.引数.filter(([, v]) => v === ""), "未入力・未選択の検索条件（値が空のもの）がアドレスに含まれない").toHaveLength(0);
  });
});
