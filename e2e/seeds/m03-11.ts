/**
 * M03-11 カテゴリ登録/編集の画面シード。正本: cases/M03-11_seed_data.tsv
 *
 * 正本の作り方はどれも同じ形をしている。
 * 1. 最上位のカテゴリを、カテゴリ登録CSV画面で登録する（カテゴリ名(英)は取込で必須のための仮の値「TempEN」）。
 *    最上位の一覧のID欄からカテゴリIDを読み、カテゴリ編集画面でカテゴリ名(英)を空にして保存する。
 * 2. 子のカテゴリは、親を選んだカテゴリ登録/編集画面で「子カテゴリ作成」を押して登録する。
 * 3. 表示順は、登録し終えてからカテゴリ登録CSV画面で設定し、仮の値を入れたカテゴリ名(英)を編集画面で空に戻す。
 * 正本が「試験者が決める専用の名称」とした名称は「専用親1-M0311-<ケース>」「専用親2-M0311-<ケース>」とする（解釈）。
 */
import { expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { カテゴリ階層上限 } from "../lib/app_config";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import {
  CategoryCsvRow, CategoryInput, CategoryPage, createByCsv, createTopByCsv, purgeCategories, uploadCategoryRows,
} from "../pages/admin/category";
import { readGoodsProductId, removeProductsMatchingCode } from "../pages/admin/m03_01_goods_list_seed";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { ensureMember } from "../pages/admin/member";

export const M0311_ADMIN: Account = { loginId: "m0311_admin", password: "Passw0rd!M0311" };

/** 取込で必須のための仮のカテゴリ名(英) */
const TEMP_EN = "TempEN";

defineSeed("S-M03-11-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    // 正本は所属店舗を指定しない。管理画面で利用可能な店舗を1つ選び、
    // 商品管理を操作できるシステム管理者の権限を付ける（M03-01 の試験管理者と同じ作り方）。
    await page.goto(adminUrl("/setting/system/member/new"));
    const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((options) => options
      .map((option) => option as HTMLOptionElement)
      .filter((option) => option.value !== "")
      .map((option) => option.textContent?.trim() ?? "")
      .filter(Boolean));
    if (stores.length === 0) throw new Error("S-M03-11-ADM: メンバーに割り当てられる店舗が画面に無い");
    const store = stores[0];
    await ensureMember(page, {
      名前: "M03-11試験管理者", 所属店舗: store,
      ログインID: M0311_ADMIN.loginId, メールアドレス: "m0311_admin@example.test",
      パスワード: M0311_ADMIN.password, 権限: "システム管理者",
      デフォルト検索表示店舗: store, 編集可能店舗: [store],
    });
  });
  // ログイン・商品管理の操作・ロックなし・複数のブラウザセッションを、ケースとは別に確かめる。
  await withAdminSession(browser, M0311_ADMIN, async (page) => {
    await withAdminSession(browser, M0311_ADMIN, async (otherPage) => {
      for (const p of [page, otherPage]) {
        await p.goto(adminUrl("/product/category"));
        await expect(p.locator("#ex-secondaryCol .c-directoryTree"), "M03-11試験管理者でカテゴリ登録/編集画面を開けない").toBeVisible();
      }
    });
  });
});

defineSeed("S-M03-11-CONFIG", async () => {
  // 管理画面に設定項目が無い。設定を変えず、値が既定の5であることだけを確かめる（違えば止める）。
  const level = カテゴリ階層上限();
  if (level !== 5) {
    throw new Error(`S-M03-11-CONFIG: カテゴリ階層上限が ${level}（既定値は5）。設定を5に戻してアプリのキャッシュを作り直してから流す`);
  }
});

/** シードを作る管理者のセッションで、正本の作り方の操作をする */
class SeedOps {
  readonly category: CategoryPage;
  private files = 0;

  constructor(readonly page: Page, readonly seedId: string, readonly notes: Notes) {
    this.category = new CategoryPage(page);
  }

