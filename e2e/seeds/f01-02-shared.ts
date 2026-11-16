/**
 * F01-02 支店ECTOP のうち、共有の設定（支店共通のレイアウトのブロックの並び・本店のトップページのレイアウト・固定のフォーマット別特集タグ）を
 * 書き換えて、ケースの終わりに画面で戻すシード。正本: cases/F01-02_seed_data.tsv
 * 依頼者の決定（2026-11-11）: 触る人の少ない夜に1本だけで流し、ケースの終わりに必ず元へ戻すことを条件に、共有の書き換えを認める（lib/shared_restore.ts）。
 *
 * 書き換えて戻すもの（書き換える直前に画面から全部を控え、戻したあと開き直して全部が控えと同じかを確かめる。戻せなければ STOP）:
 * - 支店トップページ（全支店で共通の1件）のレイアウトのブロックの並び（058・060・061・062・065・066・070・071・081）。
 * - 本店のトップページ（TOPページ）のレイアウトのブロックの並び（060）。
 * - 固定のフォーマット別特集タグ（スタンダード・レガシー）の対象商品（047。印つきの商品を足し、終わりに外して、対象商品の全件が控えと同じかを確かめ、フィードを送り直す）。
 * 足したもので、ケースの終わりに消すもの: 作ったブロック、ファイル管理に上げた画像（066）、作ったカテゴリ（061・070。商品のカテゴリを戻してから消す）。
 * 残すもの（印つき）: 商品・カード・カードセット（在庫やカードの詳細情報が付き、画面から消せない）。
 *
 * シードでの解釈（シード表から一意に決まらないもの）:
 * - 支店: 試験用の店舗は決まった名前で1度だけ作って使い回す（依頼者決定 2026-11-11）。シード表はケースごとに支店を作るとするが、
 *   どのケースも支店ごとの違いを確かめない（支店共通のレイアウトを見る）ので、決まった印の試験支店1つを全部のケースで使い、各ケースの〔支店ID-…〕に控える。
 * - ブロックのコードは、Twig の書き方を含まないHTMLだけにする（書き損じで支店ECTOPが描けなくなるのを避ける）。リンクは試験支店の支店URLの商品一覧のアドレスを書く。
 * - ブロック名・ブロックの文・カテゴリ名・カードセット名・商品名・商品コードには実行の印を付ける（表示用HTMLの値は正本の値のまま）。
 * - 「アイテムを探す」「おすすめ特集」の位置へ置くときは、元のブロック（アイテムを探す（支店）・おすすめ特集（支店））と入れ替えて未使用ブロックへ移す。
 *   「QRコード & 採用情報」の位置へ置くときは、採用情報（支店）のすぐ後ろに置く（シード表は既存のブロックを移すと書いていない）。
 *   本店のトップページは、アイテムを探すのすぐ後ろに置く（シード表は既存のブロックを移すと書いていない）。
 * - 062・071 の商品は、カード指定で既存のカードの先頭を選ぶのでなく、作ったカードセットに詳細情報を持つカードを登録して指定する
 *   （商品一覧のカードセットの絞り込みは、商品に指定したカードの詳細情報のカードセットで引く作りで、既存のカードでは絞り込みに出ない）。
 * - 061・062 は、絞り込まれた商品一覧に商品が出ることを画面で確かめるため、070・071 と同じくフィードを送って商品一覧に出るまで待つ。
 * - 071 のカードセットの表示用HTMLは、入力欄が無いのでシード表どおり DB で設定する（E2E が作ったカードセットの行だけ。フリーエリア(日)の欄）。
 * - 047 のタイル未割当区画は、シード表どおり DB で試験支店のタイルの行（下段左）を消す（E2E の試験支店の行だけ）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { カードセットの表示用HTMLを設定する, 支店のタイルの行を消す } from "../db/f01_02_shared";
import { RUN_MARK, rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { registerRestore } from "../lib/shared_restore";
import { withAdminSession } from "../lib/session";
import { CategoryPage, createTopByCsv } from "../pages/admin/category";
import {
  F0102試験支店, F0102試験支店を用意する, ファイルがあるか, ファイルを上げる, ファイルを消す, ブロックがあるか, ブロックが届くのを待つ, ブロックのコードを確かめる, ブロックを作る, ブロックを消す,
  ページのレイアウト, 共有のレイアウトを書き換える, 公開側に出るまで待つ, 商品のカテゴリを選ぶ, 差し込んだ並び, 試験支店に在庫を入れる, 通常盤以外のカードセットを登録する,
} from "../pages/admin/f01_02_layout";
import { タグを付けて商品を登録する, 支店トップページを設定する } from "../pages/admin/f01_02_setup";
import { imageFile } from "../pages/admin/f03_06_products";
import { savePublishedClass } from "../pages/admin/f03_07_restock";
import { F0504カードを登録する, 単体カード配下のカテゴリID } from "../pages/admin/f05_04_products";
import { allTagRows } from "../pages/admin/m03_28_seed_ops";
import { downloadGoodsCsvTemplate, readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode, productIdsByCode } from "../pages/admin/m03_23_seed_products";
import { assignCardOnProductEdit } from "../pages/admin/product_card_assign";
import { 商品編集で選んで登録する } from "../pages/admin/product_edit_select";
import { フィードを送って反映を待つ, フィードを送る } from "../pages/admin/unisearch_feed";
import { タグの商品IDを読む } from "../pages/admin/unisearch_products";
import { 試験支店の商品をそろえる } from "../pages/admin/f01_02_branch_reset";
import { defineSeed } from "./current_seed";
import "./f01-02";

type Issue = (m: string) => void;

/** 試験支店の支店URL（全部のケースで同じ） */
export const 試験支店URL = F0102試験支店.支店URL;
/** 試験支店の支店ECTOPのアドレス */
export const 試験支店ECTOP = `${BASE_URL}/ja/${試験支店URL}/`;
/** 作るブロックの、ブロックの外枠の id（ケースで画面の場所を引く） */
export const ブロックの枠 = (n: string): string => `f0102-e2e-${n.toLowerCase()}`;
/** 正本の名前に実行の印を付けた値（ブロック名・ブロックの文・カテゴリ名・カードセット名・商品名） */
export const 印つき = (正本の値: string): string => rc(正本の値);
/** 066 のリンクURL（正本の値） */
export const おすすめバナーのURL = "https://replace-dev.hareruyamtg.com:8443/f0102c066/recommend-066";
/** 070・071 の表示用HTML（正本の値） */
export const カテゴリの表示用HTML = "LINK-CATBANNER-L003F0102n070";
export const カードセットの表示用HTML = "LINK-SETBANNER-L004F0102n071";
/** 047: 固定のフォーマット別特集タグ（アプリの決め打ち。スタンダード・レガシー・統率者）。シード表の「2件」はスタンダード・レガシー */
export const フォーマット別特集タグ = { スタンダード: "9", レガシー: "11", 統率者: "14" } as const;
const 足すタグ = [フォーマット別特集タグ.スタンダード, フォーマット別特集タグ.レガシー];

