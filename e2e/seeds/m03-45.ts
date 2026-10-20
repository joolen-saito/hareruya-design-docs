/**
 * M03-45 カテゴリ一覧の画面シード。正本: cases/M03-45_seed_data.tsv
 *
 * 正本の作り方はどれも同じ形をしている。
 * 1. 最上位のカテゴリは、カテゴリ登録CSV画面で新規行（カテゴリIDと表示ランクは空・親カテゴリID「0」・両非表示フラグ「0」）を取り込む。
 *    カテゴリ名(英)は取込で必須なので、正本の英名か、仮の値「Tmp」を入れる。最上位の一覧の行のID欄からカテゴリIDを控える。
 * 2. 子のカテゴリは、一覧で親のカテゴリ名を押して直下の一覧を開き、カテゴリ名を入れて「子カテゴリ作成」を押す。直下の一覧の行のID欄から控える。
 * 3. 登録し終えてから、カテゴリ登録CSV画面で更新行を取り込んで表示順を設定する。仮の値「Tmp」を入れたカテゴリ名(英)は、
 *    一覧の行の編集ボタンから開いたカテゴリ編集画面で空にして「カテゴリ更新」を押す。
 * 表示順はカテゴリ全体で1つの並び（親をまたぐ）。子カテゴリの登録は、親の表示順以上の全カテゴリの表示順を1つずつ増やし、
 * 削除は、削除したカテゴリより大きい全カテゴリの表示順を1つずつ減らす。
 *
 * 作らないシード:
 * - S-M03-45-CSV-029・S-M03-45-DP-CSVONE-043: 既存のカテゴリと商品との関連の退避と復元を、DBへ直接設定する。
 * - S-M03-45-QD-ADM・S-M03-45-QD-CREATE-039・S-M03-45-QD-MOVE-040: ケース039・040だけが使う。両ケースは、管理画面の
 *   キャッシュ管理の「キャッシュ削除」（画面の操作。手元の環境ではメンテナンスモードの切り替えは起きず、キャッシュの作り直しだけ）を
 *   手順とシードに含む。規約の除外項目には当たらないが、手元の環境で押してよいかを依頼者に確かめてから実装する（判断待ち）。
 */
import { expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { CategoryCsvRow, uploadCategoryRows } from "../pages/admin/category";
import { expectSaved } from "../pages/admin/common";
import { downloadGoodsCsvTemplate, publishedValue } from "../pages/admin/m03_01_goods_csv";
import { readGoodsProductId } from "../pages/admin/m03_01_goods_list_seed";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import {
  CategoryListPage, categoryListUrl, ensureCategoryCsvOutputs, productIdsByCode, purgeCategoryRows, relateProductOnlyTo,
} from "../pages/admin/m03_45_category_list";
import { ensureMember } from "../pages/admin/member";

export const M0345_ADMIN: Account = { loginId: "m0345_admin", password: "Passw0rd!M0345" };

/** CSVを確かめるケースが開始時に出力対象にする、カテゴリCSVの出力項目（正本 S-M03-45-CSV-CONFIG） */
export const CATEGORY_CSV_ITEMS = ["カテゴリID", "カテゴリ名(日)", "カテゴリ名(英)"];

/** 取込で必須のための仮のカテゴリ名(英) */
const TMP = "Tmp";

const label = (suffix: string) => `〔カテゴリID-M0345-${suffix}〕`;

/** 正本は所属店舗を指定しない。管理画面で利用可能な店舗を1つ選び、商品管理を操作できるシステム管理者の権限を付ける（M03-14 と同じ作り方） */
async function createAdmin(page: Page): Promise<void> {
  await page.goto(adminUrl("/setting/system/member/new"));
  const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((options) => options
    .map((option) => option as HTMLOptionElement)
    .filter((option) => option.value !== "")
    .map((option) => option.textContent?.trim() ?? "")
    .filter(Boolean));
  if (stores.length === 0) throw new Error("S-M03-45-ADM: メンバーに割り当てられる店舗が画面に無い");
  const store = stores[0];
  await ensureMember(page, {
    名前: "M03-45試験管理者", 所属店舗: store, ログインID: M0345_ADMIN.loginId, メールアドレス: "m0345_admin@example.test",
    パスワード: M0345_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: store, 編集可能店舗: [store],
  });
}

defineSeed("S-M03-45-ADM", async ({ browser }) => {
  // 正本の管理者ID（345000001）は画面の登録では指定できない（画面が振る）。ケースは管理者IDを使わない。
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page));
  // ログインでき（稼働中・ロックなし）、商品管理のカテゴリ一覧を開けることを、ケースとは別のセッションで確かめる
  await withAdminSession(browser, M0345_ADMIN, async (page) => {
    const list = new CategoryListPage(page);
    await list.openTop();
    expect(await list.subTitle(), "M03-45試験管理者でカテゴリ一覧を開けない").toBe("カテゴリ一覧");
  });
});

