/**
 * M03-32 高額商品価格変更CSV登録の画面シード。正本: cases/M03-32_seed_data.tsv
 *
 * 作るのは、画面だけで用意できて、実装したケース（001・005・006・012・014・015・016・019・020・026）が使うシードだけ。
 * - S-M03-32-ADM: メンバー管理で試験管理者を登録する（M03-29 と同じ作り方。システム管理者の権限）。管理者ID 33200001 は画面で指定できない。
 * - S-M03-32-CONFIG: 管理画面に「CSV区切り文字設定」の画面が無い（区切り文字はアプリの設定ファイルの値）。
 *   設定を書き換えず、値がシード表の状態（カンマ）であることだけを確かめる（違えば止める。M03-29 と同じ扱い）。
 * - S-M03-32-DATA-005・006: グッズ商品CSV登録で商品を作り、商品規格登録編集画面で高額商品コード・セールフラグ・価格を入れる。
 *   セールフラグありなので販売価格800は画面で入る（DBへの直接設定は要らない）。005 の「同名取込履歴0件」は、画面のCSVインポート履歴で
 *   sale-005.csv の行が無いことを確かめる（あればDBで消すと正本は定めるが、DBは書き換えないので止める）。
 * - S-M03-32-DATA-014・015・016・019・020・026: 取込ファイルだけ。実行のたびに .state/m03-32 に作る（fixtures では保留になっている）。
 *   014・015・019・020・026 は文字コードの指定が無い。この機能のシード表がほかのシードで定める既定（UTF-8・カンマ区切り）で作る（注記）。
 *   026 は見出し行の値が書かれていない。この機能のCSVのフォーマットの見出し（商品コード,基準価格。設計書 L0118〜L0121）で作る（注記）。
 *   016 は「有効な1ピクセルPNG画像」。中身は正本が定めないので、1×1 の画素1つの PNG をここで作る（どの有効なPNGでも条件を満たす）。
 *
 * 商品コードが固定のシード（DATA-005・006）は、正本に清掃の手順が無い。同じ商品コードの商品が残っていれば作らずに止める（同じDBでは流し直さない）。
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { expect, Page } from "@playwright/test";
import { REPO_ROOT, SETUP_ADMIN, STATE_DIR } from "../config/env";
import { 商品規格の状態 } from "../db/m03_32_high_price";
import { CSV入出力設定 } from "../lib/app_config";
import { getSeed } from "../lib/catalog";
import { available as dbAvailable } from "../lib/db";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { goodsCsvCategoryId } from "../pages/admin/m03_22_product";
import { openProductEditByCode, productIdsByCode } from "../pages/admin/m03_23_seed_products";
import { HighPriceCsvUploadPage, registerHighPriceClass, 取込画面の種類, 高額商品規格の入力 } from "../pages/admin/m03_32_high_price_csv";
import { ensureMember } from "../pages/admin/member";

export const M0332_ADMIN: Account = { loginId: "m0332_admin", password: "Passw0rd!M0332" };

/** 正本は所属店舗を指定しない。管理画面で利用可能な店舗を1つ選び、商品管理を操作できるシステム管理者の権限を付ける（M03-29 と同じ作り方） */
export async function createTestAdmin(page: Page, seedId: string, 名前: string, account: Account): Promise<void> {
  await page.goto(adminUrl("/setting/system/member/new"));
  const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((options) => options
    .map((option) => option as HTMLOptionElement)
    .filter((option) => option.value !== "")
    .map((option) => option.textContent?.trim() ?? "")
    .filter(Boolean));
  if (stores.length === 0) throw new Error(`${seedId}: メンバーに割り当てられる店舗が画面に無い`);
  const store = stores[0];
  await ensureMember(page, {
    名前, 所属店舗: store, ログインID: account.loginId, メールアドレス: `${account.loginId}@example.test`,
    パスワード: account.password, 権限: "システム管理者", デフォルト検索表示店舗: store, 編集可能店舗: [store],
  });
}