/** 047: シードが画面から読んだ、フォーマット別特集タグ（3件）の名称（日） */
const タグの名称 = new Map<string, string>();
export function フォーマット別特集タグの名称(): Map<string, string> {
  if (タグの名称.size !== 3) throw new Error("フォーマット別特集タグの名称をシードがまだ読んでいない");
  return タグの名称;
}

const issueOf = (seedId: string): Issue => (m: string) => reportSeedIssue(seedId, m);

async function 支店を控える(browser: Browser, notes: { set(k: string, v: string): void }, n: string, issue: Issue): Promise<string> {
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const sid = await F0102試験支店を用意する(page, issue);
    // 試験支店はほかのケース（支店ECTOPの SALE・タイルなど）も使い回すので、ケースの初めに前のケース・前の回の商品を外してそろえる
    await 試験支店の商品をそろえる(page, `支店 ${n} のケースの初めに試験支店の商品をそろえる`, issue);
    return sid;
  });
  notes.set(`〔支店ID-F0102-${n}〕`, id);
  return id;
}

/** 作ったブロックの登録の時刻（ブロックID → 時刻） */
const 作った時刻 = new Map<string, number>();
/** 作ったブロックがほかのサーバへ届くまで（登録から90秒）待つ */
const 届くのを待つ = async (blockId: string): Promise<void> => ブロックが届くのを待つ(作った時刻.get(blockId) ?? 0);

/** ブロックを作り、ケースの終わりに消すことを登録する。ブロックIDを返す */
async function ブロックを用意する(browser: Browser, seedId: string, v: { ブロック名: string; ファイル名: string; コード: string }, issue: Issue): Promise<string> {
  const id = await withAdminSession(browser, SETUP_ADMIN, (page) => ブロックを作る(page, v));
  作った時刻.set(id, Date.now());
  registerRestore(`E2E が作ったブロック「${v.ブロック名}」（ID ${id}）`, { ブロックID: id, ファイル名: v.ファイル名 },
    async () => { await withAdminSession(browser, SETUP_ADMIN, (page) => ブロックを消す(page, id)); },
    async () => withAdminSession(browser, SETUP_ADMIN, async (page) => !(await ブロックがあるか(page, id))));
  await withAdminSession(browser, SETUP_ADMIN, (page) => ブロックのコードを確かめる(page, id, v.コード, seedId));
  issue(`ブロック管理でブロック「${v.ブロック名}」（ブロックID ${id}・ファイル名 ${v.ファイル名}）を登録した（ケースの終わりに消す）`);
  return id;
}

const ファイル名 = (n: string, sfx = ""): string => `f0102b${n}${sfx}${RUN_MARK.toLowerCase()}`;

/** 支店トップページのレイアウトで、名前が 基準 のブロックの代わりに（または後ろに）作ったブロックを置き、戻すことを登録する */
async function 支店ECTOPに置く(browser: Browser, seedId: string, block: { id: string; 名前: string }, 基準: string, how: "代わりに" | "後ろに", issue: Issue): Promise<void> {
  const lay = await withAdminSession(browser, SETUP_ADMIN, (page) => ページのレイアウト(page, "支店トップページ"));
  await 共有のレイアウトを書き換える(browser, lay, (元) => 差し込んだ並び(元, block, 基準, how), seedId, issue, registerRestore);
  issue(`支店トップページのレイアウト「${lay.名前}」で、ブロック「${block.名前}」を「${基準}」の${how === "代わりに" ? "代わりに置き、元のブロックは未使用ブロックへ移した" : "すぐ後ろに置いた"}`);
}

/** 支店ECTOP（試験支店）に、作ったブロックの枠が出るまで待つ */
async function 支店ECTOPに出るまで待つ(browser: Browser, 枠: string, what: string): Promise<void> {
  await 公開側に出るまで待つ(browser, 試験支店ECTOP, async (page) => {
    const n = await page.locator(`#${枠}`).count();
    return { ok: n === 1, 様子: `支店ECTOPのブロックの枠 #${枠} が ${n} 件` };
  }, what);
}

