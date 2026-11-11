/**
 * F03-03 商品詳細検索の画面シード。正本: cases/F03-03_seed_data.tsv
 *
 * 作ったシード: 検索環境の確認（ENV）、検索選択肢の共通マスタ（MASTERS）、カテゴリの階層（CATTREE-028〜030・032〜034）。
 * 2026-11-10 の方針で足したシード（既存データ・画面で作ったデータへの読み替え。読み替えは「シード作成時の問題（読み替え）」に残す）:
 *   STORE-001（商品詳細を開く既存の商品）・CARRY-005（固定名のタグを無いときだけ作る＋既存の商品）・CARRY-025（既存のカード2件）・CARRY-027（参照だけ）。
 *   この4つを使うケース（001・005・025・027）は、確かめるのがモーダルの表示元とアドレスで、検索結果の商品には依らない。
 *
 * 作らないシード（記録 e2e/review/F03-03_progress_2026-10-29.md）:
 * - 商品を作って「商品検索用試験索引へ直接反映する」ところまでを定めるシード（STORE-006・FOIL-FRAME-008/009・
 *   COLOR-TYPE-010・SUGGEST-018・MANA-LANG-019/020・STOCK-RULE-021/023・CARRY-024・PRICE-031・COLOR-MULTI-035）。
 *   索引への反映は画面で指定できず、外部の検索サービスの試験環境が要る。
 * - DETAIL-007: 投入方法にDBでの準備を含む。
 *
 * 決め打ちの識別の値（ケース専用のカテゴリ名）には実行ごとの印を付ける（rc）。共有のマスタ（MASTERS）は、あれば使い、無ければ作るので印を付けない。
 */
import { expect, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, adminUrl, hideDebugToolbar, withAdminSession } from "../lib/session";
import { Browser } from "@playwright/test";
import { CategoryPage, createTopByCsv } from "../pages/admin/category";
import { expectSaved } from "../pages/admin/common";
import { FormatPage, MtgMasterPage } from "../pages/admin/f03_03_masters";
import { CardSearchPage } from "../pages/admin/m14_card";
import { TagPage } from "../pages/admin/m03_13_tag";
import { allTagRows, unusedSortNo } from "../pages/admin/m03_28_seed_ops";
import { FrontProductList } from "../pages/front/f03_01_product_list";

// ---- S-F03-03-ENV ----

/** 本店・TC大阪支店の公開側のアドレス（M03-38 のシードと同じ） */
export const F0303_店舗 = { 本店: "/ja", TC大阪支店: "/ja/osaka" } as const;

defineSeed("S-F03-03-ENV", async ({ browser }) => {
  // 参照だけの環境。各ケースが開始時に自分で新しいブラウザセッションを使う。ここでは、本店とTC大阪支店の商品一覧・TOPが日本語で開けることを確かめる
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    for (const [店, path] of Object.entries(F0303_店舗)) {
      for (const 画面 of ["/", "/products/search"]) {
        const res = await page.goto(`${BASE_URL}${path}${画面}`, { waitUntil: "domcontentloaded" });
        expect(res?.status() ?? 0, `${店}の公開側（${path}${画面}）が開けない`).toBeLessThan(400);
      }
    }
  } finally {
    await context.close();
  }
});

