/**
 * M03-31 セール用価格変更CSV登録の画面シード。正本: cases/M03-31_seed_data.tsv
 *
 * 作るのは、実装したケースが使うシードだけ。
 * - S-M03-31-ADM: メンバー管理で試験管理者を登録する（M03-29 と同じ作り方。所属店舗は選択肢の先頭、権限はシステム管理者）。
 * - S-M03-31-MASTERS: タグ登録画面でタグ3件（更新前タグ・更新後タグA・更新後タグB）を登録し、一覧のIDを控える（あれば使う）。
 *   投入方法の「言語ID=1（日本語）の登録は…DBへ直接設定する」は行わず（DBへ書かない決まり）、言語ID=1 が既にあることを
 *   商品規格の登録画面の言語の欄で確かめるだけにする。シード表の作り方と違うので、これを使うケースは「条件付き合格」に分ける。
 * - S-M03-31-FILE-027: 画像ファイル unsupported.png（1×1 の PNG）。正本は画像の中身を書かない。依頼者決定（2026-10-16）
 *   「画像は任意の有効な画像でよい」に従う。
 * - S-M03-31-DATA-*: グッズ商品CSV登録で作る商品（固定の商品コード M0331-<番号>）と、取込ファイル。
 *
 * 取込ファイルの見出しは、投入方法の「設計書の7列」= 設計書 L0164〜L0173 の「商品ID」「言語ID」「販売価格」「買取価格」「セールフラグ」
 * 「帯URL」「タグ(ID)」（S-M03-31-QC-* の投入方法が書く見出しと同じ）。値は状態・属性のとおり（空と書かれた欄は空）。
 * UTF-8（053 だけ Shift_JIS）・カンマ区切り（052 だけタブ区切り）・改行は LF・末尾に改行1個（fixtures の README と同じ決め方）。
 * ファイルは実行のたびに e2e/.state/m03-31/<ケース番号>/ に作る（ファイル名は正本どおり。取込履歴にファイル名が残る）。
 *
 * グッズ商品CSV登録の行で正本が書かない必須の列（商品名(日)・商品名(英)・サイズ・重量・商品カテゴリ(ID)・購入グループ名称・支店の商品公開ステータス）は、
 * 投入方法の「そのほかの必須の列に有効な値」として、商品名を「M0331試験商品<番号>」、サイズ・重量を 1、カテゴリと購入グループを既存のもの
 * （pages/admin/m03_01_goods_register.ts の registerGoodsCsv の決め方）にする。商品公開ステータスは、投入方法の「2（公開）」の意図（公開）に従い、
 * 画面の説明で「公開」に当たる値（1）にする（画面の説明は 1:公開 2:非公開 3:廃止）。
 *
 * 作らないシード（使うケースも実装しない。理由は e2e/review/M03-31_progress_2026-10-21.md）。
 */
import fs from "node:fs";
import path from "node:path";
import { Browser, expect, Page } from "@playwright/test";
import { SETUP_ADMIN, STATE_DIR } from "../config/env";
import { getSeed } from "../lib/catalog";
import { csvLine } from "../lib/csv";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { ensureMember } from "../pages/admin/member";
import { readLanguageChoicesFromClassForm } from "../pages/admin/m03_01_product_class";
import { TagPage } from "../pages/admin/m03_13_tag";
import { PriceCsvUploadPage } from "../pages/admin/m03_30_price_csv";
import {
  addClass, deleteClassOnEdit, displayedClassId, expectNoProductWithId, openClassEdit, openClassList,
  openClassListByCode, registerGoodsProduct, saveClassEdits,
} from "../pages/admin/m03_30_products";

export const M0331_ADMIN: Account = { loginId: "m0331_admin", password: "Passw0rd!M0331" };

/** 設計書の7列（L0164〜L0173） */
export const M0331_COLUMNS = ["商品ID", "言語ID", "販売価格", "買取価格", "セールフラグ", "帯URL", "タグ(ID)"];

/** 帯URLの値（正本の値） */
export const BELT = {
  before: "https://replace-dev.hareruyamtg.com:8443/before",
  sale: "https://replace-dev.hareruyamtg.com:8443/sale",
  of: (no: string) => `https://replace-dev.hareruyamtg.com:8443/m0331-${no}`,
  len128: "https://replace-dev.hareruyamtg.com:8443/" + "a".repeat(87),
  len129: "https://replace-dev.hareruyamtg.com:8443/" + "a".repeat(88),
};