/** 商品一覧（アドレス）に商品名のカードが出るまで、フィードを送って待つ */
async function 商品一覧に出るまでフィードを送る(browser: Browser, url: string, 商品名: string, what: string): Promise<void> {
  await フィードを送って反映を待つ(browser, async (ctx) => {
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "load", timeout: 120_000 });
    const card = page.locator(".p-hareruya-product-card").filter({ hasText: 商品名 });
    await card.first().waitFor({ state: "visible", timeout: 20_000 }).catch(() => undefined);
    const k = await card.count();
    return { ok: k > 0, 様子: `${url} の「${商品名}」のカード ${k} 件` };
  }, what);
}

let cardSeq = 0;
const CARD_NO_BASE = String(Date.now()).slice(-8);

/**
 * グッズ商品CSV登録で商品を1件作り（支店の商品公開ステータスは公開・価格500・在庫0）、カードセットを渡せば、そのカードセットに詳細情報を持つカードを
 * 登録して商品に指定し、商品カテゴリを指定のカテゴリだけにして、取込の規格が公開でなければ公開にする。
 */
async function 試験の商品を作る(browser: Browser, seedId: string, d: { コード: string; 名前: string; カテゴリ?: string | "単体カード"; カードセットID?: string }, issue: Issue): Promise<{ 商品ID: string; 規格ID: string }> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const goodsCat = await readExistingGoodsChildCategoryId(page);
    const 付随 = Object.fromEntries((await downloadGoodsCsvTemplate(page)).headers.filter((h) => h.includes("地域") || h.includes("スマレジ連携")).map((h) => [h, "0"]));
    let card: { カード名: string; 詳細ID: string } | null = null;
    if (d.カードセットID) {
      const カード名 = `${d.名前}-カード`;
      const r = await F0504カードを登録する(page, {
        カード名英: カード名, 任意の説明: { カード名日: カード名, ルールテキスト日: "結合試験" },
        詳細: [{ カードセットID: d.カードセットID, カード番号: `${CARD_NO_BASE}${String(++cardSeq).padStart(3, "0")}` }],
      }, `${seedId}: カード「${カード名}」`, issue);
      card = { カード名, 詳細ID: r.カード詳細IDs[0] };
      issue(`カード「${カード名}」（カードID ${r.カードID}）を、カードセットID ${d.カードセットID} の詳細情報つきで登録した`);
    }
    await registerGoodsCsv(page, {
      what: `${seedId}: グッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${RUN_MARK.toLowerCase()}.csv`, categoryId: goodsCat,
      common: 付随, branchStatus: "公開",
      lines: [{ code: d.コード, nameJp: d.名前, nameEn: d.名前, values: { "基準価格": "500", "販売価格": "500", "買取価格": "100", "原価単価": "100", ...(d.カードセットID ? { "カードセット(ID)": d.カードセットID } : {}) } }],
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 180_000,
    });
    const 商品ID = await openProductEditByCode(page, d.コード);
    if (card) await assignCardOnProductEdit(page, { productId: 商品ID, cardNameJp: card.カード名, cardDetailId: card.詳細ID, productNameJp: d.名前, productNameEn: d.名前 }, (m) => issue(`${d.コード}: ${m}`));
    const cat = d.カテゴリ === "単体カード" ? (await 単体カード配下のカテゴリID(page)).id : d.カテゴリ;
    if (cat) await 商品のカテゴリを選ぶ(page, 商品ID, [cat], `${seedId}: ${d.コード} の商品カテゴリ`, issue);
    const rows = await classRowsFromProductEdit(page, 商品ID);
    if (rows.length !== 1) throw new Error(`${seedId}: ${d.コード} の取込直後の商品規格が ${rows.length} 件（1件のはず）`);
    if (rows[0].公開状態 !== "公開") await savePublishedClass(page, { productId: 商品ID, classId: rows[0].商品規格ID }, `${seedId}: ${d.コード}`, issue);
    return { 商品ID, 規格ID: rows[0].商品規格ID };
  });
}

/**
 * 作ったカテゴリ（子が先）を、ケースの終わりに消すことを登録する。消す前に、商品のカテゴリをサプライ・グッズの配下のカテゴリへ戻す。
 * 確かめ: 一覧（最上位、子なら親の一覧）に、そのカテゴリの行が無いこと。
 */
function カテゴリを消すことを登録する(browser: Browser, seedId: string, cats: { id: string; 名前: string; 親?: string }[], 商品コード: string, issue: Issue): void {
  const 一覧を開く = async (cp: CategoryPage, c: { 親?: string }) => { if (c.親) await cp.openChildrenOf(c.親); else await cp.openTop(); };
  registerRestore(`E2E が作ったカテゴリ（${cats.map((c) => `「${c.名前}」ID ${c.id}`).join("・")}）`, { カテゴリID: cats.map((c) => c.id) },
    async () => {
      await withAdminSession(browser, SETUP_ADMIN, async (page) => {
        page.setDefaultTimeout(60_000);
        // 商品（作れていれば）のカテゴリを、サプライ・グッズの配下のカテゴリへ戻す（商品が所属していると、カテゴリを消せない）
        const goods = await readExistingGoodsChildCategoryId(page);
        for (const pid of await productIdsByCode(page, 商品コード)) await 商品のカテゴリを選ぶ(page, pid, [goods], `${seedId}: 商品ID ${pid} の商品カテゴリを戻す`, issue);
        for (const c of cats) {
          const cp = new CategoryPage(page);
          await 一覧を開く(cp, c);
          if ((await cp.rowById(c.id).count()) > 0) await cp.confirmDelete(await cp.openDeleteById(c.id));
        }
      });
    },
    async () => withAdminSession(browser, SETUP_ADMIN, async (page) => {
      const top = cats.filter((c) => !c.親);
      const cp = new CategoryPage(page);
      await cp.openTop();
      const ids = (await cp.rowValues()).map((r) => r.id);
      if (top.some((c) => ids.includes(c.id))) return false;
      for (const c of cats.filter((x) => x.親 && !top.some((t) => t.id === x.親))) {
        await cp.openChildrenOf(c.親!);
        if ((await cp.rowById(c.id).count()) > 0) return false;
      }
      return true;
    }));
  issue(`カテゴリ（${cats.map((c) => `「${c.名前}」ID ${c.id}`).join("・")}）は、ケースの終わりに商品のカテゴリを戻してから消す`);
}