/** シードの画面操作は、1つの待ちを1分、全体を8分で打ち切る（同じ原因で長く止まらないため） */
async function 画面で作る<T = void>(browser: Browser, what: string, fn: (page: Page) => Promise<T>): Promise<T> {
  const 上限 = 8 * 60_000;
  let timer: NodeJS.Timeout | undefined;
  const deadline = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(`${what}が ${上限 / 60_000} 分で終わらない`)), 上限); });
  try {
    return await Promise.race([
      withAdminSession(browser, SETUP_ADMIN as Account, async (page) => {
        page.setDefaultTimeout(60_000);
        page.setDefaultNavigationTimeout(60_000);
        return await fn(page);
      }),
      deadline,
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// ---- カテゴリ ----

type 警告 = (w: string) => void;

/** 最上位にカテゴリを作り、増えた行のカテゴリIDを返す。最上位の一覧には入力欄が無く、最上位のカテゴリはカテゴリ登録CSV画面で作る（M03-45 と同じ） */
async function createTopCategory(page: Page, name: string, hide: boolean, onWarning: 警告): Promise<string> {
  return createTopByCsv(page, { nameJp: name, nameEn: "F0303 Top", frontHide: hide ? "1" : "0", branchHide: "0" },
    `f0303-top-${Date.now()}.csv`, onWarning);
}

/** 親カテゴリ（null は最上位）の下に、フロント非表示フラグを指定してカテゴリを作る */
async function createCategory(page: Page, parentId: string | null, name: string, hide: boolean, onWarning: 警告): Promise<string> {
  if (parentId === null) return createTopCategory(page, name, hide, onWarning);
  return new CategoryPage(page).createChild(parentId, { nameJp: name, frontHide: hide }, onWarning);
}

/** 共有のカテゴリ: 親の下に同名があれば使い（フロント非表示の設定が正本と同じことを確かめる）、無ければ作る */
async function ensureCategory(page: Page, parentId: string | null, name: string, hide: boolean, onWarning: 警告): Promise<string> {
  const cat = new CategoryPage(page);
  if (parentId === null) await cat.openTop(); else await cat.openChildrenOf(parentId);
  const hit = (await cat.rowValues()).filter((r) => r.nameJp === name);
  if (hit.length > 1) throw new Error(`カテゴリ「${name}」が親（${parentId ?? "最上位"}）の下に ${hit.length} 件ある（1件のはず）`);
  if (hit.length === 0) return createCategory(page, parentId, name, hide, onWarning);
  await cat.openEdit(hit[0].id);
  expect(await cat.frontHide.isChecked(), `既にあるカテゴリ「${name}」のフロント非表示フラグが正本（${hide ? "非表示" : "表示"}）と違う`).toBe(hide);
  return hit[0].id;
}

/** ケース専用のカテゴリの階層を、最上位から順に作る（フロント非表示フラグは外したまま）。名前には実行の印を付ける */
function defineCategoryChain(seedId: string, 名前: string[], 呼び名: string[]): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    await 画面で作る(browser, `${seedId} の作成`, async (page) => {
      let parent: string | null = null;
      for (let i = 0; i < 名前.length; i++) {
        const id: string = await createCategory(page, parent, rc(名前[i]), false, (w) => reportSeedIssue(seedId, w));
        notes.set(呼び名[i], id);
        parent = id;
      }
      // シード表の文中の総称「〔…〕」（以下の〔…〕）は、控えた番号の一覧として控える
      notes.set("〔…〕", 呼び名.map((l) => notes.get(l)).join(","));
    });
  });
}

defineCategoryChain("S-F03-03-CATTREE-028", ["F0303-028-A", "F0303-028-B"], ["〔カテゴリID-F0303-028A〕", "〔カテゴリID-F0303-028B〕"]);
defineCategoryChain("S-F03-03-CATTREE-029", ["F0303-029-A"], ["〔カテゴリID-F0303-029A〕"]);
defineCategoryChain("S-F03-03-CATTREE-030", ["F0303-030-A", "F0303-030-B", "F0303-030-C"], ["〔カテゴリID-F0303-030A〕", "〔カテゴリID-F0303-030B〕", "〔カテゴリID-F0303-030C〕"]);
defineCategoryChain("S-F03-03-CATTREE-032", ["F0303-032-A", "F0303-032-B", "F0303-032-C", "F0303-032-D"],
  ["〔カテゴリID-F0303-032A〕", "〔カテゴリID-F0303-032B〕", "〔カテゴリID-F0303-032C〕", "〔カテゴリID-F0303-032D〕"]);
defineCategoryChain("S-F03-03-CATTREE-033", ["F0303-033-A", "F0303-033-B"], ["〔カテゴリID-F0303-033A〕", "〔カテゴリID-F0303-033B〕"]);
defineCategoryChain("S-F03-03-CATTREE-034", ["F0303-034-A", "F0303-034-B", "F0303-034-C"], ["〔カテゴリID-F0303-034A〕", "〔カテゴリID-F0303-034B〕", "〔カテゴリID-F0303-034C〕"]);

// ---- S-F03-03-MASTERS ----

