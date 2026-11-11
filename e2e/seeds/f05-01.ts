/**
 * F05-01 ネット買取トップページ（フロント）の画面シード。正本: cases/F05-01_seed_data.tsv
 *
 * 作るシード（シード表の投入方法の順）:
 * - BULK-SETTING（共有可）: 追加システム設定にまとめて買取商品IDの欄があることを画面で確かめる。値はケースの開始時に設定する（シード表の用途）。
 * - CATEGORY-ROOTS（共有可）: 「最新セット」「スタンダード」の第一階層があれば使い、無ければカテゴリ登録CSVで作る。IDはカテゴリ登録画面の一覧から控える。
 * - BULK-004: グッズ商品CSV登録で1商品を作り、商品マスターで商品IDを、商品規格一覧で商品規格IDを控える。
 * - CATEGORY-019・020、CATLINK-044・CATSORT-045・BANNER-046: カテゴリ登録画面で親を選び「子カテゴリ作成」で作る。
 * - CART-EMPTY（共有可）: 新しいブラウザセッションで買取カートの商品数が0件であることを確かめる。
 *
 * 既存データへの読み替え（依頼者の方針 2026-11-10。ファイル末尾）:
 * - TAGS（共有可）: タグそのものは作らず、管理画面のタグ一覧に、アプリが決め打ちで使うタグID 5・633〜638 があることを確かめる。
 *   対象商品・優先表示商品の設定（商品タグ更新CSV・タグの編集）は共有のタグの書き換えになるので行わない。
 * - 目玉買取商品・買取特集コーナーの商品は、外部の検索サービスの索引から描かれ、画面で作った商品がすぐには出ない。
 *   そのため商品の準備（CSV登録・索引の更新）は行わず、ネット買取トップページに今出ている既存の商品を探して、
 *   シード表が控えると定めた呼び名（商品ID・規格ID）にその値を控える。
 * - ZOOM-041・SHOPNAME-043: 商品の登録・店名の書き換え（共有の設定）は行わない。043 は現在の店名を読む。
 *
 * 作らないシード: 強化買取（タグID 1000）・目玉の件数や除外条件・コピー元との比較・DBで商品名を書き換えるケースのシード（理由は PM への報告に書く）。
 *
 * 決め打ちの識別の値（カテゴリ名・商品コード・商品名）には実行ごとの印を付ける（rc。依頼者決定 2026-10-28）。
 * 第一階層の「最新セット」「スタンダード」は、アプリが ID で最新セット・フォーマットの枠に振り分ける既存のカテゴリなので、印を付けずに既存を使う。
 * シード表が値を定めないもので、ここで決めたこと（各シードの報告にも出す）:
 * - カテゴリ名(英)は、半角英字・数字・空白・ハイフンだけの英語名。
 * - BULK-004 の商品カテゴリ(ID)は、管理画面の最上位カテゴリ「サプライ・グッズ」のID（F05-04 と同じ）。原価単価・サイズ・重量・購入グループ名称はグッズ商品CSVの共通の値。
 * - 「商品検索インデックスを更新する」は、外部の商品検索サービスへの送信で手元に無いので行わない（ケース004は商品詳細を開くだけで、検索を使わない）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { CategoryPage, uploadCategoryRows } from "../pages/admin/category";
import { まとめて買取商品IDを読む, 店名を読む } from "../pages/admin/f05_01_setup";
import { TagPage } from "../pages/admin/m03_13_tag";
import { PurchaseTopPage, カードの内容 } from "../pages/front/f05_01_purchase_top";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode, readGoodsRootCategoryId } from "../pages/admin/m03_23_seed_products";

/** BULK-004 の商品（ケースで商品名を確かめる） */
export const F0501_まとめて買取商品 = { 商品コード: "BULK-F0501-004", 商品名: "まとめて買取商品F0501-004" };

