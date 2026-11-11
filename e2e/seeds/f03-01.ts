/**
 * F03-01 商品一覧の画面シード。正本: cases/F03-01_seed_data.tsv
 *
 * 商品一覧の商品は、外部の検索サービス（ユニサーチ）の索引から描く。画面で作った商品は、索引へ反映されるまで一覧に出ない。
 * 依頼者の方針（2026-11-10）に従い、シード表が「商品を作って索引へ反映する」「DBで設定する」としている前提を、
 * 次のどちらかに読み替える。読み替えは各シードで reportSeedIssue に「シード作成時の問題」として書き、エビデンスの注記に出す。
 *  - 既存データ: 開発環境に既にある商品・カテゴリ・タグを、公開側の画面（左メニュー・商品一覧）で探して使う。
 *    控える番号（〔カテゴリレコードID-…〕〔商品レコードID-…〕〔規格レコードID-…〕）は、見つけた既存のカテゴリ・商品・規格の番号を控える。
 *  - 画面で作るデータ: 会員（フロントの会員登録）、お気に入り・入荷通知（公開側の商品一覧のボタン）、
 *    バナー確認のカテゴリ・タグ・商品（管理画面のカテゴリ登録・タグ登録・グッズ商品CSV登録）。名前・コード・メールには実行ごとの印を付ける。
 *    既存の共有データは消さない・書き換えない（タグID 1・カテゴリID 2 の表示用HTMLは書き換えず、自分で作ったカテゴリ・タグで代える）。
 *
 * 作らないシード（記録 e2e/review/F03-01_progress_2026-11-10.md の「実施不可の候補」）:
 *  索引に特定の商品だけがある前提（件数・組合せ・存在しない商品）、店舗別の公開状態、過去の日付の注文、購入履歴の索引への反映、
 *  カードセットの表示用HTML など、画面からも既存データからも作れない前提のシード。
 */
import { Browser, Page, expect } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { CategoryPage, purgeCategories } from "../pages/admin/category";
import { NMか, 商品規格の一覧を読む, 商品規格の属性を読む } from "../pages/admin/f03_01_product_attrs";
import { customerIdByEmail } from "../pages/admin/f03_07_restock";
import { readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { TagPage } from "../pages/admin/m03_13_tag";
import { openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { allTagRows, unusedSortNo } from "../pages/admin/m03_28_seed_ops";
import { ProductSearchPage } from "../pages/admin/product_search";
import { FrontProductList, カード情報, 公開側の場, 店舗の入口 } from "../pages/front/f03_01_product_list";
import { FrontFavorite } from "../pages/front/f03_08_favorite";
import { registerFrontMember } from "../pages/front/member_entry";

// ==== ケースへ渡す、シードが見つけた・作ったもの（控える番号のほかに要る値） ====

export type 見つけたもの = Record<string, string>;
const found = new Map<string, 見つけたもの>();
/** シードが見つけた・作ったもの（ケースが引く）。そのシードを作っていなければ落とす */
export function 見つけた(seedId: string): 見つけたもの {
  const f = found.get(seedId);
  if (!f) throw new Error(`${seedId} をまだ作っていない（見つけたものが無い）`);
  return f;
}
const issue = (seedId: string) => (m: string) => reportSeedIssue(seedId, m);
/** 読み替えを「シード作成時の問題」として残す */
const 読み替え = (seedId: string, m: string) => reportSeedIssue(seedId, `シード作成時の問題（読み替え）: ${m}`);

/** 試験会員の共通の値（パスワードは識別の値でないので印を付けない） */
export const 会員のパスワード = "Passw0rdF0301";

// ==== 公開側で既存データを探す ====

type 読んだカテゴリ = { 店: string; id: string; 件数: number | null; cards: カード情報[]; ページ番号: number[] };
const 読んだ = new Map<string, 読んだカテゴリ>();
let 左メニュー: { id: string; name: string; href: string; query: string }[] | null = null;

async function 公開側で<T>(browser: Browser, fn: (list: FrontProductList, page: Page) => Promise<T>): Promise<T> {
  const context = await 公開側の場(browser);
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    return await fn(new FrontProductList(page), page);
  } finally {
    await context.close();
  }
}

/** 本店の商品一覧の左メニューにあるカテゴリ（リンク先のパスのカテゴリIDで重ねない）。1回の実行で1度だけ読む */
async function 左メニューを読む(list: FrontProductList): Promise<{ id: string; name: string; href: string; query: string }[]> {
  if (左メニュー) return 左メニュー;
  await list.open(店舗の入口.本店);
  // 閉じた階層の中のカテゴリも含める（ケースはカテゴリIDのアドレスで開く。左メニューから押すケースは別に見えるものだけを使う）
  const all = await list.左メニューのカテゴリ(false);
  const seen = new Set<string>();
  左メニュー = all.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
  if (左メニュー.length === 0) throw new Error("本店の商品一覧の左メニューにカテゴリのリンクが無い");
  return 左メニュー;
}

/** カテゴリの商品一覧（1ページ目）を開いて、件数・本表示のカード・ページ送りの番号を読む。ログアウトの状態で読んだものは使い回す */
async function カテゴリを読む(list: FrontProductList, 店: string, id: string, 使い回す = true): Promise<読んだカテゴリ> {
  const key = `${店}|${id}`;
  if (使い回す && 読んだ.has(key)) return 読んだ.get(key)!;
  await list.openCategory(店, id);
  const r: 読んだカテゴリ = {
    店, id, 件数: await list.商品数の値(), cards: await list.カードを読む(),
    ページ番号: (await list.ページ送りの並び("上部")).filter((t) => /^\d+$/.test(t)).map(Number),
  };
  if (使い回す) 読んだ.set(key, r);
  return r;
}

/** 左メニューのカテゴリを先頭から順に開き、判定に合う最初のカテゴリを返す（見つからなければ落とす） */
async function カテゴリを探す<T>(list: FrontProductList, seedId: string, 説明: string,
  判定: (r: 読んだカテゴリ) => T | null | undefined, opt: { 店?: string; 上限?: number; 使い回す?: boolean } = {}): Promise<{ r: 読んだカテゴリ; v: T }> {
  const 店 = opt.店 ?? 店舗の入口.本店;
  const cats = (await 左メニューを読む(list)).slice(0, opt.上限 ?? 40);
  for (const c of cats) {
    const r = await カテゴリを読む(list, 店, c.id, opt.使い回す ?? true);
    const v = 判定(r);
    if (v !== null && v !== undefined) return { r, v };
  }
  throw new Error(`${seedId}: 既存のカテゴリ（左メニューの先頭から${cats.length}件）に、${説明}が見つからない`);
}

const 既存カテゴリの読み替え = (seedId: string, 正本: string, r: 読んだカテゴリ, 追記 = "") =>
  読み替え(seedId, `${正本}は索引への反映が要り画面で作れないため、既存のカテゴリ（カテゴリID ${r.id}・商品数 ${r.件数 ?? "読めない"}点）で代えた${追記 ? `。${追記}` : ""}`);

// ==== 共通試験環境・参照マスタ ====

defineSeed("S-F03-01-ENV", async ({ browser }) => {
  // 参照だけで成り立つ範囲を確かめる: 本店 /ja/ と TC大阪支店 /ja/osaka/ が日本語で公開され、商品一覧が開ける。
  // 商品一覧の1ページ最大件数・ユニサーチ一覧上限・他の状態の価格下限は、管理画面に設定欄が無い（記録の「シードでの解釈」）ため、書き換えない
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    for (const [店, path] of Object.entries(店舗の入口)) {
      for (const 画面 of ["/", "/products/search"]) {
        const res = await page.goto(`${BASE_URL}${path}${画面}`, { waitUntil: "domcontentloaded" });
        expect(res?.status() ?? 0, `${店}の公開側（${path}${画面}）が開けない`).toBeLessThan(400);
      }
    }
  } finally {
    await context.close();
  }
  reportSeedIssue("S-F03-01-ENV", "商品一覧の1ページ最大件数・ユニサーチ一覧上限・他の状態の価格下限・ユニサーチ接続先は、管理画面に設定欄が無いため書き換えていない（本店とTC大阪支店が開けることだけを確かめた）");
});

defineSeed("S-F03-01-MASTER", async ({ browser }) => {
  // 参照専用マスタ。IDを画面で指定できない（DBで設定する）前提は作らず、既存のマスタを使う。共有のマスタは書き換えない。
  // 確かめるのは、商品一覧の「おすすめ商品から探す」のタグ（22件）が、管理画面のタグ一覧に同じIDと名称であること。
  const id = "S-F03-01-MASTER";
  const tags = await 公開側で(browser, async (list) => {
    await list.open(店舗の入口.本店);
    return list.おすすめタグのリンク();
  });
  if (tags.length === 0) throw new Error(`${id}: 商品一覧に「おすすめ商品から探す」のタグが無い`);
  await withAdminSession(browser, SETUP_ADMIN as Account, async (page) => {
    page.setDefaultTimeout(60_000);
    const rows = await allTagRows(page);
    const missing = tags.filter((t) => !rows.some((r) => r.ID === t.id && r.名称日 === t.name));
    if (missing.length) throw new Error(`${id}: 「おすすめ商品から探す」のタグのうち、管理画面のタグ一覧に同じIDと名称の行が無いもの: ${missing.map((m) => `${m.name}(ID ${m.id})`).join("、")}`);
  });
  読み替え(id, `おすすめ商品用のタグ（${tags.length}件）は既存のタグ一覧で同じIDと名称があることを確かめた。タグID 1・2・3、カテゴリID 2、フォーマットID 3、カテゴリ階層（スタンダード＞タルキール：龍嵐録＞…）は、IDを画面で指定できずDBで設定する前提のため作らず、この機能で実装したケースは使わない。タグID 1・カテゴリID 2 の表示用HTML（TAG-BANNER・CAT-BANNER）は共有のマスタを書き換えることになるため設定せず、バナーのケースは自分で作ったカテゴリ・タグで代える`);
});