/** 共有のマスタの名称（ケースもこの名称で選択肢を探す） */
export const 共有マスタ = {
  表示対象親カテゴリ: "表示対象親カテゴリ",
  表示対象カテゴリ: "表示対象カテゴリ",
  非表示対象親カテゴリ: "非表示対象親カテゴリ",
  非表示対象カテゴリ: "非表示対象カテゴリ",
  クリーチャー: "クリーチャー",
  非表示カードタイプ: "非表示カードタイプ",
  アーティファクト: "アーティファクト",
  土地: "土地",
  フォーマット10: "フォーマット10",
  フォーマット20: "フォーマット20",
  非表示フォーマット: "非表示フォーマット",
  イラストレーターA: "Alpha Artist",
  イラストレーターB: "Beta Artist",
  サブタイプA英: "AlphaSubtype", サブタイプA日: "んタイプ",
  サブタイプB英: "BetaSubtype", サブタイプB日: "あタイプ",
} as const;

/** カードタイプ: 日本語名で行を探し、あれば商品検索に表示する値を正本に合わせ、無ければ新しい行で足す */
async function ensureCardType(page: Page, 日本語名: string, 表示: "0" | "1", 英語名: string, onIssue: 警告): Promise<string> {
  const m = new MtgMasterPage(page);
  await m.open("cardtype");
  const hit = (await m.rows()).filter((r) => r.日本語名 === 日本語名);
  if (hit.length > 1) throw new Error(`カードタイプ「${日本語名}」が ${hit.length} 行ある（1行のはず）`);
  if (hit.length === 1) {
    if (hit[0].商品検索に表示 === 表示) return hit[0].id;
    if (!(await m.setSearchFlag(hit[0].id, 表示))) throw new Error(`カードタイプ「${日本語名}」の「商品検索に表示するか」を${表示}にしたいが、画面で変えられない（固定の行）`);
    for (const w of await m.save(`カードタイプ「${日本語名}」の更新`)) onIssue(w);
    return hit[0].id;
  }
  await m.fillNewRow({ 日本語名, 英語名, 並び順: await m.nextSortNo(), 商品検索に表示: 表示 });
  for (const w of await m.save(`カードタイプ「${日本語名}」の登録`)) onIssue(w);
  await m.open("cardtype");
  const added = (await m.rows()).filter((r) => r.日本語名 === 日本語名);
  if (added.length !== 1) throw new Error(`カードタイプ「${日本語名}」を登録して ${added.length} 行になった`);
  expect(added[0].商品検索に表示, `登録したカードタイプ「${日本語名}」の商品検索に表示するかの値`).toBe(表示);
  return added[0].id;
}

/** フォーマット: 一覧に日本語名の行があれば使い（並び順・商品検索への表示が正本と同じことを確かめる）、無ければ登録する */
async function ensureFormat(page: Page, 名称日: string, 名称英: string, 並び順: string, 表示: boolean, onIssue: 警告): Promise<string> {
  const f = new FormatPage(page);
  await f.openList();
  const hit = (await f.listRows()).filter((r) => r.名称.startsWith(`${名称日} / `));
  if (hit.length > 1) throw new Error(`フォーマット「${名称日}」が一覧に ${hit.length} 件ある（1件のはず）`);
  if (hit.length === 1) {
    await f.openEdit(hit[0].id);
    const v = await f.values();
    expect(v.並び順, `既にあるフォーマット「${名称日}」の並び順`).toBe(並び順);
    expect(v.商品検索に表示, `既にあるフォーマット「${名称日}」の商品検索条件への表示`).toBe(表示);
    return hit[0].id;
  }
  await f.openNew();
  await f.fill({ 名称日, 名称英, 並び順, 商品検索に表示: 表示 });
  void onIssue;
  return f.register(`フォーマット「${名称日}」の登録`);
}

/** イラストレーター・サブタイプ: 英語名で行を探し、あればそのまま使い、無ければ新しい行で足す */
async function ensureByEnglishName(page: Page, 種別: "illustrator" | "subtype", 英語名: string, 日本語名: string | undefined, onIssue: 警告): Promise<string> {
  const m = new MtgMasterPage(page);
  await m.open(種別);
  const hit = (await m.rows()).filter((r) => r.英語名 === 英語名);
  if (hit.length > 1) throw new Error(`${種別 === "illustrator" ? "イラストレーター" : "サブタイプ"}「${英語名}」が ${hit.length} 行ある（1行のはず）`);
  if (hit.length === 1) {
    if (日本語名 !== undefined) expect(hit[0].日本語名, `既にあるサブタイプ「${英語名}」の日本語名`).toBe(日本語名);
    return hit[0].id;
  }
  await m.fillNewRow({ 英語名, 日本語名, 並び順: await m.nextSortNo() });
  for (const w of await m.save(`「${英語名}」の登録`)) onIssue(w);
  await m.open(種別);
  const added = (await m.rows()).filter((r) => r.英語名 === 英語名);
  if (added.length !== 1) throw new Error(`「${英語名}」を登録して ${added.length} 行になった`);
  return added[0].id;
}

