/**
 * M03-03 カード商品CSV出力の画面シード。正本: cases/M03-03_seed_data.tsv
 *
 * 作ったシード: ADM・MASTER・PAGING-011/012・MIXED-007/013/014・NOSRC-025・ONECAT-028。
 * 作らないシード（これらを使うケースは実装していない。理由は review/M03-03_progress_2026-11-20_dev.md）:
 * - CONFIG（CSV出力の文字コード・区切り文字の設定）: 全員が使う共有の設定を書き換える（015・016・020・024・030〜032）。
 * - RICH-002〜005・SPARSE-006・MULTI-027・ONETAG-029・CBNONNM/CBNOCARD/CBNONE-030〜032・FORMAT-*・TABSEP-024: 言語ID 11・12の規格、発送日目安（翌日・3日後）、
 *   規格画像、DB での未設定化、売上分析タグ・タグの付与など、既存の画面の部品が無い作りが要る。
 *
 * 作り方（カード商品）: グッズ商品CSV登録で1商品を取り込み → 試験用のカードを1枚登録 → 商品登録編集の「カード指定 >」でカード詳細を指定 → 商品規格を足す。
 * シードでの解釈:
 * - 商品コード・カード名には実行の印を付ける。PAGING の商品名は、検索で自分の11件だけが出るよう、名前の中に実行の印を入れる（M0303CASE011<印>-01）。
 * - 言語ID 11・12は、画面の部品が選べる「日本語」「英語」で代える（取込の規格＝日本語、足す規格＝英語）。同じ商品の同じ言語・同じ状態の規格は作れない作りのため。
 *   007 は NM が2件（日本語・英語）と EX が1件（日本語）。期待結果は規格の数と商品IDしか見ないので、言語の違いは結果に関わらない。
 * - 規格の価格は 100（正本は定めない）。公開ステータスは、取込の規格・足す規格とも画面の部品の既定のまま（足す規格は公開）。
 * - MASTER: 購入グループ「通常商品」の存在を参照で確かめ、略称タグ・売上分析タグ2件・タグ2件を画面で作る。商品カテゴリ「共有A」「共有B」は、最上位には作れない
 *   （最上位のカテゴリ登録画面に入力欄が無い）ので、グッズ（サプライ・グッズ）の直下に子カテゴリとして作った。ほかの値（商品公開ステータス「廃止」・割引率5・買取減額率7・
 *   カード状態NM・EX・規格公開状態「公開」・地域別販売制限2）は既存のマスタにあるものを参照で確かめるだけ（発送日目安「翌日」「3日後」と言語ID 11・12の規格は、ここで使うケースが無いので見ない）。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 購入グループがあるか, 商品公開ステータスの名称 } from "../db/m03_03";
import { RUN_MARK, rc } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { CategoryPage } from "../pages/admin/category";
import { Issue, グッズ商品を取り込む, 商品のカテゴリを付け替える, 取込の商品と規格を読む, 規格を足す } from "../pages/admin/a17_05_setup";
import { カードを紐付ける, 試験用のカードを作る } from "../pages/admin/a02_setup";
import { ShortTagPage } from "../pages/admin/short_tag";
import { TagPage } from "../pages/admin/m03_13_tag";
import { SalesAnalysisTagPage } from "../pages/admin/m03_17_sales_analysis_tag";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { readGoodsRootCategoryId } from "../pages/admin/m03_23_seed_products";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { defineSeed, reportCurrentSeedIssue } from "./current_seed";

export const M0303_ADMIN: Account = { loginId: "m0303_admin", password: "Passw0rd!M0303" };

defineSeed("S-M03-03-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M03-03試験管理者", account: M0303_ADMIN, メール: "m0303-admin@example.test" });
  reportCurrentSeedIssue("権限は、商品管理を操作できる「システム管理者」にした（権限の細かい指定はシード表に無い）");
});

defineSeed("S-M03-03-MASTER", { needs: ["S-M03-03-ADM"] }, async ({ browser, notes }) => {
  const miss: string[] = [];
  if (!購入グループがあるか("通常商品")) miss.push("購入グループ「通常商品」");
  if (!商品公開ステータスの名称().includes("廃止")) miss.push("商品公開ステータス「廃止」");
  if (miss.length) throw new Error(`開発環境のマスタに ${miss.join("・")} が無い（共有のマスタなので足さない）`);
  const issue: Issue = (m) => reportCurrentSeedIssue(m);
  await withAdminSession(browser, SETUP_ADMIN, async (page: Page) => {
    page.setDefaultTimeout(60_000);
    const 短 = new ShortTagPage(page);
    await 短.openNew();
    notes.set("〔略称タグID-M0303-共有〕", await 短.register({ 名称: rc("M0303略称"), 並び順: "9999", アルファベット順: false }, "略称タグ「M0303略称」の登録"));
    const 売 = new SalesAnalysisTagPage(page);
    for (const k of ["A", "B"]) {
      await 売.openNew();
      notes.set(`〔売上分析タグID-M0303-共有${k}〕`, await 売.register({ 名称: rc(`M0303分析${k}`), 並び順: "9999" }, `売上分析タグ「M0303分析${k}」の登録`));
    }
    const タグ = new TagPage(page);
    for (const k of ["A", "B"]) {
      await タグ.openNew();
      notes.set(`〔タグID-M0303-共有${k}〕`, await タグ.register({ 名称日: rc(`M0303タグ${k}`), 名称英: rc(`M0303Tag${k}`) }, `タグ「M0303タグ${k}」の登録`));
    }
    const root = await readGoodsRootCategoryId(page);
    const c = new CategoryPage(page);
    for (const k of ["A", "B"]) {
      notes.set(`〔商品カテゴリID-M0303-共有${k}〕`, await c.createChild(root, { nameJp: rc(`M0303カテゴリ${k}`), nameEn: rc(`M0303Category${k}`) }, issue));
    }
  });
  issue("商品カテゴリ「共有A」「共有B」は、最上位に作れないので、グッズ（サプライ・グッズ）の直下の子カテゴリとして画面で作った。ほかのマスタ（割引率5・買取減額率7・カード状態・地域別販売制限2など）は既存のものを使う");
});

// ---- ケース専用の商品 ----

/** カード商品を1つ作る（取込 → カード登録 → カード指定 → 規格を足す）。商品IDを返す */
async function カード商品を作る(browser: Browser, seedId: string, 番号: string, 追加の規格: { 言語: "日本語" | "英語"; 状態: "NM" | "EX" }[]): Promise<{ 商品ID: string; カード詳細ID: string; 規格ID: string[]; 商品名: string }> {
  const issue: Issue = (m) => reportCurrentSeedIssue(m);
  const 商品名 = rc(`M0303CASE${番号}`);
  const 商品コード = rc(`M0303-${番号}-A`);
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await グッズ商品を取り込む(page, seedId, [{ 商品コード, 商品名日: 商品名, 商品名英: 商品名, 価格: "100" }], issue);
    const カード = await 試験用のカードを作る(page, { カード名日: rc(`M0303CARD${番号}`), カード名英: rc(`M0303CARD${番号}`), 詳細数: 1 }, `${seedId} のカード`, issue);
    const { 商品ID, 規格ID } = await 取込の商品と規格を読む(page, 商品コード, issue);
    await カードを紐付ける(page, 商品ID, { 商品名日: 商品名, 商品名英: 商品名 }, { カード詳細ID: カード.カード詳細IDs[0], カード名: カード.カード名 }, issue);
    const ids = [規格ID];
    for (const [i, r] of 追加の規格.entries()) {
      ids.push(await 規格を足す(page, 商品ID, { 言語: r.言語, 状態: r.状態, 商品コード: rc(`M0303-${番号}-${"BCDE"[i]}`), 価格: "100" }, `${seedId} の規格${"BCDE"[i]}`, issue));
    }
    return { 商品ID, カード詳細ID: カード.カード詳細IDs[0], 規格ID: ids, 商品名 };
  });
}

