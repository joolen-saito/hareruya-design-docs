/**
 * F03-04 カテゴリ一覧の画面シード。正本: cases/F03-04_seed_data.tsv
 *
 * 作り方（シード表の投入方法の順）:
 * 1. 管理画面の「カテゴリ登録CSV」画面で、カテゴリIDと表示ランクを空にした新規登録用のCSVを取り込む。
 *    カテゴリ一覧（最上位、または親を開いた一覧）の行から、振られたカテゴリIDを控える。
 * 2. 同じ画面で、控えたカテゴリIDと表示ランクを入れた更新用のCSVを取り込み、表示順を設定する。
 * 3. 管理画面のキャッシュ管理で「キャッシュ削除」を押し、カテゴリ表示用キャッシュを削除する。
 *
 * 2026-11-10 の方針（既存データへの読み替え）で作るようにしたもの（記録 e2e/review/F03-04_progress_2026-11-11.md）:
 * - CATEGORIES: カテゴリID 100〜600は画面で指定できない。アプリの最新セット・スタンダード・パイオニア・モダン・レガシー・統率者は
 *   既存のカテゴリ（ID 1〜6。統率者の名称は「コマンダー」）なので、読むだけで使う（書き換えない）。その下の子・孫と、サプライ・ヴィンテージ・デッキケースは、
 *   カテゴリ登録CSV画面で、実行の印つきの名称で作る（既存の親の下に印つきの子が増えるだけで、既存の行は変えない）。表示順は設定していない（ケースが順を見ない）。
 * - PRODUCTS: 商品を作って検索サービスへ送る前提は画面で作れない。商品ID A〜G は、本店の商品一覧に出る既存の商品の先頭から7件に読み替えた
 *   （カテゴリへの紐付けは作らない。使うケースは商品の表示を確かめない）。
 *
 * 決め打ちの識別の値（カテゴリ名）には、実行ごとの印を付ける（rc。依頼者決定 2026-10-28）。
 * カテゴリ名(英)は「任意の英語名」と定める行は印なしの英語名、正本が値を定める行（015）は正本の値のまま。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { CategoryCsvRow } from "../pages/admin/category";
import { キャッシュを削除する, 最上位に取り込む } from "../pages/admin/f03_04_category";
import { ensureMember } from "../pages/admin/member";
import { CategoryPage } from "../pages/admin/category";
import { FrontProductList, 公開側の場 } from "../pages/front/f03_01_product_list";

export const F0304_ADMIN: Account = { loginId: "f0304_admin", password: "Passw0rd!F0304" };

/** 作ったカテゴリのカテゴリID（ケースの文のカテゴリ名＝正本の値から引く） */
const ids = new Map<string, string>();
export function カテゴリID(正本のカテゴリ名: string): string {
  const id = ids.get(rc(正本のカテゴリ名));
  if (!id) throw new Error(`カテゴリ「${正本のカテゴリ名}」はまだ作っていない`);
  return id;
}

/** シード表の状態・属性・投入方法に出てくる呼び名（〔カテゴリID-F0304-xxx〕）を、作ったカテゴリIDから控える */
function noteLabels(seedId: string, notes: Notes, byKey: Record<string, string>): void {
  const seed = getSeed(seedId);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    const m = /^〔カテゴリID-F0304-(.+)〕$/.exec(label);
    if (!m) throw new Error(`${seedId}: 呼び名 ${label} の形が読めない`);
    const id = byKey[m[1].replace(/^共有/, "")];
    if (!id) throw new Error(`${seedId}: 呼び名 ${label} に当たるカテゴリが無い`);
    notes.set(label, id);
  }
}

const row = (r: Partial<CategoryCsvRow> & Pick<CategoryCsvRow, "nameJp" | "nameEn" | "parentId">): CategoryCsvRow => r;

