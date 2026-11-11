/**
 * F03-04 カテゴリ一覧（追加分）。正本: cases/F03-04_test_cases.tsv
 *
 * 2026-11-10 の方針（既存データ・画面で作ったデータへの読み替え）で実装したケース: 002〜011・016〜019・023〜025。
 * 最新セット・スタンダード・パイオニア・モダン・レガシー・統率者は既存のカテゴリ（IDは100〜600ではない。統率者の名称は「コマンダー」）を読むだけで使い、
 * その下の子・孫・サプライ・ヴィンテージなどは、固定の試験用の名称（無いときだけ作り、あれば使い回す）で画面（カテゴリ登録CSV）から作った（seeds/f03-04.ts）。
 *
 * 実装しないケース: 020・021・022（「商品一覧に、そのカテゴリに紐づく商品が表示される」ことを確かめる。商品の一覧は検索サービスの索引から出るので、
 * 画面で作った商品はすぐには出ず、既存の商品で代えると期待を弱める）。
 */
import { Locator, Page, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { FrontCategoryListMore, FrontCategoryModal, FrontCategoryNavPc } from "../../pages/front/f03_04_category_more";
import { 入口 } from "../../pages/front/f03_04_category_list";
import { FrontProductList } from "../../pages/front/f03_01_product_list";
import { 試験名 } from "../../seeds/f03-04";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

type Step = (n: number, fn: () => Promise<void>) => Promise<void>;

// ECTOPのカテゴリ一覧では「最新セット」は枠の見出しで、押す対象ではない（最新セットの子カテゴリが、その枠の第一階層として最初から並ぶ）。
const 見出しの注記 = "ECTOPのカテゴリ一覧では「最新セット」は枠の見出しで押せない。子カテゴリが「最新セット」の枠の第一階層として並ぶので、見出しと子カテゴリが並んでいることを確かめて、押す操作に代えた";
const 名 = {
  A: "タルキール：龍嵐録", B: "タルキール：龍嵐録 ブースター・ファン", C: "神話レア＆レア", D: "アンコモン", E: "コモン", F: "【予約販売】FF",
  G: "エルドレインの森 ブースター・ファン", H: "アンコモン", I: "ラヴニカの献身", J: "サプライ", K: "デッキケース", L: "ヴィンテージ",
} as const;
const 最新セット = "最新セット";
const フォーマット = ["スタンダード", "パイオニア", "モダン", "レガシー", "統率者"];
const 読みやすいURL = (page: Page) => decodeURIComponent(page.url());

/** PC版ナビゲーションの「カテゴリ」→「最新セット」→子にマウスを重ねたときの列（002・004） */
async function ナビの確認(page: Page, 入口の値: string, step: Step): Promise<{ 第一列: string[]; 第二列: string[]; 第三列: string[] }> {
  const list = new FrontCategoryListMore(page);
  const nav = new FrontCategoryNavPc(page);
  const r = { 第一列: [] as string[], 第二列: [] as string[], 第三列: [] as string[] };
  await step(1, async () => { expect(await list.ECTOPを開く(入口の値), "ECTOPの応答").toBeLessThan(400); });
  await step(2, async () => { await nav.カテゴリにホバーする(); r.第一列 = await nav.列の名称(1); });
  await step(3, async () => {
    await nav.項目にホバーする(1, 最新セット);
    r.第二列 = await nav.列の名称(2);
    await nav.項目にホバーする(2, 試験名(名.A)); // 事前準備にある孫（タルキール：龍嵐録 ブースター・ファン）も並ぶことを確かめる
    r.第三列 = await nav.列の名称(3);
  });
  return r;
}

caseTest("IT-F03-04-002", async ({ page, step, expected }) => {
  const r = await ナビの確認(page, 入口.本店, step);
  await expected(async () => {
    expect.soft(r.第一列, "PC版ナビゲーションのカテゴリ一覧（最初の列）に「最新セット」が表示される").toContain(最新セット);
    expect.soft(r.第二列, "「最新セット」の子カテゴリ（タルキール：龍嵐録）が次の列に表示される").toContain(試験名(名.A));
    expect.soft(r.第三列, "子カテゴリの配下（タルキール：龍嵐録 ブースター・ファン）がツリーの次の列に表示される").toContain(試験名(名.B));
  });
});

caseTest("IT-F03-04-004", async ({ page, step, expected }) => {
  const r = await ナビの確認(page, 入口.TC大阪支店, step);
  await expected(async () => {
    expect.soft(r.第一列, "支店PC版ナビゲーションのカテゴリ一覧（最初の列）に「最新セット」が表示される").toContain(最新セット);
    expect.soft(r.第二列, "「最新セット」の子カテゴリ（タルキール：龍嵐録）が次の列に表示される").toContain(試験名(名.A));
    expect.soft(r.第三列, "子カテゴリの配下（タルキール：龍嵐録 ブースター・ファン）がツリーの次の列に表示される").toContain(試験名(名.B));
  });
});

async function スマホのモーダル(page: Page, 入口の値: string, step: Step): Promise<{ モーダルが見える: boolean; 見出し: string[]; 名称: string[] }> {
  const modal = new FrontCategoryModal(page);
  const list = new FrontCategoryListMore(page);
  const inModal = new FrontCategoryListMore(page, modal.モーダル);
  const r = { モーダルが見える: false, 見出し: [] as string[], 名称: [] as string[] };
  await step(1, async () => {
    await modal.画面の幅をスマホにする();
    expect(await list.ECTOPを開く(入口の値), "ECTOPの応答").toBeLessThan(400);
  });
  await step(2, async () => {
    await modal.開く();
    r.モーダルが見える = await modal.モーダル.isVisible();
    r.見出し = await inModal.見出し();
    r.名称 = await inModal.第一階層の名称();
  });
  return r;
}

caseTest("IT-F03-04-003", async ({ page, step, expected }) => {
  const r = await スマホのモーダル(page, 入口.本店, step);
  await expected(async () => {
    expect.soft(r.モーダルが見える, "スマホ版ナビゲーションのカテゴリ一覧がモーダルで表示される").toBe(true);
    expect.soft(r.見出し, "モーダルの一覧に「最新セット」の枠がある").toContain(最新セット);
    expect.soft(r.名称, "モーダルの一覧に「スタンダード」がある").toContain("スタンダード");
    expect.soft(r.名称, "モーダルの一覧に「サプライ」がある").toContain(試験名(名.J));
  });
});

caseTest("IT-F03-04-005", async ({ page, step, expected }) => {
  const r = await スマホのモーダル(page, 入口.TC大阪支店, step);
  await expected(async () => {
    expect.soft(r.モーダルが見える, "支店スマホ版ナビゲーションのカテゴリ一覧がモーダルで表示される").toBe(true);
    expect.soft(r.見出し, "モーダルの一覧に「最新セット」の枠がある").toContain(最新セット);
    expect.soft(r.名称, "モーダルの一覧に「スタンダード」がある").toContain("スタンダード");
    expect.soft(r.名称, "モーダルの一覧に「サプライ」がある").toContain(試験名(名.J));
  });
});

async function 一覧の確認(page: Page, 入口の値: string, step: Step): Promise<{ 並び: string[]; 最新: string[]; 形式: string[]; その他: string[] }> {
  const list = new FrontCategoryListMore(page);
  const r = { 並び: [] as string[], 最新: [] as string[], 形式: [] as string[], その他: [] as string[] };
  await step(1, async () => {
    expect(await list.ECTOPを開く(入口の値), "ECTOPの応答").toBeLessThan(400);
    r.並び = await list.枠の並び();
    r.最新 = await list.枠の名称("latest-set");
    r.形式 = await list.枠の名称("formats");
    r.その他 = await list.枠の名称("others");
  });
  return r;
}

caseTest("IT-F03-04-006", async ({ page, step, expected }) => {
  const r = await 一覧の確認(page, 入口.本店, step);
  await expected(async () => {
    expect.soft(r.並び, "ECTOPにカテゴリ一覧の3つの枠（最新セット・フォーマット別・その他）が表示される").toEqual(["latest-set", "formats", "others"]);
    expect.soft(r.形式, "フォーマット別の枠に「スタンダード」「パイオニア」「モダン」「レガシー」が表示される").toEqual(expect.arrayContaining(["スタンダード", "パイオニア", "モダン", "レガシー"]));
    expect.soft(r.その他, "その他の枠に「サプライ」「ヴィンテージ」が表示される").toEqual(expect.arrayContaining([試験名(名.J), 試験名(名.L)]));
    expect.soft(r.最新.length, "最新セットの枠に子カテゴリが表示される（件数）").toBeGreaterThan(0);
  });
});

caseTest("IT-F03-04-007", async ({ page, step, expected }) => {
  const r = await 一覧の確認(page, 入口.TC大阪支店, step);
  await expected(async () => {
    expect.soft(r.並び, "支店ECTOPにカテゴリ一覧の3つの枠（最新セット・フォーマット別・その他）が表示される").toEqual(["latest-set", "formats", "others"]);
    expect.soft(r.形式, "フォーマット別の枠に「スタンダード」「パイオニア」「モダン」「レガシー」が表示される").toEqual(expect.arrayContaining(["スタンダード", "パイオニア", "モダン", "レガシー"]));
    expect.soft(r.その他, "その他の枠に「サプライ」「ヴィンテージ」が表示される").toEqual(expect.arrayContaining([試験名(名.J), 試験名(名.L)]));
    expect.soft(r.最新.length, "最新セットの枠に子カテゴリが表示される（件数）").toBeGreaterThan(0);
  });
});

caseTest("IT-F03-04-008", async ({ page, step, expected }) => {
  const sidebar = new FrontCategoryListMore(page, page.locator(".p-hareruya-category-sidebar"));
  let 見えている = false;
  let 名称: string[] = [];
  await step(1, async () => {
    expect(await sidebar.パスを開く("/ja/products/search"), "商品一覧画面の応答").toBeLessThan(400);
    見えている = await sidebar.root.isVisible();
    名称 = await sidebar.第一階層の名称();
    note("商品ID A〜G の商品の登録・検索サービスへの送信は画面で作れないので、既存の商品で代えた（シードの注記）。商品一覧画面を開くだけで、商品の表示は確かめない");
  });
  await expected(async () => {
    expect.soft(見えている, "商品一覧画面にカテゴリ一覧（左メニュー）が表示される").toBe(true);
    expect.soft(名称, "カテゴリ一覧に最新セットの子カテゴリ（タルキール：龍嵐録）が表示される").toContain(試験名(名.A));
    expect.soft(名称, "カテゴリ一覧に「スタンダード」が表示される").toContain("スタンダード");
  });
});

caseTest("IT-F03-04-009", async ({ page, notes, step, expected }) => {
  const sidebar = new FrontCategoryListMore(page, page.locator(".p-hareruya-category-sidebar"));
  const productId = notes.get("〔商品ID-F0304-共有A〕");
  let 応答 = 0;
  let 見えている = false;
  let 名称: string[] = [];
  await step(1, async () => {
    応答 = await sidebar.パスを開く(`/ja/products/detail/${productId}`);
    見えている = await sidebar.root.isVisible();
    名称 = await sidebar.第一階層の名称();
    note("「F03-04商品詳細確認商品」は、本店の商品一覧の先頭に出る既存の商品（シードの注記）の商品詳細画面で代えた。カテゴリ一覧だけを確かめる");
  });
  await expected(async () => {
    expect.soft(応答, "商品詳細画面の応答").toBeLessThan(400);
    expect.soft(見えている, "商品詳細画面にカテゴリ一覧（左メニュー）が表示される").toBe(true);
    expect.soft(名称, "カテゴリ一覧に最新セットの子カテゴリ（タルキール：龍嵐録）が表示される").toContain(試験名(名.A));
    expect.soft(名称, "カテゴリ一覧に「スタンダード」が表示される").toContain("スタンダード");
  });
});

caseTest("IT-F03-04-010", async ({ page, step, expected }) => {
  const list = new FrontCategoryListMore(page);
  let 最新の子: string[] = [];
  let 標準の子: string[] = [];
  let サプライの子: string[] = [];
  await step(1, async () => { expect(await list.ECTOPを開く(入口.本店), "本店ECTOPの応答").toBeLessThan(400); });
  await step(2, async () => {
    note(見出しの注記);
    expect(await list.見出し(), "カテゴリ一覧に「最新セット」の枠の見出しがある").toContain(最新セット);
    最新の子 = await list.枠の名称("latest-set");
  });
  await step(3, async () => {
    await list.展開する("スタンダード");
    標準の子 = await list.子の名称Of(list.第一階層の子の枠("スタンダード"));
  });
  await step(4, async () => {
    await list.展開する(試験名(名.J));
    サプライの子 = await list.子の名称Of(list.第一階層の子の枠(試験名(名.J)));
  });
  await expected(async () => {
    expect.soft(最新の子, "「最新セット」の子カテゴリ（タルキール：龍嵐録・【予約販売】FF）が展開されている").toEqual(expect.arrayContaining([試験名(名.A), 試験名(名.F)]));
    expect.soft(標準の子, "「スタンダード」を押すと子カテゴリ（エルドレインの森 ブースター・ファン）が展開される").toContain(試験名(名.G));
    expect.soft(サプライの子, "「サプライ」を押すと子カテゴリ（デッキケース）が展開される").toContain(試験名(名.K));
  });
});

caseTest("IT-F03-04-011", async ({ page, step, expected }) => {
  const list = new FrontCategoryListMore(page);
  const r = { 並び: [] as string[], 最新: [] as string[], 形式: [] as string[], その他: [] as string[] };
  await step(1, async () => { expect(await list.ECTOPを開く(入口.本店), "本店ECTOPの応答").toBeLessThan(400); });
  await step(2, async () => {
    r.並び = await list.枠の並び();
    r.最新 = await list.枠の名称("latest-set");
    r.形式 = await list.枠の名称("formats");
    r.その他 = await list.枠の名称("others");
  });
  await expected(async () => {
    expect.soft(r.最新, "「最新セット」の子カテゴリが最新セットカテゴリの枠に表示される").toEqual(expect.arrayContaining([試験名(名.A), 試験名(名.F)]));
    expect.soft(r.形式, "フォーマット別カテゴリの枠に「スタンダード」「パイオニア」「モダン」「レガシー」「統率者」が表示される").toEqual(expect.arrayContaining(フォーマット));
    expect.soft(r.その他, "「サプライ」と「ヴィンテージ」がその他カテゴリの枠に表示される").toEqual(expect.arrayContaining([試験名(名.J), 試験名(名.L)]));
    expect.soft(r.並び, "その他カテゴリの枠がフォーマット別カテゴリの枠の下にある（画面の上からの並び）").toEqual(["latest-set", "formats", "others"]);
  });
});

/** ECTOPで「最新セット」→「タルキール：龍嵐録」→「タルキール：龍嵐録 ブースター・ファン」と開く（016〜019 の手順1〜4） */
async function 孫まで開く(list: FrontCategoryListMore, step: Step): Promise<{ 孫の枠: () => Locator }> {
  let 孫の枠: Locator | null = null;
  await step(1, async () => { expect(await list.ECTOPを開く(入口.本店), "本店ECTOPの応答").toBeLessThan(400); });
  await step(2, async () => {
    note(見出しの注記);
    expect(await list.見出し(), "カテゴリ一覧に「最新セット」の枠の見出しがある").toContain(最新セット);
  });
  await step(3, async () => { await list.展開する(試験名(名.A)); });
  await step(4, async () => { 孫の枠 = await list.子を展開する(list.第一階層の子の枠(試験名(名.A)), 試験名(名.B)); });
  return { 孫の枠: () => 孫の枠! };
}

caseTest("IT-F03-04-016", async ({ page, step, expected }) => {
  const list = new FrontCategoryListMore(page);
  const 開いた = await 孫まで開く(list, step);
  let 子: string[] = [];
  await expected(async () => {
    子 = await list.子の名称Of(開いた.孫の枠());
    expect.soft(子, "親カテゴリ「タルキール：龍嵐録 ブースター・ファン」の下に「神話レア＆レア」「アンコモン」「コモン」が表示される").toEqual(expect.arrayContaining([試験名(名.C), 試験名(名.D), 試験名(名.E)]));
  });
});

caseTest("IT-F03-04-017", async ({ page, notes, step, expected }) => {
  const list = new FrontCategoryListMore(page);
  const 開いた = await 孫まで開く(list, step);
  const parentB = notes.get("〔カテゴリID-F0304-共有B〕");
  await step(5, async () => { await list.子のリンクを押す(開いた.孫の枠(), 試験名(名.C)); });
  await expected(async () => {
    const url = 読みやすいURL(page);
    expect.soft(url, "商品一覧画面へ遷移し、URLが親カテゴリIDを含む").toMatch(new RegExp(`/products/search/cate/${parentB}(\\?|$)`));
    expect.soft(url, "URLが検索パラメータ「rarity[0]=4&rarity[1]=3」を含む").toContain("rarity[0]=4&rarity[1]=3");
  });
});

caseTest("IT-F03-04-018", async ({ page, notes, step, expected }) => {
  const list = new FrontCategoryListMore(page);
  const parentG = notes.get("〔カテゴリID-F0304-共有G〕");
  let 孫の枠: Locator | null = null;
  await step(1, async () => { expect(await list.ECTOPを開く(入口.本店), "本店ECTOPの応答").toBeLessThan(400); });
  await step(2, async () => { await list.展開する("スタンダード"); });
  await step(3, async () => { 孫の枠 = await list.子を展開する(list.第一階層の子の枠("スタンダード"), 試験名(名.G)); });
  await step(4, async () => { await list.子のリンクを押す(孫の枠!, 試験名(名.H)); });
  await expected(async () => {
    const url = 読みやすいURL(page);
    expect.soft(url, "商品一覧画面へ遷移し、URLが親カテゴリIDを含む").toMatch(new RegExp(`/products/search/cate/${parentG}(\\?|$)`));
    expect.soft(url, "URLが検索パラメータ「rarity=2」を含む").toContain("rarity=2");
  });
});

caseTest("IT-F03-04-019", async ({ page, step, expected }) => {
  const list = new FrontCategoryListMore(page);
  const 開いた = await 孫まで開く(list, step);
  const plist = new FrontProductList(page);
  await step(5, async () => { await list.子のリンクを押す(開いた.孫の枠(), 試験名(名.C)); });
  await step(6, async () => {
    await plist.結果を待つ();
    await plist.絞り込みを押す(plist.絞り込みボタン("rarity", "アンコモン"));
    note("URLのレアリティ検索パラメータは、アドレスの「rarity」で始まる引数の値の並びで見た（書き方が rarity=2 でも rarity[]=2 でも、値が2だけになったかを見る）");
  });
  await expected(async () => {
    const rarity = [...new URL(page.url()).searchParams.entries()].filter(([k]) => k.startsWith("rarity")).map(([, v]) => v);
    expect.soft(rarity, "URLのレアリティ検索パラメータの値が「2」だけに変更された（「rarity[0]=4&rarity[1]=3」の4・3が残らない）").toEqual(["2"]);
  });
});

caseTest("IT-F03-04-023", async ({ page, step, expected }) => {
  const list = new FrontCategoryListMore(page);
  let 見えている = false;
  let 説明 = "";
  await step(1, async () => { expect(await list.ECTOPを開く(入口.本店), "本店ECTOPの応答").toBeLessThan(400); });
  await step(2, async () => {
    await list.ヘルプのボタン.hover({ timeout: 30_000 });
    await list.ヘルプの説明.waitFor({ state: "visible", timeout: 5_000 }).catch(() => {});
    見えている = await list.ヘルプの説明.isVisible();
    説明 = 見えている ? ((await list.ヘルプの説明.innerText()) ?? "").replace(/\s+/g, " ").trim() : "";
  });
  await expected(async () => {
    expect.soft(見えている, "フォーマットの説明文が表示される").toBe(true);
    expect.soft(説明, "説明文がフォーマット（デッキ構築や対戦のルール）の説明である").toContain("「フォーマット」とは、デッキ構築や対戦のルールを定めたもの");
  });
});

caseTest("IT-F03-04-024", async ({ page, step, expected }) => {
  const list = new FrontCategoryListMore(page);
  let 見出し: string[] = [];
  let 最新: string[] = [];
  let その他: string[] = [];
  let 本文 = "";
  await step(1, async () => { expect(await list.ECTOPを開く(入口.本店英語版), "英語版のECTOPの応答").toBeLessThan(400); });
  await step(2, async () => {
    note("ECTOPのカテゴリ一覧では「Latest Sets」は枠の見出しで押せない。子カテゴリがその枠の第一階層として並ぶので、見出しと子カテゴリが並んでいることを確かめて、押す操作に代えた");
    見出し = await list.見出し();
    最新 = await list.枠の名称("latest-set");
    その他 = await list.枠の名称("others");
    本文 = await list.root.innerText();
  });
  await expected(async () => {
    expect.soft(見出し, "カテゴリ一覧に「Latest Sets」の枠の見出しがある").toContain("Latest Sets");
    expect.soft(最新, "カテゴリ名として英語名「Tarkir: Dragonstorm」が表示される").toContain("Tarkir: Dragonstorm");
    expect.soft(その他, "カテゴリ名として英語名「Supplies」が表示される").toContain("Supplies");
    expect.soft(本文.includes(試験名(名.A)), "日本語名「タルキール：龍嵐録」がカテゴリ名として表示されない").toBe(false);
    expect.soft(本文.includes(試験名(名.J)), "日本語名「サプライ」がカテゴリ名として表示されない").toBe(false);
  });
});

caseTest("IT-F03-04-025", async ({ page, step, expected }) => {
  const list = new FrontCategoryListMore(page);
  const plist = new FrontProductList(page);
  let 並び順 = "";
  await step(1, async () => { expect(await list.ECTOPを開く(入口.本店), "本店ECTOPの応答").toBeLessThan(400); });
  await step(2, async () => {
    note(見出しの注記);
    expect(await list.見出し(), "カテゴリ一覧に「最新セット」の枠の見出しがある").toContain(最新セット);
  });
  await step(3, async () => { await list.第一階層のリンクを押す(試験名(名.F)); });
  await step(4, async () => {
    await page.locator(".js-product-list-orderby-btn.is-active").first().waitFor({ state: "attached", timeout: 60_000 });
    並び順 = await plist.選ばれている並び順();
    note("「最新セット確認商品」の表示は、検索サービスの索引に出る商品が画面で作れないので確かめない。並び順は、一覧画面の選ばれている並び順の表示で見た");
  });
  await expected(async () => {
    expect.soft(並び順, "商品一覧画面の並び順が色順になっている").toBe("色順");
  });
});
