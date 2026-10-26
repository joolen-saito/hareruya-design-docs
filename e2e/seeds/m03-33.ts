/**
 * M03-33 セール用高額商品価格変更CSV登録の画面シード。正本: cases/M03-33_seed_data.tsv
 *
 * 作るのは、画面だけで用意できて、実装したケース（006・019・029・030・046・047・048）が使うシードだけ。
 * - S-M03-33-ADM: メンバー管理で試験管理者を登録する（M03-32 と同じ作り方）。管理者ID 33033 は画面で指定できない。
 * - S-M03-33-BRANCH-006・029・030・046・047・048: グッズ商品CSV登録で商品を作り、商品規格登録編集画面で
 *   セールフラグなし・基準価格1500・販売価格1500・買取価格600・高額商品コード＝商品コード（006 は帯URL https://before.example/ も）を入れる。
 *   「同名取込履歴0件」は、画面のCSVインポート履歴に同じファイル名の行が無いことを確かめる（正本どおり画面で）。
 *   取込ファイルは実行のたびに .state/m03-33 に作る（029 の 0バイトのファイルは fixtures/m03-33 にある）。
 *
 * 取込ファイルの作り方の注意（正本と画面・設計書の食い違い。記録の裁定案）:
 * - 正本は「雛形のヘッダ行の下に…7列のファイル」と書くが、画面の雛形（と設計書のCSVのフォーマット L0148〜L0157）の見出しは
 *   商品コード・販売価格・セールフラグ・帯URL・タグ(ID)の5列で、買取価格・スマレジ連携フラグの列が無い。
 *   ここでは正本の手順どおり、画面からダウンロードした雛形の見出し行（5列）の下に、正本が書いたデータ行（7つの値）をそのまま入れる。
 * - 030 の「雛形の正しい7列のヘッダ行だけ」は、雛形の見出し行（5列）だけで作る。
 *
 * 商品コードが固定のシードは、正本に清掃の手順が無い。同じ商品コードの商品が残っていれば作らずに止める（同じDBでは流し直さない）。
 */
import fs from "node:fs";
import path from "node:path";
import { Browser, expect, Page } from "@playwright/test";
import { REPO_ROOT, SETUP_ADMIN, STATE_DIR } from "../config/env";
import { getSeed } from "../lib/catalog";
import { csvLine, decodeCsvBytes, parseCsv } from "../lib/csv";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { downloadedBytes } from "../pages/admin/m03_21_shelf_number";
import { HighPriceCsvUploadPage } from "../pages/admin/m03_32_high_price_csv";
import { createHighPriceGoods, createTestAdmin, expectNoSameNameHistory, onePixelPng } from "./m03-32";

export const M0333_ADMIN: Account = { loginId: "m0333_admin", password: "Passw0rd!M0333" };

defineSeed("S-M03-33-ADM", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createTestAdmin(page, seed.シードID, "M03-33試験管理者", M0333_ADMIN));
  reportSeedIssue(seed.シードID, "管理者ID 33033 は画面のメンバー登録で指定できない（画面が振る）。ログインID・パスワード・稼働中は正本どおり");
  await withAdminSession(browser, M0333_ADMIN, async (page) => {
    const upload = new HighPriceCsvUploadPage(page, "セール用高額商品価格変更");
    await upload.open();
    await expect(upload.アップロードボタン, "M03-33試験管理者でセール用高額商品価格変更CSVアップロード画面を開けない").toBeVisible();
  });
});

const FIXTURE_DIR = path.join(REPO_ROOT, "e2e", "fixtures", "m03-33");
const RUNTIME_DIR = path.join(STATE_DIR, "m03-33");

/** 取込ファイルの場所（シードが用意したもの） */
export function m0333FilePath(file: string): string {
  const inFixture = path.join(FIXTURE_DIR, file);
  return fs.existsSync(inFixture) ? inFixture : path.join(RUNTIME_DIR, file);
}

