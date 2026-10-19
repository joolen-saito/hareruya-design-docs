/**
 * M03-21 棚番登録/編集の画面シード。正本: cases/M03-21_seed_data.tsv
 *
 * 正本の作り方はほとんどが同じ形をしている。
 * 1. 棚番号登録/編集画面の一覧で件数を切り替えて全件を表示し（12000件。ページングが出ないことで全件と確かめる）、
 *    残す行以外を削除ボタンと確認ダイアログで削除する。商品規格で使用中のため削除できない行は、商品マスターを棚番号で検索して
 *    該当する商品規格の棚番号を「指定なし」にして「商品規格を登録」してから削除する。
 * 2. 新規登録の状態で名称・並び順を入れて登録ボタンを押す。登録すると画面はその棚番号の編集欄へ移るので、
 *    続けて登録するときは「新規登録へ戻る」を押す。
 * 3. 登録し終えてから、一覧の名称の行のID列の番号を控える。
 * CSVファイルのシードは、正本の状態・属性に書かれた明細を、見出し「ID,名称,並び順」（038は正本の1行目）の後に並べたもの。
 * 画面が振る番号を書かない22件は e2e/fixtures/m03-21/ のファイルを使い、中身をここでも正本と照合する。
 * 控えた番号を書く046・049・071と、置き場に無い070・073は、シードの実行中に e2e/.state/m03-21/ へ作る（改行は LF、末尾に改行1個）。
 * S-M03-21-ENC-063（アプリの設定ファイルの書き換えと再起動）と、それを使うケース063の S-M03-21-EXPORT-063 は作らない。
 */
import fs from "node:fs";
import path from "node:path";
import { expect, Page } from "@playwright/test";
import { REPO_ROOT, SETUP_ADMIN, STATE_DIR } from "../config/env";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { ensureMember } from "../pages/admin/member";
import { assignShelfToProductClass, productsUsingShelf, unassignShelf } from "../pages/admin/m03_21_product_class_shelf";
import { ShelfInput, ShelfNumberPage, ShelfRow } from "../pages/admin/m03_21_shelf_number";

export const M0321_ADMIN: Account = { loginId: "m0321_admin", password: "Passw0rd!M0321" };

/** 正本は所属店舗を指定しない。管理画面で利用可能な店舗を1つ選び、商品管理を操作できるシステム管理者の権限を付ける（M03-14 と同じ作り方） */
async function createAdmin(page: Page): Promise<void> {
  await page.goto(adminUrl("/setting/system/member/new"));
  const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((options) => options
    .map((option) => option as HTMLOptionElement)
    .filter((option) => option.value !== "")
    .map((option) => option.textContent?.trim() ?? "")
    .filter(Boolean));
  if (stores.length === 0) throw new Error("S-M03-21-ADM: メンバーに割り当てられる店舗が画面に無い");
  const store = stores[0];
  await ensureMember(page, {
    名前: "M03-21試験管理者", 所属店舗: store, ログインID: M0321_ADMIN.loginId, メールアドレス: "m0321_admin@example.test",
    パスワード: M0321_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: store, 編集可能店舗: [store],
  });
}

defineSeed("S-M03-21-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page));
  // ログインでき（稼働中）、商品管理の棚番号登録/編集画面を開けることを、ケースとは別のセッションで確かめる
  await withAdminSession(browser, M0321_ADMIN, async (page) => {
    const shelf = new ShelfNumberPage(page);
    await shelf.openNew();
    await expect(shelf.登録ボタン, "M03-21試験管理者で棚番号登録/編集画面を開けない").toBeVisible();
  });
});

defineSeed("S-M03-21-LIST-STATE", { needs: ["S-M03-21-ADM"] }, async ({ browser }) => {
  // 表示件数とページはログイン中のセッションが覚える。正本の用途どおり、各ケースが開始時に自分のセッションで同じ設定をする（spec の signIn）。
  // ここでは、正本の作り方の操作が試験管理者で通ることを確かめる。
  await withAdminSession(browser, M0321_ADMIN, async (page) => {
    await new ShelfNumberPage(page).showFirstPageWith("10");
  });
});

/** シードを作る管理者のセッションで、正本の作り方の操作をする */
class SeedOps {
  readonly shelf: ShelfNumberPage;

