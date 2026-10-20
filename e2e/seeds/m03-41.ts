/**
 * M03-41 カテゴリCSV登録の画面シード。正本: cases/M03-41_seed_data.tsv
 *
 * 正本の作り方はほとんどが同じ形をしている。
 * 1. 最上位のカテゴリは、カテゴリCSV登録画面の雛形ファイルダウンロードで得た見出し行に1行を足したCSVをアップロードして登録し、
 *    カテゴリ一覧で登録で増えた行のIDを控える（pages/admin/category.ts の createTopByCsv）。
 * 2. 子のカテゴリは、カテゴリ一覧で親のカテゴリ名を押して開き、名称を入れて「子カテゴリ作成」を押し、増えた行のIDを控える。
 * 3. 表示ランクは、カテゴリCSV登録画面で、登録済みの値を書いた更新の行をアップロードして設定する。
 * 4. ケースがアップロードするCSVファイルを、控えたIDを使って作る（ファイルはこのモジュールが持ち、ケースが名前で引く）。
 *
 * CSVファイルの作り方の解釈（正本は値の一部しか書かないので、次のように補う。記録 e2e/review/M03-41_progress_2026-10-20.md）:
 * - 見出しの列は、カテゴリCSV登録画面の雛形ファイルの見出し（12列）。正本が削除フラグの値を書くファイルだけ、末尾に「削除フラグ」列を足す
 *   （シード表 S-M03-41-CONFIG はカテゴリCSVの列の最後に削除フラグを挙げるが、雛形と設計書のCSVフォーマット（12項目）には無い）。
 * - 新規の行で正本が書かない必須の値は、カテゴリ名(英)を「M0341 <ファイル名から .csv を除いたもの>」、親カテゴリIDを 0、
 *   フロント非表示フラグ・支店非表示フラグを 0 にする。
 * - 更新の行で正本が「登録済みの値はCSVダウンロードの行から写す」と書くものは、カテゴリ一覧のCSVダウンロードの行を写し、
 *   正本が書く値だけを変える。最上位のカテゴリは、CSVダウンロードの親カテゴリIDが空なので、有効な値の 0 にする。
 */
import { expect, Page, test } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { CSV入出力設定, カテゴリ階層上限 } from "../lib/app_config";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { CategoryCsvRow, createTopByCsv, uploadCategoryRows } from "../pages/admin/category";
import { ensureMember } from "../pages/admin/member";
import {
  CategoryCsvUploadPage, createChildFromList, exportedCategoryRow, purgeCategoriesInTree, readCategoryCsvOutputItems,
} from "../pages/admin/m03_41_category_csv";
import { buildCaseCsv, CaseCsvFile } from "../pages/admin/m03_41_csv_file";

export const M0341_ADMIN: Account = { loginId: "m0341_admin", password: "Passw0rd!M0341" };

/** 正本が削除の指定に使う列（雛形には無い） */
export const DELETE_FLAG = "削除フラグ";

/** シード表 S-M03-41-CONFIG の状態・属性の「カテゴリCSVの列」 */
const CATEGORY_CSV_COLUMNS = [
  "カテゴリID", "表示ランク", "カテゴリ名(日)", "カテゴリ名(英)", "親カテゴリID", "階層", "フロント非表示フラグ", "支店非表示フラグ",
  "検索パラメータ", "最新セット用バナー画像パス", "カテゴリアイコン画像パス", "対象商品数", DELETE_FLAG,
];

/** 正本が値を書かず、E2E が決めた値（ケースの確かめにも使う） */
export const M0341_VALUES = {
  /** 005 の新規の2行の名称と、更新の行で変えるカテゴリ名(日) */
  新規005: ["CSV新規カテゴリ-005-1", "CSV新規カテゴリ-005-2"],
  更新後005: "更新後カテゴリ-005",
  /** 014 のCSVのカテゴリ名(日)（更新前の名称と違う値にして、更新されたら分かるようにする） */
  更新後014: "更新後カテゴリ-014",
  /** 023 の上限の文字列 */
  名称128: "あ".repeat(128), 英名128: "A".repeat(128), 検索128: "r".repeat(128),
  /** 024 の上限を超える文字列 */
  名称129: "あ".repeat(129), 英名129: "A".repeat(129), 検索129: "r".repeat(129),
  /** 025・026 の画像パス */
  バナー255: pathOf("img/category/setbanner/", 255), アイコン255: pathOf("img/category/icon/", 255),
  バナー256: pathOf("img/category/setbanner/", 256), アイコン256: pathOf("img/category/icon/", 256),
  /** 040 の各列の値（列の取り違えが分かるように、列ごとに違う値にする） */
  列順040: {
    "カテゴリ名(日)": "列順変更カテゴリ-040", "カテゴリ名(英)": "Reordered Category-040", "親カテゴリID": "0",
    "フロント非表示フラグ": "1", "支店非表示フラグ": "0", "検索パラメータ": "rarity=40",
    "最新セット用バナー画像パス": "img/category/setbanner/m0341-banner-040.png", "カテゴリアイコン画像パス": "img/category/icon/m0341-icon-040.png",
  },
};

/** 決まった前置きで始まり .png で終わる、ちょうど len 文字の画像パス */
function pathOf(prefix: string, len: number): string {
  return `${prefix}${"x".repeat(len - prefix.length - 4)}.png`;
}

// ---- ケースがアップロードするCSVファイル ----

const files = new Map<string, CaseCsvFile>();