function writeRuntime(file: string, bytes: Buffer | string): void {
  if (fs.existsSync(path.join(FIXTURE_DIR, file))) throw new Error(`${file} は fixtures にもある（どちらを使うか決まらない）`);
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  fs.writeFileSync(path.join(RUNTIME_DIR, file), bytes);
}

/** 画面の「雛形ファイルダウンロード」で得た雛形の見出し行（列名の並び） */
async function templateHeader(page: Page, seedId: string): Promise<string[]> {
  const upload = new HighPriceCsvUploadPage(page, "セール用高額商品価格変更");
  await upload.open();
  const rows = parseCsv(decodeCsvBytes(await downloadedBytes(await upload.downloadTemplate())));
  if (rows.length !== 1 || rows[0].length === 0) throw new Error(`${seedId}: 雛形が見出し行1行だけでない: ${JSON.stringify(rows)}`);
  reportSeedIssue(seedId, `画面の雛形の見出し行は「${rows[0].join(",")}」（${rows[0].length}列）。正本の「7列」と違う（記録の裁定案）`);
  return rows[0];
}

/** シード表の状態・属性に、書かれた文字列がそのままあること（書き写しの誤りを止める） */
function expectInSeed(seedId: string, parts: string[]): void {
  const text = getSeed(seedId)["状態・属性"];
  for (const p of parts) if (!text.includes(p)) throw new Error(`${seedId}: シード表の状態・属性に「${p}」が無い`);
}

/** シード表の状態・属性の「<ファイル名>=<データ行>」のデータ行（次の「／」まで） */
function dataRowInSeed(seedId: string, file: string): string {
  const text = getSeed(seedId)["状態・属性"];
  const m = new RegExp(`${file.replace(/[.]/g, "\\.")}=([^／]+)`).exec(text);
  if (!m) throw new Error(`${seedId}: シード表の状態・属性に ${file} のデータ行が無い`);
  return m[1];
}

/** M03-33 の通常（セール外）の高額商品。基準価格1500・販売価格1500・買取価格600・セールなし・高額商品コード＝商品コード */
async function offProduct(page: Page, seedId: string, n: string, notes: Notes, 帯URL?: string): Promise<void> {
  const code = `HP-OFF-01-${n}`;
  expectInSeed(seedId, [`商品コード=${code}`, "基準価格1500", "販売価格1500", "買取価格600", "セール無効", ...(帯URL ? [`帯URL=${帯URL}`] : [])]);
  await createHighPriceGoods(page, seedId, {
    商品コード: code, 商品名: `M0333-${n}`,
    CSV: { 基準価格: "1500", 販売価格: "1500", 買取価格: "600" },
    規格: { 高額商品コード: code, セール: false, 基準価格: "1500", 販売価格: "1500", 買取価格: "600", ...(帯URL ? { 帯URL } : {}) },
  }, { 商品ID: `〔商品ID-M0333-${n}〕`, 商品規格ID: `〔商品規格ID-M0333-${n}〕` }, notes);
}

type FileMaker = (page: Page, seedId: string) => Promise<string>;

/** 商品と取込ファイルを作り、CSVインポート履歴に同じファイル名の行が無いことを確かめる */
async function branchSeed(browser: Browser, seedId: string, n: string, notes: Notes, makeFile: FileMaker, 帯URL?: string): Promise<void> {
  await withAdminSession(browser, M0333_ADMIN, async (page) => {
    const file = await makeFile(page, seedId);
    await expectNoSameNameHistory(page, "セール用高額商品価格変更", seedId, file);
    await offProduct(page, seedId, n, notes, 帯URL);
    reportSeedIssue(seedId, `同名取込履歴0件: 画面のCSVインポート履歴に ${file} の行が無いことを確かめた`);
  });
}