defineSeed("S-F03-01-NOCATEGORY-019", async ({ browser }) => {
  // カテゴリ登録画面の「CSVダウンロード」で出力したCSVに、カテゴリIDが999の行が無いことを確かめる。あれば画面から削除する
  await withAdminSession(browser, SETUP_ADMIN as Account, async (page) => {
    page.setDefaultTimeout(60_000);
    const 消した = await purgeCategories(page, (r) => r["カテゴリID"] === "999", "S-F03-01-NOCATEGORY-019", (w) => reportSeedIssue("S-F03-01-NOCATEGORY-019", w));
    void 消した;
    // 削除したあとにCSVを出力し直して、行が無いことを確かめる
    const cat = new CategoryPage(page);
    await cat.openTop();
    const 残り = (await cat.downloadCsv()).filter((r) => r["カテゴリID"] === "999");
    expect(残り.length, "カテゴリID 999 の行が残っている").toBe(0);
  });
});

// ==== 検索語（既存データ） ====

defineSeed("S-F03-01-UNISEARCH-ZERO-020", async ({ browser }) => {
  const id = "S-F03-01-UNISEARCH-ZERO-020";
  const kw = rc("F0301-ZERO-020");
  await withAdminSession(browser, SETUP_ADMIN as Account, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const field of ["product_name", "product_code"] as const) {
      const s = new ProductSearchPage(page);
      await s.open();
      await s.ensureDetailVisible();
      await s.field(field).fill(kw);
      await s.submitAndWaitForResult();
      await expect(page.getByText("検索条件に合致するデータが見つかりませんでした").first(), `商品マスターで「${kw}」を${field === "product_name" ? "商品名(日/英)" : "コード"}に入れて検索した結果が0件`).toBeVisible();
    }
  });
  found.set(id, { 検索語: kw });
  読み替え(id, `検索語に実行ごとの印を付けた「${kw}」を使う（管理画面の商品マスターで商品名・コードとも0件を確かめた）。ユニサーチフィードの送信と索引への反映は、存在しない語の0件に関わらないため行わない`);
});

defineSeed("S-F03-01-UNISEARCH-MANY-021", async ({ browser }) => {
  const id = "S-F03-01-UNISEARCH-MANY-021";
  // 4001件の商品を作って索引へ反映する代わりに、既存の商品で4000件を超えて当たる検索語を探す
  const 候補 = ["の", "ドラゴン", "エルフ", "ゴブリン", "天使", "騎士", "マジック"];
  const hit = await 公開側で(browser, async (list) => {
    const seen: string[] = [];
    for (const kw of 候補) {
      await list.openKeyword(店舗の入口.本店, kw);
      const n = await list.商品数の値();
      seen.push(`「${kw}」${n ?? "読めない"}点`);
      if (n !== null && n > 4000) return { kw, n, seen };
    }
    throw new Error(`${id}: 既存の商品で4000件を超えて当たる検索語が見つからない（${seen.join("、")}）`);
  });
  found.set(id, { 検索語: hit.kw, 件数: String(hit.n) });
  読み替え(id, `4001件の商品を作って索引へ反映する前提は画面で作れないため、既存の商品で4000件を超えて当たる検索語「${hit.kw}」（${hit.n}点）で代えた（試した語: ${hit.seen.join("、")}）`);
});

// ==== 商品一覧の表示・並び・ページ送り（既存のカテゴリ） ====

/** ページ送りが3ページ以上になるカテゴリ（設計の1ページ最大60件で121件以上） */
const 三ページ以上 = (r: 読んだカテゴリ) => (r.件数 !== null && r.件数 >= 121 && Math.max(0, ...r.ページ番号) >= 3 ? true : null);

/** 3ページ以上になる既存のカテゴリを探して控える */
function definePagingSeed(seedId: string, label: string, 正本: string): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    const { r } = await 公開側で(browser, (list) => カテゴリを探す(list, seedId, "3ページ以上になる（121件以上の）カテゴリ", 三ページ以上));
    notes.set(label, r.id);
    found.set(seedId, { カテゴリID: r.id, 件数: String(r.件数) });
    既存カテゴリの読み替え(seedId, 正本, r, "1ページ最大件数は管理画面で変えられないため、設計の60件のまま3ページ以上になるカテゴリを選んだ");
  });
}
definePagingSeed("S-F03-01-PAGING-025", "〔カテゴリレコードID-F0301-025〕", "ページング確認カテゴリ-025（索引の商品121件）");
definePagingSeed("S-F03-01-PAGING-026", "〔カテゴリレコードID-F0301-026〕", "ページング確認カテゴリ-026（索引の商品121件）");
definePagingSeed("S-F03-01-PAGECUR-068", "〔カテゴリレコードID-F0301-068〕", "商品一覧確認カテゴリ-068（商品11件・1ページ最大5件で3ページ）");
definePagingSeed("S-F03-01-PAGEMORE-071", "〔カテゴリレコードID-F0301-071〕", "商品一覧確認カテゴリ-071（商品81件・1ページ最大5件で17ページ）");
definePagingSeed("S-F03-01-PAGEBTM-074", "〔カテゴリレコードID-F0301-074〕", "商品一覧確認カテゴリ-074（商品11件・1ページ最大5件で3ページ）");
definePagingSeed("S-F03-01-PAGEBTMPREV-075", "〔カテゴリレコードID-F0301-075〕", "商品一覧確認カテゴリ-075（商品11件・1ページ最大5件で3ページ）");

/** 総ページ数が7以上（「1 2 3 4 5 ... 最終」の形になる）で、表示上限の4000件以下のカテゴリ */
const 七ページ以上 = (r: 読んだカテゴリ) => (r.件数 !== null && r.件数 > 60 * 6 && r.件数 <= 4000 ? true : null);
function definePageMoreSeed(seedId: string, label: string): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    const { r } = await 公開側で(browser, (list) => カテゴリを探す(list, seedId, "総ページ数が7以上（361件以上4000件以下）のカテゴリ", 七ページ以上));
    notes.set(label, r.id);
    found.set(seedId, { カテゴリID: r.id, 件数: String(r.件数) });
    既存カテゴリの読み替え(seedId, "商品一覧確認カテゴリ（商品81件・1ページ最大5件で17ページ）", r,
      `1ページ最大件数は変えられないため、設計の60件で総ページ数が7以上（${Math.ceil((r.件数 ?? 0) / 60)}ページ）になるカテゴリを選んだ。期待結果の「17」はこの総ページ数に読み替える`);
  });
}
definePageMoreSeed("S-F03-01-PAGEMORE-069", "〔カテゴリレコードID-F0301-069〕");
definePageMoreSeed("S-F03-01-PAGEMORE-070", "〔カテゴリレコードID-F0301-070〕");

defineSeed("S-F03-01-PAGING-054", async ({ browser, notes }) => {
  const id = "S-F03-01-PAGING-054";
  const { r } = await 公開側で(browser, (list) => カテゴリを探す(list, id, "2ページ以上になるカテゴリ", (x) => (x.件数 !== null && x.件数 > 60 && Math.max(0, ...x.ページ番号) >= 2 ? true : null)));
  notes.set("〔カテゴリレコードID-F0301-054〕", r.id);
  found.set(id, { カテゴリID: r.id });
  既存カテゴリの読み替え(id, "ページング確認カテゴリ-054（神話レアの索引商品121件）", r, "ページ送り・並び順・神話レアの絞り込みができる既存のカテゴリを選んだ");
});

defineSeed("S-F03-01-PAGING-059", async ({ browser, notes }) => {
  const id = "S-F03-01-PAGING-059";
  const { r } = await 公開側で(browser, (list) => カテゴリを探す(list, id, "商品が出るカテゴリ", (x) => (x.cards.length > 0 ? true : null)));
  notes.set("〔カテゴリレコードID-F0301-059〕", r.id);
  found.set(id, { カテゴリID: r.id });
  既存カテゴリの読み替え(id, "ページング確認カテゴリ-059（索引の商品61件）", r);
});

defineSeed("S-F03-01-SORT-028", async ({ browser, notes }) => {
  const id = "S-F03-01-SORT-028";
  // 左メニューに見えているカテゴリのうち、管理画面のカテゴリ編集で検索パラメータが空（初期の並び順の指定が無い）ものを使う
  const visible = await 公開側で(browser, async (list) => { await list.open(店舗の入口.本店); return list.左メニューのカテゴリ(); });
  let chosen: { id: string; name: string; href: string } | null = null;
  await withAdminSession(browser, SETUP_ADMIN as Account, async (page) => {
    page.setDefaultTimeout(60_000);
    const cat = new CategoryPage(page);
    for (const c of visible.slice(0, 15)) {
      await cat.openEdit(c.id);
      if ((await cat.searchParameters.inputValue()).trim() === "") { chosen = c; break; }
    }
  });
  if (!chosen) throw new Error(`${id}: 左メニューに見えているカテゴリに、検索パラメータが空のものが無い`);
  const c = chosen as { id: string; name: string; href: string };
  const keyword = await 公開側で(browser, async (list) => {
    const r = await カテゴリを読む(list, 店舗の入口.本店, c.id);
    const name = r.cards.find((x) => x.商品名)?.商品名;
    if (!name) throw new Error(`${id}: カテゴリ「${c.name}」の商品一覧に商品が出ない`);
    return name;
  });
  notes.set("〔カテゴリレコードID-F0301-028〕", c.id);
  found.set(id, { カテゴリID: c.id, カテゴリ名: c.name, リンク: c.href, 検索語: keyword });
  読み替え(id, `検索語「F0301-SORT-028」とカテゴリ「SORT-CATEGORY」に各3件の商品を作って索引へ反映する前提は画面で作れないため、左メニューに見えている既存のカテゴリ「${c.name}」（カテゴリID ${c.id}。管理画面のカテゴリ編集で検索パラメータが空＝並び順の指定なし）と、そのカテゴリの商品名「${keyword}」を検索語として代えた`);
});

