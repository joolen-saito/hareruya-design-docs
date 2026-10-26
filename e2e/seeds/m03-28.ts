/**
 * M03-28 商品タグ更新CSV登録の画面シード。正本: cases/M03-28_seed_data.tsv
 *
 * 作るのは、画面だけで用意できて、実装したケース（003・007・008・009・010・019・025〜028・030・031・047〜049）が使うシードだけ。
 * - S-M03-28-ADM: メンバー管理で試験管理者を登録し、メンバーIDを控える（ほかの機能と同じ作り方。システム管理者の権限）。
 * - S-M03-28-MASTER: タグ登録/編集画面でタグA・B・Cを登録し、一覧のID欄の値を控える。共有のシードなので、同じ名称のタグが
 *   一覧に1件ずつあれば、それを使う（タグを削除する画面は無い）。
 * - S-M03-28-SESSION-003: 保持値（件数・ページ）はログイン中のセッションが覚える。ケースのセッションへの設定は、ケースの開始時に
 *   画面の件数欄で行う（spec/m03/m03-28.spec.ts）。ここでは、新しいセッションでその設定ができることを確かめる。
 * - 商品を作るシード（CASE-008・009・010・019・030・031、NOTAG-047、CB1ROW-048、CBMULTI-049）: グッズ商品CSV登録で、
 *   正本が書いた商品コード・商品名・公開ステータス・タグ(ID)・スマレジ連携フラグの1行を取り込み、商品マスターの検索で商品IDを控える。
 *   正本が「取込可能な値」とだけ書く必須列は、M03-01 の部品（pages/admin/m03_01_goods_register.ts）の共通の値を使う
 *   （商品カテゴリ(ID)は「サプライ・グッズ」のカテゴリID）。商品コードは正本が決めた固定の値で、片付けの手順が正本に無いので、
 *   前の実行の商品が残っていれば作らずに止める。
 * - 取込ファイル: 見出しは商品タグ更新CSVの雛形（画面の「雛形ファイルダウンロード」）の見出し行。UTF-8・改行は LF・末尾に改行1個
 *   （fixtures の README と同じ決め方）。1つの欄に2つのタグIDを書くときは、取込の囲み文字（二重引用符）で囲む。
 *   CASE-027・028 は e2e/fixtures/m03-28 のファイルの中身を照合する。
 * - 「同名取込履歴0件」（CASE-008・009・010・030・031）: 正本の作り方どおり、商品タグ更新CSVアップロード画面の取込履歴に
 *   そのファイル名の行が無いことを確かめる。行があるときの作り方はDBへの直接設定なので、行があれば止める（DBを書き換えない）。
 *
 * 作らないシード（使うケースも実装しない）:
 * - HISTORY-001・002・004〜006: 取込履歴をDBシードで登録・退避する。
 * - CASE-011〜018・024・029・032、NEGPRODUCT-039、BADTAGID-040: 商品タグ更新履歴を0件にする操作をDBへ直接行う。
 * - CASE-020〜023: 5009〜5010件の商品とタグの紐付けをDBシードで登録する。
 * - QB-*: 固定のタグ・販売割引率をDBへ直接登録する（QB-MASTER）。
 */
import fs from "node:fs";
import path from "node:path";
import { expect, Page } from "@playwright/test";
import { REPO_ROOT, SETUP_ADMIN, STATE_DIR } from "../config/env";
import { getSeed } from "../lib/catalog";
import { csvLine, decodeCsvBytes, parseCsv } from "../lib/csv";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { downloadGoodsCsvTemplate } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { assignedTagNames } from "../pages/admin/m03_13_product";
import { TagPage } from "../pages/admin/m03_13_tag";
import { downloadedBytes } from "../pages/admin/m03_21_shelf_number";
import { goodsCsvCategoryId } from "../pages/admin/m03_22_product";
import { productIdsByCode } from "../pages/admin/m03_23_seed_products";
import { ProductTagCsvUploadPage } from "../pages/admin/m03_28_product_tag_csv_upload";
import { allTagRows, expectNoProductWithId, unusedSortNo } from "../pages/admin/m03_28_seed_ops";
import { ensureMember } from "../pages/admin/member";
import { openProductEdit } from "../pages/admin/product_edit";