defineSeed("S-M03-32-ADM", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createTestAdmin(page, seed.シードID, "M03-32試験管理者", M0332_ADMIN));
  reportSeedIssue(seed.シードID, "管理者ID 33200001 は画面のメンバー登録で指定できない（画面が振る）。ログインID・パスワード・稼働中は正本どおり");
  // ログインでき（稼働中・ロックなし）、高額商品価格変更CSVアップロード画面を開けることを、ケースとは別のセッションで確かめる
  await withAdminSession(browser, M0332_ADMIN, async (page) => {
    const upload = new HighPriceCsvUploadPage(page, "高額商品価格変更");
    await upload.open();
    await expect(upload.アップロードボタン, "M03-32試験管理者で高額商品価格変更CSVアップロード画面を開けない").toBeVisible();
  });
});

defineSeed("S-M03-32-CONFIG", async ({ seed }) => {
  // 管理画面に設定項目が無い。設定を書き換えず、取込の区切り文字がシード表の状態（カンマ）であることだけを確かめる（違えば止める）。
  const c = CSV入出力設定();
  if (c.取込区切り文字 !== ",") {
    throw new Error(`${seed.シードID}: CSV取込の区切り文字が ${JSON.stringify(c.取込区切り文字)}（シード表はカンマ）。設定を直してアプリのキャッシュを作り直してから流す`);
  }
  reportSeedIssue(seed.シードID, "CSV区切り文字の設定画面は無い。アプリの設定値がカンマであることを確かめた（書き換えていない）");
});

// ---- 取込ファイル ----

const FIXTURE_DIR = path.join(REPO_ROOT, "e2e", "fixtures", "m03-32");
const RUNTIME_DIR = path.join(STATE_DIR, "m03-32");
/** この機能のCSVのフォーマットの見出し（設計書 L0118〜L0121。雛形の見出しと同じ） */
const HEADER = "商品コード,基準価格";

/** 取込ファイルの場所（シードが用意したもの） */
export function m0332FilePath(file: string): string {
  const inFixture = path.join(FIXTURE_DIR, file);
  return fs.existsSync(inFixture) ? inFixture : path.join(RUNTIME_DIR, file);
}

/** シード表の状態・属性に、書かれた文字列がそのままあること（書き写しの誤りを止める） */
function expectInSeed(seedId: string, parts: string[]): void {
  const text = getSeed(seedId)["状態・属性"];
  for (const p of parts) if (!text.includes(p)) throw new Error(`${seedId}: シード表の状態・属性に「${p}」が無い`);
}

/** fixtures にある取込ファイルの中身が、シード表の見出し・データ（UTF-8・LF・末尾改行1つ）と同じこと */
function expectFixture(seedId: string, file: string, lines: string[]): void {
  expectInSeed(seedId, [file, ...lines.map((l) => `「${l}」`)]);
  const p = path.join(FIXTURE_DIR, file);
  if (!fs.existsSync(p)) throw new Error(`${seedId}: 取込ファイル ${p} が無い`);
  const want = lines.join("\n") + "\n";
  if (fs.readFileSync(p, "utf-8") !== want) throw new Error(`${seedId}: 取込ファイル ${p} の中身がシード表と違う`);
}

/** 実行のたびに .state/m03-32 に取込ファイルを作る */
function writeRuntime(file: string, bytes: Buffer | string): void {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  if (fs.existsSync(path.join(FIXTURE_DIR, file))) throw new Error(`${file} は fixtures にもある（どちらを使うか決まらない）`);
  fs.writeFileSync(path.join(RUNTIME_DIR, file), bytes);
}

/** 見出し「商品コード,基準価格」とデータ1行の UTF-8 のファイル（シード表の書き方「見出し「…」とデータ「…」を持つ」） */
function headerAndData(seedId: string, file: string, header: string, data: string | null): void {
  expectInSeed(seedId, data === null ? [file, `見出し「${header}」`] : [file, `見出し「${header}」`, `「${data}」`]);
  writeRuntime(file, data === null ? `${header}\n` : `${header}\n${data}\n`);
  reportSeedIssue(seedId, `${file}: シード表は文字コードを定めない。この機能のシード表の既定（UTF-8・カンマ区切り）で作った（LF・末尾改行1つ）`);
}