  constructor(readonly page: Page, readonly seedId: string, readonly notes: Notes) {
    this.shelf = new ShelfNumberPage(page);
  }

  readonly warn = (w: string) => reportSeedIssue(this.seedId, w);

  /** 棚番号登録/編集画面を開き、件数を切り替えて全件を表示する */
  async open(): Promise<void> {
    await this.shelf.showFirstPageWith("12000");
    await expect(this.page.locator(".pagination"), `${this.seedId}: 一覧が1ページに収まらず、全件を表示できない`).toHaveCount(0);
  }

  /** いまの画面が全件表示の一覧でなければ、開き直す（削除のあとは、セッションが覚えた表示件数の一覧へ戻る） */
  private async ensureAllShown(): Promise<void> {
    const onList = (await this.shelf.件数.count()) === 1 && (await this.shelf.件数.inputValue()) === "12000";
    if (!onList || (await this.page.locator(".pagination").count()) > 0) await this.open();
  }

  /** 新規登録の状態でなければ「新規登録へ戻る」を押す（登録の後は、その棚番号の編集欄にいる） */
  async toNew(): Promise<void> {
    if (await this.shelf.新規登録へ戻る.count()) await this.shelf.pressBackToNew();
  }

  /** 一覧の行を削除する。商品規格で使用中のときは、その商品規格の棚番号を「指定なし」にしてから削除する */
  private async remove(row: ShelfRow): Promise<void> {
    const what = `${this.seedId}: 棚番号ID ${row.ID}（${row.名称}）の削除`;
    if ((await this.shelf.deleteRow(this.shelf.rowById(row.ID), what)) === "削除") return;
    const released = await unassignShelf(this.page, row.名称, this.seedId, this.warn);
    this.warn(`棚番号「${row.名称}」は商品規格で使用中だったので、商品規格ID ${released.join("・")} の棚番号を「指定なし」にしてから削除した`);
    await this.open();
    if ((await this.shelf.deleteRow(this.shelf.rowById(row.ID), what)) === "使用中") {
      throw new Error(`${what}: 商品規格の棚番号を外したあとも、使用中で削除できない`);
    }
  }

  /** 全件を表示し、keepIds 以外の行をすべて削除する */
  async removeAllExcept(keepIds: string[] = []): Promise<void> {
    await this.open();
    const tried = new Set<string>();
    for (;;) {
      await this.ensureAllShown();
      const target = (await this.shelf.allRows()).find((r) => !keepIds.includes(r.ID));
      if (!target) break;
      if (tried.has(target.ID)) throw new Error(`${this.seedId}: 棚番号ID ${target.ID}（${target.名称}）を削除したが、一覧に残っている`);
      tried.add(target.ID);
      await this.remove(target);
    }
    for (const id of keepIds) await expect(this.shelf.rowById(id), `${this.seedId}: 残す棚番号ID ${id} の行`).toHaveCount(1);
  }

  /** 全件を表示し、名称の行があれば削除する */
  async removeNamed(名称: string): Promise<void> {
    await this.open();
    for (;;) {
      await this.ensureAllShown();
      const target = (await this.shelf.allRows()).find((r) => r.名称 === 名称);
      if (!target) break;
      await this.remove(target);
    }
  }

  /** 一覧に名称の行が無いこと */
  async expectNoName(名称: string): Promise<void> {
    await this.open();
    await expect(this.shelf.rowsByName(名称), `${this.seedId}: 一覧に名称「${名称}」の行が無い`).toHaveCount(0);
  }

  /** 一覧にIDの行が無いこと */
  async expectNoId(id: string): Promise<void> {
    await this.open();
    await expect(this.shelf.rowById(id), `${this.seedId}: 一覧にID ${id} の行が無い`).toHaveCount(0);
  }

  /** 一覧に行が無いこと */
  async expectEmpty(): Promise<void> {
    await this.open();
    expect(await this.shelf.allRows(), `${this.seedId}: 一覧に行が無い`).toEqual([]);
  }

