/**
 * M03-37 略称タグ更新CSV登録の画面シード。正本: cases/M03-37_seed_data.tsv
 *
 * 作るシード（使うケースだけ）:
 * - S-M03-37-ADM・S-M03-37-L-ADM: メンバー管理で登録する（M03-14・M03-16 と同じ作り方）。シード表の「管理者ID=33700001」は
 *   メンバー登録の画面では指定できない（画面が振る）。実装したケースは管理者IDを使わない。
 * - S-M03-37-CONFIG・S-M03-37-L-CONFIG: 管理画面に設定画面が無い。設定ファイルを書き換えず、CSV取込の区切り文字がカンマ・
 *   囲み文字が二重引用符・アップロードの上限が5MBであることだけを確かめる（違えば止める。M03-16 と同じ）。
 *   区切り文字をセミコロンにする 013 は、設定ファイルの書き換えが要るので実装しない。
 * - S-M03-37-MASTER: 略称タグ登録/編集画面で、名称 POR・PRE の行が無ければ登録し、IDを控える。並び順は「0〜32767の任意の整数」なので 100 にした。
 * - S-M03-37-DATA-*・S-M03-37-L-DATA-*: グッズ商品CSV登録で商品を1件ずつ作り（正本の値。下の goodsLine）、商品マスターを商品コードで検索して
 *   商品IDを控え、ケースが選ぶ取込ファイルを試験端末（e2e/.state/m03-37/）に作る。
 *   固定の商品コードの商品が前の実行で残っていれば止める（正本に清掃の手順が無い。同じDBでは流し直さない）。
 *
 * グッズ商品CSVの値で、正本と画面が食い違うもの（記録の注記）:
 * - 商品公開ステータス: 正本は「2（公開）」。画面のCSV形式の説明は「1:公開 2:非公開 3:廃止」なので、公開を表す値（画面の説明から読む）を書いた
 *   （正本の意図「公開」を優先。M03-45 の記録の裁定案1と同じ扱い）。
 * - 正本の「表示された確認モーダルでアップロードを確定する」の確認モーダルは、アプリに無い（設計書 M03-27 L0092）。取込の結果（成功の表示）を確かめて進む。
 *
 * 取込ファイルの中身で、正本が決めていない部分（解釈。記録の注記に書く）:
 * - 見出し行の中身を書いていないファイル（010 の3つ・011・026・027・028・029・035・036・044）は、設計書の略称タグ更新CSVフォーマットの見出し「商品ID,略称タグ」
 *   （design.txt L0114〜L0115。001 のシード表が書く見出しと同じ）を足した。
 * - 文字コードは UTF-8（009 だけ Shift_JIS）、改行は LF（010 は指定どおり）、末尾に改行1個、先頭の印（BOM）なし（011 は指定どおり）。
 * - 011 のゼロ幅空白は U+200B。043 の「5 MB」は 5×1024×1024 バイトと読んだ（M03-20 の022・M03-35 の023 と同じ）。
 *
 * 作らないシード（使うケースも実装しない）: DATA-003・004・021（取込履歴をDBへ直接0件にする）、DATA-005〜007・015〜018・022〜024・037〜039
 * （DBシードで取込履歴・商品を入れる・消す）、DATA-025（商品の削除済みの状態をDBへ直接設定する）、DATA-013（設定ファイルの書き換え）。
 */
import fs from "node:fs";
import path from "node:path";
import { expect, Page } from "@playwright/test";
import { SETUP_ADMIN, STATE_DIR } from "../config/env";
import { 略称タグ更新の同名の取込履歴の件数 } from "../db/m03_37_short_tag_update";
import { CSV入出力設定 } from "../lib/app_config";
import { getSeed } from "../lib/catalog";
import { available as dbAvailable } from "../lib/db";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { readGoodsProductId } from "../pages/admin/m03_01_goods_list_seed";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { encodeShiftJis } from "../pages/admin/m03_41_csv_file";
import { goodsCsvCategoryId } from "../pages/admin/m03_22_product";
import { productIdsByCode } from "../pages/admin/m03_23_seed_products";
import { 取込ファイル } from "../pages/admin/m03_37_short_tag_update_csv";
import { ensureMember } from "../pages/admin/member";
import { ShortTagInput, ShortTagPage } from "../pages/admin/short_tag";