/**
 * 削除フラグの列を足したが、カテゴリCSV登録画面の雛形の見出しに削除フラグが無かったファイル。
 * 取込が列の数の違いで値を見ずにファイル全体を止めるので、ファイル名の条件（子カテゴリがある・名称が空 など）を確かめられない（記録の裁定案1）。
 */
const flagFilesWithoutColumn = new Set<string>();

/** シードが作ったCSVファイルを、正本のファイル名で引く */
export function caseCsvFile(name: string): CaseCsvFile {
  const f = files.get(name);
  if (!f) throw new Error(`${name} はシードがまだ作っていない`);
  return f;
}

/** 削除フラグの列を足したのに、雛形の見出しに削除フラグが無かったファイルか（ファイル名の条件を確かめられない） */
export function deleteFlagFileUnverifiable(name: string): boolean {
  return flagFilesWithoutColumn.has(name);
}

// ---- 管理者・設定 ----

/** 正本は所属店舗を指定しない。管理画面で利用可能な店舗を1つ選び、商品管理を操作できるシステム管理者の権限を付ける（M03-14 と同じ作り方） */
async function createAdmin(page: Page): Promise<void> {
  await page.goto(adminUrl("/setting/system/member/new"));
  const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((options) => options
    .map((option) => option as HTMLOptionElement)
    .filter((option) => option.value !== "")
    .map((option) => option.textContent?.trim() ?? "")
    .filter(Boolean));
  if (stores.length === 0) throw new Error("S-M03-41-ADM: メンバーに割り当てられる店舗が画面に無い");
  const store = stores[0];
  await ensureMember(page, {
    名前: "M03-41試験管理者", 所属店舗: store, ログインID: M0341_ADMIN.loginId, メールアドレス: "m0341_admin@example.test",
    パスワード: M0341_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: store, 編集可能店舗: [store],
  });
}

defineSeed("S-M03-41-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page));
  // ログインでき（稼働中・ロックなし）、商品管理のカテゴリCSV登録画面を開けることを、ケースとは別のセッションで確かめる
  await withAdminSession(browser, M0341_ADMIN, async (page) => {
    const csv = new CategoryCsvUploadPage(page);
    await csv.open();
    await expect(csv.アップロードボタン, "M03-41試験管理者でカテゴリCSV登録画面を開けない").toBeVisible();
  });
});

defineSeed("S-M03-41-CONFIG", async ({ browser, seed }) => {
  const id = seed.シードID;
  // 管理画面に設定項目が無いアプリの設定は、書き換えず、値がシード表のとおりであることだけを確かめる（違えば止める）。
  const level = カテゴリ階層上限();
  if (level !== 5) throw new Error(`${id}: カテゴリ階層上限が ${level}（シード表は5）。設定を直してアプリのキャッシュを作り直してから流す`);
  const c = CSV入出力設定();
  const want = { 取込区切り文字: ",", 取込囲み文字: '"', 出力区切り文字: "," };
  const got = { 取込区切り文字: c.取込区切り文字, 取込囲み文字: c.取込囲み文字, 出力区切り文字: c.出力区切り文字 };
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    throw new Error(`${id}: CSVの入出力の設定が ${JSON.stringify(got)}（シード表は ${JSON.stringify(want)}）。設定を直してアプリのキャッシュを作り直してから流す`);
  }
  // CSV出力の文字コード（シード表はシフトJIS）は、設定値を読む部品（lib/app_config.ts）に読む手段が無い。
  // 雛形ファイルは出力の設定の文字コードで書き出されるので、カテゴリCSV登録画面の雛形ファイルダウンロードで得たファイルの文字コードで見る。
  // 設定ファイルは書き換えない決まりなので、違っても止めずに「シード作成時の問題」として報告に出す
  // （実装したケースはこの値を使わない。使うケース 007 は実装していない。記録の裁定案5）。
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const up = new CategoryCsvUploadPage(page);
    await up.open();
    const encoding = await up.templateEncoding();
    if (encoding !== "シフトJIS") {
      reportSeedIssue(id, `CSV出力の文字コードが ${encoding} で、シード表（シフトJIS）と違う（カテゴリCSV登録画面の雛形ファイルの文字コードで見た）。` +
        "設定ファイルは書き換えないので、このまま進める。このケースはこの値を使わない（使うのは実装していない 007）");
    }
  });

  // カテゴリCSVの列は、CSV出力項目設定の「出力する項目」の並びで確かめる。ほかの機能の試験もカテゴリCSVを読むので、
  // 設定は変えない。並びがシード表と違えば止める（依頼者の判断を仰ぐ）。設定画面に無い項目は、設定できないことを報告に出す。
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const items = await readCategoryCsvOutputItems(page);
    const settable = CATEGORY_CSV_COLUMNS.filter((l) => items.出力する項目.includes(l) || items.出力しない項目.includes(l));
    const missing = CATEGORY_CSV_COLUMNS.filter((l) => !settable.includes(l));
    if (JSON.stringify(items.出力する項目) !== JSON.stringify(settable)) {
      throw new Error(`${id}: カテゴリCSVの出力する項目が「${items.出力する項目.join("・")}」で、シード表の列（設定画面にある項目: ${settable.join("・")}）と違う。` +
        "ほかの機能の試験もカテゴリCSVを読むので、設定は変えずに止める");
    }
    if (missing.length) {
      reportSeedIssue(id, `カテゴリCSVの列のうち「${missing.join("」「")}」は、CSV出力項目設定の項目に無く設定できない（出力する項目: ${items.出力する項目.join("・")}）`);
    }
  });
});

