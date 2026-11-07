/**
 * M15-03 デッキ一括削除 のシード（画面操作）。正本: cases/M15-03_seed_data.tsv
 * - 名称には実行の印を付ける（前の実行の残りと重ならない）。検索語に使える前半に印を置く。
 * - 実装したのは 004 のページ送りの確認データ（デッキ14件）。前面の確認が要るケース・DB での準備が要るケースは実装しない。
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

export const M1503QM_ADMIN: Account = { loginId: "m1503qm-adm", password: "Passw0rd-M1503QM" };

const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>) =>
  withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

/** 004 の名前の前半（「M1503-CB004-選手NN」の「M1503-CB004」に実行の印を付けた値） */
export const 語CB004 = () => rc("M1503-CB004");
export const 選手名 = (nn: string) => `${語CB004()}-選手${nn}`;

defineSeed("S-M15-03-QM-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M15-03連携試験の管理者", account: M1503QM_ADMIN, メール: "m1503qm-adm@example.test" });
});

defineSeed("S-M15-03-CBPAGEFREE-004", { needs: ["S-M15-03-QM-ADM"] }, async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 管理画面(browser, async (p) => {
    const 基 = 語CB004();
    const F = `${基}-フォーマット`, A = `${基}-型`;
    await フォーマットを登録する(p, { 名日: F, 名英: `${基}-Format`, 並び順: "9304", メタ日数: "14", チェック: { rankingFlg: true } }, seed.シードID);
    await アーキタイプを登録する(p, { 日: A, 英: `${基}-Type`, フォーマット: F, 公開状態: "公開" });
    for (let i = 1; i <= 14; i++) {
      const nn = String(i).padStart(2, "0");
      await デッキを登録する(p, {
        デッキタイプ: "event", フォーマット: F, アーキタイプ: A, 公開状態: "公開", リスト非公開: false,
        プレイヤー名: 選手名(nn), イベント名日: `${基}-大会`, イベント名英: `${基}-Event`, 開催日: "2025-03-10T10:00", 順位: String(i), 成績: `${基}-成績${nn}`, 参加人数: "18",
      }, issue);
    }
  });
});