defineSeed("S-F05-01-BULK-SETTING", async ({ browser }) => {
  const seedId = "S-F05-01-BULK-SETTING";
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const now = await まとめて買取商品IDを読む(page);
    reportSeedIssue(seedId, `追加システム設定にまとめて買取商品IDの欄がある（いまの値「${now}」）。値は使うケースの開始時に設定する`);
  });
});

defineSeed("S-F05-01-CATEGORY-ROOTS", async ({ browser, notes }) => {
  const seedId = "S-F05-01-CATEGORY-ROOTS";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const category = new CategoryPage(page);
    await category.openTop();
    const has = async (name: string) => (await category.rowValues()).filter((r) => r.nameJp === name).length;
    const missing = [];
    for (const name of ["最新セット", "スタンダード"]) {
      const n = await has(name);
      if (n > 1) throw new Error(`${seedId}: 最上位の一覧に「${name}」が ${n} 件ある（1件のはず）`);
      if (n === 0) missing.push(name);
    }
    if (missing.length > 0) {
      await uploadCategoryRows(page, missing.map((name) => ({
        nameJp: name, nameEn: name === "最新セット" ? "Latest Set" : "Standard", parentId: "0", frontHide: "0", branchHide: "0",
      })), `${seedId}.csv`, `${seedId} のカテゴリ登録CSV`, issue);
      await category.openTop();
      issue(`最上位に無かった「${missing.join("」「")}」をカテゴリ登録CSVで作った`);
    }
    const ids: Record<string, string> = {};
    for (const name of ["最新セット", "スタンダード"]) {
      ids[name] = await category.idOf(name);
      // 共有の第一階層を使うときは、シード表どおり公開（フロント非表示でない）かを編集画面で確かめる
      await category.openEdit(ids[name]);
      if (await category.frontHide.isChecked()) throw new Error(`${seedId}: 「${name}」（ID ${ids[name]}）がフロント非表示になっている`);
      await category.openTop();
    }
    if (missing.length === 0) issue(`最上位の既存の「最新セット」（ID ${ids["最新セット"]}）・「スタンダード」（ID ${ids["スタンダード"]}）を使った（どちらも公開）`);
    notes.set("〔カテゴリID-F0501-共有A〕", ids["最新セット"]);
    notes.set("〔カテゴリID-F0501-共有B〕", ids["スタンダード"]);
  });
});