// ---- ケース専用のシード ----

type Row = Record<string, string>;

const label = (suffix: string) => `〔カテゴリID-M0341-${suffix}〕`;
/** 正本が書かない新規の行のカテゴリ名(英) */
const fillerEn = (file: string, suffix = "") => `M0341 ${file.replace(/\.csv$/, "")}${suffix}`;

/** 新規の行（カテゴリIDと表示ランクは空）。正本が書かない必須の値は補う */
function newRow(file: string, nameJp: string, v: Row = {}): Row {
  return {
    "カテゴリID": "", "表示ランク": "", "カテゴリ名(日)": nameJp, "カテゴリ名(英)": fillerEn(file), "親カテゴリID": "0",
    "フロント非表示フラグ": "0", "支店非表示フラグ": "0", ...v,
  };
}

/** 更新の行（正本が値を書くもの）。両非表示フラグは 0 */
function updateRow(v: { id: string; rank: string; nameJp: string; nameEn: string; parentId: string }, extra: Row = {}): Row {
  return {
    "カテゴリID": v.id, "表示ランク": v.rank, "カテゴリ名(日)": v.nameJp, "カテゴリ名(英)": v.nameEn, "親カテゴリID": v.parentId,
    "フロント非表示フラグ": "0", "支店非表示フラグ": "0", ...extra,
  };
}

/** シードを作る管理者のセッションで、正本の作り方の操作をする */
class SeedOps {
  private n = 0;
  private templateColumns: string[] | null = null;

  constructor(readonly page: Page, readonly seedId: string, readonly notes: Notes) {}

  readonly warn = (w: string) => reportSeedIssue(this.seedId, w);

  private fileName(): string {
    this.n += 1;
    return `${this.seedId}-${this.n}.csv`;
  }

  note(suffix: string, id: string): void {
    this.notes.set(label(suffix), id);
  }

  /** 雛形ファイルダウンロードで得た見出し行に、カテゴリIDと表示ランクを空・親カテゴリID 0・両非表示フラグ 0 の1行を足したCSVで最上位のカテゴリを登録する */
  async top(nameJp: string, nameEn: string): Promise<string> {
    return createTopByCsv(this.page, { nameJp, nameEn, frontHide: "0", branchHide: "0" }, this.fileName(), this.warn);
  }

  /** カテゴリ一覧で親のカテゴリ名を押して開き、子カテゴリ作成で登録する（両非表示フラグはチェックを付けない） */
  async child(parentId: string, parentOfParent: string | null, nameJp: string, nameEn: string): Promise<string> {
    return createChildFromList(this.page, { id: parentId, parentOfParent }, { nameJp, nameEn }, this.warn);
  }

  /** 最上位から子へ順に連なるカテゴリ「<名称の前置き><記号>」を登録する。カテゴリIDを上から順に返す */
  async chain(no: string, marks: string[]): Promise<string[]> {
    const ids: string[] = [];
    for (const [i, m] of marks.entries()) {
      const nameJp = `専用カテゴリ-${no}${m}`;
      const nameEn = `M0341 Category-${no}${m}`;
      ids.push(i === 0 ? await this.top(nameJp, nameEn) : await this.child(ids[i - 1], ids[i - 2] ?? null, nameJp, nameEn));
    }
    return ids;
  }

  /** カテゴリCSV登録画面で、登録済みの値を書いた更新の行をアップロードし、表示ランクを設定する */
  async setRank(row: CategoryCsvRow): Promise<void> {
    await uploadCategoryRows(this.page, [{ frontHide: "0", branchHide: "0", ...row }], this.fileName(),
      `${this.seedId} の表示ランクの設定（カテゴリID ${row.id} を ${row.rank} に）`, this.warn);
  }

  /** カテゴリツリーで名前が一致するカテゴリが無いことを確かめ、あれば削除する */
  async purgeNames(names: string[]): Promise<void> {
    await purgeCategoriesInTree(this.page, (e) => names.includes(e.name), this.seedId, this.warn);
  }

  /** カテゴリツリーにカテゴリIDのカテゴリが無いことを確かめ、あれば削除する */
  async purgeId(id: string): Promise<void> {
    await purgeCategoriesInTree(this.page, (e) => e.id === id, this.seedId, this.warn);
  }

  /** カテゴリCSV登録画面の雛形ファイルの見出しの列 */
  async columns(): Promise<string[]> {
    if (!this.templateColumns) {
      const up = new CategoryCsvUploadPage(this.page);
      await up.open();
      this.templateColumns = await up.templateColumns();
    }
    return this.templateColumns;
  }

  /** カテゴリ一覧のCSVダウンロードの行を写した更新の行。正本が書く値だけを変える（最上位の親カテゴリIDの空は 0 にする） */
  async fromExport(id: string, extra: Row = {}): Promise<Row> {
    const exported = await exportedCategoryRow(this.page, id);
    const row: Row = {};
    for (const c of await this.columns()) {
      if (!(c in exported)) throw new Error(`${this.seedId}: カテゴリ一覧のCSVダウンロードに列「${c}」が無い（更新の行の値を写せない）`);
      row[c] = exported[c];
    }
    if (row["親カテゴリID"] === "") row["親カテゴリID"] = "0";
    return { ...row, ...extra };
  }