  /**
   * 新規登録の状態で棚番号を順に登録し、登録し終えてから、一覧の名称の行のID列の番号を呼び名に控える
   * （登録後に移った編集欄のIDと同じで、並び順が登録した値であること）。
   */
  async registerAll(entries: [string, ShelfInput][]): Promise<string[]> {
    const fromUrl: string[] = [];
    for (const [, v] of entries) {
      await this.toNew();
      fromUrl.push(await this.shelf.register(v, `${this.seedId}: 名称「${v.名称}」の登録`));
    }
    await this.open();
    const ids: string[] = [];
    for (const [i, [label, v]] of entries.entries()) {
      const id = await this.shelf.idOfName(v.名称);
      if (id !== fromUrl[i]) throw new Error(`${this.seedId}: 一覧の名称「${v.名称}」の行のID ${id} が、登録後の編集欄のID ${fromUrl[i]} と違う`);
      const row = await this.shelf.readRow(this.shelf.rowById(id));
      if (row.並び順 !== v.並び順) throw new Error(`${this.seedId}: 一覧の名称「${v.名称}」の並び順が ${row.並び順}（${v.並び順} のはず）`);
      this.notes.set(label, id);
      ids.push(id);
    }
    return ids;
  }
}

function defineShelfSeed(seedId: string, build: (o: SeedOps) => Promise<void>, needs: string[] = []): void {
  defineSeed(seedId, { needs }, async ({ browser, notes, seed }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      await build(new SeedOps(page, seed.シードID, notes));
    });
  });
}

const v = (名称: string, 並び順: string): ShelfInput => ({ 名称, 並び順 });
const label = (suffix: string) => `〔棚番号ID-M0321-${suffix}〕`;

// ---- CSVファイル ----

const STD_HEADER = "ID,名称,並び順";
type CsvSpec = { file: string; header: string; rows: string[] };

/** 正本の状態・属性に書かれた明細（呼び名は、控えた番号に置き換える前の形） */
const CSV_SPECS: Record<string, CsvSpec> = {
  "S-M03-21-CSV-BAD-HEADER-038": { file: "m03-21-bad-header-038.csv", header: "ID,棚番号,並び順", rows: [",H-103,103"] },
  "S-M03-21-CSV-NO-DATA-039": { file: "m03-21-no-data-039.csv", header: STD_HEADER, rows: [] },
  "S-M03-21-CSV-040": { file: "m03-21-column-count-040.csv", header: STD_HEADER, rows: [",I-104,104,余分な値"] },
  "S-M03-21-CSV-041": { file: "m03-21-required-empty-041.csv", header: STD_HEADER, rows: [",,105", ",J-105,"] },
  "S-M03-21-CSV-042": { file: "m03-21-bad-name-042.csv", header: STD_HEADER, rows: [",j-106,106"] },
  "S-M03-21-CSV-043": { file: "m03-21-missing-id-043.csv", header: STD_HEADER, rows: ["329043,K-107,107"] },
  "S-M03-21-CSV-044": { file: "m03-21-duplicate-044.csv", header: STD_HEADER, rows: [",D-844,108"] },
  "S-M03-21-CSV-045": { file: "m03-21-row-error-045.csv", header: STD_HEADER, rows: [",L-109,109", ",l-110,110"] },
  "S-M03-21-CSV-046": { file: "m03-21-atomic-046.csv", header: STD_HEADER, rows: ["〔棚番号ID-M0321-046A〕,M-111,111", ",N-112,112", ",n-113,113"] },
  "S-M03-21-CSV-047": { file: "m03-21-new-empty-id-047.csv", header: STD_HEADER, rows: [",E-101,101"] },
  "S-M03-21-CSV-048": { file: "m03-21-new-zero-id-048.csv", header: STD_HEADER, rows: ["0,F-102,102"] },
  "S-M03-21-CSV-049": { file: "m03-21-update-049.csv", header: STD_HEADER, rows: ["〔棚番号ID-M0321-049A〕,G-401,41"] },
  "S-M03-21-CSV-050": { file: "m03-21-sort-low-050.csv", header: STD_HEADER, rows: [",O-114,0"] },
  "S-M03-21-CSV-051": { file: "m03-21-sort-high-051.csv", header: STD_HEADER, rows: [",P-115,32767"] },
  "S-M03-21-CSV-052": { file: "m03-21-sort-under-052.csv", header: STD_HEADER, rows: [",Q-116,-1"] },
  "S-M03-21-CSV-053": { file: "m03-21-sort-over-053.csv", header: STD_HEADER, rows: [",R-117,32768"] },
  "S-M03-21-CSV-054": { file: "m03-21-sort-type-054.csv", header: STD_HEADER, rows: [",S-118,abc"] },
  "S-M03-21-CSV-055": { file: "m03-21-id-type-055.csv", header: STD_HEADER, rows: ["abc,T-119,119"] },
  "S-M03-21-CSV-056": { file: "m03-21-new-empty-id-056.csv", header: STD_HEADER, rows: [",E-856,101"] },
  "S-M03-21-CSV-065": { file: "m03-21-name-empty-065.csv", header: STD_HEADER, rows: [",,65"] },
  "S-M03-21-CSV-066": { file: "m03-21-sort-empty-066.csv", header: STD_HEADER, rows: [",V-066,"] },
  "S-M03-21-CSV-067": { file: "m03-21-name-2digit-067.csv", header: STD_HEADER, rows: [",T-67,65"] },
  "S-M03-21-CSV-068": { file: "m03-21-name-4digit-068.csv", header: STD_HEADER, rows: [",T-1068,65"] },
  "S-M03-21-CSV-069": { file: "m03-21-name-nohyphen-069.csv", header: STD_HEADER, rows: [",T069,65"] },
  "S-M03-21-DPCSV-070": { file: "m03-21-bulk-new-070.csv", header: STD_HEADER, rows: [",E-870,101", ",F-870,102", ",G-870,103"] },
  "S-M03-21-DPCSV-071": { file: "m03-21-mixed-071.csv", header: STD_HEADER, rows: ["〔棚番号ID-M0321-071A〕,G-871,41", ",H-871,102"] },
  "S-M03-21-DPCSV-073": { file: "m03-21-again-073.csv", header: STD_HEADER, rows: [",J-873,103"] },
};