  readonly warn = (w: string) => reportSeedIssue(this.seedId, w);

  private fileName(): string {
    this.files += 1;
    return `${this.seedId}-${this.files}.csv`;
  }

  /** カテゴリ登録CSV画面で最上位のカテゴリを登録し（カテゴリ名(英)は仮の値・両非表示フラグ0）、カテゴリIDを読む */
  async top(nameJp: string): Promise<string> {
    return createTopByCsv(this.page, { nameJp, nameEn: TEMP_EN }, this.fileName(), this.warn);
  }

  /** カテゴリ登録CSV画面で、親を指定してカテゴリを登録し（カテゴリ名(英)は仮の値・両非表示フラグ0）、親の一覧からカテゴリIDを読む */
  async underByCsv(parentId: string, nameJp: string): Promise<string> {
    return createByCsv(this.page, { nameJp, nameEn: TEMP_EN, parentId }, this.fileName(), this.warn);
  }

  /** カテゴリ編集画面でカテゴリ名(英)を空にし、保存する */
  async clearEn(id: string): Promise<void> {
    await this.category.update(id, { nameEn: "" }, this.warn);
  }

  /** カテゴリ登録CSV画面で最上位のカテゴリを登録し、カテゴリ名(英)を空にする */
  async topWithoutEn(nameJp: string): Promise<string> {
    const id = await this.top(nameJp);
    await this.clearEn(id);
    return id;
  }

  /** 親を選んだカテゴリ登録/編集画面で、子カテゴリを登録する。入れない欄は空のまま（両非表示フラグはオフのまま） */
  async child(parentId: string, v: CategoryInput & { nameJp: string }): Promise<string> {
    return this.category.createChild(parentId, v, this.warn);
  }

  /** 最上位から子へ順に連なるカテゴリを登録する（最上位はCSVで登録してカテゴリ名(英)を空にする）。カテゴリIDを上から順に返す */
  async chain(names: string[]): Promise<string[]> {
    const ids = [await this.topWithoutEn(names[0])];
    for (const name of names.slice(1)) ids.push(await this.child(ids[ids.length - 1], { nameJp: name }));
    return ids;
  }

  /** カテゴリ登録CSV画面で、登録済みのカテゴリの行を取り込む（表示順の設定） */
  async csv(rows: CategoryCsvRow[]): Promise<void> {
    await uploadCategoryRows(this.page, rows, this.fileName(), `${this.seedId} のカテゴリ登録CSV（表示順の設定）`, this.warn);
  }

  /** カテゴリCSVをダウンロードし、名称（日）・名称（英）が一致するカテゴリの行が無いことを確かめる。あれば画面から削除する */
  async purgeNames(nameJp: string[], nameEn: string[] = []): Promise<void> {
    await purgeCategories(this.page, (r) => nameJp.includes(r["カテゴリ名(日)"]) || nameEn.includes(r["カテゴリ名(英)"]),
      this.seedId, this.warn);
  }

  /** カテゴリCSVをダウンロードし、カテゴリIDの行が無いことを確かめる。あれば画面から削除する */
  async purgeId(id: string): Promise<void> {
    await purgeCategories(this.page, (r) => r["カテゴリID"] === id, this.seedId, this.warn);
  }

  note(label: string, id: string): void {
    this.notes.set(label, id);
  }
}

function defineCategorySeed(seedId: string, build: (o: SeedOps) => Promise<void>): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    await withAdminSession(browser, SETUP_ADMIN, (page) => build(new SeedOps(page, seedId, notes)));
  });
}

const label = (suffix: string) => `〔カテゴリID-M0311-${suffix}〕`;
/** 正本が「試験者が決める専用の名称」とした名称 */
const own = (no: string, level: 1 | 2) => `専用親${level}-M0311-${no}`;