  /** ケースがアップロードするCSVファイルを作る */
  async file(name: string, rows: Row[], opt: {
    header?: boolean; columns?: string[]; 削除フラグ?: boolean; 文字コード?: "UTF-8" | "シフトJIS"; 改行?: "LF" | "CRLF";
  } = {}): Promise<void> {
    const base = opt.columns ?? await this.columns();
    const columns = opt.削除フラグ ? [...base, DELETE_FLAG] : base;
    if (opt.削除フラグ && !(await this.columns()).includes(DELETE_FLAG)) flagFilesWithoutColumn.add(name);
    else flagFilesWithoutColumn.delete(name);
    files.set(name, buildCaseCsv({ name, columns, header: opt.header, rows, 文字コード: opt.文字コード, 改行: opt.改行 }));
  }
}

function defineCaseSeed(seedId: string, build: (o: SeedOps) => Promise<void>): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    await withAdminSession(browser, SETUP_ADMIN, (page) => build(new SeedOps(page, seedId, notes)));
  });
}

// 002: 親からの階層の計算
defineCaseSeed("S-M03-41-CASE-002", async (o) => {
  const p = await o.top("親カテゴリ-002", "M0341 Category-002");
  o.note("002", p);
  const f = "child_new-002.csv";
  await o.file(f, [newRow(f, "CSV子カテゴリ-002", { 親カテゴリID: p, 階層: "99" })]);
});

// 003: 任意項目が空の新規登録
defineCaseSeed("S-M03-41-CASE-003", async (o) => {
  await o.purgeNames(["任意空カテゴリ-003"]);
  const f = "optional_empty-003.csv";
  await o.file(f, [newRow(f, "任意空カテゴリ-003", { 検索パラメータ: "", 最新セット用バナー画像パス: "", カテゴリアイコン画像パス: "" })]);
});

// 005: 新規2行と更新1行の一括確定。新規の2行は専用親の下に置く（正本は親を書かない）
defineCaseSeed("S-M03-41-CASE-005", async (o) => {
  const a = await o.top("専用親カテゴリ-005", "M0341 Category-005A");
  o.note("005A", a);
  const b = await o.child(a, null, "更新前カテゴリ-005", "M0341 Category-005B");
  o.note("005B", b);
  const f = "multi_success-005.csv";
  const [n1, n2] = M0341_VALUES.新規005;
  await o.file(f, [
    newRow(f, n1, { 親カテゴリID: a, "カテゴリ名(英)": fillerEn(f, "-1") }),
    newRow(f, n2, { 親カテゴリID: a, "カテゴリ名(英)": fillerEn(f, "-2") }),
    await o.fromExport(b, { "カテゴリ名(日)": M0341_VALUES.更新後005 }),
  ]);
});

// 006: 正常登録後の画面
defineCaseSeed("S-M03-41-CASE-006", async (o) => {
  await o.purgeNames(["CSV新規カテゴリ-006"]);
  const f = "root_new-006.csv";
  await o.file(f, [newRow(f, "CSV新規カテゴリ-006")]);
});

// 012: 必須5項目の未入力。カテゴリ名(日)を空にするファイルは、識別用の名前をカテゴリ名(英)に書く
defineCaseSeed("S-M03-41-CASE-012", async (o) => {
  await o.purgeNames(["必須日名空カテゴリ-012", "必須英名空カテゴリ-012", "必須親空カテゴリ-012", "必須フロント空カテゴリ-012", "必須支店空カテゴリ-012"]);
  const j = "jp_blank-012.csv";
  await o.file(j, [newRow(j, "", { "カテゴリ名(英)": "必須日名空カテゴリ-012" })]);
  const e = "en_blank-012.csv";
  await o.file(e, [newRow(e, "必須英名空カテゴリ-012", { "カテゴリ名(英)": "" })]);
  const p = "parent_blank-012.csv";
  await o.file(p, [newRow(p, "必須親空カテゴリ-012", { 親カテゴリID: "" })]);
  const fr = "front_flag_blank-012.csv";
  await o.file(fr, [newRow(fr, "必須フロント空カテゴリ-012", { フロント非表示フラグ: "" })]);
  const br = "branch_flag_blank-012.csv";
  await o.file(br, [newRow(br, "必須支店空カテゴリ-012", { 支店非表示フラグ: "" })]);
});

/** 専用親（最上位）と、その子の専用カテゴリを作り、子の表示ランクを2にする（013・022・027・028） */
async function parentAndChildRank2(o: SeedOps, no: string, parentName: string, childName: string): Promise<[string, string]> {
  const a = await o.top(parentName, `M0341 Category-${no}A`);
  o.note(`${no}A`, a);
  const b = await o.child(a, null, childName, `M0341 Category-${no}B`);
  o.note(`${no}B`, b);
  await o.setRank({ id: b, rank: "2", nameJp: childName, nameEn: `M0341 Category-${no}B`, parentId: a });
  return [a, b];
}

// 013: 更新時の表示ランクの必須
defineCaseSeed("S-M03-41-CASE-013", async (o) => {
  const [a, b] = await parentAndChildRank2(o, "013", "専用親カテゴリ-013", "専用カテゴリ-013B");
  await o.file("update_rank_blank-013.csv", [updateRow({ id: b, rank: "", nameJp: "専用カテゴリ-013B", nameEn: "M0341 Category-013B", parentId: a })]);
});

