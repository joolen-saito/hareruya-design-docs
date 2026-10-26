/**
 * M04-22 在庫移動・振替CSV登録の画面シード。正本: cases/M04-22_seed_data.tsv
 *
 * 作るのは、画面だけで準備できるケース（001・002。モーダルが開くことを見るもの）が使う S-M04-22-ADM-EDIT だけ。
 * - 店舗A・店舗B: 店舗登録で登録する（ほかの必須項目は「任意の値」として固定の値）。あれば内容を確かめて使う。
 *   同じ店名の閉店の店舗と取り違えないよう、店名・会社名が一致する開店の店舗を探す（M04-24 の部品）。
 * - 試験用の権限: マスタデータ管理で権限のマスターに1行足し、権限管理でその行の「承認権限」のチェックを外す。
 *   正本の「在庫管理の各機能にチェックを入れ」は、権限管理の表に承認権限の列しか無い（在庫管理の機能ごとの列が無い）ので、
 *   新しい権限がはじめから持つ「すべて許可」のままにした（記録の注記）。
 * - メンバー m0422_edit: 所属は選択肢の先頭（正本は「任意の所属」）、所属店舗とデフォルト検索表示店舗は店舗A、
 *   編集可能店舗は店舗A・店舗B。デフォルト検索表示店舗はシード表に無いが、メンバー登録画面で必須。
 * - S-M04-22-BASES（在庫区分・移動タイプなどのDBへの直接設定）を含むケースは実装しないので、BASES は作らない。
 */
import { expect } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { ensureStore, M0424StoreInput } from "../pages/admin/m04_24_store";
import { denyApprovalForAuthority, ensureAuthorityMasterRow } from "../pages/admin/m04_22_move_transfer_csv";

export const M0422_EDIT: Account = { loginId: "m0422_edit", password: "Passw0rd!M0422" };
const EDIT_NAME = "M04-22編集管理者";
/** 正本は「試験用の権限」とだけ書く。名前はこの機能の試験用と分かるものにした */
const EDIT_AUTHORITY = "M04-22試験権限（承認なし）";

const store = (店名: string, 英語: string, url: string, digit: string): M0424StoreInput => ({
  店名, 店名カナ: "テンポ", 店名英語: 英語, 支店URL: url, 店名略称3文字: digit, ショップ名略称: 店名,
  会社名: "M04-22試験会社", 会社名カナ: "エムゼロヨンニジュウニシケンガイシャ", 郵便番号: "160-0022", 都道府県: "東京都",
  住所1: "新宿区新宿4-22-1", 住所2: "試験ビル", 電話番号: "03-0422-0001",
});
export const STORE_A = store("店舗A", "Store A", "m0422a", "Q2A");
export const STORE_B = store("店舗B", "Store B", "m0422b", "Q2B");

defineSeed("S-M04-22-ADM-EDIT", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const a = await ensureStore(page, STORE_A, issue);
    const b = await ensureStore(page, STORE_B, issue);
    notes.set("〔店舗ID-M0422-共有A〕", a);
    notes.set("〔店舗ID-M0422-共有B〕", b);
    await ensureAuthorityMasterRow(page, EDIT_AUTHORITY);
    await denyApprovalForAuthority(page, EDIT_AUTHORITY);
    issue(`試験用の権限「${EDIT_AUTHORITY}」は、権限管理の表に承認権限の列しか無いので、承認権限のチェックだけを外した（ほかは新しい権限の既定の「すべて許可」）`);
    const id = await ensureMemberByStoreIds(page, {
      名前: EDIT_NAME, ログインID: M0422_EDIT.loginId, メールアドレス: "m0422_edit@example.test", パスワード: M0422_EDIT.password,
      権限: EDIT_AUTHORITY, 所属店舗ID: a, デフォルト検索表示店舗ID: a, 編集可能店舗ID: [a, b],
    });
    notes.set("〔管理者ID-M0422-共有A〕", id);
  });
  // ログインでき、在庫管理の画面（在庫移動・振替検索一覧）を開けること
  await withAdminSession(browser, M0422_EDIT, async (page) => {
    const res = await page.goto(adminUrl("/product/stock/move_transfer"));
    expect(res?.status(), "m0422_edit で在庫移動・振替検索一覧を開ける").toBe(200);
  });
});