// ---------------------------------------------------------------------------
// アイテムを探す（058・060）
// ---------------------------------------------------------------------------

defineSeed("S-F01-02-CASE-058", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue = issueOf(id);
  await 支店を控える(browser, notes, "058", issue);
  const 名前 = 印つき("F0102-058アイテム検索");
  const links = [1, 2, 3].map((i) => `      <li class="p-hareruya-feature-card"><a class="c-hareruya-tag" href="/ja/${試験支店URL}/products/search?product=${encodeURIComponent(印つき(`F0102-058リンク${i}`))}">${印つき(`F0102-058リンク${i}`)}</a></li>`);
  const コード = [
    `<section class="p-hareruya-section" id="${ブロックの枠("058")}">`, `  <div class="l-hareruya-container">`,
    `    <h2 class="c-hareruya-heading--lev2 p-hareruya-section__heading">アイテムを探す</h2>`, `    <ul class="p-hareruya-feature-card-list">`,
    ...links, `    </ul>`, `  </div>`, `</section>`,
  ].join("\n");
  const blockId = await ブロックを用意する(browser, id, { ブロック名: 名前, ファイル名: ファイル名("058"), コード }, issue);
  notes.set("〔ブロックID-F0102-058〕", blockId);
  await 届くのを待つ(blockId);
  await 支店ECTOPに置く(browser, id, { id: blockId, 名前 }, "アイテムを探す（支店）", "代わりに", issue);
  await 支店ECTOPに出るまで待つ(browser, ブロックの枠("058"), `${id}: 支店ECTOPに作ったブロックが出る`);
});

defineSeed("S-F01-02-CASE-060", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue = issueOf(id);
  await 支店を控える(browser, notes, "060", issue);
  const A = 印つき("支店アイテム検索ブロック-060");
  const B = 印つき("本店アイテム検索ブロック-060");
  const コード = (枠: string, 文: string) => [
    `<section class="p-hareruya-section" id="${枠}">`, `  <div class="l-hareruya-container">`,
    `    <h2 class="c-hareruya-heading--lev2 p-hareruya-section__heading">アイテムを探す</h2>`, `    <p>${文}</p>`, `  </div>`, `</section>`,
  ].join("\n");
  const aId = await ブロックを用意する(browser, id, { ブロック名: A, ファイル名: ファイル名("060", "a"), コード: コード(ブロックの枠("060a"), A) }, issue);
  const bId = await ブロックを用意する(browser, id, { ブロック名: B, ファイル名: ファイル名("060", "b"), コード: コード(ブロックの枠("060b"), B) }, issue);
  notes.set("〔ブロックID-F0102-060A〕", aId);
  notes.set("〔ブロックID-F0102-060B〕", bId);
  await 届くのを待つ(aId);
  await 届くのを待つ(bId);
  await 支店ECTOPに置く(browser, id, { id: aId, 名前: A }, "アイテムを探す（支店）", "代わりに", issue);
  const top = await withAdminSession(browser, SETUP_ADMIN, (page) => ページのレイアウト(page, "TOPページ"));
  await 共有のレイアウトを書き換える(browser, top, (元) => 差し込んだ並び(元, { id: bId, 名前: B }, "アイテムを探す", "後ろに"), id, issue, registerRestore);
  issue(`本店のトップページ（TOPページ）のレイアウト「${top.名前}」で、ブロック「${B}」を「アイテムを探す」のすぐ後ろに置いた`);
  await 支店ECTOPに出るまで待つ(browser, ブロックの枠("060a"), `${id}: 支店ECTOPに支店アイテム検索ブロックが出る`);
  // 本店のトップページには本店アイテム検索ブロックが出ることを確かめる（支店ECTOPに出ないことが、ブロックが無いせいでないと分かるように）
  await 公開側に出るまで待つ(browser, `${BASE_URL}/ja/`, async (page) => {
    const n = await page.locator(`#${ブロックの枠("060b")}`).count();
    return { ok: n === 1, 様子: `本店のトップページのブロックの枠 #${ブロックの枠("060b")} が ${n} 件` };
  }, `${id}: 本店のトップページに本店アイテム検索ブロックが出る`);
  issue(`本店のトップページに「${B}」が表示されることを確かめた`);
});

// ---------------------------------------------------------------------------
// アイテムを探すのカテゴリ・カードセット（061・062・070・071）
// ---------------------------------------------------------------------------