// 014: カテゴリIDの数値形式。ほかの値は有効な値（カテゴリ名(日)は更新前と違う値にする）
defineCaseSeed("S-M03-41-CASE-014", async (o) => {
  const a = await o.top("専用親カテゴリ-014", "M0341 Category-014A");
  o.note("014A", a);
  const b = await o.child(a, null, "更新前カテゴリ-014", "M0341 Category-014B");
  o.note("014B", b);
  await o.file("category_id_text-014.csv", [updateRow({ id: "abc", rank: "1", nameJp: M0341_VALUES.更新後014, nameEn: "M0341 Category-014B", parentId: a })]);
});

// 015: 存在しない更新対象
defineCaseSeed("S-M03-41-CASE-015", async (o) => {
  await o.purgeId("341999015");
  const f = "category_id_missing-015.csv";
  await o.file(f, [updateRow({ id: "341999015", rank: "1", nameJp: "不存在更新カテゴリ-015", nameEn: fillerEn(f), parentId: "0" })]);
});

// 016: 自分を親に指定
defineCaseSeed("S-M03-41-CASE-016", async (o) => {
  const a = await o.top("専用親カテゴリ-016", "M0341 Category-016A");
  o.note("016A", a);
  const b = await o.child(a, null, "専用カテゴリ-016B", "M0341 Category-016B");
  o.note("016B", b);
  await o.file("self_parent-016.csv", [await o.fromExport(b, { 親カテゴリID: b })]);
});

// 017: 親カテゴリIDの数値形式
defineCaseSeed("S-M03-41-CASE-017", async (o) => {
  await o.purgeNames(["親ID文字カテゴリ"]);
  const f = "parent_id_text-017.csv";
  await o.file(f, [newRow(f, "親ID文字カテゴリ", { 親カテゴリID: "abc" })]);
});

// 018: 存在しない親
defineCaseSeed("S-M03-41-CASE-018", async (o) => {
  await o.purgeId("341999018");
  await o.purgeNames(["親ID不存在カテゴリ"]);
  const f = "parent_id_missing-018.csv";
  await o.file(f, [newRow(f, "親ID不存在カテゴリ", { 親カテゴリID: "341999018" })]);
});

// 019: 階層上限5の超過
defineCaseSeed("S-M03-41-CASE-019", async (o) => {
  const ids = await o.chain("019", ["A", "B", "C", "D", "E"]);
  ["A", "B", "C", "D", "E"].forEach((m, i) => o.note(`019${m}`, ids[i]));
  await o.purgeNames(["第6階層カテゴリ"]);
  const f = "depth_over-019.csv";
  await o.file(f, [newRow(f, "第6階層カテゴリ", { 親カテゴリID: ids[4] })]);
});

/**
 * 削除フラグの値を書いたファイルを使うケースの前提（シード表 S-M03-41-CONFIG の「カテゴリCSVの列の最後に削除フラグ」）を作れるかを、
 * カテゴリを作る前に確かめる。カテゴリCSV登録画面の雛形ファイルの見出しに削除フラグが無いときは、削除フラグの列を足したファイルを
 * 取込が列の数の違いで値を見ずに止めるので、削除フラグの値の判定（設計書 行ごとの判定順序の順序5）を確かめられない。
 * そのときはデータを作らずにケースを止め、合否未判定（スキップ）として理由を報告に出す（記録の裁定案1）。
 */
async function requireDeleteFlagColumn(o: SeedOps, what: string): Promise<void> {
  const columns = await o.columns();
  if (columns.includes(DELETE_FLAG)) return;
  test.skip(true, `合否未判定（正本の前提を作れない。記録の裁定案1の判断待ち）。${o.seedId}: シード表 S-M03-41-CONFIG はカテゴリCSVの列の最後に` +
    `「${DELETE_FLAG}」を挙げるが、カテゴリCSV登録画面の雛形ファイルの見出し（${columns.join("・")}）に無い。この列を足したファイルは、` +
    `取込が列の数の違いで値を見ずにファイル全体を止めるので、${what}を確かめられない。カテゴリは作っていない`);
}

// 020: 削除フラグの選択肢
defineCaseSeed("S-M03-41-CASE-020", async (o) => {
  await requireDeleteFlagColumn(o, "削除フラグの値（2）が0と1以外としてエラーになること");
  const id = await o.top("専用カテゴリ-020", "M0341 Category-020");
  o.note("020", id);
  await o.file("delete_flag_invalid-020.csv", [await o.fromExport(id, { [DELETE_FLAG]: "2" })], { 削除フラグ: true });
});

// 021: 非表示フラグの選択肢
defineCaseSeed("S-M03-41-CASE-021", async (o) => {
  await o.purgeNames(["フロントフラグ異常カテゴリ-021", "支店フラグ異常カテゴリ-021"]);
  const fr = "front_flag_invalid-021.csv";
  await o.file(fr, [newRow(fr, "フロントフラグ異常カテゴリ-021", { フロント非表示フラグ: "2" })]);
  const br = "branch_flag_invalid-021.csv";
  await o.file(br, [newRow(br, "支店フラグ異常カテゴリ-021", { 支店非表示フラグ: "2" })]);
});

// 022: 表示ランクの数値形式
defineCaseSeed("S-M03-41-CASE-022", async (o) => {
  const [a, b] = await parentAndChildRank2(o, "022", "専用親カテゴリ-022", "専用カテゴリ-022B");
  await o.file("display_rank_text-022.csv", [updateRow({ id: b, rank: "abc", nameJp: "専用カテゴリ-022B", nameEn: "M0341 Category-022B", parentId: a })]);
});

