/**
 * M03-26 カード商品CSV登録の画面シード。正本: cases/M03-26_seed_data.tsv
 *
 * 作るのは、画面だけで用意できて、実装したケース（005・030・031・035）が使うシードだけ。
 * - S-M03-26-ADM: メンバー管理で試験管理者を登録する（ほかの機能と同じ作り方。システム管理者の権限）。
 * - S-M03-26-FORMAT-035: カード商品CSVアップロード画面の「雛形ファイルダウンロード」で取得した雛形を、データ行を足さずに header-only.csv として保存する。
 *
 * 作らないシード（使うケースも実装しない）:
 * - S-M03-26-MASTER: 各マスタ・商品カテゴリ階層・店舗・在庫場所をDBシードで登録する（これを使うケースはすべて実装しない）。
 * - S-M03-26-PAGING-001〜004: 取込履歴をDBシードで登録する。
 * - S-M03-26-FORMAT-036・037: 正本はデータ行の列数（30列・見出しと同じ列数）だけを書き、各欄の値を書かない。
 *   値を空にすると必須の誤りでも取り込まれないので、列数の判定が無くても期待結果が成り立ってしまう（偽の合格）。
 *   取込可能な値はマスタ（S-M03-26-MASTER。DBシード）に依るので、推測で作らない。
 */
import fs from "node:fs";
import path from "node:path";
import { expect, Page } from "@playwright/test";
import { SETUP_ADMIN, STATE_DIR } from "../config/env";
import { decodeCsvBytes, parseCsv } from "../lib/csv";
import { defineSeed } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { CsvUploadPage } from "../pages/admin/m03_26_card_csv_upload";
import { downloadedBytes } from "../pages/admin/m03_21_shelf_number";
import { ensureMember } from "../pages/admin/member";

export const M0326_ADMIN: Account = { loginId: "m0326_admin", password: "Passw0rd!M0326" };

/** 正本は所属店舗を指定しない。管理画面で利用可能な店舗を1つ選び、商品管理を操作できるシステム管理者の権限を付ける */
async function createAdmin(page: Page): Promise<void> {
  await page.goto(adminUrl("/setting/system/member/new"));
  const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((options) => options
    .map((option) => option as HTMLOptionElement)
    .filter((option) => option.value !== "")
    .map((option) => option.textContent?.trim() ?? "")
    .filter(Boolean));
  if (stores.length === 0) throw new Error("S-M03-26-ADM: メンバーに割り当てられる店舗が画面に無い");
  const store = stores[0];
  await ensureMember(page, {
    名前: "M03-26試験管理者", 所属店舗: store, ログインID: M0326_ADMIN.loginId, メールアドレス: "m0326_admin@example.test",
    パスワード: M0326_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: store, 編集可能店舗: [store],
  });
}

defineSeed("S-M03-26-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page));
  // ログインでき（稼働中・ロックなし）、カード商品CSVアップロード画面を開けることを、ケースとは別のセッションで確かめる
  await withAdminSession(browser, M0326_ADMIN, async (page) => {
    const upload = new CsvUploadPage(page, "カード商品");
    await upload.open();
    await expect(upload.アップロードボタン, "M03-26試験管理者でカード商品CSVアップロード画面を開けない").toBeVisible();
  });
});

const RUNTIME_DIR = path.join(STATE_DIR, "m03-26");

/** ケースが取込ファイルに指定するファイルの場所（シードが用意したもの） */
export function m0326CsvPath(file: string): string {
  return path.join(RUNTIME_DIR, file);
}

defineSeed("S-M03-26-FORMAT-035", { needs: ["S-M03-26-ADM"] }, async ({ browser }) => {
  await withAdminSession(browser, M0326_ADMIN, async (page) => {
    const upload = new CsvUploadPage(page, "カード商品");
    await upload.open();
    const bytes = await downloadedBytes(await upload.downloadTemplate());
    const rows = parseCsv(decodeCsvBytes(bytes));
    if (rows.length !== 1) throw new Error(`S-M03-26-FORMAT-035: 雛形が見出しの1行だけでない（${rows.length}行）`);
    // 正本「データ行を足さずにファイル名を header-only.csv にして保存する」: ダウンロードしたバイト列をそのまま保存する
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    fs.writeFileSync(m0326CsvPath("header-only.csv"), bytes);
  });
});