const 絞込のブロック = (n: string, 文: string, href: string): string => [
  `<section class="p-hareruya-section" id="${ブロックの枠(n)}">`, `  <div class="l-hareruya-container">`,
  `    <h2 class="c-hareruya-heading--lev2 p-hareruya-section__heading">アイテムを探す</h2>`, `    <ul class="p-hareruya-feature-card-list">`,
  `      <li class="p-hareruya-feature-card"><a class="c-hareruya-tag" href="${href}">${文}</a></li>`, `    </ul>`, `  </div>`, `</section>`,
].join("\n");
export const カテゴリの一覧のアドレス = (id: string): string => `/ja/${試験支店URL}/products/search/cate/${id}`;
export const カードセットの一覧のアドレス = (id: string): string => `/ja/${試験支店URL}/products/search?cardset=${id}`;

defineSeed("S-F01-02-CASE-061", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue = issueOf(id);
  await 支店を控える(browser, notes, "061", issue);
  const 名 = 印つき("テストカテゴリA-061");
  const catId = await withAdminSession(browser, SETUP_ADMIN, (page) => createTopByCsv(page, { nameJp: 名, nameEn: 印つき("TestCategoryA-061"), branchHide: "0" }, `f0102-061-${RUN_MARK.toLowerCase()}.csv`, issue));
  カテゴリを消すことを登録する(browser, id, [{ id: catId, 名前: 名 }], 印つき("F0102-061"), issue);
  notes.set("〔カテゴリID-F0102-061〕", catId);
  issue("カテゴリ管理の最上位の画面には入力欄が無いので、カテゴリ登録CSV（画面）で最上位のカテゴリを登録した（支店非表示フラグ 0）");
  const 商品名 = 印つき("F0102-061商品");
  const p = await 試験の商品を作る(browser, id, { コード: 印つき("F0102-061"), 名前: 商品名, カテゴリ: catId }, issue);
  notes.set("〔商品ID-F0102-061〕", p.商品ID);
  const blockId = await ブロックを用意する(browser, id, { ブロック名: 印つき("F0102-061アイテム検索"), ファイル名: ファイル名("061"), コード: 絞込のブロック("061", 名, カテゴリの一覧のアドレス(catId)) }, issue);
  notes.set("〔ブロックID-F0102-061〕", blockId);
  await 商品一覧に出るまでフィードを送る(browser, `${BASE_URL}${カテゴリの一覧のアドレス(catId)}`, 商品名, `${id}: 試験支店のカテゴリの商品一覧への反映`);
  issue("商品管理「ユニサーチフィード作成」でフィードを送り、試験支店のカテゴリで絞り込んだ商品一覧に商品が出るまで待った（絞り込まれた一覧を画面で確かめるため）");
  await 届くのを待つ(blockId);
  await 支店ECTOPに置く(browser, id, { id: blockId, 名前: 印つき("F0102-061アイテム検索") }, "アイテムを探す（支店）", "代わりに", issue);
  await 支店ECTOPに出るまで待つ(browser, ブロックの枠("061"), `${id}: 支店ECTOPに作ったブロックが出る`);
});

defineSeed("S-F01-02-CASE-062", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue = issueOf(id);
  await 支店を控える(browser, notes, "062", issue);
  const セット名 = 印つき("テストセット特別版-062");
  const setId = await withAdminSession(browser, SETUP_ADMIN, (page) => 通常盤以外のカードセットを登録する(page, { 名称: セット名, 略称: `F62${RUN_MARK}`.slice(0, 16) }, id, issue));
  notes.set("〔カードセットID-F0102-062〕", setId);
  const 商品名 = 印つき("F0102-062商品");
  const p = await 試験の商品を作る(browser, id, { コード: 印つき("F0102-062"), 名前: 商品名, カテゴリ: "単体カード", カードセットID: setId }, issue);
  notes.set("〔商品ID-F0102-062〕", p.商品ID);
  issue("商品のカード指定は、既存のカードの先頭でなく、作ったカードセットに詳細情報を持つカードを登録して指定した（商品一覧のカードセットの絞り込みは、商品に指定したカードの詳細情報のカードセットで引く作り）");
  const blockId = await ブロックを用意する(browser, id, { ブロック名: 印つき("F0102-062アイテム検索"), ファイル名: ファイル名("062"), コード: 絞込のブロック("062", セット名, カードセットの一覧のアドレス(setId)) }, issue);
  notes.set("〔ブロックID-F0102-062〕", blockId);
  await 商品一覧に出るまでフィードを送る(browser, `${BASE_URL}${カードセットの一覧のアドレス(setId)}`, 商品名, `${id}: 試験支店のカードセットの商品一覧への反映`);
  issue("商品管理「ユニサーチフィード作成」でフィードを送り、試験支店のカードセットで絞り込んだ商品一覧に商品が出るまで待った");
  await 届くのを待つ(blockId);
  await 支店ECTOPに置く(browser, id, { id: blockId, 名前: 印つき("F0102-062アイテム検索") }, "アイテムを探す（支店）", "代わりに", issue);
  await 支店ECTOPに出るまで待つ(browser, ブロックの枠("062"), `${id}: 支店ECTOPに作ったブロックが出る`);
});

/** 070・071 の「ユニサーチ試験環境へ接続できる状態」: 本店の商品一覧が検索サービス（ユニサーチ）の部品つきで描かれることを確かめる */
defineSeed("S-F01-02-L-ENV", async ({ browser, seed }) => {
  await 公開側に出るまで待つ(browser, `${BASE_URL}/ja/products/search`, async (page) => {
    const n = await page.locator("#product-list-related-keywords").count();
    return { ok: n > 0, 様子: `商品一覧の検索サービスの部品 ${n} 件` };
  }, "商品一覧が検索サービス（ユニサーチ）につながる状態", 60_000);
  reportSeedIssue(seed.シードID, "商品一覧が検索サービス（ユニサーチ）につながる設定で描かれることを画面で確かめた（日本語表示・PC幅の新しいブラウザで、開始時はログアウト状態）");
});