// 023: 128文字の受理
defineCaseSeed("S-M03-41-CASE-023", async (o) => {
  const v = M0341_VALUES;
  await o.purgeNames([v.名称128]);
  const f = "text_max-023.csv";
  await o.file(f, [newRow(f, v.名称128, { "カテゴリ名(英)": v.英名128, 検索パラメータ: v.検索128 })]);
});

// 024: 129文字の拒否。カテゴリ名(日)を129文字にするファイルは、識別用の名前をカテゴリ名(英)に書く
defineCaseSeed("S-M03-41-CASE-024", async (o) => {
  const v = M0341_VALUES;
  await o.purgeNames(["日名129カテゴリ-024", "英名129カテゴリ-024", "検索129カテゴリ-024"]);
  const j = "jp_129-024.csv";
  await o.file(j, [newRow(j, v.名称129, { "カテゴリ名(英)": "日名129カテゴリ-024" })]);
  const e = "en_129-024.csv";
  await o.file(e, [newRow(e, "英名129カテゴリ-024", { "カテゴリ名(英)": v.英名129 })]);
  const s = "search_129-024.csv";
  await o.file(s, [newRow(s, "検索129カテゴリ-024", { 検索パラメータ: v.検索129 })]);
});

// 025: 画像パス255文字の受理
defineCaseSeed("S-M03-41-CASE-025", async (o) => {
  const v = M0341_VALUES;
  await o.purgeNames(["画像パス上限カテゴリ"]);
  const f = "image_path_max-025.csv";
  await o.file(f, [newRow(f, "画像パス上限カテゴリ", { 最新セット用バナー画像パス: v.バナー255, カテゴリアイコン画像パス: v.アイコン255 })]);
});

// 026: 画像パス256文字の拒否
defineCaseSeed("S-M03-41-CASE-026", async (o) => {
  const v = M0341_VALUES;
  await o.purgeNames(["バナー画像パス256カテゴリ-026", "アイコン画像パス256カテゴリ-026"]);
  const b = "banner_path_256-026.csv";
  await o.file(b, [newRow(b, "バナー画像パス256カテゴリ-026", { 最新セット用バナー画像パス: v.バナー256 })]);
  const i = "icon_path_256-026.csv";
  await o.file(i, [newRow(i, "アイコン画像パス256カテゴリ-026", { カテゴリアイコン画像パス: v.アイコン256 })]);
});

// 027: 数値11桁の受理
defineCaseSeed("S-M03-41-CASE-027", async (o) => {
  const [a, b] = await parentAndChildRank2(o, "027", "専用親カテゴリ-027", "専用カテゴリ-M0341-027B");
  await o.file("numeric_11-027.csv", [updateRow({
    id: b.padStart(11, "0"), rank: "00000000008", nameJp: "専用カテゴリ-M0341-027B", nameEn: "M0341 Category-027B", parentId: a.padStart(11, "0"),
  })]);
});

// 028: 数値12桁の拒否。対象の数値だけを12桁にし、ほかは登録済みの値
defineCaseSeed("S-M03-41-CASE-028", async (o) => {
  const [a, b] = await parentAndChildRank2(o, "028", "専用親カテゴリ-028", "専用カテゴリ-028B");
  const v = { id: b, rank: "2", nameJp: "専用カテゴリ-028B", nameEn: "M0341 Category-028B", parentId: a };
  await o.file("category_id_12-028.csv", [updateRow({ ...v, id: b.padStart(12, "0") })]);
  await o.file("display_rank_12-028.csv", [updateRow({ ...v, rank: "000000000008" })]);
  await o.file("parent_id_12-028.csv", [updateRow({ ...v, parentId: a.padStart(12, "0") })]);
});

// 029: 名称の前後の空白の除去
defineCaseSeed("S-M03-41-CASE-029", async (o) => {
  await o.purgeNames(["前後空白カテゴリ-029"]);
  const f = "trim_names-029.csv";
  await o.file(f, [newRow(f, "　前後空白カテゴリ-029　", { "カテゴリ名(英)": "  Trimmed Category-029  " })]);
});

// 030: 削除と、同じ親の後続の表示順の繰り上げ。専用親のIDは控えない（正本が控えると書かない）
defineCaseSeed("S-M03-41-CASE-030", async (o) => {
  await requireDeleteFlagColumn(o, "削除フラグ1の行で関連の無いカテゴリが削除済みになり、同じ親の後続の表示順が繰り上がること");
  const p = await o.top("専用親カテゴリ-030", "M0341 Category-030");
  const a = await o.child(p, null, "専用カテゴリ-030A", "M0341 Category-030A");
  o.note("030A", a);
  const b = await o.child(p, null, "専用カテゴリ-030B", "M0341 Category-030B");
  o.note("030B", b);
  await o.setRank({ id: a, rank: "3", nameJp: "専用カテゴリ-030A", nameEn: "M0341 Category-030A", parentId: p });
  await o.setRank({ id: b, rank: "4", nameJp: "専用カテゴリ-030B", nameEn: "M0341 Category-030B", parentId: p });
  // 「専用カテゴリ-030A」には子カテゴリを作らず、商品の商品カテゴリにも付けない（何もしない）
  await o.file("delete_unused-030.csv", [updateRow(
    { id: a, rank: "3", nameJp: "専用カテゴリ-030A", nameEn: "M0341 Category-030A", parentId: p }, { [DELETE_FLAG]: "1" },
  )], { 削除フラグ: true });
});