defineSeed("S-F03-01-SORT-029", async ({ browser, notes }) => {
  const id = "S-F03-01-SORT-029";
  const { r, v } = await 公開側で(browser, (list) => カテゴリを探す(list, id, "全商品が1ページに収まり（60件以下）、価格の違う商品が3件以上あるカテゴリ", (x) => {
    if (x.件数 === null || x.件数 < 3 || x.件数 > 60) return null;
    const priced = x.cards.map((c) => ({ c, p: c.行[0]?.価格 })).filter((y): y is { c: カード情報; p: number } => typeof y.p === "number");
    const byPrice = [...new Map(priced.map((y) => [y.p, y])).values()].sort((a, b) => b.p - a.p);
    if (byPrice.length < 3) return null;
    return [byPrice[0], byPrice[Math.floor(byPrice.length / 2)], byPrice[byPrice.length - 1]];
  }));
  notes.set("〔カテゴリレコードID-F0301-029〕", r.id);
  notes.set("〔商品レコードID-F0301-029A〕", v[0].c.商品ID);
  notes.set("〔商品レコードID-F0301-029B〕", v[1].c.商品ID);
  notes.set("〔商品レコードID-F0301-029C〕", v[2].c.商品ID);
  found.set(id, { カテゴリID: r.id, 高: `${v[0].c.商品ID}|${v[0].c.言語}`, 中: `${v[1].c.商品ID}|${v[1].c.言語}`, 低: `${v[2].c.商品ID}|${v[2].c.言語}` });
  既存カテゴリの読み替え(id, "並び順確認カテゴリ-029（3000円・2000円・1000円の3件だけ）", r,
    `SORT-HIGH-029・SORT-MID-029・SORT-LOW-029 は、このカテゴリの商品のうち表示価格が最も高い「${v[0].c.商品名}」(${v[0].p}円)・中ほどの「${v[1].c.商品名}」(${v[1].p}円)・最も安い「${v[2].c.商品名}」(${v[2].p}円)で代えた。カテゴリにはほかの商品もある`);
});

// ==== 商品カードの表示（既存の商品） ====

type カード探し = { カテゴリの呼び名: string; 説明: string; 正本: string; 判定: (c: カード情報) => boolean;
  控える: (c: カード情報) => Record<string, string>; 追記?: (c: カード情報) => string };

/** 判定に合うカードがある既存のカテゴリを探し、カテゴリとカードの番号を控える */
function defineCardSeed(seedId: string, d: カード探し): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    const { r, v } = await 公開側で(browser, (list) => カテゴリを探す(list, seedId, d.説明, (x) => x.cards.find(d.判定) ?? null));
    notes.set(d.カテゴリの呼び名, r.id);
    for (const [label, value] of Object.entries(d.控える(v))) notes.set(label, value);
    found.set(seedId, { カテゴリID: r.id, 商品ID: v.商品ID, 言語: v.言語, 商品名: v.商品名 });
    既存カテゴリの読み替え(seedId, d.正本, r, `商品は既存の「${v.表示名}」（商品ID ${v.商品ID}${v.言語 ? `・${v.言語}` : ""}）で代えた${d.追記 ? `。${d.追記(v)}` : ""}`);
  });
}
const 在庫あり = (c: カード情報) => c.行.filter((x) => (x.在庫 ?? 0) > 0);
const 最高価格の在庫あり = (c: カード情報) => 在庫あり(c).reduce<カード情報["行"][number] | null>((m, x) => (m === null || (x.価格 ?? 0) > (m.価格 ?? 0) ? x : m), null);
const 行の説明 = (c: カード情報) => c.行.map((x) => `${x.状態 || "（状態なし）"} ${x.価格 ?? "?"}円 在庫${x.在庫 ?? "?"}`).join("／");

