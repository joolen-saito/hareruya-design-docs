/**
 * F01-02 支店ECTOP のうち、共有の設定（支店共通のレイアウトのブロックの並び・本店のトップページのレイアウト・固定のフォーマット別特集タグ）を
 * 書き換えて確かめ、ケースの終わりに画面で戻すケース。正本: cases/F01-02_test_cases.tsv
 * シード: seeds/f01-02-shared.ts（書き換える直前に全部を控え、ケースの終わりに戻して、開き直して全部が控えと同じかを確かめる。lib/shared_restore.ts）。
 * 夜の1本流し（E2E_ALLOW_SHARED=1）でだけ流す。
 *
 * 解釈:
 * - 支店は、決まった印の試験支店1つを全部のケースで使う（試験用の店舗は1度だけ作って使い回す。依頼者決定 2026-11-11）。
 *   ブロックの並びは支店共通の1件なので、どの支店で開いても同じ画面になる。
 * - ブロック名・ブロックの文・カテゴリ名・カードセット名・商品名には実行の印が付く（表示用HTMLの値とリンクURLは正本の値のまま）。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { 画面幅, BranchTopPage } from "../../pages/front/f01_02_branch";
import { BranchSharedParts } from "../../pages/front/f01_02_branch_shared";
import {
  おすすめバナーのURL, カードセットの一覧のアドレス, カードセットの表示用HTML, カテゴリの一覧のアドレス, カテゴリの表示用HTML, フォーマット別特集タグ,
  フォーマット別特集タグの名称, ブロックの枠, 印つき, 試験支店URL,
} from "../../seeds/f01-02-shared";

const note = (m: string) => test.info().annotations.push({ type: "手順の注記", description: m });
const 支店の注記 = "支店は、決まった印の試験支店（全部のケースで同じ）を使った。ブロックの並びは支店共通の1件なので、どの支店で開いても同じ画面になる";

/** 支店ECTOPを開いて、支店ECTOPの画面であることを確かめる（手順「支店ECTOPを開く」） */
async function 開く(page: import("@playwright/test").Page): Promise<void> {
  const top = new BranchTopPage(page);
  const status = await top.open(試験支店URL);
  if (status >= 400) note(`支店ECTOPの応答が ${status} だった`);
  await top.開いている();
}

// ---- 047 タイル未割当区画 ----

caseTest("IT-F01-02-047", async ({ page, step, expected, capture }) => {
  const parts = new BranchSharedParts(page);
  let tiles: Awaited<ReturnType<BranchSharedParts["タイルを読む"]>> = [];
  await step(1, async () => { await 開く(page); });
  await step(2, async () => {
    tiles = await parts.タイルを読む();
    if (tiles.length >= 4) { await parts.タイル(3).scrollIntoViewIfNeeded(); await capture("割り当てのない区画（下段左）のタイル"); }
  });
  await expected(async () => {
    const names = [...フォーマット別特集タグの名称().entries()];
    const 見出したち = names.map(([, n]) => `${n.replace(/特集/g, "")}のカード`);
    expect.soft(tiles.length, "タイルの数（上段右・中段左・中段右・下段左の4区画）").toBe(4);
    expect.soft(tiles.slice(0, 3).map((t) => t.見出し), "割り当てのある3区画（上段右・中段左・中段右）の見出し（ピックアップ商品）").toEqual(["ピックアップ商品", "ピックアップ商品", "ピックアップ商品"]);
    expect.soft(見出したち.includes(tiles[3]?.見出し ?? ""), `割り当てのない区画（下段左）のタイルの見出し「${tiles[3]?.見出し ?? "（タイルが無い）"}」が、フォーマット別特集タグ（${見出したち.join("・")}）のタイルの見出しである`).toBe(true);
    const ids = Object.values(フォーマット別特集タグ).join("|");
    expect.soft(tiles[3]?.もっと見るのリンク ?? "", "割り当てのない区画のタイルの「もっと見る」のリンク先が、フォーマット別特集タグの商品一覧").toMatch(new RegExp(`/products/search/tags/(${ids})(?:[?#]|$)`));
    expect.soft(tiles[3]?.商品の数 ?? 0, "割り当てのない区画のタイルの商品カードの数").toBeGreaterThan(0);
  });
  note(支店の注記);
  note("割り当てのない区画は、シードが試験支店の下段左（区画4）のタイルの行を DB で消して作った。タイルは区画の順（上段右・中段左・中段右・下段左）に並ぶので、4つめのタイルを割り当てのない区画として確かめた");
  note("フォーマット別特集のタイルの見出しは、タグの名称から「特集」を除いた名前に「のカード」を付けたもの（画面の作り）");
});