/** 最上位（親の指定なし）に新規登録して、カテゴリIDを一覧の行から読む。名称は実行の印つきで一意 */
async function registerTops(browser: Browser, seedId: string, defs: { key: string; name: string; en: string; rank: string; frontHide?: "0" | "1"; branchHide?: "0" | "1" }[],
  children: { key: string; parentKey: string; name: string; en: string; rank: string }[] = []): Promise<Record<string, string>> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const byKey: Record<string, string> = {};
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    // 1. 新規登録（カテゴリIDと表示ランクは空）
    const category = await 最上位に取り込む(page, defs.map((d) => row({ nameJp: rc(d.name), nameEn: d.en, parentId: "0", frontHide: d.frontHide, branchHide: d.branchHide })),
      `${seedId}-1.csv`, `${seedId} のカテゴリ登録CSV（最上位の新規登録）`, issue);
    for (const d of defs) { byKey[d.key] = await category.idOf(rc(d.name)); ids.set(rc(d.name), byKey[d.key]); }
    // 子カテゴリ（親ごとに取り込み、親を開いた一覧からカテゴリIDを読む）
    for (const parentKey of [...new Set(children.map((c) => c.parentKey))]) {
      const kids = children.filter((c) => c.parentKey === parentKey);
      const parentId = byKey[parentKey];
      const list = await 最上位に取り込む(page, kids.map((c) => row({ nameJp: rc(c.name), nameEn: c.en, parentId, frontHide: "0", branchHide: "0" })),
        `${seedId}-2-${parentKey}.csv`, `${seedId} のカテゴリ登録CSV（親 ${parentId} の子の新規登録）`, issue);
      await list.openChildrenOf(parentId);
      for (const c of kids) { byKey[c.key] = await list.idOf(rc(c.name)); ids.set(rc(c.name), byKey[c.key]); }
    }
    // 2. 表示順を設定する更新（ほかの列は登録時と同じ値）
    const updates: CategoryCsvRow[] = [
      ...defs.map((d) => row({ id: byKey[d.key], rank: d.rank, nameJp: rc(d.name), nameEn: d.en, parentId: "0", frontHide: d.frontHide, branchHide: d.branchHide })),
      ...children.map((c) => row({ id: byKey[c.key], rank: c.rank, nameJp: rc(c.name), nameEn: c.en, parentId: byKey[c.parentKey], frontHide: "0", branchHide: "0" })),
    ];
    await 最上位に取り込む(page, updates, `${seedId}-3.csv`, `${seedId} のカテゴリ登録CSV（表示順の設定）`, issue);
    // 3. カテゴリ表示用キャッシュの削除
    await キャッシュを削除する(page, seedId, issue);
  });
  return byKey;
}

defineSeed("S-F03-04-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    // 正本は所属店舗を指定しない。管理画面で利用可能な店舗を1つ選び、カテゴリ登録を操作できるシステム管理者の権限を付ける（M03-11 と同じ作り方）
    await page.goto(adminUrl("/setting/system/member/new"));
    const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((os) => os
      .map((o) => o as HTMLOptionElement).filter((o) => o.value !== "").map((o) => o.textContent?.trim() ?? "").filter(Boolean));
    if (stores.length === 0) throw new Error("S-F03-04-ADM: メンバーに割り当てられる店舗が画面に無い");
    await ensureMember(page, {
      名前: "F03-04試験管理者", 所属店舗: stores[0], ログインID: F0304_ADMIN.loginId, メールアドレス: "f0304_admin@example.test",
      パスワード: F0304_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: stores[0], 編集可能店舗: [stores[0]],
    });
  });
  reportSeedIssue("S-F03-04-ADM", "権限は、カテゴリ登録を操作できる「システム管理者」にした（正本に権限の名前が無い）");
});

defineSeed("S-F03-04-ORDER", async ({ browser, notes }) => {
  const seedId = "S-F03-04-ORDER";
  const byKey = await registerTops(browser, seedId, [
    { key: "M", name: "並び順30カテゴリ", en: "Order 30 Category", rank: "30" },
    { key: "N", name: "並び順20カテゴリ", en: "Order 20 Category", rank: "20" },
    { key: "O", name: "並び順10カテゴリ", en: "Order 10 Category", rank: "10" },
  ], [
    { key: "P", parentKey: "M", name: "子カテゴリ30", en: "Child Category 30", rank: "30" },
    { key: "Q", parentKey: "M", name: "子カテゴリ20", en: "Child Category 20", rank: "20" },
    { key: "R", parentKey: "M", name: "子カテゴリ10", en: "Child Category 10", rank: "10" },
  ]);
  noteLabels(seedId, notes, byKey);
});

defineSeed("S-F03-04-FLAGS", async ({ browser, notes }) => {
  const seedId = "S-F03-04-FLAGS";
  const byKey = await registerTops(browser, seedId, [
    { key: "S", name: "フロント表示カテゴリ", en: "Front Visible Category", rank: "2", frontHide: "0", branchHide: "0" },
    { key: "T", name: "フロント非表示カテゴリ", en: "Front Hidden Category", rank: "1", frontHide: "1", branchHide: "0" },
  ]);
  noteLabels(seedId, notes, byKey);
});

defineSeed("S-F03-04-REGISTER-PARENT-015", async ({ browser, notes }) => {
  const seedId = "S-F03-04-REGISTER-PARENT-015";
  const byKey = await registerTops(browser, seedId, [
    { key: "015", name: "レアリティ登録先カテゴリ", en: "Rarity Registration Parent", rank: "0", frontHide: "0", branchHide: "0" },
  ]);
  noteLabels(seedId, notes, byKey);
});