defineSeed("S-F01-02-L-CAT-070", { needs: ["S-F01-02-L-ENV"] }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue = issueOf(id);
  await 支店を控える(browser, notes, "070", issue);
  const 親名 = 印つき("連携親カテゴリ-L003F0102n070");
  const 子名 = 印つき("連携子カテゴリ-L003F0102n070");
  const 親 = await withAdminSession(browser, SETUP_ADMIN, (page) => createTopByCsv(page, { nameJp: 親名, nameEn: 印つき("LinkParent-070"), branchHide: "0" }, `f0102-070-${RUN_MARK.toLowerCase()}.csv`, issue));
  const 子 = await withAdminSession(browser, SETUP_ADMIN, (page) => new CategoryPage(page).createChild(親, { nameJp: 子名, nameEn: 印つき("LinkChild-070"), htmlJa: カテゴリの表示用HTML }, issue));
  カテゴリを消すことを登録する(browser, id, [{ id: 子, 名前: 子名, 親 }, { id: 親, 名前: 親名 }], 印つき("F0102-070"), issue);
  notes.set("〔親カテゴリID-F0102-070〕", 親);
  notes.set("〔子カテゴリID-F0102-070〕", 子);
  issue("親カテゴリは、カテゴリ管理の最上位の画面に入力欄が無いので、カテゴリ登録CSV（画面）で登録した。子カテゴリはカテゴリ管理の親の下の画面で、埋め込みHTML（日）を入れて登録した");
  const 商品名 = 印つき("F0102-070商品");
  const コード = 印つき("F0102-070");
  const p = await 試験の商品を作る(browser, id, { コード, 名前: 商品名, カテゴリ: 子 }, issue);
  notes.set("〔商品ID-F0102-070〕", p.商品ID);
  await 試験支店に在庫を入れる(browser, id, [{ 商品コード: コード, 数: 1 }], issue);
  const blockId = await ブロックを用意する(browser, id, { ブロック名: 印つき("F0102-070アイテム検索"), ファイル名: ファイル名("070"), コード: 絞込のブロック("070", 子名, カテゴリの一覧のアドレス(子)) }, issue);
  notes.set("〔ブロックID-F0102-070〕", blockId);
  await 商品一覧に出るまでフィードを送る(browser, `${BASE_URL}${カテゴリの一覧のアドレス(子)}`, 商品名, `${id}: 試験支店の子カテゴリの商品一覧への反映`);
  issue("商品管理「ユニサーチフィード作成」でフィードを送り、試験支店の子カテゴリで絞り込んだ商品一覧に商品が出るまで待った");
  await 届くのを待つ(blockId);
  await 支店ECTOPに置く(browser, id, { id: blockId, 名前: 印つき("F0102-070アイテム検索") }, "アイテムを探す（支店）", "代わりに", issue);
  await 支店ECTOPに出るまで待つ(browser, ブロックの枠("070"), `${id}: 支店ECTOPに作ったブロックが出る`);
});

defineSeed("S-F01-02-L-SET-071", { needs: ["S-F01-02-L-ENV"] }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue = issueOf(id);
  await 支店を控える(browser, notes, "071", issue);
  const セット名 = 印つき("連携特別版セット-L004F0102n071");
  const setId = await withAdminSession(browser, SETUP_ADMIN, (page) => 通常盤以外のカードセットを登録する(page, { 名称: セット名, 略称: `F71${RUN_MARK}`.slice(0, 16) }, id, issue));
  notes.set("〔カードセットID-F0102-071〕", setId);
  const n = カードセットの表示用HTMLを設定する(setId, カードセットの表示用HTML, RUN_MARK);
  if (n !== 1) throw new Error(`${id}: カードセットの表示用HTMLを書いた行が ${n} 行（1行のはず）`);
  issue(`カードセットの表示用HTML「${カードセットの表示用HTML}」は、カードセット登録・編集に入力欄が無いので、シード表どおり DB で設定した（E2E が作ったカードセットID ${setId} の行のフリーエリア(日)）`);
  const 商品名 = 印つき("F0102-071商品");
  const コード = 印つき("F0102-071");
  const p = await 試験の商品を作る(browser, id, { コード, 名前: 商品名, カテゴリ: "単体カード", カードセットID: setId }, issue);
  notes.set("〔商品ID-F0102-071〕", p.商品ID);
  issue("商品のカード指定は、既存のカードの先頭でなく、作ったカードセットに詳細情報を持つカードを登録して指定した（商品一覧のカードセットの絞り込みは、商品に指定したカードの詳細情報のカードセットで引く作り）");
  await 試験支店に在庫を入れる(browser, id, [{ 商品コード: コード, 数: 1 }], issue);
  const blockId = await ブロックを用意する(browser, id, { ブロック名: 印つき("F0102-071アイテム検索"), ファイル名: ファイル名("071"), コード: 絞込のブロック("071", セット名, カードセットの一覧のアドレス(setId)) }, issue);
  notes.set("〔ブロックID-F0102-071〕", blockId);
  await 商品一覧に出るまでフィードを送る(browser, `${BASE_URL}${カードセットの一覧のアドレス(setId)}`, 商品名, `${id}: 試験支店のカードセットの商品一覧への反映`);
  issue("商品管理「ユニサーチフィード作成」でフィードを送り、試験支店のカードセットで絞り込んだ商品一覧に商品が出るまで待った");
  await 届くのを待つ(blockId);
  await 支店ECTOPに置く(browser, id, { id: blockId, 名前: 印つき("F0102-071アイテム検索") }, "アイテムを探す（支店）", "代わりに", issue);
  await 支店ECTOPに出るまで待つ(browser, ブロックの枠("071"), `${id}: 支店ECTOPに作ったブロックが出る`);
});