defineSeed("S-M03-45-CSV-CONFIG", async ({ browser, seed }) => {
  // カテゴリCSVの出力項目に、カテゴリID・カテゴリ名(日)・カテゴリ名(英)が入っていることを確かめ、無ければ移して登録する。
  // ほかの出力項目は外さない（解釈。ほかの機能の試験がカテゴリCSVの親カテゴリIDなどを読むため）。
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureCategoryCsvOutputs(page, CATEGORY_CSV_ITEMS, seed.シードID,
    (w) => reportSeedIssue(seed.シードID, w)));
});

/** シードを作る管理者のセッションで、正本の作り方の操作をする */
class SeedOps {
  readonly list: CategoryListPage;
  private files = 0;

  constructor(readonly page: Page, readonly seedId: string, readonly notes: Notes) {
    this.list = new CategoryListPage(page);
  }

  readonly warn = (w: string) => reportSeedIssue(this.seedId, w);

  private fileName(): string {
    this.files += 1;
    return `${this.seedId}-${this.files}.csv`;
  }

  note(suffix: string, id: string): void {
    this.notes.set(label(suffix), id);
  }

  /** 一覧を開く（親を指定しなければ最上位の一覧） */
  async openList(parentId: string | null): Promise<void> {
    if (parentId) await this.list.openChildrenOf(parentId); else await this.list.openTop();
  }

  /**
   * カテゴリ登録CSV画面で新規行を取り込み、最上位の一覧の行のID欄から、行ごとに今回の取込で増えた行のIDを読む。
   * newest: 正本が「同じ名前の行が複数あるときはIDが最も大きい行」と書いたとき。増えた行がIDの最も大きい行であることも確かめる。
   */
  async tops(rows: { nameJp: string; nameEn: string }[], newest = false): Promise<string[]> {
    await this.list.openTop();
    const before = new Set((await this.list.rowValues()).map((r) => r.id));
    await uploadCategoryRows(this.page, rows.map((r) => ({ nameJp: r.nameJp, nameEn: r.nameEn, parentId: "0", frontHide: "0", branchHide: "0" })),
      this.fileName(), `${this.seedId} のカテゴリ登録CSV（新規行${rows.length}行）`, this.warn);
    await this.list.openTop();
    const after = await this.list.rowValues();
    return rows.map((r) => {
      const same = after.filter((a) => a.nameJp === r.nameJp);
      const added = same.filter((a) => !before.has(a.id));
      if (added.length !== 1) throw new Error(`${this.seedId}: 最上位のカテゴリ「${r.nameJp}」のCSV登録で増えた行が ${added.length} 件`);
      if (same.length > 1) {
        const largest = String(Math.max(...same.map((s) => Number(s.id))));
        if (newest && largest !== added[0].id) {
          throw new Error(`${this.seedId}: 「${r.nameJp}」の行のうちIDが最も大きい行（${largest}）が、今回の取込で増えた行（${added[0].id}）ではない`);
        }
        this.warn(`最上位の一覧に「${r.nameJp}」の行が ${same.length} 件あり、今回の取込で増えた行（ID ${added[0].id}${newest ? "。IDが最も大きい行" : ""}）を控えた`);
      }
      return added[0].id;
    });
  }

  /** 一覧（listParent が null なら最上位の一覧）で親のカテゴリ名を押して直下の一覧を開き、子カテゴリを登録する */
  async child(listParent: string | null, parentId: string, nameJp: string, nameEn?: string): Promise<string> {
    await this.openList(listParent);
    await this.list.clickName(parentId);
    return this.childHere(parentId, nameJp, nameEn);
  }

  /** いま開いている親の直下の一覧で子カテゴリを登録し、直下の一覧の行のID欄から今回増えた行のIDを読む。nameEn を渡さなければ空のまま */
  async childHere(parentId: string, nameJp: string, nameEn?: string): Promise<string> {
    expect(this.page.url(), `${this.seedId}: カテゴリID ${parentId} の直下の一覧を開いていない`).toBe(categoryListUrl(parentId));
    const before = new Set((await this.list.rowValues()).filter((r) => r.nameJp === nameJp).map((r) => r.id));
    await this.list.fill(nameEn === undefined ? { nameJp } : { nameJp, nameEn });
    await this.list.submitAndWait();
    for (const w of await expectSaved(this.page, `${this.seedId}: 「${nameJp}」の子カテゴリ作成`)) this.warn(w);
    expect(this.page.url(), `${this.seedId}: 子カテゴリ作成のあとは親の直下の一覧へ戻る`).toBe(categoryListUrl(parentId));
    const added = (await this.list.rowValues()).filter((r) => r.nameJp === nameJp && !before.has(r.id));
    if (added.length !== 1) throw new Error(`${this.seedId}: 「${nameJp}」の子カテゴリ作成で増えた行が ${added.length} 件`);
    if (before.size > 0) this.warn(`親カテゴリ ${parentId} の直下に同名の「${nameJp}」が前から ${before.size} 件あり、登録で増えた行を控えた`);
    return added[0].id;
  }