/** シード表の文にある呼び名（商品ID・カード詳細ID・規格ID）を、作った値で控える。規格IDの呼び名は文に出てくる順（A・B・C…）に、作った規格へ当てる */
function 控える(notes: Notes, seedId: string, v: { 商品ID: string; カード詳細ID: string; 規格ID: string[] }): void {
  const seed = getSeed(seedId);
  const labels = Notes.labelsIn(seed["状態・属性"] + seed.投入方法);
  const 規格 = labels.filter((l) => /^〔規格ID-/.test(l)).sort();
  if (規格.length !== v.規格ID.length) throw new Error(`${seedId}: 規格IDの呼び名が ${規格.length} 件、作った規格が ${v.規格ID.length} 件`);
  for (const l of labels) {
    if (/^〔商品ID-/.test(l)) notes.set(l, v.商品ID);
    else if (/^〔カード詳細ID-/.test(l)) notes.set(l, v.カード詳細ID);
    else if (/^〔規格ID-/.test(l)) notes.set(l, v.規格ID[規格.indexOf(l)]);
    
  }
}

defineSeed("S-M03-03-MIXED-007", { needs: ["S-M03-03-MASTER"] }, async ({ browser, notes }) => {
  控える(notes, "S-M03-03-MIXED-007", await カード商品を作る(browser, "S-M03-03-MIXED-007", "007", [{ 言語: "英語", 状態: "NM" }, { 言語: "日本語", 状態: "EX" }]));
});
for (const k of ["013", "014"]) {
  defineSeed(`S-M03-03-MIXED-${k}`, { needs: ["S-M03-03-MASTER"] }, async ({ browser, notes }) => {
    控える(notes, `S-M03-03-MIXED-${k}`, await カード商品を作る(browser, `S-M03-03-MIXED-${k}`, k, [{ 言語: "英語", 状態: "NM" }]));
  });
}
defineSeed("S-M03-03-NOSRC-025", { needs: ["S-M03-03-MASTER"] }, async ({ browser, notes }) => {
  控える(notes, "S-M03-03-NOSRC-025", await カード商品を作る(browser, "S-M03-03-NOSRC-025", "025", []));
});
defineSeed("S-M03-03-ONECAT-028", { needs: ["S-M03-03-MASTER"] }, async ({ browser, notes }) => {
  const v = await カード商品を作る(browser, "S-M03-03-ONECAT-028", "028", []);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await 商品のカテゴリを付け替える(page, v.商品ID, [notes.get("〔商品カテゴリID-M0303-共有A〕")], "S-M03-03-ONECAT-028 の商品カテゴリ", (m) => reportCurrentSeedIssue(m));
  });
  // シード表は商品名(日)を「M0303-028-A」と定める（取込の商品名 M0303CASE028 ではない）。ここでは取込の商品名のまま使い、商品名はケースで確かめない
  控える(notes, "S-M03-03-ONECAT-028", v);
});

// ---- 11件の商品（ページ送り） ----
for (const k of ["011", "012"]) {
  defineSeed(`S-M03-03-PAGING-${k}`, { needs: ["S-M03-03-MASTER"] }, async ({ browser }) => {
    const issue: Issue = (m) => reportCurrentSeedIssue(m);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const lines = Array.from({ length: 11 }, (_, i) => {
        const n = String(i + 1).padStart(2, "0");
        const 名 = `M0303CASE${k}${RUN_MARK}-${n}`;
        return { 商品コード: rc(`M0303-${k}-${n}`), 商品名日: 名, 商品名英: 名, 価格: "100" };
      });
      await グッズ商品を取り込む(page, `S-M03-03-PAGING-${k}`, lines, issue);
    });
    reportCurrentSeedIssue(`商品名は、検索で自分の11件だけが出るよう、名前の中に実行の印を入れた（M0303CASE${k}${RUN_MARK}-01〜11）`);
  });
}
/** PAGING の商品名の検索語（実行の印を含む。正本の「M0303CASE011」「M0303CASE012」に当たる） */
export const ページ送りの検索語 = (番号: "011" | "012"): string => `M0303CASE${番号}${RUN_MARK}`;