export const M0328_ADMIN: Account = { loginId: "m0328_admin", password: "Passw0rd!M0328" };

// ---- 管理者 ----

/** 正本は所属店舗を「登録済みの選択肢」とする。管理画面で選べる店舗の先頭を選び、商品管理を操作できるシステム管理者の権限を付ける */
async function createAdmin(page: Page): Promise<string> {
  await page.goto(adminUrl("/setting/system/member/new"));
  const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((options) => options
    .map((option) => option as HTMLOptionElement)
    .filter((option) => option.value !== "")
    .map((option) => option.textContent?.trim() ?? "")
    .filter(Boolean));
  if (stores.length === 0) throw new Error("S-M03-28-ADM: メンバーに割り当てられる店舗が画面に無い");
  const store = stores[0];
  return ensureMember(page, {
    名前: "M03-28試験管理者", 所属店舗: store, ログインID: M0328_ADMIN.loginId, メールアドレス: "m0328_admin@example.test",
    パスワード: M0328_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: store, 編集可能店舗: [store],
  });
}

defineSeed("S-M03-28-ADM", async ({ browser, notes }) => {
  // 正本: 登録後、メンバー管理一覧の名前の行からメンバー編集画面を開き、アドレス欄の番号を控える。
  // 部品（ensureMember）は、登録の直後に移るメンバー編集画面のアドレスの番号（既にいるときは一覧の行の番号）を返す。同じメンバーの番号
  const id = await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page));
  notes.set("〔利用者ID-M0328-共有〕", id);
  // ログインでき（稼働中・ロックなし）、商品タグ更新CSVアップロード画面を開けることを、ケースとは別のセッションで確かめる
  await withAdminSession(browser, M0328_ADMIN, async (page) => {
    const upload = new ProductTagCsvUploadPage(page);
    await upload.open();
    await expect(upload.アップロードボタン, "M03-28試験管理者で商品タグ更新CSVアップロード画面を開けない").toBeVisible();
  });
});

// ---- タグ ----

const TAGS = [
  { label: "〔タグID-M0328-共有A〕", 名称日: "M0328試験タグA", 名称英: "M0328 Test Tag A" },
  { label: "〔タグID-M0328-共有B〕", 名称日: "M0328試験タグB", 名称英: "M0328 Test Tag B" },
  { label: "〔タグID-M0328-共有C〕", 名称日: "M0328試験タグC", 名称英: "M0328 Test Tag C" },
];
export const TAG_NAME: Record<string, string> = Object.fromEntries(TAGS.map((t) => [t.label, t.名称日]));

defineSeed("S-M03-28-MASTER", async ({ browser, notes }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (const t of TAGS) {
      let rows = await allTagRows(page);
      const same = (r: { 名称日: string; 名称英: string }) => r.名称日 === t.名称日 || r.名称英 === t.名称英;
      let hit = rows.filter(same);
      if (hit.length === 0) {
        const tag = new TagPage(page);
        await tag.openNew();
        await tag.register({ 名称日: t.名称日, 名称英: t.名称英, 並び順: unusedSortNo(rows) }, `S-M03-28-MASTER: タグ「${t.名称日}」の登録`);
        rows = await allTagRows(page);
        hit = rows.filter(same);
      }
      if (hit.length !== 1 || hit[0].名称日 !== t.名称日 || hit[0].名称英 !== t.名称英) {
        throw new Error(`S-M03-28-MASTER: 名称(日)「${t.名称日}」・名称(英)「${t.名称英}」のタグが一覧に1件だけでない（${JSON.stringify(hit)}）`);
      }
      // 正本: タグ登録画面の一覧で各名称の行のID列に表示された番号を控える
      notes.set(t.label, hit[0].ID);
    }
  });
});

defineSeed("S-M03-28-SESSION-003", { needs: ["S-M03-28-ADM"] }, async ({ browser }) => {
  await withAdminSession(browser, M0328_ADMIN, async (page) => {
    const upload = new ProductTagCsvUploadPage(page);
    await upload.open();
    await upload.chooseCount("10");
  });
});

// ---- 取込ファイル ----

const RUNTIME_DIR = path.join(STATE_DIR, "m03-28");
const FIXTURE_DIR = path.join(REPO_ROOT, "e2e", "fixtures", "m03-28");