export const M0337_ADMIN: Account = { loginId: "m0337_admin", password: "Passw0rd!M0337" };
export const M0337L_ADMIN: Account = { loginId: "m0337l_admin", password: "Passw0rd!M0337L" };

// ---- 管理者・設定 ----

async function createAdmin(page: Page, 名前: string, account: Account, email: string): Promise<void> {
  await page.goto(adminUrl("/setting/system/member/new"));
  const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((options) => options
    .map((option) => option as HTMLOptionElement)
    .filter((option) => option.value !== "")
    .map((option) => option.textContent?.trim() ?? "")
    .filter(Boolean));
  if (stores.length === 0) throw new Error(`${名前}: メンバーに割り当てられる店舗が画面に無い`);
  const store = stores[0];
  await ensureMember(page, {
    名前, 所属店舗: store, ログインID: account.loginId, メールアドレス: email,
    パスワード: account.password, 権限: "システム管理者", デフォルト検索表示店舗: store, 編集可能店舗: [store],
  });
}

/** ログインでき（稼働中・ロックなし）、商品管理の略称タグ登録/編集画面を開けることを、ケースとは別のセッションで確かめる */
async function expectCanOpen(page: Page, who: string): Promise<void> {
  const tag = new ShortTagPage(page);
  await tag.openNew();
  await expect(tag.登録ボタン, `${who}で略称タグ登録/編集画面を開けない`).toBeVisible();
}

defineSeed("S-M03-37-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page, "M03-37試験管理者", M0337_ADMIN, "m0337_admin@example.test"));
  await withAdminSession(browser, M0337_ADMIN, (page) => expectCanOpen(page, "M03-37試験管理者"));
});

defineSeed("S-M03-37-L-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page, "M03-37連携試験管理者", M0337L_ADMIN, "m0337l_admin@example.test"));
  await withAdminSession(browser, M0337L_ADMIN, (page) => expectCanOpen(page, "M03-37連携試験管理者"));
});

function expectCsvConfig(seedId: string): void {
  const c = CSV入出力設定();
  const got = { 取込区切り文字: c.取込区切り文字, 取込囲み文字: c.取込囲み文字, アップロード上限MB: c.アップロード上限MB };
  const want = { 取込区切り文字: ",", 取込囲み文字: '"', アップロード上限MB: 5 };
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    throw new Error(`${seedId}: CSV取込の設定が ${JSON.stringify(got)}（シード表は ${JSON.stringify(want)}）。設定ファイルを直してアプリのキャッシュを作り直してから流す`);
  }
}
defineSeed("S-M03-37-CONFIG", async ({ seed }) => { expectCsvConfig(seed.シードID); });
defineSeed("S-M03-37-L-CONFIG", async ({ seed }) => { expectCsvConfig(seed.シードID); });

// ---- 略称タグ ----

const 共有A = "〔略称タグID-M0337-共有A〕";
const 共有B = "〔略称タグID-M0337-共有B〕";

/** 略称タグ登録/編集画面を開き（一覧の表示件数を12000件にして全件を出す）、名称の行が無ければ登録して、一覧の名称の行のID欄の番号を返す */
async function ensureTag(tag: ShortTagPage, seedId: string, v: ShortTagInput): Promise<string> {
  await tag.showFirstPageWith("12000");
  const n = await tag.rowsByName(v.名称).count();
  if (n > 1) throw new Error(`${seedId}: 略称タグ一覧に名称「${v.名称}」の行が ${n} 件ある。どれを使うか決められない`);
  if (n === 0) {
    if (await tag.新規登録へ戻る.count()) await tag.pressBackToNew();
    await tag.register(v, `${seedId}: 名称「${v.名称}」の略称タグの登録`);
    await tag.showFirstPageWith("12000");
  } else {
    reportSeedIssue(seedId, `略称タグ一覧に名称「${v.名称}」の行があったので、登録せずにそのIDを控えた`);
  }
  return tag.idOfName(v.名称);
}

defineSeed("S-M03-37-MASTER", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const tag = new ShortTagPage(page);
    notes.set(共有A, await ensureTag(tag, seed.シードID, { 名称: "POR", 並び順: "100", アルファベット順: false }));
    notes.set(共有B, await ensureTag(tag, seed.シードID, { 名称: "PRE", 並び順: "100", アルファベット順: false }));
  });
});

