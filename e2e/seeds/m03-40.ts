/**
 * M03-40 棚番号更新CSV登録の画面シード。正本: cases/M03-40_seed_data.tsv
 *
 * 実装したのは、DBでの準備が要らず、取込ファイルの中身が正本の値で決まるシードだけ（管理者・CSV取込設定・DATA-016）。
 * 棚番号（S-001-004 などの名称は棚番号登録/編集画面の名称の形式チェックを通らない）をDBへ直接設定するシード、
 * 取込履歴をDBで登録・0件にするシードは作らない（記録 e2e/review/M03-40_progress_2026-10-21.md）。
 */
import { expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { CSV入出力設定 } from "../lib/app_config";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { ensureMember } from "../pages/admin/member";
import { CsvFile } from "../pages/admin/m03_38_product_status_csv";
import { ShelfNumberCsvScreen } from "../pages/admin/m03_40_shelf_number_csv";

export const M0340_ADMIN: Account = { loginId: "m0340_admin", password: "Passw0rd!M0340" };

/** 棚番号更新CSVの正規の見出し（設計書 M03-40 の棚番号更新CSVフォーマット 識別ID 1・2。L0108・L0109） */
export const SHELF_CSV_HEADERS = ["商品コード", "棚番号名称"];

/** 正本は所属店舗を指定しない。管理画面で利用可能な店舗の先頭を選び、商品管理を操作できるシステム管理者の権限を付ける（M03-41 と同じ作り方） */
async function createAdmin(page: Page): Promise<void> {
  await page.goto(adminUrl("/setting/system/member/new"));
  const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((options) => options
    .map((option) => option as HTMLOptionElement)
    .filter((option) => option.value !== "")
    .map((option) => option.textContent?.trim() ?? "")
    .filter(Boolean));
  if (stores.length === 0) throw new Error("S-M03-40-ADM: メンバーに割り当てられる店舗が画面に無い");
  const store = stores[0];
  await ensureMember(page, {
    名前: "M03-40試験管理者", 所属店舗: store, ログインID: M0340_ADMIN.loginId, メールアドレス: "m0340_admin@example.test",
    パスワード: M0340_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: store, 編集可能店舗: [store],
  });
}

defineSeed("S-M03-40-ADM", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page));
  // ログインでき（稼働中・ロックなし）、商品管理の棚番号更新CSV登録画面を開けることを、ケースとは別のセッションで確かめる
  await withAdminSession(browser, M0340_ADMIN, async (page) => {
    const csv = new ShelfNumberCsvScreen(page);
    await csv.open();
    await expect(csv.アップロードボタン, "M03-40試験管理者で棚番号更新CSV登録画面を開けない").toBeVisible();
  });
  reportSeedIssue(seed.シードID, "シード表の管理者ID 34000001 は、メンバー管理の画面では指定できない（画面が振る）。ログインID・表示名・パスワード・権限はシード表どおりに作った");
});

/**
 * 正本: 各ケースが開始時に区切り文字（カンマかセミコロン）とアップロードサイズ上限5MBを設定する。
 * 管理画面に設定項目が無いアプリの設定なので、書き換えず、値を確かめるだけにする。カンマのケースだけを実装した
 * （セミコロンの013・039は実装していない）。取込・出力の区切り文字がカンマ、上限が5MBでなければ止める。
 */
defineSeed("S-M03-40-CONFIG", async ({ seed }) => {
  const c = CSV入出力設定();
  const got = { 取込区切り文字: c.取込区切り文字, 出力区切り文字: c.出力区切り文字, アップロード上限MB: c.アップロード上限MB };
  const want = { 取込区切り文字: ",", 出力区切り文字: ",", アップロード上限MB: 5 };
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    throw new Error(`${seed.シードID}: CSVの設定が ${JSON.stringify(got)}（カンマのケースは ${JSON.stringify(want)}）。設定ファイルは書き換えない決まりなので止める`);
  }
});

// ---- 取込ファイル ----

const files = new Map<string, CsvFile & { 内容の要約: string }>();

export function shelfCsvFile(name: string): CsvFile & { 内容の要約: string } {
  const f = files.get(name);
  if (!f) throw new Error(`${name} はシードがまだ作っていない`);
  return f;
}

/**
 * DATA-016: 正規見出しと「4030,S-002-016」のデータレコード110000件の UTF-8 CSV（テスト用ファイル生成処理で作る）。
 * 改行は正本に指定が無いので LF（末尾に改行1個。e2e/fixtures の既存の静的ファイルと同じ）、BOM は付けない。
 */
defineSeed("S-M03-40-DATA-016", async () => {
  const name = "m0340-110000-016.csv";
  const records = 110000;
  const text = `${SHELF_CSV_HEADERS.join(",")}\n${"4030,S-002-016\n".repeat(records)}`;
  const bytes = Buffer.from(text, "utf-8");
  const dataLines = text.split("\n").filter(Boolean).length - 1;
  if (dataLines !== records) throw new Error(`m0340-110000-016.csv のデータレコードが ${dataLines} 件（${records} 件のはず）`);
  files.set(name, {
    name, bytes,
    内容の要約: `見出し「${SHELF_CSV_HEADERS.join(",")}」＋データ「4030,S-002-016」×${records}件（UTF-8・LF・${bytes.length}バイト）`,
  });
});