/** ケースが取込ファイルに指定するファイルの場所（シードが用意したもの） */
export function m0328CsvPath(file: string): string {
  if (["wrong-columns-027.csv", "wrong-columns-028.csv"].includes(file)) return path.join(FIXTURE_DIR, file);
  return path.join(RUNTIME_DIR, file);
}

/** 商品タグ更新CSVの雛形（画面の「雛形ファイルダウンロード」）の見出し行 */
async function templateHeader(page: Page): Promise<string[]> {
  const upload = new ProductTagCsvUploadPage(page);
  await upload.open();
  const rows = parseCsv(decodeCsvBytes(await downloadedBytes(await upload.downloadTemplate())));
  if (rows.length !== 1) throw new Error(`商品タグ更新CSVの雛形が見出し1行でない（${JSON.stringify(rows)}）`);
  return rows[0];
}

/** 取込ファイルを書く（UTF-8・改行は LF・末尾に改行1個） */
function writeCsv(file: string, rows: string[][]): void {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  fs.writeFileSync(path.join(RUNTIME_DIR, file), rows.map((r) => csvLine(r)).join("\n") + "\n", "utf-8");
}

/** 正本の状態・属性に、ファイル名が書かれていること（書き写しの誤りを止める） */
function expectFileNamed(seedId: string, file: string): void {
  if (!getSeed(seedId)["状態・属性"].includes(file)) throw new Error(`${seedId}: シード表の状態・属性にファイル名 ${file} が無い`);
}

/** 商品タグ更新CSVアップロード画面の取込履歴（全件）に、そのファイル名の行が無いことを確かめる。あれば止める */
async function expectNoHistoryNamed(page: Page, seedId: string, file: string): Promise<void> {
  const rows = await new ProductTagCsvUploadPage(page).allHistoryRows();
  const hit = rows.filter((r) => r.ファイル名 === file);
  if (hit.length) {
    throw new Error(`${seedId}: 商品タグ更新CSVアップロード画面の取込履歴に、ファイル名 ${file} の行が${hit.length}件ある。`
      + "正本の作り方は、行があるときはDBへ直接設定する（取込履歴を削除する画面が無い）ので、ここで止める（DBを書き換えない）");
  }
}

// ---- 商品 ----

type Product = { code: string; nameJp: string; nameEn: string; 公開: "1" | "3"; tags: string[] };

/** シードを作る管理者のセッションで、正本の作り方の操作をする */
class SeedOps {
  constructor(readonly page: Page, readonly seedId: string, readonly notes: Notes) {}
  readonly warn = (w: string) => reportSeedIssue(this.seedId, w);

  /**
   * グッズ商品CSV登録で1行の商品を作り、商品マスターの検索でコードの行の商品IDを読んで返す。
   * 商品公開ステータスの値は、雛形の説明（「1:公開 2:非公開 3:廃止」）で正本の意味（公開・廃止）と同じかを確かめてから入れる。
   */
  async createProduct(p: Product): Promise<string> {
    const left = await productIdsByCode(this.page, p.code);
    if (left.length) {
      throw new Error(`${this.seedId}: 商品コード ${p.code} の商品（商品ID ${left.join("、")}）が前の実行から残っている。正本に片付けの手順が無いので、作り直してよいかの判断が要る`);
    }
    const template = await downloadGoodsCsvTemplate(this.page);
    const desc = template.columns.find((c) => c.label === "商品公開ステータス")?.description ?? "";
    const meaning = p.公開 === "1" ? "公開" : "廃止";
    if (!new RegExp(`(^|\\s)${p.公開}\\s*:\\s*${meaning}(\\s|$)`).test(desc)) {
      throw new Error(`${this.seedId}: 雛形の商品公開ステータスの説明「${desc}」で、${p.公開} が「${meaning}」でない`);
    }
    const categoryId = await goodsCsvCategoryId(this.page, this.warn);
    await registerGoodsCsv(this.page, {
      what: `${this.seedId} のグッズ商品CSV登録（商品コード ${p.code}）`, fileName: `${this.seedId.toLowerCase()}-goods.csv`, categoryId,
      lines: [{ code: p.code, nameJp: p.nameJp, nameEn: p.nameEn }],
      common: { "商品公開ステータス": p.公開, "タグ(ID)": p.tags.join(","), "スマレジ連携フラグ": "0" },
      onWarning: this.warn,
    });
    // 正本: 商品マスターの検索でコードを入れて検索し、検索結果の商品ID列に表示された番号を控える
    const ids = await productIdsByCode(this.page, p.code);
    if (ids.length !== 1) throw new Error(`${this.seedId}: 商品マスターの検索で、商品コード ${p.code} の商品が1件でない（${ids.join("、") || "0件"}）`);
    return ids[0];
  }