  /** カテゴリ登録CSV画面で更新行（両非表示フラグ「0」）を取り込み、表示順を設定する */
  async ranks(rows: CategoryCsvRow[]): Promise<void> {
    await uploadCategoryRows(this.page, rows.map((r) => ({ frontHide: "0", branchHide: "0", ...r })), this.fileName(),
      `${this.seedId} のカテゴリ登録CSV（表示順の設定）`, this.warn);
  }

  /** 一覧（listParent が null なら最上位の一覧）で行の編集ボタンを押し、カテゴリ名（英）を空にして「カテゴリ更新」を押す */
  async clearEn(listParent: string | null, id: string): Promise<void> {
    await this.openList(listParent);
    await this.list.clickEdit(id);
    await expect(this.list.nameEn, `${this.seedId}: カテゴリID ${id} の編集画面のカテゴリ名（英）`).toBeVisible();
    await this.list.fill({ nameEn: "" });
    await this.list.submitAndWait();
    for (const w of await expectSaved(this.page, `${this.seedId}: カテゴリID ${id} のカテゴリ名（英）を空にする更新`)) this.warn(w);
  }

  /** 一覧（listParent が null なら最上位の一覧）の行の表示順を読み、違うものを「カテゴリID: 画面の値（求める値）」で返す */
  async sortMismatches(want: [string | null, string, string][]): Promise<string[]> {
    const out: string[] = [];
    for (const [listParent, id, sortNo] of want) {
      await this.openList(listParent);
      const row = (await this.list.rowValues()).find((r) => r.id === id);
      if (row?.sortNo !== sortNo) out.push(`${id}: ${row?.sortNo ?? "行なし"}（${sortNo}）`);
    }
    return out;
  }

  /** カテゴリ一覧のCSV出力項目設定で、項目を出力対象にする */
  async csvOutputs(labels: string[]): Promise<void> {
    await ensureCategoryCsvOutputs(this.page, labels, this.seedId, this.warn);
  }

  /** CSVダウンロードで条件に合うカテゴリの行が無いことを確かめる。あれば画面で削除して、もう一度確かめる。消したIDを返す */
  async purge(match: (r: Record<string, string>) => boolean): Promise<string[]> {
    return purgeCategoryRows(this.page, match, this.seedId, this.warn);
  }
}

function defineCategorySeed(seedId: string, build: (o: SeedOps) => Promise<void>): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    await withAdminSession(browser, SETUP_ADMIN, (page) => build(new SeedOps(page, seedId, notes)));
  });
}

/** 最上位に1件（カテゴリ名(英)は仮の値）を取り込み、その直下に子を順に登録する（子のカテゴリ名(英)は空のまま）。[最上位, 子…] を返す */
async function rootAndChildren(o: SeedOps, root: string, children: string[], newest = false): Promise<string[]> {
  const [a] = await o.tops([{ nameJp: root, nameEn: TMP }], newest);
  const ids = [a];
  for (const c of children) ids.push(await o.child(null, a, c));
  return ids;
}

// ---- 共有参照カテゴリツリー ----

/** 共有参照カテゴリツリーの1件（シード表の状態・属性） */
type CoreNode = { key: string; nameJp: string; nameEn: string; sortNo: string };
const CORE: Record<string, CoreNode> = {
  A: { key: "共有A", nameJp: "ルートカテゴリA", nameEn: "RootCategoryA", sortNo: "7" },
  B: { key: "共有B", nameJp: "空カテゴリ", nameEn: "EmptyCategory", sortNo: "6" },
  C: { key: "共有C", nameJp: "子カテゴリA1", nameEn: "ChildCategoryA1", sortNo: "5" },
  D: { key: "共有D", nameJp: "子カテゴリA2", nameEn: "ChildCategoryA2", sortNo: "4" },
  E: { key: "共有E", nameJp: "孫カテゴリA1", nameEn: "", sortNo: "3" },
  F: { key: "共有F", nameJp: "第4階層カテゴリA1", nameEn: "", sortNo: "2" },
  G: { key: "共有G", nameJp: "第5階層カテゴリA1", nameEn: "", sortNo: "1" },
};

/**
 * 前の実行で作った共有参照カテゴリツリーが、シード表の状態のまま残っていれば、そのカテゴリIDを返す（無ければ null）。
 * 画面の一覧で、名称・英名・表示順・直下のカテゴリ（件数と並び）を確かめる。商品との関連は、削除ボタンが押せること
 * （子も商品も無い）で確かめられる空カテゴリ・子カテゴリA2・第5階層カテゴリA1だけを確かめる。
 */