// ---- 058・060 アイテムを探す ----

caseTest("IT-F01-02-058", async ({ page, step, expected }) => {
  const parts = new BranchSharedParts(page);
  const 区画 = parts.アイテムを探すの区画;
  await step(1, async () => { await 開く(page); });
  await step(2, async () => { await 区画.first().scrollIntoViewIfNeeded().catch(() => note("見出しが「アイテムを探す」の区画が見つからなかった")); });
  await expected(async () => {
    await expect.soft(区画, "見出しが「アイテムを探す」の区画の数").toHaveCount(1);
    await expect.soft(parts.ブロックの枠(ブロックの枠("058")), "「アイテムを探す」の区画が、支店共通のレイアウトに置いたシードのブロック").toBeVisible();
    await expect.soft(BranchSharedParts.項目(区画), "アイテムを探すの項目の数").toHaveCount(3);
    for (const i of [1, 2, 3]) await expect.soft(区画.getByRole("link", { name: 印つき(`F0102-058リンク${i}`), exact: true }), `アイテムを探すの項目「${印つき(`F0102-058リンク${i}`)}」`).toBeVisible();
  });
  note(支店の注記);
  note("元の「アイテムを探す（支店）」のブロックも項目が3件あるので、項目の数に加えて、表示された区画がシードの置いたブロック（自ケースのリンク3件）であることを確かめた");
});

caseTest("IT-F01-02-060", async ({ page, step, expected }) => {
  const parts = new BranchSharedParts(page);
  const A = 印つき("支店アイテム検索ブロック-060");
  const B = 印つき("本店アイテム検索ブロック-060");
  await step(1, async () => { await 開く(page); });
  await step(2, async () => { await parts.ブロックの枠(ブロックの枠("060a")).scrollIntoViewIfNeeded().catch(() => note("支店アイテム検索ブロックが見つからなかった")); });
  await expected(async () => {
    await expect.soft(page.getByText(A, { exact: true }), `支店共通として置いた「${A}」が表示される`).toBeVisible();
    await expect.soft(page.getByText(B, { exact: true }), `本店専用の「${B}」は表示されない`).toHaveCount(0);
    await expect.soft(parts.ブロックの枠(ブロックの枠("060b")), "本店アイテム検索ブロックの外枠が支店ECTOPに無い").toHaveCount(0);
  });
  note(支店の注記);
  note("正本の「テスト支店A-060」は、決まった印の試験支店で代えた");
  note("本店アイテム検索ブロックは、シードが本店のトップページ（TOPページ）のレイアウトに置き、本店のトップページに表示されることを確かめてある（支店ECTOPに出ないことが、ブロックが無いせいでないと分かるように）");
});

// ---- 061・062 アイテムを探すのカテゴリ・カードセット ----

caseTest("IT-F01-02-061", async ({ page, notes, step, expected }) => {
  const parts = new BranchSharedParts(page);
  const 名 = 印つき("テストカテゴリA-061");
  const 商品名 = 印つき("F0102-061商品");
  const catId = notes.get("〔カテゴリID-F0102-061〕");
  await step(1, async () => { await 開く(page); });
  await step(2, async () => {
    const link = parts.ブロックの枠(ブロックの枠("061")).getByRole("link", { name: 名, exact: true });
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), link.click({ noWaitAfter: true })]);
    await parts.商品カード(商品名).first().waitFor({ state: "visible", timeout: 60_000 }).catch(() => note(`商品一覧に「${商品名}」のカードが60秒たっても出なかった`));
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った先が、カテゴリで絞り込んだ商品一覧のアドレス").toBe(カテゴリの一覧のアドレス(catId));
    await expect.soft(parts.パンくず, `商品一覧のパンくずリストに、絞り込んだカテゴリ「${名}」が出る`).toContainText(名);
    await expect.soft(parts.商品カード(商品名), `カテゴリに所属させた商品「${商品名}」が商品一覧に表示される`).toBeVisible();
  });
  note(支店の注記);
  note("商品が絞り込まれた一覧に出ることを画面で確かめるため、シードで商品管理「ユニサーチフィード作成」を送り、商品一覧に出るまで待った");
});

