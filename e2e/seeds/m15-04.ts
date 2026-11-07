/**
 * M15-04 デッキ一括編集 のシード（画面操作）。正本: cases/M15-04_seed_data.tsv
 * - 名称には実行の印を付ける（前の実行の残りと重ならない）。検索語に使える前半に印を置く。
 * - 実装したのは 006 の連鎖試験（アーキタイプ2件・デッキ1件）。前面の確認が要るケースは実装しない。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { フォーマットを登録する } from "../pages/admin/m14_10_format";
import { アーキタイプを登録する } from "../pages/admin/m15_10_archetype";
import { デッキを登録する } from "../pages/admin/m15_deck";

export const M1504RJ_ADMIN: Account = { loginId: "m1504rj-adm", password: "Passw0rd-M1504RJ" };

const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>) =>
  withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

/** 006 の名前の前半（検索語「RJ1504-001-型」の「RJ1504-001」に実行の印を付けた値） */
export const 語RJ = () => rc("RJ1504-001");

defineSeed("S-M15-04-RJ-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M15-04連鎖試験管理者", account: M1504RJ_ADMIN, メール: "m1504rj-adm@example.test" });
});

defineSeed("S-M15-04-RJ-DECK-006", { needs: ["S-M15-04-RJ-ADM"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 管理画面(browser, async (p) => {
    const 基 = 語RJ();
    const F = `${基}-フォーマット`;
    await フォーマットを登録する(p, { 名日: F, 名英: `${基}-Format`, 並び順: "9741", メタ日数: "14", チェック: { rankingFlg: true } }, seed.シードID);
    await アーキタイプを登録する(p, { 日: `${基}-型甲`, 英: `${基}-TypeA`, フォーマット: F, 公開状態: "公開" });
    await アーキタイプを登録する(p, { 日: `${基}-型乙`, 英: `${基}-TypeB`, フォーマット: F, 公開状態: "公開" });
    notes.set("〔デッキID-M1504-RJ001〕", await デッキを登録する(p, { デッキ名: `${基}-デッキ`, デッキタイプ: "event", フォーマット: F, アーキタイプ: `${基}-型甲`, 公開状態: "非公開" }, issue));
  });
});