async function findCoreTree(o: SeedOps): Promise<Record<string, string> | null> {
  const same = (r: { nameJp: string; nameEn: string; sortNo: string }, n: CoreNode) =>
    r.nameJp === n.nameJp && r.nameEn === n.nameEn && r.sortNo === n.sortNo;
  await o.list.openTop();
  const tops = await o.list.rowValues();
  const as = tops.filter((r) => same(r, CORE.A));
  const bs = tops.filter((r) => same(r, CORE.B) && !r.deleteDisabled);
  if (as.length !== 1 || bs.length !== 1) return null;
  const ids: Record<string, string> = { A: as[0].id, B: bs[0].id };
  if ((await o.list.treeItem(ids.B)).count !== "0") return null;
  /** 親の直下が、求めるカテゴリだけ（表示順の大きい順）であること */
  const children = async (parent: string, want: string[]): Promise<boolean> => {
    await o.list.openChildrenOf(parent);
    const rows = await o.list.rowValues();
    if (rows.length !== want.length) return false;
    for (const [i, k] of want.entries()) {
      if (!same(rows[i], CORE[k])) return false;
      ids[k] = rows[i].id;
    }
    return true;
  };
  if (!(await children(ids.A, ["C", "D"]))) return null;
  if (!(await children(ids.C, ["E"]))) return null;
  if (!(await children(ids.E, ["F"]))) return null;
  if (!(await children(ids.F, ["G"]))) return null;
  if (!(await children(ids.G, []))) return null;
  if (!(await children(ids.D, []))) return null;
  // 子も商品も無いカテゴリは削除ボタンが押せる
  await o.list.openChildrenOf(ids.A);
  if ((await o.list.rowValues()).find((r) => r.id === ids.D)?.deleteDisabled !== false) return null;
  await o.list.openChildrenOf(ids.F);
  if ((await o.list.rowValues()).find((r) => r.id === ids.G)?.deleteDisabled !== false) return null;
  return ids;
}

defineCategorySeed("S-M03-45-TREE-CORE", async (o) => {
  const found = await findCoreTree(o);
  if (found) {
    for (const k of Object.keys(CORE)) o.note(CORE[k].key, found[k]);
    o.warn(`前の実行で作った共有参照カテゴリツリー（ID ${Object.keys(CORE).map((k) => found[k]).join("・")}）が、シード表と同じ名称・英名・表示順・親子関係で残っていたので、そのまま使った（子を持つカテゴリの商品との関連は、一覧の削除ボタンが押せないため画面では確かめていない）`);
    return;
  }
  const [a, b] = await o.tops([{ nameJp: CORE.A.nameJp, nameEn: CORE.A.nameEn }, { nameJp: CORE.B.nameJp, nameEn: CORE.B.nameEn }], true);
  o.note("共有A", a); o.note("共有B", b);
  const c = await o.child(null, a, CORE.C.nameJp, CORE.C.nameEn);
  const d = await o.childHere(a, CORE.D.nameJp, CORE.D.nameEn); // 続けて同じ一覧で
  o.note("共有C", c); o.note("共有D", d);
  const e = await o.child(a, c, CORE.E.nameJp);
  o.note("共有E", e);
  const f = await o.child(c, e, CORE.F.nameJp);
  o.note("共有F", f);
  await o.ranks([{ id: f, rank: "1", nameJp: CORE.F.nameJp, nameEn: TMP, parentId: e }]);
  // 第5階層は編集欄が出ないので取込で表示順を付けない。この登録で第5階層が表示順1、第4階層が表示順2になる
  const g = await o.child(e, f, CORE.G.nameJp);
  o.note("共有G", g);
  await o.ranks([
    { id: a, rank: "7", nameJp: CORE.A.nameJp, nameEn: CORE.A.nameEn, parentId: "0" },
    { id: b, rank: "6", nameJp: CORE.B.nameJp, nameEn: CORE.B.nameEn, parentId: "0" },
    { id: c, rank: "5", nameJp: CORE.C.nameJp, nameEn: CORE.C.nameEn, parentId: a },
    { id: d, rank: "4", nameJp: CORE.D.nameJp, nameEn: CORE.D.nameEn, parentId: a },
    { id: e, rank: "3", nameJp: CORE.E.nameJp, nameEn: TMP, parentId: c },
  ]);
  await o.clearEn(c, e);
  await o.clearEn(e, f);
  const wrong = await o.sortMismatches([[null, a, "7"], [null, b, "6"], [a, c, "5"], [a, d, "4"], [c, e, "3"], [e, f, "2"], [f, g, "1"]]);
  if (wrong.length) throw new Error(`S-M03-45-TREE-CORE: 作り終えた表示順がシード表と違う（${wrong.join("、")}）`);
});

// ---- 最上位に1件だけ置く形 ----

/** 最上位に1件を正本の英名で取り込み、表示順を設定する（001・003・007） */
function oneTop(no: string, nameJp: string, nameEn: string, rank: string) {
  return async (o: SeedOps) => {
    const [a] = await o.tops([{ nameJp, nameEn }]);
    o.note(no, a);
    await o.ranks([{ id: a, rank, nameJp, nameEn, parentId: "0" }]);
  };
}
defineCategorySeed("S-M03-45-TREE-001", oneTop("001", "画面確認カテゴリ-001", "ScreenCategory-001", "101"));
defineCategorySeed("S-M03-45-TREE-003", oneTop("003", "画面確認カテゴリ-003", "ScreenCategory-003", "104"));
defineCategorySeed("S-M03-45-TREE-007", oneTop("007", "子カテゴリA2-007", "ChildCategoryA2-007", "112"));