/** 支店・本店の表示フラグを確かめるシード（ケース専用）。名称の末尾の「-A」までが正本の値 */
async function flagSeed(browser: Browser, notes: Notes, no: "028" | "029" | "030", front: "0" | "1", branch: "0" | "1"): Promise<void> {
  const seedId = `S-F03-04-CBFLAG-${no}`;
  const byKey = await registerTops(browser, seedId, [
    { key: no, name: `フラグ確認カテゴリ F0304-CB${no}-A`, en: `Flag Check F0304-CB${no}-A`, rank: "0", frontHide: front, branchHide: branch },
  ]);
  noteLabels(seedId, notes, byKey);
}
defineSeed("S-F03-04-CBFLAG-028", ({ browser, notes }) => flagSeed(browser, notes, "028", "0", "1"));
defineSeed("S-F03-04-CBFLAG-029", ({ browser, notes }) => flagSeed(browser, notes, "029", "0", "1"));
defineSeed("S-F03-04-CBFLAG-030", ({ browser, notes }) => flagSeed(browser, notes, "030", "1", "0"));

// ==== 既存のカテゴリ・商品に読み替えるシード（依頼者の方針 2026-11-10） ====

/** 子・孫のカテゴリの定義（キーはシード表の呼び名の末尾の英字。親は既存のカテゴリの名称か、作ったカテゴリのキー） */
/** 固定の試験用の名称（実行の印は付けない。無いときだけ作り、あれば使い回す） */
export const 試験名 = (name: string): string => `${name}(E2E試験-F0304)`;
const 作るカテゴリ: { key: string; 親: { 既存: string } | { 作った: string } | "最上位"; name: string; en: string; sp?: string }[] = [
  { key: "A", 親: { 既存: "最新セット" }, name: "タルキール：龍嵐録", en: "Tarkir: Dragonstorm" },
  { key: "F", 親: { 既存: "最新セット" }, name: "【予約販売】FF", en: "Pre-order FF" },
  { key: "G", 親: { 既存: "スタンダード" }, name: "エルドレインの森 ブースター・ファン", en: "Edge of Eldraine Booster Fan" },
  { key: "I", 親: { 既存: "パイオニア" }, name: "ラヴニカの献身", en: "Ravnica Allegiance" },
  { key: "J", 親: "最上位", name: "サプライ", en: "Supplies" },
  { key: "L", 親: "最上位", name: "ヴィンテージ", en: "Vintage" },
  { key: "B", 親: { 作った: "A" }, name: "タルキール：龍嵐録 ブースター・ファン", en: "Tarkir: Dragonstorm Booster Fan" },
  { key: "H", 親: { 作った: "G" }, name: "アンコモン", en: "Uncommon", sp: "rarity=2" },
  { key: "K", 親: { 作った: "J" }, name: "デッキケース", en: "Deck Case" },
  { key: "C", 親: { 作った: "B" }, name: "神話レア＆レア", en: "Mythic Rare and Rare", sp: "rarity[0]=4&rarity[1]=3" },
  { key: "D", 親: { 作った: "B" }, name: "アンコモン", en: "Uncommon", sp: "rarity=2" },
  { key: "E", 親: { 作った: "B" }, name: "コモン", en: "Common", sp: "rarity=1" },
];
/** 作った順（親が先）で、親が同じものを1回のCSV取込にまとめる */
const 段 = (d: (typeof 作るカテゴリ)[number]): number => (d.親 === "最上位" || "既存" in d.親 ? 1 : 1 + 段(作るカテゴリ.find((x) => x.key === (d.親 as { 作った: string }).作った)!));