/** 雛形の見出し行の下に、正本のデータ行を1行入れた UTF-8・カンマ区切りのファイル（LF・末尾改行1つ） */
function headerPlusRow(file: string, row: string): FileMaker {
  return async (page, seedId) => {
    const header = await templateHeader(page, seedId);
    writeRuntime(file, `${csvLine(header)}\n${row}\n`);
    return file;
  };
}

defineSeed("S-M03-33-BRANCH-006", { needs: ["S-M03-33-ADM"] }, async ({ browser, seed, notes }) => {
  // 「商品コードHP-OFF-01-006・販売価格1500・買取価格600・セールフラグ0・帯URLは空・タグ(ID)は空・スマレジ連携フラグ0のデータ行」
  //  （状態・属性「帯URLを空、他の値をHP-OFF-01-006,1500,600,0,タグ空,0とする」）。値の並びは正本の他のデータ行（off_on-001.csv など）と同じ
  expectInSeed(seed.シードID, ["belt_empty-006.csvは帯URLを空、他の値をHP-OFF-01-006,1500,600,0,タグ空,0とする"]);
  await branchSeed(browser, seed.シードID, "006", notes, headerPlusRow("belt_empty-006.csv", "HP-OFF-01-006,1500,600,0,,,0"), "https://before.example/");
});

defineSeed("S-M03-33-BRANCH-029", { needs: ["S-M03-33-ADM"] }, async ({ browser, seed, notes }) => {
  expectInSeed(seed.シードID, ["empty-029.csv=0バイト"]);
  await branchSeed(browser, seed.シードID, "029", notes, async () => {
    const p = path.join(FIXTURE_DIR, "empty-029.csv");
    if (!fs.existsSync(p) || fs.statSync(p).size !== 0) throw new Error(`${seed.シードID}: ${p} が 0バイトのファイルでない`);
    return "empty-029.csv";
  });
});

defineSeed("S-M03-33-BRANCH-030", { needs: ["S-M03-33-ADM"] }, async ({ browser, seed, notes }) => {
  expectInSeed(seed.シードID, ["header_only-030.csv=正しい7列ヘッダだけ"]);
  await branchSeed(browser, seed.シードID, "030", notes, async (page, seedId) => {
    const header = await templateHeader(page, seedId);
    writeRuntime("header_only-030.csv", `${csvLine(header)}\n`);
    reportSeedIssue(seedId, `header_only-030.csv: 正本の「正しい7列ヘッダ」は、画面の雛形の見出し行（${header.length}列）で作った`);
    return "header_only-030.csv";
  });
});

/** off_on-<n>.csv: 雛形の見出し行の下に、状態・属性に書いた off_on-<n>.csv のデータ行をそのまま入れる */
async function offOnSeed(browser: Browser, seedId: string, n: string, notes: Notes): Promise<void> {
  const file = `off_on-${n}.csv`;
  const row = dataRowInSeed(seedId, file);
  if (row !== `HP-OFF-01-${n},1200,700,1,https://replace-dev.hareruyamtg.com:8443/new,"2,3",1`) throw new Error(`${seedId}: ${file} のデータ行の読み取りが想定と違う: ${row}`);
  await branchSeed(browser, seedId, n, notes, headerPlusRow(file, row));
}

defineSeed("S-M03-33-BRANCH-046", { needs: ["S-M03-33-ADM"] }, async ({ browser, seed, notes }) => { await offOnSeed(browser, seed.シードID, "046", notes); });
defineSeed("S-M03-33-BRANCH-047", { needs: ["S-M03-33-ADM"] }, async ({ browser, seed, notes }) => { await offOnSeed(browser, seed.シードID, "047", notes); });

defineSeed("S-M03-33-BRANCH-048", { needs: ["S-M03-33-ADM"] }, async ({ browser, seed, notes }) => {
  expectInSeed(seed.シードID, ["invalid-048.pngは画像として有効なPNG"]);
  await branchSeed(browser, seed.シードID, "048", notes, async () => {
    writeRuntime("invalid-048.png", onePixelPng());
    return "invalid-048.png";
  });
});
