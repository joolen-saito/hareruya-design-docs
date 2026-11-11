/**
 * M03-13 タグ登録/編集の続き（-x）のシード。仕分け直し（review/not_runnable_recheck_cases2.tsv）で流せる見込みになったもの。
 * 正本: cases/M03-13_seed_data.tsv。型は seeds/m03-13.ts と同じ（タグ登録/編集画面を編集対象を指定せずに開いて登録し、登録後の編集画面のアドレスの末尾からタグIDを控える）。
 *
 * シードでの解釈（正本の外の補い。記録 review/M03-13_progress_2026-11-11_dev.md にも書く）:
 * - 「タグ一覧は記載のタグだけ」（LIST-002・BASE-005・BASE-006・LIST-034・FREEJp-045・FREEEn-046・ORDER-047）: 正本の作り方は、既存のタグを DB で退避して
 *   0件にし、終わったら戻す。開発環境のタグはほかの方のもので、退避・削除をしない。記載のタグを画面で登録し、ほかのタグが一覧に残ったまま確かめる
 *   （047 は3件の相対の並びで確かめる）。シード作成時の問題として毎回出す。
 * - 商品コード（TAG-A-001 など）は、決め打ちの値に実行の印を付けて作る（lib/run_marker.ts。手順・期待結果の同じ値も同じ印の値として読む）。
 *   未登録の規格コード UNKNOWN-999 は印を付けず、DB の参照で無いことを確かめる（あれば、ほかの方の規格なので消さずに止める）。
 * - DEL-001 の規格の削除済みは、画面で指定できない（有効な規格が1件だけの商品の規格は削除できない）ので、E2E が作った規格だけに DB で設定する（lib/db_write.ts）。
 * - 共有商品に付いているタグは、正本ではグッズ商品CSV出力のタグ(ID)列で確かめる。ここでは DB の参照で読んだ（同じ値）。
 * - 028 の「名称(日)=新規優先タグまたは名称(英)=NewPriorityTag のタグは0件」は、名称に実行の印を付けて、0件を DB の参照で確かめる
 *   （タグを削除する画面が無く、印の無い名称では前の実行のタグに当たる）。
 */
import fs from "node:fs";
import path from "node:path";
import { Page } from "@playwright/test";
import { SETUP_ADMIN, STATE_DIR } from "../config/env";
import { 規格の番号, 規格を削除済みにする, 規格が削除済みか, 商品のタグ, タグがあるか, 名称が一致するタグ } from "../db/m03_13_x";
import { csvLine, decodeCsvBytes, parseCsv } from "../lib/csv";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { 使い回して作る } from "./seed_reuse";
import { withAdminSession } from "../lib/session";
import { expectSaved } from "../pages/admin/common";
import { readGoodsProductId } from "../pages/admin/m03_01_goods_list_seed";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { TagInput, TagPage } from "../pages/admin/m03_13_tag";
import { downloadedBytes } from "../pages/admin/m03_21_shelf_number";
import { ProductTagCsvUploadPage } from "../pages/admin/m03_28_product_tag_csv_upload";

/** 一覧の全件を1ページに出す表示件数（画面の件数欄の最大） */
export const ALL = "12000";

/** 正本の規格コードに実行の印を付けた値（共有商品 A〜E の順） */
export const 共有の規格コード = {
  A: rc("TAG-A-001"), B: rc("TAG-A-002"), C: rc("TAG-A-003"), D: rc("NOTAG-001"), E: rc("DEL-001"),
} as const;
export type 共有 = keyof typeof 共有の規格コード;
/** 未登録の規格コード（印を付けない） */
export const 未登録の規格コード = "UNKNOWN-999";
/** 各ケースの旧の規格コード（OLD-001-020 など。印つき） */
export const 旧の規格コード = (n: string): string => rc(n === "053" ? "OLD-M0313-053" : `OLD-001-${n}`);
/** 028 で手順が登録する名称（印つき） */
export const 新規優先タグ = { 名称日: rc("新規優先タグ"), 名称英: rc("NewPriorityTag") };

const 共有の呼び名 = (k: 共有) => `〔商品ID-M0313-共有${k}〕`;
const label = (suffix: string) => `〔タグID-M0313-${suffix}〕`;
const 商品名 = (code: string) => `M0313優先表示試験商品 ${code}`;