defineCardSeed("S-F03-01-STATES-034", {
  カテゴリの呼び名: "〔カテゴリレコードID-F0301-034〕",
  説明: "他の状態にリンクの付いた状態があるカード商品", 正本: "状態確認カテゴリ（CARD-STATE-034: NM 500円在庫2・EX 100円在庫3）",
  判定: (c) => c.カード商品 && c.行.length >= 2 && c.行.slice(1).some((x) => x.状態がリンク && x.規格ID !== ""),
  控える: (c) => ({ "〔商品レコードID-F0301-034〕": c.商品ID, "〔規格レコードID-F0301-034A〕": c.行[0].規格ID, "〔規格レコードID-F0301-034B〕": c.行.slice(1).find((x) => x.状態がリンク)!.規格ID }),
  追記: (c) => `表示中の状態は「${c.行[0].状態}」、EX は他の状態の「${c.行.slice(1).find((x) => x.状態がリンク)!.状態}」に読み替える（状態: ${行の説明(c)}）`,
});
defineCardSeed("S-F03-01-STATES-035", {
  カテゴリの呼び名: "〔カテゴリレコードID-F0301-035〕",
  説明: "同名商品検索のあるカード商品", 正本: "状態確認カテゴリ（CARD-STATE-035: 同じカードIDの NM・EX）",
  判定: (c) => c.カード商品 && c.同名商品,
  控える: (c) => ({ "〔商品レコードID-F0301-035〕": c.商品ID }),
});
const NM在庫なし他あり = (c: カード情報) => c.カード商品 && c.行.length >= 2 && c.行[0].在庫 === 0 && c.行.slice(1).some((x) => (x.在庫 ?? 0) > 0);
defineCardSeed("S-F03-01-STATES-037", {
  カテゴリの呼び名: "〔カテゴリレコードID-F0301-037〕",
  説明: "表示中の状態の在庫が0で、他の状態に在庫があるカード商品", 正本: "状態確認カテゴリ（CARD-NONM-037: NM在庫0・EX在庫2）",
  判定: NM在庫なし他あり, 控える: (c) => ({ "〔商品レコードID-F0301-037〕": c.商品ID }),
  追記: (c) => `NM は表示中の状態「${c.行[0].状態}」、EX は在庫のある他の状態に読み替える（状態: ${行の説明(c)}）`,
});
defineCardSeed("S-F03-01-OTHERBTN-064", {
  カテゴリの呼び名: "〔カテゴリレコードID-F0301-064〕",
  説明: "表示中の状態の在庫が0で、他の状態に在庫があるカード商品", 正本: "商品一覧確認カテゴリ-064（F0301-064-A: NM 300円在庫0・EX 500円在庫2 の1件だけ）",
  判定: NM在庫なし他あり, 控える: (c) => ({ "〔商品レコードID-F0301-064〕": c.商品ID }),
  追記: (c) => `NM は表示中の状態「${c.行[0].状態}」、EX（500円）は在庫のある他の状態とその価格に読み替える（状態: ${行の説明(c)}）。カテゴリにはほかの商品もある`,
});
const 最高価格が先頭でない = (c: カード情報) => {
  const top = 最高価格の在庫あり(c);
  return c.カード商品 && c.行.length >= 2 && 在庫あり(c).length >= 2 && top !== null && top.規格ID !== "" && top.規格ID !== c.行[0].規格ID && c.行.every((x) => x.規格ID !== "");
};
defineCardSeed("S-F03-01-QTY-038", {
  カテゴリの呼び名: "〔カテゴリレコードID-F0301-038〕",
  説明: "在庫のある状態が2つ以上あり、最も高い状態が表示中の状態でないカード商品", 正本: "数量確認カテゴリ（QTY-001-038: NM 300円在庫3・EX 500円在庫2）",
  判定: 最高価格が先頭でない,
  控える: (c) => ({ "〔商品レコードID-F0301-038〕": c.商品ID, "〔規格レコードID-F0301-038A〕": c.行[0].規格ID, "〔規格レコードID-F0301-038B〕": 最高価格の在庫あり(c)!.規格ID }),
  追記: (c) => `NM は表示中の状態「${c.行[0].状態}」、EX は在庫のある状態のうち最も高い「${最高価格の在庫あり(c)!.状態}」に読み替える（状態: ${行の説明(c)}）`,
});
defineCardSeed("S-F03-01-QTY-079", {
  カテゴリの呼び名: "〔カテゴリレコードID-F0301-079〕",
  説明: "在庫のある状態が2つ以上あり、最も高い状態が表示中の状態でないカード商品", 正本: "数量確認カテゴリ-079（F0301-079-A: NM 300円在庫3・EX 500円在庫2 の1件だけ）",
  判定: 最高価格が先頭でない, 控える: (c) => ({ "〔商品レコードID-F0301-079〕": c.商品ID }),
  追記: (c) => `NM は表示中の状態「${c.行[0].状態}」、EX は在庫のある状態のうち最も高い「${最高価格の在庫あり(c)!.状態}」に読み替える（状態: ${行の説明(c)}）`,
});
defineCardSeed("S-F03-01-QTY-040", {
  カテゴリの呼び名: "〔カテゴリレコードID-F0301-040〕",
  説明: "表示の初めの数量が0で、在庫が1以上ある（増減のボタンがある）状態の行", 正本: "数量確認カテゴリ（QTY-001-040: NM在庫3・表示開始時のNM数量0）",
  判定: (c) => c.行.some((x) => x.増減あり && x.見えている && x.数量 === 0 && (x.在庫 ?? 0) >= 1 && (x.在庫 ?? 0) < 999 && x.規格ID !== ""),
  控える: (c) => ({ "〔商品レコードID-F0301-040〕": c.商品ID }),
  追記: (c) => { const x = c.行.find((y) => y.増減あり && y.見えている && y.数量 === 0 && (y.在庫 ?? 0) >= 1)!; return `NM（在庫3）は、表示の初めの数量が0の状態「${x.状態}」（在庫${x.在庫}）に読み替える`; },
});
defineCardSeed("S-F03-01-QTY-041", {
  カテゴリの呼び名: "〔カテゴリレコードID-F0301-041〕",
  説明: "すべての状態の在庫が0の商品", 正本: "数量確認カテゴリ（QTY-NOSTOCK-041: 全規格在庫0 の1件だけ）",
  判定: (c) => c.行.length > 0 && c.行.every((x) => x.在庫 === 0),
  控える: (c) => ({ "〔商品レコードID-F0301-041〕": c.商品ID }),
});
defineCardSeed("S-F03-01-QTY-042", {
  カテゴリの呼び名: "〔カテゴリレコードID-F0301-042〕",
  説明: "表示中の状態の在庫が2以上で、他の状態にも在庫があるカード商品", 正本: "数量確認カテゴリ（QTY-001-042: NM 300円在庫3・EX 500円在庫2）",
  判定: (c) => c.カード商品 && c.行.length >= 2 && (c.行[0].在庫 ?? 0) >= 2 && c.行[0].増減あり && c.行.slice(1).some((x) => (x.在庫 ?? 0) >= 1 && x.増減あり) && c.行.every((x) => x.規格ID !== ""),
  控える: (c) => ({ "〔商品レコードID-F0301-042〕": c.商品ID, "〔規格レコードID-F0301-042A〕": c.行[0].規格ID, "〔規格レコードID-F0301-042B〕": c.行.slice(1).find((x) => (x.在庫 ?? 0) >= 1 && x.増減あり)!.規格ID }),
  追記: (c) => `NM は表示中の状態「${c.行[0].状態}」、EX は在庫のある他の状態「${c.行.slice(1).find((x) => (x.在庫 ?? 0) >= 1 && x.増減あり)!.状態}」に読み替える（状態: ${行の説明(c)}）`,
});
defineCardSeed("S-F03-01-ZEROQTY-066", {
  カテゴリの呼び名: "〔カテゴリレコードID-F0301-066〕",
  説明: "表示中の状態に在庫があり、他の状態の在庫が2以上あるカード商品", 正本: "商品一覧確認カテゴリ-066（F0301-066-A: NM 300円在庫3・EX 500円在庫2 の1件だけ）",
  判定: (c) => c.カード商品 && c.行.length >= 2 && (c.行[0].在庫 ?? 0) >= 1 && c.行[0].増減あり && c.行.slice(1).some((x) => (x.在庫 ?? 0) >= 2 && x.増減あり) && c.行.every((x) => x.規格ID !== ""),
  控える: (c) => ({ "〔商品レコードID-F0301-066〕": c.商品ID, "〔規格レコードID-F0301-066A〕": c.行[0].規格ID, "〔規格レコードID-F0301-066B〕": c.行.slice(1).find((x) => (x.在庫 ?? 0) >= 2 && x.増減あり)!.規格ID }),
  追記: (c) => `NM は表示中の状態「${c.行[0].状態}」、EX は在庫2以上の他の状態「${c.行.slice(1).find((x) => (x.在庫 ?? 0) >= 2 && x.増減あり)!.状態}」に読み替える（状態: ${行の説明(c)}）`,
});
defineCardSeed("S-F03-01-QTY-080", {
  カテゴリの呼び名: "〔カテゴリレコードID-F0301-080〕",
  説明: "状態が1つだけで在庫が2〜10のカード商品", 正本: "数量確認カテゴリ-080（F0301-080-A: NMだけ 300円在庫3 の1件だけ）",
  判定: (c) => c.カード商品 && c.行.length === 1 && c.行[0].増減あり && (c.行[0].在庫 ?? 0) >= 2 && (c.行[0].在庫 ?? 0) <= 10 && c.行[0].規格ID !== "",
  控える: (c) => ({ "〔商品レコードID-F0301-080〕": c.商品ID }),
  追記: (c) => `NM・在庫3は、この商品の状態「${c.行[0].状態}」・在庫${c.行[0].在庫}に読み替える`,
});
defineCardSeed("S-F03-01-GOODSLINK-065", {
  カテゴリの呼び名: "〔カテゴリレコードID-F0301-065〕",
  説明: "グッズ商品（状態の表示が無い商品）", 正本: "商品一覧確認カテゴリ-065（グッズ商品F0301-065-G の1件だけ）",
  判定: (c) => !c.カード商品 && c.商品ID !== "",
  控える: (c) => ({ "〔商品レコードID-F0301-065〕": c.商品ID }),
});
defineCardSeed("S-F03-01-IMGZOOM-072", {
  カテゴリの呼び名: "〔カテゴリレコードID-F0301-072〕",
  説明: "商品画像のある商品", 正本: "商品一覧確認カテゴリ-072（F0301-072-A・画像 image-F0301-072-A.webp の1件だけ）",
  判定: (c) => c.画像 !== "" && !/no_image/i.test(c.画像),
  控える: (c) => ({ "〔商品レコードID-F0301-072〕": c.商品ID }),
  追記: (c) => `画像 image-F0301-072-A.webp は、この商品の一覧の画像（${c.画像}）に読み替える`,
});
/** 商品が1件以上出る既存のカテゴリと、その先頭の商品 */
function defineAnyProductSeed(seedId: string, n: string, 正本: string, カード商品だけ: boolean): void {
  defineCardSeed(seedId, {
    カテゴリの呼び名: `〔カテゴリレコードID-F0301-${n}〕`,
    説明: カード商品だけ ? "カード商品" : "商品", 正本,
    判定: (c) => c.商品ID !== "" && (!カード商品だけ || c.カード商品),
    控える: (c) => ({ [`〔商品レコードID-F0301-${n}〕`]: c.商品ID }),
  });
}
defineAnyProductSeed("S-F03-01-SPCAT-062", "062", "商品一覧確認カテゴリ-062（F0301-062-A の1件だけ）", false);
defineAnyProductSeed("S-F03-01-SPTYPE-063", "063", "商品一覧確認カテゴリ-063（カード商品F0301-063-A の1件だけ）", true);
defineAnyProductSeed("S-F03-01-TAGALL-076", "076", "商品一覧確認カテゴリ-076（F0301-076-A の1件だけ）", false);

defineSeed("S-F03-01-MIXSTOCK-081", async ({ browser, notes }) => {
  const id = "S-F03-01-MIXSTOCK-081";
  const { r, v } = await 公開側で(browser, (list) => カテゴリを探す(list, id, "在庫のあるカード商品と、すべての状態の在庫が0のカード商品が同じ1ページ目に並ぶカテゴリ", (x) => {
    const a = x.cards.find((c) => c.カード商品 && c.行.length === 1 && (c.行[0].在庫 ?? 0) >= 1 && c.行[0].増減あり);
    const b = x.cards.find((c) => c.カード商品 && c.行.length >= 1 && c.行.every((y) => y.在庫 === 0));
    return a && b ? { a, b } : null;
  }));
  notes.set("〔カテゴリレコードID-F0301-081〕", r.id);
  notes.set("〔商品レコードID-F0301-081A〕", v.a.商品ID);
  notes.set("〔商品レコードID-F0301-081B〕", v.b.商品ID);
  found.set(id, { カテゴリID: r.id, A: `${v.a.商品ID}|${v.a.言語}`, B: `${v.b.商品ID}|${v.b.言語}` });
  既存カテゴリの読み替え(id, "在庫混在カテゴリ-081（F0301-081-A 在庫3・F0301-081-B 在庫0 の2件だけ）", r,
    `F0301-081-A は在庫のある「${v.a.表示名}」（在庫${v.a.行[0].在庫}）、F0301-081-B は在庫0の「${v.b.表示名}」で代えた。カテゴリにはほかの商品もある`);
});

defineSeed("S-F03-01-FILTER-053", async ({ browser, notes }) => {
  const id = "S-F03-01-FILTER-053";
  const got = await 公開側で(browser, async (list) => {
    const { r } = await カテゴリを探す(list, id, "レアリティ・カラーの絞り込みがあるカテゴリ", (x) => (x.cards.length > 0 ? true : null));
    await list.openCategory(店舗の入口.本店, r.id);
    await list.絞り込みを押す(list.絞り込みボタン("rarity", "レア"));
    await list.絞り込みを押す(list.絞り込みボタン("colors", "赤"));
    const first = (await list.カードを読む())[0];
    if (!first) throw new Error(`${id}: カテゴリ ${r.id} でレア・赤に絞り込んだ結果に商品が無い`);
    return { r, first };
  });
  notes.set("〔カテゴリレコードID-F0301-053〕", got.r.id);
  notes.set("〔商品レコードID-F0301-053〕", got.first.商品ID);
  found.set(id, { カテゴリID: got.r.id });
  既存カテゴリの読み替え(id, "絞り込み確認カテゴリ-053（FILTER-ALL-053 ほか3件だけ）", got.r, `FILTER-ALL-053 は、このカテゴリをレア・赤で絞り込んだ結果の先頭の「${got.first.表示名}」で代えた`);
});

// ==== 店舗・タグ・ヘッダー検索（既存の商品） ====