/** 「登録した階層1のカテゴリ」（控えない）から、階層2のカテゴリを控えて登録する */
async function ownLevel2(o: SeedOps, no: string, level2Label: string): Promise<string> {
  const top = await o.topWithoutEn(own(no, 1));
  const id = await o.child(top, { nameJp: own(no, 2) });
  o.note(level2Label, id);
  return id;
}

/** 正本が「埋め込みHTML・検索パラメータを入れて」登録する、編集前のカテゴリの値 */
const beforeValues = (no: string): CategoryInput & { nameJp: string } => ({
  nameJp: `編集前カテゴリ-${no}`, nameEn: `BeforeCategory-${no}`,
  htmlJa: "<p>更新前JP</p>", htmlEn: "<p>Before EN</p>", searchParameters: "rarity=old",
});

// 001: 「全商品」＞「カード」＞「編集前カテゴリ-001」。表示順は 100・90・80
defineCategorySeed("S-M03-11-BASE-001", async (o) => {
  const [a, b, c] = await o.chain(["全商品", "カード", "編集前カテゴリ-001"]);
  o.note(label("001A"), a); o.note(label("001B"), b); o.note(label("001C"), c);
  await o.csv([
    { id: a, rank: "100", nameJp: "全商品", nameEn: TEMP_EN, parentId: "0" },
    { id: b, rank: "90", nameJp: "カード", nameEn: TEMP_EN, parentId: a },
    { id: c, rank: "80", nameJp: "編集前カテゴリ-001", nameEn: TEMP_EN, parentId: b },
  ]);
  for (const id of [a, b, c]) await o.clearEn(id);
});

defineCategorySeed("S-M03-11-BASE-002", async (o) => {
  const [a, b, c, d] = await o.chain(["全商品-002", "カード-002", "編集前カテゴリ-002", "サブカテゴリA"]);
  o.note(label("002A"), a); o.note(label("002B"), b); o.note(label("002C"), c); o.note(label("002D"), d);
});

defineCategorySeed("S-M03-11-BASE-003", async (o) => {
  const [a, b] = await o.chain(["全商品-003", "カード"]);
  o.note(label("003A"), a); o.note(label("003B"), b);
});

defineCategorySeed("S-M03-11-NOTFOUND-004", async (o) => {
  const [a, b] = await o.chain(["全商品-004", "カード-004"]);
  o.note(label("004A"), a); o.note(label("004B"), b);
  await o.purgeId("999999");
});

defineCategorySeed("S-M03-11-BASE-005", async (o) => {
  const [a, b] = await o.chain(["全商品-005", "カード-005"]);
  o.note(label("005A"), a); o.note(label("005B"), b);
  const c = await o.child(b, beforeValues("005"));
  o.note(label("005C"), c);
  await o.csv([{ id: c, rank: "30", nameJp: "編集前カテゴリ-005", nameEn: "BeforeCategory-005", parentId: b, searchParameters: "rarity=old" }]);
});

defineCategorySeed("S-M03-11-NOTFOUND-006", async (o) => {
  // 〔006A〕は最上位、〔006B〕はその子（どちらも専用の名称）、〔006C〕が「編集前カテゴリ-006」
  const [a, b, c] = await o.chain([own("006", 1), own("006", 2), "編集前カテゴリ-006"]);
  o.note(label("006A"), a); o.note(label("006B"), b); o.note(label("006C"), c);
  await o.purgeId("999999");
});

defineCategorySeed("S-M03-11-HIERARCHY-007", async (o) => {
  const ids = await o.chain(["階層1-007", "階層2-007", "階層3-007", "階層4-007"]);
  ["007A", "007B", "007C", "007D"].forEach((s, i) => o.note(label(s), ids[i]));
});

defineCategorySeed("S-M03-11-HIERARCHY-008", async (o) => {
  const ids = await o.chain(["階層1-008", "階層2-008", "階層3-008", "階層4-008", "階層5-008"]);
  ["008A", "008B", "008C", "008D", "008E"].forEach((s, i) => o.note(label(s), ids[i]));
});