/** 最上位に1件を仮の英名で取り込み、表示順を設定してから英名を空にする（013・015・023） */
async function oneTopTmp(o: SeedOps, no: string, nameJp: string, rank: string): Promise<string> {
  const [a] = await o.tops([{ nameJp, nameEn: TMP }]);
  o.note(no, a);
  await o.ranks([{ id: a, rank, nameJp, nameEn: TMP, parentId: "0" }]);
  await o.clearEn(null, a);
  return a;
}

/** 正本の「CSV出力項目設定でカテゴリIDを出力対象にしてCSVダウンロードし、カテゴリID 999999 の行が無いことを確かめる。あれば削除する」 */
async function noCategory999999(o: SeedOps): Promise<void> {
  await o.csvOutputs(["カテゴリID"]);
  await o.purge((r) => r["カテゴリID"] === "999999");
}

defineCategorySeed("S-M03-45-TREE-013", async (o) => {
  await oneTopTmp(o, "013", "ルートカテゴリA-M0345-013", "120");
  await noCategory999999(o);
});
defineCategorySeed("S-M03-45-TREE-015", async (o) => { await oneTopTmp(o, "015", "ルートカテゴリA-M0345-015", "123"); });
defineCategorySeed("S-M03-45-DELETE-023", async (o) => { await oneTopTmp(o, "023", "ルート削除対象-023", "87"); });

// ---- 最上位と、その直下の子 ----

defineCategorySeed("S-M03-45-TREE-002", async (o) => {
  const [a] = await o.tops([{ nameJp: "ルートカテゴリA-M0345-002", nameEn: TMP }]);
  o.note("002A", a);
  const b = await o.child(null, a, "子カテゴリA2-002", "ChildCategoryA2-002");
  o.note("002B", b);
  await o.ranks([
    { id: a, rank: "103", nameJp: "ルートカテゴリA-M0345-002", nameEn: TMP, parentId: "0" },
    { id: b, rank: "102", nameJp: "子カテゴリA2-002", nameEn: "ChildCategoryA2-002", parentId: a },
  ]);
  await o.clearEn(null, a);
});

defineCategorySeed("S-M03-45-TREE-005", async (o) => {
  const [a] = await o.tops([{ nameJp: "ルートカテゴリA-M0345-005", nameEn: TMP }]);
  o.note("005A", a);
  const b = await o.child(null, a, "子カテゴリA1-005", "ChildCategoryA1-005");
  o.note("005B", b);
  const c = await o.child(null, a, "子カテゴリA2-005", "ChildCategoryA2-005");
  o.note("005C", c);
  await o.ranks([
    { id: a, rank: "108", nameJp: "ルートカテゴリA-M0345-005", nameEn: TMP, parentId: "0" },
    { id: b, rank: "107", nameJp: "子カテゴリA1-005", nameEn: "ChildCategoryA1-005", parentId: a },
    { id: c, rank: "106", nameJp: "子カテゴリA2-005", nameEn: "ChildCategoryA2-005", parentId: a },
  ]);
  await o.clearEn(null, a);
});

defineCategorySeed("S-M03-45-TREE-006", async (o) => {
  const [a] = await o.tops([{ nameJp: "ルートカテゴリA-M0345-006", nameEn: TMP }]);
  o.note("006A", a);
  const b = await o.child(null, a, "子カテゴリA1-006");
  o.note("006B", b);
  const c = await o.child(a, b, "孫カテゴリA1-006");
  o.note("006C", c);
  await o.ranks([
    { id: a, rank: "111", nameJp: "ルートカテゴリA-M0345-006", nameEn: TMP, parentId: "0" },
    { id: b, rank: "110", nameJp: "子カテゴリA1-006", nameEn: TMP, parentId: a },
    { id: c, rank: "109", nameJp: "孫カテゴリA1-006", nameEn: TMP, parentId: b },
  ]);
  await o.clearEn(null, a);
  await o.clearEn(a, b);
  await o.clearEn(b, c);
});

/** 最上位と子1件（009・011・014）。両方の表示順を設定し、両方の英名を空にする */
async function rootAndOneChild(o: SeedOps, no: string, root: string, child: string, rootRank: string, childRank: string): Promise<void> {
  const [a, b] = await rootAndChildren(o, root, [child]);
  o.note(`${no}A`, a); o.note(`${no}B`, b);
  await o.ranks([
    { id: a, rank: rootRank, nameJp: root, nameEn: TMP, parentId: "0" },
    { id: b, rank: childRank, nameJp: child, nameEn: TMP, parentId: a },
  ]);
  await o.clearEn(null, a);
  await o.clearEn(a, b);
}
defineCategorySeed("S-M03-45-TREE-009", (o) => rootAndOneChild(o, "009", "ルートカテゴリA-M0345-009", "子カテゴリA1-009", "114", "113"));
defineCategorySeed("S-M03-45-TREE-011", (o) => rootAndOneChild(o, "011", "ルートカテゴリA-M0345-011", "子カテゴリA1-011", "116", "115"));
defineCategorySeed("S-M03-45-TREE-014", async (o) => {
  await rootAndOneChild(o, "014", "ルートカテゴリA-M0345-014", "子カテゴリA1-014", "122", "121");
  await noCategory999999(o);
});