  /** 商品マスターの商品詳細（商品登録編集画面）で、付いているタグの名称がちょうど names であることを確かめる */
  async expectProductTags(商品ID: string, names: string[]): Promise<void> {
    await openProductEdit(this.page, 商品ID);
    const got = await assignedTagNames(this.page);
    if (JSON.stringify(got) !== JSON.stringify(names)) {
      throw new Error(`${this.seedId}: 商品ID ${商品ID} の商品詳細のタグが「${got.join("、") || "なし"}」（「${names.join("、") || "なし"}」のはず）`);
    }
  }
}

function defineProductSeed(seedId: string, build: (o: SeedOps) => Promise<void>): void {
  defineSeed(seedId, { needs: ["S-M03-28-MASTER"] }, async ({ browser, notes }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      await build(new SeedOps(page, seedId, notes));
    });
  });
}

const A = "〔タグID-M0328-共有A〕";
const B = "〔タグID-M0328-共有B〕";
const C = "〔タグID-M0328-共有C〕";

/**
 * 1商品・1ファイルの形（008・009・010・030・031・047・048）。
 * 商品を作って控え、商品詳細のタグを確かめ、取込ファイル（見出し＋「控えた商品ID」「タグIDの並び」の1行）を作る。
 */
function defineOneProductSeed(seedId: string, args: {
  label: string; product: Omit<Product, "tags">; tags: string[];
  file: string; fileTags: string[]; checkHistory: boolean;
}): void {
  defineProductSeed(seedId, async (o) => {
    expectFileNamed(seedId, args.file);
    const tagIds = args.tags.map((l) => o.notes.get(l));
    const id = await o.createProduct({ ...args.product, tags: tagIds });
    o.notes.set(args.label, id);
    await o.expectProductTags(id, args.tags.map((l) => TAG_NAME[l]));
    const header = await templateHeader(o.page);
    writeCsv(args.file, [header, [id, args.fileTags.map((l) => o.notes.get(l)).join(",")]]);
    if (args.checkHistory) await expectNoHistoryNamed(o.page, seedId, args.file);
  });
}

defineOneProductSeed("S-M03-28-CASE-008", {
  label: "〔商品ID-M0328-008〕", tags: [A], file: "replace-008.csv", fileTags: [B, C], checkHistory: true,
  product: { code: "M0328-008", nameJp: "M0328試験商品008", nameEn: "M0328 Test Product 008", 公開: "1" },
});
defineOneProductSeed("S-M03-28-CASE-009", {
  label: "〔商品ID-M0328-009〕", tags: [A], file: "clear-009.csv", fileTags: [], checkHistory: true,
  product: { code: "M0328-009", nameJp: "M0328試験商品009", nameEn: "M0328 Test Product 009", 公開: "1" },
});
defineOneProductSeed("S-M03-28-CASE-010", {
  label: "〔商品ID-M0328-010〕", tags: [A], file: "discontinued-010.csv", fileTags: [B], checkHistory: true,
  product: { code: "M0328-010", nameJp: "M0328試験商品010", nameEn: "M0328 Test Product 010", 公開: "3" },
});
defineOneProductSeed("S-M03-28-CASE-030", {
  label: "〔商品ID-M0328-030〕", tags: [A], file: "history-success-030.csv", fileTags: [B], checkHistory: true,
  product: { code: "M0328-030", nameJp: "M0328試験商品030", nameEn: "M0328 Test Product 030", 公開: "1" },
});
defineOneProductSeed("S-M03-28-CASE-031", {
  label: "〔商品ID-M0328-031〕", tags: [A], file: "history-success-031.csv", fileTags: [B], checkHistory: true,
  product: { code: "M0328-031", nameJp: "M0328試験商品031", nameEn: "M0328 Test Product 031", 公開: "1" },
});
// 047: タグ(ID)を空で登録し、商品詳細でタグが1件も付いていないことを確かめる
defineOneProductSeed("S-M03-28-NOTAG-047", {
  label: "〔商品ID-M0328-047〕", tags: [], file: "tag-none-M0328-047.csv", fileTags: [B, C], checkHistory: false,
  product: { code: "M0328-047", nameJp: "M0328-047試験商品", nameEn: "M0328-047-Test", 公開: "1" },
});
defineOneProductSeed("S-M03-28-CB1ROW-048", {
  label: "〔商品ID-M0328-CB048〕", tags: [A], file: "cb1row-M0328-048.csv", fileTags: [B, C], checkHistory: false,
  product: { code: "M0328-CB048", nameJp: "M0328-CB048試験商品", nameEn: "M0328-CB048-Test", 公開: "1" },
});