defineSeed("S-F03-01-RECENT-007", async ({ browser, notes }) => {
  const id = "S-F03-01-RECENT-007";
  const got = await 公開側で(browser, async (list) => {
    const hq = await カテゴリを探す(list, id, "本店の商品一覧に出る商品", (x) => x.cards.find((c) => c.商品ID) ?? null);
    const osa = await カテゴリを探す(list, id, "TC大阪支店の商品一覧に出る、本店の商品と別の商品", (x) => x.cards.find((c) => c.商品ID && c.商品ID !== hq.v.商品ID) ?? null, { 店: 店舗の入口.TC大阪支店 });
    return { hq: hq.v, osa: osa.v };
  });
  notes.set("〔商品レコードID-F0301-007A〕", got.hq.商品ID);
  notes.set("〔商品レコードID-F0301-007B〕", got.osa.商品ID);
  found.set(id, { 本店の商品: got.hq.商品ID, 本店の商品名: got.hq.商品名, 支店の商品: got.osa.商品ID, 支店の商品名: got.osa.商品名 });
  読み替え(id, `REC-HQ-001-007（本店だけで公開）は本店の商品一覧に出る既存の「${got.hq.商品名}」（商品ID ${got.hq.商品ID}）、REC-OSA-001-007（TC大阪支店だけで公開）はTC大阪支店の商品一覧に出る既存の「${got.osa.商品名}」（商品ID ${got.osa.商品ID}）で代えた。店舗別の公開状態は画面で指定できない（DBで設定する前提）ため、どちらの商品も片方の店舗だけの公開であるとは限らない。閲覧履歴0件は、ケースを新しいブラウザの場で始めることで満たす`);
});

defineSeed("S-F03-01-TAGS-050", async ({ browser, notes }) => {
  const id = "S-F03-01-TAGS-050";
  const first = await 公開側で(browser, async (list) => {
    await list.open(店舗の入口.本店);
    await list.おすすめタグを押す("最新入荷アイテム");
    const c = (await list.カードを読む())[0];
    if (!c) throw new Error(`${id}: 「最新入荷アイテム」のタグの商品一覧に商品が無い`);
    return c;
  });
  notes.set("〔商品レコードID-F0301-050〕", first.商品ID);
  found.set(id, { 商品ID: first.商品ID, 言語: first.言語, 商品名: first.商品名 });
  読み替え(id, `TAG-NEW-001-050 を作ってタグに紐付け索引へ反映する前提は画面で作れないため、「最新入荷アイテム」のタグの商品一覧の先頭に出る既存の「${first.表示名}」（商品ID ${first.商品ID}）で代えた`);
});

defineSeed("S-F03-01-UNISEARCH-NORMAL-052", async ({ browser, notes }) => {
  const id = "S-F03-01-UNISEARCH-NORMAL-052";
  const { v } = await 公開側で(browser, (list) => カテゴリを探す(list, id, "商品名のある商品", (x) => x.cards.find((c) => c.商品名.trim().length >= 2) ?? null));
  notes.set("〔商品レコードID-F0301-052〕", v.商品ID);
  found.set(id, { 商品ID: v.商品ID, 言語: v.言語, 検索語: v.商品名 });
  読み替え(id, `検索語「F0301-NORMAL-052」と商品U-001-052（1200円・在庫4）を作って索引へ反映する前提は画面で作れないため、既存の商品「${v.商品名}」（商品ID ${v.商品ID}）とその商品名を検索語として代えた`);
});

// ==== 会員を使うシード（会員はフロントの会員登録で作る） ====

type 会員 = { メール: string; 会員ID: string };
/** フロントの会員登録で会員を作り、管理画面の会員一覧で会員IDを読む */
async function 会員を作る(browser: Browser, seedId: string, メールの前半: string): Promise<会員> {
  const メール = `${rc(メールの前半)}@example.test`;
  await 公開側で(browser, (_list, page) => registerFrontMember(page, { 姓: "試験", 名: "商品一覧", セイ: "シケン", メイ: "ショウヒンイチラン", メール, パスワード: 会員のパスワード }));
  const 会員ID = await withAdminSession(browser, SETUP_ADMIN as Account, async (page) => { page.setDefaultTimeout(60_000); return customerIdByEmail(page, メール); });
  読み替え(seedId, `会員はフロントの会員登録で作った（メール ${メール}）`);
  return { メール, 会員ID };
}
/** 会員でログインした公開側の場で操作する */
async function 会員で<T>(browser: Browser, メール: string, fn: (list: FrontProductList, page: Page) => Promise<T>): Promise<T> {
  return 公開側で(browser, async (list, page) => {
    await new FrontFavorite(page).login(メール, 会員のパスワード);
    return fn(list, page);
  });
}
/** 商品一覧のカードのボタンを押し、選択中の印が want になるのを待つ（お気に入り・入荷通知） */
async function 押して印を待つ(btn: import("@playwright/test").Locator, want: boolean, what: string): Promise<void> {
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await expect.poll(async () => /\bis-selected\b/.test((await btn.getAttribute("class")) ?? ""), { message: what, timeout: 20_000 }).toBe(want);
}

function defineFavoriteSeed(seedId: string, n: string, 前半: string, 登録する: boolean): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    const m = await 会員を作る(browser, seedId, 前半);
    const got = await 会員で(browser, m.メール, async (list) => {
      const { r, v } = await カテゴリを探す(list, seedId, "お気に入りのボタンがある商品", (x) => x.cards.find((c) => c.お気に入りボタン && !c.お気に入り済み) ?? null, { 使い回す: false });
      if (登録する) {
        await list.openCategory(店舗の入口.本店, r.id);
        await 押して印を待つ(list.カードのお気に入り(list.カード(v.商品ID, v.言語)), true, `${seedId}: 商品一覧でお気に入りへ追加を押して登録済みの表示になる`);
      }
      return { r, v };
    });
    notes.set(`〔会員レコードID-F0301-${n}〕`, m.会員ID);
    notes.set(`〔商品レコードID-F0301-${n}〕`, got.v.商品ID);
    found.set(seedId, { メール: m.メール, カテゴリID: got.r.id, 商品ID: got.v.商品ID, 言語: got.v.言語 });
    読み替え(seedId, `FAV-001-${n} は既存の商品「${got.v.表示名}」（商品ID ${got.v.商品ID}・${got.v.言語 || "言語なし"}。カテゴリID ${got.r.id} の商品一覧に出る）で代えた${登録する ? "。有効なお気に入り1件は、会員でログインして商品一覧のお気に入りへ追加を押して作った" : "。会員は作ったばかりで、お気に入りは0件"}`);
  });
}
defineFavoriteSeed("S-F03-01-FAV-043", "043", "f0301_043", false);
defineFavoriteSeed("S-F03-01-FAV-044", "044", "f0301_044", true);

defineSeed("S-F03-01-FAV-045", async ({ browser, notes }) => {
  const id = "S-F03-01-FAV-045";
  const m = await 会員を作る(browser, id, "f0301_045");
  // 本店と TC大阪支店の同じカテゴリの1ページ目に、同じ商品が出ているものを探す
  const got = await 公開側で(browser, async (list) => {
    for (const c of (await 左メニューを読む(list)).slice(0, 40)) {
      const hq = await カテゴリを読む(list, 店舗の入口.本店, c.id);
      if (hq.cards.length === 0) continue;
      const osa = await カテゴリを読む(list, 店舗の入口.TC大阪支店, c.id);
      const both = hq.cards.find((x) => x.商品ID && osa.cards.some((y) => y.商品ID === x.商品ID && y.言語 === x.言語));
      if (both) return { id: c.id, v: both };
    }
    throw new Error(`${id}: 本店とTC大阪支店の同じカテゴリの商品一覧（1ページ目）に、同じ商品が出ているものが無い`);
  });
  notes.set("〔会員レコードID-F0301-045〕", m.会員ID);
  notes.set("〔商品レコードID-F0301-045〕", got.v.商品ID);
  found.set(id, { メール: m.メール, カテゴリID: got.id, 商品ID: got.v.商品ID, 言語: got.v.言語 });
  読み替え(id, `FAV-001-045（本店・TC大阪支店で公開）は、本店とTC大阪支店のカテゴリID ${got.id} の商品一覧のどちらにも出る既存の「${got.v.表示名}」（商品ID ${got.v.商品ID}）で代えた`);
});

defineSeed("S-F03-01-FAVMIX-086", async ({ browser, notes }) => {
  const id = "S-F03-01-FAVMIX-086";
  const m = await 会員を作る(browser, id, "dpf0301-086");
  const got = await 会員で(browser, m.メール, async (list) => {
    const { r, v } = await カテゴリを探す(list, id, "お気に入りのボタンがある商品が2件以上並ぶカテゴリ", (x) => {
      const cs = x.cards.filter((c) => c.お気に入りボタン && !c.お気に入り済み);
      return cs.length >= 2 ? [cs[0], cs[1]] as const : null;
    }, { 使い回す: false });
    await list.openCategory(店舗の入口.本店, r.id);
    await 押して印を待つ(list.カードのお気に入り(list.カード(v[0].商品ID, v[0].言語)), true, `${id}: 商品一覧でお気に入りへ追加を押して登録済みの表示になる`);
    return { r, a: v[0], b: v[1] };
  });
  notes.set("〔カテゴリレコードID-F0301-086〕", got.r.id);
  notes.set("〔会員レコードID-F0301-086〕", m.会員ID);
  found.set(id, { メール: m.メール, カテゴリID: got.r.id, A: `${got.a.商品ID}|${got.a.言語}`, B: `${got.b.商品ID}|${got.b.言語}` });
  既存カテゴリの読み替え(id, "お気に入り混在カテゴリ-086（F0301-086-A・F0301-086-B の2件だけ）", got.r,
    `F0301-086-A は「${got.a.表示名}」（会員でログインして商品一覧のお気に入りへ追加を押して登録）、F0301-086-B は「${got.b.表示名}」（未登録）で代えた。カテゴリにはほかの商品もある`);
});