const FIXTURE_DIR = path.join(REPO_ROOT, "e2e", "fixtures", "m03-21");
const RUNTIME_DIR = path.join(STATE_DIR, "m03-21");
const RUNTIME_SEEDS = ["S-M03-21-CSV-046", "S-M03-21-CSV-049", "S-M03-21-DPCSV-070", "S-M03-21-DPCSV-071", "S-M03-21-DPCSV-073"];
const RUNTIME_FILES = new Set(RUNTIME_SEEDS.map((id) => CSV_SPECS[id].file));

/** ケースが取込ファイルに指定するファイルの場所（シードが用意したもの） */
export function m0321CsvPath(file: string): string {
  if (!Object.values(CSV_SPECS).some((s) => s.file === file)) throw new Error(`${file} は M03-21 のシードが用意するCSVファイルでない`);
  return RUNTIME_FILES.has(file) ? path.join(RUNTIME_DIR, file) : path.join(FIXTURE_DIR, file);
}

/** 正本の状態・属性・投入方法に、ファイル名・見出し・明細の各行がそのまま書かれていること（書き写しの誤りを止める） */
function expectSpecMatchesSeed(seedId: string, spec: CsvSpec): void {
  const s = getSeed(seedId);
  const text = s["状態・属性"] + s.投入方法;
  if (!text.includes(spec.file)) throw new Error(`${seedId}: シード表にファイル名 ${spec.file} が無い`);
  if (!text.includes(`1行目=${spec.header}`) && !text.includes(`見出し「${spec.header}」`)) {
    throw new Error(`${seedId}: シード表の見出しが「${spec.header}」でない`);
  }
  for (const row of spec.rows) if (!s["状態・属性"].includes(row)) throw new Error(`${seedId}: シード表の状態・属性に明細「${row}」が無い`);
}

const csvContent = (spec: CsvSpec, notes: Notes) =>
  [spec.header, ...spec.rows.map((r) => r.replace(/〔[^〕]+〕/g, (l) => notes.get(l)))].join("\n") + "\n";