// ---- 取込ファイル ----

const RUNTIME_DIR = path.join(STATE_DIR, "m03-37");
const PREPARED = new Set<string>();
const MIME: Record<string, string> = { csv: "text/csv", tsv: "text/tab-separated-values" };
/** 設計書の略称タグ更新CSVフォーマットの見出し（design.txt L0114〜L0115） */
export const 見出し = "商品ID,略称タグ";
/** 「5 MB」の読み方（解釈）。5×1024×1024 バイト */
const 五MB = 5 * 1024 * 1024;

/** ケースが選ぶファイル（シードが用意したもの） */
export function m0337File(name: string): 取込ファイル {
  if (!PREPARED.has(name)) throw new Error(`${name} は M03-37 のシードが用意したファイルでない（シードを作っていないか、名前の誤り）`);
  const file = path.join(RUNTIME_DIR, name);
  const ext = name.split(".").pop() ?? "";
  if (!MIME[ext]) throw new Error(`${name}: 拡張子 ${ext} の形式種別を決めていない`);
  return { name, mimeType: MIME[ext], buffer: fs.readFileSync(file) };
}

function writeFile(seedId: string, name: string, bytes: Buffer): void {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  const file = path.join(RUNTIME_DIR, name);
  fs.writeFileSync(file, bytes);
  if (!fs.readFileSync(file).equals(bytes)) throw new Error(`${seedId}: ${file} を書いた中身と読み戻した中身が違う`);
  PREPARED.add(name);
}

/** 行（見出しを含む）を改行でつなぎ、末尾にも改行を置いた UTF-8 のファイル */
const utf8 = (lines: string[], eol = "\n") => Buffer.from(lines.map((l) => l + eol).join(""), "utf-8");

/** シード表の文に、正本の語が書かれていること（書き写しの誤りを止める） */
function expectInSeed(seedId: string, words: string[]): void {
  const s = getSeed(seedId);
  const text = s["状態・属性"] + s.投入方法;
  for (const w of words) if (!text.includes(w)) throw new Error(`${seedId}: シード表に「${w}」が無い（書き写しの誤り）`);
}

// ---- 商品 ----

type 商品 = { label: string; code: string; tag: "POR" | "PRE" | string };

/**
 * グッズ商品CSV登録で、正本の値の1行のCSVをアップロードし、商品マスターを商品コードで検索して商品IDを控える。
 * 正本の値: 商品IDは空・言語(ID)は日本語のID・商品公開ステータスは公開・支店の商品公開ステータスは公開・商品名(日)「M0337商品-<番号>」・
 * 商品名(英)「M0337-Product-<番号>」・サイズ1・重量1・商品カテゴリ(ID)はサプライ・グッズのカテゴリID・購入グループ名称「通常商品」・
 * 略称タグ(ID)・基準価格1000・販売価格1000・買取価格1000・原価単価10・地域別販売制限0・スマレジ連携フラグ0・スマレジ商品コードと部門IDは空。
 */