defineCategorySeed("S-M03-45-TREE-012", async (o) => {
  // 正本: 「ルートカテゴリA」の行（同じ名前の行が複数あるときはIDが最も大きい行）
  const [a, b, c] = await rootAndChildren(o, "ルートカテゴリA", ["子カテゴリA1-012", "子カテゴリA2-012"], true);
  o.note("012A", a); o.note("012B", b); o.note("012C", c);
  await o.ranks([
    { id: a, rank: "119", nameJp: "ルートカテゴリA", nameEn: TMP, parentId: "0" },
    { id: b, rank: "118", nameJp: "子カテゴリA1-012", nameEn: TMP, parentId: a },
    { id: c, rank: "117", nameJp: "子カテゴリA2-012", nameEn: TMP, parentId: a },
  ]);
  await o.clearEn(null, a);
  await o.clearEn(a, b);
  await o.clearEn(a, c);
});

// ---- 並べ替え（016〜019） ----

/** 「並べ替え親カテゴリ-<ケース>」の直下に A・B・C（表示順 30・20・10）。4件とも英名を空にする */
function sortSeed(no: string) {
  return async (o: SeedOps) => {
    const names = ["A", "B", "C"].map((x) => `並べ替えカテゴリ${x}-${no}`);
    const parentName = `並べ替え親カテゴリ-${no}`;
    const [a, b, c, d] = await rootAndChildren(o, parentName, names);
    o.note(`${no}A`, a); o.note(`${no}B`, b); o.note(`${no}C`, c); o.note(`${no}D`, d);
    await o.ranks([
      { id: b, rank: "30", nameJp: names[0], nameEn: TMP, parentId: a },
      { id: c, rank: "20", nameJp: names[1], nameEn: TMP, parentId: a },
      { id: d, rank: "10", nameJp: names[2], nameEn: TMP, parentId: a },
    ]);
    await o.clearEn(null, a);
    for (const id of [b, c, d]) await o.clearEn(a, id);
    // 正本の状態「初期一覧順A→B→C」
    await o.list.openChildrenOf(a);
    const order = (await o.list.rowValues()).map((r) => r.nameJp);
    if (order.join("|") !== names.join("|")) throw new Error(`${o.seedId}: 表示順を設定したのに、一覧が A→B→C の順にならない（${order.join("、")}）`);
  };
}
defineCategorySeed("S-M03-45-SORT-016", sortSeed("016"));
defineCategorySeed("S-M03-45-SORT-017", sortSeed("017"));
defineCategorySeed("S-M03-45-SORT-018", sortSeed("018"));
defineCategorySeed("S-M03-45-SORT-019", sortSeed("019"));

// ---- 削除（020〜022・027） ----

/** 「削除試験親-<ケース>」の直下に子1件。両方の表示順を設定し、両方の英名を空にする */
function deleteSeed(no: string, child: string, parentRank: string, childRank: string) {
  return async (o: SeedOps) => {
    const parent = `削除試験親-${no}`;
    const [a, b] = await rootAndChildren(o, parent, [child]);
    o.note(`${no}A`, a); o.note(`${no}B`, b);
    await o.ranks([
      { id: a, rank: parentRank, nameJp: parent, nameEn: TMP, parentId: "0" },
      { id: b, rank: childRank, nameJp: child, nameEn: TMP, parentId: a },
    ]);
    await o.clearEn(null, a);
    await o.clearEn(a, b);
  };
}
defineCategorySeed("S-M03-45-DELETE-020", deleteSeed("020", "配下削除対象-020", "82", "81"));
defineCategorySeed("S-M03-45-DELETE-021", deleteSeed("021", "配下削除対象-021", "84", "83"));
defineCategorySeed("S-M03-45-DELETE-022", deleteSeed("022", "配下削除対象-022", "86", "85"));
defineCategorySeed("S-M03-45-DELETE-027", deleteSeed("027", "同時削除対象-027", "94", "93"));