defineSeed("S-F03-03-MASTERS", async ({ browser, notes, seed }) => {
  const issue: 警告 = (w) => reportSeedIssue(seed.シードID, w);
  await 画面で作る(browser, "共通マスタの作成", async (page) => {
    const 親A = await ensureCategory(page, null, 共有マスタ.表示対象親カテゴリ, false, issue);
    const 子B = await ensureCategory(page, 親A, 共有マスタ.表示対象カテゴリ, false, issue);
    const 親C = await ensureCategory(page, null, 共有マスタ.非表示対象親カテゴリ, true, issue);
    const 子D = await ensureCategory(page, 親C, 共有マスタ.非表示対象カテゴリ, false, issue);
    notes.set("〔カテゴリID-F0303-共有A〕", 親A);
    notes.set("〔カテゴリID-F0303-共有B〕", 子B);
    notes.set("〔カテゴリID-F0303-共有C〕", 親C);
    notes.set("〔カテゴリID-F0303-共有D〕", 子D);

    notes.set("〔カードタイプID-F0303-共有A〕", await ensureCardType(page, 共有マスタ.クリーチャー, "1", "F0303 Creature", issue));
    notes.set("〔カードタイプID-F0303-共有B〕", await ensureCardType(page, 共有マスタ.非表示カードタイプ, "0", "F0303 Hidden Type", issue));
    notes.set("〔カードタイプID-F0303-共有C〕", await ensureCardType(page, 共有マスタ.アーティファクト, "1", "F0303 Artifact", issue));
    notes.set("〔カードタイプID-F0303-共有D〕", await ensureCardType(page, 共有マスタ.土地, "1", "F0303 Land", issue));

    notes.set("〔フォーマットID-F0303-共有A〕", await ensureFormat(page, 共有マスタ.フォーマット10, "F0303-FORMAT-10", "10", true, issue));
    notes.set("〔フォーマットID-F0303-共有B〕", await ensureFormat(page, 共有マスタ.フォーマット20, "F0303-FORMAT-20", "20", true, issue));
    notes.set("〔フォーマットID-F0303-共有C〕", await ensureFormat(page, 共有マスタ.非表示フォーマット, "F0303-FORMAT-HIDDEN", "5", false, issue));

    notes.set("〔イラストレーターID-F0303-共有A〕", await ensureByEnglishName(page, "illustrator", 共有マスタ.イラストレーターA, undefined, issue));
    notes.set("〔イラストレーターID-F0303-共有B〕", await ensureByEnglishName(page, "illustrator", 共有マスタ.イラストレーターB, undefined, issue));
    notes.set("〔サブタイプID-F0303-共有A〕", await ensureByEnglishName(page, "subtype", 共有マスタ.サブタイプA英, 共有マスタ.サブタイプA日, issue));
    notes.set("〔サブタイプID-F0303-共有B〕", await ensureByEnglishName(page, "subtype", 共有マスタ.サブタイプB英, 共有マスタ.サブタイプB日, issue));
    // シード表の文中の総称「〔…〕」（以下の〔…〕）は、控えた番号の一覧として控える
    notes.set("〔…〕", notes.entries().filter(([k]) => /共有/.test(k)).map(([, v]) => v).join(","));
  });
});

// ---- 2026-11-10 の方針で足したシード ----

const 読み替え = (seedId: string, m: string) => reportSeedIssue(seedId, `シード作成時の問題（読み替え）: ${m}`);

/** 公開側（本店）の商品一覧から、商品詳細を開ける既存の商品を1件探す（読むだけ。何も書き換えない） */
async function 既存の商品を探す(browser: Browser, seedId: string): Promise<{ 商品ID: string; 規格ID: string; 商品名: string }> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    const list = new FrontProductList(page);
    const pick = async () => (await list.カードを読む()).find((c) => c.商品ID !== "" && c.行.length > 0 && c.行[0].規格ID !== "");
    await list.open(F0303_店舗.本店);
    await list.結果を待つ();
    let c = await pick();
    if (!c) {
      const cats = (await list.左メニューのカテゴリ(false)).slice(0, 20);
      for (const cat of cats) {
        await list.openCategory(F0303_店舗.本店, cat.id);
        c = await pick();
        if (c) break;
      }
    }
    if (!c) throw new Error(`${seedId}: 本店の商品一覧に、商品詳細を開ける既存の商品が見つからない`);
    return { 商品ID: c.商品ID, 規格ID: c.行[0].規格ID, 商品名: c.商品名 };
  } finally {
    await context.close();
  }
}

