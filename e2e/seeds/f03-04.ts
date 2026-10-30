/**
 * F03-04 カテゴリ一覧の画面シード。正本: cases/F03-04_seed_data.tsv
 *
 * 作り方（シード表の投入方法の順）:
 * 1. 管理画面の「カテゴリ登録CSV」画面で、カテゴリIDと表示ランクを空にした新規登録用のCSVを取り込む。
 *    カテゴリ一覧（最上位、または親を開いた一覧）の行から、振られたカテゴリIDを控える。
 * 2. 同じ画面で、控えたカテゴリIDと表示ランクを入れた更新用のCSVを取り込み、表示順を設定する。
 * 3. 管理画面のキャッシュ管理で「キャッシュ削除」を押し、カテゴリ表示用キャッシュを削除する。
 *
 * 作らないシード（記録 e2e/review/F03-04_progress_2026-10-30.md）:
 * - CATEGORIES（カテゴリID 100〜600は画面で指定できずDBへ直接設定する）、PRODUCTS（商品を作ったあと検索サービスへ送信し索引への反映を待つ）。
 *   依頼者の決まりで、DBでの準備・外部の試験環境が要るシードは実装しない。
 *
 * 決め打ちの識別の値（カテゴリ名）には、実行ごとの印を付ける（rc。依頼者決定 2026-10-28）。
 * カテゴリ名(英)は「任意の英語名」と定める行は印なしの英語名、正本が値を定める行（015）は正本の値のまま。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { CategoryCsvRow } from "../pages/admin/category";
import { キャッシュを削除する, 最上位に取り込む } from "../pages/admin/f03_04_category";
import { ensureMember } from "../pages/admin/member";

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