caseTest("IT-F01-02-062", async ({ page, notes, step, expected }) => {
  const parts = new BranchSharedParts(page);
  const 名 = 印つき("テストセット特別版-062");
  const 商品名 = 印つき("F0102-062商品");
  const setId = notes.get("〔カードセットID-F0102-062〕");
  await step(1, async () => { await 開く(page); });
  await step(2, async () => {
    const link = parts.ブロックの枠(ブロックの枠("062")).getByRole("link", { name: 名, exact: true });
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), link.click({ noWaitAfter: true })]);
    await parts.商品カード(商品名).first().waitFor({ state: "visible", timeout: 60_000 }).catch(() => note(`商品一覧に「${商品名}」のカードが60秒たっても出なかった`));
  });
  await expected(async () => {
    const u = new URL(page.url());
    expect.soft(`${u.pathname}${u.search}`, "移った先が、カードセットで絞り込んだ商品一覧のアドレス").toBe(カードセットの一覧のアドレス(setId));
    await expect.soft(parts.パンくず, `商品一覧のパンくずリストに、絞り込んだカードセット「${名}」が出る`).toContainText(名);
    await expect.soft(parts.商品カード(商品名), `カードセットに所属させた商品「${商品名}」が商品一覧に表示される`).toBeVisible();
  });
  note(支店の注記);
  note("商品は、作ったカードセットに詳細情報を持つカードを指定して、カードセットに所属させた（シード）");
});

// ---- 065・066 おすすめ特集 ----

caseTest("IT-F01-02-065", async ({ page, step, expected }) => {
  const parts = new BranchSharedParts(page);
  const 名前 = 印つき("支店おすすめ特集ブロック-065");
  await step(1, async () => { await 開く(page); });
  await step(2, async () => { await parts.ブロックの枠(ブロックの枠("065")).scrollIntoViewIfNeeded().catch(() => note("支店おすすめ特集ブロックが見つからなかった")); });
  await expected(async () => {
    await expect.soft(parts.ブロックの枠(ブロックの枠("065")), "おすすめ特集の区画に置いたブロック").toBeVisible();
    await expect.soft(parts.ブロックの枠(ブロックの枠("065")).getByText(名前, { exact: true }), `ブロック管理で設定した「${名前}」の文が表示される`).toBeVisible();
  });
  note(支店の注記);
});

caseTest("IT-F01-02-066", async ({ page, step, expected, capture }) => {
  const parts = new BranchSharedParts(page);
  const バナー名 = 印つき("おすすめバナーA-066");
  const 押したあと = { 要求のアドレス: "", 応答: 0, 支店ECTOPのまま: true };
  await step(1, async () => { await 開く(page); });
  await step(2, async () => {
    const link = parts.ブロックの枠(ブロックの枠("066")).getByRole("link", { name: バナー名 });
    await link.scrollIntoViewIfNeeded();
    await capture("押す前のおすすめバナー");
    const [res] = await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), link.click({ noWaitAfter: true })]);
    押したあと.要求のアドレス = res?.request().url() ?? "";
    押したあと.応答 = res?.status() ?? 0;
    押したあと.支店ECTOPのまま = (await page.locator("body.shop_top").count()) > 0;
  });
  await expected(async () => {
    expect.soft(押したあと.要求のアドレス, "バナーを押したあとに開いた画面の要求のアドレス（HTMLに設定したURL）").toBe(おすすめバナーのURL);
    expect.soft(page.url(), "遷移したあとの画面のアドレス").toBe(おすすめバナーのURL);
    expect.soft(!押したあと.支店ECTOPのまま, "支店ECTOPから別の画面へ移った").toBe(true);
  });
  note(支店の注記);
  note(`遷移先（正本のリンクURL）の画面の応答は ${押したあと.応答}（遷移先の画面の中身は期待結果の外）`);
  note("バナーの画像は、シードがファイル管理に上げた画像（名前に実行の印・中身は 32x32 の PNG）。ケースの終わりに消す");
});

// ---- 070・071 連携（検索サービス）: 商品一覧の表示用HTML ----