const RUNTIME_DIR = path.join(STATE_DIR, "m03-31");

/** ケースが選ぶ取込ファイルの場所（シードが実行のたびに作る） */
export function m0331FilePath(caseNo: string, file: string): string {
  return path.join(RUNTIME_DIR, caseNo, file);
}

// ---- 管理者・マスタ ----

async function createAdmin(page: Page): Promise<void> {
  await page.goto(adminUrl("/setting/system/member/new"));
  const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((options) => options
    .map((option) => option as HTMLOptionElement)
    .filter((option) => option.value !== "")
    .map((option) => option.textContent?.trim() ?? "")
    .filter(Boolean));
  if (stores.length === 0) throw new Error("S-M03-31-ADM: メンバーに割り当てられる店舗が画面に無い");
  const store = stores[0];
  await ensureMember(page, {
    名前: "M03-31試験管理者", 所属店舗: store, ログインID: M0331_ADMIN.loginId, メールアドレス: "m0331_admin@example.test",
    パスワード: M0331_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: store, 編集可能店舗: [store],
  });
}

defineSeed("S-M03-31-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page));
  // ログインでき（稼働中・ロックなし）、セール用価格変更CSVアップロード画面を開けることを、ケースとは別のセッションで確かめる
  await withAdminSession(browser, M0331_ADMIN, async (page) => {
    const upload = new PriceCsvUploadPage(page, "セール用価格変更");
    await upload.open();
    await expect(upload.アップロードボタン, "M03-31試験管理者でセール用価格変更CSVアップロード画面を開けない").toBeVisible();
  });
});

const SHARED_TAGS = [
  { label: "〔タグID-M0331-共有A〕", 名称日: "更新前タグ", 名称英: "M0331 tag before", 並び順: "1" },
  { label: "〔タグID-M0331-共有B〕", 名称日: "更新後タグA", 名称英: "M0331 tag after A", 並び順: "2" },
  { label: "〔タグID-M0331-共有C〕", 名称日: "更新後タグB", 名称英: "M0331 tag after B", 並び順: "3" },
];

/** タグ登録画面の一覧（表示件数を最大にした1ページ目）の行 */
async function allTagRows(tag: TagPage) {
  await tag.showFirstPageWith("12000");
  return tag.allRows();
}

defineSeed("S-M03-31-MASTERS", async ({ browser, seed, notes }) => {
  const id = seed.シードID;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const tag = new TagPage(page);
    for (const t of SHARED_TAGS) {
      const same = (await allTagRows(tag)).filter((r) => r.名称日 === t.名称日);
      if (same.length > 1) throw new Error(`${id}: 名称(日)「${t.名称日}」のタグが ${same.length} 件ある。どれを使うか決められない`);
      if (same.length === 1) {
        if (same[0].名称英 !== t.名称英 || same[0].並び順 !== t.並び順) {
          throw new Error(`${id}: 名称(日)「${t.名称日}」のタグはあるが、内容がシード表と違う: ${JSON.stringify(same[0])}`);
        }
        continue;
      }
      await tag.openNew();
      await tag.register({ 名称日: t.名称日, 名称英: t.名称英, 並び順: t.並び順 }, `${id}: タグ「${t.名称日}」の登録`);
    }
    // 一覧の行のID欄に表示された番号を控える
    const rows = await allTagRows(tag);
    for (const t of SHARED_TAGS) {
      const hit = rows.filter((r) => r.名称日 === t.名称日);
      if (hit.length !== 1 || !/^\d+$/.test(hit[0].ID)) throw new Error(`${id}: タグ登録画面の一覧で「${t.名称日}」の行のIDを一意に読めない: ${JSON.stringify(hit)}`);
      notes.set(t.label, hit[0].ID);
    }
    const languages = await readLanguageChoicesFromClassForm(page);
    const one = languages.filter((l) => l.id === "1");
    if (one.length !== 1 || one[0].label !== "日本語") throw new Error(`${id}: 商品規格の登録画面の言語の欄に、値1の「日本語」が無い: ${JSON.stringify(languages)}`);
  });
  reportSeedIssue(id, "投入方法の「言語ID=1（日本語）の登録は…DBへ直接設定する」は行わず（DBへ書かない決まり）、言語ID=1（日本語）が既にあることを商品規格の登録画面の言語の欄で確かめた");
});