defineSeed("S-F03-04-CATEGORIES", async ({ browser, notes }) => {
  const seedId = "S-F03-04-CATEGORIES";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const byKey: Record<string, string> = {};
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const category = new CategoryPage(page);
    // 既存のカテゴリ（最新セット・スタンダード・パイオニアなど）は、一覧から読むだけ。無ければ止める
    await category.openTop();
    const top = await category.rowValues();
    const 既存 = (name: string): string => {
      const hit = top.filter((r) => r.nameJp === name);
      if (hit.length !== 1) throw new Error(`${seedId}: 最上位に既存のカテゴリ「${name}」が ${hit.length} 件ある（1件のはず）。既存のカテゴリは書き換えない・作らないので止める`);
      return hit[0].id;
    };
    const 既存ID: Record<string, string> = {};
    for (const n of ["最新セット", "スタンダード", "パイオニア", "モダン", "レガシー"]) 既存ID[n] = 既存(n);
    issue(`シード作成時の問題（読み替え）: ID 100・200・300・400・500・600 は画面で指定できない。最新セット（ID ${既存ID["最新セット"]}）・スタンダード（${既存ID["スタンダード"]}）・パイオニア（${既存ID["パイオニア"]}）・モダン（${既存ID["モダン"]}）・レガシー（${既存ID["レガシー"]}）は既存のカテゴリを読むだけで使った。統率者は既存のカテゴリ「コマンダー」に当たる（名称は書き換えていない）`);
    let 作った = false;
    for (const lv of [1, 2, 3]) {
      const defs = 作るカテゴリ.filter((d) => 段(d) === lv);
      const parentOf = (d: (typeof defs)[number]): string => d.親 === "最上位" ? "0" : "既存" in d.親 ? 既存ID[d.親.既存] : byKey[d.親.作った];
      const parents = [...new Set(defs.map(parentOf))];
      const open = (parent: string) => parent === "0" ? category.openTop() : category.openChildrenOf(parent);
      // 固定の試験用の名称。親の下に同じ名称が1件あれば使い回し、無いものだけ作る（何度流しても増えない）
      const todo: (typeof defs) = [];
      for (const parent of parents) {
        await open(parent);
        const rows = await category.rowValues();
        for (const d of defs.filter((x) => parentOf(x) === parent)) {
          const hit = rows.filter((r) => r.nameJp === 試験名(d.name));
          if (hit.length > 1) throw new Error(`${seedId}: 親 ${parent} の下に「${試験名(d.name)}」が ${hit.length} 件ある（1件のはず）`);
          if (hit.length === 1) byKey[d.key] = hit[0].id; else todo.push(d);
        }
      }
      if (todo.length === 0) continue;
      作った = true;
      await uploadCategoryRowsOf(page, todo.map((d) => ({
        nameJp: 試験名(d.name), nameEn: d.en, parentId: parentOf(d), frontHide: "0", branchHide: "0", searchParameters: d.sp,
      })), `${seedId}-${lv}.csv`, `${seedId} のカテゴリ登録CSV（${lv}段目）`, issue);
      for (const parent of parents) {
        await open(parent);
        for (const d of todo.filter((x) => parentOf(x) === parent)) byKey[d.key] = await category.idOf(試験名(d.name));
      }
    }
    if (作った) await キャッシュを削除する(page, seedId, issue);
    issue(作った ? "シード作成時の問題（読み替え）: 試験用のカテゴリを新しく作り、キャッシュを削除した" : "シード作成時の問題（読み替え）: 試験用のカテゴリは前から有るので使い回した（作らず、キャッシュも削除していない）");
  });
  issue("シード作成時の問題（読み替え）: 作ったカテゴリ（サプライ・ヴィンテージ・タルキール：龍嵐録 など）の名称は固定の試験用の名称「〇〇(E2E試験-F0304)」で、無いときだけ作り、あれば使い回す（流すたびには増えない）。表示順の設定はしていない（ケースは並びを見ない）");
  noteLabels(seedId, notes, byKey);
});

/** カテゴリ登録CSVを取り込む（最上位に取り込む() は一覧まで開くので、取込だけの薄い入れ物） */
async function uploadCategoryRowsOf(page: import("@playwright/test").Page, rows: CategoryCsvRow[], fileName: string, what: string, onWarning: (w: string) => void): Promise<void> {
  await 最上位に取り込む(page, rows, fileName, what, onWarning);
}

const 商品IDs: string[] = [];
defineSeed("S-F03-04-PRODUCTS", { needs: ["S-F03-04-CATEGORIES"] }, async ({ browser, notes }) => {
  const seedId = "S-F03-04-PRODUCTS";
  const context = await 公開側の場(browser);
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    const list = new FrontProductList(page);
    await list.open("/ja", "/products/search");
    await list.結果を待つ();
    const ids = [...new Set((await list.カードを読む()).map((c) => c.商品ID).filter((x) => x !== ""))];
    if (ids.length < 7) throw new Error(`${seedId}: 本店の商品一覧に出る既存の商品が ${ids.length} 件しかない（7件要る）`);
    商品IDs.splice(0, 商品IDs.length, ...ids.slice(0, 7));
  } finally {
    await context.close();
  }
  "ABCDEFG".split("").forEach((k, i) => notes.set(`〔商品ID-F0304-共有${k}〕`, 商品IDs[i]));
  reportSeedIssue(seedId, `シード作成時の問題（読み替え）: 商品の作成と検索サービスへの送信は画面で行えない。商品ID A〜G は、本店の商品一覧の先頭に出る既存の商品（商品ID ${商品IDs.join("・")}）で代えた。カテゴリへの紐付け・レアリティの属性は作っていない（使うケースは商品の表示を確かめない）`);
});