defineSeed("S-F05-01-BULK-004", async ({ browser, notes }) => {
  const seedId = "S-F05-01-BULK-004";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const code = rc(F0501_まとめて買取商品.商品コード);
  const name = rc(F0501_まとめて買取商品.商品名);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const categoryId = await readGoodsRootCategoryId(page);
    await registerGoodsCsv(page, {
      what: `${seedId}: グッズ商品CSV登録`, fileName: `${seedId}-goods.csv`, categoryId,
      lines: [{ code, nameJp: name, nameEn: code, values: { "基準価格": "500", "販売価格": "500", "買取価格": "500" } }],
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`),
      uploadWaitMs: 120_000,
    });
    const productId = await openProductEditByCode(page, code);
    const rows = await classRowsFromProductEdit(page, productId);
    if (rows.length !== 1) throw new Error(`${seedId}: 商品ID ${productId} の商品規格一覧の行が ${rows.length} 件（1件のはず）`);
    notes.set("〔商品ID-F0501-004〕", productId);
    notes.set("〔規格ID-F0501-004〕", rows[0].商品規格ID);
    issue(`商品コード ${code}・商品名「${name}」で作った（言語は日本語・公開・基準価格・販売価格・買取価格 500円）。商品規格IDは商品規格一覧の行（${rows[0].言語}・${rows[0].状態}）から読んだ`);
  });
  issue("商品カテゴリ(ID)は最上位カテゴリ「サプライ・グッズ」のID。商品検索インデックスの更新は外部の検索サービスへの送信で手元に無いので行わない（ケースは商品詳細を開くだけ）");
});

/** 親（控えたカテゴリID）を選んだカテゴリ登録画面で「子カテゴリ作成」を押し、振られたIDを返す */
async function 子カテゴリを作る(browser: Browser, seedId: string, defs: { 親: string | "前の行"; 名称: string; 英名: string; 検索パラメータ?: string }[]): Promise<string[]> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const ids: string[] = [];
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const category = new CategoryPage(page);
    for (const d of defs) {
      const parentId = d.親 === "前の行" ? ids[ids.length - 1] : d.親;
      ids.push(await category.createChild(parentId, {
        nameJp: rc(d.名称), nameEn: d.英名, frontHide: false,
        ...(d.検索パラメータ !== undefined ? { searchParameters: d.検索パラメータ } : {}),
      }, issue));
    }
  });
  issue(`作ったカテゴリ: ${defs.map((d, i) => `「${rc(d.名称)}」ID ${ids[i]}`).join("・")}（カテゴリ名(英)は英語名）`);
  return ids;
}

defineSeed("S-F05-01-CATEGORY-019", { needs: ["S-F05-01-CATEGORY-ROOTS"] }, async ({ browser, notes }) => {
  const [a, b] = await 子カテゴリを作る(browser, "S-F05-01-CATEGORY-019", [
    { 親: notes.get("〔カテゴリID-F0501-共有A〕"), 名称: "タルキール：龍嵐録-019", 英名: "Tarkir Dragonstorm 019" },
    { 親: notes.get("〔カテゴリID-F0501-共有B〕"), 名称: "エルドレインの森-019", 英名: "Wilds of Eldraine 019" },
  ]);
  notes.set("〔カテゴリID-F0501-019A〕", a);
  notes.set("〔カテゴリID-F0501-019B〕", b);
});

defineSeed("S-F05-01-CATEGORY-020", { needs: ["S-F05-01-CATEGORY-ROOTS"] }, async ({ browser, notes }) => {
  const [a, b] = await 子カテゴリを作る(browser, "S-F05-01-CATEGORY-020", [
    { 親: notes.get("〔カテゴリID-F0501-共有A〕"), 名称: "タルキール：龍嵐録 ブースター・ファン-020", 英名: "Tarkir Dragonstorm Booster Fun 020" },
    { 親: "前の行", 名称: "神話レア＆レア-020", 英名: "Mythic and Rare 020", 検索パラメータ: "rarity[0]=4&rarity[1]=3" },
  ]);
  notes.set("〔カテゴリID-F0501-020A〕", a);
  notes.set("〔カテゴリID-F0501-020B〕", b);
});

/** 044〜046: 「セットF0501-0NN-A」を最新セットの下に、「レアリティF0501-0NN-B」をその下に（検索条件 rarity[0]=4） */
async function セットとレアリティ(browser: Browser, seedId: string, latestSetId: string, no: string): Promise<void> {
  await 子カテゴリを作る(browser, seedId, [
    { 親: latestSetId, 名称: `セットF0501-${no}-A`, 英名: `Set F0501 ${no} A` },
    { 親: "前の行", 名称: `レアリティF0501-${no}-B`, 英名: `Rarity F0501 ${no} B`, 検索パラメータ: "rarity[0]=4" },
  ]);
}
defineSeed("S-F05-01-CATLINK-044", { needs: ["S-F05-01-CATEGORY-ROOTS"] },
  ({ browser, notes }) => セットとレアリティ(browser, "S-F05-01-CATLINK-044", notes.get("〔カテゴリID-F0501-共有A〕"), "044"));
defineSeed("S-F05-01-CATSORT-045", { needs: ["S-F05-01-CATEGORY-ROOTS"] },
  ({ browser, notes }) => セットとレアリティ(browser, "S-F05-01-CATSORT-045", notes.get("〔カテゴリID-F0501-共有A〕"), "045"));
defineSeed("S-F05-01-BANNER-046", { needs: ["S-F05-01-CATEGORY-ROOTS"] },
  ({ browser, notes }) => セットとレアリティ(browser, "S-F05-01-BANNER-046", notes.get("〔カテゴリID-F0501-共有A〕"), "046"));

// ==== 既存データへの読み替え（ネット買取トップページの目玉買取商品・買取特集コーナー） ====

const 読み替え = (seedId: string, m: string) => reportSeedIssue(seedId, m);

/** ネット買取トップページに今出ている既存の商品（目玉買取商品・買取特集コーナーのタグごと）を読む */
async function トップの既存商品を読む(browser: Browser): Promise<{ 目玉: カードの内容[]; 特集: Record<string, カードの内容[]> }> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    const top = new PurchaseTopPage(page);
    const status = await top.開く();
    if (status >= 400) throw new Error(`ネット買取トップページが開けない（応答 ${status}）`);
    const 目玉 = (await top.区画の描画を待つ(top.目玉の区画)) ? await top.カードを読む(top.カード(top.目玉の区画)) : [];
    const 特集: Record<string, カードの内容[]> = {};
    if ((await top.特集の枠すべて.count()) > 0) {
      await top.特集の描画を待つ();
      for (const { タグID } of await top.特集の枠の一覧()) 特集[タグID] = await top.カードを読む(top.カード(top.特集の枠(タグID)));
    }
    return { 目玉, 特集 };
  } finally {
    await context.close();
  }
}

/**
 * シード表が控えると定めた呼び名（〔商品ID-…〕・〔規格ID-…〕）に、選んだ既存の商品の値を控える。
 * 呼び名の後ろの部分（例 F0501-030A）が同じ商品ID・規格IDは同じ商品の値。違う部分は pool の先頭から順に別の商品を当てる（足りなければ使い回す）。
 * 規格ID は商品カードの詳細リンクの class から読むので、読める商品だけを当てる。
 */
function 呼び名を控える(seedId: string, seed: Record<string, string>, notes: Notes, pool: カードの内容[], 説明: string): カードの内容[] {
  const labels = Notes.labelsIn(seed["状態・属性"] + seed["投入方法"]).filter((l) => !l.includes("…"));
  const usable = pool.filter((c) => c.商品ID !== "" && c.規格ID !== null);
  if (usable.length === 0) throw new Error(`${seedId}: ${説明}が、ネット買取トップページの既存データに見つからない（商品が1件も出ていない）`);
  const bySuffix = new Map<string, カードの内容>();
  const used: カードの内容[] = [];
  for (const l of labels) {
    const m = l.match(/^〔(商品ID|規格ID)-(.+)〕$/);
    if (!m) throw new Error(`${seedId}: 呼び名 ${l} の控え方が決まっていない`);
    let c = bySuffix.get(m[2]);
    if (!c) {
      c = usable[bySuffix.size % usable.length];
      bySuffix.set(m[2], c);
      used.push(c);
    }
    notes.set(l, m[1] === "商品ID" ? c.商品ID : c.規格ID!);
  }
  読み替え(seedId, `${説明}。商品の登録・タグの設定・索引の更新（外部の検索サービス）は行わず、今ネット買取トップページに出ている既存の商品で代えた: ${used.map((c) => `「${c.商品名}」（商品ID ${c.商品ID}・規格ID ${c.規格ID}・買取価格 ${c.買取価格 ?? "—"}円）`).join("、")}`);
  return used;
}

defineSeed("S-F05-01-TAGS", async ({ browser }) => {
  const seedId = "S-F05-01-TAGS";
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const tag = new TagPage(page);
    await tag.showFirstPageWith("12000");
    const rows = await tag.allRows();
    const need = ["5", "633", "634", "635", "636", "637", "638"];
    const missing = need.filter((id) => !rows.some((r) => r.ID === id));
    if (missing.length > 0) throw new Error(`${seedId}: 管理画面のタグ一覧に、ネット買取トップページが決め打ちで使うタグID ${missing.join("・")} が無い`);
    const has1000 = rows.some((r) => r.ID === "1000");
    読み替え(seedId, `タグID 1000・5・633〜638 のタグそのものをDBで設定する前提は行わず、既存のタグ一覧にタグID ${need.join("・")} があることを確かめた（タグID 1000 は${has1000 ? "ある" : "無い"}）。対象商品・優先表示商品の設定（共有のタグの書き換え）は行わない`);
  });
});

defineSeed("S-F05-01-CART-EMPTY", async ({ browser }) => {
  const seedId = "S-F05-01-CART-EMPTY";
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    const res = await page.goto(`${BASE_URL}/ja/purchase/cart`, { waitUntil: "load", timeout: 60_000 });
    if ((res?.status() ?? 0) >= 400) throw new Error(`${seedId}: 買取カートが開けない`);
    const lines = await page.locator(".purchase-cart__line").count();
    if (lines !== 0) throw new Error(`${seedId}: 新しいブラウザセッションの買取カートに商品が ${lines} 件ある（0件のはず）`);
  } finally {
    await context.close();
  }
  読み替え(seedId, "新しいブラウザセッションを開始し、買取カート画面で商品数0件を確かめた（ケース本体は別の新しいセッションで動く）");
});

defineSeed("S-F05-01-SPC-GROUP-009", { needs: ["S-F05-01-TAGS"] }, async ({ browser, seed, notes }) => {
  const { 特集 } = await トップの既存商品を読む(browser);
  呼び名を控える("S-F05-01-SPC-GROUP-009", seed, notes, Object.values(特集).flat(), "6タグ24商品を登録する代わりに、買取特集コーナーの既存の商品");
});

defineSeed("S-F05-01-SPC-LIMIT-012", { needs: ["S-F05-01-TAGS"] }, async ({ browser, seed, notes }) => {
  const { 特集 } = await トップの既存商品を読む(browser);
  呼び名を控える("S-F05-01-SPC-LIMIT-012", seed, notes, Object.values(特集).flat(), "6タグ24商品を登録する代わりに、買取特集コーナーの既存の商品");
});

/** 013〜018: 買取特集コーナーのタグごとの「もっと見る」。そのタグの枠に出ている既存の商品を控える */
for (const [no, tagId] of [["013", "633"], ["014", "634"], ["015", "635"], ["016", "637"], ["017", "636"], ["018", "638"]] as const) {
  const seedId = `S-F05-01-SPC-LINK-${no}`;
  defineSeed(seedId, { needs: ["S-F05-01-TAGS"] }, async ({ browser, seed, notes }) => {
    const { 特集 } = await トップの既存商品を読む(browser);
    呼び名を控える(seedId, seed, notes, 特集[tagId] ?? [], `タグID ${tagId} の商品を1件登録する代わりに、買取特集コーナーのタグID ${tagId} の枠に出ている既存の商品`);
  });
}

defineSeed("S-F05-01-FEAT-BOUNDARY-030", { needs: ["S-F05-01-TAGS"] }, async ({ browser, seed, notes }) => {
  const seedId = "S-F05-01-FEAT-BOUNDARY-030";
  const { 目玉 } = await トップの既存商品を読む(browser);
  const 未満 = 目玉.filter((c) => c.買取価格 !== null && c.買取価格 > 0 && c.買取価格 < 500 && c.規格ID !== null);
  const 以上 = 目玉.filter((c) => c.買取価格 !== null && c.買取価格 >= 500 && c.数量の操作.カートに入れる && c.規格ID !== null);
  if (未満.length === 0) throw new Error(`${seedId}: 目玉買取商品の既存の商品に、買取価格500円未満（499円相当）の商品が無い`);
  if (以上.length === 0) throw new Error(`${seedId}: 目玉買取商品の既存の商品に、買取価格500円以上で数量の操作がある商品が無い`);
  // 呼び名の A/B を、500円未満（A）と500円以上（B）の商品に当てる
  for (const l of Notes.labelsIn(seed["状態・属性"] + seed["投入方法"])) {
    const m = l.match(/^〔(商品ID|規格ID)-.+([AB])〕$/);
    if (!m) throw new Error(`${seedId}: 呼び名 ${l} の控え方が決まっていない`);
    const c = m[2] === "A" ? 未満[0] : 以上[0];
    notes.set(l, m[1] === "商品ID" ? c.商品ID : c.規格ID!);
  }
  読み替え(seedId, `買取価格499円・500円の商品を登録する代わりに、目玉買取商品に出ている既存の商品で代えた: A（500円未満）「${未満[0].商品名}」${未満[0].買取価格}円（商品ID ${未満[0].商品ID}）、B（500円以上）「${以上[0].商品名}」${以上[0].買取価格}円（商品ID ${以上[0].商品ID}）`);
});

for (const no of ["031", "032", "033", "034", "035"]) {
  const seedId = `S-F05-01-CART-${no}`;
  defineSeed(seedId, { needs: ["S-F05-01-TAGS", "S-F05-01-CART-EMPTY"] }, async ({ browser, seed, notes }) => {
    const { 目玉 } = await トップの既存商品を読む(browser);
    const 候補 = 目玉.filter((c) => c.買取価格 !== null && c.買取価格 >= 500 && c.数量の操作.カートに入れる && c.数量の操作.プラス && c.数量の操作.マイナス);
    呼び名を控える(seedId, seed, notes, 候補, "「目玉500円商品」を登録する代わりに、目玉買取商品に出ている買取価格500円以上で数量の操作がある既存の商品");
  });
}

defineSeed("S-F05-01-LANGUAGE-037", { needs: ["S-F05-01-TAGS"] }, async ({ browser, seed, notes }) => {
  const { 目玉, 特集 } = await トップの既存商品を読む(browser);
  呼び名を控える("S-F05-01-LANGUAGE-037", seed, notes, [...目玉, ...Object.values(特集).flat()], "8タグ16商品を登録する代わりに、目玉買取商品・買取特集コーナーの既存の商品");
});

defineSeed("S-F05-01-FEAT-MORE-040", { needs: ["S-F05-01-TAGS"] }, async ({ browser, seed, notes }) => {
  const { 目玉 } = await トップの既存商品を読む(browser);
  呼び名を控える("S-F05-01-FEAT-MORE-040", seed, notes, 目玉, "タグID 5 の商品を1件登録する代わりに、目玉買取商品に出ている既存の商品");
});

defineSeed("S-F05-01-ZOOM-041", { needs: ["S-F05-01-TAGS"] }, async ({ browser }) => {
  const { 目玉 } = await トップの既存商品を読む(browser);
  const 画像あり = 目玉.filter((c) => !c.画像なし);
  if (画像あり.length === 0) throw new Error("S-F05-01-ZOOM-041: 目玉買取商品の既存の商品に、商品画像のある商品が無い");
  読み替え("S-F05-01-ZOOM-041", `「拡大確認商品F0501-041-A」を登録して画像を付ける代わりに、目玉買取商品に出ている商品画像のある既存の商品（例「${画像あり[0].商品名}」）で代えた。ケースは画像のある先頭の商品を使う`);
});

defineSeed("S-F05-01-SHOPNAME-043", { needs: ["S-F05-01-TAGS"] }, async ({ browser }) => {
  const seedId = "S-F05-01-SHOPNAME-043";
  const name = await withAdminSession(browser, SETUP_ADMIN, async (page) => 店名を読む(page));
  if (name === "") throw new Error(`${seedId}: 基本設定の店名が空`);
  読み替え(seedId, `店名を「ショップF0501-043-A」に書き換えることは、共有の設定の書き換えになるため行わず、いまの店名「${name}」で代えた。商品の登録も行わない（目玉買取商品の既存の商品がある状態でそのまま見る）`);
});
