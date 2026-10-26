/**
 * M03-27 グッズ商品CSV登録の画面シード。正本: cases/M03-27_seed_data.tsv
 *
 * 作るのは、画面だけで用意できて、実装したケース（005・039）が使うシード（S-M03-27-ADM）だけ。
 * - S-M03-27-ADM: メンバー管理で試験管理者を登録する（ほかの機能と同じ作り方。システム管理者の権限）。
 *
 * 作らないシード（使うケースも実装しない）: S-M03-27-MASTER（各マスタ・カテゴリ階層・店舗・在庫場所をDBシードで投入）、
 * HISTORY-001〜004（取込履歴をDBシードで投入）、取込履歴・価格履歴・原価単価・発送日目安などをDBへ直接設定するもの、
 * QB-・RB-（固定のマスタをDBで登録）。実装しなかったケースと理由は記録（e2e/review/M03-27_progress_2026-10-21.md）。
 */
import { expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { CsvUploadPage } from "../pages/admin/m03_26_card_csv_upload";
import { ensureMember } from "../pages/admin/member";

export const M0327_ADMIN: Account = { loginId: "m0327_admin", password: "Passw0rd!M0327" };

/** 正本は所属店舗を指定しない。管理画面で利用可能な店舗を1つ選び、商品管理を操作できるシステム管理者の権限を付ける */
async function createAdmin(page: Page): Promise<void> {
  await page.goto(adminUrl("/setting/system/member/new"));
  const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((options) => options
    .map((option) => option as HTMLOptionElement)
    .filter((option) => option.value !== "")
    .map((option) => option.textContent?.trim() ?? "")
    .filter(Boolean));
  if (stores.length === 0) throw new Error("S-M03-27-ADM: メンバーに割り当てられる店舗が画面に無い");
  const store = stores[0];
  await ensureMember(page, {
    名前: "M03-27試験管理者", 所属店舗: store, ログインID: M0327_ADMIN.loginId, メールアドレス: "m0327_admin@example.test",
    パスワード: M0327_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: store, 編集可能店舗: [store],
  });
}

defineSeed("S-M03-27-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page));
  // ログインでき（稼働中・ロックなし）、グッズ商品CSVアップロード画面を開けることを、ケースとは別のセッションで確かめる
  await withAdminSession(browser, M0327_ADMIN, async (page) => {
    const upload = new CsvUploadPage(page, "グッズ商品");
    await upload.open();
    await expect(upload.アップロードボタン, "M03-27試験管理者でグッズ商品CSVアップロード画面を開けない").toBeVisible();
  });
});