// ---- 027: 画像ファイル ----

/** 1×1 の PNG（有効な画像）。正本は画像の中身を書かない（依頼者決定 2026-10-16「画像は任意の有効な画像でよい」） */
const PNG_1X1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

defineSeed("S-M03-31-FILE-027", async ({ seed }) => {
  if (!seed["状態・属性"].includes("unsupported.png")) throw new Error(`${seed.シードID}: シード表にファイル名 unsupported.png が無い`);
  const dir = path.join(RUNTIME_DIR, "027");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "unsupported.png"), PNG_1X1);
});

// ---- 取込ファイル ----

type FileFormat = "csv" | "tsv" | "sjis-csv";

/** 「商品ID」〜「タグ(ID)」の7列の値。〔…〕の呼び名は控えた番号に置き換える */
type Row7 = [string, string, string, string, string, string, string];

/** Shift_JIS の見出し行（「商品ID,言語ID,販売価格,買取価格,セールフラグ,帯URL,タグ(ID)」を Shift_JIS にしたバイト列） */
const SJIS_HEADER = Buffer.from("8fa4956949442c8cbe8cea49442c94cc948489bf8a692c94838ee689bf8a692c835a815b838b83748389834f2c91d155524c2c835e834f28494429", "hex");

/**
 * 取込ファイルを作る。値は、正本の状態・属性に書かれていること（呼び名・空でない値）を確かめてから、呼び名を控えた番号に置き換える。
 */
function writeImportFile(seedId: string, caseNo: string, file: string, format: FileFormat, rows: Row7[], notes: Notes): void {
  const attrs = getSeed(seedId)["状態・属性"];
  if (!attrs.includes(file)) throw new Error(`${seedId}: シード表の状態・属性にファイル名 ${file} が無い`);
  for (const row of rows) for (const v of row) {
    // 128・129文字の帯URLは、状態・属性が「…/」に英字aを87（88）文字連結」と書く
    if (v === BELT.len128 || v === BELT.len129) {
      const n = v.length - "https://replace-dev.hareruyamtg.com:8443/".length;
      if (!attrs.includes(`「https://replace-dev.hareruyamtg.com:8443/」に英字aを${n}文字連結した全${v.length}文字`)) throw new Error(`${seedId}: シード表の状態・属性に${v.length}文字の帯URLの作り方が無い`);
      continue;
    }
    for (const part of v.split(",")) if (part && !attrs.includes(part)) throw new Error(`${seedId}: シード表の状態・属性に値「${part}」が無い`);
  }
  const resolve = (v: string) => v.replace(/〔[^〕]+〕/g, (l) => notes.get(l));
  const data = rows.map((r) => r.map(resolve));
  const dir = path.join(RUNTIME_DIR, caseNo);
  fs.mkdirSync(dir, { recursive: true });
  let bytes: Buffer;
  if (format === "tsv") {
    bytes = Buffer.from([M0331_COLUMNS, ...data].map((r) => r.join("\t")).join("\n") + "\n", "utf-8");
  } else if (format === "sjis-csv") {
    if (new TextDecoder("shift_jis").decode(SJIS_HEADER) !== M0331_COLUMNS.join(",")) throw new Error(`${seedId}: Shift_JIS の見出し行のバイト列が見出しと合わない`);
    for (const r of data) for (const v of r) if (!/^[\x20-\x7e]*$/.test(v)) throw new Error(`${seedId}: Shift_JIS のデータ行に ASCII 以外の値がある（このシードは ASCII の値だけを書く作り）`);
    bytes = Buffer.concat([SJIS_HEADER, Buffer.from("\n" + data.map((r) => csvLine(r)).join("\n") + "\n", "ascii")]);
  } else {
    bytes = Buffer.from([M0331_COLUMNS, ...data].map((r) => csvLine(r)).join("\n") + "\n", "utf-8");
  }
  fs.writeFileSync(path.join(dir, file), bytes);
}

// ---- グッズ商品CSV登録で作る商品 ----

type Issue = (m: string) => void;