const 退避しない = "正本の作り方は、既存のタグを DB で退避してタグ一覧を記載のタグだけにする。開発環境のタグはほかの方のものなので退避・削除をせず、"
  + "記載のタグを画面で登録して、ほかのタグが一覧に残ったまま確かめる（正本の外の補い）";

class Ops {
  readonly tag: TagPage;
  constructor(readonly page: Page, readonly seedId: string, readonly notes: Notes) { this.tag = new TagPage(page); }
  readonly warn = (w: string) => reportSeedIssue(this.seedId, w);

  /** 編集対象を指定せずに開き、名称(日)・名称(英)・並び順を入れ、「その他の設定」は空のまま登録する。タグIDを控えて返す */
  async fresh(呼び名: string, v: TagInput): Promise<string> {
    await this.tag.openNew();
    const id = await this.tag.register(v, `${this.seedId}: 名称(日)「${v.名称日}」のタグの登録`);
    this.notes.set(呼び名, id);
    return id;
  }

  /** 一覧の全件を1ページに出して、タグIDの行の編集ボタンを押し、「その他の設定」を開いて優先表示商品を入れて登録する */
  async setPriority(タグID: string, 規格コード: string[]): Promise<void> {
    await this.tag.showFirstPageWith(ALL);
    await this.tag.pressEdit(タグID);
    await this.tag.openOtherSettings();
    await this.tag.fill({ 優先表示商品: 規格コード.join("\n") });
    const r = await this.tag.pressRegister();
    if (!r.sent) throw new Error(`${this.seedId}: 優先表示商品の登録が、ブラウザの入力チェックで止まった（${r.止めた項目.join(" / ")}）`);
    for (const w of await expectSaved(this.page, `${this.seedId}: タグID ${タグID} の優先表示商品「${規格コード.join("、")}」の登録`)) this.warn(w);
  }

  /** グッズ商品CSV登録で、タグ(ID)を入れた商品を作り、商品マスターの検索で商品IDを読む */
  async createProducts(codes: string[], タグID: string): Promise<string[]> {
    for (const code of codes) {
      if (規格の番号(code).length) throw new Error(`${this.seedId}: 商品コード ${code} の規格が既にある（実行の印つきの値なので、同じ実行で二度作ろうとしている）`);
    }
    await registerGoodsCsv(this.page, {
      what: `${this.seedId} のグッズ商品CSV登録`, fileName: `${this.seedId.toLowerCase()}-goods.csv`, categoryId: "2",
      lines: codes.map((code) => ({ code, nameJp: 商品名(code), nameEn: `M0313 priority test ${code}` })),
      common: { "タグ(ID)": タグID }, onWarning: this.warn,
    });
    const ids: string[] = [];
    for (const code of codes) ids.push(await readGoodsProductId(this.page, code, 商品名(code)));
    return ids;
  }