defineSeed("S-M03-32-DATA-014", async ({ seed }) => { headerAndData(seed.シードID, "normal-014.csv", HEADER, "HIGH-N-0001-014,1500"); });
defineSeed("S-M03-32-DATA-015", async ({ seed }) => { headerAndData(seed.シードID, "normal-015.csv", HEADER, "HIGH-N-0001-015,1500"); });
defineSeed("S-M03-32-DATA-019", async ({ seed }) => { headerAndData(seed.シードID, "no_data-019.csv", HEADER, null); });
defineSeed("S-M03-32-DATA-020", async ({ seed }) => { headerAndData(seed.シードID, "bad_header-020.csv", "商品番号,基準価格", "HIGH-N-0001-020,1500"); });

defineSeed("S-M03-32-DATA-026", async ({ seed }) => {
  // 「見出し1行と「HIGH-N-0001-026,1500」のデータ行5009行、末尾改行あり、改行数5010」
  expectInSeed(seed.シードID, ["limit-over-026.csv", "見出し1行", "「HIGH-N-0001-026,1500」のデータ行5009行", "末尾改行あり", "改行数5010"]);
  const text = HEADER + "\n" + "HIGH-N-0001-026,1500\n".repeat(5009);
  const newlines = (text.match(/\n/g) ?? []).length;
  if (newlines !== 5010) throw new Error(`${seed.シードID}: 作ったファイルの改行数が ${newlines}（シード表は5010）`);
  writeRuntime("limit-over-026.csv", text);
  reportSeedIssue(seed.シードID, "limit-over-026.csv: シード表は見出し行の値と文字コードを定めない。見出しはこの機能のCSVのフォーマットの見出し「商品コード,基準価格」" +
    "（設計書 L0118〜L0121・雛形と同じ）、文字コードはこの機能のシード表の既定（UTF-8）で作った");
});

/** 1×1 の画素1つ（不透明の白）の PNG のバイト列 */
export function onePixelPng(): Buffer {
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0); ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8ビット・RGBA
  const raw = Buffer.from([0, 255, 255, 255, 255]); // 行の先頭のフィルタ0と、画素1つ
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0)),
  ]);
}

defineSeed("S-M03-32-DATA-016", async ({ seed }) => {
  expectInSeed(seed.シードID, ["invalid.png", "有効な1ピクセルPNG画像"]);
  writeRuntime("invalid.png", onePixelPng());
});

// ---- 商品 ----

/** グッズ商品CSVの1行と、商品規格登録編集画面で入れる値（正本の作り方の値） */
export type 高額商品の作り方 = {
  商品コード: string; 商品名: string;
  CSV: { 基準価格: string; 販売価格: string; 買取価格: string };
  規格: 高額商品規格の入力;
};

/**
 * 正本の作り方: グッズ商品CSV登録で雛形をダウンロードし、1行を書いたCSVをアップロードする（商品IDは空・言語(ID)は日本語のID・
 * 商品公開ステータスと支店の商品公開ステータスは公開・サイズ1・重量1・商品カテゴリ(ID)はサプライ・グッズのカテゴリID・購入グループ名称は既存の
 * 購入グループの名称・原価単価10・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空）。商品マスターを商品コードで検索した
 * 行の商品IDを控え、その行から商品登録編集画面を開いて、取り込みで作られたNMの商品規格を商品規格登録編集画面で登録する。商品規格IDを控える。
 * 商品コードが固定で正本に清掃の手順が無いので、同じ商品コードの商品が残っていれば何も作らずに止める。
 */