// 031: 子カテゴリがあるカテゴリの削除
defineCaseSeed("S-M03-41-CASE-031", async (o) => {
  await requireDeleteFlagColumn(o, "子カテゴリが紐付くカテゴリの削除の指定（削除フラグ1）が削除できないエラーになること");
  const a = await o.top("専用カテゴリ-031A", "M0341 Category-031A");
  o.note("031A", a);
  const b = await o.child(a, null, "専用カテゴリ-031B", "M0341 Category-031B");
  o.note("031B", b);
  await o.file("delete_with_child-031.csv", [await o.fromExport(a, { [DELETE_FLAG]: "1" })], { 削除フラグ: true });
});

// 033: 削除の行のカテゴリ名の必須
defineCaseSeed("S-M03-41-CASE-033", async (o) => {
  await requireDeleteFlagColumn(o, "削除フラグ1の行でもカテゴリ名の空が削除より先にエラーになること");
  const id = await o.top("専用カテゴリ-033", "M0341 Category-033");
  o.note("033", id);
  await o.file("delete_name_blank-033.csv", [await o.fromExport(id, { "カテゴリ名(日)": "", [DELETE_FLAG]: "1" })], { 削除フラグ: true });
});

// 034: 削除の行の親の存在
defineCaseSeed("S-M03-41-CASE-034", async (o) => {
  await requireDeleteFlagColumn(o, "削除フラグ1の行でも親カテゴリIDの存在の判定が削除より先にエラーになること");
  const id = await o.top("専用カテゴリ-034", "M0341 Category-034");
  o.note("034", id);
  await o.purgeId("341999034");
  await o.file("delete_parent_missing-034.csv", [await o.fromExport(id, { 親カテゴリID: "341999034", [DELETE_FLAG]: "1" })], { 削除フラグ: true });
});

/** 見出し・正常な新規の行・カテゴリ名(日)が空の行の順のファイル（035・036） */
async function rollbackFile(o: SeedOps, no: string): Promise<void> {
  const name = `ロールバック先行カテゴリ-${no}`;
  await o.purgeNames([name]);
  const f = `rollback-${no}.csv`;
  await o.file(f, [newRow(f, name), newRow(f, "", { "カテゴリ名(英)": fillerEn(f, "-2") })]);
}

defineCaseSeed("S-M03-41-CASE-035", (o) => rollbackFile(o, "035"));
defineCaseSeed("S-M03-41-CASE-036", (o) => rollbackFile(o, "036"));

// 037: 見出し行の無いファイル（雛形の列の並びでデータを1行目から書く）
defineCaseSeed("S-M03-41-CASE-037", async (o) => {
  await o.purgeNames(["見出しなしカテゴリ-037"]);
  const f = "no_header-037.csv";
  await o.file(f, [newRow(f, "見出しなしカテゴリ-037")], { header: false });
});

// 038: 必須列（カテゴリ名(日)）の無い見出し。識別用の名前はカテゴリ名(英)に書く
defineCaseSeed("S-M03-41-CASE-038", async (o) => {
  await o.purgeNames(["必須見出し欠落カテゴリ"]);
  const columns = (await o.columns()).filter((c) => c !== "カテゴリ名(日)");
  const f = "required_header_missing-038.csv";
  const { "カテゴリ名(日)": _omit, ...row } = newRow(f, "", { "カテゴリ名(英)": "必須見出し欠落カテゴリ" });
  await o.file(f, [row], { columns });
});

// 040: 列の並びを変えたファイル。カテゴリ名(英)・カテゴリID・親カテゴリID・カテゴリ名(日)の順から始め、残りは雛形と逆の順
defineCaseSeed("S-M03-41-CASE-040", async (o) => {
  const v = M0341_VALUES.列順040;
  await o.purgeNames([v["カテゴリ名(日)"]]);
  const head = ["カテゴリ名(英)", "カテゴリID", "親カテゴリID", "カテゴリ名(日)"];
  const template = await o.columns();
  const columns = [...head, ...template.filter((c) => !head.includes(c)).reverse()];
  await o.file("reordered_columns-040.csv", [{ "カテゴリID": "", "表示ランク": "", ...v }], { columns });
});

// 041: シフトJIS・CRLF・カンマ区切り・二重引用符囲み
defineCaseSeed("S-M03-41-CASE-041", async (o) => {
  await o.purgeNames(["CSV,正規化-041"]);
  const f = "sjis_crlf_quoted-041.csv";
  await o.file(f, [newRow(f, "CSV,正規化-041")], { 文字コード: "シフトJIS", 改行: "CRLF" });
});

