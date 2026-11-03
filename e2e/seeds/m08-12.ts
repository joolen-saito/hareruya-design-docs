/**
 * M08-12 顧客グループ管理の画面シード。正本: cases/M08-12_seed_data.tsv
 *
 * - 管理者（ADM）: メンバー管理で登録する。
 * - 顧客グループ: 顧客グループ管理画面で新規追加し、一覧の名称リンクから顧客グループIDを控える。名称には実行の印を付ける（前の実行の残りと取り違えない）。
 * - 会員: フロントの会員登録で作り、管理画面の会員編集で顧客グループと本会員を選ぶ。メールアドレスの前半には実行の印を付ける。
 *   プレイヤーIDは、正本は「イベント申込登録のプレイヤー検索」で控えると書くが、会員の保存内容と同じ番号なので、DBの参照（SELECT）で控える（申込画面を開かない）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 会員のプレイヤーID } from "../db/m08_12";
import { rc } from "../lib/run_marker";
import { defineSeed, SeedCtx } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { ensureM08Admin } from "../pages/admin/m08_common";
import { M08CustomerGroupPage } from "../pages/admin/m08_customer_group";
import { 管理画面で会員を整える, mailOf, 会員を登録する } from "./m08-common";

export const M0812_ADMIN: Account = { loginId: "m0812_admin", password: "Passw0rd!M0812" };

defineSeed("S-M08-12-ADM", async ({ browser }) => { await ensureM08Admin(browser, "M08-12試験管理者", M0812_ADMIN); });

/** 名称に実行の印を付けた顧客グループの名称 */
export const 名称 = (正本の名称: string): string => rc(正本の名称);

async function グループを作る(browser: Browser, 名称の値: string, 還元率: string, 店内: boolean, 支店: boolean): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const g = new M08CustomerGroupPage(page);
    await g.open();
    await g.入れる({ 名称: 名称の値, 還元率, 店内注文専用: 店内, 支店店内注文専用: 支店 });
    const r = await g.登録する();
    if (!r.sent) throw new Error(`顧客グループ「${名称の値}」の登録: ブラウザの入力チェックが送信を止めた`);
    await g.open();
    return g.名称リンクを押してIDを読む(名称の値);
  });
}

async function 名称で消す(browser: Browser, 名称の値: string): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await new M08CustomerGroupPage(page).名称で消す(名称の値);
  });
}

// 名称が「ない」状態にするシード（正本の名称のまま。消すのはこの名称の顧客グループだけ）
defineSeed("S-M08-12-NEW-007", async ({ browser }) => { await 名称で消す(browser, "新規遷移確認グループ"); });
defineSeed("S-M08-12-NEW-028", async ({ browser }) => { await 名称で消す(browser, "トークン不正追加"); });

for (const k of ["023", "024", "031", "032"]) {
  defineSeed(`S-M08-12-DELETE-FREE-${k}`, async ({ browser, notes }) => {
    notes.set(`〔顧客グループID-M0812-${k}〕`, await グループを作る(browser, 名称(`削除対象顧客グループ-${k}`), "3", false, false));
  });
}
defineSeed("S-M08-12-STALE-034", async ({ browser, notes }) => {
  notes.set("〔顧客グループID-M0812-034〕", await グループを作る(browser, 名称("削除後操作確認グループ-034"), "6", false, false));
});

/** 顧客グループを作り、会員を登録して、その顧客グループに所属させる。呼び名を控える */
async function 所属会員つき(ctx: SeedCtx, k: string, グループ名: string, 還元率: string, 店内: boolean, 支店: boolean, メール前半: string, 姓: string, パスワード?: string): Promise<void> {
  const { browser, notes } = ctx;
  notes.set(`〔顧客グループID-M0812-${k}〕`, await グループを作る(browser, グループ名, 還元率, 店内, 支店));
  const { 会員ID } = await 会員を登録する(browser, notes, メール前半, { 姓, 名: "会員", セイ: "シケン", メイ: "カイイン", パスワード }, `〔会員ID-M0812-${k}〕`);
  await 管理画面で会員を整える(browser, 会員ID, async (edit) => {
    await edit.選ぶ("Player][CustomerGroup", グループ名);
    await edit.選ぶ("status", "本会員");
    await edit.登録する();
    const err = await edit.エラー文();
    if (err.length || (await edit.成功メッセージ()) === null) throw new Error(`会員ID ${会員ID} の顧客グループ指定の保存に失敗: ${err.join(" / ")}`);
  });
  const p = 会員のプレイヤーID(会員ID);
  if (!p) throw new Error(`会員ID ${会員ID} のプレイヤーIDをDBの参照で控えられない`);
  notes.set(`〔プレイヤーID-M0812-${k}〕`, p);
}
for (const k of ["025", "026"]) {
  defineSeed(`S-M08-12-MEMBER-LINKED-${k}`, async (ctx) => {
    await 所属会員つき(ctx, k, 名称(`会員登録済み顧客グループ-${k}`), "4", false, false, `m0812-${k}`, `試験${k}`);
  });
}
export const 会員メール = (前半: string): string => mailOf(前半);
export const PW047 = "Passw0rd-CBM0812047";
export const PW048 = "Passw0rd-CBM0812048";
defineSeed("S-M08-12-CBNONEMY-047", async (ctx) => {
  await 所属会員つき(ctx, "047", 名称("CB顧客グループ-M0812CB047"), "0", false, false, "cbm0812-047", "試験M0812CB047", PW047);
});
defineSeed("S-M08-12-CBBRMY-048", async (ctx) => {
  await 所属会員つき(ctx, "048", 名称("CB顧客グループ-M0812CB048"), "0", false, true, "cbm0812-048", "試験M0812CB048", PW048);
});