  /**
   * 商品タグ更新CSV登録で、共有商品にタグを足す（すでに付いているタグも並べる。この取込は商品のタグを置き換える）。
   * 取込のあと、DB の参照で、前のタグが残り、足したタグが付いたことを確かめる。
   */
  async addTagToShared(keys: 共有[], タグID: string): Promise<void> {
    const upload = new ProductTagCsvUploadPage(this.page);
    await upload.open();
    const header = parseCsv(decodeCsvBytes(await downloadedBytes(await upload.downloadTemplate())));
    if (header.length !== 1) throw new Error(`${this.seedId}: 商品タグ更新CSVの雛形が見出し1行でない`);
    const before = new Map<string, string[]>();
    const rows: string[][] = [header[0]];
    for (const k of keys) {
      const id = this.notes.get(共有の呼び名(k));
      const tags = 商品のタグ(id);
      before.set(id, tags);
      rows.push([id, [...tags, タグID].join(",")]);
    }
    const dir = path.join(STATE_DIR, "m03-13-x");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${this.seedId.toLowerCase()}-tags.csv`);
    fs.writeFileSync(file, rows.map((r) => csvLine(r)).join("\n") + "\n", "utf-8");
    await upload.open();
    await upload.choose(file);
    const r = await upload.submit();
    if (!r.sent) throw new Error(`${this.seedId}: 商品タグ更新CSVの取込が、ブラウザの入力チェックで止まった（${r.止めた項目.join(" / ")}）`);
    for (const [id, tags] of before) {
      const after = 商品のタグ(id);
      const want = [...new Set([...tags, タグID])].sort((a, b) => Number(a) - Number(b));
      if (JSON.stringify(after) !== JSON.stringify(want)) {
        throw new Error(`${this.seedId}: 商品ID ${id} のタグが ${after.join(",") || "なし"}（${want.join(",")} のはず）。商品タグ更新CSVの取込が反映されていない`);
      }
    }
  }
}

function defineOps(seedId: string, needs: string[], build: (o: Ops) => Promise<void>): void {
  defineSeed(seedId, { needs }, async ({ browser, notes, seed }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      await build(new Ops(page, seed.シードID, notes));
    });
  });
}

// ---- タグ一覧を記載のタグだけにする形（退避はしない） ----

const 編集前: TagInput = { 名称日: "編集前タグ", 名称英: "BeforeTag", 並び順: "10" };
/**
 * 使い回し（依頼者決定 2026-11-11「シードの使い回しを進めて」）: 002・005・034 のシードは中身が同じ（名称・並び順が同じタグ1件）。
 * 使うケースは一覧を見る・編集ボタンを押して編集欄を見るだけで、タグを変えない（登録を押さない）ので、1回の起動で 002 のタグを1つだけ作って使い回す。
 */
for (const [seedId, n] of [["S-M03-13-LIST-002", "002"], ["S-M03-13-BASE-005", "005"], ["S-M03-13-LIST-034", "034"]] as const) {
  defineSeed(seedId, async ({ browser, notes }) => {
    reportSeedIssue(seedId, 退避しない);
    await 使い回して作る({
      seedId, canonical: "S-M03-13-LIST-002", notes,
      rename: (l) => l.replace(label("002"), label(n)),
      build: (nn) => withAdminSession(browser, SETUP_ADMIN, async (page) => {
        page.setDefaultTimeout(60_000);
        await new Ops(page, "S-M03-13-LIST-002", nn).fresh(label("002"), 編集前);
      }),
    });
  });
}
defineOps("S-M03-13-BASE-006", [], async (o) => {
  o.warn(退避しない);
  // 正本: 一覧にタグID 999999 の行が無いこと（退避して0件にしてあるので未登録）。退避しないので、DB の参照でタグID 999999 が無いことを確かめる
  if (タグがあるか("999999")) throw new Error(`${o.seedId}: タグID 999999 のタグがある（ほかの方のタグなので消さずに止める）`);
  await o.fresh(label("006"), 編集前);
});
defineOps("S-M03-13-FREEJp-045", [], async (o) => {
  o.warn(退避しない);
  await o.fresh(label("045"), { 名称日: "フリーエリア日本語タグM0313-045-A", 名称英: "FreeAreaJpM0313-045-A", 並び順: "10" });
});
defineOps("S-M03-13-FREEEn-046", [], async (o) => {
  o.warn(退避しない);
  await o.fresh(label("046"), { 名称日: "フリーエリア英語タグM0313-046-A", 名称英: "FreeAreaEnM0313-046-A", 並び順: "10" });
});
defineOps("S-M03-13-ORDER-047", [], async (o) => {
  o.warn(`${退避しない}。並びは、一覧の中の3件の上下の順で確かめる`);
  // A・B・C の順に登録する（タグIDもこの順に大きくなる）
  const a = await o.fresh(label("047A"), { 名称日: "並び順確認M0313-047-A", 名称英: "OrderM0313-047-A", 並び順: "30" });
  const b = await o.fresh(label("047B"), { 名称日: "並び順確認M0313-047-B", 名称英: "OrderM0313-047-B", 並び順: "10" });
  const c = await o.fresh(label("047C"), { 名称日: "並び順確認M0313-047-C", 名称英: "OrderM0313-047-C", 並び順: "20" });
  if (!(Number(a) < Number(b) && Number(b) < Number(c))) throw new Error(`${o.seedId}: タグIDが登録の順に大きくならない（A ${a}・B ${b}・C ${c}）`);
});

// ---- 優先表示の形 ----

defineOps("S-M03-13-PRIORITY-CODES", [], async (o) => {
  // 未登録の規格コードは印を付けないので、ほかの方の規格に当たらないことを DB の参照で確かめる（正本の作り方は、あれば DB で削除）
  if (規格の番号(未登録の規格コード).length) throw new Error(`${o.seedId}: 規格コード ${未登録の規格コード} の規格がある（ほかの方の規格なので消さずに止める）`);
  const keys = Object.keys(共有の規格コード) as 共有[];
  const ids = await o.createProducts(keys.map((k) => 共有の規格コード[k]), "");
  keys.forEach((k, i) => o.notes.set(共有の呼び名(k), ids[i]));
  // DEL-001 の規格を削除済みにする（画面で指定できない。E2E が作った規格だけ）
  規格を削除済みにする(o.seedId, 共有の規格コード.E);
  if (!規格が削除済みか(共有の規格コード.E)) throw new Error(`${o.seedId}: 規格コード ${共有の規格コード.E} の規格が削除済みにならない`);
});

type 優先の定め = {
  n: string; 名称日?: string; 名称英?: string;
  /** 旧の規格コード（OLD-001-0xx）の商品を作り、優先表示商品に入れる */
  旧?: boolean;
  /** このタグを付ける共有商品 */
  共有: 共有[];
  /** 優先表示商品に入れる共有商品（旧の代わり。055） */
  優先の共有?: 共有[];
};
const 優先の定め: 優先の定め[] = [
  { n: "020", 旧: true, 共有: ["A", "B", "C"] },
  { n: "021", 旧: true, 共有: ["A", "B"] },
  { n: "022", 旧: true, 共有: ["A", "B"] },
  { n: "023", 名称日: "優先表示試験タグ-023", 旧: true, 共有: [] },
  { n: "024", 旧: true, 共有: [] },
  { n: "025", 旧: true, 共有: [] },
  { n: "026", 名称日: "優先表示試験タグ-026", 旧: true, 共有: [] },
  { n: "027", 名称日: "優先表示試験タグ-027", 旧: true, 共有: ["E"] },
  { n: "028", 名称日: "既存優先表示タグ", 共有: ["A"] },
  { n: "042", 旧: true, 共有: ["A", "B", "C"] },
  { n: "051", 名称日: "優先表示1件タグ-M0313-051", 名称英: "PriorityOne-M0313-051", 共有: ["A"] },
  { n: "053", 名称日: "混在コード更新前タグ-M0313-053", 名称英: "PriorityMixed-M0313-053", 旧: true, 共有: ["A"] },
  { n: "055", 名称日: "同コード重ね保存タグ-M0313-055", 名称英: "PriorityTwice-M0313-055", 共有: ["A", "B"], 優先の共有: ["A", "B"] },
];

for (const d of 優先の定め) {
  defineOps(`S-M03-13-PRIORITY-${d.n}`, ["S-M03-13-PRIORITY-CODES"], async (o) => {
    // ① タグを登録し、タグIDを控える
    const tagId = await o.fresh(label(d.n), { 名称日: d.名称日 ?? "優先表示試験タグ", 名称英: d.名称英 ?? "PriorityTag", 並び順: "20" });
    // ② 旧の規格コードの商品を、タグ(ID)にこのタグを入れたグッズ商品CSVで作り、商品IDを控える
    if (d.旧) {
      const [id] = await o.createProducts([旧の規格コード(d.n)], tagId);
      o.notes.set(`〔商品ID-M0313-${d.n}〕`, id);
    }
    // ③ 共有商品に、商品タグ更新CSVでこのタグを足す
    if (d.共有.length) await o.addTagToShared(d.共有, tagId);
    // ④ 優先表示商品を入れて登録する
    const 優先 = d.旧 ? [旧の規格コード(d.n)] : (d.優先の共有 ?? []).map((k) => 共有の規格コード[k]);
    if (優先.length) await o.setPriority(tagId, 優先);
    if (d.n === "028") {
      // 手順が登録する名称のタグが0件（名称に実行の印を付けたので、前の実行のタグには当たらない）
      const hit = 名称が一致するタグ(新規優先タグ.名称日, 新規優先タグ.名称英);
      if (hit.length) throw new Error(`${o.seedId}: 名称(日)「${新規優先タグ.名称日}」または名称(英)「${新規優先タグ.名称英}」のタグがある（タグID ${hit.join("、")}）`);
      o.warn(`手順で登録する名称（新規優先タグ・NewPriorityTag）に実行の印を付けた（${新規優先タグ.名称日}・${新規優先タグ.名称英}）。タグを削除する画面が無く、印の無い名称では前の実行のタグに当たるため`);
    }
  });
}