/** CSVファイルを用意する。画面が振る番号を書かないものは e2e/fixtures のファイルの中身を照合し、書くものはここで作る */
function prepareCsv(seedId: string, notes: Notes): void {
  const spec = CSV_SPECS[seedId];
  if (!spec) throw new Error(`${seedId}: CSVファイルの明細が定義されていない`);
  expectSpecMatchesSeed(seedId, spec);
  const want = csvContent(spec, notes);
  const file = m0321CsvPath(spec.file);
  if (RUNTIME_FILES.has(spec.file)) {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    fs.writeFileSync(file, want, "utf-8");
  }
  if (!fs.existsSync(file)) throw new Error(`${seedId}: CSVファイル ${file} が無い`);
  if (fs.readFileSync(file, "utf-8") !== want) throw new Error(`${seedId}: CSVファイル ${file} の中身がシード表と違う`);
}

defineSeed("S-M03-21-CSV-BAD-HEADER-038", async ({ seed, notes }) => { prepareCsv(seed.シードID, notes); });
defineSeed("S-M03-21-CSV-NO-DATA-039", async ({ seed, notes }) => { prepareCsv(seed.シードID, notes); });

// ---- 共有のシード ----

defineShelfSeed("S-M03-21-EXPORT-ORDER", async (o) => {
  // 用途どおり、使うたびに3件を再投入する（ほかの行は削除し、3件を登録し直す）
  await o.removeAllExcept();
  await o.registerAll([[label("共有A"), v("B-100", "10")], [label("共有B"), v("C-200", "20")], [label("共有C"), v("A-300", "30")]]);
});

defineShelfSeed("S-M03-21-DUP", async (o) => {
  await o.open();
  const left = o.shelf.rowsByName("B-020");
  if ((await left.count()) === 1) {
    // 前の実行で残っていれば、シード表と同じ内容（並び順20・商品規格からの参照なし）であることを確かめて使う
    const row = await o.shelf.readRow(left);
    if (row.並び順 !== "20") throw new Error(`${o.seedId}: 残っている名称「B-020」の並び順が ${row.並び順}（シード表は20）。作り直してよいかの判断が要る`);
    const products = await productsUsingShelf(o.page, "B-020", o.seedId);
    if (products.length) throw new Error(`${o.seedId}: 残っている名称「B-020」を商品（商品ID ${products.join("・")}）の商品規格が使っている`);
    o.notes.set(label("共有D"), row.ID);
    o.warn(`前の実行で残っていた名称「B-020」（棚番号ID ${row.ID}・並び順20・商品規格からの参照なし）をそのまま使った`);
    return;
  }
  await o.registerAll([[label("共有D"), v("B-020", "20")]]);
});

// ---- 1件だけ登録する形（ほかの行は削除する） ----

const one = (n: string, 名称: string, 並び順: string, after?: (o: SeedOps) => Promise<void>) => async (o: SeedOps) => {
  await o.removeAllExcept();
  await o.registerAll([[label(n), v(名称, 並び順)]]);
  if (after) await after(o);
};

defineShelfSeed("S-M03-21-BASE-003", one("003", "A-803", "10"));
defineShelfSeed("S-M03-21-BASE-004", one("004", "A-804", "10", (o) => o.expectNoId("329004")));
defineShelfSeed("S-M03-21-BASE-006", one("006", "A-806", "10"));
defineShelfSeed("S-M03-21-BASE-009", one("009", "A-809", "10", (o) => o.expectNoName("Y-902")));
defineShelfSeed("S-M03-21-BASE-010", one("010", "A-810", "10", (o) => o.expectNoName("Y-902")));
defineShelfSeed("S-M03-21-BASE-011", one("011", "A-811", "10"));
defineShelfSeed("S-M03-21-BASE-012", one("012", "A-812", "10"));
defineShelfSeed("S-M03-21-BASE-013", one("013", "A-813", "10"));
defineShelfSeed("S-M03-21-BASE-014", one("014", "A-814", "10"));
defineShelfSeed("S-M03-21-BASE-015", one("015", "A-815", "10"));
defineShelfSeed("S-M03-21-BASE-016", one("016", "A-816", "10"));
defineShelfSeed("S-M03-21-BASE-017", one("017", "A-817", "10"));
defineShelfSeed("S-M03-21-BASE-018", one("018", "A-818", "10"));
defineShelfSeed("S-M03-21-UNUSED-023", one("023", "V-823", "200"));
defineShelfSeed("S-M03-21-UNUSED-024", one("024", "V-824", "200"));
defineShelfSeed("S-M03-21-UNUSED-025", one("025", "V-825", "200", (o) => o.expectNoId("329025")));
defineShelfSeed("S-M03-21-UNUSED-028", one("028", "V-828", "200"));
defineShelfSeed("S-M03-21-UNUSED-029", one("029", "V-829", "200"));
defineShelfSeed("S-M03-21-UNUSED-030", one("030", "V-830", "200"));
defineShelfSeed("S-M03-21-UNUSED-031", one("031", "V-831", "200"));
defineShelfSeed("S-M03-21-EXPORT-032", one("032", "X-832", "10"));
defineShelfSeed("S-M03-21-EXPORT-033", one("033", "X-833", "10"));
defineShelfSeed("S-M03-21-EXPORT-034", one("034", "X-834", "10"));
defineShelfSeed("S-M03-21-BASE-060", one("060", "A-860", "10"));
defineShelfSeed("S-M03-21-BASE-061", one("061", "A-861", "10"));
defineShelfSeed("S-M03-21-BASE-062", one("062", "A-862", "10"));
defineShelfSeed("S-M03-21-BASE-064", one("064", "A-864", "10"));