defineCategorySeed("S-M03-11-ROOT-009", async (o) => {
  const a = await o.topWithoutEn("最上位確認カテゴリ-009");
  o.note(label("009"), a);
  await o.csv([{ id: a, rank: "100", nameJp: "最上位確認カテゴリ-009", nameEn: TEMP_EN, parentId: "0" }]);
  await o.clearEn(a);
});

defineCategorySeed("S-M03-11-BASE-010", async (o) => {
  const top = await o.topWithoutEn(own("010", 1));
  const a = await o.child(top, { nameJp: "カード-010" });
  o.note(label("010A"), a);
  const b = await o.child(a, { nameJp: "編集前カテゴリ-010" });
  o.note(label("010B"), b);
  const c = await o.child(a, { nameJp: "兄弟カテゴリ-010" });
  o.note(label("010C"), c);
  await o.csv([
    { id: b, rank: "30", nameJp: "編集前カテゴリ-010", nameEn: TEMP_EN, parentId: a },
    { id: c, rank: "20", nameJp: "兄弟カテゴリ-010", nameEn: TEMP_EN, parentId: a },
  ]);
  for (const id of [b, c]) await o.clearEn(id);
});

/** 011・012: 専用の名称の最上位 ＞「カード-<ケース>」＞「編集前カテゴリ-<ケース>」 */
async function linkSeed(o: SeedOps, no: string): Promise<void> {
  const top = await o.topWithoutEn(own(no, 1));
  const a = await o.child(top, { nameJp: `カード-${no}` });
  o.note(label(`${no}A`), a);
  o.note(label(`${no}B`), await o.child(a, { nameJp: `編集前カテゴリ-${no}` }));
}
defineCategorySeed("S-M03-11-BASE-011", (o) => linkSeed(o, "011"));
defineCategorySeed("S-M03-11-BASE-012", (o) => linkSeed(o, "012"));

/** 013・014: 専用の名称の階層1 ＞ 階層2 ＞ 埋め込みHTML・検索パラメータを持つ「編集前カテゴリ-<ケース>」 */
async function formSeed(o: SeedOps, no: string): Promise<void> {
  const a = await ownLevel2(o, no, label(`${no}A`));
  o.note(label(`${no}B`), await o.child(a, beforeValues(no)));
}
defineCategorySeed("S-M03-11-BASE-013", (o) => formSeed(o, "013"));
defineCategorySeed("S-M03-11-BASE-014", (o) => formSeed(o, "014"));

defineCategorySeed("S-M03-11-CREATE-017", async (o) => {
  await o.purgeNames(["新規カテゴリA1"], ["NewCategory-A1"]);
  const [a, b] = await o.chain(["全商品-017", "カード-017"]);
  o.note(label("017A"), a); o.note(label("017B"), b);
});

defineCategorySeed("S-M03-11-EDIT-018", async (o) => {
  await o.purgeNames(["更新カテゴリB2"], ["UpdatedCategory-B2"]);
  const a = await ownLevel2(o, "018", label("018A"));
  const b = await o.child(a, beforeValues("018"));
  o.note(label("018B"), b);
  await o.csv([{ id: b, rank: "30", nameJp: "編集前カテゴリ-018", nameEn: "BeforeCategory-018", parentId: a, searchParameters: "rarity=old" }]);
});

defineCategorySeed("S-M03-11-INVALID-019", async (o) => {
  await o.purgeNames(["保存されない名称"]);
  const a = await ownLevel2(o, "019", label("019A"));
  o.note(label("019B"), await o.child(a, { nameJp: "編集前カテゴリ-019", searchParameters: "rarity=old" }));
});

defineCategorySeed("S-M03-11-INVALID-020", async (o) => {
  const a = await ownLevel2(o, "020", label("020A"));
  o.note(label("020B"), await o.child(a, { nameJp: "編集前カテゴリ-020", searchParameters: "rarity=old" }));
});

