/**
 * M04-22 在庫移動・振替CSV登録の画面シード（店舗・試験管理者）。正本: cases/M04-22_seed_data.tsv
 * ケースごとの商品・在庫・CSV と、参照管理者・承認通知先の候補は seeds/m04-22-x.ts。
 *
 * - 店舗A・店舗B: 店舗登録で登録する（ほかの必須項目は「任意の値」として固定の値）。あれば内容を確かめて使う。
 *   同じ店名の店舗（開発環境には会社名の違う「店舗A」「店舗B」がある）と取り違えないよう、店名・会社名が一致する開店の店舗を探す（M04-24 の部品）。
 *   開発環境には、この値で登録済みの店舗がある（店舗は作ると消せないので、ケースごとには作らない）。
 * - 試験用の権限: 正本は「権限のマスターに試験用の権限を1行追加し、在庫管理の各機能にチェックを入れ、承認権限のチェックを外す」。
 *   権限のマスターは全員が使うマスタなので行を足さず、開発環境の既存の権限「店舗オペレーター」（承認権限だけが外れている）で読み替える。
 *   権限管理の表で、承認権限のチェックが外れていることを確かめてから使う（書き換えない）。
 * - メンバー m0422_edit: 開発環境に、手動テスト用の同じログインID・名前のメンバーがあるので、ログインID・名前・メールアドレスに実行の印を付ける。
 *   所属は選択肢の先頭（正本は「任意の所属」）、所属店舗とデフォルト検索表示店舗は店舗A、編集可能店舗は店舗A・店舗B。
 *   デフォルト検索表示店舗はシード表に無いが、メンバー登録画面で必須。
 */
import { Browser, expect } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { expectStore, findOpenStoreId, M0424StoreInput } from "../pages/admin/m04_24_store";
import { expectApprovalDenied } from "../pages/admin/m04_22_move_transfer_csv";

const EDIT_LOGIN = rc("m0422_edit").toLowerCase();
export const M0422_EDIT: Account = { loginId: EDIT_LOGIN, password: "Passw0rd!M0422" };
export const M0422_EDIT_NAME = rc("M04-22編集管理者");
/** 正本の「承認権限のチェックを外した試験用の権限」の読み替え（開発環境の既存の権限。承認権限だけが外れている） */
export const 承認なしの権限 = "店舗オペレーター";

const store = (店名: string, 英語: string, url: string, digit: string): M0424StoreInput => ({
  店名, 店名カナ: "テンポ", 店名英語: 英語, 支店URL: url, 店名略称3文字: digit, ショップ名略称: 店名,
  会社名: "M04-22試験会社", 会社名カナ: "エムゼロヨンニジュウニシケンガイシャ", 郵便番号: "160-0022", 都道府県: "東京都",
  住所1: "新宿区新宿4-22-1", 住所2: "試験ビル", 電話番号: "03-0422-0001",
});
export const STORE_A = store("店舗A", "Store A", "m0422a", "Q2A");
export const STORE_B = store("店舗B", "Store B", "m0422b", "Q2B");

/** 店舗A・店舗Bの店舗ID（プロセスの中で一度だけ確かめる） */
export const M0422の店舗 = { A: "", B: "" };

/** 店舗A・店舗Bを、あれば内容を確かめて使い、無ければ店舗登録画面で登録する。控えていなければ店舗IDを控える */
export async function 店舗を用意する(browser: Browser, notes: Notes, issue: (m: string) => void): Promise<{ A: string; B: string }> {
  if (!M0422の店舗.A || !M0422の店舗.B) {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      // 店舗は作ると消せず、1店で在庫の行が約39万行できる（開発環境 2026-11-11）。既にある店舗だけを使い、無ければ作らずに止める
      const 既存の店舗 = async (v: M0424StoreInput): Promise<string> => {
        const id = await findOpenStoreId(page, v.店名, v.会社名);
        if (!id) throw new Error(`店舗「${v.店名}」が開発環境に無い（店舗は作らない。判断待ち）`);
        await expectStore(page, id, v);
        return id;
      };
      M0422の店舗.A = await 既存の店舗(STORE_A);
      M0422の店舗.B = await 既存の店舗(STORE_B);
    });
  }
  if (!notes.has("〔店舗ID-M0422-共有A〕")) notes.set("〔店舗ID-M0422-共有A〕", M0422の店舗.A);
  if (!notes.has("〔店舗ID-M0422-共有B〕")) notes.set("〔店舗ID-M0422-共有B〕", M0422の店舗.B);
  return { ...M0422の店舗 };
}

defineSeed("S-M04-22-ADM-EDIT", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const s = await 店舗を用意する(browser, notes, issue);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await expectApprovalDenied(page, 承認なしの権限);
    issue(`試験用の権限は、権限のマスターに行を足さず、開発環境の既存の権限「${承認なしの権限}」（権限管理の表で承認権限だけが外れている）で読み替えた`);
    const id = await ensureMemberByStoreIds(page, {
      名前: M0422_EDIT_NAME, ログインID: M0422_EDIT.loginId, メールアドレス: `${EDIT_LOGIN}@example.test`, パスワード: M0422_EDIT.password,
      権限: 承認なしの権限, 所属店舗ID: s.A, デフォルト検索表示店舗ID: s.A, 編集可能店舗ID: [s.A, s.B],
    });
    notes.set("〔管理者ID-M0422-共有A〕", id);
  });
  // ログインでき、在庫管理の画面（在庫移動・振替検索一覧）を開けること
  await withAdminSession(browser, M0422_EDIT, async (page) => {
    const res = await page.goto(adminUrl("/product/stock/move_transfer"));
    expect(res?.status(), `${M0422_EDIT_NAME} で在庫移動・振替検索一覧を開ける`).toBe(200);
  });
});