defineSeed("S-F03-03-STORE-001", async ({ browser, notes }) => {
  const id = "S-F03-03-STORE-001";
  const p = await 既存の商品を探す(browser, id);
  notes.set("〔商品ID-F0303-001〕", p.商品ID);
  notes.set("〔商品規格ID-F0303-001〕", p.規格ID);
  読み替え(id, `商品HQ-001-F0303-001（F0303-MODAL-001）を作って商品検索用試験索引へ反映する前提は、反映が画面で指定できないため作らず、本店の商品一覧にある既存の商品「${p.商品名}」（商品ID ${p.商品ID}・商品規格ID ${p.規格ID}）で代えた。このケースは8つの表示元でモーダルが開くことだけを確かめ、商品詳細は本店の商品詳細が開けるこの商品で開く。TC大阪支店で非公開という条件は使わない`);
});

/** 005 のタグの固定の名称（無いときだけタグ登録画面で作り、あれば使い回す） */
const タグ005 = "T-F0303-005";

defineSeed("S-F03-03-CARRY-005", async ({ browser, notes }) => {
  const id = "S-F03-03-CARRY-005";
  const タグID = await 画面で作る(browser, `${id} の作成`, async (page) => {
    const rows = await allTagRows(page);
    const hit = rows.filter((r) => r.名称日 === タグ005);
    if (hit.length > 1) throw new Error(`タグ「${タグ005}」が ${hit.length} 件ある（1件のはず）`);
    if (hit.length === 1) return hit[0].ID;
    const tag = new TagPage(page);
    await tag.openNew();
    return tag.register({ 名称日: タグ005, 名称英: "Tag F0303 Url Check", 並び順: unusedSortNo(rows) }, `${id}: タグの登録`);
  });
  notes.set("〔タグID-F0303-005〕", タグID);
  const p = await 既存の商品を探す(browser, id);
  notes.set("〔商品ID-F0303-005〕", p.商品ID);
  notes.set("〔商品規格ID-F0303-005〕", p.規格ID);
  読み替え(id, `タグ「${タグ005}」（タグID ${タグID}）はタグ登録画面で、固定の名称で無いときだけ作り、あれば使い回す。商品URL-F0303-005（表示対象カテゴリ所属・タグ設定・本店公開・在庫1）を作って索引へ反映する前提は、反映が画面で指定できず、共有の既存の商品にタグを付けると書き換えになるため作らず、既存の商品（商品ID ${p.商品ID}）を控えるだけにした。このケースはアドレスの形だけを確かめ、検索結果の商品には依らない`);
});

defineSeed("S-F03-03-CARRY-025", async ({ browser, notes }) => {
  const id = "S-F03-03-CARRY-025";
  const ids = await 画面で作る(browser, `${id} の作成`, async (page) => {
    const cards = new CardSearchPage(page);
    await cards.open();
    await cards.検索する();
    const got = await cards.表示中のカードID();
    if (got.length < 2) throw new Error(`${id}: カード一覧に既存のカードが ${got.length} 件しかない（2件要る）`);
    return got.slice(0, 2);
  });
  notes.set("〔カードID-F0303-025A〕", ids[0]);
  notes.set("〔カードID-F0303-025B〕", ids[1]);
  読み替え(id, `商品CARRY-A-025・CARRY-B-025（F0303-CARRY-025）とそのカードを作って索引へ反映する前提は、反映が画面で指定できないため作らず、カード一覧にある既存のカード2件（カードID ${ids[0]}・${ids[1]}）のIDを控えた。このケースは検索後のアドレスに遷移元のカードID・並び順・ページ番号が残らないことだけを確かめ、検索結果の商品には依らない`);
});

defineSeed("S-F03-03-CARRY-027", async () => {
  読み替え("S-F03-03-CARRY-027", "商品CARRY-A-027・CARRY-B-027（F0303-CARRY-027）を作って索引へ反映する前提は、反映が画面で指定できないため作らない。このケースは商品名だけを入れて検索したあとのアドレスだけを確かめ、検索結果の商品には依らない");
});

void adminUrl;