defineCategorySeed("S-M03-11-HIERARCHY-021", async (o) => {
  await o.purgeNames(["階層6試験カテゴリ"], ["Level6Category"]);
  const ids = await o.chain(["階層1-021", "階層2-021", "階層3-021", "階層4-021", "階層5-021"]);
  ["021A", "021B", "021C", "021D", "021E"].forEach((s, i) => o.note(label(s), ids[i]));
});

defineCategorySeed("S-M03-11-SORT-022", async (o) => {
  await o.purgeNames(["挿入順カテゴリ"], ["InsertedCategory"]);
  // 繰上対象A-022 と繰上対象B-022 は、正本の注記どおり挿入親カテゴリ-022 と同じ親（登録した階層1のカテゴリ）の下に置く
  const top = await o.topWithoutEn(own("022", 1));
  const a = await o.child(top, { nameJp: "挿入親カテゴリ-022" });
  o.note(label("022A"), a);
  const b = await o.child(top, { nameJp: "繰上対象A-022" });
  o.note(label("022B"), b);
  const c = await o.child(top, { nameJp: "繰上対象B-022" });
  o.note(label("022C"), c);
  await o.csv([
    { id: a, rank: "30", nameJp: "挿入親カテゴリ-022", nameEn: TEMP_EN, parentId: top },
    { id: b, rank: "31", nameJp: "繰上対象A-022", nameEn: TEMP_EN, parentId: top },
    { id: c, rank: "40", nameJp: "繰上対象B-022", nameEn: TEMP_EN, parentId: top },
  ]);
  for (const id of [a, b, c]) await o.clearEn(id);
});

/** 023・024: 専用の名称の最上位 ＞「並び替え親カテゴリ-<ケース>」＞ 子2件（表示順 20・10 で A→B） */
async function sortSeed(o: SeedOps, no: string, nameA: string, nameB: string): Promise<void> {
  const top = await o.topWithoutEn(own(no, 1));
  const a = await o.child(top, { nameJp: `並び替え親カテゴリ-${no}` });
  o.note(label(`${no}A`), a);
  const b = await o.child(a, { nameJp: nameA });
  o.note(label(`${no}B`), b);
  const c = await o.child(a, { nameJp: nameB });
  o.note(label(`${no}C`), c);
  await o.csv([
    { id: b, rank: "20", nameJp: nameA, nameEn: TEMP_EN, parentId: a },
    { id: c, rank: "10", nameJp: nameB, nameEn: TEMP_EN, parentId: a },
  ]);
  for (const id of [b, c]) await o.clearEn(id);
  await o.category.openChildrenOf(a);
  const order = (await o.category.rowValues()).map((r) => r.nameJp);
  if (order.join("|") !== [nameA, nameB].join("|")) {
    throw new Error(`${o.seedId}: 表示順を設定したのに、一覧が「${nameA}」「${nameB}」の順にならない（${order.join("、")}）`);
  }
}
defineCategorySeed("S-M03-11-SORT-023", (o) => sortSeed(o, "023", "並び替えカテゴリA-023", "並び替えカテゴリB-023"));
defineCategorySeed("S-M03-11-SORT-024", (o) => sortSeed(o, "024", "並び替えカテゴリA", "並び替えカテゴリB"));

defineCategorySeed("S-M03-11-CREATE-033", async (o) => {
  await o.purgeNames(["新規遷移カテゴリ"], ["NewTransitionCategory"]);
  const [a, b] = await o.chain(["全商品-033", "カード-033"]);
  o.note(label("033A"), a); o.note(label("033B"), b);
});

defineCategorySeed("S-M03-11-EDIT-034", async (o) => {
  await o.purgeNames(["更新遷移カテゴリ"]);
  const a = await ownLevel2(o, "034", label("034A"));
  o.note(label("034B"), await o.child(a, { nameJp: "編集前カテゴリ-034" }));
});