/**
 * 正本の共通の作り方: グッズ商品CSV登録で、商品IDを空、商品コード、言語(ID)=1、商品公開ステータス=公開、基準価格2000・販売価格2000・買取価格500、
 * タグ(ID)（空か〔タグID-M0331-共有A〕）の1行を登録し、商品マスターの検索で商品コードを入れて検索し、結果の行の商品IDを控え、
 * その行の商品名を押して商品登録編集画面を開き、規格設定で商品規格一覧を開き、行の編集で商品規格登録編集画面を開いて商品規格IDを控える。
 * 商品規格登録編集画面を開いた状態で終わる。
 */
async function goodsProductWithOneClass(page: Page, a: {
  seedId: string; no: string; code: string; tagId: string; onIssue: Issue;
}): Promise<{ productId: string; classId: string }> {
  const name = `M0331試験商品${a.no}`;
  a.onIssue(`${a.seedId}: グッズ商品CSV登録の行で正本が書かない必須の列は、商品名(日)・(英)を「${name}」、サイズ・重量を1にした（正本: そのほかの必須の列に有効な値）。商品公開ステータスは、正本の「2（公開）」の意図（公開）に従い、画面の説明で公開に当たる値にした`);
  await registerGoodsProduct(page, {
    what: a.seedId, code: a.code, nameJp: name, nameEn: name,
    values: { "言語(ID)": "1", "サイズ": "1", "重量": "1", "基準価格": "2000", "販売価格": "2000", "買取価格": "500", "タグ(ID)": a.tagId },
    onIssue: a.onIssue,
  });
  const { productId, rows } = await openClassListByCode(page, a.code);
  if (rows.length !== 1 || rows[0].商品コード !== a.code || rows[0].状態 !== "NM") {
    throw new Error(`${a.seedId}: 商品規格一覧の行が、商品コード ${a.code}・NM の1件でない: ${JSON.stringify(rows)}`);
  }
  await openClassEdit(page, productId, rows[0].商品規格ID);
  return { productId, classId: await displayedClassId(page) };
}

type SingleSpec = {
  no: string; tagA?: boolean; edit?: { 帯URL?: string; セール販売価格?: string };
  file: string; format: FileFormat; row: (p: string) => Row7;
  /** 投入方法の追加の確かめ（タグ登録画面の一覧で、あるIDの行が無いこと） */
  noTagId?: string;
};

const P = (no: string) => `〔商品ID-M0331-${no}〕`;
const TAG_A = "〔タグID-M0331-共有A〕";
const TAG_B = "〔タグID-M0331-共有B〕";
const TAG_C = "〔タグID-M0331-共有C〕";