defineCategorySeed("S-M03-45-DELETE-ORDER-024", async (o) => {
  const [b, c, d, f] = await o.tops([
    { nameJp: "表示順削除親-024", nameEn: TMP }, { nameJp: "高表示順A-024", nameEn: TMP },
    { nameJp: "高表示順B親-024", nameEn: TMP }, { nameJp: "低表示順-024", nameEn: TMP },
  ]);
  o.note("024B", b); o.note("024C", c); o.note("024D", d); o.note("024F", f);
  const a = await o.child(null, b, "表示順削除対象-024");
  o.note("024A", a);
  const e = await o.child(null, d, "高表示順B子-024");
  o.note("024E", e);
  await o.ranks([
    { id: a, rank: "20", nameJp: "表示順削除対象-024", nameEn: TMP, parentId: b },
    { id: b, rank: "15", nameJp: "表示順削除親-024", nameEn: TMP, parentId: "0" },
    { id: c, rank: "50", nameJp: "高表示順A-024", nameEn: TMP, parentId: "0" },
    { id: d, rank: "40", nameJp: "高表示順B親-024", nameEn: TMP, parentId: "0" },
    { id: e, rank: "30", nameJp: "高表示順B子-024", nameEn: TMP, parentId: d },
    { id: f, rank: "10", nameJp: "低表示順-024", nameEn: TMP, parentId: "0" },
  ]);
  await o.clearEn(b, a);
  await o.clearEn(null, b);
  await o.clearEn(null, c);
  await o.clearEn(null, d);
  await o.clearEn(d, e);
  await o.clearEn(null, f);
});

defineCategorySeed("S-M03-45-DELETE-025", async (o) => {
  const [a, b] = await rootAndChildren(o, "削除試験親-025", ["子ありカテゴリ-025"]);
  o.note("025A", a); o.note("025B", b);
  const c = await o.child(a, b, "削除不可確認子");
  o.note("025C", c);
  await o.ranks([
    { id: a, rank: "90", nameJp: "削除試験親-025", nameEn: TMP, parentId: "0" },
    { id: b, rank: "89", nameJp: "子ありカテゴリ-025", nameEn: TMP, parentId: a },
    { id: c, rank: "88", nameJp: "削除不可確認子", nameEn: TMP, parentId: b },
  ]);
  await o.clearEn(null, a);
  await o.clearEn(a, b);
  await o.clearEn(b, c);
});

/**
 * 026: 「削除試験親-026」＞「商品関連カテゴリ-026」と、そのカテゴリだけに関連する商品（商品コード REL-345-026）。
 * 商品はグッズ商品CSV登録で作り（商品カテゴリはサプライ・グッズ）、商品登録編集画面でカテゴリを「商品関連カテゴリ-026」だけにする。
 * 正本に商品の片付けの手順が無いので、前の実行の商品が残っていれば作らずに止める（作り直してよいかは依頼者が決める）。
 */
const CODE_026 = "REL-345-026";
defineCategorySeed("S-M03-45-DELETE-026", async (o) => {
  const left = await productIdsByCode(o.page, CODE_026);
  if (left.length) {
    throw new Error(`S-M03-45-DELETE-026: 商品コード ${CODE_026} の商品（商品ID ${left.join("、")}）が前の実行で残っている。正本に片付けの手順が無いので、作り直してよいかの判断が要る`);
  }
  const [a, b] = await rootAndChildren(o, "削除試験親-026", ["商品関連カテゴリ-026"]);
  o.note("026A", a); o.note("026B", b);
  await o.ranks([
    { id: a, rank: "92", nameJp: "削除試験親-026", nameEn: TMP, parentId: "0" },
    { id: b, rank: "91", nameJp: "商品関連カテゴリ-026", nameEn: TMP, parentId: a },
  ]);
  await o.clearEn(null, a);
  await o.clearEn(a, b);

  // 商品カテゴリ(ID)は、最上位の一覧の「サプライ・グッズ」の行のID欄の値
  await o.list.openTop();
  const goods = await o.list.idOf("サプライ・グッズ");
  const template = await downloadGoodsCsvTemplate(o.page);
  for (const [column, seedValue] of [["商品公開ステータス", "2"], ["支店の商品公開ステータス", "1"]]) {
    const value = publishedValue(template, column);
    if (value !== seedValue) {
      o.warn(`シード表は${column}を「${seedValue}（公開）」とするが、グッズ商品CSVの雛形の説明では公開は「${value}」。公開を表す「${value}」を入れた`);
    }
  }
  await registerGoodsCsv(o.page, {
    what: `${o.seedId} のグッズ商品CSV登録`, fileName: `${o.seedId}-goods.csv`, categoryId: goods,
    lines: [{ code: CODE_026, nameJp: CODE_026, nameEn: CODE_026 }],
    // スマレジ商品コードと部門IDは空（指定しない列は空になる）。言語・サイズ・重量・購入グループ名称・公開の値は部品の共通の値
    common: {
      "基準価格": "1000", "販売価格": "1000", "買取価格": "100", "原価単価": "10", "地域別販売制限": "0", "スマレジ連携フラグ": "0",
    },
    onWarning: o.warn,
  });
  o.warn("正本の「確認モーダルでアップロードを確定する」は行っていない。グッズ商品CSVのアップロード画面に確認モーダルが無く（設計書 M03-27 L0092 にはある）、「CSVファイルのアップロード」を押したあと、そのまま取込の結果（成功の表示）を確かめた");
  const productId = await readGoodsProductId(o.page, CODE_026, CODE_026);
  o.notes.set("〔商品ID-M0345-026〕", productId);
  // 商品マスター(検索結果)の行から商品登録編集画面を開き、商品カテゴリを「商品関連カテゴリ-026」だけにして公開で登録する
  await relateProductOnlyTo(o.page, productId, b, o.warn);
});