// 049: 同じ商品IDの行が2行（1行目はタグB、2行目はタグC）
defineProductSeed("S-M03-28-CBMULTI-049", async (o) => {
  const file = "cbmulti-M0328-049.csv";
  expectFileNamed(o.seedId, file);
  const id = await o.createProduct({ code: "M0328-CB049", nameJp: "M0328-CB049試験商品", nameEn: "M0328-CB049-Test", 公開: "1", tags: [o.notes.get(A)] });
  o.notes.set("〔商品ID-M0328-CB049〕", id);
  await o.expectProductTags(id, [TAG_NAME[A]]);
  const header = await templateHeader(o.page);
  writeCsv(file, [header, [id, o.notes.get(B)], [id, o.notes.get(C)]]);
});

// 019: 2商品。1行目〔019A〕・タグB、2行目 未登録の商品ID 999999019・タグB、3行目〔019B〕・未登録のタグID 999998019
defineProductSeed("S-M03-28-CASE-019", async (o) => {
  const file = "rollback-019.csv";
  expectFileNamed(o.seedId, file);
  const a = await o.createProduct({ code: "M0328-019A", nameJp: "M0328試験商品019A", nameEn: "M0328 Test Product 019A", 公開: "1", tags: [o.notes.get(A)] });
  o.notes.set("〔商品ID-M0328-019A〕", a);
  const b = await o.createProduct({ code: "M0328-019B", nameJp: "M0328試験商品019B", nameEn: "M0328 Test Product 019B", 公開: "1", tags: [o.notes.get(A)] });
  o.notes.set("〔商品ID-M0328-019B〕", b);
  for (const id of [a, b]) await o.expectProductTags(id, [TAG_NAME[A]]);
  await expectNoProductWithId(o.page, "999999019", o.seedId);
  const tagRows = await allTagRows(o.page);
  if (tagRows.some((r) => r.ID === "999998019")) throw new Error(`${o.seedId}: タグ登録画面の一覧に ID 999998019 のタグがある（未登録のはず）`);
  const header = await templateHeader(o.page);
  writeCsv(file, [header, [a, o.notes.get(B)], ["999999019", o.notes.get(B)], [b, "999998019"]]);
});

// ---- 正本が全バイトを決める取込ファイル（e2e/fixtures/m03-28） ----

/** 「2列の正規見出しに対してデータ「…」「282」「1」の3列」 */
function defineFixtureSeed(seedId: string, file: string, productId: string): void {
  defineSeed(seedId, async () => {
    expectFileNamed(seedId, file);
    const text = getSeed(seedId)["状態・属性"];
    for (const v of [productId, "282", "1"]) if (!text.includes(`「${v}」`)) throw new Error(`${seedId}: シード表の状態・属性に値「${v}」が無い`);
    const want = `${csvLine(["商品ID", "商品タグ(ID)"])}\n${csvLine([productId, "282", "1"])}\n`;
    const p = m0328CsvPath(file);
    if (!fs.existsSync(p)) throw new Error(`${seedId}: CSVファイル ${p} が無い`);
    if (fs.readFileSync(p, "utf-8") !== want) throw new Error(`${seedId}: CSVファイル ${p} の中身がシード表と違う`);
  });
}
defineFixtureSeed("S-M03-28-CASE-027", "wrong-columns-027.csv", "28001027");
defineFixtureSeed("S-M03-28-CASE-028", "wrong-columns-028.csv", "28001028");
