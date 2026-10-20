/**
 * M03-29 売上分析タグ更新CSV登録の画面シード。正本: cases/M03-29_seed_data.tsv
 *
 * 作るのは、画面だけで用意できて、実装したケース（008・031・033・035・043）が使うシードだけ。
 * - S-M03-29-ADM: メンバー管理で試験管理者を登録する（M03-14 と同じ作り方。システム管理者の権限）。
 * - S-M03-29-CONFIG: 管理画面に「CSV取込設定」の画面が無い（区切り文字・囲み文字はアプリの設定ファイルの値）。
 *   設定を書き換えず、値がシード表の状態（カンマ・二重引用符）であることだけを確かめる（違えば止める）。
 * - S-M03-29-CASE-033・CASE-035・HDRONLY-043: 取込ファイル。画面が振る番号を書かないので、
 *   CASE-035・HDRONLY-043 は e2e/fixtures/m03-29 のファイルの中身を照合し、CASE-033 はここで作る（fixtures では保留になっている）。
 *
 * 作らないシード（使うケースも実装しない）:
 * - S-M03-29-MASTER: 売上分析タグを指定のID（20・21・22・23・234）でDBへ登録する。画面の登録はIDを指定できない。
 * - S-M03-29-HISTORY-001・HISTORY-PAGING-002〜005・HISTORY-006・007: 取込履歴をDB投入スクリプトで登録・退避する。
 * - S-M03-29-CASE-027〜029: 5009〜5010件の商品をDBで登録する。
 * - S-M03-29-CASE-009〜026・030・032、NOTAG-045、TWICE-046、L-041、L-042: グッズ商品CSV登録で商品を作る。
 *   いまの手元のDBは、グッズ商品の取込が受け付けるカテゴリの固定ID（2・4・5）がサプライ・グッズ（ID 61）と合わず、商品を作れない。
 *   また、L-041・L-042 以外は取込履歴を0件にする操作をDBへ直接行う。
 * - S-M03-29-BROWSER・CASE-034・NOPROD-044・L-ADM・L-CONFIG: 使うケース（001〜007・034・044・041・042）を、上の理由で実装しないので作らない。
 */
import fs from "node:fs";
import path from "node:path";
import { expect, Page } from "@playwright/test";
import { REPO_ROOT, SETUP_ADMIN, STATE_DIR } from "../config/env";
import { CSV入出力設定 } from "../lib/app_config";
import { getSeed } from "../lib/catalog";
import { csvLine } from "../lib/csv";
import { defineSeed } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { ensureMember } from "../pages/admin/member";
import { SalesTagCsvUploadPage } from "../pages/admin/m03_29_sales_tag_csv_upload";

export const M0329_ADMIN: Account = { loginId: "m0329_admin", password: "Passw0rd!M0329" };

/** 正本は所属店舗を指定しない。管理画面で利用可能な店舗を1つ選び、商品管理を操作できるシステム管理者の権限を付ける（M03-14 と同じ作り方） */
async function createAdmin(page: Page): Promise<void> {
  await page.goto(adminUrl("/setting/system/member/new"));
  const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((options) => options
    .map((option) => option as HTMLOptionElement)
    .filter((option) => option.value !== "")
    .map((option) => option.textContent?.trim() ?? "")
    .filter(Boolean));
  if (stores.length === 0) throw new Error("S-M03-29-ADM: メンバーに割り当てられる店舗が画面に無い");
  const store = stores[0];
  await ensureMember(page, {
    名前: "M03-29試験管理者", 所属店舗: store, ログインID: M0329_ADMIN.loginId, メールアドレス: "m0329_admin@example.test",
    パスワード: M0329_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: store, 編集可能店舗: [store],
  });
}

defineSeed("S-M03-29-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page));
  // ログインでき（稼働中・ロックなし）、売上分析タグ更新CSVアップロード画面を開けることを、ケースとは別のセッションで確かめる
  await withAdminSession(browser, M0329_ADMIN, async (page) => {
    const upload = new SalesTagCsvUploadPage(page);
    await upload.open();
    await expect(upload.アップロードボタン, "M03-29試験管理者で売上分析タグ更新CSVアップロード画面を開けない").toBeVisible();
  });
});