export async function createHighPriceGoods(
  page: Page, seedId: string, v: 高額商品の作り方, labels: { 商品ID: string; 商品規格ID: string }, notes: Notes,
): Promise<void> {
  const warn = (m: string) => reportSeedIssue(seedId, m);
  const left = await productIdsByCode(page, v.商品コード);
  if (left.length > 0) {
    throw new Error(`${seedId}: 商品コード ${v.商品コード} の商品が前の実行で残っている（商品ID ${left.join("・")}）。正本に清掃の手順が無いので、同じDBでは流し直さない`);
  }
  const categoryId = await goodsCsvCategoryId(page, warn);
  await registerGoodsCsv(page, {
    what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId}.csv`, categoryId,
    lines: [{ code: v.商品コード, nameJp: v.商品名, nameEn: v.商品名, values: { "基準価格": v.CSV.基準価格, "販売価格": v.CSV.販売価格, "買取価格": v.CSV.買取価格 } }],
    common: { "原価単価": "10", "地域別販売制限": "0", "スマレジ連携フラグ": "0", "スマレジ商品コード": "", "部門ID": "" },
    onWarning: (w) => warn(`グッズ商品CSV登録で出た警告「${w}」`),
  });
  warn(`グッズ商品CSV（${v.商品コード}）: 正本の「確認モーダルでアップロードを確定する」の確認モーダルは出ず、「CSVファイルのアップロード」を押すと取り込まれた（依頼者の判断待ちの点）`);
  warn(`グッズ商品CSV: 商品カテゴリ(ID)はサプライ・グッズのカテゴリID ${categoryId}。商品公開ステータスは、正本の「2（公開）」でなく、画面のCSV形式の説明で公開を表す値を書いた`);
  const productId = await openProductEditByCode(page, v.商品コード);
  notes.set(labels.商品ID, productId);
  const classId = await registerHighPriceClass(page, productId, v.商品コード, v.規格, `${seedId}: 商品コード ${v.商品コード}`, warn);
  notes.set(labels.商品規格ID, classId);
  // 作ったあと、商品規格がシード表の状態になっていることをDBの参照で確かめる（違えばケースの前提が崩れるので止める）
  if (dbAvailable) {
    const s = 商品規格の状態(classId);
    const want = { 基準価格: v.規格.基準価格, 販売価格: v.規格.販売価格, 買取価格: v.規格.買取価格, セール: v.規格.セール, 高額商品コード: v.規格.高額商品コード };
    const got = s && { 基準価格: s.基準価格, 販売価格: s.販売価格, 買取価格: s.買取価格, セール: s.セール, 高額商品コード: s.高額商品コード };
    if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`${seedId}: 登録した商品規格が ${JSON.stringify(got)}（シード表は ${JSON.stringify(want)}）`);
  }
}

/** 正本「CSVインポート履歴に、用意したファイルと同じファイル名の行が無いことを確かめる」（画面で。DBは書き換えない） */
export async function expectNoSameNameHistory(page: Page, kind: 取込画面の種類, seedId: string, file: string): Promise<void> {
  const names = await new HighPriceCsvUploadPage(page, kind).allHistoryFileNames();
  if (names.includes(file)) {
    throw new Error(`${seedId}: ${kind}CSVアップロード画面のCSVインポート履歴に ${file} の行が残っている。正本はDBで消すと定めるが、DBは書き換えないので止める`);
  }
}

/** M03-32 のセール中の高額商品のシード（DATA-005・006）。基準価格1000・販売価格800・買取価格800・セールフラグ有効 */
async function saleProduct(browser: import("@playwright/test").Browser, seedId: string, n: string, notes: Notes): Promise<void> {
  const code = `HIGH-S-0001-${n}`;
  const file = `sale-${n}.csv`;
  expectInSeed(seedId, [`商品コード=${code}`, `高額商品コード=HP-M0332-${n}`, "セールフラグ有効", "基準価格1000", "販売価格800"]);
  expectFixture(seedId, file, [HEADER, `${code},1500`]);
  await withAdminSession(browser, M0332_ADMIN, async (page) => {
    if (n === "005") await expectNoSameNameHistory(page, "高額商品価格変更", seedId, file);
    await createHighPriceGoods(page, seedId, {
      商品コード: code, 商品名: code,
      CSV: { 基準価格: "1000", 販売価格: "800", 買取価格: "800" },
      規格: { 高額商品コード: `HP-M0332-${n}`, セール: true, 基準価格: "1000", 販売価格: "800", 買取価格: "800" },
    }, { 商品ID: `〔商品ID-M0332-${n}〕`, 商品規格ID: `〔商品規格ID-M0332-${n}〕` }, notes);
  });
  if (n === "005") reportSeedIssue(seedId, `同名取込履歴0件: 画面のCSVインポート履歴に ${file} の行が無いことを確かめた（DBでの削除は要らなかった）`);
}

defineSeed("S-M03-32-DATA-005", { needs: ["S-M03-32-ADM"] }, async ({ browser, seed, notes }) => { await saleProduct(browser, seed.シードID, "005", notes); });
defineSeed("S-M03-32-DATA-006", { needs: ["S-M03-32-ADM"] }, async ({ browser, seed, notes }) => { await saleProduct(browser, seed.シードID, "006", notes); });