caseTest("IT-F01-02-070", async ({ page, notes, step, expected }) => {
  const parts = new BranchSharedParts(page);
  const 子名 = 印つき("連携子カテゴリ-L003F0102n070");
  const 子 = notes.get("〔子カテゴリID-F0102-070〕");
  const 位置 = { パンくずの下: null as boolean | null };
  await step(1, async () => { await 開く(page); });
  await step(2, async () => {
    const link = parts.ブロックの枠(ブロックの枠("070")).getByRole("link", { name: 子名, exact: true });
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), link.click({ noWaitAfter: true })]);
    note(`移った先のアドレス: ${new URL(page.url()).pathname}（子カテゴリID ${子} の商品一覧は ${カテゴリの一覧のアドレス(子)}）`);
  });
  await step(3, async () => {
    await parts.表示用HTMLの欄.first().scrollIntoViewIfNeeded().catch(() => note("商品一覧に表示用HTMLの欄が見つからなかった"));
    位置.パンくずの下 = await BranchSharedParts.前にあるか(parts.パンくず, parts.表示用HTMLの欄);
  });
  await expected(async () => {
    await expect.soft(parts.表示用HTMLの欄, `子カテゴリの表示用HTML「${カテゴリの表示用HTML}」が表示される`).toContainText(カテゴリの表示用HTML);
    expect.soft(位置.パンくずの下, "表示用HTMLがパンくずリストの下にある（文書の並びでパンくずリストより後ろ）").toBe(true);
  });
  note(支店の注記);
});

caseTest("IT-F01-02-071", async ({ page, notes, step, expected }) => {
  const parts = new BranchSharedParts(page);
  const セット名 = 印つき("連携特別版セット-L004F0102n071");
  const 商品名 = 印つき("F0102-071商品");
  const setId = notes.get("〔カードセットID-F0102-071〕");
  const 位置 = { 一覧より上: null as boolean | null };
  await step(1, async () => { await 開く(page); });
  await step(2, async () => {
    const link = parts.ブロックの枠(ブロックの枠("071")).getByRole("link", { name: セット名, exact: true });
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), link.click({ noWaitAfter: true })]);
    note(`移った先のアドレス: ${new URL(page.url()).pathname}${new URL(page.url()).search}（カードセットID ${setId} の商品一覧は ${カードセットの一覧のアドレス(setId)}）`);
  });
  await step(3, async () => {
    // 商品一覧（検索サービスから描く）が出てから、その上の領域を見る
    await parts.商品カード(商品名).first().waitFor({ state: "visible", timeout: 60_000 }).catch(() => note(`商品一覧に「${商品名}」のカードが60秒たっても出なかった`));
    位置.一覧より上 = await BranchSharedParts.前にあるか(parts.表示用HTMLの欄, parts.全部の商品カード);
  });
  await expected(async () => {
    await expect.soft(parts.商品カード(商品名), `商品一覧に、カードセットに所属させた商品「${商品名}」が表示されている（商品一覧が描かれた）`).toBeVisible();
    await expect.soft(parts.表示用HTMLの欄, `カードセットの表示用HTML「${カードセットの表示用HTML}」が表示される`).toContainText(カードセットの表示用HTML);
    expect.soft(位置.一覧より上, "表示用HTMLが商品一覧より上にある（文書の並びで最初の商品カードより前）").toBe(true);
  });
  note(支店の注記);
  note("カードセットの表示用HTMLは、カードセット登録・編集に入力欄が無いので、シードがシード表どおり DB で設定した（E2E が作ったカードセットの行のフリーエリア(日)）");
});

// ---- 081 QRコード & 採用情報 ----

caseTest("IT-F01-02-081", async ({ page, step, expected }) => {
  const parts = new BranchSharedParts(page);
  const 本文 = 印つき("QR採用ブロック本文F0102-081");
  const 位置 = { 採用情報の後ろ: null as boolean | null };
  await page.setViewportSize(画面幅.PC);
  await step(1, async () => { await 開く(page); });
  await step(2, async () => {
    await parts.ブロックの枠(ブロックの枠("081")).scrollIntoViewIfNeeded().catch(() => note("QR採用ブロックが見つからなかった"));
    位置.採用情報の後ろ = await BranchSharedParts.前にあるか(parts.採用情報, parts.ブロックの枠(ブロックの枠("081")));
  });
  await expected(async () => {
    await expect.soft(parts.ブロックの枠(ブロックの枠("081")).getByText(本文, { exact: true }), `ブロック管理で設定した本文「${本文}」が表示される`).toBeVisible();
    expect.soft(位置.採用情報の後ろ, "本文がQRコード & 採用情報欄（採用情報のすぐ後ろに置いた位置）にある").toBe(true);
  });
  note(支店の注記);
  note("PC幅（1280px）の画面で開いた。QRコード & 採用情報の区画の位置として、採用情報（支店）のブロックのすぐ後ろに置いた（シード）");
});