// ---- CSV（028） ----

defineCategorySeed("S-M03-45-CSV-028", async (o) => {
  const [a, c] = await o.tops([{ nameJp: "CSVルートA-028", nameEn: TMP }, { nameJp: "CSVルートB-028", nameEn: TMP }]);
  o.note("028A", a); o.note("028C", c);
  o.note("028B", await o.child(null, a, "CSV子A1-028"));
  const d = await o.child(null, c, "CSV子B1-028");
  o.note("028D", d);
  o.note("028E", await o.child(c, d, "CSV孫B1a-028"));
  await o.clearEn(null, a);
  await o.clearEn(null, c);
});

// ---- 子カテゴリの登録と表示順（035・041・042） ----

/**
 * 正本の作り方は、表示順を設定したあとで同名のカテゴリを削除する。削除は、削除したカテゴリより大きい表示順を1つずつ減らすので、
 * 前の実行の残りを削除すると設定した表示順がずれることがある。ずれたら、正本の作り方の表示順の設定と英名を空にする操作を
 * もう一度行い、シード表の状態に戻す（報告に出す）。
 */
async function keepSorts(o: SeedOps, removed: string[], want: [string | null, string, string][], redo: () => Promise<void>): Promise<void> {
  if (removed.length === 0) return;
  const wrong = await o.sortMismatches(want);
  if (wrong.length === 0) return;
  o.warn(`前の実行の残りを削除したので表示順がずれた（${wrong.join("、")}）。表示順の設定とカテゴリ名（英）を空にする操作をもう一度行った`);
  await redo();
  const still = await o.sortMismatches(want);
  if (still.length) throw new Error(`${o.seedId}: 表示順をシード表の値に戻せない（${still.join("、")}）`);
}

defineCategorySeed("S-M03-45-CREATE-035", async (o) => {
  const [a, c, d] = await o.tops([
    { nameJp: "新規登録親-035", nameEn: TMP }, { nameJp: "上位カテゴリ-035", nameEn: TMP }, { nameJp: "下位カテゴリ-035", nameEn: TMP },
  ]);
  o.note("035A", a); o.note("035C", c); o.note("035D", d);
  const b = await o.child(null, a, "既存子-035");
  o.note("035B", b);
  const setRanks = async () => {
    await o.ranks([
      { id: a, rank: "40", nameJp: "新規登録親-035", nameEn: TMP, parentId: "0" },
      { id: b, rank: "39", nameJp: "既存子-035", nameEn: TMP, parentId: a },
      { id: c, rank: "50", nameJp: "上位カテゴリ-035", nameEn: TMP, parentId: "0" },
      { id: d, rank: "30", nameJp: "下位カテゴリ-035", nameEn: TMP, parentId: "0" },
    ]);
    await o.clearEn(null, a);
    await o.clearEn(a, b);
    await o.clearEn(null, c);
    await o.clearEn(null, d);
  };
  await setRanks();
  await o.csvOutputs(["カテゴリ名(日)", "カテゴリ名(英)"]);
  const removed = await o.purge((r) => r["カテゴリ名(日)"] === "新規子カテゴリ" || r["カテゴリ名(英)"] === "NewChildCategory");
  await keepSorts(o, removed, [[null, a, "40"], [a, b, "39"], [null, c, "50"], [null, d, "30"]], setRanks);
});

defineCategorySeed("S-M03-45-DP-REPEAT-041", async (o) => {
  const [a, b] = await rootAndChildren(o, "重ね親-M0345-041", ["重ね既存子-M0345-041"]);
  o.note("041A", a); o.note("041B", b);
  const setRanks = async () => {
    await o.ranks([
      { id: a, rank: "40", nameJp: "重ね親-M0345-041", nameEn: TMP, parentId: "0" },
      { id: b, rank: "39", nameJp: "重ね既存子-M0345-041", nameEn: TMP, parentId: a },
    ]);
    await o.clearEn(null, a);
    await o.clearEn(a, b);
  };
  await setRanks();
  await o.csvOutputs(["カテゴリ名(日)"]);
  const removed = await o.purge((r) => ["重ね新規子1-M0345-041", "重ね新規子2-M0345-041"].includes(r["カテゴリ名(日)"]));
  await keepSorts(o, removed, [[null, a, "40"], [a, b, "39"]], setRanks);
});

defineCategorySeed("S-M03-45-DP-DEPTH-042", async (o) => {
  const [a, b] = await rootAndChildren(o, "深さ1-M0345-042", ["深さ2-M0345-042"]);
  o.note("042A", a); o.note("042B", b);
  const c = await o.child(a, b, "深さ3-M0345-042");
  o.note("042C", c);
  const d = await o.child(b, c, "深さ4-M0345-042");
  o.note("042D", d);
  await o.clearEn(null, a);
  await o.csvOutputs(["カテゴリ名(日)"]);
  await o.purge((r) => r["カテゴリ名(日)"] === "深さ5-M0345-042");
});