// ---------------------------------------------------------------------------
// おすすめ特集（065・066）・QRコード & 採用情報（081）
// ---------------------------------------------------------------------------

defineSeed("S-F01-02-CASE-065", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue = issueOf(id);
  await 支店を控える(browser, notes, "065", issue);
  const 名前 = 印つき("支店おすすめ特集ブロック-065");
  const コード = [
    `<section class="p-hareruya-section" id="${ブロックの枠("065")}">`, `  <div class="l-hareruya-container">`,
    `    <h2 class="c-hareruya-heading--lev2">おすすめ特集</h2>`, `    <p>${名前}</p>`, `  </div>`, `</section>`,
  ].join("\n");
  const blockId = await ブロックを用意する(browser, id, { ブロック名: 名前, ファイル名: ファイル名("065"), コード }, issue);
  notes.set("〔ブロックID-F0102-065〕", blockId);
  await 届くのを待つ(blockId);
  await 支店ECTOPに置く(browser, id, { id: blockId, 名前 }, "おすすめ特集（支店）", "代わりに", issue);
  await 支店ECTOPに出るまで待つ(browser, ブロックの枠("065"), `${id}: 支店ECTOPに作ったブロックが出る`);
});

/** 066 の画像（ファイル名は正本の名前に実行の印、中身は 32x32 の PNG。手元に WebP を作る道具が無い） */
export const おすすめバナーの画像名 = (): string => `recommend-banner-066-${RUN_MARK.toLowerCase()}.webp`;

defineSeed("S-F01-02-CASE-066", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue = issueOf(id);
  await 支店を控える(browser, notes, "066", issue);
  const 画像名 = おすすめバナーの画像名();
  // 上げる前に、消すことを登録する（上げたあとで落ちても消す）
  registerRestore(`E2E がファイル管理に上げた画像「${画像名}」`, { ファイル名: 画像名 },
    async () => { await withAdminSession(browser, SETUP_ADMIN, (page) => ファイルを消す(page, 画像名)); },
    async () => withAdminSession(browser, SETUP_ADMIN, async (page) => !(await ファイルがあるか(page, 画像名))));
  const path = await withAdminSession(browser, SETUP_ADMIN, (page) => ファイルを上げる(page, { name: 画像名, mimeType: "image/webp", buffer: imageFile("recommend-banner-066").buffer }, id, issue));
  issue(`ファイル管理の最上位に画像「${画像名}」（中身は 32x32 の PNG。手元に WebP を作る道具が無い。上書きを避けるため名前に実行の印を付けた）を上げた（ケースの終わりに消す）。公開側のパス ${path}`);
  const バナー名 = 印つき("おすすめバナーA-066");
  const 名前 = 印つき("F0102-066おすすめ特集");
  const コード = [
    `<section class="p-hareruya-section" id="${ブロックの枠("066")}">`, `  <div class="l-hareruya-container">`,
    `    <h2 class="c-hareruya-heading--lev2">おすすめ特集</h2>`,
    `    <a class="p-hareruya-branch-top__recommend-link" href="${おすすめバナーのURL}"><img src="${path}" alt="${バナー名}" width="384" height="131"><span>${バナー名}</span></a>`,
    `  </div>`, `</section>`,
  ].join("\n");
  const blockId = await ブロックを用意する(browser, id, { ブロック名: 名前, ファイル名: ファイル名("066"), コード }, issue);
  notes.set("〔ブロックID-F0102-066〕", blockId);
  await 届くのを待つ(blockId);
  await 支店ECTOPに置く(browser, id, { id: blockId, 名前 }, "おすすめ特集（支店）", "代わりに", issue);
  await 支店ECTOPに出るまで待つ(browser, ブロックの枠("066"), `${id}: 支店ECTOPに作ったブロックが出る`);
});

defineSeed("S-F01-02-QRBLOCK-081", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue = issueOf(id);
  await 支店を控える(browser, notes, "081", issue);
  const 名前 = 印つき("QR採用ブロックF0102-081");
  const 本文 = 印つき("QR採用ブロック本文F0102-081");
  const コード = [`<div class="p-hareruya-branch-top__recruit" id="${ブロックの枠("081")}">`, `  <div class="l-hareruya-container">`, `    <p>${本文}</p>`, `  </div>`, `</div>`].join("\n");
  const blockId = await ブロックを用意する(browser, id, { ブロック名: 名前, ファイル名: ファイル名("081"), コード }, issue);
  notes.set("〔ブロックID-F0102-081〕", blockId);
  await 届くのを待つ(blockId);
  await 支店ECTOPに置く(browser, id, { id: blockId, 名前 }, "採用情報（支店）", "後ろに", issue);
  await 支店ECTOPに出るまで待つ(browser, ブロックの枠("081"), `${id}: 支店ECTOPに作ったブロックが出る`);
});

// ---------------------------------------------------------------------------
// タイル未割当区画（047）
// ---------------------------------------------------------------------------

/** 047 の商品の商品コードの頭（前の実行の残りを見分ける） */
const 商品047の頭 = "F0102-047";