function defineNotifySeed(seedId: string, n: string, 前半: string, 登録する: boolean): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    const m = await 会員を作る(browser, seedId, 前半);
    const got = await 会員で(browser, m.メール, async (list) => {
      const { r, v } = await カテゴリを探す(list, seedId, "在庫0で入荷通知のボタンが出ていて、高額商品コード（#）の無い商品", (x) => {
        const c = x.cards.find((y) => !/#/.test(y.表示名) && y.通知ボタン.some((b) => !b.依頼済み && b.規格ID));
        return c ? { c, 規格ID: c.通知ボタン.find((b) => !b.依頼済み && b.規格ID)!.規格ID } : null;
      }, { 使い回す: false });
      if (登録する) {
        await list.openCategory(店舗の入口.本店, r.id);
        await 押して印を待つ(list.カードの通知ボタン(list.カード(v.c.商品ID, v.c.言語), v.規格ID), true, `${seedId}: 商品一覧で入荷通知を押して通知待ちの表示になる`);
      }
      return { r, v };
    });
    notes.set(`〔会員レコードID-F0301-${n}〕`, m.会員ID);
    notes.set(`〔商品レコードID-F0301-${n}〕`, got.v.c.商品ID);
    found.set(seedId, { メール: m.メール, カテゴリID: got.r.id, 商品ID: got.v.c.商品ID, 言語: got.v.c.言語, 規格ID: got.v.規格ID });
    読み替え(seedId, `NOTIFY-001-${n}（本店公開・高額商品コードなし）は、在庫0で入荷通知のボタンが出る既存の「${got.v.c.表示名}」（商品ID ${got.v.c.商品ID}・規格ID ${got.v.規格ID}。カテゴリID ${got.r.id} の商品一覧に出る）で代えた${登録する ? "。有効な入荷通知依頼1件は、会員でログインして商品一覧の入荷通知を押して作った" : "。会員は作ったばかりで、入荷通知依頼は0件"}`);
  });
}
defineNotifySeed("S-F03-01-NOTIFY-046", "046", "f0301_046", false);
defineNotifySeed("S-F03-01-NOTIFY-047", "047", "f0301_047", true);

// ==== バナー（画面で作ったカテゴリ・タグ・商品） ====