async function createGoods(page: Page, seedId: string, notes: Notes, items: 商品[], tagIds: Record<string, string>): Promise<void> {
  const warn = (m: string) => reportSeedIssue(seedId, m);
  for (const it of items) {
    const left = await productIdsByCode(page, it.code);
    if (left.length > 0) {
      throw new Error(`${seedId}: 商品コード ${it.code} の商品が前の実行で残っている（商品ID ${left.join("・")}）。正本に清掃の手順が無いので、同じDBでは流し直さない`);
    }
  }
  const categoryId = await goodsCsvCategoryId(page, warn);
  for (const it of items) {
    const suffix = it.code.replace(/^M0337-/, "");
    const nameJp = `M0337商品-${suffix}`;
    const tagId = tagIds[it.tag];
    if (!tagId) throw new Error(`${seedId}: 略称タグ「${it.tag}」のIDを控えていない`);
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録（${it.code}）`, fileName: `${seedId}-${suffix}.csv`, categoryId,
      lines: [{ code: it.code, nameJp, nameEn: `M0337-Product-${suffix}` }],
      common: {
        "購入グループ名称": "通常商品", "略称タグ(ID)": tagId, "基準価格": "1000", "販売価格": "1000", "買取価格": "1000",
        "原価単価": "10", "地域別販売制限": "0", "スマレジ連携フラグ": "0", "スマレジ商品コード": "", "部門ID": "",
      },
      onWarning: warn,
    });
    notes.set(it.label, await readGoodsProductId(page, it.code, nameJp));
  }
  warn(`グッズ商品CSV（${items.map((i) => i.code).join("・")}）: 正本の「確認モーダルでアップロードを確定する」の確認モーダルは出ず、` +
    "「CSVファイルのアップロード」を押すと取り込まれた。商品公開ステータスは、正本の「2（公開）」でなく、画面のCSV形式の説明で公開を表す値を書いた。" +
    `商品カテゴリ(ID)はサプライ・グッズのカテゴリID ${categoryId}`);
}

/**
 * 商品を作って取込ファイルを用意するシード。
 * files は控えた番号を受けて [ファイル名, 中身] を返す。words はシード表に書かれているはずの語。
 */
function defineDataSeed(seedId: string, o: {
  items: 商品[];
  words: string[];
  files: (id: (label: string) => string) => [string, Buffer][];
  before?: (page: Page, seedId: string) => Promise<void>;
  after?: (seedId: string) => void;
}): void {
  defineSeed(seedId, { needs: ["S-M03-37-MASTER"] }, async ({ browser, notes, seed }) => {
    expectInSeed(seed.シードID, [...o.items.map((i) => i.code), ...o.words]);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      if (o.before) await o.before(page, seedId);
      await createGoods(page, seedId, notes, o.items, { POR: notes.get(共有A), PRE: notes.get(共有B) });
    });
    for (const [name, bytes] of o.files((l) => notes.get(l))) writeFile(seedId, name, bytes);
    if (o.after) o.after(seedId);
  });
}

const P = (n: string) => `〔商品ID-M0337-${n}〕`;
const item = (n: string, tag: "POR" | "PRE"): 商品 => ({ label: P(n), code: `M0337-${n}`, tag });

/** 名称 UNKNOWN の略称タグの行が無いことを確かめ、あれば削除ボタンで削除する（004・026 の投入方法） */
async function removeUnknownTag(page: Page): Promise<void> {
  const tag = new ShortTagPage(page);
  await tag.showFirstPageWith("12000");
  await tag.deleteAllNamed("UNKNOWN");
  await tag.showFirstPageWith("12000");
  await expect(tag.rowsByName("UNKNOWN"), "略称タグ一覧に名称UNKNOWNの行が無い").toHaveCount(0);
}

/**
 * 「実行前に略称タグ更新CSV登録画面のCSVインポート履歴に、そのファイル名の行が無いことを確かめる」。
 * アプリにその画面が無いので、画面では確かめられない。DBの参照で数え、あれば止める（DBへ直接設定する準備になるので）。
 */
function expectNoHistoryByDb(seedId: string, name: string): void {
  if (!dbAvailable) throw new Error(`${seedId}: 略称タグ更新CSV登録画面が無く、DB確認の接続先も無いので、「${name}」の取込履歴が無いことを確かめられない`);
  const n = 略称タグ更新の同名の取込履歴の件数(name);
  if (n > 0) throw new Error(`${seedId}: 略称タグ更新の取込履歴に「${name}」が ${n} 件ある。消すのはDBへの直接の設定になるので止めた`);
  reportSeedIssue(seedId, `略称タグ更新CSV登録画面がアプリに無いので、取込履歴に「${name}」の行が無いことを、画面でなくDBの参照で確かめた（0件）`);
}

defineDataSeed("S-M03-37-DATA-001", {
  items: [item("001A", "POR"), item("001B", "PRE")], words: ["m0337_normal-001.csv", "見出し「商品ID,略称タグ」"],
  files: (id) => [["m0337_normal-001.csv", utf8([見出し, `${id(P("001A"))},PRE`, `${id(P("001B"))},POR`])]],
});
defineDataSeed("S-M03-37-DATA-002", {
  items: [item("002A", "POR"), item("002B", "PRE")], words: ["m0337_normal-002.csv", "見出し「商品ID,略称タグ」"],
  files: (id) => [["m0337_normal-002.csv", utf8([見出し, `${id(P("002A"))},PRE`, `${id(P("002B"))},POR`])]],
});
defineDataSeed("S-M03-37-DATA-009", {
  items: [item("009", "POR")], words: ["m0337_sjis-009.csv=Shift_JIS・見出し「商品ID,略称タグ」"],
  files: (id) => [["m0337_sjis-009.csv", encodeShiftJis(`${見出し}\n${id(P("009"))},PRE\n`)]],
});
defineDataSeed("S-M03-37-DATA-010", {
  items: [item("010A", "POR"), item("010B", "POR"), item("010C", "POR")],
  words: ["m0337_lf-010.csv=LF", "m0337_crlf-010.csv=CRLF", "m0337_cr-010.csv=CR"],
  files: (id) => [
    ["m0337_lf-010.csv", utf8([見出し, `${id(P("010A"))},PRE`], "\n")],
    ["m0337_crlf-010.csv", utf8([見出し, `${id(P("010B"))},PRE`], "\r\n")],
    ["m0337_cr-010.csv", utf8([見出し, `${id(P("010C"))},PRE`], "\r")],
  ],
});
defineDataSeed("S-M03-37-DATA-011", {
  items: [item("011", "POR")], words: ["m0337_bom_zwsp-011.csvは見出し先頭にバイト順序記号", "PとREの間にゼロ幅空白"],
  files: (id) => [["m0337_bom_zwsp-011.csv", Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), utf8([見出し, `${id(P("011"))},P​RE`])])]],
});
defineDataSeed("S-M03-37-DATA-012", {
  items: [item("012", "POR")], words: ["m0337_tab-012.tsv=見出し「商品ID」「略称タグ」のタブ区切り"],
  files: (id) => [["m0337_tab-012.tsv", utf8(["商品ID\t略称タグ", `${id(P("012"))}\tPRE`])]],
});
defineDataSeed("S-M03-37-DATA-019", {
  items: [item("019", "POR")], words: ["m0337_three_columns-019.csv=見出し「商品ID,略称タグ」"],
  files: (id) => [["m0337_three_columns-019.csv", utf8([見出し, `${id(P("019"))},PRE,EXTRA`])]],
});
defineDataSeed("S-M03-37-DATA-020", {
  items: [item("020", "POR")], words: ["m0337_missing_item-020.csv=見出し「商品ID,未定義項目」"],
  files: (id) => [["m0337_missing_item-020.csv", utf8(["商品ID,未定義項目", `${id(P("020"))},PRE`])]],
});
defineDataSeed("S-M03-37-DATA-026", {
  items: [item("026", "POR")], words: ["m0337_unknown_tag-026.csvのデータ", "名称UNKNOWNの行が無いことを確かめ"],
  before: async (page) => { await removeUnknownTag(page); },
  files: (id) => [["m0337_unknown_tag-026.csv", utf8([見出し, `${id(P("026"))},UNKNOWN`])]],
});
const errorOnThird = (n: string) => (id: (l: string) => string): [string, Buffer][] =>
  [[`m0337_error_on_third_line-${n}.csv`, utf8([見出し, `${id(P(`${n}A`))},PRE`, `${id(P(`${n}B`))},`])]];
defineDataSeed("S-M03-37-DATA-027", {
  items: [item("027A", "POR"), item("027B", "PRE")], words: ["m0337_error_on_third_line-027.csvは見出し行"],
  files: errorOnThird("027"),
});
defineDataSeed("S-M03-37-DATA-028", {
  items: [item("028A", "POR"), item("028B", "PRE")], words: ["m0337_error_on_third_line-028.csvは見出し行"],
  files: errorOnThird("028"),
});
defineDataSeed("S-M03-37-DATA-029", {
  items: [item("029", "POR")], words: ["m0337_duplicate-029.csvのデータ順"],
  files: (id) => [["m0337_duplicate-029.csv", utf8([見出し, `${id(P("029"))},POR`, `${id(P("029"))},PRE`])]],
});
for (const n of ["035", "036"]) {
  defineDataSeed(`S-M03-37-DATA-${n}`, {
    items: [item(`${n}A`, "POR"), item(`${n}B`, "PRE")], words: [`m0337_normal-${n}.csvのデータ`],
    files: (id) => [[`m0337_normal-${n}.csv`, utf8([見出し, `${id(P(`${n}A`))},PRE`, `${id(P(`${n}B`))},POR`])]],
  });
}
defineDataSeed("S-M03-37-DATA-043", {
  items: [item("043A", "POR")], words: ["m0337_exact-043.csv=見出し「商品ID,略称タグ」", "ゼロ幅空白（U+200B）", "末尾の改行の数で調整する"],
  files: (id) => {
    const body = `${見出し}\n${id(P("043A"))},PRE\n`;
    const need = 五MB - Buffer.byteLength(body, "utf-8");
    const k = Math.floor(need / 3);
    const bytes = Buffer.from("​".repeat(k) + body + "\n".repeat(need - 3 * k), "utf-8");
    if (bytes.length !== 五MB) throw new Error(`S-M03-37-DATA-043: m0337_exact-043.csv が ${五MB} バイトにならない（${bytes.length}）`);
    return [["m0337_exact-043.csv", bytes]];
  },
  after: (seedId) => expectNoHistoryByDb(seedId, "m0337_exact-043.csv"),
});
defineDataSeed("S-M03-37-DATA-044", {
  items: [item("044A", "POR"), item("044B", "PRE")], words: ["m0337_two_errors-044.csvは見出し行", "5行目「M0337-044-ABC,PRE」"],
  files: (id) => [["m0337_two_errors-044.csv", utf8([見出し, `${id(P("044A"))},PRE`, `${id(P("044B"))},`, `${id(P("044A"))},POR`, "M0337-044-ABC,PRE"])]],
});
defineDataSeed("S-M03-37-DATA-045", {
  items: [item("045A", "POR"), item("045B", "PRE")], words: ["m0337_repeat-045.csv=見出し「商品ID,略称タグ」"],
  files: (id) => [["m0337_repeat-045.csv", utf8([見出し, `${id(P("045A"))},PRE`, `${id(P("045B"))},POR`])]],
  after: (seedId) => expectNoHistoryByDb(seedId, "m0337_repeat-045.csv"),
});

// ---- 略称タグの付け替え（040・041） ----

/**
 * 略称タグ登録/編集画面で、名称「旧使用タグ-00N」（並び順10）・「新割当タグ-00N」（並び順20）をアルファベット順ソートフラグを外したまま登録して
 * IDを控え、旧使用タグに紐づくグッズ商品を1件作り、取込ファイル l0337_00N.csv を作る。前の実行で同じ名称の行が残っていれば止める。
 */
function defineLinkSeed(seedId: string, n: string, case番号: string): void {
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    const old = `旧使用タグ-${n}`;
    const neu = `新割当タグ-${n}`;
    const file = `l0337_${n}.csv`;
    expectInSeed(seed.シードID, [old, neu, file, "並び順10", "並び順20"]);
    const A = `〔略称タグID-M0337-${case番号}A〕`;
    const B = `〔略称タグID-M0337-${case番号}B〕`;
    const productLabel = `〔商品ID-M0337-${case番号}〕`;
    const code = `M0337-${case番号}`;
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      const tag = new ShortTagPage(page);
      await tag.showFirstPageWith("12000");
      for (const name of [old, neu]) {
        if (await tag.rowsByName(name).count()) throw new Error(`${seedId}: 略称タグ「${name}」が前の実行で残っている。正本に清掃の手順が無いので、同じDBでは流し直さない`);
      }
      notes.set(A, await tag.register({ 名称: old, 並び順: "10", アルファベット順: false }, `${seedId}: 略称タグ「${old}」の登録`));
      await tag.pressBackToNew();
      notes.set(B, await tag.register({ 名称: neu, 並び順: "20", アルファベット順: false }, `${seedId}: 略称タグ「${neu}」の登録`));
      await tag.showFirstPageWith("12000");
      expect(await tag.idOfName(old), `一覧の「${old}」の行のID`).toBe(notes.get(A));
      expect(await tag.idOfName(neu), `一覧の「${neu}」の行のID`).toBe(notes.get(B));
      await createGoods(page, seedId, notes, [{ label: productLabel, code, tag: old }], { [old]: notes.get(A) });
    });
    writeFile(seedId, file, utf8([見出し, `${notes.get(productLabel)},${neu}`]));
  });
}
defineLinkSeed("S-M03-37-L-DATA-040", "001", "040");
defineLinkSeed("S-M03-37-L-DATA-041", "002", "041");