// 042: 各エラーのあとの画面
// 事前準備③の「9個のCSVが各記載条件を持つ」のうち、delete_with_child-042.csv・delete_name_blank-042.csv は削除フラグの列が要る。
// 雛形の見出しに削除フラグの列が無いあいだは前提を作れないので、カテゴリを作る前に止める（020・030 と同じ。記録の裁定案1）
defineCaseSeed("S-M03-41-CASE-042", async (o) => {
  await requireDeleteFlagColumn(o, "9個のファイルのうち、削除フラグ1の2ファイル（delete_with_child-042.csv・delete_name_blank-042.csv）が" +
    "ファイル名の条件（子カテゴリがある・名称が空）でエラーになり、そのあとカテゴリCSV登録画面に留まること");
  const a = await o.top("専用親カテゴリ-042", "M0341 Category-042A");
  o.note("042A", a);
  const b = await o.child(a, null, "専用カテゴリ-042B", "M0341 Category-042B");
  o.note("042B", b);
  const cg = await o.chain("042", ["C", "D", "E", "F", "G"]);
  ["C", "D", "E", "F", "G"].forEach((m, i) => o.note(`042${m}`, cg[i]));
  const h = await o.top("専用カテゴリ-042H", "M0341 Category-042H");
  o.note("042H", h);
  const i = await o.child(h, null, "専用カテゴリ-042I", "M0341 Category-042I");
  o.note("042I", i);
  const j = await o.top("専用カテゴリ-042J", "M0341 Category-042J");
  o.note("042J", j);
  await o.purgeId("341999042");
  const nh = "no_header-042.csv";
  await o.file(nh, [newRow(nh, "見出しなしカテゴリ-042")], { header: false });
  await o.file("header_only-042.csv", []);
  const ct = "category_id_text-042.csv";
  await o.file(ct, [updateRow({ id: "abc", rank: "1", nameJp: "ID文字カテゴリ-042", nameEn: fillerEn(ct), parentId: "0" })]);
  const cm = "category_id_missing-042.csv";
  await o.file(cm, [updateRow({ id: "341999042", rank: "1", nameJp: "ID不存在カテゴリ-042", nameEn: fillerEn(cm), parentId: "0" })]);
  await o.file("self_parent-042.csv", [await o.fromExport(b, { 親カテゴリID: b })]);
  const pm = "parent_id_missing-042.csv";
  await o.file(pm, [newRow(pm, "親ID不存在カテゴリ-042", { 親カテゴリID: "341999042" })]);
  const dov = "depth_over-042.csv";
  await o.file(dov, [newRow(dov, "第6階層カテゴリ-042", { 親カテゴリID: cg[4] })]);
  // ファイル名どおり、削除の指定（削除フラグ 1）の行にする（正本は値を書かない。033・031 と同じ形）
  await o.file("delete_with_child-042.csv", [await o.fromExport(h, { [DELETE_FLAG]: "1" })], { 削除フラグ: true });
  await o.file("delete_name_blank-042.csv", [await o.fromExport(j, { "カテゴリ名(日)": "", [DELETE_FLAG]: "1" })], { 削除フラグ: true });
});

// 051: 更新時の親カテゴリの付け替えによる階層の計算
defineCaseSeed("S-M03-41-UPDPARENT-051", async (o) => {
  const a = await o.top("専用親カテゴリ-051", "M0341 Category-051A");
  o.note("051A", a);
  const b = await o.child(a, null, "専用カテゴリ-051B", "M0341 Category-051B");
  o.note("051B", b);
  const c = await o.child(a, null, "更新前カテゴリ-051", "Before Category-051");
  o.note("051C", c);
  await o.setRank({ id: c, rank: "3", nameJp: "更新前カテゴリ-051", nameEn: "Before Category-051", parentId: a });
  await o.file("update_parent-051.csv", [updateRow(
    { id: c, rank: "3", nameJp: "更新前カテゴリ-051", nameEn: "Before Category-051", parentId: b }, { 階層: "99" },
  )]);
});

// 052: 階層上限5ちょうどの受理
defineCaseSeed("S-M03-41-DEPTH5-052", async (o) => {
  const ids = await o.chain("052", ["A", "B", "C", "D"]);
  ["A", "B", "C", "D"].forEach((m, i) => o.note(`052${m}`, ids[i]));
  await o.purgeNames(["第5階層カテゴリ-052"]);
  await o.file("depth_five-052.csv", [newRow("depth_five-052.csv", "第5階層カテゴリ-052", {
    "カテゴリ名(英)": "Depth Five Category-052", 親カテゴリID: ids[3], 階層: "99",
  })]);
});

// 053: 削除より先の階層の判定
defineCaseSeed("S-M03-41-DELDEPTH-053", async (o) => {
  await requireDeleteFlagColumn(o, "削除フラグ1の行でも階層の判定が削除より先にエラーになること");
  const ids = await o.chain("053", ["A", "B", "C", "D", "E"]);
  ["A", "B", "C", "D", "E"].forEach((m, i) => o.note(`053${m}`, ids[i]));
  const f = await o.child(ids[1], ids[0], "削除階層超過カテゴリ-053", "Delete Depth Category-053");
  o.note("053F", f);
  await o.setRank({ id: f, rank: "5", nameJp: "削除階層超過カテゴリ-053", nameEn: "Delete Depth Category-053", parentId: ids[1] });
  // 「削除階層超過カテゴリ-053」には子カテゴリを作らず、商品の商品カテゴリにも付けない（何もしない）
  await o.file("delete_depth_over-053.csv", [updateRow(
    { id: f, rank: "5", nameJp: "削除階層超過カテゴリ-053", nameEn: "Delete Depth Category-053", parentId: ids[4] }, { [DELETE_FLAG]: "1" },
  )], { 削除フラグ: true });
});

// 054: 親の指定が無く階層が1以外
defineCaseSeed("S-M03-41-NOPARENT-054", async (o) => {
  await o.purgeNames(["親未指定階層3カテゴリ-054"]);
  await o.file("parent_blank_depth3-054.csv", [newRow("parent_blank_depth3-054.csv", "親未指定階層3カテゴリ-054", {
    "カテゴリ名(英)": "No Parent Category-054", 親カテゴリID: "", 階層: "3",
  })]);
});