/** サプライ・グッズの下にカテゴリを作り、そのカテゴリのグッズ商品を1件取り込む。カテゴリIDと商品IDを返す */
async function バナー確認のカテゴリと商品(browser: Browser, seedId: string, 名前: string, html: string | null, 商品コード: string, タグID?: string): Promise<{ カテゴリID: string; 商品ID: string }> {
  return withAdminSession(browser, SETUP_ADMIN as Account, async (page) => {
    page.setDefaultTimeout(60_000);
    await readExistingGoodsChildCategoryId(page);
    const goodsTop = /\/product\/category\/(\d+)/.exec(new URL(page.url()).pathname)?.[1];
    if (!goodsTop) throw new Error(`${seedId}: サプライ・グッズのカテゴリIDを画面から読めない（${page.url()}）`);
    const cat = new CategoryPage(page);
    const カテゴリID = await cat.createChild(goodsTop, { nameJp: 名前, nameEn: "Banner Check", ...(html !== null ? { htmlJa: html } : {}) }, issue(seedId));
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${rc(seedId)}.csv`, categoryId: カテゴリID,
      lines: [{ code: 商品コード, nameJp: 商品コード, nameEn: 商品コード, values: { "基準価格": "1000", "販売価格": "1000", "買取価格": "100", ...(タグID ? { "タグ(ID)": タグID } : {}) } }],
      onWarning: issue(seedId), uploadWaitMs: 120_000,
    });
    const 商品ID = await openProductEditByCode(page, 商品コード);
    return { カテゴリID, 商品ID };
  });
}

defineSeed("S-F03-01-HTML-004", async ({ browser, notes }) => {
  const id = "S-F03-01-HTML-004";
  const banner = rc("CAT-BANNER");
  const html = `<p class="f0301-cat-banner">${banner}</p>`;
  const made = await バナー確認のカテゴリと商品(browser, id, rc("カテゴリバナー確認-004"), html, rc("BANNER-004"));
  notes.set("〔商品レコードID-F0301-004〕", made.商品ID);
  found.set(id, { カテゴリID: made.カテゴリID, カテゴリのバナー: banner });
  読み替え(id, `カテゴリID 2（表示用HTML=CAT-BANNER）は共有のマスタを書き換えることになるため、カテゴリ登録画面で作ったカテゴリ（カテゴリID ${made.カテゴリID}・埋め込みHTML(日)に「${banner}」）で代えた。商品BANNER-004 は印を付けた商品コードでこのカテゴリに取り込んだ（商品ID ${made.商品ID}）。ユニサーチフィードの送信と索引への反映は、バナーの表示に関わらないため行わない`);
});

defineSeed("S-F03-01-HTML-005", async ({ browser, notes }) => {
  const id = "S-F03-01-HTML-005";
  const tagBanner = rc("TAG-BANNER");
  const catBanner = rc("CAT-BANNER-005");
  const タグID = await withAdminSession(browser, SETUP_ADMIN as Account, async (page) => {
    page.setDefaultTimeout(60_000);
    const rows = await allTagRows(page);
    const tag = new TagPage(page);
    await tag.openNew();
    await tag.openOtherSettings();
    return tag.register({ 名称日: rc("タグバナー確認-005"), 名称英: "Tag Banner Check", 並び順: unusedSortNo(rows), フリーエリア日: `<p class="f0301-tag-banner">${tagBanner}</p>` }, `${id}: タグの登録`);
  });
  const made = await バナー確認のカテゴリと商品(browser, id, rc("カテゴリバナー確認-005"), `<p class="f0301-cat-banner">${catBanner}</p>`, rc("BANNER-005"), タグID);
  notes.set("〔商品レコードID-F0301-005〕", made.商品ID);
  found.set(id, { カテゴリID: made.カテゴリID, タグID, タグのバナー: tagBanner, カテゴリのバナー: catBanner });
  読み替え(id, `タグID 1（表示用HTML=TAG-BANNER）とカテゴリID 2（CAT-BANNER）は共有のマスタを書き換えることになるため、タグ登録画面で作ったタグ（タグID ${タグID}・フリーエリア(日)に「${tagBanner}」）と、カテゴリ登録画面で作ったカテゴリ（カテゴリID ${made.カテゴリID}・埋め込みHTML(日)に「${catBanner}」）で代えた。商品BANNER-005 は印を付けた商品コードでこのカテゴリ・タグに取り込んだ（商品ID ${made.商品ID}）。索引への反映は行わない`);
});

defineSeed("S-F03-01-NOBANNER-087", async ({ browser, notes }) => {
  const id = "S-F03-01-NOBANNER-087";
  const made = await バナー確認のカテゴリと商品(browser, id, rc("バナー無しカテゴリ-087"), null, rc("F0301-087-A"));
  notes.set("〔カテゴリレコードID-F0301-087〕", made.カテゴリID);
  notes.set("〔商品レコードID-F0301-087〕", made.商品ID);
  found.set(id, { カテゴリID: made.カテゴリID });
  読み替え(id, `カテゴリ「バナー無しカテゴリ-087」は印を付けた名前でカテゴリ登録画面から作り（埋め込みHTML(日)は空）、商品F0301-087-A は印を付けた商品コードでこのカテゴリに取り込んだ。索引への反映は、バナーが出ないことに関わらないため行わない（このカテゴリの商品一覧に商品は出ない）`);
});

// ==================== 2026-11-10（続き）: 未着手だった11件の読み替え ====================

/** 公開側で候補のカードを集める（左メニューのカテゴリの1ページ目から、最大 上限 件） */
async function 候補を集める(list: FrontProductList, 判定: (c: カード情報, r: 読んだカテゴリ) => boolean,
  opt: { 店?: string; 上限?: number; 使い回す?: boolean } = {}): Promise<{ r: 読んだカテゴリ; c: カード情報 }[]> {
  const out: { r: 読んだカテゴリ; c: カード情報 }[] = [];
  for (const cat of (await 左メニューを読む(list)).slice(0, 40)) {
    const r = await カテゴリを読む(list, opt.店 ?? 店舗の入口.本店, cat.id, opt.使い回す ?? true);
    for (const c of r.cards) if (判定(c, r)) out.push({ r, c });
    if (out.length >= (opt.上限 ?? 12)) break;
  }
  return out;
}
/** 候補を管理画面で1件ずつ確かめ、合う最初のものを返す（見つからなければ落とす） */
async function 管理画面で選ぶ<C, T>(browser: Browser, seedId: string, 説明: string, 候補: C[], 確かめる: (page: Page, c: C) => Promise<T | null>): Promise<{ c: C; v: T }> {
  return withAdminSession(browser, SETUP_ADMIN as Account, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const c of 候補) {
      const v = await 確かめる(page, c);
      if (v !== null) return { c, v };
    }
    throw new Error(`${seedId}: 公開側で見つけた候補 ${候補.length} 件に、管理画面で確かめて${説明}ものが無い`);
  });
}
const 高額商品コードの表示 = (c: カード情報) => /#\s*(\S+)\s*$/.exec(c.表示名)?.[1] ?? "";

defineSeed("S-F03-01-BREADCRUMB-002", async ({ browser, notes }) => {
  const id = "S-F03-01-BREADCRUMB-002";
  // カテゴリCSVで「スタンダード＞タルキール：龍嵐録＞タルキール：龍嵐録」を探す。無ければ3階層目のカテゴリで代える
  const rows = await withAdminSession(browser, SETUP_ADMIN as Account, async (page) => {
    page.setDefaultTimeout(60_000);
    const cat = new CategoryPage(page);
    await cat.openTop();
    return cat.downloadCsv();
  });
  const byId = new Map(rows.map((r) => [r["カテゴリID"], r]));
  const chain = (r: Record<string, string>): string[] => {
    const names: string[] = [];
    for (let x: Record<string, string> | undefined = r; x; x = byId.get(x["親カテゴリID"] ?? "")) {
      names.unshift(x["カテゴリ名(日)"]);
      if (names.length > 6) break;
    }
    return names;
  };
  const 正本 = ["スタンダード", "タルキール：龍嵐録", "タルキール：龍嵐録"];
  let leaf = rows.find((r) => chain(r).join(">") === 正本.join(">"));
  const 正本どおり = !!leaf;
  if (!leaf) leaf = rows.find((r) => chain(r).length === 3 && r["フロント非表示フラグ"] !== "1");
  if (!leaf) throw new Error(`${id}: カテゴリCSVに3階層のカテゴリが無い`);
  const 葉 = leaf;
  const 階層 = chain(葉);
  const got = await 公開側で(browser, async (list) => {
    await list.open(店舗の入口.本店);
    const tag = (await list.おすすめタグのリンク()).find((t) => t.name === "デッキセット");
    if (!tag) throw new Error(`${id}: 「おすすめ商品から探す」にデッキセットのタグが無い`);
    const r = await カテゴリを読む(list, 店舗の入口.本店, 葉["カテゴリID"]);
    let c = r.cards[0];
    if (!c) { await list.open(店舗の入口.本店, `/products/search/tags/${tag.id}`); await list.結果を待つ(); c = (await list.カードを読む())[0]; }
    if (!c) throw new Error(`${id}: カテゴリ・デッキセットのタグの商品一覧に商品が無い`);
    return { tag, c };
  });
  notes.set("〔商品レコードID-F0301-002〕", got.c.商品ID);
  found.set(id, { カテゴリID: 葉["カテゴリID"], 階層: 階層.join("|"), タグID: got.tag.id, 検索語: got.c.商品名 });
  読み替え(id, `BREAD-001-002 を作って索引へ反映する前提は画面で作れないため、既存の${正本どおり ? "" : "（正本の階層が無いので3階層目の）"}カテゴリ「${階層.join("＞")}」（カテゴリID ${葉["カテゴリID"]}）・既存のタグ「デッキセット」（タグID ${got.tag.id}）と、既存の商品「${got.c.商品名}」（商品ID ${got.c.商品ID}。商品名パラメータに使う）で代えた`);
});

defineSeed("S-F03-01-HTML-010", async ({ browser, notes }) => {
  const id = "S-F03-01-HTML-010";
  const got = await 公開側で(browser, async (list) => {
    await list.open(店舗の入口.本店);
    const ok = { カテゴリ2: await list.選択肢があるか("category", "2"), フォーマット3: await list.選択肢があるか("format", "3") };
    if (!ok.カテゴリ2 || !ok.フォーマット3) throw new Error(`${id}: 商品一覧の検索の欄にカテゴリID 2・フォーマットID 3の選択肢が無い（${JSON.stringify(ok)}）`);
    await list.open(店舗の入口.本店, "/products/search/tags/1/cate/2?format=3");
    await list.結果を待つ();
    let c = (await list.カードを読む())[0];
    if (!c) { await list.open(店舗の入口.本店, "/products/search/tags/1"); await list.結果を待つ(); c = (await list.カードを読む())[0]; }
    if (!c) throw new Error(`${id}: タグID 1の商品一覧に商品が無い`);
    return c;
  });
  notes.set("〔商品レコードID-F0301-010〕", got.商品ID);
  found.set(id, { 商品ID: got.商品ID });
  読み替え(id, `SEO-010 を作って索引へ反映する前提は画面で作れないため、既存のタグID 1・カテゴリID 2・フォーマットID 3（商品一覧の検索の欄に選択肢があることを確かめた）と、その検索で出る既存の商品「${got.表示名}」（商品ID ${got.商品ID}）で代えた`);
});

defineSeed("S-F03-01-HTML-011", async ({ browser, notes }) => {
  const id = "S-F03-01-HTML-011";
  await withAdminSession(browser, SETUP_ADMIN as Account, async (page) => {
    page.setDefaultTimeout(60_000);
    const rows = await allTagRows(page);
    const missing = ["1", "2", "3"].filter((t) => !rows.some((r) => r.ID === t));
    if (missing.length) throw new Error(`${id}: 管理画面のタグ一覧にタグID ${missing.join("・")} が無い`);
  });
  const got = await 公開側で(browser, async (list) => {
    for (const p of ["/products/search/tags/1-2-3", "/products/search/tags/1"]) {
      await list.open(店舗の入口.本店, p);
      await list.結果を待つ();
      const c = (await list.カードを読む())[0];
      if (c) return c;
    }
    throw new Error(`${id}: タグID 1の商品一覧に商品が無い`);
  });
  notes.set("〔商品レコードID-F0301-011〕", got.商品ID);
  found.set(id, { 商品ID: got.商品ID });
  読み替え(id, `SEO-011 を作って索引へ反映する前提は画面で作れないため、既存のタグID 1・2・3（管理画面のタグ一覧にあることを確かめた）と、既存の商品「${got.表示名}」（商品ID ${got.商品ID}）で代えた`);
});

defineSeed("S-F03-01-PAGING-024", async ({ browser, notes }) => {
  const id = "S-F03-01-PAGING-024";
  const { r } = await 公開側で(browser, (list) => カテゴリを探す(list, id, "商品数が121〜180件（設計の60件で3ページ）のカテゴリ", (x) => (x.件数 !== null && x.件数 >= 121 && x.件数 <= 180 ? true : null)));
  notes.set("〔カテゴリレコードID-F0301-024〕", r.id);
  found.set(id, { カテゴリID: r.id, 件数: String(r.件数) });
  既存カテゴリの読み替え(id, "ページング確認カテゴリ-024（PAGE-001-024〜PAGE-121-024 の121件だけ）", r, `121件は、このカテゴリの商品数 ${r.件数}点に読み替え（3ページ目は ${(r.件数 ?? 0) - 120}点）`);
});

defineSeed("S-F03-01-VIEW-033", async ({ browser, notes }) => {
  const id = "S-F03-01-VIEW-033";
  const 候補 = await 公開側で(browser, (list) => 候補を集める(list, (c) => c.カード商品 && c.言語 === "JP" && 高額商品コードの表示(c) !== "" && !!c.行[0]?.規格ID));
  const high = await 管理画面で選ぶ(browser, id, "言語が日本語で高額商品コードが入った", 候補, async (page, x) => {
    const a = await 商品規格の属性を読む(page, x.c.商品ID, x.c.行[0].規格ID);
    if (a.高額商品コード === "") return null;
    const row = (await 商品規格の一覧を読む(page, x.c.商品ID)).find((y) => y.規格ID === x.c.行[0].規格ID);
    return row && /日本語|JP/.test(row.言語) ? { 高額商品コード: a.高額商品コード, 言語: row.言語 } : null;
  });
  const goods = await 公開側で(browser, (list) => カテゴリを探す(list, id, "グッズ商品", (x) => x.cards.find((c) => !c.カード商品 && c.商品ID) ?? null));
  notes.set("〔カテゴリレコードID-F0301-033〕", high.c.r.id);
  notes.set("〔商品レコードID-F0301-033A〕", high.c.c.商品ID);
  notes.set("〔商品レコードID-F0301-033B〕", goods.v.商品ID);
  found.set(id, { カテゴリID: high.c.r.id, 高額: `${high.c.c.商品ID}|${high.c.c.言語}`, 高額商品コード: high.v.高額商品コード, グッズのカテゴリID: goods.r.id, グッズ: `${goods.v.商品ID}|${goods.v.言語}` });
  読み替え(id, `表示属性確認カテゴリの VIEW-HIGH-033（言語JP・高額商品コード#9250）は、既存のカテゴリID ${high.c.r.id} の「${high.c.c.商品名}」（商品ID ${high.c.c.商品ID}。管理画面の商品規格で言語「${high.v.言語}」・高額商品コード「${high.v.高額商品コード}」を確かめた）、VIEW-GOODS-033 は既存のカテゴリID ${goods.r.id} のグッズ商品「${goods.v.表示名}」（商品ID ${goods.v.商品ID}）で代えた。2件は同じカテゴリに無いため、ケースはグッズ商品のカテゴリも開く`);
});

defineSeed("S-F03-01-NOSALE-084", async ({ browser, notes }) => {
  const id = "S-F03-01-NOSALE-084";
  const 候補 = await 公開側で(browser, (list) => 候補を集める(list, (c) => !!c.行[0]?.規格ID));
  const got = await 管理画面で選ぶ(browser, id, "セールフラグが入っていない", 候補, async (page, x) => ((await 商品規格の属性を読む(page, x.c.商品ID, x.c.行[0].規格ID)).セール ? null : true));
  notes.set("〔カテゴリレコードID-F0301-084〕", got.c.r.id);
  notes.set("〔商品レコードID-F0301-084〕", got.c.c.商品ID);
  found.set(id, { 商品ID: got.c.c.商品ID, 言語: got.c.c.言語 });
  既存カテゴリの読み替え(id, "セール確認カテゴリ-084（F0301-084-A の1件だけ）", got.c.r, `F0301-084-A は既存の「${got.c.c.表示名}」（商品ID ${got.c.c.商品ID}。表示中の状態の商品規格 ${got.c.c.行[0].規格ID} のセールフラグが入っていないことを管理画面で確かめた）で代えた。カテゴリにはほかの商品もある`);
});

/** 状態が1種類だけ（商品規格が1件だけ）の既存のカード商品。NM の要否で選ぶ */
function defineOneStateSeed(seedId: string, n: string, NMだけ: boolean, 正本: string): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    const 候補 = await 公開側で(browser, (list) => 候補を集める(list, (c) => c.カード商品 && c.行.length === 1 && NMか(c.行[0].状態) === NMだけ));
    const got = await 管理画面で選ぶ(browser, seedId, NMだけ ? "商品規格がNMの1件だけの" : "商品規格がNM以外の1件だけ（NMの規格が無い）の", 候補, async (page, x) => {
      const rows = await 商品規格の一覧を読む(page, x.c.商品ID);
      return rows.length === 1 && NMか(rows[0].状態) === NMだけ ? rows[0] : null;
    });
    notes.set(`〔カテゴリレコードID-F0301-${n}〕`, got.c.r.id);
    notes.set(`〔商品レコードID-F0301-${n}〕`, got.c.c.商品ID);
    found.set(seedId, { 商品ID: got.c.c.商品ID, 言語: got.c.c.言語, 状態: got.v.状態 });
    既存カテゴリの読み替え(seedId, 正本, got.c.r, `カード商品は既存の「${got.c.c.表示名}」（商品ID ${got.c.c.商品ID}。管理画面の商品規格一覧で、商品規格が状態「${got.v.状態}」の1件だけであることを確かめた。価格・在庫は正本の値と違う）で代えた。カテゴリにはほかの商品もある`);
  });
}
defineOneStateSeed("S-F03-01-ONESTATE-073", "073", true, "商品一覧確認カテゴリ-073（F0301-073-A: NMだけ 300円在庫3 の1件だけ）");
defineOneStateSeed("S-F03-01-ONESTATE-078", "078", false, "商品一覧確認カテゴリ-078（F0301-078-A: EXだけ 400円在庫3 の1件だけ）");