/** 035・037: 「削除試験親-<ケース>」＞ 子1件。子カテゴリには商品もほかの業務データも関連付けない */
async function deleteSeed(o: SeedOps, no: string, child: string): Promise<void> {
  const [a, b] = await o.chain([`削除試験親-${no}`, child]);
  o.note(label(`${no}A`), a); o.note(label(`${no}B`), b);
}
defineCategorySeed("S-M03-11-DELETE-035", (o) => deleteSeed(o, "035", "未使用削除カテゴリ-035"));

/**
 * 036: 「削除試験親-036」＞「関連カテゴリ-036」と、子カテゴリに関連する商品（商品コード REL-001-036）。
 * 正本は裁定 E03 で、商品を商品登録画面（新規登録は禁止）でなくグッズ商品CSV登録で作る形に直った。グッズ商品CSVは
 * サプライ・グッズ等の配下のカテゴリしか選べないので、「削除試験親-036」はサプライ・グッズの子カテゴリにする。
 * 商品名は正本の「試験者が決める専用の名称」で「関連商品-M0311-036」とする（解釈）。
 */
const REL_036 = { code: "REL-001-036", name: "関連商品-M0311-036" };
defineCategorySeed("S-M03-11-DELETE-036", async (o) => {
  await o.category.openTop();
  const goods = await o.category.idOf("サプライ・グッズ");
  const a = await o.underByCsv(goods, "削除試験親-036");
  o.note(label("036A"), a);
  await o.clearEn(a);
  const b = await o.child(a, { nameJp: "関連カテゴリ-036" });
  o.note(label("036B"), b);
  const removed = await removeProductsMatchingCode(o.page, REL_036.code);
  if (removed.length) o.warn(`前の実行で残っていた商品コード ${REL_036.code} の商品（商品ID ${removed.join("、")}）を画面から完全に削除した`);
  await registerGoodsCsv(o.page, {
    what: `${o.seedId} のグッズ商品CSV登録`, fileName: `${o.seedId}-goods.csv`, categoryId: b,
    lines: [{ code: REL_036.code, nameJp: REL_036.name, nameEn: REL_036.name }], onWarning: o.warn,
  });
  o.notes.set("〔商品ID-M0311-036〕", await readGoodsProductId(o.page, REL_036.code, REL_036.name));
});
defineCategorySeed("S-M03-11-DELETE-037", (o) => deleteSeed(o, "037", "同時削除カテゴリ-037"));

defineCategorySeed("S-M03-11-BASE-039", async (o) => {
  const a = await ownLevel2(o, "039", label("039A"));
  o.note(label("039B"), await o.child(a, { nameJp: "編集前カテゴリ-039" }));
});

defineCategorySeed("S-M03-11-HIERARCHY-046", async (o) => {
  await o.purgeNames(["階層5試験カテゴリ-M0311-046"], ["Level5Category-M0311-046"]);
  const ids = await o.chain(["階層1-M0311-046", "階層2-M0311-046", "階層3-M0311-046", "階層4-M0311-046"]);
  ["046A", "046B", "046C", "046D"].forEach((s, i) => o.note(label(s), ids[i]));
});

defineCategorySeed("S-M03-11-BASE-047", async (o) => {
  const [a, b, c] = await o.chain(["全商品-M0311-047", "カード-M0311-047", "編集前カテゴリ-M0311-047"]);
  o.note(label("047A"), a); o.note(label("047B"), b); o.note(label("047C"), c);
  o.note(label("047D"), await o.child(c, { nameJp: "サブカテゴリA-M0311-047" }));
  o.note(label("047E"), await o.child(c, { nameJp: "サブカテゴリB-M0311-047" }));
  o.note(label("047F"), await o.child(c, { nameJp: "サブカテゴリC-M0311-047" }));
});