// ---- 2件以上を登録する形 ----

defineShelfSeed("S-M03-21-BASE-002", async (o) => {
  await o.removeAllExcept();
  await o.registerAll([
    [label("002A"), v("A-802", "10")], [label("002B"), v("B-802", "20")], [label("002C"), v("C-802", "30")], [label("002D"), v("D-802", "40")],
  ]);
});

/** S-M03-21-DUP の棚番号（名称「B-020」）と、これから登録する1件以外を削除してから登録する */
const withDup = (n: string, 名称: string) => async (o: SeedOps) => {
  const dup = o.notes.get(label("共有D"));
  await o.removeAllExcept([dup]);
  const row = await o.shelf.readRow(o.shelf.rowById(dup));
  if (row.名称 !== "B-020") throw new Error(`${o.seedId}: 共有の棚番号ID ${dup} の名称が「${row.名称}」（B-020 のはず）`);
  await o.registerAll([[label(n), v(名称, "10")]]);
};
defineShelfSeed("S-M03-21-BASE-021", withDup("021", "A-821"), ["S-M03-21-DUP"]);
defineShelfSeed("S-M03-21-BASE-022", withDup("022", "A-822"), ["S-M03-21-DUP"]);

defineShelfSeed("S-M03-21-PAGING-057", async (o) => {
  await o.removeAllExcept();
  const names = ["A-757", "B-758", "C-759", "D-760", "E-761", "F-762", "G-763", "H-764", "I-765", "J-766", "K-767"];
  // シード表は名称の順に〔…057A〕〜〔…057K〕を控えると定め、11個の呼び名をすべて書いている
  await o.registerAll(names.map((name, i): [string, ShelfInput] => [label(`057${String.fromCharCode(65 + i)}`), v(name, String(i + 1))]));
});

// ---- 名称の行だけを消す形・行を0件にする形 ----

const absent = (名称: string) => async (o: SeedOps) => {
  await o.removeNamed(名称);
  await o.expectNoName(名称);
};
defineShelfSeed("S-M03-21-NEW-007", absent("Z-901"));
defineShelfSeed("S-M03-21-NEW-008", absent("Z-901"));

defineShelfSeed("S-M03-21-DPNEW-072", async (o) => {
  await o.removeAllExcept();
  await o.expectEmpty();
});

// ---- 商品規格が使う形 ----

const used = (n: string, 名称: string) => async (o: SeedOps) => {
  await o.open();
  if ((await o.shelf.rowsByName(名称).count()) > 0) {
    // 正本の作り方に、この名称の清掃の手順が無い（同じ名称は登録できない）。黙って消さずに止める
    throw new Error(`${o.seedId}: 名称「${名称}」の棚番号が前の実行から残っている。シード表に清掃の手順が無いので、消して作り直してよいかの判断が要る`);
  }
  await o.registerAll([[label(n), v(名称, "100")]]);
  const { 商品ID, 商品規格ID } = await assignShelfToProductClass(o.page, 名称, o.seedId, o.warn);
  o.notes.set(`〔商品規格ID-M0321-${n}〕`, 商品規格ID);
  o.warn(`棚番号「${名称}」を、商品ID ${商品ID} の商品規格ID ${商品規格ID}（スマレジ連携フラグ「連携しない」）に付けた`);
};
defineShelfSeed("S-M03-21-USED-026", used("026", "U-826"));
defineShelfSeed("S-M03-21-USED-027", used("027", "U-827"));