const 在庫なしで高額 = (c: カード情報) => c.行.length > 0 && c.行.every((x) => x.在庫 === 0) && 高額商品コードの表示(c) !== "" && !!c.行[0].規格ID;
const 在庫なしで普通 = (c: カード情報) => c.行.length > 0 && c.行.every((x) => x.在庫 === 0) && 高額商品コードの表示(c) === "";

defineSeed("S-F03-01-NOTIFY-048", async ({ browser, notes }) => {
  const id = "S-F03-01-NOTIFY-048";
  const 候補 = await 公開側で(browser, (list) => 候補を集める(list, (c) => 在庫なしで高額(c)));
  const a = await 管理画面で選ぶ(browser, id, "高額商品コードが入った", 候補, async (page, x) => {
    const v = await 商品規格の属性を読む(page, x.c.商品ID, x.c.行[0].規格ID);
    return v.高額商品コード ? v.高額商品コード : null;
  });
  const b = await 公開側で(browser, (list) => カテゴリを探す(list, id, "TC大阪支店の一覧に出る在庫0で高額商品コードの無い商品", (x) => x.cards.find(在庫なしで普通) ?? null, { 店: 店舗の入口.TC大阪支店 }));
  notes.set("〔商品レコードID-F0301-048A〕", a.c.c.商品ID);
  notes.set("〔商品レコードID-F0301-048B〕", b.v.商品ID);
  found.set(id, { 本店のカテゴリID: a.c.r.id, A: `${a.c.c.商品ID}|${a.c.c.言語}`, 支店のカテゴリID: b.r.id, B: `${b.v.商品ID}|${b.v.言語}` });
  読み替え(id, `NOTIFY-HIGH-048（高額商品コード948048）は、本店のカテゴリID ${a.c.r.id} に出る在庫0の既存の「${a.c.c.表示名}」（商品ID ${a.c.c.商品ID}。管理画面で高額商品コード「${a.v}」を確かめた）、NOTIFY-001-048 は TC大阪支店のカテゴリID ${b.r.id} に出る在庫0・高額商品コードなしの既存の「${b.v.表示名}」（商品ID ${b.v.商品ID}）で代えた`);
});

defineSeed("S-F03-01-NOTIFYMIX-085", async ({ browser, notes }) => {
  const id = "S-F03-01-NOTIFYMIX-085";
  const m = await 会員を作る(browser, id, "dpf0301-085");
  // 会員でログインして、同じカテゴリの1ページ目に、在庫0で通知ボタンのある普通の商品2件と、在庫0の高額商品コード付きの商品が並ぶものを探す
  const 候補 = await 会員で(browser, m.メール, async (list) => {
    const out: { r: 読んだカテゴリ; a: カード情報; b: カード情報; cs: カード情報[] }[] = [];
    for (const cat of (await 左メニューを読む(list)).slice(0, 40)) {
      const r = await カテゴリを読む(list, 店舗の入口.本店, cat.id, false);
      const normal = r.cards.filter((c) => 在庫なしで普通(c) && c.通知ボタン.some((b) => !b.依頼済み && b.規格ID));
      const highs = r.cards.filter(在庫なしで高額);
      if (normal.length >= 2 && highs.length >= 1) out.push({ r, a: normal[0], b: normal[1], cs: highs });
      if (out.length >= 3) break;
    }
    return out;
  });
  const got = await 管理画面で選ぶ(browser, id, "高額商品コードが入った商品がある", 候補, async (page, x) => {
    for (const c of x.cs) if ((await 商品規格の属性を読む(page, c.商品ID, c.行[0].規格ID)).高額商品コード) return c;
    return null;
  });
  const 規格ID = got.c.a.通知ボタン.find((b) => !b.依頼済み && b.規格ID)!.規格ID;
  await 会員で(browser, m.メール, async (list) => {
    await list.openCategory(店舗の入口.本店, got.c.r.id);
    await 押して印を待つ(list.カードの通知ボタン(list.カード(got.c.a.商品ID, got.c.a.言語), 規格ID), true, `${id}: 商品一覧で入荷通知を押して通知待ちの表示になる`);
  });
  notes.set("〔カテゴリレコードID-F0301-085〕", got.c.r.id);
  notes.set("〔会員レコードID-F0301-085〕", m.会員ID);
  found.set(id, { メール: m.メール, A: `${got.c.a.商品ID}|${got.c.a.言語}`, B: `${got.c.b.商品ID}|${got.c.b.言語}`, C: `${got.v.商品ID}|${got.v.言語}` });
  既存カテゴリの読み替え(id, "入荷通知混在カテゴリ-085（F0301-085-A・B・C の3件だけ）", got.c.r,
    `F0301-085-A は在庫0の「${got.c.a.表示名}」（会員でログインして商品一覧の入荷通知を押して依頼1件を作った）、F0301-085-B は在庫0の「${got.c.b.表示名}」（依頼なし）、F0301-085-C は在庫0で高額商品コード付きの「${got.v.表示名}」（管理画面で高額商品コードを確かめた）で代えた。カテゴリにはほかの商品もある`);
});

defineSeed("S-F03-01-CATSORT-088", async ({ browser, notes }) => {
  const id = "S-F03-01-CATSORT-088";
  // 左メニューに見えている既存のカテゴリのうち、検索パラメータが空で、価格の違う商品が3件以上出るものを親にする
  const front = await 公開側で(browser, async (list) => {
    await list.open(店舗の入口.本店);
    const visible = await list.左メニューのカテゴリ();
    const 価格低い順 = await list.並び順のID("価格(低い順)");
    const 欄 = await list.並び順の欄の名前();
    const cands: { id: string; name: string }[] = [];
    for (const c of visible.slice(0, 15)) {
      const r = await カテゴリを読む(list, 店舗の入口.本店, c.id);
      if (new Set(r.cards.map((x) => x.行[0]?.価格).filter((p) => typeof p === "number")).size >= 3) cands.push(c);
    }
    return { cands, 価格低い順, 欄 };
  });
  if (!front.価格低い順) throw new Error(`${id}: 並び順「価格(低い順)」の番号を画面から読めない`);
  const 名前 = rc("ソート順設定カテゴリ-088");
  const made = await withAdminSession(browser, SETUP_ADMIN as Account, async (page) => {
    page.setDefaultTimeout(60_000);
    const cat = new CategoryPage(page);
    for (const c of front.cands) {
      await cat.openEdit(c.id);
      if ((await cat.searchParameters.inputValue()).trim() !== "") continue;
      const newId = await cat.createChild(c.id, { nameJp: 名前, nameEn: "Sort Check", searchParameters: `${front.欄}=${front.価格低い順}` }, issue(id));
      return { 親: c, newId };
    }
    throw new Error(`${id}: 左メニューに見えているカテゴリに、検索パラメータが空で価格の違う商品が3件以上出るものが無い`);
  });
  notes.set("〔カテゴリレコードID-F0301-088〕", made.newId);
  found.set(id, { カテゴリ名: 名前, 親カテゴリID: made.親.id });
  読み替え(id, `カテゴリ「ソート順設定カテゴリ-088」は、既存のカテゴリ「${made.親.name}」（カテゴリID ${made.親.id}）の下に、印を付けた名前「${名前}」・検索パラメータ「${front.欄}=${front.価格低い順}」（価格(低い順)）でカテゴリ登録画面から作った（カテゴリID ${made.newId}）。商品F0301-088-HIGH/LOW/MID を作って索引へ反映する前提は画面で作れないため、検索パラメータのあるカテゴリが検索に使う親カテゴリの既存の商品で代えた`);
});