/** 状態・属性のとおりの取込ファイルの行（p は商品IDの呼び名） */
const SINGLE: SingleSpec[] = [
  { no: "013", tagA: true, file: "tag-replace-013.csv", format: "csv", row: (p) => [p, "1", "2000", "500", "0", "", `${TAG_B},${TAG_C}`] },
  { no: "014", tagA: true, file: "optional-empty-014.csv", format: "csv", row: (p) => [p, "1", "2000", "500", "0", "", ""] },
  { no: "015", edit: { 帯URL: BELT.before }, file: "belt-url-015.csv", format: "csv", row: (p) => [p, "1", "2000", "500", "0", BELT.sale, TAG_A] },
  { no: "016", edit: { 帯URL: BELT.before }, file: "optional-empty-016.csv", format: "csv", row: (p) => [p, "1", "2000", "500", "0", "", ""] },
  { no: "025", edit: { セール販売価格: "1500" }, file: "history-success-025.csv", format: "csv", row: (p) => [p, "1", "1500", "500", "1", "", ""] },
  { no: "035", file: "blank-product-id-035.csv", format: "csv", row: () => ["", "1", "1500", "500", "1", "", ""] },
  { no: "036", file: "blank-language-id-036.csv", format: "csv", row: (p) => [p, "", "1500", "500", "1", "", ""] },
  { no: "037", file: "blank-sell-price-037.csv", format: "csv", row: (p) => [p, "1", "", "500", "1", "", ""] },
  { no: "038", file: "blank-buy-price-038.csv", format: "csv", row: (p) => [p, "1", "1500", "", "1", "", ""] },
  { no: "039", file: "blank-sale-flag-039.csv", format: "csv", row: (p) => [p, "1", "1500", "500", "", "", ""] },
  { no: "040", file: "invalid-product-id-040.csv", format: "csv", row: () => ["abc", "1", "1500", "500", "1", "", ""] },
  { no: "041", file: "invalid-language-id-041.csv", format: "csv", row: (p) => [p, "abc", "1500", "500", "1", "", ""] },
  { no: "042", file: "invalid-sell-price-042.csv", format: "csv", row: (p) => [p, "1", "abc", "500", "1", "", ""] },
  { no: "043", file: "invalid-buy-price-043.csv", format: "csv", row: (p) => [p, "1", "1500", "abc", "1", "", ""] },
  { no: "044", file: "invalid-sale-flag-044.csv", format: "csv", row: (p) => [p, "1", "1500", "500", "2", "", ""] },
  { no: "046", file: "unknown-tag-046.csv", format: "csv", row: (p) => [p, "1", "1500", "500", "1", "", "933046"], noTagId: "933046" },
  { no: "047", tagA: true, file: "invalid-tag-format-047.csv", format: "csv", row: (p) => [p, "1", "1500", "500", "1", "", `${TAG_B},abc`] },
  { no: "048", file: "buy-over-sell-048.csv", format: "csv", row: (p) => [p, "1", "1000", "1001", "1", "", ""] },
  { no: "052", file: "valid.tsv", format: "tsv", row: (p) => [p, "1", "1500", "500", "1", BELT.of("052"), ""] },
  { no: "053", file: "non-utf8-053.csv", format: "sjis-csv", row: (p) => [p, "1", "1500", "500", "1", "", ""] },
  { no: "055", file: "valid.txt", format: "csv", row: (p) => [p, "1", "1500", "500", "1", "", ""] },
  { no: "058", file: "price-over-max-058.csv", format: "csv", row: (p) => [p, "1", "1000000000", "1000000000", "1", "", ""] },
  { no: "059", file: "belt-url-128-059.csv", format: "csv", row: (p) => [p, "1", "1500", "500", "1", BELT.len128, ""] },
  { no: "060", edit: { 帯URL: BELT.before }, file: "belt-url-129-060.csv", format: "csv", row: (p) => [p, "1", "1500", "500", "1", BELT.len129, ""] },
];

/** 投入方法に、作り方の決め手になる文が書かれていること（書き写しの誤りを止める） */
function expectMethodSays(seedId: string, phrases: string[]): void {
  const method = getSeed(seedId).投入方法;
  for (const p of phrases) if (!method.includes(p)) throw new Error(`${seedId}: 投入方法に「${p}」が無い`);
}

async function buildSingle(browser: Browser, seedId: string, notes: Notes, s: SingleSpec): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const code = `M0331-${s.no}`;
  expectMethodSays(seedId, [`商品コードに「${code}」`, s.tagA ? `タグ(ID)に${TAG_A}` : "タグ(ID)を空"]);
  if (s.edit?.帯URL) expectMethodSays(seedId, [`帯URLに「${s.edit.帯URL}」`]);
  if (s.edit?.セール販売価格) expectMethodSays(seedId, ["セールフラグにチェックを入れ", `販売価格に${s.edit.セール販売価格}`]);
  if (s.noTagId) expectMethodSays(seedId, [`IDが${s.noTagId}の行が無い`]);
  const got = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const ids = await goodsProductWithOneClass(page, { seedId, no: s.no, code, tagId: s.tagA ? notes.get(TAG_A) : "", onIssue: issue });
    if (s.edit) await saveClassEdits(page, s.edit, seedId, issue);
    if (s.noTagId) {
      const tag = new TagPage(page);
      const rows = await allTagRows(tag);
      if (rows.some((r) => r.ID === s.noTagId)) throw new Error(`${seedId}: タグ登録画面の一覧に、IDが${s.noTagId}の行がある（未登録のはず）`);
    }
    return ids;
  });
  notes.set(P(s.no), got.productId);
  notes.set(`〔商品規格ID-M0331-${s.no}〕`, got.classId);
  writeImportFile(seedId, s.no, s.file, s.format, [s.row(P(s.no))], notes);
}