defineSeed("S-M03-29-CONFIG", async () => {
  // 管理画面に設定項目が無い。設定を書き換えず、取込の区切り文字・囲み文字がシード表の状態であることだけを確かめる（違えば止める）。
  const c = CSV入出力設定();
  const got = { 取込区切り文字: c.取込区切り文字, 取込囲み文字: c.取込囲み文字 };
  const want = { 取込区切り文字: ",", 取込囲み文字: '"' };
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    throw new Error(`S-M03-29-CONFIG: CSV取込の設定が ${JSON.stringify(got)}（シード表は区切り文字=カンマ・囲み文字=二重引用符）。設定を直してアプリのキャッシュを作り直してから流す`);
  }
});

// ---- 取込ファイル ----

/** 取込ファイルの中身（1行目が見出し）。どれも UTF-8・改行は LF・末尾に改行1個（fixtures の README と同じ決め方） */
type CsvSpec = { file: string; rows: string[][]; fixture: boolean };

/** 正規見出し（売上分析タグ更新CSV登録画面の雛形と同じ見出し行） */
const HEADER = ["商品ID", "売上分析タグ(ID)"];

/** 正本の状態・属性に書かれたファイル（画面が振る番号は使わない） */
const CSV_SPECS: Record<string, CsvSpec> = {
  // 「正規見出しと商品ID 329033・売上分析タグ(ID)「21,22」を持つ」。21,22 は1つの欄の値なので、二重引用符で囲む（取込の囲み文字）
  "S-M03-29-CASE-033": { file: "replace-M0329-033.csv", rows: [HEADER, ["329033", "21,22"]], fixture: false },
  // 「見出し「商品番号」「売上分析タグ(ID)」と商品ID 329035・タグID 21を持つ」
  "S-M03-29-CASE-035": { file: "bad-header-M0329-035.csv", rows: [["商品番号", "売上分析タグ(ID)"], ["329035", "21"]], fixture: true },
  // 「正規見出し（商品ID・売上分析タグ(ID)）の1行だけを持ち、データ行は0行」
  "S-M03-29-HDRONLY-043": { file: "header-only-M0329-043.csv", rows: [HEADER], fixture: true },
};

const FIXTURE_DIR = path.join(REPO_ROOT, "e2e", "fixtures", "m03-29");
const RUNTIME_DIR = path.join(STATE_DIR, "m03-29");

/** ケースが取込ファイルに指定するファイルの場所（シードが用意したもの） */
export function m0329CsvPath(file: string): string {
  const spec = Object.values(CSV_SPECS).find((s) => s.file === file);
  if (!spec) throw new Error(`${file} は M03-29 のシードが用意するCSVファイルでない`);
  return path.join(spec.fixture ? FIXTURE_DIR : RUNTIME_DIR, file);
}

/** 正本の状態・属性に、ファイル名と、見出し・データ行の値がそのまま書かれていること（書き写しの誤りを止める） */
function expectSpecMatchesSeed(seedId: string, spec: CsvSpec): void {
  const text = getSeed(seedId)["状態・属性"];
  if (!text.includes(spec.file)) throw new Error(`${seedId}: シード表の状態・属性にファイル名 ${spec.file} が無い`);
  const [header, ...body] = spec.rows;
  if (header !== HEADER && !header.every((h) => text.includes(`「${h}」`))) throw new Error(`${seedId}: シード表の見出しが「${header.join("」「")}」でない`);
  if (header === HEADER && !text.includes("正規見出し")) throw new Error(`${seedId}: シード表が正規見出しのファイルと書いていない`);
  for (const row of body) for (const v of row) if (!text.includes(v)) throw new Error(`${seedId}: シード表の状態・属性に値「${v}」が無い`);
}

/** 取込ファイルを用意する。fixtures にあるものは中身を照合し、無いものはここで作る */
function prepareCsv(seedId: string): void {
  const spec = CSV_SPECS[seedId];
  if (!spec) throw new Error(`${seedId}: CSVファイルの中身が定義されていない`);
  expectSpecMatchesSeed(seedId, spec);
  const want = spec.rows.map((r) => csvLine(r)).join("\n") + "\n";
  const file = m0329CsvPath(spec.file);
  if (!spec.fixture) {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    fs.writeFileSync(file, want, "utf-8");
  }
  if (!fs.existsSync(file)) throw new Error(`${seedId}: CSVファイル ${file} が無い`);
  if (fs.readFileSync(file, "utf-8") !== want) throw new Error(`${seedId}: CSVファイル ${file} の中身がシード表と違う`);
}

defineSeed("S-M03-29-CASE-033", async ({ seed }) => { prepareCsv(seed.シードID); });
defineSeed("S-M03-29-CASE-035", async ({ seed }) => { prepareCsv(seed.シードID); });
defineSeed("S-M03-29-HDRONLY-043", async ({ seed }) => { prepareCsv(seed.シードID); });