// ---- 棚番号とCSVファイルの形 ----

/** 名称a・並び順40 と 名称b・並び順50 の2件だけにし（未登録であるべき名称・IDの行が無いことも確かめる）、CSVファイルを用意する */
const csvPair = (n: string, a: string, b: string, absentNames: string[] = [], absentIds: string[] = []) => async (o: SeedOps) => {
  await o.removeAllExcept();
  await o.registerAll([[label(`${n}A`), v(a, "40")], [label(`${n}B`), v(b, "50")]]);
  for (const id of absentIds) await o.expectNoId(id);
  for (const name of absentNames) await o.expectNoName(name);
  prepareCsv(o.seedId, o.notes);
};
defineShelfSeed("S-M03-21-CSV-040", csvPair("040", "C-840", "D-840"));
defineShelfSeed("S-M03-21-CSV-041", csvPair("041", "C-841", "D-841"));
defineShelfSeed("S-M03-21-CSV-042", csvPair("042", "C-842", "D-842"));
defineShelfSeed("S-M03-21-CSV-043", csvPair("043", "C-843", "D-843", [], ["329043"]));
defineShelfSeed("S-M03-21-CSV-044", csvPair("044", "C-844", "D-844"));
defineShelfSeed("S-M03-21-CSV-045", csvPair("045", "C-845", "D-845"));
defineShelfSeed("S-M03-21-CSV-046", csvPair("046", "C-400", "D-500", ["M-111", "N-112"]));
defineShelfSeed("S-M03-21-CSV-047", csvPair("047", "C-847", "D-847", ["E-101"]));
defineShelfSeed("S-M03-21-CSV-048", csvPair("048", "C-848", "D-848", ["F-102"]));
defineShelfSeed("S-M03-21-CSV-049", csvPair("049", "C-849", "D-849", ["G-401"]));
defineShelfSeed("S-M03-21-CSV-050", csvPair("050", "C-850", "D-850", ["O-114"]));
defineShelfSeed("S-M03-21-CSV-051", csvPair("051", "C-851", "D-851", ["P-115"]));
defineShelfSeed("S-M03-21-CSV-052", csvPair("052", "C-852", "D-852"));
defineShelfSeed("S-M03-21-CSV-053", csvPair("053", "C-853", "D-853"));
defineShelfSeed("S-M03-21-CSV-054", csvPair("054", "C-854", "D-854"));
defineShelfSeed("S-M03-21-CSV-055", csvPair("055", "C-855", "D-855"));
defineShelfSeed("S-M03-21-CSV-056", csvPair("056", "C-856", "D-856", ["E-856"]));
defineShelfSeed("S-M03-21-CSV-065", csvPair("065", "C-865", "D-865"));
defineShelfSeed("S-M03-21-CSV-066", csvPair("066", "C-866", "D-866"));
defineShelfSeed("S-M03-21-CSV-067", csvPair("067", "C-867", "D-867"));
defineShelfSeed("S-M03-21-CSV-068", csvPair("068", "C-868", "D-868"));
defineShelfSeed("S-M03-21-CSV-069", csvPair("069", "C-869", "D-869"));

defineShelfSeed("S-M03-21-DPCSV-070", async (o) => {
  await o.removeAllExcept();
  await o.expectEmpty();
  prepareCsv(o.seedId, o.notes);
});

defineShelfSeed("S-M03-21-DPCSV-071", async (o) => {
  await o.removeAllExcept();
  await o.registerAll([[label("071A"), v("C-871", "40")]]);
  for (const name of ["G-871", "H-871"]) await o.expectNoName(name);
  prepareCsv(o.seedId, o.notes);
});

defineShelfSeed("S-M03-21-DPCSV-073", async (o) => {
  await o.removeAllExcept();
  await o.expectEmpty();
  prepareCsv(o.seedId, o.notes);
});