/** 単一の規格の商品のシード。タグの呼び名を使うものは、先にタグのマスタ（S-M03-31-MASTERS）を作る */
function single(no: string): { needs: string[] } {
  const s = SINGLE.find((x) => x.no === no);
  if (!s) throw new Error(`S-M03-31-DATA-${no} の作り方が SINGLE に無い`);
  return { needs: s.tagA || s.row("").some((v) => v.includes("〔タグID-")) ? ["S-M03-31-MASTERS"] : [] };
}
async function buildSingleNo(browser: Browser, seedId: string, notes: Notes): Promise<void> {
  const no = seedId.replace("S-M03-31-DATA-", "");
  const s = SINGLE.find((x) => x.no === no);
  if (!s) throw new Error(`${seedId} の作り方が SINGLE に無い`);
  await buildSingle(browser, seedId, notes, s);
}
defineSeed("S-M03-31-DATA-013", single("013"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-014", single("014"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-015", single("015"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-016", single("016"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-025", single("025"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-035", single("035"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-036", single("036"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-037", single("037"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-038", single("038"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-039", single("039"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-040", single("040"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-041", single("041"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-042", single("042"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-043", single("043"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-044", single("044"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-046", single("046"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-047", single("047"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-048", single("048"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-052", single("052"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-053", single("053"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-055", single("055"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-058", single("058"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-059", single("059"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-060", single("060"), ({ browser, seed, notes }) => buildSingleNo(browser, seed.シードID, notes));

// ---- 012: 存在しない商品 ----

defineSeed("S-M03-31-DATA-012", async ({ browser, seed, notes }) => {
  const id = seed.シードID;
  // 投入方法「該当があれば、その商品の商品登録編集画面で削除を押して削除する」: 該当があれば止める（同じ番号の商品を消す操作は、確かめてから人が行う）
  await withAdminSession(browser, SETUP_ADMIN, (page) => expectNoProductWithId(page, "933012", id));
  writeImportFile(id, "012", "unknown-product-012.csv", "csv", [["933012", "1", "1000", "500", "1", "", ""]], notes);
});

// ---- 008〜011: 5規格の商品（通常規格A・B、英語の規格C、削除済みの規格D、高額商品コードの規格E） ----

async function buildFiveClasses(browser: Browser, seedId: string, notes: Notes): Promise<void> {
  const no = seedId.replace("S-M03-31-DATA-", "");
  const issue = (m: string) => reportSeedIssue(seedId, m);
  expectMethodSays(seedId, [`商品コードに「M0331-${no}A」`, `言語に英語、状態にニアミント、商品コードに「M0331-${no}C」`, `高額商品コードに「M0331-${no}HP」`, "その画面で商品規格を削除を押す"]);
  const ids = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const a = await goodsProductWithOneClass(page, { seedId, no, code: `M0331-${no}A`, tagId: "", onIssue: issue });
    const base = { 基準価格: "2000", 販売価格: "2000", 買取価格: "500" };
    const add = async (suffix: string, 言語: string, extra: { 高額商品コード?: string } = {}) => {
      await openClassList(page, a.productId);
      return addClass(page, a.productId, { 言語, 状態: "ニアミント", 商品コード: `M0331-${no}${suffix}`, ...base, ...extra }, `${seedId}: 規格${suffix}`, issue);
    };
    const b = await add("B", "日本語");
    const c = await add("C", "英語");
    const d = await add("D", "日本語");
    await deleteClassOnEdit(page, `${seedId}: 規格D`, issue);
    const e = await add("E", "日本語", { 高額商品コード: `M0331-${no}HP` });
    return { product: a.productId, A: a.classId, B: b, C: c, D: d, E: e };
  });
  notes.set(`〔商品ID-M0331-${no}〕`, ids.product);
  for (const k of ["A", "B", "C", "D", "E"] as const) notes.set(`〔商品規格ID-M0331-${no}${k}〕`, ids[k]);
  writeImportFile(seedId, no, `scope-${no}.csv`, "csv", [[`〔商品ID-M0331-${no}〕`, "1", "2100", "800", "1", BELT.of(no), TAG_B]], notes);
}
defineSeed("S-M03-31-DATA-008", { needs: ["S-M03-31-MASTERS"] }, ({ browser, seed, notes }) => buildFiveClasses(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-009", { needs: ["S-M03-31-MASTERS"] }, ({ browser, seed, notes }) => buildFiveClasses(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-010", { needs: ["S-M03-31-MASTERS"] }, ({ browser, seed, notes }) => buildFiveClasses(browser, seed.シードID, notes));
defineSeed("S-M03-31-DATA-011", { needs: ["S-M03-31-MASTERS"] }, ({ browser, seed, notes }) => buildFiveClasses(browser, seed.シードID, notes));