defineSeed("S-F01-02-CASE-047", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue = issueOf(id);
  const 支店ID = await 支店を控える(browser, notes, "047", issue);
  // ケースの終わりに最後に動く: フィードを送り直す（タグを外した商品を、公開側の索引から消すため。登録の逆順で戻すので、いちばん先に登録する）
  registerRestore("検索サービスの索引（タグを外したあとにフィードを送り直す）", { タグ: 足すタグ }, async () => { await フィードを送る(browser); });
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const rows = await allTagRows(page);
    for (const t of Object.values(フォーマット別特集タグ)) {
      const r = rows.find((x) => x.ID === t);
      if (!r) throw new Error(`${id}: タグ登録の一覧にタグID ${t}（固定のフォーマット別特集タグ）が無い`);
      タグの名称.set(t, r.名称日);
    }
    // 前の実行の残り（この印の頭の商品）をタグから外す（印つきのデータなので外してよい。戻さない）
    for (const t of 足すタグ) {
      const left = await タグの商品IDを読む(page, t, 商品047の頭);
      for (const pid of left) await 商品編集で選んで登録する(page, pid, { タグを外す: [t] }, `前の実行の残りの商品（商品ID ${pid}）からタグID ${t} を外す`, issue);
      if (left.length) issue(`タグID ${t} に前の実行の残りの印つきの商品 ${left.length} 件（商品ID ${left.join("・")}）があったので、タグを外した（戻さない）`);
    }
    // タグの対象商品を全件控え、戻すことを登録する
    for (const t of 足すタグ) {
      const before = await タグの商品IDを読む(page, t);
      registerRestore(`共有のタグ「${タグの名称.get(t)}」（ID ${t}）の対象商品`, { 件数: before.length, 商品ID: before }, async () => {
        await withAdminSession(browser, SETUP_ADMIN, async (p) => {
          p.setDefaultTimeout(60_000);
          for (const pid of await タグの商品IDを読む(p, t, 商品047の頭)) {
            if (!before.includes(pid)) await 商品編集で選んで登録する(p, pid, { タグを外す: [t] }, `足した印つきの商品（商品ID ${pid}）からタグID ${t} を外す`, issue);
          }
        });
      }, async () => withAdminSession(browser, SETUP_ADMIN, async (p) => JSON.stringify(await タグの商品IDを読む(p, t)) === JSON.stringify(before)));
      issue(`共有のタグ「${タグの名称.get(t)}」（ID ${t}）の対象商品 ${before.length} 件を全件控えた（ケースの終わりに、足した印つきの商品からタグを外し、対象商品の全件が控えと同じかを確かめる）`);
    }
  });
  // 商品A・B（グッズ商品CSV登録 → 商品登録編集でタグにチェック・割引率 → 支店在庫1）
  const defs = [{ sfx: "A", タグ: 足すタグ[0] }, { sfx: "B", タグ: 足すタグ[1] }];
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const goodsCat = await readExistingGoodsChildCategoryId(page);
    const 付随 = Object.fromEntries((await downloadGoodsCsvTemplate(page)).headers.filter((h) => h.includes("地域") || h.includes("スマレジ連携")).map((h) => [h, "0"]));
    await registerGoodsCsv(page, {
      what: `${id}: グッズ商品CSV登録`, fileName: `f0102-047-${RUN_MARK.toLowerCase()}.csv`, categoryId: goodsCat, common: 付随, branchStatus: "公開",
      lines: defs.map((d) => ({ code: 印つき(`${商品047の頭}${d.sfx}`), nameJp: 印つき(`F0102-047商品${d.sfx}`), nameEn: 印つき(`F0102-047商品${d.sfx}`), values: { "基準価格": "500", "販売価格": "500", "買取価格": "100", "原価単価": "100" } })),
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 180_000,
    });
    for (const d of defs) {
      const code = 印つき(`${商品047の頭}${d.sfx}`);
      const pid = await openProductEditByCode(page, code);
      const rows = await classRowsFromProductEdit(page, pid);
      if (rows.length !== 1) throw new Error(`${id}: ${code} の取込直後の商品規格が ${rows.length} 件（1件のはず）`);
      await タグを付けて商品を登録する(page, pid, d.タグ, null, `${id}: ${code} にタグID ${d.タグ}`, issue);
    }
  });
  await 試験支店に在庫を入れる(browser, id, defs.map((d) => ({ 商品コード: 印つき(`${商品047の頭}${d.sfx}`), 数: 1 })), issue);
  // 支店トップページ（支店共通設定を外し、バナー画像・タイル4行はピックアップ商品）→ 下段左のタイルの行を DB で消す
  const ピックアップ = { 属性: "ピックアップ商品" as const };
  await withAdminSession(browser, SETUP_ADMIN, (page) => 支店トップページを設定する(page, F0102試験支店.店名, { タイル: [ピックアップ, ピックアップ, ピックアップ, ピックアップ] }, id, issue));
  const n = 支店のタイルの行を消す(支店ID, 4, F0102試験支店.店名);
  if (n !== 1) throw new Error(`${id}: 試験支店の下段左のタイルの行を消した数が ${n} 行（1行のはず）`);
  issue("タイル未割当区画は、支店トップページ管理が常に4行を登録し行を消す操作が無いので、シード表どおり DB で試験支店の下段左（区画4）のタイルの行を消した（E2E の試験支店の行だけ）");
  notes.set("〔トップページ設定ID-F0102-047〕", `店舗ID ${支店ID} の支店トップページ管理で登録した設定（番号は画面に出ない）`);
});
